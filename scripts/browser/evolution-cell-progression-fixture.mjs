/** Focused production-browser evidence for exact-cell Evolution authority. */
import { captureMatchedEvolutionScenes,
  verifyEvolutionContextLoss } from './evolution-region-browser-support.mjs';
import { measureDetailShellGesture } from './detail-shell-gesture-fixture.mjs';
import { evolutionOwnershipBoundaryExpression } from './evolution-ownership-browser-support.mjs';

export async function runEvolutionCellProgressionFixture(tools, { label = 'final', enforce = true } = {}) {
  const { click, drag, evaluate, flick, key, pinch, poll, screenshot, setMedia, setViewport, tap, touchCancel, wait, wheel } = tools;
  const originalViewport = await evaluate('({width:innerWidth,height:innerHeight})');
  await setViewport(1440, 900); await wait(100);
  const detailViewport = await evaluate('({width:innerWidth,height:innerHeight})');
  const entryPoint = await evaluate(`(()=>{const e=document.getElementById('scene-evolution'),r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`);
  await click(...entryPoint); await wait(150);
  const prepared = await evaluate(PREPARE_EXPRESSION); const target = prepared.targetPoint;
  if (enforce) ok(prepared.topology.cells === 2562 && prepared.topology.edges === 7680
    && prepared.topology.layoutDigest && prepared.topology.rootCount === 1
    && prepared.rootEntry.valid, `Evolution topology preparation failed: ${JSON.stringify(prepared)}`);

  await click(...target); await wait(120);
  const selected = await evaluate(SELECTION_EXPRESSION);
  if (enforce) ok(selected.exactCell && selected.selectedCells === 1 && selected.levelEntriesUnchanged
    && selected.treeItems === 0 && selected.navigatorButtons <= 12 && selected.neighborButtons >= 5 && selected.neighborButtons <= 6,
  `Evolution exact-cell selection failed: ${JSON.stringify(selected)}`);

  const shellGesture = await measureDetailShellGesture({ evaluate, flick, pinch, poll, setViewport, tap, wait, wheel }, detailViewport);
  if (enforce) ok(shellGesture.valid, `Evolution detail-shell globe gesture failed: ${JSON.stringify(shellGesture)}`);

  const interactionPoint = prepared.canvasPoint;
  await drag([interactionPoint[0] - 55, interactionPoint[1]], [interactionPoint[0] + 65, interactionPoint[1] + 12]);
  await wheel(...interactionPoint); await pinch(interactionPoint); await touchCancel(interactionPoint); await wait(120);
  const manipulation = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,f=window.__CSG_EVOLUTION_CELL_FIXTURE__;
    return{unchanged:JSON.stringify(a.meta.evolutionLevels)===f.levelsBefore,overlay:a.overlay,selected:a.memoryUi.selectedCell}})()`);
  if (enforce) ok(manipulation.unchanged && manipulation.overlay === 'memory-node' && manipulation.selected === prepared.targetCell,
    `Evolution manipulation purchased or lost selection: ${JSON.stringify(manipulation)}`);

  const actionPoint = await evaluate(`(()=>{const r=document.getElementById('memory-unlock').getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`);
  await click(...actionPoint); await wait(160);
  const report = await evaluate(POST_EXPRESSION(tools.simulationFallback));
  report.visual = await evaluate(evolutionOwnershipBoundaryExpression());
  report.visual.hierarchy = report.hierarchy; delete report.hierarchy;
  report.interaction = { selected, shellGesture, manipulation, purchase: report.purchase };
  report.screenshots = { selected: await screenshot(`evolution-ownership-boundary-${label}-${report.simulationPath}-${report.rendererPath}-selected-1440x900.png`) };

  const nextButton = await evaluate(`(()=>{const e=document.getElementById('evolution-next'),r=e.getBoundingClientRect();e.focus();return[r.left+r.width/2,r.top+r.height/2]})()`);
  const beforeKeyboard = await evaluate('window.__CELL_SPHERE_APP__.memoryUi.selectedCell'); await key('Enter'); await wait(80);
  const afterKeyboard = await evaluate('window.__CELL_SPHERE_APP__.memoryUi.selectedCell');
  report.keyboard = { before: beforeKeyboard, after: afterKeyboard, expected: (beforeKeyboard + 1) % 2562,
    nativeButtonPoint: nextButton, valid: afterKeyboard === (beforeKeyboard + 1) % 2562 };
  if (enforce) ok(report.keyboard.valid, `Evolution native traversal failed: ${JSON.stringify(report.keyboard)}`);

  const responsive = []; await evaluate(`document.documentElement.style.fontSize='200%'`);
  for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390],[1024,600],[1440,900]]) {
    await setViewport(width, height); await wait(100);
    const value = await evaluate(`(()=>{const rect=(node)=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},
      canvas=document.getElementById('gl-canvas'),panel=document.getElementById('memory-node-panel'),action=document.getElementById('memory-unlock'),
      body=panel.querySelector('.surface-body'),tabs=[...document.querySelectorAll('#scene-selector [role=tab]')],buttons=[...panel.querySelectorAll('button')].filter(e=>e.getClientRects().length);
      body.scrollTop=body.scrollHeight;action.scrollIntoView({block:'nearest'});const c=rect(canvas),p=rect(panel),a=rect(action);
      return{viewport:{width:innerWidth,height:innerHeight},canvas:c,panel:p,action:a,treeItems:document.querySelectorAll('#evolution-tree').length,
        navigatorButtons:document.querySelectorAll('#evolution-navigator button').length,neighborButtons:document.querySelectorAll('#evolution-neighbors button').length,
        noHorizontalScroll:document.documentElement.scrollWidth<=innerWidth&&document.body.scrollWidth<=innerWidth,
        panelHorizontalScroll:panel.scrollWidth>panel.clientWidth,panelScrollTop:panel.scrollTop,bodyScrollTop:body.scrollTop,
        panelOverflowY:getComputedStyle(panel).overflowY,bodyOverflowY:getComputedStyle(body).overflowY,
        actionReachable:a.width>=44&&a.height>=44&&a.left>=p.left-1&&a.right<=p.right+1&&a.top>=p.top-1&&a.bottom<=Math.min(innerHeight,p.bottom)+1,
        canvasReachable:c.width>0&&c.height>0&&c.right>0&&c.bottom>0,minimumButton:Math.min(...buttons.map(button=>button.getBoundingClientRect().height)),
        minimumTab:Math.min(...tabs.map(tab=>tab.getBoundingClientRect().height))}})()`);
    responsive.push(value);
    if (enforce) ok(value.treeItems === 0 && value.navigatorButtons <= 9 && value.neighborButtons <= 6
      && value.noHorizontalScroll && !value.panelHorizontalScroll && value.actionReachable && value.canvasReachable
      && value.minimumButton >= 44 && value.minimumTab >= 44,
    `Evolution responsive failure ${width}x${height}: ${JSON.stringify(value)}`);
  }
  report.responsive = responsive; await evaluate(`document.documentElement.style.fontSize=''`);
  await setViewport(390, 844); await wait(80); await setMedia([{ name: 'forced-colors', value: 'active' }]); await wait(80);
  report.forcedColors = await evaluate(`(()=>{const action=document.getElementById('memory-unlock'),neighbor=document.querySelector('#evolution-neighbors button');
    return{active:matchMedia('(forced-colors: active)').matches,actionBorder:getComputedStyle(action).borderTopStyle,
      neighborBorder:neighbor?getComputedStyle(neighbor).borderTopStyle:null,current:document.getElementById('evolution-current').textContent,
      treeItems:document.querySelectorAll('#evolution-tree').length}})()`);
  if (enforce) ok(report.forcedColors.active && report.forcedColors.actionBorder !== 'none'
    && report.forcedColors.neighborBorder !== 'none' && report.forcedColors.current.includes('Local Level') && report.forcedColors.treeItems === 0,
  `Evolution forced colors failed: ${JSON.stringify(report.forcedColors)}`);
  await setMedia([]); await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'})})()`); await wait(80);
  const reducedA = await screenshot(`evolution-ownership-boundary-${label}-${report.simulationPath}-${report.rendererPath}-reduced-a.png`); await wait(320);
  const reducedB = await screenshot(`evolution-ownership-boundary-${label}-${report.simulationPath}-${report.rendererPath}-reduced-b.png`);
  report.reducedMotion = { stable: reducedA.hash === reducedB.hash, first: reducedA, second: reducedB };
  if (enforce) ok(report.reducedMotion.stable, 'Evolution reduced-motion rendering changed without state change');

  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'})})()`);
  report.screenshots.matched = await captureMatchedEvolutionScenes({ evaluate, screenshot, setViewport, wait }, label, report.simulationPath,
    report.rendererPath, prepared.normalDistance);
  report.contextLoss = report.rendererPath === 'webgl2'
    ? await verifyEvolutionContextLoss({ evaluate, poll }, report.substrate.digest, report.semantic.layoutDigest)
    : { applicable:false, retained:true, backend:'canvas2d' };
  await evaluate(`window.__CSG_EVOLUTION_CELL_FIXTURE__?.restore()`);
  await setViewport(originalViewport.width, originalViewport.height); await wait(80);
  if (enforce) {
    ok(report.semantic.valid, `Evolution semantic projection failed: ${JSON.stringify(report.semantic)}`);
    ok(report.rootEntry.valid, `Evolution green-root entry failed: ${JSON.stringify(report.rootEntry)}`);
    ok(report.purchase.valid, `Evolution exact-cell purchase failed: ${JSON.stringify(report.purchase)}`);
    ok(report.performance.staticLayoutStable && report.performance.staticGeometryStable
      && report.performance.steadyEdgeUpdates === 0, `Evolution boundedness failed: ${JSON.stringify(report.performance)}`);
    ok(report.rendererPath !== 'webgl2' || report.packing.drawCalls === 4,
      `Evolution WebGL draw count changed: ${JSON.stringify(report.packing)}`);
    if (report.visual.available) ok(report.visual.valid, `Evolution edge hierarchy failed: ${JSON.stringify(report.visual)}`);
    ok(report.substrate.valid, `Evolution substrate semantics failed: ${JSON.stringify(report.substrate)}`);
    ok(report.visual.hierarchy.valid, `Evolution substrate/domain hierarchy failed: ${JSON.stringify(report.visual.hierarchy)}`);
    ok(report.contextLoss.retained, `Evolution context fallback lost substrate: ${JSON.stringify(report.contextLoss)}`);
  }
  ok(tools.errors.length === 0, `Evolution browser errors: ${tools.errors.join(' | ')}`); return report;
}

const PREPARE_EXPRESSION = `(async()=>{
  const app=window.__CELL_SPHERE_APP__,original={meta:app.meta,archive:app.archive,selectedNode:app.selectedNode,
    historySnapshot:app.historySnapshot,historyPlaybackActive:app.historyPlaybackActive,
    camera:{...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()}};
  const [{defaultMeta,validateMeta},{defaultHistory},{EVOLUTION_LAYOUT,EVOLUTION_TOPOLOGY,buildEvolutionProjection,buildEvolutionSnapshot},{viewProjection,focusCamera}]=await Promise.all([
    import('./src/platform/storage.js'),import('./src/platform/history.js'),import('./src/game/skills/index.js'),import('./src/rendering/camera.js')]);
  app.meta=validateMeta({...defaultMeta(),echoBalance:'1000',totalEchoes:'1000'});app.archive=defaultHistory();
  app.selectScene('home');app.selectScene('evolution');
  const root=EVOLUTION_LAYOUT.rootCell,rootAt=root*3,rootPosition=EVOLUTION_TOPOLOGY.positions.subarray(rootAt,rootAt+3),
    freshProjection=app.memorySnapshot.evolutionProjection,freshMatrix=viewProjection(app.camera,app.renderer.canvas.width/app.renderer.canvas.height),
    rootX=rootPosition[0],rootY=rootPosition[1],rootZ=rootPosition[2],
    rootClipX=freshMatrix[0]*rootX+freshMatrix[4]*rootY+freshMatrix[8]*rootZ+freshMatrix[12],
    rootClipY=freshMatrix[1]*rootX+freshMatrix[5]*rootY+freshMatrix[9]*rootZ+freshMatrix[13],
    rootW=freshMatrix[3]*rootX+freshMatrix[7]*rootY+freshMatrix[11]*rootZ+freshMatrix[15],
    rootCanvasPoint=[(rootClipX/rootW*.5+.5)*app.renderer.canvas.width,(1-(rootClipY/rootW*.5+.5))*app.renderer.canvas.height],
    rootRect=app.renderer.canvas.getBoundingClientRect(),rootCssPoint=[rootRect.left+rootCanvasPoint[0]/app.renderer.canvas.width*rootRect.width,
      rootRect.top+rootCanvasPoint[1]/app.renderer.canvas.height*rootRect.height];
  app.renderer.render({snapshot:app.memorySnapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
  const rootPixel=(()=>{const size=5,left=Math.max(0,Math.min(app.renderer.canvas.width-size,Math.round(rootCanvasPoint[0])-2)),
    top=Math.max(0,Math.min(app.renderer.canvas.height-size,Math.round(rootCanvasPoint[1])-2));let data;
    if(app.renderer.backend==='webgl2'){data=new Uint8Array(size*size*4);app.renderer.gl.readPixels(left,app.renderer.canvas.height-top-size,size,size,
      app.renderer.gl.RGBA,app.renderer.gl.UNSIGNED_BYTE,data);}else data=app.renderer.ctx.getImageData(left,top,size,size).data;
    const color=[0,0,0];for(let at=0;at<data.length;at+=4){color[0]+=data[at];color[1]+=data[at+1];color[2]+=data[at+2];}
    return color.map(value=>value/(data.length/4));})();
  app.selectEvolutionCell(root,'navigator');
  const rootText={heading:document.getElementById('memory-node-heading').textContent,current:document.getElementById('evolution-current').textContent,
    description:document.getElementById('memory-node-description')?.textContent??''};
  app.closeActiveOverlay();
  const rootFields=EVOLUTION_LAYOUT.diagnostics.root,rootAlignment=app.camera.direction[0]*rootX+app.camera.direction[1]*rootY+app.camera.direction[2]*rootZ,
    rootEntry={cell:root,fields:rootFields,readyCells:Array.from(freshProjection.readyCells),focus:app.memorySnapshot.focus,
      cameraAlignment:rootAlignment,screenPoint:rootCssPoint,pixel:rootPixel,text:rootText,
      greenPixel:rootPixel[1]>rootPixel[0]&&rootPixel[1]>rootPixel[2],
      valid:root===2265&&rootFields.land&&rootFields.greenBiome&&rootFields.greenNeighbors===rootFields.degree
        &&freshProjection.readyCells.length===1&&freshProjection.readyCells[0]===root&&rootAlignment>.999
        &&rootCssPoint[0]>=rootRect.left&&rootCssPoint[0]<=rootRect.right&&rootCssPoint[1]>=rootRect.top&&rootCssPoint[1]<=rootRect.bottom
        &&rootPixel[1]>rootPixel[0]&&rootPixel[1]>rootPixel[2]
        &&rootText.heading.includes('First Division')&&rootText.current.includes('Local Level')};
  const targetCell=EVOLUTION_LAYOUT.rootRing[0],fixtureMeta=validateMeta({...app.meta,echoBalance:'1000000000',totalEchoes:'1000000000',
    evolutionLevels:[{cell:EVOLUTION_LAYOUT.rootCell,level:'1'}],imprints:[{kind:'strongest-corridor',seed:7,
      cells:Array.from({length:16},(_,cell)=>cell),topology:{kind:'icosphere',level:4,nodeCount:2562,edgeCount:7680}}]});
  app.closeActiveOverlay();app.meta=fixtureMeta;app.selectedNode=null;app.memorySnapshot=buildEvolutionSnapshot(app.meta);
  focusCamera(app.camera,EVOLUTION_TOPOLOGY.positions.subarray(targetCell*3,targetCell*3+3));app.lastRender=-Infinity;
  app.renderer.render({snapshot:app.memorySnapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
  const rect=app.renderer.canvas.getBoundingClientRect(),matrix=viewProjection(app.camera,app.renderer.canvas.width/app.renderer.canvas.height),at=targetCell*3,
    x=EVOLUTION_TOPOLOGY.positions[at],y=EVOLUTION_TOPOLOGY.positions[at+1],z=EVOLUTION_TOPOLOGY.positions[at+2],
    clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],
    w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15],targetPoint=[rect.left+(clipX/w*.5+.5)*rect.width,rect.top+(1-(clipY/w*.5+.5))*rect.height];
  const beforeProjection=buildEvolutionProjection(app.meta),beforeSnapshot=buildEvolutionSnapshot(app.meta),levelsBefore=JSON.stringify(app.meta.evolutionLevels);
  window.__CSG_EVOLUTION_CELL_FIXTURE__={original,targetCell,beforeProjection,beforeSnapshot,levelsBefore,layout:EVOLUTION_LAYOUT,rootEntry,
    fields:app.evolutionFields,normalDistance:app.camera.dist,
    restore(){app.closeActiveOverlay();app.meta=original.meta;app.archive=original.archive;app.selectedNode=original.selectedNode;
      app.historySnapshot=original.historySnapshot;app.historyPlaybackActive=original.historyPlaybackActive;Object.assign(app.camera,original.camera);
      app.memorySnapshot=buildEvolutionSnapshot(app.meta);app.memoryUi.closeNode();delete window.__CSG_EVOLUTION_CELL_FIXTURE__;}};
  return{targetCell,targetPoint,rootEntry,normalDistance:app.camera.dist,canvasPoint:[rect.left+rect.width*.72,rect.top+rect.height*.45],topology:{cells:EVOLUTION_TOPOLOGY.nodeCount,
    edges:EVOLUTION_TOPOLOGY.edgeCount,layoutDigest:EVOLUTION_LAYOUT.diagnostics.digest,rootCount:EVOLUTION_LAYOUT.diagnostics.rootCount}};
})()`;

const SELECTION_EXPRESSION = `(()=>{const app=window.__CELL_SPHERE_APP__,f=window.__CSG_EVOLUTION_CELL_FIXTURE__,p=app.memorySnapshot.evolutionProjection;
  const selectedCells=[...app.memorySnapshot.evolutionStatus].flatMap((status,cell)=>[5,6,7,9,10].includes(status)?[cell]:[]);
  return{exactCell:app.memoryUi.selectedCell===f.targetCell&&app.selectedNode===f.targetCell,selectedCells:selectedCells.length,
    selectedCell:selectedCells[0]??null,levelEntriesUnchanged:JSON.stringify(app.meta.evolutionLevels)===f.levelsBefore,
    heading:document.getElementById('memory-node-heading').textContent,current:document.getElementById('evolution-current').textContent,
    treeItems:document.querySelectorAll('#evolution-tree').length,navigatorButtons:document.querySelectorAll('#evolution-navigator button').length,
    neighborButtons:document.querySelectorAll('#evolution-neighbors button').length,ready:p.reachable[f.targetCell]===1&&p.affordable[f.targetCell]===1}})()`;

function POST_EXPRESSION(simulationFallback) { return `(async()=>{
  const app=window.__CELL_SPHERE_APP__,f=window.__CSG_EVOLUTION_CELL_FIXTURE__,renderer=app.renderer;
  const [{EVOLUTION_ARCHETYPES,EVOLUTION_CELL_EDGE,EVOLUTION_LAYOUT,EVOLUTION_REGION_EDGE,EVOLUTION_TOPOLOGY,buildEvolutionProjection,buildEvolutionSnapshot,
    createEvolutionFields,evolutionCellEdgeStatus,evolutionCellState,evolutionRegionEdge,getEvolutionAdjacentCells},{viewProjection,focusCamera}]=await Promise.all([
      import('./src/game/skills/index.js'),import('./src/rendering/camera.js')]);
  const afterProjection=app.memorySnapshot.evolutionProjection,target=f.targetCell,before=f.beforeProjection;
  const changedEntries=app.meta.evolutionLevels.filter(entry=>!JSON.parse(f.levelsBefore).some(old=>old.cell===entry.cell&&old.level===entry.level));
  const newly=[];for(let cell=0;cell<EVOLUTION_TOPOLOGY.nodeCount;cell++)if(!before.reachable[cell]&&afterProjection.reachable[cell]&&!afterProjection.owned[cell])newly.push(cell);
  const expectedNew=getEvolutionAdjacentCells(target).filter(cell=>!before.reachable[cell]&&!before.owned[cell]).sort((a,b)=>a-b);
  const changedStatus=[];for(let cell=0;cell<EVOLUTION_TOPOLOGY.nodeCount;cell++)if(f.beforeSnapshot.evolutionStatus[cell]!==app.memorySnapshot.evolutionStatus[cell])changedStatus.push(cell);
  const affected=new Set([target,...getEvolutionAdjacentCells(target)]),changedEdges=[];
  for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++)if(f.beforeSnapshot.evolutionEdge[edge]!==app.memorySnapshot.evolutionEdge[edge])changedEdges.push(edge);
  const history=app.archive.evolution.at(-1),state=evolutionCellState(afterProjection,target);
  const purchase={target,changedEntries,newly,expectedNew,changedStatus,changedEdges:changedEdges.length,
    incidentOnly:changedEdges.every(edge=>affected.has(EVOLUTION_TOPOLOGY.edgeA[edge])||affected.has(EVOLUTION_TOPOLOGY.edgeB[edge])),
    localLevel:state.localLevel,aggregateRank:state.aggregateRank,historyCell:history?.cell,historyArchetype:history?.archetypeId,
    valid:changedEntries.length===1&&changedEntries[0].cell===target&&changedEntries[0].level==='1'
      &&state.localLevel==='1'&&state.aggregateRank==='1'&&JSON.stringify(newly.sort((a,b)=>a-b))===JSON.stringify(expectedNew)
      &&changedStatus.every(cell=>affected.has(cell))&&history?.cell===target&&history?.archetypeId===state.archetypeId};
  const selectedCells=[...app.memorySnapshot.evolutionStatus].filter(status=>[5,6,7,9,10].includes(status)).length;
  const edgeStructure={internal:0,archetype:0,domain:0};for(const edge of EVOLUTION_LAYOUT.edgeStructure){
    if(edge===EVOLUTION_REGION_EDGE.INTERNAL)edgeStructure.internal++;else if(edge===EVOLUTION_REGION_EDGE.ARCHETYPE)edgeStructure.archetype++;else if(edge===EVOLUTION_REGION_EDGE.DOMAIN)edgeStructure.domain++;}
  const packedRegionMatches=app.memorySnapshot.evolutionEdge.every((code,edge)=>evolutionRegionEdge(code)===EVOLUTION_LAYOUT.edgeStructure[edge]);
  const tierMedians=EVOLUTION_LAYOUT.diagnostics.tierMedianRootDistance.slice(1,6),components=Array.from(EVOLUTION_LAYOUT.diagnostics.componentCount),
    domainComponents=Array.from(EVOLUTION_LAYOUT.diagnostics.domainComponentCount);
  const semantic={presentationCells:EVOLUTION_TOPOLOGY.nodeCount,presentationEdges:EVOLUTION_TOPOLOGY.edgeCount,
    progressionCells:afterProjection.levelByCell.length,archetypes:EVOLUTION_ARCHETYPES.length,selectedCells,
    treeItems:document.querySelectorAll('#evolution-tree').length,navigatorButtons:document.querySelectorAll('#evolution-navigator button').length,
    neighborButtons:document.querySelectorAll('#evolution-neighbors button').length,layoutDigest:EVOLUTION_LAYOUT.diagnostics.digest,
    edgeDigest:EVOLUTION_LAYOUT.diagnostics.edgeDigest,rootCell:EVOLUTION_LAYOUT.rootCell,components,domainComponents,tierMedians,edgeStructure,packedRegionMatches,
    valid:EVOLUTION_TOPOLOGY.nodeCount===2562&&EVOLUTION_TOPOLOGY.edgeCount===7680&&afterProjection.levelByCell.length===2562
      &&EVOLUTION_ARCHETYPES.length===42&&selectedCells===1&&document.querySelectorAll('#evolution-tree').length===0
      &&document.querySelectorAll('#evolution-navigator button').length<=9&&components.every(value=>value===1)
      &&domainComponents.every(value=>value===1)&&tierMedians.every((value,index)=>index===0||value>tierMedians[index-1])
      &&edgeStructure.archetype>0&&edgeStructure.domain>0&&packedRegionMatches};
  const entrySamples=[];for(let sample=0;sample<6;sample++){app.selectScene('home');const at=performance.now();app.selectScene('evolution');
    app.renderer.render({snapshot:app.memorySnapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});if(sample)entrySamples.push(performance.now()-at);}
  app.selectEvolutionCell(target,'navigator');const activeRenderer=app.renderer,layoutReference=app.evolutionLayout,
    geometry=activeRenderer.backend==='webgl2'?activeRenderer.world.geometry:activeRenderer.dual;
  const buildSamples=[],updateSamples=[],steadySamples=[];let snapshot=app.memorySnapshot;
  for(let sample=0;sample<12;sample++){const cell=(target+sample*137)%EVOLUTION_TOPOLOGY.nodeCount,buildAt=performance.now();
    snapshot=buildEvolutionSnapshot(app.meta,cell,sample%3===0?[cell]:[]);buildSamples.push(performance.now()-buildAt);
    await new Promise(resolve=>requestAnimationFrame(resolve));app.memorySnapshot=snapshot;const renderAt=performance.now();
    activeRenderer.render({snapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});updateSamples.push(performance.now()-renderAt);}
  const beforeSteady=edgeUpdates(activeRenderer);for(let sample=0;sample<30;sample++){await new Promise(resolve=>requestAnimationFrame(resolve));const renderAt=performance.now();
    activeRenderer.render({snapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:sample/60,pulse:false});steadySamples.push(performance.now()-renderAt);}
  const afterSteady=edgeUpdates(activeRenderer);app.memorySnapshot=buildEvolutionSnapshot(app.meta,target,[target]);app.memoryUi.openCell(target,app.memorySnapshot.evolutionProjection);
  activeRenderer.render({snapshot:app.memorySnapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
  const performanceReport={entry:summarize(entrySamples),snapshot:summarize(buildSamples),update:summarize(updateSamples),steady:summarize(steadySamples),
    staticLayoutStable:layoutReference===app.evolutionLayout,staticGeometryStable:geometry===(activeRenderer.backend==='webgl2'?activeRenderer.world.geometry:activeRenderer.dual),
    steadyEdgeUpdates:afterSteady-beforeSteady};
  const packing=activeRenderer.backend==='webgl2'?{drawCalls:activeRenderer.drawCalls,buffers:activeRenderer.world.buffers.length,
    staticGeometryBytes:typedBytes(activeRenderer.world.geometry),dynamicBytes:activeRenderer.world.lifeData.byteLength+activeRenderer.world.ecologyData.byteLength
      +activeRenderer.world.lifeEdgeData.byteLength+activeRenderer.world.boundaryLifeData.byteLength,
    compactEdgeBytes:activeRenderer.world.lifeEdgeData.byteLength,expandedEdgeBytes:activeRenderer.world.boundaryLifeData.byteLength}
    :{drawCalls:null,buffers:null,staticGeometryBytes:typedBytes(activeRenderer.dual),
      dynamicBytes:activeRenderer.lifeEdgeData.byteLength+activeRenderer.lifeEdgeBatches.reduce((sum,value)=>sum+value.byteLength,0),
      compactEdgeBytes:activeRenderer.lifeEdgeData.byteLength,expandedEdgeBytes:null};
  const substrate=substrateReport(app.evolutionFields);const repeatedSubstrate=substrateReport(createEvolutionFields(EVOLUTION_TOPOLOGY));
  substrate.repeatDigest=repeatedSubstrate.digest;substrate.stableReference=f.fields===app.evolutionFields;
  substrate.valid=substrate.landFraction>=.38&&substrate.landFraction<=.58&&substrate.largestLand>=substrate.landCells*.70
    &&substrate.largestWater>=substrate.waterCells*.70&&substrate.sameLandAdjacency>=.90&&substrate.biomes>=6
    &&substrate.landBiomes>=4&&substrate.oceanBiomes>=1&&substrate.sameBiomeAdjacency>=.65&&substrate.lakes>=1
    &&substrate.coastEdges>0&&substrate.lakeEdges>0&&substrate.digest===substrate.repeatDigest&&substrate.stableReference;
  const hierarchy=measureHierarchy(activeRenderer);return{schema:5,rendererPath:activeRenderer.backend,
    simulationPath:${JSON.stringify(simulationFallback ? 'fallback' : 'worker')},rootEntry:f.rootEntry,semantic,substrate,purchase,performance:performanceReport,packing,hierarchy};
  function measureHierarchy(targetRenderer){
    const locked=buildEvolutionSnapshot({...app.meta,evolutionLevels:[],echoBalance:'0'},null,[]),fields=app.evolutionFields;
    let coastEdge=-1;for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++){const a=EVOLUTION_TOPOLOGY.edgeA[edge],b=EVOLUTION_TOPOLOGY.edgeB[edge];
      if(fields.landMask[a]!==fields.landMask[b]&&locked.evolutionDomain[a]===locked.evolutionDomain[b]
        &&locked.evolutionStatus[a]===1&&locked.evolutionStatus[b]===1){coastEdge=edge;break;}}
    if(coastEdge<0)return{available:false,valid:false,reason:'no same-domain locked coast edge'};
    const coastCells=[EVOLUTION_TOPOLOGY.edgeA[coastEdge],EVOLUTION_TOPOLOGY.edgeB[coastEdge]],coastDirection=midpoint(coastCells);
    let domainEdge=-1,domainScore=-Infinity;for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++){const a=EVOLUTION_TOPOLOGY.edgeA[edge],b=EVOLUTION_TOPOLOGY.edgeB[edge];
      if(fields.landMask[a]!==fields.landMask[b]||fields.biomeId[a]!==fields.biomeId[b]
        ||locked.evolutionDomain[a]===locked.evolutionDomain[b]||locked.evolutionStatus[a]!==1||locked.evolutionStatus[b]!==1)continue;
      const score=dot(midpoint([a,b]),coastDirection);if(score>domainScore){domainScore=score;domainEdge=edge;}}
    if(domainEdge<0)return{available:false,valid:false,reason:'no same-biome locked cross-domain edge'};
    const domainCells=[EVOLUTION_TOPOLOGY.edgeA[domainEdge],EVOLUTION_TOPOLOGY.edgeB[domainEdge]],
      domainDirection=midpoint(domainCells),candidateLimit=targetRenderer.backend==='canvas2d'?12:1,
      archetypeEdges=findRegionEdges(EVOLUTION_REGION_EDGE.ARCHETYPE,domainDirection,candidateLimit),
      internalEdge=findRegionEdges(EVOLUTION_REGION_EDGE.INTERNAL,domainDirection,1)[0]??-1,
      domainEdges=[...new Set([domainEdge,...findRegionEdges(EVOLUTION_REGION_EDGE.DOMAIN,domainDirection,candidateLimit)])],
      domainCueCell=domainCells.find(cell=>locked.evolutionKind[cell]===2)??domainCells[0],far=Math.max(2.7,f.normalDistance),close=Math.max(1.9,far-.65);
    if(!archetypeEdges.length||internalEdge<0)return{available:false,valid:false,reason:'missing comparable immutable region edges'};
    const cases=[];for(const [name,distanceValue,limb] of [['far-center',far,false],['close-center',close,false],['far-limb',far,true],['close-limb',close,true]]){
      const substrateValue=pairProbe(coastCells,distanceValue,limb),domainValue=pairProbe(domainCells,distanceValue,limb),
        domainCueValue=domainProbe(domainCueCell,distanceValue,limb),internalBoundary=edgeProbe(internalEdge,distanceValue,limb),
        archetypeBoundary=bestEdgeProbe(archetypeEdges,distanceValue,limb),domainBoundary=bestEdgeProbe(domainEdges,distanceValue,limb),
        noise=Math.max(substrateValue.noise,domainValue.noise,domainCueValue.noise,internalBoundary.noise,archetypeBoundary.noise,domainBoundary.noise),
        margin=Math.max(.004,noise*4+.001),regionMargin=Math.max(.001,noise*4+.0005);
      cases.push({name,distance:distanceValue,limb,substrateSeparation:substrateValue.separation,
        domainVariation:domainValue.separation,domainCue:domainCueValue.separation,
        internalBoundary:internalBoundary.contrast,archetypeBoundary:archetypeBoundary.contrast,domainBoundary:domainBoundary.contrast,
        internalRegionSignal:internalBoundary.signal,archetypeRegionSignal:archetypeBoundary.signal,domainRegionSignal:domainBoundary.signal,
        regionEdges:{internal:internalEdge,archetype:archetypeBoundary.edge,domain:domainBoundary.edge},
        regionBatched:{internal:internalBoundary.batched,archetype:archetypeBoundary.batched,domain:domainBoundary.batched},noise,margin,regionMargin,
        valid:substrateValue.separation>domainValue.separation+margin&&domainCueValue.separation>noise+.001
          &&(targetRenderer.backend==='canvas2d'
            ?archetypeBoundary.batched&&domainBoundary.batched&&archetypeBoundary.contrast>internalBoundary.contrast+margin
              &&domainBoundary.contrast>internalBoundary.contrast+margin
            :archetypeBoundary.signal>internalBoundary.signal+regionMargin&&domainBoundary.signal>internalBoundary.signal+regionMargin
              &&domainBoundary.signal>archetypeBoundary.signal+regionMargin)});}
    return{available:true,coastEdge,coastCells,internalEdge,archetypeEdges,domainEdge,domainEdges,domainCells,domainCueCell,domainProximity:domainScore,cases,
      valid:cases.every(value=>value.valid)};
    function findRegionEdges(kind,direction,limit){const selected=[];for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++){
      const a=EVOLUTION_TOPOLOGY.edgeA[edge],b=EVOLUTION_TOPOLOGY.edgeB[edge];if(EVOLUTION_LAYOUT.edgeStructure[edge]!==kind
        ||fields.landMask[a]!==fields.landMask[b]||fields.biomeId[a]!==fields.biomeId[b]||fields.lakeId[a]!==fields.lakeId[b]
        ||locked.evolutionStatus[a]!==1||locked.evolutionStatus[b]!==1)continue;
      selected.push({edge,score:dot(midpoint([a,b]),direction)});}return selected.sort((a,b)=>b.score-a.score||a.edge-b.edge).slice(0,limit).map(value=>value.edge);}
    function bestEdgeProbe(edges,distanceValue,limb){let best=null;for(const edge of edges){const value=edgeProbe(edge,distanceValue,limb);
      const metric=targetRenderer.backend==='canvas2d'?value.contrast:value.signal;
      if(!best||metric>best.metric)best={...value,edge,metric};}return best;}
    function pairProbe(cells,distanceValue,limb){const camera={...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()},center=midpoint(cells);
      focusCamera(camera,limb?limbDirection(center):center);camera.dist=distanceValue;camera.offsetX=0;camera.offsetY=0;const samples=[];
      for(let repeat=0;repeat<3;repeat++){targetRenderer.render({snapshot:locked,worldIdentity:null,camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
        samples.push(cells.map(cell=>readPatch(projectCell(cell,camera),2)));}
      const separation=distance(samples[0][0],samples[0][1]);let noise=0;for(let repeat=1;repeat<samples.length;repeat++)for(let side=0;side<2;side++)noise=Math.max(noise,distance(samples[0][side],samples[repeat][side]));
      return{separation,noise,colors:samples[0]};}
    function domainProbe(cell,distanceValue,limb){const camera={...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()},center=midpoint([cell]);
      focusCamera(camera,limb?limbDirection(center):center);camera.dist=distanceValue;camera.offsetX=0;camera.offsetY=0;
      const domains=new Uint8Array(locked.evolutionDomain);domains[cell]=(domains[cell]+1)%7;
      const alternate={...locked,evolutionDomain:domains,tick:locked.tick+1},samples=[];
      for(let repeat=0;repeat<3;repeat++){const colors=[];for(const snapshotValue of [locked,alternate]){
        targetRenderer.render({snapshot:snapshotValue,worldIdentity:null,camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
        colors.push(readPatchBytes(projectCell(cell,camera),6));}samples.push(colors);}
      const separation=patchDistance(samples[0][0],samples[0][1]);let noise=0;for(let repeat=1;repeat<samples.length;repeat++)for(let side=0;side<2;side++)noise=Math.max(noise,patchDistance(samples[0][side],samples[repeat][side]));
      return{separation,noise};}
    function edgeProbe(edge,distanceValue,limb){const cells=[EVOLUTION_TOPOLOGY.edgeA[edge],EVOLUTION_TOPOLOGY.edgeB[edge]],center=midpoint(cells),
      camera={...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()};
      focusCamera(camera,limb?limbDirection(center):center);camera.dist=distanceValue;camera.offsetX=0;camera.offsetY=0;
      const dual=targetRenderer.backend==='webgl2'?targetRenderer.world.geometry.dual:targetRenderer.dual,
        a=projectPoint(dual.corners,dual.boundaryCornerA[edge],camera),b=projectPoint(dual.corners,dual.boundaryCornerB[edge],camera),
        dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,
        points=[],linePoints=[.25,.375,.5,.625,.75].map(along=>[a[0]+dx*along,a[1]+dy*along]);
      for(const along of [.3,.4,.5,.6,.7])for(const offset of [-5,-4,-1,0,1,4,5])points.push({point:[a[0]+dx*along+nx*offset,a[1]+dy*along+ny*offset],center:Math.abs(offset)<=1});
      const edgeData=new Uint8Array(locked.evolutionEdge);edgeData[edge]=evolutionCellEdgeStatus(edgeData[edge]);
      const suppressed={...locked,tick:locked.tick+100+edge,evolutionEdge:edgeData},actual=[];const alternate=[];
      let batched=true;
      for(let repeat=0;repeat<3;repeat++){for(const [snapshotValue,target] of [[locked,actual],[suppressed,alternate]]){
        targetRenderer.render({snapshot:snapshotValue,worldIdentity:null,camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
        if(repeat===0&&snapshotValue===locked&&targetRenderer.backend==='canvas2d')batched=targetRenderer.lifeEdgeBatches.some((batch,style)=>
          style>0&&Array.from(batch.subarray(0,targetRenderer.lifeEdgeBatchCounts[style])).includes(edge));
        target.push({colors:points.map(value=>readPatch(value.point,0)),patches:linePoints.map(point=>readPatchBytes(point,3))});}}
      const side=mean(actual[0].colors.filter((_,index)=>!points[index].center)),centerColors=actual[0].colors.filter((_,index)=>points[index].center),
        contrast=Math.max(...centerColors.map(color=>distance(color,side))),
        signal=Math.max(...actual[0].patches.map((value,index)=>patchDistance(value,alternate[0].patches[index])));let noise=0;
      for(let repeat=1;repeat<actual.length;repeat++)for(let index=0;index<actual[0].patches.length;index++)noise=Math.max(noise,patchDistance(actual[0].patches[index],actual[repeat].patches[index]));
      return{contrast,signal,noise,batched};}
    function projectCell(cell,camera){if(targetRenderer.backend==='canvas2d')return[targetRenderer.px[cell],targetRenderer.py[cell]];
      const matrix=viewProjection(camera,targetRenderer.canvas.width/targetRenderer.canvas.height),at=cell*3,x=EVOLUTION_TOPOLOGY.positions[at],y=EVOLUTION_TOPOLOGY.positions[at+1],z=EVOLUTION_TOPOLOGY.positions[at+2],
        clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
      return[(clipX/w*.5+.5)*targetRenderer.canvas.width,(1-(clipY/w*.5+.5))*targetRenderer.canvas.height];}
    function projectPoint(points,index,camera){if(targetRenderer.backend==='canvas2d')return[targetRenderer.cornerX[index],targetRenderer.cornerY[index]];
      const matrix=viewProjection(camera,targetRenderer.canvas.width/targetRenderer.canvas.height),at=index*3,x=points[at],y=points[at+1],z=points[at+2],
        clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
      return[(clipX/w*.5+.5)*targetRenderer.canvas.width,(1-(clipY/w*.5+.5))*targetRenderer.canvas.height];}
    function readPatch(point,radius){const data=readPatchBytes(point,radius),color=[0,0,0];
      for(let at=0;at<data.length;at+=4){color[0]+=data[at];color[1]+=data[at+1];color[2]+=data[at+2];}
      return color.map(value=>value/(data.length/4));}
    function readPatchBytes(point,radius){const size=radius*2+1,left=Math.max(0,Math.min(targetRenderer.canvas.width-size,Math.round(point[0])-radius)),
        top=Math.max(0,Math.min(targetRenderer.canvas.height-size,Math.round(point[1])-radius));let data;
      if(targetRenderer.backend==='webgl2'){data=new Uint8Array(size*size*4);targetRenderer.gl.readPixels(left,targetRenderer.canvas.height-top-size,size,size,
        targetRenderer.gl.RGBA,targetRenderer.gl.UNSIGNED_BYTE,data);}else data=targetRenderer.ctx.getImageData(left,top,size,size).data;
      return data;}
    function patchDistance(a,b){let result=0;for(let at=0;at<a.length;at+=4)result=Math.max(result,
      Math.hypot(a[at]-b[at],a[at+1]-b[at+1],a[at+2]-b[at+2])/(255*Math.sqrt(3)));return result;}
    function limbDirection(center){const reference=Math.abs(center[1])<.9?[0,1,0]:[1,0,0],tangent=normalize(cross(reference,center));return normalize(center.map((value,index)=>value+tangent[index]*2));}
    function midpoint(cells){const out=[0,0,0];for(const cell of cells)for(let axis=0;axis<3;axis++)out[axis]+=EVOLUTION_TOPOLOGY.positions[cell*3+axis];return normalize(out);}
    function normalize(value){const length=Math.hypot(...value)||1;return value.map(axis=>axis/length);}
    function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
    function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
    function mean(values){return[0,1,2].map(axis=>values.reduce((sum,value)=>sum+value[axis],0)/values.length);}
    function distance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/(255*Math.sqrt(3));}}
  function substrateReport(fields){const landCells=fields.landMask.reduce((sum,value)=>sum+value,0),waterCells=EVOLUTION_TOPOLOGY.nodeCount-landCells,
      seen=new Uint8Array(EVOLUTION_TOPOLOGY.nodeCount),largest=[0,0];
    for(let root=0;root<EVOLUTION_TOPOLOGY.nodeCount;root++){if(seen[root])continue;const kind=fields.landMask[root]?1:0,queue=[root];seen[root]=1;
      for(let head=0;head<queue.length;head++){const cell=queue[head];for(let at=EVOLUTION_TOPOLOGY.nodeStart[cell];at<EVOLUTION_TOPOLOGY.nodeStart[cell+1];at++){
        const next=EVOLUTION_TOPOLOGY.nodeNeighbors[at];if(!seen[next]&&(fields.landMask[next]?1:0)===kind){seen[next]=1;queue.push(next);}}}largest[kind]=Math.max(largest[kind],queue.length);}
    let sameLand=0,sameBiome=0,coastEdges=0,lakeEdges=0;for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++){const a=EVOLUTION_TOPOLOGY.edgeA[edge],b=EVOLUTION_TOPOLOGY.edgeB[edge];
      if(fields.landMask[a]===fields.landMask[b])sameLand++;else coastEdges++;if(fields.biomeId[a]===fields.biomeId[b])sameBiome++;
      if(fields.lakeId[a]!==fields.lakeId[b]&&(fields.lakeId[a]>=0||fields.lakeId[b]>=0))lakeEdges++;}
    const landBiomes=new Set(),oceanBiomes=new Set();for(let cell=0;cell<EVOLUTION_TOPOLOGY.nodeCount;cell++)(fields.landMask[cell]?landBiomes:oceanBiomes).add(fields.biomeId[cell]);
    return{digest:fieldDigest(fields),landCells,waterCells,landFraction:landCells/EVOLUTION_TOPOLOGY.nodeCount,largestLand:largest[1],largestWater:largest[0],
      landComponentShare:largest[1]/Math.max(1,landCells),waterComponentShare:largest[0]/Math.max(1,waterCells),sameLandAdjacency:sameLand/EVOLUTION_TOPOLOGY.edgeCount,
      sameBiomeAdjacency:sameBiome/EVOLUTION_TOPOLOGY.edgeCount,biomes:new Set(fields.biomeId).size,landBiomes:landBiomes.size,oceanBiomes:oceanBiomes.size,
      lakes:new Set([...fields.lakeId].filter(value=>value>=0)).size,coastEdges,lakeEdges};}
  function fieldDigest(fields){let hash=2166136261;for(const key of ['landMask','biomeId','altitude','baseMoisture','baseTemp','baseNutrient','forestDensity','lakeId','lakeDepth','lakeShore','ridgeStrength']){
      const value=fields[key],bytes=new Uint8Array(value.buffer,value.byteOffset,value.byteLength);for(const byte of bytes){hash^=byte;hash=Math.imul(hash,16777619);}}return(hash>>>0).toString(16).padStart(8,'0');}
  function edgeUpdates(value){return value.backend==='webgl2'?value.world.edgeUpdateCount:value.edgeUpdateCount;}
  function typedBytes(value){let bytes=0;for(const item of Object.values(value))if(ArrayBuffer.isView(item))bytes+=item.byteLength;return bytes;}
  function summarize(values){const sorted=values.slice().sort((a,b)=>a-b);return{samples:values.length,mean:values.reduce((sum,value)=>sum+value,0)/Math.max(1,values.length),
    minimum:sorted[0]??0,p50:sorted[Math.floor(sorted.length*.5)]??0,p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]??0,maximum:sorted.at(-1)??0};}
})()`; }

function ok(value, message) { if (!value) throw new Error(message); }
