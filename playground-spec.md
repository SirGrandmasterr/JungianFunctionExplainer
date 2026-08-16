# PLAYGROUND — The Vessel & the Voyage · Mode Specification

**Mode:** The Playground (builds on the Sandbox brief in `DESIGN.md` §4)
**Status:** design-complete, ready for phased implementation
**Extends:** `DESIGN.md` §1.3 (visual grammar), §2.2 (glyph roster), §3.1 (parametric model), §3.3 (energy curves), §3.4 (loops & grip), §5.3 (progressive disclosure)
**Supersedes:** §4.1's Stack Spine as the *primary* Playground layout (the spine survives as the mobile/reduced fallback, §3.9), and §4.2's six-slider scenario vector (absorbed as an authoring shorthand, §4.6)
**Reuses without modification:** all eight glyph engines and state streams, `stack-rail.js` presets, `energy-charts.js`, `tooltip.js`, `utils/*`, the `.readouts`/`.cells`/`.resolve-row` components
**Date:** August 2026 · v1.0

---

# 0. The thesis, and what this mode must prove

## 0.1 One sentence

> **Any type can produce any action in any situation. What differs is the internal bill — energy, stress, friction — and that bill, together with the situation, sets the probability and the conditions under which the behavior actually appears.**

The Playground is the instrument that makes this sentence *experienceable*. The user builds a psyche, drops it into a situation, reads its four inner voices, forces it to act — including against its own grain — and then reads the itemized receipt. Then they run the identical action on a different psyche and compare receipts. Everything in this spec serves that loop.

Formally, the model the whole mode implements:

```
behavior = argmin over available actions of:
           energyCost(action, stack, context)
         + expectedStress(action, stack, context)
         − expectedPleasure(action, stack, context)

…except the USER can override the argmin. That override — "force the
INFP to do the ENTJ thing" — is the entire pedagogical payload.
The receipt shows what the override cost.
```

## 0.2 Corrections to the brief

The requested feature set is right in spirit. Six refinements before anything else, each load-bearing:

1. **The builder has two choices, not four.** Dominant (8 options) and auxiliary (exactly 2) fully determine tertiary and inferior. 8 × 2 = 16. The brief's "this continues until the stack is complete" is theoretically impossible — after the second placement there is nothing left to choose. This is not a flaw to hide; it is the single most teachable fact in typology, and §2 turns the last two placements into *entailment beats* rather than choices.
2. **Inaction is an action.** "Say nothing" has a signature and a cost (usually paid by the introverted judge, plus rumination interest). A cost model that only prices visible behavior predicts that suppression is free, which is exactly backwards. Every scenario's action deck includes at least one suppressive/deferring option, priced honestly (§5.6).
3. **Energy and stress are two axes, not one inverse pair.** Low energy + low stress is pleasant tiredness; high energy + high stress is wired dread. The global readout is a 2-D weather map with four named quadrants (§5.8), not two bars fighting each other.
4. **Cost = machinery × context, never machinery alone.** A dominant function starved of its food is expensive too (Se-dominant in an empty waiting room; Fe-dominant alone all week). Stack position sets the *base* rate; the scenario's hooks gate it up or down (§5.4). Without context gates, the model would claim dominants are always cheap, which is false and users know it's false.
5. **Probability must be on screen.** The educational goal says types differ in the *probability* of a behavior. So before the user chooses, the Playground shows the forecast — what this psyche would likely do left to itself, as odds per action card (§5.9). The user's override is then measured against the forecast it defied.
6. **Routing changes style, not just price.** When a demand lands on a function the type doesn't carry (Ti work arriving at an ENFP), it is not "impossible" — it is *translated* into the type's own machinery (handled by Te, in Te's manner: externally checkable steps rather than an internal formal model). Same job, different method, different bill. The monologue system renders the style difference; the ledger renders the price difference (§5.2).

## 0.3 The three lessons, in teaching order

| # | Lesson | Where it lands |
|---|---|---|
| L1 | A type is two axes, not four traits — and choosing a strength chooses a weakness | The Assembly (§2) |
| L2 | The four functions are one circuit with one energy supply — attention flows, blocks, and seesaws | The Vessel (§3) |
| L3 | Anything is doable; the bill varies; the bill predicts behavior | The Voyage & the Ledger (§4–5) |

---

# 1. Architecture overview

## 1.1 The four subsystems

```
┌─────────────────────────────────────────────────────────────────┐
│  THE ASSEMBLY (§2)          drag-and-drop stack builder          │
│  8 glyphs → 2 choices → 2 entailments → a named, living Vessel   │
├─────────────────────────────────────────────────────────────────┤
│  THE VESSEL (§3)            the assembled psyche on the canvas   │
│  two crossed axes · ego core · the Surface · attention circuit   │
├─────────────────────────────────────────────────────────────────┤
│  THE VOYAGE (§4)            scenario engine                      │
│  briefing (interior priors) → stimulus → four monologues         │
├─────────────────────────────────────────────────────────────────┤
│  THE LEDGER (§5)            choice, cost, and consequence        │
│  forecast → user forces an action → itemized receipt →           │
│  meters, tilt, grip → counterfactual on another Vessel           │
└─────────────────────────────────────────────────────────────────┘
```

One deterministic clock (`VesselBus`, §7.5) steps everything; every run is seeded and replayable, per the §6.1 determinism doctrine (`mulberry32` only — including every economy roll).

## 1.2 What is reused, and why this is cheap to build

The eight function pages were built so their glyphs are *parameterized simulations*, not illustrations (`DESIGN.md` §2.2: "one object, many contexts — the load-bearing trick of the whole design"). The Playground cashes that check:

- A Vessel chamber **is** the page glyph, mounted compact, driven by the existing `setTarget(SLOTS[rank].params)` presets — a tertiary chamber arrives already small, laggy, grainy, with no new code.
- Scenario reactions **are** `glyph.scenario(key, impact)` calls — the same dispatch tables the Zone D labs use.
- Stress/pleasure meters **are** the existing state streams (`SiState`/`FeState` contract), aggregated by the bus instead of a page HUD.
- The economy constants **are** §3.3's canon (activation multipliers 1 / 1.5 / 2.5 / 4).

New engineering surface: the Vessel canvas (layout + circuit renderer), the briefing/monologue/ledger UI, one economy resolver (~200 lines of pure functions), and scenario content. The hard physics already ships.

---

# 2. Phase 1 — The Assembly (stack builder & onboarding)

## 2.1 The structural facts the builder must teach

A legal stack obeys three rules, which the builder expresses as **three Laws**, surfaced one at a time, each at the exact moment it bites:

| Law | Statement | Consequence in the builder |
|---|---|---|
| **I. The Law of Two Worlds** | The top two functions face opposite worlds: one extraverted, one introverted | Auxiliary candidates matching the dominant's attitude are refused |
| **II. The Law of Two Jobs** | The top two functions split the two jobs: one perceives (a lens — takes the world in), one judges (a valve — decides) | Auxiliary candidates matching the dominant's class are refused |
| **III. The Law of the Axis** | Every function is one end of an axis; installing it installs its polar opposite at the far end — small, deep, and inverted | Placing the dominant ghosts-in the inferior; placing the auxiliary ghosts-in the tertiary |

Laws I + II leave exactly **2** legal auxiliaries for any dominant. Law III makes slots 3 and 4 *entailed*. Total free choices: dominant (8) × auxiliary (2) = **16 types**. The builder's arithmetic is the typology.

Copy register (Layer 2, one line each, shown on first contact with each Law):

- *Law I:* "A mind facing only outward has no depth to consult. Facing only inward, it has no door."
- *Law II:* "Two lenses and nothing ever gets decided. Two valves and nothing new ever gets in."
- *Law III:* "You don't choose four functions. You choose two axes — and which ends point up."

## 2.2 The canvas at rest

The Assembly opens on the Vessel canvas (§3) in its empty state: the **Surface** (the luminous self/world boundary line) with a faint, dim **keel-cross silhouette** at center — two crossed slots and a small neutral core — reading unmistakably as *something to be built*. The eight glyphs drift in a loose shoal along the canvas edge, alive at idle (they are the real engines at `compact` LOD, breathing per their §2.2 kinetic signatures). Prompt line: **"Choose the function that leads."**

No theory is shown yet. The first Law appears only when the first rule first *refuses* something.

## 2.3 The build sequence, beat by beat

**Beat 1 — Dominant (a real choice, 8 ways).**
The user grabs any glyph. *While dragging*, the keel-cross previews the consequence live: the glyph's axis partner fades in at the opposite end of the beam — smaller, dimmer, inverted below the Surface. Drop → the first beam materializes: the dominant end large and bright in its home world (Ne surfaces into the light; Ni sinks its bulk below), the far end a **ghost chamber** labeled `Inferior — comes with`. Caption rewrites (§5.3 doctrine — the page narrates what the user just did):

> *"Ne takes the helm. And notice what arrived without being asked: Si, at the far end of the same axis — every strength drags its opposite behind it, faint and submerged. That's Law III, and you'll meet it again."*

The remaining seven glyphs re-sort themselves: the **two legal auxiliaries drift forward and brighten; the five illegal ones dim and sink** slightly in the shoal. Nothing is hidden — illegal options remain grabbable, because refusal is the lesson.

**Beat 2 — The refusals (the Laws teach themselves).**
Dragging an illegal candidate toward the auxiliary slot repels it — soft magnetic bounce, slot ripples once (reuse the §4.1 red-ripple rejection, downgraded from "error" to "physics") — with a one-line reason keyed to *which* Law refused it:

- Se/Si/Ni against a Ne dominant → *"Two lenses, no valve — this mind would see everything and decide nothing."* (Law II)
- Te/Fe against a Ne dominant → *"Both hands in the outer world — nobody minding the interior."* (Law I)

Users who never try an illegal drop never see a rejection; users who try all five get five different one-liners and have accidentally learned the whole encoding. Both paths are correct.

**Beat 3 — Auxiliary (a real choice, 2 ways).**
The two candidates hover with a **preview-on-hover**: holding Fi over the slot faintly tints the future — the second beam sketches itself with ghost-Te at its far end and the four-letter type name shimmers, unconfirmed (`ENFP?`). Same for Ti (`ENTP?`). This makes the moment legible as *the fork between two whole selves*, not a parts pick. Drop → beam two materializes, ghost tertiary included. Caption:

> *"Fi below the Surface: the deciding is done in private, against a personal tone. The world will mostly meet your Ne and assume that's all of you. It isn't — it's just the half above the waterline."*

**Beat 4 — The entailment (zero choices, staged as revelation).**
Two ghost chambers now pulse gently (tertiary Te, inferior Si). The user confirms each with a tap — or drags any remaining shoal glyph, and only the matching one will seat; the rest bounce off with *"Already spoken for: the axes are full."* On the second confirmation:

> *"You made two choices. The other two were made the moment you made the first two."*

The Vessel then **rights itself**: beams settle to their resting tilt, the Surface calms, the attention circuit (§3.5) runs its first idle lap end to end with a traveling glint, and the type chip reveals — `ENFP` — with its silhouette thumbnail (§3.4). Primary CTA: **"Take it out." →** the Scenario Deck. Secondary: `Rebuild` · `Compare` · `What did I just build?` (Layer 3 drawer with the full encoding, Grant-model sourcing, and caveats).

## 2.4 Entry shortcuts (three doors, per §5.1)

- **"I know my type"** — 4×4 type grid; picking one plays the *same four beats auto-piloted* at 3× speed with the same captions. Knowing your letters must not exempt you from the two Laws you've never heard of; auto-build is the lecture disguised as a cutscene (~20 s).
- **"Build one"** — the full sequence above (~60–90 s).
- **"Surprise me"** — seeded random legal build, auto-piloted. Also the entry used by the Compare flow when it needs "some other Vessel."

## 2.5 Free Play (the rules, learned by breaking them)

A labeled toggle lifts all three Laws (§4.1 doctrine, kept and extended). Illegal Vessels *assemble and run* — and visibly malfunction in the way their violation predicts, which is the rationale taught better than any refusal:

| Illegal build | What the simulation shows |
|---|---|
| Four perceivers | Stimulus pours in, circles the circuit, nothing ever collapses into a decision; the action deck renders permanently disabled; energy drains on intake alone |
| Four judges | The Vessel fires verdicts at a world it never actually sampled; every monologue is confident and wrong; stress climbs with no input to justify it |
| All four extraverted | Frantic surface activity, empty interior: nothing banks (no Si strata form), nothing means (no Fi tone consulted); the below-Surface half of the canvas is literally vacant |
| All four introverted | Rich interior churn with no door: the circuit never crosses the Surface upward; actions execute at 4× cost because every exit is a translation |

Free Play carries the epistemic footnote inline: *"No human runs like this — which is the point. The Laws aren't etiquette; they're what a workable mind requires."*

## 2.6 Why this teaches without overwhelming (the design argument)

The builder never presents the encoding as a rule table. It presents **eight live objects, two magnetic constraints, and one inevitability** — the user's hands discover the structure in under two minutes, and the captions name what the hands just felt (felt before read, §1.4). The full formal model sits one Layer-3 drawer away for the users who want it, and nothing requires it.

---

# 3. Phase 2 — The Vessel (connectivity concept)

## 3.1 The concept in one paragraph

The four functions mount on **two crossed beams — the two axes from Law III — intersecting at a small neutral core (the ego), the whole assembly floating at a horizontal luminous line: the Surface, the boundary between the outer world (above, light) and the interior (below, dark).** Extraverted chambers ride above the Surface, facing the weather; introverted chambers hang below, facing the depths. Chamber size, brightness, and conduit thickness fall off with stack rank (§3.1 presets). Attention circulates through the assembly as a particle current. Load on one end of a beam starves and pressurizes the other end — the axes are live seesaws. Sustained overload tilts the whole assembly; a capsize is the grip. The result reads simultaneously as a **hierarchy** (size/brightness), a **feedback loop** (the circuit), and an **orbital system** (chambers suspended about a core) — the three candidate topologies from the brief are all present, because each carries a different true claim, and the two-axis mobile is the one geometry that carries all three at once.

## 3.2 Anatomy

```
                          T H E   W O R L D
                     (stimulus weather falls from above)

                 ◉ Ne  ← dominant: large, bright, open-ringed,
                ╱         riding high — the biggest thing the
               ╱          world sees of this psyche
              ╱                          ○ Te  ← tertiary: modest,
             ╱                          ╱        eager, above water
  ~~~~~~~~~~╱~~~~~~~~~~~⊙~~~~~~~~~~~~~╱~~~~~~  THE SURFACE
           ╱          core           ╱         (self/world boundary)
          ╱        (the ego:       ╱
         ╱          no color,     ╱   ● Fi  ← auxiliary: dense,
        ╱           routes       ╱          luminous core, first
       ╱            attention)  ╱           mate below the line
      ⬡ Si  ← inferior: small, deep,
              sealed, easily flooded
                       T H E   I N T E R I O R
              (strata, tone, records — the private ground)
```
*(ENFP shown. Beam 1 = perception axis Ne–Si; beam 2 = judgment axis Fi–Te. Every chamber is the existing page glyph at `compact` LOD with its §3.1 rank preset applied.)*

| Element | Spec |
|---|---|
| **The core** | Small ring at the beam crossing, floating on the Surface. Deliberately colorless (cf. Fe's grey-when-empty nucleus — but structural here: *the ego has no element*). Holds the attention budget and the tilt state. Its ring fill is the global energy gauge in miniature. |
| **The beams** | Two luminous conduits crossing at 55–70°, tilted so each carries one end above and one below the Surface. Thickness tapers by rank weight (1.0 / .75 / .45 / .25) — the taper *is* the hierarchy, read at a glance. |
| **The chambers** | The four function engines, compact-mounted, rank preset applied (`scale` 1.0/.8/.55/.4 etc.). Each keeps its micro-battery and thermal sliver (§4.1) and gains one new pip: **axis pressure** (§3.6). Clicking a chamber deep-links to its function page, position-parameterized (§5.1 bridge, reversed). |
| **The Surface** | Gently animated waterline with a soft specular. Above: pale gradient, stimulus weather. Below: dark gradient over the faint topographic watershed texture (§4.1). *Vocabulary note:* this is the **self/world boundary** of §3.4's loop diagrams — not the Zone-B "waterline" that separates conscious from shadow slots. The shadow register is out of scope for Playground v1 (§8.4); if v2 adds it, shadow chambers appear as dim reflections beneath the interior floor, keeping the two boundaries distinct. |

## 3.3 The two invariants the geometry proves silently

Because attitudes alternate down the stack and axis partners always oppose in attitude:

1. **Every type floats exactly two chambers above the Surface and two below.** No type is "an extravert with four outward functions" — the geometry refuses to draw one.
2. **Each world gets exactly one lens and one valve.** The above-Surface pair is always one perceiver + one judge; likewise below. Every psyche can both *see and decide* out in the world, and both *see and decide* down in the interior — just at wildly different gauges.

Neither invariant is ever captioned. Users who build three or four Vessels notice both on their own, which is the intended delivery.

## 3.4 Sixteen silhouettes

Rank sizing plus attitude placement gives each type a **distinct visual silhouette**: ENFP is a big violet sail high over a small amber keel; ISTJ is a massive amber hull deep below the line with a modest cyan mast above; INTJ hides its hugest chamber (Ni) underwater and shows the world mostly Te — *which is the "introverts lead with their auxiliary" doctrine, produced by the drawing instead of asserted by a caption.* The type picker (§2.4) uses these silhouettes as its thumbnails; with a little exposure users can identify types across the room by rigging alone, the way sailors read ships.

## 3.5 The attention circuit (how stimulus flows)

Attention tokens (§1.2's particle-fluid) circulate on a fixed circuit; scenario events modulate rate, routing, and color, never topology:

```
WORLD  ─┬─ raw phenomena ──────────▶ E-perceiver  (aperture: rank-sized)
        └─ demands & expectations ─▶ E-judge      (met at the rim)
                       │
                       ▼  (toll: attention budget at the core)
        I-perceiver ◀──┴──▶ I-judge
        banks, matches      tests against
        against record      framework/tone
                       │
                       ▼  verdict re-crosses the core
        ACTION exits ONLY through an above-Surface chamber:
        the E-judge (structured, deliberate) or the
        E-perceiver (improvised, in-the-moment)
```

Load-bearing consequences, all theoretically orthodox and all *visible*:

- **The interior has no door of its own.** Fi cannot act on the world directly; it can only send verdicts up to be *executed* by Ne or Te. Watching an intense below-Surface glow queue behind a thin above-Surface exit conduit is what "I feel it strongly but can't get it out" looks like.
- **Intake bandwidth is rank-sized.** An INTJ's world-facing perceiver is inferior Se: a pinhole. The torrent of raw event pouring at that pinhole while huge Ni waits below for the trickle *is* the felt truth of that type under sensory pressure.
- **The idle lap** (~8 s, one token completing the full out–in–out cycle with a traveling glint) is the Vessel's breathing — nothing on the canvas is ever static (§5.4 idle doctrine).

## 3.6 Seesaw dynamics (energy sharing and blocking)

Each beam enforces the axis constraint continuously:

```
activation(partner) ≤ 1 − 0.6 × activation(fn)     // per beam, per tick
pressure(partner)  += starvation × dt              // fills the pressure pip
```

Run Ne hot for long and Si's pip fills; at threshold, Si forces a brief **intrusion event** — a pressure release rendered in the starved function's own crude idiom (for suppressed Si: a sudden intrusive body-signal / health-worry token spawning below and shoving into the circuit uninvited). Auxiliary–tertiary seesaws the same way at lower gain. This is the mechanism that later makes loops and grip feel *inevitable rather than scripted*: the geometry has been whispering it all along.

## 3.7 Loops as geometry

A healthy lap crosses the Surface twice. A **loop** (§3.4: dominant + tertiary, same attitude, auxiliary bypassed) renders as a circuit that *stops crossing*: the ENFJ Fe–Se orbit spins entirely above the line (all engagement, no interiority); the INTP Ti–Si orbit grinds entirely below (all rumination, no reality-contact). The auxiliary's conduit visibly grays and narrows — §3.4's mechanic, transplanted whole. The existing **"break the loop"** interaction forces one token through the auxiliary conduit and the circuit re-crosses with a felt release.

## 3.8 Tilt, capsize, and the grip

- **Tilt** — sustained asymmetric load rotates the loaded beam a few degrees per sustained tick; global stress is partially *read off the hull angle*. A stressed Vessel visibly lists before any number says so.
- **Capsize = grip.** At grip trigger (§5.10) the dominant beam swings past its righting limit: the inferior chamber breaches the Surface — small, crude, suddenly *steering* — while the dominant plunges under, muted and dark. This is §3.4's grip doctrine ("a low-capacity chamber receiving a dominant-sized flood") given its most literal possible picture. Recovery actions (§5.10) apply righting moment; the beam swings back with a slow, heavy settle and a hangover shelf.

## 3.9 Rejected topologies, and the fallback

- **Pure vertical spine** (§4.1's default): clearest hierarchy, but it hides the axes — Dom and Inf read as merely "far apart," not *coupled*, and the E/I structure vanishes. Retained as the **reduced layout**: on narrow viewports and under `prefers-reduced-motion`, the Vessel collapses to the spine with axis brackets drawn as marginal links (§5.5 made this fallback natural; we keep that).
- **Pure orbital** (functions orbiting the ego at rank radii): beautiful idle, but connection topology is decorative — orbits don't explain *why* draining Ne agitates Si. The Vessel keeps the orbital *feeling* (chambers suspended about a core) and discards the physics-free part.
- **Free node graph:** maximum flexibility, zero pedagogy; chaos for novices (§4.1 already ruled this out for the Sandbox; doubly right here).

---

# 4. Phase 3 — The Voyage (scenario engine & internal monologue)

## 4.1 The pipeline

```
ScenarioSpec (JSON, §7.2)
   │
   ├─ 1. BRIEFING   user configures the interior priors (I-hooks)
   ├─ 2. WEATHER    surface hooks render as stimulus falling on the Vessel
   ├─ 3. READS      each chamber computes salience + reading from its hook
   ├─ 4. MONOLOGUE  four voices render, ordered by salience, voiced by rank
   ├─ 5. FORECAST   economy resolver prices every action; odds displayed
   ├─ 6. CHOICE     user forces one action (any action)
   └─ 7. LEDGER     receipt, meters, tilt/grip, counterfactual        (§5)
```

## 4.2 The hook system (the core data idea)

A scenario never addresses "the type." It publishes **eight hooks — one per function — split by what kind of fact each function consumes:**

- **Surface hooks (`se, ne, te, fe`)** are *objective features of the situation*, readable by anyone standing there: sensory intensity and urgency, ambiguity and latent possibility, stakes and metrics and resources, audience and social temperature. Authored fixed per scenario.
- **Interior hooks (`si, ni, ti, fi`)** are *facts about the experiencer*: is this familiar? was it foreseen? does it fit my model? does it strike my values true or false? These cannot be authored fixed — they are the **user-configurable priors**, set in the Briefing. This is the brief's key insight (introverted functions need pre-existing state) made structural: *the introverted half of the scenario is not in the scenario; it's in the person.*

A Vessel consumes the four hooks its chambers own. The other four lie dormant — until a demand routes across attitude (§5.2), in which case the routed handler consults *its own* hook, not the missing one's: an ISTJ asked "does this fit the theory?" answers it with Te (what does the standard say?) because it has no Ti hook to consult. The style difference is not a flavor line; it falls out of the data model.

## 4.3 The Briefing (context pre-configuration UX)

A pre-run panel, one instrument per interior hook, **each rendered in its function's own visual idiom** (compact reuse of the existing lab components — the pool, the streams, the lattice, the fork):

| Instrument | Control | States |
|---|---|---|
| **Si — the Pool** | The scenario's key phenomena listed as droplets; user files each against the strata | `familiar-good` (bright ring) · `familiar-bad` (dissonant ring) · `unprecedented` (no ring) |
| **Ni — the Convergence** | Was this on the trajectory? | `foreseen` (streams already bend toward it) · `blindside` (arrives orthogonal) — plus an optional expectation note |
| **Ti — the Lattice** | Does it fit the model? | `consistent` · `contradiction` (pick the axiom it breaks) |
| **Fi — the Fork** | Strike it against the core tone | valence slider −1…+1 (`rings false` ↔ `rings true`) + which value is struck |

Scenarios ship with **authored defaults** (the "canonical telling"); the Briefing is skippable on first run and increasingly interesting on reruns. The panel's header carries the teaching line: *"Same event, different past — different event."* Only the Vessel's own two interior instruments render live; the other two sit collapsed and ghosted with *"No chamber aboard reads this instrument — it will matter to the next Vessel you compare."*

## 4.4 Reads and salience

Each chamber computes, from its hook and its rank:

```js
salience(fn) = rankWeight(fn) × hookIntensity(fn) × affinity(fn, scenario)
// rankWeight: 1.0 / .75 / .45 / .25
```

Salience drives three things: **monologue order** (loudest first — usually the dominant, but a sensory emergency can make an INTJ's inferior Se yelp *first*, which is exactly right), each chamber's **visual activation** on the Vessel, and the read's **weight in the forecast**.

## 4.5 The monologue system

Four voices render in salience order, **voiced by rank** — rank controls register, never order:

| Rank | Register | Typography |
|---|---|---|
| Dominant | Fluent, confident, present-tense; frames the whole situation | Full weight, largest |
| Auxiliary | Advisory, supportive of or braking the dominant ("we could…", "hold on—") | Medium |
| Tertiary | Eager, simplistic, occasionally childlike; volunteers | Light, smaller |
| Inferior | Fragments; visceral monosyllables or sudden absolutist demands; sometimes cut off mid— | Smallest, low-opacity, arrives last unless spiking |

Authoring model (§7.2): each scenario carries **one line-set per function per hook-state** — authored for all eight functions, so any Vessel finds its four, and routed styles come free. A register transformer applies rank voice programmatically (truncation, hedging, intensifiers), with optional hand-authored overrides for money lines. Cost: ~12–20 authored lines per scenario. The transformer keeps a scenario authorable in an afternoon, which decides whether the deck ever grows.

Monologues are the mode's soul, so one guardrail from §5.6 applies doubly: voices express *preference and cost*, never verdicts about what the user should value. The inferior is rendered with dignity — a small chamber under pressure, not a punchline.

## 4.6 Back-compatibility with §4.2's six sliders

"Forge a Scenario" keeps the six-slider vector as the **novice authoring path**; sliders compile to hook defaults (novelty→`ne`/`si`, urgency→`se`/`te`, sensory→`se`, social→`fe`, structural→`te`, values-charge→`fi`). Hook-level authoring is the full path. Nothing already specified is discarded.

---

# 5. Phase 4 — The Ledger (action, cost, and the economy)

## 5.1 Actions and signatures

Every action card carries a **signature**: a distribution over the eight functions describing *whose kind of work this act is*, plus an intensity:

```js
{ id: 'correct-the-record',
  label: 'Calmly correct the record — now, with evidence',
  signature: { te: .5, se: .3, fe: .2 },   // Σ = 1
  intensity: 0.7 }                          // how big an act this is, 0–1
```

Signatures are authored against *the action*, not the type — the same card is priced differently by every Vessel, which is the entire show.

## 5.2 The routing theorem (why "anyone can do anything" is structural)

Every legal stack contains **each element exactly once** — one N, one S, one T, one F (dominant+inferior cover one dichotomy, auxiliary+tertiary the other). Therefore *every* demand has exactly one handler in every type:

```js
route(fn, stack):
  if fn ∈ stack        → that chamber, τ = 1.0
  else                 → the stack's same-element chamber, τ = 1.5   // attitude tax
```

The tax prices the *translation*: Ti-work done by Te is done externally (checkable steps, references, delegation to standards) rather than internally (a private formal model). No demand is ever unroutable; no type ever gets "can't." The model doesn't *assert* the thesis — it is incapable of expressing its negation.

## 5.3 The cost formula

```js
// Constants (house canon where it exists)
M       = { dom: 1.0, aux: 1.5, tert: 2.5, inf: 4.0 }   // §3.3 activation multipliers
W       = { dom: 1.0, aux: .75, tert: .45, inf: .25 }   // rank weight
P_RATE  = { dom: 1.0, aux: .70, tert: .30, inf: .10 }   // pleasure rate
TAU     = 1.5          // attitude-translation tax
K       = 10           // energy units per unit demand  (pool = 100/day)

energyCost(action, vessel, ctx):
  C = 0
  for (fn, share) of action.signature:
    { slot, τ } = route(fn, vessel.stack)
    g           = gate(slot.fn, ctx)            // §5.4, from the hooks: 0.6 … 1.8
    C += K × action.intensity × share × M[slot.rank] × τ × g
  C -= convictionSubsidy(action, vessel, ctx)   // §5.5
  C -= flowRefund(action, vessel)               // §5.7
  return max(C, 1)
```

## 5.4 Context gates (the hooks pricing the machinery)

Gates are where the Briefing reaches the arithmetic — authored per hook-state, bounded [0.6, 1.8]:

| Hook state | Gate on that function | Reading |
|---|---|---|
| `si: familiar-good` | ×0.7 | Precedent discount — the checklist already exists |
| `si: unprecedented` | ×1.6 | The librarian in a library with no books |
| `ni: foreseen` | ×0.7 | The insight was pre-paid |
| `ni: blindside` | ×1.5 | Converging from scratch, live |
| `fi/ti: consistent` | ×0.8 | The framework carries part of the load |
| `fi: rings false` (acting *with* the violation) | ×1.8 | Self-betrayal surcharge — distinct from the stress mandate below |
| `se: high intensity` | ×0.8 / `empty field` ×1.4 | Even a dominant is expensive when starved (§0.2-4) |
| `fe: hostile audience` | ×1.5 | The room resists conducting |

## 5.5 Mandates and the conviction subsidy (out-of-character behavior, priced honestly)

A judging chamber whose hook reads extreme develops a **mandate** — a directed push for/against specific actions:

```js
mandateStrength = |hookValence| × W[judgeRank]        // 0 … 1

// Defying a mandate:
ΔStress += 15 × mandateStrength                        // immediate
ΔStress +=  2 × mandateStrength / tick                 // rumination interest,
                                                       // until addressed or day-reset
// Obeying a mandate through expensive machinery:
convictionSubsidy = min( .35 × mandateStrength, .5 ) × rawCost
```

The subsidy is the model's answer to "why did the gentle INFP publicly go to war?" — **a dominant judge can co-sign the bill for machinery the type barely owns.** Conviction doesn't make Te cheap for an INFP; it makes Te *affordable today*. And the rumination interest is the answer to "why couldn't they just let it go?" — because *letting it go* is a purchase with an interest rate.

## 5.6 Pleasure, stress, and the price of inaction

```js
pleasure(action) = Σ K × intensity × share × P_RATE[rank] / τ        // machinery joy
                 + 7 × mandateStrength (if the action serves it)      // vindication
                 + flow bonus (§5.7)

stress(action)   = Σ inferior-line surge:  K × intensity × share_inf × 1.2 × audienceMul
                 + Σ tertiary-line strain: K × intensity × share_tert × 0.5
                 + mandate defiance (§5.5)
                 + exposure: τ-taxed shares performed before an audience, ×0.5
                 − relief: 5 × mandateStrength when a violated mandate is answered
```

Every deck includes suppressive options (*"let it pass"*), and they run through the same math: real signatures (usually I-judge + E-judge masking work), real gates, and — when a mandate is live — defiance stress with interest. The most important receipt in the whole mode is the one proving **silence wasn't free.**

## 5.7 Flow refund

If the dominant carries ≥ 40% of an action's routed load, 25% of the dominant's line item refunds over the following seconds — §3.3's flow-state micro-recovery ticks, now load-bearing in gameplay: dominant-aligned action is how a Vessel *makes* energy back.

## 5.8 Meters and the weather map

- **Per chamber:** micro-battery (local fatigue), thermal sliver (recent load), pressure pip (axis starvation) — first two already exist (§4.1).
- **Global:** Energy 0–100 (daily pool; restored by rest, flow, day reset) and Stress 0–100 (decays −4/rest tick) as two independent bars, plus the **quadrant chip**:

```
            high energy
     FLOW        │       WIRED
  (low S, hi E)  │    (hi S, hi E)
  ───────────────┼───────────────── stress →
     SETTLED     │       GRIP RISK
  (low S, lo E)  │    (hi S, lo E)
            low energy
```

The Vessel's hull tilt (§3.8) tracks the stress bar; the core's ring fill tracks energy — the numbers are always also *somatic*, on the body of the thing.

## 5.9 The forecast (probability on screen)

Before the user chooses, the resolver prices every card and renders odds:

```js
burden(a)  = energyCost(a) + stress(a) − 0.5 × pleasure(a)
P(a)       = softmax( −burden(a) / T ),  T = 12          // fixed v1; see §8.3
```

Displayed as quiet probability pips per card: *"Left to itself: 48%."* The user then forces any action — and the receipt header records the defiance: *"You made this Vessel take its 6% road."* Probability-under-conditions is the stated educational goal; the forecast is that goal, on screen, falsifiable by reruns with different Briefings.

## 5.10 Grip: trigger, play, recovery

- **Trigger:** `energy < 20 ∧ stress > 70`, or any single action whose stress line exceeds 35.
- **Play:** capsize (§3.8). The action deck is *replaced* by the *grip deck* — compulsive, crude, inferior-signature actions, temporarily priced cheap (the inferior's M drops to 1.0: in the grip, the crude thing is the *easy* thing) but with degraded outcome quality and stress interest. Monologue inverts: the inferior speaks first and fluently — in its crude register; the dominant is fragments.
- **Recovery:** a *recovery deck* per type — the dominant's recharge verb + auxiliary re-engagement (§3.4's break-the-loop doctrine). Righting is slow and applies §3.3 Chart-3's hangover shelf: all chambers −fidelity until the next day-reset. Grip is a consequence, never a game-over screen.

## 5.11 The receipt and the counterfactual

After execution, the **receipt** slides in — the Ledger's centerpiece, deliberately styled as an itemized bill:

```
  CORRECT THE RECORD — intensity .7          ENFP? no: INFP     ← vessel chip
  ────────────────────────────────────────────────
  Te .5  → Te (inferior, ×4.0)               14.0 u
  Se .3  → Si (tertiary, ×2.5, tax ×1.5)      7.9 u
  Fe .2  → Fi (dominant, ×1.0, tax ×1.5)      2.1 u
  conviction subsidy — Fi (fairness, .85)    −7.1 u
  ────────────────────────────────────────────────
  ENERGY                                     16.9 u
  STRESS   inferior surge +5.5 · exposure +3.9 · value answered −5.0   → +4.4
  PLEASURE machinery +2.1 · vindication +6.0                           → +8.1
```

Then the meters animate — the chambers that paid, flash and drain *individually*; the hull takes its tilt; the bars move. Footer chip: **"Run this receipt on another Vessel →"** — splits the canvas (Compare Mode, §4.4, inherited), ghost Vessel alongside, same action replayed, receipts side by side. This is the single most persuasive artifact the Playground produces, and the shareable one (replay permalinks per §4.4: seed + type + briefing + action).

## 5.12 Worked example — one action, two Vessels

Scenario `credit-thief` (§6): in the sprint review, a colleague presents your architecture as their own. Briefing (this telling): `si: familiar-bad` (third time), `ni: foreseen`, `fi: fairness struck, −0.85`, surface: 9 people, tense-polite, promotion review in six days.

**Action A1 — "Calmly correct the record, now, with evidence"** `{te:.5, se:.3, fe:.2}`, intensity .7:

| | **INFP** (Fi·Ne·Si·Te) | **ENTJ** (Te·Ni·Se·Fi) |
|---|---|---|
| te .5 → | **Te inferior** ×4.0 = 14.0 u | **Te dominant** ×1.0 = 3.5 u |
| se .3 → | Si tertiary ×2.5 ×τ = 7.9 u | Se tertiary ×2.5 = 5.3 u |
| fe .2 → | Fi dominant ×1.0 ×τ = 2.1 u | **Fi inferior ×4.0 ×τ = 8.4 u** |
| conviction subsidy | Fi mandate .85 → **−7.1 u** | Te mandate .70 → −4.2 u |
| flow refund | — (dom carried 9%) | −0.9 u (dom carried 41%) |
| **ENERGY** | **≈ 17 u** | **≈ 12 u** |
| **STRESS** | **+4 net — spiky** (surge +5.5, exposure +3.9, value answered −5) | **≈ −1 net** (Fi-line strain +1.7, relief −4) |
| **PLEASURE** | +8 (mostly vindication) | +8 (mostly machinery; this is Tuesday) |
| **FORECAST** | 41% *(6% if fairness were only −0.2 — then A2 dominates)* | 63% |

Three teachings, straight off the table: **(1)** both Vessels *can* do it, and even the energy gap is modest *today* — because conviction subsidized the INFP; **(2)** the real difference is *where the load lands* (the INFP's bill is an inferior surge and an exposure premium; the ENTJ's single most expensive line is the diplomacy — `fe → Fi inferior` — the confrontation is free, the *not scorching the room* is what costs); **(3)** drop the Fi valence to −0.2 and the INFP's forecast collapses to 6% — same person, same act, different *conditions*. And the INFP's cheap-looking alternative — A3, "let it pass, privately re-plan" — prices at ≈15 u of taxed machinery **plus** +13 defiance stress **plus** rumination interest per tick: the receipt that proves swallowing it wasn't the cheap option. That receipt is the thesis.

---

# 6. Data model — the worked ScenarioSpec

```js
// src/data/scenarios/credit-thief.js
export const CREDIT_THIEF = {
  id: 'credit-thief',
  title: 'The Credit Thief',
  vignette: 'Sprint review, nine people. A colleague is presenting your architecture as their own. The promotion list closes in six days.',

  /* ---- surface hooks: objective, E-readable, fixed by the author ---- */
  surface: {
    se: { intensity: .35, urgency: .70, affordances: ['speak now', 'catch them after'] },
    ne: { ambiguity: .40, possibilities: ['misunderstanding?', 'test?', 'pattern?'] },
    te: { stakes: .80, metric: 'promotion review, 6 days', resources: ['commit history', 'design doc'] },
    fe: { audience: 9, tone: 'tense-polite', expectation: 'keep the meeting on track' },
  },

  /* ---- interior hooks: priors, user-configured in the Briefing ---- */
  interior: {           // authored DEFAULTS; every field user-overridable
    si: { familiarity: 'familiar-bad', precedent: 'third time with this colleague' },
    ni: { trajectory: 'foreseen', note: 'this is how they got the last title' },
    ti: { modelFit: 'contradiction', axiom: 'credit follows authorship' },
    fi: { valence: -0.85, value: 'fairness' },
  },

  /* ---- context gates: hook-state → per-function cost multiplier ---- */
  gates: {
    si: { 'familiar-good': .7, 'familiar-bad': 1.0, 'unprecedented': 1.6 },
    ni: { foreseen: .7, blindside: 1.5 },
    fe: { audience9: 1.2 },              // conducting a full room
  },

  /* ---- the deck; signatures sum to 1; inaction included and priced ---- */
  actions: [
    { id: 'correct-now',   label: 'Calmly correct the record — now, with evidence',
      signature: { te:.5, se:.3, fe:.2 }, intensity:.7,
      mandates: { serves: ['fi.fairness', 'te.stakes'] } },
    { id: 'smooth-defer',  label: 'Smooth the moment; address it one-on-one after',
      signature: { fe:.4, ni:.3, si:.3 }, intensity:.5,
      mandates: { serves: ['fe.expectation'], defers: ['fi.fairness'] } },   // half-answer: ×.5 relief
    { id: 'quiet-replan',  label: 'Say nothing; quietly re-plan around them',
      signature: { ti:.4, ni:.4, si:.2 }, intensity:.4,
      mandates: { defies: ['fi.fairness'] } },
    { id: 'improv-reclaim',label: 'Jump in and build on “their” idea until authorship is obvious',
      signature: { ne:.4, se:.3, fe:.3 }, intensity:.6,
      mandates: { serves: ['fi.fairness'], style: 'oblique' } },
  ],

  /* ---- monologue line-sets: all 8 functions × hook states; the register
          transformer (§4.5) voices them by rank at runtime ---- */
  monologue: {
    ne: { base: 'Or — wait — is this a misunderstanding? There are four ways this could be read, and two of them are funny.' },
    ni: { foreseen: 'There it is. Right on schedule. And I can see the next three moves from here.',
          blindside: 'This wasn\'t in the picture. Recomputing the whole shape of this person.' },
    se: { base: 'They\'re mid-slide. Eyes are on them. There is a gap after this bullet — it\'s closing.' },
    si: { 'familiar-bad': 'Third time. March, the standup in June, now this. The record is unambiguous.',
          'unprecedented': 'No file for this. Nothing matches. I have nothing for you.' },
    te: { base: 'The commit history exists. Two sentences and a link settle this. Cost of silence: the review reads wrong for six more days.' },
    ti: { contradiction: 'Credit follows authorship. That axiom just failed in production. The model requires a correction — somewhere, from someone.' },
    fe: { base: 'Nine people. The temperature will drop ten degrees the moment this is raised. Who carries that cold, and for how long?' },
    fi: { struck: 'No. This one is not negotiable. I don\'t care what it costs — some things you don\'t let stand.',
          mild: 'It stings. It probably isn\'t the hill.' },
  },
};
```

**Resolver sketch** (pure functions, ~200 lines, `src/playground/ledger.js`):

```js
export function resolve(action, vessel, scenario, briefing) {
  const lines = Object.entries(action.signature).map(([fn, share]) => {
    const { chamber, tau } = route(fn, vessel);            // §5.2
    const gate = gateFor(chamber.fn, scenario, briefing);  // §5.4
    return { fn, chamber, share, tau, gate,
             cost: K * action.intensity * share * M[chamber.rank] * tau * gate };
  });
  const mandates = liveMandates(vessel, briefing);          // judging chambers, extreme hooks
  const subsidy  = convictionSubsidy(action, mandates, sum(lines));   // §5.5
  const refund   = flowRefund(lines, vessel);                          // §5.7
  return {
    lines, subsidy, refund,
    energy:   Math.max(1, sum(lines) - subsidy - refund),
    stress:   stressItems(lines, action, mandates, scenario),          // §5.6, itemized
    pleasure: pleasureItems(lines, action, mandates),                  // §5.6, itemized
  };            // ← this object IS the receipt; the UI just typesets it
}
```

The resolver never touches a renderer; the receipt object drives the receipt UI, the meter animations, the forecast, and the counterfactual identically — §6.4's "one table, no special cases" doctrine, applied to the economy.

---

# 7. Schemas & engine bindings (reference)

## 7.1 Type (derived, never stored)

```js
// The 16 are DERIVED from (domFn, auxFn) at runtime — storing them would
// invite drift from the Laws. deriveStack(dom, aux) applies Law III twice.
type Fn      = 'ne'|'ni'|'se'|'si'|'te'|'ti'|'fe'|'fi';
type Rank    = 'dom'|'aux'|'tert'|'inf';
type Vessel  = { stack: Record<Rank, Fn>, energy: 0–100, stress: 0–100,
                 tilt: {perc: deg, judg: deg}, pressure: Record<Fn, 0–1>,
                 mode: 'flow'|'wired'|'settled'|'gripRisk'|'grip' };
```

## 7.2 Scenario / Action / Receipt

As in §6: `surface` (4 fixed hooks) · `interior` (4 default-able hooks) · `gates` · `actions[]` (signature, intensity, mandate couplings) · `monologue` (8 line-sets keyed by hook state). `Receipt = { lines[], subsidy, refund, energy, stress[], pleasure[] }`.

## 7.3 Engine contract additions (the only asks)

| Addition | Who | Why |
|---|---|---|
| `compact: true` mount option (LOD: node/stratum counts halved, HUD off) | all 8 glyphs | 5 live engines on one canvas inside §6.1's 8 ms Sandbox budget |
| shared external clock (`step(dt)` driven by `VesselBus`, engine rAFs disabled) | all 8 | lockstep determinism across chambers |
| `supply` param (0–1) scaling idle animation vigor | all 8 (some have it) | micro-battery → visible vigor |

Everything else the Playground calls — `setTarget`, `scenario(key, impact)`, `pulse`, state streams, `renderStatic` — already exists.

## 7.4 `VesselBus`

```js
new VesselBus({ seed, vessel })
  .mount(canvas)               // layout §3.2; chambers = engines, compact
  .step(dt)                    // one clock: chambers, circuit, seesaws, tilt, decay
  .applyScenario(spec, briefing)
  .execute(receipt)            // animates lines → chambers, meters, tilt, grip check
  .channels                    // { energy, stress, mode, perChamber[...] } for the HUD
```

## 7.5 Files

```
playground/index.html            playground/main.js (~250 lines, si/main.js as template)
src/playground/assembly.js       builder beats, Laws, refusal physics      (§2)
src/playground/vessel.js         layout, circuit, seesaw, tilt, capsize    (§3)
src/playground/briefing.js       four interior instruments                 (§4.3)
src/playground/monologue.js      salience sort + register transformer      (§4.5)
src/playground/ledger.js         route/gates/mandates/resolve — pure fns   (§5)
src/playground/forecast.js       softmax odds + pips                       (§5.9)
src/data/playground-data.js      LAWS copy, ECON constants, register rules
src/data/scenarios/*.js          6–8 authored ScenarioSpecs at launch      (§6)
src/styles/playground-theme.css  neutral chrome — chambers keep their own themes
+ header.js: add 'playground' to LIVE · index.html: promote card · vite.config.js: add input
```

## 7.6 Build order

1. **Vessel idle** — assembly hand-placed in code; 4 compact engines, circuit, seesaws. *Proves the canvas.*
2. **The Assembly** — beats, Laws, refusals, entailment, type reveal, three doors, Free Play.
3. **Voyage + Ledger** — 2 scenarios, briefing, monologues, resolver, receipt, forecast.
4. **Consequence & compare** — grip/recovery, counterfactual split, permalinks; scenario deck to 6–8.

Accessibility rides along, not after: reduced-motion swaps the circuit for annotated static flow arrows and receipt tables render-first (§3.5 doctrine); the spine fallback (§3.9) is the narrow-viewport layout from build 1.

---

# 8. Open questions (honest ones)

1. **TAU = 1.5 is a guess.** The attitude tax is the least-grounded constant in the model; it needs playtesting against felt plausibility (receipts INFPs recognize as *their* bills). Plan: expose it in a dev-only tuning drawer during Phase 3.
2. **Monologue authoring scale.** 8 line-sets × hook states × 8 scenarios ≈ 150 authored lines plus register QA. Tractable, but the register transformer must earn ~60% of the voice or the deck stops growing. Validate on scenario #2, not #8.
3. **Softmax temperature** (`T = 12`) — one fixed impulsivity for all Vessels is a simplification; a per-Vessel or stress-coupled T is theoretically defensible and one line of code. Deferred to keep v1's forecast legible.
4. **The shadow four.** Beebe's 5th–8th would double the routing table's honesty (demands could land *below* the interior floor). Deliberately out of v1: the Playground teaches with four voices or it drowns in eight. The Vessel's geometry reserves the space (§3.2).
5. **Day loop.** Multiple scenarios against one pool (pacing, recovery scheduling, end-of-day log) is designed-around (§5.8's daily framing) but ships v1.5 — single-scenario sessions must feel complete first.

---

*Epistemic footer, carried from `DESIGN.md` §6.3, doubly binding here: the Playground animates an interpretive model, not measured psychology. Receipts are the model's arithmetic, not a person's worth — the copy never diagnoses, and every silhouette is a cost profile, not a cage.*

*End — Playground Mode Specification v1.0*
