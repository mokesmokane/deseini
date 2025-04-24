import { supabase } from './supabaseClient';

export interface Project {
  id: string;
  projectName: string;
  createdAt: string | null;
  updatedAt: string | null;
  starred: boolean;
}

/**
 * Fetch projects for a given user.
 * Returns projects the user owns or is shared via user_projects table.
 */
export const projectService = {
  getProjectsByUser: async (userId: string): Promise<Project[]> => {
    // 1. Fetch projects owned by the user
    const { data: ownedData, error: ownedError } = await supabase
      .from('projects')
      .select('id, project_name, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (ownedError) console.error('Error fetching owned projects:', ownedError);

    const owned: Project[] = (ownedData || []).map((p) => ({
      id: p.id,
      projectName: p.project_name,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      starred: false,
    }));

    // 2. Fetch projects shared with the user via user_projects
    const { data: sharedData, error: sharedError } = await supabase
      .from('user_projects')
      .select('starred, projects(id, project_name, created_at, updated_at)')
      .eq('user_id', userId);
    if (sharedError) console.error('Error fetching shared projects:', sharedError);

    // Exclude projects the user owns
    const ownedIds = new Set(owned.map((p) => p.id));
    const shared: Project[] = (sharedData || [])
      .filter((r) => r.projects && !ownedIds.has(r.projects.id))
      .map((r) => ({
        id: r.projects.id,
        projectName: r.projects.project_name,
        createdAt: r.projects.created_at,
        updatedAt: r.projects.updated_at,
        starred: r.starred,
      }));

    // 3. Combine and sort by creation date desc
    const all = [...owned, ...shared];
    all.sort((a, b) => (b.createdAt ?? '') .localeCompare(a.createdAt ?? ''));
    return all;
  },
  starProject: async (projectId: string, starred: boolean) => {
    const { data, error } = await supabase
      .from('user_projects')
      .update({ starred })
      .eq('project_id', projectId);
    if (error) console.error('Error starring project:', error);
    return data;
  },
};
