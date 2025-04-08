import React, { useState, useEffect } from 'react';
import { useProjectPlan } from '../contexts/ProjectPlanContext';
import { StreamingDiff } from './StreamingDiff';  
import DraftPlan from './draft_plan/DraftPlan';
import { ChartCreationChat } from './ChartCreationChat';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectPlanTrigger from './ProjectPlanTrigger';
import ViewSelector, { ViewMode } from './ViewSelector';
import MarkdownView from './MarkdownView';
import GridView from './GridView';

const Canvas: React.FC = () => {
  // Use the streaming context from ProjectPlanContext
  const { 
    currentText,
    isStreaming
  } = useProjectPlan();
  
  const [showPlanPane, setShowPlanPane] = useState(false);
  const [isDraftCollapsed, setIsDraftCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('diff'); // Default to diff view
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  useEffect(() => {
    // Show the plan pane once the first plan is generated
    if (currentText && !showPlanPane) {
      setShowPlanPane(true);
    }
  }, [currentText, showPlanPane]);

  const handleChatCancel = () => {
    // Navigate back to the project detail page
    if (projectId) {
      navigate(`/projects/${projectId}`);
    }
  };

  const toggleDraftCollapse = () => {
    setIsDraftCollapsed(!isDraftCollapsed);
  };

  // Handle switching between different view modes
  const handleViewChange = (newViewMode: ViewMode) => {
    setViewMode(newViewMode);
  };

  // Render the appropriate view based on the current view mode
  const renderCurrentView = () => {
    if (!currentText) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">
            {isStreaming ? "Generating plan..." : "Waiting for plan generation to start..."}
          </p>
        </div>
      );
    }

    switch (viewMode) {
      case 'diff':
        return (
          <div className="flex notepad-container">
            <div className="prose prose-slate max-w-none pt-1 flex-grow notepad-content" style={{ 
              border: 'none', 
              paddingLeft: '0.5rem',
              overflowX: 'auto',
              minWidth: '100%'
            }}>
              <StreamingDiff 
                onComplete={() => {
                  // Any future post-completion actions can be added here if needed
                }}
              />
            </div>
          </div>
        );
      case 'markdown':
        return <MarkdownView content={currentText} />;
      case 'grid':
        return <GridView content={currentText} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-100">
      {/* Balsamiq Font Import */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700&display=swap');
          
          .font-balsamiq {
            font-family: 'Comic Neue', 'Comic Sans MS', cursive;
            letter-spacing: -0.5px;
          }
          
          /* Remove all borders */
          .markdown-body h1, 
          .markdown-body h2, 
          .markdown-body h3, 
          .markdown-body h4, 
          .markdown-body h5, 
          .markdown-body h6,
          .markdown-body p,
          .markdown-body ul,
          .markdown-body ol,
          .markdown-body li,
          .markdown-body blockquote,
          .markdown-body table,
          .markdown-body tr,
          .markdown-body th,
          .markdown-body td,
          .markdown-body pre,
          .markdown-body code {
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          
          /* Reset specific margins and paddings */
          .markdown-body ul,
          .markdown-body ol {
            padding-left: 1.25rem !important;
          }
          
          .markdown-body blockquote {
            padding-left: 1rem !important;
            border-left: 4px solid #e5e7eb !important;
          }
          
          /* Ensure line heights are consistent */
          .line-number, 
          .markdown-body p, 
          .markdown-body li, 
          .markdown-body h1, 
          .markdown-body h2, 
          .markdown-body h3 {
            line-height: 24px !important;
            height: 24px !important;
          }
          
          /* Reset any additional borders in the container */
          .notepad-container,
          .notepad-content,
          .line-numbers {
            border: none !important;
          }
          
          /* Prevent text wrapping */
          .notepad-content {
            min-width: 100%;
            overflow-x: auto !important;
          }
          
          /* StreamingDiff specific styles */
          .diff-container {
            font-family: 'Comic Neue', 'Comic Sans MS', cursive;
            letter-spacing: -0.5px;
            overflow-x: auto;
            min-width: 100%;
          }
          
          .line {
            line-height: 24px;
            height: 24px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .line-number {
            display: inline-block;
            width: 30px;
            text-align: right;
            padding-right: 8px;
            margin-right: 8px;
            color: #9ca3af;
            user-select: none;
          }
          
          .line-number.active {
            background-color: #fef3c7;
            color: #000;
            font-weight: bold;
          }
          
          .diff-span {
            transition: color 0.5s, background-color 0.5s;
          }
          
          /* Improved transition classes with ease-in-out timing */
          .diff-span.color-transition {
            transition: color 1s ease-in-out, background-color 1s ease-in-out, opacity 1s ease-in-out;
          }
          
          .diff-span.height-transition {
            transition: height 1s ease-in-out, margin 1s ease-in-out, padding 1s ease-in-out;
            overflow: hidden;
          }
          
          .color-transition {
            transition: color 1s, background-color 1s, opacity 1s;
          }
          
          .height-transition {
            transition: height 1s, margin 1s, padding 1s;
            overflow: hidden;
          }

          /* Grid view styles */
          .grid-card {
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          }
          
          .grid-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          }
        `
      }} />

      {/* Main content wrapper using flex with clearly defined sections */}
      <div className="flex flex-col h-full border-right border-gray-200" style={{ width: 'calc(100% - 46rem)' }}>
        {/* Top section with header and content */}
        <div 
          className="flex flex-col border-b border-gray-300"
          style={{ 
            height: isDraftCollapsed ? 'calc(100% - 3rem)' : 'calc(100% - 500px)',
            minHeight: '250px' 
          }}
        >
          {/* Fixed header */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200 shadow-sm z-10">
            <div className="p-3 pb-2 font-balsamiq">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Project Plan</h2>
                  <p className="text-sm text-gray-500 mt-1">Auto-generated plan based on your requirements</p>
                </div>
                
                {/* View Selector - Only show when there is content */}
                {currentText && (
                  <ViewSelector 
                    currentView={viewMode}
                    onViewChange={handleViewChange}
                  />
                )}
              </div>
            </div>
          </div>
          
          {/* Content pane with its own scroll area */}
          <div className="flex-grow overflow-auto bg-white">
            <div className="p-4">
              {renderCurrentView()}
            </div>
          </div>
        </div>

        {/* Bottom section for Gantt chart - clearly separated with strong visual cues */}
        <div 
          className={`
            flex-shrink-0 bg-white border-t border-gray-300
            flex flex-col transition-all duration-300 ease-in-out
            ${isDraftCollapsed ? 'h-12' : 'h-[500px]'}
          `}
          style={{ 
            maxHeight: isDraftCollapsed ? '3rem' : '500px',
            boxShadow: 'inset 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
          }}
        >
          {/* Fixed header for draft plan with clear visual separation */}
          <div className="flex-shrink-0 bg-white border-b border-gray-200">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center text-gray-700 pl-2">
                {/* Ultra minimal Gantt chart icon */}
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-7 w-7" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  stroke="currentColor" 
                  strokeWidth="1.5"
                >
                  {/* Simple timeline container */}
                  <rect x="3" y="3" width="18" height="18" rx="1" />
                  
                  {/* Simplified Gantt bars - just 3 bars of different lengths */}
                  <line x1="6" y1="7" x2="15" y2="7" strokeWidth="2" />
                  <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" />
                  <line x1="6" y1="17" x2="12" y2="17" strokeWidth="2" />
                </svg>
              </div>
              <button 
                onClick={toggleDraftCollapse}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
                aria-label={isDraftCollapsed ? "Expand sketch" : "Collapse sketch"}
              >
                {isDraftCollapsed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Separately scrollable content area for draft plan */}
          {!isDraftCollapsed && (
            <div className="flex-grow overflow-auto">
              <DraftPlan />
            </div>
          )}
        </div>
      </div>

      {/* ChartCreationChat (Right Sidebar) - Fixed width, completely independent */}
      <div className="w-[46rem] border-l border-gray-200 bg-white overflow-hidden">
        <ChartCreationChat onCancel={handleChatCancel} />
      </div>

      {/* Floating Action Button for triggering new plan generation */}
      <ProjectPlanTrigger />
    </div>
  );
};

export default Canvas;