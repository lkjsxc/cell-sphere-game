# src/platform/

Browser-platform adapters. Everything here wraps a browser API behind a
small, testable surface and degrades honestly when the API is missing.

| Module | Wraps | Failure behavior |
|---|---|---|
| `capabilities.js` | canvas contexts, Worker, AudioContext, navigator hints | reports booleans; callers decide |
| `settings.js` | localStorage settings document | validated load; defaults on corruption |
| `storage.js` | localStorage progression/archive documents | versioned schema; raw copy preserved on corruption |
| `audio.js` | Web Audio procedural sound | muted no-op until user gesture; suspends when hidden |
| `share.js` | navigator.share, clipboard, canvas export | text copy fallback; clear success/failure notice |
| `lifecycle.js` | visibilitychange, pagehide, resize | pause sim + audio when hidden; checkpoint |

Invariants:

- No simulation math lives here.
- No adapter may throw on missing APIs — return capability flags or no-ops.
- Persistence writes are validated on read, never trusted blindly.
