/**
 * metroSimulator.js
 * 
 * Simulates metro system status changes and disruptions.
 * Events persist for a realistic duration instead of flickering every tick.
 * Metro status influences bus demand in nearby zones via demandSimulator.
 */

const systemState = require("../state/systemState");
const { METRO_UPDATE_INTERVAL } = require("../config/simulationConfig");
const { METRO_STATUS } = require("../config/constants");
const { randomInt, randomChance, weightedRandom } = require("../utils/randomGenerator");
const { isRushHour, isNightTime } = require("../utils/timeUtils");

// Passenger flow ranges by time of day
const FLOW = {
  rush:  { min: 14000, max: 20000 },
  day:   { min: 8000,  max: 13000 },
  night: { min: 2000,  max: 5000 }
};

// Event persistence: how many ticks the current status should last
// This prevents flickering between states every 10 seconds
let eventTicksRemaining = 0;

/**
 * Determine if a new metro event should trigger.
 * Only trigger when previous event has expired.
 */
function shouldTriggerEvent() {
  if (eventTicksRemaining > 0) return false;
  // 12% chance per tick when idle (roughly once every ~80 seconds)
  return randomChance(0.12);
}

/**
 * Generate a random metro status using weighted selection.
 * Rush hour has higher chance of crowding.
 */
function generateRandomStatus() {
  const rush = isRushHour();
  const items = [
    { item: METRO_STATUS.NORMAL,  weight: rush ? 50 : 70 },
    { item: METRO_STATUS.CROWDED, weight: rush ? 35 : 20 },
    { item: METRO_STATUS.DELAYED, weight: rush ? 15 : 10 }
  ];
  return weightedRandom(items);
}

/**
 * Set how long the new status should persist (in ticks).
 * Delayed events last longer than crowded.
 */
function setEventDuration(status) {
  if (status === "delayed") {
    eventTicksRemaining = randomInt(4, 8); // 40-80 seconds
  } else if (status === "crowded") {
    eventTicksRemaining = randomInt(3, 6); // 30-60 seconds
  } else {
    eventTicksRemaining = randomInt(5, 12); // normal period: 50-120 seconds
  }
}

/**
 * Update metro delay minutes based on current status
 */
function updateDelayMinutes() {
  const metro = systemState.metro;

  if (metro.status === "delayed") {
    if (metro.delay_minutes === 0) {
      metro.delay_minutes = randomInt(5, 20);
    }
  } else {
    // Gradually reduce delay when not in delayed status
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

  // Determine base flow range by time of day
  let range;
  if (isRushHour()) {
    range = FLOW.rush;
  } else if (isNightTime()) {
    range = FLOW.night;
  } else {
    range = FLOW.day;
  }

  let flow = randomInt(range.min, range.max);

  // Status modifiers
  if (metro.status === "delayed") {
    flow = Math.round(flow * 0.6); // fewer trains → less flow
  } else if (metro.status === "crowded") {
    flow = Math.round(flow * 1.15);
  }

  metro.passenger_flow = flow;
}

/**
 * Run metro simulation tick
 */
function tickMetroUpdate() {
  // Decrement event timer
  if (eventTicksRemaining > 0) {
    eventTicksRemaining--;
  }

  // Check if a new event should trigger
  if (shouldTriggerEvent()) {
    const newStatus = generateRandomStatus();
    systemState.metro.status = newStatus;
    setEventDuration(newStatus);

    // Reset delay for fresh delayed events
    if (newStatus === "delayed") {
      systemState.metro.delay_minutes = 0; // updateDelayMinutes will set it
    }
  }

  updateDelayMinutes();
  updatePassengerFlow();
}

/**
 * Start the metro simulation loop
 */
function startMetroSimulation() {
  console.log("[MetroSimulator] Initializing metro simulation...");

  // Start with a normal period so the demo begins stable
  eventTicksRemaining = randomInt(3, 6);

  setInterval(() => {
    tickMetroUpdate();
  }, METRO_UPDATE_INTERVAL);

  console.log(`[MetroSimulator] Running every ${METRO_UPDATE_INTERVAL}ms`);
}

module.exports = startMetroSimulation;