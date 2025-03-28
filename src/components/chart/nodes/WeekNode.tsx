import React from 'react';
import { parseISO, addDays, format } from 'date-fns';
import { DAY_WIDTH } from '../constants/gantt';

interface WeekNodeProps {
  data: {
    width: number;
    weekStart: string;
  };
}

export const WeekNode = ({ data }: WeekNodeProps) => {
  const weekStart = parseISO(data.weekStart);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div 
      className="border-r border-gray-200 flex items-center justify-between bg-white h-12 relative"
      style={{ width: data.width }}
    >
      {days.map((day, index) => (
        <React.Fragment key={day.toISOString()}>
          <div 
            className="flex-1 h-full flex items-center justify-center text-xs text-gray-500"
            style={{ width: DAY_WIDTH }}
          >
            {format(day, 'd')}
          </div>
          {index < 6 && (
            <div 
              className="h-full border-l border-gray-200" 
              style={{ width: '1px' }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
