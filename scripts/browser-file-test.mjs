#!/usr/bin/env node
/** Real Chrome/WebGL vertical slice over file:// when container sockets are blocked. */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = `/tmp/incremental-network-game-browser-${process.pid}`;
const REPORTS = resolve(ROOT, 'reports');
const chrome = findChrome();
if (!chrome) {
  console.log('test:browser:file — SKIP (Chrome/Chromium unavailable) [exit 77]');
  process.exit(77);
}
mkdirSync(REPORTS, { recursive: true });

const processChrome = spawn(chrome, [
  '--headless', '--no-sandbox', '--enable-unsafe-swiftshader', '--disable-web-security',
  '--allow-file-access-from-files', '--remote-debugging-pipe', `--user-data-dir=${PROFILE}`,
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
    return result.result?.value;
  };
  const boot = await evaluate('window.__IN_BOOT__');
  assert(boot?.playable && boot?.renderer, 'app did not report a playable renderer');
  const before = await screenshot(cdp, session, 'browser-file-title.png');
  await drag(cdp, session, [145, 360], [225, 360]);
  await drag(cdp, session, [190, 180], [190, 760]);
  await wait(300);
  const dragged = await screenshot(cdp, session, 'browser-file-title-drag.png');
  assert(before.hash !== dragged.hash, 'free-orbit drag produced no visible response');
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: 190, y: 360, button: 'left', clickCount: 1,
  }, session);
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: 190, y: 360, button: 'left', clickCount: 1,
  }, session);
  await wait(900);
  const after = await screenshot(cdp, session, 'browser-file-title-tap.png');
  assert(before.hash !== after.hash, 'title tap produced no visible response');

  await evaluate(`(() => {
    const speed = document.getElementById('speed-select');
    speed.value = '32'; speed.dispatchEvent(new Event('change'));
    document.getElementById('begin-button').click();
  })()`);
  const started = performance.now();
  let drafts = 0;
  const completed = await poll(async () => evaluate(`(() => {
    const draft = document.getElementById('draft-dialog');
    if (draft.open) { draft.querySelector('button')?.click(); return 'draft'; }
    return document.getElementById('result-screen').hidden ? 'running' : 'result';
  })()`), (state) => { if (state === 'draft') drafts++; return state === 'result'; }, 40000);
  assert(completed, '32x run did not reach extinction within 40 seconds');
  const elapsed = (performance.now() - started) / 1000;
  const result = await evaluate(`({
    score: Number(document.getElementById('result-score').textContent.replaceAll(',', '')),
    echoes: document.getElementById('result-echoes').textContent,
    imprint: document.getElementById('result-imprint').textContent,
  })`);
  assert(result.score > 0, 'result score was not positive');
  assert(result.imprint.includes('Imprint preserved'), 'result did not identify the preserved Imprint');

  await evaluate(`document.getElementById('memory-button').click()`);
  await wait(500);
  const beforePurchase = await evaluate(`({
    balance: Number(document.getElementById('memory-balance').textContent.replaceAll(',', '')),
    available: Boolean(document.querySelector('.memory-node:not(:disabled)')),
  })`);
  assert(beforePurchase.available, 'first extinction did not make a Memory node affordable');
  await evaluate(`document.querySelector('.memory-node:not(:disabled)').click()`);
  await wait(500);
  const memory = await evaluate(`(() => {
    const meta = JSON.parse(localStorage.getItem('incremental-network-game:meta:v1'));
    return { balance: Number(document.getElementById('memory-balance').textContent.replaceAll(',', '')),
      nodes: meta.memoryNodes, imprints: meta.imprints };
  })()`);
  assert(beforePurchase.balance - memory.balance === 2, 'Memory purchase did not conserve Echoes');
  assert(memory.nodes.includes('first-trace'), 'purchased node was not persisted');
  assert(memory.imprints.length === 1 && memory.imprints[0].edges.length > 0,
    'terminal morphology did not persist as an Imprint');
  await screenshot(cdp, session, 'browser-file-memory.png');

  await evaluate(`document.getElementById('restart-button').click()`);
  await wait(2200);
  const signal = await evaluate(`document.getElementById('hud-signal').textContent`);
  assert(signal === 'Signal 4 / 4', `next run did not apply memory: ${signal}`);
  assert(cdp.errors.length === 0, `browser reported ${cdp.errors.length} errors`);
  console.log(`test:browser:file — PASS (${boot.renderer}; free orbit + title tap visible; score ${result.score}; `
    + `${drafts} drafts; 32x ${elapsed.toFixed(2)}s; Imprint + Memory purchase; next run ${signal})`);
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
      else if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
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
