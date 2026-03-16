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
  METRO_SUPPORT: "metro_support",
  EXTEND_ROUTE: "extend_route",
  ADD_STOP: "add_stop",
  EXPRESS_VARIANT: "express_variant",
  REROUTE: "reroute"
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

// ── Rule 5: AI Route Suggestions ─────────────────────────────────────────────

/**
 * Calculate distance between two lat/lng points in km (Haversine)
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

/**
 * Check if a demand zone is covered by any existing route stop
 * Coverage radius: 1.5km
 */
function isZoneCovered(zone) {
  const COVERAGE_RADIUS_KM = 1.5;
  for (const route of systemState.routes) {
    for (const stop of route.stops) {
      if (distanceKm(zone.lat, zone.lng, stop.lat, stop.lng) <= COVERAGE_RADIUS_KM) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Find nearest route to a zone
 */
function nearestRoute(zone) {
  let minDist = Infinity;
  let nearest = null;
  for (const route of systemState.routes) {
    for (const stop of route.stops) {
      const d = distanceKm(zone.lat, zone.lng, stop.lat, stop.lng);
      if (d < minDist) {
        minDist = d;
        nearest = { route, distanceKm: d };
      }
    }
  }
  return nearest;
}

function generateRouteSuggestions() {
  const recs = [];

  // ── Suggestion 1: Extend route to uncovered high-demand zones
  systemState.demandZones.forEach(zone => {
    if (zone.current_demand < 70) return; // only high-demand zones
    if (isZoneCovered(zone)) return;      // already covered

    const nearest = nearestRoute(zone);
    if (!nearest) return;

    recs.push(createRecommendation(
      RECOMMENDATION_TYPES.EXTEND_ROUTE,
      nearest.route.route_id,
      PRIORITY.HIGH,
      `Extend ${nearest.route.name} by ~${nearest.distanceKm.toFixed(1)}km to cover ${zone.name} (demand: ${zone.current_demand})`
    ));
  });

  // ── Suggestion 2: Add stop for surging zones near existing routes
  systemState.demandZones.forEach(zone => {
    if (!zone.predicted_demand || zone.predicted_demand <= zone.current_demand * 1.2) return;

    const nearest = nearestRoute(zone);
    if (!nearest || nearest.distanceKm > 1.5) return; // must be close

    recs.push(createRecommendation(
      RECOMMENDATION_TYPES.ADD_STOP,
      nearest.route.route_id,
      PRIORITY.MEDIUM,
      `Add stop at ${zone.name} on ${nearest.route.name} — predicted surge +${Math.round(((zone.predicted_demand - zone.current_demand) / zone.current_demand) * 100)}% during peak hours`
    ));
  });

  // ── Suggestion 3: Express variant for consistently overcrowded routes
  const routeStats = getRouteLoadStats();
  Object.entries(routeStats).forEach(([routeId, stats]) => {
    if (stats.loadFactor < 0.85) return;
    const route = systemState.routes.find(r => r.route_id === routeId);
    if (!route || route.stops.length < 5) return;

    const skipCount = Math.floor(route.stops.length * 0.3);
    recs.push(createRecommendation(
      RECOMMENDATION_TYPES.EXPRESS_VARIANT,
      routeId,
      PRIORITY.HIGH,
      `Create express variant of ${route.name} skipping ${skipCount} intermediate stops — reduces travel time by ~${skipCount * 3} min during rush hour`
    ));
  });

  // ── Suggestion 4: Reroute when metro is delayed
  const metro = systemState.metro;
  if (metro.status === 'delayed' && metro.delay_minutes >= 10) {
    systemState.routes.forEach(route => {
      const nearMetro = route.stops.some(stop =>
        metro.stations && metro.stations.some(st =>
          distanceKm(stop.lat, stop.lng, st.lat, st.lng) < 1.0
        )
      );
      if (nearMetro) {
        recs.push(createRecommendation(
          RECOMMENDATION_TYPES.REROUTE,
          route.route_id,
          PRIORITY.URGENT,
          `Reroute ${route.name} via metro interchange zones — Metro Line 1 delayed ${metro.delay_minutes} min, expect +${Math.round(metro.delay_minutes * 0.4)} pax overflow`
        ));
      }
    });
  }

  return recs.slice(0, 3); // max 3 route suggestions at a time
}

// ── Generate all & store ─────────────────────────────────────────────────────

function generateAllRecommendations() {
  const all = [
    ...generateDeploymentRecommendations(),
    ...generateFrequencyRecommendations(),
    ...generateRebalancingRecommendations(),
    ...generateMetroSupportRecommendations(),
    ...generateRouteSuggestions()
  ];

  // Sort by priority descending (urgent first)
  const priorityMap = { urgent: 4, high: 3, medium: 2, low: 1 };
  all.sort((a, b) => (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0));

  return all;
}

function getTopRecommendations(count = 8) {
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
