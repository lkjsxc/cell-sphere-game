/** One keyboard-complete selector for all presentation scenes. */
import { SCENES } from '../app-state.js';

export function createSceneSelector(options) {
  const root = document.getElementById('scene-selector');
  const tabs = [...root.querySelectorAll('[role="tab"][data-scene]')];
  const select = (scene, trusted = false) => {
    if (!SCENES.includes(scene)) return false;
    options.onSelect(scene, trusted); return true;
  };
  root.addEventListener('click', (event) => {
    const tab = event.target.closest?.('[role="tab"][data-scene]');
    if (tab) select(tab.dataset.scene, event.isTrusted);
  });
  root.addEventListener('keydown', (event) => {
    const current = tabs.indexOf(event.target); if (current < 0) return;
    let next = current;
    if (event.key === 'ArrowLeft') next = (current + tabs.length - 1) % tabs.length;
    else if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); tabs[next].focus(); select(tabs[next].dataset.scene, event.isTrusted);
  });
  return {
    root,
    update(scene) {
      for (const tab of tabs) {
        const selected = tab.dataset.scene === scene;
        tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      }
    },
    get order() { return tabs.map((tab) => tab.dataset.scene); },
  };
}
