/* ============================================================
   CURRENTS · Se Page Main Orchestrator
   Imports Se modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/se-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { clamp } from '../src/utils/math.js';
import { initHeader } from '../src/shared/header.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initEnergyCharts } from '../src/shared/energy-charts.js';
import { SeGlyph } from '../src/engines/se-glyph.js';
import { loadSeData } from '../src/data/se-data.js';

// 1. Load header & data
initHeader('se');
const data = loadSeData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB } = data;

/* dev handle: lets tooling and the console drive the engines directly */
const SE = (window.__SE = { glyphs: {} });

// 2. Zone A: Hero Glyph — the naked eye at dominant depth
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new SeGlyph(heroCanvas, { seed: 9, coreGlow: 1, hudScale: 1.35, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
  SE.glyphs.hero = hero;
}

// 3. Zone E: Energy Economics (initialize first to provide highlightSeries callback)
const energy = initEnergyCharts({
  series: SERIES,
  costs: COSTS,
  recovery: RECOVERY,
  fnLabel: 'Se',
  gripT: GRIP_T,
  gripNote: 'forced inferior Se',
});

/* Zone B ↔ Zone D linkage: the Contact Lab responds from whichever slot
   the rail currently has selected — position decides whether the closing
   window gets used or narrated (§2.5). Response latency only; the lab
   chamber itself stays at full render fidelity. */
const SLOT_RESPONSE = [
  { ms: 0, label: 'Dominant' },
  { ms: 80, label: 'Auxiliary' },
  { ms: 250, label: 'Tertiary' },
  { ms: 700, label: 'Inferior' },
  { ms: 1100, label: 'Shadow' },
];
let labGlyph = null;

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new SeGlyph(railCanvas, { seed: 23, coreGlow: 0.9, COL });
  railGlyph.bombard = true;
  railGlyph.start();
  SE.glyphs.rail = railGlyph;

  initStackRail({
    slots: SLOTS,
    glyph: railGlyph,
    highlightSeries: (i) => {
      energy.highlightSeries(i);
      const r = SLOT_RESPONSE[clamp(i, 0, SLOT_RESPONSE.length - 1)];
      if (labGlyph) labGlyph.setStackLatency(r.ms, r.label);
    },
  });
}

// 5. Zone C: Feeder Coupling
const feederCanvas = document.getElementById('feederCanvas');
if (feederCanvas) {
  const feederGlyph = new SeGlyph(feederCanvas, { seed: 37, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();
  SE.glyphs.feeder = feederGlyph;

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Se',
  });
}

// 6. Zone D: The Contact Lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const lab = new SeGlyph(verifyCanvas, { seed: 61, coreGlow: 0.95, supply: 0.9, COL });
  lab.setTarget({ scale: 0.85, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  lab.setStackLatency(0, 'Dominant');
  lab.start();
  SE.glyphs.lab = lab;
  labGlyph = lab;

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
  const tLock = el('tLock'), tClar = el('tClar'), cogEl = el('cogState');
  const cellsEl = el('tClarCells');
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
      if (tLock) tLock.textContent = lab.lockMs === null ? '— ms' : lab.lockMs + ' ms';
      if (tClar) tClar.textContent = Math.round(s.clarity * 100) + '%';
      cells.forEach((c, i) => c.classList.toggle('on', s.clarity * 12 > i));
    }
    if (cogEl && s.state.key !== lastCog) {
      lastCog = s.state.key;
      const meta = LAB.states[s.state.key];
      cogEl.textContent = meta ? meta.label : s.state.label;
      cogEl.style.color = meta ? meta.color : '';
    }
  });

  /* ---- cross-listen: the same events, ghosted onto Si's meters ----
     A tiny inverse economy: the carnival that peaks Se's pleasure floods
     Si's stress; the empty room is Se's emergency and Si's rest. */
  const sib = { s: 0.10, p: 0.22, ts: 0.10, tp: 0.22 };
  const sibStress = el('sibStress'), sibPleasure = el('sibPleasure');
  lab.state.subscribe((s) => {
    /* Si's baseline mirrors the field: intensity is load, quiet is rest */
    const base = { s: 0.08 + 0.55 * s.intensity, p: 0.30 - 0.18 * s.intensity };
    sib.ts += (base.s - sib.ts) * 0.006;
    sib.tp += (base.p - sib.tp) * 0.006;
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

  /* ---- the field intensity slider ---- */
  const fieldSlider = el('fieldSlider'), fieldOut = el('fieldOut');
  let sliderNoted = false;
  if (fieldSlider) {
    fieldSlider.addEventListener('input', () => {
      const v = +fieldSlider.value;
      lab.setIntensity(v / 100);
      fieldOut.textContent = v + '%';
      if (!sliderNoted) { sliderNoted = true; narrRun++; narrate(N.slider); }
    });
  }

  /* ---- the three scenario triggers ---- */
  for (const b of LAB.buttons) {
    const btn = el(b.id);
    if (!btn) continue;
    btn.addEventListener('click', () => {
      narrRun++;
      const run = narrRun;
      lab.scenario(b.key, b.impact);
      sibImpulse(LAB.sibling[b.key]);
      narrate(N[b.key]);
      ffwd(2.6);
      schedule(run, b.followMs, () => {
        /* contact outcomes are earned, not scripted — the follow-up reads
           what actually happened in the chamber */
        let t = N[b.key + '2'];
        if (b.key === 'window') t = lab.lastWindow === 'miss' ? N.windowMiss : N.windowHit;
        if (b.key === 'flicker' && lab.lastFlicker === 'miss') t = N.flickerMiss;
        narrate(t);
        ffwd(2.4);
      });
    });
  }

  /* first time the cursor becomes the target, say so */
  let steerNoted = false;
  verifyCanvas.addEventListener('pointermove', () => {
    if (!steerNoted && lab.steered && narrRun === 0) {
      steerNoted = true;
      narrate(N.hover);
    }
  });
}
