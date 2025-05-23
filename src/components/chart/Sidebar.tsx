import React, { useEffect, useCallback, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Task, Milestone } from '../../types';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useGantt } from '../../contexts/GanttContext';
import { useDependencyViolations } from '../../contexts/DependencyViolationsContext';
import { getDependencyKey } from '../../types';

interface SidebarProps {
  selectedTask: Task | null;
  milestones: Milestone[];
  onClose: () => void;
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
  onUpdateChart?: (updates: { dependencies: { sourceId: string; targetId: string }[] }) => void;
  onDeleteTask?: (task: Task) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedTask, 
  milestones, 
  onClose, 
  onUpdateTask,
  onUpdateChart,
  onDeleteTask
}) => {
  const { currentChart } = useGantt();
  const { dependencyViolations } = useDependencyViolations();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  
  // Effect to log selected task updates
  useEffect(() => {
    if (selectedTask) {
      // Selected task changes
      // Reset edit state when task changes
      setIsEditing(false);
      setEditedName(selectedTask.name);
      setEditedDescription(selectedTask.description || '');
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
  
  // Handle save edited task name and description
  const handleSaveEdit = () => {
    if (!selectedTask || !onUpdateTask) return;
    
    onUpdateTask(selectedTask.id, {
      name: editedName,
      description: editedDescription
    });
    
    setIsEditing(false);
  };
  
  // Handle cancel edit
  const handleCancelEdit = () => {
    if (!selectedTask) return;
    
    setEditedName(selectedTask.name);
    setEditedDescription(selectedTask.description || '');
    setIsEditing(false);
  };

  // IMPORTANT: Early return must come AFTER all hook definitions
  if (!selectedTask) return null;

  // These are not hooks, so they can safely be after the conditional return
  const relevantMilestones = selectedTask.relevantMilestones
    ?.map(id => milestones.find(m => m.id === id))
    .filter((m): m is Milestone => m !== undefined);

  const handleDateChange = (date: Date | null, field: 'start' | 'end') => {
    if (!date || !onUpdateTask || !selectedTask || !isEditing) return;
    onUpdateTask(selectedTask.id, {
      [field]: format(date, 'yyyy-MM-dd')
    });
  };

  // Find task violations related to the selected task
  const taskViolations = Object.entries(dependencyViolations)
    .filter(([_depKey, violation]) => {
      // Check if this violation involves the selected task (either as source or target)
      const violationObj = violation as { sourceTaskId: string; targetTaskId: string; message: string };
      return violationObj.sourceTaskId === selectedTask.id || violationObj.targetTaskId === selectedTask.id;
    })
    .map(([depKey, violation]) => {
      const violationObj = violation as { sourceTaskId: string; targetTaskId: string; message: string };
      return {
        dependencyId: depKey,
        message: violationObj.message
      };
    });

  // Get all existing dependencies for this task from the chart's dependencies
  const existingDependencies = currentChart?.dependencies?.filter(dep => 
    dep.targetId === selectedTask.id
  ) || [];


  const handleRemoveDependency = (sourceId: string, targetId: string) => {
    if (!selectedTask || !currentChart?.dependencies) return;
    // Find the dependency to remove
    // The dependencyId passed in is the ID of the other task, not the dependency key

    const dependencyToRemove = currentChart.dependencies.find(dep => 
      (dep.targetId === targetId && dep.sourceId === sourceId)
    );
    
    if (!dependencyToRemove) return;
    // Filter out the dependency from the chart's dependencies array
    const updatedDependencies = currentChart.dependencies.filter(dep => 
      !(dep.targetId === dependencyToRemove.targetId && dep.sourceId === dependencyToRemove.sourceId)
    );
    // Update the chart's dependencies array
    if (onUpdateChart) {
      onUpdateChart({ dependencies: updatedDependencies });
    } else {
    }
  };

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg border-l border-gray-200 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-blue-500 hover:text-blue-700"
              title="Edit task"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-4 space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">Task Name</h3>
          {isEditing ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="mt-1 text-base text-gray-900 font-medium">{selectedTask.name}</p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500">Description</h3>
          {isEditing ? (
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            selectedTask.description ? (
              <p className="mt-1 text-base text-gray-900">{selectedTask.description}</p>
            ) : (
              <p className="mt-1 text-base text-gray-400 italic">No description</p>
            )
          )}
        </div>


        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Start Date</h3>
            {isEditing ? (
              <DatePicker
                selected={selectedTask.start ? parseISO(selectedTask.start) : null}
                onChange={(date) => handleDateChange(date, 'start')}
                dateFormat="MMM d, yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {selectedTask.start ? format(parseISO(selectedTask.start), 'MMM d, yyyy') : 'No start date'}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">End Date</h3>
            {isEditing ? (
              <DatePicker
                selected={selectedTask.end ? parseISO(selectedTask.end) : null}
                onChange={(date) => handleDateChange(date, 'end')}
                dateFormat="MMM d, yyyy"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {selectedTask.end ? format(parseISO(selectedTask.end), 'MMM d, yyyy') : 'No end date'}
              </div>
            )}
          </div>
        </div>

        {/* Edit action buttons */}
        {isEditing && (
          <div className="flex space-x-2">
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-3 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
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
            {/* Debug: Display dependencies related to this task */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mb-2">
                Debug - Dependencies: {JSON.stringify(existingDependencies)}
              </div>
            )}
            
            {existingDependencies.length > 0 ? (
              existingDependencies.map(dependency => {
                const depKey = getDependencyKey(dependency.sourceId, dependency.targetId);
                const hasViolation = taskViolations.some(v => v.dependencyId === depKey);
                
                return (
                  <div 
                    key={depKey} 
                    className={`flex items-center justify-between p-2 rounded-md ${hasViolation ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200'}`}
                  >
                    <div className="flex items-center">
                      {hasViolation && <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>}
                      <div>
                        <p className="text-sm font-medium">{getTaskNameById(dependency.sourceId)}</p>
                        {hasViolation && (
                          <p className="text-xs text-red-500">
                            {taskViolations.find(v => v.dependencyId === depKey)?.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDependency(dependency.sourceId, dependency.targetId)}
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

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Delete Task Button */}
        {onDeleteTask && (
          <div>
            <button
              onClick={() => {
                //close sidebar
                onClose();
                //delete task
                onDeleteTask?.(selectedTask);
              }}
              className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Task
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};