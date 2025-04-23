import type { NodeProps } from 'reactflow';
import { NodeResizeControl, ResizeDragEvent, ResizeParams } from 'reactflow';
import { useDraftPlanMermaidContext } from '../../contexts/DraftPlan/DraftPlanContextMermaid';
import { useCallback, useEffect, useState } from 'react';
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
  console.log('MOKES ratio', ratio);
  // compute original duration spanning tasks (accounting for durations and milestones)
  for (const task of tasks) {
    console.log('MOKES task', task);
  }
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
  for (const update of updates) {
    console.log('MOKES update', update);
  }
  return { updates, downstreamUpdates: downstream };
}

const SectionNode: React.FC<SectionNodeProps> = ({ id, data }) => {
  const { TIMELINE_PIXELS_PER_DAY, sections, updateTaskStartDate, updateTaskDuration } = useDraftPlanMermaidContext();
  const {anchorDate} = useDraftPlanFlow();
  // const {setNodes, nodes} = useDraftPlanFlow();
  const [localWidth, setLocalWidth] = useState(data.duration * TIMELINE_PIXELS_PER_DAY);
  const [isResizing, setIsResizing] = useState(false);
  const [originalWidth, setOriginalWidth] = useState(data.duration * TIMELINE_PIXELS_PER_DAY);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    setLocalWidth(data.duration * TIMELINE_PIXELS_PER_DAY);
    setOriginalWidth(data.duration * TIMELINE_PIXELS_PER_DAY);
  }, [data.duration, TIMELINE_PIXELS_PER_DAY]);

    const onResizeEnd = useCallback(( _evt: ResizeDragEvent, _params: ResizeParams, ratio: number, data: SectionNodeData) => {      
      console.log('MOKES onResizeEndSection', sections);
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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{
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
        fontSize: '16px', // Match task font size
        fontWeight: 'bold',
        color: '#ffffff',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {data.label}
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
          console.log(`Original width: ${originalWidth}`);
          console.log(`New width: ${width}`);
          console.log(`Width change: ${widthChange}`);
          console.log(`Resizing section ${data.label} by ${widthChange}`);
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

export default SectionNode;
