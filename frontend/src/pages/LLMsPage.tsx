import { useState, useEffect } from 'react';
import { FiRefreshCw, FiEdit2, FiTrash2, FiCpu, FiServer, FiAlertCircle, FiKey } from 'react-icons/fi'; // Removed unused FiChevronDown
import { llmService, type LLM, type APIProvider } from '../services/llmService';

type LLMType = 'api' | 'local';

// List of downloaded GGUF models (this would ideally be fetched from the backend)
const DOWNLOADED_MODELS = [
  'llama-3-8b.Q4_K_M.gguf',
  'llama-3-70b.Q4_K_M.gguf',
  'mistral-7b-instruct-v0.1.Q4_K_M.gguf'
];

const LLMsPage = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'add'>('active');
  const [llms, setLlms] = useState<LLM[]>([]);
  const [filter, setFilter] = useState<'all' | 'api' | 'local'>('all');
  const [isEditing, setIsEditing] = useState<string | null>(null);
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
  const [selectedModel, setSelectedModel] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get provider display name
  const getProviderName = (provider: string) => {
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
    setError(null);
    setIsLoading(true);

    try {
      const provider = llmType === 'api' ? apiProvider : localProvider;
      const llmName = name || (llmType === 'api' ? provider : selectedModel.split('/').pop() || 'Local Model');
      const baseData = {
        type: llmType,
        provider,
        name: llmName,
      };
      
      const llmData = llmType === 'api'
        ? {
            ...baseData,
            apiKey
          }
        : {
            ...baseData,
            path: selectedModel
          };

      if (isEditing) {
        // Update existing LLM
        const updatedLLM = await llmService.updateLLM(isEditing, llmData, llmType);
        setLlms(prevLlms => prevLlms.map(llm => llm.id === isEditing ? updatedLLM : llm));
      } else {
        // Create new LLM - wait for the creation to complete
        await llmService.createLLM(llmData, llmType);
        // Refresh the full list from the server to ensure we have all fields
        await fetchLLMs();
      }

      // Reset form and show success
      resetForm();
      setActiveTab('active');
    } catch (err) {
      console.error('Failed to save LLM:', err);
      setError('Failed to save LLM. Please check your input and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (llm: LLM) => {
    setLlmType(llm.type);
    if (llm.type === 'api') {
      setApiProvider(llm.provider as APIProvider);
      setApiKey(llm.apiKey || '');
    } else {
      setLocalProvider(llm.provider as APIProvider);
    }
    setSelectedModel(llm.path || '');
    setName(llm.name);
    setIsEditing(llm.id);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string, type: 'api' | 'local') => {
    if (!window.confirm('Are you sure you want to delete this LLM configuration?')) {
      return;
    }
    
    try {
      setIsLoading(true);
      await llmService.deleteLLM(id, type);
      setLlms(llms.filter(llm => llm.id !== id));
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
    setName('');
    setError(null);
    setIsEditing(null);
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
        {filteredLLMs.map((llm) => (
          <div key={`${llm.type}-${llm.id}`} className="bg-gray-750 rounded-lg p-4 border border-gray-700 flex flex-col h-full">
            <div className="flex justify-between items-start">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-white truncate">{llm.name}</h3>
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
                    {llm.type === 'api' ? getProviderName(llm.provider) : 'LLaMA.cpp'}
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
        ))}
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
          {activeTab === 'active' ? (
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

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Provider
                      </label>
                      <div className="inline-flex rounded-xl bg-gray-800 p-1 shadow-sm">
                        <button
                          type="button"
onClick={() => setLocalProvider('llama-cpp' as APIProvider)}
                          className="relative px-5 py-2.5 text-sm font-medium transition-all duration-200 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg shadow-lg shadow-blue-500/20"
                          style={{
                            minWidth: '120px',
                            backdropFilter: 'blur(4px)',
                            justifyContent: 'center'
                          }}
                        >
                          LLaMA.cpp
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Choose Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a model</option>
                        {DOWNLOADED_MODELS.map((model) => (
                          <option key={model} value={`/models/llama/${model}`}>
                            {model}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-xs text-gray-400">
                        Place GGUF model files in <code className="bg-gray-700 px-1 py-0.5 rounded">agent-smith/models/llama/</code>
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
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={
                        apiProvider === 'openai' ? 'sk-...' : 
                        apiProvider === 'anthropic' ? 'sk-ant-...' :
                        'hf_...'
                      }
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FiKey className="h-4 w-4 text-gray-400" />
                    </div>
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
