#!/usr/bin/env node
/* ============================================================
   CURRENTS · i18n-locale — the whole pipeline for one language

   Runs translate → review → check in sequence and stops at the
   first hard failure, so adding a language is one command and
   one glossary file:

     npm run i18n:locale -- --locale es

   Every flag after --locale is forwarded to translate.mjs
   (--model, --only, --limit, --concurrency, --force, --dry-run),
   so this is a convenience wrapper, never a second code path.
   Pass --no-review to translate and check without the (slower)
   back-translation pass.

   Node built-ins only.
   ============================================================ */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allLocales } from './i18n-lib.mjs';

const HERE = join(fileURLToPath(import.meta.url), '..');
const argv = process.argv.slice(2);

const skipReview = argv.includes('--no-review');
const cleanArgv = argv.filter((a) => a !== '--no-review');

let specifiedLocale = null;
const otherFlags = [];

for (let i = 0; i < cleanArgv.length; i++) {
  const a = cleanArgv[i];
  if (a === '--locale') {
    specifiedLocale = cleanArgv[++i];
  } else if (a.startsWith('--locale=')) {
    specifiedLocale = a.slice('--locale='.length);
  } else if (a === '--all') {
    specifiedLocale = 'all';
  } else if (/^[a-z]{2,3}(-[a-zA-Z]{2,4})?$/.test(a) && !specifiedLocale) {
    specifiedLocale = a;
  } else {
    otherFlags.push(a);
  }
}

if (!specifiedLocale && process.env.npm_config_locale) {
  specifiedLocale = process.env.npm_config_locale;
}

const targetLocales = (!specifiedLocale || specifiedLocale === 'all')
  ? allLocales()
  : [specifiedLocale];

if (!targetLocales.length) {
  console.error('i18n-locale: no target locales found. Create a glossary in content/glossary/<locale>.json');
  process.exit(2);
}

for (const loc of targetLocales) {
  const steps = [
    { name: `translate ${loc}`, args: ['translate.mjs', '--locale', loc, ...otherFlags] },
    ...(skipReview ? [] : [{ name: `review ${loc}`, args: ['translate.mjs', '--locale', loc, ...otherFlags, '--review'] }]),
  ];

  for (const [i, step] of steps.entries()) {
    console.error(`\n━━ step ${i + 1}/${steps.length} · ${step.name} ━━`);
    const r = spawnSync(process.execPath, [join(HERE, step.args[0]), ...step.args.slice(1)], { stdio: 'inherit' });
    if (r.status !== 0) {
      console.error(`\ni18n-locale: "${step.name}" failed (exit ${r.status}) — stopping here.`);
      process.exit(r.status || 1);
    }
  }
}

if (!argv.includes('--dry-run')) {
  console.error(`\n━━ i18n-check (all locales) ━━`);
  const r = spawnSync(process.execPath, [join(HERE, 'i18n-check.mjs')], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\ni18n-locale: i18n-check failed (exit ${r.status}) — stopping here.`);
    process.exit(r.status || 1);
  }
}

console.error(
  `\ni18n-locale: pipeline complete for [${targetLocales.join(', ')}].\n` +
  `  · read content/<locale>/_review.md before trusting the copy\n` +
  `  · the language switcher picks it up on the next \`npm run build\``
);
