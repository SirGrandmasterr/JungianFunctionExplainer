/* ============================================================
   CURRENTS · scenario audit
   Structural lint + a real simulation pass: every scenario is
   run against all sixteen types and every action, using the
   same pure engine the Playground uses. Answers the question
   authoring cannot answer by eye — "is every function actually
   involved in this situation, and for whom is it expensive?"

   node tools/scenario-audit.mjs            all scenarios
   node tools/scenario-audit.mjs credit-thief   one
   ============================================================ */
import { SCENARIOS } from '../src/data/scenarios/index.js';
import { FN, FN_KEYS, RANKS, allTypes } from '../src/playground/types.js';
import { resolveScenario, routeSignature } from '../src/playground/scenario.js';
import { newSession, computeCommit, likelihoods } from '../src/playground/engine.js';

const HOOK_DOMAIN = {
  si: ['familiar-good', 'familiar-bad', 'unprecedented'],
  ni: ['foreseen', 'blindside'],
  ti: ['consistent', 'contradiction'],
  fi: ['rings-true', 'neutral', 'rings-false'],
};

const err = []; const warn = [];
const E = (id, m) => err.push(`${id}: ${m}`);
const W = (id, m) => warn.push(`${id}: ${m}`);
const pad = (s, n) => String(s).padEnd(n);
const num = (v, n = 2) => v.toFixed(n).padStart(n + 4);

function lint(s) {
  const id = s.id || '(no id)';
  for (const f of ['id', 'title', 'blurb', 'vignette', 'surface', 'interior', 'gates', 'actions', 'monologue']) {
    if (!s[f]) E(id, `missing top-level "${f}"`);
  }
  if (!s.surface) return;

  /* surface + interior completeness */
  for (const k of ['se', 'ne', 'te', 'fe']) if (!s.surface[k]) E(id, `surface.${k} missing`);
  for (const k of ['si', 'ni', 'ti', 'fi']) if (!s.interior[k]) E(id, `interior.${k} missing`);
  if (s.surface.fe && typeof s.surface.fe.audience !== 'number') W(id, 'surface.fe.audience should be a number');
  if (s.interior.fi && typeof s.interior.fi.valence !== 'number') E(id, 'interior.fi.valence must be a number');

  /* gates: all eight, keyed ones covering their whole hook domain */
  for (const k of FN_KEYS) {
    const g = s.gates?.[k];
    if (g == null) { W(id, `gates.${k} absent — defaults to 1.0`); continue; }
    if (typeof g === 'number') {
      if (g < 0.6 || g > 1.8) E(id, `gates.${k} = ${g} is outside [0.6, 1.8] and will be clamped`);
    } else if (HOOK_DOMAIN[k]) {
      for (const h of HOOK_DOMAIN[k]) {
        if (g[h] == null) E(id, `gates.${k} missing hook "${h}"`);
        else if (g[h] < 0.6 || g[h] > 1.8) E(id, `gates.${k}.${h} = ${g[h]} will be clamped`);
      }
    }
  }

  /* monologue: all eight, keyed ones covering their whole hook domain */
  for (const k of FN_KEYS) {
    const m = s.monologue?.[k];
    if (!m) { E(id, `monologue.${k} missing — that function will have no voice here`); continue; }
    if (HOOK_DOMAIN[k]) {
      for (const h of HOOK_DOMAIN[k]) if (!m[h]) E(id, `monologue.${k} missing hook "${h}"`);
    } else if (!m.base) E(id, `monologue.${k}.base missing`);
  }

  /* affinity sanity */
  for (const [k, v] of Object.entries(s.affinity || {})) {
    if (!FN[k]) E(id, `affinity.${k} is not a function key`);
    else if (v < 0.3 || v > 1.8) W(id, `affinity.${k} = ${v} is unusually extreme`);
  }

  /* actions */
  const seen = new Set();
  let suppressive = 0;
  for (const a of s.actions || []) {
    const aid = `${id}/${a.id}`;
    if (!a.id) E(id, 'an action has no id');
    if (seen.has(a.id)) E(id, `duplicate action id "${a.id}"`);
    seen.add(a.id);
    for (const f of ['label', 'detail', 'outcome']) if (!a[f]) W(aid, `missing "${f}"`);
    if (typeof a.intensity !== 'number' || a.intensity < 0 || a.intensity > 1) E(aid, `intensity must be 0..1 (got ${a.intensity})`);
    const sum = Object.values(a.signature || {}).reduce((x, y) => x + y, 0);
    if (Math.abs(sum - 1) > 0.001) E(aid, `signature sums to ${sum.toFixed(3)}, must be 1`);
    for (const k of Object.keys(a.signature || {})) if (!FN[k]) E(aid, `signature key "${k}" is not a function`);
    const m = a.mandates || {};
    if (!m.serves && !m.defers && !m.defies && !m.violates) W(aid, 'no mandates — will read as neutral to every function');
    for (const kind of ['serves', 'defers', 'defies', 'violates']) {
      for (const ref of m[kind] || []) {
        const fn = String(ref).split('.')[0];
        if (!FN[fn]) { E(aid, `mandate "${ref}" does not start with a function key`); continue; }
        const suffix = String(ref).split('.')[1];
        const known = { fi: ['value'], ni: ['trajectory', 'note'], ti: ['axiom', 'modelFit'], si: ['precedent', 'familiarity'],
                        te: ['stakes', 'metric'], fe: ['expectation', 'tone', 'audience'], se: ['urgency', 'intensity'], ne: ['ambiguity'] };
        const declared = (fn === 'fi' && s.interior.fi?.value) ? [s.interior.fi.value.split(/\s+/)[0], 'value'] : (known[fn] || []);
        if (suffix && !declared.some((d) => d.toLowerCase() === suffix.toLowerCase()) && !(known[fn] || []).includes(suffix)) {
          W(aid, `mandate "${ref}" names a hook this scenario does not declare (cosmetic — only the prefix is read)`);
        }
      }
    }
    if ((m.defers?.length || m.defies?.length || m.violates?.length) || a.intensity <= 0.4) suppressive++;
  }
  if ((s.actions || []).length < 4) W(id, `only ${(s.actions || []).length} actions — decks should offer 4–6`);
  if (!suppressive) E(id, 'no suppressive or deferring option on the deck — the model would price silence as free');
}

/* ---------- involvement: raw authored demand, before any stack ---------- */
function authoredDemand(s) {
  const tot = {}; FN_KEYS.forEach((k) => { tot[k] = 0; });
  for (const a of s.actions) for (const [k, v] of Object.entries(a.signature)) tot[k] += v;
  const n = s.actions.length;
  FN_KEYS.forEach((k) => { tot[k] /= n; });
  return tot;
}

/* ---------- simulation: all sixteen types x every action ---------- */
function simulate(raw) {
  const types = allTypes();
  const rows = [];
  const payerRank = { dom: 0, aux: 0, tert: 0, inf: 0 };
  const involvedBy = {}; FN_KEYS.forEach((k) => { involvedBy[k] = 0; });
  let samples = 0;

  for (const { code, stack } of types) {
    const sc = resolveScenario(raw, stack);
    const session = newSession(stack);
    let energy = 0, stress = 0;
    const odds = likelihoods(session, sc, sc.actions);
    for (const a of sc.actions) {
      const c = computeCommit(session, sc, a);
      let best = null;
      for (const r of RANKS) {
        const k = stack[r]; const d = c.per[k];
        energy += d.cost; stress += d.dStress;
        involvedBy[k] += d.involvement;
        if (!best || d.cost > best.cost) best = { rank: r, cost: d.cost };
      }
      payerRank[best.rank]++;
      samples++;
    }
    const n = sc.actions.length;
    rows.push({ code, energy: energy / n, stress: stress / n, spread: Math.max(...Object.values(odds)) });
  }
  rows.sort((a, b) => a.energy - b.energy);
  return { rows, payerRank, involvedBy, samples };
}

/* ---------- report ---------- */
const only = process.argv[2];
const list = only ? SCENARIOS.filter((s) => s.id === only) : SCENARIOS;
if (!list.length) { console.error(`no scenario "${only}"`); process.exit(1); }

console.log(`\n${'='.repeat(74)}\nSCENARIO AUDIT — ${list.length} of ${SCENARIOS.length}\n${'='.repeat(74)}`);

for (const s of list) {
  lint(s);
  const demand = authoredDemand(s);
  const { rows, payerRank, involvedBy, samples } = simulate(s);

  console.log(`\n▸ ${s.id}  "${s.title}"`);
  console.log(`  ${s.blurb}`);
  console.log(`  actions ${s.actions.length} · audience ${s.surface.fe?.audience ?? '?'} · se-intensity ${s.surface.se?.intensity ?? '?'} · ambiguity ${s.surface.ne?.ambiguity ?? '?'}`);

  console.log('\n  authored demand — mean signature share per action');
  const dorder = FN_KEYS.slice().sort((a, b) => demand[b] - demand[a]);
  console.log('   ' + dorder.map((k) => `${FN[k].label} ${num(demand[k])}`).join('   '));
  const dead = FN_KEYS.filter((k) => demand[k] === 0);
  if (dead.length) console.log(`   never demanded: ${dead.map((k) => FN[k].label).join(', ')}`);

  console.log('\n  realised involvement — summed over 16 types x every action (routing applied)');
  const iorder = FN_KEYS.slice().sort((a, b) => involvedBy[b] - involvedBy[a]);
  console.log('   ' + iorder.map((k) => `${FN[k].label} ${num(involvedBy[k] / samples)}`).join('   '));

  console.log('\n  who pays most, by stack position');
  const tp = Object.values(payerRank).reduce((a, b) => a + b, 0);
  console.log('   ' + RANKS.map((r) => `${pad(r, 5)}${String(Math.round(100 * payerRank[r] / tp)).padStart(3)}%`).join('  '));

  console.log('\n  cost per type — mean energy across the deck');
  console.log(`   cheapest  ${rows.slice(0, 3).map((r) => `${r.code} ${r.energy.toFixed(0)}`).join('  ')}`);
  console.log(`   dearest   ${rows.slice(-3).reverse().map((r) => `${r.code} ${r.energy.toFixed(0)}`).join('  ')}`);
  const lo = rows[0].energy, hi = rows[rows.length - 1].energy;
  console.log(`   spread    ${lo.toFixed(0)} → ${hi.toFixed(0)}  (${(hi / lo).toFixed(2)}x)`);
  if (hi / lo < 1.35) console.log('   ⚠ flat: this situation barely distinguishes the sixteen types');
}

console.log(`\n${'-'.repeat(74)}`);
if (err.length) { console.log(`\n✗ ${err.length} ERROR(S)`); err.forEach((e) => console.log('  ' + e)); }
if (warn.length) { console.log(`\n! ${warn.length} WARNING(S)`); warn.forEach((w) => console.log('  ' + w)); }
if (!err.length && !warn.length) console.log('\n✓ clean');
console.log('');
process.exit(err.length ? 1 : 0);
