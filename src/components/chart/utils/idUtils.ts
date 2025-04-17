/**
 * Generate a unique ID for a new task.
 */
export function generateTaskId(): string {
  return 'task-' + Math.random().toString(36).substring(2, 11);
}
