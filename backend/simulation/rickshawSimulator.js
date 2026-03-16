/**
 * rickshawSimulator.js
 *
 * Phase 4 — Auto-Rickshaw / Shared Vehicle Layer
 *
 * Every 8 seconds:
 *  - Moves rickshaws within 500m (0.005 deg approx) of their hub via random walk.
 *  - Checks demand zones: if predicted_demand > 1.2 * base_demand AND nearest bus > 5 min away,
 *    auto-assigns nearest available rickshaw and marks it "busy".
 */

const systemState = require("../state/systemState");

const RICKSHAW_UPDATE_INTERVAL = 8000;
const WALK_DELTA = 0.004; // ~450m in degrees
let assignmentCounter = 0;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getHubCenter(hub) {
  const HUB_COORDS = {
    swargate:     { lat: 18.5018, lng: 73.8636 },
    shivajinagar: { lat: 18.5308, lng: 73.8475 },
    deccan:       { lat: 18.5167, lng: 73.8411 },
    hinjewadi:    { lat: 18.5912, lng: 73.7389 },
    kharadi:      { lat: 18.5362, lng: 73.9139 },
    vimanNagar:   { lat: 18.5679, lng: 73.9143 }
  };
  return HUB_COORDS[hub] || { lat: 18.5167, lng: 73.8411 };
}

function randomWalk(rickshaw) {
  if (rickshaw.status === "offline") return;

  const hub = getHubCenter(rickshaw.hub);
  const delta = WALK_DELTA;

  // Random small step
  let newLat = rickshaw.lat + (Math.random() - 0.5) * 0.002;
  let newLng = rickshaw.lng + (Math.random() - 0.5) * 0.002;

  // Clamp to within ~500m of hub
  const distLat = Math.abs(newLat - hub.lat);
  const distLng = Math.abs(newLng - hub.lng);
  if (distLat > delta) newLat = hub.lat + Math.sign(newLat - hub.lat) * delta;
  if (distLng > delta) newLng = hub.lng + Math.sign(newLng - hub.lng) * delta;

  rickshaw.lat = Math.round(newLat * 100000) / 100000;
  rickshaw.lng = Math.round(newLng * 100000) / 100000;
}

function nearestBusWaitMinutes(zone) {
  let minDist = Infinity;
  systemState.buses.forEach(bus => {
    const d = haversineKm(zone.lat, zone.lng, bus.lat, bus.lng);
    if (d < minDist) minDist = d;
  });
  // 25 km/h average bus speed → minutes = dist/km ÷ (25/60)
  return (minDist / 25) * 60;
}

function tryAutoAssignRickshaws() {
  systemState.demandZones.forEach(zone => {
    const baseDemand = zone.base_demand || zone.current_demand;
    if (!zone.predicted_demand || zone.predicted_demand <= baseDemand * 1.2) return;

    // Check if nearest bus is more than 5 min away
    const busWait = nearestBusWaitMinutes(zone);
    if (busWait <= 5) return;

    // Check if already assigned
    const alreadyAssigned = systemState.rickshawAssignments.some(
      a => a.zone_id === zone.zone_id && a.active
    );
    if (alreadyAssigned) return;

    // Find nearest available rickshaw
    let nearestRickshaw = null;
    let nearestDist = Infinity;
    systemState.rickshaws.forEach(rk => {
      if (rk.status !== "available") return;
      const d = haversineKm(zone.lat, zone.lng, rk.lat, rk.lng);
      if (d < nearestDist) {
        nearestDist = d;
        nearestRickshaw = rk;
      }
    });

    if (!nearestRickshaw) return;

    // Assign
    nearestRickshaw.status = "busy";
    assignmentCounter++;
    const assignment = {
      assignment_id: `RKASN${String(assignmentCounter).padStart(4, "0")}`,
      rickshaw_id: nearestRickshaw.id,
      hub_name: nearestRickshaw.hub_name,
      zone_id: zone.zone_id,
      zone_name: zone.name,
      assigned_at: new Date().toISOString(),
      response_time_min: Math.round((nearestDist / 15) * 60 * 10) / 10, // 15 km/h rickshaw
      active: true
    };

    systemState.rickshawAssignments.push(assignment);

    console.log(`[RickshawSimulator] ${nearestRickshaw.id} auto-assigned to ${zone.name} (demand surge, bus ${Math.round(busWait)}min away)`);

    // Auto-free the rickshaw after 15 minutes
    setTimeout(() => {
      nearestRickshaw.status = "available";
      assignment.active = false;
      console.log(`[RickshawSimulator] ${nearestRickshaw.id} returned to available`);
    }, 15 * 60 * 1000);
  });
}

function getLast_mileGaps() {
  const COVERAGE_RADIUS_KM = 0.5;
  const gaps = [];

  systemState.demandZones.forEach(zone => {
    // Check bus coverage
    let nearestBusDist = Infinity;
    systemState.buses.forEach(bus => {
      const d = haversineKm(zone.lat, zone.lng, bus.lat, bus.lng);
      if (d < nearestBusDist) nearestBusDist = d;
    });

    // Check metro coverage
    let nearestMetroDist = Infinity;
    if (systemState.metro && systemState.metro.stations) {
      systemState.metro.stations.forEach(st => {
        const d = haversineKm(zone.lat, zone.lng, st.lat, st.lng);
        if (d < nearestMetroDist) nearestMetroDist = d;
      });
    }

    const bestPublicTransport = Math.min(nearestBusDist, nearestMetroDist);

    if (bestPublicTransport > COVERAGE_RADIUS_KM) {
      gaps.push({
        zone_id: zone.zone_id,
        zone_name: zone.name,
        lat: zone.lat,
        lng: zone.lng,
        nearest_bus_km: Math.round(nearestBusDist * 1000) / 1000,
        nearest_metro_km: Math.round(nearestMetroDist * 1000) / 1000,
        gap_km: Math.round(bestPublicTransport * 1000) / 1000,
        current_demand: zone.current_demand
      });
    }
  });

  return gaps.sort((a, b) => b.gap_km - a.gap_km);
}

function startRickshawSimulator() {
  console.log("[RickshawSimulator] Initializing auto-rickshaw simulation...");
  setInterval(() => {
    systemState.rickshaws.forEach(rk => randomWalk(rk));
    tryAutoAssignRickshaws();
  }, RICKSHAW_UPDATE_INTERVAL);
  console.log(`[RickshawSimulator] Running every ${RICKSHAW_UPDATE_INTERVAL}ms`);
}

module.exports = {
  startRickshawSimulator,
  getLast_mileGaps
};
