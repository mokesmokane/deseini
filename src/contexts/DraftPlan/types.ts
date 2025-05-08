export interface DraftPlan {
  sections: Section[];
  timeline?: Timeline;
}

export function deserializeDraftPlan(raw: any): DraftPlan {
  return {
    ...raw,
    sections: Array.isArray(raw.sections) ? raw.sections.map(deserializeSection) : [],
    timeline: raw.timeline ? deserializeTimeline(raw.timeline) : undefined,
  };
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

export function deserializeTask(raw: any): Task {
  return {
    ...raw,
    startDate: new Date(raw.startDate),
    endDate: raw.endDate ? new Date(raw.endDate) : undefined,
  };
}

export interface Section {
  name: string;
  tasks: Task[];
  section?: Section;
}

export function deserializeSection(raw: any): Section {
  return {
    ...raw,
    tasks: Array.isArray(raw.tasks) ? raw.tasks.map(deserializeTask) : [],
    section: raw.section ? deserializeSection(raw.section) : undefined,
  };
}

export interface Timeline {
  startDate: Date;
  endDate: Date;
}

export function deserializeTimeline(raw: any): Timeline {
  return {
    startDate: new Date(raw.startDate),
    endDate: new Date(raw.endDate),
  };
}