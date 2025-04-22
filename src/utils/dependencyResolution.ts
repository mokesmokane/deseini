import { Section } from '../contexts/DraftPlan/types';

/**
 * Find a task's end date by its ID across all sections
 * @param taskId ID of the task to find
 * @param allSections All sections to search in
 * @returns The end date of the task, or undefined if not found
 */
export function findTaskEndDateById(taskId: string, allSections: Section[]): Date | undefined {
  for (const section of allSections) {
    // Search for the task (regular task or milestone) by ID
    const task = section.tasks.find(t => t.id === taskId);
    if (task) {
      if (task.type === 'milestone' && task.startDate) {
        // For milestones, use the startDate property
        return new Date(task.startDate);
      } else if (task.endDate) {
        // For tasks with explicit end date
        return new Date(task.endDate);
      } else if (task.duration && task.startDate) {
        // For tasks with duration and start date, calculate end date
        const endDate = new Date(task.startDate);
        endDate.setDate(endDate.getDate() + task.duration);
        return endDate;
      } else if (task.startDate) {
        // For tasks with only start date (no duration)
        return new Date(task.startDate);
      }
    }
  }
  return undefined;
}

/**
 * Resolve all dependencies in the given sections
 * @param sections Sections with tasks that might have dependencies
 * @returns Updated sections with all dependencies resolved
 */
export function resolveDependencies(sections: Section[]): Section[] {
  let updatedSections = [...sections];
  let changesOccurred = true;
  let iterations = 0;
  const MAX_ITERATIONS = 10; // Safety limit to prevent infinite loops
  
  // Continue resolving dependencies until no more changes occur or max iterations reached
  while (changesOccurred && iterations < MAX_ITERATIONS) {
    changesOccurred = false;
    iterations++;
    
    for (let secIndex = 0; secIndex < updatedSections.length; secIndex++) {
      const section = updatedSections[secIndex];
      let updatedTasks = [...section.tasks];
      
      for (let taskIndex = 0; taskIndex < updatedTasks.length; taskIndex++) {
        const task = updatedTasks[taskIndex];
        
        // Only process tasks with dependencies that don't have a start date or have a placeholder date
        if (task.dependencies?.length && (!task.startDate || task.startDate.toString().includes('2000-01-01'))) {
          const dependencyId = task.dependencies[0]; // Take the first dependency
          const dependencyEndDate = findTaskEndDateById(dependencyId, updatedSections);
          
          if (dependencyEndDate) {
            // If we found a valid end date and it's different from current start date, mark that a change occurred
            if (!task.startDate || 
                task.startDate.getTime() !== dependencyEndDate.getTime()) {
              changesOccurred = true;
              
              // Create an updated task with the new start date
              const updatedTask = {
                ...task,
                startDate: dependencyEndDate
              };
              
              // For milestones, also update the startDate property
              if (task.type === 'milestone') {
                updatedTask.startDate = dependencyEndDate;
              }
              
              // Recalculate end date if duration is available and it's not a milestone
              if (task.type !== 'milestone' && task.duration) {
                const newEndDate = new Date(dependencyEndDate);
                newEndDate.setDate(newEndDate.getDate() + task.duration);
                updatedTask.endDate = newEndDate;
              }
              
              // Update the task in the array
              updatedTasks[taskIndex] = updatedTask;
            }
          }
        }
      }
      
      updatedSections[secIndex] = {
        ...section,
        tasks: updatedTasks
      };
    }
  }
  
  if (iterations >= MAX_ITERATIONS) {
    console.warn('Warning: Maximum dependency resolution iterations reached, possible circular dependency.');
  }
  
  return updatedSections;
}
