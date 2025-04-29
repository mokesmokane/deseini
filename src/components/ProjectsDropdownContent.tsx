import { FolderIcon, SearchIcon, PlusIcon, ClockIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Project } from '../types';
import { ProjectList } from './ProjectList';
import { useProject } from '../contexts/ProjectContext';
import { useMessaging } from '../contexts/MessagingProvider';
import { useNavigate } from 'react-router-dom';

interface ProjectsDropdownContentProps {
  projects: Project[];  
  toggleDropdown: () => void;
}

export const ProjectsDropdownContent = ({ projects, toggleDropdown }: ProjectsDropdownContentProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { setNoProject } = useProject();
  const {setMessages} = useMessaging();
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
    toggleDropdown();
  };

  return (
    <div
      className="absolute z-10 mt-2 w-80 origin-top-right transform transition-all duration-200 animate-dropdown-in rounded-xl shadow-lg bg-white/90 backdrop-blur-md border border-gray-200 overflow-hidden"
    >
      <div className="p-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <SearchIcon size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-3 py-2 bg-gray-50 border-0 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto pb-2">
        {/* Recent projects section */}
        {searchQuery === '' && (
          <div className="px-3 mb-2">
            <div className="flex items-center text-xs font-medium text-gray-500 mb-2 px-2">
              <ClockIcon size={14} className="mr-1.5" />
              <span>Recent</span>
            </div>
            <ProjectList projects={recentProjects} closeDropdown={toggleDropdown} />
          </div>
        )}

        {/* All or filtered projects */}
        <div className="px-3">
          {searchQuery !== '' ? (
            <>
              <div className="flex items-center text-xs font-medium text-gray-500 mb-2 px-2">
                <SearchIcon size={14} className="mr-1.5" />
                <span>Search Results</span>
              </div>
              {filteredProjects.length > 0 ? (
                <ProjectList projects={filteredProjects} closeDropdown={toggleDropdown} />
              ) : (
                <div className="py-4 px-2 text-center text-sm text-gray-500">
                  No projects found matching "{searchQuery}"
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center text-xs font-medium text-gray-500 mb-2 px-2">
                <FolderIcon size={14} className="mr-1.5" />
                <span>All Projects</span>
              </div>
              <ProjectList projects={uniqueProjects} closeDropdown={toggleDropdown} />
            </>
          )}
        </div>
      </div>

      {/* Create new project button */}
      <div className="p-3 border-t border-gray-100">
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
