import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';

export type FieldType = 'str' | 'int' | 'float' | 'bool' | 'List[str]' | 'Dict[str, Any]' | 'Optional[Any]';

export interface StateField {
  id: string;
  name: string;
  type: FieldType;
  initialValue: string;
  isInternal: boolean;
}

interface StateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fields: StateField[]) => void;
  initialFields?: StateField[];
}

const StateModal: React.FC<StateModalProps> = ({ isOpen, onClose, onSave, initialFields = [] }) => {
  const [fields, setFields] = useState<StateField[]>(initialFields);
  const [newField, setNewField] = useState<Omit<StateField, 'id'>>({ 
    name: '', 
    type: 'str', 
    initialValue: '',
    isInternal: false 
  });

  const handleAddField = () => {
    if (!newField.name) return;
    
    setFields([...fields, { ...newField, id: Date.now().toString() }]);
    setNewField({ ...newField, name: '', initialValue: '' });
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<StateField>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 9999,
        padding: '1rem',
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '42rem',
          maxHeight: '90vh',
          backgroundColor: 'rgb(17, 24, 39)',
          borderRadius: '0.5rem',
          boxShadow: '0 0 20px rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">State Manager</h2>
            <p className="text-sm text-gray-400 mt-1">Define and manage your application state</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        {/* Main Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* Add New Field */}
          <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-5 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <PlusIcon className="w-5 h-5 mr-2 text-blue-400" />
              Add New Field
            </h3>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-12 sm:col-span-5">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) => setNewField({...newField, name: e.target.value})}
                  className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Field name"
                />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                <div className="relative">
                  <select
                    value={newField.type}
                    onChange={(e) => setNewField({...newField, type: e.target.value as FieldType})}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                  >
                    <option value="str">String</option>
                    <option value="int">Integer</option>
                    <option value="float">Float</option>
                    <option value="bool">Boolean</option>
                    <option value="List[str]">List of Strings</option>
                    <option value="Dict[str, Any]">Dictionary</option>
                    <option value="Optional[Any]">Optional</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="col-span-12 sm:col-span-3 flex items-end">
                <button
                  onClick={handleAddField}
                  disabled={!newField.name.trim()}
                  className={`w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center ${
                    !newField.name.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Fields List */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Defined Fields</h3>
              <span className="text-xs bg-gray-700 text-gray-300 px-3 py-1.5 rounded-full">
                {fields.length} {fields.length === 1 ? 'field' : 'fields'}
              </span>
            </div>
            
            {fields.length === 0 ? (
              <div className="bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-xl p-8 text-center">
                <svg className="w-12 h-12 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <h4 className="text-gray-400 font-medium mb-1">No fields defined yet</h4>
                <p className="text-sm text-gray-500">Add your first field to get started</p>
              </div>
            ) : (
              <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700/50">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Default</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {fields.map((field) => (
                      <tr key={field.id} className="hover:bg-gray-750/30">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateField(field.id, { name: e.target.value })}
                            className="w-full bg-transparent border-b border-transparent focus:border-gray-500 focus:outline-none text-sm text-white"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={field.type}
                            onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                            className="bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="str">String</option>
                            <option value="int">Integer</option>
                            <option value="float">Float</option>
                            <option value="bool">Boolean</option>
                            <option value="List[str]">List</option>
                            <option value="Dict[str, Any]">Dict</option>
                            <option value="Optional[Any]">Optional</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={field.initialValue}
                            onChange={(e) => updateField(field.id, { initialValue: e.target.value })}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Default value"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <button
                            onClick={() => removeField(field.id)}
                            className="text-gray-400 hover:text-red-400 p-1.5 rounded-full hover:bg-red-900/20 transition-colors"
                            title="Remove field"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-800/50">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              {fields.length > 0 ? (
                <span>{fields.length} field{fields.length !== 1 ? 's' : ''} defined</span>
              ) : (
                <span>No fields defined yet</span>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600/80 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(fields)}
                className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateModal;
