import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const openCvAssetPath = fileURLToPath(
  new URL('./node_modules/@techstark/opencv-js/dist/opencv.js', import.meta.url),
);

function localOpenCvAsset(): Plugin {
  return {
    name: 'docux-local-opencv',
    configureServer(server) {
      server.middlewares.use('/vendor/opencv.js', (_request, response) => {
        try {
          const source = readFileSync(openCvAssetPath);
          response.statusCode = 200;
          response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
          response.setHeader('Cache-Control', 'public, max-age=86400, immutable');
          response.end(source);
        } catch {
          response.statusCode = 404;
          response.end('OpenCV.js no disponible en desarrollo.');
        }
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'vendor/opencv.js',
        source: readFileSync(openCvAssetPath),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localOpenCvAsset()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2022',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
