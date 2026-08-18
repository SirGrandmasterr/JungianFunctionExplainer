# Playground Rebuild — Structural Brief

**Phase:** structure only. No colour, no type scale, no motion curves, no code.
**Worked type throughout:** ISTP — Ti / Se / Ni / Fe.
**Worked scenario throughout:** *The Credit Thief* (sprint review; a colleague is presenting your architecture as their own; promotion list closes in six days).
**Date:** 2026-08-18

---

## 0. Three mechanics settled before drawing

These were genuinely ambiguous in the request. They are now fixed, and everything downstream depends on them.

| # | Question | Decision |
|---|---|---|
| M1 | What does the seismograph x-axis measure? | **Beat spine + live micro-motion.** The x-axis is indexed by *beats* (discrete simulation steps), not wall-clock seconds. Between beats the trace still moves — decay, jitter, monologue streaming — so the instrument reads as alive without penalising a user who reads slowly. The hover forecast is drawn in a reserved band to the right of `NOW`. |
| M2 | How long is one scenario run? | **One decisive action.** Briefing, then hover/compare, then one commit, then full resolution. |
| M3 | Where does Whole-Human live on the main view? | **Persistent thin band**, docked below the four function rows, always visible, expandable in place into the full S6 apparatus. |

### M2 forces one reconciliation, and it is load-bearing

The request says Loop and Grip "trigger automatically once the cumulative cost of committed actions crosses a threshold." With one commit per scenario, nothing accumulates *inside* a scenario. The fix is not to weaken the rule; it is to move the accumulator up one level:

> **The scenario is the beat. The session is the sequence.**

A Vessel (the assembled stack) persists across scenario runs within a session. It carries stress, spent capacity, and state. Scenario 1 is committed and billed; Scenario 2 is entered by a psyche that is already tired. Loop and Grip trip on **session-cumulative** load, and once tripped they are *carried into* the next scenario — which is precisely when the alleviate/aggravate action cards appear in that scenario's deck. Manual toggles remain available at all times as the teaching override.

This also rescues the seismograph from being empty on a one-commit screen. A single scenario run generates **eight beats**, not one:

```
 +-- intake --------------+  +- dwell -+  +- commit -+  +-- aftermath ------+
 b1    b2    b3    b4         (no beats)     b5          b6      b7      b8
 Ti    Se    Ni    Fe         decay only     ACTION      impact  spend   settle
 the stimulus lands on        + hover        lands
 each function, in            forecast
 stack order
```

Plus the retained tail of previous scenario runs in the same session. So the trace has history on the very first screen, and it has history that *means* something: you are watching the stimulus land on each function in stack order before you are asked to choose.

---

## 1. Why a Playground of this kind fails users

Five failure modes, in the order they bite.

**F1 — Four-panel democracy teaches the opposite of the content.**
The obvious layout gives each function equal area, because the four are conceptually parallel objects. But a stack is not parallel — it is *ordered*, and the order is the entire lesson. Equal panels say "these are four peers." Users then report the screen as "four boxes of noise," which is an accurate description of what equal weighting communicates.

**F2 — Everything is live, so nothing is an event.**
Twenty continuously animating signals give the eye no rest state, and without a rest state there is no change detection. A seismograph that is always wiggling cannot show you a spike. Liveness has to be *rationed*: quiet baseline, loud event. A tool that animates constantly is not more alive, it is less readable.

**F3 — Forecast and record render in the same channel.**
If hover-preview draws in the same ink as committed history, the user cannot separate what they *have done* from what they *might do*. That distinction is the only thing separating a simulator from an animated diagram. It must be carried by ink treatment (solid versus dashed/hatched) and by *position* (forecast lives in a reserved band past `NOW`), never by colour, and never by opacity alone.

**F4 — Absolute numbers with no felt referent.**
"Stress 0.62" teaches nothing. Every readout must be comparative: against this function's own baseline, against the other three right now, and against the pre-hover state. The delta is the content; the level is context.

**F5 — The aggregate arrives as a second thing to learn.**
Put Whole-Human behind a tab and it becomes another screen to master rather than the payoff of the first one. The lesson "you are one organism with one energy supply, not four parts" only lands if part and whole are visible in the same glance.

**And underneath all five: the interface answers a question nobody asked.** No user has ever wanted to know Ti's stress scalar. They want to know *if I do this, who pays?*

---

## 2. What the interface must answer at a glance

Three questions. Everything else is on demand.

| | Question | Answered by | Must be readable in |
|---|---|---|---|
| **Q-A** | **Who is running this?** Which function is actually driving the response right now. | The involvement spine — one continuous full-height stacked bar beside the four rows. | under 1 second, peripherally, without reading a number |
| **Q-B** | **What would this cost, and who pays?** | Hover forecast: per-row deltas in the reserved forecast gutter, all four visible simultaneously. | under 2 seconds, without moving the pointer off the action |
| **Q-C** | **How close is this psyche to breaking?** | Two margin meters in the scenario header: distance-to-Loop and distance-to-Grip, plus the state chip. | under 1 second, always on screen |

The honest answer to "what is the user actually looking at in this second" is therefore:

- **At rest:** the involvement spine and the dominant row's monologue. Two things.
- **On hover:** the four forecast bands, scanned top to bottom as one column. One thing, read four times.
- **After commit:** the resolution receipt. One thing.

At no point are twenty signals the object of attention. Twenty signals are *present*; two or three are *foregrounded*. That is the whole density strategy, and it is enforced by fidelity tiers rather than by shrinking.

---

## 3. Three layout strategies for S3

Genuinely different, not variations on one idea.

### Strategy A — **The Ledger** (rank-ordered rows)

Four full-width horizontal bands, stacked in stack order: dominant at the top, inferior at the bottom. **Row height varies by rank** (dom 186px, aux 156, tert 122, inf 100) so hierarchy is physical, not decorative. Within each band, a fixed column order: identity + glyph, monologue stream, seismograph, scalar readouts, forecast delta gutter. The action deck is a right rail; Whole-Human is a band across the bottom.

- **Strengths.** Reading order *is* stack order — the lesson is the layout. Comparing one readout across four functions is a straight vertical scan down a fixed column, which is the single easiest comparison the human visual system performs. Degrades to phone by collapsing each row to a strip. The forecast band can be a literal column, so hover deltas line up.
- **Weaknesses.** Four wide rows read as a spreadsheet. The "one organism" gestalt is weak — rows look independent. It is not a beautiful screen.

### Strategy B — **The Instrument Cluster** (axis-crossed / radial)

The two axes (perception, judgment) drawn as a physical cross. The four functions sit at the four arm ends, positioned by attitude (extraverted outward, introverted inward) and by rank (distance from centre). The centre is the Whole-Human. Involvement is *literal geometry*: the centre of mass shifts toward whoever is doing the work. Seismographs are short arcs along each arm. Monologue merges into one shared centre column with per-line attribution.

- **Strengths.** Involvement ratio and aggregation come free — they are the geometry, not an extra widget. Loop is spatially obvious (a lit path from dom to tert that visibly skips the aux arm). Grip is spatially obvious (the inferior arm swallowing the centre). It is the memorable image, and it matches the existing watershed/Vessel metaphor in `DESIGN.md`.
- **Weaknesses.** Radial layouts are poor at precise comparison and hostile to text. Four simultaneous monologue streams cannot live on the arms, so they must merge — which discards a stated requirement (*per-function* text stream). Collapses badly at 390px. Most expensive to build.

### Strategy C — **The Console** (fixed spine + one focus panel)

A permanent left spine of four compact strips (glyph, rank, five micro-readouts at low fidelity, always visible). One large focus panel to the right renders exactly one function at full fidelity: full monologue, full seismograph, labelled readouts. Focus follows pointer/keyboard. On hovering an action, the spine shows deltas for all four while the focus panel shows the full forecast for the focused one.

- **Strengths.** Solves density outright: 20 signals become 4x5 low-fidelity plus 1x5 high-fidelity. Full-length monologue is actually possible. Best phone story (spine becomes a top rail).
- **Weaknesses.** It is not *simultaneous*, and "watch the stack behave" is the product promise. You cannot see four inner voices argue if only one is legible. Focus-follows-hover also collides with hover-on-action-cards — two hover semantics competing on one screen.

### Recommendation: **A — The Ledger**, with two grafts

Adopt A, and graft in the best part of B and the best part of C:

1. **From B — the involvement spine.** One continuous, full-height stacked bar in the gutter between the rows and the action rail, segmented into four proportional blocks. Because the *rows* have fixed heights set by rank and the *spine segments* have variable heights set by involvement, the mismatch between them is itself the readout: **when a spine segment is taller than its row, that function is working above its station.** A grip is then visible from across the room — the shortest row owns the tallest segment. This idea exists only because A and B were forced together, and it is the strongest single decision in this document.
2. **From C — rank-weighted fidelity.** The dominant row runs at full fidelity by default (5 monologue lines, tall seismograph, labelled readouts); aux at 3 lines; tertiary and inferior at 2 lines with unlabelled micro-meters. Any row promotes to full fidelity on focus. Density is solved by *fidelity tiering*, not by shrinking everything uniformly.

**What A trades away.** The visceral one-organism gestalt that B gets for free, and the beauty. The Ledger is honest, legible, and slightly bureaucratic. Some gestalt is bought back by the Whole-Human band and the continuous involvement spine, but S3 will never be as strong an *image* as the radial cluster.

That trade is accepted deliberately, and partly repaid: **the radial figure from Strategy B is not discarded — it becomes the Whole-Human expanded view (S6) and the stack-assembly figure (S1)**, which are exactly the two places where gestalt matters more than precise comparison. B is not the loser of the comparison; it is relocated to where it is correct.

---

## 4. The density doctrine, stated once

Four rules, applied to every screen that follows.

- **D-1 — Rank-weighted fidelity.** Signal fidelity is proportional to stack position. The inferior function gets 2 lines and 3 micro-meters at rest. It gets everything on focus, and it *takes* everything during a Grip. Fidelity is dynamic and driven by the simulation, not by the user's window size.
- **D-2 — Rationed liveness.** At rest, exactly one thing animates continuously: the dominant monologue stream. All other motion is event-driven — a beat lands, a trace steps, a meter moves, and then everything is still again. Stillness is what makes the spike readable. (Fixes F2.)
- **D-3 — Reserved forecast band.** The rightmost 28% of every seismograph, and a dedicated right gutter on every row, are permanently reserved for forecast. They are empty at rest. Nothing committed is ever drawn there. Hover fills them; commit *moves* their contents left across the `NOW` line into history. (Fixes F3.)
- **D-4 — Deltas over levels.** Every numeric readout renders `level` in small type and `delta` in large type whenever a delta exists. At rest, level is large and delta is absent. (Fixes F4.)

---

## 5. Deferral register

Stated here so nothing falls between the phases.

**Deferred to the visual-design phase (next):** all colour assignment and the function/axis palette mapping; type scale and font selection; the rendered glyph artwork (this document specifies only slot, size, and precedence); motion curves and easing; texture and depth treatment; the visual language for Loop and Grip beyond "hatch and rewrite"; iconography for alleviate/aggravate; the tone of voice for empty and error states.

**Deferred to implementation:** exact tick rate tuning inside the stated envelope; canvas versus DOM for the monologue caret; the persistence layer (localStorage or none); keyboard shortcut assignment; the concrete monologue text corpus; scenario authoring tooling.

**Explicitly not deferred — decided here and binding on both later phases:** the beat model (M1); one-commit scenarios with session-level accumulation (M2); the aggregate as a persistent expandable band (M3); the involvement spine as the primary answer to Q-A; the forecast band reservation (D-3); the aggregation formulas in the build spec section 4; the state machine in D3.
