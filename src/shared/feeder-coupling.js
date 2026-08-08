/* ============================================================
   CURRENTS · Zone C — Feeder coupling
   Shared logic: feeder chip rendering, selection, emitter
   overlay. Parameterized by FEEDERS data + glyph instance.
   ============================================================ */
import { TAU, hexA } from '../utils/math.js';

/**
 * @param {Object} cfg
 * @param {Array}  cfg.feeders      — FEEDERS data for this function
 * @param {Object} cfg.glyph        — the feeder glyph instance
 * @param {string} cfg.fnLabel      — function label (e.g. 'Ti' or 'Fi')
 */
export function initFeederCoupling(cfg) {
  const { feeders, glyph, fnLabel } = cfg;
  const chipsEl = document.getElementById('feederChips');
  let exoticShown = false;

  /* ---- emitter overlay ---- */
  const _originalDraw = glyph.draw.bind(glyph);
  glyph.draw = function () {
    _originalDraw();
    const f = this.feeder;
    if (!f) return;
    const ctx = this.ctx,
      x = this.W * 0.09,
      y = this.cy;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 46);
    g.addColorStop(0, hexA(f.color, 0.5));
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, 46, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, TAU);
    ctx.fillStyle = hexA(f.color, 0.9);
    ctx.fill();
    ctx.fillStyle = '#0b0f18';
    ctx.font = '600 12px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(f.name, x, y + 0.5);
    ctx.strokeStyle = hexA(f.color, 0.25);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 22, y);
    ctx.lineTo(this.cx - this.baseR * this.params.scale * 1.15, y);
    ctx.stroke();
  };

  /* ---- chip rendering ---- */
  function renderChips() {
    chipsEl.innerHTML = '';
    feeders
      .filter((f) => f.canonical || exoticShown)
      .forEach((f) => {
        const b = document.createElement('button');
        b.className = 'chip';
        b.style.color = '';
        b.setAttribute(
          'aria-pressed',
          String(glyph.feeder && glyph.feeder.key === f.key)
        );
        if (glyph.feeder && glyph.feeder.key === f.key) b.style.color = f.color;
        b.innerHTML = `<span class="dot" style="background:${f.color}"></span>${fnLabel} ← ${f.name}`;
        b.addEventListener('click', () => selectFeeder(f));
        chipsEl.appendChild(b);
      });
    const t = document.createElement('button');
    t.className = 'chip-toggle';
    t.textContent = exoticShown
      ? 'hide exotic couplings'
      : 'show exotic couplings ▸';
    t.addEventListener('click', () => {
      exoticShown = !exoticShown;
      renderChips();
    });
    chipsEl.appendChild(t);
  }

  function selectFeeder(f) {
    glyph.setFeeder({ key: f.key, name: f.name, color: f.color, ...f.cfg });
    glyph.setTarget({
      scale: 0.8,
      fidelity: f.unstable ? 0.55 : 0.9,
      latency: 0,
      noise: f.unstable ? 0.15 : 0,
      duty: f.unstable ? 0.55 : 1,
      control: 1,
    });
    document.getElementById('feedTitle').textContent = `${fnLabel} ← ${f.name}`;
    document.getElementById('feedPair').textContent = f.pair;
    document.getElementById('feedText').textContent = f.text;
    document.getElementById('feedWarn').classList.toggle('show', !!f.unstable);
    renderChips();
  }

  /* ---- init ---- */
  selectFeeder(feeders[0]);
}
