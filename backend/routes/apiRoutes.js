/**
 * apiRoutes.js
 * 
 * REST API endpoint definitions for the Fleet Orchestrator.
 * 
 * Responsibilities:
 * - Define all API routes
 * - Connect routes to controllers
 * - Handle request validation
 * - Format responses
 * 
 * Endpoint Categories:
 * - GET: Data retrieval (routes, buses, demand, alerts, metro, metrics)
 * - POST: Actions (deploy bus, change frequency, acknowledge alerts)
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

// =============================================================================
// DATA RETRIEVAL ENDPOINTS (GET)
// =============================================================================

/**
 * GET /routes
 * Returns all bus routes with stops and frequency
 */
router.get("/routes", (req, res) => {
  res.json(systemState.routes);
});

/**
 * GET /buses
 * Returns all buses with current positions and loads
 */
router.get("/buses", (req, res) => {
  res.json(systemState.buses);
});

/**
 * GET /depots
 * Returns all depots with bus availability
 */
router.get("/depots", (req, res) => {
  res.json(systemState.depots);
});

/**
 * GET /demand
 * Returns all demand zones with current and predicted demand
 */
router.get("/demand", (req, res) => {
  res.json(systemState.demandZones);
});

/**
 * GET /metro
 * Returns metro status and station information
 */
router.get("/metro", (req, res) => {
  res.json(systemState.metro);
});

/**
 * GET /alerts
 * Returns active alerts (not acknowledged)
 */
router.get("/alerts", (req, res) => {
  res.json(getActiveAlerts());
});

/**
 * GET /metrics
 * Returns system metrics for dashboard
 */
router.get("/metrics", (req, res) => {
  res.json(metricsController.getMetrics());
});

/**
 * GET /recommendations
 * Returns AI-generated fleet optimization recommendations
 */
router.get("/recommendations", (req, res) => {
  const count = parseInt(req.query.count) || 5;
  res.json(getTopRecommendations(count));
});

/**
 * GET /predictions
 * Returns demand prediction summary
 */
router.get("/predictions", (req, res) => {
  res.json(getPredictionSummary());
});

/**
 * GET /fleet-distribution
 * Returns overview of fleet distribution across routes and depots
 */
router.get("/fleet-distribution", (req, res) => {
  res.json(fleetController.getFleetDistribution());
});

/**
 * GET /dashboard
 * Returns all data needed for dashboard in single response
 */
router.get("/dashboard", (req, res) => {
  res.json({
    buses: systemState.buses,
    routes: systemState.routes,
    demandZones: systemState.demandZones,
    metro: systemState.metro,
    alerts: getActiveAlerts(),
    metrics: metricsController.getDashboardMetrics(),
    recommendations: getTopRecommendations(3),
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// ACTION ENDPOINTS (POST)
// =============================================================================

/**
 * POST /deploy-bus
 * Deploy a bus from depot to route
 * Body: { depotId, routeId }
 */
router.post("/deploy-bus", (req, res) => {
  const { depotId, routeId } = req.body;
  
  // Validate request
  if (!depotId || !routeId) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: depotId, routeId"
    });
  }
  
  const result = fleetController.deployBus(depotId, routeId);
  res.json(result);
});

/**
 * POST /return-bus
 * Return a bus to depot
 * Body: { busId, depotId }
 */
router.post("/return-bus", (req, res) => {
  const { busId, depotId } = req.body;
  
  if (!busId || !depotId) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: busId, depotId"
    });
  }
  
  const result = fleetController.returnBusToDepot(busId, depotId);
  res.json(result);
});

/**
 * POST /change-frequency
 * Change route frequency
 * Body: { routeId, frequency }
 */
router.post("/change-frequency", (req, res) => {
  const { routeId, frequency } = req.body;
  
  if (!routeId || !frequency) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: routeId, frequency"
    });
  }
  
  const result = fleetController.changeRouteFrequency(routeId, frequency);
  res.json(result);
});

/**
 * POST /rebalance
 * Rebalance buses between routes
 * Body: { fromRouteId, toRouteId, count }
 */
router.post("/rebalance", (req, res) => {
  const { fromRouteId, toRouteId, count } = req.body;
  
  if (!fromRouteId || !toRouteId || !count) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: fromRouteId, toRouteId, count"
    });
  }
  
  const result = fleetController.rebalanceBuses(fromRouteId, toRouteId, count);
  res.json(result);
});

/**
 * POST /acknowledge-alert
 * Acknowledge an alert
 * Body: { alertId }
 */
router.post("/acknowledge-alert", (req, res) => {
  const { alertId } = req.body;
  
  if (!alertId) {
    return res.status(400).json({
      success: false,
      message: "Missing required field: alertId"
    });
  }
  
  acknowledgeAlert(alertId);
  res.json({ success: true, message: "Alert acknowledged" });
});

/**
 * POST /emergency-dispatch
 * Emergency bus deployment
 * Body: { routeId, count }
 */
router.post("/emergency-dispatch", (req, res) => {
  const { routeId, count } = req.body;
  
  if (!routeId || !count) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: routeId, count"
    });
  }
  
  const result = fleetController.emergencyDispatch(routeId, count);
  res.json(result);
});

// =============================================================================
// EXPORT ROUTER
// =============================================================================

module.exports = router;