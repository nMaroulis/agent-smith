import { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiCpu, FiServer, FiKey } from 'react-icons/fi';

type LLMType = 'api' | 'local';
type APIProvider = 'openai' | 'anthropic' | 'llama-cpp';

interface LLM {
  id: string;
  type: LLMType;
  provider: APIProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  name: string;
}

const PROVIDER_MODELS: Record<APIProvider, string[]> = {
  openai: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  'llama-cpp': ['llama-3-8b', 'llama-3-70b', 'codellama-7b']
};

const LLMsPage = () => {
  const [activeTab, setActiveTab] = useState<'active' | 'add'>('active');
  const [llms, setLlms] = useState<LLM[]>([]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  // Form state
  const [llmType, setLlmType] = useState<LLMType>('api');
  const [provider, setProvider] = useState<APIProvider>('openai');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLLM: LLM = {
      id: isEditing || Date.now().toString(),
      type: llmType,
      provider,
      model: model || PROVIDER_MODELS[provider][0],
      name: name || `${provider} ${model || PROVIDER_MODELS[provider][0]}`,
      ...(llmType === 'api' && { apiKey }),
      ...(llmType === 'local' && { baseUrl })
    };

    if (isEditing) {
      setLlms(llms.map(llm => llm.id === isEditing ? newLLM : llm));
    } else {
      setLlms([...llms, newLLM]);
    }

    // Reset form
    setLlmType('api');
    setProvider('openai');
    setModel('');
    setApiKey('');
    setBaseUrl('');
    setName('');
    setIsEditing(null);
    setActiveTab('active');
  };

  const handleEdit = (llm: LLM) => {
    setLlmType(llm.type);
    setProvider(llm.provider);
    setModel(llm.model);
    setApiKey(llm.apiKey || '');
    setBaseUrl(llm.baseUrl || '');
    setName(llm.name);
    setIsEditing(llm.id);
    setActiveTab('add');
  };

  const handleDelete = (id: string) => {
    setLlms(llms.filter(llm => llm.id !== id));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">LLM Models</h1>
          <p className="text-gray-400">Manage your language model configurations</p>
        </div>
        <button
          onClick={() => {
            setActiveTab('add');
            setIsEditing(null);
            // Reset form
            setLlmType('api');
            setProvider('openai');
            setModel('');
            setApiKey('');
            setBaseUrl('');
            setName('');
          }}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FiPlus className="mr-2" />
          Add LLM
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-700">
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'active'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active Models
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm ${
              activeTab === 'add'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('add')}
          >
            {isEditing ? 'Edit LLM' : 'Add New LLM'}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'active' ? (
            <div className="space-y-4">
              {llms.length === 0 ? (
                <div className="text-center py-12">
                  <FiCpu className="mx-auto h-12 w-12 text-gray-600" />
                  <h3 className="mt-2 text-sm font-medium text-gray-200">No LLM models configured</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a new LLM model.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {llms.map((llm) => (
                    <div key={llm.id} className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-white">{llm.name}</h3>
                          <div className="flex items-center mt-1 text-sm text-gray-400">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-200 mr-2">
                              {llm.type === 'api' ? 'API' : 'Local'}
                            </span>
                            <span className="text-gray-500">{llm.provider}</span>
                            <span className="mx-1">•</span>
                            <span className="text-gray-300">{llm.model}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(llm)}
                            className="text-gray-400 hover:text-blue-400 p-1"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(llm.id)}
                            className="text-gray-400 hover:text-red-400 p-1"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      {llm.type === 'api' && llm.apiKey && (
                        <div className="mt-3 flex items-center text-xs text-gray-500">
                          <FiKey className="mr-1" />
                          <span className="truncate">••••••••{llm.apiKey.slice(-4)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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
                    Local (LLaMA.cpp)
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const newProvider = e.target.value as APIProvider;
                      setProvider(newProvider);
                      // Reset model when provider changes
                      setModel('');
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={llmType === 'local'}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    {llmType === 'local' && <option value="llama-cpp">LLaMA.cpp</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {PROVIDER_MODELS[provider].map((modelOption) => (
                      <option key={modelOption} value={modelOption}>
                        {modelOption}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {llmType === 'api' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FiKey className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Your API key is stored locally in your browser.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Base URL
                  </label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:8080"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    URL where your local LLaMA.cpp server is running.
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
