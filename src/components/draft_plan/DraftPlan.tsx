import React, { useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Background,
  MiniMap,
  ReactFlowInstance,
} from 'reactflow';
import "react-datepicker/dist/react-datepicker.css";
import 'reactflow/dist/style.css';
import TaskNode from './TaskNode';
import MilestoneNode from './MilestoneNode';
import TimelineNode from './TimelineNode';
import { useDraftPlanContext } from '../../contexts/DraftPlan/DraftPlanContext';
import ErrorBoundary from '../ErrorBoundary';

// Helper to ensure we're working with Date objects
const ensureDate = (date: Date | string | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
};

// Helper function to calculate x position based on date
const getXPositionFromDate = (date: Date | string, startDate: Date | string, pixelsPerDay: number = 30) => {
  const dateObj = ensureDate(date);
  const startDateObj = ensureDate(startDate);
  
  const diffTime = dateObj.getTime() - startDateObj.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * pixelsPerDay;
};

// Helper function to calculate width between two dates
const getWidthBetweenDates = (startDate: Date | string, endDate: Date | string, pixelsPerDay: number = 30) => {
  const startDateObj = ensureDate(startDate);
  const endDateObj = ensureDate(endDate);
  
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * pixelsPerDay;
};

const ROW_HEIGHT = 80; // Reduced from 150 to accommodate uniform task height
const ANIMATION_DELAY = 500;

const nodeTypes = {
  task: TaskNode,
  milestone: MilestoneNode,
  timeline: TimelineNode,
};

// Create a custom error fallback component
const ErrorFallback = (error: Error, errorInfo: React.ErrorInfo, errorData: any) => {
  return (
    <div style={{ 
      margin: '20px', 
      padding: '20px', 
      border: '1px solid #f44336',
      borderRadius: '4px',
      backgroundColor: '#ffebee',
      maxHeight: '100vh',
      overflow: 'auto'
    }}>
      <h2>Error in Draft Plan</h2>
      <p>{error.toString()}</p>
      
      <h3>Plan Data:</h3>
      <pre style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '10px', 
        borderRadius: '4px',
        overflow: 'auto',
        maxHeight: '60vh'
      }}>
        {JSON.stringify(errorData, null, 2)}
      </pre>
      
      <details style={{ marginTop: '20px' }}>
        <summary>Component Stack</summary>
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {errorInfo.componentStack}
        </pre>
      </details>
    </div>
  );
};

function DraftPlan() {
  const { tasks, timeline } = useDraftPlanContext();
  // We still need selectedNodeId for the ReactFlow onNodeClick handler
  // even though we're not using the sidebar controls right now
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [visibleTasks, setVisibleTasks] = useState<string[]>([]);
  const [tasksWithDates, setTasksWithDates] = useState<string[]>([]);
  const [tasksWithDurations, setTasksWithDurations] = useState<string[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(200);
  
  // Animation sequence
  useEffect(() => {
    // Reset all states
    setTimelineVisible(false);
    setTimelineWidth(200);
    setVisibleTasks([]);
    setTasksWithDates([]);
    setTasksWithDurations([]);

    // Timeline animation sequence
    setTimeout(() => {
      setTimelineVisible(true);
    }, ANIMATION_DELAY);

    setTimeout(() => {
      setTimelineWidth(getWidthBetweenDates(timeline.startDate, timeline.endDate));
    }, ANIMATION_DELAY * 2);

    // Start task animations after timeline is set
    setTimeout(() => {
      // Animate tasks one at a time, completing each task's full animation before moving to the next
      tasks.forEach((task, index) => {
        // Base delay for this task's animation sequence
        const baseDelay = index * ANIMATION_DELAY * 3;
        
        // Step 1: Task appears
        setTimeout(() => {
          setVisibleTasks(prev => [...prev, task.id]);
        }, baseDelay);

        // Step 2: Task moves to its start date
        setTimeout(() => {
          setTasksWithDates(prev => [...prev, task.id]);
        }, baseDelay + ANIMATION_DELAY);

        // Step 3: Task extends to its duration (only for tasks, not milestones)
        if (task.type === 'task') {
          setTimeout(() => {
            setTasksWithDurations(prev => [...prev, task.id]);
          }, baseDelay + ANIMATION_DELAY * 2);
        }
      });
    }, ANIMATION_DELAY * 3);
  }, [tasks, timeline]);

  useEffect(() => {
    if (reactFlowInstance) {
      // Define consistent insets for the viewport
      const INSET_LEFT = 50;  // Left inset in pixels
      const INSET_TOP = 30;   // Top inset in pixels
      
      // Calculate viewport position to place timeline start at top-left with insets
      reactFlowInstance.setViewport({
        x: INSET_LEFT,
        y: INSET_TOP,
        zoom: 0.7  // Set a fixed initial zoom level that works well for most screens
      });
      
      // Disable the fitView as we're handling positioning manually
      // and it can override our custom positioning
    }
  }, [reactFlowInstance, timelineVisible]);

  const nodes: Node[] = useMemo(() => {
    const timelineNode: Node = {
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
    };

    const taskNodes: Node[] = tasks.map((task, index) => {
      const isVisible = visibleTasks.includes(task.id);
      const hasDate = tasksWithDates.includes(task.id);
      const hasDuration = tasksWithDurations.includes(task.id);

      // Use the appropriate date property based on node type
      const positionDate = task.type === 'milestone' && task.startDate ? task.startDate : task.startDate;

      return {
        id: task.id,
        type: task.type,
        data: {
          ...task,
          isVisible,
          hasDate,
          hasDuration,
        },
        position: { 
          x: hasDate ? getXPositionFromDate(positionDate, timeline.startDate) + 10 : 10,  // Align with timeline x position
          y: (index + 1) * ROW_HEIGHT + 10  // Offset by the same amount as timeline + ROW_HEIGHT
        },
        style: { 
          opacity: isVisible ? 1 : 0,
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          width: '100%',
        },
      };
    });

    return [timelineNode, ...taskNodes];
  }, [tasks, timeline, visibleTasks, tasksWithDates, tasksWithDurations, timelineVisible, timelineWidth]);

  // Prepare the JSON data for display
  const jsonData = useMemo(() => {
    return {
      timeline,
      tasks: tasks.map(task => ({
        ...task,
        // Add selected state to JSON data
        selected: task.id === selectedNodeId,
        // Convert dates to strings for better readability in JSON
        startDate: task.startDate && task.startDate instanceof Date ? task.startDate.toISOString() : undefined
      }))
    };
  }, [tasks, timeline, selectedNodeId]);

  return (
    <ErrorBoundary fallback={ErrorFallback} errorData={jsonData}>
      <div style={{ width: '100%', height: '100%', display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={[]}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onInit={setReactFlowInstance}
            defaultViewport={{ x: 50, y: 30, zoom: 0.7 }}  // Match the insets in the useEffect
            minZoom={0.2}
            maxZoom={2}
            fitView={false}  // Disable fitView to use our custom positioning
            panOnDrag={true}  // Enable panning on drag
            panOnScroll={false}  // Disable panning on scroll to avoid accidental panning
            selectionOnDrag={false}  // Disable selection on drag
            selectNodesOnDrag={false}  // Prevent node selection from interfering with panning
            zoomOnScroll={true}  // Keep zoom on scroll enabled
            nodesDraggable={false}  // Make nodes not draggable to prioritize canvas panning
            elementsSelectable={true}  // Keep elements selectable for interaction
            preventScrolling={true}  // Prevent browser scrolling during interactions
          >
            <Background />
            <MiniMap
              position="bottom-left"
            />
          </ReactFlow>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default DraftPlan;