import React, { useEffect } from 'react';
import { useEditedSection } from '../contexts/EditedSectionContext';
import { StreamingDiff } from './StreamingDiff';

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
    currentText, 
    previousText, 
    isStreaming, 
    currentLineNumber,
    startEditing, 
    clearEditing 
  } = useEditedSection();

  // Start the editing process when the component mounts
  useEffect(() => {
    startEditing(range, instruction);
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
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Section Edit</h2>
          <p className="text-sm text-gray-500 mt-1">{instruction}</p>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content - StreamingDiff component replaces the side-by-side view */}
      <div className="flex-1 overflow-auto p-4">
        {currentText && (
          <StreamingDiff/>
        )}

        {/* Show loading indicator during streaming */}
        {isStreaming && (
          <div className="fixed bottom-20 left-0 right-0 flex justify-center">
            <div className="bg-white border border-gray-200 rounded-full px-4 py-2 shadow-md flex items-center space-x-2">
              <div className="animate-pulse flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
              <span className="text-sm text-gray-600">Generating changes...</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer with actions */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isStreaming}
          >
            Reject Changes
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
            disabled={isStreaming || !currentText}
          >
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
};
