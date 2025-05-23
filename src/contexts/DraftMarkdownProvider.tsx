import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { Message } from '../components/landing/types';
import toast from 'react-hot-toast';
import { getCleanProjectPlanStream } from '../services/projectPlanService';
import { createLineReader } from '../utils/streamToLines';
import { useProject } from './ProjectContext';
import { projectMarkdownService } from '../services/projectMarkdownService';
import { SimpleSectionProcessor } from '../components/landing/SimpleSectionProcessor';
import { SectionData, ProcessUpdateEvent, UpdateState } from '../components/landing/types';

interface DraftMarkdownContextProps {
  // Core data
  sections: SectionData[];
  currentSectionId: string | null;
  isStreaming: boolean;

  // State updates
  stateUpdates: Record<string, UpdateState>;
  
  // Actions
  generateProjectPlan: (currentMessages: Message[]) => Promise<SectionData[]>;
  generateProjectPlanForProjectId: (currentMessages: Message[], projectId: string) => Promise<SectionData[]>;
  createProjectPlan: (projectMarkdownStream: ReadableStream<string>, projectId: string, seedMessageId?: string) => Promise<SectionData[]>;
  updateProjectPlan: (projectMarkdownStream: ReadableStream<string>, projectId: string, seedMessageId?: string) => Promise<SectionData[]>;
  resetMarkdown: () => void;
  selectSection: (id: string | null) => void;
  setCurrentSectionId: (id: string | null) => void;
  // Content access helpers
  getSectionById: (id: string) => SectionData | undefined;
  getCurrentSection: () => SectionData | undefined;
}

const DraftMarkdownContext = createContext<DraftMarkdownContextProps | undefined>(undefined);

/**
 * A simplified markdown provider that tracks top-level sections only
 * Each section contains its full markdown content
 */
export const DraftMarkdownProvider = ({ children }: { children: ReactNode }) => {
  // Core state
  const [sections, setSections] = useState<SectionData[]>([]);
  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [stateUpdates, setStateUpdates] = useState<Record<string, UpdateState>>({});
  
  // Section processor instance
  const sectionProcessor = useRef<SimpleSectionProcessor>(new SimpleSectionProcessor());
  
  const { project } = useProject();

  // Load existing sections when project changes
  useEffect(() => {
    if (project && currentProjectId !== project.id) {
      resetMarkdown();
      setCurrentProjectId(project.id);
      
      projectMarkdownService.getSections(project.id).then(dbSections => {
        if (dbSections && dbSections.length > 0) {
          // Simple conversion from DB format to our format
          const formattedSections = dbSections.map(section => ({
            id: section.sectionId,
            title: SimpleSectionProcessor.extractTitleFromContent(section.content) || section.sectionId,
            sectionIndex: section.sectionIndex,
            content: section.content,
            updatedAt: new Date(section.updatedAt)
          }));
          
          setSections(formattedSections);
          if (formattedSections.length > 0) {
            setCurrentSectionId(formattedSections[0].id);
          }
        }
      });
    }
  }, [project]);

  // Function to update a single section
  const updateSection = useCallback((section?: SectionData) => {
    if (!section) return;
    
    setSections(prevSections => {
      // Check if the section already exists
      const existingIndex = prevSections.findIndex(s => s.id === section.id);
      
      if (existingIndex >= 0) {
        // Update existing section
        const updatedSections = [...prevSections];
        updatedSections[existingIndex] = section;
        return updatedSections;
      } else {
        // Add new section
        return [...prevSections, section];
      }
    });
  }, []);

  // Generate a project plan for a specific project ID
  const generateProjectPlanForProjectId = useCallback(async (currentMessages: Message[], projectId: string): Promise<SectionData[]> => {
    if (isStreaming) return [];
    
    setIsStreaming(true);
    resetMarkdown();
    
    // Reset our section processor
    sectionProcessor.current.reset();
    
    try {
      // Get the clean stream reader
      const stream = await getCleanProjectPlanStream(currentMessages, null);
      return await createProjectPlan(stream, projectId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate project plan.';
      toast.error(message);
      return [];
    } finally {
      setIsStreaming(false);
    }
  }, [updateSection, setCurrentSectionId, isStreaming]);

  const createProjectPlan = useCallback(async (projectMarkdownStream: ReadableStream<string>, projectId: string, seedMessageId?: string): Promise<SectionData[]> => {
    // Transform into a line-by-line reader
    const lineReader = createLineReader(projectMarkdownStream.getReader());
    
    // Process the stream directly with the section processor
    await sectionProcessor.current.processStream(lineReader, (update: ProcessUpdateEvent) => {
      updateSection(update.section);
      
      // Update the update state
      const updateState = update.updateState;
      if (seedMessageId) {
        setStateUpdates(prev => ({ ...prev, [seedMessageId]: updateState}));
      }
      
      // Update the current section ID if provided
      if (update.currentSectionId) {
        setCurrentSectionId(update.currentSectionId);
      }
    });
    
    // Save to database using the provided project ID
    const sectionsToSave = sectionProcessor.current.getSections().map(section => ({
      sectionId: section.id,
      content: section.content,
      sectionIndex: section.sectionIndex || 0,
      updatedAt: new Date()
    }));
    
    const success = await projectMarkdownService.saveSections(projectId, sectionsToSave);
    if (!success) {
      console.error(`[DraftMarkdownProvider] Failed to save sections to database for project ${projectId}`);
    }
    return sectionProcessor.current.getSections();
 }, [isStreaming, project]);

  // Update existing project plan sections or add new ones based on markdown stream
  const updateProjectPlan = useCallback(async (
    projectMarkdownStream: ReadableStream<string>,
    projectId: string,
    seedMessageId?: string
  ): Promise<SectionData[]> => {
    // Transform into a line-by-line reader
    const lineReader = createLineReader(projectMarkdownStream.getReader());
    //setup new section processor
    sectionProcessor.current.reset();
    await sectionProcessor.current.processStreamWithUpdates(lineReader, (update: ProcessUpdateEvent) => {
      updateSection(update.section);
      
      // Update the update state
      const updateState = update.updateState;
      if (seedMessageId) {
        setStateUpdates(prev => ({ ...prev, [seedMessageId]: updateState}));
      }
      
      // Update the current section ID if provided
      if (update.currentSectionId) {
        setCurrentSectionId(update.currentSectionId);
      }
    });
    
    // Save to database using the provided project ID
    const sectionsToSave = sectionProcessor.current.getSections().map(section => ({
      sectionId: section.id,
      content: section.content,
      sectionIndex: section.sectionIndex || 0,
      updatedAt: new Date()
    }));
    
    const success = await projectMarkdownService.saveSections(projectId, sectionsToSave);
    if (!success) {
      console.error(`[DraftMarkdownProvider] Failed to save sections to database for project ${projectId}`);
    }
    return sectionProcessor.current.getSections();
  }, [sections, updateSection]);

  // Generate a new project plan
  const generateProjectPlan = useCallback(async (currentMessages: Message[]): Promise<SectionData[]> => {
    if (isStreaming || !project?.id) {
      console.warn('[DraftMarkdownProvider] Cannot generate project plan: ',
        isStreaming ? 'Already streaming' : 'No project ID available');
      return [];
    }
    
    return await generateProjectPlanForProjectId(currentMessages, project.id);
  }, [project, generateProjectPlanForProjectId, isStreaming]);

  // Reset all state
  const resetMarkdown = useCallback(() => {
    setSections([]);
    setCurrentSectionId(null);
    sectionProcessor.current.reset();
  }, []);

  // Select a section
  const selectSection = useCallback((id: string | null) => {
    setCurrentSectionId(id);
  }, []);

  // Helper to find a section by ID
  const getSectionById = useCallback((id: string) => {
    return sections.find(section => section.id === id);
  }, [sections]);

  // Context value
  const contextValue: DraftMarkdownContextProps = {
    sections,
    currentSectionId,
    isStreaming,
    stateUpdates,
    createProjectPlan,
    generateProjectPlan,
    generateProjectPlanForProjectId,
    updateProjectPlan,
    resetMarkdown,
    selectSection,
    getCurrentSection: () => getSectionById(currentSectionId || ''),
    getSectionById,
    setCurrentSectionId
  };

  return (
    <DraftMarkdownContext.Provider value={contextValue}>
      {children}
    </DraftMarkdownContext.Provider>
  );
};

// Hook for accessing the context
export const useDraftMarkdown = () => {
  const context = useContext(DraftMarkdownContext);
  if (context === undefined) {
    throw new Error('useDraftMarkdown must be used within a DraftMarkdownProvider');
  }
  return context;
};
