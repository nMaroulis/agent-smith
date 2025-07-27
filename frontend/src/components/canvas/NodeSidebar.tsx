import { useState, useEffect, useRef } from 'react';
import { FiCpu, FiPlus, FiChevronDown, FiTool, FiChevronRight } from 'react-icons/fi';
import type { CustomNode } from '../../types';
import { Divider } from '@mui/material';

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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  interface Tool {
    id: string;
    name: string;
    type: string;
    description?: string;
  }
  const [tools, setTools] = useState<Tool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [llmType, setLlmType] = useState<'local' | 'remote'>('remote');
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [llmProviders, setLlmProviders] = useState<RemoteLLM[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

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
    updatedNode.data.llm.model = 'Select a model';
    updatedNode.data.llm.type = provider.type;
      
    // Force a new object reference
    const nodeToUpdate = {
      ...updatedNode,
      data: {
        ...updatedNode.data,
        llm: { ...updatedNode.data.llm }
      }
    };
    
    onUpdate(nodeToUpdate);
    
    setIsProviderOpen(false);
    setAvailableModels([]);
  };

  const handleModelSelect = async (model: { id: string; name: string } | null) => {
    if (!node || !selectedProvider) return;
    
    // Create a completely new object to ensure React detects the change
    const updatedNode = JSON.parse(JSON.stringify(node));
    
    if (!model) {
      // If no model is selected, clear the model-related fields
      updatedNode.data.llm = {
        ...updatedNode.data.llm,
        model: '',
      };
    } else {
      // Initialize llm object with all necessary properties when a model is selected
      updatedNode.data.llm = {
        ...updatedNode.data.llm, // Preserve existing llm data
        alias: selectedProvider.alias,
        provider: selectedProvider.provider,
        model: model.id,
        type: selectedProvider.type || 'api'
      };
    }
    
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
          type: tool.type,
          description: tool.description
        }
      }
    };
    
    onUpdate(updatedNode);
    setIsToolOpen(false);
    fetchDefaultPrompts(tool.name);
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
            model: 'Select a model',
            type: type === 'remote' ? 'api' : 'local'
          }
        }
      });
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Add resizing handlers
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left;
      if (newWidth > 300 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing]);

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

  const fetchDefaultPrompts = async (toolName: string) => {
    if (!toolName) return;
    
    setIsLoadingPrompts(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tools/${encodeURIComponent(toolName)}/default_agent_prompts`);
      if (!response.ok) {
        throw new Error('Failed to fetch default prompts');
      }
      const data = await response.json();
      setSystemPrompt(data.system_prompt);
      setUserPrompt(data.user_prompt);
    } catch (error) {
      console.error('Error fetching default prompts:', error);
      // Optionally show an error message to the user
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  // When collapsed, show a vertical bar with node icon
  if (isCollapsed) {
    return (
      <div className="h-full w-10 bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-700/50 flex flex-col items-center justify-center transition-all duration-300">
        <div className="w-full h-full relative hover:shadow-2xl hover:shadow-purple-500/20 group">
          {/* Glowing accent line on the right side */}
          <div className="absolute inset-y-0 right-0 w-0.5 bg-gradient-to-b from-purple-400 to-purple-600 opacity-0 group-hover:opacity-100 group-hover:shadow-[0_0_8px_2px_rgba(168,85,247,0.6)] transition-all duration-300 group-hover:scale-x-150"></div>
          
          {/* Glow effect container - only shows on hover */}
          <div className="absolute inset-0 bg-gradient-to-l from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <button
            onClick={toggleCollapse}
            className="relative w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-purple-300 rounded-r transition-all duration-300 z-10"
            title="Show Node Properties"
          >
            {/* Animated icon */}
            <div className="relative group-hover:scale-110 transition-transform duration-300">
              <div className="absolute inset-0 rounded-full bg-purple-500/0 group-hover:bg-purple-500/20 blur-sm group-hover:scale-150 transition-all duration-300"></div>
              <FiCpu 
                className="h-5 w-5 transform -rotate-90 mb-2 text-purple-400 group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_rgba(192,132,252,0.6)] transition-all duration-300"
              />
            </div>
            
            {/* Text label with glow effect */}
            <span className="text-[10px] font-mono font-bold tracking-wider text-purple-400 group-hover:text-purple-300 group-hover:drop-shadow-[0_0_8px_rgba(192,132,252,0.6)] uppercase transform -rotate-90 origin-center whitespace-nowrap mt-8 transition-all duration-300">
              Node
            </span>
            
            {/* Subtle pulsing dot indicator */}
            <span className="absolute bottom-2 w-1.5 h-1.5 bg-purple-400 rounded-full opacity-0 group-hover:opacity-70 group-hover:animate-pulse transition-opacity duration-300"></span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={sidebarRef}
      className="h-full flex flex-col bg-gray-800 border-l border-gray-700 relative"
      style={{ width: `${sidebarWidth}px`, minWidth: '300px', maxWidth: '800px' }}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white">Node Properties</h2>
        <button
          onClick={toggleCollapse}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
          title="Collapse panel"
        >
          <FiChevronRight className="h-5 w-5 transform rotate-180" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                value={node.data.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[50px] resize-none"
                placeholder="Enter node description"
              />
            </div>
            <Divider sx={{ my: 0, borderColor: '#374151' }} />
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
                        : node.data.llm?.model || (currentProvider ? 'Select a model' : 'Select provider first')}
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
            <Divider sx={{ my: 0, borderColor: '#374151' }} />
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
            <Divider sx={{ my: 0, borderColor: '#374151' }} />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Agent Logic</label>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                  placeholder="Enter system prompt"
                  disabled={isLoadingPrompts}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">User Prompt Template</label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                  placeholder="Enter user prompt template"
                  disabled={isLoadingPrompts}
                />
              </div>
              
              {isLoadingPrompts && (
                <div className="text-sm text-gray-400 text-center py-2">
                  Loading default prompts...
                </div>
              )}
            </div>
            <Divider sx={{ my: 0, borderColor: '#374151' }} />

          </div>
        )}
      </div>
      {/* Resize handle on the right side */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-500 active:bg-purple-600 transition-colors z-20"
        onMouseDown={startResizing}
        style={{
          right: '-3px',
          width: '4px',
        }}
      />
    </div>
  );
};

export default NodeSidebar;
