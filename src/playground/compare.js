/* ============================================================
   CURRENTS · Playground — the counterfactual
   BUILD-SPEC S9 callouts 6–8. The product's thesis is
   comparative: one receipt teaches almost nothing, two receipts
   for the same action teach the whole model. So the strongest
   affordance on the resolution screen is "run this again on
   another psyche", not "next scenario".

   Counterfactual vessels are always FRESH, so the comparison is
   not contaminated by the current vessel's wear.
   ============================================================ */
import { FN, FN_KEYS, RANKS, deriveStack, typeCode, legalAux, opposite } from './types.js';
import { resolveScenario, normaliseAction } from './scenario.js';
import { newSession, computeCommit, likelihoods } from './engine.js';
import { RANK_LABEL } from './model.js';

/**
 * Three psyches chosen to make three different points:
 *   MIRROR      the user's inferior leads — the opposite person
 *   REORDER     the same four functions, different order
 *   NO OVERLAP  none of the same functions at all
 */
export function comparisonStacks(stack) {
  const out = [];

  const mirror = deriveStack(stack.inf, stack.tert);
  if (typeCode(mirror)) out.push({ stack: mirror, why: 'your inferior leads' });

  const reorder = deriveStack(stack.aux, stack.dom);
  if (typeCode(reorder)) out.push({ stack: reorder, why: 'same four, reordered' });

  const missing = FN_KEYS.filter((k) => !RANKS.some((r) => stack[r] === k));
  outer: for (const d of missing) {
    for (const a of legalAux(d)) {
      if (!missing.includes(a)) continue;
      const s = deriveStack(d, a);
      if (typeCode(s)) { out.push({ stack: s, why: 'no functions in common' }); break outer; }
    }
  }
  return out;
}

/**
 * Price the same action against several fresh vessels.
 * @param {object} rawScenario  the authored scenario object
 * @param {object} action       the committed action (authored or generated)
 * @param {object} userStack
 */
export function counterfactual(rawScenario, action, userStack) {
  const rows = [{ stack: userStack, why: 'yours', mine: true }, ...comparisonStacks(userStack)];

  return rows.map(({ stack, why, mine }) => {
    const session = newSession(stack);
    const sc = resolveScenario(rawScenario, stack);
    const local = sc.actions.find((a) => a.id === action.id) || normaliseAction(action);
    const c = computeCommit(session, sc, local);

    let energy = 0, stress = 0, pleasure = 0;
    let payer = null, payerCost = -1;
    for (const r of RANKS) {
      const k = stack[r]; const d = c.per[k];
      energy += d.cost; stress += d.dStress; pleasure += d.pleasure;
      if (d.cost > payerCost) { payerCost = d.cost; payer = { fn: k, rank: r, cost: d.cost }; }
    }

    const deck = sc.actions.some((a) => a.id === local.id) ? sc.actions : [...sc.actions, local];
    const odds = likelihoods(session, sc, deck)[local.id] ?? 0;

    return {
      code: typeCode(stack) || '—',
      stackLabel: RANKS.map((r) => FN[stack[r]].label).join(' '),
      why, mine: !!mine,
      energy: Math.round(energy),
      stress: Math.round(stress),
      pleasure: Math.round(pleasure),
      odds,
      human: c.impactHuman,
      payer,
      payerNote: payer
        ? `${FN[payer.fn].label} (${RANK_LABEL[payer.rank].toLowerCase()}) pays ${Math.round(payer.cost)} of the ${Math.round(energy)}`
        : '',
      routed: c.routed.routed,
      routedNote: c.routed.notes.map((n) => `${FN[n.from].label}→${FN[n.to].label}`).join(', '),
    };
  });
}
