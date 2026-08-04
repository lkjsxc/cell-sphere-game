#!/usr/bin/env node
/** Real Chrome/WebGL vertical slice over file:// when container sockets are blocked. */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertBlankReplacement, installFirstReplacementCapture, runScenario } from './browser/shell-scenario.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = `/tmp/cell-sphere-game-browser-${process.pid}`;
const REPORTS = resolve(ROOT, 'reports');
const forceCanvas = process.argv.includes('--canvas');
const chrome = findChrome();
if (!chrome) {
  console.log('test:browser:file — SKIP (Chrome/Chromium unavailable) [exit 77]');
  process.exit(77);
}
mkdirSync(REPORTS, { recursive: true });

const processChrome = spawn(chrome, [
  '--headless', '--no-sandbox', '--enable-unsafe-swiftshader', '--disable-web-security',
  '--allow-file-access-from-files', ...(forceCanvas ? ['--disable-webgl'] : []), '--remote-debugging-pipe', `--user-data-dir=${PROFILE}`,
  '--window-size=390,844', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });
const cdp = protocol(processChrome);
let exitCode = 1;
try {
  await wait(700);
  const targets = await cdp.send('Target.getTargets');
  const page = targets.targetInfos.find((value) => value.type === 'page');
  const attached = await cdp.send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  const session = attached.sessionId;
  await cdp.send('Runtime.enable', {}, session);
  await cdp.send('Page.enable', {}, session);
  await cdp.send('Log.enable', {}, session);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  }, session);
  const publicUrl = `file://${ROOT}/index.html?demo=1&browser-file-test=1`;
  await cdp.send('Page.navigate', { url: forceCanvas ? `${publicUrl}&dev=1` : publicUrl }, session);
  await wait(4500);

  const evaluate = async (expression) => {
    const result = await cdp.send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    }, session);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    return result.result?.value;
  };
  const click = async (x, y) => {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }, session);
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }, session);
  };
  const tools = { evaluate, wait, poll, errors: cdp.errors, click,
    key: (value) => key(cdp, session, value), drag: (from, to) => drag(cdp, session, from, to), screenshot: (name) => screenshot(cdp, session, name),
    navigate: async (url) => { await cdp.send('Page.navigate', { url }, session); await wait(2200); },
    setViewport: (width, height) => cdp.send('Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 1, mobile: width < 600 }, session) };
  if (!forceCanvas) await runDeveloperSpeedChecks(tools, publicUrl);
  const evidence = forceCanvas ? await runCanvasScenario(tools) : await runScenario(tools);
  console.log(forceCanvas ? `test:browser:file — PASS (canvas2d fallback; score ${evidence.score}; unified shell, History, Evolution, and Trophies)`
    : `test:browser:file — PASS (${evidence.backend}; unified shell; score ${evidence.score}; `
      + `8x ${evidence.elapsed.toFixed(2)}s; developer 256x ${tools.developerEvidence.elapsed.toFixed(2)}s; 4 draws; title render mean ${evidence.render.mean.toFixed(2)} ms, p95 ${evidence.render.p95.toFixed(2)} ms; `
      + `visual IDB ${evidence.idb ? 'yes' : 'unavailable'}; adjacent Skill purchase ${evidence.nodeId})`);
  if (evidence.metricRects) console.log(`metric rects ${JSON.stringify(evidence.metricRects)} responsive ${JSON.stringify(evidence.responsive)}`);
  exitCode = 0;
} catch (error) {
  console.error(`test:browser:file — FAIL: ${error.message}`);
  for (const value of cdp.errors.slice(0, 6)) console.error(`  browser> ${value}`);
} finally {
  processChrome.kill('SIGTERM');
  await wait(250);
  rmSync(PROFILE, { recursive: true, force: true });
}
process.exit(exitCode);

async function runDeveloperSpeedChecks(tools, publicUrl) {
  const { evaluate, navigate, poll, wait, key, click } = tools;
  await navigate(`${publicUrl}&dev=1`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000)) throw new Error('developer page did not boot');
  const options = await evaluate(`(()=>({runtime:[...document.getElementById('speed-select').options].map(o=>Number(o.value)),defaults:[...document.getElementById('settings-speed').options].map(o=>Number(o.value)),marker:!document.getElementById('dev-mode-marker').hidden&&document.getElementById('dev-mode-marker').offsetHeight>0,dev:window.__CELL_SPHERE_BOOT__.developerMode,hook:Object.hasOwn(window,'__CSG_AGENT__')&&window.__CSG_AGENT__===null}))()`);
  if (options.runtime.join(',') !== '1,2,4,8,16,32,64,128,256' || options.defaults.join(',') !== options.runtime.join(',')
      || !options.marker || !options.dev || !options.hook) throw new Error(`developer speed exposure failed: ${JSON.stringify(options)}`);
  await trustedControl(evaluate, click, '#begin-button');
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000)) throw new Error('developer check world did not start');
  const runStartedAt = performance.now();
  await trustedControl(evaluate, click, '#speed-select'); for (let index = 0; index < 8; index++) await key('ArrowDown'); await key('Enter'); await wait(120);
  const runtime = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__,saved=JSON.parse(localStorage.getItem(b.storage.settings));return {selected:Number(document.getElementById('speed-select').value),runtime:a.speed,durable:a.settings.speed,saved:saved.speed}})()`);
  if (runtime.selected !== 256 || runtime.runtime !== 256 || runtime.durable > 8 || runtime.saved > 8) throw new Error(`trusted developer runtime selection failed: ${JSON.stringify(runtime)}`);
  await trustedControl(evaluate, click, '.menu-open'); await wait(80); await trustedControl(evaluate, click, '#settings-speed'); for (let index = 0; index < 8; index++) await key('ArrowDown'); await key('Enter'); await wait(120);
  const isolated = await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,data=await import('./src/interface/app-data.js'),saved=JSON.parse(data.serializeExportData(a.meta,a.archive,{...a.settings,speed:256,developerMode:true}));return {runtime:a.speed,durable:a.settings.speed,exportSpeed:saved.settings.speed,exportDev:'developerMode' in saved.settings}})()`);
  if (isolated.runtime !== 256 || isolated.durable > 8 || isolated.exportSpeed > 8 || isolated.exportDev) throw new Error(`developer settings leaked: ${JSON.stringify(isolated)}`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 8000, 100)) throw new Error('256x developer world did not reach one result');
  const result = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {status:a.snapshot?.status,alive:a.snapshot?.metrics?.aliveCount,disabled:document.getElementById('speed-select').disabled,results:a.meta.resultKeys.length}})()`);
  if (result.status !== 'extinct' || result.alive !== 0 || !result.disabled || result.results !== 1) throw new Error(`256x terminal invalid: ${JSON.stringify(result)}`);
  tools.developerEvidence = { elapsed: (performance.now() - runStartedAt) / 1000 };
  await navigate(publicUrl);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000)) throw new Error('public page did not return after developer check');
  const normal = await evaluate(`(()=>({options:[...document.getElementById('speed-select').options].map(o=>Number(o.value)),dev:window.__CELL_SPHERE_BOOT__.developerMode,marker:document.getElementById('dev-mode-marker').hidden,hook:Object.hasOwn(window,'__CSG_AGENT__'),speed:window.__CELL_SPHERE_APP__.settings.speed}))()`);
  if (normal.options.join(',') !== '1,2,4,8' || normal.dev || !normal.marker || normal.hook || normal.speed > 8) throw new Error(`public mode contaminated: ${JSON.stringify(normal)}`);
}

async function trustedControl(evaluate, click, selector) {
  const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('missing control');const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  await click(...point);
}

async function runCanvasScenario({ evaluate, screenshot, setViewport, poll, wait, errors }) {
  const boot = await evaluate('window.__CELL_SPHERE_BOOT__'); if (boot?.renderer !== 'canvas2d') throw new Error('Canvas fallback did not boot');
  await screenshot('browser-canvas-title-mobile.png'); await setViewport(1440, 900); await wait(180); await screenshot('browser-canvas-title-desktop.png');
  await evaluate(`document.getElementById('begin-button').click()`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000)) throw new Error('Canvas run did not start');
  const developed = await evaluate(`(async()=>{const [{RunController},{compileMemory,MEMORY_NODE_IDS}]=await Promise.all([import('./src/simulation/simulator.js'),import('./src/game/skills/index.js')]);const m=compileMemory({memoryNodes:MEMORY_NODE_IDS}),c=new RunController({seed:9099,worldOrdinal:20,worldPotential:m.worldPotential,evolutionPower:m.evolutionPower,potentialVersion:m.potentialVersion,memoryEffects:m.effects,memoryConditionals:m.conditionals,memoryUnlocks:m.unlocks,habitatCapabilities:m.habitatCapabilities,activeBuilds:m.activeBuilds,buildEffects:m.buildEffects});c.start();c.advance(300);const s=c.snapshot();window.__CELL_SPHERE_APP__.historySnapshot=s;return {transformed:[...s.transformationState].filter(Boolean).length,powered:[...s.electricityQ].filter(Boolean).length}})()`);
  if (developed.transformed <= 50 || developed.powered <= 50) throw new Error(`Canvas ecology fixture failed: ${JSON.stringify(developed)}`);
  await wait(120); await screenshot('browser-canvas-transformations.png');
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.historySnapshot=null;const speed=document.getElementById('speed-select');speed.value='256';speed.dispatchEvent(new Event('change'))})()`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 50000)) throw new Error('Canvas run did not finish');
  const terminal = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),status:a.snapshot?.status,alive:a.snapshot?.metrics?.aliveCount,reach:document.getElementById('hud-reach').textContent}})()`);
  const score = terminal.score; if (terminal.status !== 'extinct' || terminal.alive !== 0 || terminal.reach !== '0%') throw new Error(`Canvas terminal snapshot stale: ${JSON.stringify(terminal)}`);
  await evaluate("document.getElementById('result-history-button').click()"); await screenshot('browser-canvas-history-desktop.png');
  await evaluate("document.getElementById('scene-evolution').click()"); await wait(180); await screenshot('browser-canvas-evolution-desktop.png');
  const atlas = await evaluate('window.__CELL_SPHERE_APP__.memorySnapshot.memoryStatus.length'); await evaluate("document.getElementById('scene-trophies').click()"); await wait(180); await screenshot('browser-canvas-trophies-desktop.png');
  const trophies = await evaluate(`({cells:window.__CELL_SPHERE_APP__.trophySnapshot.memoryStatus.length,nodes:window.__CELL_SPHERE_APP__.trophySnapshot.nodeStates.length})`);
  await installFirstReplacementCapture(evaluate); const oldRun = await evaluate('window.__CELL_SPHERE_APP__.activeRunId'); await evaluate("document.getElementById('trophy-next-button').click()");
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.activeRunId'), (runId) => runId > oldRun, 5000)) throw new Error('Canvas replacement did not start');
  assertBlankReplacement(await evaluate('window.__CELL_SPHERE_APP__.__firstReplacementFrame'), 'Canvas 2D');
  const bounded = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {...a.worldResourceAudit(),raf:a.frameAudit}})()`);
  if (bounded.interactionListeners !== 8 || bounded.historyRequests || bounded.raf.errors || bounded.raf.scheduled < bounded.raf.frames - 1) throw new Error(`Canvas replacement resources/RAF leaked: ${JSON.stringify(bounded)}`);
  if (score <= 0 || atlas !== 252 || trophies.cells !== 162 || trophies.nodes !== 96 || errors.length) throw new Error('Canvas fallback state failed'); return { score };
}

function protocol(child) {
  let buffer = ''; let nextId = 0;
  const pending = new Map(); const errors = [];
  child.stdio[4].on('data', (data) => {
    buffer += data.toString();
    let boundary;
    while ((boundary = buffer.indexOf('\0')) >= 0) {
      const raw = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 1);
      if (!raw) continue;
      const message = JSON.parse(raw);
      if (message.id && pending.has(message.id)) {
        pending.get(message.id)(message); pending.delete(message.id);
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(
        message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
      else if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
        errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '));
      } else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        errors.push(message.params.entry.text);
      }
    }
  });
  const send = (method, params = {}, sessionId) => new Promise((resolvePromise, reject) => {
    const id = ++nextId;
    pending.set(id, (message) => message.error ? reject(new Error(message.error.message)) : resolvePromise(message.result));
    child.stdio[3].write(`${JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) })}\0`);
    setTimeout(() => { if (pending.delete(id)) reject(new Error(`CDP timeout: ${method}`)); }, 10000);
  });
  return { send, errors };
}

async function key(cdp, session, value) {
  const code = value.startsWith('Arrow') ? value : value;
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyDown', key: value, code }, session);
  await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: value, code }, session);
}

async function drag(cdp, session, from, to) {
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: from[0], y: from[1], button: 'left', clickCount: 1,
  }, session);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseMoved', x: to[0], y: to[1], button: 'left', buttons: 1,
  }, session);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: to[0], y: to[1], button: 'left', clickCount: 1,
  }, session);
}

async function screenshot(cdp, session, name) {
  const result = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true }, session);
  const data = Buffer.from(result.data, 'base64');
  writeFileSync(resolve(REPORTS, name), data);
  return { hash: createHash('sha256').update(data).digest('hex') };
}

async function poll(read, done, timeout, interval = 400) {
  const end = performance.now() + timeout;
  while (performance.now() < end) { const value = await read(); if (done(value)) return true; await wait(interval); }
  return false;
}

function findChrome() {
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const result = spawnSync('which', [name], { encoding: 'utf8' });
    if (result.status === 0 && existsSync(result.stdout.trim())) return result.stdout.trim();
  }
  return null;
}

function assert(condition, message) { if (!condition) throw new Error(message); }
function wait(milliseconds) { return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)); }
