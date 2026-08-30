/** Focused title and responsive geometry evidence shared by Chrome scenarios. */
export const REQUIRED_VIEWPORTS = Object.freeze([
  [320, 568], [360, 640], [375, 667], [390, 844], [430, 932], [844, 390],
  [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080],
]);

export async function captureTitleEvidence(t) {
  const { evaluate, screenshot, wait, setViewport } = t;
  for (const [index, name] of [[0,'wake'],[12,'branch'],[26,'mature'],[42,'pressure'],[72,'fragment'],[88,'extinct']]) {
    await evaluate(`(() => { const s=window.__CELL_SPHERE_APP__.showcase; s.reduced=false;
      s.startedAt=performance.now()-${index * 250}; s.apply(${index}); })()`);
    await wait(80); await screenshot(`browser-title-phase-${name}.png`);
  }
  const reduced = await evaluate(`(() => { const app=window.__CELL_SPHERE_APP__; app.settings={...app.settings,motion:'reduced'};
    app.showcase.update(performance.now(),true,false); return [app.showcase.frameIndex,app.showcase.reducedFrame]; })()`);
  assert(reduced[0] === reduced[1], 'reduced title did not hold its representative frame');
  await wait(80); await screenshot('browser-title-reduced.png');
  await evaluate(`(() => { const app=window.__CELL_SPHERE_APP__; app.settings={...app.settings,motion:'full'};
    const s=app.showcase; s.reduced=false; s.startedAt=performance.now(); s.apply(0); app.resetCameraMotion('home'); })()`);
  const before = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()'); await wait(650);
  const after = await evaluate('window.__CELL_SPHERE_APP__.camera.direction.slice()');
  assert(distance(before, after) < 1e-8, 'Home globe moved before the fresh idle delay elapsed');
  for (const [width, height] of REQUIRED_VIEWPORTS) {
    await setViewport(width, height); await wait(120);
    const fits = await evaluate('document.documentElement.scrollWidth<=innerWidth && document.documentElement.scrollHeight<=innerHeight');
    assert(fits, `title overflow at ${width}x${height}`); await screenshot(`browser-title-${width}x${height}.png`);
  }
  await setViewport(390, 844); await wait(120); return after;
}

export async function assertDockGeometry(t) {
  const { evaluate, setViewport, wait, screenshot } = t;
  for (const [width, height] of REQUIRED_VIEWPORTS) {
    await setViewport(width, height); await wait(80);
    const geometry = await evaluate(`(() => { const dock=document.querySelector('.command-rail'),r=dock.getBoundingClientRect();
      const controls=[...dock.querySelectorAll('button,select')].filter(e=>e.getClientRects().length).map(e=>e.getBoundingClientRect());
      const outside=controls.some(x=>x.left<0||x.top<0||x.right>innerWidth+1||x.bottom>innerHeight+1||x.width<43||x.height<43);
      const overlap=controls.some((a,i)=>controls.some((b,j)=>j>i&&a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1));
      return {outside,overlap,height:r.height,width:r.width,viewport:innerWidth,controls:controls.map(x=>[x.left,x.top,x.width,x.height])}; })()`);
    assert(!geometry.outside && !geometry.overlap && geometry.height <= 72,
      `dock geometry at ${width}x${height}: ${JSON.stringify(geometry)}`);
    if ([[320,568],[390,844],[844,390],[768,1024],[1440,900]].some(v=>v[0]===width&&v[1]===height)) {
      await screenshot(`browser-run-${width}x${height}.png`);
    }
  }
  await setViewport(390,844); await evaluate("document.documentElement.style.fontSize='200%'"); await wait(100);
  const scaled = await evaluate(`(() => { const r=document.querySelector('.command-rail').getBoundingClientRect();
    return {right:r.right,bottom:r.bottom,height:r.height,scroll:document.documentElement.scrollWidth>innerWidth}; })()`);
  assert(!scaled.scroll && scaled.right <= 390 && scaled.bottom <= 844 && scaled.height <= 72,
    `200% dock geometry: ${JSON.stringify(scaled)}`); await screenshot('browser-run-text-200.png');
  await evaluate("document.documentElement.style.fontSize=''"); await wait(100);
}
export async function assertSkillGeometry(t) {
  const { evaluate, setViewport, wait, screenshot } = t;
  for (const [width, height] of [[320,568],[360,480],[390,320],[390,844],[430,932],[640,360],[667,375],[844,390],[768,1024],[1440,900]]) {
    await setViewport(width,height); await wait(100);
    const g = await skillGeometry(evaluate);
    const distMax = width < 600 ? 5.6 : width < 900 ? 4.7 : 3.8;
    assert(!g.overlap && !g.horizontal && g.dist <= distMax && g.p[0] >= -1 && g.p[1] >= -1
      && g.p[2] <= width + 1 && g.p[3] <= height + 1 && g.close[0] >= 0 && g.close[2] <= width
      && g.close[1] >= g.p[1] - 1 && g.close[3] <= Math.min(g.p[3], height) + 1
      && g.unlock[0] >= g.p[0] && g.unlock[1] >= g.p[1] && g.unlock[2] <= g.p[2]
      && g.unlock[3] <= Math.min(g.p[3], height) + 1 && g.unlock[3] - g.unlock[1] >= 43,
    `skill geometry at ${width}x${height}: ${JSON.stringify(g)}`);
    if ([[320,568],[390,320],[390,844],[667,375],[844,390],[768,1024],[1440,900]].some(v=>v[0]===width&&v[1]===height)) await screenshot(`browser-skill-${width}x${height}.png`);
  }
  await setViewport(320,568); await evaluate("document.documentElement.style.fontSize='200%'"); await wait(100);
  const scaled = await skillGeometry(evaluate);
  assert(scaled.unlock[0] >= scaled.p[0] && scaled.unlock[2] <= scaled.p[2]
    && scaled.unlock[1] >= scaled.p[1] && scaled.unlock[3] <= Math.min(scaled.p[3], 568)
    && scaled.unlock[3] - scaled.unlock[1] >= 43, `200% Evolution unlock geometry: ${JSON.stringify(scaled)}`);
  await screenshot('browser-skill-text-200.png'); await evaluate("document.documentElement.style.fontSize=''");
  await setViewport(390,844); await wait(100);
}
async function skillGeometry(evaluate) {
  return evaluate(`(() => { const app=window.__CELL_SPHERE_APP__,panel=document.getElementById('memory-node-panel'),body=panel.querySelector('.surface-body'),
    footer=panel.querySelector('.surface-actions'),unlockNode=document.getElementById('memory-unlock'),closeNode=document.getElementById('memory-node-close');
    body.scrollTop=body.scrollHeight;panel.scrollTop=0;const close=closeNode.getBoundingClientRect();unlockNode.scrollIntoView({block:'nearest'});const unlock=unlockNode.getBoundingClientRect();
    const last=document.querySelector('#memory-node-meta dd:last-of-type')?.getBoundingClientRect(),f=footer.getBoundingClientRect(),p=panel.getBoundingClientRect(); body.scrollTop=0;
    return {dist:app.camera.dist,p:[p.left,p.top,p.right,p.bottom],close:[close.left,close.top,close.right,close.bottom],unlock:[unlock.left,unlock.top,unlock.right,unlock.bottom],footer:[f.left,f.top,f.right,f.bottom],
      rows:getComputedStyle(panel).gridTemplateRows,padding:getComputedStyle(panel).padding,footerHeight:getComputedStyle(footer).height,
      footerGrid:getComputedStyle(footer).gridRow,footerMin:getComputedStyle(footer).minHeight,beforePosition:getComputedStyle(panel,'::before').position,beforeGrid:getComputedStyle(panel,'::before').gridRow,
      surfaceScroll:panel.scrollTop,surfaceOverflow:getComputedStyle(panel).overflowY,
      overlap:Boolean(last&&last.bottom>f.top+1),horizontal:panel.scrollWidth>panel.clientWidth}; })()`);
}
function distance(a, b) { return Math.hypot(...a.map((value, index) => value - b[index])); }
function assert(value, message) { if (!value) throw new Error(message); }
