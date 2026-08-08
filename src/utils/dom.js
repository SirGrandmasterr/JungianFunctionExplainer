/* ============================================================
   CURRENTS · DOM / environment helpers
   ============================================================ */

/** True if the user prefers reduced motion */
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Read a CSS custom property from the document root */
export const CSSVAR = (n) =>
  getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/** Status colors: green = perceived correct, red = violation */
export const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
