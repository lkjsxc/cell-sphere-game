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
| `browser-test.mjs` | `npm run test:browser` | Headless-Chrome browser test runner (falls back to instructions). |

Invariants:

- Scripts never modify `src/` state; they only read, run, and report.
- Generated reports go to `reports/` (git-ignored) unless a document explicitly
  embeds a summary.
- Exit code 0 means pass; non-zero means fail. CI relies on this.
