import { useState, useEffect } from 'react';
import { PlanSummary } from './PlanSummary';
import { formatDate, formatDuration } from './utils';
import { FadeThoughts } from './FadeThoughts';

interface StreamingPlanProps {
  data: {
    label: string;
    isVisible: boolean;
  };
  newSummary: any | null;
}

export const StreamingPlan = ({ data, newSummary }: StreamingPlanProps) => {
  
  const isLoading = !newSummary?.sketchSummary;
  const hasThoughts = newSummary?.thinking && newSummary.thinking.length > 0;
  const mostRecentThought = hasThoughts ? newSummary.thinking[newSummary.thinking.length - 1].summary : '';
  
  const [currentThought, setCurrentThought] = useState('');

  useEffect(() => {
    if (mostRecentThought && mostRecentThought !== currentThought) {
      setCurrentThought(mostRecentThought);
    }
  }, [mostRecentThought, currentThought]);

  return (
    <>
      <div
        className="relative bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-md"
        style={{
          opacity: data.isVisible ? 1 : 0,
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          margin: '2rem 0 1.5rem 0',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 1200,
        }}
      >
        <div className="relative z-10 p-6">
        {isLoading && (
          <div className="text-lg mb-4 text-white">
            Thinking...
          </div>
        )}
          <div 
            className={`transition-all duration-500 ease-in-out ${isLoading ? 'opacity-100 max-h-[500px]' : 'opacity-0 max-h-0 pointer-events-none absolute'}`}
            style={{ width: '100%' }}
          >
            {hasThoughts && (
              <FadeThoughts thoughts={newSummary?.thinking || []} />
            )}
          </div>
          
          <div className={`transition-all duration-500 ease-in-out ${!isLoading ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}`}>
            {newSummary?.sketchSummary && (
              <PlanSummary 
                sketchSummary={newSummary!.sketchSummary} 
                formatDate={formatDate}
                formatDuration={formatDuration}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};