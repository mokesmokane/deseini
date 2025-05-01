
import { ganttString } from './stream_data';

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
import { processStreamData, StreamState } from '../streamProcessor';
import { BufferedAction } from '../types';

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
        drawing: undefined,
        mermaidMarkdown: undefined,
        allText: undefined,
      },
    };
  }

  it('should handle incomplete chunks gracefully', () => {
    console.log(chunks.join(''));
  });

  it('should reconstruct the correct Mermaid markdown from streamed chunks', () => {
    // Arrange
    const chunks = ganttString.split('\nGantt chunk: ')
      .filter(Boolean);
    let streamState = getInitialStreamState();
    const actionBuffer: BufferedAction[] = [];
    const taskDictionary = {};
    let timeline = undefined;

    // Act: simulate streaming
    try {
      for (const chunk of chunks) {
        const { updatedStreamState } = processStreamData(chunk, streamState, actionBuffer, timeline, taskDictionary);
        streamState = updatedStreamState;
      }
    } catch (error) {
      console.error('Error processing stream data:', error);
      console.log(streamState);
    }
"mermaid\ngantt\n    title Compostable Packaging Material Project Timeline\n    dateFormat YYYY-MM-DD\n    %% MONTH 1: Material Research & Specification\n    section Material Research & Specification\n      Review existing compostable materials: t1, 2025-06-01, 7d\n      Define material properties & requirements: t2, after t1, 5d\n      Draft technical specification document: t3, after t2, 8d\n      Technical specification document completed: milestone, after t3\n\n    %% MONTH 2: Prototype Development & Initial Testing\n    section Prototype Development\n      Create initial prototypes for various food types: t4, after t3, 8d\n      Refine prototypes based on findings: t5, after t12, 10d\n\n    section Testing & Validation\n      Conduct initial lab tests (degradation, safety, durability): t12, after t4, 10d\n      Document initial test results: t13, after t12, 3d\n      Successful lab test results (≤7 days): milestone, after t13\n\n    %% MONTH 3: Prototype Refinement & Extended Testing\n      Conduct extended lab testing: t14, after t5, 7d\n      Document extended test results: t15, after t14, 4d\n      Approved packaging prototypes (dry & wet foods): milestone, after t15\n\n    %% MONTH 4: Design & Assessment\n    section Design & Assessment\n      Develop packaging design mockups (3 versions): t6, after t15, 8d\n      Packaging design mockups finalized: milestone, after t6\n      Perform environmental impact assessment: t7, after t6, 7d\n      Environmental impact assessment report delivered: milestone, after t7\n\n    %% MONTH 5: Compliance & User Pilot\n    section Compliance & Regulatory\n      Review FDA, EU, and other regulatory standards: t8, after t7, 8d\n      Compile regulatory compliance checklist: t9, after t8, 7d\n      Regulatory compliance checklist signed off: milestone, after t9\n\n    section User Testing\n      Organize pilot user test: t10, after t9, 7d\n\n    %% MONTH 6: User Feedback & Closure\n      Collect & summarize user feedback: t11, after t10, 8d\n      User feedback summary delivered: milestone, after t11\n      Final project documentation & closure: t16, after t11, 10d\n"
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
    expect(streamState.streamSummary.mermaidMarkdown).toContain('%% MONTH 3: Prototype Refinement & Extended Testing');
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
    expect(streamState.streamSummary.mermaidMarkdown).toContain('Final project documentation & closure: t16, after t11, 10d');
  });

  it('should handle incomplete chunks gracefully', () => {
    const partialChunks = ['mer', 'maid', ' ', 'gant', 't', ' ', 'title', ' Compostable'];
    let streamState = getInitialStreamState();
    const actionBuffer: BufferedAction[] = [];
    const taskDictionary = {};
    let timeline = undefined;
    for (const chunk of partialChunks) {
      const { updatedStreamState } = processStreamData(chunk, streamState, actionBuffer, timeline, taskDictionary);
      streamState = updatedStreamState;
    }
    // Should not throw, and should build up partial mermaidMarkdown
    expect(streamState.streamSummary.mermaidMarkdown).toBeDefined();
  });
});
