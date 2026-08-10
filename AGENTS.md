# AGENTS.md — Cell Sphere Game Repository Contract

> Revision: 2026-08-10
> Scope: the entire `lkjsxc/cell-sphere-game` repository unless a narrower
> `AGENTS.md` supplies a genuinely local rule.
> Status: this is the target contract. Current code, tests, reports, and
> documentation may lag behind it and must be migrated toward it.

## 1. Instruction authority

- Follow platform and execution-environment instructions first.
- Follow the user's current explicit request and corrections second.
- Follow this repository contract third.
- Treat current source, tests, schemas, measurements, and deployment as evidence, not as
  higher authority than a current product correction.
- Treat old prompts, status snapshots, screenshots, migrations, and legacy records as
  historical evidence only.
- A later user correction overrides an earlier one. In particular, activating ENV LEVEL opens
  History; it does not open a separate metric-detail surface.
- Never preserve a rejected behavior merely because tests, schemas, or documentation currently
  protect it.
- Never report a command, browser interaction, visual result, benchmark, deployment, or
  physical-device check that did not actually occur.

## 2. Repository identity

- Product and package name: `cell-sphere-game`.
- Repository: `lkjsxc/cell-sphere-game`.
- Public site: `https://lkjsxc.github.io/cell-sphere-game/`.
- Tagline: `Every extinction becomes memory.`
- Public scene names are `HOME`, `WORLD`, `EVOLUTION`, and `TROPHIES`.
- Public progression terms include World, Environment Level, Evolution, Echoes, SCORE, REACH,
  Trophies, and Luminous.
- Do not expose `Memory`, `World Potential`, `Modeled SCORE range`, `Entropy`, crisis
  terminology, or retired Adaptation terminology as current product concepts.

## 3. Product north star

- Build a calm, legible, deterministic, browser-native incremental ecology on a living
  cellular sphere.
- The organism grows autonomously. The player observes a world, learns from extinction, spends
  Echoes in Evolution, and starts another world.
- Early worlds are fragile and short because reproduction is weak, accessible habitat is
  narrow, and finite local resources run out.
- Evolution should make later worlds measurably more capable, usually extending survival and
  allowing life to occupy less immediately rich habitats.
- Environment Level starts at 0 in every world, rises with authoritative time inside that
  world, has no designed maximum, and resets to 0 for the next world.
- Early and middle extinction should be explained primarily by finite-resource exhaustion and
  the maintenance deficit that follows it.
- Later extinction may increasingly reflect chronic environmental pressure, but the game has
  no discrete natural-disaster or crisis system.
- The world remains visually cellular. A whole world cell is the smallest authoritative
  geography, ecology, transformation, and electricity unit.
- The experience should communicate through the sphere, a small HUD, bounded notifications,
  Result, Evolution, Trophies, and History rather than permanent diagnostic panels.

## 4. Canonical loop

```text
start a new world at Environment Level 0
→ life establishes in a rich local niche
→ finite nearby resources support a bounded expansion
→ reachable stock thins and cells begin to starve
→ Environment Level rises if the ecology survives long enough
→ extinction records realized performance
→ Result grants Echoes and recognizes Trophies
→ the player raises one Evolution cell by one level
→ the next world starts again at Environment Level 0
→ stronger Evolution usually survives farther
```

## 5. Explicitly rejected product concepts

- No active natural disasters, random crises, event director, crisis telegraphs, crisis
  survival, harmful event onboarding exception, or crisis-specific upgrades.
- No World Potential or equivalent pre-run global power index.
- No Modeled SCORE range or any other forecast of a theoretical future score.
- No public Entropy metric, Entropy button, Entropy detail pane, or Entropy score component.
- No persistent in-world resource meter, reserve percentage, resource card, or resource
  diagnostic rail in normal play.
- No separate Event Log surface and no collapsed `Event Log preview` in History.
- No `Focus available` control in Evolution.
- No Evolution-scene History control.
- No `Focus Trophy` control in Trophies.
- No Trophy-scene History control.
- No six-root fresh-save bootstrap.
- No procedural filler Evolution cells whose primary purpose is to occupy topology.
- No backward-compatibility work for old saves, old Evolution IDs, old World Potential
  records, old crisis records, or old schemas unless the user explicitly reverses this
  decision.
- No hidden run-index buffs, adaptive difficulty, pity multipliers, or scripted survival
  grants.
- No new framework, state manager, event bus, rendering engine, dependency-injection
  container, design-system rewrite, or generalized simulation abstraction without direct
  measured necessity.

## 6. Engineering posture

- Prefer deletion and direct replacement over compatibility layers.
- Prefer one clear authority over mirrored models.
- Prefer existing typed arrays, pure functions, native ES modules, WebGL2, Canvas 2D, DOM, and
  Node tooling.
- Keep the shipped runtime dependency-free unless a new dependency has a compelling measured
  benefit that cannot be achieved simply in the repository.
- Do not create architecture for imagined future requirements.
- Do not retain dead concepts under new names.
- Do not solve a presentation complaint by introducing a cross-application framework.
- Do not solve balance by hard-coded run numbers, fake timeouts, or result-time corrections.
- Do not solve performance by skipping authoritative ticks or reducing deterministic
  correctness.
- A local straightforward edit is better than a reusable abstraction used once.
- A shared abstraction is justified only when it removes real duplication across stable
  semantics.
- Optimize the measured bottleneck after profiling; do not rewrite the renderer because DOM
  reconstruction is slow.

## 7. Proportional work protocol

- Inspect the worktree, branch, remotes, current HEAD, recent commits, and uncommitted work
  before substantial changes.
- Never reset, discard, overwrite, or reformat unrelated work.
- Read the nearest applicable instructions and the relevant production source before editing.
- Reproduce a reported problem when feasible before assigning a cause.
- For a simple local change, write no planning document unless it adds real value.
- For a medium change, keep a concise checklist in the active prompt, issue, or one work note.
- For a cross-cutting migration, one `docs/work/<slug>/status.md` may hold scope, decisions,
  current state, verification, and next actions.
- Split a work note only when the content itself becomes difficult to navigate; never create a
  quota of planning files.
- Do not start a broad migration from an untested assumption.
- Do not spend a turn producing only plans when a coherent verified vertical slice can be
  completed.
- When a multi-turn effort must stop, leave the repository buildable if practical and record
  the exact completed slice, failures, and next command.
- Revisit the plan when measurements disprove it.

## 8. Architecture boundaries

- `core/` contains deterministic primitives and must not depend on higher layers.
- `world/` owns immutable topology and static generated geography.
- `game/` owns durable content, formulas, Evolution, SCORE, Trophies, and balance policy.
- `simulation/` owns authoritative run-state evolution and may consume `core/`, `world/`, and
  `game/`.
- `rendering/` reads immutable snapshots and never mutates simulation authority.
- `interface/` owns DOM, navigation, input intent, presentation queues, and composition.
- `platform/` owns storage, settings, capability, lifecycle, and deployment adapters.
- `agent/` exposes a fair projection and actions backed by the production model.
- Worker and fallback use the same production simulation.
- Simulation imports no DOM, storage, WebGL, wall clock, or frame-cadence state.
- Rendering and UI never determine SCORE, resources, Environment Level, growth, death, or
  trophies.
- Avoid circular imports and copied formulas.
- Keep `main.js` and other composition roots small enough to reveal wiring.

## 9. Deterministic authority

- The same immutable start configuration must produce the same authoritative result under
  Worker and fallback.
- Normal speed, developer speed, frame cadence, rendering backend, camera, open surfaces, tab
  visibility, and pause timing must not change the simulated outcome.
- Every requested authoritative tick executes exactly once.
- Use seeded isolated random streams where randomness is part of world generation or
  autonomous ecology.
- Never use `Math.random()` in authority.
- Use bounded state; no array, cache, log, or queue may grow with total campaign age or
  Environment Level without an explicit cap.
- Commands that debit Echoes, raise Evolution, append a Result, or award a Trophy must be
  idempotent.
- Reject stale world identity, request generation, expected Evolution level, meta revision,
  and result transaction keys.

## 10. Environment Level

- Every world begins at exact Environment Level 0.
- Environment Level is derived only from authoritative elapsed simulation ticks and one
  versioned schedule.
- The level is monotone within a world and resets for the next world.
- There is no designed maximum, finite content table ending at a last level, or per-level
  allocation.
- Compute the schedule directly in O(1) or O(log magnitude).
- Evolution changes the ecology's response to pressure, not the public level clock.
- A fixed tick shows the same public Environment Level for every build.
- Level transitions may change bounded chronic coefficients such as renewal, maintenance,
  recovery, temperature drift, moisture loss, toxicity, and attrition.
- Level transitions do not spawn disasters, regenerate geography, refill stock, move life, or
  transform ocean globally.
- Activating ENV LEVEL opens History for the current world and emphasizes Environment records.
- Environment transitions produce bounded accessible notifications.

## 11. Chronic pressure without disasters

- Challenge is continuous and spatially grounded, not a sequence of named calamities.
- Remove production concepts for active events, future event schedules, event footprints,
  crises, telegraphs, and crisis endurance.
- Do not replace disasters with a differently named random incident system.
- The opening is governed mainly by local richness, reproduction cost, maintenance, finite
  reserves, and renewal.
- Later pressure should alter finite coefficients smoothly enough to remain readable.
- The world can still have semantic timeline records such as germination, Environment
  transition, resource strain, first lake, first powered cell, Trophy earned, and extinction.
- A semantic timeline record has no gameplay effect merely because it was recorded.
- DOM `Event` objects and ordinary event listeners are unrelated to the rejected
  gameplay-event concept and need no cosmetic renaming.

## 12. Finite-resource ecology

- Keep resources authoritative, local, finite, conservation-audited, and visible through
  terrain and cell condition.
- Fresh life should establish in a genuinely rich niche and should not freely cross poor
  cells.
- A fresh build should usually run out of reachable stock before it can colonize broadly.
- Resource renewal remains bounded and cannot create an immortal ecology.
- Evolution may improve uptake efficiency, maintenance, storage, recycling, recovery, and
  access to poorer habitats.
- Early and middle resource exhaustion must be a real causal outcome, not a Result label
  forced by a timer.
- Cause attribution should use accumulated evidence and reachable stock, not only an arbitrary
  final-cell branch order.
- Do not expose a permanent global resource percentage in normal play.
- Keep qualitative local resource rendering and optional contextual inspection where it
  supports understanding.
- Use a small number of deduplicated resource notifications for meaningful thresholds; never
  notify for every cell.

## 13. Balance direction

- The old approximately 270–330 second fresh-world contract is rejected.
- Use measured cohorts rather than one universal duration constant.
- A provisional fresh no-Evolution target is a median of approximately 45–90 game seconds,
  with enough lower-bound protection to show germination and a visible attempt at expansion.
- A first-root build should normally survive longer than fresh on paired seeds.
- A canonical early-ring progression should show a statistically meaningful upward survival
  trend.
- Early variation is allowed, but stronger canonical generalist cohorts must not be
  indistinguishable from fresh cohorts.
- In fresh and early cohorts, resource exhaustion should be the dominant extinction cause,
  with a provisional target of at least 65% unless measured causal evidence supports a nearby
  threshold.
- Middle progression should still have resource exhaustion as a plurality or major cause
  before chronic Environment pressure becomes dominant.
- No finite Evolution configuration is immortal.
- No rewarded universal timeout is normal gameplay.
- External audit budgets produce incomplete reward-free runs, not fake extinctions.

## 14. Evolution sphere

- The target Evolution sphere is a frequency-3 geodesic sphere with 92 cells unless direct
  implementation evidence demonstrates a simpler equally legible geodesic alternative before
  migration.
- Do not retain 252 cells merely for compatibility.
- Every current Evolution cell is authored and mechanically meaningful; do not generate filler
  Resonance names to occupy space.
- There is one fresh-save starting cell.
- The canonical starting cell is a major establishment and reproduction ability, provisionally
  named `First Division`.
- A fresh save cannot begin from Marine, Luminous, Cryogenic, Freshwater, Scarcity, or another
  independent root.
- The cells directly adjacent to the root are major general survival abilities covering
  reproduction, efficient uptake, maintenance, reserve, and stable local expansion.
- Specialized affinities emerge beyond the opening neighborhood.
- Fertility, Freshwater, Scarcity, Cryogenic, Marine, and Luminous may remain as coherent
  content identities without each owning a bootstrap root.
- Orient the fresh Evolution camera so the sole root and its immediate neighborhood are
  immediately discoverable.
- Use stable current IDs for the new graph, but do not migrate old IDs.

## 15. Evolution levels and economy

- Every Evolution cell has exact Level 0, Level 1, and repeatable Level 2+ semantics.
- There is no gameplay maximum level.
- A purchase raises exactly one cell by exactly one level and charges exactly one exact cost.
- Level 0 to 1 requires adjacency to an owned cell, except for the one root on a fresh graph.
- Level 1+ upgrades require ownership and enough Echoes.
- Use a direct monotone superlinear exact cost curve.
- Do not use World Potential, evolution power, or a predictive global rating in the cost
  formula.
- Repeated levels strengthen the cell's actual mechanic through documented bounded or
  sublinear curves.
- No level creates infinite resources, negative maintenance, invulnerability, permanent full
  charge, or immortality.
- Early rewards should usually afford the root after the first completed world.
- Early progression should offer a meaningful purchase roughly every world or two without
  forcing a fixed reward.
- Costs should encourage opening the early neighborhood before endlessly deepening only the
  root, without an arbitrary breadth gate.

## 16. Evolution interaction

- The first activation of an unselected Evolution cell selects it and opens detail.
- The same activation never also purchases.
- A later discrete activation of the same selected purchasable cell raises it by one level.
- Drag, pinch, wheel, inertia, cancellation, or movement beyond the click threshold never
  purchases.
- A selected purchasable cell must look inviting through brightness, material, inset/core,
  outline or pattern, and explicit text rather than color alone.
- Normal motion may use a restrained pulse; reduced motion uses a static high-contrast state.
- After purchase, keep the cell selected and show the new level and next cost.
- The explicit Upgrade button and direct second activation use the same transaction authority.
- A stale expected level or meta revision is rejected without a debit.
- Do not rebuild the full semantic tree or compile every before/after preview for a selection
  change.

## 17. SCORE and Echoes

- SCORE is based only on realized authoritative outcomes.
- Delete World Potential and Modeled SCORE range rather than hiding their labels.
- Do not replace them with `Build Power`, `Expected SCORE`, `Projected Strength`, or another
  predictive aggregate.
- Evolution affects SCORE only by changing what the ecology actually accomplishes.
- SCORE is monotone nondecreasing while a world is live.
- Result must not apply an unexplained correction to the live SCORE.
- Useful components may include actual endurance, presence, exploration, coherence,
  stewardship, quality under Environment pressure, recovery, transformations, and powered-cell
  time.
- Do not reward raw wasteful resource consumption as stewardship.
- Do not reward instant high-level death farming.
- Version every semantic formula change.
- Keep arbitrary-precision work out of per-cell and per-edge hot loops.
- Echo rewards should support continued purchases without one-run explosions or permanent
  stalls.

## 18. World HUD and Result

- The normal World HUD order is SCORE, REACH, ENV LEVEL, and RESULT when Result exists.
- RESULT is always last in that row.
- Remove the public ENTROPY control and value.
- ENV LEVEL is a real accessible button whose action opens History.
- Do not add a permanent resource control.
- The extinction RESULT control should use the same restrained action family as an available
  Upgrade or other secondary action.
- Do not style RESULT as an urgent gold primary call to action.
- Remove oversized glow, entry pulse, or recommendation semantics from the RESULT control.
- Result detail remains the place for SCORE, survival time, achieved Environment level, cause,
  Echoes, Trophies, and powered ecology.
- Result actions are ordered `Next World`, `Evolution`, `History`.
- `Next World` is primary, `Evolution` is secondary, and `History` is quiet or secondary.
- The Evolution action opens Evolution with post-world purchases available.

## 19. Scene controls

- Evolution scene actions contain only `Next World` when applicable and `Menu`; normal scene
  selection remains available globally.
- Remove `Focus available` from markup, JavaScript, CSS, keyboard behavior, tests, and
  documentation.
- Remove the Evolution-scene History button.
- Trophy scene actions contain only `Next World` when applicable and `Menu`; normal scene
  selection remains available globally.
- Remove `Focus Trophy` from markup, JavaScript, CSS, keyboard behavior, tests, and
  documentation.
- Remove the Trophy-scene History button.
- Do not leave hidden dead controls for compatibility.
- Opening or closing a surface must not move or zoom the globe unless the user explicitly
  selects a cell.

## 20. History and notifications

- History is the one durable temporal surface.
- Remove the separate Event Log surface and its controller, menu action, styles, tests, and
  source module.
- Remove the collapsed `Event Log preview` details block.
- An always-visible bounded History timeline may remain if it is part of History itself and is
  not presented as a second log.
- ENV LEVEL opens the current world in History, filters or emphasizes Environment records, and
  seeks to the most recent relevant transition when one exists.
- Result History opens the terminal current world.
- History remains bounded by entries and bytes.
- Use the existing timed presentation queue as the starting point for transient notifications.
- Notifications are nonblocking, bounded, deduplicated, accessible, and presentation-only.
- Notify Environment Level increases.
- Notify newly earned Trophies, aggregating multiple awards when appropriate.
- Notify a small number of meaningful resource-strain, transformation, Luminous, and
  extinction milestones.
- Do not restore a permanent current-event card after removing the gameplay-event system.

## 21. Clock

- The hour hand and minute hand use approximately the same stroke width.
- They may retain different lengths and colors.
- Both hands continue to move under full and reduced motion.
- Their movement follows authoritative world time and selected speed.
- A CSS-only correction is preferred unless measurement reveals a different cause.

## 22. Luminous

- Living cells have a subdued readable night-side presence even without Luminous.
- Authoritative Luminous charge makes cells materially brighter than that baseline.
- The intended impression is clustered planetary night illumination, expressed through whole
  cells rather than roads, wires, or fake city geometry.
- A first meaningful Luminous unlock must produce a visible production difference in an
  attainable world.
- Later Luminous levels may improve bounded generation, retention, efficiency, viable domains,
  transformation support, and visual development.
- Charge requires viable biology and real upkeep.
- Charge decays and clears after extinction.
- Zero charge must not display the Luminous-specific powered material.
- Night-side contrast is strong; day-side energized material is restrained but readable.
- WebGL2 and Canvas 2D must communicate the same semantic states.
- Prefer the existing world-cell shader and Canvas overlay paths; do not add wire geometry or
  a new post-processing pipeline without measured necessity.

## 23. Ocean and local transformation

- The first authoritative and first rendered state of every world preserves the generated
  ocean.
- No Evolution build may pre-transform, dry, reclaim, or recolor ocean at world creation.
- `effectiveBiome` starts as an exact copy of static biome data and all transformation
  progress starts at zero.
- Biological coastal transformation requires sustained local living occupation, adjacency,
  energy, and resources.
- Influence spreads only through neighboring cells from active biology.
- The visual progression should resemble local soaking or staining, with intermediate
  whole-cell states before a final wetland or maritime-forest state.
- Do not globally replace shallow ocean because a build is owned.
- Do not mutate immutable base geography.
- Test tick 0 and early visible frames across many seeds and relevant builds.

## 24. Trophies

- Trophies are read-only recognition and never alter simulation, SCORE, Echoes, Environment
  Level, Evolution cost, or eligibility.
- Remove crisis-, disaster-, and harmful-event-dependent Trophy criteria.
- Reauthor affected cells around actual resource endurance, Environment exposure, geography,
  transformations, Luminous, Evolution, and rare REACH outcomes.
- Do not retain legacy Trophy IDs or migration tables solely for backward compatibility.
- Keep the catalog meaningful; do not protect a count by filling it with trivial criteria.
- Opening Trophies performs no redundant persistence reconciliation when authoritative data
  has not changed.

## 25. Persistence and schema changes

- This project currently accepts a clean break.
- Create one clean current storage namespace and schema.
- Old or mismatched documents become a fresh default or a clear rejected import; they are not
  migrated.
- Delete old Evolution ID maps, World Potential records, crisis records, legacy Adaptation
  migration, legacy Environment-frontier migration, refund machinery, and compatibility tests
  that no longer serve current data.
- Continue validating every current field and degrading corrupt current data safely.
- Keep exact decimal strings at JSON and storage boundaries for unbounded progression values.
- Keep Result application, Echo debit, Evolution purchase, History append, and Trophy
  recognition exactly once.
- Bump only contracts whose semantics actually change, but do not avoid necessary version
  changes.
- Current exports round-trip current data exactly; old exports may be rejected.

## 26. Performance

- Profile before broad optimization.
- Evolution and Trophies should react as promptly as Home and World on warm scene entry.
- Compile Evolution once per relevant meta revision, not once per cell preview.
- Compute a detailed before/after preview only for the selected cell or an explicit on-demand
  request.
- Build hidden semantic controls once and patch state; do not replace all controls on every
  selection.
- Use event delegation where it simplifies hundreds of stable controls.
- In Trophies, patch the prior and next selected cells rather than rebuilding all 96 buttons
  for keyboard navigation.
- Reconcile and save Trophy state when authoritative data changes, not merely because the
  scene opened.
- Do not cache multiple live renderer stacks or add a scene framework before the measured DOM
  and compilation costs are fixed.
- Keep per-frame allocations bounded.
- Do not add draw passes for Luminous unless measured evidence demonstrates that existing
  passes cannot satisfy the visual contract.
- Preserve or improve simulation throughput after removing event authority.
- Use relative same-host measurements and distributions, not one brittle CI timing assertion.

## 27. Accessibility and responsive behavior

- All controls meet the existing touch-target minimum.
- Keyboard, pointer, touch, screen reader labels, high contrast, reduced motion, safe areas,
  narrow portrait, short landscape, and 200% text remain supported.
- Color is never the only signal for Evolution eligibility, resource condition, Luminous
  power, or selection.
- The selected ready Evolution cell has an explicit accessible action name and current/next
  level.
- Removing controls must also remove stale tab stops, ARIA relationships, shortcuts, and
  live-region messages.
- Notifications use a bounded polite live region and do not steal focus.
- History opened from ENV LEVEL receives an appropriate heading or selected-record focus
  without trapping focus.

## 28. Verification strategy

- Run focused tests after each coherent edit.
- Run the full relevant unit and integration suites after each cross-layer vertical slice.
- Run browser interaction tests for actual pointer, keyboard, scene, History, Result,
  Evolution, and Trophy behavior.
- A mocked function call is not evidence for a visual or pointer interaction.
- A counter is not evidence for a visual Luminous result.
- Use production modules in audits; do not create a simplified duplicate simulator.
- Use fixed training seeds and untouched holdout seeds for balance.
- Report distributions, paired-seed deltas, extinction causes, incomplete budgets, and exact
  policies.
- Add a no-disaster audit that verifies removed production imports, fields, UI, content, and
  results without banning ordinary DOM events.
- Update or remove obsolete event, potential, compatibility, crisis, and 270–330-second gates.
- Run benchmark and bounded-memory checks after hot-path changes.
- A skipped test is not a pass.

## 29. Preferred command progression

```bash
npm run test:unit
npm run test:integration
npm run balance:smoke
npm run benchmark
npm run check:structure
npm run check:links

npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback

npm run audit:resources
npm run audit:freshwater
npm run audit:score-trace
npm run audit:transformations
npm run audit:reach100
npm run audit:lakes
npm run audit:habitats
npm run audit:evolution-levels
npm run audit:environment-levels
npm run audit:luminous
npm run audit:progression-numbers
npm run audit:trophies
npm run audit:campaign

npm run agent:smoke
npm run agent:campaign
npm run balance:holdout
npm run verify
```

Command names may change as rejected systems are removed. Keep `package.json`, scripts,
documentation, and CI coherent rather than preserving obsolete names.

## 30. Documentation

- Documentation describes implemented truth, not aspirations presented as completed work.
- Update the root README, relevant module READMEs, gameplay/design docs, balancing docs,
  testing docs, agent docs, and dated status evidence when their claims change.
- Delete normative claims about disasters, World Potential, Modeled SCORE range, Entropy UI,
  six roots, 252 Evolution cells, compatibility migrations, and the 270–330-second fresh
  target.
- Keep historical evidence clearly labeled if it remains useful; Git history is the primary
  archive.
- Do not create graveyard directories or duplicate design documents.
- A short current status note is preferable to a sprawling hierarchy of speculative plans.

## 31. Git, CI, and deployment

- Make coherent, bisectable commits.
- Do not force-push unless explicitly ordered and the consequences are understood.
- Do not include unrelated formatting or generated noise.
- Before claiming completion, verify the pushed commit and relevant Actions.
- When deployment is in scope, verify the exact Pages revision and cache-busted deployed
  bytes.
- State network, browser, CI, device, or deployment limitations honestly.

## 32. Definition of done

- All affected production layers agree on the same current semantics.
- Rejected controls and concepts are deleted rather than visually hidden.
- Every world visibly begins with intact generated ocean and Environment Level 0.
- Fresh and early paired cohorts demonstrate the intended resource-limited progression.
- Canonical Evolution progression demonstrates increasing survival distributions.
- World Potential and modeled forecasts are absent from production, schemas, agents, UI,
  tests, and current docs.
- Natural-disaster authority and crisis-dependent content are absent.
- History and bounded notifications cover the remaining temporal communication.
- Evolution has one root and an authored compact graph.
- Luminous visibly changes production cells in both renderers.
- Evolution and Trophy scene latency is measured and materially improved.
- Unit, integration, browser, balance, audit, benchmark, and current-schema persistence
  evidence is recorded.
- The final report distinguishes completed work, measured results, known limitations, and the
  next coherent optional phase.

## 33. Final-report requirements

- Starting and final commit SHAs.
- The verified root causes rather than only changed symptoms.
- Important product and architecture decisions.
- Deleted concepts, modules, fields, controls, tests, and migrations.
- New formulas and schema versions.
- Balance cohorts, policies, seed sets, percentiles, cause shares, and paired survival deltas.
- SCORE and Echo distributions.
- Evolution purchase cadence.
- Scene-entry and interaction latency evidence.
- WebGL2 and Canvas Luminous evidence.
- Ocean tick-0 and gradual-local-transformation evidence.
- Exact commands and outcomes.
- CI, Pages, and deployed revision when performed.
- Honest limitations and next actions.
