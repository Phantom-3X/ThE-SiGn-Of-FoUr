/**
 * demandSimulator.js
 * 
 * Simulates fluctuating passenger demand across city zones.
 * Applies time-of-day patterns and metro disruption impacts.
 */

const systemState = require("../state/systemState");
const { DEMAND_UPDATE_INTERVAL, RUSH_HOURS } = require("../config/simulationConfig");
const { DEMAND_MIN, DEMAND_MAX } = require("../config/constants");
const { randomInt } = require("../utils/randomGenerator");
const { isRushHour, isNightTime } = require("../utils/timeUtils");

// Metro station names for proximity checking
const METRO_CONNECTED_ZONES = [
  "PCMC", "Shivajinagar", "Deccan", "Railway Station", "Pune Station"
];

/**
 * Calculate demand multiplier based on time of day
 */
function getTimeMultiplier() {
  if (isRushHour()) {
    return 1.5;
  }
  if (isNightTime()) {
    return 0.6;
  }
  return 1.0;
}

/**
 * Check if zone is near metro stations
 */
function isNearMetro(zoneName) {
  const lowerName = zoneName.toLowerCase();
  return METRO_CONNECTED_ZONES.some(station => 
    lowerName.includes(station.toLowerCase()) ||
    station.toLowerCase().includes(lowerName.split(" ")[0])
  );
}

/**
 * Calculate metro impact on bus demand
 */
function getMetroImpact(zone) {
  const metro = systemState.metro;
  
  // No impact if metro is normal
  if (metro.status === "normal" && metro.delay_minutes === 0) {
    return 1.0;
  }
  
  // Only affect zones near metro
  if (!isNearMetro(zone.name)) {
    return 1.0;
  }
  
  // Delayed or crowded metro increases bus demand
  if (metro.status === "delayed") {
    // Higher delay = higher impact (20-40% increase)
    const delayFactor = Math.min(metro.delay_minutes / 20, 1);
    return 1.2 + (delayFactor * 0.2);
  }
  
  if (metro.status === "crowded") {
    return 1.25;
  }
  
  return 1.0;
}

/**
 * Update demand for a single zone
 */
function updateZoneDemand(zone) {
  // Start with base demand
  let demand = zone.base_demand;
  
  // Apply random fluctuation (-10 to +15)
  demand += randomInt(-10, 15);
  
  // Apply time multiplier
  demand *= getTimeMultiplier();
  
  // Apply metro impact
  demand *= getMetroImpact(zone);
  
  // Round to integer
  demand = Math.round(demand);
  
  // Clamp to valid range
  demand = Math.max(DEMAND_MIN, Math.min(DEMAND_MAX, demand));
  
  // Update current demand
  zone.current_demand = demand;
  
  // Update predicted demand (slightly higher than current for simulation)
  zone.predicted_demand = Math.min(
    DEMAND_MAX,
    Math.round(demand * (1 + randomInt(5, 15) / 100))
  );
}

/**
 * Update all demand zones in a single tick
 */
function tickDemandUpdate() {
  systemState.demandZones.forEach(zone => {
    updateZoneDemand(zone);
  });
}

/**
 * Start the demand simulation loop
 */
function startDemandSimulation() {
  console.log("[DemandSimulator] Initializing demand simulation...");
  
  setInterval(() => {
    tickDemandUpdate();
  }, DEMAND_UPDATE_INTERVAL);
  
  console.log(`[DemandSimulator] Running every ${DEMAND_UPDATE_INTERVAL}ms`);
}

module.exports = startDemandSimulation;