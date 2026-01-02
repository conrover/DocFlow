
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

declare global {
  /**
   * Defines the AIStudio interface globally to match the environment's expected type.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    /**
     * Declares the aistudio property using the AIStudio interface to ensure 
     * compatibility with existing global definitions and modifiers.
     */
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
