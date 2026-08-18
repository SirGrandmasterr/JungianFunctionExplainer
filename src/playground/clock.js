/* ============================================================
   CURRENTS · Playground — the one clock
   BUILD-SPEC §6.2, §7. ONE requestAnimationFrame loop for the
   entire page, with a fixed 50 ms accumulator. Every component
   subscribes; no component owns a timer.

   Three timescales, and only one of them is a clock:
     BEAT       discrete, commit-driven. The ledger. The x-axis.
     SUB-BEAT   50 ms / 20 fps. Appearance only — decay display,
                jitter, the caret. Never changes a number used
                for accounting.
     TRANSITION 180–420 ms one-shots, CSS, suppressed under
                prefers-reduced-motion.
   ============================================================ */
import { REDUCED } from '../utils/dom.js';

const STEP = 50;          /* ms — the sub-beat tick */

export class Clock {
  constructor() {
    this.ticks = new Set();
    this.timers = new Set();
    this.acc = 0;
    this.last = 0;
    this.raf = 0;
    this.running = false;
  }

  onTick(fn) { this.ticks.add(fn); return () => this.ticks.delete(fn); }

  /**
   * Schedule a BEAT. Backed by setTimeout, not by the animation frame:
   * beats are simulation events, part of the ledger, and must not depend
   * on the page compositing. A backgrounded tab throttles them; it does
   * not strand the run with a locked action rail.
   * Under reduced motion the delay collapses to zero and beats land at once.
   */
  after(delay, run) {
    const id = setTimeout(() => {
      this.timers.delete(id);
      try { run(); } catch (e) { console.error('[playground] beat failed', e); }
    }, REDUCED ? 0 : delay);
    this.timers.add(id);
    return this;
  }

  clearQueue() {
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
  }

  /** The 20 fps sub-beat pass — appearance only, so rAF is exactly right
      and stopping while hidden is exactly what we want. */
  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (t) => {
      if (!this.running) return;
      const dt = Math.min(120, t - this.last);
      this.last = t;
      this.acc += dt;
      if (this.acc >= STEP) {
        const steps = Math.min(4, Math.floor(this.acc / STEP));
        this.acc -= steps * STEP;
        for (const fn of this.ticks) {
          try { fn((steps * STEP) / 1000); } catch (e) { console.error('[playground] tick failed', e); }
        }
      }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() { this.running = false; cancelAnimationFrame(this.raf); }
}

export const clock = new Clock();
