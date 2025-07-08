import { useState } from 'react';

const CodeSidebar = () => {
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

export default CodeSidebar;
