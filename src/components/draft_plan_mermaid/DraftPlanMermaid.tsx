import { useState, useMemo, useEffect, useRef, KeyboardEvent, useCallback } from 'react';
import ReactFlow, {
  Background,
  ReactFlowInstance,
  Node,
  NodeMouseHandler,
  NodeProps,
  Edge,
  EdgeMouseHandler
} from 'reactflow';
import type { Connection } from 'reactflow';
import { useDraftPlanFlow } from '../../contexts/useDraftPlanFlow';
import "react-datepicker/dist/react-datepicker.css";
import 'reactflow/dist/style.css';
import { useDraftPlanMermaidContext} from '../../contexts/DraftPlan/DraftPlanContextMermaid';
import TaskNode from './TaskNode';
import MilestoneNode from './MilestoneNode';
import TimelineNode from './TimelineNode';
import { MermaidTaskData } from '@/types';
import SectionNode , { SectionNodeData } from './SectionNode';

function DraftPlanMermaid() {
  const [isAnyLabelEditing, setIsAnyLabelEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteTask } = useDraftPlanMermaidContext();



  const { 
    TIMELINE_PIXELS_PER_DAY, 
    setTIMELINE_PIXELS_PER_DAY,
    settingsOpen,
    setSettingsOpen
  } = useDraftPlanMermaidContext();
  const [ reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { nodes, edges, onNodesChange, onRenameNode, timelineVisible, onResizeEnd, onNodeDrag, onNodeDragStop, deleteDependencyEdge, addDependencyEdge } = useDraftPlanFlow();


  // Track selected node and panel animation state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const animationTimeout = useRef<NodeJS.Timeout | null>(null);
  const ANIMATION_DURATION = 300; // ms, match CSS duration

  // Track selected edge for deletion
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Ref for the main container to get its size
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to ensure we only center once per load
  const hasCentered = useRef(false);

  // ...existing hooks
  // Handler to update a node label
  const handleNodeLabelChange = (nodeId: string, newLabel: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    onRenameNode(nodeId, newLabel);
  };

  // Handler for edge click
  const handleEdgeClick: EdgeMouseHandler = (_event, edge) => {
    setSelectedEdge(edge);
  };

  // Keyboard handler for delete (edge or node)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent | KeyboardEventInit) => {
      if ((e.key === 'Delete' || e.key === 'Backspace')) {
        if (isAnyLabelEditing) return; // Prevent deletion while editing labels
        if (selectedEdge) {
          // Remove the edge (dependency)
          deleteDependencyEdge(selectedEdge.source, selectedEdge.target);
          setSelectedEdge(null);
        } else if (selectedNode && selectedNode.type !== 'section') {
          setShowDeleteDialog(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [selectedEdge, selectedNode, deleteDependencyEdge, isAnyLabelEditing]);

  // Helper: Open settings panel and close node panel if open
  // const handleOpenSettings = () => {
  //   if (isPanelVisible) {
  //     setIsPanelVisible(false);
  //     if (animationTimeout.current) clearTimeout(animationTimeout.current);
  //     animationTimeout.current = setTimeout(() => {
  //       setSelectedNode(null);
  //       setSettingsOpen(true);
  //     }, ANIMATION_DURATION);
  //   } else {
  //     setSettingsOpen(true);
  //   }
  // };

  // Helper: Open node panel and close settings if open
  const handleNodeClick: NodeMouseHandler = (_event, node) => {
    if (node.type === 'generate') return; // Do not open panel for generator node
    if (settingsOpen) {
      setSettingsOpen(false);
      if (animationTimeout.current) clearTimeout(animationTimeout.current);
      animationTimeout.current = setTimeout(() => {
        // Now open node panel
        if (selectedNode && node.id !== selectedNode.id) {
          setIsPanelVisible(false);
          if (animationTimeout.current) clearTimeout(animationTimeout.current);
          animationTimeout.current = setTimeout(() => {
            setSelectedNode(node);
            setIsPanelVisible(true);
          }, ANIMATION_DURATION);
        } else if (!selectedNode) {
          setSelectedNode(node);
          setIsPanelVisible(true);
        }
      }, ANIMATION_DURATION);
      return;
    }
    if (selectedNode && node.id !== selectedNode.id) {
      setIsPanelVisible(false);
      if (animationTimeout.current) clearTimeout(animationTimeout.current);
      animationTimeout.current = setTimeout(() => {
        setSelectedNode(node);
        setIsPanelVisible(true);
      }, ANIMATION_DURATION);
    } else if (!selectedNode) {
      setSelectedNode(node);
      setIsPanelVisible(true);
    }
    // If clicking the same node, do nothing
  };

  // Close panel
  const handleClosePanel = () => {
    setIsPanelVisible(false);
    if (animationTimeout.current) clearTimeout(animationTimeout.current);
    animationTimeout.current = setTimeout(() => {
      setSelectedNode(null);
    }, ANIMATION_DURATION);
  };

  useEffect(() => {
    if (
      reactFlowInstance &&
      nodes.length > 0 &&
      !hasCentered.current
    ) {
      // Get bounding box of all nodes
      const xs = nodes.map(n => n.position.x);
      const ys = nodes.map(n => n.position.y);
      const widths = nodes.map(n => n.width || 0);
      const heights = nodes.map(n => n.height || 0);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs.map((x, i) => x + widths[i]));
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys.map((y, i) => y + heights[i]));
      const chartWidth = maxX - minX;
      const chartHeight = maxY - minY;

      // Use container size from ref
      const container = containerRef.current;
      const containerWidth = container?.clientWidth || window.innerWidth;
      const containerHeight = container?.clientHeight || window.innerHeight;

      // Calculate center offset
      const zoom = 0.7; // You can adjust this
      const centerX = minX + chartWidth / 2;
      const centerY = minY + chartHeight / 2;
      const viewportX = containerWidth / 2 - centerX * zoom;
      const viewportY = containerHeight / 2 - centerY * zoom;

      reactFlowInstance.setViewport({
        x: viewportX,
        y: viewportY,
        zoom,
      });
      hasCentered.current = true;
    }
    return () => {
      if (animationTimeout.current) clearTimeout(animationTimeout.current);
    };
  }, [reactFlowInstance, timelineVisible]);

  // Reset centering flag if timelineVisible changes (e.g., new chart loaded)
  useEffect(() => {
    hasCentered.current = false;
  }, [timelineVisible]);

  // Handler for connecting nodes (adding dependency)
  const handleConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      addDependencyEdge(connection.source, connection.target);
    }
  }, [addDependencyEdge]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px', position: 'relative' }}>
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedNode && (
        <DeleteDialog
          label={selectedNode.data?.label}
          type={selectedNode.type === 'milestone' ? 'Milestone' : 'Task'}
          onCancel={() => setShowDeleteDialog(false)}
          onDelete={async () => {
            await deleteTask(selectedNode.id);
            setShowDeleteDialog(false);
            setSelectedNode(null);
            setIsPanelVisible(false);
          }}
        />
      )}


      <ReactFlow
        nodes={nodes}
        edges={edges.map(edge => selectedEdge && edge.id === selectedEdge.id ? {
          ...edge,
          style: {
            ...(edge.style || {}),
            stroke: 'black',
            strokeWidth: 4,
            opacity: 1,
          },
        } : edge)}
        onNodesChange={onNodesChange}
        onNodeDrag={(...args) => { onNodeDrag(...args); }}
        onNodeDragStop={(...args) => { onNodeDragStop(...args); }}
        nodesDraggable={true}
        elementsSelectable={true}
        panOnScroll={false}
        selectionOnDrag={false}
        selectNodesOnDrag={false}
        zoomOnScroll={true}
        nodeTypes={useMemo(() => ({
           section: (props: NodeProps<SectionNodeData>) => <SectionNode {...props} />, 
           task: (props: NodeProps<MermaidTaskData>) => <TaskNode {...props} onResizeEnd={onResizeEnd} onLabelChange={handleNodeLabelChange} isAnyLabelEditing={isAnyLabelEditing} setIsAnyLabelEditing={setIsAnyLabelEditing} />, 
           milestone: (props: NodeProps<any>) => <MilestoneNode {...props} onLabelChange={handleNodeLabelChange} isAnyLabelEditing={isAnyLabelEditing} setIsAnyLabelEditing={setIsAnyLabelEditing} />, 
           timeline: (props: NodeProps<any>) => <TimelineNode {...props} />, 
         }), [])}
        onInit={setReactFlowInstance}
        fitView
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
      >
        <Background />
        {/* Settings Panel - right-side sliding panel, matches node panel */}
        <div
          className={`fixed top-0 right-0 h-screen z-50 transition-transform duration-300 ease-in-out transform ${settingsOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{
            width: '400px',
            maxWidth: '95vw',
            padding: '24px 24px 0px 24px',
            height: 'calc(100vh - 16px)',
            pointerEvents: settingsOpen ? 'auto' : 'none',
          }}
        >
          <div
            className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden"
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
              <button
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '2rem', color: '#222', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', color: '#111' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1.5rem' }}>Settings</h2>
              {/* Day Width Slider */}
              <div style={{marginBottom:24}}>
                <label style={{fontSize:14,color:'#111',marginBottom:8,display:'block'}}>Day Width: {TIMELINE_PIXELS_PER_DAY}px</label>
                <input
                  type="range"
                  min={30}
                  max={150}
                  step={30}
                  value={TIMELINE_PIXELS_PER_DAY}
                  onChange={e => setTIMELINE_PIXELS_PER_DAY(Number(e.target.value))}
                  style={{width:'100%'}}
                />
              </div>
            </div>
          </div>
        </div>
      </ReactFlow>
      {/* Right-side panel for node details */}
      <div 
        className={`fixed top-0 right-0 h-screen z-40 transition-transform duration-300 ease-in-out transform ${isPanelVisible ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          width: '400px',
          maxWidth: '95vw',
          padding: '24px 24px 0px 24px',
          height: 'calc(100vh - 16px)',
        }}
      >
        <div 
          className="h-full bg-white rounded-2xl border border-gray-200 overflow-hidden"
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem' }}>
            <button
              aria-label="Close panel"
              onClick={handleClosePanel}
              style={{ background: 'none', border: 'none', fontSize: '2rem', color: '#222', cursor: 'pointer' }}
            >
              &times;
            </button>
          </div>
          <div style={{ padding: '2rem', flex: 1, overflowY: 'auto', color: '#111' }}>
            {selectedNode ? (
              <>
                <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: '1rem' }}>{selectedNode.data?.label || 'Node'}</h2>
                <div style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
                  <strong>Type:</strong> {selectedNode.type}
                </div>
                {/* Add more node details here as needed */}
                <pre style={{ background: '#f8f8f8', padding: '1rem', borderRadius: '10px', fontSize: '0.9rem', color: '#222', overflowX: 'auto' }}>
                  {JSON.stringify(selectedNode.data, null, 2)}
                </pre>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// DeleteDialog: Keyboard accessible, clean/modern, black/white
function DeleteDialog({ label, type, onCancel, onDelete }: { label: string, type: string, onCancel: () => void, onDelete: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown as any);
    return () => window.removeEventListener('keydown', handleKeyDown as any);
  }, [onCancel, onDelete]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.35)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        color: '#111',
        borderRadius: '16px',
        boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
        padding: '2.5rem 2rem 2rem 2rem',
        minWidth: 320,
        maxWidth: '90vw',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>
          Delete {type}?
        </div>
        <div style={{ fontSize: 16, marginBottom: 20, color: '#333' }}>
          Are you sure you want to delete "{label}"? This cannot be undone.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 28px',
              borderRadius: 8,
              border: '1.5px solid #000',
              background: '#fff',
              color: '#000',
              fontWeight: 500,
              fontSize: 16,
              cursor: 'pointer',
              marginRight: 8,
              transition: 'background 0.15s',
            }}
          >Cancel</button>
          <button
            onClick={onDelete}
            style={{
              padding: '10px 28px',
              borderRadius: 8,
              border: 'none',
              background: '#000',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >Delete</button>
        </div>
      </div>
    </div>
  );
}

export default DraftPlanMermaid;

