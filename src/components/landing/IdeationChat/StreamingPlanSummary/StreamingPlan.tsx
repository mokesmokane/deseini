import { useState, useEffect } from 'react';
import { EditDialog } from './EditDialog';
import { PlanSummary } from './PlanSummary';
import { formatDate, formatDuration } from './utils';
import { FadeThoughts } from './FadeThoughts';

interface StreamingPlanProps {
  data: {
    label: string;
    isVisible: boolean;
  };
  streamSummary: string | null;
  newSummary: any | null;
}

export const StreamingPlan = ({ data, streamSummary, newSummary }: StreamingPlanProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogText, setDialogText] = useState('');
  
  const isLoading = !newSummary || !newSummary.sketchSummary;
  const hasThoughts = newSummary?.thinking && newSummary.thinking.length > 0;
  const mostRecentThought = hasThoughts ? newSummary.thinking[newSummary.thinking.length - 1].summary : '';
  
  // Track the previous thought to animate between them
  const [currentThought, setCurrentThought] = useState('');

  useEffect(() => {
    if (mostRecentThought && mostRecentThought !== currentThought) {
      setCurrentThought(mostRecentThought);
    }
  }, [mostRecentThought, currentThought]);

  const handleShowFullText = () => {
    setDialogOpen(true);
    setDialogText(newSummary?.allText || '');
  };

  const handleShowChartSyntax = () => {
    setDialogOpen(true);
    setDialogText(newSummary?.mermaidMarkdown || '');
  };

  return (
    <>
      <EditDialog 
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        text={dialogText}
        onTextChange={setDialogText}
        title={dialogText === newSummary?.allText ? 'Full Streamed Text' : 'Mermaid Syntax'}
        contextActions={{ 
          newSummary, 
          handleShowFullText, 
          handleShowChartSyntax 
        }}
      />
      
      <div
        className="relative bg-white rounded-xl overflow-hidden border border-gray-300 shadow-sm"
        style={{
          opacity: data.isVisible ? 1 : 0,
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          margin: '2rem 0 1.5rem 0',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 1200,
        }}
      >
        {/* Content container */}
        <div className="relative z-10 p-6">
          <div className="font-bold text-lg mb-4 text-black">
            Creating plan sketch
          </div>
          {/* Streaming state with thoughts */}
          <div 
            className={`transition-all duration-500 ease-in-out ${isLoading ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 pointer-events-none absolute'}`}
            style={{ width: '100%' }}
          >
            {hasThoughts && (
              <FadeThoughts thoughts={newSummary?.thinking || []} />
            )}
            
            {!hasThoughts && (
              <div className="text-gray-500 italic">
                {streamSummary || 'Processing...'}
              </div>
            )}
            
            {/* Shimmer effect for loading state */}
            <div className={`shimmer-effect overflow-hidden ${isLoading ? 'before:absolute before:inset-0 before:w-full before:h-full before:-translate-x-full before:animate-shimmer before:bg-gradient-to-r before:from-transparent before:via-gray-300 before:to-transparent' : ''}`} />
          </div>
          
          {/* Final state with project timeline */}
          <div className={`transition-all duration-500 ease-in-out ${!isLoading ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}`}>
            {!isLoading && (
              <PlanSummary 
                newSummary={newSummary} 
                formatDate={formatDate}
                formatDuration={formatDuration}
              />
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-effect::before {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </>
  );
};