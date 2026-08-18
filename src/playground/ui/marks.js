/* ============================================================
   CURRENTS · Playground — glyph marks
   BUILD-SPEC §6.3, S5 callout 2.

   DEVIATION FROM THE SPEC, AND WHY.
   The spec says the glyph slot wraps the canvas engine from the
   function's own info page. Those engines are 400–1500-line
   particle simulations that each own a requestAnimationFrame
   loop. Four of them at 22–32 px would be four extra render
   loops producing four grey smudges — the particle detail is
   invisible below roughly 90 px, and the extra loops break the
   one-clock rule in §7.

   So the slot renders an inline SVG MARK: the same silhouette
   the engine builds its simulation around, crisp at any size,
   zero per-frame cost, one shared clock preserved. Recognition
   at 32 px is carried by silhouette, not by particles. The full
   engine remains the right choice above ~120 px, and `useEngine`
   in the row is the hook for that.

   Every mark is distinct in OUTLINE, not only in colour, so the
   four functions stay separable in greyscale and for colour-
   blind readers — position, label, rank text and shape are four
   redundant channels.
   ============================================================ */

const SW = 'stroke-width="1.6" vector-effect="non-scaling-stroke" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"';

const PATHS = {
  /* The Lattice — a crystalline framework, endlessly self-refining */
  ti: `<g ${SW}>
    <path d="M6 6h12M6 12h12M6 18h12M6 6v12M12 6v12M18 6v12"/>
    <circle cx="6" cy="6" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="18" cy="18" r="1.1" fill="currentColor" stroke="none"/>
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/>
  </g>`,
  /* The Scaffold — external structure, braced and checkable */
  te: `<g ${SW}>
    <rect x="5" y="5" width="14" height="14" rx="0.5"/>
    <path d="M5 10h14M5 15h14M12 5v14"/>
    <path d="M5 5l7 5M19 5l-7 5" opacity="0.45"/>
  </g>`,
  /* The Tuning Fork — a private resonance, struck and held */
  fi: `<g ${SW}>
    <path d="M8.5 4v7.5M15.5 4v7.5"/>
    <path d="M8.5 11.5q3.5 4 7 0"/>
    <path d="M12 14.2V20"/>
    <path d="M5.5 7.5q-1.2 2 0 4M18.5 7.5q1.2 2 0 4" opacity="0.4"/>
  </g>`,
  /* The Resonance Field — concentric, outward, holding a room */
  fe: `<g ${SW}>
    <circle cx="12" cy="12" r="2.2"/>
    <circle cx="12" cy="12" r="5.4" opacity="0.72"/>
    <circle cx="12" cy="12" r="8.4" opacity="0.42" stroke-dasharray="2.2 2.4"/>
    <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none"/>
  </g>`,
  /* The Spark Tree — divergence, branching outward and up */
  ne: `<g ${SW}>
    <path d="M12 20v-6.5"/>
    <path d="M12 13.5L5.5 6M12 13.5L9.5 4M12 13.5L14.5 4M12 13.5L18.5 6.5"/>
    <circle cx="5.5" cy="6" r="1" fill="currentColor" stroke="none"/>
    <circle cx="9.5" cy="4" r="1" fill="currentColor" stroke="none"/>
    <circle cx="14.5" cy="4" r="1" fill="currentColor" stroke="none"/>
    <circle cx="18.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </g>`,
  /* The Convergence — many lines, one point, slow certainty */
  ni: `<g ${SW}>
    <path d="M4 4L12 19M9 3L12 19M15 3L12 19M20 4.5L12 19"/>
    <circle cx="12" cy="19" r="1.7" fill="currentColor" stroke="none"/>
  </g>`,
  /* The Naked Eye — the present, unmediated */
  se: `<g ${SW}>
    <path d="M2.5 12q9.5-7.5 19 0-9.5 7.5-19 0z"/>
    <circle cx="12" cy="12" r="3"/>
    <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none"/>
  </g>`,
  /* The Still Pool — layered sediment, the record */
  si: `<g ${SW}>
    <ellipse cx="12" cy="12" rx="9" ry="3.6"/>
    <ellipse cx="12" cy="12" rx="5.8" ry="2.3" opacity="0.7"/>
    <ellipse cx="12" cy="12" rx="2.6" ry="1.05" opacity="0.5"/>
    <path d="M3 15.5q9 3.4 18 0" opacity="0.35"/>
  </g>`,
};

/**
 * @param {string} fn   function key
 * @param {number} size px — 22 / 24 / 28 / 32 by rank, 44 in the expanded row
 */
export function markSVG(fn, size = 24) {
  return `<svg class="pg-mark" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[fn] || ''}</svg>`;
}

export function markEl(fn, size = 24) {
  const wrap = document.createElement('span');
  wrap.className = 'pg-mark-slot';
  wrap.style.setProperty('--mark-size', `${size}px`);
  wrap.innerHTML = markSVG(fn, size);
  return wrap;
}
