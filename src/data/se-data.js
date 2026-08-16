/* ============================================================
   CURRENTS · Se page data
   All content, parameters, models, and configuration specific
   to the Extraverted Sensing page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadSeData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  /* Type mappings follow the Beebe shadow rule: slots 5–8 are slots 1–4 with
     the attitude flipped, so Se's shadow register runs through the four
     Si-heavy types — the mirror of the Si page, slot for slot. */
  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'ESTP · ESFP', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.88, .86, .97, .80, .58],
      text: 'The world arrives at full resolution and zero delay, and it is simply obvious — what moved, what changed, where the opening is. Attention goes wherever the action is without being sent, the body answers before a plan exists, and none of it costs anything. The present is not a stream to keep up with; it is the place they already live.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'ISTP · ISFP', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.74, .80, .84, .74, .58],
      text: 'Contact in service of an inner judge. The scene is read cleanly — then handed inward, to a framework or a value, before anything is done about it. Less appetite than a dominant, more selection: the eye opens fully for what the craft or the feeling currently cares about, and idles politely through the rest.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'ENTJ · ENFJ', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.48, .46, .58, .48, .38],
      text: 'Presence in bursts, usually downstream of a plan. The room gets genuinely seen — at the dinner, on the court, on the stage — and then the long-range machinery resumes and the senses drop back to executive summary. It improves markedly with age, mostly as permission: it turns out the world is allowed to be enjoyed directly.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'INTJ · INFJ', shadow: false, series: 3,
      /* the inferior's flood-open under stress is the grip — the eye carries
         a trace of `contrary` here without the shadow register's hostility */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      dial: [.24, .26, .34, .24, .30],
      text: 'The present as static between insights. Physical detail arrives late, partial, and slightly untrustworthy — where the keys are, what was just said, the state of the body — until stress cuts the long view entirely and the senses flood open all at once: the grip, with its bingeing, recklessness, and sudden appetite for intensity that does not sound like them.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'ISTJ · ISFJ', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.34, .40, .44, .30, .22],
      text: 'Contact as contradiction. When the record says one thing and the room plainly shows another, Se wakes up combative — a blunt, unusually vivid *look at it, it is right there* — held exactly long enough to defend the archive, then dropped.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'ESTJ · ESFJ', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.28, .34, .40, .26, .16],
      text: 'An inner sergeant with perfect timing and no warmth. It surfaces to name what was physically missed — you did not see it, you were too slow, you looked ridiculous — precise about the moment, useless about what to do with it.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'INTP · INFP', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.20, .24, .36, .16, .10],
      text: 'The present as a prank. Objects genuinely vanish and reappear, doorframes attack, the obvious thing on the table goes unseen for ten minutes — and occasionally the reverse: total confident certainty about a physical detail that was never there. Neither state announces which one is running.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'ENTP · ENFP', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.14, .18, .30, .10, .06],
      text: 'Rarely touched, and crude when it erupts: sensation used as a weapon against the self — the punishing workout, the blackout night, the hand put through the wall. Not perception at all by then; just voltage, applied directly.' },
  ];

  /* Extraverted perception is fed by introverted judgment; Se's canonical
     partners are the inner judges Ti and Fi — the functions that tell the
     eye what matters, so that salience is more than raw vividness.

     cfg keys, all of which the engine actually reads:
       rate    event frequency multiplier
       weight  pleasure yield per lock
       speed   dart velocity
       spread  angular coverage of feeder-aimed arrivals
       focus   lock precision (≥.9 draws Ti's measurement tags)
       dwell   how long a lock is savoured before release
       sealed  loop coupling: every hit immediately buys the next
       starve  perception feeding perception: locks keep aborting
       aim     arrival bias angle (the feeder sits at the left rim) */
  const FEEDERS = [
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: true, pair: 'the ISTP · ESTP coupling',
      cfg: { rate: .55, weight: 1.0, speed: .8, spread: .3, focus: 1.0, dwell: .5, aim: 3.14 },
      text: 'Contact with criteria. Ti hands the eye a spec — tolerances, mechanisms, the one measurement that settles it — and salience reorganizes around what matters: fewer targets, locked harder, read to the millimetre. This is the troubleshooter\'s gaze: the machine in front of you, interrogated part by part, and the diagnosis checked against the thing itself rather than the manual.' },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: true, pair: 'the ISFP · ESFP coupling',
      cfg: { rate: .60, weight: .9, speed: .7, spread: .5, focus: .8, dwell: 1.0, aim: 3.0 },
      text: 'Contact with taste. Fi hands the eye a felt criterion — what is beautiful, what is honest, what is worth savouring — and the world sorts itself by significance: the right targets glow, and a lock is held long past its tactical use, because the point was never tactics. This is the performer\'s and the aesthete\'s gaze: full presence, aimed at what the heart has already chosen.' },
    { key: 'ni', name: 'Ni', color: COL.n, canonical: false, unstable: true, pair: 'perception feeding perception',
      warn: 'Unstable coupling: perception feeding perception, with nothing judging either.',
      cfg: { rate: .90, weight: .3, speed: .9, spread: 1.0, focus: .3, dwell: .2, starve: true },
      text: 'Two gatherers, no judge. Ni keeps interrupting looking with meaning — every lock aborted midway because the target has already become a symbol of something else. The eye retargets constantly and finishes nothing; the world is entirely present and never actually seen. These two share an axis for a reason: in a real stack one of them perceives while a judge decides, and the other waits below.' },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: false, pair: 'the ESTP Se–Fe loop',
      warn: 'Loop coupling: dominant and tertiary, both extraverted — the auxiliary\'s inner check is cut out.',
      cfg: { rate: .85, weight: .6, speed: .9, spread: .7, focus: .6, dwell: .15, sealed: true, aim: 3.05 },
      text: 'The ESTP loop, with Ti cut out. Fe supplies targets, but only social ones — the laugh, the reaction, the room\'s next dare — and every hit is spent immediately on setting up the next. Dwell time collapses to zero: nothing is examined, nothing is savoured, the show simply escalates. What is missing is the auxiliary\'s quiet question — *is this actually a good idea?* — and the loop\'s answer is louder applause.' },
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: false, pair: 'the ESFP Se–Te loop',
      warn: 'Loop coupling: dominant and tertiary, both extraverted — the auxiliary\'s inner check is cut out.',
      cfg: { rate: .90, weight: .7, speed: .95, spread: .6, focus: .7, dwell: .1, sealed: true, aim: 3.2 },
      text: 'The ESFP loop, with Fi cut out. Te turns the field into a task list — visible, finishable, immediately replaced — and the eye rides from errand to errand at full speed. Motion becomes its own proof of progress. What no longer gets asked is whether any of it matters to the person doing it; the felt check is exactly the function the loop bypasses.' },
  ];

  /* ---- drain model ----
     Se's dominant curve carries frequent shallow notches: contact pays
     back continuously in small change, not in Ni's rare deep insights —
     flow at a climbing wall, not flow at a whiteboard. */
  function domDrain(t) {
    const base = 11.5 * (t / 60);
    const phase = (t % 8) / 8;
    const notch = 1.5 * Math.max(0, 1 - Math.abs(phase - 0.10) * 7);
    return Math.max(0, base - notch);
  }
  function shadowDrain(t) {
    const base = 19 * Math.pow(t / 60, 1.22);
    let spikes = 0;
    for (const [st, mag] of [[11, 10], [33, 9], [58, 12], [88, 9]]) {
      if (t >= st) spikes += mag * clamp((t - st) / 1.6, 0, 1);
    }
    const wiggle = t < 2 ? 0 : 1.7 * Math.sin(t * 0.9) + 1.3 * Math.sin(t * 2.3 + 0.5);
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
    { label: 'Dominant', color: COL.pos[0], note: 'Refills during use — full contact is cheaper than resting badly.',
      f: t => t <= 30 ? 100 - SERIES[0].f(t) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t - 30) / 6)) },
    { label: 'Auxiliary', color: COL.pos[1], note: 'Quick, once the tools are down and the scene is closed.',
      f: t => t <= 30 ? 100 - SERIES[1].f(t) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t - 30) / 10)) },
    { label: 'Tertiary', color: COL.pos[2], note: 'Needs the plan put away first; presence bought on a schedule recovers on one.',
      f: t => t <= 30 ? 100 - SERIES[2].f(t) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t - 30) / 17)) },
    { label: 'Inferior', color: COL.pos[3], note: 'The hangover shelf: ~30 min where the overstimulation lingers and every channel runs dim.',
      f: t => t <= 30 ? 100 - SERIES[3].f(t) : (t < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t - 60) / 21))) },
    { label: 'Shadow', color: COL.sh, note: 'Incomplete — voltage spent here does not fully return today.',
      f: t => t <= 30 ? 100 - SERIES[4].f(t) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t - 30) / 26)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the Contact Lab ----
     Judging pages verify claims; a perceiving page tests the QUALITY OF
     CONTACT between psyche and world (DESIGN §2.5). The instrument set:
     an intensity slider the user owns, and three spawnable events — a
     change to catch, an opening to use in time, and a field gone empty. */
  const LAB = {
    buttons: [
      { id: 'btnFlicker', key: 'flicker', label: 'A Flicker in the Crowd', sub: 'one element shifts for 300 ms', color: COL.fn,
        impact: { stress: 0.0, pleasure: 0.16 }, followMs: 4200 },
      { id: 'btnWindow', key: 'window', label: 'A Closing Window', sub: 'an opening appears — and starts shutting', color: '#4fc9e0',
        impact: { stress: 0.10, pleasure: 0.06 }, followMs: 4200 },
      { id: 'btnBlackout', key: 'blackout', label: 'Lights Out', sub: 'the field empties — nothing to perceive', color: COL.crit,
        impact: { stress: 0.28, pleasure: -0.30 }, followMs: 6600 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       and gloss live here with the rest of the content layer */
    states: {
      flow:        { label: 'Full Contact',      color: '#17c964' },
      equilibrium: { label: 'Open Field',        color: COL.fn },
      hunger:      { label: 'Stimulus Hunger',   color: COL.warn },
      late:        { label: 'Out of Position',   color: COL.warn },
      blackout:    { label: 'Sensory Blackout',  color: COL.crit },
    },
    /* the sibling economy, cross-listened: how the same event would land
       on Si's meters. Rendered as ghost needles beside the live ones. */
    sibling: {
      flicker:  { stress: 0.10, pleasure: 0.0 },
      window:   { stress: 0.16, pleasure: 0.0 },
      blackout: { stress: -0.06, pleasure: 0.12 },
    },
    narrations: {
      slider: 'Drag the field from empty room to street carnival and watch the meters trade places. More world produces more clarity — the render sharpens as the stream thickens. Se does not get overwhelmed by intensity; it gets focused. The emergency, for this function, is the other end of the slider.',
      flicker: 'One element in the crowd just shifted — three hundred milliseconds of motion in a field of drift. The lock lands before the thought does; the reticle is already there, and a name for what moved arrives second. Note the twin flicker outside the lens: same event, same size, gone unseen. That is the same world without Se pointed at it.',
      flicker2: 'Caught, tagged, released. Nothing was stored — the flicker is already gone from the chamber, and the eye is back to hunting. What Se buys is not a memory of the change; it is the handful of milliseconds between the world moving and the body knowing.',
      flickerMiss: 'Missed. The flicker ran its three hundred milliseconds and closed before the lock arrived — from this deep in the stack, the signal reaches the eye after the moment has already left. The event was real, the perception was honest, and it was simply too late to matter. Drag Se back up the rail in Zone B and try again.',
      window: 'An opening — and it is already closing. Se\'s answer leaves immediately: perception here is not a report, it is a launch condition. Watch the response streak against the shrinking gap.',
      windowHit: 'Threaded, with room to spare. This is the Se transaction in one picture: the present offered a gap with a deadline, and seeing it and taking it were one motion. No deliberation appears anywhere in the loop — which is not recklessness; at this position, it is precision.',
      windowMiss: 'Shut. The response fired exactly as designed — and arrived at a wall, because from this slot the signal spends hundreds of milliseconds in transit before the launch even begins. Select a higher slot in Zone B and spawn another window: position is the difference between an opening and a story about one.',
      blackout: 'The field is gone. Watch what the eye does with nothing: dilates, hunts, and starts paying for silence — stress climbing on an empty room the way other functions pay for chaos. The last thing it saw is already dying as an afterimage. Note the small glint leaving it, labelled for Si: the stratum its sibling would have kept. Se itself keeps nothing.',
      blackout2: 'Contact restored, and the meters snap back — no residue, no backlog, no grudge. The blackout cost exactly what it lasted and nothing more. Functions that keep records recover slowly; the one that keeps nothing is also the one that resets instantly.',
      hover: 'The cursor is now the most vivid object in the field, and the eye treats it accordingly: zero-lag tracking, tracers leaping at every quick move. You are experiencing the dominant preset — drop this glyph to Inferior in Zone B and the same cursor becomes something the gaze trails behind, catches, and loses.',
    },
    idle: 'The field runs live: drifters, movers, the occasional flare — and the eye hunting through it, locking whatever moves. Slide the field intensity and watch stress and pleasure trade places; spawn an event and watch the reticle answer; or hover the chamber to become the target yourself.',
  };

  const HERO = {
    tag: 'extraverted sensing',
    title: 'The Naked Eye',
    subtitle: 'A wide-open iris in direct contact with the live field — the world through it sharper, faster, and more saturated than the world beside it. Nothing between. Nothing kept.',
  };

  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Se',
    lede: 'Click any position to see how contact changes hands — from the dominant\'s zero-lag lock to the trickster\'s confident sightings of things that were never there. Watch the catch rate decay down the stack. Drag the maturity slider to watch the lower positions steady with age.',
  };
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Se?',
    lede: 'Extraverted perception is fed by introverted judgment — Se\'s real partners are Ti and Fi, the inner judges that tell the eye what matters. Click a feeder and watch salience reorganize.',
  };
  const ZONE_D = {
    kicker: 'Zone D · the contact lab',
    heading: 'The Contact Lab',
    lede: 'Se is a contact instrument: its quality is measured in milliseconds-to-lock and openings used, not in conclusions. This lab runs the eye against a live field you control. Slide the intensity from empty room to street carnival, spawn events, and note which end of the slider reads as the emergency.',
  };
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Se costs energy. The lower it sits in the stack, the more expensive it becomes. Note the frequent small notches in the dominant curve: contact pays back in the moment, continuously. Note also which way the grip runs here — a collapsed Se-dominant does not get more Se, it floods into inferior Ni.',
  };
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Se shows up in daily life.',
    mirror: { label: 'Se', counterpart: 'Si', counterpartColor: 'var(--pos-3)' },
    vignettes: [
      { title: 'The Court', text: 'Mid-game, an ESTP sees the defender\'s weight shift a half-second before the lane opens, and is already moving. Asked afterwards how they knew, they say they saw it — which is the whole answer. There was no inference to report. The perception and the move were one event, and the interview about it is the first part that costs effort.' },
      { title: 'The Loop', text: 'An ESTP under pressure pairs dominant Se with tertiary Fe: the room\'s reaction becomes the only instrument, and every stunt buys the next one. Ti\'s quiet question — is this actually a good idea? — is the function the loop exists to avoid. From inside it feels like being on; from outside it looks like escalation.' },
      { title: 'The Grip', text: 'An ESFP past the end of their reserves stops perceiving and starts foreboding — sudden grim certainties about what it all means and where it is heading, delivered with none of dominant intuition\'s craft. Not a personality change: a low-capacity chamber taking a dominant-sized flood.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
