# Fair agent play

The development-only agent environment is a deterministic, production-backed
campaign boundary, not a second simulator. It uses the browser's Evolution and
Environment compilers, `RunController`, SCORE v4, result/frontier transactions,
meta schema 11, History schema 6, Trophy evaluation, and replay/run protocol 5.

## Commands

```bash
npm run agent:play -- observe --save reports/agent-save.json
npm run agent:play -- run --save reports/agent-save.json
npm run agent:play -- buy --cell reach-horizon-instinct --save reports/agent-save.json
npm run agent:play -- reset --seed 123 --save reports/agent-save.json
npm run agent:play -- --stdio --save reports/agent-save.json
npm run agent:smoke
npm run agent:campaign
npm run agent:long
npm run balance:holdout
```

Standard-input mode accepts one JSON action per line and emits one JSON response
per line. Protocol output stays on stdout; load/parse errors go to stderr. Save
writes use a same-directory temporary file, `fsync`, and atomic rename. Generated
saves, traces, and tournament reports belong under ignored `reports/`.

## Protocol v2

Observation schema 2 exposes only player-visible current facts:

- next world ordinal, recommended Environment Level, highest frontier, and the
  public bounded pressure summary/hash;
- exact and formatted Echoes, SCORE version/best, World Potential v3, affinity
  breadth/depth, and Evolution defense;
- all 252 Evolution cells with exact current/next level, next cost, ownership,
  adjacency/eligibility reason, preview, mastery contribution, and neighbors;
- Build activation/mastery, habitats, current goals, Trophy summary, and a curated
  completed Result with resources, pressure, Reach, transformations, and charge.

It excludes campaign/future seeds, future event schedules, RNG state, replay
commands/hashes used as authority, raw typed arrays, hidden maps, and diagnostics.
All exact progression fields cross the JSON boundary as canonical decimal strings.

Actions are `observe`, `buy-evolution-level`, `run-world`,
`retry-environment-level`, `inspect-last-result`, `inspect-builds`, `export`,
`set-goal`, and `reset`; `buy-skill` remains only a narrow compatibility alias.
A buy raises one cell by one level, debits one exact cost, and requires expected
level/meta revision so stale or repeated commands cannot double-purchase. Run and
retry actions likewise require expected meta revision/world ordinal. A run may
advance only to the recommended unlocked frontier; retry keeps the same
Environment Level and consumes the next deterministic world seed. Every response
includes acceptance, a stable reason, updated observation, and deterministic
campaign hash; completed worlds also include the curated Result.

Agent save schema 2 is deliberately separate from browser persistence. It stores
validated meta/History, selected goal, bounded last Result, campaign seed, world
ordinal, and reproducible hash. The campaign seed exists only in the explicit
persistence/export container; observations and curated Results omit it, and
policies/tournaments cannot invoke or consume that administrative path. The
one-way mixed run-seed schedule prevents a completed seed from revealing later
ones. Import validates embedded documents with production
validators and never grants access above the unlocked Environment frontier.

## Policies and evidence

Policies consume observation schema 2 only. The current set includes balanced,
breadth-first, depth-first, cheapest, marginal-value, diversity, weak control,
sustainability, freshwater, scarcity/reclamation, cryogenic, marine, Luminous
infrastructure, terraforming, REACH 100, harshness pushing, conservative retry,
and deterministic random-legal strategies. Worlds remain autonomous; no policy
chooses cells during a run and retired Adaptations are never actions.

`scripts/agent-play.mjs` is the canonical multi-world decision loop.
`scripts/agent-tournament.mjs` supplies deterministic training/holdout cohorts,
ordering, bounded traces, and reports. `agent:long` exercises long purchase
cadence and `balance:holdout` keeps evaluation seeds untouched. Reports must state
cohort sizes/seeds and distinguish observed outcomes from modeled expectations.
