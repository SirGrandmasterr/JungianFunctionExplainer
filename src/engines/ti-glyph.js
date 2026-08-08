/* ============================================================
   CURRENTS · TiGlyph — The Lattice Engine
   Ti is a crystalline framework, endlessly self-refining.
   Every idea that enters is tested against the lattice —
   integrated with a quiet click of coherence, or cleanly
   rejected.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexLerp } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };

/** Read the page's color palette once (call after CSS is loaded) */
export function readCOL() {
  return {
    ti: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };
}

export class TiGlyph {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ interactive: true, coreGlow: 1, seed: 7 }, opts);
    this.COL = opts.COL || readCOL();
    this.rng = mulberry32(this.opts.seed);
    this.params = { scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 };
    this.target = { ...this.params };
    this.feeder = null;
    this.nodes = []; this.edges = []; this.particles = [];
    this.subs = [];
    this.bridges = [];
    this.bombard = false;
    this.stress = 0.12; this.pleasure = 0.2;
    this.colorShift = 0;
    this.explode = 0;
    this.pulseT = 0; this.pulseColor = '#ffffff';
    this.structure = { countMul: 1, k: 3, rigidity: 0.4 };
    this.latticeSeed = 101;
    this.pointer = { x: null, y: null, hist: [] };
    this.t = 0;
    this.restructureAt = 12 + this.rng() * 8;
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
      canvas.addEventListener('pointerleave', () => { this.pointer.hist = []; this.pointer.x = this.pointer.y = null; });
    }
    this.buildLattice();
    for (let i = 0; i < 40; i++) this.spawnParticle(true);
  }
  _resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.cv.width = r.width * this.dpr;
    this.cv.height = r.height * this.dpr;
    this.W = r.width; this.H = r.height;
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.baseR = Math.min(this.W, this.H) * 0.34;
    if (REDUCED) this.renderStatic();
  }
  setTarget(p) { Object.assign(this.target, { contrary: 0 }, p); if (REDUCED) { Object.assign(this.params, this.target); this.renderStatic(); } }
  color() { return hexLerp(this.COL.ti, '#e04848', this.colorShift); }
  setStructure(s) {
    const next = Object.assign({}, this.structure, s);
    const sig = (o) => `${o.countMul.toFixed(2)}|${o.k}|${o.rigidity.toFixed(2)}`;
    const changed = sig(next) !== sig(this.structure);
    this.structure = next;
    if (changed) { this.buildLattice(); if (REDUCED) this.renderStatic(); }
  }
  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  setFeeder(f) { this.feeder = f; this.buildLattice(); if (REDUCED) this.renderStatic(); }
  latticeSpec() {
    const f = this.feeder;
    return {
      count: f ? Math.round(lerp(22, 40, f.branchy)) : 30,
      spread: f ? lerp(0.72, 1.15, f.spread) : 1,
      persistence: f ? f.persistence : 0.85,
    };
  }
  buildLattice() {
    const spec = this.latticeSpec();
    spec.count = Math.round(spec.count * this.structure.countMul);
    const rng = mulberry32(this.opts.seed + this.latticeSeed);
    this.nodes = [];
    for (let i = 0; i < spec.count; i++) {
      const a = rng() * TAU, rr = Math.sqrt(rng()) * spec.spread;
      this.nodes.push({ a, r: rr, x: 0, y: 0, pulse: 0, born: this.t, wob: rng() * TAU, wobSp: 0.2 + rng() * 0.4 });
    }
    this.edges = [];
    const K = Math.min(this.structure.k, spec.count - 1);
    const pts = this.nodes.map((n) => ({ x: Math.cos(n.a) * n.r, y: Math.sin(n.a) * n.r }));
    for (let i = 0; i < pts.length; i++) {
      const d = pts.map((p, j) => (j === i ? 1e9 : (p.x - pts[i].x) ** 2 + (p.y - pts[i].y) ** 2));
      const order = d.map((v, j) => [v, j]).sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < K; k++) {
        const j = order[k][1];
        if (!this.edges.some((e) => (e.a === i && e.b === j) || (e.a === j && e.b === i)))
          this.edges.push({ a: i, b: j, birth: this.t, life: 1 });
      }
    }
  }
  makeSubShape(homomorph) {
    if (homomorph && this.nodes.length > 4 && this.edges.length > 3) {
      const rng = this.rng;
      const e0 = this.edges[Math.floor(rng() * this.edges.length)];
      const idx = new Set([e0.a, e0.b]);
      for (const e of this.edges) { if (idx.size >= 4) break; if (idx.has(e.a)) idx.add(e.b); else if (idx.has(e.b)) idx.add(e.a); }
      const ids = [...idx];
      const R = this.baseR * this.params.scale;
      const px = ids.map((i) => ({ x: Math.cos(this.nodes[i].a) * this.nodes[i].r * R * 0.45, y: Math.sin(this.nodes[i].a) * this.nodes[i].r * R * 0.45 }));
      const cxm = px.reduce((s, p) => s + p.x, 0) / px.length, cym = px.reduce((s, p) => s + p.y, 0) / px.length;
      const nodes = px.map((p) => ({ x: p.x - cxm, y: p.y - cym }));
      const edges = [];
      this.edges.forEach((e) => { const a = ids.indexOf(e.a), b = ids.indexOf(e.b); if (a >= 0 && b >= 0) edges.push([a, b]); });
      if (edges.length) return { nodes, edges };
    }
    const rng = this.rng, n = 4 + Math.floor(rng() * 2), nodes = [], edges = [];
    for (let i = 0; i < n; i++) { const a = rng() * TAU, r = 5 + rng() * 13; nodes.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
    for (let i = 1; i < n; i++) edges.push([i - 1, i]);
    edges.push([0, n - 1]);
    return { nodes, edges };
  }
  spawnSub(kind, opts = {}) {
    const rng = this.rng;
    const homomorph = kind === 'homo' || kind === 'link';
    const shape = this.makeSubShape(homomorph || kind === 'iso');
    const a = opts.angle !== undefined ? opts.angle : rng() * TAU;
    const R = this.baseR;
    const speed = kind === 'conflict' ? 2.6 : 0.9 + rng() * 0.5;
    const sub = {
      kind, shape,
      x: Math.cos(a) * R * 1.55, y: Math.sin(a) * R * 1.55,
      vx: -Math.cos(a) * speed, vy: -Math.sin(a) * speed,
      rot: rng() * TAU, vrot: (rng() - 0.5) * 0.8,
      color: opts.color || '#b9c4d4',
      state: 'incoming', age: 0, alpha: 1,
      verdict: opts.verdict, linkTo: opts.linkTo || null,
    };
    this.subs.push(sub);
    return sub;
  }
  subNodesAbs(sub) {
    const c = Math.cos(sub.rot), s = Math.sin(sub.rot);
    return sub.shape.nodes.map((n) => ({ x: this.cx + sub.x + n.x * c - n.y * s, y: this.cy + sub.y + n.x * s + n.y * c }));
  }
  nearestNodes(px, py, count) {
    return this.nodes.map((n) => ({ n, d: (n.x - px) ** 2 + (n.y - py) ** 2 })).sort((a, b) => a.d - b.d).slice(0, count).map((o) => o.n);
  }
  spawnParticle(seedRandomPhase = false) {
    const p = this.params, f = this.feeder;
    const rng = this.rng;
    let x, y, vx, vy, col, branchy = 0, sz;
    if (f) {
      x = this.W * 0.10 - this.cx; y = (rng() - 0.5) * this.baseR * 0.5;
      const sp = lerp(0.45, 1.5, f.speed);
      vx = sp * (0.8 + rng() * 0.4); vy = (rng() - 0.5) * 0.15;
      col = f.color; branchy = f.branchy; sz = lerp(1.6, 2.4, f.speed);
    } else {
      const a = rng() * TAU, rr = 1.25 + rng() * 0.25;
      x = Math.cos(a) * this.baseR * rr; y = Math.sin(a) * this.baseR * rr;
      const inward = 0.25 + rng() * 0.3;
      vx = -Math.cos(a) * inward + (rng() - 0.5) * 0.2;
      vy = -Math.sin(a) * inward + (rng() - 0.5) * 0.2;
      col = this.COL.ti; sz = 1.5 + rng();
    }
    this.particles.push({ x, y, vx, vy, col, sz, branchy, age: seedRandomPhase ? rng() * 6 : 0, state: 'drift', tw: rng() * TAU });
  }
  delayedPointer() {
    const { latency } = this.params;
    const h = this.pointer.hist;
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
    if (this.t > this.restructureAt && !this.feeder) { this.restructureAt = this.t + 14 + this.rng() * 10; this.buildLattice(); this.ripple = 1; }
    if (this.ripple) this.ripple = Math.max(0, this.ripple - dt * 0.8);
    if (this.pulseT > 0) this.pulseT = Math.max(0, this.pulseT - dt * 1.35);
    this.stress += (0.12 - this.stress) * (1 - Math.pow(0.7, dt));
    this.pleasure += (0.20 - this.pleasure) * (1 - Math.pow(0.6, dt));
    const shiftTarget = clamp((this.stress - 0.35) * 1.75, 0, 1);
    this.colorShift = lerp(this.colorShift, shiftTarget, 1 - Math.pow(0.08, dt));
    if (this.explode > 0) this.explode = Math.max(0, this.explode - dt * 0.4);
    if (this._rebuildAt && this.t >= this._rebuildAt) { this._rebuildAt = 0; this.latticeSeed += 13; this.buildLattice(); this.ripple = 1; }
    const dutyWave = (Math.sin(this.t * 0.9) + 1) / 2;
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.4, 0.12, 1);
    const ptr = this.delayedPointer();
    let ax = 0, ay = 0;
    if (ptr && this.opts.interactive) {
      const px = ptr.x - this.cx, py = ptr.y - this.cy;
      const contrary = (p.contrary > 0 && Math.sin(this.t * 0.7 + 2) > 1 - p.contrary * 1.2) ? -1 : 1;
      ax = px * 0.06 * p.control * contrary;
      ay = py * 0.06 * p.control * contrary;
    }
    this.offX = lerp(this.offX || 0, ax, 1 - Math.pow(0.01, dt));
    this.offY = lerp(this.offY || 0, ay, 1 - Math.pow(0.01, dt));
    const R = this.baseR * p.scale;
    const wobble = ((1 - p.fidelity) * R * 0.16 + p.noise * R * 0.05) * (1 - this.structure.rigidity * 0.65);
    for (const n of this.nodes) {
      n.wob += n.wobSp * dt * (1 + p.noise * 3);
      n.x = this.cx + this.offX + Math.cos(n.a) * n.r * R + Math.cos(n.wob) * wobble;
      n.y = this.cy + this.offY + Math.sin(n.a) * n.r * R + Math.sin(n.wob * 1.3) * wobble;
      if (this.explode > 0) { n.x += (this.rng() - 0.5) * this.explode * R * 0.3; n.y += (this.rng() - 0.5) * this.explode * R * 0.3; }
      n.pulse = Math.max(0, n.pulse - dt * 2.2);
    }
    const spawnRate = this.bombard ? 0 : (this.feeder ? lerp(6, 20, this.feeder.rate) : 11);
    if (this.bombard) {
      this._subAcc = (this._subAcc || 0) + dt;
      const interval = 2.7 - 1.5 * p.duty;
      if (this._subAcc > interval && this.subs.filter((s) => s.state === 'incoming').length < 3) {
        this._subAcc = 0;
        const homo = this.rng() < 0.55;
        this.spawnSub(homo ? 'homo' : 'noise');
      }
    }
    this._acc = (this._acc || 0) + dt * spawnRate * (0.4 + 0.6 * this.awake);
    while (this._acc > 1) { this._acc--; this.spawnParticle(); }
    const spd = dt * 60;
    for (const pt of this.particles) {
      pt.age += dt; pt.tw += dt * 3;
      if (pt.state === 'drift') {
        if (pt.branchy > 0 && this.rng() < pt.branchy * dt * 0.9 && this.particles.length < 220) {
          this.particles.push({ ...pt, vy: pt.vy + (this.rng() - 0.5) * 0.9, sz: pt.sz * 0.85, age: 0, tw: this.rng() * TAU });
        }
        pt.x += pt.vx * spd; pt.y += pt.vy * spd;
        pt.x += (this.rng() - 0.5) * p.noise * 2.4;
        pt.y += (this.rng() - 0.5) * p.noise * 2.4;
        let best = null, bd = 1e9;
        for (const n of this.nodes) { const dd = (n.x - (this.cx + pt.x)) ** 2 + (n.y - (this.cy + pt.y)) ** 2; if (dd < bd) { bd = dd; best = n; } }
        if (best && bd < 14 * 14) {
          const accepted = this.rng() < (0.3 + p.fidelity * 0.55) * this.awake;
          pt.state = accepted ? 'absorbed' : 'rejected';
          if (accepted) { best.pulse = 1; pt.node = best; pt.age = 0; }
          else { const a = Math.atan2(pt.y, pt.x || 0.01); pt.vx = Math.cos(a) * 0.9; pt.vy = Math.sin(a) * 0.9; pt.age = 0; }
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
    const R2 = this.baseR * p.scale;
    for (const sub of this.subs) {
      sub.age += dt;
      if (sub.state === 'incoming') {
        sub.x += sub.vx * spd; sub.y += sub.vy * spd; sub.rot += sub.vrot * dt;
        const dist = Math.hypot(sub.x, sub.y);
        if (sub.kind === 'iso') { if (dist <= R2 * 0.95) { sub.state = 'resident'; sub.homeA = Math.atan2(sub.y, sub.x); sub.homeR = dist; } }
        else if (sub.kind === 'link') {
          const res = sub.linkTo;
          const tx = res ? res.x * 0.55 : 0, ty = res ? res.y * 0.55 : 0;
          const dxx = tx - sub.x, dyy = ty - sub.y, dd = Math.hypot(dxx, dyy);
          sub.vx = dxx / Math.max(dd, 1) * 2.0; sub.vy = dyy / Math.max(dd, 1) * 2.0;
          if (dd < 7) {
            sub.state = 'bridged'; sub.bridgeT = 0;
            const near = this.nearestNodes(this.cx + sub.x, this.cy + sub.y, 2);
            this.bridges = near.map((n, i) => ({ sub, si: i % sub.shape.nodes.length, node: n }));
            if (res) this.bridges.push({ sub, si: 0, resident: res, ri: 0 });
            this.pleasure = 1; this.stress = Math.max(0.05, this.stress - 0.25);
            this.pulse(VERDICT.good);
          }
        } else if (sub.kind === 'conflict') {
          if (dist <= R2 * 0.55) { sub.state = 'shatter'; sub.age = 0; this.stress = 1; this.explode = 1; this._rebuildAt = this.t + 1.15; this.pulse(VERDICT.bad); }
        } else {
          if (dist <= R2 * 1.05) {
            const misjudge = this.rng() < (1 - p.fidelity) * 0.45;
            const correct = sub.kind === 'homo';
            const accept = misjudge ? !correct : correct;
            if (accept) {
              sub.state = 'merging'; sub.age = 0;
              const abs = this.subNodesAbs(sub);
              sub.targets = abs.map((pt) => this.nearestNodes(pt.x, pt.y, 1)[0]);
              this.pulse(VERDICT.good); this.pleasure = Math.min(1, this.pleasure + 0.22);
            } else {
              sub.state = 'bouncing'; sub.age = 0;
              const dd = Math.max(dist, 1);
              sub.vx = sub.x / dd * 1.7; sub.vy = sub.y / dd * 1.7;
              this.pulse(VERDICT.bad); this.stress = Math.min(1, this.stress + 0.1);
            }
          }
        }
      } else if (sub.state === 'resident') { sub.homeA += dt * 0.05; sub.x = Math.cos(sub.homeA) * sub.homeR; sub.y = Math.sin(sub.homeA) * sub.homeR; sub.rot += sub.vrot * dt * 0.3; }
      else if (sub.state === 'bridged') {
        sub.bridgeT += dt;
        if (sub.bridgeT > 1.2) {
          sub.state = 'folding'; sub.age = 0;
          const abs = this.subNodesAbs(sub); sub.targets = abs.map((pt) => this.nearestNodes(pt.x, pt.y, 1)[0]);
          const res = sub.linkTo;
          if (res && res.state === 'resident') { res.state = 'folding'; res.age = 0; const rabs = this.subNodesAbs(res); res.targets = rabs.map((pt) => this.nearestNodes(pt.x, pt.y, 1)[0]); }
          this.bridges = [];
        }
      } else if (sub.state === 'merging' || sub.state === 'folding') {
        sub.alpha = clamp(1 - sub.age / 0.9, 0, 1);
        if (sub.age >= 0.9) { if (sub.targets) sub.targets.forEach((n) => { if (n) n.pulse = 1; }); sub.done = true; }
      } else if (sub.state === 'bouncing') {
        sub.x += sub.vx * spd; sub.y += sub.vy * spd; sub.rot += sub.vrot * dt * 2;
        sub.alpha = clamp(1.3 - sub.age * 0.75, 0, 1); if (sub.age > 1.8) sub.done = true;
      } else if (sub.state === 'shatter') { sub.alpha = clamp(1 - sub.age / 0.6, 0, 1); if (sub.age > 0.6) sub.done = true; }
    }
    this.subs = this.subs.filter((s) => !s.done);
  }
  draw() {
    const { ctx, W, H } = this;
    const p = this.params;
    const COL = this.COL;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const R = this.baseR * p.scale;
    const gcx = this.cx + this.offX, gcy = this.cy + this.offY;
    const dim = 0.25 + 0.75 * this.awake;
    const TINT = this.color();
    const glow = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, R * 1.5);
    glow.addColorStop(0, hexA(TINT, 0.16 * dim * this.opts.coreGlow));
    glow.addColorStop(0.6, hexA(TINT, 0.045 * dim * this.opts.coreGlow));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.25;
    for (const [rr, aa] of [[1.32, 0.35], [1.24, 0.18]]) {
      ctx.beginPath();
      ctx.arc(gcx, gcy, R * rr + (this.ripple ? Math.sin(this.t * 20) * 3 * this.ripple : 0), 0, TAU);
      ctx.strokeStyle = hexA(TINT, aa * dim); ctx.stroke();
    }
    for (const e of this.edges) {
      const A = this.nodes[e.a], B = this.nodes[e.b]; if (!A || !B) continue;
      const flick = p.noise > 0.3 && this.rng() < p.noise * 0.18 ? 0.25 : 1;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
      ctx.strokeStyle = hexA(TINT, (0.14 + 0.4 * p.fidelity) * dim * flick); ctx.lineWidth = 1; ctx.stroke();
    }
    for (const n of this.nodes) {
      ctx.beginPath(); ctx.arc(n.x, n.y, 2 + n.pulse * 3.4, 0, TAU);
      ctx.fillStyle = hexA(TINT, (0.35 + 0.55 * p.fidelity) * dim); ctx.fill();
      if (n.pulse > 0.02) { ctx.beginPath(); ctx.arc(n.x, n.y, 4 + (1 - n.pulse) * 16, 0, TAU); ctx.strokeStyle = hexA('#ffffff', n.pulse * 0.5); ctx.lineWidth = 1; ctx.stroke(); }
    }
    for (const pt of this.particles) {
      let px = this.cx + pt.x, py = this.cy + pt.y, alpha, col = pt.col;
      if (pt.state === 'absorbed' && pt.node) { px = pt.node.x; py = pt.node.y; alpha = (0.5 - pt.age) * 1.6; }
      else if (pt.state === 'rejected') { alpha = clamp(1.2 - pt.age * 0.8, 0, 0.8); col = pt.col; }
      else alpha = clamp(0.25 + Math.sin(pt.tw) * 0.15 + 0.25, 0, 0.75);
      ctx.beginPath(); ctx.arc(px, py, pt.sz, 0, TAU);
      ctx.fillStyle = hexA(col.startsWith('#') ? col : COL.ti, alpha * dim); ctx.fill();
    }
    for (const b of this.bridges) {
      const aPt = this.subNodesAbs(b.sub)[b.si];
      const bPt = b.node ? { x: b.node.x, y: b.node.y } : b.resident ? this.subNodesAbs(b.resident)[b.ri] : null;
      if (!aPt || !bPt) continue;
      ctx.beginPath(); ctx.moveTo(aPt.x, aPt.y); ctx.lineTo(bPt.x, bPt.y);
      ctx.strokeStyle = hexA(b.sub.color, 0.65); ctx.lineWidth = 1.4; ctx.stroke();
    }
    for (const sub of this.subs) {
      const abs = this.subNodesAbs(sub);
      let pts = abs;
      if ((sub.state === 'merging' || sub.state === 'folding') && sub.targets) {
        const pr = Math.min(sub.age / 0.9, 1), e = pr * pr * (3 - 2 * pr);
        pts = abs.map((pt, i) => { const tn = sub.targets[i]; return tn ? { x: lerp(pt.x, tn.x, e), y: lerp(pt.y, tn.y, e) } : pt; });
      } else if (sub.state === 'shatter') {
        const e = sub.age * 3;
        pts = abs.map((pt) => ({ x: pt.x + (pt.x - gcx) * e * 0.3, y: pt.y + (pt.y - gcy) * e * 0.3 }));
      }
      const a = (sub.alpha !== undefined ? sub.alpha : 1) * dim;
      for (const [i, j] of sub.shape.edges) {
        if (!pts[i] || !pts[j]) continue;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
        ctx.strokeStyle = hexA(sub.color, 0.55 * a); ctx.lineWidth = 1; ctx.stroke();
      }
      for (const pt of pts) { ctx.beginPath(); ctx.arc(pt.x, pt.y, 2.1, 0, TAU); ctx.fillStyle = hexA(sub.color, 0.9 * a); ctx.fill(); }
    }
    if (this.pulseT > 0.01) {
      const pa = this.pulseT;
      ctx.beginPath(); ctx.arc(gcx, gcy, R * 1.32, 0, TAU);
      ctx.strokeStyle = hexA(this.pulseColor, pa * 0.85); ctx.lineWidth = 2.5; ctx.stroke();
      const pg = ctx.createRadialGradient(gcx, gcy, R * 0.3, gcx, gcy, R * 1.45);
      pg.addColorStop(0, hexA(this.pulseColor, pa * 0.10)); pg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = pg; ctx.fillRect(0, 0, W, H);
    }
    if (p.noise > 0.05) {
      const n = Math.round(p.noise * 46);
      ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06);
      for (let i = 0; i < n; i++) ctx.fillRect(gcx + (this.rng() - 0.5) * R * 2.8, gcy + (this.rng() - 0.5) * R * 2.8, 1.4, 1.4);
    }
  }
  renderStatic() { for (let i = 0; i < 30; i++) this.step(1 / 30); this.draw(); }
  start() {
    if (REDUCED) { this.renderStatic(); return; }
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (this._visible !== false) { this.step(dt); this.draw(); }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
    new IntersectionObserver((entries) => { this._visible = entries[0].isIntersecting; }, { threshold: 0.02 }).observe(this.cv);
  }
}
