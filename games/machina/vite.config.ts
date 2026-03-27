import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GAMEFLIX ? '/games/machina/' : process.env.GITHUB_PAGES ? '/machina/' : '/',
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
  server: {
    open: true,
  },
});
