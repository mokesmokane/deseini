import React from 'react';

interface GanttIconProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/**
 * Simple Gantt chart icon component
 */
const GanttIcon: React.FC<GanttIconProps> = ({
  width = 20,
  height = 20,
  color = 'currentColor',
  className = '',
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={width} 
      height={height} 
      viewBox="0 0 24 24" 
      fill="none"
      stroke={color} 
      strokeWidth="2"
      className={className}
    >
      {/* Simple timeline container */}
      <rect x="3" y="3" width="18" height="18" rx="1" />
      
      {/* Simplified Gantt bars - just 3 bars of different lengths */}
      <line x1="6" y1="7" x2="15" y2="7" strokeWidth="2" />
      <line x1="6" y1="12" x2="18" y2="12" strokeWidth="2" />
      <line x1="6" y1="17" x2="12" y2="17" strokeWidth="2" />
    </svg>
  );
};

export default GanttIcon;
