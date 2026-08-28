# AGENTS.md

## Purpose

This file is the standing repository contract for coding agents working on `lkjsxc/cell-sphere-game`.

Read it before editing.

Read the active checkout before trusting this file about exact symbols, files, commands, versions, schemas, test counts, or deployment state.

Treat the product and authority rules here as binding until the user explicitly supersedes them.

The user authorizes substantial changes, deletion of obsolete current-only systems, and breaking internal or persisted formats when that produces a smaller coherent product.

Backward compatibility is not a default goal.

Do not preserve a weak design merely because code exists for it.

Do not use that freedom to create speculative architecture.

Choose the smallest dependency-closed system that satisfies the product contract and can be proved in the real browser and production simulation.

## Product north star

`cell-sphere-game` is a calm, deterministic, browser-native, autonomous incremental ecology played on a cellular sphere.

The player begins a World and watches life establish, spread, consume finite local resources, encounter rising environmental pressure, and eventually become extinct.

Extinction records realized performance.

Realized performance yields Echoes.

Echoes improve permanent Evolution between Worlds.

Every new World begins again at Environment Level 0 with the compiled Evolution state inherited from prior purchases.

The globe is the primary interface.

The product should remain understandable while the player simply watches.

The player should not need to tend individual cells.

The player should see cause and consequence:

1. life establishes in a favorable place;
2. growth proceeds autonomously;
3. territory and resources change visibly;
4. maintenance and scarcity create pressure;
5. the final cells disappear;
6. Result explains the outcome;
7. Echoes make one permanent decision possible;
8. the next World begins automatically unless attention interrupts the cycle;
9. the next World behaves visibly differently because of Evolution.

The World should feel alive under direct manipulation and while left alone.

The interface explains and supports the sphere. It does not compete with it.

## Product vocabulary

Use `World` for one autonomous run.

Use `game time` for authoritative fixed-step time measured in ticks or game seconds.

Use `wall-clock time` for foreground elapsed player time.

Use `animation time` for camera and UI presentation timing.

Use `Environment Level` for the unbounded within-World chronic-pressure clock.

Use `Evolution` for permanent progression between Worlds.

Use `Echoes` for permanent progression currency unless the user explicitly renames it.

Use `History` for durable observation of prior moments and completed Worlds.

Use `Result` for the terminal summary of one World.

Use `SCORE` for realized World performance.

Use `REACH` for the current or meaningfully occupied proportion of World cells according to the current scoring contract.

Use `Luminous` for the bioelectric Evolution domain.

Use `Home`, `World`, `Evolution`, and `Trophies` for the four primary scenes.

Do not reintroduce retired public terminology because an old test, schema, prompt, or historical document mentions it.

## Core product rules

The simulation is authoritative and deterministic.

Rendering is observational.

Camera state is observational.

History is observational.

UI state is observational.

Presentation speed changes wall-clock delivery of game time, not tick content.

A World begins from explicit inputs.

At minimum, those inputs include:

- seed;
- immutable compiled Evolution state;
- versioned rule constants;
- authoritative World identity.

The same inputs must produce the same authoritative result.

Every World begins at Environment Level 0.

Environment Level rises from authoritative World ticks.

Environment Level is not permanent progression.

Evolution is permanent progression.

Local resources are finite.

Renewal is bounded.

Maintenance has persistent cost.

No finite build may become literally immortal.

Extinction must remain possible under unbounded Environment Level.

The player may play indefinitely through repeated finite Worlds and unbounded Evolution levels.

Progression purchases occur between Worlds.

A purchase changes future Worlds, not the active World.

SCORE and Echoes derive from realized authoritative outcomes.

A projection supplied by UI, agent, import, or caller is not reward authority.

The globe remains cellular.

Whole cells remain the primary visible geography, ecology, transformation, and Luminous unit.

WebGL2 and Canvas 2D must communicate the same semantic state even when exact pixels differ.

Accessibility, responsive behavior, and reduced motion are product requirements.

Performance is a feature and must be measured.

## Non-goals

Do not add manual unit control.

Do not add combat.

Do not add disaster cards, scripted attacks, crisis popups, or a hidden game director.

Do not add random mid-World choice dialogs.

Do not require repetitive clicking to keep life alive.

Do not turn the game into a conventional idle spreadsheet.

Do not promise offline progress unless a separate explicit authority and persistence design exists.

Do not add offline rewards through elapsed timestamps as incidental scope.

Do not expose internal telemetry merely because it exists.

Do not create lore systems before the core loop is excellent.

Do not add a tutorial framework when concise contextual copy and behavior are sufficient.

Do not add a framework to solve ordinary DOM and ES-module problems.

Do not add an ECS without measured evidence that the typed-array model cannot meet requirements.

Do not build a second simulator for tests or agents.

Do not build a generic replay engine when bounded visual History checkpoints are sufficient.

Do not build a generic graph editor for Evolution.

Do not add a renderer pass solely to conceal a defect that can be corrected in an existing pass.

Do not add post-processing bloom merely to make Luminous visible.

Do not create compatibility layers for retired current-only formats without an active maintained consumer.

Do not maintain two authorities for the same rule.

Do not add settings instead of choosing a good default.

Do not use more UI as a substitute for clarity.

Do not generate filler content to reach an arbitrary catalog size.

## Authority map

### Simulation authority

Production `RunController` and its shared rule modules own:

- authoritative ticks;
- RNG;
- cell state;
- resources;
- reproduction;
- maintenance;
- habitats;
- transformations;
- Luminous charge;
- Environment Level;
- extinction;
- realized result facts.

Worker and fallback must use the same controller and rules.

Tests and agents must not substitute a simplified authority.

### Progression authority

The Evolution catalog, exact level state, transactional purchase path, and progression compiler own:

- reachability;
- affordability;
- levels;
- costs;
- compiled effects;
- habitat capabilities;
- future-World configuration.

The active World receives one immutable compiled configuration.

Evolution cannot mutate the active World.

### Reward authority

Terminal replay or equivalent trusted reconstruction owns settlement.

SCORE uses realized facts.

Echoes derive from trusted SCORE.

Result UI is a projection.

Agent observations are projections.

Imports are untrusted.

No caller-controlled summary may mint progression.

### Presentation authority

The app controller and narrow presentation policies own:

- scene selection;
- camera motion;
- responsive framing;
- surfaces;
- focus;
- speed selection;
- continuation presentation;
- accessible announcements;
- rendering cadence.

Presentation never changes simulation rules.

### Rendering authority

Renderers consume immutable snapshots and presentation state.

Renderers may:

- interpolate;
- shade;
- animate;
- frame;
- highlight;
- render approximate History.

Renderers may not mutate:

- simulation;
- RNG;
- SCORE;
- Echoes;
- Evolution;
- Trophies;
- History authority.

### History authority

Semantic History records authoritative observations and completed-World facts.

Visual History is a bounded approximate rendering aid.

Visual History is not a simulation save.

History playback never changes the live World.

A historical label and historical globe state must switch atomically.

### Persistence authority

Narrow platform modules own storage validation, versioning, transactions, namespace boundaries, and current-only reset.

UI modules do not write arbitrary storage documents directly.

## Engineering posture

Prefer deletion over adaptation when an old abstraction encodes the wrong product.

Prefer direct data flow over indirection.

Prefer explicit state machines over scattered booleans.

Prefer one owner for each rule.

Prefer one owner for each surface.

Prefer one owner for each scroll region.

Prefer one source of truth for each formatted metric.

Prefer immutable snapshots at authority boundaries.

Prefer pure functions for schedules, scoring, progression compilation, codecs, validation, geometry, and presentation projections.

Prefer typed arrays and reusable buffers in hot paths.

Prefer bounded ring buffers over growing arrays.

Prefer relative visual measurements over exact cross-GPU screenshot hashes.

Prefer paired-seed cohorts over anecdotes.

Prefer production browser evidence over CSS inspection.

Prefer current-only schema reset over migration code.

Prefer standard engineering terminology.

Avoid invented frameworks and project-specific jargon that do not improve correctness.

Comments should explain invariants, authority, tradeoffs, or non-obvious failure modes.

Delete comments that merely narrate syntax.

Keep modules cohesive.

Split a file when a clear responsibility boundary exists.

Do not split files solely to satisfy an arbitrary line count.

Do not create a universal manager for unrelated responsibilities.

## Required working protocol

Start every substantial task by inspecting:

- current branch;
- current `HEAD`;
- upstream;
- worktree;
- recent commits;
- active work package;
- root `AGENTS.md`;
- `docs/status.md`;
- relevant source owners;
- relevant tests;
- current CI and deployment state when external behavior matters.

Preserve unrelated user changes.

Do not reset a dirty worktree.

Reproduce the user-visible problem before changing it when practical.

Record a baseline before changing:

- performance;
- balance;
- pacing;
- persistence;
- rendering;
- layout;
- interaction;
- accessibility behavior.

Use `docs/work/` for one active cross-layer work package.

Do not create a competing planning directory.

Do not create a forest of status documents.

An active work note should contain only:

- starting revision and branch;
- relevant dirty files;
- confirmed root causes;
- selected decisions and deviations;
- completed coherent phases;
- focused verification;
- evidence not obtained;
- exact next coherent step.

Use focused tests while iterating.

Run fresh broad verification against stable final content.

Delete the predecessor path after the replacement becomes authoritative.

Do not leave dormant alternative authorities.

Commit coherent vertical slices when repository access permits.

Do not claim completion from source inspection.

Do not claim browser behavior from unit tests.

Do not claim physical-device behavior without physical-device evidence.

Do not claim CI success unless CI ran.

Do not claim deployment from a local build or upload step alone.

If execution limits stop work, stop at a coherent boundary:

- the repository remains buildable;
- one authority remains active;
- partial scaffolding is not shipped;
- the work note identifies the exact next step.

## Time domains

Keep three time domains explicit.

### Game time

Game time is authoritative.

It advances through fixed ticks.

Environment Level, ecology, SCORE, History semantics, and extinction use game time.

### Wall-clock time

Wall-clock time determines how quickly foreground presentation supplies game time.

The player speed control changes this ratio.

### Animation time

Animation time owns:

- camera inertia;
- idle delay;
- idle orbit;
- continuation;
- panel motion;
- focus timing;
- decorative effects.

Animation time must not be multiplied by game speed.

Hidden-page time must not produce camera or UI catch-up.

## Standard speed policy

Normal `1×` is the intended ordinary wall-clock experience.

Normal `1×` maps to an effective game-time rate of former `4×`.

The normal player ladder is:

- `0.5×`;
- `1×`;
- `2×`.

The effective mapping is:

- `0.5×` → effective rate `2`;
- `1×` → effective rate `4`;
- `2×` → effective rate `8`.

Developer mode may expose diagnostic relative multipliers, including `0.25×` for former `1×` and higher values that preserve the established diagnostic range.

One runtime-speed policy owns:

- public options;
- validation;
- public-to-effective conversion;
- diagnostic cadence thresholds;
- labels;
- standard versus developer availability.

Do not scatter the normal baseline factor.

Settings store the public multiplier.

Worker and fallback consume the converted effective rate.

The time dial follows effective game time.

Camera and continuation follow animation time.

Speed must not enter:

- RNG;
- immutable World rules;
- World identity;
- result authority;
- SCORE;
- Echoes;
- Evolution;
- History meaning.

All presentation speeds must produce the same canonical authoritative result for the same World inputs.

Do not skip ticks to make high speed appear responsive.

Retain bounded authority slices and tick debt.

Standard speeds should preserve legible snapshot and render cadence.

Diagnostic speeds may coalesce presentation while executing every tick.

Do not duplicate the speed control in the Menu.

Changing speed semantics requires coherent updates to settings, Worker protocol, UI, diagnostics, tests, and documentation.

## Camera interaction

The camera is presentation-only.

Keep an orthonormal free-orbit frame or an equivalently robust representation.

Do not regress to clamped yaw/pitch when the current frame supports repeated pole traversal.

Direct manipulation must remain immediate and predictable.

Support:

- mouse;
- touch;
- pen through Pointer Events;
- tap selection;
- drag rotation;
- pinch zoom;
- wheel zoom;
- pointer cancellation.

Tap and drag must remain distinct.

Dragging must not select or purchase.

Pinching must not produce a tap.

Residual camera motion must not create a selection or purchase.

Programmatic focus framing must not retain old velocity.

Camera state must never alter simulation authority.

## Camera motion

One narrow presentation controller owns camera-motion state.

The intended sequence is:

`direct manipulation → bounded release inertia → damping → idle wait → calm automatic orbit`

Required invariants:

- recent velocity samples are fixed-capacity and time-bounded;
- release velocity is finite and clamped;
- damping is based on elapsed animation time, not frame count;
- inertia converges to stillness;
- automatic orbit has bounded angular speed;
- trusted activity stops automatic motion immediately;
- opening a surface clears and holds automatic motion;
- direct manipulation remains possible on exposed canvas;
- automatic motion returns only after a fresh idle delay;
- scene change clears velocity;
- World replacement clears velocity;
- focus framing clears velocity;
- hidden-page transition clears or suspends without catch-up;
- returning visible begins a fresh idle delay;
- reduced motion disables nonessential inertia and automatic orbit;
- Evolution and Trophies do not auto-orbit;
- no camera-motion tuning panel exists without demonstrated user need;
- motion state is not simulation or persistence authority.

Home and World may rotate calmly after inactivity.

Automatic motion should communicate life and watchability, not attract attention through speed.

Test equivalent elapsed behavior at multiple frame cadences.

Test long-run orthonormality.

## Trusted interaction

Use one document-level trusted-interaction capture path when several presentation policies need the same fact.

Normalize trusted interaction types.

Ignore programmatic focus through a scoped guard.

Do not install duplicate full document listener sets for camera and continuation.

Consumers may independently:

- cancel automatic continuation;
- stop camera motion;
- reset camera idle time.

Do not couple their state machines.

## Responsive globe framing

Define default framing through observable projected geometry.

Do not define World composition through one unexplained camera-distance constant per device.

A framing policy should derive distance from:

- field of view;
- sphere radius;
- usable canvas;
- target projected diameter;
- stable scene offset;
- safe-area constraints.

World framing should be immersive.

The projected World globe should occupy most of the shorter usable dimension.

Controlled outer-limb overflow is acceptable.

Primary controls must remain accessible.

The outer limb may pass behind chrome.

The central globe must not be obscured by primary controls.

Opening a transient surface must not change camera direction or default zoom.

A same-class resize should preserve intentional player zoom.

A new World may restore the scene's default framing.

Picking must remain correct after offset, resize, and controlled cropping.

Measure:

- canvas rectangle;
- projected center;
- projected radius;
- projected diameter ratio;
- stable control rectangles;
- overlap;
- page overflow;
- safe areas.

Use the required responsive viewport matrix.

## Automatic continuation

Result continuation has one authority.

It is:

- tied to one Result generation;
- one-shot;
- identity-checked;
- paused while hidden;
- cancelled by trusted interaction;
- disabled by preference;
- independent of game speed;
- unable to mint rewards.

The visible continuation should use an intentional nonnumeric World-cycle or germination treatment.

A changing visible integer is not the primary design.

The exact remaining time remains available to assistive technology.

Visible progress derives from one bounded normalized projection of continuation authority.

Do not create:

- a second deadline;
- a second interval;
- a CSS animation clock that can drift;
- a duplicate firing path.

Manual `Next World` remains available.

Evolution and History remain explicit Result actions.

The continuation visual remains in the fixed Result action region, outside the scrolling body.

Exact accessible text may update at one-second cadence.

Do not announce each second.

Announce meaningful state transitions once.

Reduced motion removes decorative travel and pulse while preserving informative progress.

Forced colors and high contrast must preserve state without color alone.

## Autonomous incremental communication

Player-facing behavior should make clear that:

- life grows autonomously;
- watching is valid play;
- no tending is required;
- Worlds end;
- extinction yields Echoes;
- Evolution changes future Worlds;
- the next World can begin automatically.

Use `autonomous incremental ecology` when concise genre language is useful.

Do not imply offline progress.

Do not imply that closing the page advances authority.

Do not explain implementation terms to make the loop understandable.

Use concise Home, World-start, and Result copy.

Behavior should do more explanatory work than prose.

## Simulation and determinism

A World is determined by explicit inputs.

Use deterministic iteration order.

Use deterministic PRNG streams.

Keep render cadence out of simulation.

Keep DOM state out of simulation.

Keep camera state out of simulation.

Keep History playback out of simulation.

Keep animation time out of simulation.

Keep standard and diagnostic speed out of tick content.

Keep pause from inventing hidden pressure.

Environment Level derives from authoritative ticks.

A new World derives Environment Level from tick zero.

No prior World state may leak into a replacement World.

Worker and fallback must agree.

Asynchronous messages must carry complete current identity.

Stale messages must be rejected before mutation or presentation.

World replacement must retire old presentation and authority coherently.

Add deterministic tests for every new mechanic.

## World ecology

The generated World begins with visible ocean.

No starting build may erase the ocean before life expands.

Whole cells represent:

- ocean;
- land;
- lakes;
- coast;
- forest;
- cold regions;
- poor terrain;
- rich terrain;
- transformed terrain.

Adjacent cells are the primary spatial relation.

Do not use decorative graph edges as gameplay geometry.

Early life establishes in favorable terrain.

Fresh progression does not freely occupy every habitat.

Rich cells should look inviting.

Poor and depleted cells should look exhausted.

Resource appearance follows resource condition.

Expansion consumes local resources.

Maintenance creates persistent ecological cost.

Renewal remains bounded.

Recycling may delay extinction.

Recycling must not create an unbounded positive loop.

Habitat Evolution may broaden viable territory.

Broader territory must retain ecological tradeoffs.

The simulation must eventually extinguish under unbounded Environment Level.

No finite Evolution build is literally immortal.

## Balance

Distinguish:

- game-time balance;
- wall-clock pacing;
- visual observability;
- player comprehension.

Do not retune authority before diagnosing which layer is wrong.

A game-time target does not define wall-clock experience.

A slow presentation can make sound ecology feel poorly balanced.

An unreadable state can make causal balance impossible to judge.

Use production `RunController`.

Use explicit compiled Evolution fixtures.

Use deterministic development seeds.

Use separate holdout seeds.

Use paired-seed comparisons.

Report distributions, not only means.

Report at least:

- game-time survival;
- normal-speed wall-clock implication;
- quartiles;
- paired win rate;
- peak and sustained REACH;
- habitat occupancy;
- Environment Level;
- extinction cause;
- SCORE;
- Echoes;
- first-purchase cadence;
- Luminous powered-cell evidence;
- seed variance.

Use autonomous multi-World agent campaigns for loop-level balance.

An audit budget exhaustion is incomplete and reward-free.

Do not approve a balance change from one seed, screenshot, or anecdotal run.

Do not use:

- hidden pity;
- run-number power;
- direct survival-time multipliers;
- universally positive resource loops;
- one dominant build;
- development-seed overfitting.

Progression improvement should be causal and distributional.

An upgraded World need not beat fresh on every seed.

No balance claim is current merely because an old document states it.

Label targets as targets and measurements as measurements.

## Environment Level

Environment Level is an unbounded within-World pressure clock.

Every World starts at Level 0.

It rises from authoritative elapsed ticks.

Pressure remains finite and numerically safe at every level.

Environment Level is not permanent progression.

Evolution may improve resistance.

Evolution cannot change the Level-0 start.

The World HUD displays the current level.

Activating Environment Level opens current-state detail.

It does not open History.

The detail explains:

- current level;
- progress;
- game-time timing;
- current pressure dimensions;
- strongest pressure;
- Level-0 reset;
- terminal peak and final context when relevant.

Update detail at bounded cadence.

Do not update DOM text every animation frame.

Use compact visible numbers with exact accessible values where useful.

## Evolution

Evolution is a physical sphere of authored Skill Cells.

It begins from exactly one canonical root concept, `First Division`, unless explicit user policy supersedes it.

Physical adjacency owns reachability.

A Level-1-or-higher adjacent cell may open a frontier cell according to the current catalog contract.

Owned cells may receive additional levels indefinitely.

Costs grow monotonically.

Effects remain bounded.

Infinite levels do not justify infinite visual clutter.

Every visible Skill Cell needs:

- durable purpose;
- authored player-facing name;
- concise effect;
- exact cost;
- testable mechanical consequence or bounded refinement role.

Do not generate procedural filler.

Foundation abilities appear near the root.

Specialist domains emerge after foundations.

Specialist paths may include:

- fertility;
- freshwater;
- scarcity;
- cold adaptation;
- marine adaptation;
- Luminous ecology.

Different paths should produce different survival shapes.

A reach-heavy path may spread farther and spend resources faster.

A scarcity path may grow slowly and last longer.

A marine path may open territory at higher upkeep.

A Luminous path may pay setup cost for powered transport or recovery.

No path creates immortality.

## Evolution interaction

First activation selects a Skill Cell.

Selection opens or updates its detail.

A second discrete activation on the same selected ready cell purchases exactly one level.

Ready means:

- reachable;
- affordable;
- between Worlds;
- no transaction in flight;
- current level and revision still match.

A selected ready cell should look inviting through more than color.

A locked or unaffordable cell must not use the same invitation.

The detail states the second-activation instruction only when true.

Keyboard and pointer use the same two-step model.

The semantic tree matches the visible sphere.

Dragging does not purchase.

Blank tap does not purchase.

A stale second activation does not spend.

A successful transaction spends once.

A rapid third activation does not accidentally purchase another level.

Keep a native accessible purchase button as an alternative.

## Luminous

Luminous is authoritative whole-cell bioelectric ecology.

The first meaningful Luminous purchase should be visible in the following World.

Do not require a deep hidden recipe before any cell can charge.

Charge is whole-cell state.

Zero authoritative charge produces no powered emission.

A powered cell has bounded benefit.

A powered cell has setup or upkeep cost.

Charge decays when generation stops.

Terminal collapse does not freeze false charge.

Extinction clears live charge.

History preserves charge appearance.

Result may record realized powered-cell evidence.

Ordinary life remains dimmer than powered Luminous life.

Powered light is strongest on the dark side but remains somewhat legible on the day side.

Avoid uniform neon coverage.

Avoid decorative wires.

Avoid white clipping that erases cell shape.

WebGL2 and Canvas preserve semantic ordering.

## SCORE and Echoes

SCORE uses realized World outcomes.

Do not reintroduce predictive World Potential.

Do not show modeled future SCORE ranges as authority.

A concise score may use realized dimensions such as:

- survival;
- exploration;
- sustained presence;
- coherence;
- stewardship;
- worldmaking;
- sustained Environment pressure.

Avoid double-counting correlated facts.

Keep live SCORE monotone when the UI promises monotonicity.

Echoes derive from trusted SCORE.

Early rewards should support understandable permanent decisions.

Large values remain exact in authority.

Visible formatting may use compact engineering notation.

Expose exact accessible values.

Unbounded ranks must not require unbounded tables.

## Result

Extinction produces an unmistakable Result.

Result explains why the World ended.

Result shows SCORE and Echoes clearly.

Result may show a small number of realized axes.

Do not show predictive World Potential.

Do not bury primary actions below a long scroll.

The Result body may scroll.

The action footer remains stable.

Action order is:

1. Next World;
2. Evolution;
3. History.

Automatic continuation status remains with the actions.

The primary action remains reachable at small viewports and `200%` text.

Avoid nested Result scrolling.

Settlement is idempotent.

Result presentation cannot mint rewards.

## World HUD

The standard World metric order is:

1. SCORE;
2. REACH;
3. ENV LEVEL;
4. RESULT when available.

Metric containers remain stable as values gain digits.

Use stable grid tracks.

Use tabular numerals.

Use deterministic compact formatting.

Expose exact accessible values when visible values are abbreviated.

One metric must not push another control.

RESULT must not cause overflow.

Measure rectangles across formatting thresholds.

Do not allow metric changes to move globe controls.

## Menu

The Menu is not a second navigation system.

Home, World, Evolution, and Trophies belong to the primary scene selector.

Do not duplicate them in the Menu without demonstrated need.

The production Menu should remain limited to common understandable actions such as:

- live-World History where needed;
- destructive New World where relevant;
- automatic continuation preference;
- motion preference;
- contrast preference;
- simple quality preference;
- collapsed local data and reset actions.

World speed remains in the World control.

Do not expose:

- History retention;
- camera inertia tuning;
- idle-orbit tuning;
- camera reset without a demonstrated lost-camera problem;
- production diagnostics;
- duplicate Result;
- internal schema versions.

Destructive actions require explicit confirmation.

## Surfaces and focus

Use one coordinated context-shell policy.

Use one scroll owner per surface.

Avoid nested scrolling.

Opening a surface must not move or zoom the camera.

Opening a surface stops nonessential automatic camera motion.

Direct manipulation may remain available on exposed canvas.

Focus moves to a sensible heading or control.

Closing returns focus sensibly.

Programmatic focus must not trigger trusted-interaction behavior unintentionally.

Escape and Close dismiss according to the shared policy.

A repeated trigger may toggle its own surface.

Another trigger replaces the active surface in one gesture.

The globe remains visible where practical.

## History

History is the sole durable temporal observation surface.

Do not create a competing Event Log.

History answers:

- which World;
- which time;
- what the globe looked like;
- what materially changed;
- whether state is live, historical, loading, or semantic-only.

History should not expose every debugging fact.

Use one timeline scroll owner.

Keep core playback controls stable.

Touch controls meet minimum target size.

Selected events and checkpoints have non-color emphasis.

Visual History may be approximate.

Visual History must never be misleading.

Never label a current snapshot as historical.

Never render a prior World with unrelated current buffers.

Never show current resources, transformations, or charge at an old checkpoint.

Loading is explicit.

Unavailable visual data remains honestly semantic-only.

Switch label, snapshot, and controls atomically.

Live restores current authority immediately.

The visual codec stores only channels needed for meaningful appearance.

Immutable geography comes from seed/static fields.

Checkpoint data is quantized, versioned, and bounded.

Initial, terminal, and meaningful transition frames are preserved.

Retired codecs are deleted under current-only policy.

## Rendering

The World surface reads as one continuous cellular sphere.

Background gaps between adjacent cells are defects.

Prefer one continuous position shell.

Create depth through material, fragment shading, boundaries, and contrast.

Do not separate shared boundaries through owner-cell radial displacement.

Do not add skirts or tessellation without evidence.

WebGL2 is primary.

Canvas 2D is a semantic fallback.

Context loss must not replace World authority.

Whole-cell visual language preserves:

- geography;
- resources;
- life;
- stress;
- remains;
- transformation;
- Luminous charge;
- selection;
- History;
- Evolution;
- Trophies.

Ordinary life must not erase terrain and resources.

Powered Luminous state must remain distinct from ordinary life.

Selection and History must remain distinct from biological state.

The atmosphere is a visual concern.

Do not increase simulation resolution to solve atmosphere appearance.

Renderer changes require controlled fixtures and real screenshots.

Use relative luminance, contrast, geometry, and silhouette measures.

Do not use one exact screenshot hash as the primary cross-GPU oracle.

Keep static geometry static.

Keep draw calls bounded.

## Accessibility

All meaningful controls require accessible names.

Use native controls where suitable.

Preserve visible focus.

Do not rely on hover.

Do not rely on color alone.

Touch targets are at least `44 CSS px` in their primary dimension.

Keyboard users can perform every meaningful action.

The semantic Evolution tree matches the visible sphere.

History controls are keyboard operable.

Exact state remains available when visible formatting is compact.

Announce:

- purchases;
- failures;
- extinction;
- destructive actions;
- meaningful continuation transitions.

Do not announce:

- every metric update;
- every countdown second;
- every camera frame;
- every progress-frame change.

Respect reduced motion.

Reduced motion preserves information and direct control.

Reduced motion removes or suppresses:

- nonessential inertia;
- idle orbit;
- decorative pulse;
- decorative travel;
- unnecessary transition motion.

Respect high contrast and forced colors.

Use text, shape, border, and state in addition to color.

Do not create modal focus traps for nonmodal surfaces.

## Responsive layout

Design from small screens first.

Required viewport evidence includes:

- `320 × 568`;
- `360 × 640`;
- `390 × 844`;
- `430 × 932`;
- `768 × 1024`;
- `844 × 390`;
- `1024 × 600`;
- `1440 × 900`.

Test `200%` text where practical.

Respect safe-area insets.

No production surface causes horizontal page overflow.

The app shell should not depend on body scrolling.

A bounded surface may own internal scrolling.

Avoid nested scroll regions.

Sticky headers and action footers must not overlap content.

The globe must not jump when a surface opens.

Primary controls remain reachable.

The selected cell remains visible where layout permits.

Controls remain usable with coarse pointers.

Measure actual rectangles.

Do not infer responsive correctness from CSS source alone.

## Persistence

Use current-only persistence.

Version every persisted document and binary codec.

Validate before use.

Reject or reset mismatched versions.

Do not migrate retired Evolution graphs without an active consumer.

Do not map obsolete Skill IDs merely to preserve old local data.

Do not keep old History decoders without a current need.

Do not preserve retired score or settings fields.

Import validation is strict.

Failed import does not partially persist.

Progression transactions are atomic to browser-storage limits.

Semantic History remains bounded.

Visual History remains bounded by count and bytes.

Export may omit device-local visual checkpoints when documented.

Data reset is explicit.

Storage failure keeps the session playable and communicates temporary persistence honestly.

## Security and hostile data

Treat imports, storage, Worker messages, result DTOs, agent actions, and URL inputs as untrusted.

Validate:

- shape;
- version;
- identity;
- bounds;
- integers;
- lengths;
- recursion depth;
- cycles;
- enum values;
- byte sizes.

Reject stale World messages.

Reject forged settlement projections.

Do not parse hostile giant integers without repository guards.

Do not use `innerHTML` for dynamic content.

Use `textContent` or safe node construction.

A failed validation must not partially mutate authority.

## Performance

Measure before optimizing.

Retain typed-array simulation and reusable renderer buffers.

Avoid per-cell object allocation in hot loops.

Avoid per-frame static geometry rebuild.

Avoid recompiling Evolution every frame.

Compile progression when inputs change.

Bound caches by count and bytes.

Bound camera samples.

Bound continuation state.

Bound History.

Bound DOM lists.

Bound notifications.

Bound agent traces and reports.

Use event delegation when it reduces large closure sets without obscuring ownership.

Do not micro-optimize cold code at the cost of correctness.

Do not add a dependency to save a few lines.

Maintain the current simulation benchmark floor unless a documented replacement supersedes it.

Investigate a same-host regression of approximately `10%` or more.

Keep renderer draw calls stable unless measured visual value justifies a deliberate change.

High diagnostic speeds execute every authoritative tick.

Presentation may be coalesced.

Hidden documents suspend nonessential presentation work.

## Testing

Every bug fix needs a regression test at the correct layer.

Use:

- unit tests for pure rules and state machines;
- integration tests for authority and asynchronous boundaries;
- browser tests for interaction, layout, rendering, focus, and accessibility;
- multi-seed audits for balance;
- benchmarks for performance.

### Speed tests

Test:

- public options;
- validation;
- public-to-effective mapping;
- settings reset;
- Worker/fallback agreement;
- constant-speed result equality;
- mixed-speed result equality;
- standard and diagnostic cadence;
- no skipped ticks;
- animation-time independence.

### Camera tests

Test:

- slow drag;
- fast flick;
- tap;
- drag classification;
- pinch;
- wheel;
- pointer cancel;
- bounded samples;
- bounded velocity;
- frame-rate-independent damping;
- convergence;
- long-run orthonormality;
- idle delay;
- automatic orbit;
- trusted cancellation;
- surface hold;
- hidden reset;
- reduced motion;
- no selection or purchase from residual motion;
- picking after framing.

### Continuation tests

Test:

- one Result generation;
- normalized progress;
- hidden pause;
- resume;
- trusted cancellation;
- disabled state;
- firing once;
- stale identity rejection;
- manual action;
- exact accessible text;
- no second live announcements;
- reduced motion;
- forced colors;
- compact footer geometry.

### Rendering tests

Test:

- continuous shell;
- no background cracks;
- ordinary life visibility;
- powered Luminous hierarchy;
- zero-charge control;
- History channels;
- WebGL2 and Canvas semantic ordering;
- draw count;
- controlled fixtures;
- real screenshots.

### Responsive tests

Collect:

- canvas bounds;
- projected globe geometry;
- control rectangles;
- scroll ownership;
- focus;
- overflow;
- safe areas;
- `200%` text;
- every required viewport.

### Balance tests

Use production cohorts.

Separate smoke from deeper holdout gates.

Record exact rule versions and fixtures.

Do not tune from one seed.

### Browser paths

Exercise:

- production entry;
- Worker;
- fallback;
- WebGL2;
- forced Canvas;
- Home;
- World;
- Result;
- Evolution;
- Trophies;
- History;
- Menu;
- reduced motion;
- high contrast;
- hidden page;
- automatic continuation;
- settings reload;
- storage failure where supported.

Screenshots supplement assertions.

Screenshots do not replace measurements.

A skipped test is not a pass.

An unavailable test is not a pass.

Classify both explicitly.

## Documentation

Keep `README.md` product-facing.

Do not fill it with volatile schema inventories.

Keep `docs/status.md` concise, factual, and current.

Keep `docs/work/` to one active cross-layer package.

Keep design documents aligned with production behavior.

Delete stale current claims in the same change that alters behavior.

Mark historical material as historical.

Do not document rejected architecture as current.

Do not preserve obsolete migration instructions.

Distinguish:

- target;
- baseline;
- measurement;
- inference;
- unavailable evidence.

Document balance targets as targets.

Document measured distributions with command, fixture, revision, and host where relevant.

Document performance with comparable conditions.

Do not freeze an orientation commit into durable product policy.

## Code style

Use English for code, comments, documentation, tests, and player-facing copy unless localization is explicitly requested.

Use native ES modules.

Use semicolons consistently with the existing codebase.

Use descriptive names.

Avoid ambiguous abbreviations in product code.

Short mathematical names are acceptable in tight numeric functions.

Keep functions focused.

Prefer early return for invalid state.

Validate external data.

Freeze shared catalogs and immutable public records.

Use exact progression-integer helpers for unbounded authority values.

Use bounded numeric projections in hot loops.

Keep browser entry points small.

Keep simulation authority outside the DOM.

Keep UI formatting out of simulation hot loops.

Keep persistence behind narrow platform modules.

Keep the Worker protocol explicit and versioned.

## Git hygiene

Do not overwrite unrelated user changes.

Do not discard a dirty worktree.

Do not commit runtime artifacts.

Do not commit generated reports unless repository policy requires them.

Keep commits coherent.

Use commit messages that describe product or authority changes.

Run focused tests before broad verification.

Run broad verification before claiming completion.

Review the final diff for:

- duplicate authority;
- stale terminology;
- dead files;
- compatibility residue;
- scope leakage;
- generated artifacts;
- accidental simulation changes;
- accidental renderer-pass changes;
- documentation drift.

Use normal pushes.

Do not force-push without explicit irreversible-action authorization.

Verify remote postconditions.

Fix published failures through additive commits.

## Completion standard

A coherent phase is complete only when:

- the selected target is active in production paths;
- the conflicting predecessor is deleted;
- focused tests pass;
- relevant browser evidence passes;
- Worker and fallback remain coherent;
- WebGL2 and Canvas evidence exists when rendering changed;
- responsive viewports are observed when layout changed;
- accessibility behavior is observed when interaction changed;
- performance evidence exists when hot paths changed;
- balance evidence exists when authority changed;
- documentation matches;
- no selected-scope severe regression remains;
- skipped and unavailable evidence are named;
- the work note identifies the next coherent step;
- the final worktree is clean or every remaining change is accounted for.

A feature is not complete because source exists.

A feature is not complete because a unit test passes.

A visual feature is not complete until the production renderer displays it.

An interaction feature is not complete until trusted browser input exercises it.

A responsive feature is not complete until measured at small and large viewports.

A balance feature is not complete until production cohorts are measured.

A deployment is not complete until deployed bytes and behavior are verified.

## Final instruction

Build the smallest coherent version of the best product.

Protect authority.

Delete superseded paths.

Measure real behavior.

Make autonomous growth, finite ecology, extinction, Evolution, and continuation understandable through the living sphere itself.
