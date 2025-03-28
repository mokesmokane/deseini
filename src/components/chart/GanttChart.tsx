import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
} from 'reactflow';
import { GanttData, Task } from '../../types';
import { Sidebar } from './Sidebar';
import { TaskNode } from './nodes/TaskNode';
import { MonthNode } from './nodes/MonthNode';
import { WeekNode } from './nodes/WeekNode';
import { DayGridLine } from './nodes/DayGridLine';
import { MilestoneNode } from './nodes/MilestoneNode';
import { useGantt } from '../../context/GanttContext';
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
const CustomEdge = ({ id, source, target, style, markerEnd, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: any) => {
  const { hoveredNodes } = useGantt();
  
  const visible = hoveredNodes.includes(source) || hoveredNodes.includes(target);
  
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
        ...style,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
      className="react-flow__edge-path"
    />
  );
};

const edgeTypes = {
  default: CustomEdge,
};

export const GanttChart: React.FC<GanttChartProps> = () => {
  const { currentChart, saveChart, hoveredNodes, setHoveredNodes } = useGantt();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [dependencyViolations, setDependencyViolations] = useState<Record<string, string>>({});
  
  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
  }, []);

  // Helper function to find a task by its ID
  const findTaskById = useCallback((taskId: string, tasks: Task[]): Task | null => {
    for (const task of tasks) {
      if (task.id === taskId) {
        return task;
      }
      if (task.tasks) {
        const found = findTaskById(taskId, task.tasks);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Function to check if a task violates dependency constraints
  const validateDependencyConstraints = useCallback((taskId: string, startDate: Date, tasks: Task[]): boolean => {
    const task = findTaskById(taskId, tasks);
    if (!task || !task.dependsOn || task.dependsOn.length === 0) return true;

    let isValid = true;
    const violations: Record<string, string> = {};

    task.dependsOn.forEach(dependencyId => {
      const dependencyTask = findTaskById(dependencyId, tasks);
      if (dependencyTask && dependencyTask.end) {
        const dependencyEndDate = parseISO(dependencyTask.end);
        
        // Check if the task starts before its dependency ends
        if (isBefore(startDate, dependencyEndDate)) {
          isValid = false;
          violations[dependencyId] = `Task "${task.name}" cannot start before its dependency "${dependencyTask.name}" ends`;
        }
      }
    });

    setDependencyViolations(prev => ({...prev, ...violations}));
    return isValid;
  }, [findTaskById]);

  // Function to clear dependency violations for a task
  const clearDependencyViolation = useCallback((taskId: string) => {
    setDependencyViolations(prev => {
      const newViolations = {...prev};
      Object.keys(newViolations).forEach(key => {
        if (key.includes(taskId)) {
          delete newViolations[key];
        }
      });
      return newViolations;
    });
  }, []);

  // Save changes to the database
  const saveChanges = useCallback(() => {
    if (!currentChart || !hasUnsavedChanges) return;
    
    // Find all task nodes
    const taskNodes = nodes.filter(node => node.type === 'task');
    
    // Create a deep copy of the current chart
    const updatedChart = JSON.parse(JSON.stringify(currentChart)) as GanttData;
    
    // Helper function to recursively update tasks
    const updateTasksRecursive = (tasks: Task[]): Task[] => {
      return tasks.map(task => {
        const node = taskNodes.find(n => n.id === task.id);
        
        if (node) {
          // Update task with node data
          task.start = node.data.start;
          task.end = node.data.end;
          
          // Handle other task properties if needed
          if (node.data.description !== undefined) {
            task.description = node.data.description;
          }
          
          if (node.data.relevantMilestones !== undefined) {
            task.relevantMilestones = node.data.relevantMilestones;
          }

          // Update dependencies
          if (node.data.dependsOn !== undefined) {
            task.dependsOn = node.data.dependsOn;
          }
        }
        
        // Process nested tasks if any
        if (task.tasks && task.tasks.length > 0) {
          task.tasks = updateTasksRecursive(task.tasks);
        }
        
        return task;
      });
    };
    
    // Update all tasks with current node data
    updatedChart.tasks = updateTasksRecursive(updatedChart.tasks);
    
    // Save the updated chart
    saveChart(updatedChart).then(() => {
      setHasUnsavedChanges(false);
    });
  }, [currentChart, nodes, hasUnsavedChanges, saveChart]);
  
  // Auto-save changes when they occur
  useEffect(() => {
    if (hasUnsavedChanges) {
      const timeoutId = setTimeout(() => {
        saveChanges();
      }, 2000); // Save after 2 seconds of inactivity
      
      return () => clearTimeout(timeoutId);
    }
  }, [hasUnsavedChanges, saveChanges]);

  const handleUpdateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    if (!currentChart) return;
    
    // Check dependency constraints if updating start date
    if (updates.start && currentChart.tasks) {
      const startDate = parseISO(updates.start);
      const isValid = validateDependencyConstraints(taskId, startDate, currentChart.tasks);
      
      if (!isValid) {
        // You could either prevent the update or just show warnings
        // For now, we'll allow the update but keep the warnings visible
      } else {
        clearDependencyViolation(taskId);
      }
    }

    // Update dependencies if provided
    if (updates.dependsOn) {
      // Update edges to reflect new dependencies
      setEdges(eds => {
        // Remove existing edges for this task
        const filteredEdges = eds.filter(edge => edge.target !== taskId);
        
        // Add new edges for dependencies
        const newEdges = updates.dependsOn?.map(dependency => ({
          id: `${dependency}-${taskId}`,
          source: dependency,
          target: taskId,
          sourceHandle: `${dependency}-output`,
          targetHandle: `${taskId}-input`,
          type: 'default',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
          },
          style: {
            strokeWidth: 2,
          },
        })) || [];
        
        return [...filteredEdges, ...newEdges];
      });
    }
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === taskId && node.type === 'task') {
          const updatedData = { ...node.data, ...updates };
          const startDate = parseISO(updatedData.start);
          const endDate = parseISO(updatedData.end);
          const width = (differenceInDays(endDate, startDate) + 1) * DAY_WIDTH;
          const x = differenceInDays(startDate, parseISO(currentChart.start)) * DAY_WIDTH;

          return {
            ...node,
            position: { ...node.position, x },
            data: {
              ...updatedData,
              width,
            },
          };
        }
        return node;
      })
    );
    setSelectedTask((prev) => prev && prev.id === taskId ? { ...prev, ...updates } : prev);
    setHasUnsavedChanges(true);
  }, [currentChart, setNodes, setEdges, validateDependencyConstraints, clearDependencyViolation]);

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

  const handleResizeLeft = useCallback((nodeId: string, newWidth: number, newEndDate: string, newStartDate: string) => {
    if (!currentChart) return;
    
    // Validate dependency constraints for the new start date
    if (currentChart.tasks) {
      const startDate = parseISO(newStartDate);
      const isValid = validateDependencyConstraints(nodeId, startDate, currentChart.tasks);
      
      if (!isValid) {
        // You could either prevent the resize or just show warnings
        // For now, we'll allow the resize but keep the warnings visible
      } else {
        clearDependencyViolation(nodeId);
      }
    }
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const startDate = parseISO(newStartDate);
          const x = differenceInDays(startDate, parseISO(currentChart.start)) * DAY_WIDTH;
          
          return {
            ...node,
            position: { ...node.position, x },
            data: {
              ...node.data,
              width: newWidth,
              start: newStartDate,
              end: newEndDate,
            },
          };
        }
        return node;
      })
    );
    
    // Update selected task if applicable
    setSelectedTask((prev) => {
      if (prev) {
        return { 
          ...prev, 
          start: newStartDate,
          end: newEndDate 
        };
      }
      return prev;
    });
    
    setHasUnsavedChanges(true);
  }, [setNodes, currentChart, validateDependencyConstraints, clearDependencyViolation]);

  const updateNodeDates = useCallback((node: Node, x: number) => {
    if (!currentChart) return { start: '', end: '' };
    
    const daysOffset = Math.round(x / DAY_WIDTH);
    const startDate = addDays(parseISO(currentChart.start), daysOffset);
    const duration = differenceInDays(parseISO(node.data.end), parseISO(node.data.start));
    const endDate = addDays(startDate, duration);
    
    return {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    };
  }, [currentChart]);

  const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
    const newX = Math.round(node.position.x / DAY_WIDTH) * DAY_WIDTH;
    const updates = updateNodeDates(node, newX);
    
    // Validate dependency constraints during drag
    if (currentChart?.tasks) {
      const startDate = parseISO(updates.start);
      validateDependencyConstraints(node.id, startDate, currentChart.tasks);
    }
    
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: { ...n.position, x: newX },
            data: {
              ...n.data,
              ...updates
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
      const startDate = parseISO(updates.start);
      isValid = validateDependencyConstraints(node.id, startDate, currentChart.tasks);
      
      if (isValid) {
        clearDependencyViolation(node.id);
      }
    }
    
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === node.id) {
          return {
            ...n,
            position: { ...n.position, x: newX },
            data: {
              ...n.data,
              ...updates
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
    
    setHasUnsavedChanges(true);
  }, [setNodes, updateNodeDates, currentChart, validateDependencyConstraints, clearDependencyViolation]);

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
        data: {
          label: format(month, 'MMMM yyyy'),
          width,
        },
        draggable: false,
        selectable: false,
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
        data: {
          label: `${format(week, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
          width,
          weekStart: format(week, 'yyyy-MM-dd'),
        },
        draggable: false,
        selectable: false,
      });
    });

    return timelineNodes;
  }, [currentChart]);

  const processTask = useCallback((
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
          onResizeLeft: handleResizeLeft,
          onResizeRight: handleResizeRight,
          isResizing,
          setIsResizing,
          milestones: currentChart.milestones,
          onClick: handleTaskClick,
        },
      });

      if (task.dependsOn) {
        task.dependsOn.forEach(dependency => {
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

    if (task.tasks) {
      task.tasks.forEach((childTask) => {
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
  }, [handleResizeLeft, handleResizeRight, isResizing, currentChart, handleTaskClick, dependencyViolations]);

  // Add nodeMouseEnter and nodeMouseLeave handlers
  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodes((prevHoveredNodes: string[]) => [...prevHoveredNodes, node.id]);
  }, [setHoveredNodes]);

  const onNodeMouseLeave = useCallback((_: React.MouseEvent, node: Node) => {
    setHoveredNodes((prevHoveredNodes: string[]) => prevHoveredNodes.filter(id => id !== node.id));
  }, [setHoveredNodes]);

  useMemo(() => {
    if (!currentChart) return;
    
    const timelineNodes = createTimelineNodes();
    const allNodesAndEdges = { nodes: [...timelineNodes] as Node[], edges: [] as Edge[] };
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
  }, [currentChart, processTask, createTimelineNodes, setNodes, setEdges]);

  // Log current chart state to help with debugging
  useEffect(() => {
    if (currentChart) {
      console.log('GanttChart: Current chart loaded:', currentChart.id);
    }
  }, [currentChart]);

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
        fitView
        minZoom={0.1}
        maxZoom={2}
        panOnDrag={!isResizing}
        selectionOnDrag={true}
        nodesConnectable={false}
      >
        <Background 
          gap={[DAY_WIDTH, DAY_WIDTH]}
          size={1}
          color="#d1d5db"
        />
        <Controls />
        <MiniMap />
      </ReactFlow>
      <Sidebar
        selectedTask={selectedTask}
        milestones={currentChart.milestones}
        onClose={() => setSelectedTask(null)}
        onUpdateTask={handleUpdateTask}
        dependencyViolations={dependencyViolations}
      />
      {hasUnsavedChanges && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded shadow-md">
          <button onClick={saveChanges}>Save Changes</button>
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