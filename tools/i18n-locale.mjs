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

const HERE = join(fileURLToPath(import.meta.url), '..');
const argv = process.argv.slice(2);

const skipReview = argv.includes('--no-review');
const forwarded = argv.filter((a) => a !== '--no-review');

/* --locale is the only flag this wrapper reads itself; it accepts the
   same forms translate.mjs does so the two never disagree. */
const locale = (() => {
  for (let i = 0; i < forwarded.length; i++) {
    const a = forwarded[i];
    if (a === '--locale') return forwarded[i + 1];
    if (a.startsWith('--locale=')) return a.slice('--locale='.length);
    if (/^[a-z]{2,3}(-[a-zA-Z]{2,4})?$/.test(a)) return a;
  }
  return process.env.npm_config_locale || null;
})();
if (!locale) {
  console.error('usage: npm run i18n:locale -- --locale <xx> [--no-review] [translate.mjs flags…]');
  process.exit(2);
}

const steps = [
  { name: `translate ${locale}`, args: ['translate.mjs', ...forwarded] },
  ...(skipReview ? [] : [{ name: `review ${locale}`, args: ['translate.mjs', ...forwarded, '--review'] }]),
  { name: 'i18n-check (all locales)', args: ['i18n-check.mjs'] },
];

for (const [i, step] of steps.entries()) {
  console.error(`\n━━ step ${i + 1}/${steps.length} · ${step.name} ━━`);
  const r = spawnSync(process.execPath, [join(HERE, step.args[0]), ...step.args.slice(1)], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error(`\ni18n-locale: "${step.name}" failed (exit ${r.status}) — stopping here.`);
    process.exit(r.status || 1);
  }
}

console.error(
  `\ni18n-locale: ${locale} complete.\n` +
  `  · read content/${locale}/_review.md before trusting the copy\n` +
  `  · the language switcher picks it up on the next \`npm run build\``
);
