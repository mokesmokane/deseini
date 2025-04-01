import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import { Project } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ProjectContextType {
  project: Project | null;
  isLoading: boolean;
  errorMessage: string | undefined;
  projectsList: Project[];
  userCharts: { id: string; name: string; description: string; project_id: string }[];
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  fetchProject: (id: string) => Promise<void>;
  fetchAllProjects: () => Promise<void>;
  fetchProjectCharts: (projectId: string) => Promise<void>;
  saveProject: () => Promise<string | undefined>;
  cloneProject: () => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  deleteDeliverable: (deliverableId: string) => Promise<void>;
  createNewProject: () => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [userCharts, setUserCharts] = useState<{ id: string; name: string; description: string; project_id: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [databaseRoleIds, setDatabaseRoleIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const createNewProject = () => {
    setProject({
      projectName: "",
      description: "",
      bannerImage: "",
      attachments: [],
      roles: []
    });
    setIsLoading(false);
    setDatabaseRoleIds(new Set());
  };

  const fetchAllProjects = async () => {
    setIsLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Not authenticated');
      }

      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userData.user.id);

      if (projectsError) throw projectsError;
      
      // Transform data to match our frontend model
      const projects = projectsData?.map(project => ({
        id: project.id,
        projectName: project.project_name,
        description: project.description,
        bannerImage: project.banner_image || '',
        attachments: [],
        roles: []
      })) || [];

      setProjectsList(projects);
      toast.success('Projects loaded successfully');
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectCharts = useCallback(async (projectId: string) => {
    try {
      // 1. Fetch chart IDs associated with the project from the join table
      const { data: projectChartsData, error: projectChartsError } = await supabase
        .from('project_charts')
        .select('chart_id')
        .eq('project_id', projectId);

      if (projectChartsError) throw projectChartsError;

      const chartIds = projectChartsData?.map(pc => pc.chart_id) || [];

      if (chartIds.length === 0) {
        setUserCharts([]); // No charts associated with this project
        return;
      }
      console.log(chartIds)
      // 2. Fetch the actual chart details using the obtained IDs
      const { data: chartsData, error: chartsError } = await supabase
        .from('charts')
        .select('id, name, description')
        .in('id', chartIds);

      if (chartsError) throw chartsError;

      setUserCharts(chartsData || []);
    } catch (error) {
      console.error('Error fetching project charts:', error);
      toast.error('Failed to load charts for this project');
      setUserCharts([]); // Ensure state is cleared on error
    }
  }, [supabase]);


  const fetchProject = useCallback(async (id: string) => {
    setIsLoading(true);
    setErrorMessage(undefined); // Clear any previous errors
    
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (projectError) throw projectError;
      if (!projectData) throw new Error('Project not found');

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('roles')
        .select('*, deliverables(*)')
        .eq('project_id', id);

      if (rolesError) throw rolesError;

      // Fetch attachments
      const { data: attachmentsData, error: attachmentsError } = await supabase
        .from('attachments')
        .select('*')
        .eq('project_id', id);

      if (attachmentsError) throw attachmentsError;

      // Fetch charts for this project
      await fetchProjectCharts(id);

      // Transform data to match our frontend model
      const roles = rolesData?.map(role => {
        // Track role IDs that exist in the database
        if (role.id) {
          setDatabaseRoleIds(prev => new Set(prev).add(role.id));
        }

        return {
          id: role.id,
          title: role.title,
          type: role.type,
          country: role.country,
          region: role.region,
          town: role.town,
          level: role.level,
          professions: role.professions,
          startDate: role.start_date,
          endDate: role.end_date,
          paymentBy: role.payment_by,
          hourlyRate: role.hourly_rate,
          description: role.description,
          deliverables: role.deliverables?.map((d: any) => ({
            id: d.id,
            deliverableName: d.deliverable_name,
            deadline: d.deadline,
            fee: d.fee,
            description: d.description
          })) || []
        };
      }) || [];

      const attachments = attachmentsData?.map(attachment => ({
        id: attachment.id,
        name: attachment.name,
        size: attachment.size,
        type: attachment.type,
        url: attachment.file_path
      })) || [];

      setProject({
        id: projectData.id,
        projectName: projectData.project_name,
        description: projectData.description,
        bannerImage: projectData.banner_image || '',
        attachments,
        roles
      });

      toast.success('Project loaded successfully');
    } catch (error) {
      console.error('Error fetching project details:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load project');
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [fetchProjectCharts]);

  const saveProject = async (): Promise<string | undefined> => {
    if (!project) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      let savedProjectId: string | undefined;
      const isNewProject = !project.id;

      if (isNewProject) {
        // Create new project
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            project_name: project.projectName,
            description: project.description,
            banner_image: project.bannerImage,
            user_id: user.id
          })
          .select()
          .single();

        if (projectError) throw projectError;
        if (!projectData) throw new Error('No project data returned');

        savedProjectId = projectData.id;
        
        // Update local state with new project ID
        setProject(prevProject => prevProject ? { ...prevProject, id: savedProjectId } : null);
      } else {
        // Update existing project
        savedProjectId = project.id;
        const { error: projectError } = await supabase
          .from('projects')
          .update({
            project_name: project.projectName,
            description: project.description,
            banner_image: project.bannerImage
          })
          .eq('id', savedProjectId);

        if (projectError) throw projectError;
      }

      // Handle roles
      const newDatabaseRoleIds = new Set<string>();

      for (const role of project.roles) {
        let roleData;

        if (role.id && databaseRoleIds.has(role.id)) {
          // Update existing role
          const { data, error: roleError } = await supabase
            .from('roles')
            .update({
              title: role.title,
              type: role.type,
              country: role.country,
              region: role.region,
              town: role.town,
              level: role.level,
              professions: role.professions,
              start_date: role.startDate,
              end_date: role.endDate,
              payment_by: role.paymentBy,
              hourly_rate: role.hourlyRate,
              description: role.description
            })
            .eq('id', role.id)
            .select()
            .single();

          if (roleError) throw roleError;
          roleData = data;
          if (roleData) {
            newDatabaseRoleIds.add(roleData.id);
          }
        } else {
          // Create new role
          const { data, error: roleError } = await supabase
            .from('roles')
            .insert({
              project_id: savedProjectId,
              title: role.title,
              type: role.type,
              country: role.country,
              region: role.region,
              town: role.town,
              level: role.level,
              professions: role.professions,
              start_date: role.startDate,
              end_date: role.endDate,
              payment_by: role.paymentBy,
              hourly_rate: role.hourlyRate,
              description: role.description
            })
            .select()
            .single();

          if (roleError) throw roleError;
          roleData = data;
          if (roleData) {
            newDatabaseRoleIds.add(roleData.id);
          }
        }

        if (!roleData) throw new Error('No role data returned');

        // Handle deliverables
        if (role.deliverables && role.deliverables.length > 0) {
          // Delete existing deliverables
          if (role.id) {
            const { error: deleteDeliverablesError } = await supabase
              .from('deliverables')
              .delete()
              .eq('role_id', role.id);

            if (deleteDeliverablesError) throw deleteDeliverablesError;
          }

          // Create new deliverables
          const deliverablesData = role.deliverables.map(deliverable => ({
            role_id: roleData.id,
            deliverable_name: deliverable.deliverableName,
            deadline: deliverable.deadline,
            fee: deliverable.fee,
            description: deliverable.description
          }));

          const { data: insertedDeliverables, error: deliverablesError } = await supabase
            .from('deliverables')
            .insert(deliverablesData)
            .select();

          if (deliverablesError) throw deliverablesError;

          // Update local state with new deliverable IDs
          if (insertedDeliverables) {
            role.deliverables = role.deliverables.map((deliverable, index) => ({
              ...deliverable,
              id: insertedDeliverables[index]?.id
            }));
          }
        }
      }

      setDatabaseRoleIds(newDatabaseRoleIds);
      
      toast.success('Project saved successfully');
      
      return savedProjectId;
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    }
  };

  const cloneProject = async () => {
    if (!project) return;
    
    try {
      const clonedProject = {
        ...project,
        id: undefined, // Remove ID when cloning
        projectName: `${project.projectName} (Copy)`,
        roles: project.roles.map(role => ({
          ...role,
          id: undefined // Remove IDs when cloning
        }))
      };
      setProject(clonedProject);
      setDatabaseRoleIds(new Set());
      toast.success('Project cloned successfully');
      navigate('/projects/new', { replace: true });
    } catch (error) {
      console.error('Error cloning project:', error);
      toast.error('Failed to clone project');
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      // First verify the role exists
      const { data: roleExists, error: checkError } = await supabase
        .from('roles')
        .select('id')
        .eq('id', roleId)
        .single();

      if (checkError) {
        console.error('Error checking role:', checkError);
        throw new Error('Failed to verify role');
      }

      if (!roleExists) {
        throw new Error('Role not found');
      }

      // Delete the role (cascade will handle deliverables)
      const { error: deleteError } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);

      if (deleteError) {
        console.error('Error deleting role:', deleteError);
        throw deleteError;
        
      }

      // Remove from our tracking set
      const newDatabaseRoleIds = new Set(databaseRoleIds);
      newDatabaseRoleIds.delete(roleId);
      setDatabaseRoleIds(newDatabaseRoleIds);

      // Update the local state
      if (project) {
        setProject({
          ...project,
          roles: project.roles.filter(role => role.id !== roleId)
        });
      }

      toast.success('Role deleted successfully');
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error(`Failed to delete role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteDeliverable = async (deliverableId: string) => {
    try {
      // First verify the deliverable exists
      const { data: deliverableExists, error: checkError } = await supabase
        .from('deliverables')
        .select('id')
        .eq('id', deliverableId)
        .single();

      if (checkError) {
        console.error('Error checking deliverable:', checkError);
        throw new Error('Failed to verify deliverable');
      }

      if (!deliverableExists) {
        throw new Error('Deliverable not found');
      }

      // Delete the deliverable
      const { error: deleteError } = await supabase
        .from('deliverables')
        .delete()
        .eq('id', deliverableId);

      if (deleteError) {
        console.error('Error deleting deliverable:', deleteError);
        throw deleteError;
      }

      // Update the local state
      if (project) {
        setProject({
          ...project,
          roles: project.roles.map(role => {
            if (!role.deliverables) return role;
            
            return {
              ...role,
              deliverables: role.deliverables.filter(d => d.id !== deliverableId)
            };
          })
        });
      }

      toast.success('Deliverable deleted successfully');
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      toast.error(`Failed to delete deliverable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Memoize the context value to prevent unnecessary re-renders of consumers
  const value = useMemo(() => ({
    project,
    isLoading,
    errorMessage,
    projectsList,
    userCharts,
    setProject,
    fetchProject,
    fetchAllProjects,
    fetchProjectCharts,
    saveProject,
    cloneProject,
    deleteRole,
    deleteDeliverable,
    createNewProject
  }), [
    project,
    isLoading,
    errorMessage,
    projectsList,
    userCharts,
    // State setters like setProject are stable and don't need to be dependencies
    fetchProject, // Already memoized with useCallback
    fetchAllProjects, // Assuming this will also be memoized if it causes issues
    fetchProjectCharts, // Already memoized with useCallback
    saveProject, // Assuming this will also be memoized if it causes issues
    cloneProject, // Assuming this will also be memoized if it causes issues
    deleteRole, // Assuming this will also be memoized if it causes issues
    deleteDeliverable, // Assuming this will also be memoized if it causes issues
    createNewProject // Assuming this will also be memoized if it causes issues
  ]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
