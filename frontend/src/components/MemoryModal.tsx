import React, { useState } from 'react';
import { XMarkIcon, CheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface MemorySettings {
  enabled: boolean;
  backend: string;
  autoSaveFields: string[];
  langSmithEnabled: boolean;
  langSmithToken: string;
  langSmithProjectId: string;
}

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: MemorySettings) => void;
  initialSettings?: MemorySettings;
}

const DEFAULT_SETTINGS: MemorySettings = {
  enabled: true,
  backend: 'memory',
  autoSaveFields: [],
  langSmithEnabled: false,
  langSmithToken: '',
  langSmithProjectId: ''
};

const MemoryModal: React.FC<MemoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSettings = DEFAULT_SETTINGS,
}) => {
  const [settings, setSettings] = useState<MemorySettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });

  const handleSubmit = () => {
    onSave(settings);
    onClose();
  };

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
            <h2 className="text-xl font-semibold text-white">Memory & Persistence</h2>
            <p className="text-sm text-gray-400 mt-1">Configure memory settings and persistence options</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {/* Memory Configuration */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6 mb-6">
            <h3 className="text-base font-medium text-white mb-4 flex items-center">
              <Cog6ToothIcon className="w-5 h-5 mr-2 text-purple-400" />
              Memory Configuration
            </h3>
            
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({...settings, enabled: e.target.checked})}
                  />
                  <div className={`block w-14 h-8 rounded-full ${settings.enabled ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.enabled ? 'translate-x-6' : ''}`}></div>
                </div>
                <span className="ml-3 text-gray-300">Enable Memory</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Memory Backend</label>
              <select
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.backend}
                onChange={(e) => setSettings({...settings, backend: e.target.value as 'redis' | 'postgres'})}
                disabled={!settings.enabled}
              >
                <option value="redis">Redis</option>
                <option value="postgres">PostgreSQL</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">Auto-save Fields (comma-separated)</label>
              <input
                type="text"
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.autoSaveFields.join(', ')}
                onChange={(e) => setSettings({...settings, autoSaveFields: e.target.value.split(',').map(f => f.trim()).filter(Boolean)})}
                disabled={!settings.enabled}
                placeholder="field1, field2, field3"
              />
            </div>
          </div>

          {/* LangSmith Integration */}
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-6">
            <h3 className="text-base font-medium text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              LangSmith Integration
            </h3>
            
            <div className="mb-4">
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={settings.langSmithEnabled}
                    onChange={(e) => setSettings({...settings, langSmithEnabled: e.target.checked})}
                  />
                  <div className={`block w-14 h-8 rounded-full ${settings.langSmithEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${settings.langSmithEnabled ? 'translate-x-6' : ''}`}></div>
                </div>
                <span className="ml-3 text-gray-300">Enable LangSmith</span>
              </label>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">API Token</label>
              <input
                type="password"
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.langSmithToken}
                onChange={(e) => setSettings({...settings, langSmithToken: e.target.value})}
                disabled={!settings.langSmithEnabled}
                placeholder="••••••••••••"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Project ID</label>
              <input
                type="text"
                className="w-full bg-gray-700/50 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.langSmithProjectId}
                onChange={(e) => setSettings({...settings, langSmithProjectId: e.target.value})}
                disabled={!settings.langSmithEnabled}
                placeholder="project-name"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-800 bg-gray-800/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center"
          >
            <CheckIcon className="w-4 h-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default MemoryModal;
