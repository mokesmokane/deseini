// Tests for dependency resolution in mermaid gantt parsing

import { resolveDependencies } from '../dependencyResolution';
import { Section } from '../../contexts/DraftPlanContextMermaid';

describe('dependency resolution', () => {
  test('should resolve direct dependencies', () => {
    // Create test sections with tasks
    const sections: Section[] = [
      {
        name: 'Test Section',
        tasks: [
          {
            id: 'task1',
            type: 'task',
            label: 'Task 1',
            startDate: new Date('2023-01-01'),
            duration: 10,
            endDate: new Date('2023-01-11')
          },
          {
            id: 'task2',
            type: 'task',
            label: 'Task 2',
            startDate: undefined,
            duration: 5,
            dependencies: ['task1']
          }
        ]
      }
    ];

    // Resolve dependencies
    const result = resolveDependencies(sections);

    // Check if task2 startDate is set to task1's endDate
    expect(result[0].tasks[1].startDate).toEqual(new Date('2023-01-11'));
    expect(result[0].tasks[1].endDate).toEqual(new Date('2023-01-16'));
  });

  test('should resolve chains of dependencies', () => {
    // Create test sections with chained tasks
    const sections: Section[] = [
      {
        name: 'Test Section',
        tasks: [
          {
            id: 'task1',
            type: 'task',
            label: 'Task 1',
            startDate: new Date('2023-01-01'),
            duration: 10,
            endDate: new Date('2023-01-11')
          },
          {
            id: 'task2',
            type: 'task',
            label: 'Task 2',
            startDate: undefined,
            duration: 5,
            dependencies: ['task1']
          },
          {
            id: 'task3',
            type: 'task',
            label: 'Task 3',
            startDate: undefined,
            duration: 3,
            dependencies: ['task2']
          }
        ]
      }
    ];

    // Resolve dependencies
    const result = resolveDependencies(sections);

    // Check if task2 startDate is set to task1's endDate
    expect(result[0].tasks[1].startDate).toEqual(new Date('2023-01-11'));
    expect(result[0].tasks[1].endDate).toEqual(new Date('2023-01-16'));

    // Check if task3 startDate is set to task2's endDate
    expect(result[0].tasks[2].startDate).toEqual(new Date('2023-01-16'));
    expect(result[0].tasks[2].endDate).toEqual(new Date('2023-01-19'));
  });

  test('should resolve cross-section dependencies', () => {
    // Create test sections with tasks in different sections
    const sections: Section[] = [
      {
        name: 'Section 1',
        tasks: [
          {
            id: 'task1',
            type: 'task',
            label: 'Task 1',
            startDate: new Date('2023-01-01'),
            duration: 10,
            endDate: new Date('2023-01-11')
          }
        ]
      },
      {
        name: 'Section 2',
        tasks: [
          {
            id: 'task2',
            type: 'task',
            label: 'Task 2',
            startDate: undefined,
            duration: 5,
            dependencies: ['task1']
          },
          {
            id: 'task3',
            type: 'task',
            label: 'Task 3',
            startDate: undefined,
            duration: 3,
            dependencies: ['task2']
          }
        ]
      }
    ];

    // Resolve dependencies
    const result = resolveDependencies(sections);

    // Check if task2 startDate is set to task1's endDate
    expect(result[1].tasks[0].startDate).toEqual(new Date('2023-01-11'));
    expect(result[1].tasks[0].endDate).toEqual(new Date('2023-01-16'));

    // Check if task3 startDate is set to task2's endDate
    expect(result[1].tasks[1].startDate).toEqual(new Date('2023-01-16'));
    expect(result[1].tasks[1].endDate).toEqual(new Date('2023-01-19'));
  });

  test('should resolve milestone dependencies', () => {
    // Create test sections with milestones and tasks
    const sections: Section[] = [
      {
        name: 'Test Section',
        tasks: [
          {
            id: 'task1',
            type: 'task',
            label: 'Task 1',
            startDate: new Date('2023-01-01'),
            duration: 10,
            endDate: new Date('2023-01-11')
          },
          {
            id: 'milestone1',
            type: 'milestone',
            label: 'Milestone 1',
            startDate: undefined,
            date: undefined,
            dependencies: ['task1']
          },
          {
            id: 'task2',
            type: 'task',
            label: 'Task 2',
            startDate: undefined,
            duration: 5,
            dependencies: ['milestone1']
          }
        ]
      }
    ];

    // Resolve dependencies
    const result = resolveDependencies(sections);

    // Check if milestone1 startDate and date are set to task1's endDate
    expect(result[0].tasks[1].startDate).toEqual(new Date('2023-01-11'));
    expect(result[0].tasks[1].date).toEqual(new Date('2023-01-11'));

    // Check if task2 startDate is set to milestone1's date
    expect(result[0].tasks[2].startDate).toEqual(new Date('2023-01-11'));
    expect(result[0].tasks[2].endDate).toEqual(new Date('2023-01-16'));
  });
});
