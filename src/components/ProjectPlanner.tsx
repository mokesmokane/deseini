// Currently not being used - maintained for future UI implementation
import React from 'react';
import { useMessages } from '../contexts/MessagesContext';
import { useProjectPlan } from '../contexts/ProjectPlanContext';

interface ProjectPlannerProps {
  onPlanFinalized?: (plan: string) => void;
}

const ProjectPlanner: React.FC<ProjectPlannerProps> = ({ onPlanFinalized }) => {
  const { messages } = useMessages();
  const { 
    projectPlan, 
    generateProjectPlan,
  } = useProjectPlan();

  const handleGeneratePlan = async () => {
    await generateProjectPlan(messages);
  };

  return (
    <div className="project-planner">
      {/* UI implementation will be added in the future */}
      <button onClick={handleGeneratePlan} style={{ display: 'none' }}>
        Generate Plan
      </button>
    </div>
  );
};

export default ProjectPlanner;
