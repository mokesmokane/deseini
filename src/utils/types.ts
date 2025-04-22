
// Define the types of actions that can be buffered
export type ActionType = 
  | 'ADD_SECTION'
  | 'ADD_TASK'
  | 'ADD_MILESTONE'
  | 'UPDATE_TASK'
  | 'UPDATE_MILESTONE'
  | 'UPDATE_TIMELINE'
  | 'RESOLVE_DEPENDENCY'
  | 'PROCESS_DEPENDENCIES'
  | 'UPDATE_TASK_STARTDATE'
  | 'UPDATE_TASK_DURATION';

// Define the structure of a buffered action
export interface BufferedAction {
  type: ActionType;
  payload: any;
  timestamp: number;
}
