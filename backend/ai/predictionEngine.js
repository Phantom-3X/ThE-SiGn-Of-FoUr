/**
 * predictionEngine.js
 *
 * AI module for demand prediction using weighted moving average,
 * trend detection, time-of-day adjustment, and event awareness.
 *
 * Interval: every 10 seconds
 *
 * Phase 5: Accuracy tracking — after each demand update (every 5s),
 *   compare predicted_demand with actual current_demand, compute APE,
 *   store last 20 readings per zone in systemState.predictionAccuracy.
 */

const systemState = require("../state/systemState");
const { PREDICTION_INTERVAL } = require("../config/simulationConfig");
const { DEMAND_MIN, DEMAND_MAX } = require("../config/constants");
const { isRushHour, isNightTime } = require("../utils/timeUtils");

const HISTORY_SIZE   = 5;
const ACCURACY_SIZE  = 20;
const WEIGHTS        = [1, 2, 3, 4, 5];

// =============================================================================
// HISTORY MANAGEMENT
// =============================================================================

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

function weightedMovingAverage(history) {
  const len = history.length;
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < len; i++) {
    const w = WEIGHTS[WEIGHTS.length - len + i];
    weightedSum += history[i] * w;
    weightTotal += w;
  }
  return weightedSum / weightTotal;
}

function detectTrend(history) {
  if (history.length < 2) return 0;
  return history[history.length - 1] - history[history.length - 2];
}

function timeOfDayFactor() {
  if (isRushHour()) return 1.2;
  if (isNightTime()) return 0.8;
  return 1.0;
}

function eventFactor(zoneId) {
  const activeEvent = (systemState.events || []).find(
    e => e.active && e.zone_id === zoneId
  );
  return activeEvent ? 1.2 : 1.0;
}

// =============================================================================
// MAIN PREDICTION
// =============================================================================

function predictZoneDemand(zone) {
  const history = zone.demand_history;
  if (!history || history.length === 0) return zone.current_demand;

  let prediction = weightedMovingAverage(history);
  const trend    = detectTrend(history);
  prediction    += trend * 0.5;
  prediction    *= timeOfDayFactor();
  prediction    *= eventFactor(zone.zone_id);

  prediction = Math.round(Math.max(DEMAND_MIN, Math.min(DEMAND_MAX, prediction)));
  return prediction;
}

function runPredictions() {
  systemState.demandZones.forEach(zone => {
    recordHistory(zone);
    zone.predicted_demand = predictZoneDemand(zone);
  });
  console.log("[PredictionEngine] Predictions updated");
}

// =============================================================================
// PHASE 5 — ACCURACY TRACKING
// =============================================================================

/**
 * Called after each demand update (from demandSimulator tick).
 * Compares the previously stored predicted_demand with the new actual current_demand.
 */
function updateAccuracy() {
  const acc = systemState.predictionAccuracy;

  systemState.demandZones.forEach(zone => {
    if (!zone.predicted_demand || !zone.current_demand || zone.current_demand === 0) return;

    // APE = |predicted - actual| / actual * 100
    const ape = Math.abs(zone.predicted_demand - zone.current_demand) / zone.current_demand * 100;

    if (!acc[zone.zone_id]) acc[zone.zone_id] = [];

    acc[zone.zone_id].push({
      predicted: zone.predicted_demand,
      actual: zone.current_demand,
      ape: Math.round(ape * 10) / 10,
      timestamp: new Date().toISOString()
    });

    // Keep last ACCURACY_SIZE readings
    if (acc[zone.zone_id].length > ACCURACY_SIZE) {
      acc[zone.zone_id].shift();
    }
  });
}

function getPredictionAccuracy() {
  const acc = systemState.predictionAccuracy;
  const byZone = {};

  let allApes = [];

  systemState.demandZones.forEach(zone => {
    const readings = acc[zone.zone_id] || [];
    const zoneApes = readings.map(r => r.ape);
    const meanApe  = zoneApes.length > 0
      ? zoneApes.reduce((s, v) => s + v, 0) / zoneApes.length
      : 0;

    byZone[zone.zone_id] = {
      zone_name: zone.name,
      accuracy: Math.round((100 - meanApe) * 10) / 10,
      readings: readings.slice(-20),
      sample_count: readings.length
    };

    allApes = allApes.concat(zoneApes);
  });

  const overallMeanApe = allApes.length > 0
    ? allApes.reduce((s, v) => s + v, 0) / allApes.length
    : 0;

  const overallAccuracy = Math.round((100 - overallMeanApe) * 10) / 10;

  return {
    byZone,
    overallAccuracy: Math.max(0, overallAccuracy),
    target: 80,
    sample_count: allApes.length,
    timestamp: new Date().toISOString()
  };
}

function getPredictionSummary() {
  const zones = systemState.demandZones;
  const avgPredicted = zones.length
    ? Math.round(zones.reduce((s, z) => s + z.predicted_demand, 0) / zones.length)
    : 0;

  const highDemandZones = zones
    .filter(z => z.predicted_demand > z.current_demand * 1.2)
    .map(z => ({ zone_id: z.zone_id, name: z.name, predicted: z.predicted_demand }));

  return {
    averagePredicted: avgPredicted,
    highDemandZones,
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// STARTUP
// =============================================================================

function startPredictionEngine() {
  console.log("[PredictionEngine] Initializing prediction engine...");
  setInterval(runPredictions, PREDICTION_INTERVAL);

  // Phase 5: accuracy tracking runs every 5s (after demand updates)
  setInterval(updateAccuracy, 5000);

  console.log(`[PredictionEngine] Prediction running every ${PREDICTION_INTERVAL}ms`);
  console.log("[PredictionEngine] Accuracy tracking running every 5000ms");
}

module.exports = {
  startPredictionEngine,
  runPredictions,
  predictZoneDemand,
  getPredictionSummary,
  getPredictionAccuracy,
  updateAccuracy
};
