# src/core/

Generic, domain-free primitives. No imports from other layers; everything
here is environment-independent and runs under Node and the browser.

| Module | Responsibility |
|---|---|
| `prng.js` | xoshiro128** seedable PRNG — the only randomness source for simulation/content. |
| `math.js` | clamp/lerp/smoothstep/tolerance helpers; polynomial curves only. |
| `hash.js` | FNV-1a over bytes/strings/quantized float arrays; hex formatting. |
| `seed-code.js` | 30-bit seed ↔ 6-char Crockford code ("ABC-DEF"), confusable-tolerant decode. |
| `clock.js` | Fixed-step clock: real time × speed → integer tick counts. |
| `state-machine.js` | Explicit FSM with declared legal transitions; illegal sends throw. |
| `assert.js` | Boundary assertions for messages, saves, and configuration. |
| `adaptation-arrival.js` | Pure deterministic weighted graph arrival field for bounded presentation. |
| `world-session.js` | Immutable authority/presentation identity tuple and exact matching. |
| `identity.js` | Canonical product/tagline/repository/Pages/storage/export/browser identity and isolated legacy names. |

Invariants:

- Integer-only PRNG and hashing (Math.imul + unsigned shifts): sequences and
  hashes are identical on every JavaScript engine.
- No transcendentals in `math.js` curves used by the simulation tick.
- Session identity names the world transaction but contains no world model,
  organism behavior, platform API, or DOM dependency.
