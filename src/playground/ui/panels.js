/* ============================================================
   CURRENTS · Playground — spine, rail, envelope, control bar
   BUILD-SPEC §6.3, §7. S3 callouts 1–3, 11–13, 15.
   ============================================================ */
import { FN, RANKS } from '../types.js';
import { STATE_LABEL, rowFlex } from '../model.js';
import { markSVG } from './marks.js';
import { stateReason } from '../machine.js';
import { routeSignature } from '../scenario.js';

const pct = (v) => `${(v * 100).toFixed(2)}%`;
const sign = (v) => (v >= 0 ? '+' : '−') + Math.abs(Math.round(v));

/* ============================================================
   The involvement spine — the Strategy-B graft.
   One continuous bar, four segments, summing to exactly 100%.
   Row heights are set by RANK; segments by INVOLVEMENT. The
   mismatch is itself the readout: a segment taller than its own
   row means that function is working above its station.
   ============================================================ */
export class Spine {
  constructor() {
    const el = document.createElement('div');
    el.className = 'pg-spine';
    el.innerHTML = `<span class="kick sp-kick">share</span>
      <div class="sp-body">
        ${RANKS.map((r) => `<div class="sp-seg" data-rank="${r}">
            <span class="sp-lab"></span><span class="sp-pct"></span>
            <i class="sp-over" hidden title="working above its station">▲</i>
          </div>`).join('')}
        <div class="sp-fore" hidden>${[0, 1, 2].map(() => '<i></i>').join('')}</div>
      </div>
      <span class="sp-foot">100%</span>`;
    this.el = el;
    this.segs = [...el.querySelectorAll('.sp-seg')];
    this.foreLines = [...el.querySelectorAll('.sp-fore i')];
    this.fore = el.querySelector('.sp-fore');
  }

  update(stack, fnStates, machine, forecast) {
    let acc = 0;
    const totalFlex = RANKS.reduce((a, r) => a + rowFlex(r, machine), 0);
    RANKS.forEach((r, i) => {
      const k = stack[r];
      const v = fnStates[k].involvement;
      const seg = this.segs[i];
      seg.style.top = pct(acc);
      seg.style.height = pct(v);
      seg.dataset.fn = k;
      seg.style.setProperty('--fn-c', `var(${{ n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' }[FN[k].el]})`);
      const lab = seg.querySelector('.sp-lab');
      if (lab.textContent !== FN[k].label) lab.textContent = FN[k].label;
      const p = seg.querySelector('.sp-pct');
      const ps = `${Math.round(v * 100)}%`;
      if (p.textContent !== ps) p.textContent = ps;
      seg.dataset.thin = v < 0.09 ? 'true' : 'false';

      /* the mismatch tell — segment taller than the row it belongs to */
      const rowShare = rowFlex(r, machine) / totalFlex;
      seg.querySelector('.sp-over').hidden = !(v > rowShare + 0.03);
      acc += v;
    });

    if (!forecast) { this.fore.hidden = true; return; }
    this.fore.hidden = false;
    let facc = 0;
    RANKS.forEach((r, i) => {
      facc += forecast[stack[r]].involvement;
      if (i < 3) this.foreLines[i].style.top = pct(facc);
    });
  }
}

/* ============================================================
   The action rail
   ============================================================ */
export class ActionRail {
  constructor({ onHover, onCommit }) {
    const el = document.createElement('div');
    el.className = 'pg-rail';
    el.innerHTML = `<div class="rail-head">
        <span class="kick rh-title"></span>
        <span class="rh-sub"></span>
      </div>
      <div class="rail-cards" role="radiogroup" aria-label="Candidate actions"></div>`;
    this.el = el;
    this.cardsEl = el.querySelector('.rail-cards');
    this.onHover = onHover;
    this.onCommit = onCommit;
    this.cards = new Map();
    this.active = null;
    this.locked = false;

    el.addEventListener('pointerleave', () => { if (!this.locked) this.select(null, false); });
    this.cardsEl.addEventListener('keydown', (e) => this.onKey(e));
  }

  setHeader(title, sub) {
    this.el.querySelector('.rh-title').textContent = title;
    this.el.querySelector('.rh-sub').textContent = sub;
  }

  /** Rebuild only when the deck itself changes (state transition). */
  setDeck(deck, stack, odds) {
    this.cardsEl.innerHTML = '';
    this.cards.clear();
    deck.forEach((a, i) => {
      const routed = routeSignature(a, stack);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pg-card';
      b.dataset.id = a.id;
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', 'false');
      b.tabIndex = i === 0 ? 0 : -1;
      if (a.axis) b.dataset.axis = a.axis;

      const chips = Object.entries(a.signature)
        .sort((x, y) => y[1] - x[1])
        .map(([fn, v]) => `<span class="sig" data-el="${FN[fn].el}">${markSVG(fn, 11)}${FN[fn].label} ${Math.round(v * 100)}</span>`)
        .join('');

      b.innerHTML = `
        ${a.axis ? `<span class="axis-tag" data-axis="${a.axis}">${a.axis === 'alleviate' ? 'ALLEVIATES' : 'AGGRAVATES'}</span>` : ''}
        <b class="card-t">${a.label}</b>
        <span class="card-d">${a.detail || ''}</span>
        <span class="card-sig">${chips}</span>
        ${routed.routed ? `<span class="card-note">${routed.notes.map((n) => n.text).join(' · ')}</span>` : ''}
        <span class="card-foot">
          <span class="odds">
            <span class="kick">likelihood unforced</span>
            <span class="odds-track"><i></i></span>
            <b class="odds-v">0%</b>
          </span>
          <span class="commit-cta">COMMIT <kbd>⏎</kbd></span>
        </span>`;

      b.addEventListener('pointerenter', () => { if (!this.locked) this.select(a.id, false); });
      b.addEventListener('focus', () => { if (!this.locked) this.select(a.id, false); });
      b.addEventListener('click', () => { if (!this.locked) this.onCommit(a.id); });
      this.cardsEl.appendChild(b);
      this.cards.set(a.id, b);
    });
    this.setOdds(odds);
    this.active = null;
  }

  setOdds(odds) {
    for (const [id, b] of this.cards) {
      const p = odds[id] ?? 0;
      b.querySelector('.odds-track i').style.transform = `scaleX(${p.toFixed(4)})`;
      /* a rounded "0%" reads as broken; a genuinely tiny probability is not zero */
      b.querySelector('.odds-v').textContent =
        p > 0 && p < 0.005 ? '<1%' : `${Math.round(p * 100)}%`;
    }
  }

  /**
   * Adopt the controller's candidate without firing onHover. Needed because
   * the candidate can be cleared from outside the rail (Escape, commit, a
   * state transition); without this the rail's `active` goes stale and
   * re-hovering the same card is silently ignored.
   */
  sync(id) {
    if (this.active === id) return;
    this.active = id;
    for (const [k, b] of this.cards) {
      const on = k === id;
      b.dataset.hovered = on ? 'true' : 'false';
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  select(id, focus) {
    if (this.active === id) return;
    this.active = id;
    for (const [k, b] of this.cards) {
      const on = k === id;
      b.dataset.hovered = on ? 'true' : 'false';
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    }
    if (!id) { const first = this.cardsEl.firstElementChild; if (first) first.tabIndex = 0; }
    this.onHover(id);
  }

  onKey(e) {
    const ids = [...this.cards.keys()];
    if (!ids.length) return;
    const i = ids.indexOf(this.active);
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault(); this.select(ids[(i + 1 + ids.length) % ids.length] ?? ids[0], true);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault(); this.select(ids[(i - 1 + ids.length) % ids.length] ?? ids[ids.length - 1], true);
    } else if (e.key === 'Escape') {
      e.preventDefault(); this.select(null, false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (this.active) { e.preventDefault(); this.onCommit(this.active); }
    }
  }

  setLocked(v) {
    this.locked = v;
    this.el.dataset.locked = v ? 'true' : 'false';
    if (v) this.select(null, false);
  }
}

/* ============================================================
   The scenario envelope header — identity + the Q-C glance
   ============================================================ */
export class Envelope {
  constructor({ onBrief }) {
    const el = document.createElement('header');
    el.className = 'pg-env-head';
    el.innerHTML = `
      <div class="env-id">
        <span class="kick">scenario — envelopes everything below</span>
        <h2 class="env-title"></h2>
        <p class="env-vig"></p>
        <div class="env-row">
          <button type="button" class="btn small env-brief">Briefing ▸</button>
          <span class="vessel-chip"></span>
        </div>
      </div>
      <div class="env-state">
        <div class="state-chip"><b></b><span></span></div>
        <div class="margins">
          <div class="mg" data-k="loop">
            <span class="kick">margin to loop</span>
            <span class="mg-track"><i></i></span>
            <b class="mg-v">—</b>
          </div>
          <div class="mg" data-k="grip">
            <span class="kick">margin to grip</span>
            <span class="mg-track"><i></i></span>
            <b class="mg-v">—</b>
          </div>
        </div>
        <span class="env-beat"></span>
      </div>`;
    this.el = el;
    el.querySelector('.env-brief').addEventListener('click', onBrief);
    this.mg = {};
    el.querySelectorAll('.mg').forEach((m) => { this.mg[m.dataset.k] = m; });
  }

  setScenario(sc, stack) {
    this.el.querySelector('.env-title').textContent = sc.title;
    this.el.querySelector('.env-vig').textContent = sc.vignette;
    const code = RANKS.map((r) => FN[stack[r]].label).join('·');
    this.el.querySelector('.vessel-chip').innerHTML = `<em>vessel</em> ${code}`;
  }

  update(session, margins, forecast, beatNote) {
    const chip = this.el.querySelector('.state-chip');
    chip.dataset.state = session.machine;
    chip.dataset.manual = session.manual ? 'true' : 'false';
    chip.querySelector('b').textContent = STATE_LABEL[session.machine].toUpperCase()
      + (session.manual ? ' · MANUAL' : '');
    chip.querySelector('span').textContent = stateReason(session);

    for (const k of ['loop', 'grip']) {
      const m = margins[k]; const node = this.mg[k];
      node.dataset.in = m.in ? 'true' : 'false';
      node.dataset.na = m.n_a ? 'true' : 'false';
      node.querySelector('i').style.transform = `scaleX(${m.fill.toFixed(3)})`;
      node.querySelector('.mg-v').textContent = m.n_a ? 'n/a' : m.in ? 'IN' : `${m.pts}`;
      const f = forecast?.aggregate;
      node.dataset.warn = f && ((k === 'loop' && f.crossesLoop) || (k === 'grip' && f.crossesGrip)) ? 'true' : 'false';
    }
    this.el.querySelector('.env-beat').textContent = beatNote;
  }
}

/* ============================================================
   The control bar — instructor controls, deliberately at the
   bottom because they are not part of the primary loop.
   ============================================================ */
export class ControlBar {
  constructor({ onManual, onForceExit, onRest, onReset, onSwap }) {
    const el = document.createElement('footer');
    el.className = 'pg-controls';
    el.innerHTML = `
      <div class="cb-block">
        <span class="kick">teaching overrides — manual, always available</span>
        <div class="cb-toggles">
          <label class="sw"><input type="checkbox" data-state="loop"><i></i><span class="t-loop">Loop</span></label>
          <label class="sw"><input type="checkbox" data-state="grip"><i></i><span class="t-grip">Grip</span></label>
          <button type="button" class="btn small cb-exit" hidden>Force exit</button>
        </div>
      </div>
      <div class="cb-block">
        <span class="kick">history scope</span>
        <p class="cb-scope"></p>
      </div>
      <div class="cb-block">
        <span class="kick">recovery</span>
        <div class="cb-toggles">
          <button type="button" class="btn small cb-rest">Rest one beat</button>
          <span class="cb-rest-note">decay only · debt does not clear itself</span>
        </div>
      </div>
      <div class="cb-actions">
        <button type="button" class="btn small cb-swap">Swap type</button>
        <button type="button" class="btn small cb-reset">Reset vessel</button>
      </div>`;
    this.el = el;
    this.inputs = {};
    el.querySelectorAll('.sw input').forEach((i) => {
      this.inputs[i.dataset.state] = i;
      i.addEventListener('change', () => onManual(i.dataset.state, i.checked));
    });
    el.querySelector('.cb-exit').addEventListener('click', onForceExit);
    el.querySelector('.cb-rest').addEventListener('click', onRest);
    el.querySelector('.cb-reset').addEventListener('click', onReset);
    el.querySelector('.cb-swap').addEventListener('click', onSwap);
  }

  update(session) {
    const { stack, machine, manual } = session;
    this.el.querySelector('.t-loop').textContent = `Loop  ${FN[stack.dom].label}–${FN[stack.tert].label}`;
    this.el.querySelector('.t-grip').textContent = `Grip  ${FN[stack.inf].label}`;
    this.inputs.loop.checked = machine === 'loop';
    this.inputs.grip.checked = machine === 'grip';
    this.inputs.loop.disabled = machine === 'grip' && !manual;
    this.el.querySelector('.cb-exit').hidden = !(machine === 'loop' || machine === 'grip');
    this.el.querySelector('.cb-scope').textContent =
      `session · ${session.runs.length} run${session.runs.length === 1 ? '' : 's'} committed · beat ${session.beatIndex} · 20 beats on screen, 256 retained`
      + (session.human.debt > 0 ? ` · debt ${Math.round(session.human.debt)}` : '');
  }
}
