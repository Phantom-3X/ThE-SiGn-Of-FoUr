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
const autoRikshawRoutes = require("../data/autoRikshawRoutes");
const autoRikshaws = require("../data/autoRikshaws");
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

  // Auto-rikshaw routes and live fleet
  autoRikshawRoutes: autoRikshawRoutes,
  autoRikshaws: autoRikshaws,
  
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
    active_auto_rikshaws: autoRikshaws.filter(r => r.status !== "maintenance").length,
    total_auto_rikshaws: autoRikshaws.length,
    active_alerts: 0,
    total_distance_km: 0,
    empty_distance_km: 0,
    total_fuel_consumed: 0,
    last_updated: new Date().toISOString()
  },
  
  // Weights for Multi-Objective Optimization (can be adjusted by operators)
  optimization_weights: {
    wait_time: 33,     // Priority on passenger wait time
    fuel_efficiency: 33, // Priority on minimizing fuel
    empty_km: 34       // Priority on minimizing empty running
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