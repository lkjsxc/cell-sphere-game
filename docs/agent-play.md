# Fair agent play

The development-only agent environment provides deterministic campaign play
without a second simulation model.

## Commands

```bash
npm run agent:play -- observe --save reports/agent-save.json
npm run agent:play -- run --save reports/agent-save.json
npm run agent:play -- buy --skill reach-horizon-instinct --save reports/agent-save.json
npm run agent:play -- reset --seed 123 --save reports/agent-save.json
npm run agent:play -- --stdio --save reports/agent-save.json
npm run agent:smoke
npm run agent:campaign
npm run agent:play -- campaign --worlds 12 --policies sustainability,freshwater,scarcity,cryogenic,marine,luminous,terraforming,reach-100
```

Standard input mode accepts one JSON action per line and emits one JSON response
per line. Protocol output stays on stdout; load and parse errors go to stderr.
Save writes use a same-directory temporary file, `fsync`, and atomic rename.
Generated saves and campaign reports belong under ignored `reports/`.

## Contract

Observation schema 1 exposes the next world ordinal, Echo balance, SCORE model,
best SCORE, World Potential, Evolution Power, owned and reachable Skills,
public gameplay previews, build progress/effects/tradeoffs, habitat capabilities,
curated last Result, Trophy summary, and goals. The curated Result includes
resource quintiles/freshwater use, active builds, transformations, powered cells,
and exact-REACH status without replay or diagnostic authority.

Actions are `observe`, `buy-skill`, `run-world`, `set-goal`, and `reset`. Every
response includes acceptance, a stable reason, the updated observation, and a
deterministic campaign hash. A completed-world response additionally includes
the curated Result. The raw production Result is intentionally not returned
because it contains replay and diagnostic authority.

Agent save schema 1 is not a browser save. It stores validated meta and History,
the selected goal, the last curated Result, campaign seed, next world ordinal,
and a reproducible hash. Loading validates browser-derived subdocuments through
the production validators.

## Policies and the legacy pilot

The policy set covers balanced, sustainability, freshwater, rich-rush,
scarcity/reclaimer, cryogenic, marine, luminous, cryolake, littoral forest,
terraforming, Reach 100%, and deterministic random-legal play. Policies inspect
only observations and record concise observable rationales.

`scripts/pilot.mjs` remains a compatibility one-world authority runner for
benchmark and balance consumers. Mid-run policy labels cannot alter an
autonomous world. Its pilot object now exposes the same fair between-world
`decide(observation)` policy used by campaigns; `agent-play.mjs` is the canonical
multi-world decision loop. Campaign output includes bounded fair-observation and
action traces, rationales, response hashes, Evolution Power/World Potential,
active builds, SCORE sequence, resource evidence, transformations, and REACH 100.
Those traces are intended for reproducible balance decisions, not just smoke tests.
