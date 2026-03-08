/**
 * fleetController.js
 * 
 * Handles fleet management operations: deployment, rebalancing, frequency changes.
 */

const systemState = require("../state/systemState");

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

  return {
    success: true,
    message: `Moved ${toMove} buses from ${fromRoute.name} to ${toRoute.name}`,
    movedBuses
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

// =============================================================================
// EXPORTED FUNCTIONS
// =============================================================================

module.exports = {
  deployBus,
  returnBusToDepot,
  changeRouteFrequency,
  rebalanceBuses,
  getFleetDistribution,
  emergencyDispatch,
  getBusDetails,
  getRouteDetails,
  getBusesFiltered
};
