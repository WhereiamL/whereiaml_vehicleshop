import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function stripCrossorigin() {
  return {
    name: 'strip-crossorigin',
    enforce: 'post',
    transformIndexHtml(html) {
      return html.replace(/\s+crossorigin/g, '');
    },
  };
}

export default defineConfig({
  plugins: [react(), stripCrossorigin()],
  base: './',
  build: {
    outDir: 'build',
    assetsDir: 'assets',
    emptyOutDir: true,
    modulePreload: false,
    chunkSizeWarningLimit: 2000,
  },
});
