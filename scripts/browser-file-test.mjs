#!/usr/bin/env node
/** Real Chrome/WebGL vertical slice over file:// when container sockets are blocked. */
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertBlankReplacement, installFirstReplacementCapture, runEnvironmentPressureScenario, runScenario } from './browser/shell-scenario.mjs';
import { runContinuityFixture } from './browser/continuity-fixture.mjs';
import { verifyKeyboardInspector } from './browser/inspector-scenario.mjs';
import { runLifeBoundaryFixture } from './browser/life-boundary-fixture.mjs';
import { runAtmosphereFixture } from './browser/atmosphere-fixture.mjs';
import { measureLuminousHierarchy } from './browser/luminous-fixture.mjs';
import { runCameraMotionScenario } from './browser/camera-motion-scenario.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROFILE = `/tmp/cell-sphere-game-browser-${process.pid}`;
const REPORTS = resolve(ROOT, 'reports');
const forceCanvas=process.argv.includes('--canvas');
const forceSimulationFallback=process.argv.includes('--simulation-fallback');
const lifeBoundaryOnly=process.argv.includes('--life-boundary-only');
const atmosphereOnly=process.argv.includes('--atmosphere-only');
const environmentPressureOnly=process.argv.includes('--environment-pressure-only');
const recordBaseline=process.argv.includes('--record-baseline');
const cohort=process.argv.find((value)=>value.startsWith('--cohort='))?.split('=')[1]?.replace(/[^a-z0-9-]/gi,'');
const cdpTimeoutMs=Math.max(1000,Math.min(60000,Number(process.env.BROWSER_CDP_TIMEOUT_MS)||(atmosphereOnly?60000:10000)));
const chrome = findChrome();
if (!chrome) {
  console.log('test:browser:file — SKIP (Chrome/Chromium unavailable) [exit 77]');
  process.exit(77);
}
mkdirSync(REPORTS, { recursive: true });

const processChrome = spawn(chrome, [
  '--headless', '--no-sandbox', '--enable-unsafe-swiftshader', '--disable-web-security',
  '--allow-file-access-from-files', '--disable-breakpad', '--disable-crash-reporter', '--disable-dev-shm-usage',
  '--disable-features=Crashpad', ...(forceCanvas ? ['--disable-webgl'] : []), '--remote-debugging-pipe', `--user-data-dir=${PROFILE}`,
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
  const browserIdentity = await cdp.send('Browser.getVersion');
  await cdp.send('Runtime.enable', {}, session);
  await cdp.send('Page.enable', {}, session);
  await cdp.send('Log.enable',{},session);
  if(forceSimulationFallback)await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:"Object.defineProperty(globalThis,'Worker',{value:undefined,configurable:false})"},session);
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  }, session);
  const configuredUrl = process.env.BROWSER_TEST_URL?.trim();
  const publicUrl = configuredUrl ? `${configuredUrl}${configuredUrl.includes('?') ? '&' : '?'}demo=1&browser-file-test=1`
    : `file://${ROOT}/index.html?demo=1&browser-file-test=1`;
  await cdp.send('Page.navigate', { url: forceCanvas || lifeBoundaryOnly || atmosphereOnly ? `${publicUrl}&dev=1` : publicUrl }, session);
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
  const tools={evaluate,wait,poll,errors:cdp.errors,click,simulationFallback:forceSimulationFallback,browserIdentity,
    pointerDown:(x,y)=>pointerDown(cdp,session,x,y),pointerMove:(x,y)=>pointerMove(cdp,session,x,y),
    pointerUp:(x,y)=>pointerUp(cdp,session,x,y),
    key:(value)=>key(cdp,session,value),tap:(x,y)=>tap(cdp,session,x,y),drag:(from,to)=>drag(cdp,session,from,to),
    flick:(from,to,options)=>flick(cdp,session,from,to,options),
    touchFlick:(from,to,options)=>touchFlick(cdp,session,from,to,options),
    wheel:(x,y)=>wheel(cdp,session,x,y),touchDrag:(from,to)=>touchDrag(cdp,session,from,to),
    pinch:(center)=>pinch(cdp,session,center),touchCancel:(point)=>touchCancel(cdp,session,point),screenshot: (name) => screenshot(cdp, session, name),
    setMedia:(features=[])=>cdp.send('Emulation.setEmulatedMedia',{media:'screen',features},session),
    navigate: async (url) => { await cdp.send('Page.navigate', { url }, session); await wait(2200); },
    setViewport: (width, height) => cdp.send('Emulation.setDeviceMetricsOverride',
      { width, height, deviceScaleFactor: 1, mobile: width < 600 }, session) };
  if (atmosphereOnly) {
    const label=`${recordBaseline?'baseline':'final'}${cohort?`-cohort-${cohort}`:''}`;
    const evidence=await runAtmosphereFixture(tools,{label,enforce:!recordBaseline});
    const report=JSON.stringify({...evidence,sourceRevision:process.env.BROWSER_TEST_REVISION?.trim()||gitValue(['rev-parse','HEAD']),
      harnessRevision:gitValue(['rev-parse','HEAD']),branch:gitValue(['branch','--show-current']),
      workingTreeDirty:Boolean(gitValue(['status','--porcelain'])),sourceUrl:configuredUrl??`file://${ROOT}/index.html`,
      browser:browserIdentity.product,protocolVersion:browserIdentity.protocolVersion,
      browserErrors:cdp.errors.slice(0,20),browserStderr:cdp.stderr.slice(0,20)},null,2)+'\n';
    const name=`atmosphere-silhouette-${label}-${evidence.backend}.json`;writeFileSync(resolve(REPORTS,name),report);
    const hash=createHash('sha256').update(report).digest('hex');
    console.log(`test:browser:atmosphere — ${recordBaseline?'RECORDED':'PASS'} (${evidence.backend}; report ${name}; sha256 ${hash}; repeat p95/max ${evidence.repeat.p95?.toFixed(3)}/${evidence.repeat.maximum?.toFixed(3)} CSS px; contour p95/max ${evidence.contour.p95?.toFixed(3)}/${evidence.contour.maximum?.toFixed(3)} CSS px; radius ${evidence.largestProjectedRadius.toFixed(3)} CSS px)`);
  } else if (lifeBoundaryOnly) {
    const label=recordBaseline?'baseline':'final';
    const evidence=await runLifeBoundaryFixture(tools,{label,enforce:!recordBaseline});
    const report=JSON.stringify(evidence,null,2)+'\n';const name=`life-boundary-${label}-${evidence.backend}.json`;
    writeFileSync(resolve(REPORTS,name),report);const hash=createHash('sha256').update(report).digest('hex');
    console.log(`test:browser:life-boundaries — ${recordBaseline?'RECORDED':'PASS'} (${evidence.backend}; report ${name}; sha256 ${hash}; repeat noise ${evidence.repeat.noise.toFixed(6)}; threshold ${evidence.repeat.threshold.toFixed(6)}; steady p95 ${evidence.timing.steady.p95.toFixed(3)} ms; update p95 ${evidence.timing.update.p95.toFixed(3)} ms)`);
  } else if (environmentPressureOnly) {
    const evidence = await runEnvironmentPressureScenario(tools);
    const receipt = writeEnvironmentPressureReport(evidence, browserIdentity, cdp, Boolean(configuredUrl), configuredUrl);
    console.log(`test:browser:environment-pressure — PASS (${evidence.simulationPath}/${evidence.rendererPath}; `
      +`profile v${evidence.profileVersion}; report ${receipt.path}; sha256 ${receipt.sha256})`);
  } else {
    if (!forceCanvas) await runDeveloperSpeedChecks(tools, publicUrl);
    else tools.continuity = await runContinuityFixture(tools);
    tools.cameraEvidence = await runCameraMotionScenario(tools);
    tools.cameraReceipt = writeKineticReleaseReport(tools.cameraEvidence, browserIdentity, cdp,
      forceSimulationFallback, forceCanvas, Boolean(configuredUrl));
    const evidence = forceCanvas ? await runCanvasScenario(tools) : await runScenario(tools);
    const light = evidence.worldmaking.luminance?.emission;
    const lightEvidence = light ? `; paired charge luminance Δ day/night ${light.day.toFixed(3)}/${light.night.toFixed(3)}` : '';
    console.log(forceCanvas?`test:browser:file — PASS (canvas2d fallback; score ${evidence.score}; ${evidence.worldmaking.powered} powered cells (day ${evidence.worldmaking.day.cell}/${evidence.worldmaking.day.charge}/${evidence.worldmaking.day.dot.toFixed(2)}, night ${evidence.worldmaking.night.cell}/${evidence.worldmaking.night.charge}/${evidence.worldmaking.night.dot.toFixed(2)})${lightEvidence}; continuous shell center/limb clear; unified shell, History, Evolution, and Trophies)`
      :`test:browser:file — PASS (${evidence.backend}; ${forceSimulationFallback?'fallback simulation':'Worker simulation'}; unified shell; score ${evidence.score}; `
        +`1.5x (effective 6) ${evidence.elapsed.toFixed(2)}s; developer 64x (effective 256) ${tools.developerEvidence.elapsed.toFixed(2)}s; 4 draws; title render mean ${evidence.render.mean.toFixed(2)} ms, p95 ${evidence.render.p95.toFixed(2)} ms; `
        +`${evidence.worldmaking.powered} powered cells (day ${evidence.worldmaking.day.cell}/${evidence.worldmaking.day.charge}/${evidence.worldmaking.day.dot.toFixed(2)}, night ${evidence.worldmaking.night.cell}/${evidence.worldmaking.night.charge}/${evidence.worldmaking.night.dot.toFixed(2)})${lightEvidence}; continuous shell center/limb clear; visual IDB ${evidence.idb?'yes':'unavailable'}; adjacent Evolution purchase ${evidence.nodeId})`);
    if (tools.continuity) console.log(`continuous shell ${JSON.stringify(tools.continuity)}`);
    if (tools.cameraReceipt) console.log(`camera motion ${JSON.stringify(tools.cameraReceipt)}`);
    if (evidence.metricRects) console.log(`metric rects ${JSON.stringify(evidence.metricRects)} responsive ${JSON.stringify(evidence.responsive)}`);
  }
  exitCode = 0;
} catch (error) {
  console.error(`test:browser:file — FAIL: ${error.message}`);
  for (const value of [...cdp.errors, ...cdp.stderr].slice(0, 12)) console.error(`  browser> ${value}`);
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
  const options = await evaluate(`(()=>({runtime:[...document.getElementById('speed-select').options].map(o=>Number(o.value)),menuSpeed:Boolean(document.getElementById('settings-speed')),marker:!document.getElementById('dev-mode-marker').hidden&&document.getElementById('dev-mode-marker').offsetHeight>0,dev:window.__CELL_SPHERE_BOOT__.developerMode,hook:Object.hasOwn(window,'__CSG_AGENT__')&&window.__CSG_AGENT__===null}))()`);
  if (options.runtime.join(',') !== '0.25,0.5,0.75,1,1.25,1.5,2,4,8,16,32,64' || options.menuSpeed
      || !options.marker || !options.dev || !options.hook) throw new Error(`developer speed exposure failed: ${JSON.stringify(options)}`);
  await trustedControl(evaluate, click, '#begin-button');
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000)) throw new Error('developer check world did not start');
  const runStartedAt = performance.now();
  await trustedControl(evaluate, click, '#speed-select'); for (let index = 0; index < 8; index++) await key('ArrowDown'); await key('Enter'); await wait(120);
  const runtime = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,b=window.__CELL_SPHERE_BOOT__,saved=JSON.parse(localStorage.getItem(b.storage.settings));return {selected:Number(document.getElementById('speed-select').value),runtime:a.speed,durable:a.settings.speed,saved:saved.speed}})()`);
  if (runtime.selected !== 64 || runtime.runtime !== 64 || runtime.durable > 1.5 || runtime.saved > 1.5) throw new Error(`trusted developer runtime selection failed: ${JSON.stringify(runtime)}`);
  const isolated = await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,data=await import('./src/interface/app-data.js'),saved=JSON.parse(data.serializeExportData(a.meta,a.archive,{...a.settings,speed:64,developerMode:true}));return {runtime:a.speed,durable:a.settings.speed,exportSpeed:saved.settings.speed,exportDev:'developerMode' in saved.settings}})()`);
  if (isolated.runtime !== 64 || isolated.durable > 1.5 || isolated.exportSpeed > 1.5 || isolated.exportDev) throw new Error(`developer settings leaked: ${JSON.stringify(isolated)}`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 8000, 100)) {
    const state = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {phase:a.phase,tick:a.snapshot?.tick,resultReject:a.__lastResultReject??null}})()`);
    throw new Error(`64x developer world did not reach one result: ${JSON.stringify(state)}`);
  }
  const result = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {status:a.snapshot?.status,alive:a.snapshot?.metrics?.aliveCount,disabled:document.getElementById('speed-select').disabled,results:a.meta.resultKeys.length}})()`);
  if (result.status !== 'extinct' || result.alive !== 0 || !result.disabled || result.results !== 1) throw new Error(`64x terminal invalid: ${JSON.stringify(result)}`);
  tools.developerEvidence = { elapsed: (performance.now() - runStartedAt) / 1000 };
  tools.continuity = await runContinuityFixture(tools);
  await navigate(publicUrl);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_BOOT__?.playable'), Boolean, 5000)) throw new Error('public page did not return after developer check');
  const normal = await evaluate(`(()=>({options:[...document.getElementById('speed-select').options].map(o=>Number(o.value)),dev:window.__CELL_SPHERE_BOOT__.developerMode,marker:document.getElementById('dev-mode-marker').hidden,hook:Object.hasOwn(window,'__CSG_AGENT__'),speed:window.__CELL_SPHERE_APP__.settings.speed}))()`);
  if (normal.options.join(',') !== '0.25,0.5,0.75,1,1.25,1.5' || normal.dev || !normal.marker || normal.hook || normal.speed > 1.5) throw new Error(`public mode contaminated: ${JSON.stringify(normal)}`);
}

async function trustedControl(evaluate, click, selector) {
  const point = await evaluate(`(()=>{const e=document.querySelector(${JSON.stringify(selector)});if(!e)throw new Error('missing control');const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  await click(...point);
}

async function runCanvasScenario({ evaluate, screenshot, setViewport, poll, wait, errors, key, setMedia }) {
  const boot = await evaluate('window.__CELL_SPHERE_BOOT__'); if (boot?.renderer !== 'canvas2d') throw new Error('Canvas fallback did not boot');
  await screenshot('browser-canvas-title-mobile.png'); await setViewport(1440, 900); await wait(180); await screenshot('browser-canvas-title-desktop.png');
  await evaluate(`document.getElementById('begin-button').click()`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000)) throw new Error('Canvas run did not start');
  const keyboardInspector=await verifyKeyboardInspector({ evaluate, key, poll, wait, setMedia });
  const developed = await evaluate(`(async()=>{const [{RunController},{compileEvolution,MEMORY_NODE_IDS,evolutionRunConfiguration}]=await Promise.all([import('./src/simulation/simulator.js'),import('./src/game/skills/index.js')]);const m=compileEvolution({evolutionLevels:MEMORY_NODE_IDS.map(id=>({id,level:'20'}))}),c=new RunController({seed:9099,worldOrdinal:'20',...evolutionRunConfiguration(m)});c.start();c.advance(300);const a=window.__CELL_SPHERE_APP__,firstM=compileEvolution({evolutionLevels:['first-division','reliable-budding','bioelectric-spark'].map(id=>({id,level:'1'}))}),first=new RunController({seed:19,worldOrdinal:'20',...evolutionRunConfiguration(firstM)});first.start();first.advance(300);const firstSnapshot={...first.snapshot(),...a.worldIdentity};a.__firstLuminousSnapshot=firstSnapshot;const mid=c.snapshot();c.advance(4000);a.pause.set('browser-luminous',true);a.__luminousDecaySnapshot={...c.snapshot(),...a.worldIdentity};const s={...mid,...a.worldIdentity};a.historySnapshot=s;a.historyPlaybackActive=true;return {transformed:[...s.transformationState].filter(Boolean).length,powered:[...s.electricityQ].filter(Boolean).length,firstPowered:[...firstSnapshot.electricityQ].filter(Boolean).length}})()`);
  if (developed.transformed <= 50 || developed.powered <= 50 || developed.firstPowered <= 0) throw new Error(`Canvas ecology fixture failed: ${JSON.stringify(developed)}`);
  await wait(120);await screenshot('browser-canvas-transformations.png');
  const focusCharge=async(day)=>evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{focusCamera}=await import('./src/rendering/camera.js'),s=a.historySnapshot,p=a.topo.positions,q=s.electricityQ,sun=[-.52,.72,.44];let cell=-1,charge=-1,dot=0;for(let i=0;i<q.length;i++){const d=p[i*3]*sun[0]+p[i*3+1]*sun[1]+p[i*3+2]*sun[2];if((${day?'true':'false'}?d>.55:d<-.7)&&q[i]>charge){cell=i;charge=q[i];dot=d}}if(cell<0)throw new Error('no charged visual focus');focusCamera(a.camera,p.subarray(cell*3,cell*3+3));a.lastRender=-Infinity;const accepted=a.renderer.render({snapshot:s,worldIdentity:a.worldIdentity,camera:a.camera,selectedNode:null,highlightedCells:[],time:performance.now()/1000,pulse:false});return{cell,charge,dot,accepted,camera:a.camera.direction.slice()}})()`);
  developed.day=await focusCharge(true);await wait(120);developed.dayImage=await screenshot('browser-canvas-world-luminous-day.png');
  developed.night=await focusCharge(false);await wait(120);developed.nightImage=await screenshot('browser-canvas-world-luminous-night.png');
  if(developed.day.charge<=0||developed.night.charge<=0||!developed.day.accepted||!developed.night.accepted||developed.dayImage.hash===developed.nightImage.hash)
    throw new Error(`Canvas Luminous visual focus missing: ${JSON.stringify(developed)}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.historySnapshot=a.__firstLuminousSnapshot;a.historyPlaybackActive=true})()`);
  developed.firstLuminance=await measureLuminousHierarchy(evaluate);
  if(!developed.firstLuminance.valid)throw new Error(`first-purchase Canvas Luminous hierarchy failed: ${JSON.stringify(developed.firstLuminance)}`);
  developed.luminance=developed.firstLuminance;
  developed.decay=await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=a.__luminousDecaySnapshot;a.historySnapshot=s;a.historyPlaybackActive=true;const charge=[...s.electricityQ].reduce((sum,value)=>sum+value,0),accepted=a.renderer.render({snapshot:s,worldIdentity:a.worldIdentity,camera:a.camera,selectedNode:null,highlightedCells:[],time:performance.now()/1000,pulse:false});return{charge,accepted,status:s.status}})()`);
  if(developed.decay.charge!==0||!developed.decay.accepted||developed.decay.status!=='extinct')throw new Error(`Canvas Luminous decay visual missing: ${JSON.stringify(developed.decay)}`);
  await wait(120);developed.decayImage=await screenshot('browser-canvas-world-luminous-decayed.png');
  if(developed.decayImage.hash===developed.nightImage.hash)throw new Error('charged and decayed Canvas pixels were identical');
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.historySnapshot=null;a.historyPlaybackActive=false;delete a.__luminousDecaySnapshot;delete a.__firstLuminousSnapshot;a.pause.set('browser-luminous',false);const speed=document.getElementById('speed-select');speed.value='64';speed.dispatchEvent(new Event('change'))})()`);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'result', 50000)) throw new Error('Canvas run did not finish');
  const terminal=await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{score:Number(document.getElementById('result-score').textContent.replaceAll(',','')),status:a.snapshot?.status,alive:a.snapshot?.metrics?.aliveCount,reach:document.getElementById('hud-reach').textContent,
    environment:document.getElementById('result-environment').textContent,next:document.getElementById('result-next-button').textContent,hud:document.getElementById('hud-environment-level').textContent,
    continuation:a.continuation.status,cycle:document.getElementById('result-continuation-visible').textContent,accessible:document.getElementById('result-continuation-accessible').textContent}})()`);
  const score = terminal.score; if(terminal.status!=='extinct'||terminal.alive!==0||terminal.reach!=='0%'||!terminal.environment.includes('Peak Environment Level')
    ||terminal.next!=='Next World'||terminal.hud==='0'||terminal.continuation!=='counting'||terminal.cycle!=='World cycle continues automatically'
    ||!terminal.accessible.includes('Any interaction cancels it'))throw new Error(`Canvas terminal snapshot stale: ${JSON.stringify(terminal)}`);
  await evaluate("document.getElementById('result-history-button').click()"); await screenshot('browser-canvas-history-desktop.png');
  await evaluate("document.getElementById('scene-evolution').click()"); await wait(180); await screenshot('browser-canvas-evolution-desktop.png');
  const selectedReady=await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{validateMeta}=await import('./src/platform/storage.js');a.meta=validateMeta({...a.meta,echoBalance:'1000000'});
    const target=a.memorySnapshot.nodeStates.find(n=>n.reason==='ready');a.selectEvolutionCell(target.id);a.trophyNotifications.replace({...a.meta,trophyQueue:[]});const next=a.memorySnapshot.nodeStates.find(n=>n.id===target.id);
    return{id:target.id,status:a.memorySnapshot.memoryStatus[next.cell],action:document.getElementById('memory-unlock').getAttribute('aria-label')}})()`);
  if(![7,10].includes(selectedReady.status)||!selectedReady.action?.includes('Echoes'))throw new Error(`Canvas selected-ready state failed: ${JSON.stringify(selectedReady)}`);
  const pulseA=await screenshot('browser-canvas-evolution-selected-ready.png');await wait(450);
  const pulseB=await screenshot('browser-canvas-evolution-selected-ready-pulse.png');if(pulseA.hash===pulseB.hash)throw new Error('Canvas selected-ready normal-motion pulse was static');
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'})})()`);await wait(120);
  const staticA=await screenshot('browser-canvas-evolution-selected-ready-reduced.png');await wait(450);const staticB=await screenshot('browser-canvas-evolution-selected-ready-reduced-static.png');
  if(staticA.hash!==staticB.hash)throw new Error('Canvas selected-ready reduced-motion state was not static');
  const atlas = await evaluate('window.__CELL_SPHERE_APP__.memorySnapshot.memoryStatus.length'); await evaluate("document.getElementById('scene-trophies').click()"); await wait(180); await screenshot('browser-canvas-trophies-desktop.png');
  const trophies = await evaluate(`({cells:window.__CELL_SPHERE_APP__.trophySnapshot.memoryStatus.length,nodes:window.__CELL_SPHERE_APP__.trophySnapshot.nodeStates.length})`);
  await installFirstReplacementCapture(evaluate); const oldRun = await evaluate('window.__CELL_SPHERE_APP__.activeRunId'); await evaluate("document.getElementById('trophy-next-button').click()");
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__.activeRunId'), (runId) => runId > oldRun, 5000)) throw new Error('Canvas replacement did not start');
  assertBlankReplacement(await evaluate('window.__CELL_SPHERE_APP__.__firstReplacementFrame'), 'Canvas 2D');
  const bounded = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return {...a.worldResourceAudit(),raf:a.frameAudit}})()`);
  if (bounded.interactionListeners !== 8 || bounded.historyRequests || bounded.raf.errors || bounded.raf.scheduled < bounded.raf.frames - 1) throw new Error(`Canvas replacement resources/RAF leaked: ${JSON.stringify(bounded)}`);
  if(score<=0||atlas!==42||trophies.cells!==162||trophies.nodes!==96||errors.length)throw new Error('Canvas fallback state failed');
  return{score,keyboardInspector,worldmaking:developed};
}

function protocol(child) {
  let buffer = ''; let nextId = 0;
  const pending = new Map(); const errors = []; const stderr = [];
  child.stdio[2].on('data', (data) => { for (const line of data.toString().split('\n').filter(Boolean)) {
    stderr.push(line.slice(0, 500)); if (stderr.length > 40) stderr.shift();
  } });
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
    setTimeout(() => { if (pending.delete(id)) reject(new Error(`CDP timeout: ${method}`)); }, cdpTimeoutMs);
  });
  return { send, errors, stderr };
}

function writeKineticReleaseReport(evidence, browserIdentity, cdp, fallback, canvas, deployed) {
  const simulationPath = fallback ? 'fallback' : 'worker';
  const rendererPath = canvas ? 'canvas2d' : evidence.backend;
  const name = `kinetic-sphere-release-${deployed ? 'deployed' : 'final'}-${simulationPath}-${rendererPath}.json`;
  const report = `${JSON.stringify({ schema: 3, capturedAt: new Date().toISOString(),
    revision: gitValue(['rev-parse', 'HEAD']), branch: gitValue(['branch', '--show-current']),
    browser: browserIdentity.product, protocolVersion: browserIdentity.protocolVersion,
    simulationPath, rendererPath, deployed, ...evidence,
    browserErrors: cdp.errors.slice(0, 20), browserStderr: cdp.stderr.slice(0, 20) }, null, 2)}\n`;
  writeFileSync(resolve(REPORTS, name), report);
  return { path: `reports/${name}`, sha256: createHash('sha256').update(report).digest('hex'),
    simulationPath, rendererPath, deployed };
}

function writeEnvironmentPressureReport(evidence, browserIdentity, cdp, deployed, sourceUrl) {
  const name = `environment-pressure-differentiation-v1-${deployed ? 'deployed' : 'final'}-${evidence.simulationPath}-${evidence.rendererPath}.json`;
  const report = `${JSON.stringify({ schema: 1, capturedAt: new Date().toISOString(),
    revision: process.env.BROWSER_TEST_REVISION?.trim() || gitValue(['rev-parse', 'HEAD']),
    harnessRevision: gitValue(['rev-parse', 'HEAD']), branch: gitValue(['branch', '--show-current']),
    workingTreeDirty: Boolean(gitValue(['status', '--porcelain'])), sourceUrl: sourceUrl ?? `file://${ROOT}/index.html`,
    browser: browserIdentity.product, protocolVersion: browserIdentity.protocolVersion, deployed, ...evidence,
    browserErrors: cdp.errors.slice(0, 20), browserStderr: cdp.stderr.slice(0, 20) }, null, 2)}\n`;
  writeFileSync(resolve(REPORTS, name), report);
  return { path: `reports/${name}`, sha256: createHash('sha256').update(report).digest('hex') };
}

function gitValue(args) {
  const result = spawnSync('git', args, { cwd: ROOT, encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : null;
}

async function key(cdp, session, value) {
  const code = value; const virtual = value === 'Enter' ? 13 : value === ' ' ? 32
    : value === 'ArrowLeft' ? 37 : value === 'ArrowUp' ? 38 : value === 'ArrowRight' ? 39 : value === 'ArrowDown' ? 40 : 0;
  const common = { key:value, code, ...(virtual ? { windowsVirtualKeyCode:virtual, nativeVirtualKeyCode:virtual } : {}) };
  await cdp.send('Input.dispatchKeyEvent', { type:'rawKeyDown', ...common }, session);
  if (value === 'Enter' || value === ' ') await cdp.send('Input.dispatchKeyEvent', { type:'char', ...common, text:value === 'Enter' ? '\r' : ' ' }, session);
  await cdp.send('Input.dispatchKeyEvent', { type:'keyUp', ...common }, session);
}
async function tap(cdp,session,x,y){
 const point={x,y,radiusX:1,radiusY:1,force:1,id:1};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]},session);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},session);
}

async function pointerDown(cdp,session,x,y){await cdp.send('Input.dispatchMouseEvent',{
  type:'mousePressed',x,y,button:'left',clickCount:1},session)}
async function pointerMove(cdp,session,x,y){await cdp.send('Input.dispatchMouseEvent',{
  type:'mouseMoved',x,y,button:'left',buttons:1},session)}
async function pointerUp(cdp,session,x,y){await cdp.send('Input.dispatchMouseEvent',{
  type:'mouseReleased',x,y,button:'left',clickCount:1},session)}

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

async function flick(cdp, session, from, to, options = {}) {
  const steps = boundedInteger(options.steps, 5, 1, 20);
  const intervalMs = boundedInteger(options.intervalMs, 16, 0, 100);
  const startedAt = Date.now() / 1000;
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: from[0], y: from[1], button: 'left', clickCount: 1, timestamp: startedAt,
  }, session);
  for (let step = 1; step <= steps; step++) {
    await wait(intervalMs); await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved',
      x: from[0] + (to[0] - from[0]) * step / steps, y: from[1] + (to[1] - from[1]) * step / steps,
      button: 'left', buttons: 1, timestamp: startedAt + step * intervalMs / 1000 }, session);
  }
  await cdp.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: to[0], y: to[1], button: 'left', clickCount: 1,
    timestamp: startedAt + (steps * intervalMs + 1) / 1000,
  }, session);
}

async function wheel(cdp,session,x,y){await cdp.send('Input.dispatchMouseEvent',{type:'mouseWheel',x,y,deltaX:0,deltaY:180},session)}
async function touchDrag(cdp,session,from,to){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint(1,...from)]},session);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touchPoint(1,...to)]},session);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},session)}
async function touchFlick(cdp,session,from,to,options={}){const steps=boundedInteger(options.steps,5,1,20),intervalMs=boundedInteger(options.intervalMs,16,0,100);
 const startedAt=Date.now()/1000;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint(1,...from)],timestamp:startedAt},session);
 for(let step=1;step<=steps;step++){await wait(intervalMs);await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touchPoint(1,
   from[0]+(to[0]-from[0])*step/steps,from[1]+(to[1]-from[1])*step/steps)],timestamp:startedAt+step*intervalMs/1000},session)}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[],timestamp:startedAt+(steps*intervalMs+1)/1000},session)}
async function pinch(cdp,session,[x,y]){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint(1,x-20,y),touchPoint(2,x+20,y)]},session);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[touchPoint(1,x-70,y),touchPoint(2,x+70,y)]},session);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]},session)}
async function touchCancel(cdp,session,[x,y]){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[touchPoint(1,x,y)]},session);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]},session)}
function touchPoint(id,x,y){return{id,x,y,radiusX:2,radiusY:2,force:1}}
function boundedInteger(value,fallback,minimum,maximum){return Number.isInteger(value)?Math.max(minimum,Math.min(maximum,value)):fallback}

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
  const configured = process.env.BROWSER_CHROME_BIN?.trim();
  if (configured && existsSync(configured)) return configured;
  for (const name of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser']) {
    const result = spawnSync('which', [name], { encoding: 'utf8' });
    if (result.status === 0 && existsSync(result.stdout.trim())) return result.stdout.trim();
  }
  return null;
}

function assert(condition, message) { if (!condition) throw new Error(message); }
function wait(milliseconds) { return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds)); }
