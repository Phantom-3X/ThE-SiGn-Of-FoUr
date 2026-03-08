/**
 * predictionEngine.js
 *
 * AI module for demand prediction using weighted moving average,
 * trend detection, time-of-day adjustment, and event awareness.
 *
 * Interval: every 10 seconds
 */

const systemState = require("../state/systemState");
const { PREDICTION_INTERVAL } = require("../config/simulationConfig");
const { DEMAND_MIN, DEMAND_MAX } = require("../config/constants");
const { isRushHour, isNightTime } = require("../utils/timeUtils");

const HISTORY_SIZE = 5;
const WEIGHTS = [1, 2, 3, 4, 5]; // recent values weigh more

// =============================================================================
// HISTORY MANAGEMENT
// =============================================================================

/**
 * Ensure zone has a demand_history array; append current_demand.
 */
function recordHistory(zone) {
  if (!zone.demand_history) zone.demand_history = [];
  zone.demand_history.push(zone.current_demand);
  if (zone.demand_history.length > HISTORY_SIZE) {
    zone.demand_history.shift();
  }
}

// =============================================================================
// PREDICTION STEPS
// =============================================================================

/**
 * Step 1 — Weighted moving average over the history window.
 */
function weightedMovingAverage(history) {
  const len = history.length;
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < len; i++) {
    const w = WEIGHTS[WEIGHTS.length - len + i]; // align to tail of weights
    weightedSum += history[i] * w;
    weightTotal += w;
  }
  return weightedSum / weightTotal;
}

/**
 * Step 2 — Trend detection: positive = rising, negative = falling.
 */
function detectTrend(history) {
  if (history.length < 2) return 0;
  return history[history.length - 1] - history[history.length - 2];
}

/**
 * Step 3 — Time-of-day multiplier.
 */
function timeOfDayFactor() {
  if (isRushHour()) return 1.2;
  if (isNightTime()) return 0.8;
  return 1.0;
}

/**
 * Step 4 — Event adjustment: boost if active event targets this zone.
 */
function eventFactor(zoneId) {
  const activeEvent = (systemState.events || []).find(
    e => e.active && e.zone_id === zoneId
  );
  return activeEvent ? 1.2 : 1.0;
}

// =============================================================================
// MAIN PREDICTION
// =============================================================================

/**
 * Generate prediction for a single zone.
 */
function predictZoneDemand(zone) {
  const history = zone.demand_history;
  if (!history || history.length === 0) return zone.current_demand;

  // Step 1: weighted average
  let prediction = weightedMovingAverage(history);

  // Step 2: add trend momentum
  const trend = detectTrend(history);
  prediction += trend * 0.5;

  // Step 3: time-of-day
  prediction *= timeOfDayFactor();

  // Step 4: event boost
  prediction *= eventFactor(zone.zone_id);

  // Clamp and round
  prediction = Math.round(Math.max(DEMAND_MIN, Math.min(DEMAND_MAX, prediction)));
  return prediction;
}

/**
 * Run predictions for all zones.
 */
function runPredictions() {
  systemState.demandZones.forEach(zone => {
    recordHistory(zone);
    zone.predicted_demand = predictZoneDemand(zone);
  });
  console.log("[PredictionEngine] Predictions updated");
}

/**
 * Get prediction summary for dashboard.
 */
function getPredictionSummary() {
  const zones = systemState.demandZones;
  const avgPredicted = zones.length
    ? Math.round(zones.reduce((s, z) => s + z.predicted_demand, 0) / zones.length)
    : 0;

  const highDemandZones = zones
    .filter(z => z.predicted_demand > z.current_demand * 1.2)
    .map(z => ({ zone_id: z.zone_id, name: z.name, predicted: z.predicted_demand }));

  return { averagePredicted: avgPredicted, highDemandZones, timestamp: new Date().toISOString() };
}

// =============================================================================
// STARTUP
// =============================================================================

function startPredictionEngine() {
  console.log("[PredictionEngine] Initializing prediction engine...");
  setInterval(runPredictions, PREDICTION_INTERVAL);
  console.log(`[PredictionEngine] Running every ${PREDICTION_INTERVAL}ms`);
}

module.exports = {
  startPredictionEngine,
  runPredictions,
  predictZoneDemand,
  getPredictionSummary
};