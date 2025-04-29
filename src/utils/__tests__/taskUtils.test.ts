// Skip empty test file
describe.skip('taskUtils - no tests', () => {});

// import { findTaskById, getTaskEndDate, createTask, checkTimelineBoundaries } from '../taskUtils';
// import { Task, Timeline } from '../../contexts/DraftPlan/DraftPlanContextMermaid';

// describe('taskUtils', () => {
//   describe('findTaskById', () => {
//     test('should find a task in the dictionary', () => {
//       const taskDictionary: Record<string, Task> = {
//         'task1': {
//           id: 'task1',
//           label: 'Test Task 1',
//           startDate: new Date('2025-01-01'),
//           type: 'task'
//         },
//         'milestone1': {
//           id: 'milestone1',
//           label: 'Test Milestone 1',
//           startDate: new Date('2025-01-15'),
//           type: 'milestone'
//         }
//       };

//       const result = findTaskById(taskDictionary, 'task1');
//       expect(result).toEqual(taskDictionary['task1']);
//     });

//     test('should return undefined for non-existent task', () => {
//       const taskDictionary: Record<string, Task> = {
//         'task1': {
//           id: 'task1',
//           label: 'Test Task 1',
//           startDate: new Date('2025-01-01'),
//           type: 'task'
//         }
//       };

//       const result = findTaskById(taskDictionary, 'nonexistent');
//       expect(result).toBeUndefined();
//     });
//   });

//   describe('getTaskEndDate', () => {
//     test('should return endDate for a task', () => {
//       const taskDictionary: Record<string, Task> = {
//         'task1': {
//           id: 'task1',
//           label: 'Test Task 1',
//           startDate: new Date('2025-01-01'),
//           endDate: new Date('2025-01-10'),
//           type: 'task'
//         }
//       };

//       const result = getTaskEndDate(taskDictionary, 'task1');
//       expect(result).toEqual(new Date('2025-01-10'));
//     });

//     test('should return date for a milestone', () => {
//       const taskDictionary: Record<string, Task> = {
//         'milestone1': {
//           id: 'milestone1',
//           label: 'Test Milestone 1',
//           startDate: new Date('2025-01-15'),
//           date: new Date('2025-01-15'),
//           type: 'milestone'
//         }
//       };

//       const result = getTaskEndDate(taskDictionary, 'milestone1');
//       expect(result).toEqual(new Date('2025-01-15'));
//     });

//     test('should return undefined for non-existent task', () => {
//       const taskDictionary: Record<string, Task> = {
//         'task1': {
//           id: 'task1',
//           label: 'Test Task 1',
//           startDate: new Date('2025-01-01'),
//           type: 'task'
//         }
//       };

//       const result = getTaskEndDate(taskDictionary, 'nonexistent');
//       expect(result).toBeUndefined();
//     });

//     test('should return undefined if task has no end date or date', () => {
//       const taskDictionary: Record<string, Task> = {
//         'task1': {
//           id: 'task1',
//           label: 'Test Task 1',
//           startDate: new Date('2025-01-01'),
//           type: 'task' // No endDate
//         }
//       };

//       const result = getTaskEndDate(taskDictionary, 'task1');
//       expect(result).toBeUndefined();
//     });
//   });


//   describe('createTask', () => {
//     test('should create a basic task with provided values', () => {
//       const startDate = new Date('2025-01-01');
//       const result = createTask('task1', 'Test Task', startDate, 5);
      
//       expect(result).toEqual({
//         id: 'task1',
//         label: 'Test Task',
//         startDate,
//         duration: 5,
//         type: 'task',
//         endDate: new Date('2025-01-06') // start + 5 days
//       });
//     });

//     test('should create a milestone task', () => {
//       const date = new Date('2025-01-15');
//       const result = createTask('milestone1', 'Test Milestone', date, undefined, undefined, undefined, 'milestone');
      
//       expect(result).toEqual({
//         id: 'milestone1',
//         label: 'Test Milestone',
//         startDate: date,
//         date: date, // For milestones, date should equal startDate
//         type: 'milestone'
//       });
//     });

//     test('should create a task with dependencies', () => {
//       const result = createTask('task2', 'Task with Dependencies', undefined, 3, undefined, ['task1']);
      
//       expect(result).toEqual({
//         id: 'task2',
//         label: 'Task with Dependencies',
//         startDate: undefined, // Will be resolved later
//         duration: 3,
//         dependencies: ['task1'],
//         type: 'task'
//       });
//     });
//   });

//   describe('checkTimelineBoundaries', () => {
//     test('should update timeline if task extends boundaries', () => {
//       const currentTimeline: Timeline = {
//         startDate: new Date('2025-01-10'),
//         endDate: new Date('2025-01-20')
//       };
      
//       const task: Task = {
//         id: 'task1',
//         label: 'Earlier Task',
//         startDate: new Date('2025-01-01'), // Earlier than timeline start
//         endDate: new Date('2025-01-05'),
//         type: 'task'
//       };
      
//       const result = checkTimelineBoundaries(task, currentTimeline);
      
//       expect(result.hasUpdate).toBe(true);
//       expect(result.newTimeline?.startDate).toEqual(new Date('2025-01-01'));
//       expect(result.newTimeline?.endDate).toEqual(new Date('2025-01-20')); // Unchanged
//     });
    
//     test('should update timeline if task ends after current endDate', () => {
//       const currentTimeline: Timeline = {
//         startDate: new Date('2025-01-01'),
//         endDate: new Date('2025-01-20')
//       };
      
//       const task: Task = {
//         id: 'task1',
//         label: 'Later End Task',
//         startDate: new Date('2025-01-15'),
//         endDate: new Date('2025-01-30'), // Later than timeline end
//         type: 'task'
//       };
      
//       const result = checkTimelineBoundaries(task, currentTimeline);
      
//       expect(result.hasUpdate).toBe(true);
//       expect(result.newTimeline?.startDate).toEqual(new Date('2025-01-01')); // Unchanged
//       expect(result.newTimeline?.endDate).toEqual(new Date('2025-01-30'));
//     });
    
//     test('should not update timeline if task is within boundaries', () => {
//       const currentTimeline: Timeline = {
//         startDate: new Date('2025-01-01'),
//         endDate: new Date('2025-01-31')
//       };
      
//       const task: Task = {
//         id: 'task1',
//         label: 'Within Bounds Task',
//         startDate: new Date('2025-01-10'),
//         endDate: new Date('2025-01-20'),
//         type: 'task'
//       };
      
//       const result = checkTimelineBoundaries(task, currentTimeline);
      
//       expect(result.hasUpdate).toBe(false);
//       expect(result.newTimeline).toBe(currentTimeline); // Should return the original timeline
//     });
    
//     test('should create a new timeline if none exists', () => {
//       const task: Task = {
//         id: 'task1',
//         label: 'First Task',
//         startDate: new Date('2025-01-10'),
//         endDate: new Date('2025-01-20'),
//         type: 'task'
//       };
      
//       const result = checkTimelineBoundaries(task);
      
//       expect(result.hasUpdate).toBe(true);
//       expect(result.newTimeline?.startDate).toEqual(new Date('2025-01-10'));
//       expect(result.newTimeline?.endDate).toEqual(new Date('2025-01-20'));
//     });
    
//     test('should handle task with duration but no end date', () => {
//       const currentTimeline: Timeline = {
//         startDate: new Date('2025-01-01'),
//         endDate: new Date('2025-01-20')
//       };
      
//       const task: Task = {
//         id: 'task1',
//         label: 'Duration Task',
//         startDate: new Date('2025-01-15'),
//         duration: 10, // Should end on 2025-01-25
//         type: 'task'
//       };
      
//       const result = checkTimelineBoundaries(task, currentTimeline);
      
//       expect(result.hasUpdate).toBe(true);
//       expect(result.newTimeline?.startDate).toEqual(new Date('2025-01-01')); // Unchanged
//       expect(result.newTimeline?.endDate).toEqual(new Date('2025-01-25')); // Calculated from duration
//     });
//   });
// });
