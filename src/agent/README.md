# Agent play

This directory exposes a fair, production-backed campaign boundary over the
same `RunController`, Environment schedule/profile/exposure, Evolution, SCORE,
History, Trophy, and result transaction authority used by the browser.

- `environment.js`: start a Level-0 World, advance bounded ticks, continue under
  an explicit external budget, buy Evolution, inspect, export, and reset. Static
  Environment selection and retry actions are rejected.
- `observation.js`: v7 player-visible projection. It includes live Level and
  schedule progress, normalized current pressure percentages and profile
  identity, exposure, achieved best, resources, REACH, Luminous charge, and
  exact Evolution state; never future Levels or seeds, RNG, raw ratings,
  internal coefficients, typed arrays, or hidden maps.
- `schema.js`: bounded agent-save v6 validation and deterministic save hash.
- `policies.js`: deterministic policies that consume observations only.

`incomplete-budget` is reward-free and does not create a completed world record.
Worlds remain autonomous; agents receive no mid-run ecological intervention.
