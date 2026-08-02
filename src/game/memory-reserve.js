import { conditional as c, defineBranch, scalar as s, unlock as u } from './memory-node.js';

export const RESERVE_MEMORY = defineBranch('reserve', 'flow-river-crown', [
  ['deep-vault', 'Deep Vault', 'Energy capacity rises by 8%.', 'Layered storage remembers how much abundance can be held without stalling useful growth.', 2, s('energyCap', 1.08), 761],
  ['amber-granules', 'Amber Granules', 'Energy capacity rises by 3%.', 'Small reserves distributed through the body keep opportunity close to active tissue.', 3, s('energyCap', 1.03), 185],
  ['measured-appetite', 'Measured Appetite', 'Nutrient uptake rises by 3%.', 'The network feeds steadily enough to store surplus without stripping one patch bare.', 3, s('uptake', 1.03), 662],
  ['lean-matrix', 'Lean Matrix', 'Network upkeep falls by 2%.', 'Stored energy lasts longer because quiet tissue maintains a lighter internal scaffold.', 4, s('maintenance', 0.98), 730],
  ['sealed-pockets', 'Sealed Pockets', 'Energy capacity rises by 4%.', 'Isolated granules protect part of the reserve from a local collapse in circulation.', 4, s('energyCap', 1.04), 49],
  ['slow-release-sugars', 'Slow-Release Sugars', 'Stress resistance rises by 3%.', 'Bound stores release gradually enough to soften abrupt environmental pressure.', 4, s('stressResist', 1.03), 738],
  ['winter-cache', 'Winter Cache', 'Enable one layer of cold reserve.', 'Abundance can be banked as a dormant store before harsh conditions arrive.', 5, s('coldReserve', 1, 'add'), 1250],
  ['economical-walls', 'Economical Walls', 'Expansion costs 4% less energy.', 'New cells borrow a proven wall pattern that is strong without being overbuilt.', 6, s('growCost', 0.96), 681],
  ['famine-ration', 'Famine Ration', 'Upkeep falls while energy is below 20%.', 'A low reserve triggers measured rationing before the network begins emergency pruning.', 5, c('energy-below-20', 'maintenance', 0.88), 720],
  ['surplus-budding', 'Surplus Budding', 'Reach rises while energy exceeds 80%.', 'A full vault is converted into territory while the opportunity can still be used.', 6, c('energy-above-80', 'reach', 1.10), 341],
  ['crisis-cache', 'Crisis Cache', 'Energy capacity rises during a crisis.', 'Temporary storage pockets open when environmental pressure threatens normal circulation.', 7, c('crisis-active', 'energyCap', 1.12), 1288],
  ['ash-harvest', 'Ash Harvest', 'Uptake rises after mass tissue loss.', 'Nutrients released by a collapse are gathered before they diffuse beyond the survivors.', 8, c('recent-biomass-loss-above-20', 'uptake', 1.14), 330],
  ['granary-strain', 'Granary Strain', 'Unlock the Granary starting morphology.', 'A compact storage-led strain can be selected for worlds with delayed abundance.', 5, u('granaryStrain', 'mechanic'), 1293],
  ['reserve-ledger', 'Reserve Ledger', 'Reveal income and upkeep balance.', 'The atlas reports whether current energy is being stored, spent, or merely recirculated.', 7, u('reserveLedger', 'information'), 1331],
  ['famine-protocol', 'Famine Protocol', 'Unlock reserve-aware pruning rules.', 'A saved rule may prune marginal tissue only after visible reserves cross a chosen floor.', 9, u('famineProtocol', 'automation'), 1329],
  ['deepwell-crown', 'Deepwell Crown', 'Unlock Reserve mastery for campaign rules.', 'Gathering, storage, and deliberate release become one coherent survival discipline.', 14, u('reserveMastery', 'keystone'), 1276],
  ['banked-river', 'Banked River', 'Join Reserve and Flow mastery.', 'Stored abundance waits near proven channels so renewed circulation can use it immediately.', 18, u('reserveFlowConfluence', 'connector'), 576],
  ['seed-vault-world', 'Seed-Vault World', 'Unlock the Seed-Vault World capstone.', 'The campaign may begin from a bounded planetary reserve earned through prior extinctions.', 26, u('seedVaultWorld', 'capstone'), 2265],
]);
