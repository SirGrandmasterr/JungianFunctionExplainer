# Content Map & Copy Rework — Fable Prompt

One self-contained prompt, written to be handed to a model in a fresh session with the repo
checked out. It does two things that have to happen together: it pulls every user-facing
string in CURRENTS out of the four places it currently hides in and into a reviewable JSON
map, and it rewrites those strings so a reader can tell the difference between *what a
cognitive function does* and *the picture CURRENTS chose to draw of it*.

Runs on its own branch, `feature/content-map`. It is the prerequisite for
`i18n-ollama-prompt.md`, which translates the map that comes out of this one — so the
"forward compatibility" section near the end is load-bearing, not decoration.

---

````
You are working in CURRENTS: a static multi-page site (Vite 6, vanilla ES modules, no
framework, no templating step, zero runtime dependencies) that teaches the eight Jungian
cognitive functions.

Layout of the ground:
- Eight function pages at `fi/ ti/ te/ fe/ ne/ ni/ se/ si/`, each an `index.html` plus a
  `main.js` orchestrator. Every page is built from the same zones: A hero glyph, B stack
  rail, C feeder coupling, D the lab (named differently per function — "verification lab",
  "resonance lab", "divergence engine", "recognition lab"), E field notes.
- Three more pages: `energy/`, `phenomena/`, `playground/`.
- Shared behaviour: `src/shared/` — `stack-rail.js`, `feeder-coupling.js`, `field-notes.js`,
  `energy-charts.js`, `lab-layout.js`, `header.js`, `tooltip.js`.
- Per-page content and numbers: `src/data/<fn>-data.js`, plus `typology.js`,
  `playground-data.js`, `phenomena-data.js`, `energy-data.js`, `scenarios/*.js`.
- The Playground has its own UI layer at `src/playground/ui/*.js` and a generated-line
  corpus at `src/playground/corpus.js`.
- Rendering engines: `src/engines/*-glyph.js`, driven through a parameter vector.
- `DESIGN.md` is the design document. Its own rule: where implementation and document
  disagree, the implementation is the authority and the document gets a dated note.
- Dev server: `npm run dev` (launch config `currents`, port 5183). The Vite dev plugin in
  `vite.config.js` accepts a POSTed data URL at `/__shot` and writes a PNG into `.shots/`,
  which is how canvas output gets eyeballed in this repo.

BRANCH
Work on `feature/content-map`, cut from `main`. Commit in coherent steps. Do not merge, do
not rebase `main`, do not touch other branches.

──────────────────────────────────────────────────────────────────────────────
PROBLEM 1 — there is no map of the copy, so nobody can review it

Every user-facing string lives in one of four places, and nothing lists them:

  1. Static markup in the twelve `index.html` files — hero headline and subtitle, zone
     kickers, headings, ledes, button labels and sub-labels, meter labels, the epistemic
     footer, `aria-label`s, `<title>`s.
  2. `src/data/*.js` — the eight `SLOTS[].text` position descriptions, `CHARACTER[].why`,
     `FEEDERS[].text`, `RECOVERY[].note`, `VERIFY.narrations.*`, the `ZONE_F` field-note
     vignettes and mirror, the ten scenario files (title, blurb, vignette, action labels,
     details, outcomes, the `surface`/`interior` glosses), `typology.js` `AXES[].note` and
     `SOURCES`, `playground-data.js` `LAWS`/`EPISTEMIC`/`PROVENANCE`, `phenomena-data.js`.
  3. Hardcoded in shared and Playground UI modules — `header.js` brand line and nav labels,
     `field-notes.js` CTA sentences, `stack-rail.js` "Read this profile as text" and the
     derivation footnote, and roughly forty template literals across
     `src/playground/ui/*.js`.
  4. `src/playground/corpus.js` — ~150 authored voice lines keyed by (function, relation,
     state).

Count on the order of 500 prose keys in `src/data` alone, plus the markup and the module
literals. Two consequences, both real:

- Nobody can read the site's copy as copy. Reviewing the wording of the eight position
  descriptions today means opening eight files and scrolling past colour tables and drain
  functions.
- There is already silent duplication with a wrong side. Each `src/data/<fn>-data.js`
  exports `HERO`, `ZONE_B`, `ZONE_C`, `ZONE_D`, `ZONE_E` — hero title/subtitle, zone
  kickers, headings, ledes. Only `ZONE_F` is ever consumed (`field-notes.js`, via
  `data.ZONE_F` in the eight `main.js` files). The other five objects are dead copies of
  text that actually ships from the HTML. Edit them and nothing happens. Anything that
  extracts strings naively will pick up both copies and translate a ghost.

PROBLEM 2 — the copy is vague, and metaphor is doing the work explanation should do

The site is educational and currently English-only, and its prose keeps sliding into a
register where the reader cannot tell a claim from an image. Read the Ti dominant slot:

  "The world is a system to be understood. Analysis runs constantly and effortlessly, and
   feels like identity itself. The lattice is large, fast, and quiet — precision without
   strain."

Three sentences, and a reader who does not already know the theory learns: that Ti is about
understanding systems (a claim), that it runs constantly in the dominant seat (a claim
worth making precisely), and that something called "the lattice" is large and quiet (an
image, referring to a canvas animation, presented in the same voice as the claims). The
same pattern runs through `FEEDERS[].text`, the `VERIFY.narrations`, the vignettes and most
of the ledes: chambers, watersheds, currents, energy as a substance — all load-bearing,
none introduced. That is what makes the page read as esoteric. Not the imagery itself,
which is the point of the site, but the fact that the imagery is never separated from the
mechanism it depicts.

Your job is to build the map and, in the same pass, do that separation.

──────────────────────────────────────────────────────────────────────────────
DELIVERABLE A — the map

Create `content/en/`, one JSON file per namespace:

  content/en/site.json          header, nav, footer, landing page, shared UI strings
  content/en/ti.json … fe.json  one per function page (all five zones)
  content/en/energy.json
  content/en/phenomena.json
  content/en/playground.json
  content/en/typology.json      AXES notes, SOURCES, archetype glosses
  content/en/corpus.json        the Playground voice lines
  content/en/scenarios/<id>.json

Rules that are not negotiable:

- Keys are the contract. Stable, dotted, lowercase, derived from where the string is read
  and not from what it says: `ti.zoneB.lede`, `ti.slot.dominant`, `ti.feeder.ne`,
  `ti.lab.narration.conflictMid`, `site.header.brandSub`. Once written, a key is never
  renamed for taste. A later effort translates this map key by key; a renamed key is a lost
  translation.
- One live owner per string. Where HTML and `src/data` hold the same sentence, the map owns
  it once. Delete the dead `HERO`/`ZONE_B`/`ZONE_C`/`ZONE_D`/`ZONE_E` exports from the
  eight data files rather than importing them from the map — they render nothing. List
  every deletion in the report.
- No numbers, no colours, no CSS, no function bodies in the map. Parameters, drain curves,
  palettes and gates stay in JS. The map is text and nothing else.
- Placeholders are named. Any string assembled at runtime becomes a template with named
  tokens: `"Take {fn} to the Playground →"`, `"age {n}"`, `"{fn} ← {feeder}"`. No
  concatenation of English fragments in code. Where `playground-data.js` currently stores
  arrow functions that build sentences (`PROVENANCE.encoding.entail.tert`,
  `PROVENANCE.letters.*`), convert them to templates with a small formatter in the copy
  module; where a function genuinely branches on state, keep the branch in JS and give each
  branch its own key.
- Inline HTML only where it already exists (`ZONE_F.mirror.html` and similar), only
  `<strong> <em> <br>`, and the field name ends in `Html` so a validator can find it.

Two entry shapes. Short UI text is a plain string:

    "ti.lab.btn.iso.label": "Observe an unrelated fact"

Anything that describes a function, a position, a coupling or a mechanism is an object:

    "ti.slot.dominant": {
      "mechanism": "In the first seat, Ti tests every incoming claim against a private
                    model of how things fit together, and it runs without being switched
                    on. Contradictions surface early and cheaply; the cost is that a claim
                    is not usable until it is consistent.",
      "figure": "CURRENTS draws this as a lattice: large, fast and quiet, growing without
                 visible effort.",
      "example": "A new paper is read on Monday and nothing is said until Thursday, when a
                  conclusion arrives that reorganises everything.",
      "provenance": "myers",
      "note": "Authoring note — never rendered, never translated."
    }

- `mechanism` — what the function takes in, what it does with it, what comes out, what it
  costs, and what an observer would see. No imagery. This is the field a reader who wants
  the theory reads.
- `figure` — the CURRENTS image, explicitly marked as an image. It may be beautiful. It may
  not smuggle in a claim that `mechanism` did not make.
- `example` — optional, one concrete situation. Present tense, specific, no diagnosis.
- `provenance` — one of `jung | myers | quenk | beebe | grant | community | currents`,
  matching the vocabulary already in `src/data/typology.js` `SOURCES`, with `currents` for
  the site's own inventions (the energy arithmetic, the gates, the glyph parameters). This
  is not bureaucracy: a good part of the vagueness is claims of four different evidential
  standings written in one confident voice.
- `note` — for the humans editing the map. Never rendered, never translated.

Ship `content/SCHEMA.md` describing both shapes, and a validator (Deliverable B) that
enforces them. Keep the JSON diff-friendly: 2-space indent, keys sorted within a namespace,
trailing newline.

DELIVERABLE B — the wiring, with no visual change in English

- Mark up translatable nodes in the twelve `index.html` files with `data-copy="<key>"` and
  leave the English text inline. English must fetch nothing, flash nothing, and render
  identically to today with JS disabled.
- `src/shared/copy.js`: `t(key, vars)` returning a string, `tx(key)` returning the object
  entry, `applyCopy(root)` walking `[data-copy]`, and a formatter for `{named}` tokens.
  Data modules and UI modules read through it instead of holding literals.
- `tools/copy-sync.mjs` with `--check` and `--write`. `--check` fails if inline English in
  the HTML disagrees with `content/en/**`, if a `data-copy` key is missing from the map, if
  a map key is unused, if a template placeholder has no matching call site, or if an entry
  violates `SCHEMA.md`. `--write` regenerates the inline English from the map. Wire both as
  `npm run copy:check` and `npm run copy:write`.
- Node built-ins only. Do not add a dependency; if you believe one is unavoidable, stop and
  make the argument first.
- `src/engines/*` must not be touched at all.

DELIVERABLE C — the rewrite

Rewrite every description-shaped entry into the `mechanism` / `figure` (/ `example`) split.

- `mechanism` is written for someone who has never read Jung. Define a term the first time a
  page uses it — stack, dominant, shadow, grip, loop, feeder — in the sentence that needs
  it, not in a glossary nobody opens. Prefer 25–50 words. Prefer the concrete verb over the
  evocative noun: "runs without being switched on" over "is identity itself".
- `figure` names itself as the site's own picture. One or two sentences, and it must
  correspond to something actually on screen — if the copy says the lattice reddens, the
  canvas has to redden.
- Banned in `mechanism`: energy, current, watershed, chamber, lattice and their relatives
  used as if they explained something; sentences that cannot be wrong; second-person
  diagnosis; predictions about anyone's life; any phrasing that reads as an ability
  ceiling. DESIGN.md §5.6 is the standing rule and this is where it finally gets enforced —
  positions are cost profiles, not ceilings.
- Keep the site's voice. This is not a de-flavouring exercise: the field notes, the scenario
  vignettes and the Playground's voice lines are supposed to have literary texture and they
  keep it. What changes is that the texture stops being the only thing on offer.
- Where the current copy asserts something the model cannot support, either mark its
  provenance honestly or cut the claim. Do not invent research citations.

Render the split so a reader can see it. In the Zone B caption, the Zone C caption and the
field-note cards, `mechanism` is the body paragraph and `figure` follows as a visually
secondary line with its own class (`.figurative`), reusing muted tokens already in
`base.css`. Small, consistent across all eight pages, correct at 375px. Nothing else about
the layout changes on this branch.

──────────────────────────────────────────────────────────────────────────────
FORWARD COMPATIBILITY — a second effort will machine-translate this map

Everything in `content/en/**` must be translatable in isolation, by a model that sees one
entry and no page. That means:

- No sentence assembled from fragments held under different keys.
- No key whose correctness depends on English word order or English pluralisation.
- Placeholders named and documented in `SCHEMA.md`; a translator must be able to move `{fn}`
  anywhere in the sentence.
- Terms that must survive verbatim — `Ti`, `Fe`, the sixteen type codes, `CURRENTS`, the
  receipt symbols `u`, `×`, `τ` — appear as literal tokens, not as words a translator would
  reasonably localise. Note them in `SCHEMA.md` under a "do not translate" heading.
- `mechanism` and `figure` stay separate fields partly for this reason: they want different
  translation instructions. Do not collapse them into one paragraph in the JSON, even where
  the page renders them adjacently.

HOW I WANT YOU TO WORK

Read before writing: `DESIGN.md` §1.4, §2, §5.6, §6.3; `ti/index.html` and
`src/data/ti-data.js` end to end; `src/shared/field-notes.js` and `stack-rail.js`;
`src/data/typology.js` `SOURCES`.

Then pilot on Ti only — the smallest of the eight data files, and all five zones are
present. Build `content/en/ti.json`, the copy module, the sync tool, the render change, and
rewrite Ti's descriptions. Then stop and show me: the JSON, the diff, the before/after of
the eight position descriptions, and `/__shot` captures of the Ti page at 375px and 1440px.

Do not proceed to the other eleven pages before that checkpoint. Once it is signed off,
apply it across the site: the remaining seven functions, then energy, phenomena, typology,
scenarios, corpus, playground. Where the same string appears on all eight pages it belongs
in `site.json` once.

REPORT — `content/REPORT.md`

- Key counts per namespace, and the total.
- Every dead duplicate deleted, with the file and the export.
- Every string deliberately left out of the map, with the reason. Developer-facing strings,
  console messages and code comments are out of scope — say so explicitly rather than
  leaving me to infer it.
- Provenance tally, and the list of entries marked `currents` — the site's own inventions,
  which is the list I most want to see.
- A before/after table for the twenty entries that were worst on Problem 2.
- Anything you found broken and did not fix, with the reason.

DEFINITION OF DONE

- `npm run build` clean; `npm run copy:check` clean.
- All twelve pages render in English exactly as before, except the intended
  mechanism/figure split, verified at 375px and 1440px.
- No file under `src/engines/` modified. No numeric parameter, colour or curve changed.
- Keyboard operation and `prefers-reduced-motion` behaviour unchanged.
- Every description-shaped entry has `mechanism`, `figure` and `provenance`.
- No dead copy of any shipping string remains in `src/data`.
- `DESIGN.md` gets a dated note recording that copy now lives in `content/`, and that the
  mechanism/figure split is a content rule rather than a styling one.
````
