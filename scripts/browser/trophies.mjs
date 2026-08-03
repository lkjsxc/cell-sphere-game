/** Real-browser Trophy migration, topology, selection, and restoration evidence. */
export async function assertNoLoadGrant(t) {
  const state = await t.evaluate(`({schema:window.__CELL_SPHERE_APP__.meta.schema,trophies:window.__CELL_SPHERE_APP__.meta.trophyIds.length,backfill:window.__CELL_SPHERE_APP__.meta.trophyBackfillVersion})`);
  ok(state.schema === 8 && state.trophies === 0 && state.backfill === 0, `Trophies changed on load: ${JSON.stringify(state)}`);
}
export async function exerciseTrophies(t) {
  const { evaluate, screenshot, click, wait, poll, setViewport } = t;
  await evaluate("document.querySelector('#memory-screen .trophy-open').click()");
  ok(await poll(() => evaluate('window.__CELL_SPHERE_APP__.state'), (state) => state === 'trophies', 3000), 'Trophy Sphere did not open');
  const model = await evaluate(`(() => { const app=window.__CELL_SPHERE_APP__,s=app.trophySnapshot; return {level:app.topo.levels,cells:s.memoryStatus.length,
    trophies:s.nodeStates.length,neutral:[...s.memoryNodeIndex].filter(i=>i<0).length,earned:app.meta.trophyIds.length,grid:document.querySelectorAll('#trophy-grid [role=gridcell]').length,draws:app.renderer.drawCalls}; })()`);
  ok(model.level === 2 && model.cells === 162 && model.trophies === 96 && model.neutral === 66 && model.earned > 0 && model.grid === 96 && model.draws === 4,
    `Trophy Sphere model failed: ${JSON.stringify(model)}`);
  await setViewport(1440,900); await wait(180); await screenshot('browser-trophy-desktop.png');
  const id = await evaluate(`(() => { const app=window.__CELL_SPHERE_APP__,id=app.meta.trophyIds[0]; app.selectTrophy(id); document.getElementById('trophy-detail-close').click(); return id; })()`);
  const point = await evaluate(`(() => { const app=window.__CELL_SPHERE_APP__,r=app.canvas.getBoundingClientRect(); return [r.left+r.width*(.5+app.camera.offsetX/2),r.top+r.height*(.5-app.camera.offsetY/2)]; })()`);
  await click(...point); await wait(120); ok(await evaluate(`window.__CELL_SPHERE_APP__.trophyUi.selectedId===${JSON.stringify(id)} && !document.getElementById('trophy-detail-panel').hidden`), 'Trophy pointer did not select its exact cell');
  await setViewport(390,844); await wait(150); await screenshot('browser-trophy-selected-mobile.png');
  const semantic = await evaluate(`(() => { document.getElementById('trophy-detail-close').click(); const b=document.querySelector('#trophy-grid [data-trophy-index="1"]'); b.click(); return window.__CELL_SPHERE_APP__.trophyUi.selectedId===b.dataset.trophyId; })()`);
  ok(semantic, 'semantic Trophy grid diverged from globe selection'); await screenshot('browser-trophy-mobile.png'); await setViewport(1440,900);
  await evaluate("document.getElementById('trophy-detail-close').click(); document.getElementById('trophy-evolution-button').click()"); await wait(160);
  ok(await evaluate("window.__CELL_SPHERE_APP__.state==='memory' && window.__CELL_SPHERE_APP__.topo.levels===3 && window.__CELL_SPHERE_APP__.memorySnapshot.nodeStates.length===642"), 'Evolution did not restore after Trophy Sphere');
}
function ok(value, message) { if (!value) throw new Error(message); }
