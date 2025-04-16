import { Task, Timeline } from '../contexts/DraftPlanContextMermaid';

/**
 * Returns a task by its ID from the dictionary
 * @param taskDictionary Dictionary of tasks indexed by ID
 * @param taskId ID of the task to find
 * @returns The found task or undefined
 */
export const findTaskById = (
  taskDictionary: Record<string, Task>,
  taskId: string
): Task | undefined => {
  return taskDictionary[taskId];
};

/**
 * Gets the end date of a task based on its ID
 * @param taskDictionary Dictionary of tasks indexed by ID
 * @param taskId ID of the task to get end date for
 * @returns The end date of the task or undefined
 */
export const getTaskEndDate = (
  taskDictionary: Record<string, Task>,
  taskId: string
): Date | undefined => {
  const dependencyTask = findTaskById(taskDictionary, taskId);
  if (dependencyTask) {
    // For normal tasks, use the end date
    if (dependencyTask.type === 'task') {
      return dependencyTask.endDate;
    }
    // For milestones, use the date or startDate
    else if (dependencyTask.type === 'milestone') {
      return dependencyTask.date || dependencyTask.startDate;
    }
  }
  return undefined;
};

/**
 * Creates a new task object with specified properties
 * @param id Task ID
 * @param label Task label
 * @param startDate Start date
 * @param duration Duration in days
 * @param endDate End date
 * @param dependencies Array of dependency IDs
 * @param type Task type
 * @returns Task object
 */
export const createTask = (
  id: string,
  label: string,
  startDate?: Date,
  duration?: number,
  endDate?: Date,
  dependencies?: string[],
  type: 'task' | 'milestone' = 'task'
): Task => {
  const task: Task = {
    id,
    type,
    label,
    startDate,
    duration,
    dependencies
  };

  // Calculate end date if start date and duration are provided
  if (startDate && duration && !endDate) {
    const calculatedEndDate = new Date(startDate);
    calculatedEndDate.setDate(calculatedEndDate.getDate() + duration);
    task.endDate = calculatedEndDate;
  } else if (endDate) {
    task.endDate = endDate;
  }

  // For milestones, set the date field
  if (type === 'milestone' && startDate) {
    task.date = startDate;
  }

  return task;
};

/**
 * Checks if a task or milestone affects the timeline boundaries and returns a new timeline if needed
 * @param item The task or milestone to check
 * @param currentTimeline The current timeline boundaries or undefined
 * @returns Object containing the updated timeline and whether an update is needed
 */
export const checkTimelineBoundaries = (
  item: {
    startDate?: Date;
    endDate?: Date;
    date?: Date;
    duration?: number;
  },
  currentTimeline?: Timeline
): { 
  hasUpdate: boolean;
  newTimeline: Timeline | undefined;
} => {
  // No need to check if no dates are provided
  if (!item.startDate && !item.endDate && !item.date) {
    return {
      hasUpdate: false,
      newTimeline: currentTimeline
    };
  }
  
  let needsUpdate = false;
  const newTimeline: Timeline = currentTimeline || {
    startDate: new Date(8640000000000000), // Max date
    endDate: new Date(0) // Min date
  };
  
  // Check if startDate affects the timeline boundaries
  if (item.startDate) {
    if (!newTimeline.startDate || item.startDate < newTimeline.startDate) {
      newTimeline.startDate = new Date(item.startDate);
      needsUpdate = true;
    }
  }
  
  // Check if endDate affects the timeline boundaries
  // For tasks, use endDate, for milestones, use date
  const effectiveEndDate = item.endDate || item.date;
  
  if (effectiveEndDate) {
    if (!newTimeline.endDate || effectiveEndDate > newTimeline.endDate) {
      newTimeline.endDate = new Date(effectiveEndDate);
      needsUpdate = true;
    }
  } else if (item.startDate && item.duration) {
    // Calculate end date from startDate and duration for checking boundaries
    const calculatedEndDate = new Date(item.startDate);
    calculatedEndDate.setDate(calculatedEndDate.getDate() + item.duration);
    
    if (!newTimeline.endDate || calculatedEndDate > newTimeline.endDate) {
      newTimeline.endDate = new Date(calculatedEndDate);
      needsUpdate = true;
    }
  }
  
  return {
    hasUpdate: needsUpdate,
    newTimeline: needsUpdate ? newTimeline : currentTimeline
  };
};
