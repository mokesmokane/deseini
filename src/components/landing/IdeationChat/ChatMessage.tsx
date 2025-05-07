import React, { useEffect, useState } from 'react';
import { Message } from '../types';
import { MessageSection } from './MessageSection';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { useDraftMarkdown } from '../../../contexts/DraftMarkdownProvider';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
// import Generate from './Generate'; // legacy placeholder, can remove if unused
import Placeholder from './Placeholder';
import CodeBlock from './CodeBlock';
import ProjectPlanBlock from './ProjectPlanBlock';
import ProjectPlanUpdateBlock from './ProjectPlanUpdateBlock';
import MermaidSyntaxUpdateBlock from './MermaidSyntaxUpdateBlock';

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
  
  const renderContent = (content: string = '') => {
    const nodes: React.ReactNode[] = [];
    const hasPlan = Array.isArray(sections) && sections.length > 0;
    let idx = 0;
    let i = 0;
    while (i < content.length) {
      // Handle [[PLACEHOLDER]]
      if (content.startsWith('[[', i)) {
        const end = content.indexOf(']]', i + 2);
        if (end !== -1) {
          const action = content.slice(i + 2, end);
          nodes.push(
            <Placeholder
              key={`placeholder-${idx}`}
              action={action}
              idx={idx}
              hasPlan={hasPlan}
              newSummary={newSummary}
              sketchSummary={sketchSummary}
            />
          );
          idx++;
          i = end + 2;
          continue;
        }
      }
      // Handle ``` blocks
      if (content.startsWith('```', i)) {
        // Find language
        const newline = content.indexOf('\n', i + 3);
        let lang = '';
        if (newline !== -1) {
          lang = content.slice(i + 3, newline).trim();
        }
        // Find closing ```
        const close = content.indexOf('```', newline + 1);
        if (lang.toLowerCase() === 'projectplan') {
          nodes.push(
            <ProjectPlanBlock
              key={`code-${idx}`}
              messageId={message.id}
              setCurrentSectionId={setCurrentSectionId}
            />
          );
          idx++;
          // If closing found, skip to after it, else to end
          if (close !== -1) {
            i = close + 3;
          } else {
            // No closing, treat rest as inside block (streaming case)
            break;
          }
          continue;
        } else if (lang.toLowerCase() === 'editedprojectplan') {
          nodes.push(
            <ProjectPlanUpdateBlock
              key={`code-${idx}`}
              messageId={message.id}
              setCurrentSectionId={setCurrentSectionId}
            />
          );
          idx++;
          // If closing found, skip to after it, else to end
          if (close !== -1) {
            i = close + 3;
          } else {
            // No closing, treat rest as inside block (streaming case)
            break;
          }
          continue;
        } else if (lang.toLowerCase() === 'editedmermaidmarkdown') {
          nodes.push(
            <MermaidSyntaxUpdateBlock
              key={`code-${idx}`}
              messageId={message.id}
            />
          );
          idx++;
          // If closing found, skip to after it, else to end
          if (close !== -1) {
            i = close + 3;
          } else {
            // No closing, treat rest as inside block (streaming case)
            break;
          }
          continue;
        } else {
          // Not ProjectPlan, treat as generic code block
          let codeContent = '';
          if (newline !== -1 && close !== -1) {
            codeContent = content.slice(newline + 1, close);
            nodes.push(
              <CodeBlock key={`code-${idx}`} lang={lang} content={codeContent} />
            );
            idx++;
            i = close + 3;
            continue;
          } else {
            // No closing, treat rest as code
            codeContent = content.slice(newline + 1);
            nodes.push(
              <CodeBlock key={`code-${idx}`} lang={lang} content={codeContent} />
            );
            break;
          }
        }
      }
      // Otherwise, emit next chunk of text until next [[ or ```
      const nextSpecial = (() => {
        const nextBracket = content.indexOf('[[', i);
        const nextFence = content.indexOf('```', i);
        if (nextBracket === -1 && nextFence === -1) return content.length;
        if (nextBracket === -1) return nextFence;
        if (nextFence === -1) return nextBracket;
        return Math.min(nextBracket, nextFence);
      })();
      if (nextSpecial > i) {
        nodes.push(<span key={`text-${idx}`}>{content.slice(i, nextSpecial)}</span>);
        idx++;
        i = nextSpecial;
      } else {
        // Should not happen, but avoid infinite loop
        i++;
      }
    }
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
              {renderContent(isStreaming ? currentStreamingContent : displayContent)}
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