# Agent play

This directory is the fair, production-backed campaign boundary for development
agents. `environment.js` runs the same `RunController`, Evolution compiler and
purchase transaction, SCORE/result transaction, History validators, Trophy
facts/evaluator, meta migration, and seed authority used by the browser.

The observation is an explicit allowlist. It contains public progression and a
curated completed Result, but never the campaign seed, next-world seed, event
schedule, RNG/replay data, simulation arrays, or diagnostics. Agent save schema
1 is deliberately separate from browser persistence.

- `environment.js`: validated actions and exactly-once world transactions.
- `observation.js`: fair schema 1 and pre-affinity compatibility mapping.
- `policies.js`: deterministic policies that consume observations only.
- `schema.js`: bounded agent save, migration validation, and state hash.

Worlds remain autonomous. Policies choose Skills and goals between worlds; they
do not direct cells during a run.
