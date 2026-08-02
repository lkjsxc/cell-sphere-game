/** Real-Chrome passive-world acceptance scenario shared by the file harness. */
export async function runScenario(t) {
  const { evaluate, screenshot, drag, click, wait, poll, setViewport, errors } = t;
  const boot = await evaluate('window.__IN_BOOT__'); ok(boot?.playable && boot?.renderer, 'app did not boot');
  const render = await evaluate(`new Promise(resolve => { const app=window.__IN_APP__, original=app.renderer.render.bind(app.renderer), samples=[];
    app.renderer.render=(scene)=>{const start=performance.now(); original(scene); samples.push(performance.now()-start)};
    setTimeout(()=>{app.renderer.render=original; samples.sort((a,b)=>a-b); resolve({draws:app.renderer.drawCalls,p95:samples[Math.floor(samples.length*.95)]||0,mean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length)});},1200); })`);
  ok(render.draws === 5 && render.p95 < 20, 'renderer draw/time budget regressed');
  const signalCopy = await evaluate("document.body.innerText.includes('Signal')");
  ok(!signalCopy, 'obsolete run guidance remains visible');

  const idleBefore = await evaluate('window.__IN_APP__.camera.direction.slice()'); await wait(650);
  const idleAfter = await evaluate('window.__IN_APP__.camera.direction.slice()');
  ok(distance(idleBefore, idleAfter) < 1e-8, 'globe rotated although default auto-rotation is off');
  await screenshot('browser-title-mobile.png'); await drag([150, 350], [230, 420]);
  const dragged = await evaluate('window.__IN_APP__.camera.direction.slice()');
  ok(distance(idleAfter, dragged) > 0.05, 'free orbit did not change camera');

  await click(195, 350); await wait(250);
  ok(await evaluate("!document.getElementById('cell-inspector').hidden"), 'title tap did not open inspector');
  await evaluate(`(() => { const mark=window.__IN_APP__.fields.landmarks.find(item=>item.kind===2); if(mark) window.__IN_APP__.selectCell(mark.cell); })()`);
  await screenshot('browser-inspector-mobile.png');
  await evaluate("document.getElementById('inspector-close').click()");

  await evaluate("document.querySelector('.settings-open').click()"); await screenshot('browser-settings-mobile.png');
  await evaluate(`(() => { const input=document.querySelector('[name=idleRotation]'); input.value='gentle';
    input.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('settings-close').click(); })()`);
  const rotateBefore = await evaluate('window.__IN_APP__.camera.direction.slice()'); await wait(5500);
  const rotateAfter = await evaluate('window.__IN_APP__.camera.direction.slice()');
  ok(distance(rotateBefore, rotateAfter) > 0.012, 'enabled idle auto-rotation did not move');
  await evaluate(`(() => { document.querySelector('.settings-open').click(); const rotation=document.querySelector('[name=idleRotation]');
    rotation.value='off'; rotation.dispatchEvent(new Event('change',{bubbles:true})); const choices=document.querySelector('[name=adaptationMode]');
    choices.value='manual'; choices.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('settings-close').click(); })()`);

  await evaluate(`(() => { const speed=document.getElementById('speed-select'); speed.value='32';
    speed.dispatchEvent(new Event('change')); document.getElementById('begin-button').click(); })()`);
  const started = performance.now();
  ok(await poll(() => evaluate('window.__IN_APP__.pendingCount()'), (value) => value >= 1, 10000), 'manual offer never queued');
  const pendingTick = await evaluate('window.__IN_APP__.snapshot.tick'); await screenshot('browser-run-mobile.png');
  await setViewport(1440, 900); await evaluate('window.__IN_APP__.camera.dist=4.1'); await wait(200); await screenshot('browser-run-desktop.png');
  await setViewport(390, 844); await evaluate('window.__IN_APP__.camera.dist=6'); await wait(200);
  await evaluate("document.getElementById('adaptations-button').click()"); await wait(650);
  const panelTick = await evaluate('window.__IN_APP__.snapshot.tick');
  ok(panelTick > pendingTick, 'Adaptations panel stopped world time'); await screenshot('browser-adaptations-mobile.png');
  await evaluate("document.getElementById('adaptations-close').click()");
  ok(await evaluate("window.__IN_APP__.offers.some(offer=>offer.id===0&&offer.resolvedTick==null)"), 'closing Adaptations discarded the offer');
  await evaluate(`(() => { document.getElementById('adaptations-button').click(); document.querySelector('#adaptation-cards .card').click();
    document.getElementById('adaptations-close').click(); })()`);
  ok(await poll(() => evaluate('window.__IN_APP__.adaptationEffects.queueLength'), (value) => value === 1, 2000), 'Adaptation wave did not start');
  const waveStart = await evaluate(`(() => { const app=window.__IN_APP__, wave=app.adaptationEffects.frame(performance.now());
    return {caption:document.getElementById('adaptation-caption').textContent,hidden:document.getElementById('adaptation-caption').hidden,
      draws:app.renderer.drawCalls,queue:app.adaptationEffects.queueLength,bytes:app.adaptationEffects.retainedBytes,
      reduced:wave?.reduced,progress:wave?.progress}; })()`);
  ok(!waveStart.hidden && waveStart.caption.length > 20 && waveStart.draws === 5 && waveStart.queue <= 2
    && waveStart.bytes <= 5124 && waveStart.reduced === false, 'full-motion Adaptation presentation contract failed');
  await screenshot('browser-adaptation-wave-start.png');
  ok(await poll(() => evaluate('window.__IN_APP__.adaptationEffects.frame(performance.now())?.progress'),
    (value) => value > 0.35 && value < 0.85, 1400), 'Adaptation wave never reached its midpoint');
  await screenshot('browser-adaptation-wave-mid.png');
  ok(await poll(() => evaluate('window.__IN_APP__.adaptationEffects.frame(performance.now())?.progress'),
    (value) => value > 0.72 && value < 1, 1400), 'Adaptation wave did not advance by uniform time');
  await screenshot('browser-adaptation-wave-end.png'); await wait(600);
  ok(await evaluate('window.__IN_APP__.adaptationEffects.frame(performance.now()) === null'), 'Adaptation wave timeout did not clear');

  ok(await poll(() => evaluate('window.__IN_APP__.pendingCount()'), (value) => value >= 1, 4000), 'second manual offer never queued');
  await evaluate(`(() => { document.querySelector('#run-screen .settings-open').click(); const motion=document.querySelector('[name=motion]');
    motion.value='reduced'; motion.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('settings-close').click();
    document.getElementById('adaptations-button').click(); document.querySelector('#adaptation-cards .card').click(); document.getElementById('adaptations-close').click(); })()`);
  const reduced = await evaluate(`new Promise(resolve => { const end=performance.now()+2000; function read() {
    const effects=window.__IN_APP__.adaptationEffects, wave=effects.frame(performance.now());
    if(wave) return resolve({reduced:wave.reduced,origin:wave.distances[wave.originCell],queue:effects.queueLength});
    if(performance.now()>=end) return resolve(null); setTimeout(read,20); } read(); })`);
  ok(reduced?.reduced && reduced.origin === 0 && reduced.queue <= 2, 'reduced motion did not use static origin emphasis');
  await screenshot('browser-adaptation-reduced.png'); await wait(260);
  ok(await evaluate('window.__IN_APP__.adaptationEffects.queueLength') === 0, 'reduced emphasis exceeded its timeout');
  await evaluate(`(() => { document.querySelector('#run-screen .settings-open').click(); const choices=document.querySelector('[name=adaptationMode]');
    choices.value='random'; choices.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('settings-close').click(); })()`);

  await evaluate("document.querySelector('#run-screen .history-open').click()"); const historyTick = await evaluate('window.__IN_APP__.snapshot.tick');
  await wait(500); ok(await evaluate('window.__IN_APP__.snapshot.tick') > historyTick, 'History stopped world time');
  const historySize = await evaluate(`(() => { const r=document.getElementById('history-dialog').getBoundingClientRect();
    return {height:r.height,viewport:innerHeight,backdrop:Boolean(document.querySelector('.modal-backdrop,[role=dialog]'))}; })()`);
  ok(historySize.height <= historySize.viewport * .42 + 1 && !historySize.backdrop, 'History is blocking or exceeds mobile sheet bound');
  await evaluate(`(() => { const range=document.getElementById('history-range'); range.value=String(Math.floor(Number(range.max)/2));
    range.dispatchEvent(new Event('input',{bubbles:true})); })()`); await wait(120);
  ok(await evaluate(`(() => { const s=window.__IN_APP__.historySnapshot; return s?.approximate && s.lifeState.length===2562
    && !('edgeActive' in s) && !('conductance' in s) && !('flux' in s); })()`), 'scrub did not project a cell-only checkpoint');
  await evaluate(`(() => { const previous=document.getElementById('history-prev'); for(let i=0;i<20&&!window.__IN_APP__.historyHighlights.length;i++) previous.click(); })()`);
  ok(await evaluate('window.__IN_APP__.historyHighlights.length > 0'), 'event navigation did not highlight primary cells');
  await evaluate("document.getElementById('history-next').click(); document.getElementById('history-live').click()");
  ok(await evaluate('window.__IN_APP__.historySnapshot===null && window.__IN_APP__.visualSeed===window.__IN_APP__.runSeed'), 'Live did not restore authoritative presentation');
  await screenshot('browser-history-mobile.png'); await evaluate("document.getElementById('history-close').click()");

  ok(await poll(() => evaluate("document.getElementById('result-screen').hidden"), (hidden) => hidden === false, 40000),
    '32x run did not reach extinction');
  const elapsed = (performance.now() - started) / 1000; const result = await evaluate(`({
    score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),
    imprint:document.getElementById('result-imprint').textContent })`);
  ok(result.score > 0 && result.imprint.includes('Imprint preserved'), 'result was incomplete');
  ok(await evaluate(`window.__IN_APP__.adaptationEffects.queueLength===0
    && window.__IN_APP__.adaptationEffects.retainedBytes===0
    && document.getElementById('adaptation-caption').hidden`), 'result retained Adaptation presentation state');
  await screenshot('browser-result-mobile.png');
  await evaluate("document.getElementById('result-history-button').click()"); await screenshot('browser-result-history-mobile.png');
  await evaluate("document.getElementById('history-close').click(); document.getElementById('memory-button').click()"); await wait(300);
  ok(await evaluate('window.__IN_APP__.memorySnapshot.nodeStates.length') === 108, 'Memory atlas is not 108 nodes');
  const before = await evaluate('window.__IN_APP__.meta.echoBalance');
  const nodeId = await evaluate(`window.__IN_APP__.memorySnapshot.nodeStates.find(n=>n.reachable&&n.affordable)?.id`);
  ok(nodeId, 'no affordable Memory node'); await evaluate(`window.__IN_APP__.selectMemoryNode(${JSON.stringify(nodeId)})`);
  ok(await evaluate("!document.getElementById('memory-node-panel').hidden"), 'node selection did not open details');
  await screenshot('browser-memory-selected-mobile.png'); await evaluate("document.getElementById('memory-unlock').click()"); await wait(150);
  ok(await evaluate('window.__IN_APP__.meta.echoBalance') < before, 'Memory unlock did not spend Echoes');
  const purchased = await evaluate(`(() => { const app=window.__IN_APP__; for(let i=0;i<3;i++) { const node=app.memorySnapshot.nodeStates.find(n=>n.reachable&&n.affordable&&!n.owned);
    if(!node) break; app.selectMemoryNode(node.id); document.getElementById('memory-unlock').click(); } return app.meta.memoryNodes.length; })()`);
  ok(purchased >= 4, 'first extinction did not support several Memory purchases'); await screenshot('browser-memory-purchased-mobile.png');
  await evaluate("document.getElementById('memory-list-button').click()");
  ok(await evaluate("document.querySelectorAll('#memory-list .memory-list-item').length") > 0, 'accessible Memory list is empty');
  await evaluate("document.getElementById('memory-list-close').click()");

  await setViewport(1440, 900); await evaluate('window.__IN_APP__.camera.dist=4.1'); await wait(250); await screenshot('browser-memory-desktop.png');
  await evaluate('location.reload()'); await wait(3000);
  const persisted = await evaluate(`(() => { const meta=JSON.parse(localStorage.getItem('incremental-network-game:meta:v1'));
    const history=JSON.parse(localStorage.getItem('incremental-network-game:history:v2')); return {nodes:meta.memoryNodes.length,worlds:history.worlds.length}; })()`);
  ok(persisted.nodes >= 4 && persisted.worlds >= 1, 'Memory or semantic History did not persist');
  const idb = await evaluate('window.__IN_APP__.historyPlayback.recentRuns.ready()');
  if (idb) { await evaluate("document.querySelector('#title-screen .history-open').click()");
    ok(await poll(() => evaluate("document.getElementById('history-visual-note').hidden"), Boolean, 4000), 'IndexedDB visual History did not reload');
    await evaluate(`(() => { const range=document.getElementById('history-range'); range.value=String(Math.floor(Number(range.max)/2));
      range.dispatchEvent(new Event('input',{bubbles:true})); })()`); await wait(120);
    ok(await evaluate('window.__IN_APP__.historySnapshot?.approximate===true'), 'reloaded visual History did not scrub');
    await evaluate("document.getElementById('history-close').click()"); }
  await screenshot('browser-title-desktop.png'); ok(errors.length === 0, `browser reported ${errors.length} errors`);
  return { backend: boot.renderer, score: result.score, elapsed, nodeId, render, idb };
}

function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
