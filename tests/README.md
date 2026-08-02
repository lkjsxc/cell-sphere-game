# tests/

Zero-dependency `node:test` suites plus original real-Chrome/CDP harnesses.

| Location | Coverage |
|---|---|
| `unit/` | PRNG, topology, geography/hydrology, rendering math, Settings, Memory graph/migration, simulation invariants. |
| `integration/` | Whole-run speed/chunk/Worker-equivalent determinism, observation neutrality, semantic History. |
| `scripts/browser-test.mjs` | Same-origin boot smoke; exits 77 on sandbox networking blocks. |
| `scripts/browser-file-test.mjs` | Socket-free WebGL2 mobile/desktop passive-world acceptance. |

Tests import production modules only. Intentional world/hash changes require a
balancing record. Browser screenshots are generated evidence and remain
ignored unless intentionally retained by repository policy.
