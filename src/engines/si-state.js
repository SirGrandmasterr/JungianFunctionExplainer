/* ============================================================
   CURRENTS · SiState — the unified cognitive state stream
   One renderer-agnostic store for the Si recognition instrument.
   Canvas, WebGL, SVG, or DOM telemetry adapters all consume the
   same snapshot; nothing in here touches a canvas or the DOM.

   Channels
     stress      0..1  surface ripple, strobe urgency, the flinch —
                       for Si this climbs on DEVIATION and NOVELTY
     pleasure    0..1  recognition pleasure: chime glow, core
                       luminance, the hum of a fed stratum
     match       0..1  how well the current arrival agrees with
                       the record (published)
     order       0..1  archive settledness — mean stratum
                       brightness (published)
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
  settled:     { key: 'settled',     label: 'Settled Resonance' },
  alarm:       { key: 'alarm',       label: 'Discrepancy Alarm' },
  misfile:     { key: 'misfile',     label: 'Mis-filed' },
  unmoored:    { key: 'unmoored',    label: 'Unprecedented Input' },
  equilibrium: { key: 'equilibrium', label: 'Still Water' },
};

/* Si idles calm: a pool at rest is the baseline condition, and its
   stress baseline is the lowest in the atlas — until something is off */
const BASE  = { stress: 0.09, pleasure: 0.22, noise: 0.18 };
/* per-second relax rates back to baseline — stress lingers longest,
   which is what makes back-to-back scenarios compound believably */
const RELAX = { stress: 0.045, pleasure: 0.075, noise: 0.12 };
/* how quickly the smoothed value chases its target */
const EASE  = 2.4;

export class SiState {
  constructor(init = {}) {
    this.v  = { stress: BASE.stress, pleasure: BASE.pleasure, match: 0.9, order: 0.7, noise: BASE.noise, ...init };
    this.tv = { ...this.v };
    /* event flags raised by the sim while a scenario's fx is live —
       classification reads them so a pending deviation reads as alarm
       rather than generic distress */
    this.flags = { ritual: false, deviation: false, novel: false, misfile: false };
    this._subs = new Set();
  }

  /** Scenario impact: additive deltas onto the targets (Δstress, Δpleasure, …) */
  impulse(d = {}) {
    for (const k in d) if (k in this.tv) this.tv[k] = clamp(this.tv[k] + d[k], 0, 1);
  }

  /** Sim-derived channels (match, order) written every frame */
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
    if (f.deviation)                        return COG_STATES.alarm;
    if (f.misfile)                          return COG_STATES.misfile;
    if (f.novel)                            return COG_STATES.unmoored;
    if (p > 0.56 && s < 0.35)               return COG_STATES.settled;
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
