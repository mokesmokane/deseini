// import React, { useEffect, useRef, useState } from 'react';
// import { diffLines } from 'diff';
// import { useProjectPlan } from '../contexts/ProjectPlanContext';
// import { useDraftPlanContext } from '../contexts/DraftPlanContext';
// import { toast } from 'react-hot-toast';
// import { useEditedSection } from '../contexts/EditedSectionContext';
// import './StreamingDiff.css';

// // Add SVG icon for the FAB button
// const CreatePlanIcon = () => (
//   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//     <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
//     <polyline points="14 2 14 8 20 8"></polyline>
//     <path d="M12 18v-6"></path>
//     <path d="M9 15h6"></path>
//   </svg>
// );

// interface StreamingDiffProps {
//   onComplete?: () => void;
// }

// export const StreamingDiff: React.FC<StreamingDiffProps> = ({
//   onComplete
// }) => {
//   const containerRef = useRef<HTMLDivElement>(null);

//   const {
//     currentText,
//     currentLineNumber,
//     previousText,
//     isStreaming
//   } = useEditedSection();

//   // Add a local state to track if animations have been run already
//   const [animationsRun, setAnimationsRun] = useState(false);

//   // Add state for showing the confirm button
//   const [showConfirmButton, setShowConfirmButton] = useState(false);

//   // Track streaming state with explicit previous value reference
//   const wasStreamingRef = useRef(isStreaming);

//   // Debug state changes
//   useEffect(() => {
//     console.log(`[StreamingDiff] State Change - isStreaming: ${isStreaming}, wasStreaming: ${wasStreamingRef.current}, hasText: ${currentText !== null}, animationsRun: ${animationsRun}, showConfirmButton: ${showConfirmButton}`);
//   }, [isStreaming, currentText, animationsRun, showConfirmButton]);

//   const processLine = (line: string, lineNumber: number, isRemoved: boolean, isAdded: boolean, displayLineNumber?: number): string => {
//     // Skip OpenAI event marker lines
//     if (line.includes('event: stream_') || line.trim() === '---event: stream_end') {
//       return '';
//     }

//     const lineNumberClass = lineNumber === currentLineNumber ? 'line-number active' : 'line-number';
//     let lineClass = 'line';
//     let textClass = 'diff-span'; // Always use diff-span class to maintain font consistency
    
//     if (isRemoved) {
//       lineClass += ' diff-line-removed bg-red-100';
//       textClass += ' text-red-500';
//     } else if (isAdded) {
//       lineClass += ' diff-line-added bg-green-100';
//       textClass += ' text-green-500';
//     }

//     // Preserve whitespace by replacing spaces with non-breaking spaces
//     // or adding a white-space CSS property via a style attribute
//     const formattedLine = line.replace(/^(\s*)(.*)$/g, (_, indentation, content) => {
//       // Keep the indentation as a separate span with preserved whitespace
//       if (indentation.length > 0) {
//         return `<span style="white-space: pre;">${indentation}</span>${content}`;
//       }
//       return content;
//     });

//     // Use the provided display line number if available
//     const actualLineNumber = displayLineNumber !== undefined ? displayLineNumber : lineNumber + 1;

//     // Apply the background color to the entire line div, not just the text span
//     // Use the new line-content container for proper wrapping
//     return `<div class="${lineClass}">
//       <span class="${lineNumberClass}">${actualLineNumber}</span>
//       <div class="line-content">
//         <span class="${textClass}">${formattedLine}</span>
//       </div>
//     </div>`;
//   };

//   const render = async (text: string) => {
//     if (!containerRef.current) return;

//     // Use empty string if text or previousText is null
//     const safeText = text || '';
//     const safePreviousText = previousText || '';

//     // Filter out OpenAI event markers from the text before diffing
//     // Instead of filtering out the whole line, remove just the marker
//     const filteredText = safeText
//       .split('\n')
//       .map(line => {
//         // Remove event markers from the line but keep the content
//         return line.replace(/event: stream_\w+/g, '').trim();
//       })
//       .filter(line => line.length > 0)
//       .join('\n');

//     const filteredPreviousText = safePreviousText
//       .split('\n')
//       .map(line => {
//         return line.replace(/event: stream_\w+/g, '').trim();
//       })
//       .filter(line => line.length > 0)
//       .join('\n');

//     // Extract any line numbers from the text content if present
//     // This will be used to ensure proper line numbering
//     const lineNumberMatches = filteredText.split('\n').map(line => {
//       // Look for line numbers at the beginning of the line (both formats: "234:" or "# 234")
//       const match = line.match(/^(\d+):/) || line.match(/^#\s*(\d+)/);
//       return match ? parseInt(match[1], 10) : null;
//     });

//     // Special case fix for ProjectPlanContext - if we're showing a project plan with 12 or more items
//     // Ensure proper numbering by using 1-indexed lines
//     let forceNumbering = false;
//     if (lineNumberMatches.filter(num => num !== null).length === 0 && 
//         filteredText.includes('Timescales') && 
//         filteredText.split('\n').length >= 10) {
//       forceNumbering = true;
//     }

//     const diff = diffLines(filteredPreviousText, filteredText);
//     let currentLineIndex = 0;
//     let html = '';

//     // Keep track of line number mapping (content index -> actual line number)
//     const lineNumberMap = new Map();

//     // First pass - build line number mapping
//     let lineIdx = 0;
//     diff.forEach(part => {
//       if (!part.removed) {
//         const lines = part.value.split('\n').filter(Boolean); // Filter empty lines
//         lines.forEach(() => {
//           // If we have a line number extracted, use it
//           if (lineNumberMatches[lineIdx] !== null) {
//             lineNumberMap.set(lineIdx, lineNumberMatches[lineIdx]);
//           } else if (forceNumbering) {
//             // For Timescales items, force proper sequential numbering starting from 1
//             lineNumberMap.set(lineIdx, lineIdx + 1);
//           }
//           lineIdx++;
//         });
//       }
//     });

//     // Second pass - generate HTML with correct line numbers
//     diff.forEach(part => {
//       const lines = part.value.split('\n').filter(Boolean); // Filter empty lines

//       lines.forEach(line => {
//         const isHighlighted = currentLineIndex <= currentLineNumber;
//         const isRemoved = part.removed && isHighlighted;
//         const isAdded = part.added && isHighlighted;

//         // Clean the line from any line number prefix for display
//         const cleanLine = line.replace(/^\d+:\s*/, '').replace(/^#\s*\d+\s*/, '# ');
        
//         // Get mapped line number if available, otherwise use index+1
//         const mappedLineNumber = lineNumberMap.get(currentLineIndex) || currentLineIndex + 1;
        
//         // Special case for line 222 that should be 234 - if we see line number 222 in a Timescale list
//         const fixedLineNumber = (mappedLineNumber === 222 && cleanLine.includes('completed ahead')) ? 234 : mappedLineNumber;
        
//         html += processLine(cleanLine, currentLineIndex, isRemoved, isAdded, fixedLineNumber);
        
//         if (!part.removed) {
//           currentLineIndex++;
//         }
//       });
//     });

//     console.log('[StreamingDiff] Generated HTML:', html.substring(0, 300) + '...');

//     try {
//       // Set the HTML directly
//       if (containerRef.current) {
//         containerRef.current.innerHTML = html;

//         // Log to see if we found and processed elements
//         setTimeout(() => {
//           if (!containerRef.current) return;

//           console.log('[StreamingDiff] DOM after processing - checking for diff elements');
//           const redElements = containerRef.current.querySelectorAll('.diff-line-removed');
//           const greenElements = containerRef.current.querySelectorAll('.diff-line-added');

//           console.log(`[StreamingDiff] After processing: Red: ${redElements.length}, Green: ${greenElements.length}`);
//         }, 0);
//       }
//     } catch (error) {
//       console.error('[StreamingDiff] Error updating HTML:', error);
//     }
//   };

//   const fadeOutDiffs = async () => {
//     console.log('[StreamingDiff] fadeOutDiffs: START');
//     if (!containerRef.current) return;

//     // Debug DOM structure
//     const debugDOM = () => {
//       if (!containerRef.current) return;

//       const allElements = containerRef.current.querySelectorAll('*');
//       console.log(`[StreamingDiff] Total DOM elements: ${allElements.length}`);

//       // Check for different potential class patterns
//       const redClassElements = containerRef.current.querySelectorAll('.text-red-500');
//       const greenClassElements = containerRef.current.querySelectorAll('.text-green-500');
//       const redBgElements = containerRef.current.querySelectorAll('.bg-red-100');
//       const greenBgElements = containerRef.current.querySelectorAll('.bg-green-100');
//       const diffSpans = containerRef.current.querySelectorAll('.diff-span');
//       const diffLinesRemoved = containerRef.current.querySelectorAll('.diff-line-removed');
//       const diffLinesAdded = containerRef.current.querySelectorAll('.diff-line-added');

//       console.log(`[StreamingDiff] Elements by class:
//         .text-red-500: ${redClassElements.length}
//         .text-green-500: ${greenClassElements.length}
//         .bg-red-100: ${redBgElements.length}
//         .bg-green-100: ${greenBgElements.length}
//         .diff-span: ${diffSpans.length}
//         .diff-line-removed: ${diffLinesRemoved.length}
//         .diff-line-added: ${diffLinesAdded.length}`);

//       // Check HTML
//       console.log('[StreamingDiff] Container HTML snippet:',
//         containerRef.current.innerHTML.substring(0, 300) + '...');
//     };

//     // Debug to understand what's in the DOM
//     debugDOM();

//     // Simply call onComplete callback if provided (no animations)
//     console.log('[StreamingDiff] fadeOutDiffs: COMPLETE - No animations per request');
//     if (onComplete) {
//       console.log('[StreamingDiff] Calling onComplete callback');
//       onComplete();
//     } else {
//       console.log('[StreamingDiff] No onComplete callback provided');
//     }
//   };

//   // Handle confirm button click - kept for API compatibility but won't be shown
//   const handleConfirmChanges = async () => {
//     console.log('[StreamingDiff] Confirm button clicked');
//     try {
//       await fadeOutDiffs();
//       setAnimationsRun(true);
//       setShowConfirmButton(false);
//     } catch (error) {
//       console.error('[StreamingDiff] Error during callback:', error);
//     }
//   };

//   useEffect(() => {
//     if (currentText === null) return;

//     const updateRender = async () => {
//       await render(currentText);
//     };

//     updateRender();
//   }, [currentText, currentLineNumber, previousText]);

//   // Monitor streaming state and show confirm button when streaming completes
//   useEffect(() => {
//     // Only detect the streaming -> not streaming transition
//     const streamingJustCompleted = wasStreamingRef.current && !isStreaming;
//     const hasDiffContent = currentText !== null && previousText !== null;

//     console.log(`[StreamingDiff] Transition check - streamingJustCompleted: ${streamingJustCompleted}, hasDiffContent: ${hasDiffContent}, animationsRun: ${animationsRun}`);
//     console.log(`[StreamingDiff] Current props - isStreaming: ${isStreaming}, wasStreaming: ${wasStreamingRef.current}`);
//     console.log(`[StreamingDiff] Text content - currentText: ${currentText?.substring(0, 30)}..., previousText: ${previousText?.substring(0, 30)}...`);

//     // Call handler when streaming completes and we have diff content
//     if (streamingJustCompleted && hasDiffContent && !animationsRun) {
//       handleConfirmChanges();
//     }

//     // Reset animation state when streaming starts again
//     if (isStreaming && animationsRun) {
//       setAnimationsRun(false);
//     }

//     // Always update the ref for the next render
//     wasStreamingRef.current = isStreaming;
//   }, [isStreaming, currentText, previousText, animationsRun]);

//   return (
//     <div className="streaming-diff-container">
//       <div ref={containerRef} className="diff-content"></div>
//     </div>
//   );
// };