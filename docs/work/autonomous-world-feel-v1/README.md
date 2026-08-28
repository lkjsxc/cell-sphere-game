# Autonomous World Feel v1

## Starting point

- Branch: `main`, starting revision `9fa658516ab763394b845c02819652a857a8e55a`, tracking `origin/main` at the same revision.
- Commits after the orientation revision: none.
- Relevant starting worktree: the user-supplied replacement `AGENTS.md` is modified and the full mandate is preserved as untracked `cell-sphere-game-codex-mandate-202608281253.md`.
- Prior package: `ecology-experience-v2` is complete; it is historical evidence, not active work.

## Confirmed root causes

- Public speed still means the raw effective multiplier: normal options are `[1, 2, 4, 8]`, settings schema 6 stores that scale, and both Worker and fallback multiply it directly into authoritative tick delivery.
- Globe input rotates only during pointer movement; release velocity and idle automatic motion have no production owner.
- World/Home framing is selected from aspect-dependent distance constants rather than a projected-diameter target.
- Result continuation has one sound nine-second authority, but its primary visible projection is the changing `Next world in N` label.

## Decisions and deviations

- Preserve all simulation, scoring, Evolution, Environment, History, renderer-pass, and draw-count authority.
- Use the mandate's selected speed mapping, camera constants, projected-size targets, and one continuation projection.
- Chrome was absent from the host. Chrome for Testing 152.0.7977.64 and runtime libraries were installed only under the user cache for trusted browser evidence; no shipped dependency was added.

## Completed phases

- Baseline repository, upstream, current CI, and deployed-byte reconciliation is complete.
- Baseline focused tests, benchmark, balance smoke, and trusted Worker/WebGL2 browser scenario are complete.

## Focused evidence

- Focused baseline: 61/61 unit and integration tests passed.
- `npm run benchmark`: 12,579 ticks/s, authoritative hash `471ba1cc`, fresh profile hash `bec4a764`.
- `npm run balance:smoke`: fresh median 131.7 game seconds, p25–p75 121.1–137.9; no authority changes made.
- `npm run test:browser:file`: passed with trusted Worker/WebGL2, four draws, Canvas continuity fixture, all required responsive shell viewports, and Result 200% text assertions.
- Latest remote workflow `31463707001` and Pages deployment `5845430553` succeeded for the starting revision; cache-busted deployed `index.html`, runtime-speed, and identity bytes equal the checkout.

## Evidence not obtained

- Physical mouse, touch, pen, high-refresh display, and physical-device thermal evidence are unavailable on this host.
- Baseline structured pacing, projected-globe, release/idle, and Result-footer measurements are still being captured.

## Exact next coherent step

Capture the structured browser baseline, then cut over speed policy end-to-end before changing camera or Result presentation.
