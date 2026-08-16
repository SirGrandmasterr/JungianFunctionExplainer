/* ============================================================
   CURRENTS · Playground — the Assembly
   The stack builder. Two real choices, two entailments.

   The encoding is never presented as a rule table. It is
   presented as eight objects, two magnetic constraints, and one
   inevitability — and the captions name what the hands just felt.

   A user who never attempts an illegal drop never sees a
   rejection. A user who tries all five gets five different
   one-line reasons and has learned the whole encoding without
   being taught it. Both paths are correct; that is the design.
   ============================================================ */
import { FN, legalAux, refusal, deriveStack, typeCode, opposite, allTypes } from './types.js';
import { ANCHOR, ASSEMBLY, LAWS, RANK_LABEL, SHELF_ORDER } from '../data/playground-data.js';

const RANKS = ['dom', 'aux', 'tert', 'inf'];
const COLUMN = { dom: 'left', aux: 'left', tert: 'right', inf: 'right' };

/** The shape grammar, as a small mark: lens = circle, valve = hexagon;
    extraverted rims are open and glow out, introverted rims are doubled. */
export function glyphMark(fnKey, size = 34) {
  const f = FN[fnKey];
  const r = size / 2 - 3;
  const c = size / 2;
  const col = `var(${{ n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' }[f.el]})`;
  const hex = (rr) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push(`${(c + rr * Math.cos(a)).toFixed(1)},${(c + rr * Math.sin(a)).toFixed(1)}`);
    }
    return pts.join(' ');
  };
  const open = f.att === 'e';
  let body;
  if (f.cls === 'perceive') {
    body = open
      ? `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${col}" stroke-width="2"
           pathlength="100" stroke-dasharray="80 20" stroke-dashoffset="60"/>`
      : `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${col}" stroke-width="1.8"/>
         <circle cx="${c}" cy="${c}" r="${r * 0.62}" fill="none" stroke="${col}" stroke-width="1.2"/>`;
  } else {
    body = open
      ? `<polygon points="${hex(r)}" fill="none" stroke="${col}" stroke-width="2"
           pathlength="100" stroke-dasharray="82 18" stroke-dashoffset="9"/>`
      : `<polygon points="${hex(r)}" fill="none" stroke="${col}" stroke-width="1.8"/>
         <polygon points="${hex(r * 0.62)}" fill="none" stroke="${col}" stroke-width="1.2"/>`;
  }
  const glow = open
    ? `<circle cx="${c}" cy="${c}" r="${r * 1.28}" fill="none" stroke="${col}" stroke-width="3.5" opacity="0.13"/>`
    : `<circle cx="${c}" cy="${c}" r="${r * 0.24}" fill="${col}" opacity="0.75"/>`;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">${glow}${body}</svg>`;
}

export class Assembly {
  /**
   * @param {HTMLElement} stage  the Vessel stage — the build happens in place
   * @param {HTMLElement} shelf  where the eight functions live
   * @param {Object} ui          { caption, prompt, lawbook, typeChip, done }
   */
  constructor(stage, shelf, ui = {}) {
    this.stage = stage;
    this.shelf = shelf;
    this.ui = ui;
    this.dom = null;
    this.aux = null;
    this.confirmed = new Set();
    this.freePlay = false;
    this.lawsSeen = new Set();
    this.onComplete = ui.onComplete || null;
    this.onStep = ui.onStep || null;

    this.slots = {};
    this._buildStage();
    this._buildShelf();
    this.reset();
  }

  /* ---------- scaffolding ---------- */

  _buildStage() {
    this.layer = document.createElement('div');
    this.layer.className = 'assembly-layer';
    for (const rank of RANKS) {
      const el = document.createElement('div');
      el.className = `aslot rank-${rank}`;
      el.dataset.rank = rank;
      el.innerHTML = `<span class="aslot-ring"></span><span class="aslot-label">${RANK_LABEL[rank]}</span>`;
      this.layer.appendChild(el);
      this.slots[rank] = el;
      el.addEventListener('click', () => this._slotClicked(rank));
    }
    this.stage.appendChild(this.layer);
    this._placeSlots();
    this._ro = new ResizeObserver(() => this._placeSlots());
    this._ro.observe(this.stage);
  }

  _placeSlots() {
    const r = this.stage.getBoundingClientRect();
    if (!r.width) return;
    for (const rank of RANKS) {
      /* Until a dominant exists there is no attitude to place rows by, so the
         empty keel is drawn symmetrically: two above, two below, always. */
      const row = this._rowFor(rank);
      const el = this.slots[rank];
      el.style.left = `${(COLUMN[rank] === 'left' ? ANCHOR.left : ANCHOR.right) * 100}%`;
      el.style.top = `${(row === 'above' ? ANCHOR.above : ANCHOR.below) * 100}%`;
    }
  }

  _rowFor(rank) {
    const stack = this._stack();
    const fn = stack && stack[rank];
    if (fn) return FN[fn].att === 'e' ? 'above' : 'below';
    return rank === 'dom' || rank === 'tert' ? 'above' : 'below';
  }

  _buildShelf() {
    this.shelf.innerHTML = '';
    this.items = {};
    for (const fnKey of SHELF_ORDER) {
      const b = document.createElement('button');
      b.className = `shelf-fn el-${FN[fnKey].el}`;
      b.type = 'button';
      b.dataset.fn = fnKey;
      b.innerHTML =
        `${glyphMark(fnKey, 40)}<b>${FN[fnKey].label}</b>` +
        `<small>${FN[fnKey].att === 'e' ? 'outward' : 'inward'} · ${FN[fnKey].cls === 'perceive' ? 'lens' : 'valve'}</small>`;
      b.title = `${FN[fnKey].name} — ${FN[fnKey].glyph}`;
      this.shelf.appendChild(b);
      this.items[fnKey] = b;
      this._wireDrag(b, fnKey);
      b.addEventListener('click', (e) => { if (!this._dragged) this._attempt(fnKey); });
      b.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._attempt(fnKey); }
      });
    }
  }

  /** Pointer drag, with click as the equivalent path (§5.5 — every drag
      interaction has a select-then-place twin, and here they share a handler). */
  _wireDrag(el, fnKey) {
    el.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      this._dragged = false;
      const start = { x: ev.clientX, y: ev.clientY };
      let ghost = null;
      const move = (e) => {
        if (!this._dragged && Math.hypot(e.clientX - start.x, e.clientY - start.y) < 6) return;
        if (!this._dragged) {
          this._dragged = true;
          ghost = document.createElement('div');
          ghost.className = 'drag-ghost';
          ghost.innerHTML = glyphMark(fnKey, 52);
          document.body.appendChild(ghost);
          this._previewOn(fnKey);
        }
        ghost.style.left = `${e.clientX}px`;
        ghost.style.top = `${e.clientY}px`;
        const over = this._slotUnder(e.clientX, e.clientY);
        for (const r of RANKS) this.slots[r].classList.toggle('hot', r === over);
      };
      const up = (e) => {
        el.releasePointerCapture?.(ev.pointerId);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        for (const r of RANKS) this.slots[r].classList.remove('hot');
        this._previewOff();
        if (ghost) ghost.remove();
        if (this._dragged) {
          const over = this._slotUnder(e.clientX, e.clientY);
          const inStage = this._inStage(e.clientX, e.clientY);
          if (over || inStage) this._attempt(fnKey, over);
          setTimeout(() => { this._dragged = false; }, 0);
        }
      };
      el.setPointerCapture?.(ev.pointerId);
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  _slotUnder(x, y) {
    for (const r of RANKS) {
      const b = this.slots[r].getBoundingClientRect();
      if (x >= b.left - 18 && x <= b.right + 18 && y >= b.top - 18 && y <= b.bottom + 18) return r;
    }
    return null;
  }

  _inStage(x, y) {
    const b = this.stage.getBoundingClientRect();
    return x >= b.left && x <= b.right && y >= b.top && y <= b.bottom;
  }

  /* ---------- the beats ---------- */

  get phase() {
    if (!this.dom) return 0;
    if (!this.aux) return 1;
    if (this.confirmed.size < 2) return 2;
    return 3;
  }

  _stack() {
    if (!this.dom) return null;
    if (!this.aux) return { dom: this.dom, inf: opposite(this.dom) };
    return deriveStack(this.dom, this.aux);
  }

  reset() {
    this.dom = null; this.aux = null; this.confirmed.clear();
    for (const r of RANKS) {
      this.slots[r].className = `aslot rank-${r}`;
      this.slots[r].innerHTML = `<span class="aslot-ring"></span><span class="aslot-label">${RANK_LABEL[r]}</span>`;
    }
    this.layer.style.display = '';
    this._refresh();
  }

  /** A placement attempt — the only entry point, shared by drag and click. */
  _attempt(fnKey, targetRank = null) {
    const phase = this.phase;

    if (phase === 0) {
      if (targetRank && targetRank !== 'dom' && !this.freePlay) {
        return this._refuse(targetRank, { reason: 'Start with the function that leads. Everything else follows from it.' });
      }
      this.dom = fnKey;
      this._seat('dom', fnKey);
      this._seat('inf', opposite(fnKey), true);
      this._say(ASSEMBLY.dom(fnKey), 3);
      this._noteLaw(3);
      return this._refresh();
    }

    if (phase === 1) {
      const why = this.freePlay ? null : refusal(this.dom, fnKey);
      if (why) return this._refuse(targetRank || 'aux', why);
      this.aux = fnKey;
      this._seat('aux', fnKey);
      this._seat('tert', opposite(fnKey), true);
      this._say(ASSEMBLY.aux(this.dom, fnKey));
      return this._refresh();
    }

    if (phase === 2) {
      const stack = this._stack();
      const wanted = RANKS.find((r) => !this.confirmed.has(r) && (r === 'tert' || r === 'inf') && stack[r] === fnKey);
      if (!wanted) return this._refuse(targetRank || 'tert', { reason: ASSEMBLY.spoken });
      return this._confirm(wanted);
    }
  }

  _slotClicked(rank) {
    if (this.phase === 2 && (rank === 'tert' || rank === 'inf') && !this.confirmed.has(rank)) this._confirm(rank);
  }

  _confirm(rank) {
    this.confirmed.add(rank);
    const el = this.slots[rank];
    el.classList.remove('ghost');
    el.classList.add('seated', 'just-seated');
    setTimeout(() => el.classList.remove('just-seated'), 620);
    if (this.confirmed.size === 2) this._say(ASSEMBLY.entail);
    this._refresh();
  }

  _seat(rank, fnKey, ghost = false) {
    const el = this.slots[rank];
    el.classList.add('seated');
    el.classList.toggle('ghost', ghost);
    el.dataset.fn = fnKey;
    el.style.setProperty('--el', `var(${{ n: '--c-n', s: '--c-s', t: '--c-t', f: '--c-f' }[FN[fnKey].el]})`);
    el.innerHTML =
      `<span class="aslot-mark">${glyphMark(fnKey, rank === 'dom' ? 62 : rank === 'aux' ? 52 : 42)}</span>` +
      `<b class="aslot-fn">${FN[fnKey].label}</b>` +
      `<span class="aslot-label">${RANK_LABEL[rank]}${ghost ? ' · comes with' : ''}</span>`;
    if (!ghost) { el.classList.add('just-seated'); setTimeout(() => el.classList.remove('just-seated'), 620); }
    this._placeSlots();
  }

  /** The refusal *is* the lesson — so it names which Law refused, and why. */
  _refuse(rank, why) {
    const el = this.slots[rank] || this.slots.aux;
    el.classList.remove('refuse');
    void el.offsetWidth;
    el.classList.add('refuse');
    setTimeout(() => el.classList.remove('refuse'), 620);
    this._say(why.reason, why.law);
    if (why.law) this._noteLaw(why.law);
  }

  _noteLaw(n) {
    if (this.lawsSeen.has(n) || !this.ui.lawbook) return;
    this.lawsSeen.add(n);
    const law = LAWS.find((l) => l.n === ['', 'I', 'II', 'III'][n]);
    if (!law) return;
    const li = document.createElement('li');
    li.className = 'law revealed';
    li.innerHTML = `<span class="rn">${law.n}</span><b>${law.name}</b><p>${law.rule}</p><i>${law.say}</i>`;
    this.ui.lawbook.appendChild(li);
  }

  _say(text, law) {
    if (this.ui.caption) {
      this.ui.caption.textContent = text;
      this.ui.caption.dataset.law = law || '';
    }
  }

  /** Hovering a candidate sketches the whole future it implies. */
  _previewOn(fnKey) {
    if (this.phase === 0) {
      this.slots.inf.classList.add('preview');
      this.slots.inf.dataset.hint = FN[opposite(fnKey)].label;
    } else if (this.phase === 1 && !refusal(this.dom, fnKey)) {
      const code = typeCode(deriveStack(this.dom, fnKey));
      this.slots.tert.classList.add('preview');
      this.slots.tert.dataset.hint = FN[opposite(fnKey)].label;
      if (this.ui.typeChip) { this.ui.typeChip.textContent = `${code}?`; this.ui.typeChip.classList.add('provisional'); }
    }
  }

  _previewOff() {
    for (const r of RANKS) { this.slots[r].classList.remove('preview'); delete this.slots[r].dataset.hint; }
    if (this.ui.typeChip && this.ui.typeChip.classList.contains('provisional')) {
      this.ui.typeChip.classList.remove('provisional');
      this.ui.typeChip.textContent = this.phase === 3 ? typeCode(this._stack()) || '—' : '';
    }
  }

  /** Re-mark the shelf: legal candidates forward, illegal ones dimmed —
      never hidden, because a refusal the user can trigger teaches more
      than an option they were quietly denied. */
  _refresh() {
    const phase = this.phase;
    const legal = phase === 1 && !this.freePlay ? new Set(legalAux(this.dom)) : null;
    const stack = this._stack();
    const seated = new Set(stack ? RANKS.map((r) => stack[r]).filter(Boolean) : []);

    for (const fnKey of SHELF_ORDER) {
      const el = this.items[fnKey];
      el.classList.toggle('seated', seated.has(fnKey));
      el.classList.toggle('candidate', !!legal && legal.has(fnKey));
      el.classList.toggle('dimmed', (!!legal && !legal.has(fnKey)) || (phase >= 2 && !seated.has(fnKey)));
      el.disabled = phase === 3;
    }

    if (this.ui.prompt) {
      this.ui.prompt.textContent = [ASSEMBLY.prompt0, ASSEMBLY.prompt1, ASSEMBLY.prompt2, ASSEMBLY.prompt3][phase];
    }
    if (this.ui.typeChip && phase === 3) {
      this.ui.typeChip.textContent = typeCode(stack) || 'unclassifiable';
      this.ui.typeChip.classList.remove('provisional');
    }
    if (this.ui.done) this.ui.done.disabled = phase !== 3;
    if (this.onStep) this.onStep(phase, stack);
    if (phase === 3 && this.onComplete) this.onComplete(deriveStack(this.dom, this.aux));
  }

  /** Play the same four beats on rails, for users who arrive knowing their
      letters. Knowing the code must not exempt anyone from the two Laws. */
  autoBuild(code, speed = 620) {
    const t = allTypes().find((x) => x.code === code.toUpperCase());
    if (!t) return;
    this.reset();
    const seq = [
      () => this._attempt(t.stack.dom),
      () => this._attempt(t.stack.aux),
      () => this._confirm('tert'),
      () => this._confirm('inf'),
    ];
    seq.forEach((fn, i) => setTimeout(fn, speed * (i + 1)));
  }

  hide() { this.layer.style.display = 'none'; }
  show() { this.layer.style.display = ''; }
  destroy() { if (this._ro) this._ro.disconnect(); this.layer.remove(); }
}
