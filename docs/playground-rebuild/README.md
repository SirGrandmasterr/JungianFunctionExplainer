# Playground Rebuild — structure phase

Grayscale wireframes and diagrams for the rebuilt Playground, plus a build spec written for an
implementer with no context on the conversation that produced it.

**Phase discipline:** no colour, no type scale, no glyph artwork, no motion curves, no application
code. Those come next, and they will be chosen better once the structure is settled.

## Read in this order

1. **[00-BRIEF.md](00-BRIEF.md)** — why a Playground of this kind fails users, the three questions
   the interface must answer at a glance, three genuinely different layout strategies for the main
   view, the recommendation and what it trades away.
2. **S3** then **S5** — the main view, then one Reaction Window with every sub-component labelled.
3. **D3**, **D4**, **D6** — the state machine, the hover data flow, the timing model.
4. **[BUILD-SPEC.md](BUILD-SPEC.md)** — data model, interaction semantics, simulation rules,
   aggregation rules, component tree, perf budgets, open questions, deferral register.
5. **[IMPLEMENTATION-NOTES.md](IMPLEMENTATION-NOTES.md)** — the delta record from actually building
   it. Seven defects the spec could not have revealed on paper, six deliberate departures, and what
   was verified. **Supersedes BUILD-SPEC wherever they disagree.**

The Playground is implemented: `playground/` plus `src/playground/`. Run it with `npm run dev`
and open `/playground/` (or `/playground/?type=ISTP` to skip assembly).

## Wireframes

| | | |
|---|---|---|
| [S1](S1.svg) | Stack assembly / type selection | two choices, two entailments |
| [S2](S2.svg) | Scenario browser and briefing | predispositions and cost gates, stated before anything is priced |
| [S3](S3.svg) | Playground main view — resting | the Ledger: rank-ordered rows, involvement spine, aggregate band |
| [S4](S4.svg) | Playground main view — mid-hover | forecast overlays on all four rows, the spine, and the aggregate |
| [S5](S5.svg) | One Reaction Window, expanded | every sub-component labelled, plus the three fidelity tiers |
| [S6](S6.svg) | Whole-Human aggregate | four function states become one human state |
| [S7](S7.svg) | Loop active — ISTP Ti–Ni | auxiliary bypassed, deck regenerated |
| [S8](S8.svg) | Grip active — ISTP Fe grip | inferior hijack, row heights swapped, alleviate/aggravate cards |
| [S9](S9.svg) | Post-action resolution | what changed, what it cost, the same action billed to four other psyches |
| [S10](S10.svg) | Narrow viewport — 390px | accordion of four, rotated spine, docked aggregate, press-and-hold forecast |

## Diagrams

| | | |
|---|---|---|
| [D1](D1.svg) | Screen map / IA | four routes; six of the ten are states or disclosures of S3 |
| [D2](D2.svg) | Primary user flow | land → assemble → forecast → commit → state → recover or spiral → resolve |
| [D3](D3.svg) | State machine | Balanced · Strained · Loop · Grip · Recovery, with hysteresis and manual overrides |
| [D4](D4.svg) | Hover data flow | three inputs, one pure kernel per function, five readouts × four, one roll-up |
| [D5](D5.svg) | Component hierarchy | one Reaction Window, with props |
| [D6](D6.svg) | Timing model | what the x-axis means, how far back history runs, where the forecast is drawn |

Every wireframe carries numbered callouts with a legend beneath giving, for each region, what it
does and how it behaves **on hover**, **on commit**, and **under loop or grip**.

## Regenerating

The SVGs are build output. Edit the generator, not the files.

```bash
node docs/playground-rebuild/wireframe-src/gen.mjs
```

`wireframe-src/lib.mjs` holds the primitives (grayscale ramp, meters, the seismograph, the eight
glyph stand-ins, the callout/legend system). `parts.mjs` holds the shared Playground furniture
that S3, S4, S7 and S8 all reuse. `screens-a.mjs` / `screens-b.mjs` / `diagrams.mjs` hold the
sixteen figures.

The glyph marks in these wireframes are **schematic stand-ins**, distinct in silhouette so each
function is separable by shape as well as by position and label. The real glyphs are the existing
canvas engines in `src/engines/<fn>-glyph.js`.

Worked type throughout: **ISTP** (Ti / Se / Ni / Fe). Worked scenario: **The Credit Thief**.
