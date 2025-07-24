import React, { useRef, useCallback, useMemo, useState, memo, useEffect } from 'react';
import StateModal, { type StateField } from './StateModal';
import MemoryModal from './MemoryModal';
import SaveLoadFlow from './SaveLoadFlow';
import ReactFlow, {
  Background,
  Controls,
  type Node,
  type MarkerType,
  type Connection,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import useFlowStore, { type NodeType } from '../store/useFlowStore';
import { nodeTypes } from './flow/nodeTypes';
import type { CustomNode } from './flow/NodeComponent';
import Toolbar from './flow/Toolbar';

// Memoized components to prevent unnecessary re-renders
const MemoizedBackground = memo(() => (
  <Background
    gap={16}
    color="#64748b"
    style={{ backgroundColor: 'rgb(15, 23, 42)' }}
  />
));

const MemoizedControls = memo(() => (
  <Controls
    style={{
      display: 'flex',
      gap: '8px',
      padding: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '4px',
    }}
  />
));

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
    state: flowState,
    onNodesChange, 
    onEdgesChange, 
    addEdge,
    addNode,
    setNodes,
    setEdges,
    setState
  } = useFlowStore();
  
  // State for the modals
  const [isStateModalOpen, setIsStateModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [stateFields, setStateFields] = useState<StateField[]>(flowState || []);
  
  // Initialize state fields when component mounts
  useEffect(() => {
    if (flowState && flowState.length > 0) {
      setStateFields(flowState);
    } else {
      // Initialize with default fields if no state exists
      const defaultFields: StateField[] = [
        {
          id: '1',
          name: 'messages',
          type: 'List[str]',
          isOptional: false,
          initialValue: '[]',
          isInternal: false
        },
        {
          id: '2',
          name: 'message_type',
          type: 'str',
          isOptional: true,
          initialValue: 'None',
          isInternal: false
        },
        {
          id: '3',
          name: 'next',
          type: 'str',
          isOptional: true,
          initialValue: 'None',
          isInternal: false
        }
      ];
      setStateFields(defaultFields);
      setState(defaultFields);
    }
  }, [setState]);
  
  // Log state changes
  useEffect(() => {
    console.log('State fields updated:', stateFields);
  }, [stateFields]);

  const handleStateButtonClick = useCallback(() => {
    setIsStateModalOpen(true);
  }, [stateFields]);

  const handleMemoryButtonClick = useCallback(() => {
    setIsMemoryModalOpen(true);
  }, []);

  const handleStateModalClose = useCallback(() => {
    setIsStateModalOpen(false);
  }, []);

  const handleMemoryModalClose = useCallback(() => {
    setIsMemoryModalOpen(false);
  }, []);

  const handleStateSave = useCallback((fields: StateField[]) => {
    console.log('Saving state fields:', fields);
    setState(fields); 
    setStateFields(fields);
    setIsStateModalOpen(false);
  }, [setState]);

  const handleMemorySave = useCallback((settings: any) => {
    console.log('Memory settings saved:', settings);
  }, []);

  const handleConnect = useCallback((connection: Connection) => {
    // Prevent connection from source to itself or invalid connections
    if (connection.source === connection.target || !connection.source || !connection.target) {
      return;
    }
    
    addEdge({
      ...connection,
      id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      markerEnd: { type: 'arrowclosed' as MarkerType, color: '#94a3b8' },
    });
  }, [addEdge]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    onNodeSelect?.(node as CustomNode);
  }, [onNodeSelect]);

  const handlePaneClick = useCallback((_event: React.MouseEvent) => {
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
          type: 'node',
          data: {
            ...baseNode.data,
            type: 'node',
            node: {
              provider: '',
              providerName: '',
              model: '',
              modelName: '',
            },
            tool: null,
          },
        } as unknown as CustomNode;
      case 'router':
        return {
          ...baseNode,
          type: 'router',
          data: {
            ...baseNode.data,
            type: 'router',
            tool: null
          },
        } as unknown as CustomNode;
      case 'trigger':
      case 'start':
      case 'end':
      default:
        return {
          ...baseNode,
          type: type as NodeType,
          data: {
            ...baseNode.data,
            type: type as NodeType,
            tool: null,
          },
        } as unknown as CustomNode;
    }
  }, []);

  // Get the current flow state as a serialized graph
  const getSerializedGraph = useCallback(() => {
    return {
      nodes,
      edges,
      state: stateFields,
    };
  }, [nodes, edges, stateFields]);

  // Load a flow from serialized data
  const loadFlow = useCallback((serializedGraph: any) => {
    if (serializedGraph?.nodes && serializedGraph?.edges) {
      setNodes(serializedGraph.nodes);
      setEdges(serializedGraph.edges);
      
      // Load state fields if they exist
      if (serializedGraph.state) {
        // Convert state to StateField[] format if needed
        const stateFields = (Array.isArray(serializedGraph.state) ? serializedGraph.state : []).map((field: any) => ({
          id: field.id || `field-${Math.random().toString(36).substr(2, 9)}`,
          name: field.name || field.id || '',
          type: field.type || 'str',
          isOptional: field.isOptional || false,
          initialValue: field.initialValue !== undefined ? String(field.initialValue) : '',
          isInternal: field.isInternal || false
        }));
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

  // Memoize all ReactFlow props that don't need to change
  const flowProps = useMemo(() => ({
    nodeTypes,
    defaultEdgeOptions: {
      type: 'smoothstep',
      style: { stroke: '#94a3b8', strokeWidth: 2 },
      animated: true,
      markerEnd: { type: 'arrowclosed' as MarkerType, color: '#94a3b8' },
    },
    connectionLineStyle: {
      stroke: '#94a3b8',
      strokeWidth: 2,
    },
    connectionRadius: 30,
    fitView: true,
    minZoom: 0.1,
    maxZoom: 2,
    nodeOrigin: [0.5, 0.5] as [number, number],
    proOptions: { hideAttribution: true },
    snapToGrid: true,
    snapGrid: [15, 15] as [number, number],
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    selectNodesOnDrag: true,
    connectionLineType: ConnectionLineType.SmoothStep,
  }), []);
  

  // Memoize all event handlers
  const eventHandlers = useMemo(() => ({
    onConnectStart: (_: any) => {
      // Connection start handler
    },
    onConnectEnd: () => {
      // Connection end handler
    },
    onError: (code: string, message: string) => {
      console.error('ReactFlow error:', code, message);
    },
    isValidConnection: (connection: Connection) => {
      return connection.source !== connection.target && 
             !!connection.source && 
             !!connection.target;
    }
  }), []);

  // Memoize the Toolbar to prevent unnecessary re-renders
  const memoizedToolbar = useMemo(() => (
    <Toolbar
      onAddNode={handleAddNode}
      onStateClick={handleStateButtonClick}
      onMemoryClick={handleMemoryButtonClick}
    />
  ), [handleAddNode, handleStateButtonClick, handleMemoryButtonClick]);

  // Memoize the ReactFlow component's children
  const reactFlowChildren = useMemo(() => (
    <>
      <MemoizedBackground />
      <MemoizedControls />
      {memoizedToolbar}

      {/* State Modal */}
      <StateModal
        isOpen={isStateModalOpen}
        onClose={handleStateModalClose}
        onSave={handleStateSave}
        initialFields={stateFields}
      />

      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={handleMemoryModalClose}
        onSave={handleMemorySave}
        initialSettings={{}}
      />

      {/* Save/Load Flow Buttons */}
      <div className="absolute top-4 right-4 z-10">
        <SaveLoadFlow 
          key="save-load-flow"
          serializedGraph={getSerializedGraph()} 
          onLoad={loadFlow} 
        />
      </div>
    </>
  ), [
    memoizedToolbar,
    isStateModalOpen,
    isMemoryModalOpen,
    handleStateModalClose,
    handleMemoryModalClose,
    handleStateSave,
    handleMemorySave,
    stateFields,
    getSerializedGraph,
    loadFlow
  ]);

  const optimizedNodes = useMemo(() => nodes, [nodes]);

  return (
    <div 
      className={`h-full w-full relative ${className}`} 
      ref={reactFlowWrapper} 
      style={style}
    >
      <ReactFlow
        nodes={optimizedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        {...flowProps}
        {...eventHandlers}
      >
        {reactFlowChildren}
      </ReactFlow>
    </div>
  );
};

export default FlowCanvas;
