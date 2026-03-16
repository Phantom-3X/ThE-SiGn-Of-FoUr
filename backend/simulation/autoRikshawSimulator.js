const systemState = require("../state/systemState");
const { AUTO_RIKSHAW_UPDATE_INTERVAL } = require("../config/simulationConfig");
const { calculateDistance } = require("../utils/geoUtils");
const { randomInt } = require("../utils/randomGenerator");

const rikshawProgress = {};
const SPEED_KM_PER_TICK = 0.12;
const EVENT_SPEED_KM_PER_TICK = 0.16;
const EVENT_DISPATCH_RADIUS_KM = 3.0;
const EVENT_PICKUP_RADIUS_KM = 0.15;
const MAX_RIKSHAWS_PER_EVENT = 4;

function getRouteById(routeId) {
  return systemState.autoRikshawRoutes.find(r => r.route_id === routeId);
}

function nearestPathIndex(lat, lng, pathLayout) {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < pathLayout.length; i++) {
    const d = calculateDistance(lat, lng, pathLayout[i].lat, pathLayout[i].lng);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function getActiveEvents() {
  return (systemState.events || []).filter(e => e.active);
}

function clearEventMission(rikshaw) {
  if (!rikshaw.event_mission) return;

  const route = getRouteById(rikshaw.route_id);
  const pathLayout = route?.path && route.path.length > 1 ? route.path : route?.stops;
  const progress = rikshawProgress[rikshaw.rikshaw_id];

  if (progress && pathLayout && pathLayout.length > 1) {
    progress.pathIndex = nearestPathIndex(rikshaw.lat, rikshaw.lng, pathLayout);
    progress.atStop = false;
    progress.ticksAtStop = 0;
    progress.lastStopMatched = -1;
  }

  rikshaw.event_mission = null;
}

function ensureRikshawTelemetry(rikshaw) {
  if (rikshaw.completed_trips === undefined) rikshaw.completed_trips = 0;
  if (rikshaw.event_pickups === undefined) rikshaw.event_pickups = 0;
}

function assignEventMissions() {
  const activeEvents = getActiveEvents();

  // Clean up missions for events that are no longer active
  const activeEventIds = new Set(activeEvents.map(e => e.event_id));
  systemState.autoRikshaws.forEach(rikshaw => {
    if (rikshaw.event_mission && !activeEventIds.has(rikshaw.event_mission.event_id)) {
      clearEventMission(rikshaw);
    }
  });

  activeEvents.forEach(event => {
    const alreadyAssigned = systemState.autoRikshaws.filter(
      r => r.event_mission && r.event_mission.event_id === event.event_id
    ).length;

    const required = Math.min(
      MAX_RIKSHAWS_PER_EVENT,
      Math.max(1, Math.ceil((event.demand_multiplier || 1) * 2) - alreadyAssigned)
    );

    if (required <= 0) return;

    const candidates = systemState.autoRikshaws
      .filter(r => !r.event_mission)
      .filter(r => r.status !== "maintenance" && r.status !== "crowded")
      .map(r => ({ rikshaw: r, distance: calculateDistance(r.lat, r.lng, event.lat, event.lng) }))
      .filter(x => x.distance <= EVENT_DISPATCH_RADIUS_KM)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, required)
      .map(x => x.rikshaw);

    candidates.forEach(rikshaw => {
      ensureRikshawTelemetry(rikshaw);
      rikshaw.event_mission = {
        event_id: event.event_id,
        picked_up: false,
        assigned_at: Date.now()
      };
    });
  });
}

function moveTowardsTarget(rikshaw, targetLat, targetLng, speedKmPerTick) {
  const dist = calculateDistance(rikshaw.lat, rikshaw.lng, targetLat, targetLng);
  if (dist < 0.000001) return 0;

  if (dist <= speedKmPerTick) {
    rikshaw.lat = targetLat;
    rikshaw.lng = targetLng;
    return dist;
  }

  const fraction = speedKmPerTick / dist;
  rikshaw.lat = rikshaw.lat + (targetLat - rikshaw.lat) * fraction;
  rikshaw.lng = rikshaw.lng + (targetLng - rikshaw.lng) * fraction;
  return speedKmPerTick;
}

function handleEventMission(rikshaw) {
  if (!rikshaw.event_mission) return false;
  ensureRikshawTelemetry(rikshaw);

  const event = (systemState.events || []).find(
    e => e.active && e.event_id === rikshaw.event_mission.event_id
  );

  if (!event) {
    clearEventMission(rikshaw);
    return false;
  }

  const distanceToEvent = calculateDistance(rikshaw.lat, rikshaw.lng, event.lat, event.lng);
  moveTowardsTarget(rikshaw, event.lat, event.lng, EVENT_SPEED_KM_PER_TICK);

  if (distanceToEvent <= EVENT_PICKUP_RADIUS_KM && !rikshaw.event_mission.picked_up) {
    const available = rikshaw.capacity - rikshaw.current_load;
    const pickup = Math.min(randomInt(1, 3), available);
    rikshaw.current_load += pickup;
    rikshaw.event_pickups += pickup;
    rikshaw.event_mission.picked_up = true;

    // Reduce demand in the event zone as rikshaws evacuate crowd
    if (event.zone_id) {
      const zone = (systemState.demandZones || []).find(z => z.zone_id === event.zone_id);
      if (zone && pickup > 0) {
        zone.current_demand = Math.max(20, zone.current_demand - pickup);
      }
    }

    // Mission complete after pickup; return to route service next tick
    clearEventMission(rikshaw);
  }

  updateRikshawStatus(rikshaw);
  return true;
}

function updateRikshawStatus(rikshaw) {
  const loadFactor = rikshaw.current_load / rikshaw.capacity;
  if (loadFactor > 0.85) rikshaw.status = "crowded";
  else if (loadFactor < 0.34) rikshaw.status = "underutilized";
  else rikshaw.status = "active";
}

function simulatePickupDrop(rikshaw) {
  const drop = Math.min(randomInt(0, 2), rikshaw.current_load);
  rikshaw.current_load -= drop;
  const available = rikshaw.capacity - rikshaw.current_load;
  const pickup = Math.min(randomInt(0, 3), available);
  rikshaw.current_load += pickup;
  updateRikshawStatus(rikshaw);
}

function initializeRikshawProgress() {
  const byRoute = {};
  systemState.autoRikshaws.forEach(rikshaw => {
    ensureRikshawTelemetry(rikshaw);
    if (!byRoute[rikshaw.route_id]) byRoute[rikshaw.route_id] = [];
    byRoute[rikshaw.route_id].push(rikshaw);
  });

  Object.entries(byRoute).forEach(([routeId, rikshaws]) => {
    const route = getRouteById(routeId);
    const pathLayout = route?.path && route.path.length > 1 ? route.path : route?.stops;
    if (!pathLayout || pathLayout.length < 2) return;

    const pathCount = pathLayout.length;
    rikshaws.forEach((rikshaw, idx) => {
      const startIdx = Math.floor((idx / rikshaws.length) * pathCount) % pathCount;
      const point = pathLayout[startIdx];
      rikshaw.lat = point.lat;
      rikshaw.lng = point.lng;
      rikshawProgress[rikshaw.rikshaw_id] = {
        pathIndex: startIdx,
        atStop: false,
        ticksAtStop: 0,
        lastStopMatched: -1
      };
    });
  });
}

function updateRikshawPosition(rikshaw) {
  ensureRikshawTelemetry(rikshaw);
  const route = getRouteById(rikshaw.route_id);
  if (!route) return;

  const pathLayout = route.path && route.path.length > 1 ? route.path : route.stops;
  if (!pathLayout || pathLayout.length < 2) return;

  if (!rikshawProgress[rikshaw.rikshaw_id]) {
    rikshawProgress[rikshaw.rikshaw_id] = {
      pathIndex: 0,
      atStop: false,
      ticksAtStop: 0,
      lastStopMatched: -1
    };
  }

  const progress = rikshawProgress[rikshaw.rikshaw_id];

  if (progress.atStop) {
    progress.ticksAtStop++;
    if (progress.ticksAtStop >= 1) {
      progress.atStop = false;
      progress.ticksAtStop = 0;
    }
    return;
  }

  let distanceRemaining = SPEED_KM_PER_TICK;
  const MAX_ITERATIONS = pathLayout.length + 10;
  let iterations = 0;

  while (distanceRemaining > 0.00001 && iterations++ < MAX_ITERATIONS) {
    const curIdx = progress.pathIndex;

    if (curIdx >= pathLayout.length - 1) {
      rikshaw.lat = pathLayout[0].lat;
      rikshaw.lng = pathLayout[0].lng;
      rikshaw.completed_trips += 1;
      progress.pathIndex = 0;
      progress.lastStopMatched = -1;
      progress.atStop = false;
      break;
    }

    const nextIdx = curIdx + 1;
    const nextPoint = pathLayout[nextIdx];
    const distToNext = calculateDistance(rikshaw.lat, rikshaw.lng, nextPoint.lat, nextPoint.lng);

    if (distToNext < 0.000001) {
      progress.pathIndex = nextIdx;
      continue;
    }

    if (distToNext <= distanceRemaining) {
      rikshaw.lat = nextPoint.lat;
      rikshaw.lng = nextPoint.lng;
      progress.pathIndex = nextIdx;
      distanceRemaining -= distToNext;

      let reachedStopIndex = -1;
      for (let i = 0; i < route.stops.length; i++) {
        if (calculateDistance(nextPoint.lat, nextPoint.lng, route.stops[i].lat, route.stops[i].lng) < 0.08) {
          reachedStopIndex = i;
          break;
        }
      }

      if (reachedStopIndex !== -1 && reachedStopIndex !== progress.lastStopMatched) {
        progress.atStop = true;
        progress.ticksAtStop = 0;
        progress.lastStopMatched = reachedStopIndex;
        simulatePickupDrop(rikshaw);
        break;
      }
    } else {
      const fraction = distanceRemaining / distToNext;
      rikshaw.lat = rikshaw.lat + (nextPoint.lat - rikshaw.lat) * fraction;
      rikshaw.lng = rikshaw.lng + (nextPoint.lng - rikshaw.lng) * fraction;
      distanceRemaining = 0;
    }
  }

  if (!Number.isFinite(rikshaw.lat) || !Number.isFinite(rikshaw.lng)) {
    const resetPoint = pathLayout[0];
    rikshaw.lat = resetPoint.lat;
    rikshaw.lng = resetPoint.lng;
    progress.pathIndex = 0;
  }
}

function tickRikshaws() {
  assignEventMissions();

  systemState.autoRikshaws.forEach(rikshaw => {
    if (rikshaw.status !== "maintenance") {
      const missionHandled = handleEventMission(rikshaw);
      if (missionHandled) return;
      updateRikshawPosition(rikshaw);
    }
  });
}

function startAutoRikshawSimulation() {
  console.log("[AutoRikshawSimulator] Initializing auto-rikshaw simulation...");
  initializeRikshawProgress();

  setInterval(() => {
    tickRikshaws();
  }, AUTO_RIKSHAW_UPDATE_INTERVAL);

  console.log(`[AutoRikshawSimulator] ${systemState.autoRikshaws.length} rikshaws on ${systemState.autoRikshawRoutes.length} routes, updating every ${AUTO_RIKSHAW_UPDATE_INTERVAL}ms`);
}

module.exports = startAutoRikshawSimulation;
