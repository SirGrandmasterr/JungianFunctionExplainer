/* ============================================================
   CURRENTS · NiGlyph — The Convergence Engine
   Te throws structure up in the world; Ni gathers the world
   into one point. Dozens of faint streams funnel inward through
   a closed aperture, material circulates internally instead of
   being emitted, and for a long while nothing legible happens —
   the streams thicken, the core densifies, a readout climbs.
   Then the core flares and an answer arrives whole. The
   fragments that produced it are consumed in the same instant,
   which is why the conclusion cannot show its work.

   Shape grammar (§1.3): perceiving → circular aperture/lens,
   not a hexagon with a lattice. Introverted → light condenses
   at the core with a dark rim, the boundary is a closed double
   ring with no gap, and particles orbit internally rather than
   being emitted into the environment.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexLerp } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
const HUD_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/* Convergence gained per unit of registered fragment weight. Tuned so an
   unfed dominant chamber fills in ~10 s and the hero, seeded part-way,
   reaches its first flare at ~8 s. A page about a slow function still has
   to be a page somebody watches. */
const CONV_K = 0.022;

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

export class NiGlyph {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ interactive: true, coreGlow: 1, seed: 11, hud: true, hudScale: 1, supply: 1 }, opts);
    this.COL = opts.COL || readCOL();
    this.rng = mulberry32(this.opts.seed);
    this.params = { scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 };
    this.target = { ...this.params };
    this.feeder = null;
    this.structure = { countMul: 1, k: 3, rigidity: 0.4 };
    this.streamSeed = 401;

    /* the funnel */
    this.streams = [];
    this.motes = [];      /* fragments travelling inward */
    this.orbiters = [];   /* fragments held in internal circulation */
    this.subs = [];       /* lab objects: the literal present, the contradiction */
    this.shards = [];     /* what is left of an image that could not be patched */
    this.badges = [];
    this.bombard = false;

    /* Ni's kinetic signature is a readout that climbs, not a counter that ticks */
    this.conv = 0;
    this.crystal = null;
    this.flareT = 0; this.wave = -1;
    this._flareAt = 0; this._flarePrem = false;
    this.fragments = 0; this.insights = 0; this.falseInsights = 0;
    this.revisions = 0; this.unregistered = 0;
    this._fam = 0;

    /* state */
    this.stress = 0.12; this.pleasure = 0.2;
    this.colorShift = 0;
    this.shake = 0; this.ripple = 0;
    this.pulseT = 0; this.pulseColor = '#ffffff';
    this.aim = null;
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
      canvas.addEventListener('pointerleave', () => { this.pointer.hist = []; this.pointer.x = this.pointer.y = null; });
    }
    this.buildStreams();
    this.g = this.geom();
    this.seedField();
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

  /** The chamber never starts empty: an aperture that has been open for a
      while is already holding material. This also makes the reduced-motion
      still frame legible — streams, orbit, a dense core, a readout at 88%. */
  seedField() {
    const rng = this.rng;
    this.conv = REDUCED ? 0.92 : 0.10;
    /* Transit is ~10 s end to end, so a cold funnel would spend its first ten
       seconds visibly full and functionally empty. Seed it at the population a
       running chamber actually holds (rate × transit) and the first flare
       lands where somebody is still watching. */
    const n = REDUCED ? 96 : 90;
    for (let i = 0; i < n; i++) this.spawnMote(0.02 + rng() * 0.97);
    for (let i = 0; i < (REDUCED ? 54 : 26); i++) this.addOrbiter(this.COL.fn, 0.5);
    if (REDUCED) {
      /* Animation off (§3.5): show the one state that explains the whole
         mechanism at rest — a full funnel behind a completed arc, with the
         image already crystallized at the core. The lab's events still run the
         real simulation, fast-forwarded. */
      const facets = 8;
      this.crystal = {
        facets, rot: 0.4, age: 0, evidence: 0.95, premature: false,
        r: this.baseR * this.params.scale * 0.17,
        jag: Array.from({ length: facets }, () => 0.93 + rng() * 0.14),
      };
      this.insights = 1;
    }
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
    if (changed) { this.buildStreams(); if (REDUCED) this.renderStatic(); }
  }
  setFeeder(f) {
    this.feeder = f;
    this.motes.length = 0;
    this.streamSeed += 7;
    this.buildStreams();
    if (REDUCED) this.renderStatic();
  }
  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  color() { return hexLerp(this.COL.fn, '#d0455f', this.colorShift); }

  /* ---------- the funnel ---------- */
  /**
   * Feeder cfg → intake shape.
   *   spread      — angular coverage: a few aimed channels (Te) vs. a whole
   *                 horizon arriving at once (Se)
   *   countMul    — from the maturity slider: with age, more channels
   */
  buildStreams() {
    const rng = mulberry32(this.opts.seed + this.streamSeed);
    const f = this.feeder;
    const spread = f ? f.spread : 0.95;
    const n = clamp(Math.round(lerp(9, 30, spread) * this.structure.countMul), 6, 34);
    const aim = f && f.aim !== undefined ? f.aim : -0.6;
    this.streams = [];
    for (let i = 0; i < n; i++) {
      /* one handedness for every channel: a single vortex, not a scramble */
      this.streams.push({
        a0: aim + ((i + 0.5) / n - 0.5) * TAU * clamp(spread, 0.16, 1) + (rng() - 0.5) * 0.16,
        curl: 0.62 + rng() * 0.5,
        w: 0.4 + rng() * 0.6,
        ph: rng() * TAU, sp: 0.25 + rng() * 0.45,
        charge: 0,
      });
    }
  }

  geom() {
    const R = this.baseR * this.params.scale;
    return {
      R,
      Rin: R * 0.90,
      rc: R * (0.05 + 0.075 * clamp(this.conv, 0, 1) + 0.06 * this.flareT),
      rOut: R * 1.9,
    };
  }

  /** Log-spiral funnel: the deeper a fragment gets, the faster it winds. */
  streamAngle(s, r, g) {
    return s.a0 + s.curl * Math.log(g.rOut / Math.max(r, 1));
  }
  motePos(m, g) {
    const s = this.streams[m.s] || this.streams[0];
    const r = Math.max(m.r, 1);
    const th = s ? this.streamAngle(s, r, g) + m.lat / r : m.lat / r;
    return { x: Math.cos(th) * r, y: Math.sin(th) * r };
  }
  orbR(o, g) { return g.R * o.frac * (1 - 0.30 * clamp(this.conv, 0, 1)); }

  spawnMote(prog = 0, o = {}) {
    if (!this.streams.length || this.motes.length > 240) return;
    const rng = this.rng, g = this.g || this.geom(), f = this.feeder;
    const scatter = (1 - this.params.fidelity) * g.R * 0.22 + this.params.noise * g.R * 0.10;
    this.motes.push({
      s: o.s !== undefined ? o.s % this.streams.length : Math.floor(rng() * this.streams.length),
      r: lerp(g.rOut, g.rc * 1.5, clamp(prog, 0, 1)),
      lat: (rng() - 0.5) * scatter * 2,
      w: (o.w !== undefined ? o.w : (f ? f.weight : 0.56)) * (0.6 + rng() * 0.8),
      col: o.col || (f ? f.color : this.COL.fn),
      fam: o.fam || 0,
      sure: !!o.sure,
      vr: (f ? lerp(0.10, 0.32, f.speed) : 0.17) * (0.8 + rng() * 0.45) * (o.vrMul || 1),
      px: 0, py: 0, age: 0, state: 'in',
    });
  }

  addOrbiter(col, w) {
    const rng = this.rng;
    const shell = Math.floor(rng() * clamp(this.structure.k, 2, 4));
    this.orbiters.push({
      /* orbits sit outside the core bloom, where the internal circulation is
         actually legible against it */
      frac: 0.27 + shell * 0.08 + rng() * 0.05,
      th: rng() * TAU,
      om: 0.85 + rng() * 0.55,
      ecc: 0.06 + rng() * 0.13,
      tilt: rng() * TAU,
      w: clamp(w, 0.15, 1.6), col,
      px: 0, py: 0, state: 'orbit',
    });
    if (this.orbiters.length > 130) this.orbiters.shift();
  }

  badge(x, y, ok, label) { this.badges.push({ x, y, ok, label, age: 0 }); }

  /** A fragment is taken in: it stops travelling and starts circulating. */
  register(m) {
    m.state = 'done';
    this.fragments++;
    const s = this.streams[m.s];
    if (s) s.charge = clamp(s.charge + 0.18, 0, 1.3);
    /* while an image is held, new material only slowly starts the next one */
    this.conv = clamp(this.conv + m.w * CONV_K * (this.crystal ? 0.25 : 1), 0, 1);
    this.addOrbiter(m.col, m.w);
  }

  /* ---------- convergence ---------- */
  /** Latency is the delay between the picture completing and it being
      available to say — which is why deep-stack Ni arrives late. */
  armFlare(premature) {
    if (this._flareAt) return;
    this._flareAt = this.t + Math.max(0.08, this.params.latency / 1000);
    this._flarePrem = premature;
  }
  doFlare() {
    const g = this.g, rng = this.rng;
    const prem = this._flarePrem;
    const evidence = clamp(this.conv, 0, 1);
    this.flareT = 1; this.wave = 0; this.ripple = 1;

    /* everything in orbit is taken at once. The conclusion arrives whole and
       the fragments stop existing separately — there is nothing left to show. */
    for (const o of this.orbiters) o.state = 'consumed';

    const facets = clamp(4 + this.structure.k + Math.round(evidence * 3), 5, 11);
    this.crystal = {
      facets, rot: rng() * TAU, age: 0,
      /* a forced image is not a small image — it is exactly as confident,
         and only the arc it fired at gives it away */
      r: g.R * (0.10 + 0.085 * Math.max(evidence, prem ? 0.72 : 0)),
      premature: prem, evidence,
      jag: Array.from({ length: facets }, () => (prem ? 0.68 + rng() * 0.6 : 0.93 + rng() * 0.14)),
    };
    this.insights++;
    if (prem) this.falseInsights++;
    /* the pleasure meter reads the same either way. That is the lesson. */
    this.pleasure = 1;
    this.stress = Math.max(0.04, this.stress - 0.28);
    this.conv = 0.02;
    this.pulse(this.color());
    this.badge(0, -g.R * 0.6, true, prem ? 'certain' : 'arrives whole');
  }
  /** An image is not kept forever without new material to hold it up. */
  releaseCrystal() {
    if (!this.crystal) return;
    this.crystal = null;
    this.ripple = Math.max(this.ripple, 0.4);
  }
  /** A contradiction does not get patched in. The image goes, and so does
      everything that was orbiting in support of it. */
  shatter() {
    const g = this.g, rng = this.rng, c = this.crystal;
    if (c) {
      for (let i = 0; i < c.facets * 2; i++) {
        const a = rng() * TAU, sp = 1.5 + rng() * 2.6;
        this.shards.push({
          x: Math.cos(a) * c.r * 0.6, y: Math.sin(a) * c.r * 0.6,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
          len: c.r * (0.2 + rng() * 0.42), rot: a, vrot: (rng() - 0.5) * 5,
          age: 0, bounced: 0,
        });
      }
    }
    this.crystal = null;
    this.conv = 0.02;
    this.orbiters.length = 0;
    this.stress = clamp(this.stress + 0.62, 0, 1);
    this.pleasure = 0.05;
    this.revisions++;
    this.shake = 1;
    this.pulse(VERDICT.bad);
    this.badge(0, -g.R * 0.6, false, 're-converge from zero');
  }

  /**
   * Lab & ambient events.
   *  'fragment'   — faint correlated material; individually meaningless
   *  'premature'  — force a flare on whatever is in there
   *  'contradict' — one fact the held image cannot absorb
   *  'literal'    — a Se-shaped present that passes straight through
   *  'converge'   — fill the readout (ambient/tests)
   */
  spawnSub(kind, o = {}) {
    const g = this.g, rng = this.rng;

    if (kind === 'fragment') {
      const n = o.n || 7;
      const w = o.w !== undefined ? o.w : 0.9;
      const fam = ++this._fam;
      const col = o.color || (this.feeder ? this.feeder.color : this.COL.fn);
      const base = Math.floor(rng() * Math.max(1, this.streams.length));
      /* end-to-end transit is ~10 s. A deliberately fed batch enters partway
         down the funnel so it lands inside the window the narration covers —
         the sinking-in and the orbit are still shown, just not the commute. */
      const at = o.at !== undefined ? o.at : 0.72;
      for (let i = 0; i < n; i++) {
        this.spawnMote(at, { s: base + i * 3, w, col, fam, sure: o.sure !== false, vrMul: o.vrMul || 1.6 });
      }
      return { conv: this.conv, gain: n * w * CONV_K * (this.crystal ? 0.25 : 1), held: !!this.crystal };
    }

    if (kind === 'converge') { this.conv = 1; return null; }

    if (kind === 'premature') {
      this.releaseCrystal();
      const at = this.conv;
      this.armFlare(true);
      return { conv: at };
    }

    if (kind === 'contradict') {
      if (!this.crystal) return null;
      const a = rng() * TAU;
      const sub = {
        kind, color: this.COL.crit, age: 0, done: false,
        x: Math.cos(a) * g.R * 1.7, y: Math.sin(a) * g.R * 1.7,
        rot: a, vrot: (rng() - 0.5) * 2.4,
        spikes: 5 + Math.floor(rng() * 3), size: g.R * 0.075,
      };
      const d = Math.hypot(sub.x, sub.y) || 1;
      sub.vx = -sub.x / d * 2.3; sub.vy = -sub.y / d * 2.3;
      this.subs.push(sub);
      this.stress = clamp(this.stress + 0.14, 0, 1);
      return sub;
    }

    if (kind === 'literal') {
      /* enters on a chord, not a spiral: it is not caught by the funnel and
         never turns toward the core */
      const a = rng() * TAU;
      const off = (rng() < 0.5 ? -1 : 1) * g.R * (0.26 + rng() * 0.24);
      const dirx = Math.cos(a), diry = Math.sin(a);
      const sub = {
        kind, color: o.color || this.COL.s, age: 0, done: false, marked: false,
        x: -dirx * g.R * 1.8 - diry * off, y: -diry * g.R * 1.8 + dirx * off,
        vx: dirx * 2.6, vy: diry * 2.6,
        rot: rng() * TAU, vrot: (rng() - 0.5) * 0.7, size: g.R * 0.05 + 5,
      };
      this.subs.push(sub);
      return sub;
    }
    return null;
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
    const p = this.params, tg = this.target, f = this.feeder;
    for (const k in tg) p[k] = lerp(p[k], tg[k], 1 - Math.pow(0.0015, dt));

    this.stress += (0.10 - this.stress) * (1 - Math.pow(0.80, dt));
    /* an insight's afterglow outlasts the event that caused it — and the meter
       has to stay up long enough to be compared against the forced one */
    this.pleasure += (0.18 - this.pleasure) * (1 - Math.pow(0.86, dt));
    this.colorShift = lerp(this.colorShift, clamp((this.stress - 0.38) * 1.7, 0, 1), 1 - Math.pow(0.08, dt));
    this.pulseT = Math.max(0, this.pulseT - dt * 1.3);
    this.ripple = Math.max(0, this.ripple - dt * 0.9);
    this.shake = Math.max(0, this.shake - dt * 0.8);
    this.flareT = Math.max(0, this.flareT - dt * 0.62);
    if (this.wave >= 0) { this.wave += dt * 1.35; if (this.wave > 2) this.wave = -1; }

    /* duty: heavy noise makes the flicker unpredictable rather than periodic */
    const w1 = (Math.sin(this.t * 0.55) + 1) / 2;
    const w2 = (Math.sin(this.t * 1.87 + 1.3) + 1) / 2;
    const dutyWave = lerp(w1, w1 * 0.5 + w2 * 0.5, clamp(p.noise * 1.6, 0, 1));
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.35, 0.1, 1);

    /* the aperture attends: late and imprecise the deeper it sits, and at
       shadow depths it periodically aims at the opposite of what was asked */
    const ptr = this.delayedPointer();
    let ax = 0, ay = 0;
    if (ptr && this.opts.interactive) {
      /* only the shadow register actively fights the cursor; a small `contrary`
         buys the premature-flare tendency alone */
      const contrary = (p.contrary > 0.15 && Math.sin(this.t * 0.6 + 2) > 1 - p.contrary * 0.9) ? -1 : 1;
      ax = (ptr.x - this.cx) * 0.05 * p.control * contrary;
      ay = (ptr.y - this.cy) * 0.05 * p.control * contrary;
      this.aim = Math.atan2(ay, ax);
    } else this.aim = null;
    this.offX = lerp(this.offX || 0, ax, 1 - Math.pow(0.02, dt));
    this.offY = lerp(this.offY || 0, ay, 1 - Math.pow(0.02, dt));

    this.g = this.geom();
    const g = this.g;

    /* material supply */
    const rate = (f ? lerp(3, 26, f.rate) : 9) * (0.35 + 0.65 * this.awake) * this.opts.supply;
    this._acc = (this._acc || 0) + dt * rate;
    while (this._acc > 1) { this._acc--; this.spawnMote(0); }

    /* a picture that nothing holds up leaks back down. Low-persistence
       material (Se) leaks fastest: it keeps almost forming and dissolving. */
    if (!this.crystal) {
      const leak = (f ? (1 - f.persistence) * 0.055 : 0.008) + p.noise * 0.006;
      this.conv = Math.max(0, this.conv - leak * dt);
    }
    if (f && f.starve) this.stress = clamp(this.stress + 0.09 * dt, 0, 1);

    this.stepMotes(dt, g);
    this.stepOrbiters(dt, g);
    this.stepSubs(dt, g);
    this.stepShards(dt, g);

    for (const s of this.streams) {
      s.ph += s.sp * dt * (1 + p.noise * 2);
      s.charge = Math.max(0, s.charge - dt * 0.5);
    }

    /* the flare fires when the picture completes — and, where the function is
       unreliable or sealed off from correction, sometimes when it plainly
       hasn't. Same code path as the lab's "force it" button. */
    if (this._flareAt && this.t >= this._flareAt) { this._flareAt = 0; this.doFlare(); }
    if (!this._flareAt && !this.crystal && this.conv >= 1) this.armFlare(false);
    const seal = f && f.sealed ? 0.14 : 0;
    if (!this._flareAt && !this.crystal && this.conv > 0.12 && (p.contrary > 0.01 || seal)) {
      if (this.rng() < (p.contrary * 0.13 + seal) * dt) this.armFlare(true);
    }

    if (this.crystal) {
      this.crystal.age += dt;
      this.crystal.rot += dt * 0.12 * (1 - this.structure.rigidity * 0.6);
      /* with motion off the image is the static state, so it is not timed out
         from under the reader — only a contradiction takes it */
      if (!REDUCED && this.crystal.age > (this.crystal.premature ? 8 : 5)) this.releaseCrystal();
    }

    if (this.bombard) {
      this._subAcc = (this._subAcc || 0) + dt;
      const iv = 3.4 - 1.6 * p.duty;
      if (this._subAcc > iv) {
        this._subAcc = 0;
        if (this.rng() < 0.3) this.spawnSub('literal');
        else this.spawnSub('fragment', { n: 3, w: 0.55, sure: false, at: 0, vrMul: 1 });
      }
    }

    for (const b of this.badges) b.age += dt;
    this.badges = this.badges.filter((b) => b.age < 1.5);
  }

  stepMotes(dt, g) {
    const p = this.params;
    /* misregistration rises as the function sits deeper: material arrives and
       simply isn't taken in */
    const reg = clamp(0.22 + 0.78 * Math.pow(clamp(p.fidelity, 0, 1), 1.3), 0, 1) * (0.55 + 0.45 * this.awake);
    const slow = 0.3 + 0.7 * this.awake;
    const hit = g.rc * 1.5;
    for (const m of this.motes) {
      m.age += dt;
      const q0 = this.motePos(m, g);
      m.px = q0.x; m.py = q0.y;
      if (m.state === 'lost') { m.r += m.vr * g.R * dt * 0.6; continue; }
      m.r -= m.vr * g.R * dt * slow;
      m.lat += (this.rng() - 0.5) * p.noise * g.R * 0.6 * dt;
      if (m.r <= hit) {
        if (m.sure || this.rng() < reg) this.register(m);
        else { m.state = 'lost'; m.age = 0; this.unregistered++; }
      }
    }
    this.motes = this.motes.filter((m) =>
      m.state === 'in' ? m.r > 1 && m.age < 26 : m.state === 'lost' && m.age < 1.4);
  }

  stepOrbiters(dt, g) {
    const p = this.params, f = this.feeder;
    const decay = (f ? (1 - f.persistence) * 0.30 : 0.05) + p.noise * 0.06;
    for (const o of this.orbiters) {
      const ro = this.orbR(o, g);
      const q0 = this.orbPos(o, ro);
      o.px = q0.x; o.py = q0.y;
      if (o.state === 'consumed') {
        o.frac = lerp(o.frac, 0.02, 1 - Math.pow(0.0006, dt));
        if (o.frac < 0.055) o.state = 'gone';
      } else {
        o.w -= decay * dt;
        if (o.w <= 0.05) o.state = 'gone';
      }
      o.th += o.om * (0.5 + 0.8 * p.fidelity) / Math.pow(Math.max(o.frac, 0.05), 0.9) * dt * 0.24;
    }
    this.orbiters = this.orbiters.filter((o) => o.state !== 'gone');
  }
  orbPos(o, ro) {
    const ex = Math.cos(o.th) * ro * (1 + o.ecc), ey = Math.sin(o.th) * ro * (1 - o.ecc);
    const c = Math.cos(o.tilt), s = Math.sin(o.tilt);
    return { x: ex * c - ey * s, y: ex * s + ey * c };
  }

  stepSubs(dt, g) {
    const spd = dt * 60;
    for (const sub of this.subs) {
      sub.age += dt;
      sub.rot += sub.vrot * dt;
      sub.x += sub.vx * spd; sub.y += sub.vy * spd;
      const d = Math.hypot(sub.x, sub.y);
      if (sub.kind === 'literal') {
        /* marked at closest approach — it crosses the whole chamber, and the
           core is never what it passes near */
        if (!sub.marked && d < g.R * 0.62) {
          sub.marked = true;
          this.unregistered++;
          this.badge(sub.x, sub.y - 12, null, 'passed through');
        }
        if (d > g.R * 1.75 && sub.age > 0.5) sub.done = true;
      } else if (sub.kind === 'contradict') {
        if (!sub.struck && d <= g.rc * 1.9) { sub.struck = true; this.shatter(); sub.done = true; }
        if (sub.age > 7) sub.done = true;
      }
    }
    this.subs = this.subs.filter((s) => !s.done);
  }

  /** Shards cannot leave: the boundary is closed, so they rattle around
      inside until they burn out. */
  stepShards(dt, g) {
    const spd = dt * 60;
    for (const s of this.shards) {
      s.age += dt;
      s.x += s.vx * spd; s.y += s.vy * spd; s.rot += s.vrot * dt;
      s.vx *= 0.985; s.vy *= 0.985;
      const d = Math.hypot(s.x, s.y) || 1;
      if (d > g.Rin * 0.96 && s.bounced < 3) {
        const nx = s.x / d, ny = s.y / d;
        const dot = s.vx * nx + s.vy * ny;
        if (dot > 0) {
          s.vx -= 2 * dot * nx * 0.82; s.vy -= 2 * dot * ny * 0.82;
          s.bounced++;
          this.ripple = Math.max(this.ripple, 0.45);
        }
      }
    }
    this.shards = this.shards.filter((s) => s.age < 2.8);
  }

  /* ---------- rendering ---------- */
  ring(r, stroke, lw) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(r, 1), 0, TAU);
    ctx.strokeStyle = stroke; ctx.lineWidth = lw;
    ctx.stroke();
  }

  draw() {
    const { ctx, W, H } = this;
    const p = this.params, COL = this.COL, g = this.g, f = this.feeder;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dim = 0.22 + 0.78 * this.awake;
    const TINT = this.color();
    const shk = this.shake > 0 ? (this.rng() - 0.5) * this.shake * 7 : 0;
    const gcx = this.cx + (this.offX || 0) + shk;
    const gcy = this.cy + (this.offY || 0) + (this.shake > 0 ? (this.rng() - 0.5) * this.shake * 5 : 0);

    ctx.save();
    ctx.translate(gcx, gcy);

    /* ---- the incoming streams ----
       A radial gradient does the attitude encoding for free: faint at the
       rim, brighter as it condenses inward. Nothing is painted outward. */
    const streamCol = f ? f.color : TINT;
    const sg = ctx.createRadialGradient(0, 0, g.rc * 0.6, 0, 0, g.rOut);
    sg.addColorStop(0, hexA(streamCol, 0.55 * dim));
    sg.addColorStop(0.28, hexA(streamCol, 0.30 * dim));
    sg.addColorStop(0.72, hexA(streamCol, 0.12 * dim));
    sg.addColorStop(1, hexA(streamCol, 0));
    ctx.strokeStyle = sg;
    ctx.lineCap = 'round';
    const wob = 1 - this.structure.rigidity * 0.6;
    const N = 15;
    for (const s of this.streams) {
      const bias = this.aim !== null ? 0.55 + 0.7 * Math.max(0, Math.cos(s.a0 - this.aim)) : 1;
      /* the funnel keeps running through a flare — material does not stop
         arriving because an answer landed */
      ctx.globalAlpha = clamp((0.5 + 0.32 * this.conv + 0.6 * s.charge) * bias, 0, 1);
      ctx.lineWidth = (0.5 + 1.5 * clamp(s.charge, 0, 1)) * s.w * (0.45 + 0.65 * p.fidelity) + 0.4;
      ctx.beginPath();
      for (let k = 0; k <= N; k++) {
        const r = lerp(g.rOut, g.rc * 1.1, k / N);
        const th = this.streamAngle(s, r, g) + Math.sin(s.ph + k * 0.55) * 0.022 * wob;
        const x = Math.cos(th) * r, y = Math.sin(th) * r;
        k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    /* ---- the interior ---- */
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, g.R, 0, TAU); ctx.clip();

    /* introverted gradient direction: the rim goes dark so the light reads as
       condensing at the core rather than radiating from it */
    const vg = ctx.createRadialGradient(0, 0, g.R * 0.28, 0, 0, g.R);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(3,4,11,${(0.5 * dim + 0.28).toFixed(3)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(-g.R, -g.R, g.R * 2, g.R * 2);

    /* the core, densifying with the readout */
    /* tight rather than nebular: this function converges on a point, and a
       diffuse bloom would read as Fi's mist */
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(g.rc * 3.8, 8));
    cg.addColorStop(0, hexA('#ffffff', clamp(0.3 + 0.5 * this.conv + 0.9 * this.flareT, 0, 1) * dim * this.opts.coreGlow));
    cg.addColorStop(0.24, hexA(TINT, clamp(0.34 + 0.46 * this.conv + 0.5 * this.flareT, 0, 1) * dim * this.opts.coreGlow));
    cg.addColorStop(1, hexA(TINT, 0));
    ctx.fillStyle = cg;
    ctx.fillRect(-g.R, -g.R, g.R * 2, g.R * 2);

    /* ---- internal circulation: nothing is emitted, everything orbits ---- */
    for (const o of this.orbiters) {
      const ro = this.orbR(o, g);
      const q = this.orbPos(o, ro);
      const a = (o.state === 'consumed' ? 1 : 0.34 + 0.52 * clamp(o.w, 0, 1)) * dim;
      ctx.beginPath();
      ctx.moveTo(o.px, o.py); ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = hexA(o.state === 'consumed' ? '#ffffff' : o.col, a * 0.9);
      ctx.lineWidth = 1.9;
      ctx.stroke();
    }

    /* ---- the flare: contained by the boundary, never past it ---- */
    if (this.wave >= 0) {
      if (this.wave <= 1) {
        const rw = lerp(g.rc, g.Rin, this.wave);
        this.ring(rw, hexA('#ffffff', (1 - this.wave) * 0.72 * dim), 2 + (1 - this.wave) * 3);
      } else {
        /* it does not get out — the closed ring throws it back inward */
        const rw = lerp(g.Rin, g.rc * 1.5, this.wave - 1);
        this.ring(rw, hexA(TINT, (2 - this.wave) * 0.34 * dim), 1.6);
      }
    }
    if (this.flareT > 0.02) {
      const n = 16;
      ctx.strokeStyle = hexA('#ffffff', this.flareT * this.flareT * 0.45 * dim);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + this.t * 0.1;
        ctx.moveTo(Math.cos(a) * g.rc * 1.2, Math.sin(a) * g.rc * 1.2);
        ctx.lineTo(Math.cos(a) * g.Rin * 0.95, Math.sin(a) * g.Rin * 0.95);
      }
      ctx.stroke();
    }

    /* ---- the crystallized image ---- */
    if (this.crystal) this.drawCrystal(this.crystal, TINT, dim);

    /* ---- what is left of an image that could not be patched ---- */
    for (const s of this.shards) {
      const a = clamp(1 - s.age / 2.8, 0, 1) * dim;
      const c = Math.cos(s.rot) * s.len, si = Math.sin(s.rot) * s.len;
      ctx.beginPath();
      ctx.moveTo(s.x - c, s.y - si); ctx.lineTo(s.x + c, s.y + si);
      ctx.strokeStyle = hexA(COL.crit, a * 0.8);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.restore(); /* unclip */

    /* ---- the boundary: a closed double ring, sealed, with no gap ---- */
    const rip = this.ripple ? Math.sin(this.t * 16) * 2.2 * this.ripple : 0;
    const hitRing = this.wave >= 0 ? clamp(1 - Math.abs(this.wave - 1) * 3.2, 0, 1) : 0;
    this.ring(g.R + rip, hexA(TINT, (0.42 + 0.45 * this.flareT + 0.5 * hitRing) * dim), 1.9);
    this.ring(g.Rin + rip, hexA(TINT, (0.20 + 0.30 * this.flareT) * dim), 1.1);
    /* a loop seals itself one turn further: no external correction gets in */
    if (f && f.sealed) this.ring(g.R * 0.955 + rip, hexA(TINT, 0.17 * dim), 0.9);

    /* The convergence readout, drawn on the glyph so the quiet is visibly
       progressing rather than visibly stalled. It carries a full track behind
       it: a partial arc alone, sitting near the rings, reads as a gap in the
       boundary — which is the one thing this glyph must never appear to have. */
    {
      const TICKS = 40, r0 = g.R * 0.735, r1 = g.R * 0.795;
      const lit = this.conv * TICKS;
      ctx.lineCap = 'butt';
      ctx.lineWidth = 2;
      for (let i = 0; i < TICKS; i++) {
        const on = lit > i;
        const a = -Math.PI / 2 + (i / TICKS) * TAU;
        const ca = Math.cos(a), sa = Math.sin(a);
        ctx.beginPath();
        ctx.moveTo(ca * r0, sa * r0);
        ctx.lineTo(ca * (on ? r1 : r0 + (r1 - r0) * 0.45), sa * (on ? r1 : r0 + (r1 - r0) * 0.45));
        ctx.strokeStyle = hexA(on ? TINT : COL.axis, (on ? 0.85 : 0.5) * dim);
        ctx.stroke();
      }
    }

    /* ---- fragments in transit ---- */
    ctx.lineCap = 'round';
    for (const m of this.motes) {
      const q = this.motePos(m, g);
      const inside = q.x * q.x + q.y * q.y < g.R * g.R;
      const a = m.state === 'lost'
        ? clamp(0.5 - m.age * 0.35, 0, 0.5)
        : (inside ? 0.62 : 0.26) * (0.4 + 0.6 * p.fidelity);
      ctx.beginPath();
      ctx.moveTo(m.px, m.py); ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = hexA(m.state === 'lost' ? COL.muted : m.col, a * dim);
      ctx.lineWidth = 1 + m.w * 0.9;
      ctx.stroke();
    }

    /* ---- lab objects ---- */
    for (const sub of this.subs) {
      ctx.save();
      ctx.translate(sub.x, sub.y);
      ctx.rotate(sub.rot);
      if (sub.kind === 'literal') {
        /* hard-edged, opaque, and entirely present: nothing here to converge */
        const s = sub.size;
        ctx.fillStyle = hexA(sub.color, 0.7 * dim);
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.strokeStyle = hexA(sub.color, 0.95 * dim);
        ctx.lineWidth = 1.4;
        ctx.strokeRect(-s / 2, -s / 2, s, s);
      } else {
        ctx.strokeStyle = hexA(sub.color, 0.9 * dim);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < sub.spikes; i++) {
          const a = (i / sub.spikes) * TAU;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * sub.size, Math.sin(a) * sub.size);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    /* verdicts carry an icon and a word, never colour alone */
    for (const b of this.badges) {
      const a = clamp(1.3 - b.age / 1.5, 0, 1) * dim;
      const y = b.y - b.age * 18;
      const col = b.ok === true ? VERDICT.good : b.ok === false ? VERDICT.bad : COL.muted;
      ctx.beginPath();
      ctx.arc(b.x, y, 7, 0, TAU);
      ctx.fillStyle = hexA(col, a * 0.95);
      ctx.fill();
      ctx.fillStyle = hexA('#ffffff', a);
      ctx.font = `700 9px ${HUD_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.ok === true ? '✓' : b.ok === false ? '✕' : '?', b.x, y + 0.5);
      ctx.textAlign = 'left';
      ctx.fillStyle = hexA(col, a);
      ctx.font = `600 10px ${HUD_FONT}`;
      ctx.fillText(b.label, b.x + 11, y + 0.5);
    }

    if (this.pulseT > 0.01) this.ring(g.R * 1.04, hexA(this.pulseColor, this.pulseT * 0.7), 2.4);

    ctx.restore();

    if (p.noise > 0.05) {
      const n = Math.round(p.noise * 46);
      ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(gcx + (this.rng() - 0.5) * g.R * 2.4, gcy + (this.rng() - 0.5) * g.R * 2.4, 1.4, 1.4);
      }
    }
    if (this.opts.hud) this.drawHUD(TINT, dim);
  }

  /** The image: hard-edged, faceted, and arriving at full size — it is not
      assembled in front of you, it is simply there. */
  drawCrystal(c, TINT, dim) {
    const ctx = this.ctx;
    const app = clamp(c.age / 0.22, 0, 1);
    ctx.save();
    ctx.rotate(c.rot);
    const pt = (i, k = 1) => {
      const a = (i / c.facets) * TAU;
      const r = c.r * c.jag[i % c.facets] * app * k;
      return [Math.cos(a) * r, Math.sin(a) * r];
    };
    ctx.beginPath();
    for (let i = 0; i < c.facets; i++) { const [x, y] = pt(i); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.closePath();
    const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(c.r * 1.2, 6));
    fg.addColorStop(0, hexA('#ffffff', 0.9 * dim));
    fg.addColorStop(0.55, hexA(TINT, 0.6 * dim));
    fg.addColorStop(1, hexA(TINT, 0.14 * dim));
    ctx.fillStyle = fg;
    ctx.fill();
    ctx.strokeStyle = hexA('#ffffff', 0.8 * dim);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    /* facet cuts */
    ctx.strokeStyle = hexA('#ffffff', 0.3 * dim);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i < c.facets; i++) { const [x, y] = pt(i, 0.98); ctx.moveTo(0, 0); ctx.lineTo(x, y); }
    ctx.stroke();
    /* a forced image is marked by shape, not by colour: an open dashed
       contour around a conclusion nothing was holding up */
    if (c.premature) {
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = hexA(this.COL.warn, 0.85 * dim);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= c.facets; i++) { const [x, y] = pt(i, 1.55); i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.closePath();
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  /** Te keeps score in public; Ni's equivalent readout is convergence.
      During the quiet this is the only thing that moves — so it has to. */
  drawHUD(TINT, dim) {
    const ctx = this.ctx, s = this.opts.hudScale;
    const x = 16, y = 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = hexA(this.COL.muted, 0.85);
    ctx.font = `600 ${9 * s}px ${HUD_FONT}`;
    ctx.fillText('CONVERGENCE', x, y);

    const flaring = this.flareT > 0.55;
    ctx.fillStyle = hexA(flaring ? '#ffffff' : TINT, 0.35 + 0.6 * dim);
    ctx.font = `700 ${17 * s}px ${HUD_FONT}`;
    ctx.fillText(flaring ? 'INSIGHT' : `${Math.round(this.conv * 100)}%`, x, y + 19 * s);

    ctx.fillStyle = hexA(this.COL.ink2, 0.6);
    ctx.font = `500 ${10 * s}px ${HUD_FONT}`;
    ctx.fillText(`fragments ${this.fragments} · insights ${this.insights}`, x, y + 34 * s);
    ctx.fillStyle = hexA(this.COL.muted, 0.75);
    ctx.fillText(`unregistered ${this.unregistered} · revisions ${this.revisions}`, x, y + 46 * s);

    /* the readout as cells, so the quiet is legible at a glance */
    const cw = 7 * s, gp = 2.5 * s, cells = 16;
    for (let i = 0; i < cells; i++) {
      const on = this.conv * cells > i;
      ctx.fillStyle = hexA(on ? TINT : this.COL.axis, on ? 0.85 : 0.5);
      ctx.fillRect(x + i * (cw + gp), y + 53 * s, cw, 3.5 * s);
    }
    if (this.crystal) {
      ctx.font = `600 ${9.5 * s}px ${HUD_FONT}`;
      ctx.fillStyle = hexA(this.crystal.premature ? this.COL.warn : this.COL.ink2, 0.9);
      ctx.fillText(
        this.crystal.premature
          ? `holding: forced at ${Math.round(this.crystal.evidence * 100)}%`
          : 'holding: image',
        x, y + 68 * s);
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
