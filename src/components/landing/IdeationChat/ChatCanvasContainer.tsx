import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatPanel } from './ChatPanel';
import Canvas from '../IdeationCanvas/Canvas';
import TextInput from './TextInput';
import Sidebar from '../IdeationSidebar/Sidebar';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useMessaging } from '../../../contexts/MessagingProvider';
import { useProject } from '../../../contexts/ProjectContext';

interface ChatCanvasContainerProps {
  isCanvasVisible: boolean;
}

const ChatCanvasContainer: React.FC<ChatCanvasContainerProps> = ({ isCanvasVisible }) => {
  const { isChatVisible, toggleChat } = useMessaging();
  const {project} = useProject();
  const [activeTab, setActiveTab] = useState<'notes' | 'plan'>('notes');
  return (
    <div className="w-full bg-gray-100 h-full flex min-h-0 min-w-0">
      {/* Sidebar that slides in from the left when canvas is visible */}
      <Sidebar isVisible={project !== null} />
      
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
        <div className="flex-grow overflow-hidden relative">
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm pointer-events-none z-0 transition-all duration-300" />
          <div className="relative z-0 h-full">
            <ChatPanel />
          </div>
          
          {/* Position the TextInput absolutely at the bottom of the container */}
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-4 pt-2 z-10">
            {isChatVisible && <TextInput hasStarted={true} />}
          </div>
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
        className="h-full w-full min-h-0 min-w-0 overflow-hidden"
        initial={{ width: 0 }}
        animate={{ 
          width: isCanvasVisible ? (isChatVisible ? 'calc(100% - 36rem - 72px)' : 'calc(100% - 72px)') : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Canvas isVisible={isCanvasVisible} activeTab={activeTab} setActiveTab={setActiveTab} />
      </motion.div>
    </div>
  );
};

export default ChatCanvasContainer;
