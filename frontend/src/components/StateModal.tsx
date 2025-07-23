import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, CheckIcon, CodeBracketIcon } from '@heroicons/react/24/outline';

export type FieldType = 'str' | 'int' | 'float' | 'bool' | 'List[str]' | 'Dict[str, Any]';

export interface StateField {
  id: string;
  name: string;
  type: FieldType;
  isOptional: boolean;
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
  // Define the default fields based on the Python TypedDict
  const defaultFields: StateField[] = [
    {
      id: '1',
      name: 'messages',
      type: 'List[str]',
      isOptional: false,
      initialValue: '[]',
      isInternal: false
    },
    {
      id: '2',
      name: 'message_type',
      type: 'str',
      isOptional: true,
      initialValue: 'None',
      isInternal: false
    },
    {
      id: '3',
      name: 'next',
      type: 'str',
      isOptional: true,
      initialValue: 'None',
      isInternal: false
    }
  ];

  const [fields, setFields] = useState<StateField[]>(initialFields);
  const [nameError, setNameError] = useState<string | null>(null);
  
  // Update fields when initialFields changes (e.g., when loading a flow)
  useEffect(() => {
    setFields(initialFields.length > 0 ? initialFields : defaultFields);
  }, [initialFields]);
  
  const [newField, setNewField] = useState<Omit<StateField, 'id'>>({ 
    name: '', 
    type: 'str',
    isOptional: false,
    initialValue: '',
    isInternal: false 
  });
  
  const validateName = (name: string): boolean => {
    if (!name) {
      setNameError('Name is required');
      return false;
    }
    if (!/^[a-zA-Z]/.test(name)) {
      setNameError('Name must start with a letter');
      return false;
    }
    if (/\s/.test(name)) {
      setNameError('Name cannot contain spaces');
      return false;
    }
    if (!/^[a-zA-Z0-9_]*$/.test(name)) {
      setNameError('Name can only contain letters, numbers, and underscores');
      return false;
    }
    setNameError(null);
    return true;
  };
  
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewField({...newField, name: value});
    validateName(value);
  };

  const handleAddField = () => {
    if (!newField.name || !validateName(newField.name)) return;
    
    setFields([...fields, { ...newField, id: Date.now().toString() }]);
    setNewField({ ...newField, name: '', initialValue: '', isOptional: false });
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const updateField = (id: string, updates: Partial<StateField>) => {
    if ('name' in updates && updates.name !== undefined) {
      if (!validateName(updates.name)) return;
    }
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };
  
  const getDisplayType = (type: FieldType, isOptional: boolean): string => {
    return isOptional ? `Optional[${type}]` : type;
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const [showCodePreview, setShowCodePreview] = useState(false);
  const codePreviewRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (codePreviewRef.current && !codePreviewRef.current.contains(event.target as Node)) {
        setShowCodePreview(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const codePreview = `class State(TypedDict):
    messages: Annotated[list, add_messages]
    message_type: str | None
    next: str | None`;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-gray-900 rounded-lg shadow-xl flex flex-col overflow-hidden border border-gray-700"
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
        <div className="flex-1 overflow-y-auto">
          {/* Add New Field */}
          <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-base font-medium text-gray-300 flex items-center mb-3">
                <PlusIcon className="w-4 h-4 mr-2 text-blue-400" />
                Add New Field
              </h3>
              <div className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-12 sm:col-span-5">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Name *</label>
                  <input
                    type="text"
                    value={newField.name}
                    onChange={handleNameChange}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="fieldName"
                  />
                  {nameError && (
                    <p className="mt-1 text-xs text-red-400">{nameError}</p>
                  )}
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
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="col-span-12 sm:col-span-3">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Initial Value</label>
                  <input
                    type="text"
                    value={newField.initialValue}
                    onChange={(e) => setNewField({...newField, initialValue: e.target.value})}
                    className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Initial value"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                  <span className="mr-2">Optional</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={newField.isOptional}
                      onChange={(e) => setNewField({...newField, isOptional: e.target.checked})}
                      className="sr-only"
                    />
                    <div className={`w-10 h-5 rounded-full shadow-inner transition-colors duration-200 ${newField.isOptional ? 'bg-blue-500' : 'bg-gray-600'}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transform transition-transform duration-200 ${newField.isOptional ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </label>
                <button
                  onClick={handleAddField}
                  disabled={true}
                  className="relative px-4 py-2 bg-gray-600 text-gray-400 text-sm font-medium rounded-md transition-all duration-200 
                    cursor-not-allowed 
                    before:absolute before:inset-0 before:rounded-md before:bg-gray-500/10 
                    hover:before:opacity-30 before:transition-opacity before:duration-200
                    disabled:opacity-70 disabled:shadow-none
                    flex items-center justify-center gap-1.5"
                  title="Adding custom fields is currently not supported"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Field</span>
                </button>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-4 mx-6 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  This is a stub. The default state variables cannot be modified at this time.
                </p>
              </div>
            </div>
          </div>

          {/* Fields List */}
          <div className="p-6 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-medium text-white">Defined Fields</h3>
              <span className="text-xs bg-gray-700/50 text-gray-300 px-3 py-1.5 rounded-full">
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
                            readOnly
                            className="w-full bg-transparent border-b border-transparent text-sm text-gray-400 cursor-not-allowed"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                          {getDisplayType(field.type, field.isOptional)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="text"
                            value={field.initialValue}
                            readOnly
                            className="w-full bg-gray-700/30 border border-gray-600 rounded px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                            placeholder="Initial value"
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
              <div className="relative" ref={codePreviewRef}>
                <button
                  type="button"
                  onClick={() => setShowCodePreview(!showCodePreview)}
                  className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 bg-gray-700 hover:bg-gray-600/80 rounded-lg transition-all flex items-center justify-center gap-2 border border-indigo-500/30"
                >
                  <CodeBracketIcon className="w-4 h-4" />
                  <span>Preview Code</span>
                </button>
                {showCodePreview && (
                  <div className="absolute bottom-full right-0 mb-2 w-96 z-50">
                    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-800/90 border-b border-gray-700 flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-300">State Definition</span>
                        <button
                          onClick={() => setShowCodePreview(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="p-4 bg-gray-900/50 overflow-auto">
                        <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                          {codePreview}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => onSave(fields)}
                className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateModal;
