/* ============================================================
   CURRENTS · FeGlyph — The Resonance Field (the Concord Ring)
   Fe as a field instrument: a ring of independent oscillators
   standing OUTSIDE the chamber — other people — coupled to each
   other by a lattice Fe draws between them, and driven toward a
   common phase by conducting impulses that leave the nucleus and
   cross the rim's gap.

   The load-bearing inversion, against Fi:
     Fi's perimeter is computed from its centre.
     Fe's centre is computed from its perimeter.
   The nucleus has no intrinsic colour. Its hue is the amplitude-
   weighted circular mean of whoever is currently in the ring and
   its saturation tracks their presence, so an emptied ring leaves
   the glyph literally grey — the mean of an empty set.

   Nothing here is choreographed. The room is a Kuramoto model:

     dθᵢ/dt = ωᵢ
            + (K/N)·Σ Aᵢⱼ·aⱼ·sin(θⱼ_read − θᵢ)   peer coupling
            + Kc·gᵢ·σ·sin(ψ_delayed − θᵢ)        Fe conducting
            + noise·ξᵢ

   and every Zone D scenario is a mutation of {ω, A, a, δ, presence,
   K, Kc} — no scenario touches the renderer.

   Fe reads a different field than the one it acts on. Each node
   carries a presentation offset δ (the mask) and Fe adds its own
   per-node read bias scaled by (1 − fidelity), so the order
   parameter it BELIEVES and the one that is actually true come
   apart. That single mechanism drives covert hostility in Zone D,
   shadow-slot misreading in Zone B, and the trust-gap readout.

   Shape grammar (§1.3): judging → hexagonal chamber with a
   lattice, but Fe's lattice is drawn OUTSIDE its own rim, between
   the nodes. Extraverted → open ring (a live gap that rotates to
   face the loudest node), a halo that bleeds past the boundary and
   physically reaches the carriers, and particles emitted into the
   environment rather than orbiting within.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';
import { FeState } from './fe-state.js';

const HUD_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/* room defaults — the equilibrium every scenario relaxes back toward */
const ROOM0 = { K: 0.44, crossA: 1, KcMul: 1, presence: 1 };

/* scenario durations, seconds. Deadlock is the one event that does not
   resolve itself: an unresolvable conflict stays unresolved until the
   user does something about it. */
const DUR = {
  sync: 2.8, celebrate: 9.0, reconcile: 7.5,
  covert: 11.0, deadlock: Infinity, isolate: 12.0,
};

const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** shortest signed angular difference, a − b, wrapped to ±π */
function angDiff(a, b) {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}
const angLerp = (a, b, t) => a + angDiff(b, a) * t;
/** shortest-path interpolation between two hues, in degrees */
function hueLerp(a, b, t) {
  let d = (b - a) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return a + d * t;
}

function hsl2rgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return { r: f(0), g: f(8), b: f(4) };
}
const rgba = (c, a) => `rgba(${c.r},${c.g},${c.b},${a})`;

/** Read the page's color palette once (call after CSS is loaded) */
export function readCOL() {
  return {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
    ghost: CSSVAR('--fe-ghost') || '#7f5fd0',
    nul: CSSVAR('--fe-null') || '#150d1c',
    hueLo: parseFloat(CSSVAR('--fe-hue-lo')) || 322,
    hueHi: parseFloat(CSSVAR('--fe-hue-hi')) || 368,
  };
}

export class FeGlyph {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign(
      { interactive: true, coreGlow: 1, seed: 11, hud: true, hudScale: 1, supply: 1 },
      opts
    );
    this.COL = opts.COL || readCOL();
    if (this.COL.hueLo === undefined) Object.assign(this.COL, { hueLo: 322, hueHi: 368, ghost: '#7f5fd0', nul: '#150d1c' });
    this.rng = mulberry32(this.opts.seed);
    this.params = { scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 };
    this.target = { ...this.params };
    this.feeder = null;
    this.fcfg = {};
    this.structure = { countMul: 1, k: 3, rigidity: 0.4 };

    /* the unified state stream — DOM telemetry adapters subscribe here */
    this.state = opts.state || new FeState();

    /* ---- the room ---- */
    this.N = 7;
    this.nodes = [];
    this._buildNodes(this.N);
    this.room = { ...ROOM0 };
    this.roomT = { ...ROOM0 };
    this._clustered = false;

    /* ---- published field quantities ---- */
    this.R = 0.62;        /* order parameter over TRUE phases */
    this.psi = 0;         /* mean phase — the room's mood */
    this.believed = 0.62; /* order parameter over what Fe can read */
    this.trust = 0.03;    /* |believed − R| : the size of the misreading */
    this.effort = 0.14;   /* conducting energy spent right now */
    this.split = 0;       /* bimodality: two clusters locked antiphase */
    this.diff = 0.55;     /* differentiation: surviving individual variation */
    this.presence = 1;    /* how much of the ring is still there */
    this.costU = 0;       /* accumulated conducting cost, energy units */

    /* ---- presentation eases ---- */
    this.gateA = -Math.PI / 2;
    this.haloA = 0.38;
    this.hue = 345; this.sat = 0.62;
    this.wavefront = 0;
    this.syncNode = null;
    this.impulses = [];
    this.pulseT = 0; this.pulseColor = '#ffffff';

    /* ---- machinery ---- */
    this.fx = null;
    this.rampK = 1.6;
    this.conductGate = 1; this.conductGateT = 1;
    this._psiBuf = [];
    this._dutyPhase = 0; this._window = -1;
    this._emitAcc = 0; this._biasAcc = 0; this._bombAcc = 0; this._driftAcc = 0;
    this.bombard = false;
    this.steered = false;
    this.pointer = { x: null, y: null };
    this.hoverNode = null;
    this.t = 0;

    this.dpr = Math.min(devicePixelRatio || 1, 2);
    /* seeded before the first measure so a canvas that is still 0×0 at
       construction (hidden tab, pre-layout) can never put a NaN into geom() */
    this.W = 1; this.H = 1; this.cx = 0.5; this.cy = 0.5; this.baseR = 1;
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);

    if (this.opts.interactive) {
      canvas.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        this.pointer.x = e.clientX - r.left;
        this.pointer.y = e.clientY - r.top;
        this.steered = true;
        if (REDUCED) { this.step(1 / 30); this.draw(); }
      });
      canvas.addEventListener('pointerleave', () => {
        this.pointer.x = this.pointer.y = null;
        this.hoverNode = null;
      });
    }

    this.g = this.geom();
    if (REDUCED) this.renderStatic();
  }

  _resize() {
    const r = this.cv.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.cv.width = r.width * this.dpr;
    this.cv.height = r.height * this.dpr;
    this.W = r.width; this.H = r.height;
    this.cx = this.W / 2; this.cy = this.H / 2;
    /* 0.30 rather than the usual 0.38: the carrier ring sits at 1.28× and
       the halo at 1.55×, and both have to stay on the canvas */
    this.baseR = Math.min(this.W, this.H) * 0.30;
    this.g = this.geom();
    if (REDUCED) this.renderStatic();
  }

  geom() {
    const R = this.baseR * this.params.scale;
    return {
      R,
      rim:  R * 0.94,
      core: R * 0.16,
      ring: R * 1.28,                         /* the carriers — outside the chamber */
      halo: R * (1.15 + 0.55 * this.R),       /* the coupling medium, reaching them */
      lam:  R * 0.19,                         /* fringe wavelength */
    };
  }

  /* ---------- the carriers ---------- */
  /** Unit-variance gaussian, Irwin–Hall with n=3. The sum of three uniforms
      has variance 3/12, so the normalizing factor is 2 — every parameter
      scaled by this (read bias, mood drift, §3.1 noise) is calibrated
      against σ=1. */
  _gauss() { return (this.rng() + this.rng() + this.rng() - 1.5) * 2; }

  _mkNode(i, n, temp = false) {
    const rng = this.rng;
    const hue = this.COL.hueLo + rng() * (this.COL.hueHi - this.COL.hueLo);
    const node = {
      jit: (rng() - 0.5) * 0.16,
      an: (i / n) * TAU - Math.PI / 2,
      th: rng() * TAU,
      w: 0.55 + (rng() - 0.5) * 0.60,
      a: 0.62 + rng() * 0.3,
      hue,
      /* baselines the room relaxes back toward */
      w0: 0, a0: 0, hue0: hue,
      wT: 0, aT: 0, hueT: hue,
      delta: 0, mask: 0, maskT: 0,     /* the presentation offset */
      bias: 0,                          /* Fe's persistent misreading of THIS person */
      /* how reachable they are by conducting. The wide floor is deliberate:
         not everyone in a room is movable by one person, and it is the
         hard-to-reach carriers that keep an idle field from simply locking */
      g: 0.12 + rng() * 0.78,
      cluster: 0,
      alive: 1, aliveT: 1, fadeDelay: 0,
      phantom: false, temp, hostile: false,
      hist: 0,                          /* Si feeder: their stored phase */
      stale: 0,                         /* Te feeder: last-known phase */
      flash: 0, probe: 0, sigma: 1,
    };
    node.w0 = node.wT = node.w;
    node.a0 = node.aT = node.a;
    node.hist = node.stale = node.th;
    if (temp) { node.alive = 0; node.aliveT = 1; }
    return node;
  }

  _buildNodes(n) {
    this.rng = mulberry32(this.opts.seed);
    this.nodes = [];
    for (let i = 0; i < n; i++) this.nodes.push(this._mkNode(i, n));
    this._reflow();
    this._neighbours();
  }

  /** Re-space the ring after the population changes */
  _reflow() {
    const live = this.nodes.filter((n) => !n.phantom);
    live.forEach((n, i) => { n.an = (i / live.length) * TAU - Math.PI / 2 + n.jit; });
    const ph = this.nodes.filter((n) => n.phantom);
    ph.forEach((n, i) => { n.an = (i / Math.max(1, ph.length)) * TAU - Math.PI / 2 + 0.4 + n.jit; });
  }

  /** k nearest ring-neighbours per node — the coupling graph the maturity
      slider densifies with age */
  _neighbours() {
    /* during a reconciliation the lattice bridges every pair — the visible
       densification is the bridge being built */
    const k = this._bridge ? this.nodes.length : clamp(this.structure.k, 1, 5);
    for (const n of this.nodes) {
      n.nb = this.nodes
        .filter((m) => m !== n && !m.phantom)
        .sort((a, b) => Math.abs(angDiff(a.an, n.an)) - Math.abs(angDiff(b.an, n.an)))
        .slice(0, k);
    }
  }

  _loudest() {
    let best = this.nodes[0];
    for (const n of this.nodes) if (!n.phantom && n.a * n.alive > best.a * best.alive) best = n;
    return best;
  }

  _np(n) {
    const g = this.g;
    return { x: this.cx + Math.cos(n.an) * g.ring, y: this.cy + Math.sin(n.an) * g.ring };
  }

  _nodeRGB(n) {
    return hsl2rgb(n.hue, n.hostile && n.revealed > 0.5 ? 0.5 : 0.68, 0.62);
  }

  /* ---------- shared glyph API (rail & feeder modules depend on this) ---------- */
  setTarget(p) {
    Object.assign(this.target, { contrary: 0 }, p);
    if (REDUCED) { Object.assign(this.params, this.target); this.g = this.geom(); this.renderStatic(); }
  }

  setStructure(s) {
    const next = Object.assign({}, this.structure, s);
    const changed = next.countMul !== this.structure.countMul || next.k !== this.structure.k;
    this.structure = next;
    /* with age Fe holds a larger room, reads more of it at once, and the
       spread of moods it has to reconcile damps down */
    const want = clamp(Math.round(4 + (next.countMul - 0.75) * 7), 4, 10);
    if (changed) {
      const live = this.nodes.filter((n) => !n.phantom);
      while (live.length < want) { const nd = this._mkNode(live.length, want); this.nodes.push(nd); live.push(nd); }
      while (live.length > want) { const nd = live.pop(); this.nodes.splice(this.nodes.indexOf(nd), 1); }
      this._reflow();
      this._neighbours();
    }
    for (const n of this.nodes) {
      n.wT = n.w0 = 0.55 + (n.w0 - 0.55) * (1 - 0.5 * next.rigidity);
    }
    if (changed && REDUCED) this.renderStatic();
  }

  setFeeder(f) {
    this.feeder = f;
    this.fcfg = f || {};
    this.fx = null;
    this._relaxRoom();
    this._clustered = false;
    this.impulses = [];
    /* every feeder changes the room's composition, not just its tint */
    const want = clamp(this.fcfg.nodes || 7, 4, 12);
    const live = this.nodes.filter((n) => !n.phantom);
    while (live.length < want) { const nd = this._mkNode(live.length, want); this.nodes.push(nd); live.push(nd); }
    while (live.length > want) { const nd = live.pop(); this.nodes.splice(this.nodes.indexOf(nd), 1); }
    /* Ne feeds Fe people who are not in the room */
    this.nodes = this.nodes.filter((n) => !n.phantom);
    if (this.fcfg.phantom) for (let i = 0; i < 3; i++) this._spawnPhantom(i);
    this._reflow();
    this._neighbours();
    if (REDUCED) this.renderStatic();
  }

  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  color() { return this.COL.fn; }

  /* legacy readouts other code may probe */
  get stress() { return this.state.v.stress; }
  set stress(v) { this.state.v.stress = this.state.tv.stress = clamp(v, 0, 1); }
  get pleasure() { return this.state.v.pleasure; }
  set pleasure(v) { this.state.v.pleasure = this.state.tv.pleasure = clamp(v, 0, 1); }

  _spawnPhantom(i) {
    const nd = this._mkNode(i, 3, false);
    nd.phantom = true;
    nd.alive = 0; nd.aliveT = 0.4;
    nd.a = nd.a0 = nd.aT = 0.5;
    nd.an = -Math.PI / 2 + 0.4 + (i / 3) * TAU;
    this.nodes.push(nd);
    return nd;
  }

  /* ============================================================
     Zone D — the scenarios. Each is a mutation of {ω, A, a, δ,
     presence, K, Kc} and nothing else; the renderer reads the
     simulation, never the scenario.
     ============================================================ */
  scenario(key, impact = {}) {
    if (key === 'reconcile' && this.split < 0.4) return false;
    /* the cost readout is per-event, so the narration's comparison —
       four units for a reconciliation against under half for a sync —
       is a thing the user can actually read off the panel */
    this.costU = 0;
    this.state.impulse(impact);
    this.state.clearFlags();
    this.state.flags[key] = true;
    this._apply(key);
    return true;
  }

  _relaxRoom() {
    this.roomT = { ...ROOM0 };
    for (const n of this.nodes) {
      n.wT = n.w0; n.aT = n.a0; n.hueT = n.hue0;
      n.maskT = 0; n.fadeDelay = 0;
      n.hostile = false; n.cluster = 0;
      /* people a scenario brought in — extra celebrants, and the phantoms
         rumination invented — leave again when it ends. Only the standing
         ring persists. */
      n.aliveT = (n.phantom || n.temp) ? 0 : 1;
    }
    this.conductGateT = 1;
    this.rampK = 1.6;
    if (this._bridge) { this._bridge = false; this._neighbours(); }
  }

  /** Drop scenario-scoped carriers once they have faded out */
  _cull() {
    const before = this.nodes.length;
    this.nodes = this.nodes.filter((n) => !((n.phantom || n.temp) && n.aliveT === 0 && n.alive < 0.02));
    if (this.nodes.length !== before) { this._reflow(); this._neighbours(); }
  }

  _apply(key) {
    /* reconcile is the one scenario that operates ON the existing field
       rather than replacing it — it needs the split it is resolving */
    if (key !== 'reconcile') { this._relaxRoom(); this._clustered = false; }
    this.fx = { key, t: 0, locked: false, phantomed: false };
    const live = this.nodes.filter((n) => !n.phantom);

    switch (key) {
      case 'sync': {
        const m = this._loudest();
        m.th += 0.42;
        this.syncNode = m;
        /* no conducting impulse is issued — this is the whole point */
        this.conductGateT = 0;
        this.costU += 0.4;
        break;
      }
      case 'celebrate': {
        const want = 12;
        while (this.nodes.filter((n) => !n.phantom).length < want) {
          this.nodes.push(this._mkNode(this.nodes.length, want, true));
        }
        this._reflow(); this._neighbours();
        const all = this.nodes.filter((n) => !n.phantom);
        const wbar = all.reduce((s, n) => s + n.w0, 0) / all.length;
        const hbar = this._meanHue();
        /* the arrivals join the room already in it — a celebration does not
           begin with five strangers being dragged into phase */
        for (const n of all) if (n.temp) n.th = this.psi + (this.rng() - 0.5) * 0.5;
        for (const n of all) {
          n.aT = 0.95;
          n.wT = wbar + (this.rng() - 0.5) * 0.08;
          n.hueT = hueLerp(n.hue0, hbar, 0.88);
        }
        this.roomT.K = 1.35;
        this.costU += 1.8;
        break;
      }
      case 'reconcile': {
        const wbar = live.reduce((s, n) => s + n.w0, 0) / Math.max(1, live.length);
        for (const n of live) n.wT = wbar;
        this.roomT.crossA = 1;
        this.roomT.K = 1.1;
        /* Flipping the sign on cross-coupling is not enough: two rigid
           halves pinned at π sit on a symmetric point that attraction alone
           escapes only very slowly, and they touch through two boundary
           edges. What breaks it is Fe conducting — a single common target
           that both halves get dragged toward — so the authority goes up
           hard and the lattice bridges all-to-all for the duration. That is
           also the honest mechanism: this is the room being pulled together
           by someone, not resolving itself. */
        this.roomT.KcMul = 2.8;
        this._bridge = true;
        this._neighbours();
        /* the room does not turn on a dime — a couple of seconds of full
           effort against a field that has not moved yet */
        this.rampK = 0.55;
        this.costU += 4.2;
        break;
      }
      case 'covert': {
        /* two nodes present perfect agreement while their true phase walks
           to the far side of the circle */
        const picks = [live[1 % live.length], live[(Math.floor(live.length / 2) + 1) % live.length]];
        for (const n of picks) { if (!n) continue; n.maskT = 1; n.wT = n.w0 + 0.9; n.hostile = true; }
        this.costU += 1.1;
        break;
      }
      case 'deadlock': {
        this._clustered = true;
        /* Cluster by ring position, not array order: peer coupling runs
           between ring neighbours, so interleaved clusters would never lock
           internally and the split would never open. A room divides into two
           sides, which is also how it looks. */
        const byRing = live.slice().sort((a, b) => a.an - b.an);
        const half = Math.ceil(byRing.length / 2);
        /* Matched frequencies, strongly repulsive cross-coupling. Detuning
           the two halves instead would make them BEAT — drifting through
           alignment every few seconds and resolving themselves, which is the
           opposite of the lesson. Equal ω plus repulsion pins them at π: a
           standing antiphase state with a stable null, and a mean phase so
           weakly defined that conducting into it accomplishes nothing. */
        const wcom = live.reduce((s, n) => s + n.w0, 0) / Math.max(1, live.length);
        const base = this.psi;
        byRing.forEach((n, i) => {
          n.cluster = i < half ? 0 : 1;
          n.wT = n.w = wcom + (this.rng() - 0.5) * 0.06;
          /* Seed the antiphase rather than waiting for repulsion to create
             it: escaping the in-phase state is exponentially slow, and a
             room that takes half a minute to divide reads as nothing
             happening. The repulsion's job is to HOLD the division. */
          n.th = base + (n.cluster ? Math.PI : 0) + (this.rng() - 0.5) * 0.35;
        });
        this.roomT.crossA = -1.4;
        this.roomT.K = 1.4;
        break;
      }
      case 'isolate': {
        this.roomT.presence = 0.1;
        live.forEach((n, i) => { n.aliveT = 0.06; n.fadeDelay = i * 0.35; });
        this.costU += 2.6;
        break;
      }
    }
  }

  _meanHue() {
    let x = 0, y = 0, w = 0;
    for (const n of this.nodes) {
      if (n.phantom) continue;
      const wt = n.a * n.alive, r = n.hue * Math.PI / 180;
      x += Math.cos(r) * wt; y += Math.sin(r) * wt; w += wt;
    }
    if (w < 1e-6) return 345;
    return Math.atan2(y, x) * 180 / Math.PI;
  }

  /** scenario choreography — staged beats, and the relax back to baseline */
  _fx(dt) {
    const f = this.fx;
    if (!f) return;
    f.t += dt;

    /* Fe conducts nothing for the whole beat: the match is a read, not an
       intervention, and the effort meter has to stay flat to say so */
    if (f.key === 'sync' && f.t > 2.4) this.conductGateT = 1;

    if (f.key === 'isolate') {
      /* the longer the emptiness holds, the worse it gets */
      this.state.impulse({ stress: 0.02 * dt });
      if (f.t > 5 && !f.phantomed) {
        f.phantomed = true;
        /* an orchestration engine that cannot idle invents an audience */
        for (let i = 0; i < 3; i++) this._spawnPhantom(i);
        this._neighbours();
      }
    }

    if (f.key === 'reconcile' && !f.locked && this.R > 0.78 && f.t > 2.6) {
      f.locked = true;
      /* the lock is not a light cue over an unchanged field — the clusters
         genuinely dissolve here, so the null closes and stays closed */
      this._clustered = false;
      this.roomT.crossA = 1;
      this.roomT.KcMul = 1;
      this.rampK = 2.2;
      const live = this.nodes.filter((n) => !n.phantom);
      const wbar = live.reduce((s, n) => s + n.w, 0) / Math.max(1, live.length);
      /* the bimodality is gone for good, but the room does not become a
         crystal — everyone keeps a narrowed share of their own tempo */
      for (const n of live) { n.cluster = 0; n.w0 = wbar + (n.w0 - wbar) * 0.35; n.wT = n.w0; }
      this.wavefront = 0.0001;
      this.state.impulse({ pleasure: 0.52, stress: -0.45 });
      if (this.onLock) this.onLock();
    }

    const dur = DUR[f.key];
    if (dur !== Infinity && f.t > dur) {
      this.fx = null;
      this.syncNode = null;
      this._relaxRoom();
      this._clustered = false;
      this.state.clearFlags();
    }
  }

  /* ---------- the simulation ---------- */
  _simulate(dt) {
    const P = this.params;
    /* how fast the room accepts a new set of targets. Reconciliation slows
       this deliberately: the strain has to be visible for a couple of
       seconds with nothing improving, because that is what the work is. */
    const ease = 1 - Math.exp(-dt * this.rampK);

    /* room-level parameters ease toward their scenario targets */
    for (const k in this.roomT) this.room[k] += (this.roomT[k] - this.room[k]) * ease;

    /* per-node targets */
    for (const n of this.nodes) {
      n.w += (n.wT - n.w) * ease;
      n.a += (n.aT - n.a) * ease;
      n.hue += (n.hueT - n.hue) * ease;
      n.mask += (n.maskT - n.mask) * (1 - Math.exp(-dt * 0.9));
      if (n.fadeDelay > 0) n.fadeDelay -= dt;
      else n.alive += (n.aliveT - n.alive) * (1 - Math.exp(-dt * 1.1));
      n.flash *= Math.exp(-dt * 3.4);
      /* Si feeder: each carrier's stored phase, an EMA of who they have been */
      n.hist = angLerp(n.hist, n.th, 1 - Math.exp(-dt * 0.35));
    }

    /* Fe's read of each person drifts slowly rather than jittering frame to
       frame: a misread is a standing misunderstanding of a particular
       person, not white noise */
    this._biasAcc += dt;
    if (this._biasAcc > 2.5) {
      this._biasAcc = 0;
      for (const n of this.nodes) n.bias = this._gauss() * (1 - P.fidelity) * 1.15;
      if (this.fcfg.stale) for (const n of this.nodes) n.stale = n.th;
    }

    /* Mood drift. A room is never finished: left alone the carriers wander
       off their own baseline, so the field sits at a dynamic equilibrium
       around R ≈ 0.7 instead of locking solid and staying there. During a
       scenario the scenario owns the targets and the drift stands down. */
    this._driftAcc += dt;
    if (this._driftAcc > 1.15) {
      this._driftAcc = 0;
      if (!this.fx) {
        const damp = 1 - 0.55 * this.structure.rigidity;
        for (const n of this.nodes) {
          n.wT = clamp(n.w0 + this._gauss() * 0.30 * damp, 0.05, 1.4);
        }
      }
    }

    /* ---- 1. read the field, twice: as it is, and as Fe sees it ---- */
    let zx = 0, zy = 0, rx = 0, ry = 0, w = 0, wr = 0, alive = 0, live = 0;
    for (const n of this.nodes) {
      const wt = n.a * n.alive;
      if (!n.phantom) {
        zx += Math.cos(n.th) * wt; zy += Math.sin(n.th) * wt; w += wt;
        alive += n.alive; live++;
      }
      const shown = n.th + angDiff(this.psi, n.th) * n.mask;   /* mask=1 → displays perfect agreement */
      n.delta = angDiff(shown, n.th);
      const read = shown + n.bias + P.noise * 0.4 * this._gauss();
      rx += Math.cos(read) * wt; ry += Math.sin(read) * wt; wr += wt;
    }
    const R = w > 1e-6 ? Math.hypot(zx, zy) / w : 0;
    const psi = w > 1e-6 ? Math.atan2(zy, zx) : this.psi;
    const Rread = wr > 1e-6 ? Math.hypot(rx, ry) / wr : 0;

    this.presence = live ? alive / live : 0;
    /* Concord is scaled by presence. The raw order parameter is normalized by
       the weights, so a ring of near-dead carriers still reports near-perfect
       agreement — which would put "Concord 97%" on the panel next to a
       Severed Field chip. The coherence of an empty room is not 1. */
    this.R = lerp(this.R, R * this.presence, 1 - Math.exp(-dt * 4));
    this.psi = psi;
    /* believed is scaled by presence for the same reason concord is —
       otherwise a room walking out reads as a 65% misreading, when in fact
       Fe is not misreading anything. The gap must mean masks and read
       noise, and nothing else. */
    this.believed = lerp(this.believed, Rread * this.presence, 1 - Math.exp(-dt * 3));
    this.trust = lerp(this.trust, clamp(Math.abs(this.believed - this.R), 0, 1), 1 - Math.exp(-dt * 3));

    /* ---- 2. latency: Fe conducts toward the room it saw a while ago ---- */
    this._psiBuf.push({ t: this.t, c: Math.cos(psi), s: Math.sin(psi) });
    while (this._psiBuf.length && this._psiBuf[0].t < this.t - 2) this._psiBuf.shift();
    let psiD = psi;
    if (P.latency > 4) psiD = this._sampleBuf(this.t - P.latency / 1000);
    /* Ni feeder: conduct toward where the room is going, not where it is.
       Se feeder (the ENFJ loop): conduct toward whoever is loudest right now.
       Si feeder: conduct toward the room's own precedent. */
    if (this.fcfg.horizon) psiD += this.fcfg.horizon * this._meanW() * 0.45;
    if (this.fcfg.surface) psiD = this._loudest().th;
    /* Si: conduct toward the room as it has been. A bounded lag, not the
       absolute stored phase — the room rotates, so an un-anchored historical
       mean drifts arbitrarily far behind and pegs the effort meter for a
       coupling that is supposed to feel comfortable. */
    if (this.fcfg.history) psiD = this._sampleBuf(this.t - 1.2 * this.fcfg.history);

    /* ---- 3. the duty cycle, deterministically (replay depends on it) ---- */
    this._dutyPhase += dt / 0.9;
    const win = Math.floor(this._dutyPhase);
    if (win !== this._window) {
      this._window = win;
      for (const n of this.nodes) n.sigma = this.rng() < P.contrary ? -1 : 1;
    }
    const emitting = (this._dutyPhase % 1) < P.duty;
    this.conductGate += (this.conductGateT - this.conductGate) * (1 - Math.exp(-dt * 4));

    /* ---- 4. integrate the room ---- */
    const Kc = P.control * 0.55 * this.room.KcMul;
    const N = Math.max(1, this.nodes.length);
    let load = 0, gsum = 0;
    for (const n of this.nodes) {
      let dth = n.w;
      if (!n.phantom && n.alive > 0.05) {
        for (const m of n.nb) {
          if (m.alive < 0.05) continue;
          const A = n.cluster === m.cluster ? 1 : this.room.crossA;
          const mp = this.fcfg.stale ? m.stale : m.th + m.delta;
          dth += (this.room.K / N) * A * m.a * m.alive * Math.sin(mp - n.th);
        }
      }
      if (emitting && this.conductGate > 0.02) {
        const off = angDiff(psiD, n.th);
        /* A phantom is conducted AT and never conducted INTO: there is
           nobody there to take the nudge, so its phase free-runs while the
           effort is charged in full. Full cost, no coupling — that is the
           whole lesson of the second beat of Cut Off, and it only reads if
           the effort meter stays up instead of settling. */
        dth += Kc * n.g * n.sigma * Math.sin(off) * this.conductGate * (n.phantom ? 0 : n.alive);
        /* an invented person is disproportionately expensive precisely
           because they can never actually be satisfied */
        load += n.g * Math.abs(Math.sin(off)) * (n.phantom ? 2.2 : 1);
        gsum += n.g;
      }
      dth += P.noise * 0.7 * this._gauss();
      n.th = (n.th + dth * dt) % TAU;
    }

    /* Effort is the fraction of conducting capacity in use: how far the room
       is from where Fe is aiming it, weighted by how reachable each carrier
       is and by how much authority this stack position actually has. The
       exponent widens the gap between a room that is nearly there and one
       that is not, which is what makes the deadlock read as work. */
    const effortRaw = gsum > 1e-6
      ? clamp(Math.pow(load / gsum, 2.6) * (0.6 + 0.5 * P.control) * this.conductGate * 3.1, 0, 1)
      : 0;
    this.effort += (effortRaw - this.effort) * (1 - Math.exp(-dt * 3));

    /* ---- 5. derived channels ---- */
    this.split = lerp(this.split, this._splitOf(), 1 - Math.exp(-dt * 2.5));
    this.diff = lerp(this.diff, this._diffOf(), 1 - Math.exp(-dt * 2));

    /* conducting is priced by position: the same room costs a tertiary Fe
       three times what it costs a dominant */
    /* Cost is booked per event, so the panel comparison the narration asks
       for — four units for a reconciliation against under half for a sync —
       is readable. An idle room does not quietly inflate the last number. */
    const posMul = 1 + (1 - P.control) * 2.4;
    if (this.fx) this.costU += this.effort * dt * posMul * 0.22;

    /* stress and pleasure are read off the field, then relaxed by the store */
    const sTarget = clamp(
      0.10 + 0.42 * (1 - this.R) + 0.70 * this.trust + 0.34 * this.effort * this.effort
      + 0.30 * this.split + 0.34 * (1 - this.presence), 0, 1);
    const pTarget = clamp(0.06 + 0.72 * this.R - 0.30 * this.effort, 0, 1);
    const k = 1 - Math.exp(-dt * 0.55);
    this.state.tv.stress += (sTarget - this.state.tv.stress) * k;
    this.state.tv.pleasure += (pTarget - this.state.tv.pleasure) * k;

    this.state.publish({
      concord: this.R, believed: this.believed, trust: this.trust,
      effort: this.effort, split: this.split, diff: this.diff,
      presence: this.presence,
    });

    /* ---- 6. presentation eases ---- */
    const loud = this._loudest();
    this.gateA = angLerp(this.gateA, loud ? loud.an : this.gateA, 1 - Math.exp(-dt * 2.2));
    this.haloA += ((0.08 + 0.5 * this.R) * this.presence - this.haloA) * (1 - Math.exp(-dt * 2));
    this.hue = angLerp(this.hue * Math.PI / 180, this._meanHue() * Math.PI / 180, 1 - Math.exp(-dt * 2)) * 180 / Math.PI;
    this.sat += (0.66 * this.presence - this.sat) * (1 - Math.exp(-dt * 1.5));
    if (this.wavefront > 0) { this.wavefront += dt / 1.2; if (this.wavefront > 1) this.wavefront = 0; }
    this.pulseT = Math.max(0, this.pulseT - dt * 1.6);
  }

  _meanW() {
    const live = this.nodes.filter((n) => !n.phantom && n.alive > 0.2);
    return live.length ? live.reduce((s, n) => s + n.w, 0) / live.length : 0.55;
  }
  /** the room's mean phase as it was `at` seconds into the past */
  _sampleBuf(at) {
    if (!this._psiBuf.length) return this.psi;
    let e = this._psiBuf[0];
    for (const q of this._psiBuf) { if (q.t <= at) e = q; else break; }
    return Math.atan2(e.s, e.c);
  }
  _orderOf(list) {
    let x = 0, y = 0, w = 0;
    for (const n of list) { const wt = n.a * n.alive; x += Math.cos(n.th) * wt; y += Math.sin(n.th) * wt; w += wt; }
    return w > 1e-6 ? Math.hypot(x, y) / w : 0;
  }
  /** Two internally-coherent clusters that disagree with each other: each
      half locked, the whole thing at zero. */
  _splitOf() {
    if (!this._clustered) return 0;
    const a = [], b = [];
    for (const n of this.nodes) {
      if (n.phantom || n.alive < 0.2) continue;
      (n.cluster ? b : a).push(n);
    }
    if (!a.length || !b.length) return 0;
    return clamp((this._orderOf(a) + this._orderOf(b)) / 2 - this.R, 0, 1);
  }
  /** How much individual variation survives the harmonizing: the circular
      spread of carrier hues, normalized against the width of the hue band.
      A ring drawn uniformly across the band reads ~0.85; a celebration that
      averages every hue into one collapses it toward zero. */
  _diffOf() {
    let x = 0, y = 0, w = 0;
    for (const n of this.nodes) {
      if (n.phantom) continue;
      const wt = Math.max(n.alive, 0.001), r = n.hue * Math.PI / 180;
      x += Math.cos(r) * wt; y += Math.sin(r) * wt; w += wt;
    }
    if (w < 1e-6) return 0;
    const conc = clamp(Math.hypot(x, y) / w, 1e-6, 1);
    const stdDeg = Math.sqrt(-2 * Math.log(conc)) * 180 / Math.PI;
    const band = Math.max(6, this.COL.hueHi - this.COL.hueLo);
    return clamp(stdDeg / (band * 0.34), 0, 1);
  }

  /* ---------- conducting impulses (extraverted: emitted, never orbited) ---------- */
  _impulses(dt) {
    this._emitAcc += dt;
    const P = this.params;
    if (this._emitAcc > 0.17 && this.conductGate > 0.3 && (this._dutyPhase % 1) < P.duty) {
      this._emitAcc = 0;
      let tgt = null, worst = 0.12;
      for (const n of this.nodes) {
        if (n.alive < 0.05 && !n.phantom) continue;
        const off = Math.abs(angDiff(this.psi, n.th));
        if (off > worst) { worst = off; tgt = n; }
      }
      if (tgt) this.impulses.push({ n: tgt, t: 0, dur: 0.46, sigma: tgt.sigma });
    }
    for (const im of this.impulses) {
      im.t += dt;
      if (im.t >= im.dur && !im.done) { im.done = true; im.n.flash = 1; }
    }
    this.impulses = this.impulses.filter((im) => im.t < im.dur + 0.12);
  }

  /* ---------- pointer: the user is an eighth node ---------- */
  _pointer(dt) {
    if (!this.opts.interactive || this.pointer.x === null) { this.hoverNode = null; return; }
    let best = null, bd = 30;
    for (const n of this.nodes) {
      const p = this._np(n);
      const d = Math.hypot(p.x - this.pointer.x, p.y - this.pointer.y);
      if (d < bd) { bd = d; best = n; }
    }
    this.hoverNode = best;
    for (const n of this.nodes) {
      if (n === best) { n.probe = Math.min(1, n.probe + dt / 0.6); n.aT = Math.min(1, n.a0 + 0.25); }
      else { n.probe = Math.max(0, n.probe - dt * 2); if (!this.fx) n.aT = n.a0; }
      n.revealed = n.probe > 0.98 && this.params.fidelity > 0.55 ? 1 : 0;
    }
  }

  step(dt) {
    this.t += dt;
    const e = 1 - Math.exp(-dt * 3.2);
    for (const k in this.target) this.params[k] = lerp(this.params[k], this.target[k], e);
    this.g = this.geom();

    /* Zone B: the rail glyph runs a room that will not sit still, so the
       trust gap has something to open against */
    if (this.bombard) {
      this._bombAcc += dt;
      if (this._bombAcc > 1.4) {
        this._bombAcc = 0;
        const n = this.nodes[Math.floor(this.rng() * this.nodes.length)];
        if (n) n.th += (this.rng() - 0.5) * 1.6;
      }
    }

    this._pointer(dt);
    this._fx(dt);
    this._simulate(dt);
    this._impulses(dt);
    this._cull();
    this.state.step(dt);
  }

  /* ============================================================
     Render
     ============================================================ */
  _hexR(a, R) {
    const s = Math.PI / 3;
    const m = (((a % s) + s) % s) - s / 2;
    return R * Math.cos(s / 2) / Math.cos(m);
  }

  _hexPath(R, a0 = 0, a1 = TAU, close = true) {
    const ctx = this.ctx;
    const steps = Math.max(10, Math.round(Math.abs(a1 - a0) / 0.05));
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (a1 - a0) * (i / steps);
      const r = this._hexR(a, R);
      const x = this.cx + Math.cos(a) * r, y = this.cy + Math.sin(a) * r;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    if (close) ctx.closePath();
  }

  draw() {
    const ctx = this.ctx, g = this.g;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    this._drawField(ctx, g);
    this._drawHalo(ctx, g);
    /* after the halo, or the halo's fill lifts the seam straight back out
       of the picture — the null has to darken the composited field */
    this._drawNull(ctx, g);
    this._drawLattice(ctx, g);
    this._drawRim(ctx, g);
    this._drawImpulses(ctx, g);
    this._drawNodes(ctx, g);
    this._drawNucleus(ctx, g);
    this._drawOverlays(ctx, g);
    if (this.opts.hud) this._drawHud(ctx, g);
  }

  /** The interference field: every wave in here was produced OUTSIDE the
      chamber. Crest rings composited additively, so crest-on-crest really
      does brighten — the constructive interference is not a metaphor. */
  _drawField(ctx, g) {
    ctx.save();
    this._hexPath(g.rim); ctx.clip();

    /* the chamber floor */
    const fl = ctx.createRadialGradient(this.cx, this.cy, 0, this.cx, this.cy, g.rim);
    fl.addColorStop(0, rgba(hsl2rgb(this.hue, this.sat * 0.5, 0.10), 0.85));
    fl.addColorStop(1, 'rgba(8,10,18,0.9)');
    ctx.fillStyle = fl;
    this._hexPath(g.rim); ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    const sharp = 0.35 + 0.65 * this.R;
    ctx.lineWidth = lerp(4.4, 1.4, this.R);
    for (const n of this.nodes) {
      if (n.alive < 0.05) continue;
      const p = this._np(n);
      const ph = ((((n.th % TAU) + TAU) % TAU) / TAU);
      const c = this._nodeRGB(n);
      const jit = (1 - this.R) * g.lam * 0.22;
      for (let k = 0; k < 18; k++) {
        const r = g.lam * (k + 1 - ph) + (k % 2 ? jit : -jit) * (1 - this.R);
        if (r < 3) continue;
        const fall = Math.exp(-r / (g.R * 1.35));
        const a = n.a * n.alive * fall * sharp * 0.30 * (n.phantom ? 0.3 : 1);
        if (a < 0.004) break;
        ctx.strokeStyle = rgba(c, a);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
      }
    }

    /* covert hostility: a counter-rotating pattern at a different wavelength,
       beating underneath a primary field that still looks clean */
    if (this.trust > 0.04) {
      ctx.lineWidth = 2.2;
      const ph = ((-this.psi / TAU) % 1 + 1) % 1;
      for (let k = 0; k < 15; k++) {
        const r = g.lam * 1.31 * (k + 1 - ph);
        const fall = Math.exp(-r / (g.R * 1.5));
        const a = this.trust * 0.95 * fall * 0.55;
        if (a < 0.004) break;
        ctx.strokeStyle = hexA(this.COL.ghost, a);
        ctx.beginPath(); ctx.arc(this.cx, this.cy, r, 0, TAU); ctx.stroke();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  /** The standing null: where two antiphase clusters cancel, drawn as the
      geometric feature it is rather than as a colour. */
  _drawNull(ctx, g) {
    if (this.split < 0.12) return;
    const mean = (c) => {
      let x = 0, y = 0;
      for (const n of this.nodes) {
        if (n.phantom || n.cluster !== c || n.alive < 0.2) continue;
        x += Math.cos(n.an); y += Math.sin(n.an);
      }
      return Math.atan2(y, x);
    };
    const a0 = mean(0), a1 = mean(1);
    const mid = Math.atan2(Math.sin(a0) + Math.sin(a1), Math.cos(a0) + Math.cos(a1));
    const dir = mid + Math.PI / 2;
    const wNull = g.R * 0.13 * this.split;
    ctx.save();
    this._hexPath(g.rim); ctx.clip();
    ctx.translate(this.cx, this.cy);
    ctx.rotate(dir);
    const grad = ctx.createLinearGradient(0, -wNull, 0, wNull);
    grad.addColorStop(0, hexA(this.COL.nul, 0));
    grad.addColorStop(0.5, hexA(this.COL.nul, 0.96 * ss(this.split * 1.4)));
    grad.addColorStop(1, hexA(this.COL.nul, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(-g.R * 2, -wNull, g.R * 4, wNull * 2);
    ctx.strokeStyle = hexA(this.COL.nul, 0.9 * this.split);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-g.R * 2, 0); ctx.lineTo(g.R * 2, 0); ctx.stroke();
    ctx.restore();
  }

  /** Extraverted: the light does not stay in. The halo IS the coupling
      medium, and it reaches all the way out to the carriers. */
  _drawHalo(ctx, g) {
    const c = hsl2rgb(this.hue, this.sat, 0.58);
    const gr = ctx.createRadialGradient(this.cx, this.cy, g.rim * 0.75, this.cx, this.cy, g.halo * 1.24);
    gr.addColorStop(0, rgba(c, this.haloA * 0.85));
    gr.addColorStop(0.55, rgba(c, this.haloA * 0.28));
    gr.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(this.cx, this.cy, g.halo * 1.24, 0, TAU); ctx.fill();
  }

  /** Judging → a lattice. Extraverted judging → the lattice is out there,
      between the carriers, not inside the chamber. */
  _drawLattice(ctx, g) {
    const seen = new Set();
    for (const n of this.nodes) {
      if (n.alive < 0.05) continue;
      const p = this._np(n);
      for (const m of n.nb || []) {
        if (m.alive < 0.05) continue;
        const key = n.an < m.an ? `${n.an}|${m.an}` : `${m.an}|${n.an}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const q = this._np(m);
        const agree = Math.cos(angDiff(n.th, m.th));
        const cross = n.cluster !== m.cluster;
        const A = cross ? this.room.crossA : 1;
        const a = clamp(0.06 + 0.42 * Math.max(0, agree) * Math.abs(A), 0, 0.6) * n.alive * m.alive;
        ctx.strokeStyle = cross && A < 0
          ? hexA(this.COL.crit, 0.10 + 0.2 * this.split)
          : rgba(hsl2rgb(this.hue, this.sat * 0.8, 0.66), a);
        ctx.lineWidth = 0.6 + 1.9 * Math.abs(A) * Math.max(0, agree);
        ctx.setLineDash(cross && A < 0 ? [4, 5] : []);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      /* the spoke from the chamber out to each carrier */
      ctx.setLineDash(n.phantom ? [3, 5] : []);
      ctx.strokeStyle = rgba(hsl2rgb(n.hue, 0.55, 0.6), (0.06 + 0.24 * n.g) * n.alive);
      ctx.lineWidth = 0.8 + 2.4 * this.effort * n.g;
      const rr = this._hexR(n.an, g.rim);
      ctx.beginPath();
      ctx.moveTo(this.cx + Math.cos(n.an) * rr, this.cy + Math.sin(n.an) * rr);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  /** The open ring: a hexagonal rim with a live gap that turns to face
      whoever is loudest. Fe is always open in some direction. */
  _drawRim(ctx, g) {
    const gap = 0.56;
    const c = hsl2rgb(this.hue, this.sat, lerp(0.44, 0.72, this.R));
    ctx.strokeStyle = rgba(c, 0.35 + 0.5 * this.R);
    ctx.lineWidth = 2 + 1.4 * this.R;
    ctx.lineCap = 'round';
    this._hexPath(g.rim, this.gateA + gap, this.gateA + TAU - gap, false);
    ctx.stroke();
    /* the gate itself glows: the direction Fe is currently open in */
    const gx = this.cx + Math.cos(this.gateA) * this._hexR(this.gateA, g.rim);
    const gy = this.cy + Math.sin(this.gateA) * this._hexR(this.gateA, g.rim);
    const gg = ctx.createRadialGradient(gx, gy, 0, gx, gy, g.R * 0.3);
    gg.addColorStop(0, rgba(c, 0.35 * this.presence));
    gg.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.arc(gx, gy, g.R * 0.3, 0, TAU); ctx.fill();
  }

  _drawImpulses(ctx, g) {
    for (const im of this.impulses) {
      const p = this._np(im.n);
      const t = ss(clamp(im.t / im.dur, 0, 1));
      const x = lerp(this.cx, p.x, t), y = lerp(this.cy, p.y, t);
      const col = im.sigma < 0 ? this.COL.crit : this.COL.fn;
      const r = 3.4 * (1 - t * 0.35);
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r * 3.6);
      gr.addColorStop(0, hexA(col, 0.85));
      gr.addColorStop(1, hexA(col, 0));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(x, y, r * 3.6, 0, TAU); ctx.fill();
      ctx.fillStyle = hexA(col, 0.95);
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
  }

  _drawNodes(ctx, g) {
    const hs = 11 * this.opts.hudScale;
    for (const n of this.nodes) {
      if (n.alive < 0.02) continue;
      const p = this._np(n);
      const c = this._nodeRGB(n);
      const r = (6.5 + 5.5 * n.a) * (0.6 + 0.4 * n.alive);
      const glow = 0.25 + 0.5 * n.a * n.alive + 0.6 * n.flash;

      /* a socket of shadow first: the carriers sit inside the halo, and
         without it they wash out into the very glow they are producing */
      const sk = ctx.createRadialGradient(p.x, p.y, r * 0.6, p.x, p.y, r * 2.6);
      sk.addColorStop(0, `rgba(6,8,14,${0.80 * n.alive})`);
      sk.addColorStop(1, 'rgba(6,8,14,0)');
      ctx.fillStyle = sk;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 2.6, 0, TAU); ctx.fill();

      const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.4);
      gr.addColorStop(0, rgba(c, glow * 0.7 * n.alive));
      gr.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 3.4, 0, TAU); ctx.fill();

      ctx.fillStyle = rgba(c, (0.88 + 0.12 * n.flash) * n.alive);
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();

      /* a phantom is drawn as what it is: dashed, dim, and not a person */
      ctx.setLineDash(n.phantom ? [3, 4] : []);
      ctx.strokeStyle = rgba(c, (n.phantom ? 0.5 : 0.85) * n.alive);
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, r + 3.5, 0, TAU); ctx.stroke();
      ctx.setLineDash([]);

      /* a carrier that has been probed and found to be masked shows its true
         phase as a separate marker — never colour alone */
      if (n.revealed && Math.abs(n.delta) > 0.3) {
        const tx = p.x + Math.cos(n.th) * (r + 13), ty = p.y + Math.sin(n.th) * (r + 13);
        ctx.strokeStyle = hexA(this.COL.ghost, 0.9);
        ctx.lineWidth = 1.4;
        ctx.setLineDash([2, 3]);
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 13, 0, TAU); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = hexA(this.COL.ghost, 0.95);
        ctx.beginPath(); ctx.arc(tx, ty, 2.6, 0, TAU); ctx.fill();
      }

      /* Ni feeder: a prediction ghost, ahead of where they actually are */
      if (this.fcfg.horizon && n.alive > 0.2) {
        const ax = p.x + Math.cos(n.th + n.w * this.fcfg.horizon) * (r + 9);
        const ay = p.y + Math.sin(n.th + n.w * this.fcfg.horizon) * (r + 9);
        ctx.fillStyle = rgba(c, 0.4);
        ctx.beginPath(); ctx.arc(ax, ay, 2.2, 0, TAU); ctx.fill();
      }
      /* Si feeder: the ribbon back to who they have always been */
      if (this.fcfg.history && n.alive > 0.2) {
        ctx.strokeStyle = rgba(c, 0.3);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 7, n.hist, n.th, angDiff(n.th, n.hist) < 0);
        ctx.stroke();
      }

      if (this.opts.hud && n === this.hoverNode) {
        const label = n.phantom ? 'not in the room'
          : n.revealed && Math.abs(n.delta) > 0.3
            ? `masked · true phase ${Math.round(Math.abs(n.delta) * 180 / Math.PI)}° off`
            : n.probe > 0.98 ? 'reads as agreement' : 'sounding…';
        ctx.font = `${hs}px ${HUD_FONT}`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
        const wTxt = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(8,12,20,0.86)';
        ctx.fillRect(p.x - wTxt / 2 - 6, p.y - r - 9 - hs - 4, wTxt + 12, hs + 8);
        ctx.fillStyle = this.COL.ink;
        ctx.fillText(label, p.x, p.y - r - 11);
      }
    }
  }

  /** Fe's own locus. It has no colour of its own — hue is the circular mean
      of the ring, saturation is how much of the ring is left. Empty the ring
      and this goes grey, which is the entire argument of the page. */
  _drawNucleus(ctx, g) {
    const l = lerp(0.34, 0.72, this.R) * (0.4 + 0.6 * this.presence);
    let c = hsl2rgb(this.hue, this.sat, l);
    /* Overload heat: the chamber runs hot regardless of what colour the room
       happens to be — but never hot enough to overrule the desaturation,
       because a severed field going grey is the one thing this glyph most
       has to say. Rumination against phantoms pegs effort at 1.0, and it
       must not repaint an empty ring. */
    if (this.effort > 0.4) {
      const h = clamp((this.effort - 0.4) / 0.6, 0, 1) * 0.55 * this.presence;
      const w = hsl2rgb(38, 0.95, 0.6);
      c = { r: Math.round(lerp(c.r, w.r, h)), g: Math.round(lerp(c.g, w.g, h)), b: Math.round(lerp(c.b, w.b, h)) };
    }
    const jitter = this.trust * 1.8;
    const jx = this.cx + Math.sin(this.t * 31) * jitter;
    const jy = this.cy + Math.cos(this.t * 27) * jitter;

    const gr = ctx.createRadialGradient(jx, jy, 0, jx, jy, g.core * 4.2);
    gr.addColorStop(0, rgba(c, 0.95 * this.opts.coreGlow));
    gr.addColorStop(0.26, rgba(c, 0.5 * this.opts.coreGlow));
    gr.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = gr;
    ctx.beginPath(); ctx.arc(jx, jy, g.core * 4.2, 0, TAU); ctx.fill();

    const breath = 1 + 0.05 * Math.sin(this.t * 0.9 * TAU * 0.16);
    ctx.fillStyle = rgba(c, 0.92);
    ctx.beginPath(); ctx.arc(jx, jy, g.core * breath, 0, TAU); ctx.fill();
    ctx.strokeStyle = rgba(c, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(jx, jy, g.core * breath + 3, 0, TAU); ctx.stroke();
  }

  _drawOverlays(ctx, g) {
    /* the unspoken sync: the one moment a single carrier gets its own line */
    if (this.syncNode && this.syncNode.alive > 0.1) {
      const p = this._np(this.syncNode);
      const a = 0.55 + 0.35 * Math.sin(this.t * 6);
      const grd = ctx.createLinearGradient(this.cx, this.cy, p.x, p.y);
      grd.addColorStop(0, hexA(this.COL.fn, a));
      grd.addColorStop(1, hexA(this.COL.fn, a * 0.35));
      ctx.strokeStyle = grd;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(this.cx, this.cy); ctx.lineTo(p.x, p.y); ctx.stroke();
    }
    /* reconciliation: one wavefront crossing both halves at once */
    if (this.wavefront > 0) {
      const t = this.wavefront;
      const r = g.R * (0.1 + 1.9 * ss(t));
      ctx.strokeStyle = hexA(this.COL.fn, (1 - t) * 0.85);
      ctx.lineWidth = 5 * (1 - t) + 1;
      ctx.beginPath(); ctx.arc(this.cx, this.cy, r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = hexA('#ffffff', (1 - t) * 0.4);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(this.cx, this.cy, r * 0.96, 0, TAU); ctx.stroke();
    }
    if (this.pulseT > 0) {
      ctx.strokeStyle = hexA(this.pulseColor, this.pulseT * 0.5);
      ctx.lineWidth = 2;
      this._hexPath(g.rim * (1 + (1 - this.pulseT) * 0.12));
      ctx.stroke();
    }
  }

  _drawHud(ctx, g) {
    const hs = 10.5 * this.opts.hudScale;
    const x = 14, y = 18;
    ctx.font = `${hs}px ${HUD_FONT}`;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillStyle = this.COL.muted;
    ctx.fillText('CONCORD', x, y);
    ctx.fillStyle = this.COL.ink;
    ctx.fillText(`${Math.round(this.R * 100)}%`, x + hs * 8.4, y);
    /* redundant, non-colour channel for the master metric (§3.5) */
    const cw = 6, gap = 2;
    for (let i = 0; i < 12; i++) {
      ctx.fillStyle = this.R * 12 > i ? hexA(this.COL.fn, 0.9) : hexA(this.COL.axis, 0.9);
      ctx.fillRect(x + i * (cw + gap), y + 9, cw, 3);
    }
    ctx.fillStyle = this.COL.muted;
    ctx.fillText('EFFORT', x, y + 26);
    ctx.fillStyle = this.effort > 0.6 ? this.COL.warn : this.COL.ink2;
    ctx.fillText(`${Math.round(this.effort * 100)}%`, x + hs * 8.4, y + 26);

    /* Zone B: believed against actual, so position → misreading is a picture */
    if (this.bombard) {
      const by = y + 46, bw = 96;
      ctx.fillStyle = this.COL.muted;
      ctx.fillText('BELIEVED', x, by);
      ctx.fillText('ACTUAL', x, by + 14);
      ctx.fillStyle = hexA(this.COL.axis, 0.8);
      ctx.fillRect(x + hs * 5.4, by - 2, bw, 4);
      ctx.fillRect(x + hs * 5.4, by + 12, bw, 4);
      ctx.fillStyle = hexA(this.COL.ghost, 0.95);
      ctx.fillRect(x + hs * 5.4, by - 2, bw * this.believed, 4);
      ctx.fillStyle = hexA(this.COL.fn, 0.95);
      ctx.fillRect(x + hs * 5.4, by + 12, bw * this.R, 4);
      if (this.trust > 0.08) {
        ctx.fillStyle = this.COL.warn;
        ctx.fillText(`gap ${Math.round(this.trust * 100)}%`, x + hs * 5.4 + bw + 8, by + 5);
      }
    }
  }

  /* enough steps for the room to actually settle — a reduced-motion reader
     should get the field at equilibrium, not 30 frames after a cold start */
  renderStatic() { for (let i = 0; i < 90; i++) this.step(1 / 30); this.draw(); }

  start() {
    if (REDUCED) { this.renderStatic(); return; }
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (this._visible !== false) { this.step(dt); this.draw(); }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
    new IntersectionObserver((e) => { this._visible = e[0].isIntersecting; }, { threshold: 0.02 }).observe(this.cv);
  }
}
