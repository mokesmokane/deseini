
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
/**
 * Interface for a thought during streaming
 */
export interface Thought {
  content: string;
  timestamp: number;
}

/**
 * Interface for sketch/drawing data
 */
export interface Sketch {
  mermaidData: string;
  timestamp: number;
}

/**
 * Interface for streaming summary data
 */
export interface StreamSummary {
  thinking: Thought[];
  drawing: Sketch;
}

/**
 * Interface for streaming data response
 */
export interface StreamResponse {
  content?: string;
  done?: boolean;
  error?: string;
}