/* ============================================================
   CURRENTS · Playground — data & copy layer
   Everything the Playground says, and every constant it says it
   with. No logic, no rendering: the theory layer is editable
   here without touching an engine.
   ============================================================ */
import { FN, FN_KEYS } from '../playground/types.js';

/* ---------- §3.1 parametric presets, by rank ----------
   The same vector the Stack Rail drives on every function page.
   `scale` is deliberately held near 1: on the Vessel, hierarchy is
   carried by the size of the chamber's own canvas, so re-applying it
   inside the glyph would double the falloff and shrink a tertiary to
   a smudge. The other five parameters carry the degradation intact. */
export const RANK_PARAMS = {
  dom:  { scale: 0.94, fidelity: 0.95, latency: 0,   noise: 0,    duty: 1.00, control: 1.00, contrary: 0 },
  aux:  { scale: 0.92, fidelity: 0.85, latency: 80,  noise: 0.05, duty: 0.85, control: 0.90, contrary: 0 },
  tert: { scale: 0.90, fidelity: 0.60, latency: 250, noise: 0.20, duty: 0.50, control: 0.60, contrary: 0 },
  inf:  { scale: 0.88, fidelity: 0.35, latency: 700, noise: 0.45, duty: 0.25, control: 0.35, contrary: 0.12 },
};

/** Chamber canvas size as a fraction of the stage's short edge. */
export const RANK_SIZE = { dom: 1.00, aux: 0.78, tert: 0.56, inf: 0.44 };

/** Conduit weight — the taper *is* the hierarchy, read at a glance. */
export const RANK_WEIGHT = { dom: 1.0, aux: 0.75, tert: 0.45, inf: 0.25 };

export const RANK_LABEL = { dom: 'Dominant', aux: 'Auxiliary', tert: 'Tertiary', inf: 'Inferior' };

/* ---------- Vessel layout ----------
   Dominant and auxiliary hold the left column; tertiary and inferior
   the right. Row is decided purely by attitude — which is what makes
   "every type floats two above the Surface and two below" a fact of
   the drawing rather than a caption. */
export const ANCHOR = {
  left: 0.255, right: 0.745,     /* column centres, fraction of stage width  */
  above: 0.255, below: 0.745,    /* row centres, fraction of stage height    */
  surface: 0.5,
};

/* ---------- the three Laws ---------- */
export const LAWS = [
  {
    n: 'I', key: 'attitude', name: 'The Law of Two Worlds',
    rule: 'The top two functions face opposite worlds — one outward, one inward.',
    say: 'A mind facing only outward has no depth to consult. Facing only inward, it has no door.',
  },
  {
    n: 'II', key: 'class', name: 'The Law of Two Jobs',
    rule: 'The top two split the work — one takes the world in, one decides.',
    say: 'Two lenses and nothing ever gets decided. Two valves and nothing new ever gets in.',
  },
  {
    n: 'III', key: 'axis', name: 'The Law of the Axis',
    rule: 'Installing a function installs its opposite at the far end of the same beam.',
    say: 'You don’t choose four functions. You choose two axes — and which ends point up.',
  },
];

/* ---------- Assembly narration ---------- */
export const ASSEMBLY = {
  prompt0: 'Choose the function that leads.',
  prompt1: 'Now the second. Only two are still open — see which ones brightened.',
  prompt2: 'Nothing left to choose. Confirm what the axes already decided.',
  prompt3: 'Assembled.',

  intro: 'Eight functions. Two choices. Sixteen people.',

  dom: (fn) =>
    `${FN[fn].label} takes the helm. And notice what arrived without being asked: ` +
    `${FN[oppositeOf(fn)].label}, at the far end of the same axis. Every strength drags its opposite ` +
    `behind it — smaller, deeper, and rarely on your side.`,

  aux: (dom, aux) =>
    `${FN[aux].label} ${FN[aux].att === 'i' ? 'below' : 'above'} the Surface: the ` +
    `${FN[aux].cls === 'judge' ? 'deciding' : 'noticing'} is done ` +
    `${FN[aux].att === 'i' ? 'in private' : 'out in the open'}. ` +
    `The world mostly meets your ${FN[dom].att === 'e' ? FN[dom].label : FN[aux].label} and assumes that is all of you.`,

  entail: 'You made two choices. The other two were made the moment you made the first two.',

  spoken: 'Already spoken for — the axes are full.',

  freeplay: 'No human runs like this — which is the point. The Laws aren’t etiquette; they’re what a workable mind requires.',
};

function oppositeOf(fn) {
  return { ne: 'si', si: 'ne', ni: 'se', se: 'ni', te: 'fi', fi: 'te', ti: 'fe', fe: 'ti' }[fn];
}

/* ---------- Free Play diagnoses ---------- */
export const MALFORMED = [
  {
    test: (s) => keys(s).every((k) => FN[k].cls === 'perceive'),
    label: 'Four lenses, no valve',
    note: 'Stimulus pours in, circles, and never collapses into a decision. Nothing on the deck can be chosen.',
  },
  {
    test: (s) => keys(s).every((k) => FN[k].cls === 'judge'),
    label: 'Four valves, no lens',
    note: 'Verdicts fired at a world this psyche never actually sampled. Every read is confident, and none of them is informed.',
  },
  {
    test: (s) => keys(s).every((k) => FN[k].att === 'e'),
    label: 'Nothing below the Surface',
    note: 'Frantic surface activity over an empty interior: nothing is banked and nothing is weighed. Look at the lower half of the canvas.',
  },
  {
    test: (s) => keys(s).every((k) => FN[k].att === 'i'),
    label: 'No door',
    note: 'A rich interior with no way out. Every action is a translation, and every translation is taxed.',
  },
];
const keys = (s) => ['dom', 'aux', 'tert', 'inf'].map((r) => s[r]).filter(Boolean);

/* ---------- monologue register (§4.5) ----------
   Rank sets the voice, never the order. Salience sets the order. */
export const REGISTER = {
  dom:  { cls: 'v-dom',  tag: 'fluent',    trim: 1.00, prefix: '' },
  aux:  { cls: 'v-aux',  tag: 'advisory',  trim: 0.85, prefix: '' },
  tert: { cls: 'v-tert', tag: 'eager',     trim: 0.55, prefix: '' },
  inf:  { cls: 'v-inf',  tag: 'fragments', trim: 0.30, prefix: '' },
};

/* Hedges the auxiliary adds; the tertiary's eager opener; how the
   inferior breaks off. Applied programmatically so a scenario author
   writes one line per function and gets four registers for free. */
export const VOICING = {
  aux: ['Hold on — ', 'Before we move: ', 'Worth saying: '],
  tert: ['Oh — ', 'Easy: ', 'We could just — '],
  infTail: ['…', ' — no, never mind.', ' —', '… can we not.'],
};

/* ---------- the interior instruments (§4.3) ---------- */
export const INSTRUMENTS = {
  si: {
    fn: 'si', title: 'The Pool', question: 'Has this happened before?',
    field: 'familiarity',
    options: [
      { v: 'familiar-good', label: 'Familiar, and it went fine', note: 'a bright ring, already laid down' },
      { v: 'familiar-bad', label: 'Familiar, and it went badly', note: 'the record is specific, and it is not kind' },
      { v: 'unprecedented', label: 'Never happened before', note: 'nothing in the strata answers' },
    ],
  },
  ni: {
    fn: 'ni', title: 'The Convergence', question: 'Did you see this coming?',
    field: 'trajectory',
    options: [
      { v: 'foreseen', label: 'Foreseen', note: 'the streams were already bending here' },
      { v: 'blindside', label: 'Blindside', note: 'it arrives across the trajectory' },
    ],
  },
  ti: {
    fn: 'ti', title: 'The Lattice', question: 'Does it fit your model?',
    field: 'modelFit',
    options: [
      { v: 'consistent', label: 'Consistent', note: 'the framework absorbs it' },
      { v: 'contradiction', label: 'Contradiction', note: 'an axiom just failed in production' },
    ],
  },
  fi: {
    fn: 'fi', title: 'The Tuning Fork', question: 'How does it ring?',
    field: 'valence', type: 'range',
    lo: 'rings false', hi: 'rings true',
  },
};

/* ---------- the weather map (§5.8) ---------- */
export const QUADRANT = {
  flow:     { key: 'flow',     label: 'Flow',      note: 'energy to spend, nothing pulling at you' },
  wired:    { key: 'wired',    label: 'Wired',     note: 'running hot — capable, and not calm' },
  settled:  { key: 'settled',  label: 'Settled',   note: 'spent, and at peace with it' },
  gripRisk: { key: 'gripRisk', label: 'Grip risk', note: 'low reserves, high load — the inferior is close to the helm' },
  grip:     { key: 'grip',     label: 'In the grip', note: 'the small chamber has the helm' },
};

export function quadrant(energy, stress) {
  const hiE = energy >= 50, hiS = stress >= 50;
  if (hiE && !hiS) return QUADRANT.flow;
  if (hiE && hiS) return QUADRANT.wired;
  if (!hiE && !hiS) return QUADRANT.settled;
  return QUADRANT.gripRisk;
}

/* ---------- element ordering for the shelf ---------- */
export const SHELF_ORDER = ['ne', 'se', 'te', 'fe', 'ni', 'si', 'ti', 'fi'];
export const ALL_FNS = FN_KEYS;

export const EPISTEMIC =
  'The Playground animates an interpretive model, not measured psychology. A receipt is the model’s ' +
  'arithmetic — a cost profile, never a verdict on a person.';
