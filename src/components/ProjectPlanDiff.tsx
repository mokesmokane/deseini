import React, { useEffect, useState } from 'react';
import { useProjectPlan, DiffType } from '../contexts/ProjectPlanContext';

/**
 * Component to visualize the diff between the previous project plan and the new one
 * being streamed in. Shows progress and highlights additions/removals.
 */
const ProjectPlanDiff: React.FC = () => {
  const { 
    diffSegments, 
    diffProgress, 
    isGeneratingProjectPlan,
    currentStep,
    markDiffSegmentProcessed 
  } = useProjectPlan();
  
  // Track which segments have been visually processed
  const [visibleSegments, setVisibleSegments] = useState<number[]>([]);
  const [animationInProgress, setAnimationInProgress] = useState(false);

  // When new segments arrive, animate them into view one by one
  useEffect(() => {
    if (!isGeneratingProjectPlan || diffSegments.length === 0 || animationInProgress) {
      return;
    }

    const unprocessedSegments = diffSegments
      .map((_, index) => index)
      .filter(index => !visibleSegments.includes(index));

    if (unprocessedSegments.length === 0) {
      return;
    }

    setAnimationInProgress(true);
    
    // Process one segment at a time with a delay
    const nextSegmentIndex = unprocessedSegments[0];
    const timer = setTimeout(() => {
      setVisibleSegments(prev => [...prev, nextSegmentIndex]);
      markDiffSegmentProcessed(nextSegmentIndex);
      setAnimationInProgress(false);
    }, 300); // Adjust timing as needed

    return () => clearTimeout(timer);
  }, [diffSegments, visibleSegments, isGeneratingProjectPlan, animationInProgress, markDiffSegmentProcessed]);

  // Generate color classes based on diff type
  const getSegmentClass = (type: DiffType): string => {
    switch (type) {
      case 'added':
        return 'bg-green-100 border-l-4 border-green-500';
      case 'removed':
        return 'bg-red-100 border-l-4 border-red-500';
      case 'unchanged':
      default:
        return 'bg-gray-50';
    }
  };

  // Format text for display with proper line breaks
  const formatSegmentText = (text: string): JSX.Element => {
    return (
      <>
        {text.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < text.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </>
    );
  };

  // Don't show the component if not generating or no diffs
  if (currentStep !== 'generating' || diffSegments.length === 0) {
    return null;
  }

  return (
    <div className="project-plan-diff">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Updating Project Plan</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 mt-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
            style={{ width: `${diffProgress}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-600">
          {diffProgress < 100 
            ? `Processing changes: ${Math.round(diffProgress)}%` 
            : 'Processing complete'}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-2">
        {diffSegments.map((segment, index) => (
          visibleSegments.includes(index) && (
            <div
              key={index}
              className={`p-3 rounded transition-opacity duration-500 ${getSegmentClass(segment.type)}`}
            >
              <pre className="whitespace-pre-wrap text-sm font-mono">
                {segment.type === 'added' && '+ '}
                {segment.type === 'removed' && '- '}
                {formatSegmentText(segment.text)}
              </pre>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default ProjectPlanDiff;
