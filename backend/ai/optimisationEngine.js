/**
 * optimisationEngine.js
 *
 * Phase 2 — Multi-Objective Optimisation
 *
 * Models three objectives:
 *  - passengerWaitScore (w1 = 0.5): avg route load factor (high load = high wait = bad)
 *  - fuelScore         (w2 = 0.3): active buses / total buses (more buses = more fuel)
 *  - emptyKmScore      (w3 = 0.2): fraction of bus-distances from underutilised buses
 *
 * Combined: total = w1*waitScore + w2*fuelScore + w3*emptyKmScore (lower = better)
 *
 * Runs every 10 seconds.
 */

const systemState = require("../state/systemState");
const { METRICS_UPDATE_INTERVAL } = require("../config/simulationConfig");

// =============================================================================
// SCORE CALCULATIONS
// =============================================================================

function calcWaitScore() {
  const buses = systemState.buses;
  if (buses.length === 0) return 0;

  const routeLoads = {};
  buses.forEach(b => {
    if (!routeLoads[b.route_id]) routeLoads[b.route_id] = { load: 0, cap: 0 };
    routeLoads[b.route_id].load += b.current_load;
    routeLoads[b.route_id].cap  += b.capacity;
  });

  const factors = Object.values(routeLoads).map(r => r.cap > 0 ? r.load / r.cap : 0);
  if (factors.length === 0) return 0;
  return factors.reduce((s, v) => s + v, 0) / factors.length;
}

function calcFuelScore() {
  const total = systemState.buses.length;
  if (total === 0) return 0;
  const active = systemState.buses.filter(b => b.status === "active").length;
  return active / total;
}

function calcEmptyKmScore() {
  const buses = systemState.buses;
  if (buses.length === 0) return 0;

  let underutilisedCount = 0;
  buses.forEach(b => {
    const factor = b.capacity > 0 ? b.current_load / b.capacity : 0;
    if (factor < 0.3) underutilisedCount++;
  });

  return underutilisedCount / buses.length;
}

// =============================================================================
// MAIN UPDATE
// =============================================================================

function updateOptimisationScore() {
  const { w1, w2, w3 } = systemState.optimisationWeights;

  const waitScore   = Math.round(calcWaitScore()   * 1000) / 1000;
  const fuelScore   = Math.round(calcFuelScore()   * 1000) / 1000;
  const emptyKmScore = Math.round(calcEmptyKmScore() * 1000) / 1000;

  const total = Math.round((w1 * waitScore + w2 * fuelScore + w3 * emptyKmScore) * 1000) / 1000;

  // Determine binding constraint (highest weighted contribution)
  const contributions = [
    { key: "waitScore",    val: w1 * waitScore   },
    { key: "fuelScore",    val: w2 * fuelScore   },
    { key: "emptyKmScore", val: w3 * emptyKmScore }
  ];
  contributions.sort((a, b) => b.val - a.val);
  const bindingConstraint = contributions[0].key;

  systemState.optimisationScore = {
    waitScore,
    fuelScore,
    emptyKmScore,
    total,
    bindingConstraint,
    weights: { w1, w2, w3 },
    timestamp: new Date().toISOString()
  };
}

function getOptimisationScore() {
  return systemState.optimisationScore;
}

function setOptimisationWeights(w1, w2, w3) {
  if (Math.abs(w1 + w2 + w3 - 1.0) > 0.001) {
    return { success: false, message: "Weights must sum to 1.0" };
  }
  if (w1 < 0 || w2 < 0 || w3 < 0) {
    return { success: false, message: "All weights must be >= 0" };
  }
  systemState.optimisationWeights = {
    w1: Math.round(w1 * 1000) / 1000,
    w2: Math.round(w2 * 1000) / 1000,
    w3: Math.round(w3 * 1000) / 1000
  };
  updateOptimisationScore();
  console.log(`[OptimisationEngine] Weights updated: w1=${w1}, w2=${w2}, w3=${w3}`);
  return { success: true, message: "Weights updated", weights: systemState.optimisationWeights };
}

function startOptimisationEngine() {
  console.log("[OptimisationEngine] Initializing multi-objective optimisation engine...");
  updateOptimisationScore();
  setInterval(updateOptimisationScore, METRICS_UPDATE_INTERVAL);
  console.log(`[OptimisationEngine] Running every ${METRICS_UPDATE_INTERVAL}ms`);
}

module.exports = {
  startOptimisationEngine,
  updateOptimisationScore,
  getOptimisationScore,
  setOptimisationWeights
};
