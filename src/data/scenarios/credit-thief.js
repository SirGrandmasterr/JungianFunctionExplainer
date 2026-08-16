/* ============================================================
   CURRENTS · Scenario — The Credit Thief
   Values-charged, public, structurally consequential. The deck's
   reference scenario: it is the one where suppression and
   confrontation both cost real money, and neither is free.
   ============================================================ */

export const CREDIT_THIEF = {
  id: 'credit-thief',
  title: 'The Credit Thief',
  blurb: 'Nine people. Your architecture. Someone else’s name on it.',
  vignette:
    'Sprint review, nine people in the room. A colleague is presenting your architecture as their own — ' +
    'not paraphrasing it, presenting it. The promotion list closes in six days.',

  /* ---- surface hooks: objective features, readable by anyone standing there ---- */
  surface: {
    se: { intensity: 0.35, urgency: 0.70, affordances: ['speak now', 'catch them after'] },
    ne: { ambiguity: 0.40, possibilities: ['a misunderstanding?', 'a test?', 'a pattern?'] },
    te: { stakes: 0.80, metric: 'the promotion review, six days out', resources: ['commit history', 'the design doc'] },
    fe: { audience: 9, tone: 'tense-polite', expectation: 'keep the meeting on track' },
  },

  /* ---- interior hooks: the priors. Authored defaults; the Briefing overrides. ---- */
  interior: {
    si: { familiarity: 'familiar-bad', precedent: 'third time with this colleague' },
    ni: { trajectory: 'foreseen', note: 'this is how they got the last title' },
    ti: { modelFit: 'contradiction', axiom: 'credit follows authorship' },
    fi: { valence: -0.85, value: 'fairness' },
  },

  /* ---- context gates: hook state → cost multiplier on that chamber ---- */
  gates: {
    si: { 'familiar-good': 0.7, 'familiar-bad': 1.0, unprecedented: 1.6 },
    ni: { foreseen: 0.7, blindside: 1.5 },
    ti: { consistent: 0.8, contradiction: 1.1 },
    fi: { 'rings-true': 0.8, neutral: 1.0, 'rings-false': 1.2 },
    fe: 1.2,          /* nine people is a full room to conduct */
    se: 0.9,
  },

  /* ---- the deck. Signatures sum to 1. Doing nothing is on it, and priced. ---- */
  actions: [
    {
      id: 'correct-now',
      label: 'Correct the record — now, with evidence',
      detail: 'Two sentences and a link, into the silence after this slide.',
      signature: { te: 0.5, se: 0.3, fe: 0.2 },
      intensity: 0.7,
      mandates: { serves: ['fi.fairness', 'te.stakes'] },
      outcome: 'The room reorganizes around the correction. It lands, and it is cold.',
    },
    {
      id: 'smooth-defer',
      label: 'Smooth the moment; take it up one-on-one after',
      detail: 'Let the meeting finish clean, then have the harder conversation without an audience.',
      signature: { fe: 0.4, ni: 0.3, si: 0.3 },
      intensity: 0.5,
      mandates: { serves: ['fe.expectation'], defers: ['fi.fairness'] },
      outcome: 'The meeting ends well. The conversation afterwards is yours to schedule — and to keep scheduling.',
    },
    {
      id: 'quiet-replan',
      label: 'Say nothing. Quietly re-plan around them',
      detail: 'Absorb it, adjust who sees your work next time, move on.',
      signature: { ti: 0.4, ni: 0.4, si: 0.2 },
      intensity: 0.4,
      mandates: { defies: ['fi.fairness'] },
      outcome: 'Nothing visible happens. The recalculation runs for a week.',
    },
    {
      id: 'improv-reclaim',
      label: 'Build on “their” idea until the authorship is obvious',
      detail: 'Take the next question, extend the design live, let the room draw its own conclusion.',
      signature: { ne: 0.4, se: 0.3, fe: 0.3 },
      intensity: 0.6,
      mandates: { serves: ['fi.fairness'], defers: ['fe.expectation'] },
      outcome: 'No accusation is ever made. Two people work it out; the rest do not.',
    },
  ],

  /* ---- monologue: authored for all eight, so any Vessel finds its four,
          and a routed style is available without a special case ---- */
  monologue: {
    ne: { base: 'Or — wait — is this a misunderstanding? There are four ways this could be read and two of them are funny. There is also a version of the next sixty seconds where this becomes a much better meeting.' },
    ni: {
      foreseen: 'There it is. Right on schedule. I can see the next three moves from here, including the one where this becomes the story of how they got the title.',
      blindside: 'This was not in the picture. The whole shape of this person is being recomputed and it is not converging.',
    },
    se: { base: 'They are mid-slide. Eyes are on them, not on you. There is a gap coming after this bullet and it is already closing.' },
    si: {
      'familiar-good': 'This has gone fine before. There is a version of this where nothing is wrong.',
      'familiar-bad': 'Third time. March, the standup in June, now this. The record is unambiguous and it is not getting better.',
      unprecedented: 'No file for this. Nothing in the strata matches. I have nothing for you.',
    },
    te: { base: 'The commit history exists. Two sentences and a link settle this. Cost of silence: the review reads wrong for six more days, and the review is what the promotion is drawn from.' },
    ti: {
      consistent: 'Attribution is noisy. This is within tolerance for how credit actually propagates.',
      contradiction: 'Credit follows authorship. That axiom just failed in production, in public. The model requires a correction from someone, and there is exactly one person in the room who can make it.',
    },
    fe: { base: 'Nine people. The temperature drops ten degrees the moment this is raised, and it does not come back up before the retro. Who carries that cold, and for how long?' },
    fi: {
      'rings-true': 'Odd. It does not actually bother me. Note that, it might matter later.',
      neutral: 'It stings. It probably is not the hill.',
      'rings-false': 'No. This one is not negotiable. I do not care what it costs — some things you do not let stand, and this is one of them.',
    },
  },
};
