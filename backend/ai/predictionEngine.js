/**
 * predictionEngine.js
 * 
 * AI module for demand prediction using heuristic models.
 * 
 * Responsibilities:
 * - Generate predicted_demand values for demand zones
 * - Use time-based patterns for prediction
 * - Factor in historical trends and metro status
 * - Provide short-term (15 min) and medium-term (1 hr) predictions
 * 
 * Data dependencies:
 * - systemState.demandZones[] - zones with base_demand, current_demand
 * - systemState.metro - metro status for impact calculation
 */

const systemState = require("../state/systemState");
const { PREDICTION_INTERVAL, RUSH_HOURS } = require("../config/simulationConfig");
const { RUSH_HOUR_MULTIPLIER } = require("../config/constants");
const { isRushHour, getMinutesUntilRushHour } = require("../utils/timeUtils");

// =============================================================================
// PREDICTION MODELS
// =============================================================================

/**
 * Simple moving average prediction
 * @param {number} currentValue - Current demand value
 * @param {number} baseValue - Base demand value
 * @returns {number} Predicted value
 */
function movingAveragePrediction(currentValue, baseValue) {
  // TODO: Calculate weighted average of current and base
  // TODO: Apply trend factor based on recent changes
  return currentValue;
}

/**
 * Time-based prediction adjustment
 * @param {number} basePrediction - Initial prediction
 * @returns {number} Adjusted prediction
 */
function applyTimeFactor(basePrediction) {
  // TODO: Check time until next rush hour
  // TODO: Gradually increase prediction as rush hour approaches
  // TODO: Apply RUSH_HOUR_MULTIPLIER during rush hours
  return basePrediction;
}

/**
 * Metro impact prediction adjustment
 * @param {number} basePrediction - Initial prediction
 * @param {Object} zone - Demand zone
 * @returns {number} Adjusted prediction
 */
function applyMetroImpact(basePrediction, zone) {
  // TODO: Check systemState.metro.status
  // TODO: If delayed, increase prediction for zones near metro stations
  // TODO: Calculate proximity bonus
  return basePrediction;
}

/**
 * Generate prediction for a single zone
 * @param {Object} zone - Demand zone object
 * @returns {number} Predicted demand value
 */
function predictZoneDemand(zone) {
  // TODO: Start with moving average prediction
  // TODO: Apply time factor
  // TODO: Apply metro impact
  // TODO: Clamp to reasonable bounds
  // TODO: Return rounded prediction
  return zone.current_demand;
}

// =============================================================================
// MAIN PREDICTION FUNCTIONS
// =============================================================================

/**
 * Run predictions for all zones
 * Updates systemState.demandZones[].predicted_demand
 */
function runPredictions() {
  systemState.demandZones.forEach(zone => {
    let predicted = predictZoneDemand(zone);

    // Boost prediction if an active event targets this zone
    const activeEvent = (systemState.events || []).find(
      e => e.active && e.zone_id === zone.zone_id
    );
    if (activeEvent) {
      predicted = Math.round(predicted * 1.2);
    }

    zone.predicted_demand = predicted;
  });
  console.log("[PredictionEngine] Predictions updated");
}

/**
 * Get prediction summary for dashboard
 * @returns {Object} Summary of predictions
 */
function getPredictionSummary() {
  // TODO: Calculate average predicted demand
  // TODO: Identify zones with highest predicted increase
  // TODO: Return summary object
  return {
    averagePredicted: 0,
    highDemandZones: [],
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// EXPORTED FUNCTIONS
// =============================================================================

/**
 * Start the prediction engine loop
 */
function startPredictionEngine() {
  console.log("[PredictionEngine] Initializing prediction engine...");
  
  setInterval(() => {
    runPredictions();
  }, PREDICTION_INTERVAL);
  
  console.log(`[PredictionEngine] Running every ${PREDICTION_INTERVAL}ms`);
}

module.exports = {
  startPredictionEngine,
  runPredictions,
  predictZoneDemand,
  getPredictionSummary
};