/* ============================================================
   CURRENTS · Copy access layer

   Every user-facing string lives in content/en/ (see
   content/SCHEMA.md); this module is how code reads it. The
   inline English in the twelve HTML files is the render source
   for static text — tools/copy-sync.mjs keeps it equal to the
   map — so English fetches nothing and flashes nothing;
   applyCopy() exists for locales that arrive later.

   site.json is registered here because every page needs it;
   each page's data module registers its own namespace at import
   time (e.g. ti-data.js registers ti.json).
   ============================================================ */
import SITE from '../../content/en/site.json';

const REG = Object.create(null);   // English — always fully populated
const LOC = Object.create(null);   // active-locale overlay, empty for English

/** Merge a namespace dictionary (flat, dotted keys) into the registry. */
export function registerCopy(dict) {
  for (const k of Object.keys(dict)) REG[k] = dict[k];
}
registerCopy(SITE);

/** Overlay a locale dictionary. Lookups fall back to English per key —
    a missing translation shows English, never a blank or a raw key. */
export function registerLocaleCopy(dict) {
  for (const k of Object.keys(dict)) {
    if (k === '_meta') continue;    // pipeline metadata, not copy
    LOC[k] = dict[k];
  }
}

/** Replace {named} tokens. Values are the caller's responsibility:
    where the result feeds innerHTML, pass only trusted markup. */
export function fmt(str, vars) {
  if (!vars) return str;
  return str.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (m, name) =>
    name in vars ? String(vars[name]) : m
  );
}

/** A plain-string entry, with optional {token} substitution. */
export function t(key, vars) {
  const v = typeof LOC[key] === 'string' ? LOC[key] : REG[key];
  if (typeof v !== 'string') {
    console.error(`[copy] missing or non-string key: ${key}`);
    return key;
  }
  return fmt(v, vars);
}

/** A description-object entry ({mechanism, figure, provenance, …}).
    Locale fields overlay the English ones, so a field the pipeline
    flagged or skipped falls back to English rather than vanishing. */
export function tx(key) {
  const en = REG[key];
  const loc = LOC[key];
  const enObj = en && typeof en === 'object' ? en : null;
  const locObj = loc && typeof loc === 'object' ? loc : null;
  if (enObj || locObj) return { ...enObj, ...locObj };
  console.error(`[copy] missing or non-object key: ${key}`);
  return { mechanism: key, figure: '', provenance: 'currents' };
}

/* ---- applyCopy: re-render [data-copy] nodes from the registry ----
   English pages never call this (their inline text already matches the
   map); a localized build swaps the registered dictionaries and calls it.
   Three node forms, mirroring the sync tool:
     · plain key            → textContent
     · key ending in Html   → innerHTML (schema-limited markup)
     · plain key + children with data-copy-token="name"
                            → template text around the kept token elements */
export function applyCopy(root = document) {
  for (const el of root.querySelectorAll('[data-copy]')) {
    const key = el.getAttribute('data-copy');
    const tokens = el.querySelectorAll('[data-copy-token]');
    if (key.endsWith('Html')) {
      el.innerHTML = t(key);
    } else if (tokens.length) {
      const tpl = t(key);
      const keep = {};
      for (const tok of tokens) keep[tok.getAttribute('data-copy-token')] = tok;
      el.textContent = '';
      const parts = tpl.split(/(\{[a-zA-Z][a-zA-Z0-9]*\})/);
      for (const part of parts) {
        const m = part.match(/^\{([a-zA-Z][a-zA-Z0-9]*)\}$/);
        if (m && keep[m[1]]) el.appendChild(keep[m[1]]);
        else if (part) el.appendChild(document.createTextNode(part));
      }
    } else {
      el.textContent = t(key);
    }
  }
  for (const el of root.querySelectorAll('[data-copy-attrs]')) {
    for (const pair of el.getAttribute('data-copy-attrs').split(',')) {
      const i = pair.indexOf(':');
      if (i > 0) el.setAttribute(pair.slice(0, i).trim(), t(pair.slice(i + 1).trim()));
    }
  }
}

/** Render a lab narration into a node. A narration is either a plain
    guidance string or a description entry, whose figure renders as its
    own secondary line (the mechanism/figure split, content/SCHEMA.md). */
export function renderNarration(el, n) {
  if (!el) return;
  if (typeof n === 'string') { el.textContent = n; return; }
  el.textContent = '';
  const mech = document.createElement('span');
  mech.textContent = n.mechanism;
  el.appendChild(mech);
  if (n.figure) {
    const fig = document.createElement('span');
    fig.className = 'figurative';
    fig.textContent = n.figure;
    el.appendChild(fig);
  }
}
