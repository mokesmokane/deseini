import React, { useEffect, useState } from 'react';
import { Message } from '../types';
import { MessageSection } from './MessageSection';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { useDraftMarkdown } from '../DraftMarkdownProvider';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
import styles from './ChatMessage.module.css';
import { SectionUpdateState } from '../types';
// import Generate from './Generate';
import { StreamingPlan } from './StreamingPlanSummary/StreamingPlan';

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const { currentStreamingMessageId, currentStreamingContent } = useMessaging();
  const { stateUpdates, setCurrentSectionId  } = useDraftMarkdown();
  const { sections, newSummary, sketchSummary } = useDraftPlanMermaidContext();
  const isUser = message.role === 'user';
  const isStreaming = !isUser && currentStreamingMessageId === message.id;
  
  // Use a local state for smoother animation while streaming
  const [displayContent, setDisplayContent] = useState(message.content);
  
  // Update the display content when streaming or message changes
  useEffect(() => {
    if (isStreaming) {
      setDisplayContent(currentStreamingContent);
    } else {
      setDisplayContent(message.content);
    }
  }, [isStreaming, currentStreamingContent, message.content]);
  
  const renderContentWithProjectPlan = (content: string = '') => {
    const marker = '[[CREATE_PROJECT_GANTT]]';
    const hasPlan = Array.isArray(sections) && sections.length > 0;

    // Split by the marker to allow text before/after
    const parts = content.split(marker);
    const nodes: React.ReactNode[] = [];

    parts.forEach((part, idx) => {
      // Look for ```ProjectPlan ... ```
      const openFence = '```ProjectPlan\n';
      const startIndex = part.indexOf(openFence);
      if (startIndex !== -1) {
        // Text before the code block
        if (startIndex > 0) {
          nodes.push(<span key={`before-plan-${idx}`}>{part.substring(0, startIndex)}</span>);
        }
        // Extract code block
        const afterOpen = part.substring(startIndex + openFence.length);
        const closeFencePos = afterOpen.indexOf('```');
        if (closeFencePos !== -1) {
          // Code block extraction logic here
        } else {
          // Handle case when closing fence is not found
        }
        // Render project plan block
        nodes.push(
          <pre
            key={`plan-${idx}`}
            className="bg-gray-800 text-white p-4 rounded font-mono whitespace-pre-wrap overflow-auto"
          >
            {stateUpdates && message && message.id && stateUpdates[message.id]?.sectionUpdateStates
              ? (
                  <ul className="list-none p-0 m-0">
                    {stateUpdates[message.id].sectionUpdateStates.map((update: SectionUpdateState, index: number) => {
                      let icon, iconClass, label;
                      const sectionId = update.sectionId ?? 'section';
                      if (update.state === "created" || update.state === "updated") {
                        icon = "✓";
                        iconClass = "text-green-400 font-bold";
                        label = `Create ${sectionId}`;
                      } else if (update.state === "creating" || update.state === "updating") {
                        icon = <span className={`spinner mr-1 ${styles.spinner}`}></span>;
                        iconClass = "text-gray-300";
                        label = `Create ${sectionId}`;
                      } else if (update.state === "deleted" || update.state === "deleting") {
                        icon = "✗";
                        iconClass = "text-red-400";
                        label = `Delete ${sectionId}`;
                      } else if (update.state === "error") {
                        icon = "!";
                        iconClass = "text-yellow-400";
                        label = `Error ${sectionId}`;
                      }
                      return (
                        <li key={index} className="flex items-center mb-1">
                          <button
                            className={`inline-flex items-center mr-2 ${iconClass} focus:outline-none focus:ring-2 focus:ring-white/70 rounded transition`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            onClick={() => setCurrentSectionId && update.sectionId && setCurrentSectionId(update.sectionId)}
                            tabIndex={0}
                            aria-label={`Set current section to ${sectionId}`}
                            type="button"
                          >
                            {icon}
                          </button>
                          <span className="text-white/90 text-sm cursor-pointer" onClick={() => setCurrentSectionId && update.sectionId && setCurrentSectionId(update.sectionId)}>{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )
              : <span>No updates available.</span>}
          </pre>
        );
        // Text after the code block
        if (closeFencePos !== -1 && closeFencePos + 3 < afterOpen.length) {
          nodes.push(
            <span key={`after-plan-${idx}`}>
              {afterOpen.substring(closeFencePos + 3)}
            </span>
          );
        }
      } else {
        // Just normal text
        if (part) nodes.push(<span key={`text-${idx}`}>{part}</span>);
      }
      // After every part except the last, insert the Generate button/plan
      if (idx < parts.length - 1) {
        nodes.push(
          <StreamingPlan
            key={`generate-gantt-${idx}`}
            data={{
              label: hasPlan ? 'Regenerate Project Plan' : 'Generate Project Plan',
              isVisible: true
            }}
            newSummary={newSummary}
            sketchSummary={sketchSummary}
          />
        );
      }
    });

    return nodes;
  };
  
  return (
    <div 
      className={`
        flex gap-3 p-4 rounded-lg my-2 max-w-3xl mx-auto w-full
        ${isLatest ? 'animate-fadeIn' : ''}
        ${isUser 
          ? 'bg-white border border-black' 
          : 'bg-black text-white'}
      `}
    >
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full">
          <img 
            src="/logos/D-48x48.png" 
            alt="Deseini AI" 
            className="h-8 w-8 rounded-full"
          />
        </div>
      )}
      
      <div className={`flex-1 min-w-0 ${isUser ? 'ml-0' : ''}`}>
        {!isUser && (
          <div className="font-medium text-sm mb-1 text-white/70">
            Deseini AI
          </div>
        )}
        {message.isTyping && displayContent === '' && (
          <div className="text-white break-words">
            <div className="flex space-x-1">
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0ms"}}></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "300ms"}}></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "600ms"}}></span>
            </div>
          </div>
        )}
        {(displayContent || (isStreaming && currentStreamingContent)) && (
          <div>
            <div className={isUser 
              ? 'text-black text-md font-mono break-words whitespace-pre-wrap' 
              : 'text-white break-words whitespace-pre-wrap'
            }>
              {renderContentWithProjectPlan(isStreaming ? currentStreamingContent : displayContent)}
              {isStreaming && (
                <span className="inline-block ml-1 h-4 w-1 bg-white animate-blink"></span>
              )}
            </div>
            {message.sections?.map((section, index) => (
              <div key={index} className="max-w-full overflow-hidden">
                <MessageSection 
                  section={section}
                  isMe={isUser}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;