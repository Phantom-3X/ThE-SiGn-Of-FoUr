/**
 * blockageSimulator.js
 *
 * Phase 3 — Route Blockage Edge Case
 *
 * Every 2–4 minutes randomly creates a blockage on a route stop.
 * Buses beyond the blocked stop skip it; alert engine fires "route_blocked" critical alert.
 * Blockages auto-clear after estimated_clear_time; operator can also POST /clear-blockage.
 */

const systemState = require("../state/systemState");
const { createAlert } = require("../ai/alertEngine");

let blockageCounter = 0;

const BLOCKAGE_CHECK_INTERVAL = 30000; // check every 30s, fire with probability
const REASONS = ["accident", "construction"];

function generateBlockageId() {
  blockageCounter++;
  return `BLK${String(blockageCounter).padStart(4, "0")}`;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function createBlockage() {
  // Clear any routes that already have an active blockage
  const blockedRouteIds = new Set(
    systemState.blockages.filter(b => b.active).map(b => b.route_id)
  );

  const eligibleRoutes = systemState.routes.filter(r => !blockedRouteIds.has(r.route_id));
  if (eligibleRoutes.length === 0) return;

  const route = eligibleRoutes[Math.floor(Math.random() * eligibleRoutes.length)];
  // Choose a stop index (not first, not last)
  if (route.stops.length < 3) return;
  const stopIndex = Math.floor(Math.random() * (route.stops.length - 2)) + 1;

  const reason = REASONS[Math.floor(Math.random() * REASONS.length)];
  const durationMin = 10 + Math.floor(Math.random() * 20); // 10–30 min
  const now = new Date();
  const clearTime = new Date(now.getTime() + durationMin * 60000);

  const blockage = {
    blockage_id: generateBlockageId(),
    route_id: route.route_id,
    route_name: route.name,
    blocked_stop_index: stopIndex,
    blocked_stop: route.stops[stopIndex],
    reason,
    start_time: now.toISOString(),
    estimated_clear_time: clearTime.toISOString(),
    active: true
  };

  systemState.blockages.push(blockage);

  // Apply latency penalty to buses on that route beyond the blocked stop
  systemState.buses.forEach(bus => {
    if (bus.route_id === route.route_id) {
      bus.latency_penalty_min = (bus.latency_penalty_min || 0) + 3;
    }
  });

  // Fire critical alert
  const alert = createAlert(
    "route_blocked",
    "critical",
    `Route ${route.name} blocked at stop ${stopIndex} due to ${reason}. Est. clear: ${clearTime.toLocaleTimeString()}`,
    {
      blockage_id: blockage.blockage_id,
      route_id: route.route_id,
      stop_index: stopIndex,
      reason,
      estimated_clear_time: clearTime.toISOString()
    }
  );
  systemState.alerts.push(alert);

  console.log(`[BlockageSimulator] Blockage ${blockage.blockage_id} created on ${route.name} at stop ${stopIndex} (${reason})`);
}

function clearExpiredBlockages() {
  const now = Date.now();
  systemState.blockages.forEach(blockage => {
    if (blockage.active && new Date(blockage.estimated_clear_time).getTime() <= now) {
      clearBlockage(blockage.blockage_id);
    }
  });
}

function clearBlockage(blockageId) {
  const blockage = systemState.blockages.find(b => b.blockage_id === blockageId);
  if (!blockage || !blockage.active) {
    return { success: false, message: `Blockage ${blockageId} not found or already cleared` };
  }

  blockage.active = false;
  blockage.cleared_at = new Date().toISOString();

  // Remove latency penalty from buses on that route
  systemState.buses.forEach(bus => {
    if (bus.route_id === blockage.route_id && bus.latency_penalty_min) {
      bus.latency_penalty_min = Math.max(0, bus.latency_penalty_min - 3);
    }
  });

  console.log(`[BlockageSimulator] Blockage ${blockageId} cleared on ${blockage.route_name}`);

  return {
    success: true,
    message: `Blockage ${blockageId} on ${blockage.route_name} has been cleared`
  };
}

function getActiveBlockages() {
  return systemState.blockages.filter(b => b.active);
}

function startBlockageSimulator() {
  console.log("[BlockageSimulator] Initializing blockage simulator...");

  // Initial check delay — first blockage fires after 2–4 minutes
  const initialDelay = (2 + Math.random() * 2) * 60000;
  setTimeout(() => {
    createBlockage();
    // After first blockage, check every 30s with probability
    setInterval(() => {
      clearExpiredBlockages();
      // ~30% chance of a new blockage per 30s interval ≈ ~1 per 2–4 min
      if (Math.random() < 0.08) {
        createBlockage();
      }
    }, BLOCKAGE_CHECK_INTERVAL);
  }, initialDelay);

  console.log(`[BlockageSimulator] First blockage in ~${Math.round(initialDelay / 60000)} min`);
}

module.exports = {
  startBlockageSimulator,
  clearBlockage,
  getActiveBlockages,
  createBlockage
};
