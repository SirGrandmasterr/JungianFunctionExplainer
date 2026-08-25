/* ============================================================
   CURRENTS · Scenario — The Deadline That Moved
   Te's scenario. Real stakes, real resources, a clock you can
   see, and five people who will do whatever is decided in the
   next twenty minutes. Everything here is measurable, which is
   exactly what makes it expensive for the functions that do not
   measure — Fi has no room and Ne's branches are all too slow.
   ============================================================ */

export const DEADLINE_MOVED = {
  id: 'deadline-moved',
  title: 'The Deadline That Moved',
  blurb: 'Six weeks became three. The plan on the wall is now fiction.',
  vignette:
    'The client moved the date and did not ask. Six weeks of plan is now three weeks of plan, the wall chart is wrong ' +
    'in every column, and five people are looking at you because somebody has to say what happens next.',

  surface: {
    se: { intensity: 0.55, urgency: 0.85, affordances: ['the wall chart', 'the room', 'the next twenty minutes'] },
    ne: { ambiguity: 0.35, possibilities: ['cut scope', 'add people', 'move the date back', 'ship it broken'] },
    te: { stakes: 0.95, metric: 'what ships on the 14th, and what does not', resources: ['five people', 'three weeks', 'a client who moved once'] },
    fe: { audience: 5, tone: 'tense-attentive', expectation: 'decide, so we can start' },
  },

  interior: {
    si: { familiarity: 'familiar-bad', precedent: 'the last compression, and the two people who left after it' },
    ni: { trajectory: 'foreseen', note: 'whatever gets cut now is what the whole project is remembered for' },
    ti: { modelFit: 'consistent', axiom: 'scope, time, people — you may fix two' },
    fi: { valence: -0.35, value: 'not burning people' },
  },

  gates: {
    si: { 'familiar-good': 0.75, 'familiar-bad': 1.1, unprecedented: 1.45 },
    ni: { foreseen: 0.7, blindside: 1.4 },
    ti: { consistent: 0.85, contradiction: 1.25 },
    fi: { 'rings-true': 0.9, neutral: 1.15, 'rings-false': 1.5 },
    se: 0.85,
    ne: 1.45,        /* every branch takes longer to explore than the room has */
    te: 0.6,         /* measurable stakes, real resources — Te has never been cheaper */
    fe: 1.05,
  },

  affinity: { te: 1.6, se: 1.2, ti: 1.15, ne: 0.45, fi: 0.55 },

  actions: [
    {
      id: 'cut-scope-now',
      label: 'Cut scope, in the room, out loud',
      detail: 'Name the three things that are not shipping. Take the argument now rather than on the 13th.',
      signature: { te: 0.5, ti: 0.3, se: 0.2 },
      intensity: 0.75,
      mandates: { serves: ['te.metric', 'ti.axiom'], defies: ['fe.expectation'] },
      outcome: 'Two people disagree loudly and one of them is right. By six there is a plan that fits, and it is smaller than anyone wanted.',
    },
    {
      id: 'push-back',
      label: 'Refuse the date and say why',
      detail: 'Go back to the client with the arithmetic rather than the apology.',
      signature: { te: 0.4, fi: 0.3, ni: 0.3 },
      intensity: 0.7,
      mandates: { serves: ['fi.value', 'ti.axiom'], defies: ['fe.expectation'] },
      outcome: 'They hold the date. You have spent something you cannot get back, and everyone in that room saw you spend it for them.',
    },
    {
      id: 'absorb-it',
      label: 'Take the compression and protect the team from it',
      detail: 'Same scope, same date, and you personally eat the difference.',
      /* absorbing a compression is endurance before it is warmth — the Fe
         weighting here made the Te types the dearest in the Te scenario */
      signature: { si: 0.4, fe: 0.3, te: 0.3 },
      intensity: 0.65,
      mandates: { serves: ['fe.expectation', 'fi.value'], defies: ['ti.axiom', 'si.precedent'] },
      outcome: 'The room relaxes. Three weeks later you are the bottleneck in every column, and nobody can see why it is going badly.',
    },
    {
      id: 'buy-time',
      label: 'Ask for the afternoon before deciding',
      detail: 'Twenty minutes is not enough to re-plan six weeks. Nothing is improved by being fast and wrong.',
      signature: { ti: 0.4, si: 0.35, ni: 0.25 },
      intensity: 0.4,
      mandates: { serves: ['ni.trajectory'], defers: ['te.stakes', 'fe.expectation'] },
      outcome: 'You get the afternoon. The plan is better and five people spent a day not knowing what they were building.',
    },
    {
      id: 'say-nothing-yet',
      label: 'Let the room talk and do not steer it',
      detail: 'Five people, one problem. See what they arrive at before you put your weight anywhere.',
      signature: { fe: 0.45, ne: 0.3, ni: 0.25 },
      intensity: 0.35,
      mandates: { defers: ['te.stakes'], serves: ['fe.tone'] },
      outcome: 'They arrive somewhere close to right, twenty minutes later than you would have, and they own it in a way they would not have.',
    },
  ],

  monologue: {
    ne: { base: 'Cut scope, add people, move the date, ship it broken — and about four hybrids, one of which is probably good. None of them can be worked out at this speed.' },
    ni: {
      foreseen: 'Whatever we cut in the next twenty minutes is the thing this project gets remembered for. That was true before the client moved anything.',
      blindside: 'This date came from nowhere. Every model I had of the next six weeks is now describing a project that does not exist.',
    },
    se: { base: 'Five faces, a wall chart that is now wrong, and a room that has gone quiet in the particular way rooms go quiet when they are waiting for one person.' },
    si: {
      'familiar-bad': 'We did this in March. Two people left in April. I can name them and I can name the week it became inevitable.',
      'familiar-good': 'We have compressed before and it held. The team knows how to do this and the memory is a good one.',
      unprecedented: 'We have never had a date move this late. Nothing in the record tells me what three weeks does to this team.',
    },
    te: { base: 'Scope, time, people. Time is fixed and people are fixed, so scope moves — that is not an opinion, it is the only remaining degree of freedom.' },
    ti: {
      consistent: 'You may fix two of the three. They have fixed time and are implicitly fixing scope, which is not a plan, it is a wish with a date on it.',
      contradiction: 'They moved the date and kept the scope, and both of those were presented as constraints. Two constraints that cannot both hold are not constraints.',
    },
    fe: { base: 'Five people, all attentive, none of them arguing yet. Whatever gets said in the next minute sets whether this is a hard three weeks or a bitter one.' },
    fi: {
      'rings-false': 'We are about to spend people to cover somebody else’s change of mind, and I am going to be the one who says the sentence that does it.',
      neutral: 'It is a project. Projects compress. I do not have to have a feeling about it today.',
      'rings-true': 'Not this team, not again. Whatever else happens in this room, that part is not negotiable.',
    },
  },
};
