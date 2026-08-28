/** Controlled browser luminance probe for the authoritative whole-cell charge hierarchy. */
export async function measureLuminousHierarchy(evaluate) {
  return evaluate(`(async()=>{
    const a=window.__CELL_SPHERE_APP__,{focusCamera}=await import('./src/rendering/camera.js');
    const source=a.historySnapshot,positions=a.topo.positions;
    if(!source?.electricityQ?.length)return{valid:false,reason:'missing charged snapshot'};
    const sun=[-.52,.72,.44];
    const choose=(day)=>{let best=-1,bestCharge=-1;for(let cell=0;cell<source.electricityQ.length;cell++){
      const dot=positions[cell*3]*sun[0]+positions[cell*3+1]*sun[1]+positions[cell*3+2]*sun[2];
      if(source.electricityQ[cell]>0&&(day?dot>.55:dot<-.70)&&source.alive[cell]&&source.lifeState[cell]&&source.electricityQ[cell]>bestCharge){best=cell;bestCharge=source.electricityQ[cell];}
    }return best;};
    const dayCell=choose(true),nightCell=choose(false);if(dayCell<0||nightCell<0)return{valid:false,reason:'missing day or night powered cell',dayCell,nightCell};
    const saved={direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice(),offsetX:a.camera.offsetX,offsetY:a.camera.offsetY,dist:a.camera.dist};
    const variant=(mode,cell)=>{const alive=source.alive.slice(),lifeState=source.lifeState.slice(),biomass=source.biomass.slice(),electricityQ=source.electricityQ.slice();
      if(mode!=='powered')electricityQ.fill(0);if(mode==='unoccupied'){alive[cell]=0;lifeState[cell]=0;biomass[cell]=0;}
      return{...source,alive,lifeState,biomass,electricityQ,luminousDevelopment:mode==='powered'?source.luminousDevelopment:0};};
    const luminance=()=>{const canvas=a.canvas,side=Math.max(14,Math.floor(Math.min(canvas.width,canvas.height)*.025)),x=Math.max(0,Math.floor(canvas.width/2-side)),y=Math.max(0,Math.floor(canvas.height/2-side)),size=Math.min(side*2,canvas.width-x,canvas.height-y);let pixels;
      if(a.renderer.backend==='webgl2'){pixels=new Uint8Array(size*size*4);a.renderer.gl.readPixels(x,y,size,size,a.renderer.gl.RGBA,a.renderer.gl.UNSIGNED_BYTE,pixels);}
      else pixels=a.renderer.ctx.getImageData(x,y,size,size).data;
      let sum=0;for(let index=0;index<pixels.length;index+=4)sum+=(pixels[index]*.2126+pixels[index+1]*.7152+pixels[index+2]*.0722)/255;return sum/(pixels.length/4);};
    const probe=(mode,cell)=>{focusCamera(a.camera,positions.subarray(cell*3,cell*3+3));a.camera.offsetX=0;a.camera.offsetY=0;a.camera.dist=2.5;a.lastRender=-Infinity;
      const accepted=a.renderer.render({snapshot:variant(mode,cell),worldIdentity:a.worldIdentity,camera:a.camera,selectedNode:null,highlightedCells:[],time:performance.now()/1000,pulse:false});return{value:luminance(),accepted,cell,charge:source.electricityQ[cell]};};
    try{const unoccupiedDark=probe('unoccupied',nightCell),ordinaryDark=probe('ordinary',nightCell),ordinaryDay=probe('ordinary',dayCell),poweredDay=probe('powered',dayCell),poweredDark=probe('powered',nightCell);
      const values={unoccupiedDark,ordinaryDark,ordinaryDay,poweredDay,poweredDark};const dayEmission=poweredDay.value-ordinaryDay.value,nightEmission=poweredDark.value-ordinaryDark.value;
      const zeroChargeDelta=ordinaryDark.value-unoccupiedDark.value;
      const zeroChargeEmission=Math.max(0,zeroChargeDelta);
      // Daylight changes the whole material, so compare paired charged/unpowered
      // cells before ordering emission. This measures the renderer's semantic
      // hierarchy rather than mistaking sunlight for biological charge.
      const semanticDay=ordinaryDark.value+dayEmission,semanticNight=ordinaryDark.value+nightEmission;
      const valid=Object.values(values).every((entry)=>entry.accepted&&Number.isFinite(entry.value))
        &&zeroChargeEmission<Math.max(.012,dayEmission*.75)&&dayEmission>0&&nightEmission>dayEmission
        &&ordinaryDark.value<semanticDay&&semanticDay<semanticNight;
      return{backend:a.renderer.backend,values,emission:{day:dayEmission,night:nightEmission,semanticDay,semanticNight,zeroChargeDelta,zeroChargeEmission},valid};
    }finally{Object.assign(a.camera,saved);a.lastRender=-Infinity;}
  })()`);
}
