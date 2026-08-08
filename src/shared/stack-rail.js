/* ============================================================
   CURRENTS · Zone B — Stack position rail
   Shared logic: rail slot rendering, fidelity dial, maturity
   slider, slot selection. Parameterized by page-specific data
   (SLOTS array) and a glyph instance.
   ============================================================ */
import { TAU, lerp, clamp, hexA } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';

/**
 * @param {Object} cfg
 * @param {Array}  cfg.slots         — SLOTS data for this function
 * @param {Object} cfg.glyph         — the rail glyph instance (TiGlyph or FiGlyph)
 * @param {Function} cfg.highlightSeries — callback to highlight a drain-chart series
 * @param {string} cfg.accentVar     — CSS variable name for the accent color (e.g. '--c-accent')
 * @param {string} cfg.shadowVar     — CSS variable name for the shadow color (default '--pos-sh')
 */
export function initStackRail(cfg) {
  const { slots, glyph, highlightSeries } = cfg;
  const COL_accent = CSSVAR('--c-accent');
  const COL_sh     = CSSVAR('--pos-sh');
  const COL_grid   = CSSVAR('--grid');

  const railEl = document.getElementById('railSlots');
  let currentSlot = 0;
  let age = 28;

  /* ---- maturity helpers ---- */
  function maturityBoost(slot) {
    const m = clamp((age - 7) / 53, 0, 1);
    const depthNeed = [0.02, 0.08, 0.30, 0.38, 0.18, 0.18, 0.14, 0.10][slots.indexOf(slot)];
    return (m - 0.4) * depthNeed;
  }
  function effectiveParams(slot) {
    const b = maturityBoost(slot);
    const p = { ...slot.params };
    p.fidelity = clamp(p.fidelity + b, 0.08, 0.98);
    p.duty     = clamp(p.duty + b, 0.1, 1);
    p.control  = clamp(p.control + b * 0.7, 0.05, 1);
    return p;
  }
  function effectiveDial(slot) {
    const b = maturityBoost(slot);
    return slot.dial.map((v) => clamp(v + b, 0.04, 1));
  }
  function structureForAge() {
    const m = clamp((age - 7) / 53, 0, 1);
    return {
      countMul: 0.75 + 0.6 * m,
      k: m < 0.3 ? 2 : m < 0.72 ? 3 : 4,
      rigidity: m,
    };
  }

  /* ---- fidelity dial (radar) ---- */
  const DIAL_AXES = ['Endurance', 'Precision', 'Speed', 'Control', 'Awareness'];
  const dialSvg = document.getElementById('dial');
  function dialPoint(i, v) {
    const cx = 140, cy = 100, R = 74;
    const a = -Math.PI / 2 + (i * TAU) / 5;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  }
  let dialShown = [0, 0, 0, 0, 0];
  function drawDial(vals, shadow) {
    dialSvg._target = vals;
    dialSvg._shadow = shadow;
    if (REDUCED) { dialShown = vals.slice(); renderDial(); }
  }
  function renderDial() {
    const col = dialSvg._shadow ? COL_sh : COL_accent;
    let s = '';
    for (const r of [0.33, 0.66, 1]) {
      const pts = DIAL_AXES.map((_, i) => dialPoint(i, r).join(',')).join(' ');
      s += `<polygon points="${pts}" fill="none" stroke="${COL_grid}" stroke-width="1"/>`;
    }
    DIAL_AXES.forEach((ax, i) => {
      const [x, y] = dialPoint(i, 1);
      const [lx, ly] = dialPoint(i, 1.28);
      s += `<line x1="140" y1="100" x2="${x}" y2="${y}" stroke="${COL_grid}" stroke-width="1"/>`;
      s += `<text x="${lx}" y="${ly + 3}" text-anchor="middle" class="axis-label">${ax}</text>`;
    });
    const pts = dialShown.map((v, i) => dialPoint(i, Math.max(v, 0.04)).join(',')).join(' ');
    s += `<polygon points="${pts}" fill="${hexA(col, 0.18)}" stroke="${col}" stroke-width="1.5" stroke-linejoin="round"/>`;
    dialShown.forEach((v, i) => {
      const [x, y] = dialPoint(i, Math.max(v, 0.04));
      s += `<circle cx="${x}" cy="${y}" r="2.6" fill="${col}"/>`;
    });
    dialSvg.innerHTML = '<title>Radar dial for the selected stack position</title>' + s;
  }
  if (!REDUCED) {
    (function dialLoop() {
      const tg = dialSvg._target || slots[0].dial;
      dialShown = dialShown.map((v, i) => {
        return lerp(v, tg[i], 0.12);
      });
      renderDial();
      requestAnimationFrame(dialLoop);
    })();
  }

  /* ---- slot selection ---- */
  function selectSlot(i) {
    currentSlot = i;
    const s = slots[i];
    railEl.querySelectorAll('.slot').forEach((el, j) => el.setAttribute('aria-pressed', String(j === i)));
    glyph.setTarget(effectiveParams(s));
    glyph.setStructure(structureForAge());
    document.getElementById('capTitle').textContent = s.name;
    document.getElementById('capTypes').textContent = `${s.sub.split('·')[0].trim()} function · ${s.types}`;
    document.getElementById('capText').textContent = s.text;
    document.getElementById('stageNote').textContent =
      `rendering: ${s.name} preset` + (s.shadow ? ' · below the waterline' : '');
    drawDial(effectiveDial(s), s.shadow);
    highlightSeries(s.series);
  }

  /* ---- build slot buttons ---- */
  slots.forEach((s, i) => {
    if (i === 4) {
      const wl = document.createElement('div');
      wl.className = 'waterline';
      wl.textContent = 'the waterline · shadow register';
      railEl.appendChild(wl);
    }
    const b = document.createElement('button');
    b.className = 'slot' + (s.shadow ? ' shadow' : '');
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `<span class="n">${i + 1}</span><span>${s.name}<small>${s.types}</small></span>`;
    b.addEventListener('click', () => selectSlot(i));
    railEl.appendChild(b);
  });

  /* ---- maturity slider ---- */
  const ageSlider = document.getElementById('ageSlider');
  ageSlider.addEventListener('input', () => {
    age = +ageSlider.value;
    document.getElementById('ageOut').textContent = `age ${age}`;
    selectSlot(currentSlot);
  });

  /* ---- init ---- */
  selectSlot(0);

  return { selectSlot };
}
