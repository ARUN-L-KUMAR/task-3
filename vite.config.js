import { defineConfig } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  root: 'frontend',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  server: {
    port: 8080,
    open: true
  },
  optimizeDeps: {
    include: ['ethers']
  }
});