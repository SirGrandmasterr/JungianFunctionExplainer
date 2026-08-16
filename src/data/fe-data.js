/* ============================================================
   CURRENTS · Fe page data
   All content, parameters, models, and configuration specific
   to the Extraverted Feeling page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadFeData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
    ghost: CSSVAR('--fe-ghost'), nul: CSSVAR('--fe-null'),
    hueLo: parseFloat(CSSVAR('--fe-hue-lo')) || 322,
    hueHi: parseFloat(CSSVAR('--fe-hue-hi')) || 368,
  };

  /* Type mappings follow the Beebe shadow rule: slots 5–8 are slots 1–4 with
     the attitude flipped, so Fe's shadow register runs through the four
     Fi-heavy types — the mirror of the Fi page, slot for slot. */
  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'ENFJ · ESFJ', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.90, .92, .95, .90, .82],
      text: 'The state of the room is the primary datum, read continuously and without effort — who has gone quiet, who is being talked over, where the tension is sitting. Harmony is not a preference here but a load-bearing structure: something the person is holding up, usually without being asked and usually without anyone noticing until they stop.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'INFJ · ISFJ', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.80, .84, .80, .82, .76],
      text: 'Harmony in the service of an inner perception. The room still gets read accurately, but the conducting is selective and scheduled — care delivered deliberately, to the people the dominant function has decided matter, rather than sprayed across every gathering. Warm in a narrower band, and considerably harder to exhaust.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'ENTP · ESTP', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.48, .52, .62, .54, .42],
      text: 'Charm as an instrument. Real warmth, genuinely felt and deliberately deployed — the room worked rather than held, with an accuracy that is good enough for the next twenty minutes and rarely checked afterwards. It drops the moment the game is won, which is what tells you it was tertiary rather than dominant.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'ISTP · INTP', shadow: false, series: 3,
      /* the inferior's flood-open under depletion is the grip — a trace of
         `contrary` here without the shadow register's hostility */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      dial: [.24, .28, .30, .28, .34],
      text: 'Belonging arrives late and all-or-nothing. Long stretches of treating social convention as arbitrary noise, punctuated — under real depletion — by an abrupt and badly-calibrated need to know they are wanted here. The read is slow and low-resolution, so it lands either far too hard or not at all, and it surprises them more than anyone.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'INFP · ISFP', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.34, .38, .44, .30, .24],
      text: 'Contrary harmonizing. When an inner value is pressed, this position performs the group tone with unnerving precision — matching the room exactly — in order to refuse it more visibly. Fe used as a weapon against Fe: the harmony is real enough to be recognized and pointedly withheld.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'ENFP · ESFP', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.28, .32, .38, .26, .18],
      text: 'Weaponized decorum. It surfaces as a verdict about how someone else is affecting the room — you are making everyone uncomfortable, nobody wants to hear this — delivered with total confidence and aimed at whoever is nearest. The reading behind it is rarely checked, and the person delivering it is not, at that moment, harmonizing anything.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'ISTJ · INTJ', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.22, .24, .30, .16, .12],
      text: 'Social reading that returns confident garbage. The room is misjudged — warmth read as mockery, a joke read as an attack, an ally read as a threat — and the misjudgment is acted on immediately and without review. Watch the trust gap on the glyph: what this position believes about the room and what is true have visibly come apart.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'ESTJ · ENTJ', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.16, .20, .24, .10, .08],
      text: 'Concord as a weapon: manufacturing a group tone in order to isolate someone inside it. The conducting term has inverted — the room is being driven apart on purpose — while the readout still reports that this is all in everyone\'s interest. Rarely reached, and unmistakable when it is.' },
  ];

  /* Extraverted judging is fed by introverted perception; Fe's canonical
     partners are Ni and Si — the same conducting aimed at where the room is
     going versus at how the room has always been.

     cfg keys, all of which the engine actually reads:
       nodes     how many carriers this coupling puts in the ring
       horizon   Ni: conduct toward the room's predicted phase, not its current one
       history   Si: conduct toward the room's own precedent
       surface   Se: conduct toward whoever is loudest this instant
       phantom   Ne: seed the ring with people who are not in it
       stale     Te: carrier phases stop updating; conduct on assumption
       weight    pleasure yield per locked carrier */
  const FEEDERS = [
    { key: 'ni', name: 'Ni', color: '#7148d8', canonical: true, pair: 'the INFJ · ENFJ coupling',
      cfg: { nodes: 5, horizon: 0.9, weight: 1.0 },
      text: 'Conducting toward where the room is going. Ni hands Fe a trajectory rather than a snapshot, and the prediction ghosts on each carrier are what Fe is actually aiming at — not the phase someone is in, but the one they are heading for. Fewer people, read much further ahead. Uncanny when it lands, and quietly presumptuous when it does not: this is the coupling that answers a question nobody has asked yet, and occasionally answers the wrong one.' },
    { key: 'si', name: 'Si', color: '#c07f10', canonical: true, pair: 'the ISFJ · ESFJ coupling',
      cfg: { nodes: 9, history: 0.85, weight: .9 },
      text: 'Conducting toward the room as it has always been. Si hands Fe a stored record of each person — the ribbon trailing every carrier is who they have been across every previous gathering — and the target becomes precedent rather than the live mean. This is hosting, tradition, and the known-good evening, held up by someone who remembers how it goes. Its failure mode is on screen too: a room can be conducted toward a version of itself it has outgrown.' },
    { key: 'se', name: 'Se', color: '#f0a020', canonical: false, pair: 'the ENFJ Fe–Se loop',
      warn: 'Loop coupling: dominant and tertiary, both extraverted — the orbit runs entirely outside the self.',
      cfg: { nodes: 7, surface: 1, weight: .5 },
      text: 'The ENFJ loop, with Ni cut out. Conducting is now driven by whatever is loudest this instant — the visible reaction, the immediate atmosphere, the person currently taking up the most air. Watch the gate swing: concord looks high moment to moment and never accumulates, because the target keeps moving. Charisma with no direction, and both functions extraverted, so there is nothing inside the loop to check it.' },
    { key: 'ne', name: 'Ne', color: '#8b5cf6', canonical: false, pair: 'the ESFJ Fe–Ne loop',
      warn: 'Loop coupling: dominant and tertiary, both extraverted — the orbit runs entirely outside the self.',
      cfg: { nodes: 7, phantom: .8, weight: .4 },
      text: 'The ESFJ loop, with Si cut out. Ne supplies people who are not in the room — what they might be thinking, what that message might have meant, how this could land — and they arrive as carriers with real coupling weight. Watch the effort meter: Fe is paying full price to harmonize with an audience it generated. The function that would break it is Si\'s actual record of how these people actually behave, which is exactly the one the loop stops consulting.' },
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: false, unstable: true, pair: 'judging feeding judging',
      warn: 'Unstable coupling: judging feeding judging, with nothing perceiving for either.',
      cfg: { nodes: 7, stale: .9, weight: .3 },
      text: 'Two sorters, no gatherer. Te hands Fe verdicts about outcomes — what worked, what shipped, what the numbers said — instead of perceptions of people, so the carrier phases stop updating and Fe conducts on last-known state. The room moves; the model does not. Nobody tells it, because telling it is a perceiving function\'s job and there isn\'t one in this loop. This is why real stacks alternate perceiving and judging.' },
  ];

  /* ---- drain model ----
     Fe's dominant curve carries the fastest and shallowest micro-recovery in
     the atlas: a room that locks pays a little back, and rooms lock often.
     Compare Si's quarter-hour ritual notch — Fe recharges on a social
     rhythm, in company, several times an hour. */
  function domDrain(t) {
    const base = 12.4 * (t / 60);
    const notch = 2.3 * Math.pow(Math.max(0, Math.sin(t / 6.5)), 3);
    return Math.max(0, base - notch);
  }
  function shadowDrain(t) {
    const base = 20.5 * Math.pow(t / 60, 1.24);
    let spikes = 0;
    for (const [st, mag] of [[15, 9], [40, 12], [67, 10], [96, 9]]) {
      if (t >= st) spikes += mag * clamp((t - st) / 1.8, 0, 1);
    }
    const wiggle = t < 2 ? 0 : 1.7 * Math.sin(t * 0.8) + 1.2 * Math.sin(t * 2.2 + 0.7);
    return clamp(base + spikes + wiggle, 0, 100);
  }

  const SERIES = [
    { key: 'dom', label: 'Dominant', color: COL.pos[0], f: domDrain },
    { key: 'aux', label: 'Auxiliary', color: COL.pos[1], f: t => 21 * Math.pow(t / 60, 1.07) },
    { key: 'tert', label: 'Tertiary', color: COL.pos[2], f: t => 30 * Math.pow(t / 60, 1.42) },
    { key: 'inf', label: 'Inferior', color: COL.pos[3], f: t => Math.min(100, 86 * Math.pow(t / 60, 1.9)) },
    { key: 'sh', label: 'Shadow', color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 86, 1 / 1.9);

  const COSTS = [
    { label: 'Dominant', v: 1.0, color: COL.pos[0], series: 0 },
    { label: 'Auxiliary', v: 1.5, color: COL.pos[1], series: 1 },
    { label: 'Tertiary', v: 2.5, color: COL.pos[2], series: 2 },
    { label: 'Inferior', v: 4.0, color: COL.pos[3], series: 3 },
    { label: 'Shadow', v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: 'Dominant', color: COL.pos[0], note: 'Refills in company — the one function whose recovery is not solitary.',
      f: t => t <= 30 ? 100 - SERIES[0].f(t) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t - 30) / 6)) },
    { label: 'Auxiliary', color: COL.pos[1], note: 'Quick, once the people it was held up for are settled.',
      f: t => t <= 30 ? 100 - SERIES[1].f(t) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t - 30) / 10)) },
    { label: 'Tertiary', color: COL.pos[2], note: 'Slower: charm is affordable in bursts, not across an evening.',
      f: t => t <= 30 ? 100 - SERIES[2].f(t) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t - 30) / 16)) },
    { label: 'Inferior', color: COL.pos[3], note: 'The social hangover: ~30 min of global dim, and it needs no translation.',
      f: t => t <= 30 ? 100 - SERIES[3].f(t) : (t < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t - 60) / 20))) },
    { label: 'Shadow', color: COL.sh, note: 'Incomplete — what gets said from here is still costing something tomorrow.',
      f: t => t <= 30 ? 100 - SERIES[4].f(t) : lvl(4) + (91 - lvl(4)) * (1 - Math.exp(-(t - 30) / 25)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the Resonance Lab ----
     Judging pages verify: Ti against its lattice, Te against external
     results, Fi against the core tone. Fe verifies against the coherence of
     the field around it — which is the only place its judgment happens, and
     the reason this lab spawns events into the room rather than into the
     chamber. Three harmony triggers, three dissonance triggers. */
  const LAB = {
    buttons: [
      { id: 'btnSync', key: 'sync', label: 'Unspoken Sync', sub: 'one person shifts; Fe matches, for free', color: COL.fn,
        row: 'harmony', impact: { stress: -0.08, pleasure: 0.30 }, followMs: 0 },
      { id: 'btnCelebrate', key: 'celebrate', label: 'The Room Lifts', sub: 'collective celebration, everyone in phase', color: '#ffa8bd',
        row: 'harmony', impact: { stress: -0.14, pleasure: 0.46 }, followMs: 6200 },
      { id: 'btnReconcile', key: 'reconcile', label: 'Reconciliation', sub: 'bridge a split field — the expensive one', color: '#17c964',
        row: 'harmony', impact: { stress: 0.20, pleasure: 0.04 }, followMs: 5000, gated: true },
      { id: 'btnCovert', key: 'covert', label: 'The Cold Current', sub: 'covert hostility behind a clean field', color: COL.ghost,
        row: 'dissonance', impact: { stress: 0.38, pleasure: -0.12 }, followMs: 0 },
      { id: 'btnDeadlock', key: 'deadlock', label: 'The Deadlock', sub: 'two clusters, locked antiphase', color: COL.warn,
        row: 'dissonance', impact: { stress: 0.42, pleasure: -0.30 }, followMs: 0 },
      { id: 'btnIsolate', key: 'isolate', label: 'Cut Off', sub: 'the ring goes dark; Fe finds out its colour', color: COL.crit,
        row: 'dissonance', impact: { stress: 0.30, pleasure: -0.34 }, followMs: 6500 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       and gloss live here with the rest of the content layer */
    states: {
      concord:    { label: 'Concord',        color: '#17c964' },
      attuned:    { label: 'Attuned',        color: COL.fn },
      ambient:    { label: 'Open Field',     color: COL.fn },
      conducting: { label: 'Conducting',     color: COL.warn },
      dissonant:  { label: 'Dissonance',     color: COL.warn },
      split:      { label: 'Split Field',    color: COL.crit },
      unreadable: { label: 'Unread Current', color: COL.ghost },
      severed:    { label: 'Severed Field',  color: COL.crit },
    },
    /* the sibling economy, cross-listened: how the same event lands on Fi's
       meters. Rendered as ghost needles beside the live ones. */
    sibling: {
      sync:      { stress: 0, pleasure: 0.03 },
      celebrate: { stress: 0.06, pleasure: 0.05 },
      reconcile: { stress: -0.10, pleasure: 0.14 },
      covert:    { stress: 0.22, pleasure: -0.26 },
      deadlock:  { stress: 0.08, pleasure: 0 },
      isolate:   { stress: -0.04, pleasure: 0.08 },
    },
    narrations: {
      sync: 'Nothing was said and nothing was spent. One person\'s weather changed by a few degrees and the field moved with it before anyone could have named it — that single filament is the only moment in this lab where Fe connects to one carrier alone. Note the effort meter: flat. The cheapest thing Fe does is the thing nobody else in the room can see it doing, which is also why it so rarely gets credit for it.',
      celebrate: 'Everyone is on the same frequency and the field is doing almost no work. This is the state Fe is built to produce, and it is not a metaphor: twelve independent oscillators have locked, and the interference inside the chamber is now entirely constructive — every crest landing on every other crest.',
      celebrate2: 'Now watch the differentiation readout fall. Perfect concord is perfect sameness: the individual hues have averaged into one, and the carriers are no longer distinguishable from the field they are making. Fe\'s characteristic failure is visible here at the exact moment of its greatest success — a room this synchronized has stopped being able to tell its members apart, and the first person to sound a different note will be experienced as an attack.',
      reconcile: 'Effort at maximum, stress climbing, and for the first stretch nothing improves at all. This is what the work looks like from inside: Fe spending everything it has against a field that has not yet moved. The inter-cluster coupling is ramping from repulsive to positive in real time — you are watching a room be argued out of a position.',
      reconcile2: 'The null closes and one wavefront crosses both halves at once. Now look at the cost readout: better than four units, against under half a unit for the sync you spawned earlier. Fe\'s best moment is also its most expensive by an order of magnitude, which is the entire reason Fe-dominants burn out on rooms that will not resolve — not because they care too much, but because this is the actual price of the thing they are good at.',
      covert: 'Concord is reading high and the stress meter is climbing anyway. Nothing in the field is visibly wrong — the fringes are clean, the carriers report agreement — and the trust gap is the only instrument registering anything at all. That faint counter-rotating pattern underneath is the true field beating against the displayed one. This is the most characteristic Fe experience there is, and the reason it is so hard to defend: a real signal, detected before any evidence for it exists. Hover the carriers. Whether you find the masked pair depends on where Fe is sitting in the stack.',
      deadlock: 'Two clusters, locked in antiphase, and the conducting term is running near maximum while doing nothing whatsoever. Watch the cost readout keep climbing anyway — Fe cannot decline to work on a split room; the effort is not voluntary. And watch the nucleus: it takes the mean of the field, and the mean of two opposites is grey. This is what people mean when they describe being torn in half by a conflict they are not even a party to. Nothing here resolves on its own.',
      isolate: 'The carriers are going dark and the nucleus is going with them. This is the structural fact the whole page has been building toward: Fe\'s colour is a computed average of the field around it, and with no field there is no average. Fi alone still burns rose — its core tone does not need an audience. Fe alone has nothing to be.',
      isolate2: 'And now the effort meter is climbing again with nobody in the room. Those faint dashed carriers are not people; they are simulated ones, invented so there is a field to harmonize with. Full cost, no coupling, and the readout cannot tell the difference. This is rumination drawn exactly as it works: an orchestration engine that cannot idle, running against an audience it made up.',
      gate: 'Reconciliation needs something to reconcile. Split the field first — spawn a deadlock, or let a cold current curdle into one — and this control unlocks.',
      hover: 'You are sounding the ring. Each carrier reports what Fe can tell about them: their amplitude, whether they are in phase, and — if Fe\'s read is sharp enough at this stack position — whether what they are displaying is what they are actually doing.',
    },
    idle: 'The ring runs unattended: seven independent oscillators, coupled to each other and nudged by whatever Fe can spare, drifting toward a concord that never quite finishes. Spawn an event and watch the field answer. The two rows are not decoration — everything above the divider makes the room more coherent, and everything below it takes something away.',
  };

  const HERO = {
    tag: 'extraverted feeling',
    title: 'The Resonance Field',
    subtitle: 'A ring of other people, standing outside the chamber, coupled by a lattice Fe draws between them. The nucleus has no colour of its own — it is the average of whoever is currently in the room.',
  };

  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Fe',
    lede: 'Click any position to see how the room changes hands — from the dominant\'s effortless read to the demon\'s manufactured concord. Watch the two needles on the glyph: what Fe believes about the room, and what is actually true. At Dominant they sit on top of each other. By Trickster they have visibly come apart, and the misreading is being acted on. Drag the maturity slider to watch the ring grow and steady with age.',
  };
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Fe?',
    lede: 'Extraverted judging is fed by introverted perception — Fe\'s real partners are Ni and Si, the inner perceivers that tell it what the room is made of. Click a feeder and watch what Fe starts conducting toward.',
  };
  const ZONE_D = {
    kicker: 'Zone D · the resonance lab',
    heading: 'The Resonance Lab',
    lede: 'Ti verifies against its lattice and Fi against a core tone. Fe verifies against the field between people, so this lab spawns its events into the room rather than into the chamber. Three make it more coherent, three take something away — and one of them costs more than the other five combined.',
  };
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Fe costs energy. Note the notches in the dominant curve — the fastest micro-recovery in the atlas, because a room that locks pays a little back and rooms lock often. Note also which way the grip runs: a collapsed Fe-dominant does not get more Fe, it floods into inferior Ti — cold, absolute, and cutting people off with a rule.',
  };
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Fe shows up in daily life.',
    mirror: { label: 'Fe', counterpart: 'Fi', counterpartColor: '#f56a8c' },
    vignettes: [
      { title: 'The Read', text: 'An ENFJ walks into a room and reorganizes it in eleven seconds — seats a person next to the one who will draw them out, aims a question at whoever has been quiet, breaks a tension nobody else has registered yet. Asked afterwards what they did, they can rarely reconstruct it, because the read and the response were one operation and neither of them passed through language on the way.' },
      { title: 'The Loop', text: 'An ESFJ under stress pairs dominant Fe with tertiary Ne: conducting toward people who are not in the room. What they might be thinking, what that message might have meant, how it is going to land. Full effort, no coupling. The function that would break it — Si\'s actual record of how these people actually behave — is exactly the one the loop stops consulting.' },
      { title: 'The Grip', text: 'An INTP past the end of their reserves stops analyzing and floods into inferior Fe: an abrupt, raw, badly-calibrated need to know they are wanted here, from someone who spent the whole week explaining that social convention is arbitrary. Not a personality change — a low-capacity chamber taking a dominant-sized flood.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
