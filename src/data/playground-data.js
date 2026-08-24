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

/* ---------- the three Laws ----------
   Stated flatly, because the Assembly teaches them by refusing things and a
   hedge inside a refusal teaches nothing. Where they come from — and which of
   them is Jung, which is convention, and which is contested — is PROVENANCE
   at the foot of this file, one Layer-3 drawer away. */
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

  freeplay: 'No human runs like this — which is the point. The Laws aren’t etiquette; they’re what this model of a workable mind requires.',
};

function oppositeOf(fn) {
  return { ne: 'si', si: 'ne', ni: 'se', se: 'ni', te: 'fi', fi: 'te', ti: 'fe', fe: 'ti' }[fn];
}

/* ---------- Assembly pacing ----------
   One clock for every path through the build. A manual build only needs the
   two animation dwells, because the user's own hands set the tempo. The
   auto-build needs the rest: there the caption is the only thing happening,
   so the beat has to last as long as the sentence takes to read (§2.4). */
export const PACE = {
  seat: 620,        /* seating flourish — matches @keyframes seat in the theme */
  refuse: 620,      /* the refusal shudder — matches @keyframes refuse         */
  fly: 620,         /* a refused candidate's flight from shelf to the aux slot */
  lead: 700,        /* the held breath before the first placement              */
  read: 20,         /* ms of dwell per character of caption                    */
  readMin: 2500,    /* …floored and capped, so no beat is a flash or a stall   */
  readMax: 3500,
  reduced: 2500,    /* prefers-reduced-motion: nothing moves, everything reads */
};

/* ---------- the auto-build ----------
   §2.4: for users who arrive knowing their letters, the build is the lecture
   disguised as a cutscene. They skipped the hands-on encoding, so the two
   refusals they never triggered are staged for them — nobody leaves this door
   having met only Law III. */
export const AUTO = {
  open: (code) =>
    `${code}. You already know the letters. Here is what they are made of: ` +
    `two choices, and the Laws that refuse everything else.`,

  refused: (fn, reason) => `${FN[fn].label} second? ${reason}`,

  tert: (fn) =>
    `${FN[fn].label} lands third, and nobody chose it — it is the far end of the ` +
    `auxiliary's own axis. The bottom of a stack is entailed, never picked.`,

  skip: 'Skip the build',
};

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

/* ---------- the epistemic layer ----------
   Every place the interface prints a number it invented, it also has to
   say so. The page footer carries the general disclaimer; the receipt
   legend and the tooltips below carry it where the numbers actually are,
   because a caveat at the bottom of a long page is a caveat nobody read. */
export const EPISTEMIC = {
  /* the page-foot disclaimer */
  footer:
    'The Playground animates an interpretive model, not measured psychology. A receipt is the model’s ' +
    'arithmetic — a cost profile, never a verdict on a person.',

  /* the small print printed on every receipt, terms in the order they appear in a row */
  receipt: {
    lead: 'Small print',
    terms: [
      { sym: 'u', gloss: 'model units — this model’s arithmetic, not a measurement' },
      { sym: '×', gloss: 'the slot’s activation multiplier' },
      { sym: 'τ', gloss: 'the attitude-translation tax' },
      { sym: 'gate', gloss: 'the situation’s multiplier on that chamber' },
    ],
  },

  /* hover copy on the × / τ / gate tokens inside a receipt line — plain text,
     these are title attributes */
  tips: {
    mult: '× — the slot’s activation multiplier: what this model charges for running a demand through that position in the stack.',
    tau: 'τ — the attitude-translation tax: this model’s surcharge for meeting a demand with the opposite-attitude sibling instead of the function it asked for.',
    gate: 'gate — the situation’s multiplier on that chamber: how far this scenario turns that chamber up or down.',
  },

  /* hover copy on an action card’s forecast percentage */
  forecast:
    'Model output, not a measurement: a softmax over this model’s own cost estimates for each action — '
    + 'what this Vessel would probably do inside the model, not a calibrated probability of human behaviour.',
};

/* ---------- the Layer-3 sources drawer (§2.3, beat 4) ----------
   The one place the Playground stops narrating its model and names it.
   Everything above this line is written in the model's own voice, because a
   builder that hedges every rule teaches nobody the rule. That confidence is
   only honest if there is somewhere the mode says out loud whose rules these
   are — and admits that one of the three Laws is a convention, and another is
   one reading of an ambiguous sentence.

   Layer 3 in the strict sense: nothing here operates anything, nothing here is
   needed to build or run a Vessel, and the drawer opens only by hand. */
export const PROVENANCE = {
  toggle: 'What did I just build?',

  /* §1 — the encoding, for the type actually on the stage */
  encoding: {
    lead: 'The encoding',
    chose: 'You chose two',
    entailed: 'The other two chose themselves',
    chosen: {
      dom: 'the function that leads — one real choice, eight ways',
      /* Free Play lifts the Laws, so it also lifts the reason there were only
         two candidates. The drawer must not claim a constraint that was off. */
      aux: (lawful) => lawful
        ? 'the second, and the last thing you picked: Laws I and II left exactly two open'
        : 'the second, and the last thing you picked — with the Laws lifted, all seven were open',
    },
    entail: {
      tert: (auxLabel) => `the far end of ${auxLabel}’s axis, riding the smaller end of the beam`,
      inf: (domLabel) => `the far end of ${domLabel}’s axis — installed the moment you chose the helm`,
    },
    code: 'The four letters, derived',
    /* one gloss per part of the derivation; keys match codeParts()'s `of` */
    letters: {
      attitude: (f) => `the dominant’s attitude — ${f.name} faces ${f.att === 'e' ? 'outward' : 'inward'}`,
      perceive: (f) => `the lens in the top two — ${f.name}`,
      judge: (f) => `the valve in the top two — ${f.name}`,
      orientation: (f) =>
        `the outward-facing half of the top two ${f.cls === 'judge' ? 'decides, so J' : 'takes in, so P'} — ` +
        `${f.name} is what the world meets`,
    },
    /* Free Play can seat a stack no four letters describe. */
    unclassifiable:
      'No four letters fit this build. The code is read off the top two, and it needs a lens, a valve, ' +
      'and one of them facing outward — this Vessel is missing at least one of the three.',
  },

  /* §2 — whose rules these are */
  sources: {
    lead: 'Whose rules these are',
    intro:
      'The three Laws are not one thing. They come from three different places and stand on three ' +
      'very different footings, and the Assembly states all of them in the same flat voice:',
    items: [
      {
        claim: 'Dominant and inferior are opposites',
        law: 'Law III',
        standing: 'Jung',
        note:
          'Jung’s own, and the least contested piece of the model: the function a psyche leads with leaves ' +
          'its polar opposite undifferentiated and largely out of reach (Psychological Types, ch. X, ' +
          '“General Description of the Types”). The beam you watched materialise is this claim, drawn.',
      },
      {
        claim: 'The stack alternates attitude, all the way down',
        law: 'the Vessel’s geometry',
        standing: 'Grant / Beebe convention',
        note:
          'Not Jung. The four-slot stack whose attitudes alternate outward–inward–outward–inward comes from ' +
          'the Grant line (W. Harold Grant, Magdala Thompson & Thomas E. Clarke, From Image to Likeness, 1983) ' +
          'and is carried into eight slots by John Beebe’s eight-function model. It is a convention this mode ' +
          'adopts wholesale — and it is the only reason “two above the Surface, two below” is true of every type.',
      },
      {
        claim: 'The tertiary faces the same way the dominant does',
        law: 'a consequence of the above',
        standing: 'contested',
        note:
          'Myers-line sources place the tertiary’s attitude differently: Myers left it largely unstated, and much ' +
          'of the literature after her reads the tertiary as sharing the auxiliary’s attitude instead. Take that ' +
          'reading and one chamber changes worlds — it crosses the Surface, and the loop the Vessel can draw ' +
          'between dominant and tertiary stops existing.',
      },
      {
        claim: 'The auxiliary faces the world the dominant doesn’t',
        law: 'Law I',
        standing: 'one reading of Jung',
        note:
          'Law I rests on a single ambiguous passage: Jung says the auxiliary is “in every respect different” ' +
          'from the dominant, without saying whether different means the other attitude or only the other job. ' +
          'The balanced-attitude reading is Myers’ and it is the one built into this page; it has been argued ' +
          'about since 1923 and is not settled.',
      },
    ],
    close:
      'So read the three Laws as this model’s rules rather than as necessities of mind. They are load-bearing ' +
      'here because the Playground was built on them — hand the same two choices to a different school and you ' +
      'get a different Vessel.',
  },

  /* §3 — the caveat, in the same register as EPISTEMIC.footer */
  caveats: {
    lead: 'And the usual',
    note:
      'The Playground animates an interpretive model, not measured psychology. Every constant in the economy — ' +
      'the slot multipliers, the translation tax, the gates, the forecast — was authored to make the model ' +
      'legible and is not a measurement of anyone. Nothing you build here is a claim about a person, including you.',
  },
};
