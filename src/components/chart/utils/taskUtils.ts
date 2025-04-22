import { Task } from '../../../types';

/**
 * Recursively find a task by id in a nested task array.
 * Returns the task, its parent array, and its index.
 */
export function findTask(
  taskId: string,
  tasks: Task[]
): { task: Task | null; parent: Task[] | null; index: number } {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) {
      return { task: tasks[i], parent: tasks, index: i };
    }
    const subtasks = tasks[i].tasks;
    if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
      const result = findTask(taskId, subtasks);
      if (result.task) return result;
    }
  }
  return { task: null, parent: null, index: -1 };
}

/**
 * Recursively update a task by id in a nested task array.
 * Mutates the array in-place.
 */
export function updateTaskRecursive(
  taskId: string,
  updates: Partial<Task>,
  tasks: Task[]
): boolean {
  for (let i = 0; i < tasks.length; i++) {
    if (tasks[i].id === taskId) {
      tasks[i] = { ...tasks[i], ...updates };
      return true;
    }
    const subtasks = tasks[i].tasks;
    if (subtasks && Array.isArray(subtasks) && subtasks.length > 0) {
      if (updateTaskRecursive(taskId, updates, subtasks)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Deep clone a task and generate a new ID (provided by caller).
 */
export function cloneTask(task: Task, newId: string): Task {
  const cloned = JSON.parse(JSON.stringify(task));
  cloned.id = newId;
  // Optionally clear subtasks for shallow clone
  // cloned.tasks = [];
  return cloned;
}

/**
 * Insert a new task at a specific index in the parent array.
 */
export function insertTask(
  parent: Task[],
  index: number,
  newTask: Task
) {
  parent.splice(index, 0, newTask);
}
