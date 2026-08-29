/** Trusted-CDP production evidence for the unified shell vertical slice. */
import { assertSkillGeometry } from './evidence.mjs';
import { verifyKeyboardInspector } from './inspector-scenario.mjs';
import { measureLuminousHierarchy } from './luminous-fixture.mjs';
import { verifyResultContinuation } from './result-continuation-scenario.mjs';
export { runEnvironmentPressureScenario } from './environment-pressure-scenario.mjs';
export async function runScenario(t) {
  const { evaluate, wait, poll, errors, click, tap, drag, screenshot, setViewport, setMedia, key } = t;
  let boot = await evaluate('window.__CELL_SPHERE_BOOT__'); ok(boot?.playable, 'app did not boot');
  boot = await runStorageResetScenario(t, boot);
  const publicSpeeds = await evaluate(`(()=>({runtime:[...document.getElementById('speed-select').options].map(o=>Number(o.value)),menuSpeed:Boolean(document.getElementById('settings-speed')),dev:window.__CELL_SPHERE_BOOT__.developerMode,marker:document.getElementById('dev-mode-marker').hidden,agent:Object.hasOwn(window,'__CSG_AGENT__')}))()`);
  ok(publicSpeeds.runtime.join(',') === '0.25,0.5,0.75,1,1.25,1.5' && !publicSpeeds.menuSpeed
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
  const keyboardInspector=await verifyKeyboardInspector(t);
  const setDialSpeed = (speed) => evaluate(`(()=>{const s=document.getElementById('speed-select');s.value='${speed}';s.dispatchEvent(new Event('change'))})()`);
  await setDialSpeed(0.5);
  const dial = () => evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,m=document.querySelector('.clock-minute'),h=document.querySelector('.clock-hour');return {phase:a.timeDial.state.phase,hourPhase:a.timeDial.state.hourPhase,minute:m.style.transform,hour:h.style.transform,minuteWidth:getComputedStyle(m).width,hourWidth:getComputedStyle(h).width}})()`);
  const fullDialBefore = await dial(); await wait(300); const fullDialAfter = await dial();
  const fullDialTurn = (fullDialAfter.phase - fullDialBefore.phase + 360) % 360;
  const fullHourTurn = (fullDialAfter.hourPhase - fullDialBefore.hourPhase + 360) % 360;
  ok(fullDialTurn > 0 && fullHourTurn > 0 && fullDialBefore.minute !== fullDialAfter.minute && fullDialBefore.hour !== fullDialAfter.hour
    && fullDialBefore.minuteWidth === fullDialBefore.hourWidth,
    `clock hands did not move or match width: ${JSON.stringify({ fullDialBefore, fullDialAfter })}`);
  await setDialSpeed(1.5); const fastDialBefore = await dial(); await wait(300); const fastDialAfter = await dial();
  const fastDialTurn = (fastDialAfter.phase - fastDialBefore.phase + 360) % 360;
  const fastHourTurn = (fastDialAfter.hourPhase - fastDialBefore.hourPhase + 360) % 360;
  ok(fastDialTurn > fullDialTurn && fastHourTurn > fullHourTurn,
    `clock did not follow world speed: ${JSON.stringify({ fullDialTurn, fullHourTurn, fastDialTurn, fastHourTurn })}`);
  await setDialSpeed(0.5); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'})})()`);
  const reducedDialBefore = await dial(); await wait(600); const reducedDialAfter = await dial();
  const reducedDialTurn = (reducedDialAfter.phase - reducedDialBefore.phase + 360) % 360;
  const reducedHourTurn = (reducedDialAfter.hourPhase - reducedDialBefore.hourPhase + 360) % 360;
  ok(reducedDialTurn > 0 && reducedHourTurn > 0 && reducedDialBefore.minute !== reducedDialAfter.minute
    && reducedDialBefore.hour !== reducedDialAfter.hour, `reduced clock stopped: ${JSON.stringify({ reducedDialBefore, reducedDialAfter })}`);
  await setDialSpeed(1.5); const reducedFastBefore = await dial(); await wait(600); const reducedFastAfter = await dial();
  const reducedFastTurn = (reducedFastAfter.phase - reducedFastBefore.phase + 360) % 360;
  const reducedFastHourTurn = (reducedFastAfter.hourPhase - reducedFastBefore.hourPhase + 360) % 360;
  ok(reducedFastTurn > reducedDialTurn && reducedFastHourTurn > reducedHourTurn,
    `reduced clock did not follow world speed: ${JSON.stringify({ reducedDialTurn, reducedHourTurn, reducedFastTurn, reducedFastHourTurn })}`);
  await setDialSpeed(1); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'})})()`);
  const cameraBefore = await evaluate(`({camera:window.__CELL_SPHERE_APP__.camera.direction.slice(),tick:window.__CELL_SPHERE_APP__.snapshot.tick})`);
  await trustedId(t, 'scene-evolution'); await wait(300);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.scene==='evolution'&&window.__CELL_SPHERE_APP__.phase==='running'&&window.__CELL_SPHERE_APP__.memorySnapshot.nodeStates.length===42`), 'Evolution scene replaced authority');
  const reducedSceneActions = await evaluate(`(()=>({focus:!document.getElementById('evolution-focus-available'),trophyFocus:!document.getElementById('trophy-focus'),sceneHistory:[...document.querySelectorAll('#memory-screen .history-open,#trophy-screen .history-open')].length,activeNext:document.getElementById('restart-button').hidden&&document.getElementById('trophy-next-button').hidden}))()`);
  ok(reducedSceneActions.focus && reducedSceneActions.trophyFocus && reducedSceneActions.sceneHistory === 0 && reducedSceneActions.activeNext, `scene controls remain: ${JSON.stringify(reducedSceneActions)}`);
  const activeUpgrade=await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{validateMeta}=await import('./src/platform/storage.js'),
    {buildMemorySnapshot}=await import('./src/game/skills/index.js');a.__runningEvolutionMeta=a.meta;
    a.meta=validateMeta({...a.meta,echoBalance:'1000000'});a.memorySnapshot=buildMemorySnapshot(a.topo,a.meta);
    const target=a.memorySnapshot.nodeStates.find((node)=>node.reason==='ready');a.selectEvolutionCell(target.id);
    const button=document.getElementById('memory-unlock');return{id:target.id,disabled:button.disabled,text:button.textContent,
      label:button.getAttribute('aria-label'),panel:document.getElementById('memory-node-panel').textContent}})()`);
  ok(activeUpgrade.disabled&&activeUpgrade.text==='Evolution after this World'&&activeUpgrade.label.includes('after this World')
    &&activeUpgrade.panel.includes('Evolution is available after this World'),`active-world Evolution upgrade did not explain its availability: ${JSON.stringify(activeUpgrade)}`);
  await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{buildMemorySnapshot}=await import('./src/game/skills/index.js');
    a.meta=a.__runningEvolutionMeta;delete a.__runningEvolutionMeta;a.closeEvolutionCell();a.memorySnapshot=buildMemorySnapshot(a.topo,a.meta);return true})()`);
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
  const environmentControl = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=document.getElementById('environment-level-button'),entropy=document.getElementById('entropy-button');return {tag:b?.tagName,height:b?.getBoundingClientRect().height,controls:b?.getAttribute('aria-controls'),label:b?.getAttribute('aria-label'),entropy:entropy===null,tick:a.snapshot.tick}})()`);
  ok(environmentControl.tag === 'BUTTON' && environmentControl.height >= 44 && environmentControl.controls === 'metric-dialog'
    && environmentControl.label.includes('activate to view current pressure') && environmentControl.entropy, `Environment control semantics failed: ${JSON.stringify(environmentControl)}`);
  await trustedId(t, 'environment-level-button'); await wait(120);
  const environmentDetail = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=document.getElementById('environment-level-button');return {overlay:a.overlay,kind:a.metricUi.kind,heading:document.getElementById('metric-heading').textContent,expanded:b.getAttribute('aria-expanded'),focus:document.activeElement?.id,history:document.getElementById('history-dialog').hidden,rangeInside:document.querySelector('#metric-dialog #history-range')!==null,summary:document.getElementById('metric-summary').textContent,conditions:document.getElementById('metric-conditions').textContent}})()`);
  ok(environmentDetail.overlay === 'metric' && environmentDetail.kind === 'environment' && environmentDetail.heading === 'ENVIRONMENT LEVEL'
    && environmentDetail.expanded === 'true' && environmentDetail.focus === 'metric-heading' && environmentDetail.history && !environmentDetail.rangeInside
    && environmentDetail.summary.includes('Finite resources') && environmentDetail.conditions.includes('Strongest current pressure'),
  `Environment detail route failed: ${JSON.stringify(environmentDetail)}`);
  const environmentCadence = await evaluate(`(async()=>{const {BALANCE}=await import('./src/game/balance.js');return new Promise((resolve)=>{const a=window.__CELL_SPHERE_APP__,direct=document.getElementById('metric-direct'),update=a.metricUi.update.bind(a.metricUi),replace=direct.replaceChildren.bind(direct),startTick=a.snapshot.tick;let updates=0,renders=0;a.metricUi.update=(...args)=>{updates++;return update(...args)};direct.replaceChildren=(...args)=>{renders++;return replace(...args)};setTimeout(()=>{a.metricUi.update=update;delete direct.replaceChildren;const tick=a.snapshot.tick,maximumRenders=Math.ceil((tick-startTick)/BALANCE.TICKS_PER_SECOND)+1;resolve({updates,renders,startTick,tick,maximumRenders})},650)})})()`);
  ok(environmentCadence.updates >= 2 && environmentCadence.renders <= environmentCadence.maximumRenders,
    `Environment detail rendered more often than one game-time second: ${JSON.stringify(environmentCadence)}`);
  const environmentBefore = await evaluate(`(()=>({tick:window.__CELL_SPHERE_APP__.snapshot.tick,conditions:document.getElementById('metric-conditions').textContent}))()`);
  await setDialSpeed(1.5); await wait(650);
  const environmentAfter = await evaluate(`(()=>({tick:window.__CELL_SPHERE_APP__.snapshot.tick,conditions:document.getElementById('metric-conditions').textContent}))()`);
  await setDialSpeed(1);
  ok(environmentAfter.tick > environmentBefore.tick && environmentAfter.conditions !== environmentBefore.conditions,
    `Environment detail did not update from bounded authoritative snapshots: ${JSON.stringify({ environmentBefore, environmentAfter })}`);
  await drag([960, 360], [1080, 410]); ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='metric'`), 'globe drag dismissed Environment detail');
  await trustedId(t, 'environment-level-button'); await wait(80);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay===null&&document.getElementById('environment-level-button').getAttribute('aria-expanded')==='false'&&document.activeElement===document.getElementById('environment-level-button')`), 'Environment detail did not toggle closed and restore focus');
  await setViewport(1440, 900); await wait(180); const metricRects = {};
  for (const kind of ['score', 'reach']) {
    await trustedId(t, `${kind}-button`); await wait(150); const first = await shellRect(evaluate);
    await wait(450); const second = await shellRect(evaluate); metricRects[kind] = second;
    ok(first.surface === 'metric' && sameRect(first, second, .25), `${kind} metric shell jittered`);
    const semantics = await evaluate(`(()=>{const b=document.getElementById('${kind}-button'),a=window.__CELL_SPHERE_APP__;return {tag:b.tagName,h:b.getBoundingClientRect().height,expanded:b.getAttribute('aria-expanded'),controls:b.getAttribute('aria-controls'),overlay:a.overlay,active:a.surfaces.active,kind:a.metricUi.kind,hidden:document.getElementById('context-shell').hidden}})()`);
    ok(semantics.tag === 'BUTTON' && semantics.h >= 44 && semantics.expanded === 'true' && semantics.controls === 'metric-dialog', `${kind} semantics failed: ${JSON.stringify(semantics)}`);
    if (kind !== 'reach') await trustedId(t, `${kind}-button`);
  }
  ok(sameRect(metricRects.score, metricRects.reach, .25), 'metric kinds changed outer geometry');
  await evaluate(`document.getElementById('metric-body').scrollTop=40`); const scrollBefore = await evaluate(`document.getElementById('metric-body').scrollTop`);
  await drag([940, 350], [1080, 430]); await wait(100);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='metric'&&!document.getElementById('metric-dialog').hidden`), 'globe drag dismissed metric');
  ok(await evaluate(`document.getElementById('metric-body').scrollTop`) === scrollBefore, 'metric drag lost scroll state');
  await trustedId(t, 'metric-close');
  const responsive = [];
  for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932], [768, 1024], [844, 390], [1024, 600], [1440, 900]]) {
    await setViewport(width, height); await wait(120); await trustedId(t, 'score-button'); await wait(60);
    const evidence = await layoutEvidence(evaluate); responsive.push({ width, height, ...evidence });
    ok(evidence.noOverflow && evidence.controlsBounded && evidence.selectorMin >= 44 && evidence.metricMin >= 44
      && !evidence.metricDockOverlap && !evidence.metricShellOverlap,
    `responsive shell failed ${width}x${height}: ${JSON.stringify(evidence)}`); await trustedId(t, 'metric-close');
  }
  const environmentResponsive = [];
  for (const [width, height] of [[320, 568], [844, 390]]) {
    await setViewport(width, height); await wait(120); await trustedId(t, 'environment-level-button'); await wait(80);
    const evidence = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,metric=document.getElementById('environment-level-button').getBoundingClientRect(),shell=document.getElementById('context-shell').getBoundingClientRect(),overlap=!(metric.right<=shell.left||metric.left>=shell.right||metric.bottom<=shell.top||metric.top>=shell.bottom);return {noOverflow:document.documentElement.scrollWidth<=innerWidth,overlay:a.overlay,kind:a.metricUi.kind,heading:document.getElementById('metric-heading').textContent,metricVisible:metric.bottom>0&&metric.top<innerHeight,metricShellOverlap:overlap,history:document.getElementById('history-dialog').hidden}})()`);
    environmentResponsive.push({ width, height, ...evidence });
    ok(evidence.noOverflow && evidence.overlay === 'metric' && evidence.kind === 'environment' && evidence.heading === 'ENVIRONMENT LEVEL'
      && evidence.metricVisible && !evidence.metricShellOverlap && evidence.history,
    `Environment detail responsive shell failed ${width}x${height}: ${JSON.stringify(evidence)}`);
    await trustedId(t, 'environment-level-button');
  }
  await setViewport(390, 844);
  const metricThresholds = await evaluate(`(async()=>{const ids={score:'hud-score',reach:'hud-reach',environment:'hud-environment-level'},rect=id=>{const r=document.getElementById(id).closest('button').getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},original=Object.fromEntries(Object.entries(ids).map(([key,id])=>[key,document.getElementById(id).textContent])),sample=(key,values)=>values.map(value=>{document.getElementById(ids[key]).textContent=value;return{value,...rect(ids[key])}}),result={score:sample('score',['0','9','10','999','1,000','99,999','1.00e6']),reach:sample('reach',['0%','<0.1% · 1 cell','9.9%','10%','100%']),environment:sample('environment',['0','9','10','999'])};for(const[key,id]of Object.entries(ids))document.getElementById(id).textContent=original[key];const a=window.__CELL_SPHERE_APP__,{updateHud}=await import('./src/interface/surfaces.js'),full='9'+'0'.repeat(30),before=rect(ids.score);updateHud(a.el,{...a.snapshot,metrics:{...a.snapshot.metrics,score:full}});const exact={full,visible:document.getElementById(ids.score).textContent,accessible:document.getElementById('score-button').getAttribute('aria-label'),before,after:rect(ids.score)};updateHud(a.el,a.snapshot);return{...result,exact,noOverflow:document.documentElement.scrollWidth<=innerWidth}})()`);
  const stableSlot = (samples) => samples.every((sample) => Math.abs(sample.width - samples[0].width) <= .25 && Math.abs(sample.height - samples[0].height) <= .25);
  ok(metricThresholds.noOverflow && stableSlot(metricThresholds.score) && stableSlot(metricThresholds.reach) && stableSlot(metricThresholds.environment)
    && metricThresholds.exact.visible !== metricThresholds.exact.full && metricThresholds.exact.accessible === `SCORE ${metricThresholds.exact.full}; activate to view score details` && sameRect(metricThresholds.exact.before, metricThresholds.exact.after, .25),
    `metric threshold geometry shifted: ${JSON.stringify(metricThresholds)}`);
  const accessibilityMatrix = await evaluate(`(()=>{const root=document.documentElement,tabs=[...document.querySelectorAll('#scene-selector [role=tab]')],labels=tabs.map(x=>x.firstChild.nodeValue);root.style.fontSize='32px';root.dataset.motion='reduced';root.dataset.contrast='high';tabs[2].firstChild.nodeValue='Evolution inherited ecological capabilities';const rects=tabs.map(x=>x.getBoundingClientRect()),values={noOverflow:document.documentElement.scrollWidth<=innerWidth,labelsContained:tabs.every(x=>getComputedStyle(x).overflow==='hidden')&&rects.every((r,i)=>!i||r.left>=rects[i-1].right-1),motion:getComputedStyle(root).getPropertyValue('--dur-base').trim(),border:getComputedStyle(document.getElementById('scene-selector')).borderTopWidth};tabs.forEach((x,i)=>x.firstChild.nodeValue=labels[i]);root.style.fontSize='';root.dataset.motion='full';root.dataset.contrast='normal';return values})()`);
  ok(accessibilityMatrix.noOverflow && accessibilityMatrix.labelsContained && accessibilityMatrix.motion === '0ms' && accessibilityMatrix.border !== '0px', `accessibility matrix failed: ${JSON.stringify(accessibilityMatrix)}`);
  await setViewport(360, 640); await evaluate(`document.documentElement.style.fontSize='32px'`); await wait(140); await trustedId(t, 'menu-button');
  const menu = await evaluate(`(()=>({overlay:window.__CELL_SPHERE_APP__.overlay,heading:document.getElementById('menu-world-heading').textContent,newWorld:document.getElementById('menu-new-world').offsetHeight,history:document.getElementById('menu-history').offsetHeight,dataOpen:document.querySelector('.data-reset').open,noOverflow:document.documentElement.scrollWidth<=innerWidth,retired:['menu-home','menu-evolution','menu-trophies','menu-result','settings-speed','camera-reset','settings-version'].every(id=>!document.getElementById(id)),retention:!document.querySelector('[name="historyRetention"]'),pause:!document.querySelector('[name="pauseOnPanels"]'),inertia:!document.querySelector('[name="cameraInertia"]'),rotation:!document.querySelector('[name="idleRotation"]'),luminous:!document.querySelector('option[value="luminous"]')}))()`);
  ok(menu.overlay==='menu'&&menu.heading==='World'&&menu.newWorld>=44&&menu.history>=44&&!menu.dataOpen&&menu.noOverflow&&menu.retired&&menu.retention&&menu.pause&&menu.inertia&&menu.rotation&&menu.luminous, `Menu simplification failed: ${JSON.stringify(menu)}`);
  await evaluate(`document.documentElement.style.fontSize=''`); await trustedId(t, 'menu-new-world');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='new-world'&&!document.getElementById('new-world-dialog').hidden`), 'New World confirmation did not replace Menu');
  await wait(80); const tickBeforeConfirm = await evaluate('window.__CELL_SPHERE_APP__.snapshot.tick'); await wait(220);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.snapshot.tick`) === tickBeforeConfirm, 'confirmation did not own its pause');
  await trustedId(t, 'new-world-keep'); ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.snapshot.tick'), (tick) => tick > tickBeforeConfirm, 1500), 'Keep watching did not resume');
  const run2StartedAt = performance.now(); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,save=a.historyPlayback.save.bind(a.historyPlayback);a.__terminalVisualSaves=[];a.historyPlayback.save=(...args)=>{a.__terminalVisualSaves.push(args[1] instanceof ArrayBuffer);return save(...args)};const s=document.getElementById('speed-select');s.value='1.5';s.dispatchEvent(new Event('change'))})()`);
  await setViewport(1440, 900); await wait(120); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,send=a.driver.message.bind(a.driver);a.__historyDeferred=[];a.__historyOriginalMessage=send;a.driver.message=value=>value.t==='history-buffer'?(a.__historyDeferred.push(value),true):send(value)})()`); await trustedId(t, 'menu-button'); await trustedId(t, 'menu-history'); await wait(160);
  const history = await shellRect(evaluate); const historyLoading=await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{snapshot:Boolean(a.historySnapshot),active:a.historyPlaybackActive,rangeDisabled:document.getElementById('history-range').disabled,noteHidden:document.getElementById('history-visual-note').hidden,note:document.getElementById('history-visual-note').textContent,time:document.getElementById('history-time-label').textContent}})()`);ok(!historyLoading.snapshot&&!historyLoading.active&&historyLoading.rangeDisabled&&!historyLoading.noteHidden&&historyLoading.note.includes('Loading')&&!historyLoading.time.includes('historical visual checkpoint'),`History loading presented a false checkpoint: ${JSON.stringify(historyLoading)}`);await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.driver.message=a.__historyOriginalMessage;a.__historyOriginalMessage(a.__historyDeferred.pop());delete a.__historyDeferred;delete a.__historyOriginalMessage})()`);ok(history.surface === 'history' && history.left < 30 && history.width <= 520, 'History is not the desktop left shell');
  const historyTracks = await evaluate(`(()=>{const panel=document.getElementById('history-dialog'),body=panel.querySelector('.history-body'),timeline=panel.querySelector('.history-timeline'),p=panel.getBoundingClientRect(),b=body.getBoundingClientRect();return {bodyBounded:b.top>=p.top&&b.bottom<=p.bottom+1,bodyOverflow:getComputedStyle(body).overflowY,timelineOverflow:getComputedStyle(timeline).overflowY,tracks:getComputedStyle(panel).gridTemplateRows.split(' ').length}})()`);
  ok(historyTracks.bodyBounded && historyTracks.bodyOverflow === 'auto' && historyTracks.timelineOverflow !== 'auto' && historyTracks.tracks === 3, `History shell tracks failed: ${JSON.stringify(historyTracks)}`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.historyPlayback.pendingRequests'), (count) => count === 0, 2500), 'History visual request did not settle');
  await trustedId(t, 'history-prev'); ok(await poll(() => evaluate('Boolean(window.__CELL_SPHERE_APP__.historySnapshot)'), Boolean, 1200), 'History previous event did not show a visual preview'); const historyVisual=await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=a.historySnapshot;return{visual:s?.historyVisual,active:a.historyPlaybackActive,resource:s?.resourceState?.length,transform:s?.transformationState?.length,charge:s?.electricityQ?.length,development:s?.luminousDevelopment,time:document.getElementById('history-time-label').textContent,rangeDisabled:document.getElementById('history-range').disabled}})()`);ok(historyVisual.visual&&historyVisual.active&&historyVisual.resource===2562&&historyVisual.transform===2562&&historyVisual.charge===2562&&historyVisual.development>=0&&historyVisual.time.includes('historical visual checkpoint')&&!historyVisual.rangeDisabled,`History visual channels were not atomically projected: ${JSON.stringify(historyVisual)}`);
  await trustedId(t, 'history-live'); ok(await evaluate('window.__CELL_SPHERE_APP__.historySnapshot===null&&!window.__CELL_SPHERE_APP__.historyPlaybackActive'), 'History Live did not restore the authoritative snapshot'); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.closeActiveOverlay();a.openHistory('current')})()`); ok(await poll(()=>evaluate('window.__CELL_SPHERE_APP__.historyPlayback.pendingRequests'),count=>count===0,2500),'un-deferred History request did not settle');const unDeferredHistory=await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{snapshot:Boolean(a.historySnapshot),active:a.historyPlaybackActive,time:document.getElementById('history-time-label').textContent,rangeDisabled:document.getElementById('history-range').disabled}})()`);ok(!unDeferredHistory.snapshot&&!unDeferredHistory.active&&unDeferredHistory.time.includes('Live state')&&!unDeferredHistory.rangeDisabled,`History initial Live state diverged by authority path: ${JSON.stringify(unDeferredHistory)}`);
  const timelineRefresh = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,original=a.currentHistory.slice(),seq=Math.max(-1,...original.map(e=>e.seq))+1,record={seq,tick:a.snapshot.tick,kind:'trophy',key:'trophy.earned',subjectId:'timeline-refresh-proof',primaryCells:[]};a.mergeHistory([record]);const visible=[...document.querySelectorAll('#history-list .history-entry')].some(node=>node.textContent.includes('Trophy preserved · Proof'));a.currentHistory=original;a.historyUi.updateCurrentWorld({events:original,tick:a.snapshot.tick,liveTick:a.snapshot.tick});a.metricUi.update(a.metricModel());return{visible,world:a.historyUi.selectedWorld?.id}})()`);
  ok(timelineRefresh.visible && timelineRefresh.world === 'current', `live History Timeline did not refresh: ${JSON.stringify(timelineRefresh)}`);
  const historyCamera = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()'); await drag([960, 360], [1080, 410]);
  ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='history'`), 'globe drag dismissed History');
  await trustedId(t, 'history-close'); ok(distance(historyCamera, await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()')) > 0, 'globe drag did not rotate');
  const localEcology = await evaluate(`(()=>{const s=window.__CELL_SPHERE_APP__.snapshot,q=[...(s.resourceRichnessQ||[])],states=[...new Set(s.resourceState||[])];return {states,min:q.length?Math.min(...q):0,max:q.length?Math.max(...q):0,alive:s.metrics?.aliveCount||0,reach:s.metrics?.peakReach||0}})()`);
  ok(localEcology.states.length >= 3 && localEcology.max - localEcology.min > 40 && localEcology.alive > 0,
    `local resource ecology missing in production snapshot: ${JSON.stringify(localEcology)}`);
  await screenshot('browser-world-local-resources.png');
  const developedEcology = await evaluate(`(async()=>{const [{RunController},{compileEvolution,MEMORY_NODE_IDS,evolutionRunConfiguration}]=await Promise.all([import('./src/simulation/simulator.js'),import('./src/game/skills/index.js')]);const m=compileEvolution({evolutionLevels:MEMORY_NODE_IDS.map(id=>({id,level:'20'}))}),c=new RunController({seed:9099,worldOrdinal:'20',...evolutionRunConfiguration(m)});c.start();c.advance(800);const a=window.__CELL_SPHERE_APP__,firstM=compileEvolution({evolutionLevels:['first-division','reliable-budding','bioelectric-spark'].map(id=>({id,level:'1'}))}),first=new RunController({seed:19,worldOrdinal:'20',...evolutionRunConfiguration(firstM)});first.start();first.advance(300);const firstSnapshot={...first.snapshot(),...a.worldIdentity};a.__firstLuminousSnapshot=firstSnapshot;const mid=c.snapshot();c.advance(4000);a.pause.set('browser-luminous',true);a.__luminousDecaySnapshot={...c.snapshot(),...a.worldIdentity};const s={...mid,...a.worldIdentity};a.historySnapshot=s;a.historyPlaybackActive=true;return {transformStates:[...new Set(s.transformationState)],transformed:[...s.transformationState].filter(Boolean).length,powered:[...s.electricityQ].filter(Boolean).length,firstPowered:[...firstSnapshot.electricityQ].filter(Boolean).length,alive:s.metrics.aliveCount}})()`);
  ok(developedEcology.transformStates.filter(Boolean).length>=3&&developedEcology.transformStates.includes(3)
    &&developedEcology.transformStates.includes(5)&&developedEcology.transformed>50
    && developedEcology.powered > 50 && developedEcology.firstPowered > 0 && developedEcology.alive > 0,
  `developed ecology fixture missing production mechanics: ${JSON.stringify(developedEcology)}`);
  await wait(120);await screenshot('browser-world-transformations.png');
  const focusCharge=async(day)=>evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{focusCamera}=await import('./src/rendering/camera.js'),s=a.historySnapshot,p=a.topo.positions,q=s.electricityQ,sun=[-.52,.72,.44];let cell=-1,charge=-1,dot=0;for(let i=0;i<q.length;i++){const d=p[i*3]*sun[0]+p[i*3+1]*sun[1]+p[i*3+2]*sun[2];if((${day?'true':'false'}?d>.55:d<-.7)&&q[i]>charge){cell=i;charge=q[i];dot=d}}if(cell<0)throw new Error('no charged visual focus');focusCamera(a.camera,p.subarray(cell*3,cell*3+3));a.lastRender=-Infinity;let draws=null,drawArrays,drawElements;if(${day?'true':'false'}&&a.renderer.backend==='webgl2'){const gl=a.renderer.gl;draws=0;drawArrays=gl.drawArrays;drawElements=gl.drawElements;gl.drawArrays=(...args)=>{draws++;return drawArrays.apply(gl,args)};gl.drawElements=(...args)=>{draws++;return drawElements.apply(gl,args)}}const accepted=a.renderer.render({snapshot:s,worldIdentity:a.worldIdentity,camera:a.camera,selectedNode:null,highlightedCells:[],time:performance.now()/1000,pulse:false});if(drawArrays){a.renderer.gl.drawArrays=drawArrays;a.renderer.gl.drawElements=drawElements}return{cell,charge,dot,accepted,draws,camera:a.camera.direction.slice()}})()`);
  developedEcology.day=await focusCharge(true);await wait(120);developedEcology.dayImage=await screenshot('browser-world-luminous-day.png');
  developedEcology.night=await focusCharge(false);await wait(120);developedEcology.nightImage=await screenshot('browser-world-luminous-night.png');
  ok(developedEcology.day.charge>0&&developedEcology.night.charge>0&&developedEcology.day.accepted&&developedEcology.night.accepted&&developedEcology.day.draws===4
    &&developedEcology.dayImage.hash!==developedEcology.nightImage.hash,`Luminous visual focus missing: ${JSON.stringify(developedEcology)}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.historySnapshot=a.__firstLuminousSnapshot;a.historyPlaybackActive=true})()`);
  developedEcology.firstLuminance=await measureLuminousHierarchy(evaluate);
  ok(developedEcology.firstLuminance.valid,`first-purchase WebGL Luminous hierarchy failed: ${JSON.stringify(developedEcology.firstLuminance)}`);
  developedEcology.luminance=developedEcology.firstLuminance;
  developedEcology.decay=await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=a.__luminousDecaySnapshot;a.historySnapshot=s;a.historyPlaybackActive=true;const charge=[...s.electricityQ].reduce((sum,value)=>sum+value,0),accepted=a.renderer.render({snapshot:s,worldIdentity:a.worldIdentity,camera:a.camera,selectedNode:null,highlightedCells:[],time:performance.now()/1000,pulse:false});return{charge,accepted,status:s.status}})()`);
  ok(developedEcology.decay.charge===0&&developedEcology.decay.accepted&&developedEcology.decay.status==='extinct',`Luminous decay visual missing: ${JSON.stringify(developedEcology.decay)}`);
  await wait(120);developedEcology.decayImage=await screenshot('browser-world-luminous-decayed.png');
  ok(developedEcology.decayImage.hash!==developedEcology.nightImage.hash,'charged and decayed WebGL pixels were identical');
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.historySnapshot=null;a.historyPlaybackActive=false;delete a.__luminousDecaySnapshot;delete a.__firstLuminousSnapshot;a.pause.set('browser-luminous',false)})()`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 50000), '1.5x run did not finish');
  const elapsed = (performance.now() - run2StartedAt) / 1000; const result = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=document.getElementById('context-shell'),control=document.getElementById('result-control'),ids=[...document.querySelector('.hud-metrics').children].map(x=>x.id),actions=[...document.querySelectorAll('#result-dialog footer button')].map(x=>x.textContent.trim());return {score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),scene:a.scene,phase:a.phase,overlay:a.overlay,surface:s.dataset.surface,runVisible:!document.getElementById('run-screen').hidden,resultControl:!control.hidden,resultAction:control.dataset.action,resultClass:control.classList.contains('is-recommended'),resultExpanded:control.getAttribute('aria-expanded'),metricOrder:ids.join('|'),redundant:['result-score-button','result-entropy-button','result-reach-button'].some(id=>document.getElementById(id)),entropy:!document.getElementById('entropy-button'),temporalControlsRemoved:!document.getElementById('event-log-dialog')&&!document.getElementById('current-event-button'),pause:document.getElementById('pause-button').disabled,speed:document.getElementById('speed-select').disabled,trophies:document.getElementById('result-trophies').textContent,resultEnvironment:document.getElementById('result-environment').textContent,
      nextLabel:document.getElementById('result-next-button').textContent,continuation:{state:document.getElementById('result-continuation').dataset.state,visible:document.getElementById('result-continuation-visible').textContent,accessible:document.getElementById('result-continuation-accessible').textContent,progress:Number(document.getElementById('result-continuation').style.getPropertyValue('--continuation-progress'))},actions,snapshotStatus:a.snapshot?.status,alive:a.snapshot?.metrics?.aliveCount,reach:document.getElementById('hud-reach').textContent,visualSaves:a.__terminalVisualSaves}})()`);
  ok(result.score > 0 && result.scene === 'world' && result.phase === 'result' && result.overlay === 'result' && result.surface === 'result'
    && result.runVisible && result.resultControl && result.resultAction === 'available' && !result.resultClass && result.resultExpanded === 'true'
    && result.metricOrder === 'score-button|reach-button|environment-level-button|result-control' && !result.redundant && result.entropy && result.temporalControlsRemoved
    && result.pause && result.speed && result.actions.join('|') === 'Next World|Evolution|History' && result.snapshotStatus === 'extinct' && result.alive === 0 && result.reach === '0%'
    &&result.trophies.includes('First Extinction')&&result.resultEnvironment.includes('Peak Environment Level')
    &&result.nextLabel==='Next World'&&result.continuation.state==='counting'&&result.continuation.visible==='World cycle continues automatically'
    &&!/[0-9]/.test(result.continuation.visible)&&/^Next World starts automatically in \d+ seconds?\. Any interaction cancels it\.$/.test(result.continuation.accessible)
    &&result.continuation.progress>=0&&result.continuation.progress<=1&&result.visualSaves.length===1&&result.visualSaves[0],`terminal world failed: ${JSON.stringify(result)}`);
  const terminalLayouts = await verifyResultContinuation(t);
  await setViewport(1440, 900); await wait(100);
  await screenshot('shell-result-desktop.png'); await trustedId(t, 'result-close'); ok(await evaluate(`document.getElementById('context-shell').hidden`), 'Result did not close');
  ok(await evaluate(`window.__CELL_SPHERE_APP__.continuation.status==='disabled'`), 'disabled continuation unexpectedly rearmed for this Result');
  await trustedId(t, 'result-control'); await drag([800, 330], [930, 420]); const dragState = await evaluate(`({overlay:window.__CELL_SPHERE_APP__.overlay,surface:window.__CELL_SPHERE_APP__.surfaces.active,selected:window.__CELL_SPHERE_APP__.selectedNode})`); ok(dragState.overlay === 'result', `globe drag dismissed Result: ${JSON.stringify(dragState)}`);
  await click(1000, 450); await wait(120); ok(await evaluate(`window.__CELL_SPHERE_APP__.overlay==='inspector'&&document.activeElement===document.getElementById('inspector-heading')`), 'cell tap did not replace Result and focus Inspector');
  await trustedId(t, 'inspector-close'); await trustedId(t, 'result-control'); await trustedId(t, 'reach-button');
  const finalMetric = await shellRect(evaluate); ok(finalMetric.surface === 'metric' && sameRect(finalMetric, metricRects.reach, .25), 'final metric geometry changed');
  await trustedId(t, 'metric-close');
  const runIdentity = await evaluate('window.__CELL_SPHERE_APP__.worldIdentity.resultTransactionKey');
  await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{validateMeta}=await import('./src/platform/storage.js');a.meta=validateMeta({...a.meta,echoBalance:'1000000'});return true})()`);
  const resultTransactionBefore = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {keys:a.meta.resultKeys.slice(),runs:a.meta.runs,worlds:a.archive.worlds.length,evolution:a.archive.evolution.length,balance:a.meta.echoBalance}})()`);
  await trustedId(t, 'result-control'); await trustedId(t, 'result-evolution-button'); await wait(160);
  const evolutionRoute = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {scene:a.scene,phase:a.phase,identity:a.worldIdentity.resultTransactionKey,focus:document.activeElement?.id,keys:a.meta.resultKeys.slice(),runs:a.meta.runs,worlds:a.archive.worlds.length,evolution:a.archive.evolution.length,balance:a.meta.echoBalance}})()`);
  ok(evolutionRoute.scene === 'evolution' && evolutionRoute.phase === 'result' && evolutionRoute.identity === runIdentity && evolutionRoute.focus === 'scene-evolution'
    && JSON.stringify(evolutionRoute.keys) === JSON.stringify(resultTransactionBefore.keys) && evolutionRoute.runs === resultTransactionBefore.runs
    && evolutionRoute.worlds === resultTransactionBefore.worlds && evolutionRoute.evolution === resultTransactionBefore.evolution
    && evolutionRoute.balance === resultTransactionBefore.balance, `Result Evolution changed authority or focus incorrectly: ${JSON.stringify({ resultTransactionBefore, evolutionRoute })}`);
  const activationEvidence=await evolutionActivationEvidence(t);const nodeId=activationEvidence.keyboard.id;
  ok(await evaluate(`window.__CELL_SPHERE_APP__.phase==='result'&&window.__CELL_SPHERE_APP__.worldIdentity.resultTransactionKey===${JSON.stringify(runIdentity)}`), 'Evolution replaced terminal world authority');
  await trustedId(t, 'scene-trophies'); ok(await evaluate(`window.__CELL_SPHERE_APP__.trophySnapshot.nodeStates.length===96`), 'Trophy scene incomplete');
  const firstNotice = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {name:document.getElementById('trophy-notification-name').textContent,badge:Number(document.getElementById('trophy-tab-badge').textContent),queue:a.meta.trophyQueue.slice()}})()`);
  ok(firstNotice.badge === firstNotice.queue.length && firstNotice.queue.length >= 2,
    `Trophy queue did not preserve simultaneous awards: ${JSON.stringify(firstNotice)}`);
  const secondNotice = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.settings={...a.settings,motion:'reduced'};a.trophyNotifications.acknowledge('browser-sequence');return {name:document.getElementById('trophy-notification-name').textContent,badge:Number(document.getElementById('trophy-tab-badge').textContent),static:document.getElementById('trophy-notification').classList.contains('is-static')}})()`);
  ok(secondNotice.badge === firstNotice.badge - 1 && secondNotice.name !== firstNotice.name && secondNotice.static,
    `Sequential reduced Trophy reveal failed: ${JSON.stringify({firstNotice,secondNotice})}`);
  await screenshot('browser-trophy-queue-reduced.png'); await trustedId(t, 'scene-world');
  await installFirstReplacementCapture(evaluate); await evaluate(`window.__CELL_SPHERE_APP__.requestWorldReplacement('auto-next',window.__CELL_SPHERE_APP__.lastResultIdentity)`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 6000), 'automatic replacement path did not start');
  assertBlankReplacement(await evaluate('window.__CELL_SPHERE_APP__.__firstReplacementFrame'), boot.renderer);
  ok(await evaluate(`document.getElementById('trophy-notification-name').textContent===${JSON.stringify(secondNotice.name)}`), 'Trophy notification did not survive automatic replacement');
  await trustedId(t, 'trophy-notification-action'); const notificationRoute = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,badge=document.getElementById('trophy-tab-badge');return {scene:a.scene,selected:a.trophyUi.selectedId,queue:a.meta.trophyQueue.length,badgeHidden:badge.hidden,badge:Number(badge.textContent)}})()`);
  ok(notificationRoute.scene === 'trophies' && notificationRoute.selected !== null && notificationRoute.queue === secondNotice.badge - 1
    && (notificationRoute.badgeHidden || notificationRoute.badge === notificationRoute.queue),
  `Trophy notification click did not route to detail and acknowledge: ${JSON.stringify(notificationRoute)}`);
  await evaluate(`window.__CELL_SPHERE_APP__.trophyNotifications.hold('browser-evidence',false)`);
  const bounded = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {...a.worldResourceAudit(),raf:a.frameAudit}})()`);
  ok(!bounded.historyRequests && !bounded.raf.errors, `replacement resources leaked: ${JSON.stringify(bounded)}`);

  await installFirstReplacementCapture(evaluate);
  const unattended = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.continuation.durationMs=800;a.settings={...a.settings,autoContinue:true};return a.worldIdentity.worldSessionId})()`);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase)=>phase==='result',50000),'untouched continuation-cycle world did not finish');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.worldIdentity.worldSessionId'), (session) => session > unattended, 5000), 'untouched Result cycle did not replace the world');
  assertBlankReplacement(await evaluate('window.__CELL_SPHERE_APP__.__firstReplacementFrame'), 'WebGL2 continuation cycle');

  const lossRequested = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,gl=a.renderer?.gl,ext=gl?.getExtension('WEBGL_lose_context');if(!ext)return false;window.__CELL_SPHERE_RETIRED_CANVAS__=a.canvas;ext.loseContext();return true})()`);
  ok(lossRequested, 'WEBGL_lose_context unavailable');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.renderer?.backend'), (backend) => backend === 'canvas2d', 3000), 'WebGL context loss did not activate Canvas 2D');
  await wait(180); const loss = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {replaced:a.canvas!==window.__CELL_SPHERE_RETIRED_CANVAS__,canvases:document.querySelectorAll('#gl-canvas').length,backend:a.renderer.backend,accepted:a.renderer.acceptedFrames,input:typeof a.input?.isActive==='function',errors:a.frameAudit.errors}})()`);
  ok(loss.replaced && loss.canvases === 1 && loss.backend === 'canvas2d' && loss.accepted > 0 && loss.input && !loss.errors, `context-loss fallback failed: ${JSON.stringify(loss)}`);
  const idb = await evaluate('window.__CELL_SPHERE_APP__.historyPlayback.recentRuns.ready()'); ok(errors.length === 0, `browser errors: ${errors.join(' | ')}`);
  return {backend:boot.renderer,score:result.score,elapsed,nodeId,render,idb,metricRects,responsive,terminalLayouts,
    keyboardInspector,worldmaking:developedEcology,contextLoss:loss};
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
    &&keyboardSelected.overlay==='memory-node'&&keyboardSelected.status===7&&keyboardSelected.panel.includes('ready to unlock')
    &&keyboardSelected.panel.includes('Activate this selected cell again')&&keyboardSelected.action.includes('Echoes')&&keyboardSelected.tree.includes('Activate again'),
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
  const pointerHit=await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{pickNode}=await import('./src/rendering/picking.js'),{MEMORY_CELL_REVERSE,MEMORY_NODES}=await import('./src/game/skills/index.js');
    const p=pickNode(a.canvas,${pointer.point[0]},${pointer.point[1]},a.camera,a.topo),e=document.elementFromPoint(${pointer.point[0]},${pointer.point[1]});return{element:e?.id||e?.className,
      node:p?.node,id:p&&MEMORY_NODES[MEMORY_CELL_REVERSE[p.node]]?.id,lastPurchaseAt:a.evolutionActivation.lastPurchaseAt,now:performance.now()}})()`);
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
  await wait(400); const buttonBurstBefore=await stateFor(explicit.id); const buttonBurstPoint=await evaluate(`(()=>{const r=document.getElementById('memory-unlock').getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`);
  await click(...buttonBurstPoint);await click(...buttonBurstPoint);await click(...buttonBurstPoint);await wait(100);
  const buttonBurstAfter=await stateFor(explicit.id);
  ok(BigInt(buttonBurstAfter.level)===BigInt(buttonBurstBefore.level)+1n&&buttonBurstAfter.events===buttonBurstBefore.events+1,
    `rapid accessible-button activation bought more than one level: ${JSON.stringify({buttonBurstBefore,buttonBurstAfter})}`);
  const extreme=await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,id=${JSON.stringify(explicit.id)},level='8'.repeat(1019),balance='9'.repeat(4096),
    {buildMemorySnapshot}=await import('./src/game/skills/index.js');a.closeEvolutionCell();a.meta={...a.meta,evolutionLevels:[{id,level}],echoBalance:balance,totalEchoes:balance};
    a.memorySnapshot=buildMemorySnapshot(a.topo,a.meta);a.memoryUi.syncTree(a.meta);a.selectEvolutionCell(id);
    const action=document.getElementById('memory-unlock'),exact=action.dataset.exactValue;
    return{levelDigits:level.length,balanceDigits:balance.length,costDigits:exact.length,action:action.textContent,noDetailAction:!document.querySelector('#memory-node-meta button'),
      horizontal:document.documentElement.scrollWidth>innerWidth}})()`);
  ok(extreme.levelDigits===1019&&extreme.balanceDigits===4096&&extreme.costDigits>2000&&extreme.noDetailAction
    &&/^Upgrade for .+ Echoes$/.test(extreme.action)&&!extreme.horizontal,`extreme progression detail failed: ${JSON.stringify(extreme)}`);
  await assertSkillGeometry(t);await screenshot('browser-evolution-extreme-exact.png');
  await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,saved=a.__evolutionActivationRestore,{buildMemorySnapshot}=await import('./src/game/skills/index.js'),
    {saveMeta}=await import('./src/platform/storage.js'),{saveHistory}=await import('./src/platform/history.js');a.meta=saved.meta;a.archive=saved.archive;
    a.memorySnapshot=buildMemorySnapshot(a.topo,a.meta);a.memoryUi.syncTree(a.meta);a.trophyNotifications.replace(a.meta);saveMeta(a.meta);saveHistory(a.archive);
    delete a.__evolutionActivationRestore;return true})()`);
  return{keyboard:{id:keyboard.id,before:keyboard.level,after:keyboardBought.level},pointer:{id:pointer.id,after:pointerBought.level},
    touch:{id:touch.id,after:touchBought.level},button:{id:explicit.id,after:explicitBought.level}};
}

async function runStorageResetScenario({ evaluate, wait, poll }, initialBoot) {
  ok(initialBoot.product === 'cell-sphere-game' && initialBoot.tagline === 'Every extinction becomes memory.', 'canonical boot identity missing');
  await evaluate(`(()=>{const old=['incremental','network','game'].join('-');localStorage.clear();
    localStorage.setItem(old+':meta:v1',JSON.stringify({schema:8,totalEchoes:321,runs:7}));
    localStorage.setItem(old+':history:v2',JSON.stringify({schema:4,worlds:[{id:'old-world'}]}));
    localStorage.setItem(old+':settings:v3',JSON.stringify({schema:3,motion:'reduced'}));location.reload();return true})()`);
  await wait(1800); ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'current namespace reload failed');
  const reset = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__,old=['incremental','network','game'].join('-');
    return {boot:b,runs:a.meta.runs,total:a.meta.totalEchoes,levels:a.meta.evolutionLevels.length,worlds:a.archive.worlds.length,
      canonical:['meta','settings','history'].every(k=>Boolean(localStorage.getItem(b.storage[k]))),
      oldStillPresent:Boolean(localStorage.getItem(old+':meta:v1'))}})()`);
  ok(reset.runs === '0' && reset.total === '0' && reset.levels === 0 && reset.worlds === 0 && reset.canonical && reset.oldStillPresent,
    `mismatched storage was not reset cleanly: ${JSON.stringify(reset)}`);
  await evaluate(`(()=>{const b=window.__CELL_SPHERE_BOOT__;localStorage.setItem(b.storage.settings,
    JSON.stringify({schema:4,motion:'reduced',autoContinue:false,speed:8}));location.reload();return true})()`);
  await wait(1800); ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'current settings-schema reset reload failed');
  const settingsReset = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__;
    return {schema:a.settings.schema,motion:a.settings.motion,autoContinue:a.settings.autoContinue,speed:a.settings.speed,
      status:b.storageStatus?.documents?.settings?.status}})()`);
  ok(settingsReset.schema === 8 && settingsReset.autoContinue === true && settingsReset.speed === 1 && settingsReset.status === 'reset',
    `mismatched current settings were not reset: ${JSON.stringify(settingsReset)}`);
  const rollback = await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,boot=window.__CELL_SPHERE_BOOT__,
    {createExportData}=await import('./src/interface/app-data.js'),keys=boot.storage,before=Object.fromEntries(Object.entries(keys).map(([k,key])=>[k,localStorage.getItem(key)])),
    data=createExportData({...a.meta,echoBalance:'7'},a.archive,{...a.settings,motion:'reduced',autoContinue:false}),proto=Object.getPrototypeOf(localStorage),original=proto.setItem,
    calls=[];try{proto.setItem=function(key,value){calls.push(key);if(key===keys.settings)throw new Error('blocked settings write');return original.call(this,key,value)};
      a.settingsAction('import',JSON.stringify(data));}finally{proto.setItem=original}const after=Object.fromEntries(Object.entries(keys).map(([k,key])=>[k,localStorage.getItem(key)]));
    return{calls,settingsKey:keys.settings,before,after,session:{echoBalance:a.meta.echoBalance,motion:a.settings.motion,autoContinue:a.settings.autoContinue}}})()`);
  ok(JSON.stringify(rollback.before) === JSON.stringify(rollback.after) && rollback.calls.filter(key=>key===rollback.settingsKey).length === 1
    && rollback.session.echoBalance === '7' && rollback.session.motion === 'reduced' && rollback.session.autoContinue === false,
  `failed import left a partial durable write or did not retain the session import: ${JSON.stringify(rollback)}`);
  const importRejected = await evaluate(`(async()=>{const data=await import('./src/interface/app-data.js');try{
    data.parseImportedData(JSON.stringify({schema:1,product:['incremental','network','game'].join('-')}));return false;}catch{return true}})()`);
  ok(importRejected, 'old export was accepted');
  await evaluate('localStorage.clear();location.reload();true'); await wait(1800);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'fresh current reload failed');
  const fresh = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__;return {boot:b,defaults:a.meta.runs==='0'&&a.meta.totalEchoes==='0',
    canonical:['meta','settings','history'].every(k=>Boolean(localStorage.getItem(b.storage[k]))),errors:window.__CELL_SPHERE_ERRORS__.slice()}})()`);
  ok(fresh.defaults && fresh.canonical && !fresh.errors.length, `fresh current save failed: ${JSON.stringify(fresh)}`); return fresh.boot;
}
async function trustedId(t, id) { return trustedSelector(t, `#${id}`); }
async function trustedSelector({ evaluate, click }, selector) { const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('missing ${selector}');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`); await click(...point); }
async function selectorEvidence(evaluate) { return evaluate(`(()=>{const root=document.getElementById('scene-selector'),r=root.getBoundingClientRect(),tabs=[...root.querySelectorAll('[role=tab]')];return {order:tabs.map(x=>x.textContent.trim()),selected:tabs.filter(x=>x.getAttribute('aria-selected')==='true').length,min:Math.min(...tabs.map(x=>x.getBoundingClientRect().height)),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}})()`); }
function selectorContract(value) { ok(value.order.join('|') === 'Home|World|Evolution|Trophies' && value.selected === 1 && value.min >= 44, `selector contract: ${JSON.stringify(value)}`); }
async function shellRect(evaluate) { return evaluate(`(()=>{const e=document.getElementById('context-shell'),r=e.getBoundingClientRect();return {surface:e.dataset.surface,left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}})()`); }
async function layoutEvidence(evaluate) { return evaluate(`(()=>{const tabs=[...document.querySelectorAll('#scene-selector [role=tab]')],m=document.getElementById('environment-level-button').getBoundingClientRect(),d=document.querySelector('.command-rail').getBoundingClientRect(),s=document.getElementById('context-shell').getBoundingClientRect(),overlap=(a,b)=>!(a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom),rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});return {noOverflow:document.documentElement.scrollWidth<=innerWidth,selectorMin:Math.min(...tabs.map(x=>x.getBoundingClientRect().height)),metricMin:m.height,controlsBounded:m.left>=0&&m.right<=innerWidth&&d.left>=0&&d.right<=innerWidth&&s.left>=0&&s.right<=innerWidth,metricDockOverlap:overlap(m,d),metricShellOverlap:overlap(m,s),metric:rect(m),dock:rect(d),shell:rect(s)}})()`); }
function sameRect(a, b, tolerance) { return ['left','top','right','bottom','width','height'].every((key) => Math.abs(a[key] - b[key]) <= tolerance); }
export async function installFirstReplacementCapture(evaluate) {
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,old=a.worldIdentity.worldSessionId,make=a.makeRenderer.bind(a);a.__firstReplacementFrame=null;a.makeRenderer=(...args)=>{make(...args);const r=a.renderer,render=r.render.bind(r);r.render=s=>{const snap=s.snapshot,target=snap?.worldSessionId!==old;if(!target)return render(s);const count=v=>v?[...v].reduce((n,x)=>n+(x!==0),0):0,before={blank:snap?.blank===true,status:snap?.status,life:count(snap?.lifeState)+count(snap?.biomass),highlights:s.highlightedCells?.length??0};const accepted=render(s);a.__firstReplacementFrame={backend:r.backend,accepted,before,after:r.lastFrameAudit,presentation:a.presentationAudit.lastBlank};r.render=render;a.makeRenderer=make;return accepted}}})()`);
}
export function assertBlankReplacement(frame, label) { ok(frame?.accepted && frame.before.blank && frame.before.status === 'starting', `${label} first replacement was not blank`); ok(frame.before.life === 0 && frame.before.highlights === 0, `${label} retained presentation`); ok(frame.after?.lifeCells === 0, `${label} retained renderer buffers`); if (frame.backend === 'webgl2') ok(frame.after.dynamic?.life === 0, 'WebGL2 dynamic buffers not clear'); }
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
