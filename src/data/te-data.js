/* ============================================================
   CURRENTS · Te page data
   All content, parameters, models, and configuration specific
   to the Extraverted Thinking page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadTeData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'ENTJ · ESTJ', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.95, .95, .90, .95, .90],
      text: 'The world is a machine that could be running better. Structure goes up constantly and effortlessly — goals, sequences, owners, dates — and competence feels like identity itself. The scaffold is large, brisk, and metronomic: the flag keeps moving because the work keeps shipping.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'INTJ · ISTJ', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.80, .85, .80, .85, .78],
      text: 'The executive arm rather than the visionary. Te here serves the dominant perceiver — Ni\'s long read or Si\'s proven record gets turned into a plan with dates on it — but the structure is raised deliberately, in service of something, rather than for its own sake.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'ENFP · ESFP', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.50, .55, .50, .55, .45],
      text: 'Competence that arrives in bursts. Genuine organizing skill in the few domains they care about — a beautiful spreadsheet built at 1 a.m. for a project that matters — and near-total indifference to it everywhere else. It steadies with age.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'INFP · ISFP', shadow: false, series: 3,
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: 0 },
      dial: [.25, .30, .30, .30, .35],
      text: 'Efficiency arrives late, blunt, and all-or-nothing. Long stretches of resisting metrics as reductive, punctuated — usually under stress — by frantic list-making and harsh verdicts about who is and isn\'t competent, delivered in a voice that doesn\'t sound like them.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'INTP · ISTP', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.35, .40, .50, .30, .20],
      text: 'The counter-organizer. When their own framework is overridden by somebody else\'s process, Te wakes up combative — producing a rival plan, rival numbers, a rival schedule — less to get the thing done than to refuse being managed.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'ENTP · ESTP', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.30, .45, .40, .25, .15],
      text: 'An inner efficiency auditor. Te turns inward as a scolding voice — "you\'re disorganized, you waste time, look how little you actually finished" — harsh, sporadic, and aimed mostly at the self.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'INFJ · ISFJ', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.20, .25, .35, .15, .10],
      text: 'Process as a trap to sidestep. Metrics and org charts feel like a rigged game; this position deflects them with vagueness or with over-compliance so literal it breaks the system — and is blind, without malice, to the deadlines it\'s accused of missing.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'ENFJ · ESFJ', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.15, .30, .25, .10, .05],
      text: 'Rarely touched, and brutal when it erupts: people reduced to their output, relationships audited for return, and one\'s own worth calculated in deliverables — then found wanting, in a voice that calls itself objective.' },
  ];

  /* Introverted judging is fed by extraverted perception; extraverted judging
     is fed by introverted perception. Te's canonical partners are Ni and Si. */
  const FEEDERS = [
    { key: 'ni', name: 'Ni', color: '#7148d8', canonical: true, pair: 'the ENTJ · INTJ coupling',
      cfg: { rate: .22, branchy: .10, speed: .28, spread: .95, persistence: 1.0 },
      text: 'Strategic build. Ni delivers few inputs, each one enormous and already converged — one read of where all of this is going. The scaffold grows tall, narrow and unhurried, aimed at a flag nobody else can see yet, and it will keep building toward that flag for years.' },
    { key: 'si', name: 'Si', color: '#c07f10', canonical: true, pair: 'the ESTJ · ISTJ coupling',
      cfg: { rate: .85, branchy: .05, speed: .55, spread: .25, persistence: .95 },
      text: 'Procedural build. Si delivers the proven record — what was done before, what worked, what the standard is. The scaffold grows wide, regular and inspectable: checklists, precedent, and parts with known load ratings. Nothing exotic, and nothing that fails on a Tuesday.' },
    { key: 'ne', name: 'Ne', color: COL.n, canonical: false, pair: 'the ENFP coupling (Te two floors down)',
      cfg: { rate: .55, branchy: .90, speed: .60, spread: .90, persistence: .30 },
      text: 'Te handed more open plans than it can finish. Bays are started everywhere, the structure sprawls, and the work behind the build head visibly comes apart while attention is spent ahead of it. High energy, high scrap, a counter that climbs in bursts — tertiary Te with a dominant perceiver two floors above it.' },
    { key: 'se', name: 'Se', color: COL.s, canonical: false, pair: 'the ISFP · ESFP coupling',
      cfg: { rate: .95, branchy: .15, speed: 1.0, spread: .18, persistence: .35 },
      text: 'Tactical execution. Se delivers what is physically here, right now, and Te organizes it on the spot. The build is short, fast and disposable: the thing in front of you gets sorted out beautifully, and by tomorrow there is no structure left standing.' },
    { key: 'fi', name: 'Fi', color: '#c2415f', canonical: false, unstable: true, pair: 'judging feeding judging',
      cfg: { rate: .10, branchy: 0, speed: .30, spread: .45, persistence: .5, starve: true },
      text: 'Two sorters, no gatherer. Fi hands Te verdicts about what matters rather than observations about what is — the chamber idles hungry, with almost nothing arriving to measure. And these two sit on the same axis: whatever one accepts, the other tends to distrust. This is why real stacks alternate perceiving and judging.' },
  ];

  /* ---- drain model ----
     Te's dominant curve carries a small notch at each delivered milestone:
     finishing things visibly pays a little energy back. */
  function domDrain(t) {
    const base = 12.6 * (t / 60);
    const phase = (t % 15) / 15;
    const notch = 1.9 * Math.max(0, 1 - Math.abs(phase - 0.09) * 7);
    return Math.max(0, base - notch);
  }
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
    { key: 'dom', label: 'Dominant', color: COL.pos[0], f: domDrain },
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
    { label: 'Dominant', color: COL.pos[0], note: 'Refills as things get finished — every delivered milestone pays a little back.',
      f: t => t <= 30 ? 100 - SERIES[0].f(t) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t - 30) / 6)) },
    { label: 'Auxiliary', color: COL.pos[1], note: 'Quick, clean recovery once the plan is out of its hands.',
      f: t => t <= 30 ? 100 - SERIES[1].f(t) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t - 30) / 10)) },
    { label: 'Tertiary', color: COL.pos[2], note: 'A slower refill; the organizing has to actually stop first.',
      f: t => t <= 30 ? 100 - SERIES[2].f(t) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t - 30) / 16)) },
    { label: 'Inferior', color: COL.pos[3], note: 'The hangover shelf: ~30 min where the whole system runs dim.',
      f: t => t <= 30 ? 100 - SERIES[3].f(t) : (t < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t - 60) / 20))) },
    { label: 'Shadow', color: COL.sh, note: 'Incomplete — some of the charge simply doesn\'t come back today.',
      f: t => t <= 30 ? 100 - SERIES[4].f(t) : lvl(4) + (93 - lvl(4)) * (1 - Math.exp(-(t - 30) / 25)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- verify lab config ----
     Ti verifies against its own coherence; Te verifies against results. */
  const VERIFY = {
    buttons: [
      { id: 'btnShip', label: 'Ship it — and the result comes back good', sub: 'the world returns a number', color: '#19a94a' },
      { id: 'btnPrune', label: 'Measure an underperforming section', sub: 'flagged, then cut with a snap', color: COL.warn },
      { id: 'btnVague', label: 'Receive an unmeasurable claim', sub: '"this matters, and I can\'t show you"', color: COL.f },
      { id: 'btnReplan', label: 'The goalpost moves', sub: 'new target, same afternoon', color: COL.crit },
    ],
    narrations: {
      ship: 'A plan met the world and the world said yes. The bay locks solid, the build head jumps, and the counter moves. This is Te\'s pleasure — not elegance, not certainty, but evidence: it worked, and there is a number to prove it.',
      prune: 'The metrics land on a section that has been quietly underperforming. It is flagged — no argument, no defence —',
      pruneMid: '— and cut loose. The members are thrown clean out of the chamber, the gap closes with a snap, and everything downstream shifts up to fill it.',
      pruneEnd: '…and throughput settles back higher than it was. Nothing was mourned. Something was removed, and the structure that remains is sounder for it. This is Te\'s version of being right.',
      vague: 'Someone says: this matters, and I can\'t show you a number for it. The material drifts in — soft, closed, no edges to sort by…',
      vagueMid: 'Te tries it against slot after slot. Nothing takes. There is no measurement to place it by, so the machine keeps handing it back to itself while stress quietly climbs.',
      vagueEnd: '…and it is shown out, unprocessed. Not because it was false — because this chamber only accepts what can be counted, and that was the wrong shape for the machine. Every Te user has thrown something real out of this door.',
      vagueBusy: 'Something unmeasurable is already loose in the chamber, and the lane is running slow because of it. Let it leave before sending another.',
      replan: 'The target just moved — the deadline, or the objective, or both. Stress floods the chamber and the whole build stops mattering in its current form —',
      replanMid: '— half-built bays are scope-cut, a storey is dropped, and the scaffold tears itself down to what can still be aimed at the new flag.',
      replanEnd: '…and settles. Different span, different height, pointed somewhere else. Te didn\'t grieve the old plan; it re-pointed at the new one and started counting again from here. That speed is the whole advantage — and the whole cost.',
    },
    idle: 'Click an event above to send feedback into the chamber. Watch what the scaffold does when the numbers come back — and what it does with material that has no number at all.',
  };

  /* hero text */
  const HERO = {
    tag: 'extraverted thinking',
    title: 'Extraverted Thinking',
    subtitle: 'A scaffold thrown up against the world — sorting what works from what doesn\'t, and building toward the flag.',
  };

  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Te',
    lede: 'Click any position to see how the build changes — from the metronomic output of a dominant to the skeletal, self-undoing structure of the demon. Drag the maturity slider to watch the lower positions slowly gain fidelity with age.',
  };
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Te?',
    lede: 'Introverted judging is fed by extraverted perception — and extraverted judging by introverted perception. Te\'s real partners are Ni and Si. Click a feeder to watch what it builds.',
  };
  const ZONE_D = {
    kicker: 'Zone D · verification lab',
    heading: 'The Verification Lab',
    lede: 'Ti verifies against its own coherence. Te verifies against results: build the thing, measure what comes back, keep or cut accordingly. Each button sends a different kind of feedback into the chamber.',
  };
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Te costs energy. The lower it sits in the stack, the more expensive it becomes — and the faster the battery drains.',
  };
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Te shows up in daily life.',
    mirror: { label: 'Te', counterpart: 'Ti', counterpartColor: '#3a93ad' },
    vignettes: [
      { title: 'The Reorg', text: 'A dominant Te user restructures a struggling team in a week. Reporting lines are cleaner, the numbers improve, and three people find out their jobs changed from an org chart. Both halves of that sentence are Te.' },
      { title: 'The Loop', text: 'Under stress, ENTJ Te pairs with tertiary Se: both extraverted, both outward, with Ni\'s long view cut out between them. Cut, execute, buy, move — relentless competence with nobody left asking whether the goal is still the right one.' },
      { title: 'The Inferior Eruption', text: 'An INFP under pressure suddenly turns brittle and procedural — spreadsheets at 2 a.m., a hard verdict about who is and isn\'t pulling their weight, and a coldness that startles everyone, including them.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, VERIFY, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
