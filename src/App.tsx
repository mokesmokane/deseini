import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { GanttProvider } from './contexts/GanttContext';
import { Session } from '@supabase/supabase-js';
import { DependencyViolationsProvider } from './contexts/DependencyViolationsContext';
import { ChartsListProvider } from './contexts/ChartsListContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { EditedSectionProvider } from './contexts/EditedSectionContext';
import { ProjectPlanProvider } from './contexts/ProjectPlanContext';
import Deseini from './Deseini';
import { LogoCarouselProvider } from './components/LogoCarouselContext';
import { MessagingProvider } from './components/landing/MessagingProvider';
import { Outlet } from 'react-router-dom';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  
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

  // Show auth UI if user explicitly requests it
  const handleShowAuth = () => {
    setShowAuth(true);
  };

  // Render appropriate layout based on authentication status
  if (!session) {
    return (
      <LogoCarouselProvider autoRotateInterval={3000}>
        <MessagingProvider>
          <div className="flex flex-col h-screen bg-white overflow-hidden">
            <main className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto bg-white">
                <Outlet />
              </div>
            </main>
          </div>
        </MessagingProvider>
      </LogoCarouselProvider>
    );
  }

  // For authenticated users, wrap with all necessary providers and show the header
  return (
    <ChartsListProvider>
      <ProjectProvider>
        <DependencyViolationsProvider>
          <GanttProvider>
            <ProjectPlanProvider>
              <EditedSectionProvider>
                <LogoCarouselProvider autoRotateInterval={3000}>
                  <div className="flex flex-col h-screen bg-white overflow-hidden">
                    <Deseini session={session} onShowAuth={handleShowAuth} />
                    <main className="flex-1 overflow-hidden">
                      <div className="h-full overflow-auto bg-white">
                        <Outlet />
                      </div>
                    </main>
                  </div>
                </LogoCarouselProvider>
              </EditedSectionProvider>
            </ProjectPlanProvider>
          </GanttProvider>
        </DependencyViolationsProvider>
      </ProjectProvider>
    </ChartsListProvider>    
  );
}