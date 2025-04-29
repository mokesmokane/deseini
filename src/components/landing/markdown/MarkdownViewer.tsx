import React, { useState, useCallback, useRef, useEffect } from 'react';
import './MarkdownViewer.css';
import { useSectionMarkdown } from '../hooks/useSectionMarkdown';
import { MarkdownLineRenderer } from './renderer/MarkdownLineRenderer';
import { MarkdownSectionEditor } from './MarkdownSectionEditor';

interface Props {
  section: string | null;
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
    getSectionRange,
    editMarkdownSection,
    contentVersion
  } = useSectionMarkdown(section);
  
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
          console.log('Clicked outside dropdown, closing it');
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
      console.log('Dropdown opened for line:', openDropdownLine);
    } else {
      console.log('Dropdown closed');
    }
  }, [openDropdownLine]);

  // Handle line hover states
  const handleLineHover = useCallback((lineNumber: number | null) => {
    if (lineNumber === null) {
      setLineHovered(null);
      return;
    }
    
    const info = getLineInfo(lineNumber);
    console.log('Line info:', info);
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
    const sectionRange = getSectionRange(lineNumber, lineInfo);
    
    console.log('Editing section:', sectionRange, 'with instruction:', instruction);
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

  // Handle chat dropdown options
  const handleChatOptionSelect = useCallback((
    option: string,
    lineNumber: number,
    customMessage?: string
  ) => {
    // Get section information
    const info = getLineInfo(lineNumber);
    let content = '';
    
    if (info.sections.length > 0) {
      const deepestSection = info.sections[info.sections.length - 1];
      
      // Get the content of the section
      const lines = getAllLines();
      content = lines.slice(deepestSection.start, deepestSection.end + 1).join('\n');
    } else if (info.isList) {
      const range = findListItemRange(lineNumber);
      if (range) {
        const lines = getAllLines();
        content = lines.slice(range.start, range.end + 1).join('\n');
      } else {
        const lines = getAllLines();
        content = lines[lineNumber];
      }
    } else {
      const lines = getAllLines();
      content = lines[lineNumber];
    }
    
    // Prepare message for the chat
    let message = '';
    
    switch (option) {
      case 'analyze':
        message = `Can you analyze this section from my project plan and ask me clarifying questions about it?\n\n${content}`;
        break;
      case 'improve':
        message = `Can you suggest improvements for this section of my project plan?\n\n${content}`;
        break;
      case 'custom':
        message = customMessage || '';
        break;
      default:
        message = `I'd like to discuss this section of my project plan:\n\n${content}`;
    }
    
    if (message) {
      // If onShowChat callback is provided, call it to show chat component
      if (onShowChat) {
        onShowChat();
      }
      
      // Send the message to the chat
      setTimeout(() => {
        // handleSendMessage(null, message);
      }, 100);
    }
    
    // Close any open dropdown
    setOpenChatDropdownLine(null);
    
  }, [getLineInfo, getAllLines, findListItemRange, onShowChat]);

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
  const saveDirectEdit = useCallback((editedContent: string) => {
    if (!directEditingSection) return;
    
    console.log('Saving direct edit', {
      start: directEditingSection.start,
      end: directEditingSection.end,
      editedContent
    });
    
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
  }, [
    activeLines, 
    handleLineHover, 
    handleLineLeave, 
    isLineLocked, 
    lineHovered, 
    openDropdownLine, 
    openChatDropdownLine, 
    getSectionLines, 
    getLineInfo,
    toggleLock, 
    deleteSection,
    isLineEditing, 
    isTopLineEditing,
    handleOptionSelect,
    handleChatOptionSelect,
    getButtonRef,
    getChatButtonRef,
    directEditingSection,
    saveDirectEdit,
    cancelDirectEdit
  ]);

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

  return (
    <div className="markdown-viewer-container" key={`section-${contentVersion || 0}`}>
      <div className="markdown-container markdown-raw">
        {renderMarkdown()}
      </div>
    </div>
  );
};
