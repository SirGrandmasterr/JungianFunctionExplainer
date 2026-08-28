/* ============================================================
   CURRENTS · Zone E — field notes
   Renders the closing zone from ZONE_F data: the note cards,
   the attitude-sibling mirror, and the §2.8 CTA that was
   promised but never built. Eight hand-copied HTML versions of
   this zone are what made it impossible to grow past three
   notes; the copy now lives in src/data/<fn>-data.js.

   The CTA deep-links the Playground's ?type= entry with the
   type that carries this function in the currently-selected
   Zone B seat — which is §2.8's actual promise, not a bare link.
   ============================================================ */

/**
 * @param {Object} cfg
 * @param {Object} cfg.zone     — ZONE_F data: { vignettes, mirror }
 * @param {string} cfg.fnLabel  — e.g. 'Fi'
 */
export function initFieldNotes(cfg) {
  const host = document.getElementById('fieldNotes');
  if (!host) return { setSlot() {} };
  const { zone, fnLabel } = cfg;

  const cards = document.createElement('div');
  cards.className = 'cards';
  for (const v of zone.vignettes) {
    const art = document.createElement('article');
    art.className = 'vignette';
    art.innerHTML = `${v.kind ? `<p class="kind">${v.kind}</p>` : ''}<h4>${v.title}</h4><p>${v.text}</p>`;
    cards.appendChild(art);
  }
  host.appendChild(cards);

  const m = zone.mirror;
  if (m && m.html) {
    const mirror = document.createElement('div');
    mirror.className = 'mirror';
    mirror.innerHTML =
      `<div class="vs"><span style="color:var(--c-accent)">${m.label}</span> vs ` +
      `<span style="color:${m.counterpartColor}">${m.counterpart}</span></div><p>${m.html}</p>`;
    host.appendChild(mirror);
  }

  const row = document.createElement('div');
  row.className = 'cta-row';
  const go = document.createElement('a');
  go.className = 'cta';
  go.href = '/playground/';
  go.textContent = `Take ${fnLabel} to the Playground →`;
  const quiet = document.createElement('a');
  quiet.className = 'cta quiet';
  quiet.href = '/energy/';
  quiet.textContent = `What ${fnLabel} costs, against the other seven →`;
  row.appendChild(go);
  row.appendChild(quiet);
  host.appendChild(row);

  function setSlot(slot) {
    const type = slot.types.split('·')[0].trim();
    go.href = `/playground/?type=${type}`;
    go.innerHTML =
      `Take ${fnLabel} to the Playground → <small>arrives seated as ${type}'s ${slot.name.toLowerCase()}</small>`;
  }

  return { setSlot };
}
