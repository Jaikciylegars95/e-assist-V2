import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['jwt-decode'],  // Ajout de jwt-decode dans les dépendances optimisées
    exclude: ['lucide-react'], // Gardez la configuration pour lucide-react si nécessaire
  },
});
