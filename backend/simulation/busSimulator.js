/**
 * busSimulator.js
 * 
 * Simulates real-time bus movement across routes.
 * Moves buses along route stops and simulates passenger boarding/alighting.
 */

const systemState = require("../state/systemState");
const { BUS_UPDATE_INTERVAL } = require("../config/simulationConfig");
const { calculateDistance } = require("../utils/geoUtils");
const { randomInt } = require("../utils/randomGenerator");

// Track each bus's current stop index and progress
const busProgress = {};

// Movement speed factor (how much of the distance to cover per tick)
const MOVEMENT_SPEED = 0.15;
// Distance threshold to consider bus "at stop" (in km)
const STOP_THRESHOLD = 0.05;

/**
 * Initialize bus progress tracking for all buses
 */
function initializeBusProgress() {
  systemState.buses.forEach(bus => {
    busProgress[bus.bus_id] = {
      stopIndex: 0,
      progress: 0,
      atStop: true,
      ticksAtStop: 0
    };
  });
}

/**
 * Get route by ID
 */
function getRouteById(routeId) {
  return systemState.routes.find(r => r.route_id === routeId);
}

/**
 * Update bus status based on load factor
 */
function updateBusStatus(bus) {
  const loadFactor = bus.current_load / bus.capacity;
  
  if (loadFactor > 0.85) {
    bus.status = "crowded";
  } else if (loadFactor < 0.30) {
    bus.status = "underutilized";
  } else {
    bus.status = "normal";
  }
}

/**
 * Simulate passengers boarding and alighting at a stop
 */
function simulateBoarding(bus) {
  // Passengers leaving: random 0-10
  const leaving = Math.min(randomInt(0, 10), bus.current_load);
  bus.current_load -= leaving;
  
  // Passengers boarding: random 5-20
  const availableSpace = bus.capacity - bus.current_load;
  const boarding = Math.min(randomInt(5, 20), availableSpace);
  bus.current_load += boarding;
  
  // Ensure bounds
  bus.current_load = Math.max(0, Math.min(bus.current_load, bus.capacity));
  
  // Update status
  updateBusStatus(bus);
}

/**
 * Update a single bus position along its route
 */
function updateBusPosition(bus) {
  const route = getRouteById(bus.route_id);
  if (!route || !route.stops || route.stops.length < 2) return;
  
  const progress = busProgress[bus.bus_id];
  if (!progress) return;
  
  const stops = route.stops;
  const currentStopIndex = progress.stopIndex;
  const nextStopIndex = (currentStopIndex + 1) % stops.length;
  
  const currentStop = stops[currentStopIndex];
  const nextStop = stops[nextStopIndex];
  
  // Calculate distance to next stop
  const distanceToNext = calculateDistance(
    bus.lat, bus.lng,
    nextStop.lat, nextStop.lng
  );
  
  // Check if at stop
  if (distanceToNext < STOP_THRESHOLD) {
    if (!progress.atStop) {
      progress.atStop = true;
      progress.ticksAtStop = 0;
      // Simulate boarding when arriving at stop
      simulateBoarding(bus);
    }
    
    progress.ticksAtStop++;
    
    // Stay at stop for 2 ticks (simulates dwell time)
    if (progress.ticksAtStop >= 2) {
      // Move to next stop
      progress.stopIndex = nextStopIndex;
      progress.atStop = false;
      progress.progress = 0;
      
      // Snap to stop position
      bus.lat = nextStop.lat;
      bus.lng = nextStop.lng;
    }
  } else {
    // Move toward next stop using interpolation
    progress.atStop = false;
    
    const deltaLat = nextStop.lat - bus.lat;
    const deltaLng = nextStop.lng - bus.lng;
    
    // Move a fraction of the remaining distance
    bus.lat += deltaLat * MOVEMENT_SPEED;
    bus.lng += deltaLng * MOVEMENT_SPEED;
  }
}

/**
 * Update all bus positions in a single tick
 */
function tickBusPositions() {
  systemState.buses.forEach(bus => {
    if (bus.status !== "idle" && bus.status !== "maintenance") {
      updateBusPosition(bus);
    }
  });
  
  // Increment simulation tick
  systemState.simulation.tick_count++;
}

/**
 * Start the bus simulation loop
 */
function startBusSimulation() {
  console.log("[BusSimulator] Initializing bus simulation...");
  
  initializeBusProgress();
  
  setInterval(() => {
    tickBusPositions();
  }, BUS_UPDATE_INTERVAL);
  
  console.log(`[BusSimulator] Running every ${BUS_UPDATE_INTERVAL}ms`);
}

module.exports = startBusSimulation;