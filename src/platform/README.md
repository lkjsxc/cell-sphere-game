# src/platform/

Small browser adapters that degrade honestly when APIs or storage are absent.

| Module | Responsibility |
|---|---|
| `capabilities.js` | WebGL2, Worker, device, sharing, and DPR hints. |
| `settings.js` | Canonical schema-3 durable preferences. |
| `storage.js` | Canonical schema-8 Echo/Skill/Trophy/result-key progression. |
| `history.js` | Canonical schema-4 semantic archive, 24/32 worlds, 700 KB cap. |
| `namespace-store.js` | Per-document validation, verified writes, receipts, and safe legacy fallback policy. |
| `namespace-migration.js` | Three-document boot adoption and all-or-rollback semantic import commit. |
| `recent-runs.js` | Canonical IndexedDB visual bundles plus nonblocking verified legacy copy. |

Namespace migration preserves every recognized owned ID, disconnected islands,
Echoes, scores, run/seed cursors, result idempotency, current/Legacy Trophies,
queue/progress, Settings, semantic History, and bounded Imprints. Canonical
parseable documents win and degrade field-by-field; verified receipts permit
only a rollback-safe malformed-canonical recovery. Legacy sources are never
deleted. Approximate visual detail remains device-local and is copied by record
ID only after strict decode/verification. Every adapter returns truthful success
and keeps the current session playable when persistence is absent or corrupt.
