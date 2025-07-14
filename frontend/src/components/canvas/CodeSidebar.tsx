import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import useFlowStore from '../../store/useFlowStore';
import { FiCode } from 'react-icons/fi';

// Lazy load the Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Fallback component for editor loading
const EditorLoading = () => (
  <div className="flex items-center justify-center h-full bg-gray-900 p-4">
    <div className="animate-pulse text-gray-500">Loading editor...</div>
  </div>
);

interface CodeSidebarProps {
  flowId?: string; // Optional flow ID for saving/loading specific flows
}

const CodeSidebar = ({ flowId }: CodeSidebarProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // Toggle sidebar collapsed state
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };
  
  // Get nodes and edges from the flow store
  const { nodes, edges } = useFlowStore();

  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const stopResizing = () => {
    setIsResizing(false);
  };

  const resize = (e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      const newWidth = window.innerWidth - e.clientX;
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

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Prepare the flow data in the same format as SaveLoadFlow
      const flowData = {
        name: flowId ? `Flow ${flowId}` : 'Untitled Flow',
        description: `Generated on ${new Date().toLocaleString()}`,
        graph: {
          nodes,
          edges
        },
        state: { fields: [] } // Empty state as in SaveLoadFlow
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/flows/generate/code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(flowData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      // The backend returns { code: '...' }
      const generatedCode = result?.code;
      
      if (typeof generatedCode === 'string' && generatedCode.trim()) {
        setGeneratedCode(generatedCode);
      } else {
        throw new Error('No code was generated');
      }
    } catch (err) {
      console.error('Failed to generate code:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate code');
      setGeneratedCode('');
    } finally {
      setIsGenerating(false);
    }
  };

  // When collapsed, only show a thin bar with a button to expand
  if (isCollapsed) {
    return (
      <div className="h-full w-8 bg-gray-800 border-l border-gray-700 flex items-center justify-center group hover:bg-gray-750 transition-colors">
        <button
          onClick={toggleCollapse}
          className="w-8 h-16 flex items-center justify-center text-gray-400 hover:text-white group-hover:bg-gray-700 rounded-r"
          title="Show code panel"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 transform -rotate-90" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
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
        <h2 className="text-lg font-semibold text-white">Generated Code</h2>
        <button
          onClick={toggleCollapse}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
          title="Collapse panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4">
          <button
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium flex items-center justify-center space-x-2 ${
              isGenerating
                ? 'bg-blue-700 text-blue-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FiCode size={16} />
            <span>{isGenerating ? 'Generating...' : 'Generate Code'}</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden border-t border-gray-700">
          {isGenerating ? (
            <div className="h-full flex items-center justify-center">
              <div className="animate-pulse space-y-2 text-center">
                <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                <div className="text-xs text-gray-500">Generating code...</div>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="text-red-400 text-center">
                <div className="font-medium">Error</div>
                <div className="text-sm mt-1">{error}</div>
              </div>
            </div>
          ) : generatedCode ? (
            <Suspense fallback={<EditorLoading />}>
              <MonacoEditor
                height="100%"
                defaultLanguage="python"
                value={generatedCode}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  wordWrap: 'on',
                  automaticLayout: true,
                }}
              />
            </Suspense>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FiCode size={32} className="mx-auto mb-2 opacity-50" />
                <p>Generated code will appear here</p>
                <p className="text-xs mt-1">Click "Generate Code" to begin</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Resize handle */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500 active:bg-blue-600 transition-colors"
        onMouseDown={startResizing}
      />
    </div>
  );
};

export default CodeSidebar;
