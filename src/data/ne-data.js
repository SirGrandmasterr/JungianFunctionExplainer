/* ============================================================
   CURRENTS · Ne page data
   All content, parameters, models, and configuration specific
   to the Extraverted Intuition page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadNeData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  /* Type mappings follow the Beebe shadow rule: slots 5–8 are slots 1–4 with
     the attitude flipped — the exact mirror of the Ni page's table. */
  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'ENTP · ENFP', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.80, .50, .95, .55, .70],
      text: 'Everything is raw material for what it could become. Branching is effortless, constant, and identity-defining — a fact arrives and is already three analogies and a business idea, none of them finished, all of them live. The strain is never generating; it is being asked to stop.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'INTP · INFP', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.68, .58, .82, .68, .74],
      text: 'Divergence in service of a judge. The dominant introverted judgment — a framework, a felt conviction — hands Ne its problems, and Ne returns options: possible causes, possible framings, possible lives. Narrower than a dominant\'s spray, easier to stop, and far more likely to hand the good branch over instead of growing it for its own sake.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'ESTJ · ESFJ', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.45, .40, .60, .48, .40],
      text: 'Possibility as a weekend visitor. Real brainstorming ability that shows up in bursts — the offsite with sticky notes, the renovation scheme at midnight — trusted unevenly and dropped fast when the plan reasserts itself. It steadies with age, mostly by being let out on purpose instead of by accident.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'ISTJ · ISFJ', shadow: false, series: 3,
      /* the inferior what-if engine fires as catastrophe — every unfamiliar
         option at once, all ending badly — so it carries a trace of
         `contrary` without the shadow register's cursor-fighting */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .10 },
      dial: [.22, .30, .35, .24, .30],
      text: 'Possibility arrives mostly as threat. Long stretches of trusting the proven way, punctuated — under fatigue or forced change — by what-ifs that are sudden, catastrophic, and weirdly total: every unfamiliar option at once, all of them ending badly, in a voice that does not sound like them.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'INTJ · INFJ', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.32, .34, .55, .28, .20],
      text: 'The counter-brainstorm. When somebody\'s scatter of options threatens the single long read, Ne wakes up combative — spraying rival possibilities not to explore them but to demonstrate that options are cheap, and that cheapness is the argument against them.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'ENTJ · ENFJ', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.26, .40, .45, .24, .16],
      text: 'An inner heckler of roads not taken. Ne turns inward and audits one\'s own commitments — you never considered the other offer, the other city, the other life — sporadic, unhelpful, and aimed at decisions already made and unmakeable.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'ISTP · ISFP', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.18, .22, .40, .14, .10],
      text: 'Hypotheticals as a rigged game. Either the alternative scenario is invisible or it is absurd — this position alternates between missing the plausible what-if entirely and producing one so outlandish it discredits the exercise, without malice, and usually without noticing which it just did.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'ESTP · ESFP', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.12, .24, .35, .10, .06],
      text: 'Rarely touched, and corrosive when it erupts: possibility itself turns hostile, and the vivid present is suddenly surrounded by everything that could go wrong with it — all of it at once, none of it actionable, aimed at whatever is currently loved.' },
  ];

  /* Extraverted perception is fed by introverted judgment; introverted
     perception by extraverted judgment. Ne is extraverted *perception*, so
     its canonical feeders are the introverted judges — Ti and Fi. Both supply
     the one thing the chamber cannot make for itself: a reason to keep some
     branches and let the rest go.

     cfg keys, all of which the engine actually reads:
       rate        stimuli arriving per second
       weight      burst size each stimulus triggers
       speed       inbound transit speed
       depth       how many generations a burst develops
       spread      angular width of branching
       persistence how long branches stay alive before withering
       filter      fraction of finished growth the judge culls (Ti's snips)
       valued      chance a branch aligns with the core and persists (Fi)
       curl        Si's gravity — new shoots curl back toward the trunk
       starve      perception feeding perception: nothing judges anything
       loop        extraverted judging feeding extraverted perception:
                   growth hugs the rim, the core hollows, the gap widens */
  const FEEDERS = [
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: true, pair: 'the ENTP · INTP coupling',
      cfg: { rate: .28, weight: .95, speed: .55, depth: .9, spread: .5, persistence: .85, filter: .5 },
      text: 'Divergence with a logic gate. Ti sits inside the loop and load-tests every branch as it grows: the inconsistent ones are snipped early — watch the clean cuts — and the survivors grow long, load-bearing chains of implication. Fewer live branches than raw Ne, and each one can be defended for an hour. This is the debater\'s tree: breadth pruned into arguments.' },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: true, pair: 'the ENFP · INFP coupling',
      cfg: { rate: .30, weight: .85, speed: .5, depth: .65, spread: .7, persistence: .95, valued: .45 },
      text: 'Divergence with a compass. Fi sits inside the loop and weighs every branch for whether it matters: the ones aligned with the core glow rose and persist, the merely-clever ones wither on schedule. The tree grows lopsided toward what is loved — fewer directions than raw Ne, held longer, and abandoned only when the value underneath them moves.' },
    { key: 'si', name: 'Si', color: COL.s, canonical: false, unstable: true, pair: 'perception feeding perception',
      warn: 'Unstable coupling: perception feeding perception, with nothing judging either.',
      cfg: { rate: .95, weight: .25, speed: .9, depth: .3, spread: .35, persistence: .3, starve: true, curl: .8 },
      text: 'Two gatherers, no judge. Si floods the chamber with precedent — how it went before, how it is always done — and nothing sorts any of it. Watch the branches: they come out stunted and curl back toward the trunk, because every new shoot is answered with an old record instead of a verdict. These two also sit on the same axis: what one calls possibility, the other calls a departure from the file. This is why real stacks alternate perceiving and judging.' },
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: false, pair: 'the ENFP Ne–Te loop',
      warn: 'Loop coupling: extraverted judging feeding extraverted perception — no inner check.',
      cfg: { rate: .5, weight: .7, speed: .7, depth: .45, spread: .95, persistence: .3, loop: true },
      text: 'The ENFP loop, with Fi cut out. Te does supply judgment, but only about action: every branch is converted to a project the moment it sprouts — watch growth hug the rim, launched half-grown into the world. Nothing asks whether any of it matters, because the function that would ask was skipped. Velocity climbs, the center hollows, and the graveyard fills.' },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: false, pair: 'the ENTP Ne–Fe loop',
      warn: 'Loop coupling: extraverted judging feeding extraverted perception — no inner check.',
      cfg: { rate: .55, weight: .6, speed: .7, depth: .4, spread: 1.0, persistence: .28, loop: true },
      text: 'The ENTP loop, with Ti cut out. Fe supplies the judgment of the room: branches that get a reaction grow, branches that land flat are dropped mid-sentence. The tree becomes a performance — breadth impressive, rim-bright, checked against applause and never against coherence. Charming at velocity, and hollow exactly at the center.' },
  ];

  /* ---- drain model ----
     Ne's dominant curve carries smaller, more frequent notches than Ni's:
     novelty hits land often and each one pays a little back — cheap fuel,
     constantly replenished, never a deep recharge. */
  function domDrain(t) {
    const base = 12.2 * (t / 60);
    const phase = (t % 9) / 9;
    const notch = 1.5 * Math.max(0, 1 - Math.abs(phase - 0.08) * 7);
    return Math.max(0, base - notch);
  }
  function shadowDrain(t) {
    const base = 19.5 * Math.pow(t / 60, 1.24);
    let spikes = 0;
    for (const [st, mag] of [[11, 9], [33, 10], [58, 12], [88, 9]]) {
      if (t >= st) spikes += mag * clamp((t - st) / 1.8, 0, 1);
    }
    const wiggle = t < 2 ? 0 : 1.7 * Math.sin(t * 0.85) + 1.3 * Math.sin(t * 2.2 + 0.9);
    return clamp(base + spikes + wiggle, 0, 100);
  }

  const SERIES = [
    { key: 'dom', label: 'Dominant', color: COL.pos[0], f: domDrain },
    { key: 'aux', label: 'Auxiliary', color: COL.pos[1], f: t => 20.5 * Math.pow(t / 60, 1.06) },
    { key: 'tert', label: 'Tertiary', color: COL.pos[2], f: t => 29 * Math.pow(t / 60, 1.4) },
    { key: 'inf', label: 'Inferior', color: COL.pos[3], f: t => Math.min(100, 83 * Math.pow(t / 60, 1.9)) },
    { key: 'sh', label: 'Shadow', color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 83, 1 / 1.9);

  const COSTS = [
    { label: 'Dominant', v: 1.0, color: COL.pos[0], series: 0 },
    { label: 'Auxiliary', v: 1.5, color: COL.pos[1], series: 1 },
    { label: 'Tertiary', v: 2.5, color: COL.pos[2], series: 2 },
    { label: 'Inferior', v: 4.0, color: COL.pos[3], series: 3 },
    { label: 'Shadow', v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: 'Dominant', color: COL.pos[0], note: 'Refills partly during use — every branch that takes pays a little back.',
      f: t => t <= 30 ? 100 - SERIES[0].f(t) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t - 30) / 6.5)) },
    { label: 'Auxiliary', color: COL.pos[1], note: 'Clean recovery once the options have been handed to the judge.',
      f: t => t <= 30 ? 100 - SERIES[1].f(t) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t - 30) / 10)) },
    { label: 'Tertiary', color: COL.pos[2], note: 'Slower: the brainstorm has to actually be put down first.',
      f: t => t <= 30 ? 100 - SERIES[2].f(t) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t - 30) / 16)) },
    { label: 'Inferior', color: COL.pos[3], note: 'The hangover shelf: ~30 min where the whole system runs dim and the catastrophes keep replaying.',
      f: t => t <= 30 ? 100 - SERIES[3].f(t) : (t < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t - 60) / 20))) },
    { label: 'Shadow', color: COL.sh, note: 'Incomplete — some of the charge simply does not come back today.',
      f: t => t <= 30 ? 100 - SERIES[4].f(t) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t - 30) / 25)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the divergence engine lab ----
     Ni's lab asks what happens when perception converges. Ne is a breadth
     instrument, so this one exposes the engine itself: five ways a day can
     treat a divergence engine, each with a measured impact on the
     stress/pleasure telemetry and its own choreography in the chamber. */
  const LAB = {
    buttons: [
      { id: 'btnGraft', key: 'graft', label: 'Cross-Pollination', sub: 'collide two foreign domains → hybrid idea', color: COL.fn,
        impact: { stress: -0.35, pleasure: 0.90 }, followMs: 5800 },
      { id: 'btnPrune', key: 'prune', label: 'Forced Convergence', sub: '"pick one. now. in writing."', color: COL.crit,
        impact: { stress: 0.95, pleasure: -0.75 }, followMs: 6400 },
      { id: 'btnScatter', key: 'scatter', label: 'Another New Project', sub: 'abandon the tree → plant a thrilling new one', color: COL.warn,
        impact: { stress: 0.30, pleasure: 0.70 }, followMs: 6800 },
      { id: 'btnRiff', key: 'riff', label: 'Riff Session', sub: 'a live partner keeps saying "yes, and—"', color: '#4fc9e0',
        impact: { stress: -0.70, pleasure: 0.80 }, followMs: 6600 },
      /* the confine impulse is deliberately small: the engine grinds stress
         upward for as long as the template holds — see the narration */
      { id: 'btnConfine', key: 'confine', label: 'The Procedure', sub: 'fully specified · zero degrees of freedom', color: COL.s,
        impact: { stress: 0.22, pleasure: -0.55 }, followMs: 7200 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       and gloss live here with the rest of the content layer */
    states: {
      flow:        { label: 'Generative Flow',      color: '#17c964' },
      equilibrium: { label: 'Open Equilibrium',     color: COL.fn },
      scattered:   { label: 'Overextended',         color: COL.warn },
      pruned:      { label: 'Convergence Distress', color: COL.crit },
      starved:     { label: 'Novelty Starvation',   color: COL.sh },
    },
    narrations: {
      graft: 'Two domains that have never met — one amber, one cyan — growing separately, unremarkably. Then the bridge: a single branch arcs across the gap between them and takes. Watch the junction. What erupts there is a color neither parent has, and it grows faster than either of them.',
      graft2: 'This is the payment Ne works for — not novelty for its own sake: recombination. The hybrid could not have grown from either tree alone, and no amount of deepening either domain would have produced it. Everything genuinely new this engine makes is made this way, out of at least two old things.',
      prune: '"Pick one. Now. In writing." Watch what commitment costs a divergence engine: every living branch but one, cut in a wave from the tips inward. The survivor thickens into a stem — and note which one survived. The branch that happened to be brightest at the moment of the demand. Not the best one. The brightest one.',
      prune2: 'The closed-thread counter just moved — the only number on this page that force ever moves. Ne does not converge on its own; it gets converged, from outside. The stump is already regrowing, which is the resilience, and also the problem: next deadline, the wave comes again, and the engine will have just as many branches to lose.',
      scatter: 'A new idea — a genuinely thrilling one. The old tree grays into a husk the moment the new seed lands, and the pleasure spike is real; nothing on this page is faked, including that. But watch the open-thread counter instead of the bloom: everything the old tree was holding is still open. It just stopped being lit.',
      scatter2: 'The graveyard grows by one. The husks at the rim keep their threads — gray debt, still counted — and the fresh tree feels like progress while the total only climbs. Somewhere in that gray is a branch somebody else will grow to completion in three years, and it will be called their idea, correctly.',
      riff: 'A live partner, saying "yes, and—". Every response lands on a growing tip and forks it on contact. This is the engine at operating temperature: external stimulation converted to breadth at almost no cost, stress draining while output doubles. Ne does not brainstorm well alone in a quiet room. The quiet room was the constraint.',
      riff2: 'Count what the session produced: breadth, novelty, a chamber full of live branches — and zero decisions. That is not a failure of the session; it is what the session is for. The mistake is scheduling a riff and expecting a verdict. Verdicts are a judging function\'s output, and there is none in this chamber.',
      confine: 'The procedure: fully specified, zero degrees of freedom. Steps in order, boxes as labeled. Watch the tree espalier — growth clamped to the corridor, every branch that crosses the line clipped without ceremony — and watch the faint dashed flickers outside the box. Those are escape fantasies. The engine never stops generating; it just stops being allowed to keep what it makes.',
      confine2: 'Notice the stress meter: it ground upward the whole time instead of spiking, and it is still climbing. This is the expensive way to get compliance from an Ne-heavy person — the work gets done, at a cost invisible to whoever wrote the checklist. The bloom when the template lifts is real. It is also the reason the next confinement is harder.',
      hover: 'You have the branch point. Wherever you sweep, the tree grows toward your attention — possibilities are cheap, instant, and yours. Notice they fork before you have finished looking at them: this engine does not wait for permission.',
    },
    idle: 'The engine runs unattended: stimuli drift in through the gap, every arrival forks into branches, and branches fork again before the first ones have finished growing. Sweep your cursor across the chamber to branch by hand — or run a scenario below and watch the telemetry answer.',
  };

  const HERO = {
    tag: 'extraverted intuition',
    title: 'The Divergence of Ne',
    subtitle: 'One stimulus, a tree of possibility erupting from it — every branch forking again before the last has finished growing, and the brightest sparks escaping the chamber entirely.',
  };

  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Ne',
    lede: 'Click any position to see how the branching changes — from the effortless, omnidirectional bloom of a dominant to the demon\'s hostile what-ifs that fire only at what is loved. Watch the live-branch count: it tells the story before the caption does. Drag the maturity slider to watch the lower positions gain fidelity with age.',
  };
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Ne?',
    lede: 'Extraverted perception is fed by introverted judgment — and introverted perception by extraverted judgment. Ne is extraverted perception, so its real partners are the inner judges: Ti and Fi, the functions that decide which branches deserve to live. Click a feeder to watch what grows.',
  };
  const ZONE_D = {
    kicker: 'Zone D · the divergence engine',
    heading: 'The Divergence Engine',
    lede: 'Ne branches one stimulus into many possibilities, in public, at speed. This lab exposes the divergence engine\'s live state — stress, pleasure, breadth, open threads — and five ways a day can treat it. Trigger a scenario and watch the telemetry answer; sweep the chamber at any time to branch by hand.',
  };
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Ne costs energy. The lower it sits in the stack, the more expensive it becomes. Note the small notches in the dominant curve: a fresh branch that takes pays a little back — smaller and more frequent than Ni\'s rare deep insights. Note also which way the grip runs here — a collapsed Ne-dominant does not get more Ne, it floods into inferior Si.',
  };
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Ne shows up in daily life.',
    mirror: { label: 'Ne', counterpart: 'Ni', counterpartColor: '#8257f0' },
    vignettes: [
      { title: 'The Whiteboard', text: 'Ten minutes into the meeting the board holds eleven directions, four of them good, and the Ne-dominant who produced them is delighted with all eleven. Asked to pick one, their energy visibly halves — generating options and closing them are different operations, and only one of them is this function\'s job.' },
      { title: 'The Loop', text: 'Under stress, ENFP Ne pairs with tertiary Te: both extraverted, both outward, with Fi\'s quiet question — does this actually matter to me? — cut out between them. The idea becomes a project with a name and a logo inside an hour, ships half-grown, and joins the shelf by week three, because the function that would have vetoed it was never consulted.' },
      { title: 'The Grip', text: 'An ENTP past the end of their reserves stops generating and floods into inferior Si — suddenly cataloguing old mistakes in forensic detail, auditing every bodily signal, eating the same comfort food in front of a show they have seen nine times. Not a personality change: a low-capacity chamber taking a dominant-sized flood.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
