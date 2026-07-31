/**
 * Event scheduling and footprint precomputation.
 *
 * The whole schedule is generated at run start from the simulation RNG:
 * deterministic, speed-independent, and inspectable for telegraphs.
 * Families are drawn from a no-immediate-repeat bag so one crisis type
 * cannot dominate a run.
 */
import { BALANCE as B } from '../game/balance.js';
import { EVENT_FAMILIES } from '../game/events-content.js';
import { smootherstep } from '../core/math.js';

/**
 * @param {import('../core/prng.js').Rng} rng simulation stream
 * @param {import('../world/icosphere.js').Topology} topo
 * @param {import('../world/fields.js').Fields} fields
 * @param {object|null} challenge
 * @returns {Array<object>} scheduled events, sorted by startTick
 */
export function scheduleEvents(rng, topo, fields, challenge) {
  const volatile = challenge?.id === 'volatile';
  const count = 6 + rng.intBelow(3) + (volatile ? 3 : 0);
  const intensityMod = (volatile ? 1.35 : 1) * (challenge?.eventIntensity ?? 1);

  // Candidate centers: the most event-vulnerable nodes.
  const byVuln = Array.from({ length: topo.nodeCount }, (_, i) => i)
    .sort((a, b) => fields.eventVuln[b] - fields.eventVuln[a])
    .slice(0, 80);

  const events = [];
  let lastFamily = '';
  const windowStart = 700;
  const windowEnd = 2850;
  const step = (windowEnd - windowStart) / count;

  for (let k = 0; k < count; k++) {
    const family = drawFamily(rng, lastFamily);
    lastFamily = family.id;

    const startTick = Math.round(windowStart + k * step + rng.range(-0.35, 0.35) * step);
    const rise = 60;
    const hold = 60 + rng.intBelow(90);
    const fall = 90;
    const peakTick = startTick + rise;
    const endTick = peakTick + hold + fall;

    const center = byVuln[rng.intBelow(byVuln.length)];
    const radiusDot = rng.range(0.5, 0.74);
    const intensity = rng.range(0.7, 1.15) * intensityMod;

    const { nodes, falloff } = computeFootprint(topo, center, radiusDot);

    events.push({
      family: family.id,
      nameJa: family.nameJa,
      descJa: family.descJa,
      kind: family.kind,
      amount: family.amount,
      crisis: family.crisis,
      startTick,
      peakTick,
      endTick,
      center,
      radiusDot,
      intensity: Math.fround(intensity),
      nodes,
      falloff,
      announced: 0, // bitmask: 1 telegraph, 2 active, 4 ended
    });
  }

  events.sort((a, b) => a.startTick - b.startTick);
  return events;
}

/** Weighted family draw with no immediate repeat. */
function drawFamily(rng, lastFamily) {
  const candidates = EVENT_FAMILIES.filter((f) => f.id !== lastFamily);
  let total = 0;
  for (const f of candidates) total += f.weight;
  let roll = rng.float() * total;
  for (const f of candidates) {
    roll -= f.weight;
    if (roll <= 0) return f;
  }
  return candidates[candidates.length - 1];
}

/** Nodes within an angular footprint + smooth falloff weights. */
function computeFootprint(topo, center, radiusDot) {
  const cx = topo.positions[center * 3];
  const cy = topo.positions[center * 3 + 1];
  const cz = topo.positions[center * 3 + 2];
  const idx = [];
  const weights = [];
  for (let i = 0; i < topo.nodeCount; i++) {
    const dot = cx * topo.positions[i * 3]
      + cy * topo.positions[i * 3 + 1]
      + cz * topo.positions[i * 3 + 2];
    if (dot > radiusDot) {
      idx.push(i);
      weights.push(Math.fround(smootherstep((dot - radiusDot) / (1 - radiusDot))));
    }
  }
  return { nodes: Uint16Array.from(idx), falloff: Float32Array.from(weights) };
}

/** Telegraph lead time in ticks, extended by distributed sensing. */
export function telegraphLead(traits) {
  return traits.distributedSensing ? 200 : 100;
}
