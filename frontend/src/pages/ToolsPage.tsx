import { useState, useRef, useCallback, useMemo, useEffect, Suspense, lazy } from 'react';
import { useServer } from '../contexts/ServerContext';
import { FiCode, FiPlus, FiX, FiSearch, FiMaximize2, FiMinimize2, FiHelpCircle } from 'react-icons/fi';
import { WebSearchConfig } from '../components/tools/WebSearchConfig';
import { RAGConfig } from '../components/tools/RAGConfig';
import { CodeEditorConfig } from '../components/tools/CodeEditorConfig';

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
                ? 'bg-red-600 hover:bg-red-500 text-white' 
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
          <div className="mb-8 bg-gray-800 rounded-lg border border-gray-700 max-h-[80vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
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
                  {/* Standard Tool Configuration */}
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

                  {/* Web Search Configuration */}
                  {formData.type === 'web_search' && (
                    <WebSearchConfig 
                    formData={formData} 
                    onInputChange={handleInputChange}
                    onGenerateDefaultPrompt={generateDefaultWebSearchPrompt}
                  />
                  )}

                  {/* RAG Configuration */}
                  {formData.type === 'rag' && (
                    <RAGConfig 
                      formData={formData}
                      onInputChange={handleInputChange}
                      onGenerateDefaultPrompt={generateDefaultRAGPrompt}
                      setFormData={setFormData}
                    />
                  )}

                  {formData.type === 'custom_code' && (
                    <CodeEditorConfig 
                      code={formData.code || ''}
                      onCodeChange={(value: string) => setFormData(prev => ({
                        ...prev,
                        code: value || ''
                      }))}
                      previewCode={previewCode}
                      isPreview={isPreview}
                      language="python"
                    />                  
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
