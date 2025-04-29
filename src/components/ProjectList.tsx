import { StarIcon } from 'lucide-react';
import { Project } from '../types';
import { useNavigate } from 'react-router-dom';
import { projectService } from '@/services/projectService';

interface ProjectListProps {
  projects: Project[];
  closeDropdown: () => void;
}

// Utility to format ISO date string to e.g. "24 Apr 2025"
function formatPrettyDate(dateStr: string | null | undefined) {
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

  const handleSelectProject = (projectId: string, event: React.MouseEvent) => {
    // Prevent any parent handlers from executing
    event.preventDefault();
    event.stopPropagation();
    
    console.log(`Navigating to project: ${projectId}`);
    
    // Close dropdown first to avoid any potential state issues
    closeDropdown();
    
    // Add slight delay to ensure dropdown is closed before navigation
    setTimeout(() => {
      navigate(`/projects/${projectId}`);
    }, 10);
  };
  
  const handleStarProject = (project: Project, event: React.MouseEvent) => {
    event.stopPropagation();
    projectService.starProject(project.id, !project.starred);
  };
  
  return (
    <div className="space-y-1">
      {projects.map((project: Project) => (
        <div
          key={project.id}
          onClick={(e) => handleSelectProject(project.id, e)}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
        >
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded bg-gray-100 mr-3">
              <span className="text-xs font-medium text-gray-700">
                {project.projectName.substring(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="truncate">
              <div className="text-sm font-medium text-gray-900 truncate">
                {project.projectName}
              </div>
              <p className="text-xs text-gray-500">
                {formatPrettyDate(project.updatedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => handleStarProject(project, e)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-gray-100"
          >
            <StarIcon 
              size={16} 
              className={project.starred ? "fill-yellow-400 text-yellow-400" : "text-gray-400"} 
            />
          </button>
        </div>
      ))}
    </div>
  );
};
