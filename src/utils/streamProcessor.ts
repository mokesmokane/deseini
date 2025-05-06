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
  // buffer forward dependency lines
  pendingLines?: Record<string, Array<{ line: string; section: string | null }>>;
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
export interface SketchSummary {
  duration: number; // Duration in days
  totalTasks: number;
  totalMilestones: number;
  startDate?: Date;
  endDate?: Date;
  _minStart?: Date;
  _maxEnd?: Date;
}

/**
 * Interface for tracking stream summary
 */
export interface StreamSummary {
  thinking: Thought[];
  sketchSummary?: SketchSummary;
  mermaidMarkdown?: string;
  allText?: string;
}

/**
 * Processes a chunk of main stream data
 * @param content Chunk of content received from the stream
 * @param streamState Current state of the stream processing
 * @returns Updated state and effects
 */
export const processMainStreamData = (
  content: string,
  streamState: StreamState
): {
  updatedStreamState: StreamState;
  newStreamSummary?: string;
} => {
  console.log('[Main stream] content:', content);
  const updatedStreamState: StreamState = {
    ...streamState,
    streamSummary: {
      ...streamState.streamSummary,
      allText: (streamState.streamSummary.allText || '') + content
    }
  };
  let newStreamSummary: string | undefined;
  const lines = content.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('#')) {
      const headerText = line.replace(/^#+\s*/, '').trim();
      if (headerText) {
        updatedStreamState.lastHeader = headerText;
        const newThought: Thought = {
          summary: headerText,
          thoughts: line
        };
        updatedStreamState.streamSummary = {
          ...updatedStreamState.streamSummary,
          thinking: [...(updatedStreamState.streamSummary.thinking || []), newThought]
        };
        newStreamSummary = headerText;
      }
    }
  }
  console.log('[Main stream] newStreamSummary:', newStreamSummary);
  return { updatedStreamState, newStreamSummary };
};

/**
 * Processes a chunk of mermaid stream data
 * @param content Chunk of content received from the stream
 * @param streamState Current state of the stream processing
 * @param actionBuffer Current action buffer
 * @param currentTimeline Any pending timeline update
 * @param taskDictionary Optional dictionary of tasks by ID for dependency resolution
 * @returns Updated state and effects
 */
export const processMermaidStreamData = (
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
} => {
  console.log('[Mermaid stream] content:', content);
  // Merge new content
  const updatedStreamState: StreamState = {
    ...streamState,
    mermaidData: streamState.mermaidData + content
  };
  // Ensure drawing summary exists
  if (!updatedStreamState.streamSummary.sketchSummary) {
    updatedStreamState.streamSummary.sketchSummary = { duration: 0, totalTasks: 0, totalMilestones: 0 };
  }
  // Retrieve or initialize min/max tracking on sketchSummary
  const sketchSummary = updatedStreamState.streamSummary.sketchSummary;
  // Use hidden properties to persist min/max dates across calls
  // @ts-ignore
  if (!sketchSummary._minStart) sketchSummary._minStart = undefined;
  // @ts-ignore
  if (!sketchSummary._maxEnd) sketchSummary._maxEnd = undefined;
  let minStart: Date | undefined = sketchSummary._minStart;
  let maxEnd: Date | undefined = sketchSummary._maxEnd;

  // Append markdown and full text
  updatedStreamState.streamSummary.mermaidMarkdown =
    (updatedStreamState.streamSummary.mermaidMarkdown || '') + content;
  updatedStreamState.streamSummary.allText =
    (updatedStreamState.streamSummary.allText || '') + content;

  let updatedActionBuffer = [...actionBuffer];
  let updatedTimeline = currentTimeline;
  const updatedTaskDictionary: Record<string, Task> = { ...taskDictionary };

  // Split buffered data into complete lines and keep last partial
  const lines = updatedStreamState.mermaidData.split('\n');
  const completeLines = lines.slice(0, -1);
  updatedStreamState.mermaidData = lines[lines.length - 1];

  // Process each complete line as mermaid syntax
  for (const rawLine of completeLines) {
    const line = rawLine.trim();
    if (!line) continue;
    console.log('[Mermaid stream] parsing line:', line);
    let parseResult;
    try {
      parseResult = parseMermaidLine(line, updatedStreamState.currentSection, updatedTaskDictionary);
    } catch (err: any) {
      const match = err.message.match(/Dependency task (.+) not found/);
      if (match) {
        const depId = match[1];
        updatedStreamState.pendingLines = updatedStreamState.pendingLines || {};
        updatedStreamState.pendingLines[depId] = [
          ...(updatedStreamState.pendingLines[depId] || []),
          { line, section: updatedStreamState.currentSection }
        ];
        continue;
      }
      throw err;
    }

    // Section headers
    if (parseResult.type === 'section') {
      const name = parseResult.payload.name;
      updatedStreamState.currentSection = name;
      if (!updatedStreamState.allSections.has(name)) {
        updatedStreamState.allSections.add(name);
        updatedActionBuffer.push({ type: 'ADD_SECTION', payload: { name }, timestamp: Date.now() });
      }
      continue;
    }

    // Tasks or milestones
    if (parseResult.type === 'task' || parseResult.type === 'milestone') {
      const actionType: ActionType = parseResult.type === 'task' ? 'ADD_TASK' : 'ADD_MILESTONE';
      const payload = { ...parseResult.payload };
      const task = parseResult.type === 'task' ? payload.task : payload.milestone;
      // Resolve dependencies
      if (task.dependencies?.length) {
        const updatedTask = calculateDatesFromDependencies(task, updatedTaskDictionary);
        if (parseResult.type === 'task') payload.task = updatedTask;
        else payload.milestone = updatedTask;
      }
      // Update timeline
      const start = task.startDate!;
      const end = task.endDate ?? task.startDate!;
      // Track min/max for sketch summary
      if (!minStart || start < minStart) minStart = start;
      if (!maxEnd || end > maxEnd) maxEnd = end;
      if (!updatedTimeline || start < updatedTimeline.startDate || end > updatedTimeline.endDate) {
        const newTimeline = updatedTimeline
          ? {
              startDate: new Date(Math.min(updatedTimeline.startDate.getTime(), start.getTime())),
              endDate: new Date(Math.max(updatedTimeline.endDate.getTime(), end.getTime()))
            }
          : { startDate: start, endDate: end };
        updatedTimeline = newTimeline;
        updatedActionBuffer.push({ type: 'UPDATE_TIMELINE', payload: { timeline: newTimeline }, timestamp: Date.now() });
        const ms = newTimeline.endDate.getTime() - newTimeline.startDate.getTime();
        updatedStreamState.streamSummary.sketchSummary!.duration = Math.ceil(ms / (1000 * 60 * 60 * 24));
      }
      // Update counts
      if (parseResult.type === 'task') updatedStreamState.streamSummary.sketchSummary!.totalTasks += 1;
      else updatedStreamState.streamSummary.sketchSummary!.totalMilestones += 1;
      // Push action and update dictionary
      updatedActionBuffer.push({ type: actionType, payload, timestamp: Date.now() });
      updatedTaskDictionary[task.id] = task;
    }
  }
  // Persist min/max for next chunk
  // @ts-ignore
  sketchSummary._minStart = minStart;
  // @ts-ignore
  sketchSummary._maxEnd = maxEnd;
  // Set startDate and endDate for sketch summary if both are available
  if (minStart && maxEnd) {
    sketchSummary.startDate = minStart;
    sketchSummary.endDate = maxEnd;
  }

  return {
    updatedStreamState,
    updatedActionBuffer,
    updatedTimeline,
    updatedTaskDictionary
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
