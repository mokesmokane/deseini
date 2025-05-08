import React from 'react';
import { useGantt } from '../../../contexts/GanttContext';
import { format } from 'date-fns';

interface DayGridLineProps {
  data: {
    x: number;
    date: string; // ISO date string
    dayIndex: number;
  };
}

// Using React.FC to explicitly use React
export const DayGridLine: React.FC<DayGridLineProps> = ({ data }) => {
  const { setHoveredDayIndex, hoveredDayIndex } = useGantt();
  
  const handleMouseEnter = () => {
    setHoveredDayIndex(data.dayIndex);
  };
  
  const handleMouseLeave = () => {
    setHoveredDayIndex(null);
  };
  
  // Format the date for the tooltip (optional enhancement)
  const formattedDate = format(new Date(data.date), 'MMM d, yyyy');
  
  // Determine if this day is currently being hovered
  const isHovered = hoveredDayIndex === data.dayIndex;
  
  return (
    <>
      {/* Visual indicator that appears on hover */}
      {isHovered && (
        <div 
          className="absolute bg-blue-100 opacity-50" 
          style={{
            left: `${data.x}px`,
            top: 0,
            width: '30px', 
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      
      {/* Interactive element */}
      <div 
        className="absolute top-0 bottom-0 hover:bg-blue-50"
        style={{ 
          left: `${data.x}px`,
          height: '100%',
          pointerEvents: 'auto',
          width: '30px',
          zIndex: 1,
          cursor: 'pointer',
          borderLeft: isHovered ? '2px solid #3b82f6' : '1px solid #e5e7eb',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={formattedDate}
      />
    </>
  );
};
