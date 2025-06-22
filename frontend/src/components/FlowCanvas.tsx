import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useReactFlow,
  type Node,
  type NodeTypes,
  type NodeProps,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import useFlowStore from '../store/useFlowStore';

export interface NodeData {
  label: string;
  type: 'llm' | 'function' | 'trigger';
  description?: string;
  llm?: {
    provider: string;
    providerName: string;
    model: string;
    modelName: string;
  };
  function?: {
    name: string;
    description: string;
  };
}

export type CustomNode = Node<NodeData>;

// Memoized Node Component to prevent unnecessary re-renders
const NodeComponent = memo(({ data, selected }: NodeProps<NodeData>) => {
  const nodeTypeColors = {
    llm: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
    function: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-400' },
    trigger: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' }
  };
  
  const colors = nodeTypeColors[data.type] || nodeTypeColors.llm;
  
  // Format function name for display
  const formatFunctionName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className={`relative w-56 transition-all duration-200 ${selected ? 'scale-105' : 'scale-100'}`}>
      <div className={`relative z-10 rounded-xl shadow-xl bg-gray-800 border-2 ${
        selected 
          ? `${colors.border} ring-4 ${colors.border}/20` 
          : 'border-gray-700 hover:border-gray-600'
      } transition-all duration-200 overflow-hidden`}>
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700/50">
          <div className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.bg}`}></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-100 truncate">{data.label}</div>
              {data.description && (
                <div className="text-xs text-gray-400 truncate">{data.description}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 space-y-2">
          {/* LLM Section */}
          {data.llm && (
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <svg className="flex-shrink-0 w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{data.llm.model}</span>
            </div>
          )}
          
          {/* Function Section */}
          {data.function && (
            <div className="flex items-center space-x-2 text-xs text-gray-300">
              <svg className="flex-shrink-0 w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="truncate">{formatFunctionName(data.function.name)}</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className={`h-1.5 ${
          selected 
            ? `bg-gradient-to-r ${colors.bg} to-${colors.bg.replace('500', '400')}` 
            : 'bg-gradient-to-r from-gray-700 to-gray-600'
        }`}></div>
      </div>
    </div>
  );
});

NodeComponent.displayName = 'NodeComponent';

const nodeTypes: NodeTypes = {
  llm: NodeComponent,
  function: NodeComponent,
  trigger: NodeComponent
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

  // Memoize handlers to prevent unnecessary re-renders
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: CustomNode) => {
    onNodeSelect(node);
  }, [onNodeSelect]);

  const handlePaneClick = useCallback(() => {
    onNodeSelect(null);
  }, [onNodeSelect]);

  useEffect(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);

  // Memoize nodes and edges to prevent unnecessary re-renders
  const memoizedNodes = useMemo(() => nodes, [nodes]);
  const memoizedEdges = useMemo(() => edges, [edges]);

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
        label: 'New Agent',
        type: 'llm',
        description: 'Agent description',
        llm: {
          provider: 'openai',
          providerName: 'OpenAI',
          model: 'gpt-4-turbo',
          modelName: 'GPT-4 Turbo'
        },
        function: {
          name: 'process_data',
          description: 'Processes the input data using the LLM'
        }
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
        nodes={memoizedNodes}
        edges={memoizedEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        fitView
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
        // Performance optimizations
        onlyRenderVisibleElements={true}
        nodeOrigin={[0.5, 0.5]}
        defaultMarkerColor="#4b5563"
        connectionLineStyle={{ stroke: '#4b5563', strokeWidth: 1.5 }}
        connectionLineType={ConnectionLineType.SmoothStep}
        // Interaction and performance settings
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        selectNodesOnDrag={false}
        defaultNodes={[]}
        defaultEdges={[]}
        nodeDragThreshold={1}
        fitViewOptions={{ padding: 0.2 }}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={true}
        panOnScroll={false}
        panOnDrag={[0, 1, 2]}
        selectionOnDrag={false}
        selectionKeyCode={'Shift'}
        style={{
          backgroundColor: '#0f172a',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <Background
          gap={16}
          size={1}
          color="#334155"
          className="bg-gray-900"
        />
        <Controls />
        {/* Modern top navigation bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/80">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Left side - Title */}
              <div className="flex items-center">
                <h1 className="text-xl font-medium text-gray-200">
                  Agent Canvas
                </h1>
              </div>

              {/* Center - Navigation */}
              <nav className="hidden md:flex items-center space-x-1">
                <button 
                  onClick={() => console.log('LLMs clicked')}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 flex items-center space-x-2 group"
                >
                  <svg className="w-5 h-5 text-blue-400 group-hover:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>LLMs</span>
                </button>
                <button 
                  onClick={() => console.log('Flows clicked')}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 flex items-center space-x-2 group"
                >
                  <svg className="w-5 h-5 text-purple-400 group-hover:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                  <span>Flows</span>
                </button>
                <button 
                  onClick={() => console.log('Functions clicked')}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 flex items-center space-x-2 group"
                >
                  <svg className="w-5 h-5 text-pink-400 group-hover:text-pink-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Functions</span>
                </button>
              </nav>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm">
                  <span className="text-blue-400 font-medium">{nodes.length}</span>
                  <span className="text-gray-400">nodes</span>
                  <span className="text-gray-600">•</span>
                  <span className="text-purple-400 font-medium">{edges.length}</span>
                  <span className="text-gray-400">edges</span>
                </div>
                
                <button 
                  onClick={() => console.log('Settings clicked')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors duration-200"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                
                <button 
                  onClick={() => console.log('Save clicked')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg transition-all duration-200 flex items-center space-x-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Gradient Add Node button */}
        <div className="absolute bottom-8 right-8 z-10">
          <button
            onClick={handleAddNode}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl hover:shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 transition-transform duration-200 group-hover:rotate-180" 
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
    <div className="flex-1 h-full w-full relative">
      <FlowCanvas 
        onNodeSelect={setSelectedNode}
        selectedNodeId={selectedNode?.id}
        className="absolute inset-0"
      />
    </div>
  );
};

export default FlowCanvasWrapper;
