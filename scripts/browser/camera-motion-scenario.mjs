/** Trusted-CDP proof for production camera motion and projected World framing. */
import { authorityFingerprint, normalizedFlick, sphereGeometry } from './camera-gesture-evidence.mjs';

export async function runCameraMotionScenario(t) {
  const { evaluate, wait, poll, click, pointerDown, pointerUp, tap, pinch, touchCancel,
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
  const authorityBefore = await authorityFingerprint(evaluate);
  const point = await globeCenter(evaluate);

  const mouseStrong = await measuredRelease(t, 'strong-mouse', () => normalizedFlick(t, 'mouse', .66, .26,
    { steps: 5, intervalMs: 16 }));
  assertFaithfulRelease(mouseStrong, 8.4, 9.3, 1.15, 1.28);
  const touchStrong = await measuredRelease(t, 'strong-touch', () => normalizedFlick(t, 'touch', -.66, .26,
    { steps: 5, intervalMs: 16 }));
  assertFaithfulRelease(touchStrong, 8.4, 9.3, 1.15, 1.28);
  const speedParity = Math.abs(mouseStrong.release.releaseSpeed - touchStrong.release.releaseSpeed)
    / mouseStrong.release.releaseSpeed;
  const pathParity = Math.abs(mouseStrong.cumulativeTurns - touchStrong.cumulativeTurns) / mouseStrong.cumulativeTurns;
  ok(speedParity <= .1 && pathParity <= .1,
    `mouse/touch normalized release diverged: ${JSON.stringify({ mouseStrong, touchStrong })}`);

  const faster = await measuredRelease(t, 'faster-mouse', () => normalizedFlick(t, 'mouse', 1.2, .48,
    { steps: 5, intervalMs: 16 }));
  assertFaithfulRelease(faster, 15.4, 16.9, 2.05, 2.35);
  const extreme = await measuredRelease(t, 'extreme-mouse', () => normalizedFlick(t, 'mouse', .744, .294,
    { steps: 5, intervalMs: 5 }));
  assertFaithfulRelease(extreme, 30.5, 33.5, 4.15, 4.65);
  ok(faster.release.releaseSpeed > mouseStrong.release.releaseSpeed * 1.7
    && extreme.release.releaseSpeed > faster.release.releaseSpeed * 1.8
    && faster.cumulativeTurns > mouseStrong.cumulativeTurns * 1.7
    && extreme.cumulativeTurns > faster.cumulativeTurns * 1.8,
  `faithful release strength plateaued: ${JSON.stringify({ mouseStrong, faster, extreme })}`);

  const medium = await measuredRelease(t, 'medium-mouse', () => normalizedFlick(t, 'mouse', .13, .055,
    { steps: 5, intervalMs: 20 }));
  assertFaithfulRelease(medium, 1.25, 1.55, .175, .21);
  ok(medium.cumulativeTurns < mouseStrong.cumulativeTurns,
    `medium release did not remain below strong: ${JSON.stringify({ medium, mouseStrong })}`);

  const gentle = await measuredRelease(t, 'gentle-mouse', () => normalizedFlick(t, 'mouse', .078, 0,
    { steps: 15, intervalMs: 20 }));
  assertFaithfulRelease(gentle, .24, .28, .025, .045);
  ok(gentle.directBasisRadians > .07 && gentle.immediate.input.lastGestureKind === 'drag',
  `gentle release lost direct manipulation or selection: ${JSON.stringify(gentle)}`);

  const precision = await stoppedDragEvidence(t, 'precision-mouse', .06, { steps: 15, intervalMs: 80 });
  ok(precision.directTravel > .05 && precision.releaseSpeed > 0 && precision.releaseSpeed < .08
    && precision.input.lastGestureKind === 'drag'
    && precision.finalState.mode === 'idle-wait' && precision.finalState.speed === 0
    && precision.cumulativeRadians < 1e-8 && precision.selectedBefore === precision.selectedAfter,
  `sub-threshold precision drag became slippery or selected: ${JSON.stringify(precision)}`);

  await normalizedFlick(t, 'mouse', -.66, .26); await wait(70); await pointerDown(...point);
  const pointerPressed = await motion(evaluate); await wait(220); const pointerHeld = await motion(evaluate);
  ok(pointerPressed.state.mode === 'direct' && pointerPressed.state.speed === 0
    && basisAngle(pointerPressed.basis, pointerHeld.basis) < 1e-8,
  `pointer-down did not stop and hold release motion: ${JSON.stringify({ pointerPressed, pointerHeld })}`);
  await pointerUp(...point); await wait(80); await evaluate(`window.__CELL_SPHERE_APP__.closeActiveOverlay()`);

  await normalizedFlick(t, 'mouse', .66, -.26); await wait(70); await wheel(...point);
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

  await normalizedFlick(t, 'mouse', .66, -.26); await wait(70); await key('Shift');
  const keyboardStopped = await motion(evaluate); await wait(220); const keyboardAfter = await motion(evaluate);
  ok(keyboardStopped.state.mode === 'idle-wait' && keyboardStopped.state.speed === 0
    && basisAngle(keyboardStopped.basis, keyboardAfter.basis) < 1e-8,
  `trusted keyboard activity did not cancel inertia: ${JSON.stringify({ keyboardStopped, keyboardAfter })}`);

  await normalizedFlick(t, 'mouse', -.66, .26); await wait(70);
  await evaluate(`document.getElementById('speed-select').focus()`); const focusStopped = await motion(evaluate);
  await wait(220); const focusAfter = await motion(evaluate);
  ok(focusStopped.state.mode === 'idle-wait' && focusStopped.state.speed === 0
    && basisAngle(focusStopped.basis, focusAfter.basis) < 1e-8,
  `focus entry did not cancel inertia: ${JSON.stringify({ focusStopped, focusAfter })}`);

  await normalizedFlick(t, 'mouse', .66, -.26); await wait(70);
  await evaluate(`window.__CELL_SPHERE_APP__.selectScene('evolution')`); const sceneStopped = await motion(evaluate);
  await wait(220); const sceneAfter = await motion(evaluate);
  ok(sceneStopped.state.scene === 'evolution' && sceneStopped.state.speed === 0
    && basisAngle(sceneStopped.basis, sceneAfter.basis) < 1e-8,
  `scene change did not cancel inertia: ${JSON.stringify({ sceneStopped, sceneAfter })}`);
  await evaluate(`window.__CELL_SPHERE_APP__.selectScene('world')`);

  await normalizedFlick(t, 'mouse', -.66, .26); await wait(70);
  await evaluate(`window.__CELL_SPHERE_APP__.resetCameraMotion('world')`); const worldReset = await motion(evaluate);
  await wait(220); const worldResetAfter = await motion(evaluate);
  ok(worldReset.state.scene === 'world' && worldReset.state.speed === 0
    && basisAngle(worldReset.basis, worldResetAfter.basis) < 1e-8,
  `World replacement camera reset retained inertia: ${JSON.stringify({ worldReset, worldResetAfter })}`);

  const repeatedCancellations = [];
  for (let cycle = 0; cycle < 3; cycle++) {
    await normalizedFlick(t, 'mouse', .60, .24); await wait(45); await key('Shift');
    const stopped = await motion(evaluate); repeatedCancellations.push(stopped.state);
    ok(stopped.state.speed === 0 && stopped.state.sampleHighWater <= 6,
      `repeated release cycle leaked motion or samples: ${JSON.stringify(stopped.state)}`);
  }

  await setViewport(844, 390); await wait(120);
  await normalizedFlick(t, 'mouse', .66, -.26, { steps: 5, intervalMs: 16 }); await wait(120);
  const landscapeMoving = await motion(evaluate); const landscapeName = `kinetic-release-${evidenceLabel}-844x390.png`;
  const landscapeImage = await screenshot(landscapeName);
  await key('Shift'); const landscapeStopped = await motion(evaluate); await wait(220); const landscapeAfter = await motion(evaluate);
  ok(landscapeMoving.state.mode === 'inertia' && landscapeStopped.state.speed === 0
    && basisAngle(landscapeStopped.basis, landscapeAfter.basis) < 1e-8,
  `small-landscape release was not visible and cancellable: ${JSON.stringify({ landscapeMoving, landscapeStopped })}`);

  await setViewport(1440, 900); await wait(120);
  await normalizedFlick(t, 'mouse', -.66, .26, { steps: 5, intervalMs: 16 }); await wait(120);
  const wideMoving = await motion(evaluate); const wideName = `kinetic-release-${evidenceLabel}-1440x900.png`;
  const wideImage = await screenshot(wideName);
  await key('Shift'); const wideStopped = await motion(evaluate); await wait(220); const wideAfter = await motion(evaluate);
  ok(wideMoving.state.mode === 'inertia' && wideStopped.state.speed === 0
    && basisAngle(wideStopped.basis, wideAfter.basis) < 1e-8,
  `wide release was not visible and cancellable: ${JSON.stringify({ wideMoving, wideStopped })}`);

  await trustedId(t, 'score-button');
  const heldStart = await surfaceMotion(evaluate);
  const surfaceRelease = await measuredRelease(t, 'open-detail-canvas', () => normalizedFlick(t, 'mouse', .55, .22,
    { steps: 5, intervalMs: 16 }));
  assertFaithfulRelease(surfaceRelease, 6.9, 7.8, .9, 1.1, { finalMode: 'held' });
  await wait(260); const heldAfter = await surfaceMotion(evaluate);
  ok(heldStart.state.surfaceOpen && surfaceRelease.release.surfaceOpen
    && surfaceRelease.finalState?.mode === 'held' && surfaceRelease.finalState?.surfaceOpen
    && heldAfter.state.mode === 'held' && heldAfter.state.speed === 0
    && surfaceRelease.finalBasis && basisAngle(surfaceRelease.finalBasis, heldAfter.basis) < 1e-8
    && heldStart.surface.overlay === heldAfter.surface.overlay && heldAfter.surface.overlay === 'metric'
    && heldAfter.surface.activeElement === 'gl-canvas',
  `open-detail canvas release lost surface, focus, rest, or orbit hold: ${JSON.stringify({ heldStart, surfaceRelease, heldAfter })}`);
  await trustedId(t, 'score-button'); const closed = await motion(evaluate);
  ok(!closed.state.surfaceOpen && closed.state.mode === 'idle-wait' && closed.state.idleUntil > closed.now,
    `surface close did not start a fresh idle delay: ${JSON.stringify(closed.state)}`);

  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'});return true})()`);
  const reducedStart = await direction(evaluate); await normalizedFlick(t, 'mouse', -.55, .22);
  const reducedRelease = await motion(evaluate); await wait(220); const reducedAfter = await motion(evaluate);
  ok(reducedRelease.state.mode === 'reduced' && reducedRelease.state.speed === 0
    && distance(reducedStart, reducedRelease.direction) > .08 && distance(reducedRelease.direction, reducedAfter.direction) < 1e-8,
  `reduced motion did not retain direct manipulation without inertia: ${JSON.stringify({ reducedRelease, reducedAfter })}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});return true})()`);

  await normalizedFlick(t, 'mouse', .55, -.22);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.focusCamera(a.topo.positions.subarray(0,3));return true})()`);
  const focused = await motion(evaluate);
  ok(focused.state.mode === 'idle-wait' && focused.state.speed === 0, `focus framing retained velocity: ${JSON.stringify(focused.state)}`);

  await normalizedFlick(t, 'mouse', .66, -.26); await wait(70);
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
  const zoom = await zoomGestureEvidence(t);
  const frozenResize = await frozenResizeEvidence(t);
  const authorityAfter = await authorityFingerprint(evaluate);
  ok(authorityBefore.hash === authorityAfter.hash && authorityBefore.tick === authorityAfter.tick
    && JSON.stringify(authorityBefore.worldIdentity) === JSON.stringify(authorityAfter.worldIdentity),
    `camera activity changed paused authority: ${JSON.stringify({ authorityBefore, authorityAfter })}`);

  await evaluate(`localStorage.clear();location.reload();true`); await wait(1700);
  ok(await poll(() => evaluate('Boolean(window.__CELL_SPHERE_BOOT__?.playable)'), Boolean, 5000), 'camera scenario cleanup reload failed');
  return { policy: await evaluate(`(()=>{const c=window.__CELL_SPHERE_APP__.cameraMotion.config;return{
      sampleCapacity:c.sampleCapacity,sampleWindowMs:c.sampleWindowMs,releaseThreshold:c.releaseThreshold,
      dampingHalfLifeMs:c.dampingHalfLifeMs,stopSpeed:c.stopSpeed,
      idleDelayMs:c.idleDelayMs,idleOrbitSpeed:c.idleOrbitSpeed,maximumFrameMs:c.maximumFrameMs}})()`),
    homeText, homeOrbitTravel: distance(beforeIdle, homeOrbit.direction), homeOrbitRate, cameraEvidencePaused,
    authority: { before: authorityBefore, after: authorityAfter, unchanged: true },
    releases: { mouseStrong, touchStrong, faster, extreme, medium, gentle, precision,
      parity: { speed: speedParity, path: pathParity } },
    cancellations: { pointerDown: pointerPressed.state, wheel: wheelStopped.state, tap: tapState.state, pinch: pinchState.state,
      pointerCancel: cancelled.state, keyboard: keyboardStopped.state, focus: focusStopped.state,
      sceneChange: sceneStopped.state, worldReplacementReset: worldReset.state,
      repeated: repeatedCancellations, surface: surfaceRelease, focusFraming: focused.state,
      hidden: hidden.state, landscape: landscapeStopped.state, wide: wideStopped.state },
    accessibility: { reduced: reducedRelease.state }, geometry, sameClass, zoom, frozenResize,
    viewportMotion: { portrait: [390,844], landscape: [844,390], wide: [1440,900],
      landscapeImage: { path: `reports/${landscapeName}`, ...landscapeImage },
      wideImage: { path: `reports/${wideName}`, ...wideImage } },
    renderer: await evaluate(`(()=>{const renderer=window.__CELL_SPHERE_APP__.renderer;return{
      backend:window.__CELL_SPHERE_BOOT__.renderer,drawCalls:renderer.drawCalls??null}})()`) };
}

async function geometryMatrix(t) {
  const { evaluate, setViewport, wait } = t;
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'});return true})()`);
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
    const before = await motion(evaluate); const gesture = await normalizedFlick(t, 'mouse', 1, 0,
      { steps: 5, intervalMs: 12 }); const after = await motion(evaluate);
    row.direct = { gesture, angularPath: after.input.lastAngularTravelRadians,
      basisPath: basisAngle(before.basis, after.basis), input: after.input,
      selectedBefore: before.selectedNode, selectedAfter: after.selectedNode, basisError: basisError(after.basis) };
    ok(Math.abs(row.direct.angularPath - 1) <= .03 && Math.abs(row.direct.basisPath - 1) <= .03
      && Math.abs(row.direct.input.lastGestureRadiusCssPx - row.radius) <= .01
      && row.direct.input.lastGestureKind === 'drag' && row.direct.input.lastPointerType === 'mouse'
      && row.direct.selectedBefore === row.direct.selectedAfter && row.direct.basisError < 1e-10,
    `normalized direct travel failed ${width}x${height}: ${JSON.stringify(row.direct)}`);
    rows.push(row);
  }
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});return true})()`);
  const paths = rows.map((row) => row.direct.angularPath); const spread = Math.max(...paths) - Math.min(...paths);
  ok(spread <= .03, `cross-viewport normalized path spread exceeded 3%: ${JSON.stringify(paths)}`);
  return { rows, spread };
}

async function sameClassZoomEvidence({ evaluate, setViewport, wait }) {
  await setViewport(390, 844); await wait(100);
  const before = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.resize(false);a.camera.dist*=.9;return a.camera.dist})()`);
  await setViewport(430, 932); await wait(140); const after = await evaluate('window.__CELL_SPHERE_APP__.camera.dist');
  return { before, after, preserved: Math.abs(before - after) < 1e-8 };
}

async function zoomGestureEvidence(t) {
  const { evaluate, setViewport, wait, wheel } = t;
  await setViewport(390, 844); await wait(100);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.resize(false);a.applySettings({...a.settings,motion:'reduced'});return true})()`);
  const center = await globeCenter(evaluate); const beforeDistance = await evaluate('window.__CELL_SPHERE_APP__.camera.dist');
  await wheel(...center); await wait(80); const afterDistance = await evaluate('window.__CELL_SPHERE_APP__.camera.dist');
  const before = await motion(evaluate); const gesture = await normalizedFlick(t, 'mouse', 1, 0, { steps: 5, intervalMs: 12 });
  const after = await motion(evaluate); const angularPath = after.input.lastAngularTravelRadians;
  const basisPath = basisAngle(before.basis, after.basis);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});return true})()`);
  ok(afterDistance > beforeDistance && Math.abs(angularPath - 1) <= .05 && Math.abs(basisPath - 1) <= .05,
    `next gesture after wheel zoom was not normalized: ${JSON.stringify({ beforeDistance, afterDistance, gesture, angularPath, basisPath })}`);
  return { beforeDistance, afterDistance, gesture, angularPath, basisPath, input: after.input };
}

async function frozenResizeEvidence(t) {
  const { evaluate, setViewport, wait, pointerDown, pointerMove, pointerUp } = t;
  await setViewport(390, 844); await wait(100);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.resize(false);a.applySettings({...a.settings,motion:'reduced'});return true})()`);
  const geometry = await sphereGeometry(evaluate); const from = [geometry.center.x - geometry.radius / 2, geometry.center.y];
  const to = [from[0] + geometry.radius, from[1]]; const before = await motion(evaluate);
  await pointerDown(...from); await setViewport(430, 932); await wait(80); await pointerMove(...to); await pointerUp(...to);
  const after = await motion(evaluate); const angularPath = after.input.lastAngularTravelRadians;
  const basisPath = basisAngle(before.basis, after.basis);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});return true})()`);
  ok(Math.abs(after.input.lastGestureRadiusCssPx - geometry.radius) <= .01
    && Math.abs(angularPath - 1) <= .05 && Math.abs(basisPath - 1) <= .05,
  `pointerdown radius did not survive resize: ${JSON.stringify({ geometry, after, angularPath, basisPath })}`);
  return { startViewport: [390,844], resizedViewport: [430,932], frozenRadiusCssPx: geometry.radius,
    input: after.input, angularPath, basisPath };
}

async function measuredRelease({ evaluate, poll }, label, performGesture) {
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,prior=window.__KINETIC_RELEASE_OBSERVER__;
    if(prior?.raf)cancelAnimationFrame(prior.raf);if(prior?.releaseListener)document.removeEventListener('pointerup',prior.releaseListener);
    const dot=(x,y)=>x[0]*y[0]+x[1]*y[1]+x[2]*y[2],
    angle=(x,y)=>Math.acos(Math.max(-1,Math.min(1,dot(x,y)))),copy=()=>({direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()}),
    error=b=>Math.max(Math.abs(Math.hypot(...b.direction)-1),Math.abs(Math.hypot(...b.right)-1),Math.abs(Math.hypot(...b.up)-1),
      Math.abs(dot(b.direction,b.right)),Math.abs(dot(b.direction,b.up)),Math.abs(dot(b.right,b.up))),
    record={label:${JSON.stringify(label)},status:'armed',armedAt:performance.now(),startedAt:null,completedAt:null,
      cumulativeRadians:0,cumulativeTurns:0,releaseDurationMs:0,samples:0,sampleHighWater:0,basisError:0,
      release:null,input:null,gesture:null,directStartBasis:copy(),directBasisRadians:0,releaseBasis:null,releasedAt:null,
      releaseListener:null,pointerupState:null,finalState:null,startBasis:null,finalBasis:null,previous:null,raf:0};
    record.releaseListener=()=>{record.releaseBasis=copy();record.releasedAt=performance.now();
      record.pointerupState=a.worldResourceAudit().cameraMotion;};
    document.addEventListener('pointerup',record.releaseListener,{once:true});
    const cleanup=()=>{document.removeEventListener('pointerup',record.releaseListener);record.releaseListener=null;};
    const step=now=>{const audit=a.worldResourceAudit(),state=audit.cameraMotion,current=copy();record.sampleHighWater=Math.max(record.sampleHighWater,state.sampleHighWater??0);
      record.basisError=Math.max(record.basisError,error(current));
      if(record.status==='armed'&&state.mode==='inertia'){const origin=record.releaseBasis??current;record.status='tracking';record.startedAt=record.releasedAt??now;
        record.startBasis=record.directStartBasis;record.directBasisRadians=angle(record.directStartBasis.direction,origin.direction);
        record.input=audit.globeInput;record.previous=current;record.cumulativeRadians=angle(origin.direction,current.direction);record.samples=1;
        const initial=record.pointerupState??state;record.release={releaseSpeed:initial.releaseSpeed,speed:initial.speed,
          velocityX:initial.velocityX,velocityY:initial.velocityY,idleUntil:initial.idleUntil,surfaceOpen:initial.surfaceOpen};}
      else if(record.status==='tracking'){record.cumulativeRadians+=angle(record.previous.direction,current.direction);record.samples++;record.previous=current;
        if(state.mode!=='inertia'){record.status='complete';record.completedAt=now;record.releaseDurationMs=now-record.startedAt;
          record.cumulativeTurns=record.cumulativeRadians/(2*Math.PI);record.finalState=state;record.finalBasis=current;record.previous=null;record.raf=0;cleanup();return;}}
      if(now-record.armedAt>8000||record.samples>=600){record.status='timed-out';record.completedAt=now;record.finalState=state;record.finalBasis=current;record.previous=null;record.raf=0;cleanup();return;}
      record.raf=requestAnimationFrame(step);};window.__KINETIC_RELEASE_OBSERVER__=record;record.raf=requestAnimationFrame(step);return true})()`);
  const gesture = await performGesture();
  const immediate = await motion(evaluate);
  await evaluate(`(()=>{const r=window.__KINETIC_RELEASE_OBSERVER__;if(r){r.immediate=${JSON.stringify(immediate)};r.gesture=${JSON.stringify(gesture)}}return true})()`);
  if (immediate.state.mode !== 'inertia') {
    await evaluate(`(()=>{const r=window.__KINETIC_RELEASE_OBSERVER__;if(!r)return false;if(r.raf)cancelAnimationFrame(r.raf);
      if(r.releaseListener)document.removeEventListener('pointerup',r.releaseListener);r.releaseListener=null;
      r.raf=0;r.status='no-inertia';r.completedAt=performance.now();r.finalState=r.immediate.state;r.finalBasis=r.immediate.basis;return true})()`);
  }
  const completed = await poll(() => evaluate('window.__KINETIC_RELEASE_OBSERVER__?.status'),
    (status) => status === 'complete' || status === 'timed-out' || status === 'no-inertia', 8500, 25);
  ok(completed, `${label} cumulative release observer did not finish`);
  return evaluate(`(()=>{const r=window.__KINETIC_RELEASE_OBSERVER__;return{label:r.label,status:r.status,completedAt:r.completedAt,
    cumulativeRadians:r.cumulativeRadians,cumulativeTurns:r.cumulativeTurns,releaseDurationMs:r.releaseDurationMs,
    samples:r.samples,sampleHighWater:r.sampleHighWater,basisError:r.basisError,release:r.release,input:r.input,
    gesture:r.gesture,directBasisRadians:r.directBasisRadians,
    pointerupState:r.pointerupState,finalState:r.finalState,startBasis:r.startBasis,finalBasis:r.finalBasis,immediate:r.immediate}})()`);
}

async function stoppedDragEvidence(t, label, travelRadii, options) {
  const before = await motion(t.evaluate);
  const gesture = await normalizedFlick(t, 'mouse', travelRadii, 0, options);
  const release = await motion(t.evaluate); await t.wait(260); const after = await motion(t.evaluate);
  const cumulativeRadians = basisAngle(release.basis, after.basis);
  return { label, status: release.state.mode === 'inertia' ? 'unexpected-inertia' : 'no-inertia', gesture,
    releaseSpeed: release.state.releaseSpeed,
    directTravel: release.input.lastAngularTravelRadians, directBasisTravel: basisAngle(before.basis, release.basis),
    cumulativeRadians, cumulativeTurns: cumulativeRadians / (2 * Math.PI), releaseDurationMs: 0,
    sampleHighWater: release.state.sampleHighWater, basisError: basisError(after.basis), input: release.input,
    selectedBefore: before.selectedNode, selectedAfter: after.selectedNode, finalState: after.state };
}

function assertFaithfulRelease(evidence, minimumSpeed, maximumSpeed, minimumTurns, maximumTurns, options = {}) {
  const expectedSpeed = Math.hypot(evidence.gesture?.expectedVelocityX, evidence.gesture?.expectedVelocityY);
  const vectorError = Math.hypot(evidence.release?.velocityX - evidence.gesture?.expectedVelocityX,
    evidence.release?.velocityY - evidence.gesture?.expectedVelocityY) / expectedSpeed;
  const expectedDuration = Math.log(evidence.release?.releaseSpeed / .025) / (Math.log(2) / 600);
  const finalMode = options.finalMode ?? 'idle-wait';
  ok(evidence.status === 'complete' && evidence.release?.releaseSpeed >= minimumSpeed
    && evidence.release.releaseSpeed <= maximumSpeed
    && Math.abs(evidence.release.speed - evidence.release.releaseSpeed) <= 1e-12
    && Math.abs(evidence.release.releaseSpeed - expectedSpeed) / expectedSpeed <= .01
    && vectorError <= .01
    && evidence.cumulativeTurns >= minimumTurns && evidence.cumulativeTurns <= maximumTurns
    && Math.abs(evidence.releaseDurationMs - expectedDuration) <= 350
    && Math.abs(evidence.input?.lastGestureRadiusCssPx - evidence.gesture?.gestureRadiusCssPx) <= .01
    && Math.abs(evidence.input?.lastPointerTravelCssPx - evidence.gesture?.pointerTravelCssPx) <= .01
    && Math.abs(evidence.input?.lastAngularTravelRadians - evidence.gesture?.pointerTravelRadii) <= .01
    && evidence.samples > 0 && evidence.samples <= 600 && evidence.sampleHighWater <= 6
    && evidence.basisError < 1e-10 && evidence.finalState?.mode === finalMode
    && evidence.finalState?.speed === 0 && evidence.finalState?.idleUntil > evidence.completedAt,
  `faithful release failed ${minimumSpeed}-${maximumSpeed} rad/s: ${JSON.stringify({ evidence, expectedSpeed, vectorError, expectedDuration })}`);
}

async function motion(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,audit=a.worldResourceAudit();return{now:performance.now(),
  direction:a.camera.direction.slice(),basis:{direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()},
  selectedNode:a.selectedNode??null,state:audit.cameraMotion,input:audit.globeInput}})()`); }
async function surfaceMotion(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,audit=a.worldResourceAudit();return{now:performance.now(),
  basis:{direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()},state:audit.cameraMotion,input:audit.globeInput,
  surface:{overlay:a.overlay,active:a.surfaces.active,activeElement:document.activeElement?.id??document.activeElement?.tagName??null}}})()`); }
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
