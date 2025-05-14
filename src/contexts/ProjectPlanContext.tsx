import React, { createContext, useContext, useState, useRef, ReactNode, useCallback, useMemo } from 'react';
import { Project } from '../types';
import { toast } from 'react-hot-toast';
import { MarkdownSectionAnalyzer } from '../utils/MarkdownSections';
import { projectMarkdownService } from '../services/projectMarkdownService';
import { useProject } from '../contexts/ProjectContext';
import { streamByLine } from '../utils/streamByLine';
import { editMarkdownSection as editMarkdownSectionService } from '../services/projectMarkdownService';
import { generateProjectPlan as generateProjectPlanService } from '../services/projectPlanService';
import { Message } from '../components/landing/types';

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
  setCurrentText: (text: string) => void;
  previousText: string | null;
  deleteMarkdown: () => Promise<void>;
  saveText: (text: string) => Promise<void>;
  isStreaming: boolean;
  
  setIsStreaming: (streaming: boolean) => void;
  currentLineNumber: number;
  setCurrentLineNumber: (lineNumber: number) => void;
  generateProjectPlan: (messages: Message[], projectData: Project) => Promise<void>;
  createPlanIfMissing: (project: Project) => Promise<void>;
  confirmChanges: (confirm: boolean) => Promise<void>;
  reset: () => void;
  editMarkdownSection: (sectionRange: {start: number, end: number}, instruction: string) => Promise<boolean>;
  
  // MarkdownSectionAnalyzer methods
  getLineInfo: (lineNumber: number) => { 
    sections: any[],
    isHeader: boolean,
    headerLevel?: number,
    isContent: boolean,
    isList: boolean,
    listLevel?: number
  };
  getAllLines: () => string[];
  getSectionById: (id: string) => any | undefined;
  getSectionContent: (section: any) => string[];
  findListItemRange: (startLine: number) => { start: number; end: number } | null;
  
  // Locking functionality
  lockedSections: Set<string>;
  isLineLocked: (lineNumber: number) => boolean;
  toggleLock: (lineNumber: number) => void;
  unlockSection: (sectionId: string) => void;
}

interface ProjectPlanProviderProps {
  children: ReactNode;
}

const ProjectPlanContext = createContext<ProjectPlanContextProps | undefined>(undefined);


export function ProjectPlanProvider({ 
  children, 
}: ProjectPlanProviderProps) {

  const [currentText, setCurrentText] = useState<string | null>(null);
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentLineNumber, setCurrentLineNumber] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());
  const { project, userCharts } = useProject();

  // Global static flag to track if initialization has happened across all instances
  // This ensures createPlanIfMissing only runs once globally regardless of how many times
  // Canvas components are mounted or remounted
  const hasInitialized = useRef(false);

  const projectIdRef = useRef(project?.id || null);
  const projectRef = useRef(project);
  const userChartsRef = useRef(userCharts);
  const previousPlanRef = useRef<string | null>(null); // Store previous plan for diffing

  // Update refs when props change
  React.useEffect(() => {
    projectIdRef.current = project?.id || null;
    projectRef.current = project;
    userChartsRef.current = userCharts;
  }, [project, userCharts]);

  // Reset diff segments when project plan changes
  React.useEffect(() => {
    if (currentText !== null && !isStreaming) {
      previousPlanRef.current = currentText;
    }
  }, [currentText, isStreaming]);

  // Analyzer derived from currentText
  const analyzer = useMemo(() => currentText ? new MarkdownSectionAnalyzer(currentText) : null, [currentText]);


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

  const createPlanIfMissing = async (project: Project) => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    // Attempt to load existing markdown from DB
    if (projectIdRef.current) {
      const dbMarkdown = await projectMarkdownService.getMarkdown(projectIdRef.current);
      if (dbMarkdown) {
        setCurrentText(dbMarkdown);
        setPreviousText(dbMarkdown);
        return;
      }
    }
    // Check if creation is already in progress or if text already exists
    if (currentText || isStreaming) {
      return;
    }
    try {
      await generateProjectPlan([], project);
    } catch (error) {
      console.error('[ProjectPlanContext] createPlanIfMissing: Error', error);
      hasInitialized.current = false;
    } finally {
    }
  };

  const generateProjectPlan = async (currentMessages: Message[], projectData: Project) => {
    if (isStreaming) {
      return;
    }
    if(currentMessages.length >0 ){
      const lastMessage = currentMessages[currentMessages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        return;
      }
    }
    
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
      const response = await generateProjectPlanService({
        messages: currentMessages,
        projectContext: projectData,
        currentPlan: currentText || null
      });

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
      await streamByLine(currentText || '', reader, (lines: string[]) => {
        setCurrentLineNumber(lines.length);
        setCurrentText(lines.join('\n'));
      });      

    } catch (err) {
      console.error("[ProjectPlanContext] generateProjectPlan: Error during stream processing:", err);
      const message = err instanceof Error ? err.message : 'Failed to generate project plan.';
      toast.error(message);
    } finally {
      setIsStreaming(false);
      if (projectIdRef.current && currentText) {    
        const saved = await projectMarkdownService.saveMarkdown(projectIdRef.current, currentText);
        if (!saved) {
          console.error('[ProjectPlanContext] generateProjectPlan: Failed to save markdown to DB');
        }
      }
    }
  };

  const reset = () => {
    hasInitialized.current = false;
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
      toast.error('No content to edit');
      return false;
    }

    if (isStreaming || isEditing) {
      toast.error('Another operation is in progress');
      return false;
    }

    setIsEditing(true);
    setPreviousText(currentText);

    try {
      
      // Get current project context for better AI response
      const projectContextData = {
        id: projectIdRef.current,
        projectName: project?.projectName,
      };

      const response = await editMarkdownSectionService({
        sectionRange,
        instruction,
        projectContext: projectContextData,
        currentPlan: currentText
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to edit markdown section (Status: ${response.status})`;
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
        if (projectIdRef.current) {
          await projectMarkdownService.saveMarkdown(projectIdRef.current, data.editedMarkdown);
        }
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

  // MarkdownSectionAnalyzer methods
  const getLineInfo = useCallback((lineNumber: number) => {
    if (!analyzer) {
      return { sections: [], isHeader: false, isContent: false, isList: false };
    }
    return analyzer.getLineInfo(lineNumber);
  }, [analyzer]);

  const getAllLines = useCallback(() => analyzer ? analyzer.getAllLines() : [], [analyzer]);

  const getSectionContent = useCallback((section: any) => analyzer ? analyzer.getSectionContent(section) : [], [analyzer]);

  const getSectionFromId = useCallback((id: string) => analyzer ? analyzer.getSectionById(id) : undefined, [analyzer]);

  const getSectionIdForLine = useCallback((lineNumber: number) => {
    const info = getLineInfo(lineNumber);
    return info.sections.length > 0 
      ? info.sections[info.sections.length - 1].id 
      : null;
  }, [analyzer]);

  const findListItemRange = useCallback((startLine: number) => {
    if (!analyzer) return null;
    const lines = analyzer.getAllLines();
    const startInfo = analyzer.getLineInfo(startLine);
    if (!startInfo.isList) return null;

    const startLevel = startInfo.listLevel || 0;
    let end = startLine;

    for (let i = startLine + 1; i < lines.length; i++) {
      const info = analyzer.getLineInfo(i);
      
      if (!info.isList || 
          info.listLevel! <= startLevel ||
          lines[i].trim() === '') {
        break;
      }
      end = i;
    }

    return { start: startLine, end };
  }, [analyzer]);

  // Locking functionality
  const isLineLocked = useCallback((lineNumber: number) => {
    if (!analyzer) return false;
    
    const info = analyzer.getLineInfo(lineNumber);
    
    for (const section of info.sections) {
      if (lockedSections.has(section.id)) {
        return true;
      }
    }
    
    return lockedSections.has(`line-${lineNumber}`);
  }, [lockedSections, analyzer]);

  const toggleLock = useCallback((lineNumber: number) => {
    const sectionId = getSectionIdForLine(lineNumber) || `line-${lineNumber}`;
    
    const newLockedSections = new Set(lockedSections);
    
    if (lockedSections.has(sectionId)) {
      newLockedSections.delete(sectionId);
    } else {
      newLockedSections.add(sectionId);
    }
    
    setLockedSections(newLockedSections);
  }, [lockedSections, getSectionIdForLine]);

  const unlockSection = useCallback((sectionId: string) => {
    if (lockedSections.has(sectionId)) {
      const newLockedSections = new Set(lockedSections);
      newLockedSections.delete(sectionId);
      setLockedSections(newLockedSections);
    }
  }, [lockedSections]);

  const saveText = async (text: string) => {
    setCurrentText(text);
    if (projectIdRef.current) {
      await projectMarkdownService.saveMarkdown(projectIdRef.current, text);
    }
  };

  const deleteMarkdown = async () => {
    if (projectIdRef.current) {
      await projectMarkdownService.deleteMarkdown(projectIdRef.current);
    }
    reset();
  };

  return (
    <ProjectPlanContext.Provider
      value={{
        currentText,
        setCurrentText,
        previousText,
        saveText,
        deleteMarkdown,
        isStreaming,
        setIsStreaming,
        currentLineNumber,
        setCurrentLineNumber,
        confirmChanges,
        generateProjectPlan,
        createPlanIfMissing,
        reset,
        editMarkdownSection,
        // MarkdownSectionAnalyzer methods
        getLineInfo,
        getAllLines,
        getSectionById: getSectionFromId,
        getSectionContent,
        findListItemRange,
        // Locking functionality
        lockedSections,
        isLineLocked,
        toggleLock,
        unlockSection
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
