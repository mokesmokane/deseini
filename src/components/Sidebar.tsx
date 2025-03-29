// React is needed for JSX transformation
import { FolderIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useGantt } from '../contexts/GanttContext';

// Import example chart data
import example1 from '../example_charts/example1.json';
import example2 from '../example_charts/example2.json';

interface SidebarProps {
  projects: Array<{
    id: string;
    projectName: string;
  }>;
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onSelectGanttChart?: (chartId: string) => void;
}

export default function Sidebar({ 
  projects, 
  selectedProjectId, 
  onSelectProject,
  onSelectGanttChart
}: SidebarProps) {
  const [activeSection, setActiveSection] = useState<'projects' | 'charts'>('projects');
  const { allCharts, currentChart, isLoading, setCurrentChartDirectly } = useGantt();
  const [exampleCharts] = useState([
    { id: 'example1', name: 'Car Design Example', data: example1 },
    { id: 'example2', name: 'Project Example 2', data: example2 }
  ]);

  const handleExampleChartClick = (exampleId: string) => {
    const example = exampleCharts.find(ex => ex.id === exampleId);
    if (example && setCurrentChartDirectly) {
      // Create a proper chart object based on the example data
      // The JSON file already contains a complete chart structure
      const exampleChart = {
        ...example.data,
        id: exampleId, // Use example ID
        name: `${example.data.name} (Example)` // Mark as an example
      };
      
      console.log("Loading example chart:", exampleChart);
      
      // Set the current chart directly without saving to the database
      setCurrentChartDirectly(exampleChart);
      
      // Trigger the sidebar's onSelectGanttChart handler to update the UI state
      if (onSelectGanttChart) {
        onSelectGanttChart(exampleId);
      }
    }
  };

  return (
    <div className="flex h-full">
      {/* VS Code-like vertical icon tabs */}
      <div className="w-12 bg-gray-100 border-r border-gray-200 flex flex-col items-center py-4">
        <button
          className={`w-10 h-10 mb-2 flex items-center justify-center rounded-md transition-colors ${
            activeSection === 'projects' 
              ? 'bg-white text-gray-800 shadow-sm' 
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setActiveSection('projects')}
          title="Projects"
        >
          <FolderIcon className="h-5 w-5" />
        </button>
        <button
          className={`w-10 h-10 mb-2 flex items-center justify-center rounded-md transition-colors ${
            activeSection === 'charts' 
              ? 'bg-white text-gray-800 shadow-sm' 
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'
          }`}
          onClick={() => setActiveSection('charts')}
          title="Gantt Charts"
        >
          <ChartBarIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Content area */}
      <div className="w-52 bg-white border-r border-gray-200 overflow-auto p-2">
        {/* Section title */}
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 pl-2">
          {activeSection === 'projects' ? 'Projects' : 'Gantt Charts'}
        </div>
        
        {activeSection === 'projects' ? (
          <div className="space-y-1">
            {projects.length === 0 ? (
              <div className="text-gray-400 text-sm py-2 px-2">No projects available</div>
            ) : (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                    selectedProjectId === project.id
                      ? 'bg-gray-200 text-gray-800 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="truncate">{project.projectName}</span>
                </button>
              ))
            )}
          </div>
        ) : (
          <div>
            {/* Existing Charts Section */}
            <div className="space-y-1 mb-4">
              {isLoading ? (
                <div className="text-gray-400 text-sm py-2 px-2">Loading charts...</div>
              ) : allCharts.length === 0 ? (
                <div className="text-gray-400 text-sm py-2 px-2">No charts available</div>
              ) : (
                allCharts.map((chart) => (
                  <button
                    key={chart.id}
                    onClick={() => onSelectGanttChart && onSelectGanttChart(chart.id)}
                    className={`w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                      currentChart?.id === chart.id
                        ? 'bg-gray-200 text-gray-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">{chart.name}</span>
                  </button>
                ))
              )}
              
              {/* New Chart Button */}
              <button
                className="w-full flex items-center px-2 py-1.5 mt-2 text-sm rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => onSelectGanttChart && onSelectGanttChart('new')}
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>New Chart</span>
              </button>
            </div>
            
            {/* Example Charts Section */}
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 pl-2 mt-4">
                Example Charts
              </div>
              <div className="space-y-1">
                {exampleCharts.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => handleExampleChartClick(example.id)}
                    className="w-full flex items-center px-2 py-1.5 text-sm rounded-md text-gray-600 hover:bg-gray-100"
                  >
                    <span className="truncate">{example.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}