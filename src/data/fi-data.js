/* ============================================================
   CURRENTS · Fi page data
   Parameters, models, and configuration specific to the
   Introverted Feeling page. All prose lives in
   content/en/fi.json and is read through src/shared/copy.js —
   this module holds numbers, colours, and curves only.

   The old HERO / ZONE_B / ZONE_C / ZONE_D / ZONE_E exports and
   VERIFY.buttons were dead copies of text that ships from the
   HTML; they rendered nothing and are gone (content/REPORT.md).
   ============================================================ */
import { clamp } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';
import { registerCopy, t, tx } from '../shared/copy.js';
import FI_COPY from '../../content/en/fi.json';

registerCopy(FI_COPY);

export function loadFiData() {
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

  const SLOTS = [
    { key: 'dominant', ...pos('dominant'), types: 'INFP · ISFP', shadow: false, series: 0,
      params: { scale: 1.00, fidelity: .95, latency: 0, noise: 0, duty: 1, control: 1, contrary: 0 },
      copy: tx('fi.slot.dominant') },
    { key: 'auxiliary', ...pos('auxiliary'), types: 'ENFP · ESFP', shadow: false, series: 1,
      params: { scale: .80, fidelity: .85, latency: 80, noise: .05, duty: .85, control: .90, contrary: 0 },
      copy: tx('fi.slot.auxiliary') },
    { key: 'tertiary', ...pos('tertiary'), types: 'ISTJ · INTJ', shadow: false, series: 2,
      params: { scale: .55, fidelity: .60, latency: 250, noise: .20, duty: .50, control: .60, contrary: 0 },
      copy: tx('fi.slot.tertiary') },
    { key: 'inferior', ...pos('inferior'), types: 'ESTJ · ENTJ', shadow: false, series: 3,
      params: { scale: .40, fidelity: .35, latency: 700, noise: .45, duty: .25, control: .35, contrary: 0 },
      copy: tx('fi.slot.inferior') },
    { key: 'opposing', ...pos('opposing'), types: 'ENFJ · ESFJ', shadow: true, series: 4,
      params: { scale: .46, fidelity: .42, latency: 600, noise: .50, duty: .45, control: .40, contrary: .25 },
      copy: tx('fi.slot.opposing') },
    { key: 'critical', ...pos('critical'), types: 'INFJ · ISFJ', shadow: true, series: 4,
      params: { scale: .44, fidelity: .35, latency: 900, noise: .55, duty: .35, control: .30, contrary: .35 },
      copy: tx('fi.slot.critical') },
    { key: 'trickster', ...pos('trickster'), types: 'ESTP · ENTP', shadow: true, series: 4,
      params: { scale: .42, fidelity: .28, latency: 1200, noise: .60, duty: .30, control: .20, contrary: .55 },
      copy: tx('fi.slot.trickster') },
    { key: 'demon', ...pos('demon'), types: 'ISTP · INTP', shadow: true, series: 4,
      params: { scale: .40, fidelity: .20, latency: 1500, noise: .65, duty: .22, control: .12, contrary: .65 },
      copy: tx('fi.slot.demon') },
  ];

  /* §3.2 character: the five dial axes are derived in stack-rail.js from the
     same §3.1 params the glyph renders. These declared weights are the only
     place Fi may differ from the position template, and each carries its
     argument — nothing about the dial is authored per-slot any more. */
  const CHARACTER = {
    endurance: { w: 1.00, why: t('fi.character.endurance.why') },
    precision: { w: 0.92, why: t('fi.character.precision.why') },
    speed:     { w: 0.70, why: t('fi.character.speed.why') },
    control:   { w: 0.90, why: t('fi.character.control.why') },
    awareness: { w: 0.97, why: t('fi.character.awareness.why') },
  };

  const FEEDERS = [
    { key: 'ne', name: 'Ne', color: COL.n, canonical: true,
      cfg: { rate: .36, branchy: .85, speed: .35, spread: .95, persistence: .35 },
      copy: tx('fi.feeder.ne') },
    { key: 'se', name: 'Se', color: COL.s, canonical: true,
      cfg: { rate: .58, branchy: 0, speed: 1, spread: .15, persistence: .95 },
      copy: tx('fi.feeder.se') },
    { key: 'si', name: 'Si', color: '#c07f10', canonical: false,
      cfg: { rate: .3, branchy: 0, speed: .3, spread: .2, persistence: 1 },
      copy: tx('fi.feeder.si') },
    { key: 'ni', name: 'Ni', color: '#7148d8', canonical: false,
      cfg: { rate: .15, branchy: .15, speed: .2, spread: .5, persistence: .7 },
      copy: tx('fi.feeder.ni') },
    { key: 'te', name: 'Te', color: '#3fb4c9', canonical: false, unstable: true,
      cfg: { rate: .12, branchy: 0, speed: .3, spread: .4, persistence: .5 },
      copy: tx('fi.feeder.te') },
  ];

  /* drain model */
  function shadowDrain(t) {
    const base = 20 * Math.pow(t / 60, 1.25);
    let spikes = 0;
    for (const [st, mag] of [[16, 8], [41, 12], [68, 9], [97, 9]]) {
      if (t >= st) spikes += mag * clamp((t - st) / 2, 0, 1);
    }
    const wiggle = t < 2 ? 0 : 1.6 * Math.sin(t * 0.9) + 1.2 * Math.sin(t * 2.3 + 1);
    return clamp(base + spikes + wiggle, 0, 100);
  }

  const SERIES = [
    { key: 'dom', label: t('site.position.dominant.name'), color: COL.pos[0], f: t2 => Math.max(0, 13 * (t2 / 60) - 2.2 * Math.pow(Math.max(0, Math.sin(t2 / 8.2)), 3)) },
    { key: 'aux', label: t('site.position.auxiliary.name'), color: COL.pos[1], f: t2 => 21 * Math.pow(t2 / 60, 1.08) },
    { key: 'tert', label: t('site.position.tertiary.name'), color: COL.pos[2], f: t2 => 30 * Math.pow(t2 / 60, 1.4) },
    { key: 'inf', label: t('site.position.inferior.name'), color: COL.pos[3], f: t2 => Math.min(100, 82 * Math.pow(t2 / 60, 1.9)) },
    { key: 'sh', label: t('site.position.shadow.name'), color: COL.sh, f: shadowDrain },
  ];

  const GRIP_T = 60 * Math.pow(100 / 82, 1 / 1.9);

  const COSTS = [
    { label: t('site.position.dominant.name'), v: 1.0, color: COL.pos[0], series: 0 },
    { label: t('site.position.auxiliary.name'), v: 1.5, color: COL.pos[1], series: 1 },
    { label: t('site.position.tertiary.name'), v: 2.5, color: COL.pos[2], series: 2 },
    { label: t('site.position.inferior.name'), v: 4.0, color: COL.pos[3], series: 3 },
    { label: t('site.position.shadow.name'), v: 4.5, color: COL.sh, band: [3, 6], series: 4 },
  ];

  const RECOVERY = [
    { label: t('site.position.dominant.name'), color: COL.pos[0], note: t('fi.energy.recovery.dominant'),
      f: t2 => t2 <= 30 ? 100 - SERIES[0].f(t2) : lvl(0) + (100 - lvl(0)) * (1 - Math.exp(-(t2 - 30) / 6)) },
    { label: t('site.position.auxiliary.name'), color: COL.pos[1], note: t('fi.energy.recovery.auxiliary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[1].f(t2) : lvl(1) + (100 - lvl(1)) * (1 - Math.exp(-(t2 - 30) / 10)) },
    { label: t('site.position.tertiary.name'), color: COL.pos[2], note: t('fi.energy.recovery.tertiary'),
      f: t2 => t2 <= 30 ? 100 - SERIES[2].f(t2) : lvl(2) + (100 - lvl(2)) * (1 - Math.exp(-(t2 - 30) / 16)) },
    { label: t('site.position.inferior.name'), color: COL.pos[3], note: t('fi.energy.recovery.inferior'),
      f: t2 => t2 <= 30 ? 100 - SERIES[3].f(t2) : (t2 < 60 ? lvl(3) : lvl(3) + (100 - lvl(3)) * (1 - Math.exp(-(t2 - 60) / 20))) },
    { label: t('site.position.shadow.name'), color: COL.sh, note: t('fi.energy.recovery.shadow'),
      f: t2 => t2 <= 30 ? 100 - SERIES[4].f(t2) : lvl(4) + (93 - lvl(4)) * (1 - Math.exp(-(t2 - 30) / 25)) },
  ];
  function lvl(i) { return 100 - SERIES[i].f(30); }

  /* verify lab narrations (the button labels ship from the HTML) */
  const VERIFY = {
    narrations: {
      authGood: tx('fi.lab.narration.authGood'),
      authBad: tx('fi.lab.narration.authBad'),
      fakeGood: tx('fi.lab.narration.fakeGood'),
      fakeGoodEnd: tx('fi.lab.narration.fakeGoodEnd'),
      fakeBad: tx('fi.lab.narration.fakeBad'),
      fakeBadMid: tx('fi.lab.narration.fakeBadMid'),
      fakeBadEnd: tx('fi.lab.narration.fakeBadEnd'),
    },
  };

  /* zone E · field notes (rendered by shared/field-notes.js) */
  const ZONE_F = {
    mirror: {
      label: 'Fi', counterpart: 'Fe', counterpartColor: COL.f,
      copy: tx('fi.fieldNotes.mirror'),
    },
    vignettes: [
      tx('fi.fieldNotes.vignette.silentCompass'),
      tx('fi.fieldNotes.vignette.loop'),
      tx('fi.fieldNotes.vignette.grip'),
      tx('fi.fieldNotes.vignette.lockedDrawer'),
      tx('fi.fieldNotes.vignette.accusation'),
      tx('fi.fieldNotes.vignette.mistakenForNoOpinion'),
      tx('fi.fieldNotes.vignette.mediation'),
    ],
  };

  return { COL, SLOTS, CHARACTER, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, VERIFY, ZONE_F };
}
