import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { editProjectChat as editProjectChatService } from '../../services/projectPlanService';
import { Message, MessageStatus } from '../../components/landing/types';
import { useDraftMarkdown } from '../DraftMarkdownProvider';
import { projectService } from '@/services/projectService';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useProject } from '../ProjectContext';
import { useDraftPlanMermaidContext } from '../DraftPlan/DraftPlanContextMermaid';
import { getPlanToGanttStream } from '../../services/planConversionService';
import { streamToStreams, streamToStringStream } from '../../utils/stream';
import {SectionData } from '../../components/landing/types';
import { fetchApi } from '@/utils/api';
import { useUpdateBlock } from '../MessageBlocksContext';
import { Quote } from '../../components/landing/types';

interface MessagingContextProps {
  messages: Message[];
  addMessage: (content: string, quotes?: Quote[]) => void;
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
  loadConversation: (conversationId: string) => Promise<void>;
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
  const {project, projectConversations, setProject} = useProject();
  const { createProjectPlan, updateProjectPlan, sections } = useDraftMarkdown();
  const { createPlanFromMarkdownStream: createMermaidPlan, createPlanFromPureMarkdownStream, getMermaidMarkdown } = useDraftPlanMermaidContext();
  const {updateBlock} = useUpdateBlock();

  // Load conversation messages when conversation ID changes
  // useEffect(() => {
  //   if (currentConversationId) {
  //     loadConversationMessages(currentConversationId);
  //   }
  // }, [currentConversationId]);

  const loadConversation = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      setCurrentConversationId(conversationId);
      await loadConversationMessages(conversationId);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

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
  
  const projectConsultantChat = async (messageHistory: Message[], projectReady: boolean, projectReadyReason: string, percentageComplete: number, projectReadyRecommendations: string[], aiMessage: Message, projectId?: string, conversationId?: string) => {
    try {
      const msg = JSON.stringify({
        messageHistory, 
        projectReady,
        projectReadyReason,
        percentageComplete,
        projectReadyRecommendations
      });
      setCurrentStreamingContent('');
      const response = await fetchApi('/api/project-consultant-chat', {
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

      try {
        // Use the new streaming API
        const stringReader = streamToStringStream(reader);
        const { mainStream, codeBlockStreams } = streamToStreams<string>(stringReader, projectId ? ["projectplan", "ProjectPlan"] : []);
        
        // Subscribe each code block stream to MessageBlocksContext
        const streams: Record<string, ReadableStream<string>> = {};
        Object.entries(codeBlockStreams).forEach(([lang, stream]) => {
          const [stream1,stream2] = stream.tee();
          streams[lang] = stream1;
          updateBlock(lang, aiMessage.id, stream2);
        });

        // Process the main content stream
        const mainReader = mainStream.getReader();
        let accumulatedMainContent = '';
        
        // Check if we have a ProjectPlan stream and set up a reader for it if it exists
        const projectPlanStream = streams["projectplan"] || streams["ProjectPlan"];
        let newSections: null | Promise<SectionData[]> = null;

        if (projectPlanStream && projectId) {
          newSections = createProjectPlan(streams["projectplan"], projectId, aiMessage.id);
        }
            
        // Process the main stream
        while (true) {
          const { done, value } = await mainReader.read();
          if (done) break;
          // Update accumulated content
          accumulatedMainContent += value;
          // Update the UI with the latest content
          setCurrentStreamingContent(accumulatedMainContent);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: accumulatedMainContent } 
                : msg
            )
          );
          
          if (accumulatedMainContent.includes('[[CREATE_PROJECT_GANTT]]') && newSections) {
            const stream = await getPlanToGanttStream((await newSections).map(section => section.content).join('\n'));
            const result = await createMermaidPlan(stream);
            if(result){
              //replace the [[CREATE_PROJECT_GANTT]] with the result
              accumulatedMainContent = accumulatedMainContent.replace('[[CREATE_PROJECT_GANTT]]', `\n\`\`\`mermaid\n${result.allMermaidSyntax || ''}\n\`\`\``);
            }
          }
        }

        setCurrentStreamingContent('');
        // Mark message as complete
        setCurrentStreamingMessageId(null);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: accumulatedMainContent, status: 'sent', isTyping: false } 
              : msg
          )
        );

        
        // Add the AI's response to the conversation if we have a conversation ID
        if (conversationId) {
          try {
            await projectService.addMessagesToConversation(
              conversationId,
              [{
                content: accumulatedMainContent,
                role: 'assistant',
                timestamp: new Date(),
                id: uuidv4(),
              }
              ]
            );
          } catch (error) {
            console.error('Error adding AI response to conversation:', error);
          }
        }
        
      } catch (error) {
        console.error('Error processing streams:', error);
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
  
const editProjectChat = async (messageHistory: Message[], aiMessage: Message, conversationId: string, projectMarkdown: string, mermaidMarkdown: string) => {
    try {
      setCurrentStreamingContent('');
      const response = await editProjectChatService({
        messageHistory,
        projectMarkdown,
        mermaidMarkdown
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Process as SSE (Server-Sent Events)
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');

        // Use the new streaming API
        const stringReader = streamToStringStream(reader);
        const { mainStream, codeBlockStreams } = streamToStreams<string>(stringReader, ["EditedProjectPlan", "EditedMermaidMarkdown"]);
        const streams: Record<string, ReadableStream<string>> = {};
        // Subscribe each code block stream to MessageBlocksContext
        Object.entries(codeBlockStreams).forEach(([lang, stream]) => {
          const [stream1,stream2] = stream.tee();
          streams[lang] = stream1;
          updateBlock(lang, aiMessage.id, stream2);
        });

        const mermaidMarkdownStream = streams["editedmermaidmarkdown"] || streams["EditedMermaidMarkdown"];
        const projectPlanStream = streams["editedprojectplan"] || streams["EditedProjectPlan"];
        
        if (mermaidMarkdownStream) {
          console.log('mermaidMarkdownStreamMOKES', mermaidMarkdownStream);
          createPlanFromPureMarkdownStream(mermaidMarkdownStream);
        }

        if (projectPlanStream) {
          console.log('projectPlanStreamMOKES', projectPlanStream);
          updateProjectPlan(projectPlanStream, project?.id || '', aiMessage.id);  
        }

        // Process the main content stream
        const mainReader = mainStream.getReader();
        let accumulatedMainContent = '';

            
        // Process the main stream
        while (true) {
          const { done, value } = await mainReader.read();
          if (done) break;
          // Update accumulated content
          accumulatedMainContent += value;
          // Update the UI with the latest content
          setCurrentStreamingContent(accumulatedMainContent);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, content: accumulatedMainContent } 
                : msg
            )
          );
          
        }

        setCurrentStreamingContent('');
        // Mark message as complete
        setCurrentStreamingMessageId(null);
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: accumulatedMainContent, status: 'sent', isTyping: false } 
              : msg
          )
        );

    
        await projectService.addMessagesToConversation(
          conversationId,
          [{
            content: accumulatedMainContent,
            role: 'assistant',
            timestamp: new Date(),
            id: uuidv4(),
          }
          ]
        );
    } catch (error) {
      console.error('Error in editProjectChat:', error);
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

    // Judge project readiness
  const judgeProjectDraftReadiness = async (messages: Message[], userMessage: Message) => {
      try {
        const response = await fetchApi('/api/judge-project-draft-readiness', {
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
        return {
          projectReady: result.projectReady,
          projectReadyReason: result.projectReadyReason,
          percentageComplete: result.percentageComplete,
          projectReadyRecommendations: result.projectReadyRecommendations,
          projectNameSuggestion: result.projectNameSuggestion,
          conversationNameSuggestion: result.conversationNameSuggestion
        };
      } catch (error) {
        console.error('Error judging project draft readiness:', error);
        return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
      }
  };

  const preProjectReply = async (messages: Message[], userMessage: Message, aiMessage: Message) => {
    const result = await judgeProjectDraftReadiness(messages, userMessage);
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
      // Since we've checked for the error case above, we can safely assert the type now
      const { projectReady, projectReadyReason, percentageComplete, projectReadyRecommendations, projectNameSuggestion, conversationNameSuggestion } = result as {
        projectReady: boolean; 
        projectReadyReason: string; 
        percentageComplete: number; 
        projectReadyRecommendations: string[]; 
        projectNameSuggestion: string; 
        conversationNameSuggestion: string;
      };

      if (projectReady && wasntReady) {
        // If this is the first message, create a new project and conversation

        try {
          const result = await projectService.initializeProjectWithFirstMessages(
            [...messages, userMessage],
            projectNameSuggestion || 'Project from Chat',
            conversationNameSuggestion || 'Conversation from Chat'
          );
          
          if (result) {
            setProject(result.project);
            setCurrentProjectId(result.project.id);
            setCurrentConversationId(result.conversationId);
            
            // Generate project plan using the specific project ID directly
            // This avoids React state dependency issues
            setIsCanvasVisible(true);
            
            await projectConsultantChat(messages, projectReady, projectReadyReason, percentageComplete, projectReadyRecommendations, aiMessage, result.project.id, result.conversationId);
          } else {
            console.error('Failed to create project and conversation');
          }
        } catch (error) {
          console.error('Error creating project and conversation:', error);
        }
      } else {
        await projectConsultantChat([...messages, userMessage], projectReady, projectReadyReason, percentageComplete, projectReadyRecommendations, aiMessage);
      }
  };

  const postProjectReply = async (messages: Message[], userMessage: Message, aiMessage: Message, conversationId: string, projectMarkdown: string, mermaidMarkdown: string) => {
    
    try {
        editProjectChat([...messages, userMessage], aiMessage, conversationId, projectMarkdown, mermaidMarkdown);
      } catch (error) {
        console.error('Error creating project and conversation:', error);
      }
  };

  // Add a message and get AI response
  const addMessage = async (content: string, quotes?: Quote[]) => {
    if (!content.trim()) return;
    // Create a user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      timestamp: new Date(),
      content: content.trim(),
      quotes,
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
            timestamp: userMessage.timestamp,
            quotes: userMessage.quotes
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
    
    if(sections.length === 0){
      // Get project readiness from special endpoint
      preProjectReply(messages, userMessage, aiMessage);
    } else if(currentConversationId) {
      //get project markdown
      const projectMarkdown = sections.map(section => section.content).join('\n\n');
      //get mermaid markdown
      const mermaidMarkdown = getMermaidMarkdown();
      postProjectReply(messages, userMessage, aiMessage, currentConversationId, projectMarkdown, mermaidMarkdown);
    } 
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
      loadConversation,
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
