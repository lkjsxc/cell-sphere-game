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
   structure rules.

2. **Integration** (`npm run test:integration`, `tests/integration/`)
   Named golden scenarios (seed + decision log) asserting final hash,
   extinction cause, score, survival tick, phenotype. Speed invariance:
   identical outcome under constant 1×, mid-run speed changes, 32× batching,
   worker path, main-thread fallback, and pause/resume around drafts.
   Golden updates require a `docs/balancing.md` decision entry.

3. **Browser** (`npm run test:browser`, `tests/browser/`)
   Headless-Chrome harness (no external libraries): WebGL2 init + shader
   compile, Canvas fallback init, module worker startup, pointer conversion,
   persistence smoke, share-card dimensions, service-worker registration,
   semantic UI smoke, responsive assertions via screenshots.

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
| — | pending first test suites | — |
