import { StarIcon } from 'lucide-react';
import { Project } from '../types';
import { useNavigate } from 'react-router-dom';
import { projectService } from '@/services/projectService';

interface ProjectListProps {
  projects: Project[];
  closeDropdown: () => void;
}

// Utility to format ISO date string to e.g. "24 Apr 2025"
function formatPrettyDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}


export const ProjectList = ({ projects, closeDropdown }: ProjectListProps) => {
  const navigate = useNavigate();

  const handleSelectProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
    closeDropdown();
  };
  
  const handleStarProject = (project: Project) => {
    projectService.starProject(project.id, !project.starred);
  };
  
  return (
    <div className="space-y-1">
      {projects.map((project: Project) => (
        <div
          key={project.id}
          onClick={() => handleSelectProject(project.id)}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-gray-100 mr-3">
              <span className="text-xs font-medium text-gray-700">
                {project.projectName.substring(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-gray-800 truncate">{project.projectName}</p>
              <p className="text-xs text-gray-500">{formatPrettyDate(project.updatedAt ?? '')}</p>
            </div>
          </div>
          <button 
            className={`ml-2 p-1 rounded-full ${
              project.starred 
                ? 'text-amber-500' 
                : 'text-gray-300 opacity-0 group-hover:opacity-100'
            } hover:bg-gray-100 transition-opacity focus:outline-none`}
            aria-label={project.starred ? "Unstar project" : "Star project"}
            onClick={() => handleStarProject(project)}
          >
            <StarIcon size={16} fill={project.starred ? "currentColor" : "none"} />
          </button>
        </div>
      ))}
    </div>
  );
};
