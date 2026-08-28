/* ============================================================
   CURRENTS · Zone D — lab layout
   The lab's pedagogy is act-then-watch, and on a phone the
   watching half (chamber, meters, narration) used to sit a full
   screen below the acting half. On narrow viewports this module
   gathers the consequence surface into one sticky cluster that
   stays in frame while the controls scroll beneath it; on wide
   viewports the original DOM is restored byte-for-byte, so the
   desktop layout is never a second implementation.

   Reparenting is done in JS because the meters live inside the
   control panel's subtree — no pure-CSS reordering can lift
   them out without redesigning the desktop markup.
   ============================================================ */

export function initLabLayout() {
  const layout = document.querySelector('.verify-layout');
  if (!layout) return;
  const panel = layout.querySelector('.verify-panel');
  const stage = layout.querySelector('.verify-stage');
  if (!panel || !stage) return;

  /* the consequence surface: chamber + state chip + both meters + narration.
     Deep readouts and cross-listens stay in the scrolling flow — the frame
     invariant is chamber-and-meters, and pinning everything would leave no
     room to act. */
  const hudParts = [...panel.querySelectorAll(
    ':scope > .telemetry > .cog-state, :scope > .telemetry > .meter, :scope > .meters'
  )];
  const narr = panel.querySelector('#verifyNarr');

  /* original anchors, so leaving the breakpoint restores exactly */
  const moved = [stage, ...hudParts, narr].filter(Boolean).map((node) => ({
    node, parent: node.parentNode, next: node.nextSibling,
  }));

  const pin = document.createElement('div');
  pin.className = 'lab-pin';
  const hud = document.createElement('div');
  hud.className = 'lab-hud';
  pin.appendChild(hud);

  const header = document.querySelector('header.site');
  const setPinTop = () => {
    layout.style.setProperty('--pin-top', (header ? header.offsetHeight : 0) + 'px');
  };

  /* apply() is idempotent, so it can answer both the media-query change event
     and plain resizes — some embedded browsers deliver one but not the other */
  const mq = matchMedia('(max-width: 960px)');
  const apply = () => {
    if (mq.matches) {
      setPinTop();
      pin.insertBefore(stage, hud);
      hudParts.forEach((n) => hud.appendChild(n));
      if (narr) pin.appendChild(narr);
      layout.insertBefore(pin, layout.firstChild);
    } else if (pin.isConnected) {
      for (const m of moved) m.parent.insertBefore(m.node, m.next);
      pin.remove();
    }
  };
  apply();
  mq.addEventListener('change', apply);
  addEventListener('resize', apply);
}
