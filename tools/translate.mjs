#!/usr/bin/env node
/* ============================================================
   CURRENTS · translate — content/en/** → content/<locale>/**
   via a local Ollama server.

   Local on purpose: the corpus is a few hundred KB of prose that
   is re-translated whenever the English changes, the whole run
   must be reproducible by anyone with the repo and an `ollama
   pull`, and nothing here justifies shipping the site's content
   to a paid API. Do not "improve" this into a cloud call.

   The unit of work is one field of one entry. Runs are
   deterministic (fixed seed, low temperature), incremental
   (content/<locale>/.state.json), and resumable (files are
   written after every namespace).

     node tools/translate.mjs --locale de [--model m] [--only ns]
          [--limit n] [--concurrency n] [--force] [--dry-run]
          [--review]

   Node 20 built-ins only.
   ============================================================ */
import { writeFileSync, appendFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import {
  CONTENT, TRANSLATABLE_FIELDS, sha256, readEnCorpus, unitsOfDict, loadGlossary,
  validateTranslation, uiBudget, canonicalLocaleJson, readLocaleFile,
} from './i18n-lib.mjs';

/* Bump when either the prompts OR the acceptance rules in i18n-lib change:
   together they decide what a unit translates to, so both invalidate a
   cached result. v2 = compound-aware glossary case matching;
   v3 = slot-aware UI character budgets. */
const PROMPT_VERSION = 3;
/* Separate from PROMPT_VERSION: changing how entries are reviewed must
   re-run reviews without invalidating (and re-translating) the corpus. */
const REVIEW_VERSION = 3;
const HOST = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
const DEFAULT_MODEL = 'gemma4:12b';

/* ---------------- arguments ---------------- */

/* Some npm versions swallow `--flag value` pairs even after `--` and
   re-emit them as npm_config_* environment variables (that is also why
   `npm run … -- --locale de` can arrive here as just `de`). So: accept
   --flag value AND --flag=value, treat a bare word as the locale, and
   fall back to npm_config_* for anything npm ate. `node
   tools/translate.mjs …` directly always works. */
const args = process.argv.slice(2);
const opt = { locale: null, model: process.env.OLLAMA_MODEL || DEFAULT_MODEL, only: null, limit: Infinity, concurrency: 2, force: false, dryRun: false, review: false };
for (let i = 0; i < args.length; i++) {
  let a = args[i], inline = null;
  const eq = a.indexOf('=');
  if (a.startsWith('--') && eq > 0) { inline = a.slice(eq + 1); a = a.slice(0, eq); }
  const next = () => {
    if (inline !== null) return inline;
    if (i + 1 >= args.length) die(2, `${a} needs a value`);
    return args[++i];
  };
  if (a === '--locale') opt.locale = next();
  else if (a === '--model') opt.model = next();
  else if (a === '--only') opt.only = next().split(',');
  else if (a === '--limit') opt.limit = Number(next());
  else if (a === '--concurrency') opt.concurrency = Math.max(1, Number(next()));
  else if (a === '--force') opt.force = true;
  else if (a === '--dry-run') opt.dryRun = true;
  else if (a === '--review') opt.review = true;
  else if (/^[a-z]{2,3}(-[a-zA-Z]{2,4})?$/.test(a) && !opt.locale) opt.locale = a.toLowerCase();
  else die(2, `unknown argument "${a}"\nusage: node tools/translate.mjs --locale <xx> [--model m] [--only ns,ns] [--limit n] [--concurrency n] [--force] [--dry-run] [--review]`);
}
/* npm_config_* fallbacks for flags npm consumed */
const env = process.env;
if (!opt.locale && env.npm_config_locale) opt.locale = env.npm_config_locale;
if (env.npm_config_model && opt.model === (process.env.OLLAMA_MODEL || DEFAULT_MODEL)) opt.model = env.npm_config_model;
if (!opt.only && env.npm_config_only && !['null', 'prod', 'production'].includes(env.npm_config_only)) opt.only = env.npm_config_only.split(',');
if (opt.limit === Infinity && env.npm_config_limit) opt.limit = Number(env.npm_config_limit);
if (env.npm_config_concurrency) opt.concurrency = Math.max(1, Number(env.npm_config_concurrency));
if (env.npm_config_review === 'true') opt.review = true;
if (env.npm_config_dry_run === 'true') opt.dryRun = true;
/* --force is deliberately NOT recovered from npm_config_* — it overwrites
   human-reviewed entries, so it must arrive unambiguously:
   node tools/translate.mjs --locale xx --force */
function die(code, msg) { console.error(msg); process.exit(code); }
if (!opt.locale) die(2, 'missing --locale (e.g. --locale de)');
if (opt.locale === 'en') die(2, 'content/en is the source of truth; it is never a translation target');

/* ---------------- environment checks ---------------- */

const glossary = await (async () => {
  try { return loadGlossary(opt.locale); } catch (e) { die(1, e.message); }
})();

let digest = '';
{
  let tags;
  try {
    tags = await (await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(5000) })).json();
  } catch {
    die(1, `Ollama is not reachable at ${HOST}.\n  Start it with:  ollama serve\n  (set OLLAMA_HOST if the server lives elsewhere)`);
  }
  const models = tags.models || [];
  const hit = models.find((m) => m.name === opt.model || m.model === opt.model);
  if (!hit) {
    die(1, `model "${opt.model}" is not installed on the Ollama server at ${HOST}.\n` +
           `  Install it with:  ollama pull ${opt.model}\n` +
           `  Or use one that is (--model / OLLAMA_MODEL): ${models.map((m) => m.name).join(', ') || '(none installed)'}`);
  }
  digest = hit.digest;
}

/* ---------------- prompts ---------------- */

const LANG = glossary.language;

const KIND_INSTRUCTIONS = {
  mechanism:
    `The string is a "mechanism" field: a precise, plainly-worded claim about what a cognitive function does. ` +
    `Translate the claim exactly — do not improve it, soften it, intensify it, or add emphasis the source does not have. ` +
    `Hold the length within roughly 20% of the source.`,
  figure:
    `The string is a "figure" field: a visual image describing something the site literally draws on screen. ` +
    `Make the image work in ${LANG}: rebuild the sentence if a literal rendering would sound wrong, but keep the same picture — never substitute a different image.`,
  example:
    `The string is a narrative vignette. Present tense, natural storytelling register. ` +
    `Keep names, type codes, and concrete details exactly as they are.`,
  ui:
    `The string is a short piece of UI text (label, button, caption, heading, or navigation). ` +
    `Use the natural UI register of ${LANG}.`,
  prose:
    `The string is body copy or assistive text. Translate it faithfully and idiomatically, adding nothing.`,
};

function systemPrompt(unit) {
  const lines = [
    `You translate one string of interface copy for CURRENTS, a website that teaches the eight Jungian cognitive functions, from English into ${LANG}.`,
    KIND_INSTRUCTIONS[unit.kind],
  ];
  if (unit.kind === 'ui') lines.push(`Hard limit: the translation must fit within ${uiBudget(unit.src.length, unit.key)} characters. Brevity beats completeness.`);
  lines.push(`Never translate these tokens; each must appear verbatim exactly as in the source: ${glossary.locked.join(', ')}.`);
  if (glossary.preferred.length) lines.push(`Fixed terminology (English → ${LANG}): ${glossary.preferred.map((p) => `${p.en} → ${p.use}`).join('; ')}.`);
  if (/\{[a-zA-Z]/.test(unit.src)) lines.push(`Keep every {placeholder} token exactly as written; you may move it anywhere in the sentence.`);
  if (unit.html) lines.push(`The only markup allowed is <strong>, <em>, <br> — keep the same tags in the same number as the source.`);
  lines.push(`Respond with JSON only: {"translation": "..."} — the value is the bare translated string: no commentary, no explanation, no quotation marks the source does not have.`);
  return lines.join('\n');
}

const userPrompt = (unit) => `KEY: ${unit.id}\nFIELD KIND: ${unit.kind}\nSOURCE:\n${unit.src}`;

/* ---------------- ollama ---------------- */

const T_FORMAT = { type: 'object', properties: { translation: { type: 'string' } }, required: ['translation'] };
const R_FORMAT = { type: 'object', properties: { ok: { type: 'boolean' }, issue: { type: 'string' } }, required: ['ok', 'issue'] };

const timings = [];
async function chat(messages, format) {
  const t0 = Date.now();
  const res = await fetch(`${HOST}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    signal: AbortSignal.timeout(300_000), // first call loads the model (~1–2 min cold)
    body: JSON.stringify({
      model: opt.model,
      messages,
      stream: false,
      think: false,
      format,
      /* num_predict bounds a wedged constrained decode — no field needs
         anywhere near 1024 tokens, and an orphaned request must not chew
         the GPU to the context limit */
      options: { temperature: 0.2, seed: 7, num_ctx: 4096, num_predict: 1024 },
      keep_alive: '30m',
    }),
  });
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const j = await res.json();
  timings.push(Date.now() - t0);
  if (timings.length > 20) timings.shift();
  return j.message?.content ?? '';
}

/** One transport retry (timeouts, connection drops), then propagate —
    the caller aborts the run loudly. Transport failures are never
    "flagged": a dead server is an environment problem, not review work. */
async function chatSafe(messages, format) {
  try {
    return await chat(messages, format);
  } catch (e) {
    logLine(`[transport] ${e.name || 'Error'}: ${e.message} — retrying once in 5s`);
    await new Promise((r) => setTimeout(r, 5000));
    return chat(messages, format);
  }
}

function parseTranslation(raw) {
  try {
    const j = JSON.parse(raw);
    if (typeof j.translation !== 'string') return { error: 'JSON lacks a string "translation" key' };
    const extra = Object.keys(j).filter((k) => k !== 'translation');
    if (extra.length) return { error: `unexpected JSON keys: ${extra.join(', ')}` };
    return { text: j.translation.trim() };
  } catch {
    return { error: 'response is not parseable JSON' };
  }
}

/** Translate one unit: up to 2 retries with the violations quoted back.
    Returns {status:'ok'|'flagged', text, problems, attempts}. */
async function translateUnit(unit) {
  const messages = [
    { role: 'system', content: systemPrompt(unit) },
    { role: 'user', content: userPrompt(unit) },
  ];
  let last = '', lastProblems = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const raw = await chatSafe(messages, T_FORMAT);
    const parsed = parseTranslation(raw);
    const problems = parsed.error ? [parsed.error] : validateTranslation(unit, parsed.text, glossary);
    if (!problems.length) return { status: 'ok', text: parsed.text, problems: [], attempts: attempt + 1 };
    logLine(`  [attempt ${attempt + 1}/3] ${unit.id} rejected: ${problems.join(' | ')}`);
    last = parsed.text ?? raw; lastProblems = problems;
    messages.push({ role: 'assistant', content: raw });
    messages.push({
      role: 'user',
      content: `That answer was rejected:\n${problems.map((p) => `- ${p}`).join('\n')}\n` +
               `Return corrected JSON only — {"translation": "..."} — fixing exactly these problems and changing nothing else.`,
    });
  }
  return { status: 'flagged', text: last, problems: lastProblems, attempts: 3 };
}

/* ---------------- logging ----------------
   Everything informative goes through logLine: stderr for the terminal,
   mirrored into content/<locale>/.last-run.log (overwritten per run) so
   a finished run can be read back without terminal scrollback. */

const localeDir = join(CONTENT, opt.locale);
const runLogPath = join(localeDir, '.last-run.log');
const runStart = Date.now();
let logStarted = false;
function logLine(msg) {
  const line = `+${String(Math.round((Date.now() - runStart) / 1000)).padStart(4)}s ${msg}`;
  console.error(line);
  try {
    mkdirSync(localeDir, { recursive: true });
    if (!logStarted) { writeFileSync(runLogPath, line + '\n'); logStarted = true; }
    else appendFileSync(runLogPath, line + '\n');
  } catch { /* logging must never kill the run */ }
}

/* ---------------- state ---------------- */
const statePath = join(localeDir, '.state.json');
const state = existsSync(statePath)
  ? JSON.parse(readFileSync(statePath, 'utf8'))
  : { note: 'generated by tools/translate.mjs — do not edit by hand', entries: {} };
const saveState = () => { mkdirSync(localeDir, { recursive: true }); writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n'); };

const unitFingerprint = (unit) => ({
  srcHash: sha256(`${unit.kind}\n${unit.src}`),
  model: opt.model,
  promptVersion: PROMPT_VERSION,
  glossaryHash: glossary.hash,
});
const fingerprintCurrent = (st, fp) =>
  st && st.srcHash === fp.srcHash && st.model === fp.model &&
  st.promptVersion === fp.promptVersion && st.glossaryHash === fp.glossaryHash;

/* ---------------- work planning ---------------- */

const corpus = readEnCorpus().filter((f) => !opt.only || opt.only.includes(f.ns));
if (!corpus.length) die(2, `--only ${opt.only?.join(',')} matches no namespace under content/en/`);

const plan = []; // {en, units: workUnits, allUnits, existing, reviewedKeys, staleReviewed}
let planned = 0;
for (const en of corpus) {
  const existing = readLocaleFile(opt.locale, en.rel) || {};
  const reviewedKeys = new Set(Object.entries(existing._meta?.status || {}).filter(([, s]) => s === 'reviewed').map(([k]) => k));
  const allUnits = unitsOfDict(en.dict);
  const staleReviewed = [];
  const work = [];
  for (const unit of allUnits) {
    const fp = unitFingerprint(unit);
    const st = state.entries[unit.id];
    if (reviewedKeys.has(unit.key) && !opt.force) {
      if (st && st.srcHash !== fp.srcHash) staleReviewed.push(unit.id);
      continue;
    }
    const existingText = unit.field === null
      ? (typeof existing[unit.key] === 'string' ? existing[unit.key] : undefined)
      : (typeof existing[unit.key]?.[unit.field] === 'string' ? existing[unit.key][unit.field] : undefined);
    /* A unit is done if its fingerprint is current AND its text survives
       somewhere — the written locale file, or the state's crash cache
       (an interrupted run persists state mid-namespace, file at the end).
       This holds for `flagged` units too, deliberately: a no-op re-run
       must make zero model calls. Any real change — source, model,
       glossary, or PROMPT_VERSION (which covers the acceptance rules) —
       moves the fingerprint and retries them; `--force` does it on
       demand. */
    if (!opt.force && fingerprintCurrent(st, fp) && (existingText !== undefined || typeof st.text === 'string')) continue;
    if (planned < opt.limit) { work.push(unit); planned++; }
  }
  plan.push({ en, units: work, allUnits, existing, reviewedKeys, staleReviewed });
}

/* ---------------- progress ---------------- */

const totalWork = plan.reduce((n, p) => n + p.units.length, 0);
let done = 0, flaggedCount = 0, verbatimCount = 0;
const t0 = Date.now();
function progress(label) {
  const avg = timings.length ? timings.reduce((a, b) => a + b, 0) / timings.length : 0;
  const remaining = totalWork - done;
  const eta = avg && remaining ? ` · ETA ${Math.ceil((remaining * avg) / opt.concurrency / 1000 / 60)}m` : '';
  logLine(`[${opt.locale} ${done}/${totalWork}] ${label}${avg ? ` · ${(avg / 1000).toFixed(1)}s/call` : ''}${eta}`);
}

/* ---------------- startup banner ---------------- */

if (!opt.dryRun) {
  logLine(`translate.mjs · locale ${opt.locale} (${LANG}) · model ${opt.model} (${digest.slice(0, 12)}…) · ${HOST}`);
  logLine(`prompt v${PROMPT_VERSION} · glossary ${glossary.hash.slice(0, 8)} · concurrency ${opt.concurrency}${opt.force ? ' · FORCE' : ''}${opt.review ? ' · REVIEW MODE' : ''}`);
  for (const p of plan) {
    logLine(`plan: ${p.en.ns} — ${p.units.length}/${p.allUnits.length} units to translate` +
      (p.reviewedKeys.size ? ` (${p.reviewedKeys.size} human-reviewed keys untouched)` : ''));
  }
  if (!opt.review) logLine(`total ${totalWork} units · expect roughly ${Math.ceil(totalWork * 5 / 60)}m warm (first call adds ~1–2m model load)`);
}

/* ---------------- dry run ---------------- */

if (opt.dryRun && !opt.review) {
  for (const p of plan) {
    console.log(`${p.en.ns}: ${p.units.length} of ${p.allUnits.length} units need translation` +
      (p.reviewedKeys.size ? ` (${p.reviewedKeys.size} keys human-reviewed, untouched)` : ''));
    for (const u of p.units) console.log(`  · ${u.id} [${u.kind}]`);
  }
  console.log(`total: ${totalWork} model-visiting units`);
  process.exit(0);
}

/* ---------------- concurrency pool ---------------- */

async function pool(items, worker) {
  const queue = [...items];
  const runners = Array.from({ length: Math.min(opt.concurrency, queue.length) }, async () => {
    while (queue.length) await worker(queue.shift());
  });
  try {
    await Promise.all(runners);
  } catch (e) {
    /* transport gave up (chatSafe already retried): save progress and
       fail loudly — never a partial-write mystery, never a fallback */
    saveState();
    die(1, `Ollama at ${HOST} stopped answering mid-run (${e.name || 'Error'}: ${e.message}).\n` +
           `Progress is saved in content/${opt.locale}/.state.json — re-run the same command to resume.\n` +
           `Check that "ollama serve" is still up.`);
  }
}

/* ---------------- translate mode ---------------- */

if (!opt.review) {
  for (const p of plan) {
    if (!p.units.length) { logLine(`[${opt.locale}] ${p.en.ns}: unchanged — no calls, no write`); continue; }
    const results = Object.create(null); // id → {status, text, problems}

    await pool(p.units, async (unit) => {
      const fp = unitFingerprint(unit);
      if (unit.kind === 'verbatim') {
        results[unit.id] = { status: 'verbatim', text: unit.src, problems: [] };
        state.entries[unit.id] = { ...fp, status: 'verbatim', at: new Date().toISOString() };
        verbatimCount++; done++;
        progress(`verbatim ${unit.id}`);
        return;
      }
      const r = await translateUnit(unit);
      results[unit.id] = r;
      state.entries[unit.id] = {
        ...fp, status: r.status, at: new Date().toISOString(),
        ...(r.status === 'flagged'
          ? { problems: r.problems, attempt: r.text }
          : { text: r.text }), // crash cache — stripped once the namespace file is written
      };
      if (r.status === 'flagged') flaggedCount++;
      done++;
      if (done % 10 === 0) saveState(); // an interrupt loses at most ~10 units
      progress(`${r.status === 'ok' ? 'ok     ' : 'FLAGGED'} ${unit.id}${r.attempts > 1 ? ` (${r.attempts} attempts)` : ''}`);
    });

    /* assemble the locale namespace: translated units where we have them,
       the existing locale text where we don't, English for flagged units */
    const out = {};
    const status = {};
    for (const key of Object.keys(p.en.dict).sort()) {
      const enV = p.en.dict[key];
      const resolve = (unit) => {
        const r = results[unit.id];
        if (r) return r.status === 'flagged' ? unit.src : r.text;
        const prev = unit.field === null ? p.existing[unit.key] : p.existing[unit.key]?.[unit.field];
        if (typeof prev === 'string') return prev;
        const st = state.entries[unit.id];
        if (st?.status === 'ok' && typeof st.text === 'string') return st.text; // crash cache
        return unit.src; // reviewed-key unit missing from disk, or never translated
      };
      let keyFlagged = false;
      const markFlag = (unit) => { if (results[unit.id]?.status === 'flagged' || state.entries[unit.id]?.status === 'flagged') keyFlagged = true; };
      if (typeof enV === 'string') {
        const unit = p.allUnits.find((u) => u.id === key);
        out[key] = resolve(unit); markFlag(unit);
      } else {
        const o = {};
        for (const f of TRANSLATABLE_FIELDS.slice().sort()) {
          if (typeof enV[f] !== 'string') continue;
          const unit = p.allUnits.find((u) => u.id === `${key}#${f}`);
          o[f] = resolve(unit); markFlag(unit);
        }
        if (typeof enV.provenance === 'string') o.provenance = enV.provenance;
        out[key] = Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)));
      }
      status[key] = p.reviewedKeys.has(key) && !opt.force ? 'reviewed' : keyFlagged ? 'flagged' : 'mt';
    }
    out._meta = {
      model: opt.model,
      digest,
      promptVersion: PROMPT_VERSION,
      date: new Date().toISOString().slice(0, 10),
      status,
    };
    const target = join(localeDir, p.en.rel);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, canonicalLocaleJson(out));
    /* the file now holds the texts — strip the crash cache so the state
       diff stays lean (flagged units keep `attempt` for _review.md) */
    for (const unit of p.allUnits) {
      const st = state.entries[unit.id];
      if (st && st.status !== 'flagged') delete st.text;
    }
    saveState();
    logLine(`[${opt.locale}] wrote content/${opt.locale}/${p.en.rel} (${p.units.length} units this run)`);
  }
}

/* ---------------- review mode ---------------- */

if (opt.review) {
  const BACK_SYS = `You translate ${LANG} to English. Respond with JSON only: {"translation": "..."} — the bare English translation, nothing else.`;
  /* The judge sees only English (source vs back-translation), so it cannot
     tell a genuine error from an artifact of the round trip. Two things it
     must be told, or it spends its flags on the pipeline's own rules:
       · the glossary — "Gitter" is the REQUIRED rendering of "lattice",
         so its coming back as "grid" is compliance, not drift;
       · that a synonym is not a defect — only a changed concept is. */
  const JUDGE_SYS =
    `You are a translation QA reviewer for a website about Jungian cognitive functions. ` +
    `You get an English SOURCE and an English BACK-TRANSLATION of its ${LANG} rendering. ` +
    `Judge only whether MEANING survived — you are not scoring word choice.\n` +
    `Set ok=false when: a claim is lost, added, reversed, hedged, or distorted; a hypothetical became an assertion; ` +
    `a visual image turned into a different image; a concrete detail (name, number, type code) changed.\n` +
    `Set ok=true when the difference is only wording. A back-translation returning a synonym, a near-synonym, or a ` +
    `more generic word for the same concept is EXPECTED — translating twice never returns the original words. ` +
    `Single words and short labels round-trip loosely; judge them by concept, not by vocabulary.\n` +
    `You are comparing two ENGLISH texts. You cannot see the ${LANG} translation itself, so never state or guess which ` +
    `${LANG} words it used, and never report a glossary violation — a separate check already enforces the glossary and it passed.\n` +
    (glossary.preferred.length
      ? `In particular these concepts have fixed ${LANG} renderings that come back as different English words — ` +
        `${glossary.preferred.map((p) => `"${p.en}"`).join(', ')} — so seeing any of them return as a synonym, a near-word, or a ` +
        `more generic term is expected and is never an issue.\n`
      : '') +
    `Respond with JSON only: {"ok": true/false, "issue": "one short sentence naming the lost or changed meaning, empty when ok"}.`;

  const reviewWork = [];
  for (const p of plan) {
    for (const unit of p.allUnits) {
      if (p.reviewedKeys.has(unit.key)) continue;
      const st = state.entries[unit.id];
      if (!st || st.status !== 'ok') continue;                    // flagged/verbatim: nothing to review
      const text = unit.field === null ? p.existing[unit.key] : p.existing[unit.key]?.[unit.field];
      if (typeof text !== 'string') continue;
      /* A review describes one specific translation, so it is stale the
         moment that text changes — which a glossary edit does without
         touching the English at all. Keying this on the source hash left
         _review.md quietly describing a translation that no longer
         existed, so key it on the translated text itself. */
      if (st.review && st.review.textHash === sha256(text) && st.review.v === REVIEW_VERSION && !opt.force) continue;
      reviewWork.push({ unit, st, text });
    }
  }

  if (opt.dryRun) {
    for (const w of reviewWork) console.log(`  · ${w.unit.id} [${w.unit.kind}]`);
    console.log(`total: ${reviewWork.length} units to review (2 calls each)`);
    process.exit(0);
  }

  let rdone = 0, rflagged = 0;
  await pool(reviewWork, async ({ unit, st, text }) => {
    const backRaw = await chatSafe([{ role: 'system', content: BACK_SYS }, { role: 'user', content: text }], T_FORMAT);
    const back = parseTranslation(backRaw).text ?? '';
    const verdictRaw = await chatSafe([
      { role: 'system', content: JUDGE_SYS },
      { role: 'user', content: `FIELD KIND: ${unit.kind}\nSOURCE:\n${unit.src}\nBACK-TRANSLATION:\n${back}` },
    ], R_FORMAT);
    let verdict;
    try { verdict = JSON.parse(verdictRaw); } catch { verdict = { ok: false, issue: 'review call returned unparseable JSON' }; }
    st.review = { textHash: sha256(text), v: REVIEW_VERSION, ok: !!verdict.ok, issue: String(verdict.issue || ''), back, at: new Date().toISOString() };
    if (!verdict.ok) rflagged++;
    rdone++;
    logLine(`[review ${opt.locale} ${rdone}/${reviewWork.length}] ${verdict.ok ? 'ok     ' : 'FLAGGED'} ${unit.id}`);
    if (rdone % 20 === 0) saveState();
  });
  saveState();
  logLine(`review: ${rdone} units reviewed, ${rflagged} flagged`);
}

/* ---------------- _review.md — the file a human actually reads ----------------
   Always regenerated from the FULL corpus and current state, regardless of
   --only: a run scoped to one namespace must not drop the findings of the
   others from the report. */

{
  const valFail = [], revFail = [], stale = [];
  for (const en of readEnCorpus()) {
    const existing = readLocaleFile(opt.locale, en.rel) || {};
    const reviewedKeys = new Set(Object.entries(existing._meta?.status || {}).filter(([, s]) => s === 'reviewed').map(([k]) => k));
    for (const unit of unitsOfDict(en.dict)) {
      const st = state.entries[unit.id];
      if (!st) continue;
      const fresh = st.srcHash === sha256(`${unit.kind}\n${unit.src}`);
      if (reviewedKeys.has(unit.key)) {
        if (!fresh) stale.push(unit.id);
        continue;
      }
      const text = unit.field === null ? existing[unit.key] : existing[unit.key]?.[unit.field];
      if (st.status === 'flagged') valFail.push({ unit, st });
      else if (st.status === 'ok' && st.review && !st.review.ok) revFail.push({ unit, st, text });
    }
  }
  const esc = (s) => String(s ?? '').replace(/\n/g, '\n  ');
  const lines = [
    `# ${LANG} (${opt.locale}) — machine translation review`,
    ``,
    `Generated by tools/translate.mjs · model ${opt.model} · prompt v${PROMPT_VERSION} · ${new Date().toISOString().slice(0, 10)}`,
    ``,
    `Worst first. To promote an entry: fix the text in the locale file if needed, set its`,
    `key to "reviewed" in that file's \`_meta.status\`, and re-run the pipeline — reviewed`,
    `keys are never overwritten without \`--force\`.`,
    ``,
    `## Failed validation — shipped as English, needs a human (${valFail.length})`,
    ``,
  ];
  for (const { unit, st } of valFail) {
    lines.push(`### ${unit.id} \`[${unit.kind}]\``, ``,
      `- why: ${st.problems?.join('; ') || 'unknown'}`,
      `- source: ${esc(unit.src)}`,
      `- last attempt: ${esc(st.attempt)}`, ``);
  }
  if (!valFail.length) lines.push(`(none)`, ``);
  lines.push(`## Review flags — shipped as ${LANG}, meaning may have drifted (${revFail.length})`, ``);
  for (const { unit, st, text } of revFail) {
    lines.push(`### ${unit.id} \`[${unit.kind}]\``, ``,
      `- issue: ${st.review.issue}`,
      `- source: ${esc(unit.src)}`,
      `- translation: ${esc(text)}`,
      `- back-translation: ${esc(st.review.back)}`, ``);
  }
  if (!revFail.length) lines.push(`(none)`, ``);
  if (stale.length) {
    lines.push(`## Stale human reviews — the English changed after review (${stale.length})`, ``);
    for (const id of stale) lines.push(`- ${id} — re-translate with \`--force\` or re-edit and keep the reviewed mark`);
    lines.push(``);
  }
  if (!opt.dryRun && (plan.some((p) => p.units.length) || opt.review)) {
    mkdirSync(localeDir, { recursive: true });
    writeFileSync(join(localeDir, '_review.md'), lines.join('\n') + '\n');
  }
}

/* ---------------- summary ---------------- */

const mins = ((Date.now() - t0) / 60000).toFixed(1);
if (!opt.review) {
  logLine(`done: ${done} units (${verbatimCount} verbatim, ${flaggedCount} flagged) in ${mins}m` +
    (totalWork === 0 ? ' — nothing to do, no model calls made' : ''));
}
if (flaggedCount) process.exitCode = 0; // flags are review work, not failure
