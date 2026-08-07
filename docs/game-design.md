# Game design

## North star

A calm, legible incremental roguelite where autonomous whole-cell ecology grows,
struggles, becomes extinct, and leaves permanent memory. The player makes
meaningful choices between worlds through Evolution, not repetitive mid-run
clicking.

## Core loop

```text
start a new autonomous world at Environment Level 0
→ observe resources, geography, pressure, growth, and collapse
→ Environment Level rises during that same world
→ extinction records how far and how well ecology endured
→ SCORE converts quality into Echoes
→ buy permanent Evolution
→ Next World starts again at Environment Level 0
```

Environment Level is neither a difficulty selector nor an unlocked frontier.
Every world uses the same public schedule. Evolution changes effective pressure,
not displayed level/time. The first two worlds suppress harmful events only via
an explicit onboarding modifier; World 3 may introduce a mild late telegraphed
event under the same clock.

Ordinary fresh worlds target roughly 270–330 game seconds through ecology and
escalating pressure, not a rewarded timeout. Every finite build eventually dies;
stronger matched builds reach higher levels and longer survival distributions.

## Ecology

The world is whole-cell geography: land, coast, ocean, lakes, shores, wetlands,
forest, tundra, snow, ice, resources, life, stress, remains, transformations,
and charge. There are no sub-cell rivers, roads, paths, ribbons, or wires.

Local finite resources, renewal, depletion, exhaustion, recovery, reclamation,
and freshwater catchments remain authoritative and visible. ENTROPY does not
wash out local resource meaning. Luminous cells glow only from actual
whole-cell charge, which decays with upkeep.

## Evolution

The Evolution Globe has 252 cells across Fertility, Freshwater, Scarcity,
Cryogenic, Marine, and Luminous affinities. Level 0 is locked, Level 1 is the
authored identity, and later levels are exact unlimited upgrades. A Level-0-to-1
purchase needs Echoes plus one adjacent owned Level-1 cell; six roots bootstrap
a fresh save. Later purchases need ownership and Echoes.

The rendered cell is a select-then-second-activation control. First activation
opens detail; only a later discrete activation of the same selected ready cell
buys one level. Dragging, cancellation, inertia, blank taps, and stale commands
never buy.

Breadth and depth both matter. Multi-affinity recipes need distinct relevant
cells; one deeply upgraded cell cannot replace a complete build. All 252
Level-1 cells are breadth-complete, not final Evolution.

## SCORE, Echoes, and recognition

SCORE v5 is monotone and shared by HUD, Result, History, audits, and agents. It
combines cumulative ecological quality, exact World Potential, and sustained
dynamic pressure exposure. Peak level alone is insufficient; instant death is
not a farm. Echoes follow the exact continuation curve and support ongoing
purchases.

REACH 100% requires every authoritative world cell alive simultaneously for the
documented interval. It is rare, possible in late builds, and never permanent.
The 96-cell Trophy Sphere consumes completed evidence only; it never changes
simulation, pressure, costs, rewards, or eligibility.

## Interface

Primary scenes are Home, World, Evolution, and Trophies. The World HUD displays
live Environment Level and optional schedule progress separately from ENTROPY.
Result displays final/peak level, exposure, time at peak, SCORE, Echoes, causal
extinction, powered ecology, and Trophies. Its primary action is **Next World**.
Evolution truthfully states that every world begins at Level 0 and shows the
best actually reached record without implying it is a future start level.
