# Visual History

Bounded, observational presentation data for truthful approximate globe scrubbing.

| File | Responsibility |
| --- | --- |
| `codec.js` | Strict current-only `INHV` v3 binary codec, visual-world compatibility check, and 256 KiB adaptive thinning. |
| `recorder.js` | Quantizes authoritative state at tick 0, cadence, semantic events, and extinction. |
| `preview.js` | Nearest-frame lookup and reusable complete renderer projection buffers. |

Each v3 frame stores tick, atmospheric wear, flags, alive count, Luminous
development, and three bounded bytes per cell: life/biomass/stress, resource
condition/richness, and transformation/charge. Static geography is regenerated
from the exact unsigned 32-bit authority seed (the player-facing seed code remains
30-bit); transformation state is sufficient for the current renderer's
effective-biome mapping. Frames never store edges, RNG, replay, or mutable
simulation references.

Visual bundles are approximate, device-local IndexedDB records, excluded from
semantic JSON export/import and authority hashes. The cache is current-only:
older buffers and incompatible static-world versions are rejected, and the visual
cache namespace resets rather than migrating them. While a matching bundle is
loading or unavailable, History remains semantic-only and never labels the
live globe as a historical checkpoint.
