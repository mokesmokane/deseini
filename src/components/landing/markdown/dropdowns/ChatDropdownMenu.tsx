import React, { useState } from 'react';
import { DropdownBase } from './DropdownBase';

interface ChatDropdownMenuProps {
  isOpen: boolean; 
  onClose: () => void;
  lineNumber: number;
  buttonRef: React.RefObject<HTMLButtonElement>;
  onChatOptionSelect: (option: string, lineNumber: number, customMessage?: string) => void;
}

export const ChatDropdownMenu: React.FC<ChatDropdownMenuProps> = ({
  isOpen, 
  onClose,
  lineNumber,
  buttonRef,
  onChatOptionSelect
}) => {
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleMessageSubmit = () => {
    if (customMessage.trim() && !isLoading) {
      setIsLoading(true);
      onChatOptionSelect('custom', lineNumber, customMessage);
      onClose();
    }
  };
  
  const options = [
    { 
      label: 'This needs work', 
      action: () => {
        if (!isLoading) {
          onChatOptionSelect('needs-work', lineNumber);
          onClose();
        }
      }
    },
    { 
      label: 'Evaluate this section', 
      action: () => {
        if (!isLoading) {
          onChatOptionSelect('evaluate', lineNumber);
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
          placeholder="Type custom message..."
          value={customMessage}
          onChange={(e) => {
            setCustomMessage(e.target.value);
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
            handleMessageSubmit();
          }}
          disabled={!customMessage.trim() || isLoading}
          onMouseEnter={() => {}}
          onFocus={() => {}}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </div>
    </DropdownBase>
  );
};
