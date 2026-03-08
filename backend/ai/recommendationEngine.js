/**
 * recommendationEngine.js
 *
 * Generates fleet optimization recommendations based on system state.
 * Runs every 10 seconds, stores top 5 in systemState.recommendations.
 */

const systemState = require("../state/systemState");
const { OVERCROWDED_THRESHOLD, UNDERUTILIZED_THRESHOLD, ALERT_TYPES } = require("../config/constants");

const RECOMMENDATION_INTERVAL = 10000; // 10 seconds

const RECOMMENDATION_TYPES = {
  DEPLOY_BUS: "deploy_bus",
  INCREASE_FREQUENCY: "increase_frequency",
  DECREASE_FREQUENCY: "decrease_frequency",
  REBALANCE_FLEET: "rebalance_fleet",
  METRO_SUPPORT: "metro_support"
};

const PRIORITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  URGENT: 4
};

let recCounter = 0;

function createRecommendation(action, routeId, priority, reason) {
  recCounter++;
  return {
    recommendation_id: `REC${String(recCounter).padStart(3, "0")}`,
    action,
    route_id: routeId,
    priority: priority === PRIORITY.URGENT ? "urgent" : priority === PRIORITY.HIGH ? "high" : priority === PRIORITY.MEDIUM ? "medium" : "low",
    reason,
    timestamp: new Date().toISOString()
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

  Object.keys(routeStats).forEach(routeId => {
    const s = routeStats[routeId];
    s.loadFactor = s.totalLoad / s.totalCapacity;
  });

  return routeStats;
}

// ── Rule 1: Deploy additional buses on overcrowded routes ────────────────────

function generateDeploymentRecommendations() {
  const recs = [];
  const routeStats = getRouteLoadStats();

  Object.entries(routeStats).forEach(([routeId, stats]) => {
    if (stats.loadFactor > OVERCROWDED_THRESHOLD) {
      const route = systemState.routes.find(r => r.route_id === routeId);
      recs.push(createRecommendation(
        RECOMMENDATION_TYPES.DEPLOY_BUS,
        routeId,
        stats.loadFactor > 0.95 ? PRIORITY.URGENT : PRIORITY.HIGH,
        `High passenger load detected on ${route?.name || routeId} (${Math.round(stats.loadFactor * 100)}%)`
      ));
    }
  });

  // Also check demand spike alerts
  const demandAlerts = systemState.alerts.filter(
    a => !a.acknowledged && a.type === ALERT_TYPES.DEMAND_SPIKE
  );
  demandAlerts.slice(0, 2).forEach(alert => {
    recs.push(createRecommendation(
      RECOMMENDATION_TYPES.DEPLOY_BUS,
      alert.data.route_id || null,
      PRIORITY.MEDIUM,
      `Demand surge predicted in ${alert.data.zone_name}`
    ));
  });

  return recs;
}

// ── Rule 2: Increase / decrease frequency ────────────────────────────────────

function generateFrequencyRecommendations() {
  const recs = [];
  const routeStats = getRouteLoadStats();

  Object.entries(routeStats).forEach(([routeId, stats]) => {
    const route = systemState.routes.find(r => r.route_id === routeId);
    if (!route) return;

    if (stats.loadFactor > OVERCROWDED_THRESHOLD && route.frequency > 5) {
      recs.push(createRecommendation(
        RECOMMENDATION_TYPES.INCREASE_FREQUENCY,
        routeId,
        PRIORITY.HIGH,
        `Reduce interval on ${route.name} from ${route.frequency} to ${route.frequency - 2} min`
      ));
    }

    if (stats.loadFactor < UNDERUTILIZED_THRESHOLD && route.frequency < 15) {
      recs.push(createRecommendation(
        RECOMMENDATION_TYPES.DECREASE_FREQUENCY,
        routeId,
        PRIORITY.LOW,
        `Increase interval on ${route.name} from ${route.frequency} to ${route.frequency + 3} min`
      ));
    }
  });

  return recs;
}

// ── Rule 3: Rebalance fleet between routes ───────────────────────────────────

function generateRebalancingRecommendations() {
  const recs = [];
  const routeStats = getRouteLoadStats();

  const highDemand = [];
  const lowDemand = [];

  Object.entries(routeStats).forEach(([routeId, stats]) => {
    if (stats.loadFactor > 0.8) highDemand.push({ routeId, ...stats });
    if (stats.loadFactor < 0.3 && stats.busCount > 2) lowDemand.push({ routeId, ...stats });
  });

  if (highDemand.length > 0 && lowDemand.length > 0) {
    const from = lowDemand[0];
    const to = highDemand[0];
    const fromRoute = systemState.routes.find(r => r.route_id === from.routeId);
    const toRoute = systemState.routes.find(r => r.route_id === to.routeId);

    recs.push(createRecommendation(
      RECOMMENDATION_TYPES.REBALANCE_FLEET,
      to.routeId,
      PRIORITY.MEDIUM,
      `Move 1 bus from ${fromRoute?.name || from.routeId} to ${toRoute?.name || to.routeId}`
    ));
  }

  return recs;
}

// ── Rule 4: Metro disruption support ─────────────────────────────────────────

function generateMetroSupportRecommendations() {
  const recs = [];
  const metro = systemState.metro;

  if (metro.status === "delayed" && metro.delay_minutes >= 10) {
    // Find routes that pass near metro stations
    const nearbyRoutes = systemState.routes.slice(0, 3); // top 3 as proxy
    nearbyRoutes.forEach(route => {
      recs.push(createRecommendation(
        RECOMMENDATION_TYPES.METRO_SUPPORT,
        route.route_id,
        PRIORITY.HIGH,
        `Metro delayed ${metro.delay_minutes} min — increase buses on ${route.name}`
      ));
    });
  }

  return recs;
}

// ── Generate all & store ─────────────────────────────────────────────────────

function generateAllRecommendations() {
  const all = [
    ...generateDeploymentRecommendations(),
    ...generateFrequencyRecommendations(),
    ...generateRebalancingRecommendations(),
    ...generateMetroSupportRecommendations()
  ];

  // Sort by priority descending (urgent first)
  const priorityMap = { urgent: 4, high: 3, medium: 2, low: 1 };
  all.sort((a, b) => (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0));

  return all;
}

function getTopRecommendations(count = 5) {
  return generateAllRecommendations().slice(0, count);
}

/**
 * Periodic runner — store top 5 recommendations in systemState.
 */
function runRecommendationEngine() {
  systemState.recommendations = getTopRecommendations(5);
  console.log(`[RecommendationEngine] ${systemState.recommendations.length} recommendations generated`);
}

function startRecommendationEngine() {
  console.log("[RecommendationEngine] Initializing recommendation engine...");
  setInterval(runRecommendationEngine, RECOMMENDATION_INTERVAL);
  console.log(`[RecommendationEngine] Running every ${RECOMMENDATION_INTERVAL}ms`);
}

module.exports = {
  startRecommendationEngine,
  generateAllRecommendations,
  getTopRecommendations,
  RECOMMENDATION_TYPES,
  PRIORITY
};