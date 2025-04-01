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
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { CreateChartDialog } from './dialogs/CreateChartDialog';

interface SidebarSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  content?: React.ReactNode;
  onClick?: () => void;
}

const Sidebar: React.FC = () => {
  const { currentChart, setCurrentChart, setHasUnsavedChanges, loadChartById } = useGantt();
  const { saveChart } = useChartsList();
  const { userCharts, project } = useProject();
  const { projectId } = useParams<{ projectId: string }>();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [projectJsonError, setProjectJsonError] = useState<string | null>(null);
  const [isCreateChartDialogOpen, setIsCreateChartDialogOpen] = useState(false);
  const navigate = useNavigate();

  // State for JSON editing
  const [jsonContent, setJsonContent] = useState('');
  const [projectJsonContent, setProjectJsonContent] = useState('');
  
  // Debug actions
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

  // Format the JSON representation of the chart
  const getChartJsonRepresentation = () => {
    return JSON.stringify(currentChart, null, 2);
  };

  // Format the JSON representation of the project
  const getProjectJsonRepresentation = () => {
    // Create a complete project representation based on the Project interface
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

  // Update the JSON content whenever the chart changes
  useEffect(() => {
    setJsonContent(getChartJsonRepresentation());
  }, [currentChart]);

  // Update the project JSON content
  useEffect(() => {
    setProjectJsonContent(getProjectJsonRepresentation());
  }, [projectId, userCharts, project]);

  // Handle JSON content change
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonContent(e.target.value);
    setJsonError(null); // Clear any previous errors
  };

  // Handle project JSON content change
  const handleProjectJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProjectJsonContent(e.target.value);
    setProjectJsonError(null); // Clear any previous errors
  };

  // Apply edited JSON to the chart
  const saveJsonChanges = () => {
    try {
      const parsedJson = JSON.parse(jsonContent);
      setCurrentChart(parsedJson);

      // Save to database as well
      if (currentChart?.id) {
        saveChart(parsedJson).then((success: boolean) => {
          if (success) {
            setJsonError(null);
            setHasUnsavedChanges(false); // No unsaved changes since we just saved
          } else {
            setJsonError('Failed to save to database. Changes applied to chart locally only.');
            setHasUnsavedChanges(true); // Mark as having unsaved changes
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
        <div className="p-4">
          <h3 className="font-bold text-lg mb-4">Project Charts</h3>
          {userCharts && userCharts.length > 0 ? (
            <div className="space-y-3">
              {userCharts.map((chart: { id: string; name: string; description?: string }) => (
                <div
                  key={chart.id}
                  className={`p-3 rounded-md border cursor-pointer transition-all hover:bg-gray-100 ${currentChart?.id === chart.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  onClick={() => handleChartSelect(chart.id)}
                >
                  <div className="font-medium">{chart.name}</div>
                  {chart.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">{chart.description}</div>
                  )}
                </div>
              ))}
              <button
                onClick={() => setIsCreateChartDialogOpen(true)}
                className="flex items-center justify-center w-full p-2 mt-4 border border-dashed border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-all"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                <span>Create New Chart</span>
              </button>
              <CreateChartDialog 
                isOpen={isCreateChartDialogOpen} 
                onClose={() => setIsCreateChartDialogOpen(false)} 
              />
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <p className="text-gray-500">No charts found for this project</p>
              <button
                onClick={() => setIsCreateChartDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Create First Chart
              </button>
              <CreateChartDialog 
                isOpen={isCreateChartDialogOpen} 
                onClose={() => setIsCreateChartDialogOpen(false)} 
              />
            </div>
          )}
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
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium w-full"
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

  return (
    <div
      className={`flex h-full bg-white border-r border-gray-200 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-14'}`}
    >
      <div className="w-14 h-full border-r border-gray-200 flex flex-col items-center py-4">
        <div className="flex flex-col space-y-4 mt-4 items-center flex-grow">
          {sections.slice(0, 2).map((section) => (
            <button
              key={section.id}
              onClick={() => section.onClick ? section.onClick() : toggleSection(section.id)}
              className={`p-2 rounded-full transition ${activeSection === section.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              title={section.name}
            >
              {section.icon}
            </button>
          ))}
        </div>
        <div className="mt-auto flex flex-col space-y-4 mb-4 items-center">
          {sections.slice(2).map((section) => (
            <button
              key={section.id}
              onClick={() => section.onClick ? section.onClick() : toggleSection(section.id)}
              className={`p-2 rounded-full transition ${activeSection === section.id
                  ? 'bg-blue-100 text-blue-600'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                }`}
              title={`${section.name}${section.id === 'json' ? ' - Click to view project JSON data' : ''}`}
              aria-label={section.name}
            >
              {section.icon}
              {section.id === 'json' && activeSection !== 'json' && (
                <span className="absolute -right-1 -top-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse"></span>
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
            onClick={() => setIsExpanded(false)}
            className="absolute top-4 right-4 p-2 rounded-md hover:bg-gray-100 text-gray-500"
            title="Collapse sidebar"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        )}
        {activeSection && sections.find(s => s.id === activeSection && s.id !== 'project')?.content}
      </div>
    </div>
  );
};

export default Sidebar;
