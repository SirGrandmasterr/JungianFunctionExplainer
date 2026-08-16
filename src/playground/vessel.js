/* ============================================================
   CURRENTS · Playground — the Vessel
   Four chambers on two crossed beams, floating at the Surface.

   The geometry is the argument. Dominant and auxiliary hold the
   left column, tertiary and inferior the right; the ROW each one
   takes is decided purely by its attitude. Nothing enforces "two
   above the Surface and two below" — it falls out, for all
   sixteen types, because attitudes alternate down a legal stack.
   The invariant is never captioned because it never has to be.

   One clock steps the backdrop and all four engines. No chamber
   runs its own rAF (see chamber.js for why that matters).
   ============================================================ */
import { FN, isLegal, side } from './types.js';
import { Chamber, paletteFor } from './chamber.js';
import { ANCHOR, RANK_SIZE, RANK_WEIGHT, RANK_LABEL, RANK_PARAMS } from '../data/playground-data.js';
import { TAU, clamp, lerp, hexA, mulberry32 } from '../utils/math.js';
import { REDUCED } from '../utils/dom.js';

const RANKS = ['dom', 'aux', 'tert', 'inf'];
/* Dominant and auxiliary read left; the two entailed slots read right. */
const COLUMN = { dom: 'left', aux: 'left', tert: 'right', inf: 'right' };

export class Vessel {
  constructor(stage, opts = {}) {
    this.stage = stage;
    this.COL = opts.COL || {};
    this.onChamberClick = opts.onChamberClick || null;

    this.bg = document.createElement('canvas');
    this.bg.className = 'vessel-bg';
    this.bg.setAttribute('aria-hidden', 'true');
    stage.appendChild(this.bg);
    this.ctx = this.bg.getContext('2d');

    this.chambers = {};       /* rank → Chamber */
    this.nodes = {};          /* rank → { el, label } */
    this.stack = null;
    this.tokens = [];
    this.lap = [];            /* the circuit, as stage-normalized points */
    this.rng = mulberry32(7);

    this.t = 0;
    this.tilt = 0;            /* eased hull list, radians */
    this.tiltTarget = 0;
    this.capsized = 0;        /* 0 → upright, 1 → the inferior has the helm */
    this.capsizeTarget = 0;
    this.energy = 1;
    this.pressure = { };      /* fn → 0..1 axis starvation */
    this.flash = {};          /* rank → decaying flash from a paid line */
    this.loop = null;         /* {a,b} when a loop orbit is running */

    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this._resize();
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(stage);
  }

  /* ---------- geometry ---------- */

  _resize() {
    const r = this.stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.W = r.width; this.H = r.height;
    this.bg.width = r.width * this.dpr;
    this.bg.height = r.height * this.dpr;
    this._place();
    if (REDUCED) this.draw();
  }

  /** Anchor point for a rank, in pixels, before tilt. */
  anchor(rank) {
    const col = COLUMN[rank];
    const row = this.stack ? side(this.stack, rank) : 'above';
    return {
      x: (col === 'left' ? ANCHOR.left : ANCHOR.right) * this.W,
      y: (row === 'above' ? ANCHOR.above : ANCHOR.below) * this.H,
    };
  }

  core() { return { x: this.W / 2, y: ANCHOR.surface * this.H }; }

  /** Rotate a point about the core by the current hull list. */
  _tilted(p, amount = 1) {
    const c = this.core(), a = this.tilt * amount;
    if (!a) return p;
    const dx = p.x - c.x, dy = p.y - c.y, s = Math.sin(a), co = Math.cos(a);
    return { x: c.x + dx * co - dy * s, y: c.y + dx * s + dy * co };
  }

  /** Where a chamber actually sits this frame: anchor, tilted, then capsize-swapped. */
  pos(rank) {
    let p = this._tilted(this.anchor(rank));
    if (this.capsized > 0.001 && (rank === 'dom' || rank === 'inf')) {
      const other = this._tilted(this.anchor(rank === 'dom' ? 'inf' : 'dom'));
      p = { x: lerp(p.x, other.x, this.capsized), y: lerp(p.y, other.y, this.capsized) };
    }
    return p;
  }

  size(rank) {
    const base = Math.min(this.W, this.H) * 0.46;
    let s = base * RANK_SIZE[rank];
    /* In the grip the small chamber is not merely visible — it is steering. */
    if (rank === 'inf') s *= 1 + this.capsized * 0.55;
    if (rank === 'dom') s *= 1 - this.capsized * 0.42;
    return s;
  }

  /* ---------- building ---------- */

  /** Mount a stack. Safe to call repeatedly: the old chambers are torn down. */
  build(stack, opts = {}) {
    this.teardown();
    this.stack = stack;
    this.legal = isLegal(stack);

    for (const rank of RANKS) {
      const fnKey = stack[rank];
      if (!fnKey) continue;

      const el = document.createElement('div');
      el.className = `chamber rank-${rank} att-${FN[fnKey].att} cls-${FN[fnKey].cls}`;
      el.style.setProperty('--el', `var(${{ n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' }[FN[fnKey].el]})`);
      el.dataset.rank = rank;
      el.dataset.fn = fnKey;

      const tag = document.createElement('button');
      tag.className = 'chamber-tag';
      tag.type = 'button';
      tag.innerHTML =
        `<b>${FN[fnKey].label}</b><span>${RANK_LABEL[rank]}</span>` +
        `<small>×${RANK_PARAMS[rank] ? ({ dom: '1.0', aux: '1.5', tert: '2.5', inf: '4.0' })[rank] : ''}</small>`;
      tag.title = `${FN[fnKey].name} — ${FN[fnKey].glyph}. Open the ${FN[fnKey].label} page.`;
      tag.addEventListener('click', () => this.onChamberClick && this.onChamberClick(fnKey, rank));
      el.appendChild(tag);

      const pip = document.createElement('i');
      pip.className = 'chamber-pressure';
      pip.title = 'axis pressure — this chamber is being starved by its partner';
      el.appendChild(pip);

      this.stage.appendChild(el);
      this.nodes[rank] = { el, tag, pip };
      this.pressure[fnKey] = 0;
    }

    this._place();

    /* Engines are constructed only once their slot has real layout: SeGlyph
       seeds its stimulus field in absolute pixels and never re-seeds, so a
       0×0 construction leaves it permanently empty. */
    for (const rank of RANKS) {
      const fnKey = stack[rank];
      if (!fnKey) continue;
      this.chambers[rank] = new Chamber(this.nodes[rank].el, fnKey, rank, {
        COL: paletteFor(fnKey, this.COL),
        seed: 11 + RANKS.indexOf(rank) * 17,
        interactive: opts.interactive !== false,
      });
    }

    this._buildLap();
    return this;
  }

  /**
   * The circuit. One lap: the world reaches the extraverted lens, crosses the
   * core into the interior, is banked and then weighed, and the verdict rides
   * back up to leave through an extraverted chamber. The interior has no door
   * of its own — which is why every exit on this path is above the Surface.
   */
  _buildLap() {
    if (!this.stack) return;
    const byRank = RANKS.filter((r) => this.stack[r]);
    const find = (att, cls) => byRank.find((r) => FN[this.stack[r]].att === att && FN[this.stack[r]].cls === cls);
    const eP = find('e', 'perceive'), iP = find('i', 'perceive');
    const eJ = find('e', 'judge'), iJ = find('i', 'judge');
    /* Free Play stacks can be missing a whole leg; the lap degrades rather
       than breaking, and the gap is exactly what the user should notice. */
    this.lapRanks = [eP, iP, iJ, eJ].filter(Boolean);
    this.exit = eJ || eP || null;
    this.entry = eP || eJ || null;
  }

  /** Everything build() established, undone — including the cached circuit.
      The clock keeps running across a rebuild, so anything left pointing at
      the old stack would be drawn against a null one on the very next frame. */
  teardown() {
    for (const r of RANKS) {
      if (this.chambers[r]) this.chambers[r].destroy();
      if (this.nodes[r]) this.nodes[r].el.remove();
    }
    this.chambers = {}; this.nodes = {}; this.tokens = [];
    this.stack = null; this.lapRanks = null; this.entry = null; this.exit = null;
    this.flash = {}; this.loop = null; this.pressure = {};
    this.tilt = this.tiltTarget = 0;
    this.capsized = this.capsizeTarget = 0;
  }

  _place() {
    if (!this.W) return;
    for (const rank of RANKS) {
      const n = this.nodes[rank];
      if (!n) continue;
      const p = this.pos(rank), s = this.size(rank);
      n.el.style.width = n.el.style.height = `${s}px`;
      n.el.style.left = `${p.x - s / 2}px`;
      n.el.style.top = `${p.y - s / 2}px`;
    }
  }

  /* ---------- live state ---------- */

  /** Global stress, 0..1 — the hull lists before any number says so. */
  setStress(v) { this.tiltTarget = clamp(v, 0, 1) * 0.14 * (this.stack && FN[this.stack.dom].att === 'e' ? 1 : -1); }
  setEnergy(v) { this.energy = clamp(v, 0, 1); }
  setCapsized(on) { this.capsizeTarget = on ? 1 : 0; }
  setLoop(pair) { this.loop = pair; }

  /** Light a chamber for a while — used by salience and by the receipt. */
  activate(rank, amount = 1) {
    if (this.chambers[rank]) this.chambers[rank].activation = clamp(amount, 0, 1);
  }

  /** Play a receipt: every line flashes the chamber that paid it. */
  execute(receipt) {
    const byRank = {};
    for (const l of receipt.lines) byRank[l.rank] = (byRank[l.rank] || 0) + l.cost;
    const max = Math.max(1, ...Object.values(byRank));
    for (const rank of RANKS) {
      const paid = byRank[rank] || 0;
      if (!paid || !this.chambers[rank]) continue;
      const ch = this.chambers[rank];
      this.flash[rank] = 1;
      ch.paid = paid;
      ch.activation = clamp(paid / max, 0.2, 1);
      const line = receipt.lines.find((l) => l.rank === rank);
      /* What the chamber says about the work depends on how it got the work:
         its own job, someone else's job in translation, or a flood. */
      const verb = rank === 'inf' ? 'flooded' : line && line.tau > 1 ? 'strained' : 'pleased';
      ch.react(verb, {
        stress: rank === 'inf' ? 0.4 : line && line.tau > 1 ? 0.18 : 0,
        pleasure: rank === 'dom' || rank === 'aux' ? 0.22 : 0,
      });
    }
  }

  /* ---------- the clock ---------- */

  start() {
    if (this._raf) return;
    if (REDUCED) { this.step(1 / 30); this.draw(); return; }
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (this._visible !== false) { this.step(dt); this.draw(); }
      this._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
    this._io = new IntersectionObserver((e) => { this._visible = e[0].isIntersecting; }, { threshold: 0.02 });
    this._io.observe(this.stage);
  }

  stop() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
    if (this._io) this._io.disconnect();
  }

  destroy() { this.stop(); if (this._ro) this._ro.disconnect(); this.teardown(); this.bg.remove(); }

  step(dt) {
    this.t += dt;
    const ease = 1 - Math.exp(-dt * 2.2);
    this.tilt += (this.tiltTarget - this.tilt) * ease;
    this.capsized += (this.capsizeTarget - this.capsized) * (1 - Math.exp(-dt * 1.1));

    /* ---- the seesaw: one end of a beam starves the other ----
       Sustained load on a function fills its partner's pressure pip; at the
       top of the gauge the starved chamber forces its way into the circuit.
       This is the machinery that later makes grip feel inevitable instead of
       scripted — the geometry has been saying it the whole time. */
    if (this.stack) {
      for (const rank of RANKS) {
        const ch = this.chambers[rank];
        if (!ch) continue;
        ch.activation = Math.max(0, ch.activation - dt * 0.35);
        const partner = this._partnerRank(rank);
        if (partner && this.chambers[partner]) {
          const starve = ch.activation * 0.6;
          const p = this.chambers[partner];
          p.pressure = clamp(p.pressure + (starve - 0.12) * dt * 0.5, 0, 1);
          if (this.nodes[partner]) this.nodes[partner].pip.style.opacity = (p.pressure * 0.9).toFixed(3);
        }
      }
    }

    for (const r of RANKS) if (this.flash[r]) this.flash[r] = Math.max(0, this.flash[r] - dt * 1.4);

    this._stepTokens(dt);
    this._place();
    for (const r of RANKS) if (this.chambers[r]) this.chambers[r].step(dt);
  }

  _partnerRank(rank) {
    return { dom: 'inf', inf: 'dom', aux: 'tert', tert: 'aux' }[rank];
  }

  _stepTokens(dt) {
    if (!this.stack || !this.lapRanks || this.lapRanks.length < 2) return;
    /* Intake is rank-sized: an inferior lens is a pinhole, and the torrent
       waits outside it. Spawn rate follows the entry chamber's weight. */
    const entryW = this.entry ? RANK_WEIGHT[this.entry] : 0.5;
    this._acc = (this._acc || 0) + dt * (0.7 + entryW * 1.9) * this.energy;
    if (this._acc > 1) { this._acc = 0; this.tokens.push({ u: 0, seg: 0, hue: null }); }

    const n = this.lapRanks.length;
    for (const tk of this.tokens) {
      const rank = this.lapRanks[Math.min(tk.seg, n - 1)];
      const w = RANK_WEIGHT[rank] || 0.4;
      tk.u += dt * (0.35 + w * 0.75);
      if (tk.u >= 1) {
        tk.u = 0; tk.seg++;
        if (tk.seg <= n - 1) tk.hue = this.stack[this.lapRanks[tk.seg - 1]];
      }
    }
    this.tokens = this.tokens.filter((tk) => tk.seg <= n);
  }

  /** The polyline a token walks: world → chambers in lap order → world. */
  _lapPoints() {
    const c = this.core();
    const pts = [];
    const first = this.pos(this.lapRanks[0]);
    pts.push({ x: first.x, y: -30 });
    for (let i = 0; i < this.lapRanks.length; i++) {
      pts.push(this.pos(this.lapRanks[i]));
      /* every crossing of the Surface is metered at the core */
      const next = this.lapRanks[i + 1];
      if (next && side(this.stack, this.lapRanks[i]) !== side(this.stack, next)) pts.push(c);
    }
    const last = this.pos(this.lapRanks[this.lapRanks.length - 1]);
    pts.push({ x: last.x, y: -30 });
    return pts;
  }

  /* ---------- drawing ---------- */

  draw() {
    const ctx = this.ctx;
    if (!ctx || !this.W) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.W, this.H);
    if (!this.stack) return;

    const c = this.core();
    const surfaceY = ANCHOR.surface * this.H;

    /* the interior: everything under the line sits on darker ground */
    ctx.fillStyle = 'rgba(4,7,14,0.55)';
    ctx.fillRect(0, surfaceY, this.W, this.H - surfaceY);

    /* ---- the beams: thickness tapers by rank weight, and the taper IS
       the hierarchy — the first thing readable at a glance ---- */
    for (const [a, b] of [['dom', 'inf'], ['aux', 'tert']]) {
      if (!this.chambers[a] || !this.chambers[b]) continue;
      const pa = this.pos(a), pb = this.pos(b);
      const ca = this._elColor(this.stack[a]), cb = this._elColor(this.stack[b]);
      const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
      grad.addColorStop(0, hexA(ca, 0.5));
      grad.addColorStop(0.5, hexA(this.COL.axis || '#2a3648', 0.55));
      grad.addColorStop(1, hexA(cb, 0.32));
      ctx.strokeStyle = grad;
      ctx.lineCap = 'round';
      /* draw as two tapered halves so the weight difference is visible */
      ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(c.x, c.y);
      ctx.lineWidth = 3 + RANK_WEIGHT[a] * 7; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(pb.x, pb.y);
      ctx.lineWidth = 3 + RANK_WEIGHT[b] * 7; ctx.stroke();
    }

    /* ---- a loop orbit stops crossing the Surface ---- */
    if (this.loop) this._drawLoop(ctx);

    /* ---- the Surface ---- */
    const acc = this.COL.fn || '#d9cfa8';
    ctx.strokeStyle = hexA(acc, 0.55);
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(0, surfaceY); ctx.lineTo(this.W, surfaceY); ctx.stroke();
    ctx.strokeStyle = hexA(acc, 0.10); ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(0, surfaceY); ctx.lineTo(this.W, surfaceY); ctx.stroke();

    /* ---- the circuit ---- */
    this._drawCircuit(ctx);

    /* ---- the core: no element of its own, and its ring is the fuel gauge ---- */
    const r = 13;
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU);
    ctx.fillStyle = 'rgba(8,12,20,0.95)'; ctx.fill();
    ctx.strokeStyle = hexA(this.COL.muted || '#6b7689', 0.85); ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath();
    ctx.arc(c.x, c.y, r - 3.5, -Math.PI / 2, -Math.PI / 2 + TAU * this.energy);
    ctx.strokeStyle = hexA(acc, 0.9); ctx.lineWidth = 2.4; ctx.stroke();

    for (const r2 of RANKS) if (this.chambers[r2]) this._drawFlash(ctx, r2);

    /* The chambers paint last, and from here: owning the clock means owning
       both halves of it. Each engine draws to its own canvas, layered over
       this backdrop by the DOM. */
    for (const r2 of RANKS) if (this.chambers[r2]) this.chambers[r2].draw();
  }

  _elColor(fnKey) {
    const el = FN[fnKey].el;
    return this.COL[el] || this.COL.fn || '#8b5cf6';
  }

  _drawCircuit(ctx) {
    if (!this.stack || !this.lapRanks || this.lapRanks.length < 2) return;
    const pts = this._lapPoints();
    ctx.save();
    ctx.strokeStyle = hexA(this.COL.axis || '#2a3648', 0.5);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 6]);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();

    /* attention tokens, coloured by whatever last transformed them */
    const n = this.lapRanks.length;
    for (const tk of this.tokens) {
      const seg = Math.min(tk.seg, pts.length - 2);
      const a = pts[seg], b = pts[seg + 1];
      if (!a || !b) continue;
      const x = lerp(a.x, b.x, tk.u), y = lerp(a.y, b.y, tk.u);
      const col = tk.hue ? this._elColor(tk.hue) : (this.COL.ink2 || '#a8b3c7');
      ctx.beginPath(); ctx.arc(x, y, 2.6, 0, TAU);
      ctx.fillStyle = hexA(col, 0.9); ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 6.5, 0, TAU);
      ctx.fillStyle = hexA(col, 0.13); ctx.fill();
      if (tk.seg >= n) { /* leaving as action */ }
    }
  }

  _drawLoop(ctx) {
    const a = this.pos(this.loop.a === this.stack.dom ? 'dom' : 'tert');
    const b = this.pos(this.loop.b === this.stack.tert ? 'tert' : 'dom');
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const rr = Math.hypot(a.x - b.x, a.y - b.y) / 2;
    ctx.save();
    ctx.strokeStyle = hexA(this.COL.warn || '#fab219', 0.5);
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.lineDashOffset = -this.t * 30;
    ctx.beginPath(); ctx.ellipse(mx, my, rr * 1.15, rr * 0.55, Math.atan2(b.y - a.y, b.x - a.x), 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  _drawFlash(ctx, rank) {
    const f = this.flash[rank];
    if (!f) return;
    const p = this.pos(rank), s = this.size(rank);
    ctx.beginPath();
    ctx.arc(p.x, p.y, s * 0.5 * (1 + (1 - f) * 0.35), 0, TAU);
    ctx.strokeStyle = hexA(this._elColor(this.stack[rank]), f * 0.75);
    ctx.lineWidth = 2 + f * 2;
    ctx.stroke();
  }
}
