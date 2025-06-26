import { create } from 'zustand';
import type { Node, Edge, Connection, NodeChange, EdgeChange } from 'reactflow';

export type NodeType = 'node' | 'router' | 'trigger' | 'start' | 'end';

export interface LLMData {
  provider: string;
  providerName: string;
  model: string;
  modelName: string;
}

export interface FunctionData {
  name: string;
  description: string;
}

export interface NodeData {
  label: string;
  description?: string;
  type: NodeType;
  node?: LLMData;
  function?: FunctionData;
}

export interface FlowState {
  // State
  nodes: Node<NodeData>[];
  edges: Edge[];
  
  // Actions
  setNodes: (nodes: Node<NodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  
  // Node Actions
  addNode: (node: Node<NodeData>) => void;
  updateNode: (id: string, data: Partial<Node<NodeData>>) => void;
  removeNode: (nodeId: string) => void;
  
  // Edge Actions
  addEdge: (edge: Edge | Connection) => void;
  updateEdge: (id: string, changes: Partial<Edge>) => void;
  removeEdge: (edgeId: string) => void;
  
  // ReactFlow Event Handlers
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
}

// Helper function to apply node changes
const applyNodeChanges = (changes: NodeChange[], nodes: Node[]): Node[] => {
  return changes.reduce((acc, change) => {
    switch (change.type) {
      case 'add':
        return [...acc, change.item];
      case 'remove':
        return acc.filter((node) => node.id !== change.id);
      case 'reset':
        return [];
      case 'dimensions':
      case 'position':
      case 'select':
        return acc.map((node) => {
          if (node.id === change.id) {
            return {
              ...node,
              ...('position' in change ? { position: change.position } : {}),
              ...('dimensions' in change && change.dimensions ? { width: change.dimensions.width, height: change.dimensions.height } : {}),
              ...('selected' in change ? { selected: change.selected } : {}),
            };
          }
          return node;
        });
      default:
        return acc;
    }
  }, nodes as Node[]);
};

// Helper function to apply edge changes
const applyEdgeChanges = (changes: EdgeChange[], edges: Edge[]): Edge[] => {
  return changes.reduce((acc, change) => {
    switch (change.type) {
      case 'add':
        return [...acc, change.item];
      case 'remove':
        return acc.filter((edge) => edge.id !== change.id);
      case 'reset':
        return [];
      case 'select':
        return acc.map((edge) => 
          edge.id === change.id ? { ...edge, selected: change.selected } : edge
        );
      default:
        return acc;
    }
  }, edges as Edge[]);
};

const useFlowStore = create<FlowState>((set, get) => ({
  // Initial state
  nodes: [],
  edges: [],
  
  // Update state
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  
  // Node actions
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id 
          ? { 
              ...node, 
              ...updates,
              data: { ...node.data, ...(updates.data || {}) } 
            } 
          : node
      ),
    })),
    
  removeNode: (nodeId) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    })),
  
  // Edge actions
  addEdge: (connection) =>
    set((state) => {
      // Ensure source and target are defined
      if (!connection.source || !connection.target) {
        console.warn('Cannot create edge: source or target is missing', connection);
        return {};
      }

      // Create a new edge with a unique ID
      const newEdge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.sourceHandle || ''}-${connection.target}-${connection.targetHandle || ''}`,
        type: 'default',
        animated: true,
        style: { stroke: '#4B5563' },
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || null,
        targetHandle: connection.targetHandle || null,
      };
      
      // Check if the edge already exists
      const edgeExists = state.edges.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          e.sourceHandle === (connection.sourceHandle || null) &&
          e.targetHandle === (connection.targetHandle || null)
      );
      
      return edgeExists ? {} : { edges: [...state.edges, newEdge] };
    }),
    
  updateEdge: (id, changes) =>
    set((state) => ({
      edges: state.edges.map((edge) =>
        edge.id === id ? { ...edge, ...changes } : edge
      ),
    })),
    
  removeEdge: (edgeId) =>
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    })),
  
  // ReactFlow event handlers
  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    })),
    
  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    })),
    
  onConnect: (connection) => {
    get().addEdge(connection);
  },
}));

export default useFlowStore;
