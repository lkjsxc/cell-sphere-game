# `tests/`

Zero-dependency `node:test` suites plus real-Chrome/CDP WebGL2 and Canvas
acceptance harnesses. Tests import production modules only; reports and
screenshots are generated evidence, not authority.

| Location | Coverage |
|---|---|
| `unit/` | Deterministic primitives/simulation; exact progression integers; 252-cell unlimited Evolution; Environment compiler; Potential v3; SCORE v4; rendering; schemas/state machines. |
| `integration/` | Whole-run protocol/replay v5 determinism, transactions, meta 11/History 6 migration, fair agent schema 2, worldmaking/Luminous, REACH, and replacement. |
| `scripts/browser-file-test.mjs` | Trusted pointer/touch/keyboard WebGL2 acceptance, including real Evolution second activation and four draws. |
| forced Canvas scenario | Matching semantic Evolution, History, worldmaking, charge/zero-charge, and no-wire evidence. |

Focused non-suite release gates are `audit:evolution-levels`,
`audit:environment-levels`, `audit:luminous`, `audit:progression-numbers`,
`agent:long`, and `balance:holdout`. Active Adaptations are tested only as retired
legacy migration/evidence; no current action or presentation module is expected.
A skipped command is not a pass, and physical-device/deployed claims require the
actual corresponding run.
