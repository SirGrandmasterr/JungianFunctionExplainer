/* ============================================================
   CURRENTS · Ni Page Main Orchestrator
   Imports Ni modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/ni-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { initHeader } from '../src/shared/header.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initEnergyTeaser } from '../src/shared/energy-teaser.js';
import { NiGlyph } from '../src/engines/ni-glyph.js';
import { loadNiData } from '../src/data/ni-data.js';

// 1. Load header & data
initHeader('ni');
const data = loadNiData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB } = data;

/* dev handle: lets tooling and the console drive the engines directly */
const NI = (window.__NI = { glyphs: {} });

// 2. Zone A: Hero Glyph — the regression engine at dominant depth
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new NiGlyph(heroCanvas, { seed: 9, coreGlow: 1, hudScale: 1.35, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
  NI.glyphs.hero = hero;
}

// Zone E: the economics suite now lives once at /energy/, where the eight
// can be compared; what stays here is the ladder, the grip clock, and a link.
initEnergyTeaser({
  costs: COSTS,
  fnLabel: 'Ni',
  gripT: GRIP_T,
  gripInto: 'Se',
});

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new NiGlyph(railCanvas, { seed: 23, coreGlow: 0.9, COL });
  railGlyph.bombard = true;
  railGlyph.start();
  NI.glyphs.rail = railGlyph;

  initStackRail({
    slots: SLOTS,
    glyph: railGlyph,
  });
}

// 5. Zone C: Feeder Coupling
const feederCanvas = document.getElementById('feederCanvas');
if (feederCanvas) {
  const feederGlyph = new NiGlyph(feederCanvas, { seed: 37, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();
  NI.glyphs.feeder = feederGlyph;

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Ni',
  });
}

// 6. Zone D: The Regression Engine lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const lab = new NiGlyph(verifyCanvas, { seed: 61, coreGlow: 0.95, supply: 0.9, COL });
  lab.setTarget({ scale: 0.85, fidelity: 0.92, latency: 0, noise: 0, duty: 1, control: 0.85 });
  lab.start();
  NI.glyphs.lab = lab;

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
  const tLoss = el('tLoss'), tConf = el('tConf'), cogEl = el('cogState');
  const cellsEl = el('tConfCells');
  const cells = [];
  if (cellsEl) {
    for (let i = 0; i < 12; i++) { const c = document.createElement('i'); cellsEl.appendChild(c); cells.push(c); }
  }
  let tick = 0, lastCog = '';
  lab.state.subscribe((s) => {
    if (mStress) {
      const sv = Math.round(s.stress * 100), pv = Math.round(s.pleasure * 100);
      mStress.style.width = sv + '%'; mStressVal.textContent = sv + '%';
      mPleasure.style.width = pv + '%'; mPleasureVal.textContent = pv + '%';
    }
    /* numeric readouts flicker less than the canvas HUD — every few frames */
    if ((tick++ & 3) === 0) {
      if (tLoss) tLoss.textContent = s.loss.toFixed(3);
      if (tConf) tConf.textContent = 'R² ' + s.confidence.toFixed(2);
      cells.forEach((c, i) => c.classList.toggle('on', s.confidence * 12 > i));
    }
    if (cogEl && s.state.key !== lastCog) {
      lastCog = s.state.key;
      const meta = LAB.states[s.state.key];
      cogEl.textContent = meta ? meta.label : s.state.label;
      cogEl.style.color = meta ? meta.color : '';
    }
  });

  /* ---- the five scenario triggers ---- */
  for (const b of LAB.buttons) {
    const btn = el(b.id);
    if (!btn) continue;
    btn.addEventListener('click', () => {
      narrRun++;
      const run = narrRun;
      lab.scenario(b.key, b.impact);
      narrate(N[b.key]);
      ffwd(2.6);
      schedule(run, b.followMs, () => { narrate(N[b.key + '2']); ffwd(2.4); });
    });
  }

  /* first time the user takes the tiller, say what the tiller is */
  let steerNoted = false;
  verifyCanvas.addEventListener('pointermove', () => {
    if (!steerNoted && lab.steered && narrRun === 0) {
      steerNoted = true;
      narrate(N.hover);
    }
  });
}
