import { TaskNode } from './TaskNode';
import { MilestoneNode } from './MilestoneNode';
import { MonthNode } from './MonthNode';
import { WeekNode } from './WeekNode';
import { DayGridLine } from './DayGridLine';

export const nodeTypes = {
  task: TaskNode,
  milestone: MilestoneNode,
  month: MonthNode,
  week: WeekNode,
  dayGrid: DayGridLine,
};
