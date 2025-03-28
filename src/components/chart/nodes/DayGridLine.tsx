import React from 'react';

interface DayGridLineProps {
  data: {
    x: number;
  };
}

export const DayGridLine = ({ data }: DayGridLineProps) => (
  <div 
    className="absolute top-0 bottom-0 border-l border-gray-100"
    style={{ 
      left: `${data.x}px`,
      height: '100%',
      pointerEvents: 'none'
    }}
  />
);
