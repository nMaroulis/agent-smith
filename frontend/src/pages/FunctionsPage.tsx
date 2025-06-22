import { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiCode } from 'react-icons/fi';

type FunctionType = {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
  }>;
};

export default function FunctionsPage() {
  const [functions, setFunctions] = useState<FunctionType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFunction, setEditingFunction] = useState<FunctionType | null>(null);

  const handleSaveFunction = (func: Omit<FunctionType, 'id'>) => {
    if (editingFunction) {
      setFunctions(functions.map(f => f.id === editingFunction.id ? { ...func, id: editingFunction.id } : f));
      setEditingFunction(null);
    } else {
      setFunctions([...functions, { ...func, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteFunction = (id: string) => {
    setFunctions(functions.filter(f => f.id !== id));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Functions</h1>
          <p className="text-gray-400">Manage your custom functions</p>
        </div>
        <button
          onClick={() => {
            setEditingFunction(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <FiPlus className="mr-2" />
          Add Function
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {functions.map((func) => (
          <div key={func.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-white">{func.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{func.description}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingFunction(func);
                    setIsModalOpen(true);
                  }}
                  className="text-gray-400 hover:text-blue-400 p-1"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => handleDeleteFunction(func.id)}
                  className="text-gray-400 hover:text-red-400 p-1"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-2">Parameters:</div>
              <div className="space-y-2">
                {func.parameters.map((param, i) => (
                  <div key={i} className="flex items-center text-sm">
                    <span className="text-blue-400 font-mono mr-2">{param.name}</span>
                    <span className="text-gray-500 text-xs bg-gray-700 px-2 py-0.5 rounded">
                      {param.type}
                    </span>
                    <span className="ml-2 text-gray-400 text-xs truncate">
                      {param.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {functions.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FiCode className="mx-auto h-12 w-12 text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-200">No functions yet</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new function.</p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                New Function
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <FunctionForm
          function={editingFunction}
          onSave={handleSaveFunction}
          onClose={() => {
            setEditingFunction(null);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function FunctionForm({ 
  function: func, 
  onSave, 
  onClose 
}: { 
  function: FunctionType | null; 
  onSave: (func: Omit<FunctionType, 'id'>) => void; 
  onClose: () => void;
}) {
  const [name, setName] = useState(func?.name || '');
  const [description, setDescription] = useState(func?.description || '');
  const [code, setCode] = useState(func?.code || '');
  const [parameters, setParameters] = useState<Array<{name: string; type: string; description: string}>>(
    func?.parameters || []);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">
              {func ? 'Edit Function' : 'Add New Function'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Function Name
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
                Function Code
              </label>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-48 font-mono text-sm bg-gray-700 border border-gray-600 rounded-md p-3 text-white"
                placeholder="// Your function code here\n// Use parameters: param1, param2, ..."
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
                {func ? 'Update' : 'Create'} Function
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
