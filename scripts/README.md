# scripts/

Node.js development and verification tooling. All scripts are zero-dependency
ES modules using Node built-ins only (Node >= 22).

| Script | Command | Purpose |
|---|---|---|
| `serve.mjs` | `npm run serve` | Static dev server with correct MIME types, no caching. |
| `check-structure.mjs` | `npm run check:structure` | Enforces README-per-directory, 400-line/24-child hard caps, 200/16 warnings, banned names. |
| `check-links.mjs` | `npm run check:links` | Static asset/import checks; no remote imports; relative GitHub-Pages-safe paths. |
| `verify.mjs` | `npm run verify` | Runs all fast gates in order and prints a summary. |
| `benchmark.mjs` | `npm run benchmark` | Deterministic terminal, fixed-1,000-tick, huge-Level, and compiler-cache benchmark with checksums. |
| `balance.mjs` | `npm run balance` / `balance:smoke` | Paired-seed production balance harness with profile identity, conservation, and optional baseline guardrails. |
| `agent-play.mjs` | `npm run agent:play` / `agent:smoke` / `agent:campaign` | Fair JSON campaign environment, deterministic policies, and atomic agent saves. |
| `generate-title-showcase.mjs` | `npm run showcase:generate` / `showcase:check` | Generates and verifies the bounded production-simulation title lifecycle. |
| `audits/terminal-soak.mjs` | `npm run terminal:soak` | Runs 10,000 production Worlds through terminal, settlement, History, and persistence bounds. |
| `audits/cell-visual-audit.mjs` | `npm run audit:cell-visuals` | Rejects old waterway/fine-geography paths, topology-owned atmosphere, and restored ordinary-life interior fill; requires both shared edge consumers and four draws. |
| `audits/lake-audit.mjs` | `npm run audit:lakes` | Audits 500 seeds for connected whole-cell lake distribution, ecology, determinism, and cost. |
| `audits/no-disaster-audit.mjs` | `npm run audit:no-disaster` | Verifies chronic pressure and removed gameplay-disaster authority. |
| `browser-test.mjs` | `npm run test:browser` | Same-origin headless-Chrome boot check; reports sandbox socket blocks as exit 77. |
| `autonomous-world-feel-audit.mjs` | `npm run audit:autonomous-feel` | Structured six-speed pacing, Home/World geometry, camera, continuation, and accessibility evidence for Worker, fallback, or Canvas. |
| `browser-file-test.mjs` | `npm run test:browser:file` / `test:browser:canvas` / focused commands | Socket-free real Chrome harness for WebGL2, forced Canvas 2D, and bounded atmosphere, life-edge, Environment, and connected Evolution-region evidence. |
| `browser/` | via file test | Responsive observational run, controlled atmosphere, life-edge, Luminous, and green-root/region fixtures, surfaces, visual History, Evolution/Trophy spheres, and continuation evidence. |

Invariants:

- Scripts never modify `src/` state; they only read, run, and report.
- Generated reports go to `reports/` (git-ignored) unless a document explicitly
  embeds a summary.
- Exit code 0 means pass; non-zero means fail. CI relies on this.
