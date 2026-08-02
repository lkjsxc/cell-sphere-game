# Rebuild notes

Concise research and art-direction record for the 2026-08-02 rebuild.

## What was inspected

- Contest rules were fetched live from the 2026 Summer page. The current
  deadline is 2026-09-13; the Web Page category requires public GitHub source,
  a hosted matching page, HTML/CSS/JavaScript, PC and smartphone Chrome, and
  prohibits unapproved external runtime libraries. Judging explicitly covers
  organized code, GitHub use, tests, completion, UI/UX, first-use clarity,
  originality, and real use.
- The deployed baseline commit was verified through repository/Pages evidence.
  Real Chrome in this container cannot reach external URLs
  (`ERR_INTERNET_DISCONNECTED`), so the exact deployed commit was rendered from
  local files in headless Chrome/WebGL2 at desktop and mobile sizes. This is
  browser evidence, but not a claim that the public URL was visually opened.
- The OpenAI reference URL and page content were fetched successfully, but the
  same Chrome network restriction prevented a truthful live visual/gesture
  inspection. No OpenAI code, shader, asset, timing, copy, or layout was used.
  The interaction qualities named in the rebuild brief were treated as the
  reference constraints until an unrestricted browser review is possible.
- The Apple game-design URLs are client-rendered and returned only document
  shells to the text fetcher. Direct manipulation, quick start, strong
  defaults, generous targets, safe areas, readable type, and reduced motion
  remain the applied principles from the supplied brief.
- Both linked Qiita article URLs currently return HTTP 404. The 2025 contest
  result page itself was fetched and reviewed.

## Baseline visual teardown

Evidence: `reports/rebuild/before/local-mobile.png`.

- The primal triangle sphere was extremely oversized and read as a flat olive
  surface rather than an Earth-like world.
- The title and cyan pill button sat over the lower edge with little deliberate
  relationship to the object.
- No dual cells, pentagonal defects, or substrate/organism distinction were
  visible before play.
- Cyan linework, dark space, and the geometric logo repeated a familiar neon
  tech vocabulary rather than establishing this game's material identity.
- The title tap had no bounded cellular bloom.

## Decisions implemented

- Preserve the deterministic simulation IDs and worker/fallback boundary.
- Reinterpret every primal node as one cell in an explicit spherical dual:
  2,562 cells, 7,680 canonical shared boundaries, and exactly twelve
  pentagonal World Knots.
- Render discrete mineral ocean/land cell plates, quiet etched boundaries, and
  active organism routes directly on shared boundaries.
- Replace stars, teal bloom, glass metric cards, and the cyan product mark with
  mineral twilight, warm biological light, editorial type, and negative space.
- Make the title a bounded real-topology attract state. Tap reseeds a geodesic
  bloom; drag, inertia, wheel, and pinch use the same camera as the run.
- Complete the first extinction-to-memory transaction: earned Echoes enter an
  interactive Memory Globe, a purchased filament persists, and the next run
  visibly receives an extra Signal.

## Originality guardrail

The dominant visual grammar now comes from this product's unique mechanics:
Goldberg cells, World Knots, canonical-boundary transport, extinction fossils,
and the same topology changing from living Earth to graphite memory. The work
intentionally rejects a copied solar object, copied editorial composition,
random star field, OpenAI branding or shader motifs, fireworks, stock Earth
imagery, and generic sci-fi HUD framing.

## Current visual evidence

Generated, git-ignored evidence from `npm run test:browser:file`:

- `reports/browser-file-title.png`
- `reports/browser-file-title-tap.png`
- `reports/browser-file-memory.png`
- `reports/browser-file-title-desktop.png` (1440×900 CDP capture)

Mobile and desktop now communicate planet + cellular substrate + living
network in one still. The Memory capture shows the purchased graphite-world
filament on the same rotatable topology. Further iteration should make run
morphologies less locally dense and validate the composition on physical
mobile Chrome.
