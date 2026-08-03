# src/game/skills/

Pure, frozen content and physical-frontier rules for the 642-cell Evolution Globe.

- `index.js` owns queries, transactions, compilation, and validation.
- `atlas.js` maps six connected 107-cell territories onto the level-3 sphere.
- `node.js` interleaves exact minor effects with authored landmarks.
- Six branch modules author Reach, Flow, Reserve, Ecology, Perception, and
  Continuity landmarks.
- `scene.js` projects semantic skill state into renderer-owned cell arrays.

Every Skill Cell has one stable ID, one exact effect, and one cost. Purchase
requires any one physically adjacent owned Skill Cell plus enough Echoes. The
six canonical territory roots are the only fresh-save bootstrap exception; once
one cell is owned, all current authority is ordinary level-3 cell adjacency.
