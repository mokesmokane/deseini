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
  bannerImage: string;
  projectName: string;
  description: string;
  attachments: Attachment[];
  roles: Role[];
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
  tasks: Task[];
  dependencies: Dependency[]; 
}