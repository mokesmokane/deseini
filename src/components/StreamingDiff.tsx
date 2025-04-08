import React, { useEffect, useRef, useState } from 'react';
import { diffLines } from 'diff';
import { useProjectPlan } from '../contexts/ProjectPlanContext';
import { useDraftPlanContext } from '../contexts/DraftPlanContext';
import { toast } from 'react-hot-toast';

// Add SVG icon for the FAB button
const CreatePlanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <path d="M12 18v-6"></path>
    <path d="M9 15h6"></path>
  </svg>
);

interface StreamingDiffProps {
  onComplete?: () => void;
}

export const StreamingDiff: React.FC<StreamingDiffProps> = ({
  onComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const {
    currentText,
    currentLineNumber,
    previousText,
    isStreaming,
    confirmChanges
  } = useProjectPlan();

  // Add draft plan context
  const { createPlanFromMarkdown, isLoading } = useDraftPlanContext();

  // Add a local state to track if animations have been run already
  const [animationsRun, setAnimationsRun] = useState(false);

  // Add state for showing the confirm button
  const [showConfirmButton, setShowConfirmButton] = useState(false);

  // Track streaming state with explicit previous value reference
  const wasStreamingRef = useRef(isStreaming);
  const needsConfirming = useRef(currentText !== previousText);

  // Debug state changes
  useEffect(() => {
    console.log(`[StreamingDiff] State Change - isStreaming: ${isStreaming}, wasStreaming: ${wasStreamingRef.current}, hasText: ${currentText !== null}, animationsRun: ${animationsRun}, showConfirmButton: ${showConfirmButton}`);
  }, [isStreaming, currentText, animationsRun, showConfirmButton]);

  const processLine = (line: string, lineNumber: number, isRemoved: boolean, isAdded: boolean): string => {
    // Skip OpenAI event marker lines
    if (line.includes('event: stream_') || line.trim() === '---event: stream_end') {
      return '';
    }

    const lineNumberClass = lineNumber === currentLineNumber ? 'line-number active' : 'line-number';
    let lineClass = 'line';
    let textClass = '';

    if (isRemoved) {
      lineClass += ' diff-line-removed bg-red-100';
      textClass = 'diff-span text-red-500';
    } else if (isAdded) {
      lineClass += ' diff-line-added bg-green-100';
      textClass = 'diff-span text-green-500';
    }

    // Apply the background color to the entire line div, not just the text span
    return `<div class="${lineClass}"><span class="${lineNumberClass}">${lineNumber + 1}</span><span class="${textClass}">${line}</span></div>`;
  };

  const render = async (text: string) => {
    if (!containerRef.current) return;

    // Use empty string if text or previousText is null
    const safeText = text || '';
    const safePreviousText = previousText || '';

    // Filter out OpenAI event markers from the text before diffing
    const filteredText = safeText
      .split('\n')
      .filter(line => !line.includes('event: stream_') && line.trim() !== '---event: stream_end')
      .join('\n');

    const filteredPreviousText = safePreviousText
      .split('\n')
      .filter(line => !line.includes('event: stream_') && line.trim() !== '---event: stream_end')
      .join('\n');

    const diff = diffLines(filteredPreviousText, filteredText);
    let currentLineIndex = 0;
    let html = '';

    diff.forEach(part => {
      const lines = part.value.split('\n').filter(line => line.length > 0);

      lines.forEach(line => {
        const isHighlighted = currentLineIndex <= currentLineNumber;
        const isRemoved = part.removed && isHighlighted;
        const isAdded = part.added && isHighlighted;

        html += processLine(line, currentLineIndex, isRemoved, isAdded);
        if (!part.removed) {
          currentLineIndex++;
        }
      });
    });

    console.log('[StreamingDiff] Generated HTML:', html.substring(0, 300) + '...');

    try {
      // Set the HTML directly
      if (containerRef.current) {
        containerRef.current.innerHTML = html;

        // Log to see if we found and processed elements
        setTimeout(() => {
          if (!containerRef.current) return;

          console.log('[StreamingDiff] DOM after processing - checking for diff elements');
          const redElements = containerRef.current.querySelectorAll('.diff-line-removed');
          const greenElements = containerRef.current.querySelectorAll('.diff-line-added');

          console.log(`[StreamingDiff] After processing: Red: ${redElements.length}, Green: ${greenElements.length}`);
        }, 0);
      }
    } catch (error) {
      console.error('[StreamingDiff] Error updating HTML:', error);
    }
  };

  const fadeOutDiffs = async () => {
    console.log('[StreamingDiff] fadeOutDiffs: START');
    if (!containerRef.current) return;

    // Debug DOM structure
    const debugDOM = () => {
      if (!containerRef.current) return;

      const allElements = containerRef.current.querySelectorAll('*');
      console.log(`[StreamingDiff] Total DOM elements: ${allElements.length}`);

      // Check for different potential class patterns
      const redClassElements = containerRef.current.querySelectorAll('.text-red-500');
      const greenClassElements = containerRef.current.querySelectorAll('.text-green-500');
      const redBgElements = containerRef.current.querySelectorAll('.bg-red-100');
      const greenBgElements = containerRef.current.querySelectorAll('.bg-green-100');
      const diffSpans = containerRef.current.querySelectorAll('.diff-span');
      const diffLinesRemoved = containerRef.current.querySelectorAll('.diff-line-removed');
      const diffLinesAdded = containerRef.current.querySelectorAll('.diff-line-added');

      console.log(`[StreamingDiff] Elements by class:
        .text-red-500: ${redClassElements.length}
        .text-green-500: ${greenClassElements.length}
        .bg-red-100: ${redBgElements.length}
        .bg-green-100: ${greenBgElements.length}
        .diff-span: ${diffSpans.length}
        .diff-line-removed: ${diffLinesRemoved.length}
        .diff-line-added: ${diffLinesAdded.length}`);

      // Check HTML
      console.log('[StreamingDiff] Container HTML snippet:',
        containerRef.current.innerHTML.substring(0, 300) + '...');
    };

    // Debug to understand what's in the DOM
    debugDOM();

    // Following the test project implementation
    try {
      // Get all red spans (removed content) and lines
      const redSpans = Array.from(containerRef.current.querySelectorAll('.diff-span.text-red-500'))
        .filter(el => el instanceof HTMLElement) as HTMLElement[];

      const redLines = Array.from(containerRef.current.querySelectorAll('.diff-line-removed, .line.bg-red-100'))
        .filter(el => el instanceof HTMLElement) as HTMLElement[];

      // Get all green spans (added content) and lines
      const greenSpans = Array.from(containerRef.current.querySelectorAll('.diff-span.text-green-500'))
        .filter(el => el instanceof HTMLElement) as HTMLElement[];

      const greenLines = Array.from(containerRef.current.querySelectorAll('.diff-line-added, .line.bg-green-100'))
        .filter(el => el instanceof HTMLElement) as HTMLElement[];

      console.log(`[StreamingDiff] Found elements to animate:
        Red spans: ${redSpans.length}
        Red lines: ${redLines.length}
        Green spans: ${greenSpans.length}
        Green lines: ${greenLines.length}`);

      // STEP 1: Fade out red text (removed content)
      console.log('[StreamingDiff] Step 1: Fading out red text');

      // Apply to spans 
      redSpans.forEach(span => {
        span.classList.add('color-transition');
        span.style.opacity = '0';
      });

      // Also apply to parent lines for background
      redLines.forEach(line => {
        line.classList.add('color-transition');
        line.style.backgroundColor = 'transparent';
      });

      // Wait for fade to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 2: Shrink red elements (collapse removed content)
      console.log('[StreamingDiff] Step 2: Shrinking red elements');

      redLines.forEach(line => {
        // Store original height
        const height = line.offsetHeight;
        line.style.height = `${height}px`;
        // Force reflow
        void line.offsetHeight;

        // Switch transition and apply height changes
        line.classList.remove('color-transition');
        line.classList.add('height-transition');
        line.style.height = '0';
        line.style.margin = '0';
        line.style.padding = '0';
        line.style.overflow = 'hidden';
      });

      // Wait for shrink to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // STEP 3: Remove red elements from DOM
      console.log('[StreamingDiff] Step 3: Removing red elements');
      redLines.forEach(line => {
        try {
          line.remove();
        } catch (e) {
          console.error('[StreamingDiff] Error removing element:', e);
        }
      });

      // STEP 4: Fade green elements to normal
      console.log('[StreamingDiff] Step 4: Normalizing green elements');

      // Apply to spans for text color
      greenSpans.forEach(span => {
        span.classList.add('color-transition');
        span.style.color = '#111827'; // Normal text color
      });

      // Apply to parent lines for background
      greenLines.forEach(line => {
        line.classList.add('color-transition');
        line.style.backgroundColor = 'transparent';
      });

      // Wait for final fade to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // All animations complete
      console.log('[StreamingDiff] fadeOutDiffs: COMPLETE');

      // Call onComplete callback if provided
      if (onComplete) {
        console.log('[StreamingDiff] Calling onComplete callback');
        onComplete();
      } else {
        console.log('[StreamingDiff] No onComplete callback provided');
      }
    } catch (error) {
      console.error('[StreamingDiff] Animation error:', error);
    }
  };

  // Handle confirm button click
  const handleConfirmChanges = async () => {
    console.log('[StreamingDiff] Confirm button clicked');
    try {
      await fadeOutDiffs();
      setAnimationsRun(true);
      setShowConfirmButton(false);
    } catch (error) {
      console.error('[StreamingDiff] Error during animations:', error);
    }
  };

  // Handle creating draft plan from project plan markdown
  const handleCreatePlan = async () => {
    if (!currentText) {
      toast.error('No project plan available to convert');
      return;
    }

    try {
      toast.promise(
        createPlanFromMarkdown(currentText),
        {
          loading: 'Creating draft plan...',
          success: 'Draft plan created successfully!',
          error: (err) => `Failed to create draft plan: ${err.message}`
        }
      );
    } catch (error) {
      console.error('Error creating draft plan:', error);
    }
  };

  useEffect(() => {
    if (currentText === null) return;

    const updateRender = async () => {
      await render(currentText);
    };

    updateRender();
  }, [currentText, currentLineNumber, previousText]);

  // Monitor streaming state and show confirm button when streaming completes
  useEffect(() => {
    // Only detect the streaming -> not streaming transition
    const streamingJustCompleted = wasStreamingRef.current && !isStreaming;
    const hasDiffContent = currentText !== null && previousText !== null;

    console.log(`[StreamingDiff] Transition check - streamingJustCompleted: ${streamingJustCompleted}, hasDiffContent: ${hasDiffContent}, animationsRun: ${animationsRun}`);
    console.log(`[StreamingDiff] Current props - isStreaming: ${isStreaming}, wasStreaming: ${wasStreamingRef.current}`);
    console.log(`[StreamingDiff] Text content - currentText: ${currentText?.substring(0, 30)}..., previousText: ${previousText?.substring(0, 30)}...`);

    // Show confirm button when streaming completes and we have diff content
    console.log('[StreamingDiffMOKES]', wasStreamingRef.current, isStreaming, streamingJustCompleted, hasDiffContent, animationsRun, showConfirmButton);
    if (streamingJustCompleted && hasDiffContent && !animationsRun) {
      handleConfirmChanges();
      // setShowConfirmButton(true);
    }

    // Reset animation state when streaming starts again
    if (isStreaming && (animationsRun || showConfirmButton)) {
      setAnimationsRun(false);
      // setShowConfirmButton(false);
    }

    // // Force button to show for testing (TEMPORARY)
    // if (!isStreaming && hasDiffContent && !animationsRun && !showConfirmButton) {
    //   console.log('[StreamingDiff] FORCING button to show for testing');
    //   setShowConfirmButton(true);
    // }

    // Always update the ref for the next render
    wasStreamingRef.current = isStreaming;
  }, [isStreaming, currentText, previousText, animationsRun, showConfirmButton]);

  return (
    <div className="container relative">
      <div ref={containerRef} className="diff-container" style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }} />

      {/* Confirmation button - made more visible */}
      {showConfirmButton && (
        <div className="mt-4 text-center" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f8f9fa' }}>
          <p style={{ marginBottom: '10px', fontWeight: 'bold' }}>Ready to apply changes?</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={handleConfirmChanges}
            style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Confirm Changes
          </button>
        </div>
      )}

      {/* Create Plan button - positioned inside the component flow instead of fixed */}
      {!isStreaming && currentText && (
        <div className="mt-6 mb-4 flex justify-center">
          <button
            onClick={handleCreatePlan}
            disabled={isLoading}
            className="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md flex items-center justify-center gap-2 transition-all transform hover:scale-105"
            title="Create Draft Plan from Project Notes"
            aria-label="Create Draft Plan"
            style={{
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'wait' : 'pointer'
            }}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Creating Plan...</span>
              </>
            ) : (
              <>
                <CreatePlanIcon />
                <span>Create Draft Plan</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};