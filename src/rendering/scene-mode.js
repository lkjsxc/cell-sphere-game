/** One renderer discriminator for material behavior; scene state remains presentation-only. */
export const RENDER_SCENE = Object.freeze({ WORLD: 0, EVOLUTION: 1, TROPHY: 2 });

export function renderSceneMode(snapshot) {
  if (snapshot?.status === 'evolution') return RENDER_SCENE.EVOLUTION;
  if (snapshot?.status === 'trophies') return RENDER_SCENE.TROPHY;
  return RENDER_SCENE.WORLD;
}
