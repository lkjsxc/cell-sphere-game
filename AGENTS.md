# AGENTS.md — superseding repository contract

> Revision: 2026-08-06. Replace the repository-root `AGENTS.md` with this file.
> Do not merge obsolete finite-progression requirements back into it.
> This contract applies to the entire repository unless a narrower `AGENTS.md`
> overrides one genuinely local implementation detail.

## 1. Authority, freshness, and evidence

Follow, in order:

1. platform and execution-environment instructions;
2. the user’s current explicit task and corrections;
3. this repository contract;
4. actual source, tests, schemas, deployment, and measured behavior;
5. focused current documentation;
6. status reports, old prompts, and old commits as historical evidence only.

A current user decision overrides stale code, tests, prose, status snapshots, and past architecture. Replace tests that protect rejected behavior. `docs/status.md` is a dated release snapshot, not a constitution.

At the start of substantial work, inspect:

- Git worktree, branch, remotes, upstream, and `HEAD`;
- intentional uncommitted or concurrent work;
- relevant source, tests, schemas, reports, and migrations;
- current GitHub Actions and Pages revisions when accessible;
- cache-busted deployed bytes when deployment is in scope.

Reproduce reported behavior before assigning a cause. Never reset, discard, overwrite, force-checkout, or hide unrelated work merely to obtain a clean tree. Preserve history. Do not claim a test, browser path, visual result, physical device, deployment, or network check that was not actually completed.

Use this work cycle for substantial changes:

```text
inspect → reproduce → model → write invariants → implement →
test → measure → agent-play → browser-play → integrate →
document → commit → push → verify CI/Pages/deployed bytes
```

Do not stop at a plan, scaffold, TODO list, compatibility stub, or foundation commit when the requested behavior can be completed.

## 2. Canonical identity

- Product/package: `cell-sphere-game`.
- Repository: `lkjsxc/cell-sphere-game`.
- Pages: `https://lkjsxc.github.io/cell-sphere-game/`.
- Tagline: `Every extinction becomes memory.`

`incremental-network-game` is a legacy identity allowed only in isolated migration code/tests or clearly labeled historical evidence.

Use **Evolution**, **Environment Level**, **pressure**, **mastery**, **Echoes**, and **SCORE** in new public APIs and prose. `memory` may remain in narrow legacy schema/module compatibility boundaries until a coherent migration removes it.

## 3. Product north star

The game is a calm, legible, deterministic, browser-native incremental roguelite ecology on a living sphere.

The canonical loop is:

```text
observe an autonomous finite ecology
→ understand growth, resource use, pressure, and extinction
→ convert demonstrated quality into Echoes
→ broaden or deepen permanent Evolution
→ attempt a harsher Environment Level
→ repeat without a progression ceiling
```

The player makes meaningful between-world choices. Do not reintroduce mandatory active mid-run Adaptations, random card offers, repetitive clicking, crisis prompts, or hidden auto-picks. Archived Adaptation records remain readable and inert.

Camera, selected scene, open panels, History, settings, quality, frame rate, renderer, visibility presentation, and speed never alter simulation authority or SCORE.

## 4. Whole-cell world language

A whole world cell is the smallest visible geography, ecology, transformation, event-material, and electricity unit.

Allowed world features include whole-cell:

- land, coast, ocean, lakes, shores, wetlands, forest, tundra, snow, and ice;
- local resources, depletion, exhaustion, recovery, and reclamation;
- life, stress, remains, habitat transformation, and electric charge;
- bounded event material and environmental pressure.

Forbidden features include sub-cell:

- rivers;
- roads, paths, routes, or ribbons;
- electricity wires;
- terrain glyphs or symbol overlays pretending to be geography;
- decorative lines that imply non-authoritative network edges.

Freshwater is represented by lakes, shores, wetlands, catchments, local influence, and finite conservation-accounted stock. It provides a real but finite survival advantage.

Per-cell resource baseline, available stock, reserve, renewal, moisture, temperature, toxicity, habitat, life, and transformation determine surface material. Global time or ENTROPY must not recolor/desaturate the entire terrain. Rich, strained, poor, depleted, exhausted, recovering, and reclaimed states remain visually distinguishable.

Fresh worlds spread primarily through plausible resource-rich ecological niches, not nearly every ordinary land cell.

## 5. World duration and onboarding

Preserve the successful early experience:

- Worlds 1 and 2 contain no harmful environmental events.
- World 3 introduces one mild, late, clearly telegraphed pressure.
- A fresh ordinary world normally lasts approximately 270–330 game seconds.
- The bounded terminal remains near 360 game seconds.
- Early failure comes mainly from finite local ecology rather than sudden global punishment.
- The first meaningful campaign resolution remains approximately 18–24 minutes at 1×.
- A strongly learning save remains near 80,000–130,000 World Potential after roughly 12–18 minutes at 1×.

Deep underpowered Environment Levels may end earlier, but no level may escape the bounded terminal. Infinite progression never means an infinite live world.

## 6. Unlimited Environment Levels

Environment harshness has a first-class, visible, versioned level with no gameplay, content, schema, or UI maximum.

“Unlimited” forbids a finite `MAX_ENVIRONMENT_LEVEL`, hidden terminal era, sentinel cap, last content row, or `Number.MAX_SAFE_INTEGER` assumption. Finite storage-size and malformed-input protections are allowed; they must not create an attainable design maximum.

Keep distinct:

- `worldOrdinal`: run history order;
- `environmentLevel`: pressure rung attempted;
- `highestEnvironmentLevel`: durable frontier evidence;
- retry/selection state when the product exposes it.

The default path remains low-friction and explicit:

- onboarding Worlds 1 and 2 use protected Environment Level 0 behavior;
- World 3 attempts Environment Level 1;
- completing a world at the highest unlocked level unlocks exactly the next level;
- extinction is the normal completion of a world, not a conventional victory gate;
- the recommended Result/Next World action advances from Level N to Level N+1;
- a secondary action retries Level N with the next deterministic seed;
- retry increments `worldOrdinal`/seed cursor but not `environmentLevel`;
- no UI, import, or agent action may skip above the next unlocked frontier;
- no hidden performance rule silently lowers or raises difficulty.

Compile each Environment Level before the run into a public pressure profile and finite typed coefficients. Candidate pressure dimensions include resource scarcity, renewal suppression, climate volatility, toxicity, maintenance/transport stress, and bounded event overlap/intensity/footprint/timing.

Use a transparent co-scaling model:

```text
unbounded public environment rating
minus
unbounded/public Evolution defense or mastery rating
→
bounded deterministic runtime coefficients
```

The comparison is not hidden adaptive difficulty. The same seed, Environment Level, Evolution levels, and versioned configuration must produce the same profile and result.

For every fixed finite Evolution configuration, higher Environment Levels must be statistically no easier on matched seeds. A suitably upgraded configuration must remain capable of contesting later levels.

The compiler:

- computes any level directly;
- never loops once per prior level;
- never allocates per level;
- never increases world resolution;
- never creates an unbounded event list;
- never puts arbitrary-precision arithmetic in tick loops;
- always produces finite coefficients;
- preserves minimum telegraph fairness;
- records a stable version/hash.

Per-world event count, event footprint, run duration, History, traces, and snapshots remain bounded regardless of level.

## 7. Evolution topology and level semantics

Evolution remains a frequency-5 geodesic sphere with exactly:

- 252 cells;
- 750 boundaries;
- 12 pentagons;
- 240 hexagons;
- six connected 42-cell affinities: Fertility, Freshwater, Scarcity, Cryogenic, Marine, and Luminous.

Every cell has an exact non-negative level:

- level 0: not unlocked;
- level 1: first unlock and current authored identity;
- level 2+: repeatable upgrade;
- no gameplay maximum.

The canonical persisted level vector is stable-ID ordered, duplicate-free, compact, exact, and deterministic. Level 0 is normalized away. Compilation is O(252) plus bounded work independent of level magnitude.

### Purchase eligibility

Level 0 → 1 requires:

- enough Echoes; and
- at least one directly adjacent level-1-or-higher cell.

The six roots retain the fresh-save bootstrap exception.

Level 1 → 2 and later require:

- the cell already has a positive level; and
- enough Echoes.

No hidden run count, observed-world count, all-parent, Trophy, experience, or random gate is allowed.

A purchase raises exactly one cell by exactly one level, charges exactly one cost, and records old/new level. Duplicate, stale, retried, or reordered commands must not double-charge or double-level.

### Level-one compatibility

Level 1 preserves the present authored effect/unlock and current early balance wherever practical.

- Fresh World Potential remains about 16,000.
- A first root remains about 19,000.
- All 252 cells at level 1 remain approximately the former 1,200,000-potential milestone.
- Existing build activation, habitat access, transformations, and old save meaning remain recognizable.

“All 252 cells at level 1” is **breadth complete**, not full/final Evolution.

### Repeat-level effects

Later levels remain meaningful but do not multiply raw traits without bound.

Use versioned, composable curves for:

- bounded direct scalar refinement;
- pressure resistance;
- conditional magnitude/threshold/duration;
- habitat use efficiency/reliability after level-1 unlock;
- build mastery;
- worldmaking capacity;
- periodic generic milestones;
- World Potential and SCORE.

Flags/unlocks are never blindly duplicated. Scalar/conditional/additive/resonance/keystone/capstone nodes each have explicit later-level semantics.

Direct ecology remains finite and extinction remains inevitable. No level creates permanent invulnerability, infinite resources, negative costs, or an immortal powered world.

### Cost and mastery

Level 1 retains the authored base cost. Later costs use one documented, exact, monotone, superlinear, directly computable, unlimited curve.

The curve must encourage both breadth and depth:

- one cheap root cannot dominate every strategy;
- repeated levels remain attainable in long campaigns;
- no permanent economy stall;
- no geometric accident that makes the next purchase effectively impossible;
- no flat curve that trivializes progression.

Build activation retains level-one breadth requirements. Each build also has unlimited mastery derived from multiple relevant cell levels. Multi-affinity mastery must require breadth; one repeatedly upgraded cell cannot supply the whole recipe.

Build rank 1 approximates the current active build. Higher ranks provide bounded refinement, visible pressure resistance, transformation capacity, and presentation milestones. Builds remain mechanically distinct at deep progression.

## 8. Evolution interaction contract

The Evolution cell itself is a purchase control as well as a selection target.

Required state machine:

1. Activating an unselected cell selects it and opens/focuses detail.
2. That same physical activation never purchases.
3. A selected purchase-ready cell receives a conspicuous whole-cell ready state.
4. A later discrete activation of the same selected ready cell purchases exactly one level.
5. Activating the same selected non-ready cell keeps detail open and announces the stable reason.
6. Activating a different cell changes selection without purchasing the old cell.
7. Close and Escape close detail.
8. Blank taps never purchase.
9. Drag, pinch, wheel, inertia, cancellation, or movement beyond tap threshold never count as purchase activation.
10. Stale expected-level/meta revisions are rejected.
11. After purchase, the cell stays selected and shows the new level/next cost.
12. One discrete activation buys at most one level.
13. Pointer, touch, keyboard, hidden semantic tree, and explicit button use the same transaction authority.

The obsolete behavior “selecting the already-open Evolution cell closes it” is forbidden.

### Ready presentation

A selected purchasable cell must look inviting without relying only on color:

- brighter affinity material;
- distinct inset/core;
- outline, relief, or pattern;
- restrained pulse under normal motion;
- static high-contrast alternative under reduced motion;
- explicit status text;
- accessible action name;
- visible current/next level and exact/formatted cost.

Distinguish locked, reachable-unaffordable, ready-unselected, ready-selected, owned-unaffordable-next, owned-ready-next, selected-owned-ready, and recently upgraded states.

The detail button remains visible for owned cells and reads `Unlock Level 1` or `Upgrade to Level N+1`. It must remain usable in short landscape, portrait mobile, safe-area layouts, and 200% text.

Color is never the sole status cue.

## 9. Progression arithmetic

No progression value may silently exceed JavaScript integer safety.

Use a small shared exact-value boundary. Preferred implementation:

- runtime `bigint` for exact non-negative integers between worlds;
- canonical base-10 strings at JSON, storage, History, import/export, agent protocol, diagnostics, and hashes;
- bounded fixed-point projections for finite coefficients;
- stable engineering/scientific display formatting.

A materially better representation is allowed only with documented evidence and equivalent invariants.

Never serialize raw `bigint`. Never call `Number()` on an arbitrary persisted level, cost, Echo balance, score, potential, or exponent. Never emit NaN, Infinity, negative overflow, scientific-notation parse ambiguity, leading-zero ambiguity, or locale-dependent hashes.

Finite document-byte and malformed-input bounds are required for security. They are not gameplay caps.

Exact/magnitude operations and formatting stay out of simulation and render hot loops.

Tests cover malformed values, canonicalization, exact debit/credit, deterministic hashing, `2^53` boundaries, very large decimal values, and repeated round trips.

## 10. World Potential, SCORE, Echoes, and ranks

World Potential is versioned, monotone, breadth/depth-aware, and has no terminal anchor.

- Fresh: about 16,000.
- First root level 1: about 19,000.
- Breadth-complete level 1: about 1,200,000.
- Later levels continue increasing.
- One early purchase never creates an order-of-magnitude jump.

SCORE has one production implementation shared by HUD, Result, History, audits, and fair agent play.

- Live SCORE is monotone nondecreasing.
- Result introduces no surprise correction.
- Quality comes from cumulative authoritative accomplishments.
- Environment credit requires meaningful exposure/performance; instant high-level death is not an optimal farm.
- Camera, UI, speed, quality, frame rate, renderer, developer mode, and open panels never affect SCORE.
- Fresh final SCORE remains roughly 8,000–15,000.
- A normal first-root next-world SCORE remains roughly 10,000–20,000.
- Breadth-complete level-one strong SCORE remains roughly 850,000–1,100,000.
- Later progression is uncapped in model and display-safe.

Ranks continue procedurally or through an unlimited tier/cycle after named onboarding ranks. Do not end permanently at one finite rank.

Echo balances, total earned, costs, and transactions are exact non-negative values. Reward growth is smooth, quality-gated, resistant to one-run explosions, and tuned so long fair campaigns continue purchasing.

Old SCORE models and bests remain readable legacy records and never block current-model bests.

## 11. Builds, worldmaking, and REACH 100%

Maintain many mechanically distinct, combinable builds, including viable paths for:

- sustainability;
- freshwater;
- scarcity/reclamation;
- cryogenic survival;
- marine use;
- Luminous/bioelectric infrastructure;
- mixed world gardening.

Retain and refine coherent recipes such as lake gardens, circular metabolism, wasteland reclamation, cold dormancy, cryolakes, brine harvesting, pelagic colonies, littoral succession, bioelectric wetlands, hydrothermal power, depletion bloom, lake-to-light systems, and illuminated biospheres.

Transformations are whole-cell, deterministic, conservation-aware, resource-consuming, visible, and bounded.

`REACH 100%` remains an explicit late goal:

- every authoritative world cell alive simultaneously;
- for the documented minimum interval;
- impossible for fresh saves;
- possible on some valid late configurations;
- rare;
- followed by extinction;
- never made automatic or permanent by unlimited levels.

## 12. Trophies

The Trophy Sphere remains a read-only recognition system with 96 meaningful Trophy cells unless a separate explicit product decision changes the catalog.

Trophies consume completed authoritative facts. They never change simulation, Environment pressure, World Potential, SCORE, Echo rewards, Evolution costs, or purchase eligibility.

Criteria must use current explicit concepts. Replace finite “full Evolution” assumptions with level-one breadth or documented mastery milestones. Legacy Trophy IDs and archived evidence remain readable but inert where retired.

## 13. Luminous and electricity contract

Electricity is authoritative whole-cell charge/infrastructure, never wires.

A world cell glows only when production authority reports actual charge/power. Owning a Luminous node without live charge does not light a cell.

Luminous levels/build mastery may improve bounded generation, storage, efficiency, viable domains, propagation through existing cellular/network mechanics, and pressure resistance. Upkeep remains real; charge decays; extinction remains possible.

WebGL2 and Canvas 2D both show:

- clear whole-cell emission;
- stronger visibility on the night side;
- bounded daytime energized material;
- charge-local variation;
- mastery-sensitive development;
- no false light at zero charge;
- no global terrain washout;
- no flicker or speed dependency;
- reduced-motion compatibility.

Prefer the existing world-cell and atmosphere draws. Do not add wire geometry or an unmeasured bloom/post-processing pass.

Result, History, Inspector, snapshots, and fair agent observations expose meaningful powered-cell/charge evidence.

Visual claims require production-backed screenshots and inspection in both renderers, not only numeric counters.

## 14. Speed and developer mode

Normal player speeds are exactly 1×, 2×, 4×, and 8×.

Explicit developer mode may expose 16×, 32×, 64×, 128×, and 256×. Developer mode is visibly marked, session-scoped or explicitly enabled, and excluded from normal preference export.

Every speed executes every authoritative tick. High-speed rendering, snapshots, History sampling, and diagnostics may be decimated; simulation may not skip work or change outcomes.

Environment/Evolution magnitude never changes this contract.

## 15. Fair agent-play contract

Maintain a machine-readable, deterministic, production-backed fair agent environment.

A fair observation exposes player-visible:

- Environment Level/frontier and pressure summary;
- exact/formatted Echo balance;
- per-cell level, next cost, eligibility, preview, mastery contribution, and neighbors;
- affinity breadth/depth;
- build activation/mastery;
- World Potential and SCORE versions;
- last Result, resources, pressure, Reach, transformations, electricity, and Trophies.

It excludes future seeds, future event schedules, RNG state, raw typed arrays, hidden vulnerability maps, and replay authority.

Actions include observing, selecting a goal, buying one Evolution level, running/retrying an allowed world, inspecting results/builds, and exporting/resetting a validated agent save.

Maintain deterministic policies for balanced, breadth-first, depth-first, cheapest, marginal-value, all six affinity specialists, major build goals, sustainability, Luminous infrastructure, harshness pushing, conservative retry, terraforming, REACH 100, diversity, random legal, and weak controls.

Use the interface for real balance work. Do not maintain a second simplified simulator.

Tournament tooling provides fixed training seeds, untouched holdout seeds, deterministic parallelism/order, bounded traces, machine-readable reports, before/after comparison, and minimized reproductions.

The coding agent should also make fair-interface decisions itself in several campaigns when its environment supports it. Never claim interactive AI play that did not occur.

Balance evidence must cover fresh, first-root, breadth-complete level one, deep levels, extreme synthetic values, fixed-build increasing pressure, under/matched/overpowered configurations, specialist diversity, purchase cadence, economy stalls, Luminous outcomes, and long soaks.

## 16. Architecture and determinism

Default dependency direction:

```text
interface → rendering → simulation → world → core
```

Simulation imports no DOM, WebGL, storage, or wall-clock presentation state. Rendering never mutates authority. Worker and fallback use the same production simulation.

Compile exact progression into finite run-start data. No arbitrary-precision value enters a per-cell/per-edge tick loop.

Same seed, Environment Level, Evolution level vector, compiler versions, and start configuration produce the same authority under every speed and Worker/fallback path.

Use isolated deterministic RNG streams. Never use `Math.random()` in authority or seeded content.

Reject stale run/session/request/generation/expected-level messages. Acknowledge every command or reject it with a stable reason.

Make extinction, abandonment, continuation, reward, Evolution purchase, Echo debit, Environment frontier change, Trophy recognition, transformation, world replacement, migration, and History append idempotent exactly once.

World replacement remains atomic:

1. first valid request wins;
2. live authority acknowledges abandonment/terminal state;
3. old timers, work, overlays, snapshots, buffers, and renderer dynamic state retire;
4. one static blank frame appears;
5. one seed/world identity/frontier attempt is reserved;
6. one new authority starts.

## 17. Persistence and migration

Validate every loaded field. Corruption degrades field by field.

Migrate idempotently:

- current 252-cell ownership → each recognized cell at level 1;
- old 642-cell mapped ownership → mapped current cell at level 1;
- duplicate legacy mappings → one level 1, not extra levels;
- exact Echo balance and total earned;
- scores/bests by version;
- World Potential/power records;
- runs and world seed cursor;
- Environment frontier;
- result transaction keys;
- Trophies/progress/queue;
- Imprints;
- bounded History;
- transformations and run evidence;
- inert archived Adaptations.

Migration never charges the player and never repeats a refund. Re-validating a current save is stable. Storage-unavailable sessions remain playable and truthfully report temporary progress.

History reads old purchase records and writes new level events with node ID, old/new level, exact cost/balance, run, and transaction evidence. History remains bounded by entries and bytes.

Browser saves and agent saves remain separate validated schemas. Import/export round-trips exact values. Crash recovery couples result, reward, History, frontier, and purchases without duplication.

## 18. Interface and accessibility

The primary scenes remain Home, World, Evolution, and Trophies.

Globe drag/pinch/wheel preserves an open detail pane. Opening a pane never moves or zooms the globe except an explicit Evolution/Trophy focus action. A different detail replaces the current detail; Close/Escape dismisses.

SCORE, ENTROPY, REACH, RESULT, Environment Level, and purchasable Evolution state are visibly interactive/legible at rest.

RESULT remains immediately after REACH and becomes the recommended terminal action. Do not duplicate navigation already present elsewhere.

All visible controls work through real pointer, touch, and keyboard input. Hidden semantic tree/grid structures stay synchronized with rendered cells.

Notifications are queued, bounded, nonblocking, and accessible.

Test:

- reduced motion;
- high contrast;
- color-vision ambiguity;
- keyboard-only;
- screen reader labels/live regions;
- touch target minimums;
- safe areas;
- short landscape;
- narrow portrait;
- 200% text;
- WebGL and Canvas.

## 19. Performance and boundedness

Measure a same-host baseline before modifying hot paths.

Required properties:

- world resolution is fixed;
- event count is bounded;
- all per-world collections are bounded;
- raw level magnitude does not affect tick complexity;
- exact arithmetic stays between worlds;
- Evolution compiles only when meta changes;
- compile caches are canonical and bounded;
- no cache entry per historical campaign state without eviction;
- renderer draw count remains exactly four for the WebGL world path;
- no unbounded per-frame object churn;
- reports and agent traces are summarized/sampled;
- no new shipped dependency without strong evidence;
- the deterministic title showcase remains generated from production modules and protected by its content/hash checks.

Release gates include:

- at least 3,000 simulation ticks/s on the audit host;
- no more than 10% median same-host regression unless explicitly justified by measured value;
- WebGL four draws;
- Canvas semantic completion;
- fresh, breadth-complete, deep-Luminous, and extreme-profile benchmarks;
- compile/cache benchmarks;
- repeated replacement;
- long agent campaign;
- 10,000-world terminal/persistence/memory soak where the audit environment permits;
- zero stale authority, duplicate transaction, nonfinite state, or listener/buffer leak.

Never gain speed by skipping authoritative ticks.

## 20. Development structure

Prefer focused pure modules, explicit schemas, versioned formulas, and canonical data.

The historical 200-line/16-child limits are maintainability heuristics, not product laws. Rebalance files/directories when boundaries become confused. Update structural checks when arbitrary numbers distort architecture. Git history is the archive; do not create graveyard directories.

Production remains browser-native HTML/CSS/ES modules. Prefer JavaScript/TypeScript and Node tooling. Avoid new shipped dependencies. Keep the no-install runtime property unless a dependency has a compelling measured benefit.

New formulas belong in one source of truth. Tests, audits, UI, docs, and agents import production implementations rather than copying them.

Keep module READMEs current enough that a weaker coding model can find:

- source of truth;
- domain invariants;
- schema;
- compiler boundary;
- formula versions;
- interaction state machine;
- agent protocol;
- performance gates;
- latest balance evidence.

Delete obsolete code and tests in the same workstream that replaces them.

## 21. Verification

Use production modules, not copied models.

Retain current gates and maintain focused endless-progression gates. Canonical coverage includes:

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

npm run audit:evolution-levels
npm run audit:environment-levels
npm run audit:luminous
npm run audit:progression-numbers

npm run agent:smoke
npm run agent:campaign
npm run agent:long
npm run balance:holdout
```

If script names differ, document the mapping and keep a coherent convention.

Required evidence includes:

- level-one compatibility;
- unlimited repeat upgrades;
- exact large-number arithmetic;
- Environment extreme direct compilation;
- fixed-build pressure monotonicity;
- economy/purchase cadence;
- build diversity;
- no instant-death farming;
- real second-activation pointer/touch/keyboard behavior;
- selected-ready visual states;
- Luminous day/night/decay/WebGL/Canvas evidence;
- migration matrix and crash recovery;
- Worker/fallback and all-speed replay equality;
- repeated world replacement;
- bounded memory/cache/History/report state;
- training and holdout agent campaigns;
- performance before/after.

A skipped test is not a pass. A mocked click is not real pointer evidence. A counter is not visual evidence. A synthetic simplified simulator is not production balance evidence. Physical-device claims require a physical device.

## 22. Balance release expectations

Preserve early targets:

- fresh SCORE approximately 8,000–15,000;
- first-root next-world SCORE approximately 10,000–20,000;
- ordinary fresh duration approximately 270–330 game seconds;
- terminal near 360 seconds;
- first campaign resolution approximately 18–24 minutes at 1×;
- breadth-complete level-one strong SCORE approximately 850,000–1,100,000.

Deep balance is multi-objective:

- higher Environment Level is not easier for a fixed build;
- matching Evolution can contest later levels;
- extinction remains;
- no permanent economy stall;
- breadth and depth both matter;
- specialist builds remain distinct;
- no one cell supplies a multi-affinity mastery;
- reasonable long policies keep purchasing;
- high-level immediate death is not optimal;
- resources conserve;
- `REACH 100%` remains rare/non-immortal;
- Luminous investment creates meaningful powered ecology;
- performance remains bounded.

Use fixed training cohorts and untouched holdout cohorts. Report distributions, not anecdotes. Record exact seeds/policies/configs for failures and minimize reproductions.

## 23. Git, CI, deployment, documentation, and completion

Make coherent, bisectable commits. Preserve history. Never force-push unless explicitly ordered and the consequences are understood.

Update README, focused docs, this file, and `docs/status.md`. Documentation follows implemented truth. Remove finite claims such as total Evolution cost, maximum power, maximum potential, maximum SCORE, or “full Evolution” unless clearly labeled as the level-one breadth milestone or historical evidence.

Verify branch/upstream, pushed commits, Actions, Pages, cache-busted public bytes, and the exact reviewed revision. Exercise the deployed build when network/browser access permits. State limitations honestly.

A task is complete only when requested behavior works in the actual product and all affected layers agree:

- authority;
- Worker/fallback;
- UI and interaction;
- WebGL/Canvas rendering;
- persistence/migration/crash recovery;
- History;
- SCORE/Echo economy;
- Environment frontier;
- Evolution compilation;
- builds/worldmaking/Luminous;
- Trophies;
- fair agent play;
- balance audits;
- performance/memory;
- docs;
- Git/CI/Pages when in scope.

Final reports include starting/final commits, root causes, formulas/schema versions, measured distributions, agent cohort sizes and holdout outcomes, migration evidence, exact commands/results, browser/visual/accessibility evidence, benchmark/draw/heap/cache results, push/CI/Pages/deployed revision, limitations, and next actions.
