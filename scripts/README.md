# scripts/

Node.js development and verification tooling. All scripts are zero-dependency
ES modules using Node built-ins only (Node >= 22).

| Script | Command | Purpose |
|---|---|---|
| `serve.mjs` | `npm run serve` | Static dev server with correct MIME types, no caching. |
| `check-structure.mjs` | `npm run check:structure` | Enforces README-per-directory, ≤200 lines/file, ≤16 children/dir, banned names. |
| `check-links.mjs` | `npm run check:links` | Static asset/import checks; no remote imports; relative GitHub-Pages-safe paths. |
| `verify.mjs` | `npm run verify` | Runs all fast gates in order and prints a summary. |
| `benchmark.mjs` | `npm run benchmark` | 3000-tick headless benchmark with checksum and JSON output. |
| `balance.mjs` | `npm run balance` / `balance:smoke` | Monte-Carlo balance harness using production simulation modules. |
| `terminal-soak.mjs` | `npm run terminal:soak` | Runs 1,000 production worlds through the hard terminal contract. |
| `browser-test.mjs` | `npm run test:browser` | Same-origin headless-Chrome boot check; reports sandbox socket blocks as exit 77. |
| `browser-file-test.mjs` | `npm run test:browser:file` / `test:browser:canvas` | Socket-free real Chrome harness for WebGL2 and forced Canvas 2D. |
| `browser-scenario.mjs` | via file test | Six-viewport observational run, surfaces, visual History, 32×, adjacent-cell Memory, and unattended continuation evidence. |

Invariants:

- Scripts never modify `src/` state; they only read, run, and report.
- Generated reports go to `reports/` (git-ignored) unless a document explicitly
  embeds a summary.
- Exit code 0 means pass; non-zero means fail. CI relies on this.
