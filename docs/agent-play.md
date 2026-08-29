# Fair agent play

The development-only agent environment is a deterministic projection of the
production simulation, not a duplicate simulator. It uses `RunController`,
Evolution, Environment schedule/profile/exposure, SCORE, current-only result
transactions, History, and Trophies.

## Commands

```bash
npm run agent:play -- observe --save reports/agent-save.json
npm run agent:play -- run --save reports/agent-save.json
npm run agent:play -- buy --cell reach-horizon-instinct --save reports/agent-save.json
npm run agent:play -- reset --seed 123 --save reports/agent-save.json
npm run agent:smoke
npm run agent:campaign
```

Agent-save schema is 6 and fair-observation schema is 7. Browser and agent saves
are separate; exact values cross JSON as canonical decimal strings.

## Fair observation

Observation exposes player-visible facts only: next World ordinal, the Level-0
schedule declaration, active World level/progress, chronic pressure summary,
bounded exposure, REACH, charge, resources, achieved records, Echoes, SCORE,
Evolution levels/costs/eligibility, Trophies, and curated Result data.

The chronic-pressure summary contains the same five live normalized values and
semantic labels visible in Current Chronic Pressure, plus current/next profile
identity and aggregate severity. It does not expose exact raw ratings,
coefficients, or future-Level values. Legacy profile detail is omitted rather
than reinterpreted; permanent campaign state and trustworthy History facts are
preserved.

It excludes future seeds, hidden RNG, replay authority, raw typed arrays, hidden
maps, and diagnostics. It exposes no disaster queues because the production
model has none.

## Actions

- `observe`
- `buy-evolution-level` with exact expected level/revision
- `start-world` at Level 0
- `advance-world`, `continue-world`, and `run-world` under explicit budgets
- result/build inspection, export, goal selection, and reset

Budget exhaustion returns `incomplete-budget` without rewards or records. Worlds
remain autonomous; agents have no mid-run ecological intervention.
