/* ============================================================
   CURRENTS · FiGlyph — The Nebula Engine
   Fi is not a lattice — it is a nebula of feeling around one
   core tone. Mist thickens toward the centre. What rings true
   diffuses in and twirls the mist; what rings false either
   glides off unabsorbed or tears straight through, dragging a
   vacuum and bleeding mist through the wound.

   The mist itself is a fluid: pass `Fluid` (src/engines/fi-fluid.js)
   and the nebula becomes a real Navier–Stokes dye field on a
   sibling canvas behind this one — this layer then draws only the
   core, the lattice, the arrivals and the rim. Without it, the CPU
   blob mist below renders instead, and every event has a path in
   both dialects.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexRGB, mixRGB, rgbA, rgbHex, varyColor, hsv } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
const RED_RGB = hexRGB('#e04848');

export function readCOL() {
  return {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };
}

export class FiGlyph {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ interactive: true, coreGlow: 1, seed: 7 }, opts);
    this.COL = opts.COL || readCOL();
    this.rng = mulberry32(this.opts.seed);
    this.params = { scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 };
    this.target = { ...this.params };
    this.feeder = null;
    this.nodes = [];
    this.particles = [];
    this.subs = [];
    this.mist = [];
    this.vortices = [];
    this.glows = [];
    this.bombard = false;
    this.stress = 0.12; this.pleasure = 0.2;
    this.colorShift = 0;
    this.mood = 0;
    this.pulseT = 0; this.pulseColor = '#ffffff';
    this.structure = { countMul: 1, k: 3, rigidity: 0.4 };
    this.latticeSeed = 101;
    this.corePulse = 0;
    this.base = hexRGB(this.COL.fn);
    this.tint = { ...this.base };
    this._spriteCache = new Map();
    this.pointer = { x: null, y: null, hist: [] };
    this.t = 0;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);
    if (this.opts.interactive) {
      canvas.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer.hist.push({ x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() });
        if (this.pointer.hist.length > 120) this.pointer.hist.shift();
      });
      canvas.addEventListener('pointerleave', () => { this.pointer.hist = []; });
    }
    if (opts.Fluid) {
      const fc = document.createElement('canvas');
      fc.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      if (getComputedStyle(this.cv).position === 'static') this.cv.style.position = 'relative';
      this.cv.style.zIndex = '1';
      this.cv.parentElement.insertBefore(fc, this.cv);
      /* Only the hero is big enough to show the fine grid. Every other
         chamber on the page gets the coarse profile — per-chamber cost
         is dominated by pass count, so this is where the saving is. */
      const small = Math.min(this.W || 0, this.H || 0) < 480;
      const g = new opts.Fluid(fc, Object.assign({
        baseColor: this.COL.fn, seed: this.opts.seed,
        simRes: small ? 96 : 128,
        dyeRes: small ? 256 : 384,
        pressureIterations: small ? 9 : 12,
      }, this.opts.fluid));
      if (g.ok) this.gpu = g; else fc.remove();
    }
    this.buildLattice();
    this.buildMist();
    for (let i = 0; i < 22; i++) this.spawnParticle(true);
  }
  _resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.cv.width = r.width * this.dpr;
    this.cv.height = r.height * this.dpr;
    this.W = r.width; this.H = r.height;
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.baseR = Math.min(this.W, this.H) * 0.34;
    if (this.gpu) this.gpu.resize();
    if (this.mist.length) this.buildMist();
    if (REDUCED) this.renderStatic();
  }
  setTarget(p) { Object.assign(this.target, { contrary: 0 }, p); if (REDUCED) { Object.assign(this.params, this.target); this.renderStatic(); } }
  setStructure(s) {
    const next = Object.assign({}, this.structure, s);
    const sig = (o) => `${o.countMul.toFixed(2)}|${o.k}|${o.rigidity.toFixed(2)}`;
    const changed = sig(next) !== sig(this.structure);
    this.structure = next;
    if (changed) { this.buildLattice(); this.buildMist(); if (REDUCED) this.renderStatic(); }
  }
  pulse(color) { this.glows.push({ x: 0, y: 0, size: this.baseR * 0.5, grow: this.baseR * 0.5, alpha: 0.4, col: hexRGB(color) }); }
  setFeeder(f) { this.feeder = f; this.buildLattice(); this.buildMist(); if (REDUCED) this.renderStatic(); }
  latticeSpec() {
    const f = this.feeder;
    return { count: f ? Math.round(lerp(10, 18, f.branchy)) : 13, spread: f ? lerp(0.78, 1.1, f.spread) : 1 };
  }
  buildLattice() {
    const spec = this.latticeSpec();
    const count = Math.round(spec.count * this.structure.countMul);
    const rng = mulberry32(this.opts.seed + this.latticeSeed);
    this.nodes = [];
    for (let i = 0; i < count; i++) {
      const rr = (0.2 + 0.75 * Math.sqrt(rng())) * spec.spread;
      const a = rng() * TAU;
      this.nodes.push({ a, r: rr, x: 0, y: 0, tw: rng() * TAU, twSp: 0.4 + rng() * 0.5 });
    }
  }
  buildMist() {
    /* the fluid is the mist — no proxy blobs to step or draw */
    if (this.gpu) { this.mist = []; return; }
    const count = Math.round(120 * (0.8 + 0.35 * this.structure.countMul));
    const rng = mulberry32(this.opts.seed + 500 + this.latticeSeed);
    const R = this.baseR * this.params.scale;
    this.mist = [];
    for (let i = 0; i < count; i++) {
      const homeR = 0.1 + 1.0 * Math.pow(rng(), 1.55);
      const a = rng() * TAU;
      this.mist.push({
        x: Math.cos(a) * homeR * R, y: Math.sin(a) * homeR * R,
        vx: 0, vy: 0, homeR,
        size: (15 + 30 * (1 - homeR * 0.8)) * (0.75 + rng() * 0.5),
        alphaBase: 0.05 + 0.09 * (1 - homeR * 0.85),
        col: mixRGB(this.base, { r: 20, g: 10, b: 26 }, rng() * 0.3),
        escape: false, fade: 1,
      });
    }
  }
  /** Event dye, taken to full chroma: what the chamber absorbs has to
      read as vividly as what it emits, or the fluid swallows it. */
  _dye(rgb, k = 0.5) {
    const m = Math.max(rgb.r, rgb.g, rgb.b, 1) / 255;
    return { r: rgb.r / 255 / m * k, g: rgb.g / 255 / m * k, b: rgb.b / 255 / m * k };
  }
  /** A saturated random colour on a given hue band — the vivid accents. */
  _vivid(hue, k = 0.5, spread = 0.12) {
    const c = hsv(hue + (this.rng() - 0.5) * spread, 0.72 + this.rng() * 0.28, 1);
    return { r: c.r * k, g: c.g * k, b: c.b * k };
  }
  addMistBlob(x, y, colRGB, opts = {}) {
    const R = this.baseR * this.params.scale;
    if (this.gpu) {
      this.gpu.splat(x, y, opts.vx || 0, opts.vy || 0,
        this._dye(colRGB, opts.dye ?? 0.42), opts.size ? opts.size * 2.4 : R * 0.15);
      return;
    }
    this.mist.push(Object.assign({
      x, y, vx: 0, vy: 0,
      homeR: clamp(Math.hypot(x, y) / Math.max(R, 1), 0.12, 1.02),
      size: 14 + this.rng() * 14,
      alphaBase: 0.10 + this.rng() * 0.06,
      col: { ...colRGB }, escape: false, fade: 1,
    }, opts));
  }
  bleed(x, y, dirX, dirY, n) {
    if (this.gpu) {
      /* a jet out of the wound: hot dye thrown along the exit vector */
      for (let i = 0; i < n; i++) {
        const sp = 210 + this.rng() * 460, j = (this.rng() - 0.5) * 1.0;
        const c = Math.cos(j), s = Math.sin(j);
        this.gpu.splat(x, y, (dirX * c - dirY * s) * sp, (dirX * s + dirY * c) * sp,
          this._vivid(0.99, 0.5, 0.14), 18 + this.rng() * 22);
      }
      return;
    }
    for (let i = 0; i < n; i++) {
      const sp = 55 + this.rng() * 70, j = (this.rng() - 0.5) * 0.9;
      const c = Math.cos(j), s = Math.sin(j);
      this.addMistBlob(x, y, mixRGB(this.base, RED_RGB, 0.55), {
        escape: true, fade: 1,
        vx: (dirX * c - dirY * s) * sp, vy: (dirX * s + dirY * c) * sp,
        size: 9 + this.rng() * 12, alphaBase: 0.16,
      });
    }
  }
  makeSubShape(consonant) {
    const rng = this.rng;
    if (consonant) {
      const rr = 14 + rng() * 10, n = 3 + Math.floor(rng() * 2), span = 1.5 + rng() * 0.5;
      const raw = [];
      for (let i = 0; i < n; i++) { const a = -span / 2 + span * (i / (n - 1)); raw.push({ x: Math.cos(a) * rr, y: Math.sin(a) * rr }); }
      const cxm = raw.reduce((s, p) => s + p.x, 0) / n, cym = raw.reduce((s, p) => s + p.y, 0) / n;
      return { nodes: raw.map((p) => ({ x: p.x - cxm, y: p.y - cym })), edges: raw.slice(1).map((_, i) => [i, i + 1]) };
    }
    const n = 4 + Math.floor(rng() * 2), nodes = [], edges = [];
    for (let i = 0; i < n; i++) nodes.push({ x: (i - (n - 1) / 2) * 7, y: (i % 2 ? -1 : 1) * (5 + rng() * 7) });
    for (let i = 1; i < n; i++) edges.push([i - 1, i]);
    return { nodes, edges };
  }
  spawnSub(kind, opts = {}) {
    const rng = this.rng;
    const soft = kind === 'homo' || kind === 'authGood' || kind === 'authBad';
    const shape = kind === 'fakeGood' ? { nodes: [{ x: 0, y: 0 }], edges: [] } : this.makeSubShape(soft);
    const a = opts.angle !== undefined ? opts.angle : rng() * TAU;
    const R = this.baseR;
    const speed = kind === 'fakeBad' ? 3.1 : 0.85 + rng() * 0.4;
    let vx = -Math.cos(a) * speed, vy = -Math.sin(a) * speed;
    if (kind === 'fakeBad') { const off = (rng() - 0.5) * 0.5; vx = (-Math.cos(a) - Math.sin(a) * off) * speed; vy = (-Math.sin(a) + Math.cos(a) * off) * speed; }
    const sub = {
      kind, shape,
      x: Math.cos(a) * R * 1.5, y: Math.sin(a) * R * 1.5,
      vx, vy, rot: rng() * TAU, vrot: (rng() - 0.5) * 0.7,
      color: opts.color || '#c8b9c9',
      colRGB: hexRGB(opts.color || '#c8b9c9'),
      state: 'incoming', age: 0, alpha: 1, entered: false,
    };
    this.subs.push(sub);
    return sub;
  }
  subNodesAbs(sub) {
    const c = Math.cos(sub.rot), s = Math.sin(sub.rot);
    return sub.shape.nodes.map((n) => ({ x: this.cx + sub.x + n.x * c - n.y * s, y: this.cy + sub.y + n.x * s + n.y * c }));
  }
  dissolveSub(sub, opts = {}) {
    const abs = this.subNodesAbs(sub);
    for (const pt of abs) {
      this.addMistBlob(pt.x - this.cx, pt.y - this.cy, sub.colRGB, opts.heavy ? { vx: -(pt.x - this.cx) * 0.25, vy: -(pt.y - this.cy) * 0.25 } : {});
      if (this.rng() < 0.8) this.glows.push({ x: pt.x - this.cx + (this.rng() - 0.5) * 20, y: pt.y - this.cy + (this.rng() - 0.5) * 20, size: 14 + this.rng() * 18, grow: 26, alpha: 0.3, col: sub.colRGB });
    }
    if (this.gpu) {
      /* the experience diffusing in: a bloom of its own colour, drawn
         toward the core — heavy (grief) goes slower and stains deeper */
      const R = this.baseR * this.params.scale;
      const dye = this._dye(sub.colRGB, opts.heavy ? 0.85 : 0.6);
      const pull = opts.heavy ? -0.55 : -1.15;
      this.gpu.splat(sub.x, sub.y, sub.x * pull, sub.y * pull, dye, R * 0.34);
      for (let i = 0; i < 4; i++) {
        const a = this.rng() * TAU, rr = R * (0.1 + 0.28 * this.rng());
        const x = sub.x + Math.cos(a) * rr * 0.5, y = sub.y + Math.sin(a) * rr * 0.5;
        this.gpu.splat(x, y, -x * pull * 0.6, -y * pull * 0.6, dye, R * 0.14);
      }
    }
    this.vortices.push({ x: sub.x, y: sub.y, s: (this.rng() < 0.5 ? -1 : 1) * (opts.heavy ? 60 : 130), life: 1 });
  }
  spawnParticle(seedRandomPhase = false) {
    const p = this.params, f = this.feeder;
    const rng = this.rng;
    let x, y, vx, vy, col, branchy = 0, sz;
    if (f) {
      x = this.W * 0.10 - this.cx; y = (rng() - 0.5) * this.baseR * 0.5;
      const sp = lerp(0.45, 1.5, f.speed);
      vx = sp * (0.8 + rng() * 0.4); vy = (rng() - 0.5) * 0.15;
      col = varyColor(f.color, rng); branchy = f.branchy; sz = lerp(1.7, 2.5, f.speed);
    } else {
      const a = rng() * TAU, rr = 1.25 + rng() * 0.25;
      x = Math.cos(a) * this.baseR * rr; y = Math.sin(a) * this.baseR * rr;
      const inward = 0.25 + rng() * 0.3;
      vx = -Math.cos(a) * inward + (rng() - 0.5) * 0.2;
      vy = -Math.sin(a) * inward + (rng() - 0.5) * 0.2;
      /* ambient arrivals ride the chamber's current hue */
      if (this.gpu) { const c = hsv(this.gpu.hue + (rng() - 0.5) * 0.3, 0.45 + rng() * 0.45, 1); col = rgbHex({ r: c.r * 255, g: c.g * 255, b: c.b * 255 }); }
      else col = rgbHex(mixRGB(this.base, { r: 255, g: 245, b: 250 }, rng() * 0.25));
      sz = 1.5 + rng();
    }
    this.particles.push({ x, y, vx, vy, col, sz, branchy, age: seedRandomPhase ? rng() * 6 : 0, state: 'drift', tw: rng() * TAU });
  }
  delayedPointer() {
    const { latency } = this.params; const h = this.pointer.hist;
    if (!h.length) return null;
    if (latency <= 16) return h[h.length - 1];
    const cutoff = performance.now() - latency;
    for (let i = h.length - 1; i >= 0; i--) if (h[i].t <= cutoff) return h[i];
    return null;
  }
  step(dt) {
    this.t += dt;
    const p = this.params, tg = this.target;
    for (const k in tg) p[k] = lerp(p[k], tg[k], 1 - Math.pow(0.0015, dt));
    const R = this.baseR * p.scale;
    if (this.pulseT > 0) this.pulseT = Math.max(0, this.pulseT - dt * 1.35);
    this.corePulse = Math.max(0, this.corePulse - dt * 1.8);
    this.mood = Math.max(0, this.mood - dt * 0.1);
    this.stress += (0.12 - this.stress) * (1 - Math.pow(0.7, dt));
    this.pleasure += (0.20 - this.pleasure) * (1 - Math.pow(0.6, dt));
    const shiftTarget = clamp((this.stress - 0.35) * 1.75, 0, 1);
    this.colorShift = lerp(this.colorShift, shiftTarget, 1 - Math.pow(0.08, dt));
    if (this._rebuildAt && this.t >= this._rebuildAt) {
      this._rebuildAt = 0; this.latticeSeed += 13; this.buildLattice();
      for (let i = 0; i < 3; i++) this.vortices.push({ x: (this.rng() - 0.5) * R, y: (this.rng() - 0.5) * R, s: (this.rng() < 0.5 ? -1 : 1) * 150, life: 1 });
    }
    const dutyWave = (Math.sin(this.t * 0.9) + 1) / 2;
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.4, 0.12, 1);
    const ptr = this.delayedPointer();
    let ax = 0, ay = 0;
    if (ptr && this.opts.interactive) {
      const px = ptr.x - this.cx, py = ptr.y - this.cy;
      const contrary = (p.contrary > 0 && Math.sin(this.t * 0.7 + 2) > 1 - p.contrary * 1.2) ? -1 : 1;
      ax = px * 0.05 * p.control * contrary; ay = py * 0.05 * p.control * contrary;
    }
    this.offX = lerp(this.offX || 0, ax, 1 - Math.pow(0.01, dt));
    this.offY = lerp(this.offY || 0, ay, 1 - Math.pow(0.01, dt));
    for (const n of this.nodes) { n.tw += n.twSp * dt; n.x = this.cx + this.offX + Math.cos(n.a) * n.r * R + Math.cos(n.tw) * 4; n.y = this.cy + this.offY + Math.sin(n.a) * n.r * R + Math.sin(n.tw * 1.3) * 4; }
    const swirl = 9 * (1 - 0.6 * this.mood) * (0.4 + 0.6 * this.awake);
    const damp = Math.pow(0.22, dt);
    for (const m of this.mist) {
      if (!m.escape) {
        const d = Math.hypot(m.x, m.y) || 1;
        const targetR = m.homeR * R;
        m.vx += (m.x / d) * (targetR - d) * dt * 2.4; m.vy += (m.y / d) * (targetR - d) * dt * 2.4;
        const tv = swirl * (0.35 + 0.65 * (d / Math.max(R, 1)));
        m.vx += (-m.y / d) * tv * dt; m.vy += (m.x / d) * tv * dt;
        if (p.noise > 0.03) { m.vx += (this.rng() - 0.5) * p.noise * 90 * dt; m.vy += (this.rng() - 0.5) * p.noise * 90 * dt; }
        for (const v of this.vortices) {
          const dx = m.x - v.x, dy = m.y - v.y, vd = Math.hypot(dx, dy) + 14;
          const f = v.s * v.life / vd;
          m.vx += (-dy / vd) * f * dt * 60 * 0.16; m.vy += (dx / vd) * f * dt * 60 * 0.16;
          m.vx += (-dx / vd) * f * dt * 60 * 0.05; m.vy += (-dy / vd) * f * dt * 60 * 0.05;
        }
        m.vx *= damp; m.vy *= damp;
      } else { m.vx *= Math.pow(0.6, dt); m.vy *= Math.pow(0.6, dt); m.fade = Math.max(0, m.fade - dt * 0.45); }
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.col = mixRGB(m.col, this.base, 1 - Math.pow(0.94, dt));
    }
    this.mist = this.mist.filter((m) => !m.escape || m.fade > 0.02);
    if (this.mist.length > 320) this.mist.splice(0, this.mist.length - 320);
    for (const v of this.vortices) v.life -= dt * 0.45;
    this.vortices = this.vortices.filter((v) => v.life > 0);
    for (const g of this.glows) { g.size += g.grow * dt; g.alpha *= Math.pow(0.30, dt); }
    this.glows = this.glows.filter((g) => g.alpha > 0.015);
    let cr = 0, cg = 0, cb = 0, cw = 0;
    for (const m of this.mist) { if (!m.escape) { cr += m.col.r; cg += m.col.g; cb += m.col.b; cw++; } }
    if (cw) { const avg = { r: cr / cw, g: cg / cw, b: cb / cw }; this.tint = mixRGB(this.base, mixRGB(this.base, avg, 0.9), 0.65); }
    const spawnRate = this.bombard ? 0 : (this.feeder ? lerp(4, 12, this.feeder.rate) : 6);
    if (this.bombard) {
      this._subAcc = (this._subAcc || 0) + dt;
      const interval = 2.7 - 1.5 * p.duty;
      if (this._subAcc > interval && this.subs.filter((s) => s.state === 'incoming').length < 3) {
        this._subAcc = 0; const homo = this.rng() < 0.55; this.spawnSub(homo ? 'homo' : 'noise');
      }
    }
    this._acc = (this._acc || 0) + dt * spawnRate * (0.4 + 0.6 * this.awake);
    while (this._acc > 1) { this._acc--; this.spawnParticle(); }
    const spd = dt * 60;
    for (const pt of this.particles) {
      pt.age += dt; pt.tw += dt * 3;
      if (pt.state === 'drift') {
        if (pt.branchy > 0 && this.rng() < pt.branchy * dt * 0.9 && this.particles.length < 160) {
          this.particles.push({ ...pt, vy: pt.vy + (this.rng() - 0.5) * 0.9, sz: pt.sz * 0.85, age: 0, tw: this.rng() * TAU });
        }
        pt.x += pt.vx * spd; pt.y += pt.vy * spd;
        pt.x += (this.rng() - 0.5) * p.noise * 2.4; pt.y += (this.rng() - 0.5) * p.noise * 2.4;
        const strikeR = R * 0.30;
        if (pt.x * pt.x + pt.y * pt.y < strikeR * strikeR) {
          const accepted = this.rng() < (0.3 + p.fidelity * 0.55) * this.awake;
          pt.state = accepted ? 'absorbed' : 'rejected'; pt.age = 0;
          const cRGB = hexRGB(pt.col.startsWith('#') ? pt.col : rgbHex(this.base));
          if (accepted) {
            this.corePulse = Math.min(1, this.corePulse + 0.55);
            this.glows.push({ x: pt.x + (this.rng() - 0.5) * 26, y: pt.y + (this.rng() - 0.5) * 26, size: 10 + this.rng() * 16, grow: 30, alpha: 0.28, col: cRGB });
            if (this.rng() < 0.5) this.addMistBlob(pt.x, pt.y, cRGB, { size: 12 + this.rng() * 10 });
          } else { const a = Math.atan2(pt.y, pt.x || 0.01); pt.vx = Math.cos(a) * 0.9 + (this.rng() - 0.5) * 0.3; pt.vy = Math.sin(a) * 0.9 + (this.rng() - 0.5) * 0.3; }
        }
        if (!this.feeder) { pt.vx += -pt.x * 0.0003 * spd; pt.vy += -pt.y * 0.0003 * spd; }
      } else if (pt.state === 'rejected') { pt.x += pt.vx * spd; pt.y += pt.vy * spd; }
    }
    this.particles = this.particles.filter((pt) => {
      if (pt.state === 'absorbed') return pt.age < 0.5;
      if (pt.state === 'rejected') return pt.age < 1.6;
      const lim = Math.max(this.W, this.H);
      return pt.age < 14 && Math.abs(pt.x) < lim && Math.abs(pt.y) < lim;
    });
    for (const sub of this.subs) {
      sub.age += dt;
      const dist = Math.hypot(sub.x, sub.y);
      if (sub.state === 'incoming') {
        sub.x += sub.vx * spd; sub.y += sub.vy * spd; sub.rot += sub.vrot * dt;
        if (sub.kind === 'homo' || sub.kind === 'noise') {
          if (dist <= R * 1.02 && sub.age > 0.2) {
            const misjudge = this.rng() < (1 - p.fidelity) * 0.45;
            const correct = sub.kind === 'homo'; const accept = misjudge ? !correct : correct;
            if (accept) { sub.state = 'dissolving'; sub.age = 0; this.glows.push({ x: sub.x, y: sub.y, size: 26, grow: 44, alpha: 0.34, col: hexRGB(VERDICT.good) }); this.pleasure = Math.min(1, this.pleasure + 0.2); }
            else { sub.state = 'piercing'; sub.small = true; sub.age = 0; sub.vx *= 2.6; sub.vy *= 2.6; this.glows.push({ x: sub.x, y: sub.y, size: 26, grow: 44, alpha: 0.34, col: hexRGB(VERDICT.bad) }); this.bleed(sub.x, sub.y, sub.x / dist, sub.y / dist, 3); this.stress = Math.min(1, this.stress + 0.1); }
          }
        } else if (sub.kind === 'authGood' || sub.kind === 'authBad') {
          if (dist <= R * 0.72) {
            sub.state = 'dissolving'; sub.age = 0;
            if (sub.kind === 'authGood') { this.pleasure = 1; this.stress = Math.max(0.05, this.stress - 0.2); this.corePulse = 1; }
            else { this.mood = 1; this.stress = Math.min(1, this.stress + 0.42); this.pleasure = Math.min(1, this.pleasure + 0.24); }
            sub.heavy = sub.kind === 'authBad';
          }
        } else if (sub.kind === 'fakeGood') {
          if (dist <= R * 0.94) { sub.state = 'gliding'; sub.age = 0; sub.glideA = Math.atan2(sub.y, sub.x); sub.glideDir = this.rng() < 0.5 ? 1 : -1; this.stress = Math.min(1, this.stress + 0.08); }
        } else if (sub.kind === 'fakeBad') {
          if (dist <= R * 1.02 && sub.age > 0.2) {
            sub.state = 'piercing'; sub.age = 0; this.stress = 1; this.corePulse = 1;
            this.glows.push({ x: sub.x, y: sub.y, size: 40, grow: 70, alpha: 0.4, col: hexRGB(VERDICT.bad) });
            this.bleed(sub.x, sub.y, sub.x / dist, sub.y / dist, 5);
            this._rebuildAt = this.t + 1.3;
          }
        }
      } else if (sub.state === 'dissolving') {
        sub.alpha = clamp(1 - sub.age / 0.8, 0, 1); sub.x += sub.vx * spd * 0.3; sub.y += sub.vy * spd * 0.3;
        if (sub.age >= 0.8) { this.dissolveSub(sub, { heavy: sub.heavy }); sub.done = true; }
      } else if (sub.state === 'gliding') {
        sub.glideA += sub.glideDir * dt * 1.15; const gr = R * 0.92;
        sub.x = Math.cos(sub.glideA) * gr; sub.y = Math.sin(sub.glideA) * gr;
        for (const m of this.mist) { const dx = m.x - sub.x, dy = m.y - sub.y, dd = Math.hypot(dx, dy); if (dd < 42 && !m.escape) { m.vx += (dx / dd) * 40 * dt; m.vy += (dy / dd) * 40 * dt; } }
        if (sub.age > 2.4) { sub.state = 'expelled'; sub.age = 0; sub.vx = sub.x / gr * 1.1; sub.vy = sub.y / gr * 1.1; }
      } else if (sub.state === 'expelled') {
        sub.x += sub.vx * spd; sub.y += sub.vy * spd; sub.alpha = clamp(1 - sub.age / 1.4, 0, 1); if (sub.age > 1.4) sub.done = true;
      } else if (sub.state === 'piercing') {
        sub.x += sub.vx * spd; sub.y += sub.vy * spd;
        const sp = Math.hypot(sub.vx, sub.vy) || 1; const hx = sub.vx / sp, hy = sub.vy / sp;
        const wake = sub.small ? 0.5 : 1;
        const tx = sub.x - hx * 34, ty = sub.y - hy * 34;
        for (const m of this.mist) {
          if (m.escape) continue;
          let dx = m.x - sub.x, dy = m.y - sub.y, dd = Math.hypot(dx, dy);
          if (dd < 52) { const f = (1 - dd / 52) * 480 * wake; m.vx += (dx / (dd || 1)) * f * dt; m.vy += (dy / (dd || 1)) * f * dt; }
          dx = m.x - tx; dy = m.y - ty; dd = Math.hypot(dx, dy);
          if (dd < 80) { const f = (1 - dd / 80) * 300 * wake; m.vx -= (dx / (dd || 1)) * f * dt; m.vy -= (dy / (dd || 1)) * f * dt; }
        }
        if (sub.entered === false && dist < R * 0.95) sub.entered = true;
        if (sub.entered && !sub.wounded && dist >= R * 1.02) {
          sub.wounded = true;
          this.bleed(sub.x, sub.y, dist ? sub.x / dist : 1, dist ? sub.y / dist : 0, sub.small ? 4 : 9);
          this.glows.push({ x: sub.x, y: sub.y, size: 30, grow: 50, alpha: 0.3, col: mixRGB(this.base, RED_RGB, 0.6) });
        }
        if (dist > R * 1.7) sub.done = true;
      }
    }
    this.subs = this.subs.filter((s) => !s.done);
    if (this.gpu) {
      const bullets = [], pushes = [];
      for (const sub of this.subs) {
        if (sub.state === 'piercing' && bullets.length < 2) { const sp2 = Math.hypot(sub.vx, sub.vy) || 1; bullets.push({ x: sub.x, y: sub.y, dx: sub.vx / sp2, dy: sub.vy / sp2, on: sub.small ? 0.5 : 1 }); }
        if (sub.state === 'gliding' && pushes.length < 2) pushes.push({ x: sub.x, y: sub.y, r: 46, s: 260 });
      }
      this.gpu.frame(dt, {
        R, swirl, noise: p.noise, awake: this.awake,
        shift: this.colorShift, stress: this.stress, pleasure: this.pleasure, mood: this.mood,
        /* the shadow positions must go dim and erratic, not dark — these
           gates stack, so each one only ever takes about half */
        emit: (0.55 + 0.45 * p.fidelity) * (0.70 + 0.30 * p.scale),
        alpha: 1.05 * (0.55 + 0.45 * this.awake) * (0.62 + 0.38 * p.fidelity),
        center: { x: this.cx + (this.offX || 0), y: this.cy + (this.offY || 0) },
        vortices: this.vortices, bullets, pushes,
      });
      /* the 2D layer borrows the fluid's wandering hue, clamped near
         the core rose so the glyph never stops being Fi's */
      this.tint = mixRGB(this.base, this.gpu.tint, 0.5);
    }
  }
  sprite(col) {
    const q = (v) => Math.round(v / 14) * 14;
    const cq = { r: q(col.r), g: q(col.g), b: q(col.b) };
    const key = (cq.r << 16) | (cq.g << 8) | cq.b;
    let s = this._spriteCache.get(key);
    if (!s) {
      s = document.createElement('canvas'); s.width = s.height = 64;
      const g = s.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, rgbA(cq, 0.5)); gr.addColorStop(0.5, rgbA(cq, 0.14)); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      this._spriteCache.set(key, s);
    }
    return s;
  }
  draw() {
    const { ctx, W, H } = this; const p = this.params;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const R = this.baseR * p.scale;
    const gcx = this.cx + (this.offX || 0), gcy = this.cy + (this.offY || 0);
    const dim = 0.25 + 0.75 * (this.awake || 1);
    const F = mixRGB(this.tint, RED_RGB, this.colorShift);
    const moodDim = 1 - 0.28 * this.mood;
    const glow = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, R * 1.5);
    glow.addColorStop(0, rgbA(F, 0.10 * dim * this.opts.coreGlow * moodDim));
    glow.addColorStop(0.65, rgbA(F, 0.03 * dim * this.opts.coreGlow));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    const fidMul = 0.55 + 0.45 * p.fidelity;
    for (const m of this.mist) {
      if (this.gpu && !m.escape) continue;
      const col = this.colorShift > 0.03 ? mixRGB(m.col, RED_RGB, this.colorShift * 0.7) : m.col;
      const spr = this.sprite(col); const sz = m.size * p.scale * (m.escape ? 1.15 : 1);
      ctx.globalAlpha = clamp(m.alphaBase * dim * fidMul * moodDim * m.fade * 3.2, 0, 0.5);
      ctx.drawImage(spr, gcx + m.x - sz, gcy + m.y - sz, sz * 2, sz * 2);
    }
    for (const g of this.glows) { const spr = this.sprite(g.col); ctx.globalAlpha = clamp(g.alpha * dim, 0, 0.7); ctx.drawImage(spr, gcx + g.x - g.size, gcy + g.y - g.size, g.size * 2, g.size * 2); }
    ctx.globalAlpha = 1;
    for (const n of this.nodes) { const tw = 0.5 + 0.5 * Math.sin(n.tw * 2); ctx.beginPath(); ctx.arc(n.x, n.y, 1.6 + tw * 0.9, 0, TAU); ctx.fillStyle = rgbA(F, (0.25 + 0.45 * p.fidelity * tw) * dim * moodDim); ctx.fill(); }
    const breathe = 0.9 + 0.1 * Math.sin(this.t * 1.3);
    const coreR = R * (0.085 + 0.055 * this.corePulse) * breathe;
    const cg = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, coreR * 3.4);
    cg.addColorStop(0, hexA('#ffffff', (0.65 + 0.35 * this.corePulse) * dim));
    cg.addColorStop(0.25, rgbA(F, 0.7 * dim)); cg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(gcx, gcy, coreR * 3.4, 0, TAU); ctx.fill();
    for (const pt of this.particles) {
      let px = this.cx + pt.x, py = this.cy + pt.y, alpha, col = pt.col;
      if (pt.state === 'absorbed') { const e = clamp(pt.age / 0.5, 0, 1); px = lerp(px, gcx, e); py = lerp(py, gcy, e); alpha = (0.5 - pt.age) * 1.6; }
      else if (pt.state === 'rejected') { alpha = clamp(1.2 - pt.age * 0.8, 0, 0.7); }
      else alpha = clamp(0.22 + Math.sin(pt.tw) * 0.14 + 0.22, 0, 0.65);
      ctx.beginPath(); ctx.arc(px, py, pt.sz, 0, TAU);
      ctx.fillStyle = hexA(col.startsWith('#') ? col : rgbHex(F), alpha * dim); ctx.fill();
    }
    for (const sub of this.subs) {
      const a = (sub.alpha !== undefined ? sub.alpha : 1) * dim;
      if (sub.state === 'piercing') {
        const sp = Math.hypot(sub.vx, sub.vy) || 1; const hx = sub.vx / sp, hy = sub.vy / sp;
        const x1 = gcx + sub.x, y1 = gcy + sub.y;
        const grad = ctx.createLinearGradient(x1 - hx * 30, y1 - hy * 30, x1, y1);
        grad.addColorStop(0, hexA(sub.color, 0)); grad.addColorStop(1, hexA(sub.color, 0.9 * a));
        ctx.strokeStyle = grad; ctx.lineWidth = sub.small ? 2 : 3;
        ctx.beginPath(); ctx.moveTo(x1 - hx * 30, y1 - hy * 30); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.beginPath(); ctx.arc(x1, y1, sub.small ? 2.4 : 3.4, 0, TAU);
        ctx.fillStyle = hexA(sub.color, a); ctx.fill(); continue;
      }
      if (sub.kind === 'fakeGood') {
        const x = gcx + sub.x, y = gcy + sub.y;
        ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fillStyle = hexA(sub.color, 0.95 * a); ctx.fill();
        ctx.beginPath(); ctx.arc(x - 2.2, y - 2.4, 2.2, 0, TAU); ctx.fillStyle = hexA('#ffffff', 0.75 * a); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 8.5, 0, TAU); ctx.strokeStyle = hexA('#ffffff', 0.25 * a); ctx.lineWidth = 1; ctx.stroke(); continue;
      }
      const pts = this.subNodesAbs(sub);
      for (const [i, j] of sub.shape.edges) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = hexA(sub.color, 0.45 * a); ctx.lineWidth = 1; ctx.stroke(); }
      for (const pt of pts) {
        const spr = this.sprite(sub.colRGB); ctx.globalAlpha = 0.5 * a;
        ctx.drawImage(spr, pt.x - 7, pt.y - 7, 14, 14); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.8, 0, TAU); ctx.fillStyle = hexA(sub.color, 0.9 * a); ctx.fill();
      }
    }
    ctx.save(); ctx.shadowBlur = 10; ctx.shadowColor = rgbA(F, 0.5); ctx.lineWidth = 1.1;
    for (const [rr, aa] of [[1.32, 0.20], [1.24, 0.10]]) { ctx.beginPath(); ctx.arc(gcx, gcy, R * rr, 0, TAU); ctx.strokeStyle = rgbA(F, aa * dim); ctx.stroke(); }
    ctx.restore();
    if (p.noise > 0.05) { const n = Math.round(p.noise * 46); ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06); for (let i = 0; i < n; i++) ctx.fillRect(gcx + (this.rng() - 0.5) * R * 2.8, gcy + (this.rng() - 0.5) * R * 2.8, 1.4, 1.4); }
  }
  renderStatic() { for (let i = 0; i < 30; i++) this.step(1 / 30); this.draw(); }
  start() {
    if (REDUCED) { this.renderStatic(); return; }
    let last = performance.now();
    const loop = (now) => { const dt = Math.min((now - last) / 1000, 0.05); last = now; if (this._visible !== false) { this.step(dt); this.draw(); } this._raf = requestAnimationFrame(loop); };
    this._raf = requestAnimationFrame(loop);
    new IntersectionObserver((entries) => { this._visible = entries[0].isIntersecting; }, { threshold: 0.02 }).observe(this.cv);
  }
}
