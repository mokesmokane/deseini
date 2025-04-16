import React, { useState, useMemo, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Background,
  Controls,
  MiniMap,
  ReactFlowInstance,
  applyNodeChanges,
  NodeChange,
} from 'reactflow';
import "react-datepicker/dist/react-datepicker.css";
import 'reactflow/dist/style.css';
import TaskNode from './TaskNode';
import MilestoneNode from './MilestoneNode';
import TimelineNode from './TimelineNode';
import GenerateNode from './GenerateNode';
import { useDraftPlanMermaidContext, Task, Section, Timeline } from '../../contexts/DraftPlanContextMermaid';
import ErrorBoundary from '../ErrorBoundary';

// Helper to ensure we're working with Date objects
const ensureDate = (date: Date | string | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
};

// Helper function to calculate x position based on date
const getXPositionFromDate = (date: Date | string | undefined, startDate: Date | string, pixelsPerDay: number = 30) => {
  if (!date) return 0;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  
  // Calculate days between dates
  const daysDiff = Math.floor((dateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  // Convert days to pixels
  return daysDiff * pixelsPerDay;
};

// Helper function to calculate width between two dates
const getWidthBetweenDates = (startDate: Date | string, endDate: Date | string, pixelsPerDay: number = 30) => {
  const startDateObj = ensureDate(startDate);
  const endDateObj = ensureDate(endDate);
  
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * pixelsPerDay;
};

// Helper function to get task date for positioning
const getTaskDate = (task: Task): Date => {
  if (task.type === 'milestone' && task.date) {
    return ensureDate(task.date);
  }
  return task.startDate ? ensureDate(task.startDate) : new Date(); 
};

const nodeTypes = {
  task: TaskNode,
  milestone: MilestoneNode,
  timeline: TimelineNode,
  generate: GenerateNode,
};

// Create a custom error fallback component
function ErrorFallback({ error, errorInfo, errorData }: { error: Error, errorInfo: React.ErrorInfo, errorData: any }) {
  return (
    <div style={{
      padding: '20px',
      border: '2px solid red',
      borderRadius: '8px',
      backgroundColor: '#fff',
      color: '#333',
      margin: '20px',
      overflowY: 'auto',
      maxHeight: '80vh'
    }}>
      <h2 style={{ color: 'red', marginBottom: '10px' }}>Something went wrong in the DraftPlanMermaid component</h2>
      <details style={{ whiteSpace: 'pre-wrap', marginBottom: '15px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
        <p style={{ margin: '10px 0', fontFamily: 'monospace' }}>{error.toString()}</p>
        <p style={{ margin: '10px 0', fontFamily: 'monospace' }}>Component Stack: {errorInfo.componentStack}</p>
      </details>
      {errorData && (
        <details style={{ whiteSpace: 'pre-wrap' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Data</summary>
          <pre style={{ margin: '10px 0', fontFamily: 'monospace' }}>{JSON.stringify(errorData, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

function DraftPlanMermaid() {
  const { sections, timeline } = useDraftPlanMermaidContext();
  const [visibleTasks, setVisibleTasks] = useState<string[]>([]);
  const [tasksWithDates, setTasksWithDates] = useState<string[]>([]);
  const [tasksWithDurations, setTasksWithDurations] = useState<string[]>([]);
  const [visibleSectionBars, setVisibleSectionBars] = useState<string[]>([]);
  const [sectionBarsWithWidths, setSectionBarsWithWidths] = useState<string[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const [timelineWidth, setTimelineWidth] = useState(200);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [prevSections, setPrevSections] = useState<Section[]>([]);
  const [prevTimeline, setPrevTimeline] = useState<Timeline | undefined>();
  const [prevSectionStartDates, setPrevSectionStartDates] = useState<Record<string, Date>>({});
  const [prevSectionEndDates, setPrevSectionEndDates] = useState<Record<string, Date>>({});
  const [changedNodeIds, setChangedNodeIds] = useState<string[]>([]);
  
  // Handler for node changes (position, etc.)
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setFlowNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  const nodes: Node[] = useMemo(() => {
    // Create the generate chart node regardless of whether there are sections or not
    const generateNode: Node = {
      id: 'generate_chart',
      type: 'generate',
      data: { 
        label: 'Chart Generator',
        isVisible: true,
      },
      position: { x: 50, y: 50 }, // Position it in a visible area when there's no content
      style: { 
        zIndex: 10,
      },
      draggable: true, // Make only this node draggable
    };
    
    // If there are no sections, just return the generate node
    if (sections.length === 0) {
      return [generateNode];
    }

    const timelineNode: Node | null = timeline ? {
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
    } : null;

    const allNodes: Node[] = timelineNode ? [timelineNode, generateNode] : [generateNode];
    let yPosition = 70; // Starting Y position after the timeline

    // Process each section and its tasks
    sections.forEach(section => {
      // Calculate section width based on all its tasks
      let sectionStartDate: Date | undefined;
      let sectionEndDate: Date | undefined;
      
      // Find earliest start and latest end dates in this section
      section.tasks.forEach(task => {
        const taskDate = getTaskDate(task);
          
        const taskEndDate = task.type === 'milestone' 
          ? taskDate 
          : task.endDate 
            ? ensureDate(task.endDate) 
            : (task.duration && task.startDate)
              ? new Date(ensureDate(task.startDate).getTime() + task.duration * 24 * 60 * 60 * 1000)
              : taskDate;
            
        if (taskDate && (!sectionStartDate || taskDate < sectionStartDate)) {
          sectionStartDate = new Date(taskDate);
        }
        
        if (taskEndDate && (!sectionEndDate || taskEndDate > sectionEndDate)) {
          sectionEndDate = new Date(taskEndDate);
        }
      });
      
      // Default to timeline dates if section has no items
      if (!sectionStartDate || !sectionEndDate) {
        // If section has no tasks or no tasks with dates, use the timeline dates with a default width
        if (timeline) {
          sectionStartDate = new Date(timeline.startDate);
          sectionEndDate = new Date(timeline.endDate);
          
          // If timeline dates are invalid, use a default width
          if (sectionStartDate >= sectionEndDate) {
            sectionStartDate = new Date();
            sectionEndDate = new Date(sectionStartDate);
            sectionEndDate.setDate(sectionEndDate.getDate() + 30); // Default 30-day width
          }
        } else {
          // No timeline available, use default dates
          sectionStartDate = new Date();
          sectionEndDate = new Date(sectionStartDate);
          sectionEndDate.setDate(sectionEndDate.getDate() + 30); // Default 30-day width
        }
      } else if (sectionStartDate > sectionEndDate) {
        // Invalid date range, use timeline if available or default
        if (timeline) {
          sectionStartDate = new Date(timeline.startDate);
          sectionEndDate = new Date(timeline.endDate);
        } else {
          sectionStartDate = new Date();
          sectionEndDate = new Date(sectionStartDate);
          sectionEndDate.setDate(sectionEndDate.getDate() + 30); // Default 30-day width
        }
      }
      
      // Add section bar node
      const sectionWidth = getWidthBetweenDates(sectionStartDate, sectionEndDate);
      const defaultStartDate = timeline?.startDate ? new Date(timeline.startDate) : new Date();
      const sectionXPosition = getXPositionFromDate(sectionStartDate, defaultStartDate) + 10;
      
      const sectionBarId = `section_bar_${section.name}`;
      const isSectionVisible = visibleSectionBars.includes(sectionBarId);
      const hasSectionWidth = sectionBarsWithWidths.includes(sectionBarId);
      
      const sectionBarNode: Node = {
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
      allNodes.push(sectionBarNode);
      
      // Add space after section bar before the first task
      yPosition += 70; // Increased spacing after section bar
      
      // Process all tasks in this section chronologically
      // Sort tasks by date for proper ordering
      const sortedTasks = [...section.tasks].sort((a, b) => {
        const dateA = getTaskDate(a);
        const dateB = getTaskDate(b);
        return dateA.getTime() - dateB.getTime();
      });
      
      sortedTasks.forEach(task => {
        const isVisible = visibleTasks.includes(task.id);
        const hasDate = tasksWithDates.includes(task.id);
        const hasDuration = tasksWithDurations.includes(task.id) && task.type !== 'milestone';
        const taskDate = getTaskDate(task);
        
        // Calculate position for this item
        const taskXPosition = hasDate
          ? getXPositionFromDate(taskDate, timeline?.startDate ? new Date(timeline.startDate) : new Date()) + 10
          : 10;
        
        if (task.type === 'milestone') {
          // Create milestone node
          const milestoneNode: Node = {
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
          allNodes.push(milestoneNode);
        } else {
          // Calculate width for a regular task
          const taskWidth = task.duration && hasDuration
            ? task.duration * 30  // 30 pixels per day
            : 60;  // Default width
            
          // Create regular task node
          const taskNode: Node = {
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
              transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 2,
            },
            draggable: false, // Prevent dragging of task nodes
          };
          allNodes.push(taskNode);
        }
        
        yPosition += 70; // Space for next task
      });
      
      yPosition += 5; // Extra space between sections
    });

    // Position the generate chart node at the bottom
    const generateNodeIndex = allNodes.findIndex(node => node.id === 'generate_chart');
    if (generateNodeIndex !== -1) {
      allNodes[generateNodeIndex].position.y = yPosition;
    }

    return allNodes;
  }, [
    timelineWidth,
    timelineVisible,
    visibleTasks,
    tasksWithDates,
    tasksWithDurations,
    visibleSectionBars,
    sectionBarsWithWidths,
    sections,
    timeline
  ]);

  // Effect to update flowNodes when computed nodes change
  useEffect(() => {
    setFlowNodes(nodes);
  }, [nodes]);

  // Effect to identify which nodes have changed
  useEffect(() => {
    // Helper function to get all task IDs from sections
    const getTaskIdsFromSections = (secs: Section[]) => {
      return secs.flatMap(section => section.tasks.map(task => task.id));
    };
    
    // Helper function to get all section bar IDs from sections
    const getSectionBarIds = (secs: Section[]) => {
      return secs.map(section => `section_bar_${section.name}`);
    };
    
    // Helper function to compare two tasks
    const haveTasksChanged = (oldTask?: Task, newTask?: Task) => {
      if (!oldTask || !newTask) return true;
      
      return (
        oldTask.label !== newTask.label ||
        oldTask.type !== newTask.type ||
        oldTask.duration !== newTask.duration ||
        !datesEqual(oldTask.startDate, newTask.startDate) ||
        !datesEqual(oldTask.endDate, newTask.endDate) ||
        !datesEqual(oldTask.date, newTask.date) ||
        JSON.stringify(oldTask.dependencies) !== JSON.stringify(newTask.dependencies)
      );
    };
    
    // Helper function to compare dates
    const datesEqual = (date1?: Date | string, date2?: Date | string) => {
      if (!date1 && !date2) return true;
      if (!date1 || !date2) return false;
      
      const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
      const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
      
      return d1.getTime() === d2.getTime();
    };
    
    // If this is initial render, animate everything once
    if (prevSections.length === 0 && sections.length > 0) {
      const allTaskIds = getTaskIdsFromSections(sections);
      const allSectionBarIds = getSectionBarIds(sections);
      setChangedNodeIds([...allTaskIds, ...allSectionBarIds, 'timeline']);
      
      // Initialize section dates tracking
      const newSectionStartDates: Record<string, Date> = {};
      const newSectionEndDates: Record<string, Date> = {};
      
      sections.forEach(section => {
        // Find earliest start and latest end dates in this section
        let sectionStartDate: Date | undefined;
        let sectionEndDate: Date | undefined;
        
        section.tasks.forEach(task => {
          const taskDate = getTaskDate(task);
          
          const taskEndDate = task.type === 'milestone' 
            ? taskDate 
            : task.endDate 
              ? ensureDate(task.endDate) 
              : (task.duration && task.startDate)
                ? new Date(ensureDate(task.startDate).getTime() + task.duration * 24 * 60 * 60 * 1000)
                : taskDate;
                
          if (taskDate && (!sectionStartDate || taskDate < sectionStartDate)) {
            sectionStartDate = new Date(taskDate);
          }
          
          if (taskEndDate && (!sectionEndDate || taskEndDate > sectionEndDate)) {
            sectionEndDate = new Date(taskEndDate);
          }
        });
        
        // Default to timeline dates if section has no items
        if (!sectionStartDate || !sectionEndDate) {
          if (timeline) {
            sectionStartDate = new Date(timeline.startDate);
            sectionEndDate = new Date(timeline.endDate);
          } else {
            sectionStartDate = new Date();
            sectionEndDate = new Date(sectionStartDate);
            sectionEndDate.setDate(sectionEndDate.getDate() + 30);
          }
        }
        
        newSectionStartDates[section.name] = sectionStartDate;
        newSectionEndDates[section.name] = sectionEndDate;
      });
      
      setPrevSectionStartDates(newSectionStartDates);
      setPrevSectionEndDates(newSectionEndDates);
      setPrevSections(sections);
      setPrevTimeline(timeline);
      return;
    }
    
    // If there are no sections, don't animate anything
    if (sections.length === 0) {
      setChangedNodeIds([]);
      setPrevSections([]);
      setPrevTimeline(undefined);
      setPrevSectionStartDates({});
      setPrevSectionEndDates({});
      return;
    }
    
    // Check if timeline has changed
    const timelineChanged = !prevTimeline || !timeline || 
      !datesEqual(prevTimeline.startDate, timeline.startDate) ||
      !datesEqual(prevTimeline.endDate, timeline.endDate);
    
    // Create maps for old and new tasks by ID for easier comparison
    const oldTasksById: Record<string, Task> = {};
    const newTasksById: Record<string, Task> = {};
    const oldTaskIds = new Set<string>();
    const newTaskIds = new Set<string>();
    const oldSectionNames = new Set<string>();
    const newSectionNames = new Set<string>();
    
    // Track new section start/end dates for comparison
    const newSectionStartDates: Record<string, Date> = {};
    const newSectionEndDates: Record<string, Date> = {};
    
    // Build maps for old tasks
    prevSections.forEach(section => {
      oldSectionNames.add(section.name);
      section.tasks.forEach(task => {
        oldTasksById[task.id] = task;
        oldTaskIds.add(task.id);
      });
    });
    
    // Calculate and track new section start/end dates
    sections.forEach(section => {
      newSectionNames.add(section.name);
      
      // Find earliest start and latest end dates in this section
      let sectionStartDate: Date | undefined;
      let sectionEndDate: Date | undefined;
      
      section.tasks.forEach(task => {
        const taskDate = getTaskDate(task);
        
        const taskEndDate = task.type === 'milestone' 
          ? taskDate 
          : task.endDate 
            ? ensureDate(task.endDate) 
            : (task.duration && task.startDate)
              ? new Date(ensureDate(task.startDate).getTime() + task.duration * 24 * 60 * 60 * 1000)
              : taskDate;
              
        if (taskDate && (!sectionStartDate || taskDate < sectionStartDate)) {
          sectionStartDate = new Date(taskDate);
        }
        
        if (taskEndDate && (!sectionEndDate || taskEndDate > sectionEndDate)) {
          sectionEndDate = new Date(taskEndDate);
        }
        
        // Also collect tasks for task change detection
        newTasksById[task.id] = task;
        newTaskIds.add(task.id);
      });
      
      // Default to timeline dates if section has no items
      if (!sectionStartDate || !sectionEndDate) {
        if (timeline) {
          sectionStartDate = new Date(timeline.startDate);
          sectionEndDate = new Date(timeline.endDate);
        } else {
          sectionStartDate = new Date();
          sectionEndDate = new Date(sectionStartDate);
          sectionEndDate.setDate(sectionEndDate.getDate() + 30);
        }
      }
      
      newSectionStartDates[section.name] = sectionStartDate;
      newSectionEndDates[section.name] = sectionEndDate;
    });
    
    // Find changed tasks (modified, added, or removed)
    const changedIds: string[] = [];
    
    // Check for new and modified tasks
    newTaskIds.forEach(id => {
      // If task is new or has been modified
      if (!oldTaskIds.has(id) || haveTasksChanged(oldTasksById[id], newTasksById[id])) {
        changedIds.push(id);
      }
    });
    
    // Check for changed section bars
    const changedSectionBarIds: string[] = [];
    
    // New sections
    newSectionNames.forEach(sectionName => {
      if (!oldSectionNames.has(sectionName)) {
        changedSectionBarIds.push(`section_bar_${sectionName}`);
      } else {
        // Check if dates have changed for existing sections
        const prevStart = prevSectionStartDates[sectionName];
        const prevEnd = prevSectionEndDates[sectionName];
        const newStart = newSectionStartDates[sectionName];
        const newEnd = newSectionEndDates[sectionName];
        
        if (
          !prevStart || !prevEnd || !newStart || !newEnd ||
          prevStart.getTime() !== newStart.getTime() ||
          prevEnd.getTime() !== newEnd.getTime()
        ) {
          changedSectionBarIds.push(`section_bar_${sectionName}`);
        }
      }
    });
    
    // If timeline changed, add timeline node id
    if (timelineChanged) {
      changedIds.push('timeline');
    }
    
    // Update state with changed node IDs - only if there are actual changes
    if (changedIds.length > 0 || changedSectionBarIds.length > 0) {
      setChangedNodeIds([...changedIds, ...changedSectionBarIds]);
    } else {
      setChangedNodeIds([]);
    }
    
    // Always update previous sections and timeline for next comparison
    setPrevSections(sections);
    setPrevTimeline(timeline);
    setPrevSectionStartDates(newSectionStartDates);
    setPrevSectionEndDates(newSectionEndDates);
  }, [sections, timeline]);

  // Animation sequence - now only animate changed nodes
  useEffect(() => {
    // If no nodes have changed, don't animate anything
    if (changedNodeIds.length === 0) return;
    
    // Keep track of which tasks should remain visible
    const currentVisibleTasks = new Set(visibleTasks);
    const currentTasksWithDates = new Set(tasksWithDates);
    const currentTasksWithDurations = new Set(tasksWithDurations);
    const currentVisibleSectionBars = new Set(visibleSectionBars);
    const currentSectionBarsWithWidths = new Set(sectionBarsWithWidths);
    
    // Extract section bar IDs from changed nodes
    const changedSectionBarIds = changedNodeIds.filter(id => id.startsWith('section_bar_'));
    const changedTaskIds = changedNodeIds.filter(id => !id.startsWith('section_bar_') && id !== 'timeline');
    
    // Remove changed task nodes from visible collections
    changedTaskIds.forEach(id => {
      currentVisibleTasks.delete(id);
      currentTasksWithDates.delete(id);
      currentTasksWithDurations.delete(id);
    });
    
    // Remove changed section bars from visible collections
    changedSectionBarIds.forEach(id => {
      currentVisibleSectionBars.delete(id);
      currentSectionBarsWithWidths.delete(id);
    });
    
    // Apply the filtered visible states
    setVisibleTasks([...currentVisibleTasks]);
    setTasksWithDates([...currentTasksWithDates]);
    setTasksWithDurations([...currentTasksWithDurations]);
    setVisibleSectionBars([...currentVisibleSectionBars]);
    setSectionBarsWithWidths([...currentSectionBarsWithWidths]);
    
    // Only hide timeline if it's one of the changed nodes
    if (changedNodeIds.includes('timeline')) {
      setTimelineVisible(false);
      setTimelineWidth(200);
    }

    if (sections.length === 0) return;

    // Timeline animation if needed
    if (changedNodeIds.includes('timeline')) {
      setTimeout(() => {
        setTimelineVisible(true);
      }, 300);

      setTimeout(() => {
        if (timeline) {
          setTimelineWidth(getWidthBetweenDates(timeline.startDate, timeline.endDate));
        } else {
          setTimelineWidth(900);
        }
      }, 600);
    }

    // Start task animations for changed nodes after a delay
    setTimeout(() => {
      // Get all current task IDs
      const allTaskIds = sections.flatMap(section => 
        section.tasks.map(task => task.id)
      );
      
      // Get all current section bar IDs
      const allSectionBarIds = sections.map(section => `section_bar_${section.name}`);
      
      // Filter to only include task IDs that exist in the current sections
      const tasksToAnimate = changedTaskIds.filter(id => allTaskIds.includes(id));
      
      // Filter to only include section bar IDs that exist in the current sections
      const sectionBarsToAnimate = changedSectionBarIds.filter(id => allSectionBarIds.includes(id));
      
      // Add changed tasks to visible tasks (using functional updates to avoid stale state)
      setVisibleTasks(prev => {
        const newSet = new Set([...prev]);
        tasksToAnimate.forEach(id => newSet.add(id));
        return [...newSet];
      });
      
      setTasksWithDates(prev => {
        const newSet = new Set([...prev]);
        tasksToAnimate.forEach(id => newSet.add(id));
        return [...newSet];
      });
      
      // Add changed section bars to visible bars
      setVisibleSectionBars(prev => {
        const newSet = new Set([...prev]);
        sectionBarsToAnimate.forEach(id => newSet.add(id));
        return [...newSet];
      });
      
      // Add durations only to regular tasks that have changed
      const changedRegularTaskIds = sections.flatMap(section => 
        section.tasks
          .filter(task => changedNodeIds.includes(task.id) && task.type !== 'milestone')
          .map(task => task.id)
      );
      
      setTimeout(() => {
        // Animate task durations
        setTasksWithDurations(prev => {
          const newSet = new Set([...prev]);
          changedRegularTaskIds.forEach(id => newSet.add(id));
          return [...newSet];
        });
        
        // Animate section bar widths
        setSectionBarsWithWidths(prev => {
          const newSet = new Set([...prev]);
          sectionBarsToAnimate.forEach(id => newSet.add(id));
          return [...newSet];
        });
      }, 450);
      
      // Clear changed nodes after animation completes
      setTimeout(() => {
        setChangedNodeIds([]);
      }, 1000);
    }, changedNodeIds.includes('timeline') ? 900 : 300);
  }, [changedNodeIds, sections, timeline]);

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
    }
  }, [reactFlowInstance, timelineVisible]);

  useEffect(() => {
    if (sections && sections.length > 0) {
      console.log("Sections available:", sections.length);
      const milestoneCount = sections.reduce((count, section) => 
        count + section.tasks.filter(task => task.type === 'milestone').length, 0);
      console.log("Total milestones:", milestoneCount);
      
      // Log milestone info for debugging
      sections.forEach(section => {
        const milestones = section.tasks.filter(task => task.type === 'milestone');
        if (milestones.length > 0) {
          console.log(`Section ${section.name} has ${milestones.length} milestones:`, 
            milestones.map(m => `${m.id}: ${m.label} (${m.date || m.startDate})`));
        }
      });
    }
  }, [sections]);

  return (
      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={flowNodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          fitView={false}
          attributionPosition="bottom-left"
          nodesDraggable={true}
          elementsSelectable={true}
          selectNodesOnDrag={false}
          panOnDrag={true}
          onNodeDragStop={(_, node) => {
            console.log('Node drag complete:', node);
            // This triggers after drag is completed - could be used to save position if needed
          }}
          onNodesChange={onNodesChange}
        >
          <Background />
          {/* <Controls />
          <MiniMap /> */}
        </ReactFlow>
      </div>
  );
}

export default DraftPlanMermaid;
