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
import { ANCHOR, ASSEMBLY, AUTO, LAWS, PACE, RANK_LABEL, SHELF_ORDER } from '../data/playground-data.js';
import { REDUCED } from '../utils/dom.js';

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
    this._closeAuto({ refresh: false });
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
    setTimeout(() => el.classList.remove('just-seated'), PACE.seat);
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
    if (!ghost) { el.classList.add('just-seated'); setTimeout(() => el.classList.remove('just-seated'), PACE.seat); }
    this._placeSlots();
  }

  /** The refusal *is* the lesson — so it names which Law refused, and why. */
  _refuse(rank, why) {
    const el = this.slots[rank] || this.slots.aux;
    el.classList.remove('refuse');
    void el.offsetWidth;
    el.classList.add('refuse');
    setTimeout(() => el.classList.remove('refuse'), PACE.refuse);
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
      el.disabled = phase === 3 || !!this._auto;
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

  /* ---------- the auto-build (§2.4) ----------
     The same four beats, on rails, for users who arrive knowing their letters.
     They skipped the build, so the build comes to them: every beat is held for
     as long as its caption takes to read, and the two refusals a manual builder
     triggers by hand are staged rather than waited for. Knowing the code must
     not exempt anyone from the two Laws — an auto-build that only ever revealed
     Law III would teach the entailment and hide the constraints that cause it.
     The whole sequence is skippable, because a cutscene you cannot leave is a
     cutscene that gets sat through rather than watched. */

  /**
   * The two illegal candidates worth staging under a given dominant: one that
   * breaks only Law II (same job) and one that breaks only Law I (same world).
   * Each is picked so its refusal names exactly one Law — a candidate that
   * breaks both, as Se does under Ne, gets reported as Law II and teaches Law I
   * to nobody. Neither can collide with the real auxiliary, which by definition
   * differs from the dominant on both counts.
   */
  _scriptedCandidates(dom) {
    const d = FN[dom];
    const pick = (test) => SHELF_ORDER.find((k) => k !== dom && k !== opposite(dom) && test(FN[k]));
    return [
      pick((f) => f.cls === d.cls && f.att !== d.att),   /* Law II — two of the same job   */
      pick((f) => f.att === d.att && f.cls !== d.cls),   /* Law I  — two of the same world */
    ];
  }

  /** @param {string} code  a four-letter type; unknown codes are ignored */
  autoBuild(code) {
    const t = allTypes().find((x) => x.code === code.toUpperCase());
    if (!t) return;
    this.reset();                                  /* also cancels a cutscene already running */

    const [lawII, lawI] = this._scriptedCandidates(t.stack.dom);
    const move = (ms) => (REDUCED ? 0 : ms);       /* motion-only beats collapse; captions never do */

    this._auto = {
      next: 0,
      timer: null,
      beats: [
        { run: () => this._say(AUTO.open(t.code)), hold: PACE.lead },
        { run: () => this._attempt(t.stack.dom) },
        { run: () => this._fly(lawII), hold: move(PACE.fly) },
        { run: () => this._land(lawII) },
        { run: () => this._fly(lawI), hold: move(PACE.fly) },
        { run: () => this._land(lawI) },
        { run: () => this._attempt(t.stack.aux) },
        { run: () => { this._confirm('tert'); this._say(AUTO.tert(t.stack.tert)); } },
        { run: () => this._confirm('inf') },
      ],
    };
    this._openSkip();
    this._refresh();
    this._beat();
  }

  /** Play the pending beat, then hold for as long as what it just said needs. */
  _beat() {
    const a = this._auto;
    if (!a) return;
    const b = a.beats[a.next++];
    b.run();
    if (a.next >= a.beats.length) return this._closeAuto();
    a.timer = setTimeout(() => this._beat(), b.hold != null ? b.hold : this._readTime());
  }

  /** Dwell scaled to the caption on screen. Under reduced motion nothing moves,
      so the caption is the entire beat — it gets its full read, not a skip. */
  _readTime() {
    if (REDUCED) return PACE.reduced;
    const n = this.ui.caption ? this.ui.caption.textContent.length : 0;
    return Math.min(PACE.readMax, Math.max(PACE.readMin, Math.round(n * PACE.read)));
  }

  /** A refused candidate makes the trip anyway, shelf to auxiliary slot: a Law
      you watch something bounce off is a Law you remember. */
  _fly(fnKey) {
    if (!fnKey || REDUCED || this._skipping) return;
    const item = this.items[fnKey];
    const from = item && item.getBoundingClientRect();
    const to = this.slots.aux.getBoundingClientRect();
    if (!from || !to.width) return;
    item.classList.add('attempting');
    const g = document.createElement('div');
    g.className = 'fly-ghost';
    g.innerHTML = glyphMark(fnKey, 52);
    g.style.left = `${from.left + from.width / 2}px`;
    g.style.top = `${from.top + from.height / 2}px`;
    g.style.transitionDuration = `${PACE.fly}ms`;
    document.body.appendChild(g);
    void g.offsetWidth;                            /* commit the start point, then aim */
    g.style.left = `${to.left + to.width / 2}px`;
    g.style.top = `${to.top + to.height / 2}px`;
    this._flying = g;
  }

  /** …and is turned away. The reason is the same one-liner a hand-made attempt
      gets, so the staged refusal and a real one cannot say different things. */
  _land(fnKey) {
    if (this._flying) {
      const g = this._flying;
      this._flying = null;
      g.classList.add('rejected');
      setTimeout(() => g.remove(), PACE.refuse);
    }
    if (this.items[fnKey]) this.items[fnKey].classList.remove('attempting');
    const why = fnKey && refusal(this.dom, fnKey);
    if (!why) return;
    const said = { ...why, reason: AUTO.refused(fnKey, why.reason) };
    /* Skipping, or motion-averse: the Law still gets named and written down —
       only the shudder is dropped. */
    if (this._skipping || REDUCED) {
      this._say(said.reason, said.law);
      return this._noteLaw(said.law);
    }
    this._refuse('aux', said);
  }

  /** The escape hatch. Everything the cutscene had left to say is still said —
      both Laws noted, the stack finished — it just happens at once. */
  skipAuto() {
    const a = this._auto;
    if (!a) return;
    clearTimeout(a.timer);
    this._skipping = true;
    try { while (a.next < a.beats.length) a.beats[a.next++].run(); }
    finally { this._skipping = false; }
    this._closeAuto();
  }

  _openSkip() {
    if (!this._skipBtn) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'asm-skip';
      b.textContent = AUTO.skip;
      this.layer.appendChild(b);
      this._skipBtn = b;
    }
    if (!this._skipHit) {
      /* Capture, so a click anywhere on the stage — empty space, a slot, or the
         Skip button itself — skips instead of landing on whatever it hit. */
      this._skipHit = (e) => { e.stopPropagation(); e.preventDefault(); this.skipAuto(); };
      this.stage.addEventListener('click', this._skipHit, true);
    }
  }

  _closeAuto({ refresh = true } = {}) {
    if (!this._auto) return;
    clearTimeout(this._auto.timer);
    this._auto = null;
    if (this._flying) { this._flying.remove(); this._flying = null; }
    if (this._skipBtn) { this._skipBtn.remove(); this._skipBtn = null; }
    if (this._skipHit) { this.stage.removeEventListener('click', this._skipHit, true); this._skipHit = null; }
    if (refresh) this._refresh();
  }

  hide() { this.layer.style.display = 'none'; }
  show() { this.layer.style.display = ''; }
  destroy() { this._closeAuto({ refresh: false }); if (this._ro) this._ro.disconnect(); this.layer.remove(); }
}
