/** SCORE v6: realized ecological outcomes only, with bounded Environment-pressure evidence. */
import { BALANCE as B } from './balance.js';
import { clamp01 } from '../core/math.js';
import { addProgressionIntegers, compareProgressionIntegers, divideProgressionIntegers, formatProgressionEngineering,
  incrementProgressionInteger, maxProgressionInteger, multiplyDivideProgressionInteger, multiplyProgressionIntegers,
  normalizeProgressionInteger, projectProgressionInteger, sqrtProgressionInteger } from '../core/progression-integer.js';

export const SCORE_MODEL_VERSION = 6;
export const SCORE_FORMULA_VERSION = 6;
const QUALITY_SCALE = '1000000000'; const MULTIPLIER_SCALE = '1000000'; const SCORE_SCALE = '300000';
const COMBINED_SCALE = '1000000000000000'; const ENVIRONMENT_BONUS_LIMIT = .12;
const W = B.SCORE_WEIGHTS;
const TARGET = Object.freeze({ survival: 180, exploration: 180, presence: 30, coherence: 28, stewardship: 170, worldmaking: 90 });
const COMPONENT_CAP = Object.freeze({ survival: 1, exploration: .90, presence: .90, coherence: .90, stewardship: .90, worldmaking: .88 });
export const COMPONENTS = Object.freeze([
  Object.freeze({ key: 'survival', en: 'Survival', ja: '生存' }), Object.freeze({ key: 'exploration', en: 'Exploration', ja: '探索' }),
  Object.freeze({ key: 'presence', en: 'Presence', ja: '生存圏' }), Object.freeze({ key: 'coherence', en: 'Coherence', ja: '結合' }),
  Object.freeze({ key: 'stewardship', en: 'Stewardship', ja: '資源管理' }), Object.freeze({ key: 'worldmaking', en: 'Worldmaking', ja: '世界形成' }),
]);
export const RANKS = Object.freeze([
  Object.freeze({ min: '0', en: 'Seed', ja: '種' }), Object.freeze({ min: '10000', en: 'Rooted', ja: '根付き' }),
  Object.freeze({ min: '25000', en: 'Explorer', ja: '探索者' }), Object.freeze({ min: '50000', en: 'Cartographer', ja: '地図師' }),
  Object.freeze({ min: '100000', en: 'Worldweaver', ja: '世界織り' }), Object.freeze({ min: '250000', en: 'Planetary', ja: '惑星級' }),
  Object.freeze({ min: '500000', en: 'Biosphere', ja: '生物圏' }), Object.freeze({ min: '750000', en: 'World Gardener', ja: '世界庭師' }),
  Object.freeze({ min: '1000000', en: 'Living World', ja: '生きた世界' }),
]);
export function rankFor(total) {
  const exact = normalizeProgressionInteger(total, '0'); let rank = RANKS[0];
  for (const candidate of RANKS) if (compareProgressionIntegers(exact, candidate.min) >= 0) rank = candidate;
  if (compareProgressionIntegers(exact, RANKS.at(-1).min) < 0) return rank;
  const cycle = divideProgressionIntegers(exact, RANKS.at(-1).min); const label = cycle.length <= 12 ? cycle : formatProgressionEngineering(cycle, 5);
  return Object.freeze({ min: multiplyProgressionIntegers(cycle, RANKS.at(-1).min), en: cycle === '1' ? 'Living World' : `Living World · Cycle ${label}`,
    ja: cycle === '1' ? '生きた世界' : `生きた世界 · 周期 ${label}`, cycle });
}
export function createScoreMerit() { return { modelVersion: SCORE_MODEL_VERSION,
  raw: { survival: 0, exploration: 0, presence: 0, coherence: 0, stewardship: 0, worldmaking: 0 },
  normalized: { survival: 0, exploration: 0, presence: 0, coherence: 0, stewardship: 0, worldmaking: 0 },
  total: '0', quality: 0, environmentBonusQ: 0, lastUpdateTick: 0 }; }
/** Called once per authoritative summary second. All sources are realized and monotone. */
export function recordScoreSummary(state) {
  const merit = state.scoreMerit;
  merit.raw.survival = Math.max(merit.raw.survival, state.tick / B.TICKS_PER_SECOND);
  merit.raw.presence += state.aliveCount / state.topo.nodeCount;
  merit.raw.coherence += Math.max(0, state.largestComponent) / state.topo.nodeCount;
  merit.raw.stewardship = Math.max(merit.raw.stewardship, state.totalUptake + state.resourceReclaimed * 1.5 + state.resourceRecoveredCells * 2);
  merit.raw.worldmaking = Math.max(merit.raw.worldmaking, state.resourceRecoveredCells * 8 + state.transformedCells * 12
    + count(state.everPowered) * 2 + state.glacialLakeCells * 10 + state.maritimeForestCells * 12 + (state.reach100Achieved ? 120 : 0));
  return refreshScoreMerit(state);
}
export function recordScoreExploration(state, cell, weight = 1) {
  if (!state.everColonized || state.everColonized[cell]) return false;
  state.everColonized[cell] = 1; state.scoreMerit.raw.exploration += Math.max(.25, weight); return true;
}
export function refreshScoreMerit(state) {
  const current = evaluate(metricsFromState(state)); const bonusQ = Math.max(0, Math.min(Number(MULTIPLIER_SCALE) - 1,
    Math.round(current.environmentCredit.bonus * Number(MULTIPLIER_SCALE))));
  state.scoreMerit.environmentBonusQ = Math.max(state.scoreMerit.environmentBonusQ ?? 0, bonusQ);
  const projection = evaluate(metricsFromState(state), { environmentBonusQ: state.scoreMerit.environmentBonusQ });
  state.scoreMerit.normalized = Object.fromEntries(projection.breakdown.map((part) => [part.key, part.q]));
  state.scoreMerit.quality = projection.quality; state.scoreMerit.total = maxProgressionInteger(state.scoreMerit.total, projection.total);
  state.scoreMerit.lastUpdateTick = state.tick;
  return { ...projection, total: state.scoreMerit.total, echoes: echoesFor(state.scoreMerit.total), rank: rankFor(state.scoreMerit.total) };
}
export function componentValues(metrics) {
  const raw = metrics.scoreMerit?.raw ?? metrics.raw ?? legacyRaw(metrics); const maturity = clamp01((raw.survival ?? 0) / 90);
  return Object.freeze(Object.fromEntries(COMPONENTS.map(({ key }) => {
    let value = Math.min(COMPONENT_CAP[key], clamp01((raw[key] ?? 0) / TARGET[key]));
    if (key === 'exploration' || key === 'stewardship') value = Math.min(value, maturity);
    return [key, value];
  })));
}
export function metricsFromState(state) { return { scoreMerit: state.scoreMerit, environmentExposure: state.environmentExposure,
  peakEnvironmentLevel: state.peakEnvironmentLevel, environmentPressureSummary: state.currentEnvironmentProfile?.score, survivalTicks: state.tick }; }
export function metricsFromResult(result) { return { scoreMerit: result.scoreMerit, raw: result.scoreMerit?.raw,
  environmentExposure: result.environmentExposure, peakEnvironmentLevel: result.peakEnvironmentLevel ?? result.finalEnvironmentLevel,
  environmentPressureSummary: result.environmentPressureSummary,
  survivalTicks: Number.isFinite(result.scoreMerit?.lastUpdateTick) ? Math.max(0, result.scoreMerit.lastUpdateTick)
    : Math.max(0, Math.round((result.survivalSeconds ?? 0) * B.TICKS_PER_SECOND)), survivalSeconds: result.survivalSeconds,
  uniqueColonized: sum(result.habitatOccupancy ?? []), sustainedCoverage: result.sustainedCoverage,
  peakConnectedShare: result.peakConnectedShare, totalUptake: result.totalUptake, worldmaking: result.worldmakingMerit ?? 0 }; }
export function evaluate(metrics, options = {}) {
  const values = componentValues(metrics); let quality = 0;
  for (const component of COMPONENTS) quality += W[component.key] * values[component.key]; quality = clamp01(quality);
  const environmentCredit = environmentCreditFor(metrics, quality, options.environmentBonusQ);
  const multiplier = 1 + environmentCredit.bonus; const multiplierQ = String(Math.max(1, Math.round(multiplier * Number(MULTIPLIER_SCALE))));
  const breakdown = COMPONENTS.map((component) => {
    const q = values[component.key]; const componentQ = String(Math.max(0, Math.floor(W[component.key] * q * Number(QUALITY_SCALE))));
    const points = multiplyDivideProgressionInteger(multiplyProgressionIntegers(componentQ, multiplierQ), SCORE_SCALE, COMBINED_SCALE);
    return Object.freeze({ ...component, q, weight: W[component.key], points });
  });
  const qualityQ = String(Math.max(0, Math.floor(quality * Number(QUALITY_SCALE))));
  const total = multiplyDivideProgressionInteger(multiplyProgressionIntegers(qualityQ, multiplierQ), SCORE_SCALE, COMBINED_SCALE);
  const rank = rankFor(total);
  return Object.freeze({ modelVersion: SCORE_MODEL_VERSION, formulaVersion: SCORE_FORMULA_VERSION, total, quality,
    environmentCredit, rank, nextRank: nextRankFor(total, rank), echoes: echoesFor(total), breakdown: Object.freeze(breakdown) });
}
export function liveScore(state) { return state.scoreMerit?.total ?? evaluate(metricsFromState(state)).total; }
export function scoreResult(result) { return evaluate(metricsFromResult(result), { environmentBonusQ: result.scoreMerit?.environmentBonusQ }); }
export function scoreResultMatchesAuthority(result) { const authoritative = scoreResult(result);
  const supplied = result.scoreProjection?.modelVersion === SCORE_MODEL_VERSION ? result.scoreProjection.total
    : result.scoreModelVersion === SCORE_MODEL_VERSION ? result.score : null;
  return supplied === null || supplied === undefined || normalizeProgressionInteger(supplied, '0') === authoritative.total; }
/** Echoes are a realized score conversion; early World rewards buy one clear first decision. */
export function echoesFor(total) { return addProgressionIntegers(String(B.ECHO_BASE),
  sqrtProgressionInteger(divideProgressionIntegers(normalizeProgressionInteger(total, '0'), String(B.ECHO_DIVISOR)))); }
function environmentCreditFor(metrics, quality, bonusOverrideQ = null) {
  const exposure = metrics.environmentExposure && typeof metrics.environmentExposure === 'object' ? metrics.environmentExposure : null;
  if (!exposure) return Object.freeze({ pressure: 0, exposure: 0, performance: 0, peakDwell: 0, bonus: 0 });
  const totalTicks = normalizeProgressionInteger(exposure.totalTicks, '0'); const pressureTicksQ = normalizeProgressionInteger(exposure.pressureTicksQ, '0');
  const qualityPressureTicksQ = normalizeProgressionInteger(exposure.qualityPressureTicksQ, '0'); const peakTicks = normalizeProgressionInteger(exposure.timeAtPeakTicks, '0');
  if (totalTicks === '0' || pressureTicksQ === '0') return Object.freeze({ pressure: 0, exposure: 0, performance: 0, peakDwell: 0, bonus: 0 });
  const pressure = clamp01(projectProgressionInteger(divideProgressionIntegers(pressureTicksQ, totalTicks), 1_000_000) / 1_000_000);
  const qualityUnderPressure = clamp01(projectProgressionInteger(multiplyDivideProgressionInteger(qualityPressureTicksQ, '1000000', pressureTicksQ), 1_000_000) / 1_000_000);
  const pressureTime = projectProgressionInteger(divideProgressionIntegers(pressureTicksQ, '1000000'), 100_000);
  const sustained = clamp01((pressureTime - 120) / 1200); const peakDwell = clamp01(projectProgressionInteger(peakTicks, 1600) / 400);
  const performance = clamp01(quality) * qualityUnderPressure; const currentBonus = ENVIRONMENT_BONUS_LIMIT * pressure * sustained * (.75 + .25 * peakDwell) * performance;
  const override = Number.isInteger(bonusOverrideQ) && bonusOverrideQ >= 0 ? Math.min(ENVIRONMENT_BONUS_LIMIT, bonusOverrideQ / Number(MULTIPLIER_SCALE)) : null;
  return Object.freeze({ pressure, exposure: sustained, performance, peakDwell, currentBonus, bonus: override === null ? currentBonus : Math.max(currentBonus, override) });
}
function nextRankFor(total, rank) { const index = RANKS.indexOf(rank); if (index >= 0 && index < RANKS.length - 1) return RANKS[index + 1];
  const cycle = rank.cycle ?? divideProgressionIntegers(normalizeProgressionInteger(total, '0'), '1000000'); const nextCycle = incrementProgressionInteger(cycle);
  return Object.freeze({ min: multiplyProgressionIntegers(nextCycle, '1000000'), en: `Living World · Cycle ${nextCycle}`, ja: `生きた世界 · 周期 ${nextCycle}`, cycle: nextCycle }); }
function legacyRaw(metrics) { const seconds = Math.max(0, metrics.survivalSeconds ?? 0); return { survival: seconds, exploration: metrics.uniqueColonized ?? 0,
  presence: Math.max(0, metrics.sustainedCoverage ?? 0) * seconds, coherence: Math.max(0, metrics.sustainedCoverage ?? 0) * seconds * clamp01(metrics.peakConnectedShare ?? 0),
  stewardship: Math.max(0, metrics.totalUptake ?? 0), worldmaking: Math.max(0, metrics.worldmaking ?? 0) }; }
function count(values) { let result = 0; if (values) for (const value of values) if (value) result++; return result; }
function sum(values) { let total = 0; for (const value of values) total += value; return total; }
