import React, { useState, useEffect } from 'react';
import { useProjectPlan } from '../contexts/ProjectPlanContext';
import { StreamingDiff } from './StreamingDiff';  
import DraftPlan from './draft_plan/DraftPlan';
import { ChartCreationChat } from './ChartCreationChat';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectPlanTrigger from './ProjectPlanTrigger';
import ViewSelector, { ViewMode } from './ViewSelector';
import { MarkdownViewer } from './markdown/MarkdownViewer';
import GridView from './GridView';
import { useDraftPlanContext } from '../contexts/DraftPlanContext';
import { toast } from 'react-hot-toast';

const Canvas: React.FC = () => {
  // Use the streaming context from ProjectPlanContext
  const { 
    currentText,
    isStreaming
  } = useProjectPlan();
  
  const [showPlanPane, setShowPlanPane] = useState(false);
  const [isDraftCollapsed, setIsDraftCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('markdown'); // Default to markdown view
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  // Get createPlanFromMarkdown from DraftPlanContext
  const { createPlanFromMarkdown } = useDraftPlanContext();

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

  // Handle creating a draft plan from the current project plan markdown
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
          <div className="flex flex-col notepad-container w-full h-full">
            <div className="markdown-viewer-container">
              <div className="markdown-container">
                <div 
                  className="prose prose-slate max-w-none pt-1 notepad-content" 
                  style={{ 
                    color: '#1f2937',
                    overflowX: 'auto',
                    minWidth: '100%'
                  }}
                >
                  <StreamingDiff 
                    onComplete={() => {
                      // Any future post-completion actions can be added here if needed
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 'markdown':
        return <MarkdownViewer initialMarkdown={currentText} />;
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
          
          /* Hide scrollbars while maintaining scroll functionality */
          ::-webkit-scrollbar {
            width: 0px;
            height: 0px;
            background: transparent;
          }
          
          * {
            -ms-overflow-style: none; /* IE and Edge */
            scrollbar-width: none; /* Firefox */
          }
          
          /* Ensure elements with overflow still scroll but without visible scrollbars */
          .overflow-auto, .overflow-x-auto, .overflow-y-auto {
            scrollbar-width: none;
            -ms-overflow-style: none;
          }
        `
      }} />

      {/* Main content wrapper using flex with clearly defined sections */}
      <div className="flex flex-col h-full" style={{ width: 'calc(100% - 46rem)' }}>
        {/* Top section with header and content */}
        <div 
          className="flex flex-col"
          style={{ 
            height: isDraftCollapsed ? 'calc(100% - 3rem)' : 'calc(100% - 500px)',
            minHeight: '250px' 
          }}
        >
          {/* Fixed header */}
          <div className="flex-shrink-0 bg-white">
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
            flex-shrink-0 bg-white
            flex flex-col transition-all duration-300 ease-in-out
            ${isDraftCollapsed ? 'h-12' : 'h-[500px]'}
          `}
          style={{ 
            maxHeight: isDraftCollapsed ? '3rem' : '500px',
          }}
        >
          {/* Fixed header for draft plan with simplified visual styling */}
          <div className="flex-shrink-0 bg-white border-t border-b border-gray-200">
            <div className="flex items-center justify-between p-2">
              <div 
                className="flex items-center cursor-pointer hover:bg-gray-50 transition-colors px-2 py-1 rounded"
                onClick={toggleDraftCollapse}
                aria-label={isDraftCollapsed ? "Expand Gantt chart" : "Collapse Gantt chart"}
              >
                <div className="flex items-center text-gray-700">
                  {/* Ultra minimal Gantt chart icon */}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-6 w-6" 
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
              </div>
              
              <button
                onClick={handleCreatePlan}
                className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded px-2 py-1 transition-colors"
                aria-label="Refresh draft plan"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
                <span className="ml-1">Refresh</span>
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
      <div className="w-[46rem] bg-white overflow-hidden border-l border-gray-200">
        <ChartCreationChat onCancel={handleChatCancel} />
      </div>

      {/* Floating Action Button for triggering new plan generation */}
      <ProjectPlanTrigger />
    </div>
  );
};

export default Canvas;