/** Real-Chrome passive-world acceptance scenario shared by the file harness. */
export async function runScenario(t) {
  const { evaluate, screenshot, drag, click, wait, poll, setViewport, errors } = t;
  const boot = await evaluate('window.__IN_BOOT__'); ok(boot?.playable && boot?.renderer, 'app did not boot');
  const render = await evaluate(`new Promise(resolve => { const app=window.__IN_APP__, original=app.renderer.render.bind(app.renderer), samples=[];
    app.renderer.render=(scene)=>{const start=performance.now(); original(scene); samples.push(performance.now()-start)};
    setTimeout(()=>{app.renderer.render=original; samples.sort((a,b)=>a-b); resolve({draws:app.renderer.drawCalls,p95:samples[Math.floor(samples.length*.95)]||0,mean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length)});},1200); })`);
  ok([5, 7].includes(render.draws) && render.p95 < 20, 'renderer draw/time budget regressed');
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
  await evaluate("document.getElementById('adaptations-button').click(); document.querySelector('#adaptation-cards .card').click()");
  await wait(150); await evaluate(`(() => { document.getElementById('adaptations-close').click(); document.querySelector('#run-screen .settings-open').click();
    const choices=document.querySelector('[name=adaptationMode]'); choices.value='random'; choices.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('settings-close').click(); })()`);

  await evaluate("document.querySelector('#run-screen .history-open').click()"); const historyTick = await evaluate('window.__IN_APP__.snapshot.tick');
  await wait(500); ok(await evaluate('window.__IN_APP__.snapshot.tick') > historyTick, 'History stopped world time');
  await screenshot('browser-history-mobile.png');
  const location = await evaluate("Boolean(document.querySelector('#history-list .location-btn'))");
  if (location) { await evaluate("document.querySelector('#history-list .location-btn').click()"); await wait(200); }
  else await evaluate("document.getElementById('history-close').click()");

  ok(await poll(() => evaluate("document.getElementById('result-screen').hidden"), (hidden) => hidden === false, 40000),
    '32x run did not reach extinction');
  const elapsed = (performance.now() - started) / 1000; const result = await evaluate(`({
    score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),
    imprint:document.getElementById('result-imprint').textContent })`);
  ok(result.score > 0 && result.imprint.includes('Imprint preserved'), 'result was incomplete');
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
    const history=JSON.parse(localStorage.getItem('incremental-network-game:history:v1')); return {nodes:meta.memoryNodes.length,worlds:history.worlds.length}; })()`);
  ok(persisted.nodes >= 4 && persisted.worlds >= 1, 'Memory or History did not persist');
  await screenshot('browser-title-desktop.png'); ok(errors.length === 0, `browser reported ${errors.length} errors`);
  return { backend: boot.renderer, score: result.score, elapsed, nodeId, render };
}

function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
