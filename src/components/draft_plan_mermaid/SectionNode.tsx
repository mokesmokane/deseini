import type { NodeProps } from 'reactflow';
import { NodeResizeControl, ResizeDragEvent, ResizeParams } from 'reactflow';
import { useDraftPlanMermaidContext } from '../../contexts/DraftPlan/DraftPlanContextMermaid';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { useDraftPlanFlow } from '@/contexts/useDraftPlanFlow';

export interface SectionNodeData {
  label: string;
  duration: number;
}

interface SectionNodeProps extends NodeProps<SectionNodeData> {
}

export interface SectionTask {
  id: string;
  startDate: Date | string;
  duration?: number;
  type: 'task' | 'milestone' | undefined;
  endDate?: Date | string;
}

export interface ResizeSectionUpdate {
  id: string;
  newStartDate: Date;
  newDuration?: number;
}

export function calculateSectionResize(
  tasks: SectionTask[],
  ratio: number,
  anchorDate: Date,
  processDownstream: (
    id: string,
    end: Date,
    anchorDate: Date,
    limit: number,
    output: { id: string; newStartDate: Date }[]
  ) => void
): { updates: ResizeSectionUpdate[]; downstreamUpdates: { id: string; newStartDate: Date }[] } {
  if (!tasks || tasks.length === 0) return { updates: [], downstreamUpdates: [] };
  // compute original duration spanning tasks (accounting for durations and milestones)

  const ms = 1000 * 60 * 60 * 24;
  const minStartTime = Math.min(...tasks.map(t => new Date(t.startDate).getTime()));
  const maxEndTime = Math.max(...tasks.map(t => {
    const startTime = new Date(t.startDate).getTime();
    if (t.type === 'milestone') return startTime;
    if (t.endDate) return new Date(t.endDate).getTime();
    if (typeof t.duration === 'number') return startTime + t.duration * ms;
    return startTime;
  }));
  const originalDuration = (maxEndTime - minStartTime) / ms;
  let newDays = ratio * originalDuration;
  const minDays = tasks.length;
  if (newDays < minDays) newDays = minDays;
  const newRatio = newDays / originalDuration;
  const startDate = new Date(Math.min(...tasks.map(t => new Date(t.startDate).getTime())));
  type Internal = { id: string; start: Date; dur?: number; end: Date };
  const initial: Internal[] = tasks.map(t => {
    const orig = new Date(t.startDate);
    const off = Math.round((orig.getTime() - startDate.getTime()) / ms);
    const newOff = Math.round(off * newRatio);
    const start = new Date(startDate);
    start.setDate(start.getDate() + newOff);
    const dur = t.type !== 'milestone' ? Math.max(1, Math.round((t.duration || 0) * newRatio)) : undefined;
    const end = new Date(start);
    if (dur) end.setDate(end.getDate() + dur);
    return { id: t.id, start, dur, end };
  });
  const updates = initial.map(item => ({
    id: item.id,
    newStartDate: item.start,
    ...(item.dur ? { newDuration: item.dur } : {})
  }));
  const downstream: { id: string; newStartDate: Date }[] = [];
  initial.forEach(item => processDownstream(item.id, item.end, anchorDate, 10, downstream));
  return { updates, downstreamUpdates: downstream };
}

// SectionNode component with fixed label editing functionality
const SectionNode: React.FC<SectionNodeProps> = ({ id, data }) => {
  const { TIMELINE_PIXELS_PER_DAY, sections, updateTaskStartDate, updateTaskDuration, updateSectionLabel } = useDraftPlanMermaidContext();
  const {anchorDate} = useDraftPlanFlow();
  const [localWidth, setLocalWidth] = useState(data.duration * TIMELINE_PIXELS_PER_DAY);
  const [isResizing, setIsResizing] = useState(false);
  const [originalWidth, setOriginalWidth] = useState(data.duration * TIMELINE_PIXELS_PER_DAY);
  const [isHovering, setIsHovering] = useState(false);
  // refs and state for overflow detection
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Local editing state for label
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [editedLabel, setEditedLabel] = useState(data.label);
  const labelInputRef = useRef<HTMLInputElement>(null);
  
  // Track if we've just updated the label to avoid overwriting with old data
  const labelJustUpdatedRef = useRef(false);

  useEffect(() => {
    setLocalWidth(data.duration * TIMELINE_PIXELS_PER_DAY);
    setOriginalWidth(data.duration * TIMELINE_PIXELS_PER_DAY);
  }, [data.duration, TIMELINE_PIXELS_PER_DAY]);

  useEffect(() => {
    // Only update the editedLabel from props if we haven't just updated it ourselves
    if (!labelJustUpdatedRef.current) {
      setEditedLabel(data.label);
    } else {
      // Reset the flag after we've processed the update
      labelJustUpdatedRef.current = false;
    }
  }, [data.label]);

  // check if label overflows its container
  useEffect(() => {
    if (containerRef.current && labelRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const labelWidth = labelRef.current.scrollWidth;
      setIsOverflowing(labelWidth > containerWidth);
    }
  }, [data.label, localWidth]);

  useEffect(() => {
    if (isEditingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [isEditingLabel]);



  const onResizeEnd = useCallback(( _evt: ResizeDragEvent, _params: ResizeParams, ratio: number, data: SectionNodeData) => {      
    const sec = sections.find(s => s.name === data.label);
    if (!sec) return;
    // Delegate to pure calculation
    const { updates, downstreamUpdates } = calculateSectionResize(
      sec.tasks.map(t => ({ id: t.id, startDate: t.startDate, duration: t.duration, type: t.type })),
      ratio,
      anchorDate!,
      ()=>{}
    );
    // Apply direct updates
    updates.forEach(u => {
      updateTaskStartDate(u.id, u.newStartDate);
      if (u.newDuration !== undefined) updateTaskDuration(u.id, u.newDuration);
    });
    // Apply downstream updates
    downstreamUpdates.forEach(u => updateTaskStartDate(u.id, u.newStartDate));
  }, [sections, anchorDate, updateTaskStartDate, updateTaskDuration]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
        position: 'relative',
        width: `${localWidth}px`,
        height: '60px', // Match task height exactly
        borderRadius: '8px', // Match task border radius
        background: '#000000',
        border: '2px solid #ffffff', // Match task border thickness
        opacity: 1, // Always visible
        transition: isResizing ? 'none' : 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 20px', // Match task padding
        fontSize: '22px', // Match task font size
        fontWeight: 'bold',
        color: '#ffffff',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        textOverflow: 'ellipsis',
      }}
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
          padding: '10px 20px',
          fontSize: '22px',
          fontWeight: 'bold',
        }}
      >
        {editedLabel}
      </div>
      {/* Inline editable label, TaskNode style */}
      {!isOverflowing && (
        <div
          style={{
            width: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center',
            cursor: 'pointer',
          }}
          onDoubleClick={() => setIsEditingLabel(true)}
        >
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              type="text"
              value={editedLabel}
              onChange={e => setEditedLabel(e.target.value)}
              onBlur={() => {
                setIsEditingLabel(false);
                const newLabel = editedLabel.trim();
                if (newLabel && newLabel !== data.label) {
                  // Set the flag to prevent our useEffect from overwriting with old data
                  labelJustUpdatedRef.current = true;
                  // Update the edited label to match what we're sending to the context
                  setEditedLabel(newLabel);
                  // Update the section label in the context
                  updateSectionLabel(data.label, newLabel);
                } else if (!newLabel) {
                  setEditedLabel(data.label);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setIsEditingLabel(false);
                  const newLabel = editedLabel.trim();
                  if (newLabel && newLabel !== data.label) {
                    // Set the flag to prevent our useEffect from overwriting with old data
                    labelJustUpdatedRef.current = true;
                    // Update the edited label to match what we're sending to the context
                    setEditedLabel(newLabel);
                    // Update the section label in the context
                    updateSectionLabel(data.label, newLabel);
                  } else if (!newLabel) {
                    setEditedLabel(data.label);
                  }
                } else if (e.key === 'Escape') {
                  setIsEditingLabel(false);
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
                fontWeight: 500,
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
                color: '#fff',
                fontWeight: 700,
                borderRadius: 4,
                padding: '0 2px',
                transition: 'background 0.2s',
                userSelect: 'text',
              }}
              title={data.label}
            >
              {data.label}
            </span>
          )}
        </div>
      )}
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
            fontWeight: 'bold',
            cursor: 'pointer',
            background: 'transparent',
          }}
          onDoubleClick={() => setIsEditingLabel(true)}
        >
          {isEditingLabel ? (
            <input
              ref={labelInputRef}
              type="text"
              value={editedLabel}
              onChange={e => setEditedLabel(e.target.value)}
              onBlur={() => {
                setIsEditingLabel(false);
                const newLabel = editedLabel.trim();
                if (newLabel && newLabel !== data.label) {
                  // Set the flag to prevent our useEffect from overwriting with old data
                  labelJustUpdatedRef.current = true;
                  // Update the edited label to match what we're sending to the context
                  setEditedLabel(newLabel);
                  // Update the section label in the context
                  updateSectionLabel(data.label, newLabel);
                } else if (!newLabel) {
                  setEditedLabel(data.label);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  setIsEditingLabel(false);
                  const newLabel = editedLabel.trim();
                  if (newLabel && newLabel !== data.label) {
                    // Set the flag to prevent our useEffect from overwriting with old data
                    labelJustUpdatedRef.current = true;
                    // Update the edited label to match what we're sending to the context
                    setEditedLabel(newLabel);
                    // Update the section label in the context
                    updateSectionLabel(data.label, newLabel);
                  } else if (!newLabel) {
                    setEditedLabel(data.label);
                  }
                } else if (e.key === 'Escape') {
                  setIsEditingLabel(false);
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
                fontWeight: 500,
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
                fontWeight: 700,
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
      {isHovering && (
        <NodeResizeControl
        nodeId={id}
        position="right"
        minWidth={TIMELINE_PIXELS_PER_DAY}
        minHeight={60}
        onResizeStart={() => setIsResizing(true)}
        onResize={(_evt: ResizeDragEvent, { width }: ResizeParams)=>{
          setIsResizing(true);
          setLocalWidth(width)}
        }
        onResizeEnd={(evnt,params)=>{
          const width = params.width;
          //figure out % change in width
          const widthChange = width / originalWidth;
          setLocalWidth(width);
          setIsResizing(false);
          onResizeEnd(evnt,params,widthChange,data);
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
    </div>
  );
}


// Component now uses inline editing without a separate editor component



export default SectionNode;
