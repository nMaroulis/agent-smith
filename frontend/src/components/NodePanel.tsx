import useFlowStore from '../store/useFlowStore';

const NodePanel = () => {
  const { selectedNodeId, nodes, updateNodeData, deleteNode } = useFlowStore();

  const selectedNode = nodes.find((node) => node.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <div className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
          <p>Select a node to edit its properties</p>
        </div>
      </div>
    );
  }

  const { data } = selectedNode;

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">Node Properties</h3>
          <button
            onClick={() => deleteNode(selectedNodeId!)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
          >
            Delete
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {data.type.charAt(0).toUpperCase() + data.type.slice(1)} Node
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Label
            </label>
            <input
              type="text"
              value={data.label}
              onChange={(e) =>
                updateNodeData(selectedNodeId!, { label: e.target.value })
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {data.type === 'llm' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <select
                value={data.config?.model || ''}
                onChange={(e) =>
                  updateNodeData(selectedNodeId!, {
                    config: { ...data.config, model: e.target.value },
                  })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a model</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-2">Claude 2</option>
                <option value="claude-instant">Claude Instant</option>
              </select>

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Input Type
              </label>
              <input
                type="text"
                value={data.config?.inputType || ''}
                onChange={(e) =>
                  updateNodeData(selectedNodeId!, {
                    config: { ...data.config, inputType: e.target.value },
                  })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Input type (e.g., string, number)"
              />

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temperature: {data.config?.temperature ?? 0.7}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={data.config?.temperature ?? 0.7}
                  onChange={(e) =>
                    updateNodeData(selectedNodeId!, {
                      config: {
                        ...data.config,
                        temperature: parseFloat(e.target.value),
                      },
                    })
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          {data.type === 'tool' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tool Code
              </label>
              <textarea
                value={data.config?.toolCode || ''}
                onChange={(e) =>
                  updateNodeData(selectedNodeId!, {
                    config: { ...data.config, toolCode: e.target.value },
                  })
                }
                className="w-full h-40 p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder="// Enter your tool code here\n// Use 'input' as the input variable"
              />
            </div>
          )}

          {(data.type === 'input' || data.type === 'output') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {data.type === 'input' ? 'Input' : 'Output'} Type
              </label>
              <input
                type="text"
                value={data.config.inputType || data.config.outputType || ''}
                onChange={(e) =>
                  updateNodeData(selectedNodeId!, {
                    config: {
                      ...data.config,
                      [data.type === 'input' ? 'inputType' : 'outputType']:
                        e.target.value,
                    },
                  })
                }
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder={`Enter ${data.type} type`}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodePanel;
