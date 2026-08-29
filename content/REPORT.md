# Content map — report

**Scope shipped:** the eight function pages (`ti fi te fe ne ni se si`) plus the shared
`site` namespace. **Deferred by direction (2026-08-30):** Energy, Phenomena, Playground —
and with them `typology.json`, `corpus.json`, the `scenarios/` files, and the landing
page. Their strings remain where they were and are not part of the translation surface
yet. This report covers what shipped.

## Key counts

| namespace | keys | description objects |
|---|---|---|
| site.json | 76 | 0 |
| ti.json | 63 | 27 |
| fi.json | 64 | 28 |
| te.json | 68 | 31 |
| fe.json | 100 | 30 |
| ne.json | 84 | 31 |
| ni.json | 83 | 31 |
| se.json | 86 | 30 |
| si.json | 86 | 29 |
| **total** | **710** | **237** |

Every description object carries `mechanism` (or `mechanismHtml`), `figure`, and
`provenance`; `npm run copy:check` enforces the shapes, the placeholder contract, the
inline-HTML allowlist, and the banned-vocabulary rule for `mechanism` fields. During
authoring the validator caught three violations in freshly written copy ("lattice" in
Te's mirror, "current" in a Te narration, "energy" in an Ne vignette) — the ban is a
working control, not a formality.

## Dead duplicates deleted

Text that shipped from the HTML while a copy of it sat unread in `src/data/` — editing
these strings changed nothing on screen. All are gone:

| file | deleted export / field |
|---|---|
| all eight `src/data/<fn>-data.js` | `HERO`, `ZONE_B`, `ZONE_C`, `ZONE_D`, `ZONE_E` (hero tag/title/subtitle, zone kickers, headings, ledes — `ZONE_E` described an energy zone that no longer exists on function pages) |
| all eight | `ZONE_F.kicker`, `ZONE_F.heading`, `ZONE_F.lede` (field-notes.js reads only `vignettes` and `mirror`) |
| all eight | `SLOTS[].sub` (`'1st · hero'` …) — only the ordinal half ever rendered, via a string split; the archetype half was dead. Replaced by `ord` read from `site.position.*` |
| `ti-data.js` | `VERIFY.buttons` (3 labels + subs; main.js binds by element id) |
| `fi-data.js` | `VERIFY.buttons` (4 labels + subs) |
| `te-data.js` | `VERIFY.buttons` (4 labels + subs), `VERIFY.idle` (duplicate of the HTML narration intro — and the HTML copy had drifted ahead of it) |
| `fe-data.js` | `LAB.idle`, `LAB.buttons[].label/sub` (6; behaviour fields kept) |
| `ne-data.js` | `LAB.idle`, `LAB.buttons[].label/sub` (5) |
| `ni-data.js` | `LAB.idle`, `LAB.buttons[].label/sub` (5) |
| `se-data.js` | `LAB.idle`, `LAB.buttons[].label/sub` (3) |
| `si-data.js` | `LAB.idle`, `LAB.buttons[].label/sub` (5) |

The drift these dupes had already accumulated (e.g. Te's Zone B lede exists in two
different versions, only the HTML one ever rendering) is the argument for the one-owner
rule made flesh.

## Deliberately not in the map

Developer-facing strings, console messages, and code comments are **out of scope** —
stated here explicitly rather than left to inference. Beyond those:

- **JS-owned initial instantiations in the HTML** — `capTitle` "Dominant", `capTypes`
  "1st function · INTP · ISTP", `stageNote` "rendering: Dominant preset", `ageOut`
  "age 28", the initial `feedTitle`/`feedPair`, meter percentages, cognitive-state
  chips ("Open Field", "Still Water", …), and readout seeds ("B 0.35", "R² 0.30",
  "1.0 u", "— ms", "62%"). These are instantiations of map templates that JS rewrites
  through `t()` immediately on init; keying the instantiation would create a second
  owner for the same sentence.
- **§3.1 parameter names** in the dial tooltips (`duty`, `fidelity`, `latency`,
  `noise`, `control`, `contrary`) and unit/symbol tokens (`ms`, `u`, `×`, `τ`, `S`,
  `P`, `R²`, `B`) — do-not-translate technical identifiers, composed in JS, listed in
  `SCHEMA.md`.
- **`CURRENTS`** in the header brand and the function/type codes in `SLOTS[].types` —
  verbatim tokens, not translatable copy.
- **`content/de/**` and `content/es/**`** — owned by the i18n pipeline
  (`docs/i18n.md`), never edited by hand here.

## Provenance tally

| provenance | entries |
|---|---|
| currents | 74 |
| community | 49 |
| myers | 40 |
| beebe | 32 |
| grant | 18 |
| quenk | 16 |
| jung | 8 |

**The `currents` list — the site's own inventions.** Sixty-eight of the 74 are lab
narrations: they narrate the site's own simulations (the receipts, gates, and
drain/pleasure arithmetic), which is precisely the material that must not borrow the
authority of Jung or Quenk. The remainder:

- `ti.feeder.ni` and `fi.feeder.ni` — the speculative Ni-above-a-judging-introvert
  couplings, now labelled "the site's own thought experiment" in their own text
- `ne.fieldNotes.vignette.signedContract` — "noticing possibilities is itself the
  hazard" is the site's claim, not literature
- `ni.fieldNotes.vignette.cantJustKnow` — the "instrument that cannot print its raw
  data" epistemics framing
- `fe.fieldNotes.vignette.roomThatBreaks` — "some rooms need their coherence taken
  apart" is editorial

(Full list reproducible with `node -e` over `content/en/*.json`, filtering
`provenance === 'currents'`.)

## Before → after: the twenty worst Problem-2 entries

Excerpts trimmed; the full text is in the map. "m:" is the new `mechanism`, "f:" the
new `figure`.

| key | before | after |
|---|---|---|
| `ti.slot.dominant` | "Analysis…feels like identity itself. The lattice is large, fast, and quiet — precision without strain." | m: "runs without being switched on: every claim…tested against a private model…The price is pace" · f: "CURRENTS draws this as a lattice at full size" |
| `ti.slot.tertiary` | "A private hobby-logic…self-sealed loop, polishing conclusions no one is allowed to audit." | m: "dependable inside a few practised domains…defend conclusions no outsider is allowed to test — the pattern called a loop" · f: "a half-size lattice, bright where it is used" |
| `ti.feeder.ne` | "Breadth-first logic…the lattice grows broad and provisional, whole wings built and demolished cheaply." | m: "delivers many parallel possibilities rather than settled facts…frameworks drafted, tested, discarded cheaply" · f: "the lattice grows wide and airy, whole wings raised and demolished" |
| `ti.feeder.fe` | "Two sorters, no gatherer…the chamber idles hungry." | m: "a judging function…hands over verdicts about the room rather than raw perceptions. Ti receives almost nothing it can test" · f: "the emitter glows, but almost nothing crosses" |
| `ti.lab.narration.conflictMid` | "The lattice red-shifts and tears itself apart — everything connected to the broken rule must be rebuilt." | m: "every conclusion that leaned on the broken rule is suspect and must be rebuilt around it" · f: "the lattice red-shifts and tears itself apart" |
| `ti.zoneB.lede` | "Click any position to see how the lattice changes" (lattice never introduced) | "The canvas draws Ti as a lattice: a network of claims…Where Ti sits in a person's stack — the fixed order their eight functions come in —…" |
| `ti.character.endurance.why` | "analysis is the idle state…the lattice refines all day" | "analysis is the idle state, not an exertion — it runs all day without strain" |
| `fi.slot.dominant` | "Conviction is effortless and constant — not argued, simply known. The core burns steady." | m: "evaluates everything against a felt inner standard…The price is portability: precise but hard to show" · f: "a nebula at full glow — a steady core" |
| `fi.character.endurance.why` | "the core burns without fuel" | "conviction is effortless and constant — holding the standard costs nothing" |
| `fi.feeder.si` | "old wounds…replayed against the core tone…the visual signature of a cognitive loop" | m: "replays stored experience instead of gathering new…This is the loop, seen from inside" · f: "the mist circles the core in closed rings" |
| `fi.lab.narration.fakeBad` | "A falsehood strikes what matters. It tears straight through the nebula — mist churns away from its path" | m: "the one event Fi cannot file quietly: a violation of the standard demands a response from the whole system" · f: "it tears straight through the nebula" |
| `te.slot.dominant` | "The scaffold is large, brisk, and metronomic: the flag keeps moving because the work keeps shipping." | m: "organises the world without being asked to…Decisions close fast because the test is external…The price is what the numbers miss" · f: "a scaffold at full span…the flag moving as the work ships" |
| `te.fieldNotes.mirror` | "Ti…builds a private lattice nobody else can inspect" (lattice as explanation) | m: "builds a private structure nobody else can inspect" · f: "one structure behind the eyes, one on the skyline" |
| `fe.hero`/`fe.fieldNotes.mirror` | "Fi's perimeter is computed from its centre…sealed behind a closed boundary…the lattice is drawn between them rather than inside the chamber" | m: "Fi measures at the centre…Fe measures at the perimeter: the standard is computed from whoever is present" · f: the glyph geometry, one section up |
| `fe.feeder.te` | "the carrier phases stop updating and Fe conducts on last-known state" (glyph-speak as mechanism) | m: "the model of each person stops updating and the tending runs on last-known state" · f: "the carriers freeze mid-phase" |
| `ne.feeder.te` | "watch growth hug the rim, launched half-grown into the world…the center hollows, and the graveyard fills" | m: "every branch converts to a project the moment it sprouts…nothing asks whether any of it matters" · f: "growth hugs the rim while the centre hollows" |
| `ni.feeder.ti` | "the boundary seals one turn further — because the only thing correcting the picture is the same head that produced it" (fused) | m: "the image is checked for internal consistency and never against anything in the room" · f: "the boundary seals one turn further" |
| `se.lab.narration.blackout` | "watch what the eye does with nothing: dilates, hunts, and starts paying for silence…the small glint leaving it, labelled for Si" | m: "stress climbing on an empty room the way other functions pay for chaos. Se keeps nothing, so there is nothing to fall back on" · f: "the small glint…is the stratum its sibling would have kept" |
| `si.feeder.fi` | "the same few strata brighten from within while the rest of the record dims" (fused) | m: "entries are re-read for how they felt, and the wounded ones get fed nightly" · f: "the same few strata brighten from within" |
| `si.slot.inferior` | "The record as a rumor…the archive floods open as hypochondria and haunting" | m: "details, dates, and where-things-are arrive late and partial. Under real depletion…every bodily signal matched against every remembered illness — Quenk's grip" · f: "a shallow pool that floods without warning" |

## Found broken, not fixed

- **The site-wide footer** has class `epistemic` but carries a version line
  ("CURRENTS v1.0 · An interactive atlas…"), not the §6.3 epistemic disclaimer.
  DESIGN §6.3 was never implemented. The string is now keyed (`site.footer.line`)
  so fixing it is a one-line content edit — but which sentence the footer should
  carry is an owner's decision, not a mapping one.
- **Fe's hero subtitle** is visually crossed by the hero canvas's lattice lines at
  some viewports. Pre-existing rendering overlap, untouched (engines are out of
  scope on this branch).
- **Fixed in passing, for the record:** `ne` "You Never Finish Anything" rendered
  literal asterisks around `*divergence*` (markdown syntax in an innerHTML string);
  the asterisks are gone. Te's Zone B lede existed in two divergent versions (HTML
  vs the dead `ZONE_B` export); the deletion of the dead export resolves it in
  favour of the version that actually rendered.

## Still ahead (out of this pass)

`energy.json`, `phenomena.json`, `playground.json`, `typology.json`, `corpus.json`,
`scenarios/*.json`, and the landing page — plus data-copy wiring for those pages.
`energy-charts.js` and the Playground UI modules still hold their template literals
until then.
