/**
 * fleetController.js
 * 
 * Handles fleet management operations: deployment, rebalancing, frequency changes.
 */

const systemState = require("../state/systemState");
const { addAlert, createAlert } = require("../ai/alertEngine");
const { ALERT_TYPES, SEVERITY } = require("../config/constants");

// Pre-generated alternative OSRM paths (written by generateAltPaths.js)
let altPaths = {};
try { altPaths = require("../data/altPaths"); } catch(e) { console.warn('[FleetController] altPaths.js not found — run generateAltPaths.js first'); }

// Counter for generating unique bus IDs
let busIdCounter = 100;

/**
 * Generate a new unique bus ID
 */
function generateBusId() {
  busIdCounter++;
  return `BUS${busIdCounter.toString().padStart(3, '0')}`;
}

/**
 * Deploy a bus from depot to route
 */
function deployBus(depotId, routeId) {
  // Validate depot
  const depot = systemState.depots.find(d => d.depot_id === depotId);
  if (!depot) {
    return { success: false, message: `Depot ${depotId} not found`, bus_id: null };
  }

  // Check idle buses available
  if (depot.idle_buses <= 0) {
    return { success: false, message: `No idle buses available at ${depot.name}`, bus_id: null };
  }

  // Validate route
  const route = systemState.routes.find(r => r.route_id === routeId);
  if (!route) {
    return { success: false, message: `Route ${routeId} not found`, bus_id: null };
  }

  // Create new bus
  const busId = generateBusId();
  const firstStop = route.stops[0];

  const newBus = {
    bus_id: busId,
    route_id: routeId,
    lat: firstStop.lat,
    lng: firstStop.lng,
    capacity: 50,
    current_load: 0,
    status: "active"
  };

  // Add to fleet and decrease depot idle count
  systemState.buses.push(newBus);
  depot.idle_buses--;

  console.log(`[FleetController] Deployed ${busId} from ${depot.name} to ${route.name}`);

  // Push notification to UI
  addAlert(createAlert(
    ALERT_TYPES.ROUTE_CHANGE,
    SEVERITY.INFO,
    `Bus deployed: ${busId} from ${depot.name} to Route ${route.route_id}`,
    { bus_id: busId, route_id: routeId, action: 'deploy' }
  ));

  return {
    success: true,
    message: `Bus ${busId} deployed to ${route.name}`,
    bus_id: busId
  };
}

/**
 * Return a bus to depot
 */
function returnBusToDepot(busId, depotId) {
  // Find bus
  const busIndex = systemState.buses.findIndex(b => b.bus_id === busId);
  if (busIndex === -1) {
    return { success: false, message: `Bus ${busId} not found` };
  }

  // Validate depot
  const depot = systemState.depots.find(d => d.depot_id === depotId);
  if (!depot) {
    return { success: false, message: `Depot ${depotId} not found` };
  }

  // Remove bus from active fleet
  systemState.buses.splice(busIndex, 1);
  depot.idle_buses++;

  console.log(`[FleetController] Bus ${busId} returned to ${depot.name}`);

  return {
    success: true,
    message: `Bus ${busId} returned to ${depot.name}`
  };
}

/**
 * Change frequency for a route
 */
function changeRouteFrequency(routeId, newFrequency) {
  // Validate route
  const route = systemState.routes.find(r => r.route_id === routeId);
  if (!route) {
    return { success: false, message: `Route ${routeId} not found`, previousFrequency: null, newFrequency: null };
  }

  // Validate frequency (5-30 minutes)
  if (newFrequency < 5 || newFrequency > 30) {
    return { success: false, message: "Frequency must be between 5 and 30 minutes", previousFrequency: route.frequency, newFrequency: null };
  }

  const previousFrequency = route.frequency;
  route.frequency = newFrequency;

  console.log(`[FleetController] Route ${route.name} frequency changed: ${previousFrequency} -> ${newFrequency} min`);

  return {
    success: true,
    message: `Frequency updated for ${route.name}`,
    previousFrequency,
    newFrequency
  };
}

/**
 * Rebalance buses from one route to another
 */
function rebalanceBuses(fromRouteId, toRouteId, count) {
  // Validate routes
  const fromRoute = systemState.routes.find(r => r.route_id === fromRouteId);
  const toRoute = systemState.routes.find(r => r.route_id === toRouteId);

  if (!fromRoute) {
    return { success: false, message: `Source route ${fromRouteId} not found`, movedBuses: [] };
  }
  if (!toRoute) {
    return { success: false, message: `Target route ${toRouteId} not found`, movedBuses: [] };
  }

  // Find buses on source route, sorted by load (lowest first)
  const busesOnRoute = systemState.buses
    .filter(b => b.route_id === fromRouteId)
    .sort((a, b) => a.current_load - b.current_load);

  if (busesOnRoute.length <= 1) {
    return { success: false, message: `Not enough buses on route ${fromRouteId} to rebalance`, movedBuses: [] };
  }

  // Move buses (up to count, but leave at least 1)
  const toMove = Math.min(count, busesOnRoute.length - 1);
  const movedBuses = [];
  const firstStop = toRoute.stops[0];

  for (let i = 0; i < toMove; i++) {
    const bus = busesOnRoute[i];
    bus.route_id = toRouteId;
    bus.lat = firstStop.lat;
    bus.lng = firstStop.lng;
    movedBuses.push(bus.bus_id);
  }

  console.log(`[FleetController] Rebalanced ${toMove} buses from ${fromRoute.name} to ${toRoute.name}`);

  // Push notification to UI
  addAlert(createAlert(
    ALERT_TYPES.ROUTE_CHANGE,
    SEVERITY.INFO,
    `Rebalanced ${toMove} bus(es) from Route ${fromRouteId} to Route ${toRouteId}`,
    { from_route: fromRouteId, to_route: toRouteId, count: toMove, action: 'rebalance' }
  ));

  return {
    success: true,
    message: `Moved ${toMove} buses from ${fromRoute.name} to ${toRoute.name}`,
    movedBuses
  };
}

function rerouteBus(busId, routeId) {
  const bus = systemState.buses.find(b => b.bus_id === busId);
  if (!bus) {
    return { success: false, message: `Bus ${busId} not found` };
  }

  const route = systemState.routes.find(r => r.route_id === routeId);
  if (!route) {
    return { success: false, message: `Route ${routeId} not found` };
  }

  if (bus.route_id === routeId) {
    return { success: false, message: `Bus ${busId} is already on route ${routeId}` };
  }

  const originalRouteId = bus.route_id;
  const firstStop = route.stops[0];

  bus.route_id = routeId;
  bus.lat = firstStop.lat;
  bus.lng = firstStop.lng;
  bus.manual_reroute = {
    previous_route_id: originalRouteId,
    changed_at: new Date().toISOString()
  };

  console.log(`[FleetController] Bus ${busId} manually rerouted from ${originalRouteId} to ${routeId}`);

  addAlert(createAlert(
    ALERT_TYPES.ROUTE_CHANGE,
    SEVERITY.MEDIUM,
    `Manual reroute: ${busId} moved from Route ${originalRouteId} to Route ${routeId}`,
    { bus_id: busId, route_id: routeId, previous_route_id: originalRouteId, action: 'manual_reroute' }
  ));

  return {
    success: true,
    message: `Bus ${busId} rerouted to ${route.name}`,
    bus_id: busId,
    previous_route_id: originalRouteId,
    new_route_id: routeId
  };
}

/**
 * Get fleet distribution summary
 */
function getFleetDistribution() {
  const distribution = {
    byRoute: {},
    byDepot: {},
    totalActive: 0,
    totalIdle: 0
  };

  // Count buses per route
  systemState.buses.forEach(bus => {
    if (!distribution.byRoute[bus.route_id]) {
      distribution.byRoute[bus.route_id] = { count: 0, avgLoad: 0, totalLoad: 0, totalCapacity: 0 };
    }
    distribution.byRoute[bus.route_id].count++;
    distribution.byRoute[bus.route_id].totalLoad += bus.current_load;
    distribution.byRoute[bus.route_id].totalCapacity += bus.capacity;
    distribution.totalActive++;
  });

  // Calculate average load per route
  Object.keys(distribution.byRoute).forEach(routeId => {
    const route = distribution.byRoute[routeId];
    route.avgLoad = Math.round((route.totalLoad / route.totalCapacity) * 100);
  });

  // Count idle buses per depot
  systemState.depots.forEach(depot => {
    distribution.byDepot[depot.depot_id] = {
      name: depot.name,
      idle: depot.idle_buses,
      total: depot.total_buses
    };
    distribution.totalIdle += depot.idle_buses;
  });

  return distribution;
}

// =============================================================================
// QUERY HELPERS (for frontend detail pages / filtering)
// =============================================================================

/**
 * Get single bus by ID with enriched data
 */
function getBusDetails(busId) {
  const bus = systemState.buses.find(b => b.bus_id === busId);
  if (!bus) return null;

  const route = systemState.routes.find(r => r.route_id === bus.route_id);
  return {
    ...bus,
    load_percent: Math.round((bus.current_load / bus.capacity) * 100),
    route_name: route ? route.name : "Unknown"
  };
}

/**
 * Get single route by ID with assigned buses
 */
function getRouteDetails(routeId) {
  const route = systemState.routes.find(r => r.route_id === routeId);
  if (!route) return null;

  const buses = systemState.buses.filter(b => b.route_id === routeId);
  let totalLoad = 0;
  let totalCapacity = 0;
  buses.forEach(b => { totalLoad += b.current_load; totalCapacity += b.capacity; });

  return {
    ...route,
    bus_count: buses.length,
    total_load: totalLoad,
    total_capacity: totalCapacity,
    load_percent: totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0,
    buses: buses.map(b => ({
      bus_id: b.bus_id,
      lat: b.lat,
      lng: b.lng,
      current_load: b.current_load,
      capacity: b.capacity,
      status: b.status,
      load_percent: Math.round((b.current_load / b.capacity) * 100)
    }))
  };
}

/**
 * Get buses filtered by route and/or status
 */
function getBusesFiltered(routeId, status) {
  let results = systemState.buses;

  if (routeId) {
    results = results.filter(b => b.route_id === routeId);
  }
  if (status) {
    results = results.filter(b => b.status === status);
  }

  return results.map(b => ({
    ...b,
    load_percent: Math.round((b.current_load / b.capacity) * 100)
  }));
}

/**
 * Emergency dispatch - deploy multiple buses quickly
 */
function emergencyDispatch(routeId, count) {
  // Validate route
  const route = systemState.routes.find(r => r.route_id === routeId);
  if (!route) {
    return { success: false, message: `Route ${routeId} not found`, deployedBuses: [] };
  }

  const deployedBuses = [];

  // Find depots with available buses
  const availableDepots = systemState.depots.filter(d => d.idle_buses > 0);

  let deployed = 0;
  for (const depot of availableDepots) {
    while (deployed < count && depot.idle_buses > 0) {
      const result = deployBus(depot.depot_id, routeId);
      if (result.success) {
        deployedBuses.push(result.bus_id);
        deployed++;
      } else {
        break;
      }
    }
    if (deployed >= count) break;
  }

  if (deployed === 0) {
    return { success: false, message: "No buses available for emergency dispatch", deployedBuses: [] };
  }

  console.log(`[FleetController] Emergency dispatch: ${deployed} buses to ${route.name}`);

  return {
    success: true,
    message: `Emergency dispatch: ${deployed} buses deployed to ${route.name}`,
    deployedBuses
  };
}

/**
 * Update optimization weights manually from the dashboard
 */
function updateOptimizationWeights(wait_time, fuel_efficiency, empty_km) {
  systemState.optimization_weights = {
    wait_time: Math.max(0, Math.min(100, wait_time)),
    fuel_efficiency: Math.max(0, Math.min(100, fuel_efficiency)),
    empty_km: Math.max(0, Math.min(100, empty_km))
  };

  console.log(`[FleetController] Optimization Weights Updated: Wait=${systemState.optimization_weights.wait_time}%, Fuel=${systemState.optimization_weights.fuel_efficiency}%, EmptyKm=${systemState.optimization_weights.empty_km}%`);

  return {
    success: true,
    message: "Optimization weights updated successfully",
    weights: systemState.optimization_weights
  };
}

/**
 * Block a route: set is_blocked = true, attach alt_path, alert UI
 */
function blockRoute(routeId) {
  const route = systemState.routes.find(r => r.route_id === routeId);
  if (!route) return { success: false, message: `Route ${routeId} not found` };
  if (route.is_blocked) return { success: false, message: `Route ${routeId} is already blocked` };

  route.is_blocked = true;

  // Attach pre-generated alternative path if available
  const alt = altPaths[routeId];
  if (alt) {
    route.alt_path = alt.alt_path;
    route.alt_stops = alt.alt_stops;
  } else {
    // Fallback: use the existing stops as alt (simple detour)
    route.alt_path = route.path || route.stops;
    route.alt_stops = route.stops;
    console.warn(`[FleetController] No pre-generated alt path for ${routeId} — using original path`);
  }

  console.log(`[FleetController] Route ${routeId} BLOCKED → diverting buses to alt path`);

  addAlert(createAlert(
    ALERT_TYPES.ROUTE_CHANGE,
    SEVERITY.HIGH,
    `🚧 Route ${routeId} (${route.name}) is now BLOCKED — buses diverted to alternative path`,
    { route_id: routeId, action: 'blocked' }
  ));

  return { success: true, message: `Route ${routeId} blocked. Buses are diverting.` };
}

/**
 * Unblock a route: restore normal operation
 */
function unblockRoute(routeId) {
  const route = systemState.routes.find(r => r.route_id === routeId);
  if (!route) return { success: false, message: `Route ${routeId} not found` };
  if (!route.is_blocked) return { success: false, message: `Route ${routeId} is not currently blocked` };

  route.is_blocked = false;

  console.log(`[FleetController] Route ${routeId} UNBLOCKED → buses returning to original path`);

  addAlert(createAlert(
    ALERT_TYPES.ROUTE_CHANGE,
    SEVERITY.INFO,
    `✅ Route ${routeId} (${route.name}) has been UNBLOCKED — buses returning to original path`,
    { route_id: routeId, action: 'unblocked' }
  ));

  return { success: true, message: `Route ${routeId} unblocked. Buses returning to normal path.` };
}

// =============================================================================
// EXPORTED FUNCTIONS
// =============================================================================

module.exports = {
  deployBus,
  returnBusToDepot,
  changeRouteFrequency,
  rebalanceBuses,
  rerouteBus,
  getFleetDistribution,
  emergencyDispatch,
  getBusDetails,
  getRouteDetails,
  getBusesFiltered,
  updateOptimizationWeights,
  blockRoute,
  unblockRoute
};
