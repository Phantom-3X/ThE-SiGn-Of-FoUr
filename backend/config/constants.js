/**
 * constants.js
 * 
 * Central configuration constants for the Fleet Orchestrator system.
 * Contains threshold values, limits, and system-wide parameters.
 */

// =============================================================================
// BUS CONFIGURATION
// =============================================================================

const BUS_CAPACITY_MIN = 40;
const BUS_CAPACITY_MAX = 60;
const BUS_SPEED_KMH = 25; // Average bus speed in km/h
const OVERCROWDED_THRESHOLD = 0.85; // 85% capacity = overcrowded
const UNDERUTILIZED_THRESHOLD = 0.30; // 30% capacity = underutilized

// =============================================================================
// DEMAND CONFIGURATION
// =============================================================================

const DEMAND_MIN = 20;
const DEMAND_MAX = 120;
const DEMAND_SPIKE_THRESHOLD = 1.3; // 30% above current = spike
const RUSH_HOUR_MULTIPLIER = 1.8;

// =============================================================================
// METRO CONFIGURATION
// =============================================================================

const METRO_STATUS = {
  NORMAL: "normal",
  CROWDED: "crowded",
  DELAYED: "delayed"
};
const METRO_DELAY_IMPACT_THRESHOLD = 10; // Minutes delay that triggers bus demand increase

// =============================================================================
// ALERT TYPES
// =============================================================================

const ALERT_TYPES = {
  OVERCROWDED_BUS: "overcrowded_bus",
  OVERCROWDED_ROUTE: "overcrowded_route",
  UNDERUTILIZED_ROUTE: "underutilized_route",
  DEMAND_SPIKE: "demand_spike",
  METRO_DISRUPTION: "metro_disruption",
  FLEET_IMBALANCE: "fleet_imbalance"
};

// =============================================================================
// ALERT SEVERITY LEVELS
// =============================================================================

const SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
};

// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_PORT = 5000;
const CORS_ORIGIN = "*";

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  // Bus
  BUS_CAPACITY_MIN,
  BUS_CAPACITY_MAX,
  BUS_SPEED_KMH,
  OVERCROWDED_THRESHOLD,
  UNDERUTILIZED_THRESHOLD,

  // Demand
  DEMAND_MIN,
  DEMAND_MAX,
  DEMAND_SPIKE_THRESHOLD,
  RUSH_HOUR_MULTIPLIER,

  // Metro
  METRO_STATUS,
  METRO_DELAY_IMPACT_THRESHOLD,

  // Alerts
  ALERT_TYPES,
  SEVERITY,

  // API
  API_PORT,
  CORS_ORIGIN
};