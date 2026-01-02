import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

declare global {
  /**
   * Internal AI Studio interface for API key management.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * Injected by the platform for secure key handling.
     */
    // Removed readonly to fix error: All declarations of 'aistudio' must have identical modifiers.
    aistudio: AIStudio;
  }

  namespace NodeJS {
    interface ProcessEnv {
      API_KEY: string;
      VITE_API_KEY?: string;
    }
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Target container 'root' not found in document.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);