import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FolderIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { projectService, Conversation } from '@/services/projectService';
import { useMessaging } from '../../../contexts/Messaging/MessagingProvider';
import { useProject } from '../../../contexts/ProjectContext';
import { useFinalPlan } from '../../../hooks/useFinalPlan';
import { SidebarProjectsPanel } from '../../SidebarProjectsPanel';
import { SidebarChartsPanel } from '../../SidebarChartsPanel';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isVisible: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible }) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const { projectConversations, project, userCharts, projectsList } = useProject();
  const { isGeneratingFinalPlan } = useFinalPlan();
  const [publishComplete, setPublishComplete] = useState(false);
  const publishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  // Track if we've shown the publish complete state for the current publish
  const [hasShownPublishComplete, setHasShownPublishComplete] = useState(true);

  // Handle publish completion state
  useEffect(() => {
    if (isGeneratingFinalPlan) {
      // Reset completion state when a new publish starts
      setPublishComplete(false);
      setHasShownPublishComplete(false);
    } else if (!isGeneratingFinalPlan && !hasShownPublishComplete) {
      // Only set complete if we just finished publishing
      setPublishComplete(true);
      setHasShownPublishComplete(true);
    }

    return () => {
      if (publishTimeoutRef.current) {
        clearTimeout(publishTimeoutRef.current);
      }
    };
  }, [isGeneratingFinalPlan, hasShownPublishComplete]);
  
  // Clear publish complete state when charts section is opened
  useEffect(() => {
    if (activeSection === 'charts' && publishComplete) {
      setPublishComplete(false);
    }
  }, [activeSection, publishComplete]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_TIMEOUT = 3000; // 3 seconds

  const { 
    setCurrentProjectId, 
    loadConversation
  } = useMessaging();
  
  // Chart select navigation logic
  const handleChartSelect = (chartId: string, event: React.MouseEvent) => {
    // Prevent any parent handlers from executing
    event.preventDefault();
    event.stopPropagation();
    if (project?.id) {
      navigate(`/projects/${project.id}/chart/${chartId}`);
    }
  };

  const handleEditSelect = (event: React.MouseEvent) => {
    // Prevent any parent handlers from executing
    event.preventDefault();
    event.stopPropagation();
    if (project?.id) {
      navigate(`/projects/${project.id}`);
    }
  };
  
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
    if (activeSection) {
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
      loadConversation(conversation.id);
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

  const handleSketchesClick = () => {
    // Navigate to the mermaid notepad page
    window.location.href = '/mermaid-notepad';
  };
  
  return (
    <motion.div
      ref={sidebarRef}
      className="absolute top-0 left-0 h-full bg-white/95 backdrop-blur-sm overflow-hidden flex z-50"
      initial={{ width: 0, x: -340 }}
      animate={{
        width: isVisible
          ? (activeSection ? '340px' : '72px')
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
            onClick={() => toggleSection('projects')}
            isActive={activeSection === 'projects'}
          />
          <SidebarIcon 
            icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />} 
            onClick={() => toggleSection('chats')}
            isActive={activeSection === 'chats'}
            disabled={projectConversations.length === 0}
          />
          <SidebarIcon 
            icon={
                <PencilIcon className="h-6 w-6" />
            }   
            onClick={(event) => handleEditSelect(event)}
            isActive={false}
          />
          <div className="relative">
            <SidebarIcon
              icon={
                <div className="relative">
                  <ChartBarIcon className="h-6 w-6" />
                  {(isGeneratingFinalPlan || publishComplete) && (
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center text-[8px] ${
                      isGeneratingFinalPlan 
                        ? 'border-2 border-gray-400 border-t-black animate-spin' 
                        : 'bg-green-500 text-white'
                    }`}>
                      {publishComplete && '✓'}
                    </div>
                  )}
                </div>
              }
              onClick={() => toggleSection('charts')}
              isActive={activeSection === 'charts'}
            />
          </div>
        </nav>
        <div className="flex justify-center pt-4">
          <button 
            className="flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-md transition-colors w-10 h-10"
            title="Settings"
            onClick={handleSketchesClick}
          >
            <CogIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
        
      {/* Section content - only shown when a section is active */}
      {activeSection && (
        <div className="relative h-full bg-transparent w-[260px] p-3">
          {activeSection === 'projects' && (
            <SidebarProjectsPanel
              projects={projectsList}
              onClose={() => setActiveSection(null)}
            />
          )}

          {activeSection === 'charts' && (
            <SidebarChartsPanel
              charts={userCharts}
              onClose={() => setActiveSection(null)}
              onChartSelect={(chartId, event) => handleChartSelect(chartId, event)}
            />
          )}
          {activeSection !== 'charts' && activeSection !== 'projects' && (
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium capitalize">{activeSection}</h3>
              <button 
                className="flex items-center justify-center bg-white hover:bg-gray-100 text-gray-700 p-2 rounded-md transition-colors w-8 h-8"
                title="Collapse Sidebar"
                onClick={() => setActiveSection(null)}
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
            </div>
          )}
          
          
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
  onClick: (event: React.MouseEvent) => void;
  isActive?: boolean;
  disabled?: boolean;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({  
  icon, 
  onClick, 
  isActive = false,
  disabled = false
}) => {
  const handleClick = (event: React.MouseEvent) => {
    if (!disabled) {
      onClick(event);
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
