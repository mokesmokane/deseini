import { ChevronDown, FolderIcon } from 'lucide-react';
import { ProjectsDropdownContent } from './ProjectsDropdownContent';
import { Project } from '../types';
import { useState, useRef, useEffect } from 'react';
import { useProject } from '@/contexts/ProjectContext';

interface ProjectsDropdownProps {
  projects: Project[];
}

export const ProjectsDropdown = ({ projects }: ProjectsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { project } = useProject();

  const toggleDropdown = () => setIsOpen(open => !open);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-200 bg-white hover:bg-gray-100 text-black focus:outline-none focus:ring-1 focus:ring-black ${
          isOpen
            ? 'shadow-sm'
            : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <FolderIcon size={16} />
        <span className="truncate whitespace-nowrap overflow-hidden max-w-[150px] block">{project ? project.projectName : 'Projects'}</span>
        <ChevronDown size={16} className="ml-1" />
      </button>

      {isOpen && <ProjectsDropdownContent projects={projects} toggleDropdown={toggleDropdown} />}
    </div>
  );
};
