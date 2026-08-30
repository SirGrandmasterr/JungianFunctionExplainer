# CURRENTS content map — schema

Everything user-facing the site renders as text lives under `content/en/`, one JSON
file per namespace, one flat dictionary per file. `tools/copy-sync.mjs --check`
enforces this document; `--write` regenerates the inline English in the HTML from
the map. The map is text and nothing else — no numbers-as-parameters, no colours,
no CSS, no code.

## Files and namespaces

| file | namespace prefix |
|---|---|
| `content/en/site.json` | `site.` — header, nav, footer, landing page, strings shared by all function pages |
| `content/en/ti.json` … `fe.json` | `ti.` … `fe.` — one per function page |
| `content/en/energy.json` | `energy.` |
| `content/en/phenomena.json` | `phenomena.` |
| `content/en/playground.json` | `playground.` |
| `content/en/typology.json` | `typology.` |
| `content/en/corpus.json` | `corpus.` |
| `content/en/scenarios/<id>.json` | `scenario.<id>.` |

Every key in a file must start with that file's namespace prefix. Keys are flat,
dotted, lowercase-camel, and derived from **where the string is read**, never from
what it says: `ti.zoneB.lede`, `ti.slot.dominant`, `site.header.brandSub`.
**A key, once shipped, is never renamed for taste** — a later effort translates
this map key by key, and a renamed key is a lost translation.

Formatting: 2-space indent, keys sorted lexicographically within a file, trailing
newline. `--write` normalizes this.

## Entry shapes

### 1. Plain string

Short UI text — labels, kickers, ledes, aria text, placeholders, chart notes:

```json
"ti.lab.btn.iso.label": "Observe an unrelated fact"
```

### 2. Description object

Anything that describes a function, a position, a coupling, or a mechanism:

```json
"ti.slot.dominant": {
  "mechanism": "…",
  "figure": "…",
  "example": "…",
  "provenance": "myers",
  "note": "…"
}
```

Fields:

- `mechanism` (**required**, or `mechanismHtml`) — what the function takes in,
  what it does with it, what it costs, and what an observer would see. Written for
  someone who has never read Jung; a term is defined in the sentence that first
  needs it. **No imagery**: the words *energy, current(s), watershed, chamber,
  lattice* (and plurals) are banned here and the validator enforces the ban.
  No second-person diagnosis, no life predictions, no ability ceilings — positions
  are cost profiles (DESIGN.md §5.6).
- `figure` (**required**) — the CURRENTS image, explicitly marked as an image
  ("CURRENTS draws this as…", "the lattice…"). It must correspond to something
  actually rendered on screen, and it may not smuggle in a claim `mechanism` did
  not make.
- `example` (optional) — one concrete situation. Present tense, specific, no
  diagnosis. Not currently rendered; authored for future surfaces and kept
  translatable.
- `provenance` (**required**) — one of `jung | myers | quenk | beebe | grant |
  community | currents`, matching `src/data/typology.js` `SOURCES`. `currents`
  marks the site's own inventions (the energy arithmetic, the gates, speculative
  couplings, the simulation narrations). Where an entry mixes sources, tag the
  weakest-standing claim it makes and say so in `note`.
- `note` (optional) — for the humans editing the map. Never rendered, never
  translated.
- `title`, `kind`, `pair`, `warn` (optional, plain strings) — display companions
  rendered next to the entry (a vignette's card title and kicker, a feeder's
  pairing line and caution banner). Kept inside the object so a translator sees
  the entry whole.

How the split renders: in the Zone B caption, the Zone C caption, and the
field-note cards, `mechanism` is the body paragraph and `figure` follows as a
visually secondary `.figurative` line. They are separate fields **and stay
separate** — they want different translation instructions — even where a page
renders them adjacently.

"Description-shaped" means: rendered as body copy that describes a function,
position, coupling, or mechanism. Derivation annotations (dial `why` notes),
chart annotations (recovery notes), instructions, and interaction guidance are
plain strings.

## Placeholders

Any string assembled at runtime is a template with named tokens:

```json
"site.feeder.chip": "{fn} ← {feeder}",
"site.rail.ageOut": "age {n}"
```

- Token names are `{lowerCamel}`. A translator may move a token anywhere in the
  sentence; code never concatenates English fragments.
- Every placeholder must have a matching call site (`t(key, {fn})` in JS, or a
  `data-copy-token="fn"` child element in HTML) — the validator checks this.
- Numbers are formatted in JS and passed in as tokens; the map never holds bare
  parameter values.
- Where behaviour genuinely branches, each branch has its own complete key
  (`site.rail.stageNote` / `site.rail.stageNoteShadow`) — never a suffix glued on.

## Inline HTML

Only in fields/keys whose name ends in `Html`, only where markup already existed,
and only the tags `<strong>`, `<em>`, `<br>`. No attributes. Everything else is
plain text and must contain no `<`.

In HTML files, a `data-copy` element containing a `data-copy-token="name"` child
maps that child onto the `{name}` placeholder of a plain-string template — this is
how the hero `<h1>` keeps its styled function token without HTML entering the map.

## HTML wiring

- Static, HTML-owned text carries `data-copy="<key>"` on the innermost
  text-bearing element. Attributes use
  `data-copy-attrs="aria-label:<key>[,title:<key>]"`.
- JS-owned nodes (captions, narrations, stage notes) carry **no** `data-copy`;
  their strings flow through `src/shared/copy.js` `t()`/`tx()`. Their static
  initial content is either a keyed placeholder sentence ("Loading description…")
  or an unkeyed instantiation of a template (e.g. "rendering: Dominant preset"),
  which the sync tool deliberately ignores.
- English fetches nothing: the inline English in the HTML is the render source,
  the map is the authority, and `copy:check` keeps them identical.

## Do not translate

These appear as literal tokens and must survive verbatim in every locale:

- The eight function codes: `Ti`, `Te`, `Fi`, `Fe`, `Ni`, `Ne`, `Si`, `Se`
- The sixteen type codes: `INTP`, `ISTP`, `ENTP`, `ESTP`, `INFJ`, `ISFJ`, `ENFJ`,
  `ESFJ`, `INTJ`, `ISTJ`, `ENTJ`, `ESTJ`, `INFP`, `ISFP`, `ENFP`, `ESFP`
- The site name `CURRENTS`
- The receipt symbols `u`, `×`, `τ`
- §3.1 parameter names shown in the dial tooltips (`duty`, `fidelity`, `latency`,
  `noise`, `control`, `contrary`) — technical identifiers, composed in JS
- Source names used as provenance values (`Jung`, `Myers`, `Quenk`, `Beebe`,
  `Grant`)

Function and type codes reach sentences through `{fn}`-style placeholders or sit
in the text verbatim; either way they are copied, not localised.
