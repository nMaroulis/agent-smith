import { useState, useEffect } from 'react';
import { FiChevronDown, FiPlus } from 'react-icons/fi';

export interface RemoteLLM {
  id: number;
  provider: string;
  name: string;
}

export interface CustomNode {
  id: string;
  type: string;
  data: {
    type: string;
    label: string;
    description?: string;
    llm?: {
      provider: string;
      model: string;
      providerName: string;
      modelName: string;
    };
    tool?: {
      name: string;
      description: string;
    };
  };
  position: {
    x: number;
    y: number;
  };
}

const TOOL_OPTIONS = [
  { id: 'process_data', name: 'Process Data' },
  { id: 'generate_text', name: 'Generate Text' },
  { id: 'analyze_sentiment', name: 'Analyze Sentiment' },
  { id: 'extract_entities', name: 'Extract Entities' },
];

interface NodeSidebarProps {
  node: CustomNode | null;
  onUpdate: (node: CustomNode) => void;
}

const NodeSidebar = ({ node, onUpdate }: NodeSidebarProps) => {
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [llmType, setLlmType] = useState<'local' | 'remote'>('remote');
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [llmProviders, setLlmProviders] = useState<RemoteLLM[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<RemoteLLM | null>(null);

  const currentProvider = node?.data.llm?.provider || '';

  // Fetch available LLM providers when llmType changes
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoadingProviders(true);
        const endpoint = llmType === 'local' 
          ? 'http://localhost:8000/api/llms/local' 
          : 'http://localhost:8000/api/llms/remote';
        
        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${llmType} LLM providers`);
        }
        const providers = await response.json();
        setLlmProviders(providers);
        
        if (node?.data.llm?.provider) {
          const matchedProvider = providers.find((p: RemoteLLM) => 
            p.provider === node.data.llm?.provider
          );
          if (matchedProvider) {
            setSelectedProvider(matchedProvider);
          }
        }
      } catch (error) {
        console.error(`Error fetching ${llmType} LLM providers:`, error);
        setLlmProviders([]);
      } finally {
        setIsLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [llmType]);

  // Initialize selected provider when node data changes
  useEffect(() => {
    if (node?.data.llm?.provider) {
      setSelectedProvider({
        id: 0,
        provider: node.data.llm.provider,
        name: node.data.llm.providerName || node.data.llm.provider
      });
    } else {
      setSelectedProvider(null);
    }
  }, [node?.data.llm?.provider, node?.data.llm?.providerName]);

  // Fetch models when the selected provider or llmType changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedProvider) {
        setAvailableModels([]);
        return;
      }

      try {
        setIsLoadingModels(true);
        let url: URL;
        
        if (llmType === 'remote') {
          url = new URL('http://localhost:8000/api/llms/remote/models/llms');
          url.searchParams.append('provider', selectedProvider.provider);
          url.searchParams.append('name', selectedProvider.name);
        } else {
          url = new URL('http://localhost:8000/api/llms/local/models/llms');
          url.searchParams.append('provider', selectedProvider.provider);
        }
        
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        
        const models = await response.json();
        const formattedModels = Array.isArray(models) 
          ? models.map((model: string) => ({
              id: model,
              name: model
            }))
          : [];
        setAvailableModels(formattedModels);
      } catch (error) {
        console.error('Error fetching models:', error);
        setAvailableModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModels();
  }, [selectedProvider, llmType]);

  const handleChange = (field: string, value: any) => {
    if (!node) return;
    onUpdate({
      ...node,
      data: {
        ...node.data,
        [field]: value,
      },
    });
  };

  const handleProviderSelect = (provider: RemoteLLM) => {
    setSelectedProvider(provider);
    handleChange('llm', { 
      provider: provider.provider,
      providerName: provider.name,
      model: '',
      modelName: 'Select a model'
    });
    setIsProviderOpen(false);
    setAvailableModels([]);
  };

  const handleModelSelect = (model: { id: string; name: string } | null) => {
    if (!node?.data.llm) return;
    
    const updatedLlm = {
      ...node.data.llm,
      model: model?.id || '',
      modelName: model?.name || 'Select a model'
    };
    
    handleChange('llm', updatedLlm);
    setIsModelOpen(false);
    
    if (selectedProvider) {
      setAvailableModels([]);
      setSelectedProvider({...selectedProvider});
    }
  };

  const handleToolSelect = (tool: { id: string; name: string }) => {
    handleChange('tool', { name: tool.id, description: tool.name });
    setIsToolOpen(false);
  };

  const handleAddTool = () => {
    console.log('Add new tool');
  };

  const handleLlmTypeChange = (type: 'local' | 'remote') => {
    if (llmType !== type) {
      setLlmType(type);
      setAvailableModels([]);
      setSelectedProvider(null);
      
      if (node?.data.llm) {
        handleChange('llm', {
          provider: '',
          providerName: 'Select Provider',
          model: '',
          modelName: 'Select a model'
        });
      }
    }
  };

  if (!node) {
    return (
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-white mb-4">Node Properties</h2>
          <div className="text-center p-6 bg-gray-700/50 rounded-lg">
            <div className="w-8 h-8 mx-auto text-gray-600 mb-2" />
            <p className="text-gray-400 text-sm">Select a node to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Node Properties</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Label</label>
            <input
              type="text"
              value={node.data.label}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Enter node label"
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">LLM Type</label>
              <div className="flex space-x-2 mb-4">
                <button
                  type="button"
                  onClick={() => handleLlmTypeChange('local')}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg border ${
                    llmType === 'local' 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  Local
                </button>
                <button
                  type="button"
                  onClick={() => handleLlmTypeChange('remote')}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg border ${
                    llmType === 'remote' 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600/50'
                  }`}
                >
                  Remote
                </button>
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">LLM Provider</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsProviderOpen(!isProviderOpen)}
                  className="w-full flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <span>{
                    selectedProvider?.name || 
                    (isLoadingProviders ? 'Loading...' : `Select ${llmType} Provider`)
                  }</span>
                  <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProviderOpen ? 'transform rotate-180' : ''}`} />
                </button>
                {isProviderOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                    <div className="py-1 max-h-60 overflow-auto">
                      {isLoadingProviders ? (
                        <div className="px-4 py-2 text-sm text-gray-400">Loading providers...</div>
                      ) : llmProviders.length > 0 ? (
                        llmProviders.map((provider) => (
                          <button
                            key={provider.id}
                            onClick={() => handleProviderSelect(provider)}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              selectedProvider?.id === provider.id
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            }`}
                          >
                            {provider.name} ({provider.provider})
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-400">No providers available</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-300 mb-1.5">LLM Model</label>
              <div className="relative">
                <button
                  type="button"
                  disabled={!currentProvider || isLoadingModels}
                  onClick={() => !isLoadingModels && setIsModelOpen(!isModelOpen)}
                  className={`w-full flex items-center justify-between bg-gray-700 border ${
                    currentProvider && !isLoadingModels 
                      ? 'border-gray-600' 
                      : 'border-gray-700 bg-gray-800/50 cursor-not-allowed'
                  } rounded-lg px-3 py-2 text-left text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                >
                  <span className={!currentProvider || isLoadingModels ? 'text-gray-500' : ''}>
                    {isLoadingModels 
                      ? 'Loading models...' 
                      : node.data.llm?.modelName || (currentProvider ? 'Select a model' : 'Select provider first')}
                  </span>
                  {!isLoadingModels && (
                    <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
                      isModelOpen ? 'transform rotate-180' : ''
                    } ${!currentProvider ? 'opacity-50' : ''}`} />
                  )}
                </button>
                {isModelOpen && currentProvider && availableModels.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                    <div className="py-1 max-h-60 overflow-auto">
                      <button
                        key="select-none"
                        onClick={() => handleModelSelect(null)}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          !node.data.llm?.model
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        Select a model
                      </button>
                      {availableModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model)}
                          className={`w-full text-left px-4 py-2 text-sm ${
                            node.data.llm?.model === model.id
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {model.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isModelOpen && currentProvider && availableModels.length === 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                    <div className="px-4 py-2 text-sm text-gray-400">
                      {llmType === 'local' 
                        ? 'No local models available' 
                        : 'No models available for this provider'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-300">Tool</label>
              <button
                type="button"
                onClick={handleAddTool}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center"
              >
                <FiPlus className="mr-1" size={12} />
                Add Tool
              </button>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsToolOpen(!isToolOpen)}
                className="w-full flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <span>{node.data.tool?.name ? node.data.tool.name.replace('_', ' ') : 'Select Tool'}</span>
                <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isToolOpen ? 'transform rotate-180' : ''}`} />
              </button>
              {isToolOpen && (
                <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                  <div className="py-1 max-h-60 overflow-auto">
                    {TOOL_OPTIONS.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolSelect(tool)}
                        className={`w-full text-left px-4 py-2 text-sm ${
                          node.data.tool?.name === tool.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {tool.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
            <textarea
              value={node.data.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[80px] resize-none"
              placeholder="Enter node description"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeSidebar;
