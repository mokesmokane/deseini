import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { supabase } from './lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import LogoCarousel from './components/LogoCarousel';
import toast, { Toaster } from 'react-hot-toast';
import { GanttProvider } from './context/GanttContext';
import { Session } from '@supabase/supabase-js';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { DependencyViolationsProvider } from './contexts/DependencyViolationsContext';

export default function App() {
  const [projects, setProjects] = useState<Array<{ id: string; projectName: string }>>([]);
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're on the landing page (root path)
  const isLandingPage = location.pathname === '/';

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

  const handleSelectGanttChart = (chartId: string | null) => {
    navigate(`/charts/${chartId || 'new'}`);
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
    <DependencyViolationsProvider>
      <GanttProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col h-screen">
          <Toaster position="top-right" />
          <header className="bg-white shadow-sm w-full border-b border-gray-200">
            <div className="py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
              <div 
                className="cursor-pointer flex items-center" 
                onClick={navigateToLanding}
                style={{ width: '200px' }}
              >
                <LogoCarousel 
                  height="40px"
                  width="100%"
                  autoRotateInterval={5000}
                />
              </div>
              {!isLandingPage && (
                <button
                  onClick={navigateToLanding}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Back to Home
                </button>
              )}
            </div>
          </header>
          <div className="flex flex-1 overflow-hidden">
            {/* Keep the VS Code-like sidebar when not on landing page */}
            {!isLandingPage && (
              <Sidebar
                projects={projects}
                selectedProjectId={null}
                onSelectProject={handleSelectProject}
                onSelectGanttChart={handleSelectGanttChart}
              />
            )}
            <div className="flex-1 overflow-auto bg-white">
              {/* Render the appropriate route component */}
              <Outlet context={{ projects }} />
            </div>
          </div>
        </div>
      </GanttProvider>
    </DependencyViolationsProvider>
  );
}