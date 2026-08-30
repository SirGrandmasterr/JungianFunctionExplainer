/* ============================================================
   CURRENTS · Ne page data
   Parameters, models, and configuration specific to the
   Extraverted Intuition page. All prose lives in
   content/en/ne.json and is read through src/shared/copy.js —
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
import NE_COPY from '../../content/en/ne.json';

registerCopy(NE_COPY);

export function loadNeData() {
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
     the attitude flipped — the exact mirror of the Ni page's table. */
  const SLOTS = [
    { key: 'dominant', ...pos('dominant'), types: 'ENTP · ENFP', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      copy: tx('ne.slot.dominant') },
    { key: 'auxiliary', ...pos('auxiliary'), types: 'INTP · INFP', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      copy: tx('ne.slot.auxiliary') },
    { key: 'tertiary', ...pos('tertiary'), types: 'ESTJ · ESFJ', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      copy: tx('ne.slot.tertiary') },
    { key: 'inferior', ...pos('inferior'), types: 'ISTJ · ISFJ', shadow: false, series: 3,
      /* the inferior what-if engine fires as catastrophe — every unfamiliar
         option at once, all ending badly — so it carries a trace of
         `contrary` without the shadow register's cursor-fighting */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .10 },
      copy: tx('ne.slot.inferior') },
    { key: 'opposing', ...pos('opposing'), types: 'INTJ · INFJ', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      copy: tx('ne.slot.opposing') },
    { key: 'critical', ...pos('critical'), types: 'ENTJ · ENFJ', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      copy: tx('ne.slot.critical') },
    { key: 'trickster', ...pos('trickster'), types: 'ISTP · ISFP', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      copy: tx('ne.slot.trickster') },
    { key: 'demon', ...pos('demon'), types: 'ESTP · ESFP', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      copy: tx('ne.slot.demon') },
  ];

  /* §3.2 character: the five dial axes are derived in stack-rail.js from the
     same §3.1 params the glyph renders. These declared weights are the only
     place Ne may differ from the position template, and each carries its
     argument — nothing about the dial is authored per-slot any more. */
  const CHARACTER = {
    endurance: { w: 0.80, why: t('ne.character.endurance.why') },
    precision: { w: 0.55, why: t('ne.character.precision.why') },
    speed:     { w: 0.95, why: t('ne.character.speed.why') },
    control:   { w: 0.60, why: t('ne.character.control.why') },
    awareness: { w: 0.75, why: t('ne.character.awareness.why') },
  };

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
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: true,
      cfg: { rate: .28, weight: .95, speed: .55, depth: .9, spread: .5, persistence: .85, filter: .5 },
      copy: tx('ne.feeder.ti') },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: true,
      cfg: { rate: .30, weight: .85, speed: .5, depth: .65, spread: .7, persistence: .95, valued: .45 },
      copy: tx('ne.feeder.fi') },
    { key: 'si', name: 'Si', color: COL.s, canonical: false, unstable: true,
      cfg: { rate: .95, weight: .25, speed: .9, depth: .3, spread: .35, persistence: .3, starve: true, curl: .8 },
      copy: tx('ne.feeder.si') },
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: false,
      cfg: { rate: .5, weight: .7, speed: .7, depth: .45, spread: .95, persistence: .3, loop: true },
      copy: tx('ne.feeder.te') },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: false,
      cfg: { rate: .55, weight: .6, speed: .7, depth: .4, spread: 1.0, persistence: .28, loop: true },
      copy: tx('ne.feeder.fe') },
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
    { key: 'dom', label: t('site.position.dominant.name'), color: COL.pos[0], f: domDrain },
    { key: 'aux', label: t('site.position.auxiliary.name'), color: COL.pos[1], f: t2 => 20.5 * Math.pow(t2 / 60, 1.06) },
    { key: 'tert', label: t('site.position.tertiary.name'), color: COL.pos[2], f: t2 => 29 * Math.pow(t2 / 60, 1.4) },
    { key: 'inf', label: t('site.position.inferior.name'), color: COL.pos[3], f: t2 => Math.min(100, 83 * Math.pow(t2 / 60, 1.9)) },
    { key: 'sh', label: t('site.position.shadow.name'), color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 83, 1 / 1.9);

  const COSTS = [
    { label: t('site.position.dominant.name'), v: 1.0, color: COL.pos[0], series: 0 },
    { label: t('site.position.auxiliary.name'), v: 1.5, color: COL.pos[1], series: 1 },
    { label: t('site.position.tertiary.name'), v: 2.5, color: COL.pos[2], series: 2 },
    { label: t('site.position.inferior.name'), v: 4.0, color: COL.pos[3], series: 3 },
    { label: t('site.position.shadow.name'), v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: t('site.position.dominant.name'), color: COL.pos[0], note: t('ne.energy.recovery.dominant'),
      f: t2 => t2 <= 30 ? 100 - SERIES[0].f(t2) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t2 - 30) / 6.5)) },
    { label: t('site.position.auxiliary.name'), color: COL.pos[1], note: t('ne.energy.recovery.auxiliary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[1].f(t2) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t2 - 30) / 10)) },
    { label: t('site.position.tertiary.name'), color: COL.pos[2], note: t('ne.energy.recovery.tertiary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[2].f(t2) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t2 - 30) / 16)) },
    { label: t('site.position.inferior.name'), color: COL.pos[3], note: t('ne.energy.recovery.inferior'),
      f: t2 => t2 <= 30 ? 100 - SERIES[3].f(t2) : (t2 < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t2 - 60) / 20))) },
    { label: t('site.position.shadow.name'), color: COL.sh, note: t('ne.energy.recovery.shadow'),
      f: t2 => t2 <= 30 ? 100 - SERIES[4].f(t2) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t2 - 30) / 25)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the divergence engine lab ----
     Ni's lab asks what happens when perception converges. Ne is a breadth
     instrument, so this one exposes the engine itself: five ways a day can
     treat a divergence engine, each with a measured impact on the
     stress/pleasure telemetry and its own choreography in the chamber.
     Labels ship from the HTML; this table is behaviour only. */
  const LAB = {
    buttons: [
      { id: 'btnGraft', key: 'graft', color: COL.fn,
        impact: { stress: -0.35, pleasure: 0.90 }, followMs: 5800 },
      { id: 'btnPrune', key: 'prune', color: COL.crit,
        impact: { stress: 0.95, pleasure: -0.75 }, followMs: 6400 },
      { id: 'btnScatter', key: 'scatter', color: COL.warn,
        impact: { stress: 0.30, pleasure: 0.70 }, followMs: 6800 },
      { id: 'btnRiff', key: 'riff', color: '#4fc9e0',
        impact: { stress: -0.70, pleasure: 0.80 }, followMs: 6600 },
      /* the confine impulse is deliberately small: the engine grinds stress
         upward for as long as the template holds — see the narration */
      { id: 'btnConfine', key: 'confine', color: COL.s,
        impact: { stress: 0.22, pleasure: -0.55 }, followMs: 7200 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       live here with the rest of the configuration layer */
    states: {
      flow:        { label: t('ne.lab.state.flow'),        color: '#17c964' },
      equilibrium: { label: t('ne.lab.state.equilibrium'), color: COL.fn },
      scattered:   { label: t('ne.lab.state.scattered'),   color: COL.warn },
      pruned:      { label: t('ne.lab.state.pruned'),      color: COL.crit },
      starved:     { label: t('ne.lab.state.starved'),     color: COL.sh },
    },
    narrations: {
      graft: tx('ne.lab.narration.graft'),
      graft2: tx('ne.lab.narration.graft2'),
      prune: tx('ne.lab.narration.prune'),
      prune2: tx('ne.lab.narration.prune2'),
      scatter: tx('ne.lab.narration.scatter'),
      scatter2: tx('ne.lab.narration.scatter2'),
      riff: tx('ne.lab.narration.riff'),
      riff2: tx('ne.lab.narration.riff2'),
      confine: tx('ne.lab.narration.confine'),
      confine2: tx('ne.lab.narration.confine2'),
      hover: t('ne.lab.narration.hover'),
    },
  };

  /* zone E · field notes (rendered by shared/field-notes.js) */
  const ZONE_F = {
    mirror: {
      label: 'Ne', counterpart: 'Ni', counterpartColor: '#8257f0',
      copy: tx('ne.fieldNotes.mirror'),
      link: { href: '/ni/', label: t('ne.fieldNotes.mirrorLink') },
    },
    vignettes: [
      tx('ne.fieldNotes.vignette.whiteboard'),
      tx('ne.fieldNotes.vignette.loop'),
      tx('ne.fieldNotes.vignette.grip'),
      tx('ne.fieldNotes.vignette.fencedMeadow'),
      tx('ne.fieldNotes.vignette.neverFinish'),
      tx('ne.fieldNotes.vignette.mistakenForSe'),
      tx('ne.fieldNotes.vignette.signedContract'),
    ],
  };

  return { COL, SLOTS, CHARACTER, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, ZONE_F };
}
