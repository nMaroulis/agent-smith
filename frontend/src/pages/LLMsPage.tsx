import { useState, useEffect } from 'react';
import { FiRefreshCw, FiEdit2, FiTrash2, FiCpu, FiServer, FiAlertCircle, FiKey, FiArrowLeft } from 'react-icons/fi';
import { llmService, type LLM, type APIProvider } from '../services/llmService';

type LLMType = 'api' | 'local';


const LLMsPage = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'add'>('active');
  const [llms, setLlms] = useState<LLM[]>([]);
  const [filter, setFilter] = useState<'all' | 'api' | 'local'>('all');

  const [selectedLLM, setSelectedLLM] = useState<LLM | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableEmbeddings, setAvailableEmbeddings] = useState<string[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  // Filter LLMs based on the selected filter
  const filteredLLMs = llms.filter(llm => {
    if (filter === 'all') return true;
    return llm.type === filter;
  });
  
  // Form state
  const [llmType, setLlmType] = useState<LLMType>('api');
  const [apiProvider, setApiProvider] = useState<APIProvider>('openai');
  const [localProvider, setLocalProvider] = useState<APIProvider>('llama-cpp');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [alias, setAlias] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  type ValidationStatus = { valid: boolean | null; message: string };
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>({valid: null, message: ''});
  const [error, setError] = useState<string | null>(null);

  // Helper function to get provider display name
  const getProviderName = (provider?: APIProvider | string) => {
    if (!provider) return 'Unknown';
    const names: Record<string, string> = {
      'openai': 'OpenAI',
      'anthropic': 'Anthropic',
      'huggingface': 'Hugging Face',
      'llama-cpp': 'LLaMA.cpp'
    };
    return names[provider] || provider;
  };

  const fetchLLMs = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const [apiLLMs, localLLMs] = await Promise.all([
        llmService.listApiLLMs(),
        llmService.listLocalLLMs(),
      ]);
      setLlms([...apiLLMs, ...localLLMs]);
    } catch (err) {
      console.error('Failed to fetch LLMs:', err);
      setLoadError('Failed to load models. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLLMs();
  }, []);

  // Using fetchLLMs directly instead of handleRefresh

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (llmType === 'api' && !apiKey) {
      setError('API key is required');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Create a new LLM object
      const provider = llmType === 'api' ? apiProvider : localProvider;
      const llmAlias = alias || (llmType === 'api' ? provider : selectedModel.split('/').pop() || 'Local Model');
      
      const llmData: Omit<LLM, 'id'> = {
        type: llmType,
        provider,
        alias: llmAlias,
        ...(llmType === 'api' && { 
          apiKey,
          baseUrl: baseUrl || undefined,
          model: selectedModel || undefined
        }),
        ...(llmType === 'local' && { 
          path: selectedModel,
          model: selectedModel.split('/').pop()
        })
      };
      
      let updatedLLM: LLM;
      
      if (isEditing) {
        // Update existing LLM
        updatedLLM = await llmService.updateLLM(isEditing, llmData, llmType);
        setLlms(prevLlms => prevLlms.map(llm => llm.alias === isEditing ? updatedLLM : llm));
      } else {
        // Create new LLM
        updatedLLM = await llmService.createLLM(llmData, llmType);
        setLlms(prevLlms => [...prevLlms, updatedLLM]);
      }
      
      // Reset form
      resetForm();
      setActiveTab('active');
      
    } catch (err) {
      console.error('Failed to save LLM:', err);
      setError('Failed to save LLM. Please check your inputs and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (llm: LLM) => {
    if (!llm.alias) return;
    
    setLlmType(llm.type);
    if (llm.type === 'api') {
      setApiProvider(llm.provider as APIProvider);
      setApiKey(llm.apiKey || '');
      setBaseUrl(llm.baseUrl || '');
    } else {
      setLocalProvider(llm.provider as APIProvider);
    }
    setSelectedModel(llm.path || llm.model || '');
    setAlias(llm.alias);
    setIsEditing(llm.alias);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (alias: string, type: 'api' | 'local') => {
    const llmToDelete = llms.find(llm => llm.alias === alias);
    if (!llmToDelete) return;
    
    if (!window.confirm(`Are you sure you want to delete the LLM configuration "${alias}"?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      await llmService.deleteLLM(alias, type);
      // Update the UI by removing the deleted LLM
      setLlms(prevLlms => prevLlms.filter(llm => llm.alias !== alias));
      // Clear the selected LLM if it's the one being deleted
      if (selectedLLM?.alias === alias) {
        setSelectedLLM(null);
      }
    } catch (err) {
      console.error('Failed to delete LLM:', err);
      setError('Failed to delete LLM. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setLlmType('api');
    setApiProvider('openai');
    setLocalProvider('llama-cpp');
    setSelectedModel('');
    setApiKey('');
    setAlias('');
    setError(null);
    setIsEditing(null);
    setValidationStatus({valid: null, message: ''});
    setSelectedLLM(null);
  };

  const validateApiKey = async () => {
    if (!apiKey) {
      setValidationStatus({valid: false, message: 'API key is required'});
      return;
    }

    setIsValidating(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/llms/remote/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: apiProvider,
          api_key: apiKey  // This matches the backend schema's field name
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to validate API key');
      }

      setValidationStatus({
        valid: data.valid,
        message: data.message || (data.valid ? 'API key is valid' : 'Invalid API key')
      });
    } catch (err) {
      console.error('Validation error:', err);
      setValidationStatus({
        valid: false,
        message: err instanceof Error ? err.message : 'Failed to validate API key'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleViewLLM = async (llm: LLM) => {
    if (!llm.alias) return;
    
    setSelectedLLM(llm);
    setValidationStatus({valid: null, message: ''});
    setAvailableModels([]);
    setAvailableEmbeddings([]);
    
    if (llm.type === 'api') {
      try {
        // Validate API key for remote LLMs using the alias endpoint
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/llms/remote/${encodeURIComponent(llm.alias)}/validate-key`);
        const data = await response.json();
        
        setValidationStatus({
          valid: data.valid,
          message: data.message || (data.valid ? 'API key is valid' : 'Invalid API key')
        });
        
        // Fetch available models if key is valid
        if (data.valid) {
          try {
            setIsLoadingDetails(true);
            const modelsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/llms/remote/${encodeURIComponent(llm.alias)}/models`);
            const modelsData = await modelsResponse.json();
            setAvailableModels(modelsData.models || []);
            
            // Fetch available embeddings models
            const embeddingsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/llms/remote/${encodeURIComponent(llm.alias)}/embeddings_models`);
            const embeddingsData = await embeddingsResponse.json();
            setAvailableEmbeddings(embeddingsData.embeddings_models || []);
          } catch (err) {
            console.error('Error fetching models:', err);
          } finally {
            setIsLoadingDetails(false);
          }
        }
      } catch (err) {
        console.error('Error validating API key:', err);
        setValidationStatus({
          valid: false,
          message: 'Failed to validate API key. Please check your connection.'
        });
      }
    }

    if (llm.type === 'local') {
      try {
        // Fetch available models
        const modelsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/llms/local/${encodeURIComponent(llm.alias)}/models`);
        const modelsData = await modelsResponse.json();
        setAvailableModels(modelsData.models || []);
        
        // Fetch available embeddings models
        const embeddingsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/llms/local/${encodeURIComponent(llm.alias)}/embeddings_models`);
        const embeddingsData = await embeddingsResponse.json();
        setAvailableEmbeddings(embeddingsData.embeddings_models || []);
      } catch (err) {
        console.error('Error fetching models:', err);
      }
    }

  };

  const renderLLMDetails = () => {
    if (!selectedLLM) return null;
    
    const currentValidationStatus: ValidationStatus = validationStatus || { valid: null, message: '' };

    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedLLM(null)}
          className="flex items-center text-sm text-blue-400 hover:text-blue-300 mb-4"
        >
          <FiArrowLeft className="mr-1" /> Back to list
        </button>

        <div className="bg-gray-750 rounded-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-white">{selectedLLM?.alias || 'LLM Details'}</h2>
              <div className="flex items-center mt-2 space-x-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedLLM && selectedLLM.type === 'api' ? 'bg-blue-900/50 text-blue-300' : 'bg-purple-900/50 text-purple-300'
                }`}>
                  {selectedLLM && selectedLLM.type === 'api' ? 'API' : 'Local'}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">
                  {selectedLLM?.type === 'api' && selectedLLM?.provider ? getProviderName(selectedLLM.provider) : 'LLaMA.cpp'}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => selectedLLM && handleEdit(selectedLLM)}
                disabled={!selectedLLM}
                className="text-gray-400 hover:text-blue-400 p-1.5 rounded-full hover:bg-blue-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedLLM ? "Edit model" : "No model selected"}
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => selectedLLM?.alias && handleDelete(selectedLLM.alias, selectedLLM.type)}
                disabled={!selectedLLM?.alias}
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-full hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={selectedLLM?.alias ? "Delete model" : "No model selected"}
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {selectedLLM && selectedLLM.type === 'local' && selectedLLM.path && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-300">Model Path</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedLLM.path || '');
                    // Optional: Add a toast notification here
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  title="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
              <div className="relative group">
                <code className="block bg-gray-800/50 border border-gray-700 text-gray-200 px-4 py-2.5 rounded-lg text-sm break-all font-mono transition-all hover:border-blue-500/50">
                  {selectedLLM.path}
                </code>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 bg-gradient-to-l from-gray-800/80 to-transparent w-16 pointer-events-none">
                  <div className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedLLM && selectedLLM.type === 'api' && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-2">API Key Status</h3>
              {isLoadingDetails ? (
                <div className="flex items-center text-gray-400 text-sm">
                  <div className="inline-block h-4 w-4 mr-2 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Validating API key...
                </div>
              ) : (
                <div className={`flex items-center text-sm ${currentValidationStatus.valid ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`h-2 w-2 rounded-full mr-2 ${currentValidationStatus.valid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  {currentValidationStatus.message || 'Validation status unknown'}
                </div>
              )}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Available Models</h3>
              {availableModels.length > 0 ? (
                <div className="bg-gray-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {availableModels.map((model, index) => (
                    <div key={index} className="py-1 text-sm text-gray-300">
                      {model}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {currentValidationStatus.valid === false 
                    ? 'Please fix API key to load models' 
                    : 'No models available'}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-300 mb-2">Available Embeddings</h3>
              {availableEmbeddings.length > 0 ? (
                <div className="bg-gray-800 rounded-lg p-3 max-h-60 overflow-y-auto">
                  {availableEmbeddings.map((model, index) => (
                    <div key={index} className="py-1 text-sm text-gray-300">
                      {model}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  {currentValidationStatus.valid === false 
                    ? 'Please fix API key to load embeddings' 
                    : 'No embeddings available'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the list of LLMs
  const renderLLMList = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-400">Loading models...</p>
        </div>
      );
    }

    if (loadError) {
      return (
        <div className="text-center py-12">
          <FiAlertCircle className="mx-auto h-10 w-10 text-red-500" />
          <h3 className="mt-3 text-sm font-medium text-red-400">Failed to load models</h3>
          <p className="mt-1 text-sm text-gray-400">{loadError}</p>
          <button
            onClick={fetchLLMs}
            className="mt-4 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiRefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Try Again
          </button>
        </div>
      );
    }

    if (filteredLLMs.length === 0) {
      return (
        <div className="text-center py-12">
          <FiCpu className="mx-auto h-12 w-12 text-gray-600" />
          <h3 className="mt-2 text-sm font-medium text-gray-200">
            {llms.length === 0 
              ? 'No LLM models configured' 
              : `No ${filter === 'all' ? '' : filter + ' '}models found`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {llms.length === 0 
              ? 'Get started by adding a new LLM model.'
              : `Try changing the filter or add a new ${filter === 'all' ? '' : filter + ' '}model.`}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLLMs.map((llm, index) => {
          // Create a more reliable key using multiple properties
          const uniqueKey = `${llm.type}-${llm.id || 'no-id'}-${llm.alias || 'no-alias'}-${index}`;
          return (
          <div 
            key={uniqueKey} 
            className="bg-gray-750 rounded-lg p-4 border border-gray-700 flex flex-col h-full cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => handleViewLLM(llm)}
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-white truncate">{llm.alias}</h3>
                <div className="flex items-center mt-1 text-sm text-gray-400 flex-wrap gap-x-2">
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                    llm.type === 'api' 
                      ? 'bg-blue-900/50 text-blue-300' 
                      : 'bg-purple-900/50 text-purple-300'
                  }`}>
                    {llm.type === 'api' ? 'API' : 'Local'}
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-300 truncate">
                    {llm.type === 'api' && llm.provider ? getProviderName(llm.provider) : 'LLaMA.cpp'}
                  </span>
                  {llm.type === 'local' && llm.path && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-400 truncate">
                        {llm.path.split('/').pop()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 ml-2">
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(llm);
                    }}
                    className="text-gray-400 hover:text-blue-400 p-1.5 rounded-full hover:bg-blue-900/20 transition-colors"
                    title="Edit model"
                    disabled={isLoading}
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(llm.id, llm.type);
                    }}
                    className="text-gray-400 hover:text-red-400 p-1.5 rounded-full hover:bg-red-900/20 transition-colors disabled:opacity-50"
                    title="Delete model"
                    disabled={isLoading}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
        })}
      </div>
    );
  };

  // Main component render
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">LLM Models</h1>
        <p className="text-gray-400">Manage your language model configurations</p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
          <div className="flex items-center">
            <FiAlertCircle className="mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-700 px-6">
          <button
            className={`px-4 py-3 font-medium text-sm flex-1 text-center ${
              activeTab === 'active'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
            onClick={() => {
              setActiveTab('active');
              resetForm();
            }}
          >
            Active Models {llms.length > 0 && `(${llms.length})`}
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex-1 text-center ${
              activeTab === 'add'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-750'
            }`}
            onClick={() => setActiveTab('add')}
          >
            {isEditing ? 'Edit LLM' : 'Add New LLM'}
          </button>
        </div>

        <div className="p-6">
          {selectedLLM ? (
            renderLLMDetails()
          ) : activeTab === 'active' ? (
            <div className="space-y-4">
              <div className="space-y-4 mb-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-white">Configured Models</h3>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as 'all' | 'api' | 'local')}
                        className="appearance-none bg-gray-800 border border-gray-700 text-white text-sm rounded-lg pl-3 pr-8 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        disabled={isLoading}
                        style={{
                          backgroundImage: "url(" + "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e" + ")",
                          backgroundPosition: "right 0.5rem center",
                          backgroundRepeat: "no-repeat",
                          backgroundSize: "1.5em 1.5em",
                          paddingRight: "2.5rem",
                          minWidth: "120px",
                          opacity: isLoading ? 0.7 : 1
                        }}
                      >
                        <option value="all">All Models</option>
                        <option value="api">API Models</option>
                        <option value="local">Local Models</option>
                      </select>
                    </div>
                  </div>
                </div>
                {renderLLMList()}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    LLM Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className={`flex items-center justify-center p-4 rounded-lg border ${
                        llmType === 'api' 
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                          : 'border-gray-600 text-gray-400'
                      }`}
                    >
                      <FiServer className="mr-2" />
                      {llmType === 'api' ? 'API' : 'Local'}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    LLM Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      className={`flex items-center justify-center p-4 rounded-lg border transition-colors ${
                        llmType === 'api'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setLlmType('api')}
                    >
                      <FiServer className="mr-2" />
                      API
                    </button>
                    <button
                      type="button"
                      className={`flex items-center justify-center p-4 rounded-lg border transition-colors ${
                        llmType === 'local'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                          : 'border-gray-600 hover:border-gray-500 text-gray-400 hover:text-white'
                      }`}
                      onClick={() => setLlmType('local')}
                    >
                      <FiCpu className="mr-2" />
                      Local
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Alias (Optional)
                </label>
                <input
                  type="text"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="e.g., My GPT-4 Model"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-4">
                {llmType === 'api' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Provider
                    </label>
                    {isEditing ? (
                      <div className="inline-flex rounded-xl bg-gray-800 p-1 shadow-sm">
                        <div 
                          className="relative px-5 py-2.5 text-sm font-medium text-white"
                          style={{
                            minWidth: '100px',
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          {apiProvider === 'openai' && 'OpenAI'}
                          {apiProvider === 'anthropic' && 'Anthropic'}
                          {apiProvider === 'huggingface' && 'Hugging Face'}
                        </div>
                      </div>
                    ) : (
                      <div className="inline-flex rounded-xl bg-gray-800 p-1 shadow-sm" role="group">
                        {['openai', 'anthropic', 'huggingface'].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setApiProvider(p as APIProvider)}
                            className={`relative px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                              apiProvider === p
                                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                            } ${p === 'openai' ? 'rounded-l-lg' : ''} ${
                              p === 'huggingface' ? 'rounded-r-lg' : ''
                            }`}
                            style={{
                              minWidth: '100px',
                              backdropFilter: 'blur(4px)'
                            }}
                          >
                            {p === 'openai' && 'OpenAI'}
                            {p === 'anthropic' && 'Anthropic'}
                            {p === 'huggingface' && 'Hugging Face'}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Provider
                      </label>
                      <div className="inline-flex rounded-xl bg-gray-800 p-1 shadow-sm">
                      <div 
                        className="relative px-5 py-2.5 text-sm font-medium text-white rounded-lg"
                        style={{
                          minWidth: '120px',
                          backdropFilter: 'blur(4px)',
                          justifyContent: 'center'
                        }}
                      >
                        LLaMA.cpp
                      </div>
                    </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Model Path
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          placeholder="Enter path to model directory"
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/llms/local/llama-cpp/recommended-path`
                              );
                              const data = await response.json();
                              if (data.path) {
                                setSelectedModel(data.path);
                              }
                            } catch (err) {
                              console.error('Failed to get recommended path:', err);
                              setError('Failed to get recommended path');
                            }
                          }}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm whitespace-nowrap"
                        >
                          Use Recommended
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-gray-400">
                        Enter the absolute path to the directory containing your GGUF model files.
                        This LLM alias will be associated with all .gguf files in the specified directory.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {llmType === 'api' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    API Key
                  </label>
                  <div className="space-y-2">
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                          setApiKey(e.target.value);
                          // Reset validation when key changes
                          if (validationStatus.valid !== null) {
                            setValidationStatus({valid: null, message: ''});
                          }
                        }}
                        placeholder={
                          apiProvider === 'openai' ? 'sk-...' : 
                          apiProvider === 'anthropic' ? 'sk-ant-...' :
                          'hf_...'
                        }
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-32"
                        required
                      />
                      <button
                        type="button"
                        onClick={validateApiKey}
                        disabled={!apiKey || isValidating}
                        className={`absolute right-2 px-3 py-1 text-xs font-medium rounded-md flex items-center space-x-1.5 ${
                          validationStatus.valid === true 
                            ? 'bg-green-900/50 text-green-300 hover:bg-green-800/50' 
                            : validationStatus.valid === false 
                              ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50' 
                              : 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50'
                        } transition-colors ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!apiKey ? 'Enter an API key to validate' : 'Validate API key'}
                      >
                        {isValidating ? (
                          <>
                            <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Validating...</span>
                          </>
                        ) : validationStatus.valid === true ? (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Valid</span>
                          </>
                        ) : validationStatus.valid === false ? (
                          <>
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            <span>Invalid</span>
                          </>
                        ) : (
                          <>
                            <FiKey className="h-3 w-3" />
                            <span>Validate</span>
                          </>
                        )}
                      </button>
                    </div>
                    {validationStatus.message && (
                      <p className={`text-xs ${validationStatus.valid === true 
                        ? 'text-green-400' 
                        : validationStatus.valid === false 
                          ? 'text-red-400' 
                          : 'text-gray-400'}`}>
                        {validationStatus.message}
                      </p>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Your API key is stored locally on your PC in an SQLite encrypted database.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('active');
                    setIsEditing(null);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {isEditing ? 'Update' : 'Add'} LLM
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LLMsPage;
