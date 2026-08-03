/** Trusted-CDP production evidence for the unified shell vertical slice. */
export async function runScenario(t) {
  const { evaluate, wait, poll, errors, click, drag, screenshot, setViewport, key } = t;
  const boot = await evaluate('window.__IN_BOOT__'); ok(boot?.playable, 'app did not boot');
  const render = await evaluate(`new Promise(resolve=>{const a=window.__IN_APP__,r=a.renderer,base=r.render.bind(r),samples=[];
    r.render=s=>{const at=performance.now(),out=base(s);samples.push(performance.now()-at);return out};setTimeout(()=>{r.render=base;samples.sort((a,b)=>a-b);
    resolve({draws:r.drawCalls,p95:samples[Math.floor(samples.length*.95)]||0,mean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length)});},800)})`);
  ok(render.draws === 4, `renderer draw count ${render.draws}`);
  const initialSelector = await selectorEvidence(evaluate); selectorContract(initialSelector);
  await screenshot('shell-home-mobile.png'); await trustedId(t, 'begin-button');
  ok(await poll(() => evaluate('window.__IN_APP__.phase'), (phase) => phase === 'running', 5000), 'world did not start');
  await evaluate(`document.getElementById('speed-select').value='1';document.getElementById('speed-select').dispatchEvent(new Event('change'))`);

  const cameraBefore = await evaluate(`({camera:window.__IN_APP__.camera.direction.slice(),tick:window.__IN_APP__.snapshot.tick})`);
  await trustedId(t, 'scene-evolution'); await wait(300);
  ok(await evaluate(`window.__IN_APP__.scene==='evolution'&&window.__IN_APP__.phase==='running'&&window.__IN_APP__.memorySnapshot.nodeStates.length===642`), 'Evolution scene replaced authority');
  await trustedId(t, 'scene-world'); await wait(120);
  const restored = await evaluate(`({camera:window.__IN_APP__.camera.direction.slice(),tick:window.__IN_APP__.snapshot.tick,scene:window.__IN_APP__.scene})`);
  ok(restored.scene === 'world' && restored.tick > cameraBefore.tick && distance(restored.camera, cameraBefore.camera) < 1e-8,
    `World camera/authority did not restore exactly: ${JSON.stringify({ cameraBefore, restored })}`);
  await trustedId(t, 'scene-home'); await key('ArrowRight');
  ok(await poll(() => evaluate('window.__IN_APP__.scene'), (scene) => scene === 'world', 1000), 'scene selector ArrowRight failed');
  await key('End'); ok(await evaluate(`window.__IN_APP__.scene==='trophies'`), 'scene selector End failed');
  await key('Home'); ok(await evaluate(`window.__IN_APP__.scene==='home'`), 'scene selector Home failed');
  await key('ArrowRight'); ok(await evaluate(`window.__IN_APP__.scene==='world'`), 'scene selector did not return World');
  ok(sameRect(initialSelector.rect, (await selectorEvidence(evaluate)).rect, .2), 'selector moved across scenes');

  await setViewport(1440, 900); await wait(180); const metricRects = {};
  for (const kind of ['score', 'entropy', 'reach']) {
    await trustedId(t, `${kind}-button`); await wait(150); const first = await shellRect(evaluate);
    await wait(450); const second = await shellRect(evaluate); metricRects[kind] = second;
    ok(first.surface === 'metric' && sameRect(first, second, .25), `${kind} metric shell jittered`);
    const semantics = await evaluate(`(()=>{const b=document.getElementById('${kind}-button'),a=window.__IN_APP__;return {tag:b.tagName,h:b.getBoundingClientRect().height,expanded:b.getAttribute('aria-expanded'),controls:b.getAttribute('aria-controls'),overlay:a.overlay,active:a.surfaces.active,kind:a.metricUi.kind,hidden:document.getElementById('context-shell').hidden}})()`);
    ok(semantics.tag === 'BUTTON' && semantics.h >= 44 && semantics.expanded === 'true' && semantics.controls === 'metric-dialog', `${kind} semantics failed: ${JSON.stringify(semantics)}`);
    if (kind !== 'reach') await trustedId(t, `${kind}-button`);
  }
  ok(sameRect(metricRects.score, metricRects.entropy, .25) && sameRect(metricRects.score, metricRects.reach, .25), 'metric kinds changed outer geometry');
  await evaluate(`document.getElementById('metric-body').scrollTop=40`); const scrollBefore = await evaluate(`document.getElementById('metric-body').scrollTop`);
  await drag([940, 350], [1080, 430]); await wait(100);
  ok(await evaluate(`window.__IN_APP__.overlay==='metric'&&!document.getElementById('metric-dialog').hidden`), 'globe drag dismissed metric');
  ok(await evaluate(`document.getElementById('metric-body').scrollTop`) === scrollBefore, 'metric drag lost scroll state');
  await trustedId(t, 'metric-close');

  const responsive = [];
  for (const [width, height] of [[320, 568], [390, 844], [430, 932], [768, 1024], [844, 390], [1440, 900]]) {
    await setViewport(width, height); await wait(120); await trustedId(t, 'score-button'); await wait(60);
    const evidence = await layoutEvidence(evaluate); responsive.push({ width, height, ...evidence });
    ok(evidence.noOverflow && evidence.controlsBounded && evidence.selectorMin >= 44 && evidence.eventMin >= 44
      && !evidence.eventDockOverlap && !evidence.eventShellOverlap,
    `responsive shell failed ${width}x${height}: ${JSON.stringify(evidence)}`); await trustedId(t, 'metric-close');
  }
  await setViewport(390, 844); const accessibilityMatrix = await evaluate(`(()=>{const root=document.documentElement,tabs=[...document.querySelectorAll('#scene-selector [role=tab]')],labels=tabs.map(x=>x.firstChild.nodeValue);root.style.fontSize='32px';root.dataset.motion='reduced';root.dataset.contrast='high';tabs[2].firstChild.nodeValue='Evolution inherited adaptations';const rects=tabs.map(x=>x.getBoundingClientRect()),values={noOverflow:document.documentElement.scrollWidth<=innerWidth,labelsContained:tabs.every(x=>getComputedStyle(x).overflow==='hidden')&&rects.every((r,i)=>!i||r.left>=rects[i-1].right-1),motion:getComputedStyle(root).getPropertyValue('--dur-base').trim(),border:getComputedStyle(document.getElementById('scene-selector')).borderTopWidth};tabs.forEach((x,i)=>x.firstChild.nodeValue=labels[i]);root.style.fontSize='';root.dataset.motion='full';root.dataset.contrast='normal';return values})()`);
  ok(accessibilityMatrix.noOverflow && accessibilityMatrix.labelsContained && accessibilityMatrix.motion === '0ms' && accessibilityMatrix.border !== '0px', `accessibility matrix failed: ${JSON.stringify(accessibilityMatrix)}`);

  await setViewport(390, 844); await wait(140); await trustedId(t, 'menu-button');
  ok(await evaluate(`window.__IN_APP__.overlay==='menu'&&document.getElementById('menu-world-heading').textContent==='World'&&document.getElementById('menu-new-world').offsetHeight>=44`), 'Menu groups/actions missing');
  await evaluate(`(()=>{const s=document.querySelector('[name=adaptationMode]');s.value='manual';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  ok(await poll(() => evaluate('window.__IN_APP__.settings.adaptationMode'), (mode) => mode === 'manual', 2000), 'manual mode was not authoritative');
  await trustedId(t, 'menu-new-world');
  ok(await evaluate(`window.__IN_APP__.overlay==='new-world'&&!document.getElementById('new-world-dialog').hidden`), 'New World confirmation did not replace Menu');
  await wait(80); const tickBeforeConfirm = await evaluate('window.__IN_APP__.snapshot.tick'); await wait(220);
  ok(await evaluate(`window.__IN_APP__.snapshot.tick`) === tickBeforeConfirm, 'confirmation did not own its pause');
  await trustedId(t, 'new-world-keep'); ok(await poll(() => evaluate('window.__IN_APP__.snapshot.tick'), (tick) => tick > tickBeforeConfirm, 1500), 'Keep watching did not resume');

  const run32StartedAt = performance.now(); await evaluate(`(()=>{const s=document.getElementById('speed-select');s.value='32';s.dispatchEvent(new Event('change'))})()`);
  ok(await poll(() => evaluate('window.__IN_APP__.pendingCount()'), (count) => count > 0, 5000), 'manual Adaptation offer did not queue');
  await trustedId(t, 'adaptations-button'); await wait(120); const compact = await evaluate(`(()=>{const s=document.getElementById('context-shell').getBoundingClientRect(),e=document.getElementById('current-event-button').getBoundingClientRect();return {height:s.height,viewport:innerHeight,cards:[...document.querySelectorAll('#adaptation-cards .card')].map(x=>x.getBoundingClientRect().height),eventVisible:e.width>0&&e.bottom<=s.top+1}})()`);
  ok(compact.height <= compact.viewport * .37 && compact.cards.length === 3 && compact.cards.every((height) => height >= 44) && compact.eventVisible,
    `compact Adaptations failed: ${JSON.stringify(compact)}`); await screenshot('shell-adaptations-mobile.png'); await trustedId(t, 'adaptations-close');

  await setViewport(1440, 900); await wait(120); await trustedId(t, 'menu-button'); await trustedId(t, 'menu-history'); await wait(160);
  const history = await shellRect(evaluate); ok(history.surface === 'history' && history.left < 30 && history.width <= 520, 'History is not the desktop left shell');
  const historyCamera = await evaluate('window.__IN_APP__.camera.direction.slice()'); await drag([960, 360], [1080, 410]);
  ok(await evaluate(`window.__IN_APP__.overlay==='history'`), 'globe drag dismissed History');
  await trustedId(t, 'history-event-log'); ok(await evaluate(`window.__IN_APP__.overlay==='event-log'`), 'History did not route to Event Log');
  const rows = await evaluate(`document.querySelectorAll('#event-log-list .event-log-entry').length`); ok(rows <= 80, `Event Log DOM rows unbounded: ${rows}`);
  await drag([970, 360], [1090, 420]); ok(await evaluate(`window.__IN_APP__.overlay==='event-log'`), 'globe drag dismissed Event Log');
  await trustedId(t, 'event-log-close'); ok(distance(historyCamera, await evaluate('window.__IN_APP__.camera.direction.slice()')) > 0, 'globe drag did not rotate');

  ok(await poll(() => evaluate('window.__IN_APP__.phase'), (phase) => phase === 'result', 45000), '32x run did not finish');
  const elapsed = (performance.now() - run32StartedAt) / 1000; const result = await evaluate(`(()=>{const a=window.__IN_APP__,s=document.getElementById('context-shell');return {score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),scene:a.scene,phase:a.phase,overlay:a.overlay,surface:s.dataset.surface,runVisible:!document.getElementById('run-screen').hidden,resultControl:!document.getElementById('result-control').hidden,event:document.getElementById('current-event-button').offsetHeight,pause:document.getElementById('pause-button').disabled,speed:document.getElementById('speed-select').disabled,adapt:document.getElementById('adaptations-button').disabled,trophies:document.getElementById('result-trophies').textContent}})()`);
  ok(result.score > 0 && result.scene === 'world' && result.phase === 'result' && result.overlay === 'result' && result.surface === 'result'
    && result.runVisible && result.resultControl && result.event >= 44 && result.pause && result.speed && result.adapt
    && result.trophies.includes('First Extinction'), `terminal world failed: ${JSON.stringify(result)}`);
  await evaluate(`window.__IN_APP__.trophyNotifications.hold('browser-evidence',true)`); await screenshot('shell-result-desktop.png'); await trustedId(t, 'result-close'); ok(await evaluate(`document.getElementById('context-shell').hidden`), 'Result did not close');
  ok(await evaluate(`window.__IN_APP__.continuation.status==='cancelled'`), 'trusted Result interaction did not permanently cancel Auto Next');
  await trustedId(t, 'result-control'); await drag([800, 330], [930, 420]); const dragState = await evaluate(`({overlay:window.__IN_APP__.overlay,surface:window.__IN_APP__.surfaces.active,selected:window.__IN_APP__.selectedNode})`); ok(dragState.overlay === 'result', `globe drag dismissed Result: ${JSON.stringify(dragState)}`);
  await click(1000, 450); await wait(120); ok(await evaluate(`window.__IN_APP__.overlay==='inspector'&&document.activeElement===document.getElementById('inspector-heading')`), 'cell tap did not replace Result and focus Inspector');
  await trustedId(t, 'inspector-close'); await trustedId(t, 'result-control'); await trustedId(t, 'result-reach-button');
  const finalMetric = await shellRect(evaluate); ok(finalMetric.surface === 'metric' && sameRect(finalMetric, metricRects.reach, .25), 'final metric geometry changed');
  await trustedId(t, 'metric-close');

  const runIdentity = await evaluate('window.__IN_APP__.worldIdentity.resultTransactionKey'); await trustedId(t, 'scene-evolution'); await wait(160);
  const nodeId = await evaluate(`window.__IN_APP__.memorySnapshot.nodeStates.find(n=>n.reachable&&n.affordable&&!n.owned)?.id`); ok(nodeId, 'no adjacent affordable Skill Cell');
  const ownedBefore = await evaluate('window.__IN_APP__.meta.memoryNodes.length'); await evaluate(`window.__IN_APP__.selectMemoryNode(${JSON.stringify(nodeId)})`); await trustedId(t, 'memory-unlock');
  ok(await evaluate(`window.__IN_APP__.meta.memoryNodes.length`) === ownedBefore + 1, 'Skill unlock transaction failed');
  ok(await evaluate(`window.__IN_APP__.phase==='result'&&window.__IN_APP__.worldIdentity.resultTransactionKey===${JSON.stringify(runIdentity)}`), 'Evolution replaced terminal world authority');
  await trustedId(t, 'scene-trophies'); ok(await evaluate(`window.__IN_APP__.trophySnapshot.nodeStates.length===96`), 'Trophy scene incomplete');
  const firstNotice = await evaluate(`(()=>{const a=window.__IN_APP__;return {name:document.getElementById('trophy-notification-name').textContent,badge:Number(document.getElementById('trophy-tab-badge').textContent),queue:a.meta.trophyQueue.slice()}})()`);
  ok(firstNotice.badge === 2 && firstNotice.queue.length === 2, `Trophy queue did not preserve simultaneous awards: ${JSON.stringify(firstNotice)}`);
  const secondNotice = await evaluate(`(()=>{const a=window.__IN_APP__;a.settings={...a.settings,motion:'reduced'};a.trophyNotifications.acknowledge('browser-sequence');return {name:document.getElementById('trophy-notification-name').textContent,badge:Number(document.getElementById('trophy-tab-badge').textContent),static:document.getElementById('trophy-notification').classList.contains('is-static')}})()`);
  ok(secondNotice.badge === 1 && secondNotice.name !== firstNotice.name && secondNotice.static, `Sequential reduced Trophy reveal failed: ${JSON.stringify({firstNotice,secondNotice})}`);
  await screenshot('browser-trophy-queue-reduced.png'); await trustedId(t, 'scene-world');

  await installFirstReplacementCapture(evaluate); await evaluate(`window.__IN_APP__.requestWorldReplacement('auto-next',window.__IN_APP__.lastResultIdentity)`);
  ok(await poll(() => evaluate('window.__IN_APP__.phase'), (phase) => phase === 'running', 6000), 'automatic replacement path did not start');
  assertBlankReplacement(await evaluate('window.__IN_APP__.__firstReplacementFrame'), boot.renderer);
  ok(await evaluate(`document.getElementById('trophy-notification-name').textContent===${JSON.stringify(secondNotice.name)}`), 'Trophy notification did not survive automatic replacement');
  await trustedId(t, 'trophy-notification-action'); ok(await evaluate(`window.__IN_APP__.scene==='trophies'&&window.__IN_APP__.trophyUi.selectedId!==null&&document.getElementById('trophy-tab-badge').hidden`), 'Trophy notification click did not route to detail and acknowledge');
  await evaluate(`window.__IN_APP__.trophyNotifications.hold('browser-evidence',false)`);
  const bounded = await evaluate(`(()=>{const a=window.__IN_APP__;return {...a.worldResourceAudit(),raf:a.frameAudit}})()`);
  ok(!bounded.historyRequests && !bounded.adaptationEffects && !bounded.adaptationBytes && !bounded.adaptationTimers && !bounded.raf.errors, `replacement resources leaked: ${JSON.stringify(bounded)}`);
  const idb = await evaluate('window.__IN_APP__.historyPlayback.recentRuns.ready()'); ok(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  return { backend: boot.renderer, score: result.score, elapsed, nodeId, render, idb, metricRects, responsive };
}

async function trustedId(t, id) { return trustedSelector(t, `#${id}`); }
async function trustedSelector({ evaluate, click }, selector) { const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('missing ${selector}');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`); await click(...point); }
async function selectorEvidence(evaluate) { return evaluate(`(()=>{const root=document.getElementById('scene-selector'),r=root.getBoundingClientRect(),tabs=[...root.querySelectorAll('[role=tab]')];return {order:tabs.map(x=>x.textContent.trim()),selected:tabs.filter(x=>x.getAttribute('aria-selected')==='true').length,min:Math.min(...tabs.map(x=>x.getBoundingClientRect().height)),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}})()`); }
function selectorContract(value) { ok(value.order.join('|') === 'Home|World|Evolution|Trophies' && value.selected === 1 && value.min >= 44, `selector contract: ${JSON.stringify(value)}`); }
async function shellRect(evaluate) { return evaluate(`(()=>{const e=document.getElementById('context-shell'),r=e.getBoundingClientRect();return {surface:e.dataset.surface,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}})()`); }
async function layoutEvidence(evaluate) { return evaluate(`(()=>{const tabs=[...document.querySelectorAll('#scene-selector [role=tab]')],e=document.getElementById('current-event-button').getBoundingClientRect(),d=document.querySelector('.command-rail').getBoundingClientRect(),s=document.getElementById('context-shell').getBoundingClientRect(),overlap=(a,b)=>!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom),rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});return {noOverflow:document.documentElement.scrollWidth<=innerWidth,selectorMin:Math.min(...tabs.map(x=>x.getBoundingClientRect().height)),eventMin:e.height,controlsBounded:e.left>=0&&e.right<=innerWidth&&d.left>=0&&d.right<=innerWidth,eventDockOverlap:overlap(e,d),eventShellOverlap:overlap(e,s),event:rect(e),dock:rect(d),shell:rect(s)}})()`); }
function sameRect(a, b, tolerance) { return ['left','top','right','bottom','width','height'].every((key) => Math.abs(a[key] - b[key]) <= tolerance); }
export async function installFirstReplacementCapture(evaluate) {
  await evaluate(`(()=>{const a=window.__IN_APP__,old=a.worldIdentity.worldSessionId,make=a.makeRenderer.bind(a);a.__firstReplacementFrame=null;a.makeRenderer=(...args)=>{make(...args);const r=a.renderer,render=r.render.bind(r);r.render=s=>{const snap=s.snapshot,target=snap?.worldSessionId!==old;if(!target)return render(s);const count=v=>v?[...v].reduce((n,x)=>n+(x!==0),0):0,before={blank:snap?.blank===true,status:snap?.status,life:count(snap?.lifeState)+count(snap?.biomass),events:count(snap?.eventStrength),highlights:s.highlightedCells?.length??0,adaptation:Boolean(s.adaptation)};const accepted=render(s);a.__firstReplacementFrame={backend:r.backend,accepted,before,after:r.lastFrameAudit,presentation:a.presentationAudit.lastBlank};r.render=render;a.makeRenderer=make;return accepted}}})()`);
}
export function assertBlankReplacement(frame, label) { ok(frame?.accepted && frame.before.blank && frame.before.status === 'starting', `${label} first replacement was not blank`); ok(frame.before.life === 0 && frame.before.events === 0 && frame.before.highlights === 0 && !frame.before.adaptation, `${label} retained presentation`); ok(frame.after?.lifeCells === 0 && frame.after?.eventCells === 0 && !frame.after?.adaptation, `${label} retained renderer buffers`); if (frame.backend === 'webgl2') ok(frame.after.dynamic?.life === 0 && frame.after.dynamic?.events === 0 && frame.after.dynamic?.adaptations === 0, 'WebGL2 dynamic buffers not clear'); }
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
