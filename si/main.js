/* ============================================================
   CURRENTS · Si Page Main Orchestrator
   Imports Si modules & initializes all 6 zones
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/si-theme.css';

import { REDUCED } from '../src/utils/dom.js';
import { clamp } from '../src/utils/math.js';
import { initHeader } from '../src/shared/header.js';
import { initStackRail } from '../src/shared/stack-rail.js';
import { initFeederCoupling } from '../src/shared/feeder-coupling.js';
import { initEnergyCharts } from '../src/shared/energy-charts.js';
import { SiGlyph } from '../src/engines/si-glyph.js';
import { loadSiData } from '../src/data/si-data.js';

// 1. Load header & data
initHeader('si');
const data = loadSiData();
const { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB } = data;

/* dev handle: lets tooling and the console drive the engines directly */
const SI = (window.__SI = { glyphs: {} });

// 2. Zone A: Hero Glyph — the still pool at dominant depth
const heroCanvas = document.getElementById('glyphHero');
if (heroCanvas) {
  const hero = new SiGlyph(heroCanvas, { seed: 9, coreGlow: 1, hudScale: 1.35, COL });
  hero.setTarget({ scale: 1, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  hero.start();
  SI.glyphs.hero = hero;
}

// 3. Zone E: Energy Economics (initialize first to provide highlightSeries callback)
const energy = initEnergyCharts({
  series: SERIES,
  costs: COSTS,
  recovery: RECOVERY,
  fnLabel: 'Si',
  gripT: GRIP_T,
  gripNote: 'forced inferior Si',
});

// 4. Zone B: Stack Position Rail
const railCanvas = document.getElementById('glyphRail');
if (railCanvas) {
  const railGlyph = new SiGlyph(railCanvas, { seed: 23, coreGlow: 0.9, COL });
  railGlyph.bombard = true;
  railGlyph.start();
  SI.glyphs.rail = railGlyph;

  initStackRail({
    slots: SLOTS,
    glyph: railGlyph,
    highlightSeries: energy.highlightSeries,
  });
}

// 5. Zone C: Feeder Coupling
const feederCanvas = document.getElementById('feederCanvas');
if (feederCanvas) {
  const feederGlyph = new SiGlyph(feederCanvas, { seed: 37, coreGlow: 0.85, interactive: false, COL });
  feederGlyph.setTarget({ scale: 0.8, fidelity: 0.9, latency: 0, noise: 0, duty: 1, control: 1 });
  feederGlyph.start();
  SI.glyphs.feeder = feederGlyph;

  initFeederCoupling({
    feeders: FEEDERS,
    glyph: feederGlyph,
    fnLabel: 'Si',
  });
}

// 6. Zone D: The Recognition Lab
const verifyCanvas = document.getElementById('verifyCanvas');
if (verifyCanvas) {
  const lab = new SiGlyph(verifyCanvas, { seed: 61, coreGlow: 0.95, supply: 0.9, COL });
  lab.setTarget({ scale: 0.85, fidelity: 0.95, latency: 0, noise: 0, duty: 1, control: 1 });
  lab.start();
  SI.glyphs.lab = lab;

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
  const tMatch = el('tMatch'), tCost = el('tCost'), cogEl = el('cogState');
  const cellsEl = el('tMatchCells');
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
      if (tMatch) tMatch.textContent = Math.round(s.match * 100) + '%';
      if (tCost) tCost.textContent = lab.costU.toFixed(1) + ' u';
      cells.forEach((c, i) => c.classList.toggle('on', s.match * 12 > i));
    }
    if (cogEl && s.state.key !== lastCog) {
      lastCog = s.state.key;
      const meta = LAB.states[s.state.key];
      cogEl.textContent = meta ? meta.label : s.state.label;
      cogEl.style.color = meta ? meta.color : '';
    }
  });

  /* ---- the ruling ---- */
  const btnAccept = el('btnAccept'), btnReject = el('btnReject');
  const setRuling = (enabled) => {
    if (btnAccept) btnAccept.disabled = !enabled;
    if (btnReject) btnReject.disabled = !enabled;
  };
  lab.state.subscribe(() => {
    const userPending = !!(lab.pending && !lab.pending.auto);
    if (btnAccept && btnAccept.disabled === userPending) setRuling(userPending);
  });
  if (btnAccept) btnAccept.addEventListener('click', () => { lab.resolve('accept'); ffwd(1.6); });
  if (btnReject) btnReject.addEventListener('click', () => { lab.resolve('reject'); ffwd(1.6); });

  /* resolution narration follows what actually happened — including the
     shadow register inverting the ruling, when it does */
  lab.onResolve = (choice, auto) => {
    narrRun++;
    narrate(auto ? N.deviantAuto : choice === 'accept' ? N.deviantAccept : N.deviantReject);
    setRuling(false);
  };

  /* ---- cross-listen: the same arrivals, ghosted onto Se's meters ----
     The unbroken routine that soothes Si starves Se into restlessness;
     the deviation that alarms the record is, to its sibling, motion. */
  const sib = { s: 0.18, p: 0.22, ts: 0.18, tp: 0.22 };
  const sibStress = el('sibStress'), sibPleasure = el('sibPleasure');
  lab.state.subscribe(() => {
    /* a quiet pool is a starving eye: Se's ghost stress climbs on stillness */
    sib.ts += (0.52 - sib.ts) * 0.0022;
    sib.tp += (0.16 - sib.tp) * 0.0022;
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

  /* ---- the three arrivals ---- */
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
      if (b.followMs > 0) {
        schedule(run, b.followMs, () => { narrate(N[b.key + '2']); ffwd(2.4); });
      }
    });
  }

  /* first time the user sounds the strata, say what sounding is */
  let steerNoted = false;
  verifyCanvas.addEventListener('pointermove', () => {
    if (!steerNoted && lab.steered && narrRun === 0) {
      steerNoted = true;
      narrate(N.hover);
    }
  });
}
