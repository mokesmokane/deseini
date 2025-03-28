import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { isBefore, parseISO } from 'date-fns';
import { Task } from '../types';

type DependencyViolationsContextType = {
  dependencyViolations: Record<string, string>;
  setDependencyViolations: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clearViolations: () => void;
  addViolation: (dependencyId: string, message: string) => void;
  removeViolation: (dependencyId: string) => void;
  validateDependencyConstraints: (taskId: string, startDate: Date, tasks: Task[]) => boolean;
  validateEndDateConstraints: (taskId: string, endDate: Date, tasks: Task[]) => boolean;
  validateTaskDates: (taskId: string, startDate: Date, endDate: Date, tasks: Task[]) => boolean;
  clearDependencyViolation: (taskId: string) => void;
};

const DependencyViolationsContext = createContext<DependencyViolationsContextType | undefined>(undefined);

interface DependencyViolationsProviderProps {
  children: ReactNode;
}

export const DependencyViolationsProvider: React.FC<DependencyViolationsProviderProps> = ({ children }) => {
  const [dependencyViolations, setDependencyViolations] = useState<Record<string, string>>({});

  const clearViolations = () => {
    setDependencyViolations({});
  };

  const addViolation = (dependencyId: string, message: string) => {
    setDependencyViolations(prev => ({
      ...prev,
      [dependencyId]: message
    }));
  };

  const removeViolation = (dependencyId: string) => {
    setDependencyViolations(prev => {
      const newViolations = { ...prev };
      delete newViolations[dependencyId];
      return newViolations;
    });
  };

  // Find a task by its ID in a nested task structure
  const findTaskById = useCallback((tasks: Task[], id: string): Task | null => {
    for (const task of tasks) {
      if (task.id === id) {
        return task;
      }
      if (task.tasks && task.tasks.length > 0) {
        const found = findTaskById(task.tasks, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }, []);

  // Find all tasks that depend on a given task ID
  const findDependentTasks = useCallback((tasks: Task[], dependencyId: string): Task[] => {
    const dependentTasks: Task[] = [];
    
    const findDependents = (taskList: Task[]) => {
      for (const task of taskList) {
        if (task.dependsOn && task.dependsOn.includes(dependencyId)) {
          dependentTasks.push(task);
        }
        if (task.tasks && task.tasks.length > 0) {
          findDependents(task.tasks);
        }
      }
    };
    
    findDependents(tasks);
    return dependentTasks;
  }, []);

  // Combined function to validate both start and end date constraints
  const validateTaskDates = useCallback((taskId: string, startDate: Date, endDate: Date, tasks: Task[]): boolean => {
    console.log('Validating both start and end date constraints for task:', taskId);
    const task = findTaskById(tasks, taskId);
    if (!task) return true; // Task not found, no violations
    
    let isValid = true;
    const violations: Record<string, string> = {};
    
    // 1. Validate if this task's start date violates its dependencies
    if (task.dependsOn && task.dependsOn.length > 0) {
      task.dependsOn.forEach(dependencyId => {
        console.log('Checking dependency:', dependencyId);
        const dependencyTask = findTaskById(tasks, dependencyId);
        if (dependencyTask && dependencyTask.end) {
          const dependencyEndDate = parseISO(dependencyTask.end);
          
          // Check if this task starts before its dependency ends
          if (isBefore(startDate, dependencyEndDate)) {
            console.log('Dependency violation found:', dependencyId);
            isValid = false;
            
            // Store the violation on the dependent task (the one with dependsOn)
            violations[taskId] = `Task "${task.name}" cannot start before its dependency "${dependencyTask.name}" ends`;
          }
        }
      });
    }
    
    // 2. Validate if this task's end date violates tasks that depend on it
    const dependentTasks = findDependentTasks(tasks, taskId);
    
    dependentTasks.forEach(dependentTask => {
      console.log('Checking dependent task:', dependentTask.name);
      
      if (dependentTask.start) {
        const dependentStartDate = parseISO(dependentTask.start);
        
        // Check if any dependent task starts before this task ends
        if (isBefore(dependentStartDate, endDate)) {
          console.log('Dependency violation found:', dependentTask.name);
          isValid = false;
          
          // Store the violation in the dependent task's ID
          violations[dependentTask.id] = `Task "${dependentTask.name}" cannot start before its dependency "${task.name}" ends`;
        }
      }
    });
    
    // Update the dependency violations state with all violations in a single update
    setDependencyViolations(prev => {
      const newViolations = {...prev};
      
      // 1. Clear violations where this task is involved with its dependencies
      if (task.dependsOn) {
        task.dependsOn.forEach(() => {
          delete newViolations[taskId]; // Clear violations for the current task
        });
      }
      
      // 2. Clear violations where dependent tasks are involved with this task
      dependentTasks.forEach(dependentTask => {
        delete newViolations[dependentTask.id]; 
      });
      
      // 3. Add back any violations that still exist
      if (Object.keys(violations).length > 0) {
        console.log('Adding violations1:', violations);
        console.log('to violations:', newViolations);
        return {...newViolations, ...violations};
      }
      
      return newViolations;
    });
    
    return isValid;
  }, [findTaskById, findDependentTasks]);

  // Function to validate if a task's start date adheres to its dependency constraints
  const validateDependencyConstraints = useCallback((taskId: string, startDate: Date, tasks: Task[]): boolean => {
    console.log('Validating dependency constraints for task:', taskId);
    const task = findTaskById(tasks, taskId);
    if (!task) return true; // Task not found, no violations
    
    let isValid = true;
    const violations: Record<string, string> = {};
    
    // Check if this task starts before its dependencies end
    if (task.dependsOn && task.dependsOn.length > 0) {
      task.dependsOn.forEach(dependencyId => {
        console.log('Checking dependency:', dependencyId);
        const dependencyTask = findTaskById(tasks, dependencyId);
        if (dependencyTask && dependencyTask.end) {
          const dependencyEndDate = parseISO(dependencyTask.end);
          
          // Check if this task starts before its dependency ends
          if (isBefore(startDate, dependencyEndDate)) {
            console.log('Dependency violation found:', dependencyId);
            isValid = false;
            
            // CRITICAL FIX: Store violations consistent with validateEndDateConstraints
            // Always store the violation on the dependent task (the one with dependsOn)
            violations[taskId] = `Task "${task.name}" cannot start before its dependency "${dependencyTask.name}" ends`;
          }
        }
      });
    }
    
    // Add downstream validation
    if (task.end) {
      const taskEndDate = parseISO(task.end);
      const dependentTasks = findDependentTasks(tasks, taskId);
      
      dependentTasks.forEach(dependentTask => {
        if (dependentTask.start) {
          const dependentStartDate = parseISO(dependentTask.start);
          
          // Check if any dependent task starts before this task ends
          if (isBefore(dependentStartDate, taskEndDate)) {
            console.log('Dependency violation found (downstream):', dependentTask.name);
            isValid = false;
            
            // CRITICAL FIX: Store the violation in the dependent task's ID
            violations[dependentTask.id] = `Task "${dependentTask.name}" cannot start before its dependency "${task.name}" ends`;
          }
        }
      });
    }

    // Update the dependency violations state
    setDependencyViolations(prev => {
      const newViolations = {...prev};
      
      // ENHANCED FIX: Bidirectional validation clearing
      
      // 1. Clear violations where this task is involved with its dependencies
      if (task.dependsOn) {
        task.dependsOn.forEach(() => {
          delete newViolations[taskId]; // Clear violations for the current task
        });
      }
      
      // 2. Clear violations where dependent tasks are involved with this task
      const dependentTasks = findDependentTasks(tasks, taskId);
      dependentTasks.forEach(dependentTask => {
        delete newViolations[dependentTask.id]; 
      });
      
      // 3. Add back any violations that still exist
      if (Object.keys(violations).length > 0) {
        console.log('Adding violations2:', violations);
        return {...newViolations, ...violations};
      }
      
      return newViolations;
    });
    
    return isValid;
  }, [findTaskById, findDependentTasks]);

  // Function to validate end date changes and their impact on dependent tasks
  const validateEndDateConstraints = useCallback((taskId: string, endDate: Date, tasks: Task[]): boolean => {
    console.log('Validating end date constraints for task:', taskId);
    const task = findTaskById(tasks, taskId);
    if (!task) return true; // Task not found, no violations
    
    let isValid = true;
    const violations: Record<string, string> = {};
    
    // Find all tasks that depend on this task
    const dependentTasks = findDependentTasks(tasks, taskId);
    
    dependentTasks.forEach(dependentTask => {
      console.log('Checking dependent task:', dependentTask.name);
      
      if (dependentTask.start) {
        const dependentStartDate = parseISO(dependentTask.start);
        
        // Check if any dependent task starts before this task ends
        if (isBefore(dependentStartDate, endDate)) {
          console.log('Dependency violation found:', dependentTask.name);
          isValid = false;
          
          // CRITICAL FIX: Store the violation in the dependent task's ID
          // This ensures violations are consistently stored in the task that has the dependency
          violations[dependentTask.id] = `Task "${dependentTask.name}" cannot start before its dependency "${task.name}" ends`;
        }
      }
    });
    
    // Update the dependency violations state with the new violations
    setDependencyViolations(prev => {
      const newViolations = {...prev};
      
      // CRITICAL FIX: Validate bidirectionally - clear violations in both directions
      
      // First, clear any violations related to this task's relationships
      // This includes both where this task is a dependency for others,
      // and where this task depends on others
      
      // 1. Clear violations where this task is the dependency for other tasks
      dependentTasks.forEach(dependentTask => {
        delete newViolations[dependentTask.id];
      });
      
      // 2. Clear violations where this task depends on other tasks
      if (task.dependsOn) {
        task.dependsOn.forEach(() => {
          delete newViolations[taskId]; // Clear violations for the current task
        });
      }
      
      // 3. Add back any violations that still exist
      if (Object.keys(violations).length > 0) {
        console.log('Adding violations3:', violations);
        return {...newViolations, ...violations};
      }
      
      return newViolations;
    });
    
    return isValid;
  }, [findTaskById, findDependentTasks]);

  // Function to clear dependency violations for a task
  const clearDependencyViolation = useCallback((taskId: string) => {
    setDependencyViolations(prev => {
      const newViolations = {...prev};
      Object.keys(newViolations).forEach(key => {
        if (key.includes(taskId)) {
          delete newViolations[key];
        }
      });
      return newViolations;
    });
  }, []);

  return (
    <DependencyViolationsContext.Provider 
      value={{ 
        dependencyViolations, 
        setDependencyViolations, 
        clearViolations, 
        addViolation, 
        removeViolation,
        validateDependencyConstraints,
        validateEndDateConstraints,
        validateTaskDates,
        clearDependencyViolation
      }}
    >
      {children}
    </DependencyViolationsContext.Provider>
  );
};

export const useDependencyViolations = (): DependencyViolationsContextType => {
  const context = useContext(DependencyViolationsContext);
  if (context === undefined) {
    throw new Error('useDependencyViolations must be used within a DependencyViolationsProvider');
  }
  return context;
};
