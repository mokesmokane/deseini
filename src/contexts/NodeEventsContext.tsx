// import React, { createContext, useContext, ReactNode } from 'react';
// import { Node, NodeDragHandler, ResizeDragEvent, ResizeParams } from 'reactflow';
// import { useNodeEvents } from '../hooks/useNodeEvents';
// import { MermaidTaskData } from '@/types';

// interface NodeEventsContextValue {
//   onNodeDrag: NodeDragHandler;
//   onNodeDragStop: NodeDragHandler;
//   onResizeEnd: (evt: ResizeDragEvent, params: ResizeParams, data: MermaidTaskData) => void;
// }

// const NodeEventsContext = createContext<NodeEventsContextValue>({} as NodeEventsContextValue);

// interface NodeEventsProviderProps {
//   nodes: Node<any, string | undefined>[];
//   setNodes: React.Dispatch<React.SetStateAction<Node<any, string | undefined>[]>>;
//   anchorDate?: Date;
//   TIMELINE_PIXELS_PER_DAY: number;
//   setGenerateNode: (node: Node<any, string | undefined> | null) => void;
//   setDraggingNodeId: (id: string | null) => void;
//   sections: Section[];
//   updateTaskStartDate: (id: string, startDate: Date) => void;
//   updateTaskDuration: (id: string, duration: number) => void;
//   children: ReactNode;
// }

// export const NodeEventsProvider: React.FC<NodeEventsProviderProps> = ({
//   nodes,
//   setNodes,
//   anchorDate,
//   TIMELINE_PIXELS_PER_DAY,
//   setGenerateNode,
//   setDraggingNodeId,
//   children,
// }) => {
//   const { onNodeDrag, onNodeDragStop, onResizeEnd } = useNodeEvents(
//     nodes,
//     setNodes,
//     anchorDate,
//     TIMELINE_PIXELS_PER_DAY,
//     setGenerateNode,
//     setDraggingNodeId,
//     sections,
//     updateTaskStartDate,
//     updateTaskDuration
//   );

//   return (
//     <NodeEventsContext.Provider value={{ onNodeDrag, onNodeDragStop, onResizeEnd }}>
//       {children}
//     </NodeEventsContext.Provider>
//   );
// };

// export const useNodeEventsContext = (): NodeEventsContextValue => {
//   const context = useContext(NodeEventsContext);
//   if (!context) {
//     throw new Error('useNodeEventsContext must be used within a NodeEventsProvider');
//   }
//   return context;
// };
