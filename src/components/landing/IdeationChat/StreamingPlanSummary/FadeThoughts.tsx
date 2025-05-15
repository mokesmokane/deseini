import { useState, useEffect, useRef } from 'react';
import FibonacciFlower from '@/components/ui/FibonacciFlower';
import { Thought } from '@/utils/types';

interface ThoughtStreamProps {
  thoughts: Array<Thought>;
  shimmer?: boolean;
  colorPalette?: 'neon' | 'pastel' | 'ocean' | 'forest' | 'sunset' | 'berry' | 'cosmic' | 'candy' | 'earth' | 'grayscale' | 'white';
}
export const FadeThoughts = ({ thoughts, shimmer = true, colorPalette }: ThoughtStreamProps) => {
  const [expanded, setExpanded] = useState(false);
  const [displayedThoughtContent, setDisplayedThoughtContent] = useState('');
  const previousThoughtsRef = useRef<Array<Thought>>([]);
  
  const mostRecent = thoughts.length > 0 ? thoughts[thoughts.length - 1] : null;
  
  // Ref for the scrollable content area
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Update displayed content whenever thoughts change
  useEffect(() => {
    if (!mostRecent) return;
    
    // Check if this is a new thought or an update to existing thought
    if (previousThoughtsRef.current.length !== thoughts.length) {
      // New thought added
      setDisplayedThoughtContent(mostRecent.thoughts || '');
    } else if (mostRecent && previousThoughtsRef.current.length > 0) {
      // Update to existing thought
      const prevMostRecent = previousThoughtsRef.current[previousThoughtsRef.current.length - 1];
      if (prevMostRecent?.thoughts !== mostRecent.thoughts) {
        console.log('Content updated:', mostRecent.thoughts);
        setDisplayedThoughtContent(mostRecent.thoughts || '');
      }
    }
    
    // Store current thoughts for next comparison
    previousThoughtsRef.current = [...thoughts];
    
    // Scroll to bottom when content changes
    if (contentRef.current) {
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }, 50); // Small delay to ensure DOM has updated
    }
  }, [thoughts, mostRecent]);
  
  return (
    <div className="flex flex-col w-full">
      {/* Top summary row */}
      <div className="flex flex-row items-center bg-black rounded-lg shadow-md w-full h-[70px] p-2">
        {/* Fibonacci flower all the way on the left */}
        <div className="flex items-center justify-center h-full min-w-[60px] py-1">
          <FibonacciFlower 
            palette={colorPalette || "white"} 
            items={thoughts.map((thought, index) => ({ id: index, summary: thought.summary }))} 
          />
        </div>
        
        {/* Summary takes up remaining space */}
        <div className="flex-1 h-full flex items-center mx-2 overflow-hidden relative px-2 rounded-lg">
          {mostRecent && (
            <>
              <span className="text-gray-100 text-sm w-full overflow-hidden text-ellipsis whitespace-nowrap relative z-10">
                {mostRecent.summary}
              </span>
              
              {/* Shimmer effect */}
              {shimmer && (
                <div 
                  className="w-[200%] h-full absolute top-0 right-0 bg-gradient-to-r from-transparent via-gray-400/10 to-transparent -translate-x-full animate-shimmer rounded-lg" 
                  style={{ backgroundSize: '200% 100%', animationDuration: '2.2s' }}
                />
              )}
            </>
          )}
        </div>
        
        {/* Expansion button all the way on the right */}
        {(typeof mostRecent?.thoughts === 'string' && mostRecent.thoughts.length > 0) && (
          <button
            className="flex items-center justify-center p-1 rounded transition-colors focus:outline-none text-gray-400 hover:text-white ml-2"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              setExpanded(exp => !exp);
            }}
          >
            {expanded ? (
              // Up chevron
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 12l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              // Down chevron
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        )}
      </div>
      
      {/* Expanded area below summary row - visible only when expanded */}
      <div 
        className="w-full bg-black border-x border-b border-gray-800 rounded-b-lg shadow-inner px-6 overflow-hidden mt-[-8px] mb-2 hide-scrollbar"
        style={{
          height: expanded && displayedThoughtContent.length > 0 ? '150px' : '0px',
          opacity: expanded ? 1 : 0,
          transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s cubic-bezier(0.4,0,0.2,1), padding 0.3s cubic-bezier(0.4,0,0.2,1)',
          padding: expanded && displayedThoughtContent.length > 0 ? '16px 24px' : '0px 24px',
          boxSizing: 'border-box',
        }}
      >
        <div 
          className="prose prose-sm whitespace-pre-line text-gray-400 min-h-full flex flex-col justify-start hide-scrollbar" 
          style={{
            fontSize: '0.875rem',
            lineHeight: '1.4',
            overflowY: 'auto',
            height: '100%',
          }}
          ref={contentRef}
        >
          {displayedThoughtContent}
        </div>
      </div>
    </div>
  );
};