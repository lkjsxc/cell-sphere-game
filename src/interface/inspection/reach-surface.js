/** Read-only projection of authoritative Reach transitions and conditions. */
export function createReachBalanceSurface(options) {
  const surface = byId('reach-balance-dialog'); const summary = byId('reach-balance-summary');
  const counts = byId('reach-balance-counts'); const gains = byId('reach-gains'); const losses = byId('reach-losses');
  const supports = byId('reach-supports'); const limits = byId('reach-limits'); const turning = byId('reach-turning-point');
  let model = null; let result = false; byId('reach-balance-close').addEventListener('click', options.onClose);
  function render() {
    if (!model) return; const net = model.net ?? model.gained - model.lost; const direction = net > 0 ? 'rising' : net < 0 ? 'falling' : 'steady';
    summary.textContent = result ? `Full run · ${model.gained} cells gained and ${model.lost} lost.`
      : `Reach is ${direction}. ${model.current} cells are living now; recent changes cover ${model.windowSeconds} game seconds.`;
    counts.replaceChildren(metric('+ Cells', model.gained, 'gain'), metric('− Cells', model.lost, 'loss'), metric('Net', signed(net), 'net'));
    factors(gains, model.positive, '+'); factors(losses, model.negative, '−');
    conditions(supports, model.positiveConditions); conditions(limits, model.negativeConditions);
    supports.closest('.reach-condition-group').hidden = result || !model.positiveConditions?.length;
    limits.closest('.reach-condition-group').hidden = result || !model.negativeConditions?.length;
    turning.hidden = !result || !model.turningPoint; turning.textContent = model.turningPoint
      ? `Strongest turning point · ${time(model.turningPoint.second)} · ${signed(model.turningPoint.net)} cells` : '';
  }
  function factors(root, values = [], sign) { const peak = Math.max(1, ...values.map((factor) => factor.count));
    root.replaceChildren(...values.slice(0, 5).map((factor) => { const row = document.createElement(factor.samples?.length ? 'button' : 'div');
      row.className = 'reach-factor'; if (factor.samples?.length) { row.type = 'button'; row.addEventListener('click', () => options.onSelect(factor.samples)); }
      row.append(label(factor.label), bar(factor.count / peak), label(`${sign}${factor.count}`)); return row; }));
    if (!values.length) root.replaceChildren(empty('No direct transitions in this interval.')); }
  function conditions(root, values = []) { root.replaceChildren(...values.map((item) => { const row = document.createElement('div'); row.className = 'reach-factor';
      row.append(label(item.label), bar(item.score), label(`${Math.round(item.score * 100)}%`)); return row; })); }
  return { surface, open(next, isResult = false) { model = next; result = isResult; render(); surface.hidden = false; },
    update(next) { if (!next || result) return; model = next; if (!surface.hidden) render(); }, close() { surface.hidden = true; } };
}
function metric(name, value, kind) { const node = document.createElement('div'); node.className = `reach-count reach-${kind}`;
  node.append(label(name), strong(String(value))); return node; }
function bar(amount) { const track = document.createElement('span'); track.className = 'reach-bar'; const fill = document.createElement('i');
  fill.style.setProperty('--reach-factor', String(Math.max(0, Math.min(1, amount)))); track.append(fill); return track; }
function label(text) { const node = document.createElement('span'); node.textContent = text; return node; }
function strong(text) { const node = document.createElement('strong'); node.textContent = text; return node; }
function empty(text) { const node = document.createElement('p'); node.className = 'panel-copy'; node.textContent = text; return node; }
function signed(value) { return `${value > 0 ? '+' : ''}${value}`; }
function time(seconds) { return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
function byId(id) { return document.getElementById(id); }
