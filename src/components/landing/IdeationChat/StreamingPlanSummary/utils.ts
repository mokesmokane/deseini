/**
 * Format a number of days into a readable duration string
 */
export const formatDuration = (days: number): string => {
    if (days === 1) return '1 day';
    return `${days} days`;
  };
  
  /**
   * Format a date object to a readable string
   */
  export const formatDate = (date?: Date): string => {
    if (!date) return 'TBD';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  /**
   * Convert a timestamp string to a Date object
   */
  export const parseDate = (dateString?: string): Date | undefined => {
    if (!dateString) return undefined;
    
    try {
      return new Date(dateString);
    } catch (error) {
      console.error('Failed to parse date:', error);
      return undefined;
    }
  };