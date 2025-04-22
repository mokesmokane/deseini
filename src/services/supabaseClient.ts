import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
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

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);