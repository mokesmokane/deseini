import { useState, createContext, useContext, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useDraftPlanMermaidContext } from '../contexts/DraftPlan/DraftPlanContextMermaid';
import { Section } from '../contexts/DraftPlan/types';
import toast from 'react-hot-toast';
import { getDbService } from '../services/dbServiceProvider';
import { DbServiceType } from '../services/dbServiceProvider';
import { fetchApi } from '../utils/api';

// Define the context type
interface FinalPlanContextType {
  generateFinalPlan: () => Promise<void>;
  isGeneratingFinalPlan: boolean;
  generationProgress: string;
}

// Create the context with a default value
const FinalPlanContext = createContext<FinalPlanContextType | undefined>(undefined);

// Provider props interface
interface FinalPlanProviderProps {
  children: ReactNode;
}

// Create the provider component
export const FinalPlanProvider = ({ children }: FinalPlanProviderProps) => {
  const { project, fetchProjectCharts } = useProject();
  const { sections: draftPlanSections } = useDraftPlanMermaidContext();
  // const { setCurrentChart, setHasUnsavedChanges } = useGantt();
  // const { saveChart } = useChartsList();
  const { projectId } = useParams<{ projectId: string }>();

  const [isGeneratingFinalPlan, setIsGeneratingFinalPlan] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const dbService = getDbService(DbServiceType.SUPABASE);

  const createMarkdownFromSections = (sections: Section[]) => {
    return sections.map(section => {
      const tasks = section.tasks.map(task => {
        if (task.type === 'milestone') {
          return `- Milestone: ${task.label} - ${task.startDate ? new Date(task.startDate).toLocaleDateString() : ''}`;
        } else {
          const startDate = task.startDate ? new Date(task.startDate).toLocaleDateString() : '';
          const durationText = task.duration ? ` (${task.duration} days)` : '';
          return `- Task: ${task.label} - ${startDate}${durationText}`;
        }
      }).join('\n');
      return `## ${section.name}\n${tasks}`;
    }).join('\n');
  };

  const generateFinalPlan = async () => {
    try {
      setIsGeneratingFinalPlan(true);
      setGenerationProgress('Generating final project plan...');

      const projectContext = project;
      if (!projectContext) throw new Error('No project context available');

      const draftPlanMarkdown = createMarkdownFromSections(draftPlanSections);

      setGenerationProgress('Generating plan...');
      const response = await fetchApi('/api/generate-final-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectContext, messages: [], draftPlanMarkdown })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate final plan');
      }

      setGenerationProgress('Processing response...');
      const finalPlan = await response.json();

      // setCurrentChart(finalPlan);
      // setHasUnsavedChanges(true);

      setGenerationProgress('Saving chart to database...');
      const saved = await dbService.saveChart(finalPlan);
      if (!saved) {
        toast.error('Failed to save chart');
      } else if (projectId) {
        setGenerationProgress('Linking chart to project...');
        const linkError = await dbService.linkChartToProject(finalPlan.id, projectId);
        if (linkError) {
          toast.error('Failed to link chart to project');
        } else {
          await fetchProjectCharts(projectId);
          toast.success('Final project plan generated, saved, and linked!');
        }
      }
    } catch (error) {
      console.error('Error generating final plan:', error);
      toast.error(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGeneratingFinalPlan(false);
      setGenerationProgress('');
    }
  };

  // Provide the context value
  const contextValue: FinalPlanContextType = {
    generateFinalPlan,
    isGeneratingFinalPlan,
    generationProgress
  };

  return (
    <FinalPlanContext.Provider value={contextValue}>
      {children}
    </FinalPlanContext.Provider>
  );
};

// Custom hook to use the context
export const useFinalPlan = (): FinalPlanContextType => {
  const context = useContext(FinalPlanContext);
  if (context === undefined) {
    throw new Error('useFinalPlan must be used within a FinalPlanProvider');
  }
  return context;
};
