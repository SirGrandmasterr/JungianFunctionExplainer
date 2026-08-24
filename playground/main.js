/* ============================================================
   CURRENTS · Playground — page orchestrator
   Wires the four subsystems together and owns exactly one piece
   of state the pure modules deliberately do not: the Vessel's
   running energy and stress, which persist across actions
   because that is what makes a bill feel like a bill.
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/playground-theme.css';

import { initHeader } from '../src/shared/header.js';
import { FN, allTypes, deriveStack, typeCode, codeParts, stackForCode, isLegal, loopPair } from '../src/playground/types.js';
import { Vessel } from '../src/playground/vessel.js';
import { Assembly, glyphMark } from '../src/playground/assembly.js';
import { Briefing } from '../src/playground/briefing.js';
import { reads } from '../src/playground/monologue.js';
import { resolve, forecast, auditScenarios, ECON } from '../src/playground/ledger.js';
import { readPalette } from '../src/playground/chamber.js';
import { SCENARIOS } from '../src/data/scenarios/index.js';
import { EPISTEMIC, MALFORMED, PROVENANCE, RANK_LABEL, quadrant, ASSEMBLY } from '../src/data/playground-data.js';
import { clamp } from '../src/utils/math.js';

initHeader('playground');

/* Dev-time self-check: an action that couples to a mandate the engine can
   never produce here would fail silently and forever. Shout it at boot,
   over the whole deck, so authoring a scenario cannot outrun the ledger. */
if (import.meta.env && import.meta.env.DEV) auditScenarios(SCENARIOS);

const el = (id) => document.getElementById(id);
el('epistemic').textContent = EPISTEMIC.footer;
el('provToggle').textContent = PROVENANCE.toggle;

/* ---------- state ---------- */
const S = {
  vessel: null,          /* { code, stack } */
  scenario: SCENARIOS[0],
  briefing: null,
  energy: 100,
  stress: 0,
  lastReceipt: null,
  grip: false,
  /* What the last choice left unanswered, and what it charges for it.
     null when nothing is outstanding. See TICK_SECONDS below. */
  rumination: null,      /* { items:[{id,label,perTick}], perTick, ticks, carry } */
};
window.__PG = S;         /* dev handle, matching the convention on every page */

const COL = readPalette();
const stage = el('vesselStage');
/* Rumination is charged on a slow, countable beat rather than continuously:
   the receipt says "+2.1/tick", so a tick has to be a thing you can watch
   arrive. Five seconds is long enough to read the stress bar move and short
   enough that a defiant choice does not feel free. */
const TICK_SECONDS = 5;

const vessel = new Vessel(stage, {
  COL,
  onChamberClick: (fnKey) => { window.location.href = `/${fnKey}/`; },
  onTick: (dt) => accrue(dt),
});
S.view = vessel;

const briefing = new Briefing(el('briefing'), {
  onChange: () => { renderVoices(); renderDeck(); repriceReceipt(); },
});

/* ---------- Phase 1 · the Assembly ---------- */
const assembly = new Assembly(stage, el('shelf'), {
  caption: el('asmCaption'),
  prompt: el('asmPrompt'),
  lawbook: el('lawbook'),
  typeChip: el('typeChip'),
  onComplete: (stack) => commit(stack),
});

el('freePlay').addEventListener('change', (e) => {
  assembly.freePlay = e.target.checked;
  el('freePlayNote').hidden = !e.target.checked;
  el('freePlayNote').textContent = ASSEMBLY.freeplay;
  assembly.reset();
});

el('btnRebuild').addEventListener('click', () => {
  vessel.teardown();          /* clears the stack and the cached circuit too */
  assembly.show();
  assembly.reset();
  el('zone-voyage').hidden = true;
  el('zone-ledger').hidden = true;
  el('vitals').hidden = true;
  closeProvenance();
  S.vessel = null;
  syncDock();                 /* nothing to dock any more */
});

el('btnRandom').addEventListener('click', () => {
  const all = allTypes();
  assembly.freePlay = false;
  el('freePlay').checked = false;
  assembly.autoBuild(all[Math.floor(Math.random() * all.length)].code);
});

/* the type picker — sixteen doors into the same four beats */
const grid = el('typeGrid');
for (const t of allTypes()) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'type-cell'; b.textContent = t.code;
  b.title = ['dom', 'aux', 'tert', 'inf'].map((r) => FN[t.stack[r]].label).join(' · ');
  b.addEventListener('click', () => {
    grid.hidden = true;
    assembly.freePlay = false; el('freePlay').checked = false;
    assembly.autoBuild(t.code);
  });
  grid.appendChild(b);
}
el('btnPicker').addEventListener('click', () => { grid.hidden = !grid.hidden; });

/** The Assembly is finished: hand the stack to the Vessel and open the Voyage. */
function commit(stack) {
  if (S.vessel && S.vessel.stack.dom === stack.dom && S.vessel.stack.aux === stack.aux) return;
  S.vessel = { code: typeCode(stack) || 'unclassifiable', stack };
  S.energy = 100; S.stress = 0; S.grip = false;

  assembly.hide();
  vessel.build(stack);
  vessel.start();

  /* A loop is dominant + tertiary, which always share an attitude — draw the
     orbit only when the pair is actually running hot; here it stays latent. */
  vessel.setLoop(null);

  el('vitals').hidden = false;
  el('zone-voyage').hidden = false;
  el('zone-ledger').hidden = false;
  renderProvenance(stack);

  const bad = !isLegal(stack) && MALFORMED.find((m) => m.test(stack));
  if (bad) el('asmCaption').textContent = `${bad.label}. ${bad.note}`;

  loadScenario(S.scenario);
  fillCompare();
  paintVitals();
  syncDock();
}

/* ---------- Layer 3 · the sources drawer (§2.3) ----------
   The Assembly states the Laws flatly, because a refusal that hedges teaches
   nothing. This is where the mode pays that back: whose rules those were, how
   the four letters came out of two choices, and what the numbers are not.

   It is filled on commit and closed on commit — the drawer opens by hand or
   it does not open. Every word of it comes out of PROVENANCE; nothing here
   decides anything, and no other subsystem reads it. */
function renderProvenance(stack) {
  const P = PROVENANCE;
  const E = P.encoding;

  /* One seat, in the Vessel's own colour grammar. */
  const seat = (rank, fnKey, why) =>
    `<li class="el-${FN[fnKey].el}">` +
      `<b>${FN[fnKey].label}</b><span class="pv-rank">${RANK_LABEL[rank]}</span>` +
      `<small>${why}</small>` +
    `</li>`;

  const seats =
    `<h4>${E.chose}</h4><ul class="pv-seats">` +
      seat('dom', stack.dom, E.chosen.dom) +
      seat('aux', stack.aux, E.chosen.aux(isLegal(stack))) +
    `</ul>` +
    `<h4>${E.entailed}</h4><ul class="pv-seats entailed">` +
      seat('tert', stack.tert, E.entail.tert(FN[stack.aux].label)) +
      seat('inf', stack.inf, E.entail.inf(FN[stack.dom].label)) +
    `</ul>`;

  /* The letters are read off the same derivation the type chip uses, so the
     chip and its explanation cannot drift apart. Free Play can seat a stack
     no four letters describe; that case says so instead of inventing one. */
  const parts = codeParts(stack);
  const code = parts
    ? `<ol class="pv-code">` +
        parts.map((p) => `<li><b>${p.letter}</b><small>${E.letters[p.of](p.fn)}</small></li>`).join('') +
      `</ol>`
    : `<p class="pv-note">${E.unclassifiable}</p>`;

  const sources =
    `<h4>${P.sources.lead}</h4><p class="pv-note">${P.sources.intro}</p>` +
    `<ul class="pv-src">` +
      P.sources.items.map((it) =>
        `<li><b>${it.claim}</b>` +
        `<span class="pv-standing"><i>${it.law}</i>${it.standing}</span>` +
        `<small>${it.note}</small></li>`).join('') +
    `</ul>` +
    `<p class="pv-note">${P.sources.close}</p>`;

  el('provBody').innerHTML =
    `<h4>${E.lead}</h4>${seats}` +
    `<h4>${E.code}</h4>${code}` +
    sources +
    `<p class="pv-caveat"><b>${P.caveats.lead}</b> ${P.caveats.note}</p>`;

  closeProvenance(true);
}

/** Reveal the toggle without opening it, or — with no Vessel — take it away. */
function closeProvenance(available = false) {
  const d = el('provenance');
  d.open = false;
  d.hidden = !available;
}

/* ---------- Phase 3 · the Voyage ---------- */
const row = el('scenarioRow');
for (const sc of SCENARIOS) {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'scenario-card'; b.dataset.id = sc.id;
  b.innerHTML = `<b>${sc.title}</b><span>${sc.blurb}</span>`;
  b.addEventListener('click', () => loadScenario(sc));
  row.appendChild(b);
}

function loadScenario(sc) {
  S.scenario = sc;
  [...row.children].forEach((c) => c.setAttribute('aria-pressed', c.dataset.id === sc.id ? 'true' : 'false'));
  el('vignette').textContent = sc.vignette;
  renderSurface(sc);
  S.briefing = briefing.load(sc, S.vessel);
  briefing.setVessel(S.vessel);
  S.briefing = briefing.state;
  hideReceipt();
  renderVoices();
  renderDeck();
}

/** The four objective hooks, shown as what they are: facts of the room. */
function renderSurface(sc) {
  const host = el('surfaceHooks');
  host.innerHTML = '';
  const s = sc.surface || {};
  const rows = [
    ['se', 'sensory · urgency', pct(Math.max(s.se?.intensity || 0, s.se?.urgency || 0)), (s.se?.affordances || []).join(' · ')],
    ['ne', 'ambiguity', pct(s.ne?.ambiguity || 0), (s.ne?.possibilities || []).join(' · ')],
    ['te', 'stakes', pct(s.te?.stakes || 0), s.te?.metric || ''],
    ['fe', 'the room', s.fe?.audience ? `${s.fe.audience} people` : 'nobody', s.fe?.tone || ''],
  ];
  for (const [fn, k, v, note] of rows) {
    const d = document.createElement('div');
    d.className = `hook el-${FN[fn].el}`;
    d.innerHTML = `${glyphMark(fn, 22)}<span class="k">${k}</span><b>${v}</b><small>${note}</small>`;
    host.appendChild(d);
  }
}
const pct = (v) => `${Math.round(v * 100)}%`;

function renderVoices() {
  if (!S.vessel) return;
  const host = el('voices');
  host.innerHTML = '';
  const rs = reads(S.vessel, S.scenario, briefing.state);
  if (!rs.length) { host.innerHTML = '<p class="micro">This scenario has nothing to say to this stack.</p>'; return; }
  rs.forEach((r, i) => {
    const d = document.createElement('div');
    d.className = `voice ${r.register.cls} el-${FN[r.fn].el}`;
    d.style.animationDelay = `${i * 110}ms`;
    d.innerHTML =
      `<span class="tag">${r.label} · ${RANK_LABEL[r.rank]} · ${r.register.tag}</span>` +
      `<p>${r.text}</p>`;
    host.appendChild(d);
    /* the loudest read lights its chamber on the Vessel */
    vessel.activate(r.rank, clamp(r.salience * 1.4, 0.15, 1));
  });
}

/* ---------- Phase 4 · the Ledger ---------- */
function renderDeck() {
  if (!S.vessel) return;
  const host = el('actionDeck');
  host.innerHTML = '';

  /* A stack with no valve cannot choose. The Free Play copy says the deck
     goes dead, so the deck goes dead — a promise the interface makes about
     the model has to be one the model keeps. */
  const canDecide = Object.values(S.vessel.stack).some((k) => k && FN[k].cls === 'judge');
  if (!canDecide) {
    host.innerHTML =
      '<p class="deck-dead">Nothing here can be chosen. This psyche has four lenses and no valve: ' +
      'the stimulus is arriving, circling, and never collapsing into a decision. Watch the circuit — ' +
      'it never crosses back out.</p>';
    return;
  }

  const f = forecast(S.scenario.actions, S.vessel, S.scenario, briefing.state);
  const top = Math.max(...f.map((x) => x.p));

  for (const x of f) {
    const a = x.action;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `action-card${x.p === top ? ' likeliest' : ''}`;
    const pips = Math.round(x.p * 10);
    card.innerHTML =
      `<div class="ac-head"><b>${a.label}</b>` +
      `<span class="odds" title="${EPISTEMIC.forecast}">${Math.round(x.p * 100)}%</span></div>` +
      `<p class="ac-detail">${a.detail || ''}</p>` +
      `<div class="ac-foot">` +
        `<span class="pips" aria-hidden="true">${'<i class="on"></i>'.repeat(pips)}${'<i></i>'.repeat(10 - pips)}</span>` +
        `<span class="ac-sig">${Object.entries(a.signature).map(([k, v]) =>
          `<em class="el-${FN[k].el}">${FN[k].label} ${v.toFixed(2).slice(1)}</em>`).join('')}</span>` +
      `</div>`;
    card.addEventListener('click', () => execute(x));
    host.appendChild(card);
  }
}

function execute(x) {
  const r = x.receipt;
  /* `paid` is frozen at this moment and never re-resolved: it is what came out
     of the pool, under the briefing that was live when the choice was made.
     `shown` is whatever the receipt is currently displaying, which the
     Briefing is free to move. Keeping them apart is the whole of rule 3 —
     re-pricing a bill is not the same as charging it again. */
  S.lastReceipt = { entry: x, paid: r, shown: r, forcedAt: x.p };

  S.energy = clamp(S.energy - r.energy, 0, 100);
  S.stress = clamp(S.stress + r.stress.total, 0, 100);
  setRumination(r);
  paintVitals();

  vessel.execute(r);
  renderReceipt(el('receipt'), r, { title: S.vessel.code, odds: x.p, forcedAt: x.p, paid: r });
  el('receiptEmpty').hidden = true;
  el('receipt').hidden = false;
  el('compareRow').hidden = false;
  el('receiptB').hidden = true;

  checkGrip();
}

/** This action's odds under whatever the Briefing currently says. */
function oddsFor(action, v) {
  const hit = forecast(S.scenario.actions, v, S.scenario, briefing.state)
    .find((x) => x.action.id === action.id);
  return hit ? hit.p : 0;
}

/**
 * Re-price the standing receipt against the current Briefing.
 *
 * "Same event, different past — different event" is the mode's claim, and
 * until now the Briefing could only demonstrate it on actions not yet taken:
 * the deck re-priced, the receipt sat there with the numbers from a past the
 * user had already moved on from. Dragging the Fi slider now drags the bill
 * — subsidy, relief, betrayal, the odds in the header — because all of those
 * were always functions of the briefing and nothing was asking them again.
 *
 * Display only. S.energy, S.stress and the rumination the choice started are
 * untouched: the pool was charged once, by the action, at the briefing it was
 * taken under, and no amount of reconsidering it afterwards moves that.
 */
function repriceReceipt() {
  const lr = S.lastReceipt;
  if (!lr || !S.vessel || el('receipt').hidden) return;

  lr.shown = resolve(lr.entry.action, S.vessel, S.scenario, briefing.state);
  renderReceipt(el('receipt'), lr.shown, {
    title: S.vessel.code,
    odds: oddsFor(lr.entry.action, S.vessel),
    forcedAt: lr.forcedAt,
    paid: lr.paid,
    flash: true,
  });
  if (!el('receiptB').hidden) renderCounterfactual({ flash: true });
}

/** Has the displayed bill moved away from the one the pool actually paid? */
function hasDrifted(shown, paid) {
  if (!paid || shown === paid) return false;
  const d = (a, b) => Math.abs(a - b) > 0.05;
  return d(shown.energy, paid.energy)
    || d(shown.stress.total, paid.stress.total)
    || d(shown.pleasure.total, paid.pleasure.total)
    || d(shown.interest, paid.interest);
}

function renderReceipt(host, r, meta) {
  /* Read the outgoing numbers before they are overwritten. Rows carry a
     stable data-k precisely so this survives the lines re-sorting under a
     briefing that changed which chamber is now the expensive one. */
  const was = new Map([...host.querySelectorAll('.r-row[data-k]')]
    .map((n) => [n.dataset.k, n.querySelector('.v').textContent]));

  const money = (v) => `${v >= 0 ? '' : '−'}${Math.abs(v).toFixed(1)}`;
  /* Each invented coefficient carries its own definition on hover; the
     legend below the bill repeats them for anyone not holding a mouse. */
  const term = (tip, text) => `<span class="r-term" title="${tip}">${text}</span>`;
  const rows = r.lines.map((l) => {
    const mult = ({ dom: '1.0', aux: '1.5', tert: '2.5', inf: '4.0' })[l.rank];
    const tag = `${FN[l.fn].label} <i>(${l.rank} ${term(EPISTEMIC.tips.mult, `×${mult}`)}` +
      `${l.tau > 1 ? ` · ${term(EPISTEMIC.tips.tau, `τ${l.tau}`)}` : ''}` +
      `${l.gate !== 1 ? ` · ${term(EPISTEMIC.tips.gate, `gate ${l.gate}`)}` : ''})</i>`;
    return line(`<em class="el-${FN[l.demand].el}">${FN[l.demand].label} ${l.share.toFixed(2).slice(1)}</em> → ${tag}`, `${money(l.cost)} u`, l.tau > 1 ? 'taxed' : '', `line:${l.demand}`);
  }).join('');

  const adj = [
    r.subsidy > 0.05 ? line(`conviction subsidy <i>${r.mandates.filter((m) => m.stance === 'served').map((m) => m.label).join(', ')}</i>`, `−${r.subsidy.toFixed(1)} u`, 'credit', 'subsidy') : '',
    r.refund > 0.05 ? line('flow refund <i>the dominant carried it</i>', `−${r.refund.toFixed(1)} u`, 'credit', 'refund') : '',
    r.betrayal > 0.05 ? line('self-betrayal surcharge', `+${r.betrayal.toFixed(1)} u`, 'debit', 'betrayal') : '',
  ].join('');

  /* The odds are a function of the briefing, so they are recomputed with the
     rest of the bill rather than frozen at the moment of the click. */
  const pct = Math.round(meta.odds * 100);
  const drifted = hasDrifted(r, meta.paid);

  host.className = `receipt${meta.ghost ? ' ghost' : ''}`;
  host.innerHTML =
    `<div class="r-head"><b>${r.action.label}</b>` +
      `<span>${meta.title} · intensity ${r.action.intensity} · <b class="r-odds">${pct}% likely</b></span></div>` +
    /* Whether the user forced its hand is a fact about the click and does not
       move; how unlikely that road is *now* is a live reading, and watching it
       climb as the Briefing is edited is the point. Gating the line on the one
       and numbering it from the other keeps it from flickering in and out of
       existence under a dragging thumb. */
    (meta.forcedAt != null && meta.forcedAt < 0.25
      ? `<div class="r-forced">You made this Vessel take its ${pct}% road.</div>` : '') +
    `<div class="r-body">${rows}${adj}` +
    `<hr>` +
    line('<b>ENERGY</b>', `<b>${r.energy.toFixed(1)} u</b>`, 'total', 'energy') +
    line(`STRESS <i>${r.stress.items.map((i) => `${i.label} ${i.value >= 0 ? '+' : '−'}${Math.abs(i.value).toFixed(1)}`).join(' · ') || 'none'}</i>`,
         `${r.stress.total >= 0 ? '+' : '−'}${Math.abs(r.stress.total).toFixed(1)}`, 'stress', 'stress') +
    line(`PLEASURE <i>${r.pleasure.items.map((i) => `${i.label} +${i.value.toFixed(1)}`).join(' · ')}</i>`,
         `+${r.pleasure.total.toFixed(1)}`, 'pleasure', 'pleasure') +
    (r.interest > 0.05
      ? line(`RUMINATION <i>${r.mandates.filter((m) => m.stance !== 'served' && m.stance !== 'deferred').map((m) => m.label).join(', ')} — unanswered</i>`,
             `+${r.interest.toFixed(1)}/tick`, 'stress', 'rumination')
      : '') +
    `</div>` +
    (drifted
      ? `<p class="r-repriced">Re-priced for the current briefing. The pool was charged ` +
        `<b>${meta.paid.energy.toFixed(1)} u</b> and <b>${meta.paid.stress.total >= 0 ? '+' : '−'}` +
        `${Math.abs(meta.paid.stress.total).toFixed(1)}</b> stress, under the past this Vessel actually acted from.</p>`
      : '') +
    (r.action.outcome ? `<p class="r-outcome">${r.action.outcome}</p>` : '') +
    LEGEND;

  /* Mark what moved. The class drives a keyframe rather than a transition:
     these are brand-new nodes, and a transition has nothing to transition
     from. Restarting the animation on every input event is what makes a drag
     read as a steady tint on the rows the slider is actually moving, fading
     out once when the user lets go. */
  if (meta.flash) {
    for (const n of host.querySelectorAll('.r-row[data-k]')) {
      if (was.get(n.dataset.k) !== n.querySelector('.v').textContent) n.classList.add('r-changed');
    }
  }
}

/* The bill is confident; the small print is where it admits the units are
   its own. Built once — the copy never varies by receipt. */
const LEGEND =
  `<p class="r-legend"><b>${EPISTEMIC.receipt.lead}</b> ` +
  EPISTEMIC.receipt.terms.map((t) => `<b class="sym">${t.sym}</b> ${t.gloss}`).join('<span class="sep">·</span>') +
  `</p>`;

const line = (l, v, cls = '', key = '') =>
  `<div class="r-row ${cls}"${key ? ` data-k="${key}"` : ''}>` +
  `<span class="l">${l}</span><span class="dots"></span><span class="v">${v}</span></div>`;

/* ---------- the counterfactual ---------- */
function fillCompare() {
  const sel = el('compareType');
  sel.innerHTML = '';
  for (const t of allTypes()) {
    const o = document.createElement('option');
    o.value = t.code; o.textContent = t.code;
    if (S.vessel && t.code === S.vessel.code) o.selected = true;
    sel.appendChild(o);
  }
  sel.onchange = () => renderCounterfactual();
}

/**
 * The same action, run on a different psyche. It answers to the Briefing by
 * exactly the same rule as the real receipt — a counterfactual priced against
 * a past the user has since edited would be comparing two different events,
 * which is the one thing this panel exists to avoid.
 *
 * There is no `paid` here and there never should be: nothing charged this
 * Vessel's pool, so nothing can have drifted from what it paid.
 */
function renderCounterfactual(opts = {}) {
  const sel = el('compareType');
  if (!S.lastReceipt || !sel.value) return;
  const other = { code: sel.value, stack: stackForCode(sel.value) };
  const r = resolve(S.lastReceipt.entry.action, other, S.scenario, briefing.state);
  renderReceipt(el('receiptB'), r, {
    title: sel.value, odds: oddsFor(S.lastReceipt.entry.action, other),
    ghost: true, flash: !!opts.flash,
  });
  el('receiptB').hidden = false;
}

function hideReceipt() {
  /* Mandates belong to the scenario that produced them; carrying a debt into
     a different room would be charging for something that is not happening. */
  clearRumination();
  el('receipt').hidden = true;
  el('receiptB').hidden = true;
  el('compareRow').hidden = true;
  el('receiptEmpty').hidden = false;
  S.lastReceipt = null;
}

/* ---------- the dock ----------
   The Ledger sits some two thousand pixels below the stage, so every receipt
   animation the Vessel performs — the paying chambers flashing, the hull
   listing under new stress — happened where nobody was looking.

   The fix is relocation, not duplication. #vesselStage is moved bodily into
   the dock and moved back on the way up, so there is exactly one set of four
   engines on this page at all times; a second Vessel would be four more
   canvases, four more glyph engines, and two hulls that could disagree.

   What makes the move survivable is that the Vessel lays its chambers out
   from the stage's measured box rather than from anything cached at build
   time: hand it a smaller box and all four re-anchor and re-scale. It owns a
   ResizeObserver that would eventually notice, but eventually is a frame
   away, so syncDock tells it directly — see Vessel.resize(). */
const dock = el('vesselDock');
const dockSlot = el('dockSlot');
const dockVitals = el('dockVitals');
const stageHome = el('stageHome');
const vitalsHome = el('vitalsHome');
const stageEl = el('vesselStage');
const vitalsEl = el('vitals');

/* Below the three-column breakpoint the hull stays home and the dock carries
   only the read-out — a quarter-size Vessel on a phone is decoration. */
const NARROW = window.matchMedia('(max-width: 1180px)');

let docked = false;

/**
 * How much of an element the window can actually see, as a fraction of the
 * most of it that could ever be on screen at once.
 *
 * Measured rather than remembered. An IntersectionObserver ratio is relative
 * to the element's own height, so a 1,200px Voyage zone would have to be
 * nearly filling the window before it counted as "mostly visible" — the wrong
 * question for a zone taller than the viewport. This asks the right one, and
 * asking it at decision time means the dock is never one delivery behind
 * where the page has already scrolled to.
 */
function seenFraction(node) {
  const r = node.getBoundingClientRect();
  if (r.width <= 0 || r.height <= 0) return 0;      /* hidden zones count as absent */
  const vis = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0);
  return Math.max(0, vis) / Math.min(r.height, window.innerHeight);
}

/** Somewhere the user can execute from is on screen. */
const canActHere = () => seenFraction(el('zone-voyage')) > 0 || seenFraction(el('zone-ledger')) > 0;
/** …and the full-size stage is not already in front of them, which would double it. */
const stageAlreadyShowing = () => seenFraction(stageHome) >= 0.4;

function syncDock() {
  const want = !!(S.vessel && canActHere() && !stageAlreadyShowing());
  const slot = want && !NARROW.matches ? dockSlot : stageHome;
  if (want === docked && stageEl.parentElement === slot) return;
  docked = want;

  /* Both elements are placed on every path. Naming only where they move *to*
     would strand the stage in a display:none dock slot the first time the
     viewport crosses the breakpoint mid-dock. */
  slot.appendChild(stageEl);
  (want ? dockVitals : vitalsHome).appendChild(vitalsEl);
  dock.hidden = !want;
  /* The stage's box changed under the Vessel; tell it now rather than waiting
     a frame for its own observer to notice. */
  vessel.resize();
  /* `want` is coerced above because classList.toggle(name, undefined) ignores
     its force argument and flips instead — which would part the dock from the
     gutter that keeps it off the deck. */
  document.body.classList.toggle('dock-open', want);
  measureDock();
}

/**
 * Publish the dock's height so the page can hold a gutter exactly that deep.
 * As a strip across the foot of a narrow window the dock overlaps the Ledger,
 * and how deep it is depends on what is in it — a rumination line naming
 * three mandates is taller than one naming none. A guessed constant is wrong
 * for one of those two; a measurement is wrong for neither.
 */
function measureDock() {
  document.body.style.setProperty('--dock-h', `${dock.hidden ? 0 : dock.offsetHeight}px`);
}

/* The observers are the trigger, not the state: they say "the page moved
   under you, look again", and syncDock does the looking. Three of them so a
   scroll anywhere in the relevant span wakes it, plus resize, because both
   the breakpoint and how much fits on screen are functions of the window. */
const watch = new IntersectionObserver(() => syncDock(), { threshold: [0, 0.2, 0.4, 0.6, 1] });
watch.observe(el('zone-voyage'));
watch.observe(el('zone-ledger'));
watch.observe(stageHome);
window.addEventListener('scroll', syncDock, { passive: true });
window.addEventListener('resize', syncDock);

/* ---------- rumination: making the interest actually charge ----------
   The resolver has always priced this — every receipt with an unanswered
   mandate prints "+n/tick" — but a rate nothing ever multiplies is a threat,
   not a cost. This is the multiplication, on the Vessel's own clock. */

/**
 * Take over whatever the latest choice left outstanding.
 *
 * There is deliberately no separate ledger of "what is still charging": the
 * resolver already decides that every time it prices an action, and this just
 * reads it off. Which is also how a charge stops — an action that serves or
 * defers a mandate leaves it out of the new receipt's unresolved set, so the
 * debt is gone by the same rule that created it, and the two cannot disagree.
 */
function setRumination(r) {
  const items = r.mandates
    .filter((m) => m.stance === 'defied' || m.stance === 'unaddressed')
    .map((m) => ({ id: m.id, label: m.label, perTick: ECON.INTEREST * m.strength }));
  const perTick = items.reduce((sum, i) => sum + i.perTick, 0);
  S.rumination = perTick > 0.05 ? { items, perTick, ticks: 0, carry: 0 } : null;
  paintRumination();
}

function clearRumination() {
  S.rumination = null;
  paintRumination();
}

/**
 * One beat, borrowed from the Vessel's rAF (there is exactly one clock on this
 * page). Interest lands on stress and nowhere else: the pool is not being
 * spent, it is being kept awake — which is why a day of rest refills the one
 * and does not settle the other.
 *
 * Borrowing the render clock means time stops while the tab is in the
 * background, and resumes without a backlog — dt is capped per frame, so
 * coming back after an hour does not dump an hour of interest on the meter.
 * That is the behaviour we want: this is a thing you watch happen to a
 * Vessel, not a timer running against the person at the keyboard.
 */
function accrue(dt) {
  const rum = S.rumination;
  if (!rum) return;
  rum.carry += dt;
  if (rum.carry < TICK_SECONDS) return;

  const ticks = Math.floor(rum.carry / TICK_SECONDS);
  rum.carry -= ticks * TICK_SECONDS;
  rum.ticks += ticks;
  S.stress = clamp(S.stress + rum.perTick * ticks, 0, 100);

  paintVitals();
  paintRumination();
  /* Accrual is the one path that can cross a threshold with nobody touching
     anything — so grip has to be re-read here, not only after an action. */
  checkGrip();
}

function paintRumination() {
  const host = el('rumination');
  const rum = S.rumination;
  if (!rum) { host.hidden = true; host.innerHTML = ''; return; }
  host.hidden = false;
  host.innerHTML =
    `<span class="rum-k">ruminating</span> <i>${rum.items.map((i) => i.label).join(', ')}</i> — ` +
    `<b>+${rum.perTick.toFixed(1)} per tick</b>` +
    `<small>${rum.ticks} tick${rum.ticks === 1 ? '' : 's'} charged · one every ${TICK_SECONDS}s · a night of rest does not clear it</small>`;
  measureDock();          /* the line changes the strip's depth */
}

/* ---------- vitals, quadrant, grip ---------- */
function paintVitals() {
  el('energyVal').textContent = Math.round(S.energy);
  el('stressVal').textContent = Math.round(S.stress);
  el('energyFill').style.width = `${S.energy}%`;
  el('stressFill').style.width = `${S.stress}%`;
  const q = S.grip ? { label: 'In the grip', note: 'the small chamber has the helm' } : quadrant(S.energy, S.stress);
  el('quadChip').className = `quad-chip q-${(q.key || 'grip')}`;
  el('quadChip').innerHTML = `<b>${q.label}</b><span>${q.note}</span>`;
  vessel.setEnergy(S.energy / 100);
  vessel.setStress(S.stress / 100);
}

function checkGrip() {
  const grip = S.energy < 20 && S.stress > 70;
  if (grip === S.grip) return;
  S.grip = grip;
  vessel.setCapsized(grip);
  paintVitals();
  if (grip && S.vessel) {
    const inf = FN[S.vessel.stack.inf];
    el('asmCaption').textContent =
      `The ${inf.label} chamber has the helm. Not a personality change — a low-capacity chamber taking a ` +
      `dominant-sized flood. Rest, or watch it steer.`;
  }
}

el('btnRest').addEventListener('click', () => {
  S.energy = 100; S.stress = Math.max(0, S.stress - 45);
  S.grip = false; vessel.setCapsized(false);
  /* S.rumination is deliberately untouched. The copy below has always claimed
     the debt survives the night; now that the debt is real, the claim has to
     stay true — sleeping on a thing you refused to answer does not answer it,
     and the meter starts climbing again on the next tick. */
  paintVitals();
  paintRumination();
  el('asmCaption').textContent =
    'A day passes. The pool refills; what was unanswered is still unanswered, and still charging.';
});
