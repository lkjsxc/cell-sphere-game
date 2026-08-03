#!/usr/bin/env node
/** Real Chrome/WebGL vertical slice over file:// when container sockets are blocked. */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runScenario } from './browser-scenario.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = `/tmp/incremental-network-game-browser-${process.pid}`;
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
  await cdp.send('Page.navigate', {
    url: `file://${ROOT}/index.html?demo=1&browser-file-test=1`,
  }, session);
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
    drag: (from, to) => drag(cdp, session, from, to), screenshot: (name) => screenshot(cdp, session, name),
    setViewport: (width, height) => cdp.send('Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 1, mobile: width < 600 }, session) };
  const evidence = forceCanvas ? await runCanvasScenario(tools) : await runScenario(tools);
  console.log(forceCanvas ? `test:browser:file — PASS (canvas2d fallback; score ${evidence.score}; cellular title, History, and Memory)`
    : `test:browser:file — PASS (${evidence.backend}; observational loop; score ${evidence.score}; `
      + `32x ${evidence.elapsed.toFixed(2)}s; 4 draws; title render mean ${evidence.render.mean.toFixed(2)} ms, p95 ${evidence.render.p95.toFixed(2)} ms; `
      + `visual IDB reload ${evidence.idb ? 'yes' : 'unavailable'}; 108-node Memory purchase ${evidence.nodeId})`);
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

async function runCanvasScenario({ evaluate, screenshot, setViewport, poll, wait, errors }) {
  const boot = await evaluate('window.__IN_BOOT__'); if (boot?.renderer !== 'canvas2d') throw new Error('Canvas fallback did not boot');
  await screenshot('browser-canvas-title-mobile.png'); await setViewport(1440, 900); await wait(180); await screenshot('browser-canvas-title-desktop.png');
  await evaluate(`(() => { const speed=document.getElementById('speed-select'); speed.value='32'; speed.dispatchEvent(new Event('change')); document.getElementById('begin-button').click(); })()`);
  if (!await poll(() => evaluate("document.getElementById('result-screen').hidden"), (hidden) => hidden === false, 50000)) throw new Error('Canvas run did not finish');
  const score = await evaluate("Number(document.getElementById('result-score').textContent.replaceAll(',',''))");
  await evaluate("document.getElementById('result-history-button').click()"); await screenshot('browser-canvas-history-desktop.png');
  await evaluate("document.getElementById('history-close').click(); document.getElementById('memory-button').click()"); await wait(180); await screenshot('browser-canvas-memory-desktop.png');
  const atlas = await evaluate('window.__IN_APP__.memorySnapshot.memoryStatus.length'); if (score <= 0 || atlas !== 642 || errors.length) throw new Error('Canvas fallback state failed');
  return { score };
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
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
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

async function poll(read, done, timeout) {
  const end = performance.now() + timeout;
  while (performance.now() < end) { const value = await read(); if (done(value)) return true; await wait(400); }
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
