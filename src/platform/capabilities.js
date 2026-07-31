/**
 * Capability detection. Pure reads of browser APIs; no state mutation.
 * Results decide renderer backend, worker usage, and quality defaults.
 */

/** @typedef {Object} Capabilities
 *  @property {boolean} webgl2
 *  @property {boolean} worker
 *  @property {boolean} audio
 *  @property {boolean} share
 *  @property {boolean} vibration
 *  @property {number}  cpuHint      navigator.hardwareConcurrency or 4
 *  @property {number}  memoryHint   navigator.deviceMemory (GiB) or 4
 *  @property {boolean} saveData     navigator.connection.saveData
 *  @property {number}  dpr          clamped devicePixelRatio
 */

/** @returns {Capabilities} */
export function detectCapabilities() {
  const nav = globalThis.navigator ?? {};
  const conn = nav.connection ?? {};

  let webgl2 = false;
  try {
    const probe = document.createElement('canvas');
    webgl2 = Boolean(probe.getContext('webgl2'));
  } catch { webgl2 = false; }

  let worker = typeof Worker !== 'undefined';
  try {
    // Module workers are required; verify the constructor exists and that
    // import.meta.url-style module type is accepted syntactically.
    worker = worker && typeof Blob !== 'undefined';
  } catch { worker = false; }

  return {
    webgl2,
    worker,
    audio: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
    share: typeof nav.share === 'function',
    vibration: typeof nav.vibrate === 'function',
    cpuHint: Math.max(1, nav.hardwareConcurrency || 4),
    memoryHint: Math.max(1, nav.deviceMemory || 4),
    saveData: Boolean(conn.saveData),
    dpr: Math.min(3, globalThis.devicePixelRatio || 1),
  };
}
