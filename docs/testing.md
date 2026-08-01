# Testing

Tests target the risks that matter: determinism, topology correctness,
simulation invariants, scoring integrity, save safety, and structure rules.
Framework: Node built-in `node:test` + `node:assert`. Zero test dependencies.

## Layers

1. **Unit** (`npm run test:unit`, `tests/unit/`)
   PRNG reproducibility/distribution · icosphere counts, adjacency symmetry,
   degrees, no duplicate edges, normalized positions · world-field
   reproducibility · tick invariants (no NaN, conservation sanity) · event
   schedule determinism · Signal decay · adaptation prerequisites/effects ·
   phenotype recognition · scoring monotonicity/bounds · Echo conversion ·
   progression prerequisites · trophy evaluation · save validation ·
   seed-code round trip · replay round trip · state-machine transitions ·
   structure rules. Renderer logic (camera, picking, instance packing, and a
   static shader-uniform cross-check that every declared uniform is uploaded)
   is also unit-tested here so it runs without a GPU.

2. **Integration** (`npm run test:integration`, `tests/integration/`)
   Named golden scenarios (seed + decision log) asserting final hash,
   extinction cause, score, survival tick, phenotype. Speed invariance:
   identical outcome under constant 1×, mid-run speed changes, 32× batching,
   worker path, main-thread fallback, and pause/resume around drafts.
   Golden updates require a `docs/balancing.md` decision entry.

3. **Browser** (`npm run test:browser` → `scripts/browser-test.mjs`)
   Zero-dependency headless-Chrome harness that boots the live app over the
   dev server and fails on any uncaught JS / shader error. Where the host
   sandbox blocks Chrome's network stack (socket EPERM / `ERR_ACCESS_DENIED`,
   as in restricted CI containers), it exits **77 (skip)** with the exact
   signature rather than reporting a false pass — so it is intentionally not
   part of `npm run verify`. A real GPU render is recorded only when observed
   on unrestricted hardware (see `docs/decisions.md` D8).

4. **Soak / chaos** (documented manual + scripted)
   100-run auto-retry leak check · invalid shader path · worker rejection ·
   malformed saves · unsupported share API · context loss · resize during
   draft · rapid speed changes · repeated restarts.

## Commands

```bash
npm test                 # unit + integration
npm run test:browser     # needs Chrome; prints instructions if absent
npm run verify           # all fast gates
```

## Latest evidence

| Date | Command | Result |
|---|---|---|
| 2026-07-31 | `npm run test:unit` | PASS 78/78 (incl. 8 renderer-logic tests) |
| 2026-07-31 | `npm run test:integration` | PASS 7/7 (speed invariance chunk 1/7/32) |
| 2026-07-31 | `npm run benchmark` | PASS ~17–19k ticks/s, hash d02cae0d |
| 2026-07-31 | `npm run test:browser` | SKIP 77 — container seccomp blocks Chrome network stack |
