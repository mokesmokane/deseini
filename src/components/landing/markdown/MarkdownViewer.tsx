import React, { useState, useCallback, useRef, useEffect } from 'react';
import './MarkdownViewer.css';
import { useSectionMarkdown } from '../hooks/useSectionMarkdown';
import { MarkdownLineRenderer } from './renderer/MarkdownLineRenderer';
import { MarkdownSectionEditor } from './MarkdownSectionEditor';
import { useQuotes } from '../../../contexts/QuoteProvider';
import { toast } from 'react-hot-toast';  
import {SectionData } from '../../../components/landing/types';
interface Props { 
  section: SectionData;
  onShowChat?: () => void;  
  onShowSectionDiff?: (range: {start: number, end: number}, instruction: string) => void;
}

export const MarkdownViewer: React.FC<Props> = ({ section, onShowChat, onShowSectionDiff }) => {
  const { 
    getAllLines,
    getLineInfo,  
    findListItemRange, 
    isLineLocked,
    toggleLock, 
    unlockSection,
    editMarkdownSection,
    contentVersion
  } = useSectionMarkdown(section.id);
  
  const [activeLines, setActiveLines] = useState<Set<number>>(new Set());
  const [openDropdownLine, setOpenDropdownLine] = useState<number | null>(null);
  const [openChatDropdownLine, setOpenChatDropdownLine] = useState<number | null>(null);
  const [lineHovered, setLineHovered] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<{start: number, end: number} | null>(null);
  const [directEditingSection, setDirectEditingSection] = useState<{start: number, end: number, content: string} | null>(null);
  
  const buttonRefs = useRef<Map<number, React.RefObject<HTMLButtonElement>>>(new Map());
  const chatButtonRefs = useRef<Map<number, React.RefObject<HTMLButtonElement>>>(new Map());
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get section lines - either from the specific section or all lines
  const getSectionLines = useCallback(() => {
    if (!section) {
      return getAllLines();
    }
    
    return getAllLines();
  }, [section, getAllLines]);
  
  // Handle clicks outside of dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((openDropdownLine !== null) || (openChatDropdownLine !== null)) {
        const targetElem = event.target as HTMLElement;
        
        // Check if the click is on the dropdown or its button
        const isOnDropdown = dropdownRef.current && dropdownRef.current.contains(targetElem);
        const isOnDropdownButton = targetElem.closest('.sparkles-button') !== null;
        const isOnChatButton = targetElem.closest('.icon-button') !== null;
        const isOnDropdownMenu = targetElem.closest('.dropdown-menu') !== null; 
        
        // Only close if click is outside dropdown, its button, and any dropdown menu
        if (!isOnDropdown && !isOnDropdownButton && !isOnChatButton && !isOnDropdownMenu) {
          setOpenDropdownLine(null);
          setOpenChatDropdownLine(null);
        }
      }
    };

    // Add a delay to prevent race conditions with the dropdown's own click handler
    const timerId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 200);

    return () => {
      clearTimeout(timerId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownLine, openChatDropdownLine]);

  // Log dropdown state changes
  useEffect(() => {
    if (openDropdownLine !== null) {
    } else {
    }
  }, [openDropdownLine]);

  // Handle line hover states
  const handleLineHover = useCallback((lineNumber: number) => {
    if (lineNumber === null) {
      setLineHovered(null);
      return;
    }
    
    const info = getLineInfo(lineNumber);
    if (info.isList) {
      const range = findListItemRange(lineNumber);
      if (range) {
        const linesToHighlight = Array.from(
          { length: range.end - range.start + 1 },
          (_, i) => range.start + i
        );
        setActiveLines(new Set(linesToHighlight));
        setLineHovered(lineNumber);
      } else {
        setActiveLines(new Set([lineNumber]));
        setLineHovered(lineNumber);
      }
    } else if (info.sections.length > 0) {
      const deepestSection = info.sections[info.sections.length - 1];
      if (info.isContent) {
        const contentLines = Array.from(
          { length: deepestSection.contentEnd - deepestSection.contentStart + 1 },
          (_, i) => deepestSection.contentStart + i
        );
        setActiveLines(new Set(contentLines));
        setLineHovered(lineNumber);
      } else if (info.isHeader) {
        const sectionLines = Array.from(
          { length: deepestSection.end - deepestSection.start + 1 },
          (_, i) => deepestSection.start + i
        );
        setActiveLines(new Set(sectionLines));
        setLineHovered(lineNumber);
      } else {
        setActiveLines(new Set([lineNumber]));
        setLineHovered(lineNumber);
      }
    } else {
      setActiveLines(new Set([lineNumber]));
      setLineHovered(lineNumber);
    }
  }, [getLineInfo, findListItemRange]);

  const handleLineLeave = useCallback(() => {
    setActiveLines(new Set());
    setLineHovered(null);
  }, []);

  const getSectionId = useCallback((lineNumber: number) => {
    const info = getLineInfo(lineNumber);
    return info.sections.length > 0 
      ? info.sections[info.sections.length - 1].id 
      : `line-${lineNumber}`;
  }, [getLineInfo]);

  // Delete section function
  const deleteSection = useCallback((lineNumber: number) => {
    const info = getLineInfo(lineNumber);
    let linesToDelete: number[] = [];

    const sectionIdToDelete = getSectionId(lineNumber);
    
    if (info.isList) {
      const range = findListItemRange(lineNumber);
      if (range) {
        for (let i = range.start; i <= range.end; i++) {
          linesToDelete.push(i);
        }
      } else {
        linesToDelete.push(lineNumber);
      }
    } else if (info.sections.length > 0) {
      const deepestSection = info.sections[info.sections.length - 1];
      for (let i = deepestSection.start; i <= deepestSection.end; i++) {
        linesToDelete.push(i);
      }
    } else {
      linesToDelete.push(lineNumber);
    }

    // saveText(updatedLines.join('\n'));
    
    setActiveLines(new Set());
    setLineHovered(null);
    
    // Unlock the section we're deleting
    unlockSection(sectionIdToDelete);
    
  }, [unlockSection, getSectionId, findListItemRange, getAllLines, getLineInfo]);

  // Handle dropdown option selection
  const handleOptionSelect = useCallback(async (
    option: string, 
    lineNumber: number, 
    customInstruction?: string
  ) => {
    const instruction = customInstruction 
      ? customInstruction 
      : option === 'break-down' 
        ? 'Break this section down into more detailed steps.'
        : option === 'more-detail'
          ? 'Expand this section with more detailed information.'
          : option === 'consolidate'
            ? 'Consolidate this section to make it more concise.'
            : option === 'test-delay'
              ? 'This is a test with a simulated 5-second delay.'
              : '';
    
    if (!instruction) return;
    
    // Get the section range for the clicked line
    const lineInfo = getLineInfo(lineNumber);
    // Compute a section range based on lineInfo
    const sectionRange = lineInfo.sections.length > 0 
      ? { start: lineInfo.sections[0].start, end: lineInfo.sections[0].end }
      : { start: lineNumber, end: lineNumber };
    
    setEditingSection(sectionRange);
    
    if (option === 'test-delay') {
      // Simulate a delay
      await new Promise(resolve => setTimeout(resolve, 5000));
      setEditingSection(null);
      return;
    }
    
    // If onShowSectionDiff is provided, use it to show section diff panel
    if (onShowSectionDiff) {
      onShowSectionDiff(sectionRange, instruction);
      setEditingSection(null);
      // Close any open dropdown
      setOpenDropdownLine(null);
      return;
    }
    
    // Fallback to direct editing if onShowSectionDiff is not provided
    try {
      const success = await editMarkdownSection(sectionRange, instruction);
      if (!success) {
        console.error('Failed to edit section');
      }
    } catch (error) {
      console.error('Error editing section:', error);
    } finally {
      setEditingSection(null);
    }
  }, [editMarkdownSection, getLineInfo, onShowSectionDiff]);

  // Use the quote provider
  const { addQuote } = useQuotes();

  // Handle chat button click to create quotes
  // Accept an array of line numbers for quoting
  const handleChatOptionSelect = useCallback<(option: string, lineNumbers: number[], customMessage?: string) => void>((
    option: string,
    lineNumbers: number[]
  ) => {
    // Quote all hovered/active lines in order
    const lines = getAllLines();
    const sortedLines = Array.from(new Set(lineNumbers)).sort((a, b) => a - b);
    const content = sortedLines.map(i => lines[i]).join('\n');
    // Compute section range (contiguous block, or min/max)
    const sectionRange = { start: sortedLines[0], end: sortedLines[sortedLines.length - 1] };
    
    if (option === 'quote') {
      addQuote(content, sectionRange, section.title, section.id);
      toast.success('Added quote');
      if (onShowChat) {
        onShowChat();
      }
    }
    
    // Close any open dropdown
    setOpenChatDropdownLine(null);
    
  }, [getLineInfo, getAllLines, findListItemRange, onShowChat, addQuote]);

  // New handler for double-click to edit
  const handleDoubleClick = useCallback((lineNumber: number) => {
    const info = getLineInfo(lineNumber);
    let sectionRange: {start: number, end: number} | null = null;
    
    if (info.isList) {
      sectionRange = findListItemRange(lineNumber);
    } else if (info.sections.length > 0) {
      const deepestSection = info.sections[info.sections.length - 1];
      sectionRange = {
        start: deepestSection.start,
        end: deepestSection.end
      };
    } else {
      // Single line
      sectionRange = {
        start: lineNumber,
        end: lineNumber
      };
    }
    
    if (sectionRange) {
      const lines = getAllLines();
      const sectionContent = lines.slice(sectionRange.start, sectionRange.end + 1).join('\n');
      setDirectEditingSection({
        start: sectionRange.start,
        end: sectionRange.end,
        content: sectionContent
      });
      
      // Clear any active dropdowns
      setOpenDropdownLine(null);
      setOpenChatDropdownLine(null);
    }
  }, [getLineInfo, findListItemRange, getAllLines]);

  // Save direct edits
  const saveDirectEdit = useCallback((_: string) => {
    if (!directEditingSection) return;
    
    
    // saveText(newText);
    setDirectEditingSection(null);
  }, [directEditingSection]);

  // Cancel direct edits
  const cancelDirectEdit = useCallback(() => {
    setDirectEditingSection(null);
  }, []);

  // Line editing status checks
  const isLineEditing = useCallback((lineNumber: number) => {
    if (!editingSection) return false;
    return lineNumber >= editingSection.start && lineNumber <= editingSection.end;
  }, [editingSection]);

  const isLineDirectEditing = useCallback((lineNumber: number) => {
    if (!directEditingSection) return false;
    return lineNumber >= directEditingSection.start && lineNumber <= directEditingSection.end;
  }, [directEditingSection]);

  const isTopLineEditing = useCallback((lineNumber: number) => {
    if (!editingSection) return false;
    return lineNumber === editingSection.start;
  }, [editingSection]);

  // Initialize button refs
  const getButtonRef = useCallback((lineNumber: number) => {
    if (!buttonRefs.current.has(lineNumber)) {
      buttonRefs.current.set(lineNumber, React.createRef<HTMLButtonElement>());
    }
    return buttonRefs.current.get(lineNumber)!;
  }, []);
  
  const getChatButtonRef = useCallback((lineNumber: number) => {
    if (!chatButtonRefs.current.has(lineNumber)) {
      chatButtonRefs.current.set(lineNumber, React.createRef<HTMLButtonElement>());
    }
    return chatButtonRefs.current.get(lineNumber)!;
  }, []);

  // Helper function to render markdown line
  const renderMarkdownLine = useCallback((line: string, index: number) => {
    const info = getLineInfo(index);
    const isLocked = isLineLocked(index);
    const isDropdownOpen = openDropdownLine === index;
    const isChatDropdownOpen = openChatDropdownLine === index;
    
    // Skip rendering lines that are being direct edited
    if (directEditingSection && index >= directEditingSection.start && index <= directEditingSection.end) {
      return null;
    }
    
    return (
      <MarkdownLineRenderer
        key={index}
        line={line}
        lineNumber={index}
        isHeader={info.isHeader}
        headerLevel={info.headerLevel}
        isList={info.isList}
        listLevel={info.listLevel}
        isActive={activeLines.has(index)}
        isHovered={lineHovered === index}
        isEditing={isLineEditing(index) || isLineDirectEditing(index)}
        isTopLineEditing={isTopLineEditing(index)}
        isLocked={isLocked}
        isDropdownOpen={isDropdownOpen}
        isChatDropdownOpen={isChatDropdownOpen}
        buttonRef={getButtonRef(index)}
        chatButtonRef={getChatButtonRef(index)}
        handleLineHover={handleLineHover}
        handleLineLeave={handleLineLeave}
        handleOptionSelect={handleOptionSelect}
        handleChatOptionSelect={handleChatOptionSelect}
        setOpenDropdownLine={setOpenDropdownLine}
        setOpenChatDropdownLine={setOpenChatDropdownLine}
        toggleLock={toggleLock}
        deleteSection={deleteSection}
        isLineEditing={isLineEditing}
        onDoubleClick={handleDoubleClick}
        activeLines={activeLines}
      />
    );
  }, [
    activeLines, 
    handleLineHover, 
    handleLineLeave, 
    isLineLocked, 
    lineHovered, 
    openDropdownLine, 
    openChatDropdownLine, 
    getLineInfo, 
    toggleLock, 
    deleteSection, 
    isLineEditing,
    isLineDirectEditing,
    isTopLineEditing, 
    handleOptionSelect, 
    handleChatOptionSelect, 
    getButtonRef, 
    getChatButtonRef,
    directEditingSection,
    handleDoubleClick
  ]);
  // Render markdown content
  const renderMarkdown = useCallback(() => {
    if (!getAllLines()) {
      return <div className="markdown-empty">No content to display</div>;
    }
    
    const lines = getSectionLines();
    
    // If a section is being direct edited, render the section editor
    if (directEditingSection) {
      const beforeLines = lines.slice(0, directEditingSection.start);
      const afterLines = lines.slice(directEditingSection.end + 1);
      
      return (
        <pre>
          <code className="markdown-raw">
            {beforeLines.map((line, index) => renderMarkdownLine(line, index))}
            
            <div className="direct-edit-container">
              <MarkdownSectionEditor
                content={directEditingSection.content}
                onSave={saveDirectEdit}
                onCancel={cancelDirectEdit}
              />
            </div>
            
            {afterLines.map((line, index) => renderMarkdownLine(line, index + directEditingSection.end + 1))}
          </code>
        </pre>
      );
    }
    
    return (
      <pre>
        <code className="markdown-raw">
          {lines.map((line, index) => renderMarkdownLine(line, index))}
        </code>
      </pre>
    );
  }, [renderMarkdownLine]);
  

  return (
    <div className="markdown-viewer-container" key={`section-${contentVersion || 0}`}>
      <div className="markdown-container markdown-raw">
        {renderMarkdown()}
      </div>
    </div>
  );
};
