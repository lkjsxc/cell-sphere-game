# `src/platform/`

Browser adapters validate every boundary and degrade honestly when storage or an
API is unavailable.

| Module | Authority |
|---|---|
| `storage.js` | Current meta schema 15: exact progression, Evolution, Trophies, and achieved Environment records. |
| `history.js` | Bounded current History schema 10 with start/final/peak/exposure evidence. |
| `run-transaction-store.js` | WAL schema 5 couples validated results, rewards, History, Trophies, and idempotency. |
| `settings.js` | Current settings schema 7; public relative speed is durable, developer mode/speeds are excluded. |
| `namespace-store.js` / `namespace.js` | Current-only verified localStorage reads, initialization, and transactional imports. |
| `recent-runs.js` | Optional bounded IndexedDB visual checkpoints, never authority. |

Exact levels, costs, Echoes, SCORE, records, and Environment evidence use
canonical decimal strings at JSON/storage/History/hash boundaries. Raw `bigint`,
unsafe `Number` coercion, malformed decimals, and nonfinite values are rejected
or safely field-degraded.

Old or mismatched documents start from fresh current defaults; no persistence
migration is attempted. Storage failure leaves a session playable and truthfully
temporary. Browser saves never import agent-save documents.
