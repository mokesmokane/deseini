/**
 * Service for persisting project plan markdown.
 *
 * Ensure you have the following table in your database:
 *
 * CREATE TABLE project_markdown (
 *   project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
 *   content text NOT NULL,
 *   updated_at timestamptz DEFAULT now()
 * );
 */
import { supabase } from './supabaseClient';

export const projectMarkdownService = {
  /**
   * Fetch existing markdown for a project
   */
  async getMarkdown(projectId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('project_markdown')
        .select('content')
        .eq('project_id', projectId)
        .single();
      if (error) {
        console.error('[projectMarkdownService] getMarkdown error', error);
        return null;
      }
      return data?.content || null;
    } catch (error) {
      console.error('[projectMarkdownService] getMarkdown exception', error);
      return null;
    }
  },

  /**
   * Save or update markdown for a project
   */
  async saveMarkdown(projectId: string, markdown: string): Promise<boolean> {
    try {
      const record = {
        project_id: projectId,
        content: markdown,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('project_markdown')
        .upsert(record, { onConflict: 'project_id' });
      if (error) {
        console.error('[projectMarkdownService] saveMarkdown error', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[projectMarkdownService] saveMarkdown exception', error);
      return false;
    }
  },
};
