import React, { useState, useRef, useCallback } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { NodeResizeControl, Handle, Position, useEdges } from 'reactflow';
import { Task, Milestone } from '../../../types';
import { DAY_WIDTH, TASK_MILESTONE_SIZE } from '../constants/gantt';

// Custom CSS to remove the blue outline
import './taskNode.css';

export interface TaskNodeProps {
  data: {
    name: string;
    description?: string;
    avatar?: string;
    start: string;
    end: string;
    color?: string;
    relevantMilestones?: string[];
    milestones: Milestone[];
    width: number;
    onResizeRight: (id: string, width: number, endDate: string) => void;
    onResizeLeft: (id: string, width: number, endDate: string, startDate: string) => void;
    isResizing: boolean;
    setIsResizing: (value: boolean) => void;
    onClick: (task: Task) => void;
  };
  id: string;
  selected?: boolean;
}

export const TaskNode = ({ data, id }: TaskNodeProps) => {
  const [resizing, setResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const prevRightDaysRef = useRef<number | null>(null);
  const edges = useEdges();

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!resizing) {
      e.stopPropagation();
      data.onClick({
        id,
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        start: data.start,
        end: data.end,
        color: data.color,
        relevantMilestones: data.relevantMilestones,
      });
    }
  }, [data, id, resizing]);

  const handleResizeRight = useCallback((_: any, params: { width: number, direction: number[], x: number }) => {
    setResizing(true);
    const newWidth = Math.max(DAY_WIDTH, params.width);
    
    const days = Math.round(newWidth / DAY_WIDTH);
    
    const roundedWidth = days * DAY_WIDTH;
    // Right resize: Adjust end date while start date remains fixed
    const startDate = parseISO(data.start);
    
    const newEndDate = addDays(startDate, days - 1);
    
    // Only call onResizeRight if days has changed
    if (prevRightDaysRef.current === null || prevRightDaysRef.current !== days) {
      console.log('=== RIGHT RESIZE EVENT DETAILS ===');
      data.onResizeRight(id, roundedWidth, format(newEndDate, 'yyyy-MM-dd'));
      prevRightDaysRef.current = days;
    }
    
    setTimeout(() => {
      setResizing(false);
    }, 100);
  }, [data, id]);

  const hasInputEdge = useCallback(() => {
    return edges.some(edge => edge.target === id);
  }, [edges, id]);
  
  const hasOutputEdge = useCallback(() => {
    return edges.some(edge => edge.source === id);
  }, [edges, id]);

  const milestoneDots = data.relevantMilestones?.map((milestoneId) => {
    const milestone = data.milestones.find((m) => m.id === milestoneId);
    if (!milestone) return null;

    const milestoneDate = parseISO(milestone.start);
    const taskStartDate = parseISO(data.start);
    const taskEndDate = parseISO(data.end);

    if (milestoneDate < taskStartDate || milestoneDate > taskEndDate) return null;

    const offset = (differenceInCalendarDays(milestoneDate, taskStartDate) * DAY_WIDTH) + (DAY_WIDTH / 2);
    
    return (
      <div
        key={milestone.id}
        className="absolute top-[-6px] bg-red-400 rotate-45 transform -translate-x-1/2"
        style={{ 
          left: offset,
          width: `${TASK_MILESTONE_SIZE}px`,
          height: `${TASK_MILESTONE_SIZE}px`,
          borderRadius: `${TASK_MILESTONE_SIZE * 0.15}px`
        }}
        title={`${milestone.name}: ${milestone.description}`}
      />
    );
  });

  const nodeStyle = {
    width: `${data.width}px`,
    position: 'relative' as const,
    zIndex: resizing ? 1000 : 10,
  };

  return (
    <div 
      ref={nodeRef}
      className="gantt-task-node absolute flex items-center rounded-md shadow-md border border-gray-300 bg-white h-14 hover:shadow-lg transition-shadow group"
      style={nodeStyle}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input handle for incoming dependencies */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-input`}
        style={{ 
          opacity: isHovered || hasInputEdge() ? 0.8 : 0, 
          width: '10px', 
          height: '10px', 
          left: '-6px',
          transition: 'opacity 0.2s ease'
        }}
      />
      
      {/* Output handle for outgoing dependencies */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-output`}
        style={{ 
          opacity: isHovered || hasOutputEdge() ? 0.8 : 0, 
          width: '10px', 
          height: '10px', 
          right: '-6px',
          transition: 'opacity 0.2s ease'
        }}
      />
      
      {/* Custom left-resize handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
        onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
          e.stopPropagation();
          
          // Initial mouse position and task state
          const initialX = e.clientX;
          const initialWidth = data.width;
          const endDate = parseISO(data.end);
          
          // Set resizing state
          setResizing(true);
          data.setIsResizing(true);
          
          // Handle mouse movement during resize
          const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = initialX - moveEvent.clientX;
            const newWidth = Math.max(DAY_WIDTH, initialWidth + deltaX);
            const days = Math.round(newWidth / DAY_WIDTH);
            const roundedWidth = days * DAY_WIDTH;
            
            // Calculate new start date based on end date
            const newStartDate = addDays(endDate, -(days - 1));
            const formattedStartDate = format(newStartDate, 'yyyy-MM-dd');
            
            console.log('Left resize in progress:', {
              deltaX,
              newWidth,
              roundedWidth,
              days,
              newStartDate: formattedStartDate
            });
            
            // Update task dimensions
            data.onResizeLeft(id, roundedWidth, data.end, formattedStartDate);
          };
          
          // Handle mouse up to stop resizing
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            
            setTimeout(() => {
              setResizing(false);
              data.setIsResizing(false);
            }, 100);
          };
          
          // Add event listeners for dragging
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
      
      <NodeResizeControl
        nodeId={id}
        position="right"
        minWidth={DAY_WIDTH}
        onResize={handleResizeRight}
      />
      <div
        className="w-1.5 h-full flex-shrink-0 rounded-l-md"
        style={{ backgroundColor: data.color || '#6366f1' }}
      />

      <div className="flex-grow px-3 py-2 min-w-0">
        <div className="font-medium text-sm truncate text-gray-900">{data.name}</div>
        {data.description && (
          <div className="text-xs text-gray-500 truncate">
            {data.description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 border-l border-gray-100">
        {data.avatar && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100">
            <img
              src={data.avatar}
              alt="avatar"
              className="w-6 h-6 rounded-full"
            />
          </div>
        )}

        <button 
          className="flex flex-col items-center justify-center w-6 h-6 gap-0.5 opacity-60 hover:opacity-100 ml-1 p-1 rounded-full hover:bg-gray-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
        </button>
      </div>

      {milestoneDots}
    </div>
  );
};
