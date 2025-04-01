import { useNavigate, useParams } from 'react-router-dom';
import { GanttChart } from '../components/chart/GanttChart';
import { useEffect } from 'react';
import { useProject } from '../contexts/ProjectContext';
import Sidebar from '../components/Sidebar';
import ProjectForm from '../components/ProjectForm';

const ProjectView = () => {
  const { projectId, chartId } = useParams<{ projectId: string; chartId?: string }>();
  const { project, isLoading, errorMessage, fetchProject } = useProject();

  // Only handle project loading via useEffect
  useEffect(() => {
    if (projectId && projectId !== 'new') {
      if (project?.id !== projectId) {
        console.log(`ProjectView: Fetching project ${projectId}. Current project ID: ${project?.id}`);
        fetchProject(projectId!);
      }
    }
  }, [projectId, fetchProject, project?.id]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading chart...</div>;
  }

  if (errorMessage) {
    return (
      <div className="h-full flex">
        <Sidebar />
        <div className="flex-1 p-8 text-center">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md inline-block">
            <p className="font-medium">Error loading project</p>
            <p className="text-sm">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      <Sidebar />
      <div className="flex-1">
        {chartId ? <GanttChart /> : <ProjectForm />}
      </div>
    </div>
  );
};

export default ProjectView;
