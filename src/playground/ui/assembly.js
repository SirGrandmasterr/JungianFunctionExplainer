/* ============================================================
   CURRENTS · Playground — S1, stack assembly
   Two choices, two entailments. Steps 3 and 4 are drawn in a
   permanently non-interactive style because they are
   consequences, not selections — the single most teachable fact
   in typology, and it costs nothing but the discipline to
   refuse to draw four identical drop targets.
   ============================================================ */
import {
  FN, FN_KEYS, RANKS, deriveStack, typeCode, legalAux, refusal, opposite, allTypes, stackForCode,
} from '../types.js';
import { RANK_PROFILE, RANK_LABEL, RANK_ORDINAL } from '../model.js';
import { markSVG } from './marks.js';

const EL_VAR = { n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' };

export class Assembly {
  constructor({ onDone }) {
    this.dom = null;
    this.aux = null;
    this.onDone = onDone;

    const el = document.createElement('section');
    el.className = 'pg-screen pg-assembly';
    el.innerHTML = `
      <div class="as-head">
        <div>
          <span class="kick">playground · stack assembly</span>
          <h1>Build a psyche</h1>
        </div>
        <ol class="steps">
          <li data-s="1"><b>1</b><span>Dominant<em>8 options</em></span></li>
          <li data-s="2"><b>2</b><span>Auxiliary<em>exactly 2 legal</em></span></li>
          <li data-s="3" class="entailed"><b>3</b><span>Tertiary<em>entailed</em></span></li>
          <li data-s="4" class="entailed"><b>4</b><span>Inferior<em>entailed</em></span></li>
        </ol>
      </div>

      <div class="as-grid">
        <div class="as-eight">
          <span class="kick as-prompt">the eight — choose the function that leads</span>
          <div class="eight-grid">
            ${FN_KEYS.map((k) => `
              <button type="button" class="fn-tile" data-fn="${k}" style="--fn-c:var(${EL_VAR[FN[k].el]})">
                ${markSVG(k, 34)}
                <b>${FN[k].label}</b>
                <span class="tile-name">${FN[k].glyph}</span>
                <span class="tile-state"></span>
                <span class="tile-why"></span>
              </button>`).join('')}
          </div>
          <div class="as-laws">
            <span class="kick">why only two</span>
            <p>Law I — the top two face opposite worlds. Law II — the top two do opposite jobs. Together those leave exactly two legal auxiliaries per dominant. 8 × 2 = 16, and that is the whole encoding.</p>
          </div>
        </div>

        <div class="as-vessel">
          <span class="kick">the vessel — two crossed axes, four slots</span>
          <svg viewBox="0 0 340 340" class="vessel-fig build" aria-hidden="true">
            <line class="ax" x1="170" y1="34" x2="170" y2="306"/>
            <line class="ax" x1="34" y1="170" x2="306" y2="170"/>
            <text class="ax-l" x="170" y="24" text-anchor="middle">PERCEPTION AXIS</text>
            <text class="ax-l" x="316" y="167" text-anchor="middle" transform="rotate(90 316 167)">JUDGMENT AXIS</text>
            <circle class="ego" cx="170" cy="170" r="30"/>
            <text class="ego-t" x="170" y="168" text-anchor="middle">EGO</text>
            <text class="ego-s" x="170" y="180" text-anchor="middle">core</text>
            <g class="bslots">
              ${RANKS.map((r) => `<g class="bslot" data-rank="${r}">
                <circle/><g class="sl-mark"></g><text class="sl-l" text-anchor="middle"></text>
                <text class="sl-r" text-anchor="middle"></text><text class="sl-n" text-anchor="middle"></text>
              </g>`).join('')}
            </g>
          </svg>
          <p class="micro">Radius is rank · distance from the core is pressure · a dashed open ring is a slot not yet placed.</p>
        </div>

        <div class="as-result">
          <div class="res-card">
            <div class="res-code"><b class="rc-code">—</b><span class="rc-note">pick a dominant to begin</span></div>
            <ol class="res-stack">
              ${RANKS.map((r) => `<li data-rank="${r}">
                <span class="rs-mark"></span>
                <b class="rs-l">—</b>
                <span class="rs-rank">${RANK_LABEL[r]}</span>
                <span class="rs-name"></span>
                <span class="rs-cap">${RANK_PROFILE[r].capacity}</span>
              </li>`).join('')}
            </ol>
          </div>
          <div class="as-carry">
            <span class="kick">carry-in — a fresh vessel</span>
            <p>Stress 0 on all four. Capacity full, 275 total. State <b>Balanced</b>. A vessel keeps its wear across scenario runs in this session, so the second situation is entered by a tired psyche.</p>
          </div>
          <button type="button" class="btn primary wide as-go" disabled>Choose a situation ▸</button>
          <p class="micro as-go-note">disabled until slot 2 is placed</p>
        </div>
      </div>

      <div class="as-presets">
        <span class="kick">or take a finished type — the same sixteen, derived not stored</span>
        <div class="preset-grid">
          ${allTypes().map((t) => `<button type="button" class="preset" data-code="${t.code}">
            <b>${t.code}</b><span>${RANKS.map((r) => FN[t.stack[r]].label).join(' ')}</span>
          </button>`).join('')}
        </div>
      </div>

      <div class="as-entail">
        <span class="kick">the entailment beat — slots 3 and 4 are not choices, and this interface will not pretend they are</span>
        <p>When the auxiliary lands, slots 3 and 4 fill themselves by Law III: every function installs its polar opposite at the far end of its own axis. Those two placements arrive as consequences, not selections — no affordance, no cursor change, one line of explanation each.</p>
        <p class="entail-live"></p>
      </div>`;

    this.el = el;
    this.$ = (s) => el.querySelector(s);
    this.tiles = {};
    el.querySelectorAll('.fn-tile').forEach((t) => {
      this.tiles[t.dataset.fn] = t;
      t.addEventListener('click', () => this.pick(t.dataset.fn));
    });
    el.querySelectorAll('.preset').forEach((p) => {
      p.addEventListener('click', () => {
        const s = stackForCode(p.dataset.code);
        this.dom = s.dom; this.aux = s.aux; this.render();
      });
    });
    this.$('.as-go').addEventListener('click', () => {
      if (this.dom && this.aux) this.onDone(deriveStack(this.dom, this.aux));
    });
    this.bslots = [...el.querySelectorAll('.bslot')];
    this.render();
  }

  pick(fn) {
    if (!this.dom) { this.dom = fn; this.aux = null; }
    else if (this.dom === fn) { this.dom = null; this.aux = null; }
    else if (!refusal(this.dom, fn)) this.aux = fn;
    this.render();
  }

  stack() {
    if (!this.dom) return null;
    if (!this.aux) return { dom: this.dom, aux: null, tert: null, inf: opposite(this.dom) };
    return deriveStack(this.dom, this.aux);
  }

  render() {
    const el = this.el;
    const st = this.stack();
    const step = !this.dom ? 1 : !this.aux ? 2 : 4;
    el.dataset.step = step;
    el.querySelectorAll('.steps li').forEach((li) => {
      const n = +li.dataset.s;
      li.dataset.on = n <= step ? 'true' : 'false';
      li.dataset.done = (n === 1 && this.dom) || (n >= 2 && this.aux) ? 'true' : 'false';
    });
    this.$('.as-prompt').textContent = !this.dom
      ? 'the eight — choose the function that leads'
      : !this.aux
        ? `the eight — choosing the auxiliary under ${FN[this.dom].label}; six are now illegal`
        : `the eight — ${typeCode(st)} assembled`;

    /* tiles */
    for (const k of FN_KEYS) {
      const t = this.tiles[k];
      let state = 'open', why = '';
      if (this.dom === k) { state = 'dom'; why = 'leads'; }
      else if (this.aux === k) { state = 'aux'; why = 'supports'; }
      else if (this.dom) {
        const r = refusal(this.dom, k);
        if (r) { state = 'illegal'; why = r.reason; }
        else { state = 'legal'; why = 'legal auxiliary'; }
      }
      if (this.aux && state === 'legal') state = 'muted';
      t.dataset.state = state;
      t.querySelector('.tile-state').textContent =
        state === 'dom' ? 'DOMINANT' : state === 'aux' ? 'AUXILIARY'
          : state === 'legal' ? 'LEGAL' : state === 'illegal' ? 'ILLEGAL' : '';
      t.querySelector('.tile-why').textContent = why;
      t.disabled = state === 'illegal' || (!!this.aux && state === 'muted');
    }

    /* vessel figure */
    const DIST = { dom: 66, aux: 76, tert: 94, inf: 110 };
    const RAD = { dom: 34, aux: 30, tert: 25, inf: 21 };
    const filled = st || {};
    const judges = RANKS.filter((r) => filled[r] && FN[filled[r]].cls === 'judge');
    const percs = RANKS.filter((r) => filled[r] && FN[filled[r]].cls === 'perceive');
    const place = {};
    if (judges[0]) place[judges[0]] = [170 - DIST[judges[0]], 170];
    if (judges[1]) place[judges[1]] = [170 + DIST[judges[1]], 170];
    if (percs[0]) place[percs[0]] = [170, 170 - DIST[percs[0]]];
    if (percs[1]) place[percs[1]] = [170, 170 + DIST[percs[1]]];
    const fallback = { dom: [104, 170], aux: [170, 94], tert: [170, 246], inf: [280, 170] };

    RANKS.forEach((r, i) => {
      const g = this.bslots[i];
      const k = filled[r];
      const [x, y] = place[r] || fallback[r];
      const rad = RAD[r];
      g.dataset.filled = k ? 'true' : 'false';
      g.style.setProperty('--fn-c', k ? `var(${EL_VAR[FN[k].el]})` : 'var(--muted)');
      const c = g.querySelector('circle');
      c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', rad);
      const mk = g.querySelector('.sl-mark');
      mk.innerHTML = k ? markSVG(k, rad * 0.8) : '';
      const svgMark = mk.querySelector('svg');
      if (svgMark) { svgMark.setAttribute('x', x - rad * 0.4); svgMark.setAttribute('y', y - rad * 0.72); }
      const l = g.querySelector('.sl-l');
      l.setAttribute('x', x); l.setAttribute('y', y + rad * 0.5); l.textContent = k ? FN[k].label : '';
      const rr = g.querySelector('.sl-r');
      rr.setAttribute('x', x); rr.setAttribute('y', y + rad + 14);
      rr.textContent = `${RANK_LABEL[r].toUpperCase()} · ${RANK_ORDINAL[r]}`;
      const nn = g.querySelector('.sl-n');
      nn.setAttribute('x', x); nn.setAttribute('y', y + rad + 26);
      nn.textContent = r === 'dom' ? 'nearest — highest pressure'
        : r === 'aux' ? (this.aux ? 'chosen' : 'choosing now')
          : r === 'tert' ? (this.aux ? `entailed by ${FN[this.aux].label}` : 'entailed') : `entailed by ${this.dom ? FN[this.dom].label : '—'}`;
    });

    /* result */
    const code = st && this.aux ? typeCode(st) : null;
    this.$('.rc-code').textContent = code || '—';
    const alt = this.dom ? legalAux(this.dom).find((a) => a !== this.aux) : null;
    this.$('.rc-note').textContent = !this.dom ? 'pick a dominant to begin'
      : !this.aux ? `two legal auxiliaries: ${legalAux(this.dom).map((a) => FN[a].label).join(' or ')}`
        : `picking ${FN[alt].label} instead would give ${typeCode(deriveStack(this.dom, alt))}`;

    el.querySelectorAll('.res-stack li').forEach((li) => {
      const r = li.dataset.rank; const k = filled[r];
      li.dataset.filled = k ? 'true' : 'false';
      li.style.setProperty('--fn-c', k ? `var(${EL_VAR[FN[k].el]})` : 'var(--grid)');
      li.querySelector('.rs-mark').innerHTML = k ? markSVG(k, 18) : '';
      li.querySelector('.rs-l').textContent = k ? FN[k].label : '—';
      li.querySelector('.rs-name').textContent = k ? FN[k].name : '';
    });

    this.$('.as-go').disabled = !(this.dom && this.aux);
    this.$('.as-go-note').textContent = this.aux ? `${code} — 275 capacity, stress 0, Balanced` : 'disabled until slot 2 is placed';

    this.$('.entail-live').textContent = this.aux
      ? `${FN[this.dom].label} dominant → ${FN[opposite(this.dom)].label} is installed inferior (judgment axis).   ${FN[this.aux].label} auxiliary → ${FN[opposite(this.aux)].label} is installed tertiary (perception axis).`
      : '';
    this.el.querySelectorAll('.preset').forEach((p) => {
      p.dataset.on = code && p.dataset.code === code ? 'true' : 'false';
    });
  }
}
