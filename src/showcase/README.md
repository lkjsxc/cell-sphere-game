# src/showcase/

Deterministic title presentation generated from production simulation authority.

- `data.js` is generated and checked in; metadata records the seed, source hash,
  replay version, frame cadence, lifecycle landmarks, and binary hash.
- `player.js` decodes the bounded cell-only History payload once and presents it
  without touching persistence, progression, scoring, History, or run seeds.

Run `npm run showcase:generate` after an intentional authority change. The
`showcase:check` verification gate rejects stale generated data. Hidden documents
freeze title time; reduced motion holds a representative mature frame.
