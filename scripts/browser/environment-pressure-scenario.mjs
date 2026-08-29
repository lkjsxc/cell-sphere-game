/** Focused production-shell receipt for effective Environment pressure semantics. */
export async function runEnvironmentPressureScenario(t) {
  const { evaluate, wait, poll, key, setViewport, setMedia, screenshot, errors } = t;
  const boot = await evaluate('window.__CELL_SPHERE_BOOT__');
  ok(boot?.playable, 'Environment pressure page did not boot');
  if (await evaluate(`window.__CELL_SPHERE_APP__.phase!=='running'`)) {
    await trustedId(t, 'begin-button');
    ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.phase'), (phase) => phase === 'running', 5000),
      'Environment pressure World did not start');
  }
  const snapshotReady = await poll(() => evaluate('Boolean(window.__CELL_SPHERE_APP__.snapshot)'), Boolean, 5000);
  if (!snapshotReady) {
    const state = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{phase:a.phase,driver:Boolean(a.driver),fallback:a.driver?.hasFallback,
      status:a.driver?.status,snapshot:a.snapshot,errors:window.__CELL_SPHERE_ERRORS__?.slice(-5),pause:a.pause?.reasons?.()??null}})()`);
    throw new Error(`Environment pressure authority did not publish a snapshot: ${JSON.stringify(state)}`);
  }
  const path = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.pause.set('browser-environment-pressure',true);return {renderer:a.renderer.backend,fallback:a.driver.hasFallback,profileVersion:a.snapshot.environmentProfileVersion,summary:a.snapshot.environmentPressureSummary}})()`);
  ok(path.fallback === Boolean(t.simulationFallback), `Environment pressure execution path mismatch: ${JSON.stringify(path)}`);

  await evaluate(`(()=>{const b=document.getElementById('environment-level-button');b.focus();return document.activeElement===b})()`);
  await key('Enter'); await wait(80);
  const keyboardOpen = await evaluate(`(()=>({overlay:window.__CELL_SPHERE_APP__.overlay,kind:window.__CELL_SPHERE_APP__.metricUi.kind,
    focus:document.activeElement?.id,expanded:document.getElementById('environment-level-button').getAttribute('aria-expanded')}))()`);
  ok(keyboardOpen.overlay === 'metric' && keyboardOpen.kind === 'environment' && keyboardOpen.focus === 'metric-heading'
    && keyboardOpen.expanded === 'true', `Environment pressure keyboard open failed: ${JSON.stringify(keyboardOpen)}`);
  await key('Escape'); await wait(80);
  const keyboardClose = await evaluate(`(()=>({overlay:window.__CELL_SPHERE_APP__.overlay,focus:document.activeElement?.id,
    expanded:document.getElementById('environment-level-button').getAttribute('aria-expanded')}))()`);
  ok(keyboardClose.overlay === null && keyboardClose.focus === 'environment-level-button' && keyboardClose.expanded === 'false',
    `Environment pressure focus restoration failed: ${JSON.stringify(keyboardClose)}`);
  await trustedId(t, 'environment-level-button'); await wait(80);

  const fixtureAuthority = await evaluate(`(async()=>{const [{RunController},{updateEnvironmentProgression}]=await Promise.all([
    import('./src/simulation/simulator.js'),import('./src/simulation/state.js')]);
    const make=(tick,evolutionDefense)=>{const c=new RunController({seed:7105,worldOrdinal:'3',...(evolutionDefense?{evolutionDefense}: {})});c.start();c.state.tick=tick;updateEnvironmentProgression(c.state);return c.snapshot()};
    const terminalController=new RunController({seed:20260731,worldOrdinal:'3'});terminalController.start();let guard=0;
    while(terminalController.state.status!=='extinct'&&guard++<10000)terminalController.advance(64);
    if(terminalController.state.status!=='extinct')throw new Error('terminal Environment fixture did not complete');
    const a=window.__CELL_SPHERE_APP__;a.__environmentPressureFixtures={live:a.snapshot,level0:make(0),level1:make(1200),midpoint:make(1500),
      defended:make(1200,{pressureDefense:{scarcity:'600',renewal:'300',climate:'100',toxicity:'0',maintenance:'500'}}),
      terminal:terminalController.buildResult()};
    return Object.fromEntries(Object.entries(a.__environmentPressureFixtures).map(([key,value])=>[key,{tick:value.tick,
      resultSchemaVersion:value.resultSchemaVersion??null,profileVersion:value.environmentProfileVersion,
      summary:value.environmentPressureSummary}]))})()`);
  ok(fixtureAuthority.level0.summary.profileVersion === 5 && fixtureAuthority.level1.summary.nextProfileVersion === 5,
    `Environment pressure fixture identity missing: ${JSON.stringify(fixtureAuthority)}`);

  const fixtures = {};
  for (const name of ['live', 'level0', 'level1', 'midpoint', 'defended', 'terminal']) {
    const evidence = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,name=${JSON.stringify(name)},source=a.__environmentPressureFixtures[name],
      model=name==='terminal'?{result:source}:{snapshot:source};a.metricUi.close();a.metricUi.open('environment',model);
      const summary=source.environmentPressureSummary,definitions=Object.entries(summary.dimensions),rows=[...document.querySelectorAll('#metric-direct .metric-row')].map(row=>{const r=row.getBoundingClientRect();return{label:row.querySelector('span')?.textContent,value:row.querySelector('strong')?.textContent,
        accessible:row.getAttribute('aria-label'),role:row.getAttribute('role'),rect:{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}});
      const expected=definitions.map(([key,value])=>({key,label:value.label,value:Math.round(value.pressure*100)+'%',pressure:value.pressure}));
      return{name,level:summary.level,nextLevel:summary.nextLevel,profileVersion:summary.profileVersion,nextProfileVersion:summary.nextProfileVersion,
        resultSchemaVersion:source.resultSchemaVersion??null,
        profileHash:summary.profileHash,nextProfileHash:summary.nextProfileHash,interpolationQ:summary.interpolationQ,aggregate:summary.pressure,
        severityQ:summary.severityQ,expected,rows,strongest:document.querySelector('#metric-conditions .metric-row strong')?.textContent,
        eyebrow:document.getElementById('metric-eyebrow').textContent,copy:document.getElementById('metric-dialog').textContent,
        liveRegions:document.querySelectorAll('#metric-dialog [aria-live]').length}})()`);
    const rowShape = evidence.rows.map(({ label, value }) => ({ label, value }));
    const expectedShape = evidence.expected.map(({ label, value }) => ({ label, value }));
    const unroundedStrongest = evidence.expected.slice(1).reduce((best, value) => value.pressure > best.pressure ? value : best,
      evidence.expected[0]);
    ok(JSON.stringify(rowShape) === JSON.stringify(expectedShape), `${name} pressure rows diverged: ${JSON.stringify(evidence)}`);
    ok(evidence.rows.every((row) => row.role === 'group' && row.accessible === `${row.label} pressure, ${Number.parseInt(row.value, 10)} percent`),
      `${name} pressure accessible names diverged: ${JSON.stringify(evidence.rows)}`);
    ok(evidence.strongest === (unroundedStrongest.pressure > 0 ? unroundedStrongest.label : 'baseline resources and maintenance'),
      `${name} strongest pressure did not use unrounded stable order: ${JSON.stringify(evidence)}`);
    ok(evidence.liveRegions === 0 && !/netRating|publicRating|effectiveCoefficients/.test(evidence.copy)
      && evidence.rows.every((row) => /^\d+%$/.test(row.value)), `${name} exposed internal or qualitative pressure: ${JSON.stringify(evidence)}`);
    fixtures[name] = evidence;
  }
  ok(fixtures.level0.rows.every((row) => row.value === '0%'), `Level 0 pressure was not zero: ${JSON.stringify(fixtures.level0)}`);
  ok(fixtures.level1.rows.map((row) => row.value).join(',') === '45%,40%,29%,23%,35%',
    `Level 1 percentage oracle changed: ${JSON.stringify(fixtures.level1.rows)}`);
  ok(fixtures.midpoint.interpolationQ === 500000 && fixtures.midpoint.rows.some((row, index) => row.value !== fixtures.level1.rows[index].value),
    `midpoint pressure did not interpolate: ${JSON.stringify(fixtures.midpoint)}`);
  ok(Number.parseInt(fixtures.defended.rows[0].value, 10) < Number.parseInt(fixtures.level1.rows[0].value, 10),
    `defense did not reduce Resource yield pressure: ${JSON.stringify({ defended: fixtures.defended.rows, plain: fixtures.level1.rows })}`);
  ok(fixtures.terminal.eyebrow === 'FINAL ENVIRONMENT' && fixtures.terminal.resultSchemaVersion === 10,
    `terminal pressure did not render terminal-tick Result: ${JSON.stringify(fixtures.terminal)}`);

  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.metricUi.close();a.metricUi.open('environment',{snapshot:a.__environmentPressureFixtures.midpoint});document.documentElement.style.fontSize='32px'})()`);
  const responsive = [];
  for (const [width, height] of [[320, 568], [390, 844], [768, 1024], [844, 390], [1440, 900]]) {
    await setViewport(width, height); await wait(120);
    const evidence = await evaluate(`(()=>{const rect=e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},
      shell=document.getElementById('context-shell'),body=document.getElementById('metric-body'),close=document.getElementById('metric-close'),
      trigger=document.getElementById('environment-level-button'),rows=[...document.querySelectorAll('#metric-direct .metric-row')],s=rect(shell),b=rect(body),c=rect(close),m=rect(trigger);
      return{viewport:{width:innerWidth,height:innerHeight},fontSize:getComputedStyle(document.documentElement).fontSize,
        documentScrollWidth:document.documentElement.scrollWidth,bodyScrollWidth:document.body.scrollWidth,
        noHorizontalPageScroll:document.documentElement.scrollWidth<=innerWidth&&document.body.scrollWidth<=innerWidth,
        shell:s,body:b,close:c,trigger:m,surfaceOverflowY:getComputedStyle(shell.querySelector('.context-metric')).overflowY,
        bodyOverflowY:getComputedStyle(body).overflowY,
        scrollOwnerCount:[shell.querySelector('.context-metric'),body].filter(node=>['auto','scroll'].includes(getComputedStyle(node).overflowY)).length,
        bodyHorizontalScroll:body.scrollWidth>body.clientWidth,
        rowsInside:rows.every(row=>{const r=row.getBoundingClientRect();return r.left>=b.left-1&&r.right<=b.right+1}),
        closeReachable:c.width>=44&&c.height>=44&&c.left>=0&&c.right<=innerWidth,
        triggerVisible:m.bottom>0&&m.top<innerHeight,values:rows.map(row=>row.querySelector('strong')?.textContent)}})()`);
    responsive.push(evidence);
    ok(evidence.fontSize === '32px' && evidence.noHorizontalPageScroll && !evidence.bodyHorizontalScroll && evidence.rowsInside
      && evidence.closeReachable && evidence.triggerVisible && evidence.scrollOwnerCount === 1,
      `Environment pressure 200% layout failed ${width}x${height}: ${JSON.stringify(evidence)}`);
    if ((width === 390 && height === 844) || (width === 844 && height === 390)) {
      await screenshot(`environment-pressure-${path.fallback ? 'fallback' : 'worker'}-${path.renderer}-${width}x${height}-text-200.png`);
    }
  }
  await evaluate(`document.documentElement.style.fontSize=''`); await setViewport(390, 844); await wait(100);

  await setMedia([{ name: 'forced-colors', value: 'active' }]); await wait(80);
  const forcedColors = await evaluate(`(()=>{const rows=[...document.querySelectorAll('#metric-direct .metric-row')],style=getComputedStyle(rows[0]);return{
    active:matchMedia('(forced-colors: active)').matches,borderWidth:style.borderTopWidth,borderStyle:style.borderTopStyle,
    values:rows.map(row=>row.querySelector('strong')?.textContent),accessible:rows.map(row=>row.getAttribute('aria-label'))}})()`);
  ok(forcedColors.active && forcedColors.borderWidth !== '0px' && forcedColors.borderStyle !== 'none'
    && forcedColors.values.every((value) => /^\d+%$/.test(value)), `Environment pressure forced colors failed: ${JSON.stringify(forcedColors)}`);
  await setMedia([]);

  const reducedMotion = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,before=document.getElementById('metric-direct').textContent;
    a.applySettings({...a.settings,motion:'reduced'});return{before,after:document.getElementById('metric-direct').textContent,
      mode:document.documentElement.dataset.motion,animations:[...document.querySelectorAll('#metric-dialog *')].filter(node=>getComputedStyle(node).animationName!=='none').length}})()`);
  ok(reducedMotion.before === reducedMotion.after && reducedMotion.mode === 'reduced' && reducedMotion.animations === 0,
    `Environment pressure reduced motion changed meaning: ${JSON.stringify(reducedMotion)}`);
  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});a.pause.set('browser-environment-pressure',false);delete a.__environmentPressureFixtures})()`);
  ok(errors.length === 0, `Environment pressure browser errors: ${errors.join(' | ')}`);
  return Object.freeze({ browser: t.browserIdentity?.product, rendererPath: path.renderer,
    simulationPath: path.fallback ? 'fallback' : 'worker', profileVersion: path.profileVersion,
    keyboard: { open: keyboardOpen, close: keyboardClose }, fixtures, responsive, forcedColors, reducedMotion });
}

async function trustedId(t, id) {
  const point = await t.evaluate(`(()=>{const e=document.getElementById(${JSON.stringify(id)});if(!e)throw new Error('missing control');e.scrollIntoView({block:'nearest'});const r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()`);
  await t.click(...point);
}
function ok(value, message) { if (!value) throw new Error(message); }
