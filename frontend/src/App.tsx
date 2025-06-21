import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Link, useLocation, Routes, Route } from 'react-router-dom';
import { FiCpu, FiSettings, FiLayers } from 'react-icons/fi';
import { FlowCanvas, type CustomNode } from './components/FlowCanvas';
import useFlowStore from './store/useFlowStore';
import LLMsPage from './pages/LLMsPage';
import SettingsPage from './pages/SettingsPage';

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
      id: 'settings', 
      path: '/settings', 
      icon: <FiSettings className="w-5 h-5" />, 
      label: 'Settings',
      activeBg: 'from-gray-600/10 to-gray-700/10',
      activeText: 'text-gray-300',
      hoverBg: 'hover:bg-gray-700/50',
      gradient: 'from-gray-400 to-gray-500'
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

const LeftSidebar = ({ node, onUpdate }: { node: CustomNode | null, onUpdate: (node: CustomNode) => void }) => {
  const handleChange = (field: string, value: string) => {
    if (!node) return;
    onUpdate({
      ...node,
      data: {
        ...node.data,
        [field]: value,
      },
    });
  };

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex-shrink-0 overflow-y-auto">
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
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
              <textarea
                value={node.data.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px] resize-none"
                placeholder="Enter node description"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const RightSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleGenerateCode = () => {
    setIsGenerating(true);
    // Simulate code generation
    setTimeout(() => {
      setIsGenerating(false);
    }, 1500);
  };
  return (
    <div className={`bg-gray-800 border-l border-gray-700 flex-shrink-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'w-80' : 'w-12'}`}>
      <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-700 flex items-center justify-between">
          {isExpanded && <h2 className="text-lg font-semibold text-white">Code</h2>}
          <button
            onClick={toggleExpand}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {isExpanded && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-6 p-4 bg-gray-700/50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Generate Code</h3>
              <p className="text-gray-400 text-xs mb-4">
                {isGenerating 
                  ? 'Generating code...' 
                  : 'Generate Python code from your flow'}
              </p>
              <button 
                onClick={handleGenerateCode}
                disabled={isGenerating}
                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  isGenerating 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isGenerating ? 'Generating...' : 'Generate Code'}
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Output</h3>
              <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-400 overflow-auto max-h-40">
                {isGenerating ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ) : (
                  <span className="text-gray-500">Code will appear here...</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



const AppHeader = () => {
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
        <div className="w-32"></div> {/* Spacer to balance the layout */}
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
          selectedNodeId={selectedNode?.id}
          className="w-full h-full"
          style={{ height: '100%' }}
        />
      </div>
      <RightSidebar />
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
  <div className="flex flex-col h-screen bg-gray-900 text-white">
    {children}
  </div>
);

const App = () => {
  return (
    <Router>
      <AppContainer>
        <AppHeader />
        <main className="flex-1 flex flex-col min-h-0 bg-gray-900">
          <Routes>
            <Route path="/" element={<MainLayout />} />
            <Route path="/llms" element={<LLMsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<MainLayout />} />
          </Routes>
        </main>
        <Toaster position="bottom-right" />
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
          
          .react-flow__node:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .react-flow__node .react-flow__handle {
            width: 8px;
            height: 8px;
            background: #4b5563;
            border: 2px solid #1f2937;
          }
          
          .react-flow__node .react-flow__handle:hover {
            transform: scale(1.2);
          }
          .react-flow__node:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px -5px rgba(0, 0, 0, 0.3);
            border-color: rgba(255, 255, 255, 0.1);
          }
          .react-flow__node.selected {
            border: 1px solid rgba(59, 130, 246, 0.8);
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4), 0 8px 25px -5px rgba(0, 0, 0, 0.3);
          }
          .react-flow__node .react-flow__handle {
            width: 10px;
            height: 10px;
            border: 2px solid #1f2937;
            background: #3b82f6;
            transition: all 0.2s ease;
          }
          .react-flow__node .react-flow__handle:hover {
            transform: scale(1.4);
            background: #60a5fa;
          }
          /* React Flow controls */
          .react-flow__controls {
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
            border-radius: 6px !important;
            overflow: hidden;
          }
          
          .react-flow__controls-button {
            background: #1e293b !important;
            border-bottom: 1px solid #334155 !important;
            border-radius: 0 !important;
            transition: all 0.2s ease !important;
          }
          
          .react-flow__controls-button:hover {
            background: #334155 !important;
          }
          
          .react-flow__controls-button svg {
            fill: #f8fafc !important;
          }
          
          .react-flow__controls-button:first-child {
            border-top-left-radius: 6px !important;
            border-top-right-radius: 6px !important;
          }
          
          .react-flow__controls-button:last-child {
            border-bottom-left-radius: 6px !important;
            border-bottom-right-radius: 6px !important;
            border-bottom: none !important;
          }
          .dark .react-flow__handle {
            border-color: #1f2937;
          }
          .react-flow__handle-connecting {
            background: #ff4d4f;
          }
          .react-flow__handle-valid {
            background: #10b981;
          }
          .react-flow__edge-path {
            stroke: #3b82f6;
            stroke-width: 2;
          }
          .react-flow__edge.selected .react-flow__edge-path {
            stroke: #1d4ed8;
            stroke-width: 3;
          }
          .react-flow__controls {
            background: #1f2937;
            border: 1px solid #4b5563;
          }
          .react-flow__controls-button {
            border-bottom: 1px solid #4b5563;
            color: #9ca3af;
          }
          .react-flow__controls-button:hover {
            background: #374151;
          }
          .react-flow__controls-button svg {
            fill: #9ca3af;
          }
        `}</style>
      </AppContainer>
    </Router>
  );
};

export default App;
