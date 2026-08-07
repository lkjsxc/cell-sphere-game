# `src/platform/`

Browser adapters validate every boundary and degrade honestly when storage or an
API is unavailable.

| Module | Authority |
|---|---|
| `storage.js` | Meta schema 13: exact progression, Evolution, Trophies, dynamic achieved Environment records, and inert legacy frontier. |
| `history.js` | Bounded History schema 8: legacy static attempts versus dynamic start/final/peak/exposure worlds with interpolation evidence. |
| `run-transaction-store.js` | WAL schema 4 coupling validated result, reward, records, History, Trophies, and idempotency. |
| `settings.js` | Durable player preferences; developer mode/speeds excluded. |
| `namespace-store.js` / `namespace-migration.js` | Field-safe validation, verified writes, and transactional browser import/migration. |
| `recent-runs.js` | Optional bounded IndexedDB visual checkpoints, never authority. |

Exact levels, costs, Echoes, Potential, SCORE, records, and Environment evidence
use canonical decimal strings at JSON/storage/History/hash boundaries. Raw
`bigint`, unsafe `Number` coercion, malformed decimals, and nonfinite values are
rejected or safely field-degraded.

Schema migration preserves old `highestEnvironmentLevel` as
`legacyEnvironmentFrontier` only. It never derives a dynamic achieved peak,
starts a new world above Level 0, changes pressure, grants rewards/Trophies, or
changes purchase eligibility. Storage failure leaves the session playable and
truthfully temporary. Browser saves never import agent-save v4 documents.
