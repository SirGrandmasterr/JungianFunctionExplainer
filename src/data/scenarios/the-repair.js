/* ============================================================
   CURRENTS · Scenario — The Repair
   One person, no clock, no stakes anyone could measure — and
   the highest Fi valence in the deck. The Credit Thief asks
   what you do when you have been wronged in public; this asks
   what you do when the wrong is two years old, private, and
   partly yours. Fi leads, and Te has nothing to hold.
   ============================================================ */

export const THE_REPAIR = {
  id: 'the-repair',
  title: 'The Repair',
  blurb: 'Two years of silence, and then: “I think about that day a lot.”',
  vignette:
    'A message from someone who used to be the first person you told anything. Two years since the thing that ended it, ' +
    'most of which you have spent being right about it. Eleven words, no question mark, and the typing indicator is not on.',

  surface: {
    se: { intensity: 0.10, urgency: 0.15, affordances: ['the phone in your hand', 'the reply box'] },
    ne: { ambiguity: 0.65, possibilities: ['an apology', 'an opening', 'a test', 'a message sent to the wrong person'] },
    te: { stakes: 0.20, metric: 'nothing here can be measured or won', resources: ['two years of not speaking'] },
    fe: { audience: 1, tone: 'careful', expectation: 'meet it, or do not' },
  },

  interior: {
    si: { familiarity: 'familiar-good', precedent: 'eleven years of it working, and one week of it not' },
    ni: { trajectory: 'blindside', note: 'the picture had settled with this person outside it' },
    ti: { modelFit: 'contradiction', axiom: 'people who do that do it again' },
    fi: { valence: -0.45, value: 'honesty' },
  },

  gates: {
    si: { 'familiar-good': 0.75, 'familiar-bad': 1.3, unprecedented: 1.5 },
    ni: { foreseen: 0.85, blindside: 1.35 },
    ti: { consistent: 0.9, contradiction: 1.35 },
    fi: { 'rings-true': 0.7, neutral: 1.0, 'rings-false': 1.5 },
    se: 1.5,
    ne: 1.0,
    te: 1.65,        /* there is no metric, no lever, and nothing to optimise */
    fe: 0.75,        /* one careful person is exactly what Fe is for */
  },

  affinity: { fi: 1.65, fe: 1.4, si: 1.15, te: 0.3, se: 0.4 },

  actions: [
    {
      id: 'say-the-true-thing',
      label: 'Answer with the actual feeling',
      detail: 'Not the position you have rehearsed for two years. The thing underneath it.',
      signature: { fi: 0.55, fe: 0.3, si: 0.15 },
      intensity: 0.7,
      mandates: { serves: ['fi.value'], defies: ['ti.axiom'] },
      outcome: 'You send it before you can edit it back into something defensible. The reply takes six hours and is longer than yours.',
    },
    {
      id: 'warm-and-safe',
      label: 'Be warm, and say nothing real',
      detail: 'Good to hear from you. How have you been. The door held open an inch.',
      signature: { fe: 0.55, ni: 0.25, si: 0.2 },
      intensity: 0.4,
      mandates: { serves: ['fe.expectation'], defers: ['fi.value'] },
      outcome: 'A pleasant exchange that could have been with anyone. Both of you notice. Neither says so.',
    },
    {
      id: 'ask-what-they-mean',
      label: 'Ask what they mean by it',
      detail: 'Eleven words is not enough to act on. Get the sentence behind them.',
      signature: { ti: 0.4, ne: 0.35, fe: 0.25 },
      intensity: 0.5,
      mandates: { serves: ['ti.axiom', 'ne.ambiguity'], defers: ['fi.value'] },
      outcome: 'They tell you. It is more specific than you expected and it does not let you off anything.',
    },
    {
      id: 'hold-the-line',
      label: 'Restate what happened, plainly',
      detail: 'Before anything else moves, the record of that day gets said out loud.',
      signature: { ti: 0.45, si: 0.35, te: 0.2 },
      intensity: 0.65,
      mandates: { serves: ['ti.axiom', 'si.precedent'], defies: ['fe.expectation'] },
      outcome: 'You are accurate about all of it. The conversation goes cold about four messages later and stays that way.',
    },
    {
      id: 'leave-it-unread',
      label: 'Leave it. Decide tomorrow.',
      detail: 'Nothing here expires. That is the argument, and it is a good one, and it is not the reason.',
      signature: { ni: 0.4, si: 0.35, ti: 0.25 },
      intensity: 0.3,
      mandates: { defers: ['fi.value', 'fe.expectation'] },
      outcome: 'It sits at the top of the thread for nine days. On the tenth it is too late for it to be a small thing.',
    },
    {
      /* Se had nothing to do in a scenario made of text — but refusing the
         medium is the most Se move available: voice, now, in real time,
         where neither of you can edit. */
      id: 'just-call',
      label: 'Do not type. Call them.',
      detail: 'Voice, now, with nothing rehearsed and no way to draft it.',
      signature: { se: 0.4, fe: 0.35, fi: 0.25 },
      intensity: 0.75,
      mandates: { serves: ['se.urgency', 'fi.value'], defies: ['ti.axiom'] },
      outcome: 'They pick up on the fourth ring and neither of you has anything prepared. It is the best forty minutes of the month and it is not comfortable once.',
    },
  ],

  monologue: {
    ne: { base: 'Apology? Opening? A bad night and a phone in reach? There is a version where this is the beginning of something and a version where it is the last thing they ever send me.' },
    ni: {
      blindside: 'I had finished this. The picture was complete with them outside it, and now the picture is not complete.',
      foreseen: 'I have known this message was coming for two years. I could have written it myself, and roughly this is what I would have written.',
    },
    se: { base: 'A phone, a thumb, a reply box with a cursor in it. Nothing else in the room is involved in this at all.' },
    si: {
      'familiar-good': 'Eleven years of Sunday phone calls and one week that ended it. The ratio is not in dispute; I have simply been refusing to do the arithmetic.',
      'familiar-bad': 'This is the second time someone has come back with a soft sentence and no apology in it. I remember exactly how the first one went.',
      unprecedented: 'Nobody has ever come back before. I have no idea what this is supposed to feel like.',
    },
    te: { base: 'There is nothing to optimise. No outcome I can name, no measure of success, and no version of this where being efficient helps.' },
    ti: {
      contradiction: 'My working model says people who do that do it again. My working model also says eleven years of evidence outranks one week. Both of those are mine and they do not fit in the same head.',
      consistent: 'The model holds: this is who they are, and this message does not change the class of thing they did.',
    },
    fe: { base: 'They spent a while on eleven words. There is a careful, frightened person on the other end of this and whatever I send next lands on them exactly as written.' },
    fi: {
      'rings-false': 'Two years of being right about this, and being right has not once felt like anything. That is the part I do not want to look at.',
      neutral: 'I do not know what I feel. I have been so busy with the position that I have not checked in a long time.',
      'rings-true': 'I miss them. That is the whole of it and everything else is scaffolding I built to avoid saying it.',
    },
  },
};
