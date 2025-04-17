import { Node } from 'reactflow';
import { Task, Section, Timeline } from '../../../contexts/DraftPlanContextMermaid';
import { 
  getXPositionFromDate, 
  getWidthBetweenDates, 
  getTaskDate 
} from './dateUtils';
import { calculateSectionDateBoundaries } from './taskUtils';

interface VisibilityState {
  visibleTasks: string[];
  tasksWithDates: string[];
  tasksWithDurations: string[];
  visibleSectionBars: string[];
  sectionBarsWithWidths: string[];
}

/**
 * Creates a timeline node for the flow chart
 */
export const createTimelineNode = (
  timeline: Timeline | undefined, 
  timelineWidth: number, 
  timelineVisible: boolean
): Node | null => {
  if (!timeline) return null;
  
  return {
    id: 'timeline',
    type: 'timeline',
    data: { 
      label: 'Timeline',
      startDate: timeline.startDate,
      endDate: timeline.endDate,
      width: timelineWidth,
      isVisible: timelineVisible,
    },
    position: { x: 10, y: 10 },  // Position timeline with slight padding
    style: { 
      opacity: timelineVisible ? 1 : 0,
      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    draggable: false, // Prevent dragging
  };
};

/**
 * Creates a generator node for the flow chart
 */
export const createGenerateNode = (yPosition: number = 50): Node => {
  return {
    id: 'generate_chart',
    type: 'generate',
    data: { 
      label: 'Chart Generator',
      isVisible: true,
    },
    position: { x: 50, y: yPosition },
    style: { 
      zIndex: 10,
    },
    draggable: true,
  };
};

/**
 * Creates a section bar node for the flow chart
 */
export const createSectionBarNode = (
  section: Section,
  timeline: Timeline | undefined,
  yPosition: number,
  visibilityState: VisibilityState
): Node => {
  const { startDate, endDate } = calculateSectionDateBoundaries(section);
  
  const sectionWidth = getWidthBetweenDates(startDate, endDate);
  const defaultStartDate = timeline?.startDate ? new Date(timeline.startDate) : new Date();
  const sectionXPosition = getXPositionFromDate(startDate, defaultStartDate) + 10;
  
  const sectionBarId = `section_bar_${section.name}`;
  const isSectionVisible = visibilityState.visibleSectionBars.includes(sectionBarId);
  const hasSectionWidth = visibilityState.sectionBarsWithWidths.includes(sectionBarId);
  
  return {
    id: sectionBarId,
    type: 'default',
    data: { 
      label: section.name,
    },
    position: { 
      x: sectionXPosition,
      y: yPosition, 
    },
    style: {
      width: hasSectionWidth ? `${sectionWidth}px` : '40px',
      height: '60px', // Match task height exactly
      borderRadius: '8px', // Match task border radius
      background: '#ffffff',
      border: '2px solid #000000', // Match task border thickness
      opacity: isSectionVisible ? 1 : 0,
      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 20px', // Match task padding
      fontSize: '16px', // Match task font size
      fontWeight: 'bold',
      color: '#000000',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    draggable: false, // Prevent dragging
  };
};

/**
 * Creates a milestone node for the flow chart
 */
export const createMilestoneNode = (
  task: Task,
  section: Section,
  timeline: Timeline | undefined,
  yPosition: number,
  visibilityState: VisibilityState
): Node => {
  const taskDate = getTaskDate(task);
  const isVisible = visibilityState.visibleTasks.includes(task.id);
  const hasDate = visibilityState.tasksWithDates.includes(task.id);
  
  const taskXPosition = hasDate
    ? getXPositionFromDate(taskDate, timeline?.startDate ? new Date(timeline.startDate) : new Date()) + 10
    : 10;
  
  return {
    id: task.id,
    type: 'milestone',
    data: {
      id: task.id,
      label: task.label,
      date: task.date || taskDate,
      isVisible,
      hasDate,
      sectionName: section.name,
    },
    position: { 
      x: taskXPosition,
      y: yPosition + 40, // Add offset to position milestone in a row below the prior task
    },
    style: {
      opacity: isVisible ? 1 : 0,
      transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 10, // Ensure milestones are on top
    },
    draggable: false, // Prevent dragging of milestone nodes
  };
};

/**
 * Creates a task node for the flow chart
 */
export const createTaskNode = (
  task: Task,
  section: Section,
  timeline: Timeline | undefined,
  yPosition: number,
  visibilityState: VisibilityState
): Node => {
  const taskDate = getTaskDate(task);
  const isVisible = visibilityState.visibleTasks.includes(task.id);
  const hasDate = visibilityState.tasksWithDates.includes(task.id);
  const hasDuration = visibilityState.tasksWithDurations.includes(task.id);
  
  const taskXPosition = hasDate
    ? getXPositionFromDate(taskDate, timeline?.startDate ? new Date(timeline.startDate) : new Date()) + 10
    : 10;
    
  // Calculate width for a regular task
  const taskWidth = task.duration && hasDuration
    ? task.duration * 30  // 30 pixels per day
    : 60;  // Default width
    
  return {
    id: task.id,
    type: 'task',
    data: {
      ...task,
      width: taskWidth,
      isVisible,
      hasDate,
      hasDuration,
      sectionName: section.name,
    },
    position: { 
      x: taskXPosition,
      y: yPosition,
    },
    style: {
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 2,
    },
    draggable: true, // Allow tasks to be dragged
  };
};

/**
 * Updates the node position based on a task's start date
 */
export const updateNodePositionFromDate = (
  node: Node,
  task: Task,
  timeline: Timeline | undefined
): Node => {
  if (!timeline?.startDate) return node;

  const taskDate = getTaskDate(task);
  const taskXPosition = getXPositionFromDate(taskDate, timeline.startDate) + 10;
  
  return {
    ...node,
    position: {
      ...node.position,
      x: taskXPosition
    }
  };
};

/**
 * Updates a node's data and position based on a task
 */
export const updateNodeDataFromTask = (
  node: Node,
  task: Task,
  newStartDate: Date
): Node => {
  if (node.type !== 'task') return node;

  return {
    ...node,
    data: {
      ...node.data,
      startDate: newStartDate,
      ...(task.duration ? {
        endDate: (() => {
          const endDate = new Date(newStartDate);
          endDate.setDate(endDate.getDate() + task.duration);
          return endDate;
        })()
      } : {})
    }
  };
};
