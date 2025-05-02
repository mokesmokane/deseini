import { supabase } from './supabaseClient';

export interface Project {
  id: string;
  projectName: string;
  createdAt: string | null;
  updatedAt: string | null;
  starred: boolean;
  description?: string;
  bannerImage?: string;
  attachments?: any[];
  roles?: any[];
  charts?: any[];
}

export interface Conversation {
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  lastMessage: string | null;
}

export interface Message {
  id: string;
  timestamp: Date;
  content?: string;
  role: 'user' | 'assistant';
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

  getProjectById: async (userId: string, projectId: string): Promise<Project | null> => {
    const { data, error } = await supabase
      .from('projects')
      // Select specific columns matching the Project interface + DB names (excluding 'starred')
      .select('id, project_name, created_at, updated_at, description, banner_image')
      .eq('user_id', userId)
      .eq('id', projectId)
      .single();

    if (error) {
      // Log the specific Supabase error
      console.error('Error fetching project by ID from Supabase:', error.message);
      return null;
    }

    if (!data) {
      return null; // Project not found
    }

    // Map Supabase response (snake_case) to Project interface (camelCase)
    const project: Project = {
      id: data.id,
      projectName: data.project_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      starred: false, // Default to false as it's not in the DB
      description: data.description ?? undefined,
      bannerImage: data.banner_image ?? undefined,
      attachments: [],
      roles: [],
      charts: [],
    };

    return project;
  },
  
  starProject: async (projectId: string, starred: boolean) => {
    const { data, error } = await supabase
      .from('user_projects')
      .update({ starred })
      .eq('project_id', projectId);
    if (error) console.error('Error starring project:', error);
    return data;
  },
  
  /**
   * Create a new project for the current user
   * @returns The ID of the newly created project, or null if creation failed
   */
  createNewProject: async (projectName: string = 'Untitled Project'): Promise<string | null> => {
    try {
      // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        console.error('Cannot create project: No authenticated user');
        return null;
      }
      
      // Create the project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          project_name: projectName,
          user_id: userId,
        })
        .select('id')
        .single();
      
      if (projectError) {
        console.error('Error creating project:', projectError);
        return null;
      }
      
      // Link the project to the user in the user_projects table
      const projectId = projectData.id;
      const { error: linkError } = await supabase
        .from('user_projects')
        .insert({
          project_id: projectId,
          user_id: userId,
          starred: false
        });
      
      if (linkError) {
        console.error('Error linking project to user:', linkError);
        // Note: We don't return null here because the project was already created
        // It's just not linked in the user_projects table
      }
      
      return projectId;
    } catch (error) {
      console.error('Error in createNewProject:', error);
      return null;
    }
  },
  
  /**
   * Create a new conversation and link it to a project
   * @param projectId The project ID to link the conversation to
   * @returns The ID of the newly created conversation, or null if creation failed
   */
  createNewConversation: async (projectId: string, conversationName: string): Promise<string | null> => {
    try {
      // Generate a UUID for the conversation
      const conversationId = crypto.randomUUID();
      
      // Link the conversation to the project in project_conversations table
      const { error: linkError } = await supabase
        .from('project_conversations')
        .insert({
          project_id: projectId,
          conversation_name: conversationName,
          conversation_id: conversationId,
        });
      
      if (linkError) {
        console.error('Error creating conversation link:', linkError);
        return null;
      }
      
      return conversationId;
    } catch (error) {
      console.error('Error in createNewConversation:', error);
      return null;
    }
  },
  
  /**
   * Add a message to a conversation
   * @param conversationId The conversation ID to add the message to
   * @param message The message object to add
   * @returns Whether the message was successfully added
   */
  addMessagesToConversation: async (conversationId: string, messages: any[]): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('conversation_messages')
        .insert(messages.map(msg => ({
          conversation_id: conversationId,
          message: msg,
        })))
        .select();
      
      if (error) {
        console.error('Error adding message to conversation:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in addMessageToConversation:', error);
      return false;
    }
  },
  
  /**
   * Initialize a project with a first message
   * Creates a new project and conversation and adds the first message
   * @param firstMessage The content of the first message
   * @returns An object containing the project ID and conversation ID, or null if creation failed
   */
  initializeProjectWithFirstMessages: async (
    firstMessages: Message[],
    projectName: string = 'Untitled Project',
    conversationName: string = 'Untitled Conversation'
  ): Promise<{ project: Project; conversationId: string } | null> => {
    try {
      // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        console.error('Cannot get conversations: No authenticated user');
        return null;
      }
      
      // Create a new project
      const projectId = await projectService.createNewProject(projectName);
      if (!projectId) {
        return null;
      }
      
      // Create a new conversation linked to the project
      const conversationId = await projectService.createNewConversation(projectId, conversationName);
      if (!conversationId) {
        return null;
      }
      
      // Add the first message
      const messageAdded = await projectService.addMessagesToConversation(
        conversationId,
        firstMessages
      );
      
      if (!messageAdded) {
        return null;
      }

      //get the project
      const project = await projectService.getProjectById(userId, projectId); 
      
      return { project: project!, conversationId };
    } catch (error) {
      console.error('Error in initializeProjectWithFirstMessage:', error);
      return null;
    }
  },
  
  /**
   * Get conversations for the current user
   * @param projectId Optional project ID to filter conversations by
   * @returns An array of conversations, or an empty array if none found or on error
   */
  getUserConversations: async (projectId?: string | null): Promise<Conversation[]> => {
    try {
      // Get current user
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      
      if (!userId) {
        console.error('Cannot get conversations: No authenticated user');
        return [];
      }
      
      // If we have a specific project ID, only get conversations for that project
      if (projectId) {
        // Get conversations linked to this specific project
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('project_conversations')
          .select(`
            conversation_id,
            project_id,
            created_at
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        
        if (conversationsError) {
          console.error('Error fetching conversations for project:', conversationsError);
          return [];
        }
        
        if (!conversationsData || !conversationsData.length) {
          return [];
        }
        
        // Get the project name
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('project_name')
          .eq('id', projectId)
          .single();
        
        if (projectError) {
          console.error('Error fetching project details:', projectError);
          return [];
        }
        
        const projectName = projectData?.project_name || 'Unknown Project';
        
        // For each conversation, get the last message to display as a preview
        const conversations: Conversation[] = await Promise.all(
          conversationsData.map(async (conv) => {
            // Get last message for this conversation
            const { data: messageData, error: messageError } = await supabase
              .from('conversation_messages')
              .select('message')
              .eq('conversation_id', conv.conversation_id)
              .order('message_id', { ascending: false })
              .limit(1)
              .single();
            
            let lastMessage = null;
            if (!messageError && messageData) {
              // Extract content from the message JSON
              // Using type assertion to handle the unknown structure
              const msg = messageData.message as any;
              if (msg && typeof msg === 'object' && 'content' in msg) {
                lastMessage = msg.content;
              }
            }
            
            return {
              id: conv.conversation_id,
              projectId: conv.project_id,
              projectName: projectName,
              createdAt: conv.created_at,
              lastMessage,
            };
          })
        );
        
        return conversations;
      }
      
      // If no specific project ID, get all projects the user has access to
      const userProjects = await projectService.getProjectsByUser(userId);
      if (!userProjects.length) {
        return [];
      }
      
      const projectIds = userProjects.map(p => p.id);
      
      // Get conversations linked to these projects
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('project_conversations')
        .select(`
          conversation_id,
          project_id,
          created_at
        `)
        .in('project_id', projectIds)
        .order('created_at', { ascending: false });
      
      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
        return [];
      }
      
      if (!conversationsData || !conversationsData.length) {
        return [];
      }
      
      // Create a map of project IDs to project names for easy lookup
      const projectMap = Object.fromEntries(
        userProjects.map(p => [p.id, p.projectName])
      );
      
      // For each conversation, get the last message to display as a preview
      const conversations: Conversation[] = await Promise.all(
        conversationsData.map(async (conv) => {
          // Get last message for this conversation
          const { data: messageData, error: messageError } = await supabase
            .from('conversation_messages')
            .select('message')
            .eq('conversation_id', conv.conversation_id)
            .order('message_id', { ascending: false })
            .limit(1)
            .single();
          
          let lastMessage = null;
          if (!messageError && messageData) {
            // Extract content from the message JSON
            // Using type assertion to handle the unknown structure
            const msg = messageData.message as any;
            if (msg && typeof msg === 'object' && 'content' in msg) {
              lastMessage = msg.content;
            }
          }
          
          return {
            id: conv.conversation_id,
            projectId: conv.project_id,
            projectName: projectMap[conv.project_id] || 'Unknown Project',
            createdAt: conv.created_at,
            lastMessage,
          };
        })
      );
      
      return conversations;
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  },
  
  /**
   * Get messages for a specific conversation
   * @param conversationId The conversation ID to get messages for
   * @returns An array of messages, or an empty array if none found or on error
   */
  getConversationMessages: async (conversationId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('conversation_messages')
        .select('message, created_at')
        .eq('conversation_id', conversationId)
        .order('message_id', { ascending: true });
      
      if (error) {
        console.error('Error fetching conversation messages:', error);
        return [];
      }
      
      return (data || []).map(item => item.message);
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      return [];
    }
  },
};
