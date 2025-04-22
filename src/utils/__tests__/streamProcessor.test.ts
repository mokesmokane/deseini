import { processStreamData, StreamState, calculateDatesFromDependencies } from '../streamProcessor';
import { BufferedAction } from '../types';
import { Task } from '../../contexts/DraftPlan/DraftPlanContextMermaid';

describe('streamProcessor', () => {
  // Initial test state setup
  const createInitialStreamState = (): StreamState => ({
    mermaidData: '',
    completeLines: [],
    inMermaidBlock: false,
    currentSection: null,
    allSections: new Set<string>(),
    lastHeader: null
  });

  const createEmptyActionBuffer = (): BufferedAction[] => [];

  const createEmptyPendingTimelineUpdate = () => ({
    hasUpdate: false,
    newTimeline: null
  });

  const createEmptyTaskDictionary = (): Record<string, Task> => ({});

  describe('processStreamData', () => {
    test('should process a single complete line with a mermaid block start', () => {
      // Setup
      const content = "```mermaid\n";
      const streamState = createInitialStreamState();
      const actionBuffer = createEmptyActionBuffer();
      const pendingTimelineUpdate = createEmptyPendingTimelineUpdate();
      const taskDictionary = createEmptyTaskDictionary();
      
      // Execute
      const result = processStreamData(content, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify
      expect(result.updatedStreamState.inMermaidBlock).toBe(true);
      expect(result.updatedStreamState.mermaidData).toBe('');
      expect(result.updatedActionBuffer).toEqual([]);
    });

    test('should process a gantt chart declaration', () => {
      // Setup
      const content = "gantt\n";
      const streamState = {
        ...createInitialStreamState(),
        inMermaidBlock: true
      };
      const actionBuffer = createEmptyActionBuffer();
      const taskDictionary = createEmptyTaskDictionary();
      
      // Execute
      const result = processStreamData(content, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify
      expect(result.newStreamSummary).toBe('Creating Gantt chart');
      expect(result.updatedStreamState.completeLines).toContain('gantt');
    });

    test('should process a section declaration', () => {
      // Setup
      const content = "section Test Section\n";
      const streamState = {
        ...createInitialStreamState(),
        inMermaidBlock: true
      };
      const actionBuffer = createEmptyActionBuffer();
      const taskDictionary = createEmptyTaskDictionary();
      
      // Execute
      const result = processStreamData(content, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify
      expect(result.updatedStreamState.currentSection).toBe('Test Section');
      expect(result.updatedActionBuffer.length).toBe(1);
      expect(result.updatedActionBuffer[0].type).toBe('ADD_SECTION');
      expect(result.updatedActionBuffer[0].payload.name).toBe('Test Section');
    });

    test('should not add duplicate sections', () => {
      // Setup
      const content = "section Test Section\n";
      const streamState = {
        ...createInitialStreamState(),
        inMermaidBlock: true,
        currentSection: 'Test Section',
        allSections: new Set(['Test Section'])
      };
      const actionBuffer = createEmptyActionBuffer();
      const taskDictionary = createEmptyTaskDictionary();
      
      // Execute
      const result = processStreamData(content, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify
      expect(result.updatedActionBuffer.length).toBe(0);
    });

    test('should process a task with explicit dates', () => {
      // Setup
      const content = "Task 1: t1, 2024-04-15, 5d\n";
      const streamState = {
        ...createInitialStreamState(),
        inMermaidBlock: true,
        currentSection: 'Test Section'
      };
      const actionBuffer = createEmptyActionBuffer();
      const taskDictionary = createEmptyTaskDictionary();
      
      // Execute
      const result = processStreamData(content, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify
      expect(result.updatedActionBuffer.length).toBe(1);
      expect(result.updatedActionBuffer[0].type).toBe('ADD_TASK');
      expect(result.updatedActionBuffer[0].payload.sectionName).toBe('Test Section');
      expect(result.updatedActionBuffer[0].payload.task.id).toBe('t1');
      expect(result.updatedActionBuffer[0].payload.task.label).toBe('Task 1');
      expect(result.updatedActionBuffer[0].payload.task.startDate).toEqual(new Date('2024-04-15'));
      expect(result.updatedActionBuffer[0].payload.task.duration).toBe(5);
      
      // Verify task is added to dictionary
      expect(result.updatedTaskDictionary['t1']).toBeDefined();
    });

    test('should process a task with dependencies and calculate dates', () => {
      // Setup - First create a task dictionary with the dependency task
      const taskDictionary: Record<string, Task> = {
        't1': {
          id: 't1',
          type: 'task',
          label: 'Task 1',
          startDate: new Date('2024-04-15'),
          duration: 5,
          endDate: new Date('2024-04-20')
        }
      };
      
      // Now add a dependent task
      const content = "Task 2: t2, after t1, 10d\n";
      const streamState = {
        ...createInitialStreamState(),
        inMermaidBlock: true,
        currentSection: 'Test Section'
      };
      const actionBuffer = createEmptyActionBuffer();
      
      // Execute
      const result = processStreamData(content, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify
      expect(result.updatedActionBuffer.length).toBe(1);
      expect(result.updatedActionBuffer[0].type).toBe('ADD_TASK');
      
      const task = result.updatedActionBuffer[0].payload.task;
      expect(task.id).toBe('t2');
      expect(task.dependencies).toEqual(['t1']);
      expect(task.duration).toBe(10);
      
      // Check that dates were calculated based on dependency
      expect(task.startDate).toEqual(new Date('2024-04-21')); // Day after t1 ends
      expect(task.endDate).toEqual(new Date('2024-04-30')); // 10 days after start
      
      // Verify task dictionary was updated
      expect(result.updatedTaskDictionary['t2']).toBeDefined();
      expect(result.updatedTaskDictionary['t1']).toBeDefined();
    });

    test('should process a milestone with dependencies', () => {
      // Setup - Create task dictionary with dependency
      const taskDictionary: Record<string, Task> = {
        't3': {
          id: 't3',
          type: 'task',
          label: 'Task 3',
          startDate: new Date('2024-04-25'),
          duration: 5,
          endDate: new Date('2024-04-30')
        }
      };
      
      const content = "Completion of Initial Design Theme: milestone, after t3\n";
      const streamState = {
        ...createInitialStreamState(),
        inMermaidBlock: true,
        currentSection: 'Test Section'
      };
      const actionBuffer = createEmptyActionBuffer();
      
      // Execute
      const result = processStreamData(content, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify
      expect(result.updatedActionBuffer.length).toBe(1);
      expect(result.updatedActionBuffer[0].type).toBe('ADD_MILESTONE');
      
      const milestone = result.updatedActionBuffer[0].payload.milestone;
      expect(milestone.id).toBe('completion_of_initial_design_theme');
      expect(milestone.dependencies).toEqual(['t3']);
      
      // Check that date was calculated based on dependency
      expect(milestone.startDate).toEqual(new Date('2024-05-01')); // Day after t3 ends
    });

    test('should process the end of a mermaid block and trigger dependency resolution', () => {
      // Setup - First create a mermaid block with tasks
      const content1 = "```mermaid\ngantt\nsection Test Section\nTask 1: t1, 2024-04-15, 5d\n";
      const streamState1 = createInitialStreamState();
      const actionBuffer1 = createEmptyActionBuffer();
      const taskDictionary1 = createEmptyTaskDictionary();
      
      const result1 = processStreamData(content1, streamState1, actionBuffer1, undefined, taskDictionary1);
      
      // Now end the mermaid block
      const content2 = "```\n";
      
      // Execute
      const result2 = processStreamData(
        content2, 
        result1.updatedStreamState, 
        result1.updatedActionBuffer, 
        undefined,
        result1.updatedTaskDictionary
      );
      
      // Verify
      // Should have the original actions plus a PROCESS_DEPENDENCIES action
      expect(result2.updatedActionBuffer.length).toBe(result1.updatedActionBuffer.length + 1);
      expect(result2.updatedActionBuffer[result2.updatedActionBuffer.length - 1].type).toBe('PROCESS_DEPENDENCIES');
      expect(result2.updatedStreamState.inMermaidBlock).toBe(false);
      expect(result2.newStreamSummary).toBe('Done creating Gantt chart');
    });

    test('should track partial lines across chunks', () => {
      // Setup - First chunk with incomplete line
      const chunk1 = "```mermaid\ngan";
      const streamState = createInitialStreamState();
      const actionBuffer = createEmptyActionBuffer();
      const taskDictionary = createEmptyTaskDictionary();
      
      // Execute first chunk
      const result1 = processStreamData(chunk1, streamState, actionBuffer, undefined, taskDictionary);
      
      // Verify partial data is stored
      expect(result1.updatedStreamState.mermaidData).toBe('gan');
      expect(result1.updatedStreamState.inMermaidBlock).toBe(true);
      
      // Continue with second chunk that completes the gantt line and adds section
      const chunk2 = "tt\nsection Test\n";
      
      // Execute second chunk
      const result2 = processStreamData(
        chunk2,
        result1.updatedStreamState,
        result1.updatedActionBuffer,
        undefined,
        result1.updatedTaskDictionary
      );
      
      // Verify the combined partial line was processed correctly
      expect(result2.updatedStreamState.completeLines).toContain('gantt');
      expect(result2.newStreamSummary).toBe('Creating Gantt chart');
      expect(result2.updatedStreamState.currentSection).toBe('Test');
    });

    test('should handle full mermaid gantt syntax from the example', () => {
      // Setup - Create a complete mermaid block from the example
      const mermaidContent = `\`\`\`mermaid
gantt
    title Piëch GT 2+2 Concept to Scale Model Project Timeline
    dateFormat YYYY-MM-DD
    section Exterior Concept Design
        Initial Theme Ideation and Sketching: t1, 2024-04-15, 5d
        Theme Development and Refinement: t2, after t1, 10d
        2D/3D Presentation Preparation: t3, after t2, 5d
        Completion of Initial Design Theme: milestone, after t3
    section Digital Modelling
        Proportion Model Creation in Alias: t4, after t3, 8d
\`\`\`
`;
      
      // Split into chunks to simulate streaming
      const chunks = mermaidContent.split('\n').map(line => line + '\n');
      
      let currentState = createInitialStreamState();
      let currentActionBuffer = createEmptyActionBuffer();
      let currentPendingTimelineUpdate = createEmptyPendingTimelineUpdate();
      let currentTaskDictionary = createEmptyTaskDictionary();
      
      // Process each chunk
      chunks.forEach(chunk => {
        const result = processStreamData(
          chunk,
          currentState,
          currentActionBuffer,
          undefined,
          currentTaskDictionary
        );
        
        currentState = result.updatedStreamState;
        currentActionBuffer = result.updatedActionBuffer;
        currentTaskDictionary = result.updatedTaskDictionary;
      });
      
      // Verify the actions match what we expect
      const sectionActions = currentActionBuffer.filter(action => action.type === 'ADD_SECTION');
      expect(sectionActions.length).toBe(2);
      expect(sectionActions[0].payload.name).toBe('Exterior Concept Design');
      expect(sectionActions[1].payload.name).toBe('Digital Modelling');
      
      const taskActions = currentActionBuffer.filter(action => action.type === 'ADD_TASK');
      expect(taskActions.length).toBe(4);
      expect(taskActions[0].payload.task.id).toBe('t1');
      expect(taskActions[1].payload.task.id).toBe('t2');
      expect(taskActions[2].payload.task.id).toBe('t3');
      expect(taskActions[3].payload.task.id).toBe('t4');
      
      const milestoneActions = currentActionBuffer.filter(action => action.type === 'ADD_MILESTONE');
      expect(milestoneActions.length).toBe(1);
      expect(milestoneActions[0].payload.milestone.id).toBe('completion_of_initial_design_theme');
      
      const dependencyActions = currentActionBuffer.filter(action => action.type === 'PROCESS_DEPENDENCIES');
      expect(dependencyActions.length).toBe(1);
      
      // Verify task dictionary contains all tasks and their dates are properly calculated
      expect(Object.keys(currentTaskDictionary).length).toBe(5); // 4 tasks + 1 milestone
      
      // Verify chain of dependencies
      // t1 starts on 2024-04-15 for 5 days (ends 2024-04-20)
      // t2 should start on 2024-04-21 for 10 days (ends 2024-04-30)
      // t3 should start on 2024-05-01 for 5 days (ends 2024-05-05)
      // completion milestone should be on 2024-05-06
      // t4 should start on 2024-05-06 for 8 days
      
      if (currentTaskDictionary['t2'].startDate) {
        expect(currentTaskDictionary['t2'].startDate).toEqual(new Date('2024-04-21'));
        expect(currentTaskDictionary['t2'].endDate).toEqual(new Date('2024-04-30'));
      }
      
      if (currentTaskDictionary['t3'].startDate) {
        expect(currentTaskDictionary['t3'].startDate).toEqual(new Date('2024-05-01'));
        expect(currentTaskDictionary['t3'].endDate).toEqual(new Date('2024-05-05'));
      }
      
      if (currentTaskDictionary['completion_of_initial_design_theme'].startDate) {
        expect(currentTaskDictionary['completion_of_initial_design_theme'].startDate).toEqual(new Date('2024-05-06'));
      }
      
      if (currentTaskDictionary['t4'].startDate) {
        expect(currentTaskDictionary['t4'].startDate).toEqual(new Date('2024-05-06'));
        expect(currentTaskDictionary['t4'].endDate).toEqual(new Date('2024-05-13'));
      }
    });

    test('should handle multiple chunks of streaming data', () => {
      // Setup - Simulate receiving the mermaid content in chunks
      const chunks = [
        "```mermaid\n",
        "gantt\n",
        "section Test Section\n",
        "Task 1: t1, 2024-04-15, 5d\n",
        "Task 2: t2, after t1, 10d\n",
        "```\n"
      ];
      
      let currentState = createInitialStreamState();
      let currentActionBuffer = createEmptyActionBuffer();
      let currentPendingTimelineUpdate = createEmptyPendingTimelineUpdate();
      let currentTaskDictionary: Record<string, Task> = {};
      
      // Execute - Process each chunk
      chunks.forEach(chunk => {
        const result = processStreamData(
          chunk,
          currentState,
          currentActionBuffer,
          undefined,
          currentTaskDictionary
        );
        
        currentState = result.updatedStreamState;
        currentActionBuffer = result.updatedActionBuffer;
        currentTaskDictionary = result.updatedTaskDictionary;
      });
      
      // Verify
      expect(currentActionBuffer.length).toBe(4); // Section, Task1, Task2, PROCESS_DEPENDENCIES
      expect(currentState.inMermaidBlock).toBe(false);
      
      // Verify tasks were added correctly
      const taskActions = currentActionBuffer.filter(action => action.type === 'ADD_TASK');
      expect(taskActions.length).toBe(2);
      expect(taskActions[0].payload.task.id).toBe('t1');
      expect(taskActions[1].payload.task.id).toBe('t2');
      expect(taskActions[1].payload.task.dependencies).toEqual(['t1']);
      
      // Verify task dictionary has both tasks
      expect(currentTaskDictionary['t1']).toBeDefined();
      expect(currentTaskDictionary['t2']).toBeDefined();
      
      // Verify t2 has dates calculated based on t1
      if (currentTaskDictionary['t2'].startDate) {
        expect(currentTaskDictionary['t2'].startDate).toEqual(new Date('2024-04-21')); // Day after t1
      }
    });
  });

  describe('calculateDatesFromDependencies', () => {
    test('should calculate correct dates for a task with dependencies', () => {
      // Setup
      const taskDictionary: Record<string, Task> = {
        't1': {
          id: 't1',
          type: 'task',
          label: 'Task 1',
          startDate: new Date('2024-04-15'),
          duration: 5,
          endDate: new Date('2024-04-20')
        }
      };
      
      const taskWithDependency: Task = {
        id: 't2',
        type: 'task',
        label: 'Task 2',
        duration: 10,
        dependencies: ['t1'],
        startDate: undefined, // Add undefined to satisfy TypeScript
        endDate: undefined // Add undefined to satisfy TypeScript
      };
      
      // Execute
      const result = calculateDatesFromDependencies(taskWithDependency, taskDictionary);
      
      // Verify
      expect(result.startDate).toEqual(new Date('2024-04-21')); // Day after t1 ends
      expect(result.endDate).toEqual(new Date('2024-04-30')); // 10 days after start
    });
    
    test('should calculate correct date for a milestone with dependencies', () => {
      // Setup
      const taskDictionary: Record<string, Task> = {
        't3': {
          id: 't3',
          type: 'task',
          label: 'Task 3',
          startDate: new Date('2024-04-25'),
          duration: 5,
          endDate: new Date('2024-04-30')
        }
      };
      
      const milestoneWithDependency: Task = {
        id: 'milestone1',
        type: 'milestone',
        label: 'Milestone 1',
        dependencies: ['t3'],
        startDate: new Date('2024-04-25')
      };
      
      // Execute
      const result = calculateDatesFromDependencies(milestoneWithDependency, taskDictionary);
      
      // Verify
      expect(result.startDate).toEqual(new Date('2024-05-01')); // Day after t3 ends
    });
    
    test('should not modify tasks that already have start dates', () => {
      // Setup
      const taskDictionary: Record<string, Task> = {
        't1': {
          id: 't1',
          type: 'task',
          label: 'Task 1',
          startDate: new Date('2024-04-15'),
          duration: 5,
          endDate: new Date('2024-04-20')
        }
      };
      
      const taskWithStartDate: Task = {
        id: 't2',
        type: 'task',
        label: 'Task 2',
        startDate: new Date('2024-04-25'), // Explicitly set
        duration: 10,
        dependencies: ['t1'] // Even with dependencies, should use explicit date
      };
      
      // Execute
      const result = calculateDatesFromDependencies(taskWithStartDate, taskDictionary);
      
      // Verify - should not modify the dates
      expect(result.startDate).toEqual(new Date('2024-04-25'));
      expect(result.duration).toEqual(10);
    });
    
    test('should handle missing dependencies gracefully', () => {
      // Setup
      const taskDictionary: Record<string, Task> = {};
      
      const taskWithMissingDependency: Task = {
        id: 't2',
        type: 'task',
        label: 'Task 2',
        duration: 10,
        dependencies: ['missing'],
        startDate: undefined, // Add undefined to satisfy TypeScript
        endDate: undefined // Add undefined to satisfy TypeScript
      };
      
      // Execute
      const result = calculateDatesFromDependencies(taskWithMissingDependency, taskDictionary);
      
      // Verify - should return original task unchanged
      expect(result).toEqual(taskWithMissingDependency);
      expect(result.startDate).toBeUndefined();
    });
  });
});
