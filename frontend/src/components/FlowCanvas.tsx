import React, { useRef, useCallback, useMemo, useState } from 'react';
import StateModal from './StateModal';
import MemoryModal from './MemoryModal';
import SaveLoadFlow from './SaveLoadFlow';
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
  type DefaultEdgeOptions,
  type MarkerType,
  type OnConnectStartParams,
  type OnConnectEnd,
  type OnConnectStart,
  type OnError,
  type Connection,
  type Edge,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { XMarkIcon, CheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import useFlowStore, { type NodeType } from '../store/useFlowStore';
import { nodeTypes } from './flow/nodeTypes';
import type { CustomNode } from './flow/NodeComponent';

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
  
  // State for the modals
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [stateFields, setStateFields] = useState([]);
  const [memorySettings, setMemorySettings] = useState({
    enabled: true,
    backend: 'memory',
    autoSaveFields: [],
    langSmithEnabled: false,
    langSmithToken: '',
    langSmithProjectId: '',
  });
  
  const handleStateButtonClick = useCallback(() => {
    setIsStateModalOpen(true);
  }, []);

  const handleMemoryButtonClick = useCallback(() => {
    setIsMemoryModalOpen(true);
  }, []);

  const handleStateSave = useCallback((fields: any) => {
    setStateFields(fields);
    setIsStateModalOpen(false);
    console.log('State fields saved:', fields);
  }, []);

  const handleMemorySave = useCallback((settings: any) => {
    setMemorySettings(settings);
    setIsMemoryModalOpen(false);
    console.log('Memory settings saved:', settings);
  }, []);

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
        label: type === 'router' ? 'Router' : type.charAt(0).toUpperCase() + type.slice(1),
        type,
      },
    };

    switch (type) {
      case 'node':
        return {
          ...baseNode,
          data: {
            ...baseNode.data,
            node: {
              provider: '',
              providerName: 'OpenAI',
              model: 'gpt-4',
              modelName: 'GPT-4',
            },
            tool: {
              name: 'process_input',
              description: 'Processes the input',
            },
          },
        } as CustomNode;
      case 'router':
        return {
          ...baseNode,
          data: {
            ...baseNode.data,
            tool: {
              name: 'router_name',
              description: 'Router description',
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
      edges: [...edges],
      state: stateFields
    };
  }, [nodes, edges, stateFields]);

  // Load a flow from serialized data
  const loadFlow = useCallback((serializedGraph: any) => {
    if (serializedGraph?.nodes && serializedGraph?.edges) {
      setNodes(serializedGraph.nodes);
      setEdges(serializedGraph.edges);
      
      // Load state fields if they exist
      if (serializedGraph.state) {
        // Check if state is in the new format with fields property
        const stateFields = Array.isArray(serializedGraph.state.fields) 
          ? serializedGraph.state.fields 
          : Array.isArray(serializedGraph.state) 
            ? serializedGraph.state 
            : [];
        
        console.log('Loading state fields:', stateFields);
        setStateFields(stateFields);
      }
    }
  }, [setNodes, setEdges]);

  const handleAddNode = useCallback((type: NodeType = 'node') => {
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

  // Use the memoized nodeTypes from the separate file
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

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
        nodeTypes={memoizedNodeTypes}
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
              <div className="p-3 rounded-full bg-emerald-500/20 group-hover:bg-emerald-500/30 transition-all duration-200 group-hover:shadow-[0_0_15px_3px_rgba(52,211,153,0.3)]">
                <svg className="w-5 h-5 text-emerald-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200">Start</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Node */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => handleAddNode('node')}
              title="Add Node"
            >
              <div className="p-3 rounded-full bg-blue-500/20 group-hover:bg-blue-500/30 transition-all duration-200 group-hover:shadow-[0_0_15px_3px_rgba(59,130,246,0.3)]">
                <svg className="w-5 h-5 text-blue-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 15 15">
                  <path d="M4 6.25A2.25 2.25 0 016.25 4h3a2.25 2.25 0 012.25 2.25V7h3.25a.75.75 0 010 1.5H11.5v.75a2.25 2.25 0 01-2.25 2.25h-3A2.25 2.25 0 014 9.25V8.5H.75a.75.75 0 010-1.5H4v-.75zm6 0a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-3z" /> 
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200">Node</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Router Node */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => handleAddNode('router')}
              title="Add Router Node"
            >
              <div className="p-3 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-all duration-200 group-hover:shadow-[0_0_15px_3px_rgba(6,182,212,0.3)]">
                <svg className="w-5 h-5 text-cyan-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 16 16">
                <path xmlns="http://www.w3.org/2000/svg" d="M14.533 2.953H9.53a.493.493 0 0 0-.325.79l1.049 1.36.15.194L8 7.137l-2.403-1.84.15-.194 1.048-1.36a.493.493 0 0 0-.325-.79H1.467a.496.496 0 0 0-.434.683L2.276 8.39a.493.493 0 0 0 .847.113l.935-1.211.281-.366 2.638 2.02-.006 6.074a1.026 1.026 0 0 0 2.05 0l.007-6.078 2.632-2.016.282.366.934 1.211a.493.493 0 0 0 .847-.113l1.244-4.755a.496.496 0 0 0-.434-.683z"/>
                </svg>

              </div>
              <span className="text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200">Router</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* End Node */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={() => handleAddNode('end')}
              title="End Node"
            >
              <div className="p-3 rounded-full bg-rose-500/20 group-hover:bg-rose-500/30 transition-all duration-200 group-hover:shadow-[0_0_15px_3px_rgba(244,63,94,0.3)]">
                <svg className="w-5 h-5 text-rose-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200">End</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-600/50 mx-1"></div>

            {/* State Tool */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={handleStateButtonClick}
              title="State"
            >
              <div className="p-3 rounded-full bg-amber-500/20 group-hover:bg-amber-500/30 transition-all duration-200 group-hover:shadow-[0_0_15px_3px_rgba(245,158,11,0.3)]">
                <svg className="w-5 h-5 text-amber-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200">State</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-amber-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>

            {/* Memory Button */}
            <button 
              className="group flex flex-col items-center justify-center w-16 h-16 mx-1 rounded-full relative"
              onClick={handleMemoryButtonClick}
              title="Memory Settings"
            >
              <div className="p-3 rounded-full bg-purple-500/20 group-hover:bg-purple-500/30 transition-all duration-200 group-hover:shadow-[0_0_15px_3px_rgba(139,92,246,0.3)]">
              <svg className="w-5 h-5 text-purple-400 group-hover:scale-125 transform transition-all duration-200" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14c0 1.656 4.03 3 9 3s9-1.344 9-3V5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12c0 1.656 4.03 3 9 3s9-1.344 9-3" />
              </svg>
              </div>
              <span className="text-xs mt-1 text-gray-300 group-hover:text-white transition-colors duration-200">Memory</span>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>

        {/* State Modal - Rendered at the root level of FlowCanvas */}
        <StateModal
          isOpen={isStateModalOpen}
          onClose={() => setIsStateModalOpen(false)}
          onSave={handleStateSave}
          initialFields={stateFields}
        />

        <MemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          onSave={handleMemorySave}
          initialSettings={memorySettings}
        />

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
