import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { ServerProvider, useServer } from './contexts/ServerContext';
import { BrowserRouter as Router, Link, useLocation, Routes, Route } from 'react-router-dom';
import { FiCpu, FiSettings, FiLayers, FiPlus, FiChevronDown, FiCode, FiInfo } from 'react-icons/fi';
import { FlowCanvas } from './components/FlowCanvas';
import CodeSidebar from './components/canvas/CodeSidebar';
import useFlowStore from './store/useFlowStore';
import LLMsPage from './pages/LLMsPage';
import SettingsPage from './pages/SettingsPage';
import ToolsPage from './pages/ToolsPage';
import AboutPage from './pages/AboutPage';

// Import NodeType from useFlowStore
import type { NodeType } from './store/useFlowStore';

type CustomNode = {
  id: string;
  type: NodeType;
  data: {
    type: NodeType;
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
};

const Navigation = () => {
  const location = useLocation();
  
  // Navigation items with icons and paths
  const navItems = [
    { 
      id: 'canvas', 
      path: '/', 
      icon: <FiLayers className="w-5 h-5" />, 
      label: 'Canvas',
      activeBg: 'from-blue-500/10 to-blue-600/10',
      activeText: 'text-blue-400',
      hoverBg: 'hover:bg-gray-700/50',
      gradient: 'from-blue-400 to-blue-500'
    },
    { 
      id: 'llms', 
      path: '/llms', 
      icon: <FiCpu className="w-5 h-5" />, 
      label: 'LLMs',
      activeBg: 'from-purple-500/10 to-purple-600/10',
      activeText: 'text-purple-400',
      hoverBg: 'hover:bg-purple-500/10',
      gradient: 'from-purple-400 to-purple-500'
    },
    { 
      id: 'tools', 
      path: '/tools', 
      icon: <FiCode className="w-5 h-5" />, 
      label: 'Tools',
      activeBg: 'from-green-500/10 to-green-600/10',
      activeText: 'text-green-400',
      hoverBg: 'hover:bg-green-500/10',
      gradient: 'from-green-400 to-green-500'
    },
    { 
      id: 'settings', 
      path: '/settings', 
      icon: <FiSettings className="w-5 h-5" />, 
      label: 'Settings',
      activeBg: 'from-gray-600/10 to-gray-700/10',
      activeText: 'text-gray-300',
      hoverBg: 'hover:bg-gray-700/50',
      gradient: 'from-gray-400 to-gray-500'
    },
    { 
      id: 'about', 
      path: '/about', 
      icon: <FiInfo className="w-5 h-5" />, 
      label: 'About',
      activeBg: 'from-amber-500/10 to-amber-600/10',
      activeText: 'text-amber-400',
      hoverBg: 'hover:bg-gray-700/50',
      gradient: 'from-amber-400 to-amber-500'
    },
  ];

  return (
    <nav className="ml-8 flex space-x-1 h-full items-center">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.id}
            to={item.path}
            className={`group relative flex items-center px-4 py-3 h-full transition-all duration-200 rounded-lg mx-1 ${
              isActive 
                ? `${item.activeText} ${item.activeBg} bg-gradient-to-r shadow-lg`
                : `text-gray-400 ${item.hoverBg} hover:text-gray-200`
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className={`relative z-10 transition-all duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : ''
                }`}></span>
                <span className="relative z-10">{item.icon}</span>
              </span>
              <span className="font-medium text-sm relative z-10">
                {item.label}
                <span className={`absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r ${item.gradient} transition-all duration-300 transform ${
                  isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}></span>
              </span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
};

interface RemoteLLM {
  id: number;
  provider: string;
  name: string;
}

const TOOL_OPTIONS = [
  { id: 'process_data', name: 'Process Data' },
  { id: 'generate_text', name: 'Generate Text' },
  { id: 'analyze_sentiment', name: 'Analyze Sentiment' },
  { id: 'extract_entities', name: 'Extract Entities' },
];

const LeftSidebar = ({ node, onUpdate }: { node: CustomNode | null, onUpdate: (node: CustomNode) => void }) => {
  const [isProviderOpen, setIsProviderOpen] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isToolOpen, setIsToolOpen] = useState(false);
  const [llmType, setLlmType] = useState<'local' | 'remote'>('remote');
  const [availableModels, setAvailableModels] = useState<Array<{id: string, name: string}>>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [llmProviders, setLlmProviders] = useState<RemoteLLM[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);

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
        
        // If we have a selected provider from node data, find and set it
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

  // Track the selected provider separately from the node data
  const [selectedProvider, setSelectedProvider] = useState<RemoteLLM | null>(null);

  // Initialize selected provider when node data changes
  useEffect(() => {
    if (node?.data.llm?.provider) {
      setSelectedProvider({
        id: 0, // This will be updated when providers are loaded
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
        // Transform array of strings into array of objects with id and name
        const formattedModels = Array.isArray(models) 
          ? models.map(model => ({
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
    // Update the node data
    handleChange('llm', { 
      provider: provider.provider,
      providerName: provider.name,
      model: '',
      modelName: 'Select a model'
    });
    setIsProviderOpen(false);
    // Clear models when provider changes
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
    
    // Force a re-fetch of models to ensure we have the latest list
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
    // This would open a modal or navigate to a tool creation page in a real app
    console.log('Add new tool');
  };

  const handleLlmTypeChange = (type: 'local' | 'remote') => {
    if (llmType !== type) {
      setLlmType(type);
      setAvailableModels([]);
      setSelectedProvider(null); // Clear the selected provider
      
      // Reset the LLM data when switching types
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
                          <div key="loading" className="px-4 py-2 text-sm text-gray-400">Loading providers...</div>
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
                        )))
                        : (
                          <div key="no-providers" className="px-4 py-2 text-sm text-gray-400">No providers available</div>
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
        )}
      </div>
    </div>
  );
};



const AppHeader = () => {
  const { serverUrl, serverStatus } = useServer();
  
  const getStatusColor = () => {
    switch (serverStatus) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    const statusMap = {
      online: 'Online',
      offline: 'Offline',
      checking: 'Checking...',
    };
    return statusMap[serverStatus] || 'Unknown';
  };

  return (
    <header className="bg-gray-900/80 backdrop-blur-lg border-b border-gray-800/50 h-16 flex-shrink-0">
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Agent Smith
          </h1>
        </div>
        <Navigation />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
            <div className="relative group">
              <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`}></div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                Server {getStatusText()}
              </div>
            </div>
            <span className="text-sm text-gray-300 font-mono">
              {new URL(serverUrl).hostname}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};



const FlowCanvasWithSidebar = () => {
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const { nodes, updateNode } = useFlowStore();

  // Update selected node when nodes change
  useEffect(() => {
    if (selectedNode) {
      const updatedNode = nodes.find(n => n.id === selectedNode.id);
      if (updatedNode) {
        setSelectedNode(updatedNode as CustomNode);
      }
    }
  }, [nodes, selectedNode]);

  const handleNodeUpdate = (updatedNode: CustomNode) => {
    updateNode(updatedNode.id, updatedNode);
    setSelectedNode(updatedNode);
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <LeftSidebar node={selectedNode} onUpdate={handleNodeUpdate} />
      <div className="flex-1 relative h-full">
        <FlowCanvas 
          onNodeSelect={(node: CustomNode | null) => setSelectedNode(node)}
          className="w-full h-full"
          style={{ height: '100%' }}
        />
      </div>
      <CodeSidebar />
    </div>
  );
};

// Main layout component that includes the FlowCanvasWithSidebar
const MainLayout = () => (
  <div className="flex-1 flex flex-col h-full overflow-hidden">
    <FlowCanvasWithSidebar />
  </div>
);

// Create a styled component for the app container
const AppContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {children}
    </div>
    <style>{`
      /* Node styles */
      .react-flow__node {
        background: #1e293b;
        color: #f8fafc;
        border: 1px solid #334155;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.2s ease;
        overflow: hidden;
        padding: 0;
      }

      .react-flow__node.selected {
        border: 1px solid #3b82f6;
        box-shadow: 0 0 0 1px #3b82f6, 0 2px 8px rgba(0, 0, 0, 0.2);
      }
    `}</style>
  </>
);

const App = () => {
  return (
    <ServerProvider>
      <Router>
        <AppContainer>
          <AppHeader />
          <main className="flex-1 flex flex-col min-h-0 bg-gray-900">
            <Routes>
              <Route path="/" element={<MainLayout />} />
              <Route path="/llms" element={<LLMsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<MainLayout />} />
            </Routes>
          </main>
          <Toaster position="bottom-right" />
        </AppContainer>
      </Router>
    </ServerProvider>
  );
};

export default App;
