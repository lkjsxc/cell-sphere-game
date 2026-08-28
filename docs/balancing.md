# Balancing

Balance is measured with production `RunController` cohorts, fixed seed sets,
and explicit external budgets. An exhausted audit budget is incomplete and
reward-free; it is never converted into an extinction.

## Current measured development cohort

The 2026-08-28 eight-seed smoke measurement records, rather than promises:

- fresh lifetime 107.4–155.4 game seconds, with p25/median/p75
  121.1/131.7/137.9;
- fresh peak REACH median 4.294%;
- fresh final Environment Level median 1;
- fresh SCORE median 154,451 and Echoes median 17;
- two resource-exhaustion and six maintenance-starvation outcomes;
- the foundation fixture outlived fresh on all eight paired seeds, with a
  156.1-second median;
- scarcity, first-visible Luminous, and mature fixture medians of
  206.3/144.5/209.8 game seconds.

At the nominal new 1× rate, the fresh median implies 32.9 foreground seconds
before browser overhead. That division is a pacing implication, not observed
browser survival duration. Browser pacing is measured separately.

The completed ecology retune is current authority. Autonomous World Feel v1 did
not change simulation constants, Evolution effects, Environment schedules,
scoring, or seed sets. It rebased wall-clock presentation so a slow foreground
rate is no longer mistaken for game-time balance. No finite Evolution build may
be immortal; any future balance change requires development and holdout cohorts
plus multi-World campaign evidence.

## Commands

```bash
npm run balance:smoke
npm run balance:holdout
npm run audit:environment-levels
npm run audit:campaign
```

Reports include distributions, causes, SCORE/Echoes, and Environment peaks.
