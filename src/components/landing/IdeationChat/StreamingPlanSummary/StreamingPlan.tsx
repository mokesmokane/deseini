import { useState, useEffect } from 'react';
import { PlanSummary } from './PlanSummary';
import { FadeThoughts } from './FadeThoughts';
import { StreamSummary, SketchSummary } from '@/utils/types';

interface StreamingPlanProps {
  data: {
    label: string;
    isVisible: boolean;
  };
  newSummary: StreamSummary | undefined;
  sketchSummary: SketchSummary | undefined;
}

export const StreamingPlan = ({ data, newSummary, sketchSummary }: StreamingPlanProps) => {
  
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
        className="relative bg-gray-800 rounded-md overflow-hidden border border-gray-700 shadow-md"
        style={{
          opacity: data.isVisible ? 1 : 0,
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          // margin: '2rem 0 1.5rem 0',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: 1200,
        }}
      >
        <div className="relative z-10 p-4">
        {isLoading ? (
  <FadeThoughts thoughts={newSummary?.thinking || []} />
) : (
  
  <FadeThoughts shimmer={false} thoughts={[...newSummary?.thinking || [], { summary: 'Finished Reasoning', thoughts: "" }]} colorPalette="neon" />
)}
          
          <div className={`transition-all duration-500 ease-in-out ${!isLoading ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-4'}`}>
            {sketchSummary && (
              <PlanSummary 
                sketchSummary={sketchSummary}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};