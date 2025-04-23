import { parseISO, addDays, differenceInDays, format, eachMonthOfInterval, eachWeekOfInterval, endOfWeek } from 'date-fns';
import { Node } from 'reactflow';
import { DAY_WIDTH } from '../GanttChart';

/**
 * Create timeline (month/week) nodes for the Gantt chart.
 */
export function createTimelineNodes(currentChart: { start: string; end: string }): Node[] {
  const timelineNodes: Node[] = [];
  const startDate = parseISO(currentChart.start);
  const endDate = parseISO(currentChart.end);
  const months = eachMonthOfInterval({ start: startDate, end: endDate });
  months.forEach((month, index) => {
    const nextMonth = months[index + 1] || endDate;
    const width = differenceInDays(nextMonth, month) * DAY_WIDTH;
    const x = differenceInDays(month, startDate) * DAY_WIDTH;
    timelineNodes.push({
      id: `month-${month.toISOString()}`,
      type: 'month',
      position: { x, y: 0 },
      draggable: false,
      selectable: false,
      data: { label: format(month, 'MMMM yyyy'), width },
    });
  });
  const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
  weeks.forEach((week) => {
    const weekEnd = endOfWeek(week);
    const width = DAY_WIDTH * 7;
    const x = differenceInDays(week, startDate) * DAY_WIDTH;
    timelineNodes.push({
      id: `week-${week.toISOString()}`,
      type: 'week',
      position: { x, y: 40 },
      draggable: false,
      selectable: false,
      data: { label: `${format(week, 'MMM d')} - ${format(weekEnd, 'MMM d')}`, width, weekStart: format(week, 'yyyy-MM-dd') },
    });
  });
  return timelineNodes;
}

/**
 * Create day grid line nodes for the Gantt chart.
 */
export function createDayGridLines(currentChart: { start: string; end: string }): Node[] {
  const dayNodes: Node[] = [];
  const startDate = parseISO(currentChart.start);
  const endDate = parseISO(currentChart.end);
  const totalDays = differenceInDays(endDate, startDate) + 1;
  for (let i = 0; i < totalDays; i++) {
    const dayDate = addDays(startDate, i);
    const x = i * DAY_WIDTH;
    dayNodes.push({
      id: `day-${i}`,
      type: 'dayGrid',
      position: { x, y: 0 },
      data: { x, date: format(dayDate, 'yyyy-MM-dd'), dayIndex: i },
      draggable: false,
      selectable: false,
    });
  }
  return dayNodes;
}

/**
 * Update node dates based on x offset.
 */
export function updateNodeDates(node: Node, x: number, chartStart: string): { start: string; end: string } {
  const daysOffset = Math.round(x / DAY_WIDTH);
  const startDate = addDays(parseISO(chartStart), daysOffset);
  const duration = differenceInDays(parseISO(node.data.end), parseISO(node.data.start));
  const endDate = addDays(startDate, duration);
  return {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
  };
}
