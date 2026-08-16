import { resolve } from 'path';
import { writeFileSync, mkdirSync } from 'fs';
import { defineConfig } from 'vite';

/* Dev-only canvas capture.
   The glyph engines render to <canvas>, which means nothing about how they
   actually look survives into a file anyone can open — reviewing a change to
   one of them otherwise means reading pixel probes. This lets a dev-console
   one-liner POST a data URL and drop a real PNG in .shots/ for eyeballing.
   `configureServer` never runs for `vite build`, so this ships nothing. */
function canvasShots() {
  return {
    name: 'currents-canvas-shots',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__shot', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const { name, data } = JSON.parse(body);
            const safe = String(name || 'shot').replace(/[^a-z0-9._-]/gi, '_');
            mkdirSync(resolve(__dirname, '.shots'), { recursive: true });
            writeFileSync(
              resolve(__dirname, '.shots', safe),
              Buffer.from(String(data).split(',').pop(), 'base64')
            );
            res.end('ok ' + safe);
          } catch (e) {
            res.statusCode = 400;
            res.end('bad: ' + e.message);
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [canvasShots()],
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
        energy: resolve(__dirname, 'energy/index.html'),
        phenomena: resolve(__dirname, 'phenomena/index.html'),
        playground: resolve(__dirname, 'playground/index.html'),
        main: resolve(__dirname, 'index.html'),
      }
    }
  }
});
