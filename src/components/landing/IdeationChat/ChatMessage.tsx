import React, { useEffect, useState } from 'react';
import { Message } from '../types';
import { MessageSection } from './MessageSection';
import { useMessaging } from '../MessagingProvider';

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const { currentStreamingMessageId, currentStreamingContent } = useMessaging();
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
              {isStreaming ? currentStreamingContent : displayContent}
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