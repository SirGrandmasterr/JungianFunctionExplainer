/* ============================================================
   CURRENTS · Zone E — Energy economics charts
   Shared logic: cost bar chart, sustained drain, recovery
   small multiples, scrubber, batteries, legend, tooltips,
   table toggles, and rail↔chart linkage.
   ============================================================ */
import { clamp, hexA } from '../utils/math.js';
import { CSSVAR } from '../utils/dom.js';
import { showTip, hideTip } from './tooltip.js';

/**
 * @param {Object} cfg
 * @param {Array}  cfg.series       — SERIES drain models [{key,label,color,f}]
 * @param {Array}  cfg.costs        — COSTS per-activation [{label,v,color,band?,series}]
 * @param {Array}  cfg.recovery     — RECOVERY curves [{label,color,note,f}]
 * @param {string} cfg.fnLabel      — function label (e.g. 'Ti' or 'Fi')
 * @param {number} cfg.gripT        — grip-risk time threshold
 * @param {string} cfg.gripNote     — extra text for grip marker (e.g. 'forced inferior Ti')
 */
export function initEnergyCharts(cfg) {
  const { series: SERIES, costs: COSTS, recovery: RECOVERY, fnLabel, gripT: GRIP_T, gripNote } = cfg;
  const COL = {
    ink: CSSVAR('--ink'), ink2: CSSVAR('--ink-2'), muted: CSSVAR('--muted'),
    grid: CSSVAR('--grid'), axis: CSSVAR('--axis'), surface: CSSVAR('--surface'),
    crit: CSSVAR('--crit'),
  };

  const costBars = [];
  const drainLines = [];
  const legendKeys = [];
  const batteryFills = [];

  /* ---- chart 1 · cost per activation ---- */
  (function buildCostChart() {
    const W = 720, H = 240, ML = 40, MR = 96, MT = 18, MB = 30;
    const pw = W - ML - MR, ph = H - MT - MB;
    const ymax = 6.5;
    const y = (v) => MT + ph - (v / ymax) * ph;
    const bw = 24, slot = pw / COSTS.length;
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
        s += `<line x1="${bx - 4}" y1="${y(c.band[0])}" x2="${bx + 4}" y2="${y(c.band[0])}" stroke="${COL.muted}" stroke-width="1.5"/>`;
        s += `<line x1="${bx - 4}" y1="${y(c.band[1])}" x2="${bx + 4}" y2="${y(c.band[1])}" stroke="${COL.muted}" stroke-width="1.5"/>`;
        s += `<text x="${bx + 9}" y="${y(4.5) - 2}" class="axis-label">3–6×</text>`;
        s += `<text x="${bx + 9}" y="${y(4.5) + 11}" class="axis-label">unpredictable</text>`;
      }
      s += `<text x="${x + bw / 2}" y="${H - 10}" text-anchor="middle" class="tick-label">${c.label}</text>`;
      s += `<rect class="hit" data-i="${i}" x="${ML + slot * i}" y="${MT}" width="${slot}" height="${ph}" fill="transparent"/>`;
    });
    const svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Bar chart: energy cost to invoke ${fnLabel} once, by stack position" style="width:100%;height:auto">${s}</svg>`;
    const host = document.getElementById('costChart');
    host.innerHTML = svg;
    host.querySelectorAll('.hit').forEach((r) => {
      const i = +r.dataset.i, c = COSTS[i];
      r.addEventListener('pointermove', (e) => {
        const pct = Math.round((c.v / 10) * 100);
        showTip(
          `<div class="t">${c.label} ${fnLabel}</div>
          <div class="row"><span class="k"><span class="sw" style="background:${c.color}"></span>one activation</span><b>${c.band ? '3–6' : c.v.toFixed(1)} u</b></div>
          <div class="row"><span class="k">of a full charge</span><b>${c.band ? '30–60' : pct}%</b></div>`,
          e.clientX, e.clientY
        );
      });
      r.addEventListener('pointerleave', hideTip);
    });
    host.querySelectorAll('.cost-bar').forEach((b) => costBars.push(b));
  })();
  document.getElementById('costTable').innerHTML = `
    <table><thead><tr><th>Position</th><th>Cost (units)</th><th>Share of a full charge</th></tr></thead><tbody>
    ${COSTS.map((c) => `<tr><td>${c.label}</td><td>${c.band ? '3–6 (erratic)' : c.v.toFixed(1)}</td><td>${c.band ? '30–60%' : Math.round(c.v * 10) + '%'}</td></tr>`).join('')}
    </tbody></table>`;

  /* ---- chart 2 · sustained drain ---- */
  const D2 = { W: 720, H: 340, ML: 42, MR: 78, MT: 16, MB: 34, tmax: 120, ymax: 112 };
  D2.pw = D2.W - D2.ML - D2.MR;
  D2.ph = D2.H - D2.MT - D2.MB;
  const dx = (t) => D2.ML + (t / D2.tmax) * D2.pw;
  const dy = (v) => D2.MT + D2.ph - (v / D2.ymax) * D2.ph;

  (function buildDrainChart() {
    let s = '';
    for (const g of [0, 25, 50, 75, 100]) {
      s += `<line x1="${D2.ML}" y1="${dy(g)}" x2="${D2.W - D2.MR}" y2="${dy(g)}" stroke="${g === 0 ? COL.axis : COL.grid}" stroke-width="1"/>`;
      s += `<text x="${D2.ML - 8}" y="${dy(g) + 3.5}" text-anchor="end" class="tick-label">${g}</text>`;
    }
    for (const t of [0, 30, 60, 90, 120]) {
      s += `<text x="${dx(t)}" y="${D2.H - 12}" text-anchor="middle" class="tick-label">${t}</text>`;
    }
    s += `<text x="${D2.ML - 28}" y="${D2.MT - 2}" class="axis-label">% of full charge drained</text>`;
    s += `<text x="${D2.W - D2.MR + 18}" y="${D2.H - 12}" text-anchor="start" class="axis-label">min</text>`;
    s += `<line x1="${D2.ML}" y1="${dy(100)}" x2="${D2.W - D2.MR}" y2="${dy(100)}" stroke="${COL.axis}" stroke-width="1"/>`;
    s += `<text x="${D2.ML + 4}" y="${dy(100) - 5}" class="axis-label">full depletion</text>`;
    SERIES.forEach((sr, i) => {
      let d = '';
      for (let t = 0; t <= D2.tmax; t += 1) {
        d += (t === 0 ? 'M' : 'L') + dx(t).toFixed(1) + ' ' + dy(clamp(sr.f(t), 0, 105)).toFixed(1) + ' ';
      }
      s += `<path class="drain-line" data-i="${i}" d="${d}" fill="none" stroke="${sr.color}"
            stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    s += `<circle cx="${dx(GRIP_T)}" cy="${dy(100)}" r="4.5" fill="${COL.crit}" stroke="${COL.surface}" stroke-width="2"/>`;
    s += `<text x="${dx(GRIP_T)}" y="${dy(100) - 16}" text-anchor="middle" class="axis-label" fill="${COL.crit}">⚠ grip risk begins</text>`;
    s += `<text x="${dx(GRIP_T)}" y="${dy(100) - 28}" text-anchor="middle" class="tick-label">${Math.round(GRIP_T)} min of ${gripNote}</text>`;
    const ends = SERIES.map((sr, i) => ({ i, label: sr.label, color: sr.color, y: dy(clamp(sr.f(D2.tmax), 0, 105)) }))
      .sort((a, b) => a.y - b.y);
    for (let k = 1; k < ends.length; k++) if (ends[k].y - ends[k - 1].y < 14) ends[k].y = ends[k - 1].y + 14;
    for (const e of ends) {
      const trueY = dy(clamp(SERIES[e.i].f(D2.tmax), 0, 105));
      if (Math.abs(e.y - trueY) > 5)
        s += `<line x1="${D2.W - D2.MR + 2}" y1="${trueY}" x2="${D2.W - D2.MR + 12}" y2="${e.y}" stroke="${COL.muted}" stroke-width="1"/>`;
      s += `<text x="${D2.W - D2.MR + 15}" y="${e.y + 3.5}" class="direct-label" data-i="${e.i}">${e.label}</text>`;
    }
    s += `<line id="playhead" x1="${dx(120)}" y1="${D2.MT}" x2="${dx(120)}" y2="${D2.MT + D2.ph}" stroke="${hexA(COL.ink, 0.35)}" stroke-width="1"/>`;
    SERIES.forEach((sr, i) => {
      s += `<circle class="scrub-dot" data-i="${i}" r="4" fill="${sr.color}" stroke="${COL.surface}" stroke-width="2"/>`;
    });
    s += `<line id="crosshair" y1="${D2.MT}" y2="${D2.MT + D2.ph}" stroke="${COL.axis}" stroke-width="1" style="display:none"/>`;
    s += `<rect id="drainHit" x="${D2.ML}" y="${D2.MT}" width="${D2.pw}" height="${D2.ph}" fill="transparent"/>`;
    document.getElementById('drainChart').innerHTML =
      `<svg id="drainSvg" viewBox="0 0 ${D2.W} ${D2.H}" role="img"
        aria-label="Line chart: cumulative energy drained over 120 minutes of continuous ${fnLabel} use, one curve per stack position"
        style="width:100%;height:auto">${s}</svg>`;
    document.querySelectorAll('.drain-line').forEach((l) => drainLines.push(l));
  })();

  /* legend */
  (function buildLegend() {
    const host = document.getElementById('drainLegend');
    SERIES.forEach((sr) => {
      const k = document.createElement('span');
      k.className = 'key';
      k.innerHTML = `<span class="sw" style="background:${sr.color}"></span>${sr.label}`;
      host.appendChild(k);
      legendKeys.push(k);
    });
  })();

  /* batteries */
  (function buildBatteries() {
    const host = document.getElementById('batteries');
    SERIES.forEach((sr) => {
      const d = document.createElement('div');
      d.className = 'battery';
      d.innerHTML = `<span>${sr.label}</span><div class="shell"><div class="fill" style="background:${sr.color};width:100%"></div></div>`;
      host.appendChild(d);
      batteryFills.push(d.querySelector('.fill'));
    });
  })();

  /* scrubber */
  const scrub = document.getElementById('scrub');
  const drainSvgEl = () => document.getElementById('drainSvg');
  function setScrub(t) {
    const svg = drainSvgEl();
    svg.querySelector('#playhead').setAttribute('x1', dx(t));
    svg.querySelector('#playhead').setAttribute('x2', dx(t));
    svg.querySelectorAll('.scrub-dot').forEach((dot) => {
      const sr = SERIES[+dot.dataset.i];
      dot.setAttribute('cx', dx(t));
      dot.setAttribute('cy', dy(clamp(sr.f(t), 0, 105)));
    });
    SERIES.forEach((sr, i) => {
      const remain = clamp(100 - sr.f(t), 0, 100);
      batteryFills[i].style.width = remain.toFixed(0) + '%';
    });
    document.getElementById('scrubOut').textContent = `${t} min`;
    document.getElementById('scrubLive').textContent =
      `At ${t} minutes: ` + SERIES.map((sr) => `${sr.label} ${clamp(100 - sr.f(t), 0, 100).toFixed(0)}% charge left`).join(', ');
  }
  scrub.addEventListener('input', () => setScrub(+scrub.value));
  setScrub(120);

  /* crosshair + tooltip */
  (function drainHover() {
    const svg = drainSvgEl();
    const hit = svg.querySelector('#drainHit');
    const ch = svg.querySelector('#crosshair');
    hit.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const sx = D2.W / r.width;
      const t = clamp(Math.round(((e.clientX - r.left) * sx - D2.ML) / D2.pw * D2.tmax), 0, D2.tmax);
      ch.style.display = '';
      ch.setAttribute('x1', dx(t));
      ch.setAttribute('x2', dx(t));
      showTip(
        `<div class="t">${t} min under load</div>` +
        SERIES.map((sr) =>
          `<div class="row"><span class="k"><span class="sw" style="background:${sr.color}"></span>${sr.label}</span><b>${clamp(sr.f(t), 0, 105).toFixed(0)}%</b></div>`
        ).join(''),
        e.clientX, e.clientY
      );
    });
    hit.addEventListener('pointerleave', () => { ch.style.display = 'none'; hideTip(); });
  })();

  /* drain table */
  (function drainTable() {
    const ts = [0, 15, 30, 45, 60, 75, 90, 105, 120];
    document.getElementById('drainTable').innerHTML = `
      <table><thead><tr><th>Minutes</th>${SERIES.map((s) => `<th>${s.label}</th>`).join('')}</tr></thead><tbody>
      ${ts.map((t) => `<tr><td>${t}</td>${SERIES.map((sr) => `<td>${clamp(sr.f(t), 0, 105).toFixed(0)}%</td>`).join('')}</tr>`).join('')}
      </tbody></table>
      <p style="font-size:11.5px;color:var(--muted);margin-top:8px">Values are % of a full charge drained by continuous use. The inferior curve reaches full depletion at ≈${Math.round(GRIP_T)} min — grip risk.</p>`;
  })();

  /* ---- chart 3 · recovery small multiples ---- */
  function lvl(i) { return 100 - SERIES[i].f(30); }
  (function buildRecovery() {
    const host = document.getElementById('recCharts');
    const W = 210, H = 120, ML = 8, MR = 8, MT = 10, MB = 18, tmax = 90;
    const rx = (t) => ML + (t / tmax) * (W - ML - MR);
    const ry = (v) => MT + (H - MT - MB) - (v / 100) * (H - MT - MB);
    RECOVERY.forEach((rec) => {
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
        <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Recovery curve for ${rec.label} ${fnLabel}" style="width:100%;height:auto">${s}</svg>
        <p class="note">${rec.note}</p>`;
      host.appendChild(card);
    });
  })();
  (function recTable() {
    const ts = [0, 15, 30, 45, 60, 75, 90];
    document.getElementById('recTable').innerHTML = `
      <table><thead><tr><th>Minutes</th>${RECOVERY.map((r) => `<th>${r.label}</th>`).join('')}</tr></thead><tbody>
      ${ts.map((t) => `<tr><td>${t}</td>${RECOVERY.map((r) => `<td>${clamp(r.f(t), 0, 100).toFixed(0)}%</td>`).join('')}</tr>`).join('')}
      </tbody></table>
      <p style="font-size:11.5px;color:var(--muted);margin-top:8px">Battery level (%) through 30 minutes of exertion, then rest.</p>`;
  })();

  /* ---- table toggles ---- */
  document.querySelectorAll('.table-toggle').forEach((b) => {
    b.addEventListener('click', () => {
      const t = document.getElementById(b.dataset.table);
      const open = t.classList.toggle('show');
      b.setAttribute('aria-expanded', String(open));
      b.textContent = open ? 'Hide table' : 'Data table';
    });
  });

  /* ---- rail ↔ chart linkage ---- */
  function highlightSeries(idx) {
    drainLines.forEach((l) => {
      const on = +l.dataset.i === idx;
      l.setAttribute('stroke-width', on ? 3 : 2);
      l.style.opacity = on ? 1 : 0.38;
    });
    document.querySelectorAll('#drainSvg .direct-label').forEach((t) => {
      if (t.dataset.i !== undefined) t.style.opacity = +t.dataset.i === idx ? 1 : 0.45;
    });
    costBars.forEach((b) => { b.style.opacity = +b.dataset.i === idx ? 1 : 0.4; });
    legendKeys.forEach((k, i) => k.classList.toggle('dim', i !== idx));
  }

  return { highlightSeries };
}
