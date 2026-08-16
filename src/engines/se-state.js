/* ============================================================
   CURRENTS · SeState — the unified cognitive state stream
   One renderer-agnostic store for the Se contact instrument.
   Canvas, WebGL, SVG, or DOM telemetry adapters all consume the
   same snapshot; nothing in here touches a canvas or the DOM.

   Channels
     stress      0..1  restless dilation, hunting jitter, static —
                       for Se this climbs when the field runs FLAT
     pleasure    0..1  contact pleasure: lock glow, tracer rate,
                       saturation of the world inside the lens
     intensity   0..1  live stimulus-field richness (published)
     clarity     0..1  rendering fidelity inside the lens — Se's
                       R² analog; RISES with intensity (published)
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
  flow:        { key: 'flow',        label: 'Full Contact' },
  blackout:    { key: 'blackout',    label: 'Sensory Blackout' },
  late:        { key: 'late',        label: 'Out of Position' },
  hunger:      { key: 'hunger',      label: 'Stimulus Hunger' },
  equilibrium: { key: 'equilibrium', label: 'Open Field' },
};

/* Se idles bright: ambient contact is free pleasure, and its baseline
   stress is low — the world has to go QUIET before this store worries */
const BASE  = { stress: 0.10, pleasure: 0.26, noise: 0.20 };
/* per-second relax rates back to baseline — stress lingers longest,
   which is what makes back-to-back scenarios compound believably */
const RELAX = { stress: 0.045, pleasure: 0.075, noise: 0.12 };
/* how quickly the smoothed value chases its target */
const EASE  = 2.4;

export class SeState {
  constructor(init = {}) {
    this.v  = { stress: BASE.stress, pleasure: BASE.pleasure, intensity: 0.62, clarity: 0.75, noise: BASE.noise, ...init };
    this.tv = { ...this.v };
    /* event flags raised by the sim while a scenario's fx is live —
       classification reads them so e.g. blackout's high stress reads
       as sensory starvation rather than generic overwhelm */
    this.flags = { flicker: false, window: false, blackout: false, miss: false, hunger: false };
    this._subs = new Set();
  }

  /** Scenario impact: additive deltas onto the targets (Δstress, Δpleasure, …) */
  impulse(d = {}) {
    for (const k in d) if (k in this.tv) this.tv[k] = clamp(this.tv[k] + d[k], 0, 1);
  }

  /** Sim-derived channels (intensity, clarity) written every frame */
  publish(d = {}) {
    for (const k in d) if (k in this.tv) this.tv[k] = clamp(d[k], 0, 1);
  }

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

  /** Threshold classification over the smoothed channels + event flags */
  classify() {
    const { stress: s, pleasure: p, intensity: i } = this.v, f = this.flags;
    if (f.blackout)                                   return COG_STATES.blackout;
    if (f.miss)                                       return COG_STATES.late;
    if (f.hunger || (i < 0.16 && s > 0.42))           return COG_STATES.hunger;
    if (p > 0.58 && s < 0.40 && i > 0.45)             return COG_STATES.flow;
    return COG_STATES.equilibrium;
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
