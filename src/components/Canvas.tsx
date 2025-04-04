import React, { useState, useEffect } from 'react';
import { useProjectPlan } from '../contexts/ProjectPlanContext';
import { StreamingDiff } from './StreamingDiff';

const Canvas: React.FC = () => {
  // Use the streaming context from ProjectPlanContext
  const { 
    currentText,
    isStreaming
  } = useProjectPlan();
  
  const [showPlanPane, setShowPlanPane] = useState(false);

  useEffect(() => {
    // Show the plan pane once the first plan is generated
    if (currentText && !showPlanPane) {
      setShowPlanPane(true);
    }
  }, [currentText, showPlanPane]);

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
            border-left: 4px solid #93c5fd !important;
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
            color: #92400e;
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
          
          .expand-button {
            margin-top: 16px;
            padding: 8px 16px;
            background-color: #3b82f6;
            color: white;
            border-radius: 4px;
            border: none;
            cursor: pointer;
            font-family: 'Comic Neue', 'Comic Sans MS', cursive;
          }
          
          .expand-button:disabled {
            background-color: #9ca3af;
            cursor: not-allowed;
          }
        `
      }} />

      {/* Left Pane: Project Notes */}
      <div 
        className={`
          transition-all duration-500 ease-in-out 
          h-full overflow-y-auto bg-white border-r border-gray-200
          ${showPlanPane ? 'w-1/2 p-0 opacity-100' : 'w-0 p-0 opacity-0'}
        `}
        style={{ willChange: 'width, opacity' }}
      >
        <div className="sticky top-0 bg-white p-6 pb-2 z-10 font-balsamiq" style={{ border: 'none' }}>
          <h2 className="text-xl font-semibold text-gray-800">Project Consultation Notes</h2>
          <p className="text-sm text-gray-500 mt-1 mb-2">Information gathered during consultation</p>
        </div>
        
        {currentText ? (
          <div className="flex notepad-container" style={{ padding: '1.5rem 1.5rem 0 1.5rem', border: 'none' }}>
            {/* Thin separator line instead of border */}
            <div className="h-full" style={{ width: '1px', backgroundColor: '#e5e7eb', margin: '0 8px 0 0' }}></div>
            
            {/* StreamingDiff content instead of Markdown */}
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
              
              {/* Hint about structured notes */}
              {!currentText.includes('# Timescales') && !currentText.includes('# Scope') && (
                <div className="mt-6 py-4 px-5 bg-blue-50 text-blue-700 rounded-lg text-sm font-balsamiq" style={{ border: 'none' }}>
                  <p className="font-medium" style={{ height: 'auto', lineHeight: 'normal', border: 'none' }}>Consultant's Note</p>
                  <p className="mt-1" style={{ height: 'auto', lineHeight: 'normal', border: 'none' }}>These notes will be structured around key project areas: Timescales, Scope, Roles, Dependencies, and Deliverables.</p>
                  <p className="mt-1" style={{ height: 'auto', lineHeight: 'normal', border: 'none' }}>Continue the consultation to gather more information.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          !isStreaming && (
              <div className="text-center text-gray-400 italic mt-10 p-6 font-balsamiq">
              <p>Notes will appear here as the consultation progresses.</p>
              <p className="text-sm mt-2">Begin your conversation to start collecting project information.</p>
            </div>
          )
        )}
      </div>

      {/* Right Pane: Placeholder */}
      <div className="flex-1 flex items-center justify-center h-full p-6">
        <div className="text-center text-gray-400 font-balsamiq">
          <p className="text-lg">Placeholder Area</p>
          <p className="text-sm">This area will display other content in the future.</p>
        </div>
      </div>
    </div>
  );
};

export default Canvas;