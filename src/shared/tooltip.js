/* ============================================================
   CURRENTS · Tooltip
   One mechanism for every tooltip on the site. Two modes:
   - showTip/hideTip: transient, follows the pointer (charts).
   - pinTip: stays up for keyboard focus and touch, and owns its
     own dismissal (Escape, or any press outside the anchor) —
     a pointer-events:none div can never be dismissed by
     interacting with itself, so the pin has to listen globally.
   ============================================================ */

let _el = null;
let _pinned = false;
let _pinListenersOn = false;

function el() {
  if (!_el) _el = document.getElementById('tooltip');
  return _el;
}

function place(html, x, y) {
  const tip = el();
  tip.innerHTML = html;
  tip.style.display = 'block';
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.min(Math.max(10, x + 14), innerWidth - w - 10) + 'px';
  tip.style.top  = Math.max(10, y - h - 12) + 'px';
}

export function showTip(html, x, y) {
  if (_pinned) return;
  place(html, x, y);
}

export function hideTip(force) {
  if (_pinned && !force) return;
  _pinned = false;
  el().style.display = 'none';
}

function onDocDown(e) {
  if (!_pinned) return;
  /* the anchor's own handler re-pins; everything else dismisses */
  if (e.target.closest && e.target.closest('[data-tip-anchor]')) return;
  hideTip(true);
}
function onDocKey(e) {
  if (_pinned && e.key === 'Escape') hideTip(true);
}

/** Pin the tip open at (x, y). Elements that manage their own pinned tips
    mark themselves with `data-tip-anchor` so their taps don't self-dismiss. */
export function pinTip(html, x, y) {
  _pinned = false;         /* let place() through */
  place(html, x, y);
  _pinned = true;
  if (!_pinListenersOn) {
    _pinListenersOn = true;
    /* deferred so the press that pinned doesn't immediately unpin */
    setTimeout(() => {
      document.addEventListener('pointerdown', onDocDown, true);
      document.addEventListener('keydown', onDocKey, true);
    }, 0);
  }
}

export function tipPinned() { return _pinned; }
