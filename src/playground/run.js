/* ============================================================
   CURRENTS · Playground — the run controller
   Owns the Session, the resolved Scenario, and the beat queue.
   The only place in the product that mutates simulation state.
   BUILD-SPEC §2.4, §2.5, §6.1.
   ============================================================ */
import { FN, RANKS } from './types.js';
import { RANK_PROFILE, TIER_SPEC, tierFor } from './model.js';
import { resolveScenario } from './scenario.js';
import {
  newSession, aggregate, computeCommit, forecast, decayBeat,
  likelihoods, restingInvolvement, stateHash, debtOf,
} from './engine.js';
import { evaluateTransition, updateLoopArming, margins, loopConditionHolds } from './machine.js';
import { generateStateActions } from './generate.js';
import { idleLineFor, STALLED } from './corpus.js';
import { clock } from './clock.js';
import { clamp } from '../utils/math.js';
import { REDUCED } from '../utils/dom.js';

const INTAKE_GAP = 340;      /* ms between the four intake beats */
const AFTERMATH_GAP = 300;   /* ms between b6, b7, b8 */

export class Run {
  constructor() {
    this.session = null;
    this.scenario = null;
    this.candidate = null;      /* actionId currently forecast, or null */
    this.deck = [];
    this.odds = {};
    this.cache = new Map();
    this.listeners = {};
    this.phase = 'idle';        /* idle | intake | dwell | resolving | resolved */
    this.lastRecord = null;
    this.focused = null;        /* fn key promoted to FULL tier */
  }

  /* ---------- events ---------- */
  on(evt, fn) { (this.listeners[evt] ||= []).push(fn); return this; }
  emit(evt, payload) { (this.listeners[evt] || []).forEach((f) => f(payload)); }

  /* ---------- lifecycle ---------- */

  build(stack) {
    this.session = newSession(stack);
    this.cache.clear();
    this.emit('change');
    return this;
  }

  enterScenario(raw) {
    const s = this.session;
    this.scenario = resolveScenario(raw, s.stack);
    this.candidate = null;
    this.lastRecord = null;
    this.cache.clear();
    this.phase = 'intake';
    s.scenariosRun += 1;

    /* clear the streams — a new situation, same psyche */
    RANKS.forEach((r) => { s.fnStates[s.stack[r]].lines = []; });

    /* resting involvement, before anyone acts */
    const rest = restingInvolvement(s, this.scenario);
    RANKS.forEach((r) => { s.fnStates[s.stack[r]].involvement = rest[s.stack[r]]; });
    s.human = aggregate(s);

    this.rebuildDeck();
    this.emit('change');

    /* §6.1 — the four intake beats fire in STACK ORDER. The trace has
       meaningful history before the user has done anything, and that
       history teaches stack order for free. */
    clock.clearQueue();
    RANKS.forEach((r, i) => {
      clock.after(INTAKE_GAP * (i + 1), () => this.intakeBeat(r));
    });
    clock.after(INTAKE_GAP * 4 + 120, () => { this.phase = 'dwell'; this.emit('change'); });
    return this;
  }

  intakeBeat(rank) {
    const s = this.session;
    const k = s.stack[rank];
    const st = s.fnStates[k];
    const pre = this.scenario.predispositions[k];
    const R = RANK_PROFILE[rank];
    const bypassed = s.machine === 'loop' && rank === 'aux';

    const overload = pre.registration === 'OVERLOADED' ? 1.8 : pre.registration === 'IDLE' ? 0.35 : 1;
    if (!bypassed) {
      st.stress = clamp(st.stress + 6 * pre.gate * R.stress * overload, 0, 100);
      st.pleasure = clamp(st.pleasure + 7 * pre.affinity, 0, 100);
      st.capacity -= 2 * pre.gate * R.cost;
    }

    const stateLine = idleLineFor(k, s.machine, s.beatIndex);
    const text = bypassed ? STALLED[k] : (stateLine || pre.statement || `${FN[k].name} registers the situation.`);
    this.pushLine(k, text, bypassed ? 'stalled' : 'intake');

    s.human = aggregate(s);
    this.pushBeat('intake', k);
    this.cache.clear();
    this.emit('beat', { kind: 'intake', fn: k });
    this.emit('change');
  }

  /* ---------- streams ---------- */

  pushLine(fn, text, kind) {
    const st = this.session.fnStates[fn];
    st.lines.push({ text, beat: this.session.beatIndex, kind });
    if (st.lines.length > 6) st.lines.shift();   /* six nodes maximum, recycled */
  }

  /* ---------- beats ---------- */

  pushBeat(kind, fn) {
    const s = this.session;
    s.beatIndex += 1;
    if (s.machine === 'loop') s.loopHeldBeats += 1;
    const sample = { agg: s.human.stress };
    RANKS.forEach((r) => { sample[s.stack[r]] = s.fnStates[s.stack[r]].stress; });
    s.trace.push(sample, { kind, fn, index: s.beatIndex });
  }

  /* ---------- deck ---------- */

  rebuildDeck() {
    const s = this.session;
    const authored = this.scenario.actions;
    const generated = (s.machine === 'loop' || s.machine === 'grip')
      ? generateStateActions(s.machine, s.stack, this.scenario) : [];
    this.deck = [...authored, ...generated];
    this.odds = likelihoods(s, this.scenario, this.deck);
  }

  /* ---------- hover — §2.1, pure, free, exactly reversible ---------- */

  setCandidate(actionId) {
    if (this.candidate === actionId) return;
    this.candidate = actionId;
    this.emit('candidate', actionId ? this.forecastFor(actionId) : null);
  }

  forecastFor(actionId) {
    const key = `${actionId}:${stateHash(this.session)}`;
    const hit = this.cache.get(key);
    if (hit) return hit;
    const action = this.deck.find((a) => a.id === actionId);
    if (!action) return null;
    const f = forecast(this.session, this.scenario, action, (c) => this.projectThresholds(c));
    this.cache.set(key, f);
    return f;
  }

  /** Would committing this cross a threshold? Answered before the commit,
      using the same projected state the commit will produce. */
  projectThresholds(c) {
    const s = this.session;
    const probe = {
      ...s,
      fnStates: c.settled,
      human: c.settledHuman,
      loopArmedCommits: loopConditionHolds({ ...s, fnStates: c.settled, human: c.settledHuman })
        ? s.loopArmedCommits + 1 : 0,
      loopHeldBeats: s.loopHeldBeats + 4,
    };
    const t = evaluateTransition(probe, { rel: c.rel });
    return {
      crossesLoop: t?.to === 'loop',
      crossesGrip: t?.to === 'grip',
      transition: t,
    };
  }

  /* ---------- commit — §2.5, the only mutation ---------- */

  commit(actionId) {
    if (this.phase !== 'dwell') return;
    const s = this.session;
    const action = this.deck.find((a) => a.id === actionId);
    if (!action) return;

    this.phase = 'resolving';
    this.candidate = null;

    const c = computeCommit(s, this.scenario, action);
    const before = {};
    RANKS.forEach((r) => { before[s.stack[r]] = { ...s.fnStates[s.stack[r]] } });
    const mBefore = margins(s);
    const marginsBefore = { loop: mBefore.loop.in ? 'IN' : mBefore.loop.pts, grip: mBefore.grip.in ? 'IN' : mBefore.grip.pts };

    /* 2 — apply the impact */
    RANKS.forEach((r) => {
      const k = s.stack[r];
      const keep = s.fnStates[k].lines;
      s.fnStates[k] = { ...c.afterImpact[k], lines: keep };
      this.pushLine(k, c.per[k].streamLine, 'action');
    });
    s.human = aggregate(s);
    this.pushBeat('commit', null);
    this.cache.clear();
    this.emit('beat', { kind: 'commit' });
    this.emit('change');

    /* 4 — the three aftermath beats, played out so the user watches the
       bill land. decayBeat is the same function computeCommit used, so
       these land on exactly the numbers the forecast showed. */
    const kinds = ['impact', 'spend', 'settle'];
    kinds.forEach((kind, i) => {
      clock.after(AFTERMATH_GAP * (i + 1), () => {
        const next = decayBeat(s.fnStates, s.stack, s.machine);
        RANKS.forEach((r) => {
          const k = s.stack[r];
          s.fnStates[k] = { ...next[k], lines: s.fnStates[k].lines };
        });
        s.human = aggregate(s);
        this.pushBeat('aftermath', null);
        this.emit('beat', { kind });
        this.emit('change');
      });
    });

    /* 5 — evaluate the machine ONCE, after b8 */
    clock.after(AFTERMATH_GAP * 3 + 180, () => {
      updateLoopArming(s);
      const t = evaluateTransition(s, { rel: c.rel });
      if (t) this.applyTransition(t);

      const after = {};
      RANKS.forEach((r) => { after[s.stack[r]] = { ...s.fnStates[s.stack[r]] } });

      const record = {
        runId: `${this.scenario.id}-${s.runs.length + 1}`,
        scenarioId: this.scenario.id,
        action, before, after,
        per: c.per,
        bill: c.bill,
        odds: this.odds[action.id] ?? 0,
        outcome: this.scenario.outcomeFor(action.id, s.machine),
        humanBefore: aggregate({ ...s, fnStates: before }),
        humanAfter: { ...s.human },
        transition: t || null,
        routed: c.routed,
        marginsBefore,
      };
      s.runs.push(record);
      this.lastRecord = record;
      this.phase = 'resolved';
      this.cache.clear();
      this.emit('change');
      this.emit('resolved', record);
    });
  }

  applyTransition(t) {
    const s = this.session;
    s.machine = t.to;
    s.manual = false;
    s.loopHeldBeats = 0;
    this.reseat();
    this.rebuildDeck();
  }

  /**
   * A state transition rewrites who is doing the work, so involvement must
   * be recomputed against the new state bias — otherwise the spine keeps
   * showing the pre-transition ratio and a Loop looks identical to Balanced
   * in the one readout that is supposed to answer "who is running this?".
   * State bias is applied before normalisation, so the four still sum to 1.
   */
  reseat() {
    const s = this.session;
    if (!this.scenario) return;
    const rest = restingInvolvement(s, this.scenario);
    RANKS.forEach((r) => { s.fnStates[s.stack[r]].involvement = rest[s.stack[r]]; });
    s.human = aggregate(s);
  }

  /* ---------- teaching overrides — §5.3 ---------- */

  setManual(state, on) {
    const s = this.session;
    if (on) {
      s.machine = state;
      s.manual = true;
      s.loopHeldBeats = 0;
    } else {
      /* toggling off routes to RECOVERY, not to Balanced, so the wear the
         demonstration produced is still real */
      s.machine = 'recovery';
      s.manual = false;
    }
    RANKS.forEach((r) => {
      const k = s.stack[r];
      const line = idleLineFor(k, s.machine, s.beatIndex);
      if (line) this.pushLine(k, line, 'state');
      if (s.machine === 'loop' && r === 'aux') this.pushLine(k, STALLED[k], 'stalled');
    });
    this.reseat();
    s.human = aggregate(s);
    this.cache.clear();
    this.rebuildDeck();
    this.pushBeat('state', null);
    this.emit('change');
  }

  forceExit() {
    const s = this.session;
    s.machine = 'recovery';
    s.manual = false;
    s.loopHeldBeats = 0;
    s.loopArmedCommits = 0;
    this.reseat();
    this.cache.clear();
    this.rebuildDeck();
    this.pushBeat('state', null);
    this.emit('change');
  }

  /** Spend beats doing nothing. Decay runs; debt does not clear itself. */
  restBeat() {
    const s = this.session;
    const next = decayBeat(s.fnStates, s.stack, s.machine);
    RANKS.forEach((r) => {
      const k = s.stack[r];
      s.fnStates[k] = { ...next[k], lines: s.fnStates[k].lines };
    });
    s.human = aggregate(s);
    this.pushBeat('idle', null);
    if (!s.manual) {
      const t = evaluateTransition(s, { rel: {} });
      if (t) this.applyTransition(t);
    }
    this.cache.clear();
    this.emit('change');
  }

  /* ---------- presentation helpers ---------- */

  tier(fn) {
    const s = this.session;
    const rank = RANKS.find((r) => s.stack[r] === fn);
    return tierFor(rank, s.machine, this.focused === fn);
  }

  tierSpec(fn) { return TIER_SPEC[this.tier(fn)]; }

  margins() { return margins(this.session); }

  setFocus(fn) {
    if (this.focused === fn) return;
    this.focused = fn;
    this.emit('change');
  }

  reset() {
    const stack = this.session.stack;
    this.build(stack);
    this.scenario = null;
    this.deck = [];
    this.phase = 'idle';
    this.lastRecord = null;
    clock.clearQueue();
    this.emit('change');
  }
}

export const runOf = (stack) => new Run().build(stack);
