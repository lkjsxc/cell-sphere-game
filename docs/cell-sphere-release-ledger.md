# Release ledger

## 2026-08-04 — 252-cell scarcity and progression release

Starting revision: `a3fa43131261a0cdf207d63e25c448646857914c`

Protective tag: `pre-balance-compression-20260804`

Contract revision: `884909b9d3ca77ae380164fd84fc4f63039dbc36`

### Implemented

- removed active mid-run Adaptations from simulation, protocol, rendering,
  settings, current History/Result, and current Trophy criteria;
- compressed Evolution to 252 frequency-5 cells in six connected territories;
- added schema-9 lossless graph-v4 ownership/value migration;
- introduced per-cell finite reserve, renewal, and ecological terminal causes;
- introduced world-ordinal event eras with quiet worlds 1–2;
- added gated lake, cold, shallow-ocean, and deep-ocean habitats;
- replaced SCORE with visible six-axis Run Quality × World Potential × Challenge;
- reauthored 96 current Trophies around Reach, Form, Endurance, Habitat,
  Evolution, and Mastery;
- simplified the world rail and Result navigation; strengthened persistent metric
  affordances.

### Measured candidate evidence

- topology: 252 cells, 750 boundaries, 12 pentagons, 240 hexagons;
- economy: 17,820 Echoes; World Potential 16,000 → 1,196,800;
- migration: 642 source IDs → all 252 targets, mapping hash `85f93318`;
- fresh 200-seed median: SCORE 10,762, 14 Echoes, 273.1 seconds;
- progressing world-3 median: SCORE 104,048 at 13.09 campaign minutes;
- full-Evolution median: SCORE 959,558;
- unit 122/122 and integration 62/62;
- real Chrome WebGL2 and Canvas 2D vertical slices pass;
- title artifact SHA-256:
  `bc53b6d0f04dc9b2cd169034813a78f7e2c187ea94f1490fd0415afef0acd910`.

Implementation, CI, and Pages revisions are recorded in `docs/status.md` after
public deployment verification.

## Historical releases

Revisions before 2026-08-04 contained a graph-v4 642-cell progression model and
an active mid-run Adaptations system. Those behaviors are retired and are not
current product requirements. Their code history remains available in Git; old
archived run records are retained only as inert migration evidence.

Notable historical boundaries:

- `a3fa43131261a0cdf207d63e25c448646857914c` — last deployed pre-compression
  implementation;
- `411a0eca73b3c212959d6a2d7a7bf41795d4a0a7` — prior fresh-save progression
  release;
- `7b80e7dbb42f48dd7cbcf2a43f4587a0290b28f4` — prior Trophy calibration;
- `2c95c2491d94486ab479fcc98acf2bafcfb83206` — prior purchase-authority release.

Historical tests and prose protecting retired behavior were replaced rather than
carried into the current gate.
