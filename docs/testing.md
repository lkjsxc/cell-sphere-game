# Testing and evidence

## Fast authoritative gate

```bash
npm run verify
```

`verify` is the aggregate production-module gate for identity/structure, retired-
Adaptation source checks, ecology, deterministic simulation, Evolution/Environment
progression, SCORE, rendering, persistence, agent smoke, benchmark, and links.
Focused endless-progression and holdout commands remain explicit release gates
below; do not infer a pass for any command that was not run.

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
npm run test:browser:fallback
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
npm run audit:evolution-levels
npm run audit:environment-levels
npm run audit:luminous
npm run audit:progression-numbers
npm run audit:trophies
npm run audit:adaptations
npm run audit:campaign
npm run terminal:soak
npm run agent:smoke
npm run agent:campaign
npm run agent:long
npm run balance:holdout
```

A skipped test is not reported as a pass. Physical-device claims require a real
physical device; the current release evidence is desktop Chrome emulation and is
labeled accordingly.

## What the suites prove

### Unit

- frequency-5 topology and exact 252-cell/750-boundary Evolution counts;
- sparse exact level normalization, Level 0/1/unlimited Level 2+ semantics,
  adjacency/root bootstrap, repeat costs, one-level transactions, and bounded compilation;
- `2^53` boundaries, huge decimals, exact debit/credit/hash/round trips, Potential
  v3, monotone SCORE v4, procedural ranks, and legacy SCORE separation;
- unlimited Environment Level normalization, direct challenge-profile compilation,
  protected Worlds 1–2 Level 0 and World 3 Level 1 behavior;
- finite local resource/conservation authority, freshwater, extinction, habitats,
  whole-cell charge/decay, rendering states, settings, meta schema 11, History 6,
  and interaction state machines.

### Integration

- same-seed exact authority across normal 1×/2×/4×/8× and explicit developer
  16×/32×/64×/128×/256× lanes, with every tick executed;
- Worker/fallback run-protocol-v5 and replay-v5 equivalence/acknowledgement;
- replacement, result/reward, frontier, migration, and purchase exactly-once behavior;
- all 252 Level-1 identities legally reachable by physical adjacency, repeat
  levels independent of adjacency, stale expected-level/revision rejection, and
  extreme level magnitudes with bounded compilation/cache state;
- meta schema 11 / History schema 6 migration, exact ownership/value preservation,
  642→252 Level-1 mapping, archived Adaptation isolation, and crash recovery;
- fixed-build increasing-Environment pressure monotonicity and Worker/speed replay equality;
- 96 current Trophy criteria and legacy Trophy isolation;
- late-build whole-cell transformations/charge, zero-charge darkness, exact
  sustained REACH 100, and eventual post-goal extinction;
- fair observation/save schema 2, production actions, deterministic policies,
  holdout ordering, bounded traces, validation, and hidden-authority exclusion.

### Browser

`test:browser:file` uses Chrome DevTools Protocol with real pointer, touch, and
keyboard input. It verifies WebGL2 four-draw rendering, scene selection, stable
details, metric affordances, responsive terminal `SCORE | ENTROPY | REACH |
RESULT` layouts, public/developer speed isolation, camera preservation, History,
Result, and atomic replacement. Evolution coverage must exercise real first-
activation selection followed by a separate second activation purchasing one
level, non-ready reasons, stale guards, and gesture cancellation—not a mocked click.

`test:browser:fallback` removes the Worker capability before boot and runs the
same production browser scenario through fallback simulation; its terminal SCORE
and production fixture evidence must match the Worker run at every exercised speed.

`test:browser:canvas` forces Canvas 2D and verifies terminal authority, History,
252-cell Evolution ready/selected/owned states, 96-cell Trophy state, atomic
replacement, and production transformation/whole-cell-charge fixtures including
zero-charge absence and no wires. To exercise deployed bytes with the same
trusted-CDP path, set `BROWSER_TEST_URL`, for example:

```bash
BROWSER_TEST_URL=https://lkjsxc.github.io/cell-sphere-game/ npm run test:browser:file
```

### Balance and audits

- `audit:evolution-levels`: 252-cell topology, exact sparse vectors, 17,820
  Level-1 breadth cost, Potential v3 anchors, unlimited repeat levels, bounded
  compiler/cache behavior, purchases, builds/mastery, and migration hashes.
- `audit:environment-levels`: unlimited direct compilation, protected onboarding,
  finite coefficients, fixed-build pressure monotonicity, and terminal/event bounds.
- `audit:progression-numbers`: malformed/canonical decimal handling, exact large
  debit/credit/score/potential/hash/serialization behavior, and `2^53` boundaries.
- `audit:luminous`: production-backed whole-cell charge, day/night and renderer
  semantics, decay/zero-charge absence, mastery, deterministic outcomes, and no wires.
- `audit:campaign`: production fresh, level-one-breadth, depth, Environment, and
  policy cohorts; `agent:long` and `balance:holdout` cover longer fair decisions
  and untouched seed cohorts.
- `audit:resources`, `audit:freshwater`, and `audit:score-trace`: local ecology,
  conservation, matched freshwater, SCORE-v4 monotonicity, pacing, and Result parity.
- `audit:transformations`, `audit:reach100`, `audit:events`, and `audit:habitats`:
  build-gated whole-cell worldmaking, rare sustained coverage, bounded pressure,
  habitat access, and eventual extinction.
- `audit:trophies`: current catalog/proof, migration, pacing, and one-time rewards.
- `audit:adaptations`: negative gate proving active Adaptations remain retired.
- `terminal:soak`: parallel production terminal campaigns, exact result replay
  rejection, persistence/History bounds, and observed per-worker heap.

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
