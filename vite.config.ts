
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // This allows the code to use process.env.API_KEY as per the SDK requirements
    'process.env.API_KEY': JSON.stringify(process.env.VITE_API_KEY)
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
