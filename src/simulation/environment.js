/**
 * Environmental phase: global entropy curve, seasonal fields, nutrient
 * regeneration, toxin accumulation, and chronic pressure.
 *
 * Curves are precomputed LUTs (built once per run) so the per-tick path uses
 * only array lookups and arithmetic. LUT construction may use Math.sin/pow —
 * that happens once per engine and never inside the tick.
 */
import { BALANCE as B } from '../game/balance.js';
import { clamp01, smootherstep } from '../core/math.js';
import { freshwaterSupportAt, transferReserve } from './resource-ecology.js';

/** Global deterioration curve, indexed by tick. 0 until rise start, 1 at end. */
export function buildEntropyLut(profile = null) {
  // Presentation-compatible finite LUT only; live authority uses
  // environmentEntropyAt() and has no world-duration ceiling.
  const len = B.ENTROPY_RISE_END + B.SEASON_PERIOD_TICKS;
  const pressure = profile && typeof profile === 'object'
    ? Math.max(0, Math.min(1, profile.score?.pressure ?? 0)) : 0;
  const start = B.ENTROPY_RISE_START - Math.round(pressure * 250);
  const lut = new Float32Array(len);
  for (let t = 0; t < len; t++) {
    const x = (t - start) / (B.ENTROPY_RISE_END - start);
    const e = smootherstep(x);
    lut[t] = Math.fround(Math.pow(e, B.ENTROPY_POWER));
  }
  return lut;
}

/**
 * Finite live entropy projection. It blends the established early curve with
 * the transition-installed public pressure; it never rewrites world start
 * data and is independent of rendering or simulation speed.
 */
export function environmentEntropyAt(state) {
  const tick = Math.max(0, Number.isSafeInteger(state?.tick) ? state.tick : 0);
  const profile = state?.currentEnvironmentProfile;
  const pressure = clamp01(profile?.score?.pressure ?? 0);
  const severity = clamp01(profile?.score?.severity ?? pressure);
  const early = smootherstep((tick - B.ENTROPY_RISE_START) / (B.ENTROPY_RISE_END - B.ENTROPY_RISE_START));
  return Math.fround(clamp01(early * (0.72 + pressure * 0.28) + pressure * 0.12 + severity * 0.08));
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
 */
export function updateEnvironment(state) {
  const { topo, fields } = state; const traits = state.activeTraits ?? state.traits;
  const N = topo.nodeCount;
  const t = state.tick;
  const e = environmentEntropyAt(state);
  state.entropy = e;

  const period = B.SEASON_PERIOD_TICKS;
  const coefficients = state.environmentCoefficients ?? state.currentEnvironmentProfile?.coefficients ?? {};
  const seasonAmp = B.SEASON_AMPLITUDE * (coefficients.seasonScale ?? 0.25) * (0.6 + 0.8 * e);
  const symbiotic = traits.symbioticFilm > 0;
  const renewalScale = coefficients.renewalScale ?? 1;

  for (let i = 0; i < N; i++) {
    const phase = (t + state.nodeSeasonOffset[i]) % period;
    const season = state.seasonLut[phase];
    const season2 = state.seasonLut[(phase + (period / 3 | 0)) % period];

    // Moisture: freshwater locally buffers, but does not cancel, global drying.
    const freshwater = freshwaterSupportAt(state, i);
    state.moisture[i] = Math.fround(clamp01(
      fields.baseMoisture[i] + state.dynamicFreshwaterSupport[i] * .12
        + seasonAmp * season - e * (coefficients.dryingScale ?? 0) * (1 - freshwater * .50)));

    // Temperature: seasonal + slow entropy heat drift.
    state.temperature[i] = Math.fround(clamp01(
      fields.baseTemp[i] + seasonAmp * 0.7 * season2 + e * (coefficients.heatDriftScale ?? 0)));

    // Toxins accumulate with entropy, decay slowly.
    const tox = state.toxicity[i]
      + B.TOXIN_ACCUMULATION * e * (coefficients.toxinScale ?? 0) * fields.toxVuln[i]
      - B.TOXIN_DECAY * state.toxicity[i];
    state.toxicity[i] = Math.fround(clamp01(tox));

    // Nutrient regeneration fails as entropy rises; occupied cells with
    // symbiotic film renew better.
    const occupied = symbiotic && state.alive[i] === 1 ? 1.5 : 1;
    const regen = B.NUTRIENT_REGEN * (1 - e * 0.92) * occupied * renewalScale
      * (fields.resourceRenewal?.[i] ?? 1) * (1 + freshwater * .35);
    const localTarget = Math.min(1, fields.baseNutrient[i] * (1 + freshwater * .08));
    const requested = Math.max(0, regen * (localTarget - state.nutrient[i]));
    transferReserve(state, i, requested);
  }

}
