# Game design

## North star

A calm, legible incremental roguelite where the player observes autonomous
ecology, learns why a finite world ended, and makes one meaningful permanent
choice between worlds. The world asks for attention, not repetitive clicking.

## Loop

```text
observe an autonomous world
→ local reserves and maintenance create ecological limits
→ inspect SCORE, Reach, entropy, cells, and History
→ extinction awards Echoes
→ buy adjacent permanent Evolution
→ begin a changed world
```

There are no mandatory mid-run decisions. Active Adaptation offers and modes are
retired. This keeps speed changes equivalent and lets environmental events be
world conditions rather than prompts.

## Early campaign

Worlds 1 and 2 teach growth, local consumption, renewal, overextension, and
maintenance. They have no harmful planetary events. World 3 introduces exactly
one mild pressure late in the run. Later world eras grow more varied and
challenging without using wall-clock waits.

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

The Evolution Globe has exactly 252 meaningful Skill Cells in six connected
environmental affinities: Fertility, Freshwater, Scarcity, Cryogenic, Marine,
and Luminous. A purchase requires enough Echoes and one adjacent owned cell.
There is no run count, observed-world count, all-parent, or hidden experience
gate.

Every cell contributes authored identity, a direct gameplay change, and World
Potential. Resonance cells are smaller but real. Landmark cells add larger
scalars, conditional rules, habitat/rule unlocks, keystones, or capstones.
Details and purchase feedback show:

- gameplay before → after;
- World Potential before → after;
- affinity, text/pattern identity, cost, and held Echoes;
- capability/rule unlock and visible build progress/tradeoffs;
- newly reachable adjacent cells.

## SCORE and Echoes

SCORE v3 is `Run Quality × World Potential × Challenge`. Its six visible,
monotone cumulative axes are Survival, Exploration, Presence, Coherence,
Stewardship, and Worldmaking. Final SCORE is already visible before extinction;
Result performs no correction. Permanent Evolution raises World Potential, so
even similar run quality produces stronger—but bounded—SCORE.

Echo rewards use a bounded square-root curve. The fresh median earns 14 Echoes,
enough for one ordinary root purchase. Progression grows materially without
allowing a single late score spike to buy the entire Globe.

## Trophies

The Trophy Sphere has 96 read-only cells across Reach, Form, Endurance, Habitat,
Evolution, and Mastery. Criteria consume completed authoritative facts. One
onboarding Trophy is normal on the first world; later families require multiple
worlds, explicit habitat access, event eras, large Evolution ownership, or
high-quality SCORE. Trophy recognition never changes simulation or SCORE.

Retired IDs and archived records remain legacy ownership but do not satisfy new
criteria by alias or by obsolete proof bits.

## Interaction

The player can rotate and inspect at any time. Opening a pane never moves the
globe. Another detail replaces the current one; the same trigger toggles; Close
and Escape always work. Result uses the persistent primary selector rather than
adding duplicate progression navigation.

SCORE, ENTROPY, REACH, and terminal RESULT look clickable at rest; RESULT sits
immediately after REACH and is the recommended extinction action. A full late
build may earn REACH 100 by keeping every authoritative cell alive for 25 ticks,
but the world still ends. Notifications are bounded, queued, nonblocking, and
accessible.
