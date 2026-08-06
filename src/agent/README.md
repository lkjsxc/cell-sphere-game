# Agent play

This directory is the fair, production-backed campaign boundary. It runs the
same `RunController`, Evolution/challenge compilers, SCORE v4, result/frontier
transactions, meta schema 11, History schema 6, Trophy evaluator, and replay/run
protocol 5 used by the browser; it is not a simplified simulator.

## Sources of truth

- `environment.js`: validated actions and exactly-once world, reward, purchase,
  retry, and Environment-frontier transactions.
- `observation.js`: fair observation schema 2 and curated Result projection.
- `schema.js`: bounded agent-save schema 2, production-document validation, and
  deterministic save hash.
- `policies.js`: deterministic policies that consume observations only.

Observation exposes current Environment/frontier/pressure, canonical exact and
formatted Echoes/Potential/SCORE, all 252 cell levels/costs/eligibility/previews,
affinity breadth/depth, Build mastery, habitats, Trophies, and completed public
world evidence. It excludes future seeds/events, RNG/replay authority, raw arrays,
hidden maps, and diagnostics. Exact progression crosses JSON as canonical decimal
strings.

Fair policy actions observe, set goals, buy one Evolution level, run/advance or
retry an allowed Environment Level, and inspect Result/Builds. Import, export,
and reset are separate administrative persistence calls that policies and
tournaments cannot consume. Every state-changing action carries exact expected
revision/level or world ordinal; observations, curated Results, and the mixed
seed schedule do not reveal later seeds. Worlds remain
autonomous; active Adaptations are retired. Canonical gates are `agent:smoke`,
`agent:campaign`, `agent:long`, and `balance:holdout`.
