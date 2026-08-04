/** Trusted-CDP production evidence for the unified shell vertical slice. */
export async function runScenario(t) {
  const { evaluate, wait, poll, errors, click, drag, screenshot, setViewport, key } = t;
  let boot = await evaluate('window.__CELL_SPHERE_BOOT__'); ok(boot?.playable, 'app did not boot');
  boot = await runIdentityMigrationScenario(t, boot);
  const render = await evaluate(`new Promise(resolve=>{const a=window.__CELL_SPHERE_APP__,r=a.renderer,base=r.render.bind(r),samples=[];
    r.render=s=>{const at=performance.now(),out=base(s);samples.push(performance.now()-at);return out};setTimeout(()=>{r.render=base;samples.sort((a,b)=>a-b);
    resolve({draws:r.drawCalls,p95:samples[Math.floor(samples.length*.95)]||0,mean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length)});},800)})`);
  ok(render.draws === 4, `renderer draw count ${render.draws}`);
  const initialSelector = await selectorEvidence(evaluate); selectorContract(initialSelector);
  await screenshot('shell-home-mobile.png'); await trustedId(t, 'begin-button');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000), 'world did not start');
  await evaluate(`document.getElementById('speed-select').value='1';document.getElementById('speed-select').dispatchEvent(new Event('change'))`);
  const dial = () => evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,m=document.querySelector('.clock-minute'),h=document.querySelector('.clock-hour');return {phase:a.timeDial.state.phase,minute:m.style.transform,hour:h.style.transform}})()`);
  const fullDialBefore = await dial(); await wait(300); const fullDialAfter = await dial();
  const fullDialTurn = (fullDialAfter.phase - fullDialBefore.phase + 360) % 360;
  ok(fullDialTurn > 0 && fullDialBefore.minute !== fullDialAfter.minute && fullDialBefore.hour !== fullDialAfter.hour,
    `clock hands did not move: ${JSON.stringify({ fullDialBefore, fullDialAfter })}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'})})()`);
  const reducedDialBefore = await dial(); await wait(1200); const reducedDialAfter = await dial();
  const reducedDialTurn = (reducedDialAfter.phase - reducedDialBefore.phase + 360) % 360;
  ok(reducedDialTurn > 0 && reducedDialTurn < fullDialTurn && reducedDialBefore.minute !== reducedDialAfter.minute
    && reducedDialBefore.hour !== reducedDialAfter.hour, `reduced clock stopped or moved too quickly: ${JSON.stringify({ reducedDialBefore, reducedDialAfter })}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'})})()`);

  const cameraBefore = await evaluate(`({camera:window.__CELL_SPHERE_APP__.camera.direction.slice(),tick:window.__CELL_SPHERE_APP__.snapshot.tick})`);
  await trustedId(t, 'scene-evolution'); await wait(300);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.scene==='evolution'&&window.__CELL_SPHERE_APP__.phase==='running'&&window.__CELL_SPHERE_APP__.memorySnapshot.nodeStates.length===642`), 'Evolution scene replaced authority');
  await trustedId(t, 'scene-world'); await wait(120);
  const restored = await evaluate(`({camera:window.__CELL_SPHERE_APP__.camera.direction.slice(),tick:window.__CELL_SPHERE_APP__.snapshot.tick,scene:window.__CELL_SPHERE_APP__.scene})`);
  ok(restored.scene === 'world' && restored.tick > cameraBefore.tick && distance(restored.camera, cameraBefore.camera) < 1e-8,
    `World camera/authority did not restore exactly: ${JSON.stringify({ cameraBefore, restored })}`);
  await trustedId(t, 'scene-home'); await key('ArrowRight');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.scene'), (scene) => scene === 'world', 1000), 'scene selector ArrowRight failed');
  await key('End'); ok(await evaluate(`window.__CELL_SPHERE_APP__.scene==='trophies'`), 'scene selector End failed');
  await key('Home'); ok(await evaluate(`window.__CELL_SPHERE_APP__.scene==='home'`), 'scene selector Home failed');
  await key('ArrowRight'); ok(await evaluate(`window.__CELL_SPHERE_APP__.scene==='world'`), 'scene selector did not return World');
  ok(sameRect(initialSelector.rect, (await selectorEvidence(evaluate)).rect, .2), 'selector moved across scenes');

  await setViewport(1440, 900); await wait(180); const metricRects = {};
  for (const kind of ['score', 'entropy', 'reach']) {
    await trustedId(t, `${kind}-button`); await wait(150); const first = await shellRect(evaluate);
    await wait(450); const second = await shellRect(evaluate); metricRects[kind] = second;
    ok(first.surface === 'metric' && sameRect(first, second, .25), `${kind} metric shell jittered`);
    const semantics = await evaluate(`(()=>{const b=document.getElementById('${kind}-button'),a=window.__CELL_SPHERE_APP__;return {tag:b.tagName,h:b.getBoundingClientRect().height,expanded:b.getAttribute('aria-expanded'),controls:b.getAttribute('aria-controls'),overlay:a.overlay,active:a.surfaces.active,kind:a.metricUi.kind,hidden:document.getElementById('context-shell').hidden}})()`);
    ok(semantics.tag === 'BUTTON' && semantics.h >= 44 && semantics.expanded === 'true' && semantics.controls === 'metric-dialog', `${kind} semantics failed: ${JSON.stringify(semantics)}`);
    if (kind !== 'reach') await trustedId(t, `${kind}-button`);
  }
  ok(sameRect(metricRects.score, metricRects.entropy, .25) && sameRect(metricRects.score, metricRects.reach, .25), 'metric kinds changed outer geometry');
  await evaluate(`document.getElementById('metric-body').scrollTop=40`); const scrollBefore = await evaluate(`document.getElementById('metric-body').scrollTop`);
  await drag([940, 350], [1080, 430]); await wait(100);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='metric'&&!document.getElementById('metric-dialog').hidden`), 'globe drag dismissed metric');
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
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='menu'&&document.getElementById('menu-world-heading').textContent==='World'&&document.getElementById('menu-new-world').offsetHeight>=44`), 'Menu groups/actions missing');
  await evaluate(`(()=>{const s=document.querySelector('[name=adaptationMode]');s.value='manual';s.dispatchEvent(new Event('change',{bubbles:true}))})()`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.settings.adaptationMode'), (mode) => mode === 'manual', 2000), 'manual mode was not authoritative');
  await trustedId(t, 'menu-new-world');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='new-world'&&!document.getElementById('new-world-dialog').hidden`), 'New World confirmation did not replace Menu');
  await wait(80); const tickBeforeConfirm = await evaluate('window.__CELL_SPHERE_APP__.snapshot.tick'); await wait(220);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.snapshot.tick`) === tickBeforeConfirm, 'confirmation did not own its pause');
  await trustedId(t, 'new-world-keep'); ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.snapshot.tick'), (tick) => tick > tickBeforeConfirm, 1500), 'Keep watching did not resume');

  const run32StartedAt = performance.now(); await evaluate(`(()=>{const s=document.getElementById('speed-select');s.value='32';s.dispatchEvent(new Event('change'))})()`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.pendingCount()'), (count) => count > 0, 5000), 'manual Adaptation offer did not queue');
  await trustedId(t, 'adaptations-button'); await wait(120); const compact = await evaluate(`(()=>{const s=document.getElementById('context-shell').getBoundingClientRect(),e=document.getElementById('current-event-button').getBoundingClientRect(),summary=document.querySelector('#adaptations-dialog details summary')?.getBoundingClientRect();return {height:s.height,viewport:innerHeight,cards:[...document.querySelectorAll('#adaptation-cards .card')].map(x=>x.getBoundingClientRect().height),summary:summary?.height??0,eventVisible:e.width>0&&e.bottom<=s.top+1}})()`);
  ok(compact.height <= compact.viewport * .37 && compact.cards.length === 3 && compact.cards.every((height) => height >= 44) && compact.summary >= 44 && compact.eventVisible,
    `compact Adaptations failed: ${JSON.stringify(compact)}`); await screenshot('shell-adaptations-mobile.png'); await trustedId(t, 'adaptations-close');

  await setViewport(1440, 900); await wait(120); await trustedId(t, 'menu-button'); await trustedId(t, 'menu-history'); await wait(160);
  const history = await shellRect(evaluate); ok(history.surface === 'history' && history.left < 30 && history.width <= 520, 'History is not the desktop left shell');
  const historyTracks = await evaluate(`(()=>{const panel=document.getElementById('history-dialog'),body=panel.querySelector('.surface-body'),p=panel.getBoundingClientRect(),b=body.getBoundingClientRect(),f=panel.querySelector('footer').getBoundingClientRect();return {bodyBeforeFooter:b.bottom<=f.top+1,footerBounded:f.bottom<=p.bottom+1&&p.bottom-f.bottom<40,bodyOverflow:getComputedStyle(body).overflowY,tracks:getComputedStyle(panel).gridTemplateRows.split(' ').length}})()`);
  ok(historyTracks.bodyBeforeFooter && historyTracks.footerBounded && historyTracks.bodyOverflow === 'auto' && historyTracks.tracks === 3, `History shell tracks failed: ${JSON.stringify(historyTracks)}`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.historyPlayback.pendingRequests'), (count) => count === 0, 2500), 'History visual request did not settle');
  await trustedId(t, 'history-prev'); ok(await poll(() => evaluate('Boolean(window.__CELL_SPHERE_APP__.historySnapshot)'), Boolean, 1200), 'History previous event did not show a visual preview');
  await trustedId(t, 'history-live'); ok(await evaluate('window.__CELL_SPHERE_APP__.historySnapshot===null'), 'History Live did not restore the authoritative snapshot');
  const historyCamera = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()'); await drag([960, 360], [1080, 410]);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='history'`), 'globe drag dismissed History');
  await trustedId(t, 'history-event-log'); ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='event-log'`), 'History did not route to Event Log');
  const rows = await evaluate(`document.querySelectorAll('#event-log-list .event-log-entry').length`); ok(rows <= 80, `Event Log DOM rows unbounded: ${rows}`);
  await drag([970, 360], [1090, 420]); ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='event-log'`), 'globe drag dismissed Event Log');
  await trustedId(t, 'event-log-close'); ok(distance(historyCamera, await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()')) > 0, 'globe drag did not rotate');

  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 45000), '32x run did not finish');
  const elapsed = (performance.now() - run32StartedAt) / 1000; const result = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=document.getElementById('context-shell');return {score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),scene:a.scene,phase:a.phase,overlay:a.overlay,surface:s.dataset.surface,runVisible:!document.getElementById('run-screen').hidden,resultControl:!document.getElementById('result-control').hidden,event:document.getElementById('current-event-button').offsetHeight,pause:document.getElementById('pause-button').disabled,speed:document.getElementById('speed-select').disabled,adapt:document.getElementById('adaptations-button').disabled,trophies:document.getElementById('result-trophies').textContent,snapshotStatus:a.snapshot?.status,alive:a.snapshot?.metrics?.aliveCount,reach:document.getElementById('hud-reach').textContent}})()`);
  ok(result.score > 0 && result.scene === 'world' && result.phase === 'result' && result.overlay === 'result' && result.surface === 'result'
    && result.runVisible && result.resultControl && result.event >= 44 && result.pause && result.speed && result.adapt
    && result.snapshotStatus === 'extinct' && result.alive === 0 && result.reach === '0%'
    && result.trophies.includes('First Extinction'), `terminal world failed: ${JSON.stringify(result)}`);
  await evaluate(`window.__CELL_SPHERE_APP__.trophyNotifications.hold('browser-evidence',true)`); await screenshot('shell-result-desktop.png'); await trustedId(t, 'result-close'); ok(await evaluate(`document.getElementById('context-shell').hidden`), 'Result did not close');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.continuation.status==='cancelled'`), 'trusted Result interaction did not permanently cancel Auto Next');
  await trustedId(t, 'result-control'); await drag([800, 330], [930, 420]); const dragState = await evaluate(`({overlay:window.__CELL_SPHERE_APP__.overlay,surface:window.__CELL_SPHERE_APP__.surfaces.active,selected:window.__CELL_SPHERE_APP__.selectedNode})`); ok(dragState.overlay === 'result', `globe drag dismissed Result: ${JSON.stringify(dragState)}`);
  await click(1000, 450); await wait(120); ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='inspector'&&document.activeElement===document.getElementById('inspector-heading')`), 'cell tap did not replace Result and focus Inspector');
  await trustedId(t, 'inspector-close'); await trustedId(t, 'result-control'); await trustedId(t, 'result-reach-button');
  const finalMetric = await shellRect(evaluate); ok(finalMetric.surface === 'metric' && sameRect(finalMetric, metricRects.reach, .25), 'final metric geometry changed');
  await trustedId(t, 'metric-close');

  const runIdentity = await evaluate('window.__CELL_SPHERE_APP__.worldIdentity.resultTransactionKey'); await trustedId(t, 'scene-evolution'); await wait(160);
  const nodeId = await evaluate(`window.__CELL_SPHERE_APP__.memorySnapshot.nodeStates.find(n=>n.reachable&&n.affordable&&!n.owned)?.id`); ok(nodeId, 'no adjacent affordable Skill Cell');
  const ownedBefore = await evaluate('window.__CELL_SPHERE_APP__.meta.memoryNodes.length'); await evaluate(`window.__CELL_SPHERE_APP__.selectMemoryNode(${JSON.stringify(nodeId)})`); await trustedId(t, 'memory-unlock');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.meta.memoryNodes.length`) === ownedBefore + 1, 'Skill unlock transaction failed');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.phase==='result'&&window.__CELL_SPHERE_APP__.worldIdentity.resultTransactionKey===${JSON.stringify(runIdentity)}`), 'Evolution replaced terminal world authority');
  await trustedId(t, 'scene-trophies'); ok(await evaluate(`window.__CELL_SPHERE_APP__.trophySnapshot.nodeStates.length===96`), 'Trophy scene incomplete');
  const firstNotice = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {name:document.getElementById('trophy-notification-name').textContent,badge:Number(document.getElementById('trophy-tab-badge').textContent),queue:a.meta.trophyQueue.slice()}})()`);
  ok(firstNotice.badge === 2 && firstNotice.queue.length === 2, `Trophy queue did not preserve simultaneous awards: ${JSON.stringify(firstNotice)}`);
  const secondNotice = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.settings={...a.settings,motion:'reduced'};a.trophyNotifications.acknowledge('browser-sequence');return {name:document.getElementById('trophy-notification-name').textContent,badge:Number(document.getElementById('trophy-tab-badge').textContent),static:document.getElementById('trophy-notification').classList.contains('is-static')}})()`);
  ok(secondNotice.badge === 1 && secondNotice.name !== firstNotice.name && secondNotice.static, `Sequential reduced Trophy reveal failed: ${JSON.stringify({firstNotice,secondNotice})}`);
  await screenshot('browser-trophy-queue-reduced.png'); await trustedId(t, 'scene-world');

  await installFirstReplacementCapture(evaluate); await evaluate(`window.__CELL_SPHERE_APP__.requestWorldReplacement('auto-next',window.__CELL_SPHERE_APP__.lastResultIdentity)`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 6000), 'automatic replacement path did not start');
  assertBlankReplacement(await evaluate('window.__CELL_SPHERE_APP__.__firstReplacementFrame'), boot.renderer);
  ok(await evaluate(`document.getElementById('trophy-notification-name').textContent===${JSON.stringify(secondNotice.name)}`), 'Trophy notification did not survive automatic replacement');
  await trustedId(t, 'trophy-notification-action'); ok(await evaluate(`window.__CELL_SPHERE_APP__.scene==='trophies'&&window.__CELL_SPHERE_APP__.trophyUi.selectedId!==null&&document.getElementById('trophy-tab-badge').hidden`), 'Trophy notification click did not route to detail and acknowledge');
  await evaluate(`window.__CELL_SPHERE_APP__.trophyNotifications.hold('browser-evidence',false)`);
  const bounded = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {...a.worldResourceAudit(),raf:a.frameAudit}})()`);
  ok(!bounded.historyRequests && !bounded.adaptationEffects && !bounded.adaptationBytes && !bounded.adaptationTimers && !bounded.raf.errors, `replacement resources leaked: ${JSON.stringify(bounded)}`);

  await installFirstReplacementCapture(evaluate);
  const unattended = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.continuation.durationMs=800;a.settings={...a.settings,autoContinue:true};return a.worldIdentity.worldSessionId})()`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 45000), 'untouched countdown world did not finish');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.worldIdentity.worldSessionId'), (session) => session > unattended, 5000), 'untouched result countdown did not replace the world');
  assertBlankReplacement(await evaluate('window.__CELL_SPHERE_APP__.__firstReplacementFrame'), 'WebGL2 countdown');

  const lossRequested = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,gl=a.renderer?.gl,ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;window.__CELL_SPHERE_RETIRED_CANVAS__=a.canvas;ext.loseContext();return true})()`);
  ok(lossRequested, 'WEBGL_lose_context unavailable');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.renderer?.backend'), (backend) => backend === 'canvas2d', 3000), 'WebGL context loss did not activate Canvas 2D');
  await wait(180); const loss = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {replaced:a.canvas!==window.__CELL_SPHERE_RETIRED_CANVAS__,canvases:document.querySelectorAll('#gl-canvas').length,backend:a.renderer.backend,accepted:a.renderer.acceptedFrames,input:typeof a.input?.isActive==='function',errors:a.frameAudit.errors}})()`);
  ok(loss.replaced && loss.canvases === 1 && loss.backend === 'canvas2d' && loss.accepted > 0 && loss.input && !loss.errors, `context-loss fallback failed: ${JSON.stringify(loss)}`);
  const idb = await evaluate('window.__CELL_SPHERE_APP__.historyPlayback.recentRuns.ready()'); ok(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  return { backend: boot.renderer, score: result.score, elapsed, nodeId, render, idb, metricRects, responsive, contextLoss: loss };
}

async function runIdentityMigrationScenario({ evaluate, wait, poll }, initialBoot) {
  ok(initialBoot.product === 'cell-sphere-game' && initialBoot.tagline === 'Every extinction becomes memory.', 'canonical boot identity missing');
  await evaluate(`(()=>{const old=['incremental','network','game'].join('-');localStorage.clear();
    const meta={schema:8,bestScore:424242,totalEchoes:321,echoBalance:123,runs:7,worldSeedIndex:11,
      resultKeys:['legacy-result-key'],memoryNodes:['reach-horizon-instinct'],quarantinedMemoryNodes:[],imprints:[],
      trophyIds:['evolution-first-world'],legacyTrophyIds:['reach-river-touch'],trophyQueue:['evolution-first-world'],trophyBackfillVersion:2,
      trophyProgress:{version:3,adaptationIds:['long-filaments'],geographyMask:1,geographyVersion:3,crisisMask:2,adaptationCategoryMask:1,lakeTypeMask:1,lakeSalinityMask:1,aggregate:{totalCrisesEndured:4}}};
    const history={schema:4,worlds:[{id:'legacy-world',seed:17,tick:900,score:424242,rank:'Canopy',cause:'starvation',archetype:'Legacy World',echo:9,hash:'abcdef',inoculationCell:4,adaptations:[],events:[]}],memory:[{seq:0,nodeId:'reach-horizon-instinct',cost:1,balance:123,run:7}],trophies:[{seq:0,tick:900,kind:'trophy',importance:3,key:'trophy.earned',subjectId:'evolution-first-world',primaryCells:[],worldId:'legacy-world',run:7}]};
    const settings={schema:3,motion:'reduced',contrast:'high',quality:'eco',cameraInertia:false,idleRotation:'off',adaptationMode:'manual',autoContinue:false,pauseOnPanels:true,speed:4,historyRetention:32};
    localStorage.setItem(old+':meta:v1',JSON.stringify(meta));localStorage.setItem(old+':history:v2',JSON.stringify(history));localStorage.setItem(old+':settings:v3',JSON.stringify(settings));location.reload();return true})()`);
  await wait(1800); ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'legacy namespace reload failed');
  const migrated = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__,old=['incremental','network','game'].join('-');
    const canonical=Object.fromEntries(['meta','settings','history'].map(k=>[k,localStorage.getItem(b.storage[k])]));
    return {score:a.meta.bestScore,total:a.meta.totalEchoes,balance:a.meta.echoBalance,runs:a.meta.runs,seed:a.meta.worldSeedIndex,
      keys:a.meta.resultKeys.slice(),owned:a.meta.memoryNodes.slice(),trophies:a.meta.trophyIds.slice(),legacy:a.meta.legacyTrophyIds.slice(),queue:a.meta.trophyQueue.slice(),
      history:a.archive.worlds.map(w=>w.id),motion:a.settings.motion,speed:a.settings.speed,canonical:Object.values(canonical).every(Boolean),
      old:Object.values({m:localStorage.getItem(old+':meta:v1'),s:localStorage.getItem(old+':settings:v3'),h:localStorage.getItem(old+':history:v2')}).every(Boolean)}})()`);
  ok(migrated.score === 424242 && migrated.total === 321 && migrated.balance === 123 && migrated.runs === 7 && migrated.seed === 11
    && migrated.keys[0] === 'legacy-result-key' && migrated.owned[0] === 'reach-horizon-instinct'
    && migrated.trophies[0] === 'evolution-first-world' && migrated.legacy[0] === 'reach-river-touch'
    && migrated.queue[0] === 'evolution-first-world' && migrated.history[0] === 'legacy-world'
    && migrated.motion === 'reduced' && migrated.speed === 4 && migrated.canonical && migrated.old,
  `browser namespace migration lost state: ${JSON.stringify(migrated)}`);
  const exported = await evaluate(`(async()=>{const old=['incremental','network','game'].join('-'),a=window.__CELL_SPHERE_APP__;
    const data=await import('./src/interface/app-data.js'),migration=await import('./src/platform/namespace-migration.js');
    const parsed=data.parseImportedData(JSON.stringify({schema:1,product:old,meta:a.meta,history:a.archive,settings:a.settings}));
    const saved=migration.saveImportedNamespace(parsed),fresh=JSON.parse(data.serializeExportData(parsed.meta,parsed.history,parsed.settings));
    const raw=JSON.parse(localStorage.getItem(old+':meta:v1'));raw.totalEchoes=999999;raw.echoBalance=999999;raw.runs=99;
    localStorage.setItem(old+':meta:v1',JSON.stringify(raw));return {saved,product:fresh.product,total:fresh.meta.totalEchoes}})()`);
  ok(exported.saved.ok && exported.product === 'cell-sphere-game' && exported.total === 321, `legacy import/canonical export failed: ${JSON.stringify(exported)}`);
  await evaluate('location.reload();true'); await wait(1800);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'coexistence reload failed');
  const coexist = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {total:a.meta.totalEchoes,balance:a.meta.echoBalance,runs:a.meta.runs,keys:a.meta.resultKeys}})()`);
  ok(coexist.total === 321 && coexist.balance === 123 && coexist.runs === 7 && coexist.keys.length === 1,
    `legacy namespace overrode canonical or duplicated rewards: ${JSON.stringify(coexist)}`);
  await evaluate('localStorage.clear();location.reload();true'); await wait(1800);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'fresh canonical reload failed');
  const fresh = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__;return {boot:b,defaults:a.meta.runs===0&&a.meta.totalEchoes===0,
    canonical:['meta','settings','history'].every(k=>Boolean(localStorage.getItem(b.storage[k]))),errors:window.__CELL_SPHERE_ERRORS__.slice()}})()`);
  ok(fresh.defaults && fresh.canonical && !fresh.errors.length, `fresh canonical save failed: ${JSON.stringify(fresh)}`); return fresh.boot;
}

async function trustedId(t, id) { return trustedSelector(t, `#${id}`); }
async function trustedSelector({ evaluate, click }, selector) { const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('missing ${selector}');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`); await click(...point); }
async function selectorEvidence(evaluate) { return evaluate(`(()=>{const root=document.getElementById('scene-selector'),r=root.getBoundingClientRect(),tabs=[...root.querySelectorAll('[role=tab]')];return {order:tabs.map(x=>x.textContent.trim()),selected:tabs.filter(x=>x.getAttribute('aria-selected')==='true').length,min:Math.min(...tabs.map(x=>x.getBoundingClientRect().height)),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}})()`); }
function selectorContract(value) { ok(value.order.join('|') === 'Home|World|Evolution|Trophies' && value.selected === 1 && value.min >= 44, `selector contract: ${JSON.stringify(value)}`); }
async function shellRect(evaluate) { return evaluate(`(()=>{const e=document.getElementById('context-shell'),r=e.getBoundingClientRect();return {surface:e.dataset.surface,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}})()`); }
async function layoutEvidence(evaluate) { return evaluate(`(()=>{const tabs=[...document.querySelectorAll('#scene-selector [role=tab]')],e=document.getElementById('current-event-button').getBoundingClientRect(),d=document.querySelector('.command-rail').getBoundingClientRect(),s=document.getElementById('context-shell').getBoundingClientRect(),overlap=(a,b)=>!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom),rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});return {noOverflow:document.documentElement.scrollWidth<=innerWidth,selectorMin:Math.min(...tabs.map(x=>x.getBoundingClientRect().height)),eventMin:e.height,controlsBounded:e.left>=0&&e.right<=innerWidth&&d.left>=0&&d.right<=innerWidth,eventDockOverlap:overlap(e,d),eventShellOverlap:overlap(e,s),event:rect(e),dock:rect(d),shell:rect(s)}})()`); }
function sameRect(a, b, tolerance) { return ['left','top','right','bottom','width','height'].every((key) => Math.abs(a[key] - b[key]) <= tolerance); }
export async function installFirstReplacementCapture(evaluate) {
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,old=a.worldIdentity.worldSessionId,make=a.makeRenderer.bind(a);a.__firstReplacementFrame=null;a.makeRenderer=(...args)=>{make(...args);const r=a.renderer,render=r.render.bind(r);r.render=s=>{const snap=s.snapshot,target=snap?.worldSessionId!==old;if(!target)return render(s);const count=v=>v?[...v].reduce((n,x)=>n+(x!==0),0):0,before={blank:snap?.blank===true,status:snap?.status,life:count(snap?.lifeState)+count(snap?.biomass),events:count(snap?.eventStrength),highlights:s.highlightedCells?.length??0,adaptation:Boolean(s.adaptation)};const accepted=render(s);a.__firstReplacementFrame={backend:r.backend,accepted,before,after:r.lastFrameAudit,presentation:a.presentationAudit.lastBlank};r.render=render;a.makeRenderer=make;return accepted}}})()`);
}
export function assertBlankReplacement(frame, label) { ok(frame?.accepted && frame.before.blank && frame.before.status === 'starting', `${label} first replacement was not blank`); ok(frame.before.life === 0 && frame.before.events === 0 && frame.before.highlights === 0 && !frame.before.adaptation, `${label} retained presentation`); ok(frame.after?.lifeCells === 0 && frame.after?.eventCells === 0 && !frame.after?.adaptation, `${label} retained renderer buffers`); if (frame.backend === 'webgl2') ok(frame.after.dynamic?.life === 0 && frame.after.dynamic?.events === 0 && frame.after.dynamic?.adaptations === 0, 'WebGL2 dynamic buffers not clear'); }
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
