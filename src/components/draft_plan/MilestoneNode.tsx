import React, { memo } from 'react';

interface MilestoneData {
  label: string;
  date: Date;
  isVisible: boolean;
  hasDate: boolean;
}

const MilestoneNode = ({ data }: { data: MilestoneData }) => {
  // Format date for display in tooltip
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

  return (
    <div style={{ position: 'relative' }}>
      {/* Diamond shape for milestone */}
      <div style={{
        width: '60px',
        height: '60px',
        background: 'white',
        border: '2px solid black',
        transform: 'rotate(45deg)',
        position: 'absolute',
        left: '50%',
        marginLeft: '-30px',
        borderRadius: '8px',
      }} />
      
      {/* Label with tooltip */}
      <div 
        style={{
          position: 'relative',
          padding: '20px',
          fontFamily: 'Comic Sans MS',
          fontSize: '22px',
          textAlign: 'center',
          minWidth: '100px',
          maxWidth: '200px',
          transform: 'translateX(-20px)',
          marginTop: '80px',
          transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
        title={`${data.label}${data.date ? ` (${formatDate(data.date)})` : ''}`}
      >
        {data.label}
      </div>
    </div>
  );
};

export default memo(MilestoneNode);