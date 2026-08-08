# CURRENTS
## An Interactive Atlas of the Eight Cognitive Functions
### Formal Design Document — v1.0

**Project:** JungianFunctionsExplainer
**Document type:** UX/UI Architecture & Data Visualization Specification
**Status:** Foundational design — pre-implementation
**Date:** August 2026

---

# 1. Executive Summary & Visual Metaphor

## 1.1 The Problem This Design Solves

Jungian cognitive functions suffer from a presentation problem, not a content problem. The existing landscape explains functions as static trait lists ("Ti is internal logic; Ne is brainstorming"), which fails in three specific ways that this design directly attacks:

1. **Functions are not traits — they are processes.** A process must be *watched*, not read. Static descriptions cannot convey that Ni feels like slow convergence while Ne feels like explosive divergence.
2. **A function has no fixed identity outside its context.** Ti as a dominant function and Ti as an inferior function are almost different animals. Position in the stack, and the function feeding into it, define its real-world behavior. No mainstream resource visualizes this relational nature.
3. **The energy economy is the missing protagonist.** Jung's original model is fundamentally an *energetics* model (libido, in his terminology). Which functions are cheap, which are expensive, what happens when the cheap ones are blocked and the expensive ones are forced to run — this is where type theory actually predicts behavior, and it is almost never visualized.

CURRENTS is designed so that a user *feels* these three truths within ninety seconds of interacting with any page, before reading a single paragraph of text.

## 1.2 The Core Metaphor: The Cognitive Watershed

After evaluating four candidate metaphor systems (mechanical gears, botanical growth, node circuitry, fluid dynamics), the chosen master metaphor is a **hybrid of fluid dynamics and luminous circuitry**, called the **Cognitive Watershed**:

> *The psyche is a watershed. Attention and energy flow like water and light through a landscape of eight chambers. Each chamber — each function — transforms what flows through it. The terrain (your type) determines which chambers sit at the headwaters with full pressure, and which sit downstream receiving only a trickle. Stress is flooding. Overuse is turbulence and overheating. The shadow is the dark undercurrent running beneath the riverbed — always flowing, rarely seen.*

**Why fluid + light beats the alternatives:**

- **Gears** imply lossless, deterministic transmission. Cognition is lossy, noisy, and fatigue-prone — fluid conveys this; gears do not.
- **Botanical growth** is excellent for development-over-lifetime (we borrow it for the Maturity Slider, §3.2) but too slow-moving to represent moment-to-moment processing.
- **Pure node circuitry** is the right *interaction* skeleton (we use it for the Sandbox) but sterile as an *aesthetic* — it doesn't communicate effort, strain, or depletion.
- **Fluid dynamics** natively expresses everything the brief requires: pressure (stack position), flow rate (energy expenditure), turbulence (overuse), coupling (one function feeding another), and blockage/flooding (grip stress). It maps directly onto Jung's own hydraulic language of libido.

The synthesis: **chambers connected by conduits, carrying a particle-fluid of "attention tokens" that glows with the color of whatever function last transformed it.** The interaction skeleton is node-based; the visual flesh is fluid and luminous.

## 1.3 The Visual Language System

Every visual in CURRENTS is generated from one consistent grammar, so that knowledge transfers between pages.

### Color: the four cognitive elements

| Axis | Color family | Rationale |
|---|---|---|
| Intuition (Ne, Ni) | **Violet** (#8B5CF6 core) | Abstraction, the not-yet-real |
| Sensing (Se, Si) | **Amber** (#F59E0B core) | Concrete warmth, the tangible present/past |
| Thinking (Te, Ti) | **Cyan** (#06B6D4 core) | Cool, impersonal structure |
| Feeling (Fe, Fi) | **Rose** (#F43F5E core) | Warmth, valuation, the personal |

### Attitude: introverted vs. extraverted variants

Color alone must never carry attitude (accessibility, §5.5). Attitude is encoded **three redundant ways**:

- **Gradient direction:** Extraverted functions glow *outward* (bright rim, radiant halo bleeding past their boundary). Introverted functions glow *inward* (dense luminous core, dark rim — light condensing rather than radiating).
- **Shape grammar:** Extraverted chambers are drawn with an **open ring** (a gap in their boundary, open to the world). Introverted chambers have a **closed double ring** (sealed, self-referential).
- **Particle behavior:** Extraverted functions emit particles into the environment; introverted functions circulate particles internally in orbital loops.

### Role: perceiving vs. judging

- **Perceiving functions (Ne, Ni, Se, Si) are apertures/lenses** — they gather and shape raw input. Drawn as circular chambers.
- **Judging functions (Te, Ti, Fe, Fi) are valves/filters** — they sort, evaluate, and decide. Drawn as hexagonal chambers with visible internal lattice.

This grammar means a user who has learned to read *one* function page can read all eight, and can read the Sandbox, without relearning anything.

## 1.4 Design Principles

1. **Felt before read.** Every concept gets a visual/interactive expression first; prose is the caption, never the content.
2. **Energy is the protagonist.** Every view keeps an energy cost visible. The battery is never off-screen.
3. **Position over essence.** No function is ever shown without stack context. Even the hero glyph defaults to "dominant position" and labels it.
4. **Playable theory.** Wherever the theory makes a claim ("inferior functions drain exponentially"), the user can manipulate a control and watch the claim play out, rather than being told.
5. **Honest epistemics.** Jungian typology is a phenomenological model, not settled neuroscience. A persistent, unobtrusive footer notes this; the design's confidence is aesthetic, not scientific overclaim (§6.3).

---

# 2. Page Layout Anatomy

Each of the eight functions receives a dedicated page built from the same six-zone template. Below, the anatomy is described generically, with **Ti (Introverted Thinking)** as the running concrete example.

## 2.1 Zone Map

```
┌─────────────────────────────────────────────────────────┐
│  A. LIVING GLYPH (hero)              [nav: atlas wheel] │
│     full-viewport animated signature visualization      │
├───────────────────────────────┬─────────────────────────┤
│  B. STACK POSITION RAIL       │  C. FEEDER COUPLING     │
│     (vertical, left)          │     CHAMBER             │
│     drag glyph through 8      │     watch the function  │
│     depth slots               │     change per feeder   │
├───────────────────────────────┴─────────────────────────┤
│  D. THE VERIFICATION LAB                                │
│     spawn observations · stress & pleasure meters ·     │
│     integration fold-ins · explosive reorder            │
├─────────────────────────────────────────────────────────┤
│  E. ENERGY ECONOMICS PANEL                              │
│     cost bars · drain curves · recovery curves          │
├─────────────────────────────────────────────────────────┤
│  F. THE OVERCLOCK LAB                                   │
│     throttle slider · thermal gauge · symptom cards ·   │
│     loop & grip visualizers                             │
├─────────────────────────────────────────────────────────┤
│  G. FIELD NOTES                                         │
│     sibling comparison · real-world vignettes ·         │
│     "send this function to the Sandbox" CTA             │
└─────────────────────────────────────────────────────────┘
```

## 2.2 Zone A — The Living Glyph

The hero of each page is a **full-viewport, continuously animated signature visualization** unique to the function — its "portrait as a process." Each glyph is built from the shared grammar (§1.3) but has a distinctive kinetic identity:

| Function | Glyph concept | Kinetic signature |
|---|---|---|
| **Ne** | *The Spark Tree* — a point that branches outward explosively; every node forks into new possibilities | Fast, irregular, delightfully unstable; branches bloom, some fade, new ones erupt. Hovering anywhere spawns a new branch from the cursor. |
| **Ni** | *The Convergence* — dozens of faint incoming streams slowly funneling toward a single point that periodically flares into a crystallized insight | Slow, patient, inexorable; long quiet periods punctuated by a sudden bright "aha" flash |
| **Se** | *The Aperture* — a wide-open lens through which a vivid, real-time particle field streams in crisp focus | Immediate, high-framerate, zero lag; the glyph reacts to mouse movement within a single frame |
| **Si** | *The Archive* — translucent sedimentary strata; each incoming particle sinks until it "pings" against a matching layer, which lights up with the stored impression | Measured, rhythmic; the pleasure of recognition — resonance rings when past and present match |
| **Te** | *The Scaffold* — particles being sorted into an external lattice that visibly assembles toward a milestone flag | Brisk, directional, metronomic; visible throughput counter; inefficiency is pruned with a decisive snap |
| **Ti** | *The Lattice* — an internal crystalline framework endlessly self-refining; each particle is tested against the lattice, and either integrated or cleanly rejected; occasionally the whole lattice restructures when an inconsistency is found | Precise, quiet, perfectionist; long deliberation, then a deep satisfying "click" of coherence |
| **Fe** | *The Resonance Field* — many independent waveforms drifting toward synchrony; the glyph reads the field and gently conducts it into harmony | Warm, responsive, other-directed; disharmony is visibly uncomfortable (beating interference patterns) until resolved |
| **Fi** | *The Tuning Fork* — a single luminous core tone; each incoming particle is struck against it and rings true (absorbed, brightening the core) or rings false (firmly deflected) | Deep, still, uncompromising; rare but total flare-ups when a core value is struck hard |

The glyph is not decoration — it is **the same renderable object** that later appears (smaller, parameterized) in the Stack Rail, the Energy panel, and the Sandbox. One object, many contexts: this is the load-bearing trick of the whole design.

## 2.3 Zone B — The Stack Position Rail *(brief requirement #1a)*

A vertical rail of eight labeled slots: **Dominant, Auxiliary, Tertiary, Inferior**, then a visually distinct lower register — darker, submerged beneath a "waterline" — for the four shadow slots: **Opposing, Critical Parent, Trickster, Demon** (Beebe model; the labels are togglable for users who prefer plain "Shadow 5–8").

The user **drags the function's glyph up and down the rail**. As it crosses each slot, the glyph *morphs in real time* according to the parametric model in §3.1: at Dominant it is large, coherent, fast, and quiet; by Inferior it is small, noisy, laggy, and flickering; below the waterline it becomes distorted and intermittent. A caption block beside the rail rewrites itself per slot with the position-specific phenomenology, e.g. for Ti:

- **Dominant (ISTP/INTP):** "The world is a system to be understood. Analysis is effortless, constant, and identity-defining."
- **Inferior (ESFJ/ENFJ):** "Logic arrives late, harsh, and all-or-nothing — long stretches of deferring to others' frameworks, punctuated by rigid, brittle certainty under stress."
- **Demon (8th, INFP/ISFP):** "Rarely touched; when it erupts, it is corrosive self-directed 'logic' — cold dismissal of one's own worth dressed up as objectivity."

## 2.4 Zone C — The Feeder Coupling Chamber *(brief requirement #1b)*

This zone answers: *what does this function become when a specific other function feeds it?*

**Visual mechanic:** the page's function is shown as a chamber; on the left, a carousel of candidate feeder functions. Selecting a feeder connects a conduit, and the feeder's colored particle-stream flows into the chamber. The chamber's internal behavior — not just its tint — changes:

- **Ti fed by Ne** (INTP): the lattice receives violet particles that fork mid-flight — speculative inputs. The lattice grows *broad and provisional*, whole wings built and demolished cheaply. Caption: "breadth-first logic — frameworks for possibilities that don't exist yet."
- **Ti fed by Se** (ISTP): amber particles arrive fast, dense, and concrete. The lattice grows *narrow and load-bearing*, tested against live physical data in real time. Caption: "tactical logic — troubleshooting the machine in front of you."

Each function page ships with its **two canonical couplings** (from real type stacks) plus an "exotic couplings" toggle that lets curious users wire in any feeder and read a speculative description. Coupling behavior is data-driven: each feeder modifies the chamber's simulation parameters (input rate, input concreteness, input branching factor), so the visual difference is *computed*, not hand-animated — which is what allows the Sandbox (§4) to reuse it for free.

## 2.5 Zone D — The Verification Lab

Ti-style judging functions do not only *build* internal structure — a large share of their lifecycle is **verifying externally provided sub-structures** against what is already encoded. This zone makes that lifecycle playable. The function's chamber runs live while the user spawns one of three observation types and watches two meters — **Stress** and **Coherence Pleasure** — react:

- **An unrelated fact** (delivered via a perceiving function, e.g. Se): a small sublattice floats into the chamber and parks beside the main lattice in its own color, isolated. Neither meter spikes — true-but-unconnected information is tolerated, not resisted.
- **A causal connection** (via Ne): a second sublattice arrives and bridges the isolated island to the main lattice. Pleasure spikes and stress eases as the bridge proves out; then the entire assembly — bridge and island — folds into the main lattice and vanishes, visualizing integration into general world-understanding and resetting the state.
- **A rule violation**: a conflicting structure strikes the lattice. Stress floods the chamber, the lattice red-shifts, and it reorders explosively — everything connected to the broken rule is rebuilt around the exception. After a few seconds the simulation settles: stress drains, color returns, and the lattice is *visibly different* from before. Distress → re-observation → restructuring, as one continuous picture.

The same verification mechanic runs ambiently in Zone B: the rail glyph is bombarded with incoming sublattices, and those **homomorphic** to the main lattice fold in with a single green verdict pulse while alien structures bounce off the ring with a red one — with misjudgment probability rising as the function sits deeper in the stack. (Green/red here are reserved status colors with icon + label support, never series colors.)

Generalization note: each judging function gets its own verification variant (Te verifies against external results, Fe against group resonance, Fi against the core tone); perceiving-function pages replace this zone with a *perception fidelity* lab. The variants differ in *texture*, not just content — Ti's chamber is crystalline (structures fold in or bounce off a lattice), while Fi's is a **mist nebula with fluid dynamics**: its lab spawns a 2×2 of experiences (authentic/inauthentic × good/bad) where authentic experience — joyful or painful — diffuses into the mist, twirls it, and temporarily colours the whole nebula (the tint tracks the colour distribution of what it currently holds, clamped near the core rose); inauthentic-pleasant experience glides along the boundary unabsorbed and is expelled; and inauthentic-violating experience pierces straight through with a wake, a trailing vacuum, and mist bleeding out through the exit wound.

## 2.6 Zone E — Energy Economics Panel

The interactive energy visualization suite specified fully in §3.3. Its layout position matters: it sits below the Verification Lab and is **linked** to the Stack Rail — the slot currently selected in Zone B highlights the corresponding curve in Zone E, so position and cost are learned as one lesson, not two.

## 2.7 Zone F — The Overclock Lab

A deliberately game-like sub-page section (full spec §3.4): a throttle the user pushes, a function that visibly redlines, and the symptomatology of overuse (loops, grip, burnout) emerging as *consequences of the user's own action*. Placed after the energy panel so the user already understands the battery it is about to drain.

## 2.8 Zone G — Field Notes

Closing zone: a side-by-side comparison with the function's **attitude sibling** (Ti vs. Te — same element, opposite attitude, drawn as mirror-image glyphs), three short real-world vignettes ("Ti at a dinner party / debugging / in an argument"), and the primary CTA: **"Take Ti to the Sandbox →"**, which carries the function (in its currently-selected stack position) into the Sandbox as a pre-placed module — a deliberate bridge from learning to play.

---

# 3. Data Visualization Specs

## 3.1 The Parametric Glyph Model (stack position → visual behavior)

Every glyph is rendered from a small parameter vector, and stack position is simply a preset over that vector. This is the core spec that makes "the same function looks different by depth" systematic rather than illustrative:

| Parameter | Visual meaning | Dominant | Auxiliary | Tertiary | Inferior | Shadow (5–8) |
|---|---|---|---|---|---|---|
| `scale` | glyph size | 1.0 | 0.8 | 0.55 | 0.4 | 0.45, submerged |
| `fidelity` | particle coherence (0 = scattered noise, 1 = crisp) | 0.95 | 0.85 | 0.6 | 0.35 | 0.2–0.5 erratic |
| `latency` | response delay to user input | ~0 ms | 80 ms | 250 ms | 700 ms | random 0–1500 ms |
| `noise` | jitter/static overlay | none | trace | visible | heavy | heavy + distortion shader |
| `duty` | fraction of time the glyph is "awake" vs. dimmed | 100% | 85% | 50% | 25% | flickers unpredictably |
| `control` | how precisely it follows the cursor | full | high | loose | overshoots/undershoots | actively contrary at times |

The user never sees this table — they *feel* it when dragging the glyph down the rail: it shrinks, lags behind the cursor, gets grainy, and starts flickering. The Trickster and Demon slots add a subtle **inversion behavior** (the glyph occasionally does the opposite of the cursor's intent), which is the most visceral shorthand for shadow-function unreliability we can offer.

## 3.2 The Fidelity Dial & Maturity Slider

Beside the rail, a compact **radar dial** with five axes — *Endurance, Precision, Speed, Voluntary Control, Self-Awareness* — re-plots as the glyph moves through slots, giving analytically-minded users the same information the glyph conveys kinetically (redundant encoding, deliberately).

A horizontal **Maturity Slider (age 7 → 60)** borrows the botanical metaphor: functions develop over the lifespan in roughly stack order. Scrubbing it shows the tertiary and inferior curves rising with age — the visual argument that type is a developmental trajectory, not a cage. The dial and glyph both respond to it, and so does the glyph's *structure*: with age the lattice itself gains nodes, connects each node to more neighbours, and rigidifies (its idle wobble damps) — experience literally enlarging and stiffening the encoded model of the world.

## 3.3 Energy Expenditure Graphs *(brief requirement #2)*

The energy suite is one linked panel with three coordinated charts sharing a color-by-position scheme (position, not function, drives color here: a neutral ramp from bright green at Dominant to deep red at Inferior, with shadow positions in desaturated purple-grey below a zero line).

**Chart 1 — Cost per Activation (bar chart).** One bar per stack position: the flat cost of *invoking* the function once from that slot. Dominant ≈ 1 unit; Auxiliary ≈ 1.5; Tertiary ≈ 2.5; Inferior ≈ 4; Shadow ≈ 3–6 with an error band (shadow costs are unpredictable — the error band itself teaches this). Hovering a bar animates a demo: a full battery icon spends that many cells.

**Chart 2 — Sustained Drain (interactive line chart, the centerpiece).** X = minutes of continuous use (0–120, scrubbable); Y = cumulative energy drained. Five curves:

- Dominant: **near-linear with a shallow slope** — and, crucially, with brief *downward* ticks: flow-state micro-recovery. Using your dominant can be restorative. This one visual detail carries an enormous amount of theory.
- Auxiliary: linear, moderately steeper.
- Tertiary: gently super-linear (`E ∝ t^1.4`).
- Inferior: **visibly exponential** (`E ∝ t^1.9`) — the curve that makes users physically wince. A dotted "depletion ceiling" line crosses it early; where they intersect, a marker reads *"grip risk begins here"* and deep-links to the Overclock Lab.
- Shadow: a jagged, noisy trace with sudden vertical spikes — cost arrives in unpredictable lumps.

The user drags a **time scrubber**; a battery icon beside each curve drains in sync, and the glyph (miniaturized at each curve's endpoint) degrades per §3.1 as its battery empties. Energy, position, and visual degradation are thus experienced as one coupled system.

**Chart 3 — Recovery (small multiples).** After a fixed 30-minute exertion, how long until the battery refills: Dominant recovers in minutes (and partially *during* use); Inferior requires multiples of the exertion time and shows a "hangover" shelf — a flat period of global depression where *all* functions run at reduced fidelity. This chart introduces **collateral drain**: heavy inferior/shadow use taxes the whole system, not just itself, foreshadowing grip dynamics.

## 3.4 The Overclock Lab *(brief requirement #3)*

**The throttle.** A large vertical slider (0–130%) with a detent at 100%. Pushing past the detent requires a deliberate click-and-hold — a physical metaphor for pushing past healthy limits. As the throttle rises:

- **60–100%:** the glyph brightens, accelerates, performs beautifully. Overclocking must first look *good* — because in life, it does. Productivity numbers tick up on a small counter.
- **100–115% ("turbulence"):** fluid flow through the chamber goes turbulent (visible eddies), fidelity drops even as speed rises, the output counter keeps climbing but an **error counter** appears beside it and climbs faster. Thermal gauge enters orange.
- **115–130% ("redline"):** the glyph develops a strobing shudder, the chamber walls glow heat-red regardless of function color, particles begin escaping the chamber (leaking energy), and the ambient page background — subtly — begins to dim and desaturate: overuse of one function is visibly dimming *the rest of the psyche*.

**Symptom cards.** As thresholds cross, cards slide in from the right, each pairing a mechanism with felt experience, tuned per function and per stack position. Examples for Ti: *"Analysis paralysis — the lattice refuses to declare any structure finished"* (dominant overuse); *"Everyone is an idiot — leaky Ti dismissing Fe data it no longer has energy to process"*; for inferior-position overclock the cards are grip symptoms instead.

**The Loop Orbit.** A dedicated visualization for cognitive loops (dominant + tertiary, both same attitude, bypassing the auxiliary): three chambers drawn in a triangle; the healthy path (Dom → Aux → world) is drawn wide; in loop state, energy is shown orbiting Dom ↔ Tert in an accelerating closed circuit while the Auxiliary's conduit visibly narrows and grays out. Because both loop functions share an attitude, the orbit is drawn entirely *inside* (introvert loop, e.g. INTP Ti–Si) or entirely *outside* (extravert loop) a boundary line representing the self — making "loop = losing contact with the balancing world/inner life" a literal picture. A "break the loop" button forces one energy packet through the Auxiliary conduit, visibly discharging the orbit — the therapeutic insight (engage the auxiliary) delivered as interaction.

**The Grip Sequence.** A scripted, scrubbable mini-timeline (also triggered organically in the Sandbox): prolonged dominant overclock → battery collapse → dominant chamber sputters out → energy floods *down* the stack into the Inferior chamber, which is drawn small, with narrow conduits — it cannot handle the pressure, and visibly floods, spraying erratic behavior-particles. Caption text names the phenomenon per type (e.g., Ni-dominant → Se-grip: "sensory bingeing, recklessness"; Te-dominant → Fi-grip: "uncharacteristic wounded moralizing"). The grip is thus framed accurately: not the inferior function being evil, but *a low-capacity chamber receiving a dominant-sized flood*.

## 3.5 Accessibility & Encoding Redundancy (applies to all visualizations)

Every quantitative encoding carries at least two channels (color + position/shape/texture); attitude is triple-encoded (§1.3); all charts expose data tables via a toggle; all animation respects `prefers-reduced-motion` by switching to static comparative snapshots (e.g., the drain chart renders all five curves statically instead of scrubbing); color pairs are chosen at ≥3:1 contrast against both light and dark surfaces, and the violet/amber/cyan/rose set is distinguishable under deuteranopia and protanopia simulation.

---

# 4. The Modular Sandbox — "The Confluence Engine" *(brief requirement #4)*

The Sandbox is the destination the entire site funnels toward: a node-based canvas where users assemble a cognitive stack from function modules and run scenarios through it.

## 4.1 The Canvas & Module Design

**The canvas** is a calm, dark, zoomable space with a faint topographic texture (the watershed terrain). Down its left edge sits the **Function Shelf**: all eight function modules, rendered as compact versions of their living glyphs, draggable onto the canvas.

**A function module** is the glyph in a capsule with:

- **One input port** (top) and **one output port** (bottom) for the main cognitive conduit.
- **A position badge** that auto-assigns from its snap location (1st through 8th) and applies the §3.1 parameter preset — drop Ti into slot 4 and it *arrives already small, laggy, and grainy*.
- **A live micro-battery** on its flank, and a thermal sliver that heats during simulation.

**The Stack Spine.** Rather than free-form graph wiring (powerful but chaotic for novices), the default canvas presents a vertical **spine of four primary snap-slots** (plus an expandable submerged region revealing shadow slots 5–8, auto-populated as the mirror of slots 1–4 once the top four are placed — teaching that you don't *choose* your shadow; it's entailed). Modules snap magnetically into slots; conduit connections draw themselves. Wall-clock cost of assembling a full valid stack: under thirty seconds.

**Validation as gameplay, not gatekeeping.** Jungian stack legality (alternating attitudes e→i or i→e; alternating perceiving/judging; inferior is the dominant's polar opposite) is enforced by default: an illegal drop makes the slot ripple red and the module bounce back, with a one-line reason ("A dominant Ni needs an extraverted judging auxiliary — try Te or Fe"). A prominently labeled **Free Play toggle** lifts all rules so users can build "impossible" stacks (Ne–Ni–Se–Si, or four judging functions) and run them — the simulation then *shows* the instability (nothing perceives, or nothing decides, and the input token circles unprocessed), which teaches the rationale for the rules far better than a rejection dialog ever could.

**Type presets.** A drawer of the sixteen classical types; choosing one assembles its stack with a satisfying cascade animation. This is also the primary entry point for the majority of users who arrive knowing their four-letter type and nothing else.

## 4.2 The Scenario Deck (the "input")

Scenarios are the fluid that flows through the machine. Each is a **card** with a title, a one-line vignette, and — visible on flip — its **attribute vector**, six sliders from 0–10:

| Attribute | Example high-scorer |
|---|---|
| Novelty / ambiguity | "Your industry just changed overnight" |
| Urgency / time pressure | "The deadline moved to tomorrow" |
| Sensory intensity | "A crowded, loud launch party" |
| Social-emotional load | "A close friend calls you in tears" |
| Structural demand | "Plan a 40-person offsite" |
| Personal-values charge | "You're asked to do something that feels wrong" |

The deck ships with ~20 authored scenarios spanning the vector space, plus a **"Forge a Scenario"** editor where users set the six sliders themselves and title their own card (the single highest-retention feature in this design: *"what would my stack do in MY situation?"*).

## 4.3 The Simulation: watching a scenario flow through a stack

The user drops a scenario card onto the stack's intake. What follows is a **10–30 second observable simulation**, scrubbable afterward like a video timeline:

1. **Intake.** The card dissolves into a stream of particles, color-mixed according to its attribute vector (a values-charged scenario streams rose-heavy; an ambiguous one, violet-heavy).
2. **Activation.** Each function has an affinity profile over the six attributes. As the stream descends the spine, each chamber's activation is computed (affinity × position-derived responsiveness). Activated chambers light up proportionally and begin transforming particles; poorly-matched chambers stay dim and pass the stream through. The dominant *always* gets first grab at the stream — sometimes wrongly, and the visualization shows this: an ISTP's Ti seizing a social-emotional stream and visibly mangling it (particles rejected by the lattice, piling up) before ricocheting down toward tertiary Ni and inferior Fe is the *correct* theoretical prediction, rendered.
3. **Energy accounting.** Every chamber's micro-battery drains per the §3.3 cost model in real time, and a **master psyche battery** on the canvas edge aggregates. Low-position chambers forced into heavy activation drain dramatically and heat up.
4. **Output.** Particles that complete the descent collect in an **Output Well**, which condenses into a **Behavioral Readout card**: a short generated narrative of the likely response, decomposed into contributions ("Response led by Ti (58%): withdraw and systematize the problem…; colored by Se (27%): …acting on immediate practical fixes; Fe (4%, strained): a delayed, awkward check-in"). Percentages come straight from per-chamber throughput — the narrative is a *reading of the visualization*, keeping the system honest.
5. **Stress events.** If the scenario's demands mismatch the stack's cheap functions, the simulation can organically produce the §3.4 pathologies: sustained mismatch drains the dominant → loop orbit forms, or grip flood into the inferior — flagged on the timeline as marked events the user can scrub back to.

## 4.4 Compare Mode & Sharing

**Compare Mode** splits the canvas: two stacks side by side, one scenario dropped into both simultaneously. Watching an ENFP and an ISTJ process "the deadline moved to tomorrow" in parallel — different chambers lighting, different batteries draining, different readouts — is the single most persuasive artifact the site can produce, and the most shareable. Every completed run generates a **replay permalink** (stack + scenario vector + seed), and a one-click export renders the run as a short looping video/GIF for social sharing.

## 4.5 Why the architecture holds together

The Sandbox requires no new visual system: modules are §2.2 glyphs, position presets are §3.1, drain behavior is §3.3, pathologies are §3.4, and feeder-coupling behavior between adjacent chambers is §2.4. The function pages are, in effect, the Sandbox's documentation — and the Sandbox is the pages' exam. This reuse is not merely an engineering economy; it is what makes the product feel like *one instrument* rather than a collection of infographics.

---

# 5. User Flow & Interaction Design

## 5.1 Entry Flows

Three doors, one destination:

- **"I know my type"** (majority): type picker → animated assembly of their stack → straight into the Sandbox with a starter scenario queued, with function pages linked from each module ("what is this Ti thing?" → deep-dive → return).
- **"Just exploring"**: the **Atlas Wheel** — the eight glyphs arranged in a ring, alive at idle, each a doorway to its page. The wheel doubles as the site's persistent navigation (collapsed to a corner medallion on every page).
- **"What is all this?"**: a 60-second scrollytelling primer that introduces watershed, chambers, and battery with a toy two-function stack — establishing the visual grammar before any jargon.

## 5.2 The Learning Arc of a Function Page

Each page is choreographed as a single scroll-driven arc: *meet the process* (Zone A, glyph at full glory) → *see it re-contextualized* (Zone B, drag it down the rail and watch it degrade) → *see it re-shaped* (Zone C, feeders) → *watch it do its job* (Zone D, verification) → *count its cost* (Zone E) → *break it* (Zone F, throttle in hand) → *place it among others and go play* (Zone G → Sandbox). The emotional shape is deliberate: admiration, then relativization, then consequence, then agency.

## 5.3 Progressive Disclosure

Three depth layers govern every zone: **Layer 1 (ambient)** — the visualization itself, legible with zero reading; **Layer 2 (caption)** — one-to-three sentences that rewrite reactively as the user manipulates controls (the page narrates *what the user just did*: "You moved Ti to Inferior — notice the lag"); **Layer 3 (scholarly)** — expandable drawers with Jung/Beebe sourcing, contested points, and model caveats. Nothing in Layer 3 is required to operate anything.

## 5.4 Micro-interaction Inventory (selected)

- **Drag glyph on Stack Rail:** morph per §3.1; haptic-style snap per slot; caption rewrite.
- **Scrub drain chart:** batteries drain in sync; endpoint glyphs degrade; release springs playhead back with an eased settle.
- **Throttle past detent:** requires click-and-hold for 400 ms (deliberate effort to overclock — the interaction *is* the metaphor).
- **Break-the-loop button:** discharges the orbit through the auxiliary conduit with a felt "release" animation.
- **Scenario card grab:** card tilts with cursor physics; hovering the intake makes the whole stack lean toward it with faint anticipatory glow — the psyche *wants* input.
- **Idle states:** every glyph breathes at rest; nothing on the site is ever a static image.

## 5.5 Accessibility & Responsiveness

All simulations are keyboard-operable (slots and controls are focusable; drag interactions have select-then-place equivalents); every visualization has a text/table alternative; `prefers-reduced-motion` swaps animation for annotated static states site-wide (§3.5); color independence per §1.3. On mobile, function pages stack their zones vertically with full fidelity, while the Sandbox simplifies to the spine-only layout (no free canvas), which the snap-slot design makes natural rather than compromised.

## 5.6 Tone Guardrails

The interaction language stays playful ("overclock," "forge a scenario") but the copy never diagnoses, never predicts life outcomes, and consistently frames positions as *cost profiles, not ability ceilings* — the Maturity Slider (§3.2) exists specifically to keep the system from reading as deterministic.

---

# 6. Appendices

## 6.1 Suggested Implementation Notes (non-binding)

- **Rendering:** glyphs and simulations in WebGL (regl/three.js or PixiJS) driven by the §3.1 parameter vector; charts in D3/SVG; one shared particle system service so page glyphs and Sandbox modules are literally the same component.
- **Simulation state:** a deterministic, seeded state machine (XState or equivalent) — determinism is required for replay permalinks and scrubbable timelines.
- **Data model:** functions, position presets, feeder-coupling modifiers, scenario vectors, and symptom cards all as declarative JSON — the entire theory layer is content-editable without touching rendering code.
- **Performance budget:** idle glyph ≤ 2 ms/frame; full Sandbox simulation ≤ 8 ms/frame on mid-range hardware; all animation pausable when off-viewport.

## 6.2 Phased Build Recommendation

**Phase 1:** one complete function page (Ti) with Zones A–E → validates the parametric glyph model and the verification mechanic. **Phase 2:** Overclock Lab + remaining seven pages (content-driven, same template). **Phase 3:** Sandbox spine + presets + authored scenario deck. **Phase 4:** Free Play, Forge-a-Scenario, Compare Mode, replay sharing.

## 6.3 Epistemic Footer (site-wide)

A persistent, single-line footer: *"Cognitive function theory is an interpretive model from analytical psychology, not established neuroscience. CURRENTS visualizes the model's internal logic — treat it as a lens, not a diagnosis."* This protects the project's credibility and its users in one sentence.

---

*End of document — CURRENTS Design Document v1.0*

