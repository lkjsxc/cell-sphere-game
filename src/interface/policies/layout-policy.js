/** Stable scene composition; transient surfaces never participate. */
export function safeLayout(width, height, state, insets = {}) {
  const w = Math.max(1, width); const h = Math.max(1, height);
  const left = inset(insets.left, w); const rightInset = inset(insets.right, w - left);
  const top = inset(insets.top, h); const bottomInset = inset(insets.bottom, h - top);
  const right = w - rightInset; const bottom = h - bottomInset;
  const usableWidth = Math.max(1, right - left); const usableHeight = Math.max(1, bottom - top);
  const aspect = usableWidth / usableHeight; const slack = smoothstep(.92, 1.72, aspect);
  const centerX = left + usableWidth * (.5 + .2 * slack);
  const portrait = 1 - smoothstep(.72, 1.05, aspect);
  const centerYRatio = state === 'result' ? .43 - .05 * portrait
    : state === 'memory' || state === 'evolution' || state === 'trophies' ? .48 - .1 * portrait
      : state === 'title' ? .5 - .08 * portrait : .48 - .05 * portrait;
  const centerY = top + usableHeight * centerYRatio;
  const open = smoothstep(.72, 1.5, aspect); const largeSphere = ['memory', 'evolution', 'trophies'].includes(state);
  const distance = largeSphere ? mix(5.5, 3.75, open) : mix(5.9, 4.2, open);
  return Object.freeze({
    rect: Object.freeze({ left, top, right, bottom, width: usableWidth, height: usableHeight }),
    offsetX: (centerX / w - .5) * 2, offsetY: (.5 - centerY / h) * 2, distance,
  });
}

export function applySafeLayout(camera, layout, preserveZoom = false) {
  camera.offsetX = layout.offsetX; camera.offsetY = layout.offsetY;
  if (!preserveZoom) camera.dist = layout.distance;
}
function inset(value, maximum) { return Math.min(maximum, Math.max(0, Number(value) || 0)); }
function smoothstep(a, b, value) { const x = Math.max(0, Math.min(1, (value - a) / (b - a))); return x * x * (3 - 2 * x); }
function mix(a, b, amount) { return a + (b - a) * amount; }
