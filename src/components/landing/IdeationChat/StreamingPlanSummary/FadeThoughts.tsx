import { memo } from 'react';
import AnimatedTimeline from './AnimatedDots/AnimatedTimeline';

interface ThoughtStreamProps {
  thoughts: Array<{ summary: string }>;
}

export const FadeThoughts = memo(({ thoughts }: ThoughtStreamProps) => {
  
  return (
    <div className="relative bg-gray-800/50 rounded-lg p-4 border border-purple-500/30 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 animate-shimmer" />
      
      <div className="relative">
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-purple-400 font-medium">Thinking</span>
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
              <div className="bg-gray-700/50 backdrop-blur-sm rounded-lg p-3 border border-purple-500/20">
                <div className="relative overflow-hidden">
                  {thought.summary}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-2 text-xs text-purple-400/60">
          {thoughts.length}
        </div>
      </div>
    </div>
  );
});