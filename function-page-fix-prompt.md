# Function Pages — Fix Prompt

One self-contained prompt covering three defects present on all eight function pages
(`fi ti te fe ne ni se si`). Written to be handed to a model in a fresh session with the
repo checked out. Unlike `playground-fix-prompts.md`, this is a single prompt rather than a
sequence: the three defects touch the same three shared modules and the same eight
`index.html` files, so splitting them costs more in merge friction than it saves in scope.

---

````
You are working in CURRENTS: a static multi-page site (Vite 6, vanilla ES modules, no
framework, no templating step) that teaches the eight Jungian cognitive functions.

Layout of the ground:
- Eight function pages at `fi/ ti/ te/ fe/ ne/ ni/ se/ si/`, each an `index.html` plus a
  `main.js` orchestrator. Every page is built from the same zones: A hero glyph, B stack
  rail, C feeder coupling, D the lab, E energy teaser, F field notes.
- Shared behaviour: `src/shared/` (`stack-rail.js`, `feeder-coupling.js`,
  `energy-teaser.js`, `header.js`, `tooltip.js`).
- Per-page content and numbers: `src/data/<fn>-data.js`.
- All layout: `src/styles/base.css`, with a small per-function theme file overriding
  `--c-accent` and the `--pos-*` ramp.
- Rendering engines: `src/engines/*-glyph.js`, driven through a parameter vector. They size
  themselves with a ResizeObserver.
- `DESIGN.md` is the design document. Its own rule: where implementation and document
  disagree, the implementation is the authority and the document gets a dated note.
- Dev server: `npm run dev` (launch config `currents`, port 5183). The Vite dev plugin in
  `vite.config.js` accepts a POSTed data URL at `/__shot` and writes a PNG into `.shots/`,
  which is how canvas output gets eyeballed in this repo.

There are three defects, all of them on all eight pages. Your job is to find creative,
elegant, effective solutions and then build them — eight times over, not once.

HOW I WANT YOU TO WORK
Before writing code: open all eight pages in the browser at real device widths, not just a
narrowed desktop window, and read the files named below. Then write a short proposal — for
each of the three problems, the two or three approaches you considered and the one you
would build, with the reason. Where my own suggestion appears below, treat it as a starting
hypothesis and not a specification; if you find something better, say so and build that
instead. Then implement.

STANDING CONSTRAINTS
- Fix once, apply eight times. Anything identical across the eight belongs in `src/shared/`
  and `base.css`; anything function-specific belongs in `src/data/<fn>-data.js`. Do not
  paste eight copies of anything.
- The eight labs are NOT uniform (table below). A change that works on Fi and breaks Se is
  not done.
- No framework, no new runtime dependency. ESM, `getElementById`, plain CSS.
- Match the surrounding code: comments in this repo explain *why*, never *what*.
- `prefers-reduced-motion` is honoured site-wide (`REDUCED` in `src/utils/dom.js`).
  Anything you animate needs a static equivalent.
- Keyboard operable, and every visualization needs a text equivalent (DESIGN.md §3.5, §5.5).
- Copy stays in the register of the existing copy and inside the §5.6 tone guardrails:
  never diagnose, never predict life outcomes, positions are cost profiles and not ability
  ceilings.

──────────────────────────────────────────────────────────────────────────────
PROBLEM 1 — Zone D is unusable on a phone

What is there now. `.verify-layout` (`src/styles/base.css:160`) is a two-column grid,
`310px | minmax(320px, 1fr)`: controls left, chamber right. At `max-width: 960px`
(`base.css:326,331`) it collapses to a single column, so the control panel stacks *above* a
chamber that is a hard 460px tall (`base.css:184`). On a 375x812 viewport the result is
that you press a scenario button and the thing the button does — the chamber, the stress
and pleasure meters, the readouts, the narration — is off-screen below you. This zone's
entire pedagogy is act, then watch the consequence, and on mobile the consequence is never
in the same frame as the act.

The eight labs differ, and your solution has to hold for all of them:

| page | lab                | beyond the scenario buttons                                                     |
|------|--------------------|---------------------------------------------------------------------------------|
| fi   | Verification Lab   | 4 buttons; stress + resonance pleasure                                            |
| ti   | Verification Lab   | 3 buttons                                                                         |
| te   | Verification Lab   | 4 buttons                                                                         |
| ne   | Divergence Engine  | 5 buttons; state chip; threads/breadth readouts; sweep the canvas to branch        |
| ni   | Regression Engine  | 5 buttons; state chip; loss and R² readouts; hover the chamber to steer time       |
| se   | Contact Lab        | intensity slider + 3 buttons; lock-ms/clarity readouts; Si cross-listen            |
| si   | Recognition Lab    | 3 buttons + an accept/dismiss ruling pair; match/cost readouts; Se cross-listen    |
| fe   | Resonance Lab      | 6 buttons, one gated and disabled until a split field exists; believed-vs-actual trust gap; Fi cross-listen; hover a carrier |

Hard requirements:
- On 375x812, triggering a scenario leaves the chamber AND both meters visible in the same
  frame. No scrolling between a control and its consequence.
- The page never scrolls horizontally. If a strip scrolls, it scrolls itself, and it looks
  scrollable before it is touched.
- Touch targets of at least 44px. Scenario cards keep both their title and their subtitle —
  the subtitle is what makes the scenario legible at all.
- Every hover-only affordance gets a touch equivalent, or an honest note that it is
  pointer-only. Right now Ni's "hover the chamber to steer", Ne's "sweep the chamber", and
  Fe's carrier hover are silently dead on touch while the lede still instructs the user to
  do them. That is part of this defect, not a separate one.
- The 460px fixed canvas height becomes viewport-aware.
- Se's slider, Si's accept/dismiss ruling, and Fe's gate stay reachable and legible in
  whatever layout you land on.
- The desktop layout does not regress. It works.

My suggestion, to test rather than to obey: a landscape-locked lab band — chamber on the
right next to the scenarios, the scenario list scrollable, stress and pleasure pinned.
Alternatives worth weighing: a chamber that sticks to the top of the section while the
scenario list scrolls under it; a bottom-sheet control layer over a full-bleed chamber;
meters as a persistent slim bar. The test of any of them is whether a first-time user on a
phone can press a scenario and *see the answer*.

──────────────────────────────────────────────────────────────────────────────
PROBLEM 2 — The Fidelity Profile makes claims it cannot defend

What is there now. Zone B renders a five-axis radar labelled "Fidelity Profile", drawn by
`initStackRail` from `DIAL_AXES = ['Endurance','Precision','Speed','Control','Awareness']`
(`src/shared/stack-rail.js:56`) against a hand-authored `dial: [...]` array on every slot of
every function — 8 functions x 8 positions x 5 axes = 320 authored numbers living in
`src/data/*-data.js`. Nothing in the UI defines any of the five axes. Nothing explains any
value. DESIGN.md §3.2 describes the dial as deliberately *redundant* encoding of what the
glyph shows kinetically, and names the axes *Endurance, Precision, Speed, Voluntary
Control, Self-Awareness* — the shipped labels are truncations of those.

Why it reads as arbitrary, precisely:
- The dial numbers are authored independently of the `params` vector on the same slot
  (`fidelity`, `latency`, `noise`, `duty`, `control`) that the glyph is actually driven by.
  Two independent sources for one claim drift, and these have. Fi's Demon carries Precision
  .30 against Endurance .15 — the dial says the least-developed position in the stack is
  more precise than it is enduring, and nothing on the page argues why.
- The maturity slider applies a flat additive boost to all five axes at once
  (`effectiveDial`, `stack-rail.js:42`) while `effectiveParams` (`:36`) weights its three
  targets differently. One slider, two disagreeing models of what ageing does.
- The comparison that would actually teach something — Ni dominant Speed .35 against Ne
  dominant Speed .95 — is exactly the one left unexplained, so it reads as taste.

Resolve this one of two ways, and argue for the one you pick:
(a) Remove the dial. Then say what carries the information it was carrying, and why nothing
    is lost.
(b) Keep it and make every point self-explaining: each axis defined, each plotted value
    justified for *this* function in *this* position, reachable by hover, by keyboard focus,
    and by touch.

If you keep it, the strong version of (b) is derivation rather than 320 more strings:
compute the five axes from the §3.1 parameter vector already on each slot — plus, where a
function genuinely differs in character, one small per-function offset that is *declared*
rather than smuggled — so that each explanation can name its own inputs ("Speed .30 —
inferior latency, 700 ms") and the dial becomes structurally incapable of contradicting the
glyph beside it. If you do that, every place a derived value diverges sharply from the
authored one is a finding about the old numbers. Report those; do not silently bury them.

Implementation traps, all real:
- `renderDial()` rewrites `dialSvg.innerHTML` on every animation frame (`stack-rail.js:88`,
  inside the rAF loop at `:91`). Any node or handler you attach to a child is destroyed
  sixty times a second. Draw the static chrome once and animate only what moves, or
  delegate and hit-test.
- The plotted points are `r=2.6` circles. Untouchable. Hit areas need to be around 44px,
  invisible, and must not obscure the shape.
- `src/shared/tooltip.js` is one fixed-position, `pointer-events:none` div positioned from a
  mouse x/y. It has no touch story, no focus story, and no dismissal story. Extend it into a
  real primitive or replace it — but when you are done there should be exactly one tooltip
  mechanism in this codebase, used by everything that needs one.
- Reduced motion must still work, and there must be a non-hover reading path for the whole
  profile (§3.5's text alternative).

Acceptance: on all eight pages, every axis label and every plotted point yields its
definition and its reason by mouse, by keyboard, and by tap; the plotted values cannot
contradict the glyph parameters; there is no number in that dial a reader cannot
interrogate. Or: the dial is gone and the section reads better for it.

──────────────────────────────────────────────────────────────────────────────
PROBLEM 3 — Zone E comes off; Field Notes grows

What is there now. Zone E on a function page is `initEnergyTeaser`
(`src/shared/energy-teaser.js`) rendering a cost-ladder bar strip, one paragraph, and two
links into `<div id="energyTeaser">`, identically on all eight pages. The full economics
suite already lives at `/energy/` — in the header nav, one click away, where the comparison
between functions is actually possible. DESIGN.md §2.6 argues the teaser should stay so that
"the battery is never off-screen" (§1.4). That argument has been heard and overruled: the
zone is a speed bump between the lab and the field notes, and the tab already exists.

Make the removal clean rather than blunt:
- Delete the section from all eight `index.html`, the `initEnergyTeaser` call and import
  from all eight `main.js`, the now-dead `src/shared/energy-teaser.js`, and the
  `.energy-teaser` rules in `base.css`. Confirm nothing else imports it — `/energy/` does
  not; the eight function pages are its only callers.
- Two facts on that teaser are not available at `/energy/` *in the context of the function
  being read about*: the grip clock (minutes of sustained inferior-position use to
  depletion) and which function the collapse hands over to. Do not drop them on the floor.
  Find them a home that costs no vertical space — the Zone B slot caption when the Inferior
  slot is selected is one candidate; a line inside the new Field Notes is another. Argue
  your choice.
- Keep one route to `/energy/` from the page body. The header link alone is thin for a page
  that has just stopped mentioning the battery entirely.
- Add a dated entry to DESIGN.md §2.6 recording that the teaser is retired and what took
  over its two facts.

Then enlarge Field Notes. Today it is three `.vignette` cards plus one `.mirror` sibling
comparison, hardcoded in each of the eight `index.html` files. Take it to six to eight notes
per page, and:
- Move the copy out of the HTML into `src/data/<fn>-data.js` and render it from a new shared
  `src/shared/field-notes.js`. Eight hardcoded copies of the same markup is what made this
  zone hard to extend in the first place.
- The new notes must be distinct *in kind*, not three more paragraphs in the same shape. The
  existing three are a behavioural snapshot, a loop, and an inferior eruption. Reach for
  kinds the page has not used — what the function looks like as somebody's tertiary; the
  accusation it characteristically attracts and what is actually happening; the function it
  gets misread as and the tell that separates them; what it costs the people around it; what
  it looks like done well at 25 against at 55; the situation where it is simply the wrong
  instrument.
- Every note is function-specific. A note that could be pasted onto another function's page
  with the letters swapped is a failed note, and I will check for exactly that.
- The §5.6 tone guardrails bind hardest here, this being the most prose-heavy zone on the
  page.
- DESIGN.md §2.8 promised a closing CTA ("Take Ti to the Sandbox →") that was never built;
  the `.cta` styling already sits unused in `base.css`, and the Playground now exists at
  `/playground/`. Consider finishing that promise as part of this zone.
- The HTML labels this zone "Zone F · field notes" while DESIGN.md calls Field Notes Zone G
  (its Zone F is an Overclock Lab that was never built). With Zone E gone the lettering is
  wrong either way. Reconcile it in the code and in the document, and do not ship a page
  that runs D → F.

──────────────────────────────────────────────────────────────────────────────
DELIVERABLE
A working tree where all eight pages carry all three fixes; the short proposal described
above; dated DESIGN.md entries for §2.6, §2.8 and §3.2; and an explicit list of anything you
found and deliberately did not fix.

VERIFY BEFORE CALLING IT DONE
- `npm run dev`, then all eight pages at desktop width and at 375x812.
- Zone D on a phone viewport: trigger a scenario on each of the eight and confirm the
  chamber and both meters are in the same frame — then specifically exercise Se's intensity
  slider, Si's accept/dismiss ruling, and Fe's gated Reconciliation.
- Fidelity Profile: hover it, tab to it, and tap it, on at least three pages, including one
  with a shadow position selected.
- `grep -rn "energyTeaser\|energy-teaser"` returns nothing outside `dist/` and git history.
- Console clean on all eight; `npm run build` passes.
- The canvases still resize. The glyph engines size themselves through a ResizeObserver, so
  a layout change that never fires one leaves a stretched or blank chamber — check by
  rotating the viewport, not only by loading at a width.
````
