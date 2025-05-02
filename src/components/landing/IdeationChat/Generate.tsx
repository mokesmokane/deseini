// import { memo, useState } from 'react';
// import { useDraftPlanMermaidContext } from '../../../contexts/DraftPlan/DraftPlanContextMermaid';
// import { createPortal } from 'react-dom';

// interface GenerateNodeData {
//   label: string;
//   isVisible: boolean;
// }

// const Generate = ({ data }: { data: GenerateNodeData }) => {
//   const { 
//     streamSummary,
//     newSummary, 
//     createPlanFromMarkdownString
//   } = useDraftPlanMermaidContext();

//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [dialogText, setDialogText] = useState('');

//   // Format the duration into a readable string
//   const formatDuration = (days: number) => {
//     if (days === 1) return '1 day';
//     return `${days} days`;
//   };

//   // Format a date object to a readable string
//   const formatDate = (date?: Date) => {
//     if (!date) return 'TBD';
//     return date.toLocaleDateString('en-US', { 
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });
//   };

//   return (
//     <>
//       {dialogOpen && createPortal(
//         <div
//           style={{
//             position: 'fixed',
//             top: 0,
//             left: 0,
//             width: '100%',
//             height: '100vh',
//             background: 'rgba(0,0,0,0.45)',
//             zIndex: 2147483647,
//             pointerEvents: 'auto',
//             display: 'flex',
//             alignItems: 'center',
//             justifyContent: 'center',
//           }}
//           onClick={() => setDialogOpen(false)}
//         >
//           <div
//             style={{
//               background: '#fff',
//               color: '#111',
//               borderRadius: 12,
//               boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
//               maxWidth: '98vw',
//               maxHeight: '80vh',
//               width: 1000,
//               padding: '2rem 1.5rem 1.5rem 1.5rem',
//               overflow: 'auto',
//               position: 'relative',
//               fontFamily: 'monospace',
//               fontSize: '1rem',
//               border: '1.5px solid #111',
//               display: 'flex',
//               flexDirection: 'column',
//             }}
//             onClick={e => e.stopPropagation()}
//           >
//             <button
//               onClick={() => {
//                 createPlanFromMarkdownString(dialogText);
//               }}
//               style={{
//                 position: 'absolute',
//                 top: 12,
//                 right: 52,
//                 background: '#fff',
//                 color: '#111',
//                 border: '1.5px solid #111',
//                 borderRadius: 6,
//                 padding: '4px 14px',
//                 fontWeight: 600,
//                 fontSize: '1rem',
//                 cursor: 'pointer',
//                 transition: 'background 0.15s, color 0.15s',
//                 outline: 'none',
//                 boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
//               }}
//               aria-label="Regenerate"
//             >
//               Regenerate
//             </button>
//             <button
//               onClick={() => setDialogOpen(false)}
//               style={{
//                 position: 'absolute',
//                 top: 12,
//                 right: 16,
//                 background: 'none',
//                 border: 'none',
//                 fontSize: 20,
//                 cursor: 'pointer',
//                 color: '#111',
//                 fontWeight: 700,
//                 padding: 0,
//                 lineHeight: 1,
//               }}
//               aria-label="Close dialog"
//             >
//               ×
//             </button>
//             <div style={{ fontWeight: 700, marginBottom: 16, fontSize: '1.1rem', letterSpacing: 0.5 }}>
//               {dialogText === newSummary?.allText ? 'Full Streamed Text' : 'Mermaid Syntax'}
//             </div>
//             <textarea
//               value={dialogText}
//               onChange={e => setDialogText(e.target.value)}
//               style={{
//                 background: '#f8f8f8',
//                 color: '#111',
//                 borderRadius: 8,
//                 padding: '1rem',
//                 overflow: 'auto',
//                 fontFamily: 'monospace',
//                 fontSize: '0.97rem',
//                 margin: 0,
//                 boxSizing: 'border-box',
//                 whiteSpace: 'pre-wrap',
//                 flex: 1,
//                 border: '1.5px solid #111',
//                 width: '100%',
//                 minHeight: 200,
//                 resize: 'vertical',
//                 outline: 'none',
//                 transition: 'border 0.2s',
//               }}
//               aria-label="Edit Mermaid Syntax"
//               spellCheck={false}
//             />
//           </div>
//         </div>,
//         document.body
//       )}

//       <pre
//         className="bg-gray-800 text-white p-4 rounded font-mono whitespace-pre-wrap overflow-auto"
//         style={{
//           opacity: data.isVisible ? 1 : 0,
//           transition: 'opacity 500ms cubic-bezier(0.4, 0, 0.2, 1)',
//           margin: '2rem 0 1.5rem 0',
//           fontFamily: 'monospace',
//           fontSize: '0.95rem',
//           boxSizing: 'border-box',
//           width: '100%',
//           maxWidth: 1200,
//           border: 'none',
//         }}
//       >
//         <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 8 }}>
//           Creating plan sketch
//         </div>
//         <div style={{ color: '#bdbdbd', fontWeight: 400, fontSize: '0.95rem', marginBottom: '8px' }}>
//           {/* Option to open dialog */}
//           <button
//             onClick={() => {
//               setDialogOpen(true);
//               setDialogText(newSummary?.allText || '');
//             }}
//             style={{
//               background: '#fff',
//               color: '#111',
//               border: '1.5px solid #111',
//               borderRadius: 6,
//               padding: '4px 14px',
//               fontWeight: 500,
//               fontSize: '0.95rem',
//               cursor: 'pointer',
//               marginBottom: 2,
//               marginRight: 8,
//               transition: 'background 0.15s, color 0.15s',
//               outline: 'none',
//               boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
//             }}
//           >
//             Show Full Text
//           </button>
//           {/* Option to open dialog */}
//           <button
//             onClick={() => {
//               setDialogOpen(true);
//               setDialogText(newSummary?.mermaidMarkdown || '');
//             }}
//             style={{
//               background: '#fff',
//               color: '#111',
//               border: '1.5px solid #111',
//               borderRadius: 6,
//               padding: '4px 14px',
//               fontWeight: 500,
//               fontSize: '0.95rem',
//               cursor: 'pointer',
//               marginBottom: 2,
//               marginRight: 8,
//               transition: 'background 0.15s, color 0.15s',
//               outline: 'none',
//               boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
//             }}
//           >
//             Show Chart syntax
//           </button>
//           {streamSummary || 'Processing...'}
//         </div>
        
//         {newSummary && (
//           <div style={{ color: '#f0f0f0', marginTop: '12px' }}>
//             {/* Display thinking section */}
//             {newSummary.thinking && newSummary.thinking.length > 0 && (
//               <div style={{ marginBottom: '10px' }}>
//                 <div style={{ fontWeight: 600, color: '#9e9e9e', marginBottom: '4px' }}>Thoughts:</div>
//                 {newSummary.thinking.map((thought, index) => (
//                   <div key={index} style={{ marginBottom: '4px', paddingLeft: '8px', borderLeft: '2px solid #555' }}>
//                     {thought.summary}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {/* Display drawing section if it exists */}
//             {newSummary.sketchSummary && (
//               <div style={{ marginTop: '10px' }}>
//                 <div style={{ fontWeight: 600, color: '#9e9e9e', marginBottom: '4px' }}>Project Timeline:</div>
//                 <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '12px', rowGap: '4px' }}>
//                   <span style={{ color: '#9e9e9e' }}>Start:</span>
//                   <span>{formatDate(newSummary.sketchSummary.startDate)}</span>
                  
//                   <span style={{ color: '#9e9e9e' }}>End:</span>
//                   <span>{formatDate(newSummary.sketchSummary.endDate)}</span>
                  
//                   <span style={{ color: '#9e9e9e' }}>Duration:</span>
//                   <span>{formatDuration(newSummary.sketchSummary.duration)}</span>
                  
//                   <span style={{ color: '#9e9e9e' }}>Tasks:</span>
//                   <span>{newSummary.sketchSummary.totalTasks}</span>
                  
//                   <span style={{ color: '#9e9e9e' }}>Milestones:</span>
//                   <span>{newSummary.sketchSummary.totalMilestones}</span>
//                 </div>
//               </div>
//             )}
//           </div>
//         )}
//       </pre>
//     </>
//   );
// };

// export default memo(Generate);
