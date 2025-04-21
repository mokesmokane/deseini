import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useDraftPlanMermaidContext, Task, Section, Timeline } from '../contexts/DraftPlanContextMermaid'
import { Node, Edge, MarkerType, useNodesState, NodeDragHandler } from 'reactflow';
import { ensureDate, getXPositionFromDate, getWidthBetweenDates, getTaskDate, getDateFromXPosition } from '../hooks/utils';

// Helper to ensure we'
export function useDraftPlanFlow() {
  const {
    sections, 
    timeline,
    x0Date, 
    TIMELINE_PIXELS_PER_DAY
  } = useDraftPlanMermaidContext()

  const [timelineVisible, setTimelineVisible] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [visibleTasks, setVisibleTasks] = useState<string[]>([]);
  const [tasksWithDates, setTasksWithDates] = useState<string[]>([]);
  const [tasksWithDurations, setTasksWithDurations] = useState<string[]>([]);
  const [storedGenerateNode, setGenerateNode] = useState<Node | null>(null);
  const [visibleSectionBars, setVisibleSectionBars] = useState<string[]>([]);
  const [changedNodeIds, setChangedNodeIds] = useState<string[]>([]);
  const [prevSections, setPrevSections] = useState<Section[]>([]);
  const [prevTimeline, setPrevTimeline] = useState<Timeline | undefined>();
  const [prevSectionStartDates, setPrevSectionStartDates] = useState<Record<string, Date>>({});
  const [prevSectionEndDates, setPrevSectionEndDates] = useState<Record<string, Date>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

    const anchorDate = useMemo(() => {
        if (x0Date) return ensureDate(x0Date);
        if (timeline) return ensureDate(timeline.startDate);
        return new Date();
    }, [x0Date, timeline]);


    const timelineRange = useMemo(() => {
    // Find earliest start and latest end among ALL tasks (not just visible sections)
    let minDate: Date | undefined = undefined;
    let maxDate: Date | undefined = undefined;
    sections.forEach(section => {
        section.tasks.forEach(task => {
        const sd = ensureDate(task.startDate);
        const ed = task.type === 'milestone'
            ? sd
            : task.endDate
            ? ensureDate(task.endDate)
            : (task.duration
                ? new Date(sd.getTime() + task.duration * 24 * 60 * 60 * 1000)
                : sd);
        if (!minDate || sd < minDate) minDate = sd;
        if (!maxDate || ed > maxDate) maxDate = ed;
        });
    });
    return {
        startDate: minDate || (timeline ? new Date(timeline.startDate) : new Date()),
        endDate: maxDate || (timeline ? new Date(timeline.endDate) : new Date()),
    };
    },
     [sections, timeline]);


  // Dynamically compute timeline width based on date range
  const timelineDynamicWidth = useMemo(() => {
    const start = timelineRange.startDate;
    const end = timelineRange.endDate;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays * TIMELINE_PIXELS_PER_DAY, 60); // minimum width for 1 day
  }, [timelineRange, TIMELINE_PIXELS_PER_DAY]);
  // Fixed origin for X=0 and compute timeline X position when start date changes

  const TIMELINE_BASE_X = 10;
  const timelineX = TIMELINE_BASE_X + getXPositionFromDate(timelineRange.startDate, anchorDate, TIMELINE_PIXELS_PER_DAY);


  const nodesMemo = useMemo(() => {
      // Create the generate chart node regardless of whether there are sections or not
      console.log('Generating nodesMemo', TIMELINE_PIXELS_PER_DAY);
      const generateNode: Node = storedGenerateNode || {
        id: 'generate_chart',
        type: 'generate',
        data: { 
          label: 'Chart Generator',
          isVisible: true,
        },
        position: { x: 50, y: -250 }, // Position it in a visible area when there's no content
        style: { 
          zIndex: 10,
        },
        draggable: true, // Make only this node draggable
      };
      
      // If there are no sections, just return the generate node
      if (sections.length === 0) {
        // console.log('No sections found');
        return [generateNode];
      }
  
      const timelineNode: Node | null = timeline ? {
        id: 'timeline',
        type: 'timeline',
        data: {
          label: 'Timeline',
          startDate: timelineRange.startDate,
          endDate: timelineRange.endDate,
          width: timelineDynamicWidth,
          isVisible: timelineVisible,
        },
        position: { x: timelineX, y: 10 },  // Position timeline with dynamic X based on start date
        style: {
          opacity: timelineVisible ? 1 : 0,
          transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        },
        draggable: false, // Prevent dragging
      } : null;
  
      const allNodes: Node[] = timelineNode ? [timelineNode, generateNode] : [generateNode];
      let yPosition = 70; // Starting Y position after the timeline
  
      // Process each section and its tasks
      sections.forEach(section => {// Find earliest start and latest end dates in this section
        const startDates = section.tasks
          .map(task => task.startDate)
          .filter(Boolean)
          .map(date => new Date(date!));
  
        const endDates = section.tasks
          .map(task => {
            if (task.type === 'milestone') {
              return task.startDate;
            }
            return task.endDate;
          })
          .filter(Boolean)
          .map(date => new Date(date!));
  
        let sectionStartDate = startDates.length > 0 ? startDates.reduce((a, b) => a < b ? a : b) : undefined;
        let sectionEndDate = endDates.length > 0 ? endDates.reduce((a, b) => a > b ? a : b) : undefined;
        
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
        const sectionWidth = sectionStartDate && sectionEndDate ? getWidthBetweenDates(sectionStartDate, sectionEndDate, TIMELINE_PIXELS_PER_DAY) : 0;
        const defaultStartDate = anchorDate;
        const sectionXPosition = getXPositionFromDate(sectionStartDate, defaultStartDate, TIMELINE_PIXELS_PER_DAY) + 10;
        
        const sectionBarId = `section_bar_${section.name}`;
        
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
            // Dynamic resize: visible bars adapt to task span
            width: `${sectionWidth}px`,
            height: '60px', // Match task height exactly
            borderRadius: '8px', // Match task border radius
            background: '#000000',
            border: '2px solid #ffffff', // Match task border thickness
            opacity: 1, // Always visible
            transition: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '10px 20px', // Match task padding
            fontSize: '16px', // Match task font size
            fontWeight: 'bold',
            color: '#ffffff',
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
        // const sortedTasks = [...section.tasks].sort((a, b) => {
        //   const dateA = getTaskDate(a);
        //   const dateB = getTaskDate(b);
        //   return dateA.getTime() - dateB.getTime();
        // });
        
        section.tasks.forEach(task => {
          const isVisible = visibleTasks.includes(task.id);
          const hasDate = tasksWithDates.includes(task.id);
          const hasDuration = tasksWithDurations.includes(task.id) && task.type !== 'milestone';
          const taskDate = getTaskDate(task);
          
          // Calculate position for this item
          const taskXPosition = hasDate
            ? getXPositionFromDate(taskDate, anchorDate, TIMELINE_PIXELS_PER_DAY) + 10
            : 10;
          
          if (task.type === 'milestone') {
            // Create milestone node
            const milestoneNode: Node = {
              id: task.id,
              type: 'milestone',
              data: {
                id: task.id,
                label: task.label,
                startDate: taskDate,
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
                transition: draggingNodeId === task.id ? 'none' : 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 10, // Ensure milestones are on top
              },
              draggable: true, // Allow dragging of milestone nodes
            };
            allNodes.push(milestoneNode);
          } else {
            // Calculate width for a regular task
            const taskWidth = task.duration && hasDuration
              ? task.duration * TIMELINE_PIXELS_PER_DAY  // 30 pixels per day
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
                transition: draggingNodeId === task.id ? 'none' : 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 2,
              },
              draggable: true, // Allow tasks to be dragged
            };
            allNodes.push(taskNode);
          }
          
          yPosition += 70; // Space for next task
        });
        
        yPosition += 5; // Extra space between sections
      });
  
  
      return allNodes;
    }, [
      visibleTasks,
      tasksWithDates,
      tasksWithDurations,
      visibleSectionBars,
      draggingNodeId,
      sections,
      timeline,
      TIMELINE_PIXELS_PER_DAY,
      anchorDate
    ]);
    
    useEffect(() => {
      setNodes(nodesMemo);
    }, [nodesMemo]);

    // Generate edges from task dependencies
    const edgesMemo = useMemo(() => {
      const newEdges: Edge[] = [];
      sections.forEach(section => {
        section.tasks.forEach(task => {
          if (task.dependencies && task.dependencies.length > 0) {
            task.dependencies.forEach(depId => {
              console.log('Adding edge', depId, task.id);
              newEdges.push({
                id: `edge-${depId}-${task.id}`,
                source: depId,
                target: task.id,
                animated: true,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
              });
            });
          }
        });
      });
      return newEdges;
    }, [sections]);

    // Update edges state whenever dependencies change
    useEffect(() => {
      setEdges(edgesMemo);
    }, [edgesMemo]);

  // Animation sequence - now only animate changed nodes
  useEffect(() => {
    // If no nodes have changed, don't animate anything
    if (changedNodeIds.length === 0) return;
    
    // Keep track of which tasks should remain visible
    const currentVisibleTasks = new Set(visibleTasks);
    const currentTasksWithDates = new Set(tasksWithDates);
    const currentTasksWithDurations = new Set(tasksWithDurations);
    const currentVisibleSectionBars = new Set(visibleSectionBars);
    
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
    });
    
    // Apply the filtered visible states
    setVisibleTasks([...currentVisibleTasks]);
    setTasksWithDates([...currentTasksWithDates]);
    setTasksWithDurations([...currentTasksWithDurations]);
    setVisibleSectionBars([...currentVisibleSectionBars]);
    
    // Only hide timeline if it's one of the changed nodes
    if (changedNodeIds.includes('timeline')) {
      setTimelineVisible(false);
      // setTimelineWidth(200);
    }

    if (sections.length === 0) return;

    // Timeline animation if needed
    if (changedNodeIds.includes('timeline')) {
      setTimeout(() => {
        setTimelineVisible(true);
      }, 300);

      setTimeout(() => {
        if (timeline) {
          // setTimelineWidth(getWidthBetweenDates(timeline.startDate, timeline.endDate));
        } else {
          // setTimelineWidth(900);
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
        setVisibleSectionBars(prev => {
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
  }, [changedNodeIds, sections, timeline, TIMELINE_PIXELS_PER_DAY]);

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
      
      // Compare only structural properties, ignore date changes to prevent drag-induced animations
      return (
        oldTask.label !== newTask.label ||
        oldTask.type !== newTask.type ||
        oldTask.duration !== newTask.duration ||
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
        const startDates = section.tasks
          .map(task => task.startDate)
          .filter(Boolean)
          .map(date => new Date(date!));

          const endDates = section.tasks
            .map(task => {
              if (task.type === 'milestone') {
                return task.startDate;
              }
              return task.endDate;
            })
            .filter(Boolean)
            .map(date => new Date(date!));

        let sectionStartDate = startDates.length > 0 ? startDates.reduce((a, b) => a < b ? a : b) : undefined;
        let sectionEndDate = endDates.length > 0 ? endDates.reduce((a, b) => a > b ? a : b) : undefined;

        
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
      newSectionNames.add(section.name);// Find earliest start and latest end dates in this section
      const startDates = section.tasks
        .map(task => task.startDate)
        .filter(Boolean)
        .map(date => new Date(date!));

        const endDates = section.tasks
          .map(task => {
            if (task.type === 'milestone') {
              return task.startDate;
            }
            return task.endDate;
          })
          .filter(Boolean)
          .map(date => new Date(date!));

      let sectionStartDate = startDates.length > 0 ? startDates.reduce((a, b) => a < b ? a : b) : undefined;
      let sectionEndDate = endDates.length > 0 ? endDates.reduce((a, b) => a > b ? a : b) : undefined;
      section.tasks.forEach(task => {
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
    
    // Update state only when tasks were added or removed, skip date-only changes
    if (changedIds.length > 0) {
      setChangedNodeIds([...changedIds, ...changedSectionBarIds]);
    } else {
      setChangedNodeIds([]);
    }
    
    // Always update previous sections and timeline for next comparison
    setPrevSections(sections);
    setPrevTimeline(timeline);
    setPrevSectionStartDates(newSectionStartDates);
    setPrevSectionEndDates(newSectionEndDates);
  }, [sections, timeline, TIMELINE_PIXELS_PER_DAY]);

  return { nodes, edges, onNodesChange, setNodes, storedGenerateNode, setGenerateNode, draggingNodeId, setDraggingNodeId, changedNodeIds, setChangedNodeIds, prevSections, prevTimeline, prevSectionStartDates, prevSectionEndDates, setPrevSections, setPrevTimeline, setPrevSectionStartDates, setPrevSectionEndDates, anchorDate, TIMELINE_PIXELS_PER_DAY, setTimelineVisible, timelineVisible }
}