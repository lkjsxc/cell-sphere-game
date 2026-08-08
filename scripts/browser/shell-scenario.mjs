/** Trusted-CDP production evidence for the unified shell vertical slice. */
import { assertSkillGeometry } from './evidence.mjs';

export async function runScenario(t) {
  const { evaluate, wait, poll, errors, click, tap, drag, screenshot, setViewport, key } = t;
  let boot = await evaluate('window.__CELL_SPHERE_BOOT__'); ok(boot?.playable, 'app did not boot');
  boot = await runIdentityMigrationScenario(t, boot);
  const publicSpeeds = await evaluate(`(()=>({runtime:[...document.getElementById('speed-select').options].map(o=>Number(o.value)),defaults:[...document.getElementById('settings-speed').options].map(o=>Number(o.value)),dev:window.__CELL_SPHERE_BOOT__.developerMode,marker:document.getElementById('dev-mode-marker').hidden,agent:Object.hasOwn(window,'__CSG_AGENT__')}))()`);
  ok(publicSpeeds.runtime.join(',') === '1,2,4,8' && publicSpeeds.defaults.join(',') === '1,2,4,8'
    && !publicSpeeds.dev && publicSpeeds.marker && !publicSpeeds.agent, `public speed isolation failed: ${JSON.stringify(publicSpeeds)}`);
  const retired = await evaluate(`(()=>({controls:['adaptations-button','adaptations-dialog','adaptation-cards','result-adaptations'].every(id=>!document.getElementById(id)),setting:!('adaptationMode' in window.__CELL_SPHERE_APP__.settings),pending:typeof window.__CELL_SPHERE_APP__.pendingCount==='undefined'}))()`);
  ok(retired.controls && retired.setting && retired.pending, `active Adaptations remain: ${JSON.stringify(retired)}`);
  const affordance = await evaluate(`(()=>{const b=document.getElementById('score-button'),s=getComputedStyle(b),p=getComputedStyle(b,'::after');return {border:s.borderTopWidth,background:s.backgroundColor,disclosure:p.content,expanded:b.getAttribute('aria-expanded')}})()`);
  ok(affordance.border !== '0px' && affordance.background !== 'rgba(0, 0, 0, 0)' && affordance.disclosure !== 'none' && affordance.expanded === 'false', `metric lacks resting affordance: ${JSON.stringify(affordance)}`);
  const render = await evaluate(`new Promise(resolve=>{const a=window.__CELL_SPHERE_APP__,r=a.renderer,base=r.render.bind(r),samples=[];
    r.render=s=>{const at=performance.now(),out=base(s);samples.push(performance.now()-at);return out};setTimeout(()=>{r.render=base;samples.sort((a,b)=>a-b);
    resolve({draws:r.drawCalls,p95:samples[Math.floor(samples.length*.95)]||0,mean:samples.reduce((a,b)=>a+b,0)/Math.max(1,samples.length)});},800)})`);
  ok(render.draws === 4, `renderer draw count ${render.draws}`);
  const initialSelector = await selectorEvidence(evaluate); selectorContract(initialSelector);
  await screenshot('shell-home-mobile.png'); await trustedId(t, 'begin-button');
  ok(await poll(()=>evaluate('window.__CELL_SPHERE_APP__.phase'),(phase)=>phase==='running',5000),'world did not start');
  const fallbackAuthority=await evaluate('window.__CELL_SPHERE_APP__.driver.hasFallback');
  ok(fallbackAuthority===Boolean(t.simulationFallback),`unexpected simulation authority: fallback=${fallbackAuthority}`);
  const setDialSpeed = (speed) => evaluate(`(()=>{const s=document.getElementById('speed-select');s.value='${speed}';s.dispatchEvent(new Event('change'))})()`);
  await setDialSpeed(1);
  const dial = () => evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,m=document.querySelector('.clock-minute'),h=document.querySelector('.clock-hour');return {phase:a.timeDial.state.phase,hourPhase:a.timeDial.state.hourPhase,minute:m.style.transform,hour:h.style.transform}})()`);
  const fullDialBefore = await dial(); await wait(300); const fullDialAfter = await dial();
  const fullDialTurn = (fullDialAfter.phase - fullDialBefore.phase + 360) % 360;
  const fullHourTurn = (fullDialAfter.hourPhase - fullDialBefore.hourPhase + 360) % 360;
  ok(fullDialTurn > 0 && fullHourTurn > 0 && fullDialBefore.minute !== fullDialAfter.minute && fullDialBefore.hour !== fullDialAfter.hour,
    `clock hands did not move: ${JSON.stringify({ fullDialBefore, fullDialAfter })}`);
  await setDialSpeed(8); const fastDialBefore = await dial(); await wait(300); const fastDialAfter = await dial();
  const fastDialTurn = (fastDialAfter.phase - fastDialBefore.phase + 360) % 360;
  const fastHourTurn = (fastDialAfter.hourPhase - fastDialBefore.hourPhase + 360) % 360;
  ok(fastDialTurn > fullDialTurn && fastHourTurn > fullHourTurn,
    `clock did not follow world speed: ${JSON.stringify({ fullDialTurn, fullHourTurn, fastDialTurn, fastHourTurn })}`);
  await setDialSpeed(1); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'})})()`);
  const reducedDialBefore = await dial(); await wait(600); const reducedDialAfter = await dial();
  const reducedDialTurn = (reducedDialAfter.phase - reducedDialBefore.phase + 360) % 360;
  const reducedHourTurn = (reducedDialAfter.hourPhase - reducedDialBefore.hourPhase + 360) % 360;
  ok(reducedDialTurn > 0 && reducedHourTurn > 0 && reducedDialBefore.minute !== reducedDialAfter.minute
    && reducedDialBefore.hour !== reducedDialAfter.hour, `reduced clock stopped: ${JSON.stringify({ reducedDialBefore, reducedDialAfter })}`);
  await setDialSpeed(8); const reducedFastBefore = await dial(); await wait(600); const reducedFastAfter = await dial();
  const reducedFastTurn = (reducedFastAfter.phase - reducedFastBefore.phase + 360) % 360;
  const reducedFastHourTurn = (reducedFastAfter.hourPhase - reducedFastBefore.hourPhase + 360) % 360;
  ok(reducedFastTurn > reducedDialTurn && reducedFastHourTurn > reducedHourTurn,
    `reduced clock did not follow world speed: ${JSON.stringify({ reducedDialTurn, reducedHourTurn, reducedFastTurn, reducedFastHourTurn })}`);
  await setDialSpeed(1); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'})})()`);

  const cameraBefore = await evaluate(`({camera:window.__CELL_SPHERE_APP__.camera.direction.slice(),tick:window.__CELL_SPHERE_APP__.snapshot.tick})`);
  await trustedId(t, 'scene-evolution'); await wait(300);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.scene==='evolution'&&window.__CELL_SPHERE_APP__.phase==='running'&&window.__CELL_SPHERE_APP__.memorySnapshot.nodeStates.length===252`), 'Evolution scene replaced authority');
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
  await setViewport(390, 844); const accessibilityMatrix = await evaluate(`(()=>{const root=document.documentElement,tabs=[...document.querySelectorAll('#scene-selector [role=tab]')],labels=tabs.map(x=>x.firstChild.nodeValue);root.style.fontSize='32px';root.dataset.motion='reduced';root.dataset.contrast='high';tabs[2].firstChild.nodeValue='Evolution inherited ecological capabilities';const rects=tabs.map(x=>x.getBoundingClientRect()),values={noOverflow:document.documentElement.scrollWidth<=innerWidth,labelsContained:tabs.every(x=>getComputedStyle(x).overflow==='hidden')&&rects.every((r,i)=>!i||r.left>=rects[i-1].right-1),motion:getComputedStyle(root).getPropertyValue('--dur-base').trim(),border:getComputedStyle(document.getElementById('scene-selector')).borderTopWidth};tabs.forEach((x,i)=>x.firstChild.nodeValue=labels[i]);root.style.fontSize='';root.dataset.motion='full';root.dataset.contrast='normal';return values})()`);
  ok(accessibilityMatrix.noOverflow && accessibilityMatrix.labelsContained && accessibilityMatrix.motion === '0ms' && accessibilityMatrix.border !== '0px', `accessibility matrix failed: ${JSON.stringify(accessibilityMatrix)}`);

  await setViewport(390, 844); await wait(140); await trustedId(t, 'menu-button');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='menu'&&document.getElementById('menu-world-heading').textContent==='World'&&document.getElementById('menu-new-world').offsetHeight>=44`), 'Menu groups/actions missing');
  await trustedId(t, 'menu-new-world');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='new-world'&&!document.getElementById('new-world-dialog').hidden`), 'New World confirmation did not replace Menu');
  await wait(80); const tickBeforeConfirm = await evaluate('window.__CELL_SPHERE_APP__.snapshot.tick'); await wait(220);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.snapshot.tick`) === tickBeforeConfirm, 'confirmation did not own its pause');
  await trustedId(t, 'new-world-keep'); ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.snapshot.tick'), (tick) => tick > tickBeforeConfirm, 1500), 'Keep watching did not resume');

  const run8StartedAt = performance.now(); await evaluate(`(()=>{const s=document.getElementById('speed-select');s.value='8';s.dispatchEvent(new Event('change'))})()`);

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
  const localEcology = await evaluate(`(()=>{const s=window.__CELL_SPHERE_APP__.snapshot,q=[...(s.resourceRichnessQ||[])],states=[...new Set(s.resourceState||[])];return {states,min:q.length?Math.min(...q):0,max:q.length?Math.max(...q):0,alive:s.metrics?.aliveCount||0,reach:s.metrics?.peakReach||0}})()`);
  ok(localEcology.states.length >= 3 && localEcology.max - localEcology.min > 40 && localEcology.alive > 0,
    `local resource ecology missing in production snapshot: ${JSON.stringify(localEcology)}`);
  await screenshot('browser-world-local-resources.png');
  const developedEcology = await evaluate(`(async()=>{const [{RunController},{compileEvolution,MEMORY_NODE_IDS}]=await Promise.all([import('./src/simulation/simulator.js'),import('./src/game/skills/index.js')]);const m=compileEvolution({evolutionLevels:MEMORY_NODE_IDS.map(id=>({id,level:'20'}))}),c=new RunController({seed:9099,worldOrdinal:'20',environmentLevel:'0',worldPotential:m.worldPotential,evolutionPower:m.evolutionPower,evolutionDepth:m.evolutionDepth,potentialVersion:m.potentialVersion,memoryEffects:m.effects,memoryConditionals:m.conditionals,memoryUnlocks:m.unlocks,habitatCapabilities:m.habitatCapabilities,activeBuilds:m.activeBuilds,buildEffects:m.buildEffects,electricityMastery:m.electricityMastery});c.start();c.advance(300);const a=window.__CELL_SPHERE_APP__,mid=c.snapshot();c.advance(4000);a.pause.set('browser-luminous',true);a.__luminousDecaySnapshot={...c.snapshot(),...a.worldIdentity};const s={...mid,...a.worldIdentity};a.historySnapshot=s;return {transformStates:[...new Set(s.transformationState)],transformed:[...s.transformationState].filter(Boolean).length,powered:[...s.electricityQ].filter(Boolean).length,alive:s.metrics.aliveCount}})()`);
  ok(developedEcology.transformStates.filter(Boolean).length>=3&&developedEcology.transformStates.includes(3)
    &&developedEcology.transformStates.includes(5)&&developedEcology.transformed>50
    && developedEcology.powered > 50 && developedEcology.alive > 0,
  `developed ecology fixture missing production mechanics: ${JSON.stringify(developedEcology)}`);
  await wait(120);await screenshot('browser-world-transformations.png');
  const focusCharge=async(day)=>evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{focusCamera}=await import('./src/rendering/camera.js'),s=a.historySnapshot,p=a.topo.positions,q=s.electricityQ,sun=[-.52,.72,.44];let cell=-1,charge=-1,dot=0;for(let i=0;i<q.length;i++){const d=p[i*3]*sun[0]+p[i*3+1]*sun[1]+p[i*3+2]*sun[2];if((${day?'true':'false'}?d>.55:d<-.7)&&q[i]>charge){cell=i;charge=q[i];dot=d}}if(cell<0)throw new Error('no charged visual focus');focusCamera(a.camera,p.subarray(cell*3,cell*3+3));a.lastRender=-Infinity;let draws=null,drawArrays,drawElements;if(${day?'true':'false'}&&a.renderer.backend==='webgl2'){const gl=a.renderer.gl;draws=0;drawArrays=gl.drawArrays;drawElements=gl.drawElements;gl.drawArrays=(...args)=>{draws++;return drawArrays.apply(gl,args)};gl.drawElements=(...args)=>{draws++;return drawElements.apply(gl,args)}}const accepted=a.renderer.render({snapshot:s,worldIdentity:a.worldIdentity,camera:a.camera,selectedNode:null,highlightedCells:[],time:performance.now()/1000,pulse:false});if(drawArrays){a.renderer.gl.drawArrays=drawArrays;a.renderer.gl.drawElements=drawElements}return{cell,charge,dot,accepted,draws,camera:a.camera.direction.slice()}})()`);
  developedEcology.day=await focusCharge(true);await wait(120);developedEcology.dayImage=await screenshot('browser-world-luminous-day.png');
  developedEcology.night=await focusCharge(false);await wait(120);developedEcology.nightImage=await screenshot('browser-world-luminous-night.png');
  ok(developedEcology.day.charge>0&&developedEcology.night.charge>0&&developedEcology.day.accepted&&developedEcology.night.accepted&&developedEcology.day.draws===4
    &&developedEcology.dayImage.hash!==developedEcology.nightImage.hash,`Luminous visual focus missing: ${JSON.stringify(developedEcology)}`);
  developedEcology.decay=await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=a.__luminousDecaySnapshot;a.historySnapshot=s;const charge=[...s.electricityQ].reduce((sum,value)=>sum+value,0),accepted=a.renderer.render({snapshot:s,worldIdentity:a.worldIdentity,camera:a.camera,selectedNode:null,highlightedCells:[],time:performance.now()/1000,pulse:false});return{charge,accepted,status:s.status}})()`);
  ok(developedEcology.decay.charge===0&&developedEcology.decay.accepted&&developedEcology.decay.status==='extinct',`Luminous decay visual missing: ${JSON.stringify(developedEcology.decay)}`);
  await wait(120);developedEcology.decayImage=await screenshot('browser-world-luminous-decayed.png');
  ok(developedEcology.decayImage.hash!==developedEcology.nightImage.hash,'charged and decayed WebGL pixels were identical');
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.historySnapshot=null;delete a.__luminousDecaySnapshot;a.pause.set('browser-luminous',false)})()`);

  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 50000), '8x run did not finish');
  const elapsed = (performance.now() - run8StartedAt) / 1000; const result = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=document.getElementById('context-shell'),control=document.getElementById('result-control'),ids=[...document.querySelector('.hud-metrics').children].map(x=>x.id);return {score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),scene:a.scene,phase:a.phase,overlay:a.overlay,surface:s.dataset.surface,runVisible:!document.getElementById('run-screen').hidden,resultControl:!control.hidden,resultAction:control.dataset.action,resultClass:control.classList.contains('is-recommended'),resultExpanded:control.getAttribute('aria-expanded'),metricOrder:ids.join('|'),redundant:['result-score-button','result-entropy-button','result-reach-button'].some(id=>document.getElementById(id)),event:document.getElementById('current-event-button').offsetHeight,pause:document.getElementById('pause-button').disabled,speed:document.getElementById('speed-select').disabled,trophies:document.getElementById('result-trophies').textContent,resultEnvironment:document.getElementById('result-environment').textContent,
      nextLabel:document.getElementById('result-next-button').textContent,noRetry:!document.getElementById('result-retry-button'),noDuplicateProgressionNav:![...document.querySelectorAll('#result-dialog button')].some(b=>['Evolution','Trophies'].includes(b.textContent.trim())),snapshotStatus:a.snapshot?.status,alive:a.snapshot?.metrics?.aliveCount,reach:document.getElementById('hud-reach').textContent}})()`);
  ok(result.score > 0 && result.scene === 'world' && result.phase === 'result' && result.overlay === 'result' && result.surface === 'result'
    && result.runVisible && result.resultControl && result.resultAction === 'next-world' && result.resultClass && result.resultExpanded === 'true'
    && result.metricOrder === 'score-button|entropy-button|reach-button|result-control|environment-level-metric' && !result.redundant
    && result.event >= 44 && result.pause && result.speed && result.noDuplicateProgressionNav && result.snapshotStatus === 'extinct' && result.alive === 0 && result.reach === '0%'
    &&result.trophies.includes('First Extinction')&&result.resultEnvironment.includes('Peak Environment Level')
    &&result.nextLabel==='Next World'&&result.noRetry,`terminal world failed: ${JSON.stringify(result)}`);
  const terminalLayouts = [];
  for (const [width, height] of [[320, 568], [390, 844], [1440, 900]]) {
    await setViewport(width, height); await wait(1000);
    const layout = await evaluate(`(()=>{const container=document.querySelector('.hud-metrics'),controls=[...container.children].filter(x=>!x.hidden),rects=controls.map(x=>x.getBoundingClientRect()),tops=new Set(rects.map(r=>Math.round(r.top))),style=getComputedStyle(container),plain=rects.map(r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}));return {count:controls.length,minHeight:Math.min(...rects.map(r=>r.height)),bounded:rects.every(r=>r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight),rows:tops.size,overlap:rects.some((a,i)=>rects.some((b,j)=>j>i&&!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom))),display:style.display,columns:style.gridTemplateColumns,rects:plain}})()`);
    terminalLayouts.push({ width, height, ...layout });
    ok(layout.count === 5 && layout.minHeight >= 44 && layout.bounded && !layout.overlap
      && (width <= 520 ? layout.rows === 3 : layout.rows === 1), `terminal metrics failed ${width}x${height}: ${JSON.stringify(layout)}`);
  }
  await setViewport(1440, 900); await wait(100);
  await evaluate(`window.__CELL_SPHERE_APP__.trophyNotifications.hold('browser-evidence',true)`); await screenshot('shell-result-desktop.png'); await trustedId(t, 'result-close'); ok(await evaluate(`document.getElementById('context-shell').hidden`), 'Result did not close');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.continuation.status==='cancelled'`), 'trusted Result interaction did not permanently cancel Auto Next');
  await trustedId(t, 'result-control'); await drag([800, 330], [930, 420]); const dragState = await evaluate(`({overlay:window.__CELL_SPHERE_APP__.overlay,surface:window.__CELL_SPHERE_APP__.surfaces.active,selected:window.__CELL_SPHERE_APP__.selectedNode})`); ok(dragState.overlay === 'result', `globe drag dismissed Result: ${JSON.stringify(dragState)}`);
  await click(1000, 450); await wait(120); ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='inspector'&&document.activeElement===document.getElementById('inspector-heading')`), 'cell tap did not replace Result and focus Inspector');
  await trustedId(t, 'inspector-close'); await trustedId(t, 'result-control'); await trustedId(t, 'reach-button');
  const finalMetric = await shellRect(evaluate); ok(finalMetric.surface === 'metric' && sameRect(finalMetric, metricRects.reach, .25), 'final metric geometry changed');
  await trustedId(t, 'metric-close');

  const runIdentity = await evaluate('window.__CELL_SPHERE_APP__.worldIdentity.resultTransactionKey');
  await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{validateMeta}=await import('./src/platform/storage.js');a.meta=validateMeta({...a.meta,echoBalance:'1000000'});return true})()`);
  await trustedId(t, 'scene-evolution'); await wait(160);
  const activationEvidence=await evolutionActivationEvidence(t);const nodeId=activationEvidence.keyboard.id;
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
  ok(!bounded.historyRequests && !bounded.raf.errors, `replacement resources leaked: ${JSON.stringify(bounded)}`);

  await installFirstReplacementCapture(evaluate);
  const unattended = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.continuation.durationMs=800;a.settings={...a.settings,autoContinue:true};return a.worldIdentity.worldSessionId})()`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase)=>phase==='result',50000),'untouched countdown world did not finish');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.worldIdentity.worldSessionId'), (session) => session > unattended, 5000), 'untouched result countdown did not replace the world');
  assertBlankReplacement(await evaluate('window.__CELL_SPHERE_APP__.__firstReplacementFrame'), 'WebGL2 countdown');

  const lossRequested = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,gl=a.renderer?.gl,ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;window.__CELL_SPHERE_RETIRED_CANVAS__=a.canvas;ext.loseContext();return true})()`);
  ok(lossRequested, 'WEBGL_lose_context unavailable');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.renderer?.backend'), (backend) => backend === 'canvas2d', 3000), 'WebGL context loss did not activate Canvas 2D');
  await wait(180); const loss = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {replaced:a.canvas!==window.__CELL_SPHERE_RETIRED_CANVAS__,canvases:document.querySelectorAll('#gl-canvas').length,backend:a.renderer.backend,accepted:a.renderer.acceptedFrames,input:typeof a.input?.isActive==='function',errors:a.frameAudit.errors}})()`);
  ok(loss.replaced && loss.canvases === 1 && loss.backend === 'canvas2d' && loss.accepted > 0 && loss.input && !loss.errors, `context-loss fallback failed: ${JSON.stringify(loss)}`);
  const idb = await evaluate('window.__CELL_SPHERE_APP__.historyPlayback.recentRuns.ready()'); ok(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  return {backend:boot.renderer,score:result.score,elapsed,nodeId,render,idb,metricRects,responsive,terminalLayouts,
    worldmaking:developedEcology,contextLoss:loss};
}

async function evolutionActivationEvidence(t) {
  const{evaluate,key,click,tap,drag,wheel,touchDrag,pinch,touchCancel,wait,screenshot,setViewport}=t;await setViewport(1440,900);await wait(100);
  const semanticTarget=async(requireZero=true)=>evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{MEMORY_NODES}=await import('./src/game/skills/index.js');
    if(a.overlay==='memory-node')a.closeEvolutionCell();const target=a.memorySnapshot.nodeStates.find(n=>n.reason==='ready'&&(${requireZero?'true':'false'}?n.currentLevel==='0':true));
    if(!target)throw new Error('no ready Level 0 cell');return{id:target.id,index:MEMORY_NODES.findIndex(n=>n.id===target.id),level:target.currentLevel,
      events:a.archive.evolution.length,balance:a.meta.echoBalance}})()`);
  const focusTree=async(index)=>evaluate(`(()=>{const b=document.getElementById('evolution-tree').children[${index}];b.focus();return document.activeElement===b})()`);
  const stateFor=(id)=>evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,n=a.memorySnapshot.nodeStates.find(x=>x.id===${JSON.stringify(id)});return{level:n.currentLevel,
    selected:a.memoryUi.selectedId,overlay:a.overlay,events:a.archive.evolution.length,balance:a.meta.echoBalance,status:a.memorySnapshot.memoryStatus[n.cell],
    panel:document.getElementById('memory-node-panel').textContent,action:document.getElementById('memory-unlock').getAttribute('aria-label'),
    tree:[...document.getElementById('evolution-tree').children].find(b=>b.getAttribute('aria-selected')==='true')?.textContent??''}})()`);
  const keyboard=await semanticTarget();ok(await focusTree(keyboard.index),'hidden Evolution tree did not take keyboard focus');await key('Enter');await wait(80);
  const keyboardSelected=await stateFor(keyboard.id);ok(keyboardSelected.level==='0'&&keyboardSelected.events===keyboard.events&&keyboardSelected.selected===keyboard.id
    &&keyboardSelected.overlay==='memory-node'&&keyboardSelected.status===7&&keyboardSelected.panel.includes('Ready to unlock')
    &&keyboardSelected.panel.includes('World Potential')&&keyboardSelected.action.includes('Unlock Level 1')&&keyboardSelected.tree.includes('Activate again'),
    `keyboard first activation did not select ready cell: ${JSON.stringify(keyboardSelected)}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.trophyNotifications.replace({...a.meta,trophyQueue:[]})})()`);
  await screenshot('browser-evolution-selected-ready.png');
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'})})()`);await wait(80);
  await screenshot('browser-evolution-selected-ready-reduced.png');
  ok(await focusTree(keyboard.index),'replacement tree item did not regain keyboard focus');await key('Enter');await wait(100);
  const keyboardBought=await stateFor(keyboard.id);ok(keyboardBought.level==='1'&&keyboardBought.events===keyboard.events+1,
    `keyboard second activation did not buy exactly one level: ${JSON.stringify(keyboardBought)}`);
  await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{validateMeta}=await import('./src/platform/storage.js'),
    {MEMORY_NODE_IDS,buildMemorySnapshot}=await import('./src/game/skills/index.js');a.applySettings({...a.settings,motion:'full'});
    a.__evolutionActivationRestore={meta:a.meta,archive:a.archive};a.meta=validateMeta({...a.meta,evolutionLevels:MEMORY_NODE_IDS.map(id=>({id,level:'1'}))});a.memorySnapshot=buildMemorySnapshot(a.topo,a.meta);
    a.memoryUi.syncTree(a.meta);a.evolutionActivation.lastPurchaseAt=-Infinity;return true})()`);await wait(100);

  const prepareGlobe=async()=>evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{focusCamera}=await import('./src/rendering/camera.js');
    if(a.overlay==='memory-node')a.closeEvolutionCell();const target=a.memorySnapshot.nodeStates.find(n=>n.reason==='ready');
    if(!target)throw new Error('no ready globe cell');focusCamera(a.camera,a.topo.positions.subarray(target.cell*3,target.cell*3+3));
    const r=document.getElementById('gl-canvas').getBoundingClientRect();return{id:target.id,level:target.currentLevel,events:a.archive.evolution.length,
      point:[r.left+r.width/2,r.top+r.height*.25]}})()`);
  let pointer=await prepareGlobe();await drag(pointer.point,[pointer.point[0]+80,pointer.point[1]+45]);await wait(80);
  let cancelled=await stateFor(pointer.id);ok(cancelled.level===pointer.level&&cancelled.events===pointer.events,'drag was misclassified as purchase activation');
  const gestureDoesNotBuy=async(name,action)=>{const target=await prepareGlobe();await action(target.point);await wait(100);const after=await stateFor(target.id);
    ok(after.level===target.level&&after.events===target.events,`${name} was misclassified as purchase activation`)};
  await gestureDoesNotBuy('wheel',(point)=>wheel(...point));
  await gestureDoesNotBuy('touch movement',(point)=>touchDrag(point,[point[0]+75,point[1]+45]));
  await gestureDoesNotBuy('pinch',(point)=>pinch(point));
  await gestureDoesNotBuy('touch cancellation',(point)=>touchCancel(point));
  pointer=await prepareGlobe();await click(...pointer.point);await wait(80);
  const pointerId=await evaluate(`window.__CELL_SPHERE_APP__.memoryUi.selectedId`);let pointerSelected=await stateFor(pointerId);
  ok(pointerId&&pointerSelected.events===pointer.events&&pointerSelected.selected===pointerId&&[7,10].includes(pointerSelected.status),
    `pointer first activation did not only select a ready cell: ${JSON.stringify(pointerSelected)}`);await screenshot('browser-evolution-pointer-ready.png');
  const pointerHit=await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{pickNode}=await import('./src/rendering/picking.js'),{MEMORY_ATLAS_REVERSE,MEMORY_NODES}=await import('./src/game/skills/index.js');
    const p=pickNode(a.canvas,${pointer.point[0]},${pointer.point[1]},a.camera,a.topo),e=document.elementFromPoint(${pointer.point[0]},${pointer.point[1]});return{element:e?.id||e?.className,
      node:p?.node,id:p&&MEMORY_NODES[MEMORY_ATLAS_REVERSE[p.node]]?.id,lastPurchaseAt:a.evolutionActivation.lastPurchaseAt,now:performance.now()}})()`);
  await click(...pointer.point);await wait(100);let pointerBought=await stateFor(pointerId);
  ok(BigInt(pointerBought.level)===BigInt(pointerSelected.level)+1n&&pointerBought.events===pointer.events+1,`pointer second activation failed: ${JSON.stringify({pointerBought,pointerHit,point:pointer.point})}`);pointer.id=pointerId;await wait(400);

  const touch=await prepareGlobe();await tap(...touch.point);await wait(80);const touchId=await evaluate(`window.__CELL_SPHERE_APP__.memoryUi.selectedId`);
  let touchSelected=await stateFor(touchId);
  ok(touchId&&touchSelected.events===touch.events&&touchSelected.selected===touchId&&[7,10].includes(touchSelected.status),
    `touch first activation did not only select a ready cell: ${JSON.stringify(touchSelected)}`);
  await tap(...touch.point);await wait(100);let touchBought=await stateFor(touchId);
  ok(BigInt(touchBought.level)===BigInt(touchSelected.level)+1n&&touchBought.events===touch.events+1,`touch second activation failed: ${JSON.stringify(touchBought)}`);touch.id=touchId;await wait(400);

  const explicit=await semanticTarget(false);ok(await focusTree(explicit.index),'explicit-button setup could not focus tree');await key('Enter');await wait(80);
  const explicitSelected=await stateFor(explicit.id);ok(explicitSelected.level===explicit.level&&explicitSelected.events===explicit.events,'button setup selection purchased unexpectedly');
  await trustedId(t,'memory-unlock');await wait(100);const explicitBought=await stateFor(explicit.id);
  ok(BigInt(explicitBought.level)===BigInt(explicitSelected.level)+1n&&explicitBought.events===explicit.events+1,`explicit purchase button failed: ${JSON.stringify(explicitBought)}`);
  const extreme=await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,id=${JSON.stringify(explicit.id)},level='8'.repeat(1019),balance='9'.repeat(4096),
    {buildMemorySnapshot}=await import('./src/game/skills/index.js');a.closeEvolutionCell();a.meta={...a.meta,evolutionLevels:[{id,level}],echoBalance:balance,totalEchoes:balance};
    a.memorySnapshot=buildMemorySnapshot(a.topo,a.meta);a.memoryUi.syncTree(a.meta);a.selectEvolutionCell(id);
    const action=document.getElementById('memory-unlock'),exact=action.dataset.exactValue;
    return{levelDigits:level.length,balanceDigits:balance.length,costDigits:exact.length,action:action.textContent,noDetailAction:!document.querySelector('#memory-node-meta button'),
      horizontal:document.documentElement.scrollWidth>innerWidth}})()`);
  ok(extreme.levelDigits===1019&&extreme.balanceDigits===4096&&extreme.costDigits>2000&&extreme.noDetailAction
    &&/Upgrade(?: to)? Level/.test(extreme.action)&&!extreme.horizontal,`extreme progression detail failed: ${JSON.stringify(extreme)}`);
  await assertSkillGeometry(t);await screenshot('browser-evolution-extreme-exact.png');
  await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,saved=a.__evolutionActivationRestore,{buildMemorySnapshot}=await import('./src/game/skills/index.js'),
    {saveMeta}=await import('./src/platform/storage.js'),{saveHistory}=await import('./src/platform/history.js');a.meta=saved.meta;a.archive=saved.archive;
    a.memorySnapshot=buildMemorySnapshot(a.topo,a.meta);a.memoryUi.syncTree(a.meta);a.trophyNotifications.replace(a.meta);saveMeta(a.meta);saveHistory(a.archive,a.settings.historyRetention);
    delete a.__evolutionActivationRestore;return true})()`);
  return{keyboard:{id:keyboard.id,before:keyboard.level,after:keyboardBought.level},pointer:{id:pointer.id,after:pointerBought.level},
    touch:{id:touch.id,after:touchBought.level},button:{id:explicit.id,after:explicitBought.level}};
}

async function runIdentityMigrationScenario({ evaluate, wait, poll }, initialBoot) {
  ok(initialBoot.product === 'cell-sphere-game' && initialBoot.tagline === 'Every extinction becomes memory.', 'canonical boot identity missing');
  await evaluate(`(()=>{const old=['incremental','network','game'].join('-');localStorage.clear();
    const meta={schema:8,bestScore:424242,totalEchoes:321,echoBalance:123,runs:7,worldSeedIndex:11,
      resultKeys:['legacy-result-key'],memoryNodes:['reach-horizon-instinct'],quarantinedMemoryNodes:[],imprints:[],
      trophyIds:['evolution-first-world'],legacyTrophyIds:['reach-river-touch'],trophyQueue:['evolution-first-world'],trophyBackfillVersion:2,
      trophyProgress:{version:3,adaptationIds:['long-filaments'],geographyMask:1,geographyVersion:3,crisisMask:2,adaptationCategoryMask:1,lakeTypeMask:1,lakeSalinityMask:1,aggregate:{totalCrisesEndured:4}}};
    const history={schema:4,worlds:[{id:'legacy-world',seed:17,tick:900,score:424242,rank:'Canopy',cause:'starvation',archetype:'Legacy World',echo:9,hash:'abcdef',inoculationCell:4,adaptations:[],events:[]}],memory:[{seq:0,nodeId:'reach-horizon-instinct',cost:1,balance:123,run:7}],trophies:[{seq:0,tick:900,kind:'trophy',importance:3,key:'trophy.earned',subjectId:'evolution-first-world',primaryCells:[],worldId:'legacy-world',run:7}]};
    const settings={schema:3,motion:'reduced',contrast:'high',quality:'eco',cameraInertia:false,idleRotation:'off',adaptationMode:'manual',autoContinue:false,pauseOnPanels:true,speed:16,historyRetention:32};
    localStorage.setItem(old+':meta:v1',JSON.stringify(meta));localStorage.setItem(old+':history:v2',JSON.stringify(history));localStorage.setItem(old+':settings:v3',JSON.stringify(settings));location.reload();return true})()`);
  await wait(1800); ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'legacy namespace reload failed');
  const migrated = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__,old=['incremental','network','game'].join('-');
    const canonical=Object.fromEntries(['meta','settings','history'].map(k=>[k,localStorage.getItem(b.storage[k])]));
    return {score:a.meta.bestScore,legacyScore:a.meta.legacyBestScore,total:a.meta.totalEchoes,balance:a.meta.echoBalance,runs:a.meta.runs,seed:a.meta.worldSeedIndex,
      keys:a.meta.resultKeys.slice(),levels:a.meta.evolutionLevels.map(x=>({...x})),trophies:a.meta.trophyIds.slice(),legacy:a.meta.legacyTrophyIds.slice(),queue:a.meta.trophyQueue.slice(),
      history:a.archive.worlds.map(w=>w.id),motion:a.settings.motion,speed:a.settings.speed,canonical:Object.values(canonical).every(Boolean),
      old:Object.values({m:localStorage.getItem(old+':meta:v1'),s:localStorage.getItem(old+':settings:v3'),h:localStorage.getItem(old+':history:v2')}).every(Boolean)}})()`);
  ok(migrated.score === '0' && migrated.legacyScore === '424242' && migrated.total === '321' && migrated.balance === '123' && migrated.runs === '7' && migrated.seed === '11'
    && migrated.keys[0] === 'legacy-result-key' && migrated.levels[0].id === 'reach-horizon-instinct' && migrated.levels[0].level === '1'
    && migrated.trophies[0] === 'evolution-first-world' && migrated.legacy[0] === 'reach-river-touch'
    && migrated.queue[0] === 'evolution-first-world' && migrated.history[0] === 'legacy-world'
    && migrated.motion === 'reduced' && migrated.speed === 8 && migrated.canonical && migrated.old,
  `browser namespace migration lost state: ${JSON.stringify(migrated)}`);
  const exported = await evaluate(`(async()=>{const old=['incremental','network','game'].join('-'),a=window.__CELL_SPHERE_APP__;
    const data=await import('./src/interface/app-data.js'),migration=await import('./src/platform/namespace-migration.js');
    const parsed=data.parseImportedData(JSON.stringify({schema:1,product:old,meta:a.meta,history:a.archive,settings:a.settings}));
    const saved=migration.saveImportedNamespace(parsed),fresh=JSON.parse(data.serializeExportData(parsed.meta,parsed.history,parsed.settings));
    const raw=JSON.parse(localStorage.getItem(old+':meta:v1'));raw.totalEchoes=999999;raw.echoBalance=999999;raw.runs=99;
    localStorage.setItem(old+':meta:v1',JSON.stringify(raw));return {saved,product:fresh.product,total:fresh.meta.totalEchoes}})()`);
  ok(exported.saved.ok && exported.product === 'cell-sphere-game' && exported.total === '321', `legacy import/canonical export failed: ${JSON.stringify(exported)}`);
  await evaluate('location.reload();true'); await wait(1800);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'coexistence reload failed');
  const coexist = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {total:a.meta.totalEchoes,balance:a.meta.echoBalance,runs:a.meta.runs,keys:a.meta.resultKeys}})()`);
  ok(coexist.total === '321' && coexist.balance === '123' && coexist.runs === '7' && coexist.keys.length === 1,
    `legacy namespace overrode canonical or duplicated rewards: ${JSON.stringify(coexist)}`);
  await evaluate('localStorage.clear();location.reload();true'); await wait(1800);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'fresh canonical reload failed');
  const fresh = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__;return {boot:b,defaults:a.meta.runs==='0'&&a.meta.totalEchoes==='0',
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
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,old=a.worldIdentity.worldSessionId,make=a.makeRenderer.bind(a);a.__firstReplacementFrame=null;a.makeRenderer=(...args)=>{make(...args);const r=a.renderer,render=r.render.bind(r);r.render=s=>{const snap=s.snapshot,target=snap?.worldSessionId!==old;if(!target)return render(s);const count=v=>v?[...v].reduce((n,x)=>n+(x!==0),0):0,before={blank:snap?.blank===true,status:snap?.status,life:count(snap?.lifeState)+count(snap?.biomass),events:count(snap?.eventStrength),highlights:s.highlightedCells?.length??0};const accepted=render(s);a.__firstReplacementFrame={backend:r.backend,accepted,before,after:r.lastFrameAudit,presentation:a.presentationAudit.lastBlank};r.render=render;a.makeRenderer=make;return accepted}}})()`);
}
export function assertBlankReplacement(frame, label) { ok(frame?.accepted && frame.before.blank && frame.before.status === 'starting', `${label} first replacement was not blank`); ok(frame.before.life === 0 && frame.before.events === 0 && frame.before.highlights === 0, `${label} retained presentation`); ok(frame.after?.lifeCells === 0 && frame.after?.eventCells === 0, `${label} retained renderer buffers`); if (frame.backend === 'webgl2') ok(frame.after.dynamic?.life === 0 && frame.after.dynamic?.events === 0, 'WebGL2 dynamic buffers not clear'); }
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
