import React, { useState, useCallback, useRef } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import { NodeResizeControl, Handle, Position, useEdges } from 'reactflow';
import { Menu, Transition } from '@headlessui/react';
import { createPortal } from 'react-dom';
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
    parentColor: string;
    relevantMilestones?: string[];
    milestones: Milestone[];
    width: number;
    onResizeRight: (id: string, width: number, endDate: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
    onClick: (task: Task) => void;
    onAddAboveClone?: (task: Task) => void;
    onAddAboveNewTask?: (task: Task) => void;
    onAddAboveNewEvent?: (task: Task) => void;
    onAddBelowClone?: (task: Task) => void;
    onAddBelowNewTask?: (task: Task) => void;
    onAddBelowNewEvent?: (task: Task) => void;
    onCreateSubTask?: (task: Task) => void;
    onDeleteTask?: (task: Task) => void;
    tasks?: Task[];
    },
    id: string;
    selected?: boolean;
}

// Type for submenu operations to ensure type safety
type SubMenuAction = 'clone' | 'newTask' | 'newEvent';
type MenuPosition = 'above' | 'below';

export const TaskNode = ({ data, id, selected }: TaskNodeProps) => {
  const { 
    name, 
    description, 
    avatar, 
    start, 
    end, 
    parentColor, 
    color,
    relevantMilestones, 
    milestones, 
    width, 
    onResizeRight, 
    onUpdateTask, 
    onClick, 
    onAddAboveClone,
    onAddAboveNewTask,
    onAddAboveNewEvent,
    onAddBelowClone,
    onAddBelowNewTask,
    onAddBelowNewEvent,
    onCreateSubTask,
    onDeleteTask,
    type = undefined 
  } = data;
  
  const [resizing, setResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [submenuPosition, setSubmenuPosition] = useState<MenuPosition | null>(null);
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

  // Create a task object for callback functions
  const getTaskData = useCallback(() => ({
    id,
    name,
    description,
    avatar,
    start,
    end,
    color,
    relevantMilestones,
    type,
  }), [id, name, description, avatar, start, end, color, relevantMilestones, type]);

  const handleMenuItemClick = useCallback((action: string) => (e: React.MouseEvent, close: () => void) => {
    e.stopPropagation();
    const taskData = getTaskData();
    
    // Handle direct actions
    if (action === 'createSubTask') {
      console.log('Menu action: Create Sub Task');
      onCreateSubTask?.(taskData);
      setSubmenuPosition(null);
      close(); // Close the menu using the provided close function
    } else if (action === 'deleteTask') {
      console.log('Menu action: Delete Task');
      onDeleteTask?.(taskData);
      setSubmenuPosition(null);
      close(); // Close the menu using the provided close function
    }
  }, [getTaskData, onCreateSubTask, onDeleteTask]);

  const handleSubmenuAction = useCallback((position: MenuPosition, action: SubMenuAction) => (e: React.MouseEvent, close: () => void) => {
    e.stopPropagation();
    const taskData = getTaskData();
    
    console.log(`Submenu action: ${position} - ${action}`);
    
    // Call the appropriate callback based on position and action
    if (position === 'above') {
      switch (action) {
        case 'clone':
          onAddAboveClone?.(taskData);
          break;
        case 'newTask':
          onAddAboveNewTask?.(taskData);
          break;
        case 'newEvent':
          onAddAboveNewEvent?.(taskData);
          break;
      }
    } else if (position === 'below') {
      switch (action) {
        case 'clone':
          onAddBelowClone?.(taskData);
          break;
        case 'newTask':
          onAddBelowNewTask?.(taskData);
          break;
        case 'newEvent':
          onAddBelowNewEvent?.(taskData);
          break;
      }
    }
    
    // Close both the submenu and the main menu
    setSubmenuPosition(null);
    close(); // Close the menu using the provided close function
  }, [
    getTaskData, 
    onAddAboveClone, 
    onAddAboveNewTask, 
    onAddAboveNewEvent, 
    onAddBelowClone, 
    onAddBelowNewTask, 
    onAddBelowNewEvent
  ]);

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

  // Portal container for menu
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  
  const handleOpenMenu = useCallback((e: React.MouseEvent) => {
    if (e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom,
        left: rect.right
      });
    }
  }, []);

  // Handle showing submenu on hover
  const handleMenuHover = useCallback((position: MenuPosition | null) => {
    setSubmenuPosition(position);
  }, []);

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
            backgroundColor: parentColor || '#3b82f6', // Blue color as default for events
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
  console.log('Parent color:', parentColor);
  console.log('Task color:', color);
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
        style={{ backgroundColor: parentColor!}}
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
        {data.tasks && data.tasks.length > 0 && (
          <div 
            className="flex items-center justify-center rounded-full text-xs font-medium text-white" 
            style={{ 
              backgroundColor: color || '#6366f1',
              width: '20px',
              height: '20px',
              minWidth: '20px'
            }}
            title={`${data.tasks.length} subtask${data.tasks.length > 1 ? 's' : ''}`}
          >
            {data.tasks.length}
          </div>
        )}
        {avatar && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100">
            <img
              src={avatar}
              alt="avatar"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        )}
        
        {/* Menu Button using Headless UI */}
        <Menu as="div" className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
          {({ close }) => (
            <>
              <Menu.Button 
                className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors" 
                aria-label="Open menu"
                onClick={handleOpenMenu}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 text-gray-600"
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </Menu.Button>
              {createPortal(
                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items 
                    className="fixed w-40 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    style={{ 
                      top: `${menuPosition.top}px`,
                      left: `${menuPosition.left - 160}px`,
                      zIndex: 9999 // Very high z-index to ensure it's above everything
                    }}
                  >
                    <div className="py-1">
                      {/* Add Above with submenu */}
                      <div 
                        className="relative" 
                        onMouseEnter={() => handleMenuHover('above')}
                        onMouseLeave={() => handleMenuHover(null)}
                      >
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } group flex w-full items-center justify-between px-4 py-2 text-sm`}
                              aria-label="Add above options"
                            >
                              <span>Add Above</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </Menu.Item>
                        
                        {/* Submenu for Add Above */}
                        {submenuPosition === 'above' && (
                          <div className="absolute left-full top-0 mt-0 ml-0 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="py-1">
                              <button
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                                onClick={(e) => handleSubmenuAction('above', 'clone')(e, close)}
                              >
                                Clone
                              </button>
                              <button
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                                onClick={(e) => handleSubmenuAction('above', 'newTask')(e, close)}
                              >
                                New Task
                              </button>
                              <button
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                                onClick={(e) => handleSubmenuAction('above', 'newEvent')(e, close)}
                              >
                                New Event
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Add Below with submenu */}
                      <div 
                        className="relative" 
                        onMouseEnter={() => handleMenuHover('below')}
                        onMouseLeave={() => handleMenuHover(null)}
                      >
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                              } group flex w-full items-center justify-between px-4 py-2 text-sm`}
                              aria-label="Add below options"
                            >
                              <span>Add Below</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </Menu.Item>
                        
                        {/* Submenu for Add Below */}
                        {submenuPosition === 'below' && (
                          <div className="absolute left-full top-0 mt-0 ml-0 w-36 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="py-1">
                              <button
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                                onClick={(e) => handleSubmenuAction('below', 'clone')(e, close)}
                              >
                                Clone
                              </button>
                              <button
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                                onClick={(e) => handleSubmenuAction('below', 'newTask')(e, close)}
                              >
                                New Task
                              </button>
                              <button
                                className="text-gray-700 hover:bg-gray-100 hover:text-gray-900 group flex w-full items-center px-4 py-2 text-sm"
                                onClick={(e) => handleSubmenuAction('below', 'newEvent')(e, close)}
                              >
                                New Event
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Create Sub Chart (direct action) */}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                            } group flex w-full items-center px-4 py-2 text-sm`}
                            onClick={(e) => handleMenuItemClick('createSubTask')(e, close)}
                            aria-label="Create sub task"
                          >
                            Create Sub Task
                          </button>
                        )}
                      </Menu.Item>
                      
                      {/* Delete Task (direct action) */}
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-red-100 text-red-900' : 'text-red-700'
                            } group flex w-full items-center px-4 py-2 text-sm`}
                            onClick={(e) => handleMenuItemClick('deleteTask')(e, close)}
                            aria-label="Delete task"
                          >
                            Delete Task
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>,
                document.body
              )}
            </>
          )}
        </Menu>
      </div>

      {milestoneDots}
    </div>
  );
};
