/**
 * busSimulator.js
 * 
 * Simulates real-time bus movement across routes.
 * Buses are spread across routes on startup, move smoothly via linear
 * interpolation, and boarding scales with nearby zone demand.
 */

const systemState = require("../state/systemState");
const { BUS_UPDATE_INTERVAL } = require("../config/simulationConfig");
const { UNDERUTILIZED_THRESHOLD, ALERT_TYPES, SEVERITY } = require("../config/constants");
const { calculateDistance } = require("../utils/geoUtils");
const { randomInt } = require("../utils/randomGenerator");
const { createAlert, addAlert } = require("../ai/alertEngine");

// Track each bus's current stop index and interpolation progress
const busProgress = {};

// Fixed distance to move per tick (in km) to maintain constant speed
// 0.3 km per 3 seconds = ~360 km/h (speeded up for simulation visibility)
const SPEED_KM_PER_TICK = 0.3;
const FULL_CROWD_THRESHOLD = 0.98;
const RETURN_THRESHOLD = 0.80;
const MAX_TEMP_SUPPORT_BUSES_PER_ROUTE = 2;

function trafficRank(status) {
  const normalized = String(status || "low").toLowerCase();
  if (normalized === "heavy") return 3;
  if (normalized === "moderate") return 2;
  return 1;
}

function isTrafficCritical(route) {
  return String(route?.traffic_status || "").toLowerCase() === "heavy";
}

function emitRerouteAlert(busId, fromRouteId, toRouteId, reason) {
  const alert = createAlert(
    ALERT_TYPES.REROUTING || "rerouting",
    SEVERITY.HIGH,
    `Rerouting: Bus ${busId} moved from ${fromRouteId} to ${toRouteId} (${reason})`,
    {
      bus_id: busId,
      from_route_id: fromRouteId,
      to_route_id: toRouteId,
      reason
    }
  );
  addAlert(alert);
}

/**
 * Calculate the nearest point index in a path array to a given lat/lng.
 */
function nearestPathIndex(lat, lng, pathLayout) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < pathLayout.length; i++) {
    const d = calculateDistance(lat, lng, pathLayout[i].lat, pathLayout[i].lng);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return bestIdx;
}

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
 * Ensure a bus has a progress entry. Creates one at a given path index.
 */
function ensureProgress(bus, startPathIndex) {
  if (!busProgress[bus.bus_id]) {
    busProgress[bus.bus_id] = {
      pathIndex: startPathIndex,
      atStop: false,
      ticksAtStop: 0,
      lastStopMatched: -1,
      routeId: bus.route_id
    };
  }
}

function resetBusProgressForRoute(bus, routeId) {
  const route = getRouteById(routeId);
  if (!route) return;

  const pathLayout = route.path && route.path.length > 0 ? route.path : route.stops;
  if (!pathLayout || pathLayout.length < 1) return;

  ensureProgress(bus, 0);
  const progress = busProgress[bus.bus_id];

  bus.lat = pathLayout[0].lat;
  bus.lng = pathLayout[0].lng;
  progress.pathIndex = 0;
  progress.atStop = false;
  progress.ticksAtStop = 0;
  progress.lastStopMatched = -1;
  progress.onAltPath = false;
  progress.routeId = routeId;
}

function getRouteLoadStats() {
  const routeStats = {};

  systemState.buses.forEach(bus => {
    if (bus.status === "idle" || bus.status === "maintenance") return;
    if (!routeStats[bus.route_id]) {
      routeStats[bus.route_id] = {
        totalLoad: 0,
        totalCapacity: 0,
        busCount: 0,
        tempSupportCount: 0
      };
    }

    const stats = routeStats[bus.route_id];
    stats.totalLoad += bus.current_load;
    stats.totalCapacity += bus.capacity;
    stats.busCount++;
    if (bus.auto_reroute) stats.tempSupportCount++;
  });

  Object.values(routeStats).forEach(stats => {
    stats.loadFactor = stats.totalCapacity > 0 ? stats.totalLoad / stats.totalCapacity : 0;
  });

  return routeStats;
}

function restoreRecoveredRoutes(routeStats) {
  systemState.buses.forEach(bus => {
    if (!bus.auto_reroute) return;

    // Traffic-based reroutes return when target route is no longer heavy (red).
    if (bus.auto_reroute.reason === "traffic_rebalance") {
      const targetRoute = getRouteById(bus.route_id);
      if (targetRoute && isTrafficCritical(targetRoute)) return;

      const originalRouteId = bus.auto_reroute.original_route_id;
      bus.route_id = originalRouteId;
      bus.auto_reroute = null;
      resetBusProgressForRoute(bus, originalRouteId);
      updateBusStatus(bus);

      emitRerouteAlert(bus.bus_id, targetRoute?.route_id || "unknown", originalRouteId, "traffic normalized");
      console.log(`[BusSimulator] ${bus.bus_id} restored to original route ${originalRouteId}`);
      return;
    }

    const targetStats = routeStats[bus.route_id];
    if (targetStats && targetStats.loadFactor >= RETURN_THRESHOLD) return;

    const originalRouteId = bus.auto_reroute.original_route_id;
    bus.route_id = originalRouteId;
    bus.auto_reroute = null;
    resetBusProgressForRoute(bus, originalRouteId);
    updateBusStatus(bus);

    console.log(`[BusSimulator] ${bus.bus_id} restored to original route ${originalRouteId}`);
  });
}

function dispatchSupportBuses(routeStats) {
  const crowdedRoutes = Object.entries(routeStats)
    .filter(([, stats]) => stats.loadFactor >= FULL_CROWD_THRESHOLD)
    .map(([routeId, stats]) => ({ routeId, ...stats }));

  crowdedRoutes.forEach(target => {
    if (target.tempSupportCount >= MAX_TEMP_SUPPORT_BUSES_PER_ROUTE) return;

    const sourceRoutes = Object.entries(routeStats)
      .filter(([routeId, stats]) => routeId !== target.routeId)
      .filter(([, stats]) => stats.loadFactor < UNDERUTILIZED_THRESHOLD && stats.busCount > 1)
      .sort((a, b) => a[1].loadFactor - b[1].loadFactor);

    if (sourceRoutes.length === 0) return;

    const [sourceRouteId] = sourceRoutes[0];
    const candidate = systemState.buses
      .filter(bus => bus.route_id === sourceRouteId && !bus.auto_reroute)
      .sort((a, b) => a.current_load - b.current_load)[0];

    if (!candidate) return;

    candidate.auto_reroute = {
      original_route_id: sourceRouteId,
      assigned_at: Date.now()
    };
    candidate.route_id = target.routeId;
    resetBusProgressForRoute(candidate, target.routeId);
    updateBusStatus(candidate);

    console.log(`[BusSimulator] ${candidate.bus_id} rerouted from ${sourceRouteId} to support ${target.routeId}`);
  });
}

function dispatchTrafficBasedReroutes(routeStats) {
  const routeById = Object.fromEntries(systemState.routes.map(route => [route.route_id, route]));

  const heavyRoutes = systemState.routes
    .filter(route => isTrafficCritical(route))
    .sort((a, b) => trafficRank(b.traffic_status) - trafficRank(a.traffic_status));

  if (heavyRoutes.length === 0) return false;

  const targetRoute = heavyRoutes[0];
  const targetStats = routeStats[targetRoute.route_id];
  if (targetStats && targetStats.tempSupportCount >= MAX_TEMP_SUPPORT_BUSES_PER_ROUTE) return true;

  const sourceCandidates = Object.entries(routeStats)
    .filter(([routeId, stats]) => routeId !== targetRoute.route_id && stats.busCount > 1)
    .map(([routeId, stats]) => ({
      routeId,
      stats,
      route: routeById[routeId],
      traffic: trafficRank(routeById[routeId]?.traffic_status)
    }))
    .sort((a, b) => {
      if (a.traffic !== b.traffic) return a.traffic - b.traffic;
      return a.stats.loadFactor - b.stats.loadFactor;
    });

  if (sourceCandidates.length === 0) return true;

  const source = sourceCandidates[0];
  const candidate = systemState.buses
    .filter(bus => bus.route_id === source.routeId && !bus.auto_reroute)
    .sort((a, b) => a.current_load - b.current_load)[0];

  if (!candidate) return true;

  candidate.auto_reroute = {
    original_route_id: source.routeId,
    assigned_at: Date.now(),
    reason: "traffic_rebalance"
  };
  candidate.route_id = targetRoute.route_id;
  resetBusProgressForRoute(candidate, targetRoute.route_id);
  updateBusStatus(candidate);

  emitRerouteAlert(candidate.bus_id, source.routeId, targetRoute.route_id, "high traffic route support");
  console.log(`[BusSimulator] ${candidate.bus_id} traffic-rerouted from ${source.routeId} to ${targetRoute.route_id}`);
  return true;
}

function autoBalanceRoutes() {
  const initialStats = getRouteLoadStats();
  restoreRecoveredRoutes(initialStats);

  const updatedStats = getRouteLoadStats();
  const trafficRerouted = dispatchTrafficBasedReroutes(updatedStats);
  if (trafficRerouted) return;
  dispatchSupportBuses(updatedStats);
}

/**
 * Spread buses evenly along their routes at startup.
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
    const pathLayout = route.path && route.path.length > 0 ? route.path : route.stops;
    if (!pathLayout || pathLayout.length < 2) return;

    const pathCount = pathLayout.length;

    buses.forEach((bus, idx) => {
      // Distribute evenly along the detailed path
      const startIdx = Math.floor((idx / buses.length) * pathCount) % pathCount;
      const pt = pathLayout[startIdx];

      bus.lat = pt.lat;
      bus.lng = pt.lng;

      busProgress[bus.bus_id] = {
        pathIndex: startIdx,
        atStop: false,
        ticksAtStop: 0,
        lastStopMatched: -1,
        routeId
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
  const leaving = Math.min(randomInt(0, 8), bus.current_load);
  bus.current_load -= leaving;

  // Get demand near this bus stop
  const demand = getNearbyDemand(bus.lat, bus.lng);

  // Scale boarding by demand: low demand (20) → 2-8, high demand (100+) → 8-24+
  const demandFactor = Math.max(0.2, demand / 100);
  const minBoard = Math.round(2 * demandFactor);
  const maxBoard = Math.round(24 * demandFactor);

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
 * Update a single bus position along its route by traversing the path geometry.
 * When the route is blocked, buses switch to the alternative path.
 */
function updateBusPosition(bus) {
  const route = getRouteById(bus.route_id);
  if (!route) return;

  // Determine which path to use
  const isBlocked = route.is_blocked && route.alt_path && route.alt_path.length > 1;
  const pathLayout = isBlocked
    ? route.alt_path
    : (route.path && route.path.length > 0 ? route.path : route.stops);

  if (!pathLayout || pathLayout.length < 2) return;

  // Handle dynamically deployed buses with no progress entry
  ensureProgress(bus, 0);
  const progress = busProgress[bus.bus_id];

  if (progress.routeId !== bus.route_id) {
    resetBusProgressForRoute(bus, bus.route_id);
  }

  // Detect transition: if the bus just switched paths (blocked or unblocked),
  // snap to the nearest point on the new path.
  const wasOnAlt = progress.onAltPath || false;
  if (isBlocked !== wasOnAlt) {
    // Snap bus to nearest index on the new path
    const snappedIdx = nearestPathIndex(bus.lat, bus.lng, pathLayout);
    progress.pathIndex = snappedIdx;
    progress.atStop = false;
    progress.ticksAtStop = 0;
    progress.lastStopMatched = -1;
    progress.onAltPath = isBlocked;
    console.log(`[BusSimulator] ${bus.bus_id} snapped to ${isBlocked ? 'ALT' : 'ORIGINAL'} path at index ${snappedIdx}`);
  }

  // If at a stop, handle dwell time
  if (progress.atStop) {
    progress.ticksAtStop++;
    // Dwell at stop for 2 ticks (~6 seconds)
    if (progress.ticksAtStop >= 2) {
      progress.atStop = false;
      progress.ticksAtStop = 0;
    }
    return;
  }

  let distanceRemaining = SPEED_KM_PER_TICK;
  let totalMoved = 0;
  const MAX_ITERATIONS = pathLayout.length + 10; // hard cap — prevents infinite loop
  let iterations = 0;

  while (distanceRemaining > 0.00001 && iterations++ < MAX_ITERATIONS) {
    const curIdx = progress.pathIndex;

    // End of route — loop back to start
    if (curIdx >= pathLayout.length - 1) {
      bus.lat = pathLayout[0].lat;
      bus.lng = pathLayout[0].lng;
      progress.pathIndex = 0;
      progress.lastStopMatched = -1;
      progress.atStop = false;
      break;
    }

    const nextIdx = curIdx + 1;
    const nextPt = pathLayout[nextIdx];

    // Skip duplicate / zero-distance points to avoid infinite loops
    const distToNext = calculateDistance(bus.lat, bus.lng, nextPt.lat, nextPt.lng);
    if (distToNext < 0.000001) {
      progress.pathIndex = nextIdx;
      continue;
    }

    if (distToNext <= distanceRemaining) {
      // Reached the next path point
      bus.lat = nextPt.lat;
      bus.lng = nextPt.lng;
      progress.pathIndex = nextIdx;
      distanceRemaining -= distToNext;
      totalMoved += distToNext;

      // Check if this path point corresponds to a designated stop (within ~100m)
      let reachedStopIndex = -1;
      for (let i = 0; i < route.stops.length; i++) {
        if (calculateDistance(nextPt.lat, nextPt.lng, route.stops[i].lat, route.stops[i].lng) < 0.1) {
          reachedStopIndex = i;
          break;
        }
      }

      // If we found a stop and we haven't just stopped here
      if (reachedStopIndex !== -1 && reachedStopIndex !== progress.lastStopMatched) {
        progress.atStop = true;
        progress.ticksAtStop = 0;
        progress.lastStopMatched = reachedStopIndex;
        simulateBoarding(bus);
        break; // stop moving for this tick
      }
    } else {
      // Move partially towards next point
      const fraction = distanceRemaining / distToNext;
      bus.lat = bus.lat + (nextPt.lat - bus.lat) * fraction;
      bus.lng = bus.lng + (nextPt.lng - bus.lng) * fraction;
      totalMoved += distanceRemaining;
      distanceRemaining = 0; // finished moving this tick
    }
  }

  // Ensure totalMoved > 0 to avoid division by zero or weird math if points are perfectly stacked
  if (totalMoved > 0) {
    // Increment distance metrics
    systemState.metrics.total_distance_km += totalMoved;
    if (bus.current_load < bus.capacity * 0.1) {
      systemState.metrics.empty_distance_km += totalMoved * 1.5;
    }

    const loadFactor = bus.current_load / bus.capacity;
    const fuelUsed = totalMoved * 0.4 * (1 + (loadFactor * 0.3)) * 4.0;
    systemState.metrics.total_fuel_consumed += fuelUsed;
  }
}

/**
 * Update all bus positions in a single tick
 */
function tickBusPositions() {
  autoBalanceRoutes();

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