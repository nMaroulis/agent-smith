import React, { useRef, memo, useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type NodeProps,
  type OnNodesChange,
  type OnEdgesChange,
  type DefaultEdgeOptions,
  type NodeTypes,
  type MarkerType,
  type ConnectionLineType,
  type OnConnectStartParams,
  type OnConnectEnd,
  type OnConnectStart,
  type OnError,
  type Connection,
  type Edge,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import useFlowStore, { type NodeData, type NodeType } from '../store/useFlowStore';

type CustomNode = Node<NodeData> & {
  type: NodeType;
};

type NodeTypeColors = {
  [key in NodeType]: {
    bg: string;
    border: string;
    text: string;
  };
};

// Memoized Node Component with connection handles
const NodeComponent = memo(({ data, selected, isConnectable }: NodeProps<NodeData>) => {
  const nodeTypeColors: NodeTypeColors = {
    llm: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
    function: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400' },
    trigger: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
    start: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400' },
    end: { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-400' }
  };
  
  const colors = nodeTypeColors[data.type] || nodeTypeColors.llm;
  
  // Special rendering for start/end nodes
  const nodeType = data.type;
  if (nodeType === 'start' || nodeType === 'end') {
    const isStart = data.type === 'start';
    const nodeColors = isStart 
      ? { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400' }
      : { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-400' };
      
    return (
      <div className={`relative w-40 h-16 ${selected ? 'scale-105' : 'scale-100'} transition-transform duration-200`}>
        {/* Target handle for end node */}
        {!isStart && (
          <Handle
            type="target"
            position={Position.Left}
            className="w-3 h-3 -left-1.5"
            style={{ backgroundColor: '#3b82f6' }}
            isConnectable={isConnectable}
          />
        )}
        
        <div 
          className={`relative z-10 w-full h-full flex items-center justify-center ${nodeColors.bg} ${nodeColors.border} border-2 ${
            selected ? `ring-4 ${nodeColors.border}/30` : ''
          }`}
          style={{
            clipPath: 'polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%)',
            transform: 'scale(0.9)'
          }}
        >
          <div className="text-white font-semibold text-sm">
            {isStart ? 'START' : 'END'}
          </div>
        </div>
        
        {/* Source handle for start node */}
        {isStart && (
          <Handle
            type="source"
            position={Position.Right}
            className="w-3 h-3 -right-1.5"
            style={{ backgroundColor: '#10b981' }}
            isConnectable={isConnectable}
          />
        )}
      </div>
    );
  }
  
  // Regular node rendering
  return (
    <div className={`relative w-56 transition-all duration-200 ${selected ? 'scale-105' : 'scale-100'}`}>
      {/* Left handle (target) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-10">
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 -left-1.5"
          style={{ backgroundColor: '#3b82f6' }}
          isConnectable={isConnectable}
        />
      </div>
      
      {/* Node content */}
      <div 
        className={`relative z-0 w-full p-4 rounded-lg ${colors.bg} ${colors.border} border-2 ${
          selected ? `ring-4 ${colors.border}/30` : ''
        }`}
      >
        <div className="text-white font-medium mb-1">{data.label}</div>
        {data.description && (
          <div className="text-xs text-white/70">{data.description}</div>
        )}
        
        {data.type === 'llm' && data.llm && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs font-medium text-white/80">
              {data.llm.providerName || 'LLM'}
            </div>
            <div className="text-xs text-white/60">
              {data.llm.modelName || 'Select a model'}
            </div>
          </div>
        )}
        
        {data.type === 'function' && data.function && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs font-medium text-white/80">
              {data.function.name}
            </div>
            <div className="text-xs text-white/60">
              {data.function.description || 'No description'}
            </div>
          </div>
        )}
      </div>
      
      {/* Right handle (source) */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center z-10">
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 -right-1.5"
          style={{ backgroundColor: '#10b981' }}
          isConnectable={isConnectable}
        />
      </div>
    </div>
  );
});

interface FlowCanvasProps {
  onNodeSelect?: (node: CustomNode | null) => void;
  selectedNodeId?: string | null;
  className?: string;
  style?: React.CSSProperties;
}

const FlowCanvas: React.FC<FlowCanvasProps> = ({
  onNodeSelect,
  selectedNodeId,
  className = '',
  style,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, addNode, onNodesChange, onEdgesChange, addEdge } = useFlowStore();

  const handleConnect = useCallback((connection: Connection) => {
    console.log('Connecting nodes:', connection);
    
    // Prevent connection from source to itself
    if (connection.source === connection.target) {
      console.log('Cannot connect to self');
      return;
    }
    
    // Create a new edge with proper typing
    const newEdge: Edge = {
      ...connection,
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      animated: true,
      markerEnd: { type: 'arrowclosed' as MarkerType, color: '#94a3b8' },
    };
    
    addEdge(newEdge);
  }, [addEdge]);

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    onNodeSelect?.(node as CustomNode);
  }, [onNodeSelect]);

  const handlePaneClick = useCallback((event: React.MouseEvent) => {
    console.log('Pane clicked');
    onNodeSelect?.(null);
  }, [onNodeSelect]);

  const createNode = useCallback((type: NodeType, position: { x: number; y: number }): CustomNode => {
    const id = `${type}-${Date.now()}`;
    const baseNode: CustomNode = {
      id,
      type,
      position,
      data: {
        label: type.charAt(0).toUpperCase() + type.slice(1) + (['start', 'end'].includes(type) ? '' : ' Node'),
        type,
      },
    };

    switch (type) {
      case 'llm':
        return {
          ...baseNode,
          data: {
            ...baseNode.data,
            llm: {
              provider: '',
              providerName: '',
              model: '',
              modelName: '',
            },
          },
        };
      case 'function':
        return {
          ...baseNode,
          data: {
            ...baseNode.data,
            function: {
              name: 'function_name',
              description: 'Function description',
            },
          },
        };
      case 'trigger':
      case 'start':
      case 'end':
      default:
        return baseNode;
    }
  }, []);

  const handleAddNode = useCallback((type: NodeType = 'llm') => {
    if (!reactFlowWrapper.current) return;

    const { left, top } = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: window.innerWidth / 2 - left - 100,
      y: window.innerHeight / 2 - top - 50,
    };

    const newNode = createNode(type, position);
    addNode(newNode);
  }, [createNode, addNode]);

  const memoizedNodes = useMemo(() => nodes, [nodes]);
  const memoizedEdges = useMemo(() => edges, [edges]);

  const nodeTypes: NodeTypes = useMemo(() => ({
    default: NodeComponent,
    llm: NodeComponent,
    function: NodeComponent,
    trigger: NodeComponent,
    start: NodeComponent,
    end: NodeComponent,
  }), []);

  const defaultEdgeOptions: DefaultEdgeOptions = useMemo(() => ({
    type: 'smoothstep',
    style: { stroke: '#94a3b8', strokeWidth: 2 },
    animated: true,
    markerEnd: { type: 'arrowclosed' as MarkerType, color: '#94a3b8' },
  }), []);

  const connectionLineStyle = useMemo(() => ({
    stroke: '#94a3b8',
    strokeWidth: 2,
  }), []);

  const onConnectStart: OnConnectStart = useCallback((_, params: OnConnectStartParams) => {
    console.log('Connect start:', params);
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback((event) => {
    console.log('Connect end:', event);
  }, []);

  const onError: OnError = useCallback((code, message) => {
    console.error('ReactFlow error:', code, message);
  }, []);

  const isValidConnection = useCallback((connection: Connection) => {
    console.log('Validating connection:', connection);
    // Prevent connection from source to itself
    if (connection.source === connection.target) {
      console.log('Cannot connect to self');
      return false;
    }
    // Allow all other connections for now
    return true;
  }, []);

  return (
    <div className={`h-full w-full relative ${className}`} ref={reactFlowWrapper} style={style}>
      <ReactFlow
        nodes={memoizedNodes}
        edges={memoizedEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange as OnNodesChange}
        onEdgesChange={onEdgesChange as OnEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        connectionRadius={30}
        fitView
        minZoom={0.1}
        maxZoom={2}
        nodeOrigin={[0.5, 0.5]}
        proOptions={{ hideAttribution: true }}
        snapToGrid
        snapGrid={[15, 15]}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectNodesOnDrag
        connectionLineType="smoothstep"
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        onEdgeUpdateStart={() => console.log('Edge update started')}
        onEdgeUpdateEnd={() => console.log('Edge update ended')}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        isValidConnection={isValidConnection}
        onError={onError}
      >
        <Background
          gap={16}
          color="#64748b"
          style={{ backgroundColor: 'rgb(15, 23, 42)' }}
        />
        <Controls
          style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          }}
        />
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/80 backdrop-blur-sm rounded-lg p-2 shadow-lg z-10">
          <div className="flex gap-2">
            <button
              onClick={() => handleAddNode('start')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Add Start
            </button>
            <button
              onClick={() => handleAddNode('llm')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Add LLM
            </button>
            <button
              onClick={() => handleAddNode('function')}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Add Function
            </button>
            <button
              onClick={() => handleAddNode('end')}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Add End
            </button>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
