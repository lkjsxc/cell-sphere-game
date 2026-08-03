# Status

Release-candidate handoff for the cellular-world, progression, and evidence pass.

- **Starting commit:** `fcbb544f60b37b13005b29f954ad5dcd8231738e`.
- **Implementation tip:** `e6a6bfb`.
- **Released commit:** `6a143d3d51430b7e53165d9603ba5bee5130d969`.
- **Branch/upstream:** `main` and `origin/main` synchronized at the released commit.
- **Protective tag:** `pre-cell-sphere-game-rename-20260803` at the starting commit.
- **Playable URL:** <https://lkjsxc.github.io/incremental-network-game/>. Workflow
  `30808463755` completed verify job `91669226956` and Pages job `91669459530`;
  deployment `5725150277` reports success for the released SHA.

## Product changes

- The right-biased sphere composition is viewport-derived and does not shift
  when transient surfaces open. Outside gestures dismiss only when their native
  target is neither a meaningful control nor a globe cell.
- Manual Adaptation selections and mode changes use acknowledged protocol-v2
  commands. Pending, applied, and rejected states are explicit; pointer input
  cannot silently no-op.
- The clock has hour and minute hands sharing one game-time phase. Pausing holds
  both hands. Result continuation is a one-shot state machine; interaction and
  detail surfaces suspend rather than permanently cancel it.
- Reach Balance is authoritative. Every production birth/death passes through
  one helper and records a fixed direct cause into a 15-second typed ring,
  bounded samples, and full-run totals. Run/result surfaces expose gains,
  losses, conditions, turning point, and exact cell highlighting.
- All event effects propagate over deterministic topology-native fields. Rivers
  use explicit continuous trunks and connected channel rendering.
- Evolution Globe now fills all 642 level-3 cells: six connected 107-cell
  territories, 636 adjacent prerequisites, 642 exact effects, six roots, and a
  2,462-Echo economy gated through world 164.
- Trophy Sphere is a separate 162-cell level-2 view with 96 authored criteria in
  six families and 66 inert substrate cells. Schema-3 History retains bounded
  deterministic proof; schema-6 ownership is monotonic. Schema-5 data grants no
  Trophy merely on load. Explicit Trophy review and progression transactions
  conservatively backfill retained proof.

## Architecture and persistence

- Boundaries remain `interface → rendering → simulation → world → core`.
  Trophy recognition and presentation never enter simulation, score, Echo
  income, or random streams.
- Skill content now lives under `src/game/skills/`; Trophy content/proof lives
  under `src/game/trophies/`; progression sphere coordination was extracted
  from the 200-line app controller.
- Worker/fallback determinism, run IDs, stale-response guards, terminal
  first-wins behavior, and bounded result transaction keys remain intact.
- Existing Echoes, Skill Cells, Imprints, History, scores, and world-seed cursor
  migrate without refunds or guessed proof. Unknown Skill/Trophy/card IDs are
  filtered or quarantined.

## Simulation and balance evidence

- Full 180-world policy sweep: median survival 267.1–296.7 game seconds by
  policy; first/random/resilience/efficiency medians are 270.1–296.7, with
  balanced/expansion at 267.5/267.1. Maximum remains bounded at 362 seconds.
- 1,000-world terminal soak: 151,803.4 ms; zero invalid outcomes, duplicate
  terminal messages, or liveness repairs; tick min/median/p95/max
  254/2,719/3,612/3,620.
- Event audit at the graph-field commit: 1,386 events, zero land-bound ocean
  crossings, all non-radial, median field generation about 0.192 ms.
- River audit over 1,000 worlds: median longest trunk 28 cells; 99.7% had a
  trunk at least 20; maximum 61; zero cycle, mouth, continuity, accumulation,
  or isolation defects.
- Skill audit: 642/642 unique cells/effects legally purchased, 636 relations,
  mapping `d6bdc218`, balance after exhaustive purchase 0.
- Trophy audit: 96 unique criteria/cells, mapping `93870583`, 66 neutral cells,
  1,920,000 evaluator calls / 960,000 pass-fail boundaries in 178.323 ms.

## Rendering, UI, and accessibility evidence

- WebGL2 remains four draws. The full browser scenario completed at 32× in
  8.82 s with score 614,708; title JS presentation mean 0.07 ms, p95 0.20 ms.
- Canvas 2D completed title, run, visual History, Evolution Globe, and Trophy
  Sphere with score 613,052.
- Chrome evidence covers 320×568 through 1920×1080, portrait, landscape,
  tablet, desktop, and 200% run-dock text. Evolution and Trophy detail are
  fixed-flow bottom sheets on mobile and safe left surfaces on desktop.
- Pointer-only completion includes exact Skill/Trophy cell selection. Semantic
  access includes the 642-item Skill tree and six-row, 96-cell Trophy grid with
  roving arrow-key focus. Reduced motion, forced-color borders, focus restore,
  explicit Close, Escape, and target-aware outside dismissal remain.
- Mobile evidence is CDP viewport emulation, not physical-device evidence.

## Exact verification

Environment: Node v22.22.3, Linux x64, 20 logical CPUs.

- `npm run verify` — PASS: structure; showcase; 118 unit; 61 integration;
  balance smoke; benchmark; 118-module/10-HTML link gate.
- Final host benchmark — 2,640 ticks in 181 ms, 14,561 ticks/s, hash `637b2473`.
- `npm run balance` — PASS, 180 production worlds.
- `node scripts/audits/terminal-soak.mjs --count=1000` — PASS as above.
- `npm run audit:skills` — PASS.
- `npm run audit:trophies` — PASS.
- `npm run test:browser:file` — PASS, WebGL2, no browser errors.
- `npm run test:browser:canvas` — PASS, forced Canvas 2D.
- `docker compose run --rm verify` — PASS on Node v22.23.2 / 32 CPUs;
  benchmark 2,640 ticks in 187 ms, 14,082 ticks/s, hash `637b2473`.

## Known limitations and next actions

- The requested `cell-sphere-game` product/repository/storage-key rename was not
  performed: the repository's active agent contract explicitly requires the
  canonical `incremental-network-game` name and tagline to survive redesigns.
  A maintainer must revise that higher-priority contract before a truthful full
  rename and GitHub repository rename can proceed.
- Physical mobile touch/thermal/battery/GPU timing, screen-reader manual audit,
  forced-colors visual review, Japanese localization, and the broader
  100–200-hour challenge/discovery layer remain incomplete.
- CI and Pages both succeeded. Cache-busted HTTP checks returned 200 and exact
  SHA-256 byte matches for `index.html`, app controller, Skill/Trophy catalogs,
  Reach ledger, Trophy CSS, title showcase, and this status file at `6a143d3`.
