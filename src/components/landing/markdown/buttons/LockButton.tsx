import React from 'react';
import { LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';

interface LockButtonProps {
  isLocked: boolean;
  lineNumber: number;
  toggleLock: (lineNumber: number) => void;
}

export const LockButton: React.FC<LockButtonProps> = ({
  isLocked,
  lineNumber,
  toggleLock
}) => {
  return (
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
  );
};
