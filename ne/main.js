/* ============================================================
   CURRENTS · Ne Page Main Orchestrator
   Imports Ne modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/ne-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { initHeader } from '../src/shared/header.js';
import { initLocale } from '../src/shared/locale.js';
import { renderNarration } from '../src/shared/copy.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initLabLayout } from '../src/shared/lab-layout.js';
import { initFieldNotes } from '../src/shared/field-notes.js';
import { NeGlyph } from '../src/engines/ne-glyph.js';
import { loadNeData } from '../src/data/ne-data.js';

// 1. Load header & data
/* Locale first: a no-op for English, and for other locales it loads the
   dictionaries before any zone builds its DOM (src/shared/locale.js). */
await initLocale();
initHeader('ne');
const data = loadNeData();
const { COL, SLOTS, CHARACTER, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB } = data;

/* dev handle: lets tooling and the console drive the engines directly */
const NE = (window.__NE = { glyphs: {} });

// 2. Zone A: Hero Glyph — the divergence engine at dominant depth
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new NeGlyph(heroCanvas, { seed: 11, coreGlow: 1, hudScale: 1.35, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
  NE.glyphs.hero = hero;
}

// 3. Zone E: Field Notes (the energy summary retired to /energy/ — its grip
// facts now live on the Zone B inferior caption)
const fieldNotes = initFieldNotes({ zone: data.ZONE_F, fnLabel: 'Ne' });

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new NeGlyph(railCanvas, { seed: 27, coreGlow: 0.9, COL });
  railGlyph.bombard = true;
  railGlyph.start();
  NE.glyphs.rail = railGlyph;

  initStackRail({
    slots: SLOTS,
    glyph: railGlyph,
    character: CHARACTER,
    fnLabel: 'Ne',
    grip: { minutes: GRIP_T, into: 'Si' },
    onSelect: (slot) => fieldNotes.setSlot(slot),
  });
}

// 5. Zone C: Feeder Coupling
const feederCanvas = document.getElementById('feederCanvas');
if (feederCanvas) {
  const feederGlyph = new NeGlyph(feederCanvas, { seed: 41, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();
  NE.glyphs.feeder = feederGlyph;

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Ne',
  });
}

// 6. Zone D: The Divergence Engine lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const lab = new NeGlyph(verifyCanvas, { seed: 67, coreGlow: 0.95, supply: 0.9, COL });
  lab.setTarget({ scale: 0.85, fidelity: 0.92, latency: 0, noise: 0, duty: 1, control: 0.85 });
  lab.start();
  NE.glyphs.lab = lab;

  const N = LAB.narrations;
  const el = (id) => document.getElementById(id);
  const narrEl = el('verifyNarr');
  let narrRun = 0;
  const narrate = (n) => renderNarration(narrEl, n);
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
  const tThreads = el('tThreads'), tBreadth = el('tBreadth'), cogEl = el('cogState');
  const cellsEl = el('tBreadthCells');
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
      if (tThreads) tThreads.textContent = String(lab.threadsOpen);
      if (tBreadth) tBreadth.textContent = 'B ' + s.breadth.toFixed(2);
      cells.forEach((c, i) => c.classList.toggle('on', s.breadth * 12 > i));
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

  /* first time the pointer grows a branch, say what just happened */
  let sweepNoted = false;
  const noteSweep = () => {
    if (!sweepNoted && lab.touched && narrRun === 0) {
      sweepNoted = true;
      narrate(N.hover);
    }
  };
  verifyCanvas.addEventListener('pointermove', noteSweep);
  verifyCanvas.addEventListener('pointerdown', noteSweep);
}

// On narrow viewports the lab's chamber, meters, and narration pin together
// so a scenario press and its consequence share a frame.
initLabLayout();
