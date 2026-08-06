/** Evolution Globe semantic tree, Evolution detail, and acquisition feedback. */
import { EVOLUTION_AFFINITIES, MEMORY_NODES, compileEvolution, getMemoryNode, memoryNodeState,
  previewEvolutionLevel, modeledScoreRange, newlyAvailableAdjacentIds } from '../game/skills/index.js';
import { formatProgressionEngineering, normalizeProgressionInteger } from '../core/progression-integer.js';

export function createMemorySurface(options) {
  const panel = byId('memory-node-panel'); const unlock = /** @type {HTMLButtonElement} */ (byId('memory-unlock'));
  const tree = byId('evolution-tree'); const change = byId('memory-node-change');
  let selected = null; let meta = null; let feedbackTimer = 0;
  byId('memory-node-close').addEventListener('click', options.onCloseNode);
  unlock.addEventListener('click', () => { if (selected) options.onUnlock(selected.id); });

  function renderNode() {
    const state = memoryNodeState(meta, selected, selected?.id); selected = state;
    const preview = previewEvolutionLevel(meta, state.id);
    byId('memory-node-branch').textContent = `${state.affinity.toUpperCase()} AFFINITY · TIER ${state.tier}`;
    byId('memory-node-heading').textContent = state.nameEn;
    byId('memory-node-summary').textContent = state.effectEn;
    byId('memory-node-detail').textContent = state.description;
    const boundary=state.reason==='progression-security-boundary';
    const status=boundary?`Level ${number(state.currentLevel)} · Document security boundary reached`:state.owned
      ? state.affordable?`Level ${number(state.currentLevel)} · Ready to upgrade`:`Level ${number(state.currentLevel)} · More Echoes required`
      : state.locked?'Level 0 · Locked · one directly adjacent Level 1+ cell required'
        :state.affordable?'Level 0 · Ready to unlock':'Level 0 · Reachable · more Echoes required';
    const neighbor = state.adjacentOwnedId ? getMemoryNode(state.adjacentOwnedId)?.nameEn ?? state.adjacentOwnedId
      : state.bootstrap ? 'Fresh-world root' : 'No adjacent owned cell';
    const gameplayParts = [...(preview?.changes?.map(formatChange) ?? []),
      ...(preview?.unlocked?.map((entry) => `${humanize(entry.key)} unlocked`) ?? [])];
    const gameplay = gameplayParts.length ? gameplayParts.join(' · ') : 'Rule change shown above';
    const compiled = compileEvolution(meta);
    const potential = preview ? `${number(preview.potentialBefore)} → ${number(preview.potentialAfter)} (+${number(preview.potentialDelta)})`
      : `${number(compiled.worldPotential)} current`;
    const power=preview?`${number(preview.powerBefore)} → ${number(preview.powerAfter)} (+${number(preview.powerGain)})`
      :`${number(compiled.evolutionPower)} breadth current`;
    const scoreRange = modeledScoreRange(preview?.potentialAfter ?? compiled.worldPotential);
    const affinity = EVOLUTION_AFFINITIES.find((entry) => entry.id === state.affinity);
    const buildProgress = preview?.buildProgress?.length ? preview.buildProgress.map(formatBuildProgress).join(' · ')
      : state.buildContributions.map(humanize).join(', ');
    const newlyAvailable = newlyAvailableAdjacentIds(meta, state.id).map((id) => getMemoryNode(id)?.nameEn ?? id);
    const rows=definitionRows([
      ['Status',status],['Affinity',`${state.affinity} · ${affinity?.pattern??'whole-cell'} pattern · ${affinity?.color??'material palette'} · ${state.secondaryTags.join(', ')}`],
      ['Current → next level',boundary?`Level ${number(state.currentLevel)} · next level unavailable in this document`:`Level ${number(state.currentLevel)} → Level ${number(state.nextLevel)}`],
      ['Exact cost',boundary?`Unavailable · ${number(meta.echoBalance)} Echoes held`:`${number(state.nextCost)} Echoes · ${number(meta.echoBalance)} held`],['Gameplay before → after',gameplay],
      ['Tradeoff',state.tradeoff],['Level-one breadth power',power],['World Potential',potential],
      ['Modeled SCORE range',`${number(scoreRange.low)}–${number(scoreRange.high)} · modeled, not promised`],
      ['Build progress',buildProgress||'No recipe contribution'],
      ['Habitats / transformations',[...state.habitatContributions,...state.transformationContributions].join(', ')||'No direct unlock'],
      ['Adjacent owned cell',neighbor],['Newly available neighbors',newlyAvailable.length?newlyAvailable.join(', '):'No additional adjacent cells'],
    ]);
    if(state.nextCost!==null)rows[7].append(' ',exactCopyButton(state.nextCost,`Copy exact ${state.nameEn} upgrade cost`));
    byId('memory-node-meta').replaceChildren(...rows);unlock.hidden=false;unlock.disabled=!state.selectedReady;
    const verb=boundary?'Upgrade unavailable at document security boundary':state.owned?`Upgrade to Level ${number(state.nextLevel)}`:'Unlock Level 1';
    const compact=!boundary&&(state.nextLevel?.length>15||state.nextCost?.length>15);
    unlock.textContent=boundary?verb:compact?`${state.owned?'Upgrade':'Unlock'} Level ${number(state.nextLevel)}`:`${verb} for ${number(state.nextCost)} Echoes`;
    unlock.setAttribute('aria-label',boundary?`${state.nameEn} cannot be upgraded in this session because the document security boundary was reached`:
      `${verb} ${state.nameEn} from Level ${number(state.currentLevel)} to Level ${number(state.nextLevel)} for ${number(state.nextCost)} Echoes`);
    if(state.nextCost===null)delete unlock.dataset.exactValue;else unlock.dataset.exactValue=state.nextCost;
    unlock.dataset.action=state.selectedReady?'recommended':'normal';
  }

  function renderTree() {
    const compiled = compileEvolution(meta);
    tree.replaceChildren(...MEMORY_NODES.map((node) => {
      const state = memoryNodeState(meta, node, selected?.id); const button = document.createElement('button'); button.type = 'button';
      button.setAttribute('role', 'treeitem'); button.setAttribute('aria-level', String(state.tier + 1));
      button.setAttribute('aria-selected', String(state.id === selected?.id));
      const boundary=state.reason==='progression-security-boundary';
      const status=boundary?'Owned; document security boundary reached':state.owned?state.affordable?'Owned and ready to upgrade':'Owned, more Echoes required for next level'
        :state.reachable?state.affordable?'Ready to unlock':'Reachable, more Echoes required':'Locked, adjacent Level 1 or higher cell required';
      const preview=previewEvolutionLevel(meta,node.id);
      button.textContent=`${state.nameEn}. ${state.affinity} affinity. Level ${number(state.currentLevel)}. ${status}. `
        +(boundary?'No next level can be represented in this session. ':`Next level ${number(state.nextLevel)} costs ${number(state.nextCost)} Echoes. `)
        + `World Potential ${number(preview?.potentialBefore ?? compiled.worldPotential)} to ${number(preview?.potentialAfter ?? compiled.worldPotential)}. `
        + `${state.id === selected?.id && state.reason === 'ready' ? 'Activate again to purchase one level.' : 'Activate to select.'}`;
      button.addEventListener('click', () => options.onSelect(node.id)); return button;
    }));
  }

  function acquisition(preview, newly) {
    clearTimeout(feedbackTimer); change.hidden = false; change.classList.remove('skill-acquired'); void change.offsetWidth;
    change.classList.add('skill-acquired');
    const effectParts = [...(preview?.changes?.map(formatChange) ?? []),
      ...(preview?.unlocked?.map((entry) => `${humanize(entry.key)} unlocked`) ?? [])];
    const effect = effectParts.join(' · ') || 'Permanent rule unlocked';
    change.textContent = `${effect}. World Potential ${number(preview?.potentialBefore ?? 0)} → ${number(preview?.potentialAfter ?? 0)}. ${newly.length} adjacent ${newly.length === 1 ? 'cell is' : 'cells are'} now available.`;
    feedbackTimer = setTimeout(() => { change.hidden = true; change.classList.remove('skill-acquired'); }, 5000);
  }

  return {
    panel,
    openNode(node, nextMeta) { selected = node; meta = nextMeta; change.hidden = true; panel.hidden = false; renderNode(); renderTree(); },
    refresh(nextMeta, newly = [], preview = null) { meta = nextMeta; if (selected) renderNode(); renderTree(); if (preview) acquisition(preview, newly); },
    syncTree(nextMeta) { meta = nextMeta; renderTree(); },
    closeNode() { panel.hidden = true; selected = null; clearTimeout(feedbackTimer); feedbackTimer = 0; change.hidden = true; },
    get selectedId() { return selected?.id ?? null; },
  };
}

function formatBuildProgress(build) {
  const progress = `${Math.round(build.before * 100)}% → ${Math.round(build.after * 100)}%`;
  const missing = build.active ? 'active' : build.missing.map((part) => `${part.remaining} ${humanize(part.id)}`).join(', ');
  return `${build.name}: ${progress} · ${missing}`;
}
function formatChange(change) { return `${humanize(change.key)} ${decimal(change.before)} → ${decimal(change.after)}`; }
function decimal(value) { return `${Math.round(value * 1000) / 1000}×`; }
function number(value) { const exact = normalizeProgressionInteger(value, '0');
  return exact.length <= 15 ? exact.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : formatProgressionEngineering(exact, 6); }
function byId(id) { return /** @type {HTMLElement} */ (document.getElementById(id)); }
function definitionRows(rows){return rows.flatMap(([term,value])=>{const dt=document.createElement('dt');dt.textContent=term;
  const dd=document.createElement('dd');dd.textContent=value;return[dt,dd]})}
function exactCopyButton(exact,label){const button=document.createElement('button');button.type='button';button.className='exact-copy';button.textContent='Copy exact';
 button.dataset.copyProgressionExact=exact;button.setAttribute('aria-label',label);button.addEventListener('click',async()=>{let copied=false;
  try{await navigator.clipboard?.writeText?.(exact);copied=true}catch{copied=false}if(!copied){const area=document.createElement('textarea');area.value=exact;area.setAttribute('readonly','');
    area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();try{copied=document.execCommand('copy')}catch{copied=false}area.remove()}
  button.textContent=copied?'Copied':'Copy unavailable';setTimeout(()=>{button.textContent='Copy exact'},1400)});return button}
function humanize(value) { return String(value).replaceAll('_', ' ').replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()); }
