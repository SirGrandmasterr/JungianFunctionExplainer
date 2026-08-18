/* S1–S5 */
import { C, T, R, L, P, CIR, KICK, glyph, FNS, meter, capacityMeter, seismo, defaultSeries, fakeLines, para, cal, page } from './lib.mjs';
import { fnRow, spine, actionCard, wholeBand, envelopeHeader, controlBar, railHeader, ROW_H, COL } from './parts.mjs';

const VP = { w: 1440, h: 900 };

/* ============================================================
   The Ledger body — shared by S3, S4, S7, S8.
   ============================================================ */
export function ledger(cfg) {
  const g = [];
  /* scenario envelope */
  g.push(R(16, 14, 1408, 872, { fill: C.f0, stroke: C.ink, sw: 2.5, r: 4 }));
  g.push(R(16, 14, 1408, 94, { fill: cfg.headerFill || C.f1, stroke: C.ink, sw: 1.2 }));
  g.push(envelopeHeader(16, 14, 1408, 94, cfg.header || {}));

  const heights = cfg.heights || [186, 156, 122, 100];
  const ys = [];
  let yy = 120;
  heights.forEach((h) => { ys.push(yy); yy += h + 4; });
  const ranks = ['dom', 'aux', 'tert', 'inf'];
  cfg.rows.forEach((r, i) => g.push(fnRow(32, ys[i], 1028, { rank: ranks[i], h: heights[i], ...r })));

  /* involvement spine */
  g.push(KICK(1070, 114, 'share', { size: 7.5 }));
  g.push(spine(1070, 120, 26, 576, cfg.shares, {
    labels: cfg.rows.map((r) => FNS[r.fn].label),
    rowHeights: heights,
    forecast: cfg.forecastShares,
  }));
  g.push(T(1083, 706, '100%', { size: 7.5, mono: true, fill: C.faint, anchor: 'middle' }));

  /* action rail */
  g.push(railHeader(1108, 128, 300, cfg.rail || {}));
  let cy = 148;
  cfg.cards.forEach((c) => {
    const ch = c.h || 104;
    g.push(actionCard(1108, cy, 300, ch, c));
    cy += ch + 6;
  });

  g.push(wholeBand(32, 706, 1376, 80, cfg.band || {}));
  g.push(controlBar(32, 796, 1376, 76, cfg.control || {}));
  return g.join('');
}

const BASE_ROWS = [
  { fn: 'ti', stress: 26, shape: 'calm', pleasure: 0.34, pleasureVal: '34', involve: 0.42, energy: 0.78 },
  { fn: 'se', stress: 19, shape: 'calm', pleasure: 0.28, pleasureVal: '28', involve: 0.22, energy: 0.71 },
  { fn: 'ni', stress: 31, shape: 'rising', pleasure: 0.22, pleasureVal: '22', involve: 0.24, energy: 0.46 },
  { fn: 'fe', stress: 44, shape: 'spike', pleasure: 0.10, pleasureVal: '10', involve: 0.12, energy: 0.29 },
];

const BASE_CARDS = [
  { title: 'Correct the record — now', detail: 'Two sentences and a link, into the silence.', sig: [['te', 50], ['se', 30], ['fe', 20]], odds: 0.34, note: 'Te not in stack → routed to Ti (+35% cost)' },
  { title: 'Ask one precise question', detail: 'Make them say the architecture out loud.', sig: [['ti', 55], ['se', 25], ['ni', 20]], odds: 0.41 },
  { title: 'Smooth it; take it up after', detail: 'Let the meeting land, then talk privately.', sig: [['fe', 40], ['ni', 30], ['si', 30]], odds: 0.19, note: 'Si not in stack → routed to Ni (+35% cost)' },
  { title: 'Say nothing. Log it.', detail: 'No reaction. The commit history keeps.', sig: [['ti', 45], ['ni', 40], ['se', 15]], odds: 0.48, note: 'suppression is an action, and it is priced' },
  { title: 'Step out for air', detail: 'Leave the room before deciding anything.', sig: [['se', 60], ['ni', 40]], odds: 0.15 },
];

/* ============================================================ S1 */
export function S1() {
  const g = [];
  /* step header */
  g.push(R(24, 16, 1392, 60, { fill: C.f1, stroke: C.rule }));
  g.push(KICK(40, 34, 'playground · stack assembly', { size: 9 }));
  g.push(T(40, 58, 'Build a psyche', { size: 20, w: 700 }));
  const steps = [['1', 'DOMINANT', '8 options', true, true], ['2', 'AUXILIARY', 'exactly 2 legal', true, false], ['3', 'TERTIARY', 'entailed', false, false], ['4', 'INFERIOR', 'entailed', false, false]];
  let sx = 340;
  steps.forEach(([n, lab, sub, active, done], i) => {
    g.push(R(sx, 26, 218, 40, { fill: done ? C.dark : active ? C.f0 : C.f2, stroke: active || done ? C.ink : C.rule, sw: active ? 1.8 : 1, dash: !active && !done ? '3 3' : null, r: 3 }));
    g.push(T(sx + 14, 44, n, { size: 12, w: 700, fill: done ? '#fff' : active ? C.ink : C.faint }));
    g.push(T(sx + 30, 44, lab, { size: 11.5, w: 700, fill: done ? '#fff' : active ? C.ink : C.faint }));
    g.push(T(sx + 30, 58, sub, { size: 9, fill: done ? '#fff' : C.mute }));
    if (i < 3) g.push(P(`M${sx + 224} 46 l8 0`, { stroke: C.rule, sw: 1.4, marker: 'arw' }));
    sx += 240;
  });

  /* left — the eight */
  g.push(KICK(24, 106, 'the eight — choosing the auxiliary; 6 are now illegal', { size: 9 }));
  const order = ['ne', 'ni', 'se', 'si', 'te', 'ti', 'fe', 'fi'];
  const legal = { se: 1, ni: 1 };
  const taken = { ti: 1 };
  order.forEach((fn, i) => {
    const tx = 24 + (i % 4) * 104, ty = 122 + Math.floor(i / 4) * 122;
    const isLegal = legal[fn], isTaken = taken[fn];
    g.push(R(tx, ty, 96, 110, { fill: isTaken ? C.dark : isLegal ? C.f0 : C.f1, stroke: isTaken || isLegal ? C.ink : C.rule, sw: isLegal ? 2 : 1, r: 3 }));
    if (!isLegal && !isTaken) g.push(R(tx + 1, ty + 1, 94, 108, { fill: 'url(#pDead)', stroke: null }));
    g.push(glyph(fn, tx + 30, ty + 14, 36, { stroke: isTaken ? '#fff' : isLegal ? C.ink : C.faint }));
    g.push(T(tx + 48, ty + 70, FNS[fn].label, { size: 17, w: 700, anchor: 'middle', fill: isTaken ? '#fff' : isLegal ? C.ink : C.faint }));
    g.push(T(tx + 48, ty + 84, FNS[fn].glyph, { size: 7.5, anchor: 'middle', fill: isTaken ? '#fff' : C.faint }));
    g.push(T(tx + 48, ty + 100, isTaken ? 'DOMINANT' : isLegal ? 'LEGAL' : 'ILLEGAL', { size: 8, w: 700, ls: 0.5, anchor: 'middle', fill: isTaken ? '#fff' : isLegal ? C.ink : C.faint }));
  });
  g.push(R(24, 370, 408, 74, { fill: C.f1, stroke: C.rule }));
  g.push(KICK(36, 390, 'why only two', { size: 8 }));
  g.push(para(36, 404, 'Law I — the top two face opposite worlds. Law II — the top two do opposite jobs. Together those leave exactly two legal auxiliaries per dominant. 8 x 2 = 16.', 384, { size: 10 }));

  /* centre — the Vessel figure (Strategy B, relocated here) */
  g.push(KICK(460, 106, 'the vessel — two crossed axes, four slots', { size: 9 }));
  g.push(R(456, 118, 520, 470, { fill: C.f0, stroke: C.rule }));
  const cx = 716, cy = 350;
  g.push(L(cx, 160, cx, 540, { stroke: C.rule2, sw: 1, dash: '4 4' }));
  g.push(L(536, cy, 896, cy, { stroke: C.rule2, sw: 1, dash: '4 4' }));
  g.push(T(cx, 150, 'PERCEPTION AXIS', { size: 8, w: 700, ls: 0.6, fill: C.mute, anchor: 'middle' }));
  g.push(T(902, cy - 6, 'JUDGMENT', { size: 8, w: 700, ls: 0.6, fill: C.mute }));
  g.push(T(902, cy + 6, 'AXIS', { size: 8, w: 700, ls: 0.6, fill: C.mute }));
  g.push(CIR(cx, cy, 34, { fill: C.f2, stroke: C.ink, sw: 1.4 }));
  g.push(T(cx, cy - 2, 'EGO', { size: 9, w: 700, anchor: 'middle', ls: 0.6 }));
  g.push(T(cx, cy + 10, 'core', { size: 8, anchor: 'middle', fill: C.mute }));
  const slots = [
    { fn: 'ti', x: 576, y: cy, rank: 'DOM · 1', filled: true, dist: 'nearest — highest pressure' },
    { fn: 'se', x: cx, y: 216, rank: 'AUX · 2', filled: false, dist: 'choosing now' },
    { fn: 'ni', x: cx, y: 484, rank: 'TERT · 3', filled: false, dist: 'entailed by Se' },
    { fn: 'fe', x: 856, y: cy, rank: 'INF · 4', filled: false, dist: 'entailed by Ti' },
  ];
  slots.forEach((s) => {
    const r = s.rank.startsWith('DOM') ? 46 : s.rank.startsWith('AUX') ? 40 : s.rank.startsWith('TERT') ? 33 : 28;
    g.push(CIR(s.x, s.y, r, { fill: s.filled ? C.f3 : C.f0, stroke: s.filled ? C.ink : C.rule, sw: s.filled ? 2 : 1.2, dash: s.filled ? null : '4 3' }));
    g.push(glyph(s.fn, s.x - r * 0.34, s.y - r * 0.62, r * 0.68, { stroke: s.filled ? C.ink : C.faint }));
    g.push(T(s.x, s.y + r * 0.34, FNS[s.fn].label, { size: r * 0.4, w: 700, anchor: 'middle', fill: s.filled ? C.ink : C.faint }));
    g.push(T(s.x, s.y + r + 14, s.rank, { size: 8.5, w: 700, ls: 0.5, anchor: 'middle', fill: C.ink }));
    g.push(T(s.x, s.y + r + 25, s.dist, { size: 7.8, anchor: 'middle', fill: C.mute }));
  });
  g.push(T(716, 566, 'radius = rank · distance from core = pressure · open ring = not yet placed', { size: 8.5, anchor: 'middle', fill: C.faint }));

  /* right — laws + result */
  g.push(KICK(1000, 106, 'result', { size: 9 }));
  g.push(R(996, 118, 420, 190, { fill: C.f1, stroke: C.ink, sw: 1.4 }));
  g.push(T(1012, 152, 'ISTP', { size: 34, w: 700 }));
  g.push(T(1096, 142, 'provisional — auxiliary not yet placed', { size: 9, fill: C.mute }));
  g.push(T(1096, 156, 'picking Ni instead gives INTP', { size: 9, fill: C.mute }));
  const stackList = [['ti', 'DOMINANT', '100'], ['se', 'AUXILIARY', '85'], ['ni', 'TERTIARY', '55'], ['fe', 'INFERIOR', '35']];
  stackList.forEach(([fn, rank, cap], i) => {
    const ry = 172 + i * 32;
    g.push(R(1012, ry, 388, 28, { fill: C.f0, stroke: C.rule2 }));
    g.push(glyph(fn, 1018, ry + 5, 18, {}));
    g.push(T(1042, ry + 19, FNS[fn].label, { size: 13, w: 700 }));
    g.push(T(1066, ry + 19, rank, { size: 8.5, w: 700, ls: 0.5, fill: C.mute }));
    g.push(T(1150, ry + 19, FNS[fn].name, { size: 9, fill: C.mute }));
    g.push(T(1300, ry + 19, 'start capacity', { size: 8, fill: C.faint }));
    g.push(T(1394, ry + 19, cap, { size: 11, mono: true, w: 700, anchor: 'end' }));
  });
  g.push(R(996, 322, 420, 96, { fill: C.f0, stroke: C.rule }));
  g.push(KICK(1012, 342, 'carry-in — a fresh vessel', { size: 8 }));
  g.push(para(1012, 356, 'Stress 0 on all four. Capacity full. State BALANCED. A vessel keeps its wear across scenario runs in this session, so the second scenario is entered by a tired psyche.', 388, { size: 10 }));
  g.push(R(996, 432, 420, 46, { fill: C.dark, stroke: null, r: 3 }));
  g.push(T(1206, 461, 'CHOOSE A SCENARIO  ▸', { size: 13, w: 700, ls: 1, fill: '#fff', anchor: 'middle' }));
  g.push(T(1206, 494, 'disabled until slot 2 is placed', { size: 9, fill: C.faint, anchor: 'middle' }));

  /* bottom — presets */
  g.push(L(24, 616, 1416, 616, { stroke: C.rule }));
  g.push(KICK(24, 636, 'or take a finished type — the same sixteen, derived not stored', { size: 9 }));
  const codes = ['ISTP', 'ISFP', 'INTP', 'INFP', 'ESTP', 'ESFP', 'ENTP', 'ENFP', 'ISTJ', 'ISFJ', 'INTJ', 'INFJ', 'ESTJ', 'ESFJ', 'ENTJ', 'ENFJ'];
  const stacks = ['Ti Se Ni Fe', 'Fi Se Ni Te', 'Ti Ne Si Fe', 'Fi Ne Si Te', 'Se Ti Fe Ni', 'Se Fi Te Ni', 'Ne Ti Fe Si', 'Ne Fi Te Si', 'Si Te Fi Ne', 'Si Fe Ti Ne', 'Ni Te Fi Se', 'Ni Fe Ti Se', 'Te Si Ne Fi', 'Fe Si Ne Ti', 'Te Ni Se Fi', 'Fe Ni Se Ti'];
  codes.forEach((c2, i) => {
    const tx = 24 + (i % 8) * 174.5, ty = 650 + Math.floor(i / 8) * 46;
    const on = c2 === 'ISTP';
    g.push(R(tx, ty, 166, 38, { fill: on ? C.f3 : C.f0, stroke: on ? C.ink : C.rule, sw: on ? 1.8 : 1, r: 3 }));
    g.push(T(tx + 10, ty + 17, c2, { size: 12, w: 700 }));
    g.push(T(tx + 10, ty + 30, stacks[i], { size: 9, mono: true, fill: C.mute }));
  });

  /* footer note */
  g.push(R(24, 756, 1392, 118, { fill: C.f1, stroke: C.rule }));
  g.push(KICK(40, 778, 'the entailment beat — slots 3 and 4 are not choices, and the interface must not pretend they are', { size: 9 }));
  g.push(para(40, 796, 'When the auxiliary lands, slots 3 and 4 fill themselves by Law III (every function installs its polar opposite at the far end of its axis). Those two placements animate as consequences, not selections: no affordance, no cursor change, a one-line explanation each. This is the single most teachable fact in typology and it is free — it only requires that we refuse to draw four identical drop targets.', 1360, { size: 11 }));
  g.push(T(40, 858, 'Ti dominant  →  Fe is installed inferior (judgment axis).      Se auxiliary  →  Ni is installed tertiary (perception axis).', { size: 10.5, mono: true, fill: C.ink }));

  const calls = [
    cal(1, 348, 22), cal(2, 36, 116), cal(3, 470, 116), cal(4, 716, 350), cal(5, 1008, 112),
    cal(6, 1008, 328), cal(7, 1206, 432, {}), cal(8, 36, 630), cal(9, 36, 762), cal(10, 24, 380), cal(11, 856, 350), cal(12, 576, 350),
  ];
  return g.join('') + calls.join('');
}

export const S1_LEGEND = [
  { n: 1, t: 'Step ribbon — two choices, two entailments', d: 'Four steps, but only steps 1 and 2 are interactive. Steps 3 and 4 are drawn in a permanently non-interactive style (dashed, no fill, no hover) because they are consequences of steps 1–2.', hover: 'Steps 3–4 give no hover response at all — a deliberate dead affordance.', commit: 'Placing the auxiliary advances all three remaining steps at once.', state: 'Not present; assembly precedes any simulation state.' },
  { n: 2, t: 'The eight — dominant chooser, then legality filter', d: 'All eight are live at step 1. Once a dominant is placed, six of the eight are struck out and labelled ILLEGAL with the law that excludes them; the two legal auxiliaries are given a heavier border.', hover: 'An illegal tile explains which of Law I / Law II it violates instead of doing nothing.', commit: 'Selecting a legal tile writes slot 2 and triggers the entailment beat.', state: 'n/a' },
  { n: 3, t: 'The Vessel figure', d: 'The radial layout from layout Strategy B, relocated here where gestalt matters more than precise comparison. Slot radius encodes rank; distance from the ego core encodes pressure; an open dashed ring means unplaced.', hover: 'Hovering a slot dims the other three and names the axis it belongs to.', commit: 'Placement fills the ring and snaps the glyph to solid ink.', state: 'The same figure is reused as the S6 aggregate; loop and grip redraw its conduits.' },
  { n: 4, t: 'Ego core', d: 'The aggregate point. Empty during assembly; in S6 it carries the whole-human readouts and shifts toward whichever function is doing the work.', hover: '—', commit: '—', state: 'Grip drags the core toward the inferior slot; loop draws a lit path that visibly skips the auxiliary.' },
  { n: 5, t: 'Result panel — provisional type code', d: 'Names the type as soon as it is determined, and names the counterfactual (“picking Ni instead gives INTP”) so the user sees that one click separates two types.', hover: 'Hovering a stack row previews that function’s info page glyph at full size.', commit: '—', state: 'n/a' },
  { n: 6, t: 'Carry-in strip', d: 'States the starting condition of the vessel. Critical because vessels persist across scenario runs in a session: this strip is where a returning user learns they are re-entering with wear.', hover: '—', commit: '—', state: 'If the vessel is already in Loop or Grip from a previous run, that is declared here, before scenario choice.' },
  { n: 7, t: 'Primary CTA', d: 'Single exit. Disabled and visibly so until slot 2 exists. There is no way to reach a scenario with an incomplete stack.', hover: '—', commit: 'Routes to S2.', state: 'n/a' },
  { n: 8, t: 'Sixteen presets', d: 'Escape hatch for users who already know their type. Shows the derived stack under each code so the preset still teaches the ordering.', hover: 'Previews the stack into the Vessel figure without committing.', commit: 'Fills all four slots and skips the entailment beat.', state: 'n/a' },
  { n: 9, t: 'Entailment explainer', d: 'Permanent footer, not a dismissible tooltip. It is the lesson the screen exists to teach, so it does not hide.', hover: '—', commit: '—', state: 'n/a' },
  { n: 10, t: 'Law card', d: 'Three laws stated in one block, adjacent to the grid they are currently constraining. Placed next to the cause, not in a help menu.', hover: '—', commit: '—', state: 'n/a' },
  { n: 11, t: 'Inferior slot — smallest radius, furthest out', d: 'Drawn smallest and furthest from the core. This is the only screen where the inferior is visually minor; every later screen lets it grow, and in Grip (S8) it becomes the largest thing on screen.', hover: '—', commit: '—', state: 'Grip inflates this slot past the dominant.' },
  { n: 12, t: 'Dominant slot — largest radius, nearest core', d: 'Radius and proximity both encode rank, so the hierarchy survives greyscale, small sizes, and colour-blindness. Rank is never carried by colour anywhere in this system.', hover: '—', commit: '—', state: 'Loop keeps this slot lit; Grip demotes it.' },
];

/* ============================================================ S2 */
export function S2() {
  const g = [];
  g.push(R(24, 16, 1392, 54, { fill: C.f1, stroke: C.rule }));
  g.push(KICK(40, 36, 'playground · step 2 — situation', { size: 9 }));
  g.push(T(40, 58, 'Choose a situation for this psyche', { size: 18, w: 700 }));
  g.push(R(1150, 26, 250, 34, { fill: C.f0, stroke: C.ink, sw: 1.2, r: 3 }));
  g.push(T(1160, 41, 'VESSEL', { size: 8, w: 700, ls: 0.6, fill: C.mute }));
  g.push(T(1160, 54, 'ISTP · Ti Se Ni Fe', { size: 11, w: 700, mono: true }));
  ['ti', 'se', 'ni', 'fe'].forEach((fn, i) => g.push(glyph(fn, 1300 + i * 24, 32, 20, {})));

  /* left — browser */
  g.push(KICK(24, 96, 'scenario deck', { size: 9 }));
  const scenarios = [
    { t: 'The Credit Thief', b: 'Nine people. Your architecture. Someone else’s name on it.', feeds: [0.86, 0.55, 0.7, 0.9], sel: true, tag: 'values-charged · public' },
    { t: 'Kitchen Fire', b: 'Four seconds. Everything is happening at once.', feeds: [0.3, 0.95, 0.35, 0.5], sel: false, tag: 'sensory emergency' },
    { t: 'The Offer', b: 'A better job nine hundred km away. Forty-eight hours.', feeds: [0.75, 0.15, 0.95, 0.2], sel: false, tag: 'no audience · interior only' },
  ];
  scenarios.forEach((s, i) => {
    const y = 110 + i * 150;
    g.push(R(24, y, 356, 138, { fill: s.sel ? C.f2 : C.f0, stroke: s.sel ? C.ink : C.rule, sw: s.sel ? 2 : 1, r: 3 }));
    g.push(T(38, y + 24, s.t, { size: 14, w: 700 }));
    g.push(T(38, y + 40, s.tag, { size: 8.5, w: 700, ls: 0.5, fill: C.mute }));
    g.push(para(38, y + 56, s.b, 328, { size: 10 }));
    g.push(KICK(38, y + 92, 'what it feeds in YOUR stack', { size: 7.5 }));
    ['ti', 'se', 'ni', 'fe'].forEach((fn, j) => {
      const bx = 38 + j * 82;
      g.push(glyph(fn, bx, y + 100, 13, {}));
      g.push(T(bx + 17, y + 110, FNS[fn].label, { size: 9, w: 700 }));
      g.push(meter(bx, y + 116, 66, { v: s.feeds[j], h: 6 }));
      g.push(T(bx, y + 132, s.feeds[j] > 0.7 ? 'fed' : s.feeds[j] > 0.4 ? 'partial' : 'starved', { size: 7.5, fill: C.mute }));
    });
    if (s.sel) g.push(P(`M380 ${y + 68} l14 0`, { stroke: C.ink, sw: 1.6, marker: 'arw' }));
  });
  g.push(R(24, 566, 356, 92, { fill: C.f1, stroke: C.rule }));
  g.push(KICK(38, 586, 'why a starved function is expensive', { size: 8 }));
  g.push(para(38, 600, 'Cost is machinery times context, never machinery alone. A dominant with nothing to eat — Se in a room where nothing is happening — runs hot too. The feed bars above set each function’s cost gate before a single action is priced.', 328, { size: 10 }));

  /* right — briefing */
  g.push(R(404, 88, 1012, 700, { fill: C.f0, stroke: C.ink, sw: 2 }));
  g.push(R(404, 88, 1012, 92, { fill: C.f1, stroke: C.rule }));
  g.push(KICK(424, 112, 'briefing — the predispositions, stated before you act', { size: 9 }));
  g.push(T(424, 138, 'The Credit Thief', { size: 20, w: 700 }));
  g.push(para(424, 154, 'Sprint review, nine people in the room. A colleague is presenting your architecture as their own — not paraphrasing it, presenting it. The promotion list closes in six days.', 972, { size: 11 }));

  g.push(KICK(424, 206, 'what each of your four already brings to this room', { size: 9 }));
  const briefs = [
    { fn: 'ti', rank: 'DOMINANT', prior: 'Model fit: CONTRADICTION. The axiom “credit follows authorship” has just been violated in public and Ti has already finished checking.', gate: '1.10', gateNote: 'contradiction — slightly costly to hold', reg: 'ACTIVE' },
    { fn: 'se', rank: 'AUXILIARY', prior: 'Registered: the pause, the slide number, who looked at whom. Urgency 0.70 — there is a window and it is closing with this slide.', gate: '0.90', gateNote: 'fed — a live room is Se’s food', reg: 'REGISTERED' },
    { fn: 'ni', rank: 'TERTIARY', prior: 'Trajectory: FORESEEN. This is the third time, and Ni already knows how this ends if nothing is said.', gate: '0.70', gateNote: 'foreseen — cheap, and that is the trap', reg: 'ACTIVE' },
    { fn: 'fe', rank: 'INFERIOR', prior: 'Audience 9, tone tense-polite, expectation “keep the meeting on track”. Fe is holding a room it has no capacity to hold.', gate: '1.20', gateNote: 'nine people is a full room to conduct', reg: 'OVERLOADED' },
  ];
  briefs.forEach((b, i) => {
    const y = 222 + i * 92;
    g.push(R(424, y, 972, 84, { fill: i === 0 ? C.f1 : C.f0, stroke: C.rule }));
    g.push(glyph(b.fn, 438, y + 14, 30, {}));
    g.push(T(438, y + 62, FNS[b.fn].label, { size: 16, w: 700 }));
    g.push(T(438, y + 74, b.rank, { size: 7.5, w: 700, ls: 0.5, fill: C.mute }));
    g.push(L(492, y + 10, 492, y + 74, { stroke: C.rule2 }));
    g.push(KICK(506, y + 22, 'predisposition', { size: 7.5 }));
    g.push(para(506, y + 36, b.prior, 620, { size: 10.5 }));
    g.push(L(1150, y + 10, 1150, y + 74, { stroke: C.rule2 }));
    g.push(KICK(1164, y + 22, 'cost gate', { size: 7.5 }));
    g.push(T(1164, y + 46, b.gate, { size: 22, w: 700, mono: true }));
    g.push(T(1210, y + 46, 'x', { size: 11, fill: C.mute }));
    g.push(para(1164, y + 58, b.gateNote, 220, { size: 9, fill: C.mute }));
    const rw = b.reg.length * 6 + 16;
    g.push(R(1396 - rw, y + 14, rw, 16, { fill: b.reg === 'OVERLOADED' ? C.dark : C.f2, stroke: C.rule, r: 8 }));
    g.push(T(1396 - rw / 2, y + 25, b.reg, { size: 8, w: 700, ls: 0.4, anchor: 'middle', fill: b.reg === 'OVERLOADED' ? '#fff' : C.ink2 }));
  });

  /* carried in */
  g.push(R(424, 598, 972, 82, { fill: C.f1, stroke: C.ink, sw: 1.3 }));
  g.push(KICK(438, 620, 'carried in from your last run — this vessel is not fresh', { size: 8.5 }));
  const carry = [['ti', 26, 0.78], ['se', 19, 0.71], ['ni', 31, 0.46], ['fe', 44, 0.29]];
  carry.forEach(([fn, st, en], i) => {
    const bx = 438 + i * 176;
    g.push(glyph(fn, bx, 630, 16, {}));
    g.push(T(bx + 21, 643, FNS[fn].label, { size: 11, w: 700 }));
    g.push(T(bx + 44, 643, `stress ${st}`, { size: 9.5, mono: true, fill: C.ink2 }));
    g.push(meter(bx, 650, 150, { v: en, h: 6 }));
    g.push(T(bx, 668, `capacity ${Math.round(en * 100)} of 100`, { size: 8.5, mono: true, fill: C.mute }));
  });
  g.push(T(1160, 643, 'STATE: BALANCED', { size: 11, w: 700, mono: true }));
  g.push(T(1160, 660, 'margin to Loop 31 · to Grip 58', { size: 9, mono: true, fill: C.mute }));
  g.push(R(1290, 626, 96, 42, { fill: C.f0, stroke: C.rule, r: 2 }));
  g.push(T(1338, 643, 'RESET', { size: 9.5, w: 700, anchor: 'middle' }));
  g.push(T(1338, 656, 'to fresh', { size: 8, anchor: 'middle', fill: C.mute }));

  g.push(R(424, 698, 972, 70, { fill: C.f0, stroke: C.rule }));
  g.push(KICK(438, 720, 'this deck', { size: 8 }));
  g.push(T(438, 744, '5 candidate actions · 1 of them is suppression · 2 demand a function you do not carry', { size: 11.5 }));
  g.push(R(1180, 710, 202, 46, { fill: C.dark, stroke: null, r: 3 }));
  g.push(T(1281, 738, 'ENTER SCENARIO  ▸', { size: 12.5, w: 700, ls: 0.8, fill: '#fff', anchor: 'middle' }));

  g.push(T(404, 806, 'One scenario run = one decisive action. The briefing is the only place the priors are stated in full; from S3 onward they are compressed into the cost gates.', { size: 11, fill: C.mute }));

  const calls = [cal(1, 36, 92), cal(2, 396, 178), cal(3, 418, 96), cal(4, 418, 202), cal(5, 502, 236), cal(6, 1158, 236), cal(7, 1390, 232), cal(8, 418, 594), cal(9, 418, 694), cal(10, 1281, 698), cal(11, 36, 562), cal(12, 44, 470)];
  return g.join('') + calls.join('');
}

export const S2_LEGEND = [
  { n: 1, t: 'Scenario deck (browser)', d: 'Three authored situations, spread across the hook space so the same vessel behaves unrecognisably between them. Selection is single, immediate, and reversible until Enter.', hover: 'Recomputes the feed bars for the hovered scenario against the current stack.', commit: 'Selection only; no simulation state changes until Enter Scenario.', state: 'A vessel already in Loop or Grip carries that state into whichever scenario is chosen.' },
  { n: 2, t: 'Per-scenario feed profile — computed against YOUR stack', d: 'Four bars: how much this situation feeds each of the four functions this user actually carries. Not a property of the scenario alone — the same scenario shows different bars for a different type. This is the screen that makes “context gates cost” concrete.', hover: 'Bar tooltip names the specific hook (audience 9, urgency 0.70).', commit: '—', state: 'Unchanged by loop/grip; gates are situational, not psychological.' },
  { n: 3, t: 'Briefing panel', d: 'The scenario expanded. Everything the simulation will use as input is stated here in plain language, before any action is priced. Nothing in the run is hidden information.', hover: '—', commit: '—', state: '—' },
  { n: 4, t: 'Predisposition rows — one per function, in stack order', d: 'Rank-ordered, matching S3 exactly, so the user learns the vertical order here and never has to relearn it. Each row states what that function already knows, wants, or has registered.', hover: 'Row highlights and its S3 counterpart is pre-scrolled into view.', commit: '—', state: 'Under Loop, the bypassed auxiliary’s row is struck through here on re-entry — its predisposition is present but will not be consulted.' },
  { n: 5, t: 'The predisposition itself', d: 'Authored prose, one to two sentences, in that function’s own register. This is the only long-form text in the whole flow; every later text surface is a short stream line.', hover: '—', commit: '—', state: '—' },
  { n: 6, t: 'Cost gate multiplier', d: 'The number that converts a predisposition into money. Displayed as a bare multiplier with a plain-language reason beneath, so the user can predict the receipt before seeing it.', hover: 'Expands to show the gate table for that function in this scenario.', commit: 'Frozen for the duration of the run.', state: 'Loop and Grip apply their own multipliers on top; this one does not change.' },
  { n: 7, t: 'Registration chip', d: 'Whether the function has actually taken the situation in. Se can be REGISTERED or MISSED IT; Fe can be OVERLOADED. A function that never registered the stimulus cannot be blamed for the response — and its stream will say so.', hover: '—', commit: '—', state: 'Grip forces the inferior to OVERLOADED regardless of the authored value.' },
  { n: 8, t: 'Carry-in strip — the session accumulator', d: 'The load-bearing consequence of one-action scenarios: the accumulator lives at session level, not scenario level. This strip is where the user sees that they are entering tired, and it is why Loop and Grip can trigger automatically at all.', hover: 'Hovering a function shows its per-run history as a sparkline.', commit: '—', state: 'Declares carried Loop/Grip in the state slot at the right.' },
  { n: 9, t: 'Deck summary', d: 'Counts before commitment: how many actions, how many demand functions outside this stack (which will be routed and surcharged), and confirmation that suppression is on the deck and priced.', hover: '—', commit: '—', state: 'Under Loop/Grip the count includes the generated alleviate and aggravate cards.' },
  { n: 10, t: 'Enter Scenario', d: 'The point of no return for the briefing. After this, the run has begun and the four intake beats fire in stack order.', hover: '—', commit: 'Fires intake beats b1–b4, one per function, then hands control to S3.', state: '—' },
  { n: 11, t: 'Cost doctrine note', d: 'Permanent explainer for the counter-intuitive rule: a dominant function with nothing to do is expensive, not free. Placed adjacent to the feed bars that implement it.', hover: '—', commit: '—', state: '—' },
  { n: 12, t: 'Reset to fresh', d: 'The only way back to a zero-wear vessel without rebuilding it. Deliberately small and adjacent to the carry-in strip, so resetting reads as discarding history rather than as a normal step.', hover: 'Warns that session history and the seismograph tail will be cleared.', commit: 'Clears all four function states and the beat ring buffer.', state: 'Also clears Loop/Grip.' },
];

/* ============================================================ S3 */
export function S3() {
  const g = [ledger({
    rows: BASE_ROWS,
    shares: [0.42, 0.22, 0.24, 0.12],
    cards: BASE_CARDS,
  })];
  const calls = [
    cal(1, 16, 480), cal(2, 232, 40), cal(3, 990, 18), cal(4, 32, 232), cal(5, 152, 214),
    cal(6, 200, 132), cal(7, 556, 288, { leader: [556, 252] }), cal(8, 736, 288, { leader: [736, 252] }),
    cal(9, 848, 130), cal(10, 1022, 130), cal(11, 1083, 112), cal(12, 1116, 112),
    cal(13, 1398, 200), cal(14, 46, 716), cal(15, 46, 806), cal(16, 96, 290),
  ];
  return g.join('') + calls.join('');
}

export const S3_LEGEND = [
  { n: 1, t: 'Scenario envelope', d: 'A literal container, not a header. The heavy 2.5px frame encloses every readout on the screen, because every readout is conditioned on this situation. Nothing simulation-related is drawn outside it.', hover: '—', commit: 'Frame persists through commit; the run ends inside it.', state: 'Loop and Grip add a hatched inner rule to the frame so the container itself declares the state.' },
  { n: 2, t: 'Scenario identity + reopen briefing', d: 'Title, one-line vignette, and a route back to the full briefing (S2) without losing state. The vessel code sits beside it so the user always knows which psyche they are watching.', hover: '—', commit: '—', state: '—' },
  { n: 3, t: 'State chip + the two margins (answers Q-C)', d: 'The distance-to-break readout. One chip naming the current state, then two margin meters: points of accumulated load remaining before Loop, and before Grip. This is the only always-on predictive readout and it is placed at the strongest position on the screen.', hover: 'Both margins show a dashed forecast segment for the hovered action — this is how a user learns an action would trip a state before they commit it.', commit: 'Margins step to their new values and the chip re-evaluates; a crossing animates as a threshold break, not a smooth slide.', state: 'Chip inverts to solid dark; the crossed margin reads AT LIMIT and the other becomes the live one.' },
  { n: 4, t: 'Function row — height encodes rank', d: 'Four rows in stack order, dominant first, at 186 / 156 / 122 / 100px. Rank is carried by physical size and vertical position, never by colour. The order of the rows is the lesson, so the layout is the lesson.', hover: 'No row-level hover state; rows respond to action hover, not pointer position, so the forecast never depends on where the pointer happens to rest.', commit: 'All four rows step one beat together.', state: 'Loop dims and hatches the auxiliary row. Grip swaps the height allocations of the dominant and inferior rows — vertical order and rank labels stay put, so the labels end up visibly out of order with the sizes, which reads as the hierarchy being overthrown rather than reordered.' },
  { n: 5, t: 'Glyph slot — present, legible, subordinate', d: 'The function’s own glyph from its info page, rendered at 32px (dom) / 28 (aux) / 24 (tert) / 22 (inf), pinned bottom-left of the identity gutter with the glyph name beside it. It occupies roughly 2% of row area. It exists so a user can map this panel back to the page they studied — it is an index, not the anchor. The anchor is the two-letter label above it, set at 30px.', hover: 'Glyph is inert on hover — it never becomes the interactive target.', commit: 'Unchanged.', state: 'Under Grip the inferior’s glyph steps up to 32px, the only time a glyph changes size, marking that the function has been promoted by force.' },
  { n: 6, t: 'Expression stream — the inner voice', d: 'That function’s running commentary, newest line at the bottom, older lines fading upward. Line count is the fidelity tier: 5 lines dominant, 3 auxiliary, 2 tertiary and inferior. At rest this is the only continuously animating element on the screen.', hover: 'A dashed PROJECTED block appears beneath the live lines carrying what this function would say if the hovered action were committed. The live stream keeps running underneath, unmodified.', commit: 'The projected line is promoted into the stream as a real line and the block empties.', state: 'Loop stalls the auxiliary stream mid-sentence and leaves it stalled; Grip replaces the inferior’s register entirely with crude, absolutist phrasing and gives it 5 lines.' },
  { n: 7, t: 'Seismograph — stress over beats', d: 'The x-axis is beat index, not seconds. Roughly 16 beats visible; the trace is solid ink for committed history. Between beats it still moves — decay and small jitter — so the instrument reads as alive without penalising a slow reader.', hover: 'Forecast is drawn only inside the reserved band (callout 8); committed history is never redrawn on hover.', commit: 'The forecast segment translates left across NOW and hardens from dashed to solid.', state: 'Loop produces a regular self-reinforcing oscillation between dominant and tertiary; Grip produces a rising trace on the inferior and flattens the dominant.' },
  { n: 8, t: 'NOW rule + reserved forecast band', d: 'NOW sits at 72% of the trace width. The rightmost 28% is permanently reserved for forecast and is drawn empty, in a dashed well, at rest. Nothing committed is ever drawn to the right of NOW. This is the single rule that keeps projection and record separable without colour.', hover: 'The reserved band fills with the hatched forecast and a dashed trace.', commit: 'Band empties again immediately after the forecast crosses into history.', state: 'Unchanged — the reservation is structural.' },
  { n: 9, t: 'Scalar readout cluster', d: 'Pleasure, involvement share, and energy/capacity, stacked in a fixed order in a fixed column so the same readout is at the same x-position in all four rows. Vertical scanning down one column is the intended comparison gesture.', hover: 'Each meter grows a dashed forecast extension or retraction from its committed fill; the capacity meter grows a hatched segment showing exactly what the action would take.', commit: 'Meters animate to their new value once and stop.', state: 'Loop zeroes the auxiliary’s involvement and freezes its stress decay; Grip pushes the inferior’s capacity below zero into visible DEBT hatching.' },
  { n: 10, t: 'Forecast delta gutter — reserved, empty at rest', d: 'A dedicated column at the right edge of every row that holds nothing until hover. Deltas are set large; levels stay small inside the cluster. This implements “deltas over levels”: the change is the content, the level is context.', hover: 'Fills with signed deltas for stress, pleasure, involvement, and energy.', commit: 'Empties.', state: 'Under Loop/Grip the gutter also carries a small state-attribution tag when a delta is caused by the state rather than by the action.' },
  { n: 11, t: 'Involvement spine (answers Q-A)', d: 'One continuous full-height stacked bar, four segments, summing to 100%. It is the fastest answer to “who is running this?” — readable peripherally, without reading a number. Because row heights are fixed by rank and spine segments are sized by involvement, the mismatch between them is itself a readout: a segment taller than its own row means that function is working above its station, marked with a tick in the left margin. In Grip the inferior overruns even the doubled row height it has been granted, and that is visible from across the room.', hover: 'Segment boundaries show dashed proposed positions for the hovered action; the existing segments stay put so before/after is legible in one glance.', commit: 'Segments animate to the new ratio; the ratio always renormalises to exactly 100%.', state: 'Loop collapses the auxiliary segment to near zero; Grip makes the inferior segment the largest.' },
  { n: 12, t: 'Action rail', d: 'The candidate reactions, always visible, right-aligned so the pointer is near the per-row delta gutter while hovering. Five cards at rest. One commit ends the scenario.', hover: 'Exactly one card can be hovered; hovering is the only way to see a forecast anywhere on the screen.', commit: 'Rail locks and the run advances to resolution (S9).', state: 'Loop and Grip append generated alleviate and aggravate cards to this rail, tagged and sorted after the authored ones.' },
  { n: 13, t: 'Action card anatomy', d: 'Title, one-line detail, signature chips naming which functions the action demands and in what proportion, a routing note when it demands a function this stack does not carry, and a likelihood bar.', hover: 'Card raises, gains a commit affordance, and drives every forecast on the screen.', commit: 'Card is the committed action; its outcome text carries into S9.', state: 'Generated cards carry an ALLEVIATES or AGGRAVATES tag in the top-right.' },
  { n: 14, t: 'Whole-Human band (persistent, expandable)', d: 'The aggregate lives on this screen permanently as a thin band, so part and whole are visible in the same glance. Carries the aggregate trace, four aggregate scalars, and the impressions-in / expressions-out balance. Expands in place into the full S6 apparatus without navigating away.', hover: 'Aggregate readouts forecast alongside the four rows, using the same dashed-and-hatched grammar.', commit: 'Aggregate steps with the rows.', state: 'The band is where Loop and Grip are most legible as a whole-person event rather than a per-function one.' },
  { n: 15, t: 'Teaching overrides + history scope', d: 'Manual Loop and Grip toggles, always available regardless of accumulated load, plus history scope and reduced-motion status. Placed at the bottom because they are instructor controls, not part of the primary loop.', hover: 'Toggle preview shows how many readouts would be rewritten.', commit: 'Toggling is instantaneous and does not consume a beat or any energy.', state: 'A manually entered state is tagged MANUAL everywhere it is reported, and never satisfies an automatic exit condition — the user must toggle it back off.' },
  { n: 16, t: 'Fidelity tier chip', d: 'Declares which tier this row is rendering at: FULL, MID, or LOW. Tier is set by rank at rest and promoted on focus, and it is what makes twenty simultaneous signals legible without shrinking anything.', hover: '—', commit: '—', state: 'Grip promotes the inferior row to FULL and demotes the dominant to MID — the tiering itself is a readout of the state.' },
];

/* ============================================================ S4 */
export function S4() {
  const rows = [
    { ...BASE_ROWS[0], forecast: 'rising', cost: 0.28, fPleasure: 0.52, fInvolve: 0.55, dStress: '+14', deltas: [['STRESS', '+14'], ['PLEASURE', '+18'], ['SHARE', '+13'], ['ENERGY', '−28']], forecastLine: '“The claim is false and the proof is two clicks away.”' },
    { ...BASE_ROWS[1], forecast: 'spike', cost: 0.22, fPleasure: 0.41, fInvolve: 0.30, dStress: '+9', deltas: [['STRESS', '+9'], ['PLEASURE', '+13'], ['SHARE', '+8'], ['ENERGY', '−22']], forecastLine: '“Now. This pause is the window.”' },
    { ...BASE_ROWS[2], forecast: 'decay', cost: 0.06, fPleasure: 0.18, fInvolve: 0.11, dStress: '−6', deltas: [['STRESS', '−6'], ['ENERGY', '−6']] },
    { ...BASE_ROWS[3], forecast: 'rising', cost: 0.24, fPleasure: 0.05, fInvolve: 0.04, dStress: '+21', deltas: [['STRESS', '+21'], ['ENERGY', '−24']] },
  ];
  const cards = BASE_CARDS.map((c, i) => (i === 0 ? { ...c, hovered: true } : c));
  const g = [ledger({
    rows,
    shares: [0.42, 0.22, 0.24, 0.12],
    forecastShares: [0.55, 0.30, 0.11, 0.04],
    cards,
    header: {
      margins: [['margin to LOOP', 0.62, '31'], ['margin to GRIP', 0.78, '58']],
      beat: 'hovering — no beat consumed, nothing spent',
    },
    band: { forecast: 'rising', stats: [['energy', '62%', 0.62], ['stress', '41', 0.41], ['pleasure', '18', 0.18], ['evenness', '0.71', 0.71]] },
  })];

  /* hover contract strip, drawn over the header right side */
  g.push(R(430, 20, 552, 34, { fill: C.f0, stroke: C.ink, sw: 1.4, dash: '4 3', r: 3 }));
  g.push(T(444, 34, 'HOVER = PROJECTION', { size: 10, w: 700, ls: 0.7 }));
  g.push(T(444, 47, 'nothing spent · nothing recorded · no beat consumed · leaving the card restores the resting screen exactly', { size: 9, fill: C.mute }));

  /* forecast ink key */
  g.push(R(1108, 700, 300, 0.1, { stroke: null }));
  const keyY = 706;
  g.push(R(32, keyY, 1376, 0.1, { stroke: null }));

  const calls = [
    cal(1, 1256, 152), cal(2, 436, 24), cal(3, 990, 18), cal(4, 200, 268), cal(5, 736, 172),
    cal(6, 1022, 176), cal(7, 1083, 244), cal(8, 848, 200), cal(9, 46, 716), cal(10, 1398, 200),
    cal(11, 556, 288, { leader: [556, 252] }), cal(12, 990, 62),
  ];
  return g.join('') + calls.join('');
}

export const S4_LEGEND = [
  { n: 1, t: 'The hovered action', d: 'Exactly one card at a time. It raises, gains a dashed outer rule and a COMMIT affordance, and becomes the source of every forecast on the screen. Keyboard arrow keys move the hover; the forecast is identical either way.', hover: 'This is the hover.', commit: 'Enter, or clicking COMMIT, converts every forecast on screen into history in one step.', state: 'A generated alleviate/aggravate card behaves identically — the tag changes, the mechanics do not.' },
  { n: 2, t: 'The hover contract, stated on screen', d: 'A literal promise that hovering spends nothing, records nothing, and consumes no beat. It exists because the whole simulation is only trustworthy if the user believes exploration is free. Leaving the card restores the resting screen byte-for-byte.', hover: '—', commit: '—', state: 'Unchanged.' },
  { n: 3, t: 'Margins forecast too', d: 'Both distance-to-break meters grow dashed forecast segments. This is where a user discovers that an action would trip Loop or Grip before committing it — the single most important pre-commit warning in the product.', hover: 'Dashed segment; if the forecast crosses the threshold, the meter shows the crossing explicitly rather than clamping.', commit: 'Meter steps; a crossing fires the state transition immediately.', state: 'The already-crossed margin reads AT LIMIT and stops forecasting.' },
  { n: 4, t: 'Projected stream line', d: 'A dashed, hatched block below the live stream carrying what this function would say. It is offset and boxed rather than merged into the stream, so a projected sentence can never be mistaken for something the psyche actually said.', hover: 'Appears, one line, in that function’s own register.', commit: 'Promoted into the live stream as an ordinary line; the block empties.', state: 'Under Loop the bypassed function projects nothing and shows “would not be consulted”.' },
  { n: 5, t: 'Forecast inside the reserved band only', d: 'The dashed trace and its hatch fill are drawn strictly to the right of NOW, in the well that was empty at rest. Committed history to the left is not touched, not redrawn, and not re-scaled — which is also why hover is cheap to render.', hover: 'Band fills.', commit: 'Band contents translate left across NOW and harden to solid ink.', state: 'Unchanged — structural.' },
  { n: 6, t: 'Delta gutter, populated', d: 'Signed deltas, set large, because the delta is the content. FULL and MID rows carry all four — stress, pleasure, share, energy. LOW rows carry only the two that decide the choice, stress and energy, following the fidelity rule that lower tiers remove components rather than shrink them. Signs are explicit (+ / −) and never implied by bar direction alone.', hover: 'Fills.', commit: 'Empties; the values are folded into the receipt in S9.', state: 'Gains a state-attribution tag when the state rather than the action caused the delta.' },
  { n: 7, t: 'Proposed spine boundaries', d: 'The involvement spine keeps its committed segments and overlays dashed lines at the proposed boundaries. Before and after are legible in one glance without any animation, and the proposed ratio still sums to exactly 100%.', hover: 'Dashed boundaries appear.', commit: 'Segments animate to the dashed positions and the dashes clear.', state: 'Under Grip the proposed boundary for the inferior typically overruns its row, which is the visual tell that the psyche is about to work far above its station.' },
  { n: 8, t: 'Meters with forecast extension and retraction', d: 'A forecast can point either way. Pleasure extends; the tertiary’s share retracts. Retraction is drawn as a hatched segment inside the committed fill, so a decrease is as visible as an increase.', hover: 'Extension or retraction appears.', commit: 'Meter animates once to the new level.', state: '—' },
  { n: 9, t: 'Aggregate forecasts in the same grammar', d: 'The Whole-Human band forecasts with identical ink rules, so there is one visual language to learn rather than two. This is also where the user sees that four individually modest costs can aggregate into a large one.', hover: 'Aggregate trace and scalars show dashed forecasts.', commit: 'Steps with the rows.', state: 'Under Loop/Grip the band is the clearest statement of what the state costs the whole person.' },
  { n: 10, t: 'Routing surcharge, declared on the card', d: 'This action demands Te, which an ISTP does not carry. It is not impossible — it is translated into Ti and surcharged 35%. The card says so before commitment, and the resulting cost appears in the dominant’s row rather than nowhere.', hover: 'The receiving function’s row shows a routed-work marker in its delta gutter.', commit: 'The surcharge is itemised separately in the receipt.', state: 'Unchanged.' },
  { n: 11, t: 'Energy: capacity, cost, and the debt boundary', d: 'The capacity meter shows remaining as fill and the hovered action’s cost as a hatched segment eaten from the right of that fill. If cost exceeds remaining, the overflow is drawn past zero as DEBT — the psyche can always perform the action, it simply borrows to do it.', hover: 'Hatched cost segment appears; overflow renders as DEBT.', commit: 'Fill shrinks; any debt persists and applies a per-beat stress penalty until repaid.', state: 'Grip is usually entered from debt, not from stress alone.' },
  { n: 12, t: 'No beat consumed', d: 'The beat counter explicitly reads that hovering advances nothing. Time in this simulation moves on commit, not on attention, which is what lets a user compare five actions carefully without being punished for reading.', hover: 'Counter shows the hover notice.', commit: 'Counter advances one beat and then plays the three aftermath beats.', state: '—' },
];

/* ============================================================ S5 */
export function S5() {
  const g = [];
  g.push(KICK(24, 30, 'one reaction window, expanded — every sub-component labelled', { size: 9 }));
  g.push(T(24, 54, 'Ti · Introverted Thinking · DOMINANT — full fidelity', { size: 17, w: 700 }));
  g.push(T(24, 72, 'This is the S3 dominant row at 1.6x, with nothing hidden. Tiers MID and LOW below remove components; they never shrink them.', { size: 10.5, fill: C.mute }));

  const X = 24, Y = 96, W = 1180, H = 470;
  g.push(R(X, Y, W, H, { fill: C.f1, stroke: C.ink, sw: 2 }));

  /* A — identity gutter */
  g.push(L(X + 196, Y + 12, X + 196, Y + H - 12, { stroke: C.rule }));
  g.push(KICK(X + 16, Y + 26, 'a · identity gutter', { size: 8 }));
  g.push(T(X + 16, Y + 66, 'Ti', { size: 46, w: 700 }));
  g.push(T(X + 16, Y + 84, 'Introverted Thinking', { size: 11, fill: C.mute }));
  g.push(R(X + 16, Y + 94, 92, 16, { fill: C.f3, stroke: C.rule2, r: 8 }));
  g.push(T(X + 62, Y + 106, 'DOMINANT · 1st', { size: 8.5, w: 700, ls: 0.4, anchor: 'middle' }));
  g.push(glyph('ti', X + 16, Y + 128, 44, {}));
  g.push(R(X + 16, Y + 128, 44, 44, { stroke: C.ink, sw: 1, dash: '3 2' }));
  g.push(T(X + 68, Y + 142, 'GLYPH SLOT', { size: 8.5, w: 700, ls: 0.5 }));
  g.push(T(X + 68, Y + 154, '“The Lattice”', { size: 9, fill: C.mute }));
  g.push(T(X + 68, Y + 166, '32px in S3 · 44px here', { size: 8, mono: true, fill: C.faint }));
  g.push(para(X + 16, Y + 188, 'Rendered by the same canvas engine as the Ti info page (src/engines/ti-glyph.js), parameterised by this function’s live state. Cap height of the “Ti” label is 1.5x the glyph box; the glyph is ~2% of row area. It is an index back to the page the user studied, never the primary anchor.', 168, { size: 9.5 }));
  g.push(R(X + 16, Y + 300, 60, 18, { fill: C.f2, stroke: C.rule2, r: 9 }));
  g.push(T(X + 46, Y + 313, 'FULL', { size: 9, w: 700, ls: 0.5, anchor: 'middle' }));
  g.push(R(X + 82, Y + 300, 74, 18, { fill: C.dark, stroke: null, r: 9 }));
  g.push(T(X + 119, Y + 313, 'ROUTED WORK', { size: 8, w: 700, ls: 0.4, fill: '#fff', anchor: 'middle' }));
  g.push(para(X + 16, Y + 332, 'ROUTED WORK appears when this function is absorbing a demand for a function the stack does not carry.', 168, { size: 9, fill: C.mute }));

  /* B — expression stream */
  g.push(L(X + 546, Y + 12, X + 546, Y + H - 12, { stroke: C.rule }));
  g.push(KICK(X + 212, Y + 26, 'b · expression stream (readout a)', { size: 8 }));
  const lines = [
    'The diagram on that slide is mine.',
    'Not adapted. The same three boundaries.',
    'They cannot answer a question about it.',
    'Credit follows authorship. That is the rule.',
    'One question would end this cleanly.',
  ];
  lines.forEach((ln, i) => {
    g.push(T(X + 212, Y + 50 + i * 20, ln, { size: 11.5, fill: i === lines.length - 1 ? C.ink : C.ink2, op: 0.45 + i * 0.14 }));
    g.push(T(X + 500, Y + 50 + i * 20, `b${8 + i}`, { size: 8, mono: true, fill: C.faint }));
  });
  g.push(R(X + 212 + 232, Y + 132, 6, 11, { fill: C.ink, stroke: null }));
  g.push(T(X + 212, Y + 160, 'oldest fades · newest solid · 5 lines at FULL, 3 at MID, 2 at LOW', { size: 8.5, fill: C.faint }));
  g.push(R(X + 212, Y + 176, 320, 54, { fill: 'url(#pFore)', stroke: C.ink, sw: 1.2, dash: '4 3', r: 2 }));
  g.push(T(X + 220, Y + 192, 'PROJECTED — appears on hover only', { size: 8.5, w: 700, mono: true, ls: 0.3 }));
  g.push(T(X + 220, Y + 208, '“The claim is false and the proof is two', { size: 10.5, style: 'italic', fill: C.ink2 }));
  g.push(T(X + 220, Y + 222, 'clicks away.”', { size: 10.5, style: 'italic', fill: C.ink2 }));
  g.push(para(X + 212, Y + 248, 'Boxed and offset, never merged into the stream. A projected sentence must never be mistakable for something the psyche actually said. Source: action.voices[fn] — pre-authored per (scenario, function, action, state), not generated.', 320, { size: 9.5, fill: C.mute }));
  g.push(KICK(X + 212, Y + 320, 'stream mechanics', { size: 8 }));
  g.push(para(X + 212, Y + 334, 'Lines arrive on beats, not on a timer. Within a beat, a line types in over ~420ms and then stops. Under reduced-motion it appears whole. Six DOM nodes maximum, recycled — the stream never grows the document.', 320, { size: 9.5 }));

  /* C — seismograph */
  g.push(KICK(X + 562, Y + 26, 'c · seismograph (readout b)', { size: 8 }));
  g.push(seismo(X + 562, Y + 38, 420, 160, { shape: 'rising', beats: 20, forecast: defaultSeries(6, 'rising') }));
  g.push(L(X + 562, Y + 206, X + 562 + 420 * 0.72, Y + 206, { stroke: C.ink, sw: 1.2 }));
  g.push(T(X + 562 + 210 * 0.72, Y + 220, 'COMMITTED HISTORY — solid ink, never redrawn on hover', { size: 8.5, w: 600, anchor: 'middle' }));
  g.push(L(X + 562 + 420 * 0.72, Y + 206, X + 982, Y + 206, { stroke: C.ink, sw: 1.2, dash: '4 3' }));
  g.push(T(X + 562 + 420 * 0.86, Y + 232, 'RESERVED', { size: 8.5, w: 700, anchor: 'middle' }));
  g.push(T(X + 562 + 420 * 0.86, Y + 244, '28% · empty at rest', { size: 8, anchor: 'middle', fill: C.mute }));
  g.push(T(X + 562, Y + 262, 'stress 26', { size: 15, w: 700, mono: true }));
  g.push(T(X + 646, Y + 262, '+14', { size: 17, w: 700, mono: true }));
  g.push(T(X + 690, Y + 262, 'forecast delta', { size: 8.5, fill: C.mute }));
  g.push(para(X + 562, Y + 278, 'x = beat index. One scenario run contributes 8 beats: 4 intake (one per function, in stack order), 1 commit, 3 aftermath. Idle time animates decay but advances no beat.', 420, { size: 9.5 }));

  /* D — scalar cluster */
  g.push(L(X + 562, Y + 316, X + 982, Y + 316, { stroke: C.rule2 }));
  g.push(KICK(X + 562, Y + 336, 'd · scalar cluster (readouts c, d, e)', { size: 8 }));
  g.push(KICK(X + 562, Y + 356, 'pleasure', { size: 7.5 }));
  g.push(meter(X + 562, Y + 362, 200, { v: 0.34, fv: 0.52, h: 10 }));
  g.push(T(X + 772, Y + 372, '34', { size: 13, mono: true, w: 700 }));
  g.push(T(X + 796, Y + 372, '+18', { size: 13, mono: true, w: 700 }));
  g.push(KICK(X + 562, Y + 392, 'involvement share', { size: 7.5 }));
  g.push(meter(X + 562, Y + 398, 200, { v: 0.42, fv: 0.55, h: 10 }));
  g.push(T(X + 772, Y + 408, '42%', { size: 13, mono: true, w: 700 }));
  g.push(T(X + 806, Y + 408, '+13', { size: 13, mono: true, w: 700 }));
  g.push(KICK(X + 562, Y + 428, 'energy / capacity', { size: 7.5 }));
  g.push(capacityMeter(X + 562, Y + 434, 200, { remaining: 0.78, cost: 0.28, h: 12 }));
  g.push(T(X + 772, Y + 444, '78', { size: 13, mono: true, w: 700 }));
  g.push(T(X + 796, Y + 444, '−28', { size: 13, mono: true, w: 700 }));
  g.push(T(X + 562, Y + 458, 'fill = remaining · hatch = this action takes · past zero = DEBT', { size: 8.5, fill: C.faint }));

  /* E — delta gutter */
  g.push(R(X + 1004, Y + 12, 160, H - 24, { fill: C.f0, stroke: C.ink, sw: 1.2 }));
  g.push(KICK(X + 1016, Y + 30, 'e · delta gutter', { size: 8 }));
  const dl = [['STRESS', '+14'], ['PLEASURE', '+18'], ['SHARE', '+13'], ['ENERGY', '−28'], ['NET COST', '42']];
  dl.forEach(([lab, val], i) => {
    g.push(T(X + 1084, Y + 74 + i * 62, val, { size: 24, w: 700, mono: true, anchor: 'middle' }));
    g.push(T(X + 1084, Y + 90 + i * 62, lab, { size: 8, w: 700, ls: 0.5, fill: C.mute, anchor: 'middle' }));
    if (i < dl.length - 1) g.push(L(X + 1016, Y + 104 + i * 62, X + 1152, Y + 104 + i * 62, { stroke: C.rule2 }));
  });
  g.push(T(X + 1084, Y + H - 30, 'empty at rest', { size: 8.5, fill: C.faint, anchor: 'middle' }));

  /* fidelity tier comparison */
  g.push(L(24, 592, 1416, 592, { stroke: C.ink, sw: 1.2 }));
  g.push(KICK(24, 612, 'fidelity tiers — density is solved by removing components, never by shrinking them', { size: 9 }));
  const tiers = [
    { t: 'FULL', sub: 'dominant, or any focused row', has: ['5 stream lines', '104px seismograph', 'labelled meters', 'delta gutter', 'glyph 32px'], not: [] },
    { t: 'MID', sub: 'auxiliary', has: ['3 stream lines', '84px seismograph', 'labelled meters', 'delta gutter', 'glyph 28px'], not: [] },
    { t: 'LOW', sub: 'tertiary + inferior', has: ['2 stream lines', '58/46px seismograph', 'delta gutter', 'glyph 24/22px'], not: ['meter labels dropped', 'stress numeral only'] },
  ];
  tiers.forEach((t, i) => {
    const tx = 24 + i * 466;
    g.push(R(tx, 626, 440, 176, { fill: C.f0, stroke: C.rule }));
    g.push(R(tx, 626, 440, 26, { fill: C.f2, stroke: C.rule }));
    g.push(T(tx + 12, 644, t.t, { size: 11, w: 700, ls: 0.6 }));
    g.push(T(tx + 60, 644, t.sub, { size: 9.5, fill: C.mute }));
    t.has.forEach((h2, j) => {
      g.push(P(`M${tx + 14} ${666 + j * 20} l5 5 l9 -11`, { stroke: C.ink, sw: 1.6, cap: 'round' }));
      g.push(T(tx + 34, 671 + j * 20, h2, { size: 10 }));
    });
    t.not.forEach((h2, j) => {
      const yy = 666 + (t.has.length + j) * 20;
      g.push(P(`M${tx + 14} ${yy} l12 12 M${tx + 26} ${yy} l-12 12`, { stroke: C.faint, sw: 1.4, cap: 'round' }));
      g.push(T(tx + 34, yy + 11, h2, { size: 10, fill: C.mute }));
    });
  });
  g.push(T(24, 828, 'A row promotes to FULL on keyboard focus or sustained pointer rest, and demotes when focus leaves. Grip promotes the inferior to FULL and demotes the dominant to MID — the tiering is itself a readout of the state.', { size: 11, fill: C.mute }));

  const calls = [cal(1, 30, 116), cal(2, 40, 132, {}), cal(3, 206, 116), cal(4, 206, 182), cal(5, 556, 116), cal(6, 24 + 562 + 420 * 0.72, 116), cal(7, 556, 336), cal(8, 1032, 116), cal(9, 30, 606), cal(10, 30, 400), cal(11, 556, 268), cal(12, 24 + 562, 522)];
  return g.join('') + calls.join('');
}

export const S5_LEGEND = [
  { n: 1, t: 'The Reaction Window as a whole', d: 'One function’s complete apparatus: identity, stream, seismograph, scalar cluster, delta gutter. Five regions in a fixed left-to-right order that is identical in all four rows of S3, so column position alone identifies a readout.', hover: 'Every region except the identity gutter responds to action hover.', commit: 'All regions step one beat together.', state: 'Loop and Grip rewrite the contents of every region; none of them are hidden or added.' },
  { n: 2, t: 'Glyph slot — exact placement and size', d: 'Pinned in the identity gutter below the label, 32px in the S3 dominant row (28 / 24 / 22 for aux / tert / inf), 44px here. The two-letter label above it is set at 30px in S3 — roughly 1.5x the glyph box cap height — so the label wins the hierarchy and the glyph reads as an index mark. It is drawn by the same canvas engine as the function’s own info page and is parameterised by live state, so it breathes; it is never the interactive target and never the primary anchor.', hover: 'Inert.', commit: 'Unchanged.', state: 'Grip is the single exception: the inferior’s glyph steps to 32px, marking a function promoted by force.' },
  { n: 3, t: 'Expression stream', d: 'Five lines at FULL. Newest solid at the bottom, older lines fading upward, each tagged with the beat that produced it. This is readout (a).', hover: 'Live lines are untouched; the projection appears separately below.', commit: 'The projected line is promoted into the stream.', state: 'Loop stalls the bypassed function’s stream mid-sentence; Grip replaces the inferior’s whole register.' },
  { n: 4, t: 'Projected line block', d: 'Hatched, dashed, boxed, and offset from the stream. Never merged. Sourced from authored text keyed by (scenario, function, action, state) — the text corpus is authored, not generated, so the register stays under editorial control.', hover: 'Appears.', commit: 'Promoted and cleared.', state: 'A bypassed function projects nothing and says so.' },
  { n: 5, t: 'Seismograph', d: 'Readout (b). Stress against beat index. Solid for history, dashed inside the reserved band for forecast.', hover: 'Only the reserved band changes.', commit: 'Forecast translates left and hardens.', state: 'Loop shows a regular oscillation; Grip shows a rising trace on the inferior and a flattened one on the dominant.' },
  { n: 6, t: 'NOW rule at 72%', d: 'The fixed divider between record and projection. Its position is constant across every seismograph on every screen, including the aggregate, so the eye learns one boundary.', hover: '—', commit: 'History scrolls one beat left; NOW does not move.', state: 'Unchanged.' },
  { n: 7, t: 'Scalar cluster', d: 'Readouts (c) pleasure, (d) involvement share, (e) energy/capacity, in that fixed vertical order. Level in small type at the right of each meter; forecast delta beside it in large type.', hover: 'Each meter grows a dashed extension or a hatched retraction.', commit: 'Meters animate once and stop.', state: 'Loop freezes the bypassed function’s meters; Grip drives the inferior’s capacity into DEBT.' },
  { n: 8, t: 'Delta gutter', d: 'The four deltas plus a net cost figure. Set at 24px — the largest numerals in the window — because the delta is what the user came for. Empty at rest, which is what makes hover feel like an answer rather than a refresh.', hover: 'Fills.', commit: 'Empties; values fold into the S9 receipt.', state: 'Carries a state-attribution tag when the state rather than the action caused the delta.' },
  { n: 9, t: 'Fidelity tiers', d: 'The three rendering tiers side by side. The rule is strict: lower tiers remove whole components; they never render the same component smaller. A 6px stream line would be unreadable and dishonest — a removed stream line is honest.', hover: '—', commit: '—', state: 'Grip promotes the inferior to FULL and demotes the dominant to MID.' },
  { n: 10, t: 'Routed-work badge', d: 'Marks that this function is absorbing a demand for a function the stack does not carry — Te work arriving at Ti. It changes the register of the stream text, not only the price, so the user sees the same job done in a different manner.', hover: 'Appears on hover when the hovered action routes into this function.', commit: 'The surcharge is itemised separately in the receipt.', state: 'Unchanged.' },
  { n: 11, t: 'Stress numeral and its delta', d: 'The one number that also exists as a curve. Kept adjacent to the trace so the trace stays unlabelled — no gridlines, no y-axis ticks. The curve carries shape; the numeral carries value.', hover: 'Delta appears beside the level.', commit: 'Level updates.', state: '—' },
  { n: 12, t: 'Debt boundary', d: 'The capacity meter is the only readout that can go negative. Past zero it hatches in the opposite direction and labels itself DEBT. Debt is not a block: the action still happens. It applies a per-beat stress penalty until repaid, which is how the model expresses that anything is doable and the bill varies.', hover: 'Overflow renders as DEBT before commitment.', commit: 'Debt persists across scenario runs in the session.', state: 'Grip is usually entered from debt rather than from stress alone.' },
];
