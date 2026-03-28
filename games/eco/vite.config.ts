import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GAMEFLIX ? '/games/eco/' : '/',
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
  server: {
    open: true,
  },
});
