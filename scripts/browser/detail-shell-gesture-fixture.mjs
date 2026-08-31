/** Real pointer evidence for globe manipulation through the shared detail shell. */
export async function measureDetailShellGesture({ drag, evaluate, pinch, setViewport, tap, wait, wheel }, returnViewport) {
  await setViewport(390, 844); await wait(100);
  let report;
  try {
    const before = await evaluate(`(()=>{const app=window.__CELL_SPHERE_APP__,proxy=document.getElementById('surface-globe-gesture'),
      fallback=document.getElementById('memory-node-panel'),target=proxy??fallback,r=target.getBoundingClientRect(),x=r.left+r.width*.45,y=r.top+r.height*.5,
      hit=document.elementFromPoint(x,y);return{target:target.id,hasProxy:Boolean(proxy),rect:{left:r.left,top:r.top,width:r.width,height:r.height},point:[x,y],
        hit:hit?.id??hit?.tagName??null,direction:Array.from(app.camera.direction),distance:app.camera.dist,selected:app.memoryUi.selectedCell,
        levels:JSON.stringify(app.meta.evolutionLevels),overlay:app.overlay}})()`);
    await drag(before.point, [before.point[0] + 80, before.point[1] + 18]); await wait(80);
    const afterDrag = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{direction:Array.from(a.camera.direction),distance:a.camera.dist,
      selected:a.memoryUi.selectedCell,levels:JSON.stringify(a.meta.evolutionLevels),overlay:a.overlay,motion:a.cameraMotion?.state}})()`);
    await wheel(...before.point); await wait(50);
    const afterWheel = await evaluate(`(()=>window.__CELL_SPHERE_APP__.camera.dist)()`);
    await pinch(before.point); await wait(80);
    const afterPinch = await evaluate(`(()=>window.__CELL_SPHERE_APP__.camera.dist)()`);
    await tap(...before.point); await wait(60);
    const afterTap = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{selected:a.memoryUi.selectedCell,
      levels:JSON.stringify(a.meta.evolutionLevels),overlay:a.overlay,motion:a.cameraMotion?.state}})()`);
    const directionTravel = Math.hypot(...before.direction.map((value, axis) => value - afterDrag.direction[axis]));
    report = { before, afterDrag, afterWheel, afterPinch, afterTap, directionTravel,
      valid: before.target === 'surface-globe-gesture' && before.hasProxy && before.rect.height >= 44 && before.rect.width >= 44
        && directionTravel > .08 && Math.abs(afterWheel - afterDrag.distance) > 1e-6 && Math.abs(afterPinch - afterWheel) > 1e-6
        && afterDrag.selected === before.selected && afterDrag.levels === before.levels && afterDrag.overlay === 'memory-node'
        && afterTap.selected === before.selected && afterTap.levels === before.levels && afterTap.overlay === 'memory-node' };
  } finally {
    await setViewport(returnViewport.width, returnViewport.height); await wait(80);
  }
  const action = await evaluate(`(()=>{const shell=document.getElementById('context-shell'),panel=document.getElementById('memory-node-panel'),
    button=document.getElementById('memory-unlock'),rect=(node)=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},
    s=rect(shell),p=rect(panel),b=rect(button),hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);return{shell:s,panel:p,button:b,
      hit:hit?.id??hit?.tagName??null,valid:b.width>=44&&b.height>=44&&b.left>=s.left&&b.right<=s.right&&b.top>=s.top&&b.bottom<=s.bottom&&hit===button}})()`);
  report = { ...report, action, valid: report.valid && action.valid };
  return report;
}
