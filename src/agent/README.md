# Agent play

This directory exposes a fair, production-backed campaign boundary over the
same `RunController`, Environment schedule/profile/exposure, Evolution, SCORE,
History, Trophy, and result transaction authority used by the browser.

- `environment.js`: start a Level-0 World, advance bounded ticks, continue under
  an explicit external budget, buy Evolution, inspect, export, and reset. Static
  Environment selection and retry actions are rejected.
- `observation.js`: v9 player-visible projection. It includes live Level and
  schedule progress, normalized current pressure percentages and profile
  identity, exposure, achieved best, resources, REACH, Luminous charge, and
  a bounded set of exact Evolution-cell candidates. Candidate route evidence is
  limited to public direct neighbors, root distance, and seven shortest domain
  hop counts computed once from the visible topology/layout; it never includes
  future Levels or seeds, RNG, raw ratings, internal coefficients, typed arrays,
  or layout-generator state.
- `schema.js`: bounded agent-save v7 validation and deterministic save hash.
- `policies.js`: deterministic policies that consume observations only.

`incomplete-budget` is reward-free and does not create a completed world record.
Worlds remain autonomous; agents receive no mid-run ecological intervention.
