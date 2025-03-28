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
  isBefore,
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
  Position,
  getSmoothStepPath,
  Connection,
  addEdge,
  ConnectionLineType,
} from 'reactflow';
import {
  GanttData,
  Task,
} from '../../types';
import { Sidebar } from './Sidebar';
import { TaskNode } from './nodes/TaskNode';
import { MonthNode } from './nodes/MonthNode';
import { WeekNode } from './nodes/WeekNode';
import { DayGridLine } from './nodes/DayGridLine';
import { MilestoneNode } from './nodes/MilestoneNode';
import { useGantt } from '../../context/GanttContext';
import { useDependencyViolations } from '../../contexts/DependencyViolationsContext';
import 'reactflow/dist/style.css';

// Shared constants that are exported to be used by node components
export const NODE_HEIGHT = 60;
export const TIMELINE_HEIGHT = 100;
export const DAY_WIDTH = 30;
export const VERTICAL_SPACING = 20;

const nodeTypes = {
  task: TaskNode,
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

// Custom edge component that handles hover visibility
const CustomEdge = ({
  id,
  source,
  target,
  style,
  markerEnd,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: any) => {
  const { hoveredNodes, hoveredDayIndex, currentChart } = useGantt();
  const { dependencyViolations } = useDependencyViolations();

  // Helper function to get task by ID
  const getTaskById = (id: string) => {
    const findTask = (tasks: any[]): any => {
      for (const task of tasks) {
        if (task.id === id) return task;
        if (task.tasks && task.tasks.length > 0) {
          const found = findTask(task.tasks);
          if (found) return found;
        }
      }
      return null;
    };
    return findTask(currentChart?.tasks || []);
  };

  // Check if this edge (source->target) has a dependency violation
  let isViolation = false;

  // Get the task objects to check the correct dependency relationship
  const sourceTask = getTaskById(source);
  const targetTask = getTaskById(target);

  // CRITICAL FIX: Much simpler and more direct approach to dependency violation detection
  if (sourceTask && targetTask) {
    // In React Flow, an edge goes from source to target
    // In our dependency model, the target depends on the source

    // Check if this edge represents a dependency relationship
    const hasDependency = targetTask.dependsOn?.includes(source);

    if (hasDependency) {
      // IMPORTANT: Check directly for violations using task IDs
      // Violations are stored on the dependent task (the task with dependsOn)
      if (dependencyViolations[target]) {
        isViolation = true;
      }
    }
  }

  // Check if this edge should be visible because a node is hovered
  const isVisibleFromNodeHover =
    hoveredNodes.includes(source) || hoveredNodes.includes(target);

  // Check if this edge should be visible because of day hover
  let isVisibleFromDayHover = false;

  if (hoveredDayIndex !== null && currentChart) {
    // Helper function to recursively find a task by ID in a nested structure
    const findTaskById = (tasks: any[], id: string): any => {
      for (const task of tasks) {
        if (task.id === id) return task;
        const subtasks = task.tasks;
        if (subtasks && subtasks.length > 0) {
          const found = findTaskById(subtasks, id);
          if (found) return found;
        }
      }
      return null;
    };

    // Find the target task using the recursive helper
    const targetTask = findTaskById(currentChart.tasks, target);

    if (targetTask && targetTask.start) {
      const taskStartDate = parseISO(targetTask.start);
      const startDate = parseISO(currentChart.start);
      const hoveredDate = addDays(startDate, hoveredDayIndex);

      // Show edge if the task starts before or on the hovered date
      isVisibleFromDayHover =
        isBefore(taskStartDate, hoveredDate) ||
        format(taskStartDate, 'yyyy-MM-dd') === format(hoveredDate, 'yyyy-MM-dd');
    }
  }

  // Dependency violation edges should always be visible, regardless of hover state
  const visible = isViolation || isVisibleFromNodeHover || isVisibleFromDayHover;

  // Determine styling based on visibility source
  let edgeStyle = { ...style };
  if (visible) {
    if (isViolation) {
      edgeStyle = {
        ...style,
        stroke: '#ff0000', // Red color for violations
        strokeWidth: 3, // Thicker for violations
      };
    } else if (isVisibleFromDayHover) {
      edgeStyle = {
        ...style,
        stroke: '#4f46e5', // Indigo color for day hover
        strokeWidth: 3, // Thicker for day hover
      };
    } else if (isVisibleFromNodeHover) {
      edgeStyle = {
        ...style,
        strokeWidth: 2.5, // Slightly thicker for node hover
      };
    }
  }

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition || Position.Right,
    targetX,
    targetY,
    targetPosition: targetPosition || Position.Left,
  });

  return (
    <path
      id={id}
      d={edgePath}
      markerEnd={markerEnd}
      style={{
        ...edgeStyle,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease',
      }}
      className="react-flow__edge-path"
    />
  );
};

const edgeTypes = {
  default: CustomEdge,
};

export const GanttChart: React.FC<GanttChartProps> = () => {
  const { currentChart, saveChart, setHoveredNodes, setCurrentChart } = useGantt();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const {
    dependencyViolations,
    validateDependencyConstraints,
    validateEndDateConstraints,
    validateTaskDates,
    clearDependencyViolation,
    clearViolations,
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

  const processTask = useCallback(
    (
      task: Task,
      context: ProcessTaskContext,
      parentColor?: string,
      isSubtask: boolean = false
    ): { nodes: Node[]; edges: Edge[]; nextRow: number } => {
      if (!currentChart) return { nodes: [], edges: [], nextRow: context.currentRow };

      const result = { nodes: [] as Node[], edges: [] as Edge[], nextRow: context.currentRow };

      if (task.start && task.end) {
        const startDate = parseISO(task.start);
        const x = differenceInDays(startDate, parseISO(currentChart.start)) * DAY_WIDTH;
        const y = context.currentRow * (NODE_HEIGHT + VERTICAL_SPACING) + TIMELINE_HEIGHT;

        const endDate = parseISO(task.end);
        const width = (differenceInDays(endDate, startDate) + 1) * DAY_WIDTH;

        if (!task.tasks || isSubtask) {
          result.nextRow = context.currentRow + 1;
        }

        result.nodes.push({
          id: task.id,
          type: 'task',
          position: { x, y },
          draggable: true, // Always set to true, we'll handle resize vs drag in the component
          data: {
            ...task,
            width,
            color: task.color || parentColor,
            onResizeLeft: null,
            onResizeRight: null,
            isResizing,
            setIsResizing,
            milestones: currentChart.milestones,
            onClick: handleTaskClick,
          },
        });

        if (task.dependsOn) {
          task.dependsOn.forEach((dependency) => {
            result.edges.push({
              id: `${dependency}-${task.id}`,
              source: dependency,
              target: task.id,
              sourceHandle: `${dependency}-output`,
              targetHandle: `${task.id}-input`,
              type: 'default',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
              },
              style: {
                strokeWidth: 2,
                // Add visual indication for dependency violations
                stroke: dependencyViolations[dependency] ? '#ff0000' : '#555555',
              },
            });
          });
        }
      }

      const subtasks = task.tasks;
      if (subtasks && subtasks.length > 0) {
        subtasks.forEach((childTask) => {
          const childResult = processTask(
            childTask,
            { currentRow: result.nextRow },
            task.color,
            true
          );
          result.nodes.push(...childResult.nodes);
          result.edges.push(...childResult.edges);
          result.nextRow = childResult.nextRow;
        });
      }

      return result;
    },
    [isResizing, currentChart, handleTaskClick, dependencyViolations]
  );

  // Function to validate all dependencies in the chart
  const validateAllDependencies = useCallback((tasks: Task[]) => {
    // Helper function to recursively check all task dependencies
    const checkTaskDependencies = (taskList: Task[]) => {
      taskList.forEach((task) => {
        if (task.start && task.dependsOn && task.dependsOn.length > 0) {
          // Validate upstream dependencies for this task
          const startDate = parseISO(task.start);
          validateDependencyConstraints(task.id, startDate, tasks);
        }

        if (task.end) {
          // Validate downstream dependencies for this task (tasks that depend on it)
          const endDate = parseISO(task.end);
          validateEndDateConstraints(task.id, endDate, tasks);
        }

        // Recursively check subtasks if any
        if (task.tasks && task.tasks.length > 0) {
          checkTaskDependencies(task.tasks);
        }
      });
    };

    checkTaskDependencies(tasks);
  }, [validateDependencyConstraints, validateEndDateConstraints]);

  // Handle new connections between nodes
  const onConnect = useCallback((connection: Connection) => {
    // Get source and target from the connection
    const sourceId = connection.source;
    const targetId = connection.target;

    if (!sourceId || !targetId) {
      return;
    }

    // Check if edge already exists
    const edgeExists = edges.some(
      (edge) => edge.source === sourceId && edge.target === targetId
    );

    if (edgeExists) {
      return;
    }

    // Create a new edge
    const newEdge: Edge = {
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      sourceHandle: `${sourceId}-output`,
      target: targetId,
      targetHandle: `${targetId}-input`,
      type: 'dependency',
    };

    // Add to edges
    setEdges((eds) => [...eds, newEdge]);

    // Find target task to update dependencies
    if (currentChart && currentChart.tasks) {
      // Create a function to find and extract the target task
      const findTask = (tasks: Task[], id: string): Task | null => {
        for (const task of tasks) {
          if (task.id === id) {
            return task;
          }
          if (task.tasks && task.tasks.length > 0) {
            const found = findTask(task.tasks, id);
            if (found) return found;
          }
        }
        return null;
      };

      // Get the target task
      const targetTask = findTask(currentChart.tasks, targetId);

      if (targetTask) {
        // Get current dependencies or initialize empty array
        const currentDependencies = targetTask.dependsOn || [];

        // Add new dependency if it doesn't already exist
        if (!currentDependencies.includes(sourceId)) {
          const updatedDependencies = [...currentDependencies, sourceId];

          // Update task with new dependencies
          updateTask(targetId, { dependsOn: updatedDependencies });

          // Validate dependency constraints
          const targetStartDate = targetTask.start ? parseISO(targetTask.start) : new Date();
          validateDependencyConstraints(targetId, targetStartDate, currentChart.tasks);
        }
      }
    }
  }, [currentChart, edges, updateTask, validateDependencyConstraints]);

  // Modified drag handlers with isDragging state
  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
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
  }, [setNodes, updateNodeDates, currentChart, validateDependencyConstraints]);

  const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
    const newX = Math.round(node.position.x / DAY_WIDTH) * DAY_WIDTH;
    const updates = updateNodeDates(node, newX);

    // Check if the new position violates any dependency constraints
    let isValid = true;
    if (currentChart?.tasks) {
      // Use the combined validation function to check both start and end dates at once
      const startDate = parseISO(updates.start);
      const endDate = parseISO(updates.end);
      isValid = validateTaskDates(node.id, startDate, endDate, currentChart.tasks);

      if (isValid) {
        clearDependencyViolation(node.id);
      }
    }

    setNodes((nds) => {
      const updatedNodes = nds.map((n) => {
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
      return updatedNodes;
    });

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
  }, [setNodes, updateNodeDates, currentChart, validateTaskDates, clearDependencyViolation, saveChanges]);

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
    const allNodesAndEdges = { nodes: [...timelineNodes, ...dayGridLines] as Node[], edges: [] as Edge[] };
    let currentRow = 1;

    currentChart.milestones.forEach((milestone) => {
      const milestoneDate = parseISO(milestone.start);
      const daysFromStart = differenceInCalendarDays(milestoneDate, parseISO(currentChart.start));
      const x = (daysFromStart * DAY_WIDTH);

      allNodesAndEdges.nodes.push({
        id: milestone.id,
        type: 'milestone',
        position: { x, y: TIMELINE_HEIGHT },
        draggable: false,
        data: milestone,
      });
    });

    currentChart.tasks.forEach((task) => {
      const result = processTask(task, { currentRow });
      allNodesAndEdges.nodes.push(...result.nodes);
      allNodesAndEdges.edges.push(...result.edges);
      currentRow = result.nextRow;
    });

    setNodes(allNodesAndEdges.nodes);
    setEdges(allNodesAndEdges.edges);
  }, [currentChart, processTask, createTimelineNodes, createDayGridLines, setNodes, setEdges, isDragging, isResizing]);

  // Separate effect for initial dependency validation
  // This runs only once after nodes are initially loaded
  const [hasValidatedInitialDependencies, setHasValidatedInitialDependencies] = useState(false);

  useEffect(() => {
    // Only run this once after the chart and nodes are loaded
    if (currentChart?.tasks && nodes.length > 0 && !hasValidatedInitialDependencies) {
      // Clear previous violations first
      clearViolations();

      // Validate all dependencies
      validateAllDependencies(currentChart.tasks);

      // Mark validation as done to prevent infinite loops
      setHasValidatedInitialDependencies(true);
    }
  }, [currentChart, nodes, hasValidatedInitialDependencies, clearViolations, validateAllDependencies]);

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
      />
      {hasUnsavedChanges && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded shadow-md">
          <button onClick={() => saveChanges()}>Save Changes</button>
        </div>
      )}
      {Object.keys(dependencyViolations).length > 0 && (
        <div className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded shadow-md">
          <p>Dependency violations detected</p>
        </div>
      )}
    </div>
  );
};