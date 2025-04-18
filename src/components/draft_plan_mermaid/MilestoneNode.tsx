import { memo } from 'react';

interface MilestoneData {
  id: string;
  label: string;
  startDate: Date;
  sectionName: string;
  isVisible: boolean;
  hasDate: boolean;
}

const MilestoneNode = ({ data }: { data: MilestoneData }) => {
  // Format date for display
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
  
  const dateStr = formatDate(data.startDate);
  
  return (
    <div style={{ position: 'relative', width: '40px', height: '40px' }}>
      {/* Diamond shape */}
      <div 
        style={{
          position: 'absolute',
          top: '-35px',
          left: '-25px',
          width: '45px',
          height: '45px',
          backgroundColor: '#ffffff',
          border: '2px solid #000000',
          transform: 'rotate(45deg)',
          borderRadius: '8px',
          zIndex: 10
        }}
        title={`${data.label}\nDate: ${dateStr}`}
      />
      
      {/* Date display */}
      {data.hasDate && (
        <div 
          style={{
            position: 'absolute',
            top: '15px',
            left: '-25px',
            width: '100%',
            fontSize: '10px',
            color: '#000000',
            textAlign: 'center',
            whiteSpace: 'nowrap'
          }}
        >
          {dateStr}
        </div>
      )}
    </div>
  );
};

export default memo(MilestoneNode);
