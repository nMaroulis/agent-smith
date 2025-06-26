import { useState, useEffect } from 'react';
import { FiPlus, FiCode, FiSearch, FiX } from 'react-icons/fi'; // Removed unused imports
import { useServer } from '../contexts/ServerContext';

type ToolType = 'rag' | 'web_search' | 'custom_code' | 'agent' | 'api_call' | 'llm_tool' | 'other';

interface Tool {
  id: number;
  name: string;
  description: string;
  type: ToolType;
  config: Record<string, any>;
  code: string;
  is_active: boolean;
  parameters?: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}

const toolTypeOptions = [
  { value: 'rag', label: 'RAG' },
  { value: 'web_search', label: 'Web Search' },
  { value: 'custom_code', label: 'Custom Code' },
  { value: 'agent', label: 'Agent' },
  { value: 'api_call', label: 'API Call' },
  { value: 'llm_tool', label: 'LLM Tool' },
  { value: 'other', label: 'Other' },
];

export default function ToolsPage() {
  const { serverUrl } = useServer();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Form state
  const [isCreating, setIsCreating] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [formData, setFormData] = useState<Omit<Tool, 'id'>>({ 
    name: '',
    description: '',
    type: 'custom_code',
    config: {},
    code: '',
    is_active: true,
    parameters: []
  });

  // Fetch tools from the API
  const fetchTools = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${serverUrl}/api/tools/`);
      if (!response.ok) throw new Error('Failed to fetch tools');
      const data = await response.json();
      setTools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTools();
  }, [serverUrl]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'is_active' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  // Config changes are handled directly in the form inputs

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'custom_code',
      config: {},
      code: '',
      is_active: true,
      parameters: []
    });
    setEditingTool(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTool 
        ? `${serverUrl}/api/tools/${editingTool.id}`
        : `${serverUrl}/api/tools/`;
      
      const method = editingTool ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to save tool');
      
      await fetchTools();
      resetForm();
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tool');
    }
  };

  // Handle edit
  const handleEditTool = (tool: Tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      description: tool.description || '',
      type: tool.type,
      config: tool.config || {},
      code: tool.code || '',
      is_active: tool.is_active,
      parameters: tool.parameters || []
    });
    setIsCreating(true);
  };

  // Handle delete
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

  // Filter tools based on search and filter
  const filteredTools = tools.filter((tool: Tool) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = tool.name.toLowerCase().includes(searchLower) ||
                        tool.description.toLowerCase().includes(searchLower);
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tools</h1>
          <p className="text-sm text-gray-400">
            Manage your AI tools and integrations
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsCreating(!isCreating);
          }}
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

      {/* Search and Filter */}
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
          <label htmlFor="filter-type" className="sr-only">Filter by type</label>
          <select
            id="filter-type"
            className="block w-full pl-3 pr-10 py-2 border border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-gray-800 text-white appearance-none h-[38px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%239ca3af' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              paddingRight: '2.5rem'
            }}
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

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-700">
            <h3 className="text-lg leading-6 font-medium text-gray-300">
              {editingTool ? 'Edit Tool' : 'Create New Tool'}
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                    Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="type" className="block text-sm font-medium text-gray-300">
                    Type *
                  </label>
                  <select
                    id="type"
                    name="type"
                    required
                    className="mt-1 block w-full border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-800 text-white"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    {toolTypeOptions.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-white"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <label htmlFor="code" className="block text-sm font-medium text-gray-300">
                    Code
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="code"
                      name="code"
                      rows={6}
                      className="font-mono text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-600 rounded-md bg-gray-800 text-gray-200"
                      value={formData.code}
                      onChange={handleInputChange}
                      placeholder="// Enter your tool code here"
                    />
                  </div>
                </div>

                <div className="sm:col-span-6">
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-600 rounded bg-gray-700"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-300">
                      Active
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-700 rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingTool ? 'Update Tool' : 'Create Tool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tools List */}
      {!isCreating && !editingTool && (
        <div className="bg-gray-800 shadow overflow-hidden sm:rounded-lg mt-2">
          {filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <FiCode className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No tools found</h3>
              <p className="mt-1 text-sm text-gray-400">
                {searchTerm || filterType !== 'all' 
                  ? 'No tools match your search criteria. Try adjusting your search or filter.'
                  : 'Get started by creating a new tool.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-700">
              {filteredTools.map((tool) => (
                <li key={tool.id} className="hover:bg-gray-750 transition-colors duration-150">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-blue-400 truncate">{tool.name}</div>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                          {toolTypeOptions.find(t => t.value === tool.type)?.label || tool.type}
                        </span>
                        {tool.is_active ? (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-200">
                            Active
                          </span>
                        ) : (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTool(tool);
                          }}
                          className="mr-2 p-1 rounded-full text-gray-400 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
                          title="Edit tool"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete ${tool.name}?`)) {
                              handleDeleteTool(tool.id);
                            }
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500"
                          title="Delete tool"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-300">
                      {tool.description || 'No description provided'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ToolForm({ 
  tool: tool, 
  onSave, 
  onClose 
}: { 
  tool: ToolType | null; 
  onSave: (tool: Omit<ToolType, 'id'>) => void; 
  onClose: () => void;
}) {
  const [name, setName] = useState(tool?.name || '');
  const [description, setDescription] = useState(tool?.description || '');
  const [code, setCode] = useState(tool?.code || '');
  const [parameters, setParameters] = useState<Array<{name: string; type: string; description: string}>>(
    tool?.parameters || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description,
      code,
      parameters,
    });
  };

  const addParameter = () => {
    setParameters([...parameters, { name: '', type: 'string', description: '' }]);
  };

  const updateParameter = (index: number, field: 'name' | 'type' | 'description', value: string) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], [field]: value };
    setParameters(newParams);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-gray-300">
            {tool ? 'Edit Tool' : 'Add New Tool'}
          </h3>
        </div>
        <div className="px-6 py-4">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tool Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-300">
                  Parameters
                </label>
                <button
                  type="button"
                  onClick={addParameter}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  + Add Parameter
                </button>
              </div>
              
              <div className="space-y-2 mb-2">
                {parameters.map((param, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="name"
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter(index, 'type', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
                        required
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                        <option value="object">object</option>
                        <option value="array">array</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="description"
                        value={param.description}
                        onChange={(e) => updateParameter(index, 'description', e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-sm text-white"
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeParameter(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tool Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 font-mono text-sm bg-gray-700 border border-gray-600 rounded-md p-3 text-white"
                placeholder="// Your tool code here\n// Use parameters: param1, param2, ..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                {tool ? 'Update' : 'Create'} Tool
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
