import React, { useState, useCallback, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Task, Milestone } from '../../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useGantt } from '../../context/GanttContext';
import { useDependencyViolations } from '../../contexts/DependencyViolationsContext';

interface SidebarProps {
  selectedTask: Task | null;
  milestones: Milestone[];
  onClose: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedTask, 
  milestones, 
  onClose, 
  onUpdateTask
}) => {
  const { currentChart } = useGantt();
  const { dependencyViolations } = useDependencyViolations();
  const [showDependencySelector, setShowDependencySelector] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Effect to log selected task updates
  useEffect(() => {
    if (selectedTask) {
      // Selected task changes
    }
  }, [selectedTask]);

  // Find all potential dependency tasks
  const findAllTasks = useCallback((tasks: Task[], exclude: string): Task[] => {
    let allTasks: Task[] = [];
    
    tasks.forEach(task => {
      // Don't include the current task as a dependency option
      if (task.id !== exclude) {
        allTasks.push(task);
      }
      
      // Include nested tasks
      if (task.tasks && task.tasks.length > 0) {
        allTasks = [...allTasks, ...findAllTasks(task.tasks, exclude)];
      }
    });
    
    return allTasks;
  }, []);
  
  // Find the task name by ID for displaying dependencies
  const getTaskNameById = useCallback((taskId: string): string => {
    if (!currentChart) return taskId;
    
    const findTaskName = (tasks: Task[]): string | null => {
      for (const task of tasks) {
        if (task.id === taskId) {
          return task.name;
        }
        
        if (task.tasks && task.tasks.length > 0) {
          const foundName = findTaskName(task.tasks);
          if (foundName) return foundName;
        }
      }
      
      return null;
    };
    
    return findTaskName(currentChart.tasks) || taskId;
  }, [currentChart]);
  
  // IMPORTANT: Early return must come AFTER all hook definitions
  if (!selectedTask) return null;

  // These are not hooks, so they can safely be after the conditional return
  const relevantMilestones = selectedTask.relevantMilestones
    ?.map(id => milestones.find(m => m.id === id))
    .filter((m): m is Milestone => m !== undefined);

  const handleDateChange = (date: Date | null, field: 'start' | 'end') => {
    if (!date || !onUpdateTask || !selectedTask) return;
    onUpdateTask(selectedTask.id, {
      [field]: format(date, 'yyyy-MM-dd')
    });
  };

  const handleAddDependency = (dependencyId: string) => {
    if (!onUpdateTask || !selectedTask) return;
    
    // Create a new set of dependencies (eliminates duplicates)
    const currentDependencies = selectedTask.dependsOn || [];
    const updatedDependencies = [...new Set([...currentDependencies, dependencyId])];
    
    onUpdateTask(selectedTask.id, {
      dependsOn: updatedDependencies
    });
    
    // Hide the selector after adding
    setShowDependencySelector(false);
    setSearchTerm('');
  };

  const handleRemoveDependency = (dependencyId: string) => {
    if (!onUpdateTask || !selectedTask || !selectedTask.dependsOn) return;
    
    const updatedDependencies = selectedTask.dependsOn.filter(id => id !== dependencyId);
    
    onUpdateTask(selectedTask.id, {
      dependsOn: updatedDependencies
    });
  };

  // Find task violations related to the selected task
  const taskViolations = Object.entries(dependencyViolations)
    .filter(([dependencyId]) => {
      return selectedTask.dependsOn?.includes(dependencyId);
    })
    .map(([dependencyId, message]) => ({
      dependencyId,
      message
    }));
  
  // Get all tasks except the current one
  const availableTasks = currentChart 
    ? findAllTasks(currentChart.tasks, selectedTask.id)
      .filter(task => !selectedTask.dependsOn?.includes(task.id)) // Filter out already selected dependencies
      .filter(task => task.name.toLowerCase().includes(searchTerm.toLowerCase())) // Filter by search term
    : [];

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">Task Name</h3>
          <p className="mt-1 text-base text-gray-900 font-medium">{selectedTask.name}</p>
        </div>

        {selectedTask.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="mt-1 text-base text-gray-900">{selectedTask.description}</p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
            <DatePicker
              selected={selectedTask.start ? parseISO(selectedTask.start) : null}
              onChange={(date) => handleDateChange(date, 'start')}
              dateFormat="MMM d, yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
            <DatePicker
              selected={selectedTask.end ? parseISO(selectedTask.end) : null}
              onChange={(date) => handleDateChange(date, 'end')}
              dateFormat="MMM d, yyyy"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Dependencies - Moved up before Milestones to give it more prominence */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Dependencies
          </h3>
          
          {/* List of current dependencies */}
          <div className="space-y-2 mt-2">
            {/* Debug: Display raw dependency IDs if they exist */}
            {process.env.NODE_ENV === 'development' && selectedTask.dependsOn && (
              <div className="text-xs text-gray-500 mb-2">
                Debug - Raw dependsOn: {JSON.stringify(selectedTask.dependsOn)}
              </div>
            )}
            
            {Array.isArray(selectedTask.dependsOn) && selectedTask.dependsOn.length > 0 ? (
              selectedTask.dependsOn.map(dependencyId => {
                const hasViolation = taskViolations.some(v => v.dependencyId === dependencyId);
                
                return (
                  <div 
                    key={dependencyId} 
                    className={`flex items-center justify-between p-2 rounded-md ${hasViolation ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${hasViolation ? 'bg-red-500' : 'bg-blue-500'} rounded-full mr-2`}></div>
                      <div>
                        <p className="text-sm font-medium">{getTaskNameById(dependencyId)}</p>
                        {hasViolation && (
                          <p className="text-xs text-red-500">
                            {taskViolations.find(v => v.dependencyId === dependencyId)?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDependency(dependencyId)}
                      className="text-gray-400 hover:text-red-500"
                      title="Remove dependency"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="p-3 bg-gray-50 border border-gray-200 text-sm text-gray-500 rounded-md">
                No dependencies. Add one below or connect tasks by dragging from one task to another in the chart.
              </div>
            )}
          </div>
          
          {/* Add dependency button */}
          <button
            onClick={() => setShowDependencySelector(prev => !prev)}
            className="mt-3 flex items-center text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 py-1 px-3 rounded-md border border-blue-200"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showDependencySelector ? 'Cancel' : 'Add Dependency'}
          </button>
          
          {/* Dependency selector */}
          {showDependencySelector && (
            <div className="mt-2 p-3 border border-gray-200 bg-white rounded-md shadow-sm">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm mb-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <div className="max-h-48 overflow-y-auto">
                {availableTasks.length > 0 ? (
                  availableTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => handleAddDependency(task.id)}
                      className="w-full text-left p-2 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm">{task.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 p-2">No available tasks found</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Milestones */}
        {relevantMilestones && relevantMilestones.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
              Related Milestones
            </h3>
            <div className="space-y-2 mt-2">
              {relevantMilestones.map(milestone => (
                <div key={milestone.id} className="flex items-center p-2 bg-gray-50 rounded-md border border-gray-200">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <div>
                    <p className="text-sm font-medium">{milestone.name}</p>
                    <p className="text-xs text-gray-500">
                      {milestone.start ? format(parseISO(milestone.start), 'MMM d, yyyy') : 'No date'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};