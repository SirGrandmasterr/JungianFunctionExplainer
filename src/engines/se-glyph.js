/* ============================================================
   CURRENTS · SeGlyph — The Naked Eye
   Se as a contact instrument: a wide-dilated iris-aperture in
   direct, unmediated contact with a live stimulus field. The
   same world-field drifts across the whole canvas — blurred and
   desaturated outside the ring, crisp and saturated inside it.
   The glyph's one argument, rendered without a caption: the
   same world, more so.

   There is no cycle and no epoch. Se is continuous: events
   erupt in the field (flares, darts, flickers), the gaze
   saccades to them within a frame, locks, and releases. Nothing
   is stored — dead events leave a sub-second afterimage and are
   gone. Understimulation is the pathology: an empty field makes
   the aperture dilate and hunt, and the stress meter climbs on
   silence the way other functions climb on chaos.

   Shape grammar (§1.3): perceiving → circular aperture/lens.
   Extraverted → an OPEN ring taken to its limit — an iris of
   blades that is mostly gap — with a radiant halo bleeding
   outward and tracers EMITTED at whatever the eye locks:
   perception reaching out to touch.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexLerp } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';
import { SeState } from './se-state.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
const HUD_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const smoothstep = (a, b, t) => ss((t - a) / (b - a || 1));

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

export class SeGlyph {
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

    /* the unified state stream — DOM telemetry adapters subscribe here */
    this.state = opts.state || new SeState();

    /* the live field */
    this.field = [];         /* world particles — everywhere, styled by side of the ring */
    this.events = [];        /* things worth looking at */
    this.tracers = [];       /* emitted at locked targets: perception touching */
    this.ghosts = [];        /* afterimages — Se's entire memory, <1 s of it */
    this.badges = [];

    /* the gaze */
    this.gaze = { x: 0, y: 0 };
    this.gazeTarget = null;  /* {x,y} or an event ref */
    this.lockEv = null;
    this.lockFlash = 0;
    this.dwellT = 0;
    this.saccT = 0;          /* micro-saccade timer */
    this.wander = { x: 0, y: 0 };

    /* contact bookkeeping */
    this.caught = 0; this.missed = 0;
    this.lockMs = null;      /* time-to-lock of the last catch */
    this.clar = 0.7;         /* eased clarity readout */
    this.dil = 1;            /* aperture dilation (1 = neutral) */
    this.chainHeat = 0;      /* sealed-loop rapid-fire heat */

    /* scenario state */
    this.intensityUser = null;     /* lab slider override */
    this.intensityBase = 0.62;
    this.iEff = 0.62;              /* eased effective intensity */
    this.blackoutK = 0;            /* eased blackout envelope */
    this.blackoutUntil = 0;
    this._blackoutRelief = false;
    this.missUntil = 0;
    this.lastFlicker = null; this.lastWindow = null;

    /* Zone B linkage: the lab responds from whichever slot the rail has
       selected — latency of the RESPONSE only, so the chamber stays
       legible while position decides whether openings get used */
    this.stackLatency = 0;
    this.stackLabel = null;

    this.colorShift = 0; this.shake = 0; this.pulseT = 0; this.pulseColor = '#ffffff';
    this.pointer = { x: null, y: null, hist: [] };
    this._ptrLeapAt = 0;
    this.steered = false;
    this.bombard = false;
    this._evAcc = 0; this._subAcc = 0;
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
        if (REDUCED) { this.step(1 / 30); this.draw(); }
      });
      canvas.addEventListener('pointerleave', () => {
        this.pointer.hist = []; this.pointer.x = this.pointer.y = null;
      });
    }

    this.g = this.geom();
    this._seedField();
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
      blades: 12,          /* iris segments — the ring that is mostly gap */
      span: 0.62,          /* fraction of each segment that is blade, not gap */
    };
  }

  /* ---------- shared glyph API (rail & feeder modules depend on this) ---------- */
  setTarget(p) {
    Object.assign(this.target, { contrary: 0 }, p);
    if (REDUCED) { Object.assign(this.params, this.target); this.g = this.geom(); this.renderStatic(); }
  }
  setStructure(s) {
    const next = Object.assign({}, this.structure, s);
    const changed = next.countMul !== this.structure.countMul || next.rigidity !== this.structure.rigidity;
    this.structure = next;
    if (changed && REDUCED) this.renderStatic();
  }
  setFeeder(f) {
    this.feeder = f;
    this.events = []; this.lockEv = null;
    if (REDUCED) this.renderStatic();
  }
  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  color() { return hexLerp(this.COL.fn, '#e0512f', this.colorShift); }

  /* legacy readouts other code may probe */
  get stress() { return this.state.v.stress; }
  set stress(v) { this.state.v.stress = this.state.tv.stress = clamp(v, 0, 1); }
  get pleasure() { return this.state.v.pleasure; }
  set pleasure(v) { this.state.v.pleasure = this.state.tv.pleasure = clamp(v, 0, 1); }

  /* ---------- lab controls ---------- */
  setIntensity(v) {
    this.intensityUser = clamp(v, 0, 1);
    if (REDUCED) this.renderStatic();
  }
  setStackLatency(ms, label) {
    this.stackLatency = ms;
    this.stackLabel = label;
  }

  /* ---------- the field ---------- */
  _fieldHue() {
    const r = this.rng();
    /* the world in amber: mostly warm, some neutral drift the lens will
       reveal as duller than it looked */
    if (r < 0.42) return this.COL.fn;
    if (r < 0.68) return '#ffd27a';
    if (r < 0.86) return '#f5e9d0';
    return '#8a93a8';
  }
  _spawnParticle(anywhere = true) {
    const rng = this.rng;
    const mover = rng() < lerp(0.10, 0.38, this.iEff);
    const a = rng() * TAU, sp = mover ? lerp(26, 90, rng()) : lerp(3, 10, rng());
    return {
      x: anywhere ? rng() * this.W : (rng() < 0.5 ? -8 : this.W + 8),
      y: rng() * this.H,
      vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      px: 0, py: 0,
      hue: this._fieldHue(),
      mover,
      size: mover ? lerp(1.5, 2.5, rng()) : lerp(1.0, 2.0, rng()),
      tw: rng() * TAU,
      flare: 0,
    };
  }
  _seedField() {
    this.field = [];
    const n = Math.round(lerp(10, 110, this.iEff) * this.structure.countMul * this.opts.supply);
    for (let i = 0; i < n; i++) this.field.push(this._spawnParticle());
  }

  /* ---------- events: things worth looking at ---------- */
  _seenDelay() { return Math.max(this.params.latency, 0) / 1000; }

  _spawnEvent(kind, o = {}) {
    const rng = this.rng, g = this.g, f = this.feeder;
    let x = o.x, y = o.y;
    if (x === undefined) {
      /* inside the lens; a feeder aims arrivals at its side of the ring */
      const aim = f && f.aim !== undefined ? f.aim : null;
      const th = aim !== null
        ? aim + (rng() - 0.5) * TAU * clamp(f.spread || 0.5, 0.15, 1) * 0.5
        : rng() * TAU;
      const rr = (0.25 + rng() * 0.55) * g.R;
      x = this.cx + Math.cos(th) * rr;
      y = this.cy + Math.sin(th) * rr;
    }
    const ev = {
      kind, x, y, born: this.t,
      life: o.life !== undefined ? o.life : (kind === 'dart' ? 1.3 : kind === 'flare' ? 1.0 : 1.05),
      seeAt: this.t + (o.seeDelay !== undefined ? o.seeDelay : this._seenDelay()),
      locked: false, lockAt: 0, dead: false,
      badge: !!o.badge, ghostTwin: !!o.ghostTwin,
      lockable: !o.ghostTwin,
      col: o.col || (f && f.dwell >= 0.8 && rng() < 0.5 ? f.color : this.COL.fn),
      r: o.r || 4,
      hop: rng() * TAU,
      vx: 0, vy: 0,
    };
    if (kind === 'dart') {
      const a = rng() * TAU;
      const sp = lerp(120, 220, rng()) * (f ? lerp(0.7, 1.2, f.speed || 0.7) : 1);
      ev.x = this.cx - Math.cos(a) * g.R * 0.95;
      ev.y = this.cy - Math.sin(a) * g.R * 0.95;
      ev.vx = Math.cos(a) * sp; ev.vy = Math.sin(a) * sp;
      ev.life = (g.R * 1.9) / sp;
    }
    if (kind === 'window') {
      /* the gap shuts in 800 ms: generous at 0 ms of latency, tight at
         250, and already a wall by the time an inferior's 700 ms signal
         has even launched the response — §3.1, made consequential */
      ev.life = 0.8;
      ev.holdAfter = 1.1;                  /* the shut gate lingers, visibly shut */
      ev.gapDir = rng() * TAU;
      ev.open0 = 0.85;                     /* starting half-angle of the gap */
      ev.wr = g.R * 0.16;
      ev.fireAt = this.t + Math.max(this.params.latency, this.stackLatency) / 1000;
      ev.travel = 0.3;
      ev.fired = false; ev.resolved = false;
    }
    /* a feeder that keeps interrupting looking with meaning: the lock is
       aborted a beat after the eye commits — perception feeding perception */
    if (f && f.starve && kind !== 'window') ev.abortAt = ev.seeAt + 0.28;
    this.events.push(ev);
    return ev;
  }

  badge(x, y, ok, label) { this.badges.push({ x, y, ok, label, age: 0 }); }

  /* ---------- scenario triggers (Zone D · the Contact Lab) ---------- */
  /**
   * @param {string} key    flicker | window | blackout
   * @param {Object} impact additive state deltas, e.g. { stress:+0.3, pleasure:-0.35 }
   */
  scenario(key, impact = {}) {
    this.state.impulse(impact);
    const rng = this.rng, g = this.g;

    if (key === 'flicker') {
      this.lastFlicker = null;
      /* three hundred milliseconds of motion, and a little afterglow — a
         signal that spends 700 ms in transit arrives at a finished event */
      const seeDelay = Math.max(this.params.latency, this.stackLatency) / 1000;
      this._spawnEvent('flicker', { badge: true, seeDelay, life: 0.42 });
      /* the twin: same event, same size, outside the lens — the world
         without Se pointed at it */
      const a = rng() * TAU;
      const rr = g.R * lerp(1.28, 1.5, rng());
      this._spawnEvent('flicker', {
        ghostTwin: true, life: 0.42,
        x: clamp(this.cx + Math.cos(a) * rr, 20, this.W - 20),
        y: clamp(this.cy + Math.sin(a) * rr, 20, this.H - 20),
      });
    } else if (key === 'window') {
      this.lastWindow = null;
      this._spawnEvent('window', { badge: true });
    } else if (key === 'blackout') {
      this.blackoutUntil = this.t + 5.4;
      this._blackoutRelief = false;
      /* everything alive dies to afterimage; the brightest ghost carries
         the tag for the sibling that would have kept it */
      let tagged = false;
      for (const ev of this.events) {
        if (ev.kind === 'window') continue;
        ev.dead = true;
        const gh = { x: ev.x, y: ev.y, r: 7, age: 0, max: tagged ? 1.6 : 2.8, siTag: !tagged };
        tagged = true;
        this.ghosts.push(gh);
      }
      if (!tagged) this.ghosts.push({ x: this.gaze.x, y: this.gaze.y, r: 7, age: 0, max: 2.8, siTag: true });
      this.events = this.events.filter((e) => e.kind === 'window');
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

  /* ---------- simulation ---------- */
  step(dt) {
    this.t += dt;
    const p = this.params, tg = this.target, f = this.feeder, g = this.g = this.geom();
    for (const k in tg) p[k] = lerp(p[k], tg[k], 1 - Math.pow(0.0015, dt));

    this.state.step(dt);

    this.pulseT = Math.max(0, this.pulseT - dt * 1.3);
    this.shake = Math.max(0, this.shake - dt * 1.6);
    this.lockFlash = Math.max(0, this.lockFlash - dt * 3.2);
    this.chainHeat = Math.max(0, this.chainHeat - dt * 0.5);

    /* duty: the lidded eye — low duty positions are often simply not looking */
    const w1 = (Math.sin(this.t * 0.55) + 1) / 2;
    const w2 = (Math.sin(this.t * 1.87 + 1.3) + 1) / 2;
    const dutyWave = lerp(w1, w1 * 0.5 + w2 * 0.5, clamp(p.noise * 1.6, 0, 1));
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.35, 0.1, 1);

    /* ---- intensity: slider, blackout, feeder ---- */
    const blackout = this.t < this.blackoutUntil;
    this.blackoutK += ((blackout ? 1 : 0) - this.blackoutK) * (1 - Math.exp(-dt * (blackout ? 6 : 2.2)));
    if (!blackout && this.blackoutUntil > 0 && !this._blackoutRelief && this.blackoutK < 0.5) {
      this._blackoutRelief = true;
      this.state.impulse({ pleasure: 0.22, stress: -0.10 });
      this.pulse(this.color());
      this.badge(0, -g.R * 0.55, true, 'contact restored');
    }
    let iTarget = this.intensityUser !== null ? this.intensityUser : this.intensityBase;
    if (f) iTarget = clamp(iTarget * lerp(0.75, 1.25, f.rate !== undefined ? f.rate : 0.6), 0, 1);
    iTarget = lerp(iTarget, 0.02, this.blackoutK);
    this.iEff += (iTarget - this.iEff) * (1 - Math.exp(-dt * 2.6));

    const noiseLvl = clamp(p.noise * 0.9 + this.state.v.noise * 0.4, 0, 1);
    this.noiseLvl = noiseLvl;

    /* clarity: the R² of contact. It RISES with intensity — stimulation
       produces focus, not overload. That asymmetry is the whole page. */
    const clarRaw = clamp(p.fidelity * lerp(0.45, 1.0, this.iEff) * (1 - 0.45 * noiseLvl), 0.04, 0.99);
    this.clar += (clarRaw - this.clar) * (1 - Math.exp(-dt * 3));

    /* hunger: an empty field is the emergency */
    const hunger = smoothstep(0.30, 0.06, this.iEff);
    this.hunger = hunger;
    this.state.flags.hunger = hunger > 0.55 && !blackout;
    this.state.flags.blackout = this.blackoutK > 0.5;
    this.state.flags.miss = this.t < this.missUntil;
    this.state.flags.flicker = this.events.some((e) => e.kind === 'flicker' && !e.dead && !e.ghostTwin);
    this.state.flags.window = this.events.some((e) => e.kind === 'window' && !e.resolved);

    /* homeostatic drives: pleasure tracks contact, stress tracks its absence */
    this.state.impulse({
      pleasure: (this.iEff * this.clar - 0.35) * 0.055 * dt,
      stress: (hunger * 0.030 + this.blackoutK * 0.045 + this.chainHeat * 0.02) * dt,
    });
    this.state.publish({ intensity: this.iEff, clarity: this.clar });

    this.colorShift = lerp(this.colorShift,
      clamp((this.state.v.stress - 0.45) * 1.5, 0, 1), 1 - Math.pow(0.08, dt));

    /* aperture dilation: wide and hunting when starved, tight and focused
       when the field is rich — the eye's own light-response, inverted into
       a stimulation-response */
    const dilTarget = clamp(1 + 0.20 * hunger + 0.24 * this.blackoutK - 0.07 * smoothstep(0.55, 1, this.iEff), 0.9, 1.26);
    this.dil += (dilTarget - this.dil) * (1 - Math.exp(-dt * 3));

    /* ---- field population ---- */
    const want = Math.round(lerp(10, 110, this.iEff) * this.structure.countMul * this.opts.supply);
    if (this.field.length < want) {
      for (let i = 0; i < Math.min(5, want - this.field.length); i++) this.field.push(this._spawnParticle(this.field.length < 20));
    } else if (this.field.length > want) {
      this.field.length = Math.max(want, this.field.length - 3);
    }
    const spdMul = lerp(0.5, 1.25, this.iEff);
    for (const q of this.field) {
      q.px = q.x; q.py = q.y;
      if (!q.mover) { q.vx += (this.rng() - 0.5) * 14 * dt; q.vy += (this.rng() - 0.5) * 14 * dt; }
      q.vx = clamp(q.vx, -110, 110); q.vy = clamp(q.vy, -110, 110);
      q.x += q.vx * spdMul * dt; q.y += q.vy * spdMul * dt;
      if (q.x < -12) q.x = this.W + 10; if (q.x > this.W + 12) q.x = -10;
      if (q.y < -12) q.y = this.H + 10; if (q.y > this.H + 12) q.y = -10;
      q.flare = Math.max(0, q.flare - dt * 1.4);
    }

    /* ---- ambient events ---- */
    this._evAcc += dt * this.awake;
    const rateMul = f ? lerp(0.6, 1.9, f.rate !== undefined ? f.rate : 0.6) : 1;
    const iv = lerp(2.6, 0.42, this.iEff) / rateMul;
    if (this._evAcc > iv && this.blackoutK < 0.4) {
      this._evAcc = 0;
      if (this.rng() < 0.55) {
        /* a particle flares */
        const cands = this.field.filter((q) => this._inLens(q.x, q.y));
        if (cands.length) {
          const q = cands[(this.rng() * cands.length) | 0];
          q.flare = 1;
          this._spawnEvent('flare', { x: q.x, y: q.y, col: q.hue === '#8a93a8' ? this.COL.fn : q.hue });
        }
      } else {
        this._spawnEvent('dart');
      }
    }

    /* rail bombardment: background flickers with a public verdict — the
       catch rate decaying down the stack is the §3.1 table, felt */
    if (this.bombard) {
      this._subAcc += dt;
      const biv = 3.0 - 1.2 * p.duty;
      if (this._subAcc > biv) {
        this._subAcc = 0;
        /* short-lived on purpose: a 700 ms signal path turns most of these
           into 'missed · too slow' — the §3.1 latency row, as a badge stream */
        const ev = this._spawnEvent('flicker', { badge: true, life: 0.72 });
        /* deep positions sometimes never register the event at all */
        if (this.rng() < (1 - p.fidelity) * 0.55) ev.seeAt = this.t + 9;
        /* the trickster's specialty: total confidence about a detail that
           was never there */
        if (p.contrary > 0.2 && this.rng() < p.contrary * 0.5) {
          const a = this.rng() * TAU, rr = (0.3 + this.rng() * 0.4) * g.R;
          const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
          this.badge(px, py, false, 'phantom lock');
          this.lockFlash = 1;
        }
      }
    }

    /* ---- gaze targeting ---- */
    const ptr = this.delayedPointer();
    let targetX = null, targetY = null, targetEv = null;
    let hovering = false;
    if (ptr && this.opts.interactive && this.pointer.x !== null) {
      const dxp = this.pointer.x - this.cx, dyp = this.pointer.y - this.cy;
      if (dxp * dxp + dyp * dyp < g.R * g.R * 1.3) {
        hovering = true;
        this.steered = true;
        targetX = ptr.x; targetY = ptr.y;
        /* the cursor is the most vivid object in the field — quick movement
           draws a leap of tracers toward it */
        const h = this.pointer.hist;
        if (h.length > 3) {
          const a = h[h.length - 1], b = h[h.length - 4];
          const v = Math.hypot(a.x - b.x, a.y - b.y) / Math.max((a.t - b.t) / 1000, 1e-3);
          if (v > 850 && this.t - this._ptrLeapAt > 0.35) {
            this._ptrLeapAt = this.t;
            this._emitTracers(a.x, a.y, 2);
            this.state.impulse({ pleasure: 0.02 });
          }
        }
      }
    }
    if (!hovering) {
      /* newest seeable, lockable event wins */
      let best = null;
      for (const ev of this.events) {
        if (ev.dead || ev.locked || !ev.lockable || ev.ghostTwin) continue;
        if (this.t < ev.seeAt) continue;
        if (ev.abortAt && this.t >= ev.abortAt) continue;
        if (!best || ev.born > best.born) best = ev;
      }
      if (best) { targetEv = best; targetX = best.x; targetY = best.y; }
    }
    if (targetX === null) {
      /* nothing salient: micro-saccade wander. Hungry = wider and faster;
         age (rigidity) steadies the gaze */
      this.saccT -= dt;
      if (this.saccT <= 0) {
        this.saccT = lerp(0.9, 0.32, hunger) + this.rng() * 0.5;
        const amp = g.R * (0.28 + 0.4 * hunger) * (1 - 0.45 * this.structure.rigidity) * this.dil;
        const a = this.rng() * TAU;
        this.wander.x = this.cx + Math.cos(a) * amp * (0.4 + this.rng() * 0.6);
        this.wander.y = this.cy + Math.sin(a) * amp * (0.4 + this.rng() * 0.6);
      }
      targetX = this.wander.x; targetY = this.wander.y;
    }
    /* shadow registers look away from what you point at */
    if (p.contrary > 0.12 && Math.sin(this.t * 0.6 + 2) > 1 - p.contrary * 0.8) {
      targetX = 2 * this.cx - targetX; targetY = 2 * this.cy - targetY;
      targetEv = null;
    }

    /* ease or snap: a dominant locks within a single frame */
    if (p.control >= 0.92) {
      this.gaze.x = targetX; this.gaze.y = targetY;
    } else {
      const k = lerp(2.2, 14, clamp(p.control, 0, 1));
      const e = 1 - Math.exp(-dt * k);
      this.gaze.x += (targetX - this.gaze.x) * e;
      this.gaze.y += (targetY - this.gaze.y) * e;
    }

    /* ---- lock resolution ---- */
    if (targetEv && !targetEv.locked) {
      const d = Math.hypot(this.gaze.x - targetEv.x, this.gaze.y - targetEv.y);
      const lockR = (10 + targetEv.r * 0.5) * (f && f.focus ? lerp(1.3, 0.9, f.focus) : 1);
      if (d < lockR && f && f.starve && this.rng() < 0.8) {
        /* the gaze arrives — and the target has already become a symbol of
           something else. The look is interrupted at the moment of contact:
           no lock, no miss, just a meaning-mote leaving the scene */
        targetEv.lockable = false;
        targetEv.life = Math.min(targetEv.life, this.t - targetEv.born + 0.22);
        this.tracers.push({
          x0: targetEv.x, y0: targetEv.y,
          x1: targetEv.x + (this.rng() - 0.5) * 70, y1: targetEv.y - 40 - this.rng() * 36,
          p: 0, dur: 0.55, col: f.color,
        });
      } else if (d < lockR) {
        targetEv.locked = true; targetEv.lockAt = this.t;
        this.lockEv = targetEv;
        this.lockMs = Math.max(1, Math.round((this.t - targetEv.born) * 1000));
        this.caught++;
        this.lockFlash = 1;
        this.dwellT = f ? lerp(0.12, 1.1, f.dwell !== undefined ? f.dwell : 0.4) : 0.4;
        this._emitTracers(targetEv.x, targetEv.y, 2 + (this.structure.k >> 1));
        this.state.impulse({ pleasure: 0.045 * (f ? clamp(f.weight, 0.2, 1.2) : 1) });
        if (targetEv.badge) this.badge(targetEv.x - this.cx, targetEv.y - this.cy, true, `caught · ${this.lockMs} ms`);
        if (targetEv.kind === 'flicker' && !targetEv.ghostTwin && this.lastFlicker === null) this.lastFlicker = 'hit';
        /* sealed loops spend every hit on the next one: no dwell, rising heat.
           Rapid-fire, not strobe — the next dare arrives a beat later. */
        if (f && f.sealed) {
          this.dwellT = 0.05;
          this.chainHeat = clamp(this.chainHeat + 0.18, 0, 1);
          this._evAcc = iv - 0.26;
        }
      }
    }
    if (this.lockEv) {
      this.dwellT -= dt;
      if (this.lockEv.dead || this.dwellT <= 0) this.lockEv = null;
    }

    /* ---- event lifecycle ---- */
    for (const ev of this.events) {
      if (ev.dead) continue;
      if (ev.kind === 'dart') {
        ev.x += ev.vx * dt; ev.y += ev.vy * dt;
      }
      if (ev.kind === 'window') { this._stepWindow(ev, dt, g); continue; }
      if (this.t - ev.born > ev.life) {
        ev.dead = true;
        this.ghosts.push({ x: ev.x, y: ev.y, r: 5, age: 0, max: 0.9, siTag: false });
        if (ev.lockable && !ev.locked && !ev.ghostTwin) {
          this.missed++;
          this.missUntil = this.t + 2.0;
          if (ev.badge) {
            this.badge(ev.x - this.cx, ev.y - this.cy, false, 'missed · too slow');
            if (ev.kind === 'flicker' && this.lastFlicker === null) this.lastFlicker = 'miss';
          }
        }
        if (ev.ghostTwin) {
          this.badge(ev.x - this.cx, ev.y - this.cy, null, 'unseen · outside the lens');
        }
      }
    }
    this.events = this.events.filter((e) => !e.dead || this.t - e.born < e.life + 0.1);

    /* tracers: emitted perception, quadratic flight, gone on arrival */
    for (const tr of this.tracers) {
      tr.p = clamp(tr.p + dt / tr.dur, 0, 1);
    }
    this.tracers = this.tracers.filter((tr) => tr.p < 1);

    for (const gh of this.ghosts) gh.age += dt;
    this.ghosts = this.ghosts.filter((gh) => gh.age < gh.max);

    for (const b of this.badges) b.age += dt;
    this.badges = this.badges.filter((b) => b.age < 1.7);
  }

  _stepWindow(ev, dt, g) {
    const age = this.t - ev.born;
    ev.openFrac = clamp(1 - age / ev.life, 0, 1);
    /* the response leaves as soon as the signal arrives — how long the
       signal took is the entire drama */
    if (!ev.fired && this.t >= ev.fireAt) {
      ev.fired = true;
      const a = Math.atan2(ev.y - this.cy, ev.x - this.cx) + Math.PI; /* far rim */
      ev.trFrom = {
        x: this.cx + Math.cos(a) * g.R * this.dil,
        y: this.cy + Math.sin(a) * g.R * this.dil,
      };
    }
    if (ev.fired && !ev.resolved) {
      const flight = (this.t - ev.fireAt) / ev.travel;
      if (flight >= 1) {
        ev.resolved = true;
        const late = Math.round(((this.t - ev.born) - ev.life * 0.9) * 1000);
        if (ev.openFrac > 0.1) {
          ev.result = 'hit';
          this.lastWindow = 'hit';
          this.caught++;
          this.lockFlash = 1;
          this.pulse(this.color());
          this.state.impulse({ pleasure: 0.20, stress: -0.05 });
          this.badge(ev.x - this.cx, ev.y - this.cy, true, 'threaded · in time');
          /* the response keeps going — out through the gap, out of the
             chamber, into the world */
          this._emitTracers(
            ev.x + Math.cos(ev.gapDir) * g.R * 0.8,
            ev.y + Math.sin(ev.gapDir) * g.R * 0.8, 3);
        } else {
          ev.result = 'miss';
          this.lastWindow = 'miss';
          this.missed++;
          this.missUntil = this.t + 2.4;
          this.shake = Math.max(this.shake, 0.4);
          this.state.impulse({ stress: 0.22, pleasure: -0.12 });
          this.badge(ev.x - this.cx, ev.y - this.cy, false, `shut · +${Math.max(late, 60)} ms late`);
        }
      }
    }
    if (age > ev.life + ev.holdAfter) ev.dead = true;
  }

  _emitTracers(tx, ty, n) {
    const g = this.g;
    for (let i = 0; i < n; i++) {
      const a = Math.atan2(ty - this.cy, tx - this.cx) + (this.rng() - 0.5) * 1.2;
      this.tracers.push({
        x0: this.cx + Math.cos(a) * g.R * this.dil,
        y0: this.cy + Math.sin(a) * g.R * this.dil,
        x1: tx, y1: ty,
        p: 0, dur: 0.22 + this.rng() * 0.14,
        col: this.color(),
      });
    }
  }

  _inLens(x, y) {
    const dx = x - this.cx, dy = y - this.cy;
    const r = this.g.R * this.dil;
    return dx * dx + dy * dy < r * r;
  }

  /* ---------- rendering ---------- */
  draw() {
    const { ctx, W, H } = this;
    const p = this.params, COL = this.COL, g = this.g;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dim = 0.22 + 0.78 * this.awake;
    const TINT = this.color();
    const clar = this.clar;
    const lensR = g.R * this.dil;
    const shk = this.shake > 0 ? (this.rng() - 0.5) * this.shake * 6 : 0;
    const gcx = this.cx + shk;
    const gcy = this.cy + (this.shake > 0 ? (this.rng() - 0.5) * this.shake * 4 : 0);
    const dark = this.blackoutK;

    /* ---- the world outside the lens: same field, defocused ---- */
    const outA = (1 - 0.9 * dark) * dim;
    for (const q of this.field) {
      if (this._inLens(q.x, q.y)) continue;
      const c = hexLerp(q.hue, '#647089', 0.62);
      ctx.beginPath(); ctx.arc(q.x, q.y, 4.4, 0, TAU);
      ctx.fillStyle = hexA(c, 0.05 * outA); ctx.fill();
      ctx.beginPath(); ctx.arc(q.x, q.y, 2.1, 0, TAU);
      ctx.fillStyle = hexA(c, 0.10 * outA); ctx.fill();
    }

    /* ---- radiant halo: an extraverted chamber bleeds light outward ---- */
    const halo = ctx.createRadialGradient(gcx, gcy, lensR * 0.96, gcx, gcy, lensR * 1.65);
    halo.addColorStop(0, hexA(TINT, (0.10 + 0.10 * clar + 0.10 * this.lockFlash) * dim * (1 - dark) * this.opts.coreGlow));
    halo.addColorStop(1, hexA(TINT, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, W, H);

    /* ---- the world inside the lens: crisp, saturated, trailed ---- */
    ctx.save();
    ctx.beginPath(); ctx.arc(gcx, gcy, lensR, 0, TAU); ctx.clip();

    /* full-contact clarity floor: the interior reads a shade *cleaner*
       than the page, not darker */
    const ig = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, lensR);
    ig.addColorStop(0, hexA(TINT, 0.035 * clar * dim * (1 - dark)));
    ig.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = ig;
    ctx.fillRect(gcx - lensR, gcy - lensR, lensR * 2, lensR * 2);

    const inA = (1 - 0.96 * dark) * dim;
    ctx.lineCap = 'round';
    for (const q of this.field) {
      if (!this._inLens(q.x, q.y)) continue;
      const sat = hexLerp(q.hue, TINT, q.hue === '#8a93a8' ? 0.15 : 0.30);
      const tw = 0.7 + 0.3 * Math.sin(this.t * 2.3 + q.tw);
      const a = (0.5 + 0.45 * tw) * clar * inA;
      /* motion trail — the lens renders velocity, not just position */
      if (q.mover || Math.abs(q.vx) + Math.abs(q.vy) > 26) {
        ctx.beginPath();
        ctx.moveTo(q.x - (q.x - q.px) * 3.2, q.y - (q.y - q.py) * 3.2);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = hexA(sat, a * 0.5);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(q.x, q.y, q.size * (1 + 0.5 * q.flare), 0, TAU);
      ctx.fillStyle = hexA(sat, clamp(a + q.flare * 0.4, 0, 1));
      ctx.fill();
      if (q.mover && clar > 0.5) {
        ctx.beginPath(); ctx.arc(q.x, q.y, q.size * 0.45, 0, TAU);
        ctx.fillStyle = hexA('#ffffff', a * 0.85);
        ctx.fill();
      }
      if (q.flare > 0.02) {
        ctx.beginPath(); ctx.arc(q.x, q.y, 5 + (1 - q.flare) * 12, 0, TAU);
        ctx.strokeStyle = hexA(sat, q.flare * 0.5 * inA);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    /* events */
    for (const ev of this.events) {
      if (ev.dead || ev.ghostTwin) continue;
      if (ev.kind === 'window') { this._drawWindow(ev, dim, dark); continue; }
      const age = this.t - ev.born;
      const k = clamp(age / ev.life, 0, 1);
      if (ev.kind === 'flare' || ev.kind === 'flicker') {
        const hopX = ev.kind === 'flicker' ? Math.sin(age * 22 + ev.hop) * 3 * (1 - k) : 0;
        ctx.beginPath();
        ctx.arc(ev.x + hopX, ev.y, ev.r * (1 - 0.4 * k), 0, TAU);
        ctx.fillStyle = hexA(ev.col, (0.85 - 0.6 * k) * inA);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ev.x, ev.y, ev.r + 8 + k * 14, 0, TAU);
        ctx.strokeStyle = hexA(ev.col, (1 - k) * 0.35 * inA);
        ctx.lineWidth = 1;
        ctx.stroke();
      } else if (ev.kind === 'dart') {
        ctx.beginPath();
        ctx.moveTo(ev.x - ev.vx * 0.09, ev.y - ev.vy * 0.09);
        ctx.lineTo(ev.x, ev.y);
        ctx.strokeStyle = hexA(ev.col, 0.8 * inA);
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }
      /* a Ti-fed lock reads its target to the millimetre */
      if (ev.locked && this.feeder && this.feeder.focus >= 0.9 && this.t - ev.lockAt < 0.9) {
        ctx.fillStyle = hexA(this.feeder.color, 0.8 * inA);
        ctx.font = `600 8px ${HUD_FONT}`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`Δ ${(ev.hop * 1.7 + 0.4).toFixed(1)} mm`, ev.x + 10, ev.y - 8);
      }
    }

    ctx.restore(); /* unclip */

    /* ghost twins live outside the clip — the unseen version of the event */
    for (const ev of this.events) {
      if (!ev.ghostTwin || ev.dead) continue;
      const age = this.t - ev.born;
      const k = clamp(age / ev.life, 0, 1);
      const hopX = Math.sin(age * 22 + ev.hop) * 3 * (1 - k);
      const c = hexLerp(ev.col, '#647089', 0.62);
      ctx.beginPath(); ctx.arc(ev.x + hopX, ev.y, 4.5, 0, TAU);
      ctx.fillStyle = hexA(c, (0.20 - 0.12 * k) * dim); ctx.fill();
    }

    /* tracers: perception reaching out to touch what it sees */
    for (const tr of this.tracers) {
      const e = ss(tr.p);
      const x = lerp(tr.x0, tr.x1, e), y = lerp(tr.y0, tr.y1, e);
      const xb = lerp(tr.x0, tr.x1, Math.max(0, e - 0.14)), yb = lerp(tr.y0, tr.y1, Math.max(0, e - 0.14));
      ctx.beginPath();
      ctx.moveTo(xb, yb); ctx.lineTo(x, y);
      ctx.strokeStyle = hexA(tr.col, 0.7 * (1 - tr.p * 0.5) * dim);
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU);
      ctx.fillStyle = hexA('#ffffff', 0.8 * (1 - tr.p) * dim);
      ctx.fill();
    }

    /* ---- blackout veil: the world, gone ---- */
    if (dark > 0.01) {
      ctx.fillStyle = `rgba(4,5,10,${(0.62 * dark).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    /* afterimages — the entirety of what Se keeps, and for how long */
    for (const gh of this.ghosts) {
      const a = clamp(1 - gh.age / gh.max, 0, 1);
      ctx.beginPath();
      ctx.arc(gh.x, gh.y, gh.r + gh.age * 10, 0, TAU);
      ctx.strokeStyle = hexA(TINT, a * 0.4 * dim);
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath(); ctx.arc(gh.x, gh.y, 2, 0, TAU);
      ctx.fillStyle = hexA('#ffffff', a * 0.5 * dim);
      ctx.fill();
      if (gh.siTag) {
        /* the stratum its sibling would have kept */
        const drift = gh.age * 26;
        const mx = gh.x + drift * 0.8, my = gh.y + drift * 0.5;
        ctx.beginPath(); ctx.arc(mx, my, 1.6, 0, TAU);
        ctx.fillStyle = hexA(COL.s, a * 0.9);
        ctx.fill();
        ctx.fillStyle = hexA(COL.muted, a * 0.9);
        ctx.font = `600 9px ${HUD_FONT}`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('→ Si', mx + 6, my);
      }
    }

    /* ---- the iris: an open ring that is mostly gap ---- */
    ctx.save();
    ctx.translate(gcx, gcy);
    const NB = g.blades;
    const rot = this.t * 0.02;
    const heat = this.chainHeat;
    for (let i = 0; i < NB; i++) {
      const a0 = rot + (i / NB) * TAU;
      const a1 = a0 + (TAU / NB) * g.span;
      const bladeTint = heat > 0.03 ? hexLerp(TINT, '#ff5040', heat * 0.5) : TINT;
      ctx.beginPath(); ctx.arc(0, 0, lensR, a0, a1);
      ctx.strokeStyle = hexA(bladeTint, 0.10 * dim); ctx.lineWidth = 7; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, lensR, a0, a1);
      ctx.strokeStyle = hexA(bladeTint, (0.40 + 0.25 * this.lockFlash) * dim); ctx.lineWidth = 2.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, lensR, a0, a1);
      ctx.strokeStyle = hexA(hexLerp(bladeTint, '#ffffff', 0.4), (0.5 + 0.3 * clar) * dim); ctx.lineWidth = 1.1; ctx.stroke();
    }
    if (this.pulseT > 0.01) {
      ctx.beginPath(); ctx.arc(0, 0, lensR * 1.05, 0, TAU);
      ctx.strokeStyle = hexA(this.pulseColor, this.pulseT * 0.7); ctx.lineWidth = 2.4; ctx.stroke();
    }

    /* verdicts carry an icon and a word, never colour alone */
    for (const b of this.badges) {
      const a = clamp(1.3 - b.age / 1.7, 0, 1) * dim;
      const y = b.y - b.age * 18;
      const col = b.ok === true ? VERDICT.good : b.ok === false ? VERDICT.bad : COL.muted;
      ctx.beginPath();
      ctx.arc(b.x, y, 7, 0, TAU);
      ctx.fillStyle = hexA(col, a * 0.95);
      ctx.fill();
      ctx.fillStyle = hexA('#ffffff', a);
      ctx.font = `700 9px ${HUD_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.ok === true ? '✓' : b.ok === false ? '✕' : '·', b.x, y + 0.5);
      ctx.textAlign = 'left';
      ctx.fillStyle = hexA(col, a);
      ctx.font = `600 10px ${HUD_FONT}`;
      ctx.fillText(b.label, b.x + 11, y + 0.5);
    }
    ctx.restore();

    /* ---- the gaze reticle ---- */
    const gz = this.gaze;
    const lockNow = !!this.lockEv;
    const rr = lockNow ? 9 : 13;
    const rc = lockNow ? '#ffffff' : TINT;
    const ra = (lockNow ? 0.9 : 0.55) * dim * (1 - 0.7 * dark);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = hexA(rc, ra);
    for (const [s0, s1] of [[0.15, 1.35], [Math.PI + 0.15, Math.PI + 1.35]]) {
      ctx.beginPath(); ctx.arc(gz.x, gz.y, rr, s0 + this.t * 0.8, s1 + this.t * 0.8); ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * TAU + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(gz.x + Math.cos(a) * (rr + 2), gz.y + Math.sin(a) * (rr + 2));
      ctx.lineTo(gz.x + Math.cos(a) * (rr + 6), gz.y + Math.sin(a) * (rr + 6));
      ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(gz.x, gz.y, 1.6, 0, TAU);
    ctx.fillStyle = hexA(rc, ra); ctx.fill();
    if (this.lockFlash > 0.02) {
      ctx.beginPath(); ctx.arc(gz.x, gz.y, rr + (1 - this.lockFlash) * 16, 0, TAU);
      ctx.strokeStyle = hexA('#ffffff', this.lockFlash * 0.7 * dim);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    if (p.noise > 0.05) {
      const n = Math.round(p.noise * 46);
      ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(gcx + (this.rng() - 0.5) * lensR * 2.4, gcy + (this.rng() - 0.5) * lensR * 2.4, 1.4, 1.4);
      }
    }

    if (this.opts.hud) this.drawHUD(TINT, dim);
  }

  _drawWindow(ev, dim, dark) {
    const ctx = this.ctx;
    const open = ev.openFrac !== undefined ? ev.openFrac : 1;
    const half = ev.open0 * open;
    const shut = open <= 0.02;
    const wallTint = shut ? this.COL.crit : '#4fc9e0';
    const a = (1 - 0.8 * dark) * dim;
    /* the two walls, closing on the gap */
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ev.x, ev.y, ev.wr, ev.gapDir + half, ev.gapDir - half + TAU);
    ctx.strokeStyle = hexA(wallTint, 0.75 * a);
    ctx.stroke();
    /* gap edge ticks */
    if (!shut) {
      for (const s of [half, -half]) {
        const ax = ev.x + Math.cos(ev.gapDir + s) * ev.wr, ay = ev.y + Math.sin(ev.gapDir + s) * ev.wr;
        ctx.beginPath(); ctx.arc(ax, ay, 2.2, 0, TAU);
        ctx.fillStyle = hexA('#ffffff', 0.9 * a);
        ctx.fill();
      }
    }
    /* the response in flight */
    if (ev.fired && !ev.resolved && ev.trFrom) {
      const e = ss(clamp((this.t - ev.fireAt) / ev.travel, 0, 1));
      const x = lerp(ev.trFrom.x, ev.x, e), y = lerp(ev.trFrom.y, ev.y, e);
      const xb = lerp(ev.trFrom.x, ev.x, Math.max(0, e - 0.1)), yb = lerp(ev.trFrom.y, ev.y, Math.max(0, e - 0.1));
      ctx.beginPath(); ctx.moveTo(xb, yb); ctx.lineTo(x, y);
      ctx.strokeStyle = hexA('#ffffff', 0.85 * a); ctx.lineWidth = 2; ctx.stroke();
    }
    if (ev.resolved && ev.result === 'hit') {
      const k = clamp((this.t - ev.born - ev.life * (1 - ev.openFrac)) * 2, 0, 1);
      ctx.beginPath(); ctx.arc(ev.x, ev.y, 4 + k * 10, 0, TAU);
      ctx.strokeStyle = hexA('#ffffff', (1 - k) * 0.8 * a); ctx.lineWidth = 1.4; ctx.stroke();
    }
  }

  /** Te keeps score in public; Se's readout is contact — milliseconds to
      lock, catches against misses, and how much world is coming through. */
  drawHUD(TINT, dim) {
    const ctx = this.ctx, s = this.opts.hudScale;
    const x = 16, y = 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = hexA(this.COL.muted, 0.85);
    ctx.font = `600 ${9 * s}px ${HUD_FONT}`;
    ctx.fillText('CONTACT', x, y);

    let big = 'LIVE', bigCol = TINT;
    if (this.blackoutK > 0.5) { big = 'DARK'; bigCol = this.COL.crit; }
    else if (this.t < this.missUntil) { big = 'LATE'; bigCol = this.COL.warn; }
    else if (this.lockEv) { big = 'LOCK'; bigCol = '#ffffff'; }
    else if (this.hunger > 0.55) { big = 'HUNTING'; bigCol = this.COL.warn; }
    ctx.fillStyle = hexA(bigCol, 0.35 + 0.6 * dim);
    ctx.font = `700 ${17 * s}px ${HUD_FONT}`;
    ctx.fillText(big, x, y + 19 * s);

    ctx.fillStyle = hexA(this.COL.ink2, 0.6);
    ctx.font = `500 ${10 * s}px ${HUD_FONT}`;
    ctx.fillText(`lock ${this.lockMs === null ? '—' : this.lockMs + ' ms'} · caught ${this.caught}/${this.caught + this.missed}`, x, y + 34 * s);
    ctx.fillStyle = hexA(this.COL.muted, 0.75);
    ctx.fillText(`field ${Math.round(this.iEff * 100)}% · clarity ${Math.round(this.clar * 100)}%`, x, y + 46 * s);

    const cw = 7 * s, gp = 2.5 * s, cells = 16;
    for (let i = 0; i < cells; i++) {
      const on = this.clar * cells > i;
      ctx.fillStyle = hexA(on ? TINT : this.COL.axis, on ? 0.85 : 0.5);
      ctx.fillRect(x + i * (cw + gp), y + 53 * s, cw, 3.5 * s);
    }
    if (this.stackLabel) {
      ctx.font = `600 ${9.5 * s}px ${HUD_FONT}`;
      ctx.fillStyle = hexA(this.stackLatency > 200 ? this.COL.warn : this.COL.ink2, 0.9);
      ctx.fillText(`responding from: ${this.stackLabel} (+${this.stackLatency} ms)`, x, y + 68 * s);
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
