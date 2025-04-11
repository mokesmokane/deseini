import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import LogoCarousel from './components/LogoCarousel';
import toast, { Toaster } from 'react-hot-toast';
import { GanttProvider } from './contexts/GanttContext';
import { Session } from '@supabase/supabase-js';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { DependencyViolationsProvider } from './contexts/DependencyViolationsContext';
import { ChartsListProvider } from './contexts/ChartsListContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { EditedSectionProvider } from './contexts/EditedSectionContext';
import { ProjectPlanProvider } from './contexts/ProjectPlanContext';

export default function App() {
  const [projects, setProjects] = useState<Array<{ id: string; projectName: string }>>([]);
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId?: string }>(); // Get projectId from URL params
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchProjects();
    }
  }, [session]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, project_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to fetch projects');
      return;
    }

    if (data) {
      setProjects(data.map(p => ({
        id: p.id,
        projectName: p.project_name
      })));
    }
  };

  const navigateToLanding = () => {
    navigate('/');
  };

  const handleSelectProject = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-white shadow-lg rounded-lg">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
          />
        </div>
      </div>
    );
  }

  return (
    <ChartsListProvider>
      
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
      <Toaster position="top-right" />
      <header className="bg-white shadow-sm w-full border-b border-gray-200">
        <div className="py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div 
            className="cursor-pointer flex items-center" 
            onClick={navigateToLanding}
            style={{ minWidth: '150px' }} // Adjust width as needed
          >
            <LogoCarousel 
              height="40px"
              width="100%"
              autoRotateInterval={5000}
            />
          </div>
         
          {/* Project Dropdown - Conditionally Rendered */}
          {projectId && projects.length > 0 && (
            <div className="flex-1 flex justify-start px-4"> 
              <select
                value={projectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="block w-auto max-w-xs pl-3 pr-10 py-2 text-base focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white appearance-none border-none"
                aria-label="Select Project"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectName}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Placeholder for potential right-aligned items if needed */}
          <div style={{ minWidth: '150px' }}></div> 
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto bg-white">
          {/* Render the appropriate route component */}
           <DependencyViolationsProvider>
            <GanttProvider>
              <ProjectProvider>
                <ProjectPlanProvider 
                  projectId={projectId || null} 
                  project={projects.find(p => p.id === projectId) || null} 
                  userCharts={[]}
                >
                  <EditedSectionProvider>
                    <Outlet context={{ projects }} />
                  </EditedSectionProvider>
                </ProjectPlanProvider>
              </ProjectProvider>
            </GanttProvider>
          </DependencyViolationsProvider>
        </div>
      </div>
    </div>
  </ChartsListProvider>    
  );
}