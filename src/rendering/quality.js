/**
 * Quality modes: conservative auto-selection from device hints plus an
 * adaptive governor with hysteresis. Simulation resolution never changes —
 * only DPR, frame cap, and particle density.
 */

const PROFILES = Object.freeze({
  eco: Object.freeze({ mode: 'eco', dprCap: 1.25, fpsCap: 30, particles: 0 }),
  balanced: Object.freeze({ mode: 'balanced', dprCap: 1.5, fpsCap: 60, particles: 1 }),
  luminous: Object.freeze({ mode: 'luminous', dprCap: 2.0, fpsCap: 60, particles: 2 }),
});

/**
 * Pick an initial profile from settings + capability hints.
 * @param {{quality: string}} settings
 * @param {import('../platform/capabilities.js').Capabilities} caps
 */
export function resolveQuality(settings, caps) {
  if (settings.quality !== 'auto' && PROFILES[settings.quality]) {
    return PROFILES[settings.quality];
  }
  let mode = 'balanced';
  if (caps.saveData || caps.memoryHint <= 2 || caps.cpuHint <= 4) mode = 'eco';
  else if (caps.dpr >= 2 && caps.memoryHint >= 8 && caps.cpuHint >= 8) mode = 'luminous';
  const smallScreen = typeof screen !== 'undefined'
    && Math.min(screen.width || 9999, screen.height || 9999) < 500;
  if (smallScreen && mode === 'luminous') mode = 'balanced';
  return PROFILES[mode];
}

/**
 * Frame-time governor: downshifts after sustained expensive frames,
 * upshifts only after long stable periods. No oscillation.
 */
export class QualityGovernor {
  /** @param {(profile: object) => void} onChange */
  constructor(onChange) {
    this.onChange = onChange;
    this.profile = PROFILES.balanced;
    this.badFrames = 0;
    this.goodFrames = 0;
    this.userLocked = false;
  }

  /** Call with the latest frame cost in ms. */
  sampleFrame(ms) {
    if (this.userLocked) return;
    if (ms > 22) {
      this.badFrames++;
      this.goodFrames = 0;
    } else if (ms < 13) {
      this.goodFrames++;
      this.badFrames = Math.max(0, this.badFrames - 2);
    } else {
      this.badFrames = Math.max(0, this.badFrames - 1);
      this.goodFrames = 0;
    }
    if (this.badFrames >= 60) {
      this.badFrames = 0;
      this.shift(-1);
    } else if (this.goodFrames >= 240) {
      this.goodFrames = 0;
      this.shift(1);
    }
  }

  shift(delta) {
    const order = ['eco', 'balanced', 'luminous'];
    const idx = order.indexOf(this.profile.mode);
    const next = PROFILES[order[Math.max(0, Math.min(2, idx + delta))]];
    if (next !== this.profile) {
      this.profile = next;
      this.onChange(next);
    }
  }

  /** User overrides stop automatic changes. */
  lock(profile) {
    this.userLocked = true;
    this.profile = profile;
    this.onChange(profile);
  }
}
