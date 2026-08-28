#!/usr/bin/env node
/** Structured real-browser pacing, camera, layout, and Result evidence. */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const label = argument('label') ?? 'audit';
const output = resolve(ROOT, argument('output') ?? `reports/autonomous-world-feel-${label}.json`);
const windowMs = Math.max(8000, Number(argument('window-ms')) || 8000);
const fallback = process.argv.includes('--simulation-fallback');
const chrome = findChrome();
if (!chrome) {
  console.log('audit:autonomous-world-feel — UNAVAILABLE (Chrome/Chromium unavailable) [exit 77]');
  process.exit(77);
}

mkdirSync(dirname(output), { recursive: true });
const profile = `/tmp/cell-sphere-autonomous-audit-${process.pid}`;
const browser = spawn(chrome, [
  '--headless', '--no-sandbox', '--enable-unsafe-swiftshader', '--disable-web-security',
  '--allow-file-access-from-files', '--remote-debugging-pipe', `--user-data-dir=${profile}`,
  '--window-size=390,844', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
const cdp = protocol(browser);
let exitCode = 1;

try {
  await wait(700);
  const targets = await cdp.send('Target.getTargets');
  const page = targets.targetInfos.find((value) => value.type === 'page');
  if (!page) throw new Error('browser page target unavailable');
  const attached = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  const session = attached.sessionId;
  await cdp.send('Runtime.enable', {}, session);
  await cdp.send('Page.enable', {}, session);
  await cdp.send('Log.enable', {}, session);
  if (fallback) await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
    source: "Object.defineProperty(globalThis,'Worker',{value:undefined,configurable:false})",
  }, session);

  const evaluate = async (expression) => {
    const result = await cdp.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    }, session);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result?.value;
  };
  const setViewport = (width, height) => cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 600,
  }, session);
  let navigation = 0;
  const boot = async ({ developer = false, width = 390, height = 844 } = {}) => {
    await setViewport(width, height);
    const query = `demo=1&autonomous-audit=${encodeURIComponent(label)}-${++navigation}${developer ? '&dev=1' : ''}`;
    await cdp.send('Page.navigate', { url: `file://${ROOT}/index.html?${query}` }, session);
    if (!await poll(() => evaluate('Boolean(window.__CELL_SPHERE_BOOT__?.playable)'), Boolean, 7000)) {
      throw new Error('production page did not boot');
    }
    await wait(250);
  };

  await boot();
  const environment = await evaluate(`(async()=>{const b=window.__CELL_SPHERE_BOOT__,a=window.__CELL_SPHERE_APP__,
    {BALANCE}=await import('./src/game/balance.js');return{userAgent:navigator.userAgent,renderer:b.renderer,dpr:devicePixelRatio,
    ticksPerGameSecond:BALANCE.TICKS_PER_SECOND,options:[...document.getElementById('speed-select').options].map(o=>Number(o.value)),
    defaultSpeed:a.speed,settingsSchema:a.settings.schema,drawCalls:a.renderer.drawCalls}})()`);
  const pacing = [];
  for (const speed of environment.options) {
    await boot();
    await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.setSpeed(${JSON.stringify(speed)});
      document.getElementById('begin-button').click();return a.speed})()`);
    if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 7000)) {
      throw new Error(`World did not start for ${speed}x pacing`);
    }
    await wait(1000);
    const start = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{wall:performance.now(),tick:a.snapshot?.tick??0,
      phase:a.phase}})()`);
    await wait(windowMs);
    const end = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{wall:performance.now(),tick:a.snapshot?.tick??0,
      phase:a.phase}})()`);
    const elapsedWallSeconds = (end.wall - start.wall) / 1000;
    const authoritativeTickDelta = end.tick - start.tick;
    pacing.push({ publicSpeed: speed, elapsedWallSeconds, authoritativeTickDelta,
      observedGameSecondsPerWallSecond: authoritativeTickDelta / environment.ticksPerGameSecond / elapsedWallSeconds,
      startPhase: start.phase, endPhase: end.phase });
  }

  await boot();
  await evaluate(`document.getElementById('begin-button').click()`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 7000)) {
    throw new Error('World did not start for layout evidence');
  }
  const viewports = [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390],[1024,600],[1440,900]];
  const geometry = [];
  for (const [width, height] of viewports) {
    await setViewport(width, height); await wait(160);
    geometry.push(await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__;a.resize(false);
      const {FOV_Y}=await import('./src/rendering/camera.js');const {pickNode}=await import('./src/rendering/picking.js');
      const rect=a.canvas.getBoundingClientRect(),cam=a.camera,tan=Math.tan(FOV_Y/2),radius=rect.height/(2*tan*Math.sqrt(cam.dist*cam.dist-1));
      const center={x:rect.left+rect.width*(1+cam.offsetX)/2,y:rect.top+rect.height*(1-cam.offsetY)/2};
      const box=e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
      const visible=e=>{const r=e.getBoundingClientRect();return !e.hidden&&r.width>0&&r.height>0};
      const controls=[...document.querySelectorAll('#scene-selector button,.hud-metrics button,.command-rail button,.command-rail select')]
        .filter(visible).map(e=>{const r=box(e),x=(r.left+r.right)/2,y=(r.top+r.bottom)/2;return{id:e.id||e.tagName,rect:r,
          centerDistance:Math.hypot(x-center.x,y-center.y),insideInner70:Math.hypot(x-center.x,y-center.y)<radius*.7}});
      const hit=pickNode(a.canvas,center.x,center.y,a.camera,a.topo);
      return{viewport:{width:innerWidth,height:innerHeight},canvas:box(a.canvas),camera:{distance:cam.dist,offsetX:cam.offsetX,offsetY:cam.offsetY},
        globe:{center,radius,diameter:radius*2,ratio:radius*2/Math.min(rect.width,rect.height)},controls,
        selector:box(document.getElementById('scene-selector')),hud:box(document.querySelector('.hud-metrics')),
        commandRail:box(document.querySelector('.command-rail')),noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth,
        primaryCentersOutsideInner70:controls.every(c=>!c.insideInner70),centerPickNode:hit?.node??null};})()`));
  }

  await setViewport(390, 844); await wait(160);
  await evaluate('window.__CELL_SPHERE_APP__.resize(false)');
  const idleStart = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()');
  await wait(5000);
  const idleEnd = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()');
  const dragPoint = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,r=a.canvas.getBoundingClientRect();
    return [r.left+r.width*(1+a.camera.offsetX)/2,r.top+r.height*(1-a.camera.offsetY)/2]})()`);
  const beforeDrag = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()');
  await drag(cdp, session, dragPoint, [dragPoint[0] + 100, dragPoint[1] + 45]);
  const release = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()');
  await wait(650);
  const afterRelease = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()');
  const camera = { idleDelayObservedMs: 5000, idleTravel: vectorDistance(idleStart, idleEnd),
    directDragTravel: vectorDistance(beforeDrag, release), postReleaseTravel: vectorDistance(release, afterRelease) };

  await boot({ developer: true });
  const maximumSpeed = await evaluate('Math.max(...[...document.getElementById("speed-select").options].map(o=>Number(o.value)))');
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.continuation.durationMs=60000;
    a.settings={...a.settings,autoContinue:true};a.setSpeed(${maximumSpeed});document.getElementById('begin-button').click()})()`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 12000, 100)) {
    throw new Error('developer-speed Result did not arrive');
  }
  await setViewport(390, 844); await wait(180);
  const resultNormal = await resultGeometry(evaluate);
  const firstVisibleLabel = await evaluate('document.getElementById("result-countdown").textContent');
  await wait(1100);
  const secondVisibleLabel = await evaluate('document.getElementById("result-countdown").textContent');
  await setViewport(320, 568);
  await evaluate("document.documentElement.style.fontSize='32px'"); await wait(180);
  const resultAt200Percent = await resultGeometry(evaluate);

  const version = await cdp.send('Browser.getVersion');
  const report = {
    label, capturedAt: new Date().toISOString(), revision: git('rev-parse HEAD'), branch: git('branch --show-current'),
    browser: version.product, protocolVersion: version.protocolVersion, simulationPath: fallback ? 'fallback' : 'worker',
    environment, pacingWindowMs: windowMs, pacing, geometry, camera,
    result: { maximumDeveloperSpeed: maximumSpeed, firstVisibleLabel, secondVisibleLabel,
      visibleLabelChanged: firstVisibleLabel !== secondVisibleLabel, normal: resultNormal, text200Percent: resultAt200Percent },
    browserErrors: cdp.errors.slice(0, 20), browserStderr: cdp.stderr.slice(0, 20),
  };
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`audit:autonomous-world-feel — PASS (${label}; ${fallback ? 'fallback' : 'Worker'}; ${output})`);
  for (const value of pacing) console.log(`  ${value.publicSpeed}x: ${value.observedGameSecondsPerWallSecond.toFixed(3)} game-s/wall-s over ${value.elapsedWallSeconds.toFixed(2)}s`);
  for (const value of geometry) console.log(`  ${value.viewport.width}x${value.viewport.height}: globe ${value.globe.ratio.toFixed(3)} of shorter canvas`);
  exitCode = 0;
} catch (error) {
  console.error(`audit:autonomous-world-feel — FAIL: ${error.message}`);
  for (const value of [...cdp.errors, ...cdp.stderr].slice(0, 12)) console.error(`  browser> ${value}`);
} finally {
  browser.kill('SIGTERM'); await wait(250); rmSync(profile, { recursive: true, force: true });
}
process.exit(exitCode);

async function resultGeometry(evaluate) {
  return evaluate(`(()=>{const box=e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
    const panel=document.getElementById('result-dialog'),body=panel.querySelector('.result-body'),footer=panel.querySelector('.result-actions'),
      countdown=document.getElementById('result-countdown'),actions=[...footer.querySelectorAll('button')].map(e=>({label:e.textContent.trim(),rect:box(e)}));
    return{viewport:{width:innerWidth,height:innerHeight},fontSize:getComputedStyle(document.documentElement).fontSize,panel:box(panel),body:box(body),
      footer:box(footer),countdown:box(countdown),countdownText:countdown.textContent,countdownRole:countdown.getAttribute('role'),
      countdownLive:countdown.getAttribute('aria-live'),actions,actionsInViewport:actions.every(({rect:r})=>r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight),
      bodyScrollOwners:Number(getComputedStyle(body).overflowY==='auto'||getComputedStyle(body).overflowY==='scroll'),
      noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth};})()`);
}

function protocol(child) {
  let buffer = ''; let nextId = 0;
  const pending = new Map(); const errors = []; const stderr = [];
  child.stdio[2].on('data', (data) => { for (const line of data.toString().split('\n').filter(Boolean)) {
    stderr.push(line.slice(0, 500)); if (stderr.length > 40) stderr.shift();
  } });
  child.stdio[4].on('data', (data) => {
    buffer += data.toString(); let boundary;
    while ((boundary = buffer.indexOf('\0')) >= 0) {
      const raw = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 1); if (!raw) continue;
      const message = JSON.parse(raw);
      if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
      else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
      else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
      else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') errors.push(message.params.entry.text);
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolvePromise, reject) => {
    const id = ++nextId;
    pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolvePromise(message.result));
    child.stdio[3].write(`${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`);
    setTimeout(() => { if (pending.delete(id)) reject(new Error(`CDP timeout: ${method}`)); }, 12000);
  });
  return { send, errors, stderr };
}

async function drag(cdp, session, from, to) {
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from[0], y: from[1], button: 'left', clickCount: 1 }, session);
  for (let step = 1; step <= 5; step++) {
    await wait(16); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved',
      x: from[0] + (to[0] - from[0]) * step / 5, y: from[1] + (to[1] - from[1]) * step / 5,
      button: 'left', buttons: 1 }, session);
  }
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to[0], y: to[1], button: 'left', clickCount: 1 }, session);
}

async function poll(read, done, timeout, interval = 200) {
  const end = performance.now() + timeout;
  while (performance.now() < end) { const value = await read(); if (done(value)) return true; await wait(interval); }
  return false;
}
function argument(name) { const prefix = `--${name}=`; return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length); }
function findChrome() {
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const result = spawnSync('which', [name], { encoding: 'utf8' });
    if (result.status === 0 && existsSync(result.stdout.trim())) return result.stdout.trim();
  }
  return null;
}
function git(command) { return spawnSync('git', command.split(' '), { cwd: ROOT, encoding: 'utf8' }).stdout.trim(); }
function vectorDistance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function wait(milliseconds) { return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)); }
