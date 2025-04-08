import React, { useState, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Background,
  Controls,
  MiniMap,
  ReactFlowInstance,
} from 'reactflow';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import 'reactflow/dist/style.css';
import TaskNode from './TaskNode';
import MilestoneNode from './MilestoneNode';
import TimelineNode from './TimelineNode';
import { useDraftPlanContext } from '../../contexts/DraftPlanContext';
import ErrorBoundary from '../ErrorBoundary';
import { useMessages } from '../../contexts/MessagesContext';
import { getDbService, DbServiceType } from '../../services/dbServiceProvider';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

const nodeTypes = {
  task: TaskNode,
  milestone: MilestoneNode,
  timeline: TimelineNode,
};

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

// Dialog component for displaying JSON
const JsonDialog = ({ isOpen, onClose, data }: { isOpen: boolean; onClose: () => void; data: any }) => {
  const { messages } = useMessages();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const dbService = getDbService(DbServiceType.SUPABASE);

  if (!isOpen) return null;

  const handleGenerateFinalPlan = async () => {
    try {
      setIsGenerating(true);
      setProgress('Generating final project plan...');

      // Get project context
      const projectResponse = await fetch('/api/get-project-context', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project context');
      }
      
      const projectContext = await projectResponse.json();
      
      // Convert tasks to markdown format
      const draftPlanMarkdown = data.tasks.map((task: any) => {
        if (task.type === 'milestone') {
          return `## 🏁 ${task.label} - ${new Date(task.date || task.startDate).toLocaleDateString()}`;
        } else {
          const startDate = new Date(task.startDate).toLocaleDateString();
          const durationText = task.duration ? ` (${task.duration} days)` : '';
          return `- ${task.label} - ${startDate}${durationText}`;
        }
      }).join('\n');
      
      setProgress('Calling API to generate final plan...');
      // Call the API to generate the final plan
      const response = await fetch('/api/generate-final-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectContext,
          messages,
          draftPlanMarkdown,
          tasks: data.tasks
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate final plan');
      }
      
      const finalPlan = await response.json();
      
      setProgress('Saving final plan to database...');
      // Save the final plan to Supabase
            // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      finalPlan.user_id = userId;
      const saveResult = await dbService.saveChart(finalPlan);
      
      if (!saveResult) {
        throw new Error('Failed to save final plan to database');
      }
      
      toast.success('Final project plan generated and saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error generating final plan:', error);
      toast.error(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '90%',
        maxHeight: '90%',
        overflow: 'auto',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        position: 'relative',
      }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
        <h2 style={{ marginTop: 0, fontFamily: 'Comic Sans MS' }}>Draft Plan JSON</h2>
        <pre style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '4px',
          overflowX: 'auto',
          fontSize: '14px',
          lineHeight: 1.5,
        }}>
          {JSON.stringify(data, null, 2)}
        </pre>
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
          {isGenerating ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              color: '#3b82f6' 
            }}>
              <div className="spinner" style={{
                width: '20px',
                height: '20px',
                border: '3px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '50%',
                borderTop: '3px solid #3b82f6',
                animation: 'spin 1s linear infinite',
              }}></div>
              <span>{progress}</span>
            </div>
          ) : (
            <button 
              onClick={handleGenerateFinalPlan}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px 15px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Generate Final Plan
            </button>
          )}
        </div>
      </div>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

const FloatingActionButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        border: 'none',
        cursor: 'pointer',
        fontSize: '24px',
        zIndex: 999,
      }}
      title="View Draft Plan JSON"
    >
      {/* Code icon */}
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"></polyline>
        <polyline points="8 6 2 12 8 18"></polyline>
      </svg>
    </button>
  );
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
  const { tasks, timeline, updateTask, updateTimeline } = useDraftPlanContext();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [visibleTasks, setVisibleTasks] = useState<string[]>([]);
  const [tasksWithDates, setTasksWithDates] = useState<string[]>([]);
  const [tasksWithDurations, setTasksWithDurations] = useState<string[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(200);
  
  // State for the JSON dialog
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);

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
      // Animate tasks appearing one by one
      tasks.forEach((task, index) => {
        setTimeout(() => {
          setVisibleTasks(prev => [...prev, task.id]);
        }, index * ANIMATION_DELAY);

        // Animate dates appearing
        setTimeout(() => {
          setTasksWithDates(prev => [...prev, task.id]);
        }, (tasks.length + index) * ANIMATION_DELAY);

        // Animate durations appearing (only for tasks, not milestones)
        if (task.type === 'task') {
          setTimeout(() => {
            setTasksWithDurations(prev => [...prev, task.id]);
          }, (2 * tasks.length + index) * ANIMATION_DELAY);
        }
      });
    }, ANIMATION_DELAY * 3);
  }, [tasks, timeline]);

  // Set initial zoom level
  useEffect(() => {
    if (reactFlowInstance) {
      reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 0.25 });
    }
  }, [reactFlowInstance]);

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
      position: { x: 0, y: 0 },
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
      const positionDate = task.type === 'milestone' && task.date ? task.date : task.startDate;

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
          x: hasDate ? getXPositionFromDate(positionDate, timeline.startDate) : 0,
          y: (index + 1) * ROW_HEIGHT
        },
        style: { 
          opacity: isVisible ? 1 : 0,
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
      };
    });

    return [timelineNode, ...taskNodes];
  }, [tasks, timeline, visibleTasks, tasksWithDates, tasksWithDurations, timelineVisible, timelineWidth]);

  const selectedTask = tasks.find(task => task.id === selectedNodeId);

  const updateNodeDateAndDuration = (startDate: Date | null, duration: number) => {
    if (!selectedNodeId || !startDate) return;
    
    updateTask(selectedNodeId, {
      startDate,
      duration,
    });
  };

  // Prepare the JSON data for display
  const jsonData = useMemo(() => {
    return {
      timeline,
      tasks: tasks.map(task => ({
        ...task,
        // Convert dates to strings for better readability in JSON
        startDate: task.startDate && task.startDate instanceof Date ? task.startDate.toISOString() : undefined,
        date: task.date && task.date instanceof Date ? task.date.toISOString() : undefined
      }))
    };
  }, [tasks, timeline]);

  return (
    <ErrorBoundary fallback={ErrorFallback} errorData={jsonData}>
      <div style={{ width: '100vw', height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={[]}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onInit={setReactFlowInstance}
            defaultViewport={{ x: 0, y: 0, zoom: 0.25 }}
            minZoom={0.1}
            maxZoom={1}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
          
          {/* Add the FAB */}
          <FloatingActionButton onClick={() => setIsJsonDialogOpen(true)} />
          
          {/* Add the JSON dialog */}
          <JsonDialog
            isOpen={isJsonDialogOpen}
            onClose={() => setIsJsonDialogOpen(false)}
            data={jsonData}
          />
        </div>
        
        <div style={{
          width: '250px',
          padding: '20px',
          background: '#f8f8f8',
          borderLeft: '1px solid #ddd',
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontFamily: 'Comic Sans MS' }}>Timeline Controls</h3>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontFamily: 'Comic Sans MS' }}>
                Timeline Start
              </label>
              <DatePicker
                selected={timeline.startDate}
                onChange={(date) => date && updateTimeline({ startDate: date })}
                dateFormat="MM/dd/yyyy"
                className="date-picker"
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontFamily: 'Comic Sans MS' }}>
                Timeline End
              </label>
              <DatePicker
                selected={timeline.endDate}
                onChange={(date) => date && updateTimeline({ endDate: date })}
                dateFormat="MM/dd/yyyy"
                className="date-picker"
              />
            </div>
          </div>

          <h3 style={{ margin: '0 0 15px 0', fontFamily: 'Comic Sans MS' }}>Task Controls</h3>
          {selectedTask?.type === 'task' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontFamily: 'Comic Sans MS' }}>
                  Start Date
                </label>
                <DatePicker
                  selected={selectedTask.startDate}
                  onChange={(date) => updateNodeDateAndDuration(date, selectedTask.duration || 30)}
                  dateFormat="MM/dd/yyyy"
                  className="date-picker"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontFamily: 'Comic Sans MS' }}>
                  Duration (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={selectedTask.duration}
                  onChange={(e) => {
                    const newDuration = parseInt(e.target.value) || 1;
                    updateNodeDateAndDuration(selectedTask.startDate, newDuration);
                  }}
                  className="date-picker"
                />
              </div>
            </div>
          ) : (
            <p style={{ color: '#666', fontFamily: 'Comic Sans MS' }}>Select a task to modify its dates</p>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default DraftPlan;