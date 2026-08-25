/* ============================================================
   CURRENTS · Playground — S3/S4/S7/S8, the run view
   Strategy A "The Ledger": rank-ordered rows, the involvement
   spine grafted from Strategy B, fidelity tiering grafted from
   Strategy C, and the aggregate as a persistent band.

   This is ONE mount. Hover, row focus, aggregate expansion,
   Loop and Grip are all states of this component — none of them
   unmounts it, because the beat clock and the ring buffer live
   here. (Diagram D1.)
   ============================================================ */
import { FN, RANKS } from '../types.js';
import { VISIBLE_BEATS, rowFlex } from '../model.js';
import { ReactionWindow } from './row.js';
import { Spine, ActionRail, Envelope, ControlBar } from './panels.js';
import { WholeHuman } from './human.js';
import { deckNote } from '../generate.js';

export class RunView {
  constructor(run, handlers) {
    this.run = run;
    this.h = handlers;

    const el = document.createElement('section');
    el.className = 'pg-screen pg-run';
    this.el = el;

    this.envelope = new Envelope({ onBrief: handlers.onBrief });
    this.spine = new Spine();
    this.human = new WholeHuman({ onToggle: () => this.refresh() });
    this.rail = new ActionRail({
      onHover: (id) => run.setCandidate(id),
      onCommit: (id) => run.commit(id),
    });
    this.controls = new ControlBar({
      onManual: (state, on) => run.setManual(state, on),
      onForceExit: () => run.forceExit(),
      onRest: () => run.restBeat(),
      onReset: handlers.onReset,
      onSwap: handlers.onSwap,
    });

    const body = document.createElement('div');
    body.className = 'pg-env';
    body.append(this.envelope.el);

    const contract = document.createElement('div');
    contract.className = 'pg-contract';
    contract.hidden = true;
    contract.innerHTML = `<b>Hover = projection</b><span>nothing spent · nothing recorded · no beat consumed · leaving the card restores this screen exactly</span>`;
    this.contract = contract;

    const ledger = document.createElement('div');
    ledger.className = 'pg-ledger';
    this.rowsEl = document.createElement('div');
    this.rowsEl.className = 'pg-rows';

    this.circuit = document.createElement('div');
    this.circuit.className = 'pg-circuit';
    this.circuit.hidden = true;
    this.circuit.innerHTML = `<span class="cir-l"></span><b></b>`;

    this.rows = {};
    RANKS.forEach((r) => {
      const fn = run.session.stack[r];
      const w = new ReactionWindow(fn, r);
      w.el.addEventListener('pointerenter', () => run.setFocus(fn));
      w.el.addEventListener('focusin', () => run.setFocus(fn));
      w.el.addEventListener('pointerleave', () => run.setFocus(null));
      this.rows[fn] = w;
      this.rowsEl.appendChild(w.el);
    });

    ledger.append(this.circuit, this.rowsEl, this.spine.el, this.rail.el);
    body.append(contract, ledger, this.human.el, this.controls.el);
    el.append(body);

    run.on('change', () => this.refresh());
    run.on('candidate', (f) => this.applyCandidate(f));
  }

  destroy() { Object.values(this.rows).forEach((r) => r.destroy()); }

  tick(dt) {
    Object.values(this.rows).forEach((r) => r.tick(dt));
    this.human.tick(dt);
  }

  applyCandidate(f) {
    this.forecastNow = f;
    this.contract.hidden = !f;
    this.refresh();
  }

  refresh() {
    const run = this.run;
    const s = run.session;
    const f = run.candidate ? run.forecastFor(run.candidate) : null;
    this.forecastNow = f;
    const machine = s.machine;
    this.el.dataset.machine = machine;

    if (run.scenario) this.envelope.setScenario(run.scenario, s.stack);

    /* ---- rows ---- */
    RANKS.forEach((r) => {
      const fn = s.stack[r];
      const w = this.rows[fn];
      const tier = run.tier(fn);
      w.el.style.setProperty('--flex', rowFlex(r, machine));

      let badge = null, badgeKind = '';
      if (machine === 'loop' && r === 'dom') { badge = 'LOOP · A'; badgeKind = 'loop'; }
      else if (machine === 'loop' && r === 'tert') { badge = 'LOOP · B'; badgeKind = 'loop'; }
      else if (machine === 'grip' && r === 'inf') { badge = 'HIJACK'; badgeKind = 'grip'; }
      else if (s.fnStates[fn].routedInto) { badge = 'ROUTED WORK'; badgeKind = 'routed'; }
      else if (f && f.per[fn].routed) { badge = 'ROUTED WORK'; badgeKind = 'routed'; }

      if (tier === 'BYPASSED') {
        w.el.dataset.banner = `${FN[fn].label} is not consulted — the auxiliary is bypassed`;
      } else delete w.el.dataset.banner;

      const perF = f ? { ...f.per[fn], settledStress: f.settled ? f.per[fn].nextStress : undefined } : null;

      w.update({
        state: s.fnStates[fn],
        tier,
        machine,
        series: s.trace.window(fn, VISIBLE_BEATS),
        forecast: perF,
        badge, badgeKind,
      });
    });

    /* ---- the loop circuit, drawn outside the rows so it cannot be
            mistaken for a per-row readout ---- */
    if (machine === 'loop') {
      this.circuit.hidden = false;
      this.circuit.querySelector('b').textContent =
        `${FN[s.stack.dom].label} ⇅ ${FN[s.stack.tert].label}`;
    } else this.circuit.hidden = true;

    /* ---- spine ---- */
    this.spine.update(s.stack, s.fnStates, machine, f ? f.per : null);

    /* ---- envelope ---- */
    const beatNote = run.phase === 'intake'
      ? 'the situation is landing — one beat per function, in stack order'
      : run.candidate
        ? 'hovering — no beat consumed, nothing spent'
        : run.phase === 'resolving' ? 'committed — the bill is landing'
          : `session beat ${s.beatIndex} · run ${s.scenariosRun} · ${s.runs.length} committed`;
    this.envelope.update(s, run.margins(), f, beatNote);

    /* ---- rail ---- */
    const note = deckNote(machine, s.stack);
    this.rail.setHeader(note.title, note.sub);
    if (this.deckSig !== run.deck.map((a) => a.id).join(',')) {
      this.deckSig = run.deck.map((a) => a.id).join(',');
      this.rail.setDeck(run.deck, s.stack, run.odds);
    } else this.rail.setOdds(run.odds);
    this.rail.sync(run.candidate);
    this.rail.setLocked(run.phase !== 'dwell');

    /* ---- aggregate + controls ---- */
    this.human.update(s, s.trace.window('agg', VISIBLE_BEATS), f);
    this.controls.update(s);
  }
}
