/* ============================================================
   CURRENTS · Playground — the Chamber adapter
   One uniform surface over eight engines that were written at
   two different times and do not quite agree with each other.

   The Playground mounts four engines on one canvas at once, and
   the function pages never did. That exposes three things the
   pages never had to care about:

     1. `start()` is unstoppable. Every engine opens its own rAF
        loop and an IntersectionObserver that is never stored, and
        no engine has a stop/destroy. Rebuilding a Vessel would
        strand a loop per chamber, forever. So the Playground
        never calls start() — it owns one clock and steps all four
        chambers from it. That is also, for free, the external
        clock the spec asks for (§7.3), obtained without editing
        a single engine.

     2. TiGlyph reads its accent from `COL.ti`; the other seven
        read `COL.fn`. A shared palette must be aliased or Ti
        renders with an undefined colour.

     3. SeGlyph seeds its stimulus field in absolute pixels at
        construction time and never re-seeds. Built against a 0×0
        canvas it is permanently empty — so chambers are only ever
        constructed once their slot has real layout.

   Everything else here is vocabulary translation: five engines
   speak `scenario(key)` with five disjoint key sets, three older
   ones speak `spawnSub(kind)` with three more, and the Playground
   wants to say one of three words.
   ============================================================ */
import { NeGlyph } from '../engines/ne-glyph.js';
import { NiGlyph } from '../engines/ni-glyph.js';
import { SeGlyph } from '../engines/se-glyph.js';
import { SiGlyph } from '../engines/si-glyph.js';
import { TeGlyph } from '../engines/te-glyph.js';
import { TiGlyph } from '../engines/ti-glyph.js';
import { FeGlyph } from '../engines/fe-glyph.js';
import { FiGlyph } from '../engines/fi-glyph.js';
import { FN } from './types.js';
import { RANK_PARAMS } from '../data/playground-data.js';
import { CSSVAR } from '../utils/dom.js';

const ENGINE = { ne: NeGlyph, ni: NiGlyph, se: SeGlyph, si: SiGlyph, te: TeGlyph, ti: TiGlyph, fe: FeGlyph, fi: FiGlyph };

/* Each engine sizes its glyph as `min(W,H) × baseR`, and the factors were
   tuned per page — 0.30 for Fe (its carrier ring sits at 1.28×) up to 0.38
   for Si. Four chambers side by side must read as one family, so the
   adapter compensates through `scale` rather than by touching the engines. */
const BASE_R = { ne: 0.36, ni: 0.36, se: 0.36, si: 0.38, te: 0.34, ti: 0.34, fe: 0.30, fi: 0.34 };
const BASE_R_NORM = 0.345;

/* The Playground says one of three words. Each engine hears its own. */
const VERBS = {
  pleased:  { ne: 'graft',   ni: 'aha',       se: 'flicker',  si: 'familiar', fe: 'sync',     te: 'ship',          ti: 'link',     fi: 'authGood' },
  strained: { ne: 'confine', ni: 'cassandra', se: 'window',   si: 'deviant',  fe: 'covert',   te: 'fail',          ti: 'conflict', fi: 'fakeBad' },
  flooded:  { ne: 'scatter', ni: 'overfit',   se: 'blackout', si: 'novel',    fe: 'deadlock', te: 'unmeasurable',  ti: 'noise',    fi: 'fakeGood' },
};
/* The three that predate the scenario() contract drive events the old way. */
const LEGACY = new Set(['ti', 'fi', 'te']);

/** Build the palette once and hand the same object to every chamber. */
export function readPalette() {
  const col = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'), t: CSSVAR('--c-t'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
    ghost: '#7f5fd0', nul: '#150d1c', hueLo: 322, hueHi: 368,
  };
  return col;
}

/** A per-function palette: the element's own colour promoted to the accent. */
export function paletteFor(fnKey, base) {
  const el = FN[fnKey].el;
  const accent = base[el] || base.fn;
  /* `ti` is the alias TiGlyph reads instead of `fn` — see the header note. */
  return { ...base, fn: accent, ti: accent };
}

export class Chamber {
  /**
   * @param {HTMLElement} host  a positioned element with real layout already
   * @param {string} fnKey      which function
   * @param {string} rank       dom | aux | tert | inf
   */
  constructor(host, fnKey, rank, opts = {}) {
    this.fn = fnKey;
    this.rank = rank;
    this.host = host;

    const cv = document.createElement('canvas');
    cv.className = 'chamber-canvas';
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', `${FN[fnKey].label} — ${FN[fnKey].glyph}, in the ${rank} position`);
    host.appendChild(cv);
    this.canvas = cv;

    const Engine = ENGINE[fnKey];
    this.g = new Engine(cv, {
      seed: opts.seed ?? 11,
      COL: opts.COL,
      interactive: opts.interactive !== false,
      coreGlow: 0.95,
      hud: false,               /* the Vessel carries its own readouts */
      supply: 1,
      /* deliberately no MistGPU: it injects a sibling canvas into the host
         and would open a fourth WebGL context on a page that has three
         other engines to feed. The CPU mist is correct here. */
    });

    this.setRank(rank);
    this.activation = 0;
    this.pressure = 0;
    this.paid = 0;
  }

  /** Apply the §3.1 preset for a slot. `contrary` must always be present:
      every engine's setTarget silently resets it to 0 when it is omitted. */
  setRank(rank) {
    this.rank = rank;
    const p = RANK_PARAMS[rank];
    const norm = BASE_R_NORM / BASE_R[this.fn];
    this.g.setTarget({ ...p, scale: p.scale * norm });
  }

  /** Say one of three words in whichever dialect this engine speaks. */
  react(verb, impact = {}) {
    const key = VERBS[verb] && VERBS[verb][this.fn];
    if (!key) return false;
    try {
      if (LEGACY.has(this.fn)) {
        if (typeof this.g.spawnSub === 'function') this.g.spawnSub(key);
        /* Gen-1 has no state stream; nudge the plain channels directly. */
        if (impact.stress) this.g.stress = clamp01((this.g.stress || 0) + impact.stress);
        if (impact.pleasure) this.g.pleasure = clamp01((this.g.pleasure || 0) + impact.pleasure);
        return true;
      }
      if (typeof this.g.scenario === 'function') { this.g.scenario(key, impact); return true; }
    } catch (e) {
      /* An engine refusing an event must never take the Playground down. */
      console.warn(`[playground] ${this.fn} declined "${verb}"`, e);
    }
    return false;
  }

  pulse(color) { if (typeof this.g.pulse === 'function') this.g.pulse(color); }

  /** Uniform on all eight: Gen-2 proxies these onto its state stream. */
  get stress() { return this.g.stress || 0; }
  get pleasure() { return this.g.pleasure || 0; }

  step(dt) { this.g.step(dt); }
  draw() { this.g.draw(); }

  /** The teardown no engine ships. Rebuilding a Vessel depends on it. */
  destroy() {
    if (this.g._raf) cancelAnimationFrame(this.g._raf);
    if (this.g._ro && this.g._ro.disconnect) this.g._ro.disconnect();
    this.g._visible = false;
    this.canvas.remove();
    this.g = null;
  }
}

const clamp01 = (v) => Math.max(0, Math.min(1, v));
