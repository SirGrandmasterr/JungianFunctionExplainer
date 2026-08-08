/* ============================================================
   CURRENTS · Fi Page Main Orchestrator
   Imports Fi modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/fi-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { initHeader } from '../src/shared/header.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initEnergyCharts } from '../src/shared/energy-charts.js';
import { FiGlyph } from '../src/engines/fi-glyph.js';
import { MistGPU } from '../src/engines/fi-mist-gpu.js';
import { loadFiData } from '../src/data/fi-data.js';

// 1. Load header & data
initHeader('fi');
const data = loadFiData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY } = data;

// 2. Zone A: Hero Glyph
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new FiGlyph(heroCanvas, { seed: 7, coreGlow: 1, mistCount: 90000, MistGPU, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
}

// 3. Zone E: Energy Economics
const energy = initEnergyCharts({
  series: SERIES,
  costs: COSTS,
  recovery: RECOVERY,
  fnLabel: 'Fi',
  gripT: GRIP_T,
  gripNote: 'forced inferior Fi',
});

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new FiGlyph(railCanvas, { seed: 21, coreGlow: 0.9, MistGPU, COL });
  railGlyph.bombard = true;
  railGlyph.start();

  initStackRail({
    slots: SLOTS,
    glyph: railGlyph,
    highlightSeries: energy.highlightSeries,
  });
}

// 5. Zone C: Feeder Coupling
const feederCanvas = document.getElementById('feederCanvas');
if (feederCanvas) {
  const feederGlyph = new FiGlyph(feederCanvas, { seed: 33, coreGlow: 0.85, interactive: false, MistGPU, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Fi',
  });
}

// 6. Zone D: Verification Lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const verifyGlyph = new FiGlyph(verifyCanvas, { seed: 55, coreGlow: 0.95, mistCount: 60000, MistGPU, COL });
  verifyGlyph.setTarget({ scale: 0.85, fidelity: 0.92, latency: 0, noise: 0, duty: 1, control: 0.7 });
  verifyGlyph.setStructure({ countMul: 1.1, k: 3, rigidity: 0.55 });
  verifyGlyph.start();

  const narrEl = document.getElementById('verifyNarr');
  const vBtns = ['btnAuthGood', 'btnAuthBad', 'btnFakeGood', 'btnFakeBad'].map(id => document.getElementById(id));
  const mStress = document.getElementById('mStress'), mPleasure = document.getElementById('mPleasure');
  const mStressVal = document.getElementById('mStressVal'), mPleasureVal = document.getElementById('mPleasureVal');
  let narrRun = 0;
  const narrate = t => { if (narrEl) narrEl.textContent = t; };
  const schedule = (run, ms, fn) => setTimeout(() => { if (run === narrRun) fn(); }, ms);

  function updateMeters() {
    if (!mStress || !mPleasure) return;
    const s = Math.round(verifyGlyph.stress * 100), pl = Math.round(verifyGlyph.pleasure * 100);
    mStress.style.width = s + '%'; mStressVal.textContent = s + '%';
    mPleasure.style.width = pl + '%'; mPleasureVal.textContent = pl + '%';
  }
  if (!REDUCED) {
    (function mLoop() { updateMeters(); requestAnimationFrame(mLoop); })();
  }

  function ffwd(seconds) {
    if (!REDUCED) return;
    const steps = Math.round(seconds * 30);
    for (let i = 0; i < steps; i++) verifyGlyph.step(1 / 30);
    verifyGlyph.draw();
    updateMeters();
  }

  if (vBtns[0]) {
    vBtns[0].addEventListener('click', () => {
      narrRun++;
      verifyGlyph.spawnSub('authGood', { color: '#f0b95c' });
      narrate(data.VERIFY.narrations.authGood);
      ffwd(4.5);
    });
  }

  if (vBtns[1]) {
    vBtns[1].addEventListener('click', () => {
      narrRun++;
      verifyGlyph.spawnSub('authBad', { color: '#6272dd' });
      narrate(data.VERIFY.narrations.authBad);
      ffwd(4.5);
    });
  }

  if (vBtns[2]) {
    vBtns[2].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      verifyGlyph.spawnSub('fakeGood', { color: '#ffd9e6' });
      narrate(data.VERIFY.narrations.fakeGood);
      ffwd(3);
      schedule(run, 3200, () => {
        narrate(data.VERIFY.narrations.fakeGoodEnd);
        ffwd(2.5);
      });
    });
  }

  if (vBtns[3]) {
    vBtns[3].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      vBtns.forEach(b => { if (b) b.disabled = true; });
      verifyGlyph.spawnSub('fakeBad', { color: COL.crit });
      narrate(data.VERIFY.narrations.fakeBad);
      ffwd(2.2);
      schedule(run, 2000, () => {
        narrate(data.VERIFY.narrations.fakeBadMid);
        ffwd(2.5);
      });
      schedule(run, 7200, () => {
        narrate(data.VERIFY.narrations.fakeBadEnd);
        ffwd(6);
        vBtns.forEach(b => { if (b) b.disabled = false; });
      });
    });
  }
}
