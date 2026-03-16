/**
 * systemState.js
 *
 * Central runtime state object for the Fleet Orchestrator.
 *
 * This module combines all static datasets and provides
 * mutable runtime storage for dynamic simulation data.
 *
 * All simulation and AI modules import this state object
 * to read and write system data.
 */

// =============================================================================
// IMPORT STATIC DATASETS
// =============================================================================

const routes = require("../data/routes");
const buses = require("../data/buses");
const depots = require("../data/depots");
const demandZones = require("../data/demandZones");
const metro = require("../data/metro");
const autoRickshaws = require("../data/autoRickshaws");

// Initialize demand velocity and delta
demandZones.forEach(zone => {
  zone.demandVelocity = 0;
  zone.demandDelta = 0;
});

// =============================================================================
// SYSTEM STATE OBJECT
// =============================================================================

const systemState = {
  // Static transport network (reference data)
  routes: routes,

  // Dynamic bus fleet (positions updated by simulation)
  buses: buses,

  // Depot status (idle buses updated by fleet operations)
  depots: depots,

  // Demand zones (demand values updated by simulation)
  demandZones: demandZones,

  // Metro system (status updated by simulation)
  metro: metro,

  // City events (populated by eventSimulator)
  events: [],

  // Generated alerts (populated by alertEngine)
  alerts: [],

  // AI recommendations (populated by recommendationEngine)
  recommendations: [],

  // System metrics (calculated by metricsController)
  metrics: {
    fleet_utilization: 0,
    passenger_throughput: 0,
    average_wait_time: 0,
    system_efficiency: 0,
    demand_fulfillment: 0,
    route_balance: 0,
    active_buses: buses.filter(b => b.status === "active").length,
    total_buses: buses.length,
    active_alerts: 0,
    // Phase 6: wait time reduction tracking
    baselineWaitTime: null,
    waitTimeReduction: 0,
    targetReduction: 25,
    last_updated: new Date().toISOString()
  },

  // Simulation metadata
  simulation: {
    started_at: null,
    tick_count: 0,
    is_running: false
  },

  // ─── Phase 1: Auto-Dispatch ───────────────────────────────────────────────
  rebalancingConfig: {
    autoDispatchEnabled: true,
    urgencyThreshold: 0.6,      // 0.0 to 1.0 — triggers auto-dispatch above this
    maxDispatchPerMinute: 3,
    loadWeight: 0.6,            // weight of load factor in urgency score
    velocityWeight: 0.4         // weight of demand velocity in urgency score
  },
  autoDispatchEnabled: true,
  autoDispatchLog: [],  // { timestamp, route_id, bus_id, trigger, urgencyScore, loadFactor, demandVelocity, busesDeployed }

  // ─── Phase 2: Multi-Objective Optimisation ───────────────────────────────
  optimisationWeights: { w1: 0.5, w2: 0.3, w3: 0.2 },
  optimisationScores: {
    waitScore: 0,
    fuelScore: 0,
    emptyKmScore: 0,
    combinedScore: 0,
    bindingConstraint: "waitTime",
    lastUpdated: null
  },

  // ─── Phase 3: Route Blockages ─────────────────────────────────────────────
  blockages: [],  // { blockage_id, route_id, blocked_stop_index, reason, start_time, estimated_clear_time, active }

  // ─── Phase 4: Auto-Rickshaws ──────────────────────────────────────────────
  rickshaws: autoRickshaws,
  rickshawAssignments: [], // { assignment_id, rickshaw_id, zone_id, zone_name, assigned_at, response_time_min }

  // ─── Phase 5: Prediction Accuracy ────────────────────────────────────────
  predictionAccuracy: {},  // { [zone_id]: [{ predicted, actual, ape, timestamp }], ... }

  // ─── Phase 7: Surge Simulation ───────────────────────────────────────────
  surgeReports: [],         // completed SurgeReport objects
  activeSurge: null         // { zone_id, surge_start, peak_demand, multiplier, decay_start, buses_deployed, max_wait_time, surge_resolved }
};

// =============================================================================
// EXPORT
// =============================================================================

module.exports = systemState;