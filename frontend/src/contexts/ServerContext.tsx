import React, { createContext, useContext, useEffect, useState } from 'react';

interface ServerContextType {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  serverStatus: 'online' | 'offline' | 'checking';
  checkServerStatus: () => Promise<boolean>;
}

const ServerContext = createContext<ServerContextType | undefined>(undefined);

export const useServer = () => {
  const context = useContext(ServerContext);
  if (!context) {
    throw new Error('useServer must be used within a ServerProvider');
  }
  return context;
};

export const ServerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [serverUrl, setServerUrl] = useState<string>(
    localStorage.getItem('serverUrl') || 'http://localhost:8000'
  );
  const [serverStatus, setServerStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  // Save to localStorage when serverUrl changes
  useEffect(() => {
    localStorage.setItem('serverUrl', serverUrl);
    checkServerStatus();
  }, [serverUrl]);

  // Check server status periodically
  useEffect(() => {
    const interval = setInterval(checkServerStatus, 30000); // Check every 30 seconds
    checkServerStatus(); // Initial check
    return () => clearInterval(interval);
  }, [serverUrl]);

  const checkServerStatus = async () => {
    try {
      setServerStatus('checking');
      const response = await fetch(`${serverUrl}/api/health`, { method: 'HEAD' });
      setServerStatus(response.ok ? 'online' : 'offline');
      return response.ok;
    } catch (error) {
      setServerStatus('offline');
      return false;
    }
  };

  return (
    <ServerContext.Provider value={{ serverUrl, setServerUrl, serverStatus, checkServerStatus }}>
      {children}
    </ServerContext.Provider>
  );
};
