export interface DraftPlan {
  sections: Section[];
  timeline?: Timeline;
}

export interface Task {
  id: string;
  type?: 'task' | 'milestone';
  label: string;
  startDate: Date;
  duration?: number;
  endDate?: Date;
  dependencies?: string[];
}

export interface Section {
  name: string;
  tasks: Task[];
  section?: Section;
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
}