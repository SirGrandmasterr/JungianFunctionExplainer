/* ============================================================
   CURRENTS · Scenario — The Offer
   No audience, no clock beyond a deadline, nothing to react to.
   The deck's counterweight to Flashpoint: here the interior does
   all the work, which is why the Briefing changes the outcome
   more than the type does.
   ============================================================ */

export const THE_OFFER = {
  id: 'the-offer',
  title: 'The Offer',
  blurb: 'A better job in a city you have never lived in. Forty-eight hours.',
  vignette:
    'The offer is real, the money is materially better, and the work is the kind you said you wanted. ' +
    'It is nine hundred kilometres from everyone you know. They need an answer by Friday.',

  surface: {
    se: { intensity: 0.10, urgency: 0.45, affordances: ['visit the city', 'call them back', 'sleep on it'] },
    ne: { ambiguity: 0.85, possibilities: ['a whole other life', 'a mistake with a lease attached', 'leverage where you are'] },
    te: { stakes: 0.70, metric: 'salary, title, and two years of trajectory', resources: ['the contract', 'a spreadsheet', 'three people who have done it'] },
    fe: { audience: 0, tone: 'private', expectation: '' },
  },

  interior: {
    si: { familiarity: 'unprecedented', precedent: 'never moved further than across town' },
    ni: { trajectory: 'foreseen', note: 'this is the shape the last two years were pointing at' },
    ti: { modelFit: 'consistent', axiom: 'take the work that compounds' },
    fi: { valence: 0.35, value: 'not shrinking my own life' },
  },

  gates: {
    si: { 'familiar-good': 0.7, 'familiar-bad': 1.2, unprecedented: 1.7 },
    ni: { foreseen: 0.65, blindside: 1.5 },
    ti: { consistent: 0.8, contradiction: 1.25 },
    fi: { 'rings-true': 0.75, neutral: 1.0, 'rings-false': 1.5 },
    se: 1.35,        /* nothing to touch, nothing happening — Se runs on empty */
    ne: 0.8,
    te: 0.85,
  },

  affinity: { ni: 1.5, ne: 1.4, se: 0.4, fe: 0.4 },

  actions: [
    {
      id: 'take-it',
      label: 'Take it. Answer tonight',
      detail: 'The decision is already made; the next two days would only be furniture.',
      signature: { ni: 0.4, te: 0.35, fi: 0.25 },
      intensity: 0.7,
      mandates: { serves: ['ni.trajectory', 'te.stakes', 'fi.value'] },
      outcome: 'Sent. The relief and the vertigo arrive in the same minute.',
    },
    {
      id: 'model-it',
      label: 'Build the case before deciding',
      detail: 'Cost of living, the two-year picture, three calls to people who have done it.',
      signature: { te: 0.45, ti: 0.3, si: 0.25 },
      intensity: 0.55,
      mandates: { serves: ['te.stakes'], defers: ['fi.value'] },
      outcome: 'By Thursday there is a defensible answer, and it is the one you already felt on Tuesday.',
    },
    {
      id: 'go-look',
      label: 'Fly out and walk the streets',
      detail: 'You cannot decide about a place you have not stood in.',
      signature: { se: 0.5, si: 0.3, fi: 0.2 },
      intensity: 0.6,
      mandates: { serves: ['fi.value'], defers: ['te.stakes'] },
      outcome: 'Two days of weather, noise, and a coffee shop. You come back knowing something no spreadsheet held.',
    },
    {
      id: 'decline',
      label: 'Decline, and stay',
      detail: 'The life you have is not a rough draft of a better one.',
      signature: { si: 0.45, fi: 0.35, ti: 0.2 },
      intensity: 0.5,
      mandates: { serves: ['si.precedent'], defies: ['ni.trajectory', 'te.stakes'] },
      outcome: 'Everything stays exactly where it is. That is the whole of what happens, and it is not nothing.',
    },
  ],

  monologue: {
    ne: { base: 'There is a version of me that lives there. There are four. One of them is much happier and one of them is renting alone in February — and honestly, could this be leverage here instead?' },
    ni: {
      foreseen: 'This is the shape the last two years were pointing at. I have known this was coming since roughly March, and I know what happens if I do not take it.',
      blindside: 'Nothing was pointing here. The whole picture has to be rebuilt around a thing I did not model.',
    },
    se: { base: 'I have never stood on that street. I do not know what the light is like or how far the walk is. None of this is real yet.' },
    si: {
      unprecedented: 'Nothing in the record covers this. Everything I know about being all right somewhere is about *here*, and none of it transfers.',
      'familiar-good': 'I have started over before and it went fine. There is a file for this and the file is reassuring.',
      'familiar-bad': 'I have done a version of this. It cost more than the offer letter said it would.',
    },
    te: { base: 'Materially better on salary, title, and two-year trajectory. The counterfactual is measurable and it is not close.' },
    ti: {
      consistent: 'Take the work that compounds. That principle has survived every test I have put it through, and it says go.',
      contradiction: 'The principle that says go and the principle that says do not uproot what works are both mine, and they cannot both be right.',
    },
    fe: { base: 'Everyone will say they are happy for me. Three of them will mean something more complicated, and one will say it first and loudest.' },
    fi: {
      'rings-true': 'This is the not-shrinking option. That matters more to me than the money and I am not going to pretend otherwise.',
      neutral: 'I genuinely cannot tell. Which is itself unusual, and worth sitting with.',
      'rings-false': 'Something in this is wrong and I cannot yet say what. It is not the city and it is not the money.',
    },
  },
};
