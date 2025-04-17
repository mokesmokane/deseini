import { Task, Section } from '../../../contexts/DraftPlanContextMermaid';
import { getTaskDate, calculateTaskEndDate } from './dateUtils';

/**
 * Checks if two tasks have the same properties
 */
export const haveTasksChanged = (oldTask?: Task, newTask?: Task) => {
  if (!oldTask || !newTask) return true;
  
  // Compare dates properly
  const oldStartDate = oldTask.startDate ? new Date(oldTask.startDate).getTime() : undefined;
  const newStartDate = newTask.startDate ? new Date(newTask.startDate).getTime() : undefined;
  const oldEndDate = oldTask.endDate ? new Date(oldTask.endDate).getTime() : undefined;
  const newEndDate = newTask.endDate ? new Date(newTask.endDate).getTime() : undefined;
  const oldMilestoneDate = oldTask.date ? new Date(oldTask.date).getTime() : undefined;
  const newMilestoneDate = newTask.date ? new Date(newTask.date).getTime() : undefined;
  
  return (
    oldTask.label !== newTask.label ||
    oldTask.type !== newTask.type ||
    oldTask.duration !== newTask.duration ||
    oldStartDate !== newStartDate ||
    oldEndDate !== newEndDate ||
    oldMilestoneDate !== newMilestoneDate ||
    JSON.stringify(oldTask.dependencies) !== JSON.stringify(newTask.dependencies)
  );
};

/**
 * Get all task IDs from sections
 */
export const getTaskIdsFromSections = (sections: Section[]) => {
  return sections.flatMap(section => section.tasks.map(task => task.id));
};

/**
 * Get all section bar IDs from sections
 */
export const getSectionBarIds = (sections: Section[]) => {
  return sections.map(section => `section_bar_${section.name}`);
};

/**
 * Calculate section date boundaries based on its tasks
 */
export const calculateSectionDateBoundaries = (
  section: Section
): { startDate: Date; endDate: Date } => {
  let sectionStartDate: Date | undefined;
  let sectionEndDate: Date | undefined;
  
  for (const task of section.tasks) {
    const taskDate = getTaskDate(task);
    
    // Update section start date
    if (!sectionStartDate || taskDate < sectionStartDate) {
      sectionStartDate = new Date(taskDate);
    }
    
    // Calculate and check task end date
    const taskEndDate = calculateTaskEndDate(task);
    
    // Update section end date
    if (!sectionEndDate || taskEndDate > sectionEndDate) {
      sectionEndDate = new Date(taskEndDate);
    }
  }
  
  // Default dates if no tasks with dates found
  if (!sectionStartDate || !sectionEndDate) {
    sectionStartDate = new Date();
    sectionEndDate = new Date();
    sectionEndDate.setDate(sectionEndDate.getDate() + 30); // Default 30-day width
  }
  
  // Ensure valid date range (start before end)
  if (sectionStartDate > sectionEndDate) {
    sectionEndDate = new Date(sectionStartDate);
    sectionEndDate.setDate(sectionEndDate.getDate() + 30);
  }
  
  return { startDate: sectionStartDate, endDate: sectionEndDate };
};

/**
 * Find all tasks that depend on a given task ID
 */
export const findDependentTasks = (taskId: string, sections: Section[]): Task[] => {
  const dependentTasks: Task[] = [];
  
  for (const section of sections) {
    for (const task of section.tasks) {
      if (task.dependencies && task.dependencies.includes(taskId)) {
        dependentTasks.push(task);
      }
    }
  }
  
  return dependentTasks;
};

/**
 * Find a task by ID within the sections
 */
export const findTaskById = (taskId: string, sections: Section[]): { task: Task; section: Section } | null => {
  for (const section of sections) {
    const task = section.tasks.find(t => t.id === taskId);
    if (task) {
      return { task, section };
    }
  }
  return null;
};
