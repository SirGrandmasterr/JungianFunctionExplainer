# Localisation via local Ollama — Fable Prompt

The second of the pair. It assumes `content-map-prompt.md` has run and left a reviewable
JSON copy map behind, and turns that map into a translation pipeline: a local Ollama server
running a Gemma model, a resumable Node script, a glossary the model is not allowed to
overrule, and a language switch that makes the result real on the site.

Runs on its own branch, `feature/i18n-ollama`, cut from `feature/content-map` (or from
`main` if the map has landed there by then).

---

````
You are working in CURRENTS: a static multi-page site (Vite 6, vanilla ES modules, no
framework, no runtime dependencies) that teaches the eight Jungian cognitive functions.
Twelve pages: eight function pages `fi/ ti/ te/ fe/ ne/ ni/ se/ si/`, plus `energy/`,
`phenomena/`, `playground/` and the landing page. Dev server `npm run dev` (launch config
`currents`, port 5183); the Vite dev plugin in `vite.config.js` writes a PNG into `.shots/`
from a data URL POSTed to `/__shot`, which is how visual output gets eyeballed here.

WHAT ALREADY EXISTS (from the content-map branch — read it first, do not re-derive it)
- `content/en/**` — every user-facing string in the site, as JSON namespaces, under stable
  dotted keys. Short UI text is a plain string. Anything descriptive is an object with
  `mechanism` (what the function does, plainly), `figure` (the CURRENTS image, marked as an
  image), optional `example`, `provenance`, and `note` (authoring note, not rendered).
- `content/SCHEMA.md` — both entry shapes, the `{named}` placeholder rules, and the
  do-not-translate token list.
- `src/shared/copy.js` — `t(key, vars)`, `tx(key)`, `applyCopy(root)`, placeholder
  formatting. HTML nodes carry `data-copy="<key>"` with the English inline.
- `tools/copy-sync.mjs`, wired as `npm run copy:check` / `copy:write`.

BRANCH
Work on `feature/i18n-ollama`, cut from `feature/content-map`. Commit in coherent steps. Do
not merge, do not rebase, do not touch other branches.

──────────────────────────────────────────────────────────────────────────────
THE JOB

The site is English-only. The map makes other languages possible for the first time; this
branch makes them cheap. Build a pipeline that turns `content/en/**` into
`content/<locale>/**` using a Gemma model on a local Ollama server, and a runtime language
switch that serves those files. Ship German and Spanish. Adding the next locale must cost
one command and one glossary file, not another engineering effort.

Local, not cloud, on purpose: the corpus is a few hundred KB of prose that will be
re-translated every time the English changes, the whole thing has to be reproducible by
anyone with the repo, and nothing about this project justifies sending its content to a
paid API. State that reasoning in the docs so the next person does not "improve" it.

THE ENVIRONMENT YOU ARE TARGETING
- Ollama 0.32.x is installed on this machine and serves at `http://127.0.0.1:11434`.
- Installed models: `gemma4:12b` (7.6 GB), `gemma4:latest` and `gemma4:e4b` (9.6 GB).
  Default to `gemma4:12b`; `--model` and `OLLAMA_MODEL` override.
- Verify with `GET /api/tags` at startup. If the server is unreachable, or the requested
  model is not installed, exit non-zero with a message that says exactly what to run. Never
  auto-pull a model, never install anything, never fall back to a cloud endpoint.
- One 12B model on one machine. This pipeline is throughput-bound and must behave like it:
  resumable, incremental, and polite about concurrency.

──────────────────────────────────────────────────────────────────────────────
PART 1 — `tools/translate.mjs`

- Node 20 built-ins only (`fetch` included). No new dependency. If you believe one is
  unavoidable, stop and make the argument before writing it.
- `POST /api/chat` with `stream: false`, a JSON schema in `format`, and
  `options: { temperature: 0.2, seed: 7, num_ctx: 4096 }` plus a `keep_alive` long enough
  that the model is not reloaded between calls. Deterministic settings matter more than
  fluency here: a re-run that produces different German for unchanged English makes every
  diff unreadable.
- The unit of work is one field of one entry, not a file and not a page. Send the model the
  source text, the key, and the field kind — nothing else that it could damage. Ask for
  `{"translation": "…"}` and validate against that schema. Larger batches are allowed only
  if you demonstrate they do not degrade quality; show the comparison if you go that way.
- One system prompt per field kind, because the content-map branch already separated them
  and they want different instructions:
    * `mechanism` — precise and terminology-locked. Translate the claim, do not improve it,
      do not add emphasis the source does not have, hold length within roughly ±20%.
    * `figure` — idiomatic. The image has to survive into the target language even if the
      sentence has to be rebuilt to do it. A literal rendering that lands as nonsense is a
      failure.
    * `example` and the scenario vignettes — narrative register, present tense, names and
      concrete details preserved.
    * labels, buttons, kickers, meter captions — short, in the target language's UI
      register, with a hard character budget derived from the English (see the layout note
      in Part 4). This is where machine translation usually blows up a layout.
    * `note` is never sent to the model and never appears in a locale file.
- Glossary: `content/glossary/<locale>.json`, human-editable and authoritative.
    * `locked` — must appear verbatim in the output: `Ti`, `Fe` and the other six, the
      sixteen type codes, `CURRENTS`, the receipt symbols `u`, `×`, `τ`, and whatever else
      `SCHEMA.md` lists as do-not-translate.
    * `preferred` — the terms of art, fixed once so the site does not call the dominant
      function three different things: dominant, auxiliary, tertiary, inferior, shadow,
      grip, loop, feeder, stack, chamber, position, cost.
    * Inject both into the system prompt, and check compliance after the response. The model
      does not get to overrule the glossary; a violation is a retry, and a second violation
      is a flag for human review.
- Validate every response, up to two retries with a stricter re-ask, then flag and move on:
  parseable JSON with exactly the expected key; `{named}` placeholders present as an exact
  set, none invented; allowed HTML tags identical in kind and count; locked terms verbatim;
  no wrapping quotes, no commentary, no "Here is the translation"; length ratio inside
  sane bounds for the field kind; output not byte-identical to the English for anything
  longer than a few words.
- Incremental and idempotent. `content/<locale>/.state.json` maps entry id →
  `{ srcHash, model, promptVersion, status, at }`. A re-run touches only entries whose
  source hash, model or prompt version changed. Entries marked `reviewed` by a human are
  never overwritten without `--force`.
- Flags: `--locale`, `--model`, `--only <namespace>`, `--limit`, `--concurrency` (default 2),
  `--force`, `--dry-run`, `--review`. Progress with counts and an ETA on stderr. Write after
  each namespace so Ctrl-C loses at most one namespace, and so a full run can be left
  overnight and resumed.
- Every locale file carries a `_meta` block: model, model digest from `/api/tags`, prompt
  version, date, and per-entry `status` of `mt` or `reviewed`.

PART 2 — the review pass (`--review`)

A 12B local model is not a translator of record, and the output must not pretend otherwise.

- Second call per entry: back-translate the target text to English with a fresh context, and
  a third call that compares source against back-translation and returns
  `{ "ok": boolean, "issue": string }`.
- Anything failing validation or review lands in `content/<locale>/_review.md`: key, source,
  translation, back-translation, and the reason. Human-readable, ordered worst first. This
  file is the deliverable a human actually reads before promoting a locale.
- Promotion is a human editing `status` to `reviewed` in the locale file. The pipeline
  respects it forever after.

PART 3 — the runtime

- Extend `src/shared/copy.js` with locale support. Resolution order: `?lang=` →
  `localStorage` → `navigator.language` → `en`. English fetches nothing and behaves exactly
  as it does today; this must stay true.
- Serve the locale JSON so it survives both `vite build` and the nginx/Docker setup in this
  repo (`nginx.conf`, `Dockerfile`, `docker-compose.yml`). Decide between `public/` and a
  glob import, and say why in the docs.
- On locale change: set `document.documentElement.lang`, apply to every `[data-copy]` node,
  and re-render the zones that build their DOM at init — the field notes, the stack rail,
  the Playground panels. Either load copy before init or expose a `refresh()`; pick one and
  apply it consistently rather than half of each.
- Per-key fallback to English when a key is missing or blocked. A missing translation shows
  English, never a blank and never a raw key.
- A language switcher in the header, in the existing nav's style, keyboard operable, with
  the current language exposed to assistive tech. It persists.
- On every non-English page, a visible but unobtrusive line: the translation is machine-made
  from the English, may contain errors, and the English is canonical. This is required.
  DESIGN.md §1.4.5 and §6.3 already refuse to overclaim about the psychology; the site does
  not get to quietly overclaim about its own German.

PART 4 — layout, proof, docs

- German is the layout stress test: it runs roughly a third longer than English. Check the
  Zone B slot captions, the feeder chips, the Zone D spawn buttons, the meter labels, the
  Playground receipt rows and the header nav at 375px and 1440px. Fix what breaks in
  `base.css` — never by trimming a translation until it fits.
- `npm run i18n:translate -- --locale de`, `npm run i18n:review -- --locale de`, and
  `npm run i18n:check`. The check verifies key parity against `content/en/**`, placeholder
  parity, glossary compliance, and `_meta` presence across every locale, and it runs clean
  alongside `npm run copy:check`.
- `docs/i18n.md`: adding a locale in three steps; what the glossary is and who owns it; how
  to promote `mt` to `reviewed`; what to do when Ollama is not running; why this is local
  rather than a cloud API; what the pipeline costs in wall-clock on this machine.
- `/__shot` captures of the German Ti page and the German Playground at 375px and 1440px.

HOW I WANT YOU TO WORK

Read `content/SCHEMA.md`, `content/REPORT.md` and `src/shared/copy.js` before writing
anything. Confirm the Ollama server answers and the model is present before you design
around it.

Then pilot: German, `content/en/ti.json` only. Stop and show me the validator output, the
timing, and ten before/after entries chosen to include the two hardest cases — a `mechanism`
with locked terminology and a `figure` whose image does not translate literally. Do not run
the full sweep before that checkpoint. When it is signed off: the rest of German, then
Spanish, then the runtime switch, then the layout pass.

If the model turns out to be bad at a category — the `figure` fields are the likely
casualty — say so plainly and propose the honest options (leave that field English until a
human writes it, use the bigger local model for that field only, mark the whole category
`review-required`). Do not quietly ship prose you would not defend, and do not tune the
prompt until the failures merely look plausible.

DEFINITION OF DONE

- `npm run build` clean; `npm run copy:check` and `npm run i18n:check` clean.
- `content/de/**` and `content/es/**` complete: key parity with `en`, `_meta` on every file,
  a `_review.md` per locale.
- Re-running `translate.mjs` with no English change makes no file change and no model call.
- Changing one English string and re-running re-translates exactly that entry.
- English is byte-identical in behaviour to `main`: no fetch, no flash, no regression.
- German verified at 375px and 1440px on a function page and the Playground, with captures.
- The machine-translation notice is present on every non-English page.
- Ollama unreachable produces a clear failure, not a partial write or a silent fallback.
- `DESIGN.md` gets a dated note: the site is multilingual, English is canonical, non-English
  is machine-drafted until a human marks it reviewed.
````
