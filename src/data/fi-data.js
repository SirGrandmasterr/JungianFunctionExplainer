/* ============================================================
   CURRENTS · Fi page data
   All content, parameters, models, and configuration specific
   to the Introverted Feeling page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadFiData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'INFP · ISFP', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.95, .95, .90, .95, .90],
      text: 'The world is measured against an inner tone. Conviction is effortless and constant — not argued, simply known. The core burns steady; the hierarchy of what matters is deep, calm, and exact.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'ENFP · ESFP', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.80, .85, .80, .85, .78],
      text: 'The compass behind the explorer. Fi here vets what the dominant perceiver drags home — "is this us? could I live with this?" — quiet in the background, decisive at exactly the moments that matter.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'ISTJ · INTJ', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.50, .55, .50, .55, .45],
      text: 'A private moral sense, real but narrow — fierce loyalty to a few people and principles, guarded like contraband and dismissed in public as "just being practical". It blooms, quietly, with age.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'ESTJ · ENTJ', shadow: false, series: 3,
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: 0 },
      dial: [.25, .30, .30, .30, .35],
      text: 'Feeling arrives late and off-balance. Long stretches of "emotions are noise in the data", punctuated — under stress — by waves of wounded, moralizing sentiment that don\'t sound like them at all.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'ENFJ · ESFJ', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.35, .40, .50, .30, .20],
      text: 'The stubborn conscience. When their Fe harmonizing is challenged, Fi wakes up contrary — "I don\'t care what the room needs, this is where I stand" — protective, prickly, and briefly immovable.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'INFJ · ISFJ', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.30, .45, .40, .25, .15],
      text: 'An inner voice that interrogates the heart: "do you even know what you want? your feelings are self-indulgent." Harsh, sporadic, and aimed mostly at the self.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'ESTP · ENTP', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.20, .25, .35, .15, .10],
      text: 'Personal conviction as a trap to wriggle out of. Asked what they truly feel, this position deflects with charm or contrarian play — blind, without malice, to the difference between a value and a preference.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'ISTP · INTP', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.15, .30, .25, .10, .05],
      text: 'Rarely touched, and volcanic when it erupts: a conviction of worthlessness or betrayal so total it presents itself as objective fact — moral certainty aimed inward like a weapon.' },
  ];

  const FEEDERS = [
    { key: 'ne', name: 'Ne', color: COL.n, canonical: true, pair: 'the INFP coupling',
      cfg: { rate: .36, branchy: .85, speed: .35, spread: .95, persistence: .35 },
      text: 'Moral imagination. Ne delivers forking possibilities, and each one is struck against the core — could I live with this? who would I be in that world? The hierarchy grows wide: many futures held lightly, waiting to see which ones ring true.' },
    { key: 'se', name: 'Se', color: COL.s, canonical: true, pair: 'the ISFP coupling',
      cfg: { rate: .58, branchy: 0, speed: 1, spread: .15, persistence: .95 },
      text: 'Embodied conviction. Se delivers the vivid, concrete present — Fi weighs what is actually here, now, in front of it. The hierarchy grows tight and lived-in: taste, beauty, and right-action felt in the hands rather than argued in the head.' },
    { key: 'si', name: 'Si', color: '#c07f10', canonical: false, pair: 'the loop coupling (Fi–Si, INFP under stress)',
      cfg: { rate: .3, branchy: 0, speed: .3, spread: .2, persistence: 1 },
      text: 'Experience drawn from the archive rather than the world: old wounds and old kindnesses replayed against the core tone, verdicts re-felt instead of re-tested. Tender, airless, and increasingly detached from anything new — the visual signature of a cognitive loop.' },
    { key: 'ni', name: 'Ni', color: '#7148d8', canonical: false, pair: 'a non-standard coupling',
      cfg: { rate: .15, branchy: .15, speed: .2, spread: .5, persistence: .7 },
      text: 'Speculative: a thin stream of pre-converged meaning. Fi receives few experiences but heavy ones — each arrival re-weighing the whole hierarchy at once. No standard stack places Ni directly above Fi.' },
    { key: 'te', name: 'Te', color: '#3fb4c9', canonical: false, unstable: true, pair: 'judging feeding judging',
      cfg: { rate: .12, branchy: 0, speed: .3, spread: .4, persistence: .5 },
      text: 'Two sorters, no gatherer. Te hands Fi verdicts about efficiency rather than lived experience — the chamber idles hungry, with almost nothing arriving to weigh. This is why real stacks alternate perceiving and judging.' },
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
      { id: 'btnAuthGood', label: 'Experience authentic joy', sub: 'something true and resonant', color: '#f0b95c' },
      { id: 'btnAuthBad', label: 'Experience authentic grief', sub: 'true, painful, held deeply', color: '#6272dd' },
      { id: 'btnFakeGood', label: 'Hear an inauthentic pleasantry', sub: 'flattery glides off unabsorbed', color: '#ffd9e6' },
      { id: 'btnFakeBad', label: 'Witness an inauthentic violation', sub: 'a falsehood tears the mist', color: COL.crit },
    ],
    narrations: {
      authGood: 'Something joyful — and true — arrives. It rings against the core, diffuses deep into the nebula, and sets the mist gently turning. Pleasure blooms, and for a while the colour of the whole warms toward what was taken in.',
      authBad: 'Something painful — and true. Fi does not flinch: the grief diffuses inward and the mist slows, darkens, and holds it. Stress rises, but so does resonance — this is not enjoyment, it is rightness. It, too, will colour the whole.',
      fakeGood: 'Flattery arrives — pleasant, glossy, and hollow. The mist refuses to mix with it…',
      fakeGoodEnd: '…it glides along the inside of the chamber, dissolving nothing and being dissolved by nothing, is politely tolerated — and shown out exactly as it came. The nebula keeps none of it.',
      fakeBad: 'A falsehood strikes what matters. It tears straight through the nebula — mist churns away from its path, a vacuum drags behind it —',
      fakeBadMid: '— and some of the mist bleeds out through the wound. The chamber red-shifts while everything attached to the wounded value finds a new place.',
      fakeBadEnd: '…the wound closes. The mist stills, the colour steadies — darker in places, rearranged in others. Fi keeps what was real, and remembers where it bled.',
    },
  };

  /* hero text */
  const HERO = {
    tag: 'introverted feeling',
    title: 'Introverted Feeling',
    subtitle: 'A quiet nebula around a core tone — weighing every experience against an unargued inner compass.',
  };

  /* zone B heading */
  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Fi',
    lede: 'Click any position to see how the nebula changes — from the deep, steady conviction of a dominant to the volcanic, inward-facing moral certainty of the demon. Drag the maturity slider to watch the lower positions slowly gain fidelity with age.',
  };

  /* zone C heading */
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Fi?',
    lede: 'Every judging function needs a perceiving partner to deliver raw material. Click a feeder to watch how the nebula changes shape and motion.',
  };

  /* zone D heading */
  const ZONE_D = {
    kicker: 'Zone D · verification lab',
    heading: 'The Verification Lab',
    lede: 'Watch Fi weigh experiences against its core tone in real time. Each button triggers a different lifecycle event inside the nebula.',
  };

  /* zone E heading */
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Fi costs energy. The lower it sits in the stack, the more expensive it becomes — and the faster the battery drains.',
  };

  /* zone F */
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Fi shows up in daily life.',
    mirror: { label: 'Fi', counterpart: 'Fe', counterpartColor: COL.f },
    vignettes: [
      { title: 'The Silent Compass', text: 'An INFP sits quietly in a meeting where everyone agrees on a compromise. Suddenly they say "no" — not loudly, not with a ten-point argument, but with an absolute firmness that stops the room.' },
      { title: 'The Loop', text: 'Under stress, INFP Fi pairs with tertiary Si: replaying old wounds and old kindnesses against the core tone, re-feeling verdicts instead of re-testing them. Tender, airless, and detached from anything new.' },
      { title: 'The Inferior Eruption', text: 'An ESTJ under stress suddenly breaks down into overwhelming, wounded moralizing — accusing others of betrayal and heartlessness with an intensity that startles everyone.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, VERIFY, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
