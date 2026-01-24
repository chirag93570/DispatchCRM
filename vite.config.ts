import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', 
    port: 3000,
    watch: {
      usePolling: true,
    },
    allowedHosts: ['crm.rkdispatch.com', 'localhost', '127.0.0.1'],
    // NEW: PROXY CONFIGURATION TO FIX "FAILED TO FETCH"
    proxy: {
      '/telnyx-proxy': {
        target: 'https://api.telnyx.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/telnyx-proxy/, '')
      }
    }
  }
});