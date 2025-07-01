import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
  cacheDir: './node_modules/.vite_e_assist_frontend', // Unique cache
  optimizeDeps: {
    exclude: ['jspdf', 'core-js'], // Exclude problematic deps
  }, 
});