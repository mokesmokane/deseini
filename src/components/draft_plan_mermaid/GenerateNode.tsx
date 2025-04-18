import { memo, useState, useEffect, useRef } from 'react';
import { useDraftPlanMermaidContext } from '../../contexts/DraftPlanContextMermaid';
import { useProjectPlan } from '../../contexts/ProjectPlanContext';
import ActionPreview from '../mermaid/ActionPreview';

interface GenerateNodeData {
  label: string;
  isVisible: boolean;
}

const GenerateNode = ({ data }: { data: GenerateNodeData }) => {
  const { 
    createPlanFromMarkdown: createMermaidPlan, 
    isLoading: isMermaidLoading,
    streamSummary,
    fullSyntax,
    startProcessingBuffer,
    processAllBuffer,
    actionBufferLength,
    processingBufferProgress,
    nextAction,
    actionBuffer,
    TIMELINE_PIXELS_PER_DAY,
    setTIMELINE_PIXELS_PER_DAY
  } = useDraftPlanMermaidContext();
  const { 
    currentText,
    isStreaming
  } = useProjectPlan();
  const [expanded, setExpanded] = useState(false);
  const [detailedSummary, setDetailedSummary] = useState('');
  const prevSummaryRef = useRef('');
  const detailedSummaryRef = useRef<HTMLDivElement>(null);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // Reset detailed summary when a new summary is received
  useEffect(() => {
    if (streamSummary && streamSummary !== prevSummaryRef.current) {
      // New summary detected, reset detailed summary
      setDetailedSummary('');
      prevSummaryRef.current = streamSummary;
    }
  }, [streamSummary]);

  // Update detailed summary with new content when fullSyntax changes
  useEffect(() => {
    if (fullSyntax && streamSummary === prevSummaryRef.current) {
      // Extract the relevant text after the current summary
      const lines = fullSyntax.split('\n');
      const summaryIndex = lines.findIndex((line: string) => line.includes(streamSummary));
      
      if (summaryIndex >= 0) {
        const detailedContent = lines.slice(summaryIndex + 1).join('\n');
        setDetailedSummary(detailedContent);
      }
    }
  }, [fullSyntax, streamSummary]);
  
  // Scroll to the bottom whenever detailed summary changes
  useEffect(() => {
    if (detailedSummaryRef.current && expanded) {
      const element = detailedSummaryRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [detailedSummary, expanded]);

  // Auto-apply buffered actions when debug mode is off
  useEffect(() => {
    if (!debugMode && actionBufferLength > 0) {
      processAllBuffer();
    }
  }, [debugMode, actionBufferLength, processAllBuffer]);

  const handleGenerateClick = async () => {
    try {
      // Reset states before starting a new generation
      setDetailedSummary('');
      prevSummaryRef.current = '';
      
      if(currentText && !isStreaming) {
        await createMermaidPlan(currentText);
      }
    } catch (error) {
      console.error('Error generating chart:', error);
    }
  };

  // Shimmer animation for loading state
  const shimmerStyle = isMermaidLoading ? {
    backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0) 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite',
    animationTimingFunction: 'linear',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundColor: '#000000',
    color: '#ffffff',
  } : {};

  const toggleExpanded = () => {
    setExpanded(!expanded);
    
    // When expanding, make sure we're scrolled to the bottom
    if (!expanded && detailedSummaryRef.current) {
      setTimeout(() => {
        if (detailedSummaryRef.current) {
          detailedSummaryRef.current.scrollTop = detailedSummaryRef.current.scrollHeight;
        }
      }, 10);
    }
  };

  // Show the view process section if we have stream data
  const hasStreamData = streamSummary && fullSyntax;

  // Initial state - no streaming has occurred yet
  if (!hasStreamData && !isMermaidLoading) {
    return (
      <div 
        style={{
          opacity: data.isVisible ? 1 : 0,
          transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
          padding: '15px',
          backgroundColor: '#ffffff',
          border: '2px solid #000000',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
          width: '440px',
          textAlign: 'center'
        }}
      >
        {/* Debug Mode Toggle */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: '#000000', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type="checkbox"
              checked={debugMode}
              onChange={e => setDebugMode((e.target as HTMLInputElement).checked)}
            />
            Debug Mode
          </label>
        </div>
        {/* Day width slider */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ fontSize: '12px', color: '#000000' }}>Day Width: {TIMELINE_PIXELS_PER_DAY}px</label>
          <input
            type="range"
            min={30}
            max={150}
            step={30}
            value={TIMELINE_PIXELS_PER_DAY}
            onChange={e => setTIMELINE_PIXELS_PER_DAY(Number((e.target as HTMLInputElement).value))}
          />
        </div>
        <button
          onClick={handleGenerateClick}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #000000',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'normal',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Generate Chart
        </button>
      </div>
    );
  }

  return (
    <div 
      style={{
        opacity: data.isVisible ? 1 : 0,
        transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '15px',
        backgroundColor: '#ffffff',
        border: '2px solid #000000',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
        width: '440px', 
        textAlign: 'center'
      }}
    >
      {/* Debug Mode Toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', color: '#000000', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={e => setDebugMode((e.target as HTMLInputElement).checked)}
          />
          Debug Mode
        </label>
      </div>
      {/* Day width slider */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <label style={{ fontSize: '12px', color: '#000000' }}>Day Width: {TIMELINE_PIXELS_PER_DAY}px</label>
        <input
          type="range"
          min={30}
          max={150}
          step={30}
          value={TIMELINE_PIXELS_PER_DAY}
          onChange={e => setTIMELINE_PIXELS_PER_DAY(Number((e.target as HTMLInputElement).value))}
        />
      </div>
      {/* Main content area - either shows summary during loading or Generate button when complete */}
      {isMermaidLoading ? (
        <div 
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#000000',
            padding: '10px',
            ...shimmerStyle
          }}
        >
          {streamSummary || "Generating..."}
        </div>
      ) : (
        <button
          onClick={handleGenerateClick}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            border: '1px solid #000000',
            borderRadius: '6px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 'normal',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          Generate Chart
        </button>
      )}
      
      {/* Process buffer button - only shown when there are items in the buffer */}
      {debugMode && actionBufferLength > 0 && (
        <div style={{ marginTop: '8px', marginBottom: '8px' }}>
          <ActionPreview
            nextAction={nextAction}
            actionBufferLength={actionBufferLength}
            processingBufferProgress={processingBufferProgress}
            startProcessingBuffer={startProcessingBuffer}
            processAllBuffer={processAllBuffer}
            actionBuffer={actionBuffer}
          />
        </div>
      )}
      
      {/* View process section - shown if there's stream data, regardless of loading state */}
      {hasStreamData && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #eaeaea', paddingTop: '8px' }}>
          <button 
            onClick={toggleExpanded}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              fontSize: '12px',
              color: '#666',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <span>View process</span>
            <span style={{ 
              marginLeft: '4px',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}>
              {expanded ? '▲' : '▼'}
            </span>
          </button>
          
          {expanded && (
            <div 
              ref={detailedSummaryRef}
              style={{
                marginTop: '8px',
                fontSize: '12px',
                textAlign: 'left',
                backgroundColor: '#f9f9f9',
                padding: '8px',
                borderRadius: '4px',
                maxHeight: '150px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                color: '#666',
                scrollBehavior: 'smooth'
              }}
            >
              {detailedSummary || "Processing..."}
            </div>
          )}
        </div>
      )}

      {/* Initial loading spinner - only shown when loading but no summary yet */}
      {isMermaidLoading && !streamSummary && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
          <Spinner />
        </div>
      )}
    </div>
  );
};

// Simple spinner component
const Spinner = () => (
  <div
    style={{
      display: 'inline-block',
      width: '16px',
      height: '16px',
      border: '2px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '50%',
      borderTopColor: '#000000',
      animation: 'spin 1s linear infinite'
    }}
  />
);

// Add required CSS animations
const styleElement = document.createElement('style');
styleElement.innerHTML = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
document.head.appendChild(styleElement);

export default memo(GenerateNode);
