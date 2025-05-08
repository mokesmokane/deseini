import { Section, Task, Timeline } from '../contexts/DraftPlan/types';
import { BufferedAction } from './types';
import { ensureDate } from '../hooks/utils';

/**
 * Interface for application state relevant to action processing
 */
export interface AppState {
  x0Date: Date | null;
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

      if (!state.x0Date) {
        updatedState.x0Date = task.startDate;
      }
      // Add or update the task in the section
      updatedState.sections = updatedState.sections.map(section => {
        if (section.name === sectionName) {
          // Check if task already exists
          const existingIndex = section.tasks.findIndex(t => t.id === task.id);

          if (existingIndex >= 0) {
            // Update existing task
            const updatedTasks = [...section.tasks];
            task.duration = task.endDate ? 
              (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24) : task.duration;
            updatedTasks[existingIndex] = task;
            return { ...section, tasks: updatedTasks };
          } else {
            // Add new task
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
    case 'UPDATE_TASK_STARTDATE':
      let { sectionName, taskId, startDate } = action.payload;

      if (!state.x0Date) {
        updatedState.x0Date = startDate;
      }
      // Add or update the task in the section
      updatedState.sections = updatedState.sections.map(section => {
        if (section.name === sectionName) {
          // Check if task already exists
          const existingIndex = section.tasks.findIndex(t => t.id === taskId);
          const task = section.tasks[existingIndex];

          if (existingIndex >= 0) {
            const updatedTasks = [...section.tasks];
            const duration = task.endDate ? 
              (ensureDate(task.endDate).getTime() - ensureDate(task.startDate).getTime()) / (1000 * 60 * 60 * 24) : task.duration;
            if (task.type === 'milestone') {
              task.startDate = startDate;
              updatedTasks[existingIndex] = task;
              return { ...section, tasks: updatedTasks };
            } else if (duration) {
              task.startDate = startDate;
              task.endDate = new Date(ensureDate(task.startDate).getTime() + duration * 1000 * 60 * 60 * 24);
              updatedTasks[existingIndex] = task;
              return { ...section, tasks: updatedTasks };
            }
          } 
          updatedTaskDictionary[taskId] = task;
        }
        return section;
      });
      break;
    case 'UPDATE_TASK_DURATION':
      const {sectionName:sn, taskId:ti, newDuration, endDate } = action.payload;
      // Update the task dictionary

      // Add or update the task in the section
      updatedState.sections = updatedState.sections.map(section => {
        if (section.name === sn) {
          // Check if task already exists
          const existingIndex = section.tasks.findIndex(t => t.id === ti);
          const task = section.tasks[existingIndex];
          if (existingIndex >= 0) {
            // Update existing task
            const updatedTasks = [...section.tasks];
            task.duration = newDuration ? newDuration : endDate ? (endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24) : task.duration;
            task.endDate = endDate ? endDate : newDuration ? new Date(task.startDate.getTime() + newDuration * 1000 * 60 * 60 * 24) : task.endDate;
            updatedTasks[existingIndex] = task;
            return { ...section, tasks: updatedTasks };
          } 
          updatedTaskDictionary[ti] = task;
        }
        return section;
      });
      break;
    case 'ADD_MILESTONE':
    case 'UPDATE_MILESTONE': {
      const { sectionName, milestone } = action.payload;
      // Add or update the milestone in the section
      updatedState.sections = updatedState.sections.map(section => {
        if (section.name === sectionName) {
          // Check if a milestone with this id already exists
          const existingIndex = section.tasks.findIndex(t => 
            t.id === milestone.id && t.type === 'milestone');
          
          if (existingIndex >= 0) {
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
