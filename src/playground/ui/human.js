/* ============================================================
   CURRENTS · Playground — the Whole-Human band
   BUILD-SPEC §4, wireframe S6.

   The aggregate is a PERSISTENT BAND, never a tab. Part and
   whole are visible in the same glance, because the lesson
   "you are one organism with one supply, not four parts" only
   lands if both are on screen at once. Expanding is a
   disclosure change, not a route change: the clock never stops
   and no state is lost either way.
   ============================================================ */
import { FN, RANKS } from '../types.js';
import { STATE_LABEL } from '../model.js';
import { markSVG } from './marks.js';
import { Seismo, forecastTail } from './seismo.js';
import { CSSVAR } from '../../utils/dom.js';

const EL_VAR = { n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' };
const sign = (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(Math.abs(v) >= 10 ? 0 : 1).replace(/\.0$/, '');

const RULES = [
  ['Energy', 'Σ max(0, cap) − 1.5 · Σ |min(0, cap)|', 'A sum is right: libido is one reservoir with four draws. Debt is taxed at 1.5× because borrowing costs more than it returns.'],
  ['Stress', '0.6 · max(s) + 0.4 · Σ w·s', 'Not a mean. One function at 90 while three sit at 10 is a person in trouble, not a person at 30. If all four are equal, this returns exactly that value.'],
  ['Pleasure', 'Σ w·p · (1 − 0.55 · conflict)', 'Satisfaction one part of you objects to is diminished satisfaction. Conflict is measured across the two axis pairs.'],
  ['Evenness', '−Σ i·ln i / ln 4', 'Involvement already sums to 1, so the aggregate reports its spread. 1.0 = all four equally engaged.'],
];

export class WholeHuman {
  constructor({ onToggle }) {
    const el = document.createElement('section');
    el.className = 'pg-human';
    el.dataset.expanded = 'false';
    el.innerHTML = `
      <button type="button" class="hm-bar" aria-expanded="false">
        <span class="hm-chev" aria-hidden="true"></span>
        <span class="hm-id"><b>Whole Human</b><em>one organism · one supply</em><i class="hm-state"></i></span>
        <span class="hm-trace"></span>
        <span class="hm-stats">
          ${['energy', 'stress', 'pleasure', 'evenness'].map((k) => `
            <span class="hm-stat" data-k="${k}">
              <span class="kick">${k}</span>
              <b>0</b>
              <span class="hm-track"><i></i></span>
              <em class="hm-d" hidden></em>
            </span>`).join('')}
        </span>
        <span class="hm-io">
          <span class="kick">impressions in · expressions out</span>
          <span class="io-body">
            <span class="io-row"><i class="io-in" data-k="novel"></i><b>novel</b></span>
            <span class="io-row"><i class="io-in" data-k="referential"></i><b>referential</b></span>
            <span class="io-skin"></span>
            <span class="io-row out"><i class="io-out" data-k="visible"></i><b>visible</b></span>
            <span class="io-row out"><i class="io-out" data-k="internal"></i><b>internal</b></span>
          </span>
        </span>
        <span class="hm-expand">Expand</span>
      </button>

      <div class="hm-panel" hidden>
        <div class="hm-grid">
          <div class="hm-vessel">
            <span class="kick">the vessel — centre of mass is the aggregate</span>
            <svg viewBox="0 0 300 300" class="vessel-fig" aria-hidden="true">
              <line class="ax" x1="150" y1="26" x2="150" y2="274"/>
              <line class="ax" x1="26" y1="150" x2="274" y2="150"/>
              <g class="conduits">${RANKS.map(() => '<line class="cd"/>').join('')}</g>
              <circle class="geo" cx="150" cy="150" r="26"/>
              <g class="slots">${RANKS.map(() => `<g class="slot"><circle/><text class="sl-l"></text><text class="sl-p"></text></g>`).join('')}</g>
              <circle class="com" r="17"/>
              <text class="com-t" text-anchor="middle">CoM</text>
            </svg>
            <p class="micro">Slot radius is rank. Conduit weight is involvement. The offset between the dashed geometric centre and the solid centre of mass <em>is</em> the imbalance.</p>
          </div>

          <div class="hm-bigs">
            <span class="kick">the human, as four numbers</span>
            <div class="big-grid">
              ${['energy', 'stress', 'pleasure', 'evenness'].map((k) => `
                <div class="big" data-k="${k}">
                  <span class="kick">${k}</span>
                  <b>0</b>
                  <span class="hm-track"><i></i></span>
                  <em class="big-m"></em>
                  <em class="big-n"></em>
                </div>`).join('')}
            </div>
          </div>

          <div class="hm-rules">
            <span class="kick">how four became one — shown, not buried</span>
            ${RULES.map(([n, f, w]) => `<div class="rule"><b>${n}</b><code>${f}</code><p>${w}</p></div>`).join('')}
          </div>
        </div>
        <p class="hm-not"><b>What this is not:</b> not a fifth function, not a sum of the four, and not a separate mode — it was on screen the whole time as a band and it expanded in place. If you take one thing from here: a mean would have hidden the spike, and this readout does not.</p>
      </div>`;

    this.el = el;
    this.$ = (s) => el.querySelector(s);
    this.stats = {}; el.querySelectorAll('.hm-stat').forEach((s) => { this.stats[s.dataset.k] = s; });
    this.bigs = {}; el.querySelectorAll('.big').forEach((s) => { this.bigs[s.dataset.k] = s; });
    this.ios = {}; el.querySelectorAll('.io-in,.io-out').forEach((i) => { this.ios[i.dataset.k] = i; });
    this.slots = [...el.querySelectorAll('.slots .slot')];
    this.conduits = [...el.querySelectorAll('.cd')];

    this.seis = new Seismo(this.$('.hm-trace'), { color: CSSVAR('--c-accent') || '#d9cfa8', compact: true });

    this.$('.hm-bar').addEventListener('click', () => {
      const next = el.dataset.expanded !== 'true';
      el.dataset.expanded = String(next);
      this.$('.hm-panel').hidden = !next;
      this.$('.hm-bar').setAttribute('aria-expanded', String(next));
      this.$('.hm-expand').textContent = next ? 'Collapse' : 'Expand';
      onToggle?.(next);
    });
  }

  tick(dt) { this.seis.tick(dt); }

  update(session, series, forecast) {
    const h = session.human;
    this.$('.hm-state').textContent = STATE_LABEL[session.machine].toUpperCase();
    this.el.dataset.state = session.machine;

    this.seis.setSeries(series);
    this.seis.setForecast(forecast
      ? forecastTail(h.stress, forecast.aggregate.next.stress, forecast.settled.stress) : null);

    const vals = {
      energy: [Math.round(h.energy), h.energy / 100, forecast?.aggregate.dEnergy],
      stress: [Math.round(h.stress), h.stress / 100, forecast?.aggregate.dStress],
      pleasure: [Math.round(h.pleasure), h.pleasure / 100, forecast?.aggregate.dPleasure],
      evenness: [h.evenness.toFixed(2), h.evenness, forecast ? forecast.aggregate.dEvenness * 100 : undefined],
    };

    for (const [k, [v, frac, d]] of Object.entries(vals)) {
      const s = this.stats[k];
      s.querySelector('b').textContent = v;
      s.querySelector('.hm-track i').style.transform = `scaleX(${Math.max(0, Math.min(1, frac)).toFixed(3)})`;
      const de = s.querySelector('.hm-d');
      if (d === undefined || Math.abs(d) < 0.05) de.hidden = true;
      else { de.hidden = false; de.textContent = sign(d); de.dataset.dir = d < 0 ? 'down' : 'up'; }

      const b = this.bigs[k];
      b.querySelector('b').textContent = v;
      b.querySelector('.hm-track i').style.transform = `scaleX(${Math.max(0, Math.min(1, frac)).toFixed(3)})`;
    }

    this.bigs.energy.querySelector('.big-m').textContent = '% of 275 total capacity';
    this.bigs.energy.querySelector('.big-n').textContent = h.debt > 0 ? `debt ${Math.round(h.debt)} — taxed at 1.5×` : 'one supply, four draws';
    this.bigs.stress.querySelector('.big-m').textContent = 'peak-weighted, not a mean';
    this.bigs.stress.querySelector('.big-n').textContent = `a mean would read ${Math.round(h.naiveMeanStress)} — and hide the spike`;
    this.bigs.pleasure.querySelector('.big-m').textContent = `after a ${h.conflict.toFixed(2)} conflict discount`;
    this.bigs.pleasure.querySelector('.big-n').textContent = h.conflict > 0.25 ? 'you got it, and part of you objects' : 'little internal disagreement';
    this.bigs.evenness.querySelector('.big-m').textContent = 'spread of the involvement ratio';
    this.bigs.evenness.querySelector('.big-n').textContent = h.evenness > 0.9 ? 'all four engaged — rare' : h.evenness < 0.55 ? 'one function is running the show' : 'ordinary spread';

    /* in / out */
    const maxIO = Math.max(0.12, h.in.novel, h.in.referential, h.out.visible, h.out.internal);
    for (const [k, v] of Object.entries({
      novel: h.in.novel, referential: h.in.referential, visible: h.out.visible, internal: h.out.internal,
    })) this.ios[k].style.transform = `scaleX(${(v / maxIO).toFixed(3)})`;

    if (this.el.dataset.expanded === 'true') this.drawVessel(session);
  }

  /* The radial figure — layout Strategy B, relocated to the one place where
     gestalt beats precise comparison. */
  drawVessel(session) {
    const { stack, fnStates } = session;
    const judges = RANKS.filter((r) => FN[stack[r]].cls === 'judge');
    const percs = RANKS.filter((r) => FN[stack[r]].cls === 'perceive');
    const DIST = { dom: 60, aux: 70, tert: 86, inf: 100 };
    const RAD = { dom: 30, aux: 26, tert: 22, inf: 18 };

    const place = {};
    place[judges[0]] = [150 - DIST[judges[0]], 150];
    place[judges[1]] = [150 + DIST[judges[1]], 150];
    place[percs[0]] = [150, 150 - DIST[percs[0]]];
    place[percs[1]] = [150, 150 + DIST[percs[1]]];

    let cx = 0, cy = 0;
    RANKS.forEach((r, i) => {
      const k = stack[r];
      const [x, y] = place[r];
      const inv = fnStates[k].involvement;
      const g = this.slots[i];
      const c = g.querySelector('circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', RAD[r]);
      g.style.setProperty('--fn-c', `var(${EL_VAR[FN[k].el]})`);
      g.dataset.rank = r;
      const l = g.querySelector('.sl-l');
      l.setAttribute('x', x); l.setAttribute('y', y + 4); l.setAttribute('text-anchor', 'middle');
      l.textContent = FN[k].label;
      const p = g.querySelector('.sl-p');
      p.setAttribute('x', x); p.setAttribute('y', y + RAD[r] + 13); p.setAttribute('text-anchor', 'middle');
      p.textContent = `${Math.round(inv * 100)}%`;

      const cd = this.conduits[i];
      cd.setAttribute('x1', 150); cd.setAttribute('y1', 150);
      cd.setAttribute('x2', x); cd.setAttribute('y2', y);
      cd.setAttribute('stroke-width', (1 + inv * 12).toFixed(2));
      cd.style.setProperty('--fn-c', `var(${EL_VAR[FN[k].el]})`);
      cd.dataset.bypassed = (session.machine === 'loop' && r === 'aux') ? 'true' : 'false';

      cx += (x - 150) * inv; cy += (y - 150) * inv;
    });
    const com = this.$('.com');
    com.setAttribute('cx', 150 + cx * 1.15);
    com.setAttribute('cy', 150 + cy * 1.15);
    const ct = this.$('.com-t');
    ct.setAttribute('x', 150 + cx * 1.15);
    ct.setAttribute('y', 150 + cy * 1.15 + 3.5);
  }
}
