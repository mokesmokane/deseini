import { FolderIcon, SearchIcon, PlusIcon, ClockIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Project } from '../types';
import { ProjectList } from './ProjectList';
import { useProject } from '../contexts/ProjectContext';
import { useMessaging } from '../contexts/Messaging/MessagingProvider';
import { useNavigate } from 'react-router-dom';

interface SidebarProjectsPanelProps {
  projects: Project[];
  onClose: () => void;
}

export const SidebarProjectsPanel = ({ projects, onClose }: SidebarProjectsPanelProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { setNoProject } = useProject();
  const { setMessages } = useMessaging();
  const navigate = useNavigate();

  // Deduplicate projects based on ID
  const uniqueProjects = useMemo(() => {
    const uniqueMap = new Map<string, Project>();
    projects.forEach(project => {
      if (!uniqueMap.has(project.id)) {
        uniqueMap.set(project.id, project);
      }
    });
    return Array.from(uniqueMap.values());
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return uniqueProjects.filter((project) => 
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueProjects, searchQuery]);

  // Get recently updated projects
  const recentProjects = useMemo(() => {
    return [...uniqueProjects]
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);
  }, [uniqueProjects]);

  const handleCreateProject = () => {
    setNoProject();
    setMessages([]);
    navigate('/');
    onClose();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="font-semibold text-lg pl-1">Projects</div>
        <button
          className="p-1 rounded hover:bg-gray-100 transition-colors"
          onClick={onClose}
          title="Close"
          aria-label="Close projects panel"
          type="button"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5 text-gray-500"><path d="M6 6l8 8M6 14L14 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 pl-8 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <SearchIcon size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {searchQuery !== '' ? (
          <>
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2 px-2">
              <SearchIcon size={14} className="mr-1.5" />
              <span>Search Results</span>
            </div>
            {filteredProjects.length > 0 ? (
              <ProjectList projects={filteredProjects} closeDropdown={onClose} />
            ) : (
              <div className="py-4 px-2 text-center text-sm text-gray-500">
                No projects found matching "{searchQuery}"
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2 px-2">
              <ClockIcon size={14} className="mr-1.5" />
              <span>Recent</span>
            </div>
            <ProjectList projects={recentProjects} closeDropdown={onClose} />
            <div className="flex items-center text-xs font-medium text-gray-500 mt-4 mb-2 px-2">
              <FolderIcon size={14} className="mr-1.5" />
              <span>All Projects</span>
            </div>
            <ProjectList projects={uniqueProjects} closeDropdown={onClose} />
          </>
        )}
      </div>
      <div className="pt-2">
        <button
          onClick={handleCreateProject}
          className="flex w-full items-center justify-center gap-2 bg-white hover:bg-gray-100 text-black px-3 py-2 rounded-lg transition-colors text-sm font-medium border border-gray-200"
        >
          <PlusIcon size={16} />
          <span>Create New Project</span>
        </button>
      </div>
    </div>
  );
};
