import { useState, useEffect, useRef } from 'react';
import { FiCpu, FiPlus, FiChevronDown, FiTool, FiChevronRight, FiInfo, FiTerminal, FiLogIn, FiLogOut } from 'react-icons/fi';
import type { CustomNode } from '../../types';
import { Label, ListboxOption, Listbox, ListboxButton, ListboxOptions, Transition } from '@headlessui/react'
import { ChevronUpDownIcon } from '@heroicons/react/20/solid'


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

const SectionHeader = ({ 
  icon: Icon, 
  title,
  className = ''
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  title: string;
  className?: string;
}) => (
  <div className={`flex items-center mb-4 ${className}`}>
    <Icon className="h-5 w-5 text-purple-400 mr-2" />
    <h3 className="text-base font-medium text-gray-300">{title}</h3>
    <div className="ml-3 h-px flex-1 bg-gray-700"></div>
  </div>
);

function getLabel(value: string): string {
  const options = [
    { label: 'Last Message Content', value: 'messages[-1]["content"]' },
    { label: 'All Messages', value: 'messages' },
    { label: 'Message Type', value: 'message_type' },
    { label: 'Next Route', value: 'next' }
  ]
  return options.find(opt => opt.value === value)?.label || value
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
  const [inputFormat, setInputFormat] = useState('messages[-1]["content"]');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [outputMode, setOutputMode] = useState<'text' | 'structured'>('text');
  const [modelName, setModelName] = useState('');
  const [literalFields, setLiteralFields] = useState([{ 
    name: 'message_type', 
    values: [], 
    description: ''
  }]);
  const [literalInputValue, setLiteralInputValue] = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Track previous node values to prevent unnecessary updates
  const prevNodeRef = useRef<CustomNode | null>(null);
  const prevValuesRef = useRef({
    systemPrompt: '',
    userPrompt: '',
    inputFormat: 'messages[-1]["content"]',
    outputMode: 'text' as const
  });

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

  // Initialize form fields when node changes
  useEffect(() => {
    if (node && node !== prevNodeRef.current) {
      // Only update if node has changed
      prevNodeRef.current = node;
      
      const nodeData = node.data.node || {};
      
      // Only update state if values are different to prevent unnecessary re-renders
      if (nodeData.systemPrompt !== prevValuesRef.current.systemPrompt) {
        setSystemPrompt(nodeData.systemPrompt || '');
      }
      if (nodeData.userPrompt !== prevValuesRef.current.userPrompt) {
        setUserPrompt(nodeData.userPrompt || '');
      }
      if (nodeData.inputFormat !== prevValuesRef.current.inputFormat) {
        setInputFormat(nodeData.inputFormat || 'messages[-1]["content"]');
      }
      if (nodeData.outputMode !== prevValuesRef.current.outputMode) {
        setOutputMode(nodeData.outputMode || 'text');
      }
      
      setShowCustomInput(!!nodeData.inputFormat && ![
        'messages[-1]["content"]',
        'messages',
        'message_type',
        'next'
      ].includes(nodeData.inputFormat));
      
      // Update the ref with current values
      prevValuesRef.current = {
        systemPrompt: nodeData.systemPrompt || '',
        userPrompt: nodeData.userPrompt || '',
        inputFormat: nodeData.inputFormat || 'messages[-1]["content"]',
        outputMode: nodeData.outputMode || 'text'
      };
    }
  }, [node]);

  // Update node data when any field changes
  useEffect(() => {
    if (!node) return;
    
    const currentValues = {
      systemPrompt,
      userPrompt,
      inputFormat,
      outputMode
    };
    
    // Only update if values have actually changed
    const hasChanges = Object.entries(currentValues).some(
      ([key, value]) => prevValuesRef.current[key as keyof typeof currentValues] !== value
    );
    
    if (hasChanges) {
      const updatedNode = {
        ...node,
        data: {
          ...node.data,
          node: {
            ...node.data.node,
            ...currentValues
          }
        }
      };
      
      // Update the ref with current values
      prevValuesRef.current = currentValues;
      
      onUpdate(updatedNode);
    }
  }, [systemPrompt, userPrompt, inputFormat, outputMode, node, onUpdate]);

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
          className="w-full flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all"
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
                    ? 'bg-purple-600 text-white'
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

  const generatePydanticModel = () => {
    return `from pydantic import BaseModel, Field, Literal

class ${modelName || 'MessageClassifier'}(BaseModel):
    """
    Structured output schema for message classification.
    """
    ${literalFields[0]?.name || 'message_type'}: Literal[${literalFields[0]?.values.map(v => `"${v}"`).join(', ') || ''}] = Field(
        ...,
        description="${literalFields[0]?.description || 'The type of message'}"
    )`;
  };

  const handleLiteralInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLiteralInputValue(value);
    
    // Parse the values but don't update the state until blur
    const newValues = value
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);
    
    // Update the values in state without triggering a re-render
    setLiteralFields(prev => {
      const newFields = [...prev];
      newFields[0].values = newValues;
      return newFields;
    });
  };

  const handleLiteralInputBlur = () => {
    const formatted = literalFields[0].values.join(', ');
    setLiteralInputValue(formatted);
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
            <SectionHeader 
              icon={FiInfo} 
              title="Node Information" 
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Label</label>
              <input
                type="text"
                value={node.data.label}
                onChange={(e) => handleChange('label', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter node label"
              />
              <p className="mt-1 text-xs text-gray-400">
                This label will be used as the agent <strong>function name</strong> in the generated code.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                value={node.data.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all min-h-[50px] resize-none"
                placeholder="Enter node description"
              />
            </div>
            <div className="space-y-4">

            <SectionHeader 
              icon={FiCpu} 
              title="LLM Configuration"
              className="mt-6"
            />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">LLM Type</label>
                <div className="flex space-x-2 mb-4">
                  <button
                    type="button"
                    onClick={() => handleLlmTypeChange('local')}
                    className={`flex-1 py-2 px-3 text-sm rounded-lg border ${
                      llmType === 'local' 
                        ? 'bg-purple-600 border-purple-600 text-white' 
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
                        ? 'bg-purple-600 border-purple-600 text-white' 
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
                    } rounded-lg px-3 py-2 text-left text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all`}
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
                        {availableModels.map((model) => (
                          <button
                            key={model.id}
                            onClick={() => handleModelSelect(model)}
                            className={`w-full text-left px-4 py-2 text-sm ${
                              node.data.llm?.model === model.id
                                ? 'bg-purple-600 text-white'
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
              <button
                type="button"
                disabled
                className="mt-3 w-full flex items-center justify-between px-4 py-2 bg-gray-800/50 border border-dashed border-gray-600 rounded-lg text-gray-400 cursor-not-allowed transition-all hover:border-purple-400/30 hover:text-gray-300 group"
              >
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-2 text-gray-500 group-hover:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-sm font-medium">Override LLM Parameters</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400 ml-2">
                  Coming Soon
                </span>
              </button>
            </div>
            <div>
              <SectionHeader 
              icon={FiTerminal} 
              title="Agent Logic"
              className="mt-6"
            />
              <div>
              <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <FiTool className="h-4 w-4 text-purple-400" />
                Tool
              </label>
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
                  className="w-full flex items-center justify-between bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-left text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all"
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
                                ? 'bg-purple-600 text-white'
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
                            className="text-purple-400 hover:text-purple-300 underline"
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">System Prompt</label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                  placeholder="Enter system prompt"
                  disabled={isLoadingPrompts}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">User Prompt Template</label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                  placeholder="Enter user prompt template"
                  disabled={isLoadingPrompts}
                />
              </div>
              
              {isLoadingPrompts && (
                <div className="text-sm text-gray-400 text-center py-2">
                  Loading default prompts...
                </div>
              )}
              
              {/* Input Format */}
              <div className="mt-4 pt-4">
                <Listbox
                  value={inputFormat}
                  onChange={(value) => {
                    if (value === 'custom') {
                      setShowCustomInput(true);
                      setInputFormat('');
                    } else {
                      setShowCustomInput(false);
                      setInputFormat(value);
                    }
                  }}
                >
                  {({ open }) => (
                    <div>
                      <Label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                        <FiLogIn className="h-4 w-4 text-purple-400" />
                        Input Format
                      </Label>
                      <div className="relative">
                        <ListboxButton className="relative w-full cursor-default rounded-lg bg-gray-700 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-purple-500 focus-visible:ring-2 focus-visible:ring-white/75 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-300 sm:text-sm border border-gray-600">
                          <span className="block truncate">
                            {showCustomInput ? (
                              <span className="text-gray-300">Custom...</span>
                            ) : (
                              <div>
                                <div className="font-medium text-white">
                                  {getLabel(inputFormat)}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {inputFormat}
                                </div>
                              </div>
                            )}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon
                              className="h-5 w-5 text-gray-400"
                              aria-hidden="true"
                            />
                          </span>
                        </ListboxButton>

                        <Transition
                          show={open}
                          as="div"
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                          className="relative z-10"
                        >
                          <ListboxOptions 
                            static
                            className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-700 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm border border-gray-600"
                          >
                            {[
                              { label: 'Last Message Content', value: 'messages[-1]["content"]' },
                              { label: 'All Messages', value: 'messages' },
                              { label: 'Message Type', value: 'message_type' },
                              { label: 'Next Route', value: 'next' },
                              { label: 'Custom...', value: 'custom' }
                            ].map((option) => (
                              <ListboxOption
                                key={option.value}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-4 pr-4 ${
                                    active ? 'bg-gray-600 text-white' : 'text-gray-300'
                                  }`
                                }
                                value={option.value}
                              >
                                {({ selected }) => (
                                  <div>
                                    <div className={`font-medium ${selected ? 'text-white' : 'text-gray-200'}`}>
                                      {option.label}
                                    </div>
                                    {option.value !== 'custom' && (
                                      <div className="text-xs text-gray-400">
                                        {option.value}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </div>
                    </div>
                  )}
                </Listbox>

                {showCustomInput && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={inputFormat}
                      onChange={(e) => setInputFormat(e.target.value)}
                      placeholder='e.g., messages[-1]["content"]'
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                )}

                <p className="mt-2 text-xs text-gray-400">
                  Which field of the <strong>State</strong> should be passed as an input <strong>query</strong> to the Tool or <strong>user message</strong> to the LLM.
                </p>
              </div>


              {/* Output Format */}
              <div className="mt-4 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
                  <FiLogOut className="h-4 w-4 text-purple-400" />
                  Output Format
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <label className={`relative flex cursor-pointer rounded-lg border-2 p-3 transition-all ${
                    outputMode === 'text' 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      className="sr-only"
                      checked={outputMode === 'text'}
                      onChange={() => setOutputMode('text')}
                    />
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full border-2 mr-2 flex-shrink-0 transition-all ${
                        outputMode === 'text' 
                          ? 'border-purple-400 bg-purple-400 ring-2 ring-purple-400/30' 
                          : 'border-gray-400'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-100">Text</div>
                        <div className="text-xs text-gray-400">Simple text response</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className={`relative flex cursor-pointer rounded-lg border-2 p-3 transition-all ${
                    outputMode === 'structured' 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <input
                      type="radio"
                      className="sr-only"
                      checked={outputMode === 'structured'}
                      onChange={() => setOutputMode('structured')}
                    />
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full border-2 mr-2 flex-shrink-0 transition-all ${
                        outputMode === 'structured' 
                          ? 'border-purple-400 bg-purple-400 ring-2 ring-purple-400/30' 
                          : 'border-gray-400'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-100">Structured Output</div>
                        <div className="text-xs text-gray-400">Pydantic model with Literal types</div>
                      </div>
                    </div>
                  </label>
                </div>
                
                {outputMode === 'structured' && (
                  <div className="space-y-4">

                      <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/20 to-purple-900/10 rounded-lg border border-purple-800/40">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-2">
                            <p className="text-xs text-purple-100 font-medium">About Structured Outputs</p>
                            <p className="mt-1 text-xs text-purple-200/80">
                              <span className="font-semibold">API LLM models</span> (i.e. OpenAI, Anthropic, Gemini) use <span className="font-semibold text-purple-100">built-in structured output functionality</span> via langchain. For models without native support (e.g. llama.cpp), the <span className="font-semibold text-purple-100">Outlines</span> library ensures consistent output formatting.
                            </p>
                          </div>
                        </div>
                      </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
                      <input
                        type="text"
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="e.g., MessageClassifier"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Name of your Pydantic model (PascalCase)
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-300">Literal Field</label>
                        <button
                          type="button"
                          disabled
                          className="text-xs bg-gray-700 text-gray-500 px-2 py-1 rounded flex items-center cursor-not-allowed"
                        >
                          <FiPlus className="mr-1" size={12} />
                          Add Field
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                          <div className="flex items-start space-x-2">
                            <div className="flex-1 space-y-2">
                              <div>
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-medium text-gray-300 mb-1">Field Name</label>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/50 text-purple-200 border border-purple-700/50">
                                    Default Field
                                  </span>
                                </div>
                                <div className="relative">
                                  <input
                                    type="text"
                                    value="message_type"
                                    disabled
                                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1.5 text-sm text-gray-400 cursor-not-allowed font-mono"
                                  />
                                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h.01a1 1 0 100-2H9z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                  Literal Values (comma separated)
                                </label>
                                <input
                                  type="text"
                                  value={literalInputValue}
                                  onChange={handleLiteralInputChange}
                                  onBlur={handleLiteralInputBlur}
                                  onFocus={() => {
                                    // Show raw values when focused
                                    setLiteralInputValue(literalFields[0].values.join(','));
                                  }}
                                  placeholder="e.g., rag, web_search, conversational"
                                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent font-mono"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-xs font-medium text-gray-300 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={literalFields[0].description}
                                  onChange={(e) => {
                                    const newFields = [...literalFields];
                                    newFields[0].description = e.target.value;
                                    setLiteralFields(newFields);
                                  }}
                                  placeholder="Field description for documentation"
                                  className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {literalFields.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-gray-400">Pydantic Model Preview:</span>
                            <button 
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatePydanticModel());
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              Copy
                            </button>
                          </div>
                          <pre className="text-xs text-gray-300 overflow-auto max-h-40">
                            {generatePydanticModel()}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {outputMode === 'text' && (
                  <div className="space-y-4">

                      <div className="mt-4 p-3 bg-gradient-to-r from-purple-900/20 to-purple-900/10 rounded-lg border border-purple-800/40">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="ml-2">
                            <p className="text-xs text-purple-100 font-medium">About Text Output</p>
                            <p className="mt-1 text-xs text-purple-200/80">
                              <span className="font-semibold">Test output</span> means the node expects the LLM to return just a string, typically from the assistants message, without enforcing any schema or structure. In the code this is <span className="font-semibold text-purple-100">{JSON.stringify({ messages: [{ role: "assistant", content: "response.content" }] })}</span>.
                            </p>
                          </div>
                        </div>
                      </div>
                  </div>
                )}
                
              </div>
            </div>

            <div 
              className="relative bottom-0 left-0 right-0 h-12 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(139, 92, 246, 0.2) 0%, transparent 100%)',
                filter: 'blur(8px)',
                transform: 'translateY(50%)',
                zIndex: 10
              }}
            />
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
