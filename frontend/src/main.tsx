import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from 'reactflow';
import './index.css';
import App from './App';

console.log('=== Application Starting ===');
console.log('Document ready state:', document.readyState);

// Debug: Check React version
console.log('React version:', React?.version);

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('❌ Failed to find root element with id "root"');
  // Create root element if it doesn't exist
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
  console.log('✅ Created new root element');
  
  const root = createRoot(newRoot);
  console.log('🔄 Rendering App component...');
  root.render(
    <StrictMode>
      <ReactFlowProvider>
        <div style={{ color: 'red', padding: '20px', backgroundColor: 'white' }}>
          <h1>Debug: App is rendering</h1>
          <App />
        </div>
      </ReactFlowProvider>
    </StrictMode>
  );
} else {
  console.log('✅ Root element found, creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🔄 Rendering App component...');
  root.render(
    <StrictMode>
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    </StrictMode>
  );
  
  console.log('✅ App component rendered');
}

// Add some debug styles to make sure they're applied
const style = document.createElement('style');
style.textContent = `
  body { 
    background-color: #f0f0f0 !important;
    margin: 0;
    padding: 0;
  }
  #root {
    min-height: 100vh;
    background-color: white;
    border: 2px solid red;
  }
`;
document.head.appendChild(style);

console.log('=== Application Started ===');
