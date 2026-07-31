/**
 * Central balance constants. Every tunable number used by the simulation
 * lives here with its unit, so the balance harness and docs share one truth.
 * Values are initial calibration targets; changes must be recorded in
 * docs/balancing.md with measured outcomes.
 */
export const BALANCE = Object.freeze({
  // --- time ----------------------------------------------------------------
  TICKS_PER_SECOND: 10,      // canonical simulation rate
  RUN_TARGET_TICKS: 3000,    // 300 game s median run
  RUN_CEILING_TICKS: 3600,   // hard ceiling; collapse cascade after this
  COLLAPSE_KILL_RATE: 0.06,  // biomass fraction removed/tick during cascade

  // --- cadence ---------------------------------------------------------------
  ENV_EVERY: 5,              // environment update period (ticks)
  SUMMARY_EVERY: 10,         // metrics/score accumulation period
  CONNECTIVITY_EVERY: 20,    // BFS component analysis period
  SNAPSHOT_EVERY: 2,         // visual snapshot period at 1x

  // --- entropy curve ---------------------------------------------------------
  ENTROPY_RISE_START: 600,   // tick where global deterioration ramps (60 s)
  ENTROPY_RISE_END: 3000,    // tick where entropy reaches 1.0 (300 s)
  ENTROPY_POWER: 1.35,       // curve shape: gentle open, steep close

  // --- environment -----------------------------------------------------------
  NUTRIENT_REGEN: 0.012,     // per env step, scaled by (1-entropy)
  SEASON_AMPLITUDE: 0.16,    // moisture/temp seasonal swing
  SEASON_PERIOD_TICKS: 900,  // 90 game s per season cycle
  TOXIN_ACCUMULATION: 0.004, // per env step at entropy 1, scaled by toxVuln
  TOXIN_DECAY: 0.002,        // per env step

  // --- metabolism ------------------------------------------------------------
  UPTAKE_RATE: 0.05,         // nutrient/biomass/tick at full suitability
  CONVERSION: 1.0,           // nutrient -> energy conversion
  MAINTENANCE_RATE: 0.011,   // energy/biomass/tick
  MAINTENANCE_ENTROPY: 0.8,  // extra maintenance multiplier at entropy 1
  ENERGY_CAP: 6.0,           // per-node stored energy cap
  STRESS_GAIN: 0.022,        // per tick at zero suitability
  STRESS_RECOVER: 0.014,     // per tick at full suitability
  DEATH_STRESS: 1.0,         // stress that starts killing biomass
  STARVE_SHRINK: 0.03,       // biomass fraction lost/tick when energy < 0
  BIOMASS_EPS: 0.02,         // below this a node dies

  // --- transport ---------------------------------------------------------------
  TRANSPORT_K: 0.18,         // flow = cond * dPressure * TRANSPORT_K
  PRESSURE_SCALE: 0.5,       // pressure = energy * PRESSURE_SCALE
  REINFORCE_K: 0.09,         // conductance gain from useful flux
  CONDUCTANCE_DECAY: 0.0035, // conductance loss per tick
  COND_PRUNE_MIN: 0.06,      // below this (after min age) an edge prunes
  COND_MAX: 3.0,
  PRUNE_AGE_TICKS: 40,       // edges younger than this never prune
  START_CONDUCTANCE: 0.35,

  // --- growth ------------------------------------------------------------------
  GROW_COST: 0.34,           // energy to open a new frontier node
  GROW_P_BASE: 0.2,          // base expansion probability per candidate/tick
  GROW_PER_NODE_CAP: 2,      // max expansions per node per tick
  NEW_BIOMASS: 0.25,         // biomass seeded into a new node
  CROWDING_PENALTY: 0.14,    // per alive neighbor beyond 2
  SIGNAL_BIAS: 0.9,          // expansion bias per unit signal potential

  // --- signals -----------------------------------------------------------------
  SIGNAL_CHARGES: 3,
  SIGNAL_REGEN_TICKS: 200,   // ~one charge per 20 game s
  SIGNAL_DURATION_TICKS: 140,
  SIGNAL_RADIUS_DOT: 0.86,   // angular radius as dot threshold (~30deg)
  SIGNAL_STRENGTH: 1.4,
  SIGNAL_DECAY: 0.975,       // per tick

  // --- drafting ----------------------------------------------------------------
  DRAFT_TICKS: Object.freeze([450, 900, 1350, 1800, 2400]),
  DRAFT_OPTIONS: 3,

  // --- scoring -----------------------------------------------------------------
  SCORE_WEIGHTS: Object.freeze({
    survival: 0.24,
    peakCoverage: 0.24,
    sustainedCoverage: 0.18,
    connectivity: 0.14,
    efficiency: 0.12,
    crisis: 0.08,
  }),
  SCORE_SCALE: 1_000_000,
  ECHO_BASE: 2,
  ECHO_DIVISOR: 1500,
});
