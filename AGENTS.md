# AGENTS.md — handoff contract for coding agents

Read order at the start of every turn:

1. This file.
2. `README.md`.
3. `docs/status.md`, then `docs/vision.md` and the doc for the area touched.
4. `git status`, branch, recent commits, uncommitted changes.
5. Run `npm run verify` (or the fastest relevant subset) before editing.
6. Read the actual source files involved — never infer from summaries.

## Non-negotiables

- Canonical name `incremental-network-game` + tagline; north-star timings (270–330 s median run, ~360 s ceiling,
  18–24 min resolution, ~4 h trophies), deterministic simulation, pointer-only
  completeness, low-heat goal, and honest evidence survive redesigns.
- No mocks, placeholders, fake metrics, decorative buttons, or TODO-driven UX.
  Omit an unfinished feature rather than fake it.
- No Python. No runtime third-party libraries of any kind. No CDNs, remote
  fonts/media/audio. Browser JS + Node scripts only.
- No `Math.random` in simulation/content selection. No frame-rate-dependent
  simulation. No background execution in hidden tabs.
- Keep files ≤200 lines and directories ≤16 children; README per directory;
  no `old/new/legacy/temp/v1/v2/final` names. `npm run check:structure`
  enforces this.

## Architecture boundaries

`interface → rendering → simulation → world → core`; `game` feeds content to
simulation and interface; `platform` is adapters only. Simulation imports no
DOM/GL/storage/audio. Renderer never mutates simulation state. See
`docs/architecture.md` and `docs/simulation.md`.

## Verification commands

```bash
npm run check:structure
npm test
npm run test:browser     # requires Chrome; skips (exit 77) if the sandbox blocks Chrome networking; not in verify
npm run balance:smoke
npm run benchmark
npm run check:links
npm run verify           # all of the fast gates
```

## Working rules

- Small coherent commits; never one giant commit; never "update" messages.
- Update tests with behavior; golden updates need a `docs/balancing.md` entry.
- Update `docs/status.md` at the end of every turn: final commit, playable
  systems, incomplete systems, commands run + results, metrics, risks, next
  actions.
- Push only with evidence; never claim a push succeeded without verifying.
- When blocked, prefer measuring and simplifying over weakening requirements.

## Handoff report format

Starting commit · final commit · branch/upstream state · playable URL ·
product changes · architecture changes · simulation/balance changes ·
rendering/UI changes · accessibility changes · performance results (env +
before/after) · test results (exact commands) · Docker results or exact
limitation · mobile evidence (actual vs emulated) · commits created · known
failures · next actions by contest impact.
