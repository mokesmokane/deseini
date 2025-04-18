import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProject } from '../contexts/ProjectContext';
import { useDraftPlanMermaidContext, Section } from '../contexts/DraftPlanContextMermaid';
import { useGantt } from '../contexts/GanttContext';
import { useChartsList } from '../contexts/ChartsListContext';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export const useFinalPlan = () => {
  const { project, fetchProjectCharts } = useProject();
  const { sections: draftPlanSections } = useDraftPlanMermaidContext();
  const { setCurrentChart, setHasUnsavedChanges } = useGantt();
  const { saveChart } = useChartsList();
  const { projectId } = useParams<{ projectId: string }>();

  const [isGeneratingFinalPlan, setIsGeneratingFinalPlan] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');

  const createMarkdownFromSections = (sections: Section[]) => {
    return sections.map(section => {
      const tasks = section.tasks.map(task => {
        if (task.type === 'milestone') {
          return `- Milestone: ${task.label} - ${new Date(task.startDate).toLocaleDateString()}`;
        } else {
          const startDate = new Date(task.startDate).toLocaleDateString();
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

      setGenerationProgress('Calling API to generate final plan...');
      const response = await fetch('/api/generate-final-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectContext, messages: [], draftPlanMarkdown })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate final plan');
      }

      setGenerationProgress('Processing response...');
      const finalPlan = await response.json();

      setCurrentChart(finalPlan);
      setHasUnsavedChanges(true);

      setGenerationProgress('Saving chart to database...');
      const saved = await saveChart(finalPlan);
      if (!saved) {
        toast.error('Failed to save chart');
      } else if (projectId) {
        setGenerationProgress('Linking chart to project...');
        const { error: linkError } = await supabase
          .from('project_charts')
          .insert({ project_id: projectId, chart_id: finalPlan.id });
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

  return { generateFinalPlan, isGeneratingFinalPlan, generationProgress };
};
