/* S6–S10 */
import { C, T, R, L, P, CIR, KICK, glyph, FNS, meter, capacityMeter, seismo, defaultSeries, fakeLines, para, cal } from './lib.mjs';
import { fnRow, spine, actionCard, wholeBand, envelopeHeader, controlBar, railHeader } from './parts.mjs';
import { ledger } from './screens-a.mjs';

/* ============================================================ S6 — Whole-Human */
export function S6() {
  const g = [];
  g.push(R(16, 14, 1408, 872, { fill: C.f0, stroke: C.ink, sw: 2.5, r: 4 }));
  g.push(R(16, 14, 1408, 94, { fill: C.f1, stroke: C.ink, sw: 1.2 }));
  g.push(envelopeHeader(16, 14, 1408, 94, { beat: 'aggregate expanded in place — the four rows are still on screen, collapsed' }));

  /* collapsed function strips — part and whole in one glance */
  g.push(KICK(32, 128, 'the four, collapsed — still live, still ticking', { size: 8.5 }));
  const strips = [
    { fn: 'ti', rank: 'DOM', stress: 26, pl: 34, sh: 42, en: 78, shape: 'calm' },
    { fn: 'se', rank: 'AUX', stress: 19, pl: 28, sh: 22, en: 71, shape: 'calm' },
    { fn: 'ni', rank: 'TERT', stress: 31, pl: 22, sh: 24, en: 46, shape: 'rising' },
    { fn: 'fe', rank: 'INF', stress: 44, pl: 10, sh: 12, en: 29, shape: 'spike' },
  ];
  strips.forEach((s, i) => {
    const y = 138 + i * 34;
    g.push(R(32, y, 1376, 30, { fill: i === 0 ? C.f1 : C.f0, stroke: C.rule }));
    g.push(glyph(s.fn, 40, y + 6, 18, {}));
    g.push(T(64, y + 20, FNS[s.fn].label, { size: 13, w: 700 }));
    g.push(T(88, y + 20, s.rank, { size: 8, w: 700, ls: 0.5, fill: C.mute }));
    g.push(seismo(126, y + 5, 200, 20, { shape: s.shape, beats: 14, labelReserve: false }));
    const stats = [['stress', s.stress], ['pleasure', s.pl], ['share', `${s.sh}%`], ['capacity', s.en]];
    stats.forEach(([lab, v], j) => {
      const sx = 350 + j * 132;
      g.push(T(sx, y + 20, lab, { size: 8, fill: C.mute }));
      g.push(T(sx + 52, y + 20, String(v), { size: 11, mono: true, w: 700 }));
    });
    g.push(meter(890, y + 12, 120, { v: s.sh / 100, h: 7 }));
    g.push(T(1024, y + 20, 'contribution to the aggregate below', { size: 8.5, fill: C.faint }));
    g.push(P(`M1330 ${y + 15} l14 0`, { stroke: C.rule, sw: 1.2, marker: 'arw' }));
    g.push(T(1352, y + 20, 'rolls up', { size: 8, fill: C.faint }));
  });

  /* ---- left: the Vessel figure as aggregate ---- */
  g.push(KICK(32, 296, 'a · the vessel — centre of mass is the aggregate', { size: 8.5 }));
  g.push(R(32, 306, 440, 318, { fill: C.f0, stroke: C.rule }));
  const cx = 252, cy = 462;
  g.push(L(cx, 330, cx, 594, { stroke: C.rule2, dash: '4 4' }));
  g.push(L(112, cy, 392, cy, { stroke: C.rule2, dash: '4 4' }));
  const slots = [['ti', 152, cy, 40, '42%'], ['se', cx, 372, 32, '22%'], ['ni', cx, 552, 33, '24%'], ['fe', 352, cy, 26, '12%']];
  slots.forEach(([fn, x, y, r, pct]) => {
    g.push(CIR(x, y, r, { fill: C.f2, stroke: C.ink, sw: 1.4 }));
    g.push(glyph(fn, x - r * 0.32, y - r * 0.66, r * 0.64, {}));
    g.push(T(x, y + r * 0.36, FNS[fn].label, { size: r * 0.38, w: 700, anchor: 'middle' }));
    g.push(T(x, y + r + 12, pct, { size: 9, mono: true, w: 700, anchor: 'middle' }));
    g.push(L(cx, cy, x, y, { stroke: C.f5, sw: 2.2 }));
  });
  /* centre of mass — pulled toward Ti */
  g.push(CIR(cx, cy, 30, { fill: C.f0, stroke: C.rule, sw: 1, dash: '3 3' }));
  g.push(CIR(cx - 26, cy - 4, 22, { fill: C.dark, stroke: null }));
  g.push(T(cx - 26, cy - 1, 'CoM', { size: 9, w: 700, fill: '#fff', anchor: 'middle' }));
  g.push(P(`M${cx} ${cy} L${cx - 26} ${cy - 4}`, { stroke: C.ink, sw: 2, marker: 'arw' }));
  g.push(T(252, 610, 'geometric centre (dashed) vs. centre of mass (solid) — the offset IS the imbalance', { size: 8.5, anchor: 'middle', fill: C.mute }));

  /* ---- centre: aggregate trace ---- */
  g.push(KICK(490, 296, 'b · aggregate stress trace — four constituents behind, one organism in front', { size: 8.5 }));
  g.push(R(488, 306, 458, 190, { fill: C.f1, stroke: C.rule }));
  ['calm', 'flat', 'rising', 'spike'].forEach((sh) => {
    const s = defaultSeries(20, sh);
    const px = (i) => 500 + (446 * 0.72) * (i / 20);
    const py = (v) => 470 - v * 140;
    g.push(P(s.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' '), { stroke: C.f5, sw: 1 }));
  });
  g.push(seismo(500, 316, 434, 168, { shape: 'rising', beats: 20, labelReserve: true }));
  g.push(T(500, 508, 'aggregate = solid 1.6px · constituents = 1px, behind, unlabelled', { size: 8.5, fill: C.faint }));

  g.push(KICK(490, 534, 'c · four functions become one human — the rules, stated', { size: 8.5 }));
  g.push(R(488, 544, 458, 200, { fill: C.f0, stroke: C.ink, sw: 1.3 }));
  const rules = [
    ['ENERGY', 'sum, then debt-taxed', 'E = Σ max(0, cap) − 1.5 · Σ |min(0, cap)|', 'Jung’s libido is one supply, so a sum is right. Debt is taxed at 1.5x because borrowing costs more than it returns.'],
    ['STRESS', 'peak-weighted blend', 'S = 0.6 · max(sᶠ) + 0.4 · Σ wᶠ sᶠ', 'NOT a mean. One function at 90 while three sit at 10 is a person in trouble, not a person at 30. Identity holds: all-equal in, same value out.'],
    ['PLEASURE', 'weighted mean, conflict-discounted', 'P = Σ wᶠ pᶠ · (1 − 0.55 · conflict)', 'Satisfaction one part of you objects to is diminished satisfaction. conflict = (|p_dom − p_inf| + |p_aux − p_tert|) / 200.'],
    ['EVENNESS', 'normalised entropy', 'H = −Σ iᶠ ln iᶠ / ln 4', 'Replaces involvement in the aggregate — the ratio already sums to 1, so the aggregate reports its spread instead.'],
  ];
  rules.forEach((r, i) => {
    const y = 560 + i * 46;
    g.push(T(502, y + 12, r[0], { size: 9.5, w: 700, ls: 0.5 }));
    g.push(T(576, y + 12, r[1], { size: 9.5, fill: C.mute }));
    g.push(T(502, y + 26, r[2], { size: 10, mono: true, w: 600 }));
    g.push(para(502, y + 38, r[3], 432, { size: 8.8, fill: C.mute }));
    if (i < 3) g.push(L(496, y + 42, 938, y + 42, { stroke: C.rule2 }));
  });

  /* ---- right: aggregate scalars + in/out ---- */
  g.push(KICK(966, 296, 'd · the human, as four numbers', { size: 8.5 }));
  const bigs = [
    ['ENERGY RESERVOIR', '62', '% of 275 total capacity', 0.62, 'one supply, four draws'],
    ['STRESS', '48', 'peak-weighted, not mean', 0.48, 'mean would read 30 — and lie'],
    ['PLEASURE', '18', 'after a 0.22 conflict discount', 0.18, 'raw mean was 23'],
    ['EVENNESS', '0.71', 'spread of the involvement ratio', 0.71, '1.0 = all four equally engaged'],
  ];
  bigs.forEach((b, i) => {
    const bx = 964 + (i % 2) * 226, by = 306 + Math.floor(i / 2) * 100;
    g.push(R(bx, by, 214, 90, { fill: C.f1, stroke: C.rule }));
    g.push(KICK(bx + 12, by + 20, b[0], { size: 7.5 }));
    g.push(T(bx + 12, by + 52, b[1], { size: 30, w: 700, mono: true }));
    g.push(meter(bx + 12, by + 60, 190, { v: b[3], h: 7 }));
    g.push(T(bx + 12, by + 76, b[2], { size: 8.5, fill: C.mute }));
    g.push(T(bx + 12, by + 86, b[4], { size: 8, fill: C.faint }));
  });

  g.push(KICK(966, 534, 'e · impressions taken in · expressions put out', { size: 8.5 }));
  g.push(R(964, 544, 444, 200, { fill: C.f0, stroke: C.ink, sw: 1.3 }));
  const mid = 1186;
  g.push(L(mid, 560, mid, 716, { stroke: C.ink, sw: 1.4 }));
  g.push(T(mid, 556, 'the skin', { size: 8, w: 700, ls: 0.5, anchor: 'middle', fill: C.mute }));
  const flows = [
    ['IN · novel', 'Se registers the room', 132, 576, true],
    ['IN · referential', 'Ni matches it to precedent', 96, 606, true],
    ['OUT · visible', 'Fe emits — inferior, so little', 44, 640, false],
    ['OUT · internal', 'Ti concludes, silently', 158, 670, false],
  ];
  flows.forEach(([lab, note, w, y, isIn]) => {
    if (isIn) {
      g.push(R(mid - w, y, w, 18, { fill: C.f4, stroke: C.rule2 }));
      g.push(P(`M${mid - w - 8} ${y + 9} l${w * 0.0 + 6} 0`, { stroke: C.ink, sw: 1.4, marker: 'arw' }));
      g.push(T(mid - w - 14, y + 13, lab, { size: 9, w: 700, anchor: 'end' }));
      g.push(T(mid + 10, y + 13, note, { size: 9, fill: C.mute }));
    } else {
      g.push(R(mid, y, w, 18, { fill: 'url(#pFore)', stroke: C.rule2 }));
      g.push(P(`M${mid + w + 2} ${y + 9} l6 0`, { stroke: C.ink, sw: 1.4, marker: 'arw' }));
      g.push(T(mid + w + 14, y + 13, lab, { size: 9, w: 700 }));
      g.push(T(mid - 10, y + 13, note, { size: 9, fill: C.mute, anchor: 'end' }));
    }
  });
  g.push(L(978, 700, 1394, 700, { stroke: C.rule2 }));
  g.push(para(978, 716, 'The asymmetry is the point: an introverted judge concludes far more than it emits, so a psyche can take in a great deal and appear to do almost nothing. Extraverted functions contribute at 1.0 to the OUT total; introverted at 0.35.', 416, { size: 9.5 }));

  /* ---- bottom: what aggregation is not ---- */
  g.push(R(32, 756, 1376, 62, { fill: C.f1, stroke: C.ink, sw: 1.2 }));
  g.push(KICK(46, 776, 'what this view is NOT', { size: 8.5 }));
  g.push(T(46, 798, 'Not a fifth function. Not a sum of the four. Not a separate mode you navigate to — it was on screen the whole time as a band, and it expanded in place. If a user learns only one thing here it should be that a mean would have hidden the Fe spike, and this readout does not.', { size: 11, fill: C.ink2 }));
  g.push(R(32, 828, 1376, 44, { fill: C.f0, stroke: C.rule }));
  g.push(T(46, 855, 'COLLAPSE  ⌃', { size: 10, w: 700, ls: 0.6 }));
  g.push(T(150, 855, 'returns to the S3 band without losing a beat — the aggregate never stops ticking while expanded', { size: 10, fill: C.mute }));

  const calls = [cal(1, 26, 152), cal(2, 40, 292), cal(3, 252, 462), cal(4, 496, 292), cal(5, 496, 530), cal(6, 972, 292), cal(7, 972, 530), cal(8, 1186, 548), cal(9, 42, 762), cal(10, 42, 836), cal(11, 900, 152), cal(12, 934, 316)];
  return g.join('') + calls.join('');
}

export const S6_LEGEND = [
  { n: 1, t: 'The four, collapsed but still live', d: 'Expanding the aggregate does not replace the parts. All four keep a 30px strip carrying glyph, label, rank, a live sparkline, and four numerals. Part and whole are in the same glance, which is the entire reason the aggregate is a band and not a tab.', hover: 'Strips forecast in the same grammar as full rows.', commit: 'Strips step with the aggregate.', state: 'A bypassed or hijacking function is marked on its strip, not only in the aggregate.' },
  { n: 2, t: 'The Vessel figure, reused', d: 'Layout Strategy B, relocated from the main view to here — the one place where gestalt beats precise comparison. Slot radius is rank; conduit weight is involvement.', hover: 'Conduits thicken to the proposed involvement.', commit: 'Geometry animates once.', state: 'Loop draws a heavy circuit between dominant and tertiary with the auxiliary conduit broken; Grip drags the whole figure toward the inferior slot.' },
  { n: 3, t: 'Centre of mass versus geometric centre', d: 'The dashed ring is where the centre would sit if all four were equally involved; the solid disc is where it actually sits, pulled by the involvement ratio. The offset between them is the imbalance, rendered as distance rather than as a number.', hover: 'A ghost disc shows the proposed centre of mass.', commit: 'Disc slides to the new position.', state: 'In Grip the disc leaves the ring entirely and sits over the inferior slot — the clearest single image of a hijack in the product.' },
  { n: 4, t: 'Aggregate trace with constituents behind', d: 'The aggregate is solid 1.6px; the four function traces sit behind at 1px, unlabelled and deliberately hard to read individually. They are there to show that the aggregate is not a copy of any one of them.', hover: 'Only the aggregate forecasts; constituents do not, to keep the reserved band readable.', commit: 'All five step together.', state: 'Under Loop the two looping constituents visibly move in phase while the aggregate oscillates with them.' },
  { n: 5, t: 'The aggregation rules, on screen', d: 'The formulas are shown to the user, not buried in a spec. Each has a one-line justification. This is a teaching tool, so the model is not hidden — and stating it is what makes the peak-weighted stress rule defensible rather than arbitrary.', hover: 'Hovering a rule highlights the readout it produces.', commit: '—', state: 'Loop and Grip apply state multipliers before aggregation, never after.' },
  { n: 6, t: 'The human as four numbers', d: 'Energy, stress, pleasure, evenness. Each carries the value, a meter, the method, and — critically — what the naive method would have said instead. Showing “mean would read 30 and lie” next to the real figure is what stops the aggregate from feeling like an arbitrary number.', hover: 'Forecast deltas appear beside each.', commit: 'All four step.', state: 'Under Grip, stress and evenness move hardest; energy is usually already spent by then.' },
  { n: 7, t: 'Impressions in / expressions out', d: 'A two-sided flow across a vertical line representing the skin. IN splits into novel (Se, Ne) and referential (Ni, Si); OUT splits into visible and internal. Extraverted functions contribute at 1.0 to OUT, introverted at 0.35.', hover: 'Flow widths forecast.', commit: 'Widths animate.', state: 'Grip on an inferior extraverted function produces a large, uncharacteristic OUT flow — the classic “that was not like you” event, drawn.' },
  { n: 8, t: 'The skin line', d: 'The boundary between interior and world. It exists so “introverted” and “extraverted” become spatial facts rather than adjectives: an introverted judge concludes to the left of this line and emits very little to the right of it.', hover: '—', commit: '—', state: '—' },
  { n: 9, t: 'Negative definition panel', d: 'States what the aggregate is not, because the most likely misreading is “a fifth function.” Placed at the bottom where a user lands after reading the numbers.', hover: '—', commit: '—', state: '—' },
  { n: 10, t: 'Collapse control', d: 'Returns to the S3 band. The aggregate keeps ticking while expanded and while collapsed; expansion is a disclosure change, not a mode change, and no state is lost either way.', hover: '—', commit: 'Returns to S3 with the same beat index.', state: '—' },
  { n: 11, t: 'Contribution meters', d: 'Each strip shows what share of the aggregate that function is responsible for right now, so the roll-up is traceable by eye from part to whole without opening D4.', hover: 'Shows proposed contribution.', commit: 'Steps.', state: 'Under Grip one bar dominates and the others visibly starve.' },
  { n: 12, t: 'Reserved band, aggregate scale', d: 'The aggregate seismograph uses the same 72% NOW position and the same 28% reserved forecast well as every per-function trace. One boundary, learned once, applied everywhere.', hover: 'Fills with the aggregate forecast.', commit: 'Translates left and hardens.', state: 'Unchanged — structural.' },
];

/* ============================================================ S7 — Loop */
export function S7() {
  const rows = [
    { fn: 'ti', shape: 'oscillate', stress: 58, pleasure: 0.18, pleasureVal: '18', involve: 0.52, energy: 0.41, emphasise: true, roleBadge: 'LOOP · A', streamText: ['It still does not add up.', 'Run it again from the axiom.', 'The model is nearly closed.', 'One more pass and it resolves.', 'It still does not add up.'] },
    { fn: 'se', shape: 'starved', stress: 12, pleasure: 0.04, pleasureVal: '04', involve: 0.03, energy: 0.69, dim: true, tier: 'BYPASSED', streamText: ['The room is still—'] },
    { fn: 'ni', shape: 'oscillate', stress: 54, pleasure: 0.21, pleasureVal: '21', involve: 0.34, energy: 0.22, emphasise: true, roleBadge: 'LOOP · B', streamText: ['I already know how this ends.', 'Every version ends the same.', 'So the model must be right.', 'Which means I already know—'] },
    { fn: 'fe', shape: 'flat', stress: 47, pleasure: 0.06, pleasureVal: '06', involve: 0.11, energy: 0.28, streamText: ['Nobody has spoken in a while.'] },
  ];
  const cards = [
    { title: 'Ask one precise question', detail: 'Requires reading the room first.', sig: [['ti', 55], ['se', 25], ['ni', 20]], odds: 0.12, h: 84, note: 'Se is bypassed — this action is now 2.4x' },
    { title: 'Say nothing. Log it.', detail: 'The loop’s preferred exit, and not an exit.', sig: [['ti', 45], ['ni', 40], ['se', 15]], odds: 0.71, h: 84 },
    { title: 'Name one thing in the room', detail: 'Out loud. The slide number will do.', sig: [['se', 80], ['ti', 20]], odds: 0.09, h: 84, axis: 'alleviate' },
    { title: 'Stand up. Move.', detail: 'Physical interrupt. Cheap, undignified, works.', sig: [['se', 100]], odds: 0.06, h: 84, axis: 'alleviate' },
    { title: 'Model it one more time', detail: 'It feels like progress. It is the loop.', sig: [['ti', 60], ['ni', 40]], odds: 0.66, h: 84, axis: 'aggravate' },
    { title: 'Predict what they’ll do next', detail: 'Certainty without a single new observation.', sig: [['ni', 70], ['ti', 30]], odds: 0.58, h: 84, axis: 'aggravate' },
  ];
  const g = [ledger({
    rows,
    shares: [0.52, 0.03, 0.34, 0.11],
    cards,
    header: {
      state: 'LOOP  Ti–Ni', chipDark: true, stateSub: 'auxiliary bypassed',
      margins: [['margin to LOOP', 1, 'IN'], ['margin to GRIP', 0.31, '24']],
      beat: 'session beat 19 · loop entered automatically at beat 17',
    },
    rail: { title: 'action set — 4 authored + 2 generated by the loop', sub: '2 alleviate · 2 aggravate · generated cards are marked' },
    band: { state: 'LOOP', shape: 'oscillate', stats: [['energy', '41%', 0.41], ['stress', '63', 0.63], ['pleasure', '9', 0.09], ['evenness', '0.42', 0.42]], inW: 34, outW: 30, ioNote: 'intake has nearly stopped' },
    control: { toggles: [['LOOP  Ti–Ni', true], ['GRIP  Fe', false]], scope: 'session · 3 runs · loop held for 2 beats', buttons: ['FORCE EXIT', 'RESET VESSEL'] },
  })];

  /* the loop circuit, drawn in the left margin: dom → tert → dom, skipping aux */
  g.push(P('M26 200 C6 200 6 540 26 540', { stroke: C.ink, sw: 2.6, marker: 'arw' }));
  g.push(P('M26 250 C10 250 10 500 26 500', { stroke: C.ink, sw: 2.6, dash: '5 3', marker: 'arw' }));
  g.push(R(2, 340, 22, 92, { fill: C.f0, stroke: C.ink, sw: 1 }));
  g.push(T(13, 372, 'T', { size: 9, w: 700, anchor: 'middle' }));
  g.push(T(13, 384, 'i', { size: 9, w: 700, anchor: 'middle' }));
  g.push(T(13, 398, '↕', { size: 10, w: 700, anchor: 'middle' }));
  g.push(T(13, 412, 'N', { size: 9, w: 700, anchor: 'middle' }));
  g.push(T(13, 424, 'i', { size: 9, w: 700, anchor: 'middle' }));
  /* the broken conduit at the auxiliary */
  g.push(P('M18 388 l-12 0', { stroke: C.ink, sw: 1.5 }));
  g.push(R(30, 330, 1000, 116, { fill: 'none', stroke: C.ink, sw: 1.6, dash: '6 4' }));
  g.push(R(400, 322, 226, 17, { fill: C.dark, stroke: null }));
  g.push(T(513, 335, 'AUXILIARY BYPASSED — Se IS NOT CONSULTED', { size: 9, w: 700, ls: 0.6, fill: '#fff', anchor: 'middle' }));

  const calls = [
    cal(1, 990, 18), cal(2, 13, 300), cal(3, 640, 330), cal(4, 200, 366), cal(5, 556, 380),
    cal(6, 1083, 190), cal(7, 1116, 112), cal(8, 1398, 420), cal(9, 1398, 596), cal(10, 46, 716),
    cal(11, 46, 806), cal(12, 96, 290), cal(13, 200, 172), cal(14, 200, 540),
  ];
  return g.join('') + calls.join('');
}

export const S7_LEGEND = [
  { n: 1, t: 'State chip: LOOP, and the margin that is now live', d: 'The chip inverts to solid. The distance-to-Loop margin reads IN and stops forecasting; distance-to-Grip becomes the only live margin, at 24 points. A loop is not an end state — it is a shorter road to grip, and the header says so.', hover: 'Only the grip margin forecasts.', commit: 'Grip margin steps; crossing it transitions to S8 immediately.', state: 'Manual entry tags the chip MANUAL and disables automatic exit.' },
  { n: 2, t: 'The loop circuit, drawn', d: 'A physical conduit in the left margin running dominant → tertiary → dominant, bowing outward past the auxiliary row, with the auxiliary’s tap visibly broken. The loop is a shape, not a badge. It is drawn outside the rows so it cannot be mistaken for a per-row readout.', hover: 'Unchanged by hover.', commit: 'Circulates one step per beat.', state: 'This element exists only in Loop.' },
  { n: 3, t: 'Bypass banner over the auxiliary row', d: 'The auxiliary is not merely quiet — it is not consulted. The banner states that in words, over a dashed exclusion frame around the whole row, because a greyed row alone reads as “no data” rather than “deliberately skipped.”', hover: 'The auxiliary shows “would not be consulted” instead of a projection.', commit: 'Auxiliary takes no cost and gains no pleasure; its stress does not decay either.', state: 'Removed on exit; the auxiliary resumes with its carried stress intact.' },
  { n: 4, t: 'The bypassed function’s rewritten readouts', d: 'Every one of its five readouts is rewritten, not dimmed: the stream stalls mid-sentence and stays stalled; the trace flatlines slightly below baseline (starved, not calm); pleasure collapses; share drops to 3%; capacity stops being spent. A starved function is cheap and useless at the same time, and the row must show both.', hover: 'No forecast; the delta gutter reads “not consulted”.', commit: 'No beat contribution from this row.', state: 'This is the definition of the state, expressed as data.' },
  { n: 5, t: 'Self-reinforcing oscillation', d: 'The two looping functions trace a regular, in-phase oscillation with a rising envelope — visually distinct from the irregular jitter of a balanced trace. Regularity is the tell: a loop feels like progress because it is periodic, and periodicity is exactly what the eye reads as rhythm rather than as escalation.', hover: 'Forecast extends the same period rather than damping it.', commit: 'Amplitude grows each beat the loop is held.', state: 'Exiting damps the oscillation over three beats rather than cutting it.' },
  { n: 6, t: 'Involvement spine under Loop', d: 'The auxiliary segment collapses to a 3% sliver and the dominant plus tertiary take 86% between them. The sliver is deliberately still drawn and still labelled — a zero-height segment would read as “removed from the stack,” which is false and would teach the wrong thing.', hover: 'Proposed boundaries shown as usual.', commit: 'Renormalises to 100%.', state: 'The tertiary segment overrunning its row is the marker that the third function is doing second-function work.' },
  { n: 7, t: 'Generated actions appended to the rail', d: 'Four authored cards plus two generated by the state. Generated cards are derived from templates, not hand-written per scenario: alleviate cards are low-intensity actions dominated by the bypassed function; aggravate cards are high-intensity actions dominated by the looping pair.', hover: 'Identical hover mechanics to authored cards.', commit: 'Identical; the receipt notes the card was state-generated.', state: 'They disappear on exit.' },
  { n: 8, t: 'Alleviate cards', d: 'Marked with an outlined tag and a plus mark. They route work to the bypassed auxiliary, which is the only thing that ends a loop. They are deliberately unglamorous — “stand up, move” — and their likelihood is low, because the psyche does not want to do them.', hover: 'Forecast shows the auxiliary’s share rising and the dominant’s falling.', commit: 'Raises auxiliary involvement; if it clears the exit threshold the state ends.', state: 'Only generated while the state is active.' },
  { n: 9, t: 'Aggravate cards', d: 'Marked with a filled tag and a minus mark, and — importantly — phrased attractively and given high likelihood. An aggravating action must feel like the obvious next move, because that is the mechanic being taught. Its forecast shows high short-term pleasure alongside high stress.', hover: 'Forecast shows the pleasure spike that makes the loop self-sustaining.', commit: 'Deepens the loop and moves the grip margin down.', state: 'Only generated while the state is active.' },
  { n: 10, t: 'Aggregate under Loop', d: 'Evenness falls to 0.42 and the IN flow nearly stops while OUT continues — the whole-person signature of a loop is a psyche that is still producing but has stopped taking anything in. That single asymmetry is more legible here than in any per-function row.', hover: 'Aggregate forecasts normally.', commit: 'Steps.', state: 'This band is the best place to see why a loop ends in a grip.' },
  { n: 11, t: 'Force exit', d: 'An explicit escape that is not an action card. It ends the state without a beat and without a cost, and it is labelled as an instructor control so it is never confused with the alleviate cards, which cost real energy.', hover: 'Explains that a forced exit teaches nothing about how loops actually end.', commit: 'State returns to Strained, not to Balanced.', state: 'Available in Loop and Grip.' },
  { n: 12, t: 'Fidelity under Loop', d: 'The tertiary is promoted to MID and the auxiliary demoted to BYPASSED — a fifth tier that exists only in this state and that renders the row’s components as present-but-inert rather than absent.', hover: '—', commit: '—', state: 'Reverts on exit.' },
  { n: 13, t: 'Dominant stream under Loop', d: 'The dominant’s five lines are rewritten to circle: the last line is a near-repeat of the first. The repetition is the content. Nothing about the layout changes — only the text — which is what makes the state feel like the same psyche behaving differently rather than a different screen.', hover: 'Projection is also circular.', commit: 'Promoted normally.', state: 'Text corpus is keyed by state, so this is authored, not generated.' },
  { n: 14, t: 'Inferior under Loop', d: 'The inferior is not the story here, and the layout says so — it keeps its resting tier while stress climbs quietly underneath. This is the setup for S8: a loop that is not exited feeds the grip margin, and the inferior is where that bill lands.', hover: 'Normal.', commit: 'Normal.', state: 'Crossing the grip threshold from here is the most common route into S8.' },
];

/* ============================================================ S8 — Grip */
export function S8() {
  const rows = [
    { fn: 'ti', shape: 'flat', stress: 71, pleasure: 0.03, pleasureVal: '03', involve: 0.14, energy: 0.06, tier: 'MID', monoLines: 2, seismoH: 40, streamText: ['I cannot get a purchase on this.'] },
    { fn: 'se', shape: 'flat', stress: 40, pleasure: 0.05, pleasureVal: '05', involve: 0.16, energy: 0.44, tier: 'LOW', monoLines: 2, seismoH: 58, streamText: ['Too loud. Too bright.'] },
    { fn: 'ni', shape: 'high', stress: 55, pleasure: 0.04, pleasureVal: '04', involve: 0.12, energy: 0.14, tier: 'LOW', monoLines: 2, seismoH: 44, streamText: ['It was always going to be like this.'] },
    {
      fn: 'fe', shape: 'high', stress: 92, pleasure: 0.02, pleasureVal: '02', involve: 0.58, energy: 0.04, cost: 0.31,
      overlay: 'pGrip', tier: 'FULL', glyphSize: 32, monoLines: 5, seismoH: 104, emphasise: true, roleBadge: 'HIJACK',
      streamText: ['Nobody in this room respects me.', 'They have all decided, together.', 'Say it. Say all of it, now.', 'I do not care how it lands.', 'Nobody in this room respects me.'],
    },
  ];
  const cards = [
    { title: 'Say nothing. Log it.', detail: 'No longer available at its old price.', sig: [['ti', 45], ['ni', 40], ['se', 15]], odds: 0.08, h: 84, note: 'Ti at capacity 6 — this action borrows' },
    { title: 'Correct the record — now', detail: 'It will not come out the way you mean it.', sig: [['te', 50], ['se', 30], ['fe', 20]], odds: 0.14, h: 84 },
    { title: 'Say the whole thing. All of it.', detail: 'Every grievance, in order, to nine people.', sig: [['fe', 90], ['se', 10]], odds: 0.62, h: 84, axis: 'aggravate' },
    { title: 'Demand they acknowledge you', detail: 'Out loud, now, in front of everyone.', sig: [['fe', 80], ['ni', 20]], odds: 0.55, h: 84, axis: 'aggravate' },
    { title: 'Leave the room. No explanation.', detail: 'Ugly, and it stops the spend.', sig: [['se', 70], ['ti', 30]], odds: 0.21, h: 84, axis: 'alleviate' },
    { title: 'One concrete fact, out loud', detail: 'Not a feeling. A slide number.', sig: [['ti', 50], ['se', 50]], odds: 0.11, h: 84, axis: 'alleviate' },
  ];
  const g = [ledger({
    rows,
    heights: [100, 156, 122, 186],
    shares: [0.14, 0.16, 0.12, 0.58],
    cards,
    headerFill: C.f2,
    header: {
      state: 'GRIP  Fe', chipDark: true, stateSub: 'inferior hijack · in debt',
      margins: [['margin to LOOP', 1, 'n/a'], ['margin to GRIP', 1, 'IN']],
      beat: 'session beat 24 · entered from Loop at beat 22 · 2 functions in debt',
    },
    rail: { title: 'action set — the deck the grip wants you to see', sub: '2 alleviate · 2 aggravate · the aggravating ones look best' },
    band: { state: 'GRIP', shape: 'high', stats: [['energy', '12%', 0.12], ['stress', '84', 0.84], ['pleasure', '4', 0.04], ['evenness', '0.31', 0.31]], inW: 26, outW: 132, ioNote: 'large, uncharacteristic output' },
    control: { toggles: [['LOOP  Ti–Ni', false], ['GRIP  Fe', true]], scope: 'session · 3 runs · grip held for 2 beats · debt 38', buttons: ['FORCE EXIT', 'RESET VESSEL'] },
  })];

  /* the height-swap annotation */
  g.push(R(2, 120, 22, 100, { fill: C.f1, stroke: C.rule }));
  g.push(T(13, 158, 'D', { size: 8.5, w: 700, anchor: 'middle', fill: C.mute }));
  g.push(T(13, 170, 'O', { size: 8.5, w: 700, anchor: 'middle', fill: C.mute }));
  g.push(T(13, 182, 'M', { size: 8.5, w: 700, anchor: 'middle', fill: C.mute }));
  g.push(R(2, 510, 22, 186, { fill: C.dark, stroke: null }));
  g.push(T(13, 590, 'I', { size: 9, w: 700, anchor: 'middle', fill: '#fff' }));
  g.push(T(13, 602, 'N', { size: 9, w: 700, anchor: 'middle', fill: '#fff' }));
  g.push(T(13, 614, 'F', { size: 9, w: 700, anchor: 'middle', fill: '#fff' }));
  g.push(P('M13 240 l0 250', { stroke: C.ink, sw: 2, dash: '5 4', marker: 'arw' }));

  const calls = [
    cal(1, 990, 18), cal(2, 13, 232), cal(3, 200, 560), cal(4, 152, 588), cal(5, 556, 640),
    cal(6, 1083, 500), cal(7, 1398, 512), cal(8, 1398, 260), cal(9, 46, 716), cal(10, 46, 806),
    cal(11, 96, 686), cal(12, 848, 630), cal(13, 200, 152), cal(14, 1116, 112),
  ];
  return g.join('') + calls.join('');
}

export const S8_LEGEND = [
  { n: 1, t: 'State chip: GRIP, both margins spent', d: 'Distance-to-Loop reads n/a (a grip supersedes it) and distance-to-Grip reads IN. The header also declares the debt count, because grip is usually entered from debt rather than from stress alone.', hover: 'Neither margin forecasts; the header instead forecasts recovery distance.', commit: 'Steps toward or away from the recovery threshold.', state: 'Manual entry is tagged MANUAL and never auto-exits.' },
  { n: 2, t: 'The height swap — the hierarchy overthrown', d: 'The dominant and inferior rows exchange their height allocations: the inferior gets 186px, the dominant drops to 100. Vertical order and rank labels do not move, so the labels end up plainly out of order with the sizes. That mismatch is the point — the stack has not been reordered, it has been overpowered.', hover: 'Layout does not move on hover; heights change only on state transition.', commit: '—', state: 'Reverts over the first two beats of Recovery, not instantly.' },
  { n: 3, t: 'The inferior at FULL fidelity', d: 'Fe is promoted to five stream lines, a 104px seismograph, labelled meters, and a 32px glyph — the only time an inferior glyph grows. Every component the dominant had at rest is now here, which is what makes the promotion feel like a seizure rather than a highlight.', hover: 'Full forecast, as any FULL row.', commit: 'Normal.', state: 'This is the definition of the state expressed as fidelity.' },
  { n: 4, t: 'Inferior glyph at 32px', d: 'The single exception to “the glyph never changes size.” It grows because the function has been promoted by force, and the growth is a readout, not decoration. Everywhere else in the product the glyph is fixed at its rank size.', hover: 'Inert.', commit: 'Unchanged.', state: 'Returns to 22px on exit.' },
  { n: 5, t: 'The inferior’s rewritten voice', d: 'Register changes completely: absolutist, personal, repetitive, and crude compared with the same function at rest. The last line repeats the first, as in Loop, but the content is accusation rather than analysis. Authored per (function, state), never generated.', hover: 'Projection is in the same seized register.', commit: 'Promoted.', state: 'Reverts to the resting corpus on exit.' },
  { n: 6, t: 'Spine: the inferior takes 58%', d: 'The inferior’s segment overruns even its newly doubled row, and the dominant’s collapses to 14%. This is the readout that answers “who is running this?” with the most alarming possible answer, and it does so without a single word.', hover: 'Proposed boundaries still shown.', commit: 'Renormalises.', state: 'Recovery is visible here first — the segment shrinks before the stream calms down.' },
  { n: 7, t: 'Aggravate cards, made attractive', d: 'The two highest-likelihood cards on the deck are the two that deepen the grip, and they are written to sound like relief. This is deliberate: if the destructive option looked destructive, the mechanic would teach nothing. The forecast is where the truth is — high immediate pleasure on Fe, catastrophic energy and stress everywhere else.', hover: 'Forecast exposes the trade the card’s wording conceals.', commit: 'Deepens the grip and pushes further into debt.', state: 'Generated only while the state is active.' },
  { n: 8, t: 'Alleviate cards, made unappealing', d: '“Leave the room. No explanation.” is ugly, socially costly, and it works. Alleviate cards route work back to the dominant and auxiliary at low intensity. Their likelihood is low because the psyche in this state does not want them, and the interface does not pretend otherwise.', hover: 'Forecast shows stress falling and the spine rebalancing.', commit: 'If aggregate stress falls below the recovery threshold, the state exits to Recovery.', state: 'Generated only while the state is active.' },
  { n: 9, t: 'Aggregate under Grip — the classic signature', d: 'IN has nearly stopped while OUT is the largest it has been all session. A psyche taking almost nothing in and emitting a great deal, from its weakest function. That is the “that was not like you” event, drawn as two bars.', hover: 'Normal.', commit: 'Steps.', state: 'Energy at 12% with debt is the reason recovery takes beats rather than a click.' },
  { n: 10, t: 'Debt reported in the control bar', d: 'Total debt across the vessel, carried at session level. Debt is not a block — every action remains available — but it applies a per-beat stress penalty until repaid, which is how the model says “anything is doable, the bill varies.”', hover: '—', commit: 'Debt grows or shrinks with each commit.', state: 'Recovery cannot complete while debt is outstanding.' },
  { n: 11, t: 'Dominant demoted to MID', d: 'Two stream lines, a 40px trace, unlabelled meters, capacity at 6. The function the user built the type around is now the quietest thing on the screen. Demotion is done by removing components, exactly as the fidelity rule requires.', hover: 'Still forecasts, at MID.', commit: 'Normal.', state: 'Restored first during Recovery.' },
  { n: 12, t: 'Capacity in debt', d: 'The dominant is at 6 and the inferior at 4 with a hovered cost of 31 — the hatched overflow crosses zero and renders as DEBT. Two functions in debt simultaneously is the condition that makes Recovery slow.', hover: 'Overflow shown before commitment.', commit: 'Debt persists across scenario runs.', state: 'Debt is the primary entry condition for Grip, ahead of raw stress.' },
  { n: 13, t: 'What is NOT rewritten', d: 'Column positions, the NOW rule at 72%, the reserved forecast band, the order of the scalar cluster, and the spine’s meaning are all identical to S3. A state changes values, text, fidelity, and two row heights — never the grammar. A user who learned S3 can read S8 without relearning anything.', hover: 'Identical mechanics.', commit: 'Identical mechanics.', state: '—' },
  { n: 14, t: 'Deck framing', d: 'The rail header names what is happening — “the deck the grip wants you to see” — because the ordering and likelihoods on this screen are themselves a simulation output, not a neutral menu. Saying so is the difference between teaching the mechanic and merely performing it.', hover: '—', commit: '—', state: 'Only present in Loop and Grip.' },
];

/* ============================================================ S9 — Resolution */
export function S9() {
  const g = [];
  g.push(R(16, 14, 1408, 872, { fill: C.f0, stroke: C.ink, sw: 2.5, r: 4 }));
  g.push(R(16, 14, 1408, 108, { fill: C.f1, stroke: C.ink, sw: 1.2 }));
  g.push(KICK(34, 38, 'the credit thief · resolved · session beat 20', { size: 8.5 }));
  g.push(T(34, 66, 'You corrected the record — now, with evidence.', { size: 22, w: 700 }));
  g.push(para(34, 82, 'The room reorganizes around the correction. It lands, and it is cold. Two people message you afterwards; neither is your manager.', 900, { size: 11.5 }));
  g.push(R(1008, 30, 400, 76, { fill: C.f0, stroke: C.ink, sw: 1.6 }));
  g.push(KICK(1022, 50, 'state transition', { size: 8 }));
  g.push(T(1022, 76, 'BALANCED', { size: 15, w: 700 }));
  g.push(P('M1108 71 l22 0', { stroke: C.ink, sw: 1.8, marker: 'arw' }));
  g.push(T(1140, 76, 'STRAINED', { size: 15, w: 700 }));
  g.push(T(1022, 94, 'aggregate stress 41 → 58 · crossed the 55 threshold', { size: 9, mono: true, fill: C.mute }));

  /* WHAT CHANGED */
  g.push(KICK(32, 148, 'a · what changed — before → after, per function', { size: 9 }));
  const changed = [
    { fn: 'ti', rank: 'DOM', s: [26, 40], p: [34, 52], i: [42, 55], e: [78, 50], note: 'absorbed the routed Te work; did it in Ti’s manner — checkable, cold' },
    { fn: 'se', rank: 'AUX', s: [19, 28], p: [28, 41], i: [22, 30], e: [71, 49], note: 'took the timing decision; the pause was the window and it used it' },
    { fn: 'ni', rank: 'TERT', s: [31, 25], p: [22, 18], i: [24, 11], e: [46, 40], note: 'stood down — its forecast was already correct, so it cost little' },
    { fn: 'fe', rank: 'INF', s: [44, 65], p: [10, 5], i: [12, 4], e: [29, 5], note: 'paid for the room. Nine people, tense-polite, and no capacity to hold it' },
  ];
  changed.forEach((c2, i) => {
    const y = 160 + i * 104;
    g.push(R(32, y, 668, 96, { fill: i === 3 ? C.f2 : C.f0, stroke: i === 3 ? C.ink : C.rule, sw: i === 3 ? 1.6 : 1 }));
    g.push(glyph(c2.fn, 44, y + 12, 24, {}));
    g.push(T(44, y + 54, FNS[c2.fn].label, { size: 15, w: 700 }));
    g.push(T(44, y + 66, c2.rank, { size: 7.5, w: 700, ls: 0.5, fill: C.mute }));
    const bars = [['stress', c2.s, false], ['pleasure', c2.p, false], ['share', c2.i, true], ['capacity', c2.e, false]];
    bars.forEach(([lab, v, pct], j) => {
      const bx = 92 + j * 152;
      g.push(KICK(bx, y + 20, lab, { size: 7.5 }));
      g.push(meter(bx, y + 26, 96, { v: v[0] / 100, h: 6 }));
      g.push(meter(bx, y + 38, 96, { v: v[1] / 100, h: 9, fill: C.ink }));
      g.push(T(bx + 102, y + 32, String(v[0]) + (pct ? '%' : ''), { size: 9, mono: true, fill: C.mute }));
      g.push(T(bx + 102, y + 47, String(v[1]) + (pct ? '%' : ''), { size: 11, mono: true, w: 700 }));
      const d = v[1] - v[0];
      g.push(T(bx, y + 62, `${d >= 0 ? '+' : '−'}${Math.abs(d)}`, { size: 11, mono: true, w: 700 }));
    });
    g.push(para(92, y + 78, c2.note, 580, { size: 9.5, fill: C.mute }));
  });
  g.push(T(32, 588, 'thin bar = before · thick bar = after. Direction is stated with an explicit sign, never implied by bar direction alone.', { size: 9.5, fill: C.faint }));

  /* WHAT IT COST */
  g.push(KICK(724, 148, 'b · what it cost — the itemised bill', { size: 9 }));
  g.push(R(720, 160, 396, 412, { fill: C.f1, stroke: C.ink, sw: 1.4 }));
  const bill = [
    ['base cost', 'intensity 0.70 × 100', '70.0', false],
    ['Ti · share 0.50 × rank 0.55', 'dominant machinery is cheap', '19.3', false],
    ['Ti · gate 1.10', 'contradiction — costly to hold', '+1.9', false],
    ['Ti · routing 1.35', 'Te work translated into Ti', '+7.4', true],
    ['Se · share 0.30 × rank 0.75', 'auxiliary, and it was fed', '15.8', false],
    ['Se · gate 0.90', 'a live room is Se’s food', '−1.6', false],
    ['Fe · share 0.20 × rank 1.90', 'inferior machinery is expensive', '26.6', true],
    ['Fe · gate 1.20', 'nine people is a full room', '+5.3', true],
    ['relation · serves fi.fairness', 'stress multiplier 0.45 applied', '−8.1', false],
  ];
  let by = 182;
  bill.forEach(([lab, note, val, heavy]) => {
    g.push(T(734, by, lab, { size: 10, w: heavy ? 700 : 400 }));
    g.push(T(734, by + 12, note, { size: 8.5, fill: C.mute }));
    g.push(T(1102, by, val, { size: 11.5, mono: true, w: heavy ? 700 : 600, anchor: 'end' }));
    by += 30;
  });
  g.push(L(734, by - 6, 1102, by - 6, { stroke: C.ink, sw: 1.2 }));
  const totals = [['ENERGY SPENT', '66', 'of 275 reservoir'], ['STRESS ADDED', '+17', 'aggregate, peak-weighted'], ['PLEASURE', '+9', 'after a 0.31 conflict discount'], ['DEBT INCURRED', '0', 'no function went below zero']];
  totals.forEach((t, i) => {
    const ty = by + 12 + i * 40;
    g.push(KICK(734, ty, t[0], { size: 8 }));
    g.push(T(734, ty + 24, t[1], { size: 22, w: 700, mono: true }));
    g.push(T(800, ty + 24, t[2], { size: 9, fill: C.mute }));
  });

  /* WHAT COMES NEXT */
  g.push(KICK(1140, 148, 'c · what comes next', { size: 9 }));
  g.push(R(1136, 160, 272, 130, { fill: C.f0, stroke: C.ink, sw: 1.4 }));
  g.push(KICK(1150, 180, 'you are now closer to', { size: 8 }));
  g.push(T(1150, 204, 'LOOP', { size: 14, w: 700 }));
  g.push(meter(1150, 212, 244, { v: 0.74, h: 9 }));
  g.push(T(1150, 232, '18 points of margin left (was 31)', { size: 9, mono: true, fill: C.mute }));
  g.push(T(1150, 254, 'GRIP', { size: 14, w: 700 }));
  g.push(meter(1150, 262, 244, { v: 0.52, h: 9 }));
  g.push(T(1150, 282, '41 points of margin left (was 58)', { size: 9, mono: true, fill: C.mute }));

  const nexts = [
    ['RUN THIS AGAIN ON ANOTHER PSYCHE', 'Same scenario, same action, different stack. The counterfactual below is the whole pedagogical payload.', true],
    ['NEXT SCENARIO', 'This vessel carries its wear forward. It will not enter fresh.', false],
    ['RECOVER', 'Spend beats doing nothing. Stress decays; capacity returns slowly; debt does not clear itself.', false],
    ['RESET THE VESSEL', 'Discard session history and start from full capacity.', false],
  ];
  nexts.forEach((n, i) => {
    const y = 306 + i * 68;
    g.push(R(1136, y, 272, 60, { fill: n[2] ? C.dark : C.f0, stroke: C.ink, sw: n[2] ? 0 : 1, r: 3 }));
    g.push(T(1150, y + 22, n[0], { size: 10, w: 700, ls: 0.4, fill: n[2] ? '#fff' : C.ink }));
    g.push(para(1150, y + 34, n[1], 244, { size: 8.8, fill: n[2] ? '#fff' : C.mute }));
  });

  /* COUNTERFACTUAL */
  g.push(L(32, 604, 1408, 604, { stroke: C.ink, sw: 1.2 }));
  g.push(KICK(32, 624, 'd · the counterfactual — the same action, billed to a different psyche', { size: 9 }));
  g.push(T(32, 646, 'Anything is doable. The bill varies. The bill predicts behaviour.', { size: 13, w: 700 }));
  const cf = [
    { code: 'ISTP', stack: 'Ti Se Ni Fe', energy: 66, stress: 17, pleasure: 9, odds: 34, who: 'Fe (inferior) pays 32 of the 66', me: true },
    { code: 'ENTJ', stack: 'Te Ni Se Fi', energy: 38, stress: 6, pleasure: 31, odds: 79, who: 'Te (dominant) pays 21 of the 38', me: false },
    { code: 'INFP', stack: 'Fi Ne Si Te', energy: 91, stress: 34, pleasure: 4, odds: 11, who: 'Te (inferior) pays 44 of the 91', me: false },
    { code: 'ESFJ', stack: 'Fe Si Ne Ti', energy: 74, stress: 29, pleasure: 6, odds: 17, who: 'Fe pays 30 — but to keep the room, not to correct it', me: false },
  ];
  cf.forEach((c2, i) => {
    const x = 32 + i * 346;
    g.push(R(x, 660, 330, 158, { fill: c2.me ? C.f2 : C.f0, stroke: c2.me ? C.ink : C.rule, sw: c2.me ? 1.8 : 1 }));
    g.push(T(x + 14, 684, c2.code, { size: 16, w: 700 }));
    g.push(T(x + 66, 684, c2.stack, { size: 10, mono: true, fill: C.mute }));
    if (c2.me) { g.push(R(x + 250, 670, 66, 16, { fill: C.dark, stroke: null, r: 8 })); g.push(T(x + 283, 682, 'YOURS', { size: 8, w: 700, ls: 0.5, fill: '#fff', anchor: 'middle' })); }
    const ms = [['energy spent', c2.energy, 100], ['stress added', c2.stress, 50], ['pleasure', c2.pleasure, 50], ['likelihood unforced', c2.odds, 100]];
    ms.forEach(([lab, v, max], j) => {
      const my = 700 + j * 26;
      g.push(T(x + 14, my + 8, lab, { size: 8.5, fill: C.mute }));
      g.push(meter(x + 130, my, 140, { v: v / max, h: 7 }));
      g.push(T(x + 316, my + 8, String(v), { size: 10.5, mono: true, w: 700, anchor: 'end' }));
    });
    g.push(para(x + 14, 812, c2.who, 302, { size: 9, fill: C.ink2 }));
  });
  g.push(T(32, 860, 'Every one of the four performed the identical action. None of them was blocked. What differed was who paid, how much, and how likely they were to have chosen it unforced.', { size: 11.5, fill: C.ink2 }));

  const calls = [cal(1, 26, 68), cal(2, 1002, 34), cal(3, 26, 152), cal(4, 714, 152), cal(5, 1130, 152), cal(6, 1130, 300), cal(7, 26, 620), cal(8, 372, 668), cal(9, 714, 480), cal(10, 26, 848), cal(11, 700, 264), cal(12, 1130, 372)];
  return g.join('') + calls.join('');
}

export const S9_LEGEND = [
  { n: 1, t: 'The outcome, in the scenario’s own voice', d: 'One sentence of authored consequence, plus a second sentence of aftermath. It is prose, not a metric, because the user needs to know what happened in the world before they read what it cost inside.', hover: '—', commit: 'Written once at commit and frozen.', state: 'Loop and Grip have their own outcome variants for the same action.' },
  { n: 2, t: 'State transition, named and justified', d: 'The transition is stated with the number that caused it: aggregate stress 41 → 58, crossing the 55 threshold. A state change never happens without the screen saying which quantity crossed which line.', hover: '—', commit: 'Fires here, after the receipt is computed.', state: 'A transition into Loop or Grip routes the “next” panel to the alleviate/aggravate deck instead of the normal one.' },
  { n: 3, t: 'What changed — before over after', d: 'Four functions, four readouts each, thin bar for before and thick bar for after, with an explicit signed delta. This is the only screen that shows before and after simultaneously; everywhere else, before is history and after is now.', hover: 'Hovering a function opens its full Reaction Window (S5) inline.', commit: '—', state: 'Under Loop the bypassed function shows a flat before/after pair and a “not consulted” note.' },
  { n: 4, t: 'The itemised bill', d: 'Every multiplier that touched the number, in the order the engine applied them: base cost, then per-function share × rank, then the scenario’s context gate, then routing surcharge, then the relation multiplier. Nothing is aggregated before the user has seen its parts.', hover: 'Hovering a line highlights the function row it belongs to.', commit: '—', state: 'Loop and Grip multipliers appear as additional lines, tagged with the state that caused them.' },
  { n: 5, t: 'Margins after the fact', d: 'Both distance-to-break meters restated with their before values in parentheses. This is where an action that felt free reveals that it moved the psyche 13 points closer to a loop.', hover: '—', commit: '—', state: 'A crossed margin reads IN and the panel routes to the state’s own resolution copy.' },
  { n: 6, t: 'Primary next step — the counterfactual', d: 'The strongest affordance on the screen is “run this again on another psyche,” not “next scenario.” The product’s thesis is comparative: one receipt teaches almost nothing, two receipts for the same action teach the whole model.', hover: 'Previews the type picker with the current scenario and action preserved.', commit: 'Re-runs the identical action on a fresh vessel of the chosen type.', state: 'Available in all states.' },
  { n: 7, t: 'Counterfactual strip', d: 'The same action, priced against four different stacks, with the same four measures in the same positions. Bars are comparable across cards because every card uses an identical scale.', hover: 'Hovering a card expands its own itemised bill in place.', commit: 'Selecting a card re-runs the scenario on that type.', state: 'Counterfactual vessels are always fresh, so the comparison is not contaminated by the current vessel’s wear.' },
  { n: 8, t: 'Who paid', d: 'One line per type naming which function absorbed the cost. This is the sentence most likely to produce the intended realisation: the same visible behaviour was cheap for one psyche and ruinous for another, and the difference was position in the stack.', hover: '—', commit: '—', state: '—' },
  { n: 9, t: 'Totals block', d: 'Four figures: energy spent against the whole reservoir, stress added after peak-weighted aggregation, pleasure after its conflict discount, and debt. Each names its method inline so the user is never asked to trust an unexplained number.', hover: '—', commit: '—', state: 'Debt is the figure that most often explains why the next run behaves badly.' },
  { n: 10, t: 'The thesis, stated once', d: 'A single closing line. It appears only here, at the end of a run, when the user has just watched the mechanism produce the evidence for it.', hover: '—', commit: '—', state: '—' },
  { n: 11, t: 'Routing surcharge itemised', d: 'The Te → Ti translation appears as its own line with its own multiplier, not folded into the base. A user must be able to see that demanding a function you do not carry is not impossible, merely surcharged, and that the work still got done in a different manner.', hover: '—', commit: '—', state: 'Unchanged.' },
  { n: 12, t: 'Recover as an explicit option', d: 'Doing nothing is offered as a real, selectable move with its own stated mechanics — stress decays, capacity returns slowly, debt does not clear itself. Recovery is a state in the machine (D3), not an absence of activity.', hover: 'Previews how many beats recovery would take at the current decay rates.', commit: 'Advances beats without an action; each beat applies decay only.', state: 'From Grip, this is often the only affordable path.' },
];

/* ============================================================ S10 — narrow */
export const S10_W = 390;
export function S10() {
  const g = [];
  const FH = 780;
  const frames = [
    { label: 'A · resting — scroll top', y: 22 },
    { label: 'B · press-and-hold on an action = forecast', y: 22 + FH + 38 },
    { label: 'C · whole-human expanded (sheet)', y: 22 + (FH + 38) * 2 },
  ];

  frames.forEach((f, fi) => {
    const Y = f.y;
    g.push(T(2, Y - 8, f.label, { size: 11, w: 700 }));
    g.push(R(1, Y + 1, 388, FH - 2, { fill: C.f0, stroke: C.ink, sw: 2 }));
    g.push(R(0, Y, 390, 22, { fill: C.f3, stroke: null }));
    g.push(T(8, Y + 15, '9:41', { size: 9, mono: true, w: 700 }));
    g.push(T(382, Y + 15, '390 × 780', { size: 8, mono: true, fill: C.ink2, anchor: 'end' }));

    if (fi < 2) {
      /* sticky header: scenario + state + margins */
      g.push(R(0, Y + 22, 390, 82, { fill: C.f1, stroke: C.rule }));
      g.push(KICK(12, Y + 38, 'scenario', { size: 7.5 }));
      g.push(T(12, Y + 54, 'The Credit Thief', { size: 14, w: 700 }));
      g.push(T(12, Y + 68, 'ISTP · Ti Se Ni Fe', { size: 9, mono: true, fill: C.mute }));
      g.push(R(276, Y + 32, 102, 24, { fill: C.f0, stroke: C.ink, sw: 1.4, r: 3 }));
      g.push(T(327, Y + 48, 'BALANCED', { size: 10, w: 700, ls: 0.6, anchor: 'middle' }));
      g.push(KICK(276, Y + 68, 'loop 31 · grip 58', { size: 7.5 }));
      g.push(meter(276, Y + 74, 48, { v: 0.62, h: 5 }));
      g.push(meter(330, Y + 74, 48, { v: 0.78, h: 5 }));

      /* horizontal involvement spine */
      g.push(KICK(12, Y + 120, 'who is running this', { size: 7.5 }));
      const segs = [['Ti', 0.42], ['Se', 0.22], ['Ni', 0.24], ['Fe', 0.12]];
      let sx = 12;
      segs.forEach(([lab, v], i) => {
        const sw2 = 366 * v;
        g.push(R(sx, Y + 126, sw2, 26, { fill: i % 2 ? C.f2 : C.f4, stroke: C.page, sw: 1 }));
        g.push(T(sx + sw2 / 2, Y + 142, lab, { size: 10, w: 700, anchor: 'middle' }));
        if (sw2 > 60) g.push(T(sx + sw2 / 2, Y + 151, `${Math.round(v * 100)}%`, { size: 7.5, mono: true, anchor: 'middle', fill: C.ink2 }));
        sx += sw2;
      });
      g.push(R(12, Y + 126, 366, 26, { fill: 'none', stroke: C.ink, sw: 1.2 }));

      /* accordion: one expanded, three collapsed */
      const expY = Y + 164;
      g.push(R(12, expY, 366, 232, { fill: C.f1, stroke: C.ink, sw: 1.6 }));
      g.push(glyph('ti', 22, expY + 10, 26, {}));
      g.push(T(56, expY + 30, 'Ti', { size: 22, w: 700 }));
      g.push(T(84, expY + 24, 'DOMINANT', { size: 7.5, w: 700, ls: 0.5, fill: C.mute }));
      g.push(T(84, expY + 34, 'Introverted Thinking', { size: 8.5, fill: C.mute }));
      g.push(R(320, expY + 12, 46, 15, { fill: C.f2, stroke: C.rule2, r: 7 }));
      g.push(T(343, expY + 23, 'FULL', { size: 8, w: 700, anchor: 'middle' }));
      g.push(P(`M354 ${expY + 40} l-8 -6 l-8 6`, { stroke: C.ink, sw: 1.6, cap: 'round' }));
      g.push(KICK(22, expY + 56, 'expression stream', { size: 7.5 }));
      ['The diagram on that slide is mine.', 'They cannot answer a question about it.', 'Credit follows authorship.'].forEach((ln, i) => g.push(T(22, expY + 70 + i * 14, ln, { size: 9.5, fill: i === 2 ? C.ink : C.ink2, op: 0.6 + i * 0.2 })));
      g.push(seismo(22, expY + 118, 346, 60, { shape: 'calm', beats: 14, forecast: fi === 1 ? defaultSeries(6, 'rising') : null }));
      const ms = [['pleasure', 0.34, fi === 1 ? 0.52 : undefined, '34', '+18'], ['share', 0.42, fi === 1 ? 0.55 : undefined, '42%', '+13'], ['capacity', 0.78, undefined, '78', '−28']];
      ms.forEach(([lab, v, fv, val, d], i) => {
        const my = expY + 190 + i * 14;
        g.push(T(22, my + 7, lab, { size: 8, fill: C.mute }));
        if (lab === 'capacity') g.push(capacityMeter(90, my, 160, { remaining: v, cost: fi === 1 ? 0.28 : 0, h: 8 }));
        else g.push(meter(90, my, 160, { v, fv, h: 8 }));
        g.push(T(276, my + 7, val, { size: 9, mono: true, w: 600, anchor: 'end' }));
        if (fi === 1) g.push(T(366, my + 7, d, { size: 10.5, mono: true, w: 700, anchor: 'end' }));
      });

      [['se', 'AUX', 22, '+9'], ['ni', 'TERT', 31, '−6'], ['fe', 'INF', 44, '+21']].forEach(([fn, rank, st, d], i) => {
        const cyy = expY + 240 + i * 44;
        g.push(R(12, cyy, 366, 40, { fill: C.f0, stroke: C.rule }));
        g.push(glyph(fn, 20, cyy + 11, 18, {}));
        g.push(T(44, cyy + 25, FNS[fn].label, { size: 13, w: 700 }));
        g.push(T(68, cyy + 25, rank, { size: 7.5, w: 700, ls: 0.4, fill: C.mute }));
        g.push(seismo(104, cyy + 8, 100, 24, { shape: 'calm', beats: 10, labelReserve: false }));
        g.push(T(214, cyy + 25, `s ${st}`, { size: 9, mono: true }));
        g.push(T(252, cyy + 25, 'p 28', { size: 9, mono: true, fill: C.mute }));
        g.push(T(292, cyy + 25, 'e 71', { size: 9, mono: true, fill: C.mute }));
        if (fi === 1) g.push(T(366, cyy + 25, d, { size: 11, mono: true, w: 700, anchor: 'end' }));
        else g.push(P(`M356 ${cyy + 21} l8 6 l8 -6`, { stroke: C.ink, sw: 1.4, cap: 'round' }));
      });

      /* whole-human dock */
      g.push(R(0, Y + FH - 118, 390, 40, { fill: C.f2, stroke: C.ink, sw: 1.4 }));
      g.push(P(`M12 ${Y + FH - 103} l6 5 l-6 5`, { stroke: C.ink, sw: 1.6, cap: 'round' }));
      g.push(T(26, Y + FH - 94, 'WHOLE HUMAN', { size: 9.5, w: 700, ls: 0.5 }));
      g.push(seismo(126, Y + FH - 112, 90, 28, { shape: 'calm', beats: 10, labelReserve: false }));
      g.push(T(228, Y + FH - 94, 'E 62', { size: 9.5, mono: true, w: 700 }));
      g.push(T(268, Y + FH - 94, 'S 41', { size: 9.5, mono: true, w: 700 }));
      g.push(T(308, Y + FH - 94, 'P 18', { size: 9.5, mono: true, w: 700 }));
      g.push(T(348, Y + FH - 94, 'H .71', { size: 9.5, mono: true, w: 700 }));

      /* action sheet peek */
      g.push(R(0, Y + FH - 78, 390, 78, { fill: C.f0, stroke: C.ink, sw: 2 }));
      g.push(R(175, Y + FH - 72, 40, 4, { fill: C.f5, stroke: null, r: 2 }));
      if (fi === 0) {
        g.push(T(12, Y + FH - 52, 'Correct the record — now', { size: 11.5, w: 700 }));
        g.push(T(12, Y + FH - 40, 'Te 50 · Se 30 · Fe 20  ·  routed Te→Ti +35%', { size: 8.5, mono: true, fill: C.mute }));
        g.push(KICK(12, Y + FH - 26, 'press and hold to forecast · 1 of 5', { size: 7.5 }));
        g.push(meter(12, Y + FH - 20, 300, { v: 0.34, h: 6 }));
        g.push(T(378, Y + FH - 14, '34%', { size: 9, mono: true, w: 700, anchor: 'end' }));
      } else {
        g.push(R(0, Y + FH - 78, 390, 78, { fill: C.f2, stroke: C.ink, sw: 2 }));
        g.push(T(12, Y + FH - 52, 'Correct the record — now', { size: 11.5, w: 700 }));
        g.push(R(12, Y + FH - 44, 250, 16, { fill: 'url(#pFore)', stroke: C.ink, sw: 1, dash: '3 2' }));
        g.push(T(18, Y + FH - 32, 'HOLDING — forecast live · release to cancel', { size: 8.5, w: 700, mono: true }));
        g.push(R(12, Y + FH - 24, 240, 20, { fill: C.dark, stroke: null, r: 2 }));
        g.push(T(132, Y + FH - 10, 'SLIDE UP TO COMMIT  ▲', { size: 9, w: 700, ls: 0.5, fill: '#fff', anchor: 'middle' }));
        g.push(T(378, Y + FH - 10, 'p 34%', { size: 9, mono: true, w: 700, anchor: 'end' }));
      }
    } else {
      /* frame C — whole human expanded as a full sheet */
      g.push(R(0, Y + 22, 390, 44, { fill: C.f1, stroke: C.rule }));
      g.push(P(`M14 ${Y + 44} l-6 -5 l6 -5`, { stroke: C.ink, sw: 1.6, cap: 'round' }));
      g.push(T(30, Y + 48, 'WHOLE HUMAN', { size: 13, w: 700, ls: 0.6 }));
      g.push(T(378, Y + 48, 'BALANCED', { size: 9.5, w: 700, mono: true, anchor: 'end' }));
      g.push(seismo(12, Y + 78, 366, 120, { shape: 'rising', beats: 20 }));
      g.push(T(12, Y + 212, 'aggregate · four constituents behind', { size: 8.5, fill: C.faint }));
      const bigs = [['ENERGY', '62', '% of 275', 0.62], ['STRESS', '48', 'peak-weighted', 0.48], ['PLEASURE', '18', 'conflict −0.22', 0.18], ['EVENNESS', '0.71', 'spread of share', 0.71]];
      bigs.forEach((b, i) => {
        const bx = 12 + (i % 2) * 186, by = Y + 226 + Math.floor(i / 2) * 86;
        g.push(R(bx, by, 180, 78, { fill: C.f1, stroke: C.rule }));
        g.push(KICK(bx + 10, by + 18, b[0], { size: 7.5 }));
        g.push(T(bx + 10, by + 46, b[1], { size: 24, w: 700, mono: true }));
        g.push(meter(bx + 10, by + 54, 160, { v: b[3], h: 6 }));
        g.push(T(bx + 10, by + 70, b[2], { size: 8, fill: C.mute }));
      });
      g.push(KICK(12, Y + 412, 'impressions in · expressions out', { size: 7.5 }));
      const mid = 195;
      g.push(L(mid, Y + 420, mid, Y + 500, { stroke: C.ink, sw: 1.3 }));
      [['Se registers', 82, Y + 428, true], ['Ni matches', 58, Y + 450, true], ['Fe emits', 28, Y + 472, false], ['Ti concludes', 96, Y + 472, false]].forEach(([lab, w, yy, isIn], i) => {
        if (isIn) { g.push(R(mid - w, yy, w, 14, { fill: C.f4, stroke: C.rule2 })); g.push(T(mid - w - 6, yy + 11, lab, { size: 8, anchor: 'end' })); }
        else { g.push(R(mid, yy + (i === 3 ? 22 : 0), w, 14, { fill: 'url(#pFore)', stroke: C.rule2 })); g.push(T(mid + w + 6, yy + 11 + (i === 3 ? 22 : 0), lab, { size: 8 })); }
      });
      g.push(R(12, Y + 526, 366, 148, { fill: C.f1, stroke: C.rule }));
      g.push(KICK(24, Y + 546, 'how four became one', { size: 7.5 }));
      [['ENERGY', 'sum, debt taxed 1.5x'], ['STRESS', '0.6·max + 0.4·weighted mean'], ['PLEASURE', 'weighted mean, conflict-discounted'], ['EVENNESS', 'normalised entropy of the share vector']].forEach((r, i) => {
        g.push(T(24, Y + 566 + i * 26, r[0], { size: 9, w: 700, ls: 0.4 }));
        g.push(T(104, Y + 566 + i * 26, r[1], { size: 9, mono: true, fill: C.ink2 }));
      });
      g.push(R(12, Y + 690, 366, 34, { fill: C.f0, stroke: C.ink, sw: 1.2, r: 3 }));
      g.push(T(195, Y + 711, 'BACK TO THE FOUR  ⌄', { size: 10, w: 700, ls: 0.6, anchor: 'middle' }));
      g.push(T(12, Y + 750, 'The four keep ticking behind this sheet.', { size: 9, fill: C.mute }));
    }
  });

  const F1 = 22, F2 = 22 + 780 + 38, F3 = 22 + (780 + 38) * 2;
  const calls = [
    cal(1, 372, F1 + 140), cal(2, 372, F1 + 186), cal(3, 372, F1 + 420), cal(4, 372, F1 + 686),
    cal(5, 372, F1 + 712), cal(6, 372, F2 + 748), cal(7, 12, F2 + 210), cal(8, 372, F3 + 90), cal(9, 372, F3 + 560),
  ];
  return g.join('') + calls.join('');
}

export const S10_LEGEND = [
  { n: 1, t: 'Involvement spine, rotated', d: 'The one element that must not be cut. At 390px it turns horizontal and docks under the sticky header: still one continuous bar, still four labelled segments, still summing to 100%. Q-A is answered above the fold on a phone, before anything else is read.', hover: 'Not applicable — see callout 6.', commit: 'Segments animate as on desktop.', state: 'Loop collapses a segment to a labelled sliver; Grip inverts the order of magnitude, which is legible even at 26px tall.' },
  { n: 2, t: 'Accordion of four — all live, one at FULL', d: 'Four panels survive as an accordion: exactly one expanded at FULL fidelity, three collapsed to 40px strips that keep glyph, label, rank, a live sparkline, and three numerals. Nothing is removed from the simulation and nothing is shrunk below legibility — the tier rule from S5 does all the work.', hover: 'A collapsed strip still shows its delta during a forecast.', commit: 'All four step; the expanded one shows the full change.', state: 'Grip auto-expands the inferior and collapses the dominant, which is how the state announces itself on a phone.' },
  { n: 3, t: 'Collapsed strips carry deltas', d: 'The reason four panels survive a phone: a collapsed strip does not need five readouts, it needs one signed delta. During a forecast the three collapsed strips each show a single number, which is enough to answer “who pays?” without expanding anything.', hover: 'Delta replaces the chevron.', commit: 'Delta clears.', state: 'A bypassed function shows a dash rather than a zero.' },
  { n: 4, t: 'Whole-Human dock', d: 'A 40px permanent dock above the action sheet carrying the aggregate trace and four single-letter scalars. The aggregate is never more than one tap away and never off screen, preserving the part-and-whole rule that the desktop band exists to serve.', hover: '—', commit: 'Ticks with the rows.', state: 'The dock is where a state change is most visible on a phone, because it never scrolls away.' },
  { n: 5, t: 'Action sheet, peeked', d: 'A bottom sheet showing the top-ranked action, its signature, and its likelihood. Dragging up reveals all five. It occupies the thumb zone and it is the only element that overlaps content.', hover: '—', commit: 'Slide-up-to-commit, which cannot be triggered accidentally by a scroll.', state: 'Generated alleviate/aggravate cards are sorted into the sheet with their tags intact.' },
  { n: 6, t: 'Press-and-hold replaces hover', d: 'The critical adaptation. There is no hover on a touch device, so the forecast is bound to press-and-hold: holding renders every forecast live, releasing cancels and restores the resting screen exactly, and committing requires a deliberate second gesture (slide up). The hover contract — nothing spent, nothing recorded, no beat consumed — is preserved verbatim; only the input changes.', hover: 'Hold to enter the forecast; the card labels itself HOLDING.', commit: 'Slide up while holding.', state: 'Identical in all states.' },
  { n: 7, t: 'Sticky header keeps Q-C above the fold', d: 'Scenario identity, state chip, and both margin meters compress into 82px and stay pinned. Distance-to-break is the one readout that must never require scrolling, on any viewport.', hover: '—', commit: 'Margins step.', state: 'The chip inverts and the crossed margin reads IN.' },
  { n: 8, t: 'Aggregate as a full sheet', d: 'Tapping the dock raises the S6 apparatus as a full-height sheet rather than a route change. The four keep ticking behind it, and dismissing returns to the same beat — expansion is disclosure, not navigation, exactly as on desktop.', hover: '—', commit: '—', state: '—' },
  { n: 9, t: 'The aggregation rules survive the phone', d: 'The four formulas stay on screen at 390px, compressed to one line each. They are the least cuttable content in the product: an unexplained aggregate number is worse than no aggregate number, and a phone user is no less entitled to the model.', hover: '—', commit: '—', state: '—' },
];
