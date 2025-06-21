import { useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow,
  type Node,
  type NodeTypes,
  SelectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useFlowStore from '../store/useFlowStore';

export interface NodeData {
  label: string;
  description?: string;
  type: 'llm' | 'function' | 'trigger';
}

export type CustomNode = Node<NodeData>;

const nodeTypes: NodeTypes = {
  llm: ({ data, selected }: { data: NodeData, selected?: boolean }) => (
    <div className={`px-4 py-3 shadow-md rounded-md bg-gray-800 border ${selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-700'} w-48 transition-all`}>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        <div className="text-xs font-medium text-gray-200">{data.label}</div>
      </div>
      {data.description && (
        <div className="mt-1 text-xs text-gray-400">{data.description}</div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-md"></div>
    </div>
  )
};

export interface FlowCanvasProps {
  onNodeSelect: (node: CustomNode | null) => void;
  selectedNodeId?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

export const FlowCanvas = ({ onNodeSelect, selectedNodeId, className = '', style = {} }: FlowCanvasProps) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { setViewport } = useReactFlow();
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useFlowStore();

  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: '#4B5563',
      strokeWidth: 2,
    },
  };

  const handleNodeClick = (_event: React.MouseEvent, node: CustomNode) => {
    onNodeSelect(node);
  };

  const handlePaneClick = () => {
    onNodeSelect(null);
  };



  useEffect(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  // Update selected node when selectedNodeId changes
  useEffect(() => {
    if (!selectedNodeId) {
      onNodeSelect(null);
      return;
    }
    
    const node = nodes.find(n => n.id === selectedNodeId);
    if (node) {
      onNodeSelect(node as CustomNode);
    }
  }, [selectedNodeId, nodes, onNodeSelect]);

  const handleAddNode = () => {
    const newNode: CustomNode = {
      id: `node-${Date.now()}`,
      type: 'llm',
      position: { x: 100, y: 100 },
      data: {
        label: 'New Node',
        type: 'llm',
        description: ''
      }
    };
    const { addNode } = useFlowStore.getState();
    addNode(newNode);
  };

  return (
    <div 
      className={`h-full w-full relative ${className}`}
      style={style}
      ref={reactFlowWrapper}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable
        nodesConnectable
        elementsSelectable
        defaultEdgeOptions={defaultEdgeOptions}
        snapToGrid={false}
        nodeExtent={[
          [-1000, -1000],
          [2000, 2000],
        ]}
        minZoom={0.2}
        maxZoom={2}
        defaultViewport={{ x: 50, y: 50, zoom: 1 }}
        translateExtent={[
          [-1000, -1000],
          [2000, 2000],
        ]}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        panOnScroll={false}
        panOnDrag={[0, 1, 2]} // Enable left, middle, and right mouse button for pan
        selectionOnDrag={false} // Disable selection drag
        selectionMode={SelectionMode.Partial}
        selectionKeyCode={'Shift'} // Only select with Shift key
        style={{
          backgroundColor: '#0f172a',
        }}
        onlyRenderVisibleElements={false}
      >
        <Background 
          color="#374151" 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1.5}
        />
        <Controls />
        {/* Node counter in top right */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 shadow-lg">
            <span className="font-medium">{nodes.length}</span> node{nodes.length !== 1 ? 's' : ''} • 
            <span className="font-medium">{edges.length}</span> edge{edges.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {/* Gradient Add Node button */}
        <div className="absolute bottom-6 right-6 z-10">
          <button
            onClick={handleAddNode}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:shadow-indigo-500/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 transition-transform duration-200 group-hover:rotate-180" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="font-semibold">Add Node</span>
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></span>
          </button>
        </div>
      </ReactFlow>
    </div>
  );
};

// Default export for backward compatibility
const FlowCanvasWrapper = () => {
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  
  return (
    <div className="flex-1 h-full">
      <FlowCanvas 
        onNodeSelect={setSelectedNode}
        selectedNodeId={selectedNode?.id}
      />
    </div>
  );
};

export default FlowCanvasWrapper;
