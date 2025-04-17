import { Task } from '../../../contexts/DraftPlanContextMermaid';

// Helper to ensure we're working with Date objects
export const ensureDate = (date: Date | string | undefined): Date => {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  return new Date(date);
};

// Helper function to calculate x position based on date
export const getXPositionFromDate = (
  date: Date | string | undefined, 
  startDate: Date | string, 
  pixelsPerDay: number = 30
) => {
  if (!date) return 0;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  
  // Calculate days between dates
  const daysDiff = Math.floor((dateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
  
  // Convert days to pixels
  return daysDiff * pixelsPerDay;
};

// Helper function to calculate width between two dates
export const getWidthBetweenDates = (
  startDate: Date | string, 
  endDate: Date | string, 
  pixelsPerDay: number = 30
) => {
  const startDateObj = ensureDate(startDate);
  const endDateObj = ensureDate(endDate);
  
  const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays * pixelsPerDay;
};

// Helper function to get task date for positioning
export const getTaskDate = (task: Task): Date => {
  if (task.type === 'milestone' && task.date) {
    return ensureDate(task.date);
  }
  return task.startDate ? ensureDate(task.startDate) : new Date(); 
};

// Helper to convert X position to a date
export const getDateFromXPosition = (
  xPosition: number, 
  startDate: Date | string, 
  pixelsPerDay: number = 30
) => {
  if (!startDate) return new Date();
  
  const startDateObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  
  // Calculate days difference based on pixels
  const daysDiff = Math.floor(xPosition / pixelsPerDay);
  
  // Create new date object
  const newDate = new Date(startDateObj);
  newDate.setDate(startDateObj.getDate() + daysDiff);
  
  return newDate;
};

// Round position to nearest day increment (for grid-like snapping)
export const roundPositionToDay = (position: number, pixelsPerDay: number = 30) => {
  return Math.round(position / pixelsPerDay) * pixelsPerDay;
};

// Helper function to compare dates
export const datesEqual = (date1?: Date | string, date2?: Date | string) => {
  if (!date1 && !date2) return true;
  if (!date1 || !date2) return false;
  
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  return d1.getTime() === d2.getTime();
};

// Calculate the end date for a task
export const calculateTaskEndDate = (task: Task): Date => {
  const startDate = getTaskDate(task);
  
  if (task.type === 'milestone') {
    return new Date(startDate);
  } else if (task.endDate) {
    return ensureDate(task.endDate);
  } else if (task.duration && task.startDate) {
    const endDate = new Date(ensureDate(task.startDate));
    endDate.setDate(endDate.getDate() + task.duration);
    return endDate;
  }
  
  return new Date(startDate);
};
