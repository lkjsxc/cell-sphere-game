/** Trusted-CDP proof for production camera motion and projected World framing. */
export async function runCameraMotionScenario(t) {
  const { evaluate, wait, poll, click, pointerDown, pointerUp, flick, touchFlick, tap, pinch, touchCancel,
    wheel, key, screenshot, setViewport } = t;
  ok(await poll(() => evaluate('Boolean(window.__CELL_SPHERE_BOOT__?.playable)'), Boolean, 5000), 'camera scenario did not boot');
  const evidenceLabel = `${t.simulationFallback ? 'fallback' : 'worker'}-${await evaluate('window.__CELL_SPHERE_BOOT__.renderer')}`;

  await setViewport(320, 568); await evaluate(`document.documentElement.style.fontSize='32px'`); await wait(100);
  const homeText = await evaluate(`(()=>{const content=document.querySelector('.title-content'),button=document.getElementById('begin-button');button.scrollIntoView({block:'nearest'});const r=button.getBoundingClientRect();return{index:document.querySelector('.title-index').textContent.trim(),premise:document.querySelector('.title-premise').textContent,help:document.querySelector('.title-help').textContent,button:[r.left,r.top,r.right,r.bottom],scrollable:content.scrollHeight>content.clientHeight,noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth}})()`);
  ok(homeText.index.includes('AUTONOMOUS INCREMENTAL ECOLOGY')&&homeText.premise==='Life grows on its own, exhausts a finite world, and leaves Echoes for Evolution.'
    &&homeText.help==='Drag to turn · tap to inspect · no tending required'&&homeText.button[0]>=0&&homeText.button[1]>=0
    &&homeText.button[2]<=320&&homeText.button[3]<=568&&homeText.noHorizontalOverflow,
  `Home autonomous copy failed at 200% text: ${JSON.stringify(homeText)}`);
  await screenshot('shell-home-320x568-text-200.png');
  await evaluate(`(()=>{document.documentElement.style.fontSize='';document.querySelector('.title-content').scrollTop=0;return true})()`);

  await setViewport(390, 844); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.resetCameraMotion('home');return true})()`);
  const homeStart = await direction(evaluate); await wait(4200); const beforeIdle = await direction(evaluate);
  ok(distance(homeStart, beforeIdle) < 1e-8, `Home moved before idle delay: ${distance(homeStart, beforeIdle)}`);
  await wait(500); const homeOrbit = await motion(evaluate);
  ok(homeOrbit.state.mode === 'orbit' && distance(beforeIdle, homeOrbit.direction) > .002,
    `Home did not enter calm idle orbit: ${JSON.stringify(homeOrbit)}`);
  await wait(700); const homeOrbitEnd = await motion(evaluate);
  const homeOrbitRadians = vectorAngle(homeOrbit.direction, homeOrbitEnd.direction);
  const homeOrbitRate = homeOrbitRadians / ((homeOrbitEnd.now - homeOrbit.now) / 1000);
  ok(homeOrbitEnd.state.mode === 'orbit', `Home left idle orbit without activity: ${JSON.stringify(homeOrbitEnd)}`);
  ok(Math.abs(homeOrbitRate - .022) < .002,
    `Home idle orbit speed changed: ${JSON.stringify({ homeOrbitRate, homeOrbit, homeOrbitEnd })}`);
  await key('Shift'); const activity = await motion(evaluate); await wait(220); const afterActivity = await direction(evaluate);
  ok(activity.state.mode === 'idle-wait' && activity.state.speed === 0 && distance(activity.direction, afterActivity) < 1e-8,
    `trusted keyboard activity did not stop Home orbit: ${JSON.stringify(activity)}`);

  await trustedId(t, 'begin-button');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000), 'camera World did not start');
  const newWorld = await motion(evaluate);
  ok(newWorld.state.scene === 'world' && newWorld.state.mode === 'idle-wait' && newWorld.state.speed === 0,
    `new World did not begin from stillness: ${JSON.stringify(newWorld.state)}`);
  await trustedId(t, 'pause-button');
  const cameraEvidencePaused = await evaluate(`document.getElementById('pause-button').getAttribute('aria-pressed')==='true'`);
  ok(cameraEvidencePaused, 'camera-only evidence did not pause authoritative World time');
  const point = await globeCenter(evaluate);

  const mouseStrong = await measuredRelease(t, 'strong-mouse', () => flick(point,
    [point[0] + 110, point[1] + 52], { steps: 5, intervalMs: 16 }));
  assertReleaseClass(mouseStrong, 0.9, 1.25);
  const touchStrong = await measuredRelease(t, 'strong-touch', () => touchFlick(point,
    [point[0] - 110, point[1] + 52], { steps: 5, intervalMs: 16 }));
  assertReleaseClass(touchStrong, 0.9, 1.25);
  const strongParity = Math.abs(mouseStrong.cumulativeTurns - touchStrong.cumulativeTurns)
    / mouseStrong.cumulativeTurns;
  ok(strongParity <= .15, `mouse/touch release travel diverged: ${JSON.stringify({ mouseStrong, touchStrong })}`);

  const medium = await measuredRelease(t, 'medium-mouse', () => flick(point,
    [point[0] + 22, point[1] + 11], { steps: 5, intervalMs: 20 }));
  assertReleaseClass(medium, 0.18, 0.5);
  ok(medium.cumulativeTurns < mouseStrong.cumulativeTurns,
    `medium release did not remain below strong: ${JSON.stringify({ medium, mouseStrong })}`);

  const slowBefore = await motion(evaluate);
  await flick(point, [point[0] + 13, point[1]], { steps: 15, intervalMs: 20 });
  const slowRelease = await motion(evaluate); await wait(260); const slowAfter = await motion(evaluate);
  const slow = { rawReleaseSpeed: slowRelease.state.rawReleaseSpeed,
    mappedReleaseSpeed: slowRelease.state.mappedReleaseSpeed,
    directTravel: basisAngle(slowBefore.basis, slowRelease.basis),
    cumulativeRadians: basisAngle(slowRelease.basis, slowAfter.basis),
    cumulativeTurns: basisAngle(slowRelease.basis, slowAfter.basis) / (2 * Math.PI),
    releaseDurationMs: 0, sampleHighWater: slowRelease.state.sampleHighWater,
    basisError: basisError(slowAfter.basis), finalState: slowAfter.state };
  ok(slow.directTravel > .04 && slow.rawReleaseSpeed > 0 && slow.rawReleaseSpeed < .3
    && slow.mappedReleaseSpeed === 0 && slow.finalState.mode === 'idle-wait'
    && slow.finalState.speed === 0 && slow.cumulativeRadians < 1e-8
    && slowBefore.selectedNode === slowAfter.selectedNode,
  `slow precision drag became slippery or selected: ${JSON.stringify(slow)}`);

  await flick(point, [point[0] - 110, point[1] + 52]); await wait(70); await pointerDown(...point);
  const pointerPressed = await motion(evaluate); await wait(220); const pointerHeld = await motion(evaluate);
  ok(pointerPressed.state.mode === 'direct' && pointerPressed.state.speed === 0
    && basisAngle(pointerPressed.basis, pointerHeld.basis) < 1e-8,
  `pointer-down did not stop and hold release motion: ${JSON.stringify({ pointerPressed, pointerHeld })}`);
  await pointerUp(...point); await wait(80); await evaluate(`window.__CELL_SPHERE_APP__.closeActiveOverlay()`);

  await flick(point, [point[0] + 110, point[1] - 52]); await wait(70); await wheel(...point);
  const wheelStopped = await motion(evaluate); await wait(220); const wheelAfter = await motion(evaluate);
  ok(wheelStopped.state.mode === 'idle-wait' && wheelStopped.state.speed === 0
    && basisAngle(wheelStopped.basis, wheelAfter.basis) < 1e-8,
  `wheel did not cancel camera motion: ${JSON.stringify({ wheelStopped, wheelAfter })}`);

  await tap(...point); await wait(80); const tapState = await motion(evaluate);
  ok(tapState.state.mode !== 'inertia', `tap produced inertia: ${JSON.stringify(tapState.state)}`);
  await evaluate(`window.__CELL_SPHERE_APP__.closeActiveOverlay()`);
  await pinch(point); await wait(60); const pinchState = await motion(evaluate);
  ok(pinchState.state.mode !== 'inertia' && pinchState.state.speed === 0,
    `pinch produced angular inertia: ${JSON.stringify(pinchState.state)}`);
  await touchCancel(point); await wait(60); const cancelled = await motion(evaluate);
  ok(cancelled.state.mode !== 'inertia' && cancelled.state.speed === 0,
    `pointer cancellation retained velocity: ${JSON.stringify(cancelled.state)}`);

  await flick(point, [point[0] + 110, point[1] - 52]); await wait(70); await key('Shift');
  const keyboardStopped = await motion(evaluate); await wait(220); const keyboardAfter = await motion(evaluate);
  ok(keyboardStopped.state.mode === 'idle-wait' && keyboardStopped.state.speed === 0
    && basisAngle(keyboardStopped.basis, keyboardAfter.basis) < 1e-8,
  `trusted keyboard activity did not cancel inertia: ${JSON.stringify({ keyboardStopped, keyboardAfter })}`);

  await flick(point, [point[0] - 110, point[1] + 52]); await wait(70);
  await evaluate(`document.getElementById('speed-select').focus()`); const focusStopped = await motion(evaluate);
  await wait(220); const focusAfter = await motion(evaluate);
  ok(focusStopped.state.mode === 'idle-wait' && focusStopped.state.speed === 0
    && basisAngle(focusStopped.basis, focusAfter.basis) < 1e-8,
  `focus entry did not cancel inertia: ${JSON.stringify({ focusStopped, focusAfter })}`);

  await flick(point, [point[0] + 110, point[1] - 52]); await wait(70);
  await evaluate(`window.__CELL_SPHERE_APP__.selectScene('evolution')`); const sceneStopped = await motion(evaluate);
  await wait(220); const sceneAfter = await motion(evaluate);
  ok(sceneStopped.state.scene === 'evolution' && sceneStopped.state.speed === 0
    && basisAngle(sceneStopped.basis, sceneAfter.basis) < 1e-8,
  `scene change did not cancel inertia: ${JSON.stringify({ sceneStopped, sceneAfter })}`);
  await evaluate(`window.__CELL_SPHERE_APP__.selectScene('world')`);

  await flick(point, [point[0] - 110, point[1] + 52]); await wait(70);
  await evaluate(`window.__CELL_SPHERE_APP__.resetCameraMotion('world')`); const worldReset = await motion(evaluate);
  await wait(220); const worldResetAfter = await motion(evaluate);
  ok(worldReset.state.scene === 'world' && worldReset.state.speed === 0
    && basisAngle(worldReset.basis, worldResetAfter.basis) < 1e-8,
  `World replacement camera reset retained inertia: ${JSON.stringify({ worldReset, worldResetAfter })}`);

  const repeatedCancellations = [];
  for (let cycle = 0; cycle < 3; cycle++) {
    await flick(point, [point[0] + 100, point[1] + 45]); await wait(45); await key('Shift');
    const stopped = await motion(evaluate); repeatedCancellations.push(stopped.state);
    ok(stopped.state.speed === 0 && stopped.state.sampleHighWater <= 6,
      `repeated release cycle leaked motion or samples: ${JSON.stringify(stopped.state)}`);
  }

  await setViewport(844, 390); await wait(120); const landscapePoint = await globeCenter(evaluate);
  await flick(landscapePoint, [landscapePoint[0] + 150, landscapePoint[1] - 70], { steps: 5, intervalMs: 16 }); await wait(120);
  const landscapeMoving = await motion(evaluate); const landscapeName = `kinetic-release-${evidenceLabel}-844x390.png`;
  const landscapeImage = await screenshot(landscapeName);
  await key('Shift'); const landscapeStopped = await motion(evaluate); await wait(220); const landscapeAfter = await motion(evaluate);
  ok(landscapeMoving.state.mode === 'inertia' && landscapeStopped.state.speed === 0
    && basisAngle(landscapeStopped.basis, landscapeAfter.basis) < 1e-8,
  `small-landscape release was not visible and cancellable: ${JSON.stringify({ landscapeMoving, landscapeStopped })}`);

  await setViewport(1440, 900); await wait(120); const widePoint = await globeCenter(evaluate);
  await flick(widePoint, [widePoint[0] - 180, widePoint[1] + 84], { steps: 5, intervalMs: 16 }); await wait(120);
  const wideMoving = await motion(evaluate); const wideName = `kinetic-release-${evidenceLabel}-1440x900.png`;
  const wideImage = await screenshot(wideName);
  await key('Shift'); const wideStopped = await motion(evaluate); await wait(220); const wideAfter = await motion(evaluate);
  ok(wideMoving.state.mode === 'inertia' && wideStopped.state.speed === 0
    && basisAngle(wideStopped.basis, wideAfter.basis) < 1e-8,
  `wide release was not visible and cancellable: ${JSON.stringify({ wideMoving, wideStopped })}`);

  await trustedId(t, 'score-button');
  const heldStart = await motion(evaluate); const exposed = await globeCenter(evaluate);
  await flick(exposed, [exposed[0] + 95, exposed[1] + 40]); const heldRelease = await motion(evaluate); await wait(220);
  const heldAfter = await motion(evaluate);
  ok(heldStart.state.surfaceOpen && heldRelease.state.mode === 'held' && heldRelease.state.speed === 0
    && distance(heldStart.direction, heldRelease.direction) > .08 && distance(heldRelease.direction, heldAfter.direction) < 1e-8,
  `surface did not allow direct drag while suppressing release motion: ${JSON.stringify({ heldStart, heldRelease, heldAfter })}`);
  await trustedId(t, 'score-button'); const closed = await motion(evaluate);
  ok(!closed.state.surfaceOpen && closed.state.mode === 'idle-wait' && closed.state.idleUntil > closed.now,
    `surface close did not start a fresh idle delay: ${JSON.stringify(closed.state)}`);

  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'});return true})()`);
  const reducedStart = await direction(evaluate); await flick(exposed, [exposed[0] - 100, exposed[1] + 35]);
  const reducedRelease = await motion(evaluate); await wait(220); const reducedAfter = await motion(evaluate);
  ok(reducedRelease.state.mode === 'reduced' && reducedRelease.state.speed === 0
    && distance(reducedStart, reducedRelease.direction) > .08 && distance(reducedRelease.direction, reducedAfter.direction) < 1e-8,
  `reduced motion did not retain direct manipulation without inertia: ${JSON.stringify({ reducedRelease, reducedAfter })}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});return true})()`);

  await flick(exposed, [exposed[0] + 100, exposed[1] - 35]);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.focusCamera(a.topo.positions.subarray(0,3));return true})()`);
  const focused = await motion(evaluate);
  ok(focused.state.mode === 'idle-wait' && focused.state.speed === 0, `focus framing retained velocity: ${JSON.stringify(focused.state)}`);

  await flick(exposed, [exposed[0] + 110, exposed[1] - 52]); await wait(70);
  const hiddenBefore = await evaluate(`(()=>{const direction=window.__CELL_SPHERE_APP__.camera.direction.slice();
    Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));return direction})()`);
  await wait(600);
  const hidden = await motion(evaluate);
  ok(distance(hiddenBefore, hidden.direction) < 1e-8 && hidden.state.mode === 'suspended' && hidden.state.hidden,
    `hidden-page motion advanced or retained velocity: ${JSON.stringify(hidden)}`);
  await evaluate(`(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));return true})()`);
  await wait(80); const resumed = await motion(evaluate);
  ok(distance(hiddenBefore, resumed.direction) < 1e-8 && resumed.state.mode === 'idle-wait' && !resumed.state.hidden
    && resumed.state.idleUntil > resumed.now, `visible resume did not start a fresh idle delay: ${JSON.stringify(resumed)}`);

  const geometry = await geometryMatrix(t);
  const sameClass = await sameClassZoomEvidence(t);
  ok(sameClass.preserved, `same-class resize lost intentional zoom: ${JSON.stringify(sameClass)}`);

  await evaluate(`localStorage.clear();location.reload();true`); await wait(1700);
  ok(await poll(() => evaluate('Boolean(window.__CELL_SPHERE_BOOT__?.playable)'), Boolean, 5000), 'camera scenario cleanup reload failed');
  return { policy: await evaluate(`(()=>{const c=window.__CELL_SPHERE_APP__.cameraMotion.config;return{
      sampleCapacity:c.sampleCapacity,sampleWindowMs:c.sampleWindowMs,releaseThreshold:c.releaseThreshold,
      fullFlingInputSpeed:c.fullFlingInputSpeed,maximumAngularSpeed:c.maximumAngularSpeed,
      dampingHalfLifeMs:c.dampingHalfLifeMs,stopSpeed:c.stopSpeed,maximumInertiaMs:c.maximumInertiaMs,
      idleDelayMs:c.idleDelayMs,idleOrbitSpeed:c.idleOrbitSpeed,maximumFrameMs:c.maximumFrameMs}})()`),
    homeText, homeOrbitTravel: distance(beforeIdle, homeOrbit.direction), homeOrbitRate, cameraEvidencePaused,
    releases: { mouseStrong, touchStrong, medium, slow, strongParity },
    cancellations: { pointerDown: pointerPressed.state, wheel: wheelStopped.state, tap: tapState.state, pinch: pinchState.state,
      pointerCancel: cancelled.state, keyboard: keyboardStopped.state, focus: focusStopped.state,
      sceneChange: sceneStopped.state, worldReplacementReset: worldReset.state,
      repeated: repeatedCancellations, surface: heldRelease.state, focusFraming: focused.state,
      hidden: hidden.state, landscape: landscapeStopped.state, wide: wideStopped.state },
    accessibility: { reduced: reducedRelease.state }, geometry, sameClass,
    viewportMotion: { portrait: [390,844], landscape: [844,390], wide: [1440,900],
      landscapeImage: { path: `reports/${landscapeName}`, ...landscapeImage },
      wideImage: { path: `reports/${wideName}`, ...wideImage } },
    backend: await evaluate('window.__CELL_SPHERE_BOOT__.renderer') };
}

async function geometryMatrix({ evaluate, setViewport, wait }) {
  const rows = [];
  for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390],[1024,600],[1440,900]]) {
    await setViewport(width, height); await wait(100);
    const row = await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__;a.resize(false);const {projectedSphereDiameter}=await import('./src/interface/policies/layout-policy.js'),
      {pickNode}=await import('./src/rendering/picking.js'),rect=a.canvas.getBoundingClientRect(),layout=a.layout,diameter=projectedSphereDiameter(a.camera.dist,rect.height),
      center={x:rect.left+rect.width*(1+a.camera.offsetX)/2,y:rect.top+rect.height*(1-a.camera.offsetY)/2},radius=diameter/2,
      visible=e=>{const r=e.getBoundingClientRect();return !e.hidden&&r.width>0&&r.height>0},controls=[...document.querySelectorAll('#scene-selector button,.hud-metrics button,.command-rail button,.command-rail select')].filter(visible),
      controlRects=controls.map(e=>{const r=e.getBoundingClientRect(),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;return{id:e.id,left:r.left,top:r.top,right:r.right,bottom:r.bottom,x,y,distance:Math.hypot(x-center.x,y-center.y)}}),
      inside=controlRects.filter(control=>control.distance<radius*.7).map(control=>control.id);
      return{viewport:[innerWidth,innerHeight],ratio:diameter/Math.min(rect.width,rect.height),target:layout.targetDiameterRatio,center,radius,inside,controlRects,
        pick:pickNode(a.canvas,center.x,center.y,a.camera,a.topo)?.node??null,noOverflow:document.documentElement.scrollWidth<=innerWidth,
        controlsBounded:controls.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})}})()`);
    ok(Math.abs(row.ratio - row.target) <= .0001 && !row.inside.length && row.pick != null
      && row.noOverflow && row.controlsBounded, `projected framing failed ${width}x${height}: ${JSON.stringify(row)}`);
    rows.push(row);
  }
  return rows;
}

async function sameClassZoomEvidence({ evaluate, setViewport, wait }) {
  await setViewport(390, 844); await wait(100);
  const before = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.resize(false);a.camera.dist*=.9;return a.camera.dist})()`);
  await setViewport(430, 932); await wait(140); const after = await evaluate('window.__CELL_SPHERE_APP__.camera.dist');
  return { before, after, preserved: Math.abs(before - after) < 1e-8 };
}

async function measuredRelease({ evaluate, poll }, label, performGesture) {
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,prior=window.__KINETIC_RELEASE_OBSERVER__;
    if(prior?.raf)cancelAnimationFrame(prior.raf);if(prior?.releaseListener)document.removeEventListener('pointerup',prior.releaseListener,true);
    const dot=(x,y)=>x[0]*y[0]+x[1]*y[1]+x[2]*y[2],
    angle=(x,y)=>Math.acos(Math.max(-1,Math.min(1,dot(x,y)))),copy=()=>({direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()}),
    error=b=>Math.max(Math.abs(Math.hypot(...b.direction)-1),Math.abs(Math.hypot(...b.right)-1),Math.abs(Math.hypot(...b.up)-1),
      Math.abs(dot(b.direction,b.right)),Math.abs(dot(b.direction,b.up)),Math.abs(dot(b.right,b.up))),
    record={label:${JSON.stringify(label)},status:'armed',armedAt:performance.now(),startedAt:null,completedAt:null,
      cumulativeRadians:0,cumulativeTurns:0,releaseDurationMs:0,samples:0,sampleHighWater:0,basisError:0,
      release:null,releaseBasis:null,releasedAt:null,releaseListener:null,finalState:null,startBasis:null,finalBasis:null,previous:null,raf:0};
    record.releaseListener=()=>{record.releaseBasis=copy();record.releasedAt=performance.now();};
    document.addEventListener('pointerup',record.releaseListener,{capture:true,once:true});
    const cleanup=()=>{document.removeEventListener('pointerup',record.releaseListener,true);record.releaseListener=null;};
    const step=now=>{const state=a.worldResourceAudit().cameraMotion,current=copy();record.sampleHighWater=Math.max(record.sampleHighWater,state.sampleHighWater??0);
      record.basisError=Math.max(record.basisError,error(current));
      if(record.status==='armed'&&state.mode==='inertia'){const origin=record.releaseBasis??current;record.status='tracking';record.startedAt=record.releasedAt??now;
        record.startBasis=origin;record.previous=current;record.cumulativeRadians=angle(origin.direction,current.direction);record.samples=1;
        record.release={rawReleaseSpeed:state.rawReleaseSpeed,mappedReleaseSpeed:state.mappedReleaseSpeed,speed:state.speed,
          velocityX:state.velocityX,velocityY:state.velocityY,idleUntil:state.idleUntil};}
      else if(record.status==='tracking'){record.cumulativeRadians+=angle(record.previous.direction,current.direction);record.samples++;record.previous=current;
        if(state.mode!=='inertia'){record.status='complete';record.completedAt=now;record.releaseDurationMs=now-record.startedAt;
          record.cumulativeTurns=record.cumulativeRadians/(2*Math.PI);record.finalState=state;record.finalBasis=current;record.previous=null;record.raf=0;cleanup();return;}}
      if(now-record.armedAt>6500||record.samples>=480){record.status='timed-out';record.completedAt=now;record.finalState=state;record.finalBasis=current;record.previous=null;record.raf=0;cleanup();return;}
      record.raf=requestAnimationFrame(step);};window.__KINETIC_RELEASE_OBSERVER__=record;record.raf=requestAnimationFrame(step);return true})()`);
  await performGesture();
  const immediate = await motion(evaluate);
  await evaluate(`(()=>{const r=window.__KINETIC_RELEASE_OBSERVER__;if(r)r.immediate=${JSON.stringify(immediate)};return true})()`);
  if (immediate.state.mode !== 'inertia') {
    await evaluate(`(()=>{const r=window.__KINETIC_RELEASE_OBSERVER__;if(!r)return false;if(r.raf)cancelAnimationFrame(r.raf);
      if(r.releaseListener)document.removeEventListener('pointerup',r.releaseListener,true);r.releaseListener=null;
      r.raf=0;r.status='no-inertia';r.completedAt=performance.now();r.finalState=r.immediate.state;r.finalBasis=r.immediate.basis;return true})()`);
  }
  const completed = await poll(() => evaluate('window.__KINETIC_RELEASE_OBSERVER__?.status'),
    (status) => status === 'complete' || status === 'timed-out' || status === 'no-inertia', 6700, 25);
  ok(completed, `${label} cumulative release observer did not finish`);
  return evaluate(`(()=>{const r=window.__KINETIC_RELEASE_OBSERVER__;return{label:r.label,status:r.status,completedAt:r.completedAt,
    cumulativeRadians:r.cumulativeRadians,cumulativeTurns:r.cumulativeTurns,releaseDurationMs:r.releaseDurationMs,
    samples:r.samples,sampleHighWater:r.sampleHighWater,basisError:r.basisError,release:r.release,
    finalState:r.finalState,startBasis:r.startBasis,finalBasis:r.finalBasis,immediate:r.immediate}})()`);
}

function assertReleaseClass(evidence, minimumTurns, maximumTurns) {
  ok(evidence.status === 'complete' && evidence.release?.rawReleaseSpeed > 0
    && evidence.release?.mappedReleaseSpeed > 0 && evidence.release.mappedReleaseSpeed <= 8
    && evidence.cumulativeTurns >= minimumTurns && evidence.cumulativeTurns <= maximumTurns
    && evidence.cumulativeTurns <= 1.35 && evidence.releaseDurationMs <= 5100
    && evidence.samples > 0 && evidence.samples <= 480 && evidence.sampleHighWater <= 6
    && evidence.basisError < 1e-10 && evidence.finalState?.mode === 'idle-wait'
    && evidence.finalState?.speed === 0 && evidence.finalState?.idleUntil > evidence.completedAt,
  `release class failed ${minimumTurns}-${maximumTurns} turns: ${JSON.stringify(evidence)}`);
}

async function motion(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{now:performance.now(),
  direction:a.camera.direction.slice(),basis:{direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()},
  selectedNode:a.selectedNode??null,state:a.worldResourceAudit().cameraMotion}})()`); }
async function direction(evaluate) { return evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()'); }
async function globeCenter(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,r=a.canvas.getBoundingClientRect();return[r.left+r.width*(1+a.camera.offsetX)/2,r.top+r.height*(1-a.camera.offsetY)/2]})()`); }
async function trustedId({ evaluate, click }, id) { const point = await evaluate(`(()=>{const r=document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`); await click(...point); }
function basisAngle(a, b) { return vectorAngle(a.direction, b.direction); }
function basisError(basis) { return Math.max(...[basis.direction,basis.right,basis.up].map(v=>Math.abs(Math.hypot(...v)-1)),
  Math.abs(dot(basis.direction,basis.right)),Math.abs(dot(basis.direction,basis.up)),Math.abs(dot(basis.right,basis.up))); }
function dot(a, b) { return a.reduce((sum,value,index)=>sum+value*b[index],0); }
function vectorAngle(a, b) { const cosine=Math.max(-1,Math.min(1,dot(a,b)));
  return cosine>1-1e-14?0:Math.acos(cosine); }
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
