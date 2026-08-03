# Status

The canonical source/package/storage/export/browser identity migration is
implemented and locally verified on isolated branch `feat/cell-sphere-identity`
from `7b80e7dbb42f48dd7cbcf2a43f4587a0290b28f4`. The reviewed implementation
commit is `bcd9b1d81e58b78a4100983c6fa388d7c9ff2a3c`. Repository rename, remote
change, push, Actions, Pages deployment, and public canonical URL verification
were intentionally not executed.

## Canonical identity

- Product/package: `cell-sphere-game`.
- Tagline: `Every extinction becomes memory.`
- Target repository: `lkjsxc/cell-sphere-game`.
- Target Pages URL: `https://lkjsxc.github.io/cell-sphere-game/`.
- `src/core/identity.js` owns product/tagline/version, repository/Pages, current
  and isolated legacy persistence/export values, filename, IndexedDB names, and
  `__CELL_SPHERE_*` diagnostic names.
- Package metadata, HTML title/description/H1, local server/profile names,
  README mirrors, current docs, workflow evidence, runtime diagnostics, and all
  browser harness references use the canonical identity.
- Root and `.github` README files are byte-identical. No manifest exists.

## Transactional persistence and exports

- Canonical localStorage documents are `cell-sphere-game:meta:v1`,
  `cell-sphere-game:settings:v3`, and `cell-sphere-game:history:v2`.
- Boot stages each normalized document, writes canonical, reads it back, and
  prefers it only after validator-equivalent verification. Legacy source values
  are never deleted. A completion receipt is set only after all three documents
  verify; partial writes remain idempotently retryable.
- Valid canonical documents always win coexistence. Parseable corruption is
  normalized field-by-field. Malformed canonical progression blocks fallback
  unless source and normalized-target receipt hashes prove the old source equals
  the last verified canonical checkpoint; this prevents silent rollback of newer
  progress.
- Schema 8 now persists the last 16 result transaction keys. Echoes, best SCORE,
  runs, seed cursor, all 642 Skill ownership, quarantine, Imprints, current and
  Legacy Trophies, notification queue, and cumulative proof remain bounded and
  exactly validated. A result delivered again after reload cannot duplicate its
  reward, History, Imprint, Trophy, or queue entry.
- Semantic import validates Meta, Settings, and History before an all-or-rollback
  three-document commit. A failed commit remains playable as an explicitly
  session-only import. New exports use canonical product and filename; canonical
  and old-product semantic exports are accepted.
- `cell-sphere-game:recent-runs` opens independently of startup. Legacy visual
  migration decodes at most ten retained `INHV` v1 records, merges by record ID
  with valid canonical duplicates winning, verifies writes/deletes, then records
  completion. Unavailable, corrupt, partial, and duplicate paths are bounded and
  nonblocking. `INHV` v1 remains intentionally supported to prevent data loss.

## Audit and exact transitional-name allowance

`npm run audit:identity` is in local `verify` and CI. It scans active text and
rejects the transitional exact product token and ambiguous old diagnostic
prefix. Its three path/line predicates permit only:

1. `src/core/identity.js` — `LEGACY_PRODUCT`, used by migration/import constants;
2. `AGENTS.md` — the explicit transitional-legacy policy sentence;
3. `docs/cell-sphere-release-ledger.md` — the clearly labeled observed start
   repository/Pages evidence.

There are no old diagnostic globals and no other exact transitional product
occurrences outside worktree `.git` metadata.

## Verification evidence

- Baseline `npm run verify` on `7b80e7d` before editing: PASS.
- Focused identity/settings tests: PASS, 25/25.
- Focused visual migration/Trophy idempotency tests: PASS, 18/18.
- `npm test`: PASS, 142 unit + 74 integration.
- Final `npm run verify`: PASS all ten gates: structure, identity audit,
  cell-visual audit, showcase, unit, integration, 500-seed lake audit, balance
  smoke, benchmark, and links.
- Final benchmark: Node v22.22.3, Linux x64, 20 logical CPUs; 2,715 ticks in
  180 ms, 15,065 ticks/s, deterministic hash `256388b9`.
- Showcase: unchanged 89 frames / 228,754 bytes, data hash `22ac0d97…`;
  identity/legacy-codec source metadata updated to `a461fcf1…` only.
- `npm run test:browser:file`: PASS real headless Chrome/WebGL2; migration/import/
  coexistence/fresh-canonical scenario passed, SCORE 595,964, complete 32× run
  7.91 s, four draws, title mean 0.93 ms / p95 1.20 ms, visual IndexedDB
  available, unified shell/Trophies/atomic replacement intact, no browser errors.
- `npm run test:browser:canvas`: PASS real headless Chrome Canvas 2D; SCORE
  614,507, terminal History/Evolution/Trophies and atomic replacement intact.
- `npm run check:structure`: PASS. Existing maintainability warnings remain for
  balancing docs, app controller, hydrology, renderer/settings tests, and unit
  directory child count; there are no hard violations.
- `npm run check:links`: PASS, 129 modules and 11 HTML references.

## Limitations / parent actions

- No external repository rename, remote URL change, push, CI observation, Pages
  deployment, cache-busted public-byte check, or public app claim was made.
- No Docker, physical-device, screen-reader, browser-zoom, thermal, or GPU-time
  evidence was added in this migration.
- The browser scenario exercises migration under real Chrome localStorage and
  the normal IndexedDB availability path. Corrupt/duplicate/unavailable visual
  migration paths are deterministic adapter-level integration tests rather than
  destructive manipulation of the browser profile database.
- Parent should review/cherry-pick the isolated commit, rename the GitHub
  repository, update the local remote only after that rename succeeds, push,
  observe exact Actions/Pages revision, and verify canonical public bytes. The
  protective historical URLs in the release ledger should remain labeled
  evidence rather than being rewritten as current claims.
