import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GAMEFLIX ? '/games/graviton/' : process.env.GITHUB_PAGES ? '/graviton/' : '/',
  root: '.',
  build: {
    outDir: 'dist',
    target: 'es2020',
  },
  server: {
    open: true,
  },
});
