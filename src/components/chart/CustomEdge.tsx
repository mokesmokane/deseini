import { useGantt } from '../../contexts/GanttContext';
import { useDependencyViolations } from '../../contexts/DependencyViolationsContext';
import { parseISO, addDays, format, differenceInCalendarDays } from 'date-fns';
import { getSmoothStepPath } from 'reactflow';
import { Position } from 'reactflow';
import { getDependencyKey } from '../../types';



export const CustomEdge = ({
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
  
    // Check if this edge (source->target) has a dependency violation
    let isViolation = false;
    // Check for dependency violations using central dependency model
    if (currentChart?.dependencies && currentChart.dependencies.length > 0 && dependencyViolations) {
      // In React Flow, an edge goes from source to target
      // In our dependency model, the sourceId depends on the targetId
      // Find if this edge corresponds to a dependency in our model
      const hasDependency = currentChart.dependencies.some(
        dep => dep.sourceId === source && dep.targetId === target
      );
  
      if (hasDependency) {
        // Check for violations using target (dependent task) ID
        if (dependencyViolations[getDependencyKey(source, target)]) {
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
          differenceInCalendarDays(taskStartDate, hoveredDate) <= 0 ||
          format(taskStartDate, 'yyyy-MM-dd') === format(hoveredDate, 'yyyy-MM-dd');
      }
    }
  
    // Dependency violation edges should always be visible, regardless of hover state
    const visible = isViolation || isVisibleFromNodeHover || isVisibleFromDayHover;
  
    // Determine styling based on visibility source
    let edgeStyle = { ...style };

    if (visible) {
      console.log('isViolation', isViolation, 'isVisibleFromNodeHover', isVisibleFromNodeHover, 'isVisibleFromDayHover', isVisibleFromDayHover);
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
  