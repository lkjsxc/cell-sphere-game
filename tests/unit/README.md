# `tests/unit/`

Environment-independent production-module tests (`node --test`). Sources of truth
include `progression-integer.test.js`, `evolution-progression.test.js`,
`environment-level.test.js`, `scoring.test.js`, `renderer.test.js`, persistence/
transaction tests, interface state-machine tests, and `simulation/` invariants.

Coverage includes canonical/malformed/huge exact decimals and `2^53` boundaries;
frequency-5 252-cell sparse Level 0/1/unlimited-Level-2+ Evolution; adjacency/root
bootstrap and repeat costs; Potential v3; direct bounded Environment compilation;
monotone SCORE v4 and procedural ranks; meta schema 11/History 6 migrations;
whole-cell charge/zero-charge rendering; deterministic ecology/resources/events;
and the select-first/later-second-activation transaction state machine. Archived
Adaptations are compatibility data only, never current authority.
