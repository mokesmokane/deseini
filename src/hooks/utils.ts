import { Task } from '../contexts/DraftPlanContextMermaid'

// Helper to ensure we're working with Date objects
export const ensureDate = (date: Date | string | undefined): Date => {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    return new Date(date);
  };
  
  // Helper function to calculate x position based on date
  export const getXPositionFromDate = (date: Date | string | undefined, startDate: Date | string, pixelsPerDay: number) => {
    if (!date) return 0;
    
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const startDateObj = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
    // Normalize to start of day
    dateObj.setHours(0,0,0,0);
    startDateObj.setHours(0,0,0,0);
    
    // Calculate days between dates (rounded)
    const daysDiff = Math.round((dateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    
    // Convert days to pixels
    return daysDiff * pixelsPerDay;
  };
  
// Helper function to calculate width between two dates
export const getWidthBetweenDates = (startDate: Date | string, endDate: Date | string, pixelsPerDay: number) => {
    const startDateObj = ensureDate(startDate);
    const endDateObj = ensureDate(endDate);

    const diffTime = Math.abs(endDateObj.getTime() - startDateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * pixelsPerDay;
};

// Helper function to get task date for positioning
export const getTaskDate = (task: Task): Date => {
    return task.startDate ? ensureDate(task.startDate) : new Date(); 
};

// Helper to convert X position to a date
export const getDateFromXPosition = (xPosition: number, startDate: Date | string, pixelsPerDay: number) => {
    if (!startDate) return new Date();

    const startDateObj = typeof startDate === 'string' ? new Date(startDate) : new Date(startDate);
    // Normalize to start of day
    startDateObj.setHours(0,0,0,0);

    // Calculate days difference based on pixels (rounded)
    const daysDiff = Math.round(xPosition / pixelsPerDay);

    // Create new date object
    const newDate = new Date(startDateObj);
    newDate.setDate(startDateObj.getDate() + daysDiff);

    return newDate;
};
// Round position to nearest day increment (for grid-like snapping)
export const roundPositionToDay = (position: number, pixelsPerDay: number) => {
    return Math.round(position / pixelsPerDay) * pixelsPerDay;
};

