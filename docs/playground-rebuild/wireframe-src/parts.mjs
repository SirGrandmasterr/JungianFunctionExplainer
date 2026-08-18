/* ============================================================
   Shared Playground furniture — the pieces S3/S4/S7/S8 all use.
   Strategy A ("The Ledger") with the involvement spine grafted
   from Strategy B and fidelity tiering grafted from Strategy C.
   ============================================================ */
import { C, T, R, L, P, CIR, KICK, glyph, FNS, meter, capacityMeter, seismo, defaultSeries, fakeLines, para, cal } from './lib.mjs';

/* Row geometry is the hierarchy. Height IS rank. */
export const ROW_H = { dom: 186, aux: 156, tert: 122, inf: 100 };
export const GLYPH_S = { dom: 32, aux: 28, tert: 24, inf: 22 };
export const MONO_LINES = { dom: 5, aux: 3, tert: 2, inf: 2 };
export const SEISMO_H = { dom: 104, aux: 84, tert: 58, inf: 46 };
export const TIER = { dom: 'FULL', aux: 'MID', tert: 'LOW', inf: 'LOW' };
export const RANK_LABEL = { dom: 'DOMINANT · 1st', aux: 'AUXILIARY · 2nd', tert: 'TERTIARY · 3rd', inf: 'INFERIOR · 4th' };

/* column x-offsets, relative to row x, for a 1028-wide row */
export const COL = { id: 12, rule1: 144, mono: 156, rule2: 488, seis: 500, rule3: 796, out: 808, delta: 956, end: 1024 };

export function fnRow(x, y, w, o) {
  const { fn, rank } = o;
  const h = o.h || ROW_H[rank];
  const g = [];
  const dim = o.dim;
  const inkMain = dim ? C.faint : C.ink;

  g.push(R(x, y, w, h, { fill: o.fillOverride || (rank === 'dom' ? C.f1 : C.f0), stroke: C.rule, sw: o.emphasise ? 1.8 : 1 }));
  if (o.overlay) g.push(R(x + 1, y + 1, w - 2, h - 2, { fill: `url(#${o.overlay})`, stroke: null, op: 0.85 }));
  if (o.dim) g.push(R(x + 1, y + 1, w - 2, h - 2, { fill: 'url(#pDead)', stroke: null, op: 0.9 }));

  /* --- identity gutter + glyph --- */
  const gs = o.glyphSize || GLYPH_S[rank];
  g.push(KICK(x + COL.id, y + 18, RANK_LABEL[rank], { size: 8.5, fill: dim ? C.faint : C.mute }));
  g.push(T(x + COL.id, y + 50, FNS[fn].label, { size: rank === 'dom' ? 30 : rank === 'aux' ? 26 : 22, w: 700, fill: inkMain }));
  g.push(T(x + COL.id, y + 64, FNS[fn].name, { size: 8.6, fill: dim ? C.faint : C.mute }));
  g.push(glyph(fn, x + COL.id, y + 74, gs, { stroke: dim ? C.rule : C.ink2 }));
  g.push(T(x + COL.id + gs + 7, y + 74 + gs * 0.44, FNS[fn].glyph, { size: 8, fill: C.faint }));
  g.push(T(x + COL.id + gs + 7, y + 74 + gs * 0.44 + 10, `glyph ${gs}px`, { size: 7.5, mono: true, fill: C.faint }));
  if (o.tierChip !== false) {
    g.push(R(x + COL.id, y + h - 24, 42, 14, { fill: C.f2, stroke: C.rule2, r: 7 }));
    g.push(T(x + COL.id + 21, y + h - 14, o.tier || TIER[rank], { size: 8, w: 700, ls: 0.5, fill: C.mute, anchor: 'middle' }));
  }
  if (o.roleBadge) {
    g.push(R(x + COL.id + 48, y + h - 24, o.roleBadge.length * 5.6 + 14, 14, { fill: C.dark, stroke: null, r: 7 }));
    g.push(T(x + COL.id + 48 + (o.roleBadge.length * 5.6 + 14) / 2, y + h - 14, o.roleBadge, { size: 8, w: 700, ls: 0.5, fill: '#fff', anchor: 'middle' }));
  }

  g.push(L(x + COL.rule1, y + 10, x + COL.rule1, y + h - 10, { stroke: C.rule2 }));

  /* --- expression stream --- */
  const mx = x + COL.mono, mw = COL.rule2 - COL.mono - 12;
  g.push(KICK(mx, y + 18, 'expression stream', { size: 8.5, fill: dim ? C.faint : C.mute }));
  const nLines = o.monoLines ?? MONO_LINES[rank];
  if (o.streamText) {
    o.streamText.forEach((t, i) => g.push(T(mx, y + 36 + i * 14, t, { size: 10.2, fill: i === o.streamText.length - 1 ? inkMain : C.mute, style: i === o.streamText.length - 1 ? 'normal' : 'normal' })));
  } else {
    g.push(fakeLines(mx, y + 32, mw, nLines, { lh: 13, fade: true, fill: dim ? C.rule2 : C.f4 }));
  }
  if (!dim) {
    const cy = y + 32 + (o.streamText ? (o.streamText.length - 1) * 14 + 4 : (nLines - 1) * 13);
    g.push(R(mx + (o.streamText ? 0 : mw * 0.9) + (o.streamText ? o.streamText[o.streamText.length - 1].length * 5.2 + 3 : 0), cy, 5, 9, { fill: C.ink, stroke: null }));
  }
  if (o.forecastLine) {
    const fy = y + h - 34;
    g.push(R(mx - 3, fy - 12, mw + 6, 28, { fill: 'url(#pFore)', stroke: C.ink, sw: 1, dash: '3 2', r: 2 }));
    g.push(T(mx + 2, fy - 1, 'PROJECTED', { size: 7.5, w: 700, ls: 0.6, fill: C.ink, mono: true }));
    g.push(T(mx + 2, fy + 11, o.forecastLine, { size: 9.6, fill: C.ink2, style: 'italic' }));
  }

  g.push(L(x + COL.rule2, y + 10, x + COL.rule2, y + h - 10, { stroke: C.rule2 }));

  /* --- seismograph --- */
  const sx = x + COL.seis, sw2 = COL.rule3 - COL.seis - 12;
  const sh = o.seismoH || SEISMO_H[rank];
  g.push(KICK(sx, y + 18, 'stress trace', { size: 8.5, fill: dim ? C.faint : C.mute }));
  g.push(T(sx + sw2, y + 18, o.stressLabel || 'STRESS', { size: 8, w: 700, ls: 0.5, fill: C.faint, anchor: 'end' }));
  g.push(seismo(sx, y + 26, sw2, sh, {
    shape: o.shape || 'calm',
    beats: o.beats || 16,
    forecast: o.forecast ? defaultSeries(6, o.forecast) : null,
    labelReserve: o.labelReserve,
  }));
  g.push(T(sx, y + 26 + sh + 12, `stress ${o.stress ?? 22}`, { size: 10.5, w: 700, mono: true, fill: inkMain }));
  if (o.dStress !== undefined) g.push(T(sx + 62, y + 26 + sh + 12, o.dStress, { size: 11.5, w: 700, mono: true, fill: C.ink }));
  if (rank === 'dom') g.push(T(sx + sw2, y + 26 + sh + 12, 'x-axis = BEATS, not seconds', { size: 8, mono: true, fill: C.faint, anchor: 'end' }));

  g.push(L(x + COL.rule3, y + 10, x + COL.rule3, y + h - 10, { stroke: C.rule2 }));

  /* --- scalar readouts --- */
  const ox = x + COL.out, ow = COL.delta - COL.out - 14;
  /* labels are a FULL/MID component; a row demoted to a short height drops them */
  const labelled = o.labels === false ? false : (rank === 'dom' || rank === 'aux' || o.forceLabels) && h >= 130;
  const rows = [
    ['pleasure', o.pleasure ?? 0.3, o.fPleasure, o.pleasureVal ?? '30'],
    ['involvement', o.involve ?? 0.25, o.fInvolve, `${Math.round((o.involve ?? 0.25) * 100)}%`],
  ];
  let ry = y + 26;
  rows.forEach(([lab, v, fv, val]) => {
    if (labelled) { g.push(KICK(ox, ry, lab, { size: 8, fill: dim ? C.faint : C.mute })); ry += 7; }
    g.push(meter(ox, ry, ow - 34, { v, fv, h: labelled ? 8 : 6 }));
    g.push(T(ox + ow - 30, ry + (labelled ? 8 : 7), val, { size: 9.5, mono: true, w: 600, fill: inkMain }));
    ry += (labelled ? 28 : 20);
  });
  if (labelled) { g.push(KICK(ox, ry, 'energy / capacity', { size: 8, fill: dim ? C.faint : C.mute })); ry += 7; }
  g.push(capacityMeter(ox, ry, ow - 34, { remaining: o.energy ?? 0.7, cost: o.cost ?? 0, h: labelled ? 10 : 7 }));
  g.push(T(ox + ow - 30, ry + (labelled ? 9 : 7), `${Math.round((o.energy ?? 0.7) * 100)}`, { size: 9.5, mono: true, w: 600, fill: inkMain }));
  if (labelled) g.push(T(ox, ry + 24, o.cost ? 'filled = left · hatched = this action takes' : 'filled = remaining capacity', { size: 7.6, fill: C.faint }));

  /* --- forecast delta gutter (reserved column, empty at rest) --- */
  const dx = x + COL.delta;
  g.push(R(dx, y + 10, COL.end - COL.delta, h - 20, { fill: o.deltas ? C.f1 : C.f0, stroke: C.rule2, dash: o.deltas ? null : '2 3' }));
  g.push(T(dx + (COL.end - COL.delta) / 2, y + 22, 'Δ', { size: 10, w: 700, fill: o.deltas ? C.ink : C.rule, anchor: 'middle' }));
  if (o.deltas) {
    /* LOW-tier rows carry only the two deltas that decide the choice */
    o.deltas.slice(0, h >= 150 ? 4 : 2).forEach((d, i) => {
      g.push(T(dx + (COL.end - COL.delta) / 2, y + 42 + i * 26, d[1], { size: 13, w: 700, mono: true, fill: C.ink, anchor: 'middle' }));
      g.push(T(dx + (COL.end - COL.delta) / 2, y + 52 + i * 26, d[0], { size: 7.5, ls: 0.4, fill: C.mute, anchor: 'middle' }));
    });
  } else {
    g.push(T(dx + (COL.end - COL.delta) / 2, y + h / 2 + 4, 'reserved', { size: 8, fill: C.rule, anchor: 'middle' }));
    g.push(T(dx + (COL.end - COL.delta) / 2, y + h / 2 + 16, 'empty', { size: 8, fill: C.rule, anchor: 'middle' }));
  }
  return g.join('');
}

/* ---------- involvement spine (the Strategy-B graft) ---------- */
export function spine(x, y, w, h, shares, o = {}) {
  const g = [];
  const labels = o.labels || ['Ti', 'Se', 'Ni', 'Fe'];
  const rowH = o.rowHeights;
  g.push(R(x, y, w, h, { fill: C.f0, stroke: C.ink, sw: 1.2 }));
  let cy = y;
  shares.forEach((s, i) => {
    const sh = h * s;
    g.push(R(x, cy, w, sh, { fill: i % 2 ? C.f2 : C.f4, stroke: C.page, sw: 1 }));
    g.push(T(x + w / 2, cy + Math.min(sh / 2 + 4, 16), labels[i], { size: 10.5, w: 700, fill: C.ink, anchor: 'middle' }));
    if (sh > 34) g.push(T(x + w / 2, cy + sh / 2 + 15, `${Math.round(s * 100)}%`, { size: 8.5, mono: true, fill: C.ink2, anchor: 'middle' }));
    /* the mismatch tell: mark where the segment overruns its own row */
    if (rowH) {
      const own = rowH[i];
      if (sh > own + 6) {
        g.push(P(`M${x - 6} ${cy + sh} L${x - 1} ${cy + sh}`, { stroke: C.ink, sw: 2 }));
        g.push(T(x - 8, cy + sh + 3, '▲', { size: 8, fill: C.ink, anchor: 'end' }));
      }
    }
    cy += sh;
  });
  if (o.forecast) {
    let fy = y;
    o.forecast.forEach((s) => {
      fy += h * s;
      g.push(L(x - 4, fy, x + w + 4, fy, { stroke: C.ink, sw: 1.4, dash: '4 3' }));
    });
    g.push(T(x - 5, y - 6, 'proposed ▸', { size: 7.5, w: 700, fill: C.ink, anchor: 'end' }));
  }
  return g.join('');
}

/* ---------- action rail ---------- */
export function actionCard(x, y, w, h, o) {
  const g = [];
  const hov = o.hovered;
  g.push(R(x, y, w, h, { fill: hov ? C.f2 : C.f0, stroke: hov ? C.ink : C.rule, sw: hov ? 2 : 1, r: 3 }));
  if (hov) g.push(R(x - 3, y - 3, w + 6, h + 6, { fill: 'none', stroke: C.ink, sw: 1, dash: '3 3', r: 5 }));
  if (o.axis) {
    const tag = o.axis === 'alleviate' ? 'ALLEVIATES' : 'AGGRAVATES';
    const tw = tag.length * 5.4 + 16;
    g.push(R(x + w - tw - 8, y + 8, tw, 15, { fill: o.axis === 'alleviate' ? C.f0 : C.dark, stroke: C.ink, sw: 1, r: 2 }));
    g.push(T(x + w - tw / 2 - 8, y + 19, tag, { size: 8, w: 700, ls: 0.5, fill: o.axis === 'alleviate' ? C.ink : '#fff', anchor: 'middle' }));
    if (o.axis === 'alleviate') g.push(P(`M${x + w - tw - 14} ${y + 12} l0 8 M${x + w - tw - 18} ${y + 16} l8 0`, { stroke: C.ink, sw: 1.6 }));
    else g.push(P(`M${x + w - tw - 18} ${y + 16} l8 0`, { stroke: C.ink, sw: 1.6 }));
  }
  g.push(T(x + 12, y + 20, o.title, { size: 12, w: 700, fill: C.ink }));
  if (o.detail) g.push(T(x + 12, y + 34, o.detail, { size: 9.5, fill: C.mute }));
  /* signature chips — which functions this action demands */
  const chipY = o.detail ? y + 42 : y + 30;
  let cx = x + 12;
  o.sig.forEach(([fn, pct]) => {
    const label = `${FNS[fn].label} ${pct}`;
    const cw = label.length * 5.6 + 14;
    g.push(R(cx, chipY, cw, 16, { fill: C.f2, stroke: C.rule2, r: 8 }));
    g.push(glyph(fn, cx + 3, chipY + 3, 10, { stroke: C.ink2 }));
    g.push(T(cx + 16, chipY + 11, label, { size: 8.6, w: 600, fill: C.ink2 }));
    cx += cw + 5;
  });
  if (o.note) {
    g.push(R(x + 12, chipY + 20, w - 24, 13, { fill: C.f1, stroke: C.rule2, dash: '2 2', r: 2 }));
    g.push(T(x + 16, chipY + 30, o.note, { size: 7.8, mono: true, fill: C.mute }));
  }
  /* footer: likelihood at rest, COMMIT on hover */
  const fy = y + h - 24;
  if (hov && o.commit !== false) {
    g.push(R(x + 12, fy, w - 92, 20, { fill: C.dark, stroke: null, r: 2 }));
    g.push(T(x + 12 + (w - 92) / 2, fy + 14, 'COMMIT  ⏎', { size: 9.5, w: 700, ls: 0.8, fill: '#fff', anchor: 'middle' }));
    g.push(T(x + w - 12, fy + 14, `p ${Math.round(o.odds * 100)}%`, { size: 9, mono: true, w: 700, fill: C.ink, anchor: 'end' }));
  } else {
    g.push(KICK(x + 12, fy + 2, 'likelihood unforced', { size: 7.5 }));
    g.push(meter(x + 12, fy + 8, w - 70, { v: o.odds, h: 6 }));
    g.push(T(x + w - 12, fy + 14, `${Math.round(o.odds * 100)}%`, { size: 9, mono: true, w: 700, fill: C.ink, anchor: 'end' }));
  }
  return g.join('');
}

/* ---------- Whole-Human band (collapsed) ---------- */
export function wholeBand(x, y, w, h, o = {}) {
  const g = [];
  g.push(R(x, y, w, h, { fill: C.f1, stroke: C.ink, sw: 1.4 }));
  g.push(P(`M${x + 14} ${y + h / 2 - 4} l6 5 l-6 5`, { stroke: C.ink, sw: 1.8, cap: 'round' }));
  g.push(T(x + 30, y + 26, 'WHOLE HUMAN', { size: 12.5, w: 700, ls: 0.7, fill: C.ink }));
  g.push(T(x + 30, y + 40, 'one organism · one supply', { size: 9, fill: C.mute }));
  g.push(T(x + 30, y + 56, o.state || 'BALANCED', { size: 9, w: 700, mono: true, fill: C.ink }));
  /* aggregate trace */
  g.push(seismo(x + 176, y + 14, 236, h - 30, { shape: o.shape || 'calm', beats: 20, forecast: o.forecast ? defaultSeries(6, o.forecast) : null, labelReserve: false }));
  g.push(T(x + 176, y + h - 5, 'aggregate trace (4 constituents behind, faint)', { size: 7.5, fill: C.faint }));
  /* aggregate scalars */
  const stats = o.stats || [['energy', '62%', 0.62], ['stress', '41', 0.41], ['pleasure', '18', 0.18], ['evenness', '0.71', 0.71]];
  let sx = x + 436;
  stats.forEach(([lab, val, v]) => {
    g.push(KICK(sx, y + 20, lab, { size: 7.5 }));
    g.push(T(sx, y + 42, val, { size: 19, w: 700, mono: true, fill: C.ink }));
    g.push(meter(sx, y + 50, 84, { v, h: 5 }));
    sx += 100;
  });
  /* in / out */
  const ix = x + 852;
  g.push(KICK(ix, y + 20, 'impressions in  ·  expressions out', { size: 7.5 }));
  const mid = ix + 130;
  g.push(L(mid, y + 26, mid, y + 60, { stroke: C.ink, sw: 1.2 }));
  g.push(R(mid - (o.inW ?? 88), y + 30, o.inW ?? 88, 11, { fill: C.f4, stroke: C.rule2 }));
  g.push(R(mid, y + 46, o.outW ?? 52, 11, { fill: C.f3, stroke: C.rule2 }));
  g.push(T(mid - 4, y + 39, 'IN', { size: 8.5, w: 700, fill: C.ink, anchor: 'end' }));
  g.push(T(mid + 4, y + 55, 'OUT', { size: 8.5, w: 700, fill: C.ink }));
  g.push(T(mid + 60, y + 55, o.ioNote || 'introverted judges emit little', { size: 7.5, fill: C.faint }));
  /* expand */
  g.push(R(x + w - 128, y + h / 2 - 13, 114, 26, { fill: C.f0, stroke: C.ink, sw: 1, r: 3 }));
  g.push(T(x + w - 71, y + h / 2 + 4, o.expandLabel || 'EXPAND  ⌄', { size: 9.5, w: 700, ls: 0.6, fill: C.ink, anchor: 'middle' }));
  return g.join('');
}

/* ---------- scenario envelope header ---------- */
export function envelopeHeader(x, y, w, h, o = {}) {
  const g = [];
  g.push(KICK(x + 18, y + 22, 'scenario — envelopes everything below', { size: 8.5 }));
  g.push(T(x + 18, y + 46, o.title || 'The Credit Thief', { size: 21, w: 700, fill: C.ink }));
  g.push(T(x + 18, y + 66, o.vignette || 'Sprint review, nine people. A colleague is presenting your architecture as their own. The promotion list closes in six days.', { size: 10.5, fill: C.mute }));
  g.push(R(x + 18, y + 74, 96, 17, { fill: C.f0, stroke: C.rule, r: 2 }));
  g.push(T(x + 66, y + 86, 'BRIEFING  ▸', { size: 8.5, w: 700, ls: 0.5, fill: C.ink2, anchor: 'middle' }));
  g.push(R(x + 122, y + 74, 150, 17, { fill: C.f0, stroke: C.rule, r: 2 }));
  g.push(T(x + 197, y + 86, o.vessel || 'VESSEL: ISTP  Ti·Se·Ni·Fe', { size: 8.5, w: 700, mono: true, fill: C.ink2, anchor: 'middle' }));

  /* state chip + the two margins — the Q-C glance */
  const cx = x + w - 430;
  g.push(R(cx, y + 16, 132, 34, { fill: o.chipDark ? C.dark : C.f0, stroke: C.ink, sw: 1.6, r: 3 }));
  g.push(T(cx + 66, y + 32, o.state || 'BALANCED', { size: 13, w: 700, ls: 1, fill: o.chipDark ? '#fff' : C.ink, anchor: 'middle' }));
  g.push(T(cx + 66, y + 44, o.stateSub || 'no bypass · no hijack', { size: 8, fill: o.chipDark ? '#fff' : C.mute, anchor: 'middle' }));
  const margins = o.margins || [['margin to LOOP', 0.62, '31'], ['margin to GRIP', 0.78, '58']];
  let mx = cx + 148;
  margins.forEach(([lab, v, val]) => {
    g.push(KICK(mx, y + 22, lab, { size: 7.5 }));
    g.push(meter(mx, y + 28, 108, { v, h: 9 }));
    g.push(T(mx, y + 52, val, { size: 15, w: 700, mono: true, fill: C.ink }));
    g.push(T(mx + 26, y + 52, 'pts', { size: 8, fill: C.faint }));
    mx += 130;
  });
  g.push(T(x + w - 18, y + 86, o.beat || 'session beat 12 · run 2 of this vessel', { size: 8.5, mono: true, fill: C.faint, anchor: 'end' }));
  return g.join('');
}

/* ---------- bottom control bar ---------- */
export function controlBar(x, y, w, h, o = {}) {
  const g = [];
  g.push(R(x, y, w, h, { fill: C.f1, stroke: C.rule, sw: 1 }));
  g.push(KICK(x + 16, y + 20, 'teaching overrides — manual, always available', { size: 8 }));
  const toggles = o.toggles || [['LOOP  Ti–Ni', false], ['GRIP  Fe', false]];
  let tx = x + 16;
  toggles.forEach(([lab, on]) => {
    g.push(R(tx, y + 30, 34, 18, { fill: on ? C.dark : C.f0, stroke: C.ink, sw: 1.2, r: 9 }));
    g.push(CIR(on ? tx + 25 : tx + 9, y + 39, 6.5, { fill: on ? '#fff' : C.f4, stroke: C.ink, sw: 1 }));
    g.push(T(tx + 42, y + 43, lab, { size: 10.5, w: 700, fill: C.ink }));
    tx += 42 + lab.length * 6.6 + 26;
  });
  g.push(L(x + 400, y + 14, x + 400, y + h - 14, { stroke: C.rule2 }));
  g.push(KICK(x + 418, y + 20, 'history scope', { size: 8 }));
  g.push(T(x + 418, y + 42, o.scope || 'session · 2 runs · 20 beats retained on screen', { size: 10.5, fill: C.ink2 }));
  g.push(L(x + 800, y + 14, x + 800, y + h - 14, { stroke: C.rule2 }));
  g.push(KICK(x + 818, y + 20, 'motion', { size: 8 }));
  g.push(T(x + 818, y + 42, 'reduced-motion: beats land instantly, no jitter', { size: 10.5, fill: C.ink2 }));
  const btns = o.buttons || ['RESET VESSEL', 'SWAP TYPE'];
  let bx = x + w - 16;
  [...btns].reverse().forEach((b) => {
    const bw = b.length * 6.2 + 24;
    bx -= bw;
    g.push(R(bx, y + 28, bw, 22, { fill: C.f0, stroke: C.ink, sw: 1, r: 2 }));
    g.push(T(bx + bw / 2, y + 43, b, { size: 9, w: 700, ls: 0.5, fill: C.ink, anchor: 'middle' }));
    bx -= 8;
  });
  return g.join('');
}

/* ---------- action rail chrome ---------- */
export function railHeader(x, y, w, o = {}) {
  const g = [];
  g.push(KICK(x, y, o.title || 'action set — hover to forecast, click to commit', { size: 8.5 }));
  g.push(T(x, y + 16, o.sub || '5 candidates · one commit ends this scenario', { size: 9.5, fill: C.mute }));
  return g.join('');
}
