import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import Sidebar from '../components/Sidebar';
import Canvas from '../components/Canvas.tsx';
import { MessagesProvider } from '../contexts/MessagesContext';
import { DraftPlanMermaidProvider } from '../contexts/DraftPlan/DraftPlanContextMermaid.tsx';
import { DraftPlanFlowProvider } from '@/contexts/useDraftPlanFlow.tsx';
import { DraftPlanProvider } from '@/contexts/DraftPlanContext.tsx';
import { FinalPlanProvider } from '../hooks/useFinalPlan';

const CanvasView = () => {
  const { projectId } = useParams<{ projectId: string; chartId?: string }>();
  const { 
    project, 
    isLoading: isLoadingProject,
    fetchProject, 
    handleInitiateTaskGeneration,
    userCharts,
    fetchProjectCharts
  } = useProject();

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

  console.log(`[ProjectView] Rendering: isLoadingProject=${isLoadingProject}, projectExists=${!!project}`);

  // Always render the main layout structure
  // Wrap the entire view content with MessagesProvider
  return (
        <DraftPlanProvider>
      <DraftPlanMermaidProvider><DraftPlanFlowProvider>
<FinalPlanProvider>
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
        <Sidebar section="create"/>
        
        <div className="flex-1 overflow-auto">
          <Canvas />
        </div>
      </div>
      
    </MessagesProvider>
    </FinalPlanProvider>  
    </DraftPlanFlowProvider>
    </DraftPlanMermaidProvider>
    </DraftPlanProvider>
  );
};

export default CanvasView;
