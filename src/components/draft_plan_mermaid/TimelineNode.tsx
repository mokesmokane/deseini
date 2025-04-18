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

  // Ensure first dot is at 0 and last dot is at width
  const getDotPos = (i: number) => {
    if (i === 0) return 0;
    if (i === numDots) return data.width;
    return (i * tickInterval * data.width) / totalDays;
  };
  // Date label positions
  const firstDotLeft = getDotPos(0);
  const lastDotLeft = getDotPos(numDots);

  return (
    <div style={{
      position: 'relative',
      width: `${data.width}px`,
      height: '70px', // increased for bigger labels
      margin: '10px 0'
    }}>
      {/* Start Date label - centered above first dot */}
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: `${firstDotLeft}px`,
        marginBottom: '10px',
        fontSize: '18px',
        fontWeight: 700,
        color: 'black',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>
        {data.startDate.toLocaleDateString()}
      </div>
      {/* End Date label - centered above last dot */}
      <div style={{
        position: 'absolute',
        bottom: '100%',
        left: `${lastDotLeft}px`,
        marginBottom: '10px',
        fontSize: '18px',
        fontWeight: 700,
        color: 'black',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>
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
        const pos = getDotPos(i);
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
