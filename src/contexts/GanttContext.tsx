import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { GanttData, Task } from '../types';
import { useChartsList } from './ChartsListContext';

// Context interface
interface GanttContextType {
  // State
  currentChart: GanttData | null;
  isLoading: boolean;
  error: string | null;
  hoveredNodes: string[];
  hoveredDayIndex: number | null;
  hasUnsavedChanges?: boolean;
  
  // Actions
  loadChartById: (id: string) => void;
  updateTask: (chartId: string, taskId: string, updates: Partial<Task>) => Promise<boolean>;
  setCurrentChart: (chart: GanttData | null) => void;
  setHoveredNodes: React.Dispatch<React.SetStateAction<string[]>>;
  setHoveredDayIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
}

// Create the context
const GanttContext = createContext<GanttContextType | undefined>(undefined);

// Provider props
interface GanttProviderProps {
  children: ReactNode;
  initialData?: GanttData;
}

// Provider component
export const GanttProvider: React.FC<GanttProviderProps> = ({ children, initialData }) => {
  const [currentChart, setCurrentChart] = useState<GanttData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNodes, setHoveredNodes] = useState<string[]>([]);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // Access ChartsListContext
  const { loadChartById: fetchChartById, saveChart } = useChartsList();

  // Initialize with demo data if provided
  useEffect(() => {
    if (initialData) {
      setCurrentChart(initialData);
    }
  }, [initialData]);
  
  // Load a specific chart by ID
  const loadChartById = useCallback(async (id: string) => {
    try {
      setCurrentChart(null);
      setIsLoading(true);
      setError(null);
      
      const chart = await fetchChartById(id);
      
      if (chart) {
        setCurrentChart(chart);
      } else {
        setError(`Chart with ID ${id} not found`);
      }
    } catch (error) {
      setError('Failed to load chart');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchChartById]);

  // Update a specific task within a chart
  const updateTask = useCallback(async (chartId: string, taskId: string, updates: Partial<Task>): Promise<boolean> => {
    // Get the current chart value from state at call time rather than from closure
    const chart = currentChart;
    if (!chart || chart.id !== chartId) {
      try {
        // Properly await the chart loading
        await loadChartById(chartId);
        // After loading, we need to check again if currentChart is available
        // We need to get the fresh value after the async operation
        const freshChart = currentChart;
        if (!freshChart) {
          setError('Chart not found after loading');
          return false;
        }
      } catch (error) {
        setError('Error loading chart for task update');
        return false;
      }
    }
    
    try {
      // Deep clone the current chart to avoid direct state mutation
      // Get the fresh value after possible async operations
      const updatedChart = JSON.parse(JSON.stringify(currentChart)) as GanttData;
      
      // Helper function to recursively find and update task
      const updateTaskRecursive = (tasks: Task[] | undefined): boolean => {
        if (!tasks) return false;
        
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].id === taskId) {
            // Found the task, update it
            tasks[i] = { ...tasks[i], ...updates };
            return true;
          }
          
          // Check nested tasks if any
          if (tasks[i].tasks) {
            const nestedTasks = tasks[i].tasks || [];
            if (updateTaskRecursive(nestedTasks)) {
              return true;
            }
          }
        }
        
        return false;
      };
      
      const taskFound = updateTaskRecursive(updatedChart.tasks);
      
      if (!taskFound) {
        setError(`Task with ID ${taskId} not found`);
        return false;
      }
      
      // Save the updated chart
      setCurrentChart(updatedChart);
      return saveChart(updatedChart);
    } catch (error) {
      setError('Failed to update task');
      console.error(error);
      return false;
    }
  }, [loadChartById, saveChart, setError, setCurrentChart]);

  // Provide the context value
  const contextValue: GanttContextType = {
    // State
    currentChart,
    isLoading,
    error,
    hoveredNodes,
    hoveredDayIndex,
    hasUnsavedChanges,
    
    // Actions
    loadChartById,
    updateTask,
    setCurrentChart,
    setHoveredNodes,
    setHoveredDayIndex,
    setHasUnsavedChanges,
  };

  return (
    <GanttContext.Provider value={contextValue}>
      {children}
    </GanttContext.Provider>
  );
};

// Custom hook for using the Gantt context
export const useGantt = (): GanttContextType => {
  const context = useContext(GanttContext);
  if (!context) {
    throw new Error('useGantt must be used within a GanttProvider');
  }
  return context;
};
