import { memo } from 'react';
import { type Node, type NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import type { NodeData, NodeType } from '../../store/useFlowStore';

type CustomNode = Node<NodeData> & {
  type: NodeType;
};

const NODE_COLORS = {
  node: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-400' },
  router: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-100' },
  trigger: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-400' },
  start: { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-400' },
  end: { bg: 'bg-rose-500', border: 'border-rose-500', text: 'text-rose-400' }
} as const;

const StartEndNode = ({ 
  isStart, 
  selected, 
  isConnectable 
}: { 
  isStart: boolean; 
  selected: boolean; 
  isConnectable: boolean 
}) => {
  const colors = isStart 
    ? { bg: 'bg-emerald-500', border: 'border-emerald-500' }
    : { bg: 'bg-rose-500', border: 'border-rose-500' };
  
  return (
    <div className={`relative w-40 h-16 ${selected ? 'scale-105' : 'scale-100'}`}>
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
        className={`relative z-10 w-full h-full flex items-center justify-center ${colors.bg} ${colors.border} border-2 ${
          selected ? `ring-4 ${colors.border}/30` : ''
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
};

const NodeContent = ({ data }: { data: NodeData }) => (
  <div className="text-white font-medium mb-1">
    {data.label}
  </div>
);

const NodeDescription = ({ description }: { description?: string }) => {
  if (!description) return null;
  return <div className="text-xs text-white/70">{description}</div>;
};

interface NodeDetailsProps {
  node?: any;
  tool?: any;
  llm?: {
    alias?: string;
    provider?: string;
    model?: string;
    type?: 'remote' | 'local';
  };
}

const NodeDetails = ({ node, tool, llm }: NodeDetailsProps) => {
  if (!node) return null;
  
  return (
    <div className="mt-2 pt-2 border-t border-white/10">
      {/* Display LLM info if available */}
      {llm?.provider && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-blue-300 truncate">
                  {llm.provider}
                </span>
                {llm.type && (
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-900/50 text-blue-200 rounded-full whitespace-nowrap">
                    {llm.type.toUpperCase()}
                  </span>
                )}
              </div>
              {llm?.model && llm.model !== 'Select a model' ? (
                <p className="text-xs text-white/80 truncate" title={llm.model}>
                  {llm.model}
                </p>
              ) : (
                <p className="text-xs text-white/40 italic">No model selected</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Display tool info if available */}
      {tool?.name && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-400" />
            <div className="text-xs font-medium text-purple-300 truncate" title={tool.name}>
              {tool.name}
            </div>
          </div>
          {tool.description && (
            <p className="mt-1 text-xs text-white/60 line-clamp-2">
              {tool.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Helper to compare node data for memoization
const areNodeDataEqual = (a: any, b: any) => {
  if (a === b) return true;
  if (!a || !b) return false;
  
  return (
    a.label === b.label &&
    a.description === b.description &&
    a.type === b.type &&
    (!a.llm && !b.llm || (a.llm?.model === b.llm?.model)) &&
    a.llm?.type === b.llm?.type &&
    a.llm?.alias === b.llm?.alias &&
    (!a.tool && !b.tool || (a.tool?.name === b.tool?.name))
  );
};

const NodeComponent = memo(({ 
  data, 
  selected, 
  isConnectable,
  dragging
}: NodeProps<NodeData> & { dragging?: boolean }) => {
  const colors = NODE_COLORS[data.type] || NODE_COLORS.node;
  
  // Special case for start/end nodes
  if (data.type === 'start' || data.type === 'end') {
    return <StartEndNode isStart={data.type === 'start'} selected={selected} isConnectable={isConnectable} />;
  }
  
  return (
    <div 
      className="relative w-56"
      style={{
        transform: selected ? 'scale(105%)' : 'none',
        transition: dragging ? 'none' : 'transform 100ms ease-out',
        willChange: dragging ? 'transform' : 'auto',
        opacity: dragging ? 0.8 : 1
      }}
    >
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
        style={{
          boxShadow: selected ? `0 0 0 4px ${colors.border}4D` : 'none',
          transition: dragging ? 'none' : 'box-shadow 100ms ease-out',
          willChange: dragging ? 'box-shadow' : 'auto'
        }}
      >
        <NodeContent data={data} />
        <NodeDescription description={data.description} />
        <NodeDetails 
          node={data} 
          tool={data.tool} 
          llm={data.llm} 
        />
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
}, (prevProps, nextProps) => {
  // Skip expensive checks if dragging
  if (nextProps.dragging) return false;
  
  return (
    prevProps.selected === nextProps.selected &&
    prevProps.isConnectable === nextProps.isConnectable &&
    prevProps.dragging === nextProps.dragging &&
    areNodeDataEqual(prevProps.data, nextProps.data)
  );
});

// Export the CustomNode type for use in other files
export type { CustomNode };

export default NodeComponent;