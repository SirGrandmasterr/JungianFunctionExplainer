/* ============================================================
   CURRENTS · Phenomena page

   The named failure modes of a function stack. The per-type
   material (stack, loop, grip, shadow) is DERIVED from the four
   letters via src/data/typology.js rather than tabulated, so the
   type picker cannot drift out of agreement with the stack rail
   on the eight function pages.
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/phenomena-theme.css';

import { initHeader } from '../src/shared/header.js';
import { TYPES, ARCHETYPES, AXES, profile } from '../src/data/typology.js';
import { HEADLINE, MECHANISM, SLOW, CONTRAST, SOURCES } from '../src/data/phenomena-data.js';

initHeader('phenomena');

const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Provenance chip. Every claim on the page carries one; the tone class
    drives how much visual confidence it is allowed to project. */
function srcChip(key) {
  const s = SOURCES[key];
  if (!s) return '';
  return `<span class="src tone-${s.tone}" title="${esc(s.note)}">${esc(s.label)}</span>`;
}

/* ---------- legend ---------- */
el('srcLegend').innerHTML = Object.entries(SOURCES)
  .map(([k, s]) => `<span class="lg"><span class="src tone-${s.tone}">${esc(s.label)}</span><span class="lgn">${esc(s.note)}</span></span>`)
  .join('');

/* ============================================================
   type picker → stack, loop, grip
   ============================================================ */
let current = 'INFJ';

function drawType() {
  const p = profile(current);
  el('stTitle').textContent = p.type;
  el('stSub').textContent = `dominant ${p.dominant} · inferior ${p.inferior}`;

  el('stackList').innerHTML = p.stack.map((fn, i) => {
    const a = ARCHETYPES[i];
    const elem = fn[0] === 'N' ? 'n' : fn[0] === 'S' ? 's' : fn[0] === 'T' ? 't' : 'f';
    return `<li class="pos${a.shadow ? ' shadow' : ''}" title="${esc(a.gist)}">
      <span class="n">${a.n}</span>
      <span class="fn el-${elem}">${fn}</span>
      <span class="arch">${esc(a.short)}</span>
    </li>`;
  }).join('');

  el('loopPair').textContent = p.loop.pair;
  el('loopText').textContent = p.loop.text;
  /* the way out of a loop is always the auxiliary, named for this type */
  el('loopExit').textContent =
    `deliberately use ${p.auxiliary} — the one function in the conscious stack facing the other way. While looping it will feel effortful and beside the point, which is exactly the sign it is the missing one.`;
  el('gripFn').textContent = `inferior ${p.inferior}`;
  el('gripText').textContent = p.grip.text;
  el('loopSrc').innerHTML = srcChip('grant');
  el('gripSrc').innerHTML = srcChip('quenk');

  document.querySelectorAll('#typePicker button').forEach((b) =>
    b.setAttribute('aria-pressed', String(b.dataset.t === current)));

  syncArchFns();
}

/** The archetype grid further down shows the SELECTED type's actual
    functions, so the abstract position and the concrete function are never
    separated. Declared before drawType runs; the grid itself is built at
    module level below, and this no-ops harmlessly until it exists. */
function syncArchFns() {
  const p = profile(current);
  document.querySelectorAll('.ac-fn').forEach((s) => {
    const fn = p.stack[+s.dataset.pos];
    const elem = fn[0] === 'N' ? 'n' : fn[0] === 'S' ? 's' : fn[0] === 'T' ? 't' : 'f';
    s.innerHTML = `<span class="fn el-${elem}">${fn}</span>`;
  });
  const t = el('archFor');
  if (t) t.textContent = current;
}

(function typePicker() {
  const host = el('typePicker');
  host.innerHTML = TYPES.map((t) => `<button type="button" data-t="${t}" aria-pressed="false">${t}</button>`).join('');
  host.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    current = b.dataset.t;
    drawType();
  });
})();
drawType();

/* ============================================================
   phenomenon cards
   ============================================================ */
function phenCard(p) {
  return `<article class="phen-card wide" data-accent="${esc(p.key)}">
    <div class="ph-head">
      <span class="ph-kicker">${esc(p.tag)}</span>
      ${srcChip(p.source)}
    </div>
    <h3>${esc(p.title)}</h3>
    <p class="ph-what">${esc(p.what || p.text)}</p>
    ${p.mechanism ? `<h4>How it works</h4><p>${esc(p.mechanism)}</p>` : ''}
    ${p.looks ? `<h4>What it looks like</h4><p>${esc(p.looks)}</p>` : ''}
    ${p.exit ? `<h4>Way out</h4><p>${esc(p.exit)}</p>` : ''}
    ${p.caveat ? `<p class="ph-caveat"><b>Standing:</b> ${esc(p.caveat)}</p>` : ''}
  </article>`;
}

el('headlineCards').innerHTML = HEADLINE.map(phenCard).join('');
el('mechCards').innerHTML = MECHANISM.map(phenCard).join('');
el('slowCards').innerHTML = SLOW.map(phenCard).join('');

/* ---------- loop vs grip contrast ---------- */
el('contrastTable').innerHTML = `
  <div class="crow chead"><span></span><span class="cl">Loop</span><span class="cg">Grip</span></div>
  ${CONTRAST.map((r) => `<div class="crow">
      <span class="ck">${esc(r.row)}</span>
      <span class="cl">${esc(r.loop)}</span>
      <span class="cg">${esc(r.grip)}</span>
    </div>`).join('')}`;

/* ---------- Beebe's eight ---------- */
el('archGrid').innerHTML = ARCHETYPES.map((a) => `
  <article class="arch-card${a.shadow ? ' shadow' : ''}">
    <div class="ah"><span class="n">${a.n}</span><b>${esc(a.name)}</b></div>
    <p>${esc(a.gist)}</p>
    <span class="ac-fn" data-pos="${a.n - 1}"></span>
  </article>`).join('') + `<p class="arch-note">${srcChip('beebe')} Positions 5–8 are positions 1–4 with the attitude flipped. The function names shown are <b id="archFor">INFJ</b>'s — change the type above and these follow.</p>`;

/* the grid exists now, so fill in the selected type's functions */
syncArchFns();

/* ---------- the four axes ---------- */
el('axisGrid').innerHTML = AXES.map((ax) => {
  const ea = ax.a[0] === 'N' ? 'n' : ax.a[0] === 'S' ? 's' : ax.a[0] === 'T' ? 't' : 'f';
  const eb = ax.b[0] === 'N' ? 'n' : ax.b[0] === 'S' ? 's' : ax.b[0] === 'T' ? 't' : 'f';
  return `<article class="axis-card">
    <div class="ax-pair">
      <span class="fn el-${ea}">${ax.a}</span>
      <span class="ax-arrow">↔</span>
      <span class="fn el-${eb}">${ax.b}</span>
    </div>
    <p>${esc(ax.note)}</p>
  </article>`;
}).join('');
