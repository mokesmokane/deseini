import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GanttData, Task } from '../types';
import { getDbService, DbServiceType } from '../services/dbServiceProvider';
import { supabase } from '../lib/supabase';

// Helper function to generate UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Context interface
interface GanttContextType {
  // State
  allCharts: GanttData[];
  currentChart: GanttData | null;
  isLoading: boolean;
  error: string | null;
  hoveredNodes: string[];
  
  // Actions
  loadAllCharts: () => void;
  loadChartById: (id: string) => void;
  loadChart: (id: string) => Promise<GanttData | null>;
  saveChart: (chart: GanttData) => Promise<boolean>;
  createNewChart: (chart: GanttData) => Promise<boolean>;
  deleteChart: (id: string) => Promise<boolean>;
  updateTask: (chartId: string, taskId: string, updates: Partial<Task>) => Promise<boolean>;
  setCurrentChartDirectly: (chart: GanttData) => void;
  setCurrentChart: (chart: GanttData | null) => void;
  importChart: (chartData: any) => Promise<string | null>;
  setHoveredNodes: React.Dispatch<React.SetStateAction<string[]>>;
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
  const [allCharts, setAllCharts] = useState<GanttData[]>([]);
  const [currentChart, setCurrentChart] = useState<GanttData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredNodes, setHoveredNodes] = useState<string[]>([]);
  
  // Get the database service (defaults to mock, unless VITE_USE_SUPABASE env var is set)
  const dbService = getDbService(DbServiceType.SUPABASE);

  // Initialize with demo data if provided
  useEffect(() => {
    if (initialData) {
      dbService.initWithDemoData(initialData);
    }
    
    loadAllCharts();
  }, [initialData]);

  // Load all charts
  const loadAllCharts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const charts = await dbService.getAllCharts();
      setAllCharts(charts);
      
      // Set the first chart as current if no chart is selected
      if (charts.length > 0 && !currentChart) {
        setCurrentChart(charts[0]);
      }
    } catch (error) {
      setError('Failed to load charts');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load a specific chart by ID
  const loadChartById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const chart = await dbService.getChartById(id);
      
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
  };
  
  // Load chart (returns the chart without setting as current)
  const loadChart = async (id: string): Promise<GanttData | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const chart = await dbService.getChartById(id);
      
      if (!chart) {
        setError(`Chart with ID ${id} not found`);
      }
      
      return chart;
    } catch (error) {
      setError('Failed to load chart');
      console.error(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set current chart directly (without loading from DB)
  const setCurrentChartDirectly = (chart: GanttData) => {
    setCurrentChart(chart);
  };
  
  // Save existing chart
  const saveChart = async (chart: GanttData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await dbService.saveChart(chart);
      
      if (success) {
        // Update local state
        setAllCharts(prev => {
          const index = prev.findIndex(c => c.id === chart.id);
          if (index >= 0) {
            return [...prev.slice(0, index), chart, ...prev.slice(index + 1)];
          } else {
            return [...prev, chart];
          }
        });
        setCurrentChart(chart);
      } else {
        setError('Failed to save chart');
      }
      
      return success;
    } catch (error) {
      setError('Failed to save chart');
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create new chart
  const createNewChart = async (chart: GanttData): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const success = await dbService.saveChart(chart);
      
      if (success) {
        // Update local state
        setAllCharts(prev => [...prev, chart]);
        setCurrentChart(chart);
        setError(null);
      } else {
        setError('Failed to create chart');
      }
      
      return success;
    } catch (error) {
      setError('Failed to create chart');
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete chart
  const deleteChart = async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await dbService.deleteChart(id);
      
      if (success) {
        // Update local state
        setAllCharts(prev => prev.filter(chart => chart.id !== id));
        
        // If we deleted the current chart, set current to null or the first available
        if (currentChart && currentChart.id === id) {
          const remainingCharts = allCharts.filter(chart => chart.id !== id);
          setCurrentChart(remainingCharts.length > 0 ? remainingCharts[0] : null);
        }
        
        setError(null);
      } else {
        setError('Failed to delete chart');
      }
      
      return success;
    } catch (error) {
      setError('Failed to delete chart');
      console.error(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update a specific task within a chart
  const updateTask = async (chartId: string, taskId: string, updates: Partial<Task>): Promise<boolean> => {
    if (!currentChart || currentChart.id !== chartId) {
      // Load the chart first if it's not the current one
      loadChartById(chartId);
      if (!currentChart) {
        setError('Chart not found');
        return false;
      }
    }
    
    try {
      // Deep clone the current chart to avoid direct state mutation
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
      return saveChart(updatedChart);
    } catch (error) {
      setError('Failed to update task');
      console.error(error);
      return false;
    }
  };
  
  // Import chart from JSON data
  const importChart = async (chartData: any): Promise<string | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        setError('You must be logged in to import a chart');
        return null;
      }
      
      // Create a copy of the chart data to avoid mutating the input
      const chartDataCopy = { ...chartData } as GanttData;
      
      // Always generate a new UUID for imported charts to avoid conflicts
      chartDataCopy.id = generateUUID();
      
      // Prepare the structure following the new database schema
      // Note: We're explicitly typing this as 'any' since it's not a GanttData object
      // but rather a database record with chart_data field
      const chart: any = {
        id: chartDataCopy.id,
        name: chartDataCopy.name || `Imported Chart (${new Date().toLocaleDateString()})`,
        description: chartDataCopy.description || '',
        chart_data: chartDataCopy, // Store the entire chart data as JSON
        user_id: userId
        // created_at and updated_at are handled by the database defaults
      };
      
      console.log('Importing chart with UUID:', chart.id);
      
      // Save the chart to database
      const success = await dbService.saveChart(chart);
      
      if (success) {
        // Update local state
        setAllCharts(prev => [...prev, chartDataCopy]);
        
        // Set as current chart
        setCurrentChart(chartDataCopy);
        setError(null);
        
        return chart.id;
      } else {
        setError('Failed to import chart');
        return null;
      }
    } catch (error) {
      console.error('Error importing chart:', error);
      setError('Failed to import chart: ' + (error instanceof Error ? error.message : String(error)));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Provide the context value
  const contextValue: GanttContextType = {
    // State
    allCharts,
    currentChart,
    isLoading,
    error,
    hoveredNodes,
    
    // Actions
    loadAllCharts,
    loadChartById,
    loadChart,
    saveChart,
    createNewChart,
    deleteChart,
    updateTask,
    setCurrentChartDirectly,
    setCurrentChart,
    importChart,
    setHoveredNodes,
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
