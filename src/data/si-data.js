/* ============================================================
   CURRENTS · Si page data
   Parameters, models, and configuration specific to the
   Introverted Sensing page. All prose lives in
   content/en/si.json and is read through src/shared/copy.js —
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
import SI_COPY from '../../content/en/si.json';

registerCopy(SI_COPY);

export function loadSiData() {
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
     the attitude flipped, so Si's shadow register runs through the four
     Se-heavy types — the mirror of the Se page, slot for slot. */
  const SLOTS = [
    { key: 'dominant', ...pos('dominant'), types: 'ISTJ · ISFJ', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      copy: tx('si.slot.dominant') },
    { key: 'auxiliary', ...pos('auxiliary'), types: 'ESTJ · ESFJ', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      copy: tx('si.slot.auxiliary') },
    { key: 'tertiary', ...pos('tertiary'), types: 'INTP · INFP', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      copy: tx('si.slot.tertiary') },
    { key: 'inferior', ...pos('inferior'), types: 'ENTP · ENFP', shadow: false, series: 3,
      /* the inferior's flood-open under depletion is the grip — the record
         carries a trace of `contrary` here without the shadow's hostility */
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: .12 },
      copy: tx('si.slot.inferior') },
    { key: 'opposing', ...pos('opposing'), types: 'ESTP · ESFP', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      copy: tx('si.slot.opposing') },
    { key: 'critical', ...pos('critical'), types: 'ISTP · ISFP', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      copy: tx('si.slot.critical') },
    { key: 'trickster', ...pos('trickster'), types: 'ENTJ · ENFJ', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      copy: tx('si.slot.trickster') },
    { key: 'demon', ...pos('demon'), types: 'INTJ · INFJ', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      copy: tx('si.slot.demon') },
  ];

  /* §3.2 character: the five dial axes are derived in stack-rail.js from the
     same §3.1 params the glyph renders. These declared weights are the only
     place Si may differ from the position template, and each carries its
     argument — nothing about the dial is authored per-slot any more. */
  const CHARACTER = {
    endurance: { w: 1.00, why: t('si.character.endurance.why') },
    precision: { w: 0.95, why: t('si.character.precision.why') },
    speed:     { w: 0.48, why: t('si.character.speed.why') },
    control:   { w: 0.88, why: t('si.character.control.why') },
    awareness: { w: 0.75, why: t('si.character.awareness.why') },
  };

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
    { key: 'te', name: 'Te', color: '#17d4ef', canonical: true,
      cfg: { rate: .50, weight: 1.0, variety: .55, audit: true, aim: 3.14 },
      copy: tx('si.feeder.te') },
    { key: 'fe', name: 'Fe', color: '#f9748f', canonical: true,
      cfg: { rate: .62, weight: .9, variety: .95, aim: 3.0 },
      copy: tx('si.feeder.fe') },
    { key: 'ne', name: 'Ne', color: COL.n, canonical: false, unstable: true,
      cfg: { rate: .85, weight: .3, variety: 1.0, starve: true },
      copy: tx('si.feeder.ne') },
    { key: 'fi', name: 'Fi', color: '#f56a8c', canonical: false,
      cfg: { rate: .45, weight: .8, sealed: true, loopRings: [5, 6] },
      copy: tx('si.feeder.fi') },
    { key: 'ti', name: 'Ti', color: '#4fc9e0', canonical: false,
      cfg: { rate: .45, weight: .85, sealed: true, loopRings: [3, 4] },
      copy: tx('si.feeder.ti') },
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
    { label: t('site.position.dominant.name'), color: COL.pos[0], note: t('si.energy.recovery.dominant'),
      f: t2 => t2 <= 30 ? 100 - SERIES[0].f(t2) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t2 - 30) / 7)) },
    { label: t('site.position.auxiliary.name'), color: COL.pos[1], note: t('si.energy.recovery.auxiliary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[1].f(t2) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t2 - 30) / 11)) },
    { label: t('site.position.tertiary.name'), color: COL.pos[2], note: t('si.energy.recovery.tertiary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[2].f(t2) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t2 - 30) / 17)) },
    { label: t('site.position.inferior.name'), color: COL.pos[3], note: t('si.energy.recovery.inferior'),
      f: t2 => t2 <= 30 ? 100 - SERIES[3].f(t2) : (t2 < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t2 - 60) / 21))) },
    { label: t('site.position.shadow.name'), color: COL.sh, note: t('si.energy.recovery.shadow'),
      f: t2 => t2 <= 30 ? 100 - SERIES[4].f(t2) : lvl(4) + (92 - lvl(4)) * (1 - Math.exp(-(t2 - 30) / 26)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* ---- the Recognition Lab ----
     Judging pages verify claims; a perceiving page tests the QUALITY OF
     CONTACT between psyche and world (DESIGN §2.5). Si's contact runs
     through the record, so the lab hands the user all three arrivals —
     and, when the record disputes one, the ruling. Labels ship from the
     HTML; this table is behaviour only. */
  const LAB = {
    buttons: [
      { id: 'btnFamiliar', key: 'familiar', color: COL.fn,
        impact: { stress: -0.04, pleasure: 0.22 }, followMs: 4600 },
      { id: 'btnDeviant', key: 'deviant', color: COL.warn,
        impact: { stress: 0.34, pleasure: -0.06 }, followMs: 0 },
      { id: 'btnNovel', key: 'novel', color: COL.n,
        impact: { stress: 0.22, pleasure: -0.02 }, followMs: 6200 },
    ],
    /* cognitive state chips — thresholds live in the state engine; colors
       live here with the rest of the configuration layer */
    states: {
      settled:     { label: t('si.lab.state.settled'),     color: '#17c964' },
      equilibrium: { label: t('si.lab.state.equilibrium'), color: COL.fn },
      alarm:       { label: t('si.lab.state.alarm'),       color: COL.warn },
      unmoored:    { label: t('si.lab.state.unmoored'),    color: COL.n },
      misfile:     { label: t('si.lab.state.misfile'),     color: COL.crit },
    },
    /* the sibling economy, cross-listened: how the same arrival would land
       on Se's meters. Rendered as ghost needles beside the live ones. */
    sibling: {
      familiar: { stress: 0.07, pleasure: -0.03 },
      deviant:  { stress: -0.02, pleasure: 0.10 },
      novel:    { stress: -0.03, pleasure: 0.14 },
    },
    narrations: {
      familiar: tx('si.lab.narration.familiar'),
      familiar2: tx('si.lab.narration.familiar2'),
      deviant: tx('si.lab.narration.deviant'),
      deviantAccept: tx('si.lab.narration.deviantAccept'),
      deviantReject: tx('si.lab.narration.deviantReject'),
      deviantAuto: tx('si.lab.narration.deviantAuto'),
      novel: tx('si.lab.narration.novel'),
      novel2: tx('si.lab.narration.novel2'),
      /* the pointer hint branches on input modality; each branch is a
         complete key (content/SCHEMA.md) */
      hover: COARSE ? t('si.lab.narration.hoverCoarse') : t('si.lab.narration.hoverFine'),
    },
  };

  /* zone E · field notes (rendered by shared/field-notes.js) */
  const ZONE_F = {
    mirror: {
      label: 'Si', counterpart: 'Se', counterpartColor: 'var(--pos-1)',
      copy: tx('si.fieldNotes.mirror'),
    },
    vignettes: [
      tx('si.fieldNotes.vignette.hum'),
      tx('si.fieldNotes.vignette.loop'),
      tx('si.fieldNotes.vignette.grip'),
      tx('si.fieldNotes.vignette.ballast'),
      tx('si.fieldNotes.vignette.afraidOfChange'),
      tx('si.fieldNotes.vignette.noImagination'),
      tx('si.fieldNotes.vignette.unprecedented'),
    ],
  };

  return { COL, SLOTS, CHARACTER, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, ZONE_F };
}
