import { useState, useEffect } from "react";
import { FiCpu, FiPlus, FiChevronDown, FiTool } from 'react-icons/fi';
import type { CustomNode } from '../../types';

interface RemoteLLM {
  alias: string;        // Unique identifier for the LLM
  provider: string;     // The provider (e.g., 'openai', 'anthropic')
  model?: string;       // The model identifier
  type: 'api' | 'local';
  apiKey?: string;
  baseUrl?: string;
}


interface NodeSidebarProps {
  node: CustomNode | null;
  onUpdate: (node: CustomNode) => void;
}

const NodeSidebar = ({ node, onUpdate }: NodeSidebarProps) => {
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isToolOpen, setIsToolOpen] = useState(false);
  interface Tool {
    id: string;
    name: string;
    description?: string;
  }

  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [llmType, setLlmType] = useState<'local' | 'remote'>('remote');
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [llmProviders, setLlmProviders] = useState<RemoteLLM[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

  // Fetch available tools
  useEffect(() => {
    const fetchTools = async () => {
      setIsLoadingTools(true);
      try {
        const response = await fetch('http://localhost:8000/api/tools');
        if (!response.ok) {
          throw new Error('Failed to fetch tools');
        }
        const data = await response.json();
        setTools(data);
      } catch (error) {
        console.error('Error fetching tools:', error);
        setTools([]);
      } finally {
        setIsLoadingTools(false);
      }
    };

    fetchTools();
  }, []);

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
        const providers: RemoteLLM[] = await response.json();
        setLlmProviders(providers);
        
        // If we have a selected provider from node data, find and set it
        if (node?.data.llm?.provider) {
          const matchedProvider = providers.find((p: RemoteLLM) => 
            p.alias === node.data.llm?.provider || p.provider === node.data.llm?.provider
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

  // Track the selected provider separately from the node data
  const [selectedProvider, setSelectedProvider] = useState<RemoteLLM | null>(null);

  // Initialize selected provider when node data changes
  useEffect(() => {
    if (node?.data.llm?.alias) {
      setSelectedProvider({
        alias: node.data.llm.alias,
        provider: node.data.llm.provider,
        type: llmType as 'api' | 'local',
        model: node.data.llm.model
      });
    } else {
      setSelectedProvider(null);
    }
  }, [node?.data.llm?.alias, node?.data.llm?.provider, llmType]);

  // Fetch models when the selected provider or llmType changes
  useEffect(() => {
    const fetchModels = async () => {
      if (!selectedProvider?.alias) {
        setAvailableModels([]);
        return;
      }

      try {
        setIsLoadingModels(true);
        const endpoint = llmType === 'remote' 
          ? `http://localhost:8000/api/llms/remote/${encodeURIComponent(selectedProvider.alias)}/models`
          : `http://localhost:8000/api/llms/local/${encodeURIComponent(selectedProvider.alias)}/models`;
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        
        const data = await response.json();
        const models = data.models || [];
        // Transform array of strings into array of objects with id and name
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
    
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        [field]: value,
      },
    };
    
    // If updating LLM, make sure to preserve existing LLM properties
    if (field === 'llm' && node.data.llm) {
      updatedNode.data.llm = {
        ...node.data.llm,
        ...value
      };
    }
    
    onUpdate(updatedNode);
  };

  const handleProviderSelect = (provider: RemoteLLM) => {
    if (!node) return;
    
    console.log('Selected provider:', provider);
    setSelectedProvider(provider);
    
    // Create a completely new object to ensure React detects the change
    const updatedNode = JSON.parse(JSON.stringify(node));
    
    // Initialize llm object if it doesn't exist
    if (!updatedNode.data.llm) {
      updatedNode.data.llm = {};
    }
    
    // Update the LLM data with alias and provider info
    updatedNode.data.llm.alias = provider.alias;
    updatedNode.data.llm.provider = provider.provider;
    updatedNode.data.llm.model = '';
    updatedNode.data.llm.modelName = 'Select a model';
    updatedNode.data.llm.type = provider.type;
    
    console.log('Updated node with provider:', updatedNode);
    
    // Force a new object reference
    const nodeToUpdate = {
      ...updatedNode,
      data: {
        ...updatedNode.data,
        llm: { ...updatedNode.data.llm }
      }
    };
    
    console.log('Node to update:', nodeToUpdate);
    onUpdate(nodeToUpdate);
    
    setIsProviderOpen(false);
    setAvailableModels([]);
  };

  const handleModelSelect = async (model: { id: string; name: string } | null) => {
    if (!node || !selectedProvider) return;
    
    console.log('Selected model:', model);
    
    // Create a completely new object to ensure React detects the change
    const updatedNode = JSON.parse(JSON.stringify(node));
    
    if (!model) {
      // If no model is selected, clear the model-related fields
      updatedNode.data.llm = {
        ...updatedNode.data.llm,
        model: '',
        modelName: ''
      };
    } else {
      // Initialize llm object with all necessary properties when a model is selected
      updatedNode.data.llm = {
        ...updatedNode.data.llm, // Preserve existing llm data
        alias: selectedProvider.alias,
        provider: selectedProvider.provider,
        model: model.id,
        modelName: model.name,
        type: selectedProvider.type || 'api'
      };
    }
    
    console.log('Updated node with model:', updatedNode);
    
    // Update the node
    onUpdate(updatedNode);
    
    setIsModelOpen(false);
    
    // Refresh the models list to ensure UI consistency
    setAvailableModels([]);
    setSelectedProvider({...selectedProvider});
  };

  const handleToolSelect = (tool: Tool) => {
    if (!node) return;
    
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        tool: {
          id: tool.id,
          name: tool.name,
          description: tool.description || ''
        }
      }
    };
    
    onUpdate(updatedNode);
    setIsToolOpen(false);
  };

  const handleAddTool = () => {
    // Open the tools page in a new tab
    window.open('/tools', '_blank');
  };

  const handleLlmTypeChange = (type: 'local' | 'remote') => {
    setLlmType(type);
    // Reset selected provider and models when changing LLM type
    setSelectedProvider(null);
    setAvailableModels([]);
    
    if (node) {
      onUpdate({
        ...node,
        data: {
          ...node.data,
          llm: {
            ...node.data.llm,
            alias: '',
            provider: '',
            model: '',
            modelName: 'Select a model',
            type: type === 'remote' ? 'api' : 'local'
          }
        }
      });
    }
  };

  const renderProviderDropdown = () => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-1.5">LLM Alias</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsProviderOpen(!isProviderOpen)}
          className="w-full flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <span>{
            selectedProvider?.alias || 
            (isLoadingProviders ? 'Loading...' : `Select ${llmType} Provider`)
          }</span>
          <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isProviderOpen ? 'transform rotate-180' : ''}`} />
        </button>
        {isProviderOpen && (
          <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
            <div className="py-1 max-h-60 overflow-auto">
              {isLoadingProviders ? (
                <div key="loading" className="px-4 py-2 text-sm text-gray-400">Loading providers...</div>
              ) : llmProviders.length > 0 ? (
                llmProviders.map((provider) => (
                <button
                  key={provider.alias}
                  onClick={() => handleProviderSelect(provider)}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    selectedProvider?.alias === provider.alias
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {provider.alias} ({provider.provider})
                </button>
              )))
              : (
                <div key="no-providers" className="px-4 py-2 text-sm text-gray-400">No providers available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-72 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white mb-4">Node Properties</h2>
        {!node ? (
          <div className="text-center p-6 bg-gray-700/50 rounded-lg">
            <FiCpu className="w-8 h-8 mx-auto text-gray-600 mb-2" />
            <p className="text-gray-400 text-sm">Select a node to edit its properties</p>
          </div>
        ) : (
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
              {renderProviderDropdown()}

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
                  <span>{node?.data?.tool?.name || 'Select Tool'}</span>
                  <FiChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isToolOpen ? 'transform rotate-180' : ''}`} />
                </button>
                {isToolOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg">
                    <div className="py-1 max-h-60 overflow-auto">
                      {isLoadingTools ? (
                        <div className="px-4 py-2 text-sm text-gray-400">Loading tools...</div>
                      ) : tools.length > 0 ? (
                        tools.map((tool) => (
                          <button
                            key={tool.id}
                            onClick={() => handleToolSelect(tool)}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              node.data.tool?.id === tool.id
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            }`}
                            title={tool.description}
                          >
                            <div className="flex items-center">
                              <FiTool className="mr-2 flex-shrink-0" size={14} />
                              <div className="truncate">
                                <span className="truncate">{tool.name}</span>
                                <div className="text-xs text-gray-400 truncate">{tool.description}</div>
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-400">
                          No tools available. <button 
                            onClick={handleAddTool}
                            className="text-blue-400 hover:text-blue-300 underline"
                          >
                            Add tools
                          </button>
                        </div>
                      )}
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
        )}
      </div>
    </div>
  );
};

export default NodeSidebar;
