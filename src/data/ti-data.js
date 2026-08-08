/* ============================================================
   CURRENTS · Ti page data
   All content, parameters, models, and configuration specific
   to the Introverted Thinking page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadTiData() {
  const COL = {
    ti: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'INTP · ISTP', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.95, .95, .90, .95, .90],
      text: 'The world is a system to be understood. Analysis runs constantly and effortlessly, and feels like identity itself. The lattice is large, fast, and quiet — precision without strain.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'ENTP · ESTP', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.80, .85, .80, .85, .78],
      text: 'A superb editor rather than the author. Ti here serves the dominant perceiver — Ne\'s possibilities or Se\'s live data get rigorously stress-tested — but analysis is switched on deliberately rather than running the show.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'INFJ · ISFJ', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.50, .55, .50, .55, .45],
      text: 'A private hobby-logic. Real skill in narrow, well-loved domains, blooming with age — but under stress it can pair with the dominant into a self-sealed loop, polishing conclusions no one is allowed to audit.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'ENFJ · ESFJ', shadow: false, series: 3,
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: 0 },
      dial: [.25, .30, .30, .30, .35],
      text: 'Logic arrives late, harsh, and all-or-nothing. Long stretches of deferring to others\' frameworks, punctuated — usually under stress — by rigid, brittle certainty that doesn\'t sound like them at all.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'ENTJ · ESTJ', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.35, .40, .50, .30, .20],
      text: 'The argumentative defender. When their Te plans are challenged, Ti wakes up combative — nitpicking definitions and dismantling the critic\'s logic, less to find truth than to protect the agenda.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'INTJ · ISTJ', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.30, .45, .40, .25, .15],
      text: 'An inner fault-finder. Ti turns inward as a belittling voice — "your reasoning is sloppy, your definitions don\'t hold" — harsh, sporadic, and aimed mostly at the self.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'ENFP · ESFP', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.20, .25, .35, .15, .10],
      text: 'Logic as a trap to wriggle out of. Pure Ti consistency feels like a double-bind game; this position deflects it with absurdity or charm — and is blind, without malice, to the rules it\'s accused of breaking.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'INFP · ISFP', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.15, .30, .25, .10, .05],
      text: 'Rarely touched, and corrosive when it erupts: cold pseudo-logic aimed at the self, dismantling one\'s own worth and dressing the demolition up as objectivity.' },
  ];

  const FEEDERS = [
    { key: 'ne', name: 'Ne', color: COL.n, canonical: true, pair: 'the INTP coupling',
      cfg: { rate: .55, branchy: .85, speed: .35, spread: .95, persistence: .35 },
      text: 'Breadth-first logic. Ne delivers forking, speculative input — the lattice grows broad and provisional, whole wings built and demolished cheaply. Frameworks for possibilities that don\'t exist yet.' },
    { key: 'se', name: 'Se', color: COL.s, canonical: true, pair: 'the ISTP coupling',
      cfg: { rate: .95, branchy: 0, speed: 1, spread: .15, persistence: .95 },
      text: 'Tactical logic. Se delivers fast, dense, concrete input — the lattice grows narrow and load-bearing, tested against live physical data in real time. Troubleshooting the machine in front of you.' },
    { key: 'si', name: 'Si', color: '#c07f10', canonical: false, pair: 'the loop coupling (Ti–Si, INTP under stress)',
      cfg: { rate: .4, branchy: 0, speed: .3, spread: .2, persistence: 1 },
      text: 'Input drawn from the archive rather than the world: Ti re-proves old conclusions against old data. Rigorous, airless, and increasingly detached from anything new — the visual signature of a cognitive loop.' },
    { key: 'ni', name: 'Ni', color: '#7148d8', canonical: false, pair: 'a non-standard coupling',
      cfg: { rate: .15, branchy: .15, speed: .2, spread: .5, persistence: .7 },
      text: 'Speculative: a thin stream of pre-converged insight. Ti receives few inputs but heavy ones — and reorganizes wholesale around each arrival. No standard stack places Ni directly above Ti.' },
    { key: 'fe', name: 'Fe', color: COL.f, canonical: false, unstable: true, pair: 'judging feeding judging',
      cfg: { rate: .12, branchy: 0, speed: .3, spread: .4, persistence: .5 },
      text: 'Two sorters, no gatherer. Fe hands Ti social verdicts rather than perceptions — the chamber idles hungry, with almost nothing arriving to test. This is why real stacks alternate perceiving and judging.' },
  ];

  /* drain model */
  function shadowDrain(t) {
    const base = 20 * Math.pow(t / 60, 1.25);
    let spikes = 0;
    for (const [st, mag] of [[16, 8], [41, 12], [68, 9], [97, 9]]) {
      if (t >= st) spikes += mag * clamp((t - st) / 2, 0, 1);
    }
    const wiggle = t < 2 ? 0 : 1.6 * Math.sin(t * 0.9) + 1.2 * Math.sin(t * 2.3 + 1);
    return clamp(base + spikes + wiggle, 0, 100);
  }

  const SERIES = [
    { key: 'dom', label: 'Dominant', color: COL.pos[0], f: t => Math.max(0, 13 * (t / 60) - 2.2 * Math.pow(Math.max(0, Math.sin(t / 8.2)), 3)) },
    { key: 'aux', label: 'Auxiliary', color: COL.pos[1], f: t => 21 * Math.pow(t / 60, 1.08) },
    { key: 'tert', label: 'Tertiary', color: COL.pos[2], f: t => 30 * Math.pow(t / 60, 1.4) },
    { key: 'inf', label: 'Inferior', color: COL.pos[3], f: t => Math.min(100, 82 * Math.pow(t / 60, 1.9)) },
    { key: 'sh', label: 'Shadow', color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 82, 1 / 1.9);

  const COSTS = [
    { label: 'Dominant', v: 1.0, color: COL.pos[0], series: 0 },
    { label: 'Auxiliary', v: 1.5, color: COL.pos[1], series: 1 },
    { label: 'Tertiary', v: 2.5, color: COL.pos[2], series: 2 },
    { label: 'Inferior', v: 4.0, color: COL.pos[3], series: 3 },
    { label: 'Shadow', v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: 'Dominant', color: COL.pos[0], note: 'Refills in minutes — and partially during use (flow).',
      f: t => t <= 30 ? 100 - SERIES[0].f(t) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t - 30) / 6)) },
    { label: 'Auxiliary', color: COL.pos[1], note: 'Quick, clean recovery.',
      f: t => t <= 30 ? 100 - SERIES[1].f(t) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t - 30) / 10)) },
    { label: 'Tertiary', color: COL.pos[2], note: 'A slower refill; rest must be deliberate.',
      f: t => t <= 30 ? 100 - SERIES[2].f(t) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t - 30) / 16)) },
    { label: 'Inferior', color: COL.pos[3], note: 'The hangover shelf: ~30 min where the whole system runs dim.',
      f: t => t <= 30 ? 100 - SERIES[3].f(t) : (t < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t - 60) / 20))) },
    { label: 'Shadow', color: COL.sh, note: 'Incomplete — some of the charge simply doesn\'t come back today.',
      f: t => t <= 30 ? 100 - SERIES[4].f(t) : lvl(4) + (93 - lvl(4)) * (1 - Math.exp(-(t - 30) / 25)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* verify lab config */
  const VERIFY = {
    buttons: [
      { id: 'btnIso', label: 'Observe an unrelated fact', sub: 'Se observes, Ti parks', color: COL.s },
      { id: 'btnLink', label: 'Discover a causal connection', sub: 'Ni suggests, Ti integrates', color: COL.n },
      { id: 'btnConflict', label: 'Witness a rule violation', sub: 'the lattice must rebuild', color: COL.crit },
    ],
    narrations: {
      iso: 'A new fact arrives — true, but unconnected. It parks beside the lattice as an isolated island, in its own color. No distress, no joy: not every observation must fit today.',
      isoFull: 'Two islands already float unconnected — Ti tolerates loose facts, but it itches for a bridge. Try discovering a causal connection.',
      link: 'An insight approaches: a small causal structure that claims the island and the lattice are the same fabric…',
      linkDone: 'The bridge proves out — pleasure spikes, stress eases — and the whole assembly folds into the main lattice and vanishes. Integrated: it is simply part of how the world works now.',
      linkPre: 'No island to connect yet — Se observes a fact first…',
      conflict: 'A rule just broke. Was it really broken? Stress floods the chamber while Ti re-observes —',
      conflictMid: 'Re-observation confirms the exception. The lattice red-shifts and tears itself apart — everything connected to the broken rule must be rebuilt to accommodate it.',
      conflictEnd: '…and settles. The exception is encoded, stress drains, the colour returns. The lattice is not the same one it was a minute ago — that is Ti doing its job.',
    },
  };

  /* hero text */
  const HERO = {
    tag: 'introverted thinking',
    title: 'Introverted Thinking',
    subtitle: 'A crystalline lattice of coherence — testing every input against itself, forever refining.',
  };

  /* zone B heading */
  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Ti',
    lede: 'Click any position to see how the lattice changes — from the effortless precision of a dominant to the corrosive static of the demon. Drag the maturity slider to watch the lower positions slowly gain fidelity with age.',
  };

  /* zone C heading */
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Ti?',
    lede: 'Every judging function needs a perceiving partner to deliver raw material. Click a feeder to watch how the lattice changes shape.',
  };

  /* zone D heading */
  const ZONE_D = {
    kicker: 'Zone D · verification lab',
    heading: 'The Verification Lab',
    lede: 'Watch Ti process input in real time. Each button triggers a different lifecycle event inside the lattice.',
  };

  /* zone E heading */
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Ti costs energy. The lower it sits in the stack, the more expensive it becomes — and the faster the battery drains.',
  };

  /* zone F */
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Ti shows up in daily life.',
    mirror: { label: 'Ti', counterpart: 'Te', counterpartColor: COL.pos[1] },
    vignettes: [
      { title: 'The Silent Rewrite', text: 'A dominant Ti user reads a new paper and says nothing for four days. Then they casually drop a conclusion that reorganizes everything — the lattice rebuilt itself silently.' },
      { title: 'The Loop', text: 'Under stress, INTP Ti pairs with tertiary Si: re-proving old conclusions against old data. The lattice tightens without growing — rigorous, airless, increasingly detached from anything new.' },
      { title: 'The Inferior Eruption', text: 'An ESFJ under stress suddenly becomes rigidly logical, arguing technicalities with an intensity that startles everyone — including themselves. Inferior Ti wakes up brittle and loud.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, VERIFY, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
