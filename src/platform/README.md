# `src/platform/`

Small browser adapters that validate every boundary and degrade honestly when an
API or storage is absent.

| Module | Source-of-truth responsibility |
|---|---|
| `settings.js` | Canonical schema-3 durable player preferences; developer mode/speeds are excluded. |
| `storage.js` | Meta schema 11: exact Echoes/SCORE, sparse Evolution levels, Environment frontier, Trophies, and transaction keys. |
| `history.js` | Bounded semantic History schema 6, including exact Evolution and Environment evidence. |
| `run-transaction-store.js` | Crash recovery coupling Result, reward, History, frontier, and idempotency. |
| `namespace-store.js` | Per-document validation, verified writes/receipts, and safe legacy fallback. |
| `namespace-migration.js` | All-or-rollback browser namespace adoption/import. |
| `recent-runs.js` | Optional bounded IndexedDB visual checkpoints; never authority. |
| `capabilities.js` | WebGL2, Worker, device, sharing, and DPR hints. |

Levels, costs, Echoes, Potential v3, SCORE v4, run counters, and Environment
Levels are exact non-negative values: operations use `bigint`; JSON/storage/
History/hash boundaries use canonical decimal strings. Raw `bigint`, unsafe
`Number` coercion, malformed decimals, and nonfinite values are forbidden.

Schema 11 migrates recognized legacy 642/252 ownership to each cell's exact Level
1 without duplicate levels or repeated charges/refunds. It preserves exact
balances, SCORE versions, completed-run and attempt/world-seed cursors,
attainable Environment frontier evidence, bounded result/Evolution transaction
keys, Trophies, Imprints, and byte/entry-bounded History. Browser import rejects
more than 2 MiB before JSON parsing. Archived
Adaptation records remain readable and inert. Browser saves never import separate
agent-save schema 2 documents. Storage failure keeps the session playable and
truthfully temporary.

Primary gates: unit/integration persistence and crash-recovery suites,
`audit:progression-numbers`, `audit:evolution-levels`, and
`audit:environment-levels`.
