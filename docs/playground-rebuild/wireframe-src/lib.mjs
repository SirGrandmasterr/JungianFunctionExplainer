/* ============================================================
   Playground rebuild — wireframe primitives.
   Grayscale only. Structure phase: boxes, labels, placeholder
   text. No illustration, no finished styling.
   Run `node gen.mjs` from this directory to emit ../S*.svg and
   ../D*.svg.
   ============================================================ */

export const SANS = "Inter, 'Segoe UI', system-ui, -apple-system, sans-serif";
export const MONO = "'SF Mono', 'Cascadia Mono', 'Roboto Mono', Consolas, monospace";

/* One ramp. Meaning is never carried by a step on it alone —
   every distinction is also position, shape, label, or ink style. */
export const C = {
  page: '#ffffff',
  ink: '#111111',
  ink2: '#3d3d3d',
  mute: '#6e6e6e',
  faint: '#9a9a9a',
  rule: '#c9c9c9',
  rule2: '#e4e4e4',
  f0: '#ffffff',
  f1: '#f7f7f7',
  f2: '#efefef',
  f3: '#e4e4e4',
  f4: '#d6d6d6',
  f5: '#c2c2c2',
  dark: '#1a1a1a',
};

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- atoms ---------- */

export function T(x, y, s, o = {}) {
  const f = o.mono ? MONO : SANS;
  const a = [
    `x="${x}"`, `y="${y}"`,
    `font-family="${f}"`,
    `font-size="${o.size || 12}"`,
    `fill="${o.fill || C.ink}"`,
  ];
  if (o.anchor) a.push(`text-anchor="${o.anchor}"`);
  if (o.w) a.push(`font-weight="${o.w}"`);
  if (o.ls) a.push(`letter-spacing="${o.ls}"`);
  if (o.op) a.push(`opacity="${o.op}"`);
  if (o.style) a.push(`font-style="${o.style}"`);
  return `<text ${a.join(' ')}>${esc(s)}</text>`;
}

/* Small-caps-ish section label: uppercase + tracking. */
export const KICK = (x, y, s, o = {}) =>
  T(x, y, String(s).toUpperCase(), { size: o.size || 9, w: 700, ls: 1.1, fill: o.fill || C.mute, ...o });

export function R(x, y, w, h, o = {}) {
  const a = [`x="${x}"`, `y="${y}"`, `width="${w}"`, `height="${h}"`];
  a.push(`fill="${o.fill || 'none'}"`);
  if (o.stroke !== null) a.push(`stroke="${o.stroke || C.rule}"`);
  if (o.sw) a.push(`stroke-width="${o.sw}"`);
  if (o.dash) a.push(`stroke-dasharray="${o.dash}"`);
  if (o.r !== undefined) a.push(`rx="${o.r}"`);
  if (o.op) a.push(`opacity="${o.op}"`);
  return `<rect ${a.join(' ')}/>`;
}

export function L(x1, y1, x2, y2, o = {}) {
  const a = [`x1="${x1}"`, `y1="${y1}"`, `x2="${x2}"`, `y2="${y2}"`];
  a.push(`stroke="${o.stroke || C.rule}"`);
  if (o.sw) a.push(`stroke-width="${o.sw}"`);
  if (o.dash) a.push(`stroke-dasharray="${o.dash}"`);
  if (o.cap) a.push(`stroke-linecap="${o.cap}"`);
  if (o.op) a.push(`opacity="${o.op}"`);
  if (o.marker) a.push(`marker-end="url(#${o.marker})"`);
  return `<line ${a.join(' ')}/>`;
}

export function P(d, o = {}) {
  const a = [`d="${d}"`, `fill="${o.fill || 'none'}"`];
  if (o.stroke !== null) a.push(`stroke="${o.stroke || C.ink}"`);
  if (o.sw) a.push(`stroke-width="${o.sw}"`);
  if (o.dash) a.push(`stroke-dasharray="${o.dash}"`);
  if (o.cap) a.push(`stroke-linecap="${o.cap}"`);
  if (o.join) a.push(`stroke-linejoin="${o.join}"`);
  if (o.op) a.push(`opacity="${o.op}"`);
  if (o.marker) a.push(`marker-end="url(#${o.marker})"`);
  return `<path ${a.join(' ')}/>`;
}

export const CIR = (cx, cy, r, o = {}) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill || 'none'}" stroke="${o.stroke === null ? 'none' : o.stroke || C.rule}"${o.sw ? ` stroke-width="${o.sw}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}/>`;

/* ---------- callout badge ---------- */

export function cal(n, x, y, o = {}) {
  const r = o.r || 10.5;
  return [
    o.leader ? L(x, y, o.leader[0], o.leader[1], { stroke: C.ink, sw: 1 }) : '',
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${C.dark}" stroke="${C.page}" stroke-width="1.5"/>`,
    T(x, y + 4, n, { size: 11, w: 700, fill: '#ffffff', anchor: 'middle' }),
  ].join('');
}

/* ---------- text wrapping ---------- */

export function wrap(s, maxW, size, mono = false) {
  const cw = size * (mono ? 0.605 : 0.515);
  const max = Math.max(6, Math.floor(maxW / cw));
  const out = [];
  let line = '';
  for (const word of String(s).split(/\s+/)) {
    if (!line.length) { line = word; continue; }
    if ((line + ' ' + word).length <= max) line += ' ' + word;
    else { out.push(line); line = word; }
  }
  if (line.length) out.push(line);
  return out;
}

export function para(x, y, s, w, o = {}) {
  const size = o.size || 11.5;
  const lh = o.lh || size * 1.42;
  return wrap(s, w, size, o.mono)
    .map((ln, i) => T(x, y + i * lh, ln, { size, fill: o.fill || C.ink2, mono: o.mono, w: o.w, style: o.style }))
    .join('');
}

export const paraH = (s, w, o = {}) => {
  const size = o.size || 11.5;
  const lh = o.lh || size * 1.42;
  return wrap(s, w, size, o.mono).length * lh;
};

/* ---------- placeholder text (lorem-free; reads as real copy shape) ---------- */

export function fakeLines(x, y, w, n, o = {}) {
  const lh = o.lh || 13;
  const out = [];
  for (let i = 0; i < n; i++) {
    const frac = o.widths ? o.widths[i % o.widths.length] : [1, 0.86, 0.94, 0.72, 0.9][i % 5];
    out.push(R(x, y + i * lh, w * frac, o.h || 5, {
      fill: o.fill || C.f4, stroke: null, r: 2.5, op: o.fade ? Math.max(0.28, 1 - i * 0.17) : 1,
    }));
  }
  return out.join('');
}

/* ---------- the eight glyph slots ----------
   Schematic stand-ins ONLY. The real glyph is the canvas engine
   from that function's own page (src/engines/<fn>-glyph.js).
   Drawn here so each function is separable by SHAPE, not colour. */

export function glyph(fn, x, y, s, o = {}) {
  const st = o.stroke || C.ink2;
  const sw = Math.max(0.9, s / 22);
  const g = [];
  const cx = x + s / 2, cy = y + s / 2, r = s * 0.4;
  switch (fn) {
    case 'ti': /* The Lattice */
      for (let i = 0; i <= 3; i++) {
        g.push(L(x + s * 0.12 + (i * s * 0.253), y + s * 0.12, x + s * 0.12 + (i * s * 0.253), y + s * 0.88, { stroke: st, sw }));
        g.push(L(x + s * 0.12, y + s * 0.12 + (i * s * 0.253), x + s * 0.88, y + s * 0.12 + (i * s * 0.253), { stroke: st, sw }));
      }
      break;
    case 'te': /* The Scaffold */
      g.push(R(x + s * 0.12, y + s * 0.12, s * 0.76, s * 0.76, { stroke: st, sw }));
      g.push(L(x + s * 0.12, y + s * 0.42, x + s * 0.88, y + s * 0.42, { stroke: st, sw }));
      g.push(L(x + s * 0.12, y + s * 0.66, x + s * 0.88, y + s * 0.66, { stroke: st, sw }));
      g.push(L(x + s * 0.5, y + s * 0.12, x + s * 0.5, y + s * 0.88, { stroke: st, sw }));
      break;
    case 'fi': /* The Tuning Fork */
      g.push(P(`M${x + s * 0.3} ${y + s * 0.1} L${x + s * 0.3} ${y + s * 0.55} M${x + s * 0.7} ${y + s * 0.1} L${x + s * 0.7} ${y + s * 0.55}`, { stroke: st, sw, cap: 'round' }));
      g.push(P(`M${x + s * 0.3} ${y + s * 0.55} Q${x + s * 0.5} ${y + s * 0.78} ${x + s * 0.7} ${y + s * 0.55}`, { stroke: st, sw }));
      g.push(L(x + s * 0.5, y + s * 0.72, x + s * 0.5, y + s * 0.92, { stroke: st, sw }));
      break;
    case 'fe': /* The Resonance Field */
      for (let i = 1; i <= 3; i++) g.push(CIR(cx, cy, r * (i / 3), { stroke: st, sw, dash: i === 3 ? '2 2.4' : null }));
      g.push(CIR(cx, cy, sw * 1.1, { fill: st, stroke: null }));
      break;
    case 'ne': /* The Spark Tree */
      g.push(L(cx, y + s * 0.92, cx, y + s * 0.52, { stroke: st, sw }));
      g.push(P(`M${cx} ${y + s * 0.52} L${x + s * 0.14} ${y + s * 0.2} M${cx} ${y + s * 0.52} L${x + s * 0.42} ${y + s * 0.1} M${cx} ${y + s * 0.52} L${x + s * 0.68} ${y + s * 0.1} M${cx} ${y + s * 0.52} L${x + s * 0.86} ${y + s * 0.24}`, { stroke: st, sw, cap: 'round' }));
      break;
    case 'ni': /* The Convergence */
      g.push(P(`M${x + s * 0.1} ${y + s * 0.12} L${cx} ${y + s * 0.86} M${x + s * 0.38} ${y + s * 0.1} L${cx} ${y + s * 0.86} M${x + s * 0.66} ${y + s * 0.1} L${cx} ${y + s * 0.86} M${x + s * 0.92} ${y + s * 0.14} L${cx} ${y + s * 0.86}`, { stroke: st, sw, cap: 'round' }));
      g.push(CIR(cx, y + s * 0.86, sw * 1.4, { fill: st, stroke: null }));
      break;
    case 'se': /* The Naked Eye */
      g.push(P(`M${x + s * 0.08} ${cy} Q${cx} ${y + s * 0.1} ${x + s * 0.92} ${cy} Q${cx} ${y + s * 0.9} ${x + s * 0.08} ${cy} Z`, { stroke: st, sw }));
      g.push(CIR(cx, cy, s * 0.13, { fill: st, stroke: null }));
      break;
    case 'si': /* The Still Pool */
      for (let i = 1; i <= 3; i++) {
        g.push(`<ellipse cx="${cx}" cy="${cy}" rx="${r * (i / 3)}" ry="${r * (i / 3) * 0.44}" fill="none" stroke="${st}" stroke-width="${sw}"/>`);
      }
      break;
    default:
      g.push(R(x, y, s, s, { stroke: st, sw, dash: '2 2' }));
  }
  return `<g>${g.join('')}</g>`;
}

export const FNS = {
  ti: { label: 'Ti', name: 'Introverted Thinking', glyph: 'The Lattice' },
  te: { label: 'Te', name: 'Extraverted Thinking', glyph: 'The Scaffold' },
  fi: { label: 'Fi', name: 'Introverted Feeling', glyph: 'The Tuning Fork' },
  fe: { label: 'Fe', name: 'Extraverted Feeling', glyph: 'The Resonance Field' },
  ne: { label: 'Ne', name: 'Extraverted Intuition', glyph: 'The Spark Tree' },
  ni: { label: 'Ni', name: 'Introverted Intuition', glyph: 'The Convergence' },
  se: { label: 'Se', name: 'Extraverted Sensing', glyph: 'The Naked Eye' },
  si: { label: 'Si', name: 'Introverted Sensing', glyph: 'The Still Pool' },
};

/* ---------- meters ---------- */

/* A labelled horizontal meter with an optional dashed forecast
   extension (or retraction) drawn past the committed fill. */
export function meter(x, y, w, o = {}) {
  const h = o.h || 8;
  const v = Math.max(0, Math.min(1, o.v ?? 0.5));
  const fv = o.fv === undefined ? null : Math.max(0, Math.min(1, o.fv));
  const out = [R(x, y, w, h, { fill: C.f2, stroke: C.rule2, sw: 0.8, r: h / 2 })];
  out.push(R(x, y, w * v, h, { fill: o.fill || C.f5, stroke: null, r: h / 2 }));
  if (fv !== null) {
    const a = Math.min(v, fv) * w, b = Math.max(v, fv) * w;
    out.push(R(x + a, y, b - a, h, { fill: 'url(#pFore)', stroke: C.ink, sw: 1, dash: '3 2', r: h / 2 }));
  }
  if (o.ticks) for (let i = 1; i < o.ticks; i++) out.push(L(x + (w * i) / o.ticks, y, x + (w * i) / o.ticks, y + h, { stroke: C.page, sw: 1 }));
  return out.join('');
}

/* Energy/capacity meter: filled = remaining, hatched = what the
   hovered action would take, notch = the point of debt (zero). */
export function capacityMeter(x, y, w, o = {}) {
  const h = o.h || 10;
  const rem = Math.max(0, Math.min(1, o.remaining ?? 0.6));
  const cost = Math.max(0, Math.min(rem + 1, o.cost ?? 0));
  const out = [R(x, y, w, h, { fill: C.f1, stroke: C.rule, sw: 0.9, r: 2 })];
  out.push(R(x, y, w * rem, h, { fill: C.f4, stroke: null }));
  if (cost > 0) {
    const cw = Math.min(w * cost, w * rem);
    out.push(R(x + w * rem - cw, y, cw, h, { fill: 'url(#pFore)', stroke: C.ink, sw: 1, dash: '3 2' }));
    if (cost > rem) {
      out.push(R(x, y, w * (cost - rem), h, { fill: 'url(#pDebt)', stroke: C.ink, sw: 1.2 }));
      out.push(T(x + 3, y + h + 10, 'DEBT', { size: 8, w: 700, ls: 0.6, fill: C.ink }));
    }
  }
  out.push(R(x, y, w, h, { fill: 'none', stroke: C.rule, sw: 0.9, r: 2 }));
  return out.join('');
}

/* ---------- seismograph ----------
   x = beat index. `now` sits at NOW_FRAC of the width; the band
   to its right is reserved for forecast and is EMPTY at rest. */

export const NOW_FRAC = 0.72;

export function seismo(x, y, w, h, o = {}) {
  const nowX = x + w * NOW_FRAC;
  const out = [];
  out.push(R(x, y, w, h, { fill: C.f1, stroke: C.rule2, sw: 0.8 }));
  /* forecast reservation — always drawn, empty at rest */
  out.push(R(nowX, y, x + w - nowX, h, { fill: C.f0, stroke: C.rule2, sw: 0.8, dash: '2 3' }));
  /* baseline */
  out.push(L(x, y + h * 0.68, x + w, y + h * 0.68, { stroke: C.rule2, sw: 0.8, dash: '1 4' }));
  /* beat ticks */
  const beats = o.beats || 18;
  for (let i = 0; i <= beats; i++) {
    const bx = x + (nowX - x) * (i / beats);
    out.push(L(bx, y + h - 4, bx, y + h, { stroke: i % 4 === 0 ? C.faint : C.rule2, sw: 0.8 }));
  }
  /* committed trace */
  const series = o.series || defaultSeries(beats, o.shape || 'calm');
  const px = (i) => x + (nowX - x) * (i / (series.length - 1));
  const py = (v) => y + h - 6 - v * (h - 14);
  out.push(P(series.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' '),
    { stroke: C.ink, sw: 1.6, join: 'round', cap: 'round' }));
  /* NOW rule */
  out.push(L(nowX, y, nowX, y + h, { stroke: C.ink, sw: 1.4 }));
  out.push(T(nowX - 3, y + 10, 'NOW', { size: 8, w: 700, ls: 0.7, fill: C.ink, anchor: 'end' }));
  /* forecast ghost */
  if (o.forecast) {
    const f = o.forecast;
    const fx = (i) => nowX + (x + w - nowX) * (i / (f.length - 1));
    out.push(R(nowX, y, x + w - nowX, h, { fill: 'url(#pFore)', stroke: null, op: 0.9 }));
    out.push(P(f.map((v, i) => `${i ? 'L' : 'M'}${fx(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' '),
      { stroke: C.ink, sw: 1.6, dash: '4 3', join: 'round' }));
    out.push(T(x + w - 4, y + 10, 'FORECAST', { size: 8, w: 700, ls: 0.7, fill: C.ink, anchor: 'end' }));
  } else if (o.labelReserve !== false) {
    out.push(T(x + w - 4, y + 10, 'RESERVED', { size: 8, w: 600, ls: 0.7, fill: C.faint, anchor: 'end' }));
  }
  return out.join('');
}

export function defaultSeries(n, shape) {
  const a = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    let v;
    switch (shape) {
      case 'calm': v = 0.18 + 0.07 * Math.sin(i * 1.7) + 0.04 * Math.sin(i * 0.6); break;
      case 'rising': v = 0.14 + 0.5 * t * t + 0.05 * Math.sin(i * 2.1); break;
      case 'spike': v = 0.16 + 0.06 * Math.sin(i * 1.3) + (t > 0.78 ? (t - 0.78) * 3.2 : 0); break;
      case 'oscillate': v = 0.42 + 0.3 * Math.sin(i * 1.05) * (0.5 + t * 0.8); break;
      case 'flat': v = 0.1 + 0.012 * Math.sin(i * 3.1); break;
      case 'high': v = 0.62 + 0.16 * Math.sin(i * 1.9) + 0.14 * t; break;
      case 'decay': v = 0.72 * Math.exp(-t * 1.9) + 0.12 + 0.03 * Math.sin(i * 2.4); break;
      case 'starved': v = 0.09 - 0.03 * t + 0.01 * Math.sin(i * 4); break;
      default: v = 0.3;
    }
    a.push(Math.max(0.02, Math.min(0.98, v)));
  }
  return a;
}

/* ---------- legend ---------- */

export function legend(x, y, w, items, o = {}) {
  const cols = o.cols || 2;
  const gap = o.gap || 30;
  const colW = (w - gap * (cols - 1)) / cols;
  const bodyW = colW - 30;
  const heights = items.map((it) => {
    let h = 15;
    h += paraH(it.d, bodyW, { size: 11 });
    if (it.hover) h += 3 + paraH(it.hover, bodyW - 30, { size: 10 });
    if (it.commit) h += 2 + paraH(it.commit, bodyW - 30, { size: 10 });
    if (it.state) h += 2 + paraH(it.state, bodyW - 30, { size: 10 });
    return h + 14;
  });
  /* greedy balanced column packing, order preserved down each column */
  const total = heights.reduce((a, b) => a + b, 0);
  const target = total / cols;
  const buckets = Array.from({ length: cols }, () => []);
  let ci = 0, acc = 0;
  items.forEach((it, i) => {
    if (ci < cols - 1 && acc > target - heights[i] / 2) { ci++; acc = 0; }
    buckets[ci].push(i); acc += heights[i];
  });
  const out = [];
  let maxH = 0;
  buckets.forEach((bucket, bi) => {
    const bx = x + bi * (colW + gap);
    let by = y;
    bucket.forEach((i) => {
      const it = items[i];
      out.push(cal(it.n, bx + 10, by + 4, { r: 9.5 }));
      out.push(T(bx + 27, by + 8, it.t, { size: 11.5, w: 700, fill: C.ink }));
      let ly = by + 24;
      out.push(para(bx + 27, ly, it.d, bodyW, { size: 11, fill: C.ink2 }));
      ly += paraH(it.d, bodyW, { size: 11 }) + 3;
      const sub = [['HOV', it.hover], ['CMT', it.commit], ['L/G', it.state]];
      for (const [tag, txt] of sub) {
        if (!txt) continue;
        out.push(T(bx + 27, ly + 8, tag, { size: 8.5, w: 700, mono: true, fill: C.faint, ls: 0.4 }));
        out.push(para(bx + 57, ly + 8, txt, bodyW - 30, { size: 10, fill: C.mute }));
        ly += paraH(txt, bodyW - 30, { size: 10 }) + 2;
      }
      by = ly + 14;
    });
    maxH = Math.max(maxH, by - y);
  });
  return { svg: out.join(''), height: maxH };
}

/* ---------- page shell ---------- */

export const DEFS = `
<defs>
  <pattern id="pFore" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="5" height="5" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="5" stroke="${C.f5}" stroke-width="1.6"/>
  </pattern>
  <pattern id="pDebt" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
    <rect width="4" height="4" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="4" stroke="${C.ink}" stroke-width="1.4"/>
  </pattern>
  <pattern id="pLoop" width="7" height="7" patternUnits="userSpaceOnUse">
    <rect width="7" height="7" fill="#ffffff"/><line x1="0" y1="0" x2="0" y2="7" stroke="${C.f4}" stroke-width="2.4"/>
  </pattern>
  <pattern id="pGrip" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="#ffffff"/>
    <line x1="0" y1="0" x2="6" y2="6" stroke="${C.f5}" stroke-width="1.5"/>
    <line x1="6" y1="0" x2="0" y2="6" stroke="${C.f5}" stroke-width="1.5"/>
  </pattern>
  <pattern id="pDead" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="6" height="6" fill="${C.f1}"/><line x1="0" y1="0" x2="0" y2="6" stroke="${C.rule2}" stroke-width="2"/>
  </pattern>
  <marker id="arw" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="${C.ink}"/>
  </marker>
  <marker id="arwL" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="${C.mute}"/>
  </marker>
  <marker id="dot" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6">
    <circle cx="3" cy="3" r="2.4" fill="${C.ink}"/>
  </marker>
</defs>`;

export const HEAD_H = 58;

export function page({ id, title, subtitle, note, w, h, body, legendItems, legendCols = 2, footer }) {
  const narrow = w < 700;
  const headH = narrow ? 96 : HEAD_H;
  const legendTop = headH + h + 26;
  const lg = legendItems && legendItems.length
    ? legend(28, legendTop + (narrow ? 40 : 26), w - 56, legendItems, { cols: legendCols })
    : { svg: '', height: 0 };
  const footH = footer ? paraH(footer, w - 56, { size: 11 }) + 26 : 0;
  const total = legendTop + (legendItems && legendItems.length ? (narrow ? 40 : 26) + lg.height + 12 : 0) + footH + 20;

  const head = narrow
    ? [
      R(0, 0, w, headH, { fill: C.f1, stroke: null }),
      L(0, headH, w, headH, { stroke: C.ink, sw: 1.5 }),
      R(20, 12, 40, 24, { fill: C.dark, stroke: null, r: 3 }),
      T(40, 29, id, { size: 13, w: 700, fill: '#ffffff', anchor: 'middle' }),
      T(70, 29, title, { size: 13, w: 700, fill: C.ink }),
      para(20, 52, subtitle, w - 40, { size: 9.5, fill: C.mute }),
      T(w - 20, 29, note || `${w} x ${h}`, { size: 9, mono: true, fill: C.mute, anchor: 'end' }),
      T(20, headH - 8, 'GRAYSCALE STRUCTURE WIREFRAME', { size: 8.5, fill: C.faint, ls: 0.3 }),
    ].join('')
    : [
      R(0, 0, w, headH, { fill: C.f1, stroke: null }),
      L(0, headH, w, headH, { stroke: C.ink, sw: 1.5 }),
      R(20, 14, 40, 26, { fill: C.dark, stroke: null, r: 3 }),
      T(40, 32, id, { size: 14, w: 700, fill: '#ffffff', anchor: 'middle' }),
      T(72, 27, title, { size: 15, w: 700, fill: C.ink }),
      T(72, 43, subtitle, { size: 11, fill: C.mute }),
      T(w - 20, 27, note || `canvas ${w} x ${h}`, { size: 10, mono: true, fill: C.mute, anchor: 'end' }),
      T(w - 20, 43, 'GRAYSCALE STRUCTURE WIREFRAME — no colour, no final type, no motion', { size: 9, fill: C.faint, anchor: 'end', ls: 0.3 }),
    ].join('');

  const legendHead = legendItems && legendItems.length
    ? [
      L(28, legendTop, w - 28, legendTop, { stroke: C.ink, sw: 1.2 }),
      narrow
        ? para(28, legendTop + 16, 'CALLOUT LEGEND · HOV = ON HOVER · CMT = ON COMMIT · L/G = UNDER LOOP OR GRIP', w - 80, { size: 9, w: 700, fill: C.mute })
        : KICK(28, legendTop + 16, 'Callout legend — what the region does · HOV on hover · CMT on commit · L/G under loop or grip', { size: 9.5 }),
    ].join('')
    : '';

  const foot = footer
    ? [
      L(28, total - footH - 4, w - 28, total - footH - 4, { stroke: C.rule, sw: 1 }),
      para(28, total - footH + 14, footer, w - 56, { size: 11, fill: C.mute }),
    ].join('')
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${total}" width="${w}" height="${total}" role="img" aria-label="${esc(id + ' ' + title)}">
${DEFS}
<rect width="${w}" height="${total}" fill="${C.page}"/>
${head}
<g transform="translate(0 ${headH})">
${R(0, 0, w, h, { fill: C.page, stroke: null })}
${body}
</g>
${legendHead}
${lg.svg}
${foot}
</svg>
`;
}
