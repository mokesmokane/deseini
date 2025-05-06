import { memo } from 'react';
import AnimatedTimeline from './AnimatedDots/AnimatedTimeline';

interface ThoughtStreamProps {
  thoughts: Array<{ summary: string }>;
}

export const FadeThoughts = memo(({ thoughts }: ThoughtStreamProps) => {
  
  return (
    <div className="relative bg-gray-800 rounded-lg p-4 border border-gray-700 shadow-md overflow-hidden">
      
      <div className="relative">
        <div className="flex items-center mb-3">
          <AnimatedTimeline items={thoughts.map((thought, index) => ({ id: index, summary: thought.summary }))} />
        </div>
        
        <div className="relative h-[100px] overflow-hidden">
          {thoughts.map((thought, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ${
                index === thoughts.length - 1
                  ? 'opacity-100 scale-100 translate-y-0'
                  : 'opacity-0 scale-95 -translate-y-2'
              }`}
            >
              <div className="bg-gray-900 rounded-lg p-3 border border-gray-700 shadow-md relative overflow-hidden">
                <div className="prose prose-sm text-gray-300 relative z-10">
                  {thought.summary}
                </div>
                {/* The shimmer effect layer as a separate absolutely positioned element */}
                <div className="absolute inset-0 overflow-hidden">
                  <div 
                    className="w-[200%] h-full absolute top-0 right-0 bg-gradient-to-r from-transparent via-gray-400/10 to-transparent -translate-x-full animate-shimmer" 
                    style={{ backgroundSize: '200% 100%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          {thoughts.length}
        </div>
      </div>
    </div>
  );
});