/** Focused production-browser evidence for exact-cell Evolution authority. */
export async function runEvolutionCellProgressionFixture(tools, { label = 'final', enforce = true } = {}) {
  const { click, drag, evaluate, key, pinch, screenshot, setMedia, setViewport, touchCancel, wait, wheel } = tools;
  const originalViewport = await evaluate('({width:innerWidth,height:innerHeight})');
  await setViewport(1440, 900); await wait(100);
  const entryPoint = await evaluate(`(()=>{const e=document.getElementById('scene-evolution'),r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`);
  await click(...entryPoint); await wait(150);
  const prepared = await evaluate(PREPARE_EXPRESSION); const target = prepared.targetPoint;
  if (enforce) ok(prepared.topology.cells === 2562 && prepared.topology.edges === 7680
    && prepared.topology.layoutDigest && prepared.topology.rootCount === 1, `Evolution topology preparation failed: ${JSON.stringify(prepared)}`);

  await click(...target); await wait(120);
  const selected = await evaluate(SELECTION_EXPRESSION);
  if (enforce) ok(selected.exactCell && selected.selectedCells === 1 && selected.levelEntriesUnchanged
    && selected.treeItems === 0 && selected.navigatorButtons <= 12 && selected.neighborButtons >= 5 && selected.neighborButtons <= 6,
  `Evolution exact-cell selection failed: ${JSON.stringify(selected)}`);

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
  report.interaction = { selected, manipulation, purchase: report.purchase };
  report.screenshots = { selected: await screenshot(`evolution-cell-progression-${label}-${report.rendererPath}-selected-1440x900.png`) };

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
  const reducedA = await screenshot(`evolution-cell-progression-${label}-${report.rendererPath}-reduced-a.png`); await wait(320);
  const reducedB = await screenshot(`evolution-cell-progression-${label}-${report.rendererPath}-reduced-b.png`);
  report.reducedMotion = { stable: reducedA.hash === reducedB.hash, first: reducedA, second: reducedB };
  if (enforce) ok(report.reducedMotion.stable, 'Evolution reduced-motion rendering changed without state change');

  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});window.__CSG_EVOLUTION_CELL_FIXTURE__?.restore()})()`);
  await setViewport(originalViewport.width, originalViewport.height); await wait(80);
  if (enforce) {
    ok(report.semantic.valid, `Evolution semantic projection failed: ${JSON.stringify(report.semantic)}`);
    ok(report.purchase.valid, `Evolution exact-cell purchase failed: ${JSON.stringify(report.purchase)}`);
    ok(report.performance.staticLayoutStable && report.performance.staticGeometryStable
      && report.performance.steadyEdgeUpdates === 0, `Evolution boundedness failed: ${JSON.stringify(report.performance)}`);
    ok(report.rendererPath !== 'webgl2' || report.packing.drawCalls === 4,
      `Evolution WebGL draw count changed: ${JSON.stringify(report.packing)}`);
    if (report.visual.available) ok(report.visual.valid, `Evolution edge hierarchy failed: ${JSON.stringify(report.visual)}`);
  }
  ok(tools.errors.length === 0, `Evolution browser errors: ${tools.errors.join(' | ')}`); return report;
}

const PREPARE_EXPRESSION = `(async()=>{
  const app=window.__CELL_SPHERE_APP__,original={meta:app.meta,archive:app.archive,selectedNode:app.selectedNode,
    historySnapshot:app.historySnapshot,historyPlaybackActive:app.historyPlaybackActive,
    camera:{...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()}};
  const [{validateMeta},{EVOLUTION_LAYOUT,EVOLUTION_TOPOLOGY,buildEvolutionProjection,buildEvolutionSnapshot},{viewProjection,focusCamera}]=await Promise.all([
    import('./src/platform/storage.js'),import('./src/game/skills/index.js'),import('./src/rendering/camera.js')]);
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
  window.__CSG_EVOLUTION_CELL_FIXTURE__={original,targetCell,beforeProjection,beforeSnapshot,levelsBefore,layout:EVOLUTION_LAYOUT,
    restore(){app.closeActiveOverlay();app.meta=original.meta;app.archive=original.archive;app.selectedNode=original.selectedNode;
      app.historySnapshot=original.historySnapshot;app.historyPlaybackActive=original.historyPlaybackActive;Object.assign(app.camera,original.camera);
      app.memorySnapshot=buildEvolutionSnapshot(app.meta);app.memoryUi.closeNode();delete window.__CSG_EVOLUTION_CELL_FIXTURE__;}};
  return{targetCell,targetPoint,canvasPoint:[rect.left+rect.width*.72,rect.top+rect.height*.45],topology:{cells:EVOLUTION_TOPOLOGY.nodeCount,
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
  const [{EVOLUTION_ARCHETYPES,EVOLUTION_CELL_EDGE,EVOLUTION_LAYOUT,EVOLUTION_TOPOLOGY,buildEvolutionProjection,buildEvolutionSnapshot,
    evolutionCellState,getEvolutionAdjacentCells},{viewProjection,focusCamera}]=await Promise.all([
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
  const semantic={presentationCells:EVOLUTION_TOPOLOGY.nodeCount,presentationEdges:EVOLUTION_TOPOLOGY.edgeCount,
    progressionCells:afterProjection.levelByCell.length,archetypes:EVOLUTION_ARCHETYPES.length,selectedCells,
    treeItems:document.querySelectorAll('#evolution-tree').length,navigatorButtons:document.querySelectorAll('#evolution-navigator button').length,
    neighborButtons:document.querySelectorAll('#evolution-neighbors button').length,layoutDigest:EVOLUTION_LAYOUT.diagnostics.digest,
    valid:EVOLUTION_TOPOLOGY.nodeCount===2562&&EVOLUTION_TOPOLOGY.edgeCount===7680&&afterProjection.levelByCell.length===2562
      &&EVOLUTION_ARCHETYPES.length===42&&selectedCells===1&&document.querySelectorAll('#evolution-tree').length===0
      &&document.querySelectorAll('#evolution-navigator button').length<=9};
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
  const visual=measureVisual(activeRenderer);return{schema:2,rendererPath:activeRenderer.backend,
    simulationPath:${JSON.stringify(simulationFallback ? 'fallback' : 'worker')},semantic,purchase,performance:performanceReport,packing,visual};

  function measureVisual(targetRenderer){const root=EVOLUTION_LAYOUT.rootCell,step=EVOLUTION_LAYOUT.rootRing[0],visualTarget=getEvolutionAdjacentCells(step)
      .filter(cell=>cell!==root).sort((a,b)=>EVOLUTION_LAYOUT.rootDistance[b]-EVOLUTION_LAYOUT.rootDistance[a]||a-b)[0];
    const baseMeta={...app.meta,evolutionLevels:[{cell:root,level:'1'}]},frontierMeta={...app.meta,evolutionLevels:[{cell:root,level:'1'},{cell:step,level:'1'}]};
    const quiet=buildEvolutionSnapshot(baseMeta),frontier=buildEvolutionSnapshot(frontierMeta),selectedSnapshot=buildEvolutionSnapshot(frontierMeta,visualTarget);
    let edge=-1;for(let index=0;index<EVOLUTION_TOPOLOGY.edgeCount;index++)if((EVOLUTION_TOPOLOGY.edgeA[index]===visualTarget||EVOLUTION_TOPOLOGY.edgeB[index]===visualTarget)
      &&quiet.evolutionEdge[index]===EVOLUTION_CELL_EDGE.QUIET&&frontier.evolutionEdge[index]===EVOLUTION_CELL_EDGE.FRONTIER
      &&selectedSnapshot.evolutionEdge[index]===EVOLUTION_CELL_EDGE.SELECTED){edge=index;break;}
    if(edge<0)return{available:true,valid:false,reason:'missing controlled exact-cell edge'};
    const camera={...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()};
    focusCamera(camera,EVOLUTION_TOPOLOGY.positions.subarray(visualTarget*3,visualTarget*3+3));camera.dist=2.7;camera.offsetX=0;camera.offsetY=0;
    const quietValue=probe(quiet,edge,camera),frontierValue=probe(frontier,edge,camera),selectedValue=probe(selectedSnapshot,edge,camera),
      noise=Math.max(...[0,1,2].map(()=>Math.abs(probe(selectedSnapshot,edge,camera)-selectedValue))),margin=Math.max(.006,noise*4+.002);
    return{available:true,edge,quiet:quietValue,frontier:frontierValue,selected:selectedValue,noise,margin,
      valid:frontierValue>quietValue+margin&&selectedValue>frontierValue+margin};
    function probe(snapshotValue,edgeValue,cameraValue){targetRenderer.render({snapshot:snapshotValue,worldIdentity:null,camera:cameraValue,selectedNode:null,highlightedCells:[],time:0,pulse:false});
      const dual=targetRenderer.backend==='webgl2'?targetRenderer.world.geometry.dual:targetRenderer.dual,
        a=project(dual.corners,dual.boundaryCornerA[edgeValue],cameraValue),b=project(dual.corners,dual.boundaryCornerB[edgeValue],cameraValue),
        dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,sides=[],center=[];
      for(const along of [.3,.4,.5,.6,.7])for(const offset of [-6,-5,-4,-1,0,1,4,5,6]){const color=readPixel(a[0]+dx*along+nx*offset,a[1]+dy*along+ny*offset);
        (Math.abs(offset)<=1?center:sides).push(color);}const side=mean(sides);return Math.max(...center.map(color=>distance(color,side)));}
    function project(points,index,cameraValue){if(targetRenderer.backend==='canvas2d')return[targetRenderer.cornerX[index],targetRenderer.cornerY[index]];
      const matrix=viewProjection(cameraValue,targetRenderer.canvas.width/targetRenderer.canvas.height),at=index*3,x=points[at],y=points[at+1],z=points[at+2],
        clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
      return[(clipX/w*.5+.5)*targetRenderer.canvas.width,(1-(clipY/w*.5+.5))*targetRenderer.canvas.height];}
    function readPixel(x,y){const px=Math.max(0,Math.min(targetRenderer.canvas.width-1,Math.round(x))),py=Math.max(0,Math.min(targetRenderer.canvas.height-1,Math.round(y)));
      if(targetRenderer.backend==='webgl2'){const data=new Uint8Array(4);targetRenderer.gl.readPixels(px,targetRenderer.canvas.height-1-py,1,1,targetRenderer.gl.RGBA,targetRenderer.gl.UNSIGNED_BYTE,data);return[data[0],data[1],data[2]];}
      const data=targetRenderer.ctx.getImageData(px,py,1,1).data;return[data[0],data[1],data[2]];}
    function mean(values){return[0,1,2].map(axis=>values.reduce((sum,value)=>sum+value[axis],0)/values.length);}
    function distance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/(255*Math.sqrt(3));}}
  function edgeUpdates(value){return value.backend==='webgl2'?value.world.edgeUpdateCount:value.edgeUpdateCount;}
  function typedBytes(value){let bytes=0;for(const item of Object.values(value))if(ArrayBuffer.isView(item))bytes+=item.byteLength;return bytes;}
  function summarize(values){const sorted=values.slice().sort((a,b)=>a-b);return{samples:values.length,mean:values.reduce((sum,value)=>sum+value,0)/Math.max(1,values.length),
    minimum:sorted[0]??0,p50:sorted[Math.floor(sorted.length*.5)]??0,p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]??0,maximum:sorted.at(-1)??0};}
})()`; }

function ok(value, message) { if (!value) throw new Error(message); }
