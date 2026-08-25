/* ============================================================
   CURRENTS · Scenario — The Handover
   The deck's epistemic problem. Nothing is on fire, nobody is
   watching, and the only thing standing between you and a
   working system is a model you do not yet have. Ti leads here
   the way Se leads in Flashpoint — and a Ti-inferior discovers
   that "just read the code" is not a free instruction.
   ============================================================ */

export const THE_HANDOVER = {
  id: 'the-handover',
  title: 'The Handover',
  blurb: 'Forty thousand lines, no documentation, and it fails every Tuesday.',
  vignette:
    'The person who built the billing service left three weeks ago. It fails most Tuesdays, always around 02:00, ' +
    'and the only note they left says “the retry logic is load-bearing.” Nobody else has opened it. It is yours now.',

  surface: {
    se: { intensity: 0.15, urgency: 0.25, affordances: ['run it locally', 'read the logs', 'page someone'] },
    ne: { ambiguity: 0.70, possibilities: ['a clock skew', 'a queue that never drains', 'something upstream lying'] },
    te: { stakes: 0.75, metric: 'failed invoices per week, and who gets paged', resources: ['three weeks of logs', 'a staging box', 'the commit history'] },
    fe: { audience: 2, tone: 'patient', expectation: 'tell us when it is safe' },
  },

  interior: {
    si: { familiarity: 'familiar-bad', precedent: 'the last inherited service took four months' },
    ni: { trajectory: 'foreseen', note: 'this becomes a rewrite; the only question is whether that is admitted now or in June' },
    ti: { modelFit: 'contradiction', axiom: 'you cannot fix what you cannot model' },
    fi: { valence: 0.15, value: 'craft' },
  },

  gates: {
    si: { 'familiar-good': 0.7, 'familiar-bad': 0.95, unprecedented: 1.5 },
    ni: { foreseen: 0.7, blindside: 1.4 },
    ti: { consistent: 0.75, contradiction: 0.9 },   /* a contradiction is Ti's food here, not its burden */
    fi: { 'rings-true': 0.85, neutral: 1.05, 'rings-false': 1.4 },
    se: 1.6,         /* nothing to touch, nothing moving — Se has no purchase at all */
    ne: 0.8,
    te: 0.85,
    fe: 1.55,        /* two patient people, days of silence, no room to read */
  },

  affinity: { ti: 1.7, ne: 1.3, ni: 1.2, te: 1.1, se: 0.3, fe: 0.35 },

  actions: [
    {
      id: 'build-the-model',
      label: 'Read it end to end before touching anything',
      detail: 'Two days with no output. A diagram at the end of it.',
      signature: { ti: 0.6, ni: 0.25, si: 0.15 },
      intensity: 0.6,
      mandates: { serves: ['ti.axiom'], defers: ['te.stakes', 'fe.expectation'] },
      outcome: 'On Thursday you can draw it on a whiteboard from memory. Nothing has shipped. You know exactly what is wrong.',
    },
    {
      id: 'instrument-it',
      label: 'Instrument it and wait for Tuesday',
      detail: 'Do not guess. Add logging where the guesses would go, and let the failure tell you.',
      /* instrumenting IS hypothesis-driven — you add logging exactly where
         the guesses would go, which is Ne doing the guessing */
      signature: { te: 0.4, ne: 0.3, se: 0.3 },
      intensity: 0.5,
      mandates: { serves: ['te.metric', 'ne.ambiguity'], defers: ['ni.trajectory'] },
      outcome: 'Tuesday, 02:04. The graph answers the question in eleven seconds. You lost a week to learn it in one line.',
    },
    {
      id: 'patch-the-symptom',
      label: 'Widen the retry window and move on',
      detail: 'It stops paging. You will find out later what it was actually doing.',
      signature: { te: 0.5, si: 0.3, se: 0.2 },
      intensity: 0.45,
      mandates: { serves: ['fe.expectation'], defies: ['ti.axiom', 'ni.trajectory'] },
      outcome: 'Tuesday passes quietly. So does the next one. In June something else fails and this is why.',
    },
    {
      id: 'declare-the-rewrite',
      label: 'Say out loud that it needs replacing',
      detail: 'Name the four months now, while it is still someone else’s decision to fund.',
      /* "craft" is the value this scenario turns on and it had no card of
         its own — saying the unwelcome thing early is where it does work */
      signature: { ni: 0.35, fi: 0.3, fe: 0.35 },
      intensity: 0.65,
      mandates: { serves: ['ni.trajectory', 'fi.value'], defies: ['si.precedent'] },
      outcome: 'It lands badly and it lands early, which is the only good way for it to land. Nobody thanks you until August.',
    },
    {
      id: 'sit-on-it',
      label: 'Say nothing yet. Keep reading.',
      detail: 'You do not know enough to be believed, and being wrong here is expensive.',
      signature: { ti: 0.4, si: 0.35, ni: 0.25 },
      intensity: 0.3,
      mandates: { defers: ['fe.expectation', 'te.stakes'] },
      outcome: 'Three more quiet days. The model gets better and the goodwill gets thinner, at roughly the same rate.',
    },
  ],

  monologue: {
    ne: { base: 'Clock skew? Queue depth? Something upstream returning 200 on a failure? There are six shapes this could be and four of them are testable before lunch.' },
    ni: {
      foreseen: 'This is a rewrite. It has been a rewrite since the day they left. Everything between now and admitting that is theatre with a budget.',
      blindside: 'I had this filed as a maintenance job. It is not a maintenance job and I do not yet know what it is instead.',
    },
    se: { base: 'A terminal, three weeks of logs, and a room where nothing is happening. There is nothing here to react to.' },
    si: {
      'familiar-bad': 'The last one of these took four months and cost me a summer. Every part of that memory is intact and it is not encouraging.',
      'familiar-good': 'I have inherited worse than this and it went fine. The shape is known even if the code is not.',
      unprecedented: 'I have never held something this undocumented. There is no file to open, which is itself the finding.',
    },
    te: { base: 'Failed invoices per week is the number. Everything else is interesting rather than important. Instrument first, then decide.' },
    ti: {
      contradiction: '“The retry logic is load-bearing” cannot be true as written — retries are supposed to be idempotent. Either the note is wrong or the system is, and I need to know which before I touch a line.',
      consistent: 'It behaves the way a queue with no dead-letter path behaves. The model holds; I just have to walk it.',
    },
    fe: { base: 'Two people are waiting politely and neither will ask again this week. The patience is real and it is also a clock.' },
    fi: {
      'rings-true': 'I am not shipping something I do not understand with my name on it. That is not pride, it is the job.',
      neutral: 'It is somebody’s mess. It is now my mess. Fine.',
      'rings-false': 'Something about being handed this without a conversation sits badly, and it is going to keep sitting badly.',
    },
  },
};
