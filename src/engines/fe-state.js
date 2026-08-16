/* ============================================================
   CURRENTS · FeState — the unified cognitive state stream
   One renderer-agnostic store for the Fe resonance instrument.
   Canvas, WebGL, SVG, or DOM telemetry adapters all consume the
   same snapshot; nothing in here touches a canvas or the DOM.

   Channels
     stress      0..1  field turbulence, conducting strain, the
                       unnameable climb under a masked room
     pleasure    0..1  resonance pleasure: concord, the sweep of a
                       locked wavefront, the free hit of a sync
     concord     0..1  the Kuramoto order parameter R over the TRUE
                       phases — how synchronized the room actually is
     believed    0..1  the order parameter Fe computes from what it
                       can read: masks plus its own read noise
     trust       0..1  |believed − concord| — the size of the
                       misreading, in either direction. Fe's most
                       characteristic signal is this gap opening
                       while the concord readout still looks fine.
     effort      0..1  conducting energy being spent right now
     split       0..1  bimodality: two clusters locked antiphase
     diff        0..1  differentiation — how much individual
                       variation survives the harmonizing
     noise       0..1  static overlay load

   The store runs two layers: `tv` (targets, moved by scenario
   impulses and published sim values) and `v` (the smoothed
   current values adapters read). Targets relax homeostatically
   toward baseline, so every scenario decays back to equilibrium
   instead of latching.
   ============================================================ */
import { clamp } from '../utils/math.js';

/** Cognitive state classifications, most specific first. Colors are
    assigned by the page's data layer (state logic stays style-free). */
export const COG_STATES = {
  severed:    { key: 'severed',    label: 'Severed Field' },
  unreadable: { key: 'unreadable', label: 'Unread Current' },
  split:      { key: 'split',      label: 'Split Field' },
  dissonant:  { key: 'dissonant',  label: 'Dissonance' },
  conducting: { key: 'conducting', label: 'Conducting' },
  concord:    { key: 'concord',    label: 'Concord' },
  attuned:    { key: 'attuned',    label: 'Attuned' },
  ambient:    { key: 'ambient',    label: 'Open Field' },
};

/* Fe idles socially warm and never quite free: a room is never finished,
   so its stress baseline is the highest of the four judging functions and
   its pleasure baseline the highest of the eight. */
const BASE  = { stress: 0.16, pleasure: 0.34, noise: 0.20 };
/* per-second relax rates back to baseline — stress lingers longest, which
   is what makes back-to-back scenarios compound believably */
const RELAX = { stress: 0.050, pleasure: 0.070, noise: 0.12 };
/* how quickly the smoothed value chases its target */
const EASE  = 2.4;

export const FLAGS = ['sync', 'celebrate', 'reconcile', 'covert', 'deadlock', 'isolate'];

export class FeState {
  constructor(init = {}) {
    this.v = {
      stress: BASE.stress, pleasure: BASE.pleasure, noise: BASE.noise,
      concord: 0.62, believed: 0.62, trust: 0.03,
      effort: 0.14, split: 0, diff: 0.55, presence: 1,
      ...init,
    };
    this.tv = { ...this.v };
    /* event flags raised by the sim while a scenario's fx is live —
       classification reads them so a severed field reads as severed
       rather than as generic dissonance */
    this.flags = {};
    for (const f of FLAGS) this.flags[f] = false;
    this._subs = new Set();
  }

  /** Scenario impact: additive deltas onto the targets (Δstress, Δpleasure, …) */
  impulse(d = {}) {
    for (const k in d) if (k in this.tv) this.tv[k] = clamp(this.tv[k] + d[k], 0, 1);
  }

  /** Sim-derived channels (concord, believed, trust, effort, split, diff) */
  publish(d = {}) {
    for (const k in d) if (k in this.tv) this.tv[k] = clamp(d[k], 0, 1);
  }

  clearFlags() { for (const f of FLAGS) this.flags[f] = false; }

  step(dt) {
    for (const k of ['stress', 'pleasure', 'noise']) {
      this.tv[k] += (BASE[k] - this.tv[k]) * (1 - Math.exp(-dt * RELAX[k]));
    }
    const e = 1 - Math.exp(-dt * EASE);
    for (const k in this.v) this.v[k] += (this.tv[k] - this.v[k]) * e;
    if (this._subs.size) {
      const snap = this.snapshot();
      for (const fn of this._subs) fn(snap);
    }
  }

  /** Threshold classification over the smoothed channels + event flags.
      Order matters: the specific field pathologies outrank the generic
      good/bad reading, because a room can be highly coherent and still
      be a room Fe has misread. */
  classify() {
    const { stress: s, pleasure: p, concord: R, trust, effort, split, presence } = this.v;
    /* the flag alone is not enough — the field is not severed until the ring
       has actually gone, which takes a few seconds after the event fires */
    if (this.flags.isolate && presence < 0.62) return COG_STATES.severed;
    if (trust > 0.12)                return COG_STATES.unreadable;
    if (split > 0.42)                return COG_STATES.split;
    if (R < 0.40)                    return COG_STATES.dissonant;
    if (effort > 0.52)               return COG_STATES.conducting;
    /* Concord is not merely a coherent room — it is a room that is holding
       itself together. Coherence Fe is personally propping up is Attuned at
       best, which is why the resting state of a working Fe is not concord. */
    if (R > 0.88 && effort < 0.12 && s < 0.28) return COG_STATES.concord;
    if (R > 0.66 && p > 0.46)        return COG_STATES.attuned;
    return COG_STATES.ambient;
  }

  snapshot() {
    return { ...this.v, state: this.classify() };
  }

  /** Adapters subscribe to the stream; returns an unsubscribe fn */
  subscribe(fn) {
    this._subs.add(fn);
    return () => this._subs.delete(fn);
  }
}
