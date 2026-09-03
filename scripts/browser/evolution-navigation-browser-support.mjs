/** Trusted keyboard, focus, announcement, and purchase-isolation evidence. */
export async function runEvolutionKeyboardNavigation({ evaluate, key, wait }) {
  const topology = await evaluate(`(async()=>{const {EVOLUTION_LAYOUT,EVOLUTION_TOPOLOGY}=await import('./src/game/skills/index.js');
    const a=window.__CELL_SPHERE_APP__;window.__CSG_EVOLUTION_KEYBOARD_RESTORE__={meta:a.meta,archive:a.archive,
      selectedCell:a.memoryUi.selectedCell,selectedNode:a.selectedNode,scene:a.scene,live:document.getElementById('live-region').textContent,
      lastPurchaseAt:a.evolutionActivation.lastPurchaseAt,camera:{...a.camera,direction:a.camera.direction.slice(),right:a.camera.right.slice(),up:a.camera.up.slice()}};
    return{nodeCount:EVOLUTION_TOPOLOGY.nodeCount,root:EVOLUTION_LAYOUT.rootCell,ring:Array.from(EVOLUTION_LAYOUT.rootRing)}})()`);
  const prepare = async (mode, selectedCell = null, focus = 'canvas') => {
    const value = await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,[{defaultMeta,validateMeta},{EVOLUTION_LAYOUT,EVOLUTION_TOPOLOGY,buildEvolutionSnapshot}]=await Promise.all([
      import('./src/platform/storage.js'),import('./src/game/skills/index.js')]);a.selectScene('evolution');if(a.overlay==='memory-node')a.closeEvolutionCell();
      const mode=${JSON.stringify(mode)},levels=mode==='all-owned'?Array.from({length:EVOLUTION_TOPOLOGY.nodeCount},(_,cell)=>({cell,level:'1'}))
        :mode==='root-ring'?[EVOLUTION_LAYOUT.rootCell,...EVOLUTION_LAYOUT.rootRing].sort((left,right)=>left-right).map(cell=>({cell,level:'1'}))
          :mode==='root' || mode==='poor'?[{cell:EVOLUTION_LAYOUT.rootCell,level:'1'}]:[],
        balance=mode==='poor'?'0':'999999999999999999999999999999999999999999999999999999999999';
      a.meta=validateMeta({...defaultMeta(),echoBalance:balance,totalEchoes:balance,evolutionLevels:levels,evolutionTransactionKeys:[]});
      a.archive={...a.archive,evolution:[]};a.selectedNode=null;a.memorySnapshot=buildEvolutionSnapshot(a.meta);a.evolutionActivation.lastPurchaseAt=-Infinity;
      const selected=${JSON.stringify(selectedCell)};if(Number.isInteger(selected))a.selectEvolutionCell(selected,'keyboard');
      const p=a.memorySnapshot.evolutionProjection,ready=Array.from(p.readyCells).sort((left,right)=>left-right);
      return{mode,ownedCount:p.ownedCellCount,ready,unownedReady:ready.filter(cell=>!p.owned[cell]),ownedReady:ready.filter(cell=>p.owned[cell]),
        levels:JSON.stringify(a.meta.evolutionLevels),events:a.archive.evolution.length}})()`);
    await wait(60);
    await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__,target=${JSON.stringify(focus)}==='heading'
      ?document.getElementById('memory-node-heading'):a.canvas;target.focus({preventScroll:true})})()`);
    await wait(20); return value;
  };
  const read = () => evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,{EVOLUTION_TOPOLOGY,evolutionCellState}=await import('./src/game/skills/index.js'),
    cell=a.memoryUi.selectedCell??a.selectedNode,valid=Number.isInteger(cell)&&cell>=0&&cell<EVOLUTION_TOPOLOGY.nodeCount,
    state=valid?evolutionCellState(a.memorySnapshot.evolutionProjection,cell,cell):null,active=document.activeElement,panel=document.getElementById('memory-node-panel');
    let cameraAlignment=null;if(valid){const at=cell*3;cameraAlignment=a.camera.direction[0]*EVOLUTION_TOPOLOGY.positions[at]
      +a.camera.direction[1]*EVOLUTION_TOPOLOGY.positions[at+1]+a.camera.direction[2]*EVOLUTION_TOPOLOGY.positions[at+2];}
    return{scene:a.scene,selected:valid?cell:null,localLevel:state?.localLevel??null,owned:state?.owned??null,
      overlay:a.overlay,focus:active?.id??null,focusVisible:Boolean(active?.matches?.(':focus-visible')),cameraAlignment,
      heading:document.getElementById('memory-node-heading').textContent,description:a.memoryUi.accessibleDescription,
      live:document.getElementById('live-region').textContent,levels:JSON.stringify(a.meta.evolutionLevels),events:a.archive.evolution.length,
      detailButtons:panel.querySelectorAll('button').length,liveRegions:document.querySelectorAll('[aria-live]').length,
      obsoleteControls:document.querySelectorAll('#evolution-navigator,#evolution-current,#evolution-previous,#evolution-next,#evolution-frontier,#evolution-neighbors').length,
      canvasShortcuts:a.canvas.getAttribute('aria-keyshortcuts'),headingShortcuts:document.getElementById('memory-node-heading').getAttribute('aria-keyshortcuts')}})()`);
  const press = async (name, keyName, expected, expectedFocus, options = {}) => {
    const before = await read(); await key(keyName, options); await wait(70); const after = await read();
    const navigated = after.selected === expected && after.focus === expectedFocus && after.overlay === 'memory-node'
      && after.levels === before.levels && after.events === before.events && after.cameraAlignment > .999
      && after.description.includes(`Cell ${expected + 1} of ${topology.nodeCount}`) && after.live === after.description
      && after.detailButtons === 2 && after.obsoleteControls === 0 && after.liveRegions === 2 && after.focusVisible;
    return { name, key: keyName, options, expected, before, after, valid: navigated };
  };
  const reports = []; let focus = null; let boundaries = null; let activation = null; let noReady = null;
  try {
    await prepare('fresh', null, 'canvas');
    reports.push(await press('invalid selection enters backward order', 'ArrowLeft', topology.nodeCount - 1, 'gl-canvas'));
    reports.push(await press('last cell wraps forward', 'ArrowRight', 0, 'gl-canvas'));
    reports.push(await press('authored root', 'Home', topology.root, 'gl-canvas'));
    reports.push(await press('one ready cell forward', 'PageDown', topology.root, 'gl-canvas'));
    reports.push(await press('one ready cell backward', 'PageUp', topology.root, 'gl-canvas'));

    let fixture = await prepare('root', topology.root, 'canvas');
    const nextUnowned = fixture.unownedReady.find((cell) => cell > topology.root) ?? fixture.unownedReady[0];
    reports.push(await press('root-only unowned preference', 'PageDown', nextUnowned, 'gl-canvas'));
    fixture = await prepare('root', fixture.unownedReady[0], 'heading');
    reports.push(await press('ready backward wrap on detail', 'PageUp', fixture.unownedReady.at(-1), 'memory-node-heading'));
    reports.push(await press('ready forward wrap on detail', 'PageDown', fixture.unownedReady[0], 'memory-node-heading'));
    reports.push(await press('numeric traversal on detail', 'ArrowRight', (fixture.unownedReady[0] + 1) % topology.nodeCount, 'memory-node-heading'));

    fixture = await prepare('root-ring', topology.root, 'canvas');
    const ringTarget = fixture.unownedReady.find((cell) => cell > topology.root) ?? fixture.unownedReady[0];
    const ringStep = await press('root-plus-ring unowned preference', 'PageDown', ringTarget, 'gl-canvas');
    ringStep.fixture = fixture; ringStep.valid &&= fixture.ownedCount === 7 && fixture.unownedReady.length > 0 && ringStep.after.owned === false; reports.push(ringStep);

    fixture = await prepare('all-owned', topology.nodeCount - 1, 'canvas');
    const ownedForward = await press('owned refinement fallback forward', 'PageDown', 0, 'gl-canvas');
    ownedForward.fixture = { ownedCount:fixture.ownedCount, unownedReady:fixture.unownedReady.length, ownedReady:fixture.ownedReady.length };
    ownedForward.valid &&= fixture.ownedCount === topology.nodeCount && fixture.unownedReady.length === 0 && ownedForward.after.owned === true; reports.push(ownedForward);
    const ownedBackward = await press('owned refinement fallback backward', 'PageUp', topology.nodeCount - 1, 'gl-canvas');
    ownedBackward.valid &&= ownedBackward.after.owned === true; reports.push(ownedBackward);

    await prepare('poor', topology.root, 'heading'); const noReadyBefore = await read(); await key('PageDown'); await wait(70);
    const noReadyAfter = await read(); noReady = { before:noReadyBefore, after:noReadyAfter,
      valid:noReadyAfter.selected===noReadyBefore.selected&&noReadyAfter.focus==='memory-node-heading'
        &&noReadyAfter.levels===noReadyBefore.levels&&noReadyAfter.events===noReadyBefore.events
        &&noReadyAfter.live==='No ready Evolution cell.'&&noReadyAfter.focusVisible };

    await prepare('fresh', topology.root, 'canvas'); const ignored=[];
    for (const [name, options] of [['repeat',{repeat:true}],['shift',{shift:true}],['control',{ctrl:true}],['alt',{alt:true}],['meta',{meta:true}]]) {
      const before=await read();await key('ArrowRight',options);await wait(40);const after=await read();
      ignored.push({name,options,before,after,valid:after.selected===before.selected&&after.focus===before.focus
        &&after.levels===before.levels&&after.events===before.events&&after.live===before.live});
    }
    const native=[];for(const id of ['memory-unlock','memory-node-close']){await evaluate(`document.getElementById(${JSON.stringify(id)}).focus({preventScroll:true})`);
      const before=await read();await key('ArrowRight');await wait(40);const after=await read();native.push({id,before,after,
        valid:after.selected===before.selected&&after.focus===id&&after.levels===before.levels&&after.events===before.events});}
    await evaluate(`document.getElementById('scene-evolution').focus({preventScroll:true})`);const tabBefore=await read();await key('Home');await wait(70);const tabAfter=await read();
    await evaluate(`window.__CELL_SPHERE_APP__.canvas.focus({preventScroll:true})`);const outsideBefore=await read();await key('ArrowRight');await wait(50);const outsideAfter=await read();
    boundaries={ignored,native,tablist:{before:tabBefore,after:tabAfter,valid:tabAfter.scene==='home'&&tabAfter.focus==='scene-home'},
      outsideEvolution:{before:outsideBefore,after:outsideAfter,valid:outsideAfter.scene==='home'&&outsideAfter.selected===outsideBefore.selected},
      valid:ignored.every(value=>value.valid)&&native.every(value=>value.valid)&&tabAfter.scene==='home'&&tabAfter.focus==='scene-home'
        &&outsideAfter.scene==='home'&&outsideAfter.selected===outsideBefore.selected};

    await prepare('fresh', null, 'canvas'); await key('Home'); await wait(70); const selected = await read(); await key('Enter'); await wait(140); const entered = await read();
    await wait(400); await key(' '); await wait(140); const spaced = await read(); activation={selected,entered,spaced,
      valid:selected.selected===topology.root&&selected.localLevel==='0'&&entered.localLevel==='1'&&entered.events===selected.events+1
        &&spaced.localLevel==='2'&&spaced.events===entered.events+1&&spaced.focus==='gl-canvas'};

    await prepare('fresh', null, 'canvas');await evaluate(`(()=>{const a=window.__CELL_SPHERE_APP__;a.canvas.focus({preventScroll:true});a.selectEvolutionCell(${topology.root},'cell')})()`);await wait(80);
    const enteredFocus=await read();await key('Escape');await wait(80);const restoredFocus=await read();focus={entered:enteredFocus,restored:restoredFocus,
      valid:enteredFocus.focus==='memory-node-heading'&&enteredFocus.focusVisible&&restoredFocus.focus==='gl-canvas'&&restoredFocus.overlay===null};
  } finally {
    await evaluate(`(async()=>{const a=window.__CELL_SPHERE_APP__,saved=window.__CSG_EVOLUTION_KEYBOARD_RESTORE__,{buildEvolutionSnapshot}=await import('./src/game/skills/index.js');
      a.selectScene('evolution');if(a.overlay==='memory-node')a.closeEvolutionCell();a.meta=saved.meta;a.archive=saved.archive;a.selectedNode=null;
      a.memorySnapshot=buildEvolutionSnapshot(a.meta);a.evolutionActivation.lastPurchaseAt=saved.lastPurchaseAt;
      if(Number.isInteger(saved.selectedCell))a.selectEvolutionCell(saved.selectedCell,'cell');
      Object.assign(a.camera,saved.camera);document.getElementById('live-region').textContent=saved.live;delete window.__CSG_EVOLUTION_KEYBOARD_RESTORE__;return true})()`);
    await wait(80);
  }
  return { schema:1, commands:reports, noReady, boundaries, activation, focus,
    shortcuts:{canvas:reports[0]?.after.canvasShortcuts,heading:reports.find(value=>value.after.focus==='memory-node-heading')?.after.headingShortcuts},
    valid:reports.every(value=>value.valid)&&noReady?.valid&&boundaries?.valid&&activation?.valid&&focus?.valid };
}
