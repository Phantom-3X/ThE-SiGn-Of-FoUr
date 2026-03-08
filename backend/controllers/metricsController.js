/**
 * metricsController.js
 *
 * Calculates system KPIs for the Fleet Orchestrator dashboard.
 * Updates systemState.metrics every 10 seconds.
 */

const systemState = require("../state/systemState");
const { METRICS_UPDATE_INTERVAL } = require("../config/simulationConfig");

// =============================================================================
// KPI CALCULATIONS
// =============================================================================

/**
 * Fleet Utilization (%)
 * total passenger load across all active buses ÷ total bus capacity
 */
function calculateFleetUtilization() {
  let totalLoad = 0;
  let totalCapacity = 0;

  systemState.buses.forEach(bus => {
    if (bus.status !== "idle" && bus.status !== "maintenance") {
      totalLoad += bus.current_load;
      totalCapacity += bus.capacity;
    }
  });

  if (totalCapacity === 0) return 0;
  return Math.round((totalLoad / totalCapacity) * 100);
}

/**
 * Passenger Throughput
 * Sum of current_load across all active buses (passengers currently transported).
 */
function calculatePassengerThroughput() {
  let total = 0;
  systemState.buses.forEach(bus => {
    if (bus.status !== "idle" && bus.status !== "maintenance") {
      total += bus.current_load;
    }
  });
  return total;
}

/**
 * Average Wait Time (minutes)
 * Average of (route.frequency / 2) across all routes.
 */
function calculateAverageWaitTime() {
  const routes = systemState.routes;
  if (routes.length === 0) return 0;

  let sum = 0;
  routes.forEach(r => { sum += r.frequency / 2; });
  return Math.round((sum / routes.length) * 10) / 10;
}

/**
 * Demand Fulfillment (0-100)
 * How well fleet capacity covers current zone demand.
 */
function calculateDemandFulfillment() {
  let totalDemand = 0;
  systemState.demandZones.forEach(z => { totalDemand += z.current_demand; });

  let totalCapacity = 0;
  systemState.buses.forEach(bus => {
    if (bus.status !== "idle" && bus.status !== "maintenance") {
      totalCapacity += bus.capacity;
    }
  });

  if (totalDemand === 0) return 100;
  return Math.min(100, Math.round((totalCapacity / totalDemand) * 100));
}

/**
 * Route Balance (0-100)
 * Measures how evenly bus load is distributed across routes.
 * Perfect balance = 100, all buses on one route = low score.
 */
function calculateRouteBalance() {
  const routeLoads = {};

  systemState.buses.forEach(bus => {
    if (bus.status === "idle" || bus.status === "maintenance") return;
    if (!routeLoads[bus.route_id]) {
      routeLoads[bus.route_id] = { totalLoad: 0, totalCapacity: 0 };
    }
    routeLoads[bus.route_id].totalLoad += bus.current_load;
    routeLoads[bus.route_id].totalCapacity += bus.capacity;
  });

  const factors = Object.values(routeLoads).map(r =>
    r.totalCapacity > 0 ? r.totalLoad / r.totalCapacity : 0
  );

  if (factors.length === 0) return 100;

  const avg = factors.reduce((s, v) => s + v, 0) / factors.length;
  const variance = factors.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / factors.length;
  // Low variance → high balance.  Max stdev ≈ 0.5, so scale accordingly.
  const balance = Math.max(0, Math.round(100 - Math.sqrt(variance) * 200));
  return balance;
}

/**
 * System Efficiency Score (0-100)
 * efficiency = 0.4 × fleet_utilization + 0.3 × demand_fulfillment + 0.3 × route_balance
 */
function calculateSystemEfficiency() {
  const utilization = calculateFleetUtilization();
  const demandFulfillment = calculateDemandFulfillment();
  const routeBalance = calculateRouteBalance();

  const efficiency = 0.4 * utilization + 0.3 * demandFulfillment + 0.3 * routeBalance;
  return Math.round(Math.min(100, Math.max(0, efficiency)));
}

// =============================================================================
// UPDATE & ACCESS
// =============================================================================

/**
 * Recalculate all metrics and write them into systemState.metrics
 */
function updateMetrics() {
  const activeBuses = systemState.buses.filter(
    b => b.status !== "idle" && b.status !== "maintenance"
  ).length;

  systemState.metrics = {
    fleet_utilization: calculateFleetUtilization(),
    passenger_throughput: calculatePassengerThroughput(),
    average_wait_time: calculateAverageWaitTime(),
    system_efficiency: calculateSystemEfficiency(),
    demand_fulfillment: calculateDemandFulfillment(),
    route_balance: calculateRouteBalance(),
    active_buses: activeBuses,
    total_buses: systemState.buses.length,
    active_alerts: systemState.alerts.filter(a => !a.acknowledged).length,
    last_updated: new Date().toISOString()
  };

  console.log("[MetricsController] Metrics updated");
}

/**
 * Return current metrics snapshot
 */
function getMetrics() {
  return systemState.metrics;
}

/**
 * Dashboard-friendly formatted metrics (cards)
 */
function getDashboardMetrics() {
  return {
    waitTime: { value: systemState.metrics.average_wait_time, unit: "min", label: "Avg Wait Time" },
    utilization: { value: systemState.metrics.fleet_utilization, unit: "%", label: "Fleet Utilization" },
    throughput: { value: systemState.metrics.passenger_throughput, unit: "pax", label: "Passengers On Board" },
    efficiency: { value: systemState.metrics.system_efficiency, unit: "%", label: "System Efficiency" },
    fulfillment: { value: systemState.metrics.demand_fulfillment, unit: "%", label: "Demand Fulfillment" },
    routeBalance: { value: systemState.metrics.route_balance, unit: "%", label: "Route Balance" }
  };
}

// =============================================================================
// PER-ROUTE STATS  (for charts / tables)
// =============================================================================

/**
 * Per-route utilization breakdown.
 * Returns array sorted by loadPercent descending (hottest route first).
 */
function getRouteStats() {
  const routeMap = {};

  systemState.buses.forEach(bus => {
    if (bus.status === "idle" || bus.status === "maintenance") return;
    if (!routeMap[bus.route_id]) {
      routeMap[bus.route_id] = { totalLoad: 0, totalCapacity: 0, busCount: 0, statuses: {} };
    }
    const r = routeMap[bus.route_id];
    r.totalLoad += bus.current_load;
    r.totalCapacity += bus.capacity;
    r.busCount++;
    r.statuses[bus.status] = (r.statuses[bus.status] || 0) + 1;
  });

  return systemState.routes.map(route => {
    const stats = routeMap[route.route_id] || { totalLoad: 0, totalCapacity: 0, busCount: 0, statuses: {} };
    return {
      route_id: route.route_id,
      name: route.name,
      frequency: route.frequency,
      route_length_km: route.route_length_km,
      bus_count: stats.busCount,
      total_load: stats.totalLoad,
      total_capacity: stats.totalCapacity,
      load_percent: stats.totalCapacity > 0 ? Math.round((stats.totalLoad / stats.totalCapacity) * 100) : 0,
      bus_statuses: stats.statuses
    };
  }).sort((a, b) => b.load_percent - a.load_percent);
}

// =============================================================================
// PER-ZONE DEMAND STATS
// =============================================================================

/**
 * Demand breakdown per zone for heatmaps / bar charts.
 * Includes surge_percent to flag zones with predicted demand spikes.
 */
function getZoneStats() {
  return systemState.demandZones.map(z => {
    const surgePercent = z.current_demand > 0
      ? Math.round(((z.predicted_demand - z.current_demand) / z.current_demand) * 100)
      : 0;
    return {
      zone_id: z.zone_id,
      name: z.name,
      lat: z.lat,
      lng: z.lng,
      base_demand: z.base_demand,
      current_demand: z.current_demand,
      predicted_demand: z.predicted_demand,
      surge_percent: surgePercent,
      is_surging: surgePercent > 20
    };
  }).sort((a, b) => b.surge_percent - a.surge_percent);
}

// =============================================================================
// ALERT STATISTICS
// =============================================================================

/**
 * Alert breakdown by type and severity for pie / bar charts.
 */
function getAlertStats() {
  const active = systemState.alerts.filter(a => !a.acknowledged);
  const byType = {};
  const bySeverity = {};

  active.forEach(a => {
    byType[a.type] = (byType[a.type] || 0) + 1;
    bySeverity[a.severity] = (bySeverity[a.severity] || 0) + 1;
  });

  return {
    total_active: active.length,
    total_acknowledged: systemState.alerts.length - active.length,
    by_type: byType,
    by_severity: bySeverity
  };
}

// =============================================================================
// SYSTEM STATUS
// =============================================================================

/**
 * System-level health info for header / status bar.
 */
function getSystemStatus() {
  return {
    simulation_running: systemState.simulation.is_running,
    started_at: systemState.simulation.started_at,
    tick_count: systemState.simulation.tick_count,
    uptime_seconds: systemState.simulation.started_at
      ? Math.round((Date.now() - new Date(systemState.simulation.started_at).getTime()) / 1000)
      : 0,
    total_buses: systemState.buses.length,
    total_routes: systemState.routes.length,
    total_depots: systemState.depots.length,
    total_demand_zones: systemState.demandZones.length,
    active_events: systemState.events.filter(e => e.active).length,
    active_alerts: systemState.alerts.filter(a => !a.acknowledged).length,
    timestamp: new Date().toISOString()
  };
}

// =============================================================================
// STARTUP
// =============================================================================

function startMetricsUpdater() {
  console.log("[MetricsController] Initializing metrics updater...");
  updateMetrics();
  setInterval(updateMetrics, METRICS_UPDATE_INTERVAL);
  console.log(`[MetricsController] Running every ${METRICS_UPDATE_INTERVAL}ms`);
}

module.exports = {
  calculateFleetUtilization,
  calculatePassengerThroughput,
  calculateAverageWaitTime,
  calculateDemandFulfillment,
  calculateRouteBalance,
  calculateSystemEfficiency,
  updateMetrics,
  getMetrics,
  getDashboardMetrics,
  getRouteStats,
  getZoneStats,
  getAlertStats,
  getSystemStatus,
  startMetricsUpdater
};