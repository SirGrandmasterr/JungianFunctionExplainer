/* ============================================================
   CURRENTS · NeState — the unified cognitive state stream
   One renderer-agnostic store for the Ne divergence engine.
   Canvas, WebGL, SVG, or DOM telemetry adapters all consume the
   same snapshot; nothing in here touches a canvas or the DOM.

   Channels
     stress      0..1  jitter, grind, banner urgency, chromatic
                       doubling of the tree
     pleasure    0..1  bloom luminescence, halo radiance, spark
                       emission rate
     breadth     0..1  angular coverage × live-branch count — the
                       divergence engine's R² analog (published)
     novelty     0..1  freshness of current growth; decays as the
                       same tree persists (published)
     noise       0..1  sensory static load

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
  flow:        { key: 'flow',        label: 'Generative Flow' },
  pruned:      { key: 'pruned',      label: 'Convergence Distress' },
  starved:     { key: 'starved',     label: 'Novelty Starvation' },
  scattered:   { key: 'scattered',   label: 'Overextended' },
  equilibrium: { key: 'equilibrium', label: 'Open Equilibrium' },
};

/* Ne idles a notch happier than Ni does — ambient novelty is free */
const BASE  = { stress: 0.12, pleasure: 0.26, noise: 0.22 };
/* per-second relax rates back to baseline — stress lingers longest,
   which is what makes back-to-back scenarios compound believably */
const RELAX = { stress: 0.045, pleasure: 0.075, noise: 0.12 };
/* how quickly the smoothed value chases its target */
const EASE  = 2.4;

export class NeState {
  constructor(init = {}) {
    this.v  = { stress: BASE.stress, pleasure: BASE.pleasure, breadth: 0.35, novelty: 0.5, noise: BASE.noise, ...init };
    this.tv = { ...this.v };
    /* event flags raised by the sim while a scenario's fx is live —
       classification reads them so e.g. confinement's low pleasure
       reads as starvation rather than generic distress */
    this.flags = { graft: false, prune: false, riff: false, confine: false, scatter: false };
    this._subs = new Set();
  }

  /** Scenario impact: additive deltas onto the targets (Δstress, Δpleasure, …) */
  impulse(d = {}) {
    for (const k in d) if (k in this.tv) this.tv[k] = clamp(this.tv[k] + d[k], 0, 1);
  }

  /** Sim-derived channels (breadth, novelty) written every frame */
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
    const { stress: s, pleasure: p } = this.v, f = this.flags;
    if (f.prune || (s > 0.78 && p < 0.30))       return COG_STATES.pruned;
    if (f.confine && p < 0.48)                   return COG_STATES.starved;
    if (f.scatter && s > 0.38)                   return COG_STATES.scattered;
    if (p > 0.60 && s < 0.40)                    return COG_STATES.flow;
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
