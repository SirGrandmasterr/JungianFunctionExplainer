/* ============================================================
   CURRENTS · Te Page Main Orchestrator
   Imports Te modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/te-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { initHeader } from '../src/shared/header.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initEnergyTeaser } from '../src/shared/energy-teaser.js';
import { TeGlyph } from '../src/engines/te-glyph.js';
import { loadTeData } from '../src/data/te-data.js';

// 1. Load header & data
initHeader('te');
const data = loadTeData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY } = data;

// 2. Zone A: Hero Glyph
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new TeGlyph(heroCanvas, { seed: 7, coreGlow: 1, hudScale: 1.35, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
}

// Zone E: the economics suite now lives once at /energy/, where the eight
// can be compared; what stays here is the ladder, the grip clock, and a link.
initEnergyTeaser({
  costs: COSTS,
  fnLabel: 'Te',
  gripT: GRIP_T,
  gripInto: 'Fi',
});

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new TeGlyph(railCanvas, { seed: 21, coreGlow: 0.9, COL });
  railGlyph.bombard = true;
  railGlyph.start();

  initStackRail({
    slots: SLOTS,
    glyph: railGlyph,
  });
}

// 5. Zone C: Feeder Coupling
const feederCanvas = document.getElementById('feederCanvas');
if (feederCanvas) {
  const feederGlyph = new TeGlyph(feederCanvas, { seed: 33, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Te',
  });
}

// 6. Zone D: Verification Lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const verifyGlyph = new TeGlyph(verifyCanvas, { seed: 55, coreGlow: 0.95, COL });
  verifyGlyph.setTarget({ scale: 0.85, fidelity: 0.92, latency: 0, noise: 0, duty: 1, control: 0.7 });
  verifyGlyph.setStructure({ countMul: 1.1, k: 3, rigidity: 0.55 });
  verifyGlyph.start();

  const narrEl = document.getElementById('verifyNarr');
  const vBtns = ['btnShip', 'btnPrune', 'btnVague', 'btnReplan'].map(id => document.getElementById(id));
  const mStress = document.getElementById('mStress'), mPleasure = document.getElementById('mPleasure');
  const mStressVal = document.getElementById('mStressVal'), mPleasureVal = document.getElementById('mPleasureVal');
  let narrRun = 0;
  const narrate = t => { if (narrEl) narrEl.textContent = t; };
  const schedule = (run, ms, fn) => setTimeout(() => { if (run === narrRun) fn(); }, ms);
  const lock = on => vBtns.forEach(b => { if (b) b.disabled = on; });

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

  // Ship it — a plan meets the world and the world returns a number
  if (vBtns[0]) {
    vBtns[0].addEventListener('click', () => {
      narrRun++;
      verifyGlyph.spawnSub('ship');
      narrate(data.VERIFY.narrations.ship);
      ffwd(3.5);
    });
  }

  // Measure a failure — flagged, then cut with a snap
  if (vBtns[1]) {
    vBtns[1].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      lock(true);
      verifyGlyph.spawnSub('fail');
      narrate(data.VERIFY.narrations.prune);
      ffwd(0.9);
      schedule(run, 900, () => { narrate(data.VERIFY.narrations.pruneMid); ffwd(1.6); });
      schedule(run, 3000, () => { narrate(data.VERIFY.narrations.pruneEnd); ffwd(3); lock(false); });
    });
  }

  // The unmeasurable claim — nothing to sort it by
  if (vBtns[2]) {
    vBtns[2].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      if (verifyGlyph.subs.some(s => s.kind === 'unmeasurable')) {
        narrate(data.VERIFY.narrations.vagueBusy);
        return;
      }
      verifyGlyph.spawnSub('unmeasurable', { color: COL.f });
      narrate(data.VERIFY.narrations.vague);
      ffwd(2.2);
      schedule(run, 2200, () => { narrate(data.VERIFY.narrations.vagueMid); ffwd(5); });
      schedule(run, 8200, () => { narrate(data.VERIFY.narrations.vagueEnd); ffwd(2.5); });
    });
  }

  // The goalpost moves — scope-cut and re-aim
  if (vBtns[3]) {
    vBtns[3].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      lock(true);
      verifyGlyph.spawnSub('replan');
      narrate(data.VERIFY.narrations.replan);
      ffwd(1.5);
      schedule(run, 1500, () => { narrate(data.VERIFY.narrations.replanMid); ffwd(3); });
      schedule(run, 4600, () => { narrate(data.VERIFY.narrations.replanEnd); ffwd(4); lock(false); });
    });
  }
}
