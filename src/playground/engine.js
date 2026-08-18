/* ============================================================
   CURRENTS · Playground — the simulation engine
   Everything in this file is PURE. It reads state and returns
   new values; it never mutates anything it was handed and never
   touches the DOM. BUILD-SPEC §3, §4.

   The correctness property the whole product rests on:
   `computeCommit()` is called by BOTH the hover forecast and the
   commit. Not "the same formula" — literally the same function.
   A forecast computed differently from the commit is a lie.
   ============================================================ */
import { FN, RANKS } from './types.js';
import {
  RANK_PROFILE, TOTAL_CAPACITY, STRESS_REL, PLEASURE_REL, STATE_MULT,
  STATE_DECAY, BASE_DECAY, CAP_REGEN, DEBT_REPAY, SOFTMAX_T, TRACE_LEN,
  ALLEVIATE, AGGRAVATE, UTILITY_W,
} from './model.js';
import { routeSignature, routeMandates } from './scenario.js';
import { voiceFor, variantOf } from './corpus.js';
import { clamp } from '../utils/math.js';

/* ============================================================
   Trace ring — fixed allocation at mount, never grown.
   5 × Float32Array(256) ≈ 5 KB for the whole product.
   ============================================================ */
export class TraceRing {
  constructor(keys) {
    this.keys = keys;
    this.buf = {};
    keys.forEach((k) => { this.buf[k] = new Float32Array(TRACE_LEN); });
    this.meta = new Array(TRACE_LEN);
    this.head = 0;
    this.len = 0;
  }
  push(sample, meta) {
    const i = this.head;
    this.keys.forEach((k) => { this.buf[k][i] = sample[k] ?? 0; });
    this.meta[i] = meta;
    this.head = (this.head + 1) % TRACE_LEN;
    this.len = Math.min(this.len + 1, TRACE_LEN);
  }
  /** Last `n` samples for one key, oldest first. Allocates one small array. */
  window(key, n) {
    const out = new Float32Array(Math.min(n, this.len));
    const src = this.buf[key];
    for (let i = 0; i < out.length; i++) {
      const idx = (this.head - out.length + i + TRACE_LEN * 2) % TRACE_LEN;
      out[i] = src[idx];
    }
    return out;
  }
  windowMeta(n) {
    const c = Math.min(n, this.len); const out = [];
    for (let i = 0; i < c; i++) out.push(this.meta[(this.head - c + i + TRACE_LEN * 2) % TRACE_LEN]);
    return out;
  }
  clear() { this.head = 0; this.len = 0; }
}

/* ============================================================
   Construction
   ============================================================ */

export function newFunctionState(fn, rank) {
  return {
    fn, rank,
    capacity: RANK_PROFILE[rank].capacity,
    stress: 0,
    pleasure: 0,
    involvement: RANK_PROFILE[rank].weight,
    routedInto: false,
    lines: [],           /* StreamLine[] — {text, beat, kind} */
  };
}

export function newSession(stack) {
  const fnStates = {};
  RANKS.forEach((r) => { fnStates[stack[r]] = newFunctionState(stack[r], r); });
  const s = {
    stack,
    fnStates,
    machine: 'balanced',
    manual: false,
    beatIndex: 0,
    runs: [],
    loopHeldBeats: 0,
    loopArmedCommits: 0,
    trace: new TraceRing([...RANKS.map((r) => stack[r]), 'agg']),
    scenariosRun: 0,
  };
  s.human = aggregate(s);
  return s;
}

export const stackKeys = (stack) => RANKS.map((r) => stack[r]);
export const debtOf = (st) => Math.max(0, -st.capacity);

/* ============================================================
   §4 Aggregation — four function states into one human state
   ============================================================ */

export function aggregate(session) {
  const { stack, fnStates } = session;
  const keys = stackKeys(stack);
  const w = RANKS.map((r) => RANK_PROFILE[r].weight);

  let capPos = 0, capNeg = 0;
  keys.forEach((k) => {
    const c = fnStates[k].capacity;
    if (c > 0) capPos += c; else capNeg += -c;
  });
  /* §4.1 — a SUM is correct: libido is one reservoir with four draws.
     Debt is taxed at 1.5×, because borrowing costs more than it returns. */
  const energyRaw = capPos - 1.5 * capNeg;
  const energy = clamp((energyRaw / TOTAL_CAPACITY) * 100, 0, 100);

  /* §4.2 — peak-weighted blend, NOT a mean. Stress is a bottleneck
     quantity: one function at 90 while three sit at 10 is a person in
     trouble, not a person at 30. Identity holds (all-equal in → same
     value out), it is monotone, and it is bounded by max. */
  const stresses = RANKS.map((r) => fnStates[stack[r]].stress);
  const peak = Math.max(...stresses);
  const wMeanStress = stresses.reduce((a, s, i) => a + s * w[i], 0);
  const stress = clamp(0.6 * peak + 0.4 * wMeanStress, 0, 100);
  const naiveMeanStress = stresses.reduce((a, s) => a + s, 0) / 4;

  /* §4.3 — pleasure does not sum, because satisfactions conflict.
     Measured across the AXIS pairs, which are the pairs the type
     algebra says are opposed. Produces the "I got what I wanted and it
     feels hollow" artifact, which is a feature. */
  const p = RANKS.map((r) => fnStates[stack[r]].pleasure);
  const conflict = clamp((Math.abs(p[0] - p[3]) + Math.abs(p[1] - p[2])) / 200, 0, 1);
  const wMeanPleasure = p.reduce((a, v, i) => a + v * w[i], 0);
  const pleasure = clamp(wMeanPleasure * (1 - 0.55 * conflict), 0, 100);

  /* §4.4 — involvement already sums to 1, so the aggregate reports its
     SPREAD instead. 1.0 = all four equally engaged. */
  let H = 0;
  keys.forEach((k) => {
    const i = fnStates[k].involvement;
    if (i > 1e-6) H -= i * Math.log(i);
  });
  const evenness = clamp(H / Math.log(4), 0, 1);

  /* §4.5 — impressions in / expressions out across the skin */
  const io = { novel: 0, referential: 0, visible: 0, internal: 0 };
  keys.forEach((k) => {
    const f = FN[k]; const st = fnStates[k];
    const load = st.involvement * (0.35 + 0.65 * (st.pleasure + st.stress) / 100);
    if (f.cls === 'perceive') {
      if (f.att === 'e') io.novel += load; else io.referential += load;
    } else if (f.att === 'e') io.visible += load * 1.0;
    else io.internal += load * 0.35;
  });

  return {
    energy, stress, pleasure, evenness,
    debt: keys.reduce((a, k) => a + debtOf(fnStates[k]), 0),
    conflict, naiveMeanStress,
    in: { novel: io.novel, referential: io.referential },
    out: { visible: io.visible, internal: io.internal },
  };
}

/* ============================================================
   §3.4 The per-function kernel — one pure call per function.
   No shared mutable state between the four calls, so they are
   order-independent and individually memoisable.
   ============================================================ */

function kernel(fn, st, action, scenario, machine, routed, rel) {
  const R = RANK_PROFILE[st.rank];
  const SM = STATE_MULT[machine][st.rank];
  const pre = scenario.predispositions[fn];
  const share = routed.share[fn];
  const gate = pre.gate;
  const rp = routed.penalty[fn];
  const aff = pre.affinity;
  const I = action.intensity;

  const cost = Math.max(0, 100 * I * share * R.cost * gate * rp * SM.cost);
  const dStress = 100 * I * share * R.stress * gate * STRESS_REL[rel] * SM.stress
                + 0.4 * debtOf(st);
  const pleasureBonus = action.pleasureBonus && action.pleasureTarget === fn ? action.pleasureBonus : 1;
  const pleasure = clamp(100 * I * share * R.pleasure * aff * PLEASURE_REL[rel] * SM.pleasure * pleasureBonus, 0, 100);
  /* The floor is an ATTENDING weight, not a fudge: a function the action
     makes no demand of is still present and still watching, and a segment
     that collapses to literal zero would read as "removed from the stack",
     which is false. It is proportional to rank, so it never reorders the
     ratio — it only keeps every segment drawable and labelled. */
  const rawWeight = (Math.pow(Math.max(share, 0), 0.85) + 0.15 * R.weight) * aff * SM.bias;

  return { fn, cost, dStress, pleasure, rawWeight, rel, routed: rp > 1.001 };
}

/* ============================================================
   §3.6 One beat of decay, capacity regeneration, debt repayment.
   Pure: returns a new fnStates map.
   ============================================================ */

export function decayBeat(fnStates, stack, machine) {
  const out = {};
  for (const r of RANKS) {
    const k = stack[r]; const st = fnStates[k];
    const dec = BASE_DECAY * RANK_PROFILE[r].decay * (STATE_DECAY[machine][r] ?? 1);
    let capacity = st.capacity;
    const debt = debtOf(st);
    if (debt > 0) capacity = Math.min(0, capacity + (DEBT_REPAY[machine] || 0));
    else capacity = Math.min(RANK_PROFILE[r].capacity, capacity + (CAP_REGEN[machine] || 0));
    out[k] = {
      ...st,
      stress: clamp(st.stress - dec, 0, 100),
      pleasure: clamp(st.pleasure * 0.72, 0, 100),   /* pleasure is event-like; it fades fast */
      capacity,
    };
  }
  return out;
}

/* ============================================================
   computeCommit — the single source of truth.
   Called by the hover forecast AND by the commit. §2.1, §2.5.
   ============================================================ */

export function computeCommit(session, scenario, action, machineOverride) {
  const { stack } = session;
  const machine = machineOverride || session.machine;
  const routed = routeSignature(action, stack);
  const { rel, detail } = routeMandates(action, stack);

  /* 1 — four independent kernel calls */
  const per = {};
  const raw = {};
  for (const r of RANKS) {
    const k = stack[r];
    per[k] = kernel(k, session.fnStates[k], action, scenario, machine, routed, rel[k]);
    raw[k] = per[k].rawWeight;
  }

  /* 2 — §3.5 involvement normalisation: the ONLY cross-function step.
     State bias was applied inside rawWeight, BEFORE this. Applying it
     after would let the four stop summing to 1 and would break the
     spine's central claim. */
  const totalW = RANKS.reduce((a, r) => a + raw[stack[r]], 0) || 1;
  for (const r of RANKS) per[stack[r]].involvement = raw[stack[r]] / totalW;

  /* 3 — apply the impact (beat b5) */
  const afterImpact = {};
  for (const r of RANKS) {
    const k = stack[r]; const st = session.fnStates[k]; const d = per[k];
    afterImpact[k] = {
      ...st,
      capacity: st.capacity - d.cost,
      stress: clamp(st.stress + d.dStress, 0, 100),
      pleasure: d.pleasure,
      involvement: d.involvement,
      routedInto: d.routed,
    };
    d.wouldDebt = Math.max(0, d.cost - Math.max(0, st.capacity));
    d.dInvolvement = d.involvement - st.involvement;
    d.dCapacity = -d.cost;
    d.mandate = detail[k] || null;
    d.streamLine = voiceFor(k, d.rel, machine, variantOf(action.id + k));
  }

  /* 4 — the three aftermath beats, deterministic, so the forecast and the
     played-out commit land on exactly the same numbers */
  let settled = afterImpact;
  for (let i = 0; i < 3; i++) settled = decayBeat(settled, stack, machine);

  const impactHuman = aggregate({ ...session, fnStates: afterImpact });
  const settledHuman = aggregate({ ...session, fnStates: settled });

  return {
    action, routed, rel, per,
    afterImpact, settled,
    impactHuman, settledHuman,
    bill: buildBill(session, scenario, action, routed, rel, per, machine),
  };
}

/* ============================================================
   The itemised bill — every multiplier that touched the number,
   in the order the engine applied them. §S9 callout 4.
   ============================================================ */

function buildBill(session, scenario, action, routed, rel, per, machine) {
  const { stack } = session;
  const lines = [];
  lines.push({ label: 'base cost', note: `intensity ${action.intensity.toFixed(2)} × 100`, value: action.intensity * 100, heavy: false });

  for (const r of RANKS) {
    const k = stack[r]; const d = per[k]; const R = RANK_PROFILE[r];
    const pre = scenario.predispositions[k];
    if (d.cost < 0.05) continue;
    const base = 100 * action.intensity * routed.share[k] * R.cost;
    lines.push({
      label: `${FN[k].label} · share ${routed.share[k].toFixed(2)} × rank ${R.cost}`,
      note: r === 'dom' ? 'dominant machinery is cheap' : r === 'inf' ? 'inferior machinery is expensive' : `${r} machinery`,
      value: base, heavy: r === 'inf',
    });
    if (Math.abs(pre.gate - 1) > 0.02) {
      lines.push({ label: `${FN[k].label} · gate ${pre.gate.toFixed(2)}`, note: pre.gateNote, value: base * (pre.gate - 1), heavy: pre.gate > 1.15 });
    }
    if (routed.penalty[k] > 1.001) {
      const from = routed.notes.find((n) => n.to === k);
      lines.push({
        label: `${FN[k].label} · routing ${routed.penalty[k].toFixed(2)}`,
        note: from ? `${FN[from.from].label} work translated into ${FN[k].label}` : 'routed work',
        value: base * pre.gate * (routed.penalty[k] - 1), heavy: true,
      });
    }
  }

  const relCounts = {};
  for (const r of RANKS) { const k = stack[r]; relCounts[rel[k]] = (relCounts[rel[k]] || 0) + 1; }
  const dominantRel = Object.entries(relCounts).filter(([k2]) => k2 !== 'neutral').sort((a, b) => b[1] - a[1])[0];
  if (dominantRel) {
    lines.push({
      label: `relation · ${dominantRel[0]}`,
      note: `stress multiplier ${STRESS_REL[dominantRel[0]]} applied`,
      value: 0, heavy: false, meta: true,
    });
  }
  if (machine !== 'balanced') {
    lines.push({ label: `state · ${machine}`, note: 'state multipliers applied before aggregation', value: 0, heavy: true, meta: true });
  }
  return lines;
}

/* ============================================================
   The hover forecast — a thin projection of computeCommit.
   ============================================================ */

export function forecast(session, scenario, action, thresholds) {
  const c = computeCommit(session, scenario, action);
  const before = session.human;
  const after = c.impactHuman;

  const per = {};
  for (const r of RANKS) {
    const k = session.stack[r]; const d = c.per[k];
    per[k] = {
      fn: k,
      streamLine: d.streamLine,
      dStress: d.dStress - 0,
      dPleasure: d.pleasure - session.fnStates[k].pleasure,
      involvement: d.involvement,
      dInvolvement: d.dInvolvement,
      cost: d.cost,
      wouldDebt: d.wouldDebt,
      routed: d.routed,
      rel: d.rel,
      nextStress: c.afterImpact[k].stress,
      nextPleasure: c.afterImpact[k].pleasure,
      nextCapacity: c.afterImpact[k].capacity,
      attribution: session.machine === 'loop' ? 'LOOP' : session.machine === 'grip' ? 'GRIP' : null,
    };
  }

  const t = thresholds ? thresholds(c) : { crossesLoop: false, crossesGrip: false };

  return {
    actionId: action.id,
    per,
    settled: c.settledHuman,
    aggregate: {
      dEnergy: after.energy - before.energy,
      dStress: after.stress - before.stress,
      dPleasure: after.pleasure - before.pleasure,
      dEvenness: after.evenness - before.evenness,
      next: after,
      ...t,
    },
    _commit: c,
  };
}

/* ============================================================
   §3.8 Likelihood — "what would this psyche do unforced".
   The user may always override the argmax. That override is the
   pedagogical payload, and the receipt measures it against the
   forecast it defied.
   ============================================================ */

export function likelihoods(session, scenario, deck) {
  const W = UTILITY_W[session.machine] || UTILITY_W.balanced;
  const u = deck.map((a) => {
    const c = computeCommit(session, scenario, a);
    let cost = 0, stress = 0, pleasure = 0;
    for (const r of RANKS) {
      const k = session.stack[r];
      cost += c.per[k].cost;
      /* clamp per function: a single readout cannot exceed the scale it is
         reported on, and an unclamped 300 would saturate the softmax */
      stress += Math.min(100, c.per[k].dStress);
      pleasure += c.per[k].pleasure;
    }
    return -(cost + W.stress * stress - W.pleasure * pleasure);
  });
  const max = Math.max(...u);
  const ex = u.map((v) => Math.exp((v - max) / SOFTMAX_T));
  const sum = ex.reduce((a, b) => a + b, 0) || 1;
  const out = {};
  deck.forEach((a, i) => {
    let p = ex[i] / sum;
    if (a.axis === 'alleviate') p *= ALLEVIATE.oddsMult;
    if (a.axis === 'aggravate') p *= AGGRAVATE.oddsMult;
    out[a.id] = p;
  });
  /* renormalise after the axis multipliers so the deck still reads as odds */
  const tot = Object.values(out).reduce((a, b) => a + b, 0) || 1;
  Object.keys(out).forEach((k) => { out[k] /= tot; });
  return out;
}

/* ============================================================
   Resting involvement — what the four are doing before anyone
   acts. Rank weight, lifted by how well the situation feeds each
   function and lowered by what it costs them to be here.
   ============================================================ */

/** Which ranks is the current state actually ABOUT? */
function stateDriven(machine) {
  if (machine === 'loop') return { dom: true, tert: true };
  if (machine === 'grip') return { inf: true };
  return {};
}

export function restingInvolvement(session, scenario) {
  const { stack } = session;
  const driven = stateDriven(session.machine);
  const raw = {};
  for (const r of RANKS) {
    const k = stack[r]; const pre = scenario.predispositions[k];
    const SM = STATE_MULT[session.machine][r];
    /* A Loop and a Grip are ENDOGENOUS — the psyche's own machinery seizing,
       not a response to what the situation offers. So the situation's
       affinity may lift the driving function but must not suppress it: an
       Fe grip in a room with no audience is still an Fe grip. Without this
       floor, a scenario that starves the inferior produces a "grip" in
       which the inferior is not even the loudest function. */
    const aff = driven[r] ? Math.max(pre.affinity, 1) : pre.affinity;
    raw[k] = RANK_PROFILE[r].weight * aff * SM.bias / Math.max(0.5, pre.gate);
  }
  const tot = RANKS.reduce((a, r) => a + raw[stack[r]], 0) || 1;
  const out = {};
  RANKS.forEach((r) => { out[stack[r]] = raw[stack[r]] / tot; });
  return out;
}

/* ============================================================
   Memo key. Changes only on commit or on a state transition, so
   a repeat hover is a Map lookup and nothing else.
   ============================================================ */

export function stateHash(session) {
  const parts = [session.machine, session.manual ? 'M' : '-', session.beatIndex];
  for (const r of RANKS) {
    const st = session.fnStates[session.stack[r]];
    parts.push(`${st.capacity.toFixed(1)}:${st.stress.toFixed(1)}`);
  }
  return parts.join('|');
}
