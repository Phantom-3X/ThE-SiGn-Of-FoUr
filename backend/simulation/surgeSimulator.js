/**
 * surgeSimulator.js
 *
 * Phase 7 — Surge Victory Condition
 *
 * "End-of-concert surge" scenario:
 *  - Triggered manually (POST /trigger-surge) or auto when a concert event ends.
 *  - Multiplies zone demand by 3.0 for 10 minutes, then decays linearly to 1.0 over 5 minutes.
 *  - auto-dispatch loop responds by deploying available buses.
 *  - surge_resolved = true when avg wait in zone drops below 10 min.
 *  - Logs a SurgeReport on resolution.
 */

const systemState = require("../state/systemState");

const SURGE_MULTIPLIER = 3.0;
const SURGE_DURATION_MS = 10 * 60 * 1000;   // 10 minutes at peak
const DECAY_DURATION_MS = 5  * 60 * 1000;   // 5 minutes decay to 1.0
const CHECK_INTERVAL_MS = 5000;              // resolution check every 5s

let surgeInterval = null;
let surgeReportCounter = 0;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getZoneAvgWaitMin(zone) {
  // Wait time proxy: nearest bus frequency / 2 + distance / bus speed
  let nearestBusDist = Infinity;
  let nearestRouteFreq = 10;
  systemState.buses.forEach(bus => {
    const d = haversineKm(zone.lat, zone.lng, bus.lat, bus.lng);
    if (d < nearestBusDist) {
      nearestBusDist = d;
      const route = systemState.routes.find(r => r.route_id === bus.route_id);
      if (route) nearestRouteFreq = route.frequency;
    }
  });
  const travelMin = (nearestBusDist / 25) * 60;
  return nearestRouteFreq / 2 + travelMin;
}

function triggerSurge(zoneId) {
  if (systemState.activeSurge) {
    return { success: false, message: "A surge is already active. Wait for it to resolve." };
  }

  const zone = systemState.demandZones.find(z => z.zone_id === zoneId);
  if (!zone) {
    return { success: false, message: `Zone ${zoneId} not found` };
  }

  const baseDemand = zone.base_demand || zone.current_demand;
  const surgeStart = Date.now();
  const decayStart = surgeStart + SURGE_DURATION_MS;
  const surgeEnd = decayStart + DECAY_DURATION_MS;

  systemState.activeSurge = {
    zone_id: zoneId,
    zone_name: zone.name,
    surge_start: new Date(surgeStart).toISOString(),
    decay_start: new Date(decayStart).toISOString(),
    surge_end_est: new Date(surgeEnd).toISOString(),
    peak_demand: Math.round(baseDemand * SURGE_MULTIPLIER),
    base_demand: baseDemand,
    buses_deployed: 0,
    max_wait_time: 0,
    surge_resolved: false,
    multiplier: SURGE_MULTIPLIER
  };

  // Immediately spike demand
  zone.current_demand = Math.round(baseDemand * SURGE_MULTIPLIER);
  zone.surge_active = true;

  console.log(`[SurgeSimulator] 🚨 SURGE TRIGGERED on ${zone.name}: demand ${baseDemand} → ${zone.current_demand}`);

  // Decay and resolution check loop
  if (surgeInterval) clearInterval(surgeInterval);
  surgeInterval = setInterval(() => {
    tickSurge(zone, baseDemand, surgeStart, decayStart, surgeEnd);
  }, CHECK_INTERVAL_MS);

  return {
    success: true,
    message: `Surge triggered on ${zone.name}. Peak demand: ${zone.current_demand}. Decays after 10 min.`,
    activeSurge: systemState.activeSurge
  };
}

function tickSurge(zone, baseDemand, surgeStart, decayStart, surgeEnd) {
  const now = Date.now();
  const surge = systemState.activeSurge;
  if (!surge) { clearInterval(surgeInterval); return; }

  // Update wait time tracking
  const currentWait = getZoneAvgWaitMin(zone);
  if (currentWait > surge.max_wait_time) surge.max_wait_time = currentWait;

  if (now < decayStart) {
    // Peak phase — demand stays at 3x
    zone.current_demand = Math.round(baseDemand * SURGE_MULTIPLIER);
  } else if (now < surgeEnd) {
    // Decay phase — linear decay from 3x → 1x over DECAY_DURATION_MS
    const progress = (now - decayStart) / DECAY_DURATION_MS;
    const currentMultiplier = SURGE_MULTIPLIER - (SURGE_MULTIPLIER - 1.0) * progress;
    zone.current_demand = Math.round(baseDemand * currentMultiplier);
  } else {
    // Surge over — restore demand
    zone.current_demand = baseDemand;
    zone.surge_active = false;

    // Resolution check
    const waitTime = getZoneAvgWaitMin(zone);
    surge.surge_resolved = waitTime < 10;

    resolveSurge(zone, surge);
    return;
  }

  // Early resolution: if during surge, wait time < 10 min (due to dispatched buses)
  if (currentWait < 10 && now > (surgeStart + 60000)) { // at least 1 min into surge
    zone.current_demand = baseDemand;
    zone.surge_active = false;
    surge.surge_resolved = true;
    resolveSurge(zone, surge);
  }
}

function resolveSurge(zone, surge) {
  clearInterval(surgeInterval);
  surgeInterval = null;

  surgeReportCounter++;
  const report = {
    report_id: `SR${String(surgeReportCounter).padStart(4, "0")}`,
    zone_id: surge.zone_id,
    zone_name: surge.zone_name,
    surge_start: surge.surge_start,
    surge_end: new Date().toISOString(),
    peak_demand: surge.peak_demand,
    buses_deployed: surge.buses_deployed,
    max_wait_time: Math.round(surge.max_wait_time * 10) / 10,
    resolved_within_10_min: surge.surge_resolved,
    victory: surge.surge_resolved
  };

  systemState.surgeReports.push(report);
  systemState.activeSurge = null;

  console.log(`[SurgeSimulator] Surge resolved on ${zone.name}. Victory: ${report.victory}. Max wait: ${report.max_wait_time} min.`);
}

// Auto-fires when a concert event becomes inactive
function checkConcertEventEnd() {
  if (systemState.activeSurge) return;
  const endedConcert = systemState.events.find(
    e => e.type === "concert" && !e.active && !e.surge_triggered
  );
  if (endedConcert) {
    endedConcert.surge_triggered = true;
    const zone = systemState.demandZones.find(z => z.zone_id === endedConcert.zone_id);
    if (zone) {
      triggerSurge(zone.zone_id);
    }
  }
}

function startSurgeSimulator() {
  console.log("[SurgeSimulator] Initializing surge simulator...");
  setInterval(checkConcertEventEnd, 15000);
  console.log("[SurgeSimulator] Concert event watcher active");
}

module.exports = {
  startSurgeSimulator,
  triggerSurge,
};
