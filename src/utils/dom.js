/* ============================================================
   CURRENTS · DOM / environment helpers
   ============================================================ */

/** True if the user prefers reduced motion */
export const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True on touch-first devices, where "hover the chamber" is a dead instruction */
export const COARSE = matchMedia('(hover: none) and (pointer: coarse)').matches;

/** Read a CSS custom property from the document root */
export const CSSVAR = (n) =>
  getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/** Status colors: green = perceived correct, red = violation */
export const VERDICT = { good: '#0ca30c', bad: '#d03b3b' };
