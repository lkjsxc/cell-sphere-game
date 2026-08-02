/** One-pointer globe manipulation with optional two-pointer pinch zoom. */
import { rotate, zoom } from '../rendering/camera.js';

export function bindGlobeInput(canvas, camera, options) {
  const pointers = new Map();
  let pinchDistance = 0;

  const down = (event) => {
    if (!options.canInteract()) return;
    options.onInterrupt?.();
    pointers.set(event.pointerId, {
      x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY,
      moved: 0, at: performance.now(),
    });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 2) pinchDistance = distance([...pointers.values()]);
  };

  const move = (event) => {
    const pointer = pointers.get(event.pointerId);
    if (!pointer) return;
    const dx = event.clientX - pointer.x; const dy = event.clientY - pointer.y;
    pointer.moved += Math.abs(dx) + Math.abs(dy);
    pointer.x = event.clientX; pointer.y = event.clientY;
    if (pointers.size === 1) rotate(camera, dx * 0.006, dy * 0.005);
    else if (pointers.size === 2) {
      const next = distance([...pointers.values()]);
      if (pinchDistance > 0 && next > 0) zoom(camera, pinchDistance / next);
      pinchDistance = next;
    }
  };

  const finish = (event) => {
    const pointer = pointers.get(event.pointerId);
    const wasPinching = pointers.size > 1;
    pointers.delete(event.pointerId);
    if (!pointer || wasPinching || !options.canInteract()) return;
    if (pointer.moved < 10 && performance.now() - pointer.at < 500) {
      options.onTap(event.clientX, event.clientY);
    }
  };

  const cancel = (event) => { pointers.delete(event.pointerId); pinchDistance = 0; };
  const wheel = (event) => {
    if (!options.canInteract()) return;
    event.preventDefault(); options.onInterrupt?.();
    zoom(camera, event.deltaY > 0 ? 1.08 : 0.93);
  };
  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', finish);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('wheel', wheel, { passive: false });
  return {
    isActive: () => pointers.size > 0,
    dispose() {
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', finish);
      canvas.removeEventListener('pointercancel', cancel);
      canvas.removeEventListener('wheel', wheel);
    },
  };
}

function distance(values) {
  return Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
}
