# Game design

## North star

A calm, legible incremental roguelite where the player observes autonomous
ecology, learns why a finite world ended, and makes one meaningful permanent
choice between worlds. The world asks for attention, not repetitive clicking.

## Loop

```text
observe an autonomous finite ecology
→ local reserves, pressure, and maintenance create ecological limits
→ inspect SCORE, Reach, Environment Level, cells, and History
→ extinction awards Echoes
→ buy one permanent Evolution level
→ advance the Environment frontier or retry it
→ begin a changed world
```

There are no mandatory mid-run decisions. Active Adaptation offers and modes are
retired. This keeps speed changes equivalent and lets environmental events be
world conditions rather than prompts.

## Early campaign

Worlds 1 and 2 teach growth, local consumption, renewal, overextension, and
maintenance under protected Environment Level 0 with no harmful events. World 3
attempts Environment Level 1 and introduces exactly one mild pressure late in
the run. Later unlimited levels increase visible deterministic pressure; world
ordinal remains run-history order and never doubles as difficulty.

Ordinary worlds aim for 270–330 game seconds with a near-360-second bound. The
first meaningful campaign resolution should emerge after roughly 18–24 minutes
at 1×; a strongly learning save reaches roughly 80k–130k World Potential after
12–18 minutes without a first-purchase SCORE explosion.

## Finite ecology

Each whole cell has an immutable resource baseline plus available nutrient,
reserve, renewal, recyclable stock, terrain/climate suitability, uptake,
maintenance, and route cost. Birth and continued life spend local resources;
poor cells reject fresh colonization before RNG. Networks may move support but
cannot create stock. Whole-cell colors distinguish rich, strained, depleted,
exhausted, recovering, and reclaimed state. Freshwater offers a finite local
advantage through conservation-accounted catchments, not magic energy.

## Habitats

Cold and water are permanent strategic frontiers:

- lakes require lacustrine access;
- tundra requires cold proteins;
- snow/ice requires a cryogenic matrix and practical traversal through tundra;
- shallow-ocean edges and general shallow ocean unlock separately;
- deep ocean requires expensive pressure adaptation and an ecological route
  through shallow water.

All habitats are whole-cell states. Deep ocean has very low growth suitability,
high maintenance, low renewal, and high route cost. Access expands possibility
without turning ocean into free coverage.

## Evolution

The Evolution Globe is a frequency-5 sphere with exactly 252 cells in six
connected 42-cell affinities: Fertility, Freshwater, Scarcity, Cryogenic, Marine,
and Luminous. Its canonical exact level vector is sparse: omitted cells are Level
0 (locked), Level 1 is each cell's authored identity, and Level 2+ is unlimited.

Level 0 → 1 requires enough Echoes and at least one directly adjacent Level-1+
cell; the six roots may bootstrap only a fresh vector. Once owned, every later
upgrade requires ownership and Echoes only. No run count, observed-world count,
all-parent, Trophy, random, or hidden experience gate exists. Each transaction
raises one cell by one level and debits one exact cost.

The 252 authored Level-1 purchases cost 17,820 Echoes and yield World Potential
v3 value 1,200,000. That is level-one breadth, not completion. Repeat costs use a
direct exact monotone superlinear curve. Later levels refine authored effects
through bounded mechanics while exact depth, defense, Build mastery, Potential,
and SCORE continue without a gameplay ceiling. Multi-affinity mastery uses
multiple distinct cells; one deeply upgraded cell cannot satisfy a recipe.

Levels, costs, Echoes, Potential, SCORE, and Environment Levels use `bigint`
operations internally and canonical decimal strings at JSON, storage, History,
agent, diagnostic, and hash boundaries. Details and purchase feedback show:

- current → next level and exact cost/balance;
- gameplay and World Potential before → after;
- affinity, text/pattern identity, Build/mastery progress, and tradeoffs;
- capability/rule unlocks and newly reachable neighbors.

## Environment Levels, SCORE, and Echoes

Environment Levels have no maximum. Completing the highest unlocked level opens
exactly the next one; the recommended action advances and the secondary action
retries the same level with the next deterministic seed. A versioned direct
compiler compares exact public pressure with exact Evolution defense across six
dimensions, then emits bounded finite runtime coefficients. It computes any
level without iterating through prior levels or increasing world size/event bounds.

SCORE v4 combines bounded cumulative run quality, exact World Potential v3, and
bounded Environment credit. Its visible monotone axes are Survival, Exploration,
Presence, Coherence, Stewardship, and Worldmaking. Credit needs meaningful
exposure and performance, so instant high-level extinction is not a reward farm.
Final SCORE is visible before extinction; Result performs no correction. Named
ranks continue through procedural cycles rather than ending at a final tier.

Echo rewards continue the exact square-root curve. Early rewards retain familiar
purchase cadence while exact balances and superlinear repeat costs let long fair
campaigns continue without one spike trivializing breadth or depth.

## Trophies

The Trophy Sphere has 96 read-only cells across Reach, Form, Endurance, Habitat,
Evolution, and Mastery. Criteria consume completed authoritative facts. One
onboarding Trophy is normal on the first world; later families require multiple
worlds, explicit habitat access, event eras, large Evolution ownership, or
high-quality SCORE, level-one breadth, or explicit mastery. Trophy recognition
never changes simulation, Environment pressure, Potential, purchase eligibility,
or SCORE.

Retired IDs and archived records remain legacy ownership but do not satisfy new
criteria by alias or by obsolete proof bits.

## Luminous and interaction

Luminous ownership alone never paints light. Production authority generates,
stores, and decays whole-cell charge; only nonzero charged cells glow, more
strongly on the night side. Mastery can improve bounded generation, retention,
and viable domains, but upkeep remains real and neither renderer draws wires.

The player can rotate and inspect at any time. Opening a pane never moves the
globe. Another detail replaces the current one; Close and Escape always work.
Evolution is the deliberate exception to same-trigger dismissal: first activation
selects and opens detail without buying, and a later activation of that same
selected ready cell buys exactly one level. Blank taps, changed selection, and
any drag/pinch/wheel/inertia/cancellation never buy. Pointer, touch, keyboard,
semantic tree, and detail button share the same transaction authority.

SCORE, ENTROPY, REACH, and terminal RESULT look clickable at rest; RESULT sits
immediately after REACH and is the recommended extinction action. A capable late
configuration may earn REACH 100 by keeping every authoritative cell alive for
25 ticks, but the world still ends. Notifications are bounded, queued,
nonblocking, and accessible.
