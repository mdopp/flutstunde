import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          game: ['src/game.js'],
          ui: ['src/ui.js'],
          renderer: ['src/renderer.js']
        }
      }
    }
  },
  test: {
    include: ['src/**/*.test.js'],
    exclude: ['tests/e2e/**/*']
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  }
});
