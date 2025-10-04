import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  root: '.',
  build: {
    outDir: '.vite/renderer/main_window',
    rollupOptions: {
      input: 'index.html',
    },
  },
  server: {
    port: 5173,
  },
});
