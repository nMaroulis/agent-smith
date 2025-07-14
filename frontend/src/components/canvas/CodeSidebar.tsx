import { useState } from 'react';
import useFlowStore from '../../store/useFlowStore';

interface CodeSidebarProps {
  flowId?: string; // Optional flow ID for saving/loading specific flows
}

const CodeSidebar = ({ flowId }: CodeSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Get nodes and edges from the flow store
  const { nodes, edges } = useFlowStore();

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

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
              <div className="bg-gray-900 p-3 rounded text-xs font-mono text-gray-300 overflow-auto max-h-96">
                {isGenerating ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-400">Error: {error}</div>
                ) : generatedCode ? (
                  <pre className="whitespace-pre-wrap break-words">{generatedCode}</pre>
                ) : (
                  <span className="text-gray-500">Generated code will appear here...</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeSidebar;
