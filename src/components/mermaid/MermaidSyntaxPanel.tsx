import React, { useEffect, useState } from 'react';
import { useDraftPlanMermaidContext } from '../../contexts/DraftPlan/DraftPlanContextMermaid';
import { toast } from 'react-hot-toast';
import DraftPlanMermaid from '../draft_plan_mermaid/DraftPlanMermaid';

interface MermaidSyntaxPanelProps {
  currentText: string | null;
  isVisible: boolean;
  onClose: () => void;
}

export const MermaidSyntaxPanel: React.FC<MermaidSyntaxPanelProps> = ({
  currentText,
  isVisible,
  onClose,
}) => {
  const { 
    createPlanFromMarkdownString: createMermaidPlan, 
    fullSyntax, 
    streamProgress, 
    isLoading: isMermaidLoading,
    sections,
    timeline,
    actionBufferLength
  } = useDraftPlanMermaidContext();

  // Handle creating a Mermaid Gantt chart from the current project plan markdown
  const handleCreateMermaidGantt = async () => {
    if (!currentText) {
      toast.error('No project plan available to convert');
      return;
    }

    try {
      toast.promise(
        createMermaidPlan(currentText),
        {
          loading: 'Creating Mermaid Gantt chart...',
          success: 'Mermaid Gantt chart created successfully!',
          error: (err) => `Failed to create Mermaid Gantt chart: ${err.message}`
        }
      );
    } catch (error) {
      console.error('Error creating Mermaid Gantt chart:', error);
    }
  };

  // Process mermaid syntax for proper display - ensure all lines are showing
  const displayedSyntax = React.useMemo(() => {
    return fullSyntax.trim();
  }, [fullSyntax]);

  // State to track if we should show the visual chart instead of code
  const [showVisualChart, setShowVisualChart] = useState(false);
  
  // State to store the parsed content parts
  const [contentParts, setContentParts] = useState<{
    beforeBlock: string;
    codeBlock: string;
    afterBlock: string;
  }>({
    beforeBlock: '',
    codeBlock: '',
    afterBlock: ''
  });

  // Parse the content to extract text before and after the Mermaid code block
  useEffect(() => {
    if (!fullSyntax) return;
    
    // Check if there is valid chart data to display
    // More reliable check - just verify if we have section data to display
    const hasValidChartData = sections.length > 0;
    
    // Only allow switching to visual chart view if we have data to display
    if (!hasValidChartData) {
      setShowVisualChart(false);
    }
    
    // Find the Mermaid code block (if it exists)
    if (fullSyntax.includes('```mermaid') || fullSyntax.includes('### Mermaid Gantt Chart')) {
      const startPattern = fullSyntax.includes('```mermaid') ? '```mermaid' : '### Mermaid Gantt Chart';
      const startIndex = fullSyntax.indexOf(startPattern);
      
      let endIndex;
      if (fullSyntax.includes('```mermaid')) {
        endIndex = fullSyntax.indexOf('```', startIndex + 10); // +10 to skip the first occurrence
        if (endIndex === -1) {
          // If no closing block is found, assume it's at the end
          endIndex = fullSyntax.length;
        } else {
          // Include the closing ```
          endIndex += 3;
        }
      } else {
        // For a heading-based block, find the next heading
        const nextHeadingMatch = fullSyntax.substring(startIndex + 20).match(/^(#{1,6}\s)/m);
        endIndex = nextHeadingMatch && nextHeadingMatch.index !== undefined
          ? startIndex + 20 + nextHeadingMatch.index 
          : fullSyntax.length;
      }
      
      // Extract the parts
      setContentParts({
        beforeBlock: fullSyntax.substring(0, startIndex),
        codeBlock: fullSyntax.substring(startIndex, endIndex),
        afterBlock: fullSyntax.substring(endIndex)
      });
    } else if (hasValidChartData) {
      // If we have data but no explicit code block, treat the whole text as context
      setContentParts({
        beforeBlock: fullSyntax,
        codeBlock: '',
        afterBlock: ''
      });
    }
  }, [fullSyntax, sections]);

  // Helper function to format dates
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Not set';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-screen z-50 transition-transform duration-300 ease-in-out transform ${isVisible ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ 
        width: '825px',
        maxWidth: '95vw',
        padding: '24px 24px 0px 24px',
        height: 'calc(100vh - 16px)', // Reduce height to create space at bottom
      }}
    >
      <div 
        className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden"
        style={{ 
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Mermaid Gantt Syntax</h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCreateMermaidGantt} 
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-900 transition-colors"
                disabled={isMermaidLoading}
              >
                {isMermaidLoading ? 'Processing...' : 'Generate Gantt'}
              </button>
              <button
                onClick={() => setShowVisualChart(!showVisualChart)}
                className="px-4 py-2 bg-white text-black border border-black rounded hover:bg-gray-100 transition-colors"
                disabled={sections.length === 0}
                title={sections.length === 0 ? 'Generate Gantt chart first' : ''}
              >
                {showVisualChart ? 'Show Syntax' : 'Show Chart'}
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-gray-700 hover:text-black transition-colors"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {isMermaidLoading && (
            <div className="p-4 border-b border-gray-200">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-black h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${streamProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">Processing: {streamProgress}%</p>
            </div>
          )}
          
          {/* Action Preview section - only shown when there are pending actions */}
          {actionBufferLength > 0 && (
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium mb-2">Update Preview</h3>
            </div>
          )}
          
          <div className="flex-1 overflow-auto">
            <div className="p-4">
              <h3 className="text-lg font-medium mb-2">Mermaid Syntax</h3>
              {displayedSyntax ? (
                <div className="bg-gray-50 rounded border border-gray-200 overflow-auto w-full mb-4 font-mono text-sm">
                  {/* Content is structured to appear as a single text flow with the chart inline */}
                  {contentParts.beforeBlock && (
                    <pre className="p-4 whitespace-pre">{contentParts.beforeBlock}</pre>
                  )}
                  
                  {/* Mermaid block - either code or chart */}
                  {showVisualChart ? (
                    <div className="my-2 mx-4 rounded border border-gray-300 bg-white shadow-sm overflow-hidden" style={{ height: '580px' }}>
                      <DraftPlanMermaid />
                    </div>
                  ) : (
                    <pre className="p-4 whitespace-pre">{contentParts.codeBlock || displayedSyntax}</pre>
                  )}
                  
                  {/* After the mermaid block */}
                  {contentParts.afterBlock && (
                    <pre className="p-4 whitespace-pre">{contentParts.afterBlock}</pre>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded border border-gray-200 mb-4">
                  <p className="text-gray-500 mb-4">No Mermaid Gantt chart generated yet.</p>
                  <p className="text-gray-400 text-sm">Click the "Generate Gantt" button to create a chart from the current project plan.</p>
                </div>
              )}
              
              {sections.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mt-6 mb-2">Parsed Data</h3>
                  
                  {/* Timeline */}
                  {timeline && (
                    <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                      <h4 className="font-medium mb-1">Timeline</h4>
                      <p className="text-sm">
                        <span className="inline-block w-24">Start Date:</span> {formatDate(timeline.startDate)}
                      </p>
                      <p className="text-sm">
                        <span className="inline-block w-24">End Date:</span> {formatDate(timeline.endDate)}
                      </p>
                    </div>
                  )}
                  
                  {/* Sections */}
                  <div className="space-y-4">
                    {sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="p-3 bg-gray-50 rounded border border-gray-200">
                        <h4 className="font-medium mb-2">Section: {section.name}</h4>
                        
                        {/* Tasks (including milestones) */}
                        {section.tasks.length > 0 && (
                          <div className="mb-3">
                            <h5 className="font-medium text-sm mb-1">Tasks & Milestones</h5>
                            <ul className="space-y-2">
                              {section.tasks.map((task, taskIndex) => (
                                <li 
                                  key={taskIndex} 
                                  className={`text-sm p-2 rounded border transition-all ${
                                    task.type === 'milestone' 
                                      ? 'bg-gray-50 border-gray-300' 
                                      : 'bg-white border-gray-100'
                                  }`}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{task.label}</span>
                                    <div className="flex items-center gap-2">
                                      {task.type === 'milestone' && (
                                        <span className="px-2 py-0.5 text-xs bg-black text-white rounded-full">
                                          Milestone
                                        </span>
                                      )}
                                      <span className="text-gray-500 text-xs">ID: {task.id}</span>
                                    </div>
                                  </div>
                                  <div className="mt-1 text-gray-600">
                                    {task.type === 'milestone' ? (
                                      <div>Date: {formatDate(task.startDate)}</div>
                                    ) : (
                                      <>
                                        <div>Start: {formatDate(task.startDate)}</div>
                                        {task.endDate && <div>End: {formatDate(task.endDate)}</div>}
                                        {task.duration !== undefined && <div>Duration: {task.duration}d</div>}
                                      </>
                                    )}
                                    {task.dependencies && task.dependencies.length > 0 && (
                                      <div>Dependencies: {task.dependencies.join(', ')}</div>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* JSON Representation */}
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-medium">JSON Representation</h3>
                      <button 
                        onClick={() => navigator.clipboard.writeText(JSON.stringify({sections, timeline}, null, 2))}
                        className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded border border-gray-200 transition-colors"
                        title="Copy JSON to clipboard"
                      >
                        Copy
                      </button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded border border-gray-200 overflow-auto whitespace-pre w-full font-mono text-xs">
                      {JSON.stringify({sections, timeline}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
