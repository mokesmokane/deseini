import { GanttData } from '../types';
import { mockDbService } from './mockDbService';
import { supabaseDbService } from './supabaseDbService';

// Interface for database service to ensure both implementations follow the same contract
export interface DbService {
  getAllCharts: () => Promise<GanttData[]>;
  getChartById: (id: string) => Promise<GanttData | null>;
  saveChart: (chart: GanttData) => Promise<boolean>;
  deleteChart: (id: string) => Promise<boolean>;
  initWithDemoData: (demoData: GanttData) => Promise<void>;
}

// Enum for database service type
export enum DbServiceType {
  MOCK = 'mock',
  SUPABASE = 'supabase'
}

// Convert mockDbService methods to return promises to match the interface
const promisifyMockDbService: DbService = {
  getAllCharts: async () => Promise.resolve(mockDbService.getAllCharts()),
  getChartById: async (id: string) => Promise.resolve(mockDbService.getChartById(id)),
  saveChart: async (chart: GanttData) => Promise.resolve(mockDbService.saveChart(chart)),
  deleteChart: async (id: string) => Promise.resolve(mockDbService.deleteChart(id)),
  initWithDemoData: async (demoData: GanttData) => Promise.resolve(mockDbService.initWithDemoData(demoData))
};

// Flag to track if we've already logged the service type
let hasLoggedServiceType = false;

// Function to get the appropriate database service based on type
export const getDbService = (type: DbServiceType = DbServiceType.MOCK): DbService => {
  // Use environment variable to determine which service to use
  const serviceType = import.meta.env.VITE_USE_SUPABASE === 'true' 
    ? DbServiceType.SUPABASE 
    : type;
    
  // Only log the service type once
  if (!hasLoggedServiceType) {
    console.log(`Using ${serviceType === DbServiceType.SUPABASE ? 'Supabase' : 'mock'} database service`);
    hasLoggedServiceType = true;
  }
  
  // Return the appropriate service
  switch (serviceType) {
    case DbServiceType.SUPABASE:
      return supabaseDbService;
    case DbServiceType.MOCK:
    default:
      return promisifyMockDbService;
  }
};
