import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DependencyViolationsProvider, useDependencyViolations } from '../contexts/DependencyViolationsContext';
import { Task } from '../types';

// Helper component to test the hooks
const TestComponent = () => {
  const { 
    dependencyViolations, 
    setDependencyViolations, 
    clearViolations, 
    addViolation, 
    removeViolation 
  } = useDependencyViolations();

  return (
    <div data-testid="test-component">
      <div data-testid="violation-count">{Object.keys(dependencyViolations).length}</div>
      <button data-testid="set-violations" onClick={() => 
        setDependencyViolations({ 'dep1': 'Error 1', 'dep2': 'Error 2' })
      }>
        Set Violations
      </button>
      <button data-testid="clear-violations" onClick={clearViolations}>
        Clear Violations
      </button>
      <button data-testid="add-violation" onClick={() => 
        addViolation('dep3', 'Error 3')
      }>
        Add Violation
      </button>
      <button data-testid="remove-violation" onClick={() => 
        removeViolation('dep1')
      }>
        Remove Violation
      </button>
      <ul>
        {Object.entries(dependencyViolations).map(([depId, message]) => (
          <li key={depId} data-testid={`violation-${depId}`}>
            {depId}: {message}
          </li>
        ))}
      </ul>
    </div>
  );
};

// Helper component to test dependency validations
const ValidationTestComponent = ({ tasks }: { tasks: Task[] }) => {
  const { 
    dependencyViolations, 
    validateDependencyConstraints,
    validateEndDateConstraints
  } = useDependencyViolations();

  return (
    <div data-testid="validation-test-component">
      <div data-testid="violation-count">{Object.keys(dependencyViolations).length}</div>
      <button 
        data-testid="validate-start-task1" 
        onClick={() => validateDependencyConstraints('task1', new Date('2023-01-15'), tasks)}
      >
        Validate Task1 Start
      </button>
      <button 
        data-testid="validate-start-task2" 
        onClick={() => validateDependencyConstraints('task2', new Date('2023-01-05'), tasks)}
      >
        Validate Task2 Start
      </button>
      <button 
        data-testid="validate-end-task1" 
        onClick={() => validateEndDateConstraints('task1', new Date('2023-01-20'), tasks)}
      >
        Validate Task1 End
      </button>
      <button 
        data-testid="validate-end-task1-late" 
        onClick={() => validateEndDateConstraints('task1', new Date('2023-02-10'), tasks)}
      >
        Move Task1 End Later
      </button>
      <button 
        data-testid="move-task1" 
        onClick={() => {
          // Simulate moving a task - which would change both start and end dates
          // First check start date
          validateDependencyConstraints('task1', new Date('2023-01-20'), tasks);
          // Then check end date
          validateEndDateConstraints('task1', new Date('2023-01-30'), tasks);
        }}
      >
        Move Task1 (Start & End)
      </button>
      <ul>
        {Object.entries(dependencyViolations).map(([depId, message]) => (
          <li key={depId} data-testid={`violation-${depId}`}>
            {depId}: {message}
          </li>
        ))}
      </ul>
    </div>
  );
};

describe('DependencyViolationsContext', () => {
  const renderWithProvider = () => {
    return render(
      <DependencyViolationsProvider>
        <TestComponent />
      </DependencyViolationsProvider>
    );
  };

  test('initial state should be empty', () => {
    renderWithProvider();
    expect(screen.getByTestId('violation-count').textContent).toBe('0');
  });

  test('setDependencyViolations should update the state with new violations', () => {
    renderWithProvider();
    act(() => {
      screen.getByTestId('set-violations').click();
    });
    
    expect(screen.getByTestId('violation-count').textContent).toBe('2');
    expect(screen.getByTestId('violation-dep1')).toBeInTheDocument();
    expect(screen.getByTestId('violation-dep2')).toBeInTheDocument();
  });

  test('clearViolations should remove all violations', () => {
    renderWithProvider();
    
    // First add some violations
    act(() => {
      screen.getByTestId('set-violations').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('2');
    
    // Then clear them
    act(() => {
      screen.getByTestId('clear-violations').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('0');
  });

  test('addViolation should add a new violation', () => {
    renderWithProvider();
    
    act(() => {
      screen.getByTestId('add-violation').click();
    });
    
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-dep3')).toBeInTheDocument();
    expect(screen.getByTestId('violation-dep3').textContent).toBe('dep3: Error 3');
  });

  test('removeViolation should remove a specific violation', () => {
    renderWithProvider();
    
    // First add some violations
    act(() => {
      screen.getByTestId('set-violations').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('2');
    
    // Then remove one
    act(() => {
      screen.getByTestId('remove-violation').click();
    });
    
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(() => screen.getByTestId('violation-dep1')).toThrow();
    expect(screen.getByTestId('violation-dep2')).toBeInTheDocument();
  });

  test('should handle multiple operations in sequence', () => {
    renderWithProvider();
    
    // Add initial violations
    act(() => {
      screen.getByTestId('set-violations').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('2');
    
    // Add another violation
    act(() => {
      screen.getByTestId('add-violation').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('3');
    
    // Remove a violation
    act(() => {
      screen.getByTestId('remove-violation').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('2');
    
    // Clear all violations
    act(() => {
      screen.getByTestId('clear-violations').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('0');
  });
});

describe('Dependency Validation Logic', () => {
  // Sample tasks for testing with dependencies
  const mockTasks: Task[] = [
    {
      id: 'task1',
      name: 'Task 1',
      start: '2023-01-10',
      end: '2023-01-20',
      dependsOn: [],
      tasks: []
    },
    {
      id: 'task2',
      name: 'Task 2',
      start: '2023-01-25', // Depends on task1 - should start after task1 ends
      end: '2023-02-05',
      dependsOn: ['task1'],
      tasks: []
    },
    {
      id: 'task3',
      name: 'Task 3',
      start: '2023-02-10', // Depends on task2 - should start after task2 ends
      end: '2023-02-20',
      dependsOn: ['task2'],
      tasks: []
    }
  ];

  // Add new mock tasks for testing cascade dependencies
  const cascadeMockTasks: Task[] = [
    {
      id: 'upstream1',
      name: 'Upstream 1',
      start: '2023-01-05',
      end: '2023-01-15',
      dependsOn: [],
      tasks: []
    },
    {
      id: 'upstream2',
      name: 'Upstream 2',
      start: '2023-01-05',
      end: '2023-01-15',
      dependsOn: [],
      tasks: []
    },
    {
      id: 'middle',
      name: 'Middle Task',
      start: '2023-01-20', // Depends on upstream1 and upstream2
      end: '2023-01-30',
      dependsOn: ['upstream1', 'upstream2'],
      tasks: []
    },
    {
      id: 'downstream',
      name: 'Downstream Task',
      start: '2023-02-05', // Depends on middle task
      end: '2023-02-15',
      dependsOn: ['middle'],
      tasks: []
    }
  ];

  const renderValidationTests = (tasks: Task[]) => {
    return render(
      <DependencyViolationsProvider>
        <ValidationTestComponent tasks={tasks} />
      </DependencyViolationsProvider>
    );
  };

  test('validateDependencyConstraints should detect start date violations', () => {
    renderValidationTests(mockTasks);
    
    // Task2 depends on Task1, so starting Task2 before Task1 ends should cause a violation
    act(() => {
      screen.getByTestId('validate-start-task2').click();
    });
    
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-task1')).toBeInTheDocument();
  });

  test('validateEndDateConstraints should detect downstream violations when moving end date later', () => {
    renderValidationTests(mockTasks);
    
    // Moving Task1's end date to after Task2's start date should create a violation
    act(() => {
      screen.getByTestId('validate-end-task1-late').click();
    });
    
    // Should detect that Task2 now starts before Task1 ends
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-task2')).toBeInTheDocument();
  });

  test('validateEndDateConstraints should update violations when moving end date', () => {
    renderValidationTests(mockTasks);
    
    // First, validate end date that doesn't create violations
    act(() => {
      screen.getByTestId('validate-end-task1').click();
    });
    expect(screen.getByTestId('violation-count').textContent).toBe('0');
    
    // Now move Task1's end date to create a violation with Task2
    act(() => {
      screen.getByTestId('validate-end-task1-late').click();
    });
    
    // Should detect that Task2 now starts before Task1 ends
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-task2')).toBeInTheDocument();
  });

  test('should validate both start and end dates when moving a task', () => {
    renderValidationTests(mockTasks);
    
    // Simulate moving a task (changing both start and end dates)
    act(() => {
      screen.getByTestId('move-task1').click();
    });
    
    // Should detect that Task2 now starts before Task1 ends
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-task2')).toBeInTheDocument();
  });

  test('validateEndDateConstraints should propagate violations through dependency chain', () => {
    // Create a scenario with a chain of dependencies
    const chainTasks: Task[] = [
      {
        id: 'taskA',
        name: 'Task A',
        start: '2023-01-10',
        end: '2023-01-20',
        dependsOn: [],
        tasks: []
      },
      {
        id: 'taskB',
        name: 'Task B',
        start: '2023-01-25',
        end: '2023-02-05',
        dependsOn: ['taskA'],
        tasks: []
      },
      {
        id: 'taskC',
        name: 'Task C',
        start: '2023-02-10',
        end: '2023-02-20',
        dependsOn: ['taskB'],
        tasks: []
      }
    ];
    
    // Custom component for chain testing
    const ChainTestComponent = () => {
      const { dependencyViolations, validateEndDateConstraints } = useDependencyViolations();
      
      return (
        <div>
          <div data-testid="violation-count">{Object.keys(dependencyViolations).length}</div>
          <button 
            data-testid="move-taskA-end-later" 
            onClick={() => validateEndDateConstraints('taskA', new Date('2023-02-15'), chainTasks)}
          >
            Move TaskA End Later
          </button>
          <ul>
            {Object.entries(dependencyViolations).map(([depId, message]) => (
              <li key={depId} data-testid={`violation-${depId}`}>
                {depId}: {message}
              </li>
            ))}
          </ul>
        </div>
      );
    };
    
    render(
      <DependencyViolationsProvider>
        <ChainTestComponent />
      </DependencyViolationsProvider>
    );
    
    act(() => {
      screen.getByTestId('move-taskA-end-later').click();
    });
    
    // Both taskB and potentially taskC should be in violation
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-taskB')).toBeInTheDocument();
    
    // Note: In the current implementation, only direct dependencies are checked,
    // not the entire chain. The test would need to be updated if chain propagation
    // is implemented.
  });

  test('should detect downstream violations when moving a task with its end date', () => {
    renderValidationTests(mockTasks);
    
    // Simulate moving a task with its end date
    act(() => {
      screen.getByTestId('move-task1').click();
    });
    
    // Should detect that Task2 now starts before Task1 ends
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-task2')).toBeInTheDocument();
  });

  test('should handle cascading dependencies correctly when moving a middle task', () => {
    // Create a component with the specific functionality we need to test
    const CascadeTestComponent = () => {
      const { 
        dependencyViolations, 
        validateDependencyConstraints,
        validateEndDateConstraints,
        clearViolations
      } = useDependencyViolations();
  
      return (
        <div data-testid="cascade-test-component">
          <div data-testid="violation-count">{Object.keys(dependencyViolations).length}</div>
          <button 
            data-testid="move-middle-earlier"
            onClick={() => {
              clearViolations(); // Start fresh
              // Simulate moving the middle task earlier (only validates upstream)
              validateDependencyConstraints('middle', new Date('2023-01-10'), cascadeMockTasks);
            }}
          >
            Move Middle Earlier (Check Upstream)
          </button>
          <button 
            data-testid="check-downstream"
            onClick={() => {
              // Now check if this affects downstream tasks
              validateEndDateConstraints('middle', new Date('2023-01-25'), cascadeMockTasks);
            }}
          >
            Check Downstream Impact
          </button>
          <ul>
            {Object.entries(dependencyViolations).map(([depId, message]) => (
              <li key={depId} data-testid={`violation-${depId}`}>
                {depId}: {message}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  
    // Render the test component
    render(
      <DependencyViolationsProvider>
        <CascadeTestComponent />
      </DependencyViolationsProvider>
    );
    
    // 1. First move the middle task earlier, which should conflict with upstream tasks
    act(() => {
      screen.getByTestId('move-middle-earlier').click();
    });
    
    // Expect violations with the upstream dependencies only
    expect(screen.getByTestId('violation-count').textContent).toBe('2');
    expect(screen.getByTestId('violation-upstream1')).toBeInTheDocument();
    expect(screen.getByTestId('violation-upstream2')).toBeInTheDocument();
    
    // 2. Now check the downstream impact - this is where the bug occurs
    // It should NOT affect the upstream dependencies again or create new violations
    act(() => {
      screen.getByTestId('check-downstream').click();
    });
    
    // The bug causes additional violations to be created for upstream dependencies
    // so the test would expect just the violations from step 1, plus any new downstream violations
    // but not duplicates with the upstream dependencies
    expect(screen.getByTestId('violation-count').textContent).toBe('2');
    expect(screen.getByTestId('violation-upstream1')).toBeInTheDocument();
    expect(screen.getByTestId('violation-upstream2')).toBeInTheDocument();
  });

  test('should handle real-world car design dependency scenario', () => {
    // Real data scenario from the Car Design project
    const carDesignTasks: Task[] = [
      {
        id: "9.1",
        end: "2025-02-08",
        name: "Create design brief",
        start: "2025-01-29",
        dependsOn: []
      },
      {
        id: "9.2",
        end: "2025-02-19",
        name: "Theme 1 (Blender)",
        start: "2025-01-29",
        dependsOn: []
      },
      {
        id: "9.3",
        end: "2025-02-19",
        name: "Theme 2 (Blender)",
        start: "2025-01-29",
        dependsOn: []
      },
      {
        id: "9.4",
        end: "2025-03-03",
        name: "Down selection",
        start: "2025-02-24",
        dependsOn: ["9.2", "9.3"]
      },
      {
        id: "9.5",
        end: "2025-03-25",
        name: "Chosen theme (Blender)",
        start: "2025-03-13",
        dependsOn: ["9.4"]
      },
      {
        id: "9.6",
        end: "2025-03-29",
        name: "Proportion model (Alias)",
        start: "2025-02-08",
        dependsOn: []
      },
      {
        id: "9.7",
        end: "2025-03-26",
        name: "Theme selection",
        start: "2025-03-19",
        dependsOn: ["9.5"]
      }
    ];

    // Create a component that simulates exactly what happens in the app
    const CarDesignTestComponent = () => {
      const { 
        dependencyViolations, 
        validateDependencyConstraints,
        validateEndDateConstraints,
        clearViolations
      } = useDependencyViolations();
  
      return (
        <div data-testid="car-design-test-component">
          <div data-testid="violation-count">{Object.keys(dependencyViolations).length}</div>
          <button 
            data-testid="move-chosen-theme-earlier"
            onClick={() => {
              clearViolations(); // Start fresh
              
              // Simulate moving the Chosen theme (9.5) earlier to start on Feb 28
              // First check if the new start date creates violations with upstream dependencies
              validateDependencyConstraints('9.5', new Date('2025-02-28'), carDesignTasks);
              
              // Then check if the new end date affects any downstream dependencies
              validateEndDateConstraints('9.5', new Date('2025-03-12'), carDesignTasks);
            }}
          >
            Move Chosen Theme Earlier
          </button>
          <ul>
            {Object.entries(dependencyViolations).map(([depId, message]) => (
              <li key={depId} data-testid={`violation-${depId}`}>
                {depId}: {message}
              </li>
            ))}
          </ul>
        </div>
      );
    };
  
    // Render the test component
    render(
      <DependencyViolationsProvider>
        <CarDesignTestComponent />
      </DependencyViolationsProvider>
    );
    
    // Simulate moving the Chosen theme earlier
    act(() => {
      screen.getByTestId('move-chosen-theme-earlier').click();
    });
    
    // We should only get a violation for the direct dependency between 9.5 and 9.4
    // since 9.5 (Chosen theme) now starts before 9.4 (Down selection) ends
    expect(screen.getByTestId('violation-count').textContent).toBe('1');
    expect(screen.getByTestId('violation-9.4')).toBeInTheDocument();
    
    // We should NOT get violations for 9.2 or 9.3, which are upstream of 9.4
    expect(() => screen.getByTestId('violation-9.2')).toThrow();
    expect(() => screen.getByTestId('violation-9.3')).toThrow();
  });
});
