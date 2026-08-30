#!/usr/bin/env node
/* ============================================================
   CURRENTS · copy-sync — the content map's enforcement tool

   The inline English in the twelve HTML files is the render
   source; content/en/** is the authority; this tool keeps them
   identical and keeps the map inside its own rules
   (content/SCHEMA.md).

     --check   fail (exit 1) on any of:
               · inline English disagreeing with the map
               · a data-copy key missing from the map
               · a map key nothing reads (HTML or JS)
               · a template placeholder with no matching call site
               · an entry violating SCHEMA.md (shape, provenance,
                 banned vocabulary in mechanism, markup rules,
                 sorted-key formatting)
     --write   regenerate the inline English from the map and
               normalize the JSON formatting

   Node built-ins only.
   ============================================================ */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
const CONTENT_DIR = join(ROOT, 'content', 'en');

const PAGE_DIRS = ['ti', 'fi', 'te', 'fe', 'ne', 'ni', 'se', 'si', 'energy', 'phenomena', 'playground'];
const HTML_FILES = ['index.html', ...PAGE_DIRS.map((d) => `${d}/index.html`)];
const JS_SCAN_DIRS = ['src', ...PAGE_DIRS];
const JS_SKIP = [join('src', 'engines')]; // engines hold no copy and stay untouched

const PROVENANCE = new Set(['jung', 'myers', 'quenk', 'beebe', 'grant', 'community', 'currents']);
const OBJ_REQUIRED = ['figure', 'provenance'];
const OBJ_OPTIONAL = ['mechanism', 'mechanismHtml', 'example', 'note', 'title', 'kind', 'pair', 'warn'];
const BANNED_IN_MECHANISM = /\b(energy|energies|current|currents|watershed|watersheds|chamber|chambers|lattice|lattices)\b/i;
const ALLOWED_HTML = /<\/?(strong|em|br)\s*\/?>/g;
const PLACEHOLDER = /\{([a-zA-Z][a-zA-Z0-9]*)\}/g;

const MODE = process.argv.includes('--write') ? 'write' : process.argv.includes('--check') ? 'check' : null;
if (!MODE) {
  console.error('usage: node tools/copy-sync.mjs --check | --write');
  process.exit(2);
}

const errors = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);

/* ---------------- 1 · load and validate the map ---------------- */

function contentFiles() {
  const out = [];
  if (!existsSync(CONTENT_DIR)) return out;
  for (const name of readdirSync(CONTENT_DIR)) {
    const p = join(CONTENT_DIR, name);
    if (statSync(p).isDirectory()) {
      if (name !== 'scenarios') continue;
      for (const s of readdirSync(p)) {
        if (s.endsWith('.json')) out.push({ path: join(p, s), prefix: `scenario.${basename(s, '.json')}.` });
      }
    } else if (name.endsWith('.json')) {
      out.push({ path: p, prefix: `${basename(name, '.json')}.` });
    }
  }
  return out;
}

const MAP = Object.create(null);         // key → entry
const KEY_FILE = Object.create(null);    // key → source file (for messages)

function placeholdersOf(str) {
  const names = new Set();
  for (const m of str.matchAll(PLACEHOLDER)) names.add(m[1]);
  return names;
}

function checkHtmlField(file, key, val) {
  const stripped = val.replace(ALLOWED_HTML, '');
  if (stripped.includes('<')) err(file, `${key}: markup beyond <strong> <em> <br> in an Html field`);
}

function validateEntry(file, key, val) {
  if (!/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9-]+)+$/.test(key)) err(file, `${key}: malformed key`);
  if (typeof val === 'string') {
    if (key.endsWith('Html')) checkHtmlField(file, key, val);
    else if (val.includes('<')) err(file, `${key}: markup in a plain string (use an *Html key)`);
    return;
  }
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    return err(file, `${key}: entry must be a string or a description object`);
  }
  for (const f of Object.keys(val)) {
    if (!OBJ_REQUIRED.includes(f) && !OBJ_OPTIONAL.includes(f)) err(file, `${key}: unknown field "${f}"`);
    if (typeof val[f] !== 'string') err(file, `${key}.${f}: must be a string`);
  }
  for (const f of OBJ_REQUIRED) if (!(f in val)) err(file, `${key}: missing required field "${f}"`);
  const hasMech = 'mechanism' in val, hasMechHtml = 'mechanismHtml' in val;
  if (hasMech === hasMechHtml) err(file, `${key}: exactly one of mechanism/mechanismHtml required`);
  if (val.provenance && !PROVENANCE.has(val.provenance)) {
    err(file, `${key}: provenance "${val.provenance}" not in {${[...PROVENANCE].join(' | ')}}`);
  }
  for (const f of ['mechanism', 'mechanismHtml']) {
    const m = val[f] && val[f].match(BANNED_IN_MECHANISM);
    if (m) err(file, `${key}.${f}: banned figurative vocabulary in mechanism ("${m[0]}")`);
  }
  if (val.mechanismHtml) checkHtmlField(file, key + '.mechanismHtml', val.mechanismHtml);
  for (const f of ['mechanism', 'figure', 'example', 'title', 'kind', 'pair', 'warn']) {
    if (val[f] && val[f].includes('<')) err(file, `${key}.${f}: markup in a plain field`);
    if (val[f] && placeholdersOf(val[f]).size) err(file, `${key}.${f}: placeholders are not allowed in description fields`);
  }
}

for (const { path, prefix } of contentFiles()) {
  const rel = relative(ROOT, path);
  const raw = readFileSync(path, 'utf8');
  let dict;
  try { dict = JSON.parse(raw); } catch (e) { err(rel, `invalid JSON — ${e.message}`); continue; }
  const keys = Object.keys(dict);
  for (const k of keys) {
    if (!k.startsWith(prefix)) err(rel, `${k}: key does not start with namespace prefix "${prefix}"`);
    if (k in MAP) err(rel, `${k}: duplicate key (also in ${KEY_FILE[k]})`);
    MAP[k] = dict[k];
    KEY_FILE[k] = rel;
    validateEntry(rel, k, dict[k]);
  }
  const canonical = JSON.stringify(Object.fromEntries(keys.slice().sort().map((k) => [k, dict[k]])), null, 2) + '\n';
  if (raw !== canonical) {
    if (MODE === 'write') { writeFileSync(path, canonical); console.log(`formatted ${rel}`); }
    else err(rel, 'not in canonical form (sorted keys, 2-space indent, trailing newline) — run copy:write');
  }
}

/* ---------------- 2 · HTML: data-copy nodes vs the map ---------------- */

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const usedKeys = new Set();
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const norm = (s) => decode(s).replace(/\s+/g, ' ').trim();
const TOKEN_EL = /<([a-zA-Z0-9-]+)\b[^>]*?data-copy-token="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g;

/** Locate the element around the data-copy attribute at attrIdx.
    Returns tag geometry and inner content, or null on parse failure. */
function elementAt(html, attrIdx) {
  const tagStart = html.lastIndexOf('<', attrIdx);
  const tagEnd = html.indexOf('>', attrIdx);
  if (tagStart < 0 || tagEnd < 0) return null;
  const tag = (html.slice(tagStart + 1, tagEnd).match(/^([a-zA-Z0-9-]+)/) || [])[1];
  if (!tag) return null;
  if (VOID_TAGS.has(tag.toLowerCase()) || html[tagEnd - 1] === '/') {
    return { tag, tagStart, tagEnd, innerStart: -1, innerEnd: -1, inner: null };
  }
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = tagEnd + 1;
  let depth = 1, m;
  while ((m = re.exec(html))) {
    depth += m[0][0] === '<' && m[0][1] === '/' ? -1 : 1;
    if (depth === 0) {
      return { tag, tagStart, tagEnd, innerStart: tagEnd + 1, innerEnd: m.index, inner: html.slice(tagEnd + 1, m.index) };
    }
  }
  return null;
}

for (const rel of HTML_FILES) {
  const path = join(ROOT, rel);
  if (!existsSync(path)) continue;
  let html = readFileSync(path, 'utf8');

  /* text nodes — process matches back-to-front so --write splices stay valid */
  const matches = [...html.matchAll(/\bdata-copy="([^"]+)"/g)].reverse();
  for (const m of matches) {
    const key = m[1];
    usedKeys.add(key);
    const entry = MAP[key];
    if (entry === undefined) { err(rel, `data-copy key "${key}" missing from the map`); continue; }
    if (typeof entry !== 'string') { err(rel, `data-copy key "${key}" is a description object; only plain/Html strings render via data-copy`); continue; }
    const el = elementAt(html, m.index);
    if (!el) { err(rel, `could not parse element for data-copy="${key}"`); continue; }
    if (el.inner === null) { err(rel, `data-copy="${key}" on a void element — use data-copy-attrs`); continue; }

    const tokens = {};                                 // token name → original markup
    const templated = el.inner.replace(TOKEN_EL, (whole, _t, name) => { tokens[name] = whole; return `{${name}}`; });
    const isHtml = key.endsWith('Html');
    if (!isHtml && templated.includes('<')) { err(rel, `data-copy="${key}": unexpected markup inside a plain-key element`); continue; }

    const want = placeholdersOf(entry);
    for (const name of want) if (!(name in tokens)) err(rel, `data-copy="${key}": no data-copy-token="${name}" child for placeholder {${name}}`);
    for (const name of Object.keys(tokens)) if (!want.has(name)) err(rel, `data-copy="${key}": token "${name}" has no {${name}} in the map value`);

    if (norm(templated) !== norm(entry)) {
      if (MODE === 'write') {
        const replacement = entry.replace(PLACEHOLDER, (whole, name) => tokens[name] || whole);
        html = html.slice(0, el.innerStart) + replacement + html.slice(el.innerEnd);
      } else {
        err(rel, `inline English for "${key}" disagrees with the map\n    html: ${norm(templated)}\n    map:  ${norm(entry)}`);
      }
    }
  }

  /* attributes */
  const attrMatches = [...html.matchAll(/\bdata-copy-attrs="([^"]+)"/g)].reverse();
  for (const m of attrMatches) {
    const tagEnd = html.indexOf('>', m.index);
    const tagStart = html.lastIndexOf('<', m.index);
    let tagText = html.slice(tagStart, tagEnd + 1);
    for (const pair of m[1].split(',')) {
      const i = pair.indexOf(':');
      const attr = pair.slice(0, i).trim(), key = pair.slice(i + 1).trim();
      usedKeys.add(key);
      const entry = MAP[key];
      if (typeof entry !== 'string') { err(rel, `data-copy-attrs key "${key}" missing from the map or not a string`); continue; }
      const am = tagText.match(new RegExp(`\\b${attr}="([^"]*)"`));
      if (!am) { err(rel, `data-copy-attrs: no ${attr}="…" on the element for "${key}"`); continue; }
      if (placeholdersOf(entry).size) { err(rel, `data-copy-attrs key "${key}": placeholders are not supported in attributes`); continue; }
      if (norm(am[1]) !== norm(entry)) {
        if (MODE === 'write') tagText = tagText.replace(am[0], `${attr}="${entry}"`);
        else err(rel, `attribute ${attr} for "${key}" disagrees with the map\n    html: ${norm(am[1])}\n    map:  ${norm(entry)}`);
      }
    }
    if (MODE === 'write') html = html.slice(0, tagStart) + tagText + html.slice(tagEnd + 1);
  }

  if (MODE === 'write') {
    const orig = readFileSync(path, 'utf8');
    if (html !== orig) { writeFileSync(path, html); console.log(`rewrote ${rel}`); }
  }
}

/* ---------------- 3 · JS: t()/tx() call sites ---------------- */

function* jsFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = relative(ROOT, p);
    if (JS_SKIP.some((s) => rel === s || rel.startsWith(s + '\\') || rel.startsWith(s + '/'))) continue;
    if (statSync(p).isDirectory()) yield* jsFiles(p);
    else if (name.endsWith('.js') || name.endsWith('.mjs')) yield p;
  }
}

/** From `t(` at callIdx, return the argument span up to the balanced `)`. */
function callSpan(src, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')' && --depth === 0) return src.slice(openIdx + 1, i);
  }
  return '';
}

const jsPrefixes = new Set();
const jsCalls = Object.create(null);   // key → [{file, args}]

for (const dir of JS_SCAN_DIRS) {
  const abs = join(ROOT, dir);
  if (!existsSync(abs)) continue;
  for (const p of jsFiles(abs)) {
    const rel = relative(ROOT, p);
    const src = readFileSync(p, 'utf8');
    for (const m of src.matchAll(/\btx?\(\s*(['"`])/g)) {
      const openIdx = m.index + m[0].indexOf('(');
      const args = callSpan(src, openIdx);
      const q = m[1];
      const lit = args.match(q === '`' ? /^\s*`([^`]*)`/ : new RegExp(`^\\s*${q}([^${q}]*)${q}`));
      if (!lit) continue;
      const keyText = lit[1];
      if (q === '`' && keyText.includes('${')) {
        const prefix = keyText.slice(0, keyText.indexOf('${'));
        if (prefix.includes('.')) jsPrefixes.add(prefix);
        continue;
      }
      if (!/^[a-z][a-zA-Z0-9]*\./.test(keyText)) continue;   // not a copy key
      (jsCalls[keyText] ||= []).push({ file: rel, args });
    }
  }
}

for (const [key, sites] of Object.entries(jsCalls)) {
  const entry = MAP[key];
  if (entry === undefined) { for (const s of sites) err(s.file, `JS references missing key "${key}"`); continue; }
  usedKeys.add(key);
  if (typeof entry === 'string') {
    for (const name of placeholdersOf(entry)) {
      for (const s of sites) {
        const rest = s.args.replace(/^\s*(['"`])[^'"`]*\1\s*/, '');
        if (!rest.startsWith(',')) { err(s.file, `t('${key}') passes no vars but the map value needs {${name}}`); continue; }
        if (/^\s*,\s*\{/.test(rest) && !new RegExp(`[{,\\s]${name}\\s*[:,}]`).test(rest)) {
          err(s.file, `t('${key}', …) does not supply {${name}}`);
        }
      }
    }
  }
}
for (const prefix of jsPrefixes) {
  const hits = Object.keys(MAP).filter((k) => k.startsWith(prefix));
  if (!hits.length) err('(js scan)', `dynamic key prefix "${prefix}…" matches nothing in the map`);
  for (const k of hits) usedKeys.add(k);
}

/* ---------------- 4 · unused keys ---------------- */

for (const key of Object.keys(MAP)) {
  if (!usedKeys.has(key)) err(KEY_FILE[key], `map key "${key}" is unused (no data-copy node, no t()/tx() call)`);
}

/* ---------------- report ---------------- */

if (errors.length) {
  console.error(`copy-sync: ${errors.length} problem${errors.length === 1 ? '' : 's'}\n`);
  for (const e of errors) console.error('  · ' + e);
  process.exit(1);
}
console.log(`copy-sync: clean — ${Object.keys(MAP).length} keys across ${contentFiles().length} namespace files`);
