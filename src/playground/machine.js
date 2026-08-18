/* ============================================================
   CURRENTS · Playground — the state machine
   Balanced · Strained · Loop · Grip · Recovery.
   BUILD-SPEC §5, diagram D3.

   Evaluated EXACTLY ONCE per commit, against session-cumulative
   load. Never on a timer, never during hover — evaluating during
   hover would make the forecast a lie.
   ============================================================ */
import { RANKS } from './types.js';
import { TH } from './model.js';
import { debtOf } from './engine.js';

export const loopPressure = (session) => {
  const { stack, fnStates } = session;
  return (fnStates[stack.dom].stress + fnStates[stack.tert].stress) / 2 - fnStates[stack.aux].stress;
};

/** The loop's arming condition, checked on every commit. */
export function loopConditionHolds(session) {
  return loopPressure(session) > TH.loopPressure
      && session.fnStates[session.stack.aux].involvement < TH.loopShareIn;
}

/**
 * The two "distance to break" margins in the header — the Q-C glance.
 * Returns points of remaining margin, 0..1 fill, and whether we are in it.
 */
export function margins(session) {
  const S = session.human.stress;
  const dom = session.fnStates[session.stack.dom];
  const aux = session.fnStates[session.stack.aux];

  /* to LOOP: the binding constraint is whichever of the two conditions is
     furthest from satisfied, expressed on a common 0..100 scale */
  const pressureGap = Math.max(0, TH.loopPressure - loopPressure(session));
  const shareGap = Math.max(0, (aux.involvement - TH.loopShareIn) * 400);
  const loopPts = Math.round(Math.max(pressureGap, shareGap));
  const inLoop = session.machine === 'loop';

  /* to GRIP: whichever of the two routes is closest to opening.
     Route A — stress and a spent dominant. Route B — accumulated debt. */
  const E = session.human.energy;
  const routeA = Math.max(Math.max(0, TH.gripStress - S), Math.max(0, E - TH.gripEnergy));
  const routeB = Math.max(Math.max(0, TH.gripDebtStress - S), Math.max(0, TH.gripDebt - session.human.debt), Math.max(0, E - TH.gripDebtEnergy));
  const gripPts = Math.round(Math.min(routeA, routeB));
  const inGrip = session.machine === 'grip';

  return {
    loop: { pts: loopPts, fill: 1 - Math.min(1, loopPts / 60), in: inLoop, n_a: inGrip },
    grip: { pts: gripPts, fill: 1 - Math.min(1, gripPts / 90), in: inGrip },
  };
}

/**
 * The single evaluation. Pure — returns a transition or null.
 * @param {object} session   state AFTER the commit's beats have played
 * @param {object} ctx       { rel } relations the committed action bore
 */
export function evaluateTransition(session, ctx = {}) {
  /* §5.3 — a manual state suppresses automatic evaluation entirely */
  if (session.manual) return null;

  const { stack, fnStates } = session;
  const S = session.human.stress;
  const E = session.human.energy;
  const debt = session.human.debt;
  const dom = fnStates[stack.dom];
  const aux = fnStates[stack.aux];
  const rel = ctx.rel || {};
  const violatedTop = rel[stack.dom] === 'violates' || rel[stack.aux] === 'violates';

  const to = (next, cause) => ({ from: session.machine, to: next, cause });

  switch (session.machine) {
    case 'balanced':
      if (S >= TH.strainEnter) return to('strained', `aggregate stress ${Math.round(S)} crossed ${TH.strainEnter}`);
      return null;

    case 'strained':
      /* §5.2 invariant 1 — grip supersedes loop, so it is tested first */
      if (S >= TH.gripStress && E <= TH.gripEnergy && violatedTop) {
        return to('grip', `stress ${Math.round(S)} ≥ ${TH.gripStress}, reservoir down to ${Math.round(E)}%, and the action violated a top-two mandate`);
      }
      /* the debt route — spending you did not have, for long enough */
      if (S >= TH.gripDebtStress && debt >= TH.gripDebt && E <= TH.gripDebtEnergy) {
        return to('grip', `debt ${Math.round(debt)} on a reservoir at ${Math.round(E)}% with stress ${Math.round(S)} — the bill came due`);
      }
      if (session.loopArmedCommits >= TH.loopArmCommits && loopConditionHolds(session)) {
        return to('loop', `${stack.aux.toUpperCase()} bypassed on ${TH.loopArmCommits} consecutive commits with loop pressure ${Math.round(loopPressure(session))}`);
      }
      if (S < TH.strainExit && debt === 0) return to('balanced', `aggregate stress ${Math.round(S)} fell below ${TH.strainExit} with no debt`);
      return null;

    case 'loop':
      if (session.loopHeldBeats >= TH.loopToGripBeats && S >= TH.loopToGripStress) {
        return to('grip', `loop held ${session.loopHeldBeats} beats with stress ${Math.round(S)} ≥ ${TH.loopToGripStress}`);
      }
      if (aux.involvement >= TH.loopShareOut && dom.stress < TH.loopExitDomStress) {
        return to('strained', `${stack.aux.toUpperCase()} involvement ${(aux.involvement * 100).toFixed(0)}% cleared ${TH.loopShareOut * 100}% and ${stack.dom.toUpperCase()} stress fell below ${TH.loopExitDomStress}`);
      }
      return null;

    case 'grip':
      /* §5.2 invariant 4 — grip has exactly one exit */
      if (S < TH.gripExit) return to('recovery', `aggregate stress ${Math.round(S)} fell below ${TH.gripExit}`);
      return null;

    case 'recovery':
      if (S >= TH.relapse) return to('grip', `relapse — stress climbed back to ${Math.round(S)}`);
      /* §5.2 invariant 5 — cannot complete while debt is outstanding */
      if (S < TH.recoverStress && debt === 0 && dom.capacity >= TH.recoverDomCap) {
        return to('balanced', `stress ${Math.round(S)} < ${TH.recoverStress}, debt cleared, ${stack.dom.toUpperCase()} capacity back to ${Math.round(dom.capacity)}`);
      }
      return null;

    default:
      return null;
  }
}

/** Arming counter, updated once per commit alongside the evaluation. */
export function updateLoopArming(session) {
  session.loopArmedCommits = loopConditionHolds(session) ? session.loopArmedCommits + 1 : 0;
}

/** A plain-language reason a state is being reported, for the chip subtitle. */
export function stateReason(session) {
  const { stack } = session;
  switch (session.machine) {
    case 'loop': return `${stack.dom.toUpperCase()}–${stack.tert.toUpperCase()} · ${stack.aux.toUpperCase()} bypassed`;
    case 'grip': return `${stack.inf.toUpperCase()} hijack${session.human.debt > 0 ? ' · in debt' : ''}`;
    case 'recovery': return session.human.debt > 0 ? `debt ${Math.round(session.human.debt)} outstanding` : 'decay at 1.6×';
    case 'strained': return 'under load, nothing broken';
    default: return 'no bypass · no hijack';
  }
}
