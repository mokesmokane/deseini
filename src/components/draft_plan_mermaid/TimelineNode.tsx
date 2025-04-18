import { memo } from 'react';

interface TimelineData {
  label: string;
  startDate: Date;
  endDate: Date;
  width: number;
  isVisible: boolean;
}

const TimelineNode = ({ data }: { data: TimelineData }) => {
  const totalDays = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const tickInterval = 7; // days between dots
  const numDots = Math.ceil(totalDays / tickInterval);
  return (
    <div style={{
      position: 'relative',
      width: `${data.width}px`,
      height: '50px',
      margin: '10px 0'
    }}>
      {/* Date labels */}
      <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: '4px', fontSize: '12px', color: 'black' }}>
        {data.startDate.toLocaleDateString()}
      </div>
      <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: '4px', fontSize: '12px', color: 'black' }}>
        {data.endDate.toLocaleDateString()}
      </div>
      {/* Tube line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        width: `${data.width}px`,
        height: '4px',
        background: 'black',
        transform: 'translateY(-50%)',
        borderRadius: '2px'
      }} />
      {/* Station dots */}
      {Array.from({ length: numDots + 1 }, (_, i) => {
        const pos = (i * tickInterval * data.width) / totalDays;
        const dotDate = new Date(data.startDate.getTime() + i * tickInterval * 24 * 60 * 60 * 1000);
        return (
          <div
            key={i}
            title={dotDate.toLocaleDateString()}
            style={{
              pointerEvents: 'auto',
              position: 'absolute',
              left: `${pos}px`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'white',
              border: '3px solid black',
              boxSizing: 'border-box'
            }} />
        );
      })}
    </div>
  );
};

export default memo(TimelineNode);
