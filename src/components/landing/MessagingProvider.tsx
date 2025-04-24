import { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { Message } from './types';
import { sampleMessages } from './sample';

interface MessagingContextProps {
  messages: Message[];
  addMessage: (content: string) => void;
}

const MessagingContext = createContext<MessagingContextProps | undefined>(undefined);

export const MessagingProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const sampleIndexRef = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addMessage = (content: string) => {
    // Add user's message immediately
    const userMessage: Message = {
      id: `${Date.now()}-me`,
      content,
      timestamp: new Date(),
      isMe: true,
    };
    setMessages(prev => [...prev, userMessage]);

    // Fake delay before showing the next sample message
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const nextSample = sampleMessages[sampleIndexRef.current % sampleMessages.length];
      setMessages(prev => [...prev, { ...nextSample, id: `${Date.now()}-ai`, timestamp: new Date(), isMe: false }]);
      sampleIndexRef.current++;
    }, 800);
  };

  return (
    <MessagingContext.Provider value={{ messages, addMessage }}>
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
