/* ============================================================
   CURRENTS · Ni page data
   Parameters, models, and configuration specific to the
   Introverted Intuition page. All prose lives in
   content/en/ni.json and is read through src/shared/copy.js —
   this module holds numbers, colours, curves, and the lab's
   behaviour table only.

   The old HERO / ZONE_B / ZONE_C / ZONE_D / ZONE_E exports,
   LAB.idle, and the LAB.buttons label/sub fields were dead
   copies of text that ships from the HTML; they rendered
   nothing and are gone (content/REPORT.md).
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';
import { registerCopy, t, tx } from '../shared/copy.js';
import NI_COPY from '../../content/en/ni.json';

registerCopy(NI_COPY);

export function loadNiData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  };

  const pos = (key) => ({
    name: t(`site.position.${key}.name`),
    ord: t(`site.position.${key}.ord`),
  });

  /* Type mappings follow the Beebe shadow rule: slots 5–8 are slots 1–4 with
     the attitude flipped, so an Ni-dominant type's Ne-dominant mirror carries
     Ni in the opposing role, and so on down. */
  const SLOTS = [
    { key: 'dominant', ...pos('dominant'), types: 'INTJ · INFJ', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      copy: tx('ni.slot.dominant') },
    { key: 'auxiliary', ...pos('auxiliary'), types: 'ENTJ · ENFJ', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      copy: tx('ni.slot.auxiliary') },
    { key: 'tertiary', ...pos('tertiary'), types: 'ISTP · ISFP', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      copy: tx('ni.slot.tertiary') },
    { key: 'inferior', ...pos('inferior'), types: 'ESTP · ESFP', shadow: false, series: 3,
      /* the inferior doom-vision *is* a premature convergence — total certainty
         on very little — so it carries a trace of `contrary` without the
         shadow register's cursor-fighting */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      copy: tx('ni.slot.inferior') },
    { key: 'opposing', ...pos('opposing'), types: 'ENTP · ENFP', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      copy: tx('ni.slot.opposing') },
    { key: 'critical', ...pos('critical'), types: 'INTP · INFP', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      copy: tx('ni.slot.critical') },
    { key: 'trickster', ...pos('trickster'), types: 'ESTJ · ESFJ', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      copy: tx('ni.slot.trickster') },
    { key: 'demon', ...pos('demon'), types: 'ISTJ · ISFJ', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      copy: tx('ni.slot.demon') },
  ];

  /* §3.2 character: the five dial axes are derived in stack-rail.js from the
     same §3.1 params the glyph renders. These declared weights are the only
     place Ni may differ from the position template, and each carries its
     argument — nothing about the dial is authored per-slot any more. */
  const CHARACTER = {
    endurance: { w: 0.95, why: t('ni.character.endurance.why') },
    precision: { w: 0.90, why: t('ni.character.precision.why') },
    speed:     { w: 0.40, why: t('ni.character.speed.why') },
    control:   { w: 0.60, why: t('ni.character.control.why') },
    awareness: { w: 0.85, why: t('ni.character.awareness.why') },
  };

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
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: true,
      cfg: { rate: .10, weight: 1.05, speed: .40, spread: .34, persistence: .95, aim: 3.14 },
      copy: tx('ni.feeder.te') },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: true,
      cfg: { rate: .30, weight: .52, speed: .46, spread: .62, persistence: .90, aim: 3.05 },
      copy: tx('ni.feeder.fe') },
    { key: 'se', name: 'Se', color: COL.s, canonical: false, unstable: true,
      cfg: { rate: .95, weight: .16, speed: .95, spread: 1.0, persistence: .18, starve: true },
      copy: tx('ni.feeder.se') },
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: false,
      cfg: { rate: .26, weight: .85, speed: .55, spread: .45, persistence: .99, sealed: true, aim: 3.30 },
      copy: tx('ni.feeder.ti') },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: false,
      cfg: { rate: .22, weight: .95, speed: .50, spread: .40, persistence: .99, sealed: true, aim: 2.95 },
      copy: tx('ni.feeder.fi') },
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
    { key: 'dom', label: t('site.position.dominant.name'), color: COL.pos[0], f: domDrain },
    { key: 'aux', label: t('site.position.auxiliary.name'), color: COL.pos[1], f: t2 => 20 * Math.pow(t2 / 60, 1.06) },
    { key: 'tert', label: t('site.position.tertiary.name'), color: COL.pos[2], f: t2 => 29 * Math.pow(t2 / 60, 1.4) },
    { key: 'inf', label: t('site.position.inferior.name'), color: COL.pos[3], f: t2 => Math.min(100, 84 * Math.pow(t2 / 60, 1.9)) },
    { key: 'sh', label: t('site.position.shadow.name'), color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 84, 1 / 1.9);

  const COSTS = [
    { label: t('site.position.dominant.name'), v: 1.0, color: COL.pos[0], series: 0 },
    { label: t('site.position.auxiliary.name'), v: 1.5, color: COL.pos[1], series: 1 },
    { label: t('site.position.tertiary.name'), v: 2.5, color: COL.pos[2], series: 2 },
    { label: t('site.position.inferior.name'), v: 4.0, color: COL.pos[3], series: 3 },
    { label: t('site.position.shadow.name'), v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: t('site.position.dominant.name'), color: COL.pos[0], note: t('ni.energy.recovery.dominant'),
      f: t2 => t2 <= 30 ? 100 - SERIES[0].f(t2) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t2 - 30) / 7)) },
    { label: t('site.position.auxiliary.name'), color: COL.pos[1], note: t('ni.energy.recovery.auxiliary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[1].f(t2) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t2 - 30) / 11)) },
    { label: t('site.position.tertiary.name'), color: COL.pos[2], note: t('ni.energy.recovery.tertiary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[2].f(t2) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t2 - 30) / 17)) },
    { label: t('site.position.inferior.name'), color: COL.pos[3], note: t('ni.energy.recovery.inferior'),
      f: t2 => t2 <= 30 ? 100 - SERIES[3].f(t2) : (t2 < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t2 - 60) / 21))) },
    { label: t('site.position.shadow.name'), color: COL.sh, note: t('ni.energy.recovery.shadow'),
      f: t2 => t2 <= 30 ? 100 - SERIES[4].f(t2) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t2 - 30) / 26)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the regression engine lab ----
     Te's lab asks what happens when results come back. Ni is a predictive
     instrument, so this one exposes the engine itself: five ways a day can
     treat a long-range regression, each with a measured impact on the
     stress/pleasure telemetry and its own choreography in the chamber.
     Labels ship from the HTML; this table is behaviour only. */
  const LAB = {
    buttons: [
      { id: 'btnAha', key: 'aha', color: COL.fn,
        impact: { stress: -0.50, pleasure: 0.90 }, followMs: 5600 },
      { id: 'btnCassandra', key: 'cassandra', color: COL.crit,
        impact: { stress: 0.85, pleasure: 0.30 }, followMs: 7000 },
      { id: 'btnFlash', key: 'flash', color: COL.warn,
        impact: { stress: 0.95, pleasure: -0.80 }, followMs: 6200 },
      { id: 'btnFocus', key: 'focus', color: '#4fc9e0',
        impact: { stress: -0.80, pleasure: 0.75 }, followMs: 6200 },
      { id: 'btnOverfit', key: 'overfit', color: COL.s,
        impact: { stress: 0.65, pleasure: -0.70 }, followMs: 6200 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       live here with the rest of the configuration layer */
    states: {
      euphoric:    { label: t('ni.lab.state.euphoric'),    color: '#17c964' },
      equilibrium: { label: t('ni.lab.state.equilibrium'), color: COL.fn },
      cynical:     { label: t('ni.lab.state.cynical'),     color: COL.warn },
      freeze:      { label: t('ni.lab.state.freeze'),      color: COL.crit },
      overfit:     { label: t('ni.lab.state.overfit'),     color: COL.sh },
    },
    narrations: {
      aha: tx('ni.lab.narration.aha'),
      aha2: tx('ni.lab.narration.aha2'),
      cassandra: tx('ni.lab.narration.cassandra'),
      cassandra2: tx('ni.lab.narration.cassandra2'),
      flash: tx('ni.lab.narration.flash'),
      flash2: tx('ni.lab.narration.flash2'),
      focus: tx('ni.lab.narration.focus'),
      focus2: tx('ni.lab.narration.focus2'),
      overfit: tx('ni.lab.narration.overfit'),
      overfit2: tx('ni.lab.narration.overfit2'),
      hover: t('ni.lab.narration.hover'),
    },
  };

  /* zone E · field notes (rendered by shared/field-notes.js) */
  const ZONE_F = {
    mirror: {
      label: 'Ni', counterpart: 'Ne', counterpartColor: 'var(--c-n)',
      copy: tx('ni.fieldNotes.mirror'),
    },
    vignettes: [
      tx('ni.fieldNotes.vignette.meeting'),
      tx('ni.fieldNotes.vignette.loop'),
      tx('ni.fieldNotes.vignette.grip'),
      tx('ni.fieldNotes.vignette.mechanicsHunch'),
      tx('ni.fieldNotes.vignette.cantJustKnow'),
      tx('ni.fieldNotes.vignette.mistakenForSi'),
      tx('ni.fieldNotes.vignette.brainstorm'),
    ],
  };

  return { COL, SLOTS, CHARACTER, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, ZONE_F };
}
