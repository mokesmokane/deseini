// import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
// import { Project, Chart, TreeTaskNode } from '../types';
// import { toast } from 'react-hot-toast';
// import { sendConversationMessage, generateMessageSuggestions } from '../services/messagingService';
// import { Message } from '../components/landing/types';

// // Add EventSourcePolyfill if targeting environments without native EventSource or needing headers
// // For simplicity, assuming native EventSource is available

// interface MessagesContextProps {
//   messages: Message[];
//   loading: boolean;
//   error: string | null;
//   suggestedReplies: string[];
//   loadingSuggestions: boolean;
//   isGeneratingTasks: boolean;
//   input: string;
//   isInitialized: boolean;
//   initializeChat: () => void;
//   setInput: (input: string) => void;
//   handleSendMessage: (e: React.FormEvent | null, contentOverride?: string) => Promise<void>;
//   handleSelectSuggestion: (suggestion: string) => void;
//   handleEditSuggestion: (suggestion: string) => void;
//   handleRefreshSuggestions: () => void;
//   handleGenerateTasksClick: () => Promise<void>;
// }

// interface MessagesProviderProps {
//   children: ReactNode;
//   projectId: string;
//   project: Project | null;
//   userCharts: Chart[];
//   onInitiateTaskGeneration: (messages: Message[]) => Promise<TreeTaskNode[] | null>;
// }

// const MessagesContext = createContext<MessagesContextProps | undefined>(undefined);

// export function MessagesProvider({ 
//   children, 
//   projectId, 
//   project, 
//   userCharts, 
//   onInitiateTaskGeneration 
// }: MessagesProviderProps) {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [input, setInput] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);

//   const streamBuffer = useRef('');
//   const inputRef = useRef<HTMLInputElement>(null);

//   const projectIdRef = useRef(projectId);
//   const projectRef = useRef(project);
//   const userChartsRef = useRef(userCharts);

//   useEffect(() => {
//     projectIdRef.current = projectId;
//     projectRef.current = project;
//     userChartsRef.current = userCharts;
//   }, [projectId, project, userCharts]);

//   const getProjectJsonRepresentation = () => {
//     const currentProject = projectRef.current;
//     if (!currentProject) return null;
//     return {
//       id: projectIdRef.current,
//       projectName: currentProject.projectName || '',
//       description: currentProject.description || '',
//       roles: currentProject.roles || [],
//       charts: userChartsRef.current || []
//     };
//   };

//   // No longer auto-initializes on mount - requires explicit initialization
//   const fetchInitialMessage = async () => {
//     if (loading) return; // Prevent multiple initializations
    
//     setLoading(true);
//     setError(null);
//     setMessages([]); // Start fresh

//     const assistantMessageId = `asst-init-${Date.now()}`;
//     setMessages([{ id: assistantMessageId, role: 'assistant', content: '', timestamp: new Date(), status: 'sent' }]);
//     streamBuffer.current = '';

//     let reader: ReadableStreamDefaultReader<string> | null = null;
//     let isMounted = true;

//     try {
//       const projectData = getProjectJsonRepresentation();
//       const response = await sendConversationMessage({ prompt: null, projectContext: projectData, messages: [] });

//       if (!response.ok) {
//         const errorText = await response.text();
//         let errorMessage = `Failed to initiate conversation (Status: ${response.status})`;
//         try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorMessage; } catch(e) {}
//         throw new Error(errorMessage);
//       }

//       if (!response.body) {
//         throw new Error("Response body is null, cannot read stream.");
//       }

//       reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

//       // eslint-disable-next-line no-constant-condition
//       while (isMounted && reader) {
//         const { value, done } = await reader.read();
//         if (done) {
//           handleStreamCompletion(); // Trigger suggestion fetch etc.
//           break;
//         }

//         const lines = value.split('\n\n');
//         for (const line of lines) {
//           if (line.startsWith('data:')) {
//               try {
//                 const jsonString = line.substring(5).trim();
//                 if (jsonString) {
//                     const data = JSON.parse(jsonString);
//                     if (data.chunk) {
//                       streamBuffer.current += data.chunk;
//                       if (isMounted) {
//                           setMessages(prev => prev.map(msg => 
//                             msg.id === assistantMessageId 
//                               ? { ...msg, content: streamBuffer.current, requiresAction: false } 
//                               : msg
//                           ));
//                       }
//                     }
//                 }
//               } catch (e) {
//                 console.error('Error parsing initial stream data chunk:', line, e);
//               }
//           } else if (line.startsWith('event: confirmation_needed')) {
//                if (isMounted) {
//                     setMessages(prev => prev.map(msg => 
//                       msg.id === assistantMessageId 
//                           ? { ...msg, content: streamBuffer.current, requiresAction: true } 
//                           : msg
//                     ));
//                     setLoadingSuggestions(false);
//                     setSuggestedReplies([]); 
//                }
//           } else if (line.startsWith('event: stream_end')) {
//               if (isMounted) {
//                    setMessages(prev => prev.map(msg => 
//                       msg.id === assistantMessageId 
//                       ? { ...msg, content: streamBuffer.current, requiresAction: false } 
//                       : msg
//                   ));
//               }
//               handleStreamCompletion();
//                // No break needed, done will be true next
//           } else if (line.startsWith('event: stream_error')) {
//               console.error('Received stream_error event for initial message.');
//               try {
//                  const jsonString = line.substring(line.indexOf('data:') + 5).trim();
//                  const errorData = JSON.parse(jsonString);
//                  throw new Error(errorData.error || 'Initial conversation stream failed');
//               } catch (e) {
//                  console.error('Error parsing initial stream_error data:', line, e);
//                  throw new Error('Initial conversation stream failed with unparseable error event.');
//               }
//           }
//         }
//       }

//     } catch (err) {
//       console.error("Error fetching initial message:", err);
//       const message = err instanceof Error ? err.message : 'An unknown error occurred';
//       if (isMounted) {
//            setError(message);
//            toast.error(`Failed to start conversation: ${message}`);
//            setMessages([{ id: `err-${Date.now()}`, role: 'system', content: `Error: ${message}` }]);
//       }
//     } finally {
//       if (isMounted) {
//         setLoading(false);
//         setIsInitialized(true);
//       }
//     }

//     return () => {
//       isMounted = false;
//       if (reader) {
//         reader.cancel().catch(console.error);
//       }
//     };
//   };

//   // Function to initialize the chat when needed
//   const initializeChat = () => {
//     if (!isInitialized && !loading) {
//       fetchInitialMessage();
//     }
//   };


//   const handleStreamCompletion = () => {
    
//     // Implementing Single Responsibility Principle:
//     // This function now handles only stream completion concerns
//     // and properly resets tracking state to prevent race conditions
    
//     // Reset state tracking so that the next message stream doesn't get affected
//     // by leftover state from previous interactions
//     suggestionsRequestInProgressRef.current = false;
    
//     // We don't reset lastSuggestionsMessageCountRef here because our debounced effect
//     // will handle triggering suggestions with appropriate checks
//   };

//   const handleSendMessage = async (e: React.FormEvent | null, contentOverride?: string) => {
//     e?.preventDefault();

//     const messageContent = contentOverride ?? input;
//     if (!messageContent.trim()) return;

//     const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: messageContent, timestamp: new Date(), status: 'sent' };
//     const updatedMessagesWithUser = [...messages, userMessage];

//     setSuggestedReplies([]);
//     setMessages(updatedMessagesWithUser);
//     setInput('');
//     setLoading(true);
//     setError(null);
    
//     const assistantMessageId = `asst-${Date.now()}`;
//     setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]); 
//     streamBuffer.current = '';
    
//     try {
//       const projectData = getProjectJsonRepresentation();
//       const response = await sendConversationMessage({ prompt: messageContent, projectContext: projectData, messages });

//       if (!response.ok) {
//         const errorText = await response.text();
//         let errorMessage = `Failed to send message (Status: ${response.status})`;
//         try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorMessage; } catch(e) {}
//         throw new Error(errorMessage);
//       }

//       if (!response.body) {
//         throw new Error("Response body is null, cannot read stream.");
//       }

//       const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      
//       // eslint-disable-next-line no-constant-condition
//       while (true) {
//         const { value, done } = await reader.read();
//         if (done) {
//            handleStreamCompletion(); 
//            break;
//         }

//         const lines = value.split('\n\n');
//         for (const line of lines) {
//           if (line.startsWith('data:')) {
//               try {
//                 const jsonString = line.substring(5).trim();
//                 if (jsonString) {
//                     const data = JSON.parse(jsonString);
//                     if (data.chunk) {
//                       streamBuffer.current += data.chunk;
//                       setMessages(prev => prev.map(msg => 
//                         msg.id === assistantMessageId 
//                           ? { ...msg, content: streamBuffer.current, requiresAction: false } 
//                           : msg
//                       ));
//                     }
//                 }
//               } catch (e) {
//                 console.error('Error parsing conversation stream data chunk:', line, e);
//               }
//           } else if (line.startsWith('event: confirmation_needed')) {
//               setMessages(prev => prev.map(msg => 
//                   msg.id === assistantMessageId 
//                       ? { ...msg, content: streamBuffer.current, requiresAction: true } 
//                     : msg
//               ));
//               setLoadingSuggestions(false);
//               setSuggestedReplies([]); 
//           } else if (line.startsWith('event: stream_end')) {
//               setMessages(prev => prev.map(msg => 
//                   msg.id === assistantMessageId 
//                   ? { ...msg, content: streamBuffer.current, requiresAction: false } 
//                   : msg
//               ));
//               handleStreamCompletion();
//           } else if (line.startsWith('event: stream_error')) {
//               console.error('Received stream_error event for conversation.');
//               try {
//                  const jsonString = line.substring(line.indexOf('data:') + 5).trim();
//                  const errorData = JSON.parse(jsonString);
//                  throw new Error(errorData.error || 'Conversation stream processing failed');
//               } catch (e) {
//                  console.error('Error parsing stream_error data for conversation:', line, e);
//                  throw new Error('Conversation stream failed with unparseable error event.');
//               }
//           }
//         }
//       }

//     } catch (err) {
//       console.error("Error sending message or processing stream:", err);
//       const message = err instanceof Error ? err.message : 'An unknown error occurred';
//       setError(message);
//       toast.error(message);
//       setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   useEffect(() => {
//     // Debounce suggestions fetching to prevent multiple calls
//     const suggestionsDebounceTimeout = 500; // 500ms debounce
//     let timeoutId: NodeJS.Timeout | null = null;
    
//     if (messages.length > 0) {
//       const lastMessage = messages[messages.length - 1];
//       if (!loading && lastMessage.role === 'assistant' && lastMessage.content && !lastMessage.requiresAction) {
        
//         // Clear any existing timeout
//         if (timeoutId) {
//           clearTimeout(timeoutId);
//         }
        
//         // Schedule a new suggestions fetch with debounce
//         timeoutId = setTimeout(() => {
//           fetchSuggestions(messages);
//           }, suggestionsDebounceTimeout);
//         } else {
//          if (suggestedReplies.length > 0) {
//              setSuggestedReplies([]);
//          }
//       }
//     }
    
//     // Cleanup function to clear timeout if component unmounts or dependencies change
//     return () => {
//       if (timeoutId) {
//         clearTimeout(timeoutId);
//       }
//     };
//   }, [messages, loading]);

//   const handleSelectSuggestion = (suggestion: string) => {
//     handleSendMessage(null, suggestion);
//   };

//   const handleEditSuggestion = (suggestion: string) => {
//     setInput(suggestion);
//     inputRef.current?.focus();
//   };
  
//   const handleGenerateTasksClick = async (): Promise<void> => {
//     setIsGeneratingTasks(true);
//     setError(null);
//     try {
//         const generatedTasks = await onInitiateTaskGeneration(messages);
//         if (generatedTasks) {
//         } else {
//         }
//     } catch (error) {
//         const message = error instanceof Error ? error.message : 'Unknown error initiating task generation.';
//         setError(message);
//         toast.error(message);
//     } finally {
//         setIsGeneratingTasks(false);
//     }
//   };

//   const value = {
//     messages,
//     loading,
//     error,
//     suggestedReplies,
//     loadingSuggestions,
//     isGeneratingTasks,
//     input,
//     isInitialized,
//     initializeChat,
//     setInput,
//     handleSendMessage,
//     handleSelectSuggestion,
//     handleEditSuggestion,
//     handleRefreshSuggestions,
//     handleGenerateTasksClick
//   };

//   return (
//     <MessagesContext.Provider value={value}>
//       {children}
//     </MessagesContext.Provider>
//   );
// }

// export function useMessages() {
//   const context = useContext(MessagesContext);
//   if (context === undefined) {
//     throw new Error('useMessages must be used within a MessagesProvider');
//   }
//   return context;
// }