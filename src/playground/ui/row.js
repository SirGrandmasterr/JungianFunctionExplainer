/* ============================================================
   CURRENTS · Playground — the Reaction Window
   One function's five readouts, wireframed in S5.
   BUILD-SPEC §7, diagram D5.

   The mount rule: built ONCE per scenario run, updated
   thereafter. Tier changes toggle an attribute and hide
   children; they never rebuild them. A Grip promotion is an
   attribute change plus a height variable — not a re-render.
   The node count is constant from mount to unmount.
   ============================================================ */
import { FN } from '../types.js';
import { RANK_LABEL, RANK_ORDINAL, TIER_SPEC, RANK_PROFILE } from '../model.js';
import { markSVG } from './marks.js';
import { Seismo, forecastTail } from './seismo.js';
import { CSSVAR } from '../../utils/dom.js';

const EL_VAR = { n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' };
const sign = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(v >= 10 || v <= -10 ? 0 : 1).replace(/\.0$/, '');

function meter(kick, cls) {
  return `<div class="mtr ${cls}">
    <span class="mtr-k">${kick}</span>
    <div class="mtr-track">
      <i class="mtr-fill"></i><i class="mtr-fore"></i>
    </div>
    <span class="mtr-v">0</span>
  </div>`;
}

export class ReactionWindow {
  constructor(fn, rank) {
    this.fn = fn;
    this.rank = rank;
    this.color = CSSVAR(EL_VAR[FN[fn].el]) || '#8aa';

    const el = document.createElement('section');
    el.className = 'pg-row';
    el.dataset.fn = fn;
    el.dataset.rank = rank;
    el.dataset.tier = 'FULL';
    el.style.setProperty('--fn-c', `var(${EL_VAR[FN[fn].el]})`);
    el.tabIndex = 0;
    el.setAttribute('role', 'group');
    el.setAttribute('aria-label', `${FN[fn].name}, ${RANK_LABEL[rank]}`);

    el.innerHTML = `
      <div class="pg-row-id">
        <span class="kick rank-kick">${RANK_LABEL[rank]} · ${RANK_ORDINAL[rank]}</span>
        <b class="fn-label">${FN[fn].label}</b>
        <span class="fn-name">${FN[fn].name}</span>
        <div class="glyph-slot" title="${FN[fn].glyph} — the glyph from the ${FN[fn].label} page">
          ${markSVG(fn, 32)}
          <span class="glyph-meta"><b>${FN[fn].glyph}</b><i class="gsz">32px</i></span>
        </div>
        <div class="id-chips">
          <span class="tier-chip">FULL</span>
          <span class="role-badge" hidden></span>
        </div>
      </div>

      <div class="pg-row-stream">
        <span class="kick">expression stream</span>
        <div class="lines">
          ${Array.from({ length: 6 }, () => '<p class="ln" hidden></p>').join('')}
        </div>
        <div class="projected" hidden>
          <span class="pj-k">projected</span>
          <p class="pj-t"></p>
        </div>
      </div>

      <div class="pg-row-seis">
        <div class="seis-head">
          <span class="kick">stress trace</span>
          <span class="stress-read"><b class="s-val">0</b><i class="s-delta" hidden></i></span>
        </div>
        <div class="seis-host"></div>
        <span class="seis-foot">x-axis = beats, not seconds</span>
      </div>

      <div class="pg-row-out">
        ${meter('pleasure', 'm-pleasure')}
        ${meter('involvement', 'm-involve')}
        <div class="mtr m-cap">
          <span class="mtr-k">energy / capacity</span>
          <div class="mtr-track cap">
            <i class="cap-fill"></i><i class="cap-cost"></i><i class="cap-debt"></i>
          </div>
          <span class="mtr-v">0</span>
        </div>
        <span class="cap-note">fill = remaining capacity</span>
      </div>

      <div class="pg-row-delta" aria-live="off">
        <span class="d-head">Δ</span>
        <div class="d-cells">
          ${['stress', 'pleasure', 'share', 'energy'].map((k) => `
            <div class="d-cell" data-k="${k}" hidden><b>0</b><span>${k}</span></div>`).join('')}
        </div>
        <span class="d-rest">reserved<br>empty</span>
        <span class="d-attr" hidden></span>
      </div>`;

    this.el = el;
    this.$ = (s) => el.querySelector(s);
    this.lineEls = [...el.querySelectorAll('.ln')];
    this.dCells = {};
    el.querySelectorAll('.d-cell').forEach((c) => { this.dCells[c.dataset.k] = c; });

    this.seis = new Seismo(this.$('.seis-host'), { color: this.color, beats: 20 });

    this._last = {};
  }

  destroy() { this.seis.destroy(); this.el.remove(); }

  tick(dt) { this.seis.tick(dt); }

  /**
   * @param {object} c
   *  { state, tier, machine, series, forecast, badge, rankNow }
   */
  update(c) {
    const el = this.el;
    const st = c.state;
    const spec = TIER_SPEC[c.tier];

    if (el.dataset.tier !== c.tier) {
      el.dataset.tier = c.tier;
      this.$('.tier-chip').textContent = c.tier;
      const g = el.querySelector('.pg-mark');
      if (g) { g.setAttribute('width', spec.glyph); g.setAttribute('height', spec.glyph); }
      this.$('.gsz').textContent = `${spec.glyph}px`;
    }
    el.dataset.machine = c.machine;
    el.dataset.dead = c.tier === 'BYPASSED' ? 'true' : 'false';

    /* --- badge --- */
    const badge = this.$('.role-badge');
    if (c.badge) { badge.hidden = false; badge.textContent = c.badge; badge.dataset.kind = c.badgeKind || ''; }
    else badge.hidden = true;

    /* --- stream: 6 recycled nodes, never more --- */
    const lines = st.lines.slice(-spec.lines);
    for (let i = 0; i < this.lineEls.length; i++) {
      const n = this.lineEls[i];
      const ln = lines[i];
      if (!ln) { if (!n.hidden) n.hidden = true; continue; }
      if (n.hidden) n.hidden = false;
      if (n.textContent !== ln.text) n.textContent = ln.text;
      const age = lines.length - 1 - i;
      n.dataset.age = Math.min(age, 4);
      n.dataset.kind = ln.kind;
    }

    /* --- projected line (hover only) --- */
    const pj = this.$('.projected');
    if (c.forecast) {
      pj.hidden = false;
      const t = c.tier === 'BYPASSED' ? 'would not be consulted' : c.forecast.streamLine;
      if (this.$('.pj-t').textContent !== t) this.$('.pj-t').textContent = t;
      pj.dataset.dead = c.tier === 'BYPASSED' ? 'true' : 'false';
    } else pj.hidden = true;

    /* --- seismograph --- */
    this.seis.setSeries(c.series, { dead: c.tier === 'BYPASSED' });
    if (c.forecast && c.tier !== 'BYPASSED') {
      this.seis.setForecast(forecastTail(st.stress, c.forecast.nextStress, c.forecast.settledStress ?? c.forecast.nextStress));
    } else this.seis.setForecast(null);

    this.setText('.s-val', Math.round(st.stress));
    this.toggleVal('.s-delta', c.forecast && c.tier !== 'BYPASSED' ? sign(c.forecast.dStress) : null);

    /* --- meters --- */
    this.meter('.m-pleasure', st.pleasure / 100,
      c.forecast ? c.forecast.nextPleasure / 100 : null, Math.round(st.pleasure));
    this.meter('.m-involve', st.involvement,
      c.forecast ? c.forecast.involvement : null, `${Math.round(st.involvement * 100)}%`);

    const cap = RANK_PROFILE[this.rank].capacity;
    const rem = Math.max(0, st.capacity) / cap;
    const debt = Math.max(0, -st.capacity) / cap;
    const cost = c.forecast ? c.forecast.cost / cap : 0;
    this.$('.cap-fill').style.transform = `scaleX(${rem.toFixed(4)})`;
    const eaten = Math.min(cost, rem);
    this.$('.cap-cost').style.transform = `translateX(${((rem - eaten) * 100).toFixed(2)}%) scaleX(${eaten.toFixed(4)})`;
    this.$('.cap-cost').hidden = !c.forecast || eaten <= 0.001;
    const overflow = c.forecast ? Math.max(0, cost - rem) : 0;
    this.$('.cap-debt').style.transform = `scaleX(${Math.min(1, debt + overflow).toFixed(4)})`;
    this.$('.cap-debt').hidden = debt + overflow <= 0.001;
    this.$('.m-cap .mtr-v').textContent = Math.round(st.capacity);
    el.dataset.debt = debt > 0 ? 'true' : 'false';
    this.setText('.cap-note', c.forecast
      ? (overflow > 0 ? 'hatched = takes · past zero = DEBT' : 'fill = left · hatched = this action takes')
      : (debt > 0 ? 'in debt — stress penalty every beat' : 'fill = remaining capacity'));

    /* --- delta gutter: empty at rest --- */
    const f = c.forecast;
    el.dataset.hasDelta = f ? 'true' : 'false';
    const shown = f && c.tier !== 'BYPASSED'
      ? (spec.deltas >= 4
        ? { stress: sign(f.dStress), pleasure: sign(f.dPleasure), share: sign(f.dInvolvement * 100), energy: sign(-f.cost) }
        : { stress: sign(f.dStress), energy: sign(-f.cost) })
      : {};
    for (const [k, cell] of Object.entries(this.dCells)) {
      const v = shown[k];
      if (v === undefined) { cell.hidden = true; continue; }
      cell.hidden = false;
      const b = cell.firstElementChild;
      if (b.textContent !== v) b.textContent = v;
      b.dataset.dir = v.startsWith('−') ? 'down' : 'up';
    }
    const attr = this.$('.d-attr');
    if (f && f.attribution) { attr.hidden = false; attr.textContent = f.attribution; } else attr.hidden = true;
    this.$('.d-rest').hidden = !!f;
  }

  meter(sel, v, fv, label) {
    const root = this.$(sel);
    const a = Math.max(0, Math.min(1, v));
    root.querySelector('.mtr-fill').style.transform = `scaleX(${a.toFixed(4)})`;
    const fore = root.querySelector('.mtr-fore');
    if (fv == null) fore.hidden = true;
    else {
      const b = Math.max(0, Math.min(1, fv));
      const lo = Math.min(a, b), hi = Math.max(a, b);
      fore.hidden = hi - lo < 0.004;
      fore.style.transform = `translateX(${(lo * 100).toFixed(2)}%) scaleX(${(hi - lo).toFixed(4)})`;
      fore.dataset.dir = b < a ? 'down' : 'up';
    }
    const vEl = root.querySelector('.mtr-v');
    const s = String(label);
    if (vEl.textContent !== s) vEl.textContent = s;
  }

  setText(sel, v) {
    const n = this.$(sel); const s = String(v);
    if (n.textContent !== s) n.textContent = s;
  }

  toggleVal(sel, v) {
    const n = this.$(sel);
    if (v == null) { n.hidden = true; return; }
    n.hidden = false;
    if (n.textContent !== v) n.textContent = v;
    n.dataset.dir = v.startsWith('−') ? 'down' : 'up';
  }
}
