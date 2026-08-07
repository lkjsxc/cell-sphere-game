/** Bounded, versioned cumulative evidence for within-world Environment pressure. */
import {
  addProgressionIntegers,
  normalizeProgressionInteger,
} from '../core/progression-integer.js';

export const ENVIRONMENT_EXPOSURE_VERSION = 2;
export const ENVIRONMENT_PRESSURE_Q_SCALE = 1_000_000;
const FLUSH_TICK_LIMIT = 100_000;

export function createEnvironmentExposure(level = '0') {
  return {
    version: ENVIRONMENT_EXPOSURE_VERSION,
    totalTicks: '0',
    pressureTicksQ: '0',
    qualityPressureTicksQ: '0',
    timeAtPeakTicks: '0',
    pendingTicks: 0,
    pendingPressureTicksQ: 0,
    pendingQualityPressureTicksQ: 0,
    pendingPeakTicks: 0,
    sampledThroughTick: 0,
    currentLevel: normalizeProgressionInteger(level, '0'),
    peakPressureQ: 0,
  };
}

/** Record a bounded numeric segment; exact canonical totals flush at transitions/results. */
export function sampleEnvironmentExposure(exposure, options = {}) {
  if (!exposure || typeof exposure !== 'object') return false;
  const throughTick = finiteTick(options.throughTick, exposure.sampledThroughTick);
  const fromTick = finiteTick(exposure.sampledThroughTick, 0);
  const ticks = Math.max(0, throughTick - fromTick);
  const pressureQ = pressureQFor(options.pressure);
  const qualityQ = qualityQFor(options.quality);
  const isPeak = options.currentLevel === options.peakLevel;
  if (ticks > 0) {
    exposure.pendingTicks += ticks;
    exposure.pendingPressureTicksQ += pressureQ * ticks;
    exposure.pendingQualityPressureTicksQ += Math.floor(pressureQ * qualityQ / ENVIRONMENT_PRESSURE_Q_SCALE) * ticks;
    if (isPeak) exposure.pendingPeakTicks += ticks;
  }
  exposure.sampledThroughTick = throughTick;
  exposure.currentLevel = normalizeProgressionInteger(options.currentLevel, exposure.currentLevel ?? '0');
  exposure.peakPressureQ = Math.max(exposure.peakPressureQ ?? 0, pressureQ);
  if (exposure.pendingTicks >= FLUSH_TICK_LIMIT || options.flush === true) flushEnvironmentExposure(exposure);
  return ticks > 0;
}

export function flushEnvironmentExposure(exposure) {
  if (!exposure || typeof exposure !== 'object') return exposure;
  if (exposure.pendingTicks > 0) {
    exposure.totalTicks = addProgressionIntegers(normalizeProgressionInteger(exposure.totalTicks, '0'), String(exposure.pendingTicks));
    exposure.pressureTicksQ = addProgressionIntegers(
      normalizeProgressionInteger(exposure.pressureTicksQ, '0'), String(Math.max(0, Math.floor(exposure.pendingPressureTicksQ))),
    );
    exposure.qualityPressureTicksQ = addProgressionIntegers(
      normalizeProgressionInteger(exposure.qualityPressureTicksQ, '0'), String(Math.max(0, Math.floor(exposure.pendingQualityPressureTicksQ))),
    );
    exposure.timeAtPeakTicks = addProgressionIntegers(
      normalizeProgressionInteger(exposure.timeAtPeakTicks, '0'), String(Math.max(0, Math.floor(exposure.pendingPeakTicks))),
    );
  }
  exposure.pendingTicks = 0;
  exposure.pendingPressureTicksQ = 0;
  exposure.pendingQualityPressureTicksQ = 0;
  exposure.pendingPeakTicks = 0;
  return exposure;
}

/** Immutable JSON-safe record; callers should flush first when an exact terminal is required. */
export function environmentExposureSummary(exposure) {
  const value = exposure && typeof exposure === 'object' ? exposure : createEnvironmentExposure();
  return Object.freeze({
    version: ENVIRONMENT_EXPOSURE_VERSION,
    totalTicks: normalizeProgressionInteger(value.totalTicks, '0'),
    pressureTicksQ: normalizeProgressionInteger(value.pressureTicksQ, '0'),
    qualityPressureTicksQ: normalizeProgressionInteger(value.qualityPressureTicksQ, '0'),
    timeAtPeakTicks: normalizeProgressionInteger(value.timeAtPeakTicks, '0'),
    peakPressureQ: Math.max(0, Math.min(ENVIRONMENT_PRESSURE_Q_SCALE, Math.floor(value.peakPressureQ ?? 0))),
    currentLevel: normalizeProgressionInteger(value.currentLevel, '0'),
  });
}

export function pressureQFor(value) {
  return Math.max(0, Math.min(ENVIRONMENT_PRESSURE_Q_SCALE,
    Math.round((Number.isFinite(value) ? value : 0) * ENVIRONMENT_PRESSURE_Q_SCALE)));
}

function qualityQFor(value) {
  return Math.max(0, Math.min(ENVIRONMENT_PRESSURE_Q_SCALE,
    Math.round((Number.isFinite(value) ? value : 0) * ENVIRONMENT_PRESSURE_Q_SCALE)));
}
function finiteTick(value, fallback) {
  return Number.isSafeInteger(value) && value >= 0
    ? value
    : (Number.isSafeInteger(fallback) && fallback >= 0 ? fallback : 0);
}
