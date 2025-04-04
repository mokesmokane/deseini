// import React, { useState, useEffect, useRef } from 'react';
// import * as Dialog from '@radix-ui/react-dialog';
// import * as Checkbox from '@radix-ui/react-checkbox';
// import { CheckIcon, ChevronDownIcon, ChevronRightIcon, Cross1Icon } from '@radix-ui/react-icons';
// import TreeView, { flattenTree } from 'react-accessible-treeview';
// import { useProject } from '../../contexts/ProjectContext';
// import { useParams } from 'react-router-dom';
// import { SuggestedReplies } from './SuggestedReplies';
// import ReactMarkdown from 'react-markdown';

// // Interface for our task data without extending INode
// interface TaskData {
//   name: string;
//   id: number | string;
//   parent?: number | string;
//   metadata?: { [key: string]: any };
// }

// // Interface for our tree nodes with children property
// interface TreeTaskNode extends TaskData {
//   children?: TreeTaskNode[];
// }

// interface Task {
//     id: string;
//     title: string;
//     selected: boolean;
//     subtasks: Task[];
//     expanded?: boolean;
//   }
  
// interface ChatMessage {
//     id?: string;
//     role: 'user' | 'assistant';
//     content: string;
//   }

// interface CreateChartDialogProps {
//   isOpen: boolean;
//   onClose: () => void;
//   initialTasks: TreeTaskNode[];
// }

// export function CreateChartDialog({ isOpen, onClose, initialTasks }: CreateChartDialogProps) {
//   const { project, userCharts } = useProject();
//   const { projectId } = useParams<{ projectId: string }>();
//   const [messages, setMessages] = useState<ChatMessage[]>([]);
//   const [input, setInput] = useState('');
//   const [treeData, setTreeData] = useState<TreeTaskNode[]>([]);
//   const [checkedNodes, setCheckedNodes] = useState<Set<number|string>>(new Set());
//   const [loading, setLoading] = useState(false);
//   const [isInitiating, setIsInitiating] = useState(true);
//   const [showCanvas, setShowCanvas] = useState(false);
//   const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [animationPhase, setAnimationPhase] = useState<'initial' | 'expanding-width' | 'loading' | 'complete'>('initial');
//   const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
//   const [loadingSuggestions, setLoadingSuggestions] = useState(false);
//   const [currentTaskMarkdown, setCurrentTaskMarkdown] = useState('');
//   const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  
//   // Ref to store stream buffer across reads
//   const streamBuffer = useRef('');
//   const prevLoadingRef = useRef(loading); // Ref to track previous loading state

//   // Format the project JSON representation to be sent to the API
//   const getProjectJsonRepresentation = () => {
//     if (!project) return null;
    
//     // Create a complete project representation
//     return {
//       id: projectId,
//       projectName: project.projectName || '',
//       description: project.description || '',
//       roles: project.roles || [],
//       charts: userCharts || []
//     };
//   };

//   // Function to fetch suggested replies
//   const fetchSuggestions = async (currentMessages: ChatMessage[]) => {
//     const lastMessage = currentMessages[currentMessages.length - 1];
//     // Ensure the last message is from the assistant before fetching
//     if (!lastMessage || lastMessage.role !== 'assistant' || !lastMessage.content.trim()) {
//       console.log("Skipping suggestion fetch: Last message not from assistant or empty.");
//       setSuggestedReplies([]);
//       setLoadingSuggestions(false); // Ensure loading stops
//       return;
//     }

//     // console.log("Fetching suggestions based on last assistant message:", lastMessage);
//     console.log("Fetching suggestions for messages:", currentMessages);
//     setLoadingSuggestions(true);
//     setSuggestedReplies([]); // Clear existing suggestions immediately

//     try {
//       const projectData = getProjectJsonRepresentation();
//       const response = await fetch('/api/generate-suggestions', {
//          method: 'POST',
//          headers: { 'Content-Type': 'application/json' },
//          body: JSON.stringify({ 
//              messages: currentMessages, // Send full history for context
//              projectContext: projectData 
//             }),
//       });

//       if (!response.ok) {
//            const errorText = await response.text();
//            let errorMessage = `Failed to fetch suggestions (Status: ${response.status})`;
//            try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorMessage; } catch(e) {}
//            console.error("Error fetching suggestions:", errorMessage); // Log error
//            // Don't set global error state, maybe just log it or show a subtle indicator?
//           throw new Error(errorMessage); // Throw to be caught below
//       }

//       const data = await response.json();
//       console.log("Received suggestions:", data.suggestions);
//       setSuggestedReplies(data.suggestions || []);

//     } catch (err) {
//       // console.error("Error fetching suggestions:", err);
//       console.error("Error in fetchSuggestions:", err);
//       setSuggestedReplies([]); // Clear suggestions on error
//       // Optionally show error to user?
//       // Optionally show a temporary error message near suggestions?
//     } finally {
//       setLoadingSuggestions(false); // Stop loading state regardless of outcome
//     }
//   };

//   // --- New Handler for Refresh Button ---
//   const handleRefreshSuggestions = () => {
//     console.log("Refreshing suggestions...");
//     // Call fetchSuggestions with the current message history
//     fetchSuggestions(messages);
//   };

//   // --- New function to handle parsing and state updates after stream completes ---
//   const handleStreamCompletion = (/* No markdown needed here, handled chunk by chunk */ assistantMessageId: string) => {
//     console.log("Stream complete for conversation.");
//     // setLoading(false); // setLoading is handled within processStream 'done' block for streams
//     // No task parsing needed here, this is just for conversational turns
//     // Fetch suggestions if the last message was from assistant (handled by useEffect)
//   };

//   // --- Function to handle NON-STREAMING task generation response ---
//   const handleTaskGenerationResponse = (data: any, assistantMessageId: string) => {
//     console.log("Handling direct task generation response:", data);
//     setLoading(false); // Stop loading indicator
//     setIsGeneratingTasks(false); // Task generation attempt finished

//     if (data.error) {
//         console.error("Task generation failed:", data.error, data.details);
//         setError(`Task generation failed: ${data.error}${data.details ? '. Details: ' + data.details.substring(0, 200) : ''}`);
//          // Update the assistant message to show the error
//         setMessages(prev => prev.map(msg =>
//           msg.id === assistantMessageId
//             ? { ...msg, content: `Sorry, I couldn't generate the tasks. Error: ${data.error}` }
//             : msg
//         ));
//         return;
//     }

//     if (data.tasks && data.tasks.length > 0) {
//        setTreeData(data.tasks);
//        const rootNodeForFlatten = { id: 0, name: "Project Tasks", children: data.tasks };
//        const flattenedNodes = flattenTree(rootNodeForFlatten);
//        setCheckedNodes(new Set(flattenedNodes.map(node => node.id).filter(id => id !== 0)));

//        // Update the assistant message to confirm success
//        setMessages(prev => prev.map(msg =>
//          msg.id === assistantMessageId
//            ? { ...msg, content: data.message || 'I\'ve created the task breakdown. You can review it on the right.' }
//            : msg
//        ));

//        setShowCanvas(true);
//        setAnimationPhase('expanding-width');
//        setTimeout(() => setAnimationPhase('loading'), 800);
//        setTimeout(() => setAnimationPhase('complete'), 1600);
//     } else {
//        // Handle cases where tasks are empty but no error reported
//        console.warn("Task generation succeeded but returned no tasks.");
//        setError("I generated a response, but it didn't contain any tasks.");
//        setMessages(prev => prev.map(msg =>
//          msg.id === assistantMessageId
//            ? { ...msg, content: data.message || 'I tried to generate tasks, but the result was empty.' }
//            : msg
//        ));
//     }
//   };

//   // Helper to process streamed response chunks (mostly unchanged, simplified completion)
//   const processStream = (
//       reader: ReadableStreamDefaultReader<Uint8Array>,
//       decoder: TextDecoder,
//       assistantMessageId: string
//       // isTaskGenerationStream: boolean // New parameter
//       // No longer need isTaskGenerationStream flag here
//   ) => {
//       // Accumulate markdown only if it's a task generation stream
//       // let localMarkdownAccumulator = isTaskGenerationStream ? '' : undefined;

//       reader.read().then(({ done, value }) => {
//           // --- Client-side Logging 1 ---
//           // console.log('Client: reader.read() resolved', { done }); 
//           console.log('Client: reader.read() resolved', { done });

//           if (done) {
//               console.log("Client: Stream finished.");
//               if (streamBuffer.current) {
//                  console.warn("Stream ended with unprocessed buffer:", streamBuffer.current);
//                  // Attempt final processing of buffer? Maybe not needed if events are newline terminated.
//                  // Attempt final processing? Likely not needed if using SSE double newlines reliably
//                  streamBuffer.current = '';
//               }

//               // *** If this was the task generation stream, handle completion ***
//               // if (isTaskGenerationStream && localMarkdownAccumulator !== undefined) {
//               //    handleStreamCompletion(localMarkdownAccumulator, assistantMessageId);
//               //    // setLoading(false) is handled within handleStreamCompletion
//               // } else {
//               //    // For regular conversation streams, just stop loading
//               //    setLoading(false);
//               // }
//               // Signal completion for conversation streams
//               handleStreamCompletion(assistantMessageId);
//               setLoading(false); // Stop loading when stream is done
//               return;
//           }

//           // Append new chunk to buffer
//           const decodedChunk = decoder.decode(value, { stream: true });
//           // --- Client-side Logging 2 ---
//           // console.log('Client: Decoded chunk:', decodedChunk); 
//           console.log('Client: Decoded chunk:', decodedChunk);
//           streamBuffer.current += decodedChunk;
          
//           // Process complete events (separated by double newline)
//           let eventEndIndex;
//           while ((eventEndIndex = streamBuffer.current.indexOf('\n\n')) >= 0) {
//               // --- Client-side Logging 3 ---
//               // console.log('Client: Found event boundary, processing event.'); 
//               console.log('Client: Found event boundary, processing event.');
//               const eventText = streamBuffer.current.substring(0, eventEndIndex);
//               streamBuffer.current = streamBuffer.current.substring(eventEndIndex + 2); // Remove processed event from buffer

//               if (!eventText.trim()) continue; // Skip empty events

//               let eventType = 'message';
//               let eventData = '';

//               eventText.split('\n').forEach(line => {
//                  if (line.startsWith('event:')) {
//                      eventType = line.substring(6).trim();
//                  } else if (line.startsWith('data:')) {
//                      eventData = line.substring(line.indexOf(':') + 1).trim();
//                  }
//               });
              
//               // --- Client-side Logging 4 ---
//               console.log('Client: Parsed event:', { eventType, eventData });

//               if (eventData) {
//                  try {
//                       // Check for OpenAI's DONE signal within the data itself (redundant with reader 'done')
//                       if (eventData === '[DONE]') {
//                           console.log("Received [DONE] signal in data.");
//                           continue; // Skip further processing of this DONE signal event
//                       }

//                       const parsedData = JSON.parse(eventData);

//                       // Append content chunk to the assistant message
//                       const contentChunk = parsedData.chunk;
//                       if (typeof contentChunk === 'string' && contentChunk) {
//                            setMessages(prevMessages =>
//                                prevMessages.map(msg =>
//                                    msg.id === assistantMessageId
//                                        ? { ...msg, content: msg.content + contentChunk }
//                                        : msg
//                                )
//                            );
//                       } else if (eventType === 'confirmation_needed' && parsedData.readyForTaskGeneration) {
//                           console.log("Confirmation needed event received.");
//                           setAwaitingConfirmation(true);
//                           // Suggestions might be fetched automatically now based on the last message update
//                       } else if (eventType === 'stream_error') {
//                            console.error("Stream error event received:", parsedData.error);
//                            setError(`Stream error: ${parsedData.error || 'Unknown stream error'}`);
//                            setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: `Stream Error: ${parsedData.error}` } : msg ));
//                            setLoading(false);
//                            reader.cancel();
//                            return;
//                       } else if (eventType === 'stream_end') {
//                            console.log("Stream end event received:", parsedData.message);
//                            // The 'done' flag from reader.read() is the primary completion signal
//                       }
//                       // Handle other potential custom events if needed

//                   } catch (e) {
//                       console.error(`Error parsing streamed JSON data for event type '${eventType}':`, eventData, e);
//                       setError(`Failed to parse stream data.`);
//                       setIsGeneratingTasks(false); // Reset flag on error
//                       setCurrentTaskMarkdown('');
//                       setLoading(false);
//                       reader.cancel();
//                       return;
//                   }
//               }
//               // Handle non-data events like 'stream_end' if necessary
//           } // End while loop processing events in buffer

//           // Continue reading the stream
//           // processStream(reader, decoder, assistantMessageId, isTaskGenerationStream);
//           processStream(reader, decoder, assistantMessageId);

//       }).catch(streamError => {
//           console.error("Error reading stream:", streamError);
//           setError("Failed to read response stream.");
//           setIsGeneratingTasks(false); // Reset flag on error
//           setCurrentTaskMarkdown('');
//           setLoading(false);
//           streamBuffer.current = '';
//       });
//   };

//   // Effect for initial message (uses streaming conversation endpoint)
//   useEffect(() => {
//     let isCancelled = false;
//     let currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

//     if (isOpen && isInitiating) {
//       const fetchInitialMessageStream = async () => {
//           streamBuffer.current = ''; // Clear buffer on new stream start
//           setLoading(true);
//           setError(null);
//           setMessages([]); 
//           setAwaitingConfirmation(false); 

//           const assistantMessageId = `asst-${Date.now()}`; 
//           setMessages([{ id: assistantMessageId, role: 'assistant', content: '' }]);

//           try {
//               const projectData = getProjectJsonRepresentation();
//               // const response = await fetch('/api/generate-tasks', {
//               // Use the new /api/conversation endpoint
//               const response = await fetch('/api/conversation', {
//                   method: 'POST',
//                   headers: { 'Content-Type': 'application/json' },
//                   body: JSON.stringify({
//                       // prompt: "", 
//                       prompt: "", // Empty prompt for initiation
//                       projectContext: projectData,
//                       // messages: [] 
//                       messages: []
//                   }),
//               });

//               if (!response.ok || !response.body) {
//                   // const errorText = await response.text();
//                   // let errorMessage = `Failed to initiate conversation (Status: ${response.status})`;
//                   // try {
//                   //     const errorData = JSON.parse(errorText);
//                   //     errorMessage = errorData.error || errorMessage;
//                   // } catch (jsonError) { /* Ignore if not JSON */ }
//                   // throw new Error(errorMessage);
//                   // ... (error handling as before) ...
//                   const errorText = await response.text();
//                   let errorMessage = `Failed to initiate conversation (Status: ${response.status})`;
//                   try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorMessage; } catch (e) {}
//                   throw new Error(errorMessage);
//               }
              
//               if (isCancelled) return; // Check before starting stream processing

//               currentReader = response.body.getReader();
//               const decoder = new TextDecoder();
//               // processStream(currentReader, decoder, assistantMessageId, false);
//               // Process the stream (no task generation expected here)
//               processStream(currentReader, decoder, assistantMessageId);

//           } catch (error) {
//               if (isCancelled) return; // Don't update state if cancelled
//               console.error('Error fetching initial message stream:', error);
//               const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//               setError(errorMessage);
//               setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: `Sorry, I couldn't start the conversation due to an error: ${errorMessage}` } : msg ));
//               setLoading(false);
//           } finally {
//               if (!isCancelled) {
//                  setIsInitiating(false); 
//               }
//           }
//       };
//       fetchInitialMessageStream();
//     } else if (!isOpen) {
//          // Reset state when dialog closes
//          setIsInitiating(true);
//          setMessages([]);
//          setInput('');
//          setTreeData([]);
//          setCheckedNodes(new Set());
//          setShowCanvas(false);
//          setAwaitingConfirmation(false);
//          setError(null);
//          setAnimationPhase('initial');
//          streamBuffer.current = ''; // Clear buffer on close
//     }
    
//     // Cleanup function for useEffect
//     return () => {
//         isCancelled = true;
//         if (currentReader) {
//            console.log("Cancelling stream reader on component unmount or effect re-run.");
//            currentReader?.cancel().catch((e: any) => console.error("Error cancelling reader:", e));
//            currentReader = null;
//         }
//         streamBuffer.current = ''; // Ensure buffer is cleared on cleanup
//     };
    
//   }, [isOpen, project, userCharts, projectId]); // Dependencies remain

//   // New useEffect to fetch suggestions when loading finishes
//   useEffect(() => {
//     // Check if loading has just finished
//     if (!loading && prevLoadingRef.current) {
//       const lastMessage = messages[messages.length - 1];
//       // Check if the last message is from the assistant and is not empty
//       // Also ensure we are not currently awaiting confirmation (as suggestions might not be relevant then)
//       if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content.trim() !== '' && !awaitingConfirmation) {
//         console.log("Loading finished, fetching suggestions for last assistant message:", lastMessage.id);
//         fetchSuggestions(messages); // Pass the current messages state
//       }
//     }
//     // Update the ref *after* the effect logic
//     prevLoadingRef.current = loading;
//   }, [loading, messages, awaitingConfirmation]); // Depend on loading, messages, and awaitingConfirmation

//   // handleSubmit now branches based on triggerTaskGeneration
//   const handleSubmit = async (e: React.FormEvent | null, contentOverride?: string, triggerTaskGeneration: boolean = false) => {
//       e?.preventDefault();

//       const messageContent = contentOverride ?? input;
//       if (!messageContent.trim()) return;

//       const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: 'user', content: messageContent };
//       const previousMessages = messages; // Capture history before adding new messages

//       setSuggestedReplies([]);
//       setMessages([...messages, userMessage]);
//       setInput('');
//       setLoading(true);
//       setError(null);
//       streamBuffer.current = ''; // Clear stream buffer
//       setAwaitingConfirmation(false);
//       setIsGeneratingTasks(triggerTaskGeneration); // Set flag based on intent

//       const assistantMessageId = `asst-${Date.now()}`;
//       // Add placeholder for assistant response immediately
//       setMessages(prev => [...prev, { id: assistantMessageId, role: 'assistant', content: '' }]);

//       try {
//           const projectData = getProjectJsonRepresentation();

//           if (triggerTaskGeneration) {
//               // --- Call the NON-STREAMING task creation endpoint ---
//               console.log(`Submitting request to /api/create-tasks...`);
//               const response = await fetch('/api/create-tasks', {
//                  method: 'POST',
//                  headers: { 'Content-Type': 'application/json' },
//                  body: JSON.stringify({
//                      prompt: messageContent, // User's confirmation/request
//                      projectContext: projectData,
//                      messages: previousMessages // History leading up to this request
//                  }),
//               });

//               const responseData = await response.json(); // Expect JSON directly

//               if (!response.ok) {
//                   // Throw error to be caught below, extracting message from JSON if possible
//                   throw new Error(responseData.error || `Failed to create tasks (Status: ${response.status})`);
//               }

//               // Handle the successful JSON response containing tasks
//               handleTaskGenerationResponse(responseData, assistantMessageId);
//               // Loading state is handled within handleTaskGenerationResponse

//           } else {
//               // --- Call the STREAMING conversation endpoint ---
//               console.log(`Submitting request to /api/conversation...`);
//               const response = await fetch('/api/conversation', {
//                  method: 'POST',
//                  headers: { 'Content-Type': 'application/json' },
//                  body: JSON.stringify({
//                      prompt: messageContent,
//                      projectContext: projectData,
//                      messages: previousMessages
//                  }),
//              });

//               if (!response.ok || !response.body) {
//                    // Throw error to be caught below
//                    const errorText = await response.text();
//                    let errorMessage = `Failed to get response (Status: ${response.status})`;
//                    try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorMessage; } catch (e) {}
//                    throw new Error(errorMessage);
//               }

//               const reader = response.body.getReader();
//               const decoder = new TextDecoder();
//               // Process the stream (no task generation expected)
//               processStream(reader, decoder, assistantMessageId);
//               // Loading state managed by processStream 'done' block
//           }

//       } catch (error) {
//           console.error(`Error during submit (Task Generation: ${triggerTaskGeneration}):`, error);
//           const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
//           setError(errorMessage);
//           // Update the placeholder assistant message with the error
//           setMessages(prev => prev.map(msg => msg.id === assistantMessageId ? { ...msg, content: `Sorry, I encountered an error: ${errorMessage}` } : msg));
//           setLoading(false); // Ensure loading stops on error
//           setAwaitingConfirmation(false);
//           setIsGeneratingTasks(false); // Reset flag on error
//       }
//   };

//   // Handler for selecting a suggestion
//   const handleSelectSuggestion = (suggestion: string) => {
//     // Directly call handleSubmit with the suggestion content
//     handleSubmit(null, suggestion, false); // Pass null for event, suggestion for content
//     setSuggestedReplies([]); // Clear suggestions 
//   };

//   // Create a properly typed root node for TreeView
//   const rootNode = treeData.length 
//     ? { id: 0, name: "Project Tasks", children: treeData } 
//     : { id: 0, name: "Project Tasks", children: [] };
    
//   const flattenedData = flattenTree(rootNode);
//   const defaultExpandedIds = flattenedData
//     .filter(node => node.children && node.children.length > 0)
//     .map(node => node.id);

//   const handleNodeSelect = (nodeId: number|string) => {
//     const newCheckedNodes = new Set(checkedNodes);
//     const node = flattenedData.find(n => n.id === nodeId);
    
//     if (!node) return;

//     const isCurrentlyChecked = checkedNodes.has(nodeId);

//     const updateChildren = (parentId: number|string, shouldCheck: boolean) => {
//       const children = flattenedData.filter(n => n.parent === parentId);
//       children.forEach(child => {
//         if (shouldCheck) {
//           newCheckedNodes.add(child.id);
//         } else {
//           newCheckedNodes.delete(child.id);
//         }
//         // Recursively update grandchildren
//         updateChildren(child.id, shouldCheck);
//       });
//     };

//     const updateParents = (childId: number|string) => {
//        const node = flattenedData.find(n => n.id === childId);
//        // Stop if no node found, or if it's a root node (parent is 0 or undefined/null)
//        if (!node || node.parent === undefined || node.parent === null || node.parent === 0) return; 

//        const parentId = node.parent;
//        const siblings = flattenedData.filter(n => n.parent === parentId);
       
//        // Check if ALL siblings are now checked (if the current node is being checked)
//        const allSiblingsChecked = !isCurrentlyChecked && siblings.every(sibling => newCheckedNodes.has(sibling.id));
//        // Check if ANY sibling is checked (if the current node is being unchecked)
//        const anySiblingChecked = isCurrentlyChecked && siblings.some(sibling => sibling.id !== childId && newCheckedNodes.has(sibling.id));

//        if (allSiblingsChecked) {
//            newCheckedNodes.add(parentId);
//        } else if (isCurrentlyChecked && !anySiblingChecked) {
//            // If unchecking this node means no siblings are checked, uncheck parent
//            newCheckedNodes.delete(parentId);
//        }
//        // Recursively update grandparents
//        updateParents(parentId);
//     };

//     // Update the clicked node
//     if (isCurrentlyChecked) {
//       newCheckedNodes.delete(nodeId);
//     } else {
//       newCheckedNodes.add(nodeId);
//     }
    
//     // Update children based on the new state of the clicked node
//     updateChildren(nodeId, !isCurrentlyChecked);
//     // Update parents based on the new state of the clicked node and its siblings
//     updateParents(nodeId);

//     setCheckedNodes(newCheckedNodes);
//   };

//   const getCanvasClassName = () => {
//     const baseClasses = 'transition-all duration-[800ms] ease-in-out absolute right-0 top-0';
    
//     if (!showCanvas) return `${baseClasses} opacity-0 w-0 h-0`;
    
//     switch (animationPhase) {
//       case 'expanding-width':
//         return `${baseClasses} opacity-100 w-[380px] h-0 overflow-hidden`;
//       case 'loading':
//         return `${baseClasses} opacity-100 w-[380px] h-full overflow-hidden`;
//       case 'complete':
//         return `${baseClasses} opacity-100 w-[380px] h-full`;
//       default:
//         return `${baseClasses} opacity-0 w-0 h-0`;
//     }
//   };

//   const getChatClassName = () => {
//     const baseClasses = 'transition-all duration-[800ms] ease-in-out bg-gray-50 rounded-lg p-4 border border-gray-200 h-full';
    
//     if (!showCanvas) {
//       return `${baseClasses} w-full`;
//     }
    
//     switch (animationPhase) {
//       case 'expanding-width':
//       case 'loading':
//       case 'complete':
//         return `${baseClasses} w-[calc(100%-380px)] mr-[380px]`;
//       default:
//         return `${baseClasses} w-full`;
//     }
//   };

//   const handleCreateChart = () => {
//     // Collect checked nodes (excluding the root node if it exists and is checked)
//     const selectedNodes = flattenedData.filter(node => checkedNodes.has(node.id) && node.id !== 0);
    
//     // TODO: Send selected tasks to the backend and create actual chart
//     console.log('Creating chart with selected tasks:', selectedNodes);
    
//     onClose(); // Close the dialog after initiating chart creation
//   };

//   // --- Updated handleGenerateTasks Button Click Handler ---
//   const handleGenerateTasksClick = () => {
//     console.log("Explicitly triggering task generation via handleSubmit...");
//     // Call handleSubmit, providing a prompt and setting the trigger flag
//     handleSubmit(null, "Generate the project tasks based on the conversation so far.", true);
//   };

//   return (
//     <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
//       <Dialog.Portal>
//         <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
//         <Dialog.Content 
//           className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-5 rounded-lg w-[90vw] max-w-[1200px] h-[80vh] overflow-hidden z-50" 
//           onInteractOutside={(e) => e.preventDefault()} 
//         >
//           <Dialog.Title className="text-2xl font-bold mb-4 text-gray-800 flex-shrink-0">Create a New Chart</Dialog.Title> 
          
//           <Dialog.Close asChild>
//             <button 
//               className="absolute top-3 right-3 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-md"
//               aria-label="Close"
//             >
//               <Cross1Icon />
//             </button>
//           </Dialog.Close>

//           {/* Main content area */}
//           <div className="flex-grow relative overflow-hidden flex flex-col h-[calc(100%-60px)]"> 
//               {/* Chat area */}
//               <div className={getChatClassName()}>
//                  {/* Inner container for scrolling chat messages and fixed input */}
//                  <div className="flex flex-col h-full">
//                     <div className="flex-grow overflow-y-auto mb-4 space-y-4 pr-2"> 
//                       {/* Display messages */}
//                        {messages.map((msg) => (
//                         <div
//                           key={msg.id || `fallback-${msg.role}-${msg.content.slice(0,10)}`} // More robust fallback key
//                           className={`p-3 rounded-lg w-fit max-w-[85%] ${
//                             msg.role === 'user'
//                               ? 'bg-neutral-200 ml-auto'
//                               : 'bg-gray-200 mr-auto'
//                           } ${msg.content === '' && msg.role === 'assistant' ? 'min-h-[36px] flex items-center' : ''}`} // Adjusted placeholder style
//                           style={{ wordWrap: 'break-word' }}
//                         >
//                           {/* Render content or loading dots for empty assistant message */}
//                           {msg.role === 'assistant' ? (
//                               msg.content === '' && loading ? (
//                                   <div className="flex space-x-1.5 items-center px-2"> {/* Added padding */}
//                                     <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
//                                     <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
//                                     <div className="h-1.5 w-1.5 bg-gray-500 rounded-full animate-bounce"></div>
//                                   </div>
//                               ) : (
//                                 // Use ReactMarkdown for assistant messages
//                                 <div className="prose prose-sm max-w-none">
//                                   <ReactMarkdown>
//                                     {msg.content || (msg.content === '' && !loading ? '...' : '')} 
//                                   </ReactMarkdown>
//                                 </div>
//                               )
//                           ) : (
//                             // Render user messages directly (or wrap if markdown is needed for user too)
//                             msg.content
//                           )}
//                         </div>
//                       ))}
//                       {/* Error display */}
//                        {error && !loading && (
//                         <div className="p-3 bg-red-100 text-red-600 rounded-lg mr-auto w-fit max-w-[85%]">
//                           Error: {error}
//                         </div>
//                       )}
//                     </div>
                    
//                     {/* Suggested Replies Area - Pass the new handler */}
//                     <SuggestedReplies
//                       suggestions={suggestedReplies}
//                       onSelectSuggestion={handleSelectSuggestion}
//                       onRefreshSuggestions={handleRefreshSuggestions} // Pass the handler
//                       isLoading={loadingSuggestions}
//                     />

//                     {/* Input Form - fixed at the bottom */}
//                     <form onSubmit={(e) => handleSubmit(e, undefined, false)} className="relative flex-shrink-0"> 
//                       <input
//                         type="text"
//                         value={input}
//                         onChange={(e) => { 
//                           setInput(e.target.value); 
//                           if (e.target.value.length > 0 && suggestedReplies.length > 0) {
//                             setSuggestedReplies([]); // Clear suggestions when user types
//                           }
//                         }}
//                         placeholder={awaitingConfirmation ? "Type 'yes' to confirm, or ask questions..." : "Your message..."}
//                         className="w-full p-3 pr-[130px] rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-neutral-500" 
//                         disabled={loading} 
//                         aria-label="Chat input"
//                         onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any, undefined, false); }}} // Prevent default newline on Enter
//                       />
//                       <button
//                         type="button"
//                         onClick={handleGenerateTasksClick}
//                         className="absolute right-[70px] top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded-lg disabled:bg-blue-400 hover:bg-blue-700 transition-colors text-sm"
//                         disabled={loading || awaitingConfirmation}
//                         aria-label="Generate tasks"
//                       >
//                         Generate Tasks
//                       </button>
//                       <button
//                         type="submit"
//                         className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-neutral-700 text-white p-2 rounded-lg disabled:bg-neutral-400 hover:bg-neutral-800 transition-colors" 
//                         disabled={loading || !input.trim()}
//                         aria-label="Send message"
//                       >
//                         Send
//                       </button>
//                     </form>
//                  </div>
//               </div>
              
//               {/* Task canvas */}
//               <div className={getCanvasClassName()}>
//                 <div className="h-full bg-gray-50 rounded-lg p-4 border border-gray-200 overflow-y-auto flex flex-col"> 
//                   <h3 className="text-lg font-semibold mb-3 flex-shrink-0">Task Breakdown</h3> 
                  
//                   <div className="flex-grow overflow-y-auto mb-4 pr-1"> 
//                     {flattenedData.length > 1 ? ( 
//                       <TreeView 
//                         data={flattenedData}
//                         aria-label="Project task tree"
//                         nodeRenderer={({ // Adjusted rendering logic here
//                           element,
//                           isBranch,
//                           isExpanded,
//                           // isSelected, // Not used directly
//                           getNodeProps,
//                           level, 
//                         }) => (
//                           <div 
//                             {...getNodeProps()} // Removed onClick from here 
//                             style={{ paddingLeft: `${(level -1) * 20}px` }} 
//                             className="flex items-center py-1.5 hover:bg-gray-100 rounded" 
//                           >
//                              {/* Expansion Toggle */} 
//                             <div className="w-5 h-5 mr-1 flex items-center justify-center flex-shrink-0"> {/* Fixed width container */}
//                                {isBranch && (
//                                 <button 
//                                   onClick={(e) => { 
//                                       e.stopPropagation(); 
//                                       // TODO: Implement expansion state management 
//                                       console.log("Toggle expand:", element.id); 
//                                   }} 
//                                   className="p-0.5 rounded hover:bg-gray-200" 
//                                   aria-label={isExpanded ? 'Collapse node' : 'Expand node'}
//                                 >
//                                   {isExpanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
//                                 </button>
//                                )}
//                             </div>
                            
//                             {/* Checkbox */}
//                             <Checkbox.Root
//                               className="flex h-4 w-4 appearance-none items-center justify-center rounded bg-white border border-gray-300 mr-2 flex-shrink-0"
//                               checked={checkedNodes.has(element.id)}
//                               onCheckedChange={() => handleNodeSelect(element.id)}
//                               id={`checkbox-${element.id}`}
//                               aria-labelledby={`label-${element.id}`}
//                             >
//                               <Checkbox.Indicator>
//                                 <CheckIcon className="h-3.5 w-3.5 text-neutral-700" />
//                               </Checkbox.Indicator>
//                             </Checkbox.Root>
                            
//                              {/* Label (make clickable for selection) */} 
//                             <span 
//                               id={`label-${element.id}`} 
//                               className="text-sm flex-grow truncate cursor-pointer" 
//                               onClick={() => handleNodeSelect(element.id)} // Select on label click
//                             >
//                                {element.name}
//                             </span>
//                           </div>
//                         )}
//                       />
//                     ) : (
//                        <div className="text-gray-500 italic text-sm text-center py-4">
//                           {animationPhase === 'complete' ? "No tasks generated yet." : "Loading tasks..."}
//                        </div>
//                     )}
//                   </div>
                  
//                   <div className="mt-auto flex-shrink-0"> 
//                     <button
//                       onClick={handleCreateChart}
//                       className="w-full bg-neutral-700 text-white py-2 rounded-lg hover:bg-neutral-800 transition-colors disabled:bg-neutral-400"
//                       disabled={checkedNodes.size === 0 || flattenedData.length <= 1} 
//                     >
//                       Create Chart from Selected Tasks
//                     </button>
//                   </div>
//                 </div>
//               </div>
//           </div>
//         </Dialog.Content>
//       </Dialog.Portal>
//     </Dialog.Root>
//   );
// }