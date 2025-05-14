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
 *
 * And the following table for section drafts:
 * 
 * CREATE TABLE project_draft_section_markdown (
 *   project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
 *   section_id text NOT NULL,
 *   content text NOT NULL,
 *   updated_at timestamptz DEFAULT now(),
 *   section_index integer,
 *   version integer DEFAULT 1,
 *   PRIMARY KEY (project_id, section_id)
 * );
 */
import { supabase } from './supabaseClient';
import { MarkdownSection } from '../types';

import { fetchApi } from '../utils/api';

/**
 * Edits a markdown section using the backend API.
 */
export async function editMarkdownSection(data: any): Promise<any> {
  return fetchApi('/api/edit-markdown-section', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

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

  /**
   * Delete markdown for a project
   */
  async deleteMarkdown(projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_markdown')
        .delete()
        .eq('project_id', projectId);
      if (error) {
        console.error('[projectMarkdownService] deleteMarkdown error', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[projectMarkdownService] deleteMarkdown exception', error);
      return false;
    }
  },

  /**
   * Fetch all markdown sections for a project
   */
  async getSections(projectId: string): Promise<MarkdownSection[]> {
    try {
      const { data, error } = await supabase
        .from('project_draft_section_markdown')
        .select('section_id, content, updated_at, version, section_index')
        .eq('project_id', projectId)
        .order('section_id', { ascending: true })  // First group by section_id
        .order('updated_at', { ascending: false }) // Then get latest by updated_at within each group
        .limit(1000);  // Add a reasonable limit
      
      if (error) {
        console.error('[projectMarkdownService] getSections error', error);
        return [];
      }
      
      // Create a map to store only the latest version of each section
      const latestSections = new Map<string, any>();
      
      // Populate the map - earlier items with same section_id will be overwritten
      (data || []).forEach(section => {
        if (!latestSections.has(section.section_id) || 
            new Date(section.updated_at) > new Date(latestSections.get(section.section_id).updated_at)) {
          latestSections.set(section.section_id, section);
        }
      });
      
      // Convert map values to array
      return Array.from(latestSections.values()).map(section => ({
        sectionId: section.section_id,
        content: section.content,
        updatedAt: section.updated_at,
        version: section.version,
        sectionIndex: section.section_index
      }));
    } catch (error) {
      console.error('[projectMarkdownService] getSections exception', error);
      return [];
    }
  },

  /**
   * Fetch a specific section by ID
   */
  async getSection(projectId: string, sectionId: string): Promise<MarkdownSection | null> {
    try {
      const { data, error } = await supabase
        .from('project_draft_section_markdown')
        .select('section_id, content, updated_at, version, section_index')
        .eq('project_id', projectId)
        .eq('section_id', sectionId)
        .single();
      
      if (error) {
        console.error('[projectMarkdownService] getSection error', error);
        return null;
      }
      
      if (!data) return null;
      
      return {
        sectionId: data.section_id,
        content: data.content,
        updatedAt: data.updated_at,
        version: data.version,
        sectionIndex: data.section_index
      };
    } catch (error) {
      console.error('[projectMarkdownService] getSection exception', error);
      return null;
    }
  },

  /**
   * Save or update a markdown section
   */
  async saveSection(projectId: string, sectionId: string, content: string, sectionIndex: number, updatedAt: Date): Promise<boolean> {
    try {
      // First check if this section already exists to increment version
      const { data: existingData, error: fetchError } = await supabase
        .from('project_draft_section_markdown')
        .select('version')
        .eq('project_id', projectId)
        .eq('section_id', sectionId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (fetchError) {
        console.error('[projectMarkdownService] saveSection fetch error', fetchError);
        return false;
      }
      
      const version = existingData ? existingData.version + 1 : 1;
      
      const record = {
        project_id: projectId,
        section_id: sectionId,
        content,
        section_index: sectionIndex,
        updated_at: updatedAt.toISOString(),
        version
      };
      
      const { error } = await supabase
        .from('project_draft_section_markdown')
        .upsert(record);
      
      if (error) {
        console.error('[projectMarkdownService] saveSection upsert error', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[projectMarkdownService] saveSection exception', error);
      return false;
    }
  },

  /**
   * Save multiple sections at once
   */
  async saveSections(projectId: string, sections: { sectionId: string, content: string, sectionIndex: number, updatedAt: Date }[]): Promise<boolean> {
    try {
      // Process sections in batches to prevent excessive database calls
      const batchSize = 10;
      
      for (let i = 0; i < sections.length; i += batchSize) {
        const batch = sections.slice(i, i + batchSize);
        const promises = batch.map(section => 
          this.saveSection(projectId, section.sectionId, section.content, section.sectionIndex, section.updatedAt)
        );
        
        const results = await Promise.all(promises);
        
        if (results.some(result => !result)) {
          console.error('[projectMarkdownService] saveSections batch error');
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('[projectMarkdownService] saveSections exception', error);
      return false;
    }
  },

  /**
   * Delete a specific section
   */
  async deleteSection(projectId: string, sectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_draft_section_markdown')
        .delete()
        .eq('project_id', projectId)
        .eq('section_id', sectionId);
      
      if (error) {
        console.error('[projectMarkdownService] deleteSection error', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[projectMarkdownService] deleteSection exception', error);
      return false;
    }
  },

  /**
   * Delete all sections for a project
   */
  async deleteAllSections(projectId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_draft_section_markdown')
        .delete()
        .eq('project_id', projectId);
      
      if (error) {
        console.error('[projectMarkdownService] deleteAllSections error', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('[projectMarkdownService] deleteAllSections exception', error);
      return false;
    }
  }
};
