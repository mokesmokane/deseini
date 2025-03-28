import React from 'react';
import { parseISO, addDays, format, differenceInDays } from 'date-fns';
import { useGantt } from '../../../context/GanttContext';

// Import DAY_WIDTH properly
const DAY_WIDTH = 30; // Ensure this matches the value in GanttChart.tsx

interface WeekNodeProps {
  data: {
    width: number;
    weekStart: string;
  };
}

export const WeekNode: React.FC<WeekNodeProps> = ({ data }) => {
  const { setHoveredDayIndex, hoveredDayIndex, currentChart } = useGantt();
  const weekStart = parseISO(data.weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handleDayHover = (day: Date) => {
    if (!currentChart) return;
    const chartStart = parseISO(currentChart.start);
    const dayIndex = differenceInDays(day, chartStart);
    console.log(`Day hover: Entered day ${dayIndex} (${format(day, 'yyyy-MM-dd')})`);
    setHoveredDayIndex(dayIndex);
  };

  const handleDayLeave = () => {
    console.log(`Day hover: Left day`);
    setHoveredDayIndex(null);
  };

  return (
    <div 
      className="border-r border-gray-200 flex items-center justify-between bg-white h-12 relative"
      style={{ width: data.width }}
    >
      {days.map((day, index) => {
        // Calculate dayIndex to track which day is hovered
        const dayIndex = currentChart 
          ? differenceInDays(day, parseISO(currentChart.start)) 
          : -1;
        
        // Check if this specific day is being hovered
        const isHovered = hoveredDayIndex === dayIndex;
        
        return (
          <React.Fragment key={day.toISOString()}>
            <div 
              className={`flex-1 h-full flex items-center justify-center text-xs ${isHovered ? 'bg-blue-100 font-semibold text-blue-700' : 'text-gray-500'}`}
              style={{ 
                width: DAY_WIDTH,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                zIndex: 1
              }}
              onMouseEnter={() => handleDayHover(day)}
              onMouseLeave={handleDayLeave}
              title={format(day, 'MMMM d, yyyy')}
            >
              {format(day, 'd')}
            </div>
            {index < 6 && (
              <div 
                className={`h-full border-l ${isHovered ? 'border-blue-400' : 'border-gray-200'}`}
                style={{ width: '1px' }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
