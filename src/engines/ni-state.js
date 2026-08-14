/* ============================================================
   CURRENTS · NiState — the unified cognitive state stream
   One renderer-agnostic store for the Ni regression engine.
   Canvas, WebGL, SVG, or DOM telemetry adapters all consume the
   same snapshot; nothing in here touches a canvas or the DOM.

   Channels
     stress      0..1  jitter, graph noise, chromatic aberration,
                       loss volatility
     pleasure    0..1  trajectory luminescence, smoothness, clarity
     confidence  0..1  R² equivalent — width of the predictive
                       variance cone along the temporal axis
     noise       0..1  sensory scatter load (unparsed Se input)
     loss        0..1  current model loss (published by the sim)

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
  euphoric:    { key: 'euphoric',    label: 'Euphoric Flow' },
  cynical:     { key: 'cynical',     label: 'Cynical Resignation' },
  freeze:      { key: 'freeze',      label: 'Overwhelm / Freeze' },
  overfit:     { key: 'overfit',     label: 'Overfitted Fatigue' },
  equilibrium: { key: 'equilibrium', label: 'Optimal Equilibrium' },
};

const BASE  = { stress: 0.12, pleasure: 0.20, noise: 0.25 };
/* per-second relax rates back to baseline — stress lingers longest,
   which is what makes back-to-back scenarios compound believably */
const RELAX = { stress: 0.045, pleasure: 0.075, noise: 0.12 };
/* how quickly the smoothed value chases its target */
const EASE  = 2.4;

export class NiState {
  constructor(init = {}) {
    this.v  = { stress: BASE.stress, pleasure: BASE.pleasure, confidence: 0.3, noise: BASE.noise, loss: 0.62, ...init };
    this.tv = { ...this.v };
    /* event flags raised by the sim while a scenario's fx is live —
       classification reads them so e.g. Cassandra's high stress reads
       as cynical validation rather than generic overwhelm */
    this.flags = { aha: false, cassandra: false, flash: false, focus: false, overfit: false };
    this._subs = new Set();
  }

  /** Scenario impact: additive deltas onto the targets (Δstress, Δpleasure, …) */
  impulse(d = {}) {
    for (const k in d) if (k in this.tv) this.tv[k] = clamp(this.tv[k] + d[k], 0, 1);
  }

  /** Sim-derived channels (confidence, loss) written every frame */
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
    if (f.flash || (s > 0.78 && p < 0.30))       return COG_STATES.freeze;
    if (f.overfit && p < 0.45)                   return COG_STATES.overfit;
    if (f.cassandra && s > 0.45)                 return COG_STATES.cynical;
    if (p > 0.60 && s < 0.40)                    return COG_STATES.euphoric;
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
