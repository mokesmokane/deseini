import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { parseISO, isBefore, isEqual } from 'date-fns';
import { getDependencyKey } from '../types';
import { Task, Dependency } from '../types';

// Type for a single violation
interface DependencyViolation {
  sourceTaskId: string;
  targetTaskId: string;
  message: string;
}

type DependencyViolationsContextType = {
  dependencyViolations: Record<string, DependencyViolation>;
  checkForViolations: (tasks: Task[], dependencies: Dependency[]) => boolean;
  clearViolations: () => void;
};

const DependencyViolationsContext = createContext<DependencyViolationsContextType | undefined>(undefined);

interface DependencyViolationsProviderProps {
  children: ReactNode;
}

export const DependencyViolationsProvider: React.FC<DependencyViolationsProviderProps> = ({ children }) => {
  const [dependencyViolations, setDependencyViolations] = useState<Record<string, DependencyViolation>>({});

  const clearViolations = useCallback(() => {
    setDependencyViolations({});
  }, []);

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

  /**
   * Check for dependency violations in the Gantt chart
   * @param tasks - Array of all tasks in the chart
   * @param dependencies - Array of all dependencies between tasks
   * @returns boolean - True if there are no violations, false if violations were found
   */
  const checkForViolations = useCallback((tasks: Task[], dependencies: Dependency[]): boolean => {
    console.log('Checking for violations...');
    if (!dependencies || dependencies.length === 0) {
      clearViolations();
      return true;
    }

    // Store all detected violations
    const violations: Record<string, DependencyViolation> = {};
    let isValid = true;

    // Loop through each dependency and validate it
    for (const dependency of dependencies) {
      console.log('Checking dependency:', dependency);
      const sourceTask = findTaskById(tasks, dependency.sourceId);
      const targetTask = findTaskById(tasks, dependency.targetId);

      // Skip if either task is not found or doesn't have dates
      if (!sourceTask || !targetTask || !sourceTask.end || !targetTask.start) {
        continue;
      }

      const sourceEndDate = parseISO(sourceTask.end);
      const targetStartDate = parseISO(targetTask.start);

      // Check if target task starts before source task ends
      // The rule is: target.start >= source.end
      if (isBefore(targetStartDate, sourceEndDate) && !isEqual(targetStartDate, sourceEndDate)) {
        console.log('Violation found:', dependency);
        // Violation found - target starts before source ends
        isValid = false;
        
        const key = getDependencyKey(dependency.sourceId, dependency.targetId);
        violations[key] = {
          sourceTaskId: dependency.sourceId,
          targetTaskId: dependency.targetId,
          message: `Task "${targetTask.name}" cannot start before its dependency "${sourceTask.name}" ends`
        };
      }
    }

    // Update violations state in a single operation
    console.log('Violations:', violations);
    setDependencyViolations(violations);
    return isValid;
  }, [findTaskById, clearViolations]);

  return (
    <DependencyViolationsContext.Provider
      value={{
        dependencyViolations,
        checkForViolations,
        clearViolations
      }}
    >
      {children}
    </DependencyViolationsContext.Provider>
  );
};

// Custom hook for using the DependencyViolations context
export const useDependencyViolations = (): DependencyViolationsContextType => {
  const context = useContext(DependencyViolationsContext);
  if (context === undefined) {
    throw new Error('useDependencyViolations must be used within a DependencyViolationsProvider');
  }
  return context;
};
