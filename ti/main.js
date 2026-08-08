/* ============================================================
   CURRENTS · Ti Page Main Orchestrator
   Imports Ti modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/ti-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { initHeader } from '../src/shared/header.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initEnergyCharts } from '../src/shared/energy-charts.js';
import { TiGlyph } from '../src/engines/ti-glyph.js';
import { loadTiData } from '../src/data/ti-data.js';

// 1. Load header & data
initHeader('ti');
const data = loadTiData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY } = data;

// 2. Zone A: Hero Glyph
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new TiGlyph(heroCanvas, { seed: 7, coreGlow: 1, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
}

// 3. Zone E: Energy Economics (initialize first to provide highlightSeries callback)
const energy = initEnergyCharts({
  series: SERIES,
  costs: COSTS,
  recovery: RECOVERY,
  fnLabel: 'Ti',
  gripT: GRIP_T,
  gripNote: 'forced inferior Ti',
});

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new TiGlyph(railCanvas, { seed: 21, coreGlow: 0.9, COL });
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
  const feederGlyph = new TiGlyph(feederCanvas, { seed: 33, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Ti',
  });
}

// 6. Zone D: Verification Lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const verifyGlyph = new TiGlyph(verifyCanvas, { seed: 55, coreGlow: 0.95, COL });
  verifyGlyph.setTarget({ scale: 0.85, fidelity: 0.92, latency: 0, noise: 0, duty: 1, control: 0.7 });
  verifyGlyph.setStructure({ countMul: 1.1, k: 3, rigidity: 0.55 });
  verifyGlyph.start();

  const narrEl = document.getElementById('verifyNarr');
  const vBtns = ['btnIso', 'btnLink', 'btnConflict'].map(id => document.getElementById(id));
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
      const isles = verifyGlyph.subs.filter(s => s.kind === 'iso').length;
      if (isles >= 2) {
        narrate(data.VERIFY.narrations.isoFull);
        return;
      }
      verifyGlyph.spawnSub('iso', { color: COL.s });
      narrate(data.VERIFY.narrations.iso);
      ffwd(4);
    });
  }

  if (vBtns[1]) {
    vBtns[1].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      const go = () => {
        if (run !== narrRun) return;
        const r = verifyGlyph.subs.find(s => s.kind === 'iso' && s.state === 'resident') || null;
        verifyGlyph.spawnSub('link', { color: COL.n, linkTo: r });
        narrate(data.VERIFY.narrations.link);
        ffwd(3);
        schedule(run, 2800, () => {
          narrate(data.VERIFY.narrations.linkDone);
          ffwd(3.2);
        });
      };
      if (!verifyGlyph.subs.some(s => s.kind === 'iso')) {
        verifyGlyph.spawnSub('iso', { color: COL.s });
        narrate(data.VERIFY.narrations.linkPre);
        ffwd(4);
        if (REDUCED) go(); else schedule(run, 1900, go);
      } else go();
    });
  }

  if (vBtns[2]) {
    vBtns[2].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      vBtns.forEach(b => { if (b) b.disabled = true; });
      verifyGlyph.spawnSub('conflict', { color: COL.crit });
      narrate(data.VERIFY.narrations.conflict);
      ffwd(2.2);
      schedule(run, 2000, () => {
        narrate(data.VERIFY.narrations.conflictMid);
        ffwd(2.5);
      });
      schedule(run, 7200, () => {
        narrate(data.VERIFY.narrations.conflictEnd);
        ffwd(6);
        vBtns.forEach(b => { if (b) b.disabled = false; });
      });
    });
  }
}
