import { processStreamData, StreamState } from './streamProcessor.js';
import { Task } from '../contexts/DraftPlanContextMermaid.js';
import { BufferedAction } from './actionBuffer.js';

// Manual test function to verify the timeline update fix
function testProcessStreamData() {
  // Initial state
  const initialStreamState: StreamState = {
    mermaidData: '',
    completeLines: [],
    inMermaidBlock: true,
    currentSection: 'Test Section',
    allSections: new Set(['Test Section']),
    lastHeader: null
  };
  
  const initialActionBuffer: BufferedAction[] = [];
  const initialPendingTimelineUpdate = { hasUpdate: false, newTimeline: null };
  const initialTaskDictionary: Record<string, Task> = {};
  
  // Simulate adding a single task
  const taskLine = '    task1 : Test Task, 2024-04-29, 3d';
  
  // Process the stream data
  const result = processStreamData(
    taskLine + '\n',
    initialStreamState,
    initialActionBuffer,
    initialPendingTimelineUpdate,
    initialTaskDictionary
  );
  
  // Check the action buffer to see if we have both ADD_TASK and PROCESS_DEPENDENCIES
  console.log('Action buffer length:', result.updatedActionBuffer.length);
  console.log('Actions:');
  result.updatedActionBuffer.forEach((action, index) => {
    console.log(`  ${index + 1}. ${action.type}`);
  });
  
  // Verify that we have a PROCESS_DEPENDENCIES action after the task is added
  const hasProcessDependencies = result.updatedActionBuffer.some(
    action => action.type === 'PROCESS_DEPENDENCIES'
  );
  
  console.log(
    hasProcessDependencies 
      ? '✅ Test passed: Timeline is updated after adding the first task' 
      : '❌ Test failed: Timeline is not updated after adding the first task'
  );
}

// Run the test
testProcessStreamData();
