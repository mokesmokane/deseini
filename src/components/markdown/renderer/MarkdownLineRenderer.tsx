import React from 'react';
import { SectionButtons, LockOnlyButtons } from '../buttons/SectionButtons';

interface MarkdownLineProps {
  line: string;
  lineNumber: number;
  isHeader: boolean;
  headerLevel?: number;
  isList: boolean;
  listLevel?: number;
  isActive: boolean;
  isHovered: boolean;
  isEditing: boolean;
  isTopLineEditing: boolean;
  isLocked: boolean;
  isDropdownOpen: boolean;
  isChatDropdownOpen: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  chatButtonRef: React.RefObject<HTMLButtonElement>;
  handleLineHover: (lineNumber: number) => void;
  handleLineLeave: () => void;
  handleOptionSelect: (option: string, lineNumber: number, customInstruction?: string) => void;
  handleChatOptionSelect: (option: string, lineNumber: number, customMessage?: string) => void;
  setOpenDropdownLine: (callback: ((prevLine: number | null) => number | null) | number | null) => void;
  setOpenChatDropdownLine: (callback: ((prevLine: number | null) => number | null) | number | null) => void;
  toggleLock: (lineNumber: number) => void;
  deleteSection: (lineNumber: number) => void;
  isLineEditing: (lineNumber: number) => boolean;
  onDoubleClick?: (lineNumber: number) => void;
}

export const MarkdownLineRenderer: React.FC<MarkdownLineProps> = ({
  line,
  lineNumber,
  isHeader,
  headerLevel,
  isList,
  listLevel,
  isActive,
  isHovered,
  isEditing,
  isTopLineEditing,
  isLocked,
  isDropdownOpen,
  isChatDropdownOpen,
  buttonRef,
  chatButtonRef,
  handleLineHover,
  handleLineLeave,
  handleOptionSelect,
  handleChatOptionSelect,
  setOpenDropdownLine,
  setOpenChatDropdownLine,
  toggleLock,
  deleteSection,
  isLineEditing,
  onDoubleClick
}) => {
  const classes = ['line'];
  
  if (isHeader) {
    classes.push('header');
    classes.push(`h${headerLevel}`);
  }
  
  if (isList) {
    classes.push('list-item');
    if (listLevel) {
      classes.push(`list-level-${listLevel}`);
    }
  }
  
  if (isActive) {
    classes.push('highlight');
  }
  
  if (isHovered) {
    classes.push('hover');
  }
  
  if (isEditing) {
    classes.push('editing-line');
    classes.push('highlight');
  }
  
  if (isLocked) {
    classes.push('locked');
  }
  
  const shouldShowButtons = 
    (isActive && isHovered) || 
    isDropdownOpen || 
    isChatDropdownOpen;
  
  const shouldShowLockOnly = 
    !shouldShowButtons && 
    isLocked && 
    isHeader;

  const handleDoubleClick = () => {
    if (onDoubleClick && !isLocked) {
      onDoubleClick(lineNumber);
    }
  };
  
  return (
    <div 
      className={classes.join(' ')}
      onMouseEnter={() => handleLineHover(lineNumber)}
      onMouseLeave={handleLineLeave}
      onClick={() => {
        handleLineHover(lineNumber);
        console.log('Line clicked:', lineNumber, line);
      }}
      onDoubleClick={handleDoubleClick}
      data-line={lineNumber}
    >
      {line}
      
      {isTopLineEditing && (
        <SectionButtons
          lineNumber={lineNumber}
          isLocked={isLocked}
          isLineEditing={isLineEditing(lineNumber)}
          isDropdownOpen={isDropdownOpen}
          isChatDropdownOpen={isChatDropdownOpen}
          buttonRef={buttonRef}
          chatButtonRef={chatButtonRef}
          toggleLock={toggleLock}
          deleteSection={deleteSection}
          setOpenDropdownLine={setOpenDropdownLine}
          setOpenChatDropdownLine={setOpenChatDropdownLine}
          handleLineHover={handleLineHover}
          handleOptionSelect={handleOptionSelect}
          handleChatOptionSelect={handleChatOptionSelect}
        />
      )}
      
      {!isEditing && shouldShowButtons && (
        <SectionButtons
          lineNumber={lineNumber}
          isLocked={isLocked}
          isLineEditing={isLineEditing(lineNumber)}
          isDropdownOpen={isDropdownOpen}
          isChatDropdownOpen={isChatDropdownOpen}
          buttonRef={buttonRef}
          chatButtonRef={chatButtonRef}
          toggleLock={toggleLock}
          deleteSection={deleteSection}
          setOpenDropdownLine={setOpenDropdownLine}
          setOpenChatDropdownLine={setOpenChatDropdownLine}
          handleLineHover={handleLineHover}
          handleOptionSelect={handleOptionSelect}
          handleChatOptionSelect={handleChatOptionSelect}
        />
      )}
      
      {!isEditing && shouldShowLockOnly && (
        <LockOnlyButtons 
          lineNumber={lineNumber}
          isLocked={isLocked}
          toggleLock={toggleLock}
        />
      )}
    </div>
  );
};
