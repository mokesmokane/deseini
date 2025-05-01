import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  DocumentIcon,
  PencilIcon,
  ArrowsPointingOutIcon,
  ChatBubbleLeftRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { projectService, Conversation } from '@/services/projectService';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { Message, MessageStatus } from '../types';
import { useProject } from '../../../contexts/ProjectContext';

interface SidebarProps {
  isVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const {projectConversations, project} = useProject();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 3000; // 3 seconds

  const { 
    setMessages, 
    setCurrentProjectId, 
    setCurrentConversationId
  } = useMessaging();
  
  // Load conversations when the chats section is opened
  useEffect(() => {
    if (activeSection === 'chats' && project?.id) {
      loadProjectConversations();
    }
  }, [activeSection, project?.id]);
  
  // Handle clicks outside sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && activeSection) {
        setActiveSection(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSection]);

  // Handle mouse hover and leave
  const handleMouseEnter = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (activeSection && !collapsed) {
      inactivityTimerRef.current = setTimeout(() => {
        setActiveSection(null);
      }, INACTIVITY_TIMEOUT);
    }
  };

  const loadProjectConversations = async () => {
    if (!project?.id) {
      setConversations([]);
      return;
    }
    
    try {
      setLoading(true);
      // Only load conversations for the current project
      const projectConversations = await projectService.getUserConversations(project.id);
      setConversations(projectConversations);
    } catch (error) {
      console.error('Error loading project conversations:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleLoadConversation = async (conversation: Conversation) => {
    try {
      // Set the current project and conversation IDs
      setCurrentProjectId(conversation.projectId);
      setCurrentConversationId(conversation.id);
      
      // Load the conversation messages
      const messages = await projectService.getConversationMessages(conversation.id);
      
      // Convert the messages to the format expected by the messaging provider
      const formattedMessages = messages.map((msg: any) => {
        const messageStatus: MessageStatus = 'sent';
        return {
          id: `${new Date(msg.timestamp).getTime()}-${msg.role}`,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          role: msg.role,
          status: messageStatus,
          isTyping: false,
        } as Message;
      });
      
      // Set the messages in the chat
      setMessages(formattedMessages);
      
      // Close the sidebar section after selecting a conversation
      setActiveSection(null);
    } catch (error) {
      console.error('Error loading conversation messages:', error);
    }
  };
  
  const toggleSection = (section: string) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    if (activeSection) {
      setActiveSection(null);
    }
  };
  
  return (
    <motion.div
      ref={sidebarRef}
      className="absolute top-0 left-0 h-full bg-white/95 backdrop-blur-sm overflow-hidden flex z-50"
      initial={{ width: 0, x: -340 }}
      animate={{
        width: isVisible
          ? (collapsed ? '72px' : (activeSection ? '340px' : '72px'))
          : 0,
        x: isVisible ? 0 : -340
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Fixed icon sidebar */}
      <div className="h-full flex flex-col pt-6 pb-4 min-w-[72px] z-10 bg-transparent">
        <nav className="flex-1 pb-4 flex flex-col items-center space-y-6">
          <SidebarIcon 
            icon={<FolderIcon className="h-6 w-6" />} 
            onClick={() => !collapsed && toggleSection('projects')}
            isActive={activeSection === 'projects'}
          />
          <SidebarIcon 
            icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />} 
            onClick={() => !collapsed && toggleSection('chats')}
            isActive={activeSection === 'chats'}
            disabled={collapsed || projectConversations.length === 0}
          />
          <SidebarIcon 
            icon={<DocumentIcon className="h-6 w-6" />} 
            onClick={() => !collapsed && toggleSection('templates')}
            isActive={activeSection === 'templates'}
          />
          <SidebarIcon 
            icon={<PencilIcon className="h-6 w-6" />}   
            onClick={() => !collapsed && toggleSection('sketches')}
            isActive={activeSection === 'sketches'}
          />
          <SidebarIcon 
            icon={<ArrowsPointingOutIcon className="h-6 w-6" />} 
            onClick={() => !collapsed && toggleSection('export')}
            isActive={activeSection === 'export'}
          />
        </nav>
        <div className="flex justify-center pt-4">
          <button 
            className="flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-md transition-colors w-10 h-10"
            title="Settings"
            onClick={toggleCollapse}
          >
            <CogIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
        
      {/* Section content - only shown when a section is active and not collapsed */}
      {activeSection && !collapsed && (
        <div className="relative h-full bg-transparent w-[260px] p-3">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium capitalize">{activeSection}</h3>
            <button 
              className="flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-md transition-colors w-8 h-8"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              onClick={toggleCollapse}
            >
              {collapsed ? 
                <ChevronRightIcon className="h-6 w-6" /> : 
                <ChevronLeftIcon className="h-6 w-6" />
              }
            </button>
          </div>
          
          
          {activeSection === 'chats' && (
            <>
              {!project?.id ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  Please select a project first
                </div>
              ) : loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                </div>
              ) : conversations.length > 0 ? (
                <ul className="space-y-2">
                  {conversations.map((conv) => (
                    <li 
                      key={conv.id}
                      className="p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors text-sm"
                      onClick={() => handleLoadConversation(conv)}
                    >
                      <div className="font-medium truncate">{conv.projectName}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {conv.lastMessage ? (
                          <span className="truncate">{conv.lastMessage.slice(0, 30)}...</span>
                        ) : (
                          <span className="italic">No messages</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(conv.createdAt).toLocaleDateString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  No conversations found for this project
                </div>
              )}
              
              <button 
                className="mt-4 w-full p-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-md transition-colors"
                onClick={loadProjectConversations}
                disabled={!project?.id || loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

interface SidebarIconProps {
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ 
  icon, 
  onClick, 
  isActive = false,
  disabled = false
}) => {
  const handleClick = () => {
    if (!disabled) {
      onClick();
    }
  };
  
  return (
    <div className="relative group">
      <button
        className={`p-2 rounded-md transition-colors ${
          disabled 
            ? 'text-gray-300 cursor-not-allowed' 
            : isActive 
              ? 'bg-gray-200 text-gray-900' 
              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
        }`}
        onClick={handleClick}
        disabled={disabled}
      >
        {icon}
      </button>
    </div>
  );
};

export default Sidebar;
