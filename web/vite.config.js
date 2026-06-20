import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
  },
});
