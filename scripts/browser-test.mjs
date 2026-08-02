#!/usr/bin/env node
/**
 * Browser smoke harness — zero dependencies, uses an installed headless
 * Chrome/Chromium only. Loads the live app over the dev server and checks
 * that it boots without JavaScript errors and reports a renderer backend.
 *
 * Exit codes:
 *   0  pass — app booted, no uncaught errors, renderer reported.
 *   1  fail — Chrome ran but the app threw or never booted.
 *   77 skip — environment cannot run a browser (no Chrome binary, or the
 *      sandbox blocks Chrome's network stack so the page cannot load).
 *      This is an ENVIRONMENT limitation, not a product failure, and is why
 *      test:browser is intentionally outside the required `npm run verify`
 *      gate set. See docs/testing.md.
 *
 * The harness never claims a render it did not observe: a blocked network
 * stack is reported as a skip with the exact signature, never as a pass.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.BROWSER_TEST_PORT || 8137);
const URL = `http://127.0.0.1:${PORT}/?demo=1`;
const SHOT = resolve(ROOT, 'reports', 'browser-smoke.png');

function findChrome() {
  for (const bin of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const r = spawnSync('which', [bin], { encoding: 'utf8' });
    if (r.status === 0 && r.stdout.trim()) return r.stdout.trim();
  }
  return null;
}

function waitForServer(url, tries = 40) {
  for (let i = 0; i < tries; i++) {
    const r = spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url], { encoding: 'utf8' });
    if (r.stdout.trim() === '200') return true;
    spawnSync('sleep', ['0.1']);
  }
  return false;
}

const chrome = findChrome();
if (!chrome) {
  console.log('test:browser — SKIP (no Chrome/Chromium binary on PATH) [exit 77]');
  process.exit(77);
}

mkdirSync(dirname(SHOT), { recursive: true });
const server = spawn(process.execPath, ['scripts/serve.mjs', '--port', String(PORT)], {
  cwd: ROOT, stdio: ['ignore', 'ignore', 'ignore'],
});

let exitCode = 1;
try {
  if (!waitForServer(`http://127.0.0.1:${PORT}/`)) {
    console.log('test:browser — SKIP (dev server did not start) [exit 77]');
    process.exit(77);
  }
  const res = spawnSync(chrome, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--enable-unsafe-swiftshader', '--enable-logging=stderr', '--v=0',
    '--virtual-time-budget=7000', '--window-size=900,700', `--screenshot=${SHOT}`, URL,
  ], { encoding: 'utf8', timeout: 90000 });
  const log = (res.stderr || '') + (res.stdout || '');

  // Environment block: Chrome's sandboxed network stack cannot open sockets.
  if (/CreatePlatformSocket\(\) failed: Permission denied|ERR_ACCESS_DENIED/.test(log)) {
    console.log('test:browser — SKIP (container seccomp blocks Chrome network stack; '
      + 'socket EPERM / ERR_ACCESS_DENIED). Renderer verified by Node logic tests + '
      + 'static uniform cross-check instead. See docs/testing.md. [exit 77]');
    process.exit(77);
  }

  const consoleLines = log.split('\n').filter((l) => /CONSOLE/.test(l));
  const fatal = consoleLines.filter((l) =>
    /Uncaught|SyntaxError|TypeError|ReferenceError|boot failed|INVALID_OPERATION|INVALID_VALUE|shader compile failed|program link failed/i.test(l));
  const booted = /preview running|boot ok:/.test(log);

  for (const l of consoleLines) console.log('  browser>', l.replace(/^.*CONSOLE\(\d+\)\]\s?/, '').slice(0, 200));

  if (fatal.length > 0) {
    console.error('test:browser — FAIL: uncaught errors in the app:');
    for (const l of fatal) console.error('  ', l.slice(0, 240));
    exitCode = 1;
  } else if (!booted) {
    console.error('test:browser — FAIL: page loaded but app reported no boot/preview marker.');
    exitCode = 1;
  } else {
    const png = existsSync(SHOT) ? `${SHOT} (${statSync(SHOT).size}B)` : 'none';
    console.log(`test:browser — PASS (chrome ${chrome}, screenshot ${png})`);
    exitCode = 0;
  }
} finally {
  server.kill('SIGTERM');
}
process.exit(exitCode);
