import { memo } from 'react';
import { type Node, type NodeProps } from 'reactflow';
import { Handle } from 'reactflow';
import { Position } from 'reactflow';
import useFlowStore, { type NodeData, type NodeType } from '../../store/useFlowStore';

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
      node: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
      router: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-100' },
      trigger: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
      start: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400' },
      end: { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-400' }
    };
    
    const colors = nodeTypeColors[data.type] || nodeTypeColors.node;
    
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
          
          {data.node && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-xs font-medium text-white/80">
                {data.node.providerName || 'Node'}
              </div>
              <div className="text-xs text-white/60">
                {data.node.modelName || 'Select a model'}
              </div>
              {data.tool && (
                <div className="text-xs text-white/80 mt-1 pt-1 border-t border-white/5">
                  {data.tool.name}
                </div>
              )}
            </div>
          )}
          
          {!data.node && data.tool && (
            <div className="mt-2 pt-2 border-t border-white/10">
              <div className="text-xs font-medium text-white/80">
                {data.tool.name}
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

// Export the CustomNode type for use in other files
export type { CustomNode };

export default NodeComponent;