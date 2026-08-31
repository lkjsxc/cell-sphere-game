/** Real pointer evidence for globe manipulation through the shared detail shell. */
export async function measureDetailShellGesture({ evaluate, flick, pinch, poll, setViewport, tap, wait, wheel }, returnViewport) {
  await setViewport(390, 844); await wait(100);
  let report;
  try {
    await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});return true})()`);
    const before = await evaluate(`(()=>{const app=window.__CELL_SPHERE_APP__,proxy=document.getElementById('surface-globe-gesture'),
      fallback=document.getElementById('memory-node-panel'),target=proxy??fallback,r=target.getBoundingClientRect(),x=r.left+r.width*.45,y=r.top+r.height*.5,
      hit=document.elementFromPoint(x,y);return{target:target.id,hasProxy:Boolean(proxy),rect:{left:r.left,top:r.top,width:r.width,height:r.height},point:[x,y],
        hit:hit?.id??hit?.tagName??null,direction:Array.from(app.camera.direction),distance:app.camera.dist,selected:app.memoryUi.selectedCell,
        levels:JSON.stringify(app.meta.evolutionLevels),overlay:app.overlay,activeElement:document.activeElement?.id??null}})()`);
    await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,prior=window.__DETAIL_GESTURE_OBSERVER__;
      if(prior?.raf)cancelAnimationFrame(prior.raf);if(prior?.listener)document.removeEventListener('pointerup',prior.listener);
      const dot=(x,y)=>x[0]*y[0]+x[1]*y[1]+x[2]*y[2],angle=(x,y)=>{const c=Math.max(-1,Math.min(1,dot(x,y)));return c>1-1e-14?0:Math.acos(c)},
      copy=()=>({direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()}),
      context=()=>({selected:a.memoryUi.selectedCell,levels:JSON.stringify(a.meta.evolutionLevels),overlay:a.overlay,
        activeElement:document.activeElement?.id??null}),record={status:'armed',armedAt:performance.now(),releasedAt:null,completedAt:null,
        releaseDurationMs:0,cumulativeRadians:0,cumulativeTurns:0,samples:0,release:null,pointerupBasis:null,previous:null,
        finalBasis:null,finalState:null,releaseContext:null,finalContext:null,listener:null,raf:0};
      record.listener=()=>{record.releasedAt=performance.now();record.pointerupBasis=copy();record.release=a.worldResourceAudit().cameraMotion;
        record.releaseContext=context()};document.addEventListener('pointerup',record.listener,{once:true});
      const cleanup=()=>{document.removeEventListener('pointerup',record.listener);record.listener=null};
      const step=now=>{const state=a.worldResourceAudit().cameraMotion,current=copy();
        if(record.status==='armed'&&state.mode==='inertia'){record.status='tracking';record.previous=current;
          record.cumulativeRadians=angle(record.pointerupBasis?.direction??current.direction,current.direction);record.samples=1}
        else if(record.status==='tracking'){record.cumulativeRadians+=angle(record.previous.direction,current.direction);record.previous=current;record.samples++;
          if(state.mode!=='inertia'){record.status='complete';record.completedAt=now;record.releaseDurationMs=now-record.releasedAt;
            record.cumulativeTurns=record.cumulativeRadians/(2*Math.PI);record.finalBasis=current;record.finalState=state;
            record.finalContext=context();record.previous=null;record.raf=0;cleanup();return}}
        if(now-record.armedAt>7000||record.samples>=520){record.status='timed-out';record.completedAt=now;record.finalBasis=current;
          record.finalState=state;record.finalContext=context();record.previous=null;record.raf=0;cleanup();return}
        record.raf=requestAnimationFrame(step)};window.__DETAIL_GESTURE_OBSERVER__=record;record.raf=requestAnimationFrame(step);return true})()`);
    await flick(before.point, [before.point[0] + 80, before.point[1] + 18], { steps: 5, intervalMs: 16 });
    const immediate = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{direction:Array.from(a.camera.direction),distance:a.camera.dist,
      selected:a.memoryUi.selectedCell,levels:JSON.stringify(a.meta.evolutionLevels),overlay:a.overlay,activeElement:document.activeElement?.id??null,
      motion:a.worldResourceAudit().cameraMotion,input:a.worldResourceAudit().globeInput}})()`);
    const completed = await poll(() => evaluate('window.__DETAIL_GESTURE_OBSERVER__?.status'),
      (status) => status === 'complete' || status === 'timed-out', 7500, 25);
    const release = await evaluate(`(()=>{const r=window.__DETAIL_GESTURE_OBSERVER__;return{status:r.status,releasedAt:r.releasedAt,
      completedAt:r.completedAt,releaseDurationMs:r.releaseDurationMs,cumulativeRadians:r.cumulativeRadians,
      cumulativeTurns:r.cumulativeTurns,samples:r.samples,release:r.release,pointerupBasis:r.pointerupBasis,
      finalBasis:r.finalBasis,finalState:r.finalState,releaseContext:r.releaseContext,finalContext:r.finalContext}})()`);
    await wait(260);
    const afterRest = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{basis:{direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()},
      selected:a.memoryUi.selectedCell,levels:JSON.stringify(a.meta.evolutionLevels),overlay:a.overlay,activeElement:document.activeElement?.id??null,
      motion:a.worldResourceAudit().cameraMotion}})()`);
    await wheel(...before.point); await wait(50);
    const afterWheel = await evaluate(`(()=>window.__CELL_SPHERE_APP__.camera.dist)()`);
    await pinch(before.point); await wait(80);
    const afterPinch = await evaluate(`(()=>window.__CELL_SPHERE_APP__.camera.dist)()`);
    await tap(...before.point); await wait(60);
    const afterTap = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;return{selected:a.memoryUi.selectedCell,
      levels:JSON.stringify(a.meta.evolutionLevels),overlay:a.overlay,motion:a.cameraMotion?.state}})()`);
    const directionTravel = release.pointerupBasis
      ? Math.hypot(...before.direction.map((value, axis) => value - release.pointerupBasis.direction[axis])) : 0;
    const restDrift = release.finalBasis ? Math.max(...['direction','right','up'].flatMap((name) =>
      release.finalBasis[name].map((value, axis) => Math.abs(value - afterRest.basis[name][axis])))) : Infinity;
    report = { before, immediate, release, afterRest, afterWheel, afterPinch, afterTap, directionTravel, restDrift,
      valid: before.target === 'surface-globe-gesture' && before.hasProxy && before.rect.height >= 44 && before.rect.width >= 44
        && completed && release.status === 'complete' && release.release?.surfaceOpen && release.release?.mode === 'inertia'
        && release.release.releaseSpeed > .08 && Math.abs(release.release.releaseSpeed - release.release.speed) <= 1e-12
        && Number.isFinite(release.release.velocityX) && Number.isFinite(release.release.velocityY)
        && release.cumulativeRadians > .1 && release.releaseDurationMs > 3000 && release.samples > 0 && release.samples <= 520
        && release.finalState?.mode === 'held' && release.finalState?.speed === 0 && release.finalState?.surfaceOpen
        && directionTravel > .08 && restDrift < 1e-12 && Math.abs(afterWheel - immediate.distance) > 1e-6 && Math.abs(afterPinch - afterWheel) > 1e-6
        && immediate.selected === before.selected && immediate.levels === before.levels && immediate.overlay === 'memory-node'
        && release.releaseContext?.selected === before.selected && release.releaseContext?.levels === before.levels
        && release.releaseContext?.overlay === 'memory-node' && release.releaseContext?.activeElement === before.activeElement
        && release.finalContext?.selected === before.selected && release.finalContext?.levels === before.levels
        && release.finalContext?.overlay === 'memory-node' && release.finalContext?.activeElement === before.activeElement
        && afterRest.selected === before.selected && afterRest.levels === before.levels && afterRest.overlay === 'memory-node'
        && afterRest.activeElement === before.activeElement && afterRest.motion.mode === 'held' && afterRest.motion.speed === 0
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
