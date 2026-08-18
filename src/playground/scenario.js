/* ============================================================
   CURRENTS · Playground — scenario adapter
   The authored files in src/data/scenarios/*.js predate this
   model. Rather than rewrite the prose, this module projects
   them onto the shape the engine wants: a Predisposition for
   each of the EIGHT functions, with a resolved cost gate, so
   any Vessel can enter any Scenario.
   BUILD-SPEC §1.3, §1.9.
   ============================================================ */
import { FN, FN_KEYS, RANKS, AXIS } from './types.js';
import { ROUTE_PENALTY } from './model.js';
import { clamp } from '../utils/math.js';

/* ---------- interior hooks → the key that indexes gates and monologue ---------- */

function hookKey(sc, fn) {
  const int = sc.interior || {};
  switch (fn) {
    case 'si': return int.si?.familiarity || 'unprecedented';
    case 'ni': return int.ni?.trajectory || 'blindside';
    case 'ti': return int.ti?.modelFit || 'consistent';
    case 'fi': {
      const v = int.fi?.valence ?? 0;
      return v >= 0.3 ? 'rings-true' : v <= -0.3 ? 'rings-false' : 'neutral';
    }
    default: return 'base';
  }
}

const GATE_NOTE = {
  'familiar-good': 'a good precedent — cheap to consult',
  'familiar-bad': 'a bad precedent, and it is on file',
  unprecedented: 'nothing in the record matches — expensive',
  foreseen: 'already seen coming — cheap, and that is the trap',
  blindside: 'nothing pointed here — the picture must be rebuilt',
  consistent: 'the model holds — cheap to run',
  contradiction: 'an axiom just failed in public — costly to hold',
  'rings-true': 'this is the option that fits — cheap',
  neutral: 'no strong pull either way',
  'rings-false': 'something in this is wrong — expensive to sit with',
};

/* A surface-hook reading, in plain language, for functions with no interior hook. */
function surfaceNote(sc, fn) {
  const s = sc.surface || {};
  switch (fn) {
    case 'se': {
      const i = s.se?.intensity ?? 0.3;
      return i > 0.6 ? 'a loud room is exactly its food' : i < 0.2 ? 'nothing to register — it runs on empty' : 'some of the room is live';
    }
    case 'ne': {
      const a = s.ne?.ambiguity ?? 0.4;
      return a > 0.6 ? 'wide open — plenty to branch from' : a < 0.25 ? 'nothing here is hypothetical' : 'a little slack to work with';
    }
    case 'te': {
      const k = s.te?.stakes ?? 0.5;
      return k > 0.6 ? 'measurable stakes and resources to hand' : 'little here that can be measured';
    }
    case 'fe': {
      const n = s.fe?.audience ?? 0;
      return n === 0 ? 'no audience at all — nothing to conduct' : `${n} people to hold`;
    }
    default: return 'no direct hook in this situation';
  }
}

/* ---------- registration ---------- */

function registration(sc, fn, rank) {
  const s = sc.surface || {};
  if (fn === 'se') {
    const i = s.se?.intensity ?? 0.3;
    if (i < 0.15) return 'IDLE';
    return (rank === 'inf' && i > 0.8) ? 'OVERLOADED' : 'REGISTERED';
  }
  if (fn === 'fe') {
    const n = s.fe?.audience ?? 0;
    if (n === 0) return 'IDLE';
    if (n >= 5 && (rank === 'inf' || rank === 'tert')) return 'OVERLOADED';
    return 'REGISTERED';
  }
  if (fn === 'ne' && (s.ne?.ambiguity ?? 0.4) < 0.2) return 'IDLE';
  return 'ACTIVE';
}

/* ---------- the statement, taken from the authored monologue ---------- */

function statement(sc, fn) {
  const m = sc.monologue?.[fn];
  if (!m) return '';
  const k = hookKey(sc, fn);
  return m[k] || m.base || Object.values(m)[0] || '';
}

/* ---------- gates ---------- */

function resolveGate(sc, fn) {
  const g = sc.gates?.[fn];
  if (g == null) return 1.0;
  if (typeof g === 'number') return clamp(g, 0.6, 1.8);
  return clamp(g[hookKey(sc, fn)] ?? 1.0, 0.6, 1.8);
}

/* ============================================================
   resolveScenario — the projection the run actually uses
   ============================================================ */

/**
 * @param {object} raw   one of SCENARIOS
 * @param {object} stack {dom,aux,tert,inf} function keys
 */
export function resolveScenario(raw, stack) {
  const rankOf = {};
  RANKS.forEach((r) => { rankOf[stack[r]] = r; });

  const predispositions = {};
  for (const fn of FN_KEYS) {
    const rank = rankOf[fn] || null;
    predispositions[fn] = {
      fn,
      rank,
      carried: !!rank,
      hook: hookKey(raw, fn),
      statement: statement(raw, fn),
      gate: resolveGate(raw, fn),
      gateNote: GATE_NOTE[hookKey(raw, fn)] || surfaceNote(raw, fn),
      registration: registration(raw, fn, rank),
      affinity: raw.affinity?.[fn] ?? 1.0,
    };
  }

  /* what this scenario feeds, per carried function — the S2 bars.
     Feed is the inverse of cost gate, lifted by affinity. */
  const feed = {};
  RANKS.forEach((r) => {
    const p = predispositions[stack[r]];
    feed[stack[r]] = clamp((1.9 - p.gate) / 1.3 * (0.6 + 0.4 * p.affinity), 0.04, 1);
  });

  return {
    id: raw.id,
    title: raw.title,
    blurb: raw.blurb,
    vignette: raw.vignette,
    raw,
    predispositions,
    feed,
    actions: raw.actions.map((a) => normaliseAction(a)),
    outcomeFor: (actionId, machine) => {
      const a = raw.actions.find((x) => x.id === actionId);
      if (!a) return '';
      return a.outcome || '';
    },
  };
}

/** The authored files use `defies`; the model calls it `violates`. */
export function normaliseAction(a) {
  const m = a.mandates || {};
  return {
    id: a.id,
    label: a.label,
    detail: a.detail || '',
    signature: { ...a.signature },
    intensity: a.intensity ?? 0.5,
    mandates: {
      serves: m.serves || [],
      defers: m.defers || [],
      violates: m.violates || m.defies || [],
    },
    origin: 'authored',
  };
}

/* ============================================================
   Routing — BUILD-SPEC §3.3
   A demand for a function the stack does not carry is not a
   block. It is re-targeted, and surcharged. Same job, different
   method, different bill.
   ============================================================ */

/** Where does a demand for `fn` land in this stack, and at what surcharge? */
export function routeTarget(fn, stack) {
  const held = RANKS.map((r) => stack[r]);
  const carried = new Set(held);
  if (carried.has(fn)) return { target: fn, penalty: ROUTE_PENALTY.self, kind: 'self' };

  const self = FN[fn];

  /* 1 — the sibling: same element, same job, attitude flipped. Te→Ti,
     Se→Si. The same work, done the other way round. Cheapest. */
  const sibling = held.find((k) => FN[k].el === self.el && FN[k].cls === self.cls);
  if (sibling) return { target: sibling, penalty: ROUTE_PENALTY.sibling, kind: 'sibling' };

  /* 2 — the axis partner: same job, different element. A bigger leap. */
  const partner = AXIS[fn];
  if (carried.has(partner)) return { target: partner, penalty: ROUTE_PENALTY.axis, kind: 'axis' };

  /* 3 — any function that does the same job, highest-ranked first */
  const sameKlass = held.find((k) => FN[k].cls === self.cls);
  if (sameKlass) return { target: sameKlass, penalty: ROUTE_PENALTY.klass, kind: 'klass' };

  return { target: stack.dom, penalty: ROUTE_PENALTY.fallback, kind: 'fallback' };
}

/**
 * Project an action's signature onto the four carried functions.
 * Returns shares summing to exactly 1, per-function routing penalties,
 * and a human-readable note for any demand that had to move.
 */
export function routeSignature(action, stack) {
  const share = {}; const penaltyNum = {}; const penaltyDen = {}; const notes = [];
  RANKS.forEach((r) => { share[stack[r]] = 0; penaltyNum[stack[r]] = 0; penaltyDen[stack[r]] = 0; });

  for (const [fn, raw] of Object.entries(action.signature)) {
    if (!raw) continue;
    const { target, penalty, kind } = routeTarget(fn, stack);
    share[target] += raw;
    /* share-weighted mean penalty, so a function absorbing both native and
       routed work is charged proportionally rather than at the worst rate */
    penaltyNum[target] += raw * penalty;
    penaltyDen[target] += raw;
    if (kind !== 'self') {
      notes.push({ from: fn, to: target, penalty, kind,
        text: `${FN[fn].label} not in stack → routed to ${FN[target].label} (+${Math.round((penalty - 1) * 100)}%)` });
    }
  }

  const total = Object.values(share).reduce((a, b) => a + b, 0) || 1;
  const penalty = {};
  RANKS.forEach((r) => {
    const k = stack[r];
    share[k] /= total;
    penalty[k] = penaltyDen[k] > 0 ? penaltyNum[k] / penaltyDen[k] : 1;
  });

  return { share, penalty, notes, routed: notes.length > 0 };
}

/* ============================================================
   Mandates — which relation does this action bear to a function?
   Mandate refs route exactly like signature demands, so an ISTP
   feels a `fi.fairness` stake through Ti: not as a value, as a
   principle. Same stake, different machinery.
   ============================================================ */

const PRECEDENCE = ['violates', 'defers', 'serves'];

export function routeMandates(action, stack) {
  const rel = {};
  RANKS.forEach((r) => { rel[stack[r]] = 'neutral'; });
  const rank = { violates: 3, defers: 2, serves: 1, neutral: 0 };
  const detail = {};

  for (const kind of PRECEDENCE) {
    for (const ref of action.mandates[kind] || []) {
      const fn = String(ref).split('.')[0];
      if (!FN[fn]) continue;
      const { target } = routeTarget(fn, stack);
      if (rank[kind] > rank[rel[target]]) {
        rel[target] = kind;
        detail[target] = { ref, via: fn === target ? null : fn };
      }
    }
  }
  return { rel, detail };
}
