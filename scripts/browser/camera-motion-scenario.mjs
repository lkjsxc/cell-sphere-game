/** Trusted-CDP proof for production camera motion and projected World framing. */
export async function runCameraMotionScenario(t) {
  const { evaluate, wait, poll, click, flick, touchFlick, tap, pinch, touchCancel, wheel, key, screenshot, setViewport } = t;
  ok(await poll(() => evaluate('Boolean(window.__CELL_SPHERE_BOOT__?.playable)'), Boolean, 5000), 'camera scenario did not boot');

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
  await key('Shift'); const activity = await motion(evaluate); await wait(220); const afterActivity = await direction(evaluate);
  ok(activity.state.mode === 'idle-wait' && activity.state.speed === 0 && distance(activity.direction, afterActivity) < 1e-8,
    `trusted keyboard activity did not stop Home orbit: ${JSON.stringify(activity)}`);

  await trustedId(t, 'begin-button');
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000), 'camera World did not start');
  const newWorld = await motion(evaluate);
  ok(newWorld.state.scene === 'world' && newWorld.state.mode === 'idle-wait' && newWorld.state.speed === 0,
    `new World did not begin from stillness: ${JSON.stringify(newWorld.state)}`);
  const point = await globeCenter(evaluate);

  const beforeFlick = await direction(evaluate); await flick(point, [point[0] + 110, point[1] + 52]);
  const released = await motion(evaluate); await wait(240); const carried = await motion(evaluate);
  ok(distance(beforeFlick, released.direction) > .1 && released.state.mode === 'inertia'
    && released.state.speed > 0 && released.state.speed <= 2.4 && distance(released.direction, carried.direction) > .03,
  `mouse release inertia missing or unbounded: ${JSON.stringify({ released, carried })}`);
  await wheel(...point); await wait(80); const wheelStopped = await motion(evaluate);
  ok(wheelStopped.state.mode === 'idle-wait' && wheelStopped.state.speed === 0,
    `wheel did not cancel camera motion: ${JSON.stringify(wheelStopped.state)}`);

  await tap(...point); await wait(80); const tapState = await motion(evaluate);
  ok(tapState.state.mode !== 'inertia', `tap produced inertia: ${JSON.stringify(tapState.state)}`);
  await evaluate(`window.__CELL_SPHERE_APP__.closeActiveOverlay()`);
  await touchFlick(point, [point[0] - 85, point[1] + 38]); const touchReleased = await motion(evaluate);
  ok(touchReleased.state.mode === 'inertia' && touchReleased.state.speed <= 2.4,
    `touch release inertia missing or unbounded: ${JSON.stringify(touchReleased.state)}`);
  await pinch(point); await wait(60); const pinchState = await motion(evaluate);
  ok(pinchState.state.mode !== 'inertia' && pinchState.state.speed === 0,
    `pinch produced angular inertia: ${JSON.stringify(pinchState.state)}`);
  await touchCancel(point); await wait(60); const cancelled = await motion(evaluate);
  ok(cancelled.state.mode !== 'inertia' && cancelled.state.speed === 0,
    `pointer cancellation retained velocity: ${JSON.stringify(cancelled.state)}`);

  await setViewport(1440, 900); await wait(120); await trustedId(t, 'score-button');
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

  const hiddenBefore = await direction(evaluate);
  await evaluate(`(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));return true})()`);
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
  return { homeText, homeOrbitTravel: distance(beforeIdle, homeOrbit.direction), mouseReleaseSpeed: released.state.speed,
    mouseCarryTravel: distance(released.direction, carried.direction), touchReleaseSpeed: touchReleased.state.speed,
    geometry, sameClass, backend: await evaluate('window.__CELL_SPHERE_BOOT__.renderer') };
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

async function motion(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{now:performance.now(),direction:a.camera.direction.slice(),state:a.worldResourceAudit().cameraMotion}})()`); }
async function direction(evaluate) { return evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()'); }
async function globeCenter(evaluate) { return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,r=a.canvas.getBoundingClientRect();return[r.left+r.width*(1+a.camera.offsetX)/2,r.top+r.height*(1-a.camera.offsetY)/2]})()`); }
async function trustedId({ evaluate, click }, id) { const point = await evaluate(`(()=>{const r=document.getElementById(${JSON.stringify(id)}).getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`); await click(...point); }
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function ok(value, message) { if (!value) throw new Error(message); }
