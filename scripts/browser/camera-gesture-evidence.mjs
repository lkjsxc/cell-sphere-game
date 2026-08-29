/** Bounded trusted-gesture geometry and paused-authority receipts for camera evidence. */
export async function sphereGeometry(evaluate) {
  return evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,rect=a.canvas.getBoundingClientRect(),
    {projectedSphereDiameter}=await import('./src/interface/policies/layout-policy.js'),
    diameter=projectedSphereDiameter(a.camera.dist,rect.height);return{
      viewport:[innerWidth,innerHeight],projectedDiameterCssPx:diameter,radius:diameter/2,
      center:{x:rect.left+rect.width*(1+a.camera.offsetX)/2,y:rect.top+rect.height*(1-a.camera.offsetY)/2}}})()`);
}

export async function normalizedFlick(t, pointerType, horizontalRadii, verticalRadii, options = {}) {
  const geometry = await sphereGeometry(t.evaluate); const dx = horizontalRadii * geometry.radius;
  const dy = verticalRadii * geometry.radius;
  const from = [geometry.center.x - dx / 2, geometry.center.y - dy / 2];
  const to = [geometry.center.x + dx / 2, geometry.center.y + dy / 2];
  if (pointerType === 'touch') await t.touchFlick(from, to, options); else await t.flick(from, to, options);
  return { pointerType, viewport: geometry.viewport, projectedDiameterCssPx: geometry.projectedDiameterCssPx,
    gestureRadiusCssPx: geometry.radius, from, to, pointerTravelCssPx: Math.hypot(dx, dy),
    pointerTravelRadii: Math.hypot(horizontalRadii, verticalRadii), steps: options.steps ?? 5,
    intervalMs: options.intervalMs ?? 16 };
}

export async function authorityFingerprint(evaluate) {
  return evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,s=a.snapshot,
    text=JSON.stringify(s,(_key,value)=>ArrayBuffer.isView(value)?Array.from(value):value);let hash=2166136261;
    for(let index=0;index<text.length;index++){hash^=text.charCodeAt(index);hash=Math.imul(hash,16777619)}
    return{tick:s?.tick??null,status:s?.status??null,score:s?.metrics?.score??null,bytes:text.length,
      hash:(hash>>>0).toString(16).padStart(8,'0'),worldIdentity:a.worldIdentity}})()`);
}
