/** Focused production-browser evidence for dense Evolution territories. */
export async function runEvolutionTerritoryFixture(tools, { label = 'final', enforce = true } = {}) {
  const { click, evaluate, key, screenshot, setMedia, setViewport, wait } = tools;
  const originalViewport = await evaluate('({width:innerWidth,height:innerHeight})');
  await setViewport(1440, 900); await wait(100);
  const entryPoint = await evaluate(`(()=>{const e=document.getElementById('scene-evolution'),r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2]})()`);
  await click(...entryPoint); await wait(120);
  const report = await evaluate(fixtureExpression(tools.simulationFallback));
  report.screenshots = {};
  report.screenshots.selected = await screenshot(`evolution-territories-${label}-${report.rendererPath}-selected-1440x900.png`);

  const responsive = [];
  await evaluate(`document.documentElement.style.fontSize='200%'`);
  for (const [width, height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[844,390],[1024,600],[1440,900]]) {
    await setViewport(width, height); await wait(100);
    const value = await evaluate(`(()=>{const rect=(node)=>{const r=node.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}},
      canvas=document.getElementById('gl-canvas'),panel=document.getElementById('memory-node-panel'),action=document.getElementById('memory-unlock'),
      body=panel.querySelector('.surface-body'),tabs=[...document.querySelectorAll('#scene-selector [role=tab]')];panel.scrollTop=0;action.scrollIntoView({block:'nearest'});
      const c=rect(canvas),p=rect(panel),a=rect(action),panelStyle=getComputedStyle(panel),bodyStyle=getComputedStyle(body);
      return{viewport:{width:innerWidth,height:innerHeight},canvas:c,panel:p,action:a,treeItems:document.querySelectorAll('#evolution-tree [role=treeitem]').length,
        noHorizontalScroll:document.documentElement.scrollWidth<=innerWidth&&document.body.scrollWidth<=innerWidth,
        panelHorizontalScroll:panel.scrollWidth>panel.clientWidth,panelScrollTop:panel.scrollTop,panelOverflowY:panelStyle.overflowY,bodyOverflowY:bodyStyle.overflowY,
        actionReachable:a.width>=44&&a.height>=44&&a.left>=p.left-1&&a.right<=p.right+1&&a.top>=p.top-1&&a.bottom<=Math.min(innerHeight,p.bottom)+1,
        canvasReachable:c.width>0&&c.height>0&&c.right>0&&c.bottom>0,minimumTab:Math.min(...tabs.map(tab=>tab.getBoundingClientRect().height))}})()`);
    responsive.push(value);
    if (enforce) ok(value.treeItems === 42 && value.noHorizontalScroll && !value.panelHorizontalScroll
      && value.actionReachable && value.canvasReachable && value.minimumTab >= 44,
    `Evolution responsive failure ${width}x${height}: ${JSON.stringify(value)}`);
  }
  report.responsive = responsive;
  await evaluate(`document.documentElement.style.fontSize=''`); await setViewport(390, 844); await wait(80);

  await setMedia([{ name: 'forced-colors', value: 'active' }]); await wait(80);
  report.forcedColors = await evaluate(`(()=>{const action=document.getElementById('memory-unlock'),selected=document.querySelector('#evolution-tree [aria-selected=true]'),style=getComputedStyle(action);
    return{active:matchMedia('(forced-colors: active)').matches,actionBorder:style.borderTopStyle,focusText:selected?.textContent??'',treeItems:document.querySelectorAll('#evolution-tree [role=treeitem]').length}})()`);
  if (enforce) ok(report.forcedColors.active && report.forcedColors.actionBorder !== 'none'
    && report.forcedColors.focusText.length > 0 && report.forcedColors.treeItems === 42,
  `Evolution forced colors failed: ${JSON.stringify(report.forcedColors)}`);
  await setMedia([]);

  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'reduced'})})()`); await wait(80);
  const reducedA = await screenshot(`evolution-territories-${label}-${report.rendererPath}-reduced-a.png`); await wait(320);
  const reducedB = await screenshot(`evolution-territories-${label}-${report.rendererPath}-reduced-b.png`);
  report.reducedMotion = { stable: reducedA.hash === reducedB.hash, first: reducedA, second: reducedB };
  if (enforce) ok(report.reducedMotion.stable, 'Evolution reduced-motion rendering changed without state change');

  await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.applySettings({...a.settings,motion:'full'});window.__CSG_EVOLUTION_TERRITORY_FIXTURE__?.restore()})()`);
  await setViewport(originalViewport.width, originalViewport.height); await wait(80);
  if (enforce) {
    ok(report.semantic.valid, `Evolution semantic projection failed: ${JSON.stringify(report.semantic)}`);
    ok(report.performance.staticProjectionStable && report.performance.staticGeometryStable
      && report.performance.steadyEdgeUpdates === 0, `Evolution boundedness failed: ${JSON.stringify(report.performance)}`);
    ok(report.rendererPath !== 'webgl2' || report.packing.drawCalls === 4,
      `Evolution WebGL draw count changed: ${JSON.stringify(report.packing)}`);
    if (report.visual.available) ok(report.visual.valid, `Evolution edge hierarchy failed: ${JSON.stringify(report.visual)}`);
  }
  ok(tools.errors.length === 0, `Evolution browser errors: ${tools.errors.join(' | ')}`);
  return report;
}

function fixtureExpression(simulationFallback = false) {
  return `(async()=>{
    const app=window.__CELL_SPHERE_APP__,original={meta:app.meta,selectedNode:app.selectedNode,historySnapshot:app.historySnapshot,
      historyPlaybackActive:app.historyPlaybackActive,camera:{...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()}};
    const [{validateMeta},{buildMemorySnapshot,MEMORY_NODES},{viewProjection,focusCamera}]=await Promise.all([
      import('./src/platform/storage.js'),import('./src/game/skills/index.js'),import('./src/rendering/camera.js')]);
    const projection=app.evolutionTerritories??null,presentation=projection??app.topo,renderer=app.renderer;
    const fixtureMeta=validateMeta({...app.meta,echoBalance:'1000000',evolutionLevels:[{id:'first-division',level:'1'}],
      imprints:[{kind:'strongest-corridor',seed:7,cells:Array.from({length:12},(_,cell)=>cell),topology:{kind:'geodesic',frequency:2,nodeCount:42,edgeCount:120}}]});
    app.meta=fixtureMeta;const selectedId='reliable-budding';app.memorySnapshot=buildMemorySnapshot(presentation,app.meta,selectedId,['nutrient-uptake']);
    app.memoryUi.syncTree(app.meta);app.selectEvolutionCell(selectedId);app.lastRender=-Infinity;
    renderer.render({snapshot:app.memorySnapshot,worldIdentity:null,camera:app.camera,selectedNode:app.selectedNode,highlightedCells:[],time:0,pulse:false});
    const selectedNode=app.memorySnapshot.nodeStates.find(node=>node.id===selectedId),selectedSkill=projection?.skillBySiteCell[selectedNode.cell]??selectedNode.cell;
    const selectedCells=projection?[...projection.cells.slice(projection.cellStart[selectedSkill],projection.cellStart[selectedSkill+1])]:[selectedNode.cell];
    const selectedStatuses=new Set(selectedCells.map(cell=>app.memorySnapshot.memoryStatus[cell]));
    const ownerCount=projection?new Set(app.memorySnapshot.memoryOwner).size:app.memorySnapshot.memoryNodeIndex.filter(index=>index>=0).length;
    const edgeCounts={};for(const value of app.memorySnapshot.memoryTerritoryEdge??[])edgeCounts[value]=(edgeCounts[value]??0)+1;
    const semantic={presentationCells:app.topo.nodeCount,presentationEdges:app.topo.edgeCount,authoredSkills:app.memorySnapshot.nodeStates.length,
      treeItems:document.querySelectorAll('#evolution-tree [role=treeitem]').length,ownerCount,selectedSkill,selectedCells:selectedCells.length,
      selectedStatuses:[...selectedStatuses],edgeCounts,digest:projection?.diagnostics.digest??null,
      valid:Boolean(projection?app.topo.nodeCount===2562&&app.topo.edgeCount===7680&&ownerCount===42&&selectedStatuses.size===1
        &&[5,6,7,9,10].includes([...selectedStatuses][0])&&document.querySelectorAll('#evolution-tree [role=treeitem]').length===42
        :app.topo.nodeCount===42&&app.memorySnapshot.nodeStates.length===42)};

    const entrySamples=[];let projectionReference=projection;
    for(let sample=0;sample<6;sample++){app.selectScene('home');const started=performance.now();app.selectScene('evolution');
      app.renderer.render({snapshot:app.memorySnapshot,worldIdentity:null,camera:app.camera,selectedNode:app.selectedNode,highlightedCells:[],time:0,pulse:false});
      if(sample)entrySamples.push(performance.now()-started);if(projection&&app.evolutionTerritories!==projectionReference)throw new Error('territory projection rebuilt on entry');}
    const activeRenderer=app.renderer,geometry=activeRenderer.backend==='webgl2'?activeRenderer.world.geometry:activeRenderer.dual;
    const buildSamples=[],updateSamples=[],steadySamples=[];let snapshot=app.memorySnapshot;
    for(let sample=0;sample<12;sample++){const id=MEMORY_NODES[sample%MEMORY_NODES.length].id,buildAt=performance.now();
      snapshot=buildMemorySnapshot(presentation,app.meta,id,sample%3===0?['nutrient-uptake']:[]);buildSamples.push(performance.now()-buildAt);
      await new Promise(resolve=>requestAnimationFrame(resolve));app.memorySnapshot=snapshot;const renderAt=performance.now();
      activeRenderer.render({snapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});updateSamples.push(performance.now()-renderAt);}
    const beforeSteady=edgeUpdates(activeRenderer);for(let sample=0;sample<30;sample++){await new Promise(resolve=>requestAnimationFrame(resolve));const renderAt=performance.now();
      activeRenderer.render({snapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:sample/60,pulse:false});steadySamples.push(performance.now()-renderAt);}
    const afterSteady=edgeUpdates(activeRenderer);app.memorySnapshot=buildMemorySnapshot(presentation,app.meta);app.selectedNode=null;app.selectEvolutionCell(selectedId);
    activeRenderer.render({snapshot:app.memorySnapshot,worldIdentity:null,camera:app.camera,selectedNode:app.selectedNode,highlightedCells:[],time:0,pulse:false});
    const performanceReport={entry:summarize(entrySamples),snapshot:summarize(buildSamples),update:summarize(updateSamples),steady:summarize(steadySamples),
      staticProjectionStable:!projection||projection===app.evolutionTerritories,staticGeometryStable:geometry===(activeRenderer.backend==='webgl2'?activeRenderer.world.geometry:activeRenderer.dual),
      steadyEdgeUpdates:afterSteady-beforeSteady};
    const packing=activeRenderer.backend==='webgl2'?{drawCalls:activeRenderer.drawCalls,buffers:activeRenderer.world.buffers.length,
      staticGeometryBytes:typedBytes(activeRenderer.world.geometry),dynamicBytes:activeRenderer.world.lifeData.byteLength+activeRenderer.world.ecologyData.byteLength+activeRenderer.world.lifeEdgeData.byteLength+activeRenderer.world.boundaryLifeData.byteLength,
      compactEdgeBytes:activeRenderer.world.lifeEdgeData.byteLength,expandedEdgeBytes:activeRenderer.world.boundaryLifeData.byteLength}
      :{drawCalls:null,buffers:null,staticGeometryBytes:typedBytes(activeRenderer.dual),dynamicBytes:activeRenderer.lifeEdgeData.byteLength+activeRenderer.lifeEdgeBatches.reduce((sum,value)=>sum+value.byteLength,0),compactEdgeBytes:activeRenderer.lifeEdgeData.byteLength,expandedEdgeBytes:null};
    const visual=projection?measureVisual(activeRenderer,projection,app.memorySnapshot,selectedSkill):{available:false,valid:false};
    window.__CSG_EVOLUTION_TERRITORY_FIXTURE__={restore(){app.meta=original.meta;app.selectedNode=original.selectedNode;app.historySnapshot=original.historySnapshot;
      app.historyPlaybackActive=original.historyPlaybackActive;Object.assign(app.camera,original.camera);app.memorySnapshot=buildMemorySnapshot(app.evolutionTerritories??app.topo,app.meta);
      app.memoryUi.syncTree(app.meta);app.closeEvolutionCell();delete window.__CSG_EVOLUTION_TERRITORY_FIXTURE__;}};
    return{schema:1,rendererPath:activeRenderer.backend,simulationPath:${JSON.stringify(simulationFallback ? 'fallback' : 'worker')},semantic,performance:performanceReport,packing,visual};

    function measureVisual(targetRenderer,map,selectedSnapshot,skill){const topology=map.topology,base=buildMemorySnapshot(map,app.meta),
      direction=map.centroid.subarray(skill*3,skill*3+3),boundary=findEdge((a,b)=>a!==b&&(a===skill||b===skill)),internal=findEdge((a,b)=>a===skill&&b===skill);
      if(boundary<0||internal<0)return{available:true,valid:false,reason:'missing controlled edges'};
      const camera={...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()};
      focusCamera(camera,direction);camera.dist=2.7;camera.offsetX=0;camera.offsetY=0;
      const internalValue=probe(base,internal,camera),territoryValue=probe(base,boundary,camera),selectedValue=probe(selectedSnapshot,boundary,camera),noise=Math.max(...[0,1,2].map(()=>Math.abs(probe(selectedSnapshot,boundary,camera)-selectedValue)));
      const margin=Math.max(.008,noise*4+.003);return{available:true,internal:internalValue,territory:territoryValue,selected:selectedValue,noise,margin,
        valid:territoryValue>internalValue+margin&&selectedValue>territoryValue+margin};
      function findEdge(match){let best=-1,bestDot=-Infinity;for(let edge=0;edge<topology.edgeCount;edge++){const a=map.ownerByCell[topology.edgeA[edge]],b=map.ownerByCell[topology.edgeB[edge]];if(!match(a,b))continue;
        const mid=midpoint(edge),dot=mid[0]*direction[0]+mid[1]*direction[1]+mid[2]*direction[2];if(dot>bestDot){best=edge;bestDot=dot;}}return best;}
      function probe(snapshot,edge,camera){targetRenderer.render({snapshot,worldIdentity:null,camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
        const dual=targetRenderer.backend==='webgl2'?targetRenderer.world.geometry.dual:targetRenderer.dual,a=project(dual.corners,dual.boundaryCornerA[edge],camera),b=project(dual.corners,dual.boundaryCornerB[edge],camera),
          dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,sides=[],center=[];
        for(const along of [.3,.4,.5,.6,.7])for(const offset of [-6,-5,-4,-1,0,1,4,5,6]){const x=a[0]+dx*along+nx*offset,y=a[1]+dy*along+ny*offset,p=readPixel(x,y);
          (Math.abs(offset)<=1?center:sides).push(p);}const side=mean(sides);return Math.max(...center.map(color=>distance(color,side)));}
      function project(points,index,camera){if(targetRenderer.backend==='canvas2d')return points===topology.positions?[targetRenderer.px[index],targetRenderer.py[index]]:[targetRenderer.cornerX[index],targetRenderer.cornerY[index]];
        const matrix=viewProjection(camera,targetRenderer.canvas.width/targetRenderer.canvas.height),at=index*3,x=points[at],y=points[at+1],z=points[at+2],
          clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
        return[(clipX/w*.5+.5)*targetRenderer.canvas.width,(1-(clipY/w*.5+.5))*targetRenderer.canvas.height];}
      function readPixel(x,y){const px=Math.max(0,Math.min(targetRenderer.canvas.width-1,Math.round(x))),py=Math.max(0,Math.min(targetRenderer.canvas.height-1,Math.round(y)));
        if(targetRenderer.backend==='webgl2'){const data=new Uint8Array(4);targetRenderer.gl.readPixels(px,targetRenderer.canvas.height-1-py,1,1,targetRenderer.gl.RGBA,targetRenderer.gl.UNSIGNED_BYTE,data);return[data[0],data[1],data[2]];}
        const data=targetRenderer.ctx.getImageData(px,py,1,1).data;return[data[0],data[1],data[2]];}
      function midpoint(edge){const a=topology.edgeA[edge]*3,b=topology.edgeB[edge]*3,x=topology.positions[a]+topology.positions[b],y=topology.positions[a+1]+topology.positions[b+1],z=topology.positions[a+2]+topology.positions[b+2],length=Math.hypot(x,y,z);return[x/length,y/length,z/length];}
      function mean(values){return[0,1,2].map(axis=>values.reduce((sum,value)=>sum+value[axis],0)/values.length);}function distance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/(255*Math.sqrt(3));}}
    function edgeUpdates(value){return value.backend==='webgl2'?value.world.edgeUpdateCount:value.edgeUpdateCount;}
    function typedBytes(value){let bytes=0;for(const item of Object.values(value))if(ArrayBuffer.isView(item))bytes+=item.byteLength;return bytes;}
    function summarize(values){const sorted=values.slice().sort((a,b)=>a-b);return{samples:values.length,mean:values.reduce((sum,value)=>sum+value,0)/values.length,
      minimum:sorted[0]??0,p50:sorted[Math.floor(sorted.length*.5)]??0,p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]??0,maximum:sorted.at(-1)??0};}
  })()`;
}

function ok(value, message) { if (!value) throw new Error(message); }
