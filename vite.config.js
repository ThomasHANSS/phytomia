import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/phytomia/',  // Pour GitHub Pages — adapter si domaine custom
  build: {
    outDir: 'dist',
  },
});
