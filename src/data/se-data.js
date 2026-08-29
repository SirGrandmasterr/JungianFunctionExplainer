/* ============================================================
   CURRENTS · Se page data
   Parameters, models, and configuration specific to the
   Extraverted Sensing page. All prose lives in
   content/en/se.json and is read through src/shared/copy.js —
   this module holds numbers, colours, curves, and the lab's
   behaviour table only.

   The old HERO / ZONE_B / ZONE_C / ZONE_D / ZONE_E exports,
   LAB.idle, and the LAB.buttons label/sub fields were dead
   copies of text that ships from the HTML; they rendered
   nothing and are gone (content/REPORT.md).
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR, COARSE } from '../utils/dom.js';
import { registerCopy, t, tx } from '../shared/copy.js';
import SE_COPY from '../../content/en/se.json';

registerCopy(SE_COPY);

export function loadSeData() {
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
     the attitude flipped, so Se's shadow register runs through the four
     Si-heavy types — the mirror of the Si page, slot for slot. */
  const SLOTS = [
    { key: 'dominant', ...pos('dominant'), types: 'ESTP · ESFP', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      copy: tx('se.slot.dominant') },
    { key: 'auxiliary', ...pos('auxiliary'), types: 'ISTP · ISFP', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      copy: tx('se.slot.auxiliary') },
    { key: 'tertiary', ...pos('tertiary'), types: 'ENTJ · ENFJ', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      copy: tx('se.slot.tertiary') },
    { key: 'inferior', ...pos('inferior'), types: 'INTJ · INFJ', shadow: false, series: 3,
      /* the inferior's flood-open under stress is the grip — the eye carries
         a trace of `contrary` here without the shadow register's hostility */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      copy: tx('se.slot.inferior') },
    { key: 'opposing', ...pos('opposing'), types: 'ISTJ · ISFJ', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      copy: tx('se.slot.opposing') },
    { key: 'critical', ...pos('critical'), types: 'ESTJ · ESFJ', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      copy: tx('se.slot.critical') },
    { key: 'trickster', ...pos('trickster'), types: 'INTP · INFP', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      copy: tx('se.slot.trickster') },
    { key: 'demon', ...pos('demon'), types: 'ENTP · ENFP', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      copy: tx('se.slot.demon') },
  ];

  /* §3.2 character: the five dial axes are derived in stack-rail.js from the
     same §3.1 params the glyph renders. These declared weights are the only
     place Se may differ from the position template, and each carries its
     argument — nothing about the dial is authored per-slot any more. */
  const CHARACTER = {
    endurance: { w: 0.90, why: t('se.character.endurance.why') },
    precision: { w: 0.90, why: t('se.character.precision.why') },
    speed:     { w: 0.97, why: t('se.character.speed.why') },
    control:   { w: 0.85, why: t('se.character.control.why') },
    awareness: { w: 0.60, why: t('se.character.awareness.why') },
  };

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
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: true,
      cfg: { rate: .55, weight: 1.0, speed: .8, spread: .3, focus: 1.0, dwell: .5, aim: 3.14 },
      copy: tx('se.feeder.ti') },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: true,
      cfg: { rate: .60, weight: .9, speed: .7, spread: .5, focus: .8, dwell: 1.0, aim: 3.0 },
      copy: tx('se.feeder.fi') },
    { key: 'ni', name: 'Ni', color: COL.n, canonical: false, unstable: true,
      cfg: { rate: .90, weight: .3, speed: .9, spread: 1.0, focus: .3, dwell: .2, starve: true },
      copy: tx('se.feeder.ni') },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: false,
      cfg: { rate: .85, weight: .6, speed: .9, spread: .7, focus: .6, dwell: .15, sealed: true, aim: 3.05 },
      copy: tx('se.feeder.fe') },
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: false,
      cfg: { rate: .90, weight: .7, speed: .95, spread: .6, focus: .7, dwell: .1, sealed: true, aim: 3.2 },
      copy: tx('se.feeder.te') },
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
    { label: t('site.position.dominant.name'), color: COL.pos[0], note: t('se.energy.recovery.dominant'),
      f: t2 => t2 <= 30 ? 100 - SERIES[0].f(t2) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t2 - 30) / 6)) },
    { label: t('site.position.auxiliary.name'), color: COL.pos[1], note: t('se.energy.recovery.auxiliary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[1].f(t2) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t2 - 30) / 10)) },
    { label: t('site.position.tertiary.name'), color: COL.pos[2], note: t('se.energy.recovery.tertiary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[2].f(t2) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t2 - 30) / 17)) },
    { label: t('site.position.inferior.name'), color: COL.pos[3], note: t('se.energy.recovery.inferior'),
      f: t2 => t2 <= 30 ? 100 - SERIES[3].f(t2) : (t2 < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t2 - 60) / 21))) },
    { label: t('site.position.shadow.name'), color: COL.sh, note: t('se.energy.recovery.shadow'),
      f: t2 => t2 <= 30 ? 100 - SERIES[4].f(t2) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t2 - 30) / 26)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the Contact Lab ----
     Judging pages verify claims; a perceiving page tests the QUALITY OF
     CONTACT between psyche and world (DESIGN §2.5). The instrument set:
     an intensity slider the user owns, and three spawnable events — a
     change to catch, an opening to use in time, and a field gone empty.
     Labels ship from the HTML; this table is behaviour only. */
  const LAB = {
    buttons: [
      { id: 'btnFlicker', key: 'flicker', color: COL.fn,
        impact: { stress: 0.0, pleasure: 0.16 }, followMs: 4200 },
      { id: 'btnWindow', key: 'window', color: '#4fc9e0',
        impact: { stress: 0.10, pleasure: 0.06 }, followMs: 4200 },
      { id: 'btnBlackout', key: 'blackout', color: COL.crit,
        impact: { stress: 0.28, pleasure: -0.30 }, followMs: 6600 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       live here with the rest of the configuration layer */
    states: {
      flow:        { label: t('se.lab.state.flow'),        color: '#17c964' },
      equilibrium: { label: t('se.lab.state.equilibrium'), color: COL.fn },
      hunger:      { label: t('se.lab.state.hunger'),      color: COL.warn },
      late:        { label: t('se.lab.state.late'),        color: COL.warn },
      blackout:    { label: t('se.lab.state.blackout'),    color: COL.crit },
    },
    /* the sibling economy, cross-listened: how the same event would land
       on Si's meters. Rendered as ghost needles beside the live ones. */
    sibling: {
      flicker:  { stress: 0.10, pleasure: 0.0 },
      window:   { stress: 0.16, pleasure: 0.0 },
      blackout: { stress: -0.06, pleasure: 0.12 },
    },
    narrations: {
      slider: tx('se.lab.narration.slider'),
      flicker: tx('se.lab.narration.flicker'),
      flicker2: tx('se.lab.narration.flicker2'),
      flickerMiss: tx('se.lab.narration.flickerMiss'),
      window: tx('se.lab.narration.window'),
      windowHit: tx('se.lab.narration.windowHit'),
      windowMiss: tx('se.lab.narration.windowMiss'),
      blackout: tx('se.lab.narration.blackout'),
      blackout2: tx('se.lab.narration.blackout2'),
      /* the pointer hint branches on input modality; each branch is a
         complete key (content/SCHEMA.md) */
      hover: COARSE ? t('se.lab.narration.hoverCoarse') : t('se.lab.narration.hoverFine'),
    },
  };

  /* zone E · field notes (rendered by shared/field-notes.js) */
  const ZONE_F = {
    mirror: {
      label: 'Se', counterpart: 'Si', counterpartColor: 'var(--pos-3)',
      copy: tx('se.fieldNotes.mirror'),
    },
    vignettes: [
      tx('se.fieldNotes.vignette.court'),
      tx('se.fieldNotes.vignette.loop'),
      tx('se.fieldNotes.vignette.grip'),
      tx('se.fieldNotes.vignette.scheduledBody'),
      tx('se.fieldNotes.vignette.reckless'),
      tx('se.fieldNotes.vignette.mistakenForNe'),
      tx('se.fieldNotes.vignette.fiveYearPlan'),
    ],
  };

  return { COL, SLOTS, CHARACTER, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, ZONE_F };
}
