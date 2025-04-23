// import React, { useState } from 'react';
// import { ChartSelector } from './ChartSelector';

// type SidebarSection = 'charts' | 'settings' | 'help' | null;

// export const SidebarChartManager: React.FC = () => {
//   const [expandedSection, setExpandedSection] = useState<SidebarSection>(null);
  
//   const toggleSection = (section: SidebarSection) => {
//     if (expandedSection === section) {
//       setExpandedSection(null);
//     } else {
//       setExpandedSection(section);
//     }
//   };
  
//   return (
//     <div className="fixed left-0 top-0 h-full flex z-10">
//       {/* Icons sidebar */}
//       <div className="w-16 h-full bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-6">
//         <button 
//           className={`p-3 rounded-full shadow-sm text-xl transition-all ${
//             expandedSection === 'charts' 
//               ? 'bg-blue-50 text-blue-600 shadow-md' 
//               : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
//           }`}
//           onClick={() => toggleSection('charts')}
//           title="Database"
//           aria-label="Toggle Database Panel"
//         >
//           <span className="material-icons-style">
//             <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor">
//               <path d="M480-120q-151 0-255.5-46.5T120-280v-400q0-66 104.5-113T480-840q151 0 255.5 47T840-680v400q0 67-104.5 113.5T480-120Zm0-479q89 0 179-25.5T760-679q-11-29-100.5-55T480-760q-91 0-178.5 24.5T200-680q11 31 98.5 56T480-599Zm0 199q42 0 81-4t74.5-11.5q35.5-7.5 65-18.5t39.5-25v-126q-11 8-39.5 18.5T635-548q-35.5 8-74.5 13t-81 5q-42 0-82-5t-75-13q-35-8-64-18.5T200-585v126q10 14 39.5 25t65 18.5q35.5 7.5 75 11.5t100.5 4Zm0 200q42 0 82-4.5t75-12.5q35-8 64-19t39-24v-126q-10 8-39 18.5T636-349q-35 8-75 13t-82 5q-43 0-81.5-5t-73.5-13q-35-8-64-18.5T200-386v126q10 13 39 24t64 19q35 8 74.5 12.5T480-200Z"/>
//             </svg>
//           </span>
//         </button>
//         <button 
//           className={`p-3 rounded-full shadow-sm text-xl transition-all ${
//             expandedSection === 'settings' 
//               ? 'bg-blue-50 text-blue-600 shadow-md' 
//               : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
//           }`}
//           onClick={() => toggleSection('settings')}
//           title="Settings"
//           aria-label="Toggle Settings Panel"
//         >
//           <span className="material-icons-style">
//             <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor">
//               <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm112-260q58 0 99-41t41-99q0-58-41-99t-99-41q-58 0-99 41t-41 99q0 58 41 99t99 41Z"/>
//             </svg>
//           </span>
//         </button>
//         <button 
//           className={`p-3 rounded-full shadow-sm text-xl transition-all ${
//             expandedSection === 'help' 
//               ? 'bg-blue-50 text-blue-600 shadow-md' 
//               : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
//           }`}
//           onClick={() => toggleSection('help')}
//           title="Help"
//           aria-label="Toggle Help Panel"
//         >
//           <span className="material-icons-style">
//             <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="currentColor">
//               <path d="M484-247q16 0 27-11t11-27q0-16-11-27t-27-11q-16 0-27 11t-11 27q0 16 11 27t27 11Zm-35-146h59q0-26 6.5-47.5T555-490q31-26 44-51t13-55q0-53-34.5-85T486-713q-49 0-86.5 24.5T345-621l53 20q11-28 33-43.5t52-15.5q34 0 55 18.5t21 47.5q0 22-13 41.5T508-512q-30 26-44.5 51.5T449-393Zm31 313q-82 0-155-31.5t-127.5-86Q143-252 111.5-325T80-480q0-83 31.5-156t86-127Q252-817 325-848.5T480-880q83 0 156 31.5t127 86q54 54 85.5 127T880-480q0 82-31.5 155T763-197.5q-54 54.5-127 86T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
//             </svg>
//           </span>
//         </button>
//       </div>
      
//       {/* Expanded content */}
//       {expandedSection && (
//         <div className="w-80 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out overflow-hidden">
//           <div className="p-4 h-full">
//             {expandedSection === 'charts' && (
//               <>
//                 <div className="flex items-center justify-between mb-4">
//                   <h2 className="text-xl font-medium text-gray-800">Chart Database</h2>
//                   <button 
//                     onClick={() => setExpandedSection(null)}
//                     className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
//                     aria-label="Close panel"
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
//                       <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
//                     </svg>
//                   </button>
//                 </div>
//                 <div className="overflow-y-auto h-[calc(100%-3rem)]">
//                   <ChartSelector isSidebar={true} />
//                 </div>
//               </>
//             )}
//             {expandedSection === 'settings' && (
//               <>
//                 <div className="flex items-center justify-between mb-4">
//                   <h2 className="text-xl font-medium text-gray-800">Settings</h2>
//                   <button 
//                     onClick={() => setExpandedSection(null)}
//                     className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
//                     aria-label="Close panel"
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
//                       <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
//                     </svg>
//                   </button>
//                 </div>
//                 <p className="text-gray-600">Chart settings will appear here.</p>
//               </>
//             )}
//             {expandedSection === 'help' && (
//               <>
//                 <div className="flex items-center justify-between mb-4">
//                   <h2 className="text-xl font-medium text-gray-800">Help</h2>
//                   <button 
//                     onClick={() => setExpandedSection(null)}
//                     className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
//                     aria-label="Close panel"
//                   >
//                     <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
//                       <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
//                     </svg>
//                   </button>
//                 </div>
//                 <p className="text-gray-600">Help information will appear here.</p>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
