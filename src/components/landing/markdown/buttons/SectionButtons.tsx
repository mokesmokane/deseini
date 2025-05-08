import React from 'react';
import { TrashIcon, ChatBubbleLeftIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { LockButton } from './LockButton';
import { CustomDropdownMenu } from '../dropdowns/CustomDropdownMenu';

interface SectionButtonsProps {
  lineNumber: number;
  activeLines: Set<number>; // NEW: all currently hovered/active lines
  isLocked: boolean;
  isLineEditing: boolean;
  isDropdownOpen: boolean;
  buttonRef: React.RefObject<HTMLButtonElement>;
  chatButtonRef: React.RefObject<HTMLButtonElement>;
  toggleLock: (lineNumber: number) => void;
  deleteSection: (lineNumber: number) => void;
  setOpenDropdownLine: (callback: ((prevLine: number | null) => number | null) | number | null) => void;
  handleLineHover: (lineNumber: number) => void;
  handleOptionSelect: (option: string, lineNumber: number, customInstruction?: string) => void;
  handleChatOptionSelect: (option: string, lineNumbers: number[], customMessage?: string) => void;
}

export const SectionButtons: React.FC<SectionButtonsProps> = ({
  lineNumber,
  activeLines,
  isLocked,
  isLineEditing,
  isDropdownOpen,
  buttonRef,
  chatButtonRef,
  toggleLock,
  deleteSection,
  setOpenDropdownLine,
  handleLineHover,
  handleOptionSelect,
  handleChatOptionSelect
}) => {
  
  const renderSpinner = () => (
    <div className="editing-spinner">
      <div className="editing-spinner-circle"></div>
      <span className="editing-label">Editing...</span>
    </div>
  );
  
  if (isLineEditing) {
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
        title="Quote this section" 
        ref={chatButtonRef}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          
          if (!isLocked) {
            // Instead of showing a dropdown, directly create a quote for all hovered/active lines
            handleChatOptionSelect('quote', Array.from(activeLines));
            // Visual feedback that the quote was created
            const button = chatButtonRef.current;
            if (button) {
              button.classList.add('flash');
              setTimeout(() => button.classList.remove('flash'), 500);
            }
          }
        }}
        disabled={isLocked}
      >
        <ChatBubbleLeftIcon className="icon" />
      </button>
      <button 
        className={`icon-button sparkles-button ${isLocked ? 'disabled' : ''} ${isDropdownOpen ? 'active' : ''}`}
        title="Add details" 
        data-line={lineNumber}
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          
          if (!isLocked) {
            setOpenDropdownLine(prevLine => prevLine === lineNumber ? null : lineNumber);
            handleLineHover(lineNumber);
          }
        }}
      >
        <SparklesIcon className="icon" />
        {isDropdownOpen && (
          <CustomDropdownMenu 
            isOpen={true} 
            onClose={() => setOpenDropdownLine(null)}
            lineNumber={lineNumber}
            buttonRef={buttonRef}
            onOptionSelect={handleOptionSelect}
          />
        )}
      </button>
      <LockButton 
        isLocked={isLocked}
        lineNumber={lineNumber}
        toggleLock={toggleLock}
      />
    </div>
  );
};

// Separate component for lock-only buttons
export const LockOnlyButtons: React.FC<{
  lineNumber: number;
  isLocked: boolean;
  toggleLock: (lineNumber: number) => void;
}> = ({
  lineNumber,
  isLocked,
  toggleLock
}) => {
  return (
    <div className="section-buttons lock-only-buttons">
      <LockButton 
        isLocked={isLocked}
        lineNumber={lineNumber}
        toggleLock={toggleLock}
      />
    </div>
  );
};
