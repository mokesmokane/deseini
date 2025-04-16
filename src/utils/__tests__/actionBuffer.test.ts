// import { 
//   isValidTimelineUpdate, 
//   addToActionBuffer, 
//   commitPendingTimelineUpdate,
//   BufferedAction
// } from '../actionBuffer';
// import { Timeline } from '../../contexts/DraftPlanContextMermaid';

// describe('actionBuffer', () => {
//   describe('isValidTimelineUpdate', () => {
//     test('should validate a valid timeline', () => {
//       const timeline: Timeline = {
//         startDate: new Date('2025-01-01'),
//         endDate: new Date('2025-01-31')
//       };
      
//       expect(isValidTimelineUpdate(timeline)).toBe(true);
//     });
    
//     test('should invalidate timeline missing startDate', () => {
//       const timeline = {
//         endDate: new Date('2025-01-31')
//       } as Timeline;
      
//       expect(isValidTimelineUpdate(timeline)).toBe(false);
//     });
    
//     test('should invalidate timeline missing endDate', () => {
//       const timeline = {
//         startDate: new Date('2025-01-01')
//       } as Timeline;
      
//       expect(isValidTimelineUpdate(timeline)).toBe(false);
//     });
    
//     test('should invalidate undefined timeline', () => {
//       expect(isValidTimelineUpdate(undefined)).toBe(false);
//     });
    
//     test('should invalidate empty timeline object', () => {
//       expect(isValidTimelineUpdate({} as Timeline)).toBe(false);
//     });
//   });
  
//   describe('addToActionBuffer', () => {
//     test('should add action to buffer', () => {
//       const actionBuffer: BufferedAction[] = [];
//       const pendingTimelineUpdate = {
//         hasUpdate: false,
//         newTimeline: undefined
//       };
      
//       const { updatedBuffer } = addToActionBuffer(
//         'ADD_SECTION',
//         { name: 'Phase 1' },
//         pendingTimelineUpdate,
//         actionBuffer
//       );
      
//       expect(updatedBuffer.length).toBe(1);
//       expect(updatedBuffer[0].type).toBe('ADD_SECTION');
//       expect(updatedBuffer[0].payload).toEqual({ name: 'Phase 1' });
//       expect(updatedBuffer[0].timestamp).toBeDefined();
//     });
    
//     test('should add pending timeline update when adding task', () => {
//       const actionBuffer: BufferedAction[] = [];
//       const timeline: Timeline = {
//         startDate: new Date('2025-01-01'),
//         endDate: new Date('2025-01-31')
//       };
      
//       const pendingTimelineUpdate = {
//         hasUpdate: true,
//         newTimeline: timeline
//       };
      
//       const { updatedBuffer } = addToActionBuffer(
//         'ADD_TASK',
//         { task: { id: 'task1' } },
//         pendingTimelineUpdate,
//         actionBuffer
//       );
      
//       expect(updatedBuffer.length).toBe(2);
//       expect(updatedBuffer[0].type).toBe('UPDATE_TIMELINE');
//       expect(updatedBuffer[0].payload.timeline).toEqual(timeline);
//       expect(updatedBuffer[1].type).toBe('ADD_TASK');
//     });
    
//     test('should skip invalid timeline updates', () => {
//       const actionBuffer: BufferedAction[] = [];
//       const pendingTimelineUpdate = {
//         hasUpdate: false,
//         newTimeline: undefined
//       };
      
//       // Try to add an invalid timeline update
//       const { updatedBuffer } = addToActionBuffer(
//         'UPDATE_TIMELINE',
//         { timeline: {} },
//         pendingTimelineUpdate,
//         actionBuffer
//       );
      
//       expect(updatedBuffer.length).toBe(0); // Should skip adding the invalid update
//     });
    
//     test('should not commit invalid pending timeline update', () => {
//       const actionBuffer: BufferedAction[] = [];
//       const pendingTimelineUpdate = {
//         hasUpdate: true,
//         newTimeline: {} as Timeline // Invalid timeline
//       };
      
//       const { updatedBuffer } = addToActionBuffer(
//         'ADD_TASK',
//         { task: { id: 'task1' } },
//         pendingTimelineUpdate,
//         actionBuffer
//       );
      
//       expect(updatedBuffer.length).toBe(1); // Only the task, not the timeline
//       expect(updatedBuffer[0].type).toBe('ADD_TASK');
//     });
//   });
  
//   describe('commitPendingTimelineUpdate', () => {
//     test('should commit a valid pending timeline update', () => {
//       const actionBuffer: BufferedAction[] = [];
//       const timeline: Timeline = {
//         startDate: new Date('2025-01-01'),
//         endDate: new Date('2025-01-31')
//       };
      
//       const pendingTimelineUpdate = {
//         hasUpdate: true,
//         newTimeline: timeline
//       };
      
//       const { updatedBuffer, updatedPendingTimelineUpdate } = commitPendingTimelineUpdate(
//         pendingTimelineUpdate,
//         actionBuffer
//       );
      
//       expect(updatedBuffer.length).toBe(1);
//       expect(updatedBuffer[0].type).toBe('UPDATE_TIMELINE');
//       expect(updatedBuffer[0].payload.timeline).toEqual(timeline);
      
//       // The pending update should be reset
//       expect(updatedPendingTimelineUpdate.hasUpdate).toBe(false);
//       expect(updatedPendingTimelineUpdate.newTimeline).toBeUndefined();
//     });
    
//     test('should not commit if no pending update', () => {
//       const actionBuffer: BufferedAction[] = [];
//       const pendingTimelineUpdate = {
//         hasUpdate: false,
//         newTimeline: undefined
//       };
      
//       const { updatedBuffer, updatedPendingTimelineUpdate } = commitPendingTimelineUpdate(
//         pendingTimelineUpdate,
//         actionBuffer
//       );
      
//       expect(updatedBuffer.length).toBe(0);
//       expect(updatedPendingTimelineUpdate.hasUpdate).toBe(false);
//     });
    
//     test('should not commit invalid timeline update', () => {
//       const actionBuffer: BufferedAction[] = [];
//       const pendingTimelineUpdate = {
//         hasUpdate: true,
//         newTimeline: {} as Timeline // Invalid timeline
//       };
      
//       const { updatedBuffer, updatedPendingTimelineUpdate } = commitPendingTimelineUpdate(
//         pendingTimelineUpdate,
//         actionBuffer
//       );
      
//       expect(updatedBuffer.length).toBe(0);
//       expect(updatedPendingTimelineUpdate.hasUpdate).toBe(false);
//     });
//   });
// });
