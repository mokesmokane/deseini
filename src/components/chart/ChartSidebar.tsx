import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  BugAntIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { useGantt } from '../../contexts/GanttContext';
import { useChartsList } from '../../contexts/ChartsListContext';

// Define sidebar menu sections following the Single Responsibility Principle
interface SidebarSection {
  id: string;
  name: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const ChartSidebar: React.FC = () => {
  // State for managing sidebar expansion and active section
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { currentChart, setCurrentChart, setHasUnsavedChanges } = useGantt();
  const { saveChart } = useChartsList();

  // State for JSON editing
  const [jsonContent, setJsonContent] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

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

  // Update the JSON content whenever the chart changes
  useEffect(() => {
    setJsonContent(getChartJsonRepresentation());
  }, [currentChart]);

  // Handle JSON content change
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonContent(e.target.value);
    setJsonError(null); // Clear any previous errors
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

  // Define sidebar sections - reordered with settings and debug at the bottom
  const sections: SidebarSection[] = [
    {
      id: 'info',
      name: 'Information',
      icon: <InformationCircleIcon className="h-6 w-6" />,
      content: (
        <div className="p-4">
          <h3 className="font-bold text-lg mb-4">Chart Information</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Tasks:</span> {currentChart?.tasks.length || 0}</p>
            <p><span className="font-medium">Dependencies:</span> {currentChart?.dependencies?.length || 0}</p>
            <p><span className="font-medium">Milestones:</span> {currentChart?.milestones?.length || 0}</p>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Help</h4>
              <ul className="list-disc list-inside text-sm">
                <li>Click on a task to view or edit details</li>
                <li>Drag tasks to adjust their timeline</li>
                <li>Connect tasks to create dependencies</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'project',
      name: 'Project Details',
      icon: <ClipboardDocumentListIcon className="h-6 w-6" />,
      content: (
        <div className="p-4">
          <h3 className="font-bold text-lg mb-4">Project Details</h3>
          <div className="space-y-2">
            <p><span className="font-medium">Project Name:</span> {currentChart?.name || 'Untitled'}</p>
            <p><span className="font-medium">Start Date:</span> {currentChart?.start || 'Not set'}</p>
            <p><span className="font-medium">End Date:</span> {currentChart?.end || 'Not set'}</p>
            {currentChart?.description && (
              <div className="mt-2">
                <p className="font-medium">Description:</p>
                <p className="text-sm mt-1">{currentChart.description}</p>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'settings',
      name: 'Settings',
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
          
          <h4 className="font-medium mb-2">JSON Representation</h4>
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
    }
  ];

  // Handler for toggling sections
  const toggleSection = (sectionId: string) => {
    if (activeSection === sectionId && isExpanded) {
      // If clicking the active section, collapse the sidebar
      setIsExpanded(false);
      setActiveSection(null);
    } else {
      // Otherwise, expand and set active section
      setIsExpanded(true);
      setActiveSection(sectionId);
    }
  };

  return (
    <div 
      className={`h-full bg-white shadow-lg border-r border-gray-200 transition-all duration-300 flex ${
        isExpanded ? 'w-[32rem]' : 'w-16'
      }`}
    >
      {/* Icons sidebar */}
      <div className="w-16 h-full py-4 flex flex-col border-r border-gray-200">
        {/* Top section icons */}
        <div className="flex-1 flex flex-col items-center">
          {sections.slice(0, 2).map((section) => (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`p-2 mb-4 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={section.name}
            >
              {section.icon}
            </button>
          ))}
        </div>
        
        {/* Bottom section icons */}
        <div className="flex flex-col items-center">
          {sections.slice(2).map((section) => (
            <button
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`p-2 mb-4 rounded-lg transition-colors ${
                activeSection === section.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={section.name}
            >
              {section.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded content area */}
      <div 
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute'
        }`}
      >
        {/* Toggle button */}
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
        </button>

        {/* Section content */}
        {activeSection && (
          <div className="mt-8">
            {sections.find(section => section.id === activeSection)?.content}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartSidebar;
