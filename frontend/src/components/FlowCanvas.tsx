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
    function: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-100' },
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
        
        {data.llm && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs font-medium text-white/80">
              {data.llm.providerName || 'LLM'}
            </div>
            <div className="text-xs text-white/60">
              {data.llm.modelName || 'Select a model'}
            </div>
            {data.function && (
              <div className="text-xs text-white/80 mt-1 pt-1 border-t border-white/5">
                {data.function.name}
              </div>
            )}
          </div>
        )}
        
        {!data.llm && data.function && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <div className="text-xs font-medium text-white/80">
              {data.function.name}
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

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
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
      type: type as any, // Type assertion for ReactFlow's Node type
      position,
      data: {
        label: type === 'function' ? 'New Router' : 'New Node',
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
              providerName: 'OpenAI',
              model: 'gpt-4',
              modelName: 'GPT-4',
            },
            function: {
              name: 'process_input',
              description: 'Processes the input using the LLM',
            },
          },
        } as CustomNode;
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
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm rounded-xl p-1.5 shadow-2xl border border-gray-700/50 z-10">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleAddNode('start')}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-emerald-500/20 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Start</span>
            </button>
            <button
              onClick={() => handleAddNode('llm')}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-blue-500/20 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Add Node</span>
            </button>
            <button
              onClick={() => handleAddNode('function')}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-purple-500/20 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18m-6 0h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Add Router</span>
            </button>
            <button
              onClick={() => handleAddNode('end')}
              className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-rose-500/20 hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>End</span>
            </button>
          </div>
        </div>
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
