import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Message, MessageStatus } from '../components/landing/types';
import { useDraftMarkdown } from '../components/landing/DraftMarkdownProvider';
import { projectService } from '@/services/projectService';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useProject } from '../contexts/ProjectContext';
import { useDraftPlanMermaidContext } from '../contexts/DraftPlan/DraftPlanContextMermaid';

interface MessagingContextProps {
  messages: Message[];
  addMessage: (content: string) => void;
  setMessages: (messages: Message[]) => void;
  isCanvasVisible: boolean;
  toggleCanvas: () => void;
  isChatVisible: boolean;
  toggleChat: () => void;
  currentStreamingMessageId: string | null;
  currentStreamingContent: string;
  projectIsReady: boolean;
  projectReadyReason: string;
  percentageComplete: number;
  projectReadyRecommendations: string[];
  currentProjectId: string | null;
  currentConversationId: string | null;
  setCurrentProjectId: (id: string | null) => void;
  setCurrentConversationId: (id: string | null) => void;
  loadConversationMessages: (conversationId: string) => Promise<void>;
  isLoadingMessages: boolean;
}

const MessagingContext = createContext<MessagingContextProps | undefined>(undefined);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [currentStreamingMessageId, setCurrentStreamingMessageId] = useState<string | null>(null);
  const [currentStreamingContent, setCurrentStreamingContent] = useState<string>('');
  const [projectIsReady, setProjectIsReady] = useState<boolean>(false);
  const [projectReadyReason, setProjectReadyReason] = useState<string>('');
  const [percentageComplete, setPercentageComplete] = useState<number>(0);
  const [projectReadyRecommendations, setProjectReadyRecommendations] = useState<string[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const {project, projectConversations, fetchProject} = useProject();
  const { generateProjectPlanForProjectId, sections } = useDraftMarkdown();
  const { createPlanFromMarkdown: createMermaidPlan} = useDraftPlanMermaidContext();

  // Load conversation messages when conversation ID changes
  useEffect(() => {
    if (currentConversationId) {
      loadConversationMessages(currentConversationId);
    }
  }, [currentConversationId]);

  useEffect(() => {
    if (project && currentProjectId !== project.id) {
      reset();
      setCurrentProjectId(project.id);
      const latestConversation = projectConversations?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      setCurrentConversationId(latestConversation?.id || null);
      if (latestConversation) {
        loadConversationMessages(latestConversation.id);
      }
    }
  }, [project]);

  const toggleCanvas = () => {
    setIsCanvasVisible(prev => !prev);
    // If we're showing the canvas, make sure chat is also visible
    if (!isCanvasVisible) {
      setIsChatVisible(true);
    }
  };

  const toggleChat = () => {
    setIsChatVisible(prev => !prev);
  };
  
  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      
      // Use projectService instead of direct database access
      const messagesData = await projectService.getConversationMessages(conversationId);
      
      if (!messagesData || messagesData.length === 0) {
        // Empty conversation
        setMessages([]);
        return;
      }
      
      // Transform messages from the database to the Message format used by the app
      const formattedMessages: Message[] = messagesData.map(msgContent => {
        // Create a unique ID for the message
        const msgId = uuidv4();
        
        // Set a default status for all loaded messages
        const status: MessageStatus = 'sent';
        
        return {
          id: msgId,
          content: msgContent?.content || '',
          timestamp: new Date(msgContent?.timestamp || new Date()),
          role: msgContent?.role || 'user',
          status,
          isTyping: false
        };
      });
      
      // Update the messages state
      setMessages(formattedMessages);
      
      // Set the current conversation ID if not already set
      if (currentConversationId !== conversationId) {
        setCurrentConversationId(conversationId);
      }
      
      toast.success('Conversation loaded successfully');
    } catch (error) {
      console.error('Error in loadConversationMessages:', error);
      toast.error('Failed to load conversation messages');
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Add a message and get AI response
  const addMessage = async (content: string) => {
    if (!content.trim()) return;

    // Create a user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      timestamp: new Date(),
      content: content.trim(),
      status: 'delivered'
    };

    // Add user message to state
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Add to database if we have a conversation
    if (currentConversationId) {
      try {
        // Use projectService instead of direct database access
        await projectService.addMessagesToConversation(
          currentConversationId,
          [{
            id: userMessage.id,
            content: userMessage.content,
            role: userMessage.role,
            timestamp: userMessage.timestamp
          }]
        );
      } catch (err) {
        console.error('Error saving message to database:', err);
      }
    }

    // Create a placeholder for the AI message
    const aiMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      timestamp: new Date(),
      content: '',
      status: 'sending',
      isTyping: true
    };

    // Add AI message placeholder to state
    setMessages(prevMessages => [...prevMessages, aiMessage]);
    setCurrentStreamingMessageId(aiMessage.id);
    let msg = JSON.stringify({
      messageHistory: [...messages, userMessage].map(msg => ({
        content: msg.content,
        role: msg.role
      }))
    });
    if(sections.length === 0){
    // Judge project readiness
    const judgeProjectDraftReadiness = async () => {
      try {
        const response = await fetch('/api/judge-project-draft-readiness', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageHistory: [...messages, userMessage].map(m => ({
              content: m.content,
              role: m.role
            })),
          }),
        });
        const result = await response.json();
        if (result.error) {
          throw new Error(result.error);
        }
        return result;
      } catch (error) {
        console.error('Error judging project draft readiness:', error);
        return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
      }
    };

    // Get project readiness from special endpoint
    const result = await judgeProjectDraftReadiness();
    if (result.error) {
      setCurrentStreamingMessageId(null);
      throw new Error(result.error);
    }

    // Update state with project readiness data
    const wasntReady = !projectIsReady;
    setProjectIsReady(result.projectReady);
    setProjectReadyReason(result.projectReadyReason);
    setPercentageComplete(result.percentageComplete);

    setProjectReadyRecommendations(result.projectReadyRecommendations || []);
    // setMessages(prev => [...prev, aiMessage]);
    const { projectReady, projectReadyReason, percentageComplete, projectReadyRecommendations, projectNameSuggestion, conversationNameSuggestion } = result;

    if (projectReady && wasntReady) {
      // If this is the first message, create a new project and conversation

      try {
        console.log('Creating new project and conversation for first message');
        const result = await projectService.initializeProjectWithFirstMessages(
          [...messages, userMessage],
          projectNameSuggestion || 'Project from Chat',
          conversationNameSuggestion || 'Conversation from Chat'
        );
        
        if (result) {
          console.log('Created new project and conversation:', result);
          await fetchProject(result.projectId);
          setCurrentProjectId(result.projectId);
          setCurrentConversationId(result.conversationId);
          
          // Generate project plan using the specific project ID directly
          // This avoids React state dependency issues
          console.log('Project is ready!');
          setIsCanvasVisible(true);
          
          const chatMessages = [...messages, userMessage].map(msg => ({
            content: msg.content??'',
            role: msg.role
          }));
          
          // Use the project ID directly instead of relying on React state
          const newSections = await generateProjectPlanForProjectId(chatMessages, result.projectId);
          await createMermaidPlan(newSections.map(section => section.content).join('\n'));

        } else {
          console.error('Failed to create project and conversation');
        }
      } catch (error) {
        console.error('Error creating project and conversation:', error);
      } 
    }
    msg = JSON.stringify({
      messageHistory: [...messages, userMessage].map(msg => ({
        content: msg.content,
        role: msg.role,
        projectReady,
        projectReadyReason,
        percentageComplete,
        projectReadyRecommendations
      }))
    });
  }

    const projectConsultantChat = async () => {
      try {
        setCurrentStreamingContent('');
        const response = await fetch('/api/project-consultant-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: msg,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Process as SSE (Server-Sent Events)
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body is null');

        let accumulatedContent = '';
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // Process each line in the buffer
          const lines = buffer.split('\n');
          // Keep the last line (which might be incomplete) in the buffer
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;
            
            // Handle SSE format: "data: {"chunk":"text"}"
            if (line.startsWith('data:')) {
              try {
                const jsonStr = line.substring(5).trim();
                const data = JSON.parse(jsonStr);
                
                if (data.chunk) {
                  accumulatedContent += data.chunk;
                  
                  // Update streaming content
                  setCurrentStreamingContent(accumulatedContent);
                  
                  // Update the actual message
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === aiMessage.id 
                        ? { ...msg, content: accumulatedContent } 
                        : msg
                    )
                  );
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e, 'Line:', line);
              }
            }
          }
        }
        
        // Add the AI's response to the conversation if we have a conversation ID
        if (currentConversationId) {
          try {
            await projectService.addMessagesToConversation(
              currentConversationId,
              [{
                content: accumulatedContent,
                role: 'assistant',
                timestamp: new Date(),
                id: uuidv4(),
              }]
            );
          } catch (error) {
            console.error('Error adding AI response to conversation:', error);
          }
        }
        setCurrentStreamingContent('');

        // Mark message as complete
        setCurrentStreamingMessageId(null);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: accumulatedContent, status: 'sent', isTyping: false } 
              : msg
          )
        );
      } catch (error) {
        console.error('Error in projectConsultantChat:', error);
        // Mark message as error
        setCurrentStreamingMessageId(null);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: 'Error: Failed to get response.', status: 'error', isTyping: false } 
              : msg
          )
        );
      }
    };

    projectConsultantChat();
  };


  const reset = () => {
    setMessages([]);
    setCurrentProjectId(null);
    setCurrentConversationId(null);
    setProjectIsReady(false);
    setProjectReadyReason('');
    setPercentageComplete(0);
    setProjectReadyRecommendations([]);
  };

  return (
    <MessagingContext.Provider value={{ 
      messages, 
      addMessage, 
      setMessages,
      isCanvasVisible, 
      toggleCanvas, 
      isChatVisible, 
      toggleChat, 
      currentStreamingMessageId,
      currentStreamingContent,
      projectIsReady,
      projectReadyReason,
      percentageComplete,
      projectReadyRecommendations,
      currentProjectId,
      currentConversationId,
      setCurrentProjectId,
      setCurrentConversationId,
      loadConversationMessages,
      isLoadingMessages
    }}>
      {children}
    </MessagingContext.Provider>
  );
};

export const useMessaging = () => {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
};
