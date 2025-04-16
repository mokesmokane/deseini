import { useNavigate, useParams } from 'react-router-dom';
import { GanttChart } from '../components/chart/GanttChart';
import { useEffect, useState } from 'react';
import { useProject } from '../contexts/ProjectContext';
import Sidebar from '../components/Sidebar';
import ProjectForm from '../components/ProjectForm';
import Canvas from '../components/Canvas.tsx';
import { MessagesProvider } from '../contexts/MessagesContext';
import { ProjectPlanProvider } from '../contexts/ProjectPlanContext';
import { DraftPlanMermaidProvider } from '../contexts/DraftPlanContextMermaid';
// import ProjectPlanTrigger from '../components/ProjectPlanTrigger';
import { DraftPlanProvider } from '../contexts/DraftPlanContext';

const ProjectView = () => {
  const { projectId, chartId } = useParams<{ projectId: string; chartId?: string }>();
  const { 
    project, 
    isLoading: isLoadingProject,
    errorMessage,
    fetchProject, 
    handleInitiateTaskGeneration,
    userCharts,
    fetchProjectCharts
  } = useProject();
  const [activeSidebarSection, setActiveSidebarSection] = useState<string | null>(null);

  // Only handle project loading via useEffect
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      if (project?.id !== projectId) {
        console.log(`ProjectView: Fetching project ${projectId}. Current project ID: ${project?.id}`);
        fetchProject(projectId!);
      }
    }
  }, [projectId, fetchProject, project?.id]);

  // Fetch charts when project is loaded or projectId changes
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      fetchProjectCharts(projectId);
    }
  }, [projectId, fetchProjectCharts]); // Added fetchProjectCharts dependency

  // Log when activeSidebarSection changes
  useEffect(() => {
    console.log(`[ProjectView] useEffect: activeSidebarSection updated to: ${activeSidebarSection}`);
  }, [activeSidebarSection]);

  console.log(`[ProjectView] Rendering: activeSidebarSection=${activeSidebarSection}, isLoadingProject=${isLoadingProject}, projectExists=${!!project}`);

  // Always render the main layout structure
  // Wrap the entire view content with MessagesProvider
  return (
      <DraftPlanProvider>
      <DraftPlanMermaidProvider>
    <MessagesProvider
      // Conditionally pass projectId only when it's valid and not 'new'
      projectId={(projectId && projectId !== 'new') ? projectId : ''} 
      // Pass project and userCharts, provider should handle null/empty initial state
      project={project} 
      userCharts={userCharts}
      onInitiateTaskGeneration={handleInitiateTaskGeneration}
    >

      <div className="h-full flex">
        {/* Sidebar is now always inside the provider */} 
        <Sidebar onActiveSectionChange={setActiveSidebarSection} />
        
        <div className="flex-1 overflow-auto">
          {/* Conditional rendering of the main content area */}
          {isLoadingProject ? (
            <div className="p-8 text-center">Loading project...</div>
          ) : errorMessage ? (
            <div className="p-8 text-center">
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md inline-block">
                <p className="font-medium">Error loading project</p>
                <p className="text-sm">{errorMessage}</p>
              </div>
            </div>
          ) : activeSidebarSection === 'create' ? (
            <Canvas /> // Canvas reads from MessagesContext
          ) : chartId ? (
            <GanttChart />
          ) : (
            <ProjectForm />
          )}
        </div>
      </div>
      
    </MessagesProvider>
    </DraftPlanMermaidProvider>
    </DraftPlanProvider>
  );
};

export default ProjectView;
