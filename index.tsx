
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

declare global {
  // Use the existing global AIStudio type to avoid conflicts with system-level declarations.
  interface Window {
    aistudio: AIStudio;
  }
  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
    }
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
