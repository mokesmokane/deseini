import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactFlow, {
  Background,
  ReactFlowInstance,
  Node,
  NodeMouseHandler,
  NodeProps,
  ResizeDragEvent,
  ResizeParams,
} from 'reactflow';
import { useDraftPlanFlow } from '../../contexts/useDraftPlanFlow';
import "react-datepicker/dist/react-datepicker.css";
import 'reactflow/dist/style.css';
import { useDraftPlanMermaidContext} from '../../contexts/DraftPlan/DraftPlanContextMermaid';
import TaskNode from './TaskNode';
import MilestoneNode from './MilestoneNode';
import TimelineNode from './TimelineNode';
import GenerateNode from './GenerateNode';
import { MermaidTaskData } from '@/types';
import SectionNode , { SectionNodeData } from './SectionNode';

function DraftPlanMermaid() {
  const { TIMELINE_PIXELS_PER_DAY, setTIMELINE_PIXELS_PER_DAY} = useDraftPlanMermaidContext();
  const [ reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const { nodes, edges, onNodesChange, timelineVisible, onResizeEnd, onNodeDrag, onNodeDragStop } = useDraftPlanFlow();


  // Track selected node and panel animation state
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [pendingNode, setPendingNode] = useState<Node | null>(null);
  const [isPanelVisible, setIsPanelVisible] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const animationTimeout = useRef<NodeJS.Timeout | null>(null);
  const ANIMATION_DURATION = 300; // ms, match CSS duration

  // Ref for the main container to get its size
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref to ensure we only center once per load
  const hasCentered = useRef(false);

  // Helper: Open settings panel and close node panel if open
  const handleOpenSettings = () => {
    if (isPanelVisible) {
      setIsPanelVisible(false);
      if (animationTimeout.current) clearTimeout(animationTimeout.current);
      animationTimeout.current = setTimeout(() => {
        setSelectedNode(null);
        setPendingNode(null);
        setSettingsOpen(true);
      }, ANIMATION_DURATION);
    } else {
      setSettingsOpen(true);
    }
  };

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
          setPendingNode(node);
          if (animationTimeout.current) clearTimeout(animationTimeout.current);
          animationTimeout.current = setTimeout(() => {
            setSelectedNode(node);
            setIsPanelVisible(true);
            setPendingNode(null);
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
      setPendingNode(node);
      if (animationTimeout.current) clearTimeout(animationTimeout.current);
      animationTimeout.current = setTimeout(() => {
        setSelectedNode(node);
        setIsPanelVisible(true);
        setPendingNode(null);
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
      setPendingNode(null);
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

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
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
          task: (props: NodeProps<MermaidTaskData>) => <TaskNode {...props} onResizeEnd={onResizeEnd} />,
          milestone: (props: NodeProps<any>) => <MilestoneNode {...props} />,
          timeline: (props: NodeProps<any>) => <TimelineNode {...props} />,
          generate: GenerateNode,
        }), [])}
        onInit={setReactFlowInstance}
        fitView
        onNodeClick={handleNodeClick}
      >
        <Background />
        {/* Settings FAB absolutely positioned in canvas */}
        <div style={{ position: 'absolute', top: 0, right: 0, zIndex: 20 }}>
          <button
            aria-label="Open settings"
            onClick={handleOpenSettings}
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: '#fff',
              color: '#111',
              border: '1px solid #e0e3e7',
              boxShadow: '0 2px 8px 0 rgba(60,72,88,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, background 0.2s',
              outline: 'none',
              padding: 0
            }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 16px 0 rgba(60,72,88,0.13)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = '0 2px 8px 0 rgba(60,72,88,0.10)'}
          >
            {/* Inline SVG Material Design settings gear icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09A1.65 1.65 0 0 0 11 3.09V3a2 2 0 0 1 4 0v.09c.38.16.73.38 1 .66.27.28.5.62.66 1v.09a1.65 1.65 0 0 0 1.51 1h.09a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
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

export default DraftPlanMermaid;
