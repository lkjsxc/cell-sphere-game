import { conditional as c, defineBranch, scalar as s, unlock as u } from './memory-node.js';

export const PERCEPTION_MEMORY = defineBranch('perception', 'ecology-living-crown', [
  ['quiet-echo', 'Quiet Echo', 'Signal radius widens by 8%.', 'The first remembered cue travels farther, replacing the old free Signal with steadier perception.', 2, s('signalRadius', 1.08), 870],
  ['lingering-cue', 'Lingering Cue', 'Signals last 4% longer.', 'A placed cue fades gradually enough for distant tissue to complete its response.', 3, s('signalDuration', 1.04), 957],
  ['wide-receptors', 'Wide Receptors', 'Signal radius widens by 4%.', 'Receptors compare a broader neighborhood before deciding which direction matters.', 3, s('signalRadius', 1.04), 237],
  ['patient-attention', 'Patient Attention', 'Signals last 5% longer.', 'The network holds a guidance pattern without confusing persistence for urgency.', 4, s('signalDuration', 1.05), 1041],
  ['distributed-watch', 'Distributed Watch', 'Enable one layer of distributed sensing.', 'Many small observers recognize environmental change before the core feels it directly.', 4, s('distributedSensing', 1, 'add'), 986],
  ['selective-listening', 'Selective Listening', 'Network upkeep falls by 2%.', 'Quiet receptors ignore harmless fluctuation and reduce the cost of constant vigilance.', 4, s('maintenance', 0.98), 1000],
  ['spare-beacon', 'Spare Beacon', 'Carry one additional Signal charge.', 'A later lesson preserves one deliberate intervention without restoring the retired opening gift.', 5, s('signalCharges', 1, 'add'), 1022],
  ['informed-frontier', 'Informed Frontier', 'Frontiers advance 3% more readily.', 'Tips combine local texture with distant cues before spending energy on movement.', 6, s('reach', 1.03), 1484],
  ['alarm-clarity', 'Alarm Clarity', 'Signal radius widens during a crisis.', 'Urgent cues travel across the threatened region without permanently amplifying every command.', 5, c('crisis-active', 'signalRadius', 1.14), 985],
  ['fading-guidance', 'Fading Guidance', 'Signals last longer while energy is low.', 'A starving network preserves existing instructions when replacing them would be costly.', 6, c('energy-below-20', 'signalDuration', 1.16), 1451],
  ['frontier-attention', 'Frontier Attention', 'Reach rises near an active Signal.', 'Only tissue within the cue field turns perception into a stronger exploratory commitment.', 7, c('inside-signal-field', 'reach', 1.10), 1528],
  ['crowd-sense', 'Crowd Sense', 'Upkeep falls above 70% coverage.', 'Dense tissue suppresses redundant local alarms while preserving exceptional warnings.', 8, c('coverage-above-70', 'maintenance', 0.90), 393],
  ['resonant-signal', 'Resonant Signal', 'Unlock a morphology-guiding Signal mode.', 'A placed cue may favor loops or frontier tissue through an explicit player choice.', 5, u('resonantSignal', 'mechanic'), 1539],
  ['pressure-forecast', 'Pressure Forecast', 'Reveal the next crisis window.', 'The atlas reports a bounded warning interval rather than pretending to know an exact future.', 7, u('pressureForecast', 'information'), 1457],
  ['watchful-pause', 'Watchful Pause', 'Unlock warning-based pause rules.', 'A saved rule may pause at the first visible crisis warning for an accessible decision point.', 9, u('watchfulPause', 'automation'), 1534],
  ['watchful-crown', 'Watchful Crown', 'Unlock Perception mastery for campaign rules.', 'Signals, environmental reading, and deliberate timing become one practiced sense.', 14, u('perceptionMastery', 'keystone'), 1537],
  ['sensed-habitat', 'Sensed Habitat', 'Join Perception and Ecology mastery.', 'Environmental tolerance responds to observed pressure instead of waiting for tissue loss.', 18, u('perceptionEcologyConfluence', 'connector'), 2327],
  ['world-mind', 'World Mind', 'Unlock the World Mind capstone.', 'The atlas may expose a coherent planetary warning layer earned through careful observation.', 26, u('worldMind', 'capstone'), 2318],
]);
