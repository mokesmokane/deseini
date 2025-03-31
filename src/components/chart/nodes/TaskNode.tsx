import React, { useState, useCallback, useRef } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { NodeResizeControl, Handle, Position, useEdges } from 'reactflow';
import { Task, Milestone } from '../../../types';
import { DAY_WIDTH, MILESTONE_SIZE, TASK_MILESTONE_SIZE } from '../constants/gantt';

// Custom CSS to remove the blue outline
import './taskNode.css';

export interface TaskNodeProps {
    data: {
    name: string;
    description?: string;
    avatar?: string;
    type?: undefined | 'task' | 'event';
    start: string;
    end: string;
    color?: string;
    relevantMilestones?: string[];
    milestones: Milestone[];
    width: number;
    onResizeRight: (id: string, width: number, endDate: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onClick: (task: Task) => void;
    },
    id: string;
    selected?: boolean;
}

export const TaskNode = ({ data, id, selected }: TaskNodeProps) => {
  const { name, description, avatar, start, end, color, relevantMilestones, milestones, width, onResizeRight, onUpdateTask, onClick, type = undefined } = data;
  const [resizing, setResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const prevRightDaysRef = useRef<number | null>(null);
  const edges = useEdges();

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!resizing) {
      e.stopPropagation();
      onClick({
        id,
        name,
        description,
        avatar,
        start,
        end,
        color,
        relevantMilestones,
        type,
      });
    }
  }, [id, name, description, avatar, start, end, color, relevantMilestones, resizing, type]);

  const handleResizeRight = useCallback((_: any, params: { width: number, direction: number[], x: number }) => {
    setResizing(true);
    const newWidth = Math.max(DAY_WIDTH, params.width);
    
    const days = Math.round(newWidth / DAY_WIDTH);
    
    const roundedWidth = days * DAY_WIDTH;
    // Right resize: Adjust end date while start date remains fixed
    const startDate = parseISO(start);
    
    const newEndDate = addDays(startDate, days - 1);
    
    // Only call onResizeRight if days has changed
    if (prevRightDaysRef.current === null || prevRightDaysRef.current !== days) {
      console.log('=== RIGHT RESIZE EVENT DETAILS ===');
      console.log('New width:', newWidth);
      console.log('New end date:', format(newEndDate, 'yyyy-MM-dd'));
      console.log('=== END ===');
      onResizeRight(id, roundedWidth, format(newEndDate, 'yyyy-MM-dd'));
      prevRightDaysRef.current = days;
    }
    
    setTimeout(() => {
      setResizing(false);
    }, 100);
  }, [id]);

  const handleResizeEnd = useCallback((event: any, params: any)  => {
    const newWidth = Math.max(DAY_WIDTH, params.width);
    
    const days = Math.round(newWidth / DAY_WIDTH);
    
    const startDate = parseISO(start);
    
    const newEndDate = addDays(startDate, days - 1);
    onUpdateTask(id, {
      end: format(newEndDate, 'yyyy-MM-dd')
    });
  }, [id]);

  const hasInputEdge = useCallback(() => {
    return edges.some(edge => edge.target === id);
  }, [edges, id]);
  
  const hasOutputEdge = useCallback(() => {
    return edges.some(edge => edge.source === id);
  }, [edges, id]);

  const milestoneDots = relevantMilestones?.map((milestoneId) => {
    const milestone = milestones.find((m) => m.id === milestoneId);
    if (!milestone) return null;

    const milestoneDate = parseISO(milestone.start);
    const taskStartDate = parseISO(start);
    const taskEndDate = parseISO(end);

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

  // Common handlers and elements for both task and event nodes
  
  // Input handle for incoming dependencies
  const inputHandle = (
    <Handle
      type="target"
      position={Position.Left}
      id="target"
      className={`w-2 h-2 rounded-full bg-blue-500 ${type === 'event' ? 'left-0 top-1/2 -translate-y-1/2' : ''}`}
      isConnectable={true}
      style={{ 
        opacity: type === 'event' ? 1 : (isHovered || hasInputEdge() ? 0.8 : 0),
        width: type === 'event' ? '8px' : '10px', 
        height: type === 'event' ? '8px' : '10px',
        left: type === 'event' ? '-4px' : '-6px',  
        top: '50%', 
        transform: 'translateY(-50%)',
        transition: 'opacity 0.2s ease'
      }}
    />
  );
  
  // Output handle for outgoing dependencies
  const outputHandle = (
    <Handle
      type="source"
      position={Position.Right}
      id="source"
      className={`w-2 h-2 rounded-full bg-blue-500 ${type === 'event' ? 'right-0 top-1/2 -translate-y-1/2' : ''}`}
      isConnectable={true}
      style={{ 
        opacity: type === 'event' ? 1 : (isHovered || hasOutputEdge() ? 0.8 : 0),
        width: type === 'event' ? '8px' : '10px', 
        height: type === 'event' ? '8px' : '10px',
        right: type === 'event' ? '-4px' : '-6px', 
        top: '50%', 
        transform: 'translateY(-50%)',
        transition: 'opacity 0.2s ease'
      }}
    />
  );

  // Render differently based on node type
  if (type === 'event') {
    return (
      <div 
        ref={nodeRef}
        className="relative"
        style={{ 
          width: `${MILESTONE_SIZE}px`, 
          height: `${MILESTONE_SIZE}px`,
          zIndex: resizing ? 1000 : 10 
        }}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Diamond shape styled exactly like milestone but with blue color */}
        <div 
          className="absolute left-1/2 top-1/2 bg-blue-500 -translate-x-1/2 -translate-y-1/2 rotate-45"
          style={{ 
            width: `${MILESTONE_SIZE}px`,
            height: `${MILESTONE_SIZE}px`,
            backgroundColor: color || '#3b82f6', // Blue color as default for events
            borderRadius: `${MILESTONE_SIZE * 0.15}px`,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            border: selected ? '2px solid #000' : '1px solid rgba(0, 0, 0, 0.1)'
          }}
        />
        
        {/* Name tooltip to the right like milestone */}
        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 whitespace-nowrap text-sm">
          {name}
          {description && isHovered && (
            <div className="text-xs text-gray-500 mt-1">
              {description}
            </div>
          )}
        </div>

        {/* Input handle on the left (for incoming connections) */}
        <Handle
          type="target"
          position={Position.Left}
          id="target"
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full z-20"
          isConnectable={true}
        />
        
        {/* Output handle on the right (for outgoing connections) */}
        <Handle
          type="source"
          position={Position.Right}
          id="source"
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full z-20"
          isConnectable={true}
        />
      </div>
    );
  }

  // Regular task node rendering
  const nodeStyle = {
    width: `${width}px`,
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
      {inputHandle}
      {outputHandle}
      
      <NodeResizeControl
        nodeId={id}
        position="right"
        minWidth={DAY_WIDTH}
        onResize={handleResizeRight}
        onResizeEnd={handleResizeEnd}
        style={{
          top: '10px' 
        }}
      />
      <div
        className="w-1.5 h-full flex-shrink-0 rounded-l-md"
        style={{ backgroundColor: color || '#6366f1' }}
      />

      <div className="flex-grow px-3 py-2 min-w-0">
        <div className="font-medium text-sm truncate text-gray-900">{name}</div>
        {description && (
          <div className="text-xs text-gray-500 truncate">
            {description}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-3 border-l border-gray-100">
        {avatar && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100">
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        )}
      </div>

      {milestoneDots}
    </div>
  );
};
