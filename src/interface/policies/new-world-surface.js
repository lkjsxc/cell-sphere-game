/** Designed in-run abandonment confirmation; authority remains in RunDriver. */
export function createNewWorldSurface(options) {
  const surface = byId('new-world-dialog'); const confirm = /** @type {HTMLButtonElement} */ (byId('new-world-confirm'));
  byId('new-world-close').addEventListener('click', options.onClose);
  byId('new-world-keep').addEventListener('click', options.onClose);
  confirm.addEventListener('click', () => { if (!confirm.disabled) options.onConfirm(); });
  return {
    surface,
    open(snapshot) {
      const tick = snapshot?.tick ?? 0; const metrics = snapshot?.metrics ?? {};
      byId('new-world-stats').replaceChildren(...rows([
        ['Elapsed', gameTime(tick)], ['Current score', number(metrics.score ?? 0)],
        ['Living cells', number(metrics.aliveCount ?? 0)],
      ]));
      confirm.disabled = false; confirm.textContent = 'Start next world'; surface.hidden = false;
    },
    pending() { confirm.disabled = true; confirm.textContent = 'Leaving world…'; },
    close() { surface.hidden = true; confirm.disabled = false; },
  };
}
function rows(values) { return values.flatMap(([label, value]) => { const dt = document.createElement('dt'); dt.textContent = label;
  const dd = document.createElement('dd'); dd.textContent = value; return [dt, dd]; }); }
function gameTime(tick) { const seconds = Math.floor(tick / 10); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function number(value) { return new Intl.NumberFormat('en').format(Math.round(value)); }
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
