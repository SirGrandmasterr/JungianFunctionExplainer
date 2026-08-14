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
import { initEnergyCharts } from '../src/shared/energy-charts.js';
import { NiGlyph } from '../src/engines/ni-glyph.js';
import { loadNiData } from '../src/data/ni-data.js';

// 1. Load header & data
initHeader('ni');
const data = loadNiData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY } = data;

// 2. Zone A: Hero Glyph
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new NiGlyph(heroCanvas, { seed: 9, coreGlow: 1, hudScale: 1.35, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
}

// 3. Zone E: Energy Economics (initialize first to provide highlightSeries callback)
const energy = initEnergyCharts({
  series: SERIES,
  costs: COSTS,
  recovery: RECOVERY,
  fnLabel: 'Ni',
  gripT: GRIP_T,
  gripNote: 'forced inferior Ni',
});

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new NiGlyph(railCanvas, { seed: 23, coreGlow: 0.9, COL });
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
  const feederGlyph = new NiGlyph(feederCanvas, { seed: 37, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Ni',
  });
}

// 6. Zone D: Perception Fidelity Lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  /* The lab runs on a thin ambient supply so the user's own fragments are what
     visibly move the readout — the chamber still converges unattended, just
     slowly enough that the buttons stay the protagonist. */
  const lab = new NiGlyph(verifyCanvas, { seed: 61, coreGlow: 0.95, supply: 0.35, COL });
  lab.setTarget({ scale: 0.85, fidelity: 0.92, latency: 0, noise: 0, duty: 1, control: 0.7 });
  lab.setStructure({ countMul: 1.1, k: 3, rigidity: 0.55 });
  lab.conv = 0.06;
  lab.orbiters.length = 0;
  lab.start();

  const N = data.VERIFY.narrations;
  const narrEl = document.getElementById('verifyNarr');
  const vBtns = ['btnFragment', 'btnForce', 'btnContradict', 'btnLiteral'].map(id => document.getElementById(id));
  const mStress = document.getElementById('mStress'), mPleasure = document.getElementById('mPleasure');
  const mStressVal = document.getElementById('mStressVal'), mPleasureVal = document.getElementById('mPleasureVal');
  let narrRun = 0;
  const narrate = t => { if (narrEl) narrEl.textContent = t; };
  const schedule = (run, ms, fn) => setTimeout(() => { if (run === narrRun) fn(); }, ms);
  const lock = on => vBtns.forEach(b => { if (b) b.disabled = on; });

  function updateMeters() {
    if (!mStress || !mPleasure) return;
    const s = Math.round(lab.stress * 100), pl = Math.round(lab.pleasure * 100);
    mStress.style.width = s + '%'; mStressVal.textContent = s + '%';
    mPleasure.style.width = pl + '%'; mPleasureVal.textContent = pl + '%';
  }
  if (!REDUCED) {
    (function mLoop() { updateMeters(); requestAnimationFrame(mLoop); })();
  }

  function ffwd(seconds) {
    if (!REDUCED) return;
    const steps = Math.round(seconds * 30);
    for (let i = 0; i < steps; i++) lab.step(1 / 30);
    lab.draw();
    updateMeters();
  }

  // Correlated fragments — individually meaningless, and the only way in
  if (vBtns[0]) {
    vBtns[0].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      const before = lab.insights;
      const r = lab.spawnSub('fragment', { n: 9, w: 1.3 });
      const c = lab.conv;
      narrate(r.held ? N.fragHeld : c < 0.34 ? N.fragEarly : c < 0.68 ? N.fragMid : N.fragLate);
      ffwd(2.4);
      /* the flare is not commanded — it either arrives on this batch or it doesn't */
      schedule(run, 2400, () => {
        if (lab.insights > before) { narrate(N.fragFlare); ffwd(3); }
      });
    });
  }

  // Premature convergence — the same flare, fired on a fraction of the material
  if (vBtns[1]) {
    vBtns[1].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      const r = lab.spawnSub('premature');
      const pct = Math.round((r ? r.conv : lab.conv) * 100);
      narrate(N.force.replace('{pct}', pct));
      ffwd(2.2);
      schedule(run, 5600, () => { narrate(N.forceAfter); ffwd(2); });
    });
  }

  // The contradiction — the image does not patch, it goes
  if (vBtns[2]) {
    vBtns[2].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      const sub = lab.spawnSub('contradict');
      if (!sub) { narrate(N.contradictNone); return; }
      lock(true);
      narrate(N.contradict);
      ffwd(1.8);
      schedule(run, 4000, () => { narrate(N.contradictEnd); ffwd(3.5); lock(false); });
    });
  }

  // The literal present — straight through the aperture, unregistered
  if (vBtns[3]) {
    vBtns[3].addEventListener('click', () => {
      narrRun++; const run = narrRun;
      lab.spawnSub('literal');
      narrate(N.literal);
      ffwd(1.6);
      schedule(run, 3400, () => { narrate(N.literalEnd); ffwd(2); });
    });
  }
}
