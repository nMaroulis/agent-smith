import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface APICallConfigProps {
  formData: any;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  setFormData: (updater: (prev: any) => any) => void;
}

export const APICallConfig: React.FC<APICallConfigProps> = ({
  formData,
  onInputChange,
  setFormData,
}) => {
  // Helper function to update key-value pairs in arrays
  const updateArrayField = (field: string, index: number, key: string, value: string) => {
    const newArray = [...(formData.config?.[field] || [])];
    if (!newArray[index]) newArray[index] = { key: '', value: '' };
    newArray[index] = { ...newArray[index], [key]: value };
    
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: newArray.filter((item: any) => item.key || item.value)
      }
    }));
  };

  // Helper function to add new key-value pairs
  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [field]: [...(prev.config?.[field] || []), { key: '', value: '' }]
      }
    }));
  };

  // Render key-value pair fields (headers, params, etc.)
  const renderKeyValueFields = (field: string, placeholderKey: string, placeholderValue: string) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-300">
          {field.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
        </label>
        <button
          type="button"
          onClick={() => addArrayItem(field)}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded flex items-center"
        >
          <FiPlus className="mr-1" size={12} /> Add
        </button>
      </div>
      
      {(formData.config?.[field] || []).map((item: any, index: number) => (
        <div key={index} className="flex space-x-2">
          <input
            type="text"
            placeholder={placeholderKey}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            value={item.key}
            onChange={(e) => updateArrayField(field, index, 'key', e.target.value)}
          />
          <input
            type="text"
            placeholder={placeholderValue}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            value={item.value}
            onChange={(e) => updateArrayField(field, index, 'value', e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              const newArray = [...(formData.config?.[field] || [])];
              newArray.splice(index, 1);
              setFormData(prev => ({
                ...prev,
                config: { ...prev.config, [field]: newArray }
              }));
            }}
            className="text-red-400 hover:text-red-300"
          >
            <FiTrash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 bg-gray-700/30 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white">API Configuration</h3>
      
      {/* HTTP Method and Base URL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            HTTP Method
          </label>
          <select
            name="config.http_method"
            value={formData.config?.http_method || 'GET'}
            onChange={onInputChange}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Base URL *
          </label>
          <input
            type="url"
            name="config.base_url"
            value={formData.config?.base_url || ''}
            onChange={onInputChange}
            placeholder="https://api.example.com"
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            required
          />
        </div>
      </div>

      {/* Endpoint Path */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Endpoint Path
        </label>
        <input
          type="text"
          name="config.endpoint"
          value={formData.config?.endpoint || ''}
          onChange={onInputChange}
          placeholder="/users/{id}"
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
        />
      </div>

      {/* Headers and Query Params */}
      {renderKeyValueFields('headers', 'Header name', 'Header value')}
      {renderKeyValueFields('query_params', 'Parameter', 'Value')}

      {/* Request Body */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Request Body
        </label>
        <textarea
          name="config.request_body"
          value={formData.config?.request_body || ''}
          onChange={(e) => onInputChange(e as any)}
          placeholder='{\n  "key": "value"\n}'
          rows={5}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm font-mono"
        />
      </div>

      {/* Authentication */}
      <div className="space-y-4 bg-gray-800/50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-300">Authentication</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Auth Type
          </label>
          <select
            name="config.auth_type"
            value={formData.config?.auth_type || 'none'}
            onChange={onInputChange}
            className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
          >
            <option value="none">None</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
            <option value="api_key">API Key</option>
          </select>
        </div>

        {formData.config?.auth_type !== 'none' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {formData.config?.auth_type === 'api_key' ? 'API Key' : 'Token'}
            </label>
            <input
              type="password"
              name="config.auth_token"
              value={formData.config?.auth_token || ''}
              onChange={onInputChange}
              placeholder={formData.config?.auth_type === 'api_key' ? 'API Key' : 'Token'}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default APICallConfig;