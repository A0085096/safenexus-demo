import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/* Two builds out of one source.

   The default build is the normal ES-module app served over HTTP.
   `--mode single` emits one classic IIFE chunk instead, because the
   single-file build at ../safenexus.html is meant to be opened
   straight off a disk — and a browser refuses to load a module from
   a file:// URL, CORS having no meaning for an opaque origin. */
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  base: './',
  build: mode === 'single'
    ? {
      outDir: 'dist-single',
      /* one chunk, no import()s, no module syntax */
      modulePreload: false,
      cssCodeSplit: false,
      rollupOptions: {
        output: { format: 'iife', inlineDynamicImports: true, entryFileNames: 'app.js', assetFileNames: 'app.[ext]' },
      },
    }
    : {},
}));
