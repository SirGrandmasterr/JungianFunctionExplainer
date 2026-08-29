/* ============================================================
   CURRENTS · i18n-lib — shared plumbing for translate.mjs and
   i18n-check.mjs

   Knows three things:
     · how to read content/en/** as a list of translation units
       (one field of one entry — the unit the model sees)
     · which field kind each unit is, because the kinds carry
       different prompts, different length bounds, and different
       failure modes
     · how to validate a candidate translation against the
       glossary and the schema rules (placeholders, markup,
       locked terms, length, non-translation)

   Node built-ins only.
   ============================================================ */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
export const CONTENT = join(ROOT, 'content');

/* Object fields that get translated; `note` never leaves English and
   `provenance` is copied verbatim into the locale entry. */
export const TRANSLATABLE_FIELDS = ['mechanism', 'mechanismHtml', 'figure', 'example', 'title', 'kind', 'pair'];

export const sha256 = (s) => createHash('sha256').update(s, 'utf8').digest('hex').slice(0, 16);
export const PLACEHOLDER = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

export function placeholdersOf(str) {
  const names = new Set();
  for (const m of str.matchAll(PLACEHOLDER)) names.add(m[1]);
  return names;
}

/* ---------------- corpus ---------------- */

/** All English namespace files: [{ns, rel, path, dict}], rel being the
    path fragment a locale mirrors (e.g. "ti.json", "scenarios/x.json"). */
export function readEnCorpus() {
  const dir = join(CONTENT, 'en');
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'scenarios') continue;
      for (const s of readdirSync(p)) {
        if (!s.endsWith('.json')) continue;
        out.push({ ns: `scenarios/${basename(s, '.json')}`, rel: `scenarios/${s}`, path: join(p, s), dict: JSON.parse(readFileSync(join(p, s), 'utf8')) });
      }
    } else if (name.endsWith('.json')) {
      out.push({ ns: basename(name, '.json'), rel: name, path: p, dict: JSON.parse(readFileSync(p, 'utf8')) });
    }
  }
  return out.sort((a, b) => a.ns.localeCompare(b.ns));
}

/* ---------------- units and field kinds ---------------- */

const UI_KEY = /(\.label|\.sub|\.name|\.ord|\.tag|\.kicker)$|^site\.nav\./;

function kindOfPlain(key, src) {
  if (!/[a-zA-Z]/.test(src.replace(PLACEHOLDER, ''))) return 'verbatim'; // pure tokens/symbols
  if (UI_KEY.test(key) || src.length <= 40) return 'ui';
  return 'prose';
}

function kindOfField(field) {
  if (field === 'mechanism' || field === 'mechanismHtml') return 'mechanism';
  if (field === 'figure') return 'figure';
  if (field === 'example') return 'example';
  return 'ui'; // title, kind, pair — short display companions
}

/** One field of one entry. id is `key` for plain strings, `key#field`
    for description-object fields. */
export function unitsOfDict(dict) {
  const units = [];
  for (const key of Object.keys(dict).sort()) {
    const v = dict[key];
    if (typeof v === 'string') {
      units.push({ id: key, key, field: null, src: v, kind: kindOfPlain(key, v), html: key.endsWith('Html') });
    } else if (v && typeof v === 'object') {
      for (const f of TRANSLATABLE_FIELDS) {
        if (typeof v[f] === 'string') {
          units.push({ id: `${key}#${f}`, key, field: f, src: v[f], kind: kindOfField(f), html: f.endsWith('Html') });
        }
      }
    }
  }
  return units;
}

/* ---------------- glossary ---------------- */

export function loadGlossary(locale) {
  const p = join(CONTENT, 'glossary', `${locale}.json`);
  if (!existsSync(p)) {
    throw new Error(
      `no glossary for "${locale}" — create content/glossary/${locale}.json ` +
      `(copy content/glossary/de.json and adapt locked/preferred; see docs/i18n.md)`
    );
  }
  const g = JSON.parse(readFileSync(p, 'utf8'));
  if (!Array.isArray(g.locked) || !Array.isArray(g.preferred) || !g.language) {
    throw new Error(`content/glossary/${locale}.json: needs "language", "locked" [] and "preferred" []`);
  }
  /* Catch a malformed entry here rather than as an undefined deep in the
     matcher — this file is hand-edited, and prose notes belong in _comment. */
  g.preferred.forEach((p, i) => {
    if (!p || typeof p.en !== 'string' || typeof p.use !== 'string') {
      throw new Error(`content/glossary/${locale}.json: preferred[${i}] needs string "en" and "use" (got ${JSON.stringify(p)})`);
    }
  });
  return { ...g, hash: sha256(JSON.stringify({ locked: g.locked, preferred: g.preferred })) };
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Count exact-token occurrences (no letter/digit on either side). */
export function countToken(text, token) {
  const re = new RegExp(`(?<![A-Za-z0-9])${escRe(token)}(?![A-Za-z0-9])`, 'g');
  return (text.match(re) || []).length;
}

/* ---------------- length bounds ---------------- */

/* Width-constrained UI slots: strings that sit in fixed chrome and cannot
   wrap — the SVG radar's axis labels, the rail's position chips, the nav
   strip. Everything else in `ui` register (button labels and their block
   sub-captions, headings, kickers) wraps and only gets taller, so a tight
   ratio there rejects correct translations for no layout reason. Measured
   on the Ti page: .spawn-btn small is display:block and wraps freely,
   while a 15-character axis label breaks the dial. */
const TIGHT_UI = /^site\.dial\.axis\.[a-z]+\.label$|^site\.position\.[a-z]+\.(name|ord)$|^site\.nav\./;

/** Hard character budget for UI-register strings. German runs about a
    third longer than English and short strings vary much more than long
    ones, so the constrained slots get a tight ratio with a small floor
    and the rest get room to wrap. This is the layout contract — a locale
    string over budget is a validation failure, never a CSS problem. */
export const uiBudget = (srcLen, key = '') =>
  TIGHT_UI.test(key)
    ? Math.max(Math.ceil(srcLen * 1.45), srcLen + 9)
    : Math.max(Math.ceil(srcLen * 1.9), srcLen + 18);

export function lengthBounds(kind, srcLen, key = '') {
  switch (kind) {
    case 'mechanism': return [Math.floor(srcLen * 0.65), Math.max(Math.ceil(srcLen * 1.5), srcLen + 40)];
    case 'figure':    return [Math.floor(srcLen * 0.45), Math.max(Math.ceil(srcLen * 2.0), srcLen + 40)];
    case 'example':   return [Math.floor(srcLen * 0.55), Math.max(Math.ceil(srcLen * 1.8), srcLen + 40)];
    case 'prose':     return [Math.floor(srcLen * 0.5),  Math.max(Math.ceil(srcLen * 1.9), srcLen + 45)];
    case 'ui':        return [1, uiBudget(srcLen, key)];
    default:          return [0, Infinity];
  }
}

/* ---------------- glossary term detection ----------------
   Whether a source string actually *uses* a term of art. Two traps the
   Ti pilot walked into, both of which forced retries that made the
   German worse rather than better:

     · "seat" fired on "re-seats itself" and "arrives seated" — verbs,
       not the stack-position noun — and the retry jammed "Sitz" into
       sentences that never meant it. So: match the whole word plus a
       simple plural only, never an arbitrary suffix, and never across
       a hyphen ("re-seats", "half-seated").
     · "position" fired inside the placeholder "{position}", which is a
       code identifier and not prose at all. So: strip placeholders
       before looking. */
function usesTerm(src, term) {
  const prose = src.replace(PLACEHOLDER, ' ');
  return new RegExp(`(?<![-\\w])${escRe(term)}(?:s|es)?(?![\\w])`, 'i').test(prose);
}

/** Is the fixed target term present in the translation?

    `caseSensitive` demands the capital, because German capitalizes nouns
    and "grip" would otherwise pass where "Grip" was specified. But a noun
    that is the tail of a closed compound is correctly LOWERCASE —
    "Simulationsbühne", "Kopplungsbühne" — while a hyphenated compound
    keeps the capital ("Zubringer-Kopplung"). Demanding the capital
    everywhere rejects exactly the right answer, so the lowercase form is
    accepted when it is welded onto a preceding word character, and only
    then. */
function honoursTerm(out, p) {
  const stem = p.match || p.use;
  if (!p.caseSensitive) return out.toLowerCase().includes(stem.toLowerCase());
  if (out.includes(stem)) return true;
  const lower = stem.charAt(0).toLowerCase() + stem.slice(1);
  return new RegExp(`\\w${escRe(lower)}`).test(out);   // compound-internal
}

/** Glossary compliance for one source/translation pair, as messages.
    Shared so translate.mjs and i18n-check.mjs enforce one rule set. */
export function glossaryProblems(src, out, glossary) {
  const problems = [];
  for (const p of glossary.preferred) {
    if (!usesTerm(src, p.en)) continue;
    if (!honoursTerm(out, p)) problems.push(`glossary: "${p.en}" must be rendered with "${p.use}"`);
  }
  return problems;
}

/* ---------------- validation ---------------- */

const ALLOWED_TAGS = ['strong', 'em', 'br'];
const COMMENTARY = /^\s*(here is|here's|translation\s*:|translated\s*:|übersetzung\s*:|traducci[oó]n\s*:|die übersetzung|la traducci[oó]n)/i;

function tagCounts(str) {
  const counts = Object.create(null);
  for (const m of str.matchAll(/<\s*\/?\s*([a-zA-Z0-9-]+)[^>]*>/g)) {
    const t = m[1].toLowerCase();
    counts[t] = (counts[t] || 0) + 1;
  }
  return counts;
}

/** Validate a candidate translation for a unit. Returns a list of
    problem strings — empty means acceptable. */
export function validateTranslation(unit, text, glossary) {
  const problems = [];
  const src = unit.src;
  const out = text;

  if (typeof out !== 'string' || !out.trim()) return ['empty translation'];

  /* commentary / wrapping */
  if (COMMENTARY.test(out)) problems.push('starts with commentary, not the translation itself');
  const wrapped = /^\s*["„«»“”'].*["„«»“”']\s*$/s.test(out) && !/^\s*["„«»“”']/.test(src);
  if (wrapped) problems.push('wrapped in quotation marks the source does not have');

  /* placeholders: exact set, none invented */
  const want = placeholdersOf(src), got = placeholdersOf(out);
  for (const n of want) if (!got.has(n)) problems.push(`placeholder {${n}} missing`);
  for (const n of got) if (!want.has(n)) problems.push(`placeholder {${n}} invented`);

  /* markup */
  if (unit.html) {
    const a = tagCounts(src), b = tagCounts(out);
    for (const t of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!ALLOWED_TAGS.includes(t)) { if ((b[t] || 0) > 0) problems.push(`disallowed tag <${t}>`); continue; }
      if ((a[t] || 0) !== (b[t] || 0)) problems.push(`tag <${t}> count ${b[t] || 0}, source has ${a[t] || 0}`);
    }
  } else if (out.includes('<')) {
    problems.push('markup in a plain field');
  }

  /* locked terms: every source occurrence must survive verbatim
     (>= because target languages may legitimately open a sentence
     with a token look-alike, e.g. Spanish "Se") */
  for (const tok of glossary.locked) {
    const n = countToken(src, tok);
    if (n > 0 && countToken(out, tok) < n) problems.push(`locked term "${tok}" must appear verbatim (${n}×)`);
  }

  /* preferred terminology: if the English term of art is present, the
     fixed target term must be too */
  problems.push(...glossaryProblems(src, out, glossary));

  /* length */
  const [lo, hi] = lengthBounds(unit.kind, src.length, unit.key);
  if (out.length < lo) problems.push(`too short (${out.length} chars, minimum ${lo})`);
  if (out.length > hi) problems.push(unit.kind === 'ui'
    ? `over the ${hi}-character budget (${out.length}) — this is a layout constraint, shorten the wording`
    : `too long (${out.length} chars, maximum ${hi})`);

  /* untranslated output */
  const lettersOutsideTokens = src.replace(PLACEHOLDER, '').replace(/[^a-zA-Z]/g, '');
  if (src.length > 15 && lettersOutsideTokens.length > 8 && out.trim() === src.trim()) {
    problems.push('byte-identical to the English source');
  }

  return problems;
}

/* ---------------- locale file helpers ---------------- */

/** Serialize a locale dictionary canonically: _meta first, then keys
    sorted, 2-space indent, trailing newline. */
export function canonicalLocaleJson(dict) {
  const keys = Object.keys(dict).filter((k) => k !== '_meta').sort();
  const ordered = {};
  if (dict._meta) ordered._meta = dict._meta;
  for (const k of keys) ordered[k] = dict[k];
  return JSON.stringify(ordered, null, 2) + '\n';
}

export function readLocaleFile(locale, rel) {
  const p = join(CONTENT, locale, rel);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

/** Locales that exist on disk (any dir under content/ except en/glossary). */
export function localesOnDisk() {
  return readdirSync(CONTENT).filter((n) => {
    if (n === 'en' || n === 'glossary') return false;
    return statSync(join(CONTENT, n)).isDirectory();
  }).sort();
}
