/** Controlled production-renderer oracle for exact Evolution ownership boundaries. */
export function evolutionOwnershipBoundaryExpression() { return `(async()=>{
  const app=window.__CELL_SPHERE_APP__,fixture=window.__CSG_EVOLUTION_CELL_FIXTURE__,renderer=app.renderer;
  const saved={meta:app.meta,snapshot:app.memorySnapshot,selectedNode:app.selectedNode,selectedCell:app.memoryUi.selectedCell,
    camera:{...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()}};
  const [{EVOLUTION_CELL_EDGE,EVOLUTION_EDGE_REGION_SHIFT,EVOLUTION_LAYOUT,EVOLUTION_REGION_EDGE,EVOLUTION_TOPOLOGY,
    buildEvolutionSnapshot,evolutionCellEdgeStatus,evolutionRegionEdge},{viewProjection,focusCamera}]=await Promise.all([
      import('./src/game/skills/index.js'),import('./src/rendering/camera.js')]);
  const root=EVOLUTION_LAYOUT.rootCell,ringLevels=[root,...EVOLUTION_LAYOUT.rootRing].map(cell=>({cell,level:'1'}));
  const rich=(levels)=>({...app.meta,evolutionLevels:levels,echoBalance:'1000000000',totalEchoes:'1000000000'});
  const poor=(levels)=>({...app.meta,evolutionLevels:levels,echoBalance:'0',totalEchoes:'1000000000'});
  const snapshots={fresh:buildEvolutionSnapshot(rich([])),root:buildEvolutionSnapshot(rich([{cell:root,level:'1'}])),
    ring:buildEvolutionSnapshot(rich(ringLevels)),ringPoor:buildEvolutionSnapshot(poor(ringLevels)),
    locked:buildEvolutionSnapshot(poor([]))};
  const ownershipEdges=edgesWith(snapshots.ring,EVOLUTION_CELL_EDGE.OWNERSHIP_PERIMETER),transientEdge=ownershipEdges[0],
    transientTarget=snapshots.ring.evolutionProjection.owned[EVOLUTION_TOPOLOGY.edgeA[transientEdge]]
      ?EVOLUTION_TOPOLOGY.edgeA[transientEdge]:EVOLUTION_TOPOLOGY.edgeB[transientEdge];
  const establishedCell=snapshots.ring.evolutionProjection.owned[EVOLUTION_TOPOLOGY.edgeA[transientEdge]]
    ?EVOLUTION_TOPOLOGY.edgeB[transientEdge]:EVOLUTION_TOPOLOGY.edgeA[transientEdge];
  snapshots.selected=buildEvolutionSnapshot(rich(ringLevels),transientTarget);
  snapshots.recent=buildEvolutionSnapshot(rich(ringLevels),null,[transientTarget]);
  snapshots.established=buildEvolutionSnapshot(rich([...ringLevels,{cell:establishedCell,level:'1'}]));

  const fixtureReports=[['fresh',snapshots.fresh,[0,0,0,6,7674],[7674,6,0],0,1],
    ['root',snapshots.root,[0,6,6,18,7650],[7656,18,6],1,7],
    ['ring',snapshots.ring,[12,18,12,30,7608],[7632,30,18],7,19]]
    .map(([name,snapshot,expectedRelations,expectedStates,ownedCells,candidateCells])=>
      semanticFixture(name,snapshot,expectedRelations,expectedStates,ownedCells,candidateCells));
  const selectedChanged=changedEdges(snapshots.ring.evolutionEdge,snapshots.selected.evolutionEdge),
    recentChanged=changedEdges(snapshots.ring.evolutionEdge,snapshots.recent.evolutionEdge),
    selectedIncident=incidentEdges(transientTarget),recentIncident=incidentEdges(transientTarget),
    clearedSelected=buildEvolutionSnapshot(rich(ringLevels)),clearedRecent=buildEvolutionSnapshot(rich(ringLevels),null,[]);
  const transient={cell:transientTarget,selectedChanged,recentChanged,
    selectedIncidentOnly:sameNumbers(selectedChanged,selectedIncident),recentIncidentOnly:sameNumbers(recentChanged,recentIncident),
    selectedPriority:selectedIncident.every(edge=>evolutionCellEdgeStatus(snapshots.selected.evolutionEdge[edge])===EVOLUTION_CELL_EDGE.SELECTED),
    recentPriority:recentIncident.every(edge=>evolutionCellEdgeStatus(snapshots.recent.evolutionEdge[edge])===EVOLUTION_CELL_EDGE.RECENT),
    selectedClears:equalBytes(clearedSelected.evolutionEdge,snapshots.ring.evolutionEdge),
    recentClears:equalBytes(clearedRecent.evolutionEdge,snapshots.ring.evolutionEdge)};
  transient.valid=transient.selectedIncidentOnly&&transient.recentIncidentOnly&&transient.selectedPriority
    &&transient.recentPriority&&transient.selectedClears&&transient.recentClears;

  const ringProjection=snapshots.ring.evolutionProjection,
    reachableCell=firstCell(cell=>!ringProjection.owned[cell]&&ringProjection.reachable[cell]),
    lockedCell=firstCell(cell=>!ringProjection.owned[cell]&&!ringProjection.reachable[cell]);
  const nativeText=collectNativeText([
    ['owned',rich(ringLevels),root,'owned and affordable'],
    ['reachableAffordable',rich(ringLevels),reachableCell,'reachable and affordable'],
    ['reachableUnaffordable',poor(ringLevels),reachableCell,'reachable and unaffordable'],
    ['locked',poor(ringLevels),lockedCell,'locked'],
  ]);
  nativeText.valid=Object.values(nativeText).filter(value=>typeof value==='object').every(value=>value.valid)
    &&nativeText.navigatorButtons<=9&&nativeText.neighborButtons<=6;

  const categoryEdges={ownership:sample(ownershipEdges,2),
    reachable:sample(edgesWith(snapshots.ring,EVOLUTION_CELL_EDGE.REACHABLE_PERIMETER),2),
    ownedInterior:sample(edgesWhere(snapshots.ring,(a,b,status)=>status===EVOLUTION_CELL_EDGE.QUIET
      &&ringProjection.owned[a]&&ringProjection.owned[b]),2),
    reachableInterior:sample(edgesWhere(snapshots.ring,(a,b,status)=>status===EVOLUTION_CELL_EDGE.QUIET
      &&!ringProjection.owned[a]&&!ringProjection.owned[b]&&ringProjection.reachable[a]&&ringProjection.reachable[b]),2),
    immutableRegion:sample(edgesWhere(snapshots.locked,(a,b,status,relation)=>status===EVOLUTION_CELL_EDGE.QUIET
      &&relation===EVOLUTION_REGION_EDGE.DOMAIN&&!snapshots.locked.evolutionProjection.reachable[a]
      &&!snapshots.locked.evolutionProjection.reachable[b]),2),
    quiet:sample(edgesWhere(snapshots.locked,(a,b,status,relation)=>status===EVOLUTION_CELL_EDGE.QUIET
      &&relation===EVOLUTION_REGION_EDGE.INTERNAL&&!snapshots.locked.evolutionProjection.reachable[a]
      &&!snapshots.locked.evolutionProjection.reachable[b]),2),
    selected:sample(incidentEdges(transientTarget),2),recent:sample(incidentEdges(transientTarget),2)};
  const far=Math.max(2.7,fixture.normalDistance),close=Math.max(1.9,far-.65),cases=[];
  for(const [name,distanceValue,limb] of [['far-center',far,false],['close-center',close,false],
    ['far-limb',far,true],['close-limb',close,true]]){
    const groups={ownership:probeGroup(snapshots.ring,categoryEdges.ownership,distanceValue,limb,'dynamic'),
      reachable:probeGroup(snapshots.ring,categoryEdges.reachable,distanceValue,limb,'dynamic'),
      ownedInterior:probeGroup(snapshots.ring,categoryEdges.ownedInterior,distanceValue,limb,'dynamic'),
      reachableInterior:probeGroup(snapshots.ring,categoryEdges.reachableInterior,distanceValue,limb,'dynamic'),
      immutableRegion:probeGroup(snapshots.locked,categoryEdges.immutableRegion,distanceValue,limb,'all'),
      quiet:probeGroup(snapshots.locked,categoryEdges.quiet,distanceValue,limb,'all'),
      selected:probeGroup(snapshots.selected,categoryEdges.selected,distanceValue,limb,'dynamic'),
      recent:probeGroup(snapshots.recent,categoryEdges.recent,distanceValue,limb,'dynamic')};
    const noise=Math.max(...Object.values(groups).map(group=>group.noise)),margin=Math.max(.006,noise*4+.002),
      ownershipMinimum=groups.ownership.peak.minimum,reachableMaximum=groups.reachable.peak.maximum,
      interiorMaximum=Math.max(groups.ownedInterior.peak.maximum,groups.reachableInterior.peak.maximum,groups.quiet.peak.maximum),
      regionMaximum=groups.immutableRegion.peak.maximum,
      recentDifference=snapshotEdgeDifference(snapshots.ring,snapshots.recent,transientEdge,distanceValue,limb),
      selectedDifference=snapshotEdgeDifference(snapshots.ring,snapshots.selected,transientEdge,distanceValue,limb),
      cellCue=cellDifference(snapshots.ring,snapshots.ringPoor,reachableCell,distanceValue,limb),
      ownershipCellCue=cellDifference(snapshots.ring,snapshots.established,establishedCell,distanceValue,limb),
      structuralMargin=Math.max(.03,noise*4+.01),
      edgePatternDistinct=groups.reachable.patternDepth.p50>groups.ownership.patternDepth.p50+structuralMargin
        || groups.reachable.coverage.p50<groups.ownership.coverage.p50-.18,
      structurallyDistinct=edgePatternDistinct||limb&&ownershipCellCue.signal>Math.max(margin,ownershipCellCue.noise*4+.002);
    cases.push({name,distance:distanceValue,limb,groups,noise,margin,ownershipMinimum,reachableMaximum,
      interiorMaximum,regionMaximum,recentDifference,selectedDifference,cellCue,ownershipCellCue,structuralMargin,
      edgePatternDistinct,structurallyDistinct,
      valid:ownershipMinimum>reachableMaximum+margin&&ownershipMinimum>interiorMaximum+margin
        &&ownershipMinimum>regionMaximum+margin&&groups.reachable.peak.minimum>margin
        &&groups.selected.peak.p50>groups.ownership.peak.p50+margin&&recentDifference>margin
        &&selectedDifference>margin&&cellCue.signal>Math.max(margin,cellCue.noise*4+.002)&&structurallyDistinct});
  }
  const semantic={fixtures:fixtureReports,transient,nativeText,
    affordabilityDoesNotOwn:equalBytes(snapshots.ring.evolutionEdge,snapshots.ringPoor.evolutionEdge)};
  semantic.valid=fixtureReports.every(value=>value.valid)&&transient.valid&&nativeText.valid&&semantic.affordabilityDoesNotOwn;
  restore();
  return{schema:1,available:true,semantic,categories:categoryEdges,cases,
    valid:semantic.valid&&cases.every(value=>value.valid)};

  function semanticFixture(name,snapshot,expectedRelations,expectedStates,ownedCells,candidateCells){
    const projection=snapshot.evolutionProjection,relations=[0,0,0,0,0],states=[0,0,0],unexpected=[],packedRegionMatches=[];
    for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++){const a=EVOLUTION_TOPOLOGY.edgeA[edge],b=EVOLUTION_TOPOLOGY.edgeB[edge],
      ownedA=projection.owned[a]===1,ownedB=projection.owned[b]===1,reachableA=!ownedA&&projection.reachable[a]===1,
      reachableB=!ownedB&&projection.reachable[b]===1,status=evolutionCellEdgeStatus(snapshot.evolutionEdge[edge]),
      relation=ownedA&&ownedB?0:ownedA!==ownedB?1:reachableA&&reachableB?2:reachableA!==reachableB?3:4,
      expected=ownedA!==ownedB?EVOLUTION_CELL_EDGE.OWNERSHIP_PERIMETER
        :!ownedA&&!ownedB&&reachableA!==reachableB?EVOLUTION_CELL_EDGE.REACHABLE_PERIMETER:EVOLUTION_CELL_EDGE.QUIET;
      relations[relation]++;if(status===EVOLUTION_CELL_EDGE.QUIET)states[0]++;
      else if(status===EVOLUTION_CELL_EDGE.REACHABLE_PERIMETER)states[1]++;
      else if(status===EVOLUTION_CELL_EDGE.OWNERSHIP_PERIMETER)states[2]++;
      if(status!==expected)unexpected.push(edge);
      if(evolutionRegionEdge(snapshot.evolutionEdge[edge])!==EVOLUTION_LAYOUT.edgeStructure[edge])packedRegionMatches.push(edge);}
    const actualOwned=projection.ownedCellCount,actualCandidates=projection.reachable.reduce((sum,value)=>sum+value,0);
    return{name,ownedCells:actualOwned,candidateCells:actualCandidates,relations,states,unexpected,
      packedRegionMismatches:packedRegionMatches,valid:actualOwned===ownedCells&&actualCandidates===candidateCells
        &&sameNumbers(relations,expectedRelations)&&sameNumbers(states,expectedStates)&&unexpected.length===0&&packedRegionMatches.length===0};}
  function collectNativeText(entries){const saved={meta:app.meta,snapshot:app.memorySnapshot,selectedNode:app.selectedNode,
      selectedCell:app.memoryUi.selectedCell},result={};
    for(const [name,meta,cell,expected] of entries){const snapshot=buildEvolutionSnapshot(meta,cell);app.meta=meta;app.memorySnapshot=snapshot;
      app.selectedNode=cell;app.memoryUi.openCell(cell,snapshot.evolutionProjection);const text=document.getElementById('evolution-current').textContent;
      result[name]={cell,text,expected,valid:text.includes('Local Level')&&text.includes('Shared rank')&&text.includes(expected)};}
    result.navigatorButtons=document.querySelectorAll('#evolution-navigator button').length;
    result.neighborButtons=document.querySelectorAll('#evolution-neighbors button').length;
    app.meta=saved.meta;app.memorySnapshot=saved.snapshot;app.selectedNode=saved.selectedNode;
    app.memoryUi.openCell(saved.selectedCell,saved.snapshot.evolutionProjection);return result;}
  function probeGroup(snapshot,edges,distanceValue,limb,mode){const probes=edges.map(edge=>probeEdge(snapshot,edge,distanceValue,limb,mode));
    return{edges,peak:summary(probes.map(value=>value.peak)),mean:summary(probes.map(value=>value.mean)),
      coverage:summary(probes.map(value=>value.coverage)),patternDepth:summary(probes.map(value=>value.patternDepth)),
      contrast:summary(probes.map(value=>value.contrast)),noise:Math.max(0,...probes.map(value=>value.noise)),
      batched:probes.every(value=>value.batched),probes};}
  function probeEdge(snapshot,edge,distanceValue,limb,mode){const camera=cameraForEdge(edge,distanceValue,limb),code=snapshot.evolutionEdge[edge],
      relation=evolutionRegionEdge(code),edgeData=new Uint8Array(snapshot.evolutionEdge);
    edgeData[edge]=EVOLUTION_CELL_EDGE.QUIET|((mode==='all'?EVOLUTION_REGION_EDGE.INTERNAL:relation)<<EVOLUTION_EDGE_REGION_SHIFT);
    const alternate={...snapshot,tick:snapshot.tick+10000+edge,evolutionEdge:edgeData},actual=[],suppressed=[];
    let batched=true;for(let repeat=0;repeat<3;repeat++)for(const [value,target] of [[snapshot,actual],[alternate,suppressed]]){
      renderer.render({snapshot:value,worldIdentity:null,camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
      if(repeat===0&&value===snapshot&&renderer.backend==='canvas2d')batched=renderer.lifeEdgeBatches.some((batch,style)=>
        style>0&&Array.from(batch.subarray(0,renderer.lifeEdgeBatchCounts[style])).includes(edge));
      target.push(edgePatches(edge,camera));}
    const signals=actual[0].line.map((value,index)=>patchDistance(value,suppressed[0].line[index])),peak=Math.max(0,...signals),
      signalMean=signals.reduce((sum,value)=>sum+value,0)/signals.length;let noise=0;
    for(let repeat=1;repeat<actual.length;repeat++)for(let point=0;point<actual[0].line.length;point++)
      noise=Math.max(noise,patchDistance(actual[0].line[point],actual[repeat].line[point]));
    const threshold=Math.max(.002,noise*4+.001),coverage=signals.filter(value=>value>threshold).length/signals.length,
      patternDepth=peak>threshold?1-Math.min(...signals)/peak:0,side=meanColor(actual[0].side),
      contrast=Math.max(...actual[0].center.map(color=>colorDistance(color,side)));
    return{edge,peak,mean:signalMean,coverage,patternDepth,contrast,noise,threshold,batched,signals};}
  function snapshotEdgeDifference(first,second,edge,distanceValue,limb){const camera=cameraForEdge(edge,distanceValue,limb),values=[];
    for(const snapshot of [first,second]){renderer.render({snapshot,worldIdentity:null,camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});
      values.push(edgePatches(edge,camera).line);}return Math.max(...values[0].map((value,index)=>patchDistance(value,values[1][index])));}
  function cellDifference(first,second,cell,distanceValue,limb){const camera=cameraForCells([cell],distanceValue,limb),values=[],repeats=[];
    for(let repeat=0;repeat<3;repeat++){const current=[];for(const snapshot of [first,second]){renderer.render({snapshot,worldIdentity:null,camera,
        selectedNode:null,highlightedCells:[],time:0,pulse:false});current.push(readPatchBytes(projectCell(cell,camera),5));}repeats.push(current);}
    const signal=patchDistance(repeats[0][0],repeats[0][1]);let noise=0;
    for(let repeat=1;repeat<repeats.length;repeat++)for(let side=0;side<2;side++)noise=Math.max(noise,patchDistance(repeats[0][side],repeats[repeat][side]));
    return{cell,signal,noise};}
  function edgePatches(edge,camera){const dual=renderer.backend==='webgl2'?renderer.world.geometry.dual:renderer.dual,
      a=projectPoint(dual.corners,dual.boundaryCornerA[edge],camera),b=projectPoint(dual.corners,dual.boundaryCornerB[edge],camera),
      dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length,line=[],center=[],side=[];
    for(const along of [.10,.18,.26,.34,.42,.50,.58,.66,.74,.82,.90])line.push(readPatchBytes([a[0]+dx*along,a[1]+dy*along],1));
    for(const along of [.25,.5,.75])for(const offset of [-6,-5,-1,0,1,5,6]){
      const color=readPatch([a[0]+dx*along+nx*offset,a[1]+dy*along+ny*offset],0);(Math.abs(offset)<=1?center:side).push(color);}
    return{line,center,side};}
  function cameraForEdge(edge,distanceValue,limb){return cameraForCells([EVOLUTION_TOPOLOGY.edgeA[edge],EVOLUTION_TOPOLOGY.edgeB[edge]],distanceValue,limb);}
  function cameraForCells(cells,distanceValue,limb){const camera={...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()},
      center=midpoint(cells);focusCamera(camera,limb?limbDirection(center):center);camera.dist=distanceValue;camera.offsetX=0;camera.offsetY=0;return camera;}
  function projectCell(cell,camera){if(renderer.backend==='canvas2d')return[renderer.px[cell],renderer.py[cell]];
    return projectPoint(EVOLUTION_TOPOLOGY.positions,cell,camera);}
  function projectPoint(points,index,camera){if(renderer.backend==='canvas2d')return[renderer.cornerX[index],renderer.cornerY[index]];
    const matrix=viewProjection(camera,renderer.canvas.width/renderer.canvas.height),at=index*3,x=points[at],y=points[at+1],z=points[at+2],
      clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],
      w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];return[(clipX/w*.5+.5)*renderer.canvas.width,(1-(clipY/w*.5+.5))*renderer.canvas.height];}
  function readPatch(point,radius){const data=readPatchBytes(point,radius),color=[0,0,0];for(let at=0;at<data.length;at+=4){color[0]+=data[at];color[1]+=data[at+1];color[2]+=data[at+2];}
    return color.map(value=>value/(data.length/4));}
  function readPatchBytes(point,radius){const size=radius*2+1,left=Math.max(0,Math.min(renderer.canvas.width-size,Math.round(point[0])-radius)),
      top=Math.max(0,Math.min(renderer.canvas.height-size,Math.round(point[1])-radius));if(renderer.backend==='webgl2'){const data=new Uint8Array(size*size*4);
      renderer.gl.readPixels(left,renderer.canvas.height-top-size,size,size,renderer.gl.RGBA,renderer.gl.UNSIGNED_BYTE,data);return data;}
    return renderer.ctx.getImageData(left,top,size,size).data;}
  function edgesWith(snapshot,status){return edgesWhere(snapshot,(a,b,value)=>value===status);}
  function edgesWhere(snapshot,predicate){const result=[];for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++){const a=EVOLUTION_TOPOLOGY.edgeA[edge],b=EVOLUTION_TOPOLOGY.edgeB[edge],
      status=evolutionCellEdgeStatus(snapshot.evolutionEdge[edge]),relation=evolutionRegionEdge(snapshot.evolutionEdge[edge]);if(predicate(a,b,status,relation))result.push(edge);}return result;}
  function incidentEdges(cell){const result=[];for(let edge=0;edge<EVOLUTION_TOPOLOGY.edgeCount;edge++)if(EVOLUTION_TOPOLOGY.edgeA[edge]===cell||EVOLUTION_TOPOLOGY.edgeB[edge]===cell)result.push(edge);return result;}
  function changedEdges(first,second){const result=[];for(let edge=0;edge<first.length;edge++)if(first[edge]!==second[edge])result.push(edge);return result;}
  function sample(values,limit){if(values.length<=limit)return values.slice();return Array.from({length:limit},(_,index)=>values[Math.round(index*(values.length-1)/(limit-1))]);}
  function firstCell(predicate){for(let cell=0;cell<EVOLUTION_TOPOLOGY.nodeCount;cell++)if(predicate(cell))return cell;return-1;}
  function summary(values){const sorted=values.slice().sort((a,b)=>a-b);return{minimum:sorted[0]??0,p50:sorted[Math.floor(sorted.length*.5)]??0,
    maximum:sorted.at(-1)??0};}
  function patchDistance(a,b){let result=0;for(let at=0;at<a.length;at+=4)result=Math.max(result,
    Math.hypot(a[at]-b[at],a[at+1]-b[at+1],a[at+2]-b[at+2])/(255*Math.sqrt(3)));return result;}
  function meanColor(values){return[0,1,2].map(axis=>values.reduce((sum,value)=>sum+value[axis],0)/values.length);}
  function colorDistance(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])/(255*Math.sqrt(3));}
  function midpoint(cells){const out=[0,0,0];for(const cell of cells)for(let axis=0;axis<3;axis++)out[axis]+=EVOLUTION_TOPOLOGY.positions[cell*3+axis];return normalize(out);}
  function limbDirection(center){const reference=Math.abs(center[1])<.9?[0,1,0]:[1,0,0],tangent=normalize(cross(reference,center));return normalize(center.map((value,index)=>value+tangent[index]*2));}
  function normalize(value){const length=Math.hypot(...value)||1;return value.map(axis=>axis/length);}
  function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  function sameNumbers(first,second){return first.length===second.length&&first.every((value,index)=>value===second[index]);}
  function equalBytes(first,second){return first.length===second.length&&first.every((value,index)=>value===second[index]);}
  function restore(){app.meta=saved.meta;app.memorySnapshot=saved.snapshot;app.selectedNode=saved.selectedNode;Object.assign(app.camera,saved.camera);
    app.memoryUi.openCell(saved.selectedCell,saved.snapshot.evolutionProjection);
    renderer.render({snapshot:saved.snapshot,worldIdentity:null,camera:app.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false});}
})()`; }
