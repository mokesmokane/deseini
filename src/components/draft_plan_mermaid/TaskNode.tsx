import { memo, useState } from 'react';
import { NodeResizeControl } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

interface TaskData {
  id: string;
  label: string;
  width?: number;
  startDate: Date;
  duration?: number;
  endDate?: Date;
  dependencies?: string[];
  sectionName: string;
  isVisible: boolean;
  hasDate: boolean;
  hasDuration: boolean;
}

const TaskNode = ({ data }: { data: TaskData }) => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Calculate the width based on duration
  const width = data.hasDuration ? (data.width || 60) : 60; // Default to 60px if no width/duration
  
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
  
  // Create formatted date strings for tooltip
  const startDateStr = formatDate(data.startDate);
  const endDateStr = data.endDate ? formatDate(data.endDate) : '';
  const durationStr = data.duration ? `${data.duration} days` : '';
  
  // Create dependencies string for tooltip
  const dependenciesStr = data.dependencies?.length 
    ? `Dependencies: ${data.dependencies.join(', ')}` 
    : '';
  
  // Complete tooltip text
  const tooltipText = `
    ${data.label}
    Start: ${startDateStr}
    ${endDateStr ? `End: ${endDateStr}` : ''}
    ${durationStr ? `Duration: ${durationStr}` : ''}
    ${dependenciesStr}
  `.trim();

  return (
    <div
      className="node"
      style={{
        position: 'relative',
        width: `${width}px`,
        height: '60px',
        background: 'white',
        border: '2px solid black',
        borderRadius: '8px',
        padding: '10px 20px',
        fontFamily: 'sans-serif',
        fontSize: '16px',
        textAlign: 'center',
        // transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        boxShadow: isDragging ? '0 4px 8px rgba(0,0,0,0.3)' : 'none',
      }}
      onMouseEnter={() => setShowSubMenu(true)}
      onMouseLeave={() => setShowSubMenu(false)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      title={tooltipText}
    >
      
      <NodeResizeControl 
        className="resize-control"
        style={{
          background: '#000',
          border: '2px solid white',
          borderRadius: '50%',
          width: '10px',
          height: '10px',
          position: 'absolute',
          right: '-6px',
          top: '-6px',
          opacity: 0,
          transition: 'opacity 0.3s'
        }}
        minWidth={100}
        minHeight={60}
      />
      
      <div 
        style={{
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {data.label}
      </div>
      
      {/* Task details panel that appears on hover (but not when dragging) */}
      {showSubMenu && !isDragging && (
        <div 
          style={{
            position: 'absolute',
            top: '-160px', // Position it well above the node
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            background: 'white',
            border: '1px solid black',
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 10,
            minWidth: '160px',
            textAlign: 'left',
            fontSize: '12px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.label}</div>
          <div>Start: {startDateStr}</div>
          {endDateStr && <div>End: {endDateStr}</div>}
          {durationStr && <div>Duration: {durationStr}</div>}
          {data.dependencies && data.dependencies.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <div>Dependencies:</div>
              <div style={{ paddingLeft: '8px' }}>
                {data.dependencies.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(TaskNode);
