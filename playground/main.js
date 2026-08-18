/* ============================================================
   CURRENTS · Playground — page orchestrator
   Four routes: assembly → briefing → run → resolution.
   Everything else in the ten wireframed screens is a state or a
   disclosure of the run view, and none of them unmounts it.
   (docs/playground-rebuild/D1.svg)
   ============================================================ */
import '../src/styles/base.css';
import '../src/styles/playground-theme.css';

import { initHeader } from '../src/shared/header.js';
import { stackForCode, typeCode } from '../src/playground/types.js';
import { clock } from '../src/playground/clock.js';
import { Run } from '../src/playground/run.js';
import { Assembly } from '../src/playground/ui/assembly.js';
import { Briefing } from '../src/playground/ui/briefing.js';
import { RunView } from '../src/playground/ui/runview.js';
import { Resolution } from '../src/playground/ui/resolution.js';
import { SCENARIOS } from '../src/data/scenarios/index.js';
import { EPISTEMIC } from '../src/data/playground-data.js';

initHeader('playground');

const app = document.getElementById('app');
const epi = document.getElementById('epistemic');
if (epi && EPISTEMIC) epi.textContent = EPISTEMIC;

/* ---------- session-scoped state ---------- */
let run = null;
let runView = null;
let route = 'assembly';

const views = {};

function mount(el, name) {
  route = name;
  app.replaceChildren(el);
  document.body.dataset.route = name;
  location.hash = { assembly: 'build', briefing: 'brief', run: 'run', resolution: 'resolve' }[name];
  window.scrollTo({ top: 0, behavior: 'auto' });
}

/* ---------- S1 ---------- */
function goAssembly() {
  views.assembly = new Assembly({
    onDone: (stack) => { startVessel(stack); goBriefing(); },
  });
  mount(views.assembly.el, 'assembly');
}

function startVessel(stack) {
  if (runView) { runView.destroy(); runView = null; }
  run = new Run().build(stack);
  run.on('resolved', (rec) => goResolution(rec));
  window.__PG = run;          /* dev handle, matching the convention on every page */
}

/* ---------- S2 ---------- */
function goBriefing() {
  if (!views.briefing) {
    views.briefing = new Briefing({
      scenarios: SCENARIOS,
      onEnter: (raw) => { enterScenario(raw); },
      onRebuild: () => goAssembly(),
      onReset: () => { run.reset(); views.briefing.setSession(run.session, run.margins()); },
    });
  }
  views.briefing.setSession(run.session, run.margins());
  mount(views.briefing.el, 'briefing');
}

/* ---------- S3 / S4 / S7 / S8 ---------- */
function enterScenario(raw) {
  if (!runView) {
    runView = new RunView(run, {
      onBrief: () => goBriefing(),
      onReset: () => { run.reset(); goBriefing(); },
      onSwap: () => goAssembly(),
    });
  }
  run.enterScenario(raw);
  runView.refresh();
  mount(runView.el, 'run');
}

/* ---------- S9 ---------- */
function goResolution(record) {
  if (!views.resolution) {
    views.resolution = new Resolution({
      onNext: () => goBriefing(),
      onRest: () => {
        run.restBeat();
        views.resolution.render(record, run.session, run.scenario.raw, run.margins());
      },
      onReset: () => { run.reset(); goBriefing(); },
      onSwapTo: (code) => {
        const stack = stackForCode(code);
        if (!stack) return;
        const raw = run.scenario.raw;
        startVessel(stack);
        runView = null;
        enterScenario(raw);
      },
    });
  }
  views.resolution.render(record, run.session, run.scenario.raw, run.margins());
  mount(views.resolution.el, 'resolution');
}

/* ---------- the one clock ---------- */
clock.onTick((dt) => { if (route === 'run' && runView) runView.tick(dt); });
clock.start();

/* ---------- global keys ---------- */
addEventListener('keydown', (e) => {
  if (route !== 'run' || !run) return;
  if (e.key === 'Escape') run.setCandidate(null);
});

/* ---------- entry ---------- */
const deepType = new URLSearchParams(location.search).get('type');
const deepStack = deepType ? stackForCode(deepType) : null;
if (deepStack) { startVessel(deepStack); goBriefing(); }
else goAssembly();
