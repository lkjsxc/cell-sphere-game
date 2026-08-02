# src/platform/

Small browser adapters that degrade honestly when APIs or storage are absent.

| Module | Responsibility |
|---|---|
| `capabilities.js` | WebGL2, Worker, device, sharing, and DPR hints. |
| `settings.js` | Schema-2 validated preferences; random Adaptations and rotation-off defaults. |
| `storage.js` | Schema-4 Echo/Memory/Imprint progression and proof-tree migration. |
| `history.js` | Schema-2 semantic archive, 24/32 worlds, 80 events/run, 700 KB cap. |
| `recent-runs.js` | Native IndexedDB visual bundles, newest ten, strict `INHV` validation. |

Progress validation enforces the 108-node prerequisite closure, quarantines
unknown IDs, preserves old Echoes/Imprints, and returns truthful write success.
Semantic History stores stable event keys/arguments and up to eight primary
cells rather than localized prose. Approximate visual detail is a separate,
device-local IndexedDB cache and is never part of JSON export/import. Both
stores degrade safely when browser persistence is absent or corrupt.
