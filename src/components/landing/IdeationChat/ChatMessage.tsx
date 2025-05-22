import React, { useEffect, useState } from 'react';
import TextDisplayDialog from '../../common/TextDisplayDialog';
import { Message } from '../types';
import { MessageSection } from './MessageSection';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { useDraftMarkdown } from '../../../contexts/DraftMarkdownProvider';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
import { useActiveTab } from '../../../contexts/ActiveTabProvider';
// import Generate from './Generate'; // legacy placeholder, can remove if unused
import Placeholder from './Placeholder';
import CodeBlock from './CodeBlock';
import ProjectPlanBlock from './ProjectPlanBlock';
import ProjectPlanUpdateBlock from './ProjectPlanUpdateBlock';
import MermaidSyntaxUpdateBlock from './MermaidSyntaxUpdateBlock';
import ExampleAnswersBlock from './ExampleAnswersBlock';
import PlainBoldHr from './PlainBoldHr';

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const { currentStreamingMessageId, currentStreamingContent } = useMessaging();
  const { setCurrentSectionId } = useDraftMarkdown();
  const { sections, newSummary, sketchSummary } = useDraftPlanMermaidContext();
  const { setActiveTab } = useActiveTab();
  const isUser = message.role === 'user';
  const isStreaming = !isUser && currentStreamingMessageId === message.id;

  // Use a local state for smoother animation while streaming
  const [displayContent, setDisplayContent] = useState(message.content);
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false);

  const quotes = message.quotes || [];

  // Update the display content when streaming or message changes
  useEffect(() => {
    if (isStreaming) {
      setDisplayContent(currentStreamingContent);
    } else {
      setDisplayContent(message.content);
    }
  }, [isStreaming, currentStreamingContent, message.content]);

  // Process markdown content to correctly render special blocks
  const renderContent = (content: string = '') => {
    // For completed messages, we need to ensure special blocks are properly parsed
    if (!isStreaming && message.content) {
      content = message.content;
    }
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
              content={content.slice(newline + 1, close)}
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
              content={content.slice(newline + 1, close)}
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
        } else if (lang.toLowerCase() === 'editedmermaidmarkdown' || lang.toLowerCase() === 'mermaid') {
          nodes.push(
            newSummary ? 
            <Placeholder
              key={`placeholder-${idx}`}
              action='CREATE_PROJECT_GANTT'
              idx={idx}
              hasPlan={hasPlan}
              newSummary={newSummary}
              sketchSummary={sketchSummary}
            />
            :(
            <MermaidSyntaxUpdateBlock
              key={`code-${idx}`}
              messageId={message.id}
              content={content.slice(newline + 1, close)}
            />
            )
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
        } else if (lang.toLowerCase() === 'exampleanswers') {
          nodes.push(
            <ExampleAnswersBlock
              key={`example-answers-${idx}`}
              content={content.slice(newline + 1, close)}
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
        // Clean whitespace before line breaks in regular text content
        const textContent = content.slice(i, nextSpecial);

        const cleanedContent = textContent.replace(/[ \t]+\n/g, '\n');
        
        nodes.push(
          <PlainBoldHr
            key={`text-${idx}`}
            text={cleanedContent}
          />
        );
        idx++;
        i = nextSpecial;
      } else {
        // Should not happen, but avoid infinite loop
        i++;
      }
    }
    return <div className="markdown">{nodes}</div>;
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
     
      <div className={`flex-1 min-w-0 relative group ${isUser ? 'ml-0' : ''}`}>
        {!isUser && (
          <div className="font-medium text-sm mb-1 text-white/70">
            Deseini AI
          </div>
        )}
        {message.isTyping && displayContent === '' && (
          <div className="text-white break-words">
            <div className="flex space-x-1">
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></span>
              <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></span>
            </div>
          </div>
        )}
        {(displayContent || (isStreaming && currentStreamingContent)) && (
          <div>
            {quotes.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {quotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center bg-black text-white border border-black rounded-full px-3 py-1 text-sm cursor-pointer transition-colors hover:bg-neutral-900 shadow-sm"
                    style={{ fontFamily: 'monospace', letterSpacing: '0.02em', fontWeight: 500 }}
                    title={quote.content.length > 50 ? quote.content.substring(0, 50) + '...' : quote.content}
                    onClick={() => {
                      setCurrentSectionId(quote.sectionId);
                      setActiveTab('notes');
                    }}
                  >
                    <span className="mr-2 flex items-center gap-1">
                      <span className="text-white/70">@</span>
                      <span className="font-semibold text-white/90 truncate max-w-[120px]">
                        {quote.sectionTitle.length > 24 ? `${quote.sectionTitle.substring(0, 24)}...` : quote.sectionTitle}
                      </span>
                      <span className="text-xs text-white/60 pl-1">
                        {quote.lineNumbers.start}-{quote.lineNumbers.end}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className={isUser
              ? 'text-black text-md font-mono break-words whitespace-pre-wrap'
              : 'text-white break-words whitespace-pre-wrap'
            }>
              {/* For user messages, render plain text. For AI messages, render with markdown */}
              {isUser 
                ? <div>{displayContent}</div>
                : renderContent(isStreaming ? currentStreamingContent : displayContent)
              }
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
            {!isUser ? (
              <button
                onClick={() => setIsTextDialogOpen(true)}
                className="text-xs rounded-md px-2 py-1 inline-flex items-center transition-colors absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white shadow-md hover:bg-gray-700"
                style={{ 
                  bottom: '-12px',
                  transform: 'translateY(50%)'
                }}
              >
                View  Text
              </button>
            ) : (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(message.content || '');
                  // Optional: Show a small tooltip or notification that text was copied
                  const tooltip = document.createElement('div');
                  tooltip.innerText = 'Copied!';
                  tooltip.style.position = 'absolute';
                  tooltip.style.right = '0';
                  tooltip.style.bottom = '-30px';
                  tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                  tooltip.style.color = 'white';
                  tooltip.style.padding = '4px 8px';
                  tooltip.style.borderRadius = '4px';
                  tooltip.style.fontSize = '12px';
                  tooltip.style.transition = 'opacity 0.3s';
                  
                  document.activeElement?.parentElement?.appendChild(tooltip);
                  
                  setTimeout(() => {
                    tooltip.style.opacity = '0';
                    setTimeout(() => tooltip.remove(), 300);
                  }, 1000);
                }}
                className="text-xs rounded-md px-2 py-1 inline-flex items-center transition-colors absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-800 text-white shadow-md hover:bg-gray-700"
                style={{ 
                  bottom: '-12px',
                  transform: 'translateY(50%)'
                }}
              >
                Copy Text
              </button>
            )}
          </div>
        )}
      </div>
      <TextDisplayDialog
        isOpen={isTextDialogOpen}
        title="Message Plain Text"
        content={message.content || ''}
        onClose={() => setIsTextDialogOpen(false)}
      />
    </div>
  );
};

export default ChatMessage;