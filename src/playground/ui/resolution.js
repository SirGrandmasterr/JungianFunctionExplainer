/* ============================================================
   CURRENTS · Playground — S9, post-action resolution
   What changed, what it cost, what comes next — and the same
   action billed to three other psyches.

   The strongest affordance here is "run this again on another
   psyche", not "next scenario". One receipt teaches almost
   nothing; two receipts for the same action teach the model.
   ============================================================ */
import { FN, RANKS } from '../types.js';
import { RANK_LABEL, RANK_PROFILE, STATE_LABEL, TH } from '../model.js';
import { markSVG } from './marks.js';
import { counterfactual } from '../compare.js';

const EL_VAR = { n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' };
const sign = (v) => (v >= 0 ? '+' : '−') + Math.abs(Math.round(v));

export class Resolution {
  constructor({ onNext, onRest, onSwapTo, onReset }) {
    const el = document.createElement('section');
    el.className = 'pg-screen pg-resolution';
    el.innerHTML = `
      <header class="rz-head">
        <div class="rz-id">
          <span class="kick rz-kick"></span>
          <h1 class="rz-act"></h1>
          <p class="rz-out"></p>
        </div>
        <div class="rz-trans">
          <span class="kick">state transition</span>
          <div class="tr-row"><b class="tr-from"></b><i>→</i><b class="tr-to"></b></div>
          <p class="tr-why"></p>
        </div>
      </header>

      <div class="rz-grid">
        <section class="rz-changed">
          <span class="kick">a · what changed — before → after, per function</span>
          <div class="ch-rows"></div>
          <p class="micro">Thin bar = before · thick bar = after. Direction is always stated with an explicit sign, never implied by bar direction alone.</p>
        </section>

        <section class="rz-bill">
          <span class="kick">b · what it cost — the itemised bill</span>
          <div class="bill-lines"></div>
          <div class="bill-totals"></div>
        </section>

        <section class="rz-next">
          <span class="kick">c · what comes next</span>
          <div class="nx-margins"></div>
          <div class="nx-acts">
            <button type="button" class="nx primary" data-a="compare"><b>Run this again on another psyche</b><span>Same situation, same action, a different stack. The comparison below is the whole point.</span></button>
            <button type="button" class="nx" data-a="next"><b>Next situation</b><span>This vessel carries its wear forward. It will not enter fresh.</span></button>
            <button type="button" class="nx" data-a="rest"><b>Rest — spend beats doing nothing</b><span>Stress decays, capacity returns slowly. Debt does not clear itself.</span></button>
            <button type="button" class="nx" data-a="reset"><b>Reset the vessel</b><span>Discard session history and start from full capacity.</span></button>
          </div>
        </section>
      </div>

      <section class="rz-cf">
        <span class="kick">d · the counterfactual — the same action, billed to a different psyche</span>
        <h2>Anything is doable. The bill varies. The bill predicts behaviour.</h2>
        <div class="cf-row"></div>
        <p class="micro">Every one of these performed the identical action and none was blocked. What differed is who paid, how much, and how likely they were to have chosen it unforced.</p>
      </section>`;

    this.el = el;
    this.$ = (s) => el.querySelector(s);
    el.querySelectorAll('.nx').forEach((b) => {
      b.addEventListener('click', () => {
        const a = b.dataset.a;
        if (a === 'next') onNext();
        else if (a === 'rest') onRest();
        else if (a === 'reset') onReset();
        else if (a === 'compare') this.$('.rz-cf').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    this.onSwapTo = onSwapTo;
  }

  render(record, session, rawScenario, margins) {
    const { stack } = session;
    const a = record.action;

    this.$('.rz-kick').textContent = `${rawScenario.title} · resolved · session beat ${session.beatIndex}`;
    this.$('.rz-act').textContent = a.label;
    this.$('.rz-out').textContent = record.outcome || a.detail || '';

    const t = record.transition;
    this.$('.tr-from').textContent = STATE_LABEL[t ? t.from : session.machine];
    this.$('.tr-to').textContent = STATE_LABEL[t ? t.to : session.machine];
    this.el.querySelector('.rz-trans').dataset.moved = t ? 'true' : 'false';
    this.$('.tr-why').textContent = t ? t.cause
      : `no threshold crossed — aggregate stress ${Math.round(record.humanBefore.stress)} → ${Math.round(record.humanAfter.stress)}`;

    /* ---- what changed ---- */
    this.$('.ch-rows').innerHTML = RANKS.map((r) => {
      const k = stack[r];
      const b = record.before[k], af = record.after[k];
      const cap = RANK_PROFILE[r].capacity;
      const bars = [
        ['stress', b.stress, af.stress, 100, ''],
        ['pleasure', b.pleasure, af.pleasure, 100, ''],
        ['share', b.involvement * 100, af.involvement * 100, 100, '%'],
        ['capacity', b.capacity, af.capacity, cap, ''],
      ];
      const paid = record.per[k].cost;
      const biggest = RANKS.reduce((m, rr) => Math.max(m, record.per[stack[rr]].cost), 0);
      return `<article class="ch-row" data-rank="${r}" data-payer="${paid >= biggest - 0.01 ? 'true' : 'false'}" style="--fn-c:var(${EL_VAR[FN[k].el]})">
        <div class="ch-fn">${markSVG(k, 24)}<b>${FN[k].label}</b><span>${RANK_LABEL[r].toUpperCase()}</span></div>
        <div class="ch-bars">
          ${bars.map(([lab, from, to, max, suf]) => `
            <div class="ch-b">
              <span class="kick">${lab}</span>
              <span class="ch-track"><i class="was" style="transform:scaleX(${Math.max(0, Math.min(1, from / max)).toFixed(3)})"></i><i class="now" style="transform:scaleX(${Math.max(0, Math.min(1, to / max)).toFixed(3)})"></i></span>
              <span class="ch-v"><em>${Math.round(from)}${suf}</em><b>${Math.round(to)}${suf}</b></span>
              <span class="ch-d" data-dir="${to - from < 0 ? 'down' : 'up'}">${sign(to - from)}</span>
            </div>`).join('')}
        </div>
        <p class="ch-note">${this.noteFor(k, r, record)}</p>
      </article>`;
    }).join('');

    /* ---- the bill ---- */
    this.$('.bill-lines').innerHTML = record.bill.map((l) => `
      <div class="bl" data-heavy="${l.heavy}" data-meta="${!!l.meta}">
        <span class="bl-l">${l.label}</span>
        <span class="bl-n">${l.note}</span>
        <b class="bl-v">${l.meta ? '' : (l.value >= 0 && l.label.includes('·') && !l.label.includes('base') ? (l.label.includes('gate') || l.label.includes('routing') ? '+' : '') : '') + l.value.toFixed(1)}</b>
      </div>`).join('');

    const spent = RANKS.reduce((s, r) => s + record.per[stack[r]].cost, 0);
    const stressAdded = record.humanAfter.stress - record.humanBefore.stress;
    const debt = record.humanAfter.debt;
    this.$('.bill-totals').innerHTML = [
      ['energy spent', Math.round(spent), 'of the 275 reservoir'],
      ['stress added', sign(stressAdded), 'aggregate, peak-weighted'],
      ['pleasure', Math.round(record.humanAfter.pleasure), `after a ${record.humanAfter.conflict.toFixed(2)} conflict discount`],
      ['debt incurred', Math.round(debt), debt > 0 ? 'a per-beat stress penalty until repaid' : 'no function went below zero'],
      ['you chose', `${Math.round(record.odds * 100)}%`, 'the odds this psyche would have picked it unforced'],
    ].map(([k, v, n]) => `<div class="tot"><span class="kick">${k}</span><b>${v}</b><span>${n}</span></div>`).join('');

    /* ---- margins ---- */
    this.$('.nx-margins').innerHTML = ['loop', 'grip'].map((k) => {
      const m = margins[k];
      const was = k === 'loop' ? record.marginsBefore?.loop : record.marginsBefore?.grip;
      return `<div class="nxm" data-in="${m.in}">
        <b>${k.toUpperCase()}</b>
        <span class="nxm-track"><i style="transform:scaleX(${m.fill.toFixed(3)})"></i></span>
        <span>${m.n_a ? 'not applicable in a grip' : m.in ? 'you are in it' : `${m.pts} points of margin left${was != null ? ` (was ${was})` : ''}`}</span>
      </div>`;
    }).join('');

    /* ---- counterfactual ---- */
    const rows = counterfactual(rawScenario, a, stack);
    const maxE = Math.max(...rows.map((r) => r.energy), 1);
    const maxS = Math.max(...rows.map((r) => r.stress), 1);
    const maxP = Math.max(...rows.map((r) => r.pleasure), 1);
    this.$('.cf-row').innerHTML = rows.map((r) => `
      <article class="cf" data-mine="${r.mine}">
        <header><b>${r.code}</b><span>${r.stackLabel}</span>${r.mine ? '<i class="cf-mine">YOURS</i>' : `<i class="cf-why">${r.why}</i>`}</header>
        ${[['energy spent', r.energy, maxE], ['stress added', r.stress, maxS], ['pleasure', r.pleasure, maxP], ['likelihood unforced', Math.round(r.odds * 100), 100]]
          .map(([lab, v, max]) => `<div class="cf-m"><span>${lab}</span><i><u style="transform:scaleX(${Math.max(0, Math.min(1, v / max)).toFixed(3)})"></u></i><b>${v}</b></div>`).join('')}
        <p>${r.payerNote}${r.routed ? ` · routed ${r.routedNote}` : ''}</p>
      </article>`).join('');

    this.el.querySelectorAll('.cf:not([data-mine="true"])').forEach((c, i) => {
      c.addEventListener('click', () => this.onSwapTo(rows[i + 1].code));
      c.tabIndex = 0;
      c.setAttribute('role', 'button');
      c.title = 'Rebuild as this type and run the same situation';
    });
  }

  noteFor(k, r, record) {
    const d = record.per[k];
    const rel = d.rel;
    const bits = [];
    if (d.routed) bits.push('absorbed routed work — same job, its own manner');
    if (rel === 'violates') bits.push('the action went against what it wanted');
    else if (rel === 'serves') bits.push('the action served it directly');
    else if (rel === 'defers') bits.push('put off, and the postponement was billed');
    if (record.after[k].capacity < 0) bits.push('pushed into debt');
    if (d.involvement < 0.06) bits.push('barely consulted');
    return bits.length ? bits.join(' · ') : 'carried its ordinary share';
  }
}
