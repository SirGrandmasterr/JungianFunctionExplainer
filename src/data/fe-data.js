/* ============================================================
   CURRENTS · Fe page data
   Parameters, models, and configuration specific to the
   Extraverted Feeling page. All prose lives in
   content/en/fe.json and is read through src/shared/copy.js —
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
import FE_COPY from '../../content/en/fe.json';

registerCopy(FE_COPY);

export function loadFeData() {
  const COL = {
    fn: CSSVAR('--c-accent'), n: CSSVAR('--c-n'), s: CSSVAR('--c-s'), f: CSSVAR('--c-f'),
    pos: [CSSVAR('--pos-1'), CSSVAR('--pos-2'), CSSVAR('--pos-3'), CSSVAR('--pos-4')],
    sh: CSSVAR('--pos-sh'), warn: CSSVAR('--warn'), crit: CSSVAR('--crit'),
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
    ghost: CSSVAR('--fe-ghost'), nul: CSSVAR('--fe-null'), heat: CSSVAR('--fe-heat') || '#ffb020',
    /* the wide carrier band — see the note in fe-theme.css for why it is wide */
    hueLo: parseFloat(CSSVAR('--fe-hue-lo')) || 300,
    hueHi: parseFloat(CSSVAR('--fe-hue-hi')) || 396,
  };

  const pos = (key) => ({
    name: t(`site.position.${key}.name`),
    ord: t(`site.position.${key}.ord`),
  });

  /* Type mappings follow the Beebe shadow rule: slots 5–8 are slots 1–4 with
     the attitude flipped, so Fe's shadow register runs through the four
     Fi-heavy types — the mirror of the Fi page, slot for slot. */
  const SLOTS = [
    { key: 'dominant', ...pos('dominant'), types: 'ENFJ · ESFJ', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      copy: tx('fe.slot.dominant') },
    { key: 'auxiliary', ...pos('auxiliary'), types: 'INFJ · ISFJ', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      copy: tx('fe.slot.auxiliary') },
    { key: 'tertiary', ...pos('tertiary'), types: 'ENTP · ESTP', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      copy: tx('fe.slot.tertiary') },
    { key: 'inferior', ...pos('inferior'), types: 'ISTP · INTP', shadow: false, series: 3,
      /* the inferior's flood-open under depletion is the grip — a trace of
         `contrary` here without the shadow register's hostility */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      copy: tx('fe.slot.inferior') },
    { key: 'opposing', ...pos('opposing'), types: 'INFP · ISFP', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      copy: tx('fe.slot.opposing') },
    { key: 'critical', ...pos('critical'), types: 'ENFP · ESFP', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      copy: tx('fe.slot.critical') },
    { key: 'trickster', ...pos('trickster'), types: 'ISTJ · INTJ', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      copy: tx('fe.slot.trickster') },
    { key: 'demon', ...pos('demon'), types: 'ESTJ · ENTJ', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      copy: tx('fe.slot.demon') },
  ];

  /* §3.2 character: the five dial axes are derived in stack-rail.js from the
     same §3.1 params the glyph renders. These declared weights are the only
     place Fe may differ from the position template, and each carries its
     argument — nothing about the dial is authored per-slot any more. */
  const CHARACTER = {
    endurance: { w: 0.95, why: t('fe.character.endurance.why') },
    precision: { w: 0.90, why: t('fe.character.precision.why') },
    speed:     { w: 0.92, why: t('fe.character.speed.why') },
    control:   { w: 0.92, why: t('fe.character.control.why') },
    awareness: { w: 0.85, why: t('fe.character.awareness.why') },
  };

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
    { key: 'ni', name: 'Ni', color: '#7148d8', canonical: true,
      cfg: { nodes: 5, horizon: 0.9, weight: 1.0 },
      copy: tx('fe.feeder.ni') },
    { key: 'si', name: 'Si', color: '#c07f10', canonical: true,
      cfg: { nodes: 9, history: 0.85, weight: .9 },
      copy: tx('fe.feeder.si') },
    { key: 'se', name: 'Se', color: '#f0a020', canonical: false,
      cfg: { nodes: 7, surface: 1, weight: .5 },
      copy: tx('fe.feeder.se') },
    { key: 'ne', name: 'Ne', color: '#8b5cf6', canonical: false,
      cfg: { nodes: 7, phantom: .8, weight: .4 },
      copy: tx('fe.feeder.ne') },
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: false, unstable: true,
      cfg: { nodes: 7, stale: .9, weight: .3 },
      copy: tx('fe.feeder.te') },
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
    { key: 'dom', label: t('site.position.dominant.name'), color: COL.pos[0], f: domDrain },
    { key: 'aux', label: t('site.position.auxiliary.name'), color: COL.pos[1], f: t2 => 21 * Math.pow(t2 / 60, 1.07) },
    { key: 'tert', label: t('site.position.tertiary.name'), color: COL.pos[2], f: t2 => 30 * Math.pow(t2 / 60, 1.42) },
    { key: 'inf', label: t('site.position.inferior.name'), color: COL.pos[3], f: t2 => Math.min(100, 86 * Math.pow(t2 / 60, 1.9)) },
    { key: 'sh', label: t('site.position.shadow.name'), color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 86, 1 / 1.9);

  const COSTS = [
    { label: t('site.position.dominant.name'), v: 1.0, color: COL.pos[0], series: 0 },
    { label: t('site.position.auxiliary.name'), v: 1.5, color: COL.pos[1], series: 1 },
    { label: t('site.position.tertiary.name'), v: 2.5, color: COL.pos[2], series: 2 },
    { label: t('site.position.inferior.name'), v: 4.0, color: COL.pos[3], series: 3 },
    { label: t('site.position.shadow.name'), v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: t('site.position.dominant.name'), color: COL.pos[0], note: t('fe.energy.recovery.dominant'),
      f: t2 => t2 <= 30 ? 100 - SERIES[0].f(t2) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t2 - 30) / 6)) },
    { label: t('site.position.auxiliary.name'), color: COL.pos[1], note: t('fe.energy.recovery.auxiliary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[1].f(t2) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t2 - 30) / 10)) },
    { label: t('site.position.tertiary.name'), color: COL.pos[2], note: t('fe.energy.recovery.tertiary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[2].f(t2) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t2 - 30) / 16)) },
    { label: t('site.position.inferior.name'), color: COL.pos[3], note: t('fe.energy.recovery.inferior'),
      f: t2 => t2 <= 30 ? 100 - SERIES[3].f(t2) : (t2 < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t2 - 60) / 20))) },
    { label: t('site.position.shadow.name'), color: COL.sh, note: t('fe.energy.recovery.shadow'),
      f: t2 => t2 <= 30 ? 100 - SERIES[4].f(t2) : lvl(4) + (91 - lvl(4)) * (1 - Math.exp(-(t2 - 30) / 25)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the Resonance Lab ----
     Judging pages verify: Ti against its lattice, Te against external
     results, Fi against the core tone. Fe verifies against the coherence of
     the field around it — which is the only place its judgment happens, and
     the reason this lab spawns events into the room rather than into the
     chamber. Three harmony triggers, three dissonance triggers. Labels ship
     from the HTML; this table is behaviour only. */
  const LAB = {
    buttons: [
      { id: 'btnSync', key: 'sync', color: COL.fn,
        row: 'harmony', impact: { stress: -0.08, pleasure: 0.30 }, followMs: 0 },
      { id: 'btnCelebrate', key: 'celebrate', color: '#ffa8bd',
        row: 'harmony', impact: { stress: -0.14, pleasure: 0.46 }, followMs: 6200 },
      { id: 'btnReconcile', key: 'reconcile', color: '#17c964',
        row: 'harmony', impact: { stress: 0.20, pleasure: 0.04 }, followMs: 5000, gated: true },
      { id: 'btnCovert', key: 'covert', color: COL.ghost,
        row: 'dissonance', impact: { stress: 0.38, pleasure: -0.12 }, followMs: 0 },
      { id: 'btnDeadlock', key: 'deadlock', color: COL.warn,
        row: 'dissonance', impact: { stress: 0.42, pleasure: -0.30 }, followMs: 0 },
      { id: 'btnIsolate', key: 'isolate', color: COL.crit,
        row: 'dissonance', impact: { stress: 0.30, pleasure: -0.34 }, followMs: 6500 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       live here with the rest of the configuration layer */
    states: {
      concord:    { label: t('fe.lab.state.concord'),    color: '#17c964' },
      attuned:    { label: t('fe.lab.state.attuned'),    color: COL.fn },
      ambient:    { label: t('fe.lab.state.ambient'),    color: COL.fn },
      conducting: { label: t('fe.lab.state.conducting'), color: COL.warn },
      dissonant:  { label: t('fe.lab.state.dissonant'),  color: COL.warn },
      split:      { label: t('fe.lab.state.split'),      color: COL.crit },
      unreadable: { label: t('fe.lab.state.unreadable'), color: COL.ghost },
      severed:    { label: t('fe.lab.state.severed'),    color: COL.crit },
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
      sync: tx('fe.lab.narration.sync'),
      celebrate: tx('fe.lab.narration.celebrate'),
      celebrate2: tx('fe.lab.narration.celebrate2'),
      reconcile: tx('fe.lab.narration.reconcile'),
      reconcile2: tx('fe.lab.narration.reconcile2'),
      /* the pointer-interaction hint branches on input modality; each branch
         is a complete sentence with its own key (content/SCHEMA.md) */
      covert: {
        ...tx('fe.lab.narration.covert'),
        mechanism: tx('fe.lab.narration.covert').mechanism + ' ' +
          (COARSE ? t('fe.lab.narration.covertHintCoarse') : t('fe.lab.narration.covertHintHover')),
      },
      deadlock: tx('fe.lab.narration.deadlock'),
      isolate: tx('fe.lab.narration.isolate'),
      isolate2: tx('fe.lab.narration.isolate2'),
      gate: t('fe.lab.narration.gate'),
      hover: t('fe.lab.narration.hover'),
    },
  };

  /* zone E · field notes (rendered by shared/field-notes.js) */
  const ZONE_F = {
    mirror: {
      label: 'Fe', counterpart: 'Fi', counterpartColor: '#f56a8c',
      copy: tx('fe.fieldNotes.mirror'),
    },
    vignettes: [
      tx('fe.fieldNotes.vignette.read'),
      tx('fe.fieldNotes.vignette.loop'),
      tx('fe.fieldNotes.vignette.grip'),
      tx('fe.fieldNotes.vignette.showtime'),
      tx('fe.fieldNotes.vignette.fake'),
      tx('fe.fieldNotes.vignette.mistakenForFi'),
      tx('fe.fieldNotes.vignette.roomThatBreaks'),
    ],
  };

  return { COL, SLOTS, CHARACTER, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, ZONE_F };
}
