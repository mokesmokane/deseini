// import React from 'react';
// import { Section, Timeline } from '../../contexts/DraftPlan/DraftPlanContextMermaid';

// interface MermaidGanttChartProps {
//   sections: Section[];
//   timeline: Timeline;
// }

// export const MermaidGanttChart: React.FC<MermaidGanttChartProps> = ({ 
//   sections, 
//   timeline 
// }) => {
//   // Helper function to format dates
//   const formatDate = (date: Date | string | undefined): string => {
//     if (!date) return 'Not set';
    
//     const dateObj = typeof date === 'string' ? new Date(date) : date;
//     return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
//   };

//   if (!sections.length || !timeline) {
//     return (
//       <div className="p-6 bg-white border border-gray-200 rounded-lg">
//         <p className="text-gray-500 text-center">No Gantt chart data available</p>
//       </div>
//     );
//   }

//   // Calculate the total duration in days for timeline scaling
//   const timelineDuration = Math.ceil(
//     (timeline.endDate.getTime() - timeline.startDate.getTime()) / (1000 * 60 * 60 * 24)
//   );
  
//   return (
//     <div className="w-full overflow-x-auto">
//       <div className="p-6 bg-white border border-gray-200 rounded-lg">
//         <h3 className="text-lg font-medium mb-4">Gantt Chart</h3>
        
//         {/* Timeline header */}
//         <div className="mb-2 flex items-center">
//           <div className="w-40 flex-shrink-0 font-medium">Timeline:</div>
//           <div className="flex-1 text-sm">
//             {formatDate(timeline.startDate)} to {formatDate(timeline.endDate)} ({timelineDuration} days)
//           </div>
//         </div>
        
//         {/* Gantt Chart Visualization */}
//         <div className="mt-6 space-y-6">
//           {sections.map((section, sIndex) => (
//             <div key={`section-${sIndex}`} className="mb-6">
//               <h4 className="text-md font-medium mb-2 border-b pb-1">{section.name}</h4>
              
//               <div className="space-y-2">
//                 {section.tasks.map((task, tIndex) => {
//                   const startDate = task.startDate || new Date();
//                   const taskStartOffset = Math.max(0, Math.floor(
//                     (startDate.getTime() - timeline.startDate.getTime()) / (1000 * 60 * 60 * 24)
//                   ));
                  
//                   // For milestones, we just need a position marker
//                   if (task.type === 'milestone') {
//                     const milestoneDate = task.startDate;  
//                     if (!milestoneDate) return null;
                    
//                     const milestoneOffset = Math.floor(
//                       (milestoneDate.getTime() - timeline.startDate.getTime()) / (1000 * 60 * 60 * 24)
//                     );
//                     const milestonePosition = (milestoneOffset / timelineDuration) * 100;
                    
//                     return (
//                       <div key={`task-${tIndex}`} className="flex items-center h-8 my-3">
//                         <div className="w-40 flex-shrink-0 text-sm truncate" title={task.label}>
//                           {task.label}
//                         </div>
//                         <div className="flex-1 relative h-full">
//                           {/* Timeline */}
//                           <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 transform -translate-y-1/2"></div>
                          
//                           {/* Milestone diamond */}
//                           <div 
//                             className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
//                             style={{ left: `${milestonePosition}%` }}
//                           >
//                             <div className="w-4 h-4 bg-black transform rotate-45"></div>
//                             <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap">
//                               {formatDate(milestoneDate)}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   }
                  
//                   // Regular task bar
//                   const duration = task.duration || 1; // Default to 1 day if no duration
//                   const taskWidth = (duration / timelineDuration) * 100;
                  
//                   return (
//                     <div key={`task-${tIndex}`} className="flex items-center h-8 my-3">
//                       <div className="w-40 flex-shrink-0 text-sm truncate" title={task.label}>
//                         {task.label} <span className="text-xs text-gray-500">({task.id})</span>
//                       </div>
//                       <div className="flex-1 relative h-full">
//                         {/* Timeline */}
//                         <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200 transform -translate-y-1/2"></div>
                        
//                         {/* Task bar */}
//                         <div 
//                           className="absolute top-1/2 h-6 bg-black rounded transform -translate-y-1/2 flex items-center justify-center text-white text-xs"
//                           style={{ 
//                             left: `${(taskStartOffset / timelineDuration) * 100}%`,
//                             width: `${Math.max(taskWidth, 2)}%` // Ensure minimum width for visibility
//                           }}
//                           title={`${task.label} (${formatDate(task.startDate)} - ${duration} days)`}
//                         >
//                           {taskWidth > 8 ? `${duration}d` : ''}
//                         </div>
                        
//                         {/* Dependencies (if any) */}
//                         {task.dependencies && task.dependencies.length > 0 && (
//                           <div className="absolute bottom-full left-0 text-xs text-gray-500">
//                             after: {task.dependencies.join(', ')}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };
