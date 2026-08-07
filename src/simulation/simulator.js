/** Authoritative deterministic run controller shared by Worker and fallback. */
import { BALANCE as B } from '../game/balance.js';
import { applyMemoryConditionals } from '../game/skills/index.js';
import { beginTerminalCollapse, createRunState, finalizeEnvironmentProgression, reconcileLiveness, terminalCollapseReason, updateEnvironmentProgression } from './state.js';
import { advanceEventDirector } from './events.js';
import { updateEnvironment } from './environment.js';
import { runMetabolism } from './metabolism.js';
import { runTransport } from './transport.js';
import { runGrowth } from './lifecycle/growth.js';
import { runDeath } from './lifecycle/death.js';
import { analyzeConnectivity } from './connectivity.js';
import { runSummary } from './summary.js';
import { logReplay, recordHistory, REPLAY } from './replay.js';
import { buildSnapshot, snapshotTransfers } from './snapshot.js';
import { buildAbandonedRun, buildRunResult, dominantCause } from './result.js';
import { HistoryRecorder } from '../history/recorder.js';
import { habitatAccessForInspection, habitatLabel } from './habitats.js';
import { runWorldmaking } from './worldmaking.js';
import { RESOURCE_STATE_LABELS, freshwaterSupportAt, reserveFractionAt, updateResourceEcology } from './resource-ecology.js';
import { ecologicalAccessForInspection } from './lifecycle/ecological-access.js';
import { updateReachGoal } from './lifecycle/reach-goal.js';
import { refreshScoreMerit } from '../game/scoring.js';

export class RunController {
  constructor(cfg, emit = () => {}) {
    this.emit = emit;
    this.cfg = { ...cfg };
    this.state = createRunState(this.cfg);
    this.historyRecorder = new HistoryRecorder(this.state);
  }

  start() {
    const s = this.state;
    if (s.status !== 'idle') throw new Error(`start from ${s.status}`);
    s.status = 'running';
    logReplay(s, REPLAY.STRAIN, strainIndex(this.cfg.strainId));
    logReplay(s, REPLAY.INOCULATE, s.inoculationCell);
    recordHistory(s, 'run-start');
    this.historyRecorder.observe(s, true);
    this.emit({ t: 'started', tick: 0, inoculationCell: s.inoculationCell });
    this.emit({ t: 'history-batch', events: s.history.map((event) => ({ ...event })) });
  }

  /** Advance up to n authoritative ticks; offers never pause progress. */
  advance(n) {
    let done = 0;
    while (done < n && (this.state.status === 'running' || this.state.status === 'terminal-collapse')) { this.step(); done++; }
    return done;
  }

  step() {
    const s = this.state;
    if (s.status !== 'running' && s.status !== 'terminal-collapse') return false;
    const historyLength = s.history.length; const collapsing = s.status === 'terminal-collapse';
    s.tick++;
    // The public clock advances through the short causal collapse fade too.
    // Consumers may stop during collapse, but result/snapshot authority cannot
    // retain a level that disagrees with the final authoritative tick.
    const transition = updateEnvironmentProgression(s);
    if (transition.changed) {
      this.emit({ t: 'environment-transition', tick: s.tick,
        environmentLevel: s.currentEnvironmentLevel, profileHash: s.currentEnvironmentProfileHash });
    }
    if (!collapsing) {
      // Environment clock/profile authority precedes every ecological consumer.
      advanceEventDirector(s);
      applyMemoryConditionals(s);
      if (s.tick % B.ENV_EVERY === 0) updateEnvironment(s);
      runMetabolism(s); runTransport(s); runWorldmaking(s); runGrowth(s);
    }
    runDeath(s); updateResourceEcology(s);
    const living = reconcileLiveness(s);
    if (living.livingCount === 0) return this.finishExtinction();
    if (updateReachGoal(s)) this.emit({ t: 'milestone', id: 'reach-100', tick: s.tick,
      livingCount: s.aliveCount, requiredTicks: 25 });
    if (!collapsing) {
      if (s.tick % B.CONNECTIVITY_EVERY === 0) analyzeConnectivity(s);
      if (s.tick % B.SUMMARY_EVERY === 0) runSummary(s, (message) => this.emit(message));
      const reason = terminalCollapseReason(s);
      if (reason && beginTerminalCollapse(s, reason)) {
        this.emit({ t: 'terminal-collapse', tick: s.tick, cause: reason,
          livingCount: s.aliveCount, deadline: s.terminalDeadline });
        this.emit({ t: 'history-batch', events: [{ ...s.history.at(-1) }] });
      }
    }
    this.historyRecorder.observe(s, s.history.length !== historyLength);
    return true;
  }

  finishExtinction() {
    const s = this.state; if (s.status === 'extinct') return false;
    const historyStart = s.history.length;
    finalizeEnvironmentProgression(s);
    refreshScoreMerit(s);
    s.status = 'extinct'; s.aliveCount = 0; s.coverage = 0;
    s.connectedShare = 0; s.largestComponent = 0;
    s.extinction = { tick: s.tick, cause: dominantCause(s), terminalCause: s.terminalCause ?? 'natural' };
    recordHistory(s, 'run-extinct', { cause: s.extinction.cause });
    this.historyRecorder.observe(s, true, true);
    const terminalSnapshot = this.snapshot();
    this.emit({ t: 'snapshot', ...terminalSnapshot }, snapshotTransfers(terminalSnapshot));
    this.emit({ t: 'history-batch', events: s.history.slice(historyStart).map((event) => ({ ...event })) });
    this.emit({ t: 'extinct', summary: this.buildResult() });
    return true;
  }

  abort() {
    const s = this.state;
    if (s.status !== 'running' && s.status !== 'terminal-collapse') return false;
    const historyStart = s.history.length; finalizeEnvironmentProgression(s); refreshScoreMerit(s); s.status = 'aborted';
    recordHistory(s, 'run-abandoned', { value: s.aliveCount });
    this.historyRecorder.observe(s, true, true);
    this.emit({ t: 'history-batch', events: s.history.slice(historyStart).map((event) => ({ ...event })) });
    this.emit({ t: 'aborted', summary: buildAbandonedRun(s) });
    return true;
  }

  /** Pure compact dynamic projection for pointer inspection. */
  inspectCell(node) {
    const s = this.state;
    if (!Number.isInteger(node) || node < 0 || node >= s.topo.nodeCount) {
      throw new Error(`invalid cell: ${node}`);
    }
    let activeEdges = 0;
    let conductance = 0;
    for (let o = s.topo.nodeStart[node]; o < s.topo.nodeStart[node + 1]; o++) {
      const edge = s.topo.nodeEdges[o];
      if (s.edgeActive[edge] === 1) {
        activeEdges++;
        conductance += s.conductance[edge];
      }
    }
    const access = habitatAccessForInspection(s, node);
    const ecological = ecologicalAccessForInspection(s, node);
    let adjacentLife = false;
    for (let offset = s.topo.nodeStart[node]; offset < s.topo.nodeStart[node + 1]; offset++)
      if (s.alive[s.topo.nodeNeighbors[offset]]) { adjacentLife = true; break; }
    return {
      tick: s.tick, node, alive: s.alive[node], biomass: s.biomass[node], energy: s.energy[node],
      nutrient: s.nutrient[node], resourceReserve: s.resourceReserve[node],
      initialNutrient: s.initialAvailableNutrient[node], initialResourceReserve: s.initialResourceReserve[node],
      resourceRichness: s.resourceRichness[node], initialResourceRichness: s.initialResourceRichness[node],
      reserveFraction: reserveFractionAt(s, node), resourceState: s.resourceState[node],
      resourceStateLabel: RESOURCE_STATE_LABELS[s.resourceState[node]], resourceQuintile: s.resourceQuintile[node],
      freshwaterSupport: freshwaterSupportAt(s, node), freshwaterTier: s.fields.freshwaterTier?.[node] ?? 0,
      moisture: s.moisture[node], temperature: s.temperature[node],
      toxicity: s.toxicity[node], stress: s.stress[node], activeEdges,
      habitat: habitatLabel({ ...s.fields, biomeId: s.effectiveBiome }, node), habitatAccessible: access.accessible,
      ecologicalAccessible: ecological.accessible, ecologicalReason: ecological.reason,
      resourceFloor: ecological.minimumRequired,
      requiredCapability: access.accessible ? null : access.capability,
      requiredSkill: access.accessible ? null : access.skill, adjacentLife,
      suitabilityIfAccessible: s.fields.growthSuitability?.[node] ?? 1,
      habitatBlocked: s.habitatBlocked[node], resourceBlocked: s.resourceBlocked[node],
      transformationState: s.transformationState[node], electricity: s.electricityQ[node] / 255,
      meanConductance: activeEdges ? conductance / activeEdges : 0,
    };
  }

  buildResult() { return buildRunResult(this.state); }
  snapshot() { return buildSnapshot(this.state); }
  historyPreview(tick) { return this.historyRecorder.preview(tick); }
  historyBuffer() { return this.historyRecorder.buffer(); }
}

function strainIndex(id) { return ['pioneer', 'conservator', 'weaver'].indexOf(id ?? 'pioneer'); }
