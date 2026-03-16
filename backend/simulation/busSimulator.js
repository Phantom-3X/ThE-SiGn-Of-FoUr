/**
 * busSimulator.js
 * 
 * Simulates real-time bus movement across routes.
 * Buses are spread across routes on startup, move smoothly via linear
 * interpolation, and boarding scales with nearby zone demand.
 */

const systemState = require("../state/systemState");
const { BUS_UPDATE_INTERVAL } = require("../config/simulationConfig");
const { calculateDistance } = require("../utils/geoUtils");
const { randomInt } = require("../utils/randomGenerator");

// Track each bus's current stop index and interpolation progress
const busProgress = {};

// Fixed step size per tick (fraction of segment to cover each tick)
// ~6-8 ticks to cross one stop segment = smooth visible movement
const STEP_SIZE = 0.14;

/**
 * Get route by ID
 */
function getRouteById(routeId) {
  return systemState.routes.find(r => r.route_id === routeId);
}

/**
 * Find nearest demand zone to a lat/lng and return its current_demand.
 * Used to scale boarding realistically.
 */
function getNearbyZone(lat, lng) {
  let closest = null;
  let minDist = Infinity;

  for (const zone of systemState.demandZones) {
    const d = Math.abs(zone.lat - lat) + Math.abs(zone.lng - lng); // Manhattan approx
    if (d < minDist) {
      minDist = d;
      closest = zone;
    }
  }

  return closest;
}

function getNearbyDemand(lat, lng) {
  const zone = getNearbyZone(lat, lng);
  return zone ? zone.current_demand : 50;
}

/**
 * Ensure a bus has a progress entry. Creates one at a given stop index.
 */
function ensureProgress(bus, startStopIndex) {
  if (!busProgress[bus.bus_id]) {
    busProgress[bus.bus_id] = {
      stopIndex: startStopIndex,
      t: 0,            // linear interpolation 0..1 between stops
      atStop: false,
      ticksAtStop: 0
    };
  }
}

/**
 * Spread buses evenly along their routes at startup.
 * Instead of all buses at stop 0, distribute them across stops.
 */
function initializeBusProgress() {
  // Group buses by route
  const byRoute = {};
  systemState.buses.forEach(bus => {
    if (!byRoute[bus.route_id]) byRoute[bus.route_id] = [];
    byRoute[bus.route_id].push(bus);
  });

  Object.entries(byRoute).forEach(([routeId, buses]) => {
    const route = getRouteById(routeId);
    if (!route || route.stops.length < 2) return;

    const stopCount = route.stops.length;

    buses.forEach((bus, idx) => {
      // Distribute evenly: each bus starts at a different stop
      const startStop = Math.floor((idx / buses.length) * stopCount) % stopCount;
      const nextStop = (startStop + 1) % stopCount;

      // Place bus partway between startStop and nextStop for visual spread
      const fraction = (idx % 3) * 0.3; // 0, 0.3, 0.6
      const s = route.stops[startStop];
      const n = route.stops[nextStop];

      bus.lat = s.lat + (n.lat - s.lat) * fraction;
      bus.lng = s.lng + (n.lng - s.lng) * fraction;

      busProgress[bus.bus_id] = {
        stopIndex: startStop,
        t: fraction,
        atStop: false,
        ticksAtStop: 0
      };
    });
  });
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
    bus.status = "active";
  }
}

/**
 * Simulate passengers boarding and alighting at a stop.
 * Boarding scales with nearby demand zone — high demand = more passengers.
 */
function simulateBoarding(bus) {
  // Passengers leaving: random 0-10
  const leaving = Math.min(randomInt(8, 20), bus.current_load);
  bus.current_load -= leaving;

  // Get demand near this bus stop
  const demand = getNearbyDemand(bus.lat, bus.lng);

  // Scale boarding by demand: low demand (20) → 2-8, high demand (100) → 8-22
  const demandFactor = Math.max(0.2, Math.min(demand / 100, 1.0));
  const minBoard = Math.round(2 * demandFactor);
  const maxBoard = Math.round(8 * demandFactor);

  const availableSpace = bus.capacity - bus.current_load;
  const boarding = Math.min(randomInt(minBoard, maxBoard), availableSpace);
  bus.current_load += boarding;

  // Clamp
  bus.current_load = Math.max(0, Math.min(bus.current_load, bus.capacity));

  // Demand decay: reduce zone demand as passengers are served
  const nearbyZone = getNearbyZone(bus.lat, bus.lng);
  if (nearbyZone && boarding > 0) {
    nearbyZone.current_demand = Math.max(20, nearbyZone.current_demand - boarding);
  }

  updateBusStatus(bus);
}

/**
 * Update a single bus position along its route using linear interpolation.
 * This produces even-speed movement instead of exponential slowdown.
 */
function updateBusPosition(bus) {
  const route = getRouteById(bus.route_id);
  if (!route || !route.stops || route.stops.length < 2) return;

  // Handle dynamically deployed buses with no progress entry
  ensureProgress(bus, 0);
  const progress = busProgress[bus.bus_id];

  const stops = route.stops;
  const curIdx = progress.stopIndex;
  const nextIdx = (curIdx + 1) % stops.length;
  const curStop = stops[curIdx];
  const nextStop = stops[nextIdx];

  // If at a stop, handle dwell time
  if (progress.atStop) {
    progress.ticksAtStop++;
    // Dwell at stop for 2 ticks (~6 seconds)
    if (progress.ticksAtStop >= 2) {
      progress.atStop = false;
      progress.stopIndex = nextIdx;
      progress.t = 0;
    }
    return;
  }

  // Advance interpolation parameter
  progress.t += STEP_SIZE;

  if (progress.t >= 1.0) {
    // Arrived at next stop
    progress.t = 0;
    bus.lat = nextStop.lat;
    bus.lng = nextStop.lng;
    progress.atStop = true;
    progress.ticksAtStop = 0;
    simulateBoarding(bus);
  } else {
    // Linear interpolation — constant speed between stops
    bus.lat = curStop.lat + (nextStop.lat - curStop.lat) * progress.t;
    bus.lng = curStop.lng + (nextStop.lng - curStop.lng) * progress.t;
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

  console.log(`[BusSimulator] ${systemState.buses.length} buses spread across ${systemState.routes.length} routes, updating every ${BUS_UPDATE_INTERVAL}ms`);
}

module.exports = startBusSimulation;