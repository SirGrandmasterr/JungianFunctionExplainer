/* ============================================================
   CURRENTS · SiGlyph — The Still Pool
   Si as a comparator: a sealed pool seen from above, its depth
   banded into concentric sediment strata — every past inflow
   laid down as a ring, the oldest fused bright at the core.
   Intake is metered: the world is admitted one drop at a time
   through the sealed double rim, and every admitted drop is
   interrogated by the depths.

   Three fates for an arrival:
     FAMILIAR — a beeline to its stratum; the whole ring lights
       on contact (recognition is resonance, not lookup), the
       stratum thickens a hair, and the encounter gets cheaper.
     DEVIANT — it reaches its ring and refuses to merge: strobe
       between stored and observed color, a beat-frequency
       shiver across the surface, and a diff readout naming
       exactly what is off. The record awaits a ruling: accept
       lays a provisional sub-band beside the old stratum;
       reject expels the drop and the old ring re-asserts.
     NOVEL — nothing answers; it searches ring after ring while
       the pool dims and contracts (the flinch), then settles at
       the rim as a thin provisional band — the first layer of a
       future familiarity. Repetition brightens it and drops
       its cost: comfort, manufactured in front of the user.

   Shape grammar (§1.3): perceiving → circular aperture/lens.
   Introverted → closed double ring, dark rim, light condensing
   inward — the luminous core IS the oldest strata — and nothing
   emitted except what the record refuses.
   ============================================================ */
import { TAU, lerp, clamp, mulberry32, hexA, hexLerp } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';
import { SiState } from './si-state.js';

const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
const HUD_FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const ss = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/* what, exactly, is off — Si's alarm is specific, never vague */
const DIFFS = [
  'pitch a third low', 'edge two shades cool', 'weight −8%', 'hum +14 Hz',
  'salt · missing', 'two minutes early', 'grip a size small', 'gloss where matte was',
];

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

export class SiGlyph {
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
    this.state = opts.state || new SiState();

    this.rings = [];
    this.MAXR = 12;
    this._buildRings();
    this.drops = [];
    this.ripples = [];
    this.badges = [];
    this.flinch = 0;          /* eased ring contraction on novelty */
    this.dimVeil = 0;         /* pool-wide dimming during a search */
    this.gateGlow = 0;        /* rim intake glow */
    this.gateA = 0;           /* rim intake angle */
    this.auditA = null;       /* Te's verification sweep */

    this.pending = null;      /* the deviation awaiting a ruling */
    this.onResolve = null;    /* page hook: (choice, auto) => {} */
    this.lastResolution = null;

    this.matchShown = 0.92;   /* eased live-match readout */
    this.costU = 1.0;         /* last encounter cost, in units */
    this.lastFed = 0;
    this.novelSeen = {};      /* key → provisional ring, for repeat spawns */
    this._novelCount = 0;

    this.colorShift = 0; this.pulseT = 0; this.pulseColor = '#ffffff';
    this.chime = 0;           /* recognition flash envelope */
    this.pointer = { x: null, y: null };
    this.hoverRing = null;
    this.steered = false;
    this.bombard = false;
    this._ambAcc = 0; this._subAcc = 0;
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
        if (REDUCED) { this.step(1 / 30); this.draw(); }
      });
      canvas.addEventListener('pointerleave', () => {
        this.pointer.x = this.pointer.y = null; this.hoverRing = null;
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
    this.baseR = Math.min(this.W, this.H) * 0.38;
    this.g = this.geom();
    if (REDUCED) this.renderStatic();
  }

  geom() {
    const R = this.baseR * this.params.scale;
    return {
      R,
      Rin: R * 0.94,       /* second ring of the sealed double rim */
      coreR: R * 0.185,    /* the fused oldest material */
      z0: 0.26, z1: 0.86,  /* the strata zone, in units of R */
    };
  }

  /* ---------- the strata ---------- */
  _buildRings() {
    const rng = mulberry32(this.opts.seed * 131 + 7);
    this.rings = [];
    for (let i = 0; i < this.MAXR; i++) {
      const t = i / (this.MAXR - 1);
      this.rings.push({
        id: i,
        rMid: lerp(0.30, 0.83, Math.pow(t, 0.92)),
        halfW: lerp(0.026, 0.011, t),
        /* the oldest strata run pale gold — light condensed by decades */
        hue: hexLerp('#ffe3ae', this.COL.fn, 0.22 + 0.72 * t),
        fed: Math.round(lerp(18, 2, t) * (0.8 + rng() * 0.4)),
        bright: clamp(lerp(1.0, 0.42, t) + (rng() - 0.5) * 0.12, 0.25, 1),
        wob: rng() * TAU,
        rot: (rng() - 0.5) * 0.05,
        rot0: rng() * TAU,
        sweep: null,          /* recognition pulse in flight */
        shrug: 0,             /* the "not mine" dip during a search */
        assert: 0,            /* post-rejection re-assertion glow */
        provisional: false,
        alive: 1,             /* structure fade-in/out */
        key: null,
      });
    }
    this.activeN = 9;
  }
  _activeRings() { return this.rings.filter((r) => r.alive > 0.5 && !r.provisional).slice(0, this.activeN); }

  /* ---------- shared glyph API (rail & feeder modules depend on this) ---------- */
  setTarget(p) {
    Object.assign(this.target, { contrary: 0 }, p);
    if (REDUCED) { Object.assign(this.params, this.target); this.g = this.geom(); this.renderStatic(); }
  }
  setStructure(s) {
    const next = Object.assign({}, this.structure, s);
    const changed = next.countMul !== this.structure.countMul || next.rigidity !== this.structure.rigidity;
    this.structure = next;
    /* experience literally enlarges the archive: more strata with age */
    this.activeN = clamp(Math.round(5 + (next.countMul - 0.75) * 9), 5, this.MAXR);
    if (changed && REDUCED) this.renderStatic();
  }
  setFeeder(f) {
    this.feeder = f;
    this.drops = []; this.pending = null; this.auditA = null;
    if (REDUCED) this.renderStatic();
  }
  pulse(color) { this.pulseT = 1; this.pulseColor = color; }
  color() { return hexLerp(this.COL.fn, '#d0455f', this.colorShift); }

  /* legacy readouts other code may probe */
  get stress() { return this.state.v.stress; }
  set stress(v) { this.state.v.stress = this.state.tv.stress = clamp(v, 0, 1); }
  get pleasure() { return this.state.v.pleasure; }
  set pleasure(v) { this.state.v.pleasure = this.state.tv.pleasure = clamp(v, 0, 1); }

  badge(x, y, ok, label) { this.badges.push({ x, y, ok, label, age: 0 }); }

  /* the price of an encounter falls as the stratum thickens — ritual,
     priced. Novelty and disputes are the expensive aisles. */
  _encounterCost(ring, kind) {
    if (kind === 'novel') return clamp(3.9 - 0.85 * (ring ? Math.min(ring.fed, 4) : 0), 0.9, 3.9);
    if (kind === 'accept') return 3.2;
    if (kind === 'reject') return 1.4;
    return clamp(0.65 + 3.4 * Math.pow(0.85, ring ? ring.fed : 1), 0.65, 3.4);
  }

  /* ---------- drops ---------- */
  _spawnDrop(kind, o = {}) {
    const rng = this.rng, g = this.g, f = this.feeder;
    const sealed = f && f.sealed;
    const th = o.th !== undefined ? o.th
      : f && f.aim !== undefined && !sealed
        ? f.aim + (rng() - 0.5) * TAU * clamp(f.spread || 0.5, 0.15, 1) * 0.4
        : rng() * TAU;

    let ring = o.ring || null;
    if (!ring && kind !== 'novel') {
      const act = this._activeRings();
      if (f && f.loopRings) {
        /* a sealed loop re-feeds the same few entries, nightly */
        const pick = f.loopRings[(rng() * f.loopRings.length) | 0];
        ring = act[clamp(pick, 0, act.length - 1)];
      } else if (f && f.variety !== undefined) {
        /* high variety spreads care across the whole ledger */
        const span = clamp(Math.round(act.length * lerp(0.35, 1, f.variety)), 1, act.length);
        ring = act[((rng() * span) | 0) + (act.length - span)];
      }
      if (!ring) ring = act[(rng() * act.length) | 0];
    }

    const d = {
      kind, ring,
      th, r: sealed ? 0.06 : 1.35,          /* loops replay from the inside */
      inward: !sealed,
      phase: sealed ? 'descend' : 'approach',
      born: this.t,
      obsHue: null,
      diff: DIFFS[(rng() * DIFFS.length) | 0],
      badge: !!o.badge,
      auto: o.auto !== undefined ? o.auto : true,
      novelKey: o.novelKey || null,
      seatAt: 0, mergeK: 0, searchT: 0,
      trail: [],
    };
    if (kind === 'familiar') d.obsHue = ring.hue;
    if (kind === 'deviant') d.obsHue = hexLerp(ring.hue, '#4fc9e0', 0.42);
    if (kind === 'novel') {
      d.obsHue = o.hue || hexLerp(this.COL.fn, ['#8bd47a', '#4fc9e0', '#c77df0', '#f56a8c'][(rng() * 4) | 0], 0.5);
      d.searchDur = o.fast ? 1.4 : 3.8;
    }
    /* mis-filing: the deep-stack failure modes, in their own terms —
       false alarms on the unchanged, unfiled drift on the changed */
    const err = (1 - this.params.fidelity) * 0.55 + this.params.contrary * 0.25;
    if (kind === 'familiar' && this.rng() < err * 0.55) d.misfileAs = 'alarm';
    if (kind === 'familiar' && this.rng() < err * 0.4) d.misfileAs = 'wrongRing';
    this.drops.push(d);
    return d;
  }

  /* ---------- scenario triggers (Zone D · the Recognition Lab) ---------- */
  /**
   * @param {string} key    familiar | deviant | novel
   * @param {Object} impact additive state deltas, e.g. { stress:+0.55 }
   */
  scenario(key, impact = {}) {
    this.state.impulse(impact);
    const act = this._activeRings();

    if (key === 'familiar') {
      /* the ritual: the newest established stratum, same one every time —
         young enough that the price is still visibly falling */
      const ring = act[act.length - 1];
      const d = this._spawnDrop('familiar', { ring, badge: true });
      d.misfileAs = null;                   /* the lab's ritual is clean */
      d.auto = true;
    } else if (key === 'deviant') {
      if (this.pending) this.resolve('reject', true);   /* one ruling at a time */
      const ring = act[Math.min(4, act.length - 1)];
      const d = this._spawnDrop('deviant', { ring, badge: true });
      d.misfileAs = null;
      d.auto = false;                       /* the ruling is yours */
    } else if (key === 'novel') {
      /* the same unprecedented thing, every time — so familiarity can be
         watched being manufactured */
      const known = this.novelSeen.lab;
      const d = this._spawnDrop('novel', {
        badge: true, novelKey: 'lab',
        hue: hexLerp(this.COL.fn, '#8bd47a', 0.55),
        fast: !!known,
      });
      if (known) d.ring = known;
    }
  }

  /** The user's ruling on a pending deviation (or the pool's own, when auto) */
  resolve(choice, auto = false) {
    const d = this.pending;
    if (!d) return;
    this.pending = null;
    /* shadow registers invert the ruling: the record fights you */
    if (this.params.contrary > 0.2 && this.rng() < this.params.contrary * 0.7) {
      choice = choice === 'accept' ? 'reject' : 'accept';
      this.badge(this._dx(d), this._dy(d) - 18, false, 'ruling inverted');
    }
    this.lastResolution = choice;
    d.phase = choice === 'accept' ? 'subring' : 'expel';
    d.resolveT = this.t;
    if (d.badge) this.costU = this._encounterCost(d.ring, choice);
    if (choice === 'accept') {
      /* a thin provisional band beside the old stratum: the impression
         updates — visibly, slowly, and never in place */
      const sub = {
        id: 100 + this._novelCount++,
        rMid: clamp(d.ring.rMid + d.ring.halfW + 0.016, 0.28, 0.88),
        halfW: 0.008,
        hue: d.obsHue,
        fed: 1, bright: 0.38,
        wob: this.rng() * TAU, rot: d.ring.rot * 0.8, rot0: this.rng() * TAU,
        sweep: null, shrug: 0, assert: 0,
        provisional: true, alive: 1, key: null, subOf: d.ring.id,
      };
      this.rings.push(sub);
      d.subRing = sub;
      this.badge(this._dx(d), this._dy(d), true, 'record updated');
      this.state.impulse({ stress: -0.18, pleasure: 0.08 });
    } else {
      d.ring.assert = 1;
      d.ring.bright = clamp(d.ring.bright + 0.06, 0, 1);
      this.badge(this._dx(d), this._dy(d), true, 'anomaly dismissed');
      this.state.impulse({ stress: -0.22, pleasure: 0.05 });
    }
    this.state.flags.deviation = false;
    if (this.onResolve) this.onResolve(choice, auto);
  }

  _dx(d) { return Math.cos(d.th) * d.r * this.g.R; }
  _dy(d) { return Math.sin(d.th) * d.r * this.g.R; }

  /* ---------- simulation ---------- */
  step(dt) {
    this.t += dt;
    const p = this.params, tg = this.target, f = this.feeder, g = this.g = this.geom();
    for (const k in tg) p[k] = lerp(p[k], tg[k], 1 - Math.pow(0.0015, dt));

    this.state.step(dt);

    this.pulseT = Math.max(0, this.pulseT - dt * 1.3);
    this.chime = Math.max(0, this.chime - dt * 1.1);
    this.gateGlow = Math.max(0, this.gateGlow - dt * 1.6);

    /* duty: the surface films over when the archive is not consulted */
    const w1 = (Math.sin(this.t * 0.5) + 1) / 2;
    const w2 = (Math.sin(this.t * 1.7 + 1.3) + 1) / 2;
    const dutyWave = lerp(w1, w1 * 0.5 + w2 * 0.5, clamp(p.noise * 1.6, 0, 1));
    this.awake = p.duty >= 0.99 ? 1 : clamp((p.duty * 1.25 - dutyWave) * 4 + 0.35, 0.1, 1);

    const searching = this.drops.some((d) => d.phase === 'search');
    this.flinch += ((searching ? 1 : 0) - this.flinch) * (1 - Math.exp(-dt * 2.5));
    this.dimVeil += ((searching ? 0.45 : this.pending ? 0.2 : 0) - this.dimVeil) * (1 - Math.exp(-dt * 2.2));

    this.colorShift = lerp(this.colorShift,
      clamp((this.state.v.stress - 0.5) * 1.4, 0, 1), 1 - Math.pow(0.08, dt));

    /* strata upkeep: fed rings glow; unfed rings dim toward a floor and
       never quite vanish. Rigidity (age) damps the idle wobble. */
    let orderSum = 0, orderN = 0;
    for (const r of this.rings) {
      const activeIdx = this.rings.indexOf(r);
      const isActive = r.provisional ? true : activeIdx < this.activeN;
      r.alive += ((isActive ? 1 : 0) - r.alive) * (1 - Math.exp(-dt * 2));
      if (r.alive < 0.02) continue;
      r.rot0 += r.rot * dt;
      r.bright = Math.max(r.provisional ? 0.16 : 0.25, r.bright - dt * 0.0045);
      r.shrug = Math.max(0, r.shrug - dt * 2.4);
      r.assert = Math.max(0, r.assert - dt * 0.8);
      if (r.sweep && this.t - r.sweep.t0 > 1.0) r.sweep = null;
      if (!r.provisional) { orderSum += r.bright; orderN++; }
    }
    const order = orderN ? orderSum / orderN : 0.6;

    /* homeostatic drives: a settled archive hums; a disputed one costs */
    this.state.impulse({
      pleasure: (order - 0.60) * 0.02 * dt,
      stress: ((this.pending ? 0.05 : 0) + (searching ? 0.032 : 0) + (f && f.starve ? 0.022 : 0) + (f && f.sealed ? 0.014 : 0)) * dt,
    });
    this.state.flags.novel = searching;
    this.state.flags.misfile = this.t < (this._misfileUntil || 0);
    if (!this.drops.some((d) => d.kind === 'familiar' && d.phase !== 'done')) this.state.flags.ritual = false;

    /* live match readout eases toward what is actually happening */
    let matchTarget = 0.55 + 0.45 * order;
    if (this.pending) matchTarget = 0.90;
    if (searching) matchTarget = 0.08;
    this.matchShown += (matchTarget - this.matchShown) * (1 - Math.exp(-dt * 2.2));
    this.state.publish({ match: this.matchShown, order });

    /* ---- metered intake: ambient arrivals, one at a time ---- */
    const inFlight = this.drops.filter((d) => d.phase === 'approach' || d.phase === 'dwell' || d.phase === 'descend').length;
    this._ambAcc += dt * this.awake;
    const rateMul = f ? lerp(0.6, 1.8, f.rate !== undefined ? f.rate : 0.55) : 1;
    const iv = (this.bombard ? lerp(4.2, 2.4, p.duty) : 5.2) / rateMul;
    if (this._ambAcc > iv && inFlight < 2 && !this.pending) {
      this._ambAcc = 0;
      if (f && f.starve) {
        /* Ne wired straight in: hypotheticals — none of it has happened,
           none of it will match, and the pool fills with fiction */
        this._spawnDrop('novel', { fast: true, badge: false });
      } else {
        const roll = this.rng();
        if (roll < 0.1 && !this.bombard) this._spawnDrop('deviant', { auto: true });
        else this._spawnDrop('familiar', { badge: this.bombard });
      }
    }

    /* Te audits the record on a schedule */
    if (f && f.audit) {
      if (this.auditA === null && this.rng() < dt * 0.12) this.auditA = 0;
      if (this.auditA !== null) {
        this.auditA += dt * 1.4;
        const hit = Math.floor((this.auditA / TAU) * this._activeRings().length);
        const act = this._activeRings();
        if (act[hit]) act[hit].assert = Math.max(act[hit].assert, 0.5);
        if (this.auditA > TAU) this.auditA = null;
      }
    }

    /* ---- drop lifecycle ---- */
    for (const d of this.drops) {
      const ringR = d.ring ? d.ring.rMid * (1 - 0.018 * this.flinch) : 0;
      if (d.phase === 'approach') {
        d.r -= dt * (0.6 + 0.25 * this.awake);
        if (d.r <= 1.02) {
          d.phase = 'dwell'; d.dwellT = 0.28 + p.latency / 1400;
          this.gateGlow = 1; this.gateA = d.th;
        }
      } else if (d.phase === 'dwell') {
        /* the sealed rim admits the world one drop at a time */
        d.dwellT -= dt;
        if (d.dwellT <= 0) d.phase = d.kind === 'novel' && !d.ring ? 'search' : 'descend';
      } else if (d.phase === 'descend') {
        const dir = d.inward ? -1 : 1;
        const targetR = d.kind === 'novel' && d.ring ? d.ring.rMid : ringR;
        d.r += (targetR - d.r) * (1 - Math.exp(-dt * 2.6));
        d.th += dt * 0.25 * dir;
        if (Math.abs(d.r - targetR) < 0.012) this._seat(d);
      } else if (d.phase === 'search') {
        /* ring after ring, and nothing answers */
        d.searchT += dt;
        const k = d.searchT / d.searchDur;
        d.r = lerp(0.95, 0.3, 0.5 - 0.5 * Math.cos(k * Math.PI * 2.2));
        d.th += dt * 0.5;
        const near = this.rings.find((r) => r.alive > 0.5 && Math.abs(r.rMid - d.r) < 0.02 && r.shrug < 0.3);
        if (near) near.shrug = 1;
        if (d.searchT >= d.searchDur) this._settleNovel(d);
      } else if (d.phase === 'seat') {
        /* strobing on the ring, awaiting the ruling */
        d.th += (d.ring ? d.ring.rot : 0) * dt;
        d.r = ringR;
        if (d.auto && this.t - d.seatAt > (this.bombard ? 2.6 : 6.5) && this.pending === d) {
          /* left unattended, a high-fidelity pool holds the record */
          this.resolve(this.rng() < 0.25 + (1 - p.fidelity) * 0.5 ? 'accept' : 'reject', true);
        }
      } else if (d.phase === 'subring' || d.phase === 'merge') {
        d.mergeK += dt * 2.2;
        if (d.mergeK >= 1) d.phase = 'done';
      } else if (d.phase === 'expel') {
        d.r += dt * 0.9;
        if (d.r > 1.4) d.phase = 'done';
      }
      d.trail.push({ th: d.th, r: d.r });
      if (d.trail.length > 7) d.trail.shift();
    }
    this.drops = this.drops.filter((d) => d.phase !== 'done');

    for (const rp of this.ripples) rp.age += dt;
    this.ripples = this.ripples.filter((rp) => rp.age < rp.max);

    /* ---- hover sounding ---- */
    this.hoverRing = null;
    if (this.opts.interactive && this.pointer.x !== null) {
      const dx = this.pointer.x - this.cx, dy = this.pointer.y - this.cy;
      const rr = Math.hypot(dx, dy) / g.R;
      if (rr < 1.0) {
        this.steered = true;
        let best = null, bd = 1;
        for (const r of this.rings) {
          if (r.alive < 0.5) continue;
          const d2 = Math.abs(r.rMid - rr);
          if (d2 < Math.max(r.halfW * 2.2, 0.028) && d2 < bd) { bd = d2; best = r; }
        }
        this.hoverRing = best;
      }
    }

    for (const b of this.badges) b.age += dt;
    this.badges = this.badges.filter((b) => b.age < 1.7);
  }

  _seat(d) {
    const ring = d.ring;
    if (d.kind === 'familiar' && d.misfileAs === 'wrongRing') {
      /* the deep-stack archive files it — somewhere */
      const act = this._activeRings();
      const wrong = act[(this.rng() * act.length) | 0];
      if (wrong && wrong !== ring) {
        d.ring = wrong;
        d.phase = 'merge'; d.seatAt = this.t;
        wrong.sweep = { t0: this.t, from: d.th };
        this.badge(this._dx(d), this._dy(d), false, 'mis-filed');
        this._misfileUntil = this.t + 2.2;
        this.state.impulse({ stress: 0.12, pleasure: -0.05 });
        if (d.badge) this.costU = this._encounterCost(wrong, 'familiar');
        return;
      }
    }
    if (d.kind === 'familiar' && d.misfileAs === 'alarm') {
      /* a false alarm: the unchanged, flagged anyway */
      d.kind = 'deviant';
      d.obsHue = ring.hue;
      d.diff = 'no deviation found';
      d.falseAlarm = true;
    }

    if (d.kind === 'familiar') {
      d.phase = 'merge'; d.seatAt = this.t;
      ring.fed++; this.lastFed = ring.fed;
      ring.bright = clamp(ring.bright + 0.12, 0, 1);
      ring.halfW = Math.min(ring.halfW + 0.0006, 0.034);
      ring.sweep = { t0: this.t, from: d.th };
      if (ring.provisional && ring.fed >= 3) {
        ring.provisional = false;
        this.badge(this._dx(d), this._dy(d) - 16, true, 'stratum established');
      }
      this.chime = 1;
      if (d.badge) this.costU = this._encounterCost(ring, 'familiar');
      this.matchShown = Math.max(this.matchShown, 0.96);
      this.state.impulse({ pleasure: 0.06 + 0.02 * (this.feeder ? clamp(this.feeder.weight || 1, 0.2, 1.2) : 1), stress: -0.02 });
      this.state.flags.ritual = true;
      if (d.badge) this.badge(this._dx(d), this._dy(d), true, `match · ${ring.fed}× fed`);
      /* the echo of the chime */
      this.ripples.push({ r: ring.rMid, age: 0, max: 0.9, th: d.th });
    } else if (d.kind === 'deviant') {
      d.phase = 'seat'; d.seatAt = this.t;
      this.pending = d;
      this.state.flags.deviation = true;
      this.state.impulse({ stress: d.falseAlarm ? 0.10 : 0.16 });
      this.ripples.push({ r: ring.rMid, age: 0, max: 1.4, th: d.th });
      if (d.falseAlarm && d.badge !== true) {
        /* ambient false alarms resolve themselves, badged in bombard mode */
        if (this.bombard) this.badge(this._dx(d), this._dy(d), false, 'false alarm');
      }
    } else if (d.kind === 'novel' && d.ring) {
      /* the repeat arrival: it knows where home is now */
      d.phase = 'merge'; d.seatAt = this.t;
      const ring2 = d.ring;
      ring2.fed++; this.lastFed = ring2.fed;
      ring2.bright = clamp(ring2.bright + 0.16, 0, 1);
      ring2.sweep = { t0: this.t, from: d.th };
      if (ring2.provisional && ring2.fed >= 3) {
        ring2.provisional = false;
        this.badge(this._dx(d), this._dy(d) - 16, true, 'stratum established');
      }
      this.chime = 0.7;
      if (d.badge) this.costU = this._encounterCost(ring2, 'novel');
      this.state.impulse({ pleasure: 0.05, stress: -0.03 });
      if (d.badge) this.badge(this._dx(d), this._dy(d), true, `settling · ${ring2.fed}× seen`);
    }
  }

  _settleNovel(d) {
    /* a thin provisional band at the rim: the first layer of a future
       familiarity */
    const sub = {
      id: 200 + this._novelCount++,
      rMid: clamp(0.86 + this._novelCount * 0.004, 0.8, 0.9),
      halfW: 0.007,
      hue: d.obsHue,
      fed: 1, bright: 0.30,
      wob: this.rng() * TAU, rot: (this.rng() - 0.5) * 0.04, rot0: this.rng() * TAU,
      sweep: { t0: this.t, from: d.th },
      shrug: 0, assert: 0,
      provisional: true, alive: 1, key: d.novelKey,
    };
    this.rings.push(sub);
    if (d.novelKey) this.novelSeen[d.novelKey] = sub;
    d.ring = sub;
    d.phase = 'merge'; d.mergeK = 0;
    if (d.badge) this.costU = this._encounterCost(null, 'novel');
    this.state.impulse({ stress: -0.06 });
    if (d.badge) this.badge(this._dx(d), this._dy(d), null, 'provisional stratum');
  }

  /* ---------- rendering ---------- */
  ring(r, stroke, lw, dash) {
    const ctx = this.ctx;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(r, 1), 0, TAU);
    ctx.strokeStyle = stroke; ctx.lineWidth = lw;
    ctx.stroke();
    if (dash) ctx.setLineDash([]);
  }

  draw() {
    const { ctx, W, H } = this;
    const p = this.params, COL = this.COL, g = this.g;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const dim = (0.22 + 0.78 * this.awake) * (1 - 0.5 * this.dimVeil);
    const TINT = this.color();
    const fl = 1 - 0.018 * this.flinch;

    ctx.save();
    ctx.translate(this.cx, this.cy);

    /* ---- the pool: dark rim, light condensing inward ---- */
    const vg = ctx.createRadialGradient(0, 0, g.coreR, 0, 0, g.R);
    vg.addColorStop(0, hexA(TINT, 0.05 * dim));
    vg.addColorStop(0.75, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(3,4,10,${(0.5 * dim + 0.25).toFixed(3)})`);
    ctx.fillStyle = vg;
    ctx.beginPath(); ctx.arc(0, 0, g.R, 0, TAU); ctx.fill();

    /* ---- strata ---- */
    for (const r of this.rings) {
      if (r.alive < 0.02) continue;
      const wobAmp = (1 - 0.8 * this.structure.rigidity) * 1.6;
      const wob = Math.sin(this.t * 0.7 + r.wob) * wobAmp;
      const rr = r.rMid * g.R * fl + wob;
      const lw = Math.max(r.halfW * 2 * g.R, 1.2);
      const shr = 1 - 0.5 * r.shrug;
      const glow = r.assert * 0.5 + (this.hoverRing === r ? 0.35 : 0);
      const a = (0.16 + 0.5 * r.bright) * r.alive * dim * shr;
      /* body */
      this.ring(rr, hexA(r.hue, clamp(a + glow, 0, 1)), lw, r.provisional ? [4, 5] : null);
      /* sediment grain — texture, slowly rotating */
      if (!r.provisional && lw > 3) {
        ctx.save();
        ctx.rotate(r.rot0);
        this.ring(rr, hexA(hexLerp(r.hue, '#ffffff', 0.35), a * 0.5), 1, [1, 9]);
        ctx.restore();
      }
      /* the recognition sweep: two runners from the seat, around and meeting */
      if (r.sweep) {
        const k = ss(clamp((this.t - r.sweep.t0) / 0.85, 0, 1));
        const arc = k * Math.PI;
        const sa = (1 - k) * 0.85 * r.alive * dim;
        ctx.lineCap = 'round';
        for (const dir of [1, -1]) {
          ctx.beginPath();
          ctx.arc(0, 0, rr, r.sweep.from + dir * arc * 0.06, r.sweep.from + dir * arc, dir === -1);
          ctx.strokeStyle = hexA(hexLerp(r.hue, '#ffffff', 0.55), sa);
          ctx.lineWidth = Math.max(lw * 0.7, 2);
          ctx.stroke();
        }
      }
    }

    /* ---- the chime echo & deviation ripples ---- */
    for (const rp of this.ripples) {
      const k = rp.age / rp.max;
      const rr = (rp.r + k * 0.14) * g.R * fl;
      this.ring(rr, hexA('#ffffff', (1 - k) * 0.16 * dim), 1);
    }

    /* ---- the core: the oldest material in the psyche. It does not dim. ---- */
    const coreA = (0.5 + 0.3 * this.state.v.pleasure + 0.4 * this.chime) * this.opts.coreGlow;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, g.coreR * 1.6);
    cg.addColorStop(0, hexA('#ffe9c2', clamp(coreA, 0, 1) * 0.9));
    cg.addColorStop(0.45, hexA(hexLerp('#ffe3ae', TINT, 0.3), coreA * 0.5));
    cg.addColorStop(1, hexA(TINT, 0));
    ctx.fillStyle = cg;
    ctx.fillRect(-g.coreR * 1.7, -g.coreR * 1.7, g.coreR * 3.4, g.coreR * 3.4);
    this.ring(g.coreR * (1 + 0.02 * Math.sin(this.t * 0.9)), hexA('#ffe3ae', 0.4 * dim), 1.1);

    /* ---- Te's audit sweep ---- */
    if (this.auditA !== null && this.feeder) {
      const a = this.auditA;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * g.coreR * 1.2, Math.sin(a) * g.coreR * 1.2);
      ctx.lineTo(Math.cos(a) * g.Rin * 0.98, Math.sin(a) * g.Rin * 0.98);
      ctx.strokeStyle = hexA(this.feeder.color, 0.4 * dim);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    /* ---- drops ---- */
    for (const d of this.drops) {
      this._drawDrop(d, g, dim);
    }

    /* ---- surface gloss: glassy stillness, disturbed by dispute ---- */
    const still = 1 - clamp(this.state.v.stress * 1.3, 0, 0.85);
    ctx.lineCap = 'round';
    for (const [ga, gr, gl] of [[-2.2, 0.55, 0.5], [-1.9, 0.72, 0.35]]) {
      const jit = still < 0.6 ? Math.sin(this.t * 22 + gr * 9) * 0.04 * (1 - still) : 0;
      ctx.beginPath();
      ctx.arc(0, 0, gr * g.R * fl, ga + this.t * 0.05 + jit, ga + gl + this.t * 0.05 + jit);
      ctx.strokeStyle = hexA('#ffffff', 0.05 * still * dim);
      ctx.lineWidth = 5;
      ctx.stroke();
    }

    /* ---- the boundary: closed double rim, sealed; the world enters by
       permission, one drop at a time ---- */
    this.ring(g.R, hexA(TINT, (0.42 + 0.3 * this.chime) * dim), 1.9);
    this.ring(g.Rin, hexA(TINT, 0.20 * dim), 1.1);
    if (this.feeder && this.feeder.sealed) this.ring(g.R * 0.905, hexA(TINT, 0.17 * dim), 0.9);
    if (this.gateGlow > 0.02) {
      ctx.beginPath();
      ctx.arc(0, 0, (g.R + g.Rin) / 2, this.gateA - 0.14, this.gateA + 0.14);
      ctx.strokeStyle = hexA('#ffffff', this.gateGlow * 0.7 * dim);
      ctx.lineWidth = g.R - g.Rin;
      ctx.stroke();
    }
    if (this.pulseT > 0.01) this.ring(g.R * 1.04, hexA(this.pulseColor, this.pulseT * 0.7), 2.4);

    /* ---- hover sounding: the record under the cursor ---- */
    if (this.hoverRing && this.pointer.x !== null) {
      const r = this.hoverRing;
      const idx = this.rings.indexOf(r);
      const ageWord = r.provisional ? 'provisional' : idx < 3 ? 'oldest strata' : idx < 6 ? 'established' : 'recent';
      const label = `stratum · fed ${r.fed}× · ${ageWord}`;
      const lx = this.pointer.x - this.cx, ly = this.pointer.y - this.cy;
      ctx.fillStyle = hexA('#0c1524', 0.85);
      ctx.font = `600 10px ${HUD_FONT}`;
      const tw = ctx.measureText(label).width;
      ctx.fillRect(lx + 10, ly - 22, tw + 14, 18);
      ctx.strokeStyle = hexA(r.hue, 0.7); ctx.lineWidth = 1;
      ctx.strokeRect(lx + 10, ly - 22, tw + 14, 18);
      ctx.fillStyle = hexA(r.hue, 0.95);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, lx + 17, ly - 12.5);
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
      ctx.fillText(b.ok === true ? '✓' : b.ok === false ? '✕' : '?', b.x, y + 0.5);
      ctx.textAlign = 'left';
      ctx.fillStyle = hexA(col, a);
      ctx.font = `600 10px ${HUD_FONT}`;
      ctx.fillText(b.label, b.x + 11, y + 0.5);
    }

    ctx.restore();

    if (p.noise > 0.05) {
      const n = Math.round(p.noise * 46);
      ctx.fillStyle = hexA('#ffffff', 0.05 + p.noise * 0.06);
      for (let i = 0; i < n; i++) {
        ctx.fillRect(this.cx + (this.rng() - 0.5) * g.R * 2.4, this.cy + (this.rng() - 0.5) * g.R * 2.4, 1.4, 1.4);
      }
    }

    if (this.opts.hud) this.drawHUD(TINT, dim);
  }

  _drawDrop(d, g, dim) {
    const ctx = this.ctx;
    const x = Math.cos(d.th) * d.r * g.R, y = Math.sin(d.th) * d.r * g.R;
    const merging = d.phase === 'merge' || d.phase === 'subring';
    const a = (merging ? 1 - d.mergeK : d.phase === 'expel' ? clamp(1.6 - d.r, 0, 1) : 1) * dim;
    if (a <= 0.01) return;

    /* wake */
    if (d.trail.length > 1 && !merging) {
      ctx.beginPath();
      d.trail.forEach((q, i) => {
        const qx = Math.cos(q.th) * q.r * g.R, qy = Math.sin(q.th) * q.r * g.R;
        i === 0 ? ctx.moveTo(qx, qy) : ctx.lineTo(qx, qy);
      });
      ctx.strokeStyle = hexA(d.obsHue, 0.25 * a);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    if (d.phase === 'seat') {
      /* the strobe: stored color against observed color, beating flat */
      const strobe = Math.sin((this.t - d.seatAt) * 38) > 0;
      const col = strobe ? d.ring.hue : d.obsHue;
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU);
      ctx.fillStyle = hexA(col, 0.95 * a); ctx.fill();
      /* interference wavelets around the refusal */
      const bk = (this.t - d.seatAt) % 0.6 / 0.6;
      for (const s of [1, -1]) {
        ctx.beginPath();
        ctx.arc(0, 0, (d.r + s * 0.03 * bk) * g.R, d.th - 0.22, d.th + 0.22);
        ctx.strokeStyle = hexA(d.obsHue, (1 - bk) * 0.4 * a);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      /* the diff readout — with a leader line, monospace, specific */
      const label = `Δ ${d.diff}`;
      ctx.font = `600 10px ${HUD_FONT}`;
      const tw = ctx.measureText(label).width;
      const lx = x + (x > 0 ? -tw - 34 : 22), ly = y - 14;
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(lx + (x > 0 ? tw + 8 : -4), ly + 12);
      ctx.strokeStyle = hexA(this.COL.warn, 0.5 * a); ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = hexA('#0c1524', 0.85 * a);
      ctx.fillRect(lx - 6, ly, tw + 12, 18);
      ctx.strokeStyle = hexA(this.COL.warn, 0.8 * a);
      ctx.strokeRect(lx - 6, ly, tw + 12, 18);
      ctx.fillStyle = hexA(this.COL.warn, 0.95 * a);
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(label, lx, ly + 9.5);
      if (!d.auto) {
        ctx.fillStyle = hexA(this.COL.muted, (0.55 + 0.3 * Math.sin(this.t * 3)) * a);
        ctx.font = `600 9px ${HUD_FONT}`;
        ctx.fillText('awaiting ruling', lx, ly + 26);
      }
    } else {
      /* the drop itself */
      ctx.beginPath(); ctx.arc(x, y, merging ? 3.5 * (1 - d.mergeK * 0.7) : 3.2, 0, TAU);
      ctx.fillStyle = hexA(d.obsHue, 0.9 * a); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU);
      ctx.fillStyle = hexA('#ffffff', 0.8 * a); ctx.fill();
      if (merging && d.ring) {
        /* dissolving into the stratum */
        ctx.beginPath();
        ctx.arc(0, 0, d.ring.rMid * g.R, d.th - 0.3 * d.mergeK, d.th + 0.3 * d.mergeK);
        ctx.strokeStyle = hexA(d.obsHue, (1 - d.mergeK) * 0.6 * a);
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  /** Te keeps score in public; Si's readout is the record — match against
      the archive, strata held, and what this encounter cost. */
  drawHUD(TINT, dim) {
    const ctx = this.ctx, s = this.opts.hudScale;
    const x = 16, y = 24;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = hexA(this.COL.muted, 0.85);
    ctx.font = `600 ${9 * s}px ${HUD_FONT}`;
    ctx.fillText('RECOGNITION', x, y);

    let big = 'STILL', bigCol = TINT;
    if (this.chime > 0.45) { big = 'MATCH'; bigCol = '#ffffff'; }
    else if (this.pending) { big = 'OFF-RECORD'; bigCol = this.COL.warn; }
    else if (this.state.flags.misfile) { big = 'MIS-FILED'; bigCol = this.COL.crit; }
    else if (this.state.flags.novel) { big = 'UNPRECEDENTED'; bigCol = this.COL.n; }
    ctx.fillStyle = hexA(bigCol, 0.35 + 0.6 * dim);
    ctx.font = `700 ${17 * s}px ${HUD_FONT}`;
    ctx.fillText(big, x, y + 19 * s);

    const strata = this.rings.filter((r) => r.alive > 0.5).length;
    ctx.fillStyle = hexA(this.COL.ink2, 0.6);
    ctx.font = `500 ${10 * s}px ${HUD_FONT}`;
    ctx.fillText(`match ${Math.round(this.matchShown * 100)}% · strata ${strata}`, x, y + 34 * s);
    ctx.fillStyle = hexA(this.COL.muted, 0.75);
    ctx.fillText(`encounter ${this.costU.toFixed(1)} u · fed ×${this.lastFed}`, x, y + 46 * s);

    const cw = 7 * s, gp = 2.5 * s, cells = 16;
    for (let i = 0; i < cells; i++) {
      const on = this.matchShown * cells > i;
      ctx.fillStyle = hexA(on ? TINT : this.COL.axis, on ? 0.85 : 0.5);
      ctx.fillRect(x + i * (cw + gp), y + 53 * s, cw, 3.5 * s);
    }
    if (this.pending && !this.pending.auto) {
      ctx.font = `600 ${9.5 * s}px ${HUD_FONT}`;
      ctx.fillStyle = hexA(this.COL.warn, 0.9);
      ctx.fillText('the record awaits your ruling', x, y + 68 * s);
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
