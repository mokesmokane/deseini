import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatMessage from "./ChatMessage";
import { useMessaging } from "../../../contexts/Messaging/MessagingProvider";
import QuoteSyncComponent from "./QuoteSyncComponent";

interface ChatPanelProps {
  isTyping?: boolean; 
}

export function ChatPanel({ isTyping = false }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages } = useMessaging();
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  return (
    <div className="flex flex-col flex-grow overflow-hidden bg-white">
      {/* Add QuoteSyncComponent to sync conversation ID between providers */}
      <QuoteSyncComponent />
      
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 max-h-[calc(100vh-60px)]">
        <div className="max-w-2xl mx-auto space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLatest={index === messages.length - 1}
              />
            ))}
            {/* Spacer to push TextInput to bottom */}
            <div className="h-60" />
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 mb-4"
            >
              <div className="flex space-x-1">
                <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0ms" }}></span>
                <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "300ms" }}></span>
                <span className="block w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "600ms" }}></span>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}