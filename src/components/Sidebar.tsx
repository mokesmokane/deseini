import { useGantt } from '../contexts/GanttContext';
import { useChartsList } from '../contexts/ChartsListContext';
import { useProject } from '../contexts/ProjectContext';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  HomeIcon,
  Cog6ToothIcon,
  BugAntIcon,
  ChartBarIcon,
  ChevronLeftIcon,
  CodeBracketIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { ChartCreationChat } from './ChartCreationChat';
// import { CreateChartDialog } from './dialogs/CreateChartDialog';
import { ChatMessage, TreeTaskNode } from '../types';

interface SidebarSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  content?: React.ReactNode;
  onClick?: () => void;
}

interface SidebarProps {
  onActiveSectionChange?: (sectionId: string | null) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onActiveSectionChange }) => {
  const { currentChart, setCurrentChart, setHasUnsavedChanges, loadChartById } = useGantt();
  const { saveChart } = useChartsList();
  const { 
    project, 
    userCharts, 
    isGeneratingTasks, 
    taskGenerationError, 
    initialTasksForDialog, 
    isCreateChartDialogOpen, 
    setIsCreateChartDialogOpen,
    handleInitiateTaskGeneration
  } = useProject();
  const { projectId } = useParams<{ projectId: string }>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [projectJsonError, setProjectJsonError] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState('');
  const [projectJsonContent, setProjectJsonContent] = useState('');
  const [showChartCreationChat, setShowChartCreationChat] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`[Sidebar] useEffect: activeSection changed to: ${activeSection}`);
    onActiveSectionChange?.(activeSection);
  }, [activeSection, onActiveSectionChange]);

  const logChartData = () => {
    console.log('Chart Data:', currentChart);
  };

  const validateDependencies = () => {
    console.log(`Validating ${currentChart?.dependencies?.length || 0} dependencies...`);
    // Additional validation logic would go here
  };

  const checkTaskDateConstraints = () => {
    console.log(`Checking date constraints for ${currentChart?.tasks?.length || 0} tasks...`);
    // Task date validation logic would go here
  };

  const getChartJsonRepresentation = () => {
    return JSON.stringify(currentChart, null, 2);
  };

  const getProjectJsonRepresentation = () => {
    const projectData = {
      id: projectId,
      projectName: project?.projectName || '',
      description: project?.description || '',
      bannerImage: project?.bannerImage || '',
      attachments: project?.attachments || [],
      roles: project?.roles || [],
      charts: userCharts || []
    };
    
    return JSON.stringify(projectData, null, 2);
  };

  useEffect(() => {
    setJsonContent(getChartJsonRepresentation());
  }, [currentChart]);

  useEffect(() => {
    setProjectJsonContent(getProjectJsonRepresentation());
  }, [projectId, userCharts, project]);

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonContent(e.target.value);
    setJsonError(null);
  };

  const handleProjectJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProjectJsonContent(e.target.value);
    setProjectJsonError(null);
  };

  const saveJsonChanges = () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      setCurrentChart(parsedJson);

      if (currentChart?.id) {
        saveChart(parsedJson).then((success: boolean) => {
          if (success) {
            setJsonError(null);
            setHasUnsavedChanges(false);
          } else {
            setJsonError('Failed to save to database. Changes applied to chart locally only.');
            setHasUnsavedChanges(true);
          }
        });
      } else {
        setHasUnsavedChanges(true);
        setJsonError(null);
      }
    } catch (error) {
      setJsonError(`Invalid JSON: ${(error as Error).message}`);
    }
  };

  const navigateToProjectDetails = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
      setActiveSection(null);
      setIsExpanded(false);
    }
  };

  const handleChartSelect = (chartId: string) => {
    loadChartById(chartId);
    navigate(`/projects/${projectId}/chart/${chartId}`);
    setActiveSection('plans');
    setIsExpanded(false);
  };

  const handleStartChartCreationChat = () => {
    setShowChartCreationChat(true);
    if (activeSection !== 'create') {
        setActiveSection('create');
    }
    if (!isExpanded) {
        setIsExpanded(true);
    }
  };

  const handleCancelChartCreationChat = () => {
    setShowChartCreationChat(false);
  };

  const sections: SidebarSection[] = [
    {
      id: 'project',
      name: 'Project Details',
      icon: <HomeIcon className="h-6 w-6" />,
      onClick: navigateToProjectDetails
    },
    {
      id: 'plans',
      name: 'Plans',
      icon: <ChartBarIcon className="h-6 w-6" />,
      content: (
        <div className="p-4 h-full flex flex-col">
          <h3 className="font-bold text-lg mb-4 flex-shrink-0">Project Charts</h3>
          
          <div className="flex-grow overflow-y-auto">
            {userCharts && userCharts.length > 0 ? (
              <div className="space-y-3 pb-4">
                {userCharts.map((chart: { id: string; name: string; description?: string }) => (
                  <div
                    key={chart.id}
                    className={`p-3 rounded-md border cursor-pointer transition-all hover:bg-gray-100 ${currentChart?.id === chart.id ? 'border-neutral-400 bg-neutral-100' : 'border-gray-200'
                      }`}
                    onClick={() => handleChartSelect(chart.id)}
                  >
                    <div className="font-medium">{chart.name}</div>
                    {chart.description && (
                      <div className="text-sm text-gray-600 mt-1 line-clamp-2">{chart.description}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">No charts found for this project.</p>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'create',
      name: 'Create via Chat',
      icon: <SparklesIcon className="h-6 w-6" />,
      content: (
        <div className="p-4 h-full flex flex-col">
          <div className="flex-grow overflow-y-auto relative">
            <div className="absolute inset-0 overflow-y-auto">
              {showChartCreationChat ? (
                <ChartCreationChat
                  onCancel={handleCancelChartCreationChat}
                  className="h-full"
                />
              ) : (
                <div className="text-center py-10">
                  <button
                    onClick={handleStartChartCreationChat}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center mx-auto"
                  >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Create New Plan
                  </button>
                </div>
              )}
            </div>
            {isGeneratingTasks && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-md">
                <p className="text-neutral-600 font-medium animate-pulse">Generating tasks...</p>
              </div>
            )}
            {taskGenerationError && !isGeneratingTasks && (
              <div className="absolute bottom-4 left-4 right-4 p-2 bg-red-100 text-red-700 text-xs z-10 rounded-md shadow text-center">
                Error: {taskGenerationError}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      name: 'Chart Settings',
      icon: <Cog6ToothIcon className="h-6 w-6" />,
      content: (
        <div className="p-4">
          <h3 className="font-bold text-lg mb-4">Chart Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chart Display</label>
              <select className="w-full border border-gray-300 rounded-md p-2">
                <option value="day">Day View</option>
                <option value="week">Week View</option>
                <option value="month">Month View</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Show Weekends</label>
              <input type="checkbox" className="border border-gray-300 rounded-md p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Show Dependencies</label>
              <input type="checkbox" className="border border-gray-300 rounded-md p-2" defaultChecked />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'debug',
      name: 'Debug Tools',
      icon: <BugAntIcon className="h-6 w-6" />,
      content: (
        <div className="p-4 h-full flex flex-col">
          <h3 className="font-bold text-lg mb-4">Debug Tools</h3>
          <div className="space-y-4 mb-4">
            <button
              onClick={logChartData}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium w-full"
            >
              Log Chart Data
            </button>
            <button
              onClick={validateDependencies}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium w-full"
            >
              Validate Dependencies
            </button>
            <button
              onClick={checkTaskDateConstraints}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-md text-sm font-medium w-full"
            >
              Check Task Date Constraints
            </button>
          </div>
          
          <h4 className="font-medium mb-2">Chart JSON Representation</h4>
          <div className="flex-grow flex flex-col">
            <textarea
              value={jsonContent}
              onChange={handleJsonChange}
              className="flex-grow p-2 bg-gray-100 rounded-md text-xs font-mono mb-2 overflow-auto"
              style={{ resize: 'vertical', minHeight: '150px' }}
            />
            {jsonError && (
              <div className="text-red-500 text-xs mb-2">
                {jsonError}
              </div>
            )}
            <button 
              onClick={saveJsonChanges}
              className="bg-neutral-700 hover:bg-neutral-800 text-white px-3 py-2 rounded-md text-sm font-medium w-full"
            >
              Save JSON Changes
            </button>
          </div>
        </div>
      )
    },
    {
      id: 'json',
      name: 'Project JSON',
      icon: <CodeBracketIcon className="h-6 w-6" />,
      content: (
        <div className="p-4 h-full flex flex-col">
          <h3 className="font-bold text-lg mb-4">Project JSON</h3>
          <div className="flex-grow flex flex-col">
            <textarea
              value={projectJsonContent}
              onChange={handleProjectJsonChange}
              className="flex-grow p-2 bg-gray-100 rounded-md text-xs font-mono mb-2 overflow-auto"
              style={{ resize: 'vertical', minHeight: '250px' }}
            />
            {projectJsonError && (
              <div className="text-red-500 text-xs mb-2">
                {projectJsonError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(projectJsonContent);
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `project-${projectId}.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm font-medium flex-1"
              >
                Export Project JSON
              </button>
            </div>
          </div>
        </div>
      )
    }
  ];

  const toggleSection = (id: string) => {
    const newActiveSection = activeSection === id ? null : id;
    setActiveSection(newActiveSection);
    if (newActiveSection && newActiveSection !== 'project') {
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  };

  const handleCollapseSidebar = () => {
    setIsExpanded(false);
  };

  // Log current state on every render
  console.log(`[Sidebar] Rendering: isExpanded=${isExpanded}, activeSection=${activeSection}, showChartCreationChat=${showChartCreationChat}`);

  return (
    <div
      className={`flex h-full bg-white border-r border-gray-200 transition-all duration-300 ${
        isExpanded 
          ? activeSection === 'create' ? 'w-[40rem]' : 'w-80'
          : 'w-14'
      }`}
    >
      <div className="w-14 h-full border-r border-gray-200 flex flex-col items-center py-4">
        <div className="flex flex-col space-y-4 mt-4 items-center flex-grow">
          {sections.slice(0, 3).map((section) => (
            <button
              key={section.id}
              onClick={() => section.onClick ? section.onClick() : toggleSection(section.id)}
              className={`p-2 rounded-full transition ${activeSection === section.id
                  ? 'bg-neutral-200 text-neutral-800'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              title={section.name}
            >
              {section.icon}
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col space-y-4 mb-4 items-center">
          {sections.slice(3).map((section) => (
            <button
              key={section.id}
              onClick={() => section.onClick ? section.onClick() : toggleSection(section.id)}
              className={`relative p-2 rounded-full transition ${activeSection === section.id
                  ? 'bg-neutral-200 text-neutral-800'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              title={`${section.name}${section.id === 'json' ? ' - Click to view project JSON data' : ''}`}
              aria-label={section.name}
            >
              {section.icon}
              {section.id === 'json' && activeSection !== 'json' && (
                <span className="absolute -right-1 -top-1 h-3 w-3 bg-neutral-500 rounded-full animate-pulse"></span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`h-full overflow-auto transition-all duration-300 relative ${isExpanded ? 'flex-1' : 'w-0 opacity-0'}`}
      >
        {isExpanded && (
          <button
            onClick={handleCollapseSidebar}
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 text-gray-500 z-20"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}
        {isExpanded && activeSection && sections.find(s => s.id === activeSection && s.id !== 'project')?.content}
      </div>

    </div>
  );
};

export default Sidebar;
