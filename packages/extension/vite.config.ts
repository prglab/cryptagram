import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts'),
        popup: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
    outDir: 'dist',
  },
});
