import { GanttData } from '../types';
import { supabase } from './supabaseClient';

/**
 * Validates if a string is a valid UUID format
 * @param id The string to validate
 * @returns True if the string is a valid UUID
 */
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

/**
 * Generates a deterministic UUID from any string input
 * This ensures that the same input string always generates the same UUID
 * @param input Any string input
 * @returns A valid UUID string
 */
const generateDeterministicUUID = (input: string): string => {
  // Create a namespace UUID (using a fixed UUID as namespace)
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  
  // Simple string hashing function
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert the hash to hex and pad with zeros
  const hashHex = Math.abs(hash).toString(16).padStart(8, '0');
  
  // Create a deterministic UUID using the hash and namespace pattern
  return `${hashHex.substring(0, 8)}-${hashHex.substring(0, 4)}-4${hashHex.substring(0, 3)}-8${hashHex.substring(0, 3)}-${namespace.substring(24)}`;
};

/**
 * Ensures that an ID is in UUID format
 * If not, converts it to a deterministic UUID based on the input
 * @param id The ID to check/convert
 * @returns A valid UUID
 */
const ensureUUID = (id: string): string => {
  if (!id) {
    throw new Error('Invalid ID: ID cannot be empty');
  }
  
  if (isValidUUID(id)) {
    return id;
  }
  
  return generateDeterministicUUID(id);
};

/**
 * Supabase database service for Gantt charts
 * Implements the same interface as mockDbService for seamless replacement
 * Following SOLID principles with single responsibility for database operations
 */
export const supabaseDbService = {
  /**
   * Get all Gantt charts
   */
  getAllCharts: async (): Promise<GanttData[]> => {
    try {
      const { data, error } = await supabase
        .from('charts')
        .select('*');
        
      if (error) {
        return [];
      }
      
      // Extract chart_data JSON for each record
      // Check if we have the new structure with chart_data or old direct format
      return data?.map(record => {
        // If this is the new structure with chart_data JSON blob
        if (record.chart_data) {
          return record.chart_data as unknown as GanttData;
        }
        // Fallback to treating the whole record as a GanttData object (legacy format)
        return record as unknown as GanttData;
      }) || [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Get a single Gantt chart by ID
   */
  getChartById: async (id: string): Promise<GanttData | null> => {
    try {
      // Convert ID to UUID format if it's not already
      const uuidId = ensureUUID(id);
      
      const { data, error } = await supabase
        .from('charts')
        .select('*')
        .eq('id', uuidId)
        .single();
        
      if (error) {
        return null;
      }
      
      if (!data) {
        return null;
      }
      
      // Check if we have the new structure with chart_data or old direct format
      if (data.chart_data) {
        return data.chart_data as unknown as GanttData;
      }
      
      // Fallback to treating the whole record as a GanttData object (legacy format)
      return data as unknown as GanttData;
    } catch (error) {
      return null;
    }
  },

  /**
   * Link a chart to a project
   * @param chartId The ID of the chart to link
   * @param projectId The ID of the project to link to
   */
  linkChartToProject: async (chartId: string, projectId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('project_charts')
        .insert({ project_id: projectId, chart_id: chartId });
        
      if (error) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },
  

  /**
   * Save a new Gantt chart
   * @param chart Can be either a GanttData object or a prepared database record
   */
  saveChart: async (chart: any): Promise<boolean> => {
    try {
      // Check if we need to transform the chart data into the database format
      const isGanttDataOnly = !chart.chart_data && (chart.name !== undefined);
      
        // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        return false;
      }
      
      // Convert chart ID to UUID format if needed
      const uuidId = ensureUUID(chart.id);
      
      // Prepare the record in the correct format for the database
      const record = isGanttDataOnly ? {
        id: uuidId,
        name: chart.name || 'Untitled Chart',
        description: chart.description || '',
        chart_data: {
          ...chart,
          id: uuidId // Update ID in chart_data as well
        },
        user_id: userId
      } : {
        ...chart,
        id: uuidId
      };

      console.log('Saving chart with UUID:', uuidId);
      console.log('Record to save:', record);
      
      // Check if chart exists already
      const { data: existingChart } = await supabase
        .from('charts')
        .select('id')
        .eq('id', uuidId)
        .single();
      
      let result;
      
      if (existingChart) {
        // Update existing chart
        result = await supabase
          .from('charts')
          .update(record)
          .eq('id', uuidId);
      } else {
        // Add new chart
        result = await supabase
          .from('charts')
          .insert(record);
      }
      
      if (result.error) {
        console.error('Error saving chart:', result.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error saving chart:', error);
      return false;
    }
  },

  /**
   * Delete a Gantt chart
   */
  deleteChart: async (id: string): Promise<boolean> => {
    try {
      // Convert ID to UUID format if needed
      const uuidId = ensureUUID(id);
      
      const { error } = await supabase
        .from('charts')
        .delete()
        .eq('id', uuidId);
        
      if (error) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },
  
  /**
   * Initialize with demo data if no charts exist
   */
  initWithDemoData: async (demoData: GanttData): Promise<void> => {
    try {
      const { data } = await supabase
        .from('charts')
        .select('id');
        
      if (!data || data.length === 0) {
        // Get current user
        const { data: sessionData } = await supabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        
        if (!userId) {
          return;
        }
        
        // Ensure demo data has a UUID format ID
        const uuidId = ensureUUID(demoData.id);
        const updatedDemoData = {
          ...demoData,
          id: uuidId
        };
        
        // Create record in database format
        const record = {
          id: uuidId,
          name: updatedDemoData.name || 'Demo Chart',
          description: updatedDemoData.description || 'A sample chart for demonstration',
          chart_data: updatedDemoData,
          user_id: userId
        };
        
        await supabaseDbService.saveChart(record);
      }
    } catch (error) {
    }
  }
};
