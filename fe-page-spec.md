# Fe — Extraverted Feeling · Visual & Interaction Specification

**Glyph:** *The Resonance Field* (structure: the **Concord Ring**)
**Status:** design-complete, ready for implementation
**Extends:** `DESIGN.md` §1.3 (visual grammar), §2.2 (glyph roster), §2.5 (Zone D), §3.1 (parametric model), §3.3 (energy), §3.5 (accessibility)
**Supersedes:** the one-line Fe entry in `DESIGN.md` §2.2 and the phrase *"Fe against group resonance"* in §2.5

---

# 1. Re-evaluation: what was wrong with the old Fe

The v1.1 brief described Fe as *"many independent waveforms drifting toward synchrony; the glyph reads the field and gently conducts it into harmony."* The instinct is right and the physics is right. Two things are wrong with it as built architecture:

1. **It puts the field inside the chamber.** Every other glyph in the atlas is a container that transforms what enters it — Ti's lattice, Te's scaffold, Si's strata, Fi's nebula. If Fe is drawn the same way, Fe becomes "a chamber where synchronization happens," which is Fi with extra steps. Fe's actual claim is stronger and stranger: **the object Fe judges is not inside Fe.** The evaluation lives in the space between people, and Fe is the part of the psyche that reads and steers that space.

2. **It gives Fe a color of its own.** Fi has a core tone — one luminous note, everything struck against it. If Fe also has an intrinsic color, the pair reads as "two feelings, one loud, one quiet," which is the single most common misunderstanding of the axis.

## 1.1 The correction, in one sentence

> **Fi's perimeter is computed from its center. Fe's center is computed from its perimeter.**

Fi holds a fixed core tone and measures the world against it — the boundary is sealed, the color is intrinsic, and an experience is admitted only if it rings true. Fe holds a ring of external oscillators — other people — and its own nucleus takes the *circular mean* of whatever they are doing. Fe's hue is a derived quantity. Its brightness is a derived quantity. Alone, Fe's nucleus desaturates toward grey, because the mean of an empty set has no color.

That inversion is the whole design. Everything below is a consequence of it.

## 1.2 What the glyph must showcase

| Characteristic | How it is *shown* (never captioned) |
|---|---|
| Interpersonal resonance | Phase-locking between external nodes, rendered as visible constructive interference |
| Directional flow (outward, between nodes) | Conducting impulses leave the nucleus, cross the rim's gap, and land *on nodes outside the boundary*; the coupling lattice is drawn **between the nodes**, not inside the chamber |
| Field synchronization | A single scalar — the Kuramoto order parameter `R` — drives halo, fringe sharpness, nucleus luminance, and the pleasure meter simultaneously |
| Mirroring | Fe's nucleus phase tracks `ψ` (the field's mean phase) with `latency` delay; a node's micro-shift propagates to the nucleus before Fe emits anything |
| Externalized adaptation | Fe changes the *room's* parameters, not its own. Its only self-modification is exhaustion. |
| Emotional orchestration | Conducting is metered and priced: `effort` is a visible cost that rises superlinearly against an incoherent field |
| Contrast with Fi | Fe has no intrinsic hue; the cross-listen inset ghosts Fi's meters against the same events, and they move oppositely |

## 1.3 Grammar compliance (§1.3, non-negotiable)

- **Element color:** feeling rose, `--c-f: #f43f5e`. As the extraverted sibling, Fe's accent runs **brighter and more saturated** than Fi's `#f56a8c` — same relation as Te `#17d4ef` to Ti `#4fc9e0`.
- **Attitude, triple-encoded (extraverted):**
  1. *Gradient direction* — bright rim, and a radiant halo that **bleeds past the boundary**. The halo is not decoration: it is the coupling medium, and it physically reaches the nodes. Fi's rim is dark and its light condenses inward; Fe's does the opposite in the same frame.
  2. *Shape grammar* — an **open ring**: a hexagonal rim with a live gap. The gap is not static; it rotates to face whichever node currently carries the most amplitude. The room's loudest voice is always the direction Fe is open in.
  3. *Particle behavior* — Fe **emits** into the environment. Conducting impulses leave the nucleus and are consumed by nodes; nothing orbits internally.
- **Role (judging):** hexagonal chamber with a visible lattice — but Fe's lattice is drawn **outside its own rim**, as the coupling graph between carrier nodes. This is the design's sharpest single statement: *the structure an extraverted judging function builds is not inside it.*

---

# 2. Zone A — The Living Glyph

## 2.1 Structure

```
                    ○ node₂ (a=.7, hue 344°)
         ○ node₁              ╲
            ╲   ·····coupling lattice·····  ○ node₃
             ╲ ╱                       ╱
        ╔═════╧═══════╗   ← open hex rim (gap faces loudest node)
        ║   ░░░▒▒▓█▓▒▒░░░  ║   ← interference field (fringes)
   ○────╢     ◉ nucleus    ╟────○ node₄     ← conducting impulses cross the gap
  node₆  ║   ░░░▒▒▓█▓▒▒░░░  ║
        ╚═══════╤═════════╝
                 ○ node₅
        ‹———— halo bleeds past the rim, out to the carrier ring ————›
```

| Layer | Radius (× `R_geom`) | Notes |
|---|---|---|
| Nucleus | 0.00 – 0.16 | Fe's own locus. Hue = amplitude-weighted circular mean of node hues. Luminance ∝ `R`. |
| Inner field | 0.16 – 0.92 | Radial interference raster summed from all nodes |
| Open hex rim | 0.94 | 6-segment path with a ~64° gap centered on `gateA`. Stroke luminance ∝ `R`. |
| Halo | 0.94 – 1.55 | Additive radial gradient, alpha ∝ `R`; the coupling medium |
| Coupling lattice | 1.10 – 1.35 | Node↔node edges; width ∝ `Aᵢⱼ`, alpha ∝ `cos(θᵢ−θⱼ)` |
| Carrier ring (nodes) | 1.28 | 7 nodes at idle, up to 12. **Outside the chamber.** |

## 2.2 Simulation core — Kuramoto coupling

Fe is not hand-animated. Every scenario in Zone D is a parameter change to one differential equation, which is what lets the Sandbox (§4) reuse it for free.

```js
// per node i, integrated at fixed dt
dθᵢ/dt = ωᵢ                                          // natural frequency (this person's own mood)
       + (K / N) · Σⱼ Aᵢⱼ · aⱼ · sin(θⱼ_read − θᵢ)    // peer coupling (the room affecting itself)
       + Kc · gᵢ · σ · sin(ψ_delayed − θᵢ)            // Fe conducting, σ = ±1
       + noise · ξᵢ                                   // jitter
```

**The order parameter is the master metric.** Everything visual and both meters read off it:

```js
Z      = Σ aᵢ·e^{iθᵢ} / Σ aᵢ
R      = |Z|            // 0 = total dissonance, 1 = perfect concord
ψ      = arg(Z)         // the room's mean phase — "the mood"
```

**Fe reads a different field than the one it acts on.** This is the mechanism behind the covert-hostility scenario, the shadow-slot behavior, and the Zone B ambient mechanic — one system, three payoffs:

```js
θᵢ_read  = θᵢ + δᵢ + εᵢ            // δ = node's presentation offset (the mask)
                                    // ε ~ N(0, (1 − fidelity) · 0.9 rad)  (Fe's own misreading)
R_read   = |Σ aᵢ·e^{iθᵢ_read} / Σ aᵢ|
trustGap = clamp(R_read − R, 0, 1)  // believed concord minus real concord
```

Two more derived channels:

```js
effort = ease( Kc · (1/N) · Σ gᵢ · |sin(ψ_delayed − θᵢ)| )   // cost of conducting *right now*
D      = 1 − |(1/N) · Σ e^{i·hueAngleᵢ}|                     // differentiation: how much individuality survives
split  = bimodality(θ)   // 1 when phases cluster into two antiphase groups
```

## 2.3 Kinetic signature

Warm, responsive, other-directed. At idle the field breathes at roughly `0.55 rad/s` (~11 s period) with `R ≈ 0.65` — coherent but never finished, because a room is never finished. Disharmony is *visibly uncomfortable*: as `R` falls, the fringes stop being concentric and start **beating** at `2.2·(1−R)` Hz, a slow flat throb across the whole chamber. Nothing about it is subtle, and that is correct — Fe's phenomenology is that a room being off is impossible to ignore.

The cursor is treated as **an eighth node**. Moving it into the carrier ring adds a live oscillator whose phase is derived from pointer velocity; hovering still, near a node, raises that node's `a` and pulls the gap around to face it. The user is in the room, and the glyph behaves accordingly.

## 2.4 Motion dynamics by regime

| Regime | Condition | Field | Nucleus | Halo | Nodes |
|---|---|---|---|---|---|
| **Idle** | `R ≈ .6–.75`, `effort < .2` | Soft concentric fringes, slow drift | Warm rose, steady 0.9 Hz breath | `alpha .38`, radius 1.35 | Gentle independent bob |
| **Attuned** | `R > .78`, `effort < .35` | Sharp, high-contrast fringes; one wavefront per cycle sweeps outward | Bright, hue variance narrow | `alpha .62`, radius 1.55 | Locked; spokes solid |
| **Conducting** | `effort > .45` | Fringes pull toward `ψ`; visible drag | Heat-shifts toward `--warn` by `effort²` | Pulses on emission | Lagging nodes flash on impulse contact |
| **Dissonant** | `R < .40` | Beating moiré, fringe speckle, contrast collapse | Dim, hue smeared | `alpha .12` | Drifting apart; spokes thin and dashed |
| **Unread** | `trustGap > .28` | Primary pattern looks *fine*; a faint counter-rotating ghost pattern beneath it | Rim jitters ±1.8 px · trustGap | Normal (this is the point) | Masked nodes render normally; only the ghost betrays them |
| **Split** | `split > .5` | Two counter-rotating domains with a **standing null** — a dark shear line across the chamber | Sits on the null, torn, desaturating | Pinched into two lobes | Two locked clusters, antiphase |
| **Severed** | `presence < .3` | Fringes have no sources; flat, grey, still | **Desaturates toward grey** — no mean to take | `alpha .04` | Faded / absent |
| **Overloaded** | `effort > .8` sustained | Fringes strobe, phase overshoot, leakage particles escape past the halo | Red-shifts regardless of accent | Ragged edge | Nodes overshoot and rebound (over-conducting) |

## 2.5 Color palette — `src/styles/fe-theme.css`

```css
/* Fe theme — feeling rose, radiant variant (extraverted: brighter, outward) */
:root {
  --c-accent: #ff4d75;
  --c-accent-fg: #33040f;
  --slot-active-bg: #2a0c16;
  --pos-1: #ffa8bd;
  --pos-2: #ff6389;
  --pos-3: #e03963;
  --pos-4: #a82446;

  /* carrier-node hue band: rose → coral, so hue variance stays in-family */
  --fe-hue-lo: 322;      /* deg */
  --fe-hue-hi: 368;      /* deg, wraps past 360 */
  --fe-hue-cold: 258;    /* the out-of-key node — never color-alone (see below) */
  --fe-null: #1a1220;    /* the standing null on a split field */
  --fe-ghost: #7f5fd0;   /* counter-rotating covert pattern */
}
```

**Accessibility note (§3.5):** the cold-hue node is *never* identified by hue alone. A node out of key simultaneously (a) counter-rotates, (b) draws its spoke dashed, and (c) reports in the node tooltip. The same rule governs the split field: the standing null is a geometric feature, not a color.

---

# 3. §3.1 Parametric model → Fe bindings

The rail glyph is the same object at eight presets. Each §3.1 parameter binds to a real term in the simulation, so a demon-slot Fe *feels* wrong with no new code path.

| §3.1 param | Fe binding | Consequence the user feels |
|---|---|---|
| `scale` | `R_geom`, carrier ring radius | The room Fe can hold gets smaller |
| `fidelity` | read noise `ε ~ N(0, (1−fidelity)·0.9 rad)` on every `θⱼ_read` | **Fe misreads the room.** Low fidelity → `trustGap` climbs on its own, without any hostile node |
| `latency` | `ψ_delayed` = ring buffer of `ψ` sampled `latency` ms ago | Fe conducts toward a mood the room has already left |
| `noise` | `ξ` amplitude + field speckle | Signal degradation |
| `duty` | conducting impulses emit only `duty` of the time; between emissions the halo dims and nodes drift free | Intermittent presence — the room reconverges without Fe and then loses it again |
| `control` | `Kc = control · 0.9` | Conducting authority. At Dominant, one impulse moves a node; at Inferior it barely registers |
| `contrary` | `P(σ = −1) = contrary`, evaluated per impulse | **The shadow register pushes the room apart** — the conducting term inverts and Fe actively drives nodes out of phase, while its readout still says it is helping |

Preset table (from `SLOTS[].params`, standard §3.1 values):

| Slot | scale | fidelity | latency | noise | duty | control | contrary | Resulting idle `R` | Resulting `trustGap` |
|---|---|---|---|---|---|---|---|---|---|
| Dominant | 1.00 | .95 | 0 ms | 0 | 1.00 | 1.00 | 0 | ~.86 | ~.03 |
| Auxiliary | .80 | .85 | 80 ms | .05 | .85 | .90 | 0 | ~.79 | ~.08 |
| Tertiary | .55 | .60 | 250 ms | .20 | .50 | .60 | 0 | ~.58 | ~.21 |
| Inferior | .40 | .35 | 700 ms | .45 | .25 | .35 | .12 | ~.38 | ~.34 |
| Opposing | .46 | .42 | 600 ms | .50 | .45 | .40 | .25 | ~.36 | ~.31 |
| Critical Parent | .44 | .35 | 900 ms | .55 | .35 | .30 | .35 | ~.31 | ~.36 |
| Trickster | .42 | .28 | 1200 ms | .60 | .30 | .20 | .55 | ~.24 | ~.42 |
| Demon | .40 | .20 | 1500 ms | .65 | .22 | .12 | .65 | ~.19 | ~.47 |

The Trickster and Demon rows are the theoretically loaded ones and the visualization earns them honestly: **high `trustGap` with high `contrary` renders as a Fe that believes it is harmonizing a room it is actively tearing apart.** That is the correct picture of demonic Fe, and nothing in the copy has to say it.

## 3.1 Stack slots (Beebe rule, derived — do not re-derive)

| Slot | Types | One-line register |
|---|---|---|
| Dominant | ENFJ · ESFJ | The room's state is the primary datum; harmony is not a preference but a load-bearing structure |
| Auxiliary | INFJ · ISFJ | Harmony in service of an inner perception — care delivered on a private schedule |
| Tertiary | ENTP · ESTP | Charm as an instrument. Real warmth, deployed; drops when the game is won |
| Inferior | ISTP · INTP | Belonging as a late, all-or-nothing hunger; long stretches of "people are illogical," then a desperate need for the room's approval |
| Opposing (5th) | INFP · ISFP | Contrary harmonizing — performs the group tone precisely in order to refuse it |
| Critical Parent (6th) | ENFP · ESFP | Weaponized decorum: *you're making everyone uncomfortable* — aimed at whoever is closest |
| Trickster (7th) | ISTJ · INTJ | Social reading that returns confident garbage; the room is misjudged and the misjudgment is acted on |
| Demon (8th) | ESTJ · ENTJ | Concord as a weapon: manufacturing a group tone in order to isolate someone inside it |

## 3.2 Zone B ambient mechanic

The rail glyph runs a drifting room continuously. Down the stack, `fidelity` and `latency` degrade `θ_read`, and the mechanic that surfaces it is the **trust gap needle**: a small paired readout showing *believed concord* against *actual concord*. At Dominant the two needles sit on top of each other. By Trickster they have visibly separated, and the ghost pattern is running under the field at 40% alpha. Position → social misreading, as one picture, using the exact machinery Zone D uses.

---

# 4. Zone C — Feeder coupling

Extraverted judging is fed by introverted perception. Fe's canonical partners are **Ni** and **Si**.

| Feeder | Coupling | `cfg` | Simulation mutation | Caption thrust |
|---|---|---|---|---|
| **Ni** ✓ | INFJ · ENFJ | `{ rate:.45, horizon:.9, nodes:5, weight:1.0, aim:3.14 }` | Each node renders a **prediction ghost** ahead of its current phase (`θᵢ + ωᵢ·horizon`). Conducting targets the ghosts, not the live phases. | Fe conducting toward where the room is *going*. Fewer people, read further ahead. Uncanny when right, presumptuous when wrong. |
| **Si** ✓ | ISFJ · ESFJ | `{ rate:.62, history:.85, nodes:9, weight:.9, aim:3.0 }` | Each node trails a **stratum ribbon** of its stored phase history; conducting targets the historical mean rather than the live mean. | The room as it has always been. Hosting, tradition, the known-good gathering — and the failure mode of conducting a room toward a version of itself it has outgrown. |
| **Se** ⟳ | ENFJ Fe–Se **loop** | `{ rate:.9, surface:1, nodes:7, weight:.5, sealed:false, loop:true }` | Node phases are read only from *instantaneous amplitude spikes*; Fe chases whichever node is loudest this frame. Ni's horizon cut out. | Charisma without direction. The gap swings wildly; `R` looks high moment to moment and never accumulates. Both functions extraverted — §3.4 draws this orbit entirely *outside* the self boundary. |
| **Ne** ⟳ | ESFJ Fe–Ne **loop** | `{ rate:.75, phantom:.8, nodes:7, weight:.4, loop:true }` | **Phantom nodes** spawn — speculative people who are not in the room (*what if they think…*). They carry real coupling weight. Fe conducts to them and pays full `effort`. | The anxiety loop, rendered exactly: energy spent harmonizing a room that includes people who aren't there. Watch `effort` climb while `R` over the *real* nodes does not move. |
| **Te** ⚠ | judging feeding judging | `{ rate:.15, stale:.9, nodes:7, weight:.3 }` | Node phases stop updating — Fe operates on last-known state and conducts on assumption. | Two sorters, no gatherer. Fe is handed verdicts about outcomes rather than perceptions of people; the chamber runs on stale data and nobody tells it. This is why real stacks alternate perceiving and judging. |

---

# 5. Zone D — The Resonance Lab

**Meters:** `System Stress` and **`Resonance Pleasure`** (the per-function rename; Ti uses *Coherence Pleasure*, Te *Throughput Satisfaction*, Se *Contact Pleasure*, Si *Recognition Pleasure*).

**Cross-listen inset (the rose mirrors):** ghost needles showing how each event lands on **Fi**'s meters — the Fe/Fi analogue of the Se/Si cross-listen in §2.5. This is where the axis lesson lands: the celebration that peaks Fe's pleasure barely moves Fi's; the isolation that severs Fe leaves Fi's core burning unchanged; the covert hostility that Fe cannot name registers on Fi's meters as an immediate, unambiguous value violation. Same events, opposite instruments.

**Additional readouts** (reusing the `.readouts` / `.cells` components from `si-theme.css`):

| Readout | Source | Why it earns its space |
|---|---|---|
| `CONCORD` + 12-cell bar | `R` | The master metric, given a non-color channel |
| `TRUST GAP` | `trustGap` | The only visible evidence during covert hostility |
| `EFFORT` | `effort` | Makes conducting cost legible |
| `COST` | `costU` | Links Zone D to Zone E, as Si's encounter cost does |

## 5.1 The six scenarios

Three harmony triggers, three dissonance triggers, laid out in two rows.

### Harmony · positive valency, high coherence

---

#### D1 · **Unspoken Sync** — `key: 'sync'`

> *One person's phase shifts a few degrees. Nobody says anything. Fe matches it inside a single frame.*

| Aspect | Spec |
|---|---|
| Sim mutation | Pick node `m` with highest `a`. Apply `θₘ += 0.42 rad` instantly. **No conducting impulse is issued.** Fe's nucleus tracks `ψ` through the normal latency path only. |
| Duration | 2.8 s, single beat, no follow-up |
| Visual | A single filament of light between nucleus and node `m` — the *only* moment in the lab where a connection is drawn to one node alone. Both shift together. Fringes ripple once and re-settle sharper than before. |
| Meters | `Δpleasure +0.30`, `Δstress −0.08` |
| `effort` | **Unchanged.** This is the point. |
| Cognitive state | `attuned` |
| Narration | *"Nothing was said and nothing was spent. One person's weather changed by a few degrees and the field moved with it before anyone could have named it. Note the effort meter: flat. The cheapest thing Fe does is the thing nobody else in the room can see it doing — which is also why it so rarely gets credit for it."* |
| Cross-listen (Fi) | `{ stress: 0, pleasure: +0.03 }` — near-nothing. Fi has no instrument for this event. |

---

#### D2 · **The Room Lifts** — `key: 'celebrate'`

> *Collective celebration. Every oscillator driven to high amplitude and near-identical frequency.*

| Aspect | Spec |
|---|---|
| Sim mutation | `N → 12` (nodes arrive), `aᵢ → 0.95`, `ωᵢ → ω̄ ± 0.04`, `K: 0.55 → 1.35`. Hue variance compressed toward the mean over 3 s. |
| Duration | 9 s, with a follow-up beat at 6.2 s |
| Visual | Fringes collapse into **full constructive interference** — the entire chamber becomes one wavefront, node boundaries dissolving into the field. Halo reaches maximum and the rim's gap widens to its limit. Genuinely beautiful; it should be the brightest frame on the site. |
| Meters | `Δpleasure +0.46`, `Δstress −0.14` |
| Honest cost | The `DIFFERENTIATION` readout **falls** as hue variance collapses, and the battery keeps draining at max pleasure. Sustained past ~7 s, individual node identity is gone: twelve oscillators rendering as one. |
| Cognitive state | `concord` |
| Narration (beat 1) | *"Everyone is on the same frequency and the field is doing almost no work — this is the state Fe is built to produce, and it is not a metaphor: twelve independent oscillators have locked, and the interference is entirely constructive."* |
| Narration (beat 2, 6.2 s) | *"Now watch the differentiation readout fall. Perfect concord is perfect sameness — the individual hues have averaged into one. Fe's characteristic failure is visible here at the exact moment of its greatest success: a room this synchronized has stopped being able to tell its members apart, and the first person to sound a different note will be experienced as an attack."* |
| Cross-listen (Fi) | `{ stress: +0.06, pleasure: +0.05 }` — mild, and *stress rises*: a homogenizing field is pressure, not pleasure, to an internal compass. |

---

#### D3 · **Reconciliation** — `key: 'reconcile'` · *gated*

> *The split field is bridged. The expensive one. The one Fe is for.*

| Aspect | Spec |
|---|---|
| **Gating** | Disabled unless `split > 0.40` — reuse the `.resolve-row` disabled pattern from `si-theme.css`. Reconciliation is a *response*, not a spontaneous event, and the UI should teach that before the button is ever clicked. |
| Sim mutation | Inter-cluster coupling `A_AB: −0.3 → +0.8` ramped over 2.5 s; `Kc → 1.0` for the duration; both cluster means driven toward the global `ψ`. |
| Duration | 7.5 s, follow-up at 5.0 s |
| Visual | The standing null **closes** — the dark shear line narrows and seals, and one bright wavefront sweeps outward from the seam across both domains and past the halo. The single most satisfying animation in the atlas; earn it with the 2.5 s of visible strain first, during which `effort` pegs near 1.0 and the nucleus runs hot. |
| Meters | `Δstress +0.20` **then** `Δpleasure +0.52 / Δstress −0.45` at the lock |
| Cost | `costU += 4.2` — by far the most expensive event in the lab |
| Cognitive state | `conducting` → `concord` |
| Narration (beat 1) | *"Effort at maximum, stress climbing, and for two and a half seconds nothing improves. This is what the work looks like from inside: Fe spending everything it has against a field that has not yet moved."* |
| Narration (beat 2, 5.0 s) | *"The null closes and the wavefront crosses both halves at once. Note the cost readout — four units and change, against one for the sync you spawned earlier. Fe's best moment is also its most expensive, which is the entire reason Fe-dominants burn out on rooms that will not resolve."* |
| Cross-listen (Fi) | `{ stress: −0.10, pleasure: +0.14 }` — real relief, but a fraction of Fe's. |

---

### Dissonance · negative valency, overload, disruption

---

#### D4 · **The Cold Current** — `key: 'covert'`

> *Covert social hostility. Two nodes mask their phase. The room looks fine. It isn't.*

| Aspect | Spec |
|---|---|
| Sim mutation | Two nodes get a presentation offset: `δ = −(θᵢ − ψ)` — i.e. **they display perfect agreement while their true phase drifts to antiphase** over 4 s. `ω` for those nodes shifts by `+0.5 rad/s`. |
| Duration | 11 s; auto-resolves at 11 s unless the user acts (see below) |
| Visual | The primary interference pattern **stays clean** — `R_read` remains ~0.8. Underneath it, a counter-rotating ghost pattern fades in at `alpha = 0.55·trustGap`, and the nucleus rim develops a fine jitter. Nothing points at the two nodes. |
| Meters | `Δstress +0.38` ramped over 4 s, `Δpleasure −0.12`. **Stress climbs while the concord readout stays high** — the meters disagree, and that disagreement is the entire content of the scenario. |
| Interaction | The user may hover nodes to inspect them. Fe **can** find the masked pair — at Dominant `fidelity`, hovering the right node reveals the offset after ~600 ms. At Tertiary or below, hovering reports agreement, because Fe's read noise exceeds the mask. Position determines whether the room is legible. |
| Cognitive state | `unreadable` |
| Narration | *"Concord reads eighty-one percent and the stress meter is climbing anyway. Nothing in the field is visibly wrong — the fringes are clean, the nodes report agreement, and the trust gap is the only instrument registering anything at all. This is the most characteristic Fe experience there is, and the reason it is so hard to defend: the function is detecting a real signal it cannot yet produce evidence for. Hover the nodes. Whether you find it depends on where Fe sits in the stack."* |
| Cross-listen (Fi) | `{ stress: +0.22, pleasure: −0.26 }` — and Fi's registers **immediately and unambiguously**, because falsity strikes a fixed core tone rather than a computed mean. The contrast is the lesson. |

---

#### D5 · **The Deadlock** — `key: 'deadlock'`

> *Unresolvable interpersonal conflict. Two clusters, locked antiphase. Effort does nothing.*

| Aspect | Spec |
|---|---|
| Sim mutation | Bimodal `ω` distribution: cluster A `ω = 0.40`, cluster B `ω = 0.78`. Inter-cluster coupling `A_AB = −0.3` (actively repulsive). Intra-cluster `K = 1.2`. |
| Duration | Persistent — **does not auto-resolve.** It sits until the user spawns Reconciliation or another event. |
| Visual | The field splits into two counter-rotating domains separated by a **standing null**: a dark shear line straight through the chamber, drawn where `cos(θ_A − θ_B) ≈ −1`. The nucleus sits on the null and desaturates — it is taking the mean of two opposites, and the mean of two opposites is grey. Fringes shear against each other along the seam. |
| Meters | `Δstress +0.42`; pleasure decays to floor and stays there |
| Effort | Auto-conducting engages and `effort` climbs to ~0.85 **with no improvement in `R`**. `costU` accrues at 3× the idle rate. This is the honest picture: Fe at a saddle point, paying full price for zero movement. |
| Cognitive state | `split` |
| Narration | *"Two clusters, locked in antiphase, and the conducting term is at eighty-five percent doing nothing whatsoever. Watch the cost readout keep climbing anyway — Fe cannot decline to work on a split room; the effort is not voluntary. And watch the nucleus: it takes the mean of the field, and the mean of two opposites is grey. This is what people describe as being torn in half by a conflict they are not even a party to."* |
| Cross-listen (Fi) | `{ stress: +0.08, pleasure: 0 }` — Fi is largely unbothered. It has a position; it does not need the room to have one. |

---

#### D6 · **Cut Off** — `key: 'isolate'`

> *Forced isolation from group feedback. The nodes go dark. Fe finds out what color it is alone.*

| Aspect | Spec |
|---|---|
| Sim mutation | `presence: 1 → 0.1` over 3 s; node `a → 0.05`, coupling edges severed one at a time (audible-feeling staggered timing, ~350 ms apart). At `t = 5 s`, **phantom nodes** begin spawning: 2–3 simulated nodes with invented phases, rendered at 35% alpha with dashed spokes. |
| Duration | 12 s, follow-up beat at 6.5 s |
| Visual | Fringes lose their sources and flatten. The halo collapses to `alpha 0.04`. And the nucleus — the payoff of the entire design — **desaturates toward grey**, because its hue is the circular mean of an empty set. Fe alone has no tone. Conducting impulses still emit, cross the rim, and dissipate unanswered. |
| Meters | `Δstress +0.30`, climbing a further `+0.02/s` for as long as isolation holds; `Δpleasure −0.34` |
| Phantom phase | `effort` climbs again at `t = 5 s` as Fe begins conducting to nodes that aren't there — full cost, zero real coupling. |
| Cognitive state | `severed` |
| Narration (beat 1) | *"The nodes are gone and the nucleus is going grey. This is the structural fact the whole page has been building toward: Fe's color is a computed average of the field around it, and with no field there is no average. Fi alone still burns rose. Fe alone has nothing to be."* |
| Narration (beat 2, 6.5 s) | *"And now watch the effort meter climb with nobody in the room. Those faint dashed nodes are not people — they are simulated ones, invented to have a field to harmonize with. Full cost, no coupling. This is rumination, drawn exactly as it works: an orchestration engine that cannot idle, running against an audience it made up."* |
| Cross-listen (Fi) | `{ stress: −0.04, pleasure: +0.08 }` — solitude is *restorative*. The needles move in opposite directions, and that single frame is the most efficient teaching moment on the Fe page. |

---

## 5.2 Scenario summary table

| # | Key | Valency | `Δstress` | `Δpleasure` | `costU` (measured) | Auto-resolve | Leaves the field |
|---|---|---|---|---|---|---|---|
| D1 | `sync` | + | −0.08 | +0.30 | **0.4 u** | 2.8 s | coherent |
| D2 | `celebrate` | + | −0.14 | +0.46 | **1.8 u** | 9.0 s | coherent, undifferentiated |
| D3 | `reconcile` | + (gated) | +0.20 → −0.45 | +0.52 | **4.8 u** | 7.5 s | coherent |
| D4 | `covert` | − | +0.38 | −0.12 | **1.8 u** | 11 s | mistrustful |
| D5 | `deadlock` | − | +0.42 | −0.30 | **climbs, ~1.0 u / 5 s** | **never** | split |
| D6 | `isolate` | − | +0.30 (+.02/s) | −0.34 | **2.9 u** | 12 s | severed |

Measured panel readings at each event's peak, from the shipped build:

| Event | State chip | Stress | Pleasure | Concord | Effort | Diff | Trust |
|---|---|---|---|---|---|---|---|
| *idle* | Attuned | 15% | 64% | 94% | 17% | 66% | 1% |
| `sync` | Attuned | 13% | 73% | 87% | **1%** | 66% | 0% |
| `celebrate` | Concord | 12% | 72% | 100% | 0% | **9%** | 0% |
| `covert` | Unread Current | 49% | 41% | 67% | 47% | 66% | **30%** |
| `deadlock` | Split Field | 85% | 6% | 36% | **100%** | 66% | 1% |
| `reconcile` (strain) | Split Field | 86% | 13% | 54% | 100% | 66% | 2% |
| `reconcile` (locked) | Concord | 16% | 71% | 100% | 0% | 66% | 0% |
| `isolate` | Severed Field | 84% | 7% | **6%** | 51% | 66% | 4% |

Composition is intentional: `deadlock` → `reconcile` is the designed arc, and `covert` → `deadlock` is the realistic one. Spawning `celebrate` on a split field produces a partial lock and a visibly forced concord — worth leaving in.

---

# 6. Technical implementation

## 6.1 `FeState` — the state stream

Same contract as `SiState` / `SeState`; drop-in for the shared DOM telemetry adapters.

```js
export const COG_STATES = {
  severed:    { key: 'severed',    label: 'Severed Field' },
  unreadable: { key: 'unreadable', label: 'Unread Current' },
  split:      { key: 'split',      label: 'Split Field' },
  dissonant:  { key: 'dissonant',  label: 'Dissonance' },
  conducting: { key: 'conducting', label: 'Conducting' },
  concord:    { key: 'concord',    label: 'Concord' },
  attuned:    { key: 'attuned',    label: 'Attuned' },
  ambient:    { key: 'ambient',    label: 'Open Field' },
};

/* Fe idles socially warm and slightly costly — a room is never finished,
   so its stress baseline is the highest of the four judging functions */
const BASE  = { stress: 0.16, pleasure: 0.34, noise: 0.20 };
const RELAX = { stress: 0.050, pleasure: 0.070, noise: 0.12 };
const EASE  = 2.4;

// published channels: concord (R), trust (trustGap), effort, diff (D), split
classify() {
  const { stress: s, pleasure: p, concord: R, trust, effort } = this.v, f = this.flags;
  if (f.severed)                       return COG_STATES.severed;
  if (trust > 0.28)                    return COG_STATES.unreadable;
  if (f.split || this.v.split > 0.5)   return COG_STATES.split;
  if (R < 0.40)                        return COG_STATES.dissonant;
  if (effort > 0.45)                   return COG_STATES.conducting;
  if (R > 0.78 && s < 0.30)            return COG_STATES.concord;
  if (R > 0.62 && p > 0.50)            return COG_STATES.attuned;
  return COG_STATES.ambient;
}
```

Chip colors live in the data layer (`LAB.states`), per the Si convention — state logic stays style-free.

## 6.2 `FeGlyph` — public contract

Matches the contract the shared rail and feeder modules depend on:

```js
new FeGlyph(canvas, { seed, coreGlow, hudScale, interactive, supply, COL })
  .setTarget({ scale, fidelity, latency, noise, duty, control, contrary })
  .setStructure({ countMul, k, rigidity })   // maturity slider: countMul → node count,
                                             // k → coupling degree, rigidity → ω variance damping
  .setFeeder(f)                              // cfg keys from §4
  .pulse(color)
  .scenario(key, impact)                     // Zone D entry point
  .resolve(choice)                           // gated Reconciliation ruling
  .step(dt) / .draw() / .renderStatic() / .start()

// live fields
.state      FeState
.costU      accumulated conducting cost, units
.pending    the split awaiting reconciliation (drives button enablement)
.onResolve  (choice, auto) => {}
.bombard    Zone B ambient mode
.steered    set once the pointer has acted as an eighth node
```

**Maturity slider (§3.2):** with age the node count rises (`countMul`), coupling degree `k` rises (more of the room is read at once), and `rigidity` damps `ω` variance — an older Fe holds a larger, more stable room. Deliberately *not* framed as "gets better"; the differentiation readout falls slightly too.

## 6.3 Integration step — the simulation

```js
step(dt) {
  const P = this.params;

  /* ---- 1. read the field (through Fe's own noise, and the nodes' masks) ---- */
  let zr = { x: 0, y: 0 }, zt = { x: 0, y: 0 }, wsum = 0;
  for (const n of this.nodes) {
    const eps  = this.rng.normal() * (1 - P.fidelity) * 0.9;
    const read = n.th + n.delta + eps;
    zr.x += n.a * Math.cos(read); zr.y += n.a * Math.sin(read);
    zt.x += n.a * Math.cos(n.th); zt.y += n.a * Math.sin(n.th);
    wsum += n.a;
  }
  const inv = 1 / Math.max(1e-6, wsum);
  const R       = Math.hypot(zt.x, zt.y) * inv;
  const psi     = Math.atan2(zt.y, zt.x);
  const Rread   = Math.hypot(zr.x, zr.y) * inv;
  const trust   = clamp(Rread - R, 0, 1);

  /* ---- 2. latency: Fe conducts toward the room it saw `latency` ms ago ---- */
  this.psiBuf.push(psi, this.t);
  const psiD = this.psiBuf.sample(this.t - P.latency / 1000);

  /* ---- 3. integrate the room ---- */
  const Kc = P.control * 0.9;
  let effortAcc = 0;
  for (const n of this.nodes) {
    let dth = n.w;
    for (const m of this.nodes) {                      // peer coupling
      if (m === n) continue;
      dth += (this.K / this.nodes.length) * this.A(n, m) * m.a * Math.sin(m.th + m.delta - n.th);
    }
    if (this.emitting) {                               // Fe conducting — gated by duty
      const sigma = this.rng() < P.contrary ? -1 : 1;  // the shadow inversion
      const drive = Kc * n.g * sigma * Math.sin(psiD - n.th);
      dth += drive;
      effortAcc += Kc * n.g * Math.abs(Math.sin(psiD - n.th));
    }
    dth += P.noise * 1.4 * this.rng.normal();
    n.th = (n.th + dth * dt) % TAU;
  }

  /* ---- 4. publish; the DOM telemetry adapters are already subscribed ---- */
  this.effort += (effortAcc / this.nodes.length - this.effort) * (1 - Math.exp(-dt * 3));
  this.costU  += this.effort * dt * this.posCostMul;
  this.state.publish({ concord: R, trust, effort: this.effort, split: this.split, diff: this.D });
  this.state.step(dt);

  /* ---- 5. presentation-layer eases ---- */
  this.gateA  = angleLerp(this.gateA, this.loudestNodeAngle(), 1 - Math.exp(-dt * 2.2));
  this.haloA += ((0.08 + 0.5 * R) - this.haloA) * (1 - Math.exp(-dt * 2.0));
  this.hue    = circMeanHue(this.nodes);       // grey when the ring is empty — by construction
  this.sat    = 0.62 * this.presence;
}
```

**Note on `this.emitting`:** gate it on `duty` with a deterministic phase (`sin(t·2π/dutyPeriod) > 1 − 2·duty`), never `Math.random()` — replay permalinks depend on determinism (§6.1).

## 6.4 Scenario dispatch — one table, no special cases

```js
const SCENARIOS = {
  sync:      { nodes: 'bump', arg: 0.42, K: null, conduct: false, ms: 2800 },
  celebrate: { nodes: 12, amp: 0.95, spread: 0.04, K: 1.35, hueLock: 0.8, ms: 9000 },
  reconcile: { crossA: +0.8, ramp: 2500, Kc: 1.0, gate: 'split', ms: 7500 },
  covert:    { mask: 2, driftTo: Math.PI, ramp: 4000, ms: 11000 },
  deadlock:  { bimodal: [0.40, 0.78], crossA: -0.3, K: 1.2, ms: Infinity },
  isolate:   { presence: 0.1, ramp: 3000, phantomAt: 5000, phantoms: 3, ms: 12000 },
};

scenario(key, impact) {
  const s = SCENARIOS[key];
  if (s.gate === 'split' && this.split < 0.4) return;   // Reconciliation is a response
  this.state.impulse(impact);                            // meters move immediately
  this.state.flags = { ...FLAG_RESET, [key]: true };
  this._applyScenario(s);                                // mutates ω, A, a, δ, presence — nothing else
  if (s.ms !== Infinity) this._decayTo(BASELINE_FIELD, s.ms);
}
```

Every scenario is a mutation of `{ω, A, a, δ, presence, K, Kc}`. No scenario touches the renderer. This is what §2.4's "computed, not hand-animated" requires, and it is what lets the Sandbox drop an Fe module in and get all six behaviors for free.

## 6.5 Renderer — Canvas 2D (baseline) and WebGL2 (preferred)

**Canvas 2D path** (matches every existing engine; the safe default): render the interference field to a **half-resolution offscreen buffer**, one `createRadialGradient` per node stroked additively with `globalCompositeOperation = 'lighter'`, then upscale with `imageSmoothingEnabled = true`. At 7 nodes and half-res this holds the §6.1 budget of ≤2 ms/frame.

**WebGL2 path** (justified by the same argument that earned `fi-fluid.js` its shader — true wave interference is a per-pixel summation and degrades badly when faked):

```glsl
uniform vec2  uNode[12];      uniform float uPhase[12];
uniform float uAmp[12];       uniform vec3  uNodeCol[12];
uniform int   uN;
uniform float uR, uPsi, uTrust, uEffort, uNoise, uTime, uPresence;

const float K_WAVE = 26.0;    // fringes per unit radius
const float FALLOFF = 1.9;

void main() {
  float f = 0.0, w = 0.0;  vec3 tint = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    if (i >= uN) break;
    float d  = distance(vUv, uNode[i]);
    float wi = uAmp[i] * exp(-d * FALLOFF);
    float s  = sin(d * K_WAVE - uTime * 1.7 + uPhase[i]);
    f += wi * s;  w += wi;  tint += uNodeCol[i] * wi * (0.5 + 0.5 * s);
  }
  f /= max(1e-4, w);  tint /= max(1e-4, w);

  // coherence sharpens the fringes; incoherence smears them toward speckle
  float fringe = mix(f * 0.5 + 0.5, smoothstep(-0.15, 0.15, f), uR);
  fringe += uNoise * 0.18 * (hash(vUv * 640.0 + uTime) - 0.5);

  vec3 col = tint * fringe * (0.35 + 0.65 * uR);

  // covert hostility: a counter-rotating ghost beneath an apparently clean field
  float dc    = distance(vUv, vec2(0.5));
  float ghost = sin(dc * K_WAVE + uTime * 1.7 - uPsi);
  col = mix(col, GHOST_COL * (0.5 + 0.5 * ghost), uTrust * 0.45);

  // overload heat
  col = mix(col, WARN_COL, uEffort * uEffort * 0.30);

  // severed: no sources, no mean, no colour
  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, uPresence);

  fragColor = vec4(col, 1.0);
}
```

Ship the Canvas 2D path first; the shader is a swap behind the same `FeGlyph` façade, exactly as `fi-fluid.js` sits behind `fi-glyph.js`.

## 6.6 Reduced motion (§3.5 — non-negotiable)

- `setTarget` applies instantly and calls `renderStatic()`.
- `renderStatic()` draws the field at a **frozen phase** with fringes at full contrast, plus a small annotation block: `R`, `trustGap`, `effort`, and the node phase distribution as a static dial ring. A split field renders with its null visible; a severed field renders grey. Every scenario's *result* is legible without motion.
- Scenario clicks fast-forward the real simulation (`ffwd()` pattern from `te/main.js` and `si/main.js`): fixed `step(1/30)` iterations, then one `draw()`.
- The beating that carries dissonance in motion is carried statically by **fringe contrast and spoke dashing**, never by animation alone.

---

# 7. Zone E — Energy economics

```js
/* Fe's dominant curve carries frequent shallow notches: a room that locks
   pays a little back, and rooms lock often. Compare Si's quarter-hour
   ritual notch and Ni's rare insight dip — Fe's rhythm is the fastest
   micro-recovery in the atlas, and also the shallowest. */
function domDrain(t) {
  const base  = 12.4 * (t / 60);
  const notch = 2.3 * Math.pow(Math.max(0, Math.sin(t / 6.5)), 3);
  return Math.max(0, base - notch);
}
```

| Series | Curve | Character |
|---|---|---|
| Dominant | `domDrain` above | Near-linear, frequent shallow flow dips — Fe-dominants genuinely recharge in a good room |
| Auxiliary | `21 · (t/60)^1.07` | Clean |
| Tertiary | `30 · (t/60)^1.42` | Charm is affordable in bursts, not sustained |
| Inferior | `min(100, 86 · (t/60)^1.9)` | Steepest inferior curve in the atlas — a Ti-dominant working a room is the most expensive thing in the model |
| Shadow | jagged + spikes at `[15, 40, 67, 96]` | Unpredictable lumps |

`GRIP_T = 60 · (100/86)^(1/1.9)`

**Grip copy — note the direction, it runs both ways and both are worth stating:**
- Fe-dominant collapse floods into **inferior Ti**: cold, absolute, sputtering logic. Withdrawal into rigid principle, cutting people off with a rule, "I'm just being rational" from someone who has never once been just being rational.
- **Inferior Fe** (ISTP/INTP) is the eruption in the other direction: a sudden, desperate, uncharacteristic need for the room's approval, or a hypersensitivity to belonging that lands with no calibration at all.

**Recovery notes:** the dominant refills *in company* — the one function whose recovery is not solitary, which is worth saying explicitly next to Fi's, where the opposite holds. The inferior's hangover shelf is the social hangover, and it needs no translation.

---

# 8. Zone F — Field notes

**Mirror:** Fe ↔ Fi, drawn as inverse instruments — the ring computing its center against the core computing its perimeter.

Vignettes:
- **The Read.** An ENFJ walks into a room and reorganizes it in eleven seconds — seats a person next to the one who will draw them out, aims a question at whoever has been quiet, breaks a tension nobody else has registered yet. Asked afterward what they did, they can rarely reconstruct it, because the read and the response were one operation.
- **The Loop.** An ESFJ under stress pairs dominant Fe with tertiary Ne: conducting toward people who are not in the room. What they might be thinking, what that message might have meant, how it might land. Full effort, no coupling. The function that would break it — Si's actual record of how these people actually behave — is exactly the one the loop stops consulting.
- **The Grip.** An INTP past the end of their reserves stops analyzing and floods into inferior Fe: an abrupt, raw, badly-calibrated need to know they are wanted here, from someone who spent the entire week explaining that social convention is arbitrary. Not a personality change — a low-capacity chamber taking a dominant-sized flood.

---

# 9. Build checklist

| Artifact | State |
|---|---|
| `src/styles/fe-theme.css` | New — §2.5 above |
| `src/engines/fe-state.js` | New — §6.1 |
| `src/engines/fe-glyph.js` | New — §6.2–6.5 |
| `src/engines/fe-field-gpu.js` | Optional second pass — §6.5 |
| `src/data/fe-data.js` | New — `loadFeData()` → `{ COL, SLOTS, FEEDERS, SERIES, GRIP_T, COSTS, RECOVERY, LAB, HERO, ZONE_B…ZONE_F }` |
| `fe/index.html` | Replace the Phase-2 stub; same ids as `si/index.html` |
| `fe/main.js` | ~200 lines, `si/main.js` as the template (it has the gated-ruling and cross-listen wiring already) |
| `src/shared/header.js` | Add `'fe'` to `LIVE` |
| `index.html` | Promote the Fe card to a live link |
| `vite.config.js` | Verify the `fe` input exists; do not duplicate |

**Reused without modification:** `stack-rail.js`, `feeder-coupling.js`, `energy-charts.js`, `tooltip.js`, `utils/*`. The gated-reconciliation UI reuses `.resolve-row`, and the readouts reuse `.readouts` / `.cells` — both promoted from `si-theme.css` into `fe-theme.css` (or, better, lifted into `base.css` now that two pages want them).

**Determinism:** `mulberry32` only, distinct seed per zone instance. No `Math.random()` anywhere, including the `duty` gate and the `contrary` sign flip.

---

# 10. As built — where the implementation departs from this spec

Seven changes were forced by the simulation actually running. Each is a correction, not a compromise, and the code carries the reasoning at the site.

**1. `trustGap` is a magnitude, not a signed over-estimate.** The spec defined it as `R_read − R` (believing the room is better than it is). But Fe's read noise scales with `1 − fidelity`, and random per-node noise *decoheres* an estimate — it pushes `R_read` **down** as often as up. Shipping the signed version would have meant a low-fidelity Fe showing a *negative* gap, i.e. no gap at all, which would have gutted the shadow-slot lesson. `trust = |believed − concord|` is what a misreading actually is, and the twin needles restore the direction the scalar drops. The read bias is also now **persistent per carrier** (resampled every 2.5 s) rather than per-frame white noise: a misread is a standing misunderstanding of a particular person, which both models better and holds still long enough to see.

**2. Concord is coherence that costs nothing.** `R > 0.78 && stress < 0.34` made *idle* the concord state — a dominant Fe holding a small room sits near R ≈ 0.9, so the chip never moved and the achievement never read as one. The shipped test is `R > 0.88 && effort < 0.12 && stress < 0.28`. A room Fe is personally propping up is **Attuned**; concord is when the room holds itself. This is a better theoretical claim than the one I specified.

**3. `concord` and `believed` are scaled by presence.** The order parameter is weight-normalized, so a ring of near-dead carriers still reports ~97% agreement — putting "Concord 97%" on the panel beside a *Severed Field* chip. The coherence of an empty room is not 1.

**4. The deadlock uses matched frequencies with repulsive coupling.** The spec's bimodal `ω` (0.40 / 0.78) produces a **beat**, not a deadlock: the two clusters drift through alignment every ~9 s and the room resolves itself on a timer, flatly contradicting the narration. Shipped: equal `ω`, `crossA = −1.4`, and the antiphase **seeded directly** (escaping the in-phase state by repulsion alone is exponentially slow — the room took ~25 s to divide). It now splits in 1.5 s and holds indefinitely; verified stable across 25 s of continuous run.

**5. Reconciliation had to actually conduct.** Flipping `crossA` from −0.3 to +0.8 does nothing: two rigid halves pinned at π sit on a symmetric point, touching through only the two boundary edges of the ring lattice. What breaks the symmetry is a single common target both halves get dragged toward — so `KcMul` goes to **2.8** and the lattice **bridges all-to-all** for the duration (a visible densification). That is also the more honest mechanism: the room is being pulled together by someone, not resolving itself.

**6. Constants.** `Kc = control × 0.55` (not 0.9), and carrier reachability `g ∈ [0.12, 0.90]` — the wide floor is load-bearing, because uniformly reachable carriers let an idle field lock solid and stay there. Effort is `(load/gsum)^2.6 × (0.6 + 0.5·control) × 1.15`; the exponent is there because idle and deadlock differ by only ~1.5× in raw phase offset, which is not enough separation to read on a meter. A continuous **mood drift** (every 1.15 s) keeps the room at a dynamic equilibrium instead of a dead lock — a room is never finished. Cost is booked **per event** so the panel comparison the narration asks for (4.8 u against 0.4 u) is readable.

**7. Renderer.** Shipped on Canvas 2D as **additive crest rings** — one set of concentric wavefronts per carrier, composited with `lighter` and clipped to the chamber, so crest-on-crest genuinely brightens and the constructive interference is real rather than illustrated. Every wave inside the chamber is emitted from outside it. Per-pixel field summation was rejected on the §6.1 budget (≈180k trig evaluations/frame at quarter-res); the WebGL2 shader in §6.5 remains the optional second pass behind the same façade.

Also fixed in passing: `_gauss()` had σ ≈ 0.577 rather than 1 (the Irwin–Hall normalizing factor for n=3 is 2, not 2/√3), so every noise-scaled parameter — read bias, mood drift, §3.1 `noise` — was running at ~58% of its intended magnitude. Correcting it is what made the Zone B trust gap visible: **1% at Dominant rising to 25–27% at Trickster and Demon**, time-averaged over 60 s per slot.

---

# 11. What excellent looks like

Someone who has never heard of cognitive functions lands on `/fe/`, watches for fifteen seconds, and understands without reading a word that this function's job happens *between* people rather than inside the frame. Then they click **Cut Off**, watch the nucleus go grey, and understand the Fe/Fi axis more completely than a thousand words of comparison could deliver — because the page did not tell them Fe is other-directed. It removed the others, and the color left with them.

`DESIGN.md` §1.4: *felt before read.*
