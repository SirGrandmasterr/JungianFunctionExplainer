/* ============================================================
   CURRENTS · Shared math / color utilities
   ============================================================ */
export const TAU = Math.PI * 2;

export const lerp  = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/** Mulberry32 — deterministic PRNG from an integer seed */
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- hex ↔ rgba helpers ---------- */

export function hexA(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16),
        g = parseInt(h.slice(2, 4), 16),
        b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function hexLerp(h1, h2, t) {
  const p = (h) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = p(h1),
        [r2, g2, b2] = p(h2);
  const c = (v) =>
    Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return '#' + c(lerp(r1, r2, t)) + c(lerp(g1, g2, t)) + c(lerp(b1, b2, t));
}

export function hexRGB(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function mixRGB(a, b, t) {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

export function rgbA(c, a) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

export function rgbHex(c) {
  const h = (v) =>
    clamp(Math.round(v), 0, 255)
      .toString(16)
      .padStart(2, '0');
  return '#' + h(c.r) + h(c.g) + h(c.b);
}

/** h,s,v in 0..1 → {r,g,b} in 0..1 */
export function hsv(h, s, v) {
  h = h - Math.floor(h);
  const i = Math.floor(h * 6), f = h * 6 - i;
  const p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return { r: v, g: t, b: p };
    case 1: return { r: q, g: v, b: p };
    case 2: return { r: p, g: v, b: t };
    case 3: return { r: p, g: q, b: v };
    case 4: return { r: t, g: p, b: v };
    default: return { r: v, g: p, b: q };
  }
}

/** {r,g,b} in 0..1 → hue in 0..1 (0 when achromatic) */
export function rgbHue(r, g, b) {
  const mx = Math.max(r, g, b), d = mx - Math.min(r, g, b);
  if (d < 1e-6) return 0;
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h / 6) - Math.floor(h / 6);
}

export function varyColor(hex, rnd) {
  const c = hexRGB(hex);
  const t = (rnd() - 0.5) * 0.4;
  const tgt = t > 0 ? { r: 255, g: 245, b: 250 } : { r: 16, g: 14, b: 30 };
  return rgbHex(mixRGB(c, tgt, Math.abs(t)));
}
