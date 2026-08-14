/* ============================================================
   CURRENTS · Site header + function atlas navigation
   ============================================================ */

const FUNCTIONS = [
  { key: 'ne', label: 'Ne', href: '/ne/' },
  { key: 'ni', label: 'Ni', href: '/ni/' },
  { key: 'se', label: 'Se', href: '/se/' },
  { key: 'si', label: 'Si', href: '/si/' },
  { key: 'te', label: 'Te', href: '/te/' },
  { key: 'ti', label: 'Ti', href: '/ti/' },
  { key: 'fe', label: 'Fe', href: '/fe/' },
  { key: 'fi', label: 'Fi', href: '/fi/' },
];

/* Set of function keys that have a live page */
const LIVE = new Set(['ti', 'fi', 'te', 'ni']);

/**
 * Render the CURRENTS header into the existing <header class="site"> element.
 * @param {string} activeKey — the function key for the current page (e.g. 'fi')
 */
export function initHeader(activeKey) {
  const header = document.querySelector('header.site');
  if (!header) return;

  header.innerHTML = '';

  const brand = document.createElement('div');
  brand.className = 'brand';
  brand.innerHTML = 'CURRENTS<small>an atlas of the eight cognitive functions</small>';
  header.appendChild(brand);

  const nav = document.createElement('nav');
  nav.className = 'atlas';
  nav.setAttribute('aria-label', 'Function atlas');

  for (const fn of FUNCTIONS) {
    const a = document.createElement('a');
    if (fn.key === activeKey) {
      a.className = 'active';
      a.href = '#zone-a';
      a.setAttribute('aria-current', 'page');
    } else if (LIVE.has(fn.key)) {
      a.href = fn.href;
    } else {
      a.className = 'soon';
      a.title = 'Phase 2';
      a.setAttribute('aria-disabled', 'true');
    }
    a.textContent = fn.label;
    nav.appendChild(a);
  }

  header.appendChild(nav);
}
