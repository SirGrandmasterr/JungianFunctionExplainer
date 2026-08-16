/* ============================================================
   CURRENTS · Si page data
   All content, parameters, models, and configuration specific
   to the Introverted Sensing page.
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';

export function loadSiData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  /* Type mappings follow the Beebe shadow rule: slots 5–8 are slots 1–4 with
     the attitude flipped, so Si's shadow register runs through the four
     Se-heavy types — the mirror of the Se page, slot for slot. */
  const SLOTS = [
    { key: 'dominant', name: 'Dominant', sub: '1st · hero', types: 'ISTJ · ISFJ', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      dial: [.95, .90, .45, .82, .70],
      text: 'The present is read against the deepest archive in the psyche, and the comparison is instant: same as always, or off. Deviation registers before reasoning does — the hum a third lower, the handshake a shade brief — and stability is not a preference but bedrock. What the record confirms costs nothing; what contradicts it is felt bodily, like a step where the floor is not where the foot expected it.' },
    { key: 'auxiliary', name: 'Auxiliary', sub: '2nd · parent', types: 'ESTJ · ESFJ', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      dial: [.82, .80, .50, .74, .62],
      text: 'The archive in service of an agenda. Precedent, procedure, and the known-good way are supplied on demand to a dominant judge that acts on them — Si as institutional memory, retrieved quickly and defended only as hard as the plan requires. Less identity than a dominant, more utility: the record is a tool here, not a home.' },
    { key: 'tertiary', name: 'Tertiary', sub: '3rd · eternal child', types: 'INTP · INFP', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      dial: [.52, .50, .38, .48, .44],
      text: 'A private museum, visited irregularly. Comfort rituals, remembered rooms, the same meal from the same place — ballast for a life otherwise run on possibility. Under stress it turns curator-in-reverse, replaying old failures at full fidelity. With age it steadies into something kinder: a continuity the dominant functions cannot supply.' },
    { key: 'inferior', name: 'Inferior', sub: '4th · aspirational', types: 'ENTP · ENFP', shadow: false, series: 3,
      /* the inferior's flood-open under depletion is the grip — the record
         carries a trace of `contrary` here without the shadow's hostility */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      dial: [.26, .28, .30, .26, .32],
      text: 'The record as a rumor. Details, dates, and where-things-are live in a fog until something breaks — and under real depletion the archive floods open as hypochondria and haunting: every bodily signal checked against every remembered symptom, every past mistake suddenly present tense. The grip, for a function that spent the whole day being ignored.' },
    { key: 'opposing', name: 'Opposing', sub: '5th · shadow', types: 'ESTP · ESFP', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      dial: [.36, .40, .40, .30, .22],
      text: 'The record as an obstacle. When precedent is used to close a live option — we tried that, it does not work — Si wakes up combative and produces counter-testimony: a vivid memory of the time it did. Held exactly long enough to win the point, then dropped.' },
    { key: 'critical', name: 'Critical Parent', sub: '6th · shadow', types: 'ISTP · ISFP', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      dial: [.30, .36, .34, .26, .18],
      text: 'An inner registrar with a grudge. It surfaces to read old entries against the self — you always do this, it went wrong last time too, remember — precise citations, hostile filing, and no interest in the cases that went well.' },
    { key: 'trickster', name: 'Trickster', sub: '7th · shadow', types: 'ENTJ · ENFJ', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      dial: [.22, .26, .30, .16, .12],
      text: 'The archive as a rigged index. Either the precedent is missing when needed — the same mistake, made fresh, with total confidence — or a false precedent arrives wearing perfect detail: a meeting remembered vividly that never happened. Neither failure announces itself, which is the trick.' },
    { key: 'demon', name: 'Demon', sub: '8th · shadow', types: 'INTJ · INFJ', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      dial: [.16, .22, .24, .10, .08],
      text: 'Rarely touched, and corrosive when it erupts: the past weaponized against the self — an inventory of every old failure presented as the permanent record, immune to context, indifferent to growth, formatted as fact.' },
  ];

  /* Introverted perception is fed by extraverted judgment; Si's canonical
     partners are the outer judges Te and Fe — the functions that keep the
     record honest by checking it against something outside it.

     cfg keys, all of which the engine actually reads:
       rate      arrival frequency multiplier (intake stays metered)
       weight    pleasure yield per recognition
       variety   how many distinct strata get fed (Fe feeds the whole ledger)
       audit     Te's verification sweep across the record
       sealed    loop coupling: entries re-fed from the inside, rim closed
       loopRings which few entries the loop re-reads, nightly
       starve    perception feeding perception: hypotheticals that never match
       aim       arrival bias angle (the feeder sits at the left rim) */
  const FEEDERS = [
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: true, pair: 'the ISTJ · ESTJ coupling',
      cfg: { rate: .50, weight: 1.0, variety: .55, audit: true, aim: 3.14 },
      text: 'The archive with an auditor. Te hands the pool verified results — what was measured, what shipped, what the procedure actually produced — and the strata become institutional: numbered, dated, reproducible. Watch the audit sweep cross the record on a schedule; deviations get escalated instead of endured. This is the coupling that runs infrastructure: a record trusted because something outside it keeps checking.' },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: true, pair: 'the ISFJ · ESFJ coupling',
      cfg: { rate: .62, weight: .9, variety: .95, aim: 3.0 },
      text: 'The archive with a guest list. Fe hands the pool people — who takes their coffee how, whose mother is ill, what this family does on the first snow — and the feeds spread across the whole ledger: care, distributed. Deviation detection turns interpersonal. The first to notice a friend is not okay is usually this coupling, comparing today\'s voice against years of stored Tuesdays.' },
    { key: 'ne', name: 'Ne', color: COL.n, canonical: false, unstable: true, pair: 'perception feeding perception',
      warn: 'Unstable coupling: perception feeding perception, with nothing judging either.',
      cfg: { rate: .85, weight: .3, variety: 1.0, starve: true },
      text: 'Two gatherers, no judge. Ne floods the intake with hypotheticals — things that might happen, could be true, would be interesting — and none of it will ever match a stratum, because none of it has happened. The pool dims, flinches, and lays down provisional bands for futures that never arrive to feed them. In a real stack these two alternate through a judge; wired directly, the archive fills with fiction.' },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: false, pair: 'the ISTJ Si–Fi loop',
      warn: 'Loop coupling: introverted judging feeding introverted perception — no correction from outside.',
      cfg: { rate: .45, weight: .8, sealed: true, loopRings: [5, 6] },
      text: 'The ISTJ loop, with Te cut out. Fi supplies the verdicts now, from inside: entries are re-read for how they felt, and the wounded ones get fed nightly. Watch the intake — nothing new is being admitted; the same few strata brighten from within while the rest of the record dims. The one thing that would break the pattern is an outside result, which is exactly what the loop no longer requests.' },
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: false, pair: 'the ISFJ Si–Ti loop',
      warn: 'Loop coupling: introverted judging feeding introverted perception — no correction from outside.',
      cfg: { rate: .45, weight: .85, sealed: true, loopRings: [3, 4] },
      text: 'The ISFJ loop, with Fe cut out. Ti supplies private logic for why the record must be right — every remembered procedure re-derived into a rule, every rule defended as principle. The archive gets internally consistent and socially unchecked: the same entries re-proven from inside, nobody outside confirming any of it, and the person the rules were for has left the room.' },
  ];

  /* ---- drain model ----
     Si's dominant curve carries slower, deeper notches than Se's: the
     completed ritual pays back — the checklist closed, the room returned
     to its known state — on a quarter-hour rhythm, not a heartbeat. */
  function domDrain(t) {
    const base = 11.2 * (t / 60);
    const phase = (t % 15) / 15;
    const notch = 2.1 * Math.max(0, 1 - Math.abs(phase - 0.08) * 6.5);
    return Math.max(0, base - notch);
  }
  function shadowDrain(t) {
    const base = 19 * Math.pow(t / 60, 1.22);
    let spikes = 0;
    for (const [st, mag] of [[14, 10], [39, 10], [66, 12], [95, 8]]) {
      if (t >= st) spikes += mag * clamp((t - st) / 1.6, 0, 1);
    }
    const wiggle = t < 2 ? 0 : 1.6 * Math.sin(t * 0.7) + 1.3 * Math.sin(t * 2.0 + 0.9);
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
    { label: 'Dominant', color: COL.pos[0], note: 'Refills during use — a day that matches the record barely costs.',
      f: t => t <= 30 ? 100 - SERIES[0].f(t) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t - 30) / 7)) },
    { label: 'Auxiliary', color: COL.pos[1], note: 'Quick, once the procedure is handed over and confirmed done.',
      f: t => t <= 30 ? 100 - SERIES[1].f(t) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t - 30) / 11)) },
    { label: 'Tertiary', color: COL.pos[2], note: 'Slower: the ritual restores only if it is actually kept.',
      f: t => t <= 30 ? 100 - SERIES[2].f(t) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t - 30) / 17)) },
    { label: 'Inferior', color: COL.pos[3], note: 'The hangover shelf: ~30 min of global dim while the symptom-checking winds down.',
      f: t => t <= 30 ? 100 - SERIES[3].f(t) : (t < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t - 60) / 21))) },
    { label: 'Shadow', color: COL.sh, note: 'Incomplete — entries written here stay open; some charge does not return today.',
      f: t => t <= 30 ? 100 - SERIES[4].f(t) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t - 30) / 26)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the Recognition Lab ----
     Judging pages verify claims; a perceiving page tests the QUALITY OF
     CONTACT between psyche and world (DESIGN §2.5). Si's contact runs
     through the record, so the lab hands the user all three arrivals —
     and, when the record disputes one, the ruling. */
  const LAB = {
    buttons: [
      { id: 'btnFamiliar', key: 'familiar', label: 'The Familiar, On Time', sub: 'the morning ritual arrives as always', color: COL.fn,
        impact: { stress: -0.04, pleasure: 0.22 }, followMs: 4600 },
      { id: 'btnDeviant', key: 'deviant', label: 'The Familiar, Changed', sub: 'a 90% match — something is off', color: COL.warn,
        impact: { stress: 0.34, pleasure: -0.06 }, followMs: 0 },
      { id: 'btnNovel', key: 'novel', label: 'The Unprecedented', sub: 'nothing in the record matches this', color: COL.n,
        impact: { stress: 0.22, pleasure: -0.02 }, followMs: 6200 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       and gloss live here with the rest of the content layer */
    states: {
      settled:     { label: 'Settled Resonance',    color: '#17c964' },
      equilibrium: { label: 'Still Water',          color: COL.fn },
      alarm:       { label: 'Discrepancy Alarm',    color: COL.warn },
      unmoored:    { label: 'Unprecedented Input',  color: COL.n },
      misfile:     { label: 'Mis-filed',            color: COL.crit },
    },
    /* the sibling economy, cross-listened: how the same arrival would land
       on Se's meters. Rendered as ghost needles beside the live ones. */
    sibling: {
      familiar: { stress: 0.07, pleasure: -0.03 },
      deviant:  { stress: -0.02, pleasure: 0.10 },
      novel:    { stress: -0.03, pleasure: 0.14 },
    },
    narrations: {
      familiar: 'The morning drop arrives on schedule and goes straight down — no search, no negotiation, a beeline to its stratum. The whole ring lights on contact: recognition here is not lookup, it is resonance, and it costs almost nothing. Watch the encounter cost readout as the ritual repeats.',
      familiar2: 'Fed again, a little cheaper than last time. This is what ritual is for: each pass thickens the stratum and drops the price of tomorrow\'s match. From outside it looks like rigidity. From inside it is load-bearing — the fixed points that make the rest of the day affordable.',
      deviant: 'It reached its ring and refused to merge. Ninety percent match — and the strobe is the other ten: stored color against observed color, beating like a flat note. Note the diff readout: Si\'s alarm is never vague. Something is off, and it knows exactly what. The record is waiting for your ruling.',
      deviantAccept: 'Accepted. A new band forms beside the old one — thin, dim, provisional — and it stays dim until repetition feeds it. This is how Si actually changes: not never, and not lightly, but by laying the new normal down next to the old record and waiting for evidence. Change is possible here. It is just never free.',
      deviantReject: 'Dismissed. The drop is expelled back through the rim, and the original stratum re-asserts a shade brighter than before — a record does not just survive an anomaly, it is confirmed by one. Note what vigilance costs, though: every alarm rehearsed makes the next one slightly easier to raise.',
      deviantAuto: 'Left unruled, the pool ruled for itself — and a settled archive defaults to its own record. That is not stubbornness; it is the prior doing its job. But notice that the ruling happened either way: deviation cannot simply be left standing. An open dispute with the record is the one state Si cannot hold.',
      novel: 'No stratum answers. Watch it search — ring after ring dimming as it passes, the pool contracting a shade, the whole chamber running the flinch of a system asked to file something it has never seen. Nothing here is dramatic; the stress climbs slowly. Novelty is not a catastrophe for Si. It is a cost.',
      novel2: 'Settled at the rim: a provisional band, thin and dim — the first layer of a future familiarity. Spawn it again and watch the price fall; by the third arrival it will have a home that answers and a chime of its own. Nothing is comfortable the first time. Almost anything can become comfortable.',
      hover: 'You are sounding the pool. Each ring under the cursor reports its record — what it holds, how often it has been fed, how bright it still runs. The deep center is the oldest material in the psyche: first rooms, first foods, first safety. It does not dim.',
    },
    idle: 'The pool runs unattended: metered drops arriving one at a time, each interrogated by the depths — matched, flagged, or filed as new. Spawn an arrival and watch the meters answer; when the record disputes one, the ruling is yours. Hover the strata to sound what each ring keeps.',
  };

  const HERO = {
    tag: 'introverted sensing',
    title: 'The Still Pool',
    subtitle: 'A sealed pool banded with strata — every past inflow laid down as a ring, the oldest fused bright at the core. Each admitted drop sinks to the layer it matches, and the whole ring lights when past and present agree.',
  };

  const ZONE_B = {
    kicker: 'Zone B · stack position',
    heading: 'The Eight Faces of Si',
    lede: 'Click any position to see how the record changes hands — from the dominant\'s bedrock archive to the demon\'s weaponized inventory of old failures. Watch the filing errors climb down the stack: false alarms on the unchanged, mis-filed drift on the changed. Drag the maturity slider to watch the strata multiply and rigidify with age.',
  };
  const ZONE_C = {
    kicker: 'Zone C · feeder coupling',
    heading: 'What Feeds Into Si?',
    lede: 'Introverted perception is fed by extraverted judgment — Si\'s real partners are Te and Fe, the outer judges that keep the record honest. Click a feeder and watch what the pool learns to keep.',
  };
  const ZONE_D = {
    kicker: 'Zone D · the recognition lab',
    heading: 'The Recognition Lab',
    lede: 'Si is a comparator: every arrival is interrogated by the depths — matched, flagged as off-record, or filed as unprecedented. This lab hands you all three arrivals and, when the record disputes one, the ruling. Watch the encounter cost fall as ritual repeats; watch the flinch when nothing answers.',
  };
  const ZONE_E = {
    kicker: 'Zone E · energy economics',
    heading: 'Energy Economics',
    lede: 'Every invocation of Si costs energy. The lower it sits in the stack, the more expensive it becomes. Note the notches in the dominant curve: a completed ritual pays a little back. Note also which way the grip runs here — a collapsed Si-dominant does not get more Si, it floods into inferior Ne.',
  };
  const ZONE_F = {
    kicker: 'Zone F · field notes',
    heading: 'Field Notes',
    lede: 'Patterns from the wild — how Si shows up in daily life.',
    mirror: { label: 'Si', counterpart: 'Se', counterpartColor: 'var(--pos-1)' },
    vignettes: [
      { title: 'The Hum', text: 'The machine sounds wrong. Nobody else in the shop hears it — the gauges all read normal — but an ISTJ who has stood beside it for nine years has already shut it down. The bearing that was failing gets found on the bench. Asked how they knew, they say it did not sound like itself: a complete technical explanation from inside the archive, and no explanation at all from outside it.' },
      { title: 'The Loop', text: 'An ISTJ under stress pairs dominant Si with tertiary Fi: the record turns inward and starts serving grievances — every slight on file, re-read nightly with the emotional charge refreshed. Te\'s outside audit is the function the loop avoids. The archive has never been more detailed, or less useful.' },
      { title: 'The Grip', text: 'An ENTP past the end of their reserves stops generating futures and floods into inferior Si — suddenly certain the mole is cancer, re-living a decade-old embarrassment at full resolution, gripped by the body\'s every signal. Not a personality change: a low-capacity chamber taking a dominant-sized flood.' },
    ],
  };

  return { COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, HERO, ZONE_B, ZONE_C, ZONE_D, ZONE_E, ZONE_F };
}
