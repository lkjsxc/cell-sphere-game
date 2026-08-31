/** Node-side capture and context-fallback helpers for Evolution region evidence. */
export async function captureMatchedEvolutionScenes(tools, label, simulationPath, rendererPath, normalDistance) {
  const { evaluate, screenshot, setViewport, wait } = tools; await setViewport(1440, 900); await wait(80);
  // Fixed directions keep predecessor/final images comparable without deriving
  // a view from either layout.
  const orientations = {
    first: normalize([0.34, 0.22, 0.91]),
    second: normalize([-0.82, 0.35, -0.45]),
  };
  const distance = Math.max(2.7, Number(normalDistance) || 3.1); const close = Math.max(1.9, distance - .65);
  const captures = {};
  for (const [name, scene, direction, sceneDistance] of [
    ['worldOrientationAFar', 'home', orientations.first, distance],
    ['evolutionOrientationAFar', 'evolution', orientations.first, distance],
    ['worldOrientationBFar', 'home', orientations.second, distance],
    ['evolutionOrientationBFar', 'evolution', orientations.second, distance],
    ['trophyOrientationAFar', 'trophies', orientations.first, distance],
    ['evolutionOrientationAClose', 'evolution', orientations.first, close],
  ]) {
    const receipt = await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{focusCamera}=await import('./src/rendering/camera.js');
      a.selectScene(${JSON.stringify(scene)});focusCamera(a.camera,${JSON.stringify(direction)});a.camera.dist=${sceneDistance};a.camera.offsetX=0;a.camera.offsetY=0;
      const snapshot=${JSON.stringify(scene)}==='home'?a.showcase.snapshot:${JSON.stringify(scene)}==='evolution'?a.memorySnapshot:a.trophySnapshot;
      const expectedFields=${JSON.stringify(scene)}==='home'?a.worldFields:${JSON.stringify(scene)}==='evolution'?a.evolutionFields:a.trophyFields;
      a.renderer.render({snapshot,worldIdentity:null,camera:a.camera,
        selectedNode:null,highlightedCells:[],time:0,pulse:false});return{scene:a.scene,status:snapshot.status??null,backend:a.renderer.backend,
        distance:a.camera.dist,direction:a.camera.direction.slice(),fields:a.fields===expectedFields}})()`);
    await wait(60); const file = `evolution-ability-regions-${label}-${simulationPath}-${rendererPath}-${hyphenate(name)}.png`;
    captures[name] = { ...receipt, ...await screenshot(file) };
  }
  return { orientations, normalDistance:distance, closeDistance:close, captures };
}

export async function verifyEvolutionContextLoss(tools, expectedDigest, expectedLayoutDigest) {
  const { evaluate, poll } = tools;
  const requested = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,ext=a.renderer?.gl?.getExtension('WEBGL_lose_context');
    if(!ext)return false;ext.loseContext();return true})()`);
  const activated = requested && await poll(() => evaluate('window.__CELL_SPHERE_APP__.renderer?.backend'),
    (backend) => backend === 'canvas2d', 3000, 50);
  if (!activated) return { applicable:true, requested, activated:false, retained:false };
  const result = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,f=a.evolutionFields;let hash=2166136261;
    for(const key of ['landMask','biomeId','altitude','baseMoisture','baseTemp','baseNutrient','forestDensity','lakeId','lakeDepth','lakeShore','ridgeStrength']){
      const value=f[key],bytes=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);for(const byte of bytes){hash^=byte;hash=Math.imul(hash,16777619);}}
    return{backend:a.renderer.backend,sameSceneFields:a.fields===f,rendererFields:a.renderer.fields===f,
      stableReference:window.__CSG_EVOLUTION_CELL_FIXTURE__.fields===f,digest:(hash>>>0).toString(16).padStart(8,'0'),
      layoutDigest:a.evolutionLayout?.diagnostics?.digest??null,
      layoutReference:window.__CSG_EVOLUTION_CELL_FIXTURE__.layout===a.evolutionLayout}})()`);
  return { applicable:true, requested, activated, ...result, retained:result.backend === 'canvas2d' && result.sameSceneFields
    && result.rendererFields && result.stableReference && result.digest === expectedDigest
    && result.layoutReference && result.layoutDigest === expectedLayoutDigest };
}

function normalize(value) { const length = Math.hypot(...value); return value.map((axis) => axis / length); }
function hyphenate(value) { return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`); }
