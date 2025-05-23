// import React, { useState, useEffect, useRef } from 'react';
// import { useProjectPlan } from '../contexts/ProjectPlanContext';
// import DraftPlanMermaid from './draft_plan_mermaid/DraftPlanMermaid';
// import { ChartCreationChat } from './ChartCreationChat';
// import ViewSelector, { ViewMode } from './ViewSelector';
// import { MarkdownViewer } from './markdown/MarkdownViewer';
// import GridView from './GridView';
// import { toast } from 'react-hot-toast';
// import { useEditedSection } from '../contexts/EditedSectionContext';
// import { useProject } from '../contexts/ProjectContext';
// import { useDraftPlanMermaidContext } from '../contexts/DraftPlan/DraftPlanContextMermaid';
// import { SectionDiffPanel } from './SectionDiffPanel';
// import { MermaidSyntaxPanel } from './mermaid/MermaidSyntaxPanel';
// import { useFinalPlan } from '@/hooks/useFinalPlan';
// import { useNavigate, useParams } from 'react-router-dom';
// import { useGantt } from '../contexts/GanttContext';

// const Canvas: React.FC = () => {
//   // Use the streaming context from ProjectPlanContext
//   const { 
//     currentText,
//     isStreaming,
//     createPlanIfMissing,
//     reset,
//     deleteMarkdown
//   } = useProjectPlan();

//   const { 
//     project
//   } = useProject();
//   const { resetState } = useEditedSection();
//   const { 
//       createPlanFromMarkdownString: createMermaidPlan,
//       streamProgress
//     } = useDraftPlanMermaidContext();
//   const [showChat, setShowChat] = useState(false); // Add state to control chat visibility
//   const [showMermaidPane, setShowMermaidPane] = useState(false); // Add state to control Mermaid Gantt pane visibility
//   const [showMermaidPlanBottom, setShowMermaidPlanBottom] = useState(false); // Add state to control bottom Mermaid plan panel
//   const [viewMode, setViewMode] = useState<ViewMode>('markdown'); // Default to markdown view
//   const [showSectionDiff, setShowSectionDiff] = useState(false); // Add state to control section diff visibility
//   const [sectionDiffData, setSectionDiffData] = useState<{ 
//     range: {start: number, end: number} | null,
//     instruction: string
//   }>({ range: null, instruction: '' });
//   const { isGeneratingFinalPlan, generationProgress } = useFinalPlan();
//   const navigate = useNavigate();
//   const { projectId } = useParams<{ projectId: string }>();
//   const { currentChart } = useGantt();
//   const [showFinalPlanModal, setShowFinalPlanModal] = useState(false);
  
//   // We no longer need to get mermaidSyntax and streamProgress since they're used in MermaidSyntaxPanel

//   const handleChatCancel = () => {
//     // Hide the chat instead of navigating away
//     setShowChat(false);
//   };

//   // Add function to show the chat
//   const handleShowChat = () => {
//     setShowChat(true);
//     setShowSectionDiff(false);
//     setShowMermaidPane(false);
//     setShowMermaidPlanBottom(false);
//   };
  
//   // Add function to show/hide the Mermaid Gantt syntax pane
//   const toggleMermaidPane = () => {
//     setShowMermaidPane(!showMermaidPane);
//     setShowChat(false);
//     setShowSectionDiff(false);
//     setShowMermaidPlanBottom(false);
//   };

//   // Add function to show the section diff panel
//   const handleShowSectionDiff = (range: {start: number, end: number}, instruction: string) => {
//     setSectionDiffData({ range, instruction });
//     setShowSectionDiff(true);
//   };

//   // Add function to hide the section diff panel
//   const handleSectionDiffCancel = () => {
//     setShowSectionDiff(false);
//     //clear all edited section context
//     resetState();
//   };

//   // Add function to toggle the Mermaid plan bottom panel
//   const handleToggleMermaidPlanBottom = () => {

//     if (!currentText) {
//       toast.error('No project plan available to convert');
//       return;
//     }

//     if(!showMermaidPlanBottom) {
//       let genPlan = false;
//       if(streamProgress > 0 ) {
//         //launch dialog asking user if they want to regenerate
//         const shouldRegenerate = window.confirm('A Mermaid plan is currently being generated. Do you want to regenerate it?');
//         if (shouldRegenerate) {
//           genPlan = true;
//         }
//       }
      
//       if(genPlan) {
//         createMermaidPlan(currentText);
//       }
//     }
//     setShowMermaidPlanBottom(!showMermaidPlanBottom);
//     // Close other panes for better UX
//     setShowChat(false);
//     setShowMermaidPane(false);
//     setShowSectionDiff(false);
//   };

//   // Handle switching between different view modes
//   const handleViewChange = (newViewMode: ViewMode) => {
//     setViewMode(newViewMode);
//   };

//   // Render the appropriate view based on the current view mode
//   const renderCurrentView = () => {
//     if (!currentText) {
//       return (
//         <div className="flex items-center justify-center h-64">
//           <p className="text-gray-500">
//             {isStreaming ? "Generating plan..." : "Waiting for plan generation to start..."}
//           </p>
//         </div>
//       );
//     }

//     switch (viewMode) {
//       case 'chart':
//         return (
//           <div style={{ 
//             width: '100%', 
//             height: 'calc(100vh - 200px)',
//             backgroundColor: '#ffffff',
//             borderRadius: '12px',
//             boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
//             border: '1px solid #e5e7eb',
//             padding: '2rem',
//             margin: '0 auto 1.5rem auto',
//             overflowX: 'auto'
//           }}>
//             <div style={{
//               width: '100%',
//               height: '100%',
//               display: 'flex',
//               justifyContent: 'center',
//               alignItems: 'center'
//             }}>
//               <DraftPlanMermaid />
//             </div>
//           </div>
//         );
//       case 'markdown':
//         return (
//           <MarkdownViewer 
//             initialMarkdown={currentText} 
//             onShowChat={handleShowChat} 
//             onShowSectionDiff={handleShowSectionDiff}
//           />
//         );
//       case 'grid':
//         return <GridView content={currentText} onShowChat={handleShowChat} />;
//       default:
//         return null;
//     }
//   };

//   // Use a ref to track whether initialization has occurred
//   const hasInitializedRef = useRef(false);

//   useEffect(() => {
//     // Only call if not already initialized
//     if (!hasInitializedRef.current) {
//       hasInitializedRef.current = true;
//       createPlanIfMissing(project!);
//     }
//   }, []);

//   useEffect(() => {
//     if (isGeneratingFinalPlan) {
//       setShowFinalPlanModal(true);
//     }
//   }, [isGeneratingFinalPlan]);

//   const handleGoToChart = () => {
//     setShowFinalPlanModal(false);
//     if (projectId && currentChart?.id) {
//       navigate(`/projects/${projectId}/chart/${currentChart.id}`);
//     }
//   };

//   return (
//     <div className="flex h-full overflow-hidden bg-gray-100">
//       {/* Balsamiq Font Import */}
//       <style dangerouslySetInnerHTML={{
//         __html: `
//           @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:ital,wght@0,400;0,700;1,400;1,700&display=swap');
          
//           .font-balsamiq {
//             font-family: 'Comic Neue', 'Comic Sans MS', cursive;
//             letter-spacing: -0.5px;
//           }
          
//           /* Remove all borders */
//           .markdown-body h1, 
//           .markdown-body h2, 
//           .markdown-body h3, 
//           .markdown-body h4, 
//           .markdown-body h5, 
//           .markdown-body h6,
//           .markdown-body p,
//           .markdown-body ul,
//           .markdown-body ol,
//           .markdown-body li,
//           .markdown-body blockquote,
//           .markdown-body table,
//           .markdown-body tr,
//           .markdown-body th,
//           .markdown-body td,
//           .markdown-body pre,
//           .markdown-body code {
//             border: none !important;
//             margin: 0 !important;
//             padding: 0 !important;
//             white-space: nowrap !important;
//             overflow: hidden !important;
//             text-overflow: ellipsis !important;
//           }
          
//           /* Improved transition classes with ease-in-out timing */
//           .diff-span.color-transition {
//             transition: color 1s ease-in-out, background-color 1s ease-in-out, opacity 1s ease-in-out;
//           }
          
//           .diff-span.height-transition {
//             transition: height 1s ease-in-out, margin 1s ease-in-out, padding 1s ease-in-out;
//             overflow: hidden;
//           }
          
//           .color-transition {
//             transition: color 1s, background-color 1s, opacity 1s;
//           }
          
//           .height-transition {
//             transition: height 1s, margin 1s, padding 1s;
//             overflow: hidden;
//           }

//           /* Grid view styles */
//           .grid-card {
//             transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
//           }
          
//           .grid-card:hover {
//             transform: translateY(-2px);
//             box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
//           }
          
//           /* Hide scrollbars while maintaining scroll functionality */
//           ::-webkit-scrollbar {
//             width: 0px;
//             height: 0px;
//             background: transparent;
//           }
          
//           * {
//             -ms-overflow-style: none; /* IE and Edge */
//             scrollbar-width: none; /* Firefox */
//           }
          
//           /* Ensure elements with overflow still scroll but without visible scrollbars */
//           .overflow-auto, .overflow-x-auto, .overflow-y-auto {
//             scrollbar-width: none;
//             -ms-overflow-style: none;
//           }
//         `
//       }} />

//       {/* Main content wrapper using flex with clearly defined sections */}
//         <div className="flex flex-col h-full w-full">
//           {/* Top section with header and content */}
//           <div 
//             className="flex flex-col h-full"
//           >
//             {/* Fixed header */}
//             <div className="flex-shrink-0 bg-white">
//               <div className="p-3 pb-2 font-balsamiq">
//                 <div className="flex flex-col items-center">
                  
//                   {/* View Selector - Only show when there is content */}
//                   {currentText && (
//                     <ViewSelector 
//                       currentView={viewMode}
//                       onViewChange={handleViewChange}
//                     />
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* Content pane with its own scroll area */}
//             <div className="flex-grow overflow-auto bg-white">
//               <div className="p-4">
//                 {renderCurrentView()}
//               </div>
//             </div>
//           </div>
//         </div>

//       {/* Draft Plan Pane */}
//       {/* <div 
//         className={`fixed top-0 right-0 h-screen z-50 transition-transform duration-300 ease-in-out transform ${showDraftPane ? 'translate-x-0' : 'translate-x-full'}`}
//         style={{ 
//           width: '825px',
//           maxWidth: '95vw',
//           padding: '24px 24px 0px 24px',
//           height: 'calc(100vh - 16px)', // Reduce height to create space at bottom
//         }}
//       >
//         <div 
//           className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden"
//           style={{ 
//             display: 'flex',
//             flexDirection: 'column'
//           }}
//         >
//           <DraftPlan />
//         </div>
//       </div> */}

//       {/* Mermaid Gantt Syntax Pane */}
//       <MermaidSyntaxPanel 
//         currentText={currentText} 
//         isVisible={showMermaidPane} 
//         onClose={toggleMermaidPane} 
//       />

//       {/* ChartCreationChat sliding in from the right side */}
//       <div 
//         className={`fixed top-0 right-0 h-screen z-40 transition-transform duration-300 ease-in-out transform ${showChat ? 'translate-x-0' : 'translate-x-full'}`}
//         style={{ 
//           width: '825px',
//           maxWidth: '95vw',
//           padding: '24px 24px 0px 24px',
//           height: 'calc(100vh - 16px)', // Reduce height to create space at bottom
//         }}
//       >
//         <div 
//           className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden"
//           style={{ 
//             display: 'flex',
//             flexDirection: 'column'
//           }}
//         >
//           <ChartCreationChat onCancel={handleChatCancel} className="h-full w-full" />
//         </div>
//       </div>

//       {/* Section Diff Panel */}
//       <div 
//         className={`fixed top-0 right-0 h-screen z-50 transition-transform duration-300 ease-in-out transform ${showSectionDiff ? 'translate-x-0' : 'translate-x-full'}`}
//         style={{ 
//           width: '825px',
//           maxWidth: '95vw',
//           padding: '24px 24px 0px 24px',
//           height: 'calc(100vh - 16px)', // Reduce height to create space at bottom
//         }}
//       >
//         <div 
//           className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden"
//           style={{ 
//             display: 'flex',
//             flexDirection: 'column'
//           }}
//         >
//           {showSectionDiff && sectionDiffData && sectionDiffData.range && (
//             <SectionDiffPanel 
//               range={sectionDiffData.range} 
//               instruction={sectionDiffData.instruction} 
//               onCancel={handleSectionDiffCancel} 
//               className="h-full w-full"
//             />
//           )}
//         </div>
//       </div>

//       {/* Floating Action Button for Draft Plan at bottom left */}
//       {/* <button
//         onClick={toggleDraftPaneAndGenerate}
//         className="fixed left-20 bottom-6 z-30 w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 focus:outline-none"
//         aria-label="Show Draft Plan"
//         title="Show Draft Plan"
//       >
//         <svg 
//           xmlns="http://www.w3.org/2000/svg" 
//           width="20" 
//           height="20" 
//           viewBox="0 0 24 24" 
//           fill="none"
//           stroke="currentColor" 
//           strokeWidth="2"
//         >
//           <rect x="3" y="3" width="18" height="18" rx="1" />
//         </svg>
//       </button> */}
      
//       {/* Floating Action Button for Mermaid Gantt Syntax */}
//       <button
//         onClick={async () => {
//           reset();
//           await deleteMarkdown();
//           createPlanIfMissing(project!);
//         }}
//         className="fixed left-36 bottom-6 z-30 w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 focus:outline-none"
//         aria-label="Show Mermaid Gantt Syntax"
//         title="Show Mermaid Gantt Syntax"
//       >
//         <svg 
//           xmlns="http://www.w3.org/2000/svg" 
//           width="20" 
//           height="20" 
//           viewBox="0 0 24 24" 
//           fill="none"
//           stroke="currentColor" 
//           strokeWidth="2"
//           strokeLinecap="round" 
//           strokeLinejoin="round"
//         >
//           <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
//           <polyline points="22,6 12,13 2,6" />
//         </svg>
//       </button>

//       {/* Floating Action Button for showing chat */}
//       <button
//         onClick={handleShowChat}
//         className="fixed right-6 bottom-6 z-30 w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 focus:outline-none"
//         aria-label="Show Chat"
//         title="Show Chat"
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
//         </svg>
//       </button>

//       {/* Floating Action Button for Mermaid Plan (Bottom Panel) */}
//       {/* <button
//         onClick={handleToggleMermaidPlanBottom}
//         className="fixed left-52 bottom-6 z-30 w-12 h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow duration-200 focus:outline-none"
//         aria-label="Show Mermaid Plan"
//         title="Show Mermaid Plan"
//       >
//         <svg 
//           xmlns="http://www.w3.org/2000/svg" 
//           width="20" 
//           height="20" 
//           viewBox="0 0 24 24" 
//           fill="none"
//           stroke="currentColor" 
//           strokeWidth="2"
//           strokeLinecap="round" 
//           strokeLinejoin="round"
//         >
//           <path d="M3 3v18h18" />
//           <path d="M7 17l4-4 4 4 5-5" />
//           <circle cx="18" cy="7" r="2" />
//         </svg> 
//       </button>*/}

//       {/* Bottom panel for Mermaid Plan */}
//       <div 
//         className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out transform ${showMermaidPlanBottom ? 'translate-y-0' : 'translate-y-full'}`}
//         style={{ 
//           height: '60vh',
//           maxHeight: 'calc(100vh - 100px)',
//           background: 'white',
//           borderTop: '1px solid rgb(229, 231, 235)',
//           borderTopLeftRadius: '16px',
//           borderTopRightRadius: '16px',
//           boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
//         }}
//       >
//         <div className="flex justify-between items-center p-4 border-b border-gray-200">
//           <h2 className="text-xl font-semibold">Mermaid Gantt Plan</h2>
//           <button
//             onClick={handleToggleMermaidPlanBottom}
//             className="p-2 text-gray-700 hover:text-black transition-colors"
//             aria-label="Close"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <line x1="18" y1="6" x2="6" y2="18"></line>
//               <line x1="6" y1="6" x2="18" y2="18"></line>
//             </svg>
//           </button>
//         </div>
//         <div className="h-full overflow-auto pb-4">
//           {renderCurrentView()}
//         </div>
//       </div>

//       {/* Floating Action Button for triggering new plan generation */}
//       {/* <ProjectPlanTrigger /> */}

//       {showFinalPlanModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 shadow-lg w-11/12 max-w-md">
//             {isGeneratingFinalPlan ? (
//               <div className="flex flex-col items-center gap-4">
//                 <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
//                 <div>{generationProgress}</div>
//               </div>
//             ) : (
//               <div className="flex flex-col items-center gap-4">
//                 <div className="text-lg font-medium">Final plan is ready!</div>
//                 <button
//                   onClick={handleGoToChart}
//                   className="bg-black text-white px-4 py-2 rounded"
//                 >
//                   Go to Chart
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Canvas;