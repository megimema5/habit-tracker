import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In development, forward every /api request to the Express server.
    // The browser only ever talks to localhost:5173, so there is no CORS,
    // and the login cookie (Phase 3) is sent automatically.
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
