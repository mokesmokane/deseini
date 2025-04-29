import React, { useRef, useState, useEffect } from 'react';
import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';

interface PlanGenerationStatusProps {
  isLoading?: boolean;
  streamSummary?: string;
}

const PlanGenerationStatus: React.FC<PlanGenerationStatusProps> = ({
  isLoading,
  streamSummary
}) => {
  const { 
    isLoading: contextIsLoading,
    streamSummary: contextStreamSummary,
    fullSyntax
  } = useDraftPlanMermaidContext();

  // Use provided props or context values
  const isMermaidLoading = isLoading !== undefined ? isLoading : contextIsLoading;
  const currentStreamSummary = streamSummary || contextStreamSummary;
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailedSummary, setDetailedSummary] = useState('');
  const detailedSummaryRef = useRef<HTMLDivElement>(null);
  const prevSummaryRef = useRef('');
  
  // Reset detailed summary when a new summary is received
  useEffect(() => {
    if (currentStreamSummary && currentStreamSummary !== prevSummaryRef.current) {
      setDetailedSummary('');
      prevSummaryRef.current = currentStreamSummary;
    }
  }, [currentStreamSummary]);

  // Update detailed summary with new content when fullSyntax changes
  useEffect(() => {
    if (fullSyntax && currentStreamSummary === prevSummaryRef.current) {
      // Extract the relevant text after the current summary
      const lines = fullSyntax.split('\n');
      const summaryIndex = lines.findIndex((line: string) => line.includes(currentStreamSummary));
      
      if (summaryIndex >= 0) {
        const detailedContent = lines.slice(summaryIndex + 1).join('\n');
        setDetailedSummary(detailedContent);
      }
    }
  }, [fullSyntax, currentStreamSummary]);
  
  // Scroll to the bottom whenever detailed summary changes
  useEffect(() => {
    if (detailedSummaryRef.current && dialogOpen) {
      const element = detailedSummaryRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [detailedSummary, dialogOpen]);

  // If we're not loading and have no summary, don't show anything
  if (!isMermaidLoading && !currentStreamSummary) {
    return null;
  }

  // Shimmer animation for loading state
  const shimmerStyle = isMermaidLoading ? {
    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite',
    animationTimingFunction: 'linear',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundColor: '#000000',
    color: '#ffffff',
  } : {};

  return (
    <>
      <div
        onClick={() => setDialogOpen(true)}
        className="cursor-pointer px-4 py-2 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-gray-50 transition-colors"
        style={{
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '14px',
          fontWeight: 'bold',
          ...shimmerStyle
        }}
      >
        {currentStreamSummary || "Generating plan..."}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-medium text-lg">Plan Generation Progress</h3>
              <button 
                onClick={() => setDialogOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <div className="font-bold mb-2" style={shimmerStyle}>
                {currentStreamSummary || "Generating..."}
              </div>
              {detailedSummary && (
                <div 
                  ref={detailedSummaryRef}
                  className="whitespace-pre-wrap text-sm mt-4 font-mono p-2 bg-gray-50 rounded border border-gray-200 max-h-[60vh] overflow-auto"
                >
                  {detailedSummary}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Add CSS for shimmer animation if it doesn't exist
if (typeof document !== 'undefined') {
  if (!document.getElementById('shimmer-animation-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'shimmer-animation-style';
    styleElement.innerHTML = `
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(styleElement);
  }
}

export default PlanGenerationStatus;
