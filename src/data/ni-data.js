/* ============================================================
   CURRENTS · Ni page data
   All content, parameters, models, and configuration specific
   to the Introverted Intuition page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadNiData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  /* Type mappings follow the Beebe shadow rule: slots 5–8 are slots 1–4 with
     the attitude flipped, so an Ni-dominant type's Ne-dominant mirror carries
     Ni in the opposing role, and so on down. */
  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'INTJ · INFJ', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.92, .88, .35, .55, .80],
      text: 'Everything is read for where it is going. The work itself is invisible — long stretches in which nothing legible happens — and then an answer arrives whole, already certain, with no account of how it got there. Being asked to show the steps is genuinely hard, because the steps were never held separately.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'ENTJ · ENFJ', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.78, .78, .45, .72, .72],
      text: 'The long read in service of something already underway. Ni here supplies direction rather than identity — a sense of where this is heading, which the dominant judging function converts into a plan or a room to manage. Quicker to state, easier to argue with, and far less likely to sit on one image for a decade.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'ISTP · ISFP', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.48, .50, .40, .48, .42],
      text: 'Pattern reading that arrives in bursts and is trusted unevenly. A sudden clear sense of how a situation plays out — usually sound, occasionally a whole story built on nothing — with little interest in defending either. It steadies with age, mostly by learning which of its own hunches to check.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'ESTP · ESFP', shadow: false, series: 3,
      /* the inferior doom-vision *is* a premature convergence — total certainty
         on very little — so it carries a trace of `contrary` without the
         shadow register's cursor-fighting */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      dial: [.24, .28, .30, .26, .32],
      text: 'The future arrives as a verdict rather than a forecast. Long stretches of living in the present, punctuated — usually under fatigue or stress — by sudden total certainty that this ends badly, always was going to, and is not open to discussion. It shows up in a register that does not sound like them.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'ENTP · ENFP', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.34, .38, .48, .30, .22],
      text: 'The counter-vision. When somebody else\'s single read of the future starts closing options down, Ni wakes up combative and produces a rival certainty — one darker, more inevitable ending, held exactly long enough to refuse the first one.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'INTP · INFP', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.28, .42, .38, .26, .16],
      text: 'An inner forecaster with one bad habit. Ni turns inward and issues verdicts about how one\'s own life goes — this is what you are, this is where it ends — total, unsourced, and aimed at nobody else.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'ESTJ · ESFJ', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.20, .24, .34, .16, .10],
      text: 'Implication as a rigged game. Either nothing is between the lines or everything is, so this position alternates between missing subtext that was plainly there and constructing an elaborate one nobody meant — without malice, and usually without noticing which it just did.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'ISTJ · ISFJ', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.14, .28, .26, .10, .06],
      text: 'Rarely touched, and total when it erupts: one black certainty about how all of this ends, applied to everything at once, immune to evidence, and unbothered that yesterday\'s version of it said something different.' },
  ];

  /* Introverted judging is fed by extraverted perception; extraverted judging
     is fed by introverted perception. Ni is introverted *perception*, so its
     canonical feeders are the extraverted judgers — Te and Fe. Both supply the
     one thing the chamber cannot make for itself: correction from outside.

     cfg keys, all of which the engine actually reads:
       rate        fragments arriving per second
       weight      how much each one moves the readout
       speed       inward transit speed
       spread      angular coverage — a few aimed channels vs. a whole horizon
       persistence how long material stays held before the picture leaks away
       sealed      judgment supplied from inside only (a loop)
       starve      perception feeding perception: nothing judges anything */
  const FEEDERS = [
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: true, pair: 'the INTJ · ENTJ coupling',
      cfg: { rate: .10, weight: 1.05, speed: .40, spread: .34, persistence: .95, aim: 3.14 },
      text: 'Convergence aimed at a system. Te hands back results, measurements, and the current state of the plan — few inputs, each of them hard, each arriving on a narrow aimed channel. The image that forms is about how a structure moves over years, and it gets corrected when the numbers disagree with it. This is the bluntest error-correction Ni has, and the most reliable.' },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: true, pair: 'the INFJ · ENFJ coupling',
      cfg: { rate: .30, weight: .52, speed: .46, spread: .62, persistence: .90, aim: 3.05 },
      text: 'Convergence aimed at people. Fe returns the state of the room — what is actually going on between these particular people, and what they are likely to do with it. More channels, smaller inputs, and an image about trajectories of relationship rather than of systems. Correction arrives socially: the read gets checked against how people actually respond to it, which is slower than a number and harder to dismiss.' },
    { key: 'se', name: 'Se', color: COL.s, canonical: false, unstable: true, pair: 'perception feeding perception',
      warn: 'Unstable coupling: perception feeding perception, with nothing judging either.',
      cfg: { rate: .95, weight: .16, speed: .95, spread: 1.0, persistence: .18, starve: true },
      text: 'Two gatherers, no judge. Se floods the aperture with the present — dense, concrete, immediate, all of it true and none of it going anywhere — while nothing sorts any of it. Fragments arrive faster than they can be held, the picture keeps almost forming and leaking away, and the readout creeps instead of climbing. These two also sit on the same axis: what one takes as obvious, the other treats as noise. This is why real stacks alternate perceiving and judging.' },
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: false, pair: 'the INFJ Ni–Ti loop',
      warn: 'Loop coupling: introverted judging feeding introverted perception — no correction from outside.',
      cfg: { rate: .26, weight: .85, speed: .55, spread: .45, persistence: .99, sealed: true, aim: 3.30 },
      text: 'The INFJ loop, with Fe cut out. Ti does supply judgment, but from inside: the image is checked for internal consistency and never against anything in the room. Convergence gets faster and the certainty gets tighter, and the boundary seals one turn further — because the only thing correcting the picture is the same head that produced it. Notice how often it fires early in this state.' },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: false, pair: 'the INTJ Ni–Fi loop',
      warn: 'Loop coupling: introverted judging feeding introverted perception — no correction from outside.',
      cfg: { rate: .22, weight: .95, speed: .50, spread: .40, persistence: .99, sealed: true, aim: 2.95 },
      text: 'The INTJ loop, with Te cut out. Fi supplies judgment, also from inside: the image is weighed against what matters to one person and nothing else. Airless and self-confirming — a read of how all of this goes that gets more certain the longer nobody outside is allowed to touch it, and no more accurate.' },
  ];

  /* ---- drain model ----
     Ni's dominant curve carries a deeper, rarer notch than Te's: insights land
     less often than milestones do, and an insight that lands pays back more. */
  function domDrain(t) {
    const base = 11.8 * (t / 60);
    const phase = (t % 18) / 18;
    const notch = 2.6 * Math.max(0, 1 - Math.abs(phase - 0.06) * 6);
    return Math.max(0, base - notch);
  }
  function shadowDrain(t) {
    const base = 19 * Math.pow(t / 60, 1.22);
    let spikes = 0;
    for (const [st, mag] of [[13, 11], [37, 9], [64, 13], [92, 8]]) {
      if (t >= st) spikes += mag * clamp((t - st) / 1.6, 0, 1);
    }
    const wiggle = t < 2 ? 0 : 1.7 * Math.sin(t * 0.8) + 1.3 * Math.sin(t * 2.1 + 0.7);
    return clamp(base + spikes + wiggle, 0, 100);
  }

  const SERIES = [
    { key: 'dom', label: 'Dominant', color: COL.pos[0], f: domDrain },
    { key: 'aux', label: 'Auxiliary', color: COL.pos[1], f: t => 20 * Math.pow(t / 60, 1.06) },
    { key: 'tert', label: 'Tertiary', color: COL.pos[2], f: t => 29 * Math.pow(t / 60, 1.4) },
    { key: 'inf', label: 'Inferior', color: COL.pos[3], f: t => Math.min(100, 84 * Math.pow(t / 60, 1.9)) },
    { key: 'sh', label: 'Shadow', color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 84, 1 / 1.9);

  const COSTS = [
    { label: 'Dominant', v: 1.0, color: COL.pos[0], series: 0 },
    { label: 'Auxiliary', v: 1.5, color: COL.pos[1], series: 1 },
    { label: 'Tertiary', v: 2.5, color: COL.pos[2], series: 2 },
    { label: 'Inferior', v: 4.0, color: COL.pos[3], series: 3 },
    { label: 'Shadow', v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: 'Dominant', color: COL.pos[0], note: 'Refills partly during use — every insight that lands pays a little back.',
      f: t => t <= 30 ? 100 - SERIES[0].f(t) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t - 30) / 7)) },
    { label: 'Auxiliary', color: COL.pos[1], note: 'Clean recovery once the read has been handed over to somebody.',
      f: t => t <= 30 ? 100 - SERIES[1].f(t) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t - 30) / 11)) },
    { label: 'Tertiary', color: COL.pos[2], note: 'Slower: the pattern-chasing has to actually be put down first.',
      f: t => t <= 30 ? 100 - SERIES[2].f(t) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t - 30) / 17)) },
    { label: 'Inferior', color: COL.pos[3], note: 'The hangover shelf: ~30 min where the whole system runs dim and the doom-read keeps repeating.',
      f: t => t <= 30 ? 100 - SERIES[3].f(t) : (t < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t - 60) / 21))) },
    { label: 'Shadow', color: COL.sh, note: 'Incomplete — some of the charge simply does not come back today.',
      f: t => t <= 30 ? 100 - SERIES[4].f(t) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t - 30) / 26)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- perception fidelity lab ----
     Te's lab asks what happens when results come back. Ni has nothing to check
     against until the picture is finished, so this one asks what happens when
     perception converges — and when it converges on too little. */
  const VERIFY = {
    buttons: [
      { id: 'btnFragment', label: 'Feed it a correlated fragment', sub: 'faint on its own, and it means nothing yet', color: COL.fn },
      { id: 'btnForce', label: 'Force the picture now', sub: 'converge on whatever is in there', color: COL.warn },
      { id: 'btnContradict', label: 'Contradict the held image', sub: 'one fact the picture cannot absorb', color: COL.crit },
      { id: 'btnLiteral', label: 'Hand it the literal present', sub: 'concrete, immediate, unmistakably here', color: COL.s },
    ],
    narrations: {
      fragEarly: 'A fragment sinks in and starts to orbit. On its own it is not evidence of anything and carries no argument — the readout moves a little, and nothing legible has happened. Keep feeding it.',
      fragMid: 'More material, still nothing to show for it. This is most of what Ni does: holding fragments in circulation, without a conclusion, for as long as it takes. From outside it is indistinguishable from doing nothing, which is a large part of why the function is hard to describe and easy to romanticise.',
      fragLate: 'The streams are thickening and the core is getting dense. Still no answer — but the shape of one is close enough now that the chamber has stopped taking new material seriously and started closing on what it has.',
      fragHeld: 'There is already an image in place, so the new material is being taken at a quarter rate — the chamber has what it came for and is not really looking any more. This is Ni\'s confirmation bias, and it is structural rather than moral: the aperture is busy. Contradict the image, or wait for it to release, and the readout starts moving properly again.',
      fragFlare: '…and it lands. The core takes everything in orbit at once and the answer arrives whole — not assembled in front of you, not argued to, simply there and already certain. Now look at what happened to the fragments: they are gone. There is nothing left to show anybody. This is why Ni users say "I just know" and sound evasive when they mean it literally.',
      force: 'Forced. The flare is exactly as bright, the image is exactly as hard-edged, and the pleasure meter reads the same as it did for the real one — check it. The only thing that differs is the arc it fired at: {pct}% of the material it needed. There is no signal from inside that this one is thinner. That is the whole problem with the function.',
      forceAfter: 'The image is holding, and it is marked here only because this is a diagram. In a life it gets acted on: plans made, people re-read, a decision that will not be revisited. It will hold until something arrives that it cannot absorb.',
      contradict: 'One fact the picture cannot hold. Watch what does not happen — it does not patch. The image comes apart, the orbiting material goes with it, and the readout drops to nothing…',
      contradictEnd: '…and the long quiet starts again from zero. This is the real cost of Ni being wrong: not the error, but the fact that revision here is not editing, it is rebuilding from the beginning. It is also why somebody will defend an image well past the point where defending it is reasonable. The alternative is not a correction — it is another twelve minutes of nothing.',
      contradictNone: 'There is no image to contradict yet. Feed it fragments until something converges, or force a flare — then bring the contradiction and watch what it costs.',
      literal: 'Something concrete, immediate, and unambiguously here. It enters the aperture, crosses the entire chamber, and leaves without registering: no absorption, no orbit, no movement on the readout.',
      literalEnd: 'Nothing was rejected. Nothing was noticed. The unregistered counter is the only trace it happened at all — the counterpart to Te throwing out a claim it cannot measure, and about as expensive. Present-tense facts arrive in a shape this chamber does not catch.',
    },
    idle: 'The chamber runs on its own: streams enter, material circulates, the readout climbs. Nothing legible will happen for a while — that is the function, not a loading state. Feed it, force it, or contradict it.',
  };

  const HERO = {
    tag: 'introverted intuition',
    title: 'Introverted Intuition',
    subtitle: 'Dozens of faint streams funnelling inward for a long quiet while — and then one point that flares with an answer already whole.',
  };

  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Ni',
    lede: 'Click any position to see how the read changes — from the unhurried, inexorable funnel of a dominant to the demon\'s single black certainty that fires on almost nothing. Watch the convergence readout: it tells the whole story before the caption does. Drag the maturity slider to watch the lower positions slowly gain fidelity with age.',
  };
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Ni?',
    lede: 'Introverted judging is fed by extraverted perception — and extraverted judging by introverted perception. Ni is introverted perception, so its real partners are the extraverted judgers: Te and Fe. Click a feeder to watch what converges.',
  };
  const ZONE_D = {
    kicker: 'Zone D · perception fidelity lab',
    heading: 'The Perception Fidelity Lab',
    lede: 'Te verifies against results. Ni has nothing to verify against until the picture is finished — so this lab asks a different question: what happens when perception converges, and what happens when it converges on too little?',
  };
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Ni costs energy. The lower it sits in the stack, the more expensive it becomes. Note the small notches in the dominant curve: an insight that lands pays a little back. Note also which way the grip runs here — a collapsed Ni-dominant does not get more Ni, it floods into inferior Se.',
  };
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Ni shows up in daily life.',
    mirror: { label: 'Ni', counterpart: 'Ne', counterpartColor: 'var(--c-n)' },
    vignettes: [
      { title: 'The Meeting', text: 'Ten minutes in, an Ni-dominant knows how the project ends, and says so. Asked why, they produce a reason that is true but is not the reason — it is the nearest sayable thing to a read that never had steps. Six months later they turn out to be right, which does nothing at all to improve the next explanation.' },
      { title: 'The Loop', text: 'Under stress, INFJ Ni pairs with tertiary Ti: both introverted, both inward, with Fe\'s contact with actual people cut out between them. The read gets more elaborate, more internally consistent, and more certain, and nobody outside that head has touched it in weeks.' },
      { title: 'The Grip', text: 'An INTJ past the end of their reserves stops seeing where anything is going and floods into inferior Se — buying things, driving too fast, eating and drinking past the point of noticing, working the body until it is the only thing in the room. Not a personality change: a low-capacity chamber taking a dominant-sized flood.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, VERIFY, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
