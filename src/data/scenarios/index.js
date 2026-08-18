/* ============================================================
   CURRENTS · Playground — the scenario deck
   Ten situations, ordered so the browser reads as a spread
   rather than a list. The deck is deliberately spaced across
   the hook space: audience 0 to 12, clocks from two seconds to
   none at all, and every one of the eight functions leading
   somewhere. Run `node tools/scenario-audit.mjs` after editing
   any of them — it lints the schema and then simulates the deck
   against all sixteen types.

   Which function leads each deck, by mean authored demand — as
   measured, not as intended:
     Fe   The Credit Thief · The Room Reads Wrong · The Repair
     Se   Flashpoint (2 seconds) · The Ridge (90 min) · The Long Wait
     Fi   The Offer
     Ti   The Handover
     Te   The Deadline That Moved
     Ne   The Open Afternoon

   NI AND SI LEAD NOTHING, and that is a finding rather than an
   oversight. A deck is a list of ACTIONS, and the introverted
   perceiving functions do not act — they receive. Ni's work in
   The Long Wait is real and continuous and corresponds to no
   button; the one card that does capture it ("work out what you
   will do in each case") cannot outweigh three cards about
   walking a corridor, because walking the corridor is what there
   is to do. Forcing the number would mean inventing actions the
   situation does not contain.

   The consequence is worth knowing when authoring: raising a
   function's GATE does not starve it, it just makes its work
   dearer for whoever does it — and the dominant still does it
   most cheaply. Starving a function means giving the deck no
   work for it at all.

   Cost spread runs 1.50x to 2.31x across the sixteen types, and
   every type is cheapest somewhere and dearest somewhere else.
   ============================================================ */
import { CREDIT_THIEF } from './credit-thief.js';
import { KITCHEN_FIRE } from './kitchen-fire.js';
import { THE_OFFER } from './the-offer.js';
import { THE_HANDOVER } from './the-handover.js';
import { OPEN_AFTERNOON } from './open-afternoon.js';
import { LONG_WAIT } from './long-wait.js';
import { THE_REPAIR } from './the-repair.js';
import { DEADLINE_MOVED } from './deadline-moved.js';
import { ROOM_READS_WRONG } from './room-reads-wrong.js';
import { THE_RIDGE } from './the-ridge.js';

export const SCENARIOS = [
  CREDIT_THIEF,
  KITCHEN_FIRE,
  THE_OFFER,
  THE_HANDOVER,
  DEADLINE_MOVED,
  ROOM_READS_WRONG,
  THE_REPAIR,
  LONG_WAIT,
  THE_RIDGE,
  OPEN_AFTERNOON,
];

export const byId = (id) => SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
