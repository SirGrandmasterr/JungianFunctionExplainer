/* ============================================================
   CURRENTS · Scenario — The Ridge
   Flashpoint's long-form counterpart. Both are Se scenarios and
   they are not remotely the same problem: there the window is
   two seconds and reaction is everything; here it is ninety
   minutes of continuous physical judgement, and Se has to
   sustain rather than fire. Si becomes load-bearing, and the
   scenario is where the deck proves that "sensory" is not one
   thing.
   ============================================================ */

export const THE_RIDGE = {
  id: 'the-ridge',
  title: 'The Ridge',
  blurb: 'Ninety minutes of light left, and the path down is not the path up.',
  vignette:
    'You are higher and later than you meant to be. The ridge goes on for another hour, the light goes in ninety minutes, ' +
    'and the map shows a steeper way down that would save forty of those. One of the three of you is limping.',

  surface: {
    se: { intensity: 0.85, urgency: 0.65, affordances: ['the ridge line', 'the steep descent', 'a phone with one bar', 'the limp'] },
    ne: { ambiguity: 0.30, possibilities: ['the long safe way', 'the short unknown way', 'stop and sit it out'] },
    te: { stakes: 0.80, metric: 'off the mountain before dark, all three', resources: ['ninety minutes', 'a map', 'one head torch'] },
    fe: { audience: 2, tone: 'quiet-and-tiring', expectation: 'be the one who knows' },
  },

  interior: {
    si: { familiarity: 'familiar-good', precedent: 'twenty years of hills, and the two times it went wrong' },
    ni: { trajectory: 'foreseen', note: 'the limp gets worse, not better; every plan has to survive that' },
    ti: { modelFit: 'consistent', axiom: 'you do not descend unknown ground in the dark' },
    fi: { valence: 0.30, value: 'all three' },
  },

  gates: {
    si: { 'familiar-good': 0.6, 'familiar-bad': 1.0, unprecedented: 1.55 },
    ni: { foreseen: 0.75, blindside: 1.35 },
    ti: { consistent: 0.8, contradiction: 1.2 },
    fi: { 'rings-true': 0.8, neutral: 1.05, 'rings-false': 1.4 },
    se: 0.65,        /* real ground, real light, real consequence — Se is fed and cheap */
    ne: 1.55,        /* speculation costs daylight, and daylight is the constraint */
    te: 0.8,
    fe: 1.3,
  },

  affinity: { se: 1.65, si: 1.45, te: 1.2, ti: 1.05, ne: 0.35, fe: 0.55 },

  actions: [
    {
      id: 'long-way-now',
      label: 'Commit to the long way and set the pace',
      detail: 'An hour of known ground, in the dark for the last twenty minutes, at the limp’s speed.',
      signature: { si: 0.4, te: 0.3, se: 0.3 },
      intensity: 0.65,
      mandates: { serves: ['ti.axiom', 'si.precedent', 'fi.value'], defers: ['se.urgency'] },
      outcome: 'You are off by full dark, forty minutes later than anyone wanted, and every one of those minutes was boring. That is the whole aim.',
    },
    {
      id: 'take-the-steep',
      label: 'Take the steep line while there is still light',
      detail: 'Forty minutes saved, on ground none of you has walked, with a bad ankle.',
      signature: { se: 0.5, ni: 0.3, te: 0.2 },
      intensity: 0.85,
      mandates: { serves: ['te.metric', 'se.urgency'], defies: ['ti.axiom'] },
      outcome: 'It goes fine for thirty minutes. The last ten are the ten you will describe to people for years, in a voice you will not be able to keep flat.',
    },
    {
      id: 'stop-and-shelter',
      label: 'Stop now and sit it out until morning',
      detail: 'Nobody is hurt yet. Cold is survivable; a fall at dusk on scree is not.',
      signature: { ti: 0.4, si: 0.35, fi: 0.25 },
      intensity: 0.5,
      mandates: { serves: ['ti.axiom', 'fi.value'], defies: ['te.metric', 'fe.expectation'] },
      outcome: 'A long, cold, entirely uneventful night. In the morning it is obviously the right call and at nine at night it was not obvious at all.',
    },
    {
      id: 'split-the-party',
      label: 'Send the fast pair ahead for help',
      detail: 'Two down before dark, one waits with the light. Half the problem solved twice as fast.',
      signature: { te: 0.45, ne: 0.3, fe: 0.25 },
      intensity: 0.7,
      mandates: { serves: ['te.metric'], defies: ['fi.value', 'si.precedent'] },
      outcome: 'It works, and for fifty minutes there is a person alone on a ridge in the dark, which is the part nobody mentions afterwards.',
    },
    {
      id: 'keep-walking',
      label: 'Say nothing and keep moving',
      detail: 'Do not raise it. Nobody has asked yet, and asking makes it real.',
      signature: { se: 0.4, si: 0.35, ni: 0.25 },
      intensity: 0.3,
      mandates: { defers: ['te.stakes', 'fe.expectation'] },
      outcome: 'Twenty-five minutes go by. The decision is now smaller, worse, and being made by the light instead of by you.',
    },
  ],

  monologue: {
    ne: { base: 'There is a version where the steep line is a path and a version where it is a scree chute with a drop in it, and standing here generating versions is costing daylight.' },
    ni: {
      foreseen: 'The limp gets worse. It has been getting worse for an hour. Any plan that assumes the current pace is already wrong.',
      blindside: 'I had us down by seven. I do not know when that stopped being true and that worries me more than the light does.',
    },
    se: { base: 'Wind picking up off the left shoulder. Loose rock underfoot for the last two hundred metres. The sun is on the far ridge and the far ridge is not far.' },
    si: {
      'familiar-good': 'I know this ground. Twenty years of it. My legs know how long that ridge takes better than the map does.',
      'familiar-bad': 'This is how the Cairngorms went. Same light, same optimism about the short way. I have the whole thing on file and it cost us a night.',
      unprecedented: 'I have never been out this late up here. I do not have a body-memory for what this ground is like without sun on it.',
    },
    te: { base: 'Three people, ninety minutes, one torch. Off the mountain before dark is the objective and everything else is a preference.' },
    ti: {
      consistent: 'You do not descend unknown ground in the dark. That rule was built out of other people’s accidents and it has never once been wrong.',
      contradiction: 'The safe option gets us down in the dark and the fast option gets us down in the light. The rule I trust is telling me to choose more darkness, which cannot be right, and yet.',
    },
    fe: { base: 'Neither of them will say they are frightened. Both of them are waiting for me to sound certain, and sounding certain is a thing I can do whether or not I am.' },
    fi: {
      'rings-true': 'All three of us. That is the only version of tonight I am prepared to be part of, and it settles most of the argument before it starts.',
      neutral: 'It is a hill. We are competent. Let us not make it a story.',
      'rings-false': 'I got us up here late and I have been performing calm about it for an hour, and both of those are mine.',
    },
  },
};
