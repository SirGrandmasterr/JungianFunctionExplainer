/* ============================================================
   CURRENTS · Playground — the type algebra
   The three Laws of the stack, expressed as code.

   Nothing here is a lookup table of the sixteen types: the
   sixteen are DERIVED from two choices (dominant, auxiliary) by
   applying the Laws. A stored table would drift from the rules
   the Assembly teaches; a derivation cannot.

     Law I   — the top two face opposite worlds (attitude differs)
     Law II  — the top two do opposite jobs (class differs)
     Law III — every function installs its polar opposite at the
               far end of its axis; slots 3 and 4 are entailed

   Laws I+II leave exactly two legal auxiliaries per dominant.
   8 dominants × 2 auxiliaries = 16 types. That is the whole
   encoding, and it is the whole of this file.
   ============================================================ */

/** The eight functions. `el` = element, `att` = attitude, `cls` = job. */
export const FN = {
  ne: { key: 'ne', label: 'Ne', el: 'n', att: 'e', cls: 'perceive', name: 'Extraverted Intuition', glyph: 'The Spark Tree' },
  ni: { key: 'ni', label: 'Ni', el: 'n', att: 'i', cls: 'perceive', name: 'Introverted Intuition', glyph: 'The Convergence' },
  se: { key: 'se', label: 'Se', el: 's', att: 'e', cls: 'perceive', name: 'Extraverted Sensing', glyph: 'The Naked Eye' },
  si: { key: 'si', label: 'Si', el: 's', att: 'i', cls: 'perceive', name: 'Introverted Sensing', glyph: 'The Still Pool' },
  te: { key: 'te', label: 'Te', el: 't', att: 'e', cls: 'judge', name: 'Extraverted Thinking', glyph: 'The Scaffold' },
  ti: { key: 'ti', label: 'Ti', el: 't', att: 'i', cls: 'judge', name: 'Introverted Thinking', glyph: 'The Lattice' },
  fe: { key: 'fe', label: 'Fe', el: 'f', att: 'e', cls: 'judge', name: 'Extraverted Feeling', glyph: 'The Resonance Field' },
  fi: { key: 'fi', label: 'Fi', el: 'f', att: 'i', cls: 'judge', name: 'Introverted Feeling', glyph: 'The Tuning Fork' },
};

export const FN_KEYS = ['ne', 'ni', 'se', 'si', 'te', 'ti', 'fe', 'fi'];
export const RANKS = ['dom', 'aux', 'tert', 'inf'];

/** Element → CSS variable name (§1.3 colour grammar) */
export const EL_VAR = { n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' };

/* ---------- Law III: the axis ---------- */

/** The polar opposite: same job, other element of the pair, opposite attitude. */
export const AXIS = { ne: 'si', si: 'ne', ni: 'se', se: 'ni', te: 'fi', fi: 'te', ti: 'fe', fe: 'ti' };

export const opposite = (fn) => AXIS[fn];

/** The two axes a stack is built from, named for what they do. */
export const AXIS_NAME = { perceive: 'perception axis', judge: 'judgment axis' };

/* ---------- Laws I & II: which auxiliaries are legal ---------- */

/**
 * Why a candidate auxiliary is refused — or null if it is legal.
 * Returns the Law that refuses it, so the Assembly can name it.
 */
export function refusal(dom, aux) {
  const d = FN[dom], a = FN[aux];
  if (!d || !a) return null;
  if (dom === aux) return { law: 3, code: 'same', reason: 'A function cannot sit twice in one psyche.' };
  if (aux === opposite(dom)) {
    return { law: 3, code: 'axis', reason: `${a.label} is already spoken for — it is the far end of ${d.label}'s own axis.` };
  }
  /* A candidate can break both Laws at once (Se under a Ne dominant breaks
     each of them). Name the job clash first: "nothing ever gets decided" is
     concrete, where "both hands outward" is abstract — and Law I still gets
     taught, by the candidates that break only it. */
  if (a.cls === d.cls) {
    return {
      law: 2, code: 'class',
      reason: d.cls === 'perceive'
        ? 'Two lenses, no valve — this mind would see everything and decide nothing.'
        : 'Two valves, no lens — this mind would decide everything and notice nothing.',
    };
  }
  if (a.att === d.att) {
    return {
      law: 1, code: 'attitude',
      reason: d.att === 'e'
        ? 'Both hands in the outer world — nobody minding the interior.'
        : 'Both turned inward — this mind would never reach the world at all.',
    };
  }
  return null;
}

/** The exactly-two auxiliaries Laws I and II leave open for a dominant. */
export function legalAux(dom) {
  return FN_KEYS.filter((k) => !refusal(dom, k));
}

/* ---------- the stack ---------- */

/**
 * Apply Law III twice: the tertiary and inferior are not chosen.
 * @returns {{dom,aux,tert,inf}} function keys by rank
 */
export function deriveStack(dom, aux) {
  return { dom, aux, tert: opposite(aux), inf: opposite(dom) };
}

/** Rank → function key, inverted: function key → rank (or null). */
export function rankOf(stack, fn) {
  for (const r of RANKS) if (stack[r] === fn) return r;
  return null;
}

/**
 * The four-letter code, derived — never stored.
 *   1st  the dominant's attitude
 *   2nd  whichever perceiving function sits in the top two
 *   3rd  whichever judging function sits in the top two
 *   4th  J if the extraverted member of the top two judges, else P
 */
export function typeCode(stack) {
  const top = [FN[stack.dom], FN[stack.aux]];
  const perc = top.find((f) => f.cls === 'perceive');
  const judg = top.find((f) => f.cls === 'judge');
  const ext = top.find((f) => f.att === 'e');
  if (!perc || !judg || !ext) return null;          /* Free Play: no legal code exists */
  return (
    FN[stack.dom].att.toUpperCase() +
    perc.el.toUpperCase() +
    judg.el.toUpperCase() +
    (ext.cls === 'judge' ? 'J' : 'P')
  );
}

/** Every legal (dom, aux) pair, as assembled Vessels. Derived, so it cannot drift. */
export function allTypes() {
  const out = [];
  for (const dom of FN_KEYS) {
    for (const aux of legalAux(dom)) {
      const stack = deriveStack(dom, aux);
      out.push({ code: typeCode(stack), stack });
    }
  }
  return out.sort((a, b) => a.code.localeCompare(b.code));
}

/** Look a type up by its four letters (built from the derivation, not a table). */
export function stackForCode(code) {
  const hit = allTypes().find((t) => t.code === code.toUpperCase());
  return hit ? hit.stack : null;
}

/* ---------- structural facts the Vessel geometry reads ---------- */

/** True when a stack obeys all three Laws (Free Play builds may not). */
export function isLegal(stack) {
  if (!stack || RANKS.some((r) => !stack[r])) return false;
  if (new Set(RANKS.map((r) => stack[r])).size !== 4) return false;
  if (refusal(stack.dom, stack.aux)) return false;
  return stack.tert === opposite(stack.aux) && stack.inf === opposite(stack.dom);
}

/** Which side of the Surface a rank sits on: 'above' (extraverted) or 'below'. */
export function side(stack, rank) {
  return FN[stack[rank]].att === 'e' ? 'above' : 'below';
}

/**
 * The stack's element coverage. A legal stack holds each element exactly
 * once, which is what makes every demand routable (§5.2). Free Play stacks
 * can miss elements entirely — the resolver needs to know.
 */
export function elementMap(stack) {
  const m = {};
  for (const r of RANKS) {
    const f = FN[stack[r]];
    if (f && !(f.el in m)) m[f.el] = { fn: f.key, rank: r };
  }
  return m;
}

/** The loop pair: dominant + tertiary always share an attitude (§3.7). */
export function loopPair(stack) {
  return { a: stack.dom, b: stack.tert, att: FN[stack.dom].att };
}
