/**
 * simulationRunner.js
 * 
 * Main simulation orchestrator.
 * 
 * Responsibilities:
 * - Initialize all simulation modules
 * - Initialize AI engines
 * - Initialize metrics updater
 * - Coordinate system startup
 * 
 * Called by server.js on application start.
 */

const systemState = require("../state/systemState");

// Import simulation modules
const startBusSimulation = require("./busSimulator");
const startDemandSimulation = require("./demandSimulator");
const startMetroSimulation = require("./metroSimulator");

// Import AI engines
const { startPredictionEngine } = require("../ai/predictionEngine");
const { startAlertEngine } = require("../ai/alertEngine");

// Import metrics updater
const { startMetricsUpdater } = require("../controllers/metricsController");

// =============================================================================
// MAIN STARTUP FUNCTION
// =============================================================================

/**
 * Start all simulations and AI engines
 * Called once when server starts
 */
function startSimulations() {
  console.log("========================================");
  console.log("  FLEET ORCHESTRATOR - Starting System");
  console.log("========================================");
  
  // Mark simulation as running
  systemState.simulation.started_at = new Date().toISOString();
  systemState.simulation.is_running = true;
  
  // Start simulation modules
  console.log("\n[SimulationRunner] Starting simulation modules...");
  startBusSimulation();
  startDemandSimulation();
  startMetroSimulation();
  
  // Start AI engines
  console.log("\n[SimulationRunner] Starting AI engines...");
  startPredictionEngine();
  startAlertEngine();
  
  // Start metrics calculation
  console.log("\n[SimulationRunner] Starting metrics updater...");
  startMetricsUpdater();
  
  console.log("\n========================================");
  console.log("  All systems initialized successfully");
  console.log("========================================\n");
}

module.exports = startSimulations;