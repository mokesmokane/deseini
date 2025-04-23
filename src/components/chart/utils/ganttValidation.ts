import { Task, Dependency } from '@/types';
/**
 * Validate task dates and dependencies. Returns the task, may throw or return errors in future.
 * This is a pure function, but can delegate to injected checkForViolations if needed.
 */
export function validateTaskDates(
  task: Task,
  tasks: Task[],
  dependencies: Dependency[],
  checkForViolations?: (tasks: Task[], dependencies: Dependency[]) => void
): Task {
  if (tasks && dependencies && checkForViolations) {
    checkForViolations(tasks, dependencies);
  }
  return task;
}
