/* ============================================================
   CURRENTS · Scenario — The Long Wait
   Flashpoint's exact inverse. There, everything happens in two
   seconds and Se is the cheapest function on the board. Here
   nothing happens for four hours and Se has nowhere to put
   itself — the same function, starved instead of fed, and the
   bill is the argument. Ni leads, because Ni is the only one
   with anything to do when there is nothing to do.
   ============================================================ */

export const LONG_WAIT = {
  id: 'long-wait',
  title: 'The Long Wait',
  blurb: 'A corridor, two plastic chairs, and no news for four hours.',
  vignette:
    'She went in at eleven. It is quarter past three. The corridor has two chairs, a vending machine that takes cards, ' +
    'and a set of doors nobody comes through. Her brother is in the other chair and has not spoken since one.',

  surface: {
    se: { intensity: 0.06, urgency: 0.05, affordances: ['the corridor', 'the vending machine', 'the doors'] },
    ne: { ambiguity: 0.60, possibilities: ['routine and slow', 'complicated and slow', 'they have simply forgotten to come out'] },
    te: { stakes: 0.35, metric: 'nothing you can move', resources: ['a phone at 40%', 'a desk nobody is at'] },
    fe: { audience: 1, tone: 'held-together', expectation: 'do not make it worse' },
  },

  interior: {
    si: { familiarity: 'familiar-bad', precedent: 'the last corridor, four years ago, and how that one ended' },
    ni: { trajectory: 'foreseen', note: 'the shape of the next year has two versions and one of them starts through those doors' },
    ti: { modelFit: 'consistent', axiom: 'no information is not the same as bad information' },
    fi: { valence: -0.7, value: 'staying' },
  },

  gates: {
    si: { 'familiar-good': 0.85, 'familiar-bad': 1.45, unprecedented: 1.3 },
    ni: { foreseen: 0.75, blindside: 1.3 },
    ti: { consistent: 0.9, contradiction: 1.3 },
    fi: { 'rings-true': 0.9, neutral: 1.1, 'rings-false': 1.55 },
    se: 1.75,        /* four hours of nothing to register — the harshest gate in the deck */
    ne: 1.4,         /* every branch here is a catastrophe; branching is not a gift today */
    te: 1.55,        /* nothing is actionable and Te has no off switch */
    fe: 0.9,
  },

  affinity: { ni: 1.4, si: 1.3, fi: 1.25, se: 0.3, te: 0.4, ne: 0.5 },

  actions: [
    {
      id: 'sit-with-him',
      label: 'Say nothing, and stay next to him',
      detail: 'No reassurance, no plan. Just the second chair, occupied.',
      signature: { fi: 0.35, fe: 0.3, ni: 0.2, si: 0.15 },
      intensity: 0.35,
      mandates: { serves: ['fi.value', 'fe.expectation'], defers: ['te.stakes'] },
      outcome: 'Neither of you says anything for another hour. Afterwards, it is the part he remembers.',
    },
    {
      id: 'find-someone',
      label: 'Find a nurse and ask for anything at all',
      detail: 'A time, a name, a reason for the wait. Any fact with an edge.',
      signature: { te: 0.5, se: 0.25, ne: 0.25 },
      intensity: 0.55,
      mandates: { serves: ['te.metric', 'se.urgency'], defies: ['fe.expectation'] },
      outcome: 'Someone kind tells you they will check, and does not come back. You now have the same nothing, plus a small resentment.',
    },
    {
      id: 'walk-it-off',
      label: 'Walk the corridor. Get a coffee you do not want.',
      detail: 'Movement for its own sake, because the body has been still for four hours.',
      signature: { se: 0.6, si: 0.25, ne: 0.15 },
      intensity: 0.4,
      mandates: { serves: ['se.urgency'], defers: ['fe.expectation'] },
      outcome: 'Eleven minutes. The corridor is exactly as long on the way back. Your hands are steadier and nothing else has changed.',
    },
    {
      id: 'run-it-forward',
      label: 'Work out what you will do in each case',
      detail: 'Both versions. Who you call, what you say, where you sleep.',
      signature: { ni: 0.6, ti: 0.25, te: 0.15 },
      intensity: 0.6,
      mandates: { serves: ['ni.trajectory'], defies: ['fi.value'] },
      outcome: 'You have a plan for both. You have also lived the worse one in some detail, an hour before anyone told you anything.',
    },
    {
      id: 'phone-out',
      label: 'Go through your phone until something happens',
      detail: 'Anything with a scroll bar. The battery is at forty per cent and this is what it is for.',
      /* a corridor where nothing happens should not carry the deck's highest
         Se demand — starving a function is an ABSENCE of work for it, not a
         high price on work it still gets to do */
      signature: { ne: 0.45, se: 0.25, si: 0.3 },
      intensity: 0.25,
      mandates: { defers: ['fi.value', 'ni.trajectory'] },
      outcome: 'Forty minutes vanish and you could not name one thing you saw. Your brother notices, and does not mention it.',
    },
  ],

  monologue: {
    ne: { base: 'It could be routine and slow. It could be that the list ran long. It could be the other thing — and once that one is in the room it will not leave, and it brings six friends.' },
    ni: {
      foreseen: 'There are two versions of next year and they fork through those doors. I have known the shape of both since about one o’clock.',
      blindside: 'This morning had no version of this afternoon in it. The whole picture is being rebuilt in a corridor.',
    },
    se: { base: 'Strip light, one flickering. A vending machine humming. Four hours of a world that will not give me anything to do with my hands.' },
    si: {
      'familiar-bad': 'I know this corridor. Not this one — the other one, four years ago, same chairs. My body got here before I did.',
      'familiar-good': 'Waits like this have ended fine before. That is a real fact and I am going to hold onto it.',
      unprecedented: 'I have never done this. There is no version of me that has sat in this chair, and I do not know what I am supposed to do with my face.',
    },
    te: { base: 'There is no lever. Nothing here responds to effort, and I have four hours of capacity and no object to point it at.' },
    ti: {
      consistent: 'No information is not bad information. Long waits are consistent with complexity, not only with disaster. The distinction holds and I am going to keep holding it.',
      contradiction: 'They said two hours. It has been four. Either the estimate was wrong or something changed, and both of those mean the model I was given is not the model I have.',
    },
    fe: { base: 'He has not spoken since one. Whatever I do next either makes this corridor bearable for him or it does not, and there is no third option.' },
    fi: {
      'rings-false': 'I should not be angry at a corridor. I am angry at the corridor. I am not going to be talked out of it and I am not going to say it out loud.',
      neutral: 'I am here. That is the entire content of what I have to offer and it will have to be enough.',
      'rings-true': 'This is where I am supposed to be. Of all the things that are wrong right now, my being in this chair is not one of them.',
    },
  },
};
