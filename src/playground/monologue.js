/* ============================================================
   CURRENTS · Playground — reads, salience, and the four voices

   Salience decides who speaks FIRST. Rank decides HOW they speak.
   Keeping those two apart is the whole design of this module: it
   is what lets an INTJ's inferior Se yelp before anything else in
   a sensory emergency — loudest first, in a small cracked voice —
   which is both the correct prediction and the more human picture.
   ============================================================ */
import { FN } from './types.js';
import { REGISTER, VOICING } from '../data/playground-data.js';
import { hookState } from './ledger.js';
import { clamp, mulberry32 } from '../utils/math.js';

const RANK_W = { dom: 1.0, aux: 0.75, tert: 0.45, inf: 0.25 };

/** How loudly this scenario is calling a given function's name. */
export function hookIntensity(fnKey, scenario = {}, briefing = {}) {
  const s = scenario.surface || {};
  switch (fnKey) {
    case 'se': return Math.max(s.se?.intensity || 0, s.se?.urgency || 0);
    case 'ne': return s.ne?.ambiguity || 0;
    case 'te': return s.te?.stakes || 0;
    case 'fe': return clamp((s.fe?.audience || 0) / 10, 0, 1);
    case 'si': return { 'familiar-bad': 0.9, unprecedented: 0.8, 'familiar-good': 0.4 }[hookState('si', briefing)] ?? 0.3;
    case 'ni': return { blindside: 0.9, foreseen: 0.75 }[hookState('ni', briefing)] ?? 0.3;
    case 'ti': return { contradiction: 0.9, consistent: 0.35 }[hookState('ti', briefing)] ?? 0.3;
    case 'fi': return Math.abs(briefing.fi?.valence ?? 0);
    default: return 0.3;
  }
}

export function salience(fnKey, rank, scenario, briefing) {
  const aff = (scenario.affinity && scenario.affinity[fnKey]) ?? 1;
  return RANK_W[rank] * hookIntensity(fnKey, scenario, briefing) * aff;
}

/** Pick the line a function has to say about this situation, in this telling. */
export function lineFor(fnKey, scenario, briefing) {
  const set = (scenario.monologue || {})[fnKey];
  if (!set) return null;
  if (typeof set === 'string') return set;
  const st = hookState(fnKey, briefing);
  return set[st] || set.base || set.default || Object.values(set)[0] || null;
}

/* Cut at the last sentence or clause boundary before the limit, so a
   truncated voice sounds curtailed rather than corrupted. */
function trimTo(text, frac) {
  if (frac >= 0.99) return text;
  const limit = Math.max(24, Math.floor(text.length * frac));
  if (text.length <= limit) return text;
  const head = text.slice(0, limit);
  const cut = Math.max(head.lastIndexOf('. '), head.lastIndexOf(', '), head.lastIndexOf(' — '), head.lastIndexOf(' '));
  return head.slice(0, cut > 20 ? cut : limit).replace(/[,;:—\s]+$/, '');
}

/**
 * Voice one line at one rank. The transformer is what keeps a scenario
 * authorable in an afternoon: one line per function, four registers out.
 */
export function voice(text, rank, seed = 1) {
  const reg = REGISTER[rank];
  const rng = mulberry32(seed);
  let out = trimTo(text, reg.trim);
  if (rank === 'aux') out = VOICING.aux[Math.floor(rng() * VOICING.aux.length)] + lower(out);
  if (rank === 'tert') out = VOICING.tert[Math.floor(rng() * VOICING.tert.length)] + lower(out);
  if (rank === 'inf') out = out + VOICING.infTail[Math.floor(rng() * VOICING.infTail.length)];
  return out;
}

const lower = (s) => (s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1) : s);

/**
 * The four reads, loudest first.
 * @returns [{ fn, rank, salience, text, register }]
 */
export function reads(vessel, scenario, briefing) {
  const out = [];
  for (const rank of ['dom', 'aux', 'tert', 'inf']) {
    const fnKey = vessel.stack[rank];
    if (!fnKey) continue;
    const text = lineFor(fnKey, scenario, briefing);
    if (!text) continue;
    const sal = salience(fnKey, rank, scenario, briefing);
    out.push({
      fn: fnKey, rank, salience: sal,
      label: FN[fnKey].label,
      register: REGISTER[rank],
      text: voice(text, rank, 7 + rank.length * 13),
      raw: text,
    });
  }
  return out.sort((a, b) => b.salience - a.salience);
}
