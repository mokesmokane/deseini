// import React, { useEffect, useRef } from 'react';
// import { useMessages } from '../contexts/MessagesContext';
// import { useProjectPlan } from '../contexts/ProjectPlanContext';

// /**
//  * This component doesn't render anything visible but connects
//  * MessagesContext and ProjectPlanContext, triggering plan generation
//  * when new user messages are added.
//  * 
//  * Handles race conditions by tracking the last processed user message
//  * and ensuring all unprocessed user messages are handled.
//  * Prevents triggering during message streaming by monitoring loading state.
//  * Also triggers plan generation on initial render before any messages exist.
//  */
// const ProjectPlanTrigger: React.FC = () => {
//   const { messages, loading } = useMessages();
//   const { generateProjectPlan } = useProjectPlan();
//   const lastProcessedUserMessageIndexRef = useRef(-1);
//   const previousLoadingStateRef = useRef(false);
//   const initialTriggerRef = useRef(false);
  
//   // Trigger plan generation on initial mount, before any messages exist
//   useEffect(() => {
//     if (!initialTriggerRef.current) {
//       console.log('[ProjectPlanTrigger] Initial trigger - generating plan with empty message list');
//       generateProjectPlan([]);
//       initialTriggerRef.current = true;
//     }
//   }, [generateProjectPlan]);
  
//   // Trigger plan generation when messages change or loading state changes
//   useEffect(() => {
//     // Only process messages when:
//     // 1. Loading has just finished (loading was true, now it's false) OR
//     // 2. We're not currently loading and have unprocessed user messages
//     const loadingJustFinished = previousLoadingStateRef.current && !loading;
//     previousLoadingStateRef.current = loading;
    
//     // If we're still loading (streaming in progress), don't process
//     if (loading && !loadingJustFinished) return;
    
//     console.log('[ProjectPlanTrigger] Messages changed, current count:', messages.length, 'Loading:', loading);
    
//     // Find the index of the last user message
//     let lastUserMessageIndex = -1;
//     for (let i = messages.length - 1; i >= 0; i--) {
//       if (messages[i].role === 'user') {
//         lastUserMessageIndex = i;
//         break;
//       }
//     }
    
//     // If there's no user message or we've already processed the last user message, do nothing
//     if (lastUserMessageIndex === -1 || lastUserMessageIndex <= lastProcessedUserMessageIndexRef.current) {
//       return;
//     }
    
//     console.log('[ProjectPlanTrigger] Processing user messages from index', 
//       lastProcessedUserMessageIndexRef.current + 1, 'to', lastUserMessageIndex);
    
//     // Process all unprocessed user messages up to the last one
//     let userMessagesFound = false;
//     for (let i = lastProcessedUserMessageIndexRef.current + 1; i <= lastUserMessageIndex; i++) {
//       if (messages[i].role === 'user') {
//         userMessagesFound = true;
//         console.log('[ProjectPlanTrigger] Processing user message at index', i);
//       }
//     }
    
//     // Update the last processed index and trigger plan generation
//     if (userMessagesFound) {
//       lastProcessedUserMessageIndexRef.current = lastUserMessageIndex;
//       console.log('[ProjectPlanTrigger] Triggering plan generation with updated messages');
//       generateProjectPlan(messages.slice(0, lastUserMessageIndex + 1));
//     }
//   }, [messages, generateProjectPlan, loading]);

//   // This component doesn't render anything
//   return null;
// };

// export default ProjectPlanTrigger;
