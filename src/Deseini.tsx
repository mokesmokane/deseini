import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { projectService } from './services/projectService';
import LogoCarousel from './components/LogoCarousel';
import toast, { Toaster } from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';
import { Outlet, useNavigate } from 'react-router-dom';
import AccountDropdown  from './components/AccountDropdown';
import { ProjectsDropdown } from './components/ProjectsDropdown';
import { Project } from './services/projectService';
import { useProject } from './contexts/ProjectContext';

interface DeseiniProps {
  session: Session | null;
  onShowAuth?: () => void;
}

export default function Deseini({ session, onShowAuth }: DeseiniProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const navigate = useNavigate();
  const { setProject } = useProject();
  

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    if (!session?.user?.id) return;
    try {
      const serviceProjects = await projectService.getProjectsByUser(session.user.id);
      const uiProjects = serviceProjects.map(p => ({
        id: p.id,
        projectName: p.projectName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        starred: false
      }));
      setProjects(uiProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
    }
  };

  const navigateToLanding = () => {
    setProject(null);
    navigate('/');
  };

  return (
    <>
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm w-full border-b border-gray-200 h-16 flex-shrink-0">
        <div className="py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div 
            className="cursor-pointer flex items-center" 
            onClick={navigateToLanding}
            style={{ minWidth: '150px' }} // Adjust width as needed
          >
            <LogoCarousel 
              height="40px"
              width="100%"
            />
          </div>
         
          {/* Project Dropdown - Always Rendered if Projects Exist */}
          {projects.length > 0 && (
            <div className="flex-1 flex justify-start px-4">
              <ProjectsDropdown projects={projects} />
            </div>
          )}
          
          {/* Account Dropdown */}
          <div style={{ minWidth: '150px' }} className="flex justify-end">
            <AccountDropdown
              userEmail={session?.user?.email}
              onAccount={() => {
                // Placeholder: navigate to account/profile page
                toast('Account clicked');
              }}
              onLogout={async () => {
                await supabase.auth.signOut();
                toast.success('Logged out');
                navigate('/');
              }}
            />
          </div>
        </div>
      </header>
      <Outlet context={{ projects }} />
    </>
  );
}