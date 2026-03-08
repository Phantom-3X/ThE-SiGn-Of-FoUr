/**
 * metroSimulator.js
 * 
 * Simulates metro system status changes and disruptions.
 * Metro status influences bus demand in nearby zones.
 */

const systemState = require("../state/systemState");
const { METRO_UPDATE_INTERVAL } = require("../config/simulationConfig");
const { METRO_STATUS } = require("../config/constants");
const { randomInt, randomChance, weightedRandom } = require("../utils/randomGenerator");
const { isRushHour, isNightTime } = require("../utils/timeUtils");

// Base passenger flow values
const BASE_FLOW = 12000;
const RUSH_HOUR_FLOW = 18000;
const NIGHT_FLOW = 4000;

/**
 * Determine if a random metro event should occur
 */
function shouldTriggerEvent() {
  // 15% chance of status change per interval
  return randomChance(0.15);
}

/**
 * Generate a random metro status using weighted selection
 */
function generateRandomStatus() {
  const items = [
    { item: METRO_STATUS.NORMAL, weight: 70 },
    { item: METRO_STATUS.CROWDED, weight: 20 },
    { item: METRO_STATUS.DELAYED, weight: 10 }
  ];
  return weightedRandom(items);
}

/**
 * Update metro delay minutes based on current status
 */
function updateDelayMinutes() {
  const metro = systemState.metro;
  
  if (metro.status === "delayed") {
    // Set random delay between 5 and 20 minutes
    if (metro.delay_minutes === 0) {
      metro.delay_minutes = randomInt(5, 20);
    }
  } else {
    // Gradually reduce delay when not delayed
    if (metro.delay_minutes > 0) {
      metro.delay_minutes = Math.max(0, metro.delay_minutes - randomInt(1, 3));
    }
  }
}

/**
 * Update metro passenger flow based on time and status
 */
function updatePassengerFlow() {
  const metro = systemState.metro;
  
  // Determine base flow by time of day
  let flow;
  if (isRushHour()) {
    flow = RUSH_HOUR_FLOW;
  } else if (isNightTime()) {
    flow = NIGHT_FLOW;
  } else {
    flow = BASE_FLOW;
  }
  
  // Reduce flow during delays
  if (metro.status === "delayed") {
    flow *= 0.6;
  } else if (metro.status === "crowded") {
    flow *= 1.15;
  }
  
  // Apply small random variation (±10%)
  flow *= (0.9 + Math.random() * 0.2);
  
  metro.passenger_flow = Math.round(flow);
}

/**
 * Run metro simulation tick
 */
function tickMetroUpdate() {
  const metro = systemState.metro;
  
  // Check if status change should occur
  if (shouldTriggerEvent()) {
    metro.status = generateRandomStatus();
  }
  
  // Update delay minutes
  updateDelayMinutes();
  
  // Update passenger flow
  updatePassengerFlow();
}

/**
 * Start the metro simulation loop
 */
function startMetroSimulation() {
  console.log("[MetroSimulator] Initializing metro simulation...");
  
  setInterval(() => {
    tickMetroUpdate();
  }, METRO_UPDATE_INTERVAL);
  
  console.log(`[MetroSimulator] Running every ${METRO_UPDATE_INTERVAL}ms`);
}

module.exports = startMetroSimulation;

module.exports = startMetroSimulation;