import React, { useState, useEffect, useRef } from 'react';
import { useProjectPlan } from '../contexts/ProjectPlanContext';
// import { StreamingDiff } from './StreamingDiff';  
import DraftPlan from './draft_plan/DraftPlan';
import { ChartCreationChat } from './ChartCreationChat';
// import ProjectPlanTrigger from './ProjectPlanTrigger';
import ViewSelector, { ViewMode } from './ViewSelector';
import { MarkdownViewer } from './markdown/MarkdownViewer';
import GridView from './GridView';
import { useDraftPlanContext } from '../contexts/DraftPlanContext';
import { toast } from 'react-hot-toast';
import { EditedSectionProvider, useEditedSection } from '../contexts/EditedSectionContext';

import { SectionDiffPanel } from './SectionDiffPanel';
// import { EditedSectionProvider } from '../contexts/EditedSectionContext';

const Canvas: React.FC = () => {
  // Use the streaming context from ProjectPlanContext
  const { 
    currentText,
    isStreaming,
    createPlanIfMissing
  } = useProjectPlan();

  const { resetState } = useEditedSection();
  
  const [showChat, setShowChat] = useState(false); // Add state to control chat visibility
  const [showDraftPane, setShowDraftPane] = useState(false); // Add state to control draft pane visibility
  const [viewMode, setViewMode] = useState<ViewMode>('markdown'); // Default to markdown view
  const [showSectionDiff, setShowSectionDiff] = useState(false); // Add state to control section diff visibility
  const [sectionDiffData, setSectionDiffData] = useState<{ 
    range: {start: number, end: number} | null,
    instruction: string
  }>({ range: null, instruction: '' });


  // Get createPlanFromMarkdown from DraftPlanContext
  const { createPlanFromMarkdown } = useDraftPlanContext();

  const handleChatCancel = () => {
    // Hide the chat instead of navigating away
    setShowChat(false);
  };

  // Add function to show the chat
  const handleShowChat = () => {
    setShowChat(true);
    setShowDraftPane(false);
    setShowSectionDiff(false);
  };

  // Add function to show/hide the draft plan pane
  const toggleDraftPane = () => {
    setShowDraftPane(!showDraftPane);
    setShowChat(false);
    setShowSectionDiff(false);
  };

  // Add function to show the section diff panel
  const handleShowSectionDiff = (range: {start: number, end: number}, instruction: string) => {
    setSectionDiffData({ range, instruction });
    setShowSectionDiff(true);
  };

  // Add function to hide the section diff panel
  const handleSectionDiffCancel = () => {
    setShowSectionDiff(false);
    //clear all edited section context
    resetState();
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
      // case 'diff':
      //   return (
      //     <div className="flex flex-col notepad-container w-full h-full">
      //       <div className="markdown-viewer-container">
      //         <div className="markdown-container">
      //           <div 
      //             className="prose prose-slate max-w-none pt-1 notepad-content" 
      //             style={{ 
      //               color: '#1f2937',
      //               overflowX: 'auto',
      //               minWidth: '100%'
      //             }}
      //           >
      //             <StreamingDiff 
      //               onComplete={() => {
      //                 // Any future post-completion actions can be added here if needed
      //               }}
      //             />
      //           </div>
      //         </div>
      //       </div>
      //     </div>
      //   );
      case 'markdown':
        return (
          <MarkdownViewer 
            initialMarkdown={currentText} 
            onShowChat={handleShowChat} 
            onShowSectionDiff={handleShowSectionDiff}
          />
        );
      case 'grid':
        return <GridView content={currentText} onShowChat={handleShowChat} />;
      default:
        return null;
    }
  };

  // Use a ref to track whether initialization has occurred
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Only call if not already initialized
    if (!hasInitializedRef.current) {
      console.log('Canvas: createPlanIfMissing - first initialization');
      hasInitializedRef.current = true;
      createPlanIfMissing();
    } else {
      console.log('Canvas: skipping duplicate createPlanIfMissing call');
    }
  }, []);

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
        <div className="flex flex-col h-full w-full">
          {/* Top section with header and content */}
          <div 
            className="flex flex-col h-full"
          >
            {/* Fixed header */}
            <div className="flex-shrink-0 bg-white">
              <div className="p-3 pb-2 font-balsamiq">
                <div className="flex flex-col items-center">
                  
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

          {/* DraftPlan sliding in from the bottom */}
          <div 
            className={`fixed bottom-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out`}
            style={{ 
              height: '500px',
              maxHeight: '80vh',
              width: '95%',
              maxWidth: '95%',
              margin: '0 auto 16px auto',
              padding: '0 16px 0 12px',
              transform: showDraftPane ? 'translateY(0)' : 'translateY(calc(100% + 64px))',
              opacity: showDraftPane ? 1 : 0,
              visibility: showDraftPane ? 'visible' : 'hidden',
              transitionProperty: 'transform, opacity, visibility',
            }}
          >
            <div 
              className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg"
              style={{ 
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Fixed header for draft plan with simplified visual styling */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200">
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center text-gray-700 ml-2">
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
                  
                  <div className="flex items-center">
                    <button
                      onClick={handleCreatePlan}
                      className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded px-2 py-1 transition-colors mr-2"
                      aria-label="Refresh draft plan"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                      </svg>
                      <span className="ml-1">Refresh</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleCreatePlan();
                        toggleDraftPane();
                      }}
                      className="flex items-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded px-2 py-1 transition-colors mr-2"
                      aria-label="Close draft pane"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Separately scrollable content area for draft plan */}
              <div className="flex-grow overflow-auto">
                <DraftPlan />
              </div>
            </div>
          </div>
        </div>

        {/* ChartCreationChat sliding in from the right side */}
        <div 
          className={`fixed top-0 right-0 h-screen z-40 transition-transform duration-300 ease-in-out transform ${showChat ? 'translate-x-0' : 'translate-x-full'}`}
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
            <ChartCreationChat onCancel={handleChatCancel} className="h-full w-full" />
          </div>
        </div>

        {/* Section Diff Panel */}
        <div 
          className={`fixed top-0 right-0 h-screen z-50 transition-transform duration-300 ease-in-out transform ${showSectionDiff ? 'translate-x-0' : 'translate-x-full'}`}
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
            {showSectionDiff && sectionDiffData && sectionDiffData.range && (
              <SectionDiffPanel 
                range={sectionDiffData.range} 
                instruction={sectionDiffData.instruction} 
                onCancel={handleSectionDiffCancel} 
                className="h-full w-full"
              />
            )}
          </div>
        </div>

        {/* Floating Action Button for Draft Plan at bottom left */}
        <button
          onClick={toggleDraftPane}
          className="fixed left-20 bottom-6 z-30 w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 focus:outline-none"
          aria-label="Show Draft Plan"
          title="Show Draft Plan"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor" 
            strokeWidth="2"
          >
            {/* Simple timeline container */}
            <rect x="3" y="3" width="18" height="18" rx="1" />
            
            {/* Simplified Gantt bars - just 3 bars of different lengths */}
            <line x1="6" y1="7" x2="15" y2="7" strokeWidth="2" />
            <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" />
            <line x1="6" y1="17" x2="12" y2="17" strokeWidth="2" />
          </svg>
        </button>

        {/* Floating Action Button for showing chat */}
        <button
          onClick={handleShowChat}
          className="fixed right-6 bottom-6 z-30 w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 focus:outline-none"
          aria-label="Show Chat"
          title="Show Chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        {/* Floating Action Button for triggering new plan generation */}
        {/* <ProjectPlanTrigger /> */}
    </div>
  );
};

export default Canvas;