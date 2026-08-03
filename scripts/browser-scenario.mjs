/** Real-Chrome passive-world acceptance scenario shared by the file harness. */
import { assertDockGeometry, assertSkillGeometry, captureTitleEvidence } from './browser-evidence.mjs'; export async function runScenario(t) {
  const { evaluate, screenshot, drag, click, wait, poll, setViewport, errors } = t;
  const boot = await evaluate('window.__IN_BOOT__'); ok(boot?.playable && boot?.renderer, 'app did not boot');
  const render = await evaluate(`new Promise(resolve => { const app=window.__IN_APP__, original=app.renderer.render.bind(app.renderer), samples=[];
    app.renderer.render=(scene)=>{const start=performance.now(); original(scene); samples.push(performance.now()-start)};
    setTimeout(()=>{app.renderer.render=original; samples.sort((a,b)=>a-b); resolve({draws:app.renderer.drawCalls,p95:samples[Math.floor(samples.length*.95)]||0,mean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length)});},1200); })`);
  ok(render.draws === 4 && render.p95 < 20, 'renderer draw/time budget regressed');
  const signalCopy = await evaluate("document.body.innerText.includes('Signal')");
  ok(!signalCopy, 'obsolete run guidance remains visible');
  const idleAfter = await captureTitleEvidence(t); await drag([150, 350], [230, 420]);
  const dragged = await evaluate('window.__IN_APP__.camera.direction.slice()');
  ok(distance(idleAfter, dragged) > 0.05, 'free orbit did not change camera');
  await click(195, 350); await wait(250);
  ok(await evaluate("!document.getElementById('cell-inspector').hidden"), 'title tap did not open inspector');
  await evaluate(`(() => { const mark=window.__IN_APP__.fields.landmarks.find(item=>item.kind===2); if(mark) window.__IN_APP__.selectCell(mark.cell); })()`);
  await screenshot('browser-inspector-mobile.png');
  for (const [width, height, name] of [[430,932,'browser-inspector-430.png'],[768,1024,'browser-inspector-tablet.png'],[1440,900,'browser-inspector-desktop.png']]) {
    await setViewport(width, height); if(width > 900) await evaluate('window.__IN_APP__.camera.dist=4.2'); await wait(180); const bounds=await evaluate(`(() => { const r=document.getElementById('cell-inspector').getBoundingClientRect(); return {left:r.left,top:r.top,width:r.width,height:r.height}; })()`);
    ok(width < 900 ? bounds.top >= height * .58 : bounds.left < width * .35 && bounds.width <= width * .34, `inspector placement at ${width}x${height}`); await screenshot(name);
  }
  await setViewport(390,844); await evaluate('window.__IN_APP__.camera.dist=6'); await wait(150); await evaluate("document.getElementById('inspector-close').click()");
  await evaluate("document.querySelector('.settings-open').click()"); await screenshot('browser-settings-mobile.png');
  await evaluate("document.querySelector('.settings-open').click()");
  ok(await evaluate("document.getElementById('settings-dialog').hidden"), 'same Settings trigger did not close its surface');
  await evaluate("document.querySelector('.settings-open').click(); document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))");
  ok(await evaluate("document.getElementById('settings-dialog').hidden"), 'Escape did not close Settings');
  await evaluate("document.querySelector('.settings-open').click()"); await click(190, 120); await wait(80);
  ok(await evaluate("document.getElementById('settings-dialog').hidden && document.getElementById('cell-inspector').hidden"), 'outside dismissal leaked to globe selection');
  await evaluate("document.querySelector('.settings-open').click()"); await setViewport(1440,900); await evaluate('window.__IN_APP__.camera.dist=4.1'); await wait(180); await screenshot('browser-settings-desktop.png'); await setViewport(390,844); await evaluate('window.__IN_APP__.camera.dist=6'); await wait(150);
  await evaluate(`(() => { const input=document.querySelector('[name=idleRotation]'); input.value='gentle';
    input.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('settings-close').click(); })()`);
  const rotateBefore = await evaluate('window.__IN_APP__.camera.direction.slice()'); await wait(5500);
  const rotateAfter = await evaluate('window.__IN_APP__.camera.direction.slice()');
  const rotationState = await evaluate(`({overlay:window.__IN_APP__.overlay,setting:window.__IN_APP__.settings.idleRotation,
    hidden:document.hidden,selected:window.__IN_APP__.selectedNode,state:window.__IN_APP__.state})`);
  ok(distance(rotateBefore, rotateAfter) > 0.012, `enabled idle auto-rotation did not move: ${JSON.stringify(rotationState)}`);
  await evaluate(`(() => { document.querySelector('.settings-open').click(); const rotation=document.querySelector('[name=idleRotation]');
    rotation.value='off'; rotation.dispatchEvent(new Event('change',{bubbles:true})); const choices=document.querySelector('[name=adaptationMode]');
    choices.value='manual'; choices.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('settings-close').click(); })()`);
  await evaluate(`(() => { const speed=document.getElementById('speed-select'); speed.value='32';
    speed.dispatchEvent(new Event('change')); document.getElementById('begin-button').click(); })()`);
  const started = performance.now(); let presentationPause = 0; let effectPauseStart = 0;
  ok(await poll(() => evaluate('window.__IN_APP__.pendingCount()'), (value) => value >= 1, 10000), 'manual offer never queued');
  const pendingTick = await evaluate('window.__IN_APP__.snapshot.tick'); await screenshot('browser-run-mobile.png'); await assertDockGeometry(t);
  await setViewport(1440, 900); await evaluate('window.__IN_APP__.camera.dist=4.1'); await wait(200); await screenshot('browser-run-desktop.png');
  await setViewport(390, 844); await evaluate('window.__IN_APP__.camera.dist=6'); await wait(200);
  await evaluate("document.getElementById('new-world-button').click()"); effectPauseStart = performance.now(); const confirmTick = await evaluate('window.__IN_APP__.snapshot.tick'); await wait(300);
  ok(await evaluate(`window.__IN_APP__.snapshot.tick===${confirmTick} && !document.getElementById('new-world-dialog').hidden`), 'New World confirmation did not own its pause');
  await screenshot('browser-new-world-mobile.png'); await evaluate("document.getElementById('new-world-keep').click()"); presentationPause += performance.now() - effectPauseStart; await wait(300);
  ok(await evaluate(`window.__IN_APP__.snapshot.tick>${confirmTick}`), 'Keep watching did not restore prior running state');
  await evaluate("document.getElementById('adaptations-button').click()"); await wait(650);
  const panelTick = await evaluate('window.__IN_APP__.snapshot.tick');
  ok(panelTick > pendingTick, 'Adaptations panel stopped world time');
  ok(await evaluate("document.getElementById('adaptation-manual').getAttribute('aria-pressed')==='true'"), 'Adaptations surface did not reflect Manual mode');
  await screenshot('browser-adaptations-mobile.png');
  await setViewport(1440,900); await evaluate('window.__IN_APP__.camera.dist=4.1'); await wait(180); await screenshot('browser-adaptations-desktop.png');
  await setViewport(390,844); await evaluate('window.__IN_APP__.camera.dist=6'); await wait(150); await evaluate("document.getElementById('adaptations-close').click()");
  ok(await evaluate("window.__IN_APP__.offers.some(offer=>offer.id===0&&offer.resolvedTick==null)"), 'closing Adaptations discarded the offer');
  await evaluate(`(() => { document.getElementById('adaptations-button').click(); document.querySelector('#adaptation-cards .card').click();
    document.getElementById('adaptations-close').click(); })()`);
  ok(await poll(() => evaluate('window.__IN_APP__.adaptationEffects.queueLength'), (value) => value === 1, 2000), 'Adaptation wave did not start');
  await evaluate("document.getElementById('pause-button').click()"); effectPauseStart = performance.now();
  const waveStart = await evaluate(`(() => { const app=window.__IN_APP__, wave=app.adaptationEffects.frame(performance.now());
    return {caption:document.getElementById('adaptation-caption').textContent,hidden:document.getElementById('adaptation-caption').hidden,
      draws:app.renderer.drawCalls,queue:app.adaptationEffects.queueLength,bytes:app.adaptationEffects.retainedBytes,
      reduced:wave?.reduced,progress:wave?.progress,affected:wave?.affectedCount,
      min:wave?.minArrival,median:wave?.medianArrival,max:wave?.maxArrival}; })()`);
  ok(!waveStart.hidden && waveStart.caption.length > 20 && waveStart.draws === 4 && waveStart.queue <= 2
    && waveStart.bytes <= 10248 && waveStart.reduced === false && waveStart.affected > 0
    && waveStart.min === 0 && waveStart.median <= waveStart.max, 'full-motion Adaptation presentation contract failed');
  await screenshot('browser-adaptation-wave-start.png');
  ok(await poll(() => evaluate('window.__IN_APP__.adaptationEffects.frame(performance.now())?.progress'),
    (value) => value > 0.35 && value < 0.85, 1400), 'Adaptation wave never reached its midpoint');
  await screenshot('browser-adaptation-wave-mid.png');
  ok(await poll(() => evaluate('window.__IN_APP__.adaptationEffects.frame(performance.now())?.progress'),
    (value) => value > 0.72 && value < 1, 1400), 'Adaptation wave did not advance by uniform time');
  await screenshot('browser-adaptation-wave-end.png'); await wait(600);
  ok(await evaluate('window.__IN_APP__.adaptationEffects.frame(performance.now()) === null'), 'Adaptation wave timeout did not clear');
  await evaluate("document.getElementById('pause-button').click()"); presentationPause += performance.now() - effectPauseStart;
  ok(await poll(() => evaluate('window.__IN_APP__.pendingCount()'), (value) => value >= 1, 4000), 'second manual offer never queued');
  await evaluate(`(() => { document.querySelector('#run-screen .settings-open').click(); const motion=document.querySelector('[name=motion]');
    motion.value='reduced'; motion.dispatchEvent(new Event('change',{bubbles:true})); document.getElementById('settings-close').click();
    document.getElementById('adaptations-button').click(); document.querySelector('#adaptation-cards .card').click(); document.getElementById('adaptations-close').click();
    document.getElementById('pause-button').click(); })()`); effectPauseStart = performance.now();
  const reduced = await evaluate(`new Promise(resolve => { const end=performance.now()+2000; function read() {
    const effects=window.__IN_APP__.adaptationEffects, wave=effects.frame(performance.now());
    if(wave) return resolve({reduced:wave.reduced,origin:wave.arrivals[wave.originCell],queue:effects.queueLength});
    if(performance.now()>=end) return resolve(null); setTimeout(read,20); } read(); })`);
  ok(reduced?.reduced && reduced.origin === 0 && reduced.queue <= 2, 'reduced motion did not use static origin emphasis');
  await screenshot('browser-adaptation-reduced.png'); await wait(430);
  ok(await evaluate('window.__IN_APP__.adaptationEffects.queueLength') === 0, 'reduced emphasis exceeded its timeout');
  await evaluate(`(() => { document.getElementById('pause-button').click(); document.getElementById('adaptations-button').click();
    document.getElementById('adaptation-auto').click(); document.getElementById('adaptations-close').click(); })()`);
  presentationPause += performance.now() - effectPauseStart;
  ok(await poll(() => evaluate('window.__IN_APP__.settings.adaptationMode'), (mode) => mode === 'random', 2000), 'direct Auto Random switch did not synchronize');

  await evaluate("document.querySelector('#run-screen .history-open').click()"); const historyTick = await evaluate('window.__IN_APP__.snapshot.tick');
  await wait(500); ok(await evaluate('window.__IN_APP__.snapshot.tick') > historyTick, 'History stopped world time');
  await evaluate("document.getElementById('pause-button').click()"); effectPauseStart = performance.now();
  const historySize = await evaluate(`(() => { const r=document.getElementById('history-dialog').getBoundingClientRect();
    return {height:r.height,viewport:innerHeight,backdrop:Boolean(document.querySelector('.modal-backdrop,[role=dialog]'))}; })()`);
  ok(historySize.height <= historySize.viewport * .42 + 1 && !historySize.backdrop, 'History is blocking or exceeds mobile sheet bound');
  await evaluate(`(() => { const range=document.getElementById('history-range'); range.value=String(Math.floor(Number(range.max)/2));
    range.dispatchEvent(new Event('input',{bubbles:true})); })()`); await wait(120);
  const scrubState = await evaluate(`(() => { const app=window.__IN_APP__,s=app.historySnapshot; return {valid:Boolean(s?.approximate&&s.lifeState.length===2562
    && !('edgeActive' in s)&&!('conductance' in s)&&!('flux' in s)),has:Boolean(s),overlay:app.overlay,world:app.historyUi.worldId,
    recent:app.currentHistory.length,tick:app.snapshot?.tick,errors:window.__IN_ERRORS__??[]}; })()`);
  ok(scrubState.valid, `scrub did not project a cell-only checkpoint: ${JSON.stringify(scrubState)}`);
  await evaluate(`(() => { const previous=document.getElementById('history-prev'); for(let i=0;i<20&&!window.__IN_APP__.historyHighlights.length;i++) previous.click(); })()`);
  await screenshot('browser-history-scrub-mobile.png'); ok(await evaluate('window.__IN_APP__.historyHighlights.length > 0'), 'event navigation did not highlight primary cells');
  await screenshot('browser-history-event-mobile.png'); await evaluate("document.getElementById('history-next').click(); document.getElementById('history-live').click()");
  ok(await evaluate('window.__IN_APP__.historySnapshot===null && window.__IN_APP__.visualSeed===window.__IN_APP__.runSeed'), 'Live did not restore authoritative presentation');
  await screenshot('browser-history-mobile.png'); await setViewport(1440,900); await evaluate('window.__IN_APP__.camera.dist=4.1'); await wait(180); await screenshot('browser-history-desktop.png');
  await setViewport(390,844); await evaluate('window.__IN_APP__.camera.dist=6'); await wait(150);
  await evaluate("document.getElementById('history-close').click(); document.getElementById('pause-button').click()"); presentationPause += performance.now() - effectPauseStart;

  ok(await poll(() => evaluate("document.getElementById('result-screen').hidden"), (hidden) => hidden === false, 40000),
    '32x run did not reach extinction');
  const elapsed = (performance.now() - started - presentationPause) / 1000; const result = await evaluate(`({
    score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),
    imprint:document.getElementById('result-imprint').textContent })`);
  ok(result.score > 0 && result.imprint.includes('Imprint preserved'), 'result was incomplete');
  ok(await evaluate(`window.__IN_APP__.adaptationEffects.queueLength===0
    && window.__IN_APP__.adaptationEffects.retainedBytes===0
    && document.getElementById('adaptation-caption').hidden`), 'result retained Adaptation presentation state');
  await screenshot('browser-result-mobile.png'); await setViewport(1440,900); await evaluate('window.__IN_APP__.camera.dist=4.1'); await wait(180); await screenshot('browser-result-desktop.png');
  await setViewport(390,844); await evaluate('window.__IN_APP__.camera.dist=6'); await wait(150); await evaluate("document.getElementById('result-history-button').click()"); await screenshot('browser-result-history-mobile.png');
  await evaluate("document.getElementById('history-close').click(); document.getElementById('memory-button').click()"); await wait(300);
  const atlas = await evaluate(`(() => { const app=window.__IN_APP__, snap=app.memorySnapshot; return {
    nodes:snap.nodeStates.length,cells:snap.memoryStatus.length,level:app.topo.levels,frontier:snap.nodeStates.filter(n=>n.reachable).length,
    paths:'links' in snap.memoryScene,draws:app.renderer.drawCalls}; })()`);
  ok(atlas.nodes === 108 && atlas.cells === 642 && atlas.level === 3, 'Memory did not reconfigure to the level-3 atlas');
  ok(atlas.frontier === 6 && !atlas.paths && atlas.draws === 4, 'early frontier or direct-cell rendering regressed');
  const before = await evaluate('window.__IN_APP__.meta.echoBalance');
  const nodeId = await evaluate(`window.__IN_APP__.memorySnapshot.nodeStates.find(n=>n.reachable&&n.affordable)?.id`);
  ok(nodeId, 'no affordable Memory node'); await evaluate(`window.__IN_APP__.selectMemoryNode(${JSON.stringify(nodeId)})`);
  ok(await evaluate("!document.getElementById('memory-node-panel').hidden"), 'node selection did not open details');
  const mobilePanel = await evaluate(`(() => { const r=document.getElementById('memory-node-panel').getBoundingClientRect();
    return {top:r.top,left:r.left,width:r.width,height:r.height,viewport:innerHeight}; })()`);
  ok(mobilePanel.top > mobilePanel.viewport * 0.32, 'mobile Evolution detail is not a safe bottom surface'); await assertSkillGeometry(t);
  const skillGeometry = await evaluate(`(() => { const panel=document.getElementById('memory-node-panel'),body=panel.querySelector('.surface-body'),footer=panel.querySelector('.surface-actions');
    body.scrollTop=body.scrollHeight; const last=document.querySelector('#memory-node-meta dd:last-of-type')?.getBoundingClientRect(),f=footer.getBoundingClientRect();
    const result={overlap:Boolean(last&&last.bottom>f.top+1),horizontal:panel.scrollWidth>panel.clientWidth,close:!document.getElementById('memory-node-close').getClientRects().length}; body.scrollTop=0; return result; })()`);
  ok(!skillGeometry.overlap && !skillGeometry.horizontal && !skillGeometry.close, 'mobile skill body/footer geometry overlaps');
  await screenshot('browser-memory-selected-mobile.png'); await evaluate("document.getElementById('memory-unlock').click()"); await wait(150);
  ok(await evaluate('window.__IN_APP__.meta.echoBalance') < before, 'Memory unlock did not spend Echoes');
  const purchased = await evaluate(`(() => { const app=window.__IN_APP__; for(let i=0;i<3;i++) { const node=app.memorySnapshot.nodeStates.find(n=>n.reachable&&n.affordable&&!n.owned);
    if(!node) break; app.selectMemoryNode(node.id); document.getElementById('memory-unlock').click(); } return app.meta.memoryNodes.length; })()`);
  ok(purchased >= 4, 'first extinction did not support several skill purchases'); await screenshot('browser-memory-purchased-mobile.png');
  ok(await evaluate(`!document.getElementById('memory-list-button') && !document.getElementById('memory-list-dialog')
    && document.getElementById('evolution-tree').getAttribute('role')==='tree'`), 'visible List remained or semantic skill tree is absent');

  await setViewport(1440, 900); await evaluate(`(() => { const app=window.__IN_APP__; app.camera.dist=3.75;
    app.selectMemoryNode(app.memorySnapshot.nodeStates.find(n=>n.owned)?.id); })()`); await wait(250);
  const desktopPanel = await evaluate(`(() => { const r=document.getElementById('memory-node-panel').getBoundingClientRect();
    return {left:r.left,right:r.right,width:r.width,viewport:innerWidth}; })()`);
  ok(desktopPanel.left < desktopPanel.viewport * 0.45 && desktopPanel.right < desktopPanel.viewport * 0.62,
    'desktop Evolution detail is not a safe left surface');
  const evolutionState = await evaluate(`({ distance: window.__IN_APP__.camera.dist,
    named: document.body.innerText.includes('Evolution Globe'), staleList: document.body.innerText.includes('Atlas list') })`);
  ok(evolutionState.distance <= 3.8 && evolutionState.named && !evolutionState.staleList,
    `Evolution Globe scale or terminology regressed: ${JSON.stringify(evolutionState)}`);
  await screenshot('browser-memory-desktop.png');
  await evaluate("document.getElementById('memory-node-close').click(); document.querySelector('#memory-screen .history-open').click()"); await wait(250);
  await evaluate("document.getElementById('history-close').click()"); ok(await evaluate('window.__IN_APP__.topo.levels===3 && window.__IN_APP__.memorySnapshot.memoryStatus.length===642'), 'History did not restore the Memory atlas');
  const ownedBeforeAuto = await evaluate('window.__IN_APP__.meta.memoryNodes.length'); await evaluate("document.getElementById('restart-button').click()");
  ok(await poll(() => evaluate("document.getElementById('result-screen').hidden"), (hidden) => hidden === false, 40000), 'second unattended run did not finish');
  ok(await poll(() => evaluate('window.__IN_APP__.state'), (state) => state === 'running', 14000), 'result countdown did not start the next world');
  ok(await evaluate(`window.__IN_APP__.meta.runs>=2 && window.__IN_APP__.meta.memoryNodes.length===${ownedBeforeAuto}`), 'automatic continuation duplicated or spent progression');
  await screenshot('browser-auto-next-desktop.png'); await evaluate('location.reload()'); await wait(3000);
  const persisted = await evaluate(`(() => { const meta=JSON.parse(localStorage.getItem('incremental-network-game:meta:v1'));
    const history=JSON.parse(localStorage.getItem('incremental-network-game:history:v2')); return {nodes:meta.memoryNodes.length,worlds:history.worlds.length}; })()`);
  ok(persisted.nodes >= 4 && persisted.worlds >= 2, 'Memory or semantic History did not persist');
  const idb = await evaluate('window.__IN_APP__.historyPlayback.recentRuns.ready()');
  if (idb) { await evaluate("document.querySelector('#title-screen .history-open').click()");
    ok(await poll(() => evaluate("document.getElementById('history-visual-note').hidden"), Boolean, 4000), 'IndexedDB visual History did not reload');
    await evaluate(`(() => { const range=document.getElementById('history-range'); range.value=String(Math.floor(Number(range.max)/2));
      range.dispatchEvent(new Event('input',{bubbles:true})); })()`); await wait(120);
    ok(await evaluate('window.__IN_APP__.historySnapshot?.approximate===true'), 'reloaded visual History did not scrub');
    await evaluate("document.getElementById('history-close').click()"); }
  await screenshot('browser-title-desktop.png');
  await setViewport(390,844); await evaluate("document.getElementById('begin-button').click()");
  ok(await poll(() => evaluate('window.__IN_APP__.state'), (state) => state === 'running', 5000), 'isolated abort world did not start');
  const beforeAbort = await evaluate(`(() => { const a=window.__IN_APP__; return {runId:a.activeRunId,seed:a.runSeed,runs:a.meta.runs,
    echoes:a.meta.echoBalance,best:a.meta.bestScore,cursor:a.meta.worldSeedIndex}; })()`);
  await evaluate("document.getElementById('new-world-button').click(); document.getElementById('new-world-confirm').click()");
  ok(await poll(() => evaluate('window.__IN_APP__.activeRunId'), (id) => id > beforeAbort.runId, 5000), 'authoritative abort did not start exactly one next run');
  const afterAbort = await evaluate(`(() => { const a=window.__IN_APP__,last=a.archive.worlds.at(-1); return {runId:a.activeRunId,seed:a.runSeed,
    runs:a.meta.runs,echoes:a.meta.echoBalance,best:a.meta.bestScore,cursor:a.meta.worldSeedIndex,cause:last?.cause,
    abandoned:last?.events?.some(e=>e.key==='run.abandoned')}; })()`);
  ok(afterAbort.runId === beforeAbort.runId + 1 && afterAbort.seed !== beforeAbort.seed && afterAbort.runs === beforeAbort.runs
    && afterAbort.echoes === beforeAbort.echoes && afterAbort.best === beforeAbort.best && afterAbort.cursor === beforeAbort.cursor + 1
    && afterAbort.cause === 'abandoned' && afterAbort.abandoned, `abort transaction failed: ${JSON.stringify({beforeAbort,afterAbort})}`);
  await screenshot('browser-new-world-accepted-mobile.png'); ok(errors.length === 0, `browser reported ${errors.length} errors`);
  return { backend: boot.renderer, score: result.score, elapsed, nodeId, render, idb };
}
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
