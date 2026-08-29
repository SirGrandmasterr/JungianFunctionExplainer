#!/usr/bin/env node
/* ============================================================
   CURRENTS · i18n-check — locale files against content/en/**

   For every locale on disk (content/<xx>/, en and glossary
   excepted) this verifies, per namespace file:

     · the file exists and is canonical (sorted keys, _meta first)
     · key parity with en — nothing missing, nothing extra
     · shape parity — string↔string, object↔object, the same
       mechanism/mechanismHtml choice, provenance copied verbatim,
       `note` never present in a locale
     · placeholder parity per field — same set, none invented
     · markup rules — allowed tags only, same kind and count
     · glossary compliance — locked tokens survive, preferred
       terminology present where the English term of art is
     · a _meta block with model, digest, promptVersion, date, and
       a status (mt | flagged | reviewed) for every key

   Length bounds and the untranslated-output check are translate-
   time concerns (a `flagged` key legitimately carries English
   text) and are not re-checked here.

   Exit 1 on any problem. Node built-ins only.
   ============================================================ */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  CONTENT, TRANSLATABLE_FIELDS, readEnCorpus, loadGlossary, localesOnDisk,
  readLocaleFile, placeholdersOf, countToken, canonicalLocaleJson,
} from './i18n-lib.mjs';

const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

const STATUSES = new Set(['mt', 'flagged', 'reviewed']);
const ALLOWED_TAGS = new Set(['strong', 'em', 'br']);

function tagCounts(str) {
  const counts = Object.create(null);
  for (const m of str.matchAll(/<\s*\/?\s*([a-zA-Z0-9-]+)[^>]*>/g)) counts[m[1].toLowerCase()] = (counts[m[1].toLowerCase()] || 0) + 1;
  return counts;
}

const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function checkField(file, id, src, out, isHtml, glossary) {
  if (typeof out !== 'string') { err(file, `${id}: must be a string`); return; }
  const want = placeholdersOf(src), got = placeholdersOf(out);
  for (const n of want) if (!got.has(n)) err(file, `${id}: placeholder {${n}} missing`);
  for (const n of got) if (!want.has(n)) err(file, `${id}: placeholder {${n}} invented`);
  if (isHtml) {
    const a = tagCounts(src), b = tagCounts(out);
    for (const t of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (!ALLOWED_TAGS.has(t)) { if (b[t]) err(file, `${id}: disallowed tag <${t}>`); continue; }
      if ((a[t] || 0) !== (b[t] || 0)) err(file, `${id}: tag <${t}> count ${b[t] || 0} vs ${a[t] || 0} in en`);
    }
  } else if (out.includes('<')) err(file, `${id}: markup in a plain field`);
  for (const tok of glossary.locked) {
    const n = countToken(src, tok);
    if (n > 0 && countToken(out, tok) < n) err(file, `${id}: locked term "${tok}" lost (en has ${n}×)`);
  }
  for (const p of glossary.preferred) {
    if (!new RegExp(`\\b${escRe(p.en)}`, 'i').test(src)) continue;
    if (!out.toLowerCase().includes((p.match || p.use).toLowerCase())) {
      err(file, `${id}: glossary term "${p.en}" not rendered with "${p.use}"`);
    }
  }
}

const corpus = readEnCorpus();
const locales = localesOnDisk();

if (!locales.length) {
  console.log('i18n-check: no locales on disk — nothing to check');
  process.exit(0);
}

for (const locale of locales) {
  let glossary;
  try { glossary = loadGlossary(locale); } catch (e) { err(`content/${locale}`, e.message); continue; }

  const enRels = new Set(corpus.map((f) => f.rel));
  for (const en of corpus) {
    const file = `content/${locale}/${en.rel}`;
    const dict = readLocaleFile(locale, en.rel);
    if (!dict) { err(file, `missing — run: npm run i18n:translate -- --locale ${locale}`); continue; }

    /* canonical form */
    const raw = readFileSync(join(CONTENT, locale, en.rel), 'utf8');
    if (raw !== canonicalLocaleJson(dict)) err(file, 'not in canonical form (_meta first, sorted keys, 2-space indent, trailing newline)');

    /* _meta */
    const meta = dict._meta;
    if (!meta || typeof meta !== 'object') err(file, 'missing _meta block');
    else {
      for (const f of ['model', 'digest', 'promptVersion', 'date', 'status']) {
        if (!(f in meta)) err(file, `_meta lacks "${f}"`);
      }
    }

    /* key parity */
    const enKeys = Object.keys(en.dict);
    const locKeys = Object.keys(dict).filter((k) => k !== '_meta');
    for (const k of enKeys) if (!(k in dict)) err(file, `key "${k}" missing`);
    for (const k of locKeys) if (!(k in en.dict)) err(file, `key "${k}" not in content/en — orphan`);
    const status = meta?.status || {};
    for (const k of enKeys) {
      if (!(k in status)) err(file, `_meta.status lacks "${k}"`);
      else if (!STATUSES.has(status[k])) err(file, `_meta.status["${k}"] is "${status[k]}", not mt|flagged|reviewed`);
    }
    for (const k of Object.keys(status)) if (!(k in en.dict)) err(file, `_meta.status has orphan key "${k}"`);

    /* entries */
    for (const k of enKeys) {
      const enV = en.dict[k], v = dict[k];
      if (v === undefined) continue;
      if (typeof enV === 'string') {
        checkField(file, k, enV, v, k.endsWith('Html'), glossary);
        continue;
      }
      if (typeof v !== 'object' || v === null) { err(file, `${k}: en entry is an object, locale entry is not`); continue; }
      if ('note' in v) err(file, `${k}: "note" is authoring-only and never appears in a locale file`);
      if (v.provenance !== enV.provenance) err(file, `${k}: provenance "${v.provenance}" differs from en "${enV.provenance}"`);
      for (const f of TRANSLATABLE_FIELDS) {
        if (typeof enV[f] === 'string' && typeof v[f] !== 'string') err(file, `${k}.${f}: missing`);
        if (typeof v[f] === 'string' && typeof enV[f] !== 'string') err(file, `${k}.${f}: not present in en — orphan field`);
        if (typeof enV[f] === 'string' && typeof v[f] === 'string') {
          checkField(file, `${k}.${f}`, enV[f], v[f], f.endsWith('Html'), glossary);
        }
      }
    }
  }

  /* orphan namespace files */
  const localeDir = join(CONTENT, locale);
  const found = [];
  for (const name of readdirSync(localeDir)) {
    const p = join(localeDir, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'scenarios') { err(`content/${locale}/${name}`, 'unexpected directory'); continue; }
      for (const s of readdirSync(p)) if (s.endsWith('.json')) found.push(`scenarios/${s}`);
    } else if (name.endsWith('.json') && name !== '.state.json') {
      found.push(name);
    }
  }
  for (const rel of found) if (!enRels.has(rel)) err(`content/${locale}/${rel}`, 'no matching namespace in content/en');
}

if (errors.length) {
  console.error(`i18n-check: ${errors.length} problem${errors.length === 1 ? '' : 's'}\n`);
  for (const e of errors) console.error('  · ' + e);
  process.exit(1);
}
console.log(`i18n-check: clean — locales [${locales.join(', ')}] against ${corpus.length} en namespace file${corpus.length === 1 ? '' : 's'}`);
