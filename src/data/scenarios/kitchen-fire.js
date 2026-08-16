/* ============================================================
   CURRENTS · Scenario — Flashpoint
   A sensory emergency with an audience. Two seconds of real time.
   The deck's stress-test for the claim that stack position
   decides *when* you arrive, not whether you can act: an
   Se-dominant is already moving; an Se-inferior is still
   deciding, and the window is measured in hundreds of
   milliseconds.
   ============================================================ */

export const KITCHEN_FIRE = {
  id: 'kitchen-fire',
  title: 'Flashpoint',
  blurb: 'The pan catches. Six people at the table. Two seconds.',
  vignette:
    'Dinner for six. The oil in the pan goes from shimmering to alight in under a second, and the flame is ' +
    'climbing toward a cupboard. Someone is already reaching for a glass of water.',

  surface: {
    se: { intensity: 0.95, urgency: 0.98, affordances: ['lid', 'the gas tap', 'baking soda', 'move people back'] },
    ne: { ambiguity: 0.15, possibilities: ['grease fire, not a water fire'] },
    te: { stakes: 0.65, metric: 'nobody hurt, kitchen intact', resources: ['a lid', 'the extinguisher in the hall'] },
    fe: { audience: 6, tone: 'startled', expectation: 'somebody take charge' },
  },

  interior: {
    si: { familiarity: 'unprecedented', precedent: 'never had a fire in this kitchen' },
    ni: { trajectory: 'blindside', note: 'no part of the evening pointed here' },
    ti: { modelFit: 'consistent', axiom: 'water on burning oil spreads it' },
    fi: { valence: 0.2, value: 'nobody gets hurt on my watch' },
  },

  gates: {
    si: { 'familiar-good': 0.7, 'familiar-bad': 1.1, unprecedented: 1.6 },
    ni: { foreseen: 0.7, blindside: 1.5 },
    ti: { consistent: 0.8, contradiction: 1.2 },
    fi: { 'rings-true': 0.85, neutral: 1.0, 'rings-false': 1.3 },
    se: 0.8,          /* a loud world is what Se eats — even cheaper than idle */
    ne: 1.3,          /* nothing here is hypothetical; speculation is dead weight */
    fe: 1.1,
  },

  affinity: { se: 1.6, ne: 0.5, si: 0.8 },

  actions: [
    {
      id: 'lid-on',
      label: 'Lid on the pan, gas off',
      detail: 'The correct move, executed in the window it exists in.',
      signature: { se: 0.7, te: 0.3 },
      intensity: 0.8,
      mandates: { serves: ['te.stakes', 'fi.safety'] },
      outcome: 'Out in four seconds. The room exhales. Someone laughs, badly.',
    },
    {
      id: 'stop-the-water',
      label: 'Stop the person with the glass — first',
      detail: 'The fire is not the fastest-moving danger in the room.',
      signature: { se: 0.4, fe: 0.35, ti: 0.25 },
      intensity: 0.75,
      mandates: { serves: ['fi.safety'], defers: ['te.stakes'] },
      outcome: 'The glass never lands. The fire burns four seconds longer, and nothing catches.',
    },
    {
      id: 'clear-the-room',
      label: 'Get everyone back and call it',
      detail: 'Do not fight it. Move people, shut the door, escalate.',
      signature: { fe: 0.4, te: 0.35, ni: 0.25 },
      intensity: 0.6,
      mandates: { serves: ['fe.expectation', 'fi.safety'] },
      outcome: 'Overkill, and nobody minds. The kitchen takes the damage instead of a person.',
    },
    {
      id: 'freeze',
      label: 'Freeze — a half-second of nothing',
      detail: 'The read has not resolved yet. The body has not been given an instruction.',
      signature: { si: 0.5, ti: 0.3, ne: 0.2 },
      intensity: 0.35,
      mandates: { defies: ['te.stakes'] },
      outcome: 'Someone else moves first. Afterwards you can describe exactly what you saw, and exactly what you did not do.',
    },
  ],

  monologue: {
    se: { base: 'Flame at the rim, climbing left, cupboard is nine inches away. The lid is by the sink. Hand is already moving.' },
    si: {
      unprecedented: 'Nothing matches this. No file, no drill, no memory of what a kitchen fire even sounds like.',
      'familiar-bad': 'This is the smell from the flat in 2019. I know exactly how this goes and I do not want it.',
      'familiar-good': 'Fires in pans go out under lids. I have done this. Hands know it.',
    },
    ne: { base: 'Grease, not water — if that glass lands this becomes a much larger evening. Also: is the extinguisher the expired one?' },
    ni: {
      blindside: 'Nothing in the last hour pointed at this. The evening just changed shape and I am behind it.',
      foreseen: 'That pan has been too hot for four minutes. This was the next thing that was going to happen.',
    },
    te: { base: 'Two objectives, ranked: nobody burned, then nothing else catches. Lid, gas, door. In that order.' },
    ti: {
      consistent: 'Water on burning oil spreads it — that is not a rule of thumb, it is the physics. The glass is the actual emergency.',
      contradiction: 'Something is off about how fast this went up. That was not ordinary cooking oil.',
    },
    fe: { base: 'Six people just went quiet in the same half-second. Whoever speaks next sets the temperature for the whole room.' },
    fi: {
      'rings-true': 'Not on my watch. Not with these people in this room.',
      neutral: 'Handle it. Feelings later.',
      'rings-false': 'I told them that pan was wrong. There is a small ugly part of me that wants this to be someone’s lesson.',
    },
  },
};
