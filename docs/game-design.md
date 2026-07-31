# Game design

Canonical product language: title **Incremental Network**; tagline
*Every extinction becomes memory.*; premise
「球体世界に網状生命を育て、絶滅を次の記憶へ変える。」
Score = **Network Score / ネットワークスコア**; currency = **Echoes / エコー**;
skill tree = **Memory Globe / 記憶球**; archive = **Extinction Archive / 絶滅記録**;
active verb = **Signal / シグナル**; mutation draft = **Adaptation / 適応**;
world pressure = **Entropy / エントロピー**; first resolution trophy =
**Beyond the Last Cell / 最後の細胞の先へ**.

## Core loop

1. Inspect the rotating world (seed, biome tendencies).
2. Pick 1 of ≤3 strains (first run preselects Pioneer, changeable).
3. Inoculate: tap the globe or accept the recommended region.
4. Watch automatic growth: seek nutrients, reinforce useful routes, prune.
5. Optional Signals: tap to place a temporary attraction field (3 charges,
   regen ~1 per 15–25 game s).
6. Adaptation drafts at milestones: 3 cards, pause at 1× by default,
   policy-driven at high speed.
7. Respond to telegraphed environmental crises.
8. Extinction: network fades in causal order; never an abrupt modal.
9. Result: one integer score + rank + breakdown + Echoes + trophies.
10. Memory Globe: spend Echoes on permanent veins across a second sphere.
11. Restart instantly, or auto-retry under a chosen policy.

## Run pacing (game time)

| Range | Phase | Experience |
|---:|---|---|
| 0–15 s | Germination | Immediate bloom, forgiving resources |
| 15–75 s | Abundance | Fast expansion, first Signal, first adaptation |
| 75–165 s | Competition | Local scarcity, pruning, 2nd–3rd adaptations |
| 165–245 s | Instability | Seasonal swings, seeded crises |
| 245–300 s | Collapse | Renewal fails, fragmentation |
| 300–360 s | Terminal | Hard ceiling converts power into score |

## Adaptation categories (6)

Reach · Metabolism · Resilience · Transport · Symbiosis · Memory.
A card may belong to two categories. Every card has a real tradeoff.
Ship ≥24 cards before adding more.

## Phenotype synergies (≥8)

World Vein, Glass Bloom, Quiet Fortress, Phoenix Mesh, Storm Reader,
Living Reservoir, Nomad Lattice, Toxic Garden. Each alters behavior or
presentation, is recorded in the archive, and maps to a trophy.

## Events (8 families)

Drought front, thermal bloom, deep freeze, toxic rain, solar flare,
volcanic ash band, nutrient bloom, parasitic blight. Each has a telegraph,
spatial footprint, clear effect, ≥2 responding adaptation categories,
Japanese text, and an event-history entry. Positive events are sparse.
A deterministic anti-streak rule prevents family repetition.

## Score

```
quality = 0.24 survival + 0.24 peakCoverage + 0.18 sustainedCoverage
        + 0.14 connectivity + 0.12 efficiency + 0.08 crisis
score   = round(1_000_000 * quality * challengeMultiplier + explicitBonuses)
```

Bands: 20k–80k first runs · 80k–200k learning · 200k–450k strong builds ·
450k–750k mastery · 750k+ exceptional. Ranks: Seed, Thread, Mesh, Web,
Cortex, Planetary, Transcendent.

Echoes: `floor(baseMilestone + sqrt(score / 1500) + challengeEchoes)` —
diminishing returns; every run matters, no single run buys the tree.

## Progression

Memory Globe: 36–48 nodes on a low-res sphere, six branches mirroring the
adaptation categories. Nodes grant cards, strains, Signal control, forecasts,
one reroll, memory slots, challenges, visual styles, autoplay policies,
auto-retry, archive tools, capstones. Raw power stays bounded.

Campaign resolution (~4 runs): foundational nodes → phenotype discovery →
survive into terminal pressure → Continuity node + transmission run. The run
still ends in extinction; one memory filament escapes. Trophy: *Beyond the
Last Cell*. Then: challenges (Barren / Volatile / Fractured / Silent Sphere),
full trophy board, endless post-clear objective.

## Trophies

32 core trophies (progression ×8, mastery ×8, build discovery ×8,
automation/speed/challenge ×8). Deterministic paths, visible conditions
(unless intentionally secret), progress indicators, no online dependence.
See `src/game/trophies.js` for the authoritative definitions.

## Strains

Pioneer (fast exploration, fragile) · Conservator (efficient, resilient,
slow) · Weaver (strong transport/loops, high maintenance).

## Autoplay policies

Balanced · Expansion · Resilience · Efficiency. Deterministic heuristics
using only player-visible information. Auto-retry stops on: new trophy,
personal best, N runs, score threshold, or any pointer interrupt. Never
runs in a hidden tab.
