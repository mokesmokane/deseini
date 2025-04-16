import { 
  createMilestoneId, 
  createMilestone, 
  createMilestoneWithDependency, 
  parseMermaidLine,
  processMultipleMermaidLines
} from '../mermaidParser';

describe('mermaidParser', () => {
  describe('createMilestoneId', () => {
    test('should create a slugified ID from milestone name', () => {
      expect(createMilestoneId('Milestone 1')).toBe('milestone_1');
      expect(createMilestoneId('Project Kickoff!')).toBe('project_kickoff');
      expect(createMilestoneId('End of Phase #2')).toBe('end_of_phase_2');
    });
  });

  describe('createMilestone', () => {
    test('should create a milestone with a specific date', () => {
      const result = createMilestone('Project Launch', '2025-06-30');
      
      expect(result).toEqual({
        id: 'project_launch',
        type: 'milestone',
        label: 'Project Launch',
        startDate: new Date('2025-06-30'),
        date: new Date('2025-06-30')
      });
    });
  });

  describe('createMilestoneWithDependency', () => {
    test('should create a milestone with dependency', () => {
      const result = createMilestoneWithDependency('Project Launch', 'task1');
      
      expect(result).toEqual({
        id: 'project_launch',
        type: 'milestone',
        label: 'Project Launch',
        startDate: undefined, // Will be resolved later
        dependencies: ['task1']
      });
    });
  });

  describe('parseMermaidLine', () => {
    test('should parse a section line', () => {
      const result = parseMermaidLine('section Phase 1', null);
      
      expect(result).toEqual({
        type: 'section',
        payload: { name: 'Phase 1' }
      });
    });

    test('should skip mermaid directives', () => {
      expect(parseMermaidLine('```mermaid', 'Current Section')).toEqual({ type: 'skip', payload: null });
      expect(parseMermaidLine('```', 'Current Section')).toEqual({ type: 'skip', payload: null });
      expect(parseMermaidLine('gantt', 'Current Section')).toEqual({ type: 'skip', payload: null });
      expect(parseMermaidLine('title My Project', 'Current Section')).toEqual({ type: 'skip', payload: null });
      expect(parseMermaidLine('dateFormat YYYY-MM-DD', 'Current Section')).toEqual({ type: 'skip', payload: null });
    });

    test('should skip lines if not in a section', () => {
      const result = parseMermaidLine('Task 1:t1, 2025-01-01, 10d', null);
      
      expect(result).toEqual({ 
        type: 'skip', 
        payload: null 
      });
    });

    test('should parse a milestone with specific date', () => {
      const result = parseMermaidLine('Launch: milestone, 2025-06-30', 'Phase 1');
      
      expect(result).toEqual({
        type: 'milestone',
        payload: {
          sectionName: 'Phase 1',
          milestone: {
            id: 'launch',
            type: 'milestone',
            label: 'Launch',
            startDate: new Date('2025-06-30'),
            date: new Date('2025-06-30')
          }
        }
      });
    });

    test('should parse a milestone with dependency', () => {
      const result = parseMermaidLine('Launch: milestone, after t1', 'Phase 1');
      
      expect(result).toEqual({
        type: 'milestone',
        payload: {
          sectionName: 'Phase 1',
          milestone: {
            id: 'launch',
            type: 'milestone',
            label: 'Launch',
            startDate: undefined, // Will be resolved later
            dependencies: ['t1']
          }
        }
      });
    });

    test('should parse a task with specific date and duration', () => {
      const result = parseMermaidLine('Design:t1, 2025-01-01, 10d', 'Phase 1');
      
      expect(result).toEqual({
        type: 'task',
        payload: {
          sectionName: 'Phase 1',
          task: {
            id: 't1',
            type: 'task',
            label: 'Design',
            startDate: new Date('2025-01-01'),
            duration: 10,
            dependencies: undefined,
            endDate: new Date('2025-01-11') // 10 days after start date
          }
        }
      });
    });

    test('should parse a task with dependency', () => {
      const result = parseMermaidLine('Development:t2, after t1, 15d', 'Phase 1');
      
      expect(result).toEqual({
        type: 'task',
        payload: {
          sectionName: 'Phase 1',
          task: {
            id: 't2',
            type: 'task',
            label: 'Development',
            startDate: undefined, // Will be resolved later
            duration: 15,
            dependencies: ['t1']
          }
        }
      });
    });

    test('should parse general task syntax', () => {
      const result = parseMermaidLine('Testing:t3, 2025-02-01, 5d', 'Phase 1');
      
      expect(result).toEqual({
        type: 'task',
        payload: {
          sectionName: 'Phase 1',
          task: {
            id: 't3',
            type: 'task',
            label: 'Testing',
            startDate: new Date('2025-02-01'),
            duration: 5,
            dependencies: undefined,
            endDate: new Date('2025-02-06') // 5 days after start date
          }
        }
      });
    });
  });

  describe('processMultipleMermaidLines', () => {
    test('should process multiple lines of mermaid syntax', () => {
      const lines = [
        '```mermaid',
        'gantt',
        'section Phase 1',
        'Design:t1, 2025-01-01, 10d',
        'Development:t2, after t1, 15d',
        'section Phase 2',
        'Testing:t3, after t2, 5d',
        'Launch: milestone, after t3',
        '```'
      ];
      
      const result = processMultipleMermaidLines(lines);
      
      // Verify sections were processed
      expect(result.sections.has('Phase 1')).toBe(true);
      expect(result.sections.has('Phase 2')).toBe(true);
      
      // Verify tasks were added to dictionary
      expect(result.tasks['t1']).toBeDefined();
      expect(result.tasks['t2']).toBeDefined();
      expect(result.tasks['t3']).toBeDefined();
      expect(result.tasks['launch']).toBeDefined();
      
      // Verify the correct number of results
      expect(result.parsedResults.length).toBe(9);
      
      // Verify section types
      const sectionResults = result.parsedResults.filter(r => r.type === 'section');
      expect(sectionResults.length).toBe(2);
      
      // Verify task types
      const taskResults = result.parsedResults.filter(r => r.type === 'task');
      expect(taskResults.length).toBe(3);
      
      // Verify milestone types
      const milestoneResults = result.parsedResults.filter(r => r.type === 'milestone');
      expect(milestoneResults.length).toBe(1);
      
      // Verify skip types
      const skipResults = result.parsedResults.filter(r => r.type === 'skip');
      expect(skipResults.length).toBe(3); // ```mermaid, gantt, ```
    });

    test('should parse a complete Piech GT 2+2 concept Gantt chart', () => {
      const mermaidSyntax = `
gantt
    title Project Timeline for Piech GT 2+2 GT Car Concept Design
    dateFormat YYYY-MM-DD

    section Develop Design Theme
    Freehand Sketching: t1, 2024-01-10, 14d
    Computer-Based Modelling: t2, after t1, 21d
    Developed Design Theme: milestone, after t2

    section Create 25% Scale Model
    Alias Modelling: t3, after t2, 30d

    section Produce CG and Studio Renders
    Render Creation: t4, after t3, 21d
    Animations: t5, after t4, 14d
    Outdoor and Studio Renders & Turntable: milestone, after t5

    section Final Surface Sign-Off
    Final Surface Sign-Off Pre-Pebble Beach: milestone, after t5
`;

      // Convert the string into lines for processing
      const lines = mermaidSyntax.trim().split('\n');
      
      // Process the mermaid syntax lines
      const results = processMultipleMermaidLines(lines);
      
      // Verify all sections were detected
      expect(results.sections.has('Develop Design Theme')).toBe(true);
      expect(results.sections.has('Create 25% Scale Model')).toBe(true);
      expect(results.sections.has('Produce CG and Studio Renders')).toBe(true);
      expect(results.sections.has('Final Surface Sign-Off')).toBe(true);
      
      // Verify all tasks were detected
      expect(results.tasks['t1']).toBeDefined();
      expect(results.tasks['t2']).toBeDefined();
      expect(results.tasks['t3']).toBeDefined();
      expect(results.tasks['t4']).toBeDefined();
      expect(results.tasks['t5']).toBeDefined();
      
      // Verify milestones were detected (they use slugified IDs from their names)
      expect(results.tasks['developed_design_theme']).toBeDefined();
      expect(results.tasks['outdoor_and_studio_renders_turntable']).toBeDefined();
      expect(results.tasks['final_surface_sign_off_pre_pebble_beach']).toBeDefined();
      
      // Verify specific task details
      expect(results.tasks['t1'].label).toBe('Freehand Sketching');
      expect(results.tasks['t1'].startDate).toEqual(new Date('2024-01-10'));
      expect(results.tasks['t1'].duration).toBe(14);
      
      // Verify dependencies
      expect(results.tasks['t2'].dependencies).toEqual(['t1']);
      expect(results.tasks['t3'].dependencies).toEqual(['t2']);
      expect(results.tasks['t4'].dependencies).toEqual(['t3']);
      expect(results.tasks['t5'].dependencies).toEqual(['t4']);
      
      // Verify milestone dependencies
      expect(results.tasks['developed_design_theme'].dependencies).toEqual(['t2']);
      expect(results.tasks['outdoor_and_studio_renders_turntable'].dependencies).toEqual(['t5']);
      expect(results.tasks['final_surface_sign_off_pre_pebble_beach'].dependencies).toEqual(['t5']);
      
      // Verify we identified correct number of tasks, milestones, and sections
      const tasks = Object.values(results.tasks).filter(task => task.type === 'task');
      const milestones = Object.values(results.tasks).filter(task => task.type === 'milestone');
      
      expect(tasks.length).toBe(5); // t1 through t5
      expect(milestones.length).toBe(3); // The three milestones
      expect(results.sections.size).toBe(4); // The four sections
      
      // Verify correct number of parsed results (including skips)
      // 1 for gantt line, 1 for title, 1 for dateFormat, 4 for sections, 5 for tasks, 3 for milestones
      const nonSkipResults = results.parsedResults.filter(r => r.type !== 'skip');
      expect(nonSkipResults.length).toBe(4 + 5 + 3); // Sections + Tasks + Milestones
    });
  });
});
