/* ============================================================
   CURRENTS · Zone B — Stack position rail
   Shared logic: rail slot rendering, fidelity dial, maturity
   slider, slot selection. Parameterized by page-specific data
   (SLOTS array, CHARACTER weights) and a glyph instance.
   ============================================================ */
import { TAU, lerp, clamp, hexA } from '../utils/math.js';
import { REDUCED, CSSVAR } from '../utils/dom.js';
import { showTip, pinTip, hideTip } from './tooltip.js';

/* ---- the dial's five axes, derived from the §3.1 parameter vector ----
   Derivation rather than authorship is the point: the dial reads the same
   params the glyph renders from, so the two encodings cannot drift apart.
   Each `pos` returns the position term plus the named inputs it used, so a
   tooltip can show its work. */
const pct = (v) => Math.round(v * 100) + '%';
const num = (v) => v.toFixed(2).replace(/^0/, '');
const AXES = [
  { key: 'endurance', label: 'Endurance',
    def: 'How much of the time this seat can stay awake and carrying load.',
    pos: (p) => ({ v: p.duty * (1 - 0.35 * (p.contrary || 0)),
      input: `duty ${pct(p.duty)}` + (p.contrary ? ` · contrary ${pct(p.contrary)}` : '') }) },
  { key: 'precision', label: 'Precision',
    def: 'How coherent the output is — the glyph\'s particle fidelity, degraded by static.',
    pos: (p) => ({ v: p.fidelity * (1 - 0.5 * p.noise),
      input: `fidelity ${num(p.fidelity)}` + (p.noise ? ` · noise ${num(p.noise)}` : '') }) },
  { key: 'speed', label: 'Speed',
    def: 'How quickly the seat answers when called — its response latency, folded to 0–1.',
    pos: (p) => ({ v: 250 / (250 + p.latency), input: `latency ${Math.round(p.latency)} ms` }) },
  { key: 'control', label: 'Control',
    def: 'How reliably the seat does what its owner intends, minus its contrary streak.',
    pos: (p) => ({ v: p.control * (1 - 0.6 * (p.contrary || 0)),
      input: `control ${num(p.control)}` + (p.contrary ? ` · contrary ${pct(p.contrary)}` : '') }) },
  { key: 'awareness', label: 'Awareness',
    def: 'Self-awareness: a seat is known through the clarity of what it renders, and one that acts on its own is opaque to its owner.',
    pos: (p) => ({ v: p.fidelity * (1 - (p.contrary || 0)),
      input: `fidelity ${num(p.fidelity)}` + (p.contrary ? ` · contrary ${pct(p.contrary)}` : '') }) },
];

/**
 * @param {Object} cfg
 * @param {Array}  cfg.slots         — SLOTS data for this function
 * @param {Object} cfg.glyph         — the rail glyph instance (TiGlyph or FiGlyph)
 * @param {Object} cfg.character     — per-axis {w, why} declaring how this function
 *                                     departs from the position template (§3.2)
 * @param {string} cfg.fnLabel       — e.g. 'Fi'
 * @param {Object} cfg.grip          — { minutes, into }: the inferior seat's clock and
 *                                     the function a dominant collapse hands over to
 * @param {Function} cfg.onSelect    — callback fired with the selected slot
 * @param {Function} cfg.highlightSeries — callback to highlight a drain-chart series
 */
export function initStackRail(cfg) {
  const { slots, glyph, highlightSeries, character = {}, fnLabel = '', grip, onSelect } = cfg;
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
  function structureForAge() {
    const m = clamp((age - 7) / 53, 0, 1);
    return {
      countMul: 0.75 + 0.6 * m,
      k: m < 0.3 ? 2 : m < 0.72 ? 3 : 4,
      rigidity: m,
    };
  }

  /* ---- fidelity dial (radar) ----
     Values are DERIVED per axis: position term from the slot's effective
     §3.1 params (the ones the glyph is rendering right now — the maturity
     slider reaches the dial through the same boost), times this function's
     declared character weight. No hand-authored dial numbers exist. */
  function axisChar(key) {
    return character[key] || { w: 1, why: '' };
  }
  function deriveAxis(ax, p) {
    const pos = ax.pos(p);
    const ch = axisChar(ax.key);
    return { pos, ch, v: clamp(pos.v * ch.w, 0.02, 1) };
  }
  function deriveDial(slot) {
    const p = effectiveParams(slot);
    return AXES.map((ax) => deriveAxis(ax, p).v);
  }

  const dialSvg = document.getElementById('dial');
  const dialWrap = dialSvg.closest('.dial-wrap');
  function dialPoint(i, v) {
    const cx = 140, cy = 100, R = 74;
    const a = -Math.PI / 2 + (i * TAU) / 5;
    return [cx + Math.cos(a) * R * v, cy + Math.sin(a) * R * v];
  }

  /* Static chrome is drawn once; per-frame animation only rewrites the
     attributes of the value polygon and its points. The old innerHTML-per-
     frame render destroyed anything attached to a child sixty times a
     second, which is why the dial could never be interrogated. */
  const NS = 'http://www.w3.org/2000/svg';
  let chrome = '<title>Fidelity profile for the selected stack position</title>';
  for (const r of [0.33, 0.66, 1]) {
    const pts = AXES.map((_, i) => dialPoint(i, r).join(',')).join(' ');
    chrome += `<polygon points="${pts}" fill="none" stroke="${COL_grid}" stroke-width="1"/>`;
  }
  AXES.forEach((ax, i) => {
    const [x, y] = dialPoint(i, 1);
    const [lx, ly] = dialPoint(i, 1.28);
    chrome += `<line x1="140" y1="100" x2="${x}" y2="${y}" stroke="${COL_grid}" stroke-width="1"/>`;
    chrome += `<text x="${lx}" y="${ly + 3}" text-anchor="middle" class="axis-label">${ax.label}</text>`;
  });
  dialSvg.innerHTML = chrome;
  const valPoly = document.createElementNS(NS, 'polygon');
  valPoly.setAttribute('stroke-width', '1.5');
  valPoly.setAttribute('stroke-linejoin', 'round');
  dialSvg.appendChild(valPoly);
  const focusRing = document.createElementNS(NS, 'circle');
  focusRing.setAttribute('r', '7');
  focusRing.setAttribute('fill', 'none');
  focusRing.setAttribute('stroke-width', '1.2');
  focusRing.setAttribute('display', 'none');
  dialSvg.appendChild(focusRing);
  const valDots = AXES.map(() => {
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('r', '2.6');
    dialSvg.appendChild(c);
    return c;
  });

  let dialShown = [0, 0, 0, 0, 0];
  let dialTarget = slots[0] ? deriveDial(slots[0]) : dialShown;
  let dialCol = COL_accent;
  let focusAxis = -1;
  let dialTextEl = null, live = null;
  function paintDial() {
    valPoly.setAttribute('points', dialShown.map((v, i) => dialPoint(i, Math.max(v, 0.04)).join(',')).join(' '));
    valPoly.setAttribute('fill', hexA(dialCol, 0.18));
    valPoly.setAttribute('stroke', dialCol);
    dialShown.forEach((v, i) => {
      const [x, y] = dialPoint(i, Math.max(v, 0.04));
      valDots[i].setAttribute('cx', x);
      valDots[i].setAttribute('cy', y);
      valDots[i].setAttribute('fill', dialCol);
    });
    if (focusAxis >= 0) {
      const [x, y] = dialPoint(focusAxis, Math.max(dialShown[focusAxis], 0.04));
      focusRing.setAttribute('cx', x);
      focusRing.setAttribute('cy', y);
      focusRing.setAttribute('stroke', dialCol);
      focusRing.removeAttribute('display');
    } else {
      focusRing.setAttribute('display', 'none');
    }
  }
  function drawDial(vals, shadow) {
    dialTarget = vals;
    dialCol = shadow ? COL_sh : COL_accent;
    if (REDUCED) { dialShown = vals.slice(); paintDial(); }
  }
  if (!REDUCED) {
    (function dialLoop() {
      dialShown = dialShown.map((v, i) => lerp(v, dialTarget[i], 0.12));
      paintDial();
      requestAnimationFrame(dialLoop);
    })();
  }

  /* ---- dial interrogation: hover, tap, and keyboard all resolve to one
     of five wedges, each far wider than a fingertip ---- */
  function tipHTML(i) {
    const slot = slots[currentSlot];
    const ax = AXES[i];
    const d = deriveAxis(ax, effectiveParams(slot));
    const aged = Math.abs(maturityBoost(slot)) > 0.005;
    let s = `<div class="t">${ax.label} · ${d.v.toFixed(2)}</div>`;
    s += `<div>${ax.def}</div>`;
    s += `<div class="row"><span class="k">${slot.name} preset${aged ? ` · age ${age}` : ''}</span><b>${d.pos.input}</b></div>`;
    s += `<div class="row"><span class="k">position term</span><b>${d.pos.v.toFixed(2)}</b></div>`;
    if (d.ch.w !== 1 || d.ch.why) {
      s += `<div class="row"><span class="k">${fnLabel} character</span><b>×${d.ch.w.toFixed(2)}</b></div>`;
      if (d.ch.why) s += `<div style="margin-top:2px">${d.ch.why}</div>`;
    }
    return s;
  }
  function axisText(i) {
    const slot = slots[currentSlot];
    const ax = AXES[i];
    const d = deriveAxis(ax, effectiveParams(slot));
    const chPart = (d.ch.w !== 1 || d.ch.why)
      ? ` × ${d.ch.w.toFixed(2)} ${fnLabel} character${d.ch.why ? ` (${d.ch.why})` : ''}`
      : '';
    return `${ax.label} ${d.v.toFixed(2)} — ${d.pos.input} → ${d.pos.v.toFixed(2)}${chPart}. ${ax.def}`;
  }
  function pointClient(i) {
    const r = dialSvg.getBoundingClientRect();
    const [px, py] = dialPoint(i, Math.max(dialShown[i], 0.04));
    return [r.left + (px / 280) * r.width, r.top + (py / 200) * r.height];
  }
  function axisFromEvent(e) {
    const r = dialSvg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 280 - 140;
    const y = ((e.clientY - r.top) / r.height) * 200 - 100;
    if (Math.hypot(x, y) < 6) return -1;
    let a = Math.atan2(y, x) + Math.PI / 2;      /* axis 0 points up */
    a = ((a % TAU) + TAU) % TAU;
    return Math.round(a / (TAU / 5)) % 5;
  }
  function showAxis(i, pin) {
    if (i < 0) return;
    const [cx, cy] = pointClient(i);
    (pin ? pinTip : showTip)(tipHTML(i), cx, cy);
    if (live) live.textContent = axisText(i);
  }

  dialSvg.setAttribute('data-tip-anchor', '');
  dialSvg.setAttribute('tabindex', '0');
  dialSvg.setAttribute('role', 'img');
  dialSvg.setAttribute('aria-label',
    'Fidelity profile radar. Focus and use arrow keys to inspect each axis, or read the text version below.');
  dialSvg.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    focusAxis = axisFromEvent(e);
    showAxis(focusAxis);
  });
  dialSvg.addEventListener('pointerleave', () => {
    if (document.activeElement !== dialSvg) focusAxis = -1;
    hideTip();
  });
  dialSvg.addEventListener('pointerdown', (e) => {
    focusAxis = axisFromEvent(e);
    showAxis(focusAxis, true);
  });
  dialSvg.addEventListener('keydown', (e) => {
    const STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (e.key in STEP) {
      e.preventDefault();
      focusAxis = ((focusAxis < 0 ? 0 : focusAxis + STEP[e.key]) + 5) % 5;
      showAxis(focusAxis, true);
    } else if (e.key === 'Escape') {
      focusAxis = -1;
      hideTip(true);
    }
  });
  dialSvg.addEventListener('focus', () => {
    if (focusAxis < 0) focusAxis = 0;
    showAxis(focusAxis, true);
  });
  dialSvg.addEventListener('blur', () => {
    focusAxis = -1;
    hideTip(true);
  });

  /* ---- the §3.5 text alternative: the same numbers, no pointer needed ---- */
  if (dialWrap) {
    const det = document.createElement('details');
    det.className = 'dial-text';
    det.innerHTML = '<summary>Read this profile as text</summary>';
    dialTextEl = document.createElement('ul');
    det.appendChild(dialTextEl);
    const foot = document.createElement('p');
    foot.textContent = 'Derived from the same parameters the glyph renders from; the maturity slider feeds both.';
    det.appendChild(foot);
    dialWrap.appendChild(det);
    live = document.createElement('span');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'polite');
    dialWrap.appendChild(live);
  }
  function renderDialText() {
    if (!dialTextEl) return;
    dialTextEl.innerHTML = AXES.map((_, i) => `<li>${axisText(i)}</li>`).join('');
  }

  /* ---- the inferior seat's two facts: its clock, and what floods into it
     (the retired Zone E teaser's cargo, landed where the reader is already
     looking at the seat in question) ---- */
  let gripEl = null;
  if (grip && fnLabel) {
    gripEl = document.createElement('p');
    gripEl.className = 'grip-note';
    gripEl.hidden = true;
    gripEl.innerHTML =
      `<b>The seat that floods.</b> Forced to run continuously from here, ${fnLabel} ` +
      `empties in ≈${Math.round(grip.minutes)} min. And when a dominant-${fnLabel} stack burns out, ` +
      `the flood arrives here — this seat's occupant, <b>${grip.into}</b>, erupting with none of ` +
      `${fnLabel}'s practice. <a href="/energy/#grip">All eight collapse clocks →</a>`;
    const capText = document.getElementById('capText');
    if (capText) capText.insertAdjacentElement('afterend', gripEl);
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
    if (gripEl) gripEl.hidden = s.key !== 'inferior';
    drawDial(deriveDial(s), s.shadow);
    renderDialText();
    if (focusAxis >= 0 && document.activeElement === dialSvg) showAxis(focusAxis, true);
    /* optional: the drain charts this used to drive now live at /energy/,
       so a page without them simply passes nothing */
    if (highlightSeries) highlightSeries(s.series);
    if (onSelect) onSelect(s);
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

  /* ---- keyboard: the rail is a tablist, so arrows step between slots ---- */
  const ARROW = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
  railEl.addEventListener('keydown', (e) => {
    let next = null;
    if (e.key in ARROW) next = (currentSlot + ARROW[e.key] + slots.length) % slots.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = slots.length - 1;
    if (next === null) return;
    e.preventDefault();
    selectSlot(next);
    const btns = railEl.querySelectorAll('.slot');
    if (btns[next]) btns[next].focus();
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
