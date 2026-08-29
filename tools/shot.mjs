#!/usr/bin/env node
/* ============================================================
   CURRENTS · shot — page captures at an exact CSS viewport

   The dev server's /__shot endpoint (vite.config.js) turns a
   data URL into a PNG, which is right for a <canvas> and wrong
   for a whole page — a page has no toDataURL(). And Chrome's
   `--screenshot --window-size=375,812` does not work on Windows:
   the OS enforces a minimum window width of about 500px, so a
   narrow request silently renders wide and crops, which looks
   exactly like a layout bug that is not there.

   So this drives Chrome over the DevTools Protocol and sets the
   viewport with Emulation.setDeviceMetricsOverride, which has no
   minimum. Same destination as /__shot — a PNG in .shots/ that
   someone can open — for the same reason.

   Node built-ins only (Node 22's global WebSocket).

     node tools/shot.mjs <url> <width> <height> <out.png>
   ============================================================ */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const [url, wArg, hArg, out] = process.argv.slice(2);
if (!url || !wArg || !hArg || !out) {
  console.error('usage: node tools/shot.mjs <url> <width> <height> <out.png>');
  process.exit(2);
}
const width = Number(wArg), height = Number(hArg);

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].find(existsSync);
if (!CHROME) { console.error('Chrome not found — install it or edit tools/shot.mjs'); process.exit(1); }

const PORT = 9222 + (process.pid % 500);
const chrome = spawn(CHROME, [
  '--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--hide-scrollbars', '--disable-extensions', '--no-first-run',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(ROOT, '.shots', '.chrome-profile')}`,
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fail = (msg) => { chrome.kill(); console.error(msg); process.exit(1); };

/* wait for the debugger to answer */
let wsUrl = null;
for (let i = 0; i < 60 && !wsUrl; i++) {
  await sleep(250);
  try {
    const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    wsUrl = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl || null;
  } catch { /* not up yet */ }
}
if (!wsUrl) fail(`Chrome DevTools did not come up on port ${PORT}`);

const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws')); });

let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((res) => {
  const myId = ++id;
  pending.set(myId, res);
  ws.send(JSON.stringify({ id: myId, method, params }));
});

await send('Page.enable');
/* the whole point: an exact CSS viewport, with no OS minimum */
await send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: width < 768,
});
await send('Page.navigate', { url });
await sleep(4500);                       // glyph engines settle
const res = await send('Page.captureScreenshot', { format: 'png' });
if (!res.result?.data) fail('captureScreenshot returned no data');

const target = join(ROOT, '.shots', out);
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, Buffer.from(res.result.data, 'base64'));

/* confirm the PNG really is the size asked for — a silent crop is the
   exact failure this tool exists to avoid */
const buf = Buffer.from(res.result.data, 'base64');
const gotW = buf.readUInt32BE(16), gotH = buf.readUInt32BE(20);
ws.close(); chrome.kill();
if (gotW !== width) fail(`capture is ${gotW}px wide, expected ${width}px — viewport override did not apply`);
console.log(`  ok  ${out}  ${gotW}x${gotH}`);
