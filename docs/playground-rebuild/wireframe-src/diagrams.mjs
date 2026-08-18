/* D1–D6 */
import { C, T, R, L, P, CIR, KICK, glyph, FNS, meter, seismo, defaultSeries, para, paraH, cal, NOW_FRAC } from './lib.mjs';

/* ---------- diagram atoms ---------- */
function node(x, y, w, h, o = {}) {
  const g = [];
  g.push(R(x, y, w, h, { fill: o.fill || C.f0, stroke: o.stroke || C.ink, sw: o.sw || 1.4, dash: o.dash, r: o.r ?? 3 }));
  if (o.tag) {
    g.push(R(x, y, o.tag.length * 6.2 + 14, 16, { fill: C.dark, stroke: null }));
    g.push(T(x + (o.tag.length * 6.2 + 14) / 2, y + 12, o.tag, { size: 9, w: 700, ls: 0.5, fill: '#fff', anchor: 'middle' }));
  }
  const ty = o.tag ? y + 32 : y + 20;
  g.push(T(x + 12, ty, o.title, { size: o.ts || 12.5, w: 700, fill: o.ink || C.ink }));
  if (o.sub) g.push(T(x + 12, ty + 13, o.sub, { size: 9, fill: o.ink ? o.ink : C.mute }));
  if (o.body) g.push(para(x + 12, ty + (o.sub ? 28 : 16), o.body, w - 24, { size: 9.5, fill: o.ink || C.ink2 }));
  return g.join('');
}

function arrow(pts, o = {}) {
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join(' ');
  return P(d, { stroke: o.stroke || C.ink, sw: o.sw || 1.5, dash: o.dash, marker: o.marker === false ? null : (o.marker || 'arw'), join: 'round' });
}

function edgeLabel(x, y, lines, o = {}) {
  const w = Math.max(...lines.map((l) => l.length)) * 5.1 + 12;
  const g = [R(x - w / 2, y - 11, w, lines.length * 12 + 6, { fill: C.page, stroke: o.stroke || null, sw: 0.8, r: 2 })];
  lines.forEach((l, i) => g.push(T(x, y - 1 + i * 12, l, { size: 9, mono: o.mono, anchor: 'middle', fill: o.fill || C.ink2, w: o.w })));
  return g.join('');
}

/* ============================================================ D1 */
export function D1() {
  const g = [];
  g.push(KICK(24, 30, 'd1 · screen map — what is a route, and what is only a state of one', { size: 9 }));
  g.push(T(24, 56, 'Four routes. Six of the ten “screens” are disclosures or states of S3.', { size: 17, w: 700 }));
  g.push(para(24, 74, 'This is the structural claim of the whole rebuild: the Playground is one screen that changes, not a set of screens you travel between. Every route change costs the user their sense of continuity with the simulation, so there are only three of them after setup.', 1000, { size: 11 }));

  /* route lane */
  g.push(KICK(24, 132, 'routes — url changes, full mount, focus reset', { size: 8.5 }));
  g.push(R(24, 142, 1392, 150, { fill: C.f1, stroke: C.rule, dash: '5 4' }));
  const routes = [
    { x: 44, t: 'S1', n: 'Stack assembly', s: '/playground', b: 'Two choices, two entailments. Exit is disabled until slot 2 exists.' },
    { x: 384, t: 'S2', n: 'Scenario + briefing', s: '/playground#brief', b: 'Predispositions, cost gates, carry-in from the previous run.' },
    { x: 724, t: 'S3', n: 'The run', s: '/playground#run', b: 'The Ledger. Everything below lives inside this one mount.' },
    { x: 1064, t: 'S9', n: 'Resolution', s: '/playground#resolve', b: 'Receipt, transition, counterfactual. The only true terminal.' },
  ];
  routes.forEach((r, i) => {
    g.push(node(r.x, 162, 300, 112, { tag: r.t, title: r.n, sub: r.s, body: r.b, fill: C.f0 }));
    if (i < 3) g.push(arrow([[r.x + 300, 218], [r.x + 340, 218]]));
  });
  g.push(arrow([[1364, 274], [1364, 306], [194, 306], [194, 274]], { dash: '5 4' }));
  g.push(edgeLabel(780, 310, ['next scenario — same vessel, wear carried forward'], { stroke: C.rule }));

  /* state lane */
  g.push(KICK(24, 352, 'states and disclosures of s3 — no route change, no unmount, no lost beat', { size: 8.5 }));
  g.push(R(724, 366, 692, 456, { fill: C.f1, stroke: C.ink, sw: 1.8 }));
  g.push(T(740, 388, 'S3 — one mount', { size: 13, w: 700 }));
  g.push(T(740, 402, 'the simulation clock never stops inside this box', { size: 9, fill: C.mute }));
  g.push(arrow([[874, 274], [874, 366]], { dash: '3 3' }));

  const inner = [
    { x: 740, y: 414, t: 'S4', n: 'Hover forecast', b: 'Transient. Pointer or key. Nothing spent.', how: 'INPUT STATE' },
    { x: 1080, y: 414, t: 'S5', n: 'Row expanded', b: 'One Reaction Window at FULL, in place.', how: 'DISCLOSURE' },
    { x: 740, y: 528, t: 'S6', n: 'Aggregate expanded', b: 'The band grows into the full apparatus.', how: 'DISCLOSURE' },
    { x: 1080, y: 528, t: 'S7', n: 'Loop active', b: 'Every readout rewritten. Deck regenerated.', how: 'SIM STATE' },
    { x: 740, y: 642, t: 'S8', n: 'Grip active', b: 'Row heights swap. Inferior promoted to FULL.', how: 'SIM STATE' },
    { x: 1080, y: 642, t: 'S10', n: 'Narrow viewport', b: 'Accordion + sheet. Same mount, same state.', how: 'VIEWPORT' },
  ];
  inner.forEach((n) => {
    g.push(node(n.x, n.y, 320, 96, { tag: n.t, title: n.n, body: n.b, fill: C.f0 }));
    g.push(T(n.x + 308, n.y + 12, n.how, { size: 8, w: 700, ls: 0.5, fill: C.mute, anchor: 'end' }));
  });
  g.push(arrow([[900, 510], [900, 528]], { dash: '3 3', marker: false }));
  g.push(T(740, 762, 'S7 and S8 are simulation states: they are entered by the engine or by an override, never by navigation.', { size: 10, fill: C.ink2 }));
  g.push(T(740, 778, 'S4, S5, S6 and S10 are presentation states: they change what is disclosed, never what is true.', { size: 10, fill: C.ink2 }));
  g.push(T(740, 800, 'Consequence for implementation: one component owns the run; none of these six may unmount it.', { size: 10, w: 700 }));

  /* left column: what the user carries between routes */
  g.push(node(24, 366, 300, 200, { title: 'Session state', sub: 'outlives every route', body: 'Vessel (the stack), per-function capacity, stress, and debt, the beat ring buffer, the current machine state, and the run log. Cleared only by Reset Vessel. This is what makes automatic Loop and Grip possible at all, given one-action scenarios.', fill: C.f0, sw: 1.8 }));
  g.push(node(24, 586, 300, 150, { title: 'Run state', sub: 'lives for one scenario', body: 'The chosen scenario, its resolved cost gates, the deck (authored plus generated), the hovered action, and the eight beats this run contributes.', fill: C.f0 }));
  g.push(node(24, 756, 300, 96, { title: 'Transient state', sub: 'lives for one pointer gesture', body: 'The forecast. Discarded on pointer-out with no trace and no cost.', fill: C.f0, dash: '4 3' }));

  /* middle column: entry points */
  g.push(node(360, 366, 330, 130, { title: 'Entry points', body: 'Cold start → S1. Deep link with a type code → S2 with a fresh vessel. Return from a function info page → S3 with the run intact. Every function page carries a “try it in the Playground” affordance that preserves state.', fill: C.f0 }));
  g.push(node(360, 512, 330, 150, { title: 'Exits', body: 'To a function’s own info page from any glyph (opens in place, returns to the same beat). To the counterfactual runner from S9. To Reset, which is the only destructive action in the flow and is confirmed.', fill: C.f0 }));
  g.push(node(360, 678, 330, 174, { title: 'What has no screen', body: 'There is no settings screen, no help screen, and no tutorial screen. Every explanation is printed adjacent to the thing it explains — the aggregation formulas sit in S6, the entailment rule sits in S1, the hover contract sits in S4. A help route would be an admission that the primary screens failed.', fill: C.f0, dash: '4 3' }));

  const calls = [cal(1, 30, 138), cal(2, 730, 358), cal(3, 30, 360), cal(4, 366, 360), cal(5, 366, 672), cal(6, 780, 312), cal(7, 1408, 420), cal(8, 30, 750)];
  return g.join('') + calls.join('');
}

export const D1_LEGEND = [
  { n: 1, t: 'The route lane — four real screens', d: 'S1, S2, S3, S9. Each is a full mount with a URL and a focus reset. Everything else in the ten is inside S3. Keeping this number at four is a deliberate constraint: navigation is the main way a live simulation loses a user.', hover: '—', commit: 'S3 → S9 is the only route triggered by a commit.', state: 'Simulation state never causes a route change.' },
  { n: 2, t: 'The S3 container — one mount', d: 'The load-bearing structural claim. Hover, row expansion, aggregate expansion, loop, grip, and the narrow viewport are all the same mounted component. Nothing inside this box may unmount the run, because the beat clock and the ring buffer live here.', hover: '—', commit: '—', state: 'Loop and Grip change the contents of this box, never its identity.' },
  { n: 3, t: 'Session state', d: 'Outlives routes. Holds the vessel, per-function capacity/stress/debt, the beat ring buffer, machine state, and the run log. This is the accumulator that makes automatic Loop and Grip possible even though a scenario is only one committed action.', hover: '—', commit: 'Written on every commit.', state: 'Carries Loop and Grip across scenario runs.' },
  { n: 4, t: 'Entry points', d: 'Three ways in, and the important one is the third: returning from a function’s own info page must land back on the same beat. The Playground and the eight info pages are one product, and the glyph in every row is the seam between them.', hover: '—', commit: '—', state: '—' },
  { n: 5, t: 'Exits', d: 'The only destructive exit is Reset Vessel, and it is confirmed because it discards the session accumulator — which is the thing the whole Loop/Grip mechanic is built on.', hover: '—', commit: '—', state: 'Reset also clears Loop/Grip.' },
  { n: 6, t: 'The session loop', d: 'S9 returns to S2, not to S1. The vessel persists, so the second scenario is entered by a psyche with spent capacity and carried stress. This edge is where the difficulty curve lives; without it the product is a set of disconnected demos.', hover: '—', commit: '—', state: 'A vessel in Loop or Grip enters the next scenario still in it.' },
  { n: 7, t: 'S10 is a viewport, not a screen', d: 'The narrow layout is the same mount, the same state, and the same simulation — a different arrangement. It is listed among the ten only because it needs its own wireframe, not because it is a destination.', hover: 'Press-and-hold replaces hover; the contract is identical.', commit: 'Identical.', state: 'Identical.' },
  { n: 8, t: 'The absence of a help route', d: 'No settings, no help, no tutorial. Explanation is printed adjacent to the mechanism it explains. Listed here explicitly so that a later phase does not quietly add one and take the pressure off the primary screens.', hover: '—', commit: '—', state: '—' },
];

/* ============================================================ D2 */
export function D2() {
  const g = [];
  g.push(KICK(24, 30, 'd2 · primary user flow', { size: 9 }));
  g.push(T(24, 56, 'Land → assemble → choose → forecast → commit → observe → state → recover or spiral → resolve', { size: 16, w: 700 }));
  g.push(para(24, 74, 'One committed action per scenario run. The loop that matters is not inside a run — it is the session loop at the bottom, where a vessel re-enters carrying its wear.', 1100, { size: 11 }));

  const step = (x, y, w, h, tag, title, body, o = {}) => node(x, y, w, h, { tag, title, body, fill: o.fill || C.f0, dash: o.dash, sw: o.sw });

  /* main spine */
  g.push(step(24, 120, 200, 104, 'S1', 'Assemble', 'Pick a dominant, then one of exactly two legal auxiliaries. Slots 3 and 4 fill themselves.'));
  g.push(arrow([[224, 172], [258, 172]]));
  g.push(step(258, 120, 200, 104, 'S2', 'Brief', 'Read what each of the four already brings, and what the vessel is carrying in.'));
  g.push(arrow([[458, 172], [492, 172]]));
  g.push(step(492, 120, 200, 104, 'S3', 'Observe at rest', 'Four intake beats fire, one per function, in stack order. Nothing is spent.'));
  g.push(arrow([[692, 172], [726, 172]]));
  g.push(step(726, 120, 200, 104, 'S4', 'Forecast', 'Hover, or press-and-hold. All five readouts on all four rows project. Reversible, free, unlimited.', { dash: '4 3' }));
  g.push(edgeLabel(826, 246, ['leave the card — screen restores exactly'], { stroke: C.rule }));
  g.push(arrow([[726, 224], [700, 260], [826, 260]], { dash: '3 3', sw: 1.2 }));
  g.push(arrow([[926, 172], [960, 172]]));
  g.push(step(960, 120, 200, 104, '', 'Compare', 'Move between cards. Five forecasts, one glance each. No beat is consumed by any of it.', { dash: '4 3' }));
  g.push(arrow([[1160, 172], [1194, 172]]));
  g.push(step(1194, 120, 222, 104, '', 'Commit', 'One decisive action. The forecast crosses NOW and becomes history. Energy is actually spent.', { sw: 2.2 }));

  /* beats */
  g.push(arrow([[1305, 224], [1305, 258]]));
  g.push(R(24, 258, 1392, 64, { fill: C.f1, stroke: C.rule }));
  g.push(KICK(38, 278, 'the eight beats of a run — the seismograph x-axis', { size: 8 }));
  const beats = [['b1', 'Ti registers'], ['b2', 'Se registers'], ['b3', 'Ni registers'], ['b4', 'Fe registers'], ['b5', 'ACTION'], ['b6', 'impact'], ['b7', 'spend'], ['b8', 'settle']];
  beats.forEach((b, i) => {
    const bx = 38 + i * 172;
    g.push(R(bx, 288, 160, 24, { fill: i === 4 ? C.dark : C.f0, stroke: C.ink, sw: i === 4 ? 0 : 1 }));
    g.push(T(bx + 10, 304, b[0], { size: 9.5, mono: true, w: 700, fill: i === 4 ? '#fff' : C.ink }));
    g.push(T(bx + 38, 304, b[1], { size: 9.5, fill: i === 4 ? '#fff' : C.ink2 }));
    if (i < 7) g.push(P(`M${bx + 160} 300 l10 0`, { stroke: C.rule, sw: 1.2, marker: 'arwL' }));
  });
  g.push(T(700, 336, 'idle time between b4 and b5 animates decay and streams text, but advances no beat', { size: 9.5, fill: C.mute, anchor: 'middle' }));

  /* evaluation diamond */
  g.push(arrow([[720, 340], [720, 372]]));
  const dx = 720, dy = 424;
  g.push(P(`M${dx} ${dy - 52} L${dx + 168} ${dy} L${dx} ${dy + 52} L${dx - 168} ${dy} Z`, { fill: C.f0, stroke: C.ink, sw: 1.8 }));
  g.push(T(dx, dy - 14, 'evaluate thresholds', { size: 11.5, w: 700, anchor: 'middle' }));
  g.push(T(dx, dy + 2, 'against session-cumulative load', { size: 9, fill: C.mute, anchor: 'middle' }));
  g.push(T(dx, dy + 18, 'see D3 for the exact conditions', { size: 9, mono: true, fill: C.mute, anchor: 'middle' }));

  /* three outcomes */
  g.push(arrow([[dx - 168, dy], [200, dy], [200, 492]]));
  g.push(edgeLabel(384, dy - 12, ['no threshold crossed'], { stroke: C.rule }));
  g.push(step(24, 492, 352, 118, '', 'Stays Balanced or Strained', 'The receipt is the whole event. Margins tighten; nothing is rewritten. This is the common case and it must still feel like something happened — which is what the counterfactual on S9 is for.'));

  g.push(arrow([[dx, dy + 52], [dx, 492]]));
  g.push(edgeLabel(dx, 476, ['aux bypassed under load'], { stroke: C.rule }));
  g.push(step(544, 492, 352, 118, 'S7', 'Loop — Ti–Ni', 'Every readout rewritten. The auxiliary is not consulted. Two alleviate and two aggravate cards are generated into the deck.', { sw: 2 }));

  g.push(arrow([[dx + 168, dy], [1240, dy], [1240, 492]]));
  g.push(edgeLabel(1060, dy - 12, ['stress high AND dominant spent'], { stroke: C.rule }));
  g.push(step(1064, 492, 352, 118, 'S8', 'Grip — Fe', 'Row heights swap; the inferior is promoted to FULL and takes 58% of involvement. The deck’s most attractive cards are the ones that make it worse.', { sw: 2 }));

  /* recover or spiral */
  g.push(arrow([[720, 610], [720, 646]]));
  g.push(arrow([[1240, 610], [1240, 630], [900, 630], [900, 646]], { sw: 1.2 }));
  g.push(R(24, 646, 1392, 118, { fill: C.f1, stroke: C.ink, sw: 1.4 }));
  g.push(KICK(38, 666, 'recover or spiral — the fork the whole mechanic exists to teach', { size: 8.5 }));
  g.push(node(38, 676, 664, 78, { title: 'Recover', sub: 'commit an alleviating action, or spend beats doing nothing', body: 'Alleviate cards route work back to the bypassed or overpowered function. They are cheap, unglamorous, and carry low likelihood — the psyche does not want them. Recovery is its own state; it does not return directly to Balanced.', fill: C.f0 }));
  g.push(node(738, 676, 664, 78, { title: 'Spiral', sub: 'commit an aggravating action — the deck makes this easy', body: 'Aggravate cards are written to sound like relief and carry high likelihood. They pay real short-term pleasure to the state’s own function and charge everything else. Committing one deepens the state and moves the next threshold closer.', fill: C.f0 }));

  g.push(arrow([[370, 754], [370, 790], [500, 790]]));
  g.push(arrow([[1070, 754], [1070, 790], [940, 790]]));
  g.push(node(500, 762, 440, 66, { tag: 'S9', title: 'Resolution', sub: 'receipt · state transition · counterfactual on another psyche', fill: C.f0, sw: 2.2 }));

  g.push(arrow([[940, 790], [1416, 790], [1416, 840], [24, 840], [24, 172], [24, 172]], { dash: '5 4', sw: 1.2 }));
  g.push(edgeLabel(720, 844, ['SESSION LOOP — next scenario, same vessel, wear carried forward. This edge is the difficulty curve.'], { stroke: C.ink, w: 700 }));

  const calls = [cal(1, 736, 116), cal(2, 826, 264), cal(3, 30, 262), cal(4, 720, 372), cal(5, 550, 488), cal(6, 1070, 488), cal(7, 44, 672), cal(8, 744, 672), cal(9, 720, 856), cal(10, 1200, 116)];
  return g.join('') + calls.join('');
}

export const D2_LEGEND = [
  { n: 1, t: 'Forecast is a dead end by design', d: 'Drawn dashed with a return edge, because it is the only step in the flow with no forward obligation. A user may enter and leave it any number of times at zero cost. Every other node in this diagram advances something.', hover: 'This node IS the hover.', commit: 'Exiting forward requires an explicit commit gesture.', state: 'Identical in all states.' },
  { n: 2, t: 'The return edge', d: 'Leaving a card restores the resting screen exactly — same beat, same values, same trace. Drawn explicitly because a simulation that leaks state on pointer-out destroys the user’s willingness to explore, and exploration is how the model is learned.', hover: '—', commit: '—', state: '—' },
  { n: 3, t: 'The eight beats', d: 'One run contributes eight beats: four intake (one per function, in stack order), one commit, three aftermath. Intake beats mean the seismograph has meaningful history before the user has done anything, and that history teaches stack order for free.', hover: 'No beat consumed.', commit: 'Consumes b5 and then plays b6–b8 automatically.', state: 'Loop and Grip change what the intake beats produce, not how many there are.' },
  { n: 4, t: 'Threshold evaluation happens once, after commit', d: 'Not continuously, and not during hover. Evaluating on commit is what makes the forecast honest — the user is shown the projected crossing before it happens, and it then either happens or does not, with no hidden re-evaluation in between.', hover: 'Forecast shows the projected crossing.', commit: 'Evaluated against session-cumulative load.', state: 'Manual override bypasses this node entirely.' },
  { n: 5, t: 'Loop branch', d: 'Entered when the auxiliary is starved while the dominant and tertiary are loaded. It is a rewriting of the same screen, never a new one.', hover: '—', commit: '—', state: 'Carries into the next scenario run.' },
  { n: 6, t: 'Grip branch', d: 'Entered when aggregate stress is high and the dominant is spent — typically from debt rather than from stress alone. Also reachable from a held Loop, which is the most common route.', hover: '—', commit: '—', state: 'Carries into the next scenario run.' },
  { n: 7, t: 'Recover', d: 'A real, selectable path with real costs, not an undo. Alleviating actions are deliberately unattractive and low-likelihood, because the interesting fact about recovery is that it is available and still not chosen.', hover: 'Forecast shows the state exiting.', commit: 'May cross the recovery threshold.', state: 'Leads to Recovery, never straight to Balanced.' },
  { n: 8, t: 'Spiral', d: 'Aggravating actions pay genuine short-term pleasure to the state’s own function while charging everything else. If the destructive option did not feel good, the mechanic would teach nothing.', hover: 'Forecast exposes the trade the wording conceals.', commit: 'Deepens the state.', state: 'From Loop this is the usual path into Grip.' },
  { n: 9, t: 'The session loop', d: 'The single most important edge in the diagram. Resolution returns to scenario choice with the vessel intact, so wear accumulates across runs. This is what turns four isolated demos into a difficulty curve, and it is what makes automatic Loop and Grip reachable at all under one-action scenarios.', hover: '—', commit: '—', state: 'A vessel in Loop or Grip re-enters still in it, and its deck is already regenerated.' },
  { n: 10, t: 'Commit is the only irreversible step', d: 'Everything to its left is free and repeatable; everything to its right is history. Drawn with the heaviest border in the diagram. There is no undo — a user who wants a different outcome runs the counterfactual, which is a better lesson than an undo would be.', hover: '—', commit: 'Spends energy, writes beats, evaluates thresholds.', state: '—' },
];

/* ============================================================ D3 */
export function D3() {
  const g = [];
  g.push(KICK(24, 30, 'd3 · state machine', { size: 9 }));
  g.push(T(24, 56, 'Balanced · Strained · Loop · Grip · Recovery', { size: 17, w: 700 }));
  g.push(para(24, 74, 'Evaluated once per commit, against session-cumulative load. Every threshold has hysteresis: the value that exits a state is never the value that entered it, because a machine without hysteresis flickers at the boundary and a flickering state teaches nothing.', 1180, { size: 11 }));

  const st = (x, y, w, h, name, sub, body, o = {}) => {
    const gg = [R(x, y, w, h, { fill: o.fill || C.f0, stroke: C.ink, sw: o.sw || 1.6, r: 6 })];
    gg.push(T(x + 14, y + 26, name, { size: 15, w: 700, ls: 0.5, fill: o.ink || C.ink }));
    gg.push(T(x + 14, y + 40, sub, { size: 9, fill: o.ink || C.mute }));
    gg.push(para(x + 14, y + 56, body, w - 28, { size: 9.5, fill: o.ink || C.ink2 }));
    return gg.join('');
  };

  g.push(st(60, 148, 250, 130, 'BALANCED', 'the resting state', 'All four consulted. Stress decaying on every function. No debt. Involvement roughly tracks rank.'));
  g.push(st(430, 148, 250, 130, 'STRAINED', 'load, but no structural failure', 'Aggregate stress above 55. Everything still works; it costs more. Most runs live and die here, and that is correct.', { fill: C.f1 }));
  g.push(st(430, 372, 250, 148, 'LOOP', 'dom + tert firing, aux bypassed', 'Ti–Ni for an ISTP. The auxiliary’s involvement collapses; its stress stops decaying. Feels like progress because it is periodic.', { fill: C.f2 }));
  g.push(st(820, 372, 250, 148, 'GRIP', 'inferior hijack', 'Fe for an ISTP. Row heights swap; the inferior takes the majority of involvement. Usually entered from debt, not from stress alone.', { fill: C.dark, ink: '#ffffff' }));
  g.push(st(820, 148, 250, 148, 'RECOVERY', 'the only exit from Grip', 'Decay runs at 1.6x. Capacity returns slowly. Debt does not clear itself. Cannot be skipped, and cannot complete while any function is in debt.', { fill: C.f1 }));

  /* automatic edges */
  g.push(arrow([[310, 196], [430, 196]], { sw: 1.8 }));
  g.push(edgeLabel(370, 178, ['S_human ≥ 55'], { mono: true, w: 700 }));
  g.push(arrow([[430, 236], [310, 236]], { sw: 1.8 }));
  g.push(edgeLabel(370, 254, ['S_human < 40', 'and debt = 0'], { mono: true }));

  g.push(arrow([[520, 278], [520, 372]], { sw: 1.8 }));
  g.push(edgeLabel(596, 306, ['loopPressure > 35', 'AND share_aux < 0.08', 'sustained ≥ 2 commits'], { mono: true, stroke: C.rule }));
  g.push(arrow([[590, 372], [590, 278]], { sw: 1.8 }));
  g.push(edgeLabel(340, 330, ['share_aux ≥ 0.18 on a commit', 'AND stress_dom < 55'], { mono: true, stroke: C.rule }));

  g.push(arrow([[680, 424], [820, 424]], { sw: 1.8 }));
  g.push(edgeLabel(750, 406, ['loop held ≥ 3 beats', 'AND S_human ≥ 85'], { mono: true, stroke: C.rule }));

  g.push(arrow([[680, 200], [680, 120], [1010, 120], [1010, 148]], { sw: 1.8 }));
  g.push(edgeLabel(846, 116, ['S_human ≥ 78 AND cap_dom ≤ 15 AND the action violates a dom/aux mandate'], { mono: true, stroke: C.rule }));

  g.push(arrow([[945, 372], [945, 296]], { sw: 1.8 }));
  g.push(edgeLabel(1145, 334, ['S_human < 62 — reachable only by an', 'alleviating commit or by idle decay'], { mono: true, stroke: C.rule }));

  g.push(arrow([[820, 222], [310, 222]], { sw: 1.8, dash: null }));
  g.push(edgeLabel(560, 96, ['S_human < 40 AND debt = 0 AND cap_dom ≥ 30'], { mono: true, stroke: C.rule }));
  g.push(arrow([[880, 296], [880, 340], [1120, 340], [1120, 446], [1070, 446]], { sw: 1.4 }));
  g.push(edgeLabel(1160, 372, ['relapse:', 'S_human ≥ 78'], { mono: true, stroke: C.rule }));

  /* manual override edges */
  g.push(R(60, 566, 1010, 116, { fill: C.f1, stroke: C.ink, sw: 1.4, dash: '5 4' }));
  g.push(KICK(76, 588, 'manual override edges — the teaching device', { size: 8.5 }));
  g.push(T(76, 612, 'ANY STATE', { size: 12, w: 700 }));
  g.push(arrow([[176, 608], [252, 608]], { dash: '5 3' }));
  g.push(T(264, 612, 'LOOP (MANUAL)', { size: 12, w: 700 }));
  g.push(arrow([[400, 608], [468, 608]], { dash: '5 3' }));
  g.push(T(480, 612, 'GRIP (MANUAL)', { size: 12, w: 700 }));
  g.push(arrow([[616, 608], [684, 608]], { dash: '5 3' }));
  g.push(T(696, 612, 'toggle off → RECOVERY', { size: 12, w: 700 }));
  g.push(para(76, 630, 'A manually entered state is tagged MANUAL everywhere it is reported, costs no beat and no energy to enter, and satisfies no automatic exit condition — committing an alleviating action inside a manual Loop lowers the numbers but does not leave the state. The user toggles back out, and the exit routes to Recovery, not to Balanced, so the wear is still real. This keeps the override useful as a demonstration without letting it become a way to cheat the economy.', 970, { size: 10 }));

  /* invariants */
  g.push(R(1100, 566, 316, 286, { fill: C.f0, stroke: C.ink, sw: 1.4 }));
  g.push(KICK(1116, 588, 'invariants', { size: 8.5 }));
  const inv = [
    'Exactly one state at a time. Loop and Grip are not simultaneous; Grip supersedes Loop on entry.',
    'Evaluated once per commit, never on hover, never on a timer.',
    'Every threshold has hysteresis. Entry and exit values differ by at least 12 points.',
    'Grip has exactly one exit: Recovery. There is no direct Grip → Balanced edge at any threshold.',
    'Recovery cannot complete while debt is outstanding, which is why it takes beats rather than a click.',
    'Manual states never auto-exit and are always labelled.',
  ];
  let iy = 606;
  inv.forEach((s, i) => {
    g.push(T(1116, iy + 8, `${i + 1}`, { size: 9.5, w: 700, mono: true }));
    g.push(para(1134, iy + 8, s, 268, { size: 9.5 }));
    iy += paraH(s, 268, { size: 9.5 }) + 12;
  });

  /* threshold table */
  g.push(R(60, 700, 1010, 152, { fill: C.f0, stroke: C.rule }));
  g.push(KICK(76, 720, 'the numbers, in one place — all are invented defaults for tuning, not derived from theory', { size: 8.5 }));
  const cols = ['transition', 'condition', 'hysteresis gap', 'who can trigger it'];
  cols.forEach((c2, i) => g.push(T(76 + i * 250, 740, c2.toUpperCase(), { size: 8, w: 700, ls: 0.5, fill: C.mute })));
  const rowsT = [
    ['Balanced → Strained', 'S_human ≥ 55', '15 pts (exit at 40)', 'engine only'],
    ['Strained → Loop', 'loopPressure > 35, share_aux < 0.08, 2 commits', 'share 0.08 / 0.18', 'engine or manual'],
    ['Strained → Grip', 'S_human ≥ 78, cap_dom ≤ 15, mandate violated', '16 pts (exit at 62)', 'engine or manual'],
    ['Loop → Grip', 'held ≥ 3 beats and S_human ≥ 85', 'n/a — one-way', 'engine or manual'],
    ['Grip → Recovery', 'S_human < 62', '16 pts', 'engine, alleviate, or toggle off'],
    ['Recovery → Balanced', 'S_human < 40, debt 0, cap_dom ≥ 30', 'three conditions, all required', 'engine only'],
  ];
  rowsT.forEach((r, i) => {
    const ry = 758 + i * 16;
    g.push(T(76, ry, r[0], { size: 9.5, w: 600 }));
    g.push(T(326, ry, r[1], { size: 9.5, mono: true, fill: C.ink2 }));
    g.push(T(576, ry, r[2], { size: 9.5, mono: true, fill: C.ink2 }));
    g.push(T(826, ry, r[3], { size: 9.5, fill: C.mute }));
    if (i < 5) g.push(L(76, ry + 5, 1054, ry + 5, { stroke: C.rule2 }));
  });

  const calls = [cal(1, 66, 144), cal(2, 436, 144), cal(3, 436, 368), cal(4, 826, 368), cal(5, 826, 144), cal(6, 66, 562), cal(7, 1106, 562), cal(8, 66, 696), cal(9, 596, 340), cal(10, 1150, 300)];
  return g.join('') + calls.join('');
}

export const D3_LEGEND = [
  { n: 1, t: 'BALANCED', d: 'The resting state. All four functions consulted, stress decaying everywhere, no debt, involvement roughly tracking rank. Note that this is not “healthy” — it is simply unloaded. A vessel can be balanced and still make a ruinous choice; the state machine prices consequences, it does not moralise.', hover: '—', commit: 'Re-evaluated after every commit.', state: '—' },
  { n: 2, t: 'STRAINED', d: 'The state most runs live and die in, and the reason it exists as a named state rather than as “Balanced with a high number”: it gives the margin meters something to count toward, and it lets the interface signal load before anything structural has failed.', hover: 'Margins forecast from here.', commit: 'Can transition to Loop or Grip directly.', state: 'Exits back to Balanced only below 40 with no debt.' },
  { n: 3, t: 'LOOP', d: 'Dominant and tertiary firing while the auxiliary is bypassed. Entry needs both a pressure condition and a starvation condition, sustained over two commits — a single lopsided action is not a loop, and treating it as one would make the state meaningless.', hover: '—', commit: 'Held loops raise the grip risk each beat.', state: 'Exits by raising auxiliary involvement above 0.18 on a commit.' },
  { n: 4, t: 'GRIP', d: 'The inferior hijacks. Entry requires high aggregate stress AND a spent dominant AND an action that violates a dominant or auxiliary mandate. Three conditions, because a grip should be hard to reach accidentally and impossible to reach by stress alone.', hover: '—', commit: 'Aggravating commits deepen it.', state: 'Exactly one exit: Recovery.' },
  { n: 5, t: 'RECOVERY', d: 'A real state with its own rules, not an absence of activity: decay runs at 1.6x, capacity returns slowly, and debt does not clear itself. It cannot be skipped and it cannot complete while any function is in debt. This is why a grip costs a user several beats of real time rather than one click.', hover: '—', commit: 'Idle beats are the normal way through.', state: 'Relapses to Grip if aggregate stress climbs back above 78.' },
  { n: 6, t: 'Manual override edges', d: 'Any state can be forced into Loop or Grip from the control bar, at no cost and with no beat. The forced state is labelled MANUAL everywhere it is reported and satisfies no automatic exit condition — the user must toggle it back off, and doing so routes to Recovery, so the wear is still real. This keeps the override useful for teaching without turning it into a way to cheat the economy.', hover: 'Toggle preview names how many readouts would be rewritten.', commit: 'Toggling consumes nothing.', state: 'A manual state suppresses automatic evaluation for as long as it is held.' },
  { n: 7, t: 'Invariants', d: 'Six rules the implementation must not break. The two most likely to be violated by accident: exactly one state at a time (Grip supersedes Loop rather than stacking with it), and evaluation only on commit (not on a timer and not during hover, or the forecast becomes a lie).', hover: '—', commit: '—', state: '—' },
  { n: 8, t: 'The numbers table', d: 'Every threshold in one place, with its hysteresis gap and who is allowed to trigger it. All of these values are invented defaults chosen to make the mechanic legible in a short session; none is derived from typological theory, and all of them are tuning surface. That is stated on the diagram itself so nobody later mistakes them for doctrine.', hover: '—', commit: '—', state: '—' },
  { n: 9, t: 'Hysteresis, drawn', d: 'Entry and exit conditions are separate labelled edges with different values — never one bidirectional edge with one threshold. Without the gap, a psyche sitting at the boundary flickers between states on every beat, and a flickering state chip teaches nothing except that the simulation is nervous.', hover: '—', commit: '—', state: '—' },
  { n: 10, t: 'The relapse edge', d: 'Recovery can fall back into Grip. Drawn explicitly because the alternative — an unconditional ratchet toward health — would misrepresent the phenomenon and would also remove all tension from the recovery beats.', hover: '—', commit: '—', state: '—' },
];

/* ============================================================ D4 */
export function D4() {
  const g = [];
  g.push(KICK(24, 30, 'd4 · data flow for a single hover event', { size: 9 }));
  g.push(T(24, 56, 'Three inputs → one pure function per function → five readouts × four → one human', { size: 17, w: 700 }));
  g.push(para(24, 74, 'Everything in this diagram is pure. A hover reads state and writes nothing. The only mutation in the entire product happens at commit, on the far right, below the dashed line.', 1100, { size: 11 }));

  /* inputs */
  g.push(KICK(24, 128, 'inputs — all three are already resolved before the pointer moves', { size: 8.5 }));
  const inputs = [
    { x: 24, t: 'Scenario', s: 'authored, frozen at Enter', b: 'gates[fn] : number — cost multiplier per function, resolved from the briefing’s predispositions. surface / interior hooks. affinity[fn].' },
    { x: 24, y: 300, t: 'Action', s: 'authored or state-generated', b: 'signature: Record<fn, number> summing to 1 · intensity 0..1 · mandates.serves / .defers / .violates · voices[fn] · axis?: alleviate | aggravate' },
    { x: 24, y: 470, t: 'FunctionState × 4', s: 'live, from session state', b: 'rank · capacity · stress · pleasure · involvement · debt · plus the machine state, which supplies its own multipliers.' },
  ];
  inputs.forEach((n, i) => g.push(node(24, n.y || 142, 286, i === 0 ? 140 : i === 1 ? 148 : 130, { title: n.t, sub: n.s, body: n.b, fill: C.f0, sw: 1.6 })));
  g.push(T(24, 616, 'None of these change during a hover.', { size: 10, w: 700, fill: C.ink }));

  /* routing */
  g.push(arrow([[310, 212], [356, 212], [356, 330], [386, 330]]));
  g.push(arrow([[310, 374], [386, 374]]));
  g.push(arrow([[310, 535], [356, 535], [356, 418], [386, 418]]));
  g.push(node(386, 246, 250, 96, { title: 'Route the signature', sub: 'step 1', body: 'Any demand for a function the stack does not carry is re-targeted to the nearest carrier: same class first, then same element. routingPenalty = 1.35.', fill: C.f1 }));
  g.push(node(386, 356, 250, 104, { title: 'Resolve multipliers', sub: 'step 2', body: 'rankMult (cost / stress / pleasure) × gate[fn] × relationMult (serves 0.45 · neutral 1.0 · defers 1.35 · violates 1.8) × stateMult.', fill: C.f1 }));
  g.push(node(386, 474, 250, 96, { title: 'Per-function kernel', sub: 'step 3 — runs 4 times', body: 'One pure call per function in the stack. No shared mutable state between the four calls, so they are order-independent and memoisable.', fill: C.f1 }));

  /* five readouts */
  g.push(arrow([[636, 420], [700, 420], [700, 240], [726, 240]]));
  g.push(arrow([[700, 420], [726, 420]], { marker: 'arw' }));
  g.push(KICK(726, 128, 'five readouts, per function', { size: 8.5 }));
  const outs = [
    ['a · stream line', 'voices[fn][state] — looked up, never generated. Falls back to a neutral line if unauthored.'],
    ['b · stress delta', '100 · intensity · share · rankStress · gate · relationMult · stateMult'],
    ['c · pleasure', '100 · intensity · share · rankPleasure · affinity · servesBonus (1.6 serves / 0.15 violates)'],
    ['d · involvement', 'w = share^0.85 · affinity · stateBias, then normalised across the four so they sum to exactly 1'],
    ['e · energy cost', '100 · intensity · share · rankCost · gate · routingPenalty · stateMult, subtracted from capacity; below zero is debt'],
  ];
  outs.forEach((o, i) => {
    const y = 142 + i * 76;
    g.push(node(726, y, 400, 68, { title: o[0], body: o[1], fill: C.f0 }));
  });
  g.push(R(726, 142, 400, 372, { fill: 'none', stroke: C.ink, sw: 1.6, dash: '4 3' }));
  g.push(T(1130, 158, '× 4', { size: 22, w: 700 }));
  g.push(T(1130, 174, 'functions', { size: 9, fill: C.mute }));

  /* normalisation */
  g.push(arrow([[926, 514], [926, 548]]));
  g.push(node(726, 548, 400, 76, { title: 'Normalise involvement', sub: 'the only cross-function step in the pipeline', body: 'The four raw weights are divided by their sum. This is why involvement is a ratio that reads as a whole, and why it cannot be computed per function in isolation.', fill: C.f2, sw: 1.8 }));

  /* aggregation */
  g.push(arrow([[1126, 586], [1170, 586], [1170, 300]]));
  g.push(node(1160, 142, 256, 300, { title: 'Roll up to one human', sub: 'four states → one state', body: '', fill: C.f1, sw: 1.8 }));
  const agg = [
    ['ENERGY', 'Σ max(0,cap) − 1.5·Σ|min(0,cap)|', 'sum: one libido supply'],
    ['STRESS', '0.6·max(s) + 0.4·Σ w·s', 'peak-weighted, not a mean'],
    ['PLEASURE', 'Σ w·p · (1 − 0.55·conflict)', 'conflict discounts satisfaction'],
    ['EVENNESS', '−Σ i·ln i / ln 4', 'spread of the share vector'],
    ['IN / OUT', 'perceivers vs judges × attitude', 'introverted judges emit at 0.35'],
  ];
  let ay = 200;
  agg.forEach((a) => {
    g.push(T(1174, ay, a[0], { size: 9, w: 700, ls: 0.5 }));
    g.push(T(1174, ay + 13, a[1], { size: 8.6, mono: true, fill: C.ink2 }));
    g.push(T(1174, ay + 25, a[2], { size: 8.4, fill: C.mute }));
    ay += 48;
  });
  g.push(T(1174, 428, 'w = rank weights [.40 .27 .19 .14]', { size: 8.4, mono: true, fill: C.faint }));

  /* the purity line */
  g.push(L(660, 652, 1416, 652, { stroke: C.ink, sw: 2, dash: '8 5' }));
  g.push(T(1416, 646, 'EVERYTHING ABOVE THIS LINE IS PURE — A HOVER WRITES NOTHING', { size: 10, w: 700, ls: 0.5, anchor: 'end' }));

  g.push(node(660, 668, 360, 100, { title: 'Hover result', sub: 'ForecastBundle', body: 'A plain object: four ReadoutDelta records plus one AggregateDelta. Memoised by (actionId, stateHash). Rendered into overlay layers only.', fill: C.f0, dash: '4 3' }));
  g.push(arrow([[1020, 718], [1074, 718]]));
  g.push(node(1074, 668, 342, 100, { title: 'Commit', sub: 'the only mutation in the product', body: 'Applies the same bundle to session state, appends beats b5–b8, then evaluates D3 thresholds once. Same arithmetic as the forecast — that identity is what makes the forecast trustworthy.', fill: C.dark, ink: '#ffffff', sw: 0 }));

  g.push(node(24, 668, 610, 100, { title: 'What is NOT recomputed on hover', sub: 'the perf contract', body: 'Committed history, the beat ring buffer, the trace paths left of NOW, the DOM of the monologue streams, and the layout of every row. A hover touches two overlay canvases and roughly forty text nodes. Nothing reflows.', fill: C.f1 }));

  const calls = [cal(1, 30, 138), cal(2, 392, 242), cal(3, 392, 470), cal(4, 732, 138), cal(5, 732, 544), cal(6, 1166, 138), cal(7, 690, 648), cal(8, 30, 664), cal(9, 1080, 664), cal(10, 1132, 240)];
  return g.join('') + calls.join('');
}

export const D4_LEGEND = [
  { n: 1, t: 'Three inputs, all pre-resolved', d: 'Scenario gates are frozen at Enter Scenario; action properties are authored; function states come from session state. Nothing here is computed during the hover, which is what makes a hover a lookup rather than a simulation step.', hover: 'Read only.', commit: 'Function states are the only one of the three that a commit writes to.', state: 'Machine state contributes multipliers, listed with the function states.' },
  { n: 2, t: 'Routing — the “function you do not carry” case', d: 'A demand for Te arriving at an ISTP is not impossible; it is re-targeted to the nearest carrier (same class first, then same element) and surcharged 1.35x. This is what implements “same job, different method, different bill”: the cost lands on Ti and the stream renders in Ti’s register, not Te’s.', hover: 'The receiving row shows a routed-work badge.', commit: 'Surcharge itemised separately in the receipt.', state: 'Unchanged by loop/grip.' },
  { n: 3, t: 'The per-function kernel', d: 'One pure call per function, with no shared mutable state, so the four are order-independent and individually memoisable. This is the single most important implementation constraint in the diagram — it is what allows the whole forecast to be cached by (actionId, stateHash).', hover: 'Four calls, all cached after the first hover of a given action.', commit: 'Same four calls, then applied.', state: 'State supplies multipliers into the kernel; it does not branch it.' },
  { n: 4, t: 'The five readouts', d: 'Exactly the five the brief specifies: stream line, stress, pleasure, involvement, energy cost. Four of the five are per-function scalars; the fifth (the stream line) is a lookup into authored text, never generated. Each formula is written out so the implementer has no room to invent one.', hover: 'Produces deltas, not levels.', commit: 'Deltas are applied to levels.', state: 'stateMult and stateBias are where Loop and Grip enter the arithmetic.' },
  { n: 5, t: 'Normalisation — the only cross-function step', d: 'Involvement is the one readout that cannot be computed for a function in isolation: four raw weights are divided by their sum. This is exactly why the brief asks for “a ratio that reads as a whole,” and why the involvement spine is one continuous bar rather than four separate meters.', hover: 'Proposed ratio is normalised the same way and still sums to 1.', commit: 'Normalised again after application.', state: 'Loop multiplies the auxiliary weight by 0.12; Grip multiplies the inferior weight by 3.2 — both before normalisation, never after.' },
  { n: 6, t: 'Roll-up to one human', d: 'Five aggregation rules, each stated with its formula and its one-line justification. The rank weight vector [.40 .27 .19 .14] is used by three of the five. Note that stress is deliberately not a mean and pleasure is deliberately not a sum; both choices are argued in the build spec and shown to the user in S6.', hover: 'Aggregate deltas travel in the same bundle.', commit: 'Applied atomically with the four function states.', state: 'State multipliers are applied before aggregation, never after.' },
  { n: 7, t: 'The purity line', d: 'Everything above is pure. A hover reads state and writes nothing — no counters, no history, no analytics, no caches that alter behaviour. Drawn as a heavy dashed rule because it is the invariant most likely to be broken by a well-meaning later change.', hover: 'Nothing written.', commit: 'Crosses the line.', state: '—' },
  { n: 8, t: 'The perf contract', d: 'The list of things a hover must not touch: committed history, the ring buffer, trace paths left of NOW, monologue DOM, and every row’s layout. A hover repaints two overlay canvases and updates roughly forty text nodes, and causes no reflow. If a hover ever reflows, the screen is being rebuilt rather than annotated.', hover: 'This is the budget.', commit: 'A commit may reflow once.', state: 'A state transition may reflow once — the row height swap in Grip is the only intentional layout change in the product.' },
  { n: 9, t: 'Commit — the only mutation', d: 'Applies the identical bundle the forecast displayed, appends beats b5 through b8, then evaluates the D3 thresholds exactly once. Using the same arithmetic for forecast and commit is not an optimisation, it is the correctness property that makes the forecast worth showing at all.', hover: '—', commit: 'This is the commit.', state: 'Threshold evaluation happens here and nowhere else.' },
  { n: 10, t: 'The ×4 boundary', d: 'The dashed frame marks the fan-out: five readouts computed four times gives the twenty simultaneous signals the brief names as the core density problem. The answer is not to compute fewer — it is to render them at different fidelities, which is a presentation decision made in S5, downstream of everything in this diagram.', hover: '—', commit: '—', state: '—' },
];

/* ============================================================ D5 */
export function D5() {
  const g = [];
  g.push(KICK(24, 30, 'd5 · component hierarchy of one reaction window', { size: 9 }));
  g.push(T(24, 56, 'ReactionWindow — five children, one canvas, no framework', { size: 17, w: 700 }));
  g.push(para(24, 74, 'The project is vanilla ES modules on Vite with no framework, so “component” means a factory that builds a DOM subtree once and returns an update(state) method. Nothing re-creates nodes after mount. Props are listed on each node; the full type shapes are in the build spec.', 1180, { size: 11 }));

  const comp = (x, y, w, h, name, props, note, o = {}) => {
    const gg = [R(x, y, w, h, { fill: o.fill || C.f0, stroke: C.ink, sw: o.sw || 1.3, r: 3 })];
    gg.push(T(x + 12, y + 20, name, { size: 12, w: 700, mono: true, fill: o.ink || C.ink }));
    let py = y + 34;
    props.forEach((p) => { gg.push(T(x + 12, py, p, { size: 9, mono: true, fill: o.ink || C.ink2 })); py += 11.5; });
    if (note) gg.push(para(x + 12, py + 6, note, w - 24, { size: 9, fill: o.ink || C.mute }));
    return gg.join('');
  };

  g.push(comp(24, 128, 380, 128, 'ReactionWindow', ['fn: FunctionKey', 'rank: Rank', 'tier: FULL | MID | LOW | BYPASSED', 'state: FunctionState', 'forecast: ReadoutDelta | null', 'onFocus(fn)'], 'Owns nothing but layout and tier. Holds no timers — it is driven by the shared scheduler. Its update() is a pure fan-out to the five children below.', { sw: 2.2, fill: C.f1 }));

  const kids = [
    { x: 24, y: 300, name: 'IdentityGutter', props: ['fn', 'rank', 'tier', 'glyphSize: 32|28|24|22', 'badge?: ROUTED | HIJACK | LOOP·A'], note: 'Static after mount except the badge and, in Grip, the glyph size. Hosts the GlyphSlot.' },
    { x: 424, y: 300, name: 'ExpressionStream', props: ['lines: StreamLine[]', 'maxLines: number', 'projected?: string', 'reducedMotion: boolean'], note: 'Six recycled DOM nodes, never more. Typing is a CSS-driven caret, not a per-character timer.' },
    { x: 824, y: 300, name: 'Seismograph', props: ['series: Float32Array (ring view)', 'forecast?: Float32Array', 'height: number', 'nowFrac = 0.72', 'viewport: rect in the shared layers'], note: 'Owns no elements. Draws into a viewport rect on each of the two shared layers below: history repaints on beats, forecast repaints on hover.' },
    { x: 24, y: 470, name: 'ScalarCluster', props: ['pleasure / involvement / capacity', 'deltas?: ReadoutDelta', 'labelled: boolean'], note: 'Bars are transform: scaleX() so they never touch layout. Values are textContent writes.' },
    { x: 424, y: 470, name: 'DeltaGutter', props: ['deltas?: ReadoutDelta', 'attribution?: LOOP | GRIP'], note: 'Empty at rest. Five pre-mounted text nodes that are written or blanked.' },
  ];
  kids.forEach((k) => g.push(comp(k.x, k.y, 380, 140, k.name, k.props, k.note)));

  /* grandchildren */
  g.push(comp(24, 640, 380, 106, 'GlyphSlot', ['engine: GlyphEngine (src/engines/*)', 'size: number', 'params: derived from FunctionState'], 'Wraps the existing canvas engine from that function’s own info page. One shared offscreen canvas per function, drawn at DPR. Never an interactive target.', { fill: C.f2 }));
  g.push(comp(824, 470, 380, 106, 'HistoryLayer  (shared, 1 per page)', ['beats: RingBuffer<Beat> × 5', 'window: 16 | 20 | 64', 'viewports: DOMRect[5]'], 'Repainted only when a beat lands. Between beats it is a static bitmap with a 20 fps decay pass applied to the last three columns of each viewport.', { fill: C.f2 }));
  g.push(comp(824, 592, 380, 106, 'ForecastLayer  (shared, 1 per page)', ['forecast?: Float32Array × 5', 'reservedFrac = 0.28'], 'The only canvas a hover repaints. Transparent and empty at rest. Cleared on pointer-out with one clearRect over all five viewports.', { fill: C.f2 }));

  /* edges */
  g.push(arrow([[214, 256], [214, 280], [214, 300]], { sw: 1.2 }));
  g.push(arrow([[404, 200], [614, 200], [614, 300]], { sw: 1.2 }));
  g.push(arrow([[404, 214], [1014, 214], [1014, 300]], { sw: 1.2 }));
  g.push(arrow([[214, 440], [214, 470]], { sw: 1.2, marker: false }));
  g.push(arrow([[404, 228], [614, 228], [614, 470]], { sw: 1.2, dash: '3 3' }));
  g.push(arrow([[214, 610], [214, 640]], { sw: 1.2 }));
  g.push(arrow([[1014, 440], [1014, 470]], { sw: 1.2 }));
  g.push(arrow([[1014, 576], [1014, 592]], { sw: 1.2 }));

  /* shared services */
  g.push(R(1240, 128, 176, 618, { fill: C.f1, stroke: C.ink, sw: 1.6, dash: '5 4' }));
  g.push(KICK(1254, 150, 'shared, not owned', { size: 8 }));
  const shared = [
    ['BeatScheduler', 'One rAF loop for the entire page. Fixed 50 ms accumulator. Every window subscribes; none owns a timer.'],
    ['ForecastCache', 'Map keyed by (actionId, stateHash). Invalidated on commit and on state transition only.'],
    ['GlyphEnginePool', 'Eight engines, instantiated once, shared by every window and by the aggregate.'],
    ['TextCorpus', 'Authored lines keyed by (scenario, fn, action, state). Loaded with the scenario.'],
  ];
  let sy = 168;
  shared.forEach((s) => {
    g.push(T(1254, sy + 12, s[0], { size: 10, w: 700, mono: true }));
    g.push(para(1254, sy + 26, s[1], 150, { size: 8.8, fill: C.mute }));
    sy += 26 + paraH(s[1], 150, { size: 8.8 }) + 16;
  });
  g.push(para(1254, 614, 'The four windows plus the aggregate share TWO canvas elements — one history layer, one forecast layer — each carrying five viewports, and ONE rAF loop. Ten canvases with five rAF loops is the failure mode this box exists to prevent.', 150, { size: 9, fill: C.ink }));

  /* the rule */
  g.push(R(24, 770, 1190, 82, { fill: C.f0, stroke: C.ink, sw: 1.4 }));
  g.push(KICK(38, 790, 'the mount rule', { size: 8.5 }));
  g.push(T(38, 812, 'A ReactionWindow is built once per scenario run and updated thereafter. Tier changes toggle a class and hide children; they never rebuild them.', { size: 11.5, w: 600 }));
  g.push(T(38, 832, 'Consequence: a Grip promotion is a class change plus two height writes, not a re-render. The DOM node count of the Playground is constant from mount to unmount.', { size: 11, fill: C.mute }));

  const calls = [cal(1, 30, 124), cal(2, 30, 296), cal(3, 430, 296), cal(4, 830, 296), cal(5, 30, 466), cal(6, 430, 466), cal(7, 30, 636), cal(8, 830, 588), cal(9, 1246, 124), cal(10, 30, 766)];
  return g.join('') + calls.join('');
}

export const D5_LEGEND = [
  { n: 1, t: 'ReactionWindow', d: 'The unit S5 wireframes. Owns layout and tier and nothing else — no timers, no data fetching, no simulation. Its update() is a pure fan-out to five children, which is what keeps a per-beat update to a bounded, predictable cost.', hover: 'Receives a ReadoutDelta or null; passes it down.', commit: 'Receives a new FunctionState.', state: 'Receives a new tier; toggles a class.' },
  { n: 2, t: 'IdentityGutter', d: 'Effectively static: function label, rank, name, glyph, tier chip, and an optional badge. The only things that ever change are the badge and — in Grip alone — the glyph size.', hover: 'Shows ROUTED when the hovered action routes work into this function.', commit: 'Badge may persist.', state: 'HIJACK in Grip, LOOP·A / LOOP·B in Loop, BYPASSED on the starved auxiliary.' },
  { n: 3, t: 'ExpressionStream', d: 'Six recycled DOM nodes, never more, so the stream cannot grow the document over a long session. Typing is a CSS-driven caret rather than a per-character timer, which keeps the animation off the main thread’s critical path.', hover: 'Writes one projected line into a pre-mounted, normally-empty node.', commit: 'Promotes the projected line and recycles the oldest.', state: 'Line budget changes with tier; corpus changes with machine state.' },
  { n: 4, t: 'Seismograph', d: 'A logical component that owns no elements: it holds a viewport rectangle inside each of the two shared canvas layers. Two layers rather than one is the entire hover-performance strategy — history repaints on beats, forecast repaints on hover, and the two never repaint together.', hover: 'Forecast layer only.', commit: 'History repaints once; forecast clears.', state: 'History repaints once on transition.' },
  { n: 5, t: 'ScalarCluster', d: 'Three meters. Bars are driven by transform: scaleX() so they never touch layout, and values are textContent writes into pre-mounted nodes. A hover across all four windows is roughly forty text writes and twelve transform changes.', hover: 'Adds dashed extensions or hatched retractions.', commit: 'Animates once to the new level.', state: 'Labels are dropped at LOW tier; the meters themselves stay.' },
  { n: 6, t: 'DeltaGutter', d: 'Five pre-mounted text nodes that are written or blanked. It is empty at rest, which is what makes hover feel like an answer rather than a refresh — and it means the hover path never creates a node.', hover: 'Fills.', commit: 'Blanks.', state: 'Adds an attribution tag when the state rather than the action caused a delta.' },
  { n: 7, t: 'GlyphSlot', d: 'Wraps the existing canvas engine from the function’s own info page, parameterised by live FunctionState so the glyph breathes with the simulation. One shared offscreen canvas per function, drawn at device pixel ratio, blitted into each window that needs it. Never an interactive target and never the primary anchor.', hover: 'Inert.', commit: 'Params update.', state: 'Size changes only in Grip.' },
  { n: 8, t: 'ForecastLayer', d: 'The only canvas a hover repaints — one element for the whole page, carrying all five viewports. Transparent and empty at rest; cleared on pointer-out with a single clearRect. If a future change ever draws committed data here, the forecast/record distinction collapses and the product loses its central mechanic.', hover: 'Repaints.', commit: 'Clears.', state: 'Unchanged.' },
  { n: 9, t: 'Shared services', d: 'Four things that are shared rather than owned, and one hard rule: the four windows plus the aggregate share TWO canvas elements — a history layer and a forecast layer, each carrying five viewports — driven by ONE requestAnimationFrame loop. Ten canvases with five independent rAF loops is the specific failure mode this box exists to prevent. Seismograph in the tree above is a logical component; it owns a viewport rectangle in each shared layer, not its own elements.', hover: 'ForecastCache turns a repeat hover into a map lookup.', commit: 'Cache invalidated.', state: 'Cache invalidated.' },
  { n: 10, t: 'The mount rule', d: 'Windows are built once per scenario run and updated thereafter; tier changes toggle a class and hide children rather than rebuilding them. The consequence is worth stating plainly: a Grip promotion is a class change plus two height writes, and the DOM node count of the Playground is constant from mount to unmount.', hover: '—', commit: '—', state: 'The Grip height swap is the only intentional layout change in the product.' },
];

/* ============================================================ D6 */
export function D6() {
  const g = [];
  g.push(KICK(24, 30, 'd6 · timing model for the seismograph', { size: 9 }));
  g.push(T(24, 56, 'The x-axis is beats. Beats come from commits, not from clocks.', { size: 17, w: 700 }));
  g.push(para(24, 74, 'A wall-clock axis would punish a user for reading. A pure step axis would make “live trace” a lie. This is the hybrid: the spine is beat-indexed, and the ink between beats still moves.', 1180, { size: 11 }));

  /* the axis */
  const AX = 80, AY = 200, AW = 1150, AH = 190;
  const nowX = AX + AW * NOW_FRAC;
  g.push(R(AX, AY, AW * NOW_FRAC, AH, { fill: C.f1, stroke: C.rule }));
  g.push(R(nowX, AY, AW - AW * NOW_FRAC, AH, { fill: C.f0, stroke: C.rule, dash: '3 3' }));
  const series = defaultSeries(20, 'rising');
  const px = (i) => AX + (nowX - AX) * (i / 20);
  const py = (v) => AY + AH - 12 - v * (AH - 30);
  g.push(P(series.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' '), { stroke: C.ink, sw: 1.8, join: 'round' }));
  const fser = defaultSeries(6, 'rising');
  g.push(R(nowX, AY, AW - (nowX - AX), AH, { fill: 'url(#pFore)', stroke: null }));
  g.push(P(fser.map((v, i) => `${i ? 'L' : 'M'}${(nowX + (AX + AW - nowX) * (i / 6)).toFixed(1)} ${py(v * 1.1).toFixed(1)}`).join(' '), { stroke: C.ink, sw: 1.8, dash: '5 3' }));
  g.push(L(nowX, AY - 30, nowX, AY + AH + 12, { stroke: C.ink, sw: 2.4 }));
  g.push(T(nowX - 8, AY - 36, 'NOW  ·  fixed at 72% of the trace width, on every seismograph in the product', { size: 10.5, w: 700, anchor: 'end' }));

  /* beat ticks and regions */
  const regions = [
    [0, 4, 'previous runs', 'summarised tail'],
    [4, 8, 'run n−1', 'b1–b8, full'],
    [8, 12, 'run n−1 aftermath', ''],
    [12, 16, 'this run — intake', 'b1 Ti · b2 Se · b3 Ni · b4 Fe'],
    [16, 20, 'dwell', 'no beats advance'],
  ];
  regions.forEach(([a, b, lab, sub], i) => {
    g.push(L(px(a), AY, px(a), AY + AH + 6, { stroke: C.faint, sw: 1, dash: '2 3' }));
    g.push(T((px(a) + px(b)) / 2, AY + AH + 22, lab, { size: 9, w: 700, anchor: 'middle', fill: C.ink }));
    if (sub) g.push(T((px(a) + px(b)) / 2, AY + AH + 34, sub, { size: 8.5, mono: true, anchor: 'middle', fill: C.mute }));
  });
  for (let i = 0; i <= 20; i++) g.push(L(px(i), AY + AH, px(i), AY + AH + (i % 4 === 0 ? 6 : 3), { stroke: C.faint, sw: 1 }));
  g.push(T(AX, AY + AH + 56, 'x = BEAT INDEX', { size: 11, w: 700, ls: 0.5 }));
  g.push(T(AX + 130, AY + AH + 56, 'not seconds. 20 beats visible on the S3 rows, 64 on S5 and S6.', { size: 10, fill: C.mute }));

  /* forecast band */
  g.push(T(nowX + 20, AY + 24, 'RESERVED FORECAST BAND', { size: 11, w: 700, ls: 0.4 }));
  g.push(T(nowX + 20, AY + 40, '28% of the width. Empty at rest. Holds the next 6 projected sub-steps of', { size: 9.5, fill: C.ink2 }));
  g.push(T(nowX + 20, AY + 53, 'beat b5 and its three aftermath beats. Nothing committed is ever drawn here.', { size: 9.5, fill: C.ink2 }));
  g.push(arrow([[nowX + 8, AY + 90], [AX + AW - 12, AY + 90]], { sw: 1.2 }));
  g.push(T(nowX + 20, AY + 106, 'b5 · b6 · b7 · b8, projected', { size: 9, mono: true, fill: C.mute }));

  /* on commit */
  g.push(arrow([[nowX + 60, AY + 150], [nowX - 60, AY + 150]], { sw: 1.8 }));
  g.push(T(nowX, AY + 172, 'on commit, the band’s contents translate LEFT across NOW and harden from dashed to solid', { size: 9.5, w: 600, anchor: 'middle' }));

  /* three timescales */
  g.push(KICK(24, 470, 'three timescales, and only one of them is a clock', { size: 8.5 }));
  const scales = [
    { t: 'BEAT', v: 'discrete', b: 'The x-axis unit. Advanced only by a commit and by the aftermath beats a commit schedules. Idle time advances nothing. A run contributes exactly 8.' },
    { t: 'SUB-BEAT', v: '50 ms · 20 fps', b: 'The living ink. Stress decay, a small deterministic jitter, and the monologue caret. Applied only to the last three columns of the trace; everything older is a static bitmap.' },
    { t: 'TRANSITION', v: '180–420 ms', b: 'One-shot animations: a meter moving to a new level, the forecast hardening, the Grip height swap. Never looping, never ambient. Suppressed entirely under prefers-reduced-motion.' },
  ];
  scales.forEach((s, i) => {
    const x = 24 + i * 402;
    g.push(R(x, 484, 380, 116, { fill: C.f0, stroke: C.ink, sw: 1.4 }));
    g.push(T(x + 14, 508, s.t, { size: 13, w: 700, ls: 0.6 }));
    g.push(T(x + 14, 522, s.v, { size: 10, mono: true, fill: C.mute }));
    g.push(para(x + 14, 540, s.b, 352, { size: 9.8 }));
  });

  /* memory model */
  g.push(KICK(24, 634, 'history retention — what is kept, what is summarised, what is dropped', { size: 8.5 }));
  g.push(R(24, 648, 810, 172, { fill: C.f1, stroke: C.ink, sw: 1.4 }));
  const mem = [
    ['on screen', '20 beats (S3 rows) · 64 beats (S5, S6)', 'A window into the buffer. Changing it never triggers a recompute.'],
    ['in memory', '256 beats per function, ring buffer', '5 × Float32Array(256) = 5 KB total. Fixed allocation at mount; never grows.'],
    ['summarised', 'runs older than the last 4 collapse to 1 beat each', 'min, max, and mean of the run, drawn as a single vertical extent. The tail stays honest without staying expensive.'],
    ['dropped', 'nothing, until Reset Vessel', 'The run log — action, receipt, transition — is kept in full for S9 counterfactuals and is not part of the ring buffer.'],
  ];
  let my = 668;
  mem.forEach((m) => {
    g.push(T(38, my + 12, m[0].toUpperCase(), { size: 8.5, w: 700, ls: 0.5, fill: C.mute }));
    g.push(T(140, my + 12, m[1], { size: 10.5, w: 600 }));
    g.push(para(140, my + 26, m[2], 670, { size: 9.3, fill: C.mute }));
    my += 40;
  });

  g.push(R(854, 648, 562, 172, { fill: C.f0, stroke: C.ink, sw: 1.4 }));
  g.push(KICK(868, 668, 'why beats and not seconds — the argument, once', { size: 8.5 }));
  g.push(para(868, 684, 'A wall-clock axis makes hesitation expensive. A user comparing five actions carefully would accrue stress for reading, which punishes exactly the behaviour the product is trying to produce. It also makes every run non-reproducible, which kills the S9 counterfactual: two receipts are only comparable if the clock did not differ between them.', 534, { size: 10 }));
  g.push(para(868, 750, 'A pure step axis has the opposite problem: nothing moves between clicks, so “live trace” and “real-time stream” become false advertising and the instrument reads as a static chart. The hybrid keeps determinism where it matters — beats, costs, thresholds, replay — and spends animation only on decay and jitter, which affect appearance and never the ledger.', 534, { size: 10 }));

  const calls = [cal(1, AX - 26, AY + 90), cal(2, nowX, AY - 60), cal(3, nowX + 200, AY + 24), cal(4, 620, AY + AH + 40), cal(5, 30, 466), cal(6, 432, 480), cal(7, 30, 630), cal(8, 860, 644), cal(9, nowX, AY + 186), cal(10, 1236, AY + 90)];
  return g.join('') + calls.join('');
}

export const D6_LEGEND = [
  { n: 1, t: 'The committed region', d: 'Everything left of NOW is history: solid ink, never redrawn on hover, and rendered from the ring buffer. It occupies 72% of the trace width on every seismograph in the product, including the aggregate.', hover: 'Untouched.', commit: 'Scrolls one beat left; NOW does not move.', state: 'Repainted once on a state transition.' },
  { n: 2, t: 'NOW at 72%', d: 'A fixed fraction, not a fixed pixel count, so the boundary sits at the same relative position whether the trace is 200px wide on a phone or 434px wide in the aggregate. One boundary, learned once, true everywhere.', hover: '—', commit: 'Does not move.', state: 'Does not move.' },
  { n: 3, t: 'The reserved forecast band', d: '28% of the width, empty at rest, holding the projected b5 plus its three aftermath beats. Reserving the space permanently — rather than growing the trace on hover — is what stops the whole screen from reflowing when a pointer moves.', hover: 'Fills with hatch and a dashed trace.', commit: 'Empties.', state: 'Unchanged; the reservation is structural.' },
  { n: 4, t: 'Beat regions', d: 'The visible window spans several runs. Reading left to right: a summarised tail of older runs, the previous run in full, this run’s four intake beats, and the dwell region where the user is currently reading. The intake beats are why the trace has meaningful history before the user has done anything.', hover: 'No region advances.', commit: 'The dwell region collapses and b5–b8 are written.', state: 'Region boundaries are unaffected.' },
  { n: 5, t: 'Three timescales', d: 'Only one of the three is a clock. Beats are discrete and commit-driven; sub-beat motion is a 20 fps decay-and-jitter pass; transitions are one-shot animations. Keeping these separate is what allows the trace to look alive while remaining fully deterministic and replayable.', hover: 'Only the transition scale is involved.', commit: 'All three.', state: 'Transition scale runs once.' },
  { n: 6, t: 'Sub-beat motion is bounded', d: '20 fps, and applied only to the last three columns of the trace. Everything older is a static bitmap that is not touched between beats. This is the difference between an instrument that stays readable for ten minutes and one that costs a constant 60 fps repaint of five full-width traces.', hover: 'Unaffected.', commit: 'The three-column region shifts.', state: 'Jitter amplitude changes; the cost does not.' },
  { n: 7, t: 'Retention', d: '20 or 64 beats on screen, 256 per function in a fixed ring buffer, runs older than the last four summarised to one beat each. Total memory is five Float32Array(256) — about 5 KB — allocated once at mount and never grown. The run log is separate and kept in full, because S9 counterfactuals need it.', hover: '—', commit: 'Writes four beats.', state: '—' },
  { n: 8, t: 'The argument for beats', d: 'Stated once, on the diagram, so it is not relitigated during implementation. A wall-clock axis punishes reading and destroys reproducibility, which would in turn destroy the S9 counterfactual — two receipts are only comparable if the clock did not differ between them. A pure step axis makes “live trace” false. The hybrid keeps determinism where it affects the ledger and spends animation only where it affects appearance.', hover: '—', commit: '—', state: '—' },
  { n: 9, t: 'The commit translation', d: 'On commit, the band’s contents move left across NOW and harden from dashed to solid. This single motion is the product’s central metaphor made literal: a projection becomes a record by crossing the line, and the user watches it happen.', hover: '—', commit: 'This is the motion.', state: 'Suppressed under reduced-motion; the values still change.' },
  { n: 10, t: 'What is NOT on this axis', d: 'No wall-clock timestamps, no session duration, no “time spent deliberating.” None of them are inputs to the model, so none of them appear on the instrument. An axis that carries a quantity the simulation does not use is an invitation to believe it matters.', hover: '—', commit: '—', state: '—' },
];
