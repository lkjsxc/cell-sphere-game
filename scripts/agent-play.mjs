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
  else if (command === 'buy') response = env.act({ type: 'buy-skill', skillId: option('--skill') });
  else if (command === 'run') response = env.act({ type: 'run-world' });
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
  const worlds = Math.max(1, Math.min(20, numberOption('--worlds', 2)));
  const seed = Math.max(0, Math.min(0x3fffffff, numberOption('--seed', 0))); const selected = (option('--policies')?.split(',') ?? AGENT_POLICIES)
    .map(normalizePolicy).filter((policy, index, all) => all.indexOf(policy) === index);
  const started = performance.now(); const summaries = [];
  for (let index = 0; index < selected.length; index++) {
    const policy = selected[index]; const env = createAgentEnvironment(defaultAgentSave((seed + index * 7919) % 0x40000000));
    env.act({ type: 'set-goal', goal: policy }); const scores = []; const reasons = []; const trace = []; let purchases = 0;
    let latest = null;
    for (let world = 0; world < worlds; world++) {
      let completed = false;
      for (let decisionCount = 0; decisionCount < 5 && !completed; decisionCount++) {
        const before = env.observe(); const decision = choosePolicyAction(before, policy); reasons.push(decision.rationale);
        if (decision.action.type === 'buy-skill') {
          const bought = env.act(decision.action); trace.push(traceEntry(before, decision, bought));
          if (!bought.accepted) break; purchases++;
          continue;
        }
        const runDecision = { action: { type: 'run-world' }, rationale: decision.rationale };
        latest = env.act(runDecision.action); trace.push(traceEntry(before, runDecision, latest)); completed = latest.accepted;
      }
      if (!completed) { const before = env.observe(); const decision = { action: { type: 'run-world' }, rationale: 'Decision budget reached.' };
        latest = env.act(decision.action); trace.push(traceEntry(before, decision, latest)); completed = latest.accepted; }
      if (!completed) throw new Error(`${policy} world ${world + 1}: ${latest.reason}`);
      scores.push(latest.result.score);
    }
    const observation = env.observe(); summaries.push({ policy, worlds, purchases,
      finalSkillCount: observation.ownedSkills.length, finalEchoBalance: observation.echoBalance,
      evolutionPower: observation.evolutionPower, worldPotential: observation.worldPotential,
      bestScore: observation.bestScore, scores, activeBuilds: observation.activeBuilds.map((build) => build.id),
      trophies: observation.trophySummary.earned,
      lastResult: { score: observation.lastResult.score, cause: observation.lastResult.cause,
        survivalSeconds: observation.lastResult.survivalSeconds, peakReach: observation.lastResult.peakReach,
        reach100: observation.lastResult.reach.reach100, resources: observation.lastResult.resources,
        worldmaking: observation.lastResult.worldmaking, stateHash: observation.lastResult.stateHash },
      rationales: reasons.slice(-4), trace: trace.slice(-12), stateHash: env.exportSave().stateHash });
    if (savePath && selected.length === 1) atomicWrite(savePath, env.exportSave());
  }
  process.stdout.write(`${JSON.stringify({ schema: 1, seed, worldsPerPolicy: worlds,
    policies: summaries, elapsedMs: Math.round(performance.now() - started) })}\n`);
}

function traceEntry(observation, decision, response) { return Object.freeze({ observation: Object.freeze({
  worldOrdinal: observation.worldOrdinal, echoBalance: observation.echoBalance,
  evolutionPower: observation.evolutionPower, worldPotential: observation.worldPotential,
  availableSkills: Object.freeze(observation.availableSkills.map((skill) => skill.id)),
  activeBuilds: Object.freeze(observation.activeBuilds.map((build) => build.id)) }),
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
  const valued = new Set(['--save', '--skill', '--seed', '--worlds', '--policies']);
  for (let index = 0; index < args.length; index++) {
    if (valued.has(args[index])) { index++; continue; }
    if (!args[index].startsWith('--')) return args[index];
  }
  return 'observe';
}
function option(name) { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : null; }
function numberOption(name, fallback) { const value = Number(option(name)); return Number.isInteger(value) ? value : fallback; }
