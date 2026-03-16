/**
 * simulationRunner.js
 *
 * Main simulation orchestrator.
 * Starts all simulation modules, AI engines, and metrics updater.
 * Called by server.js on application start.
 */

const systemState = require("../state/systemState");

// Import simulation modules
const startBusSimulation    = require("./busSimulator");
const startDemandSimulation = require("./demandSimulator");
const startMetroSimulation  = require("./metroSimulator");
const startEventSimulation  = require("./eventSimulator");

// Phase 3 — Blockage simulator
const { startBlockageSimulator } = require("./blockageSimulator");

// Phase 4 — Rickshaw simulator
const { startRickshawSimulator } = require("./rickshawSimulator");

// Phase 7 — Surge simulator
const { startSurgeSimulator } = require("./surgeSimulator");

// Import AI engines
const { startPredictionEngine }        = require("../ai/predictionEngine");
const { startAlertEngine }             = require("../ai/alertEngine");
const { startRecommendationEngine }    = require("../ai/recommendationEngine");

// Phase 2 — Optimisation engine
const { startOptimisationEngine }      = require("../ai/optimisationEngine");

// Import metrics updater
const { startMetricsUpdater } = require("../controllers/metricsController");

// =============================================================================
// MAIN STARTUP FUNCTION
// =============================================================================

function startSimulations() {
  console.log("========================================");
  console.log("  FLEET ORCHESTRATOR - Starting System");
  console.log("========================================");

  // Mark simulation as running
  systemState.simulation.started_at = new Date().toISOString();
  systemState.simulation.is_running  = true;

  // Start core simulation modules
  console.log("\n[SimulationRunner] Starting simulation modules...");
  startBusSimulation();
  startDemandSimulation();
  startMetroSimulation();
  startEventSimulation();

  // Phase 3 — Blockage simulation
  startBlockageSimulator();

  // Phase 4 — Rickshaw simulation
  startRickshawSimulator();

  // Phase 7 — Surge simulation
  startSurgeSimulator();

  // Start AI engines
  console.log("\n[SimulationRunner] Starting AI engines...");
  startPredictionEngine();
  startAlertEngine();
  startRecommendationEngine();

  // Phase 2 — Multi-objective optimisation
  startOptimisationEngine();

  // Start metrics calculation
  console.log("\n[SimulationRunner] Starting metrics updater...");
  startMetricsUpdater();

  console.log("\n========================================");
  console.log("  All systems initialized successfully");
  console.log("========================================\n");
}

module.exports = startSimulations;