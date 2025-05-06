import { ganttString, ganttString3 } from './stream_data';
import { sseStreamToText } from '../streamHandler';
import { streamByLine } from '../streamLines';
import { describe} from 'vitest';
import { processAction, AppState } from '../actionProcessor';

const chunks = ganttString.split('\nGantt chunk: ');

//looks like thiswhen joined:
// mermaid
// gantt
//     title Compostable Packaging Material Project Timeline
//     dateFormat YYYY-MM-DD
//     %% MONTH 1: Material Research & Specification
//     section Material Research & Specification
//       Review existing compostable materials: t1, 2025-06-01, 7d
//       Define material properties & requirements: t2, after t1, 5d
//       Draft technical specification document: t3, after t2, 8d
//       Technical specification document completed: milestone, after t3

//     %% MONTH 2: Prototype Development & Initial Testing
//     section Prototype Development
//       Create initial prototypes for various food types: t4, after t3, 8d
//       Refine prototypes based on findings: t5, after t12, 10d

//     section Testing & Validation
//       Conduct initial lab tests (degradation, safety, durability): t12, after t4, 10d
//       Document initial test results: t13, after t12, 3d
//       Successful lab test results (≤7 days): milestone, after t13

//     %% MONTH 3: Prototype Refinement & Extended Testing
//       Conduct extended lab testing: t14, after t5, 7d
//       Document extended test results: t15, after t14, 4d
//       Approved packaging prototypes (dry & wet foods): milestone, after t15

//     %% MONTH 4: Design & Assessment
//     section Design & Assessment
//       Develop packaging design mockups (3 versions): t6, after t15, 8d
//       Packaging design mockups finalized: milestone, after t6
//       Perform environmental impact assessment: t7, after t6, 7d
//       Environmental impact assessment report delivered: milestone, after t7

//     %% MONTH 5: Compliance & User Pilot
//     section Compliance & Regulatory
//       Review FDA, EU, and other regulatory standards: t8, after t7, 8d
//       Compile regulatory compliance checklist: t9, after t8, 7d
//       Regulatory compliance checklist signed off: milestone, after t9

//     section User Testing
//       Organize pilot user test: t10, after t9, 7d

//     %% MONTH 6: User Feedback & Closure
//       Collect & summarize user feedback: t11, after t10, 8d
//       User feedback summary delivered: milestone, after t11
//       Final project documentation & closure: t16, after t11, 10d

// --- STREAMING MERMAID SYNTAX UNIT TESTS ---
import { processMermaidStreamData } from '../streamProcessor';
import { StreamState } from '../types';
import { BufferedAction } from '../types';
import { expect, it } from 'vitest';
describe('Mermaid Gantt Streaming', () => {
  function getInitialStreamState(): StreamState {
    return {
      mermaidData: '',
      completeLines: [],
      inMermaidBlock: false,
      currentSection: null,
      allSections: new Set(),
      lastHeader: null,
      streamSummary: {
        thinking: [],
        sketchSummary: undefined,
        mermaidMarkdown: undefined,
        allText: undefined,
      },
    };
  }

  function expectTasksToMatch(keyedTasks: Record<string, any>, criteria: {
    id: string,
    sectionName?: string,
    label: string,
    dependencies?: string[] | undefined,
  }) {
    expect(keyedTasks[criteria.id]).toBeDefined();
    expect(keyedTasks[criteria.id].sectionName).toEqual(criteria.sectionName);
    expect(keyedTasks[criteria.id].task.label).toEqual(criteria.label);
    expect(keyedTasks[criteria.id].task.dependencies).toEqual(criteria.dependencies);
  }

  function expectMilestonesToMatch(keyedMilestones: Record<string, any>, criteria: {
    id: string,
    sectionName?: string,
    label: string,
    dependencies?: string[] | undefined,
  }) {
    expect(keyedMilestones[criteria.id]).toBeDefined();
    expect(keyedMilestones[criteria.id].sectionName).toEqual(criteria.sectionName);
    expect(keyedMilestones[criteria.id].milestone.label).toEqual(criteria.label);
    expect(keyedMilestones[criteria.id].milestone.dependencies).toEqual(criteria.dependencies);
  }

  function expectSectionsToMatch(keyedSections: Record<string, any>, criteria: {
    name: string,
  }) {
    expect(keyedSections[criteria.name]).toBeDefined();
    expect(keyedSections[criteria.name].name).toEqual(criteria.name); 
  }

  it('should handle incomplete chunks gracefully', () => {
    console.log(chunks.join(''));
    console.log("mokes");
  });

  const turnStreamIntoLines = async (stream: ReadableStream<string>) => {
    const reader = stream.getReader();
    const lines: string[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      lines.push(value);
    }
    return lines;
  };

  it('should reconstruct the correct Mermaid markdown from streamed chunks',() => {
    // Arrange
    const chunks = ganttString.split('\nGantt chunk: ');
    const stream = new ReadableStream({
      //turn chunks into a stream
      start(controller) {
        const encoder = new TextEncoder();
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
    let textStream = sseStreamToText(stream); 
    let linesStream = streamByLine(textStream);  
      
    let streamState = getInitialStreamState();

    // Act: simulate streaming
    turnStreamIntoLines(linesStream).then(lines => {
      
    let actionBuffer: BufferedAction[] = [];
    let taskDictionary = {};
    let timeline = undefined;
    try {
      for (const line of lines) {
        console.log(line);
        const { updatedStreamState, updatedActionBuffer, updatedTimeline, updatedTaskDictionary } = processMermaidStreamData(line, streamState, actionBuffer, timeline, taskDictionary);
        streamState = updatedStreamState;
        actionBuffer = updatedActionBuffer;
        timeline = updatedTimeline;
        taskDictionary = updatedTaskDictionary;
      }
    } catch (error) {
      console.error('Error processing stream data:', error);
      console.log(streamState);
    }

    //split actin buffer into tasks, milestones, and sections
    const tasks = actionBuffer.filter(action => action.type === 'ADD_TASK');
    const milestones = actionBuffer.filter(action => action.type === 'ADD_MILESTONE');
    const sections = actionBuffer.filter(action => action.type === 'ADD_SECTION');

    // make dictionary of tasks
    const keyedTasks = tasks.reduce((acc, task) => {
      acc[task.payload.task.id] = task.payload;
      return acc;
    }, {} as Record<string, any>);

    const keyedMilestones = milestones.reduce((acc, milestone) => {
      acc[milestone.payload.milestone.id] = milestone.payload;
      return acc;
    }, {} as Record<string, any>);

    const keyedSections = sections.reduce((acc, section) => {
      acc[section.payload.name] = section.payload;
      return acc;
    }, {} as Record<string, any>);

    const sketchSummary = streamState.streamSummary.sketchSummary;
    expect(sketchSummary).toBeDefined();
    if (!sketchSummary) throw new Error('sketchSummary missing');
    expect(sketchSummary.duration).toBeGreaterThanOrEqual(0);
    expect(sketchSummary.startDate).toBeDefined();
    expect(sketchSummary.endDate).toBeDefined();
    expect(sketchSummary.startDate).toEqual(new Date('2025-06-01'));
    expect(sketchSummary.endDate).toEqual(new Date('2025-12-01'));
    // Spot check: for this gantt, we expect at least 16 tasks and 8 milestones
    expect(sketchSummary.totalTasks).toEqual(16);
    expect(sketchSummary.totalMilestones).toEqual(8);

    // Assert
    expect(streamState.streamSummary.mermaidMarkdown).toBeDefined();
    // Optionally: check that the output contains key lines
    expect(streamState.streamSummary.mermaidMarkdown).toContain('gantt');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('title Compostable Packaging Material Project Timeline');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('section Material Research & Specification');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Review existing compostable materials');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('```mermaid');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('title Compostable Packaging Material Project Timeline');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('dateFormat YYYY-MM-DD');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('%% MONTH 1: Material Research & Specification');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('section Material Research & Specification');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Review existing compostable materials: t1, 2025-06-01, 7d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Define material properties & requirements: t2, after t1, 5d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Draft technical specification document: t3, after t2, 8d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Technical specification document completed: milestone, after t3');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('%% MONTH 2: Prototype Development & Initial Testing');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('section Prototype Development');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Create initial prototypes for various food types: t4, after t3, 8d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Refine prototypes based on findings: t5, after t12, 10d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('section Testing & Validation');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Conduct initial lab tests (degradation, safety, durability): t12, after t4, 10d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Document initial test results: t13, after t12, 3d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Successful lab test results (≤7 days): milestone, after t13');
    // expect(streamState.streamSummary.mermaidMarkdown).toContain('%% MONTH 3: Prototype Refinement & Extended Testing');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Conduct extended lab testing: t14, after t5, 7d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Document extended test results: t15, after t14, 4d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Approved packaging prototypes (dry & wet foods): milestone, after t15');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('%% MONTH 4: Design & Assessment');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('section Design & Assessment');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Develop packaging design mockups (3 versions): t6, after t15, 8d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Packaging design mockups finalized: milestone, after t6');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Perform environmental impact assessment: t7, after t6, 7d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Environmental impact assessment report delivered: milestone, after t7');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('%% MONTH 5: Compliance & User Pilot');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('section Compliance & Regulatory');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Review FDA, EU, and other regulatory standards: t8, after t7, 8d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Compile regulatory compliance checklist: t9, after t8, 7d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Regulatory compliance checklist signed off: milestone, after t9');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('section User Testing');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Organize pilot user test: t10, after t9, 7d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('%% MONTH 6: User Feedback & Closure');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Collect & summarize user feedback: t11, after t10, 8d');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('User feedback summary delivered: milestone, after t11');
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Final project documentation & closure: t16, after t11, 10d')///

    // Check for all sections, tasks, and milestones in the action buffer using the helper
    // MONTH 1: Material Research & Specification
    expectSectionsToMatch(keyedSections, { name: 'Material Research & Specification' });
    expectTasksToMatch(keyedTasks, { id: 't1', sectionName: 'Material Research & Specification', label: 'Review existing compostable materials', dependencies: undefined });
    expectTasksToMatch(keyedTasks, { id: 't2', sectionName: 'Material Research & Specification', label: 'Define material properties & requirements', dependencies: ['t1'] });
    expectTasksToMatch(keyedTasks, { id: 't3', sectionName: 'Material Research & Specification', label: 'Draft technical specification document', dependencies: ['t2'] });
    expectMilestonesToMatch(keyedMilestones, { id: 'technical_specification_document_completed', sectionName: 'Material Research & Specification', label: 'Technical specification document completed', dependencies: ['t3'] });

    // MONTH 2: Prototype Development & Initial Testing
    expectSectionsToMatch(keyedSections, { name: 'Prototype Development' });
    expectTasksToMatch(keyedTasks, { id: 't4', sectionName: 'Prototype Development', label: 'Create initial prototypes for various food types', dependencies: ['t3'] });
    expectTasksToMatch(keyedTasks, { id: 't5', sectionName: 'Prototype Development', label: 'Refine prototypes based on findings', dependencies: ['t12'] });

    expectSectionsToMatch(keyedSections, { name: 'Testing & Validation' });
    expectTasksToMatch(keyedTasks, { id: 't12', sectionName: 'Testing & Validation', label: 'Conduct initial lab tests (degradation, safety, durability)', dependencies: ['t4'] });
    expectTasksToMatch(keyedTasks, { id: 't13', sectionName: 'Testing & Validation', label: 'Document initial test results', dependencies: ['t12'] });
    expectMilestonesToMatch(keyedMilestones, { id: 'successful_lab_test_results_7_days', sectionName: 'Testing & Validation', label: 'Successful lab test results (≤7 days)', dependencies: ['t13'] });

    // MONTH 3: Prototype Refinement & Extended Testing
    expectTasksToMatch(keyedTasks, { id: 't14', sectionName: 'Testing & Validation', label: 'Conduct extended lab testing', dependencies: ['t5'] });
    expectTasksToMatch(keyedTasks, { id: 't15', sectionName: 'Testing & Validation', label: 'Document extended test results', dependencies: ['t14'] });
    expectMilestonesToMatch(keyedMilestones, { id: 'approved_packaging_prototypes_dry_wet_foods', sectionName: 'Testing & Validation', label: 'Approved packaging prototypes (dry & wet foods)', dependencies: ['t15'] });

    // MONTH 4: Design & Assessment
    expectSectionsToMatch(keyedSections, { name: 'Design & Assessment' });
    expectTasksToMatch(keyedTasks, { id: 't6', sectionName: 'Design & Assessment', label: 'Develop packaging design mockups (3 versions)', dependencies: ['t15'] });
    expectMilestonesToMatch(keyedMilestones, { id: 'packaging_design_mockups_finalized', sectionName: 'Design & Assessment', label: 'Packaging design mockups finalized', dependencies: ['t6'] });
    expectTasksToMatch(keyedTasks, { id: 't7', sectionName: 'Design & Assessment', label: 'Perform environmental impact assessment', dependencies: ['t6'] });
    expectMilestonesToMatch(keyedMilestones, { id: 'environmental_impact_assessment_report_delivered', sectionName: 'Design & Assessment', label: 'Environmental impact assessment report delivered', dependencies: ['t7'] });

    // MONTH 5: Compliance & User Pilot
    expectSectionsToMatch(keyedSections, { name: 'Compliance & Regulatory' });
    expectTasksToMatch(keyedTasks, { id: 't8', sectionName: 'Compliance & Regulatory', label: 'Review FDA, EU, and other regulatory standards', dependencies: ['t7'] });
    expectTasksToMatch(keyedTasks, { id: 't9', sectionName: 'Compliance & Regulatory', label: 'Compile regulatory compliance checklist', dependencies: ['t8'] });
    expectMilestonesToMatch(keyedMilestones, { id: 'regulatory_compliance_checklist_signed_off', sectionName: 'Compliance & Regulatory', label: 'Regulatory compliance checklist signed off', dependencies: ['t9'] });

    expectSectionsToMatch(keyedSections, { name: 'User Testing' });
    expectTasksToMatch(keyedTasks, { id: 't10', sectionName: 'User Testing', label: 'Organize pilot user test', dependencies: ['t9'] });

    expectTasksToMatch(keyedTasks, { id: 't11', sectionName: 'User Testing', label: 'Collect & summarize user feedback', dependencies: ['t10'] });
    expectMilestonesToMatch(keyedMilestones, { id: 'user_feedback_summary_delivered', sectionName: 'User Testing', label: 'User feedback summary delivered', dependencies: ['t11'] });
    expectTasksToMatch(keyedTasks, { id: 't16', sectionName: 'User Testing', label: 'Final project documentation & closure', dependencies: ['t11'] });
  })
  });


  it('should handle incomplete chunks gracefully', () => {
    const partialChunks = ['mer', 'maid', ' ', 'gant', 't', ' ', 'title', ' Compostable'];
    let streamState = getInitialStreamState();
    const actionBuffer: BufferedAction[] = [];
    const taskDictionary: Record<string, any> = {};
    let timeline = undefined;
    for (const chunk of partialChunks) {
      const { updatedStreamState } = processMermaidStreamData(chunk, streamState, actionBuffer, timeline, taskDictionary);
      streamState = updatedStreamState;
    }
    // Should not throw, and should build up partial mermaidMarkdown
    expect(streamState.streamSummary.mermaidMarkdown).toBeDefined();
  });

  it('should handle ganttString3', () => {
    let streamState = getInitialStreamState();
    const lines = ganttString3.split('\n').map(line => line + '\n');
      let actionBuffer: BufferedAction[] = [];
      let taskDictionary = {};
      let timeline = undefined;
      try {
        for (const line of lines) {
          console.log(line);
          const { updatedStreamState, updatedActionBuffer, updatedTimeline, updatedTaskDictionary } = processMermaidStreamData(line, streamState, actionBuffer, timeline, taskDictionary);
          streamState = updatedStreamState;
          actionBuffer = updatedActionBuffer;
          timeline = updatedTimeline;
          taskDictionary = updatedTaskDictionary;
        }
      } catch (error) {
        console.error('Error processing stream data:', error);
        console.log(streamState);
      }
  
      //split actin buffer into tasks, milestones, and sections
      const tasks = actionBuffer.filter(action => action.type === 'ADD_TASK');
      const milestones = actionBuffer.filter(action => action.type === 'ADD_MILESTONE');
      const sections = actionBuffer.filter(action => action.type === 'ADD_SECTION');
  
      // make dictionary of tasks
      const keyedTasks = tasks.reduce((acc, task) => {
        acc[task.payload.task.id] = task.payload;
        return acc;
      }, {} as Record<string, any>);
  
      const keyedMilestones = milestones.reduce((acc, milestone) => {
        acc[milestone.payload.milestone.id] = milestone.payload;
        return acc;
      }, {} as Record<string, any>);
  
      const keyedSections = sections.reduce((acc, section) => {
        acc[section.payload.name] = section.payload;
        return acc;
      }, {} as Record<string, any>);
  
      const sketchSummary = streamState.streamSummary.sketchSummary;
      expect(sketchSummary).toBeDefined();
      if (!sketchSummary) throw new Error('sketchSummary missing');
      
      expect(sketchSummary.duration).toBeGreaterThanOrEqual(0);
      expect(sketchSummary.startDate).toBeDefined();
      expect(sketchSummary.endDate).toBeDefined();
      expect(sketchSummary.startDate).toEqual(new Date('2025-06-01'));
      
      // Calculate the expected end date based on the last task/milestone
      // The final milestone is after the 'present' task which is after 'manual' which is after 'report'
      // 'report' starts after the '3-month crop yield data collected' milestone
      // This milestone is after 'analyze_data' which is after 'monitor' (88d) which is after 'plant' (2d)
      // 'plant' starts after the 'Pilot Installation operational' milestone
      // expect(sketchSummary.totalTasks).toEqual(18);
      // expect(sketchSummary.totalMilestones).toEqual(6);

      // Assert
      expect(streamState.streamSummary.mermaidMarkdown).toBeDefined();
      // Check that the output contains key lines
      expect(streamState.streamSummary.mermaidMarkdown).toContain('gantt');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('title Vertical Farming Pilot Project Timeline');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('dateFormat YYYY-MM-DD');
      
      // Check for sections
      expect(streamState.streamSummary.mermaidMarkdown).toContain('section Site Analysis & Location Selection');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('section Modular System Design');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('section Resource Efficiency Planning');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('section Prototype Fabrication & Installation');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('section Operational Testing & Performance Measurement');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('section Documentation & Handover');
      
      // Check for specific tasks
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Research local urban sites: research, 2025-06-01, 7d');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Assess site constraints: assess, after research, 10d');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Prepare Site Analysis Report: prepare, after assess, 7d');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Completion of Site Analysis Report: milestone, after prepare');
      
      // Check for tasks in other sections
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Develop initial concepts and 3D models: develop, 2025-06-05, 10d');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Plant initial crop cycles: plant, after milestone, 2d');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Monitor yield, resource use, and reliability: monitor, after plant, 88d');
      expect(streamState.streamSummary.mermaidMarkdown).toContain('Final deliverables submitted: milestone, after present');

      // Check for sections, tasks, and milestones in the action buffer
      // Site Analysis & Location Selection
      expectSectionsToMatch(keyedSections, { name: 'Site Analysis & Location Selection' });
      expectTasksToMatch(keyedTasks, { id: 'research', sectionName: 'Site Analysis & Location Selection', label: 'Research local urban sites', dependencies: undefined });
      expectTasksToMatch(keyedTasks, { id: 'assess', sectionName: 'Site Analysis & Location Selection', label: 'Assess site constraints', dependencies: ['research'] });
      expectTasksToMatch(keyedTasks, { id: 'prepare', sectionName: 'Site Analysis & Location Selection', label: 'Prepare Site Analysis Report', dependencies: ['assess'] });
      expectMilestonesToMatch(keyedMilestones, { id: 'completion_of_site_analysis_report', sectionName: 'Site Analysis & Location Selection', label: 'Completion of Site Analysis Report', dependencies: ['prepare'] });

      // Modular System Design
      expectSectionsToMatch(keyedSections, { name: 'Modular System Design' });
      expectTasksToMatch(keyedTasks, { id: 'develop', sectionName: 'Modular System Design', label: 'Develop initial concepts and 3D models', dependencies: undefined });
      expectTasksToMatch(keyedTasks, { id: 'engineer', sectionName: 'Modular System Design', label: 'Engineer hydroponic/aeroponic modules', dependencies: ['develop'] });
      expectTasksToMatch(keyedTasks, { id: 'review', sectionName: 'Modular System Design', label: 'Review with stakeholders', dependencies: ['engineer'] });
      expectTasksToMatch(keyedTasks, { id: 'finalize', sectionName: 'Modular System Design', label: 'Finalize Modular Design Pack', dependencies: ['review'] });
      expectMilestonesToMatch(keyedMilestones, { id: 'approval_of_modular_design_pack', sectionName: 'Modular System Design', label: 'Approval of Modular Design Pack', dependencies: ['finalize'] });

      // Resource Efficiency Planning
      expectSectionsToMatch(keyedSections, { name: 'Resource Efficiency Planning' });
      expectTasksToMatch(keyedTasks, { id: 'analyze', sectionName: 'Resource Efficiency Planning', label: 'Analyze energy, water, nutrient needs', dependencies: undefined });
      expectTasksToMatch(keyedTasks, { id: 'integrate', sectionName: 'Resource Efficiency Planning', label: 'Integrate sustainable resource solutions', dependencies: ['analyze'] });
      expectTasksToMatch(keyedTasks, { id: 'draft', sectionName: 'Resource Efficiency Planning', label: 'Draft Resource Efficiency Plan', dependencies: ['integrate'] });
      expectMilestonesToMatch(keyedMilestones, { id: 'resource_efficiency_plan_finalized', sectionName: 'Resource Efficiency Planning', label: 'Resource Efficiency Plan finalized', dependencies: ['draft'] });

      // Prototype Fabrication & Installation
      expectSectionsToMatch(keyedSections, { name: 'Prototype Fabrication & Installation' });
      expectTasksToMatch(keyedTasks, { id: 'source', sectionName: 'Prototype Fabrication & Installation', label: 'Source materials and components', dependencies: ['resource_efficiency_plan_finalized'] });
      expectTasksToMatch(keyedTasks, { id: 'assemble', sectionName: 'Prototype Fabrication & Installation', label: 'Assemble and install prototype', dependencies: ['source'] });
      expectTasksToMatch(keyedTasks, { id: 'compliance', sectionName: 'Prototype Fabrication & Installation', label: 'Conduct safety and compliance checks', dependencies: ['assemble'] });
      expectMilestonesToMatch(keyedMilestones, { id: 'pilot_installation_operational', sectionName: 'Prototype Fabrication & Installation', label: 'Pilot Installation operational', dependencies: ['compliance'] });

      // Operational Testing & Performance Measurement
      expectSectionsToMatch(keyedSections, { name: 'Operational Testing & Performance Measurement' });
      expectTasksToMatch(keyedTasks, { id: 'plant', sectionName: 'Operational Testing & Performance Measurement', label: 'Plant initial crop cycles', dependencies: ['pilot_installation_operational'] });
      expectTasksToMatch(keyedTasks, { id: 'monitor', sectionName: 'Operational Testing & Performance Measurement', label: 'Monitor yield, resource use, and reliability', dependencies: ['plant'] });
      expectTasksToMatch(keyedTasks, { id: 'analyze_data', sectionName: 'Operational Testing & Performance Measurement', label: 'Collect and analyze performance data', dependencies: ['monitor'] });
      expectMilestonesToMatch(keyedMilestones, { id: '3-month_crop_yield_data_collected', sectionName: 'Operational Testing & Performance Measurement', label: '3-month crop yield data collected', dependencies: ['analyze_data'] });
    
      // Documentation & Handover
      expectSectionsToMatch(keyedSections, { name: 'Documentation & Handover' });
      expectTasksToMatch(keyedTasks, { id: 'report', sectionName: 'Documentation & Handover', label: 'Compile Crop Yield and Performance Report', dependencies: ['3-month_crop_yield_data_collected'] });
      expectTasksToMatch(keyedTasks, { id: 'manual', sectionName: 'Documentation & Handover', label: 'Create Maintenance and Operations Manual', dependencies: ['report'] });
      expectTasksToMatch(keyedTasks, { id: 'present', sectionName: 'Documentation & Handover', label: 'Final presentation to stakeholders', dependencies: ['manual'] });
      expectMilestonesToMatch(keyedMilestones, { id: 'final_deliverables_submitted', sectionName: 'Documentation & Handover', label: 'Final deliverables submitted', dependencies: ['present'] });
      
      // Now test the action processor directly
      console.log("Testing action processor directly");
      
      // Initialize an empty application state
      const appState: AppState = {
        x0Date: null,
        sections: [],
        timeline: undefined
      };
      
      // Process each action in the buffer through the action processor
      let currentState = appState;
      let currentTaskDictionary = {} as Record<string, any>;
      
      // Add debug logging to track the state changes
      for (const action of actionBuffer) {
        console.log(`Processing action: ${action.type} for ${action.payload?.task?.id || action.payload?.milestone?.id || action.payload?.name}`);
        const { updatedState, updatedTaskDictionary } = processAction(
          currentState, 
          action,
          currentTaskDictionary
        );
        
        currentState = updatedState;
        currentTaskDictionary = updatedTaskDictionary;
        
        // Log state after processing this action
        if (action.type === 'ADD_TASK' || action.type === 'ADD_MILESTONE') {
          const taskId = action.type === 'ADD_TASK' ? action.payload.task.id : action.payload.milestone.id;
          console.log(`After processing ${action.type}, task/milestone ${taskId} in dictionary:`, !!currentTaskDictionary[taskId]);
        }
      }
      
      // Verify that all tasks and milestones are present in the processed state
      const processedSections = currentState.sections;
      expect(processedSections.length).toBeGreaterThan(0);
      
      // Verify each section is present
      const sectionNames = ["Site Analysis & Location Selection", "Modular System Design", 
                          "Resource Efficiency Planning", "Prototype Fabrication & Installation",
                          "Operational Testing & Performance Measurement", "Documentation & Handover"];
      
      for (const name of sectionNames) {
        const section = processedSections.find(s => s.name === name);
        expect(section).toBeDefined();
        if (section) {
          console.log(`Section ${name} has ${section.tasks.length} tasks`);
        }
      }
      
      // Verify x0Date is set correctly
      expect(currentState.x0Date).toEqual(new Date('2025-06-01'));
      
      // Verify task dictionary has all tasks
      const allTaskIds = Object.keys(currentTaskDictionary);
      console.log(`Task dictionary has ${allTaskIds.length} tasks/milestones`);
      expect(allTaskIds.length).toBe(tasks.length + milestones.length);

      for (const name of sectionNames) {
        const section = processedSections.find(s => s.name === name);
        expect(section).toBeDefined();
        if (section) {
          console.log(`Section ${name} has ${section.tasks.length} tasks`);
          expect(section.tasks.length).toBe(tasks.length);
        }
      }
  });

  it('should handle "after milestone" references by using the last processed milestone', () => {
    // Arrange
    let streamState = getInitialStreamState();
    const mermaidSyntax = `
gantt
    section Operational Testing
        First milestone: milestone, 2025-01-01
        Task after generic milestone: task1, after milestone, 3d
        Second milestone: milestone, after task1
        Another task after generic milestone: task2, after milestone, 2d
    `;

    const lines = mermaidSyntax.split('\n').map(line => line + '\n');
    let actionBuffer: BufferedAction[] = [];
    let taskDictionary = {};
    let timeline = undefined;

    // Act: process the lines
    for (const line of lines) {
      const { updatedStreamState, updatedActionBuffer, updatedTimeline, updatedTaskDictionary } = 
        processMermaidStreamData(line, streamState, actionBuffer, timeline, taskDictionary);
      streamState = updatedStreamState;
      actionBuffer = updatedActionBuffer;
      timeline = updatedTimeline;
      taskDictionary = updatedTaskDictionary;
    }

    // Extract tasks, milestones and organize them
    const tasks = actionBuffer.filter(action => action.type === 'ADD_TASK');
    const milestones = actionBuffer.filter(action => action.type === 'ADD_MILESTONE');

    const keyedTasks = tasks.reduce((acc, task) => {
      acc[task.payload.task.id] = task.payload;
      return acc;
    }, {} as Record<string, any>);

    const keyedMilestones = milestones.reduce((acc, milestone) => {
      acc[milestone.payload.milestone.id] = milestone.payload;
      return acc;
    }, {} as Record<string, any>);

    // Assert: Verify that "after milestone" correctly references the last processed milestone
    expect(keyedMilestones['first_milestone']).toBeDefined();
    
    // First task should depend on the first milestone
    expectTasksToMatch(keyedTasks, { 
      id: 'task1', 
      sectionName: 'Operational Testing', 
      label: 'Task after generic milestone', 
      dependencies: ['first_milestone'] 
    });
    
    // Second milestone should depend on task1
    expectMilestonesToMatch(keyedMilestones, { 
      id: 'second_milestone', 
      sectionName: 'Operational Testing', 
      label: 'Second milestone', 
      dependencies: ['task1'] 
    });
    
    // Second task should depend on the second milestone (not the first)
    expectTasksToMatch(keyedTasks, { 
      id: 'task2', 
      sectionName: 'Operational Testing', 
      label: 'Another task after generic milestone', 
      dependencies: ['second_milestone'] 
    });

    // Verify lastMilestoneId is set correctly in the state
    expect(streamState.lastMilestoneId).toBe('second_milestone');
  });

  // --- ETH SKETCH SUMMARY TESTS ---
  it('should produce correct sketch summary from streamed gantt data', async () => {
    // Arrange
    const chunks = ganttString.split('\nGantt chunk: ');
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(chunk + '\n');
        }
        controller.close();
      },
    });
    let textStream = sseStreamToText(stream);
    let linesStream = streamByLine(textStream);
    let streamState = getInitialStreamState();
    let actionBuffer: BufferedAction[] = [];
    let taskDictionary: Record<string, any> = {};
    let timeline = undefined;
    // Act: simulate streaming
    const lines = await turnStreamIntoLines(linesStream);
    for (const line of lines) {
      const { updatedStreamState, updatedActionBuffer, updatedTimeline, updatedTaskDictionary } = processMermaidStreamData(
        line,
        streamState,
        actionBuffer,
        timeline,
        taskDictionary
      );
      streamState = updatedStreamState;
      actionBuffer = updatedActionBuffer;
      timeline = updatedTimeline;
      taskDictionary = updatedTaskDictionary;
    }
    // Assert sketch summary
    const sketchSummary = streamState.streamSummary.sketchSummary;
    expect(sketchSummary).toBeDefined();
    if (!sketchSummary) throw new Error('sketchSummary missing');
  });
});
