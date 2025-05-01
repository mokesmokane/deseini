import { parseMermaidLine } from './mermaidParser';
import { ActionType, BufferedAction } from './types';
import { Task, Timeline } from '../contexts/DraftPlan/types';

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
  streamSummary: StreamSummary;
}

/**
 * Interface for tracking thoughts
 */
export interface Thought {
  summary: string;
  thoughts: string;
}

/**
 * Interface for tracking sketch data
 */
export interface Sketch {
  duration: number; // Duration in days
  totalTasks: number;
  totalMilestones: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Interface for tracking stream summary
 */
export interface StreamSummary {
  thinking: Thought[];
  drawing?: Sketch;
  mermaidMarkdown?: string;
  allText?: string;
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
  // Initialize streamSummary if it doesn't exist
  const initialStreamSummary: StreamSummary = {
    thinking: []
    // drawing will be added when mermaid content is detected
  };

  // Create a new copy of the stream state for immutability
  const updatedStreamState: StreamState = {
    mermaidData: streamState.mermaidData + content,
    completeLines: [...streamState.completeLines],
    inMermaidBlock: streamState.inMermaidBlock,
    currentSection: streamState.currentSection,
    allSections: new Set(streamState.allSections),
    lastHeader: streamState.lastHeader,
    streamSummary: streamState.streamSummary ? {
      thinking: [...streamState.streamSummary.thinking],
      drawing: streamState.streamSummary.drawing ? { ...streamState.streamSummary.drawing } : undefined,
      mermaidMarkdown: streamState.streamSummary.mermaidMarkdown || '',
      allText: streamState.streamSummary.allText || ''
    } : initialStreamSummary
  };
  
  let updatedTimeline: Timeline | undefined = currentTimeline;
  let updatedActionBuffer = [...actionBuffer];
  const updatedTaskDictionary = taskDictionary;
  let newStreamSummary: string | undefined;

  // Look for complete lines that end with newline
  const newLines = updatedStreamState.mermaidData.split('\n');

  // Counters for Sketch statistics
  let totalTasks = updatedStreamState.streamSummary.drawing?.totalTasks || 0;
  let totalMilestones = updatedStreamState.streamSummary.drawing?.totalMilestones || 0;

  // --- Collect all streamed text ---
  // Append new content to allText
  updatedStreamState.streamSummary.allText = (updatedStreamState.streamSummary.allText || '') + content;

  // If we have more than one line, all lines except the last one are complete
  if (newLines.length > 1) {
    let inMermaid = false;
    let mermaidLines: string[] = [];
    for (let i = 0; i < newLines.length - 1; i++) {
      const line = newLines[i].trim();

      // Look for markdown headers (starting with #) to track as summaries
      if (line.startsWith('#')) {
        const headerText = line.replace(/^#+\s*/, '').trim();
        
        if (headerText) {
          updatedStreamState.lastHeader = headerText;
          newStreamSummary = headerText;
          
          // Add thought to summary when we encounter a header
          const newThought: Thought = {
            summary: headerText,
            thoughts: line
          };
          updatedStreamState.streamSummary.thinking.push(newThought);
        }
      }

      // Track if we're inside a mermaid code block
      if (line === '```mermaid') {
        updatedStreamState.inMermaidBlock = true;
        updatedStreamState.completeLines = [];
        inMermaid = true;
        mermaidLines = [];

        // Reset sections when starting a new mermaid block
        updatedActionBuffer = [];
        updatedStreamState.currentSection = null;
        
        // Initialize/update drawing metrics when we start a mermaid block
        updatedStreamState.streamSummary.drawing = {
          duration: 0,
          totalTasks: 0,
          totalMilestones: 0
        };
        // Start live updating mermaidMarkdown as soon as block starts
        updatedStreamState.streamSummary.mermaidMarkdown = '```mermaid\n';
      } else if (line === 'gantt' && updatedStreamState.inMermaidBlock) {
        // Detected the start of a gantt chart
        updatedStreamState.completeLines.push(line);
        newStreamSummary = 'Creating Gantt chart';
        if (inMermaid) mermaidLines.push(line);
        // Live update mermaidMarkdown
        updatedStreamState.streamSummary.mermaidMarkdown =
          (updatedStreamState.streamSummary.mermaidMarkdown || '```mermaid\n') + 'gantt\n';
      } else if (line === '```' && updatedStreamState.inMermaidBlock) {
        updatedStreamState.inMermaidBlock = false;
        if (inMermaid) {
          // End of mermaid block
          inMermaid = false;
          // Store the mermaid markdown block
          updatedStreamState.streamSummary.mermaidMarkdown = '```mermaid\n' + mermaidLines.join('\n') + '\n```';
        }
        // We've finished processing the mermaid block
        // Update summary to indicate completion of gantt chart
        if (updatedStreamState.completeLines.includes('gantt')) {
          newStreamSummary = 'Done creating Gantt chart';
          
          // Finalize drawing metrics with timeline information
          if (updatedTimeline && updatedStreamState.streamSummary.drawing) {
            const durationMs = updatedTimeline.endDate.getTime() - updatedTimeline.startDate.getTime();
            const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
            
            updatedStreamState.streamSummary.drawing = {
              duration: durationDays,
              totalTasks,
              totalMilestones,
              startDate: updatedTimeline.startDate,
              endDate: updatedTimeline.endDate
            };
          }
        }
      } else if (updatedStreamState.inMermaidBlock) {
        // Collect all lines inside the mermaid block
        mermaidLines.push(line);
        // Live update mermaidMarkdown as lines are added
        updatedStreamState.streamSummary.mermaidMarkdown =
          (updatedStreamState.streamSummary.mermaidMarkdown || '```mermaid\n') + line + '\n';
      }

      // We're inside a mermaid block, parse the line
      if (!updatedStreamState.completeLines.includes(line)) {
        updatedStreamState.completeLines.push(line);
        if (inMermaid) mermaidLines.push(line);
        const parseResult = parseMermaidLine(line, updatedStreamState.currentSection, updatedTaskDictionary);
        
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
          
          // Update task/milestone counts for drawing summary
          if (parseResult.type === 'task') {
            totalTasks++;
          } else {
            totalMilestones++;
          }
          
          // Ensure drawing object exists
          if (!updatedStreamState.streamSummary.drawing) {
            updatedStreamState.streamSummary.drawing = {
              duration: 0,
              totalTasks: 0,
              totalMilestones: 0
            };
          }
          
          updatedStreamState.streamSummary.drawing.totalTasks = totalTasks;
          updatedStreamState.streamSummary.drawing.totalMilestones = totalMilestones;
          
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
          
          // Determine start and end dates for timeline update, handling tasks and milestones
          const dateStart = task.startDate;
          const dateEnd = task.endDate ?? task.startDate;
          if (!currentTimeline || dateStart < currentTimeline.startDate || dateEnd > currentTimeline.endDate) {
            let timeline;
            if (!currentTimeline) {
              timeline = { startDate: dateStart, endDate: dateEnd };
            } else {
              timeline = {
                startDate: new Date(Math.min(currentTimeline.startDate.getTime(), dateStart.getTime())),
                endDate: new Date(Math.max(currentTimeline.endDate.getTime(), dateEnd.getTime()))
              };
            }
            
            // Update duration in the drawing summary when timeline changes
            const durationMs = timeline.endDate.getTime() - timeline.startDate.getTime();
            const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
            
            // Ensure drawing object exists before updating it
            if (!updatedStreamState.streamSummary.drawing) {
              updatedStreamState.streamSummary.drawing = { duration: 0, totalTasks: 0, totalMilestones: 0 };
            }
            
            updatedStreamState.streamSummary.drawing.duration = durationDays;
            updatedStreamState.streamSummary.drawing.startDate = timeline.startDate;
            updatedStreamState.streamSummary.drawing.endDate = timeline.endDate;
            
            updatedActionBuffer.push({
              type: 'UPDATE_TIMELINE',
              payload: { timeline },
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
      startDate
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
