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

  return (
    <div 
      className="node"
      style={{ 
        position: 'relative', 
        height: '40px', 
        background: 'transparent',
        width: `${data.width}px`,
        transition: 'width 500ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        background: 'black',
        transform: 'translateY(-50%)'
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: '0',
        height: '0',
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent',
        borderLeft: '10px solid black',
        transform: 'translate(-50%, -50%)'
      }} />
      <div style={{
        position: 'absolute',
        top: '-25px',
        width: '100%',
        textAlign: 'center',
        fontFamily: 'Comic Sans MS',
        fontSize: '24px'
      }}>
        {data.label}
      </div>
      
      {/* Start Date Display */}
      <div style={{
        position: 'absolute',
        left: '0',
        bottom: '-25px',
        fontFamily: 'Comic Sans MS',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        {startDateStr}
      </div>
      
      {/* End Date Display */}
      <div style={{
        position: 'absolute',
        right: '0',
        bottom: '-25px',
        fontFamily: 'Comic Sans MS',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        {endDateStr}
      </div>
    </div>
  );
};

export default TimelineNode;