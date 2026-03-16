/**
 * recommendationEngine.js
 *
 * Generates fleet optimization recommendations based on system state.
 * Runs every 10 seconds, stores top 5 in systemState.recommendations.
 *
 * Phase 1: Also runs autoDispatch() loop — if a route load > 0.85 and idle bus exists,
 *          automatically deploys a bus and logs to systemState.autoDispatchLog.
 */

const systemState = require("../state/systemState");
const { OVERCROWDED_THRESHOLD, UNDERUTILIZED_THRESHOLD, ALERT_TYPES } = require("../config/constants");
const { deployBus } = require("../controllers/fleetController");

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
            Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RECOMMENDATION_INTERVAL = 10000; // 10 seconds
const AUTO_DISPATCH_INTERVAL  = 10000; // 10 seconds

const RECOMMENDATION_TYPES = {
  DEPLOY_BUS:         "deploy_bus",
  INCREASE_FREQUENCY: "increase_frequency",
  DECREASE_FREQUENCY: "decrease_frequency",
  REBALANCE_FLEET:    "rebalance_fleet",
  METRO_SUPPORT:      "metro_support",
  EXTEND_ROUTE:       "extend_route",
  ADD_STOP:           "add_stop",
  EXPRESS_VARIANT:    "express_variant",
  REROUTE:            "reroute"
};

const PRIORITY = {
  LOW:    1,
  MEDIUM: 2,
  HIGH:   3,
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
    routeStats[bus.route_id].totalLoad    += bus.current_load;
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
  const lowDemand  = [];

  Object.entries(routeStats).forEach(([routeId, stats]) => {
    if (stats.loadFactor > 0.8) highDemand.push({ routeId, ...stats });
    if (stats.loadFactor < 0.3 && stats.busCount > 2) lowDemand.push({ routeId, ...stats });
  });

  if (highDemand.length > 0 && lowDemand.length > 0) {
    const from = lowDemand[0];
    const to   = highDemand[0];
    const fromRoute = systemState.routes.find(r => r.route_id === from.routeId);
    const toRoute   = systemState.routes.find(r => r.route_id === to.routeId);

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
  const recs  = [];
  const metro = systemState.metro;

  if (metro.status === "delayed" && metro.delay_minutes >= 10) {
    const nearbyRoutes = systemState.routes.slice(0, 3);
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

function distanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

  systemState.demandZones.forEach(zone => {
    if (zone.current_demand < 70) return;
    if (isZoneCovered(zone)) return;

    const nearest = nearestRoute(zone);
    if (!nearest) return;

    recs.push(createRecommendation(
      RECOMMENDATION_TYPES.EXTEND_ROUTE,
      nearest.route.route_id,
      PRIORITY.HIGH,
      `Extend ${nearest.route.name} by ~${nearest.distanceKm.toFixed(1)}km to cover ${zone.name} (demand: ${zone.current_demand})`
    ));
  });

  systemState.demandZones.forEach(zone => {
    if (!zone.predicted_demand || zone.predicted_demand <= zone.current_demand * 1.2) return;

    const nearest = nearestRoute(zone);
    if (!nearest || nearest.distanceKm > 1.5) return;

    recs.push(createRecommendation(
      RECOMMENDATION_TYPES.ADD_STOP,
      nearest.route.route_id,
      PRIORITY.MEDIUM,
      `Add stop at ${zone.name} on ${nearest.route.name} — predicted surge +${Math.round(((zone.predicted_demand - zone.current_demand) / zone.current_demand) * 100)}% during peak hours`
    ));
  });

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

  const metro = systemState.metro;
  if (metro.status === "delayed" && metro.delay_minutes >= 10) {
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

  return recs.slice(0, 3);
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

  const priorityMap = { urgent: 4, high: 3, medium: 2, low: 1 };
  all.sort((a, b) => (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0));

  return all;
}

function getTopRecommendations(count = 8) {
  return generateAllRecommendations().slice(0, count);
}

function runRecommendationEngine() {
  systemState.recommendations = getTopRecommendations(5);
  console.log(`[RecommendationEngine] ${systemState.recommendations.length} recommendations generated`);
}

// =============================================================================
// PHASE 1 — AUTO-DISPATCH
// =============================================================================

const AUTO_DISPATCH_LOG_MAX = 50;

function autoDispatch() {
  if (!systemState.rebalancingConfig.autoDispatchEnabled) return;

  const now = Date.now();

  // Rate limit: max dispatches per 60 seconds
  const recentDispatches = systemState.autoDispatchLog.filter(
    e => now - new Date(e.timestamp).getTime() < 60000
  ).length;
  if (recentDispatches >= systemState.rebalancingConfig.maxDispatchPerMinute) return;

  const idleBusCount = systemState.depots.reduce(
    (sum, d) => sum + d.idle_buses, 0
  );
  if (idleBusCount === 0) return; // SPEC 8 — graceful empty depot handling

  // Score every route by combining load factor + demand velocity of its zones
  const routeScores = systemState.routes.map(route => {
    const buses = systemState.buses.filter(b => b.route_id === route.route_id);
    const totalLoad = buses.reduce((s, b) => s + b.current_load, 0);
    const totalCap  = buses.reduce((s, b) => s + b.capacity, 0);
    const loadFactor = totalCap > 0 ? totalLoad / totalCap : 0;

    // Find demand zones whose stops overlap this route (nearest zone to any stop)
    const routeZones = systemState.demandZones.filter(zone => {
      return route.stops.some(stop => {
        const dist = haversine(stop.lat, stop.lng, zone.lat, zone.lng);
        return dist < 1500; // within 1.5 km
      });
    });

    const avgVelocity = routeZones.length > 0
      ? routeZones.reduce((s, z) => s + (z.demandVelocity || 0), 0) / routeZones.length
      : 0;

    // Combined urgency score
    const urgencyScore = (loadFactor * systemState.rebalancingConfig.loadWeight) + 
                         (Math.max(avgVelocity, 0) / 100 * systemState.rebalancingConfig.velocityWeight);

    return { route, loadFactor, avgVelocity, urgencyScore, routeZones };
  });

  // Sort by urgency descending
  routeScores.sort((a, b) => b.urgencyScore - a.urgencyScore);

  const top = routeScores[0];
  if (!top || top.urgencyScore < systemState.rebalancingConfig.urgencyThreshold) return; // below trigger threshold

  // Scale buses to deploy based on urgency
  let busesToDeploy;
  if (top.urgencyScore >= 0.90) busesToDeploy = 3;
  else if (top.urgencyScore >= 0.75) busesToDeploy = 2;
  else busesToDeploy = 1;

  // Cap by available idle buses
  busesToDeploy = Math.min(busesToDeploy, idleBusCount, systemState.rebalancingConfig.maxDispatchPerMinute - recentDispatches);

  const deployed = [];
  for (let i = 0; i < busesToDeploy; i++) {
    // null depotId theoretically auto-picks depot? Wait, fleetController deployBus requires depotId.
    // Let's find the first depot with idle buses.
    const depot = systemState.depots.find(d => d.idle_buses > 0);
    if (!depot) break;

    const result = deployBus(depot.depot_id, top.route.route_id); 
    if (result.success) {
      deployed.push(result.bus_id);
      systemState.autoDispatchLog.unshift({ // use unshift to put newest at the start like before
        timestamp: new Date(now).toISOString(),
        route_id: top.route.route_id,
        bus_id: result.bus_id,
        trigger: "auto",
        urgencyScore: top.urgencyScore.toFixed(3),
        loadFactor: top.loadFactor.toFixed(3),
        demandVelocity: top.avgVelocity.toFixed(2),
        busesDeployed: busesToDeploy
      });
    }
  }

  // Trim log to last 100 entries
  if (systemState.autoDispatchLog.length > 100) {
    systemState.autoDispatchLog = systemState.autoDispatchLog.slice(0, 100);
  }

  if (deployed.length > 0) {
    console.log(`[AutoDispatch] Deployed ${deployed.length} bus(es) to ${top.route.route_id} — urgency: ${top.urgencyScore.toFixed(2)}`);
  }
}

function startRecommendationEngine() {
  console.log("[RecommendationEngine] Initializing recommendation engine...");
  setInterval(runRecommendationEngine, RECOMMENDATION_INTERVAL);
  console.log(`[RecommendationEngine] Running every ${RECOMMENDATION_INTERVAL}ms`);

  // Phase 1: auto-dispatch loop
  console.log("[AutoDispatch] Starting auto-dispatch loop...");
  setInterval(autoDispatch, AUTO_DISPATCH_INTERVAL);
  console.log(`[AutoDispatch] Running every ${AUTO_DISPATCH_INTERVAL}ms`);
}

module.exports = {
  startRecommendationEngine,
  generateAllRecommendations,
  getTopRecommendations,
  autoDispatch,
  RECOMMENDATION_TYPES,
  PRIORITY
};
