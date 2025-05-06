import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { Project, Chart, TreeTaskNode, ChatMessage, Role, Deliverable } from '../types';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { fetchApi } from '@/utils/api';
import { useNavigate } from 'react-router-dom';

// Interface for project conversations
interface ProjectConversation {
  id: string;
  projectId: string;
  createdAt: string;
}

interface ProjectContextType {
  project: Project | null;
  isLoading: boolean;
  errorMessage: string | undefined;
  projectsList: Project[];
  userCharts: Chart[];
  isGeneratingTasks: boolean;
  taskGenerationError: string | null;
  initialTasksForDialog: TreeTaskNode[];
  isCreateChartDialogOpen: boolean;
  projectConversations: ProjectConversation[];
  isLoadingConversations: boolean;
  setProject: React.Dispatch<React.SetStateAction<Project | null>>;
  setNoProject: () => void;
  fetchProject: (id: string) => Promise<void>;
  fetchAllProjects: (silent?: boolean) => Promise<void>;
  fetchProjectCharts: (projectId: string) => Promise<void>;
  saveProject: () => Promise<string | undefined>;
  cloneProject: () => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  deleteDeliverable: (deliverableId: string) => Promise<void>;
  createNewProject: () => void;
  handleInitiateTaskGeneration: (chatMessages: ChatMessage[]) => Promise<TreeTaskNode[] | null>;
  setIsCreateChartDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchProjectConversations: (projectId: string) => Promise<void>;
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
  const [userCharts, setUserCharts] = useState<Chart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [databaseRoleIds, setDatabaseRoleIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();
  
  // State for task generation (moved from Sidebar)
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [taskGenerationError, setTaskGenerationError] = useState<string | null>(null);
  const [initialTasksForDialog, setInitialTasksForDialog] = useState<TreeTaskNode[]>([]);
  const [isCreateChartDialogOpen, setIsCreateChartDialogOpen] = useState(false);

  // State for project conversations
  const [projectConversations, setProjectConversations] = useState<ProjectConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  const createNewProject = () => {
    setProject({
      id: `new-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      starred: false,
      projectName: "",
      description: "",
      bannerImage: "",
      attachments: [],
      roles: []
    });
    setIsLoading(false);
    setDatabaseRoleIds(new Set());
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async (silent = false) => {
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
        description: project.description || undefined,
        bannerImage: project.banner_image || '',
        attachments: [],
        roles: [],
        createdAt: project.created_at,
        updatedAt: project.updated_at,
        starred: false
      })) || [];

      setProjectsList(projects);
      if (!silent) {
        toast.success('Projects loaded successfully');
      }
    } catch (error) {
      setProjectsList([]);
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
        .select('id, name, description, created_at, updated_at, chart_data')
        .order('updated_at', { ascending: false })
        .in('id', chartIds);

      if (chartsError) throw chartsError;

      setUserCharts(chartsData?.map(c => {
        // Calculate task count from chart_data if available
        let taskCount = 0;
        if (c.chart_data) {
          try {
            const chartData = c.chart_data as any;
            if (chartData.tasks && Array.isArray(chartData.tasks)) {
              // Count all tasks including nested ones
              const countTasks = (tasks: any[]): number => {
                return tasks.reduce((count, task) => {
                  return count + 1 + (task.tasks && Array.isArray(task.tasks) ? countTasks(task.tasks) : 0);
                }, 0);
              };
              taskCount = countTasks(chartData.tasks);
            }
          } catch (e) {
            console.error('Error parsing chart data:', e);
          }
        }
        
        return {
          id: c.id,
          name: c.name,
          description: c.description || undefined,
          created_at: c.created_at,
          updated_at: c.updated_at,
          task_count: taskCount
        };
      }) || []);
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
      // Fetch conversations for this project
      await fetchProjectConversations(id);

      // Only add to projectsList if it doesn't already exist
      const projectInfo = {
        id: projectData.id,
        projectName: projectData.project_name,
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at,
        starred: true
      };
      
      setProjectsList(prev => {
        const exists = prev.some(p => p.id === projectInfo.id);
        if (exists) return prev;
        return [...prev, projectInfo];
      });

      // Transform data to match our frontend model
      const roles = rolesData?.map((role): Role => {
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
          description: role.description || '',
          deliverables: role.deliverables?.map((d: any): Deliverable => ({
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
        createdAt: projectData.created_at,
        updatedAt: projectData.updated_at,
        starred: false,
        projectName: projectData.project_name,
        description: projectData.description || undefined,
        bannerImage: projectData.banner_image || '',
        attachments,
        roles
      });

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

      let savedProjectId: string | undefined = project.id?.startsWith('new-') ? undefined : project.id;
      const isNewProject = !savedProjectId;

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
        setProject(prevProject => prevProject ? { ...prevProject, id: savedProjectId! } : null);
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
      const rolesToUpsert: any[] = [];
      const roleIdsToDelete: string[] = [];

      // Roles currently in DB but not in local state should be deleted
      databaseRoleIds.forEach(dbRoleId => {
        if (!project.roles?.some(role => role.id === dbRoleId)) {
          roleIdsToDelete.push(dbRoleId);
        }
      });

      // Roles in local state need to be upserted
      project.roles?.forEach(role => {
        rolesToUpsert.push({
          id: role.id?.startsWith('new-') ? undefined : role.id,
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
        });
      });
      
      // Upsert roles
      if (rolesToUpsert.length > 0) {
          const { data: upsertedRolesData, error: upsertError } = await supabase
              .from('roles')
              .upsert(rolesToUpsert)
              .select();
              
          if (upsertError) throw upsertError;
          
          // Update local role IDs with DB IDs & update databaseRoleIds set
          const newDatabaseRoleIds = new Set(databaseRoleIds);
          const updatedLocalRoles = project.roles?.map(localRole => {
              const dbRole = upsertedRolesData?.find(ur => 
                  (localRole.id && ur.id === localRole.id) ||
                  (localRole.title === ur.title && localRole.description === ur.description)
              );
              if (dbRole) {
                  newDatabaseRoleIds.add(dbRole.id);
                  return { ...localRole, id: dbRole.id };
              } 
              return localRole;
          }) || [];
          setProject(prev => prev ? { ...prev, roles: updatedLocalRoles } : null);
          setDatabaseRoleIds(newDatabaseRoleIds);
      }

      // Delete roles
      if (roleIdsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('roles')
          .delete()
          .in('id', roleIdsToDelete);

        if (deleteError) throw deleteError;
        
        // Update the set of known DB IDs
        setDatabaseRoleIds(prev => {
            const updated = new Set(prev);
            roleIdsToDelete.forEach(id => updated.delete(id));
            return updated;
        });
      }
      
      toast.success('Project saved successfully');
      
      return savedProjectId;
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save project');
      return undefined;
    }
  };

  const cloneProject = async () => {
    if (!project) return;
    // Basic clone: create new project object with a new temporary ID
    const newTempId = `new-${Date.now()}`;
    const clonedProjectData = { 
        ...project, 
        id: newTempId, // Assign a new temporary ID
        projectName: `${project.projectName} (Copy)`,
        roles: project.roles?.map(role => ({ // Clone roles with new temp IDs
            ...role,
            id: `new-role-${Date.now()}-${Math.random()}`, // Assign new temp ID to roles
            deliverables: role.deliverables?.map((del: Deliverable) => ({ 
                ...del, 
                id: `new-del-${Date.now()}-${Math.random()}` // Assign new temp ID to deliverables
            })) 
        }))
    };
    setProject(clonedProjectData); // Should now match Project type if roles/deliverables types are correct
    navigate('/projects/new'); // Navigate to new project form
    toast.success('Project cloned. Save to create a new entry.');
    setDatabaseRoleIds(new Set()); // Reset DB IDs for the clone
  };

  const deleteRole = async (roleId: string) => {
    if (!project) return;

    // Remove locally first for quick UI update
    const updatedRoles = project.roles?.filter(role => role.id !== roleId) || [];
    setProject(prev => prev ? { ...prev, roles: updatedRoles } : null);

    // Then attempt DB deletion if it exists there
    if (databaseRoleIds.has(roleId)) {
      try {
        const { error } = await supabase
          .from('roles')
          .delete()
          .eq('id', roleId);

        if (error) throw error;

        // Remove from known DB IDs
        setDatabaseRoleIds(prev => {
            const updated = new Set(prev);
            updated.delete(roleId);
            return updated;
        });
        toast.success('Role deleted successfully');
      } catch (err) {
        console.error('Error deleting role from DB:', err);
        toast.error('Failed to delete role from database. Reverting local change.');
        // Revert local change on DB error
        fetchProject(project.id!);
      }
    } else {
        toast.success('Role removed');
    }
  };

  const deleteDeliverable = async (deliverableId: string) => {
    if (!project) return;

    let roleIdOfDeliverable: string | undefined;

    // Remove locally
    const updatedRoles = project.roles?.map(role => {
        const initialLength = role.deliverables?.length ?? 0;
        const filteredDeliverables = role.deliverables?.filter((d: Deliverable) => d.id !== deliverableId);
        if (filteredDeliverables && filteredDeliverables.length < initialLength) {
            roleIdOfDeliverable = role.id;
            return { ...role, deliverables: filteredDeliverables };
        }
        return role;
    }) || [];
    setProject(prev => prev ? { ...prev, roles: updatedRoles } : null);
    
    // Delete from DB if role and deliverable IDs exist
    if (roleIdOfDeliverable && deliverableId && !deliverableId.startsWith('new-')) {
         try {
             const { error } = await supabase
                 .from('deliverables')
                 .delete()
                 .eq('id', deliverableId);
             if (error) throw error;
             toast.success('Deliverable deleted');
         } catch(err) {
             console.error('Error deleting deliverable from DB:', err);
             toast.error('Failed to delete deliverable. Reverting local change.');
             fetchProject(project.id!);
         }
    } else {
        toast.success('Deliverable removed');
    }
  };

  // Task Generation Logic (moved from Sidebar)
  const handleInitiateTaskGeneration = useCallback(async (chatMessages: ChatMessage[]): Promise<TreeTaskNode[] | null> => {
    console.log("ProjectContext: Initiating task generation...");
    setIsGeneratingTasks(true);
    setTaskGenerationError(null);
    setInitialTasksForDialog([]);
    setIsCreateChartDialogOpen(false);

    if (!project?.id) {
      const errorMsg = "Project ID is missing, cannot generate tasks.";
      console.error("ProjectContext Error:", errorMsg);
      setTaskGenerationError(errorMsg);
      setIsGeneratingTasks(false);
      return null;
    }

    try {
      const projectData = {
        id: project.id,
        projectName: project?.projectName || '',
        description: project?.description || '',
        roles: project?.roles || [],
        charts: userCharts || []
      };

      const lastUserMessage = chatMessages.filter((m: ChatMessage) => m.role === 'user').pop();
      const prompt = lastUserMessage?.content || "Generate project tasks based on the conversation.";

      console.log("ProjectContext: Calling /api/create-tasks with prompt:", prompt.substring(0, 100) + "...");

      const response = await fetchApi('/api/create-tasks', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
             prompt: prompt,
             projectContext: projectData,
             messages: chatMessages,
             model: "gpt-4.1"
         }),
      });

      const responseData = await response.json();

      if (!response.ok) {
          console.error("ProjectContext: API error response:", responseData);
          throw new Error(responseData.error || `Failed to create tasks (Status: ${response.status})`);
      }

      if (responseData.tasks && Array.isArray(responseData.tasks) && responseData.tasks.length > 0) {
        console.log("ProjectContext: Received tasks, setting state for dialog.", responseData.tasks);
        setInitialTasksForDialog(responseData.tasks);
        setIsCreateChartDialogOpen(true);
        setIsGeneratingTasks(false);
        toast.success('Tasks generated successfully! Ready to create chart.');
        return responseData.tasks;
      } else {
        console.warn("ProjectContext: Task generation succeeded but returned no tasks or invalid format.", responseData);
        throw new Error(responseData.message || "Task generation succeeded but returned no tasks.");
      }

    } catch (error) {
        console.error("ProjectContext: Error during task generation fetch/processing:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during task generation.';
        setTaskGenerationError(errorMessage);
        toast.error(`Task Generation Failed: ${errorMessage}`);
        setIsGeneratingTasks(false);
        setIsCreateChartDialogOpen(false);
        setInitialTasksForDialog([]);
        return null;
    }
  }, [project, userCharts]);

  const setNoProject = () => {
    // We want to maintain projectsList state for the dropdown
    // but clear all current project-specific state
    setProject(null);
    setUserCharts([]);
    setProjectConversations([]);
    setInitialTasksForDialog([]);
    setDatabaseRoleIds(new Set());
    
    // Reset error states
    setErrorMessage(undefined);
    setTaskGenerationError(null);
    setIsLoading(false);
    setIsGeneratingTasks(false);
  };

  const fetchProjectConversations = useCallback(async (projectId: string) => {
    setIsLoadingConversations(true);
    try {
      // Query the project_conversations table to get conversation IDs for this project
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('project_conversations')
        .select('*')
        .eq('project_id', projectId);

      if (conversationsError) throw conversationsError;

      const conversations: ProjectConversation[] = conversationsData?.map(conversation => ({
        id: conversation.conversation_id,
        projectId: conversation.project_id,
        createdAt: conversation.created_at,
      })) || [];

      setProjectConversations(conversations);
      
      if (conversations.length > 0) {
        toast.success(`Found ${conversations.length} conversation${conversations.length === 1 ? '' : 's'} for this project`);
      } else {
        toast.success('No conversations found for this project');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to load conversations');
      setProjectConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [supabase]);

  const value = useMemo(() => ({
    project,
    isLoading,
    errorMessage,
    projectsList,
    userCharts,
    isGeneratingTasks,
    taskGenerationError,
    initialTasksForDialog,
    isCreateChartDialogOpen,
    projectConversations,
    isLoadingConversations,
    setProject,
    setNoProject,
    fetchProject,
    fetchAllProjects,
    fetchProjectCharts,
    saveProject,
    cloneProject,
    deleteRole,
    deleteDeliverable,
    createNewProject,
    handleInitiateTaskGeneration,
    setIsCreateChartDialogOpen,
    fetchProjectConversations,
  }), [
    project,
    isLoading,
    errorMessage,
    projectsList,
    userCharts,
    isGeneratingTasks,
    taskGenerationError,
    initialTasksForDialog,
    isCreateChartDialogOpen, 
    projectConversations,
    isLoadingConversations,
    fetchProject, 
    fetchAllProjects, 
    fetchProjectCharts, 
    saveProject, 
    cloneProject, 
    deleteRole, 
    deleteDeliverable, 
    handleInitiateTaskGeneration, 
    createNewProject, 
    setIsCreateChartDialogOpen,
    fetchProjectConversations,
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
