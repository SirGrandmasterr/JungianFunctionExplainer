import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        fi: resolve(__dirname, 'fi/index.html'),
        ti: resolve(__dirname, 'ti/index.html'),
        ne: resolve(__dirname, 'ne/index.html'),
        ni: resolve(__dirname, 'ni/index.html'),
        se: resolve(__dirname, 'se/index.html'),
        si: resolve(__dirname, 'si/index.html'),
        te: resolve(__dirname, 'te/index.html'),
        fe: resolve(__dirname, 'fe/index.html'),
        playground: resolve(__dirname, 'playground/index.html'),
        main: resolve(__dirname, 'index.html'),
      }
    }
  }
});
