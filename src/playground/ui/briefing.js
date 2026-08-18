/* ============================================================
   CURRENTS · Playground — S2, scenario browser and briefing
   Everything the simulation will use as input is stated here in
   plain language, before any action is priced. Nothing in a run
   is hidden information.
   ============================================================ */
import { FN, RANKS, typeCode } from '../types.js';
import { RANK_LABEL, RANK_PROFILE } from '../model.js';
import { resolveScenario } from '../scenario.js';
import { markSVG } from './marks.js';

const EL_VAR = { n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' };

export class Briefing {
  constructor({ scenarios, onEnter, onRebuild, onReset }) {
    this.scenarios = scenarios;
    this.onEnter = onEnter;
    this.selected = scenarios[0].id;
    this.session = null;

    const el = document.createElement('section');
    el.className = 'pg-screen pg-briefing';
    el.innerHTML = `
      <div class="br-head">
        <div>
          <span class="kick">playground · step 2 — situation</span>
          <h1>Choose a situation for this psyche</h1>
        </div>
        <div class="br-vessel">
          <span class="kick">vessel</span>
          <b class="bv-code">—</b>
          <span class="bv-stack"></span>
          <button type="button" class="btn small bv-rebuild">Rebuild</button>
        </div>
      </div>

      <div class="br-grid">
        <aside class="br-deck">
          <span class="kick">scenario deck</span>
          <div class="deck-list"></div>
          <div class="br-doctrine">
            <span class="kick">why a starved function is expensive</span>
            <p>Cost is machinery times context, never machinery alone. A dominant with nothing to eat — Se in a room where nothing is happening — runs hot too. The bars above set each function's cost gate before a single action is priced.</p>
          </div>
        </aside>

        <div class="br-panel">
          <header class="bp-head">
            <span class="kick">briefing — the predispositions, stated before you act</span>
            <h2 class="bp-title"></h2>
            <p class="bp-vig"></p>
          </header>
          <span class="kick bp-k">what each of your four already brings to this situation</span>
          <div class="bp-rows"></div>
          <div class="bp-carry">
            <span class="kick">carried in — this vessel is not fresh</span>
            <div class="carry-row"></div>
            <div class="carry-state">
              <b class="cs-state">Balanced</b>
              <span class="cs-margins"></span>
              <button type="button" class="btn small cs-reset">Reset to fresh</button>
            </div>
          </div>
          <div class="bp-foot">
            <div>
              <span class="kick">this deck</span>
              <p class="bp-deck-note"></p>
            </div>
            <button type="button" class="btn primary bp-enter">Enter situation ▸</button>
          </div>
        </div>
      </div>
      <p class="micro br-note">One scenario run = one decisive action. This is the only place the priors are stated in full; from here on they are compressed into the cost gates.</p>`;

    this.el = el;
    this.$ = (s) => el.querySelector(s);
    this.$('.bp-enter').addEventListener('click', () => {
      this.onEnter(this.scenarios.find((s) => s.id === this.selected));
    });
    this.$('.bv-rebuild').addEventListener('click', onRebuild);
    this.$('.cs-reset').addEventListener('click', onReset);
  }

  setSession(session, margins) {
    this.session = session;
    this.margins = margins;
    this.render();
  }

  render() {
    const s = this.session;
    if (!s) return;
    const { stack } = s;
    const code = RANKS.map((r) => FN[stack[r]].label).join(' ');
    this.$('.bv-code').textContent = typeCode(stack) || 'Free build';
    this.$('.bv-stack').innerHTML = RANKS.map((r) => `<i style="--fn-c:var(${EL_VAR[FN[stack[r]].el]})">${markSVG(stack[r], 16)}</i>`).join('') + `<em>${code}</em>`;

    /* deck cards */
    const list = this.$('.deck-list');
    list.innerHTML = '';
    for (const raw of this.scenarios) {
      const sc = resolveScenario(raw, stack);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'sc-card';
      card.dataset.on = raw.id === this.selected ? 'true' : 'false';
      card.innerHTML = `
        <b>${sc.title}</b>
        <span class="sc-blurb">${sc.blurb}</span>
        <span class="kick">what it feeds in your stack</span>
        <span class="sc-feeds">
          ${RANKS.map((r) => {
            const k = stack[r]; const f = sc.feed[k];
            return `<span class="fd" style="--fn-c:var(${EL_VAR[FN[k].el]})">
              ${markSVG(k, 13)}<b>${FN[k].label}</b>
              <i class="fd-track"><u style="transform:scaleX(${f.toFixed(3)})"></u></i>
              <em>${f > 0.66 ? 'fed' : f > 0.36 ? 'partial' : 'starved'}</em></span>`;
          }).join('')}
        </span>`;
      card.addEventListener('click', () => { this.selected = raw.id; this.render(); });
      list.appendChild(card);
    }

    /* the selected briefing */
    const raw = this.scenarios.find((x) => x.id === this.selected);
    const sc = resolveScenario(raw, stack);
    this.$('.bp-title').textContent = sc.title;
    this.$('.bp-vig').textContent = sc.vignette;

    const rows = this.$('.bp-rows');
    rows.innerHTML = RANKS.map((r) => {
      const k = stack[r]; const p = sc.predispositions[k];
      return `<article class="bp-row" data-rank="${r}" style="--fn-c:var(${EL_VAR[FN[k].el]})">
        <div class="bp-fn">${markSVG(k, 28)}<b>${FN[k].label}</b><span>${RANK_LABEL[r].toUpperCase()}</span></div>
        <div class="bp-pred">
          <span class="kick">predisposition</span>
          <p>${p.statement || `${FN[k].name} has no direct hook in this situation.`}</p>
        </div>
        <div class="bp-gate">
          <span class="kick">cost gate</span>
          <b>${p.gate.toFixed(2)}<i>×</i></b>
          <span>${p.gateNote}</span>
        </div>
        <span class="bp-reg" data-reg="${p.registration}">${p.registration}</span>
      </article>`;
    }).join('');

    /* carry-in */
    this.$('.carry-row').innerHTML = RANKS.map((r) => {
      const k = stack[r]; const st = s.fnStates[k];
      const cap = RANK_PROFILE[r].capacity;
      return `<span class="cy" style="--fn-c:var(${EL_VAR[FN[k].el]})">
        ${markSVG(k, 15)}<b>${FN[k].label}</b>
        <em>stress ${Math.round(st.stress)}</em>
        <i class="cy-track"><u style="transform:scaleX(${Math.max(0, st.capacity / cap).toFixed(3)})"></u></i>
        <span>capacity ${Math.round(st.capacity)} of ${cap}</span></span>`;
    }).join('');
    this.$('.cs-state').textContent = s.machine.toUpperCase() + (s.manual ? ' · MANUAL' : '');
    this.$('.cs-state').dataset.state = s.machine;
    this.$('.cs-margins').textContent = this.margins
      ? `margin to Loop ${this.margins.loop.in ? 'IN' : this.margins.loop.pts} · to Grip ${this.margins.grip.in ? 'IN' : this.margins.grip.pts}`
      : '';
    this.el.dataset.fresh = s.runs.length === 0 ? 'true' : 'false';

    const routedCount = sc.actions.filter((a) =>
      Object.keys(a.signature).some((fn) => !RANKS.some((r) => stack[r] === fn))).length;
    this.$('.bp-deck-note').textContent =
      `${sc.actions.length} candidate actions · ${routedCount} demand a function you do not carry, and will be routed and surcharged`
      + (s.machine === 'loop' || s.machine === 'grip' ? ' · plus 4 generated by your current state' : '');
  }

}
