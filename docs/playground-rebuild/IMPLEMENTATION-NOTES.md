# Implementation Notes — where the build departed from the spec, and why

The structure phase produced `BUILD-SPEC.md` before any code existed. Building it surfaced
defects in that spec that could not have been found on paper. This file is the delta record.
**Where this file and `BUILD-SPEC.md` disagree, this file is correct** — the code matches it.

Worked type throughout: ISTP (Ti / Se / Ni / Fe). Verified in-browser end to end.

---

## A. Defects in the spec, found by building it

### A1 — Grip was unreachable. §5.1 gated it on the dominant's private capacity.

The spec said `Strained → Grip` requires `capacity_dom <= 15`. In five punishing runs the dominant
sat at **capacity 91, stress 0** while the inferior was at **−218 capacity, 93 stress**. That is not
a tuning problem, it is the model working correctly: the dominant is the cheapest machinery
(`cost 0.55`) and regenerates fastest (`decay 1.30`), so its private meter is the *last* thing to
empty. The condition could essentially never fire, and only the manual toggle could produce a Grip.

Gating on a private meter also contradicts the spec's own §4.1, which argues that the reservoir is
**shared** — "libido is one reservoir with four draws". Exhaustion is a property of the organism.

**Fixed:** both grip routes now gate on aggregate reservoir energy.

```
Route A (violation): S >= 78 && energy <= 18 && the action violated a top-two mandate
Route B (debt):      S >= 62 && debt >= 60 && energy <= 12
```

### A2 — The debt route into Grip was promised in prose and missing from the conditions.

`D3.svg` and `S8.svg` both say a grip is "usually entered from debt, not from stress alone", but
§5.1's condition never mentioned debt. Route B above is that missing edge. With it, the automatic
path now runs: `balanced → strained (stress 62) → grip (debt 104 on a reservoir at 0%)`, and the
hover forecast warns on the commit *before* it trips.

### A3 — Routing order was wrong: the axis partner was tried before the sibling.

§3.3 ordered routing `self → axis partner → same class → dominant`. That routed **Te → Fe in an
ENFJ** and **Se → Ne in an ENFP**, both of which are absurd when the obvious target is carried.

The **sibling** — same element, same job, flipped attitude (Te→Ti, Se→Si) — is literally "same job,
different method" and deserves the lowest surcharge. The axis partner keeps the job but changes the
element entirely, which is a bigger leap. A legal stack carries each element exactly once, so the
sibling is almost always available.

**Fixed:** `self 1.00 → sibling 1.35 → axis 1.60 → same class 1.75 → dominant 1.90`.

### A4 — A fixed likelihood utility inverted the central teaching mechanic.

With the spec's single utility function, a Grip deck came out **alleviate 42% / aggravate 4%** — the
exact opposite of the mechanic the whole state is built to teach. The cause: an aggravating action
generates enormous stress, and a fixed utility weights that at full price.

But a psyche in a Grip is *not* pricing its accruing stress correctly — that mis-weighting is the
phenomenon, not a bug to model around. Utility weights are now state-dependent:

| state | stress weight | pleasure weight |
|---|---|---|
| balanced / strained | 1.00 / 1.05 | 1.00 |
| **loop** | **0.30** | **1.90** |
| **grip** | **0.20** | **2.40** |
| recovery | 1.35 | 0.80 |

Now reads **aggravate 35–67% / alleviate 1–11%**, with the forecast telling the truth the card's
wording conceals. Per-function stress is also clamped to 100 before entering the utility, or a
single 300-point figure saturates the softmax.

### A5 — Involvement could land on exactly 0%, which S7's own legend forbids.

`S7.svg` callout 6 states that a zero-height spine segment "would read as *removed from the stack*,
which is false and would teach the wrong thing". But `w = share^0.85 · affinity · bias` returns
exactly 0 when an action makes no demand of a function — and "Correct the record" put Ni at **0%**.

**Fixed:** an *attending* floor, proportional to rank — `w = (share^0.85 + 0.15 · rankWeight) · …`.
A function the action does not use is still present and still watching. Because the floor is
rank-proportional it never reorders the ratio; it only keeps every segment drawable and labelled.

### A6 — A Grip in a scenario that starves the inferior was not inferior-dominant.

Running an Fe grip inside *The Offer* (`fe.audience = 0`, `affinity.fe = 0.4`) produced a spine of
Ti 23% / **Ni 27%** / Fe 25% — a "grip" in which the hijacking function was not even the loudest.

Loop and Grip are **endogenous**: the psyche's own machinery seizing, not a response to what the
situation offers. An Fe grip in a room with no audience is still an Fe grip.

**Fixed:** for the ranks a state is *about* (loop → dom+tert, grip → inf), situational affinity may
lift the driving function but may not suppress it (`affinity = max(affinity, 1)`). Grip now reads
Fe 45%, and the "working above its station" tick fires.

### A7 — `tierFor` did not implement the tertiary promotion S7's legend describes.

`S7.svg` callout 12 says the tertiary is promoted to MID under Loop. Implemented. Also: `BYPASSED`
now wins over focus, because a bypassed auxiliary that reopens on hover would contradict the state.

---

## B. Deliberate departures from the spec

### B1 — Glyph slots are inline SVG marks, not the canvas engines. (§7, S5 callout 2)

The spec says the slot wraps the engine from the function's own info page. Those engines are
400–1500-line particle simulations that **each own a `requestAnimationFrame` loop**. Four of them at
22–32 px would be four extra render loops producing four grey smudges — the particle detail is
invisible below roughly 90 px, and the extra loops break the one-clock rule outright.

The slot renders an SVG mark built on the same silhouette the engine is organised around: crisp at
any size, zero per-frame cost, one shared clock preserved. Recognition at 32 px is carried by
outline, not by particles. Every mark is distinct in **outline**, so the four stay separable in
greyscale and for colour-blind readers. The full engine remains right above ~120 px.

### B2 — Ten canvases with one clock, not two page-level layers with five viewports. (§7)

The spec asks for one `HistoryLayer` and one `ForecastLayer`, each carrying five viewports. That
requires absolutely positioning two canvases over the ledger grid and re-measuring five viewport
rects on every resize, scroll and row-height change — fragile, for no measurable gain at this scale.

Implemented as two stacked canvases per seismograph (10 total), driven by **one** `requestAnimationFrame`
loop. The invariant that actually mattered is preserved and was verified empirically:

> hovering repaints the forecast canvases only; committed history is provably unchanged, and the
> forecast layer is 0% inked at rest.

Ten canvases with five independent rAF loops — the failure mode D5 names — is still prevented.

### B3 — The beat queue runs on `setTimeout`, not on the animation frame. (§6.2)

Originally both timescales shared the rAF loop. A page that is not compositing (background tab,
hidden pane) then **strands the run**: intake beats never fire and the action rail stays locked
forever. Beats are ledger events, part of the accounting, and must not depend on compositing.

Split: `after()` schedules beats on `setTimeout`; the rAF loop drives only the 20 fps sub-beat pass,
where stopping while hidden is exactly the desired behaviour.

### B4 — Seismographs re-check their size before painting real data.

Rows are constructed before they are laid out, so the constructor's `resize()` saw a zero rect and
bailed, leaving every canvas at its default 300×150 backing store — nothing was ever drawn.
`ensureSize()` now re-checks cheaply before any paint carrying real data. It is deliberately **not**
called from `tick()`, which would read layout 100 times a second across five canvases.

### B5 — Narrow viewports withdraw rather than shrink. (S10 descoped)

Per the instruction to optimise for desktop/laptop, S10's accordion and press-and-hold forecast are
not built. Below **1120px** the involvement spine and the fixed-height Ledger are withdrawn and the
rows stack, with an on-screen statement of what was withdrawn and why. This follows the structure
phase's rule that lower fidelity **removes** components rather than shrinking them — it does not
pretend the four-row Ledger works at phone width.

### B6 — The text corpus uses the §9.4 recommendation.

Implemented as recommended: action voices keyed `(function, relation, state)` — about 150 authored
lines total — while the **intake** lines come from each scenario's existing authored `monologue`
block, resolved by its interior hook. A new scenario costs zero corpus lines.

---

## C. Reconciling with the authored scenario data

`src/data/scenarios/*.js` predate the model. `scenario.js` adapts rather than rewrites:

- `mandates.defies` → `violates`.
- `gates[fn]` is sometimes a number, sometimes a table keyed by the interior hook; resolved at Enter
  and clamped to `[0.6, 1.8]`.
- `interior.fi.valence` → `rings-true` / `neutral` / `rings-false` at ±0.3.
- Predispositions are projected for all **eight** functions, so any vessel can enter any scenario.
- **Mandate refs route exactly like signature demands.** An ISTP has no Fi, so `fi.fairness` routes
  to Ti — the ISTP feels a credit theft as a *principle* violation rather than a values violation.
  Same stake, different machinery. This falls out of the routing rule rather than being special-cased.

---

## D. What was verified, and how

Driven end to end in-browser, not by inspection:

| Claim | Result |
|---|---|
| Type algebra: Ti → exactly {Ne, Se} legal | ✅ |
| Gates resolve as the wireframes predicted | ✅ Ti 1.10 · Se 0.90 · Ni 0.70 · Fe 1.20 |
| Four intake beats fire in stack order | ✅ beat 4, Fe already at 23 stress vs 4/4/5 |
| **Hover is exactly reversible** | ✅ state byte-identical after leave, no beat consumed |
| Involvement sums to exactly 1 | ✅ 100.00 |
| Hover never repaints committed history | ✅ ink unchanged; forecast 0% at rest → 22% on hover → 0% on leave |
| Grip swaps row height allocations | ✅ dom 186→100, inf 100→186, labels stay in stack order |
| Loop collapses the auxiliary to a labelled sliver | ✅ 3.3%, stream stalls mid-sentence |
| Automatic state machine across a session | ✅ balanced → strained (62) → grip (debt 104, energy 0%) |
| Forecast warns before a threshold crossing | ✅ |
| Alleviate vs aggravate contrast | ✅ relief +7.5 stress / −3.1 pleasure; spiral +17.1 / **+23.6** |
| Counterfactual prices the same action per type | ✅ ISTP 86 · ENFJ 101 · ESTP 61 · **ENFP 196** (Si inferior pays 189) |
| Keyboard: arrows move candidate, Esc clears, Enter commits | ✅ |
| Focus promotes a LOW row to FULL and reverts | ✅ |
| Console errors across all four routes | ✅ none |
| Production build | ✅ 111 kB / 37.9 kB gzipped |

The counterfactual line is worth reading twice: the identical action costs an ESTP 61 and an ENFP
196, with the ENFP's inferior Si absorbing 189 of it. Nobody was blocked. That is the thesis.

---

## D2. Defects found by finally *looking* at it

The earlier pass verified behaviour and geometry programmatically but never rendered the page.
Capturing it (see §F) surfaced five defects that no amount of DOM probing would have caught.

1. **Rows overflowed the fixed-height Ledger and spilled over the Whole-Human band.** A grid item's
   automatic minimum size is its content, so `.pg-rows` sized to intrinsic height and the
   `flex-grow` proportions never bound. `min-height: 0` on all three ledger columns. This one
   destroyed the central premise — rank encoded as proportional row height — while every numeric
   probe still reported correct `flex-grow` values.
2. **The delta gutter rendered `0 / 0 / 0 / 0` at rest instead of being empty.** `[hidden]` is a UA
   rule at author-origin-zero, so `.d-cell { display: flex }` beat it. Added a global
   `[hidden] { display: none !important }`. This broke rule **D-3** — the gutter is reserved and
   *empty* until hover — which is the whole reason hover reads as an answer rather than a refresh.
3. **The Whole-Human bar had six children and five grid columns**, wrapping "Expand" onto its own row.
4. **Clearing the candidate from outside the rail left `ActionRail.active` stale**, so re-hovering the
   same card was silently ignored — reachable in the real UI by pressing Escape and hovering back.
   Added `ActionRail.sync()`, reconciled from `RunView.refresh()`.
5. **Odds collapsed to `0%` on every authored card** in Loop/Grip. Softmax temperature 22 → 30, and
   a genuinely tiny probability now prints `<1%` rather than a rounded `0%` that reads as broken.

Also tightened: the glyph *name* is now a FULL-tier-only component (a Grip-demoted dominant is
~100px tall and clipped it), the newest stream line clamps at 4 lines rather than 2 so an authored
sentence can finish, and the impressions-in/expressions-out block was rebuilt as a mirrored grid
around the skin line.

---

## F. How the page was captured without a working screenshot path

Neither screenshot surface was available — the in-app Browser pane was not compositing and the
Chrome extension was not connected. Since `<canvas>` bitmaps and SVG rasterisation do not require
compositing, the page was captured in-process:

1. serialise `#app` with `XMLSerializer`, embed it in an SVG `<foreignObject>`;
2. inline every `cssRules` block, **plus** the resolved custom properties from
   `document.documentElement` — the wrapper is not `:root`, so otherwise every `var()` resolves to
   nothing and the page renders black-on-black;
3. **disable all animations** — a static rasterisation renders CSS animations at time zero, and
   `.pg-screen` starts at `opacity: 0`, so the first attempts came out blank but for the canvases;
4. draw the SVG to a canvas, then composite each live `<canvas>` bitmap over its measured rect
   (replaced elements render empty inside `foreignObject`);
5. `POST` the data URL to this project's own dev-only `/__shot` endpoint, which writes a PNG to
   `.shots/` (already git-ignored).

Two constraints worth recording: a **Blob URL taints the canvas** so `toDataURL` throws — the data
URL form is required; and `vh` units resolve against the SVG viewport, so heights in a capture are
not the heights in the browser. Canvas positions also come from the live layout, which is stale
while the page is not compositing, so a state change can draw traces one row off. Those are capture
artifacts, not product defects.

---

## E. Still open

- **§9.2 persistence** — still none. A vessel dies with the page. `sessionStorage` remains the
  recommendation, undecided.
- **§9.6 non-visual representation** — seismographs carry an `aria-label` with level and trend; the
  trace itself is `aria-hidden`. Still a floor, not a solution, and still needs a dedicated pass.
- **Automatic Loop is hard to reach** with the current three decks, because starving the auxiliary
  below 8% involvement for two consecutive commits rarely happens by accident. This is arguably
  correct — you cannot loop without genuinely bypassing the auxiliary — and the manual toggle
  covers teaching. If it should be reachable by play, the fix is authored actions with
  auxiliary-free signatures, not a lower threshold.
- **Constants are unchanged tuning surface.** Nothing in §3–§5 was derived from typological theory;
  the numbers were chosen for legibility in a short session.
