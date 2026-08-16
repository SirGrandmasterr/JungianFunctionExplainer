/* ============================================================
   CURRENTS · Playground — the scenario deck
   Three at launch, deliberately spread across the hook space so
   that the same Vessel behaves unrecognizably between them:
   one values-charged and public, one a sensory emergency, one
   with no audience at all where the interior does every bit of
   the work.
   ============================================================ */
import { CREDIT_THIEF } from './credit-thief.js';
import { KITCHEN_FIRE } from './kitchen-fire.js';
import { THE_OFFER } from './the-offer.js';

export const SCENARIOS = [CREDIT_THIEF, KITCHEN_FIRE, THE_OFFER];
export const byId = (id) => SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
