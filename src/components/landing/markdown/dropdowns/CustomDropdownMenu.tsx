import React, { useState } from 'react';
import { DropdownBase } from './DropdownBase';

interface CustomDropdownMenuProps {
  isOpen: boolean; 
  onClose: () => void;
  lineNumber: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onOptionSelect: (option: string, lineNumber: number, customInstruction?: string) => void;
}

export const CustomDropdownMenu: React.FC<CustomDropdownMenuProps> = ({
  isOpen, 
  onClose,
  lineNumber,
  buttonRef,
  onOptionSelect
}) => {
  const [customInstruction, setCustomInstruction] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInstructionSubmit = () => {
    if (customInstruction.trim() && !isLoading) {
      setIsLoading(true);
      onOptionSelect('custom', lineNumber, customInstruction);
      onClose();
    }
  };
  
  const options = [
    { 
      label: 'Break Down', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'break-down'`);
          onOptionSelect('break-down', lineNumber);
          onClose();
        }
      }
    },
    { 
      label: 'More Detail', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'more-detail'`);
          onOptionSelect('more-detail', lineNumber);
          onClose();
        }
      }
    },
    { 
      label: 'Consolidate', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'consolidate'`);
          onOptionSelect('consolidate', lineNumber);
          onClose();
        }
      }
    },
    { 
      label: 'Test (5s Delay)', 
      action: () => {
        if (!isLoading) {
          console.log(`Directly calling onOptionSelect for line ${lineNumber} with option 'test-delay'`);
          onOptionSelect('test-delay', lineNumber);
          onClose();
        }
      }
    },
  ];
  
  return (
    <DropdownBase 
      isOpen={isOpen} 
      onClose={onClose} 
      lineNumber={lineNumber} 
      buttonRef={buttonRef}
    >
      {options.map((option, index) => (
        <button 
          key={index}
          className="dropdown-item"
          role="menuitem"
          onClick={() => {
            option.action();
          }}
          disabled={isLoading}
          onMouseEnter={() => {}}
          onFocus={() => {}}
        >
          {isLoading ? 'Processing...' : option.label}
        </button>
      ))}
      <div className="dropdown-custom-instruction">
        <textarea
          className="custom-instruction-input"
          placeholder="Type custom instruction..."
          value={customInstruction}
          onChange={(e) => {
            setCustomInstruction(e.target.value);
          }}
          onFocus={() => {}}
          onMouseDown={(e) => {
            // Prevent propagation to keep dropdown open
            e.stopPropagation();
          }}
          disabled={isLoading}
        />
        <button 
          className="custom-instruction-submit"
          onClick={() => {
            handleInstructionSubmit();
          }}
          disabled={!customInstruction.trim() || isLoading}
          onMouseEnter={() => {}}
          onFocus={() => {}}
        >
          {isLoading ? 'Processing...' : 'Submit'}
        </button>
      </div>
    </DropdownBase>
  );
};
