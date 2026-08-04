/** Populate standard/developer speed controls from one validated session policy. */
import { runtimeSpeedOptions } from '../core/runtime-speed.js';

export function configureRuntimeSpeedControls(root = document, developerMode = false) {
  const speeds = runtimeSpeedOptions(developerMode);
  for (const select of root.querySelectorAll('[data-runtime-speed]')) {
    const selected = select.value; select.replaceChildren(...speeds.map((speed) => {
      const option = root.createElement('option'); option.value = String(speed); option.textContent = `${speed}×`; return option;
    }));
    if (speeds.includes(Number(selected))) select.value = selected;
  }
  const marker = root.getElementById?.('dev-mode-marker'); if (marker) marker.hidden = !developerMode;
  if (root.documentElement) root.documentElement.dataset.developerMode = String(developerMode);
  return speeds;
}
