/** Developer-only uniform fixture for browser seam-continuity evidence. */
export const CONTINUITY_FIXTURE = Object.freeze({
  kind: 'continuity',
  background: Object.freeze([0.94, 0.02, 0.72]),
  surface: Object.freeze([0.08, 0.82, 0.30]),
});

export function continuityFixture(scene, developerMode = false) {
  return developerMode && scene?.fixture?.kind === CONTINUITY_FIXTURE.kind ? CONTINUITY_FIXTURE : null;
}
