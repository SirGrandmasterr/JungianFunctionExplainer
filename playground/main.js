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
import { FN, allTypes, deriveStack, typeCode, stackForCode, isLegal, loopPair } from '../src/playground/types.js';
import { Vessel } from '../src/playground/vessel.js';
import { Assembly, glyphMark } from '../src/playground/assembly.js';
import { Briefing } from '../src/playground/briefing.js';
import { reads } from '../src/playground/monologue.js';
import { resolve, forecast, ECON } from '../src/playground/ledger.js';
import { readPalette } from '../src/playground/chamber.js';
import { SCENARIOS } from '../src/data/scenarios/index.js';
import { EPISTEMIC, MALFORMED, RANK_LABEL, quadrant, ASSEMBLY } from '../src/data/playground-data.js';
import { clamp } from '../src/utils/math.js';
import { REDUCED } from '../src/utils/dom.js';

initHeader('playground');
const el = (id) => document.getElementById(id);
el('epistemic').textContent = EPISTEMIC;

/* ---------- state ---------- */
const S = {
  vessel: null,          /* { code, stack } */
  scenario: SCENARIOS[0],
  briefing: null,
  energy: 100,
  stress: 0,
  lastReceipt: null,
  grip: false,
};
window.__PG = S;         /* dev handle, matching the convention on every page */

const COL = readPalette();
const stage = el('vesselStage');
const vessel = new Vessel(stage, {
  COL,
  onChamberClick: (fnKey) => { window.location.href = `/${fnKey}/`; },
});
S.view = vessel;

const briefing = new Briefing(el('briefing'), { onChange: () => { renderVoices(); renderDeck(); } });

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
  S.vessel = null;
});

el('btnRandom').addEventListener('click', () => {
  const all = allTypes();
  assembly.freePlay = false;
  el('freePlay').checked = false;
  assembly.autoBuild(all[Math.floor(Math.random() * all.length)].code, REDUCED ? 60 : 520);
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
    assembly.autoBuild(t.code, REDUCED ? 60 : 520);
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

  const bad = !isLegal(stack) && MALFORMED.find((m) => m.test(stack));
  if (bad) el('asmCaption').textContent = `${bad.label}. ${bad.note}`;

  loadScenario(S.scenario);
  fillCompare();
  paintVitals();
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
      `<span class="odds" title="what this Vessel would probably do if nobody forced it">${Math.round(x.p * 100)}%</span></div>` +
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
  S.lastReceipt = { entry: x, receipt: r };

  S.energy = clamp(S.energy - r.energy, 0, 100);
  S.stress = clamp(S.stress + r.stress.total, 0, 100);
  paintVitals();

  vessel.execute(r);
  renderReceipt(el('receipt'), r, {
    title: S.vessel.code,
    odds: x.p,
    forced: x.p < 0.25,
  });
  el('receiptEmpty').hidden = true;
  el('receipt').hidden = false;
  el('compareRow').hidden = false;
  el('receiptB').hidden = true;

  checkGrip();
}

function renderReceipt(host, r, meta) {
  const money = (v) => `${v >= 0 ? '' : '−'}${Math.abs(v).toFixed(1)}`;
  const rows = r.lines.map((l) => {
    const mult = ({ dom: '1.0', aux: '1.5', tert: '2.5', inf: '4.0' })[l.rank];
    const tag = `${FN[l.fn].label} <i>(${l.rank} ×${mult}${l.tau > 1 ? ` · τ${l.tau}` : ''}${l.gate !== 1 ? ` · gate ${l.gate}` : ''})</i>`;
    return line(`<em class="el-${FN[l.demand].el}">${FN[l.demand].label} ${l.share.toFixed(2).slice(1)}</em> → ${tag}`, `${money(l.cost)} u`, l.tau > 1 ? 'taxed' : '');
  }).join('');

  const adj = [
    r.subsidy > 0.05 ? line(`conviction subsidy <i>${r.mandates.filter((m) => m.stance === 'served').map((m) => m.label).join(', ')}</i>`, `−${r.subsidy.toFixed(1)} u`, 'credit') : '',
    r.refund > 0.05 ? line('flow refund <i>the dominant carried it</i>', `−${r.refund.toFixed(1)} u`, 'credit') : '',
    r.betrayal > 0.05 ? line('self-betrayal surcharge', `+${r.betrayal.toFixed(1)} u`, 'debit') : '',
  ].join('');

  host.className = `receipt${meta.ghost ? ' ghost' : ''}`;
  host.innerHTML =
    `<div class="r-head"><b>${r.action.label}</b><span>${meta.title} · intensity ${r.action.intensity}</span></div>` +
    (meta.forced ? `<div class="r-forced">You made this Vessel take its ${Math.round(meta.odds * 100)}% road.</div>` : '') +
    `<div class="r-body">${rows}${adj}` +
    `<hr>` +
    line('<b>ENERGY</b>', `<b>${r.energy.toFixed(1)} u</b>`, 'total') +
    line(`STRESS <i>${r.stress.items.map((i) => `${i.label} ${i.value >= 0 ? '+' : '−'}${Math.abs(i.value).toFixed(1)}`).join(' · ') || 'none'}</i>`,
         `${r.stress.total >= 0 ? '+' : '−'}${Math.abs(r.stress.total).toFixed(1)}`, 'stress') +
    line(`PLEASURE <i>${r.pleasure.items.map((i) => `${i.label} +${i.value.toFixed(1)}`).join(' · ')}</i>`,
         `+${r.pleasure.total.toFixed(1)}`, 'pleasure') +
    (r.interest > 0.05
      ? line(`RUMINATION <i>${r.mandates.filter((m) => m.stance !== 'served' && m.stance !== 'deferred').map((m) => m.label).join(', ')} — unanswered</i>`,
             `+${r.interest.toFixed(1)}/tick`, 'stress')
      : '') +
    `</div>` +
    (r.action.outcome ? `<p class="r-outcome">${r.action.outcome}</p>` : '');
}

const line = (l, v, cls = '') =>
  `<div class="r-row ${cls}"><span class="l">${l}</span><span class="dots"></span><span class="v">${v}</span></div>`;

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
  sel.onchange = () => {
    if (!S.lastReceipt) return;
    const stack = stackForCode(sel.value);
    const other = { code: sel.value, stack };
    const r = resolve(S.lastReceipt.entry.action, other, S.scenario, briefing.state);
    const f = forecast(S.scenario.actions, other, S.scenario, briefing.state)
      .find((x) => x.action.id === r.action.id);
    renderReceipt(el('receiptB'), r, { title: sel.value, odds: f ? f.p : 0, ghost: true, forced: false });
    el('receiptB').hidden = false;
  };
}

function hideReceipt() {
  el('receipt').hidden = true;
  el('receiptB').hidden = true;
  el('compareRow').hidden = true;
  el('receiptEmpty').hidden = false;
  S.lastReceipt = null;
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
  paintVitals();
  el('asmCaption').textContent =
    'A day passes. The pool refills; what was unanswered is still unanswered, and still charging.';
});
