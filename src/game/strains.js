/**
 * Strain archetypes and the trait model.
 *
 * A `Traits` object is the single mutable parameter surface the simulation
 * reads. Strains, adaptations, and Memory Globe effects all merge into it.
 * Multipliers center on 1.0; flags default to 0/false.
 */

/** @returns {Traits} neutral trait block */
export function baseTraits() {
  return {
    // multipliers
    reach: 1.0,          // frontier expansion probability
    uptake: 1.0,         // nutrient uptake rate
    maintenance: 1.0,    // maintenance cost
    conductance: 1.0,    // transport capacity
    reinforce: 1.0,      // conductance gain from flux
    stressResist: 1.0,   // stress accumulation resistance
    heatTol: 1.0,        // temperature tolerance width
    droughtTol: 1.0,     // moisture tolerance width
    toxinTol: 1.0,       // toxin resistance
    energyCap: 1.0,
    regrow: 1.0,         // regrowth into dead material
    scoreRate: 1.0,      // explicit score-rate modifier (Quiet Metabolism)
    growCost: 1.0,       // expansion energy cost multiplier
    growthCap: 0,        // extra expansions per node per tick
    // flags / additive
    anastomosis: 0,      // reconnect fragmented branches
    dormantCysts: 0,     // preserve pockets under terminal stress
    cannibal: 0,         // reclaim energy from dead biomass
    symbioticFilm: 0,    // improve renewal in occupied cells
    adaptiveMembrane: 0, // stress resistance rises after exposure
    migratoryCore: 0,    // biomass center may relocate
    pulsedTransport: 0,  // periodic high-flux reinforcement
    feverGrowth: 0,      // growth burst after crisis begins
    coldReserve: 0,      // store energy during abundance
    toxinCatalysis: 0,   // convert toxin pressure to energy
    fractalFrontier: 0,  // more tips, weaker branches
    redundantLoops: 0,   // improved connectivity survival
    localSacrifice: 0,   // prune damaged tips to protect core
    distributedSensing: 0, // event telegraphs arrive earlier
    opportunisticUptake: 0, // bonus uptake during temporary blooms
    sporeMemory: 0,      // encode one trait for the next run
  };
}

export const STRAINS = Object.freeze([
  Object.freeze({
    id: 'pioneer',
    nameJa: '開拓株',
    nameEn: 'Pioneer',
    descJa: '速く広く広がるが、枝は脆い。',
    mods: Object.freeze({ reach: 1.4, maintenance: 1.18, stressResist: 0.8, conductance: 0.9 }),
  }),
  Object.freeze({
    id: 'conservator',
    nameJa: '堅守株',
    nameEn: 'Conservator',
    descJa: '効率的で環境変化に強いが、広がりは遅い。',
    mods: Object.freeze({ reach: 0.8, uptake: 1.15, maintenance: 0.85, stressResist: 1.25, reinforce: 1.1 }),
  }),
  Object.freeze({
    id: 'weaver',
    nameJa: '織網株',
    nameEn: 'Weaver',
    descJa: '強靭な輸送路と輪を編むが、維持コストが高い。',
    mods: Object.freeze({ conductance: 1.35, reinforce: 1.3, maintenance: 1.22, reach: 0.95 }),
  }),
]);

/**
 * Merge strain mods and permanent memory effects into a fresh trait block.
 * @param {string} strainId
 * @param {Partial<Traits>} [memoryEffects] additive/multiplicative permanent effects
 * @returns {Traits}
 */
export function traitsFor(strainId, memoryEffects = {}) {
  const traits = baseTraits();
  const strain = STRAINS.find((s) => s.id === strainId) ?? STRAINS[0];
  // Strain mods are absolute multiplier replacements on the neutral block.
  for (const [key, value] of Object.entries(strain.mods)) {
    if (!(key in traits)) throw new Error(`unknown trait: ${key}`);
    traits[key] = value;
  }
  // Memory effects multiply multipliers and add to additive fields/flags.
  const ADDITIVE = new Set(['anastomosis', 'dormantCysts', 'cannibal',
    'symbioticFilm', 'adaptiveMembrane', 'migratoryCore', 'pulsedTransport',
    'feverGrowth', 'coldReserve', 'toxinCatalysis', 'fractalFrontier',
    'redundantLoops', 'localSacrifice', 'growthCap', 'distributedSensing',
    'opportunisticUptake', 'sporeMemory']);
  for (const [key, value] of Object.entries(memoryEffects)) {
    if (!(key in traits)) throw new Error(`unknown trait: ${key}`);
    traits[key] = ADDITIVE.has(key) ? traits[key] + value : traits[key] * value;
  }
  return traits;
}

/** @typedef {ReturnType<typeof baseTraits>} Traits */
