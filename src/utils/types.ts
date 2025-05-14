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
  | 'UPDATE_TASK_DURATION'
  | 'UPDATE_TASK_LABEL'
  | 'UPDATE_SECTION_LABEL' // New: update section name inline
  | 'DELETE_TASK'
  | 'DELETE_DEPENDENCY'
  | 'ADD_DEPENDENCY';

// Define the structure of a buffered action
export interface BufferedAction {
  type: ActionType;
  payload: any;
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
 * Interface for streaming data response
 */
export interface StreamResponse {
  content?: string;
  done?: boolean;
  error?: string;
}


/**
 * Interface for per-line validation results
 */
export interface LineValidation {
  line: string;
  lineNumber: number;
  success: boolean;
  errors: string[];
}
/**
 * Interface for tracking the state of streaming data processing
 */
export interface StreamState {
  mermaidData: string;
  completeLines: string[];
  inMermaidBlock: boolean;
  currentSection: string | null;
  allSections: Set<string>;
  lastHeader: string | null;
  streamSummary: StreamSummary;
  // buffer forward dependency lines
  pendingLines?: Record<string, Array<{ line: string; section: string | null }>>;
  // track last milestone ID for handling "after milestone" references
  lastMilestoneId?: string;
  // store all processed mermaid syntax
  allMermaidSyntax?: string;
  // validation results for each line (key = line number, value = validation info)
  lineValidations?: Record<number, LineValidation>;
}

/**
 * Interface for tracking thoughts
 */
export interface Thought {
  summary: string;
  thoughts: string;
}

/**
 * Interface for tracking sketch data
 */
export interface SketchSummary {
  duration: number; // Duration in days
  totalTasks: number;
  totalMilestones: number;
  startDate?: Date;
  endDate?: Date;
  _minStart?: Date;
  _maxEnd?: Date;
}

/**
 * Interface for tracking stream summary
 */
export interface StreamSummary {
  thinking: Thought[];
  sketchSummary?: SketchSummary;
  mermaidMarkdown?: string;
  allText?: string;
}