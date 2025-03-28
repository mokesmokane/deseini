import React, { useEffect, useState } from 'react';
import { ChartBarIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useGantt } from '../context/GanttContext';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import ImportChartDialog from './ImportChartDialog';

interface ProjectItem {
  id: string;
  projectName: string;
}

interface OutletContextType {
  projects: ProjectItem[];
}

interface LandingPageProps {
  projects?: ProjectItem[];
}

const LandingPage: React.FC<LandingPageProps> = ({ projects: propProjects }) => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const navigate = useNavigate();
  
  // Get projects from outlet context
  const context = useOutletContext<OutletContextType>();
  
  // Use props if provided, otherwise use context
  const projects = propProjects?.length ? propProjects : context?.projects || [];
  
  // Log for debugging
  useEffect(() => {
    console.log('LandingPage - Context Projects:', context?.projects);
    console.log('LandingPage - Prop Projects:', propProjects);
    console.log('LandingPage - Using Projects:', projects);
  }, [context, propProjects, projects]);
  
  const { allCharts, importChart } = useGantt();

  const handleImportChart = async (jsonData: string) => {
    try {
      // Parse JSON to validate format
      const chartData = JSON.parse(jsonData);
      
      // Import the chart
      const chartId = await importChart(chartData);
      
      // Close dialog
      setIsImportDialogOpen(false);
      
      // Navigate to the newly imported chart
      if (chartId) {
        navigate(`/charts/${chartId}`);
      }
    } catch (error) {
      console.error('Error importing chart:', error);
      alert('Invalid JSON format or chart data');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Deseini</h1>
      
      {/* Projects Section */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            <FolderIcon className="h-6 w-6 inline-block mr-2 text-gray-600" />
            Projects
          </h2>
          <Link 
            to="/projects/new"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            New Project
          </Link>
        </div>
        
        {projects.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No projects available. Create your first project!</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
              {projects.map(project => (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                >
                  <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg text-gray-900 truncate">{project.projectName}</h3>
                    <p className="text-gray-500 text-sm mt-2">Click to view details</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
      
      {/* Charts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">
            <ChartBarIcon className="h-6 w-6 inline-block mr-2 text-gray-600" />
            Gantt Charts
          </h2>
          <button 
            onClick={() => setIsImportDialogOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Import Chart
          </button>
        </div>
        
        {!allCharts || allCharts.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500">No charts available. Import your first Gantt chart!</p>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4" style={{ minWidth: 'min-content' }}>
              {allCharts.map(chart => (
                <Link 
                  key={chart.id} 
                  to={`/charts/${chart.id}`}
                  className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                >
                  <div className="h-32 bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center">
                    <ChartBarIcon className="h-16 w-16 text-white opacity-75" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-lg text-gray-900 truncate">{chart.name}</h3>
                    <p className="text-gray-500 text-sm mt-2">Click to view chart</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>
      
      {/* Import Chart Dialog */}
      <ImportChartDialog 
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportChart}
      />
    </div>
  );
};

export default LandingPage;
