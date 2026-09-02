/** Focused production-shell evidence for the shared planetary sky policy. */
export async function runPlanetarySkyFixture(t) {
  const { evaluate, wait, poll, key, tap, setMedia, setViewport, screenshot, errors } = t;
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'planetary sky page did not boot');
  const reducedOsFresh = await settingsState(evaluate);
  ok(reducedOsFresh.osReduced && reducedOsFresh.motion === 'full' && reducedOsFresh.documentMotion === 'full',
    `fresh OS-Reduced profile was not Full: ${JSON.stringify(reducedOsFresh)}`);

  await evaluate(`document.querySelector('#title-screen .menu-open').focus()`); await key(' '); await wait(60);
  ok(await evaluate(`!document.getElementById('menu-dialog').hidden`), 'keyboard did not open the Home Motion menu');
  await evaluate(`document.querySelector('#settings-form select[name="motion"]').focus()`);
  await key('ArrowDown'); await key('Enter'); await wait(80);
  const explicitReduced = await settingsState(evaluate);
  ok(explicitReduced.motion === 'reduced' && explicitReduced.saved.motion === 'reduced'
    && explicitReduced.saved.quality === 'auto' && explicitReduced.saved.contrast === 'normal'
    && explicitReduced.saved.autoContinue === true && explicitReduced.saved.speed === 1,
  `explicit Reduced or unrelated settings were not preserved: ${JSON.stringify(explicitReduced)}`);

  const url = await evaluate('location.href'); await setMedia([]); await t.navigate(url);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'stored Reduced reload did not boot');
  const storedReduced = await settingsState(evaluate);
  ok(storedReduced.motion === 'reduced' && storedReduced.documentMotion === 'reduced',
    `stored Reduced did not survive OS change: ${JSON.stringify(storedReduced)}`);
  await evaluate('localStorage.clear()'); await t.navigate(url);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'fresh no-preference reload did not boot');
  const noPreferenceFresh = await settingsState(evaluate);
  ok(!noPreferenceFresh.osReduced && noPreferenceFresh.motion === 'full' && noPreferenceFresh.documentMotion === 'full',
    `fresh no-preference profile was not Full: ${JSON.stringify(noPreferenceFresh)}`);
  await setMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await wait(50);
  const osChange = await settingsState(evaluate);
  ok(osChange.motion === 'full' && osChange.documentMotion === 'full', `OS change mutated Motion: ${JSON.stringify(osChange)}`);
  await setMedia([]);

  await setViewport(1440, 900); await wait(150);
  const home = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,p=a.currentCelestialProjection(),s=a.worldResourceAudit().celestial;
    return{renderer:a.renderer.backend,cloudSignature:p.cloud?.signature,cloudBytes:p.cloud?.byteLength,coverage:p.cloud?.coverage,
      skySeed:p.skySeed,starCount:p.starCount,starReference:a.celestial.stars===p.stars,scene:s.scene,eligible:s.eligible}})()`);
  const homeShot = await screenshot(`planetary-sky-home-${home.renderer}.png`);
  await trustedSelector(t, '#begin-button');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000), 'planetary sky World did not start');
  const path = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.pause.set('browser-planetary-sky',true);const p=a.currentCelestialProjection();return{
    renderer:a.renderer.backend,fallback:a.driver.hasFallback,cloudSignature:p.cloud?.signature,cloudBytes:p.cloud?.byteLength,
    coverage:p.cloud?.coverage,starCount:p.starCount,skySeed:p.skySeed,sameStars:p.stars===a.celestial.stars}})()`);
  ok(path.fallback === Boolean(t.simulationFallback), `planetary sky execution path mismatch: ${JSON.stringify(path)}`);
  ok(home.cloudSignature !== path.cloudSignature && home.skySeed === path.skySeed && path.sameStars,
    `Home/World seed lifecycle failed: ${JSON.stringify({ home, path })}`);
  const visibility = await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__;let hidden=true;const before=a.currentCelestialProjection().eligibleTimeMs;
    Object.defineProperty(document,'hidden',{configurable:true,get:()=>hidden});document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,180));
    const during=a.currentCelestialProjection().eligibleTimeMs;hidden=false;document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,180));
    const after=a.currentCelestialProjection().eligibleTimeMs;delete document.hidden;return{before,during,after,hiddenAdvance:during-before,resumeAdvance:after-during}})()`);
  ok(visibility.hiddenAdvance >= 0 && visibility.hiddenAdvance <= 100 && visibility.resumeAdvance >= 0 && visibility.resumeAdvance <= 300,
    `hidden celestial time caught up: ${JSON.stringify(visibility)}`);
  const menuPoint = await point(evaluate, '#menu-button'); await tap(...menuPoint); await wait(80);
  const touchMenu = await evaluate(`(()=>{const menu=document.getElementById('menu-dialog'),select=menu.querySelector('select[name="motion"]'),r=select.getBoundingClientRect();return{open:!menu.hidden,name:select.labels[0]?.textContent.trim(),width:r.width,height:r.height}})()`);
  ok(touchMenu.open && touchMenu.name.startsWith('Motion') && touchMenu.height >= 44,
    `touch Motion access failed: ${JSON.stringify(touchMenu)}`); await key('Escape');

  const responsive = [];
  await evaluate(`document.documentElement.style.fontSize='32px'`);
  for (const [width, height] of [[320, 568], [390, 844], [844, 390], [1440, 900]]) {
    await setViewport(width, height); await wait(100);
    const row = await evaluate(`(()=>{const canvas=document.getElementById('gl-canvas').getBoundingClientRect(),controls=[...document.querySelectorAll('button,select')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());return{
      width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,canvas:[canvas.left,canvas.top,canvas.right,canvas.bottom],
      controlsInside:controls.every(r=>r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1),
      targets:controls.every(r=>r.width>=43&&r.height>=43)}})()`);
    responsive.push(row); ok(row.pageWidth <= width && row.controlsInside && row.targets,
      `planetary sky responsive controls failed: ${JSON.stringify(row)}`);
  }
  await evaluate(`document.documentElement.style.fontSize=''`); await setViewport(1440, 900); await wait(120);

  const visual = await evaluate(visualExpression());
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('cloud')`); await wait(60);
  const worldShot = await screenshot(`planetary-sky-world-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('shooting')`); await wait(40);
  const shootingShot = await screenshot(`planetary-sky-shooting-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('reduced')`); await wait(40);
  const reducedShot = await screenshot(`planetary-sky-reduced-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.restore()`);
  ok(visual.valid, `planetary sky visual oracle failed: ${JSON.stringify(visual)}`);

  const scenes = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,stars=a.celestial.stars,world=a.currentCelestialProjection().cloud?.signature;
    a.selectScene('evolution');const evolution=a.currentCelestialProjection();a.selectScene('trophies');const trophies=a.currentCelestialProjection();
    a.selectScene('world');const returned=a.currentCelestialProjection();return{world,evolution:{cloud:evolution.cloudEnabled,event:evolution.shootingStar,stars:evolution.stars===stars},
      trophies:{cloud:trophies.cloudEnabled,event:trophies.shootingStar,stars:trophies.stars===stars},returned:{cloud:returned.cloud?.signature,stars:returned.stars===stars}}})()`);
  ok(!scenes.evolution.cloud && !scenes.trophies.cloud && scenes.evolution.event === null && scenes.trophies.event === null
    && scenes.evolution.stars && scenes.trophies.stars && scenes.returned.cloud === scenes.world && scenes.returned.stars,
  `scene eligibility or stable sky failed: ${JSON.stringify(scenes)}`);
  const historyAndQuality = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,world=a.currentCelestialProjection(),stars=world.stars;
    a.makeRenderer(0x7357a11,'history');const history=a.currentCelestialProjection();a.makeRenderer(a.runSeed,'world',a.worldIdentity);
    a.applySettings({...a.settings,quality:'eco'},false);const eco=a.currentCelestialProjection();a.applySettings({...a.settings,quality:'high'},false);const high=a.currentCelestialProjection();
    a.applySettings({...a.settings,quality:'auto'},false);return{history:{enabled:history.cloudEnabled,changed:history.cloud?.signature!==world.cloud?.signature,stars:history.stars===stars},
      quality:{eco:eco.starCount,high:high.starCount,field:eco.cloud?.signature===high.cloud?.signature,stars:eco.stars===high.stars&&high.stars===stars}}})()`);
  ok(historyAndQuality.history.enabled && historyAndQuality.history.changed && historyAndQuality.history.stars
    && historyAndQuality.quality.eco === 48 && historyAndQuality.quality.high === 96
    && historyAndQuality.quality.field && historyAndQuality.quality.stars,
  `History or quality seed lifecycle failed: ${JSON.stringify(historyAndQuality)}`);

  await setMedia([{ name: 'forced-colors', value: 'active' }]); await wait(60);
  const forcedColors = await evaluate(`(()=>{const b=[...document.querySelectorAll('.menu-open')].find(node=>node.getClientRects().length);b.focus();const s=getComputedStyle(b);return{active:matchMedia('(forced-colors: active)').matches,
    focused:document.activeElement===b,border:s.borderTopStyle,outline:s.outlineStyle}})()`);
  ok(forcedColors.active && forcedColors.focused && forcedColors.border !== 'none',
    `forced-color Motion route failed: ${JSON.stringify(forcedColors)}`); await setMedia([]);
  const highContrast = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,contrast:'high'});return{contrast:document.documentElement.dataset.contrast,
    cloud:a.currentCelestialProjection().cloudEnabled,stars:a.currentCelestialProjection().starCount}})()`);
  ok(highContrast.contrast === 'high' && highContrast.cloud && highContrast.stars > 0,
    `high contrast lost celestial state: ${JSON.stringify(highContrast)}`);

  let contextLoss = { attempted: false };
  if (path.renderer === 'webgl2' && !t.simulationFallback) {
    contextLoss = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,before=a.currentCelestialProjection(),ext=a.renderer.gl.getExtension('WEBGL_lose_context');
      if(!ext)return{attempted:false};ext.loseContext();return{attempted:true,before:{cloud:before.cloud?.signature,phase:before.cloudPhase,starCount:before.starCount,skySeed:before.skySeed,event:before.shootingStar?.id??null}}})()`);
    if (contextLoss.attempted) {
      const before = contextLoss.before;
      ok(await poll(() => evaluate(`window.__CELL_SPHERE_APP__.renderer.backend`), (value) => value === 'canvas2d', 5000), 'context loss did not reach Canvas');
      contextLoss = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,p=a.currentCelestialProjection();return{attempted:true,backend:a.renderer.backend,
        cloud:p.cloud?.signature,phase:p.cloudPhase,starCount:p.starCount,skySeed:p.skySeed,event:p.shootingStar?.id??null,field:a.renderer.cloudField?.signature,playable:Boolean(a.snapshot)}})()`);
      contextLoss = { ...contextLoss, before, phaseDelta: Math.abs(contextLoss.phase - before.phase) };
      ok(contextLoss.backend === 'canvas2d' && contextLoss.cloud === contextLoss.field && contextLoss.cloud === before.cloud
        && contextLoss.starCount === before.starCount && contextLoss.skySeed === before.skySeed && contextLoss.event === before.event
        && contextLoss.phaseDelta < .01 && contextLoss.playable,
        `context-loss celestial transfer failed: ${JSON.stringify(contextLoss)}`);
    }
  }
  ok(errors.length === 0, `planetary sky browser errors: ${errors.join(' | ')}`);
  return Object.freeze({ schema: 1, rendererPath: path.renderer, simulationPath: path.fallback ? 'fallback' : 'worker',
    settings: { reducedOsFresh, explicitReduced, storedReduced, noPreferenceFresh, osChange, touchMenu }, visibility,
    seeds: { home, world: path, scenes, historyAndQuality }, visual, responsive, forcedColors, highContrast, contextLoss,
    screenshots: { home: homeShot, world: worldShot, shooting: shootingShot, reduced: reducedShot } });
}

function visualExpression() {
  return `(async()=>{const a=window.__CELL_SPHERE_APP__,renderer=a.renderer,canvas=a.canvas,snapshot=a.snapshot,identity=a.worldIdentity;
    const [{shootingStarForSlot,SHOOTING_STAR_SLOT_MS,setCelestialReduced,advanceCelestialPresentation,celestialProjection},{projectedSphereDiameter},{rotate}]=await Promise.all([
      import('./src/interface/policies/celestial-presentation.js'),import('./src/interface/policies/layout-policy.js'),import('./src/rendering/camera.js')]);
    cancelAnimationFrame(a.rafId);const state=a.celestial,saved={elapsed:state.elapsedMs,lastNow:state.lastNow,reduced:state.reduced,camera:{...a.camera,direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()}};
    state.elapsedMs=0;state.lastNow=performance.now();const base=celestialProjection(state),savedSpeed=a.speed,scheduled=shootingStarForSlot(base.skySeed,4);
    state.elapsedMs=4*SHOOTING_STAR_SLOT_MS+scheduled.startOffsetMs+scheduled.durationMs*.5;const speedBefore=celestialProjection(state);a.setSpeed(.25);const slow=celestialProjection(state);a.setSpeed(1.5);const fast=celestialProjection(state);a.setSpeed(savedSpeed);state.elapsedMs=0;
    const speedInvariant={before:speedBefore.shootingStar?.id,slow:slow.shootingStar?.id,fast:fast.shootingStar?.id,phase:[speedBefore.cloudPhase,slow.cloudPhase,fast.cloudPhase],restored:a.speed===savedSpeed};
    const stars={...base,cloudEnabled:false,shootingStar:null},blank={...stars,starCount:0},cloud={...base,cloudPhase:0,shootingStar:null},moving={...cloud,cloudPhase:30000/3000000};
    const width=canvas.width,height=canvas.height,cx=width*(.5+a.camera.offsetX*.5),cy=height*(.5-a.camera.offsetY*.5);
    const radius=renderer.backend==='canvas2d'?Math.min(width,height)*(canvas.clientWidth<600?.76:.52)*(3.1/a.camera.dist):projectedSphereDiameter(a.camera.dist,height)/2;
    let event=null;for(let slot=0;slot<64&&!event;slot++){const candidate=shootingStarForSlot(base.skySeed,slot),entry=circleEntry(candidate,[cx/width,cy/height],radius/width,width/height);if(entry!=null){const p=Math.min(.96,entry+candidate.tailLength*.55);event={...candidate,progress:p,visibility:1}}}
    if(!event)throw new Error('no shooting-star occlusion path');const shooting={...cloud,shootingStar:event};
    const before=a.worldResourceAudit().celestial,resourceBefore=renderer.backend==='webgl2'?renderer.world.dynamicState():renderer.lastFrameAudit;
    const emptyFrame=capture(blank),starsA=capture(stars),starsB=capture(stars),cloudFrame=capture(cloud),movingFrame=capture(moving),shootingFrame=capture(shooting);
    rotate(a.camera,.47,.19);const rotatedStars=capture(stars),rotatedCloud=capture(cloud),cameraCloud=layerShift(starsA.data,cloudFrame.data,rotatedStars.data,rotatedCloud.data);Object.assign(a.camera,saved.camera);
    a.camera.dist=2.2;const nearCloud=diff(capture(stars).data,capture(cloud).data,'all',12);a.camera.dist=6.2;const farCloud=diff(capture(stars).data,capture(cloud).data,'all',12);Object.assign(a.camera,saved.camera);
    const star=diff(emptyFrame.data,starsA.data,'outside',2),repeat=diff(starsA.data,starsB.data,'all',0),cover=diff(starsA.data,cloudFrame.data,'inside',18),motion=diff(cloudFrame.data,movingFrame.data,'inside',1),meteorOutside=diff(cloudFrame.data,shootingFrame.data,'outside',2),meteorInside=diff(cloudFrame.data,shootingFrame.data,'inside',0);
    const times=[],offTimes=[],emptyTimes=[],pairedDeltas=[],fullDeltas=[];for(let index=0;index<120;index++){let on,off,empty;const order=index%3;if(order===0){empty=capture(blank).elapsed;off=capture(stars).elapsed;on=capture(moving).elapsed}else if(order===1){off=capture(stars).elapsed;on=capture(moving).elapsed;empty=capture(blank).elapsed}else{on=capture(moving).elapsed;empty=capture(blank).elapsed;off=capture(stars).elapsed}times.push(on);offTimes.push(off);emptyTimes.push(empty);pairedDeltas.push(on-off);fullDeltas.push(on-empty)}const after=renderer.backend==='webgl2'?renderer.world.dynamicState():renderer.lastFrameAudit;
    const phaseBefore=celestialProjection(state).cloudPhase;setCelestialReduced(state,true,state.lastNow);advanceCelestialPresentation(state,state.lastNow+60000);const reduced=celestialProjection(state);setCelestialReduced(state,false,state.lastNow);
    const checks={starsVisible:star.changed>20&&star.mean>0,starsStable:repeat.maximum===0,cloudCoverage:base.cloud.coverage>=.18&&base.cloud.coverage<=.42&&cover.fraction>=.18&&cover.fraction<=.42,
      cloudMoves:motion.changed>100&&motion.mean>0,shootingVisible:meteorOutside.changed>5,shootingOccluded:meteorInside.maximum===0,
      cloudAdheres:cameraCloud.changed>100&&nearCloud.changed>100&&farCloud.changed>100,
      reducedStatic:reduced.cloudEnabled&&reduced.cloudPhase===phaseBefore&&reduced.shootingStar===null,
      speedIndependent:speedInvariant.before===speedInvariant.slow&&speedInvariant.slow===speedInvariant.fast&&new Set(speedInvariant.phase).size===1&&speedInvariant.restored,
      fixedResources:base.cloud?.byteLength===8192&&base.stars?.byteLength===1536,
      fourDraws:renderer.backend==='canvas2d'||renderer.drawCalls===4,
      lifecycleOnly:renderer.backend==='canvas2d'?after?.celestial?.cloudFieldChanges===resourceBefore?.celestial?.cloudFieldChanges:after.cloudFieldUploads===resourceBefore.cloudFieldUploads};
    const api={show(kind){capture(kind==='shooting'?shooting:kind==='reduced'?{...cloud,shootingStar:null}:cloud)},restore(){state.elapsedMs=saved.elapsed;state.lastNow=performance.now();state.reduced=saved.reduced;Object.assign(a.camera,saved.camera);delete window.__CSG_PLANETARY_SKY_FIXTURE__;}};window.__CSG_PLANETARY_SKY_FIXTURE__=api;
    return{backend:renderer.backend,scene:a.scene,center:[cx,cy],radius,field:{width:base.cloud?.width,height:base.cloud?.height,bytes:base.cloud?.byteLength,signature:base.cloud?.signature,coverage:base.cloud?.coverage},stars:{count:base.starCount,bytes:base.stars?.byteLength,delta:star,repeat},cloud:{enabled:base.cloudEnabled,coverage:cover,motion,phase30s:moving.cloudPhase,cameraCloud,nearCloud,farCloud},shooting:{id:event.id,slot:event.slotIndex,durationMs:event.durationMs,path:[event.startX,event.startY,event.endX,event.endY],progress:event.progress,outside:meteorOutside,inside:meteorInside},
      reduced:{phaseBefore,phaseAfter:reduced.cloudPhase,event:reduced.shootingStar},speedInvariant,timing:{fullSky:summarize(times),starsOnly:summarize(offTimes),emptySky:summarize(emptyTimes),cloudDelta:summarize(pairedDeltas),fullDelta:summarize(fullDeltas)},resources:{before:resourceBefore,after},clockBefore:before,checks,valid:Object.values(checks).every(Boolean)};
    function capture(celestial){const started=performance.now();renderer.render({snapshot,worldIdentity:identity,camera:a.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false,celestial});const elapsed=performance.now()-started;let data;if(renderer.backend==='webgl2'){data=new Uint8Array(width*height*4);renderer.gl.readPixels(0,0,width,height,renderer.gl.RGBA,renderer.gl.UNSIGNED_BYTE,data)}else data=renderer.ctx.getImageData(0,0,width,height).data;return{data,elapsed}}
    function diff(left,right,mask,threshold){let samples=0,changed=0,sum=0,maximum=0;const levels={d2:0,d6:0,d10:0,d14:0,d18:0,d22:0};for(let y=1;y<height;y+=2)for(let x=1;x<width;x+=2){const distance=Math.hypot(x-cx,y-cy),inside=distance<radius*.70,outside=distance>radius*1.12;if(mask==='inside'&&!inside||mask==='outside'&&!outside)continue;const row=renderer.backend==='webgl2'?height-1-y:y,at=(row*width+x)*4,d=Math.max(Math.abs(left[at]-right[at]),Math.abs(left[at+1]-right[at+1]),Math.abs(left[at+2]-right[at+2]));samples++;sum+=d;maximum=Math.max(maximum,d);if(d>threshold)changed++;for(const level of [2,6,10,14,18,22])if(d>level)levels['d'+level]++}return{samples,changed,fraction:changed/Math.max(1,samples),mean:sum/Math.max(1,samples),maximum,levels}}
    function layerShift(baseA,cloudA,baseB,cloudB){let samples=0,changed=0,sum=0;for(let y=1;y<height;y+=2)for(let x=1;x<width;x+=2){if(Math.hypot(x-cx,y-cy)>=radius*.7)continue;const row=renderer.backend==='webgl2'?height-1-y:y,at=(row*width+x)*4,a=Math.max(Math.abs(baseA[at]-cloudA[at]),Math.abs(baseA[at+1]-cloudA[at+1]),Math.abs(baseA[at+2]-cloudA[at+2])),b=Math.max(Math.abs(baseB[at]-cloudB[at]),Math.abs(baseB[at+1]-cloudB[at+1]),Math.abs(baseB[at+2]-cloudB[at+2])),d=Math.abs(a-b);if(Math.max(a,b)>4){samples++;sum+=d;if(d>3)changed++}}return{samples,changed,fraction:changed/Math.max(1,samples),mean:sum/Math.max(1,samples)}}
    function segment(point,start,end){const dx=end[0]-start[0],dy=end[1]-start[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((point[0]-start[0])*dx+(point[1]-start[1])*dy)/length)):0;return Math.hypot(point[0]-start[0]-dx*t,point[1]-start[1]-dy*t)}
    function circleEntry(value,center,radiusX,aspect){const sx=value.startX-center[0],sy=(value.startY-center[1])/aspect,dx=value.endX-value.startX,dy=(value.endY-value.startY)/aspect,a=dx*dx+dy*dy,b=2*(sx*dx+sy*dy),c=sx*sx+sy*sy-radiusX*radiusX,disc=b*b-4*a*c;if(!(disc>0)||c<=0)return null;const entry=(-b-Math.sqrt(disc))/(2*a);return entry>value.tailLength*.5&&entry<.88?entry:null}
    function summarize(values){const sorted=values.slice().sort((x,y)=>x-y);return{samples:values.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]}}function mix(x,y,t){return x+(y-x)*t}
  })()`;
}

async function settingsState(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,key=window.__CELL_SPHERE_BOOT__.storage.settings;return{
  osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,motion:a.settings.motion,documentMotion:document.documentElement.dataset.motion,
  saved:JSON.parse(localStorage.getItem(key)),celestial:a.worldResourceAudit().celestial}})()`); }
async function trustedSelector(t, selector) { const value = await point(t.evaluate, selector); await t.click(...value); }
async function point(evaluate, selector) { return evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(node=>node.getClientRects().length);if(!e)throw new Error('missing visible ${selector}');const r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`); }
function ok(value, message) { if (!value) throw new Error(message); }
