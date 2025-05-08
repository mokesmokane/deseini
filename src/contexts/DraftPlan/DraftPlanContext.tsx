import React, { createContext, useContext, useState } from 'react';
import { fetchApi } from '@/utils/api';
import { Task, Timeline } from './types';

interface DraftPlanContextType {
  tasks: Task[];
  timeline: Timeline;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  updateTimeline: (updates: Partial<Timeline>) => void;
  createPlanFromMarkdown: (markdownPlan: string) => Promise<void>;
  isLoading: boolean;
}

const DraftPlanContext = createContext<DraftPlanContextType | undefined>(undefined);

const initialTasks: Task[] = [
];

const initialTimeline: Timeline = {
  startDate: new Date('2024-01-15'),
  endDate: new Date('2024-04-15'),
};

export const DraftPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [timeline, setTimeline] = useState<Timeline>(initialTimeline);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(currentTasks =>
      currentTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates }
          : task
      )
    );
  };

  const updateTimeline = (updates: Partial<Timeline>) => {
    setTimeline(current => ({ ...current, ...updates }));
  };

  // Function to create plan from markdown by calling the API
  const createPlanFromMarkdown = async (markdownPlan: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await fetchApi('/api/convert-plan-to-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ markdownPlan })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert plan');
      }
      
      const planData = await response.json();
      console.log('[Plan data]', planData);
      
      // Process the tasks to convert date strings into Date objects and flatten the hierarchy
      if (planData.tasks && Array.isArray(planData.tasks)) {
        // Create a flattened array of tasks
        const flattenedTasks: Task[] = [];
        
        // Process each task and its subtasks
        planData.tasks.forEach((task: any) => {
          // Process the main task
          const processedTask: Task = {
            id: task.id,
            type: task.type || 'task',
            label: task.label,
            startDate: task.startDate ? new Date(task.startDate) : new Date(),
            duration: task.duration
          };
          
          // Add the main task to our array
          flattenedTasks.push(processedTask);
          
          // Process subtasks if they exist
          if (task.subtasks && Array.isArray(task.subtasks) && task.subtasks.length > 0) {
            // Process and add each subtask
            task.subtasks.forEach((subtask: any) => {
              const processedSubtask: Task = {
                id: subtask.id,
                type: subtask.type || 'task',
                label: subtask.label,
                startDate: subtask.startDate ? new Date(subtask.startDate) : new Date(),
                duration: subtask.duration
              };
              flattenedTasks.push(processedSubtask);
            });
          }
        });
        
        setTasks(flattenedTasks);
      }
      
      // Process the timeline to convert date strings into Date objects
      if (planData.timeline) {
        const processedTimeline = {
          ...planData.timeline,
          startDate: planData.timeline.startDate ? new Date(planData.timeline.startDate) : new Date(),
          endDate: planData.timeline.endDate ? new Date(planData.timeline.endDate) : new Date()
        };
        setTimeline(processedTimeline);
      }
    } catch (error) {
      console.error('Error creating plan from markdown:', error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DraftPlanContext.Provider value={{ 
      tasks, 
      timeline, 
      updateTask, 
      updateTimeline,
      createPlanFromMarkdown,
      isLoading
    }}>
      {children}
    </DraftPlanContext.Provider>
  );
};

export const useDraftPlanContext = () => {
  const context = useContext(DraftPlanContext);
  if (context === undefined) {
    throw new Error('useDraftPlanContext must be used within a DraftPlanProvider');
  }
  return context;
};