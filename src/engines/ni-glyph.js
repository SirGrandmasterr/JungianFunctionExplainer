/* ============================================================
   CURRENTS · NiGlyph — The Regression Engine
   Ni as an internal data-convergence engine: noisy, multi-
   dimensional observations funnel into the aperture, the engine
   fits one high-confidence trajectory through them, and a single
   synthesized construct rides that line through time — its makeup
   at every point derived from the particle trajectories beneath
   it. Foresight is regression: filter the clutter, minimize the
   residual, extrapolate past "now."

   The cycle: GATHER (observations arrive) → FIT (a trajectory
   sweeps through them; residuals shrink; some points bind to the
   construct) → TRAVERSE (the construct rides the line from past
   to future, morphing) → RESET (the material is consumed inward
   and a new epoch begins). Hovering the chamber interrupts the
   traverse: the construct follows the cursor's x along the time
   axis, so the user scrubs the concept's development themselves.

   Shape grammar (§1.3): perceiving → circular aperture/lens.
   Introverted → closed double ring with no gap, dark rim with
   light condensing inward, and nothing emitted — even the reset
   consumes the field into the core rather than ejecting it.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexLerp } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';
import { NiState } from './ni-state.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
const HUD_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/* Auto-choreography durations (seconds). A page about a slow function
   still has to be a page somebody watches: first construct at ~5 s,
   first completed trajectory at ~12 s. */
const PH = { gather: 2.6, fit: 2.5, traverse: 7.5, reset: 1.05 };

const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const smoothstep = (a, b, t) => ss((t - a) / (b - a || 1));
/* rough gaussian in [-1, 1] — residuals should cluster, not carpet */
const gauss = (rng) => (rng() + rng() + rng()) / 1.5 - 1;

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

    /* the unified state stream — DOM telemetry and other adapters
       subscribe to this same object */
    this.state = opts.state || new NiState();

    /* the regression field */
    this.cycle = 0;
    this.points = [];        /* observations: the signal plus residuals */
    this.ambient = [];       /* unparsed sensory scatter (Se load) */
    this.squall = [];        /* barrage streaks — the flash interruption */
    this.badges = [];
    this.model = null;       /* latent trajectory for this epoch */
    this.overfitKnots = null;
    this.fitFront = 0;       /* how far the fit has swept along t */
    this.fitQ = 0;           /* residual shrink achieved so far */
    this.conf = 0.05;        /* R² equivalent → envelope width */
    this.construct = null;
    this.tcAuto = 0;         /* autonomous traverse position */
    this.tcShown = 0;        /* eased, rendered position */
    this.hoverT = null;      /* steering target; null = autonomous */
    this._hoverGrace = 0;

    this.phase = 'gather';
    this.phaseT = 0;

    /* scenario fx envelopes, eased 0..1 with expiry times */
    this.fx = { aha: 0, cassandra: 0, flash: 0, focus: 0, overfit: 0 };
    this.fxT = { aha: 0, cassandra: 0, flash: 0, focus: 0, overfit: 0 };
    this.fxUntil = { aha: 0, cassandra: 0, flash: 0, focus: 0, overfit: 0 };
    this._ahaAt = 0; this._breachSeen = false; this._breachFlash = 0;

    this.samples = 0; this.epochs = 0; this.insights = 0; this.breaches = 0;
    this.stall = 0;
    this.colorShift = 0; this.shake = 0; this.flareT = 0; this.ripple = 0;
    this.pulseT = 0; this.pulseColor = '#ffffff';
    this.pointer = { x: null, y: null, hist: [] };
    this.bombard = false;
    this.t = 0;

    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);

    if (this.opts.interactive) {
      canvas.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer.x = e.clientX - r.left;
        this.pointer.y = e.clientY - r.top;
        this.pointer.hist.push({ x: this.pointer.x, y: this.pointer.y, t: performance.now() });
        if (this.pointer.hist.length > 120) this.pointer.hist.shift();
        /* with animation off, steering is a direct scrub-and-redraw */
        if (REDUCED && this.construct) { this._steerReduced(); }
      });
      canvas.addEventListener('pointerleave', () => {
        this.pointer.hist = []; this.pointer.x = this.pointer.y = null;
      });
    }

    this.g = this.geom();
    this.newCycle(REDUCED);
    if (REDUCED) this.renderStatic();
  }

  _resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.cv.width = r.width * this.dpr;
    this.cv.height = r.height * this.dpr;
    this.W = r.width; this.H = r.height;
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.baseR = Math.min(this.W, this.H) * 0.36;
    this.g = this.geom();
    if (REDUCED) this.renderStatic();
  }

  geom() {
    const R = this.baseR * this.params.scale;
    return {
      R,
      Rin: R * 0.90,      /* the second ring of the closed double boundary */
      AX: R * 0.72,       /* time-axis half-length */
      tNow: 0.64,         /* observed past ends here; beyond is extrapolation */
      yB: 0.48,           /* critical failure boundary, in units of R */
    };
  }

  /* ---------- shared glyph API (rail & feeder modules depend on this) ---------- */
  setTarget(p) {
    Object.assign(this.target, { contrary: 0 }, p);
    if (REDUCED) { Object.assign(this.params, this.target); this.g = this.geom(); this.renderStatic(); }
  }
  setStructure(s) {
    const next = Object.assign({}, this.structure, s);
    const sig = (o) => `${o.countMul.toFixed(2)}|${o.k}|${o.rigidity.toFixed(2)}`;
    const changed = sig(next) !== sig(this.structure);
    this.structure = next;
    /* structure shapes the next epoch's field and construct; with motion
       off the reader gets the re-seeded frame immediately */
    if (changed && REDUCED) { this.newCycle(true); this.renderStatic(); }
  }
  setFeeder(f) {
    this.feeder = f;
    this.newCycle(REDUCED);
    if (REDUCED) this.renderStatic();
  }
  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  color() { return hexLerp(this.COL.fn, '#d0455f', this.colorShift); }

  /* legacy readouts other code may probe */
  get conv() { return this.conf; }
  get stress() { return this.state.v.stress; }
  set stress(v) { this.state.v.stress = this.state.tv.stress = clamp(v, 0, 1); }
  get pleasure() { return this.state.v.pleasure; }
  set pleasure(v) { this.state.v.pleasure = this.state.tv.pleasure = clamp(v, 0, 1); }

  /* ---------- the epoch ---------- */
  _newModel() {
    const rng = mulberry32(this.opts.seed * 7919 + this.cycle * 131 + 17);
    return {
      a1: 0.15 + rng() * 0.13, w1: 2.6 + rng() * 2.2, p1: rng() * TAU,
      a2: 0.045 + rng() * 0.05, w2: 6.0 + rng() * 4.0, p2: rng() * TAU,
      slope: (rng() - 0.5) * 0.44, bias: (rng() - 0.5) * 0.10,
    };
  }

  /** The latent trajectory, in units of R. The Cassandra pull drags the
      future segment down through the failure boundary — the fit stays
      razor-sharp while it does, which is the whole tragedy. */
  latentN(t) {
    const m = this.model;
    let y = m.a1 * Math.sin(m.w1 * t + m.p1)
          + m.a2 * Math.sin(m.w2 * t + m.p2)
          + m.slope * (t - 0.45) + m.bias;
    y = clamp(y, -0.42, 0.42);
    if (this.fx.cassandra > 0.005) {
      y = lerp(y, 0.62, this.fx.cassandra * Math.pow(smoothstep(this.g.tNow - 0.04, 1.02, t), 1.6));
    }
    return y;
  }

  /** What the engine currently believes: latent + unconverged wobble,
      blended toward the overfit wiggle or shattered by the flash. */
  dispN(t) {
    let y = this.latentN(t);
    y += (1 - this.fitQ) * 0.05 * Math.sin(t * 12.5 + this.t * 2.3);
    if (this.fx.overfit > 0.005 && this.overfitKnots) {
      y = lerp(y, this._overfitN(t), this.fx.overfit);
    }
    if (this.fx.flash > 0.005) {
      y += this.fx.flash * 0.075 * Math.sin(t * 82 + this.t * 34) * (0.35 + 0.65 * Math.sin(t * 17.7 + this.t * 21));
    }
    return clamp(y, -0.7, 0.75);
  }

  axisX(t) { return lerp(-this.g.AX, this.g.AX, t); }

  _spawnField(warm) {
    const rng = this.rng, f = this.feeder, g = this.g;
    const supply = clamp((f ? f.rate : 0.5) * this.opts.supply * 1.4, 0.1, 1.2);
    const n = Math.round(lerp(30, 62, clamp(supply, 0, 1)) * this.structure.countMul);
    const fid = this.params.fidelity;
    const spreadVar = f ? f.spread : 0.55;
    const devScale = 0.05 + 0.15 * spreadVar + 0.10 * (1 - fid);
    const regProb = 0.25 + 0.75 * Math.pow(clamp(fid, 0, 1), 1.2);
    const base = f ? f.color : this.COL.fn;
    /* one concept, many dimensions: observations arrive in a small family
       of hues around the accent, not a single flat color */
    const dims = [base, hexLerp(base, '#ffffff', 0.30), hexLerp(base, this.COL.n, 0.5), hexLerp(base, '#4fc9e0', 0.28)];
    const aim = f && f.aim !== undefined ? f.aim : null;

    for (let i = 0; i < n; i++) {
      const r1 = rng();
      const ang = aim !== null
        ? aim + (rng() - 0.5) * TAU * clamp(spreadVar, 0.18, 1) * 0.5
        : rng() * TAU;
      this.points.push({
        t: 0.03 + Math.pow(rng(), 0.9) * (g.tNow - 0.06),
        dev: clamp(gauss(rng) * devScale, -0.34, 0.34),
        depth: 0.3 + rng() * 0.7,
        w: (f ? f.weight : 0.7) * (0.7 + rng() * 0.6),
        col: dims[r1 < 0.55 ? 0 : r1 < 0.75 ? 1 : r1 < 0.9 ? 2 : 3],
        stray: rng() > regProb,     /* misregistered — never joins the fit */
        wild: false,
        arriveAng: ang,
        arriveDelay: warm ? 0 : rng() * 1.7,
        arriveDur: 0.5 + rng() * 0.55,
        arriveP: warm ? 1 : 0,
        bow: (rng() < 0.5 ? -1 : 1) * (0.4 + rng() * 0.6),
        snap: warm ? 1 : 0, snapping: warm,
        linked: false, spark: 0, tw: rng() * TAU,
      });
    }
    this.samples += n;
  }

  _linkDrivers() {
    /* a handful of registered observations bind to the construct — the
       named sources its makeup is read from */
    const K = this.construct ? this.construct.K : 6;
    const cands = this.points.filter((p) => !p.stray).sort((a, b) => a.t - b.t);
    const want = Math.min(K * 2 + 2, cands.length);
    for (let i = 0; i < want; i++) {
      cands[Math.floor((i + 0.5) / want * cands.length)].linked = true;
    }
  }

  buildConstruct() {
    const rng = mulberry32(this.opts.seed * 31 + this.cycle * 977 + 7);
    const K = clamp(this.structure.k + 3, 5, 8);
    this.construct = {
      K,
      rot0: rng() * TAU,
      spin: 0.7 + rng() * 0.5,
      wob: 1 - this.structure.rigidity * 0.75,
      born: this.t, flash: 0,
      spokes: Array.from({ length: K }, () => ({
        om: 3 + rng() * 6, ph: rng() * TAU,        /* morph frequency over t */
        om2: 2 + rng() * 3, ph2: rng() * TAU,      /* angular wobble */
        amp: 0.45 + rng() * 0.55,
      })),
    };
    this._linkDrivers();
  }

  newCycle(warm = false) {
    this.cycle++;
    this.epochs = this.cycle;
    this.model = this._newModel();
    this.points = [];
    this.construct = null;
    this.overfitKnots = null;
    this.fitFront = warm ? 1 : 0;
    this.fitQ = warm ? 0.55 + 0.45 * this.params.fidelity : 0.04;
    this.tcAuto = this.tcShown = warm ? 0.52 : 0;
    this._breachSeen = false;
    this._spawnField(warm);
    if (warm) { this.buildConstruct(); }
    this.phase = warm ? 'traverse' : 'gather';
    this.phaseT = warm ? PH.traverse * 0.5 : 0;
  }

  badge(x, y, ok, label) { this.badges.push({ x, y, ok, label, age: 0 }); }

  /* ---------- scenario triggers (Zone D) ---------- */
  /**
   * @param {string} key    aha | cassandra | flash | focus | overfit
   * @param {Object} impact additive state deltas, e.g. { stress:-0.5, pleasure:+0.9 }
   */
  scenario(key, impact = {}) {
    this.state.impulse(impact);
    const arm = (k, dur, amt = 1) => { this.fxT[k] = amt; this.fxUntil[k] = this.t + dur; };

    if (key === 'aha') {
      arm('aha', 4.2);
      /* synthesis resolves whatever chaos was in progress */
      this.fxT.overfit = 0; this.fxT.flash = 0; this.stall = 0;
      this._injectWild(24);
      this._ahaAt = this.t + 1.25;
      if (this.phase === 'gather') { this.phase = 'fit'; this.phaseT = this.fitFront * PH.fit; }
    } else if (key === 'cassandra') {
      arm('cassandra', 12);
      this._rushFit();
      this.tcAuto = Math.max(this.tcAuto, 0.35);
      this._breachSeen = false;
    } else if (key === 'flash') {
      arm('flash', 5.2);
      this._spawnSquall(84);
      this.stall = 1;
      this.shake = Math.max(this.shake, 0.55);
      this.fitQ = Math.min(this.fitQ, 0.42);   /* convergence knocked back */
    } else if (key === 'focus') {
      arm('focus', 13);
      this.fxT.flash = 0; this.stall = 0;
      if (this.phase === 'gather') this._rushFit();
    } else if (key === 'overfit') {
      arm('overfit', 11);
      this._rushFit();
      this._buildOverfitKnots();
      this.badge(0, -this.g.R * 0.6, false, 'generality lost');
    }
  }

  /** Disparate outlier observations — volatile, off-trend, multi-hued */
  _injectWild(n) {
    const rng = this.rng, g = this.g;
    const hues = [this.COL.fn, this.COL.s, '#4fc9e0', this.COL.f, hexLerp(this.COL.fn, '#ffffff', 0.5)];
    for (let i = 0; i < n; i++) {
      this.points.push({
        t: 0.04 + rng() * (g.tNow - 0.07),
        dev: (rng() < 0.5 ? -1 : 1) * (0.22 + rng() * 0.34),
        depth: 0.45 + rng() * 0.55,
        w: 0.9 + rng() * 0.5,
        col: hues[Math.floor(rng() * hues.length)],
        stray: false, wild: true, hold: true,
        arriveAng: rng() * TAU,
        arriveDelay: rng() * 0.5,
        arriveDur: 0.35 + rng() * 0.3,
        arriveP: 0, bow: (rng() < 0.5 ? -1 : 1),
        snap: 0, snapping: false, snapFast: false,
        linked: false, spark: 0, tw: rng() * TAU,
      });
    }
    this.samples += n;
  }

  /** The read is already finished — jump the cycle to a converged state */
  _rushFit() {
    if (this.phase === 'gather' || this.phase === 'fit') {
      this.phase = 'traverse'; this.phaseT = 0;
      this.fitFront = 1;
      for (const p of this.points) {
        if (p.hold) continue;   /* volatile injections wait for their synthesis */
        p.arriveP = 1; p.snapping = true;
        if (p.snap < 0.5) p.snap = 0.5;
      }
      if (!this.construct) this.buildConstruct();
    }
    this.fitQ = Math.max(this.fitQ, 0.6);
  }

  /** The moment the disparate cloud becomes one paradigm */
  _doAha() {
    this._rushFit();
    for (const p of this.points) { p.hold = false; p.snapping = true; p.snapFast = true; }
    this.fitQ = Math.max(this.fitQ, 0.9);
    this.flareT = 1; this.ripple = 1;
    this.insights++;
    this.pulse(this.color());
    this.badge(0, -this.g.R * 0.6, true, 'paradigm');
  }

  _buildOverfitKnots() {
    const knots = this.points
      .filter((p) => !p.stray && p.arriveP > 0.5)
      .map((p) => ({ t: p.t, y: this.latentN(p.t) + p.dev * 0.85 }))
      .sort((a, b) => a.t - b.t);
    /* thin them just enough that the wiggle stays drawable */
    const out = [];
    for (const k of knots) {
      if (!out.length || k.t - out[out.length - 1].t > 0.018) out.push(k);
    }
    if (out.length < 6) {
      const rng = this.rng;
      for (let i = out.length; i < 6; i++) out.push({ t: 0.05 + rng() * 0.55, y: (rng() - 0.5) * 0.5 });
      out.sort((a, b) => a.t - b.t);
    }
    this.overfitKnots = out;
  }

  /** Cosine interpolation *through every local noise point*, then a
      blow-up past the data — the polynomial that memorized the residuals
      has nothing to say about the future */
  _overfitN(t) {
    const k = this.overfitKnots;
    const last = k[k.length - 1];
    if (t >= last.t) {
      const d = t - last.t;
      return clamp(last.y + Math.sin(d * 26 + this.cycle) * d * 2.4, -0.7, 0.75);
    }
    if (t <= k[0].t) return k[0].y;
    let i = 0;
    while (i < k.length - 2 && k[i + 1].t < t) i++;
    const u = (t - k[i].t) / (k[i + 1].t - k[i].t || 1);
    return lerp(k[i].y, k[i + 1].y, 0.5 - 0.5 * Math.cos(Math.PI * u));
  }

  _spawnSquall(n) {
    const rng = this.rng;
    for (let i = 0; i < n; i++) {
      const side = rng();
      const sp = 6 + rng() * 9;
      let x, y, vx, vy;
      if (side < 0.5) {
        x = rng() < 0.5 ? -20 : this.W + 20; y = rng() * this.H;
        vx = (x < 0 ? 1 : -1) * sp; vy = (rng() - 0.5) * sp * 0.5;
      } else {
        x = rng() * this.W; y = rng() < 0.5 ? -20 : this.H + 20;
        vy = (y < 0 ? 1 : -1) * sp; vx = (rng() - 0.5) * sp * 0.5;
      }
      this.squall.push({
        x, y, vx, vy,
        len: 7 + rng() * 13,
        delay: rng() * 1.1, life: 1.4 + rng() * 0.8,
        col: rng() < 0.6 ? this.COL.s : '#ffffff',
      });
    }
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

  _steerReduced() {
    const g = this.g;
    const tx = clamp((this.pointer.x - (this.cx - g.AX)) / (2 * g.AX), 0, 1);
    this.tcAuto = this.tcShown = tx;
    this.draw();
  }

  /* ---------- simulation ---------- */
  step(dt) {
    this.t += dt;
    const p = this.params, tg = this.target, f = this.feeder, g = this.g = this.geom();
    for (const k in tg) p[k] = lerp(p[k], tg[k], 1 - Math.pow(0.0015, dt));

    this.state.step(dt);

    /* fx envelopes ease in fast, decay on expiry */
    for (const k in this.fx) {
      if (this.fxUntil[k] && this.t >= this.fxUntil[k]) { this.fxT[k] = 0; this.fxUntil[k] = 0; }
      this.fx[k] += (this.fxT[k] - this.fx[k]) * (1 - Math.exp(-dt * (this.fxT[k] > this.fx[k] ? 5 : 1.4)));
      this.state.flags[k] = this.fx[k] > 0.22;
    }
    if (this._ahaAt && this.t >= this._ahaAt) { this._ahaAt = 0; this._doAha(); }

    this.colorShift = lerp(this.colorShift, clamp((this.stress - 0.38) * 1.6 + this.fx.cassandra * 0.35, 0, 1), 1 - Math.pow(0.08, dt));
    this.pulseT = Math.max(0, this.pulseT - dt * 1.3);
    this.ripple = Math.max(0, this.ripple - dt * 0.9);
    this.shake = Math.max(0, this.shake - dt * 0.8);
    this.flareT = Math.max(0, this.flareT - dt * 0.62);
    this._breachFlash = Math.max(0, this._breachFlash - dt * 0.5);
    this.stall = this.fx.flash > 0.25 ? this.stall : Math.max(0, this.stall - dt * 1.5);

    /* duty: heavy noise makes the flicker unpredictable rather than periodic */
    const w1 = (Math.sin(this.t * 0.55) + 1) / 2;
    const w2 = (Math.sin(this.t * 1.87 + 1.3) + 1) / 2;
    const dutyWave = lerp(w1, w1 * 0.5 + w2 * 0.5, clamp(p.noise * 1.6, 0, 1));
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.35, 0.1, 1);

    /* ---- sensory load ---- */
    const noiseLvl = clamp(
      p.noise * 0.9 + this.state.v.noise * 0.55 + this.fx.flash * 0.85 +
      (f && f.starve ? 0.35 : 0) - this.fx.focus * 0.55, 0, 1);
    this.noiseLvl = noiseLvl;
    this._stepAmbient(dt, noiseLvl);
    this._stepSquall(dt);
    if (f && f.starve) this.state.impulse({ stress: 0.05 * dt });

    /* ---- steering ---- */
    const ptr = this.delayedPointer();
    let hovering = false;
    if (ptr && this.opts.interactive && this.construct && this.phase === 'traverse') {
      const dxp = this.pointer.x - this.cx, dyp = this.pointer.y - this.cy;
      if (Math.abs(dxp) < g.AX * 1.2 && Math.abs(dyp) < g.R * 1.05) {
        hovering = true;
        this._hoverGrace = 0.5;
        let tx = clamp((ptr.x - (this.cx - g.AX)) / (2 * g.AX), 0, 1.02);
        /* shadow registers fight the hand on the tiller */
        if (p.contrary > 0.12 && Math.sin(this.t * 0.55 + 2) > 1 - p.contrary * 0.85) tx = 1 - tx;
        this.hoverT = tx;
        this.steered = true;
      }
    }
    if (!hovering) {
      this._hoverGrace -= dt;
      if (this._hoverGrace <= 0 && this.hoverT !== null) {
        this.tcAuto = clamp(this.tcShown, 0, 1);   /* resume from where the user left it */
        this.hoverT = null;
      }
    }

    /* ---- phase machine ---- */
    const prog = dt * (0.4 + 0.6 * this.awake);
    const fitDur = PH.fit * (1 + p.latency / 1400);
    if (this.phase === 'gather') {
      this.phaseT += prog;
      if (this.phaseT >= PH.gather) { this.phase = 'fit'; this.phaseT = 0; }
    } else if (this.phase === 'fit') {
      this.phaseT += prog;
      this.fitFront = ss(clamp(this.phaseT / fitDur, 0, 1));
      if (!this.construct && this.fitFront > 0.05) this.buildConstruct();
      if (this.phaseT >= fitDur) { this.phase = 'traverse'; this.phaseT = 0; this.tcAuto = 0; }
    } else if (this.phase === 'traverse') {
      this.fitFront = 1;
      const traverseDur = PH.traverse * (1 + 0.45 * this.fx.focus);
      const frozen = this.hoverT !== null || this.fx.flash > 0.35;
      /* with animation off the construct stays where it was scrubbed —
         the still frame is the state, not a paused film */
      if (!frozen && !REDUCED) {
        let dir = 1;
        if (p.contrary > 0.12 && Math.sin(this.t * 0.43 + 4.1) > 1 - p.contrary * 0.7) dir = -0.6;
        this.tcAuto = clamp(this.tcAuto + (prog / traverseDur) * dir, 0, 1.001);
        if (this.tcAuto >= 1) {
          if (this.fx.cassandra > 0.3) {
            this.tcAuto = 1;   /* parked at the end it predicted */
          } else {
            this._completeCycle();
          }
        }
      }
    } else if (this.phase === 'reset') {
      this.phaseT += dt;
      if (this.phaseT >= PH.reset) this.newCycle(REDUCED);
    }

    /* points: arrival, snapping, sparks */
    const frontT = this.fitFront;
    for (const pt of this.points) {
      if (pt.arriveP < 1) {
        if (pt.arriveDelay > 0) { pt.arriveDelay -= prog; continue; }
        pt.arriveP = clamp(pt.arriveP + prog / pt.arriveDur, 0, 1);
      }
      if (!pt.snapping && !pt.hold && this.phase !== 'gather' && pt.t <= frontT) {
        pt.snapping = true;
      }
      if (pt.snapping && pt.snap < 1) {
        pt.snap = clamp(pt.snap + dt * (pt.snapFast ? 5.5 : 2.6), 0, 1);
      }
      pt.spark = Math.max(0, pt.spark - dt * 2.2);
      if (this.construct && this.phase === 'traverse' && pt.linked && pt.spark === 0 &&
          Math.abs(pt.t - this.tcShown) < 0.022) {
        pt.spark = 1;
        this.construct.flash = 1;
      }
    }
    if (this.construct) this.construct.flash = Math.max(0, this.construct.flash - dt * 2.4);

    /* fit quality climbs toward what fidelity and the feeder can hold up;
       low-persistence material (Se) keeps leaking back out of the picture */
    const fitQMax = (0.55 + 0.45 * p.fidelity) * (f ? 0.4 + 0.6 * clamp(f.weight, 0.1, 1.05) : 1);
    if (this.phase === 'fit') {
      this.fitQ = Math.max(this.fitQ, this.fitFront * fitQMax * 0.9);
    } else if (this.phase === 'traverse') {
      this.fitQ += (fitQMax - this.fitQ) * (1 - Math.pow(0.4, dt));
      if (f && f.persistence < 0.6) this.fitQ = Math.max(0.18, this.fitQ - (1 - f.persistence) * 0.14 * dt);
    }

    /* ---- confidence (R²) → envelope width, and loss ---- */
    let confRaw = this.fitQ * (0.30 + 0.70 * p.fidelity) * (1 - 0.28 * noiseLvl);
    if (f && f.sealed) confRaw = Math.max(confRaw, 0.88);           /* the loop's unearned tightness */
    confRaw = Math.max(confRaw, this.fx.cassandra * 0.93);          /* the doom is precise */
    confRaw = Math.max(confRaw, this.fx.aha * 0.97);
    confRaw = Math.max(confRaw, this.fx.overfit * 0.94);            /* R² on the noise itself */
    confRaw *= (1 - 0.55 * this.fx.flash);
    confRaw = clamp(confRaw + 0.06 * this.fx.focus, 0.02, 0.99);
    this.conf += (confRaw - this.conf) * (1 - Math.exp(-dt * 3));

    const loss = clamp(
      (1 - this.conf) * 0.8 + noiseLvl * 0.15 + this.fx.flash * 0.25 + this.fx.overfit * 0.22,
      0.01, 1);
    this.state.publish({ confidence: this.conf, loss });

    /* breach: the moment the trajectory's owner arrives at the failure
       it predicted — the forecast was ignored, and now it is due */
    if (this.fx.cassandra > 0.3 && !this._breachSeen) {
      const tX = this._breachT();
      if (tX !== null && this.tcShown >= tX - 0.01) {
        this._breachSeen = true;
        this._breachFlash = 1;
        this.breaches++;
        this.shake = Math.max(this.shake, 0.7);
        this.pulse(VERDICT.bad);
        this.badge(this.axisX(tX), this.latentN(tX) * g.R - 26, false, 'predicted · ignored');
        this.state.impulse({ stress: 0.06, pleasure: 0.04 });
      }
    }

    /* eased traverse position */
    const tcTarget = this.hoverT !== null ? this.hoverT : this.tcAuto;
    const track = lerp(2.0, 9.0, clamp(p.control, 0, 1));
    if (!(this.fx.flash > 0.35)) {
      this.tcShown += (tcTarget - this.tcShown) * (1 - Math.exp(-dt * track));
    }

    /* rail bombardment: squalls of the present tense, and — in the shadow
       registers — spontaneous dark certainties */
    if (this.bombard) {
      this._subAcc = (this._subAcc || 0) + dt;
      const iv = 3.4 - 1.6 * p.duty;
      if (this._subAcc > iv) {
        this._subAcc = 0;
        if (this.rng() < 0.55) this._spawnSquall(10);
        else this._injectWild(3);
        if (p.contrary > 0.2 && this.rng() < p.contrary) {
          this.fxT.cassandra = 0.55; this.fxUntil.cassandra = this.t + 1.8;
        }
      }
    }

    for (const b of this.badges) b.age += dt;
    this.badges = this.badges.filter((b) => b.age < 1.6);
  }

  _completeCycle() {
    /* the trajectory resolves: a contained flare, and the material that
       produced it is consumed — nothing is emitted */
    this.flareT = 1; this.ripple = 0.8;
    this.insights++;
    this.pulse(this.color());
    this.state.impulse({ pleasure: 0.16, stress: -0.05 });
    this.phase = 'reset';
    this.phaseT = 0;
  }

  _breachT() {
    if (this._breachCacheT === (this.t | 0) && this._breachCache !== undefined) return this._breachCache;
    let found = null;
    for (let t = this.g.tNow; t <= 1.02; t += 0.02) {
      if (this.latentN(t) >= this.g.yB) { found = t; break; }
    }
    this._breachCache = found; this._breachCacheT = this.t | 0;
    return found;
  }

  _stepAmbient(dt, noiseLvl) {
    const rng = this.rng;
    const want = Math.round(lerp(3, 46, noiseLvl));
    let alive = 0;
    for (const a of this.ambient) if (!a.dying) alive++;
    if (alive < want && this.ambient.length < 70) {
      for (let i = 0; i < Math.min(4, want - alive); i++) {
        this.ambient.push({
          rf: 0.12 + Math.sqrt(rng()) * 0.8, th: rng() * TAU,
          drift: (rng() - 0.5) * 0.5, tw: rng() * TAU, a: 0, dying: false,
        });
      }
    } else if (alive > want) {
      let excess = alive - want;
      for (const a of this.ambient) { if (excess <= 0) break; if (!a.dying) { a.dying = true; excess--; } }
    }
    for (const a of this.ambient) {
      a.th += a.drift * dt;
      a.a = clamp(a.a + (a.dying ? -dt * 1.4 : dt * 1.2), 0, 1);
    }
    this.ambient = this.ambient.filter((a) => !(a.dying && a.a <= 0));
  }

  _stepSquall(dt) {
    for (const s of this.squall) {
      if (s.delay > 0) { s.delay -= dt; continue; }
      s.x += s.vx * dt * 60; s.y += s.vy * dt * 60;
      s.life -= dt;
    }
    this.squall = this.squall.filter((s) =>
      s.life > 0 && s.x > -60 && s.x < this.W + 60 && s.y > -60 && s.y < this.H + 60);
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
    const p = this.params, COL = this.COL, g = this.g;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dim = 0.22 + 0.78 * this.awake;
    const TINT = this.color();
    const resetK = this.phase === 'reset' ? ss(this.phaseT / PH.reset) : 0;
    const fade = 1 - resetK;
    const shk = this.shake > 0 ? (this.rng() - 0.5) * this.shake * 7 : 0;
    const gcx = this.cx + shk;
    const gcy = this.cy + (this.shake > 0 ? (this.rng() - 0.5) * this.shake * 5 : 0);

    ctx.save();
    ctx.translate(gcx, gcy);

    /* ---- interior ---- */
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, g.R, 0, TAU); ctx.clip();

    /* introverted gradient: dark rim, light condensing inward */
    const vg = ctx.createRadialGradient(0, 0, g.R * 0.3, 0, 0, g.R);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(3,4,11,${(0.5 * dim + 0.28).toFixed(3)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(-g.R, -g.R, g.R * 2, g.R * 2);

    /* a faint core condensation that tracks confidence */
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.R * 0.5);
    cg.addColorStop(0, hexA(TINT, (0.06 + 0.10 * this.conf + 0.4 * this.flareT) * dim * this.opts.coreGlow));
    cg.addColorStop(1, hexA(TINT, 0));
    ctx.fillStyle = cg;
    ctx.fillRect(-g.R, -g.R, g.R * 2, g.R * 2);

    this._drawAxis(g, dim, fade);
    this._drawAmbient(g, dim, fade);
    if (this.fx.cassandra > 0.01) this._drawBoundary(g, dim);
    this._drawEnvelope(g, TINT, dim, fade);
    this._drawLine(g, TINT, dim, fade);
    this._drawPoints(g, dim, fade, resetK);
    if (this.construct) this._drawConstructAll(g, TINT, dim, fade);

    /* the contained flare: it reaches the boundary and is thrown back */
    if (this.flareT > 0.02) {
      const fr = lerp(g.R * 0.2, g.Rin, 1 - this.flareT);
      this.ring(fr, hexA('#ffffff', this.flareT * 0.5 * dim), 1.6 + this.flareT * 2);
    }

    ctx.restore(); /* unclip */

    /* ---- the boundary: closed double ring, sealed, no gap ---- */
    const rip = this.ripple ? Math.sin(this.t * 16) * 2.2 * this.ripple : 0;
    this.ring(g.R + rip, hexA(TINT, (0.42 + 0.45 * this.flareT + 0.3 * this._breachFlash) * dim), 1.9);
    this.ring(g.Rin + rip, hexA(TINT, (0.20 + 0.30 * this.flareT) * dim), 1.1);
    if (this.feeder && this.feeder.sealed) this.ring(g.R * 0.955 + rip, hexA(TINT, 0.17 * dim), 0.9);

    if (this.pulseT > 0.01) this.ring(g.R * 1.04, hexA(this.pulseColor, this.pulseT * 0.7), 2.4);

    /* verdicts carry an icon and a word, never colour alone */
    for (const b of this.badges) {
      const a = clamp(1.3 - b.age / 1.6, 0, 1) * dim;
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

    ctx.restore(); /* untranslate */

    /* ---- the barrage does not respect the chamber ---- */
    if (this.squall.length) {
      ctx.lineCap = 'round';
      for (const s of this.squall) {
        if (s.delay > 0) continue;
        const a = clamp(s.life, 0, 1) * 0.75;
        const d = Math.hypot(s.vx, s.vy) || 1;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx / d * s.len, s.y - s.vy / d * s.len);
        ctx.strokeStyle = hexA(s.col, a);
        ctx.lineWidth = 1.3;
        ctx.stroke();
      }
    }

    /* ambient viewport shifts: alert-state hue for the ignored forecast,
       a settled darkening for deep focus */
    if (this.fx.cassandra > 0.01) {
      const ag = ctx.createRadialGradient(this.cx, this.cy, Math.min(W, H) * 0.28, this.cx, this.cy, Math.max(W, H) * 0.72);
      ag.addColorStop(0, 'rgba(0,0,0,0)');
      ag.addColorStop(1, hexA(COL.crit, 0.13 * this.fx.cassandra * (0.8 + 0.2 * Math.sin(this.t * 2.6))));
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.fx.focus > 0.01) {
      const fg = ctx.createRadialGradient(this.cx, this.cy, Math.min(W, H) * 0.3, this.cx, this.cy, Math.max(W, H) * 0.75);
      fg.addColorStop(0, 'rgba(0,0,0,0)');
      fg.addColorStop(1, `rgba(2,3,9,${(0.28 * this.fx.focus).toFixed(3)})`);
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }

    if (p.noise > 0.05) {
      const n = Math.round(p.noise * 46);
      ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(gcx + (this.rng() - 0.5) * g.R * 2.4, gcy + (this.rng() - 0.5) * g.R * 2.4, 1.4, 1.4);
      }
    }

    if (this.stall > 0.03 && this.opts.hud) this._drawStall(dim);
    if (this.opts.hud) this.drawHUD(TINT, dim);
  }

  _drawAxis(g, dim, fade) {
    const ctx = this.ctx, COL = this.COL;
    const y = 0, a = 0.5 * dim * fade;
    ctx.lineCap = 'butt';
    /* observed past: solid; extrapolated future: dashed */
    ctx.beginPath();
    ctx.moveTo(-g.AX, y); ctx.lineTo(this.axisX(g.tNow), y);
    ctx.strokeStyle = hexA(COL.axis, a); ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(this.axisX(g.tNow), y); ctx.lineTo(g.AX * 1.28, y);
    ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i <= 4; i++) {
      const x = this.axisX(i / 4);
      ctx.beginPath();
      ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3);
      ctx.stroke();
    }
    /* the present moment — everything right of this line is foresight */
    const nx = this.axisX(g.tNow);
    ctx.beginPath();
    ctx.moveTo(nx, -g.R * 0.5); ctx.lineTo(nx, g.R * 0.5);
    ctx.strokeStyle = hexA(COL.axis, a * 0.55); ctx.lineWidth = 1;
    ctx.setLineDash([2, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = hexA(COL.muted, 0.75 * dim * fade);
    ctx.font = `600 8px ${HUD_FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('now', nx, -g.R * 0.5 - 5);
    ctx.fillText('t →', g.AX * 1.05, 14);
    ctx.textAlign = 'left';
  }

  _drawAmbient(g, dim, fade) {
    const ctx = this.ctx;
    const mul = (1 - 0.92 * this.fx.focus) * dim * fade;
    if (mul <= 0.01) return;
    for (const a of this.ambient) {
      const r = a.rf * g.R;
      const tw = 0.12 + 0.16 * (0.5 + 0.5 * Math.sin(this.t * 2.1 + a.tw));
      ctx.beginPath();
      ctx.arc(Math.cos(a.th) * r, Math.sin(a.th) * r, 1.1, 0, TAU);
      ctx.fillStyle = hexA('#ffffff', tw * a.a * mul);
      ctx.fill();
    }
  }

  _drawBoundary(g, dim) {
    const ctx = this.ctx, COL = this.COL;
    const a = this.fx.cassandra;
    const y = g.yB * g.R;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(-g.R, y); ctx.lineTo(g.R, y);
    ctx.strokeStyle = hexA(COL.crit, 0.7 * a * dim);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = hexA(COL.crit, 0.8 * a * dim);
    ctx.font = `600 8px ${HUD_FONT}`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('critical failure boundary', g.R * 0.9, y - 5);
    ctx.textAlign = 'left';
    /* the crossing: marked, pulsing, and unmoved by being marked */
    const tX = this._breachT();
    if (tX !== null) {
      const bx = this.axisX(tX), by = this.latentN(tX) * g.R;
      const pu = 0.6 + 0.4 * Math.sin(this.t * 5);
      ctx.strokeStyle = hexA(COL.crit, a * pu * dim);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(bx - 5, by - 5); ctx.lineTo(bx + 5, by + 5);
      ctx.moveTo(bx + 5, by - 5); ctx.lineTo(bx - 5, by + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(bx, by, 9 + 3 * pu, 0, TAU);
      ctx.strokeStyle = hexA(COL.crit, a * 0.5 * pu * dim);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  _drawEnvelope(g, TINT, dim, fade) {
    if (this.fitFront < 0.03) return;
    const ctx = this.ctx;
    const tMax = (this.phase === 'fit' ? this.fitFront : 1) * lerp(1.0, 1.28, this.fx.focus);
    const S = 40;
    const wBase = 0.035 + 0.30 * (1 - this.conf) + 0.08 * this.noiseLvl;
    const coneK = lerp(5.5, 1.1, this.conf)
      * (1 - 0.68 * this.fx.focus)
      * (1 + 2.2 * this.fx.overfit)
      * (1 - 0.55 * this.fx.cassandra);
    const flashW = 1 + 1.4 * this.fx.flash;
    const top = [], bot = [];
    for (let i = 0; i <= S; i++) {
      const t = (i / S) * tMax;
      const y = this.dispN(t) * g.R;
      const fut = t <= g.tNow ? 1 : 1 + (t - g.tNow) * coneK;
      const hw = clamp(wBase * fut * flashW, 0.012, 0.85) * g.R;
      const x = this.axisX(t);
      top.push([x, y - hw]); bot.push([x, y + hw]);
    }
    ctx.beginPath();
    ctx.moveTo(top[0][0], top[0][1]);
    for (const [x, y] of top) ctx.lineTo(x, y);
    for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
    ctx.closePath();
    ctx.fillStyle = hexA(TINT, 0.07 * dim * fade);
    ctx.fill();
    ctx.strokeStyle = hexA(TINT, 0.16 * dim * fade);
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  _drawLine(g, TINT, dim, fade) {
    if (this.fitFront < 0.02) return;
    const ctx = this.ctx;
    const tMax = (this.phase === 'fit' ? this.fitFront : 1) * lerp(1.0, 1.28, this.fx.focus);
    const S = 72;
    const glow = 0.45 + 0.5 * this.state.v.pleasure + 0.35 * this.fx.aha;
    const trace = (dx, col, lw, a) => {
      ctx.beginPath();
      for (let i = 0; i <= S; i++) {
        const t = (i / S) * tMax;
        const x = this.axisX(t) + dx, y = this.dispN(t) * g.R;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.globalAlpha = a;
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    /* chromatic aberration under stress: the read doubles at the edges */
    const ab = clamp(this.state.v.stress * 1.25 - 0.18, 0, 1);
    if (ab > 0.02) {
      const off = 1 + 2.4 * ab;
      trace(-off, 'rgba(255,80,110,1)', 1.2, 0.18 * ab * dim * fade);
      trace(off, 'rgba(90,160,255,1)', 1.2, 0.18 * ab * dim * fade);
    }
    /* halo then core: luminescence tracks pleasure */
    trace(0, hexA(TINT, 1), 4.5, 0.14 * glow * dim * fade);
    trace(0, hexA(hexLerp(TINT, '#ffffff', 0.55 * glow), 1), 1.7, clamp(0.5 + 0.45 * glow, 0, 1) * dim * fade);
    /* future extrapolation accent while focused */
    if (this.fx.focus > 0.03) {
      ctx.setLineDash([1, 7]);
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = g.tNow + (i / 24) * (tMax - g.tNow);
        const x = this.axisX(t), y = this.dispN(t) * g.R;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = hexA('#ffffff', 0.5 * this.fx.focus * dim * fade);
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  _pointPos(p, g, resetK) {
    const slotX = this.axisX(p.t);
    const snapK = ss(p.snap) * (p.stray ? 0.12 : 0.86 + 0.1 * this.params.fidelity);
    const slotY = (this.latentN(p.t) + p.dev * (1 - snapK)) * g.R;
    let x, y;
    if (p.arriveP >= 1) { x = slotX; y = slotY; }
    else {
      /* observations enter through the rim of the lens and bow inward —
         the funnel, kept */
      const e = ss(p.arriveP);
      const rx = Math.cos(p.arriveAng) * g.R * 1.05, ry = Math.sin(p.arriveAng) * g.R * 1.05;
      x = lerp(rx, slotX, e); y = lerp(ry, slotY, e);
      const px = -(slotY - ry), py = (slotX - rx);
      const pl = Math.hypot(px, py) || 1;
      const bow = Math.sin(e * Math.PI) * g.R * 0.09 * p.bow;
      x += px / pl * bow; y += py / pl * bow;
    }
    if (resetK > 0) {
      /* consumed inward, never ejected */
      const k = ss(resetK);
      x = lerp(x, 0, k * k); y = lerp(y, 0, k * k);
    }
    return { x, y };
  }

  _drawPoints(g, dim, fade, resetK) {
    const ctx = this.ctx;
    const pfade = resetK > 0 ? 1 - ss(resetK) * 0.85 : 1;
    for (const p of this.points) {
      if (p.arriveDelay > 0) continue;
      const q = this._pointPos(p, g, resetK);
      const tw = 0.75 + 0.25 * Math.sin(this.t * 1.9 + p.tw);
      const wildHot = p.wild && p.snap < 0.6;
      let a = (p.stray ? 0.28 : 0.42 + 0.34 * ss(p.snap)) * tw;
      if (wildHot) a = 0.85;
      a *= dim * pfade;
      const rad = (0.9 + 1.9 * p.depth * clamp(p.w, 0.2, 1.4)) * (wildHot ? 1.25 : 1);
      /* arrival comet */
      if (p.arriveP < 1) {
        const e = ss(p.arriveP);
        const rx = Math.cos(p.arriveAng) * g.R * 1.05, ry = Math.sin(p.arriveAng) * g.R * 1.05;
        ctx.beginPath();
        ctx.moveTo(lerp(q.x, rx, 0.14), lerp(q.y, ry, 0.14));
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = hexA(p.col, 0.3 * e * dim);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      /* snap tether: the residual being claimed by the fit */
      if (p.snapping && p.snap > 0.02 && p.snap < 0.98 && !p.stray) {
        const ly = this.latentN(p.t) * g.R;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y); ctx.lineTo(this.axisX(p.t), ly);
        ctx.strokeStyle = hexA(p.col, 0.35 * (1 - p.snap) * dim * pfade);
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(q.x, q.y, rad, 0, TAU);
      ctx.fillStyle = hexA(p.col, clamp(a, 0, 1));
      ctx.fill();
      if (p.linked) {
        ctx.beginPath();
        ctx.arc(q.x, q.y, rad + 2.4, 0, TAU);
        ctx.strokeStyle = hexA(p.col, 0.5 * dim * pfade);
        ctx.lineWidth = 0.9;
        ctx.stroke();
      }
      if (p.spark > 0.02) {
        ctx.beginPath();
        ctx.arc(q.x, q.y, rad + 3 + (1 - p.spark) * 7, 0, TAU);
        ctx.strokeStyle = hexA('#ffffff', p.spark * 0.7 * dim);
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }
  }

  /* construct silhouette at time tc — deterministic per epoch, so
     scrubbing back through time replays the same forms */
  _verts(tc, s, jitter) {
    const c = this.construct;
    const out = [];
    for (let i = 0; i < c.K; i++) {
      const sp = c.spokes[i];
      const h0 = 0.5 + 0.5 * Math.sin(sp.om * tc + sp.ph);
      const h = 0.5 + sp.amp * (h0 - 0.5);
      let r = s * lerp(0.42, 1.0, h);
      if (jitter > 0.01) r += (this.rng() - 0.5) * s * 0.36 * jitter;
      const th = (i / c.K) * TAU + c.rot0 + tc * c.spin
        + Math.sin(sp.om2 * tc + sp.ph2) * 0.22 * c.wob;
      out.push([Math.cos(th) * r, Math.sin(th) * r]);
    }
    return out;
  }

  _drawConstructAll(g, TINT, dim, fade) {
    const ctx = this.ctx;
    const c = this.construct;
    const app = ss(clamp((this.t - c.born) / 0.5, 0, 1)) * fade;
    if (app <= 0.01) return;
    const tc = this.tcShown;
    const baseS = g.R * (0.075 + 0.011 * c.K) * (0.75 + 0.45 * this.conf) * (1 + 0.16 * c.flash);
    const cx = this.axisX(tc), cy = this.dispN(tc) * g.R;

    /* development trail: where the concept has just been */
    for (let k = 3; k >= 1; k--) {
      const tg = tc - k * 0.075;
      if (tg < 0.005) continue;
      const vx = this.axisX(tg), vy = this.dispN(tg) * g.R;
      const vv = this._verts(tg, baseS * (1 - k * 0.08), 0);
      ctx.beginPath();
      vv.forEach(([x, y], i) => i === 0 ? ctx.moveTo(vx + x, vy + y) : ctx.lineTo(vx + x, vy + y));
      ctx.closePath();
      ctx.strokeStyle = hexA(TINT, (0.17 - k * 0.045) * dim * app);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    /* future ghosts while deeply focused: the vector projected forward */
    if (this.fx.focus > 0.04) {
      [0.16, 0.30, 0.44].forEach((d, i) => {
        const tg = g.tNow + d;
        if (tg <= tc + 0.04) return;
        const vx = this.axisX(tg), vy = this.dispN(tg) * g.R;
        const vv = this._verts(tg, baseS * 0.85, 0);
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        vv.forEach(([x, y], j) => j === 0 ? ctx.moveTo(vx + x, vy + y) : ctx.lineTo(vx + x, vy + y));
        ctx.closePath();
        ctx.strokeStyle = hexA('#ffffff', 0.34 * this.fx.focus * (1 - i * 0.26) * dim);
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = hexA(this.COL.muted, 0.6 * this.fx.focus * dim);
        ctx.font = `600 8px ${HUD_FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText(`+${i + 1}`, vx, vy - baseS - 6);
        ctx.textAlign = 'left';
      });
    }

    /* tethers: the observations currently informing the construct */
    for (const p of this.points) {
      if (!p.linked || p.arriveP < 1) continue;
      const dt2 = Math.abs(p.t - tc);
      if (dt2 > 0.16) continue;
      const q = this._pointPos(p, g, 0);
      const a = (1 - dt2 / 0.16) * 0.5 * dim * app;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo((cx + q.x) / 2, (cy + q.y) / 2 - 8, q.x, q.y);
      ctx.strokeStyle = hexA(p.col, a);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(cx, cy);
    const judder = this.fx.flash > 0.05 ? (this.rng() - 0.5) * 3.5 * this.fx.flash : 0;
    ctx.translate(judder, -judder);

    /* condensation glow — the light gathers here, not at the rim */
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, baseS * 2.3);
    glow.addColorStop(0, hexA('#ffffff', (0.32 + 0.25 * this.state.v.pleasure + 0.5 * this.flareT) * dim * app * this.opts.coreGlow));
    glow.addColorStop(0.4, hexA(TINT, 0.22 * dim * app * this.opts.coreGlow));
    glow.addColorStop(1, hexA(TINT, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(-baseS * 2.3, -baseS * 2.3, baseS * 4.6, baseS * 4.6);

    const scaleIn = 0.6 + 0.4 * app;
    const jit = this.fx.overfit;
    const verts = this._verts(tc, baseS * scaleIn, jit);
    const breach = this.fx.cassandra > 0.2 && this._breachT() !== null && tc >= this._breachT() - 0.02;
    const bodyTint = breach ? hexLerp(TINT, this.COL.crit, 0.6) : TINT;

    ctx.beginPath();
    verts.forEach(([x, y], i) => i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath();
    const fg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(baseS, 6));
    fg.addColorStop(0, hexA('#ffffff', 0.85 * dim * app));
    fg.addColorStop(0.55, hexA(bodyTint, 0.55 * dim * app));
    fg.addColorStop(1, hexA(bodyTint, 0.12 * dim * app));
    ctx.fillStyle = fg;
    ctx.fill();
    if (this.fx.flash > 0.25) ctx.setLineDash([4, 5]);
    ctx.strokeStyle = hexA('#ffffff', 0.8 * dim * app);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.setLineDash([]);

    /* facet cuts */
    ctx.strokeStyle = hexA('#ffffff', 0.3 * dim * app);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (const [x, y] of verts) { ctx.moveTo(0, 0); ctx.lineTo(x * 0.97, y * 0.97); }
    ctx.stroke();

    /* its own closed ring — a chamber in miniature */
    ctx.beginPath();
    ctx.arc(0, 0, baseS * 1.32, 0, TAU);
    ctx.strokeStyle = hexA(bodyTint, 0.38 * dim * app);
    ctx.lineWidth = 1;
    ctx.stroke();

    /* the fracture, when it arrives at the failure it named */
    if (breach) {
      ctx.strokeStyle = hexA(this.COL.crit, 0.85 * dim * app);
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-baseS * 0.7, -baseS * 0.5);
      ctx.lineTo(-baseS * 0.1, 0.1 * baseS);
      ctx.lineTo(baseS * 0.35, -baseS * 0.25);
      ctx.lineTo(baseS * 0.7, baseS * 0.55);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawStall(dim) {
    const ctx = this.ctx;
    const a = clamp(this.stall, 0, 1) * (0.55 + 0.45 * Math.sin(this.t * 9));
    const label = 'HIGH LATENCY REQUIRED · BUFFER STALL';
    ctx.font = `700 10px ${HUD_FONT}`;
    const w = ctx.measureText(label).width + 34;
    const x = this.cx - w / 2, y = 14;
    ctx.fillStyle = `rgba(10,8,4,${(0.75 * a).toFixed(3)})`;
    ctx.strokeStyle = hexA(this.COL.warn, a);
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, 24, 6);
    else ctx.rect(x, y, w, 24);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = hexA(this.COL.warn, a);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('◉', x + 10, y + 12.5);
    ctx.fillText(label, x + 24, y + 12.5);
    ctx.textBaseline = 'alphabetic';
  }

  /** Te keeps score in public; Ni's readout is convergence — R², loss,
      and how far past "now" the model can see. */
  drawHUD(TINT, dim) {
    const ctx = this.ctx, s = this.opts.hudScale;
    const x = 16, y = 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = hexA(this.COL.muted, 0.85);
    ctx.font = `600 ${9 * s}px ${HUD_FONT}`;
    ctx.fillText('CONVERGENCE', x, y);

    let big = `R² ${this.conf.toFixed(2)}`;
    let bigCol = TINT;
    if (this.flareT > 0.55) { big = 'INSIGHT'; bigCol = '#ffffff'; }
    else if (this._breachFlash > 0.4) { big = 'BREACH'; bigCol = this.COL.crit; }
    else if (this.fx.flash > 0.5) { big = 'STALL'; bigCol = this.COL.warn; }
    else if (this.fx.overfit > 0.6) { big = 'OVERFIT'; bigCol = this.COL.warn; }
    ctx.fillStyle = hexA(bigCol, 0.35 + 0.6 * dim);
    ctx.font = `700 ${17 * s}px ${HUD_FONT}`;
    ctx.fillText(big, x, y + 19 * s);

    /* loss volatility is the stress meter leaking into the numbers */
    const lossDisp = clamp(this.state.v.loss + (this.rng() - 0.5) * 0.16 * this.state.v.stress, 0, 1);
    const horizon = (this.fx.overfit > 0.4 || this.fx.flash > 0.5) ? 0
      : Math.round(1 + this.conf * 3 + this.fx.focus * 3);
    ctx.fillStyle = hexA(this.COL.ink2, 0.6);
    ctx.font = `500 ${10 * s}px ${HUD_FONT}`;
    ctx.fillText(`loss ${lossDisp.toFixed(3)} · n ${this.samples}`, x, y + 34 * s);
    ctx.fillStyle = hexA(this.COL.muted, 0.75);
    ctx.fillText(`horizon +${horizon} steps · epoch ${this.epochs}`, x, y + 46 * s);

    const cw = 7 * s, gp = 2.5 * s, cells = 16;
    for (let i = 0; i < cells; i++) {
      const on = this.conf * cells > i;
      ctx.fillStyle = hexA(on ? TINT : this.COL.axis, on ? 0.85 : 0.5);
      ctx.fillRect(x + i * (cw + gp), y + 53 * s, cw, 3.5 * s);
    }
    if (this.construct && this.phase === 'traverse') {
      ctx.font = `600 ${9.5 * s}px ${HUD_FONT}`;
      ctx.fillStyle = hexA(this.hoverT !== null ? TINT : this.COL.ink2, 0.9);
      ctx.fillText(
        (this.hoverT !== null ? 'steering: ' : 'holding: ') + `t = ${Math.round(this.tcShown * 100)}%`,
        x, y + 68 * s);
    }
  }

  renderStatic() { for (let i = 0; i < 24; i++) this.step(1 / 30); this.draw(); }
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
