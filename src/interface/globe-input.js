/** Pointer manipulation plus keyboard activation of the currently centered cell. */
import { rotate, zoom } from '../rendering/camera.js';

export function bindGlobeInput(canvas, camera, options) {
  const pointers = new Map(); let pinchDistance = 0; let pinched = false;

  const down = (event) => {
    if (!options.canInteract() || !isPrimaryPointer(event)) return;
    // A focusable canvas emits focusin after pointerdown. Focus it first so the
    // trusted-activity reset happens before release-velocity sampling begins.
    if (document.activeElement !== canvas) canvas.focus({ preventScroll: true });
    const observedNow = performance.now(); const inputNow = inputAnimationTime(event, observedNow);
    if (!pointers.size) { pinched = false; options.onDirectStart?.(inputNow); }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY,
      startX: event.clientX, startY: event.clientY, travel: 0, at: inputNow });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 2) { pinched = true; options.onDirectEnd?.(inputNow, 'pinch', observedNow);
      pinchDistance = distance([...pointers.values()]); }
  };

  const move = (event) => {
    const pointer = pointers.get(event.pointerId); if (!pointer) return;
    const dx = event.clientX - pointer.x; const dy = event.clientY - pointer.y;
    pointer.travel += Math.hypot(dx, dy); pointer.x = event.clientX; pointer.y = event.clientY;
    if (pointers.size === 1 && !pinched) {
      const dragX = dx * 0.006; const dragY = dy * 0.005;
      rotate(camera, dragX, dragY); options.onDirectDelta?.(dragX, dragY, inputAnimationTime(event));
    }
    else if (pointers.size >= 2) {
      pinched = true; const next = distance([...pointers.values()]);
      if (pinchDistance > 0 && next > 0) zoom(camera, pinchDistance / next);
      pinchDistance = next;
    }
  };

  const finish = (event) => {
    const pointer = pointers.get(event.pointerId); const invalidTap = pinched || pointers.size > 1;
    const observedNow = performance.now(); const inputNow = inputAnimationTime(event, observedNow);
    const tap = isTapGesture(pointer, pointer ? inputNow - pointer.at : Infinity, invalidTap);
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (!pointers.size) pinchDistance = 0;
    options.onDirectEnd?.(inputNow, invalidTap ? 'pinch' : tap ? 'tap' : 'drag', observedNow);
    if (!pointer || !options.canInteract()) return;
    if (tap) options.onTap(event.clientX, event.clientY);
  };

  const cancel = (event) => {
    pointers.delete(event.pointerId); pinched = true; pinchDistance = 0;
    const observedNow = performance.now();
    options.onDirectEnd?.(inputAnimationTime(event, observedNow), 'cancel', observedNow);
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  const wheel = (event) => {
    if (!options.canInteract()) return;
    event.preventDefault(); options.onZoom?.(performance.now(), 'wheel'); zoom(camera, event.deltaY > 0 ? 1.08 : 0.93);
  };
  const keydown = (event) => {
    if (!options.canInteract() || event.repeat || !['Enter', ' '].includes(event.key)) return;
    event.preventDefault(); options.onTap(...keyboardActivationPoint(canvas, camera));
  };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('wheel', wheel, { passive: false }); canvas.addEventListener('keydown', keydown);
  return { isActive: () => pointers.size > 0, dispose() {
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', finish); canvas.removeEventListener('pointercancel', cancel);
    canvas.removeEventListener('wheel', wheel); canvas.removeEventListener('keydown', keydown);
  } };
}

export function isPrimaryPointer(event) { return event.pointerType !== 'mouse' || event.button === 0; }
export function isTapGesture(pointer, elapsed, pinched = false) { return !pinched && (pointer?.travel ?? Infinity) <= 12 && elapsed <= 520; }
export function inputAnimationTime(event, observedNow = performance.now()) {
  const inputNow = Number(event?.timeStamp); const fallback = Number.isFinite(observedNow) ? Math.max(0, observedNow) : 0;
  // PointerEvent timestamps share performance.timeOrigin. Reject legacy epoch
  // timestamps while preserving queued input timing under a busy fallback loop.
  return Number.isFinite(inputNow) && inputNow > 0 && inputNow <= fallback + 1000 ? inputNow : fallback;
}
export function keyboardActivationPoint(canvas, camera) {
  const rect = canvas.getBoundingClientRect();
  return [rect.left + rect.width * (0.5 + camera.offsetX * 0.5),
    rect.top + rect.height * (0.5 - camera.offsetY * 0.5)];
}
function distance(values) { return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y); }
