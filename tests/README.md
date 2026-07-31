# tests/

Zero-dependency tests using Node built-ins (`node:test`, `node:assert`) plus
an original headless-Chrome harness for browser-only APIs.

| Directory | Contents | Run with |
|---|---|---|
| `unit/` | Environment-independent module tests | `npm run test:unit` |
| `integration/` | Golden scenarios + speed invariance | `npm run test:integration` |
| `browser/` | WebGL2/worker/storage/share smoke page + harness | `npm run test:browser` |
| `fixtures/` | Golden seeds, decision logs, expected hashes | read by integration tests |

Invariants:

- Tests exercise the **production** modules under `src/` — never a copied
  or simplified model.
- Golden fixture changes require a tuning decision recorded in
  `docs/balancing.md`.
- No test framework packages; no network access from tests.
- Each test file names the risk it protects in a header comment.
