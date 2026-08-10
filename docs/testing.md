# Testing

Run focused checks after a coherent edit, then climb to integration and browser
coverage for cross-layer changes.

```bash
npm run test:unit
npm run test:integration
npm run check:links
npm run check:structure
npm run audit:no-disaster
npm run audit:environment-levels
npm run audit:resources
npm run audit:trophies
npm run showcase:check
npm run test:browser:file
npm run test:browser:canvas
npm run test:browser:fallback
```

`audit:no-disaster` verifies deleted gameplay-disaster modules, forbidden
production fields, chronic profile shape, deterministic runs, and the absence of
active disaster authority. Ordinary DOM events and semantic History records are
intentionally outside that prohibition.

Environment checks verify exact Level-0 starts, direct schedule inversion,
finite chronic coefficients, Worker/fallback parity, bounded exposure evidence,
and reset on the next World. Persistence checks use current-only schemas and
confirm old or mismatched documents reset rather than migrate.

Browser checks are evidence for real pointer, keyboard, scene, History, Result,
Evolution, Trophy, WebGL2, and Canvas behavior; a mocked call is not visual
proof.
