import React, { memo } from 'react';
import { NodeResizeControl } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';

interface TaskData {
  label: string;
  width?: number;
  startDate: Date;
  duration: number;
  isVisible: boolean;
  hasDate: boolean;
  hasDuration: boolean;
}

const TaskNode = ({ data }: { data: TaskData }) => {
  const endDate = new Date(data.startDate);
  endDate.setDate(endDate.getDate() + data.duration);
  
  const width = data.hasDuration ? (data.width || data.duration * 30) : 60; // 30 pixels per day to match DraftPlan

  return (
    <div
      className="node"
      style={{
        position: 'relative',
        width: `${width}px`,
        height: '60px', // Fixed uniform height
        background: 'white',
        border: '2px solid black',
        borderRadius: '8px',
        padding: '10px 20px',
        fontFamily: 'Comic Sans MS',
        fontSize: '22px',
        textAlign: 'center',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
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
        title={data.label} // Add tooltip with full text
      >
        {data.label}
      </div>
    </div>
  );
};

export default memo(TaskNode);