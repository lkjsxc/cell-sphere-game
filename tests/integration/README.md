# tests/integration/

Deterministic whole-run tests (`node --test tests/integration/*.test.js`).
They exercise the production `RunController` end to end.

| File | Protects |
|---|---|
| `determinism.test.js` | Same seed + decisions ⇒ identical final hash under chunk 1/7/32/50 (speed invariance), delayed draft decisions (pause/resume), fixed-tick signals, replay monotonicity, strain divergence |

Golden scenario policy: when balance tuning legitimately changes outcomes,
update expectations together with a `docs/balancing.md` decision entry —
never silently re-snapshot.
