import React, { useEffect, useRef } from 'react';
import { useEditedSection } from '../contexts/EditedSectionContext'
import { SectionDiff } from './SectionDiff';

interface SectionDiffPanelProps {
  range: { start: number; end: number };
  instruction: string;
  onCancel: () => void;
  className?: string;
}

export const SectionDiffPanel: React.FC<SectionDiffPanelProps> = ({ 
  range, 
  instruction, 
  onCancel,
  className = ''
}) => {
  const {  
    isStreaming,
    startEditing
  } = useEditedSection();

  // Ref to track if editing has already started
  const hasStartedEditingRef = useRef(false);

  // Start the editing process when the component mounts
  useEffect(() => {
    if (!hasStartedEditingRef.current) {
      startEditing(range, instruction);
      hasStartedEditingRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, instruction]);

  const handleAccept = async () => {
    // await acceptChanges();
    onCancel();
  };

  const handleReject = () => {
    // rejectChanges();
    onCancel();
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-opacity-10 border-black">
        <div>
          <h2 className="text-xl font-medium text-black">Section Edit</h2>
        </div>
        <button
          onClick={onCancel}
          className="text-black text-opacity-40 hover:text-opacity-80 transition-colors duration-200"
          aria-label="Close panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content - StreamingDiff component replaces the side-by-side view */}
      <div className="flex-1 overflow-auto p-4 bg-white">
        <SectionDiff onClose={onCancel}/>
      </div>

      {/* Footer with actions */}
      <div className="border-t border-opacity-10 border-black p-4 bg-white">
        <div className="flex justify-end space-x-4">
          <button
            onClick={handleReject}
            className="px-5 py-2 border border-black border-opacity-10 rounded-md text-black text-opacity-80 hover:bg-black hover:bg-opacity-5 transition-all duration-200 shadow-sm focus:outline-none focus:ring-1 focus:ring-black focus:ring-opacity-20"
            disabled={isStreaming}
          >
            Reject Changes
          </button>
          <button
            onClick={handleAccept}
            className="px-5 py-2 bg-black bg-opacity-90 text-white rounded-md hover:bg-opacity-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-20"
            disabled={isStreaming}
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
};
