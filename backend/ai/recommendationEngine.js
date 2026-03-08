/**
 * recommendationEngine.js
 * 
 * Generates fleet optimization recommendations based on system state.
 */

const systemState = require("../state/systemState");
const { OVERCROWDED_THRESHOLD, UNDERUTILIZED_THRESHOLD, ALERT_TYPES } = require("../config/constants");

const RECOMMENDATION_TYPES = {
  DEPLOY_BUS: "deploy_bus",
  INCREASE_FREQUENCY: "increase_frequency",
  DECREASE_FREQUENCY: "decrease_frequency",
  REBALANCE_FLEET: "rebalance_fleet",
  DIVERT_BUS: "divert_bus"
};

const PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4
};

/**
 * Create a recommendation object
 */
function createRecommendation(type, priority, description, action) {
  return {
    id: `REC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    priority,
    description,
    action,
    timestamp: new Date().toISOString(),
    status: "pending"
  };
}

/**
 * Calculate route load statistics
 */
function getRouteLoadStats() {
  const routeStats = {};
  
  systemState.buses.forEach(bus => {
    if (!routeStats[bus.route_id]) {
      routeStats[bus.route_id] = { totalLoad: 0, totalCapacity: 0, busCount: 0 };
    }
    routeStats[bus.route_id].totalLoad += bus.current_load;
    routeStats[bus.route_id].totalCapacity += bus.capacity;
    routeStats[bus.route_id].busCount++;
  });
  
  // Calculate load factor for each route
  Object.keys(routeStats).forEach(routeId => {
    const stats = routeStats[routeId];
    stats.loadFactor = stats.totalLoad / stats.totalCapacity;
  });
  
  return routeStats;
}

/**
 * Find depot with available buses
 */
function findAvailableDepot() {
  return systemState.depots.find(d => d.idle_buses > 0);
}

/**
 * Generate bus deployment recommendations
 */
function generateDeploymentRecommendations() {
  const recommendations = [];
  const routeStats = getRouteLoadStats();
  
  // Find overcrowded routes
  Object.entries(routeStats).forEach(([routeId, stats]) => {
    if (stats.loadFactor > OVERCROWDED_THRESHOLD) {
      const depot = findAvailableDepot();
      if (depot) {
        const route = systemState.routes.find(r => r.route_id === routeId);
        const routeName = route ? route.name : routeId;
        
        recommendations.push(createRecommendation(
          RECOMMENDATION_TYPES.DEPLOY_BUS,
          stats.loadFactor > 0.95 ? PRIORITY.URGENT : PRIORITY.HIGH,
          `Deploy additional bus to ${routeName} (${Math.round(stats.loadFactor * 100)}% loaded)`,
          { route_id: routeId, depot_id: depot.depot_id }
        ));
      }
    }
  });
  
  // Check for demand spikes in alerts
  const demandAlerts = systemState.alerts.filter(
    a => !a.acknowledged && a.type === ALERT_TYPES.DEMAND_SPIKE
  );
  
  demandAlerts.slice(0, 2).forEach(alert => {
    const depot = findAvailableDepot();
    if (depot) {
      recommendations.push(createRecommendation(
        RECOMMENDATION_TYPES.DEPLOY_BUS,
        PRIORITY.MEDIUM,
        `Prepare bus for predicted demand spike in ${alert.data.zone_name}`,
        { zone_id: alert.data.zone_id, depot_id: depot.depot_id }
      ));
    }
  });
  
  return recommendations;
}

/**
 * Generate frequency adjustment recommendations
 */
function generateFrequencyRecommendations() {
  const recommendations = [];
  const routeStats = getRouteLoadStats();
  
  Object.entries(routeStats).forEach(([routeId, stats]) => {
    const route = systemState.routes.find(r => r.route_id === routeId);
    if (!route) return;
    
    // Overcrowded route - increase frequency
    if (stats.loadFactor > OVERCROWDED_THRESHOLD && route.frequency > 5) {
      recommendations.push(createRecommendation(
        RECOMMENDATION_TYPES.INCREASE_FREQUENCY,
        PRIORITY.HIGH,
        `Increase frequency on ${route.name} from ${route.frequency} to ${route.frequency - 2} min`,
        { route_id: routeId, current_frequency: route.frequency, new_frequency: route.frequency - 2 }
      ));
    }
    
    // Underutilized route - decrease frequency
    if (stats.loadFactor < UNDERUTILIZED_THRESHOLD && route.frequency < 15) {
      recommendations.push(createRecommendation(
        RECOMMENDATION_TYPES.DECREASE_FREQUENCY,
        PRIORITY.LOW,
        `Decrease frequency on ${route.name} from ${route.frequency} to ${route.frequency + 3} min`,
        { route_id: routeId, current_frequency: route.frequency, new_frequency: route.frequency + 3 }
      ));
    }
  });
  
  return recommendations;
}

/**
 * Generate fleet rebalancing recommendations
 */
function generateRebalancingRecommendations() {
  const recommendations = [];
  const routeStats = getRouteLoadStats();
  
  // Find high and low demand routes
  const highDemandRoutes = [];
  const lowDemandRoutes = [];
  
  Object.entries(routeStats).forEach(([routeId, stats]) => {
    if (stats.loadFactor > 0.8 && stats.busCount > 0) {
      highDemandRoutes.push({ routeId, ...stats });
    }
    if (stats.loadFactor < 0.3 && stats.busCount > 2) {
      lowDemandRoutes.push({ routeId, ...stats });
    }
  });
  
  // Generate rebalancing recommendations
  if (highDemandRoutes.length > 0 && lowDemandRoutes.length > 0) {
    const from = lowDemandRoutes[0];
    const to = highDemandRoutes[0];
    
    const fromRoute = systemState.routes.find(r => r.route_id === from.routeId);
    const toRoute = systemState.routes.find(r => r.route_id === to.routeId);
    
    recommendations.push(createRecommendation(
      RECOMMENDATION_TYPES.REBALANCE_FLEET,
      PRIORITY.MEDIUM,
      `Move 1 bus from ${fromRoute?.name || from.routeId} to ${toRoute?.name || to.routeId}`,
      { from_route_id: from.routeId, to_route_id: to.routeId, count: 1 }
    ));
  }
  
  return recommendations;
}

/**
 * Generate all recommendations sorted by priority
 */
function generateAllRecommendations() {
  const recommendations = [
    ...generateDeploymentRecommendations(),
    ...generateFrequencyRecommendations(),
    ...generateRebalancingRecommendations()
  ];
  
  recommendations.sort((a, b) => b.priority - a.priority);
  return recommendations;
}

/**
 * Get top N recommendations
 */
function getTopRecommendations(count = 5) {
  const all = generateAllRecommendations();
  return all.slice(0, count);
}

module.exports = {
  generateAllRecommendations,
  getTopRecommendations,
  generateDeploymentRecommendations,
  generateFrequencyRecommendations,
  generateRebalancingRecommendations,
  createRecommendation,
  RECOMMENDATION_TYPES,
  PRIORITY
};