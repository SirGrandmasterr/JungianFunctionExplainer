# Function-page fixes — proposal

*2026-08-28 · covers the three defects in `function-page-fix-prompt.md`. Findings and the
deliberately-not-fixed list are at the bottom.*

---

## Problem 1 — Zone D on a phone

**Measured first.** At 375×812, pressing a scenario button on `/fi/` leaves the chamber
527 px below the fold and the meters 296 px below it; on `/fe/` the chamber is ~1,100 px
away. The sticky header contributes 116 px to every frame because the nav wraps to three
rows at that width.

**Approaches considered.**

1. *Landscape-locked lab band* (the suggested starting hypothesis): chamber beside the
   scenario list even in portrait. At 375 px this gives each column ~180 px — the chamber
   becomes a postage stamp and the scenario subtitles wrap to unreadability. Rejected for
   portrait; **adopted for landscape phones**, where it is exactly right.
2. *Bottom-sheet controls over a full-bleed chamber*: the most app-like, but it fights the
   page scroll model, needs a drag gesture vocabulary the site doesn't have, and puts a
   translucent layer over five very different simulations. Rejected as over-engineered.
3. *Sticky live-cluster* (chosen): on ≤960 px the chamber, the state chip + stress/pleasure
   meters, and the narration are gathered into one pinned cluster (`.lab-pin`) that sticks
   under the header while the controls scroll beneath it. Act below, watch above, always in
   one frame. In short-landscape viewports the same cluster pins as a right-hand column
   beside the scrolling controls (approach 1's geometry, where it works).

**Why 3.** It is the only layout in which *every* control — Se's slider, Si's ruling pair,
Fe's gated Reconciliation, all six Fe scenario buttons — keeps its consequence on screen
without shrinking any lab below legibility, and it needs no per-lab special casing: the
cluster is assembled from selectors every page already has (`.verify-stage`, `.meters` /
`.telemetry > .cog-state, .meter`, `#verifyNarr`).

Mechanics:

- One shared module, `src/shared/lab-layout.js`, reparents those nodes into the cluster
  when `(max-width: 960px)` matches and restores them exactly when it stops matching
  (rotation-safe). Pure CSS cannot do this — the meters live inside the panel's subtree —
  and restructuring the desktop HTML to avoid JS would have changed the desktop layout,
  which is explicitly not to regress.
- The 460 px canvas becomes viewport-aware everywhere: the canvas now fills its stage
  absolutely; the stage is `clamp()`-sized (`33vh` band on mobile, `56vh` cap on desktop).
  The engines already size themselves from the canvas box via ResizeObserver, so no engine
  changes are needed for layout.
- The header nav becomes a one-row, self-scrolling strip under 720 px (edge-faded so it
  looks scrollable), which returns ~60 px of frame to every zone. The page itself never
  scrolls horizontally.
- Deep readouts (Ne threads/breadth, Se lock/clarity, Si match/cost, Fe trust-gap twin,
  the cross-listens) stay in the scrolling flow: they are enrichment, and the hard
  invariant is chamber + both meters. The narration joins the pinned cluster, height-capped.

**Touch affordances** (part of this defect): every engine's pointer interaction hangs off
one `pointermove` handler. Each engine now also listens to `pointerdown`, canvases get
`touch-action: pan-y`, and the instruction copy adapts to coarse pointers (a shared
`COARSE` flag in `utils/dom.js`; ledes carry `data-pointer="fine|coarse"` twins toggled by
a `@media (hover)` rule). Result: Ni's tiller is a horizontal drag, Ne branches under a
swept finger, Se's "most vivid object" is the touch point, and Fe/Si "sounding" is
press-and-hold — no dead instructions left.

## Problem 2 — the Fidelity Profile

**Approaches considered.**

1. *Remove the dial.* Cleanest, but it deletes the page's only analytic reading of
   position (§3.2 exists precisely for analytically-minded readers) and the only place a
   function's *character* — Ni dominant Speed .35 vs Ne .95 — is stated at all. The glyph
   shows character kinetically; nothing else states it inspectably.
2. *Keep it, annotate all 320 numbers.* 320 more strings to drift. Rejected outright.
3. *Derive it* (chosen — the "strong version"): the five axes are computed from the same
   §3.1 parameter vector that drives the glyph, times one declared per-function character
   weight per axis (8 × 5 = 40 numbers, each carrying a `why` string):

   | Axis | Derivation | Reading |
   |---|---|---|
   | Endurance | `duty × (1 − 0.35·contrary)` | how much of the time the seat can stay awake |
   | Precision | `fidelity × (1 − 0.5·noise)` | signal coherence, degraded by static |
   | Speed | `250 / (250 + latency)` | response latency, folded to 0–1 |
   | Control | `control × (1 − 0.6·contrary)` | voluntary tracking, minus the contrary streak |
   | Awareness | `fidelity × (1 − contrary)` | you know a function by the clarity of what it renders, and a seat that acts on its own is opaque to its owner |

   The maturity slider now feeds the dial **through `effectiveParams`** — the same boosted
   vector the glyph renders from — so the two disagreeing ageing models collapse into one.
   (A consequence worth stating: Speed no longer rises with age, because the maturity model
   boosts fidelity/duty/control but never latency. The dial now agrees with the glyph's
   unchanging lag rather than contradicting it.)

**Why 3.** The dial becomes structurally incapable of contradicting the glyph beside it,
every plotted value can print its own inputs ("Speed .26 — Inferior latency, 700 ms;
×0.40 Ni character"), and the 320 authored numbers reduce to 40 declared, argued ones.

Interaction: the dial chrome is drawn once and only the polygon/points update per frame
(no more per-frame `innerHTML`); the whole dial is one hit surface divided into five
wedges (≫44 px each) — hover, tap, or focus it and step axes with arrow keys; Escape or a
second tap dismisses. `tooltip.js` grows pin/focus/touch/dismiss behaviour and remains the
single tooltip mechanism. A generated "Read this profile as text" `<details>` block under
the dial is the §3.5 non-hover path and updates per slot and age.

## Problem 3 — Zone E out, Field Notes grown

- The teaser section, `initEnergyTeaser`, `energy-teaser.js`, and the `.energy-teaser`
  CSS are deleted (the eight pages were its only callers — verified by grep).
- **The two orphaned facts** go to the Zone B slot caption, rendered by `stack-rail.js`
  when the Inferior slot is selected: the grip clock ("forced to run from this seat, X
  empties in ≈N min") and the hand-over ("when a dominant-X stack collapses, this seat's
  occupant — Y — is what erupts"), with a link to `/energy/#grip`. Chosen over a Field
  Notes line because the reader is *looking at the inferior preset* when the fact arrives —
  position and cost land as one lesson, and it costs zero vertical space in the default
  (Dominant) state. Considered and rejected: a Field Notes line (context-free, always-on
  vertical cost).
- Field Notes moves to `src/data/<fn>-data.js` (`ZONE_F.vignettes` + `mirror`) rendered by
  a new `src/shared/field-notes.js`; each page grows from 3 to 7 notes. The four new notes
  per page are new *kinds*, labelled as such on the card: the tertiary portrait, the
  characteristic accusation (and what is actually happening), the misread (and the tell),
  and the wrong-instrument situation — every one function-specific.
- The §2.8 CTA is finally built, and honestly: the Playground already accepts
  `?type=XXXX`, and Zone B already knows which slot is selected — so "Take Fi to the
  Playground →" deep-links the type that carries the function in its currently-selected
  seat, which is the exact promise §2.8 made. A quiet companion link keeps the route to
  `/energy/` from the page body.
- Zone lettering: field notes become **Zone E** in the code (pages must not run D → F);
  DESIGN.md gets dated notes at §2.6, §2.7/§2.8, and §3.2 recording all of the above.

---

## Findings from the dial derivation (old numbers, now explained or retired)

- **Ti, Te and Fi shipped byte-identical dials for all eight slots** — 120 of the 320
  numbers were one copy-paste; those three functions claimed *no* character difference
  while their own mirror copy ("Te trades elegance for speed; Ti trades speed for truth")
  claimed one. The declared characters now encode what the copy says.
- **Fi's Demon inversion is gone.** Authored Precision .30 vs Endurance .15 (the defect
  named in the brief) derives to Precision .12 / Endurance .17 — the inversion was an
  authoring artifact, not a claim anyone defended.
- **Authored shadow-slot Speed was systematically high** (e.g. Ne Trickster .40, Fi
  Opposing .50) while the same slots' params carry 600–1500 ms latency. Derived Speed now
  follows the latency the glyph actually renders (.06–.29, by slot and function
  character). If shadow eruptions are meant to be *fast*, that belongs in the params, not
  smuggled into one chart.
- **Ni's authored Speed rose from Dominant (.35) to Auxiliary (.45)** — a claim that an
  Ni used *less* natively runs *faster*, which nothing on the page argued. Derived Speed
  is monotone down the stack; Ni's slowness is now a declared character (×0.40) with its
  reason attached.
- **Inferior Awareness (~.30–.35 authored) survives derivation** (`fidelity × (1 −
  contrary)` = .31–.35): the aspirational seat is felt more than it performs. This one the
  authors had right, and the formula reproduces it.

## Found and deliberately not fixed

- **One Shadow drain curve stands in for four Beebe positions** (`series: 4` on slots
  5–8). Already flagged as a content decision in DESIGN §2.6a; the dial now derives
  per-slot from params, so it is unaffected, but `/energy/` still shows one shadow curve.
- **The per-function dominant drain coefficients** (Ti 13 … Si 11.2) keep their
  §2.6a-flagged inconsistency; rescaling them changes the site's claims and stays an
  editorial call.
- **`.telemetry`/`.readouts`/`.cross-listen` CSS was pasted into `se/ne/ni-theme.css`
  and later promoted to `base.css`** — the theme copies were dead weight and *were*
  removed (safe dedupe), noted here because it is adjacent cleanup rather than one of the
  three defects.
- **`HERO` / `ZONE_B…ZONE_E` blocks in the data files are content mirrors nothing
  renders** (the HTML hardcodes the same copy). `ZONE_F` is now rendered from data; the
  rest are left as documentation rather than wired up, to keep this change's blast radius
  at the three defects.
- **The playground deep-link assembles a whole type**, not a single pre-placed module —
  `?type=` is the Playground's real API today; a true "one module, pre-placed" hand-off
  would be Playground work, out of scope here.
- **`window.__FI`-style dev handles and the `/__shot` plugin** untouched.

## Verified

All checks below were run against the dev server; `npm run build` passes and
`grep -rn "energyTeaser|energy-teaser"` returns nothing outside `dist/`, history, and
the historical planning documents.

- **375×812, all eight pages:** triggering a scenario leaves the chamber, the state chip,
  both meters, and the narration pinned in frame (pin bottom 474–572 px, leaving a
  240–338 px control window); no page scrolls horizontally; the header collapses to one
  49 px row with a self-scrolling, edge-faded nav.
- **Se's slider** updates the field and narrates with the chamber in frame; **Si's
  deviant → accept ruling** and **Fe's deadlock → gated Reconciliation** both complete on
  the mobile layout.
- **812×375 landscape:** two-column geometry; chamber (235 px), meters, narration,
  slider, and a scenario button all simultaneously visible.
- **Desktop (1280×800):** original DOM restored exactly (verified round-trip mobile →
  desktop → mobile), canvas at `clamp(320px, 56vh, 460px)` where 460 was hard-coded.
- **Dial:** tap, hover, and arrow-key stepping produce the derivation tooltip on fi, ti,
  ne, ni, se (including Se's Trickster — a shadow slot — where the tooltip names the
  contrary term); Escape and outside-press dismiss; the "read as text" block lists all
  five derivations and updates per slot and age.
- **Grip note** appears only on the Inferior slot, with the per-function clock (Fi ≈67
  min, Se ≈66 min) and hand-over, linking to `/energy/#grip`; the Field Notes CTA
  deep-links `/playground/?type=<selected slot's type>` and re-labels per slot.
- `/energy/` and `/playground/` load clean; chart tooltips still work on the extended
  `tooltip.js`.

One caveat of the verification environment: the embedded browser pane was hidden, which
suspends rAF/ResizeObserver/media-change delivery, so live rotation was exercised by
dispatching `resize` (the module's second trigger) and stepping the engines manually —
both paths behaved; fresh loads in every geometry were verified directly.
