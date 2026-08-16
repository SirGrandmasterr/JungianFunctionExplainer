/* ============================================================
   CURRENTS · Playground — the Briefing
   The interior half of a scenario is not in the scenario. It is
   in the person.

   Extraverted functions read the situation, so a scenario can
   author their hooks flat. Introverted functions read a *record*,
   a *trajectory*, a *model*, a *tone* — none of which the
   situation contains. Those four are configured here, and only
   the two the Vessel actually carries are live: the other two are
   shown, greyed, because "no chamber aboard reads this
   instrument" is itself one of the things worth learning.
   ============================================================ */
import { FN } from './types.js';
import { INSTRUMENTS } from '../data/playground-data.js';
import { glyphMark } from './assembly.js';

export class Briefing {
  constructor(host, opts = {}) {
    this.host = host;
    this.onChange = opts.onChange || (() => {});
    this.state = {};
    this.vessel = null;
    this.scenario = null;
  }

  /** Load a scenario's authored defaults; the user overrides from here. */
  load(scenario, vessel) {
    this.scenario = scenario;
    this.vessel = vessel;
    this.state = JSON.parse(JSON.stringify(scenario.interior || {}));
    this.render();
    return this.state;
  }

  setVessel(vessel) { this.vessel = vessel; this.render(); }

  render() {
    const host = this.host;
    host.innerHTML = '';
    if (!this.scenario) return;
    const aboard = new Set(this.vessel ? Object.values(this.vessel.stack) : []);

    for (const key of ['si', 'ni', 'ti', 'fi']) {
      const inst = INSTRUMENTS[key];
      const live = aboard.has(key);
      const card = document.createElement('div');
      card.className = `instrument el-${FN[key].el}${live ? '' : ' inert'}`;

      const head = document.createElement('div');
      head.className = 'instrument-head';
      head.innerHTML =
        `${glyphMark(key, 26)}<b>${FN[key].label} · ${inst.title}</b>` +
        `<span>${inst.question}</span>`;
      card.appendChild(head);

      if (!live) {
        const note = document.createElement('p');
        note.className = 'instrument-inert';
        note.textContent = 'No chamber aboard reads this instrument. It will matter to the next Vessel you compare against.';
        card.appendChild(note);
        host.appendChild(card);
        continue;
      }

      if (inst.type === 'range') {
        const wrap = document.createElement('div');
        wrap.className = 'instrument-range';
        const val = this.state.fi?.valence ?? 0;
        wrap.innerHTML =
          `<input type="range" min="-1" max="1" step="0.05" value="${val}"
                  aria-label="${inst.question}">
           <div class="range-ends"><span>${inst.lo}</span><output>${fmt(val)}</output><span>${inst.hi}</span></div>
           <label class="range-value">what is struck
             <input type="text" class="value-name" value="${escapeAttr(this.state.fi?.value || 'a personal value')}"
                    aria-label="which value this strikes">
           </label>`;
        const range = wrap.querySelector('input[type=range]');
        const out = wrap.querySelector('output');
        range.addEventListener('input', () => {
          this.state.fi = { ...(this.state.fi || {}), valence: parseFloat(range.value) };
          out.textContent = fmt(range.value);
          this.onChange(this.state);
        });
        wrap.querySelector('.value-name').addEventListener('input', (e) => {
          this.state.fi = { ...(this.state.fi || {}), value: e.target.value || 'a personal value' };
          this.onChange(this.state);
        });
        card.appendChild(wrap);
      } else {
        const group = document.createElement('div');
        group.className = 'instrument-options';
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', inst.question);
        for (const o of inst.options) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'opt';
          b.setAttribute('role', 'radio');
          const on = (this.state[key] || {})[inst.field] === o.v;
          b.setAttribute('aria-checked', on ? 'true' : 'false');
          b.innerHTML = `<b>${o.label}</b><small>${o.note}</small>`;
          b.addEventListener('click', () => {
            this.state[key] = { ...(this.state[key] || {}), [inst.field]: o.v };
            [...group.children].forEach((c) => c.setAttribute('aria-checked', 'false'));
            b.setAttribute('aria-checked', 'true');
            this.onChange(this.state);
          });
          group.appendChild(b);
        }
        card.appendChild(group);
      }
      host.appendChild(card);
    }
  }
}

const fmt = (v) => {
  const n = parseFloat(v);
  return n === 0 ? '0.00' : (n > 0 ? '+' : '') + n.toFixed(2);
};
const escapeAttr = (s) => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
