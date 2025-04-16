// import { Task, Timeline } from '../contexts/DraftPlanContextMermaid';

// /**
//  * Calculate timeline (earliest start date and latest end date) from all sections and tasks (including milestones)
//  * @param sections All sections with tasks (including those of type 'milestone')
//  * @returns Timeline object with startDate and endDate
//  */
// export function calculateTimelineFromSections(tasks: Task[]): Timeline {
//   let earliestDate: Date | null = null;
//   let latestDate: Date | null = null;

//   tasks.forEach(task => {
//     // Skip invalid task objects
//     if (!task || typeof task !== 'object') {
//       return;
//     }
      
//       // Handle tasks - checking for task.type to exist first
//       if (task.type === undefined) {
//         return; // Skip tasks without a type
//       }
      
//       if (task.type === 'milestone') {
//         // For milestone-type tasks, use the date field or fall back to startDate
//         const milestoneDate = task.date ? new Date(task.date) : 
//                             task.startDate ? new Date(task.startDate) : null;
        
//         if (milestoneDate) {
//           if (!earliestDate || milestoneDate < earliestDate) {
//             earliestDate = milestoneDate;
//           }
//           if (!latestDate || milestoneDate > latestDate) {
//             latestDate = milestoneDate;
//           }
//         }
//       } else {
//         // For regular tasks
//         if (task.startDate && typeof task.startDate === 'string') {
//           const startDate = new Date(task.startDate);
//           if (!isNaN(startDate.getTime())) {
//             if (!earliestDate || startDate < earliestDate) {
//               earliestDate = startDate;
//             }
//           }
//         }

//         if (task.endDate && typeof task.endDate === 'string') {
//           const endDate = new Date(task.endDate);
//           if (!isNaN(endDate.getTime())) {
//             if (!latestDate || endDate > latestDate) {
//               latestDate = endDate;
//             }
//           }
//         } else if (task.startDate && task.duration && typeof task.startDate === 'string' && typeof task.duration === 'number') {
//           // Calculate end date from start date and duration
//           const startDate = new Date(task.startDate);
//           if (!isNaN(startDate.getTime())) {
//             const endDate = new Date(startDate);
//             endDate.setDate(endDate.getDate() + task.duration);
            
//             if (!latestDate || endDate > latestDate) {
//               latestDate = endDate;
//             }
//           }
//         }
//       }
//   });

//   // Use default dates if no data is found
//   if (!earliestDate || !latestDate) {
//     const today = new Date();
//     return {
//       startDate: today,
//       endDate: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
//     };
//   }

//   // If earliest and latest are the same, extend end date by 1 month
//   // Since we've checked earliestDate and latestDate are not null above, we can safely assert they are Date objects
//   if ((earliestDate as Date).getTime() === (latestDate as Date).getTime()) {
//     const newLatestDate = new Date(latestDate);
//     newLatestDate.setMonth(newLatestDate.getMonth() + 1);
//     latestDate = newLatestDate;
//   }

//   return {
//     startDate: earliestDate,
//     endDate: latestDate
//   };
// }

// /**
//  * Unit test for calculateTimelineFromSections:
//  * 
//  * import { calculateTimelineFromSections } from '../timelineCalculation';
//  * 
//  * describe('calculateTimelineFromSections', () => {
//  *   test('should calculate timeline with both regular tasks and milestones', () => {
//  *     const sections = [
//  *       {
//  *         name: 'Test Section',
//  *         tasks: [
//  *           {
//  *             id: 'task1',
//  *             type: 'task',
//  *             label: 'Task 1',
//  *             startDate: new Date('2023-01-01'),
//  *             duration: 10
//  *           },
//  *           {
//  *             id: 'milestone1',
//  *             type: 'milestone',
//  *             label: 'Milestone 1',
//  *             startDate: new Date('2023-01-20'),
//  *             date: new Date('2023-01-20')
//  *           }
//  *         ]
//  *       }
//  *     ];
//  *     
//  *     const result = calculateTimelineFromSections(sections);
//  *     
//  *     expect(result.startDate).toEqual(new Date('2023-01-01'));
//  *     expect(result.endDate).toEqual(new Date('2023-01-20'));
//  *   });
//  * });
//  */
