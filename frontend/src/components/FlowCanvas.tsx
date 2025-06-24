import React, { useRef, memo, useCallback, useMemo } from 'react';
import SaveLoadFlow from './SaveLoadFlow';
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
  type OnConnectStartParams,
  type OnConnectEnd,
  type OnConnectStart,
  type OnError,
  type Connection,
  type Edge,
  Handle,
  Position,
  ConnectionLineType
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
  className?: string;
  style?: React.CSSProperties;
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  onNodeSelect,
  className = '',
  style,
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { 
    nodes, 
    edges, 
    addNode, 
    onNodesChange, 
    onEdgesChange, 
    addEdge, 
    setNodes, 
    setEdges 
  } = useFlowStore();

  const handleConnect = useCallback((connection: Connection) => {
    console.log('Connecting nodes:', connection);
    
    // Prevent connection from source to itself
    if (connection.source === connection.target) {
      console.log('Cannot connect to self');
      return;
    }
    
    // Ensure source and target are not null
    if (!connection.source || !connection.target) {
      console.error('Source or target is missing');
      return;
    }
    
    // Create a new edge with proper typing
    const newEdge: Edge = {
      ...connection,
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'smoothstep',
      source: connection.source,
      target: connection.target,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      animated: true,
      markerEnd: { type: 'arrowclosed' as MarkerType, color: '#94a3b8' },
    };
    
    addEdge(newEdge);
  }, [addEdge]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    onNodeSelect?.(node as CustomNode);
  }, [onNodeSelect]);

  const handlePaneClick = useCallback((_event: React.MouseEvent) => {
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

  // Get the current flow state as a serialized graph
  const getSerializedGraph = useCallback(() => {
    return {
      nodes: [...nodes],
      edges: [...edges]
    };
  }, [nodes, edges]);

  // Load a flow from serialized data
  const loadFlow = useCallback((serializedGraph: any) => {
    if (serializedGraph?.nodes && serializedGraph?.edges) {
      setNodes(serializedGraph.nodes);
      setEdges(serializedGraph.edges);
    }
  }, [setNodes, setEdges]);

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

  const onConnectEnd: OnConnectEnd = useCallback((_event) => {
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
        connectionLineType={ConnectionLineType.SmoothStep}
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
        {/* macOS-like Toolbar */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10">
          <div className="flex items-center justify-center bg-gray-800/80 backdrop-blur-md rounded-full px-4 py-2 shadow-lg border border-gray-700/50">
            {/* Start Node */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => handleAddNode('start')}
              title="Start Node"
            >
              <div className="p-3 rounded-full bg-emerald-500/20">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300">Start</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Node */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => handleAddNode('llm')}
              title="Add Node"
            >
              <div className="p-3 rounded-full bg-blue-500/20">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300">Node</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Router Node */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => handleAddNode('function')}
              title="Add Router Node"
            >
              <div className="p-3 rounded-full bg-purple-500/20">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18m-6 0h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300">Router</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* End Node */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => handleAddNode('end')}
              title="End Node"
            >
              <div className="p-3 rounded-full bg-rose-500/20">
                <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300">End</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-600/50 mx-1"></div>

            {/* State Tool */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => console.log('State tool clicked')}
              title="State"
            >
              <div className="p-3 rounded-full bg-amber-500/20">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300">State</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>

        {/* Save/Load Flow Buttons */}
        <div className="absolute top-4 right-4 z-10">
          <SaveLoadFlow 
            serializedGraph={getSerializedGraph()} 
            onLoad={loadFlow} 
          />
        </div>
        

      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
