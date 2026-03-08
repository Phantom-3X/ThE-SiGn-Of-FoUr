/**
 * server.js
 * 
 * Main entry point for the Fleet Orchestrator backend.
 * 
 * Responsibilities:
 * - Initialize Express server
 * - Configure middleware (CORS, JSON parsing)
 * - Mount API routes
 * - Start simulations
 */

const express = require("express");
const cors = require("cors");

// Import modules
const apiRoutes = require("./routes/apiRoutes");
const startSimulations = require("./simulation/simulationRunner");
const { API_PORT } = require("./config/constants");

// =============================================================================
// EXPRESS APP SETUP
// =============================================================================

const app = express();
const PORT = process.env.PORT || API_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// =============================================================================
// API ROUTES
// =============================================================================

// Mount all API routes under /api prefix (optional)
// Access: /api/routes, /api/buses, etc.
app.use("/api", apiRoutes);

// Also mount at root for backward compatibility
// Access: /routes, /buses, etc.
app.use("/", apiRoutes);

// =============================================================================
// HEALTH CHECK
// =============================================================================

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api\n`);
  
  // Start all simulations after server is ready
  startSimulations();
});