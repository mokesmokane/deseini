import React from 'react';
import { useProjectPlan } from '../contexts/ProjectPlanContext';
import ProjectPlanDiff from './ProjectPlanDiff';

/**
 * Component that displays the current project plan generation progress
 * and integrates the diff visualization when a plan is being updated.
 */
const ProjectPlanProgress: React.FC = () => {
  const { 
    currentStep, 
    isGeneratingProjectPlan,
    error
  } = useProjectPlan();

  // Don't render anything if not actively working with plans
  if (currentStep === 'idle' && !isGeneratingProjectPlan) {
    return null;
  }

  return (
    <div className="project-plan-progress p-4 border border-gray-200 rounded-lg shadow-sm mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Project Plan</h2>
        <div className="text-sm px-2 py-1 rounded-full bg-blue-100 text-blue-800">
          {currentStep === 'generating' ? 'Generating...' : 
           currentStep === 'reviewing' ? 'Ready for Review' :
           currentStep === 'finalizing' ? 'Finalizing' : 'Preparing'}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Render the diff visualization when generating */}
      {currentStep === 'generating' && <ProjectPlanDiff />}
      
      {/* Simple loading indicator as fallback */}
      {isGeneratingProjectPlan && currentStep === 'generating' && (
        <div className="flex items-center space-x-2 mt-4">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
          </div>
          <span className="text-sm text-gray-600">Analyzing and processing...</span>
        </div>
      )}
    </div>
  );
};

export default ProjectPlanProgress;
