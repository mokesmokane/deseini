import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { GanttProvider } from './contexts/GanttContext';
import { Session } from '@supabase/supabase-js';
import { DependencyViolationsProvider } from './contexts/DependencyViolationsContext';
import { ChartsListProvider } from './contexts/ChartsListContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { EditedSectionProvider } from './contexts/EditedSectionContext';
import { ProjectPlanProvider } from './contexts/ProjectPlanContext';
import Deseini from './Deseini';
import { LogoCarouselProvider } from './components/LogoCarouselContext';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  
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
      <ProjectProvider>
           <DependencyViolationsProvider>
            <GanttProvider>
                <ProjectPlanProvider >
                  <EditedSectionProvider>
                  <LogoCarouselProvider autoRotateInterval={3000}>
                    <Deseini session={session} />
                  </LogoCarouselProvider>
                  </EditedSectionProvider>
                </ProjectPlanProvider>
            </GanttProvider>
          </DependencyViolationsProvider>
        </ProjectProvider>
      </ChartsListProvider>    
  );
}