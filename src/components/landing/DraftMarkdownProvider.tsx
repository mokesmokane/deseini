import { createContext, useContext, useState, useRef, useCallback, ReactNode, useEffect } from 'react';
import { ChatMessage } from '../../types';
import toast from 'react-hot-toast';
import { getCleanProjectPlanStream } from '../../services/projectPlanService';
import { createLineReader } from '../../utils/streamToLines';
import { useProject } from '../../contexts/ProjectContext';
import { projectMarkdownService } from '../../services/projectMarkdownService';
import { SimpleSectionProcessor, SectionData, ProcessUpdateEvent } from './SimpleSectionProcessor';

interface DraftMarkdownContextProps {
  // Core data
  sections: SectionData[];
  currentSectionId: string | null;
  isStreaming: boolean;
  
  // Actions
  generateProjectPlan: (currentMessages: ChatMessage[]) => Promise<SectionData[]>;
  generateProjectPlanForProjectId: (currentMessages: ChatMessage[], projectId: string) => Promise<SectionData[]>;
  resetMarkdown: () => void;
  selectSection: (id: string | null) => void;
  
  // Content access helpers
  getSectionById: (id: string) => SectionData | undefined;
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
  const generateProjectPlanForProjectId = useCallback(async (currentMessages: ChatMessage[], projectId: string): Promise<SectionData[]> => {
    if (isStreaming) return [];
    
    setIsStreaming(true);
    resetMarkdown();
    
    // Reset our section processor
    sectionProcessor.current.reset();
    
    try {
      // Get the clean stream reader
      const rawReader = await getCleanProjectPlanStream(currentMessages, null);
      
      // Transform into a line-by-line reader
      const lineReader = createLineReader(rawReader);
      
      // Process the stream directly with the section processor
      await sectionProcessor.current.processStream(lineReader, (update: ProcessUpdateEvent) => {
        // Update the specific section
        updateSection(update.section);
        
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
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate project plan.';
      toast.error(message);
      return [];
    } finally {
      setIsStreaming(false);
    }
  }, [updateSection, setCurrentSectionId, isStreaming]);

  // Generate a new project plan
  const generateProjectPlan = useCallback(async (currentMessages: ChatMessage[]): Promise<SectionData[]> => {
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
    generateProjectPlan,
    generateProjectPlanForProjectId,
    resetMarkdown,
    selectSection,
    getSectionById
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
