/**
 * apiRoutes.js
 *
 * REST API endpoint definitions for the Fleet Orchestrator.
 *
 * GET  — data retrieval (routes, buses, demand, alerts, metro, metrics, etc.)
 * POST — operator actions (deploy bus, change frequency, acknowledge alerts, etc.)
 */

const express = require("express");
const router = express.Router();

// Import system state
const systemState = require("../state/systemState");

// Import controllers
const fleetController = require("../controllers/fleetController");
const metricsController = require("../controllers/metricsController");

// Import AI engines
const { getActiveAlerts, acknowledgeAlert } = require("../ai/alertEngine");
const { getTopRecommendations } = require("../ai/recommendationEngine");
const { getPredictionSummary } = require("../ai/predictionEngine");
const { triggerManualEvent } = require("../simulation/eventSimulator");

// =============================================================================
// DATA RETRIEVAL ENDPOINTS (GET)
// =============================================================================

// ── Core entities ────────────────────────────────────────────────────────────

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

router.get("/rikshaw-routes", (req, res) => {
  res.json(systemState.autoRikshawRoutes);
});

router.get("/rikshaws", (req, res) => {
  res.json(systemState.autoRikshaws);
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

// ── AI / analytics ───────────────────────────────────────────────────────────

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

// ── Aggregated stats ─────────────────────────────────────────────────────────

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

// ── Dashboard (single-call for the whole UI) ─────────────────────────────────

router.get("/dashboard", (req, res) => {
  res.json({
    buses: systemState.buses,
    routes: systemState.routes,
    autoRikshawRoutes: systemState.autoRikshawRoutes,
    autoRikshaws: systemState.autoRikshaws,
    depots: systemState.depots,
    demandZones: systemState.demandZones,
    metro: systemState.metro,
    alerts: getActiveAlerts(),
    metrics: metricsController.getMetrics(),
    metricsFormatted: metricsController.getDashboardMetrics(),
    recommendations: getTopRecommendations(5),
    optimization_weights: systemState.optimization_weights,
    events: systemState.events.filter(e => e.active),
    routeStats: metricsController.getRouteStats(),
    zoneStats: metricsController.getZoneStats(),
    alertStats: metricsController.getAlertStats(),
    fleetDistribution: fleetController.getFleetDistribution(),
    systemStatus: metricsController.getSystemStatus(),
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ACTION ENDPOINTS (POST)
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

router.post("/reroute-bus", (req, res) => {
  const { busId, routeId } = req.body;
  if (!busId || !routeId) {
    return res.status(400).json({ success: false, message: "Missing required fields: busId, routeId" });
  }
  res.json(fleetController.rerouteBus(busId, routeId));
});

router.post("/trigger-event", (req, res) => {
  const { zoneId, type, durationMinutes } = req.body;
  if (!zoneId) {
    return res.status(400).json({ success: false, message: "Missing required field: zoneId" });
  }
  res.json(triggerManualEvent(zoneId, type, durationMinutes));
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

router.post("/optimization-weights", (req, res) => {
  const { wait_time, fuel_efficiency, empty_km } = req.body;
  if (wait_time === undefined || fuel_efficiency === undefined || empty_km === undefined) {
    return res.status(400).json({ success: false, message: "Missing required weights" });
  }
  res.json(fleetController.updateOptimizationWeights(wait_time, fuel_efficiency, empty_km));
});

router.post("/block-route", (req, res) => {
  const { routeId } = req.body;
  if (!routeId) return res.status(400).json({ success: false, message: "Missing required field: routeId" });
  res.json(fleetController.blockRoute(routeId));
});

router.post("/unblock-route", (req, res) => {
  const { routeId } = req.body;
  if (!routeId) return res.status(400).json({ success: false, message: "Missing required field: routeId" });
  res.json(fleetController.unblockRoute(routeId));
});

// =============================================================================
// EXPORT ROUTER
// =============================================================================

module.exports = router;