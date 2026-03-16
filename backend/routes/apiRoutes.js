/**
 * apiRoutes.js
 *
 * REST API endpoint definitions for the Fleet Orchestrator.
 * Includes all Phase 1–7 new endpoints.
 */

const express = require("express");
const router  = express.Router();

// Core state
const systemState = require("../state/systemState");

// Controllers
const fleetController   = require("../controllers/fleetController");
const metricsController = require("../controllers/metricsController");

// AI engines
const { getActiveAlerts, acknowledgeAlert } = require("../ai/alertEngine");
const { getTopRecommendations }             = require("../ai/recommendationEngine");
const { getPredictionSummary, getPredictionAccuracy } = require("../ai/predictionEngine");

// Phase 3 — Blockages
const { clearBlockage, getActiveBlockages } = require("../simulation/blockageSimulator");

// Phase 4 — Rickshaws
const { getLast_mileGaps } = require("../simulation/rickshawSimulator");

// Phase 7 — Surge
const { triggerSurge } = require("../simulation/surgeSimulator");

// =============================================================================
// CORE DATA RETRIEVAL (GET)
// =============================================================================

router.get("/routes", (req, res) => {
  res.json(systemState.routes);
});

router.get("/routes/:routeId", (req, res) => {
  const detail = fleetController.getRouteDetails(req.params.routeId);
  if (!detail) return res.status(404).json({ error: `Route ${req.params.routeId} not found` });
  res.json(detail);
});

router.get("/buses", (req, res) => {
  const { routeId, status } = req.query;
  if (routeId || status) {
    return res.json(fleetController.getBusesFiltered(routeId, status));
  }
  res.json(systemState.buses);
});

router.get("/buses/:busId", (req, res) => {
  const detail = fleetController.getBusDetails(req.params.busId);
  if (!detail) return res.status(404).json({ error: `Bus ${req.params.busId} not found` });
  res.json(detail);
});

router.get("/depots", (req, res) => {
  res.json(systemState.depots);
});

router.get("/demand", (req, res) => {
  res.json(systemState.demandZones);
});

router.get("/metro", (req, res) => {
  res.json(systemState.metro);
});

router.get("/events", (req, res) => {
  res.json(systemState.events.filter(e => e.active));
});

// =============================================================================
// AI / ANALYTICS (GET)
// =============================================================================

router.get("/alerts", (req, res) => {
  res.json(getActiveAlerts());
});

router.get("/alert-stats", (req, res) => {
  res.json(metricsController.getAlertStats());
});

router.get("/metrics", (req, res) => {
  res.json(metricsController.getMetrics());
});

router.get("/recommendations", (req, res) => {
  const count = parseInt(req.query.count) || 5;
  res.json(getTopRecommendations(count));
});

router.get("/predictions", (req, res) => {
  res.json(getPredictionSummary());
});

// Phase 5 — Prediction accuracy
router.get("/prediction-accuracy", (req, res) => {
  res.json(getPredictionAccuracy());
});

// Phase 2 — Optimisation score
router.get("/optimisation-score", (req, res) => {
  res.json({
    scores: systemState.optimisationScores,
    weights: systemState.optimisationWeights,
    targets: { waitScore: 0.3, fuelScore: 0.4, emptyKmScore: 0.3 }
  });
});

// =============================================================================
// AGGREGATED STATS (GET)
// =============================================================================

router.get("/fleet-distribution", (req, res) => {
  res.json(fleetController.getFleetDistribution());
});

router.get("/route-stats", (req, res) => {
  res.json(metricsController.getRouteStats());
});

router.get("/zone-stats", (req, res) => {
  res.json(metricsController.getZoneStats());
});

router.get("/system-status", (req, res) => {
  res.json(metricsController.getSystemStatus());
});

// Phase 1 — Auto-dispatch log and config
router.get("/auto-dispatch-log", (req, res) => {
  res.json({
    enabled: systemState.rebalancingConfig.autoDispatchEnabled,
    log: systemState.autoDispatchLog
  });
});

router.get("/rebalancing-log", (req, res) => {
  const recent = systemState.autoDispatchLog.slice(0, 20); // last 20 entries
  res.json(recent.map(entry => ({
    time: new Date(entry.timestamp).toLocaleTimeString(),
    route_id: entry.route_id,
    bus_id: entry.bus_id,
    trigger: entry.trigger,
    urgencyScore: entry.urgencyScore,
    loadFactor: entry.loadFactor,
    demandVelocity: entry.demandVelocity,
    busesDeployed: entry.busesDeployed
  })));
});

router.get("/rebalancing-config", (req, res) => {
  res.json(systemState.rebalancingConfig);
});

// Phase 3 — Blockages
router.get("/blockages", (req, res) => {
  res.json({
    active: getActiveBlockages(),
    all: systemState.blockages.slice(-20) // last 20
  });
});

// Phase 4 — Rickshaws
router.get("/rickshaws", (req, res) => {
  res.json({
    rickshaws: systemState.rickshaws,
    assignments: systemState.rickshawAssignments.filter(a => a.active),
    lastMileGaps: getLast_mileGaps()
  });
});

// Phase 7 — Surge reports
router.get("/surge-reports", (req, res) => {
  res.json({
    reports: systemState.surgeReports,
    activeSurge: systemState.activeSurge
  });
});

// =============================================================================
// DASHBOARD — single aggregate endpoint (extended with all phases)
// =============================================================================

router.get("/dashboard", (req, res) => {
  res.json({
    // Core
    buses:             systemState.buses,
    routes:            systemState.routes,
    depots:            systemState.depots,
    demandZones:       systemState.demandZones,
    metro:             systemState.metro,
    alerts:            getActiveAlerts(),
    metrics:           metricsController.getMetrics(),
    metricsFormatted:  metricsController.getDashboardMetrics(),
    recommendations:   getTopRecommendations(5),
    events:            systemState.events.filter(e => e.active),
    routeStats:        metricsController.getRouteStats(),
    zoneStats:         metricsController.getZoneStats(),
    alertStats:        metricsController.getAlertStats(),
    fleetDistribution: fleetController.getFleetDistribution(),
    systemStatus:      metricsController.getSystemStatus(),

    // Phase 1 — Auto-dispatch
    autoDispatchEnabled: systemState.autoDispatchEnabled,
    autoDispatchLog:     systemState.autoDispatchLog.slice(0, 10),

    // Phase 2 — Optimisation
    optimisationScores: systemState.optimisationScores,
    optimisationWeights: systemState.optimisationWeights,

    // Phase 3 — Blockages
    blockages: getActiveBlockages(),

    // Phase 4 — Rickshaws
    rickshaws:           systemState.rickshaws,
    rickshawAssignments: systemState.rickshawAssignments.filter(a => a.active),
    lastMileGaps:        getLast_mileGaps(),

    // Phase 5 — Prediction accuracy
    predictionAccuracy: getPredictionAccuracy(),

    // Phase 7 — Surge
    activeSurge:  systemState.activeSurge,
    surgeReports: systemState.surgeReports.slice(-5),

    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// OPERATOR ACTION ENDPOINTS (POST)
// =============================================================================

router.post("/deploy-bus", (req, res) => {
  const { depotId, routeId } = req.body;
  if (!depotId || !routeId) {
    return res.status(400).json({ success: false, message: "Missing required fields: depotId, routeId" });
  }
  res.json(fleetController.deployBus(depotId, routeId));
});

router.post("/return-bus", (req, res) => {
  const { busId, depotId } = req.body;
  if (!busId || !depotId) {
    return res.status(400).json({ success: false, message: "Missing required fields: busId, depotId" });
  }
  res.json(fleetController.returnBusToDepot(busId, depotId));
});

router.post("/change-frequency", (req, res) => {
  const { routeId, frequency } = req.body;
  if (!routeId || frequency === undefined) {
    return res.status(400).json({ success: false, message: "Missing required fields: routeId, frequency" });
  }
  res.json(fleetController.changeRouteFrequency(routeId, frequency));
});

router.post("/rebalance", (req, res) => {
  const { fromRouteId, toRouteId, count } = req.body;
  if (!fromRouteId || !toRouteId || !count) {
    return res.status(400).json({ success: false, message: "Missing required fields: fromRouteId, toRouteId, count" });
  }
  res.json(fleetController.rebalanceBuses(fromRouteId, toRouteId, count));
});

router.post("/emergency-dispatch", (req, res) => {
  const { routeId, count } = req.body;
  if (!routeId || !count) {
    return res.status(400).json({ success: false, message: "Missing required fields: routeId, count" });
  }
  res.json(fleetController.emergencyDispatch(routeId, count));
});

router.post("/acknowledge-alert", (req, res) => {
  const { alertId } = req.body;
  if (!alertId) {
    return res.status(400).json({ success: false, message: "Missing required field: alertId" });
  }
  acknowledgeAlert(alertId);
  res.json({ success: true, message: "Alert acknowledged" });
});

router.post("/acknowledge-all-alerts", (req, res) => {
  const active = getActiveAlerts();
  active.forEach(a => acknowledgeAlert(a.id));
  res.json({ success: true, message: `${active.length} alerts acknowledged` });
});

// Phase 1 — Toggle auto-dispatch and config update
router.post("/toggle-auto-dispatch", (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ success: false, message: "Required field: enabled (boolean)" });
  }
  systemState.rebalancingConfig.autoDispatchEnabled = enabled;
  res.json({ success: true, message: `Auto-dispatch ${enabled ? "enabled" : "disabled"}`, enabled });
});

router.post("/rebalancing-config", (req, res) => {
  const { autoDispatchEnabled, urgencyThreshold, maxDispatchPerMinute, loadWeight, velocityWeight } = req.body;
  
  // Validation
  if (typeof urgencyThreshold !== 'number' || urgencyThreshold < 0.1 || urgencyThreshold > 1.0) {
    return res.status(400).json({ success: false, message: "urgencyThreshold must be between 0.1 and 1.0" });
  }
  if (typeof loadWeight !== 'number' || typeof velocityWeight !== 'number' || Math.abs((loadWeight + velocityWeight) - 1.0) > 0.01) {
    return res.status(400).json({ success: false, message: "loadWeight + velocityWeight must equal 1.0" });
  }
  if (typeof maxDispatchPerMinute !== 'number' || maxDispatchPerMinute < 1 || maxDispatchPerMinute > 10) {
    return res.status(400).json({ success: false, message: "maxDispatchPerMinute must be between 1 and 10" });
  }

  // Update
  if (typeof autoDispatchEnabled === 'boolean') systemState.rebalancingConfig.autoDispatchEnabled = autoDispatchEnabled;
  systemState.rebalancingConfig.urgencyThreshold = urgencyThreshold;
  systemState.rebalancingConfig.maxDispatchPerMinute = maxDispatchPerMinute;
  systemState.rebalancingConfig.loadWeight = loadWeight;
  systemState.rebalancingConfig.velocityWeight = velocityWeight;

  res.json({ success: true, config: systemState.rebalancingConfig });
});

// Phase 2 — Update optimisation weights
router.post("/optimisation-weights", (req, res) => {
  const { w1, w2, w3 } = req.body;
  if (w1 === undefined || w2 === undefined || w3 === undefined) {
    return res.status(400).json({ success: false, message: "Required fields: w1, w2, w3" });
  }
  
  const fw1 = parseFloat(w1);
  const fw2 = parseFloat(w2);
  const fw3 = parseFloat(w3);
  
  if (fw1 < 0.05 || fw1 > 0.90 || fw2 < 0.05 || fw2 > 0.90 || fw3 < 0.05 || fw3 > 0.90) {
    return res.status(400).json({ success: false, message: "Weights must sum to 1.0 and each be between 0.05 and 0.90" });
  }
  
  if (Math.abs((fw1 + fw2 + fw3) - 1.0) > 0.01) {
    return res.status(400).json({ success: false, message: "Weights must sum to 1.0 and each be between 0.05 and 0.90" });
  }
  
  systemState.optimisationWeights = { w1: fw1, w2: fw2, w3: fw3 };
  res.json({ success: true, weights: systemState.optimisationWeights });
});

// Phase 3 — Clear a blockage
router.post("/clear-blockage", (req, res) => {
  const { blockage_id } = req.body;
  if (!blockage_id) {
    return res.status(400).json({ success: false, message: "Required field: blockage_id" });
  }
  const result = clearBlockage(blockage_id);
  res.status(result.success ? 200 : 404).json(result);
});

// Phase 7 — Trigger surge
router.post("/trigger-surge", (req, res) => {
  const { zone_id } = req.body;
  if (!zone_id) {
    return res.status(400).json({ success: false, message: "Required field: zone_id" });
  }
  const result = triggerSurge(zone_id);
  res.status(result.success ? 200 : 400).json(result);
});

// =============================================================================
// EXPORT
// =============================================================================

module.exports = router;