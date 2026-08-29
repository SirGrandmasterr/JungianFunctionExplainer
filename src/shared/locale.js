/* ============================================================
   CURRENTS · Locale bootstrap

   Resolution order: ?lang= → localStorage → navigator.language
   → en. English loads nothing and touches nothing — the inline
   English in the HTML is already the render source (copy.js).

   Non-English pages await initLocale() BEFORE any init code
   runs (every page entry does this), so zones that build their
   DOM at init — the stack rail, the field notes, the Playground
   panels — are born translated; there is no refresh() path.
   Switching languages persists the choice and reloads.

   Locale JSON ships through the Vite build as lazy glob imports
   rather than public/ files: the chunks get content hashes (no
   stale-cache problem), a missing locale fails loudly at build
   time instead of 404ing behind nginx's SPA fallback, and no
   fetch path has to survive both `vite build` and the Docker
   setup. See docs/i18n.md.
   ============================================================ */
import { registerLocaleCopy, applyCopy, t } from './copy.js';

const LOCALE_FILES = import.meta.glob([
  '../../content/*/*.json',
  '../../content/*/scenarios/*.json',
]);

const STORAGE_KEY = 'currents.lang';

/** Locales with content on disk, 'en' and non-locale dirs excluded. */
export function availableLocales() {
  const out = new Set();
  for (const path of Object.keys(LOCALE_FILES)) {
    const m = path.match(/content\/([^/]+)\//);
    if (m && m[1] !== 'en' && m[1] !== 'glossary') out.add(m[1]);
  }
  return [...out].sort();
}

export function resolveLocale() {
  const avail = new Set(availableLocales());
  let want = null;
  try { want = new URLSearchParams(location.search).get('lang'); } catch { /* no-op */ }
  if (!want) { try { want = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ } }
  if (!want) want = (navigator.language || 'en').slice(0, 2);
  want = String(want).toLowerCase();
  return avail.has(want) ? want : 'en';
}

let current = 'en';
export function currentLocale() { return current; }

/** Persist the choice and reload — init then re-runs in the new
    language, which is the whole re-render strategy. */
export function setLocale(next) {
  try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode */ }
  const url = new URL(location.href);
  url.searchParams.delete('lang');
  location.assign(url.toString());
}

/* The machine-translation notice (required on every non-English page):
   the site does not overclaim about the psychology (DESIGN.md §1.4.5,
   §6.3) and it does not get to overclaim about its own German either. */
function insertNotice() {
  const header = document.querySelector('header.site');
  if (!header || document.querySelector('.mt-notice')) return;
  const div = document.createElement('div');
  div.className = 'mt-notice';
  div.textContent = t('site.i18n.notice');
  header.insertAdjacentElement('afterend', div);
}

/** Await this before any init code. For English it is a synchronous
    no-op — no fetch, no import, no DOM change. */
export async function initLocale() {
  current = resolveLocale();
  if (current === 'en') return 'en';
  document.documentElement.lang = current;
  const prefix = `../../content/${current}/`;
  await Promise.all(
    Object.entries(LOCALE_FILES)
      .filter(([path]) => path.startsWith(prefix))
      .map(([path, load]) => load().then(
        (mod) => registerLocaleCopy(mod.default),
        (e) => console.warn(`[i18n] failed to load ${path} — falling back to English per key`, e)
      ))
  );
  applyCopy(document);
  insertNotice();
  return current;
}
