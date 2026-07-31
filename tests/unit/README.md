# tests/unit/

Environment-independent module tests (`node --test tests/unit/*.test.js`).

| File | Protects |
|---|---|
| `prng.test.js` | PRNG reproducibility, range, distribution, state save/restore |
| `seed-code.test.js` | Seed code round trips, confusable tolerance, invalid input |
| `hash.test.js` | FNV vectors, quantized float hashing stability/sensitivity |
| `math.test.js` | Curve bounds, float-safe tolerance boundary |
| `clock.test.js` | Fixed-step tick counts, speed scaling, catch-up cap |
| `state-machine.test.js` | Legal/illegal transitions throw correctly |
| `settings.test.js` | Save validation, per-field fallback, pollution safety |
| `icosphere.test.js` | Topology counts, degrees, symmetry, normalization |
| `fields.test.js` | Field determinism, bounds, variance, source quality |
| `strains.test.js` | Trait merge semantics, closed trait key set |
| `adaptations.test.js` | Card data validity, draft draw rules, crisis boost |
| `events.test.js` | Schedule determinism, anti-streak, footprints |
| `simulation.test.js` | Tick invariants, growth, signals, draft pause, extinction |
