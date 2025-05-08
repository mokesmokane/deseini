import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GanttData } from '../types';
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
interface ChartsListContextType {
  // State
  allCharts: GanttData[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAllCharts: () => void;
  loadChartById: (id: string) => Promise<GanttData | null>;
  saveChart: (chart: GanttData) => Promise<boolean>;
  createNewChart: (chart: GanttData) => Promise<boolean>;
  deleteChart: (id: string) => Promise<boolean>;
  importChart: (chartData: any) => Promise<string | null>;
}

// Create the context
const ChartsListContext = createContext<ChartsListContextType | undefined>(undefined);

// Provider props
interface ChartsListProviderProps {
  children: ReactNode;
  initialData?: GanttData;
}

// Provider component
export const ChartsListProvider: React.FC<ChartsListProviderProps> = ({ children, initialData }) => {
  const [allCharts, setAllCharts] = useState<GanttData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get the database service
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
    } catch (error) {
      setError('Failed to load charts');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load a specific chart by ID (returns the chart without setting as current)
  const loadChartById = async (id: string): Promise<GanttData | null> => {
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
      
      // Prepare the structure following the database schema
      const chart: any = {
        id: chartDataCopy.id,
        name: chartDataCopy.name || `Imported Chart (${new Date().toLocaleDateString()})`,
        description: chartDataCopy.description || '',
        chart_data: chartDataCopy, // Store the entire chart data as JSON
        user_id: userId
        // created_at and updated_at are handled by the database defaults
      };
      
      
      // Save the chart to database
      const success = await dbService.saveChart(chart);
      
      if (success) {
        // Update local state
        setAllCharts(prev => [...prev, chartDataCopy]);
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
  const contextValue: ChartsListContextType = {
    // State
    allCharts,
    isLoading,
    error,
    
    // Actions
    loadAllCharts,
    loadChartById,
    saveChart,
    createNewChart,
    deleteChart,
    importChart,
  };

  return (
    <ChartsListContext.Provider value={contextValue}>
      {children}
    </ChartsListContext.Provider>
  );
};

// Custom hook for using the ChartsListContext
export const useChartsList = (): ChartsListContextType => {
  const context = useContext(ChartsListContext);
  if (!context) {
    throw new Error('useChartsList must be used within a ChartsListProvider');
  }
  return context;
};
