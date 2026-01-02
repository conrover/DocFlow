import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

declare global {
  /**
   * Internal AI Studio interface for API key management.
   * Fix: Declaring this as an interface allows it to merge with any existing global definitions.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * Internal AI Studio interface for API key management.
     * Inlined to prevent TS2304 resolution errors during build.
     */
    // Fix: Removed 'readonly' modifier to ensure identity with external ambient declarations.
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
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);