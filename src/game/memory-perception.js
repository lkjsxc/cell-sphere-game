import { conditional as c, defineBranch, scalar as s, unlock as u } from './memory-node.js';

export const PERCEPTION_MEMORY = defineBranch('perception', 'ecology-living-crown', [
  ['quiet-echo', 'Quiet Echo', 'Stress resistance rises by 6%.', 'The retired opening intervention becomes a steadier ability to read pressure before tissue fails.', 2, s('stressResist', 1.06)],
  ['lingering-attention', 'Lingering Attention', 'Network upkeep falls by 2%.', 'Calm observation filters harmless variation before the network spends energy responding to it.', 3, s('maintenance', 0.98)],
  ['wide-receptors', 'Wide Receptors', 'Nutrient uptake rises by 3%.', 'Broader local receptors identify diffuse nourishment without directing growth from the camera.', 3, s('uptake', 1.03)],
  ['patient-attention', 'Patient Attention', 'Stress resistance rises by 3%.', 'Slow environmental reading separates a durable trend from a brief fluctuation.', 4, s('stressResist', 1.03)],
  ['distributed-watch', 'Distributed Watch', 'Crisis warnings arrive earlier.', 'Many small observers recognize environmental change before the living core feels it directly.', 4, s('distributedSensing', 1, 'add')],
  ['selective-listening', 'Selective Listening', 'Network upkeep falls by 2%.', 'Quiet receptors suppress redundant alarms while preserving changes that matter.', 4, s('maintenance', 0.98)],
  ['pattern-memory', 'Pattern Memory', 'Frontiers advance 3% more readily.', 'Repeated geography teaches autonomous tips to recognize viable transitions sooner.', 5, s('reach', 1.03)],
  ['informed-frontier', 'Informed Frontier', 'Frontiers advance 3% more readily.', 'Tips combine local texture with the world model before spending energy on movement.', 6, s('reach', 1.03)],
  ['alarm-clarity', 'Alarm Clarity', 'Stress resistance rises during a crisis.', 'Urgent environmental patterns become easier to distinguish while a crisis is active.', 5, c('crisis-active', 'stressResist', 1.14)],
  ['fading-guidance', 'Fading Guidance', 'Upkeep falls while energy is low.', 'A starving network preserves attention for existing routes instead of chasing every fluctuation.', 6, c('energy-below-20', 'maintenance', 0.88)],
  ['forecast-window', 'Forecast Window', 'Reach rises while a crisis is telegraphed.', 'Autonomous frontiers use the visible warning interval to explore alternative ground.', 7, c('crisis-telegraphed', 'reach', 1.10)],
  ['crowd-sense', 'Crowd Sense', 'Upkeep falls above 70% coverage.', 'Dense tissue suppresses redundant local sensing while preserving exceptional warnings.', 8, c('coverage-above-70', 'maintenance', 0.90)],
  ['cell-chronicle', 'Cell Chronicle', 'Unlock deeper per-cell event context.', 'The inspector can relate a selected location to meaningful events preserved in History.', 5, u('cellChronicle', 'information', s('stressResist', 1.01))],
  ['pressure-forecast', 'Pressure Forecast', 'Unlock the next crisis window.', 'History and inspection expose a bounded warning interval rather than false exact prediction.', 7, u('pressureForecast', 'information', s('distributedSensing', 1, 'add'))],
  ['world-comparison', 'World Comparison', 'Unlock side-by-side archive details.', 'Past Worlds can compare durable semantic records without storing raw tick logs.', 9, u('worldComparison', 'information', s('uptake', 1.01))],
  ['watchful-crown', 'Watchful Crown', 'Perception mastery raises resistance by 3%.', 'Environmental reading becomes a practiced sense with a small, bounded survival benefit.', 14, u('perceptionMastery', 'keystone', s('stressResist', 1.03))],
  ['sensed-habitat', 'Sensed Habitat', 'Perception and Ecology widen crisis warning.', 'The two currents converge into one additional layer of distributed sensing.', 18, u('perceptionEcologyConfluence', 'connector', s('distributedSensing', 1, 'add'))],
  ['world-mind', 'World Mind', 'World Mind lowers upkeep by 2%.', 'The capstone turns a complete observation atlas into a small permanent efficiency gain.', 26, u('worldMind', 'capstone', s('maintenance', 0.98))],
]);
