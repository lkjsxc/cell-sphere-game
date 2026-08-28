/** Pointer-only globe manipulation with forgiving tap/drag/pinch classification. */
import { rotate, zoom } from '../rendering/camera.js';

export function bindGlobeInput(canvas, camera, options) {
  const pointers = new Map(); let pinchDistance = 0; let pinched = false;

  const down = (event) => {
    if (!options.canInteract() || !isPrimaryPointer(event)) return;
    const now = performance.now();
    if (!pointers.size) { pinched = false; options.onDirectStart?.(now); }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY, travel: 0, at: now });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 2) { pinched = true; options.onDirectEnd?.(now, 'pinch');
      pinchDistance = distance([...pointers.values()]); }
  };

  const move = (event) => {
    const pointer = pointers.get(event.pointerId); if (!pointer) return;
    const dx = event.clientX - pointer.x; const dy = event.clientY - pointer.y;
    pointer.travel += Math.hypot(dx, dy); pointer.x = event.clientX; pointer.y = event.clientY;
    if (pointers.size === 1 && !pinched) {
      const dragX = dx * 0.006; const dragY = dy * 0.005;
      rotate(camera, dragX, dragY); options.onDirectDelta?.(dragX, dragY, performance.now());
    }
    else if (pointers.size >= 2) {
      pinched = true; const next = distance([...pointers.values()]);
      if (pinchDistance > 0 && next > 0) zoom(camera, pinchDistance / next);
      pinchDistance = next;
    }
  };

  const finish = (event) => {
    const pointer = pointers.get(event.pointerId); const invalidTap = pinched || pointers.size > 1;
    const now = performance.now(); const tap = isTapGesture(pointer, pointer ? now - pointer.at : Infinity, invalidTap);
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!pointers.size) pinchDistance = 0;
    options.onDirectEnd?.(now, invalidTap ? 'pinch' : tap ? 'tap' : 'drag');
    if (!pointer || !options.canInteract()) return;
    if (tap) options.onTap(event.clientX, event.clientY);
  };

  const cancel = (event) => {
    pointers.delete(event.pointerId); pinched = true; pinchDistance = 0;
    options.onDirectEnd?.(performance.now(), 'cancel');
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  const wheel = (event) => {
    if (!options.canInteract()) return;
    event.preventDefault(); options.onZoom?.(performance.now(), 'wheel'); zoom(camera, event.deltaY > 0 ? 1.08 : 0.93);
  };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('wheel', wheel, { passive: false });
  return { isActive: () => pointers.size > 0, dispose() {
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', finish); canvas.removeEventListener('pointercancel', cancel);
    canvas.removeEventListener('wheel', wheel);
  } };
}

export function isPrimaryPointer(event) { return event.pointerType !== 'mouse' || event.button === 0; }
export function isTapGesture(pointer, elapsed, pinched = false) { return !pinched && (pointer?.travel ?? Infinity) <= 12 && elapsed <= 520; }
function distance(values) { return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y); }
