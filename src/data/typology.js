/* ============================================================
   CURRENTS · Typology primitives

   The function-level facts several pages need: the four opposing
   axes, the sixteen stacks, Beebe's eight archetypal positions,
   and the grip and loop patterns. Everything here is DERIVED
   where it can be derived — the sixteen stacks are computed from
   the four letters rather than typed out, because 128 hand-typed
   function slots is 128 chances to introduce a silent error that
   no test would catch.

   Provenance matters on this material and is tracked explicitly,
   because these ideas come from four different sources with very
   different evidential standing (see SOURCES below, and
   DESIGN.md §1.4.5 on honest epistemics).
   ============================================================ */

/** The four axes. A function's opposite is the other element in the
    other attitude; this pairing is what makes the stack alternate. */
export const OPPOSITE = {
  Ni: 'Se', Se: 'Ni', Ne: 'Si', Si: 'Ne',
  Ti: 'Fe', Fe: 'Ti', Te: 'Fi', Fi: 'Te',
};

/** Same element, flipped attitude — how Beebe generates the shadow half. */
export const FLIP = {
  Ni: 'Ne', Ne: 'Ni', Si: 'Se', Se: 'Si',
  Ti: 'Te', Te: 'Ti', Fi: 'Fe', Fe: 'Fi',
};

export const AXES = [
  { key: 'ns', label: 'Ne ↔ Si', a: 'Ne', b: 'Si', element: 'Intuition / Sensing',
    note: 'Branching possibility against the stored record. Strengthen one and the other quietens: the more the field of what-could-be opens, the less weight what-has-always-been is given.' },
  { key: 'sn', label: 'Se ↔ Ni', a: 'Se', b: 'Ni', element: 'Sensing / Intuition',
    note: 'The live present against the single converging trajectory. You cannot be fully in the room and fully at the horizon in the same instant.' },
  { key: 'tf', label: 'Te ↔ Fi', a: 'Te', b: 'Fi', element: 'Thinking / Feeling',
    note: 'Measurable external result against unargued internal worth. The classic bind: the efficient move and the one you can live with are not always the same move.' },
  { key: 'ft', label: 'Fe ↔ Ti', a: 'Fe', b: 'Ti', element: 'Feeling / Thinking',
    note: 'The state of the shared field against a private standard of coherence. Keeping the room intact and saying the precise true thing frequently conflict.' },
];

export const TYPES = [
  'ISTJ', 'ISFJ', 'INFJ', 'INTJ', 'ISTP', 'ISFP', 'INFP', 'INTP',
  'ESTP', 'ESFP', 'ENFP', 'ENTP', 'ESTJ', 'ESFJ', 'ENFJ', 'ENTJ',
];

/**
 * The eight positions, derived from the four letters.
 *   J puts the JUDGING function in the extraverted seat, P the perceiving one,
 *   which fixes both attitudes at once; an extravert then leads with their
 *   extraverted function and an introvert with their introverted one.
 *   Tertiary is the opposite of the auxiliary, inferior the opposite of the
 *   dominant, and Beebe's shadow half is the conscious half attitude-flipped.
 * @returns {string[]} eight function names, positions 1–8
 */
export function stackOf(type) {
  const [ei, sn, tf, jp] = type.split('');
  const perceiving = sn === 'S' ? 'S' : 'N';
  const judging = tf === 'T' ? 'T' : 'F';
  const extraverted = jp === 'J' ? judging + 'e' : perceiving + 'e';
  const introverted = jp === 'J' ? perceiving + 'i' : judging + 'i';
  const dom = ei === 'E' ? extraverted : introverted;
  const aux = ei === 'E' ? introverted : extraverted;
  const conscious = [dom, aux, OPPOSITE[aux], OPPOSITE[dom]];
  return conscious.concat(conscious.map((f) => FLIP[f]));
}

/** Beebe's eight archetypal positions. Names follow *Energies and Patterns
    in Psychological Type* (2017); the site's stack rail uses these already. */
export const ARCHETYPES = [
  { n: 1, key: 'hero',      name: 'Hero / Heroine',    short: 'Hero',            shadow: false,
    gist: 'The function you lead with and trust. Effortless, tireless by comparison with the rest, and so much a part of you that it is hard to see as a choice.' },
  { n: 2, key: 'parent',    name: 'Good Parent',       short: 'Parent',          shadow: false,
    gist: 'Used in support of others and of the dominant. The balancing function — it faces the opposite direction from the hero, which is exactly why it steadies it.' },
  { n: 3, key: 'child',     name: 'Eternal Child',     short: 'Eternal Child',   shadow: false,
    gist: 'Playful, enthusiastic, easily wounded. Genuinely enjoyable to use and not durable under load — hence "affordable in bursts".' },
  { n: 4, key: 'anima',     name: 'Anima / Animus',    short: 'Aspirational',    shadow: false,
    gist: 'The inferior. Undeveloped, idealised, and the doorway to the unconscious — it carries both the grip and, over a life, the direction of growth.' },
  { n: 5, key: 'opposing',  name: 'Opposing Personality', short: 'Opposing',     shadow: true,
    gist: 'The dominant with its attitude flipped. Shows up as stubbornness, contrariness, a refusal that feels justified from inside and obstructive from outside.' },
  { n: 6, key: 'senex',     name: 'Senex / Witch',     short: 'Critical Parent', shadow: true,
    gist: 'The auxiliary soured. Where the parent supported, this belittles — a harsh, withholding, shaming voice, aimed inward or out.' },
  { n: 7, key: 'trickster', name: 'Trickster',         short: 'Trickster',       shadow: true,
    gist: 'The child turned deceptive. Produces double binds and reasoning that is airtight from the inside and collapses the moment anyone examines it.' },
  { n: 8, key: 'demon',     name: 'Demon / Daimon',    short: 'Demon',           shadow: true,
    gist: 'The least accessible thing in the psyche. Destructive when it erupts — and, in Beebe\'s reading, capable of becoming daimonic rather than demonic if it is ever integrated.' },
];

/* ---------- the grip: what erupts when the dominant is spent ----------
   Keyed by DOMINANT function; the text describes the eruption of that
   function's opposite, which is the type's inferior. Quenk's patterns. */
export const GRIP = {
  ne: { inferior: 'Si', types: 'ENFP · ENTP',
        text: 'Obsessive body-checking and rigid, catastrophising attention to detail — a person who lived on possibility suddenly certain something is physically wrong, and unable to be talked out of it.' },
  ni: { inferior: 'Se', types: 'INFJ · INTJ',
        text: 'A blowout into raw sensation: overeating, overspending, overdriving, compulsive physical activity — the visionary abruptly living entirely inside the next ten minutes.' },
  se: { inferior: 'Ni', types: 'ESTP · ESFP',
        text: 'Dark, certain, catastrophic foresight. A doom-narrative arrives whole and feels like revelation, from someone who normally never looks past tonight.' },
  si: { inferior: 'Ne', types: 'ISTJ · ISFJ',
        text: 'Flooding, catastrophic possibility — the careful one spiralling through every terrible thing that could conceivably happen next, each one vivid and none of them checked.' },
  te: { inferior: 'Fi', types: 'ESTJ · ENTJ',
        text: 'A flood of unarticulated personal value: a sudden, uncharacteristic, badly-timed statement about what actually matters to them, often alongside a conviction of being deeply unappreciated.' },
  ti: { inferior: 'Fe', types: 'ISTP · INTP',
        text: 'An abrupt, raw, badly-calibrated need to know they are wanted here — hypersensitivity to belonging, from someone who spent the week explaining that social convention is arbitrary.' },
  fe: { inferior: 'Ti', types: 'ESFJ · ENFJ',
        text: 'Cold, absolute, sputtering logic. Withdrawal into rigid principle and cutting people off with a rule — "I\'m just being rational" from someone who has never once been just being rational.' },
  fi: { inferior: 'Te', types: 'INFP · ISFP',
        text: 'Brittle, frantic competence: reorganising, listing, executing, correcting everyone\'s inefficiency — anything with a measurable output, done badly and fast.' },
};

/* ---------- the loop: dominant running on tertiary, auxiliary dropped ----------
   Keyed by type, because the pair that loops is the type's own dom+tert.
   Note the shape every entry shares: both functions face the SAME direction,
   so nothing in the pair can contradict it. */
export const LOOPS = {
  ISTJ: { pair: 'Si → Fi', text: 'Precedent and private grievance, with nothing extraverted to test either. Old slights are re-filed as fresh evidence and the ledger only ever grows.' },
  ISFJ: { pair: 'Si → Ti', text: 'The stored record analysed in private. Endless internal litigation of what happened and who was at fault, with the actual people never consulted.' },
  INFJ: { pair: 'Ni → Ti', text: 'A single conviction, then a private proof of it. The perception arrives whole and the analysis is recruited to defend rather than test it; no one is asked.' },
  INTJ: { pair: 'Ni → Fi', text: 'Vision fused to personal grievance. The plan becomes a matter of principle and disagreement becomes betrayal, with no external check on either.' },
  ISTP: { pair: 'Ti → Ni', text: 'Analysis chasing a private forecast. The model gets deeper and more certain while contact with the actual situation thins out to nothing.' },
  ISFP: { pair: 'Fi → Ni', text: 'Inner value fused to a bleak forecast. The feeling is real, the story it grows into is unfalsifiable, and neither meets the world.' },
  INFP: { pair: 'Fi → Si', text: 'Value tested only against remembered wounds. Every present situation is matched to an old one, and the old one always wins.' },
  INTP: { pair: 'Ti → Si', text: 'The framework re-derived from stored precedent. Refinement without input — an internally immaculate model that has stopped touching anything.' },
  ESTP: { pair: 'Se → Fe', text: 'Impact plus the room\'s reaction, with no private standard in between. Escalating performance, each move calibrated to the response the last one got.' },
  ESFP: { pair: 'Se → Te', text: 'Immediate experience plus visible execution. Frantic productive motion — a great deal being done, none of it weighed against what it is for.' },
  ENFP: { pair: 'Ne → Te', text: 'Possibility plus immediate execution. Everything starts, nothing is valued, and the person builds a life full of projects they do not actually want.' },
  ENTP: { pair: 'Ne → Fe', text: 'Possibility plus the room\'s reaction. Ideas generated for effect and argued for the pleasure of the exchange, with no private standard deciding which are true.' },
  ESTJ: { pair: 'Te → Ne', text: 'Execution plus proliferating contingency. Structure thrown at every branching what-if, generating more work than the original problem contained.' },
  ESFJ: { pair: 'Fe → Ne', text: 'Conducting toward people who are not in the room. What they might be thinking, what that message might have meant — full effort, no coupling.' },
  ENFJ: { pair: 'Fe → Se', text: 'Harmony managed by immediate impression. Reading whoever is loudest right now and working the surface of the room, faster and faster and less and less accurately.' },
  ENTJ: { pair: 'Te → Se', text: 'Execution plus raw immediacy. Decisive action at increasing speed on progressively less information, with nothing internal slowing it down.' },
};

/** Convenience: everything a page needs about one type. */
export function profile(type) {
  const stack = stackOf(type);
  const domKey = stack[0].toLowerCase();
  return {
    type,
    stack,
    conscious: stack.slice(0, 4),
    shadow: stack.slice(4),
    dominant: stack[0], auxiliary: stack[1], tertiary: stack[2], inferior: stack[3],
    grip: GRIP[domKey],
    loop: LOOPS[type],
  };
}

/* ---------- provenance ----------
   Four sources, very different evidential standing. The site says what it is
   standing on rather than flattening it all into one confident voice. */
export const SOURCES = {
  jung: { label: 'Jung', tone: 'origin',
          note: 'From Jung\'s own writing — Psychological Types (1921) and the later work on compensation and the unconscious.' },
  myers: { label: 'Myers', tone: 'classical',
           note: 'From Isabel Myers and the MBTI tradition built on Jung, including the official type-development literature.' },
  quenk: { label: 'Quenk', tone: 'clinical',
           note: 'From Naomi Quenk\'s clinical work on the inferior function — In the Grip and Was That Really Me? — where the per-type patterns are documented.' },
  beebe: { label: 'Beebe', tone: 'clinical',
           note: 'From John Beebe\'s archetypal eight-function model, developed across decades of analytic practice and collected in Energies and Patterns in Psychological Type (2017).' },
  grant: { label: 'Grant model', tone: 'derived',
           note: 'From the Harold Grant function-order model, which fixes tertiary attitude. Widely used, and not something Jung or Myers committed to.' },
  community: { label: 'Community', tone: 'folk',
               note: 'Emerged from the online typology community rather than from any published clinical source. Useful vocabulary; treat as folk theory, not findings.' },
};
