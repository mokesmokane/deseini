import { supabase } from './supabaseClient';
import { DraftPlan, deserializeDraftPlan } from '../contexts/DraftPlan/types';
import { Json } from '../types/supabase';

export const projectDraftChartService = {
  /**
   * Fetch existing markdown for a project
   */
  async getDraftChart(projectId: string): Promise<DraftPlan | null> {
    try {
      const { data, error } = await supabase
        .from('project_draft_chart')
        .select('json')
        .eq('project_id', projectId)
        .single();
      if (error) {
        console.error('[projectDraftChartService] getMarkdown error', error);
        return null;
      }
      
      // Check if the data has the expected DraftPlan structure
      const jsonData = data.json;
      if (
        jsonData && 
        typeof jsonData === 'object' && 
        'sections' in jsonData && 
        Array.isArray((jsonData as any).sections)
      ) {
        // Use type assertion after validation
        return deserializeDraftPlan(jsonData);
      }
      
      console.warn('[projectDraftChartService] Data does not match DraftPlan structure', jsonData);
      return null;
    } catch (error) {
      console.error('[projectDraftChartService] getMarkdown exception', error);
      return null;
    }
  },

  /**
   * Save or update markdown for a project
   */
  async saveChart(projectId: string, draftPlan: DraftPlan): Promise<boolean> {
    try {
      const record = {
        project_id: projectId,
        // Use double type assertion to safely convert between incompatible types
        json: draftPlan as unknown as Json,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('project_draft_chart')
        .upsert(record, { onConflict: 'project_id' });
      if (error) {
        console.error('[projectDraftChartService] saveMarkdown error', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[projectDraftChartService] saveMarkdown exception', error);
      return false;
    }
  },
};
