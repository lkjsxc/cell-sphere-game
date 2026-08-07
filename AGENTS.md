# AGENTS.md — Repository Contract

> Revision: 2026-08-07  
> Scope: the entire `lkjsxc/cell-sphere-game` repository unless a narrower
> `AGENTS.md` overrides one genuinely local implementation detail.  
> This file supersedes the 2026-08-06 contract and its cross-world Environment
> frontier interpretation.

---

## 1. Instruction authority and freshness

Follow instructions in this order:

1. platform and execution-environment instructions;
2. the user’s current explicit request and corrections;
3. this repository contract;
4. current source, tests, schemas, deployment, and measured behavior;
5. focused current documentation;
6. status snapshots, old prompts, old commits, and legacy records as historical evidence only.

A current user correction overrides stale implementation, tests, prose, screenshots, reports, and prior architecture.

In particular, the former model in which Environment Level was selected or unlocked across worlds is rejected. Delete tests and current documentation that protect it. Preserve old data only through explicit legacy migration.

`docs/status.md` is a dated evidence snapshot, not a constitution.

Never claim a test, browser path, physical-device check, deployment, network check, AI play session, visual result, or performance measurement that did not actually occur.

---

## 2. Repository identity

- Product/package: `cell-sphere-game`
- Repository: `lkjsxc/cell-sphere-game`
- Public site: `https://lkjsxc.github.io/cell-sphere-game/`
- Tagline: `Every extinction becomes memory.`

`incremental-network-game` is a legacy identity allowed only in isolated migration code, tests, or clearly labeled historical evidence.

Use current public terms:

- World
- Environment Level
- pressure
- Evolution
- mastery
- Echoes
- SCORE
- REACH
- Trophies
- Luminous

`memory` may remain only in narrow legacy schema/module boundaries until a coherent migration removes it.

---

## 3. Product north star

The game is a calm, legible, deterministic, browser-native incremental roguelite ecology on a living sphere.

The canonical loop is:

```text
start a new autonomous world at Environment Level 0
→ observe growth, resources, geography, pressure, and extinction
→ Environment Level rises with authoritative time inside that world
→ record how far and how well the ecology endured
→ convert demonstrated quality into Echoes
→ broaden or deepen permanent Evolution
→ start another world at Environment Level 0
→ survive farther without a progression ceiling
```

The player makes meaningful between-world choices. Do not reintroduce:

- active mid-run Adaptations;
- random upgrade-card offers;
- mandatory crisis choices;
- repetitive resource clicking;
- hidden auto-picks;
- direct click-to-grow intervention;
- a static difficulty selector disguised as Environment Level.

Archived Adaptation records remain readable and inert.

Camera, selected scene, open panels, History, settings, quality, frame rate, renderer, tab visibility, and speed never alter simulation authority or SCORE.

---

## 4. AI-first work protocol

### 4.1 Start with repository reality

At the start of substantial work, inspect:

- worktree and branch;
- remotes and upstream;
- current `HEAD` and recent commits;
- intentional uncommitted/concurrent work;
- root and nested agent instructions;
- relevant source, tests, schemas, reports, and migrations;
- current Actions and Pages revisions when accessible;
- cache-busted deployed bytes when deployment is in scope.

Reproduce reported behavior before assigning a cause.

Never reset, discard, overwrite, force-checkout, hide, or reformat unrelated work merely to obtain a clean tree.

### 4.2 Structured work packages

For work crossing three or more architectural layers, create an active package:

```text
docs/work/<descriptive-slug>/
  README.md
  inventory.md
  invariants.md
  architecture.md
  migration-matrix.md
  verification-matrix.md
  decisions.md
  status.md
```

Before invasive implementation, record:

- current-state dependency inventory;
- required and forbidden semantics;
- canonical names;
- authority and update-order invariants;
- schema/protocol migration plan;
- verification and evidence plan;
- phased implementation dependencies;
- known risks.

Do not begin a broad migration after writing only one shallow plan file.

Update the work package as facts change. At completion, move durable truth into canonical docs and remove redundant temporary prose when Git history already preserves it.

### 4.3 Execution cycle

Use this cycle:

```text
inspect
→ reproduce
→ inventory
→ model
→ write invariants
→ plan migration and verification
→ implement a coherent vertical slice
→ run focused tests
→ integrate
→ run full tests
→ measure
→ agent-play
→ browser-play
→ document
→ commit
→ push
→ verify CI/Pages/deployed bytes
```

Revisit the plan frequently. Do not force implementation to match a disproven assumption.

Do not stop at a plan, scaffold, TODO list, compatibility stub, or foundation commit when the requested behavior can be completed.

---

## 5. Canonical Environment Level semantics

### 5.1 Definition

Environment Level is the current public harshness rung of one active world.

It is:

- derived from authoritative elapsed simulation ticks;
- deterministic;
- visible;
- versioned;
- monotone within a world;
- reset when a new world begins;
- unlimited in model and content.

It is not:

- a campaign difficulty selection;
- an unlocked frontier;
- a persistent starting level;
- an “attempt” chosen before a world;
- a reward granted by completing a world;
- a run-count era;
- hidden adaptive difficulty.

### 5.2 Required lifecycle

Every production world follows:

```text
world creation
→ Environment Level 0
→ authoritative ticks advance
→ Environment Level rises according to one versioned schedule
→ effective pressure rises
→ finite Evolution eventually fails
→ extinction/result
→ next world
→ Environment Level 0 again
```

The blank replacement frame, initial snapshot, Worker, fallback, replay, HUD, and agent observation must agree on the reset.

### 5.3 Required invariants

The schedule satisfies:

```text
levelAtTick(0) = 0
levelAtTick(t + 1) >= levelAtTick(t)
tickForLevel(L + 1) > tickForLevel(L)
levelAtTick(tickForLevel(L)) = L
```

There is no zero-duration or Zeno transition sequence.

For the same schedule version and authoritative tick, the public level is independent of:

- seed;
- Evolution;
- score;
- biomass;
- renderer;
- frame rate;
- game speed;
- UI state;
- tab visibility;
- prior worlds;
- stored records;
- player identity.

Evolution changes effective pressure and survivability, not the public clock.

### 5.4 Reset invariants

A new world initializes:

```text
currentEnvironmentLevel = 0
peakEnvironmentLevel = 0
environmentLevelStartTick = 0
environmentTransitionCount = 0
environmentExposure = zero
```

No prior result, frontier, peak, selected level, retry state, or preference may change these values.

### 5.5 Unlimited means no designed maximum

Forbidden:

- `MAX_ENVIRONMENT_LEVEL`;
- finite content rows ending at a last level;
- terminal named era;
- sentinel “infinite” level;
- UI truncation treated as a gameplay cap;
- `Number.MAX_SAFE_INTEGER` as a progression assumption;
- loops or allocations proportional to level magnitude;
- one cache entry per historical level;
- one persistent event per transition.

Finite document-byte and malformed-input bounds are security protections, not gameplay maxima.

A finite physical session reaches a finite prefix. That is not a designed cap.

### 5.6 Forbidden legacy semantics

Do not reintroduce or retain active behavior for:

- `recommendedEnvironmentLevel`;
- `resolveEnvironmentAttempt`;
- `frontierAfterEnvironmentCompletion`;
- `attainableEnvironmentFrontierForRuns`;
- `highestEnvironmentLevel` as an unlock frontier;
- “Next Environment Level”;
- “Retry Environment Level”;
- lower-level selection;
- completion unlocking Level N+1;
- world ordinal selecting the start level;
- previous peak selecting the start level;
- a static profile fixed for the whole world;
- mutable live level in immutable world identity.

Narrow legacy readers may recognize old fields, but current authority must not use them.

---

## 6. Environment schedule source of truth

### 6.1 Pure versioned API

Keep one production source for functions equivalent to:

```text
environmentScheduleAtTick
environmentLevelAtTick
environmentTickForLevel
environmentProgressAtTick
validateEnvironmentScheduleState
```

Tests, simulation, UI, agents, audits, and documentation import or derive from this source.

Do not copy formulas into tests or presentation code.

### 6.2 Direct evaluation

Compute level/threshold in O(1) or O(log magnitude).

Do not:

- iterate from Level 0 to the requested level;
- allocate one threshold per level;
- grow a global threshold table;
- depend on locale formatting;
- use unstable floating boundary comparisons.

Prefer integer or fixed-point threshold math. If an inverse uses roots or logarithms, test exact thresholds and neighboring ticks.

### 6.3 Calm opening and readable escalation

Level 0 provides a meaningful establishment period.

Level 1 is mild, late enough to be understood, and clearly telegraphed.

Later levels become progressively harsher. Tune thresholds and pressure through production cohorts.

Do not solve onboarding by starting later worlds above Level 0.

### 6.4 Onboarding protection

Retain the established first-two-world “no harmful environmental events” behavior only through an explicit, separately named, versioned onboarding modifier.

It must:

- leave Environment Level and its schedule unchanged;
- be present in snapshots, results, History, and fair-agent observations;
- never become hidden adaptive difficulty;
- never carry into later worlds accidentally.

World 3 may introduce the first mild harmful event under the same public clock.

---

## 7. Dynamic pressure model

### 7.1 Public clock versus effective pressure

Use a transparent model:

```text
public Environment rating at the current time
minus
public/versioned Evolution defense and build mastery
→
finite effective pressure dimensions
```

For a fixed tick:

- all builds display the same Environment Level;
- stronger relevant defense is no worse in defended dimensions;
- one repeatedly upgraded cell cannot replace multi-affinity breadth;
- every finite defense is eventually exceeded;
- runtime values remain finite.

No hidden rubber-banding.

### 7.2 Immutable start versus dynamic effects

Every world is generated from the Level-0 start baseline.

Later levels must not retroactively:

- regenerate topology;
- change immutable geography;
- rewrite initial resource stock;
- refill resources;
- erase conservation;
- move the inoculation point;
- change the seed.

Dynamic pressure may prospectively affect:

- renewal;
- maintenance;
- transport;
- seasonal volatility;
- drying;
- heat/cold drift;
- toxicity;
- conservation-accounted loss/access;
- recovery;
- event cadence/intensity/footprint;
- electrical upkeep.

### 7.3 Transition compilation

Compile exact progression at level transitions, not in per-cell/per-edge loops.

Keep bounded finite state, normally:

- current profile;
- next profile;
- fixed-point progress;
- current profile hash;
- bounded recent transition evidence.

Do not retain an unbounded profile cache.

### 7.4 Smoothness

The public level is discrete. Selected runtime coefficients may interpolate deterministically toward the next profile to avoid arbitrary lethal cliffs.

Interpolation must be:

- versioned;
- derived only from authoritative ticks;
- deterministic;
- finite;
- visible in pressure summaries;
- independent of performance.

Never interpolate by changing immutable start state.

### 7.5 Extreme levels

The compiler accepts huge canonical levels directly and produces:

- exact ratings;
- exact defense comparisons;
- finite coefficients;
- deterministic hashes.

Test `2^53` boundaries and very long decimal inputs.

Arbitrary-precision values remain outside per-cell/per-edge hot loops.

---

## 8. Environment events

Use a deterministic bounded rolling director.

Required:

- bounded active events;
- bounded future telegraphs;
- bounded recent evidence;
- isolated deterministic RNG or level-keyed derivation;
- minimum telegraph duration;
- whole-cell footprints;
- expired-event reclamation;
- Worker/fallback equality;
- no authority skipped at high speed;
- no future schedule exposed to fair agents.

Do not create an array proportional to current level, transition count, or world duration.

At high levels, increase challenge through bounded finite dimensions, cadence, duty cycle, and overlap. Never allow unbounded event count or geometry.

Presentation may coalesce announcements. Authority may not coalesce or skip transitions/events.

---

## 9. World duration and extinction

### 9.1 Ordinary target

An ordinary fresh world should normally remain near approximately 270–330 game seconds unless measured product evidence justifies a documented change.

This is a balance target, not a hard completion timer.

### 9.2 No universal rewarded timeout

Do not use the former approximately 360-second ceiling as a universal normal extinction.

A fixed normal ceiling would make the time-based Environment ladder effectively finite for sufficiently capable builds.

Instead:

- unbounded pressure eventually defeats every finite Evolution configuration;
- stronger builds survive longer and reach higher levels;
- extinction remains causally truthful;
- no finite build is immortal.

### 9.3 Fault watchdogs

A watchdog for corruption, non-progress, or infrastructure failure:

- is not gameplay;
- is far outside measured play;
- returns an error or reward-free abandonment;
- never masquerades as normal extinction;
- never updates best records or awards Echoes/Trophies.

CLI and CI time budgets are not simulation authority.

### 9.4 Bounded long worlds

Long worlds retain bounded:

- topology;
- typed arrays;
- active events;
- future events;
- profile cache;
- transition evidence;
- History;
- snapshots;
- traces;
- reports;
- renderer resources;
- listeners and timers.

---

## 10. Whole-cell world language

A whole world cell is the smallest visible geography, ecology, transformation, event-material, and electricity unit.

Allowed whole-cell features include:

- land;
- coast;
- ocean;
- lakes;
- shores;
- wetlands;
- forest;
- tundra;
- snow;
- ice;
- local resources;
- depletion;
- exhaustion;
- recovery;
- reclamation;
- life;
- stress;
- remains;
- transformation;
- electric charge;
- event material.

Forbidden sub-cell features include:

- rivers;
- roads;
- routes;
- paths;
- ribbons;
- electricity wires;
- terrain glyphs pretending to be geography;
- decorative lines implying non-authoritative network edges.

Freshwater uses lakes, shores, wetlands, catchments, local influence, and finite conservation-accounted stock.

Global time or ENTROPY must not wash out all terrain. Local rich, strained, poor, depleted, exhausted, recovering, and reclaimed states remain legible.

Fresh worlds spread primarily through plausible resource-rich niches.

---

## 11. Evolution topology and levels

Evolution remains a frequency-5 geodesic sphere with exactly:

- 252 cells;
- 750 boundaries;
- 12 pentagons;
- 240 hexagons;
- six connected 42-cell affinities:
  - Fertility
  - Freshwater
  - Scarcity
  - Cryogenic
  - Marine
  - Luminous

Every cell has an exact non-negative level:

- Level 0: locked;
- Level 1: first authored identity;
- Level 2+: repeatable upgrade;
- no gameplay maximum.

The persisted level vector is:

- stable-ID ordered;
- sparse;
- duplicate-free;
- exact;
- deterministic;
- compact.

Level 0 is normalized away. Compilation is O(252) plus bounded work independent of level magnitude.

### 11.1 Purchase eligibility

Level 0 → 1 requires:

- enough Echoes;
- at least one directly adjacent Level-1-or-higher cell.

The six roots retain the fresh-save bootstrap exception.

Level 1 → 2 and later require:

- current positive ownership;
- enough Echoes.

No hidden run count, all-parent, Trophy, experience, random, Environment frontier, or observed-world gate.

A purchase raises exactly one cell by exactly one level and charges exactly one cost.

Duplicate, stale, retried, or reordered commands never double-charge or double-level.

### 11.2 Level-one compatibility

Where practical:

- fresh World Potential remains approximately 16,000;
- a first root remains approximately 19,000;
- all 252 Level-1 identities remain approximately 1,200,000 World Potential;
- current authored unlocks and habitat meaning remain recognizable.

All Level-1 cells is breadth-complete, not final Evolution.

### 11.3 Repeat levels

Later levels remain meaningful through versioned composable curves for:

- bounded direct scalar refinement;
- pressure resistance;
- conditional behavior;
- habitat efficiency/reliability;
- build mastery;
- worldmaking capacity;
- periodic milestones;
- World Potential;
- SCORE.

Flags and unlocks are not duplicated blindly.

No level creates:

- invulnerability;
- infinite resources;
- negative costs;
- immortal ecology;
- permanent full charge;
- immunity to unlimited Environment pressure.

### 11.4 Costs and mastery

Level 1 retains authored base cost.

Later costs use one documented exact monotone superlinear directly computable unlimited curve.

The economy must support both breadth and depth:

- one cheap root cannot dominate;
- repeated levels remain attainable;
- no permanent economy stall;
- no accidental geometric impossibility;
- no flat trivial curve.

Multi-affinity builds require breadth. One deeply upgraded cell cannot supply an entire multi-affinity recipe.

---

## 12. Evolution interaction contract

The rendered Evolution cell is both a selection target and a purchase control.

Required state machine:

1. activating an unselected cell selects it and opens/focuses detail;
2. that same physical activation never purchases;
3. the selected purchasable cell receives a conspicuous whole-cell ready state;
4. a later discrete activation of the same selected ready cell purchases one level;
5. activating the same selected non-ready cell keeps detail open and announces the stable reason;
6. activating a different cell changes selection without purchasing the old cell;
7. Close and Escape close detail;
8. blank taps never purchase;
9. drag, pinch, wheel, inertia, cancellation, or movement beyond threshold never purchases;
10. stale expected level/meta revision is rejected;
11. after purchase the cell remains selected and shows new level/next cost;
12. one activation buys at most one level;
13. pointer, touch, keyboard, semantic tree, and explicit button use one authority.

Selecting the already-open cell must not close it.

### 12.1 Ready presentation

A selected purchasable cell is inviting without color alone:

- brighter affinity material;
- distinct inset/core;
- outline, relief, or pattern;
- restrained normal-motion pulse;
- static high-contrast reduced-motion alternative;
- explicit status text;
- accessible action name;
- current/next level;
- exact/formatted cost.

Distinguish all locked, reachable, affordable, owned, selected, ready, and recently upgraded states.

The action button remains usable in portrait, short landscape, safe areas, and 200% text.

---

## 13. Exact progression arithmetic

No progression value may silently exceed JavaScript integer safety.

Preferred boundary:

- runtime `bigint` or equivalent exact representation outside hot loops;
- canonical base-10 strings at JSON/storage/History/import/export/agent/hash boundaries;
- bounded integer/fixed-point projections for runtime coefficients;
- stable engineering/scientific display formatting.

A different representation requires evidence and equivalent invariants.

Never:

- serialize raw `bigint`;
- call `Number()` on arbitrary exact persisted values;
- emit `NaN` or `Infinity`;
- accept negative overflow;
- hash locale-formatted numbers;
- accept ambiguous leading zeros or scientific notation as canonical exact input.

Finite malformed-document limits are security constraints, not gameplay caps.

Tests cover canonicalization, malformed values, exact debit/credit, hashing, `2^53`, huge decimals, and repeated round trips.

---

## 14. SCORE, Echoes, World Potential, and ranks

One production implementation serves HUD, Result, History, audits, and agents.

SCORE:

- is monotone nondecreasing live;
- has no surprise Result correction;
- reflects cumulative authoritative accomplishments;
- versions every semantic formula change;
- resists instant high-pressure death farming;
- ignores camera, UI, speed, renderer, quality, frame rate, developer mode, and open panels;
- remains exact and display-safe at large values.

The dynamic Environment model uses cumulative evidence such as:

- pressure-time exposure;
- peak level;
- sustained time after transitions;
- ecological quality under pressure;
- stewardship;
- exploration;
- presence/coherence;
- worldmaking;
- crisis endurance;
- powered ecology.

Peak level alone is insufficient reward evidence.

Avoid arbitrary-precision work per tick. Derive exact level-time segments at transitions or use another documented bounded/exact hybrid.

Calibration anchors:

- fresh final SCORE: approximately 8,000–15,000;
- first-root next-world SCORE: approximately 10,000–20,000;
- breadth-complete Level-1 strong SCORE: approximately 850,000–1,100,000.

World Potential:

- fresh approximately 16,000;
- first root approximately 19,000;
- breadth-complete Level 1 approximately 1,200,000;
- later levels continue without a terminal anchor.

Ranks continue procedurally after named onboarding ranks.

Echo growth is smooth, quality-gated, exact, resistant to one-run explosions, and supports continued long-term purchases.

Old SCORE models remain readable legacy records and never block current-model bests.

---

## 15. Builds, worldmaking, and REACH 100%

Maintain mechanically distinct combinable builds for:

- sustainability;
- freshwater;
- scarcity/reclamation;
- cryogenic survival;
- marine use;
- Luminous infrastructure;
- mixed world gardening.

Retain coherent recipes such as:

- lake gardens;
- circular metabolism;
- wasteland reclamation;
- cold dormancy;
- cryolakes;
- brine harvesting;
- pelagic colonies;
- littoral succession;
- bioelectric wetlands;
- hydrothermal power;
- depletion bloom;
- lake-to-light systems;
- illuminated biospheres.

Transformations are whole-cell, deterministic, conservation-aware, resource-consuming, visible, and bounded.

`REACH 100%` means every authoritative world cell alive simultaneously for the documented minimum interval.

It remains:

- impossible for fresh saves;
- possible on some late valid configurations;
- rare;
- followed eventually by extinction;
- never permanent through unlimited Evolution.

---

## 16. Trophies

The Trophy Sphere remains a read-only recognition system with 96 meaningful cells unless a separate explicit product decision changes the catalog.

Trophies consume completed authoritative facts. They never change:

- simulation;
- Environment clock;
- effective pressure;
- World Potential;
- SCORE;
- Echo rewards;
- Evolution costs;
- purchase eligibility.

New criteria use explicit current concepts:

- actual dynamic peak level;
- sustained exposure;
- quality under pressure;
- breadth-complete Level 1;
- mastery;
- powered ecology.

Legacy frontier or static attempted-level evidence does not automatically become a new dynamic achievement without proven semantic equivalence.

Legacy IDs remain readable and inert where retired.

---

## 17. Luminous and electricity

Electricity is authoritative whole-cell charge/infrastructure, never wires.

A cell glows only when production authority reports actual charge.

Owning Luminous Evolution without charge does not light the world.

Luminous levels and build mastery may improve bounded:

- generation;
- storage;
- efficiency;
- viable domains;
- propagation through existing cell/network mechanics;
- resistance to pressure;
- transformation capacity.

Upkeep remains real. Charge decays. Extinction remains possible.

WebGL2 and Canvas 2D both show:

- clear whole-cell emission;
- stronger night-side visibility;
- bounded daytime energized material;
- local charge variation;
- mastery-sensitive development;
- no false light at zero charge;
- no global washout;
- no flicker or speed dependency;
- reduced-motion compatibility.

Prefer existing world-cell and atmosphere draws. Do not add wire geometry or an unmeasured unbounded post-process.

Result, History, Inspector, snapshots, and agents expose powered-cell evidence.

Visual claims require actual production screenshots/inspection in both renderers.

---

## 18. Architecture and deterministic update order

Default dependency direction:

```text
interface → rendering → simulation → world → core
```

Simulation imports no DOM, WebGL, storage, or wall-clock presentation state.

Rendering never mutates authority.

Worker and fallback use the same production simulation.

### 18.1 Environment update order

Define one documented causal order. A preferred order is:

```text
increment tick
→ derive schedule state
→ process due level transition exactly once
→ install bounded pressure/event state
→ environment
→ conditionals
→ metabolism
→ transport
→ worldmaking
→ growth
→ death
→ liveness
→ connectivity/summary/SCORE/History
→ natural terminal evaluation
```

Adjust only for demonstrated simulation causality. Worker and fallback must share the exact implementation.

A transition is never:

- skipped at high speed;
- applied twice;
- presentation-only;
- processed after consumers use stale pressure;
- dependent on frame cadence.

### 18.2 Determinism

The same immutable start configuration produces the same authority under:

- Worker and fallback;
- all normal and developer speeds;
- WebGL and Canvas;
- different frame cadence;
- pause/resume;
- hidden-tab rendering throttling.

Use isolated deterministic RNG streams.

Never use `Math.random()` in authority or seeded content.

---

## 19. Immutable identity, protocol, and idempotency

### 19.1 Immutable world identity

Mutable `environmentLevel` is not an identity field.

Immutable identity contains only stable start facts such as:

- world session ID;
- run ID;
- seed;
- presentation generation;
- environment schedule/model version;
- immutable start-configuration hash;
- result transaction key.

The start-configuration hash commits to relevant topology/content/compiler/Evolution/onboarding versions.

Current level/profile hash belongs in snapshots and results.

### 19.2 Protocol versions

Monotonically bump every semantically affected contract:

- run protocol;
- replay;
- browser meta;
- History;
- agent save;
- agent observation;
- Environment model/schedule/profile;
- SCORE;
- result schema.

Do not bump unrelated versions gratuitously.

### 19.3 Stale-message safety

Reject stale:

- run ID;
- world session;
- presentation generation;
- request generation;
- expected Evolution level;
- meta revision;
- result transaction;
- Worker/fallback response.

Every command is acknowledged or rejected with a stable reason.

### 19.4 Exactly once

Make these idempotent:

- extinction;
- abandonment;
- continuation;
- world replacement;
- result;
- reward;
- best Environment record;
- History append;
- Trophy recognition;
- Evolution purchase;
- Echo debit;
- transformation;
- migration.

### 19.5 Atomic world replacement

1. first valid request wins;
2. live authority acknowledges abandonment/terminal state;
3. old timers, Worker, overlays, snapshots, buffers, and renderer state retire;
4. one static blank frame appears with Environment Level 0;
5. one immutable seed/start identity is reserved;
6. one new Level-0 authority starts.

No stale prior Environment Level may flash.

---

## 20. Persistence and migration

Validate every loaded field. Corruption degrades field by field.

### 20.1 Current browser state

Persist clear records such as:

- runs;
- world seed cursor;
- exact Echo balance/total;
- Evolution vector;
- score bests by model;
- `bestEnvironmentLevelReached`;
- best exposure/longest world where useful;
- result keys;
- Trophies/progress/queue;
- Imprints;
- bounded History;
- inert legacy fields.

### 20.2 Legacy frontier

The old `highestEnvironmentLevel` was an unlocked static frontier.

Migration must:

- preserve it as `legacyEnvironmentFrontier` or equivalent;
- keep it inert;
- never use it to start a world;
- never copy it to `bestEnvironmentLevelReached` without trustworthy new-model evidence;
- never award new rewards/Trophies from it;
- remain idempotent.

### 20.3 Legacy History

Old `environmentLevel` means static attempted level.

Validate it under an explicit legacy Environment model. Do not call it a dynamic peak.

New records include:

- model/schedule/profile versions;
- start Level 0;
- final level;
- peak level;
- transition count;
- bounded exposure;
- bounded recent/milestone transitions.

History is bounded by entries and bytes. Do not append an unbounded permanent transition log.

### 20.4 Transactions and crash recovery

Result, reward, record, History, and Trophies commit together exactly once.

Import/export round-trips exact values.

Browser and agent saves remain separate validated schemas.

Storage-unavailable sessions remain playable and truthfully report temporary progress.

Migration never charges the player and never repeats a refund.

---

## 21. Fair agent-play contract

Maintain a machine-readable deterministic production-backed fair environment.

### 21.1 Observation

Expose player-visible:

- active current/peak Environment Level;
- schedule/model version;
- public progress/ticks to next level;
- current pressure summary;
- bounded exposure;
- all-time best reached;
- exact/formatted Echo balance;
- per-Evolution-cell current/next level, cost, eligibility, preview, and neighbors;
- affinity breadth/depth;
- build activation/mastery;
- World Potential and SCORE versions;
- last Result;
- resources;
- REACH;
- transformations;
- electricity;
- Trophies.

Exclude:

- future random event schedule;
- future seeds;
- hidden RNG;
- raw typed arrays;
- hidden vulnerability maps;
- replay authority unavailable to players.

### 21.2 Actions

Actions include:

- observe;
- set a between-world goal;
- buy one Evolution level;
- start a Level-0 world;
- advance a bounded authoritative chunk;
- inspect a checkpoint/result/builds;
- continue until extinction subject to an explicit external budget;
- export;
- reset validated agent state.

Do not include:

- select Environment Level;
- unlock Environment Level;
- retry static Environment Level;
- skip to a frontier.

Budget exhaustion returns an incomplete, reward-free status.

### 21.3 Policies

Maintain deterministic policies for:

- balanced;
- breadth-first;
- depth-first;
- cheapest;
- marginal-value;
- diversity;
- weak;
- Fertility;
- Freshwater;
- Scarcity;
- Cryogenic;
- Marine;
- Luminous;
- sustainability;
- Luminous infrastructure;
- major builds;
- terraforming;
- REACH 100;
- harshness push;
- random legal.

“Harshness push” means building to survive farther into the within-world clock.

Retire or redefine static-level retry policies.

### 21.4 Balance tooling

Use fixed training seeds and untouched holdout seeds.

Provide:

- deterministic ordering/parallelism;
- bounded traces;
- machine-readable reports;
- before/after comparison;
- minimized reproductions;
- policy and seed disclosure.

The coding agent should make real fair-interface decisions in several campaigns when possible.

Never claim AI play that did not occur.

Do not maintain a simplified duplicate simulator.

---

## 22. Interface and accessibility

Primary scenes remain:

```text
HOME | WORLD | EVOLUTION | TROPHIES
```

Globe drag/pinch/wheel preserves open detail.

Opening a pane never moves or zooms the globe except an explicit focus action.

A different detail replaces the current detail. Close/Escape dismisses.

### 22.1 World metrics

SCORE, ENTROPY, REACH, RESULT, and ENV LEVEL remain legible and truthful.

- ENV LEVEL shows live time-based authority.
- ENTROPY shows ecological deterioration.
- Optional next-level progress/countdown is derived from the public schedule.
- Level changes use bounded accessible announcements.

### 22.2 Result

Result shows:

- peak/final Environment Level;
- pressure exposure;
- time at peak or equivalent evidence;
- SCORE;
- Echoes;
- cause;
- powered ecology;
- Trophies.

The primary action is `Next World`.

No frontier-unlock or static-level retry text/control.

### 22.3 Evolution

Explain:

```text
Every world begins at Environment Level 0.
Evolution helps life endure farther.
```

Show the best actually reached record without implying it is the next start level.

### 22.4 Accessibility matrix

Test:

- keyboard-only;
- pointer;
- touch;
- screen reader labels and live regions;
- reduced motion;
- high contrast;
- color-vision ambiguity;
- touch-target minimums;
- safe areas;
- short landscape;
- narrow portrait;
- 200% text;
- WebGL2;
- Canvas 2D.

Hidden semantic structures remain synchronized with rendered cells.

Notifications are queued, bounded, nonblocking, and accessible.

Presentation may coalesce high-speed announcements without skipping authority.

---

## 23. Speed and developer mode

Normal player speeds are exactly:

- 1×
- 2×
- 4×
- 8×

Explicit developer mode may expose:

- 16×
- 32×
- 64×
- 128×
- 256×

Developer mode is visibly marked, session-scoped or explicitly enabled, and excluded from normal preference import/export.

Every speed executes every authoritative tick.

Rendering, snapshots, History sampling, diagnostics, and announcements may be decimated or coalesced. Simulation may not skip work or change outcomes.

Environment magnitude never changes this contract.

---

## 24. Performance and boundedness

Measure a same-host baseline before hot-path changes.

Required:

- fixed world resolution;
- bounded active/future event state;
- bounded transition evidence;
- bounded History/traces/reports;
- bounded profile cache;
- direct level/profile compilation;
- no arbitrary-precision values in per-cell/per-edge loops;
- no unbounded per-frame object churn;
- no per-cell DOM;
- no cache entry per historical campaign state without eviction;
- no listener/timer/Worker/buffer leaks;
- hidden tabs reduce presentation work;
- no skipped authoritative ticks;
- the WebGL world path remains exactly four draw calls; changing this requires a separate measured product decision and contract revision;
- Canvas remains semantically complete;
- title showcase remains generated from production modules and hash-checked.

Target:

- at least the existing measured simulation throughput;
- no more than 10% median same-host regression without documented product value;
- bounded long-transition and long-world memory;
- deterministic Worker/fallback;
- repeated atomic replacement;
- fresh, breadth-complete, deep-Luminous, and extreme-exact benchmarks.

Do not gain speed by skipping ticks or authority transitions.

---

## 25. Development structure and source of truth

Prefer:

- focused pure modules;
- explicit schemas;
- versioned formulas;
- canonical data;
- stable reason codes;
- deterministic hashes;
- small bounded caches;
- module READMEs;
- production imports in tests/audits.

The historical 200-line file and 16-child directory limits are maintainability heuristics, not product laws.

Rebalance files/directories when boundaries become confused. Update structural checks when arbitrary numbers distort architecture.

Git history is the archive. Do not create graveyard directories.

Production remains browser-native HTML/CSS/ES modules.

Prefer JavaScript/TypeScript and Node tooling.

Avoid new shipped dependencies. Preserve no-install runtime unless a dependency has compelling measured benefit.

New formulas live in one production source. Tests, audits, UI, docs, and agents do not copy them.

Module READMEs should let a weaker model find:

- authority;
- invariants;
- schema;
- compiler boundary;
- versions;
- interaction state machine;
- agent protocol;
- performance gates;
- latest balance evidence.

Delete obsolete code/tests/docs in the same workstream that replaces them.

---

## 26. Verification

Use production modules, not copied models.

Retain and update applicable gates:

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

If names change, document the mapping and keep a coherent convention.

### 26.1 Environment coverage

Required evidence:

- every world starts Level 0;
- exact transition boundaries;
- monotone level/progress;
- reset after prior high peak;
- no frontier/selection/retry semantics;
- fixed tick gives same public level across builds;
- Evolution mitigation;
- direct huge-level compilation;
- finite coefficients;
- bounded profile cache;
- bounded event director;
- minimum telegraph;
- no retroactive world-start rewrite;
- natural extinction;
- stronger builds reach higher peak distributions;
- every tested finite build dies;
- no instant-death farm;
- dynamic result/exposure validation;
- legacy frontier inertness;
- legacy History distinction;
- immutable identity stable while level changes;
- Worker/fallback equality;
- all-speed equality;
- pause/resume;
- high-speed transition presentation;
- repeated replacement;
- long-transition memory soak.

### 26.2 Other required evidence

- unlimited repeat Evolution upgrades;
- exact large-number arithmetic;
- economy/purchase cadence;
- build diversity;
- selected-ready second-activation behavior;
- Luminous day/night/decay/WebGL/Canvas;
- migration and crash recovery;
- resource conservation;
- REACH 100 rarity/non-immortality;
- bounded memory/cache/History/report state;
- training and holdout agent campaigns;
- performance before/after.

A skipped test is not a pass.

A mocked click is not real pointer evidence.

A counter is not visual evidence.

A simplified simulator is not production balance evidence.

Physical-device claims require a physical device.

---

## 27. Balance release expectations

Preserve early anchors unless measured evidence justifies a documented change:

- ordinary fresh duration approximately 270–330 game seconds;
- fresh SCORE approximately 8,000–15,000;
- first-root next-world SCORE approximately 10,000–20,000;
- first meaningful campaign resolution approximately 18–24 minutes at 1×;
- strongly learning early World Potential approximately 80,000–130,000 after roughly 12–18 minutes;
- breadth-complete Level-1 strong SCORE approximately 850,000–1,100,000.

Dynamic Environment goals:

- Level 0 provides a calm opening;
- Level 1 is mild and telegraphed;
- later levels are no easier for a fixed build;
- stronger relevant Evolution reaches higher peaks;
- public clock is build-independent;
- finite builds eventually become extinct;
- no universal normal timeout fixes the peak;
- no permanent economy stall;
- breadth and depth both matter;
- specialists remain distinct;
- high-level immediate death is not optimal;
- resources conserve;
- Luminous creates meaningful powered ecology;
- performance remains bounded.

Use fixed training cohorts and untouched holdout cohorts.

Report distributions, percentiles, causes, exact seeds, policies, and minimized failures.

---

## 28. Git, CI, deployment, and documentation

Make coherent, bisectable commits.

Preserve history.

Never force-push unless explicitly ordered and consequences are understood.

Update:

- README;
- focused domain/module docs;
- architecture;
- simulation;
- game design;
- balancing;
- testing;
- agent play;
- migration docs;
- this contract;
- dated `docs/status.md`.

Documentation follows implemented truth.

Remove current normative claims about:

- unlocked Environment frontier;
- selected/attempted level;
- next-level Result action;
- static level retry;
- fixed static profile;
- universal 360-second normal terminal;
- finite “full Evolution”.

Historical claims remain only when clearly labeled.

Verify:

- branch/upstream;
- pushed commits;
- Actions;
- Pages;
- cache-busted public bytes;
- exact deployed revision;
- deployed Level-0 reset and live progression.

State limitations honestly.

---

## 29. Definition of done

A task is complete only when all affected layers agree:

- domain model;
- simulation authority;
- dynamic pressure;
- events;
- natural extinction;
- Worker/fallback;
- immutable identity;
- protocol;
- replay/hash;
- SCORE/Echo economy;
- UI/accessibility;
- persistence/migration;
- History;
- Trophies;
- Evolution;
- builds/worldmaking;
- Luminous;
- agents;
- audits;
- performance/memory;
- docs;
- Git/CI/Pages when in scope.

For Environment progression specifically:

```text
new world = Level 0
time passes = level rises
Evolution = survives farther
extinction = records achieved peak/exposure
next world = Level 0
```

No active static frontier remains.

---

## 30. Final report

Final reports include:

- starting/final commits;
- root cause;
- formulas and versions;
- schema/protocol/replay/SCORE migrations;
- files/modules changed;
- exact commands/results;
- migration and crash-recovery evidence;
- transition/reset evidence;
- Worker/fallback/all-speed equality;
- browser interaction/accessibility evidence;
- WebGL/Canvas/Luminous evidence;
- agent cohort sizes, policies, training/holdout outcomes;
- fresh/deep duration and peak-level distributions;
- SCORE/Echo/purchase cadence;
- benchmark, heap, cache, event, History, draw-count, and soak results;
- push/CI/Pages/deployed revision;
- honest limitations and next actions.

Never report planned work as completed work.
