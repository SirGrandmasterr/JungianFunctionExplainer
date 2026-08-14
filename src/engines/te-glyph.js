/* ============================================================
   CURRENTS · TeGlyph — The Scaffold Engine
   Ti builds a private lattice; Te throws structure up in the
   world. Material arrives, is sorted onto a frontier that
   steps forward on a metronome, and the finished structure is
   delivered outward through the open ring. The plan is always
   visible ahead of the work. Inefficiency is not mourned —
   it is cut, with a snap.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexLerp } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
const HUD_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** Read the page's color palette once (call after CSS is loaded) */
export function readCOL() {
  return {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };
}

export class TeGlyph {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ interactive: true, coreGlow: 1, seed: 7, hud: true, hudScale: 1 }, opts);
    this.COL = opts.COL || readCOL();
    this.rng = mulberry32(this.opts.seed);
    this.params = { scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 };
    this.target = { ...this.params };
    this.feeder = null;
    /* the build */
    this.bays = []; this.exiting = [];
    this.rows = 3; this.nBays = 7;
    this.structure = { countMul: 1, k: 3, rigidity: 0.4 };
    this.latticeSeed = 101;
    /* flying things */
    this.particles = []; this.emits = []; this.debris = []; this.subs = []; this.badges = [];
    this.bombard = false;
    /* state */
    this.stress = 0.12; this.pleasure = 0.2;
    this.colorShift = 0;
    this.shake = 0; this.ripple = 0; this.blocked = 0; this.surge = 0;
    this.pulseT = 0; this.pulseColor = '#ffffff';
    this.slide = 0; this.slideFrom = 1e9;
    /* the counters — Te's kinetic signature is a visible readout */
    this.units = 0; this.milestones = 0; this.pruned = 0;
    this.rate = 0; this._tp = 0;
    this.beatT = 0; this._nextBeat = 0.7; this.beatFlash = 0; this.stallFlash = 0; this.flagFlash = 0;
    this.pointer = { x: null, y: null, hist: [] };
    this.t = 0;
    this._ghost = { fill: 0, flaw: 0, jit: [0, 0, 0, 0, 0, 0, 0, 0], diag: 1, wob: 0, snap: 0, state: 'plan' };
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
    this.buildLane();
    this.g = this.geom();
    for (let i = 0; i < 26; i++) this.spawnParticle(true);
  }

  _resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.cv.width = r.width * this.dpr;
    this.cv.height = r.height * this.dpr;
    this.W = r.width; this.H = r.height;
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.baseR = Math.min(this.W, this.H) * 0.34;
    this.g = this.geom();
    if (REDUCED) this.renderStatic();
  }

  /* ---------- shared glyph API ---------- */
  setTarget(p) {
    Object.assign(this.target, { contrary: 0 }, p);
    if (REDUCED) { Object.assign(this.params, this.target); this.renderStatic(); }
  }
  setStructure(s) {
    const next = Object.assign({}, this.structure, s);
    const sig = (o) => `${o.countMul.toFixed(2)}|${o.k}|${o.rigidity.toFixed(2)}`;
    const changed = sig(next) !== sig(this.structure);
    this.structure = next;
    if (changed) { this.buildLane(); if (REDUCED) this.renderStatic(); }
  }
  setFeeder(f) { this.feeder = f; this.bays = []; this.buildLane(); if (REDUCED) this.renderStatic(); }
  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  color() { return hexLerp(this.COL.fn, '#e04848', this.colorShift); }

  /* ---------- lane geometry ---------- */
  /**
   * Feeder cfg → scaffold shape.
   *   persistence + slow speed → a long build toward a distant flag (Ni)
   *   fast, disposable input    → a short one you finish today (Se)
   *   wide spread               → another storey; heavy branching → one fewer
   */
  laneSpec() {
    const f = this.feeder;
    const longRange = f ? clamp(f.persistence * 0.5 + (1 - f.speed) * 0.5, 0, 1) : 0.5;
    const bays = clamp(Math.round(lerp(4, 10, longRange) * this.structure.countMul), 3, 11);
    const rows = clamp(this.structure.k + (f && f.spread > 0.8 ? 1 : 0) - (f && f.branchy > 0.7 ? 1 : 0), 2, 4);
    return { bays, rows };
  }
  buildLane() {
    const spec = this.laneSpec();
    this.nBays = spec.bays;
    this.rows = spec.rows;
    const rng = mulberry32(this.opts.seed + this.latticeSeed);
    if (!this.bays.length) {
      const n = Math.max(1, Math.round(this.nBays * 0.45));
      for (let i = 0; i < n; i++) {
        const b = this.makeBay(rng);
        b.fill = i < n - 1 ? 0.72 + rng() * 0.28 : rng() * 0.5;
        this.bays.push(b);
      }
    } else if (this.bays.length > this.nBays) {
      this.bays.length = this.nBays;
    }
  }
  makeBay(rng = this.rng) {
    return {
      fill: 0,
      flaw: clamp((1 - this.params.fidelity) * (0.3 + rng() * 0.8), 0, 1),
      jit: [rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5, rng() - 0.5],
      diag: rng() < 0.5 ? 1 : -1,
      wob: rng() * TAU, wobSp: 0.25 + rng() * 0.5,
      snap: 0, mark: 0, state: 'live', born: this.t,
    };
  }
  geom() {
    const R = this.baseR * this.params.scale;
    const Rb = R * 1.2;
    const x0 = -Rb * 0.76, x1 = Rb * 0.76;
    return { R, Rb, x0, x1, bw: (x1 - x0) / Math.max(1, this.nBays), th: R * (0.185 + 0.055 * this.rows) };
  }
  bayX(i, g) { return g.x0 + i * g.bw + (i >= this.slideFrom ? this.slide * this.slide * g.bw : 0); }
  frontier() { return this.bays[this.bays.length - 1] || null; }
  frontierPoint(g) {
    const i = Math.max(0, this.bays.length - 1);
    return { x: this.bayX(i, g) + g.bw * 0.5, y: 0 };
  }
  /** Members of one bay in build order: base chord, posts, upper chords, braces. */
  bayMembers(b, i, g) {
    const xl = this.bayX(i, g), xr = xl + g.bw, rows = this.rows;
    const wob = Math.sin(b.wob) * g.th * 0.045 * (1 - this.structure.rigidity * 0.7);
    const jf = b.flaw * g.bw * 0.2 + this.params.noise * g.bw * 0.07;
    const J = (n) => b.jit[n & 7] * jf;
    const Y = (r) => -g.th + 2 * g.th * (r / (rows - 1)) + wob;
    const out = [
      [xl, Y(rows - 1) + J(0), xr, Y(rows - 1) + J(1)],
      [xl, Y(rows - 1) + J(0), xl, Y(0) + J(2)],
      [xr, Y(rows - 1) + J(1), xr, Y(0) + J(3)],
    ];
    for (let r = rows - 2; r >= 0; r--) out.push([xl, Y(r) + J(4), xr, Y(r) + J(5)]);
    for (let r = 0; r < rows - 1; r++) {
      out.push(b.diag > 0
        ? [xl, Y(r) + J(6), xr, Y(r + 1) + J(7)]
        : [xl, Y(r + 1) + J(7), xr, Y(r) + J(6)]);
    }
    return out;
  }

  /* ---------- the metronome ---------- */
  beatPeriod() {
    const p = this.params, f = this.feeder;
    let per = 0.62 + (1 - p.fidelity) * 1.5;
    if (f) per *= lerp(1.35, 0.78, f.speed);
    return per * (1 + p.latency / 1400);
  }
  onBeat() {
    const p = this.params;
    this.beatFlash = 1;
    if (this.awake < 0.32 && this.rng() < 0.72) { this.stallFlash = 1; return; }
    if (p.contrary > 0 && this.rng() < p.contrary * 0.75) { this.undoWork(); return; }
    const cur = this.frontier();
    if (cur) {
      cur.snap = 1;
      if (cur.fill > 0.9) this.pleasure = clamp(this.pleasure + 0.05, 0, 1);
      else if (cur.fill < 0.45) this.stress = clamp(this.stress + 0.035, 0, 1);
    }
    if (this.bays.length >= this.nBays) { if (!this._cutAt) this.deliver(); }
    else this.bays.push(this.makeBay());
  }
  /** Shadow Te: work that undoes itself. */
  undoWork() {
    const b = this.frontier();
    if (!b) return;
    const g = this.g, i = this.bays.length - 1;
    for (const m of this.bayMembers(b, i, g)) {
      if (this.rng() < 0.5) this.spawnDebris(m, 1);
    }
    b.fill *= 0.42;
    b.flaw = clamp(b.flaw + 0.3, 0, 1);
    this.stress = clamp(this.stress + 0.08, 0, 1);
    this.badge(this.bayX(i, g) + g.bw * 0.5, -g.th - 12, false, 'rework');
  }
  /** The flag is reached: the whole structure leaves through the open ring. */
  deliver() {
    const g = this.g;
    let units = 0;
    for (const b of this.bays) units += b.fill * this.rows;
    const quality = units / Math.max(1, this.nBays * this.rows);
    this.units += Math.round(units);
    this._tp += units;
    this.milestones++;
    this.flagFlash = 1;
    this.ripple = 1;
    this.pleasure = clamp(0.32 + 0.68 * quality, 0.12, 1);
    if (quality < 0.5) this.stress = clamp(this.stress + 0.26, 0, 1);
    else this.stress = Math.max(0.05, this.stress - 0.2);
    this.exiting.push({ bays: this.bays, rows: this.rows, nB: this.nBays, bw: g.bw, x0: g.x0, th: g.th, age: 0 });
    if (this.exiting.length > 2) this.exiting.shift();
    for (let i = 0; i < Math.round(7 + units * 1.5); i++) this.spawnProduct(g, quality);
    this.bays = [this.makeBay()];
    this.slideFrom = 1e9; this.slide = 0;
    this.pulse(this.color());
    this.badge(g.x1, -g.th - 18, true, `+${Math.round(units)} u`);
  }
  worstBay() {
    let idx = -1, worst = -1;
    for (let i = 0; i < Math.max(1, this.bays.length - 1); i++) {
      const b = this.bays[i];
      if (!b || b.state !== 'live') continue;
      const score = b.flaw * 1.5 + (1 - b.fill);
      if (score > worst) { worst = score; idx = i; }
    }
    return idx;
  }
  /** Metrics come back bad on a section: flag it, then cut it loose. */
  markForPruning() {
    const idx = this.worstBay();
    if (idx < 0) return false;
    this.bays[idx].state = 'cut';
    this.bays[idx].mark = 1;
    this._cutBay = this.bays[idx];
    this._cutAt = this.t + 0.85;
    this.stress = clamp(this.stress + 0.32, 0, 1);
    const g = this.g;
    this.badge(this.bayX(idx, g) + g.bw * 0.5, -g.th - 12, false, 'underperforming');
    this.pulse(VERDICT.bad);
    return true;
  }
  doPrune() {
    /* the flagged section may have shipped out while it was being measured —
       in that case Te cuts the worst one still standing */
    let idx = this._cutBay ? this.bays.indexOf(this._cutBay) : -1;
    if (idx < 0) idx = this.bays.findIndex((b) => b.state === 'cut');
    if (idx < 0) idx = this.worstBay();
    this._cutBay = null;
    if (idx < 0) return;
    const g = this.g, b = this.bays[idx];
    for (const m of this.bayMembers(b, idx, g)) this.spawnDebris(m, 1.5);
    this.bays.splice(idx, 1);
    if (!this.bays.length) this.bays.push(this.makeBay());
    this.slideFrom = idx; this.slide = 1;
    this.pruned++;
    for (const rest of this.bays) rest.flaw *= 0.55;
    this.stress = Math.max(0.06, this.stress - 0.34);
    this.pleasure = clamp(this.pleasure + 0.42, 0, 1);
    this.surge = 1;
    this.ripple = 1;
    this.pulse(this.color());
  }
  /** The target moved: scope-cut everything and re-aim. */
  replan() {
    this.stress = 1;
    this.shake = 1;
    this._replanAt = this.t + 1.35;
    for (const b of this.bays) { b.fill *= 0.6; b.flaw = clamp(b.flaw + 0.25, 0, 1); }
    this.pulse(VERDICT.bad);
    const g = this.g;
    this.badge(g.x1, -g.th - 18, false, 'target moved');
  }
  doReplan() {
    const rng = mulberry32(this.opts.seed + this.latticeSeed);
    this.latticeSeed += 13;
    const spec = this.laneSpec();
    this.nBays = clamp(spec.bays + (rng() < 0.5 ? -2 : 2), 3, 11);
    this.rows = clamp(spec.rows + (rng() < 0.5 ? -1 : 1), 2, 4);
    const keep = Math.max(1, Math.floor(this.bays.length * 0.5));
    this.bays.length = Math.min(keep, this.nBays);
    for (const b of this.bays) b.flaw *= 0.5;
    this.slideFrom = 1e9; this.slide = 0;
    this.ripple = 1;
  }

  /* ---------- flying things ---------- */
  spawnParticle(seedPhase = false) {
    const f = this.feeder, rng = this.rng, g = this.g || this.geom();
    let x, y, col, sz;
    if (f) {
      x = -this.cx + this.W * 0.1; y = (rng() - 0.5) * g.th * 1.1;
      col = f.color; sz = lerp(1.5, 2.3, f.speed);
    } else {
      x = g.x0 - g.Rb * (0.35 + rng() * 0.5); y = (rng() - 0.5) * g.Rb * 1.4;
      col = this.COL.fn; sz = 1.4 + rng() * 0.9;
    }
    this.particles.push({
      x, y, px: x, py: y, vx: 1, vy: 0, col, sz,
      val: (f ? lerp(0.42, 0.1, f.rate) : 0.26) * (f && f.starve ? 0.5 : 1),
      branchy: f ? f.branchy : 0.12,
      ty: (rng() * 2 - 1) * 0.8,
      age: seedPhase ? rng() * 2 : 0, state: 'drift',
    });
  }
  spawnProduct(g, quality = 1) {
    const rng = this.rng;
    const a = (rng() - 0.5) * 0.85;
    const sp = 2.2 + rng() * 2.6;
    this.emits.push({
      x: g.Rb * 0.96, y: (rng() - 0.5) * g.th * 0.7,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      sz: 1.3 + rng() * (1.4 + quality), col: this.color(), age: 0, life: 1.1 + rng() * 0.8,
    });
  }
  spawnDebris(m, force = 1) {
    const rng = this.rng;
    const mx = (m[0] + m[2]) / 2, my = (m[1] + m[3]) / 2;
    const a = Math.atan2(my, mx || 0.01) + (rng() - 0.5) * 1.1;
    this.debris.push({
      x: mx, y: my, dx: (m[2] - m[0]) / 2, dy: (m[3] - m[1]) / 2,
      vx: Math.cos(a) * (1.5 + rng() * 2.2) * force, vy: Math.sin(a) * (1.5 + rng() * 2.2) * force,
      rot: 0, vrot: (rng() - 0.5) * 5, age: 0,
    });
  }
  badge(x, y, ok, label) { this.badges.push({ x, y, ok, label, age: 0 }); }

  /**
   * Lab & ambient events.
   *  'spec'         — a work order arriving; fits the scaffold or is thrown out
   *  'ship'         — a result comes back measurable and good
   *  'fail'         — metrics condemn a subsystem; it gets cut
   *  'unmeasurable' — material with no number on it; nothing to sort by
   *  'replan'       — the goalpost moves
   */
  spawnSub(kind, opts = {}) {
    const g = this.g, rng = this.rng;
    if (kind === 'ship') {
      const cur = this.frontier();
      if (cur) { cur.fill = 1; cur.flaw *= 0.25; cur.snap = 1; }
      this.surge = 1.4;
      this.pleasure = 1;
      this.stress = Math.max(0.05, this.stress - 0.18);
      this.badge(this.frontierPoint(g).x, -g.th - 12, true, 'result: good');
      this.pulse(VERDICT.good);
      this.beatT = this._nextBeat;
      return null;
    }
    if (kind === 'fail') return this.markForPruning();
    if (kind === 'replan') { this.replan(); return null; }

    const fromLeft = kind === 'unmeasurable' ? false : rng() < 0.5;
    const a = fromLeft ? Math.PI + (rng() - 0.5) * 0.7 : (rng() - 0.5) * 2.4 + (rng() < 0.5 ? 2.1 : -2.1);
    const sub = {
      kind, color: opts.color || this.COL.fn,
      x: Math.cos(a) * g.Rb * 1.7, y: Math.sin(a) * g.Rb * 1.7,
      state: 'incoming', age: 0, alpha: 1, tries: 0, nextTry: 0,
      wob: rng() * TAU, fits: opts.fits,
      shape: kind === 'unmeasurable' ? this.makeBlob(rng) : this.makeCluster(rng),
      rot: (rng() - 0.5) * 0.6, vrot: (rng() - 0.5) * 0.9,
    };
    const sp = kind === 'unmeasurable' ? 1.5 : 2.1 + rng() * 0.8;
    const d = Math.hypot(sub.x, sub.y) || 1;
    sub.vx = -sub.x / d * sp; sub.vy = -sub.y / d * sp;
    this.subs.push(sub);
    return sub;
  }
  /** A work order: girder-shaped, so it can be measured against the lattice. */
  makeCluster(rng) {
    const n = 2 + Math.floor(rng() * 2), w = 9 + rng() * 8, h = 7 + rng() * 7, seg = [];
    for (let i = 0; i < n; i++) {
      const ox = (i - (n - 1) / 2) * w;
      seg.push([ox - w / 2, h, ox + w / 2, h], [ox - w / 2, -h, ox + w / 2, -h], [ox - w / 2, -h, ox - w / 2, h]);
      if (rng() < 0.7) seg.push([ox - w / 2, h, ox + w / 2, -h]);
    }
    seg.push([(n - 1) * w / 2 + w / 2, -h, (n - 1) * w / 2 + w / 2, h]);
    return { kind: 'cluster', seg };
  }
  /** The unmeasurable: deliberately off-grammar — soft, closed, no edges to sort by. */
  makeBlob(rng) {
    const pts = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU;
      pts.push({ a, r: 13 + rng() * 9, sp: 0.5 + rng() * 0.9, ph: rng() * TAU });
    }
    return { kind: 'blob', pts };
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

  /* ---------- simulation ---------- */
  step(dt) {
    this.t += dt;
    const p = this.params, tg = this.target;
    for (const k in tg) p[k] = lerp(p[k], tg[k], 1 - Math.pow(0.0015, dt));

    this.stress += (0.12 - this.stress) * (1 - Math.pow(0.72, dt));
    this.pleasure += (0.2 - this.pleasure) * (1 - Math.pow(0.6, dt));
    this.colorShift = lerp(this.colorShift, clamp((this.stress - 0.35) * 1.75, 0, 1), 1 - Math.pow(0.08, dt));
    this.pulseT = Math.max(0, this.pulseT - dt * 1.35);
    this.beatFlash = Math.max(0, this.beatFlash - dt * 3.4);
    this.stallFlash = Math.max(0, this.stallFlash - dt * 2.2);
    this.flagFlash = Math.max(0, this.flagFlash - dt * 1.1);
    this.ripple = Math.max(0, this.ripple - dt * 0.8);
    this.shake = Math.max(0, this.shake - dt * 0.75);
    this.slide = Math.max(0, this.slide - dt * 3.4);
    this.surge = Math.max(0, this.surge - dt * 0.45);
    this.blocked = Math.max(0, this.blocked - dt * 1.6);

    const dutyWave = (Math.sin(this.t * 0.9) + 1) / 2;
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.4, 0.12, 1);

    /* the machine leans toward whatever it is aimed at */
    const ptr = this.delayedPointer();
    let ax = 0, ay = 0;
    if (ptr && this.opts.interactive) {
      const contrary = (p.contrary > 0 && Math.sin(this.t * 0.7 + 2) > 1 - p.contrary * 1.2) ? -1 : 1;
      ax = (ptr.x - this.cx) * 0.055 * p.control * contrary;
      ay = (ptr.y - this.cy) * 0.055 * p.control * contrary;
    }
    this.offX = lerp(this.offX || 0, ax, 1 - Math.pow(0.01, dt));
    this.offY = lerp(this.offY || 0, ay, 1 - Math.pow(0.01, dt));

    if (this._cutAt && this.t >= this._cutAt) { this._cutAt = 0; this.doPrune(); }
    if (this._replanAt && this.t >= this._replanAt) { this._replanAt = 0; this.doReplan(); }

    this.g = this.geom();
    const g = this.g;

    /* metronome */
    this.beatT += dt;
    if (this.beatT >= this._nextBeat) {
      this.beatT -= this._nextBeat;
      this._nextBeat = Math.max(0.18, this.beatPeriod() * (1 + (this.rng() - 0.5) * p.noise * 1.4) / (1 + this.surge * 0.35));
      this.onBeat();
    }

    /* bays: wobble, snap decay, and the slow rot of work with no staying power */
    const decay = this.feeder ? (1 - this.feeder.persistence) * 0.14 : 0;
    for (let i = 0; i < this.bays.length; i++) {
      const b = this.bays[i];
      b.wob += b.wobSp * dt * (1 + p.noise * 3);
      b.snap = Math.max(0, b.snap - dt * 2.6);
      if (b.mark) b.mark = Math.min(1, b.mark + dt);
      if (decay && i < this.bays.length - 1) b.fill = Math.max(0, b.fill - decay * dt);
    }

    /* material supply */
    const spawnRate = (this.feeder ? lerp(4, 22, this.feeder.rate) * (this.feeder.starve ? 0.35 : 1) : 10)
      * (0.4 + 0.6 * this.awake);
    this._acc = (this._acc || 0) + dt * spawnRate;
    while (this._acc > 1) { this._acc--; this.spawnParticle(); }

    /* extraverted functions emit into the environment — the aperture always leaks */
    this._emAcc = (this._emAcc || 0) + dt * (1.5 + 5.5 * this.awake) * clamp(this.bays.length / this.nBays, 0.2, 1);
    while (this._emAcc > 1) { this._emAcc--; this.spawnProduct(g, 0.3); }

    if (this.bombard) {
      this._subAcc = (this._subAcc || 0) + dt;
      const interval = 2.7 - 1.5 * p.duty;
      if (this._subAcc > interval && this.subs.filter((s) => s.state === 'incoming').length < 3) {
        this._subAcc = 0;
        this.spawnSub('spec', { color: this.rng() < 0.55 ? this.COL.fn : this.COL.muted, fits: this.rng() < 0.55 });
      }
    }

    this.stepParticles(dt, g);
    this.stepSubs(dt, g);

    const spd = dt * 60;
    for (const e of this.emits) { e.age += dt; e.x += e.vx * spd; e.y += e.vy * spd; e.vx *= 0.995; }
    this.emits = this.emits.filter((e) => e.age < e.life);
    for (const d of this.debris) {
      d.age += dt; d.x += d.vx * spd; d.y += d.vy * spd; d.vy += 0.05 * spd; d.rot += d.vrot * dt;
    }
    this.debris = this.debris.filter((d) => d.age < 1.5);
    for (const b of this.badges) b.age += dt;
    this.badges = this.badges.filter((b) => b.age < 1.4);
    for (const x of this.exiting) x.age += dt;
    this.exiting = this.exiting.filter((x) => x.age < 1.8);

    /* throughput readout: a trailing sum with a 10 s half-life, so the counter
       reads a rate rather than flickering between deliveries */
    this._tp *= Math.pow(0.5, dt / 10);
    this.rate = this._tp * (60 * Math.LN2 / 10);
  }

  stepParticles(dt, g) {
    const p = this.params, spd = dt * 60;
    const f = this.feeder;
    const mag = lerp(1.2, 3.3, f ? f.speed : 0.55);
    const acc = lerp(0.03, 0.13, p.fidelity);
    const tgt = this.frontierPoint(g);
    const accept = (0.12 + 0.82 * Math.pow(clamp(p.fidelity, 0, 1), 1.6)) * this.awake * (1 - this.blocked * 0.25);
    const hit = 10 + g.bw * 0.2;
    for (const pt of this.particles) {
      pt.age += dt;
      pt.px = pt.x; pt.py = pt.y;
      if (pt.state === 'drift') {
        if (pt.branchy > 0.35 && this.rng() < pt.branchy * dt * 0.8 && this.particles.length < 240) {
          this.particles.push({ ...pt, vy: pt.vy + (this.rng() - 0.5) * 1.2, sz: pt.sz * 0.86, val: pt.val * 0.7, age: 0 });
        }
        const dxx = tgt.x - pt.x, dyy = tgt.y + pt.ty * g.th - pt.y;
        const d = Math.hypot(dxx, dyy) || 1;
        pt.vx = lerp(pt.vx, (dxx / d) * mag, acc);
        pt.vy = lerp(pt.vy, (dyy / d) * mag, acc);
        pt.x += pt.vx * spd + (this.rng() - 0.5) * p.noise * 2.6;
        pt.y += pt.vy * spd + (this.rng() - 0.5) * p.noise * 2.6;
        if (d < hit) {
          const bay = this.frontier();
          if (bay && this.rng() < accept) {
            bay.fill = Math.min(1, bay.fill + pt.val * (1 + this.surge * 0.5));
            if (bay.fill >= 1 && !bay.done) { bay.done = true; bay.snap = 1; }
            pt.state = 'placed'; pt.age = 0;
          } else {
            /* extraverted rejection: material leaves the chamber outward */
            const a = Math.atan2(pt.y, pt.x || 0.01) + (this.rng() - 0.5) * 0.6;
            pt.vx = Math.cos(a) * 2.2; pt.vy = Math.sin(a) * 2.2;
            pt.state = 'rejected'; pt.age = 0;
            if (bay) bay.flaw = clamp(bay.flaw + 0.02, 0, 1);
          }
        } else if (pt.x > g.x1 + g.bw) { pt.state = 'rejected'; pt.age = 0; }
      } else if (pt.state === 'rejected') {
        pt.x += pt.vx * spd; pt.y += pt.vy * spd;
      }
    }
    this.particles = this.particles.filter((pt) => {
      if (pt.state === 'placed') return pt.age < 0.32;
      if (pt.state === 'rejected') return pt.age < 1.3;
      return pt.age < 14;
    });
  }

  stepSubs(dt, g) {
    const p = this.params, spd = dt * 60;
    for (const sub of this.subs) {
      sub.age += dt;
      sub.rot += sub.vrot * dt;
      if (sub.shape.kind === 'blob') sub.wob += dt;
      if (sub.state === 'incoming') {
        sub.x += sub.vx * spd; sub.y += sub.vy * spd;
        const dist = Math.hypot(sub.x, sub.y);
        if (sub.kind === 'unmeasurable') {
          if (dist <= g.Rb * 0.72) {
            sub.state = 'resident'; sub.age = 0; sub.nextTry = 0.4;
            sub.vx *= 0.12; sub.vy *= 0.12;
          }
        } else if (dist <= g.Rb * 0.9) {
          /* verify against the scaffold — and misjudge more often, the deeper it sits */
          const misjudge = this.rng() < (1 - p.fidelity) * 0.45;
          const fits = sub.fits !== undefined ? sub.fits : this.rng() < 0.55;
          const accept = misjudge ? !fits : fits;
          const bay = this.frontier();
          if (accept) {
            sub.state = 'fitting'; sub.age = 0;
            sub.tx = this.frontierPoint(g).x; sub.ty = 0;
            if (bay) {
              bay.fill = Math.min(1, bay.fill + 0.34);
              if (!fits) bay.flaw = clamp(bay.flaw + 0.35, 0, 1);
            }
            this.pleasure = clamp(this.pleasure + 0.16, 0, 1);
            this.badge(sub.x, sub.y, true, 'fits');
            this.pulse(VERDICT.good);
          } else {
            sub.state = 'ejected'; sub.age = 0;
            const d = Math.max(dist, 1);
            sub.vx = sub.x / d * 2.1; sub.vy = sub.y / d * 2.1;
            if (fits && bay) bay.flaw = clamp(bay.flaw + 0.12, 0, 1);
            this.stress = clamp(this.stress + 0.09, 0, 1);
            this.badge(sub.x, sub.y, false, 'unfit');
            this.pulse(VERDICT.bad);
          }
        }
      } else if (sub.state === 'resident') {
        /* nothing to measure it by: Te tries every slot and none of them take it */
        this.blocked = 1;
        this.stress = clamp(this.stress + 0.16 * dt, 0, 1);
        sub.x += Math.cos(sub.age * 0.9) * 0.35 * spd * 0.2;
        sub.y += Math.sin(sub.age * 1.3) * 0.3 * spd * 0.2;
        sub.nextTry -= dt;
        if (sub.nextTry <= 0) {
          sub.nextTry = 1.5;
          sub.tries++;
          const i = Math.floor(this.rng() * Math.max(1, this.bays.length));
          const bx = this.bayX(i, g) + g.bw * 0.5;
          sub.vx = (bx - sub.x) * 0.06; sub.vy = (0 - sub.y) * 0.06;
          this.badge(sub.x, sub.y - 6, null, 'no metric');
        }
        sub.x += sub.vx * spd * 0.5; sub.y += sub.vy * spd * 0.5;
        sub.vx *= 0.9; sub.vy *= 0.9;
        if (sub.age > 7.5) {
          sub.state = 'ejected'; sub.age = 0;
          sub.vx = 2.4; sub.vy = (this.rng() - 0.5) * 0.6;
          this.badge(sub.x, sub.y, null, 'unprocessed');
        }
      } else if (sub.state === 'fitting') {
        const e = clamp(sub.age / 0.55, 0, 1);
        sub.x = lerp(sub.x, sub.tx, e * 0.35);
        sub.y = lerp(sub.y, sub.ty, e * 0.35);
        sub.alpha = 1 - e;
        if (sub.age > 0.55) sub.done = true;
      } else if (sub.state === 'ejected') {
        sub.x += sub.vx * spd; sub.y += sub.vy * spd;
        sub.alpha = clamp(1.3 - sub.age * 0.7, 0, 1);
        if (sub.age > 1.9) sub.done = true;
      }
    }
    this.subs = this.subs.filter((s) => !s.done);
  }

  /* ---------- rendering ---------- */
  _hexEdge(a0, a1, t, r) {
    const x0 = Math.cos(a0) * r, y0 = Math.sin(a0) * r;
    const x1 = Math.cos(a1) * r, y1 = Math.sin(a1) * r;
    return { x: lerp(x0, x1, t), y: lerp(y0, y1, t) };
  }
  /** The open ring: a hexagonal boundary with the exit aperture cut out of it. */
  hexRing(cx, cy, r, gapHalf, stroke, lw) {
    const ctx = this.ctx, SUB = 8;
    ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineCap = 'round';
    ctx.beginPath();
    let down = false;
    for (let i = 0; i < 6; i++) {
      const a0 = (i * TAU) / 6, a1 = ((i + 1) * TAU) / 6;
      for (let s = 0; s < SUB; s++) {
        const p0 = this._hexEdge(a0, a1, s / SUB, r), p1 = this._hexEdge(a0, a1, (s + 1) / SUB, r);
        const mid = Math.atan2((p0.y + p1.y) / 2, (p0.x + p1.x) / 2);
        if (Math.abs(mid) < gapHalf) { down = false; continue; }
        if (!down) { ctx.moveTo(cx + p0.x, cy + p0.y); down = true; }
        ctx.lineTo(cx + p1.x, cy + p1.y);
      }
    }
    ctx.stroke();
  }
  drawBay(b, i, g, alpha, tint) {
    const ctx = this.ctx, mem = this.bayMembers(b, i, g);
    const M = mem.length;
    const cut = b.state === 'cut';
    const col = cut ? this.COL.crit : b.flaw > 0.35 ? hexLerp(tint, this.COL.warn, Math.min(1, (b.flaw - 0.35) * 1.6)) : tint;
    for (let m = 0; m < M; m++) {
      const [x1, y1, x2, y2] = mem[m];
      const s = clamp((b.fill - m / M) / (1 / M), 0, 1);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      if (s <= 0) {
        /* the plan, drawn before the work — Te states the structure up front */
        ctx.lineTo(x2, y2);
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = hexA(tint, 0.1 * alpha);
        ctx.lineWidth = 1;
      } else {
        ctx.lineTo(lerp(x1, x2, s), lerp(y1, y2, s));
        ctx.setLineDash([]);
        ctx.strokeStyle = hexA(col, (0.2 + 0.62 * s) * alpha);
        ctx.lineWidth = 1.5;
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    if (b.snap > 0.02) {
      ctx.strokeStyle = hexA('#ffffff', b.snap * 0.55 * alpha);
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const [x1, y1, x2, y2] of mem) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
      ctx.stroke();
    }
    if (cut) {
      const xl = this.bayX(i, g);
      ctx.strokeStyle = hexA(this.COL.crit, (0.5 + 0.5 * Math.sin(this.t * 18)) * alpha);
      ctx.lineWidth = 1.4;
      ctx.strokeRect(xl, -g.th - 3, g.bw, g.th * 2 + 6);
    }
  }
  draw() {
    const { ctx, W, H } = this;
    const p = this.params, COL = this.COL, g = this.g;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dim = 0.25 + 0.75 * this.awake;
    const TINT = this.color();
    const shk = this.shake > 0 ? (this.rng() - 0.5) * this.shake * 8 : 0;
    const gcx = this.cx + (this.offX || 0) + shk;
    const gcy = this.cy + (this.offY || 0) + (this.shake > 0 ? (this.rng() - 0.5) * this.shake * 6 : 0);

    /* extraverted glow: brightest at the rim, bleeding outward past the boundary */
    const halo = ctx.createRadialGradient(gcx, gcy, g.R * 0.55, gcx, gcy, g.Rb * 1.9);
    halo.addColorStop(0, hexA(TINT, 0.03 * dim * this.opts.coreGlow));
    halo.addColorStop(0.3, hexA(TINT, 0.13 * dim * this.opts.coreGlow));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    /* the plume leaving through the aperture */
    const plume = ctx.createLinearGradient(gcx + g.Rb * 0.8, 0, gcx + g.Rb * 2.4, 0);
    plume.addColorStop(0, hexA(TINT, 0.14 * dim));
    plume.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = plume;
    ctx.beginPath();
    ctx.moveTo(gcx + g.Rb * 0.82, gcy - g.th * 0.55);
    ctx.lineTo(gcx + g.Rb * 2.4, gcy - g.th * 1.5);
    ctx.lineTo(gcx + g.Rb * 2.4, gcy + g.th * 1.5);
    ctx.lineTo(gcx + g.Rb * 0.82, gcy + g.th * 0.55);
    ctx.closePath();
    ctx.fill();

    /* the chamber: hexagonal (judging), open at the exit vertex (extraverted) */
    const rip = this.ripple ? Math.sin(this.t * 20) * 3 * this.ripple : 0;
    this.hexRing(gcx, gcy, g.Rb + rip, 0.42, hexA(TINT, (0.5 + 0.25 * this.beatFlash) * dim), 1.8);
    this.hexRing(gcx, gcy, g.Rb * 0.93 + rip, 0.46, hexA(TINT, 0.16 * dim), 1);

    ctx.save();
    ctx.translate(gcx, gcy);

    /* the lane: a directed rail with a tick per slot */
    ctx.strokeStyle = hexA(COL.axis, 0.55 * dim);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(g.x0, g.th + 9); ctx.lineTo(g.x1, g.th + 9);
    ctx.stroke();
    for (let i = 0; i <= this.nBays; i++) {
      const x = g.x0 + i * g.bw;
      const on = i <= this.bays.length;
      ctx.beginPath();
      ctx.moveTo(x, g.th + 9); ctx.lineTo(x, g.th + (on ? 15 : 12));
      ctx.strokeStyle = hexA(on ? TINT : COL.axis, (on ? 0.6 : 0.4) * dim);
      ctx.stroke();
    }

    /* structures already delivered, sliding out through the ring */
    for (const x of this.exiting) {
      const e = clamp(x.age / 1.8, 0, 1);
      const a = (1 - e) * 0.6 * dim;
      ctx.save();
      ctx.translate(e * e * g.Rb * 2.6, 0);
      const saveRows = this.rows, saveSlide = this.slideFrom;
      this.rows = x.rows; this.slideFrom = 1e9;
      const gg = { ...g, bw: x.bw, x0: x.x0, th: x.th };
      x.bays.forEach((b, i) => this.drawBay(b, i, gg, a, TINT));
      this.rows = saveRows; this.slideFrom = saveSlide;
      ctx.restore();
    }

    /* the planned bays not yet reached — the flag is always in sight */
    for (let i = this.bays.length; i < this.nBays; i++) {
      this.drawBay(this._ghost, i, g, dim * 0.9, TINT);
    }
    /* the built scaffold */
    this.bays.forEach((b, i) => this.drawBay(b, i, g, dim, TINT));

    /* the build head */
    if (this.bays.length) {
      const fx = this.bayX(this.bays.length - 1, g) + g.bw;
      const bf = this.beatFlash;
      ctx.strokeStyle = hexA(this.stallFlash > 0.05 ? COL.warn : '#ffffff', (0.2 + 0.7 * bf) * dim);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(fx, -g.th - 7 - bf * 4); ctx.lineTo(fx, g.th + 7 + bf * 4);
      ctx.stroke();
      ctx.fillStyle = hexA(TINT, (0.5 + 0.5 * bf) * dim);
      ctx.beginPath();
      ctx.moveTo(fx - 4, -g.th - 10); ctx.lineTo(fx + 4, -g.th - 10); ctx.lineTo(fx, -g.th - 4);
      ctx.closePath();
      ctx.fill();
    }

    /* the milestone flag */
    const ff = this.flagFlash;
    const flagCol = ff > 0.02 ? hexLerp(TINT, '#ffffff', ff * 0.8) : TINT;
    /* the pole is clamped into the aperture cone so the flag stands in the
       opening rather than punching through a wall */
    const top = -Math.min(g.th + 16, g.x1 * 0.44);
    ctx.strokeStyle = hexA(flagCol, (0.55 + 0.45 * ff) * dim);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(g.x1, g.th + 12); ctx.lineTo(g.x1, top);
    ctx.stroke();
    ctx.fillStyle = hexA(flagCol, (0.55 + 0.45 * ff) * dim);
    ctx.beginPath();
    ctx.moveTo(g.x1, top);
    ctx.lineTo(g.x1 + 15 + ff * 6, top + 6);
    ctx.lineTo(g.x1, top + 12);
    ctx.closePath();
    ctx.fill();

    /* inbound material — short directional trails */
    for (const pt of this.particles) {
      if (pt.state === 'placed') {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.sz + (0.32 - pt.age) * 9, 0, TAU);
        ctx.strokeStyle = hexA('#ffffff', (0.32 - pt.age) * 1.3 * dim);
        ctx.lineWidth = 1;
        ctx.stroke();
        continue;
      }
      const a = pt.state === 'rejected' ? clamp(1.1 - pt.age * 0.85, 0, 0.65) : 0.55;
      ctx.beginPath();
      ctx.moveTo(pt.px, pt.py); ctx.lineTo(pt.x, pt.y);
      ctx.strokeStyle = hexA(pt.col.startsWith('#') ? pt.col : TINT, a * dim);
      ctx.lineWidth = pt.sz;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    /* delivered product, leaving for the world */
    for (const e of this.emits) {
      const a = clamp(1 - e.age / e.life, 0, 1);
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.sz, 0, TAU);
      ctx.fillStyle = hexA(e.col, a * 0.8 * dim);
      ctx.fill();
    }

    /* cut members */
    for (const d of this.debris) {
      const a = clamp(1 - d.age / 1.5, 0, 1);
      const c = Math.cos(d.rot), s = Math.sin(d.rot);
      const ex = d.dx * c - d.dy * s, ey = d.dx * s + d.dy * c;
      ctx.beginPath();
      ctx.moveTo(d.x - ex, d.y - ey); ctx.lineTo(d.x + ex, d.y + ey);
      ctx.strokeStyle = hexA(COL.crit, a * 0.7 * dim);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    /* work orders and unmeasurable material */
    for (const sub of this.subs) {
      const a = (sub.alpha !== undefined ? sub.alpha : 1) * dim;
      ctx.save();
      ctx.translate(sub.x, sub.y);
      if (sub.shape.kind === 'blob') {
        ctx.rotate(sub.rot * 0.3);
        ctx.beginPath();
        const P = sub.shape.pts;
        for (let i = 0; i <= P.length; i++) {
          const q = P[i % P.length], q2 = P[(i + 1) % P.length];
          const r1 = q.r * (1 + Math.sin(sub.wob * q.sp + q.ph) * 0.16);
          const r2 = q2.r * (1 + Math.sin(sub.wob * q2.sp + q2.ph) * 0.16);
          const x1 = Math.cos(q.a) * r1, y1 = Math.sin(q.a) * r1;
          const x2 = Math.cos(q2.a) * r2, y2 = Math.sin(q2.a) * r2;
          if (i === 0) ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(x1, y1, (x1 + x2) / 2, (y1 + y2) / 2);
        }
        ctx.closePath();
        const bg = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
        bg.addColorStop(0, hexA(sub.color, 0.4 * a));
        bg.addColorStop(1, hexA(sub.color, 0.03 * a));
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = hexA(sub.color, 0.5 * a);
        ctx.lineWidth = 1.1;
        ctx.stroke();
      } else {
        ctx.rotate(sub.rot);
        ctx.strokeStyle = hexA(sub.color, 0.75 * a);
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (const [x1, y1, x2, y2] of sub.shape.seg) { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); }
        ctx.stroke();
      }
      ctx.restore();
    }

    /* verdicts carry an icon and a word, never colour alone */
    for (const b of this.badges) {
      const a = clamp(1.25 - b.age / 1.4, 0, 1) * dim;
      const y = b.y - b.age * 20;
      const col = b.ok === true ? VERDICT.good : b.ok === false ? VERDICT.bad : COL.muted;
      ctx.beginPath();
      ctx.arc(b.x, y, 7, 0, TAU);
      ctx.fillStyle = hexA(col, a * 0.95);
      ctx.fill();
      ctx.fillStyle = hexA('#ffffff', a);
      ctx.font = `700 9px ${HUD_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.ok === true ? '✓' : b.ok === false ? '✕' : '?', b.x, y + 0.5);
      ctx.textAlign = 'left';
      ctx.fillStyle = hexA(col, a);
      ctx.font = `600 10px ${HUD_FONT}`;
      ctx.fillText(b.label, b.x + 11, y + 0.5);
    }

    ctx.restore();

    if (this.pulseT > 0.01) {
      this.hexRing(gcx, gcy, g.Rb * 1.06, 0.42, hexA(this.pulseColor, this.pulseT * 0.8), 2.5);
    }
    if (p.noise > 0.05) {
      const n = Math.round(p.noise * 46);
      ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(gcx + (this.rng() - 0.5) * g.Rb * 2.6, gcy + (this.rng() - 0.5) * g.Rb * 2.6, 1.4, 1.4);
      }
    }
    if (this.opts.hud) this.drawHUD(TINT, dim);
  }

  /** Te keeps score in public. */
  drawHUD(TINT, dim) {
    const ctx = this.ctx, s = this.opts.hudScale;
    const x = 16, y = 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = hexA(this.COL.muted, 0.85);
    ctx.font = `600 ${9 * s}px ${HUD_FONT}`;
    ctx.fillText('THROUGHPUT', x, y);
    ctx.fillStyle = hexA(TINT, 0.35 + 0.6 * dim);
    ctx.font = `700 ${17 * s}px ${HUD_FONT}`;
    ctx.fillText(`${Math.max(0, Math.round(this.rate))} u/min`, x, y + 19 * s);
    ctx.fillStyle = hexA(this.COL.ink2, 0.6);
    ctx.font = `500 ${10 * s}px ${HUD_FONT}`;
    ctx.fillText(`delivered ${this.units}u · ${this.milestones}× · pruned ${this.pruned}`, x, y + 34 * s);
    const pw = 8 * s, gp = 3 * s;
    for (let i = 0; i < this.nBays; i++) {
      const on = i < this.bays.length;
      ctx.fillStyle = hexA(on ? TINT : this.COL.axis, on ? 0.8 : 0.5);
      ctx.fillRect(x + i * (pw + gp), y + 41 * s, pw, 3.5 * s);
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
