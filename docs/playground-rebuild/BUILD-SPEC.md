# Playground Rebuild — Build Spec

**Audience:** an implementer with zero context on the conversation that produced this. Everything you need is in this file and the sixteen SVGs beside it.
**Read first:** `00-BRIEF.md` for why the layout is what it is. `S3.svg` and `S5.svg` for the screen. `D3.svg`, `D4.svg`, `D6.svg` for the model.
**Status:** structure complete. **Now built** — see `IMPLEMENTATION-NOTES.md`.

> ⚠️ **This spec is the design record, not the current source of truth.**
> Building it surfaced defects that could not be found on paper — most importantly, §5.1's Grip
> condition gates on the dominant's private capacity, which can never fire, and §3.3's routing order
> sends `Te` to `Fe` rather than `Ti`. **`IMPLEMENTATION-NOTES.md` supersedes this file wherever they
> disagree**, and the code matches those notes. Read it alongside §3–§5.

---

## 0. Orientation

### 0.1 What is being built

A rebuild of the Playground in **CURRENTS**, a web app teaching Jungian cognitive functions. The user assembles a four-function stack (a *Vessel*), drops it into an authored *Scenario*, watches four *Reaction Windows* report what each function is doing, forecasts the cost of each candidate *Action* by hovering, commits one, and reads the receipt. Loop and Grip are named failure modes that rewrite every readout.

The one-sentence thesis the whole thing serves:

> Any type can produce any action in any situation. What differs is the internal bill — energy, stress, friction — and that bill, together with the situation, sets the probability that the behaviour actually appears.

### 0.2 The existing codebase

Vanilla ES modules on Vite 6. **No framework.** Per-page directories (`playground/`, `ti/`, `fe/`, …) each with an `index.html` and a `main.js`; shared code in `src/`.

Reuse without modification:

| Path | What it gives you |
|---|---|
| `src/engines/<fn>-glyph.js` | The eight glyph engines. Each is a class rendering to `<canvas>`, parameterised by live state. These are the glyphs referenced throughout the wireframes. |
| `src/engines/<fn>-state.js` | Per-function state streams used by the info pages. |
| `src/data/scenarios/*.js` | Three authored scenarios: `credit-thief`, `kitchen-fire`, `the-offer`. Field names differ from this spec — see §1.9. |
| `src/playground/types.js` | The type algebra. `FN`, `AXIS`, `deriveStack`, `typeCode`, `isLegal`, `loopPair`. The sixteen types are derived from two choices, never stored. **Reuse this file as-is.** |
| `src/shared/*`, `src/utils/*` | Header, tooltip, math helpers. |

Replace entirely: `playground/main.js` and `src/playground/{assembly,briefing,chamber,ledger,monologue,vessel}.js`.

### 0.3 Vocabulary, fixed

| Term | Meaning |
|---|---|
| **Function** | One of `ne ni se si te ti fe fi`. |
| **Stack** | Ordered four: dominant, auxiliary, tertiary, inferior. ISTP = Ti / Se / Ni / Fe. |
| **Vessel** | An instantiated stack with live state. Persists across scenario runs within a session. |
| **Scenario** | An authored situation with per-function predispositions and cost gates. |
| **Run** | One scenario, entered and resolved. **Exactly one committed action per run.** |
| **Beat** | The simulation's time unit and the seismograph's x-axis. A run contributes 8. |
| **Session** | A sequence of runs on one vessel. The accumulator for Loop and Grip lives here. |
| **Readout** | One of the five per-function signals: stream, stress, pleasure, involvement, energy. |
| **Reaction Window** | The row that renders one function's five readouts. Wireframed in `S5.svg`. |

---

## 1. Data model

TypeScript notation for precision. The runtime is vanilla JS — express these as JSDoc `@typedef`s in `src/playground/model.js`, matching the house style already used in `src/playground/types.js`.

### 1.1 Primitives

```ts
type FunctionKey = 'ne' | 'ni' | 'se' | 'si' | 'te' | 'ti' | 'fe' | 'fi';
type Rank        = 'dom' | 'aux' | 'tert' | 'inf';
type Element     = 'n' | 's' | 't' | 'f';
type Attitude    = 'e' | 'i';
type Klass       = 'perceive' | 'judge';
type MachineState = 'balanced' | 'strained' | 'loop' | 'grip' | 'recovery';
type Tier        = 'FULL' | 'MID' | 'LOW' | 'BYPASSED';
type Relation    = 'serves' | 'neutral' | 'defers' | 'violates';

/** 0..100 unless stated. Capacity may go negative — that is debt. */
type Scalar = number;
```

### 1.2 Function and Stack

```ts
interface CognitiveFunction {
  key:       FunctionKey;
  label:     string;        // 'Ti'
  name:      string;        // 'Introverted Thinking'
  element:   Element;
  attitude:  Attitude;
  klass:     Klass;
  glyphName: string;        // 'The Lattice' — shown beside the glyph slot
  engine:    string;        // 'src/engines/ti-glyph.js'
}

interface Stack {
  code:  string;                       // 'ISTP'
  order: [FunctionKey, FunctionKey, FunctionKey, FunctionKey];  // dom, aux, tert, inf
  rankOf(fn: FunctionKey): Rank | null;
  carries(fn: FunctionKey): boolean;
  loopPair: [FunctionKey, FunctionKey]; // [dom, tert]
  gripFn:   FunctionKey;                // inferior
}
```

`Stack` is derived from `(dominant, auxiliary)` by the three Laws already implemented in `src/playground/types.js`. Do not add a table of sixteen.

### 1.3 Scenario and Predisposition

```ts
interface Predisposition {
  fn:        FunctionKey;
  statement: string;   // authored prose, 1–2 sentences, in that function's register
  gate:      number;   // cost multiplier, clamped to [0.6, 1.8]
  gateNote:  string;   // plain-language reason, shown under the number in S2
  registration: 'REGISTERED' | 'MISSED IT' | 'ACTIVE' | 'OVERLOADED' | 'IDLE';
  affinity:  number;   // 0.3..1.6 — how well this situation feeds this function
}

interface Scenario {
  id:         string;              // 'credit-thief'
  title:      string;
  blurb:      string;              // one line, for the browser card
  vignette:   string;              // 2–3 sentences, for the briefing
  predispositions: Record<FunctionKey, Predisposition>;  // authored for all EIGHT
  actions:    Action[];            // authored deck, 4–6
  stateActions?: Partial<Record<MachineState, Action[]>>; // optional overrides for generated cards
  outcomes:   Record<string, Record<MachineState, string>>; // actionId → state → outcome prose
}
```

Predispositions are authored for **all eight** functions, not only the four in some stack, so any vessel can enter any scenario. `resolveScenario(scenario, stack)` projects the eight down to the four that are carried, and that projection is what `S2.svg` renders.

### 1.4 Action

```ts
interface Action {
  id:        string;
  label:     string;                              // card title
  detail:    string;                              // one line under it
  signature: Partial<Record<FunctionKey, number>>; // demanded functions; values sum to 1
  intensity: number;                              // 0..1
  mandates: {
    serves?:   string[];   // 'fi.fairness' — dotted refs into predispositions
    defers?:   string[];
    violates?: string[];
  };
  voices: Partial<Record<FunctionKey, Partial<Record<MachineState, string>>>>;
  origin: 'authored' | 'generated';
  axis?:  'alleviate' | 'aggravate';   // present only on generated cards
  template?: string;                    // which template produced a generated card
}
```

`signature` may name functions the stack does not carry. That is not an error — see routing, §3.3.

### 1.5 FunctionState

```ts
interface FunctionState {
  fn:          FunctionKey;
  rank:        Rank;
  capacity:    Scalar;   // starts at RANK_PROFILE[rank].capacity; may go negative = debt
  stress:      Scalar;   // 0..100
  pleasure:    Scalar;   // 0..100, decays fast
  involvement: number;   // 0..1; the four always sum to exactly 1
  routedInto:  boolean;  // true this beat if it absorbed work for a function not carried
  tier:        Tier;     // presentation, derived — see §6.4
  trace:       Float32Array;  // ring buffer view, 256 beats of stress
}
```

`debt` is not a separate field: `debt = max(0, -capacity)`.

### 1.6 Readout and the hover bundle

```ts
interface ReadoutDelta {
  fn:          FunctionKey;
  streamLine:  string;   // (a) what this function would say
  dStress:     number;   // (b)
  dPleasure:   number;   // (c)
  involvement: number;   // (d) proposed absolute share, not a delta; the four sum to 1
  dInvolvement:number;   //     the delta, for the gutter
  cost:        number;   // (e) energy this action would consume
  wouldDebt:   number;   // overflow past zero, 0 if none
  routed:      boolean;
  attribution?: 'LOOP' | 'GRIP';  // set when the state, not the action, caused the delta
}

interface AggregateDelta {
  dEnergy: number; dStress: number; dPleasure: number; dEvenness: number;
  in: { novel: number; referential: number };
  out: { visible: number; internal: number };
  crossesLoop: boolean;   // drives the header margin warning in S4
  crossesGrip: boolean;
}

interface ForecastBundle {
  actionId:  string;
  stateHash: string;             // memo key; changes only on commit or transition
  per:       Record<FunctionKey, ReadoutDelta>;
  aggregate: AggregateDelta;
}
```

### 1.7 Aggregate (the Whole-Human state)

```ts
interface HumanState {
  energy:   Scalar;   // 0..100, % of the stack's total starting capacity
  stress:   Scalar;   // 0..100, peak-weighted — see §4.2
  pleasure: Scalar;   // 0..100, conflict-discounted — see §4.3
  evenness: number;   // 0..1, normalised entropy of the involvement vector
  debt:     Scalar;   // sum of per-function debt
  in:  { novel: number; referential: number };
  out: { visible: number; internal: number };
  trace: Float32Array;  // 256 beats of aggregate stress
}
```

### 1.8 Session and Run

```ts
interface Beat {
  index: number;
  kind:  'intake' | 'commit' | 'aftermath' | 'idle';
  fn?:   FunctionKey;      // set for intake beats
  runId: string;
}

interface RunRecord {
  runId: string; scenarioId: string; actionId: string;
  before: Record<FunctionKey, FunctionState>;
  after:  Record<FunctionKey, FunctionState>;
  bill:   BillLine[];
  transition?: { from: MachineState; to: MachineState; cause: string };
}

interface Session {
  vessel:   Stack;
  fnStates: Record<FunctionKey, FunctionState>;  // only the four carried
  human:    HumanState;
  machine:  MachineState;
  manual:   boolean;          // true if the current state was forced from the control bar
  beatIndex:number;
  beats:    RingBuffer<Beat>; // 256
  runs:     RunRecord[];      // full, never truncated — S9 counterfactuals need it
  loopHeldBeats: number;
  loopArmedCommits: number;   // consecutive commits satisfying the loop condition
}

interface BillLine { label: string; note: string; value: number; heavy: boolean; }
```

### 1.9 Migrating the existing scenario files

`src/data/scenarios/*.js` already carry `surface`, `interior`, `gates`, `affinity`, and `actions` with `signature` / `intensity` / `mandates` / `outcome`. Write an adapter rather than rewriting the data:

- `surface[fn]` + `interior[fn]` → `Predisposition.statement` (authored prose is missing and must be written; the structured hooks are the source material).
- `gates[fn]` — sometimes a number, sometimes a keyed table resolved by the interior hook. Resolve at Enter Scenario into a flat number and clamp to `[0.6, 1.8]`.
- `affinity[fn]` → `Predisposition.affinity`, defaulting to 1.0 where absent.
- `action.outcome` (a single string) → `outcomes[actionId].balanced`; author the other four states or fall back to the balanced text with a state prefix.
- `action.voices` does not exist yet. See §8.4 for the recommended keying, which reduces the authoring burden by roughly 60%.

---

## 2. Interaction semantics

### 2.1 The hover contract

Hovering an action card renders a **forecast**: all five readouts on all four rows, plus the aggregate, plus both margin meters, projected as if the action were committed.

Hover **must**:
- be pure — it reads state and writes nothing: no counters, no history, no analytics, no behaviour-altering caches;
- be free — no energy, no stress, no beat;
- be exactly reversible — pointer-out restores the resting screen byte-for-byte;
- be unlimited — a user may compare all five cards indefinitely at zero cost;
- use the *identical* arithmetic that commit will use. This is a correctness property, not an optimisation: a forecast computed differently from the commit is a lie, and the whole product rests on it being true.

The contract is printed on the screen (`S4.svg`, callout 2) because users only explore freely if they believe exploration is free.

### 2.2 Input equivalence

| Input | Enters forecast | Commits |
|---|---|---|
| Pointer | `pointerenter` on a card | click, or click `COMMIT` |
| Keyboard | `ArrowUp` / `ArrowDown` moves the candidate | `Enter` |
| Touch | press-and-hold (`pointerdown`, 120ms) | slide up while holding |

There is no hover on touch, so the forecast binds to press-and-hold and commit requires a second deliberate gesture. **The contract is unchanged; only the input differs.** Release without sliding cancels and restores exactly. See `S10.svg`, callout 6.

### 2.3 What is reversible

| | Reversible until | Notes |
|---|---|---|
| Dominant / auxiliary choice | Enter Scenario | Slots 3 and 4 are entailed and were never choices. |
| Scenario selection | Enter Scenario | |
| Hover / candidate selection | always | |
| Row expansion, aggregate expansion | always | Presentation only. |
| Manual Loop / Grip toggle | always | Toggling off routes to Recovery, not Balanced. |
| **Commit** | **never** | There is no undo. The counterfactual on S9 is the answer, and it is a better lesson than an undo. |
| Reset Vessel | never | Confirmed, because it discards the session accumulator. |

### 2.4 What persists

| Scope | Contents | Cleared by |
|---|---|---|
| Transient (one gesture) | `ForecastBundle` | pointer-out / release |
| Run (one scenario) | scenario, resolved gates, deck, candidate, this run's 8 beats | Enter Scenario |
| **Session (many runs)** | vessel, all four `FunctionState`s, `HumanState`, machine state, beat ring buffer, run log | Reset Vessel |
| Page reload | nothing, by default | — see §8.2, open |

The session scope is load-bearing. Because a run is a single committed action, nothing accumulates inside a run; the accumulator that makes Loop and Grip reachable automatically lives one level up. **The scenario is the beat; the session is the sequence.**

### 2.5 Commit sequence

Commit is the only mutation in the product. It runs exactly once, synchronously, in this order:

1. Recompute the `ForecastBundle` (or take the memoised one — they are identical by construction).
2. Apply per-function deltas: `capacity -= cost`, `stress += dStress`, `pleasure = dPleasure`, `involvement = proposed`.
3. Recompute `HumanState` (§4).
4. Append beat `b5` (`commit`), then `b6` `b7` `b8` (`aftermath`), applying decay and capacity regeneration per beat (§3.6).
5. Evaluate the state machine **once** (§5). Never on a timer, never during hover.
6. Write a `RunRecord`.
7. Route to S9.

---

## 3. Simulation rules

All constants below are **invented defaults chosen to make the mechanic legible in a short session**. None is derived from typological theory. They are tuning surface. This is stated on `D3.svg` as well, so nobody later mistakes them for doctrine.

### 3.1 Rank profile

```js
export const RANK_PROFILE = {
  dom:  { capacity: 100, cost: 0.55, stress: 0.60, pleasure: 1.35, decay: 1.30, weight: 0.40 },
  aux:  { capacity:  85, cost: 0.75, stress: 0.80, pleasure: 1.10, decay: 1.00, weight: 0.27 },
  tert: { capacity:  55, cost: 1.25, stress: 1.25, pleasure: 0.85, decay: 0.75, weight: 0.19 },
  inf:  { capacity:  35, cost: 1.90, stress: 1.80, pleasure: 0.50, decay: 0.55, weight: 0.14 },
};
export const TOTAL_CAPACITY = 275;   // sum of the four
```

`weight` sums to exactly 1.00 and is the rank-weight vector used by three of the four aggregation rules.

### 3.2 Relation multipliers

An action's `mandates` are matched against each function's predisposition to yield a `Relation`:

```js
export const STRESS_REL   = { serves: 0.45, neutral: 1.00, defers: 1.35, violates: 1.80 };
export const PLEASURE_REL = { serves: 1.60, neutral: 1.00, defers: 0.55, violates: 0.15 };
```

Doing what a function wants is cheap and pleasant; doing what it objects to is expensive and joyless. Deferring — the classic "I'll deal with it later" — is priced above neutral, because suppression is not free. Every deck must contain at least one suppressive option, priced honestly.

### 3.3 Routing — demands for a function you do not carry

An action's `signature` may name any of the eight. Resolve each named function against the stack:

```
1. carried              → target = itself,                  penalty 1.00
2. axis partner carried → target = AXIS[fn]  (Te → Ti)      penalty 1.35
3. same klass carried   → target = that judge / perceiver   penalty 1.60
4. otherwise            → target = dominant                 penalty 1.90
```

Then renormalise the routed signature so it sums to 1 across the carried four.

Routing is not a block. The job still gets done — in the receiving function's manner, with the receiving function's register in the stream, at a surcharge. This is what implements *same job, different method, different bill*. Mark `FunctionState.routedInto` and show the `ROUTED WORK` badge (`S5.svg`, callout 10). Itemise the surcharge separately in the receipt (`S9.svg`, callout 11).

### 3.4 The per-function kernel

One pure call per carried function. No shared mutable state between the four calls, so they are order-independent and individually memoisable. This constraint is what allows the entire forecast to be cached by `(actionId, stateHash)`.

```js
function kernel(fn, state, action, scenario, machine, routed) {
  const R     = RANK_PROFILE[state.rank];
  const SM    = STATE_MULT[machine][state.rank];
  const share = routed.share[fn];                 // sums to 1 over the four
  const gate  = scenario.resolvedGates[fn];       // clamped [0.6, 1.8]
  const rp    = routed.penalty[fn];               // 1.00 if nothing was routed here
  const rel   = relationOf(action.mandates, scenario.predispositions[fn]);
  const aff   = scenario.predispositions[fn].affinity;

  const cost      = 100 * action.intensity * share * R.cost     * gate * rp * SM.cost;
  const dStress   = 100 * action.intensity * share * R.stress   * gate * STRESS_REL[rel]   * SM.stress
                  + debtPenalty(state);
  const pleasure  = 100 * action.intensity * share * R.pleasure * aff  * PLEASURE_REL[rel] * SM.pleasure;
  const rawWeight = Math.pow(share, 0.85) * aff * SM.bias;      // normalised in §3.5

  return { cost, dStress, pleasure, rawWeight, rel, routed: rp > 1 };
}

const debtPenalty = (s) => 0.4 * Math.max(0, -s.capacity);
```

Clamps: `cost >= 0`; `stress` clamped to `[0, 100]` after application; `pleasure` clamped to `[0, 100]`.

### 3.5 Involvement normalisation — the only cross-function step

```js
const total = FOUR.reduce((a, f) => a + raw[f], 0);
FOUR.forEach(f => involvement[f] = raw[f] / total);   // sums to exactly 1
```

This is why the brief asks for "a ratio that reads as a whole", and why the involvement spine is one continuous bar rather than four independent meters. **State bias is applied inside `rawWeight`, before normalisation, never after.** Applying it after would let the four stop summing to 1 and would break the spine's central claim.

If `total === 0` (unreachable, since `share` sums to 1 and `affinity > 0`), fall back to the rank weight vector.

### 3.6 Stress decay, capacity regeneration, debt

Per beat, not per second. Beats are the clock (§6.1).

```js
const BASE_DECAY = 6;   // points of stress per beat at decay 1.0

stress[f] -= BASE_DECAY * RANK_PROFILE[rank].decay * STATE_DECAY[machine][rank];
```

```js
export const STATE_DECAY = {
  balanced: { dom: 1.0,   aux: 1.0,  tert: 1.0,  inf: 1.0  },
  strained: { dom: 0.7,   aux: 0.7,  tert: 0.7,  inf: 0.7  },
  loop:     { dom: -0.35, aux: 0.0,  tert: -0.35, inf: 0.5 },   // negative = accrual
  grip:     { dom: 0.0,   aux: 0.0,  tert: 0.0,  inf: -0.50 },
  recovery: { dom: 1.6,   aux: 1.6,  tert: 1.6,  inf: 1.6  },
};
```

Negative decay is what makes a loop self-reinforcing rather than merely lopsided: the two looping functions *accrue* while the bypassed one neither spends nor recovers.

Capacity regeneration per beat: `+3` in Balanced, `+2` in Strained, `0` in Loop and Grip, `+5` in Recovery.
Debt repayment: `2` per beat, **in Recovery only**. Debt never self-clears, which is why Recovery takes beats rather than a click.

### 3.7 State multipliers

```js
export const STATE_MULT = {
  balanced: ALL({ cost: 1.00, stress: 1.00, pleasure: 1.00, bias: 1.00 }),
  strained: ALL({ cost: 1.15, stress: 1.15, pleasure: 0.85, bias: 1.00 }),
  loop: {
    dom:  { cost: 0.85, stress: 1.25, pleasure: 1.15, bias: 1.50 },
    aux:  { cost: 0.10, stress: 1.00, pleasure: 0.15, bias: 0.12 },
    tert: { cost: 0.90, stress: 1.30, pleasure: 1.10, bias: 1.50 },
    inf:  { cost: 1.00, stress: 1.10, pleasure: 0.60, bias: 0.90 },
  },
  grip: {
    dom:  { cost: 1.60, stress: 1.10, pleasure: 0.30, bias: 0.45 },
    aux:  { cost: 1.30, stress: 1.10, pleasure: 0.40, bias: 0.70 },
    tert: { cost: 1.30, stress: 1.20, pleasure: 0.40, bias: 0.60 },
    inf:  { cost: 0.70, stress: 1.90, pleasure: 1.40, bias: 3.20 },
  },
  recovery: ALL({ cost: 1.25, stress: 0.70, pleasure: 0.80, bias: 1.00 }),
};
```

Note two deliberate asymmetries:

- **Loop `aux.cost = 0.10`.** A bypassed function is cheap *and* useless. Both must be true, or the row reads as "no data" rather than "deliberately skipped".
- **Grip `inf.cost = 0.70`, `inf.pleasure = 1.40`.** The hijacking function fires *readily* and pays real short-term pleasure. If a grip were expensive and joyless in the moment, nobody would ever spiral, and the mechanic would teach nothing.

### 3.8 Likelihood — "what would this psyche do unforced"

Every card shows odds. This is the probability claim in the product thesis, made visible.

```js
const u = (a) => -(totalCost(a) + totalStress(a) - totalPleasure(a));
const T = 22;                                   // softmax temperature
odds[a] = exp(u(a)/T) / Σ exp(u(b)/T) over the deck;
```

The user may always override the argmax. That override — forcing the ISTP to do the ENTJ thing — is the pedagogical payload, and the receipt measures it against the forecast it defied.

### 3.9 Generating alleviating and aggravating actions

Not hand-authored per scenario. **Derived from templates, with optional per-scenario overrides** in `scenario.stateActions[state]`.

```js
generateStateActions(machine, stack) → Action[]
```

| State | 2 × alleviate target | 2 × aggravate target |
|---|---|---|
| `loop` | the bypassed auxiliary | the looping pair (dom + tert) |
| `grip` | dominant + auxiliary | the inferior |

Template rules:

```js
ALLEVIATE = { intensity: 0.30, signature: { [target]: 0.80, [carrier]: 0.20 }, oddsMult: 0.35 };
AGGRAVATE = { intensity: 0.70, signature: { [target]: 0.70, [partner]: 0.30 }, oddsMult: 1.90,
              pleasureBonus: 1.80 };   // applied to the target function only
```

Copy comes from a per-function corpus (`RELIEF_VOICE[fn]`, `SPIRAL_VOICE[fn]`), roughly six titles each.

**The tone rule is load-bearing.** Alleviating actions must be written unglamorously — "Stand up. Move." — and carry low odds. Aggravating actions must be written attractively, as if they were relief — "Say the whole thing. All of it." — and carry high odds. If the destructive option looked destructive, the mechanic would teach nothing. The forecast is where the truth lives: high immediate pleasure on the target function, catastrophic energy and stress everywhere else.

Generated cards sort after authored ones, carry `origin: 'generated'`, and are tagged `ALLEVIATES` / `AGGRAVATES` on the card (`S7.svg` callouts 8 and 9, `S8.svg` callouts 7 and 8). Their hover and commit mechanics are identical to authored cards in every respect.

---

## 4. Aggregation — four function states into one human state

Rendered to the user in `S6.svg`, formulas and all. The model is not hidden; showing it is what makes the peak-weighted stress rule defensible rather than arbitrary.

Let `w = [0.40, 0.27, 0.19, 0.14]` (the rank weights from §3.1), indexed dom → inf.

### 4.1 Energy — a sum, then debt-taxed

```
E_human = Σ max(0, capacity_f)  −  1.5 · Σ |min(0, capacity_f)|
reported as a percentage of TOTAL_CAPACITY (275)
```

**A sum is correct here.** Jung's model is explicitly energetic and the supply is singular — libido is one reservoir with four draws, not four reservoirs. The debt tax at 1.5× encodes that borrowing costs more than it returns.

### 4.2 Stress — a peak-weighted blend, NOT a mean

```
S_human = 0.6 · max_f(stress_f)  +  0.4 · Σ w_f · stress_f
```

**Justification.** Stress is a bottleneck quantity, not an average one. One function at 90 while three sit at 10 is a person in serious trouble, not a person at 30 — and a mean would report 30. Three desirable properties hold:

- **Identity:** if all four are equal to *s*, the result is exactly *s* (`0.6s + 0.4s`). The measure never distorts a uniform state.
- **Monotonicity:** raising any function's stress raises the aggregate.
- **Boundedness:** the result never exceeds `max_f`, so the aggregate cannot exceed its worst part.

The alternatives were considered and rejected: a plain mean hides exactly the event the product exists to teach; a plain max discards the other three entirely and would make three moderately loaded functions indistinguishable from three idle ones; a p-norm has no identity property at reasonable *p* and is far harder to explain on screen. Show the discarded mean beside the real figure in S6 ("mean would read 30 — and lie"); it is the single clearest thing on that screen.

### 4.3 Pleasure — weighted mean, discounted by internal conflict

```
conflict = ( |p_dom − p_inf| + |p_aux − p_tert| ) / 200          // 0..1, across the two axes
P_human  = ( Σ w_f · pleasure_f ) · ( 1 − 0.55 · conflict )
```

**Justification.** Pleasure does not sum, because satisfactions conflict. Getting what Te wants at Fi's direct expense does not feel like 2×; it feels hollow. The conflict term is measured across the *axis pairs* (dom↔inf, aux↔tert) because those are the pairs the type algebra says are opposed. This produces the "I got what I wanted and it feels hollow" artifact, which is a feature: it is one of the most recognisable phenomena in the domain and it falls out of the model rather than being narrated.

### 4.4 Evenness — normalised entropy, replacing involvement

Involvement already sums to 1 per function, so the aggregate has nothing to add by summing it. It reports the vector's **spread** instead:

```
H = − Σ involvement_f · ln(involvement_f) / ln 4        // 0 ln 0 := 0
```

`1.0` = all four equally engaged (rare; reads as flow). Low = one function running the show — either a healthy dominant-heavy response or a grip, disambiguated by *which* function.

### 4.5 Impressions in / expressions out

```
in.novel        = Σ over {ne, se} ∩ stack:  involvement_f · intensity · gate_f
in.referential  = Σ over {ni, si} ∩ stack:  involvement_f · intensity · gate_f
out.visible     = Σ over judges with attitude 'e':  involvement_f · intensity · 1.00
out.internal    = Σ over judges with attitude 'i':  involvement_f · intensity · 0.35
```

The 0.35 factor is the whole point: an introverted judge concludes far more than it emits, so a psyche can take in a great deal and appear to do almost nothing. In Grip on an inferior *extraverted* function, `out.visible` becomes the largest figure of the session — the "that was not like you" event, drawn as two bars.

### 4.6 Ordering

Aggregation runs **after** per-function state is fully resolved and normalised, and state multipliers are applied **before** aggregation, never after. Aggregating first and then applying a state multiplier would double-count.

---

## 5. The state machine

Full diagram with all edges: `D3.svg`. Evaluated exactly once per commit, against session-cumulative load.

### 5.1 Transitions

| From → To | Condition | Hysteresis |
|---|---|---|
| Balanced → Strained | `S_human >= 55` | exits at 40 |
| Strained → Balanced | `S_human < 40 && debt === 0` | — |
| Strained → Loop | `loopPressure > 35 && involvement_aux < 0.08`, on **2 consecutive** commits | exits at share 0.18 |
| Loop → Strained | `involvement_aux >= 0.18` on a commit `&& stress_dom < 55` | — |
| Strained → Grip | `S_human >= 78 && capacity_dom <= 15 && relation(action, dom or aux mandate) === 'violates'` | exits at 62 |
| Loop → Grip | `loopHeldBeats >= 3 && S_human >= 85` | one-way |
| Grip → Recovery | `S_human < 62` | — |
| Recovery → Balanced | `S_human < 40 && debt === 0 && capacity_dom >= 30` | — |
| Recovery → Grip | `S_human >= 78` (relapse) | — |

```js
const loopPressure = (stress[dom] + stress[tert]) / 2 - stress[aux];
```

### 5.2 Invariants — do not break these

1. **Exactly one state at a time.** Grip supersedes Loop on entry; they never stack.
2. **Evaluated only on commit.** Not on a timer, not during hover. Evaluating during hover would make the forecast a lie.
3. **Every threshold has hysteresis**, with an entry/exit gap of at least 12 points. Without it, a vessel at the boundary flickers on every beat and a flickering state chip teaches nothing except that the simulation is nervous.
4. **Grip has exactly one exit: Recovery.** There is no direct Grip → Balanced edge at any threshold.
5. **Recovery cannot complete while debt is outstanding.**
6. **Manual states never auto-exit** and are always labelled.

### 5.3 Manual override

Any state may be forced from the control bar. A forced state:

- costs no beat and no energy to enter;
- is tagged `MANUAL` everywhere it is reported;
- **suppresses automatic evaluation** for as long as it is held;
- satisfies no automatic exit condition — committing an alleviating action inside a manual Loop lowers the numbers but does not leave the state;
- on toggle-off routes to **Recovery**, not to Balanced, so the wear it produced is still real.

That last rule is what keeps the override useful as a demonstration without turning it into a way to cheat the economy.

---

## 6. Presentation

### 6.1 The beat model

The seismograph x-axis is **beat index, not seconds**. Full argument on `D6.svg`; stated once here so it is not relitigated:

- A **wall-clock** axis makes hesitation expensive — a user comparing five cards carefully would accrue stress for reading, punishing exactly the behaviour the product wants. It also makes runs non-reproducible, which kills the S9 counterfactual: two receipts are comparable only if the clock did not differ between them.
- A **pure step** axis makes "live trace" and "real-time stream" false, and the instrument reads as a static chart.
- The **hybrid** keeps determinism where it affects the ledger (beats, costs, thresholds, replay) and spends animation only where it affects appearance (decay, jitter, the typing caret).

One run contributes exactly eight beats:

```
b1 b2 b3 b4    intake — the stimulus lands on each function, in stack order
   (dwell)     hover, compare; decay animates; NO beat advances
b5             ACTION — the committed action
b6 b7 b8       aftermath — impact, spend, settle
```

Intake beats mean the trace has meaningful history before the user has done anything, and that history teaches stack order for free.

### 6.2 Three timescales — only one is a clock

| Scale | Rate | What it drives |
|---|---|---|
| **Beat** | discrete, commit-driven | The x-axis. The ledger. Everything that is accounted for. |
| **Sub-beat** | 50 ms fixed accumulator, 20 fps | Decay display, deterministic jitter, the monologue caret. Appearance only — it never changes a number used for accounting. |
| **Transition** | 180–420 ms, one-shot | A meter moving, the forecast hardening, the Grip height swap. Never looping, never ambient. |

Under `prefers-reduced-motion`, the sub-beat and transition scales are suppressed entirely: beats land instantly, no jitter, no typing. Values still change; only the animation stops.

### 6.3 Layout constants

From `S3.svg` and `S5.svg`. Viewport 1440 × 900; all values in CSS px at that width.

```
scenario envelope      16, 14, 1408 × 872, 2.5px border   (a literal container, not a header)
envelope header        94 tall
function rows          x 32, w 1028, heights [186, 156, 122, 100], 4px gaps → y 120..696
involvement spine      x 1070, w 26, y 120, h 576
action rail            x 1108, w 300, y 120..696
whole-human band       x 32, w 1376, y 706, h 80
control bar            x 32, w 1376, y 796, h 76

row column offsets (relative to row x, row width 1028)
  identity gutter      12 .. 144
  expression stream    156 .. 488
  seismograph          500 .. 796
  scalar cluster       808 .. 956
  forecast delta       956 .. 1024      (reserved, empty at rest)

NOW rule               72% of every seismograph's width, everywhere in the product
reserved forecast band the remaining 28%, empty at rest
glyph slot             32 / 28 / 24 / 22 px by rank; bottom-left of the identity gutter
function label         30px, directly above the glyph — roughly 1.5× the glyph box cap height
```

**Row height is rank.** Nothing else encodes it, and colour never does. Under Grip, the dominant and inferior rows swap height allocations (100 ↔ 186) while their vertical order and rank labels stay put — so the labels end up visibly out of order with the sizes. That mismatch is the readout: the stack has not been reordered, it has been overpowered.

### 6.4 Fidelity tiers

Density is solved by **removing components at lower tiers, never by rendering the same component smaller.** A 6px stream line is unreadable and dishonest; a removed stream line is honest.

| Tier | Default for | Stream lines | Seismograph | Meters | Delta gutter | Glyph |
|---|---|---|---|---|---|---|
| FULL | dominant, or any focused row | 5 | 104px | labelled | 4 deltas | 32px |
| MID | auxiliary | 3 | 84px | labelled | 4 deltas | 28px |
| LOW | tertiary, inferior | 2 | 58 / 46px | unlabelled | 2 deltas (stress, energy) | 24 / 22px |
| BYPASSED | the starved auxiliary in Loop | 1, stalled | flatlined | frozen | "not consulted" | unchanged |

Tier is derived, not configured:

```js
tier(fn) = focused(fn)                       ? 'FULL'
         : machine === 'loop' && rank==='aux' ? 'BYPASSED'
         : machine === 'grip' && rank==='inf' ? 'FULL'
         : machine === 'grip' && rank==='dom' ? 'MID'
         : DEFAULT_TIER[rank];
```

Labels are also dropped automatically on any row shorter than 130px, which is what keeps the Grip-demoted dominant legible at 100px.

### 6.5 The forecast/record distinction — carried without colour

Three redundant channels, none of them hue:

1. **Position.** Forecast lives strictly right of NOW, in a band that is permanently reserved and empty at rest. Nothing committed is ever drawn there.
2. **Ink.** Committed is solid; forecast is dashed and hatched.
3. **Container.** The projected stream line is boxed and offset, never merged into the stream.

On commit, the band's contents translate left across NOW and harden from dashed to solid. That single motion is the product's central metaphor made literal — a projection becomes a record by crossing the line — and the user watches it happen.

### 6.6 Accessibility

- Function identity is carried by **position, two-letter label, glyph shape, and rank text** — four channels, none of them colour. The eight glyph stand-ins in the wireframes are deliberately distinct in silhouette for exactly this reason.
- Signed deltas always print an explicit `+` or `−`. Direction is never implied by bar direction alone.
- Every action card is a real `<button>`; the rail is a `role="radiogroup"` with roving tabindex.
- Each seismograph carries an `aria-label` naming the current level and trend ("stress 26, rising over the last three beats"). The trace itself is `aria-hidden`. See §8.6 — the full non-visual representation is an open question.
- State transitions announce via a polite live region: "Loop. Auxiliary bypassed."

---

## 7. Component tree

Matches `D5.svg`. No framework: a *component* is a factory that builds a DOM subtree once and returns `{ el, update(state), destroy() }`. **Nothing re-creates nodes after mount.**

```
PlaygroundRun                          { session, scenario, deck, candidate }
├── ScenarioEnvelope                   { scenario, vessel, machine, margins }
│   └── MarginMeters                   { toLoop, toGrip, forecast? }
├── LedgerRows
│   └── ReactionWindow × 4             { fn, rank, tier, state, forecast|null, onFocus }
│       ├── IdentityGutter             { fn, rank, tier, glyphSize, badge? }
│       │   └── GlyphSlot              { engine, size, params }
│       ├── ExpressionStream           { lines, maxLines, projected?, reducedMotion }
│       ├── Seismograph                { series, forecast?, height, nowFrac: 0.72, viewport }
│       ├── ScalarCluster              { pleasure, involvement, capacity, deltas?, labelled }
│       └── DeltaGutter                { deltas?, attribution? }
├── InvolvementSpine                   { shares, proposedShares?, rowHeights }
├── ActionRail                         { deck, candidateId, onHover, onCommit }
│   └── ActionCard × n                 { action, odds, routedNote?, axis?, hovered }
├── WholeHumanBand                     { human, forecast?, expanded }
│   └── AggregateApparatus             { human, constituents, vesselFigure }   // expanded only
└── ControlBar                         { machine, manual, scope, onToggle, onReset }
```

Shared, not owned by any component:

| Service | Contract |
|---|---|
| `BeatScheduler` | **One** `requestAnimationFrame` loop for the entire page, with a fixed 50 ms accumulator. Every window subscribes; **no component owns a timer.** |
| `HistoryLayer` | **One** canvas element carrying five viewports (4 rows + aggregate). Repainted only when a beat lands. |
| `ForecastLayer` | **One** canvas element, five viewports, stacked above `HistoryLayer`. The only canvas a hover repaints. |
| `ForecastCache` | `Map` keyed by `` `${actionId}:${stateHash}` ``. Invalidated on commit and on state transition only. |
| `GlyphEnginePool` | Eight engines instantiated once, shared by every window and by the aggregate. |
| `TextCorpus` | Authored lines keyed per §8.4. Loaded with the scenario. |

`Seismograph` owns no elements — it holds a viewport rectangle in each shared layer. Ten canvases driven by five independent rAF loops is the specific failure mode this arrangement prevents.

**The mount rule.** A `ReactionWindow` is built once per scenario run and updated thereafter. Tier changes toggle a class and hide children; they never rebuild them. The consequence is worth stating plainly: **a Grip promotion is a class change plus two height writes**, and the DOM node count of the Playground is constant from mount to unmount.

---

## 8. Render and performance

### 8.1 Budgets

| Event | Main-thread budget | What may repaint |
|---|---|---|
| Hover / candidate change | **≤ 2 ms** | `ForecastLayer` only (1 `clearRect`, ~5 paths), ~40 `textContent` writes, ~12 `transform` changes |
| Beat | **≤ 6 ms** | `HistoryLayer` five viewports, one stream line promoted, meters transitioned |
| Sub-beat tick (20 fps) | **≤ 1 ms** | last 3 columns of each history viewport, caret |
| State transition | one reflow permitted | The Grip height swap is the **only** intentional layout change in the product |
| Commit | one reflow permitted | Everything |

### 8.2 What a hover must not touch

Committed history · the beat ring buffer · trace paths left of NOW · monologue DOM · any row's layout.

**If a hover ever causes a reflow, the screen is being rebuilt rather than annotated**, and the implementation has gone wrong. Enforce with a dev-mode `PerformanceObserver` on `layout-shift` plus a counter asserted to zero across a hover.

### 8.3 Techniques

- Meter bars use `transform: scaleX()`, never `width`, so they stay off the layout path.
- Numeric readouts are `textContent` writes into pre-mounted nodes. No `innerHTML` anywhere in the run loop.
- `ExpressionStream` recycles a fixed pool of six DOM nodes and never grows the document.
- Typing is a CSS-driven caret, not a per-character timer.
- Canvas is DPR-aware, capped at 2.
- All randomness is seeded (`mulberry32`, already the house convention). Every run is replayable, which the S9 counterfactual depends on.

### 8.4 Memory

| | |
|---|---|
| On screen | 20 beats (S3 rows), 64 beats (S5, S6) |
| In memory | 256 beats per function, ring buffer — `5 × Float32Array(256)` ≈ **5 KB**, allocated once at mount, never grown |
| Summarised | runs older than the last four collapse to one beat each (min, max, mean, drawn as a vertical extent) |
| Kept in full | the run log — action, receipt, transition — because S9 counterfactuals need it. Not part of the ring buffer. |

---

## 9. Open questions, and what was invented

### 9.1 Invented, not derived

Everything numeric in §3, §4 and §5 was chosen to make the mechanic legible within a short session. Specifically invented:

- All of `RANK_PROFILE`, `STATE_MULT`, `STATE_DECAY`, `STRESS_REL`, `PLEASURE_REL`, `BASE_DECAY`.
- The **eight-beat run structure** (4 intake, 1 commit, 3 aftermath).
- The **peak-weighted stress blend** — the 0.6/0.4 split is a design choice; only the three properties in §4.2 are argued for.
- The **conflict discount on pleasure**, including measuring conflict across axis pairs and the 0.55 coefficient.
- **Evenness** (normalised entropy) as the aggregate's stand-in for involvement.
- The **routing penalty tiers** (1.35 / 1.60 / 1.90).
- The **softmax temperature** of 22 for likelihood.
- The **0.35 emission factor** for introverted judges.
- Every threshold and hysteresis gap in §5.1.

None is doctrine. All are tuning surface. `D3.svg` says so on the diagram itself.

### 9.2 Open — persistence

Should a vessel survive a page reload? Session persistence is what makes Loop and Grip reachable automatically; losing it on refresh may feel like data loss. Against: a persisted grip is a hostile thing to return to, and there is no current storage layer. **Recommendation:** persist to `sessionStorage` (survives reload, dies with the tab) and offer Reset prominently on restore. Not decided.

### 9.3 Open — Loop on non-dom/tert pairs

This spec assumes a Loop is always dominant + tertiary with the auxiliary bypassed, matching the standard formulation and `loopPair` in `src/playground/types.js`. Aux–inferior loops are described in some of the literature. Assumed out of scope; if added, the involvement spine and the D3 conditions both generalise without structural change.

### 9.4 Open — the text corpus is the real cost

Keying stream lines by `(scenario, function, action, state)` gives, per scenario, `4 functions × 9 actions × 5 states ≈ 180` lines, plus 20 intake lines. At three scenarios that is roughly 600 authored lines, and it grows multiplicatively with every new scenario.

**Recommendation:** key by `(function, relation, state)` with per-action overrides:

```
TextCorpus = {
  [fn]: { [relation]: { [state]: string[] } },        // 8 × 4 × 5 = 160 lines TOTAL, reused everywhere
  overrides: { [scenarioId]: { [actionId]: { [fn]: string } } }   // authored only where memorable
}
```

That reduces the baseline from ~600 lines per three scenarios to 160 lines total, and confines per-scenario authoring to the handful of lines worth writing by hand. **This is a recommendation, not a decision** — it trades specificity for tractability, and someone should judge whether the generic lines read as generic.

### 9.5 Open — should alleviate/aggravate ever be authored?

§3.9 generates them from templates. A hybrid is specified (`scenario.stateActions`) but never exercised. Open whether the templated versions are good enough in practice, or whether the two most important cards on the most important screen deserve hand-writing per scenario.

### 9.6 Open — non-visual representation of a live trace

Each seismograph gets an `aria-label` naming level and trend, which is a floor, not a solution. A live simulation with twenty simultaneous signals has no obvious screen-reader form. Options not yet evaluated: a text-only "what just happened" log per beat; sonification of the aggregate trace; a fully tabular alternate view. **This needs a dedicated pass and it is not a visual-design problem** — it is a structural one that this document has not solved.

### 9.7 Open — does a single-action run feel like enough?

M2 fixed the run at one committed action, which makes the receipt sharp and the counterfactual clean, but it puts the entire burden of "this was worth doing" on S9. If playtesting shows runs feel thin, the fix is *not* to add actions inside a run — it is to strengthen the counterfactual, because comparison is the product's actual thesis.

---

## 10. Deferral register

Nothing should fall between the phases, so both lists are enumerated.

### 10.1 Deferred to the visual-design phase (next)

Colour assignment and the function/axis palette mapping · type scale and font selection · the rendered glyph artwork (this document specifies only slot, size, and precedence) · motion curves and easing within the stated envelopes · texture and depth treatment · the visual language for Loop and Grip beyond "hatch and rewrite" · iconography for alleviate/aggravate · tone of voice for empty and error states · the visual treatment of the Vessel figure in S1 and S6.

### 10.2 Deferred to implementation

Exact tick tuning inside the §6.2 envelope · canvas versus DOM for the monologue caret · the persistence layer (§9.2) · keyboard shortcut assignment · the concrete text corpus (§9.4) · scenario authoring tooling · the adapter details in §1.9.

### 10.3 Decided here, binding on both later phases

The beat model (§6.1) · one-commit runs with session-level accumulation (§2.4) · the aggregate as a persistent expandable band, never a tab (§7) · the involvement spine as the primary answer to "who is running this?" · the permanent forecast-band reservation (§6.5) · the aggregation formulas (§4) · the state machine and its invariants (§5) · fidelity tiering as the density strategy, with the rule that lower tiers remove components rather than shrink them (§6.4) · row height as the sole encoding of rank (§6.3) · the purity of hover (§2.1).

---

## Appendix — file index

| File | What it is |
|---|---|
| `00-BRIEF.md` | Why the layout is what it is. Failure analysis, the three glance questions, three layout strategies, the recommendation and its cost. |
| `S1.svg` – `S10.svg` | Wireframes, each with numbered callouts and a legend giving behaviour at rest, on hover, on commit, and under loop/grip. |
| `D1.svg` – `D6.svg` | Screen map, user flow, state machine, hover data flow, component hierarchy, timing model. |
| `wireframe-src/` | The generator. `node wireframe-src/gen.mjs` re-emits all sixteen SVGs. Edit the source, not the SVGs — they are build output. |

Worked type throughout: **ISTP** (Ti / Se / Ni / Fe). Worked scenario throughout: **The Credit Thief**.
