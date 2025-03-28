import { createClient } from '@supabase/supabase-js';
import { GanttData } from '../types';

// Helper function to get environment variables from either Vite or Node.js
function getEnvVariable(key: string): string {
  // Check if running in Vite/browser environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  
  // Check if running in Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  
  return '';
}

// Get Supabase credentials from environment
const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVariable('VITE_SUPABASE_ANON_KEY');

// Check if the environment variables are defined
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env file');
}

// Create a single instance of the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Custom type for Supabase tables
export type Tables = {
  charts: GanttData;
};
