# src/platform/

Browser-platform adapters. Each module wraps a browser capability behind a
small testable surface and degrades honestly when that capability is absent.

| Module | Wraps | Failure behavior |
|---|---|---|
| `capabilities.js` | Canvas, Worker, AudioContext, and navigator hints | reports capability flags |
| `settings.js` | localStorage preferences | validated defaults on corruption |
| `storage.js` | localStorage progression document | schema migration or in-memory continuation |

Progress storage invariants:

- Schema 4 validates all 108 Memory IDs and records the Memory graph version.
- Schema 1–3 saves preserve scores, Echo totals and balance, runs, and Imprints;
  old proof-node IDs map once without refunds, and old Imprints gain topology metadata.
- Unknown progression IDs are bounded and quarantined rather than activated.
- Persistence serializes a validated copy, never mutates the caller, and returns
  `false` when localStorage cannot honestly confirm a write.
- No adapter contains simulation math or throws merely because an API is absent.
