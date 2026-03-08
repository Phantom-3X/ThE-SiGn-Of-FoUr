/**
 * simulationConfig.js
 * 
 * Configuration parameters for simulation intervals and behavior.
 * Adjust these values to control simulation speed and realism.
 */

// =============================================================================
// SIMULATION INTERVALS (in milliseconds)
// =============================================================================

const BUS_UPDATE_INTERVAL = 3000;      // How often bus positions update
const DEMAND_UPDATE_INTERVAL = 5000;   // How often demand values change
const METRO_UPDATE_INTERVAL = 10000;   // How often metro status changes
const EVENT_UPDATE_INTERVAL = 60000;   // How often city events are evaluated
const PREDICTION_INTERVAL = 10000;     // How often AI predictions run
const ALERT_CHECK_INTERVAL = 5000;     // How often alerts are evaluated
const METRICS_UPDATE_INTERVAL = 10000; // How often metrics are recalculated

// =============================================================================
// SIMULATION BEHAVIOR
// =============================================================================

const SIMULATION_SETTINGS = {
  // Bus movement
  busMovementEnabled: true,
  passengerBoardingEnabled: true,
  
  // Demand fluctuation
  demandFluctuationEnabled: true,
  rushHourSimulationEnabled: true,
  
  // Metro events
  metroEventsEnabled: true,
  randomDelaysEnabled: true,
  
  // AI features
  predictionsEnabled: true,
  alertsEnabled: true,
  recommendationsEnabled: true
};

// =============================================================================
// RUSH HOUR CONFIGURATION
// =============================================================================

const RUSH_HOURS = {
  morning: { start: 8, end: 10 },   // 8 AM - 10 AM
  evening: { start: 17, end: 20 }   // 5 PM - 8 PM
};

// =============================================================================
// RANDOMNESS FACTORS
// =============================================================================

const VARIABILITY = {
  demandFluctuation: 0.15,    // ±15% random variation
  boardingVariation: 0.20,    // ±20% passenger boarding variation
  delayProbability: 0.05      // 5% chance of metro delay per interval
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Intervals
  BUS_UPDATE_INTERVAL,
  DEMAND_UPDATE_INTERVAL,
  METRO_UPDATE_INTERVAL,
  PREDICTION_INTERVAL,
  ALERT_CHECK_INTERVAL,
  METRICS_UPDATE_INTERVAL,
  EVENT_UPDATE_INTERVAL,

  // Settings
  SIMULATION_SETTINGS,
  RUSH_HOURS,
  VARIABILITY
};