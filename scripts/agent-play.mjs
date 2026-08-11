#!/usr/bin/env node
/** Machine-clean CLI for the fair production-backed agent environment. */
import { readFileSync, writeFileSync, renameSync, mkdirSync, existsSync, openSync, fsyncSync, closeSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { createAgentEnvironment } from '../src/agent/environment.js';
import { AGENT_POLICIES, choosePolicyAction, normalizePolicy } from '../src/agent/policies.js';
import { defaultAgentSave } from '../src/agent/schema.js';

const args = process.argv.slice(2); const savePath = option('--save');
if (args.includes('--stdio')) await stdio();
else {
  const command = positionalCommand();
  if (command === 'campaign') campaign(); else single(command);
}

function single(command) {
  const env = loadEnvironment(savePath); let response;
  if (command === 'observe') response = env.act({ type: 'observe' });
  else if(command==='buy'){const observation=env.observe(),cellId=option('--cell')??option('--skill'),cell=observation.evolutionCells.find((entry)=>entry.id===cellId);
    response=env.act({type:'buy-evolution-level',cellId,expectedLevel:cell?.currentLevel,expectedRevision:observation.metaRevision})}
  else if(command==='run')response=env.act(guardedRun(env.observe()));
  else if (command === 'reset') response = env.act({ type: 'reset', seed: numberOption('--seed', 0) });
  else response = { accepted: false, reason: 'unknown-command' };
  if (savePath && response.accepted) atomicWrite(savePath, env.exportSave());
  process.stdout.write(`${JSON.stringify(response)}\n`);
  if (!response.accepted) process.exitCode = 1;
}

async function stdio() {
  const env = loadEnvironment(savePath); const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of input) {
    if (!line.trim()) continue;
    let response;
    try { response = env.act(JSON.parse(line)); }
    catch (error) { console.error(`invalid JSON action: ${error.message}`); response = {
      accepted: false, reason: 'invalid-json', observation: env.observe(), hash: env.exportSave().stateHash }; }
    if (savePath && response.accepted) atomicWrite(savePath, env.exportSave());
    process.stdout.write(`${JSON.stringify(response)}\n`);
  }
}

function campaign() {
  const worlds = Math.max(1, Math.min(100, numberOption('--worlds', 2)));
  const seed = Math.max(0, Math.min(0xffffffff, numberOption('--seed', 0))); const selected = (option('--policies')?.split(',') ?? AGENT_POLICIES)
    .map(normalizePolicy).filter((policy, index, all) => all.indexOf(policy) === index);
  const started = performance.now(); const summaries = [];
  for (let index = 0; index < selected.length; index++) {
    const policy = selected[index]; const env = createAgentEnvironment(defaultAgentSave((seed + index * 7919) % 0x100000000));
    env.act({ type: 'set-goal', goal: policy }); const scores = []; const reasons = []; const trace = []; let purchases = 0;
    let latest = null;
    for (let world = 0; world < worlds; world++) {
      let completed = false;
      for (let decisionCount = 0; decisionCount < 5 && !completed; decisionCount++) {
        const before = env.observe(); const decision = choosePolicyAction(before, policy); reasons.push(decision.rationale);
        if (decision.action.type === 'buy-evolution-level' || decision.action.type === 'buy-skill') {
          const bought = env.act(decision.action); trace.push(traceEntry(before, decision, bought));
          if (!bought.accepted) break; purchases++;
          continue;
        }
        latest=env.act(decision.action);trace.push(traceEntry(before,decision,latest));completed=latest.accepted;
      }
      if(!completed){const before=env.observe(),decision={action:guardedRun(before),rationale:'Decision budget reached.'};
        latest=env.act(decision.action);trace.push(traceEntry(before,decision,latest));completed=latest.accepted}
      if (!completed) throw new Error(`${policy} world ${world + 1}: ${latest.reason}`);
      scores.push(latest.result.score);
    }
    const observation = env.observe(); summaries.push({ policy, worlds, purchases,
      finalEvolutionCellCount:observation.ownedEvolutionCells.length, finalEchoBalance:observation.echoBalance,
      totalEvolutionLevels:observation.evolutionSummary.totalLevels, bestScore:observation.bestScore,scores,
      finalDomains:observation.evolutionSummary.domains,
      trophies: observation.trophySummary.earned,
      lastResult: { score: observation.lastResult.score, cause: observation.lastResult.cause,
        survivalSeconds: observation.lastResult.survivalSeconds, peakReach: observation.lastResult.peakReach,
        reach100: observation.lastResult.reach.reach100, resources: observation.lastResult.resources,
        worldmaking: observation.lastResult.worldmaking, stateHash: observation.lastResult.stateHash },
      rationales: reasons.slice(-4), trace: trace.slice(-12), stateHash: env.exportSave().stateHash });
    if (savePath && selected.length === 1) atomicWrite(savePath, env.exportSave());
  }
  const traceBounded=summaries.every((row)=>row.trace.length<=12),valid=selected.length>0&&summaries.every((row)=>row.worlds===worlds&&/^\d+$/.test(row.bestScore))&&traceBounded;
  const report={schema:2,productionAuthority:true,fairObservation:true,seed,worldsPerPolicy:worlds,policyCount:summaries.length,
    policies:summaries,traceBounded,elapsedMs:Math.round(performance.now()-started),valid};
  const reportPath=option('--report');if(reportPath)atomicWrite(reportPath,report);
  process.stdout.write(`${JSON.stringify(report)}\n`);if(!valid)process.exitCode=1;
}

function guardedRun(observation){return{type:'run-world',expectedRevision:observation.metaRevision,expectedWorldOrdinal:observation.worldOrdinal}}
function traceEntry(observation, decision, response) { return Object.freeze({ observation: Object.freeze({
  worldOrdinal: observation.worldOrdinal, echoBalance: observation.echoBalance,
  evolutionSummary: observation.evolutionSummary, availableEvolutionCells:Object.freeze(observation.availableEvolutionCells.map((cell)=>cell.id)) }),
  action: decision.action, rationale: decision.rationale, accepted: response.accepted,
  reason: response.reason, responseHash: response.hash }); }

function loadEnvironment(path) {
  if (!path || !existsSync(resolve(path))) return createAgentEnvironment(defaultAgentSave());
  try { return createAgentEnvironment(JSON.parse(readFileSync(resolve(path), 'utf8'))); }
  catch (error) { console.error(`agent save load failed: ${error.message}`); return createAgentEnvironment(defaultAgentSave()); }
}
function atomicWrite(path, value) {
  const target = resolve(path); mkdirSync(dirname(target), { recursive: true });
  const temporary = `${target}.${process.pid}.writing`; writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  const fd = openSync(temporary, 'r'); try { fsyncSync(fd); } finally { closeSync(fd); }
  renameSync(temporary, target);
}
function positionalCommand() {
  const valued = new Set(['--save', '--report', '--cell', '--skill', '--seed', '--worlds', '--policies']);
  for (let index = 0; index < args.length; index++) {
    if (valued.has(args[index])) { index++; continue; }
    if (!args[index].startsWith('--')) return args[index];
  }
  return 'observe';
}
function option(name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
function numberOption(name, fallback) { const value = Number(option(name)); return Number.isInteger(value) ? value : fallback; }
