import { Node } from 'reactflow';
import { Task, Section, Timeline } from '../../../contexts/DraftPlanContextMermaid';
import { getXPositionFromDate, calculateTaskEndDate } from './dateUtils';

/**
 * Force update all tasks that depend on the given task ID with the provided end date
 * This ensures all dependent tasks move regardless of their current position
 */
export const processDependentTasks = (
  taskId: string, 
  sections: Section[], 
  dependencyEndDate: Date,
  timeline: Timeline | undefined,
  updateTaskStartDate: (taskId: string, startDate: Date) => void,
  updateFlowNodes: (updater: (prevNodes: Node[]) => Node[]) => void
) => {
  // Keep track of processed task IDs to avoid circular dependencies
  const processedTaskIds = new Set<string>();
  // Keep track of tasks that were actually updated
  const updatedTaskIds = new Set<string>();
  // Keep track of sections that need to be updated
  const affectedSectionNames = new Set<string>();
  
  // Process each task that depends on the given task ID recursively
  const processTaskDependents = (parentId: string, parentEndDate: Date) => {
    if (processedTaskIds.has(parentId)) {
      console.log(`Task ${parentId} already processed, skipping to avoid circular dependency`);
      return;
    }
    
    processedTaskIds.add(parentId);
    
    // Find all tasks that depend on this parent
    const directDependents: Task[] = [];
    for (const section of sections) {
      for (const task of section.tasks) {
        if (task.dependencies && task.dependencies.includes(parentId)) {
          directDependents.push(task);
          console.log(`Found task ${task.id} (${task.label}) depends on ${parentId}`);
          
          // Track which section this task belongs to
          for (const section of sections) {
            if (section.tasks.includes(task)) {
              affectedSectionNames.add(section.name);
              break;
            }
          }
        }
      }
    }
    
    // Process each dependent task
    for (const task of directDependents) {
      console.log(`Updating dependent task ${task.id} to start after ${parentEndDate}`);
      
      // Update the task start date to match the parent's end date
      updateTaskStartDate(task.id, parentEndDate);
      updatedTaskIds.add(task.id);
      
      // Calculate new X position based on the new start date
      const newXPosition = getXPositionFromDate(parentEndDate, timeline?.startDate || new Date()) + 10; // Add base offset
      
      // Also update the flowNodes to ensure hover details are updated AND position is updated
      updateFlowNodes(prevNodes => {
        return prevNodes.map(n => {
          if (n.id === task.id && n.type === 'task') {
            // Keep the same Y position but update X position based on new date
            return {
              ...n,
              position: {
                ...n.position,
                x: newXPosition
              },
              data: {
                ...n.data,
                startDate: parentEndDate,
                ...(task.duration ? {
                  endDate: (() => {
                    const endDate = new Date(parentEndDate);
                    endDate.setDate(endDate.getDate() + task.duration);
                    return endDate;
                  })()
                } : {})
              }
            };
          }
          return n;
        });
      });
      
      // Calculate this task's new end date for its dependents
      const taskEndDate = calculateTaskEndDate(task);
      
      // Process this task's dependents recursively
      processTaskDependents(task.id, taskEndDate);
    }
  };
  
  // Start the recursive process with the initial task
  processTaskDependents(taskId, dependencyEndDate);
  
  // After all tasks are updated, update the section bars for affected sections
  if (affectedSectionNames.size > 0) {
    console.log(`Updating section bars for sections: ${Array.from(affectedSectionNames).join(', ')}`);
    
    updateFlowNodes(prevNodes => {
      return prevNodes.map(node => {
        // Check if this is a section bar node for an affected section
        if (node.id.startsWith('section_') && affectedSectionNames.has(node.data.label)) {
          const sectionName = node.data.label;
          const section = sections.find(s => s.name === sectionName);
          
          if (section) {
            // Calculate section boundaries based on its tasks
            let sectionStartDate: Date | undefined;
            let sectionEndDate: Date | undefined;
            
            for (const task of section.tasks) {
              const taskStartDate = task.startDate ? new Date(task.startDate) : 
                           (task.date ? new Date(task.date) : new Date());
              
              // Update section start date
              if (!sectionStartDate || taskStartDate < sectionStartDate) {
                sectionStartDate = new Date(taskStartDate);
              }
              
              // Calculate task end date
              const taskEndDate = calculateTaskEndDate(task);
              
              // Update section end date
              if (!sectionEndDate || taskEndDate > sectionEndDate) {
                sectionEndDate = new Date(taskEndDate);
              }
            }
            
            if (sectionStartDate && sectionEndDate && timeline?.startDate) {
              // Calculate new X position and width
              const newXPosition = getXPositionFromDate(sectionStartDate, timeline.startDate) + 10; // Add base offset
              const sectionWidth = Math.abs(sectionEndDate.getTime() - sectionStartDate.getTime()) / 
                               (1000 * 60 * 60 * 24) * 30; // 30 pixels per day
              
              // Update the section bar node
              return {
                ...node,
                position: {
                  ...node.position,
                  x: newXPosition
                },
                style: {
                  ...node.style,
                  width: `${sectionWidth}px`
                }
              };
            }
          }
        }
        return node;
      });
    });
  }
  
  return {
    updatedTaskIds: Array.from(updatedTaskIds),
    affectedSectionNames: Array.from(affectedSectionNames)
  };
};
