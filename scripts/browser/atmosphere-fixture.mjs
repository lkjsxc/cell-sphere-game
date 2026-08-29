/** Controlled production-renderer evidence for the atmosphere silhouette. */
const VIEWPORTS = Object.freeze([
  [320, 568], [360, 640], [390, 844], [430, 932],
  [768, 1024], [844, 390], [1024, 600], [1440, 900],
]);
const ORIENTATIONS = Object.freeze([
  [.18, .34, .92], [-.71, .26, .65], [.62, -.67, .41], [-.24, -.88, -.40],
]);
const WEBGL_CONTOUR_LUMINANCE = 32;

export async function runAtmosphereFixture(tools, { label = 'final', enforce = true } = {}) {
  const { evaluate, screenshot, setViewport, wait } = tools;
  const originalViewport = await evaluate('({ width: innerWidth, height: innerHeight })');
  await evaluate(installExpression(WEBGL_CONTOUR_LUMINANCE));
  const rawCases = []; const images = {};
  let topology; let timing; let backend;
  try {
    backend = await evaluate('window.__CSG_ATMOSPHERE_FIXTURE__.backend');
    const selected = backend === 'webgl2' ? VIEWPORTS : [[320, 568], [1440, 900]];
    for (const [width, height] of selected) {
      await setViewport(width, height); await wait(50);
      for (const zoom of ['default', 'maximum']) {
        const orientations = [];
        for (let orientation = 0; orientation < ORIENTATIONS.length; orientation++) {
          const repetitions = orientation === 0 ? 3 : 1;
          orientations.push(await evaluate(`window.__CSG_ATMOSPHERE_FIXTURE__.probe(${JSON.stringify({
            width, height, zoom, direction: ORIENTATIONS[orientation], repetitions,
          })})`));
        }
        rawCases.push({ viewport: [width, height], zoom, orientations });
      }
    }
    topology = await evaluate('window.__CSG_ATMOSPHERE_FIXTURE__.topology()');
    timing = await evaluate('window.__CSG_ATMOSPHERE_FIXTURE__.timing()');
    for (const [width, height] of [[390, 844], [1440, 900]]) {
      if (backend === 'canvas2d' || VIEWPORTS.some((value) => value[0] === width && value[1] === height)) {
        await setViewport(width, height); await wait(40);
        await evaluate(`window.__CSG_ATMOSPHERE_FIXTURE__.show(${JSON.stringify({
          width, height, zoom: 'default', direction: ORIENTATIONS[0],
        })})`);
        const name = `browser-atmosphere-${label}-${backend}-${width}x${height}.png`;
        images[`${width}x${height}`] = { path: `reports/${name}`, ...await screenshot(name) };
      }
    }
  } finally {
    await setViewport(originalViewport.width, originalViewport.height); await wait(40);
    await evaluate('window.__CSG_ATMOSPHERE_FIXTURE__?.restore()'); await wait(40);
  }

  const measured = summarizeCases(rawCases); const repeat = summarize(measured.repeatSpreads);
  const contour = summarize(measured.orientationSpreads);
  const thresholds = { p95: Math.max(.35, repeat.p95 * 3), maximum: Math.max(.75, repeat.maximum * 3) };
  contour.spikesAboveMaximum = measured.orientationSpreads.filter((value) => value > thresholds.maximum).length;
  const defaultCases = measured.cases.filter((value) => value.zoom === 'default');
  const visibleCases = defaultCases.filter((value) => value.eligibleRays >= 48);
  const checks = {
    repeatCalibrated: repeat.samples > 0,
    defaultContourVisible: visibleCases.length === defaultCases.length,
    noContourHoles: visibleCases.every((value) => value.missingRays === 0 && value.disconnectedSections === 0),
    contourP95: contour.p95 <= thresholds.p95,
    contourMaximum: contour.maximum <= thresholds.maximum,
    topologyIndependent: topology.topologyIndependent,
    boundedGeometry: topology.probes.every((value) => value.vertices > 0 && value.indices > 0
      && value.triangles * 3 === value.indices && value.bufferUploads === 2
      && value.deletedBuffers === value.createdBuffers),
    fourDraws: backend === 'canvas2d' || timing.drawCalls === 4,
    noStaticFrameUploads: timing.staticUploads === 0,
    canvasStateResponse: backend === 'webgl2' || rawCases.filter((value) => value.zoom === 'default')
      .every((value) => value.orientations[0].stateResponse > 0),
  };
  const report = { schema: 2, fixture: 'atmosphere-silhouette-v1', backend, devicePixelRatio: 1,
    contourChannel: backend === 'webgl2' ? { channel: 'maximum RGB', luminance: WEBGL_CONTOUR_LUMINANCE,
      expectedCalmPeak: 63.6, peakFraction: WEBGL_CONTOUR_LUMINANCE / 63.6 }
      : { channel: 'calm-minus-pressure maximum RGB', luminance: .5 },
    viewports: (backend === 'webgl2' ? VIEWPORTS : [[320, 568], [1440, 900]]),
    zooms: ['default', 'maximum'], orientations: ORIENTATIONS.length, identicalRepetitions: 3,
    repeat, thresholds, contour, largestProjectedRadius: measured.largestProjectedRadius,
    cases: measured.cases, topology, timing, images, checks, valid: Object.values(checks).every(Boolean) };
  if (enforce && !report.valid) throw new Error(`atmosphere silhouette checks failed: ${JSON.stringify(checks)}`);
  return report;
}

function summarizeCases(rawCases) {
  const repeatSpreads = []; const orientationSpreads = []; const cases = []; let largestProjectedRadius = 0;
  for (const value of rawCases) {
    const first = value.orientations[0]; largestProjectedRadius = Math.max(largestProjectedRadius, first.projectedRadius);
    for (let ray = 0; ray < first.radii[0].length; ray++) {
      const repetitions = first.radii.map((radii) => radii[ray]).filter(Number.isFinite);
      if (repetitions.length === first.radii.length) repeatSpreads.push(Math.max(...repetitions) - Math.min(...repetitions));
    }
    const centered = value.orientations.map((orientation) => {
      const radii = orientation.radii[0]; const center = quantile(radii.filter(Number.isFinite), .5);
      return radii.map((radius) => Number.isFinite(radius) ? radius - center : null);
    });
    const caseSpreads = [];
    for (let ray = 0; ray < centered[0].length; ray++) {
      const radii = centered.map((values) => values[ray]).filter(Number.isFinite);
      if (radii.length === centered.length) { const spread = Math.max(...radii) - Math.min(...radii);
        orientationSpreads.push(spread); caseSpreads.push(spread); }
    }
    const eligibleRays = Math.min(...value.orientations.map((orientation) => orientation.eligibleRays));
    const missingRays = value.orientations.reduce((sum, orientation) => sum + orientation.missingRays, 0);
    const disconnectedSections = value.orientations.reduce((sum, orientation) =>
      sum + Math.max(0, orientation.hitSections - orientation.eligibleSections), 0);
    cases.push({ viewport: value.viewport, zoom: value.zoom, projectedCenter: first.projectedCenter,
      projectedRadius: first.projectedRadius, measuredRadius: summarize(value.orientations.flatMap((orientation) =>
        orientation.radii[0].filter(Number.isFinite))), orientationSpread: summarize(caseSpreads), eligibleRays, missingRays, disconnectedSections,
      glErrors: value.orientations.map((orientation) => orientation.error),
      contourVisible: eligibleRays >= 48, stateResponse: first.stateResponse ?? null });
  }
  return { cases, repeatSpreads, orientationSpreads, largestProjectedRadius };
}

function summarize(values) {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  return { samples: finite.length, p50: quantile(finite, .5), p95: quantile(finite, .95),
    maximum: finite.length ? finite[finite.length - 1] : null };
}
function quantile(sortedValues, fraction) {
  if (!sortedValues.length) return null;
  const values = sortedValues.every((value, index) => !index || sortedValues[index - 1] <= value)
    ? sortedValues : sortedValues.slice().sort((a, b) => a - b);
  const at = (values.length - 1) * fraction; const lower = Math.floor(at); const upper = Math.ceil(at);
  return values[lower] + (values[upper] - values[lower]) * (at - lower);
}

function installExpression(webglContourLuminance) {
  return `(async()=>{
    const app=window.__CELL_SPHERE_APP__;if(!app?.developerMode)throw new Error('atmosphere fixture requires developer mode');
    const [{focusCamera,viewProjection,cameraEye,zoom,FOV_Y},{safeLayout,projectedSphereDiameter},{createTopology},
      {GLRenderer},{createFields},{createRng}]=await Promise.all([import('./src/rendering/camera.js'),
      import('./src/interface/policies/layout-policy.js'),import('./src/world/icosphere.js'),import('./src/rendering/renderer.js'),
      import('./src/world/fields.js'),import('./src/core/prng.js')]);
    const renderer=app.renderer,backend=renderer.backend,saved={lastRender:app.lastRender,last:app.last,
      camera:{...app.camera,direction:app.camera.direction.slice(),right:app.camera.right.slice(),up:app.camera.up.slice()}};
    cancelAnimationFrame(app.rafId);const ATMOSPHERE_RADIUS=1.095,RAYS=720,STEP=.125,SEARCH=8;
    const snapshot=()=>app.snapshot??app.showcase?.snapshot;
    function cameraFor(input){const layout=safeLayout(input.width,input.height,'world'),camera={...saved.camera,
      direction:saved.camera.direction.slice(),right:saved.camera.right.slice(),up:saved.camera.up.slice(),
      dist:layout.distance,offsetX:layout.offsetX,offsetY:layout.offsetY};focusCamera(camera,input.direction);
      if(input.zoom==='maximum')zoom(camera,0);return camera;}
    function prepare(input){renderer.resize(input.width,input.height,1);const camera=cameraFor(input);
      const matrix=viewProjection(camera,input.width/input.height),center=project(matrix,[0,0,0],input.width,input.height);
      const radius=projectedSphereDiameter(camera.dist,input.height,FOV_Y,ATMOSPHERE_RADIUS)/2;
      return{camera,matrix,center,radius,width:renderer.canvas.width,height:renderer.canvas.height};}
    function renderWebGL(state){const gl=renderer.gl,world=renderer.world,program=world.programs.atmosphere;
      gl.viewport(0,0,state.width,state.height);gl.disable(gl.SCISSOR_TEST);gl.disable(gl.DITHER);gl.disable(gl.DEPTH_TEST);
      gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);
      gl.enable(gl.CULL_FACE);gl.cullFace(gl.FRONT);gl.useProgram(program.program);gl.uniformMatrix4fv(program.u.get('uViewProj'),false,state.matrix);
      gl.uniform3fv(program.u.get('uEye'),cameraEye(state.camera));gl.uniform1f(program.u.get('uEntropy'),0);
      gl.bindVertexArray(world.atmosphereVao);gl.drawElements(gl.TRIANGLES,world.atmosphereCount,
        world.atmosphereIndexType,0);gl.finish();const data=new Uint8Array(state.width*state.height*4);
      gl.readPixels(0,0,state.width,state.height,gl.RGBA,gl.UNSIGNED_BYTE,data);const error=gl.getError();gl.disable(gl.CULL_FACE);
      return{data,error};}
    function renderCanvas(state,entropy){const value=snapshot(),scene={snapshot:{...value,entropy},worldIdentity:app.worldIdentity,
      camera:state.camera,selectedNode:null,highlightedCells:[],time:0,pulse:false};if(!renderer.render(scene))throw new Error('Canvas fixture render rejected');
      return new Uint8ClampedArray(renderer.ctx.getImageData(0,0,state.width,state.height).data);}
    function probe(input){const state=prepare(input),radii=[];let error=0,stateResponse=null;
      let analysis;if(backend==='webgl2'){for(let repeat=0;repeat<input.repetitions;repeat++){const result=renderWebGL(state);error|=result.error;
        const measured=measure(result.data,state.width,state.height,state.center,state.radius,${webglContourLuminance},false);radii.push(measured.radii);analysis??=measured.analysis;}}
      else{let first;for(let repeat=0;repeat<input.repetitions;repeat++){const calm=renderCanvas(state,0),pressure=renderCanvas(state,1),difference=new Uint8Array(calm.length);
        for(let at=0;at<calm.length;at+=4){difference[at]=Math.abs(calm[at]-pressure[at]);difference[at+1]=Math.abs(calm[at+1]-pressure[at+1]);difference[at+2]=Math.abs(calm[at+2]-pressure[at+2]);difference[at+3]=255;}
        const canvasRadius=Math.min(state.width,state.height)*(renderer.canvas.clientWidth<600?.76:.52)*(3.1/state.camera.dist)*1.25;
        first=measure(difference,state.width,state.height,state.center,canvasRadius,.5,true);radii.push(first.radii);analysis??=first.analysis;
        stateResponse=annulusLuma(calm,pressure,state.width,state.height,state.center,canvasRadius/1.25,.94,1.08);}
        state.radius=Math.min(state.width,state.height)*(renderer.canvas.clientWidth<600?.76:.52)*(3.1/state.camera.dist)*1.25;}
      return{radii,projectedCenter:state.center,projectedRadius:state.radius,error,
        eligibleRays:analysis.eligible,missingRays:analysis.missing,eligibleSections:analysis.eligibleSections,
        hitSections:analysis.hitSections,stateResponse};}
    function show(input){const state=prepare(input);if(backend==='webgl2')renderWebGL(state);else renderCanvas(state,0);return true;}
    async function topology(){if(backend!=='webgl2')return{topologyIndependent:true,authority:'analytic projected radial gradient',probes:[]};
      const levels=[2,3,4],probes=[];for(const level of levels)probes.push(await probeTopology(level));
      return{topologyIndependent:new Set(probes.map(value=>value.signature)).size===1&&new Set(probes.map(value=>value.indices)).size===1,
        authority:'fixed-renderer',probes};}
    async function probeTopology(level){const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
      const gl=canvas.getContext('webgl2',{antialias:true,alpha:false});if(!gl)throw new Error('topology probe WebGL2 unavailable');
      const uploads=[],originalBufferData=gl.bufferData,originalDeleteBuffer=gl.deleteBuffer;let deletedBuffers=0;
      gl.bufferData=function(target,data,...rest){uploads.push({target,bytes:typeof data==='number'?data:data?.byteLength??null});return originalBufferData.call(gl,target,data,...rest);};
      gl.deleteBuffer=function(buffer){deletedBuffers++;return originalDeleteBuffer.call(gl,buffer);};
      const gameplay=createTopology(level),candidate=new GLRenderer(canvas,gameplay,createFields(createRng(42),gameplay),{developerMode:true});
      const world=candidate.world,geometry=world.atmosphereGeometry;if(!geometry)throw new Error('fixed atmosphere geometry missing');
      const positions=geometry.positions,indices=geometry.indices;
      const atmosphereUploads=uploads.slice(-2),createdBuffers=world.buffers.length;candidate.dispose();gl.bufferData=originalBufferData;gl.deleteBuffer=originalDeleteBuffer;
      gl.getExtension('WEBGL_lose_context')?.loseContext();return{gameplayLevel:level,vertices:positions.length/3,
        indices:indices.length,triangles:indices.length/3,indexType:indices.constructor.name,cpuBytes:positions.byteLength+indices.byteLength,
        gpuBytes:atmosphereUploads.reduce((sum,value)=>sum+(value.bytes??0),0),signature:signature(positions,indices),
        bufferUploads:atmosphereUploads.length,totalBufferUploads:uploads.length,atmosphereUploadBytes:atmosphereUploads.map(value=>value.bytes),
        createdBuffers,deletedBuffers};}
    function timing(){const state=prepare({width:1440,height:900,zoom:'default',direction:[.18,.34,.92]}),value=snapshot();
      if(!value)return{drawCalls:null,staticUploads:0,steady:{samples:0,p50:null,p95:null},rotating:{samples:0,p50:null,p95:null}};
      const gl=backend==='webgl2'?renderer.gl:null,scene={snapshot:value,worldIdentity:app.worldIdentity,camera:state.camera,
        selectedNode:null,highlightedCells:[],time:0,pulse:false};let staticUploads=0,drawCalls=null,bufferData;
      if(gl){bufferData=gl.bufferData;gl.bufferData=function(...args){staticUploads++;return bufferData.apply(gl,args);};
        let draws=0,arrays=gl.drawArrays,elements=gl.drawElements;gl.drawArrays=function(...args){draws++;return arrays.apply(gl,args);};
        gl.drawElements=function(...args){draws++;return elements.apply(gl,args);};renderer.render(scene);gl.finish();drawCalls=draws;
        gl.drawArrays=arrays;gl.drawElements=elements;}
      const steady=cohort(false),rotating=cohort(true);if(gl)gl.bufferData=bufferData;return{drawCalls,staticUploads,steady,rotating};
      function cohort(rotating){const samples=[];for(let warm=0;warm<24;warm++){if(rotating)turn(scene.camera);renderer.render(scene);if(gl)gl.finish();}
        for(let index=0;index<120;index++){if(rotating)turn(scene.camera);if(gl)gl.finish();const start=performance.now();renderer.render(scene);if(gl)gl.finish();samples.push(performance.now()-start);}
        samples.sort((a,b)=>a-b);return{samples:samples.length,p50:q(samples,.5),p95:q(samples,.95)};}}
    function restore(){Object.assign(app.camera,saved.camera);app.lastRender=saved.lastRender;app.last=performance.now();
      app.renderer.render({snapshot:snapshot()??null,worldIdentity:app.scene==='world'?app.worldIdentity:null,camera:app.camera,
        selectedNode:app.selectedNode,highlightedCells:app.historyHighlights,time:performance.now()/1000,pulse:app.settings.motion!=='reduced'});
      delete window.__CSG_ATMOSPHERE_FIXTURE__;app.rafId=requestAnimationFrame(time=>app.frame(time));}
    function measure(data,width,height,center,radius,threshold,topOrigin){const radii=Array(RAYS).fill(null),eligible=Array(RAYS).fill(false);
      for(let ray=0;ray<RAYS;ray++){const angle=ray*Math.PI*2/RAYS,dx=Math.cos(angle),dy=Math.sin(angle);
        if(!inside(center[0]+dx*(radius+2),center[1]+dy*(radius+2),width,height)||!inside(center[0]+dx*(radius-SEARCH),center[1]+dy*(radius-SEARCH),width,height))continue;
        eligible[ray]=true;
        let outside=sample(data,width,height,center[0]+dx*(radius+2),center[1]+dy*(radius+2),topOrigin);
        for(let step=1;step<=Math.ceil((SEARCH+2)/STEP);step++){const r=radius+2-step*STEP,current=sample(data,width,height,center[0]+dx*r,center[1]+dy*r,topOrigin);
          if(current>threshold&&outside<=threshold){const amount=(threshold-outside)/Math.max(1e-9,current-outside);radii[ray]=r+STEP*(1-amount);break;}outside=current;}}
      const hitMask=radii.map(Number.isFinite),eligibleCount=eligible.filter(Boolean).length,hit=hitMask.filter(Boolean).length;
      return{radii,analysis:{eligible:eligibleCount,missing:eligibleCount-hit,eligibleSections:segments(eligible),hitSections:segments(hitMask)}};}
    function sample(data,width,height,x,y,topOrigin){const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0;
      const value=(px,py)=>{const row=topOrigin?py:height-1-py,at=(row*width+px)*4;return Math.max(data[at],data[at+1],data[at+2]);};
      return value(x0,y0)*(1-fx)*(1-fy)+value(x0+1,y0)*fx*(1-fy)+value(x0,y0+1)*(1-fx)*fy+value(x0+1,y0+1)*fx*fy;}
    function annulusLuma(calm,pressure,width,height,center,radius,inner,outer){let sum=0,count=0;for(let y=0;y<height;y+=2)for(let x=0;x<width;x+=2){const d=Math.hypot(x-center[0],y-center[1])/radius;if(d<inner||d>outer)continue;
      const at=(y*width+x)*4,l=(data)=>data[at]*.2126+data[at+1]*.7152+data[at+2]*.0722;sum+=l(calm)-l(pressure);count++;}return count?sum/count:0;}
    function project(matrix,point,width,height){const x=matrix[0]*point[0]+matrix[4]*point[1]+matrix[8]*point[2]+matrix[12],
      y=matrix[1]*point[0]+matrix[5]*point[1]+matrix[9]*point[2]+matrix[13],w=matrix[3]*point[0]+matrix[7]*point[1]+matrix[11]*point[2]+matrix[15];
      return[(x/w*.5+.5)*width,(1-(y/w*.5+.5))*height];}
    function signature(positions,indices){let hash=2166136261;for(const values of [new Uint8Array(positions.buffer,positions.byteOffset,positions.byteLength),new Uint8Array(indices.buffer,indices.byteOffset,indices.byteLength)])for(const value of values)hash=Math.imul(hash^value,16777619);return(hash>>>0).toString(16).padStart(8,'0');}
    function segments(mask){if(!mask.some(Boolean))return 0;if(mask.every(Boolean))return 1;let count=0;for(let i=0;i<mask.length;i++)if(mask[i]&&!mask[(i+mask.length-1)%mask.length])count++;return count;}
    function inside(x,y,width,height){return x>=1&&y>=1&&x<width-2&&y<height-2;}function turn(camera){const d=camera.direction,r=camera.right;
      camera.direction=[d[0]*.99995+r[0]*.01,d[1]*.99995+r[1]*.01,d[2]*.99995+r[2]*.01];focusCamera(camera,camera.direction);}
    function q(values,fraction){const at=(values.length-1)*fraction,a=Math.floor(at),b=Math.ceil(at);return values[a]+(values[b]-values[a])*(at-a);}
    window.__CSG_ATMOSPHERE_FIXTURE__={backend,probe,show,topology,timing,restore};return true;
  })()`;
}
