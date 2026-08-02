# Visual History

Bounded, observational presentation data for approximate globe scrubbing.

| File | Responsibility |
| --- | --- |
| `codec.js` | Strict `INHV` binary version 1, validation, and 256 KiB thinning. |
| `recorder.js` | Quantizes authoritative state at tick 0, 50-tick cadence, semantic events, and extinction. |
| `preview.js` | Nearest-frame lookup and reusable renderer projection buffers. |

A frame stores tick, quantized entropy, flags, alive count, and one byte per
cell. It never stores edges, RNG, replay, or mutable simulation references.
Visual bundles are approximate, device-local IndexedDB records and are not part
of semantic JSON export/import or authority hashes.
