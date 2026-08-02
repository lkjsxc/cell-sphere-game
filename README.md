# incremental-network-game

> **Every extinction becomes memory.**
> 球体世界に網状生命を育て、絶滅を次の記憶へ変える。

A one-pointer roguelite incremental game played on a living spherical world.
Cultivate a slime-mold-like network organism across a globe that inevitably
dies — then turn each extinction into permanent memory on a spherical skill
tree. Built with vanilla HTML/CSS/JavaScript and WebGL2: no engines, no
frameworks, no runtime dependencies, no external requests.

**Play:** https://lkjsxc.github.io/incremental-network-game/ *(Pages deployment
verified on 2026-08-02; see `docs/status.md`)*

Submitted to the [ZEN Study プログラミングコンテスト 2026 夏](https://progedu.github.io/webappcontest/2026/summer/index.html),
Webページ部門 (ZEN大学). Deadline 2026-09-13.

## How to play

1. Drag the title globe or tap it to wake a bounded cellular bloom.
2. Press **Inoculate**. The recommended Pioneer strain begins immediately.
3. Watch it explore and reinforce shared cell boundaries; tap a visible cell
   to place a **Signal** and drag or pinch to inspect the planet.
4. Choose **Adaptations** at milestones and survive spatial crises.
5. Extinction yields an authoritative **Network Score** and **Echoes**. Enter
   the **Memory Globe**, purchase a reachable filament, then grow the next
   world with the purchased effect applied.

Speed controls: pause · 1× · 2× · 4× · 8× · 16× · 32× (Turbo). Same seed +
same decisions = the same result at any speed.

## Technical highlights

- Explicit spherical dual mesh: 2,562 simulation/render cells, 7,680 shared
  boundaries, mostly hexagons, and exactly twelve pentagonal **World Knots**.
- Deterministic typed-array simulation (xoshiro128**, fixed 10 Hz authority)
  running in a Web Worker or the same main-thread `RunController` fallback.
- WebGL2 dual-cell renderer with discrete procedural ocean/land materials,
  etched boundaries, boundary-aligned transport, atmosphere, title bloom,
  and graphite Memory Globe state; playable Canvas 2D fallback remains.
- One complete persistent transaction: score → Echoes → Memory purchase →
  saved filament → next-run trait. Six bounded Memory nodes form the initial
  progression path; broader campaign content remains in development.
- Production simulation powers unit/integration tests, balance smoke, and the
  benchmark. No runtime dependency or downloaded media is used.

## Local development

```bash
npm run serve        # http://127.0.0.1:8080
npm test             # unit + integration (node:test, zero deps)
npm run test:browser # headless-Chrome browser tests
npm run verify       # structure + tests + balance smoke + benchmark + links
```

Docker: `docker compose up serve` / `docker compose run --rm verify`.

## Repository map

```
index.html          app shell (semantic DOM, all screens)
styles/             design tokens + native CSS by responsibility
src/core/           PRNG, fixed math, clock, state machine, hashing, seeds
src/world/          icosphere topology + environmental fields
src/simulation/     deterministic tick (no DOM/GL/storage imports)
src/game/           adaptations, phenotypes, scoring, progression, balance
src/rendering/      WebGL2 renderer, Canvas fallback, camera, picking
src/interface/      screens, HUD, user intent
src/platform/       storage, settings, audio, share, lifecycle
tests/              unit / integration / browser / fixtures
scripts/            serve, verify, benchmark, balance, structure gate
docs/               vision, design, architecture, evidence, status
```

Every directory contains a README with purpose and invariants. Structure
rules (≤200 lines/file, ≤16 children/dir, README per directory) are enforced
by `npm run check:structure`.

## Privacy

All progression stays local (localStorage). No analytics, ads, accounts, or
network calls after load. Sharing is explicit and browser-native.

## License & media

Code: Apache-2.0 (see `LICENSE`). All visuals and audio are generated
procedurally or hand-authored in this repository — no third-party media,
fonts, icons, or samples.
