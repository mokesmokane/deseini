import { useCallback, useRef } from 'react'
import { useDraftPlanMermaidContext } from '../contexts/DraftPlanContextMermaid'
import { Node, NodeDragHandler } from 'reactflow';
import { ensureDate, roundPositionToDay, getXPositionFromDate, getWidthBetweenDates, getDateFromXPosition } from '../hooks/utils';

export function useNodeEvents(nodes: Node[], 
    setNodes:  React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>,
    anchorDate: Date | undefined,
    TIMELINE_PIXELS_PER_DAY: number,
    setGenerateNode: (node: Node | null) => void,
    ) {
  const { sections, updateTaskStartDate } = useDraftPlanMermaidContext()
  
//   const anchor = useMemo(() => ensureDate(x0Date ?? timeline?.startDate), [x0Date, timeline])
    // Ref for debouncing drag updates
const dragUpdateTimers = useRef<Record<string, NodeJS.Timeout>>({});
  const onNodeDrag: NodeDragHandler = useCallback((_event, node) => {
      console.log('onNodeDrag', node);
      if(node.type === 'generate') {
        setGenerateNode(node);
        return;
      }
      if (node.type === 'task' || node.type === 'milestone') {
        const current = nodes.find(n => n.id === node.id);
        if (current) node.position.y = current.position.y;
        const baseX = 10;
        const rawX = node.position.x - baseX;
        const snappedRawX = roundPositionToDay(rawX, TIMELINE_PIXELS_PER_DAY);
        const snappedX = snappedRawX + baseX;
        node.position.x = snappedX;
        setNodes(nds => nds.map(n => n.id === node.id ? { ...n, position: { ...n.position, x: snappedX } } : n));
        // Debounce context update for root task
        if (anchorDate) {
          // Clear existing timer
          clearTimeout(dragUpdateTimers.current[node.id]);
        }
      }
    }, [nodes, setNodes, anchorDate, TIMELINE_PIXELS_PER_DAY]);

  const onNodeDragStop: NodeDragHandler = useCallback((_event, node) => {
      if ((node.type === 'task' || node.type === 'milestone') && anchorDate) {
        const baseX = 10;
        const rawX = node.position.x - baseX;
        const snappedRawX = roundPositionToDay(rawX, TIMELINE_PIXELS_PER_DAY); 
        const snappedX = snappedRawX + baseX;
        node.position.x = snappedX;
        const adjustedX = snappedRawX;
        const newDate = getDateFromXPosition(adjustedX, anchorDate, TIMELINE_PIXELS_PER_DAY);
        // Capture original start and duration before updating root
        const currentNode = nodes.find(n => n.id === node.id);
        const originalStart = currentNode ? ensureDate((currentNode.data as any).startDate) : null;
        const originalDuration = (currentNode?.data as any)?.duration;
        // Collect pending updates to context
        const pendingUpdates: { id: string; newStartDate: Date }[] = [];
        // Root update buffered
        pendingUpdates.push({ id: node.id, newStartDate: newDate });
        // Cascade move: downstream for future, upstream for past
        if (originalStart) {
          const movedEnd = node.type === 'milestone'
            ? newDate
            : (() => { const e = new Date(newDate); if (originalDuration) e.setDate(e.getDate() + originalDuration); return e; })();
          console.log(`Moving task ${node.id} from ${originalStart} to ${movedEnd}`);
          if (newDate.getTime() > originalStart.getTime()) {
            const processDownstream = (parentId: string, parentEnd: Date) => {
              for (const section of sections) {
                // Iterate dependent tasks and compare against latest start date
                for (const task of section.tasks.filter(task => task.dependencies?.includes(parentId))) {
                  const nodeInfo = nodes.find(n => n.id === task.id);
                  const currentChildStart = nodeInfo
                    ? ensureDate((nodeInfo.data as any).startDate)
                    : ensureDate(task.startDate!);
                  // Skip if child already starts at or after parent end
                  if (currentChildStart >= parentEnd) continue;
                  const childStart = new Date(parentEnd);
                  // Buffer child update
                  pendingUpdates.push({ id: task.id, newStartDate: childStart });
                  const childEnd = task.type === 'milestone' 
                    ? childStart 
                    : (() => { const e = new Date(childStart); if (task.duration) e.setDate(e.getDate() + task.duration); return e; })();
                  // Immediately update visual position for child
                  const rawChildX = getXPositionFromDate(childStart, anchorDate, TIMELINE_PIXELS_PER_DAY);
                  const snappedRawChildX = roundPositionToDay(rawChildX, TIMELINE_PIXELS_PER_DAY);
                  const childX = snappedRawChildX + baseX;
                  setNodes(nds => nds.map(n => n.id === task.id ? {
                    ...n,
                    position: { ...n.position, x: childX },
                    data: {
                      ...n.data,
                      startDate: childStart
                    }
                  } : n));
                  processDownstream(task.id, childEnd);
                }
              }
            };
            processDownstream(node.id, movedEnd);
          } else if (newDate.getTime() < originalStart.getTime()) {
            // Traverse actual parent tasks as defined in dependencies
            const processUpstream = (childId: string, childStart: Date) => {
              // Get dependencies (parent IDs) for this task
              const parentIds = sections.flatMap(section =>
                section.tasks.find(task => task.id === childId)?.dependencies ?? []
              );
              for (const parentId of parentIds) {
                // Find the parent task object
                const parentTask = sections.flatMap(sec => sec.tasks).find(task => task.id === parentId);
                if (!parentTask) continue;
                // Determine current parent end to skip non-overlapping moves
                const nodeInfo = nodes.find(n => n.id === parentId);
                const currentParentStart = nodeInfo
                  ? ensureDate((nodeInfo.data as any).startDate)
                  : ensureDate(parentTask.startDate);
                const currentParentDuration = nodeInfo
                  ? (nodeInfo.data as any).duration
                  : parentTask.duration ?? 0;
                const currentParentEnd = parentTask.type === 'milestone'
                  ? currentParentStart
                  : (() => { const e = new Date(currentParentStart); e.setDate(e.getDate() + currentParentDuration); return e; })();
                if (childStart >= currentParentEnd) continue;
                // Compute new parent end & start
                const parentEnd = new Date(childStart);
                const parentStart = parentTask.duration
                  ? (() => { const s = new Date(parentEnd); s.setDate(s.getDate() - parentTask.duration); return s; })()
                  : parentEnd;
                // Buffer parent update
                pendingUpdates.push({ id: parentId, newStartDate: parentStart });
                // Visual update for parent
                const rawParentX = getXPositionFromDate(parentStart, anchorDate, TIMELINE_PIXELS_PER_DAY);
                const snappedRawParentX = roundPositionToDay(rawParentX, TIMELINE_PIXELS_PER_DAY);
                const parentX = snappedRawParentX + baseX;
                setNodes(nds => nds.map(n => n.id === parentId ? {
                  ...n,
                  position: { ...n.position, x: parentX },
                  data: {
                    ...n.data,
                    startDate: parentStart
                  }
                } : n));
                // Recurse up the chain
                processUpstream(parentId, parentStart);
              }
            };
            processUpstream(node.id, newDate);
          }
        }
        setNodes(nds => nds.map(n => n.id === node.id ? {
          ...n,
          position: { ...n.position, x: snappedX },
          data: { ...n.data, startDate: newDate }
        } : n));
        // Apply all buffered context updates
        pendingUpdates.forEach(({ id, newStartDate }) => updateTaskStartDate(id, newStartDate));
        // Debug: log section spans after drag stop
        sections.forEach(section => {
          const spans = section.tasks.map(task => {
            const sd = ensureDate(task.startDate);
            const ed = task.type === 'milestone'
              ? sd
              : task.endDate
                ? ensureDate(task.endDate)
                : (task.duration
                  ? new Date(sd.getTime() + task.duration * 24 * 60 * 60 * 1000)
                  : sd);
            return { sd, ed };
          });
          const times = spans.flatMap(s => [s.sd.getTime(), s.ed.getTime()]);
          const secStart = new Date(Math.min(...times));
          const secEnd = new Date(Math.max(...times));
          const widthPx = getWidthBetweenDates(secStart, secEnd, TIMELINE_PIXELS_PER_DAY);
        });
      }
    }, [nodes, setNodes, sections, anchorDate, updateTaskStartDate, TIMELINE_PIXELS_PER_DAY]);

    return { onNodeDrag, onNodeDragStop };
}