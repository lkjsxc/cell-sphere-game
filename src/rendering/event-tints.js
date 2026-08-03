/** Event kind -> tint color shared by WebGL and Canvas cell materials. */
export const EVENT_TINTS = Object.freeze({
  drought: [0.85, 0.62, 0.30],
  heat: [1.0, 0.42, 0.28],
  freeze: [0.55, 0.75, 1.0],
  'toxic-rain': [0.62, 0.85, 0.35],
  'solar-flare': [1.0, 0.92, 0.6],
  ash: [0.55, 0.5, 0.48],
  bloom: [0.45, 1.0, 0.6],
  blight: [0.85, 0.45, 0.75],
});
export const EVENT_TINT_LIST = Object.freeze(Object.values(EVENT_TINTS));
