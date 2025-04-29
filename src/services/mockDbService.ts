import { GanttData } from '../types';

// Using localStorage as our mock database
const STORAGE_KEY = 'gantt_charts';

/**
 * Mock database service for Gantt charts
 * This simulates database operations using localStorage
 */
export const mockDbService = {
  /**
   * Get all Gantt charts
   */
  getAllCharts: (): GanttData[] => {
    try {
      const charts = localStorage.getItem(STORAGE_KEY);
      return charts ? JSON.parse(charts) : [];
    } catch (error) {
      console.error('Error fetching charts:', error);
      return [];
    }
  },

  /**
   * Get a single Gantt chart by ID
   */
  getChartById: (id: string): GanttData | null => {
    try {
      const charts = mockDbService.getAllCharts();
      return charts.find(chart => chart.id === id) || null;
    } catch (error) {
      console.error('Error fetching chart:', error);
      return null;
    }
  },

  /**
   * Save a new Gantt chart
   */
  saveChart: (chart: GanttData): boolean => {
    try {
      const charts = mockDbService.getAllCharts();
      const existingIndex = charts.findIndex(c => c.id === chart.id);
      
      if (existingIndex >= 0) {
        // Update existing chart
        charts[existingIndex] = chart;
      } else {
        // Add new chart
        charts.push(chart);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
      return true;
    } catch (error) {
      console.error('Error saving chart:', error);
      return false;
    }
  },

  /**
   * Link a chart to a project
   * @param chartId The ID of the chart to link
   * @param projectId The ID of the project to link to
   */
  linkChartToProject: (chartId: string, projectId: string): boolean => {
    return true;
  },

  /**
   * Delete a Gantt chart
   */
  deleteChart: (id: string): boolean => {
    try {
      const charts = mockDbService.getAllCharts();
      const filteredCharts = charts.filter(chart => chart.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredCharts));
      return true;
    } catch (error) {
      console.error('Error deleting chart:', error);
      return false;
    }
  },
  
  /**
   * Initialize with demo data if no charts exist
   */
  initWithDemoData: (demoData: GanttData): void => {
    const charts = mockDbService.getAllCharts();
    if (charts.length === 0) {
      mockDbService.saveChart(demoData);
    }
  }
};
