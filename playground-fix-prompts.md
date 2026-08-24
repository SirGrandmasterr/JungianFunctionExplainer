# Playground — Fix Prompts

A sequence of self-contained prompts addressing the shortcomings found in the August 2026
critique of the Playground ("The Vessel & the Voyage"). Each prompt is written to be handed
to a coding agent in a fresh session, in order — later prompts assume earlier ones have
landed. Run one prompt per session/PR.

**Standing instructions that apply to every prompt below** (paste along with any prompt):

> Work in the CURRENTS repo. The Playground lives in `playground/` (entry) and
> `src/playground/` (modules), with copy/constants in `src/data/playground-data.js` and
> scenarios in `src/data/scenarios/`. Do not modify the eight glyph engines in
> `src/engines/` — the Playground drives them through `src/playground/chamber.js` only.
> Keep the resolver (`src/playground/ledger.js`) pure: no DOM, no clock, no randomness.
> After the change, run `npm run dev`, use the Playground end to end at `/playground/`,
> and verify the acceptance criteria hands-on. If the change alters model behavior or
> shipped scope, append a dated entry to §9 of `playground-spec.md` describing what
> changed and why — the spec's rule is that the implementation is the authority.

Ordering rationale: prompts 1–4 are independent copy/pedagogy fixes (safe warm-ups);
5–6 change the economy's behavior; 7–9 restructure the Ledger's UX around the existing
model; 10–12 finish promised mechanics; 13 sweeps the minor findings; 14 re-syncs the
spec with whatever the code now says, and must run **last** because prompts 5, 6, 11,
and 12 all change numbers the spec currently prints.

---

## Prompt 1 — Put the epistemics where the numbers are

*Fixes: invented constants presented with false precision (critical); receipt notation
unexplained (moderate).*

```
The Playground's receipt (rendered in playground/main.js, renderReceipt) prints lines like
"Se .30 → Si (inf ×4.0 · τ1.5 · gate 1.2) — 12.6 u" and forecast percentages like "42%",
but nowhere in the UI is "u", "×4.0", "τ", or "gate" defined, and nothing marks these
numbers as the model's inventions rather than measurements. The only disclaimer is the
one-line footer at the very bottom of the page. playground-spec.md §8.1 itself calls
TAU = 1.5 "a guess."

Make three changes:
1. Add a compact legend/footnote to the receipt component itself (visible with every
   receipt, styled quiet, in src/styles/playground-theme.css): one line defining
   u = "model units — this model's arithmetic, not a measurement", × = the slot's
   activation multiplier, τ = the attitude-translation tax, gate = the situation's
   multiplier on that chamber. Add title-attribute tooltips on the ×/τ/gate tokens in
   each receipt row repeating their one-line definitions.
2. Where the forecast percentage renders on action cards (renderDeck), change the title
   tooltip to state that the odds are the model's softmax over its own cost estimates,
   not a calibrated probability of human behavior.
3. The copy for all of this lives in src/data/playground-data.js (extend the EPISTEMIC
   export into a small object), not inline in main.js.

Do not soften the visual design — the receipt should still read like a confident bill;
the legend is small print, but present and legible.

Acceptance: build any Vessel, run any action; the receipt shows the legend; hovering
×/τ/gate tokens explains them; the forecast tooltip mentions it is model output.
```

## Prompt 2 — The "What did I just build?" sources drawer

*Fixes: zero sourcing anywhere in the mode; contested Grant-stack convention staged as
natural law (critical). The spec promised this drawer in §2.3 beat 4 and never shipped it.*

```
The Playground presents its three stack "Laws" (src/data/playground-data.js, LAWS) as
necessities of a workable mind, but they are the Grant-model convention — one school of
typology. The shipped mode contains no mention of Jung, Myers, Grant, or Beebe (verify
with grep). playground-spec.md §2.3 promised a Layer-3 drawer ("What did I just build?")
with Grant-model sourcing and caveats.

Build that drawer. After a Vessel completes (the commit() path in playground/main.js),
show a "What did I just build?" button near the type chip in the read column. It opens a
collapsible drawer (no navigation away) containing, in this order:
1. The full encoding for the built type: the two chosen functions, the two entailed ones,
   and the four-letter derivation (reuse typeCode logic conceptually, don't duplicate it).
2. A short sourcing section: dominant–inferior opposition is Jung (Psychological Types,
   ch. X); the alternating-attitude stack is the Grant/Beebe convention (Grant et al.,
   From Image to Likeness, 1983; Beebe's eight-function model); Myers-line sources place
   the tertiary's attitude differently; the auxiliary-attitude rule rests on one reading
   of an ambiguous Jung passage. Frame the Laws as "this model's rules," not settled fact.
3. A caveats line matching the existing EPISTEMIC register: the mode animates an
   interpretive model; the economy's constants are authored, not measured.

All copy goes in src/data/playground-data.js. Keep it Layer-3: nothing in the drawer is
required to operate anything, and it never auto-opens.

Also revise the Free Play note copy (ASSEMBLY.freeplay): "the Laws are what a workable
mind requires" overstates — reword to claim only what the model claims (e.g. "the Laws
are what this model of a workable mind requires").

Acceptance: build a Vessel, open the drawer, confirm the sourcing renders and collapses;
grep now finds Jung/Grant/Beebe in the playground copy layer.
```

## Prompt 3 — Slow "I know my type" and teach all three Laws

*Fixes: the majority entry door completes in 2.1 s, captions unreadable, lawbook ends with
only Law III (moderate).*

```
In src/playground/assembly.js, autoBuild() plays the four build beats with
setTimeout(speed * (i+1)) and playground/main.js calls it with speed 520 (60 under
reduced motion). Measured result: the whole build takes ~2.1 s, the dominant and
auxiliary captions are visible ~0.5 s each, and the lawbook ends holding only Law III —
Laws I and II are only ever revealed by refusal events, which an auto-piloted legal build
never triggers. The spec (§2.4) wants this door to be "the lecture disguised as a
cutscene" (~20 s) precisely because these users skipped the manual build.

Change autoBuild to a paced, narrated sequence:
1. Pacing: each beat waits long enough to read its caption — target 2.5–3.5 s per beat
   (scale with caption length), total ~12–18 s. Under REDUCED (src/utils/dom.js), do NOT
   speed through captions: same beat sequence, but let each caption persist ~2.5 s with
   no animation. A "skip" affordance (click anywhere on the stage or a small Skip button)
   jumps to the completed state immediately.
2. Laws: during the auto-build, stage one scripted refusal between beat 1 and beat 2 —
   pick one illegal candidate for the chosen dominant that breaks Law II and one that
   breaks Law I, flash each toward the aux slot with the existing refuse animation and
   its one-line reason, and call _noteLaw for each. Acceptance state: after any
   auto-build, the lawbook contains all three Laws.
3. Keep manual building and "Surprise me" behavior unchanged apart from sharing the same
   pacing constants (put them in src/data/playground-data.js).

Acceptance: pick ENTJ from "I know my type"; the build narrates over ≥12 s with readable
captions and two visible refusals; the lawbook shows Laws I, II, III; Skip works;
reduced-motion still gets readable captions without animations.
```

## Prompt 4 — Repair the monologue register trimmer

*Fixes: rank-register truncation cuts mid-clause, producing corrupted-reading voices
(minor, but it damages the mode's soul).*

```
In src/playground/monologue.js, trimTo() cuts authored lines to a fraction of their
length (REGISTER trim: aux 0.85, tert 0.55, inf 0.30) at "the last sentence or clause
boundary", but in practice it produces dangling fragments. Hands-on examples from the
credit-thief scenario: auxiliary Fi renders as "…some things you do not let stand, and"
and tertiary Te as "Easy: the commit history exists. Two sentences and a link settle
this. Cost of silence: the review" — both read as corrupted text, not a curtailed voice.

Fix the trimmer so a cut NEVER ends mid-clause:
1. Prefer complete sentences: cut at the last sentence terminator (". ", "? ", "! ")
   within the limit. If no sentence boundary fits, fall back to the last " — " or "; "
   boundary. If nothing fits, use the FULL first sentence even if it exceeds the limit —
   an over-long voice beats a broken one. Never cut at a bare comma or space.
2. Strip any dangling conjunction or preposition left at the cut ("and", "but", "or",
   "the", "a", "to", "of" as the final token → drop it).
3. The inferior's infTail ellipsis should only attach when something was actually cut.
4. Keep voice() deterministic. While here, fix the seed (currently 7 + rank.length * 13,
   which collides for dom/aux/inf): derive it from rank + scenario id so different
   scenarios pick different hedge openers.
5. Add a small dev check (console.warn in dev only) if a rendered voice ends in a
   conjunction/comma, so regressions surface.

Acceptance: for ENFP and INFP on credit-thief, ENTJ on the-offer, and ESTP on
kitchen-fire, read all four voices — every voice ends at a sentence or clause boundary
with no dangling function words; different scenarios use different aux/tert openers.
```

## Prompt 5 — Extend mandates to perceiving chambers, and assert the coupling

*Fixes: dead mandates — authored scenario intent the engine can never execute (moderate).
Changes economy output; run before the spec re-sync (Prompt 14).*

```
In src/playground/ledger.js, liveMandates() generates mandates only for judging chambers
(fi/ti/te/fe). But src/data/scenarios/the-offer.js couples actions to 'ni.trajectory'
(served by take-it, defied by decline) and 'si.precedent' (served by decline) — these
never match anything, silently. Verified consequence: an INTJ declining its own
"foreseen" trajectory registers only te.stakes defied; the decline action gets no
conviction subsidy for any type despite its authored serves list.

1. Extend liveMandates to perceiving chambers, at lower gain than judges:
   - ni: from briefing.ni.trajectory — 'foreseen' produces a directed push along the
     trajectory (suggest valence 0.6, label from the briefing note or "the trajectory");
     'blindside' produces none.
   - si: from briefing.si.familiarity — 'familiar-good' produces a push toward precedent
     (suggest valence 0.5, label from briefing precedent or "the precedent");
     'familiar-bad' and 'unprecedented' produce none.
   - se/ne: no mandates (nothing in the scenarios references them; don't invent).
   Strength stays |valence| × W[rank] as for judges. Pick constants so the credit-thief
   worked numbers move as little as possible (ni is 'foreseen' there — check the INFP/ENTJ
   receipts before and after and report the drift in your summary).
2. Betrayal (introverted-mandate defiance surcharge) currently filters on att === 'i';
   decide and document whether ni/si defiance should also surcharge (recommended: yes,
   same rule — they are introverted).
3. Add a dev-time assertion: on scenario load (or in a small module self-test), walk every
   action's mandates.serves/defies/defers and console.error any function prefix that can
   never produce a mandate under any briefing. This must fire for a scenario authored
   against the old behavior and go quiet once the data and engine agree.
4. Re-check all three scenario files' mandate lists against the new engine and fix any
   remaining dead references.

Acceptance: INTJ on the-offer — decline now shows ni defiance in its receipt and take-it
shows an ni-backed subsidy; the dev assert is silent on all three scenarios; report the
before/after INFP and ENTJ credit-thief correct-now energies in your summary.
```

## Prompt 6 — Make rumination interest real

*Fixes: the economy is stateless; interest is printed but never accrues; Rest copy
describes a mechanism that doesn't exist (critical, product).*

```
The receipt prints rumination interest ("+2.1/tick") from ledger.js's resolve(), and the
Rest button's copy says "what was unanswered is still unanswered, and still charging" —
but nothing ever charges. In playground/main.js, S.stress changes only when an action
executes.

Implement accrual:
1. After an action executes with receipt.interest > 0, store the unresolved mandates and
   their per-tick interest on S. On a slow visible cadence (suggest one tick every 5
   real seconds, driven from the existing page clock — do NOT add a second rAF loop),
   add the interest to S.stress (clamped) and repaint vitals. The stress bar visibly
   creeping upward after a defiant choice IS the feature.
2. Show it: while interest is accruing, the vitals panel gets a small line naming what
   is charging ("ruminating: fairness — +2.1 per tick") using the mandate labels already
   in the receipt.
3. Resolve it: executing a later action whose stance serves/defers a charging mandate
   stops that mandate's interest (relief already exists in the resolver). Rest ends the
   day: energy refills, stress drops by the existing amount, but per the existing copy,
   unanswered mandates KEEP charging after rest — verify the copy and behavior now agree.
4. Grip interacts: accrual can push stress past 70 and trigger the existing checkGrip
   path between actions — call checkGrip after each tick.
5. Keep the resolver pure — all accrual state lives in main.js.

Acceptance: INFP on credit-thief, force "Say nothing" — stress then climbs on its own,
the vitals name the charge, choosing "Correct the record" afterwards stops it, and
letting it run eventually trips grip without another action.
```

## Prompt 7 — Keep the Vessel and vitals in view at the moment of execution

*Fixes: the payoff plays to an empty house — chamber flashes, hull tilt, and meter
animation happen ~1,800 px above the viewport when an action is clicked (critical, UX).*

```
Page geometry today: the action deck (#actionDeck) sits at document y ≈ 2,650; the
Vessel stage bottoms out at y ≈ 870 and its sticky wrapper (.stage-col) is scoped to
.build-grid, so by the Ledger zone both the Vessel and the vitals are far off-screen.
vessel.execute(receipt) flashes the paying chambers and tilts the hull — invisibly.

Restructure so the Vessel and vitals are on screen whenever the user can execute:
Recommended approach — a persistent dock: once a Vessel is committed, dock a compact
live view (the Vessel plus the two meter bars and quadrant chip) in a sticky/fixed aside
that is visible while #zone-voyage or #zone-ledger is in the viewport (IntersectionObserver
on the zones; hide the dock while the full stage is already visible to avoid doubling).
Implementation constraint: the page must not run two engine sets. Either (a) move the
existing #vesselStage element itself into the sticky container when scrolled past
(the Vessel class already re-places on ResizeObserver — verify chambers re-place
correctly after a reparent + resize), or (b) restructure the page so build, voyage and
ledger share a two-column layout with the stage column sticky for the whole span.
Choose whichever gives the simpler CSS; do not construct a second set of chambers.

Details: chamber tags and pressure pips must stay legible at the docked size; the
receipt's execute animation (flash, tilt, meter movement) must be verifiably visible
while clicking action cards; narrow viewports (≤ 820 px) may keep the current stacked
behavior but should at minimum scroll the vitals into view or mirror energy/stress as a
compact strip above the deck.

Acceptance: with a built Vessel, scroll to the deck — some live Vessel view and both
meters are on screen; clicking an action visibly flashes the paying chambers and moves
the bars without scrolling; mobile still has meter feedback at execution; no duplicate
engine instances (verify only four .chamber-canvas elements exist).
```

## Prompt 8 — Make the receipt live under briefing changes

*Fixes: stale receipt next to re-priced odds; reruns are the mode's point and the UI
resists them (moderate). Depends on Prompt 7's layout landing first.*

```
In playground/main.js, briefing changes call renderVoices() and renderDeck() — the deck
re-prices — but the executed receipt (#receipt) keeps its old numbers with no stale
indicator. The Briefing is the mode's replay engine ("same event, different past —
different event"); this is where reruns should pay off.

1. When briefing state changes and S.lastReceipt exists, re-resolve the SAME action for
   the current Vessel/scenario/briefing and re-render the receipt in place, live. The
   Fi valence slider dragging the receipt's numbers in real time is the target
   experience (it is the spec's §5.12 valence sweep as an interaction).
2. Make the change legible: when a re-resolve changes the energy total, flash the changed
   rows briefly (CSS transition, suppressed under prefers-reduced-motion) and update the
   forecast percentage in the receipt header ("its 16% road" may become "its 4% road").
3. Important state distinction: the live re-resolve updates the DISPLAYED receipt only.
   Do not re-charge S.energy/S.stress — the pool was charged by the executed action at
   its briefing at the time; add a one-line note when the receipt has drifted from what
   was actually paid ("re-priced for the current briefing").
4. If a counterfactual receipt (#receiptB) is visible, re-resolve it under the same rule.
5. Scenario switching keeps the existing hideReceipt behavior.

Acceptance: ENFP on credit-thief, execute "Correct the record", then drag the Fi slider —
the receipt's conviction subsidy, stress relief, and header odds update continuously;
the vitals do NOT change while dragging; the re-priced note appears; switching scenario
still clears the receipt.
```

## Prompt 9 — Make the counterfactual a beat, not a dropdown

*Fixes: the mode's climax is a small select that appears after execution with nothing
inviting it (moderate); Compare and permalinks were deferred out of v1.*

```
Today the counterfactual is a <select> labeled "Run this same action on" (fillCompare in
playground/main.js) that appears under the receipt. The spec calls the side-by-side
receipt "the single most persuasive artifact the Playground produces." Make it a beat:

1. After every executed receipt, render an inviting one-click prompt in the receipt
   column: "Run this on the Vessel that finds it cheapest →" — computed by resolving the
   same action across all sixteen types (allTypes() + resolve(); it is pure and fast)
   and naming the cheapest different type in the button label (e.g. "Run this on ESTJ —
   its cheapest home →"). Clicking renders the paired receipt as it does today.
2. In the paired view, highlight the deltas: for each line shared between the two
   receipts, mark which Vessel pays more (reuse the existing credit/debit colors), and
   add a one-line summary under the pair ("Same act. INFP pays 16.6 u where ENTJ pays
   11.9 u — and the expensive line moves from the confrontation to the diplomacy.").
   Generate that sentence from the receipts (biggest line item per side), not hardcoded.
3. Keep the full 16-type select as the secondary control it already is.
4. Permalinks (deferred from v1, §9): encode vessel code + scenario id + briefing state +
   action id + compare code into the URL hash on execution; on page load with a valid
   hash, rebuild that exact state (auto-build the type, load scenario and briefing,
   execute the action, show the compare). No server, no seed drift — the resolver is
   deterministic. Add a small "copy link to this receipt" affordance on the receipt.

Acceptance: execute any action; the cheapest-Vessel button names a sensible type and one
click produces the pair with deltas and the generated summary; copying the link and
opening it in a fresh tab reproduces both receipts.
```

## Prompt 10 — Finish Free Play (or its promises)

*Fixes: two of four promised degenerate states are unbuildable; four-judges has no
simulated consequence (moderate).*

```
Free Play (checkbox in playground/index.html, logic in src/playground/assembly.js)
currently lifts only the auxiliary legality check; deriveStack() still entails tertiary
and inferior via opposite(), which always flips attitude. Consequence: the all-extraverted
and all-introverted stacks promised by the spec (§2.5) and tested for by MALFORMED in
src/data/playground-data.js are unreachable — those two MALFORMED rows are dead code.
Also, four-judge stacks get a caption but no behavioral consequence (forecast, monologue
and receipts all run normally).

1. Under Free Play only, unlock all four slots: after dominant and auxiliary are placed,
   the tertiary and inferior become free choices from the remaining shelf (no entailment,
   duplicates still refused). The legal-path behavior (entailment beats, ghost slots)
   must remain exactly as-is when Free Play is off. Update the prompts/captions for the
   free path (copy in playground-data.js).
2. Make the two attitude-degenerate states show their promised malfunction:
   - all-extraverted: the below-Surface half of the canvas renders visibly vacant (the
     Vessel already rows by attitude, so this mostly falls out — verify) and the two
     interior briefing instruments show their inert note; add the MALFORMED caption.
   - all-introverted: every action line is a translation (route() already taxes at τ or
     τ_orphan — verify the receipts show it) and the caption names the toll.
3. Give four-judges a behavioral consequence to match its caption ("every read is
   confident, and none of them is informed"): in renderDeck, when the stack has no
   perceiving chamber, render the forecast percentages visually over-confident but
   flagged (e.g. strike-through or a "blind odds" badge with the caption's reasoning),
   and have every receipt add a small "unsampled world" stress item (implement in the
   resolver as an explicit, documented Free-Play-only rule; keep it pure).
4. The four-perceiver dead deck already works — do not regress it.

Acceptance: all four MALFORMED archetypes are buildable in Free Play and each shows its
distinct consequence; legal building with Free Play off is unchanged (build ENFP by hand
and confirm entailment beats still play).
```

## Prompt 11 — An emergency floor for salience

*Fixes: the flagship claim — "a sensory emergency can make an INTJ's inferior Se yelp
first" — is false in the shipped tuning (moderate). Changes monologue order only.*

```
src/playground/monologue.js computes salience = RANK_W[rank] × hookIntensity × affinity
with RANK_W.inf = 0.25. In kitchen-fire — the scenario whose own header says it exists to
stress-test this — the INTJ order is Ni 0.90 → Te 0.49 → Se 0.39 → Fi: the dominant
always leads, and the module's header comment plus playground-spec.md §4.4 both promise
the opposite for exactly this case.

Implement an emergency override: when a function's hookIntensity × affinity crosses an
emergency threshold (suggest ≥ 1.2, reachable only by high intensity times high
affinity — in kitchen-fire, Se hits 0.98 × 1.6 = 1.57), its salience gets a floor above
normal rank suppression (suggest: bypass RANK_W below a floor of 0.8, or
max(RANK_W[rank], 0.8) for that read). Requirements:
1. INTJ on kitchen-fire: Se speaks FIRST, still voiced in the inferior register
   (fragments) — the design is "loudest first, in a small cracked voice."
2. INTJ on credit-thief and the-offer: order unchanged (no emergency there — verify).
3. ESTP on kitchen-fire: Se still first (dominant; trivially true).
4. Constants live in playground-data.js with a one-line comment explaining the rule.
5. Update the header comment in monologue.js if the mechanism differs from what it
   currently claims; verify the reads() ordering by running the module for INTJ, ISTJ,
   ESTP, INFP on all three scenarios and include the orderings in your summary.

This changes monologue order only — the economy is untouched.
```

## Prompt 12 — Make grip a real state

*Fixes: grip is a label — capsize plays but the deck, prices, and voices are unchanged
("Rest, or watch it steer" offers nothing to watch) (moderate). Implements the §5.10
deferral. Changes economy behavior; run before Prompt 14.*

```
Today checkGrip in playground/main.js flips capsize at energy < 20 ∧ stress > 70, writes
a caption, and nothing else changes. playground-spec.md §5.10 specifies the deferred
behavior. Implement it:

1. Second trigger: any single executed action whose stress total exceeds 35 also trips
   grip (in addition to the pool condition).
2. Grip pricing: while S.grip is true, resolve() prices the inferior's multiplier at 1.0
   instead of 4.0 ("in the grip, the crude thing is the easy thing"). Keep the resolver
   pure: pass grip state in as an argument or context field, never read globals.
3. Grip deck: while in grip, renderDeck re-orders and re-badges: actions whose signature
   is majority-owned by the inferior's element rise to the top marked as compulsive
   ("cheap right now — and crude"), and their outcome lines render a degraded variant.
   Author one degraded outcome line per action in the three scenario files (a short
   "…done badly" rendering of the same act) — this is content work, keep the register.
4. Monologue inversion: while in grip, the inferior speaks first and fluently (dom
   register) and the dominant renders in fragments (inf register) — rank-register swap
   for those two only, in reads().
5. Recovery: replace the bare Rest behavior while in grip with a small recovery pair per
   the spec — the dominant's recharge verb and an auxiliary re-engagement (author one
   line each per function in playground-data.js; generic verbs are fine for v1). Choosing
   one rights the capsize slowly and applies a hangover: until the next Rest, all
   receipts carry a small visible "hangover" surcharge line (documented constant).
6. Grip remains a consequence, never a game-over: the user can still choose any action.

Acceptance: drive an INFP into grip (repeat "Say nothing"); the deck re-orders with the
Te-flavored action cheap and badged; voices invert; recovery rights the hull and
subsequent receipts show the hangover line until Rest.
```

## Prompt 13 — Polish pass: quadrant, receipt separators, small a11y

*Fixes the remaining minor findings in one sweep.*

```
Four small fixes in the Playground:

1. Quadrant mislabel (src/data/playground-data.js, quadrant()): the 50/50 split labels
   energy 39 / stress 47 "Settled — spent, and at peace with it" one point before "Grip
   risk". Add a neutral band: when either meter is within ~8 points of its threshold,
   return a new 'strained' chip ("running down — watch the next bill") instead of
   flipping between opposed labels; keep the four existing quadrants outside the band.
2. Receipt separator collision (playground/main.js renderReceipt): stress items join with
   " · " but the exposure label itself contains "·" ("exposure · 9 watching"), so the
   line reads as three items. Change the item label to use different punctuation
   ("exposure (9 watching)") or join items with a different separator; itemization must
   be unambiguous.
3. Keyboard: the tertiary/inferior confirm targets in the Assembly are non-focusable
   divs (.aslot with a click handler). Make seated-ghost slots real buttons (or add
   tabindex/role/keydown) so Enter/Space confirms; visible focus state per the site's
   conventions.
4. Chamber navigation guard (playground/main.js onChamberClick): clicking a chamber
   navigates to the function page instantly, discarding the whole session. Open function
   pages in a new tab from the Playground (target _blank on an anchor, or
   window.open) — no confirm dialog needed if state is preserved by not navigating.

Acceptance: quadrant chip shows the band label near thresholds; a receipt with exposure
reads as distinct items; the Assembly is completable start-to-finish with keyboard only;
clicking a chamber leaves the built Vessel intact in the original tab.
```

## Prompt 14 — Truth pass: re-sync the spec with the code

*Must run last — Prompts 5, 6, 11, and 12 changed numbers and behavior the spec prints.
Fixes: §5.12 sweep drift; stale spec claims (spine fallback, sixteen silhouettes,
"annotated static flow arrows"); §9 completeness.*

```
playground-spec.md declares that "when the implementation and this document disagreed,
the implementation won and this table was regenerated" (§5.12). Make that true again:

1. Regenerate every computed figure in §5.12 from the current code: the INFP/ENTJ
   correct-now receipts, the forecast percentages, the quiet-replan figures, and the Fi
   valence sweep table. (Before this fix pass began, the sweep already disagreed with
   the code: actual correct-now ran 17/16/13/11/9/8% against the printed
   16/16/15/13/11/8%.) Compute them by importing ledger.js and the scenario in a small
   throwaway script — do not hand-copy from the UI.
2. Audit the spec's shipped-behavior claims against the code and fix each by EITHER
   implementing the small missing piece or amending the spec to describe what ships,
   whichever is honest and cheap. Known stale claims to check: §3.9's narrow-viewport
   "spine fallback" (the CSS comment exists; the spine does not — the mobile layout is
   the same 2×2, which works; amend the spec), §3.4's "sixteen silhouettes" (the fixed
   column layout yields two geometries; amend or note), §7.6's reduced-motion "annotated
   static flow arrows" (a frozen frame ships; either add a static annotation layer under
   REDUCED or amend), §4.4's inferior-first claim (now true if Prompt 11 landed —
   confirm and cite the mechanism).
3. Append a dated §9 entry summarizing this fix pass: what each prompt changed in model
   behavior, with the new worked-example numbers.
4. Re-verify the three §5.12 "teachings" prose claims still follow from the regenerated
   numbers (the conviction-subsidy gap, the mirrored expensive line, the sweep crossing
   near −0.4) and adjust the prose if the crossings moved.

Acceptance: a clean diff of playground-spec.md in which every number in §5.12 reproduces
from the current resolver, every shipped-behavior claim matches the app, and §9 records
the pass.
```
