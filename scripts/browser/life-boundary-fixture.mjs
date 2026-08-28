/** Controlled production-renderer probe for edge-primary life semantics. */
export async function runLifeBoundaryFixture(tools, { label = 'final', enforce = true } = {}) {
  const { click, evaluate, poll, screenshot, setViewport, wait } = tools;
  const viewport = await evaluate('({width:innerWidth,height:innerHeight})');
  await setViewport(960, 720); await wait(100);
  const start = await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,button=document.getElementById('begin-button'),rect=button?.getBoundingClientRect();
    return{phase:a?.phase,point:rect?[rect.left+rect.width/2,rect.top+rect.height/2]:null}})()`);
  if (['home', 'idle'].includes(start.phase) && start.point) await click(...start.point);
  if (!await poll(() => evaluate('window.__CELL_SPHERE_APP__?.phase'), (phase) => phase === 'running', 5000, 80)) {
    const phase = await evaluate('window.__CELL_SPHERE_APP__?.phase');
    throw new Error(`life-boundary fixture could not start a World (phase ${phase})`);
  }
  let report;
  try {
    report = await evaluate(fixtureExpression());
    const prefix = `browser-life-boundary-${label}-${report.backend}`;
    report.screenshots = {};
    for (const key of ['livingExposed', 'criticalExposed', 'resourceAbundant', 'resourceExhausted', 'history']) {
      await evaluate(`window.__CSG_LIFE_BOUNDARY_FIXTURE__.show(${JSON.stringify(key)})`); await wait(60);
      report.screenshots[key] = await screenshot(`${prefix}-${key}.png`);
    }
    if (enforce && !report.valid) throw new Error(`life-boundary semantic inequalities failed: ${JSON.stringify(report.checks)}`);
    return report;
  } finally {
    await evaluate(`window.__CSG_LIFE_BOUNDARY_FIXTURE__?.restore()`);
    await setViewport(viewport.width, viewport.height); await wait(80);
  }
}

function fixtureExpression() {
  return `(async()=>{
    const app=window.__CELL_SPHERE_APP__;
    if(!app?.developerMode)throw new Error('life-boundary fixture requires developer mode');
    const [{focusCamera,viewProjection},{LIFE_STATE}]=await Promise.all([
      import('./src/rendering/camera.js'),import('./src/core/life-state.js')]);
    const source=app.snapshot,topo=app.topo,fields=app.fields,renderer=app.renderer;
    if(!source?.lifeState?.length)throw new Error('life-boundary fixture has no production snapshot');
    const saved={historySnapshot:app.historySnapshot,historyPlaybackActive:app.historyPlaybackActive,
      selectedNode:app.selectedNode,historyHighlights:app.historyHighlights.slice(),lastRender:app.lastRender,
      camera:{...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()}};
    app.pause.set('browser-life-boundary',true);
    const sun=normalize([-.52,.72,.44]);
    const target=chooseEdge(false),geography=chooseEdge(true);
    if(target<0||geography<0)throw new Error('life-boundary fixture could not find controlled edges');
    const cellA=topo.edgeA[target],cellB=topo.edgeB[target];let tick=100000;
    const variants={
      control:make(),livingInternal:make('livingInternal'),livingExposed:make('livingExposed'),
      stressedInternal:make('stressedInternal'),stressedExposed:make('stressedExposed'),
      criticalInternal:make('criticalInternal'),criticalExposed:make('criticalExposed'),remains:make('remains'),
      resourceAbundant:make('livingInternal','abundant'),resourceExhausted:make('livingInternal','exhausted'),
      unoccupiedExhausted:make(null,'exhausted'),powered:make('livingInternal','abundant','powered'),
      transformedControl:make(null,'abundant',null,'transformed'),
      transformedExposed:make('livingExposed','abundant',null,'transformed'),
    };
    const samples={}; const timings={update:[],steady:[]}; let repeatNoise=0;
    for(const key of Object.keys(variants))samples[key]=probe(variants[key],target,'near',key);
    samples.selected=probe(variants.criticalExposed,target,'near','selected',{selectedNode:cellA});
    samples.history=probe(variants.criticalExposed,target,'near','history',{highlightedCells:[cellA]});
    samples.farControl=probe(variants.control,target,'far','farControl');
    samples.farExposed=probe(variants.livingExposed,target,'far','farExposed');
    samples.limbControl=probe(variants.control,target,'limb','limbControl');
    samples.limbExposed=probe(variants.livingExposed,target,'limb','limbExposed');
    const geoA=topo.edgeA[geography],geoB=topo.edgeB[geography];
    const geoControl=make(),geoLife=make();activate(geoLife,geoA,LIFE_STATE.LIVING,.35);geoLife.lifeState[geoB]=LIFE_STATE.UNOCCUPIED;
    samples.geographyControl=probe(geoControl,geography,'near','geographyControl');
    samples.geographyLife=probe(geoLife,geography,'near','geographyLife');
    const floor=.004,threshold=Math.max(floor,repeatNoise*3+.002);
    const metric={
      ordinaryInterior:distance(samples.livingInternal.interior,samples.control.interior),
      ordinaryInternalEdge:distance(samples.livingInternal.edge,samples.control.edge),
      ordinaryExposedEdge:distance(samples.livingExposed.edge,samples.control.edge),
      resourceUnoccupied:distance(samples.control.interior,samples.unoccupiedExhausted.interior),
      resourceOccupied:distance(samples.resourceAbundant.interior,samples.resourceExhausted.interior),
      stressExposed:distance(samples.stressedExposed.edge,samples.control.edge),
      criticalExposed:distance(samples.criticalExposed.edge,samples.control.edge),
      criticalLuminance:luminanceDistance(samples.criticalExposed.edge,samples.control.edge),
      stressLuminance:luminanceDistance(samples.stressedExposed.edge,samples.control.edge),
      poweredInterior:luminanceSigned(samples.powered.interior,samples.resourceAbundant.interior),
      selectedDelta:distance(samples.selected.overlay,samples.criticalExposed.overlay),
      historyDelta:distance(samples.history.overlay,samples.criticalExposed.overlay),
      transformedInterior:distance(samples.transformedControl.interior,samples.control.interior),
      transformedEdge:distance(samples.transformedExposed.edge,samples.transformedControl.edge),
      farExposed:distance(samples.farExposed.edge,samples.farControl.edge),
      limbExposed:distance(samples.limbExposed.edge,samples.limbControl.edge),
      geographyLife:distance(samples.geographyLife.edge,samples.geographyControl.edge),
      geographyControlContrast:meanColorDistance(samples.geographyControl.edge,samples.geographyControl.sides),
      geographyCoincidentContrast:meanColorDistance(samples.geographyLife.edge,samples.geographyLife.sides),
    };
    const classes=['livingExposed','stressedExposed','criticalExposed','remains'];const pairwise={};
    for(let left=0;left<classes.length;left++)for(let right=left+1;right<classes.length;right++){
      const key=classes[left]+'--'+classes[right];pairwise[key]=distance(samples[classes[left]].edge,samples[classes[right]].edge);
    }
    const checks={
      repeatCalibration:threshold>repeatNoise*3,
      ordinaryInteriorEdge:metric.ordinaryInterior<=metric.ordinaryInternalEdge*.35,
      ordinaryInteriorResource:metric.ordinaryInterior<=metric.resourceUnoccupied*.5,
      resourceRetention:metric.resourceOccupied>=metric.resourceUnoccupied*.8,
      frontierHierarchy:metric.ordinaryExposedEdge>=metric.ordinaryInternalEdge*1.25,
      stateSeparation:Object.values(pairwise).every((value)=>value>threshold),
      criticalNonColor:metric.criticalLuminance>=metric.stressLuminance*1.08&&metric.criticalLuminance-metric.stressLuminance>threshold,
      zeroChargeNoEmission:Math.max(0,luminanceSigned(samples.resourceAbundant.interior,samples.control.interior))<=threshold,
      poweredEmission:metric.poweredInterior>threshold,
      selectionDistinct:metric.selectedDelta>threshold,historyDistinct:metric.historyDelta>threshold,
      transformationPreserved:metric.transformedInterior>threshold&&metric.transformedEdge>threshold,
      nearFarLimb:metric.ordinaryExposedEdge>threshold&&metric.farExposed>threshold&&metric.limbExposed>threshold,
      coincidentGeography:metric.geographyLife>threshold&&metric.geographyControlContrast>threshold&&metric.geographyCoincidentContrast>threshold,
      boundedRenderer:renderer.backend==='webgl2'?renderer.drawCalls===4:true,
    };
    const audit=renderer.backend==='webgl2'?renderer.world.dynamicState():renderer.lastFrameAudit;
    const timing={steady:summarize(timings.steady),update:summarize(timings.update)};
    const api={variants,saved,show(key){const options=key==='history'?{highlightedCells:[cellA]}:{};show(variants[key]??variants.criticalExposed,target,'near',options);},
      restore(){app.historySnapshot=saved.historySnapshot;app.historyPlaybackActive=saved.historyPlaybackActive;app.selectedNode=saved.selectedNode;
        app.historyHighlights=saved.historyHighlights;Object.assign(app.camera,saved.camera);app.lastRender=saved.lastRender;app.pause.set('browser-life-boundary',false);delete window.__CSG_LIFE_BOUNDARY_FIXTURE__;}};
    window.__CSG_LIFE_BOUNDARY_FIXTURE__=api;api.show('livingExposed');
    return{schema:1,backend:renderer.backend,target:{edge:target,cellA,cellB,geographyEdge:geography},packing:{edgeCount:topo.edgeCount,
      compactBytes:renderer.backend==='webgl2'?renderer.world.lifeEdgeData?.byteLength:renderer.lifeEdgeData?.byteLength,
      expandedGpuBytes:renderer.backend==='webgl2'?renderer.world.boundaryLifeData?.byteLength:null,
      edgeUpdates:audit?.edgeUpdates??null,drawCalls:renderer.drawCalls??null},repeat:{renders:3,noise:repeatNoise,threshold,floor},
      metrics:metric,pairwise,checks,timing,valid:Object.values(checks).every(Boolean)};

    function chooseEdge(wantGeography){let best=-1,bestScore=-Infinity;for(let edge=0;edge<topo.edgeCount;edge++){
      const a=topo.edgeA[edge],b=topo.edgeB[edge],coast=fields.landMask[a]!==fields.landMask[b];
      const lakeA=fields.lakeId?.[a]??-1,lakeB=fields.lakeId?.[b]??-1,isGeography=coast||(lakeA!==lakeB&&(lakeA>=0||lakeB>=0));
      if(isGeography!==wantGeography)continue;if(!wantGeography&&(!fields.landMask[a]||!fields.landMask[b]))continue;
      const midpoint=midpointFor(edge),day=dot(midpoint,sun),sameBiome=fields.biomeId[a]===fields.biomeId[b]?1:0;
      const score=day+sameBiome*.18;if(score>bestScore){best=edge;bestScore=score;}}
      return best;}
    function make(life=null,resource='abundant',power=null,transform=null){const count=topo.nodeCount,snapshot={...source,tick:tick++,status:'running',entropy:0,luminousDevelopment:power?0.6:0,
      alive:new Uint8Array(count),biomass:new Float32Array(count),stress:new Float32Array(count),lifeState:new Uint8Array(count),
      electricityQ:new Uint8Array(count),transformationState:new Uint8Array(count),resourceRichnessQ:new Uint8Array(count),resourceState:new Uint8Array(count)};
      snapshot.resourceRichnessQ.fill(resource==='exhausted'?0:255);snapshot.resourceState.fill(resource==='exhausted'?6:1);
      if(life==='livingInternal'){activate(snapshot,cellA,LIFE_STATE.LIVING,.35);activate(snapshot,cellB,LIFE_STATE.LIVING,.35);}
      else if(life==='livingExposed')activate(snapshot,cellA,LIFE_STATE.LIVING,.35);
      else if(life==='stressedInternal'){activate(snapshot,cellA,LIFE_STATE.STRESSED,.76);activate(snapshot,cellB,LIFE_STATE.LIVING,.35);}
      else if(life==='stressedExposed')activate(snapshot,cellA,LIFE_STATE.STRESSED,.76);
      else if(life==='criticalInternal'){activate(snapshot,cellA,LIFE_STATE.CRITICAL,1);activate(snapshot,cellB,LIFE_STATE.LIVING,.35);}
      else if(life==='criticalExposed')activate(snapshot,cellA,LIFE_STATE.CRITICAL,1);
      else if(life==='remains'){snapshot.lifeState[cellA]=LIFE_STATE.DEAD_REMAINS;snapshot.biomass[cellA]=.28;}
      if(power){snapshot.electricityQ[cellA]=220;snapshot.electricityQ[cellB]=220;}
      if(transform){snapshot.transformationState[cellA]=4;snapshot.transformationState[cellB]=4;}
      return snapshot;}
    function activate(snapshot,cell,state,stress){snapshot.alive[cell]=1;snapshot.biomass[cell]=.72;snapshot.stress[cell]=stress;snapshot.lifeState[cell]=state;}
    function probe(snapshot,edge,mode,key,options={}){const camera=cameraFor(edge,mode);let first=null,noise=0;
      for(let repeat=0;repeat<3;repeat++){const started=performance.now();const accepted=renderer.render({snapshot,worldIdentity:app.worldIdentity,camera,
        selectedNode:options.selectedNode??null,highlightedCells:options.highlightedCells??[],time:0,pulse:false});const elapsed=performance.now()-started;
        (repeat?timings.steady:timings.update).push(elapsed);if(!accepted)throw new Error('fixture snapshot rejected: '+key);
        const masks=masksFor(edge,topo.edgeA[edge],camera),sample=readMasks(masks);if(!first)first=sample;
        else noise=Math.max(noise,distance(first.edge,sample.edge),distance(first.interior,sample.interior),distance(first.overlay,sample.overlay));}
      repeatNoise=Math.max(repeatNoise,noise);return first;}
    function show(snapshot,edge,mode,options={}){const camera=cameraFor(edge,mode);Object.assign(app.camera,camera);app.historySnapshot=snapshot;app.historyPlaybackActive=true;
      app.selectedNode=options.selectedNode??null;app.historyHighlights=options.highlightedCells??[];app.lastRender=-Infinity;renderer.render({snapshot,worldIdentity:app.worldIdentity,
        camera:app.camera,selectedNode:app.selectedNode,highlightedCells:app.historyHighlights,time:0,pulse:false});}
    function cameraFor(edge,mode){const camera={...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()},mid=midpointFor(edge);
      let direction=mid;if(mode==='limb'){const reference=Math.abs(mid[1])<.85?[0,1,0]:[1,0,0],tangent=normalize(cross(reference,mid));direction=normalize(mid.map((value,index)=>value*.72+tangent[index]*.694));}
      focusCamera(camera,direction);camera.dist=mode==='far'?4.1:2.2;camera.offsetX=0;camera.offsetY=0;return camera;}
    function masksFor(edge,cell,camera){const dual=renderer.backend==='webgl2'?renderer.world.geometry.dual:renderer.dual;
      const cornerA=dual.boundaryCornerA[edge],cornerB=dual.boundaryCornerB[edge],a=project(dual.corners,cornerA,camera),b=project(dual.corners,cornerB,camera),center=project(topo.positions,cell,camera);
      const polygon=[];for(let offset=dual.cellStart[cell];offset<dual.cellStart[cell+1];offset++)polygon.push(project(dual.corners,dual.cellCorners[offset],camera));
      let radius=Infinity;for(let index=0;index<polygon.length;index++)radius=Math.min(radius,pointSegment(center,polygon[index],polygon[(index+1)%polygon.length]).distance);
      const inset=polygon.map((point)=>[center[0]+(point[0]-center[0])*.83,center[1]+(point[1]-center[1])*.83]);
      return{edge:segmentMask(a,b,renderer.backend==='webgl2'?2.4:1.8,0,2.4),sides:segmentMask(a,b,6.5,3.5,6.5),
        interior:diskMask(center,Math.max(1.5,radius*.38)),overlay:polylineMask(inset,2.8)};}
    function project(points,index,camera){if(renderer.backend==='canvas2d'){
      if(points===topo.positions)return[renderer.px[index],renderer.py[index]];return[renderer.cornerX[index],renderer.cornerY[index]];}
      const matrix=viewProjection(camera,renderer.canvas.width/renderer.canvas.height),at=index*3,x=points[at],y=points[at+1],z=points[at+2];
      const clipX=matrix[0]*x+matrix[4]*y+matrix[8]*z+matrix[12],clipY=matrix[1]*x+matrix[5]*y+matrix[9]*z+matrix[13],w=matrix[3]*x+matrix[7]*y+matrix[11]*z+matrix[15];
      return[(clipX/w*.5+.5)*renderer.canvas.width,(1-(clipY/w*.5+.5))*renderer.canvas.height];}
    function segmentMask(a,b,outer,inner=0,max=outer){const result=[],minX=Math.max(0,Math.floor(Math.min(a[0],b[0])-outer)),maxX=Math.min(renderer.canvas.width-1,Math.ceil(Math.max(a[0],b[0])+outer));
      const minY=Math.max(0,Math.floor(Math.min(a[1],b[1])-outer)),maxY=Math.min(renderer.canvas.height-1,Math.ceil(Math.max(a[1],b[1])+outer));
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const hit=pointSegment([x+.5,y+.5],a,b);if(hit.t>.18&&hit.t<.82&&hit.distance>=inner&&hit.distance<=max)result.push([x,y]);}return result;}
    function polylineMask(points,width){const unique=new Map();for(let index=0;index<points.length;index++)for(const point of segmentMask(points[index],points[(index+1)%points.length],width,0,width))unique.set(point[0]+','+point[1],point);return[...unique.values()];}
    function diskMask(center,radius){const result=[];for(let y=Math.max(0,Math.floor(center[1]-radius));y<=Math.min(renderer.canvas.height-1,Math.ceil(center[1]+radius));y++)for(let x=Math.max(0,Math.floor(center[0]-radius));x<=Math.min(renderer.canvas.width-1,Math.ceil(center[0]+radius));x++)if(Math.hypot(x+.5-center[0],y+.5-center[1])<=radius)result.push([x,y]);return result;}
    function readMasks(masks){const points=[...masks.edge,...masks.sides,...masks.interior,...masks.overlay],xs=points.map((point)=>point[0]),ys=points.map((point)=>point[1]);
      const x=Math.min(...xs),y=Math.min(...ys),width=Math.max(...xs)-x+1,height=Math.max(...ys)-y+1;let data;
      if(renderer.backend==='webgl2'){data=new Uint8Array(width*height*4);renderer.gl.readPixels(x,renderer.canvas.height-y-height,width,height,renderer.gl.RGBA,renderer.gl.UNSIGNED_BYTE,data);}
      else data=renderer.ctx.getImageData(x,y,width,height).data;
      const take=(mask)=>{const result=new Uint8Array(mask.length*3);for(let index=0;index<mask.length;index++){const px=mask[index][0]-x,py=mask[index][1]-y,row=renderer.backend==='webgl2'?height-1-py:py,at=(row*width+px)*4;result.set(data.subarray(at,at+3),index*3);}return result;};
      return{edge:take(masks.edge),sides:take(masks.sides),interior:take(masks.interior),overlay:take(masks.overlay),
        counts:{edge:masks.edge.length,sides:masks.sides.length,interior:masks.interior.length,overlay:masks.overlay.length}};}
    function distance(left,right){const length=Math.min(left.length,right.length);if(!length)return Infinity;let sum=0;for(let at=0;at<length;at+=3)sum+=Math.hypot(left[at]-right[at],left[at+1]-right[at+1],left[at+2]-right[at+2])/(255*Math.sqrt(3));return sum/(length/3);}
    function luminanceDistance(left,right){const length=Math.min(left.length,right.length);let sum=0;for(let at=0;at<length;at+=3)sum+=Math.abs(luma(left,at)-luma(right,at))/255;return sum/(length/3);}
    function luminanceSigned(left,right){const length=Math.min(left.length,right.length);let sum=0;for(let at=0;at<length;at+=3)sum+=(luma(left,at)-luma(right,at))/255;return sum/(length/3);}
    function meanColorDistance(left,right){const l=meanColor(left),r=meanColor(right);return Math.hypot(l[0]-r[0],l[1]-r[1],l[2]-r[2])/(255*Math.sqrt(3));}
    function meanColor(values){const out=[0,0,0];for(let at=0;at<values.length;at+=3){out[0]+=values[at];out[1]+=values[at+1];out[2]+=values[at+2];}return out.map((value)=>value/(values.length/3));}
    function luma(values,at){return values[at]*.2126+values[at+1]*.7152+values[at+2]*.0722;}
    function summarize(values){const sorted=values.slice().sort((a,b)=>a-b),mean=values.reduce((sum,value)=>sum+value,0)/values.length;return{samples:values.length,mean,p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]};}
    function midpointFor(edge){const a=topo.edgeA[edge]*3,b=topo.edgeB[edge]*3;return normalize([topo.positions[a]+topo.positions[b],topo.positions[a+1]+topo.positions[b+1],topo.positions[a+2]+topo.positions[b+2]]);}
    function pointSegment(point,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy,t=length?Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/length)):0;return{t,distance:Math.hypot(point[0]-(a[0]+dx*t),point[1]-(a[1]+dy*t))};}
    function normalize(value){const length=Math.hypot(...value)||1;return value.map((axis)=>axis/length);}function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
    function cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
  })()`;
}
