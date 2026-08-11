/** Immutable simulation-boundary projection of one compiled Evolution state. */
export function evolutionRunConfiguration(evolution) {
  const value = evolution && typeof evolution === 'object' ? evolution : {};
  return Object.freeze({
    evolutionDefense: Object.freeze({ affinityDefense: value.affinityDefense ?? {}, pressureDefense: value.pressureDefense ?? {} }),
    memoryEffects: value.effects ?? {}, habitatCapabilities: value.habitatCapabilities ?? [], ecology: value.ecology ?? {},
    worldmaking: value.worldmaking ?? {}, luminous: value.luminous ?? {},
  });
}
