import { parseMermaidLine } from './mermaidParser';
import { ActionType, BufferedAction } from './types';
import { Task, Timeline } from '../contexts/DraftPlanContextMermaid';

/**
 * Interface for tracking the state of streaming data processing
 */
export interface StreamState {
  mermaidData: string;
  completeLines: string[];
  inMermaidBlock: boolean;
  currentSection: string | null;
  allSections: Set<string>;
  lastHeader: string | null;
}

/**
 * Processes a chunk of streaming data
 * @param content Chunk of content received from the stream
 * @param streamState Current state of the stream processing
 * @param actionBuffer Current action buffer
 * @param pendingTimelineUpdate Any pending timeline update
 * @param taskDictionary Optional dictionary of tasks by ID for dependency resolution
 * @returns Updated state and effects
 */
export const processStreamData = (
  content: string,
  streamState: StreamState,
  actionBuffer: BufferedAction[],
  currentTimeline: Timeline | undefined,
  taskDictionary: Record<string, Task>
): {
  updatedStreamState: StreamState;
  updatedActionBuffer: BufferedAction[];
  updatedTimeline: Timeline | undefined;
  updatedTaskDictionary: Record<string, Task>;
  newMermaidSyntax: string;
  newStreamSummary?: string;
} => {
  // Create a new copy of the stream state for immutability
  const updatedStreamState: StreamState = {
    mermaidData: streamState.mermaidData + content,
    completeLines: [...streamState.completeLines],
    inMermaidBlock: streamState.inMermaidBlock,
    currentSection: streamState.currentSection,
    allSections: new Set(streamState.allSections),
    lastHeader: streamState.lastHeader
  };
  
  let updatedTimeline: Timeline | undefined = currentTimeline;
  let updatedActionBuffer = [...actionBuffer];
  let updatedTaskDictionary = { ...taskDictionary };
  let newStreamSummary: string | undefined;

  // Look for complete lines that end with newline
  const newLines = updatedStreamState.mermaidData.split('\n');

  // If we have more than one line, all lines except the last one are complete
  if (newLines.length > 1) {
    // Process all complete lines except the last one
    for (let i = 0; i < newLines.length - 1; i++) {
      const line = newLines[i].trim();

      // Look for markdown headers (starting with #) to track as summaries
      if (line.startsWith('#')) {
        const headerText = line.replace(/^#+\s*/, '').trim();
        
        if (headerText) {
          updatedStreamState.lastHeader = headerText;
          newStreamSummary = headerText;
        }
      }

      // Track if we're inside a mermaid code block
      if (line === '```mermaid') {
        updatedStreamState.inMermaidBlock = true;
        updatedStreamState.completeLines = [];

        // Reset sections when starting a new mermaid block
        updatedActionBuffer = [];
        updatedStreamState.currentSection = null;
      } else if (line === 'gantt' && updatedStreamState.inMermaidBlock) {
        // Detected the start of a gantt chart
        updatedStreamState.completeLines.push(line);
        newStreamSummary = 'Creating Gantt chart';
      } else if (line === '```' && updatedStreamState.inMermaidBlock) {
        updatedStreamState.inMermaidBlock = false;
        
        // We've finished processing the mermaid block
        // Update summary to indicate completion of gantt chart
        if (updatedStreamState.completeLines.includes('gantt')) {
          newStreamSummary = 'Done creating Gantt chart';
        }
      } else if (updatedStreamState.inMermaidBlock) {
        // We're inside a mermaid block, parse the line
        if (!updatedStreamState.completeLines.includes(line)) {
          updatedStreamState.completeLines.push(line);
          
          const parseResult = parseMermaidLine(line, updatedStreamState.currentSection);
          
          // If it's a section, update the current section
          if (parseResult.type === 'section') {
            const sectionName = parseResult.payload.name;
            updatedStreamState.currentSection = sectionName;
            
            // If we haven't seen this section before, add it to our sections state
            if (!updatedStreamState.allSections.has(sectionName)) {
              updatedStreamState.allSections.add(sectionName);
              
              updatedActionBuffer.push({
                type: 'ADD_SECTION',
                payload: { name: sectionName },
                timestamp: Date.now()
              });
            }
          } 
          // Add a task or milestone action
          else if (parseResult.type === 'task' || parseResult.type === 'milestone') {
            const actionType: ActionType = parseResult.type === 'task' ? 'ADD_TASK' : 'ADD_MILESTONE';
            
            // Try to resolve dependencies if this task has them
            const payload = { ...parseResult.payload };
            const task = parseResult.type === 'task' ? payload.task : payload.milestone;
            
            if (task.dependencies?.length > 0) {
              // Calculate dates based on dependency end dates
              const updatedTask = calculateDatesFromDependencies(task, updatedTaskDictionary);
              
              // Update the payload with the calculated dates
              if (parseResult.type === 'task') {
                payload.task = updatedTask;
              } else {
                payload.milestone = updatedTask;
              }
            }
            
            if(!currentTimeline || payload.task && (payload.task.startDate < currentTimeline.startDate || payload.task.endDate > currentTimeline.endDate)) {
              let timeline;
              if (!currentTimeline) {
                timeline = {
                  startDate: payload.task.startDate,
                  endDate: payload.task.endDate
                };
              } else {
                timeline = {
                  startDate: new Date(Math.min(currentTimeline.startDate.getTime(), payload.task.startDate.getTime())),
                  endDate: new Date(Math.max(currentTimeline.endDate.getTime(), payload.task.endDate.getTime()))
                };
              }
              updatedActionBuffer.push({
                type: 'UPDATE_TIMELINE',
                payload: { 
                  timeline
                }, 
                timestamp: Date.now()
              });
              updatedTimeline = timeline;
            }
            
            updatedActionBuffer.push({
              type: actionType, 
              payload, 
              timestamp: Date.now()
            });
            
            // Add the task to our dictionary for future dependency resolution
            updatedTaskDictionary[task.id] = payload.task;
          }
        }
      }
    }

    // Keep the last incomplete line for the next update
    updatedStreamState.mermaidData = newLines[newLines.length - 1];
  }

  return {
    updatedStreamState,
    updatedActionBuffer,
    updatedTimeline,
    updatedTaskDictionary,
    newMermaidSyntax: updatedStreamState.mermaidData,
    newStreamSummary
  };
};

/**
 * Calculate start and end dates for a task based on its dependencies
 * @param task The task with dependencies to calculate dates for
 * @param taskDictionary Dictionary of all tasks by ID
 * @returns The task with calculated dates if possible
 */
export const calculateDatesFromDependencies = (
  task: Task,
  taskDictionary: Record<string, Task>
): Task => {
  // If the task doesn't have dependencies or already has dates, return as is
  if (!task.dependencies?.length || task.startDate) {
    return task;
  }
  
  // Get the first dependency - most common case is a single dependency
  const dependencyId = task.dependencies[0];
  const dependencyTask = taskDictionary[dependencyId];
  
  // If we can't find the dependency, return the task unchanged
  if (!dependencyTask || !dependencyTask.endDate) {
    return task;
  }
  
  // Calculate the start date as the day after the dependency ends
  const startDate = new Date(dependencyTask.endDate);
  startDate.setDate(startDate.getDate() + 1);
  
  // If this is a milestone, it should just use the start date
  if (task.type === 'milestone') {
    return {
      ...task,
      startDate,
      date: startDate
    };
  }
  
  // For a regular task, calculate the end date based on duration
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + (task.duration || 1) - 1);
  
  return {
    ...task,
    startDate,
    endDate
  };
};
