import { createContext, useContext, useState, ReactNode } from 'react';
import { Message } from './types';

interface MessagingContextProps {
  messages: Message[];
  addMessage: (content: string) => void;
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

  const addMessage = async (content: string) => {
    // Add user's message immediately 
    const userMessage: Message = {
      id: `${Date.now()}-me`,
      content,
      timestamp: new Date(),
      role: 'user',
      status: 'sending',
    };
    setMessages(prev => [...prev, userMessage]);
    //call judge-project-draft-readiness

    const judgeProjectDraftReadiness = async () => {
      try {
        const response = await fetch('/api/judge-project-draft-readiness', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageHistory: [...messages, userMessage].map(msg => ({
              content: msg.content,
              role: msg.role
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

    const resultPromise = judgeProjectDraftReadiness();

    const messageId = `${Date.now()}-ai`;
    const aiMessage: Message = {
      id: messageId,
      content: '',
      timestamp: new Date(),
      role: 'assistant',
      status: 'sending',
      isTyping: true,
    };
    setMessages(prev => [...prev, aiMessage]);
    
    // Start streaming process
    setCurrentStreamingMessageId(messageId);
    setCurrentStreamingContent('');

    const result = await resultPromise;
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
    const { projectReady, projectReadyReason, percentageComplete, projectReadyRecommendations } = result;
    console.log('Project readiness result:', result);
    console.log('Project readiness:', projectReady);
    console.log('Project readiness reason:', projectReadyReason);
    console.log('Project readiness percentage:', percentageComplete);
    console.log('Project readiness recommendations:', projectReadyRecommendations);
    
    if (projectReady && wasntReady) {
      console.log('Project is ready!');
      setIsCanvasVisible(true);
    }
    const projectConsultantChat = async () => {
      try {
        const response = await fetch('/api/project-consultant-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messageHistory: [...messages, userMessage].map(msg => ({
              content: msg.content,
              role: msg.role
            })),
            projectReady,
            projectReadyReason,
            percentageComplete,
            projectReadyRecommendations
          }),
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
                      msg.id === messageId 
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
        
        // Finalize message when stream is complete
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, isTyping: false, status: 'delivered' } 
              : msg
          )
        );
        setCurrentStreamingMessageId(null);
        return { content: accumulatedContent };
      } catch (error) {
        console.error('Error in project-consultant-chat:', error);
        setCurrentStreamingMessageId(null);
        return { error: error instanceof Error ? error.message : 'An unknown error occurred' };
      }
    };

    await projectConsultantChat();
  };

  return (
    <MessagingContext.Provider value={{ 
      messages, 
      addMessage, 
      isCanvasVisible, 
      toggleCanvas,
      isChatVisible,
      toggleChat,
      currentStreamingMessageId,
      currentStreamingContent,
      projectIsReady,
      projectReadyReason,
      percentageComplete,
      projectReadyRecommendations
    }}>
      {children}
    </MessagingContext.Provider>
  );
};

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}
