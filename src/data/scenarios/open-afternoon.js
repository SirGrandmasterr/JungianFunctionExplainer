/* ============================================================
   CURRENTS · Scenario — The Open Afternoon
   The deck's counter-intuitive one. Nothing is wrong, nothing is
   owed, nobody needs anything. Every other scenario supplies
   pressure; this one removes it, and discovers that unstructured
   time is not free for everybody. Ne eats here. Te and Si go
   hungry, and hungry functions are expensive functions.
   ============================================================ */

export const OPEN_AFTERNOON = {
  id: 'open-afternoon',
  title: 'The Open Afternoon',
  blurb: 'Five hours. Nothing scheduled. Nobody expecting anything.',
  vignette:
    'The thing you were dreading got cancelled and it is one o’clock. Nobody wants anything from you until tomorrow. ' +
    'There is no list, no deadline, and no one to tell. The afternoon is genuinely, entirely yours.',

  surface: {
    se: { intensity: 0.30, urgency: 0.02, affordances: ['the door', 'the unread pile', 'the half-finished thing in the other room'] },
    ne: { ambiguity: 0.95, possibilities: ['start the big one', 'finish the small one', 'go somewhere', 'do nothing at all'] },
    te: { stakes: 0.08, metric: 'none — nothing here is measured', resources: ['five hours', 'no constraints'] },
    fe: { audience: 0, tone: 'silent', expectation: '' },
  },

  interior: {
    si: { familiarity: 'unprecedented', precedent: 'unstructured time usually evaporates and I never know where' },
    ni: { trajectory: 'blindside', note: 'no picture of this afternoon exists; nothing was pointing anywhere' },
    ti: { modelFit: 'consistent', axiom: 'time you did not have to earn is the good kind' },
    fi: { valence: 0.55, value: 'wanting' },
  },

  gates: {
    si: { 'familiar-good': 0.8, 'familiar-bad': 1.15, unprecedented: 1.35 },
    ni: { foreseen: 0.9, blindside: 1.25 },
    ti: { consistent: 0.9, contradiction: 1.2 },
    fi: { 'rings-true': 0.7, neutral: 1.15, 'rings-false': 1.45 },
    se: 0.95,
    ne: 0.6,         /* maximum room to branch — Ne has never been cheaper */
    te: 1.6,         /* nothing to optimise, nothing to measure; Te idles hot */
    fe: 1.5,         /* nobody to read, nobody to hold */
  },

  affinity: { ne: 1.7, fi: 1.35, se: 1.1, te: 0.35, fe: 0.35, si: 0.6 },

  actions: [
    {
      id: 'start-the-big-one',
      label: 'Start the thing you never have time for',
      detail: 'Five hours is not enough to finish it. It is enough to stop it being hypothetical.',
      signature: { ne: 0.45, ti: 0.3, fi: 0.25 },
      intensity: 0.55,
      mandates: { serves: ['fi.value', 'ne.ambiguity'], defies: ['si.precedent'] },
      outcome: 'By five you have something ugly and real that did not exist at one. It will be months before you know if it mattered.',
    },
    {
      id: 'clear-the-pile',
      label: 'Clear the small overdue things',
      detail: 'Seven of them. None urgent. All quietly costing something.',
      signature: { te: 0.45, si: 0.35, se: 0.2 },
      intensity: 0.45,
      mandates: { serves: ['si.precedent'], defers: ['fi.value'] },
      outcome: 'All seven done, the afternoon spent, and a flat feeling you cannot argue with because the list is genuinely shorter.',
    },
    {
      id: 'go-outside',
      label: 'Leave the house with no destination',
      detail: 'Coat, door, whichever way looks better at the corner.',
      signature: { se: 0.55, ne: 0.3, fi: 0.15 },
      intensity: 0.4,
      mandates: { serves: ['se.urgency', 'fi.value'], defies: ['te.stakes'] },
      outcome: 'You come back at four having done nothing describable, and something in your chest has moved a few degrees.',
    },
    {
      id: 'call-someone',
      label: 'Call the person you keep meaning to call',
      detail: 'They are probably free. That is the whole plan.',
      signature: { fe: 0.5, fi: 0.3, ne: 0.2 },
      intensity: 0.45,
      mandates: { serves: ['fi.value'], defies: ['ni.trajectory'] },
      outcome: 'Forty minutes. Most of it nothing. Both of you say you should do this more often and one of you means it.',
    },
    {
      id: 'burn-it',
      label: 'Do nothing, and keep deciding',
      detail: 'Four tabs, three false starts, and it is somehow half past four.',
      signature: { ne: 0.5, ni: 0.3, si: 0.2 },
      intensity: 0.25,
      mandates: { defers: ['fi.value', 'te.stakes'] },
      outcome: 'The afternoon is gone and you cannot name what took it. This is the most common outcome and it is priced accordingly.',
    },
  ],

  monologue: {
    ne: { base: 'Or the guitar. Or that idea from the shower on Tuesday. Or none of it — there is a version of this afternoon where the best move is to squander it beautifully.' },
    ni: {
      blindside: 'There was no picture of today. I had a shape for this afternoon and it has been removed, and nothing has arrived to replace it.',
      foreseen: 'I knew that meeting would fall over. I have been quietly saving this afternoon for a fortnight.',
    },
    se: { base: 'Light on the floor, coffee still warm, the door is four steps away. Nothing in this room is asking for anything.' },
    si: {
      unprecedented: 'I do not have a file for an afternoon like this. The ones I remember all dissolved, and I could not tell you into what.',
      'familiar-good': 'I know exactly what to do with this. There is a good version of this afternoon and I have had it before.',
      'familiar-bad': 'Last time I had an afternoon like this I spent it refreshing things. The record on this is poor.',
    },
    te: { base: 'There is no objective. No metric, no deadline, no one to report to. I do not know what to do with a system that has no output.' },
    ti: {
      consistent: 'Time you did not have to earn is the good kind. That holds. The difficulty is not the principle, it is that a principle is not an instruction.',
      contradiction: 'I want to rest and I want to have done something, and those two are not compatible before five o’clock.',
    },
    fe: { base: 'Nobody is here. There is no room to read and no temperature to manage, which is either a holiday or a kind of silence, depending on the day.' },
    fi: {
      'rings-true': 'I actually know what I want to do with this. That is rarer than the afternoon is.',
      neutral: 'It is nice. I think it is nice. I will check again at three.',
      'rings-false': 'Something about all this space is uncomfortable and I would rather not look directly at why.',
    },
  },
};
