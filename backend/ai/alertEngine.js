/**
 * alertEngine.js
 * 
 * Detects anomalies and generates alerts for the fleet orchestrator.
 */

const systemState = require("../state/systemState");
const { ALERT_CHECK_INTERVAL } = require("../config/simulationConfig");
const { 
  OVERCROWDED_THRESHOLD, 
  UNDERUTILIZED_THRESHOLD, 
  DEMAND_SPIKE_THRESHOLD,
  METRO_DELAY_IMPACT_THRESHOLD,
  ALERT_TYPES,
  SEVERITY 
} = require("../config/constants");

// Maximum alerts to keep in memory
const MAX_ALERTS = 100;

/**
 * Create a new alert object
 */
function createAlert(type, severity, message, data = {}) {
  return {
    id: `ALERT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    severity,
    message,
    data,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };
}

/**
 * Check if similar alert already exists (same type and target)
 */
function hasSimilarAlert(type, targetId) {
  return systemState.alerts.some(alert => 
    !alert.acknowledged && 
    alert.type === type && 
    (alert.data.bus_id === targetId || 
     alert.data.route_id === targetId || 
     alert.data.zone_id === targetId)
  );
}

/**
 * Add alert to system state (avoid duplicates)
 */
function addAlert(alert) {
  const targetId = alert.data.bus_id || alert.data.route_id || alert.data.zone_id || 'metro';
  
  if (!hasSimilarAlert(alert.type, targetId)) {
    systemState.alerts.push(alert);
    
    // Limit alerts array size
    if (systemState.alerts.length > MAX_ALERTS) {
      systemState.alerts = systemState.alerts.slice(-MAX_ALERTS);
    }
  }
}

/**
 * Check for overcrowded buses (load > 90%)
 */
function checkOvercrowdedBuses() {
  systemState.buses.forEach(bus => {
    const loadFactor = bus.current_load / bus.capacity;
    
    if (loadFactor > 0.9) {
      const severity = loadFactor > 0.95 ? SEVERITY.CRITICAL : SEVERITY.HIGH;
      const alert = createAlert(
        ALERT_TYPES.OVERCROWDED_BUS,
        severity,
        `Bus ${bus.bus_id} is overcrowded at ${Math.round(loadFactor * 100)}% capacity`,
        { bus_id: bus.bus_id, route_id: bus.route_id, load_factor: loadFactor }
      );
      addAlert(alert);
    }
  });
}

/**
 * Check for underutilized routes (average load < 30%)
 */
function checkUnderutilizedRoutes() {
  // Group buses by route
  const routeLoads = {};
  
  systemState.buses.forEach(bus => {
    if (!routeLoads[bus.route_id]) {
      routeLoads[bus.route_id] = { totalLoad: 0, totalCapacity: 0, count: 0 };
    }
    routeLoads[bus.route_id].totalLoad += bus.current_load;
    routeLoads[bus.route_id].totalCapacity += bus.capacity;
    routeLoads[bus.route_id].count++;
  });
  
  // Check each route for underutilization AND overcrowding
  Object.entries(routeLoads).forEach(([routeId, data]) => {
    const avgLoadFactor = data.totalLoad / data.totalCapacity;
    
    if (avgLoadFactor > OVERCROWDED_THRESHOLD) {
      const alert = createAlert(
        ALERT_TYPES.OVERCROWDED_ROUTE || "overcrowded_route",
        SEVERITY.HIGH,
        `Route ${routeId} approaching capacity at ${Math.round(avgLoadFactor * 100)}% average load`,
        { route_id: routeId, avg_load_factor: avgLoadFactor, bus_count: data.count }
      );
      addAlert(alert);
    }

    if (avgLoadFactor < UNDERUTILIZED_THRESHOLD && data.count > 1) {
      const alert = createAlert(
        ALERT_TYPES.UNDERUTILIZED_ROUTE,
        SEVERITY.LOW,
        `Route ${routeId} is underutilized at ${Math.round(avgLoadFactor * 100)}% average load`,
        { route_id: routeId, avg_load_factor: avgLoadFactor, bus_count: data.count }
      );
      addAlert(alert);
    }
  });
}

/**
 * Check for demand spikes (predicted > current * 1.3)
 */
function checkDemandSpikes() {
  systemState.demandZones.forEach(zone => {
    if (!zone.current_demand || zone.current_demand === 0) return;
    const spikeRatio = zone.predicted_demand / zone.current_demand;
    
    if (spikeRatio > DEMAND_SPIKE_THRESHOLD) {
      const severity = spikeRatio > 1.5 ? SEVERITY.HIGH : SEVERITY.MEDIUM;
      const alert = createAlert(
        ALERT_TYPES.DEMAND_SPIKE,
        severity,
        `Demand spike predicted in ${zone.name}: ${zone.predicted_demand} (current: ${zone.current_demand})`,
        { zone_id: zone.zone_id, zone_name: zone.name, current: zone.current_demand, predicted: zone.predicted_demand }
      );
      addAlert(alert);
    }
  });
}

/**
 * Check for metro disruptions
 */
function checkMetroDisruptions() {
  const metro = systemState.metro;
  
  if (metro.status === "delayed" && metro.delay_minutes >= METRO_DELAY_IMPACT_THRESHOLD) {
    const severity = metro.delay_minutes > 15 ? SEVERITY.HIGH : SEVERITY.MEDIUM;
    const alert = createAlert(
      ALERT_TYPES.METRO_DISRUPTION,
      severity,
      `Metro ${metro.line_name} delayed by ${metro.delay_minutes} minutes`,
      { delay_minutes: metro.delay_minutes, status: metro.status }
    );
    addAlert(alert);
  }
}

/**
 * Run all alert checks
 */
function runAlertChecks() {
  checkOvercrowdedBuses();
  checkUnderutilizedRoutes();
  checkDemandSpikes();
  checkMetroDisruptions();
}

/**
 * Get active alerts (not acknowledged)
 */
function getActiveAlerts() {
  return systemState.alerts.filter(alert => !alert.acknowledged);
}

/**
 * Acknowledge an alert
 */
function acknowledgeAlert(alertId) {
  const alert = systemState.alerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
  }
}

/**
 * Start the alert engine loop
 */
function startAlertEngine() {
  console.log("[AlertEngine] Initializing alert engine...");
  
  setInterval(() => {
    runAlertChecks();
  }, ALERT_CHECK_INTERVAL);
  
  console.log(`[AlertEngine] Running every ${ALERT_CHECK_INTERVAL}ms`);
}

module.exports = {
  startAlertEngine,
  runAlertChecks,
  getActiveAlerts,
  acknowledgeAlert,
  createAlert
};
