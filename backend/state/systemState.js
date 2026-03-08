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
 * 
 * Structure:
 * - routes: Static route definitions
 * - buses: Dynamic bus positions and loads (mutated by busSimulator)
 * - depots: Depot status (mutated by fleetController)
 * - demandZones: Dynamic demand values (mutated by demandSimulator)
 * - metro: Metro status (mutated by metroSimulator)
 * - alerts: Generated alerts (mutated by alertEngine)
 * - metrics: Calculated metrics (mutated by metricsController)
 */

// =============================================================================
// IMPORT STATIC DATASETS
// =============================================================================

const routes = require("../data/routes");
const buses = require("../data/buses");
const depots = require("../data/depots");
const demandZones = require("../data/demandZones");
const metro = require("../data/metro");

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
    average_wait_time: 8,
    fleet_utilization: 70,
    passenger_throughput: 0,
    system_efficiency: 0,
    demand_coverage: 0,
    active_buses: buses.filter(b => b.status === "active").length,
    total_buses: buses.length,
    active_alerts: 0,
    last_updated: new Date().toISOString()
  },
  
  // Simulation metadata
  simulation: {
    started_at: null,
    tick_count: 0,
    is_running: false
  }
};

// =============================================================================
// EXPORT
// =============================================================================

module.exports = systemState;