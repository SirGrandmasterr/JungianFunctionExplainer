/* ============================================================
   CURRENTS · Playground — the model constants
   Every number in this file is an INVENTED DEFAULT, chosen to
   make the mechanic legible inside a short session. None is
   derived from typological theory. They are tuning surface.
   See docs/playground-rebuild/BUILD-SPEC.md §3, §4, §5.
   ============================================================ */

export const RANKS = ['dom', 'aux', 'tert', 'inf'];

/** BUILD-SPEC §3.1. `weight` sums to exactly 1.00. */
export const RANK_PROFILE = {
  dom:  { capacity: 100, cost: 0.55, stress: 0.60, pleasure: 1.35, decay: 1.30, weight: 0.40 },
  aux:  { capacity:  85, cost: 0.75, stress: 0.80, pleasure: 1.10, decay: 1.00, weight: 0.27 },
  tert: { capacity:  55, cost: 1.25, stress: 1.25, pleasure: 0.85, decay: 0.75, weight: 0.19 },
  inf:  { capacity:  35, cost: 1.90, stress: 1.80, pleasure: 0.50, decay: 0.55, weight: 0.14 },
};

export const TOTAL_CAPACITY = RANKS.reduce((a, r) => a + RANK_PROFILE[r].capacity, 0); /* 275 */

export const RANK_LABEL = { dom: 'Dominant', aux: 'Auxiliary', tert: 'Tertiary', inf: 'Inferior' };
export const RANK_ORDINAL = { dom: '1st', aux: '2nd', tert: '3rd', inf: '4th' };

/* ---------- relation multipliers (§3.2) ----------
   Doing what a function wants is cheap and pleasant; doing what
   it objects to is expensive and joyless. Deferring is priced
   ABOVE neutral, because suppression is not free. */
export const STRESS_REL   = { serves: 0.45, neutral: 1.00, defers: 1.35, violates: 1.80 };
export const PLEASURE_REL = { serves: 1.60, neutral: 1.00, defers: 0.55, violates: 0.15 };

export const RELATION_LABEL = {
  serves:   'serves what it wants',
  neutral:  'no stake either way',
  defers:   'puts it off',
  violates: 'goes against it',
};

/* ---------- routing (§3.3) ----------
   Order matters, and the spec had it wrong. The SIBLING — same element,
   same job, flipped attitude (Te→Ti, Se→Si) — is the cheapest landing
   place, because that is literally "same job, different method". The axis
   partner (Te→Fi) keeps the job but changes the element entirely, which is
   a bigger leap and costs more. A legal stack carries each element exactly
   once, so the sibling is almost always available. */
export const ROUTE_PENALTY = { self: 1.00, sibling: 1.35, axis: 1.60, klass: 1.75, fallback: 1.90 };

/* ---------- state multipliers (§3.7) ---------- */
const ALL = (v) => ({ dom: { ...v }, aux: { ...v }, tert: { ...v }, inf: { ...v } });

export const STATE_MULT = {
  balanced: ALL({ cost: 1.00, stress: 1.00, pleasure: 1.00, bias: 1.00 }),
  strained: ALL({ cost: 1.15, stress: 1.15, pleasure: 0.85, bias: 1.00 }),
  loop: {
    /* the bypassed auxiliary is cheap AND useless — both must be true, or the
       row reads as "no data" rather than "deliberately skipped" */
    dom:  { cost: 0.85, stress: 1.25, pleasure: 1.15, bias: 1.50 },
    aux:  { cost: 0.10, stress: 1.00, pleasure: 0.15, bias: 0.12 },
    tert: { cost: 0.90, stress: 1.30, pleasure: 1.10, bias: 1.50 },
    inf:  { cost: 1.00, stress: 1.10, pleasure: 0.60, bias: 0.90 },
  },
  grip: {
    /* the hijacking function fires READILY and pays real short-term pleasure.
       If a grip were expensive and joyless in the moment, nobody would ever
       spiral and the mechanic would teach nothing. */
    dom:  { cost: 1.60, stress: 1.10, pleasure: 0.30, bias: 0.45 },
    aux:  { cost: 1.30, stress: 1.10, pleasure: 0.40, bias: 0.70 },
    tert: { cost: 1.30, stress: 1.20, pleasure: 0.40, bias: 0.60 },
    inf:  { cost: 0.70, stress: 1.90, pleasure: 1.40, bias: 3.20 },
  },
  recovery: ALL({ cost: 1.25, stress: 0.70, pleasure: 0.80, bias: 1.00 }),
};

/* ---------- decay (§3.6) ---------- */
export const BASE_DECAY = 6;   /* points of stress per beat at decay 1.0 */

export const STATE_DECAY = {
  balanced: { dom: 1.0, aux: 1.0, tert: 1.0, inf: 1.0 },
  strained: { dom: 0.7, aux: 0.7, tert: 0.7, inf: 0.7 },
  /* negative = accrual. This is what makes a loop self-reinforcing rather
     than merely lopsided: the pair accrues while the bypassed one neither
     spends nor recovers. */
  loop:     { dom: -0.35, aux: 0.0, tert: -0.35, inf: 0.5 },
  grip:     { dom: 0.0, aux: 0.0, tert: 0.0, inf: -0.50 },
  recovery: { dom: 1.6, aux: 1.6, tert: 1.6, inf: 1.6 },
};

export const CAP_REGEN = { balanced: 3, strained: 2, loop: 0, grip: 0, recovery: 5 };
export const DEBT_REPAY = { balanced: 0, strained: 0, loop: 0, grip: 0, recovery: 2 };

/* ---------- thresholds (§5.1) ---------- */
export const TH = {
  strainEnter: 55, strainExit: 40,
  loopPressure: 35, loopShareIn: 0.08, loopShareOut: 0.18, loopArmCommits: 2, loopExitDomStress: 55,
  /* Grip is gated on the SHARED reservoir, not on the dominant's private
     slice. §5.1 originally said `capacity_dom <= 15`, which cannot fire in
     practice: the dominant is cheap and regenerates fastest, so it sits near
     full while the inferior goes hundreds into debt. Gating on a private
     meter also contradicts §4.1 — libido is one reservoir with four draws,
     and exhaustion is a property of the organism.
     Two routes, because D3 and S8 both say a grip is "usually entered from
     debt, not from stress alone" while §5.1's condition never mentioned
     debt at all. */
  gripStress: 78, gripEnergy: 18,
  gripDebt: 60, gripDebtStress: 62, gripDebtEnergy: 12,
  loopToGripBeats: 3, loopToGripStress: 85,
  gripExit: 62,
  recoverStress: 40, recoverDomCap: 30,
  relapse: 78,
};

export const STATE_LABEL = {
  balanced: 'Balanced', strained: 'Strained', loop: 'Loop', grip: 'Grip', recovery: 'Recovery',
};

export const STATE_SUB = {
  balanced: 'all four consulted',
  strained: 'under load, nothing broken',
  loop: 'auxiliary bypassed',
  grip: 'inferior hijack',
  recovery: 'decay at 1.6×, debt outstanding',
};

/* ---------- likelihood (§3.8) ----------
   The utility a psyche actually optimises is state-dependent, and that is
   not a fudge — it is the phenomenon. In a Loop or a Grip the psyche
   DISCOUNTS the cost it is accruing and OVER-WEIGHTS immediate relief;
   that mis-weighting is precisely why the state is a trap rather than a
   choice. In Recovery it does the opposite and becomes gun-shy.
   A fixed utility makes the aggravating cards look unattractive, which
   would teach exactly the wrong thing. */
/* Higher T = a flatter deck. At 22 a Loop/Grip deck collapsed to two cards
   holding all the mass and every authored card reading 0%, which looks
   broken rather than instructive. */
export const SOFTMAX_T = 30;

export const UTILITY_W = {
  balanced: { stress: 1.00, pleasure: 1.00 },
  strained: { stress: 1.05, pleasure: 1.00 },
  loop:     { stress: 0.30, pleasure: 1.90 },
  grip:     { stress: 0.20, pleasure: 2.40 },
  recovery: { stress: 1.35, pleasure: 0.80 },
};

/* ---------- generated actions (§3.9) ---------- */
/* The softmax already suppresses relief and favours the spiral on its own,
   because an aggravating action really does pay the state's own function.
   These multipliers only tilt it further; pushed harder they make the
   authored deck read as impossible, which is a different (wrong) lesson. */
export const ALLEVIATE = { intensity: 0.30, targetShare: 0.80, oddsMult: 0.55 };
export const AGGRAVATE = { intensity: 0.70, targetShare: 0.70, oddsMult: 1.45, pleasureBonus: 1.80 };

/* ---------- beats (§6.1) ---------- */
export const BEATS_PER_RUN = 8;
export const TRACE_LEN = 256;       /* ring buffer, per function */
export const VISIBLE_BEATS = 20;    /* on the S3 rows */
export const NOW_FRAC = 0.72;       /* every seismograph in the product */

/* ---------- fidelity tiers (§6.4) ---------- */
export const DEFAULT_TIER = { dom: 'FULL', aux: 'MID', tert: 'LOW', inf: 'LOW' };

export const TIER_SPEC = {
  FULL:     { lines: 5, glyph: 32, deltas: 4, labelled: true },
  MID:      { lines: 3, glyph: 28, deltas: 4, labelled: true },
  LOW:      { lines: 2, glyph: 24, deltas: 2, labelled: false },
  BYPASSED: { lines: 1, glyph: 24, deltas: 0, labelled: false },
};

/** §6.4 — tier is derived, never configured. */
export function tierFor(rank, machine, focused) {
  if (machine === 'loop' && rank === 'aux') return 'BYPASSED';   /* not even focus reopens it */
  if (focused) return 'FULL';
  if (machine === 'loop' && rank === 'tert') return 'MID';        /* doing second-function work */
  if (machine === 'grip' && rank === 'inf') return 'FULL';
  if (machine === 'grip' && rank === 'dom') return 'MID';
  return DEFAULT_TIER[rank];
}

/** §6.3 — row height IS rank. Grip swaps the dom/inf allocations. */
export function rowFlex(rank, machine) {
  const base = { dom: 186, aux: 156, tert: 122, inf: 100 };
  if (machine === 'grip') {
    if (rank === 'dom') return base.inf;
    if (rank === 'inf') return base.dom;
  }
  return base[rank];
}
