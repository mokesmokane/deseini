export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Deliverable {
  id?: string;
  deliverableName: string;
  deadline: string;
  fee?: number | null;
  description: string;
}

export interface Role {
  id?: string;
  title: string;
  type: string;
  country: string;
  region: string;
  town: string;
  level: string;
  professions: string;
  startDate: string;
  endDate: string;
  paymentBy: string;
  hourlyRate: number;
  description: string;
  deliverables?: Deliverable[];
}

export interface Project {
  id: string;
  projectName: string;
  description?: string;
  bannerImage?: string;
  attachments?: any[]; // Define specific attachment type later
  roles?: any[]; // Define specific role type later
  charts?: Chart[];
}

// Gantt Chart Types
export interface Milestone {
  id: string;
  name: string;
  description: string;
  start: string;
}

export interface Task {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  start: string;
  end: string;
  color?: string;
  milestone?: boolean;
  type?: 'task' | 'event';  
  tasks?: Task[];
  relevantMilestones?: string[];
}

export interface Dependency {
  sourceId: string; 
  targetId: string; 
}

// Helper function to create a unique key for a dependency relationship
export const getDependencyKey = (sourceId: string, targetId: string): string => {
  return `${sourceId}::${targetId}`;
};

export interface GanttData {
  id: string;
  name: string;
  description: string;
  start: string;
  end: string;
  milestones: Milestone[];
  color?: string;
  tasks: Task[];
  dependencies: Dependency[]; 
}

// Basic Chart Structure (expand as needed)
export interface Chart {
    id: string;
    name: string;
    description?: string;
    projectId?: string;
    start?: string;
    end?: string;
    tasks?: Task[]; // Define Task type if needed
    dependencies?: any[]; // Define Dependency type if needed
    milestones?: any[]; // Define Milestone type if needed
}

// Interface for chat messages
export interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    requiresAction?: boolean;
}

// Interface for task data in the tree structure
export interface TaskData {
  name: string;
  id: number | string;
  parent?: number | string;
  metadata?: { [key: string]: any };
}

// Interface for tree nodes with children property
export interface TreeTaskNode extends TaskData {
  children?: TreeTaskNode[];
}

// Add other shared types here as needed (e.g., Task, Dependency, Milestone)

export interface MermaidTaskData {
  id: string;
  label: string;
  width?: number;
  startDate: Date;
  duration?: number;
  endDate?: Date;
  dependencies?: string[];
  sectionName: string;
  isVisible: boolean;
  hasDate: boolean;
  hasDuration: boolean;
}