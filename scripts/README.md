# scripts/

Node.js development and verification tooling. All scripts are zero-dependency
ES modules using Node built-ins only (Node >= 22).

| Script | Command | Purpose |
|---|---|---|
| `serve.mjs` | `npm run serve` | Static dev server with correct MIME types, no caching. |
| `check-structure.mjs` | `npm run check:structure` | Enforces README-per-directory, 400-line/24-child hard caps, 200/16 warnings, banned names. |
| `check-links.mjs` | `npm run check:links` | Static asset/import checks; no remote imports; relative GitHub-Pages-safe paths. |
| `verify.mjs` | `npm run verify` | Runs all fast gates in order and prints a summary. |
| `benchmark.mjs` | `npm run benchmark` | 3000-tick headless benchmark with checksum and JSON output. |
| `balance.mjs` | `npm run balance` / `balance:smoke` | Monte-Carlo balance harness using production simulation modules. |
| `agent-play.mjs` | `npm run agent:play` / `agent:smoke` / `agent:campaign` | Fair JSON campaign environment, deterministic policies, and atomic agent saves. |
| `generate-title-showcase.mjs` | `npm run showcase:generate` / `showcase:check` | Generates and verifies the bounded production-simulation title lifecycle. |
| `audits/terminal-soak.mjs` | `npm run terminal:soak` | Runs 1,000 production worlds through the hard terminal contract. |
| `audits/cell-visual-audit.mjs` | `npm run audit:cell-visuals` | Rejects old waterway identifiers and fine production geography. |
| `audits/lake-audit.mjs` | `npm run audit:lakes` | Audits 500 seeds for connected whole-cell lake distribution, ecology, determinism, and cost. |
| `audits/event-audit.mjs` | `npm run audit:events` | Measures graph-field shape, permeability, and generation cost. |
| `browser-test.mjs` | `npm run test:browser` | Same-origin headless-Chrome boot check; reports sandbox socket blocks as exit 77. |
| `browser-file-test.mjs` | `npm run test:browser:file` / `test:browser:canvas` | Socket-free real Chrome harness for WebGL2 and forced Canvas 2D. |
| `browser/` | via file test | Responsive observational run, surfaces, visual History, Evolution/Trophy spheres, and continuation evidence. |

Invariants:

- Scripts never modify `src/` state; they only read, run, and report.
- Generated reports go to `reports/` (git-ignored) unless a document explicitly
  embeds a summary.
- Exit code 0 means pass; non-zero means fail. CI relies on this.
