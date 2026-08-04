/** Transparent SCORE model: Run Quality × permanent World Potential × Challenge. */
import { BALANCE as B } from './balance.js';
import { smootherstep, clamp01 } from '../core/math.js';

export const SCORE_MODEL_VERSION = 2;
const W = B.SCORE_WEIGHTS;

export const COMPONENTS = Object.freeze([
  Object.freeze({ key: 'survival', en: 'Survival', ja: '生存' }),
  Object.freeze({ key: 'peakCoverage', en: 'Peak Reach', ja: '最大到達' }),
  Object.freeze({ key: 'sustainedCoverage', en: 'Sustained Reach', ja: '持続到達' }),
  Object.freeze({ key: 'connectivity', en: 'Unity', ja: '結合' }),
  Object.freeze({ key: 'efficiency', en: 'Resource Efficiency', ja: '資源効率' }),
  Object.freeze({ key: 'stability', en: 'Stability', ja: '安定' }),
]);

export const RANKS = Object.freeze([
  Object.freeze({ min: 0, en: 'Seed', ja: '種' }),
  Object.freeze({ min: 10000, en: 'Rooted', ja: '根付き' }),
  Object.freeze({ min: 30000, en: 'Explorer', ja: '探索者' }),
  Object.freeze({ min: 100000, en: 'Cartographer', ja: '地図師' }),
  Object.freeze({ min: 250000, en: 'Worldweaver', ja: '世界織り' }),
  Object.freeze({ min: 500000, en: 'Planetary', ja: '惑星級' }),
  Object.freeze({ min: 750000, en: 'Biosphere', ja: '生物圏' }),
  Object.freeze({ min: 1000000, en: 'Living World', ja: '生きた世界' }),
]);

export function rankFor(total) {
  let rank = RANKS[0];
  for (const candidate of RANKS) if (total >= candidate.min) rank = candidate;
  return rank;
}

export function componentValues(m) {
  const efficiency = m.totalUptake > 0
    ? clamp01(m.totalUptake / (m.totalUptake + m.totalMaintenance * 1.5)) : 0;
  return {
    survival: smootherstep(clamp01(m.survivalSeconds / (B.RUN_TARGET_TICKS / B.TICKS_PER_SECOND))),
    peakCoverage: Math.sqrt(clamp01(m.peakCoverage)),
    sustainedCoverage: Math.sqrt(clamp01(m.sustainedCoverage)),
    connectivity: clamp01(m.peakConnectedShare),
    efficiency,
    stability: clamp01(1 - (m.stressBurden ?? 0)),
  };
}

export function metricsFromState(s) {
  return {
    survivalSeconds: s.tick / B.TICKS_PER_SECOND,
    peakCoverage: s.peakCoverage,
    sustainedCoverage: s.sustainedSamples ? s.sustainedSum / s.sustainedSamples : 0,
    peakConnectedShare: s.peakConnectedShare,
    totalUptake: s.totalUptake,
    totalMaintenance: s.totalMaintenance,
    stressBurden: s.stressBurdenSamples ? s.stressBurdenSum / s.stressBurdenSamples : 0,
    worldPotential: s.worldPotential,
    challengeMult: s.challenge?.scoreMult ?? 1,
  };
}

export function metricsFromResult(r) {
  return {
    survivalSeconds: r.survivalSeconds,
    peakCoverage: r.peakCoverage,
    sustainedCoverage: r.sustainedCoverage,
    peakConnectedShare: r.peakConnectedShare,
    totalUptake: r.totalUptake,
    totalMaintenance: r.totalMaintenance,
    stressBurden: r.stressBurden ?? 0,
    worldPotential: r.worldPotential,
    challengeMult: r.challengeMult ?? 1,
  };
}

export function evaluate(metrics) {
  const values = componentValues(metrics);
  const potential = Number.isFinite(metrics.worldPotential) && metrics.worldPotential >= 0
    ? Math.round(metrics.worldPotential) : 0;
  const mult = Number.isFinite(metrics.challengeMult) && metrics.challengeMult > 0
    ? metrics.challengeMult : 1;
  let quality = 0;
  const breakdown = COMPONENTS.map((component) => {
    const weight = W[component.key]; const q = values[component.key]; quality += weight * q;
    return Object.freeze({ ...component, q, weight,
      points: Math.round(potential * mult * weight * q) });
  });
  const total = Math.max(0, Math.round(potential * quality * mult));
  const rank = rankFor(total); const rankIndex = RANKS.indexOf(rank);
  return Object.freeze({ modelVersion: SCORE_MODEL_VERSION, total, quality, worldPotential: potential,
    mult, rank, nextRank: RANKS[rankIndex + 1] ?? null, echoes: echoesFor(total),
    breakdown: Object.freeze(breakdown) });
}

export function liveScore(state) { return evaluate(metricsFromState(state)).total; }
export function scoreResult(result) { return evaluate(metricsFromResult(result)); }

/** Bounded square-root income: 10k≈14, 100k≈35, 500k≈74, 1m≈104. */
export function echoesFor(total) {
  return B.ECHO_BASE + Math.floor(Math.sqrt(Math.max(0, total) / B.ECHO_DIVISOR));
}
