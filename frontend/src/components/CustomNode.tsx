import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { NodeData } from '../store/useFlowStore';
import useFlowStore from '../store/useFlowStore';
import { useCallback } from 'react';

export default function CustomNode({ id, data, selected }: NodeProps<NodeData>) {
  const { updateNodeData } = useFlowStore();
  
  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { label: e.target.value });
    },
    [id, updateNodeData]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { type: e.target.value as NodeData['type'] });
    },
    [id, updateNodeData]
  );

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, { config: { ...data.config, model: e.target.value } });
    },
    [id, data.config, updateNodeData]
  );

  const handleTemperatureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { config: { ...data.config, temperature: parseFloat(e.target.value) } });
    },
    [id, data.config, updateNodeData]
  );

  const handleFunctionCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateNodeData(id, { config: { ...data.config, functionCode: e.target.value } });
    },
    [id, data.config, updateNodeData]
  );

  const handleInputTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { config: { ...data.config, inputType: e.target.value } });
    },
    [id, data.config, updateNodeData]
  );

  const handleOutputTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(id, { config: { ...data.config, outputType: e.target.value } });
    },
    [id, data.config, updateNodeData]
  );

  return (
    <div className={`p-3 rounded-lg border ${selected ? 'ring-2 ring-blue-500' : 'border-gray-200'} bg-white shadow-sm`}>
      <Handle type="target" position={Position.Top} />
      <div className="space-y-2">
        <input
          type="text"
          value={data.label || ''}
          onChange={handleLabelChange}
          placeholder="Node label"
          className="w-full text-sm font-medium border-b border-gray-200 focus:outline-none focus:border-blue-500"
        />
        
        <select
          value={data.type}
          onChange={handleTypeChange}
          className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="llm">LLM</option>
          <option value="function">Function</option>
          <option value="input">Input</option>
          <option value="output">Output</option>
        </select>

        {data.type === 'llm' && (
          <div className="space-y-1">
            <select
              value={data.config?.model || 'gpt-4'}
              onChange={handleModelChange}
              className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-2">Claude 2</option>
            </select>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Temp:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={data.config?.temperature ?? 0.7}
                onChange={handleTemperatureChange}
                className="w-full"
              />
              <span className="text-xs w-6 text-right">{data.config?.temperature ?? 0.7}</span>
            </div>
          </div>
        )}

        {data.type === 'function' && (
          <textarea
            value={data.config?.functionCode || ''}
            onChange={handleFunctionCodeChange}
            placeholder="// Write your function code here"
            className="w-full text-xs font-mono h-20 p-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}

        {data.type === 'input' && (
          <input
            type="text"
            value={data.config?.inputType || ''}
            onChange={handleInputTypeChange}
            placeholder="Input type (e.g., string, number)"
            className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}

        {data.type === 'output' && (
          <input
            type="text"
            value={data.config?.outputType || ''}
            onChange={handleOutputTypeChange}
            placeholder="Output type (e.g., string, number)"
            className="w-full text-xs border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        )}
      </div>
      <Handle type="source" position={Position.Bottom} id="a" />
    </div>
  );
}
