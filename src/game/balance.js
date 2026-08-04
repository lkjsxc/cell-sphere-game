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
  RUN_CEILING_TICKS: 3600,   // ordinary authority enters terminal collapse
  RUN_HARD_MAX_TICKS: 3620,  // every run has finalized by this tick
  TERMINAL_COLLAPSE_TICKS: 20, // at most two game seconds of causal fade
  TERMINAL_STALL_TICKS: 10,  // bounded unchanged/spent-state observation
  TERMINAL_BIOMASS_THRESHOLD: 0.2,

  // --- cadence ---------------------------------------------------------------
  ENV_EVERY: 5,              // environment update period (ticks)
  SUMMARY_EVERY: 10,         // metrics/score accumulation period
  CONNECTIVITY_EVERY: 20,    // BFS component analysis period
  SNAPSHOT_EVERY: 2,         // visual snapshot period at 1x

  // --- entropy curve ---------------------------------------------------------
  ENTROPY_RISE_START: 1200,  // scarcity pressure becomes visible after two minutes
  ENTROPY_RISE_END: 3100,    // terminal scarcity reaches full pressure near five minutes
  ENTROPY_POWER: 1.35,       // curve shape: gentle open, steep close

  // --- environment -----------------------------------------------------------
  NUTRIENT_REGEN: 0.018,     // reserve-to-available transfer per environment step
  RESOURCE_RESERVE_SCALE: 1.10, // finite long-term stock relative to local fertility
  FRESHWATER_RESERVE_BONUS: 2.20, // finite initial catchment stock assigned locally
  SEASON_AMPLITUDE: 0.16,    // moisture/temp seasonal swing
  SEASON_PERIOD_TICKS: 900,  // 90 game s per season cycle
  TOXIN_ACCUMULATION: 0.004, // per env step at entropy 1, scaled by toxVuln
  TOXIN_DECAY: 0.002,        // per env step

  // --- metabolism ------------------------------------------------------------
  UPTAKE_RATE: 0.09,         // nutrient/biomass/tick at full suitability
  CONVERSION: 1.65,          // nutrient -> energy conversion
  MAINTENANCE_RATE: 0.0024,  // energy/biomass/tick
  MAINTENANCE_ENTROPY: 0.8,  // extra maintenance multiplier at entropy 1
  ENERGY_CAP: 6.0,           // per-node stored energy cap
  BIOMASS_MAX: 2.5,          // maturity cap per node
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
  GROW_COST: 0.22,           // energy to open a new frontier node
  GROW_P_BASE: 0.3,          // base expansion probability per candidate/tick
  GROW_PER_NODE_CAP: 2,      // max expansions per node per tick
  NEW_BIOMASS: 0.3,          // biomass seeded into a new node
  CROWDING_PENALTY: 0.14,    // per alive neighbor beyond 2

  // --- scoring -----------------------------------------------------------------
  SCORE_WEIGHTS: Object.freeze({
    survival: 0.18,
    exploration: 0.22,
    presence: 0.18,
    coherence: 0.14,
    stewardship: 0.18,
    worldmaking: 0.10,
  }),
  ECHO_BASE: 8,
  ECHO_DIVISOR: 80,
});
