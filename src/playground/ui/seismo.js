/* ============================================================
   CURRENTS · Playground — the seismograph
   BUILD-SPEC §6.1, §6.5, §8, diagram D6.

   The x-axis is BEAT INDEX, not seconds. NOW sits at a fixed
   72% of the width on every trace in the product; the remaining
   28% is permanently reserved for forecast and is EMPTY at rest.
   Nothing committed is ever drawn to the right of NOW.

   Two stacked canvases per instance:
     history   repainted on beats and on the 20 fps sub-beat pass
     forecast  repainted ONLY when the hover candidate changes
   The invariant that matters — a hover never touches committed
   history and never causes a reflow — is enforced by that split.
   ============================================================ */
import { NOW_FRAC } from '../model.js';
import { REDUCED } from '../../utils/dom.js';

const DPR = () => Math.min(devicePixelRatio || 1, 2);

export class Seismo {
  constructor(host, opts = {}) {
    this.host = host;
    this.color = opts.color || '#8aa';
    this.beats = opts.beats || 20;
    this.compact = !!opts.compact;
    this.series = new Float32Array(0);
    this.forecast = null;
    this.jitter = 0;
    this.phase = Math.random() * 6.28;
    this.dead = false;

    host.classList.add('pg-seis');
    this.hc = document.createElement('canvas');
    this.fc = document.createElement('canvas');
    this.hc.className = 'pg-seis-h';
    this.fc.className = 'pg-seis-f';
    host.append(this.hc, this.fc);
    this.hx = this.hc.getContext('2d');
    this.fx = this.fc.getContext('2d');

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
  }

  destroy() { this.ro.disconnect(); }

  /**
   * Rows are built before they are laid out, so the constructor's resize()
   * sees a zero rect and bails — and a ResizeObserver will not have fired
   * yet either. Re-check cheaply before any paint that has real data, so a
   * canvas can never be left at its default 300x150 backing store.
   * Deliberately NOT called from tick(): that would read layout 100 times a
   * second across five canvases.
   */
  ensureSize() {
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    if (Math.abs(r.width - (this.W || 0)) < 0.5 && Math.abs(r.height - (this.H || 0)) < 0.5) return true;
    this.resize();
    return true;
  }

  resize() {
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const d = DPR();
    this.W = r.width; this.H = r.height;
    for (const c of [this.hc, this.fc]) {
      c.width = Math.round(r.width * d);
      c.height = Math.round(r.height * d);
    }
    this.hx.setTransform(d, 0, 0, d, 0, 0);
    this.fx.setTransform(d, 0, 0, d, 0, 0);
    this.drawHistory();
    this.drawForecast();
  }

  setSeries(arr, opts = {}) {
    this.series = arr;
    if (opts.dead !== undefined) this.dead = opts.dead;
    if (this.ensureSize()) this.drawHistory();
  }

  setForecast(arr) {
    this.forecast = arr && arr.length ? arr : null;
    if (this.ensureSize()) this.drawForecast();
  }

  /** Sub-beat motion — appearance only, never a number used for accounting. */
  tick(dt) {
    if (REDUCED || this.dead) return;
    this.phase += dt * 2.4;
    this.drawHistory();
  }

  nowX() { return this.W * NOW_FRAC; }

  /* ---------- history layer ---------- */
  drawHistory() {
    if (!this.W) return;
    const g = this.hx, W = this.W, H = this.H;
    const nx = this.nowX();
    g.clearRect(0, 0, W, H);

    /* rest area + the reserved well, drawn empty */
    g.fillStyle = 'rgba(255,255,255,0.022)';
    g.fillRect(0, 0, nx, H);
    g.strokeStyle = 'rgba(255,255,255,0.07)';
    g.lineWidth = 1;
    g.setLineDash([2, 3]);
    g.strokeRect(nx + 0.5, 0.5, W - nx - 1, H - 1);
    g.setLineDash([]);

    /* baseline */
    g.strokeStyle = 'rgba(255,255,255,0.08)';
    g.setLineDash([1, 4]);
    g.beginPath(); g.moveTo(0, H - 6); g.lineTo(W, H - 6); g.stroke();
    g.setLineDash([]);

    const n = this.series.length;
    if (n > 1) {
      const px = (i) => (nx * i) / (n - 1);
      const py = (v) => H - 5 - (v / 100) * (H - 12);
      const jit = (i) => (REDUCED || this.dead || i < n - 3) ? 0
        : Math.sin(this.phase + i * 1.7) * (0.6 + (this.series[i] / 100) * 1.6);

      /* filled body — cheap depth, and it makes a flat trace legible */
      g.beginPath();
      g.moveTo(0, H - 5);
      for (let i = 0; i < n; i++) g.lineTo(px(i), py(this.series[i]) + jit(i));
      g.lineTo(px(n - 1), H - 5);
      g.closePath();
      g.fillStyle = this.hexA(this.color, this.dead ? 0.05 : 0.14);
      g.fill();

      g.beginPath();
      for (let i = 0; i < n; i++) {
        const x = px(i), y = py(this.series[i]) + jit(i);
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.strokeStyle = this.dead ? 'rgba(160,170,190,0.35)' : this.color;
      g.lineWidth = this.compact ? 1.2 : 1.7;
      g.lineJoin = 'round'; g.lineCap = 'round';
      g.stroke();

      /* the live head */
      if (!this.dead) {
        const hx2 = px(n - 1), hy = py(this.series[n - 1]) + jit(n - 1);
        g.beginPath(); g.arc(hx2, hy, this.compact ? 1.8 : 2.4, 0, 6.284);
        g.fillStyle = this.color; g.fill();
      }
    }

    /* NOW rule — the fixed divider between record and projection */
    g.beginPath(); g.moveTo(nx, 0); g.lineTo(nx, H);
    g.strokeStyle = 'rgba(255,255,255,0.42)'; g.lineWidth = 1.2; g.stroke();
  }

  /* ---------- forecast layer — the ONLY canvas a hover repaints ---------- */
  drawForecast() {
    if (!this.W) return;
    const g = this.fx, W = this.W, H = this.H;
    g.clearRect(0, 0, W, H);
    if (!this.forecast) return;

    const nx = this.nowX();
    const bw = W - nx;
    const f = this.forecast;
    const px = (i) => nx + (bw * i) / (f.length - 1);
    const py = (v) => H - 5 - (v / 100) * (H - 12);

    /* hatch fill — position AND ink both carry the distinction, never hue */
    g.save();
    g.beginPath(); g.rect(nx, 0, bw, H); g.clip();
    g.strokeStyle = this.hexA(this.color, 0.26); g.lineWidth = 1;
    for (let x = nx - H; x < W + H; x += 5) {
      g.beginPath(); g.moveTo(x, H); g.lineTo(x + H, 0); g.stroke();
    }
    g.restore();

    g.beginPath();
    for (let i = 0; i < f.length; i++) { const x = px(i), y = py(f[i]); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.strokeStyle = this.color;
    g.lineWidth = this.compact ? 1.3 : 1.8;
    g.setLineDash([4, 3]);
    g.lineJoin = 'round';
    g.stroke();
    g.setLineDash([]);

    g.beginPath(); g.arc(px(f.length - 1), py(f[f.length - 1]), this.compact ? 1.8 : 2.4, 0, 6.284);
    g.fillStyle = this.color; g.fill();
  }

  hexA(hex, a) {
    if (hex.startsWith('rgb')) return hex.replace(/rgb\(([^)]+)\)/, `rgba($1,${a})`);
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(v, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
}

/** Build the 6-sample forecast tail the reserved band draws: b5 → b8. */
export function forecastTail(fromStress, impactStress, settledStress) {
  return Float32Array.from([
    fromStress,
    fromStress + (impactStress - fromStress) * 0.55,
    impactStress,
    impactStress + (settledStress - impactStress) * 0.45,
    impactStress + (settledStress - impactStress) * 0.78,
    settledStress,
  ]);
}
