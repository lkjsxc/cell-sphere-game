# Fair agent play

The development-only agent environment is a deterministic projection of the
production simulation, not a duplicate simulator. It uses `RunController`,
Evolution, Environment schedule/profile/exposure, SCORE v5, result transactions,
meta schema 13, History schema 8, Trophies, and result/replay/run protocol v7.

## Commands

```bash
npm run agent:play -- observe --save reports/agent-save.json
npm run agent:play -- run --save reports/agent-save.json
npm run agent:play -- buy --cell reach-horizon-instinct --save reports/agent-save.json
npm run agent:play -- reset --seed 123 --save reports/agent-save.json
npm run agent:smoke
npm run agent:campaign
npm run agent:long
npm run balance:holdout
```

Agent save and observation schemas are v4. Browser and agent saves are separate.
Exact values cross JSON as canonical decimal strings.

## Fair observation

Observation exposes player-visible facts only:

- next world ordinal and the versioned schedule declaration that every world
  starts at Level 0;
- active-world current/peak Environment Level, level start/next tick/progress,
  current pressure summary, bounded exposure, onboarding status, resources,
  Reach, charge, and already-active events;
- actual best achieved level/exposure, exact/formatted Echoes, SCORE, World
  Potential, Evolution levels/costs/eligibility/neighbors, builds, Trophies, and
  curated last Result.

It excludes campaign/future seeds, future event queues, hidden RNG, replay
authority, raw typed arrays, hidden vulnerability maps, and diagnostics.

## Actions

- `observe`
- `buy-evolution-level` (exact expected level/revision transaction)
- `start-world` (always Level 0)
- `advance-world` (bounded authoritative chunk)
- `continue-world` (explicit external budget)
- `run-world` (start plus explicit-budget convenience)
- result/build inspection, export, goal selection, and reset

There is no select/retry/advance-static-Environment action. A budget exhaustion
returns `incomplete-budget` and does not award Echoes, records, History, or
Trophies. Worlds remain autonomous: agents have no mid-run ecological
intervention.

## Policies and evidence

Policies include balanced, breadth-first, depth-first, cheapest, marginal-value,
diversity, weak, all affinity/build specialists, Luminous infrastructure,
terraforming, REACH 100, harshness push, conservative, and random legal.
`harshness-push` means choosing Evolution that survives farther into the
within-world clock. Policies use only fair observations.

`scripts/agent-tournament.mjs` provides deterministic fixed training/holdout
cohorts and bounded reports. Claims about campaign outcomes must name policies,
seeds, cohort sizes, and whether a run completed or exhausted its external
budget.
