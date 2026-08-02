# src/platform/

Small browser adapters that degrade honestly when APIs or storage are absent.

| Module | Responsibility |
|---|---|
| `capabilities.js` | WebGL2, Worker, device, sharing, and DPR hints. |
| `settings.js` | Schema-2 validated preferences; random Adaptations and rotation-off defaults. |
| `storage.js` | Schema-4 Echo/Memory/Imprint progression and proof-tree migration. |
| `history.js` | Separate semantic archive, 24/32 worlds, 80 events/run, 700 KB cap. |

Progress validation enforces the 108-node prerequisite closure, quarantines
unknown IDs, preserves old Echoes/Imprints, and returns truthful write success.
History stores stable event keys/arguments rather than localized prose and
prunes oldest ordinary worlds deterministically. Corrupt documents fall back
to safe defaults; unavailable storage keeps the current session playable.
