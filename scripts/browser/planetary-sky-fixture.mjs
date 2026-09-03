/** Focused production-shell evidence for the shared planetary sky policy. */
export async function runPlanetarySkyFixture(t) {
  const { evaluate, wait, poll, key, tap, setMedia, setViewport, screenshot, errors } = t;
  const simulationLabel = t.simulationFallback ? 'fallback' : 'worker';
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'planetary sky page did not boot');
  const reducedOsFresh = await settingsState(evaluate);
  ok(reducedOsFresh.osReduced && reducedOsFresh.motion === 'full' && reducedOsFresh.documentMotion === 'full'
    && reducedOsFresh.quality === 'balanced' && reducedOsFresh.documentQuality === 'balanced'
    && reducedOsFresh.saved.quality === 'balanced' && reducedOsFresh.celestial.quality === 'balanced',
    `fresh OS-Reduced profile was not Full/Balanced: ${JSON.stringify(reducedOsFresh)}`);

  await evaluate(`document.querySelector('#title-screen .menu-open').focus()`); await key(' '); await wait(60);
  ok(await evaluate(`!document.getElementById('menu-dialog').hidden`), 'keyboard did not open the Home Motion menu');
  await evaluate(`document.querySelector('#settings-form select[name="motion"]').focus()`);
  await key('ArrowDown'); await key('Enter'); await wait(80);
  const explicitReduced = await settingsState(evaluate);
  ok(explicitReduced.motion === 'reduced' && explicitReduced.saved.motion === 'reduced'
    && explicitReduced.quality === 'balanced' && explicitReduced.saved.quality === 'balanced' && explicitReduced.saved.contrast === 'normal'
    && explicitReduced.saved.autoContinue === true && explicitReduced.saved.speed === 1,
  `explicit Reduced or unrelated settings were not preserved: ${JSON.stringify(explicitReduced)}`);

  const url = await evaluate('location.href'); await setMedia([]); await t.navigate(url);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'stored Reduced reload did not boot');
  const storedReduced = await settingsState(evaluate);
  ok(storedReduced.motion === 'reduced' && storedReduced.documentMotion === 'reduced'
    && storedReduced.quality === 'balanced' && storedReduced.saved.quality === 'balanced',
    `stored Reduced did not survive OS change: ${JSON.stringify(storedReduced)}`);
  await evaluate(`window.__CELL_SPHERE_APP__.applySettings({...window.__CELL_SPHERE_APP__.settings,quality:'auto'})`);
  await t.navigate(url);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'stored Automatic reload did not boot');
  const storedAutomatic = await settingsState(evaluate);
  ok(storedAutomatic.quality === 'auto' && storedAutomatic.saved.quality === 'auto'
    && storedAutomatic.motion === 'reduced' && storedAutomatic.saved.motion === 'reduced',
  `valid stored Automatic or unrelated Motion did not survive: ${JSON.stringify(storedAutomatic)}`);
  await evaluate('localStorage.clear()'); await t.navigate(url);
  ok(await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000), 'fresh no-preference reload did not boot');
  const noPreferenceFresh = await settingsState(evaluate);
  ok(!noPreferenceFresh.osReduced && noPreferenceFresh.motion === 'full' && noPreferenceFresh.documentMotion === 'full'
    && noPreferenceFresh.quality === 'balanced' && noPreferenceFresh.documentQuality === 'balanced',
    `fresh no-preference profile was not Full/Balanced: ${JSON.stringify(noPreferenceFresh)}`);
  await setMedia([{ name: 'prefers-reduced-motion', value: 'reduce' }]); await wait(50);
  const osChange = await settingsState(evaluate);
  ok(osChange.motion === 'full' && osChange.documentMotion === 'full', `OS change mutated Motion: ${JSON.stringify(osChange)}`);
  await setMedia([]);

  await setViewport(1440, 900); await wait(150);
  const home = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,p=a.currentCelestialProjection(),s=a.worldResourceAudit().celestial;
    return{renderer:a.renderer.backend,cloudSignature:p.cloud?.signature,cloudBytes:p.cloud?.byteLength,coverage:p.cloud?.coverage,
      deepSpaceSignature:p.deepSpace?.signature,deepSpaceBytes:p.deepSpace?.byteLength,deepSpaceReference:a.celestial.deepSpace===p.deepSpace,
      skySeed:p.skySeed,starCount:p.starCount,starCounts:p.starCounts,starReference:a.celestial.stars===p.stars,scene:s.scene,eligible:s.eligible}})()`);
  const homeShot = await screenshot(`planetary-sky-home-${simulationLabel}-${home.renderer}.png`);
  await trustedSelector(t, '#begin-button');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000), 'planetary sky World did not start');
  const path = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.pause.set('browser-planetary-sky',true);const p=a.currentCelestialProjection();return{
    renderer:a.renderer.backend,fallback:a.driver.hasFallback,cloudSignature:p.cloud?.signature,cloudBytes:p.cloud?.byteLength,
    coverage:p.cloud?.coverage,deepSpaceSignature:p.deepSpace?.signature,deepSpaceBytes:p.deepSpace?.byteLength,
    sameDeepSpace:p.deepSpace===a.celestial.deepSpace,starCount:p.starCount,starCounts:p.starCounts,skySeed:p.skySeed,sameStars:p.stars===a.celestial.stars}})()`);
  ok(path.fallback === Boolean(t.simulationFallback), `planetary sky execution path mismatch: ${JSON.stringify(path)}`);
  ok(home.cloudSignature !== path.cloudSignature && home.deepSpaceSignature === path.deepSpaceSignature
    && home.skySeed === path.skySeed && path.sameDeepSpace && path.sameStars,
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
  for (const [width, height] of [[320, 568], [360, 640], [390, 844], [430, 932],
    [768, 1024], [844, 390], [1024, 600], [1440, 900]]) {
    await setViewport(width, height); await wait(100);
    const row = await evaluate(`(()=>{const canvas=document.getElementById('gl-canvas').getBoundingClientRect(),controls=[...document.querySelectorAll('button,select')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());return{
      width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,canvas:[canvas.left,canvas.top,canvas.right,canvas.bottom],
      controlsInside:controls.every(r=>r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1),
      targets:controls.every(r=>r.width>=43&&r.height>=43)}})()`);
    row.screenshot = await screenshot(`planetary-sky-responsive-${width}x${height}-${simulationLabel}-${path.renderer}.png`);
    responsive.push(row); ok(row.pageWidth <= width && row.controlsInside && row.targets,
      `planetary sky responsive controls failed: ${JSON.stringify(row)}`);
  }
  await evaluate(`document.documentElement.style.fontSize=''`); await setViewport(1440, 900); await wait(120);

  const visual = await evaluate(visualExpression());
  const orientationShots = [];
  for (let index = 0; index < 6; index++) {
    await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.showOrientation(${index},'cloud',4.1)`); await wait(25);
    orientationShots.push(await screenshot(`planetary-sky-direction-${index}-${simulationLabel}-${path.renderer}.png`));
  }
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.showOrientation(0,'cloud',2.2)`); await wait(25);
  const nearShot = await screenshot(`planetary-sky-near-${simulationLabel}-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.showOrientation(0,'cloud',6.2)`); await wait(25);
  const farShot = await screenshot(`planetary-sky-far-${simulationLabel}-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('cloud')`); await wait(60);
  const worldShot = await screenshot(`planetary-sky-world-${simulationLabel}-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('primary')`); await wait(40);
  const primaryShot = await screenshot(`planetary-sky-primary-${simulationLabel}-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('secondary')`); await wait(40);
  const secondaryShot = await screenshot(`planetary-sky-secondary-${simulationLabel}-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('shooting')`); await wait(40);
  const shootingShot = await screenshot(`planetary-sky-shooting-${simulationLabel}-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.show('reduced')`); await wait(40);
  const reducedShot = await screenshot(`planetary-sky-reduced-${simulationLabel}-${path.renderer}.png`);
  await evaluate(`window.__CSG_PLANETARY_SKY_FIXTURE__.restore()`);
  ok(visual.valid, `planetary sky visual oracle failed: ${JSON.stringify(visual)}`);

  const scenes = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,stars=a.celestial.stars,deepSpace=a.celestial.deepSpace,world=a.currentCelestialProjection().cloud?.signature;
    a.selectScene('evolution');const evolution=a.currentCelestialProjection();a.selectScene('trophies');const trophies=a.currentCelestialProjection();
    a.selectScene('world');const returned=a.currentCelestialProjection();return{world,evolution:{cloud:evolution.cloudEnabled,event:evolution.shootingStar,stars:evolution.stars===stars,deepSpace:evolution.deepSpace===deepSpace},
      trophies:{cloud:trophies.cloudEnabled,event:trophies.shootingStar,stars:trophies.stars===stars,deepSpace:trophies.deepSpace===deepSpace},returned:{cloud:returned.cloud?.signature,stars:returned.stars===stars,deepSpace:returned.deepSpace===deepSpace}}})()`);
  ok(!scenes.evolution.cloud && !scenes.trophies.cloud && scenes.evolution.event === null && scenes.trophies.event === null
    && scenes.evolution.stars && scenes.trophies.stars && scenes.evolution.deepSpace && scenes.trophies.deepSpace
    && scenes.returned.cloud === scenes.world && scenes.returned.stars && scenes.returned.deepSpace,
  `scene eligibility or stable sky failed: ${JSON.stringify(scenes)}`);
  await trustedSelector(t, '#scene-evolution'); await wait(100);
  const evolutionShot = await screenshot(`planetary-sky-evolution-${simulationLabel}-${path.renderer}.png`);
  await trustedSelector(t, '#scene-trophies'); await wait(100);
  const trophiesShot = await screenshot(`planetary-sky-trophies-${simulationLabel}-${path.renderer}.png`);
  await trustedSelector(t, '#scene-world'); await wait(100);
  const historyAndQuality = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,world=a.currentCelestialProjection(),stars=world.stars;
    a.makeRenderer(0x7357a11,'history');const history=a.currentCelestialProjection();a.makeRenderer(a.runSeed,'world',a.worldIdentity);
    a.applySettings({...a.settings,quality:'eco'},false);const eco=a.currentCelestialProjection();a.applySettings({...a.settings,quality:'high'},false);const high=a.currentCelestialProjection();
    a.applySettings({...a.settings,quality:'auto'},false);return{history:{enabled:history.cloudEnabled,changed:history.cloud?.signature!==world.cloud?.signature,stars:history.stars===stars,deepSpace:history.deepSpace===world.deepSpace},
      quality:{eco:eco.starCount,high:high.starCount,field:eco.cloud?.signature===high.cloud?.signature,stars:eco.stars===high.stars&&high.stars===stars}}})()`);
  ok(historyAndQuality.history.enabled && historyAndQuality.history.changed && historyAndQuality.history.stars && historyAndQuality.history.deepSpace
    && historyAndQuality.quality.eco === 224 && historyAndQuality.quality.high === 500
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
      if(!ext)return{attempted:false};ext.loseContext();return{attempted:true,before:{cloud:before.cloud?.signature,deepSpace:before.deepSpace?.signature,angles:[before.cloudPrimaryAngle,before.cloudSecondaryAngle],starCount:before.starCount,skySeed:before.skySeed,event:before.shootingStar?.id??null}}})()`);
    if (contextLoss.attempted) {
      const before = contextLoss.before;
      ok(await poll(() => evaluate(`window.__CELL_SPHERE_APP__.renderer.backend`), (value) => value === 'canvas2d', 5000), 'context loss did not reach Canvas');
      contextLoss = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,p=a.currentCelestialProjection();return{attempted:true,backend:a.renderer.backend,
        cloud:p.cloud?.signature,deepSpace:p.deepSpace?.signature,angles:[p.cloudPrimaryAngle,p.cloudSecondaryAngle],starCount:p.starCount,skySeed:p.skySeed,event:p.shootingStar?.id??null,field:a.renderer.cloudField?.signature,rendererDeepSpace:a.renderer.deepSpaceField?.signature,playable:Boolean(a.snapshot)}})()`);
      contextLoss = { ...contextLoss, before, angleDelta: Math.max(...contextLoss.angles.map((value,index)=>Math.abs(value-before.angles[index]))) };
      ok(contextLoss.backend === 'canvas2d' && contextLoss.cloud === contextLoss.field && contextLoss.cloud === before.cloud
        && contextLoss.deepSpace === contextLoss.rendererDeepSpace && contextLoss.deepSpace === before.deepSpace
        && contextLoss.starCount === before.starCount && contextLoss.skySeed === before.skySeed && contextLoss.event === before.event
        && contextLoss.angleDelta < .01 && contextLoss.playable,
        `context-loss celestial transfer failed: ${JSON.stringify(contextLoss)}`);
    }
  }
  ok(errors.length === 0, `planetary sky browser errors: ${errors.join(' | ')}`);
  return Object.freeze({ schema: 3, rendererPath: path.renderer, simulationPath: path.fallback ? 'fallback' : 'worker',
    settings: { reducedOsFresh, explicitReduced, storedReduced, storedAutomatic, noPreferenceFresh, osChange, touchMenu }, visibility,
    seeds: { home, world: path, scenes, historyAndQuality }, visual, responsive, forcedColors, highContrast, contextLoss,
    screenshots: { home: homeShot, world: worldShot, evolution: evolutionShot, trophies: trophiesShot,
      primary: primaryShot, secondary: secondaryShot,
      shooting: shootingShot, reduced: reducedShot, directions: orientationShots, near: nearShot, far: farShot } });
}

function visualExpression() {
  return `(async()=>{const a=window.__CELL_SPHERE_APP__,renderer=a.renderer,canvas=a.canvas,snapshot=a.snapshot,identity=a.worldIdentity;
    const [{shootingStarForSlot,SHOOTING_STAR_SLOT_MS,CLOUD_PRIMARY_PERIOD_MS,CLOUD_SECONDARY_PERIOD_MS,setCelestialReduced,advanceCelestialPresentation,celestialProjection},{projectedSphereDiameter},{focusCamera,rotate},{MAX_SKY_STARS,SKY_STAR_STRIDE}]=await Promise.all([
      import('./src/interface/policies/celestial-presentation.js'),import('./src/interface/policies/layout-policy.js'),import('./src/rendering/camera.js'),import('./src/rendering/star-field.js')]);
    cancelAnimationFrame(a.rafId);const state=a.celestial,saved={elapsed:state.elapsedMs,primaryMs:state.cloudPrimaryMs,secondaryMs:state.cloudSecondaryMs,lastNow:state.lastNow,reduced:state.reduced,camera:{...a.camera,direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()}};
    state.elapsedMs=0;state.cloudPrimaryMs=0;state.cloudSecondaryMs=0;state.lastNow=performance.now();const base=celestialProjection(state),savedSpeed=a.speed,scheduled=shootingStarForSlot(base.skySeed,4);
    state.elapsedMs=4*SHOOTING_STAR_SLOT_MS+scheduled.startOffsetMs+scheduled.durationMs*.5;const speedBefore=celestialProjection(state);a.setSpeed(.25);const slow=celestialProjection(state);a.setSpeed(1.5);const fast=celestialProjection(state);a.setSpeed(savedSpeed);state.elapsedMs=0;
    const speedInvariant={before:speedBefore.shootingStar?.id,slow:slow.shootingStar?.id,fast:fast.shootingStar?.id,angles:[speedBefore.cloudPrimaryAngle,speedBefore.cloudSecondaryAngle,slow.cloudPrimaryAngle,slow.cloudSecondaryAngle,fast.cloudPrimaryAngle,fast.cloudSecondaryAngle],restored:a.speed===savedSpeed};
    const neutral={...base,deepSpaceEnabled:false,starCounts:[0,0,0],starCount:0,cloudEnabled:false,shootingStar:null};
    const field={...base,starCounts:[0,0,0],starCount:0,cloudEnabled:false,shootingStar:null};
    const stars={...base,cloudEnabled:false,shootingStar:null},cloud={...base,shootingStar:null};
    const primary={...cloud,cloudPrimaryAngle:(cloud.cloudPrimaryAngle+Math.PI*.5)%(Math.PI*2)},secondary={...cloud,cloudSecondaryAngle:(cloud.cloudSecondaryAngle+Math.PI*.5)%(Math.PI*2)};
    const controlledMs=30*60000,moving={...cloud,cloudPrimaryAngle:(cloud.cloudPrimaryAngle+controlledMs/CLOUD_PRIMARY_PERIOD_MS*Math.PI*2)%(Math.PI*2),cloudSecondaryAngle:(cloud.cloudSecondaryAngle+controlledMs/CLOUD_SECONDARY_PERIOD_MS*Math.PI*2)%(Math.PI*2)};
    const width=canvas.width,height=canvas.height,cx=width*(.5+a.camera.offsetX*.5),cy=height*(.5-a.camera.offsetY*.5);
    const radius=renderer.backend==='canvas2d'?Math.min(width,height)*(canvas.clientWidth<600?.76:.52)*(3.1/a.camera.dist):projectedSphereDiameter(a.camera.dist,height)/2;
    let event=null;for(let slot=0;slot<64&&!event;slot++){const candidate=shootingStarForSlot(base.skySeed,slot),entry=circleEntry(candidate,[cx/width,cy/height],radius/width,width/height);if(entry!=null){const p=Math.min(.96,entry+candidate.tailLength*.55);event={...candidate,progress:p,visibility:1}}}
    if(!event)throw new Error('no shooting-star occlusion path');const shooting={...cloud,shootingStar:event};
    const before=a.worldResourceAudit().celestial,resourceBefore=renderer.backend==='webgl2'?{world:renderer.world.dynamicState(),background:renderer.backgroundState()}:renderer.lastFrameAudit;
    const neutralFrame=capture(neutral),fieldA=capture(field),fieldB=capture(field),starsA=capture(stars),starsB=capture(stars),cloudFrame=capture(cloud),primaryFrame=capture(primary),secondaryFrame=capture(secondary),movingFrame=capture(moving),shootingFrame=capture(shooting);
    rotate(a.camera,.47,.19);const rotatedStars=capture(stars),rotatedCloud=capture(cloud),cameraCloud=layerShift(starsA.data,cloudFrame.data,rotatedStars.data,rotatedCloud.data);Object.assign(a.camera,saved.camera);
    a.camera.dist=2.2;const nearCloud=diff(capture(stars).data,capture(cloud).data,'all',12);a.camera.dist=6.2;const farCloud=diff(capture(stars).data,capture(cloud).data,'all',12);Object.assign(a.camera,saved.camera);
    const broad=diff(neutralFrame.data,fieldA.data,'outside',2),fieldRepeat=diff(fieldA.data,fieldB.data,'all',0),star=diff(fieldA.data,starsA.data,'outside',2),repeat=diff(starsA.data,starsB.data,'all',0),starSpectrum=renderedStarSpectrum(fieldA.data,starsA.data),orbital=renderedOrbitalHierarchy(fieldA.data,starsA.data,starSpectrum),cover=diff(starsA.data,cloudFrame.data,'inside',18),primaryMotion=diff(cloudFrame.data,primaryFrame.data,'inside',1),secondaryMotion=diff(cloudFrame.data,secondaryFrame.data,'inside',1),motion=diff(cloudFrame.data,movingFrame.data,'inside',1),meteorOutside=diff(cloudFrame.data,shootingFrame.data,'outside',2),meteorInside=diff(cloudFrame.data,shootingFrame.data,'inside',0);
    const orientationProbes=[];for(const direction of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){focusCamera(a.camera,direction);const plain=capture(stars),atZero=capture(cloud),atPrimary=capture(primary),atSecondary=capture(secondary);orientationProbes.push({direction,coverage:diff(plain.data,atZero.data,'inside',8),primary:diff(atZero.data,atPrimary.data,'inside',1),secondary:diff(atZero.data,atSecondary.data,'inside',1)})}Object.assign(a.camera,saved.camera);
    const times=[],offTimes=[],emptyTimes=[],pairedDeltas=[],fullDeltas=[];for(let index=0;index<120;index++){let on,off,empty;const order=index%3;if(order===0){empty=capture(neutral).elapsed;off=capture(stars).elapsed;on=capture(moving).elapsed}else if(order===1){off=capture(stars).elapsed;on=capture(moving).elapsed;empty=capture(neutral).elapsed}else{on=capture(moving).elapsed;empty=capture(neutral).elapsed;off=capture(stars).elapsed}times.push(on);offTimes.push(off);emptyTimes.push(empty);pairedDeltas.push(on-off);fullDeltas.push(on-empty)}const after=renderer.backend==='webgl2'?{world:renderer.world.dynamicState(),background:renderer.backgroundState()}:renderer.lastFrameAudit;
    const anglesBefore=[celestialProjection(state).cloudPrimaryAngle,celestialProjection(state).cloudSecondaryAngle];setCelestialReduced(state,true,state.lastNow);advanceCelestialPresentation(state,state.lastNow+60000);const reduced=celestialProjection(state);setCelestialReduced(state,false,state.lastNow);
    const checks={orbitalHierarchy:orbital.valid,deepSpaceStable:fieldRepeat.maximum===0,
      starsVisible:star.changed>100&&star.mean>0,starsStable:repeat.maximum===0,starsNonLattice:starSpectrum.valid,
      cloudCoverage:base.cloud.coverage>=.18&&base.cloud.coverage<=.42&&cover.changed>1000&&cover.mean>1,
      cloudMoves:motion.changed>100&&motion.mean>0&&primaryMotion.changed>100&&secondaryMotion.changed>100,
      allDirections:orientationProbes.every(value=>value.primary.changed>100&&value.secondary.changed>100),
      shootingVisible:meteorOutside.changed>5,shootingOccluded:meteorInside.maximum===0,
      cloudAdheres:cameraCloud.changed>100&&nearCloud.changed>100&&farCloud.changed>100,
      reducedStatic:reduced.cloudEnabled&&reduced.cloudPrimaryAngle===anglesBefore[0]&&reduced.cloudSecondaryAngle===anglesBefore[1]&&reduced.shootingStar===null,
      speedIndependent:speedInvariant.before===speedInvariant.slow&&speedInvariant.slow===speedInvariant.fast&&new Set(speedInvariant.angles).size<=2&&speedInvariant.restored,
      fixedResources:base.deepSpace?.byteLength===98304&&base.cloud?.byteLength===24576
        &&base.stars?.byteLength===MAX_SKY_STARS*SKY_STAR_STRIDE*4&&base.stars.byteLength<=16384,
      fourDraws:renderer.backend==='canvas2d'||renderer.drawCalls===4,
      lifecycleOnly:renderer.backend==='canvas2d'?after?.celestial?.cloudFieldChanges===resourceBefore?.celestial?.cloudFieldChanges&&after?.celestial?.deepSpaceFieldChanges===resourceBefore?.celestial?.deepSpaceFieldChanges&&after?.celestial?.deepSpaceRasterBuilds===resourceBefore?.celestial?.deepSpaceRasterBuilds:after.world.cloudFieldUploads===resourceBefore.world.cloudFieldUploads&&after.background.deepSpaceFieldUploads===resourceBefore.background.deepSpaceFieldUploads};
    const directions=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]],stateFor=(kind)=>kind==='shooting'?shooting:kind==='primary'?primary:kind==='secondary'?secondary:kind==='reduced'?{...cloud,shootingStar:null}:cloud;
    const api={show(kind){Object.assign(a.camera,saved.camera);capture(stateFor(kind))},showOrientation(index,kind,distance){Object.assign(a.camera,saved.camera);focusCamera(a.camera,directions[index]??directions[0]);a.camera.dist=distance;capture(stateFor(kind))},restore(){state.elapsedMs=saved.elapsed;state.cloudPrimaryMs=saved.primaryMs;state.cloudSecondaryMs=saved.secondaryMs;state.lastNow=performance.now();state.reduced=saved.reduced;Object.assign(a.camera,saved.camera);a.last=performance.now();a.rafId=requestAnimationFrame(time=>a.frame(time));delete window.__CSG_PLANETARY_SKY_FIXTURE__;}};window.__CSG_PLANETARY_SKY_FIXTURE__=api;
    return{backend:renderer.backend,scene:a.scene,center:[cx,cy],radius,deepSpace:{width:base.deepSpace?.width,height:base.deepSpace?.height,components:base.deepSpace?.components,bytes:base.deepSpace?.byteLength,signature:base.deepSpace?.signature,minimumLuminance:base.deepSpace?.minimumLuminance,maximumLuminance:base.deepSpace?.maximumLuminance,meanLuminance:base.deepSpace?.meanLuminance,delta:broad,repeat:fieldRepeat,orbital},field:{faceSize:base.cloud?.faceSize,faceCount:base.cloud?.faceCount,bytes:base.cloud?.byteLength,signature:base.cloud?.signature,coverage:base.cloud?.coverage},stars:{count:base.starCount,counts:base.starCounts,bytes:base.stars?.byteLength,delta:star,repeat,spectrum:starSpectrum},cloud:{enabled:base.cloudEnabled,coverage:cover,motion,primaryMotion,secondaryMotion,controlledAngles:[moving.cloudPrimaryAngle,moving.cloudSecondaryAngle],orientationProbes,cameraCloud,nearCloud,farCloud},shooting:{id:event.id,slot:event.slotIndex,durationMs:event.durationMs,path:[event.startX,event.startY,event.endX,event.endY],progress:event.progress,outside:meteorOutside,inside:meteorInside},
      reduced:{anglesBefore,anglesAfter:[reduced.cloudPrimaryAngle,reduced.cloudSecondaryAngle],event:reduced.shootingStar},speedInvariant,timing:{fullSky:summarize(times),starsOnly:summarize(offTimes),emptySky:summarize(emptyTimes),cloudDelta:summarize(pairedDeltas),fullDelta:summarize(fullDeltas)},resources:{before:resourceBefore,after},clockBefore:before,checks,valid:Object.values(checks).every(Boolean)};
    function capture(celestial){const started=performance.now();renderer.render({snapshot,worldIdentity:identity,camera:a.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false,celestial});const elapsed=performance.now()-started;let data;if(renderer.backend==='webgl2'){data=new Uint8Array(width*height*4);renderer.gl.readPixels(0,0,width,height,renderer.gl.RGBA,renderer.gl.UNSIGNED_BYTE,data)}else data=renderer.ctx.getImageData(0,0,width,height).data;return{data,elapsed}}
    function diff(left,right,mask,threshold){let samples=0,changed=0,sum=0,maximum=0;const levels={d2:0,d6:0,d10:0,d14:0,d18:0,d22:0};for(let y=1;y<height;y+=2)for(let x=1;x<width;x+=2){const distance=Math.hypot(x-cx,y-cy),inside=distance<radius*.70,outside=distance>radius*1.12;if(mask==='inside'&&!inside||mask==='outside'&&!outside)continue;const row=renderer.backend==='webgl2'?height-1-y:y,at=(row*width+x)*4,d=Math.max(Math.abs(left[at]-right[at]),Math.abs(left[at+1]-right[at+1]),Math.abs(left[at+2]-right[at+2]));samples++;sum+=d;maximum=Math.max(maximum,d);if(d>threshold)changed++;for(const level of [2,6,10,14,18,22])if(d>level)levels['d'+level]++}return{samples,changed,fraction:changed/Math.max(1,samples),mean:sum/Math.max(1,samples),maximum,levels}}
    // Renderer-specific point footprints collapse to centroids before the independent frequency comparison.
    function renderedStarSpectrum(left,right){const mask=new Uint8Array(width*height);let marked=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){if(Math.hypot(x-cx,y-cy)<=radius*1.12)continue;const row=renderer.backend==='webgl2'?height-1-y:y,at=(row*width+x)*4,d=Math.max(Math.abs(left[at]-right[at]),Math.abs(left[at+1]-right[at+1]),Math.abs(left[at+2]-right[at+2]));if(d>2){mask[y*width+x]=1;marked++}}const queue=new Int32Array(marked),points=[];for(let start=0;start<mask.length;start++){if(mask[start]!==1)continue;let head=0,tail=0,count=0,sumX=0,sumY=0;queue[tail++]=start;mask[start]=2;while(head<tail){const at=queue[head++],x=at%width,y=(at-x)/width;count++;sumX+=x;sumY+=y;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(ox===0&&oy===0)continue;const nx=x+ox,ny=y+oy;if(nx<0||nx>=width||ny<0||ny>=height)continue;const next=ny*width+nx;if(mask[next]===1){mask[next]=2;queue[tail++]=next}}}points.push([sumX/count/width,sumY/count/height])}const observed=axialSpectrum(points),controls=[];for(let cohort=0;cohort<64;cohort++){const control=[];let attempt=0;while(control.length<points.length){const x=hashUnit(attempt,cohort,11),y=hashUnit(attempt,cohort,17);attempt++;if(Math.hypot(x*width-cx,y*height-cy)>radius*1.12)control.push([x,y])}controls.push(axialSpectrum(control).peak)}controls.sort((a,b)=>a-b);const controlMean=controls.reduce((sum,value)=>sum+value,0)/Math.max(1,controls.length),controlP95=controls[Math.floor((controls.length-1)*.95)]??1,limit=controlP95+.02,lattice=[];for(let gy=0;gy<12;gy++)for(let gx=0;gx<20;gx++){const jitterX=(hashUnit(gx,gy,3)-.5)*.18,jitterY=(hashUnit(gx,gy,7)-.5)*.18,x=(gx+.5+jitterX)/20,y=(gy+.5+jitterY)/12;if(Math.hypot(x*width-cx,y*height-cy)>radius*1.12)lattice.push([x,y])}const latticeControl=axialSpectrum(lattice);return{pixelCount:marked,componentCount:points.length,frequencyRange:[8,28],observed,randomControl:{cohorts:controls.length,mean:controlMean,p95:controlP95,margin:.02,limit},latticeControl:{columns:20,rows:12,jitterFraction:.18,points:lattice.length,...latticeControl},valid:points.length>=40&&observed.peak<=limit&&latticeControl.peak>limit+.2&&observed.peak<latticeControl.peak*.65}}
    function renderedOrbitalHierarchy(fieldPixels,starPixels,spectrum){const luminance=[],blockSums=new Float64Array(96),blockCounts=new Uint32Array(96);let brightBackdropPixels=0,signalPixels=0,corePixels=0,starEnergy=0,peakContrast=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){const distance=Math.hypot(x-cx,y-cy);if(distance<=radius*1.12)continue;const row=renderer.backend==='webgl2'?height-1-y:y,at=(row*width+x)*4,d=Math.max(Math.abs(fieldPixels[at]-starPixels[at]),Math.abs(fieldPixels[at+1]-starPixels[at+1]),Math.abs(fieldPixels[at+2]-starPixels[at+2]));if(d>4){signalPixels++;starEnergy+=d}if(d>18)corePixels++;peakContrast=Math.max(peakContrast,d);if(distance<=radius*1.32)continue;const luma=fieldPixels[at]*.2126+fieldPixels[at+1]*.7152+fieldPixels[at+2]*.0722;luminance.push(luma);if(luma>8)brightBackdropPixels++;const bx=Math.min(11,Math.floor(x/width*12)),by=Math.min(7,Math.floor(y/height*8)),block=by*12+bx;blockSums[block]+=luma;blockCounts[block]++}luminance.sort((a,b)=>a-b);const blocks=[];for(let index=0;index<blockSums.length;index++)if(blockCounts[index]>256)blocks.push(blockSums[index]/blockCounts[index]);blocks.sort((a,b)=>a-b);const mean=luminance.reduce((sum,value)=>sum+value,0)/Math.max(1,luminance.length),p50=quantile(luminance,.5),p95=quantile(luminance,.95),p99=quantile(luminance,.99),blockP10=quantile(blocks,.1),blockP90=quantile(blocks,.9),blackFraction=luminance.filter(value=>value<=6).length/Math.max(1,luminance.length),minimumComponents=renderer.backend==='webgl2'?125:100,minimumSignalPixels=renderer.backend==='webgl2'?650:500,prominence=corePixels/Math.max(1,brightBackdropPixels);const thresholds={backdropExclusionRadius:1.32,maximumMean:4,maximumP95:6,minimumBlackFraction:.98,maximumBlockSpread:2.5,minimumComponents,minimumSignalPixels,minimumCorePixels:300,minimumProminence:3};const background={samples:luminance.length,mean,p50,p95,p99,maximum:luminance.at(-1)??0,blackFraction,brightBackdropPixels,brightFraction:brightBackdropPixels/Math.max(1,luminance.length),blockCount:blocks.length,blockP10,blockP90,blockSpread:blockP90-blockP10},stars={componentCount:spectrum.componentCount,signalPixels,corePixels,peakContrast,meanSignal:starEnergy/Math.max(1,signalPixels)},valid=mean<=thresholds.maximumMean&&p95<=thresholds.maximumP95&&blackFraction>=thresholds.minimumBlackFraction&&background.blockSpread<=thresholds.maximumBlockSpread&&spectrum.componentCount>=thresholds.minimumComponents&&signalPixels>=thresholds.minimumSignalPixels&&corePixels>=thresholds.minimumCorePixels&&prominence>=thresholds.minimumProminence;return{background,stars,prominence,thresholds,valid}}
    function quantile(sorted,fraction){return sorted[Math.min(sorted.length-1,Math.max(0,Math.floor((sorted.length-1)*fraction)))]??0}
    function axialSpectrum(points){let peak=0,axis='x',frequency=8;for(const candidateAxis of ['x','y'])for(let candidate=8;candidate<=28;candidate++){let cosine=0,sine=0;const coordinate=candidateAxis==='x'?0:1;for(const point of points){const angle=Math.PI*2*candidate*point[coordinate];cosine+=Math.cos(angle);sine+=Math.sin(angle)}const amplitude=Math.hypot(cosine,sine)/Math.max(1,points.length);if(amplitude>peak){peak=amplitude;axis=candidateAxis;frequency=candidate}}return{peak,axis,frequency}}
    function hashUnit(x,y,salt){let value=(Math.imul(x+1,0x85ebca6b)^Math.imul(y+1,0xc2b2ae35)^Math.imul(salt,0x27d4eb2d))>>>0;value=Math.imul(value^(value>>>15),0x2c1b3c6d)>>>0;value=Math.imul(value^(value>>>12),0x297a2d39)>>>0;return((value^(value>>>15))>>>0)/4294967296}
    function layerShift(baseA,cloudA,baseB,cloudB){let samples=0,changed=0,sum=0;for(let y=1;y<height;y+=2)for(let x=1;x<width;x+=2){if(Math.hypot(x-cx,y-cy)>=radius*.7)continue;const row=renderer.backend==='webgl2'?height-1-y:y,at=(row*width+x)*4,a=Math.max(Math.abs(baseA[at]-cloudA[at]),Math.abs(baseA[at+1]-cloudA[at+1]),Math.abs(baseA[at+2]-cloudA[at+2])),b=Math.max(Math.abs(baseB[at]-cloudB[at]),Math.abs(baseB[at+1]-cloudB[at+1]),Math.abs(baseB[at+2]-cloudB[at+2])),d=Math.abs(a-b);if(Math.max(a,b)>4){samples++;sum+=d;if(d>3)changed++}}return{samples,changed,fraction:changed/Math.max(1,samples),mean:sum/Math.max(1,samples)}}
    function segment(point,start,end){const dx=end[0]-start[0],dy=end[1]-start[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((point[0]-start[0])*dx+(point[1]-start[1])*dy)/length)):0;return Math.hypot(point[0]-start[0]-dx*t,point[1]-start[1]-dy*t)}
    function circleEntry(value,center,radiusX,aspect){const sx=value.startX-center[0],sy=(value.startY-center[1])/aspect,dx=value.endX-value.startX,dy=(value.endY-value.startY)/aspect,a=dx*dx+dy*dy,b=2*(sx*dx+sy*dy),c=sx*sx+sy*sy-radiusX*radiusX,disc=b*b-4*a*c;if(!(disc>0)||c<=0)return null;const entry=(-b-Math.sqrt(disc))/(2*a);return entry>value.tailLength*.5&&entry<.88?entry:null}
    function summarize(values){const sorted=values.slice().sort((x,y)=>x-y);return{samples:values.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]}}function mix(x,y,t){return x+(y-x)*t}
  })()`;
}

async function settingsState(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,key=window.__CELL_SPHERE_BOOT__.storage.settings;return{
  osReduced:matchMedia('(prefers-reduced-motion: reduce)').matches,motion:a.settings.motion,documentMotion:document.documentElement.dataset.motion,
  quality:a.settings.quality,documentQuality:document.documentElement.dataset.quality,
  saved:JSON.parse(localStorage.getItem(key)),celestial:a.worldResourceAudit().celestial}})()`); }
async function trustedSelector(t, selector) { const value = await point(t.evaluate, selector); await t.click(...value); }
async function point(evaluate, selector) { return evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(node=>node.getClientRects().length);if(!e)throw new Error('missing visible ${selector}');const r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`); }
function ok(value, message) { if (!value) throw new Error(message); }
