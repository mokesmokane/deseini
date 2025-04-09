import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { ChatMessage, Project, Chart } from '../types';
import { toast } from 'react-hot-toast';

// Define the steps in the generation process
export type PlanGenerationStep = 'idle' | 'generating' | 'reviewing' | 'finalizing';

// Diff types for project plan comparison
export type DiffType = 'added' | 'removed' | 'unchanged';

// Interface for diff segments
export interface DiffSegment {
  text: string;
  type: DiffType;
  processed: boolean; // Tracks if this segment has been processed in the UI
}

interface ProjectPlanContextProps {
  currentText: string | null;
  previousText: string | null;
  setCurrentText: (text: string | null) => void;
  isStreaming: boolean;
  
  setIsStreaming: (streaming: boolean) => void;
  currentLineNumber: number;
  setCurrentLineNumber: (lineNumber: number) => void;
  generateProjectPlan: (messages: ChatMessage[]) => Promise<void>;
  confirmChanges: (confirm: boolean) => Promise<void>;
  reset: () => void;
  editMarkdownSection: (sectionRange: {start: number, end: number}, instruction: string) => Promise<boolean>;
}

interface ProjectPlanProviderProps {
  children: ReactNode;
  projectId: string | null;
  project: Project | null;
  userCharts: Chart[];
}

const ProjectPlanContext = createContext<ProjectPlanContextProps | undefined>(undefined);

const streamLines = async (
  currentText: string,
  reader: ReadableStreamDefaultReader<string>,
  onLineUpdate: (lineNumber: number, text: string) => void
): Promise<void> => {
  const currentLines = currentText.split('\n');
  let workingLines = [...currentLines];
  let buffer = '';
  let lineIndex = 0;
  
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    
    try {
      // Try to parse the value as JSON
      const lines = value.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataContent = line.substring(6);
          try {
            const jsonData = JSON.parse(dataContent);
            if (jsonData && jsonData.chunk) {
              // Extract the chunk text
              buffer += jsonData.chunk;
            }
          } catch (e) {
            // If JSON parsing fails, treat as plain text
            console.warn("Failed to parse JSON from data line:", e);
            buffer += dataContent;
          }
        } else {
          // Handle non-data lines as plain text
          buffer += line;
        }
      }
    } catch (e) {
      // Fallback if there's any error in parsing
      console.warn("Error processing stream value:", e);
      buffer += value;
    }
    
    // Process any complete lines in the buffer
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    
    for (const line of lines) {
      // Ensure the workingLines array has enough lines
      while (workingLines.length <= lineIndex) {
        workingLines.push('');
      }
      
      workingLines[lineIndex] = line;
      
      const updatedText = workingLines.join('\n');
      onLineUpdate(lineIndex, updatedText);
      lineIndex++;
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Final line flush if there's any remaining data in the buffer
  if (buffer.length > 0) {
    while (workingLines.length <= lineIndex) {
      workingLines.push('');
    }
    
    workingLines[lineIndex] = buffer;
    const updatedText = workingLines.join('\n');
    onLineUpdate(lineIndex, updatedText);
  }
  
  // Trim any remaining lines from the original text if needed
  if (lineIndex < currentLines.length - 1) {
    workingLines = workingLines.slice(0, lineIndex + 1);
    const finalText = workingLines.join('\n');
    onLineUpdate(lineIndex, finalText);
  }
  
  return Promise.resolve();
}

export function ProjectPlanProvider({ 
  children, 
  projectId, 
  project, 
  userCharts
}: ProjectPlanProviderProps) {

  const [currentText, setCurrentText] = useState<string | null>(null);
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentLineNumber, setCurrentLineNumber] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  const projectIdRef = useRef(projectId);
  const projectRef = useRef(project);
  const userChartsRef = useRef(userCharts);
  const previousPlanRef = useRef<string | null>(null); // Store previous plan for diffing

  // Update refs when props change
  React.useEffect(() => {
    projectIdRef.current = projectId;
    projectRef.current = project;
    userChartsRef.current = userCharts;
  }, [projectId, project, userCharts]);

  // Reset diff segments when project plan changes
  React.useEffect(() => {
    if (currentText !== null && !isStreaming) {
      previousPlanRef.current = currentText;
    }
  }, [currentText, isStreaming]);

  const getProjectJsonRepresentation = () => {
    const currentProject = projectRef.current;
    if (!currentProject) return null;
    return {
      id: projectIdRef.current,
      projectName: currentProject.projectName || '',
      description: currentProject.description || '',
      roles: currentProject.roles || [],
      charts: userChartsRef.current || []
    };
  };

  const confirmChanges = async (confirm: boolean) => {
    if (confirm) {
      // Apply changes
      setPreviousText(currentText);
      previousPlanRef.current = currentText;
    } else {
      // Revert changes
      setCurrentText(previousText);
    }
  };

  const generateProjectPlan = async (currentMessages: ChatMessage[]) => {
    console.log('[ProjectPlanContext] generateProjectPlan: START');
    if (isStreaming) {
      console.log('[ProjectPlanContext] generateProjectPlan: Skipping (already streaming)');
      return;
    }
    if(currentMessages.length >0 ){
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        console.log('[ProjectPlanContext] generateProjectPlan: Skipping (last message not from user)');
        return;
      }
    }
    
    console.log("[ProjectPlanContext] generateProjectPlan: Initiating plan stream...");
    setIsStreaming(true);
    
    // Store previous plan for diffing if it exists
    if (currentText) {
      setPreviousText(currentText);
      previousPlanRef.current = currentText;
    } else {
      setPreviousText('');
    }
    
    // Reset line number for streaming
    setCurrentLineNumber(0);

    try {
      const projectData = getProjectJsonRepresentation();
      const requestBody = JSON.stringify({
        messages: currentMessages,
        projectContext: projectData,
        currentPlan: currentText || null 
      });

      console.log('[ProjectPlanContext] generateProjectPlan: Fetching /api/generate-project-plan (for stream)...');
      const response = await fetch('/api/generate-project-plan', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream' 
        },
        body: requestBody,
      });

      console.log(`[ProjectPlanContext] generateProjectPlan: Stream fetch response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ProjectPlanContext] generateProjectPlan: Stream fetch failed", errorText);
        let errorMessage = `Failed to initiate project plan stream (Status: ${response.status})`;
        try { const errorData = JSON.parse(errorText); errorMessage = errorData.error || errorMessage; } catch(e) {}
        throw new Error(errorMessage);
      }

      if (!response.body) {
          throw new Error("Response body is null, cannot read stream.");
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      await streamLines(currentText || '', reader, (lineNumber: number, updatedText: string) => {
        setCurrentLineNumber(lineNumber);
        setCurrentText(updatedText);
      });      

    } catch (err) {
      console.error("[ProjectPlanContext] generateProjectPlan: Error during stream processing:", err);
      const message = err instanceof Error ? err.message : 'Failed to generate project plan.';
      toast.error(message);
    } finally {
      console.log('[ProjectPlanContext] generateProjectPlan: FINALLY - setting isGeneratingProjectPlan to false');
      setIsStreaming(false);
    }
  };

  const reset = () => {
    setPreviousText(null);
    setCurrentText(null);
    setIsStreaming(false);
    setCurrentLineNumber(0);
    previousPlanRef.current = null;
  };

  // Function to edit a specific section of the markdown
  const editMarkdownSection = async (
    sectionRange: {start: number, end: number},
    instruction: string
  ): Promise<boolean> => {
    if (!currentText) {
      console.error('[ProjectPlanContext] editMarkdownSection: No current text to edit');
      toast.error('No content to edit');
      return false;
    }

    if (isStreaming || isEditing) {
      console.log('[ProjectPlanContext] editMarkdownSection: Operation in progress, skipping');
      toast.error('Another operation is in progress');
      return false;
    }

    setIsEditing(true);
    setPreviousText(currentText);

    try {
      console.log('[ProjectPlanContext] editMarkdownSection: Editing section', sectionRange);
      
      // Get current project context for better AI response
      const projectContextData = {
        id: projectId,
        projectName: project?.projectName,
        description: project?.description,
        roles: project?.roles || [],
        charts: userCharts || []
      };
      
      const response = await fetch('/api/edit-markdown-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullMarkdown: currentText,
          sectionRange,
          instruction,
          projectContext: projectContextData
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to edit section (Status: ${response.status})`;
        try { 
          const errorData = JSON.parse(errorText); 
          errorMessage = errorData.error || errorMessage; 
        } catch(e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.editedMarkdown) {
        setCurrentText(data.editedMarkdown);
        toast.success('Section updated successfully');
        return true;
      } else {
        throw new Error('No edited content returned');
      }
    } catch (err) {
      console.error('[ProjectPlanContext] editMarkdownSection: Error editing section:', err);
      const message = err instanceof Error ? err.message : 'Failed to edit section.';
      toast.error(message);
      // Revert to previous text on error
      setCurrentText(previousText);
      return false;
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <ProjectPlanContext.Provider
      value={{
        currentText,
        previousText,
        setCurrentText,
        isStreaming,
        setIsStreaming,
        currentLineNumber,
        setCurrentLineNumber,
        confirmChanges,
        generateProjectPlan,
        reset,
        editMarkdownSection
      }}
    >
      {children}
    </ProjectPlanContext.Provider>
  );
}

export function useProjectPlan() {
  const context = useContext(ProjectPlanContext);
  if (context === undefined) {
    throw new Error('useProjectPlan must be used within a ProjectPlanProvider');
  }
  return context;
}
