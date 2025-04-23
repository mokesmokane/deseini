import { Task } from '../contexts/DraftPlan/types';
import { createTask } from './taskUtils';
/**
 * Find a task's end date by its ID across all sections
 * @param taskId ID of the task to find
 * @param tasks All tasks to search in
 * @returns The end date of the task, or undefined if not found
 */
export function findTaskEndDateById(taskId: string, tasks: Record<string, Task>): Date | undefined {
  const task = tasks[taskId];
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
  return undefined;
}
/**
 * Creates a milestone ID from the milestone name
 * @param name Milestone name
 * @returns Slugified milestone ID
 */
export const createMilestoneId = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '_')     // Replace spaces with underscores
    .trim();
};

/**
 * Creates a milestone object from a name and date
 * @param name Milestone name
 * @param dateStr Date string in YYYY-MM-DD format
 * @returns Milestone task object
 */
export const createMilestone = (name: string, dateStr: string): Task => {
  const milestoneDate = new Date(dateStr);
  const milestoneId = createMilestoneId(name);
  
  return {
    id: milestoneId,
    type: 'milestone',
    label: name,
    startDate: milestoneDate
  };
};

/**
 * Creates a milestone object with dependencies
 * @param name Milestone name
 * @param dependencyId The ID of the task this milestone depends on
 * @returns Milestone task object with dependencies
 */
export const createMilestoneWithDependency = (name: string, dependencyId: string, date: Date): Task => {
  const milestoneId = createMilestoneId(name);
  
  return {
    id: milestoneId,
    type: 'milestone',
    label: name,
    startDate: date,
    dependencies: [dependencyId]
  };
};

/**
 * Parses a single line of Mermaid Gantt syntax
 * @param line The line to parse
 * @param currentSection The name of the current section
 * @returns Object containing parsed information or null if line should be skipped
 */
export const parseMermaidLine = (line: string, currentSection: string | null, tasks: Record<string, Task>): {
  type: 'section' | 'task' | 'milestone' | 'skip';
  payload: any;
} => {
  line = line.trim();

  // Skip empty lines or mermaid directive lines
  if (!line || line === '```mermaid' || line === '```' || line === 'gantt') {
    return { type: 'skip', payload: null };
  }

  // Extract gantt title if available
  if (line.startsWith('title ') || line.startsWith('dateFormat ')) {
    return { type: 'skip', payload: null };
  }

  // Process sections
  if (line.startsWith('section ')) {
    const sectionName = line.substring('section '.length).trim();
    return { 
      type: 'section', 
      payload: { name: sectionName }
    };
  }
  
  // Not in a section yet, and not a section line, so ignore
  if (!currentSection) {
    return { type: 'skip', payload: null };
  }
  
  // Parse milestones with specific dates
  // e.g., "Milestone 1: milestone, 2025-02-15"
  const milestoneDateMatch = line.match(/^([^:]+):\s*milestone\s*,\s*(\d{4}-\d{2}-\d{2})/);
  if (milestoneDateMatch) {
    const milestoneName = milestoneDateMatch[1].trim();
    const milestoneDate = milestoneDateMatch[2];
    
    return {
      type: 'milestone',
      payload: {
        sectionName: currentSection,
        milestone: createMilestone(milestoneName, milestoneDate)
      }
    };
  }
  
  // Parse milestones with dependencies
  // e.g., "Milestone: milestone, after t1"
  const milestoneDependencyMatch = line.match(/^([^:]+):\s*milestone\s*,\s*after\s+([^,\s]+)/);
  if (milestoneDependencyMatch) {
    const milestoneName = milestoneDependencyMatch[1].trim();
    const dependencyId = milestoneDependencyMatch[2].trim();
    const dependencyEndDate = findTaskEndDateById(dependencyId, tasks);
    if (!dependencyEndDate) {
      throw new Error(`Dependency task ${dependencyId} not found`);
    }
    return {
      type: 'milestone',
      payload: {
        sectionName: currentSection,
        milestone: createMilestoneWithDependency(milestoneName, dependencyId, dependencyEndDate)
      }
    };
  }
  
  // Parse tasks with specific dates and durations
  // e.g., "Task 1:t1, 2025-01-01, 10d"
  const specificDateMatch = line.match(/^([^:]+):([^,]+),\s*(\d{4}-\d{2}-\d{2}),\s*(\d+)d/);
  if (specificDateMatch) {
    const taskName = specificDateMatch[1].trim();
    const taskId = specificDateMatch[2].trim();
    const startDateStr = specificDateMatch[3];
    const durationDays = parseInt(specificDateMatch[4], 10);
    
    const startDate = new Date(startDateStr);
    
    return {
      type: 'task',
      payload: {
        sectionName: currentSection,
        task: createTask(
          taskId,
          taskName,
          startDate,
          durationDays
        )
      }
    };
  }
  
  // Parse tasks with dependencies
  // e.g., "Task 2:t2, after t1, 5d"
  const dependencyMatch = line.match(/^([^:]+):([^,]+),\s*after\s+([^,]+),\s*(\d+)d/);
  if (dependencyMatch) {
    const taskName = dependencyMatch[1].trim();
    const taskId = dependencyMatch[2].trim();
    const dependencyId = dependencyMatch[3].trim();
    const durationDays = parseInt(dependencyMatch[4], 10);
    
    const dependencyEndDate = findTaskEndDateById(dependencyId, tasks);
    if (!dependencyEndDate) {
      throw new Error(`Dependency task ${dependencyId} not found`);
    }
    return {
      type: 'task',
      payload: {
        sectionName: currentSection,
        task: createTask(
          taskId,
          taskName,
          dependencyEndDate,
          durationDays,
          undefined,
          [dependencyId]
        )
      }
    };
  }
  
  // Parse tasks with custom dates and durations
  // For more complex syntax
  const generalTaskMatch = line.match(/^([^:]+):([^,]+),\s*([^,]+),\s*([^,]+)/);
  if (generalTaskMatch) {
    const taskName = generalTaskMatch[1].trim();
    const taskId = generalTaskMatch[2].trim();
    const startInfo = generalTaskMatch[3].trim();
    const durationInfo = generalTaskMatch[4].trim();
    
    // Handle different types of start info (specific date or dependency)
    let startDate: Date | undefined = undefined;
    let dependencies: string[] | undefined = undefined;
    
    if (startInfo.match(/\d{4}-\d{2}-\d{2}/)) {
      startDate = new Date(startInfo);
    } else if (startInfo.startsWith('after')) {
      const depId = startInfo.replace('after', '').trim();
      dependencies = [depId];
      const dependencyEndDate = findTaskEndDateById(depId, tasks);
      if (!dependencyEndDate) {
        throw new Error(`Dependency task ${depId} not found`);
      }
      startDate = dependencyEndDate;
    }
    
    // Parse duration
    let duration: number | undefined = undefined;
    if (durationInfo.endsWith('d')) {
      duration = parseInt(durationInfo.slice(0, -1), 10);
    }
    
    return {
      type: 'task',
      payload: {
        sectionName: currentSection,
        task: createTask(
          taskId,
          taskName,
          startDate!,
          duration,
          undefined,
          dependencies
        )
      }
    };
  }
  
  // If we couldn't parse the line, skip it
  return { type: 'skip', payload: null };
};

/**
 * Processes multiple lines of Mermaid syntax
 * @param lines Lines of Mermaid syntax
 * @returns Array of parsed tasks and sections
 */
export const processMultipleMermaidLines = (lines: string[]): {
  sections: Map<string, boolean>;
  tasks: Record<string, Task>;
  parsedResults: Array<{type: 'section' | 'task' | 'milestone' | 'skip'; payload: any}>;
} => {
  const sections = new Map<string, boolean>();
  const tasks: Record<string, Task> = {};
  let currentSection: string | null = null;
  
  const parsedResults = lines.map(line => {
    const result = parseMermaidLine(line, currentSection, tasks);
    
    // Update the current section if needed
    if (result.type === 'section') {
      currentSection = result.payload.name;
      if (!currentSection) {
        throw new Error('Section name cannot be null or undefined');
      }
      sections.set(currentSection, true);
    }
    
    // Add task to dictionary if it's a task or milestone
    if (result.type === 'task' && result.payload.task) {
      tasks[result.payload.task.id] = result.payload.task;
    } else if (result.type === 'milestone' && result.payload.milestone) {
      tasks[result.payload.milestone.id] = result.payload.milestone;
    }
    
    return result;
  });
  
  return { sections, tasks, parsedResults };
};
