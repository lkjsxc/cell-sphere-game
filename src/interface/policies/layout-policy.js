/** Compute camera placement from the actual unobscured canvas rectangle. */
export function safeLayout(width, height, state, surface = null) {
  const pad = 16; let left = 0; let top = 0; let right = width; let bottom = height;
  if (surface && surface.width > 0 && surface.height > 0) {
    if (surface.width < width * 0.5 && surface.left < width * 0.5) left = Math.min(right, surface.right + pad);
    else if (surface.top > height * 0.4) bottom = Math.max(top, surface.top - pad);
  } else if (state === 'title') {
    if (width >= 900) left = Math.min(width * 0.42, 440);
    else bottom = height * 0.62;
  } else if (state === 'result' || state === 'memory') bottom = height - Math.min(132, height * 0.2);
  const centerX = (left + right) / 2; const centerY = (top + bottom) / 2;
  const compact = width < 600; const tablet = width >= 600 && width < 900;
  const span = Math.max(1, Math.min(right - left, bottom - top));
  const base = state === 'memory' ? compact ? 5.5 : tablet ? 4.65 : 3.75
    : compact ? 5.9 : tablet ? 5.15 : 4.2;
  const fit = Math.max(0, (Math.min(width, height) - span) / Math.min(width, height));
  return Object.freeze({
    rect: Object.freeze({ left, top, right, bottom, width: right - left, height: bottom - top }),
    offsetX: (centerX / width - 0.5) * 2,
    offsetY: (0.5 - centerY / height) * 2,
    distance: state === 'memory' && !compact && !tablet ? Math.min(3.8, base + fit * 1.5)
      : Math.min(6.4, base + fit * 1.5),
  });
}

export function applySafeLayout(camera, layout, preserveZoom = false) {
  camera.offsetX = layout.offsetX; camera.offsetY = layout.offsetY;
  if (!preserveZoom) camera.dist = layout.distance;
}
