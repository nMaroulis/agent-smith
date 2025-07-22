import React, { useState } from 'react';
import { FiMinimize2, FiMaximize2, FiX } from 'react-icons/fi';

const MonacoEditor = React.lazy(() => import('@monaco-editor/react'));

const EditorLoading = () => (
  <div className="flex items-center justify-center h-full bg-gray-800">
    <div className="text-gray-400">Loading editor...</div>
  </div>
);

interface WebSearchConfigProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onGenerateDefaultPrompt: () => void;
}

export const WebSearchConfig: React.FC<WebSearchConfigProps> = ({
  formData,
  onInputChange,
  onGenerateDefaultPrompt,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleEditorDidMount = (editor: any) => {
    // Editor mounted callback
  };

  return (
    <div className="space-y-6 bg-gray-700/30 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white">Web Search Configuration</h3>
      
      <div>
        <label htmlFor="library" className="block text-sm font-medium text-gray-300 mb-1">
          Library *
        </label>
        <select
          id="library"
          name="config.library"
          required
          className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
          value={formData.config?.library || ''}
          onChange={onInputChange}
        >
          <option value="">Select search provider library</option>
          <option value="DuckDuckGo">DuckDuckGo</option>
          <option value="SerpAPI">SerpAPI</option>
          <option value="Google CSE">Google CSE</option>
          <option value="Bing">Bing</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      {(formData.config?.library === 'SerpAPI' || 
        formData.config?.library === 'Google CSE' || 
        formData.config?.library === 'Bing' ||
        formData.config?.library === 'Custom') && (
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-300 mb-1">
            API Key *
          </label>
          <input
            type="password"
            id="api_key"
            name="config.api_key"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
            placeholder="Enter API key"
            value={formData.config?.api_key || ''}
            onChange={onInputChange}
          />
        </div>
      )}

      <div>
        <label htmlFor="max_results" className="block text-sm font-medium text-gray-300 mb-1">
          Number of Results
        </label>
        <input
          type="number"
          id="max_results"
          name="config.max_results"
          min="1"
          max="50"
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
          value={formData.config?.max_results || 5}
          onChange={onInputChange}
        />
      </div>

      <div className="opacity-50">
        <label htmlFor="filter_regex" className="block text-sm font-medium text-gray-300 mb-1">
          Filter Regex (currently disabled)
        </label>
        <input
          type="text"
          id="filter_regex"
          name="config.filter_regex"
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2 font-mono text-sm"
          placeholder="e.g., (?i)exclude-this"
          value={formData.config?.filter_regex || ''}
          onChange={onInputChange}
          disabled
        />
        <p className="mt-1 text-xs text-gray-400">Regular expression to filter or clean search results</p>
      </div>

      <div className="opacity-50">
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Post-process Code (currently disabled)
          </label>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="text-gray-400 hover:text-blue-400 p-1 rounded-full"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            disabled
          >
            {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
          </button>
        </div>
        <div className={`border border-gray-700 rounded-md overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50 bg-gray-900' : 'relative h-12'}`}>
          {isFullscreen && (
            <div className="flex justify-between items-center p-2 bg-gray-800 border-b border-gray-700">
              <span className="text-sm font-medium text-gray-300">
                {formData.name || 'Untitled Tool'} - Post-process Code
              </span>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="text-gray-400 hover:text-white"
              >
                <FiX size={20} />
              </button>
            </div>
          )}
          <React.Suspense fallback={<EditorLoading />}>
            <MonacoEditor
              height={isFullscreen ? 'calc(100% - 40px)' : '100%'}
              defaultLanguage="python"
              value={formData.config?.postprocess_code || ''}
              onChange={() => {}}
              onMount={handleEditorDidMount}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 12,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 2,
                lineNumbers: 'off',
                glyphMargin: false,
                folding: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 0,
                renderLineHighlight: 'none',
              }}
            />
          </React.Suspense>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Optional code to process search results (JavaScript or Python)
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label htmlFor="llm_followup_prompt" className="block text-sm font-medium text-gray-300">
            LLM Follow-up Prompt
          </label>
          <button
            type="button"
            onClick={onGenerateDefaultPrompt}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
          >
            Use Default
          </button>
        </div>
        <textarea
          id="llm_followup_prompt"
          name="config.llm_followup_prompt"
          rows={4}
          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2 font-mono text-sm"
          placeholder="Enter a prompt to process search results with an LLM..."
          value={formData.config?.llm_followup_prompt || ''}
          onChange={onInputChange}
        />
        <p className="mt-1 text-xs text-gray-400">
          This prompt will be used to process search results with an LLM. Use {'{query}'} to insert the search query and {'{search_results}'} for the search results.
        </p>
      </div>
    </div>
  );
};

export default WebSearchConfig;
