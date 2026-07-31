/**
 * Environmental phase: global entropy curve, seasonal fields, nutrient
 * regeneration, toxin accumulation, and active-event application.
 *
 * Curves are precomputed LUTs (built once per run) so the per-tick path uses
 * only array lookups and arithmetic. LUT construction may use Math.sin/pow —
 * that happens once per engine and never inside the tick.
 */
import { BALANCE as B } from '../game/balance.js';
import { clamp01, smootherstep } from '../core/math.js';

/** Global deterioration curve, indexed by tick. 0 until rise start, 1 at end. */
export function buildEntropyLut() {
  const len = B.RUN_CEILING_TICKS + 600;
  const lut = new Float32Array(len);
  for (let t = 0; t < len; t++) {
    const x = (t - B.ENTROPY_RISE_START) / (B.ENTROPY_RISE_END - B.ENTROPY_RISE_START);
    const e = smootherstep(x);
    lut[t] = Math.fround(Math.pow(e, B.ENTROPY_POWER));
  }
  return lut;
}

/** Seasonal oscillation in [-1, 1], indexed by (tick + nodeOffset) % period. */
export function buildSeasonLut() {
  const period = B.SEASON_PERIOD_TICKS;
  const lut = new Float32Array(period);
  for (let t = 0; t < period; t++) {
    lut[t] = Math.fround(Math.sin((t / period) * Math.PI * 2));
  }
  return lut;
}

/** Deterministic per-node season phase offsets from quantized positions. */
export function buildNodeSeasonOffsets(topo) {
  const offsets = new Uint16Array(topo.nodeCount);
  const period = B.SEASON_PERIOD_TICKS;
  for (let i = 0; i < topo.nodeCount; i++) {
    // Integer hash of position bits — no transcendentals.
    const x = Math.round(topo.positions[i * 3] * 1000) | 0;
    const y = Math.round(topo.positions[i * 3 + 1] * 1000) | 0;
    const z = Math.round(topo.positions[i * 3 + 2] * 1000) | 0;
    let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791);
    h = ((h >>> 16) ^ h) >>> 0;
    offsets[i] = h % period;
  }
  return offsets;
}

/**
 * One environment update. Called every ENV_EVERY ticks.
 * @param {object} state run state
 * @param {Array} eventEffects accumulated event deltas for this step
 *   ({nodes: Uint16Array, falloff: Float32Array, kind, amount})
 */
export function updateEnvironment(state) {
  const { topo, fields, traits } = state;
  const N = topo.nodeCount;
  const t = state.tick;
  const e = state.entropyLut[Math.min(t, state.entropyLut.length - 1)];
  state.entropy = e;

  const period = B.SEASON_PERIOD_TICKS;
  const seasonAmp = B.SEASON_AMPLITUDE * (0.6 + 0.8 * e);
  const symbiotic = traits.symbioticFilm > 0;
  const challengeNutrient = state.challenge?.nutrientRenewal ?? 1;

  for (let i = 0; i < N; i++) {
    const phase = (t + state.nodeSeasonOffset[i]) % period;
    const season = state.seasonLut[phase];
    const season2 = state.seasonLut[(phase + (period / 3 | 0)) % period];

    // Moisture: seasonal swing widening with entropy, global drying.
    state.moisture[i] = Math.fround(clamp01(
      fields.baseMoisture[i] + seasonAmp * season - e * 0.22));

    // Temperature: seasonal + slow entropy heat drift.
    state.temperature[i] = Math.fround(clamp01(
      fields.baseTemp[i] + seasonAmp * 0.7 * season2 + e * 0.08));

    // Toxins accumulate with entropy, decay slowly.
    const tox = state.toxicity[i]
      + B.TOXIN_ACCUMULATION * e * fields.toxVuln[i]
      - B.TOXIN_DECAY * state.toxicity[i];
    state.toxicity[i] = Math.fround(clamp01(tox));

    // Nutrient regeneration fails as entropy rises; occupied cells with
    // symbiotic film renew better.
    const occupied = symbiotic && state.alive[i] === 1 ? 1.5 : 1;
    const regen = B.NUTRIENT_REGEN * (1 - e * 0.92) * occupied * challengeNutrient;
    state.nutrient[i] = Math.fround(clamp01(
      state.nutrient[i] + regen * (fields.baseNutrient[i] - state.nutrient[i])));
  }

  applyEventEffects(state);
}

/** Apply active event footprints for the current tick. */
function applyEventEffects(state) {
  const t = state.tick;
  for (const ev of state.events) {
    if (t < ev.startTick || t > ev.endTick) continue;
    const env = eventEnvelope(t, ev);
    if (env <= 0) continue;
    const strength = ev.amount * ev.intensity * env;
    const nodes = ev.nodes;
    const falloff = ev.falloff;
    for (let k = 0; k < nodes.length; k++) {
      const i = nodes[k];
      const w = strength * falloff[k];
      switch (ev.kind) {
        case 'moisture': state.moisture[i] = Math.fround(clamp01(state.moisture[i] - w)); break;
        case 'heat': state.temperature[i] = Math.fround(clamp01(state.temperature[i] + w)); break;
        case 'cold': state.temperature[i] = Math.fround(clamp01(state.temperature[i] - w)); break;
        case 'toxin': state.toxicity[i] = Math.fround(clamp01(state.toxicity[i] + w)); break;
        case 'stress':
          if (state.alive[i] === 1) {
            state.stress[i] = Math.fround(clamp01(state.stress[i] + w));
          }
          break;
        case 'ash':
          state.nutrient[i] = Math.fround(clamp01(state.nutrient[i] - w));
          state.temperature[i] = Math.fround(clamp01(state.temperature[i] - w * 0.4));
          break;
        case 'bloom': state.nutrient[i] = Math.fround(clamp01(state.nutrient[i] + w)); break;
        case 'blight':
          if (state.alive[i] === 1) {
            state.biomass[i] = Math.fround(Math.max(0, state.biomass[i] - w * 0.25));
            state.stress[i] = Math.fround(clamp01(state.stress[i] + w * 0.5));
          }
          break;
        default: break;
      }
    }
  }
}

/** Smooth attack/release envelope for an event at tick t. */
function eventEnvelope(t, ev) {
  const rise = ev.peakTick - ev.startTick;
  const fall = ev.endTick - ev.peakTick;
  const up = rise > 0 ? smootherstep((t - ev.startTick) / rise) : 1;
  const down = fall > 0 ? 1 - smootherstep((t - ev.peakTick) / fall) : 1;
  return up * down;
}
