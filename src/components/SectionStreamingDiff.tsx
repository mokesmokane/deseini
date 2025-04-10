// import React, { useEffect, useRef, useState } from 'react';
// import { diffLines } from 'diff';
// import './StreamingDiff.css'; // Reuse the same CSS

// interface SectionStreamingDiffProps {
//   originalContent: string;
//   editedContent: string;
//   isStreaming: boolean;
//   currentLineNumber: number;
//   onComplete?: () => void;
// }

// export const SectionStreamingDiff: React.FC<SectionStreamingDiffProps> = ({
//   originalContent,
//   editedContent,
//   isStreaming,
//   currentLineNumber,
//   onComplete
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);
//   // Track if animations have been run
//   const [animationsRun, setAnimationsRun] = useState(false);
//   // Track previous streaming state to detect completion
//   const wasStreamingRef = useRef(isStreaming);

//   // Process individual lines for rendering
//   const processLine = (line: string, lineNumber: number, isRemoved: boolean, isAdded: boolean): string => {
//     // Skip empty marker lines if any
//     if (line.includes('event: stream_') || line.trim() === '---event: stream_end') {
//       return '';
//     }

//     const lineNumberClass = lineNumber === currentLineNumber ? 'line-number active' : 'line-number';
//     let lineClass = 'line';
//     let textClass = 'diff-span'; // Always use diff-span class for font consistency
    
//     const isHighlighted = lineNumber <= currentLineNumber;
    
//     if (isRemoved && isHighlighted) {
//       lineClass += ' diff-line-removed bg-red-100';
//       textClass += ' text-red-500';
//     } else if (isAdded && isHighlighted) {
//       lineClass += ' diff-line-added bg-green-100';
//       textClass += ' text-green-500';
//     }

//     // Preserve whitespace by adding a style attribute
//     const formattedLine = line.replace(/^(\s*)(.*)$/g, (_, indentation, content) => {
//       if (indentation.length > 0) {
//         return `<span style="white-space: pre;">${indentation}</span>${content}`;
//       }
//       return content;
//     });

//     // Apply background color to the entire line div
//     return `<div class="${lineClass}"><span class="${lineNumberClass}">${lineNumber + 1}</span><span class="${textClass}">${formattedLine}</span></div>`;
//   };

//   // Render the diff between original and edited content
//   const render = async () => {
//     if (!containerRef.current) return;

//     // Use empty string if content is null
//     const safeOriginal = originalContent || '';
//     const safeEdited = editedContent || '';

//     const diff = diffLines(safeOriginal, safeEdited);
//     let currentLineIndex = 0;
//     let html = '';

//     diff.forEach(part => {
//       const lines = part.value.split('\n').filter(line => line.length > 0);

//       lines.forEach(line => {
//         const isHighlighted = currentLineIndex <= currentLineNumber;
//         const isRemoved = part.removed && isHighlighted;
//         const isAdded = part.added && isHighlighted;

//         html += processLine(line, currentLineIndex, isRemoved, isAdded);
//         if (!part.removed) {
//           currentLineIndex++;
//         }
//       });
//     });

//     console.log('[SectionStreamingDiff] Generated HTML:', html.substring(0, 200) + '...');

//     try {
//       // Set the HTML directly
//       if (containerRef.current) {
//         containerRef.current.innerHTML = html;

//         // Debug DOM structure
//         setTimeout(() => {
//           if (!containerRef.current) return;

//           console.log('[SectionStreamingDiff] DOM after processing - checking for diff elements');
//           const redElements = containerRef.current.querySelectorAll('.diff-line-removed');
//           const greenElements = containerRef.current.querySelectorAll('.diff-line-added');

//           console.log(`[SectionStreamingDiff] After processing: Red: ${redElements.length}, Green: ${greenElements.length}`);
//         }, 0);
//       }
//     } catch (error) {
//       console.error('[SectionStreamingDiff] Error updating HTML:', error);
//     }
//   };

//   // Run animations when streaming completes
//   const fadeOutDiffs = async () => {
//     console.log('[SectionStreamingDiff] fadeOutDiffs: START');
//     if (!containerRef.current) return;

//     // Debug DOM structure
//     const debugDOM = () => {
//       if (!containerRef.current) return;

//       const allElements = containerRef.current.querySelectorAll('*');
//       console.log(`[SectionStreamingDiff] Total DOM elements: ${allElements.length}`);

//       // Check for different potential class patterns
//       const redClassElements = containerRef.current.querySelectorAll('.text-red-500');
//       const greenClassElements = containerRef.current.querySelectorAll('.text-green-500');
//       const redBgElements = containerRef.current.querySelectorAll('.bg-red-100');
//       const greenBgElements = containerRef.current.querySelectorAll('.bg-green-100');
//       const diffSpans = containerRef.current.querySelectorAll('.diff-span');
//       const diffLinesRemoved = containerRef.current.querySelectorAll('.diff-line-removed');
//       const diffLinesAdded = containerRef.current.querySelectorAll('.diff-line-added');

//       console.log(`[SectionStreamingDiff] Elements by class:
//         .text-red-500: ${redClassElements.length}
//         .text-green-500: ${greenClassElements.length}
//         .bg-red-100: ${redBgElements.length}
//         .bg-green-100: ${greenBgElements.length}
//         .diff-span: ${diffSpans.length}
//         .diff-line-removed: ${diffLinesRemoved.length}
//         .diff-line-added: ${diffLinesAdded.length}`);

//       // Check HTML
//       console.log('[SectionStreamingDiff] Container HTML snippet:',
//         containerRef.current.innerHTML.substring(0, 200) + '...');
//     };

//     // Debug to understand what's in the DOM
//     debugDOM();

//     try {
//       // Get all red spans (removed content) and lines
//       const redSpans = Array.from(containerRef.current.querySelectorAll('.diff-span.text-red-500'))
//         .filter(el => el instanceof HTMLElement) as HTMLElement[];

//       const redLines = Array.from(containerRef.current.querySelectorAll('.diff-line-removed, .line.bg-red-100'))
//         .filter(el => el instanceof HTMLElement) as HTMLElement[];

//       // Get all green spans (added content) and lines
//       const greenSpans = Array.from(containerRef.current.querySelectorAll('.diff-span.text-green-500'))
//         .filter(el => el instanceof HTMLElement) as HTMLElement[];

//       const greenLines = Array.from(containerRef.current.querySelectorAll('.diff-line-added, .line.bg-green-100'))
//         .filter(el => el instanceof HTMLElement) as HTMLElement[];

//       console.log(`[SectionStreamingDiff] Found elements to animate:
//         Red spans: ${redSpans.length}
//         Red lines: ${redLines.length}
//         Green spans: ${greenSpans.length}
//         Green lines: ${greenLines.length}`);

//       // STEP 1: Fade out red text (removed content)
//       console.log('[SectionStreamingDiff] Step 1: Fading out red text');

//       // Apply to spans 
//       redSpans.forEach(span => {
//         span.classList.add('color-transition');
//         span.style.opacity = '0';
//       });

//       // Also apply to parent lines for background
//       redLines.forEach(line => {
//         line.classList.add('color-transition');
//         line.style.backgroundColor = 'transparent';
//       });

//       // Wait for fade to complete
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // STEP 2: Shrink red elements (collapse removed content)
//       console.log('[SectionStreamingDiff] Step 2: Shrinking red elements');

//       redLines.forEach(line => {
//         // Store original height
//         const height = line.offsetHeight;
//         line.style.height = `${height}px`;
//         // Force reflow
//         void line.offsetHeight;

//         // Switch transition and apply height changes
//         line.classList.remove('color-transition');
//         line.classList.add('height-transition');
//         line.style.height = '0';
//         line.style.margin = '0';
//         line.style.padding = '0';
//         line.style.overflow = 'hidden';
//       });

//       // Wait for shrink to complete
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // STEP 3: Remove red elements from DOM
//       console.log('[SectionStreamingDiff] Step 3: Removing red elements');
//       redLines.forEach(line => {
//         try {
//           line.remove();
//         } catch (e) {
//           console.error('[SectionStreamingDiff] Error removing element:', e);
//         }
//       });

//       // STEP 4: Normalize green elements
//       console.log('[SectionStreamingDiff] Step 4: Normalizing green elements');
      
//       // Apply to spans for text color
//       greenSpans.forEach(span => {
//         span.classList.add('color-transition');
//         span.style.color = '#111827'; // Normal text color
//       });

//       // Apply to parent lines for background
//       greenLines.forEach(line => {
//         line.classList.add('bg-transition');
//         line.style.backgroundColor = 'transparent';
//       });

//       // Wait for final fade to complete
//       await new Promise(resolve => setTimeout(resolve, 1000));

//       // All animations complete
//       console.log('[SectionStreamingDiff] fadeOutDiffs: COMPLETE');
//       setAnimationsRun(true);

//       // Call onComplete callback if provided
//       if (onComplete) {
//         console.log('[SectionStreamingDiff] Calling onComplete callback');
//         onComplete();
//       } else {
//         console.log('[SectionStreamingDiff] No onComplete callback provided');
//       }
//     } catch (error) {
//       console.error('[SectionStreamingDiff] Error in animation:', error);
//     }
//   };

//   // Render when content changes or currentLineNumber updates
//   useEffect(() => {
//     console.log(`[SectionStreamingDiff] Rendering - isStreaming: ${isStreaming}, currentLineNumber: ${currentLineNumber}`);
//     render();
//   }, [originalContent, editedContent, isStreaming, currentLineNumber]);

//   // Run animations when streaming completes
//   useEffect(() => {
//     const wasStreaming = wasStreamingRef.current;
//     wasStreamingRef.current = isStreaming;
    
//     // Only run animations when streaming changes from true to false and we haven't run them yet
//     if (wasStreaming && !isStreaming && !animationsRun && editedContent) {
//       console.log('[SectionStreamingDiff] Streaming just completed, running animations');
//       fadeOutDiffs();
//     }
//   }, [isStreaming, editedContent, animationsRun]);

//   return (
//     <div className="streaming-diff-container">
//       <div ref={containerRef} className="streaming-diff-content" />
//     </div>
//   );
// };
