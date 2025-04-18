import { Section, Task, Timeline } from '../contexts/DraftPlanContextMermaid';
import { BufferedAction } from './types';

/**
 * Interface for application state relevant to action processing
 */
export interface AppState {
  sections: Section[];
  timeline: Timeline | undefined;
}

/**
 * Queue a task for dependency resolution retry
 * @param taskId Task ID
 * @param label Task label
 * @param sectionName Section name
 * @param dependencies Dependencies array
 * @param duration Duration in days
 * @param type Task type
 * @returns Action object for dependency resolution
 */
export const createDependencyResolutionRetryAction = (
  taskId: string,
  label: string,
  sectionName: string,
  dependencies?: string[],
  duration?: number,
  type?: 'task' | 'milestone'
): {
  type: 'RESOLVE_DEPENDENCY';
  payload: {
    taskId: string;
    label: string;
    sectionName: string;
    dependencies?: string[];
    duration?: number;
    type?: 'task' | 'milestone';
  };
} => {
  return {
    type: 'RESOLVE_DEPENDENCY',
    payload: {
      taskId,
      label,
      sectionName,
      dependencies,
      duration,
      type: type || 'task'
    }
  };
};

/**
 * Processes a single buffered action and returns the updated state
 * @param state Current application state
 * @param action Action to process 
 * @param taskDictionary Dictionary of tasks indexed by ID
 * @returns Updated application state and task dictionary
 */
export const processAction = (
  state: AppState,
  action: BufferedAction,
  taskDictionary: Record<string, Task>
): {
  updatedState: AppState;
  updatedTaskDictionary: Record<string, Task>;
  actionsToQueue: BufferedAction[];
} => {
  let updatedTaskDictionary = { ...taskDictionary };
  let updatedState = { ...state };
  const actionsToQueue: BufferedAction[] = [];

  
  switch (action.type) {
    case 'ADD_SECTION': {
      const { name } = action.payload;
      
      // Check if section already exists
      const exists = state.sections.some(s => s.name === name);
      
      if (!exists) {
        updatedState.sections = [...state.sections, { name, tasks: [] }];
      }
      break;
    }
    
    case 'ADD_TASK':
    case 'UPDATE_TASK': {
      const { sectionName, task } = action.payload;
      console.log(`Adding or updating task ${task.id} in section ${sectionName} ${task.startDate}`);
      
      // Add or update the task in the section
      updatedState.sections = updatedState.sections.map(section => {
        if (section.name === sectionName) {
          // Check if task already exists
          const existingIndex = section.tasks.findIndex(t => t.id === task.id);

          if (existingIndex >= 0) {
            // Update existing task
            const updatedTasks = [...section.tasks];
            updatedTasks[existingIndex] = task;
            console.log(`Updating existing task ${task.id} in section ${sectionName}`);
            return { ...section, tasks: updatedTasks };
          } else {
            // Add new task
            console.log(`Adding new task ${task.id} to section ${sectionName}`);
            return {
              ...section,
              tasks: [...section.tasks, task]
            };
          }
        }
        return section;
      });
      
      // Update the task dictionary
      updatedTaskDictionary[task.id] = task;
      break;
    }
    
    case 'ADD_MILESTONE':
    case 'UPDATE_MILESTONE': {
      const { sectionName, milestone } = action.payload;
      console.log(`Adding or updating milestone ${milestone.id} in section ${sectionName} ${milestone.startDate}`);
      // Add or update the milestone in the section
      updatedState.sections = updatedState.sections.map(section => {
        if (section.name === sectionName) {
          // Check if a milestone with this id already exists
          const existingIndex = section.tasks.findIndex(t => 
            t.id === milestone.id && t.type === 'milestone');
          
          if (existingIndex >= 0) {
            // Update existing milestone
            const updatedTasks = [...section.tasks];
            updatedTasks[existingIndex] = milestone;
            return { ...section, tasks: updatedTasks };
          } else {
            // Add new milestone
            return {
              ...section,
              tasks: [...section.tasks, milestone]
            };
          }
        }
        return section;
      });
      
      // Update the task dictionary
      updatedTaskDictionary[milestone.id] = milestone;
      break;
    }
      
    case 'UPDATE_TIMELINE': {
      updatedState.timeline = action.payload.timeline;
      break;
    }
    
    default:
      console.warn(`Unknown action type: ${action.type}`);
  }
  
  return { updatedState, updatedTaskDictionary, actionsToQueue };
};
