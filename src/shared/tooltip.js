/* ============================================================
   CURRENTS · Tooltip
   ============================================================ */

let _el = null;

function el() {
  if (!_el) _el = document.getElementById('tooltip');
  return _el;
}

export function showTip(html, x, y) {
  const tip = el();
  tip.innerHTML = html;
  tip.style.display = 'block';
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.min(x + 14, innerWidth - w - 10) + 'px';
  tip.style.top  = Math.max(10, y - h - 12) + 'px';
}

export function hideTip() {
  el().style.display = 'none';
}
