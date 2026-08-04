# Testing and evidence

## Fast authoritative gate

```bash
npm run verify
```

`verify` runs structure and identity checks; whole-cell visual audit; active
system removal audit; Skill, event, habitat, Trophy, campaign, local-resource,
freshwater, SCORE-trace, transformation, exact-REACH-100, and fair-agent smoke
audits; title artifact check; unit/integration suites; 500-world lake audit;
balance smoke; benchmark; and link checks.

## Required release matrix

```bash
npm run test:unit
npm run test:integration
npm run balance:smoke
npm run benchmark
npm run check:links
npm run check:structure
npm run verify
npm run test:browser:file
npm run test:browser:canvas
npm run balance
npm run audit:cell-visuals
npm run audit:resources
npm run audit:freshwater
npm run audit:score-trace
npm run audit:transformations
npm run audit:reach100
npm run audit:lakes
npm run audit:events
npm run audit:habitats
npm run audit:skills
npm run audit:trophies
npm run audit:adaptations
npm run audit:campaign
npm run terminal:soak
npm run agent:smoke
npm run agent:campaign
```

A skipped test is not reported as a pass. Physical-device claims require a real
physical device; the current release evidence is desktop Chrome emulation and is
labeled accordingly.

## What the suites prove

### Unit

- arbitrary-frequency geodesic topology and exact 252-cell Evolution counts;
- finite local resource/conservation authority, freshwater, extinction causes,
  ecological-access ordering, transformations, and habitat locks;
- monotone cumulative SCORE v3 bounds/axes, Echo curve, and legacy separation;
- event-era scheduling and no-event worlds 1–2;
- settings, storage, History, migration, rendering, and UI state machines.

### Integration

- same-seed exact authority across normal 1×/2×/4×/8× and explicit developer 16×/32×/64×/128×/256× lanes;
- Worker/fallback protocol equivalence and command acknowledgement;
- replacement/abandonment/result exactly-once transactions;
- all 252 Skills legally purchasable by physical adjacency;
- 642-entry migration coverage, ownership/value preservation, refund and
  idempotence;
- 96 current Trophy criteria and legacy Trophy isolation;
- full-build whole-cell transformations/electricity, exact sustained REACH 100,
  and eventual post-goal extinction;
- fair agent observation allowlist, production transactions, deterministic
  policy actions, save validation, and replay hashes.

### Browser

`test:browser:file` uses Chrome DevTools Protocol with real pointer and keyboard
input. It verifies WebGL2 four-draw rendering, scene selection, stable details,
metric affordances, responsive terminal `SCORE | ENTROPY | REACH | RESULT` layouts,
public speed isolation, explicit `?dev=1` 256× execution, camera preservation,
History, Result, Skill purchase, Trophy queueing, atomic replacement, unattended continuation,
context-loss fallback, fresh/migrated saves, and browser errors.

`test:browser:canvas` forces Canvas 2D and verifies terminal authority, History,
252-cell Evolution, 96-cell Trophy state, atomic replacement, and a production
full-build transformation/power fixture. To exercise deployed bytes with the
same trusted-CDP path, set `BROWSER_TEST_URL`, for example:

```bash
BROWSER_TEST_URL=https://lkjsxc.github.io/cell-sphere-game/ npm run test:browser:file
```

### Balance and audits

- `balance`: fresh policy distributions.
- `audit:campaign`: at least 200 fresh seeds, seven campaign policies, and
  fresh/quarter/half/full Evolution checkpoints using production modules.
- `audit:skills`: topology, 17,820-Echo economy, before/after effects, World
  Potential, and migration hashes.
- `audit:resources`: local richness, niche occupancy, quintiles, depletion,
  recovery, conservation, duration, and fresh SCORE.
- `audit:freshwater`: matched near/far finite survival/resource advantage.
- `audit:score-trace`: every-tick monotonicity, pacing, jumps, and Result parity.
- `audit:transformations`: build-gated reclamation, cryolakes, forests,
  electricity, deterministic replay, and fresh-control absence.
- `audit:reach100`: hundreds of full/fresh production seeds, exact sustained
  proof, rarity, terminal bound, and post-goal extinction.
- `audit:events`: deterministic graph fields and world-era ramp.
- `audit:habitats`: fresh locks, each unlock path, whole-cell occupancy, and
  marine bounds.
- `audit:trophies`: 24 fresh worlds, 240-world campaign, uniqueness,
  possibility, pacing, migration, and one-time rewards.
- `terminal:soak`: repeated terminal/replacement lifecycle and bounded resources.

Machine-readable evidence is written to ignored `reports/`. Release docs must
state whether a number is implemented, tested, measured, observed, modeled, or
deployed.

## Deployment verification

After push:

1. record the exact local and remote commit;
2. wait for CI and Pages workflow success;
3. fetch the public page with cache bypass;
4. verify canonical title/tagline and a revision-specific changed module;
5. compare public bytes with local bytes;
6. rerun a real-browser smoke against the deployed revision when practical.
