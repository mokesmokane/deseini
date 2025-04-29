import React from 'react';
import { Navigate } from 'react-router-dom';
import { DependencyViolationsProvider } from '../contexts/DependencyViolationsContext';
import { GanttProvider } from '../contexts/GanttContext';
import { ProjectPlanProvider } from '../contexts/ProjectPlanContext';
import { EditedSectionProvider } from '../contexts/EditedSectionContext';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Get session from outlet context (passed down from App.tsx)
  const { session } = useAuth();
  
  console.log('ProtectedRoute: Session check', session ? 'authenticated' : 'not authenticated');
  
  if (!session) {
    console.log('ProtectedRoute: Redirecting to landing page');
    // Redirect to landing page if not authenticated
    return <Navigate to="/" replace />;
  }

  // Wrap children with necessary providers
  return (
    <DependencyViolationsProvider>
      <GanttProvider>
        <ProjectPlanProvider>
          <EditedSectionProvider>
            {children}
          </EditedSectionProvider>
        </ProjectPlanProvider>
      </GanttProvider>
    </DependencyViolationsProvider>
  );
};

export default ProtectedRoute;
