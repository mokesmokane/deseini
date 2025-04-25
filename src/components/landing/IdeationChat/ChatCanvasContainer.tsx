import React from 'react';
import { motion } from 'framer-motion';
import { ChatPanel } from './ChatPanel';
import Canvas from '../IdeationCanvas/Canvas';
import TextInput from './TextInput';
import Sidebar from '../IdeationSidebar/Sidebar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useMessaging } from '../MessagingProvider';

interface ChatCanvasContainerProps {
  isCanvasVisible: boolean;
}

const ChatCanvasContainer: React.FC<ChatCanvasContainerProps> = ({ isCanvasVisible }) => {
  const { isChatVisible, toggleChat } = useMessaging();

  return (
    <div className="w-full h-full flex">
      {/* Sidebar that slides in from the left when canvas is visible */}
      <Sidebar isVisible={isCanvasVisible} />
      
      {/* Chat panel that slides to the left when canvas is visible */}
      <motion.div 
        className="flex flex-col relative"
        initial={{ width: '100%' }}
        animate={{ 
          width: isCanvasVisible ? (isChatVisible ? '36rem' : '0') : '100%',
          marginLeft: isCanvasVisible ? '0' : 'auto', 
          marginRight: isCanvasVisible ? '0' : 'auto'
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex-grow overflow-hidden">
          <ChatPanel />
        </div>
        <div className="w-full px-2 pb-4 pt-2 bg-white z-10">
          {isChatVisible && <TextInput hasStarted={true} />}
        </div>

        {/* Toggle chat button */}
        {isCanvasVisible && (
          <button 
            onClick={toggleChat}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-20 bg-white rounded-full p-1.5 border-0 focus:outline-none"
            aria-label={isChatVisible ? "Hide Chat" : "Show Chat"}
            title={isChatVisible ? "Hide Chat" : "Show Chat"}
          >
            {isChatVisible ? 
              <ChevronLeftIcon className="h-4 w-4 text-gray-700" /> : 
              <ChevronRightIcon className="h-4 w-4 text-gray-700" />
            }
          </button>
        )}
      </motion.div>
      
      {/* Canvas that slides in from the right */}
      <motion.div
        className="h-full overflow-hidden"
        initial={{ width: 0 }}
        animate={{ 
          width: isCanvasVisible ? (isChatVisible ? 'calc(100% - 36rem - 72px)' : 'calc(100% - 72px)') : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Canvas isVisible={isCanvasVisible} />
      </motion.div>
    </div>
  );
};

export default ChatCanvasContainer;
