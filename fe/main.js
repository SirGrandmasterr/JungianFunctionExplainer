/* ============================================================
   CURRENTS · Fe Page Main Orchestrator
   Imports Fe modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/fe-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { clamp } from '../src/utils/math.js';
import { initHeader } from '../src/shared/header.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initEnergyTeaser } from '../src/shared/energy-teaser.js';
import { FeGlyph } from '../src/engines/fe-glyph.js';
import { loadFeData } from '../src/data/fe-data.js';

// 1. Load header & data
initHeader('fe');
const data = loadFeData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB } = data;

/* dev handle: lets tooling and the console drive the engines directly */
const FE = (window.__FE = { glyphs: {} });

// 2. Zone A: Hero Glyph — the resonance field at dominant reach
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new FeGlyph(heroCanvas, { seed: 9, coreGlow: 1, hudScale: 1.35, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
  FE.glyphs.hero = hero;
}

// Zone E: the economics suite now lives once at /energy/, where the eight
// can be compared; what stays here is the ladder, the grip clock, and a link.
initEnergyTeaser({
  costs: COSTS,
  fnLabel: 'Fe',
  gripT: GRIP_T,
  gripInto: 'Ti',
});

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new FeGlyph(railCanvas, { seed: 23, coreGlow: 0.9, COL });
  /* the rail room will not sit still, so the trust gap has something to open
     against as the position degrades */
  railGlyph.bombard = true;
  railGlyph.start();
  FE.glyphs.rail = railGlyph;

  initStackRail({
    slots: SLOTS,
    glyph: railGlyph,
  });
}

// 5. Zone C: Feeder Coupling
const feederCanvas = document.getElementById('feederCanvas');
if (feederCanvas) {
  const feederGlyph = new FeGlyph(feederCanvas, { seed: 37, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();
  FE.glyphs.feeder = feederGlyph;

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Fe',
  });
}

// 6. Zone D: The Resonance Lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const lab = new FeGlyph(verifyCanvas, { seed: 61, coreGlow: 0.95, supply: 0.9, COL });
  lab.setTarget({ scale: 0.85, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  lab.start();
  FE.glyphs.lab = lab;

  const N = LAB.narrations;
  const el = (id) => document.getElementById(id);
  const narrEl = el('verifyNarr');
  let narrRun = 0;
  const narrate = (t) => { if (narrEl) narrEl.textContent = t; };
  const schedule = (run, ms, fn) => setTimeout(() => { if (run === narrRun) fn(); }, ms);

  /* With animation off, scenario clicks fast-forward the real simulation
     so the still frame lands on the choreography's result. */
  function ffwd(seconds) {
    if (!REDUCED) return;
    const steps = Math.round(seconds * 30);
    for (let i = 0; i < steps; i++) lab.step(1 / 30);
    lab.draw();
  }

  /* ---- telemetry: a DOM adapter on the same state stream the canvas
     renderer consumes ---- */
  const mStress = el('mStress'), mStressVal = el('mStressVal');
  const mPleasure = el('mPleasure'), mPleasureVal = el('mPleasureVal');
  const tCost = el('tCost'), tDiff = el('tDiff'), tTrust = el('tTrust');
  const twBelieved = el('twBelieved'), twActual = el('twActual');
  const cogEl = el('cogState');
  let tick = 0, lastCog = '';
  lab.state.subscribe((s) => {
    if (mStress) {
      const sv = Math.round(s.stress * 100), pv = Math.round(s.pleasure * 100);
      mStress.style.width = sv + '%'; mStressVal.textContent = sv + '%';
      mPleasure.style.width = pv + '%'; mPleasureVal.textContent = pv + '%';
    }
    /* numeric readouts flicker less than the canvas HUD — every few frames.
       Concord is deliberately not printed as its own number here: it is the
       "actual" needle immediately below, and it is the HUD bar on the canvas.
       Effort likewise lives on the canvas, where it now also drives the ring
       around the nucleus. */
    if ((tick++ & 3) === 0) {
      if (tCost) tCost.textContent = lab.costU.toFixed(1) + ' u';
      if (tDiff) tDiff.textContent = Math.round(s.diff * 100) + '%';
      if (tTrust) tTrust.textContent = Math.round(s.trust * 100) + '%';
      if (twBelieved) twBelieved.style.width = Math.round(s.believed * 100) + '%';
      if (twActual) twActual.style.width = Math.round(s.concord * 100) + '%';
    }
    if (cogEl && s.state.key !== lastCog) {
      lastCog = s.state.key;
      const meta = LAB.states[s.state.key];
      cogEl.textContent = meta ? meta.label : s.state.label;
      cogEl.style.color = meta ? meta.color : '';
    }
  });

  /* ---- the gate: reconciliation is a response, not a spontaneous event ---- */
  const btnReconcile = el('btnReconcile'), gateEl = el('reconcileGate');
  lab.state.subscribe(() => {
    if (!btnReconcile) return;
    const open = lab.split > 0.4;
    if (btnReconcile.disabled === open) {
      btnReconcile.disabled = !open;
      if (gateEl) gateEl.textContent = open ? 'the field is split — bridge it' : 'needs a split field';
    }
  });

  /* the lock fires when the field actually locks, not on a timer */
  lab.onLock = () => {
    narrRun++;
    narrate(N.reconcile2);
    ffwd(1.4);
  };

  /* ---- cross-listen: the same events, ghosted onto Fi's meters ----
     The celebration that peaks Fe barely moves Fi; the solitude that severs
     Fe is where Fi rests. Same events, opposite instruments. */
  const sib = { s: 0.18, p: 0.42, ts: 0.18, tp: 0.42 };
  const sibStress = el('sibStress'), sibPleasure = el('sibPleasure');
  lab.state.subscribe(() => {
    sib.ts += (0.18 - sib.ts) * 0.0026;
    sib.tp += (0.42 - sib.tp) * 0.0026;
    sib.s += (sib.ts - sib.s) * 0.05;
    sib.p += (sib.tp - sib.p) * 0.05;
    if (sibStress && (tick & 3) === 0) {
      sibStress.style.width = Math.round(clamp(sib.s, 0, 1) * 100) + '%';
      sibPleasure.style.width = Math.round(clamp(sib.p, 0, 1) * 100) + '%';
    }
  });
  const sibImpulse = (d) => {
    if (!d) return;
    sib.ts = clamp(sib.ts + (d.stress || 0), 0, 1);
    sib.tp = clamp(sib.tp + (d.pleasure || 0), 0, 1);
  };

  /* ---- the six events ---- */
  for (const b of LAB.buttons) {
    const btn = el(b.id);
    if (!btn) continue;
    btn.addEventListener('click', () => {
      if (!lab.scenario(b.key, b.impact)) { narrate(N.gate); return; }
      narrRun++;
      const run = narrRun;
      sibImpulse(LAB.sibling[b.key]);
      narrate(N[b.key]);
      ffwd(b.key === 'sync' ? 1.6 : 3.2);
      if (b.followMs > 0 && b.key !== 'reconcile') {
        schedule(run, b.followMs, () => { narrate(N[b.key + '2']); ffwd(2.4); });
      }
    });
  }

  /* first time the user sounds the ring, say what sounding is */
  let steerNoted = false;
  verifyCanvas.addEventListener('pointermove', () => {
    if (!steerNoted && lab.steered && narrRun === 0) {
      steerNoted = true;
      narrate(N.hover);
    }
  });
}
