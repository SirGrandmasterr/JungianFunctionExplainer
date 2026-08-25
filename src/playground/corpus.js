/* ============================================================
   CURRENTS · Playground — the text corpus
   BUILD-SPEC §9.4. Keyed by (function, relation, state) rather
   than (scenario, function, action, state): ~150 authored lines
   TOTAL instead of ~600 per three scenarios, and a new scenario
   costs zero lines unless someone wants to hand-write one.

   The scenario files supply the INTAKE lines — what each
   function makes of the situation before anyone acts. Those are
   already authored per scenario and are read straight through
   (see scenario.js `statement`). This file supplies the ACTION
   voices: what a function says about a specific move.
   ============================================================ */

/* ---------- (fn, relation) — the base register ---------- */
export const VOICE = {
  ti: {
    serves:   ['That closes cleanly.', 'The model and the move agree. That is rarer than it should be.'],
    neutral:  ['No structural objection.', 'It neither confirms the model nor breaks it.'],
    defers:   ['Unresolved, then. Filed, not closed.', 'The inconsistency does not go away because we stopped looking at it.'],
    violates: ['That contradicts the thing I know to be true.', 'You are asking me to hold two incompatible statements at once.'],
  },
  te: {
    serves:   ['Measurable, and it moves the number.', 'That is the efficient path, and the record will show it.'],
    neutral:  ['Neutral on the metric.', 'No effect on the outcome I am tracking.'],
    defers:   ['Postponement is a decision with a price tag.', 'The cost accrues somewhere I am not currently looking.'],
    violates: ['That is strictly worse on every measure I have.', 'You are choosing the option that loses.'],
  },
  fi: {
    serves:   ['Yes. That is the one that fits.', 'This is who I actually am, and it costs what it costs.'],
    neutral:  ['It does not reach me either way.', 'No stake here. Odd, and worth noting.'],
    defers:   ['Putting it off does not make it smaller.', 'It waits. It always waits.'],
    violates: ['No. Not this one.', 'Something in me refuses, and it is not going to be argued out of it.'],
  },
  fe: {
    serves:   ['The room can hold that.', 'Everyone stays intact. That matters more than it sounds.'],
    neutral:  ['The temperature does not move.', 'Nobody here will notice either way.'],
    defers:   ['The conversation is still owed. Owed things get heavier.', 'Later means somebody carries it in the meantime.'],
    violates: ['The room will not survive that intact.', 'The temperature drops ten degrees and it does not come back up.'],
  },
  ne: {
    serves:   ['And that opens three more things.', 'Yes — and it makes the next move bigger, not smaller.'],
    neutral:  ['Fine. There were six other versions of this.', 'It closes nothing and opens nothing, which is unusual.'],
    defers:   ['Leaving it open is not the same as keeping it alive.', 'Deferred options decay. Not all of them survive the wait.'],
    violates: ['That shuts every door in the corridor.', 'One outcome now, where there were nine.'],
  },
  ni: {
    serves:   ['That is the shape it was always going to take.', 'The picture resolves. This was the move.'],
    neutral:  ['It does not change where this ends.', 'The trajectory absorbs it without bending.'],
    defers:   ['The end does not move because we arrived later.', 'Delay is not a different outcome. It is the same one, later.'],
    violates: ['This is the branch I saw and did not want.', 'Everything after this is the version I was trying to avoid.'],
  },
  se: {
    serves:   ['Now. This is the window.', 'Contact. That is what a real thing feels like.'],
    neutral:  ['It happens. The room absorbs it.', 'Nothing in the space actually changes.'],
    defers:   ['The window closes while we decide.', 'Whatever this was, it is not there in ten seconds.'],
    violates: ['The moment goes past and nothing meets it.', 'Standing still, with everything moving.'],
  },
  si: {
    serves:   ['This matches. There is a file for it and the file says fine.', 'Known ground. It holds.'],
    neutral:  ['Nothing in the record either way.', 'It does not resemble anything.'],
    defers:   ['The record notes the delay too.', 'This gets written down as the time we waited.'],
    violates: ['Nothing prepares for this, and I do not like it.', 'Everything reliable is being asked to be wrong.'],
  },
};

/* ---------- (fn, state) — the state overrides ----------
   Loop lines CIRCLE: the last is a near-repeat of the first.
   Grip lines are absolutist, personal, and crude compared with
   the same function at rest. Same psyche, different behaviour —
   which is why only the text changes, never the layout. */

export const STATE_VOICE = {
  loop: {
    ti: ['Run it again from the axiom.', 'It still does not add up.', 'One more pass and it resolves.', 'Run it again from the axiom.'],
    ni: ['I already know how this ends.', 'Every version ends the same way.', 'So the model must be right.', 'Which means I already know how this ends.'],
    te: ['The plan is sound. Execute the plan.', 'Re-run the numbers.', 'Same numbers.', 'The plan is sound.'],
    fe: ['Nobody has said anything. What does that mean?', 'Read the room again.', 'Still nothing.', 'Nobody has said anything.'],
    fi: ['Sit with it.', 'It still feels wrong and I cannot say why.', 'Sit with it longer.', 'Sit with it.'],
    ne: ['Or — or — or.', 'Forty-one versions, none of them chosen.', 'There is a better one somewhere.', 'Or — or — or.'],
    se: ['Move. Do something.', 'More input. Louder.', 'Anything at all.', 'Move. Do something.'],
    si: ['It went wrong before. Here is exactly how.', 'Play it back once more.', 'Same tape.', 'It went wrong before.'],
  },
  grip: {
    ti: ['None of this was ever coherent.', 'All of it is wrong. Every part.', 'I can prove it. I am going to prove it.', 'Nobody here can follow the argument.', 'None of this was ever coherent.'],
    te: ['Everything must be fixed. Now. In order.', 'Make the list. Execute the list.', 'Nothing here is under control.', 'It will be under control.', 'Everything must be fixed. Now.'],
    fi: ['Nobody has ever understood one thing about me.', 'It has always been like this.', 'This is who everyone actually is.', 'I am not pretending any more.', 'Nobody has ever understood one thing about me.'],
    fe: ['Nobody in this room respects me.', 'They have all decided, together.', 'Say it. Say all of it, now.', 'I do not care how it lands.', 'Nobody in this room respects me.'],
    ne: ['What if all of it. What if every one.', 'Catastrophes, in a fan, all live at once.', 'Any of them could be true.', 'Any of them.', 'What if all of it.'],
    ni: ['It ends one way. It has always ended one way.', 'There is a meaning under this and it is bad.', 'I have seen it.', 'It was always going to be this.', 'It ends one way.'],
    se: ['Eat. Drink. Drive. Something physical, now.', 'More. Harder. Louder.', 'Do not think, just do it.', 'Again.', 'Something physical, now.'],
    si: ['Something is wrong with my body.', 'This is exactly how it went last time.', 'It will be the same.', 'It is always the same.', 'Something is wrong.'],
  },
  recovery: {
    ti: ['Slower. One statement at a time.', 'It can be wrong and still not be urgent.'],
    te: ['One thing. Then the next thing.', 'The list can wait until tomorrow.'],
    fi: ['That was not all of it. Some of it, not all.', 'It is quieter now.'],
    fe: ['The room is still here. So am I.', 'Nobody has left.'],
    ne: ['One door at a time.', 'They are not all urgent.'],
    ni: ['I do not actually know how this ends.', 'That is allowed.'],
    se: ['Feet on the floor. Air in the room.', 'This, here, now.'],
    si: ['Nothing is broken. Check again — nothing is broken.', 'The record does not say disaster.'],
  },
};

/** The stalled half-sentence of a bypassed auxiliary. It is cut off, and it stays cut off. */
export const STALLED = {
  ti: 'There is a distinction here that—',
  te: 'The measurable thing to do would be—',
  fi: 'Something about this actually—',
  fe: 'The room is still—',
  ne: 'There was another way to—',
  ni: 'It was pointing somewhere and—',
  se: 'The thing in front of me is—',
  si: 'This is like the time when—',
};

/* ---------- generated action copy (§3.9) ----------
   The tone rule is load-bearing. ALLEVIATING actions are written
   unglamorously and carry low odds; AGGRAVATING actions are
   written to sound like relief and carry high odds. If the
   destructive option looked destructive, the mechanic would
   teach nothing. The forecast is where the truth lives. */

export const RELIEF_VOICE = {
  se: [['Name one thing in the room', 'Out loud. The slide number will do.'],
       ['Stand up. Move.', 'Physical interrupt. Cheap, undignified, works.'],
       ['Put your hands on something real', 'A cup, a door frame. Anything with a texture.']],
  si: [['Check it against the record', 'Not the feeling about it. The record.'],
       ['Do the ordinary next thing', 'The one you would do on a normal day.'],
       ['One familiar step', 'Small, known, and finishable.']],
  ne: [['Say the half-formed thing out loud', 'It does not have to be right to be useful.'],
       ['Name one other option', 'Any other option. It only has to exist.'],
       ['Ask what else this could be', 'Out loud, to someone who is not you.']],
  ni: [['Stop, and let it settle', 'No new input for sixty seconds.'],
       ['Wait for the shape', 'It arrives or it does not. Pushing does nothing.'],
       ['Give it one night', 'The picture is not finished and cannot be forced.']],
  ti: [['State the principle out loud', 'One sentence. If it will not fit, that is the finding.'],
       ['Check exactly one thing', 'Not the whole model. One claim.'],
       ['Define the term you keep using', 'You have been running on an undefined variable.']],
  te: [['Write the next step down', 'One step. On paper. Then stop.'],
       ['Do the smallest measurable thing', 'It does not have to help. It has to be done.'],
       ['Make one list, then close it', 'Bounded, finite, finishable.']],
  fi: [['Ask what you actually want', 'Not what is defensible. What you want.'],
       ['Say the true thing, quietly', 'To one person, at normal volume.'],
       ['Check it against yourself', 'Does this still sound like you?']],
  fe: [['Ask one person how they are', 'And wait for the answer.'],
       ['Say something kind, and mean it', 'It costs almost nothing and it lands.'],
       ['Let someone else talk', 'All the way to the end of their sentence.']],
};

export const SPIRAL_VOICE = {
  ti: [['Model it one more time', 'It feels like progress. It is the loop.'],
       ['Find the flaw in the argument', 'There is one. There is always one.'],
       ['Get it exactly right first', 'Nothing should ship until it is correct.']],
  ni: [['Predict what they will do next', 'Certainty without a single new observation.'],
       ['Work out what it really means', 'The surface reading is never the real one.'],
       ['See it through to the end', 'You already know where this goes. Confirm it.']],
  te: [['Fix all of it. Now. In order.', 'Control is one comprehensive push away.'],
       ['Take the whole thing over', 'Nobody else is going to do it properly.'],
       ['Push it through by force', 'Consensus is slower and no better.']],
  fe: [['Say the whole thing. All of it.', 'Every grievance, in order, to everyone.'],
       ['Demand they acknowledge you', 'Out loud, now, in front of the room.'],
       ['Make them understand how it felt', 'They will not until you make them.']],
  fi: [['Tell them what this really is', 'No more diplomacy. The actual truth.'],
       ['Refuse, on principle', 'Some things you do not let stand.'],
       ['Let them see exactly what they did', 'In full, with nothing softened.']],
  ne: [['Consider every possibility first', 'It would be reckless to commit before you have.'],
       ['Follow it one branch further', 'The good one is probably just past this.'],
       ['Reopen the whole question', 'The frame was wrong. Start again.']],
  se: [['Do something drastic. Right now.', 'The situation calls for it.'],
       ['Push it physically', 'Words have clearly stopped working.'],
       ['Escalate — here, in the room', 'Waiting has produced nothing.']],
  si: [['Go over exactly what went wrong', 'In sequence. All of it.'],
       ['Compare it to every previous time', 'The pattern is the evidence.'],
       ['Recite the history', 'Somebody should have the full record.']],
};

/* ---------- lookup ---------- */

/**
 * What `fn` would say about this action, in this state.
 * @param {string} fn
 * @param {'serves'|'neutral'|'defers'|'violates'} relation
 * @param {string} machine
 * @param {number} variant  a stable index so the same action always reads the same
 */
export function voiceFor(fn, relation, machine, variant = 0) {
  if (machine === 'loop' || machine === 'grip') {
    const pool = STATE_VOICE[machine]?.[fn];
    if (pool && pool.length) return pool[variant % pool.length];
  }
  if (machine === 'recovery') {
    const pool = STATE_VOICE.recovery?.[fn];
    if (pool && pool.length) return pool[variant % pool.length];
  }
  const pool = VOICE[fn]?.[relation] || VOICE[fn]?.neutral || [''];
  return pool[variant % pool.length];
}

/** The running stream a function produces while it sits in a state, per beat. */
export function idleLineFor(fn, machine, beatIndex) {
  if (machine === 'loop') {
    const p = STATE_VOICE.loop[fn]; return p[beatIndex % p.length];
  }
  if (machine === 'grip') {
    const p = STATE_VOICE.grip[fn]; return p[beatIndex % p.length];
  }
  if (machine === 'recovery') {
    const p = STATE_VOICE.recovery[fn]; return p[beatIndex % p.length];
  }
  return null;
}

/** A stable small integer from a string, so voice variants never flicker. */
export function variantOf(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}
