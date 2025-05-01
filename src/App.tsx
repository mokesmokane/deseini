import { Outlet } from 'react-router-dom';
import Deseini from './Deseini';
import { LogoCarouselProvider } from './components/LogoCarouselContext';
import { MessagingProvider } from './contexts/Messaging/MessagingProvider';
import { DraftMarkdownProvider } from './components/landing/DraftMarkdownProvider';
import { ProjectProvider } from './contexts/ProjectContext';
import { ChartsListProvider } from './contexts/ChartsListContext';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { DraftPlanProvider } from './contexts/DraftPlanContext';
import { DraftPlanMermaidProvider } from './contexts/DraftPlan/DraftPlanContextMermaid';
import { DraftPlanFlowProvider } from './contexts/useDraftPlanFlow';
import { FinalPlanProvider } from './hooks/useFinalPlan';
import { useState, useEffect } from 'react';

// App content that depends on authentication state
const AppContent = () => {
  const { session, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  // Render appropriate layout based on authentication status
  if (!session) {
    return (
      
            <div className="flex flex-col h-screen bg-white overflow-hidden">
              <main className="flex-1 overflow-hidden">
                <div className="h-full overflow-auto bg-white">
                  <Outlet context={{ session }} />
                </div>
              </main>
            </div>
    );
  }

  // For authenticated users, provide necessary context
  return (
          <div className="flex flex-col h-screen bg-white overflow-hidden">
            <Deseini />
            <main className="flex-1 overflow-hidden">
              <div className="h-full overflow-auto bg-white">
                <Outlet context={{ session }} />
              </div>
            </main>
          </div>
  );
};

// Root component that will provide auth and reset state
const StateManager = () => {
  const { session } = useAuth();
  const [stateKey, setStateKey] = useState('initial');
  
  // Reset state when auth changes
  useEffect(() => {
    // Generate a new key when auth state changes
    // This forces all components to remount
    setStateKey(session ? `auth-${session?.user?.id}-${Date.now()}` : `logged-out-${Date.now()}`);
    
    // Clear any localStorage items that might be persisting state
    if (!session) {
      // Clear specific items that might contain user data
      localStorage.removeItem('deseini-messages');
      localStorage.removeItem('deseini-conversation');
      localStorage.removeItem('deseini-project');
      
      // Optional: clear session storage as well
      sessionStorage.clear();
      
      // Force reload all contexts by adding timestamp to the key
      setStateKey(`logged-out-${Date.now()}`);
    }
  }, [session]);
  
  return (
    <LogoCarouselProvider autoRotateInterval={3000}>
      <ProjectProvider>
        <DraftMarkdownProvider>
          <DraftPlanProvider>
            <DraftPlanMermaidProvider>
              <DraftPlanFlowProvider>
                <FinalPlanProvider>
                  <ChartsListProvider>
                    <MessagingProvider>
                      {/* Using key to force remounting and state reset */}
                      <AppContent key={stateKey} />
                    </MessagingProvider>
                  </ChartsListProvider>
                </FinalPlanProvider>
              </DraftPlanFlowProvider>
            </DraftPlanMermaidProvider>
          </DraftPlanProvider>
        </DraftMarkdownProvider>
      </ProjectProvider>
    </LogoCarouselProvider>
  );
};

// Main App component wraps everything with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <StateManager />
    </AuthProvider>
  );
}