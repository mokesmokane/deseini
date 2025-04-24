import React from 'react';
import { Message } from '../types';
import { MessageSection } from './MessageSection';

interface ChatMessageProps {
  message: Message;
  isLatest: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLatest }) => {
  const isUser = message.isMe;
  
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
        <div className={isUser 
          ? 'text-black text-md font-mono break-words' 
          : 'text-white break-words'
        }>
          {message.content}
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
    </div>
  );
};

export default ChatMessage;