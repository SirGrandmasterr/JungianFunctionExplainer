/* ============================================================
   CURRENTS · Combined Energy Economics page

   One page in place of the Zone E that used to sit on all eight
   function pages. The per-page version could only ever show a
   function against itself; the interesting claims in this model
   are comparative — the cost ladder is a law, the drain curves
   differ by a few percent, and the grip always runs to the
   inferior — and none of those are visible from inside a single
   page. Both drain views are the same chart with the axes'
   meanings swapped, so they share one renderer.
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/energy-theme.css';

import { clamp, hexA } from '../src/utils/math.js';
import { CSSVAR } from '../src/utils/dom.js';
import { initHeader } from '../src/shared/header.js';
import { showTip, hideTip } from '../src/shared/tooltip.js';
import { loadEnergyData, POSITIONS } from '../src/data/energy-data.js';

initHeader('energy');

const { fns, sharedCosts, costs: COSTS } = loadEnergyData();
const COL = {
  ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
  grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
  crit: CSSVAR('--crit'), warn: CSSVAR('--warn'),
};
const el = (id) => document.getElementById(id);

/* ============================================================
   1 · the shared law — cost per activation
   ============================================================ */
(function costChart() {
  el('lawText').innerHTML = sharedCosts
    ? '<b>This ladder is an assumption of the model, not a measurement.</b> All eight functions are given the same cost ladder, so the price of an invocation here is set by stack position alone — which function you are running changes what the energy buys, not what it costs. It is a defensible simplification and it is worth knowing it is a simplification: no one has measured the energetic cost of a cognitive function, and there is nothing in the literature that would let them.'
    : '<b>Note:</b> the cost ladder is no longer identical across the eight, so the chart below shows the reference ladder only.';

  const W = 720, H = 240, ML = 40, MR = 96, MT = 18, MB = 30;
  const pw = W - ML - MR, ph = H - MT - MB;
  const ymax = 6.5;
  const y = (v) => MT + ph - (v / ymax) * ph;
  const bw = 26, slot = pw / COSTS.length;
  let s = '';
  for (const g of [0, 2, 4, 6]) {
    s += `<line x1="${ML}" y1="${y(g)}" x2="${W - MR}" y2="${y(g)}" stroke="${g === 0 ? COL.axis : COL.grid}" stroke-width="1"/>`;
    s += `<text x="${ML - 8}" y="${y(g) + 3.5}" text-anchor="end" class="tick-label">${g}</text>`;
  }
  s += `<text x="${ML - 26}" y="${MT - 6}" class="axis-label">energy units</text>`;
  COSTS.forEach((c, i) => {
    const x = ML + slot * i + slot / 2 - bw / 2;
    const base = y(0), top = y(c.v);
    s += `<path class="cost-bar" data-i="${i}" fill="${c.color}" d="M${x} ${base} L${x} ${top + 4}
           Q${x} ${top} ${x + 4} ${top} L${x + bw - 4} ${top} Q${x + bw} ${top} ${x + bw} ${top + 4} L${x + bw} ${base} Z"/>`;
    s += `<text x="${x + bw / 2}" y="${y(c.v) - 8}" text-anchor="middle" class="direct-label">${c.v.toFixed(1)}×</text>`;
    if (c.band) {
      const bx = x + bw + 10;
      s += `<line x1="${bx}" y1="${y(c.band[0])}" x2="${bx}" y2="${y(c.band[1])}" stroke="${COL.muted}" stroke-width="1.5"/>`;
      for (const b of c.band) s += `<line x1="${bx - 4}" y1="${y(b)}" x2="${bx + 4}" y2="${y(b)}" stroke="${COL.muted}" stroke-width="1.5"/>`;
      s += `<text x="${bx + 9}" y="${y(4.5) - 2}" class="axis-label">3–6×</text>`;
      s += `<text x="${bx + 9}" y="${y(4.5) + 11}" class="axis-label">unpredictable</text>`;
    }
    s += `<text x="${x + bw / 2}" y="${H - 10}" text-anchor="middle" class="tick-label">${c.label}</text>`;
    s += `<rect class="hit" data-i="${i}" x="${ML + slot * i}" y="${MT}" width="${slot}" height="${ph}" fill="transparent"/>`;
  });
  const host = el('costChart');
  host.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart: energy cost of one invocation by stack position, identical across all eight functions" style="width:100%;height:auto">${s}</svg>`;
  host.querySelectorAll('.hit').forEach((r) => {
    const c = COSTS[+r.dataset.i];
    r.addEventListener('pointermove', (e) => showTip(
      `<div class="t">${c.label} · any function</div>
       <div class="row"><span class="k"><span class="sw" style="background:${c.color}"></span>one activation</span><b>${c.band ? '3–6' : c.v.toFixed(1)} u</b></div>
       <div class="row"><span class="k">of a full charge</span><b>${c.band ? '30–60' : Math.round(c.v * 10)}%</b></div>`,
      e.clientX, e.clientY));
    r.addEventListener('pointerleave', hideTip);
  });

  el('costTable').innerHTML = `
    <table><thead><tr><th>Position</th><th>Cost (units)</th><th>Share of a full charge</th></tr></thead><tbody>
    ${COSTS.map((c) => `<tr><td>${c.label}</td><td>${c.band ? '3–6 (erratic)' : c.v.toFixed(1)}</td><td>${c.band ? '30–60%' : Math.round(c.v * 10) + '%'}</td></tr>`).join('')}
    </tbody></table>
    <p style="font-size:11.5px;color:var(--muted);margin-top:8px">Identical for Ne, Ni, Se, Si, Te, Ti, Fe and Fi.</p>`;
})();

/* ============================================================
   A drain chart. Both views below are this same object: N series
   of f(t) → percent drained over 120 minutes, with a scrubber,
   a battery column, direct end-labels and a data table.
   ============================================================ */
function drainChart(cfg) {
  /* MB carries two rows now (ticks, then an axis caption) and MR has to hold
     eight direct labels that, on this page, all land within a few points of
     each other — see the de-collision pass below. */
  const D = { W: 720, H: 348, ML: 42, MR: 94, MT: 16, MB: 46, tmax: 120, ymax: 112 };
  D.pw = D.W - D.ML - D.MR;
  D.ph = D.H - D.MT - D.MB;
  const dx = (t) => D.ML + (t / D.tmax) * D.pw;
  const dy = (v) => D.MT + D.ph - (v / D.ymax) * D.ph;

  let series = [];
  let lines = [], legendKeys = [], batteryFills = [];

  const chartHost = el(cfg.chart);
  const legendHost = el(cfg.legend);
  const battHost = el(cfg.batteries);
  const scrub = el(cfg.scrub);

  function render(next, marker) {
    series = next;

    let s = '';
    for (const g of [0, 25, 50, 75, 100]) {
      s += `<line x1="${D.ML}" y1="${dy(g)}" x2="${D.W - D.MR}" y2="${dy(g)}" stroke="${g === 0 ? COL.axis : COL.grid}" stroke-width="1"/>`;
      s += `<text x="${D.ML - 8}" y="${dy(g) + 3.5}" text-anchor="end" class="tick-label">${g}</text>`;
    }
    for (const t of [0, 30, 60, 90, 120]) {
      s += `<text x="${dx(t)}" y="${D.H - 26}" text-anchor="middle" class="tick-label">${t}</text>`;
    }
    s += `<text x="${D.ML - 30}" y="${D.MT - 2}" class="axis-label">% of full charge drained</text>`;
    s += `<text x="${D.ML + D.pw / 2}" y="${D.H - 8}" text-anchor="middle" class="axis-label">minutes of continuous use</text>`;
    s += `<text x="${D.ML + 4}" y="${dy(100) - 5}" class="axis-label">full depletion</text>`;

    series.forEach((sr, i) => {
      let d = '';
      for (let t = 0; t <= D.tmax; t += 1) {
        d += (t === 0 ? 'M' : 'L') + dx(t).toFixed(1) + ' ' + dy(clamp(sr.f(t), 0, 105)).toFixed(1) + ' ';
      }
      s += `<path class="dl" data-i="${i}" d="${d}" fill="none" stroke="${sr.color}" stroke-width="2"
             ${sr.dash ? `stroke-dasharray="${sr.dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
    });

    if (marker) {
      s += `<circle cx="${dx(marker.t)}" cy="${dy(100)}" r="4.5" fill="${COL.crit}" stroke="${COL.surface}" stroke-width="2"/>`;
      s += `<text x="${dx(marker.t)}" y="${dy(100) - 16}" text-anchor="middle" class="axis-label" fill="${COL.crit}">⚠ grip risk begins</text>`;
      s += `<text x="${dx(marker.t)}" y="${dy(100) - 28}" text-anchor="middle" class="tick-label">${marker.label}</text>`;
    }

    /* Direct end-labels, pushed apart so they never collide — and then, if
       the pushed stack has run off the bottom of the plot, slid back up as a
       group. Eight functions whose 120-minute values sit within four points
       of each other stack into a column taller than the gap they started in,
       which is exactly the case this page puts on screen by default. */
    const GAP = 13;
    const ends = series.map((sr, i) => ({ i, label: sr.label, y: dy(clamp(sr.f(D.tmax), 0, 105)) }))
      .sort((a, b) => a.y - b.y);
    for (let k = 1; k < ends.length; k++) {
      if (ends[k].y - ends[k - 1].y < GAP) ends[k].y = ends[k - 1].y + GAP;
    }
    const overflow = ends.length ? ends[ends.length - 1].y - (D.MT + D.ph) : 0;
    if (overflow > 0) for (const e of ends) e.y -= overflow;
    for (const e of ends) {
      const trueY = dy(clamp(series[e.i].f(D.tmax), 0, 105));
      if (Math.abs(e.y - trueY) > 5) {
        s += `<line x1="${D.W - D.MR + 2}" y1="${trueY}" x2="${D.W - D.MR + 12}" y2="${e.y}" stroke="${COL.muted}" stroke-width="1"/>`;
      }
      s += `<text x="${D.W - D.MR + 15}" y="${e.y + 3.5}" class="direct-label" data-i="${e.i}">${e.label}</text>`;
    }

    s += `<line class="playhead" x1="${dx(120)}" y1="${D.MT}" x2="${dx(120)}" y2="${D.MT + D.ph}" stroke="${hexA(COL.ink, 0.35)}" stroke-width="1"/>`;
    series.forEach((sr, i) => {
      s += `<circle class="scrub-dot" data-i="${i}" r="4" fill="${sr.color}" stroke="${COL.surface}" stroke-width="2"/>`;
    });
    s += `<line class="crosshair" y1="${D.MT}" y2="${D.MT + D.ph}" stroke="${COL.axis}" stroke-width="1" style="display:none"/>`;
    s += `<rect class="hit" x="${D.ML}" y="${D.MT}" width="${D.pw}" height="${D.ph}" fill="transparent"/>`;

    chartHost.innerHTML =
      `<svg viewBox="0 0 ${D.W} ${D.H}" role="img" aria-label="${cfg.aria}" style="width:100%;height:auto">${s}</svg>`;
    lines = [...chartHost.querySelectorAll('.dl')];

    /* legend */
    legendHost.innerHTML = '';
    legendKeys = series.map((sr) => {
      const k = document.createElement('span');
      k.className = 'key';
      k.style.color = sr.color;
      k.innerHTML = sr.dash
        ? `<span class="dashline" style="border-top-style:dashed"></span><span style="color:var(--ink-2)">${sr.label}</span>`
        : `<span class="sw" style="background:${sr.color}"></span><span style="color:var(--ink-2)">${sr.label}</span>`;
      legendHost.appendChild(k);
      return k;
    });

    /* batteries */
    battHost.innerHTML = '';
    batteryFills = series.map((sr) => {
      const d = document.createElement('div');
      d.className = 'battery';
      d.innerHTML = `<span>${sr.label}</span><div class="shell"><div class="fill" style="background:${sr.color};width:100%"></div></div>`;
      battHost.appendChild(d);
      return d.querySelector('.fill');
    });

    /* crosshair + tooltip */
    const svg = chartHost.querySelector('svg');
    const hit = svg.querySelector('.hit');
    const ch = svg.querySelector('.crosshair');
    hit.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const t = clamp(Math.round(((e.clientX - r.left) * (D.W / r.width) - D.ML) / D.pw * D.tmax), 0, D.tmax);
      ch.style.display = '';
      ch.setAttribute('x1', dx(t)); ch.setAttribute('x2', dx(t));
      showTip(`<div class="t">${t} min under load</div>` + series.map((sr) =>
        `<div class="row"><span class="k"><span class="sw" style="background:${sr.color}"></span>${sr.label}</span><b>${clamp(sr.f(t), 0, 105).toFixed(0)}%</b></div>`
      ).join(''), e.clientX, e.clientY);
    });
    hit.addEventListener('pointerleave', () => { ch.style.display = 'none'; hideTip(); });

    /* table */
    const ts = [0, 15, 30, 45, 60, 75, 90, 105, 120];
    el(cfg.table).innerHTML = `
      <table><thead><tr><th>Minutes</th>${series.map((sr) => `<th>${sr.label}</th>`).join('')}</tr></thead><tbody>
      ${ts.map((t) => `<tr><td>${t}</td>${series.map((sr) => `<td>${clamp(sr.f(t), 0, 105).toFixed(0)}%</td>`).join('')}</tr>`).join('')}
      </tbody></table>
      <p style="font-size:11.5px;color:var(--muted);margin-top:8px">Percent of a full charge drained by continuous use.</p>`;

    setScrub(+scrub.value);
  }

  function setScrub(t) {
    const svg = chartHost.querySelector('svg');
    if (!svg) return;
    const ph = svg.querySelector('.playhead');
    ph.setAttribute('x1', dx(t)); ph.setAttribute('x2', dx(t));
    svg.querySelectorAll('.scrub-dot').forEach((dot) => {
      const sr = series[+dot.dataset.i];
      dot.setAttribute('cx', dx(t));
      dot.setAttribute('cy', dy(clamp(sr.f(t), 0, 105)));
    });
    series.forEach((sr, i) => {
      batteryFills[i].style.width = clamp(100 - sr.f(t), 0, 100).toFixed(0) + '%';
    });
    el(cfg.scrubOut).textContent = `${t} min`;
    el(cfg.live).textContent = `At ${t} minutes: ` +
      series.map((sr) => `${sr.label} ${clamp(100 - sr.f(t), 0, 100).toFixed(0)}% charge left`).join(', ');
  }

  function highlight(idx) {
    lines.forEach((l) => {
      const on = idx === null || +l.dataset.i === idx;
      l.setAttribute('stroke-width', idx !== null && on ? 3 : 2);
      l.style.opacity = on ? 1 : 0.28;
    });
    chartHost.querySelectorAll('.direct-label').forEach((t) => {
      t.style.opacity = idx === null || +t.dataset.i === idx ? 1 : 0.4;
    });
    legendKeys.forEach((k, i) => k.classList.toggle('dim', idx !== null && i !== idx));
  }

  scrub.addEventListener('input', () => setScrub(+scrub.value));
  return { render, highlight };
}

/* ============================================================
   2 · across the eight, at one position
   ============================================================ */
const cmp = drainChart({
  chart: 'cmpChart', legend: 'cmpLegend', batteries: 'cmpBatteries',
  scrub: 'cmpScrub', scrubOut: 'cmpScrubOut', live: 'cmpLive', table: 'cmpTable',
  aria: 'Line chart: cumulative energy drained over 120 minutes for all eight functions held at one stack position',
});

let posIdx = 0;
function drawCompare() {
  const pos = POSITIONS[posIdx];
  cmp.render(fns.map((f) => ({
    label: f.label, color: f.color, dash: f.dash, f: f.series[pos.idx].f,
  })));
  el('cmpSub').textContent = `continuous use at ${pos.label.toLowerCase()}`;

  /* The spread is measured, not asserted. The prose around this page makes a
     claim — that position dominates identity — and a claim of that shape has
     no business being hand-written next to a chart that could later disagree
     with it. Reading it off the same models the curves are drawn from means
     it cannot go stale, and it means the "these are all basically the same"
     observation is evidence rather than editorial. */
  const at120 = fns.map((f) => ({ label: f.label, v: clamp(f.series[pos.idx].f(120), 0, 100) }));
  const lo = at120.reduce((a, b) => (b.v < a.v ? b : a));
  const hi = at120.reduce((a, b) => (b.v > a.v ? b : a));
  const spread = hi.v - lo.v;
  el('cmpFinding').innerHTML = spread < 0.5
    ? `At ${pos.label.toLowerCase()}, <b>all eight reach full depletion</b> before the two hours are up — between ${Math.round(Math.min(...fns.map((f) => f.infT)))} and ${Math.round(Math.max(...fns.map((f) => f.infT)))} minutes. At this depth the function you are running stops mattering.`
    : `After two hours the eight span <b>${spread.toFixed(1)} points</b> — ${hi.label} drains fastest at ${hi.v.toFixed(0)}%, ${lo.label} slowest at ${lo.v.toFixed(0)}%. Moving one position down the stack costs more than any of that.`;
  /* hovering a legend key isolates that function's curve */
  document.querySelectorAll('#cmpLegend .key').forEach((k, i) => {
    k.addEventListener('pointerenter', () => cmp.highlight(i));
    k.addEventListener('pointerleave', () => cmp.highlight(null));
  });
}

(function posPicker() {
  const host = el('posPicker');
  POSITIONS.forEach((p, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = p.label;
    b.setAttribute('aria-pressed', String(i === posIdx));
    b.addEventListener('click', () => {
      posIdx = i;
      host.querySelectorAll('button').forEach((o, j) => o.setAttribute('aria-pressed', String(j === i)));
      drawCompare();
    });
    host.appendChild(b);
  });
})();
drawCompare();

/* ============================================================
   3 · one function, all five positions
   ============================================================ */
const det = drainChart({
  chart: 'detChart', legend: 'detLegend', batteries: 'detBatteries',
  scrub: 'detScrub', scrubOut: 'detScrubOut', live: 'detLive', table: 'detTable',
  aria: 'Line chart: cumulative energy drained over 120 minutes for one function across all five stack positions',
});

/* Fe first: it is the page this rework came from, and its dominant curve has
   the most legible feature in the set — the micro-recovery notches. */
let fnIdx = fns.findIndex((f) => f.key === 'fe');
if (fnIdx < 0) fnIdx = 0;

function drawDetail() {
  const f = fns[fnIdx];
  det.render(
    f.series.map((sr) => ({ label: sr.label, color: sr.color, f: sr.f })),
    { t: f.infT, label: `${Math.round(f.infT)} min of forced inferior ${f.label}` }
  );
  el('detTitle').textContent = `${f.label} · drain by position`;

  /* This marker used to be labelled "grip risk begins", which named the wrong
     mechanism. The grip, in Quenk's sense and in Jung's enantiodromia behind
     it, is triggered by the DOMINANT running out — the inferior erupts because
     the conscious attitude can no longer hold the field, not because the
     person has been consciously using their inferior for an hour. The model
     already contains the right clock; it was simply not the one being read. */
  el('detNote').innerHTML =
    `The marked point is the <b>inferior</b> exhausting itself under forced use — real, and not what "the grip" means. ` +
    `A grip is triggered by the <b>dominant</b> running out, which on these curves takes about ` +
    `<b>${(f.domT / 60).toFixed(1)} hours</b> of sustained ${f.label} — a long hard day, which is roughly when people report it. ` +
    `What arrives then is inferior ${f.grip}: <a href="/phenomena/#two">see the phenomena page</a>.`;
  el('recTitle').textContent = `${f.label} · recovery profiles`;
  document.querySelectorAll('#detLegend .key').forEach((k, i) => {
    k.addEventListener('pointerenter', () => det.highlight(i));
    k.addEventListener('pointerleave', () => det.highlight(null));
  });
  drawRecovery(f);
}

/* recovery small multiples for the selected function */
function drawRecovery(f) {
  const host = el('recCharts');
  host.innerHTML = '';
  const W = 210, H = 120, ML = 8, MR = 8, MT = 10, MB = 18, tmax = 90;
  const rx = (t) => ML + (t / tmax) * (W - ML - MR);
  const ry = (v) => MT + (H - MT - MB) - (v / 100) * (H - MT - MB);
  f.recovery.forEach((rec) => {
    let s = `<rect x="${rx(0)}" y="${MT}" width="${rx(30) - rx(0)}" height="${H - MT - MB}" fill="${hexA(rec.color, 0.1)}"/>`;
    s += `<line x1="${ML}" y1="${ry(0)}" x2="${W - MR}" y2="${ry(0)}" stroke="${COL.axis}" stroke-width="1"/>`;
    s += `<line x1="${ML}" y1="${ry(100)}" x2="${W - MR}" y2="${ry(100)}" stroke="${COL.grid}" stroke-width="1"/>`;
    let d = '';
    for (let t = 0; t <= tmax; t += 1) d += (t === 0 ? 'M' : 'L') + rx(t).toFixed(1) + ' ' + ry(clamp(rec.f(t), 0, 100)).toFixed(1) + ' ';
    s += `<path d="${d}" fill="none" stroke="${rec.color}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<text x="${rx(15)}" y="${H - 5}" text-anchor="middle" class="tick-label">exertion</text>`;
    s += `<text x="${rx(62)}" y="${H - 5}" text-anchor="middle" class="tick-label">rest →</text>`;
    const card = document.createElement('div');
    card.className = 'small-multiple';
    card.innerHTML = `<h4><span class="sw" style="background:${rec.color}"></span>${rec.label}</h4>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Recovery curve for ${rec.label} ${f.label}" style="width:100%;height:auto">${s}</svg>
      <p class="note">${rec.note}</p>`;
    host.appendChild(card);
  });
  const ts = [0, 15, 30, 45, 60, 75, 90];
  el('recTable').innerHTML = `
    <table><thead><tr><th>Minutes</th>${f.recovery.map((r) => `<th>${r.label}</th>`).join('')}</tr></thead><tbody>
    ${ts.map((t) => `<tr><td>${t}</td>${f.recovery.map((r) => `<td>${clamp(r.f(t), 0, 100).toFixed(0)}%</td>`).join('')}</tr>`).join('')}
    </tbody></table>
    <p style="font-size:11.5px;color:var(--muted);margin-top:8px">Battery level (%) through 30 minutes of exertion, then rest — ${f.label}.</p>`;
}

(function fnPicker() {
  const host = el('fnPicker');
  fns.forEach((f, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="sw" style="background:${f.color}"></span>${f.label}`;
    b.setAttribute('aria-pressed', String(i === fnIdx));
    b.title = f.name;
    b.addEventListener('click', () => {
      fnIdx = i;
      host.querySelectorAll('button').forEach((o, j) => o.setAttribute('aria-pressed', String(j === i)));
      drawDetail();
    });
    host.appendChild(b);
  });
})();
drawDetail();

/* ============================================================
   4 · the direction of collapse
   ============================================================ */
(function gripGrid() {
  const host = el('gripGrid');
  for (const f of fns) {
    const to = fns.find((o) => o.label === f.grip);
    const card = document.createElement('div');
    card.className = 'grip-card';
    card.style.setProperty('--gc', f.color);
    card.innerHTML = `
      <div class="gh">
        <b><a href="${f.href}" style="color:inherit">${f.label}</a></b>
        <span class="arrow">collapses into</span>
        <span class="to" style="color:${to ? to.color : 'inherit'}">${f.grip}</span>
      </div>
      <div class="mins">≈${(f.domT / 60).toFixed(1)} h of sustained ${f.label} to full depletion</div>
      <p>${f.gripNote}</p>`;
    host.appendChild(card);
  }
})();

/* ---- table toggles ---- */
document.querySelectorAll('.table-toggle').forEach((b) => {
  b.addEventListener('click', () => {
    const t = el(b.dataset.table);
    const open = t.classList.toggle('show');
    b.setAttribute('aria-expanded', String(open));
    b.textContent = open ? 'Hide table' : 'Data table';
  });
});
