/* ============================================================
   CURRENTS · Zone E — field notes
   Renders the closing zone from ZONE_F data: the note cards,
   the attitude-sibling mirror, and the §2.8 CTA that was
   promised but never built. Eight hand-copied HTML versions of
   this zone are what made it impossible to grow past three
   notes; the copy now lives in content/en/<fn>.json, read
   through src/shared/copy.js.

   The CTA deep-links the Playground's ?type= entry with the
   type that carries this function in the currently-selected
   Zone B seat — which is §2.8's actual promise, not a bare link.
   ============================================================ */
import { t } from './copy.js';

/* Pages not yet migrated to the content map pass vignettes with a plain
   `text` field and a mirror with `html`; migrated pages pass description
   entries ({mechanism, figure, title, kind} / {mechanismHtml, figure}).
   Bridge both shapes here. */
const noteCopy = (v) => v.mechanism ? v : { ...v, mechanism: v.text, figure: '' };

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
  for (const raw of zone.vignettes) {
    const v = noteCopy(raw);
    const art = document.createElement('article');
    art.className = 'vignette';
    art.innerHTML =
      `${v.kind ? `<p class="kind">${v.kind}</p>` : ''}<h4>${v.title}</h4><p>${v.mechanism}</p>` +
      (v.figure ? `<p class="figurative">${v.figure}</p>` : '');
    cards.appendChild(art);
  }
  host.appendChild(cards);

  const m = zone.mirror;
  if (m && (m.copy || m.html)) {
    /* m.link: an optional trailing cross-page link — href stays in JS,
       its label travels with the mirror entry in the map */
    const tail = m.link ? ` <a href="${m.link.href}">${m.link.label}</a>` : '';
    const body = m.copy
      ? `<p>${m.copy.mechanismHtml || m.copy.mechanism}${tail}</p>` +
        (m.copy.figure ? `<p class="figurative">${m.copy.figure}</p>` : '')
      : `<p>${m.html}</p>`;
    const vs = t('site.fieldNotes.mirrorVs', {
      fn: `<span style="color:var(--c-accent)">${m.label}</span>`,
      counterpart: `<span style="color:${m.counterpartColor}">${m.counterpart}</span>`,
    });
    const mirror = document.createElement('div');
    mirror.className = 'mirror';
    mirror.innerHTML = `<div class="vs">${vs}</div><div>${body}</div>`;
    host.appendChild(mirror);
  }

  const row = document.createElement('div');
  row.className = 'cta-row';
  const go = document.createElement('a');
  go.className = 'cta';
  go.href = '/playground/';
  go.textContent = t('site.fieldNotes.ctaPlayground', { fn: fnLabel });
  const quiet = document.createElement('a');
  quiet.className = 'cta quiet';
  quiet.href = '/energy/';
  quiet.textContent = t('site.fieldNotes.ctaEnergy', { fn: fnLabel });
  row.appendChild(go);
  row.appendChild(quiet);
  host.appendChild(row);

  function setSlot(slot) {
    const type = slot.types.split('·')[0].trim();
    go.href = `/playground/?type=${type}`;
    go.innerHTML =
      t('site.fieldNotes.ctaPlayground', { fn: fnLabel }) +
      ` <small>${t('site.fieldNotes.ctaSeated', { type, position: slot.name.toLowerCase() })}</small>`;
  }

  return { setSlot };
}
