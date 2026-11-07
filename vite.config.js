import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative base lets the built site work from any GitHub Pages path,
// whatever the repository is called, and also from a plain folder.
export default defineConfig({
  base: './',
  plugins: [react()],
});
