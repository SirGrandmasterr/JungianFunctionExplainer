/* ============================================================
   CURRENTS · Playground — the Ledger
   The economy, as pure functions. Nothing here touches a canvas,
   the DOM, or a clock; `resolve()` returns a receipt object, and
   the receipt drives the UI, the meters, the forecast and the
   counterfactual identically.

   The thesis this file exists to enforce:

     Any type can produce any action. What differs is the bill.

   That is not a slogan bolted on top — it is a property of
   `route()`. Every legal stack holds each element exactly once,
   so every demand always finds a handler. The model cannot
   express "this type can't"; the worst it can say is "×4.0, and
   translated, and in front of nine people."
   ============================================================ */
import { FN, RANKS, elementMap, rankOf } from './types.js';
import { clamp } from '../utils/math.js';

/* ---------- constants (house canon where DESIGN.md has one) ---------- */
export const ECON = {
  /* §3.3 activation multipliers — the cost of invoking from a slot */
  M: { dom: 1.0, aux: 1.5, tert: 2.5, inf: 4.0 },
  /* rank weight — how much of the psyche's authority a slot carries */
  W: { dom: 1.0, aux: 0.75, tert: 0.45, inf: 0.25 },
  /* how much joy the machinery itself returns, by slot */
  P_RATE: { dom: 1.0, aux: 0.70, tert: 0.30, inf: 0.10 },

  TAU: 1.5,           /* attitude-translation tax — §8.1: the softest constant here */
  TAU_ORPHAN: 2.5,    /* Free Play only: no chamber of this element exists at all */
  K: 10,              /* energy units per unit of demand; the daily pool is 100 */

  SURGE: 1.2,         /* inferior line → stress */
  STRAIN: 0.5,        /* tertiary line → stress */
  EXPOSURE: 0.30,     /* translated work performed in front of people */
  AUDIENCE: 0.035,    /* per head, on surge and exposure */

  DEFIANCE: 15,       /* one-off stress for acting against a live mandate */
  INTEREST: 2,        /* per-tick rumination on an unanswered mandate */
  RELIEF: 5,          /* stress returned when a mandate is finally answered */
  VINDICATION: 7,     /* pleasure for acting in service of one */
  SUBSIDY_RATE: 0.35, /* conviction co-signs this much of the bill … */
  SUBSIDY_CAP: 0.50,  /* … up to half of it */
  BETRAYAL: 0.8,      /* self-betrayal surcharge on cost, × mandate strength */
  MANDATE_MIN: 0.05,  /* below this, a push is noise rather than a mandate */

  /* Directed pushes from the two interior lenses. Deliberately below the
     judges' range: a lens argues for a direction it already sees, it does
     not rule that something is right, and it should not be able to co-sign
     an act as hard as a violated value can. */
  MANDATE_NI: 0.6,    /* a foreseen trajectory, pushing along itself */
  MANDATE_SI: 0.5,    /* a precedent that worked, pushing toward itself */

  FLOW_SHARE: 0.40,   /* dominant must carry this much of the load … */
  FLOW_REFUND: 0.25,  /* … to refund this much of its own line */

  GATE_MIN: 0.6,
  GATE_MAX: 1.8,

  TEMP: 12,           /* forecast softmax temperature — §8.3 */
};

/* ---------- routing ---------- */

/**
 * Find the chamber that will actually do this work.
 *
 * A function present in the stack does its own job at face value. A function
 * absent from the stack is not refused — the demand is handed to the stack's
 * chamber of the same element, which performs it in its own attitude and
 * charges a translation tax. Ti-work reaching an ENFP is done by Te: as
 * externally checkable steps rather than a private formal model. Same job,
 * different method, different bill.
 *
 * @returns {{fn,rank,tau,mode}} mode: 'native' | 'translated' | 'orphan'
 */
export function route(fnKey, stack) {
  const own = rankOf(stack, fnKey);
  if (own) return { fn: fnKey, rank: own, tau: 1, mode: 'native' };

  const sibling = elementMap(stack)[FN[fnKey].el];
  if (sibling) return { fn: sibling.fn, rank: sibling.rank, tau: ECON.TAU, mode: 'translated' };

  /* Only reachable in Free Play, where a stack can be missing an element
     entirely (four perceivers have no T and no F). The work still happens —
     it is improvised by the deepest chamber aboard, at a punishing rate. */
  const last = RANKS.map((r) => ({ fn: stack[r], rank: r })).filter((s) => s.fn).pop();
  return last
    ? { fn: last.fn, rank: last.rank, tau: ECON.TAU_ORPHAN, mode: 'orphan' }
    : { fn: fnKey, rank: 'inf', tau: ECON.TAU_ORPHAN, mode: 'orphan' };
}

/* ---------- context gates ---------- */

/** The briefing state a given interior function is currently reading. */
export function hookState(fnKey, briefing = {}) {
  const b = briefing[fnKey];
  if (!b) return null;
  switch (fnKey) {
    case 'si': return b.familiarity || null;
    case 'ni': return b.trajectory || null;
    case 'ti': return b.modelFit || null;
    case 'fi': {
      const v = b.valence ?? 0;
      return v <= -0.3 ? 'rings-false' : v >= 0.3 ? 'rings-true' : 'neutral';
    }
    default: return b.state || null;
  }
}

/**
 * Machinery is priced by slot; context decides whether that machinery is
 * being handed its own food or asked to work in the dark. A dominant
 * starved of what it eats is expensive too — which is why this exists.
 */
export function gate(fnKey, scenario = {}, briefing = {}) {
  const g = scenario.gates && scenario.gates[fnKey];
  if (g == null) return 1;
  if (typeof g === 'number') return clamp(g, ECON.GATE_MIN, ECON.GATE_MAX);
  const st = hookState(fnKey, briefing);
  const v = st != null && st in g ? g[st] : g.default;
  return v == null ? 1 : clamp(v, ECON.GATE_MIN, ECON.GATE_MAX);
}

/* ---------- mandates ---------- */

/**
 * Where a directed push comes from, per chamber, *before* rank is applied.
 * Each source answers one question: standing in this scenario, reading this
 * briefing, what does a chamber of this element want done? `null` means it
 * has nothing to push for — the instrument is reading neutral, or it is
 * reading a state a chamber simply cannot argue from.
 *
 * The four judges rule on the situation, so each pushes whenever its own hook
 * is off-centre. The two interior lenses push more narrowly and more weakly
 * (ECON.MANDATE_NI / MANDATE_SI): a lens argues for a *direction it already
 * sees* rather than ruling that something is right, so a blindside gives Ni
 * nothing to push along and an unfamiliar — or a badly remembered — situation
 * gives Si no precedent to push toward. Ne and Se have no source at all: an
 * outward lens reports what is in front of it and takes no position on it,
 * so there is nothing an action could serve or defy.
 *
 * This table is also what `auditMandates` probes, so the engine and its
 * self-check cannot drift apart.
 */
const MANDATE_SOURCES = {
  fi: (scenario, briefing) => {
    const b = briefing.fi || {};
    return {
      id: `fi.${(b.value || 'value').replace(/\s+/g, '-')}`,
      valence: b.valence ?? 0,
      label: b.value || 'a personal value',
    };
  },

  ti: (scenario, briefing) => {
    const fit = (briefing.ti || {}).modelFit;
    return {
      id: 'ti.model',
      valence: fit === 'contradiction' ? -0.8 : fit === 'consistent' ? 0.25 : 0,
      label: (briefing.ti || {}).axiom || 'the model',
    };
  },

  te: (scenario) => {
    const te = (scenario.surface && scenario.surface.te) || {};
    return { id: 'te.stakes', valence: te.stakes || 0, label: te.metric || 'the outcome' };
  },

  fe: (scenario) => {
    const fe = (scenario.surface && scenario.surface.fe) || {};
    return {
      id: 'fe.expectation',
      valence: fe.expectation ? clamp(0.25 + (fe.audience || 0) * 0.05, 0, 1) : 0,
      label: fe.expectation || 'the room',
    };
  },

  ni: (scenario, briefing) => {
    const b = briefing.ni || {};
    if (b.trajectory !== 'foreseen') return null;   /* a blindside has no line to hold */
    return { id: 'ni.trajectory', valence: ECON.MANDATE_NI, label: b.note || 'the trajectory' };
  },

  si: (scenario, briefing) => {
    const b = briefing.si || {};
    if (b.familiarity !== 'familiar-good') return null;  /* a bad record is a warning, not a course */
    return { id: 'si.precedent', valence: ECON.MANDATE_SI, label: b.precedent || 'the precedent' };
  },
};

/**
 * A chamber whose hook reads extreme develops a directed push.
 * Only chambers actually aboard produce one — which is precisely why
 * different types cannot let go of different things.
 */
export function liveMandates(stack, scenario = {}, briefing = {}) {
  const out = [];
  for (const rank of RANKS) {
    const fnKey = stack[rank];
    const source = fnKey && MANDATE_SOURCES[fnKey];
    if (!source) continue;

    const m = source(scenario, briefing);
    if (!m) continue;

    const strength = Math.abs(m.valence) * ECON.W[rank];
    if (strength < ECON.MANDATE_MIN) continue;
    out.push({ id: m.id, fn: fnKey, rank, valence: m.valence, strength, label: m.label });
  }
  return out.sort((a, b) => b.strength - a.strength);
}

/* ---------- the self-check ---------- */

/**
 * The full vocabulary of the four interior instruments, kept here rather than
 * imported from the content layer so the ledger stays a pure module. It must
 * stay in step with INSTRUMENTS in `data/playground-data.js`, which is what
 * the Briefing panel renders; `auditMandates` sweeps it to ask what a scenario
 * could ever produce, across every setting a player can reach.
 */
export const BRIEFING_VOCAB = {
  si: { familiarity: ['familiar-good', 'familiar-bad', 'unprecedented'] },
  ni: { trajectory: ['foreseen', 'blindside'] },
  ti: { modelFit: ['consistent', 'contradiction'] },
  fi: { valence: [-1, 0, 1] },
};

/** Every briefing a player can dial in, as the cartesian product of the above. */
function briefingSweep() {
  let out = [{}];
  for (const [fnKey, fields] of Object.entries(BRIEFING_VOCAB)) {
    for (const [field, values] of Object.entries(fields)) {
      out = out.flatMap((b) => values.map((v) => ({ ...b, [fnKey]: { ...(b[fnKey] || {}), [field]: v } })));
    }
  }
  return out;
}

/**
 * Which functions could develop a mandate in this scenario, under *some*
 * briefing, in *some* stack. Judged at `dom`, where the rank weight is 1 —
 * the most generous slot there is. A push too faint to clear the floor even
 * there can never be a mandate anywhere.
 * @returns {Set<string>} function keys
 */
export function mandatableFns(scenario = {}) {
  const out = new Set();
  const sweep = briefingSweep();
  for (const [fnKey, source] of Object.entries(MANDATE_SOURCES)) {
    for (const b of sweep) {
      const m = source(scenario, b);
      if (m && Math.abs(m.valence) * ECON.W.dom >= ECON.MANDATE_MIN) { out.add(fnKey); break; }
    }
  }
  return out;
}

/**
 * Dev-time assertion: every mandate a scenario's actions couple to must be one
 * the engine can actually produce there.
 *
 * A reference to a chamber that never develops a push in this scenario is not
 * a harmless no-op. It is an authored intention — "declining defies the
 * trajectory" — that silently never fires, and a silently-never-fires is the
 * one failure this economy cannot show on a receipt. So it is shouted at load.
 *
 * @returns {Array<{scenario,action,stance,ref,fn}>} the dead references
 */
export function auditMandates(scenario = {}) {
  const live = mandatableFns(scenario);
  const dead = [];
  for (const action of scenario.actions || []) {
    for (const stance of ['serves', 'defies', 'defers']) {
      for (const ref of (action.mandates || {})[stance] || []) {
        const fn = String(ref).split('.')[0];
        if (!live.has(fn)) dead.push({ scenario: scenario.id, action: action.id, stance, ref, fn });
      }
    }
  }
  if (dead.length) {
    const fns = [...new Set(dead.map((d) => d.fn))].join(', ');
    console.error(
      `[currents] scenario "${scenario.id}": ${dead.length} mandate reference(s) can never fire — ` +
      `no briefing makes ${fns} develop a push here, so these couplings are silently inert:\n` +
      dead.map((d) => `    ${d.action} ${d.stance} ${d.ref}`).join('\n'));
  }
  return dead;
}

/** Run the self-check over a whole deck. Call from the app entry, in dev only. */
export function auditScenarios(scenarios = []) {
  return scenarios.flatMap((s) => auditMandates(s));
}

/** Actions couple to mandates by function prefix, so renaming a value can't break it. */
function stanceOf(action, mandate) {
  const m = action.mandates || {};
  const hit = (list) => (list || []).some((s) => String(s).split('.')[0] === mandate.fn);
  if (hit(m.serves)) return 'served';
  if (hit(m.defies)) return 'defied';
  if (hit(m.defers)) return 'deferred';
  return 'unaddressed';
}

/* ---------- the resolver ---------- */

/**
 * Price one action for one Vessel in one situation.
 * @returns a receipt: every number the UI shows, itemized and already named.
 */
export function resolve(action, vessel, scenario = {}, briefing = {}) {
  const stack = vessel.stack;
  const intensity = action.intensity ?? 0.5;
  const audience = (scenario.surface && scenario.surface.fe && scenario.surface.fe.audience) || 0;
  const audienceMul = 1 + ECON.AUDIENCE * audience;

  /* ---- 1. route every share of the signature and price it ---- */
  const lines = Object.entries(action.signature || {}).map(([fnKey, share]) => {
    const r = route(fnKey, stack);
    const g = gate(r.fn, scenario, briefing);
    return {
      demand: fnKey, share, ...r, gate: g,
      cost: ECON.K * intensity * share * ECON.M[r.rank] * r.tau * g,
    };
  }).sort((a, b) => b.cost - a.cost);

  const raw = lines.reduce((s, l) => s + l.cost, 0);
  const mandates = liveMandates(stack, scenario, briefing)
    .map((m) => ({ ...m, stance: stanceOf(action, m) }));

  /* ---- 2. conviction: a judge co-signs machinery the type barely owns ----
     Backing is dominated by the *strongest* conviction, not the sum of them:
     a person is carried through an expensive act by one thing they cannot
     let go of, and a pile of mild agreements never adds up to that. */
  const served = mandates.filter((m) => m.stance === 'served');
  const deferred = mandates.filter((m) => m.stance === 'deferred');
  const weights = [...served.map((m) => m.strength), ...deferred.map((m) => m.strength * 0.5)]
    .sort((a, b) => b - a);
  const backing = weights.length
    ? weights[0] + 0.3 * weights.slice(1).reduce((s, w) => s + w, 0)
    : 0;
  const subsidy = backing > 0
    ? Math.min(ECON.SUBSIDY_RATE * backing, ECON.SUBSIDY_CAP) * raw
    : 0;

  /* ---- 3. self-betrayal: acting *with* a violation costs more to run ----
     The filter is attitude, not class, and it now catches Ni and Si too.
     That is deliberate. The surcharge is not "you broke a rule"; it is the
     cost of running an act while some part of you privately dissents, and
     an interior lens dissents exactly as privately as an interior judge:
     nobody in the room can see you overruling your own read of where this
     was going. An extraverted chamber's mandate is answerable *out there*,
     so defying it is argued with the world rather than carried in the body,
     and it is charged as stress and interest but not as this. */
  const betrayed = mandates.filter((m) => m.stance === 'defied' && FN[m.fn].att === 'i');
  const betrayal = betrayed.reduce((s, m) => s + ECON.BETRAYAL * m.strength, 0) * raw * 0.5;

  /* ---- 4. flow: work the dominant genuinely owns pays some of itself back ----
     "Genuinely owns" means native. A dominant doing its axis-partner's job in
     translation is working out of its own attitude — which is the opposite of
     flow, and must not be refunded as if it were. */
  const domLines = lines.filter((l) => l.rank === 'dom' && l.mode === 'native');
  const domShare = domLines.reduce((s, l) => s + l.share, 0);
  const refund = domShare >= ECON.FLOW_SHARE
    ? domLines.reduce((s, l) => s + l.cost, 0) * ECON.FLOW_REFUND
    : 0;

  const energy = Math.max(1, raw - subsidy - refund + betrayal);

  /* ---- 5. stress, itemized ---- */
  const stressItems = [];
  const infCost = lines.filter((l) => l.rank === 'inf').reduce((s, l) => s + l.share, 0);
  const tertCost = lines.filter((l) => l.rank === 'tert').reduce((s, l) => s + l.share, 0);
  const taxedCost = lines.filter((l) => l.tau > 1).reduce((s, l) => s + l.cost, 0);

  if (infCost > 0) {
    stressItems.push({
      key: 'surge', label: 'inferior surge',
      value: ECON.K * intensity * infCost * ECON.SURGE * audienceMul,
    });
  }
  if (tertCost > 0) {
    stressItems.push({
      key: 'strain', label: 'tertiary strain',
      value: ECON.K * intensity * tertCost * ECON.STRAIN,
    });
  }
  /* Exposure is the premium on being *seen* doing the thing you are bad at.
     It is owed only in proportion to how much of the act happens out in the
     world: an action whose whole signature is introverted is performed
     nowhere the audience can reach, and is charged nothing for them.
     (Without this, the model bills a person for thinking quietly.) */
  const publicShare = Object.entries(action.signature || {})
    .filter(([k]) => FN[k].att === 'e')
    .reduce((s, [, v]) => s + v, 0);
  if (taxedCost > 0 && audience > 0 && publicShare > 0) {
    stressItems.push({
      key: 'exposure', label: `exposure · ${audience} watching`,
      value: ECON.EXPOSURE * taxedCost * audienceMul * publicShare,
    });
  }
  for (const m of mandates) {
    if (m.stance === 'defied') {
      stressItems.push({ key: 'defiance', label: `defied ${m.label}`, value: ECON.DEFIANCE * m.strength });
    } else if (m.stance === 'served') {
      stressItems.push({ key: 'relief', label: `${m.label} answered`, value: -ECON.RELIEF * m.strength });
    } else if (m.stance === 'deferred') {
      stressItems.push({ key: 'relief', label: `${m.label} deferred`, value: -ECON.RELIEF * m.strength * 0.4 });
    }
  }

  /* ---- 6. pleasure, itemized ---- */
  const pleasureItems = [];
  const machinery = lines.reduce(
    (s, l) => s + ECON.K * intensity * l.share * ECON.P_RATE[l.rank] / l.tau, 0);
  pleasureItems.push({ key: 'machinery', label: 'machinery', value: machinery });
  const vindication = ECON.VINDICATION * (served.length ? backing : 0);
  if (vindication > 0) pleasureItems.push({ key: 'vindication', label: 'vindication', value: vindication });
  if (refund > 0) pleasureItems.push({ key: 'flow', label: 'flow', value: refund * 0.6 });

  /* ---- 7. what is left unanswered keeps charging interest ---- */
  const unresolved = mandates.filter((m) => m.stance === 'defied' || m.stance === 'unaddressed');
  const interest = unresolved.reduce((s, m) => s + ECON.INTEREST * m.strength, 0);

  const sum = (a) => a.reduce((s, x) => s + x.value, 0);
  return {
    action, scenario: scenario.id, code: vessel.code,
    lines, raw, subsidy, refund, betrayal, energy,
    stress: { items: stressItems, total: sum(stressItems) },
    pleasure: { items: pleasureItems, total: sum(pleasureItems) },
    mandates, interest, audience,
  };
}

/* ---------- the forecast ---------- */

/**
 * What this Vessel would probably do if nobody forced its hand.
 * Shown *before* the choice, so that forcing an unlikely action is a
 * legible act of defiance rather than a shrug — and so the claim
 * "types differ in probability, not ability" is on screen and falsifiable.
 */
export function forecast(actions, vessel, scenario, briefing, T = ECON.TEMP) {
  const priced = actions.map((a) => {
    const r = resolve(a, vessel, scenario, briefing);
    return { action: a, receipt: r, burden: r.energy + r.stress.total - 0.5 * r.pleasure.total };
  });
  const best = Math.min(...priced.map((p) => p.burden));
  const exps = priced.map((p) => Math.exp(-(p.burden - best) / T));
  const total = exps.reduce((s, e) => s + e, 0);
  return priced.map((p, i) => ({ ...p, p: exps[i] / total }));
}
