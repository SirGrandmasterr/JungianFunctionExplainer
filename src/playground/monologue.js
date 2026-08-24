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
import { clamp } from '../utils/math.js';

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

/* ---------- trimming ----------
   Rank cuts a line short; it must never cut it open. A trim lands on a
   sentence terminator when one fits, on a clause boundary (" — ", "; ")
   when none does, and otherwise runs the first sentence long — an
   over-long voice still reads as a voice, where a severed one reads as
   a bug in the page. Bare commas and spaces are never cut points. */

/** Exclusive end offsets of every sentence in `text`. */
function sentenceEnds(text) {
  const out = [];
  const re = /[.?!…]+["'”’)\]]*(?=\s|$)/g;
  let m;
  while ((m = re.exec(text))) out.push(m.index + m[0].length);
  return out;
}

/** Offsets where a clause closes: just before a " — " or a "; ". */
function clauseEnds(text) {
  const out = [];
  const re = /\s+[—–]\s+|\s*;\s+/g;
  let m;
  while ((m = re.exec(text))) out.push(m.index);
  return out;
}

/** The latest boundary that still fits, or null if none does. */
function lastWithin(offsets, limit) {
  let best = null;
  for (const o of offsets) { if (o > limit) break; best = o; }
  return best;
}

/* Joinery that cannot be the last thing a voice says: a line ending on
   one of these is a fragment, not a curtailed thought. */
const DANGLING = /\s+(?:and|but|or|nor|so|yet|the|an?|to|of|for|with|in|on|at|from|by|as|into|than|that|which)$/i;

/** Strip trailing punctuation, then any dangling function word, until stable. */
function tidyCut(s) {
  let out = s.replace(/[\s,;:—–-]+$/, '');
  for (let i = 0; i < 4; i++) {
    const next = out.replace(DANGLING, '').replace(/[\s,;:—–-]+$/, '');
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * Cut a line down to `frac` of its length without ever ending mid-clause.
 * @returns {{text: string, cut: boolean}} `cut` is what the inferior's
 *          break-off tail keys on — nothing lost, nothing trailing off.
 */
function trimTo(text, frac) {
  if (frac >= 0.99) return { text, cut: false };
  const limit = Math.max(24, Math.floor(text.length * frac));
  if (text.length <= limit) return { text, cut: false };

  const ends = sentenceEnds(text);
  let at = lastWithin(ends, limit);                  /* whole sentences, preferred */
  if (at == null) at = lastWithin(clauseEnds(text), limit);   /* then a whole clause */
  if (at == null) at = ends.length ? ends[0] : null;          /* then one long sentence */
  if (at == null || at >= text.length) return { text, cut: false };

  const kept = tidyCut(text.slice(0, at));
  return kept.length ? { text: kept, cut: true } : { text, cut: false };
}

/* ---------- voicing ----------
   One hedge per (rank, scenario), chosen by ROTATING the opener ring
   rather than by drawing from it. A draw is only probably different
   between scenarios; a rotation is different by construction, for as
   long as the deck is no bigger than the ring. The old seed —
   `7 + rank.length * 13` — was neither: dom, aux and inf are all three
   letters long, so they shared a seed, and the scenario never entered
   it at all. Every scenario opened with the same hedge. */

const RANK_ROT = { dom: 0, aux: 1, tert: 2, inf: 3 };

/** Deterministic per (rank, scenario id); stable across re-renders. */
export function voiceSeed(rank, scenarioId = '') {
  /* FNV-1a, then the murmur3 finaliser: ids this short and this similar
     ("the-offer", "credit-thief") differ mostly in their low bits, which
     is exactly the part a `% length` reads. Avalanche them first. */
  let h = 0x811c9dc5;
  for (let i = 0; i < scenarioId.length; i++) {
    h ^= scenarioId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) + (RANK_ROT[rank] ?? 0)) >>> 0;
}

const pick = (arr, seed) => arr[seed % arr.length];

/* Dev-only tripwire: a rendered voice ending on a comma or a conjunction is
   the exact bug the trimmer above exists to prevent, so let it say so. */
const DEV = !!(import.meta.env && import.meta.env.DEV);
const BROKEN_END = /(?:[,;:]|\b(?:and|but|or|nor|so|yet|the|an?|to|of|for|with|in|on|at|from|by|as|into|than|that|which)\b)\s*$/i;

/**
 * Voice one line at one rank. The transformer is what keeps a scenario
 * authorable in an afternoon: one line per function, four registers out.
 */
export function voice(text, rank, seed = 1) {
  const reg = REGISTER[rank];
  const { text: body, cut } = trimTo(text, reg.trim);
  let out = body;
  if (rank === 'aux') out = pick(VOICING.aux, seed) + lower(out);
  if (rank === 'tert') out = pick(VOICING.tert, seed) + lower(out);
  if (rank === 'inf' && cut) {
    /* The tail is the sound of a sentence breaking off, so it only belongs on
       a line that actually broke off — and it carries its own punctuation,
       which a full stop in front of it would fight. */
    out = out.replace(/\.$/, '') + pick(VOICING.infTail, seed);
  }
  if (DEV && BROKEN_END.test(out)) {
    console.warn(`[monologue] ${rank} voice ends mid-clause: “${out}”`);
  }
  return out;
}

/* Lower-case the opening word so a hedge can be glued in front of it —
   except "I", which is a word, not a capital. */
const lower = (s) =>
  /^I\b/.test(s) ? s
    : s.length > 1 && s[1] === s[1].toLowerCase() ? s[0].toLowerCase() + s.slice(1)
      : s;

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
      text: voice(text, rank, voiceSeed(rank, (scenario && scenario.id) || '')),
      raw: text,
    });
  }
  return out.sort((a, b) => b.salience - a.salience);
}
