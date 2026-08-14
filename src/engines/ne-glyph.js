/* ============================================================
   CURRENTS · NeGlyph — The Divergence Engine
   Ne as an outward branching engine: a stimulus enters the open
   aperture, strikes the seed, and erupts into a tree of
   possibilities — every branch a "what if" that forks again
   before the last one has finished growing. Breadth is the
   product; commitment is external; nothing in here ever closes
   a thread on its own.

   The cycle: INTAKE (a stimulus drifts in through the gap) →
   BLOOM (a burst of branches, forking by generation) → DRIFT
   (branches live, twinkle, wither; new forks erupt from old
   wood) → repeat, forever, with no reset — the tree is only
   ever cleared by outside force (a prune, a confinement) or
   abandoned whole for a newer one.

   Shape grammar (§1.3): perceiving → circular aperture/lens.
   Extraverted → a single OPEN ring with a gap facing the world,
   light radiating outward past the boundary, and particles
   emitted into the environment — sparks fly off the branch tips
   and escape the chamber entirely.

   All geometry is stored normalized in units of R, so the rail
   morph (scale ramp §3.1) scales the living tree smoothly.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexLerp } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';
import { NeState } from './ne-state.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
const HUD_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const GRAY = '#7a7890';

const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

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

export class NeGlyph {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({ interactive: true, coreGlow: 1, seed: 13, hud: true, hudScale: 1, supply: 1 }, opts);
    this.COL = opts.COL || readCOL();
    this.rng = mulberry32(this.opts.seed);
    this.params = { scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 };
    this.target = { ...this.params };
    this.feeder = null;
    this.structure = { countMul: 1, k: 3, rigidity: 0.4 };

    /* the unified state stream — DOM telemetry and other adapters
       subscribe to this same object */
    this.state = opts.state || new NeState();

    /* the divergence field — nodes reference their parent object
       directly, so removal never invalidates anything */
    this.nodes = [];        /* the living tree(s) */
    this.stimuli = [];      /* inbound: the world arriving through the gap */
    this.sparks = [];       /* outbound: emission past the boundary */
    this.husks = [];        /* abandoned trees, gray, still counted */
    this.badges = [];
    this.bridge = null;     /* the graft arc while it grows */
    this.partner = 0;       /* riff partner presence 0..1 */

    /* fx envelopes, eased 0..1 with expiry times */
    this.fx = { graft: 0, prune: 0, riff: 0, confine: 0, scatter: 0 };
    this.fxT = { graft: 0, prune: 0, riff: 0, confine: 0, scatter: 0 };
    this.fxUntil = { graft: 0, prune: 0, riff: 0, confine: 0, scatter: 0 };
    this._graft = null;
    this._pruneAt = 0; this._pruned = false; this._confined = false;
    this._bigWord = null; this._bigUntil = 0;

    this.breadth = 0.3;     /* smoothed angular coverage — the R² analog */
    this.novelty = 0.5;
    this.threadsOpen = 0;
    this.threadsClosed = 0; /* only force ever moves this number */
    this.started = 0;       /* trees planted */
    this.hybrids = 0;

    this.colorShift = 0; this.shake = 0; this.flareT = 0;
    this.pulseT = 0; this.pulseColor = '#ffffff';
    this.pointer = { x: null, y: null, hist: [] };
    this._hoverLast = { x: null, y: null, t: 0 };
    this._hoverNote = 0;
    this.touched = false;
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
        /* with animation off, a sweep is a direct branch-and-redraw */
        if (REDUCED) { this._hoverSpawn(true); this.draw(); }
      });
      canvas.addEventListener('pointerleave', () => {
        this.pointer.hist = []; this.pointer.x = this.pointer.y = null;
      });
    }

    this.g = this.geom();
    this.newTree(true);
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
      gapA: Math.PI,      /* the aperture faces the world (and the feeder) */
      gapW: 0.62,         /* open-ring gap width, radians */
      coreX: -0.10,       /* the seed sits just inside the intake */
      coreY: 0,
      boxH: 0.17,         /* confinement corridor half-height, units of R */
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
    /* structure shapes branching factor and steadiness; with motion
       off the reader gets a re-grown frame immediately */
    if (changed && REDUCED) { this.newTree(true); this.renderStatic(); }
  }
  setFeeder(f) {
    this.feeder = f;
    this.newTree(true);
    if (REDUCED) this.renderStatic();
  }
  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  color() { return hexLerp(this.COL.fn, '#d0455f', this.colorShift); }

  /* legacy readouts other code may probe */
  get stress() { return this.state.v.stress; }
  set stress(v) { this.state.v.stress = this.state.tv.stress = clamp(v, 0, 1); }
  get pleasure() { return this.state.v.pleasure; }
  set pleasure(v) { this.state.v.pleasure = this.state.tv.pleasure = clamp(v, 0, 1); }

  /* ---------- the tree ---------- */
  _hueFamily(base) {
    return [base, hexLerp(base, '#ffffff', 0.28), hexLerp(base, this.COL.n, 0.45), hexLerp(base, '#4fc9e0', 0.22), hexLerp(base, this.COL.f, 0.18)];
  }

  _mkNode(parent, bx, by, ang, len, gen, o = {}) {
    return Object.assign({
      parent, bx, by, ang, len, gen,
      bow: (this.rng() < 0.5 ? -1 : 1) * (0.35 + this.rng() * 0.65) * (1 - this.structure.rigidity * 0.6),
      born: this.t,
      delay: o.delay || 0,
      prog: o.warm ? 1 : 0,
      vit: o.warm ? 0.62 + this.rng() * 0.38 : 1,
      st: o.warm ? 1 : 0,        /* 0 growing · 1 live · 2 withering */
      hue: o.hue || this.COL.fn,
      w: o.w || 1,
      kids: 0, tw: this.rng() * TAU,
      domain: o.domain || 0,
      valued: o.valued || false,
      ghost: o.ghost || false,
      curlK: o.curlK || 0,
      curlDir: this.rng() < 0.5 ? -1 : 1,
      thick: false, cut: null, cutDelay: 0,
    }, {});
  }

  /** tip of a node in normalized units — children attach here */
  end(n) {
    const L = n.len * ss(n.prog);
    let a = n.ang;
    if (n.curlK) a += n.curlK * ss(n.prog) * 2.2 * n.curlDir;
    return [n.bx + Math.cos(a) * L, n.by + Math.sin(a) * L];
  }

  _cap() { return Math.round(150 * this.structure.countMul); }
  _liveCount() { let c = 0; for (const n of this.nodes) if (!n.ghost && n.st <= 1 && !n.cut) c++; return c; }
  _maxGen() { return 2 + Math.round((this.feeder ? this.feeder.depth : 0.6) * 3); }

  /** A burst: children erupt from a node's tip. The heart of the glyph. */
  burst(node, count, o = {}) {
    const rng = this.rng, f = this.feeder;
    const cap = this._cap();
    if (this._liveCount() >= cap) return 0;
    const [ex, ey] = this.end(node);
    const spread = (f ? f.spread : 0.65) * (o.spreadMul || 1);
    const maxGen = o.freeGen ? this._maxGen() + 2 : this._maxGen();
    if (node.gen >= maxGen) return 0;
    const fam = this._hueFamily(o.hue || node.hue);
    let made = 0;
    for (let i = 0; i < count; i++) {
      if (this._liveCount() + made >= cap) break;
      /* outward bias: branches lean away from the center, filling the lens */
      const outw = Math.atan2(ey - this.g.coreY, ex - this.g.coreX);
      let ang = node.gen === 0 && !o.aim
        ? (this.rng() - 0.5) * 3.4                 /* trunk fans away from the gap */
        : lerp(node.ang, outw, 0.52) + (rng() - 0.5) * TAU * 0.42 * spread;
      if (o.aim !== undefined) ang = o.aim + (rng() - 0.5) * 0.5 * spread;
      /* the loop hugs the rim: growth bends tangent once it's out there */
      if (f && f.loop) {
        const r = Math.hypot(ex, ey);
        if (r > 0.45) {
          const tang = Math.atan2(ey, ex) + (rng() < 0.5 ? 1 : -1) * Math.PI / 2;
          ang = lerp(ang, tang, clamp((r - 0.45) * 2.2, 0, 0.85));
        }
      }
      /* confinement clamps growth to the corridor axis */
      if (this.fx.confine > 0.3) {
        const dir = Math.cos(ang) >= 0 ? 0 : Math.PI;
        ang = dir + (ang - dir) * 0.18;
      }
      let len = 0.38 * Math.pow(0.78, node.gen) * (0.75 + rng() * 0.5) * (o.lenMul || 1);
      if (this.fx.confine > 0.3) len *= 0.7;
      /* rim containment: growth that would exit the lens bends tangent
         and shortens — the crown fills the chamber instead of leaving it */
      const tipR = Math.hypot(ex + Math.cos(ang) * len, ey + Math.sin(ang) * len);
      if (tipR > 0.88) {
        const tang = Math.atan2(ey, ex) + (rng() < 0.5 ? 1 : -1) * Math.PI / 2;
        ang = lerp(ang, tang, 0.65);
        len *= 0.7;
      }
      let hue = fam[rng() < 0.5 ? 0 : Math.floor(rng() * fam.length)];
      if (this.fx.confine > 0.3) hue = hexLerp(hue, '#8f8f9c', 0.5);
      const valued = !!(f && f.valued && rng() < f.valued);
      if (valued) hue = hexLerp(hue, this.COL.f, 0.3);
      this.nodes.push(this._mkNode(node, ex, ey, ang, len, node.gen + 1, {
        delay: (o.warm ? 0 : rng() * 0.25) + (this.params.latency / 1000) * (0.4 + rng() * 0.8),
        warm: o.warm,
        hue,
        domain: o.domain !== undefined ? o.domain : node.domain,
        valued,
        curlK: f && f.curl ? f.curl * (0.5 + rng() * 0.5) : 0,
        ghost: o.ghost,
      }));
      node.kids++;
      made++;
    }
    if (made && !o.quiet) this.novelty = clamp(this.novelty + 0.04 * made, 0, 1);
    return made;
  }

  _mkRoot(bx, by, hue, domain = 0) {
    const root = this._mkNode(null, bx, by, 0, 0.001, 0, { warm: true, hue: hue || this.COL.fn, domain });
    root.prog = 1; root.st = 1;
    this.nodes.push(root);
    return root;
  }

  /** Plant a fresh tree. Warm = pre-grown, so no context ever shows an
      empty chamber — Ne is never not already mid-idea. */
  newTree(warm = false) {
    this.nodes = [];
    this.bridge = null;
    this._graft = null;
    this.started++;
    const rng = this.rng;
    const root = this._mkRoot(this.g.coreX + (rng() - 0.5) * 0.06, (rng() - 0.5) * 0.06);
    this.root = root;
    const k = this.structure.k;
    this.burst(root, k + 1, { warm, quiet: true });
    if (warm) {
      /* two more generations, already alive */
      for (let gen = 1; gen <= 2; gen++) {
        const layer = this.nodes.filter((n) => n.gen === gen && !n.ghost);
        for (const n of layer) {
          if (rng() < (gen === 1 ? 0.9 : 0.45)) this.burst(n, 1 + Math.round(rng() * (k - 1)), { warm: true, quiet: true });
        }
      }
    }
  }

  badge(x, y, ok, label) { this.badges.push({ x, y, ok, label, age: 0 }); }

  /* ---------- scenario triggers (Zone D) ---------- */
  /**
   * @param {string} key    graft | prune | scatter | riff | confine
   * @param {Object} impact additive state deltas, e.g. { stress:-0.35, pleasure:+0.9 }
   */
  scenario(key, impact = {}) {
    this.state.impulse(impact);
    const arm = (k, dur, amt = 1) => { this.fxT[k] = amt; this.fxUntil[k] = this.t + dur; };

    if (key === 'graft') {
      arm('graft', 5.5);
      this._startGraft();
    } else if (key === 'prune') {
      arm('prune', 6.0);
      this._ensureCanopy();
      this._pruneAt = this.t + 0.55;   /* the demand lands, then the wave */
    } else if (key === 'scatter') {
      arm('scatter', 7.0);
      this._doScatter();
    } else if (key === 'riff') {
      arm('riff', 12.5);
      this.fxT.confine = 0;            /* a partner in the room ends the procedure */
    } else if (key === 'confine') {
      arm('confine', 10.5);
      this.fxT.riff = 0;
      this._applyConfine();
    }
  }

  /** Two foreign domains, then the bridge — the cross-pollination arc */
  _startGraft() {
    const rng = this.rng;
    const hueA = this.COL.s, hueB = '#4fc9e0';   /* visibly not from this tree */
    const aAng = -0.95 + (rng() - 0.5) * 0.2, bAng = 0.95 + (rng() - 0.5) * 0.2;
    const mk = (ang, hue, domain) => {
      const root = this._mkRoot(Math.cos(ang) * 0.52, Math.sin(ang) * 0.52, hue, domain);
      this.burst(root, 3, { hue, domain, spreadMul: 0.8, lenMul: 0.62, quiet: true });
      return root;
    };
    this._graft = {
      stage: 0, t0: this.t,
      rootA: mk(aAng, hueA, 1), rootB: mk(bAng, hueB, 2),
      hueA, hueB,
    };
  }

  _stepGraft(dt) {
    const gft = this._graft;
    if (!gft) return;
    if (gft.stage === 0 && this.t - gft.t0 > 1.5) {
      /* the bridge: one branch arcs across the gap between domains */
      const tipOf = (domain) => {
        let best = null, bestR = -1;
        for (const n of this.nodes) {
          if (n.domain !== domain || n.st > 1 || n.cut) continue;
          const [ex, ey] = this.end(n);
          const d = Math.hypot(ex, ey);
          if (d > bestR) { bestR = d; best = [ex, ey]; }
        }
        return best;
      };
      const a = tipOf(1), b = tipOf(2);
      if (a && b) {
        this.bridge = { ax: a[0], ay: a[1], bx: b[0], by: b[1], prog: 0 };
        gft.stage = 1;
      } else gft.stage = 3;
    } else if (gft.stage === 1 && this.bridge) {
      this.bridge.prog = clamp(this.bridge.prog + dt * 1.3, 0, 1);
      if (this.bridge.prog >= 1) {
        gft.stage = 2;
        /* the junction erupts in a color neither parent has */
        const mx = (this.bridge.ax + this.bridge.bx) / 2, my = (this.bridge.ay + this.bridge.by) / 2 - 0.10;
        const hybridHue = hexLerp(hexLerp(gft.hueA, gft.hueB, 0.5), this.COL.fn, 0.35);
        const hRoot = this._mkRoot(mx, my, hybridHue, 3);
        this.burst(hRoot, 4, { hue: hybridHue, domain: 3, spreadMul: 1.1, lenMul: 0.8 });
        this.hybrids++;
        this.flareT = 1;
        this.pulse(hybridHue);
        this.badge(mx, my - 0.18, true, 'hybrid');
        this._bigWord = 'HYBRID'; this._bigUntil = this.t + 2.2;
        this.novelty = clamp(this.novelty + 0.55, 0, 1);
        this.state.impulse({ pleasure: 0.12, stress: -0.05 });
      }
    } else if (gft.stage >= 2 && this.fx.graft < 0.08) {
      this._graft = null;
      this.bridge = null;
    }
  }

  /** If the canopy is thin, grow it out instantly — a prune needs
      something to cut for the lesson to land */
  _ensureCanopy() {
    for (const n of this.nodes) if (n.st === 0 && !n.cut) { n.prog = 1; n.st = 1; n.delay = 0; }
    if (this._liveCount() < 14) {
      const layer = this.nodes.filter((n) => n.gen >= 1 && n.st === 1 && !n.cut);
      for (const n of layer) if (this.rng() < 0.7) this.burst(n, 2, { warm: true, quiet: true });
    }
  }

  /** The wave: everything but the brightest limb, cut tips-first */
  _doPrune() {
    /* survivor = the gen-1 limb that happens to look best right now —
       brightest at the deadline, not best; the narration says so */
    let survivor = null, best = -1;
    for (const n of this.nodes) {
      if (n.gen !== 1 || n.st > 1 || n.cut || n.ghost || n.domain === 1 || n.domain === 2) continue;
      const score = n.vit + n.kids * 0.15;
      if (score > best) { best = score; survivor = n; }
    }
    const keep = new Set();
    if (survivor) {
      keep.add(survivor);
      let grew = true;
      while (grew) {
        grew = false;
        for (const n of this.nodes) if (!keep.has(n) && n.parent && keep.has(n.parent)) { keep.add(n); grew = true; }
      }
    }
    let cutCount = 0;
    let maxGen = 1;
    for (const n of this.nodes) maxGen = Math.max(maxGen, n.gen);
    for (const n of this.nodes) {
      if (n.gen === 0 || keep.has(n) || n.cut || n.ghost) continue;
      n.cut = { p: 0, gray: false };
      n.cutDelay = (maxGen - n.gen) * 0.13 + this.rng() * 0.06;
      cutCount++;
    }
    this.threadsClosed += cutCount;
    if (survivor) { survivor.thick = true; survivor.bow *= 0.2; }
    this.shake = Math.max(this.shake, 0.5);
    this.pulse(VERDICT.bad);
    this.badge(0, -0.55, false, `${cutCount} options closed`);
    this._bigWord = 'PRUNED'; this._bigUntil = this.t + 2.6;
    this._pruned = true;
  }

  /** Abandon the living tree for a newer one. The husk keeps its threads. */
  _doScatter() {
    const segs = [];
    let adrift = 0;
    for (const n of this.nodes) {
      if (n.ghost || n.prog < 0.15) continue;
      const [ex, ey] = this.end(n);
      segs.push({ x1: n.bx, y1: n.by, x2: ex, y2: ey, w: n.thick ? 2.4 : 1.1 });
      if (n.gen >= 1 && n.st <= 1 && n.kids === 0 && !n.cut) adrift++;
    }
    if (segs.length) {
      this.husks.push({ segs, born: this.t, drift: this.rng() * TAU, threads: adrift });
      if (this.husks.length > 3) this.husks.shift();
    }
    const rng = this.rng;
    this.nodes = [];
    this.bridge = null; this._graft = null;
    this.started++;
    const root = this._mkRoot(this.g.coreX + (rng() - 0.5) * 0.3, (rng() - 0.5) * 0.3);
    this.root = root;
    this.burst(root, this.structure.k + 2, { lenMul: 1.1 });
    this.flareT = 0.7;
    this.pulse(this.color());
    this.novelty = clamp(this.novelty + 0.5, 0, 1);
    this.badge(0, -0.55, false, `+${adrift} threads adrift`);
    this._bigWord = 'NEW TREE'; this._bigUntil = this.t + 2.2;
  }

  /** The corridor drops: clip everything outside it, without ceremony */
  _applyConfine() {
    const h = this.g.boxH;
    let clipped = 0;
    for (const n of this.nodes) {
      if (n.gen === 0 || n.cut || n.ghost) continue;
      const [ex, ey] = this.end(n);
      if (Math.abs(ey) > h || Math.abs(n.by) > h) {
        n.cut = { p: 0, gray: true };
        n.cutDelay = this.rng() * 0.35;
        clipped++;
      }
    }
    this.badge(0, -0.55, false, `${clipped} clipped at the line`);
    this._bigWord = 'CONFINED'; this._bigUntil = this.t + 2.4;
    this._confined = true;
  }

  /** The template lifts: the release bloom is real, and it teaches */
  _release() {
    const tips = this.nodes.filter((n) => n.st === 1 && !n.cut && !n.ghost && n.kids === 0);
    for (let i = 0; i < Math.min(3, tips.length); i++) {
      const n = tips[Math.floor(this.rng() * tips.length)];
      this.burst(n, this.structure.k + 1, { freeGen: true, lenMul: 1.15, spreadMul: 1.3 });
    }
    this.flareT = 1;
    this.pulse(this.color());
    this.badge(0, -0.55, true, 'released');
    this._bigWord = 'RELEASE'; this._bigUntil = this.t + 2.0;
    this.state.impulse({ pleasure: 0.18, stress: -0.08 });
  }

  /* ---------- intake ---------- */
  _spawnStimulus(o = {}) {
    const rng = this.rng, f = this.feeder;
    const fam = f ? this._hueFamily(f.color) : this._hueFamily(this.COL.fn);
    let hue = fam[Math.floor(rng() * fam.length)];
    if (f && f.starve) hue = hexLerp(this.COL.s, '#8f8f9c', 0.35);   /* the past, in gray-amber */
    /* enter through the gap: from outside-left, aimed at the seed (or a tip) */
    const gy = (rng() - 0.5) * 0.5;
    let target = this.root, tx = this.root ? this.root.bx : 0, ty = this.root ? this.root.by : 0;
    if (o.tip) {
      const tips = this.nodes.filter((n) => n.st === 1 && !n.cut && !n.ghost && n.gen >= 1);
      if (tips.length) {
        target = tips[Math.floor(rng() * tips.length)];
        [tx, ty] = this.end(target);
      }
    }
    this.stimuli.push({
      x: -1.55 - rng() * 0.35, y: gy, tx, ty, target,
      sp: (0.9 + rng() * 0.5) * (f ? 0.6 + f.speed * 0.8 : 1),
      hue, partner: !!o.partner,
    });
  }

  _stepStimuli(dt) {
    const arrived = [];
    for (const s of this.stimuli) {
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy);
      const step = s.sp * dt;
      if (d <= step) { arrived.push(s); s.done = true; continue; }
      s.x += (dx / d) * step; s.y += (dy / d) * step;
    }
    if (arrived.length) {
      const f = this.feeder, k = this.structure.k;
      for (const s of arrived) {
        const target = s.target && this.nodes.includes(s.target) ? s.target : this.root;
        if (!target) continue;
        const w = f ? f.weight : 0.75;
        const n = clamp(Math.round(1 + w * 1.2 + this.rng() * (k - 1)), 1, k + 2);
        const made = this.burst(target, s.partner ? Math.max(2, Math.round(n * 0.8)) : n, { hue: s.partner ? hexLerp(target.hue, '#ffffff', 0.25) : undefined });
        if (made) {
          this.state.impulse({ pleasure: s.partner ? 0.015 : 0.006 });
          if (s.partner) this._sparkShower(s.tx, s.ty, 5);
        }
      }
    }
    this.stimuli = this.stimuli.filter((s) => !s.done);
  }

  /* ---------- emission (the extraverted signature) ---------- */
  _sparkShower(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = this.rng() * TAU;
      this.sparks.push({ x, y, vx: Math.cos(a) * 0.4, vy: Math.sin(a) * 0.4, life: 0.7 + this.rng() * 0.4, hue: '#ffffff' });
    }
  }

  _stepSparks(dt) {
    const rng = this.rng;
    /* live tips emit outward — nothing is contained here */
    const rate = this._liveCount() * 0.09 * this.awake * (1 + 1.6 * this.fx.riff) * (1 - this.fx.confine);
    this._sparkAcc = (this._sparkAcc || 0) + dt * rate;
    while (this._sparkAcc > 1 && this.sparks.length < 110) {
      this._sparkAcc -= 1;
      const tips = this.nodes.filter((n) => n.st === 1 && !n.cut && !n.ghost && n.gen >= 1);
      if (!tips.length) break;
      const n = tips[Math.floor(rng() * tips.length)];
      const [ex, ey] = this.end(n);
      const outw = Math.atan2(ey, ex) + (rng() - 0.5) * 0.6;
      const sp = 0.25 + rng() * 0.3;
      this.sparks.push({ x: ex, y: ey, vx: Math.cos(outw) * sp, vy: Math.sin(outw) * sp, life: 0.8 + rng() * 0.6, hue: rng() < 0.6 ? n.hue : '#ffffff' });
    }
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; }
    this.sparks = this.sparks.filter((s) => s.life > 0 && Math.hypot(s.x, s.y) < 1.75);
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

  /** §2.2: hovering anywhere spawns a new branch from the cursor */
  _hoverSpawn(force = false) {
    if (!this.opts.interactive || this.pointer.x === null) return;
    const g = this.g, p = this.params;
    const ptr = force ? this.pointer : this.delayedPointer();
    if (!ptr) return;
    const lx = (ptr.x - this.cx) / g.R, ly = (ptr.y - this.cy) / g.R;
    if (Math.hypot(lx, ly) > 1.02) return;
    const last = this._hoverLast;
    const moved = last.x === null || Math.hypot(lx - last.x, ly - last.y) > 0.16;
    const cool = this.t - last.t > 0.15 / (0.3 + p.control * 0.7);
    if (!force && (!moved || !cool)) return;
    /* nearest live wood grows toward the attention */
    let bestN = null, bestD = 1e9;
    for (const n of this.nodes) {
      if (n.st > 1 || n.cut || n.ghost) continue;
      const [ex, ey] = this.end(n);
      const d = Math.hypot(ex - lx, ey - ly);
      if (d < bestD) { bestD = d; bestN = n; }
    }
    if (!bestN || bestD > 0.6) return;
    const [ex, ey] = this.end(bestN);
    let ang = Math.atan2(ly - ey, lx - ex);
    ang += (1 - p.control) * (this.rng() - 0.5) * 1.6;
    /* shadow registers grow away from the hand */
    if (p.contrary > 0.12 && Math.sin(this.t * 0.55 + 2) > 1 - p.contrary * 0.85) ang += Math.PI;
    const len = clamp(bestD * 0.85, 0.08, 0.30);
    const made = this.burst(bestN, 1, { aim: ang, lenMul: len / (0.30 * Math.pow(0.74, bestN.gen)), freeGen: true });
    if (made) {
      last.x = lx; last.y = ly; last.t = this.t;
      this.touched = true;
      this._hoverNote = 2;
    }
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
    if (this._pruneAt && this.t >= this._pruneAt) { this._pruneAt = 0; this._doPrune(); }
    /* the stump regrows once the demand passes */
    if (this._pruned && this.fx.prune < 0.25) {
      this._pruned = false;
      const tips = this.nodes.filter((n) => n.st === 1 && !n.cut && !n.ghost);
      if (tips.length) this.burst(tips[Math.floor(this.rng() * tips.length)], this.structure.k, {});
    }
    if (this._confined && this.fx.confine < 0.25) { this._confined = false; this._release(); }
    this._stepGraft(dt);

    this.colorShift = lerp(this.colorShift, clamp((this.stress - 0.38) * 1.6 + this.fx.prune * 0.3, 0, 1), 1 - Math.pow(0.08, dt));
    this.pulseT = Math.max(0, this.pulseT - dt * 1.3);
    this.shake = Math.max(0, this.shake - dt * 0.8);
    this.flareT = Math.max(0, this.flareT - dt * 0.75);
    this._hoverNote = Math.max(0, this._hoverNote - dt);
    this.partner += ((this.fx.riff > 0.15 ? 1 : 0) - this.partner) * (1 - Math.exp(-dt * 4));

    /* duty: heavy noise makes the flicker unpredictable rather than periodic */
    const w1 = (Math.sin(this.t * 0.55) + 1) / 2;
    const w2 = (Math.sin(this.t * 1.87 + 1.3) + 1) / 2;
    const dutyWave = lerp(w1, w1 * 0.5 + w2 * 0.5, clamp(p.noise * 1.6, 0, 1));
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.35, 0.1, 1);

    if (f && f.starve) this.state.impulse({ stress: 0.05 * dt });
    if (this.fx.scatter > 0.3) this.state.impulse({ stress: 0.028 * dt });   /* thread debt accrues */
    /* confinement grinds instead of spiking — the meter climbs the whole time */
    if (this.fx.confine > 0.25) this.state.impulse({ stress: 0.05 * dt, pleasure: -0.02 * dt });

    /* ---- intake ---- */
    const baseRate = (f ? f.rate * 0.85 : 0.42) * this.opts.supply;
    const riffRate = this.fx.riff * 1.1;
    this._stimAcc = (this._stimAcc || 0) + dt * (baseRate + riffRate) * (0.4 + 0.6 * this.awake);
    while (this._stimAcc > 1) {
      this._stimAcc -= 1;
      const partner = this.fx.riff > 0.3 && this.rng() < 0.6;
      this._spawnStimulus({ tip: partner || this.rng() < 0.25, partner });
    }
    this._stepStimuli(dt);
    this._stepSparks(dt);

    /* ---- steering: the tree grows toward attention ---- */
    this._hoverSpawn();

    /* ---- branch lifecycle ---- */
    const growSp = (1.7 + 2.4 * clamp(p.fidelity, 0.15, 1)) * (0.4 + 0.6 * this.awake);
    const persistence = f ? f.persistence : 0.8;
    const witherBase = 0.016 + (1 - persistence) * 0.10 + (1 - p.fidelity) * 0.09;
    let live = 0;
    for (const n of this.nodes) {
      if (n.cut) {
        if (n.cutDelay > 0) { n.cutDelay -= dt; continue; }
        n.cut.p = clamp(n.cut.p + dt * 2.2, 0, 1);
        continue;
      }
      if (n.ghost) { n.vit -= dt * 1.3; continue; }
      if (n.st === 0) {
        if (n.delay > 0) { n.delay -= dt; continue; }
        n.prog = clamp(n.prog + dt * growSp, 0, 1);
        /* low fidelity: branches stutter and die half-grown */
        if (p.fidelity < 0.7 && this.rng() < dt * (0.7 - p.fidelity) * 0.55) { n.st = 2; n.vit = 0.4; continue; }
        if (n.prog >= 1) {
          n.st = 1;
          /* the judging feeder inspects finished growth: Ti snips the
             inconsistent cleanly; Fi lets the unvalued fade on schedule */
          if (f && f.filter && n.gen >= 1 && this.rng() < f.filter * 0.5) {
            n.cut = { p: 0, gray: false, clean: true };
            n.cutDelay = 0.15 + this.rng() * 0.3;
          }
        }
      } else if (n.st === 1) {
        live++;
        if (n.gen >= 1) {
          let wr = witherBase;
          if (n.valued) wr *= 0.3;
          else if (f && f.valued) wr *= 1.5;
          if (n.thick) wr *= 0.4;
          n.vit -= dt * wr * (0.5 + 0.5 * this.awake);
          if (n.vit < 0.45) n.st = 2;
        }
        /* spontaneous refork: old wood erupts on its own */
        if (n.gen < this._maxGen() && n.kids < this.structure.k &&
            this.rng() < dt * 0.055 * this.awake * (this.structure.k / 3) * (0.5 + 0.5 * p.fidelity)) {
          this.burst(n, 1, { quiet: true });
        }
      } else if (n.st === 2) {
        n.vit -= dt * 0.16;
      }
      /* the shadow's invisible hand prunes what you were just growing */
      if (p.contrary > 0.3 && n.gen >= 1 && n.st <= 1 && !n.cut && this.rng() < dt * p.contrary * 0.05) {
        n.cut = { p: 0, gray: true };
      }
    }
    this.nodes = this.nodes.filter((n) => !(n.cut && n.cut.p >= 1) && !(n.ghost && n.vit <= 0) && !(n.st === 2 && n.vit <= 0.02));

    /* the tree never dies out entirely — a thin canopy re-erupts */
    if (this.root && !this.nodes.includes(this.root)) this.root = this.nodes.find((n) => n.gen === 0) || null;
    if (!this.root && this.nodes.length === 0) { this.newTree(false); }
    else if (live < 16 && this.root && this.fx.prune < 0.3 && this.fx.confine < 0.3) {
      this._rebAcc = (this._rebAcc || 0) + dt;
      if (this._rebAcc > 1.0) { this._rebAcc = 0; this.burst(this.root, this.structure.k + 1, { quiet: true }); }
    }

    /* escape fantasies flicker outside the corridor */
    if (this.fx.confine > 0.4 && this.rng() < dt * 1.1) {
      const inside = this.nodes.filter((n) => n.st === 1 && !n.cut && !n.ghost);
      if (inside.length) {
        const n = inside[Math.floor(this.rng() * inside.length)];
        const [ex, ey] = this.end(n);
        const up = ey < 0 ? -1 : 1;
        this.nodes.push(this._mkNode(n, ex, ey, up * (Math.PI / 2) + (this.rng() - 0.5) * 0.6, 0.2 + this.rng() * 0.15, n.gen + 1, { ghost: true, hue: n.hue }));
      }
    }

    /* ---- breadth, novelty, thread accounting ---- */
    this._metaAcc = (this._metaAcc || 0) + dt;
    if (this._metaAcc > 0.22) {
      this._metaAcc = 0;
      const SEC = 20, filled = new Array(SEC).fill(0);
      let leaves = 0, liveN = 0;
      for (const n of this.nodes) {
        if (n.ghost || n.cut || n.st > 1 || n.gen < 1) continue;
        liveN++;
        const [ex, ey] = this.end(n);
        filled[Math.floor(((Math.atan2(ey, ex) + TAU) % TAU) / TAU * SEC)] = 1;
        if (n.kids === 0) leaves++;
      }
      const cover = filled.reduce((a, b) => a + b, 0) / SEC;
      const target = clamp(0.08 + cover * 0.72 + Math.min(liveN / 70, 1) * 0.25, 0, 1) * (1 - 0.55 * this.fx.confine);
      this.breadth += (target - this.breadth) * 0.25;
      let huskThreads = 0;
      for (const h of this.husks) huskThreads += h.threads;
      this.threadsOpen = leaves + huskThreads;
    }
    this.novelty += ((this.fx.confine > 0.3 ? 0.06 : 0.22) - this.novelty) * dt / 10;
    this.state.publish({ breadth: this.breadth, novelty: clamp(this.novelty, 0, 1) });

    /* rail bombardment: the world keeps arriving, and deeper registers
       mis-branch — a dud possibility grays on the spot with a red verdict */
    if (this.bombard) {
      this._subAcc = (this._subAcc || 0) + dt;
      const iv = 3.2 - 1.5 * p.duty;
      if (this._subAcc > iv) {
        this._subAcc = 0;
        const tips = this.nodes.filter((n) => n.st === 1 && !n.cut && !n.ghost);
        const at = tips.length ? tips[Math.floor(this.rng() * tips.length)] : this.root;
        if (at) {
          const dud = this.rng() < (1 - p.fidelity) * 0.55;
          const made = this.burst(at, 1 + Math.round(this.rng() * 2), {});
          if (made) {
            const [ex, ey] = this.end(at);
            if (dud) {
              for (const n of this.nodes) if (n.parent === at && this.t - n.born < 0.05) { n.hue = GRAY; n.vit = 0.5; }
              if (this.rng() < 0.6) this.badge(ex, ey - 0.12, false, 'dud');
            } else if (this.rng() < 0.35) {
              this.badge(ex, ey - 0.12, true, 'fruitful');
            }
          }
        }
        if (p.contrary > 0.2 && this.rng() < p.contrary) {
          /* the invisible hand: a limb someone was using, gone */
          const cand = this.nodes.filter((n) => n.gen >= 1 && !n.cut && !n.ghost);
          for (let i = 0; i < Math.min(4, cand.length); i++) {
            const n = cand[Math.floor(this.rng() * cand.length)];
            if (!n.cut) n.cut = { p: 0, gray: true };
          }
        }
      }
    }

    for (const b of this.badges) b.age += dt;
    this.badges = this.badges.filter((b) => b.age < 1.6);
  }

  /* ---------- rendering ---------- */
  ring(r, stroke, lw, a0, a1) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(r, 1), a0 === undefined ? 0 : a0, a1 === undefined ? TAU : a1);
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
    const R = g.R;
    const shk = this.shake > 0 ? (this.rng() - 0.5) * this.shake * 7 : 0;
    const gcx = this.cx + shk;
    const gcy = this.cy + (this.shake > 0 ? (this.rng() - 0.5) * this.shake * 5 : 0);

    ctx.save();
    ctx.translate(gcx, gcy);

    /* ---- interior ---- */
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();

    /* extraverted gradient: light lifts toward the rim, not the core */
    const vg = ctx.createRadialGradient(0, 0, R * 0.2, 0, 0, R);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.78, hexA(TINT, 0.035 * dim));
    vg.addColorStop(1, hexA(TINT, 0.11 * dim));
    ctx.fillStyle = vg;
    ctx.fillRect(-R, -R, R * 2, R * 2);

    this._drawHusks(g, dim);
    if (this.fx.confine > 0.02) this._drawConfine(g, dim);
    this._drawTree(g, dim);
    if (this.bridge) this._drawBridge(g, TINT, dim);

    ctx.restore(); /* unclip */

    /* ---- the radiant bleed: light escaping past the boundary ---- */
    const haloA = (0.10 + 0.14 * this.state.v.pleasure + 0.3 * this.flareT) * dim * this.opts.coreGlow * (1 - 0.7 * this.fx.confine);
    if (haloA > 0.01) {
      const hg = ctx.createRadialGradient(0, 0, R * 0.88, 0, 0, R * 1.42);
      hg.addColorStop(0, hexA(TINT, 0));
      hg.addColorStop(0.12, hexA(TINT, haloA));
      hg.addColorStop(1, hexA(TINT, 0));
      ctx.fillStyle = hg;
      ctx.fillRect(-R * 1.45, -R * 1.45, R * 2.9, R * 2.9);
    }
    /* light spills at the gap mouth — the aperture breathes */
    const spill = ctx.createRadialGradient(-R, 0, 0, -R, 0, R * 0.55);
    spill.addColorStop(0, hexA(TINT, 0.13 * dim));
    spill.addColorStop(1, hexA(TINT, 0));
    ctx.fillStyle = spill;
    ctx.fillRect(-R * 1.6, -R * 0.6, R * 1.2, R * 1.2);

    /* ---- inbound stimuli (drawn outside the clip: they come from the world) ---- */
    ctx.lineCap = 'round';
    for (const s of this.stimuli) {
      const x = s.x * R, y = s.y * R;
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy) || 1;
      ctx.beginPath();
      ctx.moveTo(x - (dx / d) * 9, y - (dy / d) * 9);
      ctx.lineTo(x, y);
      ctx.strokeStyle = hexA(s.hue, 0.7 * dim);
      ctx.lineWidth = s.partner ? 1.8 : 1.2;
      ctx.stroke();
    }

    /* ---- emitted sparks: past the boundary, into the environment ---- */
    for (const s of this.sparks) {
      const a = clamp(s.life, 0, 1) * 0.7 * dim;
      ctx.beginPath();
      ctx.arc(s.x * R, s.y * R, 1.7, 0, TAU);
      ctx.fillStyle = hexA(s.hue, a);
      ctx.fill();
    }

    /* ---- the flare passes through the ring and keeps going ---- */
    if (this.flareT > 0.02) {
      const fr = lerp(R * 0.3, R * 1.5, 1 - this.flareT);
      this.ring(fr, hexA('#ffffff', this.flareT * 0.45 * dim), 1.6 + this.flareT * 2);
    }

    /* ---- the boundary: a single OPEN ring, gap to the world ---- */
    const loopK = this.feeder && this.feeder.loop ? 1 : 0;
    const gapHalf = (g.gapW / 2) * (1 - 0.65 * this.fx.confine) * (1 + 0.8 * loopK);
    const a0 = g.gapA + gapHalf, a1 = g.gapA - gapHalf + TAU;
    this.ring(R, hexA(TINT, (0.46 + 0.4 * this.flareT) * dim), 1.9, a0, a1);
    /* the aperture lips glow — an opening, not a break */
    for (const a of [g.gapA + gapHalf, g.gapA - gapHalf]) {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * R, Math.sin(a) * R, 2.6, 0, TAU);
      ctx.fillStyle = hexA(hexLerp(TINT, '#ffffff', 0.4), 0.8 * dim);
      ctx.fill();
    }

    if (this.pulseT > 0.01) this.ring(R * 1.04, hexA(this.pulseColor, this.pulseT * 0.7), 2.4);

    /* ---- riff partner: a real interlocutor, just outside the aperture ---- */
    if (this.partner > 0.03) {
      const px = -R * 1.24, py = 0, pa = this.partner * dim;
      const pu = 0.5 + 0.5 * Math.sin(this.t * 3.2);
      ctx.beginPath(); ctx.arc(px, py, 5.5, 0, TAU);
      ctx.fillStyle = hexA('#ffd9c4', 0.85 * pa); ctx.fill();
      this.ringAt(px, py, 10 + pu * 5, hexA('#ffd9c4', 0.4 * pa * (1 - pu * 0.5)), 1.2);
      ctx.fillStyle = hexA(COL.muted, 0.8 * pa);
      ctx.font = `600 8px ${HUD_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('yes, and—', px, py - 14);
      ctx.textAlign = 'left';
    }

    /* verdicts carry an icon and a word, never colour alone */
    for (const b of this.badges) {
      const a = clamp(1.3 - b.age / 1.6, 0, 1) * dim;
      const bx = b.x * R, by = b.y * R - b.age * 18;
      const col = b.ok === true ? VERDICT.good : b.ok === false ? VERDICT.bad : COL.muted;
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, TAU);
      ctx.fillStyle = hexA(col, a * 0.95);
      ctx.fill();
      ctx.fillStyle = hexA('#ffffff', a);
      ctx.font = `700 9px ${HUD_FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(b.ok === true ? '✓' : b.ok === false ? '✕' : '?', bx, by + 0.5);
      ctx.textAlign = 'left';
      ctx.fillStyle = hexA(col, a);
      ctx.font = `600 10px ${HUD_FONT}`;
      ctx.fillText(b.label, bx + 11, by + 0.5);
    }

    ctx.restore(); /* untranslate */

    /* ambient page shifts: the demand reddens the edges; the corridor grays the room */
    if (this.fx.prune > 0.01) {
      const ag = ctx.createRadialGradient(this.cx, this.cy, Math.min(W, H) * 0.28, this.cx, this.cy, Math.max(W, H) * 0.72);
      ag.addColorStop(0, 'rgba(0,0,0,0)');
      ag.addColorStop(1, hexA(COL.crit, 0.13 * this.fx.prune * (0.8 + 0.2 * Math.sin(this.t * 2.6))));
      ctx.fillStyle = ag;
      ctx.fillRect(0, 0, W, H);
    }
    if (this.fx.confine > 0.01) {
      ctx.fillStyle = `rgba(10,10,13,${(0.20 * this.fx.confine).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (p.noise > 0.05) {
      const n = Math.round(p.noise * 46);
      ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(gcx + (this.rng() - 0.5) * R * 2.4, gcy + (this.rng() - 0.5) * R * 2.4, 1.4, 1.4);
      }
    }

    if (this.opts.hud) {
      if (this.fx.prune > 0.3) this._drawBanner('CONVERGENCE DEMANDED · OPTIONS CLOSING', COL.crit, this.fx.prune);
      else if (this.fx.confine > 0.3) this._drawBanner('TEMPLATE ACTIVE · ZERO DEGREES OF FREEDOM', COL.warn, this.fx.confine);
      this.drawHUD(TINT, dim);
    }
  }

  ringAt(x, y, r, stroke, lw) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(r, 1), 0, TAU);
    ctx.strokeStyle = stroke; ctx.lineWidth = lw;
    ctx.stroke();
  }

  _drawHusks(g, dim) {
    const ctx = this.ctx, R = g.R;
    for (const h of this.husks) {
      const age = this.t - h.born;
      const a = Math.max(0.13, 0.5 - age * 0.06) * dim;
      const drift = Math.min(age * 0.008, 0.05);
      const dx = Math.cos(h.drift) * drift * R, dy = Math.sin(h.drift) * drift * R;
      ctx.lineCap = 'round';
      ctx.strokeStyle = hexA(GRAY, a);
      for (const s of h.segs) {
        ctx.beginPath();
        ctx.moveTo(s.x1 * R + dx, s.y1 * R + dy);
        ctx.lineTo(s.x2 * R + dx, s.y2 * R + dy);
        ctx.lineWidth = s.w * 0.8;
        ctx.stroke();
      }
    }
  }

  _drawConfine(g, dim) {
    const ctx = this.ctx, R = g.R, k = this.fx.confine;
    const h = g.boxH * R;
    /* the world outside the corridor goes administrative gray */
    ctx.fillStyle = `rgba(8,9,14,${(0.4 * k).toFixed(3)})`;
    ctx.fillRect(-R, -R, R * 2, R - h);
    ctx.fillRect(-R, h, R * 2, R - h);
    ctx.strokeStyle = hexA('#8a8898', 0.55 * k * dim);
    ctx.lineWidth = 1.2;
    for (const y of [-h, h]) {
      ctx.beginPath(); ctx.moveTo(-R, y); ctx.lineTo(R, y); ctx.stroke();
      /* checklist ticks along the template line */
      for (let x = -R + 12; x < R; x += 26) {
        ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
      }
    }
    ctx.fillStyle = hexA('#8a8898', 0.75 * k * dim);
    ctx.font = `600 8px ${HUD_FONT}`;
    ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('procedure: steps in order, boxes as labeled', R * 0.9, -h - 6);
    ctx.textAlign = 'left';
  }

  _drawTree(g, dim) {
    const ctx = this.ctx, R = g.R;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const noiseJit = this.params.noise;
    /* chromatic doubling under stress: the same branch seen two ways */
    const ab = clamp(this.state.v.stress * 1.25 - 0.18, 0, 1);

    for (const n of this.nodes) {
      if (n.gen === 0) {
        /* the seed: a small bright point — dim when the loop hollows the core */
        const coreDim = this.feeder && this.feeder.loop ? 0.35 : 1;
        const pu = 0.75 + 0.25 * Math.sin(this.t * 1.6 + n.tw);
        const grd = ctx.createRadialGradient(n.bx * R, n.by * R, 0, n.bx * R, n.by * R, 10);
        grd.addColorStop(0, hexA('#ffffff', 0.75 * pu * dim * coreDim));
        grd.addColorStop(0.5, hexA(n.hue, 0.4 * dim * coreDim));
        grd.addColorStop(1, hexA(n.hue, 0));
        ctx.fillStyle = grd;
        ctx.fillRect(n.bx * R - 10, n.by * R - 10, 20, 20);
        continue;
      }
      const cutK = n.cut ? ss(n.cut.p) : 0;
      const effProg = n.prog * (1 - cutK);
      if (effProg <= 0.02) continue;
      const L = n.len * ss(effProg);
      let a2 = n.ang;
      if (n.curlK) a2 += n.curlK * ss(effProg) * 2.2 * n.curlDir;
      const bx = n.bx * R, by = n.by * R + cutK * cutK * 8;   /* cut wood sags */
      const ex = (n.bx + Math.cos(a2) * L) * R, ey = (n.by + Math.sin(a2) * L) * R + cutK * cutK * 8;
      /* control point: perpendicular bow */
      const mx = (bx + ex) / 2, my = (by + ey) / 2;
      const px2 = -(ey - by), py2 = (ex - bx);
      const pl = Math.hypot(px2, py2) || 1;
      const wob = (1 - this.structure.rigidity * 0.7) * Math.sin(this.t * 1.3 + n.tw) * 0.06;
      const bowPx = (n.bow * 0.28 + wob) * L * R;
      const cx2 = mx + (px2 / pl) * bowPx, cy2 = my + (py2 / pl) * bowPx;

      const witherK = n.st === 2 ? 1 - clamp(n.vit / 0.45, 0, 1) : 0;
      let hue = n.hue;
      if (n.cut && n.cut.gray) hue = hexLerp(hue, GRAY, 0.7);
      else if (witherK > 0) hue = hexLerp(hue, GRAY, witherK * 0.8);
      const tw = 0.8 + 0.2 * Math.sin(this.t * 2.1 + n.tw);
      let alpha = (n.ghost ? 0.22 * clamp(n.vit, 0, 1) : (0.44 + 0.5 * clamp(n.vit, 0, 1)) * tw) * dim;
      if (n.cut && n.cut.clean) alpha *= 1.1;   /* the snip flashes as it goes */
      const lw = (n.thick ? 3.4 : Math.max(2.6 - n.gen * 0.4, 0.9)) * n.w;

      if (n.ghost) ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(cx2, cy2, ex, ey);
      if (ab > 0.02 && !n.ghost) {
        ctx.strokeStyle = hexA('#ff5a78', 0.16 * ab * dim);
        ctx.lineWidth = lw + 2;
        ctx.stroke();
      }
      /* live wood glows — luminescence is the extraverted register */
      if (!n.ghost && !n.cut && n.st <= 1 && witherK < 0.3) {
        ctx.strokeStyle = hexA(hue, 0.13 * clamp(n.vit, 0.3, 1) * dim);
        ctx.lineWidth = lw + 3.5;
        ctx.stroke();
      }
      ctx.strokeStyle = hexA(hue, clamp(alpha, 0, 1));
      ctx.lineWidth = lw;
      ctx.stroke();
      ctx.setLineDash([]);

      /* growing tips glow; live leaves twinkle; valued branches ring rose */
      if (n.st === 0 && !n.cut) {
        ctx.beginPath();
        ctx.arc(ex, ey, 2.2, 0, TAU);
        ctx.fillStyle = hexA(hexLerp(hue, '#ffffff', 0.5), 0.9 * dim);
        ctx.fill();
      } else if (n.st === 1 && n.kids === 0 && !n.cut && !n.ghost) {
        const jx = noiseJit > 0.05 ? (this.rng() - 0.5) * noiseJit * 5 : 0;
        ctx.beginPath();
        ctx.arc(ex + jx, ey, 1.6 + 0.7 * Math.sin(this.t * 2.4 + n.tw), 0, TAU);
        ctx.fillStyle = hexA(hue, 0.75 * tw * dim * clamp(n.vit, 0.2, 1));
        ctx.fill();
        if (n.valued) {
          ctx.beginPath();
          ctx.arc(ex, ey, 4.2, 0, TAU);
          ctx.strokeStyle = hexA(this.COL.f, 0.5 * dim);
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }
      /* the clean Ti snip: a brief white tick where the branch was judged */
      if (n.cut && n.cut.clean && n.cut.p < 0.5) {
        ctx.beginPath();
        ctx.moveTo(ex - 3, ey - 3); ctx.lineTo(ex + 3, ey + 3);
        ctx.strokeStyle = hexA('#ffffff', (1 - n.cut.p * 2) * 0.8 * dim);
        ctx.lineWidth = 1.1;
        ctx.stroke();
      }
    }
  }

  _drawBridge(g, TINT, dim) {
    const ctx = this.ctx, R = g.R, b = this.bridge;
    const mx = (b.ax + b.bx) / 2, my = (b.ay + b.by) / 2 - 0.22;
    const t1 = ss(b.prog);
    /* draw the arc partially, from A toward B */
    ctx.beginPath();
    const S = 24;
    for (let i = 0; i <= Math.floor(S * t1); i++) {
      const u = i / S;
      const x = lerp(lerp(b.ax, mx, u), lerp(mx, b.bx, u), u) * R;
      const y = lerp(lerp(b.ay, my, u), lerp(my, b.by, u), u) * R;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = hexA(TINT, 0.25 * dim);
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = hexA(hexLerp(TINT, '#ffffff', 0.4), (0.5 + 0.4 * t1) * dim);
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  _drawBanner(label, color, amt) {
    const ctx = this.ctx;
    const a = clamp(amt, 0, 1) * (0.55 + 0.45 * Math.sin(this.t * 9));
    ctx.font = `700 10px ${HUD_FONT}`;
    const w = ctx.measureText(label).width + 34;
    const x = this.cx - w / 2, y = 14;
    ctx.fillStyle = `rgba(10,8,4,${(0.75 * a).toFixed(3)})`;
    ctx.strokeStyle = hexA(color, a);
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, 24, 6);
    else ctx.rect(x, y, w, 24);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = hexA(color, a);
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('◉', x + 10, y + 12.5);
    ctx.fillText(label, x + 24, y + 12.5);
    ctx.textBaseline = 'alphabetic';
  }

  /** Te keeps score in throughput; Ni in convergence. Ne's readout is
      breadth — live branches, open threads, and how fresh the growth is. */
  drawHUD(TINT, dim) {
    const ctx = this.ctx, s = this.opts.hudScale;
    const x = 16, y = 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = hexA(this.COL.muted, 0.85);
    ctx.font = `600 ${9 * s}px ${HUD_FONT}`;
    ctx.fillText('DIVERGENCE', x, y);

    const live = this._liveCount();
    let big = `${live} live`;
    let bigCol = TINT;
    if (this._bigWord && this.t < this._bigUntil) {
      big = this._bigWord;
      bigCol = this._bigWord === 'PRUNED' ? this.COL.crit
        : this._bigWord === 'CONFINED' ? this.COL.warn
        : '#ffffff';
    } else if (this.flareT > 0.55) { big = 'BLOOM'; bigCol = '#ffffff'; }
    ctx.fillStyle = hexA(bigCol, 0.35 + 0.6 * dim);
    ctx.font = `700 ${17 * s}px ${HUD_FONT}`;
    ctx.fillText(big, x, y + 19 * s);

    ctx.fillStyle = hexA(this.COL.ink2, 0.6);
    ctx.font = `500 ${10 * s}px ${HUD_FONT}`;
    ctx.fillText(`breadth ${this.breadth.toFixed(2)} · novelty ${clamp(this.novelty, 0, 1).toFixed(2)}`, x, y + 34 * s);
    ctx.fillStyle = hexA(this.COL.muted, 0.75);
    let line3 = `open ${this.threadsOpen} · closed ${this.threadsClosed} · trees ${this.started}`;
    if (this.hybrids > 0) line3 += ` · hybrids ${this.hybrids}`;
    ctx.fillText(line3, x, y + 46 * s);

    const cw = 7 * s, gp = 2.5 * s, cells = 16;
    for (let i = 0; i < cells; i++) {
      const on = this.breadth * cells > i;
      ctx.fillStyle = hexA(on ? TINT : this.COL.axis, on ? 0.85 : 0.5);
      ctx.fillRect(x + i * (cw + gp), y + 53 * s, cw, 3.5 * s);
    }
    if (this._hoverNote > 0.05) {
      ctx.font = `600 ${9.5 * s}px ${HUD_FONT}`;
      ctx.fillStyle = hexA(TINT, 0.9 * clamp(this._hoverNote, 0, 1));
      ctx.fillText('branching at cursor', x, y + 68 * s);
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
