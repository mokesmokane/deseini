import React, { useState, useCallback, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { MarkdownSectionAnalyzer } from './MarkdwonSections';
import './MarkdownViewer.css';
import { TrashIcon, ChatBubbleLeftIcon, SparklesIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { useProjectPlan } from '../../contexts/ProjectPlanContext';

interface Section {
  id: string;
  level: number;
  start: number;
  end: number;
  contentStart: number;
  contentEnd: number;
  content: string[];
  children: Section[];
  parent: Section | null;
  type: 'section' | 'list';
  indentLevel?: number;
}

interface Props {
  initialMarkdown: string;
}

// Custom dropdown menu component with modern black and white styling
const CustomDropdownMenu = ({ 
  isOpen, 
  onClose,
  lineNumber,
  buttonRef,
  onOptionSelect
}: { 
  isOpen: boolean; 
  onClose: () => void;
  lineNumber: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onOptionSelect: (option: string, lineNumber: number, customInstruction?: string) => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [customInstruction, setCustomInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Flag for special line 0 handling
  const isLineZero = lineNumber === 0;
  
  useEffect(() => {
    // Calculate position based on the button's position
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({ 
        top: rect.bottom + window.scrollY, 
        left: rect.left + window.scrollX - 150 + rect.width / 2 // Center the dropdown
      });
      
      setHasInitialized(true);
    }
    
    // For line 0, use a much simpler approach without relying on click handlers
    if (isLineZero) {
      return; // Skip the regular click handlers for line 0
    }
    
    // Only add click handlers after initialization 
    if (isOpen && hasInitialized) {
      const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
            !(buttonRef.current && buttonRef.current.contains(event.target as Node))) {
          onClose();
        }
      };
      
      // Add with a delay to prevent immediate triggering
      const timerId = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 300);
      
      return () => {
        clearTimeout(timerId);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose, buttonRef, hasInitialized, isLineZero]);
  
  if (!isOpen) return null;
  
  const handleInstructionSubmit = () => {
    if (customInstruction.trim() && !isLoading) {
      setIsLoading(true);
      onOptionSelect('custom', lineNumber, customInstruction);
      
      // For line 0, don't auto-close
      if (!isLineZero) {
        onClose();
      }
    }
  };
  
  const options = [
    { 
      label: 'Break Down', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'break-down'`);
          onOptionSelect('break-down', lineNumber);
          // For line 0, don't auto-close
          if (!isLineZero) {
            onClose();
          }
        }
      }
    },
    { 
      label: 'More Detail', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'more-detail'`);
          onOptionSelect('more-detail', lineNumber);
          // For line 0, don't auto-close
          if (!isLineZero) {
            onClose();
          }
        }
      }
    },
    { 
      label: 'Consolidate', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'consolidate'`);
          onOptionSelect('consolidate', lineNumber);
          // For line 0, don't auto-close
          if (!isLineZero) {
            onClose();
          }
        }
      }
    },
    { 
      label: 'Test (5s Delay)', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'test-delay'`);
          onOptionSelect('test-delay', lineNumber);
          // For line 0, don't auto-close
          if (!isLineZero) {
            onClose();
          }
        }
      }
    },
  ];
  
  return createPortal(
    <div 
      ref={menuRef}
      className="dropdown-menu"
      role="menu"
      aria-orientation="vertical"
      style={{ 
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000
      }}
    >
      <div className="dropdown-content">
        {options.map((option, index) => (
          <button 
            key={index}
            className="dropdown-item"
            role="menuitem"
            onClick={() => {
              option.action();
              // Don't close automatically on selection as we'll show loading state
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : option.label}
          </button>
        ))}
        <div className="dropdown-custom-instruction">
          <textarea
            className="custom-instruction-input"
            placeholder="Type custom instructions..."
            value={customInstruction}
            onChange={(e) => setCustomInstruction(e.target.value)}
            disabled={isLoading}
          />
          <button 
            className="custom-instruction-submit"
            onClick={handleInstructionSubmit}
            disabled={!customInstruction.trim() || isLoading}
          >
            {isLoading ? 'Processing...' : 'Apply'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const MarkdownViewer: React.FC<Props> = ({ initialMarkdown }) => {
  const projectPlan = useProjectPlan();
  const [activeLines, setActiveLines] = useState<Set<number>>(new Set());
  const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());
  const [openDropdownLine, setOpenDropdownLine] = useState<number | null>(null);
  const [lineHovered, setLineHovered] = useState<number | null>(null);
  const [editingSection, setEditingSection] = useState<{start: number, end: number} | null>(null);
  const buttonRefs = useRef<Map<number, React.RefObject<HTMLButtonElement>>>(new Map());
  const analyzer = useRef(new MarkdownSectionAnalyzer(initialMarkdown));
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (projectPlan.currentText) {
      analyzer.current = new MarkdownSectionAnalyzer(projectPlan.currentText);
    } else if (initialMarkdown) {
      analyzer.current = new MarkdownSectionAnalyzer(initialMarkdown);
      if (!projectPlan.isStreaming && !projectPlan.currentText) {
        projectPlan.setCurrentText(initialMarkdown);
      }
    }
  }, [projectPlan.currentText, initialMarkdown, projectPlan]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownLine !== null) {
        const targetElem = event.target as HTMLElement;
        
        // Check if the click is on the dropdown or its button
        const isOnDropdown = dropdownRef.current && dropdownRef.current.contains(targetElem);
        const isOnDropdownButton = targetElem.closest('.sparkles-button') !== null;
        const isOnDropdownMenu = targetElem.closest('.dropdown-menu') !== null; 
        
        // Only close if click is outside dropdown, its button, and any dropdown menu
        if (!isOnDropdown && !isOnDropdownButton && !isOnDropdownMenu) {
          console.log('Clicked outside dropdown, closing it');
          setOpenDropdownLine(null);
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
  }, [openDropdownLine]);

  useEffect(() => {
    if (openDropdownLine !== null) {
      console.log('Dropdown opened for line:', openDropdownLine);
    } else {
      console.log('Dropdown closed');
    }
  }, [openDropdownLine]);

  const findListItemRange = useCallback((startLine: number): { start: number; end: number } | null => {
    const lines = analyzer.current.getAllLines();
    const startInfo = analyzer.current.getLineInfo(startLine);
    if (!startInfo.isList) return null;

    const startLevel = startInfo.listLevel || 0;
    let end = startLine;

    for (let i = startLine + 1; i < lines.length; i++) {
      const info = analyzer.current.getLineInfo(i);
      
      if (!info.isList || 
          info.listLevel! <= startLevel ||
          lines[i].trim() === '') {
        break;
      }
      end = i;
    }

    return { start: startLine, end };
  }, []);

  const handleLineHover = useCallback((lineNumber: number | null) => {
    if (lineNumber === null) {
      setLineHovered(null);
      return;
    }
    
    const info = analyzer.current.getLineInfo(lineNumber);
    
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
  }, [findListItemRange]);

  const handleLineLeave = useCallback(() => {
    setActiveLines(new Set());
    setLineHovered(null);
  }, []);

  const getSectionId = useCallback((lineNumber: number) => {
    const info = analyzer.current.getLineInfo(lineNumber);
    return info.sections.length > 0 
      ? info.sections[info.sections.length - 1].id 
      : `line-${lineNumber}`;
  }, []);

  const isLineLocked = useCallback((lineNumber: number) => {
    const info = analyzer.current.getLineInfo(lineNumber);
    
    for (const section of info.sections) {
      if (lockedSections.has(section.id)) {
        return true;
      }
    }
    
    return lockedSections.has(`line-${lineNumber}`);
  }, [lockedSections]);

  const toggleLock = useCallback((lineNumber: number) => {
    const sectionId = getSectionId(lineNumber);
    const newLockedSections = new Set(lockedSections);
    
    if (lockedSections.has(sectionId)) {
      newLockedSections.delete(sectionId);
    } else {
      newLockedSections.add(sectionId);
    }
    
    setLockedSections(newLockedSections);
  }, [lockedSections, getSectionId]);

  const deleteSection = useCallback((lineNumber: number) => {
    const info = analyzer.current.getLineInfo(lineNumber);
    let linesToDelete: number[] = [];

    const sectionId = getSectionId(lineNumber);
    
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
      const section = info.sections[info.sections.length - 1];
      for (let i = section.start; i <= section.end; i++) {
        linesToDelete.push(i);
      }
    } else {
      linesToDelete.push(lineNumber);
    }

    const lines = analyzer.current.getAllLines();
    const updatedLines = lines.filter((_, index) => !linesToDelete.includes(index));
    projectPlan.setCurrentText(updatedLines.join('\n'));
    
    setActiveLines(new Set());
    setLineHovered(null);
    
    const newLockedSections = new Set(lockedSections);
    newLockedSections.delete(sectionId);
    setLockedSections(newLockedSections);
    
  }, [findListItemRange, lockedSections, getSectionId]);

  const handleOptionSelect = useCallback(async (option: string, lineNumber: number, customInstruction?: string) => {
    // Get the currently hovered line or the currently open dropdown line as fallback
    const targetLine = lineNumber;
    
    if (targetLine === null) {
      console.error('No target line found for option select');
      return;
    }
    
    const info = analyzer.current.getLineInfo(targetLine);
    let sectionRange: { start: number; end: number } | null = null;
    
    console.log('Line info for clicked line:', targetLine, info);
    
    if (info.isList) {
      sectionRange = findListItemRange(targetLine);
    } else if (info.sections.length > 0) {
      const deepestSection = info.sections[info.sections.length - 1];
      console.log('Deepest section:', deepestSection);
      
      if (info.isContent) {
        sectionRange = {
          start: deepestSection.contentStart,
          end: deepestSection.contentEnd
        };
      } else if (info.isHeader) {
        sectionRange = {
          start: deepestSection.start,
          end: deepestSection.end
        };
        
        // For h1 headers, find the entire section until the next h1
        if (info.headerLevel === 1) {
          const lines = analyzer.current.getAllLines();
          let endLine = lines.length - 1;
          
          for (let i = targetLine + 1; i < lines.length; i++) {
            const nextInfo = analyzer.current.getLineInfo(i);
            if (nextInfo.isHeader && nextInfo.headerLevel === 1) {
              endLine = i - 1;
              break;
            }
          }
          
          sectionRange = {
            start: targetLine,
            end: endLine
          };
          
          console.log('H1 section range:', sectionRange);
        }
      }
    } 
    
    // If no section was identified or the line isn't part of a section,
    // find the appropriate range for this line consistent with how other functionality works
    if (!sectionRange) {
      // Get all lines to determine appropriate section boundaries
      const lines = analyzer.current.getAllLines();
      
      // For any line not in a recognized section, treat it as if it extends
      // until the next header or the end of the document
      let endLine = targetLine;
      
      for (let i = targetLine + 1; i < lines.length; i++) {
        const nextInfo = analyzer.current.getLineInfo(i);
        if (nextInfo.isHeader) {
          endLine = i - 1;
          break;
        }
        endLine = i;
      }
      
      sectionRange = {
        start: targetLine,
        end: endLine
      };
      
      console.log('Default section range for line without section:', sectionRange);
    }
    
    let instruction = '';
    switch (option) {
      case 'break-down':
        instruction = 'Break down this section into more detailed subtasks or bullet points';
        break;
      case 'more-detail':
        instruction = 'Expand this section with additional details and context';
        break;
      case 'consolidate':
        instruction = 'Consolidate and streamline this section while maintaining all important information';
        break;
      case 'test-delay':
        instruction = 'Test delay';
        break;
      case 'custom':
        instruction = customInstruction || '';
        break;
      default:
        instruction = customInstruction || '';
    }
    
    if (!instruction) return;
    
    console.log(`Applying "${option}" to lines ${sectionRange.start}-${sectionRange.end}`);
    
    const hoveredLine = targetLine;
    
    setEditingSection(sectionRange);
    setOpenDropdownLine(null);
    
    try {
      handleLineHover(hoveredLine);
      
      if (option === 'test-delay') {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      await projectPlan.editMarkdownSection(sectionRange, instruction);
    } catch (error) {
      console.error("Error editing section:", error);
    } finally {
      setEditingSection(null);
      
      setTimeout(() => {
        handleLineLeave();
      }, 1000); 
    }
  }, [findListItemRange, lineHovered, projectPlan, handleLineHover, handleLineLeave]);

  const isLineEditing = useCallback((lineNumber: number) => {
    if (!editingSection) return false;
    return lineNumber >= editingSection.start && lineNumber <= editingSection.end;
  }, [editingSection]);

  const isTopLineEditing = useCallback((lineNumber: number) => {
    if (!editingSection) return false;
    return lineNumber === editingSection.start;
  }, [editingSection]);

  const renderSpinner = () => (
    <div className="editing-spinner">
      <div className="editing-spinner-circle"></div>
      <span className="editing-label">Editing...</span>
    </div>
  );

  const renderButtons = useCallback((lineNumber: number) => {
    const isLocked = isLineLocked(lineNumber);
    const isDropdownOpen = openDropdownLine === lineNumber;
    
    if (!buttonRefs.current.has(lineNumber)) {
      buttonRefs.current.set(lineNumber, React.createRef<HTMLButtonElement>());
    }
    
    if (isLineEditing(lineNumber)) {
      return (
        <div className={`section-buttons ${isLocked ? 'locked-buttons' : ''}`}>
          {renderSpinner()}
        </div>
      );
    }

    return (
      <div className={`section-buttons ${isLocked ? 'locked-buttons' : ''}`}>
        <button 
          className={`icon-button ${isLocked ? 'disabled' : ''}`} 
          title="Delete" 
          onClick={(e) => {
            e.stopPropagation();
            if (!isLocked) deleteSection(lineNumber);
          }}
          disabled={isLocked}
        >
          <TrashIcon className="icon" />
        </button>
        <button 
          className={`icon-button ${isLocked ? 'disabled' : ''}`}
          title="Chat" 
          onClick={(e) => {
            e.stopPropagation();
            if (!isLocked) console.log('Chat:', lineNumber);
          }}
          disabled={isLocked}
        >
          <ChatBubbleLeftIcon className="icon" />
        </button>
        <button 
          className={`icon-button sparkles-button ${isLocked ? 'disabled' : ''} ${isDropdownOpen ? 'active' : ''}`}
          title="Add details" 
          data-line={lineNumber}
          ref={buttonRefs.current.get(lineNumber)}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault(); // Prevent any default actions
            
            if (!isLocked) {
              // Special handling for line 0
              if (lineNumber === 0) {
                console.log('Line 0 sparkles button clicked');
                handleLineHover(lineNumber);
                setOpenDropdownLine(lineNumber);
                
                // For line 0, we'll add a special "must-click" mechanic
                // that prevents closing except through explicit menu item clicks
                return;
              }
              
              // Normal handling for other lines
              setOpenDropdownLine(prevLine => prevLine === lineNumber ? null : lineNumber);
              handleLineHover(lineNumber);
            }
          }}
        >
          <SparklesIcon className="icon" />
          {isDropdownOpen && (
            <CustomDropdownMenu 
              isOpen={true} 
              onClose={() => {
                // Special handling for line 0 - prevent auto-closing
                if (lineNumber === 0) {
                  console.log("Line 0 dropdown - ignoring auto-close");
                  return;
                }
                
                // For all other lines, normal closing behavior
                setOpenDropdownLine(null);
              }}
              lineNumber={lineNumber}
              buttonRef={buttonRefs.current.get(lineNumber) as React.RefObject<HTMLButtonElement>}
              onOptionSelect={(option, lineNumber, customInstruction) => handleOptionSelect(option, lineNumber, customInstruction)}
            />
          )}
        </button>
        <button 
          className="icon-button lock-button"
          title={isLocked ? "Unlock" : "Lock"} 
          onClick={(e) => {
            e.stopPropagation();
            console.log(`${isLocked ? 'Unlock' : 'Lock'}:`, lineNumber);
            toggleLock(lineNumber);
          }}
        >
          {isLocked ? <LockClosedIcon className="icon" /> : <LockOpenIcon className="icon" />}
        </button>
      </div>
    );
  }, [isLineLocked, toggleLock, deleteSection, openDropdownLine, handleLineHover, setOpenDropdownLine, handleOptionSelect, isLineEditing, renderSpinner]);

  const renderLockButton = useCallback((lineNumber: number) => {
    const isLocked = isLineLocked(lineNumber);
    
    return (
      <div className="section-buttons lock-only-buttons">
        <button 
          className="icon-button lock-button"
          title={isLocked ? "Unlock" : "Lock"} 
          onClick={(e) => {
            e.stopPropagation();
            console.log(`${isLocked ? 'Unlock' : 'Lock'}:`, lineNumber);
            toggleLock(lineNumber);
          }}
        >
          {isLocked ? <LockClosedIcon className="icon" /> : <LockOpenIcon className="icon" />}
        </button>
      </div>
    );
  }, [isLineLocked, toggleLock]);

  const renderMarkdown = useCallback(() => {
    const content = projectPlan.currentText || initialMarkdown || '';
    analyzer.current = new MarkdownSectionAnalyzer(content);
    const lines = analyzer.current.getAllLines();
    
    return (
      <pre>
        <code className="markdown-raw">
          {lines.map((line, index) => {
            const info = analyzer.current.getLineInfo(index);
            const classes = ['line'];
            const isLocked = isLineLocked(index);
            const isDropdownOpen = openDropdownLine === index;
            const isEditing = isLineEditing(index);
            
            if (info.isHeader) {
              classes.push('header');
              classes.push(`h${info.headerLevel}`);
            }
            
            if (info.isList) {
              classes.push('list-item');
              if (info.listLevel) {
                classes.push(`list-level-${info.listLevel}`);
              }
            }
            
            if (activeLines.has(index)) {
              classes.push('highlight');
            }
            
            if (lineHovered === index) {
              classes.push('hover');
            }
            
            if (isEditing) {
              classes.push('editing-line');
              classes.push('highlight');
            }
            
            if (isLocked) {
              classes.push('locked');
            }
            
            return (
              <div 
                key={index}
                className={classes.join(' ')}
                onMouseEnter={() => handleLineHover(index)}
                onMouseLeave={handleLineLeave}
                onClick={() => {
                  handleLineHover(index);
                  console.log('Line clicked:', index, line);
                }}
                data-line={index}
              >
                {line}
                
                {isTopLineEditing(index) && renderButtons(index)}
                
                {!isEditing && (
                  ((activeLines.has(index) && lineHovered === index) || isDropdownOpen) ? 
                  renderButtons(index) : 
                  (isLocked && info.isHeader) ? 
                  renderLockButton(index) : 
                  null
                )}
              </div>
            );
          })}
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
    projectPlan.currentText, 
    renderButtons, 
    renderLockButton, 
    initialMarkdown, 
    isLineEditing, 
    isTopLineEditing
  ]);

  return (
    <div className="markdown-viewer-container">
      <div className="markdown-container markdown-raw">
        {renderMarkdown()}
      </div>
    </div>
  );
};