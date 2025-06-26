import { useServer } from '../contexts/ServerContext';
import { useState, useEffect } from 'react';
import { FiSave, FiServer, FiRefreshCw } from 'react-icons/fi';

const SettingsPage = () => {
  const { serverUrl, setServerUrl, serverStatus, checkServerStatus } = useServer();
  const [newServerUrl, setNewServerUrl] = useState(serverUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    setNewServerUrl(serverUrl);
  }, [serverUrl]);

  const handleSave = () => {
    try {
      // Basic URL validation
      new URL(newServerUrl);
      setIsValidUrl(true);
      setServerUrl(newServerUrl);
      setStatusMessage('Server URL saved successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e) {
      setIsValidUrl(false);
      setStatusMessage('Please enter a valid URL (e.g., http://localhost:8000)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCheckConnection = async () => {
    setIsChecking(true);
    setStatusMessage('Checking connection...');
    try {
      const isOnline = await checkServerStatus();
      if (isOnline) {
        setStatusMessage('Connection successful! Server is online.');
      } else {
        setStatusMessage('Server responded but with an error.');
      }
    } catch (error) {
      setStatusMessage('Failed to connect to the server.');
    } finally {
      setIsChecking(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const getStatusColor = () => {
    switch (serverStatus) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      case 'checking':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 text-white flex items-center">
          <FiServer className="mr-2" /> Server Configuration
        </h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="serverUrl" className="block text-sm font-medium text-gray-300 mb-1">
              Server URL
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                id="serverUrl"
                value={newServerUrl}
                onChange={(e) => setNewServerUrl(e.target.value)}
                className={`flex-1 bg-gray-700 border ${
                  isValidUrl ? 'border-gray-600' : 'border-red-500'
                } rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="http://localhost:8000"
              />
              <button
                onClick={handleSave}
                disabled={isSaving || newServerUrl === serverUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <FiSave className="mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
            {!isValidUrl && (
              <p className="mt-1 text-sm text-red-400">Please enter a valid URL</p>
            )}
          </div>
          
          <div className="pt-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-300 mr-2">Status:</span>
                <div className="flex items-center">
                  <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} mr-2`}></div>
                  <span className="text-sm text-gray-200 capitalize">
                    {serverStatus === 'checking' ? 'Checking...' : serverStatus}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCheckConnection}
                disabled={isChecking}
                className="text-sm text-blue-400 hover:text-blue-300 flex items-center focus:outline-none"
              >
                <FiRefreshCw className={`mr-1 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking...' : 'Check Connection'}
              </button>
            </div>
            {statusMessage && (
              <p className={`mt-2 text-sm ${
                statusMessage.includes('success') ? 'text-green-400' : 
                statusMessage.includes('error') || statusMessage.includes('Failed') ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {statusMessage}
              </p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">Application Settings</h2>
        <p className="text-gray-400">More application settings will be available in future updates.</p>
      </div>
    </div>
  );
};

export default SettingsPage;
