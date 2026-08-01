# Vision

**incremental-network-game** — *Every extinction becomes memory.*

A mobile-first, one-pointer roguelite incremental played on a living spherical
world. The player cultivates a slime-mold-like network organism that explores,
connects, reinforces, and prunes itself across a globe that inevitably dies.
Extinction is not failure; it is the currency of permanent memory.

## Product thesis

> Death is not failure. Every extinction teaches the next network how to grow.

The game must feel simultaneously alive, calm to watch, strategically
meaningful when guided, immediately satisfying, technically impressive without
looking like a demo, clear within ten seconds, and deep enough for roughly
four hours of trophy play.

## Non-negotiable timings (game time, normal speed)

| Target | Value |
|---|---|
| First visible growth | < 10 s after inoculation |
| First meaningful choice | < 60 s |
| Median run length (new save, balanced) | 270–330 game s |
| Hard run ceiling | ~360 game s |
| First campaign resolution (1×) | ~18–24 min |
| Full core trophy set (1×, skilled) | ~3.5–4.5 h |

Speed settings (pause, 1×–32×) compress wall time without altering simulation
rules. Turbo exists for experimentation, accessibility, and testing.

## Emotional arc of one run

Abundance → competition → instability → collapse → extinction → memory.
The world visibly tells this story through color, atmosphere, and network
morphology. The result screen explains *why* the network died and *what* it
achieved, then hands the player one clear next action.

## Winning criteria (what makes this a grand-prize work)

1. One-tap comprehension; a judge understands in 10 seconds.
2. An original engine-less spherical adaptive-network simulation (WebGL2).
3. Emergent but readable growth: reinforcement, pruning, fragmentation.
4. An emotionally coherent inevitable-extinction loop with permanent memory.
5. A Memory Globe skill tree that reuses the world's own visual language.
6. Deterministic simulation: same seed + decisions = same result at any speed.
7. Mobile-first, low-heat, 44px targets, reduced-motion safe.
8. Shareable deterministic fossils (score + seed + generated card image).
9. Excellent source: organized folders, comments, tests, honest docs,
   clean Git history, CI, performance evidence.

## What this game is not

Not a literal Physarum simulator. Not a dashboard. Not an idle game that
plays itself in a hidden tab. Not a gambling loop. Not a tech demo with a
UI bolted on. See `game-design.md` for the positive definition.
