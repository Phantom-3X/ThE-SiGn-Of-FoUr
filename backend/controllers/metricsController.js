/**
 * metricsController.js
 * 
 * Calculates system performance metrics for the fleet orchestrator.
 */

const systemState = require("../state/systemState");
const { METRICS_UPDATE_INTERVAL } = require("../config/simulationConfig");

/**
 * Calculate average wait time across all routes
 * Wait time ≈ frequency / 2 (average time until next bus)
 */
function calculateAverageWaitTime() {
  const routes = systemState.routes;
  if (routes.length === 0) return 0;
  
  let totalWaitTime = 0;
  routes.forEach(route => {
    totalWaitTime += route.frequency / 2;
  });
  
  return Math.round((totalWaitTime / routes.length) * 10) / 10;
}

/**
 * Calculate fleet utilization percentage
 * Sum of all passenger loads / total capacity
 */
function calculateFleetUtilization() {
  const buses = systemState.buses;
  if (buses.length === 0) return 0;
  
  let totalLoad = 0;
  let totalCapacity = 0;
  
  buses.forEach(bus => {
    if (bus.status !== "idle" && bus.status !== "maintenance") {
      totalLoad += bus.current_load;
      totalCapacity += bus.capacity;
    }
  });
  
  if (totalCapacity === 0) return 0;
  
  return Math.round((totalLoad / totalCapacity) * 100);
}

/**
 * Calculate passenger throughput (estimated passengers per hour)
 */
function calculatePassengerThroughput() {
  const buses = systemState.buses;
  
  // Estimate: each bus completes ~3 route cycles per hour
  // Each cycle involves boarding/alighting at each stop
  let totalPassengers = 0;
  
  buses.forEach(bus => {
    if (bus.status !== "idle" && bus.status !== "maintenance") {
      // Estimate passengers served per hour based on current load
      totalPassengers += bus.current_load * 3;
    }
  });
  
  return Math.round(totalPassengers);
}

/**
 * Calculate demand coverage percentage
 * How much of the total demand can be served by current fleet
 */
function calculateDemandCoverage() {
  const zones = systemState.demandZones;
  const buses = systemState.buses;
  
  // Total current demand
  let totalDemand = 0;
  zones.forEach(zone => {
    totalDemand += zone.current_demand;
  });
  
  // Total fleet capacity (active buses only)
  let totalCapacity = 0;
  buses.forEach(bus => {
    if (bus.status !== "idle" && bus.status !== "maintenance") {
      totalCapacity += bus.capacity;
    }
  });
  
  if (totalDemand === 0) return 100;
  
  // Coverage is capacity relative to demand (capped at 100%)
  const coverage = (totalCapacity / totalDemand) * 100;
  return Math.min(100, Math.round(coverage));
}

/**
 * Calculate system efficiency score (0-100)
 * Balances utilization, wait times, and coverage
 */
function calculateSystemEfficiency() {
  const utilization = calculateFleetUtilization();
  const waitTime = calculateAverageWaitTime();
  const coverage = calculateDemandCoverage();
  
  // Optimal utilization is around 60-70%
  // Too high = overcrowded, too low = wasteful
  let utilizationScore;
  if (utilization >= 55 && utilization <= 75) {
    utilizationScore = 100;
  } else if (utilization < 55) {
    utilizationScore = (utilization / 55) * 100;
  } else {
    utilizationScore = Math.max(0, 100 - (utilization - 75) * 2);
  }
  
  // Wait time score (lower is better, max 15 min)
  const waitTimeScore = Math.max(0, 100 - (waitTime / 15) * 100);
  
  // Weighted average
  const efficiency = (
    utilizationScore * 0.4 +
    waitTimeScore * 0.3 +
    coverage * 0.3
  );
  
  return Math.round(efficiency);
}

/**
 * Update all metrics in system state
 */
function updateMetrics() {
  const activeBuses = systemState.buses.filter(
    b => b.status !== "idle" && b.status !== "maintenance"
  ).length;
  
  systemState.metrics = {
    average_wait_time: calculateAverageWaitTime(),
    fleet_utilization: calculateFleetUtilization(),
    passenger_throughput: calculatePassengerThroughput(),
    system_efficiency: calculateSystemEfficiency(),
    demand_coverage: calculateDemandCoverage(),
    active_buses: activeBuses,
    total_buses: systemState.buses.length,
    active_alerts: systemState.alerts.filter(a => !a.acknowledged).length,
    last_updated: new Date().toISOString()
  };
  
  console.log("[MetricsController] Metrics updated");
}

/**
 * Get current metrics snapshot
 */
function getMetrics() {
  return systemState.metrics;
}

/**
 * Get metrics formatted for dashboard display
 */
function getDashboardMetrics() {
  return {
    waitTime: {
      value: systemState.metrics.average_wait_time,
      unit: "min",
      label: "Avg Wait Time"
    },
    utilization: {
      value: systemState.metrics.fleet_utilization,
      unit: "%",
      label: "Fleet Utilization"
    },
    throughput: {
      value: systemState.metrics.passenger_throughput,
      unit: "/hr",
      label: "Passengers"
    },
    efficiency: {
      value: systemState.metrics.system_efficiency,
      unit: "%",
      label: "System Efficiency"
    }
  };
}

/**
 * Start metrics calculation loop
 */
function startMetricsUpdater() {
  console.log("[MetricsController] Initializing metrics updater...");
  
  updateMetrics();
  
  setInterval(() => {
    updateMetrics();
  }, METRICS_UPDATE_INTERVAL);
  
  console.log(`[MetricsController] Running every ${METRICS_UPDATE_INTERVAL}ms`);
}

module.exports = {
  calculateAverageWaitTime,
  calculateFleetUtilization,
  calculatePassengerThroughput,
  calculateSystemEfficiency,
  calculateDemandCoverage,
  updateMetrics,
  getMetrics,
  getDashboardMetrics,
  startMetricsUpdater
};

/**
 * Start metrics calculation loop
 */
function startMetricsUpdater() {
  console.log("[MetricsController] Initializing metrics updater...");
  
  // Initial calculation
  updateMetrics();
  
  // Periodic updates
  setInterval(() => {
    updateMetrics();
  }, METRICS_UPDATE_INTERVAL);
  
  console.log(`[MetricsController] Running every ${METRICS_UPDATE_INTERVAL}ms`);
}

// =============================================================================
// EXPORTED FUNCTIONS
// =============================================================================

module.exports = {
  calculateAverageWaitTime,
  calculateFleetUtilization,
  calculatePassengerThroughput,
  calculateSystemEfficiency,
  calculateDemandCoverage,
  updateMetrics,
  getMetrics,
  getDashboardMetrics,
  startMetricsUpdater
};