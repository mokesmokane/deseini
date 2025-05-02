export interface ThoughtItem {
    summary: string;
    timestamp?: string;
  }
  
  export interface Task {
    id: string;
    name: string;
    duration?: number;
    startDate?: Date;
    endDate?: Date;
    dependencies?: string[];
  }
  
  export interface Milestone {
    id: string;
    name: string;
    date: Date;
    relatedTasks?: string[];
  }
  
  export interface SketchSummary {
    startDate?: Date;
    endDate?: Date;
    duration: number;
    totalTasks: number;
    totalMilestones: number;
    tasks?: Task[];
    milestones?: Milestone[];
  }
  
  export interface PlanSummary {
    allText: string;
    mermaidMarkdown: string;
    thinking?: ThoughtItem[];
    sketchSummary?: SketchSummary;
  }
  
  export interface GenerateNodeData {
    label: string;
    isVisible: boolean;
  }