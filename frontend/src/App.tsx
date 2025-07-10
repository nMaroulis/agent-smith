import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Toaster } from 'react-hot-toast';
import { ServerProvider, useServer } from './contexts/ServerContext';
import { BrowserRouter as Router, Link, useLocation, Routes, Route } from 'react-router-dom';
import { FiCpu, FiSettings, FiLayers, FiCode, FiInfo, FiChevronDown, FiTool } from 'react-icons/fi';
import ChatbotPage from './pages/ChatbotPage';
import ToolTesterPage from './pages/ToolTesterPage';
import RAGLabPage from './pages/RAGLabPage';
import { FlowCanvas } from './components/FlowCanvas';
import CodeSidebar from './components/canvas/CodeSidebar';
import NodeSidebar from './components/canvas/NodeSidebar';
import useFlowStore from './store/useFlowStore';
import LLMsPage from './pages/LLMsPage';
import SettingsPage from './pages/SettingsPage';
import ToolsPage from './pages/ToolsPage';
import AboutPage from './pages/AboutPage';
import type { CustomNode } from './types';

const Navigation = () => {
  const location = useLocation();
  
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(document.createElement('div'));
  
  // Create portal container on mount
  useEffect(() => {
    const portalId = 'dropdown-portal';
    let portalElement = document.getElementById(portalId);
    
    if (!portalElement) {
      portalElement = document.createElement('div');
      portalElement.id = portalId;
      portalElement.style.position = 'fixed';
      portalElement.style.top = '0';
      portalElement.style.left = '0';
      portalElement.style.zIndex = '9999';
      document.body.appendChild(portalElement);
    }
    
    portalRef.current = portalElement as HTMLDivElement;
    
    return () => {
      if (document.body.contains(portalElement as Node)) {
        document.body.removeChild(portalElement as Node);
      }
    };
  }, []);
  
  // Update button position when dropdown opens
  useEffect(() => {
    if (isSandboxOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isSandboxOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSandboxOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      icon: <FiTool className="w-5 h-5" />, 
      label: 'Tools',
      activeBg: 'from-green-500/10 to-green-600/10',
      activeText: 'text-green-400',
      hoverBg: 'hover:bg-green-500/10',
      gradient: 'from-green-400 to-green-500'
    },
    // Sandbox dropdown
    {
      id: 'sandbox',
      path: null,
      icon: <FiCode className="w-5 h-5" />,
      label: 'Sandbox',
      activeBg: 'from-pink-500/10 to-pink-600/10',
      activeText: 'text-pink-400',
      hoverBg: 'hover:bg-pink-500/10',
      gradient: 'from-pink-400 to-pink-500',
      isDropdown: true,
      dropdownItems: [
        { id: 'chatbot', path: '/sandbox/chatbot', label: 'Chatbot' },
        { id: 'tool-tester', path: '/sandbox/tool-tester', label: 'Tool Tester' },
        { id: 'rag-lab', path: '/sandbox/rag-lab', label: 'RAG Lab' },
      ]
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

  const isSandboxActive = navItems.some(
    (item) => item.id === 'sandbox' && 
    item.dropdownItems?.some(subItem => location.pathname.startsWith(subItem.path))
  );

  return (
    <nav className="ml-8 flex space-x-1 h-full items-center">
      {navItems.map((item) => {
        const isActive = item.path ? location.pathname === item.path : false;
        const isSandboxItemActive = item.id === 'sandbox' && isSandboxActive;
        
        if (item.isDropdown) {
          return (
            <div key={item.id} className="relative h-full flex items-center">
              <button
                ref={buttonRef}
                onClick={() => setIsSandboxOpen(!isSandboxOpen)}
                className={`group relative flex items-center px-4 py-3 h-full transition-all duration-200 rounded-lg mx-1 ${
                  isSandboxItemActive 
                    ? `${item.activeText} ${item.activeBg} bg-gradient-to-r shadow-lg`
                    : `text-gray-400 ${item.hoverBg} hover:text-gray-200`
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className={`relative z-10 transition-all duration-200 ${isSandboxItemActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                    <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-200 ${
                      isSandboxItemActive ? 'opacity-100' : ''
                    }`}></span>
                    <span className="relative z-10">{item.icon}</span>
                  </span>
                  <span className="font-medium text-sm relative z-10 flex items-center">
                    {item.label}
                    <FiChevronDown className={`ml-1 transition-transform duration-200 ${isSandboxOpen ? 'transform rotate-180' : ''}`} />
                  </span>
                </div>
              </button>
              
              {/* Dropdown menu */}
              {isSandboxOpen && buttonRect && createPortal(
                <div 
                  className="fixed bg-gray-800 rounded-lg shadow-xl overflow-hidden border border-gray-700"
                  style={{
                    top: `${buttonRect.bottom}px`,
                    left: `${buttonRect.left}px`,
                    width: '12rem',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.dropdownItems?.map((subItem) => {
                    const isSubItemActive = location.pathname === subItem.path;
                    return (
                      <div key={subItem.id} className="w-full">
                        <Link
                          to={subItem.path}
                          onClick={() => setIsSandboxOpen(false)}
                          className={`block w-full px-4 py-3 text-sm text-left ${
                            isSubItemActive 
                              ? 'bg-gray-700 text-white' 
                              : 'text-gray-300 hover:bg-gray-700/50'
                          } transition-colors duration-200`}
                        >
                          {subItem.label}
                        </Link>
                      </div>
                    );
                  })}
                </div>,
                portalRef.current
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.id}
            to={item.path || '#'}
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
    console.log('Updating node:', updatedNode);
    updateNode(updatedNode.id, {
      ...updatedNode,
      data: {
        ...updatedNode.data,
        // Ensure llm is properly included in the update
        llm: updatedNode.data.llm ? { ...updatedNode.data.llm } : undefined
      }
    });
    setSelectedNode(updatedNode);
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      <NodeSidebar node={selectedNode} onUpdate={handleNodeUpdate} />
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
              {/* Sandbox Routes */}
              <Route path="/sandbox/chatbot" element={<ChatbotPage />} />
              <Route path="/sandbox/tool-tester" element={<ToolTesterPage />} />
              <Route path="/sandbox/rag-lab" element={<RAGLabPage />} />
              <Route path="/sandbox" element={<ChatbotPage />} />
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
