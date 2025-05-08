import { useState, useCallback, useMemo, useEffect } from 'react';
import { useDraftMarkdown } from '../../../contexts/DraftMarkdownProvider';
import { MarkdownSectionAnalyzer } from '../../../utils/MarkdownSections';

/**
 * Interface for section range
 */
export interface SectionRange {
  start: number;
  end: number;
}

/**
 * Interface for line information
 */
export interface LineInfo {
  sections: any[];
  isHeader: boolean;
  headerLevel?: number;
  isContent: boolean;
  isList: boolean;
  listLevel?: number;
}

/**
 * Hook for managing and interacting with a specific markdown section
 * Provides line-level operations like locking, tracking, analyzing, and editing
 */
export const useSectionMarkdown = (sectionId: string | null) => {
  // Get core markdown functionality from the provider
  const { getSectionById } = useDraftMarkdown();
  
  // Local state for section-specific operations
  const [lockedLines, setLockedLines] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [contentVersion, setContentVersion] = useState(0);
  
  // Get the current section content
  const section = useMemo(() => 
    sectionId ? getSectionById(sectionId) : null, 
    [sectionId, getSectionById]
  );
  
  // Track section content changes to force re-renders
  useEffect(() => {
    if (section?.content) {
      // Increment contentVersion when content changes
      setContentVersion(prev => prev + 1);
    }
  }, [section?.content]);
  
  // Create an analyzer for the current section content
  const analyzer = useMemo(() => {
    if (!section) return null;
    return new MarkdownSectionAnalyzer(section.content);
  }, [section, contentVersion]);
  
  /**
   * Get all lines from the current section
   */
  const getAllLines = useCallback(() => {
    if (!analyzer) return [];
    return analyzer.getAllLines();
  }, [analyzer]);
  
  /**
   * Get information about a specific line
   */
  const getLineInfo = useCallback((lineNumber: number): LineInfo => {
    if (!analyzer) {
      return { sections: [], isHeader: false, isContent: false, isList: false };
    }
    return analyzer.getLineInfo(lineNumber);
  }, [analyzer]);
  
  /**
   * Find the range of a list item starting at a specific line
   */
  const findListItemRange = useCallback((startLine: number): SectionRange | null => {
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
  
  /**
   * Get the section ID for a specific line
   */
  const getSectionIdForLine = useCallback((lineNumber: number): string | null => {
    const info = getLineInfo(lineNumber);
    return info.sections.length > 0
      ? info.sections[info.sections.length - 1].id
      : null;
  }, [getLineInfo]);
  
  /**
   * Check if a line is locked
   */
  const isLineLocked = useCallback((lineNumber: number): boolean => {
    const lineSectionId = getSectionIdForLine(lineNumber);
    // Check if the section is locked, or if the specific line is locked
    return lockedLines.has(lineSectionId || '') || lockedLines.has(`line-${lineNumber}`);
  }, [lockedLines, getSectionIdForLine]);
  
  /**
   * Toggle the lock state of a line or its containing section
   */
  const toggleLock = useCallback((lineNumber: number) => {
    const lockId = getSectionIdForLine(lineNumber) || `line-${lineNumber}`;
    
    const newLockedLines = new Set(lockedLines);
    
    if (lockedLines.has(lockId)) {
      newLockedLines.delete(lockId);
    } else {
      newLockedLines.add(lockId);
    }
    
    setLockedLines(newLockedLines);
  }, [lockedLines, getSectionIdForLine]);
  
  /**
   * Unlock a section by ID
   */
  const unlockSection = useCallback((id: string) => {
    if (lockedLines.has(id)) {
      const newLockedLines = new Set(lockedLines);
      newLockedLines.delete(id);
      setLockedLines(newLockedLines);
    }
  }, [lockedLines]);
  
  /**
   * Get the range of a section based on line information
   */
  const getSectionRange = useCallback((
    lineNumber: number, 
    lineInfo?: LineInfo
  ): SectionRange => {
    const info = lineInfo || getLineInfo(lineNumber);
    
    // Check if the line is part of a list
    if (info.isList) {
      const range = findListItemRange(lineNumber);
      if (range) return range;
    }
    
    // Check if it's part of a section
    if (info.sections.length > 0) {
      const deepestSection = info.sections[info.sections.length - 1];
      return {
        start: deepestSection.start,
        end: deepestSection.end
      };
    }
    
    // Default to just this line
    return { start: lineNumber, end: lineNumber };
  }, [getLineInfo, findListItemRange]);
  
  /**
   * Edit a specific section or range of the markdown
   */
  const editMarkdownSection = async (
    sectionRange: SectionRange,
    instruction: string
  ): Promise<boolean> => {
    if (!section) {
      console.error('[useSectionMarkdown] editMarkdownSection: No section to edit');
      return false;
    }

    if (isEditing) {
      console.log('[useSectionMarkdown] editMarkdownSection: Already editing, skipping');
      return false;
    }

    setIsEditing(true);

    try {
      // Extract the specific section to edit
      const lines = getAllLines();
      const sectionContent = lines.slice(sectionRange.start, sectionRange.end + 1).join('\n');
      
      
      // Simulate an edit for now - replace with actual API call in the real implementation
      // In a real implementation, call your API to edit the section
      const mockEditedContent = `${sectionContent}\n\n// Edited based on: ${instruction}`;
      
      // Update the content (this would be updated in your real implementation)
      console.log('[useSectionMarkdown] Edited content:', mockEditedContent);
      
      return true;
    } catch (err) {
      console.error('[useSectionMarkdown] Error editing section:', err);
      return false;
    } finally {
      setIsEditing(false);
    }
  };
  
  // Return all the functions and values needed by consuming components
  return {
    getAllLines,
    getLineInfo,
    findListItemRange,
    isLineLocked,
    toggleLock,
    unlockSection,
    getSectionRange,
    editMarkdownSection,
    contentVersion,
    section
  };
};
