/* Emit ../S1..S10.svg and ../D1..D6.svg. Run: node gen.mjs */
import { writeFileSync } from 'node:fs';
import { page } from './lib.mjs';
import * as A from './screens-a.mjs';
import * as B from './screens-b.mjs';
import * as D from './diagrams.mjs';

const OUT = new URL('../', import.meta.url);

const SPECS = [
  { id: 'S1', title: 'Stack assembly / type selection', sub: 'Two choices, two entailments — a psyche is built, not picked from a list', w: 1440, h: 900, body: A.S1, legend: A.S1_LEGEND },
  { id: 'S2', title: 'Scenario browser and briefing', sub: 'Predispositions and cost gates stated in full, before anything is priced', w: 1440, h: 900, body: A.S2, legend: A.S2_LEGEND },
  { id: 'S3', title: 'Playground main view — resting state', sub: 'Strategy A “The Ledger”: rank-ordered rows + involvement spine + persistent aggregate band', w: 1440, h: 900, body: A.S3, legend: A.S3_LEGEND },
  { id: 'S4', title: 'Playground main view — mid-hover', sub: 'Hover = projection. Forecast overlays on all four rows, the spine, and the aggregate', w: 1440, h: 900, body: A.S4, legend: A.S4_LEGEND },
  { id: 'S5', title: 'One Reaction Window, expanded', sub: 'Every sub-component labelled, plus the three fidelity tiers side by side', w: 1440, h: 900, body: A.S5, legend: A.S5_LEGEND },
  { id: 'S6', title: 'Whole-Human aggregate view', sub: 'The band expanded in place — four function states become one human state', w: 1440, h: 900, body: B.S6, legend: B.S6_LEGEND },
  { id: 'S7', title: 'Loop active — ISTP Ti–Ni', sub: 'Dominant and tertiary firing, auxiliary bypassed, deck regenerated', w: 1440, h: 900, body: B.S7, legend: B.S7_LEGEND },
  { id: 'S8', title: 'Grip active — ISTP Fe grip', sub: 'Inferior hijack, row heights swapped, alleviate and aggravate cards on the deck', w: 1440, h: 900, body: B.S8, legend: B.S8_LEGEND },
  { id: 'S9', title: 'Post-action resolution', sub: 'What changed, what it cost, what comes next — and the same action billed to four other psyches', w: 1440, h: 900, body: B.S9, legend: B.S9_LEGEND },
  { id: 'S10', title: 'Narrow viewport — 390px', sub: 'Three scroll states. Accordion of four, rotated spine, docked aggregate, press-and-hold forecast', w: 390, h: 2460, body: B.S10, legend: B.S10_LEGEND, cols: 1, note: 'viewport 390 x 780 · 3 states' },
  { id: 'D1', title: 'Screen map / information architecture', sub: 'Four routes; six of the ten are states or disclosures of S3', w: 1440, h: 900, body: D.D1, legend: D.D1_LEGEND },
  { id: 'D2', title: 'Primary user flow', sub: 'Land, assemble, choose, forecast, commit, observe, state, recover or spiral, resolve', w: 1440, h: 900, body: D.D2, legend: D.D2_LEGEND },
  { id: 'D3', title: 'State machine', sub: 'Balanced · Strained · Loop · Grip · Recovery — entry, exit, hysteresis, manual overrides', w: 1440, h: 900, body: D.D3, legend: D.D3_LEGEND },
  { id: 'D4', title: 'Data flow for a single hover event', sub: 'Three inputs, one pure kernel per function, five readouts times four, one roll-up', w: 1440, h: 820, body: D.D4, legend: D.D4_LEGEND },
  { id: 'D5', title: 'Component hierarchy of one Reaction Window', sub: 'Vanilla ES modules — a component is a factory returning update(state)', w: 1440, h: 880, body: D.D5, legend: D.D5_LEGEND },
  { id: 'D6', title: 'Timing model for the seismograph', sub: 'The x-axis is beats. Beats come from commits, not from clocks.', w: 1440, h: 840, body: D.D6, legend: D.D6_LEGEND },
];

const FOOTER = 'Structure phase, grayscale by discipline. Colour, type scale, glyph artwork and motion curves are deferred to the visual-design phase; tick tuning, persistence and the text corpus are deferred to implementation. Both deferral lists are enumerated in 00-BRIEF.md section 5 and BUILD-SPEC.md section 9. Worked type: ISTP (Ti / Se / Ni / Fe). Worked scenario: The Credit Thief.';

let n = 0;
for (const s of SPECS) {
  const svg = page({
    id: s.id,
    title: s.title,
    subtitle: s.sub,
    note: s.note,
    w: s.w,
    h: s.h,
    body: s.body(),
    legendItems: s.legend,
    legendCols: s.cols || 2,
    footer: FOOTER,
  });
  writeFileSync(new URL(`${s.id}.svg`, OUT), svg, 'utf8');
  n++;
  process.stdout.write(`${s.id}.svg  ${(svg.length / 1024).toFixed(0)} KB\n`);
}
process.stdout.write(`\n${n} files written to ${OUT.pathname}\n`);
