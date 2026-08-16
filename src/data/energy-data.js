/* ============================================================
   CURRENTS · Combined energy economics data

   Zone E was, on every one of the eight function pages, the same
   three charts against near-identical numbers — the cost-per-
   activation ladder is *literally* identical (1.0 / 1.5 / 2.5 /
   4.0 / 3–6), and the drain models differ by a few percent in
   their leading coefficients. Eight copies of a chart nobody can
   compare across is worse than one chart that can be.

   So this module pulls the real models out of the eight page data
   modules — no numbers are restated here, because a restated
   constant is a constant that drifts — and adds only what a
   cross-function view needs and a single page cannot know:
   function identity, attitude, and which function each one's
   collapse floods into.
   ============================================================ */
import { loadTiData } from './ti-data.js';
import { loadTeData } from './te-data.js';
import { loadFiData } from './fi-data.js';
import { loadFeData } from './fe-data.js';
import { loadNeData } from './ne-data.js';
import { loadNiData } from './ni-data.js';
import { loadSeData } from './se-data.js';
import { loadSiData } from './si-data.js';
import { GRIP } from './typology.js';

/** Solve f(t) = target numerically. The dominant drain curves carry sinusoidal
    micro-recovery notches, so there is no closed form — and the time the
    DOMINANT runs out is the number that actually matters for the grip (see
    the note in energy/main.js), so it has to be computed rather than assumed. */
function timeTo(f, target, tmax = 3000) {
  for (let t = 0; t <= tmax; t++) if (f(t) >= target) return t;
  return Infinity;
}

/* Identity, in stack order of the atlas nav. `color` is the page's own
   accent, so a curve here is the colour that function is everywhere else.
   `dash` is the redundant, non-colour channel for attitude (§3.5): solid
   for extraverted, dashed for introverted — the same distinction the glyph
   grammar makes with open versus closed rings. */
const IDENTITY = [
  { key: 'ne', label: 'Ne', name: 'Extraverted Intuition', element: 'Intuition', attitude: 'e', color: '#9d6dff', dash: '',      grip: 'Si', load: loadNeData },
  { key: 'ni', label: 'Ni', name: 'Introverted Intuition', element: 'Intuition', attitude: 'i', color: '#8257f0', dash: '6 4',   grip: 'Se', load: loadNiData },
  { key: 'se', label: 'Se', name: 'Extraverted Sensing',   element: 'Sensing',   attitude: 'e', color: '#f6a71f', dash: '',      grip: 'Ni', load: loadSeData },
  { key: 'si', label: 'Si', name: 'Introverted Sensing',   element: 'Sensing',   attitude: 'i', color: '#d78f1c', dash: '6 4',   grip: 'Ne', load: loadSiData },
  { key: 'te', label: 'Te', name: 'Extraverted Thinking',  element: 'Thinking',  attitude: 'e', color: '#17d4ef', dash: '',      grip: 'Fi', load: loadTeData },
  { key: 'ti', label: 'Ti', name: 'Introverted Thinking',  element: 'Thinking',  attitude: 'i', color: '#4fc9e0', dash: '6 4',   grip: 'Fe', load: loadTiData },
  { key: 'fe', label: 'Fe', name: 'Extraverted Feeling',   element: 'Feeling',   attitude: 'e', color: '#ff4d75', dash: '',      grip: 'Ti', load: loadFeData },
  { key: 'fi', label: 'Fi', name: 'Introverted Feeling',   element: 'Feeling',   attitude: 'i', color: '#f56a8c', dash: '6 4',   grip: 'Te', load: loadFiData },
];

/* The per-type grip patterns live in typology.js, which the phenomena page
   also reads. Two copies of Quenk's material on two pages would drift. */

/** Positions are the shared axis of the whole page, so they are named once
    here rather than re-derived from each function's own palette. */
export const POSITIONS = [
  { key: 'dom',  label: 'Dominant',  idx: 0 },
  { key: 'aux',  label: 'Auxiliary', idx: 1 },
  { key: 'tert', label: 'Tertiary',  idx: 2 },
  { key: 'inf',  label: 'Inferior',  idx: 3 },
  { key: 'sh',   label: 'Shadow',    idx: 4 },
];

export function loadEnergyData() {
  const fns = IDENTITY.map((id) => {
    const d = id.load();
    return {
      key: id.key, label: id.label, name: id.name,
      element: id.element, attitude: id.attitude,
      color: id.color, dash: id.dash,
      href: `/${id.key}/`,
      grip: id.grip, gripNote: GRIP[id.key].text,
      /* two different clocks, previously conflated under one name:
           infT — how long forced use of the INFERIOR takes to exhaust it
           domT — how long sustained use of the DOMINANT takes to exhaust it,
                  which is the clock Quenk's grip actually runs on */
      infT: d.GRIP_T,
      domT: timeTo(d.SERIES[0].f, 100),
      series: d.SERIES,       /* [{key,label,color,f}] — f(t) → % drained */
      costs: d.COSTS,         /* [{label,v,color,band?}] */
      recovery: d.RECOVERY,   /* [{label,color,note,f}] */
    };
  });

  /* The cost ladder is the same object on all eight pages; assert that here
     rather than trusting the comment, because the moment it stops being true
     this page is telling a lie about a law. */
  const ref = fns[0].costs.map((c) => c.v).join(',');
  const shared = fns.every((f) => f.costs.map((c) => c.v).join(',') === ref);

  return { fns, positions: POSITIONS, sharedCosts: shared, costs: fns[0].costs };
}
