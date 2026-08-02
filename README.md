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

1. Tap **ネットワークを始める**. The recommended Pioneer strain inoculates immediately.
2. Watch it explore, reinforce useful veins, and prune weak branches.
3. Tap the globe to place a **Signal** that guides growth; drag to rotate.
4. Choose **Adaptations** at milestones; survive telegraphed crises.
5. Extinction is inevitable. Read the authoritative **Network Score** and
   **Echoes**, then begin the next world. Memory Globe spending is not yet in
the live build and is intentionally not exposed as a dead control.

Speed controls: pause · 1× · 2× · 4× · 8× · 16× · 32× (Turbo). Same seed +
same decisions = the same result at any speed.

## Technical highlights

- Deterministic spherical simulation on a 2,562-node geodesic icosphere
  (xoshiro128** PRNG, typed-array SoA state, fixed 10 Hz tick, ~3,000
  ticks/run) running in a Web Worker.
- WebGL2 renderer with instanced vein ribbons, biome-shaded globe,
  atmosphere rim, event footprints — plus a playable Canvas 2D fallback.
- Data-driven content: 24+ adaptations, 8 phenotypes, 8 event families,
  36–48 Memory Globe nodes, 32 trophies, 4 challenge modifiers.
- Headless balance harness and benchmark run the *production* simulation.
- Procedural audio and share-card images; offline-capable PWA.

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
