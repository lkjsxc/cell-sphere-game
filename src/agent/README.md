# Agent play

This directory exposes a fair, production-backed campaign boundary over the
same `RunController`, Environment schedule/profile/exposure, Evolution, SCORE,
History, Trophy, and result transaction authority used by the browser.

- `environment.js`: v3 actions. Start a Level-0 world, advance bounded ticks,
  continue under explicit external budget, buy Evolution, inspect/export/reset.
  Static Environment selection/retry actions are rejected.
- `observation.js`: v4 player-visible projection. It includes live level,
  schedule progress, current/next pressure profiles, interpolation/effective
  coefficients, exposure, achieved best, builds, resources, Reach, charge,
  active events, and exact Evolution state; never future events/seeds,
  RNG, raw arrays, or hidden maps.
- `schema.js`: bounded agent-save v4 validation and deterministic save hash.
- `policies.js`: deterministic policies that consume observations only.

`incomplete-budget` is reward-free and does not create a completed world record.
Worlds remain autonomous; agents receive no mid-run ecological intervention.
