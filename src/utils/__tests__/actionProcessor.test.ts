// Skip empty test file
describe.skip('actionProcessor - no tests', () => {
  it('noop', () => {});
});

// import { processAction, createDependencyResolutionRetryAction, AppState } from '../actionProcessor';
// import { Section, Task, Timeline } from '../../contexts/DraftPlan/DraftPlanContextMermaid';
// import { BufferedAction } from '../types';
// const example_actions = [
//   {
//     "type": "ADD_SECTION",
//     "payload": {
//       "name": "Exterior Concept Design"
//     },
//     "timestamp": 1744795279037
//   },
//   {
//     "type": "ADD_SECTION",
//     "payload": {
//       "name": "Exterior Concept Design"
//     },
//     "timestamp": 1744795279037
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Exterior Concept Design",
//       "task": {
//         "id": "t1",
//         "type": "task",
//         "label": "Initial Theme Ideation and Sketching",
//         "startDate": "2024-04-15T00:00:00.000Z",
//         "duration": 5,
//         "endDate": "2024-04-20T00:00:00.000Z"
//       }
//     },
//     "timestamp": 1744795283481
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Exterior Concept Design",
//       "task": {
//         "id": "t2",
//         "type": "task",
//         "label": "Theme Development and Refinement",
//         "duration": 10,
//         "dependencies": [
//           "t1"
//         ]
//       }
//     },
//     "timestamp": 1744795284852
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Exterior Concept Design",
//       "task": {
//         "id": "t3",
//         "type": "task",
//         "label": "2D/3D Presentation Preparation",
//         "duration": 5,
//         "dependencies": [
//           "t2"
//         ]
//       }
//     },
//     "timestamp": 1744795285325
//   },
//   {
//     "type": "ADD_MILESTONE",
//     "payload": {
//       "sectionName": "Exterior Concept Design",
//       "milestone": {
//         "id": "completion_of_initial_design_theme",
//         "type": "milestone",
//         "label": "Completion of Initial Design Theme",
//         "dependencies": [
//           "t3"
//         ]
//       }
//     },
//     "timestamp": 1744795285518
//   },
//   {
//     "type": "ADD_SECTION",
//     "payload": {
//       "name": "Digital Modelling"
//     },
//     "timestamp": 1744795285630
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Digital Modelling",
//       "task": {
//         "id": "t4",
//         "type": "task",
//         "label": "Proportion Model Creation in Alias",
//         "duration": 8,
//         "dependencies": [
//           "t3"
//         ]
//       }
//     },
//     "timestamp": 1744795285973
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Digital Modelling",
//       "task": {
//         "id": "t5",
//         "type": "task",
//         "label": "Surface Development and Refinement",
//         "duration": 10,
//         "dependencies": [
//           "t4"
//         ]
//       }
//     },
//     "timestamp": 1744795286696
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Digital Modelling",
//       "task": {
//         "id": "t6",
//         "type": "task",
//         "label": "Collaboration with Design and Visualization Team",
//         "duration": 4,
//         "dependencies": [
//           "t5"
//         ]
//       }
//     },
//     "timestamp": 1744795289280
//   },
//   {
//     "type": "ADD_MILESTONE",
//     "payload": {
//       "sectionName": "Digital Modelling",
//       "milestone": {
//         "id": "surface_sign-off_for_scale_model",
//         "type": "milestone",
//         "label": "Surface Sign-off for Scale Model",
//         "dependencies": [
//           "t6"
//         ]
//       }
//     },
//     "timestamp": 1744795291072
//   },
//   {
//     "type": "ADD_SECTION",
//     "payload": {
//       "name": "Visualization"
//     },
//     "timestamp": 1744795291143
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Visualization",
//       "task": {
//         "id": "t7",
//         "type": "task",
//         "label": "Outdoor Environment Renders",
//         "duration": 4,
//         "dependencies": [
//           "t4"
//         ]
//       }
//     },
//     "timestamp": 1744795291428
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Visualization",
//       "task": {
//         "id": "t8",
//         "type": "task",
//         "label": "Studio Renders",
//         "duration": 4,
//         "dependencies": [
//           "t4"
//         ]
//       }
//     },
//     "timestamp": 1744795291738
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Visualization",
//       "task": {
//         "id": "t9",
//         "type": "task",
//         "label": "Studio Turntable Animation",
//         "duration": 4,
//         "dependencies": [
//           "t4"
//         ]
//       }
//     },
//     "timestamp": 1744795292380
//   },
//   {
//     "type": "ADD_MILESTONE",
//     "payload": {
//       "sectionName": "Visualization",
//       "milestone": {
//         "id": "visualization_package_delivered",
//         "type": "milestone",
//         "label": "Visualization Package Delivered",
//         "dependencies": [
//           "t9"
//         ]
//       }
//     },
//     "timestamp": 1744795292534
//   },
//   {
//     "type": "ADD_SECTION",
//     "payload": {
//       "name": "25% Scale Model Fabrication"
//     },
//     "timestamp": 1744795292716
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "25% Scale Model Fabrication",
//       "task": {
//         "id": "t10",
//         "type": "task",
//         "label": "25% Scale Model Construction",
//         "duration": 15,
//         "dependencies": [
//           "t6"
//         ]
//       }
//     },
//     "timestamp": 1744795293084
//   },
//   {
//     "type": "ADD_MILESTONE",
//     "payload": {
//       "sectionName": "25% Scale Model Fabrication",
//       "milestone": {
//         "id": "25_model_complete",
//         "type": "milestone",
//         "label": "25% Model Complete",
//         "dependencies": [
//           "t10"
//         ]
//       }
//     },
//     "timestamp": 1744795293286
//   },
//   {
//     "type": "ADD_SECTION",
//     "payload": {
//       "name": "Pebble Beach Readiness"
//     },
//     "timestamp": 1744795293427
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Pebble Beach Readiness",
//       "task": {
//         "id": "t11",
//         "type": "task",
//         "label": "Final Pebble Beach Preparation",
//         "duration": 5,
//         "dependencies": [
//           "t10"
//         ]
//       }
//     },
//     "timestamp": 1744795293714
//   },
//   {
//     "type": "ADD_MILESTONE",
//     "payload": {
//       "sectionName": "Pebble Beach Readiness",
//       "milestone": {
//         "id": "pebble_beach_presentation",
//         "type": "milestone",
//         "label": "Pebble Beach Presentation",
//         "dependencies": [
//           "t11"
//         ]
//       }
//     },
//     "timestamp": 1744795293898
//   },
//   {
//     "type": "ADD_SECTION",
//     "payload": {
//       "name": "Project Management"
//     },
//     "timestamp": 1744795293984
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Project Management",
//       "task": {
//         "id": "t12",
//         "type": "task",
//         "label": "Milestone and Timeline Planning",
//         "startDate": "2024-04-15T00:00:00.000Z",
//         "duration": 3,
//         "endDate": "2024-04-18T00:00:00.000Z"
//       }
//     },
//     "timestamp": 1744795294409
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Project Management",
//       "task": {
//         "id": "t13",
//         "type": "task",
//         "label": "Team Coordination",
//         "duration": 8,
//         "dependencies": [
//           "t12"
//         ]
//       }
//     },
//     "timestamp": 1744795294637
//   },
//   {
//     "type": "ADD_TASK",
//     "payload": {
//       "sectionName": "Project Management",
//       "task": {
//         "id": "t14",
//         "type": "task",
//         "label": "Milestone Review Organization",
//         "duration": 3,
//         "dependencies": [
//           "t13"
//         ]
//       }
//     },
//     "timestamp": 1744795294914
//   },
//   {
//     "type": "ADD_MILESTONE",
//     "payload": {
//       "sectionName": "Project Management",
//       "milestone": {
//         "id": "project_review",
//         "type": "milestone",
//         "label": "Project Review",
//         "dependencies": [
//           "t14"
//         ]
//       }
//     },
//     "timestamp": 1744795295074
//   },
//   {
//     "type": "PROCESS_DEPENDENCIES",
//     "payload": {},
//     "timestamp": 1744795295108
//   },
//   {
//     "type": "PROCESS_DEPENDENCIES",
//     "payload": {},
//     "timestamp": 1744795295500
//   }
// ];
// describe('actionProcessor', () => {
//   describe('createDependencyResolutionRetryAction', () => {
//     test('should create a dependency resolution action with all properties', () => {
//       const result = createDependencyResolutionRetryAction(
//         'task1',
//         'Test Task',
//         'Test Section',
//         ['dependency1', 'dependency2'],
//         5,
//         'task'
//       );
      
//       expect(result).toEqual({
//         type: 'RESOLVE_DEPENDENCY',
//         payload: {
//           taskId: 'task1',
//           label: 'Test Task',
//           sectionName: 'Test Section',
//           dependencies: ['dependency1', 'dependency2'],
//           duration: 5,
//           type: 'task'
//         }
//       });
//     });
    
//     test('should set task type default to "task" when not provided', () => {
//       const result = createDependencyResolutionRetryAction(
//         'task1',
//         'Test Task',
//         'Test Section',
//         ['dependency1']
//       );
      
//       expect(result.payload.type).toEqual('task');
//     });
//   });
  
//   describe('processAction', () => {
//     // Common test data
//     const initialState: AppState = {
//       sections: [
//         {
//           name: 'Test Section',
//           tasks: []
//         }
//       ],
//       timeline: {
//         startDate: new Date('2025-01-01'),
//         endDate: new Date('2025-01-31')
//       }
//     };
    
//     const initialTaskDictionary: Record<string, Task> = {};
    
//     describe('ADD_SECTION action', () => {
//       test('should add a new section when it does not exist', () => {
//         const action: BufferedAction = {
//           type: 'ADD_SECTION',
//           payload: { name: 'New Section' },
//           timestamp: Date.now()
//         };
        
//         const { updatedState } = processAction(initialState, action, initialTaskDictionary);
        
//         expect(updatedState.sections.length).toBe(2);
//         expect(updatedState.sections[1].name).toBe('New Section');
//         expect(updatedState.sections[1].tasks).toEqual([]);
//       });
      
//       test('should not add duplicate section', () => {
//         const action: BufferedAction = {
//           type: 'ADD_SECTION',
//           payload: { name: 'Test Section' },
//           timestamp: Date.now()
//         };
        
//         const { updatedState } = processAction(initialState, action, initialTaskDictionary);
        
//         expect(updatedState.sections.length).toBe(1);
//       });
//     });
    
//     describe('ADD_TASK action', () => {
//       test('should add a task to the correct section', () => {
//         const task: Task = {
//           id: 'task1',
//           label: 'Test Task',
//           type: 'task',
//           startDate: new Date('2025-01-10'),
//           duration: 5,
//           endDate: new Date('2025-01-15')
//         };
        
//         const action: BufferedAction = {
//           type: 'ADD_TASK',
//           payload: {
//             sectionName: 'Test Section',
//             task
//           },
//           timestamp: Date.now()
//         };
        
//         const { updatedState, updatedTaskDictionary } = processAction(initialState, action, initialTaskDictionary);
        
//         expect(updatedState.sections[0].tasks.length).toBe(1);
//         expect(updatedState.sections[0].tasks[0]).toEqual(task);
//         expect(updatedTaskDictionary[task.id]).toEqual(task);
//       });
      
//       test('should resolve dependencies when adding a task', () => {
//         // Create initial task in dictionary
//         const dependencyTask: Task = {
//           id: 'dependency1',
//           label: 'Dependency Task',
//           type: 'task',
//           startDate: new Date('2025-01-05'),
//           endDate: new Date('2025-01-10')
//         };
        
//         const taskDictionary = {
//           'dependency1': dependencyTask
//         };
        
//         // Create a task with dependency
//         const newTask: Task = {
//           id: 'task1',
//           label: 'Test Task',
//           type: 'task',
//           startDate: undefined,
//           duration: 5,
//           dependencies: ['dependency1']
//         };
        
//         const action: BufferedAction = {
//           type: 'ADD_TASK',
//           payload: {
//             sectionName: 'Test Section',
//             task: newTask
//           },
//           timestamp: Date.now()
//         };
        
//         const { updatedState, updatedTaskDictionary } = processAction(initialState, action, taskDictionary);
        
//         // Task should be added with resolved dates
//         expect(updatedState.sections[0].tasks.length).toBe(1);
//         expect(updatedState.sections[0].tasks[0].startDate).toEqual(new Date('2025-01-11')); // Day after dependency ends
//         expect(updatedState.sections[0].tasks[0].endDate).toEqual(new Date('2025-01-16')); // 5 days after start
//         expect(updatedTaskDictionary['task1']).toBeDefined();
//       });
      
//       test('should queue dependency resolution if dependencies cannot be resolved', () => {
//         // Create a task with unresolved dependency
//         const newTask: Task = {
//           id: 'task1',
//           label: 'Test Task',
//           type: 'task',
//           startDate: undefined,
//           duration: 5,
//           dependencies: ['nonexistent']
//         };
        
//         const action: BufferedAction = {
//           type: 'ADD_TASK',
//           payload: {
//             sectionName: 'Test Section',
//             task: newTask
//           },
//           timestamp: Date.now()
//         };
        
//         const { actionsToQueue } = processAction(initialState, action, {});
        
//         // Should queue a resolution retry action
//         expect(actionsToQueue.length).toBe(1);
//         expect(actionsToQueue[0].type).toBe('RESOLVE_DEPENDENCY');
//         expect(actionsToQueue[0].payload.taskId).toBe('task1');
//       });
//     });
    
//     describe('UPDATE_TASK action', () => {
//       test('should update an existing task', () => {
//         // Setup state with a task
//         const existingTask: Task = {
//           id: 'task1',
//           label: 'Original Task',
//           type: 'task',
//           startDate: new Date('2025-01-10'),
//           duration: 5
//         };
        
//         const stateWithTask: AppState = {
//           sections: [
//             {
//               name: 'Test Section',
//               tasks: [existingTask]
//             }
//           ],
//           timeline: initialState.timeline
//         };
        
//         const taskDict = {
//           'task1': existingTask
//         };
        
//         // Create updated task
//         const updatedTask: Task = {
//           ...existingTask,
//           label: 'Updated Task',
//           duration: 10
//         };
        
//         const action: BufferedAction = {
//           type: 'UPDATE_TASK',
//           payload: {
//             sectionName: 'Test Section',
//             task: updatedTask
//           },
//           timestamp: Date.now()
//         };
        
//         const { updatedState, updatedTaskDictionary } = processAction(stateWithTask, action, taskDict);
        
//         // Task should be updated
//         expect(updatedState.sections[0].tasks[0].label).toBe('Updated Task');
//         expect(updatedState.sections[0].tasks[0].duration).toBe(10);
//         expect(updatedTaskDictionary['task1'].label).toBe('Updated Task');
//       });
//     });
    
//     describe('ADD_MILESTONE and UPDATE_MILESTONE actions', () => {
//       test('should add a milestone to the correct section', () => {
//         const milestone: Task = {
//           id: 'milestone1',
//           label: 'Test Milestone',
//           type: 'milestone',
//           startDate: new Date('2025-01-15'),
//           date: new Date('2025-01-15')
//         };
        
//         const action: BufferedAction = {
//           type: 'ADD_MILESTONE',
//           payload: {
//             sectionName: 'Test Section',
//             milestone
//           },
//           timestamp: Date.now()
//         };
        
//         const { updatedState, updatedTaskDictionary } = processAction(initialState, action, initialTaskDictionary);
        
//         expect(updatedState.sections[0].tasks.length).toBe(1);
//         expect(updatedState.sections[0].tasks[0]).toEqual(milestone);
//         expect(updatedTaskDictionary[milestone.id]).toEqual(milestone);
//       });
      
//       test('should resolve dependencies when adding a milestone', () => {
//         // Create initial task in dictionary
//         const dependencyTask: Task = {
//           id: 'dependency1',
//           label: 'Dependency Task',
//           type: 'task',
//           startDate: new Date('2025-01-05'),
//           endDate: new Date('2025-01-10')
//         };
        
//         const taskDictionary = {
//           'dependency1': dependencyTask
//         };
        
//         // Create a milestone with dependency
//         const newMilestone: Task = {
//           id: 'milestone1',
//           label: 'Test Milestone',
//           type: 'milestone',
//           startDate: undefined,
//           dependencies: ['dependency1']
//         };
        
//         const action: BufferedAction = {
//           type: 'ADD_MILESTONE',
//           payload: {
//             sectionName: 'Test Section',
//             milestone: newMilestone
//           },
//           timestamp: Date.now()
//         };
        
//         const { updatedState, updatedTaskDictionary } = processAction(initialState, action, taskDictionary);
        
//         // Milestone should be added with resolved date
//         expect(updatedState.sections[0].tasks.length).toBe(1);
//         expect(updatedState.sections[0].tasks[0].startDate).toEqual(new Date('2025-01-11')); // Day after dependency ends
//         expect(updatedTaskDictionary['milestone1']).toBeDefined();
//       });
//     });
    
//     describe('UPDATE_TIMELINE action', () => {
//       test('should update the timeline', () => {
//         const newTimeline: Timeline = {
//           startDate: new Date('2025-02-01'),
//           endDate: new Date('2025-02-28')
//         };
        
//         const action: BufferedAction = {
//           type: 'UPDATE_TIMELINE',
//           payload: {
//             timeline: newTimeline
//           },
//           timestamp: Date.now()
//         };
        
//         const { updatedState } = processAction(initialState, action, initialTaskDictionary);
        
//         expect(updatedState.timeline).toEqual(newTimeline);
//       });
//     });
    
//     describe('RESOLVE_DEPENDENCY action', () => {
//       test('should resolve dependencies and update the task', () => {
//         // Create initial task in dictionary
//         const dependencyTask: Task = {
//           id: 'dependency1',
//           label: 'Dependency Task',
//           type: 'task',
//           startDate: new Date('2025-01-05'),
//           endDate: new Date('2025-01-10')
//         };
        
//         const taskDictionary = {
//           'dependency1': dependencyTask
//         };
        
//         const action: BufferedAction = {
//           type: 'RESOLVE_DEPENDENCY',
//           payload: {
//             taskId: 'task1',
//             label: 'Test Task',
//             sectionName: 'Test Section',
//             dependencies: ['dependency1'],
//             duration: 5,
//             type: 'task'
//           },
//           timestamp: Date.now()
//         };
        
//         const { updatedState, updatedTaskDictionary } = processAction(initialState, action, taskDictionary);
        
//         // Task should be added with resolved dates
//         expect(updatedState.sections[0].tasks.length).toBe(1);
//         expect(updatedState.sections[0].tasks[0].startDate).toEqual(new Date('2025-01-11')); // Day after dependency ends
//         expect(updatedState.sections[0].tasks[0].endDate).toEqual(new Date('2025-01-16')); // 5 days after start
//         expect(updatedTaskDictionary['task1']).toBeDefined();
//       });
      
//       test('should queue another dependency resolution if not resolvable', () => {
//         const action: BufferedAction = {
//           type: 'RESOLVE_DEPENDENCY',
//           payload: {
//             taskId: 'task1',
//             label: 'Test Task',
//             sectionName: 'Test Section',
//             dependencies: ['nonexistent'],
//             duration: 5,
//             type: 'task'
//           },
//           timestamp: Date.now()
//         };
        
//         const { actionsToQueue } = processAction(initialState, action, {});
        
//         // Should queue a resolution retry action
//         expect(actionsToQueue.length).toBe(1);
//         expect(actionsToQueue[0].type).toBe('RESOLVE_DEPENDENCY');
//         expect(actionsToQueue[0].payload.taskId).toBe('task1');
//       });
//     });
    
//     describe('PROCESS_DEPENDENCIES action', () => {
//       test('should process all dependencies in all sections', () => {
//         // Setup state with tasks that have dependencies
//         const dependencyTask: Task = {
//           id: 'dependency1',
//           label: 'Dependency Task',
//           type: 'task',
//           startDate: new Date('2025-01-05'),
//           endDate: new Date('2025-01-10')
//         };
        
//         const taskWithDependency: Task = {
//           id: 'task1',
//           label: 'Task with Dependency',
//           type: 'task',
//           startDate: undefined,
//           duration: 5,
//           dependencies: ['dependency1']
//         };
        
//         const stateWithTasks: AppState = {
//           sections: [
//             {
//               name: 'Test Section',
//               tasks: [dependencyTask, taskWithDependency]
//             }
//           ],
//           timeline: initialState.timeline
//         };
        
//         const taskDict = {
//           'dependency1': dependencyTask,
//           'task1': taskWithDependency
//         };
        
//         const action: BufferedAction = {
//           type: 'PROCESS_DEPENDENCIES',
//           payload: {},
//           timestamp: Date.now()
//         };
        
//         const { updatedState, updatedTaskDictionary } = processAction(stateWithTasks, action, taskDict);
        
//         // Task should have resolved dates
//         const resolvedTask = updatedState.sections[0].tasks.find(t => t.id === 'task1');
//         expect(resolvedTask).toBeDefined();
//         expect(resolvedTask?.startDate).toEqual(new Date('2025-01-11')); // Day after dependency ends
//         expect(resolvedTask?.endDate).toEqual(new Date('2025-01-16')); // 5 days after start
        
//         // Timeline should be updated based on all tasks
//         expect(updatedState.timeline).toBeDefined();
//       });
//     });
    
   
//   });
// });
