import React, { useState, useEffect, memo, useRef } from 'react';
import { Handle, Position, NodeResizeControl, NodeProps } from 'reactflow';
import '@reactflow/node-resizer/dist/style.css';
import type { ResizeDragEvent, ResizeParams } from '@reactflow/node-resizer';
import { useDraftPlanMermaidContext } from '../../contexts/DraftPlan/DraftPlanContextMermaid';
import { MermaidTaskData } from '../../types';
import { Trash2, Edit2 } from 'lucide-react';

interface TaskNodeProps extends NodeProps<MermaidTaskData> {
  onResizeEnd: (event: ResizeDragEvent, params: ResizeParams, data: MermaidTaskData) => void;
  onLabelChange?: (id: string, newLabel: string) => void;
  onDeleteTask: (task: MermaidTaskData) => void;
  selected: boolean;
  isAnyLabelEditing: boolean;
  setIsAnyLabelEditing: (editing: boolean) => void;
}

const TaskNode: React.FC<TaskNodeProps> = ({ data, dragging, onResizeEnd, onLabelChange, selected, setIsAnyLabelEditing, onDeleteTask }) => {
  const [showSubMenu, setShowSubMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { TIMELINE_PIXELS_PER_DAY } = useDraftPlanMermaidContext();

  // Refs and state for overflow detection
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  
  // Calculate the width based on duration
  const initialWidth = data.hasDuration ? (data.width || 60) : 60;
  const [localWidth, setLocalWidth] = useState(initialWidth);
  useEffect(() => { setLocalWidth(initialWidth); }, [initialWidth]);
  
  // Inline label editing state
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label);
  const labelInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedLabel(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);

  // Check if label overflows its container
  useEffect(() => {
    if (containerRef.current && labelRef.current) {
      // Get exact measurements
      const containerWidth = containerRef.current.clientWidth;
      const labelWidth = labelRef.current.scrollWidth;
      
      // Minimal padding to account for borders
      const minPadding = 2; // Just enough to prevent text touching the border
      
      // Only set overflow if the text would touch the borders
      setIsOverflowing(labelWidth > containerWidth - minPadding);
    }
  }, [data.label, localWidth]);

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
  
  // Create dependencies string for tooltip
  const dependenciesStr = data.dependencies?.length 
    ? `Dependencies: ${data.dependencies.join(', ')}` 
    : '';
  
  // Complete tooltip text
  const tooltipText = `
    ${data.label}
    ${startDateStr}${endDateStr ? ` -> ${endDateStr}` : ''}
    ${dependenciesStr}
  `.trim();

  return (
    <div
      ref={containerRef}
      className="node"
      style={{
        overflow: 'visible',
        position: 'relative',
        width: `${localWidth}px`,
        height: '60px',
        background: selected ? 'rgba(0,0,0,0.06)' : 'white',
        border: selected ? '2.5px solid #222' : '2px solid black',
        borderRadius: '8px',
        // padding: '10px 20px',
        fontFamily: 'sans-serif',
        fontSize: '22px',
        textAlign: 'center',
        transition: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        boxShadow: selected ? '0 2px 8px rgba(0,0,0,0.06)' : (isDragging ? '0 4px 8px rgba(0,0,0,0.3)' : 'none'),
        zIndex: selected ? 12 : undefined,
      }}
      onMouseEnter={() => !dragging && setShowSubMenu(true)}
      onMouseLeave={() => setShowSubMenu(false)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      aria-label={tooltipText}
    >
      {/* Hidden label for measuring overflow */}
      <div
        ref={labelRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          visibility: 'hidden',
          whiteSpace: 'nowrap',
          // padding: '10px 20px',
          fontSize: '22px',
          fontWeight: 'bold',
        }}
      >
        {editedLabel}
      </div>
      
      <Handle type="target" position={Position.Left} style={{ background: '#555' }} />
      {showSubMenu && !dragging && (
        <NodeResizeControl
          nodeId={data.id}
          position="right"
          minWidth={TIMELINE_PIXELS_PER_DAY}
          minHeight={60}
          onResize={(_evt: ResizeDragEvent, { width }: ResizeParams) => setLocalWidth(width)}
          onResizeEnd={(evnt,params)=>{
            onResizeEnd(evnt,params,data);
          }}
          style={{
            top: '10px',
            width: '12px',
            height: '40px',
            background: 'gray',
            borderRadius: '4px',
            border: '1px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: 0.8
          }}
        />
      )}
      {showSubMenu && !dragging && (
        <div
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}
        >
          <button
            aria-label="Delete Task"
            onClick={()=>{onDeleteTask(data);}}
            disabled={isEditingLabel}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: isEditingLabel ? 'not-allowed' : 'pointer',
              opacity: isEditingLabel ? 0.4 : 1,
            }}
          >
            <Trash2 size={16} />
          </button>
          <button
            aria-label="Edit Task"
            onClick={() => { /* TODO: implement edit */ }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <Edit2 size={16} />
          </button>
        </div>
      )}
      
      {!isOverflowing && (
        <div 
          style={{
            width: '100%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
          }}
          onDoubleClick={() => {
            setIsEditingLabel(true);
            setIsAnyLabelEditing(true);
          }}
        >
          {isEditingLabel ? (
          <input
            ref={labelInputRef}
            type="text"
            value={editedLabel}
            onChange={e => setEditedLabel(e.target.value)}
            onBlur={() => {
              setIsEditingLabel(false);
              setIsAnyLabelEditing(false);
              const newLabel = editedLabel.trim();
              if (newLabel && newLabel !== data.label && onLabelChange) {
                onLabelChange(data.id, newLabel);
              } else if (!newLabel) {
                setEditedLabel(data.label); // Reset to last valid label if empty
              }
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setIsEditingLabel(false);
                setIsAnyLabelEditing(false);
                const newLabel = editedLabel.trim();
                if (newLabel && newLabel !== data.label && onLabelChange) {
                  onLabelChange(data.id, newLabel);
                } else if (!newLabel) {
                  setEditedLabel(data.label); // Reset to last valid label if empty
                }
              } else if (e.key === 'Escape') {
                setIsEditingLabel(false);
                setIsAnyLabelEditing(false);
                setEditedLabel(data.label);
              }
            }}
            style={{
              width: '100%',
              fontSize: '22px',
              // padding: '2px 6px',
              border: 'none', // No border when editing
              outline: 'none',
              background: 'white',
              color: 'black',
              fontWeight: 400,
              textAlign: 'center',
              boxShadow: 'none',
            }}
            maxLength={80}
          />
        ) : (
          <span
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'center',
              fontWeight: 400,
              color: 'black',
              background: 'transparent',
              letterSpacing: 0.1,
              userSelect: 'text',
              cursor: 'pointer',
            }}
          >
            {data.label}
          </span>
        )}
      </div>
      )}
      
      {/* Render label outside the node when overflowing */}
      {isOverflowing && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '100%',
            marginLeft: '8px',
            transform: 'translateY(-50%)',
            whiteSpace: 'nowrap',
            color: 'black',
            zIndex: 2,
            fontSize: '22px',
            cursor: 'pointer',
            background: 'transparent',
          }}
          onDoubleClick={() => {
            setIsEditingLabel(true);
            setIsAnyLabelEditing(true);
          }}
        >
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              type="text"
              value={editedLabel}
              onChange={e => setEditedLabel(e.target.value)}
              onBlur={() => {
                setIsEditingLabel(false);
                setIsAnyLabelEditing(false);
                const newLabel = editedLabel.trim();
                if (newLabel && newLabel !== data.label && onLabelChange) {
                  onLabelChange(data.id, newLabel);
                } else if (!newLabel) {
                  setEditedLabel(data.label);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setIsEditingLabel(false);
                  setIsAnyLabelEditing(false);
                  const newLabel = editedLabel.trim();
                  if (newLabel && newLabel !== data.label && onLabelChange) {
                    onLabelChange(data.id, newLabel);
                  } else if (!newLabel) {
                    setEditedLabel(data.label);
                  }
                } else if (e.key === 'Escape') {
                  setIsEditingLabel(false);
                  setIsAnyLabelEditing(false);
                  setEditedLabel(data.label);
                }
              }}
              style={{
                fontSize: '16px',
                padding: '2px 6px',
                border: 'none',
                outline: 'none',
                background: 'white',
                color: 'black',
                fontWeight: 400,
                textAlign: 'center',
                borderRadius: 4,
                width: 'auto',
                minWidth: 40,
                maxWidth: 220,
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              }}
              maxLength={60}
            />
          ) : (
            <span
              style={{
                cursor: 'pointer',
                background: 'transparent',
                color: 'black',
                fontWeight: 400,
                borderRadius: 4,
                padding: '0 2px',
                transition: 'background 0.2s',
                userSelect: 'text',
                fontSize: '22px',
              }}
              title={data.label}
            >
              {data.label}
            </span>
          )}
        </div>
      )}
      
      {/* Task details panel that appears on hover (but not when dragging) */}
      {showSubMenu && !dragging && (
        <div 
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '26px',
            whiteSpace: 'nowrap',
            zIndex: 9999
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{data.label}</div>
          <div>{startDateStr}{endDateStr && ` -> ${endDateStr}`}</div>
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
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} />
    </div>
  );
};

export default memo(TaskNode);
