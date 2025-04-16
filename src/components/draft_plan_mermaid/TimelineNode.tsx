import React, { memo } from 'react';

interface TimelineData {
  label: string;
  startDate: Date;
  endDate: Date;
  width: number;
  isVisible: boolean;
}

const TimelineNode = ({ data }: { data: TimelineData }) => {
  // Format dates for display
  const formatDate = (date: Date): string => {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const startDateStr = formatDate(data.startDate);
  const endDateStr = formatDate(data.endDate);

  // Calculate the number of days in the timeline
  const getDaysBetweenDates = (startDate: Date, endDate: Date): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const totalDays = getDaysBetweenDates(data.startDate, data.endDate);
  
  // Generate month markers along the timeline
  const getMonthMarkers = () => {
    const markers = [];
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    // Start with the first day of the next month
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
    
    while (currentDate < endDate) {
      const daysSinceStart = getDaysBetweenDates(startDate, currentDate);
      const position = (daysSinceStart / totalDays) * data.width;
      
      markers.push({
        position,
        label: currentDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        date: new Date(currentDate)
      });
      
      // Move to the first day of the next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return markers;
  };

  const monthMarkers = getMonthMarkers();

  return (
    <div 
      className="timeline-node"
      style={{ 
        position: 'relative', 
        height: '40px', 
        background: 'transparent',
        width: `${data.width}px`,
        transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Main timeline line */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        background: 'black',
        transform: 'translateY(-50%)'
      }} />
      
      {/* Start date marker */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '2px',
        height: '10px',
        background: 'black'
      }} />
      <div style={{
        position: 'absolute',
        left: '-30px',
        top: '15px',
        fontSize: '12px',
        whiteSpace: 'nowrap'
      }}>
        {startDateStr}
      </div>
      
      {/* End date marker */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: '2px',
        height: '10px',
        background: 'black'
      }} />
      <div style={{
        position: 'absolute',
        right: '-30px',
        top: '15px',
        fontSize: '12px',
        whiteSpace: 'nowrap'
      }}>
        {endDateStr}
      </div>
      
      {/* Month markers */}
      {monthMarkers.map((marker, index) => (
        <React.Fragment key={index}>
          <div style={{
            position: 'absolute',
            left: `${marker.position}px`,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '1px',
            height: '8px',
            background: 'black'
          }} />
          <div style={{
            position: 'absolute',
            left: `${marker.position - 20}px`,
            bottom: '-20px',
            width: '40px',
            fontSize: '10px',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}>
            {marker.label}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export default memo(TimelineNode);
