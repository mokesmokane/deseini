// import { useCallback, useRef } from 'react'
// import { useDraftPlanMermaidContext } from '../contexts/DraftPlan/DraftPlanContextMermaid'
// import { Node, NodeDragHandler, ResizeDragEvent, ResizeParams } from 'reactflow';
// import { ensureDate, roundPositionToDay, getXPositionFromDate, getWidthBetweenDates, getDateFromXPosition } from '../hooks/utils';
// import { MermaidTaskData } from '@/types';
// import { SectionNodeData } from '@/components/draft_plan_mermaid/SectionNode';

// export function useNodeEvents(nodes: Node[], 
//     setNodes:  React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>,
//     anchorDate: Date | undefined,
//     TIMELINE_PIXELS_PER_DAY: number,
//     setGenerateNode: (node: Node | null) => void,
//     setDraggingNodeId: (id: string | null) => void
//     ) {
  
//     return { onNodeDrag, onNodeDragStop, onResizeEnd };
// }