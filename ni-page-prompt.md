# Build the Ni page for CURRENTS

You're working in `C:\Users\fame_user\Documents\Gitstuff\JungianFunctionExplainer` — CURRENTS, an interactive atlas of the eight Jungian cognitive functions. Three of the eight pages are live (Ti, Fi, Te). Your job is the fourth: **Ni — Introverted Intuition, "The Convergence."**

Right now `ni/index.html` is a 23-line "Phase 2" placeholder. Replace it with a full six-zone page at the same standard as Te.

## Why this is the interesting one

The three finished pages are all *legible* functions. Ti builds a lattice you can watch grow. Te throws up a scaffold with a throughput counter ticking in the corner. Fi is a mist nebula that visibly takes a colour. Each one had a mechanism that could simply be drawn.

Ni has no mechanism to draw. Its entire phenomenology is **absence, then certainty**: dozens of faint streams funnel inward for a long quiet while, nothing legible happens, and then a single point flares with an answer that arrives whole and cannot show its work. That's the hardest brief in `DESIGN.md`, and it comes with a trap built in — *a page about a slow function must not be a slow page.* If the hero glyph makes someone wait 40 seconds for its first insight flare, you've been faithful to the theory and shipped something nobody scrolls past.

It's also the first **perceiving** function in the atlas, which means two systems get invented here rather than inherited:

- The shape grammar flips. Every glyph so far has been a judging chamber — hexagonal, latticed, a valve that sorts. Perceiving functions are **circular apertures/lenses** that gather (§1.3). Nobody has drawn one yet.
- Zone D flips. `DESIGN.md` §2.5 states plainly that perceiving-function pages **replace the Verification Lab with a perception fidelity lab**. There is no reference implementation. You're designing that zone, not porting it.

Get this page right and the remaining four (Ne, Se, Si) inherit both patterns from you.

## Read these first, in this order

1. `DESIGN.md` — the whole thing, but especially §1.3 (visual grammar), §2.2–2.8 (zone anatomy), §3.1 (parametric glyph model), §3.3 (energy suite), §5.3 (progressive disclosure), §5.6 (tone guardrails).
2. `te/index.html`, `te/main.js`, `src/data/te-data.js` — the most recent and most refined page. This is the template to match.
3. `src/engines/te-glyph.js` — how a glyph engine is structured (~950 lines: build/step/draw/renderStatic + a spawn API for the lab).
4. `src/engines/fi-glyph.js` + `src/engines/fi-mist-gpu.js` — the other end of the aesthetic range, and proof that an engine may deviate from the Te shape entirely when the function demands it.
5. `src/shared/stack-rail.js`, `src/shared/feeder-coupling.js`, `src/shared/energy-charts.js`, `src/utils/math.js`, `src/utils/dom.js` — the shared machinery you get for free.

## The architecture you're extending

A function page is five files plus three integration points:

| File | What it holds |
|---|---|
| `ni/index.html` | Six `<section>`s, same ids/classes as `te/index.html` (`#zone-a`…`#zone-f`, `#glyphHero`, `#railSlots`, `#glyphRail`, `#dial`, `#ageSlider`, `#feederChips`, `#feederCanvas`, `#verifyCanvas`, `#costChart`, `#drainChart`, `#scrub`, `#recCharts`, `#tooltip`) — the shared modules query these by id |
| `ni/main.js` | Thin orchestrator: load data, construct glyph instances per zone, wire Zone D interactions. Keep it ~150 lines like `te/main.js` |
| `src/data/ni-data.js` | **All** copy, parameters, curves, and captions. One exported `loadNiData()` returning `{ COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, VERIFY, HERO, ZONE_B…ZONE_F }`. Per §6.1 the theory layer stays declarative and separable from rendering |
| `src/engines/ni-glyph.js` | `export class NiGlyph` with the same public contract as `TeGlyph`: `constructor(canvas, {seed, coreGlow, hudScale, interactive, COL})`, `setTarget(params)`, `setStructure({countMul,k,rigidity})`, `setFeeder(f)`, `pulse(color)`, `spawnSub(kind, opts)`, `step(dt)`, `draw()`, `renderStatic()`, `start()`, plus live `stress`/`pleasure`/`subs`/`bombard` fields. The shared rail and feeder modules depend on this contract |
| `src/styles/ni-theme.css` | Ten lines: `--c-accent`, `--c-accent-fg`, `--slot-active-bg`, `--pos-1`…`--pos-4` |

Integration points:

- `src/shared/header.js` — add `'ni'` to the `LIVE` set.
- `index.html` — promote the Ni card from a dim `<div>` "Phase 2" to a live `<a href="/ni/">` matching the Ti/Fi/Te cards.
- `vite.config.js` — already has an `ni` input; verify, don't duplicate.

Everything in `src/shared/` is generic and already parameterized. If a perceiving page genuinely needs a shared module to change, extend it **backwards-compatibly** and re-check that Ti, Fi, and Te still render — regressing a finished page to ship a new one is not a trade you're authorized to make.

## Design law for this page

Non-negotiable, straight from §1.3:

- **Colour:** intuition violet. `--c-n` is `#8b5cf6`. As the *introverted* member of the pair, Ni's accent should read deeper and denser than Ne's will — compare how `--c-accent` differs between Te (`#17d4ef`, radiant) and Ti (`#4fc9e0`) in `src/styles/`. Pick the `--pos-*` ramp in that spirit.
- **Attitude, triple-encoded:** introverted means (a) light *condensing* — dense luminous core, dark rim, never an outward halo; (b) a **closed double ring** boundary, not the gapped open ring Te uses; (c) particles that **circulate internally in orbital loops** instead of being emitted into the environment. All three, not one.
- **Role:** perceiving means a **circular aperture/lens**, not a hexagon with an internal lattice. Do not copy Te's hex geometry.
- **Kinetic signature (§2.2):** *"dozens of faint incoming streams slowly funneling toward a single point that periodically flares into a crystallized insight. Slow, patient, inexorable; long quiet periods punctuated by a sudden bright 'aha' flash."*
- **§3.1 parametric model:** `scale / fidelity / latency / noise / duty / control / contrary` must actually drive the render, because the rail glyph is the same object at eight different presets. A demon-slot Ni has to *feel* wrong — flickering, laggy, occasionally contrary — without any new code path.
- **§4 forward-compatibility:** the glyph is one renderable object reused at hero, rail, feeder, and lab scale, and eventually in the Sandbox. Don't hard-code hero dimensions.

Pacing guidance (yours to tune, but take it seriously): the hero should deliver its first flare within roughly 8–12 seconds and repeat on a rhythm that rewards watching, with the quiet stretches *visibly progressing* — streams thickening, the core densifying, a convergence readout climbing — so the wait reads as accumulation rather than as a stalled animation. Te's kinetic signature is a visible throughput counter; Ni's equivalent HUD is convergence, not output. And the flare, when it lands, should be worth the quiet.

## Zone-by-zone

**Zone A — hero.** Full-viewport `#glyphHero`, hero copy over it. Tag "introverted intuition", title, one-line subtitle in the register of Te's.

**Zone B — stack rail.** Feed `initStackRail()` your `SLOTS`. Eight slots, four visible + four below the waterline, each with `params`, a five-axis `dial` array, `types`, and a ~2–3 sentence `text`. Correct type mappings — derived from the Beebe shadow rule, so you don't have to:

| Slot | Types |
|---|---|
| Dominant | INTJ · INFJ |
| Auxiliary | ENTJ · ENFJ |
| Tertiary | ISTP · ISFP |
| Inferior | ESTP · ESFP |
| Opposing (5th) | ENTP · ENFP |
| Critical Parent (6th) | INTP · INFP |
| Trickster (7th) | ESTJ · ESFJ |
| Demon (8th) | ISTJ · ISFJ |

**Zone C — feeder coupling.** The alternation rule in this codebase: introverted judging is fed by extraverted perception, extraverted judging by introverted perception. Ni is introverted *perception*, so its canonical feeders are the extraverted judging functions: **Te (the INTJ/ENTJ coupling)** and **Fe (the INFJ/ENFJ coupling)** — the same convergence aimed at a system versus aimed at people. For the exotic set, note two structurally interesting cases and write them honestly:

- **Ni ← Se** is the unstable coupling and the exact mirror of Te's `Fi` entry (`src/data/te-data.js`): perception feeding perception, plus same-axis antagonism. Ni starves of judgment and Se floods it with a present it doesn't want.
- **Ni ← Ti / Ni ← Fi** are introverted judging feeding introverted perception — i.e. the INFJ Ni–Ti and INTJ Ni–Fi **loops** described in §3.4. Airless, self-sealing, no external correction. Worth saying so in the caption.

**Zone D — the perception fidelity lab (the design work).** Same DOM skeleton as `te/index.html`'s Zone D (buttons, two meters, `#verifyNarr`, `#verifyCanvas`) but a new mechanic. Te's version answers "what happens when results come back?"; Ni's answers **"what happens when perception converges — and when it converges wrongly?"** A menu of candidate events; pick the three or four that make the sharpest lesson and design the simulation so they compose:

- *Feed correlated fragments* — faint, individually meaningless inputs sink in and orbit; the convergence readout climbs; nothing legible happens yet.
- *Reach convergence* — enough signal accumulates and the core flares. The insight arrives whole, is instantly certain, and cannot be decomposed into the fragments that produced it. Pleasure spikes.
- *Premature convergence* — force a flare on thin data: bright, total, confident, wrong. This is the most valuable object on the page, because it's the page criticizing its own function honestly.
- *A contradicting fragment after the flare* — Ni's real failure mode isn't being wrong, it's the cost of revision: the image doesn't patch, it has to re-converge from the beginning. Stress climbs, the core dims, the long quiet restarts.
- *The literal present* — a Se-shaped fragment, concretely and immediately here, passes straight through the aperture unregistered. The blind-spot counterpart to Te's "unmeasurable claim," and the same kind of quietly devastating.

Meters: `System Stress` plus a pleasure meter renamed for Ni (Te uses "Throughput Satisfaction"; something like "Convergence Pleasure"). Narration follows Te's pattern — a staged sequence of strings in `VERIFY.narrations`, scheduled with `setTimeout` and re-entrancy-guarded by a run counter, with a fast-forward path for reduced motion.

**Zone E — energy economics.** Wire `initEnergyCharts()` with `SERIES`, `COSTS`, `RECOVERY`, `GRIP_T`. Model Ni's character rather than copying Te's numbers: dominant near-linear with **micro-recovery dips at each insight flare** (§3.3's flow-state ticks — Te's version is the milestone notch in `domDrain()`); inferior Ni exponential; shadow jagged. Recovery for inferior Ni carries the hangover shelf. Note for the copy: the grip pairing runs the other way here — Ni-dominant under collapse floods into **inferior Se** (§3.4: "sensory bingeing, recklessness"), while *inferior* Ni in ESTP/ESFP is the doom-vision — sudden apocalyptic certainty about the future, arriving in a voice that isn't theirs.

**Zone F — field notes.** Three vignettes and a sibling mirror. The mirror is **Ni vs Ne** — same element, opposite attitude: Ne fans one input into many futures, Ni funnels many inputs into one. Ne isn't built yet; use `--c-n` for the counterpart colour and don't link to a dead page. Close with the epistemic footer, verbatim from the other pages.

## Non-negotiables

- **Reduced motion.** `REDUCED` from `src/utils/dom.js` is checked everywhere: `setTarget` applies instantly and calls `renderStatic()`, the meter rAF loop doesn't run, and lab events fast-forward the sim with fixed `step(1/30)` iterations then a single `draw()`. Follow the `ffwd()` pattern in `te/main.js`. A page whose entire point is a slow build must still be fully comprehensible with animation off.
- **Accessibility (§3.5).** Every chart keeps its data-table toggle. Canvases carry meaningful `aria-label`s. Rail slots are a real `role="tablist"` and keyboard-operable. The scrubber updates `#scrubLive`. Never let colour alone carry attitude or status.
- **Determinism.** Seed with `mulberry32` from `src/utils/math.js`; different seed per zone instance, as `te/main.js` does. No `Math.random()` — replay permalinks depend on this later (§6.1).
- **Palette via CSS vars.** Read colours with `CSSVAR()` at load; never hard-code a hex the theme file should own.
- **No new dependencies.** Vanilla JS + Canvas 2D (WebGL2 only if you have a reason as good as Fi's mist had). Performance budget: idle glyph ≤ 2 ms/frame, and pause when off-viewport.
- **Tone (§5.6).** Playful in the interaction language, never diagnostic. Positions are cost profiles, not ability ceilings. Ni copy in particular attracts mystique — no oracles, no prophecy, no "rare and gifted." The existing pages' voice is dry, concrete, and unsentimental about the function's failure modes; match it.

## Verify before calling it done

The dev server is configured in `.claude/launch.json` as `currents` on port 5173 — start it with `preview_start`, never with a raw shell command. Then, at `/ni/`:

- Console clean, no network errors.
- Hero animates and reaches a flare in a sane amount of time.
- All eight rail slots click through, morph the glyph, rewrite the caption, re-plot the dial, and highlight the matching drain curve; the maturity slider visibly lifts the lower positions.
- Every feeder chip changes the chamber's *behaviour*, not just its tint.
- Every lab button runs its full narration without stuck states or double-fire.
- Cost / drain / recovery charts render, the scrubber drains the batteries, all three data tables toggle.
- `/ti/`, `/fi/`, `/te/` still work — regression check, especially if you touched anything shared.
- Re-check the page at mobile width and with `prefers-reduced-motion` forced on.

Then screenshot the hero mid-quiet and mid-flare, and tell me what you had to invent versus what you inherited.

## What excellent looks like

Someone who has never heard of cognitive functions lands on `/ni/`, watches the glyph for fifteen seconds without reading anything, and comes away knowing that this function is slow, that it doesn't work in pieces, and that when it finally speaks it is completely sure of itself. Then they click "premature convergence" and learn — from a visualization, not a caption — exactly why that certainty is worth distrusting.

That's the bar. `DESIGN.md` §1.4: *felt before read.*