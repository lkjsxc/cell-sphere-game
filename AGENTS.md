# AGENTS.md

## Purpose

This file is the standing repository contract for coding agents working on `lkjsxc/cell-sphere-game`.

Read it before editing.

Read the active checkout before trusting this file about exact symbols, files, commands, versions, schemas, test counts, branch state, CI state, or deployment state.

Treat the product and authority rules here as binding until the user explicitly supersedes them.

The user authorizes substantial changes, deletion of obsolete current-only systems, and breaking internal or persisted formats when that produces a smaller coherent product.

Backward compatibility is not a default goal.

Do not preserve a weak design merely because code exists for it.

Do not use that freedom to create speculative architecture.

Choose the smallest dependency-closed system that satisfies the product contract and can be proved through the real browser and production simulation.

This file is not:

- a campaign prompt;
- a completion report;
- a release ledger;
- a list of transient priorities;
- a snapshot of one commit;
- an inventory of exact schema or test versions;
- a substitute for reading current source.

Use `docs/work/` for one active cross-layer work package.

Do not create a competing planning directory.

---

## Product north star

`cell-sphere-game` is a calm, deterministic, browser-native, autonomous incremental ecology played on a living cellular sphere.

The player begins a World and watches life:

1. establish in a favorable local niche;
2. spread autonomously through whole neighboring cells;
3. consume finite local resources;
4. encounter rising chronic Environment pressure;
5. fragment and become extinct;
6. leave realized SCORE, Echoes, Trophies, and History;
7. improve permanent Evolution between Worlds;
8. begin another World at Environment Level 0.

The globe is the primary interface.

The interface explains and supports the sphere. It does not compete with it.

The player should be able to understand the core loop while simply watching.

The player should not need to tend individual cells.

Meaningful intervention occurs chiefly between Worlds through Evolution.

The World should feel alive:

- when directly manipulated;
- after a natural release;
- while left alone;
- through visible ecological cause and consequence.

The product is autonomous and incremental.

It does not promise offline progress.

Closing the page does not advance authoritative time or award progress.

Extinction is not a failure screen detached from the game. It is the transition that makes memory and permanent progression meaningful.

---

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

Use `REACH` for the current or meaningfully occupied proportion of World cells under the current scoring contract.

Use `Luminous` for the bioelectric Evolution domain.

Use `Home`, `World`, `Evolution`, and `Trophies` for the four primary scenes.

Use `WebGL2` and `Canvas 2D` for renderer backends.

Use `Worker` and `fallback` for the two execution paths that share the same simulation authority.

Do not reintroduce retired public terminology because an old test, schema, prompt, screenshot, or historical document mentions it.

Use plain player language in the interface.

Do not expose project-internal terms when a standard ecological, game-design, accessibility, rendering, or software-engineering term is available.

---

## Core product rules

The simulation is authoritative and deterministic.

Rendering is observational.

Camera state is observational.

History playback is observational.

UI state is observational.

Presentation speed changes wall-clock delivery of game time, not tick content.

A World begins from explicit immutable inputs.

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

A progression purchase changes future Worlds, not the active World.

Local resources are finite.

Renewal is bounded.

Maintenance has persistent cost.

No finite build may become literally immortal.

Extinction must remain possible under unbounded Environment Level.

The player may play indefinitely through repeated finite Worlds and unbounded Evolution levels.

SCORE and Echoes derive from realized authoritative outcomes.

A projection supplied by UI, an agent, an import, or a caller is not reward authority.

The globe remains cellular.

Whole cells remain the primary geography, ecology, transformation, habitat, and Luminous unit.

Whole-cell simulation authority does not require every visual semantic to be expressed as a whole-cell fill.

Ordinary World life and frontier state should read primarily through cell perimeters or inter-cell boundaries, leaving biome and resource material legible inside occupied cells.

Stress, critical state, and dead remains may use restrained interior support when necessary, but the boundary remains their primary cue and ordinary life must not return to destructive whole-cell whitening.

Luminous charge, geography, resources, transformations, selection, and History must remain visually distinct from ordinary life.

WebGL2 and Canvas 2D must communicate the same semantic state even when exact pixels differ.

Accessibility, responsive behavior, reduced motion, forced colors, and keyboard access are product requirements.

Performance is a product feature and must be measured.

---

## Non-goals

Do not add manual unit control.

Do not add combat.

Do not add disaster cards, scripted attacks, crisis popups, or a hidden game director.

Do not add random mid-World choice dialogs.

Do not require repetitive clicking to keep life alive.

Do not turn the game into a conventional idle spreadsheet.

Do not promise offline progress without a separate explicit authority and persistence design.

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

Do not generate meaningless filler merely to reach a catalog, feature, file, or line count.

Do not perform a broad rewrite without a cutover, deletion, evidence, and recovery story.

---

## Authority map

### Simulation authority

Production `RunController` and its shared rule modules own:

- authoritative ticks;
- RNG;
- cell state;
- biomass;
- energy;
- resources;
- reproduction;
- maintenance;
- transport;
- habitats;
- transformations;
- Luminous charge;
- Environment Level;
- extinction;
- realized terminal facts.

Worker and fallback must use the same controller and rules.

Tests and agents must not substitute a simplified simulation.

A convenience projection must not become a second simulation authority.

### Progression authority

The Evolution catalog, exact level state, transactional purchase path, and progression compiler own:

- graph reachability;
- affordability;
- exact levels;
- costs;
- refinements;
- compiled effects;
- habitat capabilities;
- pressure defenses;
- future-World configuration.

The active World receives one immutable compiled configuration.

Evolution cannot mutate the active World.

The UI does not infer or rewrite compiled effects.

### Reward authority

Terminal replay or equivalent trusted reconstruction owns settlement.

SCORE uses realized authoritative facts.

Echoes derive from trusted SCORE.

Trophies derive from trusted evidence.

Result UI is a projection.

Agent observations are projections.

Imports are untrusted.

No caller-controlled summary may mint progression.

A terminal reward transaction must be idempotent.

An aborted, incomplete, failed, or budget-exhausted World must not be converted into a rewarded extinction.

### Presentation authority

The app controller and narrow presentation policies own:

- scene selection;
- camera motion;
- responsive framing;
- trusted interaction;
- surfaces;
- focus;
- speed selection;
- continuation;
- accessible announcements;
- rendering cadence.

Presentation never changes simulation rules.

Keep each policy narrow.

Do not let the app controller become a second owner of a policy already expressed in a pure module.

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
- semantic History;
- persistence authority.

Renderer backend, camera, frame cadence, quality, and reduced-motion state must not affect authoritative results.

Renderer-semantic projections shared by WebGL2 and Canvas should have one pure owner when both backends consume the same state.

### History authority

Semantic History records authoritative observations and completed-World facts.

Visual History is a bounded approximate rendering aid.

Visual History is not a simulation save.

History playback never changes the live World.

A historical label and historical globe state must switch atomically.

If a matching visual checkpoint is unavailable, show semantic History honestly rather than displaying mismatched current visuals.

### Persistence authority

Narrow platform modules own:

- namespace boundaries;
- validation;
- versioning;
- exact integer normalization;
- transactional writes;
- import validation;
- current-only reset.

UI modules do not write arbitrary storage documents directly.

Persistence data is untrusted until validated.

---

## Engineering posture

Prefer deletion over adaptation when an old abstraction encodes the wrong product.

Prefer direct data flow over indirection.

Prefer explicit state machines over scattered booleans.

Prefer one owner for each rule.

Prefer one owner for each surface.

Prefer one owner for each scroll region.

Prefer one source of truth for each formatted metric.

Prefer immutable snapshots at authority boundaries.

Prefer pure functions for:

- schedules;
- scoring;
- progression compilation;
- codecs;
- validation;
- geometry;
- presentation projections;
- cross-backend renderer semantics.

Prefer typed arrays and reusable buffers in hot paths.

Prefer bounded ring buffers over growing arrays.

Prefer relative visual measurements over exact cross-GPU screenshot hashes.

Prefer paired-seed cohorts over anecdotes.

Prefer production browser evidence over CSS or shader inspection alone.

Prefer current-only schema reset over migration code.

Prefer standard engineering terminology.

Avoid invented frameworks and project-specific jargon that do not improve correctness.

Comments should explain:

- invariants;
- authority;
- tradeoffs;
- non-obvious failure modes;
- recovery conditions.

Delete comments that merely narrate syntax.

Keep modules cohesive.

Split a file when a clear responsibility boundary exists.

Do not split files solely to satisfy an arbitrary line count.

Do not create a universal manager for unrelated responsibilities.

Do not add a shipped dependency without compelling evidence.

---

## Required working protocol

Start every substantial task by inspecting:

- current branch;
- current `HEAD`;
- upstream;
- ahead/behind state;
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

Do not overwrite concurrent work.

Reconcile a campaign prompt with current source before treating exact paths or symbols as current.

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

Do not create `docs/campaigns/` while `docs/work/` remains the canonical planning system.

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

Do not claim deployment from a local build, artifact upload, or workflow start alone.

If execution limits stop work, stop at a coherent boundary:

- the repository remains buildable;
- one authority remains active;
- partial scaffolding is not shipped;
- the work note identifies the exact next step.

---

## Time domains

Keep three time domains explicit.

### Game time

Game time is authoritative.

It advances through fixed ticks.

Game time owns:

- ecology;
- Environment Level;
- SCORE;
- History semantics;
- extinction.

### Wall-clock time

Wall-clock time determines how quickly foreground presentation supplies game time.

The player speed control changes this ratio.

Wall-clock pacing is a player-experience property.

It is not the simulation's balance clock.

### Animation time

Animation time owns:

- camera inertia;
- camera idle delay;
- automatic orbit;
- Result continuation;
- panel motion;
- focus timing;
- decorative effects.

Animation time must not be multiplied by game speed.

Hidden-page time must not produce camera or UI catch-up.

Never use the word `faster` in design or documentation without identifying which time domain changes.

---

## Standard speed policy

Normal `1×` is the intended ordinary wall-clock experience.

Normal `1×` maps to effective game-time rate `4`.

The exact ordinary player ladder is:

- `0.25×`;
- `0.5×`;
- `0.75×`;
- `1×`;
- `1.25×`;
- `1.5×`.

The exact effective mapping is:

- `0.25×` → effective rate `1`;
- `0.5×` → effective rate `2`;
- `0.75×` → effective rate `3`;
- `1×` → effective rate `4`;
- `1.25×` → effective rate `5`;
- `1.5×` → effective rate `6`.

One runtime-speed policy owns:

- public options;
- developer options;
- validation;
- public-to-effective conversion;
- diagnostic cadence thresholds;
- labels;
- standard versus developer availability.

Do not scatter the baseline factor.

Settings store the public multiplier.

New and reset settings default to `1`.

A settings schema whose public speed semantics change should reset under current-only policy.

Do not semantically migrate an old public value into a different new value unless the user explicitly requires compatibility.

Developer mode may expose diagnostic relative multipliers above `1.5×`.

Diagnostic values:

- require explicit developer mode;
- do not appear in ordinary UI;
- do not persist into ordinary settings;
- may coalesce snapshots and renders;
- must execute every authoritative tick.

Worker and fallback consume the same validated relative multiplier and the same conversion policy.

The time dial follows effective game time.

All public elapsed-time, duration, History-time, Environment-transition, and speed
labels must derive from authoritative ticks and the current runtime-speed policy.

Do not let a historical helper, retired baseline, renderer cadence, or animation
clock reinterpret current game time.

When player evidence suggests inconsistent time, reproduce Worker and fallback
against the same immutable World and tick trace before changing ecology, relabeling
speed, or editing balance.

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

Do not duplicate the speed control in Menu.

Changing speed semantics requires coherent updates to:

- policy;
- settings;
- Worker and fallback consumers;
- UI;
- diagnostics;
- tests;
- documentation.

Do not bump a protocol version merely because an option catalog changed when message shape and semantics remain unchanged.

Do bump a protocol when its shape or semantic meaning actually changes.

---

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

Use monotonic input timing for release-velocity estimation.

Keep input-event time and observed animation time distinct when queued event delivery can delay handlers.

Reject incompatible legacy timestamp domains safely.

---

## Camera motion

One narrow presentation controller owns camera-motion state.

The intended sequence is:

`direct manipulation → bounded release inertia → damping → idle wait → calm automatic orbit`

Player-driven release inertia and automatic idle orbit serve different purposes.

A deliberate fast flick should be capable of carrying the sphere through an
energetic, bounded rotation of roughly a full turn when the gesture warrants it.

Do not accelerate the calm idle orbit to compensate for weak release inertia.

Slow drags must remain precise, direct manipulation must remain immediate, and
reduced motion must continue to suppress nonessential carried motion.

Required invariants:

- recent velocity samples are fixed-capacity;
- samples are time-bounded;
- release velocity is finite;
- release velocity is clamped;
- damping uses elapsed animation time, not frame count;
- inertia converges to stillness;
- inertia has a hard bounded lifetime;
- automatic orbit has bounded angular speed;
- trusted activity stops automatic motion immediately;
- opening a surface clears and holds automatic motion;
- direct manipulation remains possible on exposed canvas;
- automatic motion returns only after a fresh idle delay;
- scene change clears velocity;
- World replacement clears velocity;
- focus framing clears velocity;
- hidden-page transition clears or suspends motion without catch-up;
- returning visible begins a fresh idle delay;
- reduced motion disables nonessential inertia and automatic orbit;
- Evolution and Trophies do not auto-orbit;
- no camera-motion tuning panel exists without demonstrated user need;
- motion state is not simulation or persistence authority.

Home and World may rotate calmly after inactivity.

A newly started World should begin still and enter automatic orbit only after the established idle delay when no trusted interaction occurs.

Automatic motion should communicate life and watchability, not attract attention through speed.

Autonomous survivor framing, when implemented, is bounded presentation guidance
rather than simulation authority.

It must require evidence that a previously established World is in sustained late
decline, must not interpret the naturally small starting population as
near-extinction, must avoid repeatedly hunting between cells, must clear release
velocity, must cancel immediately on trusted interaction, and must respect
reduced motion.

Test equivalent elapsed behavior at multiple frame cadences.

Test long-run orthonormality.

Test fallback input delay.

---

## Trusted interaction

Use one document-level trusted-interaction capture path when several presentation policies need the same fact.

Normalize trusted interaction types.

Ignore programmatic focus through a scoped guard.

Do not install duplicate full-document listener sets for camera and continuation.

Consumers may independently:

- cancel automatic continuation;
- stop camera motion;
- reset camera idle time.

Do not couple their state machines.

Trusted activity should include meaningful:

- pointer;
- touch;
- pen;
- wheel;
- keyboard;
- focus;
- visibility-related player interaction.

Do not treat internal programmatic updates as trusted player activity.

---

## Responsive globe framing

Define default framing through observable projected geometry.

Do not define World composition through one unexplained camera-distance constant per device.

A framing policy should derive distance and offset from:

- field of view;
- sphere radius;
- usable canvas;
- target projected diameter;
- stable scene composition;
- safe-area constraints.

World framing should be immersive.

The projected World globe should occupy most of the shorter usable dimension.

The current durable diameter policy is approximately:

- `1.08` of the shorter usable dimension in narrow phone portrait;
- `0.98` near square and tablet layouts;
- `0.90` in wide layouts.

Interpolate continuously.

Do not branch on device names.

For sufficiently wide Home and World layouts, place the projected sphere center near two-thirds of usable width.

This expresses an approximate left:right division of `2:1`.

Use a practical wide acceptance band of approximately:

- center ratio `0.65–0.68`;
- left:right ratio `1.9–2.1`.

Keep phone portrait centered.

Transition smoothly between centered portrait and wide composition.

Controlled outer-limb overflow is acceptable.

Primary controls must remain accessible.

The outer limb may pass behind chrome.

The central globe must not be obscured by primary controls.

Opening a transient surface must not change camera direction or default zoom.

A same-class resize should preserve intentional player zoom.

A new World may restore the scene's default framing.

Picking must remain correct after:

- offset;
- resize;
- controlled cropping;
- safe-area application.

Measure:

- canvas rectangle;
- usable canvas;
- projected center;
- projected radius;
- projected diameter ratio;
- left:right composition ratio;
- stable control rectangles;
- overlap;
- page overflow;
- safe areas.

Do not shrink the globe merely to repair a horizontal-position defect.

Do not create per-device offset constants when one continuous policy can express the design.

---

## Automatic continuation

Result continuation has one authority.

Its ordinary default duration is exactly `13_500 ms`.

It is:

- animation-time based;
- one-shot;
- bound to one Result generation;
- paused while hidden;
- cancelled by trusted interaction;
- optional through the existing auto-continuation preference;
- independent of game speed.

The visible design may be nonnumeric.

Exact remaining time must remain available to assistive technology.

Use one normalized progress projection from the authority state.

Do not create:

- a CSS clock;
- a second deadline;
- a second remaining-time owner;
- a second firing path;
- a second state machine;
- a game-time countdown.

Keep:

- manual `Next World`;
- Evolution action;
- History action;
- exact identity checks;
- idempotent reward settlement;
- hidden-page pause;
- cancelled state;
- disabled state;
- firing state;
- completed state.

Visible copy should not update every second.

Accessible text may update at second boundaries without becoming an assertive live countdown.

At a `13_500 ms` duration, ceiling-based accessible text may truthfully begin at `14 seconds`.

Keep style work bounded.

Reduced motion must remove nonessential travelling motion while retaining progress and state.

Forced colors must preserve track, trace, and state.

A cancelled Result must not silently restart automatic continuation.

Changing speed must not alter continuation duration.

---

## Autonomous-incremental communication

Behavior is the primary proof that the game is autonomous and incremental.

Player-facing copy should make clear that:

- life grows on its own;
- no tending is required;
- watching is valid play;
- a World is finite;
- extinction produces memory and progression;
- Evolution changes future Worlds;
- untouched Results continue the loop automatically;
- interaction retains player control;
- closing the page does not advance the World;
- no offline accumulation is promised.

Do not solve genre comprehension only with a badge.

Do not paste a manual into Home or Result.

Keep copy concise and factual.

Do not describe offline behavior as `idle progress`.

---

## Simulation and determinism

The production fixed-step simulation is the only World authority.

Use integer ticks.

RNG consumption order is part of determinism.

Do not let these affect authoritative outcomes:

- frame rate;
- renderer;
- camera;
- layout;
- animation;
- scene;
- quality;
- visibility;
- speed;
- UI state.

Worker and fallback must agree.

Stale messages must not mutate the current World.

A new World must have a new presentation generation and trusted identity.

Do not infer identity from a seed alone.

Do not skip ticks under load.

Use bounded per-slice execution and retain debt.

If a Worker fails before authority begins, fallback may start from the same immutable inputs.

If a Worker fails after authority begins, do not silently start a second World authority from an approximate snapshot.

Fail honestly or use an explicitly proven recovery protocol.

---

## World identity

World identity should include enough immutable data to reject stale, cross-run, and cross-version messages.

Maintain identity consistently across:

- app;
- driver;
- Worker;
- fallback;
- renderer;
- History;
- settlement;
- Result;
- continuation.

Validate identity at asynchronous boundaries.

Do not let a stale snapshot overwrite a new World.

Do not let a stale terminal result mint rewards.

Do not let old visual History appear under a new historical label.

World replacement must clear presentation state that belongs to the prior World.

---

## Ecology

Life occupies whole cells.

Growth is local.

Reproduction requires a viable parent and a viable neighboring cell.

Resources are local and finite.

Renewal is bounded.

Maintenance is continuous.

Transport redistributes real finite energy.

Recycling draws from bounded recyclable stock.

Habitat access is explicit.

Transformations are bounded and costly.

Luminous charge requires real living flux and cost.

No ordinary path creates energy or resources from nothing.

No hidden pity multiplier should manufacture survival.

No run-number multiplier should manufacture progress.

No direct survival-time bonus should stand in for ecological improvement.

No finite build may become immortal.

Extinction should have an understandable causal chain.

---

## Resource conservation

Resource accounting must remain finite, bounded, and auditable.

Track sources and sinks explicitly when adding or changing resource mechanics.

Do not hide nonconservation behind visual labels.

A recovery mechanic must identify:

- the finite stock it draws from;
- the rate limit;
- the cap;
- the cost;
- the terminal behavior.

A transport mechanic moves resources.

It does not create them.

A transformation may change habitat or local coefficients.

It does not erase conservation.

Tests should cover:

- no positive unbounded loops;
- no nonfinite values;
- no negative stock;
- no overflow;
- no rewarded audit-budget termination.

---

## Environment Level

Every World begins at Environment Level 0.

Environment Level is owned by authoritative game time.

It rises within the current World only.

It resets for every new World.

It is unbounded in representation and schedule.

It expresses chronic ecological pressure.

It is not:

- a permanent difficulty setting;
- a random event deck;
- a disaster system;
- a cross-World counter;
- a direct reward multiplier;
- a hidden run-number bonus.

Evolution may help life endure specific pressure.

Evolution does not slow or reset the public Environment clock unless the user explicitly changes that product rule.

Environment profiles must compile deterministically from:

- exact Environment Level;
- immutable compiled Evolution state;
- versioned rules.

Player-facing Environment detail must be truthful.

Distinct pressure dimensions must not all inherit an indistinguishable
player-visible trajectory merely because they share one Environment Level.

Each dimension needs an authored ecological identity and an authoritative,
mechanically meaningful profile. Evolution defenses may modify that profile, but
must not be the sole source of differentiation.

The ordinary Current Chronic Pressure surface should prefer bounded normalized
percentages with accessible text over qualitative words alone. Keep raw ratings
and coefficients internal unless they have direct player meaning.

Do not create fake differentiation by changing labels while identical authoritative values remain.

When changing Environment:

- distinguish level schedule from pressure profile;
- distinguish raw pressure from effective coefficients;
- distinguish current from next level;
- show causes in player language;
- update simulation, snapshots, UI, audits, balance evidence, and documentation coherently.

---

## Evolution

Evolution is permanent progression between Worlds.

One purchase raises one valid Evolution cell by one exact level through the transactional purchase path.

Purchases occur between Worlds.

The active World uses one immutable compiled Evolution state.

Evolution effects must map to real production mechanics.

Avoid purely decorative power.

A node should have:

- a stable identity;
- authored player-facing meaning;
- exact cost;
- exact level;
- reachable prerequisites;
- bounded compiled effects;
- tests.

Refinement may continue without a finite maximum when exact integer representation and bounded compiled effects remain safe.

A very large level must not create:

- `NaN`;
- infinity;
- overflow;
- an immortal build;
- an unbounded loop;
- an unbounded compile cost.

Do not add filler merely to make the sphere larger.

Repeated or related mechanics require authored roles, economic meaning, and clear progression.

A larger Evolution topology should use spatially coherent regions. Related domains
and adaptations should cluster together, neighboring routes should tell a
biological progression story, and abilities may recur when their role, cost,
prerequisite position, and compiled effect remain explicit.

Region design should make adaptation to World-like habitats and pressures legible
without copying World simulation authority. Do not treat the current compact
cell count as an eternal product limit, and do not equate more cells with value.

A dense Evolution presentation may refine a smaller authored skill graph without
expanding progression authority.

When it does:

- the authored skill graph remains the only reachability, purchase, cost, level,
  and compiled-effect authority;
- every visible presentation cell maps to exactly one authored skill territory;
- every territory is nonempty and connected;
- visible contact between territories agrees with authoritative skill adjacency;
- picking, focus, scene projection, WebGL2, Canvas 2D, and accessibility consume
  one deterministic territory map;
- fine presentation cells are not hidden purchasable nodes, inert decoration, or
  filler;
- a presentation-only topology change does not reset or version unaffected
  progression and persistence authority.

Do not mutate Evolution during a World.

Do not create a second progression compiler for agents or previews.

When changing the authored graph, presentation topology, or catalog, update every affected layer together:

- topology;
- catalog;
- adjacency;
- reachability;
- costs;
- refinements;
- compiled effects;
- selection;
- picking;
- accessibility tree;
- persistence;
- agents;
- audits;
- balance;
- documentation.

Use current-only reset when a coherent new authoritative topology or catalog cannot truthfully map old state.

---

## Luminous

Luminous is authoritative whole-cell bioelectric ecology.

It is not a decorative particle layer.

Charge must derive from real World state.

Charge requires:

- an owned enabling path;
- viable living cells;
- sufficient flux or generation condition;
- setup or upkeep cost;
- bounded retention;
- deterministic update.

Zero authoritative charge must produce no powered emission.

A powered cell should be visibly distinct from ordinary living state.

Luminous must not conceal terrain, resources, stress, selection, or History.

Do not add bloom merely to make it visible.

Test:

- disabled build;
- first visible ownership;
- mature ownership;
- zero-charge control;
- day side;
- night side;
- WebGL2;
- Canvas;
- extinction;
- Worker/fallback parity.

---

## Balance

Balance is a production-data problem.

Do not tune from:

- one seed;
- one screenshot;
- one anecdotal World;
- one mean;
- a development set alone.

Separate:

- game-time survival;
- wall-clock pacing;
- animation timing;
- observability;
- progression cadence.

Before changing ecology constants, determine whether the complaint is caused by:

- slow wall-clock presentation;
- sparse meaningful change;
- weak state legibility;
- unclear extinction cause;
- weak first purchases;
- poor reward cadence;
- excessive seed variance;
- a genuine authoritative imbalance.

Use production `RunController`.

Use the production progression compiler.

Use paired seeds.

Maintain:

- development seeds;
- holdout seeds;
- fresh fixture;
- early Foundation fixture;
- specialist fixtures;
- Luminous fixture;
- mature fixture.

Report distributions for:

- game-time survival;
- wall-clock implication at normal speed;
- peak and sustained REACH;
- habitat occupancy;
- Environment Level;
- extinction cause;
- SCORE;
- Echoes;
- first-purchase cadence;
- powered-cell evidence;
- seed variance.

Use autonomous multi-World agent campaigns for loop-level progression.

Do not let the agent mutate Evolution during an active World.

Prefer the smallest causal rule change.

Protect:

- finite resources;
- inevitable extinction;
- multiple viable builds;
- no universally optimal path;
- no positive resource loop;
- no hidden pity;
- no direct survival-time cheat.

Label targets as targets until measured.

Label measurements as measurements.

---

## SCORE and Echoes

SCORE is realized World performance.

A live SCORE display is a projection of the same trusted model used at settlement.

Echoes derive from trusted SCORE.

SCORE and Echoes must not depend on:

- speed;
- camera;
- renderer;
- frame rate;
- quality;
- UI state;
- imported summaries.

Keep SCORE monotone while live if that remains the current scoring contract.

Settlement must be idempotent.

Do not grant rewards for:

- abort;
- failure;
- audit budget exhaustion;
- stale result;
- duplicate transaction;
- untrusted import.

When changing scoring:

- version the model;
- update terminal replay;
- update projections;
- update result;
- update tests;
- update agents;
- update balance reports;
- update documentation.

---

## Result

Result should explain the completed World.

Keep:

- final SCORE;
- Echoes;
- Environment context;
- extinction cause;
- meaningful milestones;
- manual Next World;
- Evolution;
- History;
- automatic-continuation state.

Result should not become a telemetry dump.

Keep terminal facts in a stable, readable layout.

Keep continuation and primary actions outside the scrolling evidence body.

Use one scroll owner.

At small viewports and `200%` text:

- primary actions remain reachable;
- no horizontal page scroll appears;
- nested scrolling is avoided;
- focus order remains logical.

Result UI is not reward authority.

Closing or opening Result must not alter the settled transaction.

---

## HUD

The ordinary World HUD should remain compact.

Current primary concepts are:

- SCORE;
- REACH;
- Environment Level;
- Result when available.

Keep metric tracks stable as values change.

Do not expose every internal coefficient.

A metric surface should answer:

- what is happening;
- why;
- what changed;
- what the player can do.

It should not present raw implementation details without player meaning.

World speed belongs to the direct in-World control.

Do not duplicate it in Menu.

---

## Menu

Keep Menu small.

Use it for persistent preferences and destructive lifecycle actions that do not belong in the direct World rail.

Do not add tuning controls for:

- camera inertia;
- orbit speed;
- idle delay;
- sphere position;
- continuation duration;
- simulation internals;
- life-boundary style, width, color, or intensity.

Choose good defaults.

Settings should remain narrow:

- auto continuation;
- quality;
- motion;
- contrast;
- local data/reset;
- any other currently justified durable preference.

Do not surface internal adaptive policies as settings without demonstrated user need.

---

## Surfaces and focus

Use one coordinator for transient surfaces.

A surface owns:

- open/closed state;
- focus entry;
- focus restoration;
- escape behavior;
- backdrop behavior;
- scroll ownership;
- camera hold;
- trusted-interaction implications.

Do not let multiple modules independently open or close the same surface.

Native controls remain interactive.

Direct globe manipulation may remain available on exposed canvas when product policy permits.

Opening a surface must not unexpectedly:

- rotate the globe;
- change zoom;
- alter simulation;
- continue stale camera velocity;
- fire a hidden purchase.

Closing a surface should restore focus predictably.

---

## History

History is observation, not control.

Semantic History is authoritative.

Visual History is approximate and bounded.

Keep channels versioned and explicit.

A History checkpoint must not become a simulation save.

Loading History must not:

- pause or alter authority unless current product policy explicitly says so;
- change reward state;
- change Evolution;
- replace the live World;
- mutate RNG.

A historical time label and visual state must match.

If a visual checkpoint is absent or incompatible, retain semantic History and disclose the limitation.

Keep visual storage bounded.

Validate imports.

Do not execute imported data.

Do not trust imported result projections.

---

## Rendering

Rendering projects immutable state.

WebGL2 is primary.

Canvas 2D is a semantic fallback.

Both must preserve:

- whole-cell geography;
- local resource condition;
- ordinary life state;
- stress and critical state;
- dead remains;
- transformations;
- Luminous charge;
- selection;
- History emphasis;
- Evolution state;
- Trophy state.

Semantic parity does not require pixel identity.

Within the World scene, ordinary life is edge-primary.

Use one deterministic renderer-semantic projection from the two cells adjacent to each topology edge.

WebGL2 and Canvas 2D must consume equivalent edge classifications rather than maintaining separate life-state precedence rules.

The exposed active frontier should be more salient than an edge between two ordinary living cells.

Stress and critical state must remain distinct through more than hue alone.

Dead remains must read as residual rather than living or powered.

Ordinary living and frontier interiors must preserve biome and resource information.

Stress, critical state, and remains may use restrained interior support only when the boundary remains primary.

Luminous remains a whole-cell powered semantic and must not be confused with ordinary life.

Selection and History retain independent cues that remain legible over life boundaries.

Geography and life may share an existing boundary pass, but neither may silently replace the other.

Do not increase simulation resolution to fix a cosmetic silhouette.

Do not add a pass when an existing pass can own the replacement cleanly.

Do not leave old and new visual authorities active together.

Static geometry should be created once or cached.

Do not rebuild static geometry per frame.

Do not allocate per-cell or per-edge objects in hot render paths.

Dynamic edge presentation should use reusable typed buffers, remain `O(edgeCount)` per accepted semantic snapshot update, and should not rebuild merely because animation time advances.

Keep draw calls measured and bounded.

Keep Canvas playable after WebGL context loss.

A renderer change must preserve picking or update picking coherently.

The atmosphere is a visual concern.

Its appearance must not alter simulation.

Ordinary life, geography, resources, Luminous charge, selection, and History must remain distinguishable.

Do not let ordinary life erase terrain and resource information.

Do not let ordinary life look powered when authoritative charge is zero.

Use controlled fixtures and real browser evidence for visual changes.

Avoid exact screenshot hashes as the primary cross-GPU oracle.

---

## Visual verification

For a rendering or visual-semantic change, provide controlled evidence.

Use relative measurements where possible.

Relevant measurements may include:

- edge versus interior contrast;
- exposed frontier versus internal living-edge salience;
- state ordering;
- center and limb continuity;
- silhouette deviation;
- day/night visibility;
- close/far camera behavior;
- selected/unselected state;
- zero-charge controls;
- WebGL2/Canvas semantic ordering;
- draw count;
- buffer update size and cadence;
- frame cost.

Screenshots supplement measurements.

Screenshots do not replace:

- geometry;
- contrast;
- state;
- performance;
- browser;
- fallback evidence.

Capture representative output at the required responsive viewports.

Do not approve a visual change from one screenshot.

Calibrate pixel thresholds against repeat noise and leave a meaningful pass margin.

---

## Accessibility

Accessibility is part of the product contract.

Use native controls when suitable.

Provide accessible names.

Keep visible focus.

Keep keyboard access to every meaningful action.

Do not rely on hover.

Do not rely on color alone.

Use non-color state cues.

Maintain minimum touch targets.

Respect `prefers-reduced-motion`.

Support forced colors.

Support high contrast.

Support `200%` text.

Do not create high-frequency live-region updates.

A nonnumeric visual continuation must retain exact accessible text.

A dynamic metric should announce only meaningful changes.

Do not move focus every time a metric updates.

Do not trap focus outside a real modal surface.

Canvas-only visual meaning must have a truthful textual or structural equivalent where player understanding depends on it.

Test with keyboard-only interaction.

Test focus restoration.

Test reduced motion in the real browser.

---

## Responsive behavior

Required viewport evidence normally includes:

- `320×568`;
- `360×640`;
- `390×844`;
- `430×932`;
- `768×1024`;
- `844×390`;
- `1024×600`;
- `1440×900`.

Measure:

- page overflow;
- canvas bounds;
- usable canvas;
- globe center;
- globe radius;
- globe diameter;
- stable controls;
- overlap;
- touch targets;
- Result actions;
- scroll owners;
- safe areas;
- focus visibility.

Do not infer responsive success from CSS source.

Use browser rectangles.

A screenshot is not a rectangle oracle.

Preserve portrait and landscape.

Preserve small landscape.

Preserve safe-area insets.

Preserve keyboard and virtual-keyboard behavior where the environment permits evidence.

---

## Persistence

Persistence is current-only unless a maintained consumer requires migration.

Version every durable document.

Validate every loaded document.

Reset mismatched current-only documents.

Do not accumulate migration layers by default.

Use exact integer strings for unbounded progression quantities.

Normalize before arithmetic.

Bound arrays, queues, History, Trophies, receipts, and caches.

Use transactional revision checks for progression purchases.

Reject stale expected revisions.

Use transaction keys for idempotence.

Do not persist presentation-only camera motion.

Do not persist developer mode as a normal preference.

Do not persist diagnostic-only speed in ordinary settings.

Do not persist untrusted projections as reward facts.

---

## Import and security

Treat imported data as hostile.

Validate:

- type;
- version;
- size;
- count;
- exact integer syntax;
- enum values;
- IDs;
- checksums where used;
- namespace;
- bounded nesting.

Reject or reset invalid data.

Do not execute imported strings.

Do not interpolate imported HTML.

Do not trust imported SCORE, Echoes, Trophies, or terminal summaries.

Recompute trusted facts through authority where supported.

Keep Content Security Policy and static-host constraints in mind.

Do not add remote runtime dependencies casually.

---

## Performance

Measure before optimizing.

Preserve determinism.

Do not skip authoritative ticks.

Use same-host comparisons.

Record:

- revision;
- hardware and browser where available;
- command;
- fixture;
- duration;
- result;
- authority hash;
- profile hash.

Investigate a same-host regression around `10%` or greater unless a measured product gain justifies it.

Keep bounded:

- tick debt;
- work per slice;
- camera samples;
- continuation state;
- History;
- reports;
- caches;
- agent traces;
- notifications;
- Trophy queues;
- renderer-semantic buffers and update work.

Avoid:

- per-frame static-geometry rebuild;
- per-cell or per-edge object churn;
- unbounded DOM growth;
- unbounded event listeners;
- duplicate render loops;
- duplicate timers;
- synchronous storage in hot paths.

High diagnostic speed may reduce presentation frequency.

It must not reduce authoritative tick count.

---

## Testing

Test at the layer that owns the property.

### Pure and unit tests

Use for:

- schedules;
- validation;
- exact integer arithmetic;
- progression compilation;
- scoring;
- camera math;
- layout geometry;
- continuation projection;
- accessibility projections;
- renderer-semantic projections;
- codecs;
- boundedness.

### Integration tests

Use for:

- Worker/fallback agreement;
- stale identity rejection;
- settlement idempotence;
- settings reset;
- History switching;
- multi-World continuation;
- progression transactions;
- authority hashes.

### Browser tests

Use for:

- real entry point;
- DOM;
- focus;
- keyboard;
- pointer;
- touch;
- pinch;
- wheel;
- layout rectangles;
- rendering;
- controlled visual fixtures;
- context loss;
- WebGL2;
- Canvas;
- Worker;
- fallback;
- reduced motion;
- forced colors;
- `200%` text;
- safe areas where available.

### Balance and agent tests

Use production authority.

Use cohorts.

Use holdout seeds.

Use multi-World campaigns.

Do not reward budget exhaustion.

### Verification cadence

Use focused tests while editing.

Do not run the full suite after every small change.

Run one fresh complete verification against stable final content.

Classify:

- passed;
- failed;
- skipped;
- unavailable;
- not run;
- stale;
- superseded.

A skipped, unavailable, or stale test is not a pass.

---

## Browser evidence

Use the production entry point.

Use trusted input where interaction matters.

Exercise relevant lifecycle paths:

- Home;
- first World;
- Result;
- automatic next World;
- manual next World;
- Evolution;
- History;
- Trophies;
- New World;
- reset.

When relevant, exercise:

- mouse;
- touch;
- pen where available;
- keyboard;
- focus;
- wheel;
- pinch;
- pointer cancellation;
- hidden page;
- context loss;
- Worker failure;
- fallback.

Record browser and renderer identities.

Do not call a synthetic event physical-device evidence.

Do not call a headless browser a physical device.

A local browser pass is not deployed-browser proof.

---

## Documentation

Current documentation must describe current behavior.

Update documentation in the same campaign when behavior changes.

Keep `README.md` player-facing.

Keep `docs/status.md` concise and factual.

Keep architecture and game-design documents current.

Keep balance targets distinct from measured distributions.

Keep decisions explicit.

Mark superseded decisions.

Do not rewrite historical evidence as though it measured a new policy.

Use Git history as the archive.

Do not preserve rejected architecture as current documentation.

Do not add a status file for every small step.

Do not duplicate the same current contract across many work packages.

Search for stale terminology and values before completion.

Run link checks.

Do not place transient campaign priorities in this file.

Do not put self-referential final commit identities inside the same commit whose identity they claim.

---

## Source and style

Use ES modules.

Use the repository's established JavaScript style unless a coherent local cleanup is part of the task.

Use clear names.

Use standard terminology.

Keep public copy concise.

Keep comments factual.

Avoid broad renaming without product or architectural value.

Avoid formatting-only churn in unrelated files.

Preserve file encoding and line endings.

Do not add generated artifacts to source control unless repository policy requires them.

Use ignored reports for large evidence.

Return paths and digests instead of pasting large logs.

---

## Git hygiene

Inspect status before editing.

Preserve unrelated changes.

Do not reset or clean a dirty worktree destructively.

Review the final diff.

Run `git diff --check`.

Account for every changed and untracked file.

Use coherent commits.

Do not force-push.

Do not rewrite published history.

Do not amend another contributor's commit without explicit reason and authorization.

When normal push is in scope:

- verify the intended branch;
- verify upstream;
- push normally;
- verify remote ref;
- verify CI;
- verify deployment;
- verify deployed bytes when production behavior matters.

If credentials are unavailable, state that.

A local commit is not a push.

A push is not CI success.

CI success is not deployment success.

Deployment success is not deployed-interaction proof.

---

## Completion standard

A task is complete only when:

- the selected product behavior exists in production code;
- one authority owns each selected rule;
- predecessor paths are deleted or explicitly superseded;
- focused tests pass;
- real browser evidence covers relevant behavior;
- Worker and fallback remain coherent;
- WebGL2 and Canvas remain semantically coherent when affected;
- accessibility is verified;
- responsive viewports are verified;
- performance is measured when affected;
- balance is measured when affected;
- documentation is current;
- the final diff is reviewed;
- `git diff --check` passes;
- worktree state is reported;
- commits are coherent;
- external actions are verified when in scope;
- unavailable evidence is named honestly;
- deferred concerns are preserved without speculative hooks.

Do not continue adding adjacent polish after the selected stopping rule is met.

Return an evidence packet containing:

- starting and final repository state;
- implemented behavior;
- authority and deletion summary;
- deviations and evidence;
- commands and results;
- passed, failed, skipped, unavailable, not-run, stale, and superseded checks;
- browser and responsive evidence;
- benchmark or balance evidence when relevant;
- report paths and digests;
- external action identities;
- known limitations;
- smallest plausible next campaign.

The goal is not the largest diff.

The goal is a smaller, clearer, more truthful, more testable product.
