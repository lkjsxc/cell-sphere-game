# `tests/unit/`

Environment-independent production-module tests (`node --test`). Sources of truth
include `progression-integer.test.js`, `evolution-progression.test.js`,
`environment-level.test.js`, `scoring.test.js`, `renderer.test.js`, persistence/
transaction tests, interface state-machine tests, and `simulation/` invariants.

Coverage includes canonical/malformed/huge exact decimals and `2^53` boundaries;
the authored 42-cell Evolution sphere with one `First Division` root; physical
frontier and repeated-level transactions; direct bounded Environment compilation;
realized SCORE and procedural ranks; current-only persistence reset; whole-cell
charge/zero-charge rendering; deterministic finite ecology; and the
select-first/later-second-activation transaction state machine.

Presentation policy tests cover public-to-effective speed conversion, bounded
clock debt, projected World and one-radius input geometry, the six-entry camera
sample window, progressive bounded release, strong/medium/slow cumulative travel,
30/60/120/144 Hz damping equivalence, long-run free-orbit orthonormality, shared trusted
interaction, and Result-cycle progress/text cadence. Browser behavior is still
proved in the trusted production browser harness, not inferred here.
