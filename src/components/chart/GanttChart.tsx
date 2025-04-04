import React, { useState, useCallback, useEffect } from 'react';
import {
  format,
  addDays,
  parseISO,
  differenceInDays,
  eachMonthOfInterval,
  eachWeekOfInterval,
  endOfWeek,
  differenceInCalendarDays,
} from 'date-fns';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Connection,
  ConnectionLineType,
} from 'reactflow';
import {
  GanttData,
  Task,
  Dependency,
} from '../../types';
import { CustomEdge } from './CustomEdge';
import { Sidebar } from './Sidebar';
import { TaskNode } from './nodes/TaskNode';
import { MonthNode } from './nodes/MonthNode';
import { WeekNode } from './nodes/WeekNode';
import { DayGridLine } from './nodes/DayGridLine';
import { MilestoneNode } from './nodes/MilestoneNode';
import { useGantt } from '../../contexts/GanttContext';
import { useDependencyViolations } from '../../contexts/DependencyViolationsContext';
import 'reactflow/dist/style.css';
import { useChartsList } from '../../contexts/ChartsListContext';
import ConfirmDialog from '../common/ConfirmDialog';
import { AssignRoleDialog } from '../common/AssignRoleDialog';
import { Role } from '../common/AssignRoleDialog';
// Shared constants that are exported to be used by node components
export const NODE_HEIGHT = 60;
export const TIMELINE_HEIGHT = 100;
export const DAY_WIDTH = 30;
export const VERTICAL_SPACING = 20;

const nodeTypes = {
  task: TaskNode,
  event: TaskNode, // Also use TaskNode for event type nodes
  milestone: MilestoneNode,
  month: MonthNode,
  week: WeekNode,
  dayGrid: DayGridLine,
};

interface ProcessTaskContext {
  currentRow: number;
}

interface GanttChartProps {
}

const edgeTypes = {
  default: CustomEdge,
};

const roles: Role[] = [
  // Creatives (People) - Using local images 1.jpg - 9.jpg cyclically
  { id: '1', name: 'Jessica: Project Manager', avatar: '/images/1.jpg', type: 'creative', isFavorite: true },
  { id: '2', name: 'Maria: Brand Specialist', avatar: '/images/2.jpg', type: 'creative', isFavorite: false },
  { id: '3', name: 'Sophia: Designer', avatar: '/images/3.jpg', type: 'creative', isFavorite: false },
  { id: '4', name: 'Caleb: Engineer', avatar: '/images/4.jpg', type: 'creative', isFavorite: false },
  { id: '5', name: 'Aiden: Brand Specialist', avatar: '/images/5.jpg', type: 'creative', isFavorite: false },
  { id: '6', name: 'Liliana: Project Manager', avatar: '/images/6.jpg', type: 'creative', isFavorite: false },
  { id: '7', name: 'George: Senior Designer', avatar: '/images/7.jpg', type: 'creative', isFavorite: false },
  { id: '8', name: 'Eden: Engineer', avatar: '/images/8.jpg', type: 'creative', isFavorite: false },
  { id: '9', name: 'Ryan: Developer', avatar: '/images/9.jpg', type: 'creative', isFavorite: false },
  { id: '10', name: 'Wyatt: Brand Specialist', avatar: '/images/1.jpg', type: 'creative', isFavorite: false },
  { id: '11', name: 'Leo: Senior Engineer', avatar: '/images/2.jpg', type: 'creative', isFavorite: false },
  { id: '12', name: 'Valentina: Senior Designer', avatar: '/images/3.jpg', type: 'creative', isFavorite: false },
  { id: '13', name: 'Oliver: Senior Engineer', avatar: '/images/4.jpg', type: 'creative', isFavorite: false },
  { id: '14', name: 'Eliza: Analyst', avatar: '/images/5.jpg', type: 'creative', isFavorite: false },
  { id: '15', name: 'Jack: Designer', avatar: '/images/6.jpg', type: 'creative', isFavorite: false },
  { id: '16', name: 'Jocelyn: Engineer', avatar: '/images/7.jpg', type: 'creative', isFavorite: false },
  { id: '17', name: 'Ryker: QA Tester', avatar: '/images/8.jpg', type: 'creative', isFavorite: false },
  { id: '18', name: 'Sawyer: Team Lead', avatar: '/images/9.jpg', type: 'creative', isFavorite: true },
  { id: '19', name: 'Kimberly: Manager', avatar: '/images/1.jpg', type: 'creative', isFavorite: true },
  { id: '20', name: 'Alexander: Architect', avatar: '/images/2.jpg', type: 'creative', isFavorite: true },

  // AI Agents - Updated to use lorelei avatars
  { id: 'ai-1', name: 'Brand Researcher', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=BrandResearcher', type: 'ai_agent', isFavorite: true },
  { id: 'ai-2', name: 'Drawing Checker', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=DrawingChecker', type: 'ai_agent', isFavorite: false },
  { id: 'ai-3', name: 'FEA Analyst', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=FEAAnalyst', type: 'ai_agent', isFavorite: true },
  { id: 'ai-4', name: 'Project Controller', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ProjectController', type: 'ai_agent', isFavorite: false },
  { id: 'ai-6', name: 'Requirements Analyst', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=RequirementsAnalyst', type: 'ai_agent', isFavorite: false },
  { id: 'ai-7', name: 'Risk Assessor', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=RiskAssessor', type: 'ai_agent', isFavorite: false },
  { id: 'ai-8', name: 'Compliance Checker', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ComplianceChecker', type: 'ai_agent', isFavorite: false },
  { id: 'ai-9', name: 'Resource Allocator', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ResourceAllocator', type: 'ai_agent', isFavorite: false }
];

export const GanttChart: React.FC<GanttChartProps> = () => {
  const { currentChart, setHoveredNodes, setCurrentChart } = useGantt();
  const { saveChart } = useChartsList();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const {
    dependencyViolations,
    checkForViolations,
  } = useDependencyViolations();

  const handleTaskClick = useCallback((task: Task) => {
    // Ensure we're always working with the most up-to-date task data from the chart
    if (!currentChart || !currentChart.tasks) {
      setSelectedTask(task);
      return;
    }

    // Helper function to find complete task data with dependencies
    const findTaskInData = (tasks: Task[]): Task | null => {
      for (const t of tasks) {
        if (t.id === task.id) {
          return t; // Return the complete task data from the chart
        }

        if (t.tasks && Array.isArray(t.tasks) && t.tasks.length > 0) {
          const foundTask = findTaskInData(t.tasks);
          if (foundTask) return foundTask;
        }
      }
      return null;
    };

    // Get complete task data from chart
    const completeTask = findTaskInData(currentChart.tasks);

    if (completeTask) {
      setSelectedTask(completeTask);
    } else {
      setSelectedTask(task);
    }
  }, [currentChart]);

  // Save changes to the database
  const saveChanges = useCallback((force = false) => {
    if (!currentChart || (!hasUnsavedChanges && !force)) {
      return Promise.resolve(false);
    }

    // Find all task nodes
    const taskNodes = nodes.filter((node) => node.type === 'task');

    // Create a deep copy of the current chart
    const updatedChart = JSON.parse(JSON.stringify(currentChart)) as GanttData;

    // Update all tasks with new positions based on node positions
    const updateTasksRecursive = (tasks: Task[]) => {
      tasks.forEach((task) => {
        const node = taskNodes.find((n) => n.id === task.id);

        if (node) {
          const newStart = node.data.start;
          const newEnd = node.data.end;

          task.start = newStart;
          task.end = newEnd;
        }

        const subtasks = task.tasks;
        if (subtasks && subtasks.length > 0) {
          updateTasksRecursive(subtasks);
        }
      });
    };

    updateTasksRecursive(updatedChart.tasks);

    return saveChart(updatedChart).then((result) => {
      setHasUnsavedChanges(false);
      return result;
    }).catch(() => {
      return false;
    });
  }, [currentChart, nodes, hasUnsavedChanges, saveChart]);

  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      if (!currentChart) return;

      const updatedChart = { ...currentChart };
      
      // Recursive helper function with proper type safety
      const updateTaskRecursive = (tasks: Task[]): boolean => {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].id === taskId) {
            tasks[i] = { ...tasks[i], ...updates };
            return true;
          }
          
          // Safely handle subtasks with proper type checking
          const subtasks = tasks[i].tasks;
          if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
            if (updateTaskRecursive(subtasks)) {
              return true;
            }
          }
        }
        return false;
      };

      // Use optional chaining and type guards to safely access tasks
      const tasks = updatedChart.tasks;
      if (tasks && Array.isArray(tasks)) {
        updateTaskRecursive(tasks);
      }

      setCurrentChart(updatedChart);
      setHasUnsavedChanges(true);
    },
    [currentChart, setCurrentChart, setHasUnsavedChanges]
  );
  
  const onUpdateChart = useCallback(
    (updates: { dependencies: Dependency[] }) => {
      if (!currentChart) return;
      const updatedChart = { ...currentChart, ...updates };
      setCurrentChart(updatedChart);
      setHasUnsavedChanges(true);
    },
    [currentChart, setCurrentChart, setHasUnsavedChanges]
  );

  const updateNodeDates = useCallback((node: Node, x: number) => {
    if (!currentChart) return { start: '', end: '' };

    const daysOffset = Math.round(x / DAY_WIDTH);
    const startDate = addDays(parseISO(currentChart.start), daysOffset);
    const duration = differenceInDays(parseISO(node.data.end), parseISO(node.data.start));
    const endDate = addDays(startDate, duration);

    return {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd'),
    };
  }, [currentChart]);

  // Track whether we're currently in a drag operation
  const [isDragging, setIsDragging] = useState(false);

  // Add nodeMouseEnter and nodeMouseLeave handlers
  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodes((prevHoveredNodes: string[]) => [...prevHoveredNodes, node.id]);
  }, [setHoveredNodes]);

  const onNodeMouseLeave = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodes((prevHoveredNodes: string[]) => prevHoveredNodes.filter((id) => id !== node.id));
  }, [setHoveredNodes]);

  const createTimelineNodes = useCallback(() => {
    if (!currentChart) return [];

    const timelineNodes: Node[] = [];
    const startDate = parseISO(currentChart.start);
    const endDate = parseISO(currentChart.end);

    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    months.forEach((month, index) => {
      const nextMonth = months[index + 1] || endDate;
      const width = differenceInDays(nextMonth, month) * DAY_WIDTH;
      const x = differenceInDays(month, startDate) * DAY_WIDTH;

      timelineNodes.push({
        id: `month-${month.toISOString()}`,
        type: 'month',
        position: { x, y: 0 },
        draggable: false,
        selectable: false,
        data: {
          label: format(month, 'MMMM yyyy'),
          width,
        },
      });
    });

    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    weeks.forEach((week) => {
      const weekEnd = endOfWeek(week);
      const width = DAY_WIDTH * 7;
      const x = differenceInDays(week, startDate) * DAY_WIDTH;

      timelineNodes.push({
        id: `week-${week.toISOString()}`,
        type: 'week',
        position: { x, y: 40 },
        draggable: false,
        selectable: false,
        data: {
          label: `${format(week, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
          width,
          weekStart: format(week, 'yyyy-MM-dd'),
        },
      });
    });

    return timelineNodes;
  }, [currentChart]);

  const createDayGridLines = useCallback(() => {
    if (!currentChart) return [];

    const dayNodes: Node[] = [];
    const startDate = parseISO(currentChart.start);
    const endDate = parseISO(currentChart.end);
    const totalDays = differenceInDays(endDate, startDate) + 1;

    // Create a grid line for each day
    for (let i = 0; i < totalDays; i++) {
      const dayDate = addDays(startDate, i);
      const x = i * DAY_WIDTH;

      dayNodes.push({
        id: `day-${i}`,
        type: 'dayGrid',
        position: { x, y: 0 },
        data: {
          x,
          date: format(dayDate, 'yyyy-MM-dd'),
          dayIndex: i,
        },
        draggable: false,
        selectable: false,
      });
    }

    return dayNodes;
  }, [currentChart]);

  const handleResizeRight = useCallback((nodeId: string, newWidth: number, newEndDate: string) => {

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              width: newWidth,
              end: newEndDate,
            },
          };
        }
        return node;
      })
    );
    
    // Update selected task if applicable
    setSelectedTask((prev) => 
      prev && prev.id === nodeId 
        ? { ...prev, end: newEndDate }
        : prev
    );
    
    setHasUnsavedChanges(true);
  }, [setNodes]);


  
  const processTask = useCallback(
    (
      task: Task,
      context: ProcessTaskContext,
      parentColor: string,
      isSubtask: boolean = false
    ): { nodes: Node[]; nextRow: number } => {
      if (!currentChart) return { nodes: [], nextRow: context.currentRow };

      const result = { nodes: [] as Node[], nextRow: context.currentRow };

      if (task.start && task.end) {
        const startDate = parseISO(task.start);
        const endDate = parseISO(task.end);
        
        // Ensure startDate is before endDate for width calculation
        const [earlierDate, laterDate] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
        
        const x = differenceInDays(earlierDate, parseISO(currentChart.start)) * DAY_WIDTH;
        const y = context.currentRow * (NODE_HEIGHT + VERTICAL_SPACING) + TIMELINE_HEIGHT;

        const width = (differenceInDays(laterDate, earlierDate) + 1) * DAY_WIDTH;

        // Always increment row for parent tasks with children
        if (task.tasks && task.tasks.length > 0) {
          result.nextRow = context.currentRow + 1;
        } else if (!task.tasks || isSubtask) {
          result.nextRow = context.currentRow + 1;
        }

        // Create the node with unified TaskNode handling both types
        result.nodes.push({
          id: task.id,
          type: task.type || 'task',
          position: { 
            // For event nodes, center them exactly on the day like milestone nodes
            x: task.type === 'event' ? (x + (DAY_WIDTH / 2) - 12) : x, 
            // For event nodes, centered vertically in the row
            y: task.type === 'event' ? (y + (NODE_HEIGHT / 2) - 12) : y 
          },
          draggable: true,
          data: {
            ...task,
            width: task.type === 'event' ? undefined : width, // Width only needed for regular tasks
            parentColor: parentColor,
            color: task.color || (task.type === 'event' ? '#3b82f6' : parentColor), // Default blue for events
            onResizeLeft: null,
            onResizeRight: task.type === 'event' ? null : handleResizeRight, // Events don't resize
            onUpdateTask: updateTask,
            onAddAboveClone,
            onAddAboveNewTask,
            onAddAboveNewEvent,
            onAddBelowClone,
            onAddBelowNewTask,
            onAddBelowNewEvent,
            onCreateSubTask,
            onDeleteTask,
            onAssignRole: onShowAssignRoleDialog,
            isResizing,
            setIsResizing,
            milestones: currentChart.milestones,
            onClick: handleTaskClick,
          },
        });
      }

      const subtasks = task.tasks;
      if (subtasks && subtasks.length > 0) {
        subtasks.forEach((childTask) => {
          const childResult = processTask(
            childTask,
            { currentRow: result.nextRow },
            task.color || parentColor,
            true
          );
          result.nodes.push(...childResult.nodes);
          result.nextRow = childResult.nextRow;
        });
      }

      return result;
    },
    [isResizing, currentChart, handleTaskClick, handleResizeRight, updateTask]
  );


  // Helper function to find a task in the task hierarchy
  const findTask = useCallback(
    (taskId: string, tasks?: Task[]): { task: Task | null; parent: Task[] | null; index: number } => {
      if (!tasks) {
        if (!currentChart || !currentChart.tasks) return { task: null, parent: null, index: -1 };
        tasks = currentChart.tasks;
      }
      
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) {
          return { task: tasks[i], parent: tasks, index: i };
        }
        
        // Safely check for subtasks using optional chaining
        const subtasks = tasks[i].tasks;
        if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
          const result = findTask(taskId, subtasks);
          if (result.task) {
            return result;
          }
        }
      }
      
      return { task: null, parent: null, index: -1 };
    },
    [currentChart]
  );
  
  // Helper function to generate a unique ID for a new task
  const generateTaskId = useCallback(() => {
    return 'task-' + Math.random().toString(36).substring(2, 11);
  }, []);
  
  // Helper function to validate task dates when adding new tasks
  const validateTaskDates = useCallback(
    (task: Task, tasks: Task[], dependencies: Dependency[]) => {
      // This calls the validation function from the dependency violations context
      // which combines all validation to prevent race conditions
      if (tasks && dependencies) {
        checkForViolations(tasks, dependencies);
      }
      return task;
    },
    [checkForViolations]
  );
  
  // Add a cloned task above the current task
  const onAddAboveClone = useCallback(
    (sourceTask: Task) => {
      if (!currentChart) return;
      
      const { parent, index } = findTask(sourceTask.id);
      if (!parent || index === -1) return;
      
      // Deep clone the task and generate a new ID
      const clonedTask: Task = JSON.parse(JSON.stringify(sourceTask));
      clonedTask.id = generateTaskId();
      
      // Clear any subtasks from the clone (we're just cloning the parent)
      clonedTask.tasks = [];
      
      // Insert the cloned task at the proper position
      const updatedChart = { ...currentChart };
      const updatedTasks = [...updatedChart.tasks];
      
      // Find the parent array and update it
      const { parent: targetParent } = findTask(sourceTask.id, updatedTasks);
      if (targetParent) {
        targetParent.splice(index, 0, clonedTask);
        
        // Validate dependencies to prevent race conditions
        validateTaskDates(clonedTask, updatedTasks, updatedChart.dependencies || []);
        
        setCurrentChart(updatedChart);
        setHasUnsavedChanges(true);
      }
    },
    [currentChart, findTask, generateTaskId, validateTaskDates, setCurrentChart, setHasUnsavedChanges]
  );
  
  // Add a new task above the current task
  const onAddAboveNewTask = useCallback(
    (sourceTask: Task) => {
      if (!currentChart) return;
      
      const { parent, index } = findTask(sourceTask.id);
      if (!parent || index === -1) return;
      
      // Create a new task with same dates but empty properties
      const newTask: Task = {
        id: generateTaskId(),
        name: 'New Task',
        start: sourceTask.start,
        end: sourceTask.end,
        color: sourceTask.color,
        tasks: []
      };
      
      // Insert the new task at the proper position
      const updatedChart = { ...currentChart };
      const updatedTasks = [...updatedChart.tasks];
      
      // Find the parent array and update it
      const { parent: targetParent } = findTask(sourceTask.id, updatedTasks);
      if (targetParent) {
        targetParent.splice(index, 0, newTask);
        
        // Validate dependencies to prevent race conditions
        validateTaskDates(newTask, updatedTasks, updatedChart.dependencies || []);
        
        setCurrentChart(updatedChart);
        setHasUnsavedChanges(true);
      }
    },
    [currentChart, findTask, generateTaskId, validateTaskDates, setCurrentChart, setHasUnsavedChanges]
  );
  
  // Add a new event above the current task
  const onAddAboveNewEvent = useCallback(
    (sourceTask: Task) => {
      if (!currentChart) return;
      
      const { parent, index } = findTask(sourceTask.id);
      if (!parent || index === -1) return;
      
      // Create a new event task (events are single-day tasks)
      const newEvent: Task = {
        id: generateTaskId(),
        name: 'New Event',
        start: sourceTask.start, // Same start as the source task
        end: sourceTask.start,   // Events are single-day, so end = start
        type: 'event',
        color: '#3b82f6', // Default blue for events
        tasks: []
      };
      
      // Insert the new event at the proper position
      const updatedChart = { ...currentChart };
      const updatedTasks = [...updatedChart.tasks];
      
      // Find the parent array and update it
      const { parent: targetParent } = findTask(sourceTask.id, updatedTasks);
      if (targetParent) {
        targetParent.splice(index, 0, newEvent);
        
        // Validate dependencies to prevent race conditions
        validateTaskDates(newEvent, updatedTasks, updatedChart.dependencies || []);
        
        setCurrentChart(updatedChart);
        setHasUnsavedChanges(true);
      }
    },
    [currentChart, findTask, generateTaskId, validateTaskDates, setCurrentChart, setHasUnsavedChanges]
  );
  
  // Add a cloned task below the current task
  const onAddBelowClone = useCallback(
    (sourceTask: Task) => {
      if (!currentChart) return;
      
      const { parent, index } = findTask(sourceTask.id);
      if (!parent || index === -1) return;
      
      // Deep clone the task and generate a new ID
      const clonedTask: Task = JSON.parse(JSON.stringify(sourceTask));
      clonedTask.id = generateTaskId();
      
      // Clear any subtasks from the clone (we're just cloning the parent)
      clonedTask.tasks = [];
      
      // Insert the cloned task at the proper position (below the source task)
      const updatedChart = { ...currentChart };
      const updatedTasks = [...updatedChart.tasks];
      
      // Find the parent array and update it
      const { parent: targetParent } = findTask(sourceTask.id, updatedTasks);
      if (targetParent) {
        targetParent.splice(index + 1, 0, clonedTask);
        
        // Validate dependencies to prevent race conditions
        validateTaskDates(clonedTask, updatedTasks, updatedChart.dependencies || []);
        
        setCurrentChart(updatedChart);
        setHasUnsavedChanges(true);
      }
    },
    [currentChart, findTask, generateTaskId, validateTaskDates, setCurrentChart, setHasUnsavedChanges]
  );
  
  // Add a new task below the current task
  const onAddBelowNewTask = useCallback(
    (sourceTask: Task) => {
      if (!currentChart) return;
      
      const { parent, index } = findTask(sourceTask.id);
      if (!parent || index === -1) return;
      
      // Create a new task with same dates but empty properties
      const newTask: Task = {
        id: generateTaskId(),
        name: 'New Task',
        start: sourceTask.start,
        end: sourceTask.end,
        color: sourceTask.color,
        tasks: []
      };
      
      // Insert the new task at the proper position (below the source task)
      const updatedChart = { ...currentChart };
      const updatedTasks = [...updatedChart.tasks];
      
      // Find the parent array and update it
      const { parent: targetParent } = findTask(sourceTask.id, updatedTasks);
      if (targetParent) {
        targetParent.splice(index + 1, 0, newTask);
        
        // Validate dependencies to prevent race conditions
        validateTaskDates(newTask, updatedTasks, updatedChart.dependencies || []);
        
        setCurrentChart(updatedChart);
        setHasUnsavedChanges(true);
      }
    },
    [currentChart, findTask, generateTaskId, validateTaskDates, setCurrentChart, setHasUnsavedChanges]
  );
  
  // Add a new event below the current task
  const onAddBelowNewEvent = useCallback(
    (sourceTask: Task) => {
      if (!currentChart) return;
      
      const { parent, index } = findTask(sourceTask.id);
      if (!parent || index === -1) return;
      
      // Create a new event task (events are single-day tasks)
      const newEvent: Task = {
        id: generateTaskId(),
        name: 'New Event',
        start: sourceTask.start, // Same start as the source task
        end: sourceTask.start,   // Events are single-day, so end = start
        type: 'event',
        color: '#3b82f6', // Default blue for events
        tasks: []
      };
      
      // Insert the new event at the proper position (below the source task)
      const updatedChart = { ...currentChart };
      const updatedTasks = [...updatedChart.tasks];
      
      // Find the parent array and update it
      const { parent: targetParent } = findTask(sourceTask.id, updatedTasks);
      if (targetParent) {
        targetParent.splice(index + 1, 0, newEvent);
        
        // Validate dependencies to prevent race conditions
        validateTaskDates(newEvent, updatedTasks, updatedChart.dependencies || []);
        
        setCurrentChart(updatedChart);
        setHasUnsavedChanges(true);
      }
    },
    [currentChart, findTask, generateTaskId, validateTaskDates, setCurrentChart, setHasUnsavedChanges]
  );
  


  // Function to generate a slightly different color for subtasks
  const getNextColor = (baseColor?: string): string => {
    // Default color if none provided
    const defaultColor = '#3b82f6'; // Primary blue
    
    if (!baseColor) return defaultColor;
    
    try {
      // Modern, professional color palette with hex codes
      const colors = [
        '#3b82f6', // Primary blue
        '#10b981', // Emerald green
        '#ef4444', // Red
        '#f59e0b', // Amber
        '#8b5cf6', // Violet
        '#ec4899', // Pink
        '#06b6d4', // Cyan
        '#6366f1', // Indigo
        '#84cc16', // Lime
        '#14b8a6', // Teal
        '#a855f7', // Purple
        '#f97316'  // Orange
      ];
      
      // Handle both hex codes and named colors
      let index = colors.indexOf(baseColor);
      if (index === -1) {
        // Try to find by simple name
        const colorNameMap: Record<string, string> = {
          'blue': '#3b82f6',
          'green': '#10b981',
          'red': '#ef4444',
          'yellow': '#f59e0b',
          'violet': '#8b5cf6',
          'pink': '#ec4899',
          'cyan': '#06b6d4',
          'indigo': '#6366f1',
          'lime': '#84cc16',
          'teal': '#14b8a6',
          'purple': '#a855f7',
          'orange': '#f97316'
        };
        
        const matchedHex = colorNameMap[baseColor.toLowerCase()];
        if (matchedHex) {
          index = colors.indexOf(matchedHex);
        }
      }
      
      // If still not found, start from beginning
      if (index === -1) return colors[0];
      
      return colors[(index + 1) % colors.length];
    } catch (error) {
      console.error('Error generating next color:', error);
      // If any error in color conversion, return default
      return defaultColor;
    }
  };

  // Placeholder for the createSubChart function (to be implemented later)
  const onCreateSubTask = useCallback((task: Task) => {
    if (!currentChart) return;
    let nextColor = getNextColor(task.color);
    // Create a new subtask with a slightly different color
    const newSubTask: Task = {
      id: generateTaskId(),
      name: 'New Subtask',
      start: task.start,
      end: task.end,
      color: nextColor,
      tasks: []
    };
    
    // Update the chart with the new subtask
    const updatedChart = { ...currentChart };
    const updatedTasks = [...updatedChart.tasks];
    
    // Find the task and add the subtask to its tasks array
    const updateTaskRecursive = (tasks: Task[]): boolean => {
      for (let i = 0; i < tasks.length; i++) {
        if (tasks[i].id === task.id) {
          // Initialize tasks array if it doesn't exist
          tasks[i].tasks = tasks[i].tasks || [];
          tasks[i].tasks!.push(newSubTask);
          return true;
        }
        
        if (tasks[i].tasks && tasks[i].tasks!.length > 0) {
          if (updateTaskRecursive(tasks[i].tasks!)) {
            return true;
          }
        }
      }
      return false;
    };
    
    if (updateTaskRecursive(updatedTasks)) {
      setCurrentChart(updatedChart);
      setHasUnsavedChanges(true);
    }
  }, [currentChart, generateTaskId, setCurrentChart, setHasUnsavedChanges]);

  // State for task deletion confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [assignRoleOpen, setAssignRoleOpen] = useState(false);
  const [taskToAssign, setTaskToAssign] = useState<Task | null>(null);

  const onDeleteTask = useCallback((task: Task) => {
    console.log('Delete task:', task.id);
    if (!currentChart) return;
    
    // Open the confirm dialog and set the task to delete
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  }, [currentChart]);

  const onShowAssignRoleDialog = useCallback((task: Task) => {
    console.log('Assign role to task:', task.id);
    if (!currentChart) return;
    
    // Open the confirm dialog and set the task to delete
    setTaskToAssign(task);
    setAssignRoleOpen(true);
  }, [currentChart]);

  // Actual delete function to be called after confirmation
  const confirmDeleteTask = useCallback(() => {
    if (!currentChart || !taskToDelete) return;
    
    // Create a copy of the chart
    const updatedChart = { ...currentChart };
    const updatedTasks = [...updatedChart.tasks];
    
    const { parent } = findTask(taskToDelete.id, updatedTasks);
    if (parent) {
      // Find and remove the task from its parent array
      const taskIndex = parent.findIndex(t => t.id === taskToDelete.id);
      if (taskIndex !== -1) {
        parent.splice(taskIndex, 1);
        
        // Also remove any dependencies involving this task
        if (updatedChart.dependencies) {
          updatedChart.dependencies = updatedChart.dependencies.filter(
            dep => dep.sourceId !== taskToDelete.id && dep.targetId !== taskToDelete.id
          );
        }
        
        setCurrentChart(updatedChart);
        setHasUnsavedChanges(true);
      }
    }
    
    // Close the dialog and reset the task to delete
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  }, [currentChart, findTask, taskToDelete, setCurrentChart, setHasUnsavedChanges]);

  // Handle new connections between nodes
  const onConnect = useCallback((connection: Connection) => {
    if (!currentChart || !connection.source || !connection.target) return;

    // Create a new dependency
    const newDependency: Dependency = {
      sourceId: connection.source, // Target task depends on source task
      targetId: connection.target  // Source task is the prerequisite
    };

    // Update the chart with the new dependency
    const updatedChart = {
      ...currentChart,
      dependencies: [...(currentChart.dependencies || []), newDependency]
    };

    // Check if this creates a dependency violation
    checkForViolations(updatedChart.tasks, updatedChart.dependencies);

    // Add the edge to the flow with proper type checking
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle || undefined,
      targetHandle: connection.targetHandle || undefined,
      type: 'default',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20
      }
    };
    
    setEdges(prev => [...prev, newEdge]);
    setCurrentChart(updatedChart);
    setHasUnsavedChanges(true);
  }, [currentChart, setEdges, setCurrentChart, checkForViolations]);

  // Modified drag handlers with isDragging state
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    if (!currentChart) return;
    setIsDragging(true);

    const newX = Math.round(node.position.x / DAY_WIDTH) * DAY_WIDTH;
    const updates = updateNodeDates(node, newX);

    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: { ...n.position, x: newX },
            data: {
              ...n.data,
              ...updates,
            },
          };
        }
        return n;
      })
    );

    setSelectedTask((prev) =>
      prev && prev.id === node.id
        ? { ...prev, ...updates }
        : prev
    );
  }, [setNodes, updateNodeDates, currentChart]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('onNodeDragStop', event, node);
    const newX = Math.round(node.position.x / DAY_WIDTH) * DAY_WIDTH;
    const updates = updateNodeDates(node, newX);
    updateTask(node.id, updates);
    const updatedNodes = nodes?.map((n) => {
        if (n.id === node.id) {
          
          return {
            ...n,
            position: { ...n.position, x: newX },
            data: {
              ...n.data,
              ...updates,
            },
          };
        }
        return n;
      });
    setNodes(updatedNodes);

    // Check if the new position violates any dependency constraints
    const updatedChart = { ...currentChart, nodes: updatedNodes };
    if (updatedChart?.tasks) {
      checkForViolations(updatedChart.tasks, updatedChart?.dependencies || []);
    }
    setSelectedTask((prev) =>
      prev && prev.id === node.id
        ? { ...prev, ...updates }
        : prev
    );

    // Set unsaved changes flag
    setHasUnsavedChanges(true);

    // Force save changes immediately with the force parameter,
    // bypassing the hasUnsavedChanges check which might not be updated yet
    saveChanges(true).then(() => {
      // Only mark drag as complete after the save operation finishes
      // This prevents node reinitialization until the new positions are saved
      setIsDragging(false);
    });
  }, [setNodes, updateNodeDates, currentChart, checkForViolations, saveChanges]);

  // Auto-save changes when they occur
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveChanges();
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, saveChanges]);

  // Use useEffect instead of useMemo to account for dragging state
  useEffect(() => {
    // Skip re-initializing nodes if dragging or resizing is in progress
    if (!currentChart || isDragging || isResizing) {
      return;
    }

    const timelineNodes = createTimelineNodes();
    const dayGridLines = createDayGridLines();
    const allNodes = [...timelineNodes, ...dayGridLines] as Node[];
    let currentRow = 1;

    currentChart.milestones.forEach((milestone) => {
      const milestoneDate = parseISO(milestone.start);
      const daysFromStart = differenceInCalendarDays(milestoneDate, parseISO(currentChart.start));
      const x = (daysFromStart * DAY_WIDTH);

      allNodes.push({
        id: milestone.id,
        type: 'milestone',
        position: { x, y: TIMELINE_HEIGHT },
        draggable: false,
        selectable: false,
        data: milestone,
      });
    });

    currentChart.tasks.forEach((task) => {
      if (!task.color) return;
      // For root-level tasks, use the chart's color as the parent color 
      // to ensure consistent brand coloring at top level
      const parentColor = currentChart.color || task.color;
      const result = processTask(task, { currentRow }, parentColor);
      allNodes.push(...result.nodes);
      currentRow = result.nextRow;
    });



    const myEdges: Edge[] = [];
    if (currentChart.dependencies) {
      currentChart.dependencies.forEach(dependency => {
        myEdges.push({
          id: `${dependency.sourceId}-${dependency.targetId}`,
          source: dependency.sourceId,
          target: dependency.targetId,
          sourceHandle: `${dependency.sourceId}-output`,
          targetHandle: `${dependency.targetId}-input`,
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20
          },
          style: {
            strokeWidth: 2,
            // Add visual indication for dependency violations
            stroke: dependencyViolations[`${dependency.sourceId}::${dependency.targetId}`] ? '#ff0000' : '#555555',
          },
        });
      });
    }

    setNodes(allNodes);
    setEdges(myEdges)
  }, [currentChart, processTask, createTimelineNodes, createDayGridLines, setNodes, setEdges, isDragging, isResizing]);

  // Separate effect for initial dependency validation
  // This runs only once after nodes are initially loaded
  const [hasValidatedInitialDependencies, setHasValidatedInitialDependencies] = useState(false);
const handleAssign = useCallback((roleId: string) => {
  if (!currentChart || !taskToAssign) return;
  
  // Create a deep copy of the chart
  const updatedChart = {...currentChart};
  
  // Find and update the task with the assigned role
  const updateTaskWithRole = (tasks: Task[]): Task[] => {
    return tasks.map(task => {
      if (task.id === taskToAssign.id) {
        // Update the task with the assigned role
        return {
          ...task,
          assignedRoleId: roleId,
          avatar: roles.find(role => role.id === roleId)?.avatar
        };
      }
      
      // If this task has subtasks, update them recursively
      if (task.tasks && task.tasks.length > 0) {
        return {
          ...task,
          tasks: updateTaskWithRole(task.tasks)
        };
      }
      
      return task;
    });
  };
  
  // Update the tasks in the chart
  updatedChart.tasks = updateTaskWithRole(updatedChart.tasks);
  
  // Update the chart state
  setCurrentChart(updatedChart);
  saveChart(updatedChart);
  
  // Close the dialog
  setAssignRoleOpen(false);
  setTaskToAssign(null);
}, [currentChart, taskToAssign, setCurrentChart, saveChart]);
  useEffect(() => {
    // Only run this once after the chart and nodes are loaded
    if (currentChart?.tasks && nodes.length > 0 && !hasValidatedInitialDependencies) {
      // Validate all dependencies
      checkForViolations(currentChart.tasks, currentChart.dependencies);

      // Mark validation as done to prevent infinite loops
      setHasValidatedInitialDependencies(true);
    }
  }, [currentChart, nodes, hasValidatedInitialDependencies, checkForViolations]);

  // Reset validation flag when chart changes
  useEffect(() => {
    if (currentChart?.id) {
      setHasValidatedInitialDependencies(false);
    }
  }, [currentChart?.id]);

  // Return early only after all hooks have been called
  if (!currentChart) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Gantt Chart Selected</h2>
          <p>Please select or create a Gantt chart to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onConnect={onConnect}
        fitView
        minZoom={0.1}
        maxZoom={2}
        panOnDrag={!isResizing}
        selectionOnDrag={true}
        nodesConnectable={true}
        connectionLineStyle={{ stroke: '#4f46e5', strokeWidth: 2 }}
        connectionLineType={ConnectionLineType.SmoothStep}
      >
        <Background gap={[DAY_WIDTH, DAY_WIDTH]} size={1} color="#d1d5db" />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <Sidebar
        selectedTask={selectedTask}
        milestones={currentChart.milestones}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={updateTask}
        onUpdateChart={onUpdateChart}
        onDeleteTask={onDeleteTask}
      />
      {hasUnsavedChanges && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded shadow-md">
          <button onClick={() => saveChanges()}>Save Changes</button>
        </div>
      )}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Confirm Deletion"
        message={taskToDelete ? `Are you sure you want to delete "${taskToDelete.name}"?` : ""}
        confirmLabel="Delete"
        onConfirm={confirmDeleteTask}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setTaskToDelete(null);
        }}
      />
      <AssignRoleDialog
        isOpen={assignRoleOpen}
        onAssign={handleAssign}
        roles={roles}
        task={taskToAssign}
        onClose={() => {
          setAssignRoleOpen(false);
          setTaskToAssign(null);
        }}
      />
      {Object.keys(dependencyViolations).length > 0 && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white rounded-lg shadow-lg overflow-hidden max-w-md">
          <div className="bg-red-600 px-4 py-2 font-semibold border-b border-red-700">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Dependency Violations
            </div>
          </div>
          <ul className="divide-y divide-red-700">
            {Object.entries(dependencyViolations).map(([id, violation]) => (
              <li 
                key={id} 
                className="px-4 py-3 hover:bg-red-600 cursor-pointer transition-colors duration-150 ease-in-out"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{violation.message}</p>
                    <p className="text-xs text-red-200 mt-1">
                      Source: {violation.sourceTaskId} → Target: {violation.targetTaskId}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};