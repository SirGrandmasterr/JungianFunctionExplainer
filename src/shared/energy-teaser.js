/* ============================================================
   CURRENTS · Zone E — the energy summary

   Replaces the three-chart economics suite that used to be
   repeated, near-identically, on all eight function pages. The
   charts moved to /energy/, where the comparison that actually
   carries the lesson — between functions — is possible at all.

   What stays here is deliberately small but not decorative: the
   cost ladder this function pays, the minute at which sustained
   use tips into grip risk, and which function the collapse runs
   into. DESIGN §1.4: the battery is never off-screen.
   ============================================================ */

/**
 * @param {Object} cfg
 * @param {Array}  cfg.costs    — COSTS ladder [{label,v,color,band?}]
 * @param {string} cfg.fnLabel  — e.g. 'Fe'
 * @param {number} cfg.gripT    — minutes of inferior-position use to depletion
 * @param {string} cfg.gripInto — the function a collapse hands over to
 * @param {string} [cfg.note]   — one page-specific sentence, if it has one
 */
export function initEnergyTeaser(cfg) {
  const host = document.getElementById('energyTeaser');
  if (!host) return;
  const { costs, fnLabel, gripT, gripInto, note } = cfg;

  /* spelled out rather than truncated — slicing the position names yields
     "Domi / Auxi / Infe / Shad", which reads as a rendering bug */
  const SHORT = { Dominant: 'dom', Auxiliary: 'aux', Tertiary: 'tert', Inferior: 'inf', Shadow: 'shdw' };

  const max = Math.max(...costs.map((c) => c.v));
  const strip = costs.map((c) => {
    const h = Math.round((c.v / max) * 58);
    return `<span class="b" style="height:${h}px;background:${c.color}" title="${c.label}: ${c.band ? '3–6' : c.v.toFixed(1)} u">
      <b>${c.band ? '3–6' : c.v.toFixed(1)}</b><i>${SHORT[c.label] || c.label.toLowerCase()}</i></span>`;
  }).join('');

  const dom = costs[0], inf = costs[3];

  host.innerHTML = `
    <div class="cost-strip" role="img"
         aria-label="Cost ladder for ${fnLabel}: ${costs.map((c) => `${c.label} ${c.band ? '3 to 6' : c.v.toFixed(1)} units`).join(', ')}">
      ${strip}
    </div>
    <div class="body">
      <p>One invocation of ${fnLabel} costs <b>${dom.v.toFixed(1)} u</b> in the dominant slot and
         <b>${inf.v.toFixed(1)} u</b> in the inferior — the same ladder every function pays.
         Run ${fnLabel} as a dominant long enough to empty it and what arrives is not more
         ${fnLabel}: it is inferior <b>${gripInto}</b>, arriving with none of ${fnLabel}'s
         practice.${note ? ' ' + note : ''}</p>
      <a class="go" href="/energy/">See all eight compared →</a>
      <a class="go quiet" href="/phenomena/#two">Loops &amp; grips →</a>
    </div>`;
}
