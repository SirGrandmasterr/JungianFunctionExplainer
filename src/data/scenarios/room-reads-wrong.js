/* ============================================================
   CURRENTS · Scenario — The Room Reads Wrong
   The Credit Thief's opposite number. There, the wrong is
   visible and the stakes are structural; here nothing has
   happened, nobody has done anything, and the only evidence is
   a temperature. Fe leads on almost no information — and Te,
   which needs something countable, has nothing at all.
   ============================================================ */

export const ROOM_READS_WRONG = {
  id: 'room-reads-wrong',
  title: 'The Room Reads Wrong',
  blurb: 'Twelve people, a normal evening, and something is off.',
  vignette:
    'You arrive twenty minutes late to a room you know well. The conversation restarts a half-second after you enter. ' +
    'Two people are not sitting where they would normally sit. Nobody has said anything, and nothing is obviously wrong.',

  surface: {
    se: { intensity: 0.45, urgency: 0.30, affordances: ['who is standing where', 'the half-second', 'an empty chair by the window'] },
    ne: { ambiguity: 0.90, possibilities: ['about you', 'about them', 'a row before you arrived', 'nothing whatsoever'] },
    te: { stakes: 0.15, metric: 'nothing here is countable', resources: ['twelve people', 'an evening'] },
    fe: { audience: 12, tone: 'bright-and-slightly-wrong', expectation: 'be normal' },
  },

  interior: {
    si: { familiarity: 'familiar-good', precedent: 'four years of these evenings and they do not usually do this' },
    ni: { trajectory: 'blindside', note: 'no read on this yet, and reads are usually here by now' },
    ti: { modelFit: 'contradiction', axiom: 'a half-second pause is not evidence of anything' },
    fi: { valence: -0.25, value: 'not performing' },
  },

  gates: {
    si: { 'familiar-good': 0.7, 'familiar-bad': 1.25, unprecedented: 1.5 },
    ni: { foreseen: 0.8, blindside: 1.4 },
    ti: { consistent: 0.95, contradiction: 1.45 },   /* nothing here is checkable; Ti runs hot on vapour */
    fi: { 'rings-true': 0.85, neutral: 1.05, 'rings-false': 1.4 },
    se: 0.8,
    ne: 0.75,
    te: 1.7,         /* no metric, no lever, no resource — the harshest Te gate in the deck */
    fe: 0.65,        /* twelve people and a temperature to read: Fe's element */
  },

  affinity: { fe: 1.6, ne: 1.35, se: 1.15, ni: 1.1, te: 0.3, ti: 0.55 },

  actions: [
    {
      id: 'ask-directly',
      label: 'Ask someone, quietly, what happened',
      detail: 'One person, in the kitchen, plainly. Not the room.',
      signature: { fe: 0.4, ti: 0.3, se: 0.3 },
      intensity: 0.55,
      mandates: { serves: ['ti.axiom', 'fi.value'], defies: ['fe.expectation'] },
      outcome: 'They tell you in nine words. It was not about you, and now you are one of two people carrying it.',
    },
    {
      id: 'be-normal',
      label: 'Be exactly as normal as the room wants',
      detail: 'Match the brightness, take the empty chair, let the evening close over it.',
      signature: { fe: 0.55, si: 0.25, se: 0.2 },
      intensity: 0.5,
      mandates: { serves: ['fe.expectation', 'si.precedent'], defers: ['fi.value'] },
      outcome: 'It works. The evening is fine, everyone says so afterwards, and you go home with the half-second still in your pocket.',
    },
    {
      id: 'name-it',
      label: 'Say out loud that something feels off',
      detail: 'To the room. Cheerfully. And then wait through whatever silence follows.',
      signature: { fi: 0.4, fe: 0.35, se: 0.25 },
      intensity: 0.8,
      mandates: { serves: ['fi.value'], defies: ['fe.expectation', 'si.precedent'] },
      outcome: 'Two seconds of something genuinely awful, and then someone laughs and tells you. It was the right call and it did not feel like it.',
    },
    {
      id: 'read-it-out',
      label: 'Watch, and work it out without asking',
      detail: 'Who is not talking to whom. Twenty minutes will settle it.',
      signature: { ni: 0.4, se: 0.35, ne: 0.25 },
      intensity: 0.45,
      mandates: { serves: ['ni.trajectory'], defers: ['fe.expectation'] },
      outcome: 'By ten you have it, near enough, and you have spent the evening as an instrument rather than a guest.',
    },
    {
      id: 'let-it-go',
      label: 'Decide it is nothing and mean it',
      detail: 'People sit in different chairs. Conversations pause. Not everything is a signal.',
      signature: { ti: 0.4, si: 0.35, ne: 0.25 },
      intensity: 0.3,
      mandates: { serves: ['ti.axiom'], defers: ['ni.trajectory', 'fi.value'] },
      outcome: 'Mostly it works. It comes back briefly at about two in the morning and then it genuinely is gone.',
    },
    {
      /* Te had no card at all, on the grounds that nothing here is countable
         — but "give the room something to do" is exactly what a Te type
         reaches for when a room goes strange. The gate still prices it at
         1.7; the point is that the move exists, not that it is cheap. */
      id: 'give-them-a-task',
      label: 'Give the room something to do',
      detail: 'Open the other bottle, start the thing everyone came for, put a shape on the evening.',
      signature: { te: 0.45, se: 0.3, fe: 0.25 },
      intensity: 0.5,
      mandates: { serves: ['fe.expectation'], defers: ['ni.trajectory'], defies: ['fi.value'] },
      outcome: 'The structure holds and the evening moves. Whatever it was is still in the room at midnight, underneath a card game.',
    },
  ],

  monologue: {
    ne: { base: 'About me, about them, a row before I got here, or a room that simply has two people in unusual chairs. Nine hypotheses and no way to test any of them without spending something.' },
    ni: {
      blindside: 'I usually have a read by now. I do not have a read. That absence is itself the most interesting thing in the room.',
      foreseen: 'This has been coming since the thing in March. I could name the two people involved without looking up.',
    },
    se: { base: 'Half-second pause on entry. Two people in the wrong chairs. One empty seat by the window that nobody has taken and everybody has walked past.' },
    si: {
      'familiar-good': 'Four years of these evenings. They do not do this. The deviation is small and it is unmistakable because the baseline is so well established.',
      'familiar-bad': 'It went like this before the last time somebody stopped coming. Same brightness, same slightly wrong pitch.',
      unprecedented: 'I have no baseline for this group. Everything I am calling odd might just be how they are.',
    },
    te: { base: 'Nothing here is countable. No metric, no resource, no action with a measurable outcome. I have no idea what I am supposed to do with this.' },
    ti: {
      contradiction: 'A half-second pause is not evidence — that is my own rule and I am currently building a case out of three pauses and a seating chart. One of those two things has to give.',
      consistent: 'Insufficient data. Every reading available to me is consistent with nothing at all having happened, and I am going to hold that line.',
    },
    fe: { base: 'The brightness is a quarter-tone too high and everyone is maintaining it together, which means everyone knows. Twelve people are doing a piece of work right now and I have just walked into the middle of it.' },
    fi: {
      neutral: 'I do not need to know. I would like to know. Those are different and I should keep them apart.',
      'rings-false': 'I have spent forty minutes performing not-noticing, and that is the specific thing I said I would stop doing.',
      'rings-true': 'Whatever this is, it is theirs and not mine. I am comfortable being the person who lets that be true.',
    },
  },
};
