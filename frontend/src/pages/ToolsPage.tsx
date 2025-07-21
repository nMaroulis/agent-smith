import { useState, useRef, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { useServer } from '../contexts/ServerContext';
import { FiCode, FiPlus, FiX, FiSearch, FiMaximize2, FiMinimize2, FiHelpCircle } from 'react-icons/fi';
import { Popover } from '@headlessui/react';

// Lazy load the Monaco Editor
const MonacoEditor = lazy(() => import('@monaco-editor/react'));

// Fallback component for editor loading
const EditorLoading = () => (
  <div className="flex items-center justify-center h-full bg-gray-900">
    <div className="animate-pulse text-gray-500">Loading editor...</div>
  </div>
);

// Define types for the code editor
interface IStandaloneCodeEditor {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
}

type ToolType = 'rag' | 'web_search' | 'custom_code' | 'agent' | 'api_call' | 'llm_tool' | 'other';

interface LLMConfig {
  provider: string;
  alias: string;
  model: string;
  temperature: number;
  max_tokens: number;
}

interface ToolConfig {
  llm_config: LLMConfig | null;
  [key: string]: any;
}

interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: any;
}

interface ToolBase {
  name: string;
  description: string;
  type: ToolType;
  config: ToolConfig;
  code: string;
  is_active: boolean;
  parameters: ToolParameter[];
}

interface Tool extends ToolBase {
  id: number | string;
}

const ToolsPage = () => {
  // Initialize server URL from context
  const { serverUrl } = useServer();
  
  // State management
  const [tools, setTools] = useState<Tool[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [availableLLMs, setAvailableLLMs] = useState<any[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // Refs
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  
  // Form data state
  const [formData, setFormData] = useState<ToolBase>({
    name: '',
    description: '',
    type: 'custom_code' as ToolType,
    config: {
      llm_config: null
    },
    code: '',
    is_active: true,
    parameters: []
  });

  // Memoize the tool type options to prevent unnecessary re-renders
  const toolTypeOptions = useMemo(() => [
    { value: 'rag', label: 'RAG' },
    { value: 'web_search', label: 'Web Search' },
    { value: 'custom_code', label: 'Custom Code' },
    { value: 'agent', label: 'Agent' },
    { value: 'api_call', label: 'API Call' },
    { value: 'llm_tool', label: 'LLM Tool' },
    { value: 'other', label: 'Other' },
  ], []);

  // Fetch tools from the server
  const fetchTools = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/api/tools/`);
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }
      const data = await response.json();
      setTools(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch tools');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [serverUrl]);

  // Initialize tools and LLMs on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchTools();
        await loadLLMs();
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    initializeData();
  }, [fetchTools]);

  // Load available LLMs
  const loadLLMs = async () => {
    try {
      const response = await fetch(`${serverUrl}/api/llms/remote`);
      if (!response.ok) throw new Error('Failed to fetch LLMs');
      const llms = await response.json();
      setAvailableLLMs(llms);
      return llms;
    } catch (error) {
      console.error('Error fetching LLMs:', error);
      setError('Failed to load LLMs');
      return [];
    }
  };

  // Fetch models for a specific LLM alias
  const fetchModels = async (alias: string) => {
    try {
      const response = await fetch(`${serverUrl}/api/llms/remote/${alias}/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      const models = data.models || [];
      setAvailableModels(models);
      return models;
    } catch (error) {
      console.error('Error fetching models:', error);
      setAvailableModels([]);
      return [];
    }
  };

  // Handle LLM provider change
  const handleLLMProviderChange = async (alias: string) => {
    const models = await fetchModels(alias);
    const selectedLLM = availableLLMs.find(llm => llm.alias === alias);
    
    if (!selectedLLM) return;
    
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        llm_config: {
          provider: selectedLLM.provider,
          alias,
          model: models[0] || '',
          temperature: 0.7,
          max_tokens: 1000
        }
      }
    }));
  };

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      type: 'custom_code' as ToolType,
      config: {
        llm_config: {
          provider: '',
          alias: '',
          model: '',
          temperature: 0.7,
          max_tokens: 1000
        }
      },
      code: '',
      is_active: true,
      parameters: []
    });
    setEditingTool(null);
    setIsPreview(false);
    setPreviewCode('');
    setError(null);
  }, []);

  const toggleForm = useCallback(() => {
    const newIsCreating = !isCreating;
    setIsCreating(newIsCreating);
    if (!newIsCreating) {
      resetForm();
    }
  }, [isCreating, resetForm]);
  
  // Handle editor initialization
  const handleEditorDidMount = useCallback((editor: IStandaloneCodeEditor) => {
    editorRef.current = editor;
    setTimeout(() => {
      try {
        editor.focus();
      } catch (error) {
        console.error('Error focusing editor:', error);
      }
    }, 0);
  }, []);
  
  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);
  
  // Generate default RAG prompt
  const generateDefaultRAGPrompt = useCallback(() => {
    const defaultPrompt = `You are a helpful assistant that provides accurate information based on the retrieved context.

Context:
{context}

Question: {question}

Please provide a detailed and accurate answer based on the context above. If the context doesn't contain enough information to answer the question, say "I don't have enough information to answer that question."`;
    
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        llm_followup_prompt: defaultPrompt
      }
    }));
  }, []);

  // Generate default web search prompt
  const generateDefaultWebSearchPrompt = useCallback(() => {
    const defaultPrompt = `You are a helpful research assistant. Below are search results for the query: "{query}"

Search Results:
{search_results}

Please provide a comprehensive summary of the search results, focusing on the most relevant and reliable information. Include key points, statistics, and any other important details. If the search results are not relevant to the query, please state that clearly.`;
    
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        llm_followup_prompt: defaultPrompt
      }
    }));
  }, []);

  // Handle code changes in the editor
  const handleCodeChange = useCallback((value: string = '') => {
    setFormData(prev => ({ ...prev, code: value }));
  }, []);
  
  // Handle input changes in the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Handle nested config properties for llm_config
    if (name.startsWith('config.llm_config.')) {
      const configKey = name.split('.')[2] as keyof LLMConfig;
      
      setFormData(prev => {
        // Create a new llm_config object with default values if it doesn't exist
        const currentLLMConfig: LLMConfig = prev.config.llm_config || {
          provider: '',
          alias: '',
          model: '',
          temperature: 0.7,
          max_tokens: 1000
        };
        
        // Create a new config with the updated llm_config
        const newConfig = {
          ...prev.config,
          llm_config: {
            ...currentLLMConfig,
            [configKey]: type === 'number' ? Number(value) : value
          }
        };
        
        // Return the new state with the updated config
        return {
          ...prev,
          config: newConfig
        };
      });
    } 
    // Handle other config properties
    else if (name.startsWith('config.')) {
      const configKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          [configKey]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
        }
      }));
    } 
    // Handle top-level form fields
    else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await fetch(`${serverUrl}/api/tools/preview_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          // Ensure we don't send the ID for new tools
          id: undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate preview');
      }

      const { code } = await response.json();
      setPreviewCode(code);
      setIsPreview(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create a new config object
      const newConfig = { ...formData.config };
      
      // If this is an LLM tool, ensure llm_config has all required fields
      if (formData.type === 'llm_tool' && formData.config.llm_config) {
        newConfig.llm_config = {
          provider: formData.config.llm_config.provider || '',
          alias: formData.config.llm_config.alias || '',
          model: formData.config.llm_config.model || '',
          temperature: formData.config.llm_config.temperature || 0.7,
          max_tokens: formData.config.llm_config.max_tokens || 1000
        };
      } else {
        // For non-LLM tools, set llm_config to null
        newConfig.llm_config = null;
      }
      
      // Prepare submission data
      const submissionData: ToolBase = {
        ...formData,
        config: newConfig,
        // Use preview code if available
        ...(isPreview && previewCode ? { code: previewCode } : {})
      };

      const url = editingTool 
        ? `${serverUrl}/api/tools/${editingTool.id}`
        : `${serverUrl}/api/tools/`;
      
      const method = editingTool ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) throw new Error('Failed to save tool');
      
      await fetchTools();
      resetForm();
      setIsCreating(false);
      setIsPreview(false);
      setPreviewCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tool');
    }
  };

  const handleEditTool = async (toolToEdit: Tool) => {
    // Ensure llm_config exists in the tool's config
    const toolConfig = { ...toolToEdit.config };
    if (toolToEdit.type === 'llm_tool') {
      toolConfig.llm_config = toolConfig.llm_config || {
        provider: '',
        alias: '',
        model: '',
        temperature: 0.7,
        max_tokens: 1000
      };
    }
    
    // Set the form data with the tool to edit
    setFormData({
      name: toolToEdit.name,
      description: toolToEdit.description || '',
      type: toolToEdit.type,
      config: toolConfig,
      code: toolToEdit.code || '',
      is_active: toolToEdit.is_active,
      parameters: toolToEdit.parameters || []
    });
    
    setEditingTool(toolToEdit);
    setIsCreating(true);
    
    // If it's an LLM tool, load the available models for the selected provider
    if (toolToEdit.type === 'llm_tool' && toolToEdit.config?.llm_config?.alias) {
      await fetchModels(toolToEdit.config.llm_config.alias);
    }
    
    // Generate and show preview code when editing
    try {
      const response = await fetch(`${serverUrl}/api/tools/preview_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...toolToEdit,
          id: undefined, // Don't send ID for preview
        }),
      });

      if (response.ok) {
        const { code } = await response.json();
        setPreviewCode(code);
        setIsPreview(true);
      }
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError('Failed to generate code preview');
    }
  };

  const handleDeleteTool = async (id: number | string) => {
    try {
      await fetch(`${serverUrl}/api/tools/${id}`, {
        method: 'DELETE',
      });
      fetchTools();
    } catch (err) {
      setError('Failed to delete tool');
      console.error('Error deleting tool:', err);
    }
  };

  const filteredTools = tools.filter((tool: Tool) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = tool.name.toLowerCase().includes(searchLower) ||
                        (tool.description || '').toLowerCase().includes(searchLower);
    const matchesType = filterType === 'all' || tool.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading && !tools.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="w-full px-0 mx-0">
      <div className="p-6 w-full max-w-full">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Tools</h1>
            <p className="text-sm text-gray-400">
              Manage your AI tools and integrations
            </p>
          </div>
          <button
            onClick={toggleForm}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isCreating 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                : 'bg-blue-600 text-white hover:bg-blue-500'
            }`}
          >
            {isCreating ? <FiX className="mr-2 h-4 w-4" /> : <FiPlus className="mr-2 h-4 w-4" />}
            {isCreating ? 'Cancel' : 'New Tool'}
          </button>
        </div>

        {/* Search and Filter - Only show when not in form mode */}
        {!isCreating && !editingTool && (
          <div className="flex flex-col sm:flex-row items-end gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm h-[38px]"
                placeholder="Search tools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                id="filter-type"
                className="block w-full pl-3 pr-10 py-2 border border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white appearance-none h-[38px]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                {toolTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Create/Edit Form */}
        {(isCreating || editingTool) && (
          <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full max-w-7xl h-[90vh] flex flex-col">
              <div className="px-8 py-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-semibold text-white">
                  {editingTool ? 'Edit Tool' : 'Create New Tool'}
                </h2>
              </div>
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="space-y-6 p-8">

                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-1">
                      Tool Type
                    </label>
                    {isPreview ? (
                      <input
                        type="text"
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none sm:text-sm rounded-md bg-gray-700 text-gray-300 cursor-not-allowed"
                        value={toolTypeOptions.find(opt => opt.value === formData.type)?.label || formData.type}
                        disabled
                      />
                    ) : (
                      <select
                        id="type"
                        name="type"
                        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md ${editingTool ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' : 'bg-gray-700 text-white'}`}
                        value={formData.type}
                        onChange={handleInputChange}
                        disabled={!!editingTool}
                      >
                        {toolTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                      Description
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="description"
                        name="description"
                        rows={3}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
                        value={formData.description}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  {/* RAG Configuration */}
                  {formData.type === 'web_search' && (
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
                          onChange={handleInputChange}
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
                            onChange={handleInputChange}
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
                          onChange={handleInputChange}
                        />
                      </div>

                      <div>
                        <label htmlFor="filter_regex" className="block text-sm font-medium text-gray-300 mb-1">
                          Filter Regex
                        </label>
                        <input
                          type="text"
                          id="filter_regex"
                          name="config.filter_regex"
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2 font-mono text-sm"
                          placeholder="e.g., (?i)exclude-this"
                          value={formData.config?.filter_regex || ''}
                          onChange={handleInputChange}
                        />
                        <p className="mt-1 text-xs text-gray-400">Regular expression to filter or clean search results</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-300">
                            Post-process Code
                          </label>
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="text-gray-400 hover:text-blue-400 p-1 rounded-full"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                          >
                            {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                          </button>
                        </div>
                        <div className={`border border-gray-700 rounded-md overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50 bg-gray-900' : 'relative h-48'}`}>
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
                          <Suspense fallback={<EditorLoading />}>
                            <MonacoEditor
                              height={isFullscreen ? 'calc(100% - 40px)' : '100%'}
                              defaultLanguage="python"
                              value={formData.config?.postprocess_code || ''}
                              onChange={(value = '') => {
                                setFormData(prev => ({
                                  ...prev,
                                  config: {
                                    ...prev.config,
                                    postprocess_code: value
                                  }
                                }));
                              }}
                              onMount={handleEditorDidMount}
                              theme="vs-dark"
                              options={{
                                minimap: { enabled: true },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                wordWrap: 'on',
                                automaticLayout: true,
                                tabSize: 2,
                              }}
                            />
                          </Suspense>
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
                            onClick={generateDefaultWebSearchPrompt}
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
                          onChange={handleInputChange}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          This prompt will be used to process search results with an LLM. Use {'{query}'} to insert the search query and {'{search_results}'} for the search results.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.type === 'rag' && (
                    <div className="space-y-6 bg-gray-700/30 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-white">RAG Configuration</h3>
                      
                      <div>
                        <label htmlFor="rag_type" className="block text-sm font-medium text-gray-300 mb-1">
                          RAG Type *
                        </label>
                        <select
                          id="rag_type"
                          name="config.rag_type"
                          required
                          className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
                          value={formData.config?.rag_type || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Select RAG type</option>
                          <option value="local">Local</option>
                          <option value="remote">Remote</option>
                          <option value="hybrid">Hybrid</option>
                        </select>
                      </div>

                      <div>
                        <label htmlFor="library" className="block text-sm font-medium text-gray-300 mb-1">
                          Vector Store Library *
                        </label>
                        <select
                          id="library"
                          name="config.library"
                          required
                          className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
                          value={formData.config?.library || ''}
                          onChange={handleInputChange}
                        >
                          <option value="">Select library</option>
                          <option value="ChromaDB">ChromaDB</option>
                          <option value="FAISS">FAISS</option>
                          <option value="Weaviate">Weaviate</option>
                          <option value="Qdrant">Qdrant</option>
                          <option value="Milvus">Milvus</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>

                      {(formData.config?.rag_type === 'local' || formData.config?.rag_type === 'hybrid') && (
                        <div>
                          <label htmlFor="vector_store_path" className="block text-sm font-medium text-gray-300 mb-1">
                            Vector Store Path *
                          </label>
                          <input
                            type="text"
                            id="vector_store_path"
                            name="config.vector_store_path"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
                            placeholder="./data/vector_store"
                            value={formData.config?.vector_store_path || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                      )}

                      {(formData.config?.rag_type === 'remote' || formData.config?.rag_type === 'hybrid') && (
                        <div>
                          <label htmlFor="vector_store_url" className="block text-sm font-medium text-gray-300 mb-1">
                            Vector Store URL *
                          </label>
                          <input
                            type="url"
                            id="vector_store_url"
                            name="config.vector_store_url"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
                            placeholder="https://example.com/vector-api"
                            value={formData.config?.vector_store_url || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                      )}

                      <div className="space-y-4 mt-6">
                        <h4 className="text-md font-medium text-gray-300">Retrieval Settings</h4>
                        
                        <div>
                          <label htmlFor="retriever_top_k" className="block text-sm font-medium text-gray-300 mb-1">
                            Number of Documents to Retrieve
                          </label>
                          <input
                            type="number"
                            id="retriever_top_k"
                            name="config.retriever_top_k"
                            min="1"
                            max="20"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
                            value={formData.config?.retriever_top_k || 3}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div>
                          <label htmlFor="similarity_threshold" className="block text-sm font-medium text-gray-300 mb-1">
                            Similarity Threshold (0-1)
                          </label>
                          <input
                            type="number"
                            id="similarity_threshold"
                            name="config.similarity_threshold"
                            min="0"
                            max="1"
                            step="0.05"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
                            value={formData.config?.similarity_threshold || 0.7}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            id="use_mmr"
                            name="config.use_mmr"
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                            checked={formData.config?.use_mmr || false}
                            onChange={handleInputChange}
                          />
                          <label htmlFor="use_mmr" className="ml-2 block text-sm text-gray-300">
                            Use Maximal Marginal Relevance (MMR)
                          </label>
                        </div>

                        <div>
                          <label htmlFor="score_function" className="block text-sm font-medium text-gray-300 mb-1">
                            Similarity Function
                          </label>
                          <select
                            id="score_function"
                            name="config.score_function"
                            className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
                            value={formData.config?.score_function || 'cosine'}
                            onChange={handleInputChange}
                          >
                            <option value="cosine">Cosine Similarity</option>
                            <option value="dot_product">Dot Product</option>
                            <option value="euclidean">Euclidean Distance</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center mb-1">
                            <label htmlFor="index_name" className="block text-sm font-medium text-gray-300">
                              Index Name
                            </label>
                            <Popover className="relative ml-2">
                              <Popover.Button className="text-gray-400 hover:text-blue-400 focus:outline-none">
                                <FiHelpCircle className="h-4 w-4" />
                              </Popover.Button>
                              <Popover.Panel className="absolute z-10 w-72 p-3 mt-2 bg-gray-800 border border-gray-600 rounded-md shadow-lg">
                                <div className="text-sm text-gray-200">
                                  <h4 className="font-medium mb-2">Index Name by Library</h4>
                                  <div className="overflow-x-auto">
                                    <table className="min-w-full text-xs">
                                      <thead>
                                        <tr className="border-b border-gray-600">
                                          <th className="text-left py-1 pr-2">Library</th>
                                          <th className="text-left py-1 px-2">Equivalent</th>
                                          <th className="text-left py-1 pl-2">Purpose</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-700">
                                        <tr>
                                          <td className="py-1 pr-2">ChromaDB</td>
                                          <td className="py-1 px-2">collection_name</td>
                                          <td className="py-1 pl-2">Logical grouping of documents/vectors</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1 pr-2">FAISS</td>
                                          <td className="py-1 px-2">-</td>
                                          <td className="py-1 pl-2">No native names (you store/load from path)</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1 pr-2">Weaviate</td>
                                          <td className="py-1 px-2">class name</td>
                                          <td className="py-1 pl-2">Defines a schema and namespace</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1 pr-2">Qdrant</td>
                                          <td className="py-1 px-2">collection_name</td>
                                          <td className="py-1 pl-2">The name of a vector collection</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1 pr-2">Milvus</td>
                                          <td className="py-1 px-2">collection_name</td>
                                          <td className="py-1 pl-2">The container for your indexed vectors</td>
                                        </tr>
                                        <tr>
                                          <td className="py-1 pr-2">Pinecone</td>
                                          <td className="py-1 px-2">index_name</td>
                                          <td className="py-1 pl-2">Top-level index (also defines namespace)</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </Popover.Panel>
                            </Popover>
                          </div>
                          <input
                            type="text"
                            id="index_name"
                            name="config.index_name"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2"
                            placeholder="default_index"
                            value={formData.config?.index_name || ''}
                            onChange={handleInputChange}
                          />
                        </div>

                        <div>
                          <label htmlFor="filter_metadata" className="block text-sm font-medium text-gray-300 mb-1">
                            Filter Metadata (JSON)
                          </label>
                          <textarea
                            id="filter_metadata"
                            name="config.filter_metadata"
                            rows={3}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2 font-mono text-sm"
                            placeholder='{"source": "docs", "lang": "en"}'
                            value={formData.config?.filter_metadata ? JSON.stringify(formData.config.filter_metadata, null, 2) : '{}'}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value);
                                setFormData(prev => ({
                                  ...prev,
                                  config: {
                                    ...prev.config,
                                    filter_metadata: parsed
                                  }
                                }));
                              } catch (err) {
                                // Invalid JSON, don't update
                              }
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label htmlFor="rag_llm_prompt" className="block text-sm font-medium text-gray-300">
                            LLM Follow-up Prompt
                          </label>
                          <button
                            type="button"
                            onClick={generateDefaultRAGPrompt}
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                          >
                            Use Default
                          </button>
                        </div>
                        <textarea
                          id="rag_llm_prompt"
                          name="config.llm_followup_prompt"
                          rows={4}
                          className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white p-2 font-mono text-sm"
                          placeholder="Enter a prompt to process the retrieved context with an LLM..."
                          value={formData.config?.llm_followup_prompt || ''}
                          onChange={handleInputChange}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          This prompt will be used to process the retrieved context with an LLM. Use {'{context}'} to insert the retrieved context and {'{question}'} for the user's query.
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.type === 'custom_code' && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-300">
                          {isPreview ? 'Generated Code Preview' : 'Code'}
                        </label>
                        <button
                          type="button"
                          onClick={toggleFullscreen}
                          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                        >
                          {isFullscreen ? <FiMinimize2 size={12} /> : <FiMaximize2 size={12} />}
                        </button>
                      </div>
                      <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900 p-4' : 'relative'}`}>
                        {isFullscreen && (
                          <div className="absolute top-4 right-4 z-10">
                            <button
                              type="button"
                              onClick={toggleFullscreen}
                              className="text-gray-300 hover:text-white"
                            >
                              <FiX size={20} />
                            </button>
                          </div>
                        )}
                        {isPreview ? (
                          <div className="h-96 w-full bg-gray-900 p-4 rounded-md overflow-auto">
                            <pre className="text-gray-200 text-sm font-mono whitespace-pre-wrap">
                              {previewCode || 'No code generated'}
                            </pre>
                          </div>
                        ) : (
                          <div className="h-96 w-full">
                            <Suspense fallback={<EditorLoading />}>
                              <MonacoEditor
                                height="100%"
                                language="python"
                                theme="vs-dark"
                                value={formData.code}
                                onChange={handleCodeChange}
                                onMount={handleEditorDidMount}
                                options={{
                                  minimap: { enabled: true },
                                  scrollBeyondLastLine: false,
                                  fontSize: 14,
                                  wordWrap: 'on',
                                  automaticLayout: true,
                                }}
                              />
                            </Suspense>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isPreview && formData.type !== 'custom_code' && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-300">
                          Generated Code
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="text-gray-400 hover:text-gray-200"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                          >
                            {isFullscreen ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="relative h-96 w-full bg-gray-900 p-4 rounded-md overflow-auto">
                        {isFullscreen && (
                          <div className="absolute top-4 right-4 z-10">
                            <button
                              type="button"
                              onClick={toggleFullscreen}
                              className="text-gray-300 hover:text-white"
                            >
                              <FiX size={20} />
                            </button>
                          </div>
                        )}
                        <pre className="text-gray-200 text-sm font-mono whitespace-pre-wrap">
                          {previewCode || 'No code generated'}
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-300">
                      Active
                    </label>
                  </div>

                  <div className="sticky bottom-0 bg-gray-800 pt-4 pb-2 -mx-8 px-8 border-t border-gray-700 mt-6">
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreating(false);
                          resetForm();
                        }}
                        className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                      {isPreview ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setIsPreview(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                          >
                            Back to Edit
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Saving...' : 'Save Tool'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={handlePreview}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Generating...' : 'Preview Code'}
                          </button>
                          <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {editingTool ? 'Update Tool' : 'Create Tool'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tool configuration form */}
        {isCreating && (
          <div className="mb-6 bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">
                {editingTool ? 'Edit Tool' : 'Create New Tool'}
              </h2>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                  title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                </button>
                <button
                  type="button"
                  onClick={toggleForm}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                  title="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                    required
                  >
                    {toolTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                />
              </div>

              {/* LLM Tool Configuration */}
              {formData.type === 'llm_tool' && (
                <div className="space-y-4 p-4 bg-gray-750 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300">LLM Configuration</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      LLM Provider *
                    </label>
                    <select
                      className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                      value={formData.config.llm_config?.alias || ''}
                      onChange={(e) => handleLLMProviderChange(e.target.value)}
                      required
                    >
                      <option value="">Select a provider</option>
                      {availableLLMs.map((llm) => (
                        <option key={llm.alias} value={llm.alias}>
                          {llm.alias} ({llm.provider})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Model *
                    </label>
                    <select
                      className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                      value={formData.config.llm_config?.model || ''}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        setFormData(prev => {
                          const currentLLMConfig = prev.config.llm_config || {
                            provider: '',
                            alias: '',
                            model: '',
                            temperature: 0.7,
                            max_tokens: 1000
                          };
                          
                          return {
                            ...prev,
                            config: {
                              ...prev.config,
                              llm_config: {
                                ...currentLLMConfig,
                                model: newValue
                              }
                            }
                          };
                        });
                      }}
                      disabled={!formData.config.llm_config?.alias}
                      required
                    >
                      <option value="">Select a model</option>
                      {availableModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Temperature
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                        value={formData.config.llm_config?.temperature ?? 0.7}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value) || 0.7;
                          setFormData(prev => {
                            const currentLLMConfig = prev.config.llm_config || {
                              provider: '',
                              alias: '',
                              model: '',
                              temperature: 0.7,
                              max_tokens: 1000
                            };
                            
                            return {
                              ...prev,
                              config: {
                                ...prev.config,
                                llm_config: {
                                  ...currentLLMConfig,
                                  temperature: newValue
                                }
                              }
                            };
                          });
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-gray-700 text-white rounded px-3 py-2 text-sm"
                        value={formData.config.llm_config?.max_tokens ?? 1000}
                        onChange={(e) => {
                          const newValue = parseInt(e.target.value) || 1000;
                          setFormData(prev => {
                            const currentLLMConfig = prev.config.llm_config || {
                              provider: '',
                              alias: '',
                              model: '',
                              temperature: 0.7,
                              max_tokens: 1000
                            };
                            
                            return {
                              ...prev,
                              config: {
                                ...prev.config,
                                llm_config: {
                                  ...currentLLMConfig,
                                  max_tokens: newValue
                                }
                              }
                            };
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Code Editor */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Code
                  </label>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handlePreview}
                      disabled={isSubmitting}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Generating...' : 'Preview'}
                    </button>
                  </div>
                </div>

                <div className={`bg-gray-900 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 m-0' : 'h-96'}`}>
                  <div className="flex justify-between items-center bg-gray-800 px-4 py-2">
                    <span className="text-xs text-gray-400">
                      {formData.type}.py
                    </span>
                    <button
                      type="button"
                      onClick={toggleFullscreen}
                      className="text-gray-400 hover:text-white"
                      title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    >
                      {isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
                    </button>
                  </div>
                  <Suspense fallback={<EditorLoading />}>
                    <MonacoEditor
                      height={isFullscreen ? 'calc(100vh - 40px)' : 'calc(24rem - 40px)'}
                      defaultLanguage="python"
                      value={isPreview && previewCode ? previewCode : formData.code}
                      onChange={handleCodeChange}
                      onMount={handleEditorDidMount}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        wordWrap: 'on',
                        automaticLayout: true,
                      }}
                    />
                  </Suspense>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600"
                  disabled={isSubmitting}
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Tool'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tools List */}
        {!isCreating && !editingTool && (
          <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg mt-2">
            {filteredTools.length === 0 ? (
              <div className="p-8 text-center">
                <FiCode className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-300">No tools found</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating a new tool.'}
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={toggleForm}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                    New Tool
                  </button>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {filteredTools.map((tool) => (
                  <li key={tool.id} className="hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => handleEditTool(tool)}
                        className="flex-1 text-left px-6 py-4 focus:outline-none"
                      >
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center">
                            <FiCode className="h-5 w-5 text-gray-300" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <h3 className="text-sm font-medium text-white">{tool.name}</h3>
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {toolTypeOptions.find(t => t.value === tool.type)?.label || tool.type}
                              </span>
                              {!tool.is_active && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <div className="mt-1">
                              <p className="text-sm text-gray-400 text-left">
                                {tool.description || 'No description provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditTool(tool)}
                          className="p-1.5 rounded-full text-gray-400 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                          title="Edit tool"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${tool.name}?`)) {
                              handleDeleteTool(tool.id);
                            }
                          }}
                          className="p-1.5 rounded-full text-gray-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
                          title="Delete tool"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
